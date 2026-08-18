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
  "https://docs.google.com/document/d/1EC-n4cC-xS9EP_jtK2b95z2-1_iacsClHZaABNOUy8A/edit";

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
              <b>These are bidding signals, not revenue reporting.</b>{" "}
              <span>
                Deal values come from the planning forecast rather than trailing
                actuals — bidding aims at where the business is going, not where
                it&rsquo;s been. The exceptions are late-funnel: Stage 2 uses
                the deal&rsquo;s actual pipeline ARR when available (~70% of S2
                events; the forecast value is the fallback), and Closed Won
                always passes actual ARR. Don&rsquo;t sum values across events —
                MQL, S0, S2, and CW are the same deal at four points.
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
                <b>Forecast values come from the FY27 S2 ARR planning doc</b> —{" "}
                <a href={PLANNING_DOC_URL} target="_blank" rel="noreferrer">
                  Business Systems Intake &middot; FY27 S2 ARR Values
                </a>
                . We use the quarter&rsquo;s values <b>averaged across geos</b>;
                there is no regional differentiation yet, so a segment carries
                one value everywhere. Commercial Plus maps to the doc&rsquo;s{" "}
                <i>Commercial</i> rows rather than <i>Enterprise</i>, because
                warehouse actuals for 401+ headcount deals line up with
                Commercial. The Enterprise and Emerging Markets rows are unused.
              </li>
              <li>
                <b>Values are static within the quarter.</b> The rate × forecast
                multiplication is baked into the seed at calibration time, not
                recomputed per run. Two reasons: Smart Bidding learns against a
                value <i>distribution</i>, and values that drift continuously
                add noise to the signal it is trying to learn; and an in-quarter
                recalculation would mostly measure noise, because recent events
                have not matured — a July MQL that has not reached S2 yet is
                young, not failed. Rates and forecast values refresh together on
                the quarterly cadence, as a reviewed change to the seed,
                auditable in git.
              </li>
              <li>
                <b>Conversion rates use a rolling 6–18 month window</b> — events
                aged six to eighteen months at calibration. Calibrated{" "}
                {CALIBRATION_DATE}, so the current cohort is events dated{" "}
                {COHORT_START} through {COHORT_END}. The six-month floor is a
                maturity cutoff: an event needs roughly six months for its S2
                outcome to be knowable, and including younger events undercounts
                conversion. The eighteen-month cap keeps rates reflective of the
                current GTM motion. A fixed calendar range would do both jobs
                worse — it goes stale as time passes, and it mixes fully matured
                cohorts with still-maturing ones.
              </li>
              <li>
                <b>Leads from 10,000+ employee companies are sent at $0.</b> Per
                Paid Media team guidance, these are historically spam-heavy,
                rarely closeable, and not genuinely digital-attributed. They are
                sent at $0 rather than withheld because the conversion did
                happen — the only question is what it is worth. Omitting the
                event tells the platform the click simply did not convert;
                sending $0 tells it this audience converts and is worth nothing,
                so value-based bidding actively steers away from lookalikes. It
                also keeps volumes reconciling between the warehouse and
                platform reporting, keeps the rows visible via the{" "}
                <code>is_10k_plus</code> flag, and makes the policy reversible
                with a seed edit rather than a logic change. <b>Caveat:</b> in
                the count-based arm of the A/B test these still count +1 each,
                so if the count variant wins we should revisit dropping them
                instead.
              </li>
              <li>
                <b>Segments are defined by headcount tier</b>, read from{" "}
                <code>HEADCOUNT_TIER</code> in{" "}
                <code>VANTA.DBT.DIM_MARKETING_FUNNEL</code>, which resolves as{" "}
                <code>
                  coalesce(opportunity.opp_headcount_tier__c,
                  account.headcount_tier__c)
                </code>{" "}
                — the opportunity value where set, the account value as
                fallback. The tier&rsquo;s lower bound is parsed (
                <code>&lsquo;7: 401-750&rsquo;</code> → <code>401</code>) and
                bucketed: ≤50 Early Stage (unknowns included), 51–400 Growth,
                401+ Commercial Plus, with ≥10,000 flagged for the $0 policy.
              </li>
              <li>
                <b>Values refresh quarterly</b> with the planning forecast, and
                rates are re-measured from the warehouse at the same time.
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
