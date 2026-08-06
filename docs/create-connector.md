# Create A New Connector

Use this when an app needs reusable access to an external service.

In this repo, "connector" can mean two related things:

| Need                                                   | Where it lives                    |
| ------------------------------------------------------ | --------------------------------- |
| Shared TypeScript helpers for an external service      | `packages/<service>`              |
| OAuth or provider connection managed by Vercel Connect | Vercel Connect, then app env vars |

The Slack example uses both: [`packages/slack`](../packages/slack/src/index.ts)
wraps Slack/Vercel Connect helpers, and the app points at a Vercel Connect Slack
connection with `SLACK_CONNECTOR_UID`.

## Create A Shared Connector Package

From the repo root:

```bash
pnpm new:package jira
```

That creates `packages/jira` with TypeScript, ESLint, and package exports wired
for the workspace.

Keep the package focused:

- Put reusable service client code in `packages/<service>/src`.
- Export the intended public API from `packages/<service>/src/index.ts`.
- Add package exports to `packages/<service>/package.json` when callers need
  subpaths.
- Document required environment variables in the consuming app README and
  `.env.example`.
- Keep secrets server-side. Do not expose service tokens with `NEXT_PUBLIC_`.
- If the connector persists data, use only the supported stores in
  [`docs/databases.md`](./databases.md). Do not store CPD in them.

Use the existing packages as examples:

- [`packages/slack`](../packages/slack/src/index.ts)
- [`packages/snowflake`](../packages/snowflake/src/index.ts)
- [`packages/google-sheets`](../packages/google-sheets/src/index.ts)

## Use The Package From An App

Add the package to the app's `package.json`:

```json
{
  "dependencies": {
    "@vanta/jira": "workspace:*"
  }
}
```

Then import it by package name:

```ts
import { createJiraClient } from "@vanta/jira";
```

Avoid relative imports across package boundaries.

## Create A Vercel Connect Connection

Use Vercel Connect when the provider integration should be managed outside app
code and attached to Vercel Projects by environment.

At a high level:

1. Create or choose the provider connection in Vercel Connect.
2. Pick a clear connector UID, for example `slack/slack-review-tool`.
3. Attach the connection to the app's Vercel Project.
4. Enable it for the environments that should use it.
5. Add the connector UID to the app's environment variables.
6. Keep provider token retrieval in route handlers or server actions.

For Slack-specific setup, use
[`docs/slack-vercel-connect-app.md`](./slack-vercel-connect-app.md).

For persistent storage, use [`docs/databases.md`](./databases.md).

## Verify

Run the checks that match the change:

```bash
pnpm typecheck --filter=@vanta/<service>
pnpm lint --filter=@vanta/<service>
pnpm build --filter=@vanta/<app-name>
```
