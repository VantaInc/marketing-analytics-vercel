// Segment filter was removed from the UI — the dashboard reports the full
// cohort. Kept as a single-key map so a segment cut can return later without
// reshaping the data layer.
export type Segment = "all";

export interface TargetRaw {
  label: string;
  actual: number;
  target: number;
  money?: boolean; // render as $M / $K
}

// Cohort funnel with the conversion rates between steps — the brief assumes
// 3% inquiry→MQL, 20% MQL→S0, 43% S0→S2. Showing actual rates is the point.
export interface FunnelRaw {
  mql: number;
  s0: number;
  s2: number;
  pipelineArr: number; // in $M
}

// Guards the whole experiment: any holdout contact receiving a send voids the
// incrementality read. Sourced from the leak-check query after every send.
export interface HoldoutIntegrity {
  leaks: number;
  sendsChecked: number;
  checkedOn: string;
}

export interface EmailRaw {
  name: string; // utm_content: nu-1..nu-4
  sentOn: string; // send date, e.g. "Aug 19"
  delivered: number;
  opens: number; // directional only (Apple MPP inflates opens)
  clicks: number;
  unsubs: number;
  spam: number;
  warm: number; // % of clicks to warm landing paths
  mqls: number; // MQLs attributed to this send (MQL_UTM_CONTENT)
  s0: number; // S0s from contacts who clicked this send
  note?: string; // e.g. "in flight"
}

// One point per day or per week. `values` is keyed by the channel's own
// breakout: nu-1..nu-4 for email, platform for paid, stage for SDR/incentive.
export interface SeriesPoint {
  label: string;
  values: Record<string, number>;
}

export type ChannelKey = "email" | "incentive" | "paid" | "sdr";

export interface ChannelSeries {
  metricLabel: string; // what the lines measure, e.g. "Unique clicks"
  keys: string[]; // series order, drives colors + legend
  day: SeriesPoint[];
  week: SeriesPoint[];
}

export interface PaidRaw {
  platform: string;
  reach: string;
  freq: string;
  ctr: string;
}

export interface SegmentData {
  exposed: number;
  holdout: number;
  expMql: number;
  holdMql: number;
  ci: [number, number]; // 95% CI on lift, in percent
  exp: number[]; // cumulative MQL % by week
  hold: number[];
  integrity: HoldoutIntegrity;
  targets: TargetRaw[];
  funnel: FunnelRaw;
  scoreExp: number; // avg lead-score delta vs. day-0 baseline, exposed
  scoreHold: number; // same, holdout
  engaged: number; // % of exposed with any engagement
  email: EmailRaw[];
  series: Record<ChannelKey, ChannelSeries>;
  inc: [string, number][];
  paid: PaidRaw[];
  sdr: [string, number][] | null; // null = SDR motion not run on this segment
}

export type DashboardData = Record<Segment, SegmentData>;

// Campaign constants — FY27Q2 Events Re-Engage.
// Measurement clock is anchored on the email launch (NU1), matching
// LAUNCH_DATE in queries.ts. Flight: paid live Aug 5 · Signal-2 nurture
// NU1 Aug 19, NU2 Aug 27, NU3 Sep 4, NU4 Sep 15 · incentive offer Sep 24.
const EMAIL_LAUNCH = new Date("2026-08-19T00:00:00Z");
const WINDOW_DAYS = 90;

function daysSinceLaunch(): number {
  const ms = Date.now() - EMAIL_LAUNCH.getTime();
  return Math.floor(ms / 86_400_000);
}

function phaseLabel(): string {
  const d = daysSinceLaunch();
  if (d < 0) return `Launches Aug 19 · in ${Math.abs(d)} days`;
  return `Day ${Math.min(d, WINDOW_DAYS)} of ${WINDOW_DAYS}`;
}

export const CAMPAIGN = {
  key: "fy27q2_events_reengage",
  team: "Growth Marketing",
  title: "Q2 Events Re-Engage",
  windowDays: WINDOW_DAYS,
  get phase() {
    return phaseLabel();
  },
  get isPreLaunch() {
    return daysSinceLaunch() < 0;
  },
  subtitle:
    "Exposed cohort vs. a 10% holdout (cut per segment) suppressed from paid, email, incentive, and SDR. Email launch Aug 19, 2026 · final incrementality read Nov 17, 2026.",
  dataThrough: "Pre-launch — fixture data, not live campaign results",
  prelimBadge: "Fixture data — not live results",
};
