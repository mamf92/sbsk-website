-- Phase 3 step 6: the membership card (docs/plans/phase-3-members.md, decision 9, "Membership
-- card lookup").
--
-- Every member gets a random card token. The card on Min side shows it as a QR code; the board
-- scans it at the door to find the member. The token is not a login secret and unlocks nothing
-- on its own: the only thing that reads it is admin_member_by_card_token(), behind
-- admin_session(). A member can rotate it from the card, which retires the old code at once.

-- 128 random bits as 32 hex characters, from gen_random_uuid() (core since Postgres 13, no
-- extension needed). The version nibble is fixed, so 122 bits are random: plenty for a code
-- that only a signed-in board member at aal2 can look up.
create or replace function public.new_member_card_token()
returns text
language sql
volatile
set search_path to 'public'
as $$
  select replace(gen_random_uuid()::text, '-', '')
$$;

revoke execute on function public.new_member_card_token() from public, anon, authenticated;

alter table public.members
  -- Inline rather than new_member_card_token(), so an admin's insert needs no execute grant.
  add column member_card_token text not null default replace(gen_random_uuid()::text, '-', '')
    constraint members_card_token_format check (member_card_token ~ '^[0-9a-f]{32}$');

alter table public.members
  add constraint members_card_token_unique unique (member_card_token);

-- The board's scan. Disabled members are returned too, with their status, so the door can say
-- "deaktivert" instead of "unknown code".
create or replace function public.admin_member_by_card_token(p_token text)
returns table (
  member_id uuid,
  name text,
  surname text,
  status public.member_status,
  season_paid boolean
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not public.admin_session() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  return query
    select m.id,
           m.name,
           m.surname,
           m.status,
           exists (
             select 1 from public.membership_payments p
             where p.member_id = m.id
               and p.status = 'paid'
               -- The club's season is the Oslo calendar year, not UTC's.
               and p.season = extract(year from now() at time zone 'Europe/Oslo')::smallint
           )
    from public.members m
    where m.member_card_token = lower(trim(p_token));
end;
$$;

revoke execute on function public.admin_member_by_card_token(text) from public, anon;
grant execute on function public.admin_member_by_card_token(text) to authenticated, service_role;

-- "Lag ny kode": the member's own row only; returns the new token for the card to redraw.
create or replace function public.rotate_member_card_token()
returns text
language plpgsql
volatile
security definer
set search_path to 'public'
as $$
declare
  me uuid := public.current_member_id();
  token text;
begin
  if me is null then
    raise exception 'not_member' using errcode = '42501';
  end if;
  update public.members
  set member_card_token = public.new_member_card_token()
  where id = me
  returning member_card_token into token;
  return token;
end;
$$;

revoke execute on function public.rotate_member_card_token() from public, anon;
grant execute on function public.rotate_member_card_token() to authenticated, service_role;

-- The audit log keeps that the card code changed, never the code itself.
create or replace function public.audit_redacted_keys()
returns text[]
language sql
immutable
set search_path to 'public'
as $$
  select array['notes', 'note', 'disabled_reason', 'member_card_token']::text[];
$$;
