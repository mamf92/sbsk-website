# Member sign-in: Supabase settings

Members sign in with a password or with a 6-digit code sent by email
(`docs/plans/phase-3-members.md`, decisions 2–4). The first code for an email on the member
register creates the login; `hook_restrict_signup_by_email_list()` refuses every other email.

These settings live in the Supabase dashboard (project `sbsk`), not in the repo. Set them before
the member portal is switched on (`VITE_ENABLE_MEMBER_PORTAL=true`).

## Steps

1. Open Authentication → Emails → SMTP Settings. Turn on custom SMTP.
   Supabase's built-in sender only delivers to the project's own team, at 2 emails an hour.
2. Open Authentication → Emails → Templates → "Magic Link".
   Paste `supabase/templates/sign-in-code.nb.html` as the body. Set the subject from that file.
3. Do the same for "Confirm signup".
   Then open "Reset Password" and paste `supabase/templates/reset-password.nb.html` (subject in that file).
4. Open Authentication → Sign In / Providers → Email.
   Set "Email OTP Expiration" to 600 seconds and "Email OTP Length" to 6.
5. On the same page, set "Minimum password length" to 10.
6. If the plan allows it, turn on "Prevent use of leaked passwords".

## Check

1. Add a test email as an active member in Styreportal.
2. Open `/lag-medlemsprofil` and ask for a code.
3. Check that the email shows a 6-digit code, not only a link.
4. Enter the code. Check that first-time setup opens.

## What the app expects

- A wrong or old code: Supabase answers "Token has expired or is invalid".
- An email not on the register: the hook raises, and Supabase answers
  "Database error saving new user". The app shows a neutral "not on the list" message
  (accepted enumeration risk, plan decision 6).
- A disabled member can still get a session; `requireMember()` signs them out at once and RLS
  returns nothing to them meanwhile.

Not done yet: Turnstile captcha on the sign-in calls (plan decision 5). It needs a Cloudflare
site key, the secret in Supabase (Authentication → Attack Protection), and a CSP entry.
