-- Enforce: 1–3 star ratings NEVER route to Google; only 4–5 may.
-- Safe to run on a database created from the original 0001_init.sql
-- (which shipped with a default of 3 and a 2–5 check).

alter table public.businesses
  alter column positive_rating_min set default 4;

update public.businesses
  set positive_rating_min = 4
  where positive_rating_min < 4;

alter table public.businesses
  drop constraint if exists businesses_positive_rating_min_check;

alter table public.businesses
  add constraint businesses_positive_rating_min_check
  check (positive_rating_min between 4 and 5);

-- "Low rating" now means 1–3 stars (all of which get the private flow + email).
create or replace view public.feedback_stats
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
