# Goodwork: Team Recognition

A localhost-first recognition demo built with Next.js App Router, TypeScript,
Tailwind CSS, and Lucide icons. All teammates, badges, and sample messages are
fictional. No authentication, shared database, real rewards, analytics, or
runtime third-party image/font requests are included.

## Prerequisites

- Node.js 24 LTS and npm (Node 24.22.2 was used locally).
- Access to your organization-approved npm registry for dependencies.
- Chromium installation for browser tests.

If Node is not installed on this Windows machine, a portable runtime was placed
in `%LOCALAPPDATA%\team-recognition-runtime\node-v24.22.2-win-x64`.
Enable it for a new PowerShell terminal:

```powershell
$env:Path = "$env:LOCALAPPDATA\team-recognition-runtime\node-v24.22.2-win-x64;$env:Path"
```

## Local Development

From the `team-recognition` directory:

```sh
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open http://localhost:3000. If occupied, use another port, for example
`npm run dev -- --hostname 127.0.0.1 --port 3001`.

Search a fictional teammate by name or role, select a recognition badge, and
write a thank-you message. Submission adds recognition to the top of the feed.
The form prevents self-recognition, unknown selections, blank messages, and
messages longer than 500 characters. Filters show all, received, or sent
recognition. Alex Morgan is the fixed simulated current user.

## Persistence and Reset

Recognition is saved only in the current browser's localStorage under
`team-recognition:v1`. It survives refreshes but is not shared across browsers,
devices, or different origins/ports. A future Vercel origin starts with its own
sample feed, not the localhost records.

The app reads storage after client mount, validates saved records, and restores
sample data if stored JSON is malformed or contains invalid records. When
storage is denied or full, the app remains functional in memory and warns
that reloads will lose new recognition.

Use **Reset demo data** in the footer and confirm to remove added recognition
and restore the sample feed. Cancel or Escape leaves data unchanged. Clearing
browser site data also resets the demo.

Do not enter real employee information, confidential messages, or credentials.
Browser-local data is not encrypted and this is not a production multi-user
service. Recognition messages are rendered as text, not HTML.

## Verification

```sh
npm run test
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Vitest covers input validation, ordering, stored JSON validation, empty data,
duplicate IDs, and denied reads/writes. Playwright starts the production build
on port 3100 and covers submission, literal HTML-like text, reloads, reset,
keyboard controls, search, filters, malformed/denied storage, and desktop/mobile
rendering. Keep port 3100 free for tests. Screenshots and failure traces are
written to ignored `test-results/`.

The initial dependency audit reports 16 moderate findings in the development
ESLint/minimatch dependency chain (GHSA-g3hv-75wg-m249). npm suggests an
incompatible ESLint downgrade; `npm audit fix --force` was deliberately not
used. Review a compatible patched tooling release before external publication.
Check runtime dependencies separately with `npm audit --omit=dev`.

To run the production build manually:

```sh
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

## GitHub and Vercel Approval Gates

No Git repository, commit, remote, or deployment is created automatically.
Before publishing, confirm:

1. GitHub use and the intended organization/repository destination are allowed.
2. Repository visibility is approved; do not assume public access is permitted.
3. This source code and its dependencies may leave the local machine.
4. Vercel hosting and requested GitHub integration/OAuth permissions are approved.
5. A publicly reachable dummy demo is permitted, or approved access restrictions are in place.
6. The user explicitly authorizes repository creation, the initial commit/push, and deployment.

Once approved, initialize Git, review files and `.gitignore`, then commit and
push to the approved repository. Use Vercel's Next.js preset, npm, and
`npm run build`. Select `team-recognition` as the root directory if the repo
contains its parent folder. No environment variables or database are required.
An approved GitHub integration or approved Vercel CLI path can deploy the app.

Before sharing, perform dependency/security review and repeat submission,
reload, and reset checks against the live URL. Organization approval was not
verified during local implementation. If GitHub or Vercel is disallowed, keep
using localhost; do not substitute an external provider without approval.

## Assets

Fictional avatar PNGs in `public/avatars/` were generated using DiceBear's
[Notionists style by Pablo Stanley](https://www.dicebear.com/styles/notionists/),
licensed under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
No employee photos are used. DM Sans and Manrope fonts are bundled through
Fontsource under the SIL Open Font License. Lucide icons use the ISC license.
