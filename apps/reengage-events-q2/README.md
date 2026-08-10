# Re-Engage Events Q2 — Campaign Dashboard

Dashboard for the FY27Q2 Events Re-Engage campaign: exposed vs. holdout
incrementality, MQL/S0/S2/pipeline targets, audience behavior, and per-channel
engagement (Signal-2 emails, incentive offer, paid, SDR).

Structured like `apps/starter` (same configs, `src/` layout, workspace
packages). The dashboard renders at the app root (`/`).

## Fixture → live

`src/lib/reengage/queries.ts` reads `REENGAGE_USE_FIXTURES` (defaults to
`"true"`). Until the campaign data exists, every panel renders from
`src/lib/reengage/fixtures.ts` — the numbers mirror the approved design mock
and are NOT real campaign data.

To go live:
1. `vanta.exports.vercel_reengage_assignment` exists and is granted to
   `VERCEL_VIEWER` (one row per contact: email, market, is_holdout,
   assignment date) — analytics eng.
2. `vanta.dbt.dim_marketing_funnel` granted to `VERCEL_VIEWER`
   (one-line `+grants` PR in the dbt repo).
3. Email engagement export model `vanta.exports.vercel_reengage_email_events`
   (the HubSpot share isn't grantable table-by-table).
4. Complete the live assembly in `getDashboardData()` and set
   `REENGAGE_USE_FIXTURES=false` in Vercel.

## Vercel project setup (once)

- Project in the `vantacom` team, Root Directory = `apps/reengage-events-q2`.
- Link shared env vars (Settings → Environment Variables → Link Shared
  Variable): `SNOWFLAKE_ACCOUNT`, `SNOWFLAKE_DATABASE`,
  `SNOWFLAKE_PRIVATE_KEY`, `SNOWFLAKE_ROLE`, `SNOWFLAKE_USERNAME`,
  `SNOWFLAKE_WAREHOUSE`.
- Add `REENGAGE_USE_FIXTURES=true`.
- Request secure compute network inclusion (Parker Michel).

## Known TODOs

- `CAMPAIGN` constants in `src/lib/reengage/types.ts` still show the design
  mock's assumptions (20% holdout, Jun 22 launch). Actual campaign: 10%
  holdout, email launch Aug 19, incentive Sep 24 — update before sharing
  with stakeholders.
- `src/app/tokens.css` approximates the design-system tokens; swap in the
  real stylesheet if one lands in `packages/`.
- Lead-score panel requires the day-0 baseline snapshot from MOps.
