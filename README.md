# Raade's Tea House Review System

A production-ready customer feedback flow with rating-based routing:

- **1–3 stars** → feedback is saved to Supabase and the owner gets an email alert (Resend). The customer sees a polite private thank-you. Never sent to Google.
- **4–5 stars** → feedback is saved to Supabase and the customer is sent to the business's Google review page. No email.

The routing threshold is `GOOGLE_REVIEW_MIN_RATING = 4`, enforced in three places: the DB `businesses.positive_rating_min` column (constrained to 4–5), the server (`decideOutcome`), and the client (`feedback-experience.tsx` ignores any redirect for a rating below 4).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase (Postgres + Auth + Row Level Security)
- Resend for server-side email
- Tailwind CSS v4

## How it works

```
Customer → /review/raades-tea-house  (rating + optional name / phone / message)
         → POST /api/feedback         (the only trust boundary)
             1. same-origin + rate-limit + honeypot checks
             2. Zod validation (server-side, authoritative)
             3. save to Supabase via the service-role key
             4. rating <= 3  → send owner email (Resend), log to notification_logs
                rating >= 4  → return the Google review URL
         → thank-you screen  OR  redirect to Google
```

Everything that touches a secret (service-role key, Resend key) runs only in
server code. Client components never import those modules — `import "server-only"`
enforces it at build time.

### Key files

| Path | Purpose |
| --- | --- |
| `src/app/review/[slug]/page.tsx` | Public feedback page (Server Component) |
| `src/components/feedback/*` | Rating picker, form, thank-you / redirect states |
| `src/app/api/feedback/route.ts` | Feedback endpoint: validation, rate-limit, honeypot |
| `src/lib/feedback/service.ts` | Save → decide outcome → email branch |
| `src/lib/feedback/schema.ts` | Zod request schema |
| `src/lib/feedback/dedupe.ts` | Duplicate-submission hash + IP hashing |
| `src/lib/rate-limit.ts` | In-memory sliding-window limiter (swap for Redis/Supabase later) |
| `src/lib/email/*` | Resend client + low-rating email template |
| `src/lib/supabase/admin.ts` | Service-role client (server-only) |
| `src/app/admin/*` | Supabase-Auth-protected dashboard to view feedback |
| `supabase/migrations/0001_init.sql` | Full schema + RLS |

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values (see below).
3. Apply the database schema:
   - Supabase CLI: `supabase db push` (or `supabase db reset` to also run `seed.sql`)
   - or paste `supabase/migrations/0001_init.sql` into the Supabase SQL editor.
4. Edit the `businesses` row (`supabase/seed.sql` has a starter insert) with the
   real Google review URL and owner email.
5. `npm run dev` → open `http://localhost:3000/review/raades-tea-house`.

### Admin dashboard

1. Enable magic-link auth in Supabase.
2. Sign in once at `/admin/sign-in` to create the Auth user.
3. Link that user to the business:
   ```sql
   insert into public.admin_users (user_id, business_id, role, display_name)
   select '<AUTH_USER_UUID>', id, 'owner', 'Owner'
   from public.businesses where slug = 'raades-tea-house';
   ```
4. Open `/admin`.

## Environment variables

See `.env.example` for the full list with descriptions.

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical URL for auth redirects |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Anon key is safe; RLS denies all anon access |
| `NEXT_PUBLIC_GOOGLE_REVIEW_URL` | public | Fallback only; the `businesses` row is authoritative |
| `SUPABASE_SERVICE_ROLE_KEY` | **server** | Bypasses RLS; used only in route handlers |
| `RESEND_API_KEY` | **server** | Email sending |
| `RESEND_FROM_EMAIL` | **server** | Must be on a Resend-verified domain |
| `OWNER_NOTIFICATION_EMAIL` | **server** | Optional; defaults to `businesses.owner_email` |
| `FEEDBACK_IP_HASH_SALT` | **server** | Salts the stored IP hash; raw IPs are never stored |
| `RATE_LIMIT_MAX_PER_WINDOW` / `RATE_LIMIT_WINDOW_SECONDS` | **server** | Per-IP limit for the feedback endpoint |

## Security

- **RLS default-deny.** Every table has RLS enabled with **no anon policy**, so the
  public anon key cannot read or write feedback. All writes go through the server
  route handler using the service-role key.
- **Secrets stay server-side.** `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY`
  are only read in `server-only` modules.
- **Server-side validation.** Zod validates rating (int 1–5), message (≤ 2000),
  name (≤ 120), and phone format. Unknown fields are stripped.
- **Duplicate prevention.** A `sha256(business | phone | rating | message | 10-min
  bucket)` unique index rejects rapid re-submissions; the client also disables the
  submit button, and a honeypot field catches bots.
- **Rate limiting.** In-memory per-IP sliding window on `POST /api/feedback`.
- **PII minimisation.** Only a salted IP hash is stored; the review page is
  `noindex`; security headers are set in `next.config.ts`.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```
