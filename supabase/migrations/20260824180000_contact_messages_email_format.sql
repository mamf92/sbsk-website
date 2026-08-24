-- Issue #202: `contact_messages`'s `insert` policy is open to `anon` with `with check (true)`,
-- required for the public Kontakt oss form to work with no backend beyond Supabase — but that
-- also means anyone who can construct a REST call can POST straight to
-- `.../rest/v1/contact_messages`, bypassing the form and its Zod validation entirely. The only
-- server-side check on `email` was a length bound (1–320 chars), not the `@`-and-domain shape
-- `contactSchema` (src/schemas/contact.ts) already enforces client-side.
--
-- Tightens the existing check into the same regex the client uses, so a direct API call can no
-- longer insert an obviously-garbage address. Doesn't touch spam *volume* — see #202 for why a
-- honeypot (shipped alongside this migration) and an Edge Function/captcha gate (its own future
-- issue) are the other two legs of that.
alter table public.contact_messages
  drop constraint if exists contact_messages_email_check;

alter table public.contact_messages
  add constraint contact_messages_email_check
  check (
    char_length(email) between 1 and 320
    and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'
  );
