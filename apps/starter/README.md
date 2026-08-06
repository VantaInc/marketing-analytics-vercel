# Internal App Starter

Template and demo app for the base internal app repository.

## Local Development

```bash
corepack enable
pnpm install
pnpm dev --filter=@vanta/starter
```

The app runs on [http://localhost:3000](http://localhost:3000).

## Common First Edits

- Change app metadata in `src/app/layout.tsx`.
- Change the homepage in `src/app/page.tsx`.
- Change the idea intake form in `src/app/idea-submission-form.tsx`.
- Change the Google Sheets row mapping in `src/app/actions.ts`.
- Change the Slack connector example in `src/app/slack-example/page.tsx`.
- Add app-specific environment variables to `.env.local`.
- Keep shared UI components in `../../packages/ui` when another app may reuse
  them.

This README follows the starter app template. The root README has the flow for
renaming this starter app or adding another app before app-specific edits. The
focused app creation and deployment runbook lives in
[`../../docs/create-and-deploy-app.md`](../../docs/create-and-deploy-app.md).
For a new Slack-backed app, use `pnpm new:slack-app <app-name>` from the repo
root and follow the generated `apps/<app-name>/SLACK_CONNECT_SETUP.md`
checklist.

Shared UI primitives live in `../../packages/ui` and are imported through
package exports such as `@vanta/ui/components/button`,
`@vanta/ui/components/input`, and `@vanta/ui/components/textarea`.

## Google Sheets Idea Intake

The homepage idea form can write internal app ideas to Google Sheets through the
shared `@vanta/google-sheets` package. The app still loads without Google
Sheets credentials, but form submission needs the variables below.

It writes rows in this order:

```txt
submittedAt
sourceApp
sourceEnv
appName
submitterEmail
description
accessNeeded
```

Required server-only environment variables:

```txt
GOOGLE_SERVICE_ACCOUNT_JSON_B64
INTERNAL_APP_IDEAS_SPREADSHEET_ID
INTERNAL_APP_IDEAS_RANGE=Ideas!A:G
```

Do not prefix these values with `NEXT_PUBLIC_`.

For local development, copy `.env.example` to `.env.local` and fill in real
values:

```bash
cp apps/starter/.env.example apps/starter/.env.local
```

### Google Setup

1. Create or choose a Google Cloud project.
2. Enable the Google Sheets API.
3. Create a dedicated service account.
4. Generate a JSON key for that service account.
5. Base64-encode the JSON key.
6. Create separate production and preview/development Sheet targets.
7. Add the header row listed above to each Sheet.
8. Share each Sheet with the service account email as Editor.

The app should use the spreadsheet ID from the Sheet URL, not the full URL.
`INTERNAL_APP_IDEAS_RANGE` should match the tab name, for example `Ideas!A:G`.

### Vercel Setup

Add the environment variables to the starter Vercel project. Mark
`GOOGLE_SERVICE_ACCOUNT_JSON_B64` as Sensitive for preview and production.

Local values are not sourced from Vercel in this repo. For local testing, paste
the values into `apps/starter/.env.local` manually or use a non-sensitive
development-only test credential if policy allows it.

After changing Vercel environment variables, redeploy the project because env
changes apply only to new deployments.

## Slack Connector Example

The `/slack-example` page shows the recommended shape for a Slack-backed
internal app:

- Centralized Vanta Auth creates the app's signed, HttpOnly user session.
- Vercel Connect starts Slack user authorization with that stable app user
  subject.
- The starter requests the read-only Slack user scopes needed for a future
  recent mentions/messages panel.
- The starter does not call `getToken`, `auth.test`, Slack Web API methods, or
  app-token authorization.

The full reusable runbook for creating a new Slack-backed app and setting up a
new Vercel Connect Slack connection lives in
[`../../docs/slack-vercel-connect-app.md`](../../docs/slack-vercel-connect-app.md).

Required environment variables:

```txt
VANTA_AUTH_URL=https://<auth-app-domain>
VANTA_AUTH_CLIENT_ID=<id from the auth app Register Client form>
VANTA_AUTH_CLIENT_SECRET=<secret shown once by the auth app Register Client form>
AUTH_SECRET
SLACK_CONNECTOR_UID=slack/slack-vercel-connection
```

Do not prefix `VANTA_AUTH_CLIENT_SECRET` or `AUTH_SECRET` with `NEXT_PUBLIC_`.
Generate `AUTH_SECRET` as a long random string.
The starter also accepts the Vercel-generated aliases
`VERCEL_CONNECT_SLACK_CONNECTOR`.

### Central Auth Setup

1. Deploy and configure the centralized auth app from `apps/auth`.
2. In the auth app, register this starter app as a client.
3. Use these redirect URIs:
   - `http://localhost:3000/api/auth/callback`
   - `https://<your-app-domain>/api/auth/callback`
4. Add the generated client id and client secret to local `.env.local` and to
   this starter Vercel project as `VANTA_AUTH_CLIENT_ID` and
   `VANTA_AUTH_CLIENT_SECRET`.

The starter stores only its own signed session cookie with the normalized Vanta
Auth user subject. It does not store Vercel access tokens, refresh tokens, or
Slack tokens. Only the centralized auth app needs Sign in with Vercel client
credentials.

The self-serve auth registration guide lives in
[`../../docs/register-vanta-auth-client.md`](../../docs/register-vanta-auth-client.md).

### Vercel Connect Setup

1. Create or choose the Slack connector named
   `slack/slack-vercel-connection`.
2. Attach the connector to the starter Vercel project and the environments
   where the app should run.
3. Install the Slack connector into the Slack workspace.
4. For local development, create `apps/starter/.env.local` manually from the
   approved source for the app's secrets and environment-specific values.
5. If local Connect calls depend on Vercel runtime credentials that are not
   available locally, verify the Slack connector flow in a Vercel Preview
   deployment after the connector and project environment variables are set.
6. Open `/slack-example` and click **Authorize recent activity**. The route
   calls `startAuthorization` only.

The starter route intentionally uses direct Vercel Connect user authorization:

```ts
import { startAuthorization } from "@vercel/connect";

await startAuthorization("slack/slack-vercel-connection", {
  subject: { type: "user", id: "usr_123" },
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

These scopes let a later token-backed Slack Web API path list and read recent
activity visible to the authorized user. Keep that retrieval path separate from
this authorization-only starter flow. If a future app needs to post messages,
request Slack `chat:write` through Vercel Connect first.

## Deploying This App

Create a Vercel Project with these settings:

- Framework Preset: `Next.js`
- Root Directory: `apps/starter`
- Build Command: use the detected default, or `pnpm build`
- Output Directory: leave unset

Do not set Output Directory to `public`; this app builds to `.next`.
