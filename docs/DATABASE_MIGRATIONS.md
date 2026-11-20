# Database migrations

Every change to the production Supabase database, destructive ones included, ships as a file in
`supabase/migrations/` and is applied by `.github/workflows/migrate.yml` after it reaches `main`.
Nobody pastes SQL into the dashboard, and agents do not run DDL or data fixes against production
through the Supabase MCP.

## Why this route

- **Reviewed and tested.** The SQL is in the pull request diff, and the CI job "Database tests"
  builds a scratch Postgres from every migration and runs the pgTAP suites against it before the
  pull request can merge.
- **No guard to fight.** Agents' direct writes to production are stopped by Claude Code's auto
  mode classifier and by the Supabase connector's confirmation prompt. Both are doing their job:
  an unreviewed `DROP` from a chat session is exactly what they are for. Merging a reviewed pull
  request is not, so the change goes that way.
- **Secrets stay in GitHub.** The database connection string is a secret on a GitHub
  environment that only `main` can use. Pull requests, other branches and forks never see it,
  which matters because the repository is public (security plan D1).
- **Recorded.** `supabase db push` writes each applied version into
  `supabase_migrations.schema_migrations`, so the history table, the repository and
  `list_migrations` agree.

## Writing a migration

1. Name it `supabase/migrations/<UTC yyyymmddhhmmss>_<snake_name>.sql`, newer than every
   existing file. `db push` refuses a file older than the newest applied version.
2. Never edit or rename a migration that is already applied: `db push` only looks at versions,
   so an edit is silently ignored in production. Write a new migration instead.
3. Destructive changes go in two steps (expand, then contract): first ship the code that stops
   using a column or table, then drop it in a later migration. The site deploy and the migration
   run independently, so a single pull request that does both can briefly break the live site.
4. A data fix (an `update` or `delete`) is a migration too. Keep personal data (names, emails)
   out of it, because the repository is public: select rows by id or by a condition. Removing a
   single person's 2FA factor is done in the dashboard (security plan D4), not here.
5. Every statement in one file runs in one transaction. If any statement fails, nothing in that
   file is applied and the job goes red.

## What happens on merge

CI runs on the push to `main`. When it finishes, "Database migrations" starts for that exact
commit and:

1. stops unless "Database tests" passed for the commit,
2. skips with a warning if the secret is not configured,
3. wakes the free-tier project (it hibernates when idle),
4. prints the pending migrations (`db push --dry-run`), applies them (`db push --yes`) and
   prints the history.

If nothing is pending it is a no-op. It also runs by hand from **Actions → Database migrations →
Run workflow** on `main`, with:

- **Only list what would be applied**: a dry run.
- **mark_applied**: versions to record as applied without running them, for SQL that is already
  live. Each must be the version of a file in `supabase/migrations/`.

## One-time setup (Martin)

1. **Copy the connection string.** Supabase dashboard → project **sbsk** → **Connect** (top bar)
   → **Connection String** → Type **URI**, Method **Session pooler**. It looks like
   `postgresql://postgres.ifdxcpntwugfggcripkw:[YOUR-PASSWORD]@aws-…-eu-central-1.pooler.supabase.com:5432/postgres`.
   Use the session pooler, not "Direct connection": GitHub's runners have no IPv6, and the direct
   address is IPv6 only on the free plan. Put the database password in place of
   `[YOUR-PASSWORD]`. If you do not know it, **Project Settings → Database → Reset database
   password**; nothing in the site uses it. If the password has characters such as `@`, `:`, `/`
   or `#`, percent-encode them or pick a password without them.
2. **Create the environment.** GitHub → repository **Settings → Environments → New
   environment** → name it `supabase-production`.
   - **Deployment branches and tags** → **Selected branches and tags** → add `main`.
   - **Environment secrets → Add environment secret** → name `SUPABASE_DB_URL`, value the string
     from step 1.
   - Optional: **Required reviewers** → yourself. Then every migration run waits for your click
     in the Actions tab (and GitHub emails you). Leave it off for agents to ship migrations
     unattended once CI is green.
3. **Run it once by hand** to bring the history in line with what is live: **Actions → Database
   migrations → Run workflow**, branch `main`, **mark_applied** =
   `20260809200650 20260823120000 20260824180000 20260826200000`. Those four were applied by hand
   before this workflow existed and are not in the history table, so without this step `db push`
   stops with "Found local migration files to be inserted before the last migration". The run
   should end with "Remote database is up to date".

After that, merging a pull request with a new migration applies it.

## Agents

- Write the migration, push, open the pull request, let CI go green, merge. Do not apply the
  same SQL through the Supabase MCP first; the workflow would then fail on the duplicate.
- After the merge, read the "Database migrations" run with the GitHub MCP (`actions_list`,
  `get_job_logs`), and check production with `list_migrations`, `list_tables` or read-only SQL.
- The Supabase MCP stays the tool for reads, logs and advisors in production.
