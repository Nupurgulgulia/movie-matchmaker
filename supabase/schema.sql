-- Run this in the Supabase SQL editor for your project.
-- No auth/login in this app: policies are intentionally permissive (public
-- read/write via anon key for realtime + reads; writes in practice only
-- happen through server API routes using the service-role key, which
-- bypasses RLS anyway).

create extension if not exists "pgcrypto";

create table if not exists couples (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  status text not null default 'collecting'
    check (status in ('collecting', 'swiping', 'generating', 'matched', 'final_choice', 'done')),
  round int not null default 1,
  partner_a_submitted boolean not null default false,
  partner_b_submitted boolean not null default false,
  partner_a_finished_round boolean not null default false,
  partner_b_finished_round boolean not null default false,
  final_choice_tmdb_id int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists preferences (
  session_id uuid not null references sessions(id) on delete cascade,
  partner text not null check (partner in ('a', 'b')),
  moods text[] not null default '{}',
  mood_text text not null default '',
  languages text[] not null default '{}',
  content_type text not null check (content_type in ('movies', 'series')),
  min_rating int not null check (min_rating in (6, 7, 8, 9)),
  eras text[] not null default '{}',
  submitted_at timestamptz not null default now(),
  primary key (session_id, partner)
);

create table if not exists title_pool (
  session_id uuid not null references sessions(id) on delete cascade,
  round int not null,
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  year int,
  poster_path text,
  rating numeric,
  runtime int,
  synopsis text not null default '',
  primary key (session_id, round, tmdb_id)
);

create table if not exists swipes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  round int not null,
  partner text not null check (partner in ('a', 'b')),
  tmdb_id int not null,
  direction text not null check (direction in ('left', 'right')),
  created_at timestamptz not null default now(),
  unique (session_id, round, partner, tmdb_id)
);

create table if not exists matches (
  session_id uuid not null references sessions(id) on delete cascade,
  round int not null,
  tmdb_id int not null,
  matched_at timestamptz not null default now(),
  primary key (session_id, round)
);

create table if not exists ratings (
  session_id uuid not null references sessions(id) on delete cascade,
  tmdb_id int not null,
  rating int not null check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  primary key (session_id, tmdb_id)
);

create index if not exists idx_sessions_couple on sessions(couple_id);
create index if not exists idx_swipes_session_round on swipes(session_id, round);
create index if not exists idx_title_pool_session_round on title_pool(session_id, round);

alter table couples enable row level security;
alter table sessions enable row level security;
alter table preferences enable row level security;
alter table title_pool enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table ratings enable row level security;

create policy "public read couples" on couples for select using (true);
create policy "public read sessions" on sessions for select using (true);
create policy "public read preferences" on preferences for select using (true);
create policy "public read title_pool" on title_pool for select using (true);
create policy "public read swipes" on swipes for select using (true);
create policy "public read matches" on matches for select using (true);
create policy "public read ratings" on ratings for select using (true);

-- Enable Realtime on the tables the UI subscribes to.
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table matches;
