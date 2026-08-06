# Jira Connect Setup

Use this checklist for the `apps/jira-backlog` Vercel Project.

## App Facts

| Item                    | Value                             |
| ----------------------- | --------------------------------- |
| App path                | `apps/jira-backlog`               |
| Package                 | `@vanta/jira-backlog`             |
| Local URL               | `http://localhost:3002`           |
| Expected production URL | `https://jira-backlog.vercel.app` |
| Connector UID           | `atlassian.com/jira`              |

## 1. Create The Vercel Project

Create one Vercel Project with:

- Framework Preset: `Next.js`
- Root Directory: `apps/jira-backlog`
- Build Command: detected default or `pnpm build`
- Output Directory: leave unset

## 2. Register This App With Vanta Auth

Register a Vanta Auth client for `jira-backlog`.

Use the exact redirect URIs for every origin you will test from:

```txt
http://localhost:3002/api/auth/callback
https://jira-backlog.vercel.app/api/auth/callback
https://<your-preview-or-custom-domain>/api/auth/callback
```

Add the generated client id and secret to local `.env.local` and the Vercel
Project.

The app shows the exact **Vanta Auth redirect URI** on the signed-out screen.
If Vanta Auth returns `invalid_redirect_uri`, copy that displayed value into the
registered client's redirect URI list or update `VANTA_AUTH_CLIENT_ID` to the
client that already contains it. The auth broker does exact redirect URI
matching; a Vercel Preview URL is not covered by the production URL.

Optionally, if you want one stable callback origin even when opening the app
from a different deployment URL, set:

```txt
VANTA_AUTH_CALLBACK_ORIGIN="https://<registered-app-origin>"
```

The app will move the browser to that origin before starting sign-in, so the
state cookie and callback stay on the same host.

If you see the Jira app's **Sign in failed** page, check the short error code
shown there, then use the backend `Central auth flow event.` logs for the
detailed auth URL, redirect URI, state-match, and provider status context:

- `state_mismatch`: sign-in started on one origin but the callback landed on
  another, or the state cookie expired.
- `invalid_client`: `VANTA_AUTH_CLIENT_ID` or `VANTA_AUTH_CLIENT_SECRET` does
  not match the registered auth client.
- `token_endpoint_unauthorized`: the server-to-server POST to
  `/api/auth/token` got a bare 401 before the auth route returned an OAuth JSON
  error. If the auth app logs do not show the token route for this attempt, set
  `VANTA_AUTH_BYPASS_SECRET` on the Jira app to the auth app's deployment
  protection bypass secret and redeploy the Jira app. Do not use the Jira
  project's own `VERCEL_AUTOMATION_BYPASS_SECRET`; the bypass value must belong
  to the protected auth project because that is the deployment being called.
- `invalid_redirect_uri`: the displayed redirect URI is not registered on that
  auth client.

## 3. Configure Jira Vercel Connect

Create or attach the Jira connector with this UID:

```txt
atlassian.com/jira
```

Configure the Atlassian OAuth app with these scopes:

```txt
read:jira-user
read:jira-work
write:jira-work
```

`read:jira-user` is needed for the current-user smoke test. `read:jira-work`
is needed for backlog reads. `write:jira-work` is only confirmed by a later
controlled write operation, such as creating and deleting a comment on a test
issue.

## 4. Configure Environment Variables

```txt
VANTA_AUTH_URL="https://<auth-app-domain>"
VANTA_AUTH_CLIENT_ID="jira-backlog"
VANTA_AUTH_CLIENT_SECRET="<secret shown once by Vanta Auth>"
VANTA_AUTH_CALLBACK_ORIGIN="<optional registered stable origin>"
AUTH_SECRET="<generate with openssl rand -base64 32>"
JIRA_CONNECTOR_UID="atlassian.com/jira"
```

## 5. Verify

Run:

```bash
pnpm dev --filter=@vanta/jira-backlog
```

Open:

```txt
http://localhost:3002
```

Expected result:

- Sign in through Vanta Auth.
- Click **Connect Jira**.
- Authorize Jira in Atlassian.
- The app shows accessible Jira sites, the Jira user, and a backlog sample.

The page calls:

```ts
import { startAuthorization } from "@vercel/connect";

await startAuthorization("atlassian.com/jira", {
  subject: { type: "user", id: "usr_123" },
  scopes: ["read:jira-user", "read:jira-work", "write:jira-work"],
});
```

After authorization, the app uses `getToken`, then calls Atlassian's
`accessible-resources` endpoint and Jira Cloud through
`https://api.atlassian.com/ex/jira/{cloudid}/...`.
