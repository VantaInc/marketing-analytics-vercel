# Vanta Auth

Centralized auth broker for Vanta internal apps. This app owns the single Sign
in with Vercel integration and exchanges short-lived auth codes for normalized
Vanta user sessions.

## Local Development

```bash
corepack enable
pnpm install
pnpm dev --filter=@vanta/auth-app
```

The app runs on [http://localhost:3001](http://localhost:3001).

## Environment Variables

Required:

```txt
NEXT_PUBLIC_VERCEL_APP_CLIENT_ID
VERCEL_APP_CLIENT_SECRET
AUTH_SECRET
EDGE_CONFIG
```

Required for self-service client registration:

```txt
VERCEL_API_TOKEN
VANTA_AUTH_ADMIN_EMAILS
```

Optional:

```txt
VANTA_AUTH_ALLOWED_EMAIL_DOMAINS=vanta.com
```

The allowed email domain defaults to `vanta.com` when unset. Use
`openssl rand -base64 32` for `AUTH_SECRET`.

`EDGE_CONFIG` is created automatically when a Vercel Edge Config store is
connected to this project. `VERCEL_API_TOKEN` is used only by signed-in admins
to write hashed client records into Edge Config. `VANTA_AUTH_ADMIN_EMAILS` is a
comma-separated list of exact Vanta email addresses allowed to create or rotate
auth clients.

| Variable                           | Where to get it                                                                 | What it does                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_VERCEL_APP_CLIENT_ID` | Vercel Integrations Console, from the `Vanta Internal Auth` Vercel App          | Identifies this auth app to Sign in with Vercel                |
| `VERCEL_APP_CLIENT_SECRET`         | Vercel Integrations Console, from the same Vercel App                           | Exchanges Vercel OAuth codes for ID tokens                     |
| `AUTH_SECRET`                      | Generate with `openssl rand -base64 32`                                         | Signs auth sessions, auth codes, and hashes client secrets     |
| `EDGE_CONFIG`                      | Added by Vercel when `vanta-internal-auth-clients` is connected to this project | Reads registered auth clients                                  |
| `VERCEL_API_TOKEN`                 | Vercel Account Settings, Tokens                                                 | Lets the auth app write client registrations to Edge Config    |
| `VANTA_AUTH_ADMIN_EMAILS`          | Manual comma-separated list, for example `you@vanta.com`                        | Allows only listed signed-in users to create or rotate clients |
| `VANTA_AUTH_ALLOWED_EMAIL_DOMAINS` | Optional manual value                                                           | Limits sign-in to allowed email domains                        |

## Vercel Setup

Create one Vercel Project named `vanta-internal-auth` with root directory:

```txt
apps/auth
```

Create one Sign in with Vercel app and configure these callback URLs:

```txt
http://localhost:3001/api/auth/callback
https://<auth-app-domain>/api/auth/callback
```

Add the client id and client secret from that Vercel app to this auth app's
environment variables.

Create one Edge Config store named `vanta-internal-auth-clients` and connect it
to the `vanta-internal-auth` project. Vercel will add the `EDGE_CONFIG`
environment variable to the project.

Create a Vercel API token named `vanta-internal-auth-edge-config-writer` from
your Vercel account settings, then add it to this project as `VERCEL_API_TOKEN`.
Add your exact email address as `VANTA_AUTH_ADMIN_EMAILS`, for example
`you@vanta.com`. Add more admins as a comma-separated list. Mark
`VERCEL_APP_CLIENT_SECRET`, `AUTH_SECRET`, `EDGE_CONFIG`, and `VERCEL_API_TOKEN`
as Sensitive.

After the auth app is deployed, sign in and use the Register Client form. It
creates or rotates an auth client in Edge Config, stores only a hashed client
secret, and shows the raw secret once.

The short self-serve guide for registering client apps, including who needs an
auth admin and what information to prepare, lives in
[`../../docs/register-vanta-auth-client.md`](../../docs/register-vanta-auth-client.md).

## Client App Flow

Client apps should use `@vanta/auth`:

```ts
import { createCentralAuthClientProvider } from "@vanta/auth";

const auth = createCentralAuthClientProvider({
  authBaseUrl: process.env.VANTA_AUTH_URL!,
  bypassSecret: process.env.VANTA_AUTH_BYPASS_SECRET,
  clientId: process.env.VANTA_AUTH_CLIENT_ID!,
  clientSecret: process.env.VANTA_AUTH_CLIENT_SECRET!,
});

const authorizationUrl = auth.createAuthorizationUrl({
  redirectUri: "https://my-app.vercel.app/api/auth/callback",
  state: "opaque-state-from-my-app",
});

const session = await auth.exchangeAuthorizationCode({
  code: "code-from-callback",
  redirectUri: "https://my-app.vercel.app/api/auth/callback",
});
```

The returned `session.user.id` is the stable subject client apps can pass to
other Vercel Connect packages such as `@vanta/slack`.

Client apps need these environment variables:

```txt
VANTA_AUTH_URL=https://<auth-app-domain>
VANTA_AUTH_CLIENT_ID=<id from the Register Client form>
VANTA_AUTH_CLIENT_SECRET=<secret shown once by the Register Client form>
VANTA_AUTH_BYPASS_SECRET=<optional auth app protection bypass secret>
```
