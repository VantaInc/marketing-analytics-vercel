import type { Metadata } from "next";

import {
  CONVERSION_TABLE,
  FUNNEL_EVENTS,
  SEGMENTS,
  getConversionValues,
} from "@/lib/offline-conversion";
import { getSnowflakeContext } from "@/lib/snowflake";
import { SiteHeader } from "../site-header";

/**
 * Rendered per request, never prerendered. With `revalidate` alone this route
 * was static, so `next build` ran the Snowflake query at build time and any
 * warehouse or grant problem failed the whole deploy. Matches the approach in
 * apps/reengage-events-q2.
 */
export const dynamic = "force-dynamic";

/** snowflake-sdk needs node:crypto/net — it cannot run on the edge runtime. */
export const runtime = "nodejs";

/** The JWT handshake is ~1-2s on a cold instance; default 10s is too tight. */
export const maxDuration = 60;

export const metadata: Metadata = {
  description:
    "The dollar values we send back to ad platforms at each funnel stage.",
  title: "Offline conversion values",
};

/** Michael Chen asked the page link out to what it references. */
const PLANNING_DOC_URL =
  "https://docs.google.com/document/d/1EC-n4cC-xS9EP_jtK2b95z2-1_iacsClHZaABNOUy8A/edit?tab=t.0#heading=h.hjg81dtiw4nw";

/**
 * Stated rather than computed: the window is a property of the last
 * calibration, not of today. Deriving it from the current date would silently
 * describe a cohort that was never measured.
 */
const CALIBRATION_DATE = "2026-08-06";
const COHORT_START = "2025-02-06";
const COHORT_END = "2026-02-06";

const usd = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

export default async function Page() {
  const { byEventAndSegment, diagnostic, error, rows } =
    await getConversionValues();
  const configured = rows !== null;
  const growthS0 = byEventAndSegment["s0|Growth"];
  const context = getSnowflakeContext();

  /** Shown under a failure so the connection's identity is never a guess. */
  const connectionNote =
    `Connected as role ${context.role}, ` +
    `warehouse ${context.warehouse}, database ${context.database}. ` +
    `A grant made to a different role looks exactly like the table not existing.`;

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <SiteHeader current="/offline-conversion" />

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
          padding: "40px 32px 64px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "var(--alp-token-fontSize-headingL)",
                lineHeight: "var(--alp-token-lineHeight-headingL)",
                fontWeight: 600,
              }}
            >
              Offline conversion values
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "var(--alp-token-fontSize-bodyM)",
                lineHeight: "var(--alp-token-lineHeight-bodyM)",
                color: "var(--alp-token-text-secondary)",
                maxWidth: 640,
              }}
            >
              The dollar values we send back to ad platforms when a lead hits
              each funnel stage. Platforms optimize bidding toward these numbers
              — this is what &ldquo;value-based bidding&rdquo; is bidding on.
            </p>
          </div>
          <div
            style={{
              fontSize: "var(--alp-token-fontSize-bodyS)",
              color: "var(--alp-token-text-secondary)",
              whiteSpace: "nowrap",
              paddingBottom: 4,
            }}
          >
            {CONVERSION_TABLE} · refreshed daily
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Funnel event</th>
                {SEGMENTS.map((segment) => (
                  <th key={segment}>
                    {segment === "*" ? "Default (*)" : segment}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {error !== null ? (
                <tr>
                  <td
                    colSpan={SEGMENTS.length + 1}
                    style={{ textAlign: "left", padding: 28, fontWeight: 400 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <span style={{ color: "var(--alp-token-text-danger)" }}>
                        Couldn&rsquo;t read {CONVERSION_TABLE}.
                      </span>
                      <code
                        style={{
                          fontSize: "var(--alp-token-fontSize-bodyS)",
                          color: "var(--alp-token-text-secondary)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {error}
                      </code>
                      <span
                        className="muted"
                        style={{ fontSize: "var(--alp-token-fontSize-bodyS)" }}
                      >
                        No values are shown rather than stale or partial ones.{" "}
                        {connectionNote}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : diagnostic !== null ? (
                <tr>
                  <td
                    colSpan={SEGMENTS.length + 1}
                    style={{ textAlign: "left", padding: 28, fontWeight: 400 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <span style={{ color: "var(--alp-token-text-danger)" }}>
                        {CONVERSION_TABLE} is readable, but produced no usable
                        values.
                      </span>
                      <code
                        style={{
                          fontSize: "var(--alp-token-fontSize-bodyS)",
                          color: "var(--alp-token-text-secondary)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {diagnostic}
                      </code>
                      <span
                        className="muted"
                        style={{ fontSize: "var(--alp-token-fontSize-bodyS)" }}
                      >
                        {connectionNote}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : !configured ? (
                <tr>
                  <td
                    className="muted"
                    colSpan={SEGMENTS.length + 1}
                    style={{ textAlign: "center", padding: 28 }}
                  >
                    Snowflake is not configured for this deployment, so no
                    values can be shown. Set the <code>SNOWFLAKE_*</code>{" "}
                    environment variables to read {CONVERSION_TABLE}.
                  </td>
                </tr>
              ) : (
                FUNNEL_EVENTS.map((event) => (
                  <tr key={event.key}>
                    <td>
                      <span className="event">{event.label}</span>
                      <span className="event-detail">{event.detail}</span>
                    </td>
                    {SEGMENTS.map((segment) => {
                      const isDefault = segment === "*";

                      // Closed Won passes the deal's own value through, so the
                      // seed carries a $1 unit value rather than a fixed amount.
                      if (event.key === "cw") {
                        return (
                          <td className="muted" key={segment}>
                            {isDefault ? "$1 seed × deal value" : "—"}
                          </td>
                        );
                      }

                      const value =
                        byEventAndSegment[`${event.key}|${segment}`];

                      if (value === undefined) {
                        return (
                          <td className="muted" key={segment}>
                            —
                          </td>
                        );
                      }

                      return (
                        <td
                          className={isDefault ? "muted" : undefined}
                          key={segment}
                        >
                          <span className="cell-stack">
                            {usd.format(value.sentUsd)}
                            <span
                              className={
                                value.multiplier === 1
                                  ? "mult"
                                  : "mult override"
                              }
                              title={`Sent value = base ${usd.format(
                                value.baseUsd,
                              )} × multiplier ${value.multiplier}`}
                            >
                              × {value.multiplier}
                            </span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          <div className="card callout">
            <span
              className="dot"
              style={{ background: "var(--alp-token-purple-900)" }}
            />
            <div>
              <b>How to read it.</b> When a Growth-segment lead hits S0, we tell
              the ad platform that conversion was worth{" "}
              {growthS0 === undefined
                ? "the S0 Growth value"
                : usd.format(growthS0.sentUsd)}
              . The Default column applies when segment is unknown. Sent value =
              base × multiplier — all multipliers are 1× today; for boosts or
              tests, change the multiplier, not the base, so the model stays
              intact.
            </div>
          </div>
          <div className="card callout">
            <span
              className="dot"
              style={{ background: "var(--alp-token-warning-900)" }}
            />
            <div>
              <b>Bidding signals, not revenue.</b>{" "}
              <span>
                Values reflect expected pipeline value at each stage —
                don&rsquo;t quote them as ACV or deal size in a QBR.
              </span>
            </div>
          </div>
          <div className="card callout">
            <span
              className="dot"
              style={{ background: "var(--alp-token-warning-900)" }}
            />
            <div>
              <b>Don&rsquo;t sum across events.</b>{" "}
              <span>
                MQL, S0, S2, and CW are the same deal at different stages —
                summing their values counts one deal four times.
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2
            style={{
              margin: 0,
              fontSize: "var(--alp-token-fontSize-bodyL)",
              lineHeight: "var(--alp-token-lineHeight-bodyL)",
              fontWeight: 600,
            }}
          >
            How the values are calculated
          </h2>

          <div className="card formula">
            <span className="term">
              <b>P(reaches Stage 2)</b>
              <span>from our funnel history</span>
            </span>
            <span className="op">×</span>
            <span className="term">
              <b>Stage 2 deal value</b>
              <span>FY27 planning doc, by segment</span>
            </span>
            <span className="op">=</span>
            <span className="term accent">
              <b>Conversion value</b>
              <span>sent to the platform</span>
            </span>
          </div>

          {/*
           * Still no conversion rates or forecast dollar figures in this copy:
           * the repository is public. The planning doc link carries the numbers
           * and enforces its own permissions.
           */}
          <div className="facts">
            <div className="card fact">
              <span className="label">Conversion rates</span>
              <span className="value">Rolling 6–18 month window</span>
              <span className="note">
                Events aged six to eighteen months at calibration, so outcomes
                are known. Calibrated {CALIBRATION_DATE} — the current cohort is
                events dated {COHORT_START} through {COHORT_END}.
              </span>
            </div>
            <div className="card fact">
              <span className="label">Forecast values</span>
              <span className="value">FY27 S2 ARR planning doc</span>
              <span className="note">
                <a href={PLANNING_DOC_URL} target="_blank" rel="noreferrer">
                  Business Systems Intake · FY27 S2 ARR Values ↗
                </a>{" "}
                — the quarter&rsquo;s values averaged across geos; no regional
                differentiation yet, so a segment carries one value everywhere.
                Static within the quarter.
              </span>
            </div>
            <div className="card fact">
              <span className="label">Segment mapping</span>
              <span className="value">
                Commercial Plus maps to the doc&rsquo;s Commercial rows
              </span>
              <span className="note">
                Not Enterprise — warehouse actuals for 401+ headcount deals line
                up with Commercial. The Enterprise and Emerging Markets rows are
                unused.
              </span>
            </div>
            <div className="card fact">
              <span className="label">Segments</span>
              <span className="value">Defined by headcount tier</span>
              <span className="note">
                ≤50 Early Stage (unknowns included), 51–400 Growth, 401+
                Commercial Plus, with ≥10,000 flagged for the $0 policy.
              </span>
            </div>
            <div className="card fact">
              <span className="label">Guardrail</span>
              <span className="value">10,000+ employee leads sent at $0</span>
              <span className="note">
                Per Paid Media team guidance: historically spam-heavy, rarely
                closeable, not genuinely digital-attributed. Sent at $0 rather
                than withheld — omitting the event says the click didn&rsquo;t
                convert; $0 says this audience converts and is worth nothing, so
                bidding actively steers away from lookalikes.
              </span>
            </div>
            <div className="card fact">
              <span className="label">Refresh</span>
              <span className="value">Values static within the quarter</span>
              <span className="note">
                Forecast values update with each quarter&rsquo;s planning doc;
                conversion rates re-calibrate on the rolling window.
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            paddingTop: 20,
            borderTop: "1px solid var(--alp-token-border-weak)",
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            fontSize: "var(--alp-token-fontSize-bodyS)",
            color: "var(--alp-token-text-secondary)",
          }}
        >
          <div>
            Maintained by Marketing Analytics · Values reviewed with each
            segment re-baseline
          </div>
          <div>All geos (*) · Multiplier 1.0 · Active rows only</div>
        </div>
      </main>
    </div>
  );
}
