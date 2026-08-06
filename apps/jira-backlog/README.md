# Jira Backlog

Prototype internal app for testing Jira access through Vercel Connect.

The app signs a Vanta Auth user into the internal app, starts Jira user
authorization through the `atlassian.com/jira` Vercel Connect connector, then
uses `getToken` to list accessible Jira sites and sample backlog issues.

## Local Development

```bash
corepack enable
pnpm install
pnpm dev --filter=@vanta/jira-backlog
```

The app runs on [http://localhost:3002](http://localhost:3002).

## Required Environment

Copy `.env.example` to `.env.local` and fill in real values:

```txt
VANTA_AUTH_URL=https://<auth-app-domain>
VANTA_AUTH_CLIENT_ID=<id from Vanta Auth registration>
VANTA_AUTH_CLIENT_SECRET=<secret shown once by Vanta Auth registration>
VANTA_AUTH_BYPASS_SECRET=<optional auth app protection bypass secret>
VANTA_AUTH_CALLBACK_ORIGIN=<optional registered stable origin>
AUTH_SECRET=<generate with openssl rand -base64 32>
JIRA_CONNECTOR_UID=atlassian.com/jira
```

Do not prefix server-only values with `NEXT_PUBLIC_`.

## Setup

Follow [`JIRA_CONNECT_SETUP.md`](./JIRA_CONNECT_SETUP.md) before testing a
Preview or Production deployment.

The first smoke test confirms:

- Vanta Auth created a stable app user subject.
- Vercel Connect started Jira user authorization.
- `getToken` returned an Atlassian token for that subject.
- Atlassian returned accessible Jira resources.
- Jira accepted `/rest/api/3/myself` and `/rest/api/3/search/jql` calls.

The app currently reads Jira data only. It requests `write:jira-work` so the
same connection can be used for a later controlled mutation test.

## `invalid_redirect_uri`

Vanta Auth requires the exact callback URL sent by this app to be listed on the
registered auth client. The signed-out page shows that URL as **Vanta Auth
redirect URI**.

For local testing, register:

```txt
http://localhost:3002/api/auth/callback
```

For Vercel Preview or Production, also register the exact deployed origin you
opened, for example:

```txt
https://<deployment-or-custom-domain>/api/auth/callback
```

Alternatively, optionally set `VANTA_AUTH_CALLBACK_ORIGIN` to a registered
stable origin. The app will move the browser to that origin before starting
sign-in so the state cookie can be read during callback.

If the app shows **Sign in failed**, use the error code on that page:
`state_mismatch` usually means the callback host changed or the state cookie
expired; `invalid_client` points at client id/secret mismatch; and
`invalid_redirect_uri` means the shown callback URL still is not registered.
The backend `Central auth flow event.` logs include the detailed URL,
state-match, and provider status context.
