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

// Campaign constants — update when final dates/holdout are locked.
export const CAMPAIGN = {
  key: "camp_signal2_q3",
  team: "Growth Marketing",
  title: "Signal-2 Re-engagement",
  dayOf: 45,
  dayTotal: 90,
  subtitle:
    "Exposed cohort vs. a 20% holdout suppressed from all channels. Launched Jun 22, 2026 · final incrementality read Sep 20, 2026.",
  dataThrough: "Data through Aug 3, 2026 · snapshot refreshed Mondays",
  prelimBadge: "Preliminary — final read Sep 20",
};
