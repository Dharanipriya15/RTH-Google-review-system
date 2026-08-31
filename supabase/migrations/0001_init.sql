-- Raade's Tea House Review System — initial schema
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.feedback_outcome as enum ('thank_you', 'redirect_to_google');
create type public.feedback_status as enum ('new', 'contacted', 'resolved');
create type public.notification_state as enum ('pending', 'sent', 'failed');

-- ---------------------------------------------------------------------------
-- Businesses (configuration — one row per location)
-- ---------------------------------------------------------------------------
create table public.businesses (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique
                        check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  google_review_url   text
                        check (google_review_url is null or google_review_url ~ '^https://'),
  owner_email         text not null,
  -- Minimum star rating routed to Google. Constrained to 4–5 so 1–3 star
  -- ratings are never sent to Google; they always get the private feedback form.
  positive_rating_min smallint not null default 4
                        check (positive_rating_min between 4 and 5),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Admin users (maps a Supabase Auth user to a business for the dashboard)
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  business_id  uuid not null references public.businesses(id) on delete cascade,
  role         text not null default 'admin' check (role in ('owner', 'admin')),
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Feedback (every submission, all ratings)
-- ---------------------------------------------------------------------------
create table public.feedback (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  rating         smallint not null check (rating between 1 and 5),
  message        text check (message is null or char_length(message) <= 2000),
  customer_name  text check (customer_name is null or char_length(customer_name) <= 120),
  customer_phone text check (customer_phone is null or char_length(customer_phone) <= 32),
  outcome        public.feedback_outcome not null,
  status         public.feedback_status not null default 'new',
  -- Anti-duplicate: sha256(business | phone | rating | message | 10-min bucket)
  dedupe_hash    text not null,
  -- Salted hash of the client IP; the raw IP is never stored.
  ip_hash        text,
  user_agent     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index feedback_dedupe_uidx        on public.feedback (dedupe_hash);
create index        feedback_business_created_idx on public.feedback (business_id, created_at desc);
create index        feedback_business_status_idx  on public.feedback (business_id, status);
create index        feedback_business_rating_idx  on public.feedback (business_id, rating);

-- ---------------------------------------------------------------------------
-- Notification logs (owner email alerts for low ratings)
-- ---------------------------------------------------------------------------
create table public.notification_logs (
  id                  uuid primary key default gen_random_uuid(),
  feedback_id         uuid not null references public.feedback(id) on delete cascade,
  channel             text not null default 'email',
  provider            text not null default 'resend',
  state               public.notification_state not null default 'pending',
  provider_message_id text,
  error_message       text check (error_message is null or char_length(error_message) <= 2000),
  attempted_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index notification_logs_feedback_idx on public.notification_logs (feedback_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger businesses_set_updated_at         before update on public.businesses         for each row execute procedure public.set_updated_at();
create trigger admin_users_set_updated_at        before update on public.admin_users        for each row execute procedure public.set_updated_at();
create trigger feedback_set_updated_at           before update on public.feedback           for each row execute procedure public.set_updated_at();
create trigger notification_logs_set_updated_at  before update on public.notification_logs  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- RLS is enabled on every table and NO policy is granted to the `anon` role.
-- With RLS on and no matching policy, the public anon key cannot read or write
-- these tables at all. Every public write happens in a server route handler
-- using the service-role key, which bypasses RLS.
--
-- Authenticated admins (rows in admin_users) get scoped read access plus the
-- ability to triage feedback status.
-- ---------------------------------------------------------------------------
alter table public.businesses        enable row level security;
alter table public.admin_users       enable row level security;
alter table public.feedback          enable row level security;
alter table public.notification_logs enable row level security;

create or replace function public.is_business_admin(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid() and business_id = target_business_id
  );
$$;
revoke all on function public.is_business_admin(uuid) from public;
grant execute on function public.is_business_admin(uuid) to authenticated;

create policy "Admins read own profile"
  on public.admin_users for select to authenticated
  using (user_id = auth.uid());

create policy "Admins read their business"
  on public.businesses for select to authenticated
  using (public.is_business_admin(id));

create policy "Admins update their business"
  on public.businesses for update to authenticated
  using (public.is_business_admin(id))
  with check (public.is_business_admin(id));

create policy "Admins read their feedback"
  on public.feedback for select to authenticated
  using (public.is_business_admin(business_id));

create policy "Admins triage their feedback"
  on public.feedback for update to authenticated
  using (public.is_business_admin(business_id))
  with check (public.is_business_admin(business_id));

create policy "Admins read their notification logs"
  on public.notification_logs for select to authenticated
  using (exists (
    select 1 from public.feedback f
    where f.id = feedback_id and public.is_business_admin(f.business_id)
  ));

-- ---------------------------------------------------------------------------
-- Aggregated stats for the admin dashboard.
-- `security_invoker` makes the view honour the caller's RLS on public.feedback.
-- ---------------------------------------------------------------------------
create view public.feedback_stats
  with (security_invoker = true) as
select
  business_id,
  count(*)::int                                              as total,
  coalesce(round(avg(rating)::numeric, 2), 0)                as average_rating,
  count(*) filter (where rating <= 3)::int                   as low_rating_count,
  count(*) filter (where outcome = 'redirect_to_google')::int as google_redirect_count
from public.feedback
group by business_id;

grant select on public.feedback_stats to authenticated;
