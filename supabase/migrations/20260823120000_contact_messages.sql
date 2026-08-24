-- Kontakt oss (issue #180): a place for a submitted contact-form message to land.
--
-- No email provider is chosen yet (#133 is still open), so this is the whole delivery
-- mechanism for now: an insert-only table a board member reads in the Supabase dashboard
-- until a styreportal view exists. `anon` can insert and never select — a submitted message
-- cannot be read back by the person who sent it or by anyone else unauthenticated.

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 1 and 320),
  message text not null check (char_length(message) between 1 and 5000)
);

alter table public.contact_messages enable row level security;

-- The form itself: an anonymous visitor, or a signed-in member, can send one message.
create policy "Anyone can send a contact message"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

-- Reusing the canonical admin check from the RLS hardening migration rather than inventing a
-- second one — `member_is_admin()` is already the sanctioned client probe for board status.
create policy "Admins can read contact messages"
  on public.contact_messages for select
  to authenticated
  using (public.member_is_admin());
