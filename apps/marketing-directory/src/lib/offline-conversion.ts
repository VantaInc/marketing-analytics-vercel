import "server-only";

import { getSnowflakeConnector, isSnowflakeConfigured } from "./snowflake";

export const CONVERSION_TABLE = "VANTA.DBT.SEED_OFFLINE_CONVERSION_VALUES";

/** Funnel events, in funnel order. Keys match EVENT_NAME, lowercased. */
export const FUNNEL_EVENTS = [
  { detail: "Marketing-qualified lead", key: "mql", label: "MQL" },
  { detail: "Opportunity created", key: "s0", label: "S0" },
  { detail: "Qualified opportunity", key: "s2", label: "S2" },
  {
    detail: "Closed won — actual deal value passed dynamically",
    key: "cw",
    label: "CW",
  },
] as const;

/** Segment columns, in table order. "*" is the unknown-segment fallback. */
export const SEGMENTS = [
  "Early Stage",
  "Growth",
  "Commercial Plus",
  "*",
] as const;

export type ConversionValue = {
  /** The modelled value before any multiplier. */
  baseUsd: number;
  eventName: string;
  /** 1 unless a temporary boost or test is in effect. */
  multiplier: number;
  segment: string;
  /** What actually goes to the ad platform: base × multiplier, rounded. */
  sentUsd: number;
};

export type ConversionValues = {
  /** Keyed `eventName|segment`, both as they appear in SEGMENTS/FUNNEL_EVENTS. */
  byEventAndSegment: Record<string, ConversionValue>;
  /** Set when the query failed. The page shows it instead of the values. */
  error: string | null;
  /** Null when unconfigured or the query failed — never a misleading empty set. */
  rows: ConversionValue[] | null;
};

/**
 * `SELECT *` rather than named columns because the seed's exact schema is not
 * pinned here: the sheet-side owners add columns (geo, multiplier, notes) as
 * the model evolves, and a named-column query would break on every addition.
 * Filtering happens below against lowercased keys, so casing changes are safe
 * too. Tighten this to explicit columns once the schema is stable.
 */
const QUERY = `SELECT * FROM ${CONVERSION_TABLE}`;

type RawRow = Record<string, unknown>;

function lowerKeys(row: RawRow): RawRow {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]),
  );
}

/** Absent or unparseable means active — only an explicit false excludes a row. */
function isActive(row: RawRow): boolean {
  const raw = row.is_active;

  if (raw === undefined || raw === null) {
    return true;
  }

  return String(raw).trim().toLowerCase() !== "false";
}

/**
 * The page shows the all-geo rows. Rows carrying a specific geo are regional
 * overrides layered on top, so including them here would double-count. No-ops
 * when the column is absent.
 *
 * The multiplier is deliberately NOT filtered on: it is applied, not excluded.
 * A multiplier other than 1 is a live temporary boost or test, and hiding those
 * rows would show a number the ad platform is not actually receiving.
 */
function isAllGeo(row: RawRow): boolean {
  const geo = row.geo;

  return geo === undefined || geo === null || String(geo).trim() === "*";
}

/** Absent, unparseable, or non-positive multipliers fall back to 1. */
function toMultiplier(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export function toConversionValues(rows: RawRow[]): ConversionValue[] {
  return rows
    .map(lowerKeys)
    .filter(isActive)
    .filter(isAllGeo)
    .flatMap((row) => {
      const eventName = String(row.event_name ?? "")
        .trim()
        .toLowerCase();
      const baseUsd = toNumber(row.base_value_usd);

      if (!eventName || baseUsd === null) {
        return [];
      }

      const multiplier = toMultiplier(row.multiplier);

      return [
        {
          baseUsd,
          eventName,
          multiplier,
          segment: String(row.segment ?? "*").trim() || "*",
          sentUsd: Math.round(baseUsd * multiplier),
        },
      ];
    });
}

/**
 * Reads the seed table.
 *
 * Never throws. A query failure is returned as `error` so the page can show
 * what went wrong while keeping the methodology and navigation intact — a
 * thrown error would replace the whole page with a 500. `rows` stays null in
 * both the unconfigured and failed cases, so a problem can never be mistaken
 * for "there are no values".
 */
export async function getConversionValues(): Promise<ConversionValues> {
  if (!isSnowflakeConfigured()) {
    return { byEventAndSegment: {}, error: null, rows: null };
  }

  let raw: RawRow[];

  try {
    raw = await getSnowflakeConnector().query<RawRow>(QUERY);
  } catch (cause) {
    // Full error to the server log; only the message reaches the page.
    console.error(`Failed to read ${CONVERSION_TABLE}`, cause);

    return {
      byEventAndSegment: {},
      error: cause instanceof Error ? cause.message : String(cause),
      rows: null,
    };
  }

  const rows = toConversionValues(raw);
  const byEventAndSegment: Record<string, ConversionValue> = {};

  // One all-geo row per event/segment is expected. If the seed ever carries
  // two, the later one wins — matching the prototype rather than silently
  // summing them.
  for (const row of rows) {
    byEventAndSegment[`${row.eventName}|${row.segment}`] = row;
  }

  return { byEventAndSegment, error: null, rows };
}
