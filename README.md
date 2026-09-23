# Tonight — a movie/TV matchmaker for two

Two people, one swipe deck, no more scrolling. Both partners set their mood
independently, Gemini merges both preference profiles into a search brief,
TMDB supplies the candidate pool, and a shared Tinder-style swipe round finds
something you'll both watch — with exactly where to stream it in India.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project**, then run [`supabase/schema.sql`](supabase/schema.sql)
   in its SQL editor. This creates all tables, permissive read policies (no
   auth in this app), and enables Realtime on `sessions`/`matches`.

3. **Copy the env file and fill in your keys**

   ```bash
   cp .env.example .env.local
   ```

   - `GEMINI_API_KEY` — from [aistudio.google.com](https://aistudio.google.com/apikey)
   - `TMDB_API_KEY` — TMDB v3 API key, from your TMDB account settings
   - `RAPIDAPI_KEY` — subscribe to an Indian OTT-lookup product on RapidAPI;
     `RAPIDAPI_HOST` and the response mapping in `lib/ott.ts` need to match
     whichever product you're on (see `FETCH_PATH` in that file)
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
     `SUPABASE_SERVICE_ROLE_KEY` — from your Supabase project's API settings

4. **Run it**

   ```bash
   npm run dev
   ```

## How it works

- `/` → Partner A starts a session, sets mood/language/rating/era prefs.
- `/session/[id]/waiting` → QR code + shareable link for Partner B.
- `/join/[id]` → Partner B lands in the same session, sets their own prefs
  independently.
- Once both submit, an API route merges both profiles via Gemini into a
  search brief, pulls ~30 titles from TMDB, and both partners swipe
  (`/session/[id]/swipe`) on the same pool in a different shuffle order.
- A shared right-swipe triggers `/session/[id]/match`, showing Indian OTT
  availability via RapidAPI.
- No match after round 1 → Gemini refines a round-2 pool from what both
  partners actually liked. Still no match after round 2 → both partners pick
  together from the top 5 by combined right-swipe score (`/session/[id]/final`).
- `/history` — past sessions/matches/ratings for the couple (identified by a
  `couple_id` stored in each partner's browser, no login).

See [supabase/schema.sql](supabase/schema.sql) for the full data model.
