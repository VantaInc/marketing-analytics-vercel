// Fixture data for pre-launch review. Shaped like the live query output.
// NOT real campaign numbers — active while REENGAGE_USE_FIXTURES=true.
import type { ChannelSeries, DashboardData, SeriesPoint } from "./types";

const DAY_LABELS = [
  "Aug 19", "Aug 20", "Aug 21", "Aug 22", "Aug 23", "Aug 24", "Aug 25",
  "Aug 26", "Aug 27", "Aug 28", "Aug 29", "Aug 30", "Aug 31", "Sep 1",
];

const WEEK_LABELS = [
  "Wk of Aug 17", "Wk of Aug 24", "Wk of Aug 31",
  "Wk of Sep 7", "Wk of Sep 14", "Wk of Sep 21",
];

// Build SeriesPoint[] from parallel arrays keyed by series name.
function series(labels: string[], data: Record<string, number[]>): SeriesPoint[] {
  return labels.map((label, i) => {
    const values: Record<string, number> = {};
    for (const key of Object.keys(data)) {
      values[key] = data[key]?.[i] ?? 0;
    }
    return { label, values };
  });
}

// Email — unique clicks per send. Sends spike on day 0-1 then decay;
// nu-1 Aug 19, nu-2 Aug 27, nu-3 Sep 4, nu-4 Sep 15.
const emailSeries: ChannelSeries = {
  metricLabel: "Unique clicks",
  keys: ["nu-1", "nu-2", "nu-3", "nu-4"],
  day: series(DAY_LABELS, {
    "nu-1": [96, 54, 28, 17, 11, 8, 6, 5, 4, 3, 3, 2, 2, 2],
    "nu-2": [0, 0, 0, 0, 0, 0, 0, 0, 71, 41, 22, 13, 9, 7],
    "nu-3": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "nu-4": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  }),
  week: series(WEEK_LABELS, {
    "nu-1": [217, 24, 6, 3, 2, 1],
    "nu-2": [0, 134, 31, 8, 4, 2],
    "nu-3": [0, 0, 0, 88, 21, 6],
    "nu-4": [0, 0, 0, 0, 52, 14],
  }),
};

// Incentive — the Theragun offer funnel over time (sends Sep 24; fixtures
// show the ramp so the panel has shape pre-launch).
const incentiveSeries: ChannelSeries = {
  metricLabel: "Count",
  keys: ["Clicks", "Redemptions", "Demos completed"],
  day: series(DAY_LABELS, {
    Clicks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 41, 26],
    Redemptions: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 12],
    "Demos completed": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  }),
  week: series(WEEK_LABELS, {
    Clicks: [0, 0, 0, 0, 0, 112],
    Redemptions: [0, 0, 0, 0, 0, 48],
    "Demos completed": [0, 0, 0, 0, 0, 11],
  }),
};

// Paid — platform-level clicks (no person-level path; aggregates only).
const paidSeries: ChannelSeries = {
  metricLabel: "Clicks",
  keys: ["LinkedIn", "Meta"],
  day: series(DAY_LABELS, {
    LinkedIn: [188, 176, 164, 141, 96, 88, 152, 168, 171, 159, 148, 102, 94, 147],
    Meta: [242, 231, 218, 187, 141, 132, 205, 224, 232, 214, 198, 149, 138, 201],
  }),
  week: series(WEEK_LABELS, {
    LinkedIn: [1005, 1044, 921, 887, 842, 798],
    Meta: [1351, 1418, 1266, 1198, 1142, 1087],
  }),
};

// SDR — blitz activity over time.
const sdrSeries: ChannelSeries = {
  metricLabel: "Count",
  keys: ["Contacted", "Meetings held", "S0 created"],
  day: series(DAY_LABELS, {
    Contacted: [0, 0, 0, 118, 142, 131, 0, 0, 126, 134, 121, 98, 0, 0],
    "Meetings held": [0, 0, 0, 4, 9, 11, 0, 0, 12, 14, 13, 9, 0, 0],
    "S0 created": [0, 0, 0, 1, 2, 3, 0, 0, 4, 5, 4, 3, 0, 0],
  }),
  week: series(WEEK_LABELS, {
    Contacted: [391, 479, 264, 106, 0, 0],
    "Meetings held": [24, 48, 31, 15, 0, 0],
    "S0 created": [6, 16, 11, 5, 0, 0],
  }),
};

export const FIXTURES: DashboardData = {
  all: {
    exposed: 8265,
    holdout: 918,
    expMql: 212,
    holdMql: 20,
    ci: [-7, 79],
    exp: [0.4, 0.9, 1.5, 2.0, 2.5, 2.9, 3.2],
    hold: [0.3, 0.7, 1.2, 1.6, 2.0, 2.3, 2.5],
    integrity: { leaks: 0, sendsChecked: 3, checkedOn: "Sep 5" },
    targets: [
      { label: "MQLs", actual: 212, target: 450 },
      { label: "S0 opportunities", actual: 38, target: 90 },
      { label: "S2 opportunities", actual: 21, target: 65 },
      { label: "Pipeline", actual: 0.84, target: 2.6, money: true },
    ],
    funnel: { mql: 212, s0: 38, s2: 21, pipelineArr: 0.84 },
    scoreExp: 6.4,
    scoreHold: 1.1,
    engaged: 38,
    email: [
      { name: "nu-1", sentOn: "Aug 19", delivered: 7940, opens: 4291, clicks: 253, unsubs: 38, spam: 6, warm: 62, mqls: 41, s0: 9 },
      { name: "nu-2", sentOn: "Aug 27", delivered: 7802, opens: 3588, clicks: 181, unsubs: 31, spam: 4, warm: 58, mqls: 58, s0: 14 },
      { name: "nu-3", sentOn: "Sep 4", delivered: 7654, opens: 3062, clicks: 115, unsubs: 24, spam: 3, warm: 55, mqls: 26, s0: 5 },
      { name: "nu-4", sentOn: "Sep 15", delivered: 4120, opens: 1730, clicks: 68, unsubs: 14, spam: 2, warm: 60, mqls: 31, s0: 7, note: "in flight" },
    ],
    series: {
      email: emailSeries,
      incentive: incentiveSeries,
      paid: paidSeries,
      sdr: sdrSeries,
    },
    inc: [
      ["Redemptions", 214],
      ["Demos booked", 96],
      ["Demos completed", 61],
    ],
    paid: [
      { platform: "LinkedIn", reach: "48K", freq: "4.2", ctr: "0.61" },
      { platform: "Meta", reach: "96K", freq: "6.8", ctr: "0.38" },
    ],
    sdr: [
      ["Contacted", 1240],
      ["Meetings held", 118],
      ["S0 created", 38],
    ],
  },
};
