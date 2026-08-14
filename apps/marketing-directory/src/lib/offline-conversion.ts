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
  eventName: string;
  segment: string;
  valueUsd: number;
};

export type ConversionValues = {
  /** Keyed `eventName|segment`, both as they appear in SEGMENTS/FUNNEL_EVENTS. */
  byEventAndSegment: Record<string, number>;
  /** Null when Snowflake is not configured — the page renders empty, not wrong. */
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
 * The page shows the all-geo, unmultiplied baseline. Rows carrying a specific
 * geo or a multiplier other than 1 are regional overrides layered on top of it,
 * so including them here would double-count. Both filters no-op when the column
 * is absent.
 */
function isBaseline(row: RawRow): boolean {
  const geo = row.geo;
  const multiplier = row.multiplier;
  const geoOk = geo === undefined || geo === null || String(geo).trim() === "*";
  const multiplierOk =
    multiplier === undefined ||
    multiplier === null ||
    Number(multiplier) === 1 ||
    Number.isNaN(Number(multiplier));

  return geoOk && multiplierOk;
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
    .filter(isBaseline)
    .flatMap((row) => {
      const eventName = String(row.event_name ?? "")
        .trim()
        .toLowerCase();
      const valueUsd = toNumber(row.base_value_usd);

      if (!eventName || valueUsd === null) {
        return [];
      }

      return [
        {
          eventName,
          segment: String(row.segment ?? "*").trim() || "*",
          valueUsd,
        },
      ];
    });
}

/**
 * Reads the seed table. Returns `rows: null` when Snowflake is unconfigured so
 * the page can say so plainly; a genuine query failure throws, because a bidding
 * table that quietly renders blank is worse than one that visibly errors.
 */
export async function getConversionValues(): Promise<ConversionValues> {
  if (!isSnowflakeConfigured()) {
    return { byEventAndSegment: {}, rows: null };
  }

  const raw = await getSnowflakeConnector().query<RawRow>(QUERY);
  const rows = toConversionValues(raw);
  const byEventAndSegment: Record<string, number> = {};

  for (const row of rows) {
    byEventAndSegment[`${row.eventName}|${row.segment}`] = row.valueUsd;
  }

  return { byEventAndSegment, rows };
}
