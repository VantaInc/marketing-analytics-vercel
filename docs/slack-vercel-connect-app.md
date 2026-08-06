# Create A Slack-Backed App With Vercel Connect

Use this runbook when a new internal app needs Slack access through Vercel
Connect. The local automation creates the app from `apps/starter` and writes an
app-specific checklist with the exact app path, local port, redirect URIs, and
connector UID.

## What This Flow Gives You

- A Next.js app under `apps/<app-name>`.
- Centralized Vanta Auth wiring through `@vanta/auth`.
- A read-only `/slack-example` page that starts Slack user authorization through
  Vercel Connect with the read-only user scopes needed for recent Slack
  activity.
- A generated `apps/<app-name>/SLACK_CONNECT_SETUP.md` checklist for Vercel and
  Slack setup.

The starter intentionally tests only user authorization first. It does not call
`getToken`, Slack `auth.test`, Slack Web API methods, or app-token
authorization.

## Prerequisites

- Access to create or link a Vercel Project in the Vanta Vercel team.
- Access to the centralized Vanta Auth app in `apps/auth`, or an auth admin who
  can register the client for you.
- Permission to create or attach a Vercel Connect Slack connection.
- Permission to install or authorize the Slack connection in the target Slack
  workspace.
- Vercel CLI installed locally when testing Connect from your machine.

Useful references:

- [Vercel Connect](https://vercel.com/docs/connect)
- [Vercel Connect SDK reference](https://vercel.com/docs/connect/ts-sdk-reference)
- [Vercel environment variables](https://vercel.com/docs/projects/environment-variables)

## 1. Create The App

From the repo root:

```bash
pnpm new:slack-app slack-review-tool
```

The command creates `apps/slack-review-tool` from `apps/starter`, assigns the
next available local dev port, and writes:

```txt
apps/slack-review-tool/SLACK_CONNECT_SETUP.md
```

Use options when the defaults are not right:

```bash
pnpm new:slack-app slack-review-tool \
  --connector-uid slack/slack-review-tool \
  --auth-url https://vanta-internal-auth.vercel.app \
  --production-url https://slack-review-tool.vercel.app
```

For an existing app that was already created from the starter:

```bash
pnpm new:slack-app slack-review-tool --checklist-only
```

Add `--force` only when you intentionally want to replace an existing generated
checklist.

## 2. Create The Vercel Project

Create one Vercel Project for the app. Each deployable app in this repo should
have its own Vercel Project.

Use these settings:

- Framework Preset: `Next.js`
- Root Directory: `apps/<app-name>`
- Build Command: detected default or `pnpm build`
- Output Directory: leave unset

Do not set Output Directory to `public`; Next.js builds to `.next`.

## 3. Register The App With Vanta Auth

The Slack user-token flow needs a stable application user subject. New internal
apps should use centralized Vanta Auth instead of creating a separate Sign in
with Vercel app.

Registration is self-serve for people listed in the auth app's
`VANTA_AUTH_ADMIN_EMAILS` environment variable. If you are not an auth admin,
you do not need the template owner specifically. Ask any current auth admin for
the `vanta-internal-auth` app to register the client or add you as an admin.

Have these details ready:

- App owner or team.
- App path, for example `apps/slack-review-tool`.
- Vercel Project name, if it already exists.
- Client ID, usually the app name.
- Display name.
- Redirect URIs from the generated setup file:

```txt
http://localhost:<port>/api/auth/callback
https://<app-domain>/api/auth/callback
```

The full auth registration guide is
[`docs/register-vanta-auth-client.md`](./register-vanta-auth-client.md).

After registration, copy the generated client id and one-time client secret.

Add these values to the new app's local `.env.local` and Vercel Project:

```txt
VANTA_AUTH_URL=https://<auth-app-domain>
VANTA_AUTH_CLIENT_ID=<id from Vanta Auth registration>
VANTA_AUTH_CLIENT_SECRET=<secret shown once by Vanta Auth registration>
AUTH_SECRET=<generate with openssl rand -base64 32>
```

Mark `VANTA_AUTH_CLIENT_SECRET` and `AUTH_SECRET` as Sensitive in Vercel. Do not
prefix server-only values with `NEXT_PUBLIC_`.

## 4. Create Or Attach The Slack Vercel Connect Connection

Create a new Vercel Connect Slack connection when this app needs a distinct
Slack workspace, scope set, ownership boundary, or environment lifecycle. Reuse
an existing connection when the app should intentionally share the same Slack
installation and scopes.

For a new connection:

1. In Vercel, create or configure a Slack connection through Vercel Connect.
2. Choose a clear connector UID, for example:

```txt
slack/slack-review-tool
```

3. Install or authorize the Slack connection in the target Slack workspace.
4. Attach the connection to the app's Vercel Project.
5. Enable the connection for each environment that should call Slack.
6. Add the connector UID to the app's environment variables:

```txt
SLACK_CONNECTOR_UID=slack/slack-review-tool
```

The starter defaults to `slack/slack-vercel-connection` when
`SLACK_CONNECTOR_UID` is unset, but production apps should set the value
explicitly so ownership is obvious.

The read-only example only calls `startAuthorization` for
`subject: { type: "user" }` and the recent activity scope bundle. If the app
will read or post messages later, add token retrieval and Slack Web API calls as
a separate follow-up after this flow works.

## 5. Create The Local Environment File

Local environment variables are not sourced from Vercel in this repo. Create
`apps/<app-name>/.env.local` manually from the approved source for the app's
secrets and environment-specific values.

At minimum, Slack-backed apps need:

```txt
VANTA_AUTH_URL=https://<auth-app-domain>
VANTA_AUTH_CLIENT_ID=<id from Vanta Auth registration>
VANTA_AUTH_CLIENT_SECRET=<secret shown once by Vanta Auth registration>
AUTH_SECRET=<generate with openssl rand -base64 32>
SLACK_CONNECTOR_UID=slack/<connector-uid>
```

The starter also accepts Vercel-generated local env aliases named
`VERCEL_CONNECT_SLACK_CONNECTOR`.

If you use the Vercel CLI for project context, run only the project-linking
step from the app directory:

```bash
cd apps/<app-name>
vercel link
```

Keep `.env.local` out of git. When Vercel-specific runtime credentials are not
available locally, verify the Slack connector flow in a Vercel Preview
deployment after the project environment variables and connector attachment are
configured.

## 6. Run And Verify Locally

From the repo root:

```bash
pnpm dev --filter=@vanta/<app-name>
```

Open:

```txt
http://localhost:<port>/slack-example
```

Expected behavior:

- Signed-out users are sent through centralized Vanta Auth.
- The page shows the connector UID, subject type `user`, and signed-in app user
  subject id.
- Clicking Authorize recent activity calls Vercel Connect `startAuthorization`.
- After authorization, Vercel Connect redirects back to `/slack-example` with
  callback metadata such as Slack subject and workspace ids.

## 7. Use Slack In App Code

The starter route uses Vercel Connect directly:

```ts
import { startAuthorization } from "@vercel/connect";

const { url } = await startAuthorization("slack/slack-review-tool", {
  subject: { type: "user", id: session.user.id },
  scopes: [
    "channels:read",
    "channels:history",
    "groups:read",
    "groups:history",
    "im:read",
    "im:history",
    "mpim:read",
    "mpim:history",
  ],
});
```

Keep this call in a route handler or server action. Add `getToken` only later,
in a separate code path, when the app is ready to call the Slack Web API.

## Troubleshooting

- `ConnectorInstallationRequiredError`: install the Slack connection and attach
  it to this Vercel Project and environment.
- `UserAuthorizationRequiredError`, `NoValidTokenError`, or Slack
  `invalid_auth`: these belong to token retrieval, not this starter
  authorization-only flow. If they appear while testing `/slack-example`, look
  for code that is still calling `getToken` or Slack `auth.test`.
- Local authentication errors: check `apps/<app-name>/.env.local`, the Vanta
  Auth client registration, and the Slack connector attachment. If the failure
  depends on Vercel runtime credentials that are not available locally, verify
  the flow in a Preview deployment.
- Production still uses old values: redeploy after changing Vercel environment
  variables.
- Build fails looking for `public`: clear the Vercel Output Directory setting.
