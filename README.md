# Watchlify

Turn YouTube playlists and videos into distraction-free, structured courses with progress tracking, daily goals, streaks, public shareable roadmaps, and AI study assist.

**Stack:** Next.js 15 (App Router) + TypeScript, Tailwind CSS v4, Supabase (Postgres + Auth), YouTube Data API v3 + IFrame Player API.

## Setup

1. **Dependencies**
   ```bash
   npm install
   ```
2. **Supabase**
   - Create a Supabase project.
   - Run the complete `supabase/schema.sql` script in the SQL Editor. This creates the profile trigger required when a new user signs up.
   - If you already have the original database, run `supabase/product-features.sql` once to add private study tasks, timestamped lesson notes, syllabus progress, exam dates, and custom learning paths. Do not rerun the original schema on an existing database.
   - In Authentication → Providers, enable Email.
   - In Authentication → URL Configuration, set the local Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to the redirect URL allowlist. Add your production domain and its `/auth/callback` URL when deploying.
   - Email confirmation is controlled by your Supabase Auth settings. When enabled, new users must open the confirmation link before logging in. Configure SMTP for reliable delivery; the built-in email service has sending limits.
3. **YouTube API key:** Enable YouTube Data API v3 in Google Cloud Console and create an API key.
4. **Environment:** Copy `.env.example` to `.env.local` and fill in the values. Never expose or commit `SUPABASE_SERVICE_ROLE_KEY`, `YOUTUBE_API_KEY`, `CRON_SECRET`, or `RESEND_API_KEY`; configure them as server-side environment variables in production.
5. **Run**
   ```bash
   npm run dev
   ```

## How it works

- `POST /api/courses`: link parse hota hai, playlist YouTube API se aati hai, shared cache (`playlists`, `videos`, `playlist_videos`) mein service role se save hoti hai (24 ghante cache), aur user ke liye `user_courses` entry banti hai.
- `components/Player.tsx`: IFrame Player API. Sirf **actual play hua time** ginta hai (seek ka nahi), har ~10 sec mein `save_progress` RPC call karta hai.
- Streak, daily goal and reminder calculations use the account timezone stored in `profiles.timezone` (defaults to `Asia/Kolkata`). The timezone is intentionally not exposed in settings.
- `/planner`: private study tasks ko day/week/month/year views mein date/time ke saath plan karo, complete karo, aur enrolled YouTube courses se resume karo.
- `/syllabus/select` (My playlists): see all your added YouTube playlists with lesson counts, completion progress, search and status filters.
- Custom learning paths: create a named path, add individual YouTube video links in sequence, reorder/remove lessons, and track progress while studying. These paths are private to their owner; the YouTube video metadata is reused in the shared video cache.
- Lesson pages: timestamped plain-text notes are private to the user; clicking a timestamp reopens that lesson at the saved point.
- AI tools and paid subscriptions are not included.
- Jo video embed allow nahi karta, uske liye "YouTube par dekho" fallback + manual complete.
- Reminders: `vercel.json` ka cron roz 14:30 UTC (8:00 PM IST) par `/api/cron/reminders` chalata hai. `RESEND_API_KEY`, `RESEND_FROM`, `CRON_SECRET` chahiye.

## Deploy (Vercel)

Repo import karo, required variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `YOUTUBE_API_KEY`) Vercel mein set karo. Set `NEXT_PUBLIC_SITE_URL` to your production URL and add that domain and its `/auth/callback` URL to Supabase Authentication → URL Configuration. Email reminders are optional; enable them by setting `CRON_SECRET`, `RESEND_API_KEY`, and `RESEND_FROM`. Configure a production email sender with Resend before enabling reminders.

## Troubleshooting sign-up

- Check the login page for the error message shown after submitting the form.
- If account creation reports a profile/database setup error, run `supabase/schema.sql` in the Supabase SQL Editor and check that the `on_auth_user_created` trigger exists.
- If sign-up asks you to confirm your email, the account is pending confirmation; use the link sent by Supabase before logging in. The login page can resend the confirmation email.
- If the confirmation link fails, add the exact callback URL (`<your-site-url>/auth/callback`) to Authentication → URL Configuration → Redirect URLs.
- If the confirmation email does not arrive, check Supabase Auth email delivery limits and configure custom SMTP.

## MVP ki known limits

- **Completion rule:** video khatam hone par, ya 90% actual dekhne par, ya manual button se complete hota hai. Kisi ko end tak seek karne se rok nahi hai.
- **Progress cheating:** `save_progress` har call par max 60 sec jodta hai, par client chahe to bar-bar call kar sakta hai. Serious leaderboard se pehle server-side rate limit chahiye.
- **Bade playlists:** queries `limit(10000)` par hain, par Supabase ka default API max-rows (1000) bhi lagta hai. Bade playlists ke liye pagination ya Supabase ki `max_rows` setting badhao.
- **Re-sync:** cache 24 ghante purana ho to agle import par refresh hota hai. Alag "sync now" button abhi nahi hai.
- **Reminders:** ek hi daily run, aur max 500 users. Zyada users par batching/queue chahiye.
- **UI:** Tailwind ke plain components hain. shadcn/ui abhi init nahi kiya (`npx shadcn@latest init` baad mein chala sakte ho).
- **Domain:** YouTube Terms ke hisaab se player visible rehna chahiye. Background play/download mat add karna.
