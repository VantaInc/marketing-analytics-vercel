# Create And Deploy A New App

Use this runbook when you need a new internal app from this template. If you are
new to GitHub, start with [`GETTING_STARTED.md`](../GETTING_STARTED.md) first.

## Pick The Right Path

| Situation                                                | Command or guide                              |
| -------------------------------------------------------- | --------------------------------------------- |
| New repository from the template                         | [`GETTING_STARTED.md`](../GETTING_STARTED.md) |
| One-app repo where `apps/starter` should become your app | `pnpm rename:starter <app-name>`              |
| Additional app in this repo                              | `pnpm new:app <app-name>`                     |
| App that needs Slack through Vercel Connect              | `pnpm new:slack-app <app-name>`               |

Use lowercase letters, numbers, and hyphens for app names, for example
`security-review-tool`.

## Create The App

For a plain app:

```bash
pnpm new:app security-review-tool
```

For a Slack-backed app:

```bash
pnpm new:slack-app slack-review-tool
```

The app is copied from [`apps/starter`](../apps/starter), gets a package name
like `@vanta/security-review-tool`, and gets the next available local dev port.
Slack-backed apps also get `apps/<app-name>/SLACK_CONNECT_SETUP.md`.

## Example AI Prompt

Use a prompt like this with Codex when you want the scaffold plus first edits:

```txt
Create a new Slack-backed app called slack-review-tool from this template.
Keep the generated Slack setup checklist. Replace the starter homepage with a
simple workflow for reviewing recent Slack activity, and document any new
environment variables in the app README and .env.example. Do not deploy yet.
Run the focused checks that match the files you changed.
```

For a non-Slack app, swap in `pnpm new:app <app-name>` and describe the first
user workflow you want on the homepage.

## Run Locally

From the repo root:

```bash
corepack enable
pnpm install
pnpm dev --filter=@vanta/<app-name>
```

Open the local URL shown by the app's `package.json` dev script.

App-specific setup belongs in `apps/<app-name>/README.md` and
`apps/<app-name>/.env.example`. Keep real secrets in `.env.local` or Vercel,
never in git.

If the app needs persistence, use only the supported stores in
[`docs/databases.md`](./databases.md). Do not store CPD in any of them.

## Deploy On Vercel

Create one Vercel Project per deployable app.

- Framework Preset: `Next.js`
- Root Directory: `apps/<app-name>`
- Build Command: detected default or `pnpm build`
- Output Directory: leave unset

Do not set Output Directory to `public`; Next.js builds to `.next`.

If the app uses centralized auth, deploy and configure
[`apps/auth`](../apps/auth) first, then follow
[`docs/register-vanta-auth-client.md`](./register-vanta-auth-client.md).

If the app uses Slack, follow the generated
`apps/<app-name>/SLACK_CONNECT_SETUP.md` checklist and the reusable
[`Slack Vercel Connect runbook`](./slack-vercel-connect-app.md).

## Before Production

- The app has a Vercel Project with root directory `apps/<app-name>`.
- Required environment variables are set for Preview and Production.
- Vanta Auth redirect URIs include local and production callbacks when auth is
  used.
- Any Vercel Connect connection is attached to the project and environments
  that need it.
- Persistent storage uses only the approved options in
  [`docs/databases.md`](./databases.md), and the app does not store CPD there.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass for the relevant scope.
