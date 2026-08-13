import "server-only";

import {
  createGoogleSheetsConnector,
  parseGoogleServiceAccountJsonBase64,
} from "@vanta/google-sheets";

export const DASHBOARD_STATUSES = [
  "Certified",
  "Working",
  "Deprecated",
] as const;

export type DashboardStatus = (typeof DASHBOARD_STATUSES)[number];

/** A supporting doc for a dashboard — a Guru card, a Glean result, anything. */
export type DocLink = {
  label: string;
  source: string;
  url: string;
};

export type Dashboard = {
  category: string;
  description: string;
  docs: DocLink[];
  /** Optional. Not rendered yet — settles "why don't these numbers match". */
  grain?: string;
  /** Optional. Not rendered yet — the date the owner last re-certified. */
  lastReviewed?: string;
  name: string;
  owner: string;
  refresh: string;
  status: DashboardStatus;
  tool: string;
  url: string;
};

const DEFAULT_RANGE = "Catalog!A1:L1000";

/**
 * Parses the `Supporting sources` cell, which packs several links into one
 * cell so the sheet stays one row per dashboard:
 *
 *   Guru: Metric definitions | https://… ; Glean: How to read this | https://…
 *
 * Entries are split on `;`, the label from the URL on `|`, and the source
 * from the label on the first `:`. Malformed entries are dropped rather than
 * rendered as a broken pill.
 */
export function parseDocs(raw: string): DocLink[] {
  if (!raw.trim()) {
    return [];
  }

  return raw.split(";").flatMap((entry) => {
    const [head = "", url = ""] = entry.split("|").map((part) => part.trim());
    const separator = head.indexOf(":");
    const source = separator > -1 ? head.slice(0, separator).trim() : "Doc";
    const label = separator > -1 ? head.slice(separator + 1).trim() : head;

    if (!label) {
      return [];
    }

    return [{ label, source, url: url || "#" }];
  });
}

/**
 * Sample rows so the app renders before the sheet is wired up. Replaced
 * entirely once DASHBOARD_CATALOG_SPREADSHEET_ID is set.
 */
const SAMPLE: Dashboard[] = [
  {
    name: "Paid Media Overview",
    description:
      "How is paid spend performing? Spend, CAC, and ROAS across every paid channel, rolled up daily.",
    url: "#",
    tool: "Looker",
    status: "Certified",
    owner: "Maya Chen",
    refresh: "Daily · 6am",
    category: "Paid media",
    docs: [
      { label: "Metric definitions", source: "Guru", url: "#" },
      { label: "How to read this", source: "Glean", url: "#" },
    ],
  },
  {
    name: "Campaign Performance Deep-Dive",
    description:
      "Campaign-level spend, conversions, and efficiency for in-flight campaigns. Grain: campaign × day.",
    url: "#",
    tool: "Tableau",
    status: "Certified",
    owner: "Maya Chen",
    refresh: "Daily · 6am",
    category: "Paid media",
    docs: [],
  },
  {
    name: "Web Traffic & Conversion",
    description:
      "Sessions, sign-up conversion, and funnel drop-off across the marketing site. Real-time.",
    url: "#",
    tool: "Amplitude",
    status: "Certified",
    owner: "Priya Nair",
    refresh: "Real-time",
    category: "Web & SEO",
    docs: [{ label: "Funnel stage guide", source: "Guru", url: "#" }],
  },
  {
    name: "SEO Keyword Rankings",
    description:
      "Ranking positions and click share for tracked keyword clusters, refreshed every Monday.",
    url: "#",
    tool: "Looker",
    status: "Working",
    owner: "Tom Okafor",
    refresh: "Weekly · Mon",
    category: "Web & SEO",
    docs: [],
  },
  {
    name: "Email & Lifecycle Engagement",
    description:
      "Send, open, click, and unsubscribe trends for lifecycle programs, by audience segment.",
    url: "#",
    tool: "Sigma",
    status: "Certified",
    owner: "Dana Ruiz",
    refresh: "Daily · 7am",
    category: "Lifecycle",
    docs: [],
  },
  {
    name: "Lead Funnel & MQL Trends",
    description:
      "Lead volume from form fill to MQL, by source and region. The source of truth for funnel reviews.",
    url: "#",
    tool: "Looker",
    status: "Certified",
    owner: "Sam Whitfield",
    refresh: "Hourly",
    category: "Pipeline",
    docs: [
      { label: "MQL definition", source: "Guru", url: "#" },
      { label: "Funnel review deck", source: "Glean", url: "#" },
    ],
  },
  {
    name: "Pipeline Attribution",
    description:
      "Which channels source and influence pipeline? Multi-touch attribution at the opportunity level.",
    url: "#",
    tool: "Tableau",
    status: "Working",
    owner: "Sam Whitfield",
    refresh: "Daily · 6am",
    category: "Pipeline",
    docs: [{ label: "Attribution model", source: "Glean", url: "#" }],
  },
  {
    name: "Event & Webinar ROI",
    description:
      "Registration, attendance, and sourced pipeline for field events and webinars.",
    url: "#",
    tool: "Sigma",
    status: "Working",
    owner: "Dana Ruiz",
    refresh: "Weekly · Fri",
    category: "Pipeline",
    docs: [],
  },
  {
    name: "Brand Search & Share of Voice",
    description:
      "Branded search volume and share of voice vs. competitors, compiled monthly.",
    url: "#",
    tool: "Sheets",
    status: "Working",
    owner: "Tom Okafor",
    refresh: "Monthly",
    category: "Web & SEO",
    docs: [],
  },
  {
    name: "Landing Page A/B Tests",
    description:
      "Live experiment results for landing page tests: exposure, conversion, and significance.",
    url: "#",
    tool: "Amplitude",
    status: "Certified",
    owner: "Priya Nair",
    refresh: "Real-time",
    category: "Web & SEO",
    docs: [],
  },
  {
    name: "Content Engagement",
    description:
      "Blog and resource-center readership, scroll depth, and content-assisted conversions.",
    url: "#",
    tool: "Looker",
    status: "Working",
    owner: "Priya Nair",
    refresh: "Daily · 8am",
    category: "Web & SEO",
    docs: [],
  },
  {
    name: "Legacy Spend Tracker",
    description:
      "Old manual spend tracker. Superseded by Paid Media Overview — kept for 2024 history only.",
    url: "#",
    tool: "Sheets",
    status: "Deprecated",
    owner: "Maya Chen",
    refresh: "Stopped",
    category: "Paid media",
    docs: [],
  },
];

export type CatalogResult = {
  dashboards: Dashboard[];
  /** True when showing SAMPLE because the sheet is not configured or failed. */
  isSample: boolean;
};

function toStatus(value: string): DashboardStatus {
  const match = DASHBOARD_STATUSES.find(
    (status) => status.toLowerCase() === value.trim().toLowerCase(),
  );

  return match ?? "Working";
}

function toRecords(rows: string[][]): Dashboard[] {
  const [header, ...body] = rows;

  if (!header) {
    return [];
  }

  const columns = header.map((cell) => cell.trim().toLowerCase());

  return body.flatMap((row) => {
    const record: Record<string, string> = Object.fromEntries(
      columns.map((column, index) => [column, (row[index] ?? "").trim()]),
    );
    const name = record.name;

    if (!name) {
      return [];
    }

    return [
      {
        category: record.category || "Other",
        description: record.description || "",
        docs: parseDocs(
          record["supporting sources"] || record["supporting materials"] || "",
        ),
        grain: record["grain/scope"] || record.grain || undefined,
        lastReviewed: record["last reviewed"] || undefined,
        name,
        owner: record.owner || "",
        refresh: record["refresh cadence"] || record.refresh || "",
        status: toStatus(record.status ?? ""),
        tool: record.tool || "Other",
        url: record.url || "#",
      },
    ];
  });
}

/**
 * Reads the dashboard catalog from Google Sheets using a service account, so
 * the sheet can stay private. Falls back to SAMPLE when unconfigured, and
 * throws on a genuine read failure so the page can surface it rather than
 * silently serving sample data as if it were real.
 */
export async function getCatalog(): Promise<CatalogResult> {
  const spreadsheetId = process.env.DASHBOARD_CATALOG_SPREADSHEET_ID?.trim();
  const serviceAccountJson =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64?.trim();

  if (!spreadsheetId || !serviceAccountJson) {
    return { dashboards: SAMPLE, isSample: true };
  }

  const credentials = parseGoogleServiceAccountJsonBase64(serviceAccountJson);
  const sheets = createGoogleSheetsConnector(credentials);
  const { rows } = await sheets.readRows({
    range: process.env.DASHBOARD_CATALOG_RANGE?.trim() || DEFAULT_RANGE,
    spreadsheetId,
  });

  const dashboards = toRecords(
    rows.map((row) => row.map((cell) => String(cell ?? ""))),
  );

  return { dashboards, isSample: false };
}
