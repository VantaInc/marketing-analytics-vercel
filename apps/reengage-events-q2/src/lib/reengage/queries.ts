// Data layer for the Re-Engage dashboard.
//
// Today: returns fixtures (REENGAGE_USE_FIXTURES defaults to true — no
// campaign data exists yet; channels launch Aug 19).
//
// To go live, each get* function below has its SQL ready. Prerequisites:
//   1. vanta.exports.vercel_reengage_assignment exists + granted to VERCEL_VIEWER
//      (one row per contact: email, market up/down, is_holdout, assignment date)
//   2. vanta.dbt.dim_marketing_funnel granted to VERCEL_VIEWER (+grants PR)
//   3. vanta.exports.vercel_reengage_email_events export model (the HubSpot
//      share is not grantable table-by-table; a thin export model is the path)
//
// UTM tracking scheme (confirmed w/ MOps): utm_campaign identifies the program,
// utm_content identifies the send (nu-1..nu-4 / incentive).

import { FIXTURES } from "./fixtures";
import type { DashboardData } from "./types";

const USE_FIXTURES = (process.env.REENGAGE_USE_FIXTURES ?? "true") === "true";

const NURTURE_UTM = "fy27q2_nurt_acq_programmatic-nurture-signal-2_global";
const INCENTIVE_UTM = "fy27q3_nurt_eng_events-re-engage-incentive-offer_global";
const LAUNCH_DATE = "2026-08-19"; // NU1 send date — measurement clock start

export async function getDashboardData(): Promise<DashboardData> {
  if (USE_FIXTURES) return FIXTURES;

  // Live mode: run panels in parallel, then assemble into DashboardData.
  // Wire-up left as the flip-to-live task; each query below is ready to run.
  throw new Error(
    "Live mode not wired yet: set REENGAGE_USE_FIXTURES=true, or complete the assembly in getDashboardData()."
  );
}

/* ------------------------------------------------------------------ */
/* Live SQL — ported from Tests/Re-Enagage Campaign Events/*.sql        */
/* Uses @vanta/snowflake via lib/snowflake.ts (base repo).              */
/* ------------------------------------------------------------------ */

// Panel 1 · Incrementality: exposed vs holdout MQL counts per segment.
// Lift + 95% CI (two-proportion) are computed in JS from these counts.
export const SQL_INCREMENTALITY = `
with cohort as (
    select lower(trim(email)) as email, market, is_holdout
    from vanta.exports.vercel_reengage_assignment
),
funnel as (
    select lower(trim(email)) as email, min(mql_date) as first_mql_date
    from vanta.dbt.dim_marketing_funnel
    group by 1
)
select
    c.market,
    c.is_holdout,
    count(distinct c.email)                                        as contacts,
    count(distinct iff(f.first_mql_date >= '${LAUNCH_DATE}'::date,
                       c.email, null))                             as mqls
from cohort c
left join funnel f on f.email = c.email
group by 1, 2
`;

// Panel 1 · Cumulative weekly MQL curve per group.
export const SQL_WEEKLY_CURVE = `
with cohort as (
    select lower(trim(email)) as email, market, is_holdout
    from vanta.exports.vercel_reengage_assignment
),
funnel as (
    select lower(trim(email)) as email, min(mql_date) as first_mql_date
    from vanta.dbt.dim_marketing_funnel
    group by 1
),
weeks as (
    select seq4() + 1 as week_num
    from table(generator(rowcount => 13))
)
select
    w.week_num,
    c.market,
    c.is_holdout,
    count(distinct iff(
        f.first_mql_date between '${LAUNCH_DATE}'::date
            and dateadd(week, w.week_num, '${LAUNCH_DATE}'::date),
        c.email, null)) / count(distinct c.email) as cum_mql_rate
from cohort c
cross join weeks w
left join funnel f on f.email = c.email
group by 1, 2, 3
order by 1, 2, 3
`;

// Panel 2 · Targets: cohort-scoped funnel outcomes (exposed only, any source).
export const SQL_TARGETS = `
with cohort as (
    select lower(trim(email)) as email, market
    from vanta.exports.vercel_reengage_assignment
    where not is_holdout
),
funnel as (
    select
        lower(trim(email))   as email,
        min(mql_date)        as first_mql_date,
        min(stage_0_date)    as first_stage_0_date,
        min(stage_2_date)    as first_stage_2_date
    from vanta.dbt.dim_marketing_funnel
    group by 1
),
arr as (
    select lower(trim(email)) as email, opportunity_id, max(vanta_arr) as vanta_arr
    from vanta.dbt.dim_marketing_funnel
    where opportunity_created_date >= '${LAUNCH_DATE}'::date
    group by 1, 2
)
select
    c.market,
    count(distinct iff(f.first_mql_date     >= '${LAUNCH_DATE}'::date, c.email, null)) as mqls,
    count(distinct iff(f.first_stage_0_date >= '${LAUNCH_DATE}'::date, c.email, null)) as s0,
    count(distinct iff(f.first_stage_2_date >= '${LAUNCH_DATE}'::date, c.email, null)) as s2,
    coalesce(sum(a.vanta_arr), 0)                                                      as pipeline_arr
from cohort c
left join funnel f on f.email = c.email
left join arr a    on a.email = c.email
group by 1
`;

// Panel 4 · Email engagement per send (utm_content), from the export model.
// Warm vs capture classified by click destination (warm = ungated content LPs,
// capture = /demo and /lp/theragun).
export const SQL_EMAIL_PANEL = `
select
    a.market,
    e.utm_content,
    count(distinct iff(e.event_type = 'delivered', e.email, null))  as delivered,
    count(distinct iff(e.event_type = 'clicked'
                       and not e.is_bot_filtered, e.email, null))   as unique_clicks,
    count(distinct iff(e.event_type = 'clicked' and not e.is_bot_filtered
                       and e.click_path_type = 'warm',  e.email, null)) as warm_clicks,
    count(distinct iff(e.event_type = 'clicked' and not e.is_bot_filtered
                       and e.click_path_type = 'capture', e.email, null)) as capture_clicks
from vanta.exports.vercel_reengage_email_events e
inner join vanta.exports.vercel_reengage_assignment a
    on lower(trim(a.email)) = lower(trim(e.email))
where e.utm_campaign in ('${NURTURE_UTM}', '${INCENTIVE_UTM}')
group by 1, 2
order by 1, 2
`;

// Helper for live mode (uncomment when flipping on):
// import { getSnowflakeConnector } from "@/lib/snowflake";
// const rows = await getSnowflakeConnector().query(SQL_INCREMENTALITY);
