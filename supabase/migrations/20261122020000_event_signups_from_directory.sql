-- Phase 3 step 4: event sign-ups stop copying names and photos (docs/plans/phase-3-members.md,
-- decisions 7 and 8).
--
-- `event_participants` keeps only who signed up for what, and when. Names and photos are read
-- live from `profiles` through `event_attendees`, so a profile edit or an account deletion shows
-- everywhere at once and there is no stale copy of personal data to export or erase.
--
-- Members choose whether other members see them in attendee lists
-- (`profiles.show_in_attendee_lists`). A hidden member is still counted, as an anonymous row;
-- the member themself and the board (admin_session) always see the name.

alter table public.profiles
  add column show_in_attendee_lists boolean not null default true;

-- The board's sign-up view read the old snapshot columns as a fallback. Rebuilt on profiles only.
drop view public.admin_event_signups;

alter table public.event_participants
  drop column name,
  drop column surname,
  drop column photo_url;

create view public.admin_event_signups with (security_invoker = true) as
  select ep.event_id,
         null::text as session_id,
         m.id as member_id,
         ep.supabase_id,
         nullif(trim(coalesce(p.name, '') || ' ' || coalesce(p.surname, '')), '') as display_name,
         m.email,
         'rsvp'::text as source,
         null::text as payment_status,
         ep.created_at
  from public.event_participants ep
  left join public.members m on m.supabase_id = ep.supabase_id
  left join public.profiles p on p.supabase_id = ep.supabase_id
  where public.admin_session();

revoke all on public.admin_event_signups from public, anon, authenticated;
grant select on public.admin_event_signups to authenticated, service_role;

-- Who is coming, as other members may see it. Runs as its owner (security_invoker = false), like
-- member_directory: members cannot read each other's profiles, and this exposes the display
-- columns only, to active members only, with hidden members masked. Accepted Supabase advisor
-- 0010 (security definer view) for the same reason as member_directory.
create view public.event_attendees with (security_invoker = false) as
  select ep.event_id,
         case when v.visible then ep.supabase_id end as supabase_id,
         case when v.visible then p.name end as name,
         case when v.visible then p.surname end as surname,
         case when v.visible then p.photo_url end as photo_url,
         not v.visible as hidden,
         ep.created_at
  from public.event_participants ep
  join public.members m on m.supabase_id = ep.supabase_id and m.status = 'active'
  join public.profiles p on p.supabase_id = ep.supabase_id
  cross join lateral (
    select p.show_in_attendee_lists
           or ep.supabase_id = (select auth.uid())
           or public.admin_session() as visible
  ) v
  where public.member_is_active();

revoke all on public.event_attendees from public, anon, authenticated;
grant select on public.event_attendees to authenticated, service_role;

-- The directory follows the same choice: a hidden member is listed only to themself and the board.
create or replace view public.member_directory with (security_invoker = false) as
  select p.supabase_id, p.name, p.surname, p.photo_url, p.bio
  from public.profiles p
  join public.members m on m.supabase_id = p.supabase_id
  where m.status = 'active'
    and public.member_is_active()
    and (p.show_in_attendee_lists
         or p.supabase_id = (select auth.uid())
         or public.admin_session());

-- The table itself now answers only for the caller's own sign-ups (and everything for the
-- board), so a hidden member's account id cannot be read around the view.
drop policy if exists "Active members can view event participants" on public.event_participants;
create policy "Members read their own sign-ups"
  on public.event_participants for select to authenticated
  using (supabase_id = (select auth.uid()));
create policy "Admins read all sign-ups"
  on public.event_participants for select to authenticated
  using (public.admin_session());

-- Disabled members no longer see their own sign-ups either (as before this migration).
drop policy "Members read their own sign-ups" on public.event_participants;
create policy "Members read their own sign-ups"
  on public.event_participants for select to authenticated
  using (supabase_id = (select auth.uid()) and public.member_is_active());

-- Profile photos follow the same choice. Before, any signed-in account could list and fetch
-- every photo. Now: your own, the board's view of everyone, and the photos of members listed
-- in member_directory (active, and not hidden from other members).
drop policy if exists "Authenticated users can view profile images" on storage.objects;
create policy "Members view photos of visible members"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'profile-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.admin_session()
      or exists (
        select 1 from public.member_directory d
        -- `objects.name`, qualified: member_directory has a `name` column of its own, and an
        -- unqualified `name` here would silently compare against the member's first name.
        where d.supabase_id::text = (storage.foldername(objects.name))[1]
      )
    )
  );
