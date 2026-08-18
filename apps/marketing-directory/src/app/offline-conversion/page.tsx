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
            {CONVERSION_TABLE}
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
              . The Default column applies when segment is unknown at conversion
              time. Sent value = base × multiplier — change the multiplier, not
              the base, for temporary boosts or tests, so the underlying model
              stays intact.
            </div>
          </div>
          <div className="card callout">
            <span
              className="dot"
              style={{ background: "var(--alp-token-warning-900)" }}
            />
            <div>
              <b>These are bidding signals, not revenue.</b>{" "}
              <span>
                Values reflect expected pipeline value at each stage —
                don&rsquo;t quote them as ACV or deal size in a QBR.
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
            <p
              style={{
                margin: 0,
                fontSize: "var(--alp-token-fontSize-bodyM)",
                lineHeight: "var(--alp-token-lineHeight-bodyM)",
                color: "var(--alp-token-text-secondary)",
                maxWidth: 640,
              }}
            >
              Value = (probability the event becomes a Stage 2 opportunity) ×
              (forecasted Stage 2 deal value for the segment).
            </p>
          </div>
          {/*
           * Deliberately no conversion rates or forecast dollar figures in this
           * copy: this repository is public, and those quantify funnel
           * performance. The rates live in the warehouse alongside the values;
           * the method is what belongs here.
           */}
          <div className="card methodology">
            <ul>
              <li>
                <b>Conversion rates come from our own funnel history</b> —
                events 6–18 months old, so outcomes are known, with duplicate
                stage-entries removed.
              </li>
              <li>
                <b>Deal values come from the planning forecast</b>, not trailing
                actuals — bidding aims at where the business is going. Stage 2
                uses the deal&rsquo;s actual pipeline ARR when available (~70%
                of the time); the forecast value is the fallback.
              </li>
              <li>
                <b>Leads from 10,000+ employee companies are sent at $0</b> —
                historically spam-heavy and rarely closeable, and a $0 value
                actively teaches bidding to avoid them. They&rsquo;re also
                excluded from the rate measurement.
              </li>
              <li>
                <b>Segments are defined by company headcount</b> — Early Stage
                0–50, Growth 51–400, Commercial Plus 401+ — so nearly every
                event gets a real segment, rather than relying on the CRM
                segment field.
              </li>
              <li>
                <b>Values refresh quarterly</b> with the planning forecast, and
                rates are re-measured from the warehouse.
              </li>
              <li>
                <b>Reading platform reports:</b> MQL, S0, S2, and CW are the
                same deal at different stages — don&rsquo;t sum values across
                events. Stage 2 (pipeline value) can legitimately exceed Closed
                Won (actual revenue).
              </li>
            </ul>
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
          <div>All geos (*) · Multipliers applied · Active rows only</div>
        </div>
      </main>
    </div>
  );
}
