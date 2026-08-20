# Security policy

This repository is public and the site it builds holds member data — names, contact details and
profile images for Stavanger Brettspillklubb members. Please report anything that could expose
that data privately, before opening an issue or a pull request.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting:
**[Security → Report a vulnerability](https://github.com/mamf92/sbsk-website/security/advisories/new)**.
It opens a thread only the maintainers can see, so nothing is disclosed while a fix is prepared.

If that form is unavailable, contact the maintainer ([@mamf92](https://github.com/mamf92))
directly rather than filing a public issue.

Please include what you were able to access, the steps to reproduce it, and whether any real
member data was involved. Expect a first response within a week. This is a volunteer-run club
site with no bounty programme; credit in the advisory is offered gladly.

## What is in scope

The deployed site at `https://mamf92.github.io/sbsk-website/`, this repository, and the
Supabase and Sanity configuration behind them. Findings that matter most here:

- Row-level-security gaps that let one member read or edit another member's data.
- Anything that gets a non-board account into the board portal (`/styreportal`) or the
  Sanity Studio (`/studio`).
- Secrets committed to the repository or exposed through the client bundle. Only `VITE_*`
  variables reach the browser, and by design none of them is a secret — a secret found in one
  is a real finding.
- Cross-site scripting, including anything that escapes the Content-Security-Policy in
  `src/security/csp.ts`.

## What is not in scope

- Missing `frame-ancestors`, `X-Frame-Options`, HSTS and other header-only defences. GitHub
  Pages serves static files and cannot set response headers; the CSP is delivered through a
  `<meta>` element, which browsers ignore for those directives. Moving off Pages is the only
  fix and is a deliberate open trade-off.
- Reports produced solely by an automated scanner, with no demonstrated impact.
- Denial of service, volumetric testing, and social engineering.

Please do not test against real member accounts or the production Supabase project. If a
proof of concept needs data, use an account you created yourself.

## Supported versions

The site is continuously deployed: `main` is the only supported version, and fixes ship there.
