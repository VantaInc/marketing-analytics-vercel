# Marketing Directory

A home page for every dashboard the marketing analytics team maintains. Reads a
Google Sheet catalog and renders it as a searchable, filterable card grid so
people can find the right dashboard without asking in Slack.

Dashboards live across several BI tools (Looker, Tableau, Sigma, Amplitude,
Sheets), so the index deliberately sits outside any one of them.

## The catalog sheet

One tab, one row per dashboard, header row first. Column names are matched
case-insensitively, so `Refresh cadence` and `refresh cadence` both work.

| Column            | Required | Drives                                                                     |
| ----------------- | -------- | -------------------------------------------------------------------------- |
| `Name`            | Yes      | Card title. Rows without a name are skipped                                |
| `Description`     | Yes      | Card body — phrase it as the question it answers                           |
| `URL`             | Yes      | Where the card links                                                       |
| `Tool`            | Yes      | Tool tag, colored dot, and the tool filter                                 |
| `Category`        | Yes      | The filter chips                                                           |
| `Status`          | Yes      | Badge. One of `Certified`, `Working`, `Deprecated` (defaults to `Working`) |
| `Owner`           | Yes      | Footer avatar and name                                                     |
| `Refresh cadence` | Yes      | Footer refresh label                                                       |
| `Last reviewed`   | No       | Parsed, not yet rendered                                                   |
| `Grain/scope`     | No       | Parsed, not yet rendered                                                   |

Use Data → Data validation to make `Tool`, `Category`, and `Status` dropdowns —
typos silently split a filter into two.

## Setup

The app reads the sheet with a **service account**, so the sheet stays private.
Do not use a Google API key here; API-key access requires the sheet be shared
"anyone with the link can view."

1. Create a service account and download its JSON key.
2. Share the catalog sheet with the service account's email as **Viewer**.
3. Base64-encode the JSON key into `GOOGLE_SERVICE_ACCOUNT_JSON_B64`.
4. Set `DASHBOARD_CATALOG_SPREADSHEET_ID` to the id from the sheet URL.
5. Register the auth client per
   [`docs/register-vanta-auth-client.md`](../../docs/register-vanta-auth-client.md)
   and set the `VANTA_AUTH_*` and `AUTH_SECRET` variables.

See [`.env.example`](./.env.example) for the full list. Keep real secrets in
`.env.local` or Vercel, never in git.

With no sheet configured the app serves sample rows and shows a banner saying
so, so it renders before the sheet exists. A genuine read failure throws rather
than falling back — sample data must never be mistaken for the real catalog.

## Access

The directory requires a Vanta Auth session. Dashboard names and descriptions
routinely reference customers, segments, and internal metrics, so this app
should not be deployed without auth configured.

## Run locally

From the repo root:

```bash
pnpm install
pnpm dev --filter=@vanta/marketing-directory
```

Then open http://localhost:3003. You need the `VANTA_AUTH_*` variables set to
get past the sign-in screen.

## Deploy

One Vercel Project, Root Directory `apps/marketing-directory`, framework
preset Next.js. Set the environment variables above for Preview and Production,
and add both callback URLs to the auth client's redirect URIs. Full runbook:
[`docs/create-and-deploy-app.md`](../../docs/create-and-deploy-app.md).
