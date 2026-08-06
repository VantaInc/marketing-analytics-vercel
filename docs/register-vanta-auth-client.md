# Register An App With Vanta Auth

Use this when an internal app needs the centralized Vanta Auth flow. Slack-backed
apps need this because Vercel Connect user authorization needs a stable app user
subject.

The auth app lives in [`apps/auth`](../apps/auth). Its setup details are in
[`apps/auth/README.md`](../apps/auth/README.md).

## Do I Need An Auth Admin?

Maybe.

Registration is self-serve for people listed in the auth app's
`VANTA_AUTH_ADMIN_EMAILS` environment variable. If you are on that list, open
the deployed auth app and register the client yourself.

If you are not on that list, you do not need the template owner specifically.
Ask any current auth admin for the `vanta-internal-auth` app to register the
client or add you as an admin.

## Information To Have Ready

Send this to an auth admin when you cannot register the client yourself:

- App owner or team.
- App path, for example `apps/slack-review-tool`.
- Vercel Project name, if it already exists.
- Client ID, usually the app name, for example `slack-review-tool`.
- Display name, for example `Slack Review Tool`.
- Redirect URIs:

```txt
http://localhost:<port>/api/auth/callback
https://<app-domain>/api/auth/callback
```

For Slack-backed apps, also include the Slack connector UID and workspace name
if you know them. Vanta Auth does not need those values, but they help the admin
confirm they are registering the right app.

## Register The Client

In the deployed auth app:

1. Sign in.
2. Confirm the Register Client form is enabled.
3. Enter the client ID, display name, and redirect URIs.
4. Submit the form.
5. Copy the generated client secret immediately. It is shown once.

Submitting an existing client ID rotates that client's secret.

## Add Environment Variables

Add these to the client app's local `.env.local` and to the app's Vercel Project:

```txt
VANTA_AUTH_URL=https://<auth-app-domain>
VANTA_AUTH_CLIENT_ID=<id from Vanta Auth registration>
VANTA_AUTH_CLIENT_SECRET=<secret shown once by Vanta Auth registration>
VANTA_AUTH_BYPASS_SECRET=<optional auth app protection bypass secret>
AUTH_SECRET=<generate with openssl rand -base64 32>
```

Mark `VANTA_AUTH_CLIENT_SECRET`, `VANTA_AUTH_BYPASS_SECRET`, and `AUTH_SECRET`
as Sensitive in Vercel. Do not prefix server-only values with `NEXT_PUBLIC_`.

If the auth app is protected by Vercel Deployment Protection, set
`VANTA_AUTH_BYPASS_SECRET` to a bypass secret from the auth project. The shared
`@vanta/auth` client provider sends it on token exchange requests and logs safe
failure details for all apps using that provider.

After changing Vercel environment variables, redeploy the app so the new values
are used.

## Use In App Code

The starter app already includes the central auth routes. New apps copied from
[`apps/starter`](../apps/starter) should keep those routes unless they have a
different auth requirement.

Reusable client helpers live in [`packages/auth`](../packages/auth/src/index.ts).
