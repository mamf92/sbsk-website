-- Move event participation out of Sanity into Supabase (issue #98).
--
-- The public Sanity `event` document previously carried a `participants` array (name, surname,
-- photo_url, supabase_id) readable by anyone with no auth and no token. This table replaces it:
-- reads are restricted to authenticated members, and writes are restricted to the row's own
-- owner (or an admin, for removal) via the same `member_is_admin()` boundary the rest of the
-- project's RLS uses (see 20260809200650_harden_rls_admin_boundary.sql).
--
-- Keyed by the Sanity event `_id` plus the member's `supabase_id`. `name`/`surname`/`photo_url`
-- are a snapshot taken at join time — the same behaviour the Sanity-backed version had — rather
-- than a live join against `profiles`, so a member re-joining after editing their profile is
-- what refreshes it, and other members never need read access to someone else's profile row.

create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  supabase_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  surname text not null default '',
  photo_url text not null default '',
  created_at timestamptz not null default now(),
  unique (event_id, supabase_id)
);

create index event_participants_event_id_idx on public.event_participants (event_id);

alter table public.event_participants enable row level security;

create policy "Authenticated members can view event participants"
  on public.event_participants for select to authenticated
  using (true);

create policy "Members join events as themselves"
  on public.event_participants for insert to authenticated
  with check (auth.uid() = supabase_id);

create policy "Members leave events, admins remove any participant"
  on public.event_participants for delete to authenticated
  using (auth.uid() = supabase_id or public.member_is_admin());
