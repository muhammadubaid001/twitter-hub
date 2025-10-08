# Supabase React CRUD

React + Vite + Tailwind + Supabase with Auth and full CRUD for posts (with image uploads to Storage).

## Features
- Email/password auth (Supabase Auth UI)
- Dashboard with Create, Read, Update, Delete for posts
- Image uploads stored in Supabase Storage (public URLs)
- React Router + React Query + TailwindCSS + Toasts

## Prerequisites
- Node 18+
- A Supabase project (URL and anon key)

## Supabase Setup
1) Create a public Storage bucket named `post-images` (mark it Public in the UI).
2) Create the `posts` table and policies.

SQL (run in the Supabase SQL editor):
```sql
create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists posts_user_created_idx on public.posts(user_id, created_at desc);

alter table public.posts enable row level security;

create policy if not exists "Users can CRUD own posts"
  on public.posts for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: public read of posts for a public landing feed
-- create policy if not exists "Public can read posts" on public.posts for select using (true);
```

Note: Because the `post-images` bucket is public, uploaded images are readable via their public URLs without extra SQL storage policies.

## Environment
Copy the example and fill with your Supabase credentials:
```bash
cp .env.example .env
# fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

## Install & Run
```bash
npm i
npm run dev
```

Open http://localhost:5173

## Project Structure
- `src/lib/supabaseClient.ts`: Supabase client
- `src/routes/*`: Pages (`LandingPage`, `AuthPage`, `DashboardPage`)
- `src/components/*`: UI components (`PostForm`, `PostCard`)
- `src/services/posts.ts`: CRUD + image upload helpers
- `src/hooks/*`: React Query hooks and auth session hook