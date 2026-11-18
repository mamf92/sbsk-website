#!/usr/bin/env bash
# Build a throwaway database from supabase/migrations on a plain local Postgres and run the
# pgTAP suites against it. For machines without the Supabase CLI / Docker (cloud agent
# sessions); CI and developers with the CLI use `supabase test db` instead.
#
# Needs psql, pg_prove and the pgtap extension installed for the server (Debian/Ubuntu:
# apt install postgresql-16-pgtap libtap-parser-sourcehandler-pgtap-perl).
#
#   PGHOST=/tmp PGPORT=54329 PGUSER=postgres supabase/tests/local/run.sh
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/../../.." && pwd)"
db="${SBSK_TEST_DB:-sbsk_test}"

psql -v ON_ERROR_STOP=1 -qX -d postgres -c "drop database if exists $db" -c "create database $db"
psql -v ON_ERROR_STOP=1 -qX -d "$db" -f "$here/supabase-stub.sql"

for migration in "$root"/supabase/migrations/*.sql; do
  echo "migrate: $(basename "$migration")"
  psql -v ON_ERROR_STOP=1 -qX -d "$db" -f "$migration"
done

if command -v pg_prove >/dev/null 2>&1; then
  (cd "$root/supabase/tests/database" && pg_prove -d "$db" --ext .sql *.test.sql)
  "$here/last-admin-race.sh" "$db"
else
  status=0
  for test in "$root"/supabase/tests/database/*.test.sql; do
    echo "test: $(basename "$test")"
    out="$(cd "$root/supabase/tests/database" && psql -v ON_ERROR_STOP=1 -qXAt -d "$db" -f "$test" 2>&1)" || status=1
    echo "$out"
    if grep -q '^not ok' <<<"$out"; then status=1; fi
  done
  "$here/last-admin-race.sh" "$db" || status=1
  exit $status
fi
