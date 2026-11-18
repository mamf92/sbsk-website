#!/usr/bin/env bash
# protect_last_admin() under concurrency, which a single-session pgTAP test cannot reach. Two
# transactions each demote a different one of the only two admins; the second must fail with
# `last_admin` once the first commits. Run by run.sh after the pgTAP suites, against its database.
set -euo pipefail

db="$1"
q() { psql -v ON_ERROR_STOP=1 -qXAt -d "$db" "$@"; }

q -c "insert into public.members (name, surname, email, is_admin) values
        ('Race', 'En', 'race1@example.no', true), ('Race', 'To', 'race2@example.no', true);
      update public.members set is_admin = false
        where is_admin and email not in ('race1@example.no', 'race2@example.no');"

# First transaction demotes race1 and holds its lock for two seconds before committing.
q -c "begin;
      update public.members set is_admin = false where email = 'race1@example.no';
      select pg_sleep(2);
      commit;" &
first=$!
sleep 0.5

# The second starts while the first is open, and must not also succeed.
if out="$(q -c "update public.members set is_admin = false where email = 'race2@example.no'" 2>&1)"; then
  wait "$first"
  echo "not ok - two concurrent demotions both succeeded and left no admin"
  exit 1
fi
wait "$first"
if grep -q 'last_admin' <<<"$out"; then
  echo "ok - concurrent demotion of the last two admins: the second is refused (last_admin)"
else
  echo "not ok - second demotion failed for another reason: $out"
  exit 1
fi
