"use client";

import { useState, type CSSProperties } from "react";
import type {
  ChannelKey,
  ChannelSeries,
  DashboardData,
  SegmentData,
} from "@/lib/reengage/types";
import { CAMPAIGN } from "@/lib/reengage/types";

/* ---------------------------------- style ---------------------------------- */

const text12: CSSProperties = { fontSize: "0.75rem", lineHeight: 1.66, color: "var(--alp-token-text-secondary)" };
const text14: CSSProperties = { fontSize: "0.875rem", lineHeight: 1.57 };
const label12: CSSProperties = { ...text12, fontWeight: 500 };
const num14: CSSProperties = { ...text14, textAlign: "right", fontVariantNumeric: "tabular-nums" };
const badge: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 8px",
  borderRadius: "var(--alp-token-borderRadius-round)",
  background: "var(--alp-token-bg-neutralWeak)",
  border: "1px solid var(--alp-token-border-weak)",
  fontSize: "0.75rem",
  lineHeight: 1.66,
  color: "var(--alp-token-text-secondary)",
  fontWeight: 500,
};

const SERIES_COLORS = [
  "var(--alp-token-purple-900)",
  "var(--alp-token-purple-600)",
  "var(--alp-token-gray-800)",
  "var(--alp-token-purple-400)",
];
const seriesColor = (i: number) => SERIES_COLORS[i % SERIES_COLORS.length] ?? "var(--alp-token-gray-800)";

const AXIS_LABELS = [
  { label: "4%", y: 14 },
  { label: "3%", y: 54 },
  { label: "2%", y: 94 },
  { label: "1%", y: 134 },
  { label: "0%", y: 174 },
];
const WEEK_LABELS = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7"];

const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (n: number, d: number) => (d > 0 ? ((n / d) * 100).toFixed(1) : "0.0");
const money = (v: number) => (v >= 1 ? "$" + v.toFixed(1) + "M" : "$" + Math.round(v * 1000) + "K");

type Grain = "day" | "week";

const EMAIL_COLS = "76px 66px 86px 74px 68px 1fr 58px 104px 58px 48px";

// Funnel conversion rows: label | shared attainment axis | actual / goal
const FUNNEL_COLS = "148px 1fr 104px";
const ATTAINMENT_MAX = 150; // axis runs 0-150% of goal
const ATTAINMENT_TICKS = [0, 50, 100, 150];

const CHANNEL_TABS: { key: ChannelKey; label: string }[] = [
  { key: "email", label: "Email nurture" },
  { key: "incentive", label: "Incentive" },
  { key: "paid", label: "Paid" },
  { key: "sdr", label: "SDR" },
];

/* ------------------------------- trend chart ------------------------------- */

function TrendChart({ series, grain }: { series: ChannelSeries; grain: Grain }) {
  const points = grain === "day" ? series.day : series.week;
  const max = Math.max(
    1,
    ...points.flatMap((p) => series.keys.map((k) => p.values[k] ?? 0))
  );

  const W = 900;
  const H = 240;
  const padL = 44;
  const padR = 12;
  const padT = 12;
  const padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const x = (i: number) =>
    points.length <= 1 ? padL : padL + (i * innerW) / (points.length - 1);
  const y = (v: number) => padT + innerH - (v / max) * innerH;

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  // Label every point when few, otherwise thin them out.
  const labelStep = points.length > 8 ? Math.ceil(points.length / 7) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={label12}>
          {series.metricLabel} by {grain === "day" ? "day" : "week"}
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
          {series.keys.map((k, i) => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, ...text12 }}>
              <span style={{ width: 14, height: 3, borderRadius: 2, background: seriesColor(i) }} />
              {k}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {gridVals.map((v, i) => (
          <g key={`${v}-${i}`}>
            <line
              x1={padL}
              y1={y(v)}
              x2={W - padR}
              y2={y(v)}
              stroke={i === 0 ? "var(--alp-token-gray-400)" : "var(--alp-token-gray-200)"}
              strokeWidth={1}
            />
            <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--alp-token-gray-900)">
              {fmt(v)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % labelStep === 0 ? (
            <text
              key={p.label}
              x={x(i)}
              y={H - 10}
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
              fontSize={11}
              fill="var(--alp-token-gray-900)"
            >
              {p.label}
            </text>
          ) : null
        )}
        {series.keys.map((k, si) => {
          const path = points.map((p, i) => `${x(i)},${y(p.values[k] ?? 0)}`).join(" ");
          return (
            <polyline
              key={k}
              points={path}
              fill="none"
              stroke={seriesColor(si)}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
}

/* -------------------------------- funnel ---------------------------------- */

function FunnelPanel({
  exposed,
  mql,
  s0,
  s2,
  pipelineArr,
}: {
  exposed: number;
  mql: number;
  s0: number;
  s2: number;
  pipelineArr: number;
}) {
  const steps = [
    { label: "Exposed", value: fmt(exposed) },
    { label: "MQLs", value: fmt(mql) },
    { label: "S0", value: fmt(s0) },
    { label: "S2", value: fmt(s2) },
  ];

  const transitions = [
    { from: "Exposed", to: "MQL", actual: exposed > 0 ? (mql / exposed) * 100 : 0, plan: 3 },
    { from: "MQL", to: "S0", actual: mql > 0 ? (s0 / mql) * 100 : 0, plan: 20 },
    { from: "S0", to: "S2", actual: s0 > 0 ? (s2 / s0) * 100 : 0, plan: 43 },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        padding: "20px 24px",
        border: "1px solid var(--alp-token-border-weak)",
        borderRadius: "var(--alp-token-borderRadius-card)",
        background: "var(--alp-token-bg-neutralWeak)",
      }}
    >
      {/* Step counts */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
        {steps.map((s, i) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                padding: "10px 18px",
                background: "var(--alp-token-white)",
                border: "1px solid var(--alp-token-border-weak)",
                borderRadius: "var(--alp-token-borderRadius-button)",
                minWidth: 84,
              }}
            >
              <span style={{ fontSize: "0.6875rem", color: "var(--alp-token-text-secondary)", fontWeight: 500, letterSpacing: "0.02em" }}>
                {s.label.toUpperCase()}
              </span>
              <span style={{ fontSize: "1.375rem", lineHeight: 1.15, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {s.value}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <span style={{ color: "var(--alp-token-gray-400)", fontSize: 14, padding: "0 2px" }}>›</span>
            ) : null}
          </div>
        ))}
        <div style={{ width: 1, height: 44, background: "var(--alp-token-border-weak)", margin: "0 14px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "10px 18px" }}>
          <span style={{ fontSize: "0.6875rem", color: "var(--alp-token-text-secondary)", fontWeight: 500, letterSpacing: "0.02em" }}>
            PIPELINE
          </span>
          <span style={{ fontSize: "1.375rem", lineHeight: 1.15, fontWeight: 600, color: "var(--alp-token-purple-900)" }}>
            {money(pipelineArr)}
          </span>
        </div>
      </div>

      {/* Conversion vs. plan — shared attainment axis so steps with very
          different rates (3% vs. 43%) are directly comparable. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ ...text12, fontWeight: 500 }}>Step conversion — how each rate is tracking against its own goal</span>
          <span style={{ fontSize: "0.6875rem", color: "var(--alp-token-text-secondary)" }}>bar = % of goal reached</span>
        </div>

        {/* Shared axis header */}
        <div style={{ display: "grid", gridTemplateColumns: FUNNEL_COLS, gap: 16, alignItems: "end" }}>
          <span />
          <div style={{ position: "relative", height: 14 }}>
            {ATTAINMENT_TICKS.map((tick) => (
              <span
                key={tick}
                style={{
                  position: "absolute",
                  left: `${(tick / ATTAINMENT_MAX) * 100}%`,
                  transform: "translateX(-50%)",
                  fontSize: "0.6875rem",
                  color: tick === 100 ? "var(--alp-token-text-default)" : "var(--alp-token-text-secondary)",
                  fontWeight: tick === 100 ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {tick === 100 ? "goal" : `${tick}%`}
              </span>
            ))}
          </div>
          <span style={{ ...text12, textAlign: "right", fontWeight: 500 }}>actual / goal</span>
        </div>

        {transitions.map((t) => {
          const attainment = t.plan > 0 ? (t.actual / t.plan) * 100 : 0;
          const off = attainment < 80;
          const ahead = attainment >= 100;
          const barW = Math.min(100, (attainment / ATTAINMENT_MAX) * 100);
          const goalPos = (100 / ATTAINMENT_MAX) * 100;
          const barColor = off
            ? "var(--alp-token-text-warning)"
            : ahead
              ? "var(--alp-token-purple-900)"
              : "var(--alp-token-purple-600)";
          return (
            <div key={`${t.from}-${t.to}`} style={{ display: "grid", gridTemplateColumns: FUNNEL_COLS, gap: 16, alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <span style={{ ...text14, fontWeight: 500 }}>
                  {t.from} → {t.to}
                </span>
                <span style={{ fontSize: "0.6875rem", color: "var(--alp-token-text-secondary)" }}>
                  {attainment >= 100 ? "at or above goal" : `${(100 - attainment).toFixed(0)}% short of goal`}
                </span>
              </div>

              <div style={{ position: "relative", height: 26 }}>
                {/* track */}
                <div style={{ position: "absolute", top: 7, left: 0, right: 0, height: 12, borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-white)", border: "1px solid var(--alp-token-border-weak)" }} />
                {/* fill */}
                <div
                  style={{
                    position: "absolute",
                    top: 7,
                    left: 0,
                    height: 12,
                    width: `${barW}%`,
                    borderRadius: "var(--alp-token-borderRadius-round)",
                    background: barColor,
                  }}
                />
                {/* goal line, same x for every row */}
                <div style={{ position: "absolute", top: 0, bottom: 0, left: `${goalPos}%`, width: 2, background: "var(--alp-token-gray-1000)", borderRadius: 1 }} />
                {/* attainment label riding the bar end */}
                <span
                  style={{
                    position: "absolute",
                    top: 5,
                    left: `${barW}%`,
                    transform: "translateX(6px)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    color: off ? "var(--alp-token-text-warning)" : "var(--alp-token-text-default)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {attainment.toFixed(0)}%
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 4 }}>
                <span style={{ ...text14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {t.actual.toFixed(t.actual < 10 ? 1 : 0)}%
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--alp-token-text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                  / {t.plan}%
                </span>
              </div>
            </div>
          );
        })}

        <span style={text12}>
          Every bar is measured against its own goal, so the three steps are comparable even though the underlying rates differ (3% / 20% / 43%). The black line is the goal; amber is more than 20% short. Raw rates on the right.
        </span>
      </div>
    </div>
  );
}

function GrainToggle({ grain, onChange }: { grain: Grain; onChange: (g: Grain) => void }) {
  const btn = (active: boolean): CSSProperties => ({
    border: "none",
    background: active ? "var(--alp-token-bg-neutralSubtle)" : "var(--alp-token-white)",
    padding: "5px 12px",
    fontFamily: "inherit",
    fontSize: "0.8125rem",
    fontWeight: active ? 600 : 400,
    color: "var(--alp-token-text-default)",
    cursor: "pointer",
  });
  return (
    <div style={{ display: "inline-flex", border: "1px solid var(--alp-token-border-default)", borderRadius: "var(--alp-token-borderRadius-button)", overflow: "hidden" }}>
      <button onClick={() => onChange("day")} style={btn(grain === "day")}>Day</button>
      <button onClick={() => onChange("week")} style={btn(grain === "week")}>Week</button>
    </div>
  );
}

/* -------------------------------- dashboard -------------------------------- */

export default function Dashboard({ data }: { data: DashboardData }) {
  const [channel, setChannel] = useState<ChannelKey>("email");
  const [grain, setGrain] = useState<Grain>("week");
  const d: SegmentData = data.all;

  const expRate = (d.expMql / d.exposed) * 100;
  const holdRate = (d.holdMql / d.holdout) * 100;
  const lift = Math.round((expRate / holdRate - 1) * 100);
  const [lo, hi] = d.ci;
  const scale = (v: number) => ((v + 50) / 250) * 100;
  const px = (i: number) => 40 + (i * 590) / 6;
  const py = (v: number) => 170 - v * 40;
  const pts = (arr: number[]) => arr.map((v, i) => px(i) + "," + py(v)).join(" ");

  const tabBtn = (active: boolean): CSSProperties => ({
    border: "none",
    background: "transparent",
    padding: "8px 12px 10px",
    fontFamily: "inherit",
    fontSize: "0.875rem",
    lineHeight: 1.57,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    color: active ? "var(--alp-token-text-default)" : "var(--alp-token-text-secondary)",
    boxShadow: active ? "inset 0 -2px 0 0 var(--alp-token-purple-900)" : "none",
    marginBottom: -1,
  });

  const email = d.email.map((e) => ({
    ...e,
    clickRate: pct(e.clicks, e.delivered),
    ctor: pct(e.clicks, e.opens),
    openRate: pct(e.opens, e.delivered),
    clickRateW: Math.min(100, (e.clicks / Math.max(1, e.delivered)) * 100 * 20),
    capture: 100 - e.warm,
  }));

  const bars = (rows: [string, number][]) => {
    const max = rows[0]?.[1] ?? 0;
    return rows.map(([label, v]) => ({
      label,
      value: fmt(v),
      w: max > 0 ? (v / max) * 100 : 0,
    }));
  };

  const activeSeries = d.series[channel];

  // Cohort email list health — fatigue signal across all sends.
  const totalUnsubs = d.email.reduce((s, e) => s + e.unsubs, 0);
  const totalSpam = d.email.reduce((s, e) => s + e.spam, 0);
  const totalDelivered = d.email.reduce((s, e) => s + e.delivered, 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--alp-token-bg-default)", color: "var(--alp-token-text-default)", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", letterSpacing: "0.01em" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "24px 40px 72px" }}>
        {/* Header */}
        <header style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.12em" }}>VANTA</span>
              <div style={{ width: 1, height: 16, background: "var(--alp-token-border-weak)" }} />
              <span style={text12}>{CAMPAIGN.team}</span>
            </div>
            <span style={text12}>{CAMPAIGN.dataThrough}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 style={{ margin: 0, fontSize: "1.5rem", lineHeight: 1.17, fontWeight: 600 }}>{CAMPAIGN.title}</h1>
              <span style={badge}>{CAMPAIGN.phase}</span>
              <span style={badge}>{CAMPAIGN.key}</span>
            </div>
            <p style={{ margin: 0, ...text14, color: "var(--alp-token-text-secondary)", maxWidth: 760 }}>{CAMPAIGN.subtitle}</p>
          </div>
          <span style={text12}>Exposed n = {fmt(d.exposed)} · Holdout n = {fmt(d.holdout)}</span>
        </header>

        <div style={{ height: 1, background: "var(--alp-token-border-weak)", margin: "24px 0 40px" }} />

        <main style={{ display: "flex", flexDirection: "column", gap: 56 }}>
          {/* Incrementality */}
          <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: "1.125rem", lineHeight: 1.22, fontWeight: 600 }}>Incrementality</h2>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 8px", borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-bg-accentBlueWeak)", color: "var(--alp-token-text-accentBlue)", fontSize: "0.75rem", lineHeight: 1.66, fontWeight: 500 }}>
                ⏳ {CAMPAIGN.prelimBadge}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "2px 8px",
                  borderRadius: "var(--alp-token-borderRadius-round)",
                  background: d.integrity.leaks === 0 ? "var(--alp-token-bg-successWeak)" : "var(--alp-token-bg-warningWeak)",
                  color: d.integrity.leaks === 0 ? "var(--alp-token-text-success)" : "var(--alp-token-text-warning)",
                  fontSize: "0.75rem",
                  lineHeight: 1.66,
                  fontWeight: 500,
                }}
                title="Any holdout contact receiving a send voids the incrementality read. Checked after every send."
              >
                {d.integrity.leaks === 0 ? "✓" : "⚠"} Holdout integrity: {d.integrity.leaks === 0 ? "no leaks" : `${fmt(d.integrity.leaks)} leaked`} · {d.integrity.sendsChecked} sends checked {d.integrity.checkedOn}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 40, alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={text12}>Exposed MQL rate</span>
                    <span style={{ fontSize: "2rem", lineHeight: 1.2, fontWeight: 600 }}>{expRate.toFixed(1)}%</span>
                    <span style={text12}>{fmt(d.expMql)} MQLs</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={text12}>Holdout MQL rate</span>
                    <span style={{ fontSize: "2rem", lineHeight: 1.2, fontWeight: 600, color: "var(--alp-token-text-secondary)" }}>{holdRate.toFixed(1)}%</span>
                    <span style={text12}>{fmt(d.holdMql)} MQLs</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={text12}>Observed lift, exposed vs. holdout</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontSize: "2rem", lineHeight: 1.2, fontWeight: 600 }}>{(lift >= 0 ? "+" : "") + lift}%</span>
                    <span style={text12}>not yet significant</span>
                  </div>
                  <div style={{ position: "relative", height: 4, borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-gray-300)", marginTop: 6 }}>
                    <div style={{ position: "absolute", top: 0, bottom: 0, borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-purple-400)", left: `${scale(lo)}%`, width: `${scale(hi) - scale(lo)}%` }} />
                    <div style={{ position: "absolute", top: -4, bottom: -4, width: 1, background: "var(--alp-token-gray-800)", left: "20%" }} />
                    <div style={{ position: "absolute", top: -3, width: 10, height: 10, borderRadius: "50%", background: "var(--alp-token-purple-900)", border: "2px solid var(--alp-token-white)", boxSizing: "border-box", transform: "translateX(-50%)", left: `${scale(lift)}%` }} />
                  </div>
                  <span style={text12}>95% CI {(lo >= 0 ? "+" : "−") + Math.abs(lo)}% to +{hi}% · zero marked at tick</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={label12}>Cumulative MQL conversion since launch</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--alp-token-text-secondary)" }}>
                      <span style={{ width: 14, height: 3, borderRadius: 2, background: "var(--alp-token-purple-800)" }} />Exposed
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--alp-token-text-secondary)" }}>
                      <span style={{ width: 14, height: 0, borderTop: "2px dashed var(--alp-token-gray-800)" }} />Holdout
                    </span>
                  </div>
                </div>
                <svg viewBox="0 0 640 200" style={{ width: "100%", height: "auto", display: "block" }}>
                  {[10, 50, 90, 130].map((yy) => (
                    <line key={yy} x1={40} y1={yy} x2={630} y2={yy} stroke="var(--alp-token-gray-200)" strokeWidth={1} />
                  ))}
                  <line x1={40} y1={170} x2={630} y2={170} stroke="var(--alp-token-gray-400)" strokeWidth={1} />
                  {AXIS_LABELS.map(({ label, y }) => (
                    <text key={label} x={32} y={y} textAnchor="end" fontSize={11} fill="var(--alp-token-gray-900)">{label}</text>
                  ))}
                  {WEEK_LABELS.map((w, i) => (
                    <text key={w} x={px(i)} y={192} textAnchor={i === 0 ? "start" : i === 6 ? "end" : "middle"} fontSize={11} fill="var(--alp-token-gray-900)">{w}</text>
                  ))}
                  <polyline points={pts(d.hold)} fill="none" stroke="var(--alp-token-gray-800)" strokeWidth={2} strokeDasharray="4 3" />
                  <polyline points={pts(d.exp)} fill="none" stroke="var(--alp-token-purple-800)" strokeWidth={2.5} />
                  <circle cx={px(d.hold.length - 1)} cy={py(d.hold.at(-1) ?? 0)} r={3.5} fill="var(--alp-token-gray-800)" />
                  <circle cx={px(d.exp.length - 1)} cy={py(d.exp.at(-1) ?? 0)} r={3.5} fill="var(--alp-token-purple-800)" />
                </svg>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 16px", borderRadius: "var(--alp-token-borderRadius-card)", background: "var(--alp-token-bg-neutralWeak)", maxWidth: 860 }}>
              <span style={{ fontSize: 14, color: "var(--alp-token-icon-secondary)", marginTop: 1 }}>ⓘ</span>
              <p style={{ margin: 0, ...text12 }}>
                Detectable-lift threshold: with {fmt(d.holdout)} contacts in holdout, this test can detect a meaningful lift on MQLs but not on rarer events. Read S0, S2, and pipeline as directional at this sample size.
              </p>
            </div>
          </section>

          {/* Targets + funnel conversion */}
          <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: "1.125rem", lineHeight: 1.22, fontWeight: 600 }}>Targets</h2>
              <span style={text12}>Exposed cohort to date vs. brief commitments</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {d.targets.map((t) => {
                const share = Math.min(100, (t.actual / t.target) * 100);
                return (
                  <div key={t.label} style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 20px", border: "1px solid var(--alp-token-border-weak)", borderRadius: "var(--alp-token-borderRadius-card)" }}>
                    <span style={text12}>{t.label}</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: "1.5rem", lineHeight: 1.17, fontWeight: 600 }}>
                        {t.money ? money(t.actual) : fmt(t.actual)}
                      </span>
                      <span style={{ ...text14, color: "var(--alp-token-text-secondary)" }}>
                        / {t.money ? money(t.target) : fmt(t.target)}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-gray-300)" }}>
                      <div style={{ height: 6, borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-purple-800)", width: `${share}%` }} />
                    </div>
                    <span style={text12}>{share.toFixed(0)}% of target</span>
                  </div>
                );
              })}
            </div>

            <FunnelPanel
              exposed={d.exposed}
              mql={d.funnel.mql}
              s0={d.funnel.s0}
              s2={d.funnel.s2}
              pipelineArr={d.funnel.pipelineArr}
            />
          </section>

          {/* Audience behavior */}
          <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: "1.125rem", lineHeight: 1.22, fontWeight: 600 }}>Audience behavior</h2>
              <span style={text12}>Did re-engagement move intent, not just conversions</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 0.6fr", gap: 40, alignItems: "start", maxWidth: 860 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <span style={label12}>Avg lead-score change since launch</span>
                {[
                  { label: "Exposed", text: `+${d.scoreExp.toFixed(1)} pts`, w: Math.min(100, d.scoreExp * 10), color: "var(--alp-token-purple-800)", muted: false },
                  { label: "Holdout", text: `+${d.scoreHold.toFixed(1)} pts`, w: Math.min(100, d.scoreHold * 10), color: "var(--alp-token-gray-700)", muted: true },
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={text14}>{r.label}</span>
                      <span style={{ ...text14, fontWeight: 600, color: r.muted ? "var(--alp-token-text-secondary)" : undefined }}>{r.text}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-gray-300)" }}>
                      <div style={{ height: 6, borderRadius: "var(--alp-token-borderRadius-round)", background: r.color, width: `${r.w}%` }} />
                    </div>
                  </div>
                ))}
                <span style={text12}>
                  Score delta vs. the day-0 baseline snapshot. Captures warming that MQL counts miss.
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={label12}>Engaged with any channel</span>
                <span style={{ fontSize: "2rem", lineHeight: 1.2, fontWeight: 600 }}>{d.engaged}%</span>
                <span style={text12}>of exposed cohort — opened, clicked, or replied at least once</span>
              </div>
            </div>
          </section>

          {/* Channel performance — primary section */}
          <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: "1.125rem", lineHeight: 1.22, fontWeight: 600 }}>Channel performance</h2>
                <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-bg-warningWeak)", color: "var(--alp-token-text-warning)", fontSize: "0.75rem", lineHeight: 1.66, fontWeight: 500 }}>
                  Directional — engagement, not lift
                </span>
              </div>
              <p style={{ margin: 0, ...text12, maxWidth: 760 }}>
                The holdout is suppressed from every channel, so incrementality measures the bundle. These panels show per-channel engagement only — no per-channel pipeline attribution.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: "1px solid var(--alp-token-border-weak)" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {CHANNEL_TABS.map((t) => (
                  <button key={t.key} onClick={() => setChannel(t.key)} style={tabBtn(channel === t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ paddingBottom: 8 }}>
                <GrainToggle grain={grain} onChange={setGrain} />
              </div>
            </div>

            {/* Trend chart — every channel */}
            <TrendChart series={activeSeries} grain={grain} />

            {/* Per-channel detail */}
            {channel === "email" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "grid", gridTemplateColumns: EMAIL_COLS, gap: 12, padding: "8px 0", borderBottom: "1px solid var(--alp-token-border-weak)" }}>
                    <span style={label12}>Email</span>
                    <span style={label12}>Sent</span>
                    <span style={{ ...label12, textAlign: "right" }}>Delivered</span>
                    <span style={{ ...label12, textAlign: "right" }}>Opens*</span>
                    <span style={{ ...label12, textAlign: "right" }}>Clicks</span>
                    <span style={label12}>Click rate</span>
                    <span style={{ ...label12, textAlign: "right" }}>CTOR</span>
                    <span style={{ ...label12, textAlign: "right" }}>Warm / capture</span>
                    <span style={{ ...label12, textAlign: "right" }}>MQLs</span>
                    <span style={{ ...label12, textAlign: "right" }}>S0</span>
                  </div>
                  {email.map((e) => (
                    <div key={e.name} style={{ display: "grid", gridTemplateColumns: EMAIL_COLS, gap: 12, padding: "10px 0", borderBottom: "1px solid var(--alp-token-gray-200)", alignItems: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, ...text14, fontWeight: 500 }}>
                        {e.name}
                        {e.note ? <span style={{ fontSize: "0.6875rem", fontWeight: 400, color: "var(--alp-token-text-warning)" }}>●</span> : null}
                      </span>
                      <span style={text12}>{e.sentOn}</span>
                      <span style={num14}>{fmt(e.delivered)}</span>
                      <span style={{ ...num14, color: "var(--alp-token-text-secondary)" }}>{fmt(e.opens)}</span>
                      <span style={{ ...num14, fontWeight: 600 }}>{fmt(e.clicks)}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-gray-300)" }}>
                          <div style={{ height: 6, borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-purple-800)", width: `${e.clickRateW}%` }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", fontVariantNumeric: "tabular-nums", width: 34 }}>{e.clickRate}%</span>
                      </div>
                      <span style={num14}>{e.ctor}%</span>
                      <span style={num14}>{e.warm}% / {e.capture}%</span>
                      <span style={{ ...num14, fontWeight: 600 }}>{fmt(e.mqls)}</span>
                      <span style={{ ...num14, fontWeight: 600 }}>{fmt(e.s0)}</span>
                    </div>
                  ))}
                  <span style={{ ...text12, paddingTop: 10 }}>
                    Click rate is the primary KPI. *Opens are directional only — Apple Mail Privacy Protection inflates them; bot-filtered events excluded. Warm = clicked to an ungated content path (report, customer story); capture = demo or offer path. MQLs are attributed directly via MQL_UTM_CONTENT; S0 counts contacts who clicked that send and reached S0 within 30 days — descriptive, not causal. ● = in flight.
                  </span>
                </div>

                {/* List health & fatigue */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                    <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600 }}>List health &amp; fatigue</h3>
                    <span style={text12}>Five sends in five weeks to a cohort that already went cold once</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 200px))", gap: 32 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={label12}>Cumulative unsubscribes</span>
                      <span style={{ fontSize: "1.5rem", lineHeight: 1.2, fontWeight: 600 }}>{fmt(totalUnsubs)}</span>
                      <span style={text12}>{pct(totalUnsubs, totalDelivered)}% of delivered</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={label12}>Spam complaints</span>
                      <span style={{ fontSize: "1.5rem", lineHeight: 1.2, fontWeight: 600, color: totalSpam / Math.max(1, totalDelivered) > 0.001 ? "var(--alp-token-text-warning)" : undefined }}>
                        {fmt(totalSpam)}
                      </span>
                      <span style={text12}>{pct(totalSpam, totalDelivered)}% — keep under 0.10%</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={label12}>Cost of the play</span>
                      <span style={{ fontSize: "1.5rem", lineHeight: 1.2, fontWeight: 600 }}>
                        {totalUnsubs > 0 ? (d.funnel.mql / totalUnsubs).toFixed(1) : "—"}
                      </span>
                      <span style={text12}>MQLs per unsubscribe</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "88px 1fr 100px 100px 110px", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--alp-token-border-weak)" }}>
                      <span style={label12}>Email</span>
                      <span style={label12} />
                      <span style={{ ...label12, textAlign: "right" }}>Unsubs</span>
                      <span style={{ ...label12, textAlign: "right" }}>Unsub rate</span>
                      <span style={{ ...label12, textAlign: "right" }}>Spam</span>
                    </div>
                    {email.map((e) => (
                      <div key={e.name} style={{ display: "grid", gridTemplateColumns: "88px 1fr 100px 100px 110px", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--alp-token-gray-200)", alignItems: "center" }}>
                        <span style={{ ...text14, fontWeight: 500 }}>{e.name}</span>
                        <span />
                        <span style={num14}>{fmt(e.unsubs)}</span>
                        <span style={num14}>{pct(e.unsubs, e.delivered)}%</span>
                        <span style={num14}>{fmt(e.spam)}</span>
                      </div>
                    ))}
                    <span style={{ ...text12, paddingTop: 10 }}>
                      Rising unsub rate across sends is the signal to shorten the sequence. This is the input to whether the play gets run again — pipeline gained vs. marketable database lost.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {channel === "incentive" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
                {bars(d.inc).map((s) => (
                  <div key={s.label} style={{ display: "grid", gridTemplateColumns: "160px 1fr 60px", gap: 16, alignItems: "center" }}>
                    <span style={text14}>{s.label}</span>
                    <div style={{ height: 20, borderRadius: "var(--alp-token-borderRadius-xs)", background: "var(--alp-token-gray-200)" }}>
                      <div style={{ height: 20, borderRadius: "var(--alp-token-borderRadius-xs)", background: "var(--alp-token-purple-800)", width: `${s.w}%` }} />
                    </div>
                    <span style={{ ...text14, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                  </div>
                ))}
                <span style={text12}>Theragun offer, sends Sep 24. Redemptions tracked via its own UTM (fy27q3_nurt_eng_events-re-engage-incentive-offer_global) — the cleanest email attribution in the campaign. Demo completion from SFDC.</span>
              </div>
            )}

            {channel === "paid" && (
              <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr 1fr", gap: 16, padding: "8px 0", borderBottom: "1px solid var(--alp-token-border-weak)" }}>
                  <span style={label12}>Platform</span>
                  <span style={{ ...label12, textAlign: "right" }}>Reach</span>
                  <span style={{ ...label12, textAlign: "right" }}>Avg frequency</span>
                  <span style={{ ...label12, textAlign: "right" }}>CTR</span>
                </div>
                {d.paid.map((p) => (
                  <div key={p.platform} style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr 1fr", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--alp-token-gray-200)" }}>
                    <span style={{ ...text14, fontWeight: 500 }}>{p.platform}</span>
                    <span style={num14}>{p.reach}</span>
                    <span style={num14}>{p.freq}</span>
                    <span style={num14}>{p.ctr}%</span>
                  </div>
                ))}
                <span style={{ ...text12, paddingTop: 10 }}>
                  Platform-level aggregates from LinkedIn / Meta exports. Paid runs on evergreen campaigns and UTMs, so these cannot be tied to individual cohort contacts.
                </span>
              </div>
            )}

            {channel === "sdr" &&
              (d.sdr ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
                  {bars(d.sdr).map((s) => (
                    <div key={s.label} style={{ display: "grid", gridTemplateColumns: "160px 1fr 60px", gap: 16, alignItems: "center" }}>
                      <span style={text14}>{s.label}</span>
                      <div style={{ height: 20, borderRadius: "var(--alp-token-borderRadius-xs)", background: "var(--alp-token-gray-200)" }}>
                        <div style={{ height: 20, borderRadius: "var(--alp-token-borderRadius-xs)", background: "var(--alp-token-purple-800)", width: `${s.w}%` }} />
                      </div>
                      <span style={{ ...text14, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                    </div>
                  ))}
                  <span style={text12}>Identified via SFDC campaign membership (not UTMs). S0 created within 30 days of a held meeting.</span>
                </div>
              ) : (
                <p style={{ margin: 0, ...text14, color: "var(--alp-token-text-secondary)" }}>SDR blitz data not available yet.</p>
              ))}
          </section>

          {/* Methodology */}
          <footer style={{ borderTop: "1px solid var(--alp-token-border-weak)", paddingTop: 20 }}>
            <p style={{ margin: 0, ...text12, maxWidth: 860 }}>
              Methodology: all metrics join to the audience assignment table (one row per contact: exposed/holdout, segment, source event, list, assignment date), keyed on {CAMPAIGN.key}. Holdout is 10% cut per segment from the upmarket and downmarket lists, suppressed from paid, email, incentive, and SDR. Email engagement is keyed on utm_campaign + utm_content (nu-1..nu-4); SDR via SFDC campaign membership. Built on Snowflake · Vercel.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
