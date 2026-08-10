export type Segment = "all" | "up" | "down";

export interface TargetRaw {
  label: string;
  actual: number;
  target: number;
  pace: number;
  money?: boolean;
}

export interface EmailRaw {
  name: string; // utm_content: nu-1..nu-4
  delivered: number;
  clicks: number;
  warm: number; // % of clicks to warm landing paths
  note?: string; // e.g. "in flight"
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
  targets: TargetRaw[];
  scoreExp: number;
  scoreHold: number;
  engaged: number; // % of exposed with any engagement
  overlap: [string, number][];
  email: EmailRaw[];
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
