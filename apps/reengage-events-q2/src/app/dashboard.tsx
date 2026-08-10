"use client";

import { useState, type CSSProperties } from "react";
import type { DashboardData, Segment, SegmentData } from "@/lib/reengage/types";
import { CAMPAIGN } from "@/lib/reengage/types";

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

const fmt = (n: number) => n.toLocaleString("en-US");
const money = (v: number) => (v >= 1 ? "$" + v.toFixed(1) + "M" : "$" + Math.round(v * 1000) + "K");

const OVERLAP_COLORS = [
  "var(--alp-token-purple-1000)",
  "var(--alp-token-purple-800)",
  "var(--alp-token-purple-600)",
  "var(--alp-token-purple-400)",
  "var(--alp-token-gray-400)",
];
const overlapColor = (i: number) => OVERLAP_COLORS[i % OVERLAP_COLORS.length] ?? "var(--alp-token-gray-400)";

const AXIS_LABELS = [
  { label: "4%", y: 14 },
  { label: "3%", y: 54 },
  { label: "2%", y: 94 },
  { label: "1%", y: 134 },
  { label: "0%", y: 174 },
];

const WEEK_LABELS = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7"];

type Channel = "email" | "incentive" | "paid" | "sdr";

export default function Dashboard({ data }: { data: DashboardData }) {
  const [seg, setSeg] = useState<Segment>("all");
  const [channel, setChannel] = useState<Channel>("email");
  const d: SegmentData = data[seg];

  const expRate = (d.expMql / d.exposed) * 100;
  const holdRate = (d.holdMql / d.holdout) * 100;
  const lift = Math.round((expRate / holdRate - 1) * 100);
  const [lo, hi] = d.ci;
  const scale = (v: number) => ((v + 50) / 250) * 100;
  const px = (i: number) => 40 + (i * 590) / 6;
  const py = (v: number) => 170 - v * 40;
  const pts = (arr: number[]) => arr.map((v, i) => px(i) + "," + py(v)).join(" ");

  const segBtn = (active: boolean): CSSProperties => ({
    border: "none",
    background: active ? "var(--alp-token-bg-neutralSubtle)" : "var(--alp-token-white)",
    padding: "6px 14px",
    fontFamily: "inherit",
    fontSize: "0.875rem",
    lineHeight: 1.57,
    fontWeight: active ? 600 : 400,
    color: "var(--alp-token-text-default)",
    cursor: "pointer",
  });
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

  const targets = d.targets.map((t) => {
    const r = t.actual / t.pace;
    return {
      label: t.label,
      actualText: t.money ? money(t.actual) : fmt(t.actual),
      targetText: t.money ? money(t.target) : fmt(t.target),
      paceText: t.money ? money(t.pace) : fmt(t.pace),
      pct: Math.min(100, (t.actual / t.target) * 100),
      pacePct: Math.min(100, (t.pace / t.target) * 100),
      status: r >= 1 ? "Ahead of pace" : r >= 0.8 ? "On pace" : "Behind pace",
      statusBg: r >= 1 ? "var(--alp-token-bg-successWeak)" : r >= 0.8 ? "var(--alp-token-bg-neutralWeak)" : "var(--alp-token-bg-warningWeak)",
      statusColor: r >= 1 ? "var(--alp-token-text-success)" : r >= 0.8 ? "var(--alp-token-text-secondary)" : "var(--alp-token-text-warning)",
    };
  });

  const email = d.email.map((e) => {
    const ctr = (e.clicks / e.delivered) * 100;
    return {
      ...e,
      deliveredText: fmt(e.delivered),
      clicksText: fmt(e.clicks),
      ctr: ctr.toFixed(1),
      ctrW: Math.min(100, (ctr / 5) * 100),
      capture: 100 - e.warm,
    };
  });

  const bars = (rows: [string, number][]) => {
    const max = rows[0]?.[1] ?? 0;
    return rows.map(([label, v]) => ({
      label,
      value: fmt(v),
      w: max > 0 ? (v / max) * 100 : 0,
    }));
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--alp-token-bg-default)", color: "var(--alp-token-text-default)", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", letterSpacing: "0.01em" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "24px 40px 72px" }}>
        {/* Header */}
        <header style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
            <p style={{ margin: 0, ...text14, color: "var(--alp-token-text-secondary)", maxWidth: 720 }}>{CAMPAIGN.subtitle}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "inline-flex", border: "1px solid var(--alp-token-border-default)", borderRadius: "var(--alp-token-borderRadius-button)", overflow: "hidden" }}>
              <button onClick={() => setSeg("all")} style={segBtn(seg === "all")}>All contacts</button>
              <button onClick={() => setSeg("up")} style={segBtn(seg === "up")}>Upmarket</button>
              <button onClick={() => setSeg("down")} style={segBtn(seg === "down")}>Downmarket</button>
            </div>
            <span style={text12}>Exposed n = {fmt(d.exposed)} · Holdout n = {fmt(d.holdout)}</span>
          </div>
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
                  {[10, 50, 90, 130].map((y) => (
                    <line key={y} x1={40} y1={y} x2={630} y2={y} stroke="var(--alp-token-gray-200)" strokeWidth={1} />
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
                Detectable-lift threshold: with {fmt(d.holdout)} contacts in holdout and a ~2.5% base rate, this test can detect a meaningful lift on MQLs but not on rarer events. S0, S2, and pipeline are tracked vs. target below, not vs. holdout.
              </p>
            </div>
          </section>

          {/* Targets */}
          <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: "1.125rem", lineHeight: 1.22, fontWeight: 600 }}>Targets</h2>
              <span style={text12}>Pace assumes linear accrual over 90 days</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {targets.map((t) => (
                <div key={t.label} style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 20px", border: "1px solid var(--alp-token-border-weak)", borderRadius: "var(--alp-token-borderRadius-card)" }}>
                  <span style={text12}>{t.label}</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: "1.5rem", lineHeight: 1.17, fontWeight: 600 }}>{t.actualText}</span>
                    <span style={{ ...text14, color: "var(--alp-token-text-secondary)" }}>/ {t.targetText}</span>
                  </div>
                  <div style={{ position: "relative", height: 6, borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-gray-300)" }}>
                    <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-purple-800)", width: `${t.pct}%` }} />
                    <div style={{ position: "absolute", top: -3, bottom: -3, width: 2, borderRadius: 1, background: "var(--alp-token-gray-1000)", left: `${t.pacePct}%` }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 8px", borderRadius: "var(--alp-token-borderRadius-round)", fontSize: "0.75rem", lineHeight: 1.66, fontWeight: 500, background: t.statusBg, color: t.statusColor }}>{t.status}</span>
                    <span style={text12}>pace: {t.paceText}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Audience behavior */}
          <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ margin: 0, fontSize: "1.125rem", lineHeight: 1.22, fontWeight: 600 }}>Audience behavior</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 0.7fr 1.3fr", gap: 40, alignItems: "start" }}>
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
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={label12}>Engaged with any channel</span>
                <span style={{ fontSize: "2rem", lineHeight: 1.2, fontWeight: 600 }}>{d.engaged}%</span>
                <span style={text12}>of exposed cohort</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={label12}>Channel overlap, exposed cohort</span>
                <div style={{ display: "flex", height: 12, borderRadius: "var(--alp-token-borderRadius-round)", overflow: "hidden", gap: 2 }}>
                  {d.overlap.map(([label, pct], i) => (
                    <div key={label} style={{ height: 12, background: overlapColor(i), width: `${pct}%` }} />
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
                  {d.overlap.map(([label, pct], i) => (
                    <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 6, ...text12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: overlapColor(i) }} />
                      {label} · {pct}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Channel performance */}
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: "1.125rem", lineHeight: 1.22, fontWeight: 600 }}>Channel performance</h2>
                <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-bg-warningWeak)", color: "var(--alp-token-text-warning)", fontSize: "0.75rem", lineHeight: 1.66, fontWeight: 500 }}>
                  Directional — engagement, not lift
                </span>
              </div>
              <p style={{ margin: 0, ...text12, maxWidth: 720 }}>
                The holdout was suppressed from every channel, so it measures the bundle. These panels show engagement only — no per-channel pipeline attribution.
              </p>
            </div>
            <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--alp-token-border-weak)" }}>
              <button onClick={() => setChannel("email")} style={tabBtn(channel === "email")}>Email nurture</button>
              <button onClick={() => setChannel("incentive")} style={tabBtn(channel === "incentive")}>Incentive</button>
              <button onClick={() => setChannel("paid")} style={tabBtn(channel === "paid")}>Paid</button>
              <button onClick={() => setChannel("sdr")} style={tabBtn(channel === "sdr")}>SDR</button>
            </div>

            {channel === "email" && (
              <div style={{ display: "flex", flexDirection: "column", maxWidth: 860 }}>
                <div style={{ display: "grid", gridTemplateColumns: "120px 110px 90px 1fr 130px", gap: 16, padding: "8px 0", borderBottom: "1px solid var(--alp-token-border-weak)" }}>
                  <span style={label12}>Email</span>
                  <span style={{ ...label12, textAlign: "right" }}>Delivered</span>
                  <span style={{ ...label12, textAlign: "right" }}>Clicks</span>
                  <span style={label12}>CTR</span>
                  <span style={{ ...label12, textAlign: "right" }}>Warm vs. capture</span>
                </div>
                {email.map((e) => (
                  <div key={e.name} style={{ display: "grid", gridTemplateColumns: "120px 110px 90px 1fr 130px", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--alp-token-gray-200)", alignItems: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, ...text14, fontWeight: 500 }}>
                      {e.name}
                      {e.note ? <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--alp-token-text-warning)" }}>{e.note}</span> : null}
                    </span>
                    <span style={num14}>{e.deliveredText}</span>
                    <span style={num14}>{e.clicksText}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-gray-300)" }}>
                        <div style={{ height: 6, borderRadius: "var(--alp-token-borderRadius-round)", background: "var(--alp-token-purple-800)", width: `${e.ctrW}%` }} />
                      </div>
                      <span style={{ fontSize: "0.75rem", lineHeight: 1.66, fontVariantNumeric: "tabular-nums", width: 34 }}>{e.ctr}%</span>
                    </div>
                    <span style={num14}>{e.warm}% / {e.capture}%</span>
                  </div>
                ))}
                <span style={{ ...text12, paddingTop: 8 }}>
                  Warm = clicked to a warm landing path; capture = form-gated path. Source: HubSpot sync, signal-2 campaign + nu-1..4.
                </span>
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
                <span style={text12}>Redemptions tracked via incentive UTM · demo completion from SFDC activity.</span>
              </div>
            )}

            {channel === "paid" && (
              <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
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
                <span style={{ ...text12, paddingTop: 8 }}>Platform-level aggregates from LinkedIn / Meta exports — no UTM path to contacts.</span>
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
                  <span style={text12}>SFDC campaign members · S0 created within 30 days of a held meeting.</span>
                </div>
              ) : (
                <p style={{ margin: 0, ...text14, color: "var(--alp-token-text-secondary)" }}>
                  The SDR motion runs on the upmarket segment only. Switch to Upmarket or All contacts to see it.
                </p>
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
