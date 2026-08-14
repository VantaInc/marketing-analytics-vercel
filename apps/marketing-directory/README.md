# Marketing Directory

A home page for every dashboard the marketing analytics team maintains. Reads a
Google Sheet catalog and renders it as a searchable, filterable card grid so
people can find the right dashboard without asking in Slack.

Dashboards live across several BI tools (Looker, Tableau, Sigma, Amplitude,
Sheets), so the index deliberately sits outside any one of them.

## The catalog sheet

One tab, one row per dashboard, header row first. Column names are matched
case-insensitively, so `Refresh cadence` and `refresh cadence` both work.

| Column               | Required | Drives                                                                     |
| -------------------- | -------- | -------------------------------------------------------------------------- |
| `Name`               | Yes      | Card title. Rows without a name are skipped                                |
| `Description`        | Yes      | Card body, clamped to 2 lines with a Show more toggle. Length is not capped |
| `URL`                | Yes      | Where the card links                                                       |
| `Tool`               | Yes      | Tool tag, colored dot, and the tool filter                                 |
| `Category`           | Yes      | The filter chips                                                           |
| `Status`             | Yes      | Badge. One of `Certified`, `Working`, `Deprecated` (defaults to `Working`) |
| `Owner`              | Yes      | Footer avatar and name                                                     |
| `Refresh cadence`    | Yes      | Footer refresh label                                                       |
| `Supporting sources` | No       | Doc pills on the card (see below)                                          |
| `Screenshot URL`     | No       | Thumbnail in the card's expanded state (see below)                         |
| `Last reviewed`      | No       | Parsed, not yet rendered                                                   |
| `Grain/scope`        | No       | Parsed, not yet rendered                                                   |

Use Data → Data validation to make `Tool`, `Category`, and `Status` dropdowns —
typos silently split a filter into two.

### Supporting sources

Links to the docs that explain a dashboard — a Guru card defining the metrics,
a Glean result with the funnel guide. Several links pack into one cell so the
sheet stays one row per dashboard:

```
Guru: Metric definitions | https://… ; Glean: How to read this | https://…
```

Entries split on `;`. The `|` separates label from URL, and a `Source:` prefix
names the source. Both are optional — a bare pasted URL works, and its host
picks the source, so `https://vanta.getguru.com/card/…` on its own becomes a
Guru pill labelled with the host. An entry is dropped only when it has neither
a label nor a URL.

The source name picks the pill icon (`Guru` and `Glean` have their own; anything
else gets a generic document icon) and appears in the pill's tooltip.

The column header can be any of `Supporting sources`, `Supporting source`,
`Supporting materials`, `Supporting docs`, `Supporting links`, `Sources`, or
`Docs`, matched case-insensitively. A header outside that list is not an error —
the column is simply ignored and no pills render.

The read range defaults to `Catalog!A1:Z1000`. If you set
`DASHBOARD_CATALOG_RANGE` explicitly, make sure it is wide enough to include
this column; a column past the end of the range is read as empty with no
warning.

### Screenshot URL

Paste the Google Drive share link straight from the Share button. Drive's share
link points at its viewer page, which serves HTML, so an `<img>` aimed at it
renders nothing — the app rewrites it to the direct form:

```
https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  ->  https://drive.google.com/uc?id=FILE_ID
```

`open?id=` links convert too, an already-direct `uc?id=` link is left as it is,
and any non-Drive image URL passes through untouched, so a link to another host
works without special handling. A Drive URL with no file id in it — a folder
link — is left alone rather than mangled.

Accepted headers: `Screenshot URL`, `Screenshot`, `Screenshot link`, `Preview`,
`Preview URL`, `Image`, `Image URL`.

**Share the file, not just the folder.** Drive enforces its own permissions on
that URL, and it is checked against whoever is looking at the directory, not the
service account that reads the sheet. Set the file — or the folder it inherits
from — to **Anyone with the link · Viewer**. A file that is not shared widely
enough returns a sign-in page instead of image bytes; the card notices and drops
the screenshot rather than showing a broken frame, so a missing thumbnail with
everything else correct almost always means sharing.

If a screenshot still refuses to load with sharing set correctly, Drive is
throttling or interstitialing that file. `https://lh3.googleusercontent.com/d/FILE_ID`
serves the same image and is more reliable for embedding; it can be pasted in
directly, since non-Drive hosts are passed through.

The thumbnail renders in a fixed 16:9 box at the card's width, capped at 200px
tall, cropped from the top where a dashboard's title and headline numbers
usually sit. Source images are not resized on upload, so keep them reasonable —
a 4MB PNG still transfers at full size before being scaled down for display.

## Setup

The app reads the sheet with a **service account**, so the sheet stays private.
Do not use a Google API key here; API-key access requires the sheet be shared
"anyone with the link can view."

1. Create a service account and download its JSON key.
2. Share the catalog sheet with the service account's email as **Viewer**.
3. Base64-encode the JSON key into `GOOGLE_SERVICE_ACCOUNT_JSON_B64`.
4. Set `DASHBOARD_CATALOG_SPREADSHEET_ID` to the id from the sheet URL.

The `VANTA_AUTH_*` and `AUTH_SECRET` variables are not needed — see
[Access](#access).

See [`.env.example`](./.env.example) for the full list. Keep real secrets in
`.env.local` or Vercel, never in git.

With no sheet configured the app serves sample rows and shows a banner saying
so, so it renders before the sheet exists. A genuine read failure throws rather
than falling back — sample data must never be mistaken for the real catalog.

## Access

**Access is enforced by Vercel Authentication on the Vercel project, which
requires Vanta Okta SSO. This app performs no sign-in of its own.**

Dashboard names and descriptions routinely reference customers, segments, and
internal metrics, so the directory must never be served without that
protection. Because the app no longer checks for a session, the project setting
is the only gate: disabling Vercel Authentication, or deploying this app to a
project that does not have it, publishes the catalog to anyone with the URL.

Viewers must be members of the Vanta Vercel team. That is a narrower audience
than the marketing analytics team as a whole.

### Restoring app-level auth

The central auth integration is still wired up but dormant: `src/lib/auth.ts`
and `src/app/api/auth/*` are intact and unreferenced. They are unused because
the shared auth broker in [`apps/auth`](../auth) has never been deployed, so
`VANTA_AUTH_URL` has nowhere to point.

To bring it back:

1. Deploy `apps/auth` as its own Vercel project.
2. Register this client per
   [`docs/register-vanta-auth-client.md`](../../docs/register-vanta-auth-client.md).
3. Set the `VANTA_AUTH_*` and `AUTH_SECRET` variables on this project.
4. Reinstate the session check in `src/app/page.tsx` and pass
   `viewerInitials` to `Directory` again.

## Run locally

From the repo root:

```bash
pnpm install
pnpm dev --filter=@vanta/marketing-directory
```

Then open http://localhost:3003. There is no sign-in step; local runs are
unauthenticated, as is any deployment without Vercel Authentication.

## Deploy

One Vercel Project, Root Directory `apps/marketing-directory`, framework
preset Next.js. Set the environment variables above for Preview and Production.
Full runbook:
[`docs/create-and-deploy-app.md`](../../docs/create-and-deploy-app.md).

**Turn on Vercel Authentication for the project before the first production
deploy**, and set it to apply to all deployments. It is the only access control
this app has.
