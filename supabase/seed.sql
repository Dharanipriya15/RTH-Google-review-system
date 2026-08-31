-- Seed data. Run with:  supabase db reset   (applies migrations + this seed)
-- Confirm google_review_url + owner_email before a production deploy.

insert into public.businesses (name, slug, google_review_url, owner_email, positive_rating_min)
values (
  'Raade''s Tea House',
  'raades-tea-house',
  -- Opens the Google review dialog directly for this Google Business listing.
  'https://www.google.com/maps/place//data=!4m3!3m2!1s0x6ad68fb0ceda06fd:0xe993ee4dc2841de9!12e1',
  'aramfoodsau@gmail.com',
  4  -- 4–5 stars go to Google; 1–3 stars get the private feedback form
)
on conflict (slug) do nothing;

-- After creating an admin via Supabase Auth, link them to the business:
--   insert into public.admin_users (user_id, business_id, role, display_name)
--   select '<AUTH_USER_UUID>', id, 'owner', 'Owner'
--   from public.businesses where slug = 'raades-tea-house';
