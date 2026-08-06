# Base Internal App Repository

Template repository for creating and deploying Vanta internal apps without
rebuilding the same Next.js, Vercel, auth, and shared-package wiring each time.

This repo includes:

- A ready-to-run starter app in [`apps/starter`](./apps/starter).
- A centralized Vanta Auth broker in [`apps/auth`](./apps/auth).
- Shared packages for auth, Slack, Jira, Snowflake, Google Sheets, UI,
  enrichments, TypeScript, and ESLint.
- Scaffolding scripts for new apps, Slack-backed apps, and shared packages.
- Focused runbooks in [`docs/`](./docs) so each workflow stays short.

## Start Here

| I want to...                                     | Go to                                                                        |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Make my own repo from this template              | [`GETTING_STARTED.md`](./GETTING_STARTED.md)                                 |
| Create and deploy an app                         | [`docs/create-and-deploy-app.md`](./docs/create-and-deploy-app.md)           |
| Create a Slack-backed app                        | [`docs/slack-vercel-connect-app.md`](./docs/slack-vercel-connect-app.md)     |
| Register an app with Vanta Auth                  | [`docs/register-vanta-auth-client.md`](./docs/register-vanta-auth-client.md) |
| Create a connector or shared integration package | [`docs/create-connector.md`](./docs/create-connector.md)                     |
| Pick a supported database                        | [`docs/databases.md`](./docs/databases.md)                                   |
| Configure the starter app                        | [`apps/starter/README.md`](./apps/starter/README.md)                         |
| Configure the centralized auth app               | [`apps/auth/README.md`](./apps/auth/README.md)                               |

## Quick Commands

The repo expects Node 22 or newer and uses the `pnpm@10.11.0` version pinned in
[`package.json`](./package.json).

```bash
corepack enable
pnpm install
pnpm dev --filter=@vanta/starter
```

Common scaffolds:

```bash
pnpm rename:starter security-review-tool
pnpm new:app vendor-review-dashboard
pnpm new:slack-app slack-review-tool
pnpm new:package jira
```

## Project Map

- `apps/*` contains deployable internal apps. Each app should have its own
  Vercel Project with the app directory as the project root.
- `packages/*` contains shared code for app teams: UI, enrichments, auth, data
  access, config, and service clients.
- `scripts/*` contains local scaffolding helpers.
- `docs/*` contains reusable setup runbooks.
- [`.agents/skills/internal-apps`](./.agents/skills/internal-apps/SKILL.md)
  contains the repo-local coding-agent playbook.

## Review

Before opening a pull request, run the checks that match your change:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

See [`DECISIONS.md`](./DECISIONS.md) for the setup decision log and open stack
TODOs.
