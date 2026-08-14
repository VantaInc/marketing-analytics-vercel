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
  /** Optional. Direct image URL, shown in the card's expanded state. */
  screenshot?: string;
  status: DashboardStatus;
  tool: string;
  url: string;
};

/**
 * Wide enough that adding a column to the sheet does not silently drop it.
 * Parsing is header-driven, so trailing empty columns cost nothing.
 */
const DEFAULT_RANGE = "Catalog!A1:Z1000";

/** Header names accepted for the supporting-sources cell, lowercased. */
const DOC_COLUMNS = [
  "supporting sources",
  "supporting source",
  "supporting materials",
  "supporting docs",
  "supporting links",
  "sources",
  "docs",
];

/** Header names accepted for the screenshot cell, lowercased. */
const SCREENSHOT_COLUMNS = [
  "screenshot url",
  "screenshot",
  "screenshot link",
  "preview",
  "preview url",
  "image",
  "image url",
];

/**
 * Ways Drive spells a file id across its share links:
 *   /file/d/<id>/view?usp=sharing   the Share button's default
 *   open?id=<id>                    older share links
 *   uc?id=<id>                      the old embed form, now unreliable
 */
const DRIVE_FILE_ID = [/\/file\/d\/([\w-]+)/, /[?&]id=([\w-]+)/, /\/d\/([\w-]+)/];

/**
 * The host Drive actually serves image bytes from. `drive.google.com/uc?id=`
 * used to work for this and no longer does dependably — for many files it
 * answers with a virus-scan interstitial or a download prompt instead of the
 * image, so an `<img>` pointed at it fails even when permissions are correct.
 */
const DRIVE_IMAGE_HOST = "https://lh3.googleusercontent.com/d/";

/** Hosts that get their own pill icon, so a bare URL still lands correctly. */
const KNOWN_SOURCES: [RegExp, string][] = [
  [/(^|\.)getguru\.com$/, "Guru"],
  [/(^|\.)glean\.com$/, "Glean"],
];

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function sourceFromUrl(url: string): string {
  const host = hostOf(url);
  const match = host && KNOWN_SOURCES.find(([pattern]) => pattern.test(host));

  return match ? match[1] : "Doc";
}

function labelFromUrl(url: string): string {
  return hostOf(url)?.replace(/^www\./, "") ?? "";
}

/**
 * A Drive share link points at Drive's viewer page, which serves HTML, so an
 * `<img>` pointed at it renders nothing. Rewrite those to a URL that returns
 * the image itself, so owners can paste the link straight off the Share button.
 *
 * Already-direct `lh3.googleusercontent.com` links pass through, as does any
 * non-Drive URL, so a link to another image host still works. A Drive URL with
 * no recognisable file id — a folder link, say — is left alone rather than
 * mangled into something confidently wrong.
 *
 * The file still has to be readable by whoever opens the directory. Drive
 * enforces its own permissions here, against the viewer rather than the service
 * account that reads the sheet: a file that is not shared widely enough answers
 * with a sign-in page instead of the image, and the card drops the screenshot
 * rather than showing a broken frame.
 */
export function toDirectImageUrl(raw: string): string {
  const url = raw.trim();

  if (!url || hostOf(url) !== "drive.google.com") {
    return url;
  }

  const id = DRIVE_FILE_ID.map((pattern) => url.match(pattern)?.[1]).find(
    Boolean,
  );

  return id ? `${DRIVE_IMAGE_HOST}${id}` : url;
}

/**
 * Parses the `Supporting sources` cell, which packs several links into one
 * cell so the sheet stays one row per dashboard:
 *
 *   Guru: Metric definitions | https://… ; Glean: How to read this | https://…
 *
 * Entries are split on `;`. The URL is whatever follows `|`, or the first URL
 * found inline when the `|` is missing — so a bare pasted link still works.
 * What remains is the label, and a leading `Source:` prefix overrides the
 * source otherwise inferred from the URL's host.
 *
 * Only entries with neither a label nor a URL are dropped.
 */
export function parseDocs(raw: string): DocLink[] {
  if (!raw.trim()) {
    return [];
  }

  return raw.split(";").flatMap((entry) => {
    const trimmed = entry.trim();

    if (!trimmed) {
      return [];
    }

    const pipe = trimmed.indexOf("|");
    const inlineUrl = trimmed.match(/https?:\/\/\S+/)?.[0] ?? "";
    const url = pipe > -1 ? trimmed.slice(pipe + 1).trim() : inlineUrl;

    // Whatever is not the URL is the label. Strip any separator the URL left
    // behind so "Guru: definitions —" does not keep its dash.
    const head = (
      pipe > -1 ? trimmed.slice(0, pipe) : trimmed.replace(inlineUrl, "")
    )
      .replace(/[|:\-–—,\s]+$/, "")
      .trim();

    // A colon only marks the source when it is not the one in "https://".
    const separator = head.search(/:(?!\/\/)/);
    const prefix = separator > -1 ? head.slice(0, separator).trim() : "";
    const rest = separator > -1 ? head.slice(separator + 1).trim() : head;

    const label = rest || labelFromUrl(url);

    if (!label) {
      return [];
    }

    return [{ label, source: prefix || sourceFromUrl(url), url: url || "#" }];
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
          DOC_COLUMNS.map((column) => record[column]).find(Boolean) ?? "",
        ),
        grain: record["grain/scope"] || record.grain || undefined,
        lastReviewed: record["last reviewed"] || undefined,
        name,
        owner: record.owner || "",
        refresh: record["refresh cadence"] || record.refresh || "",
        screenshot:
          toDirectImageUrl(
            SCREENSHOT_COLUMNS.map((column) => record[column]).find(Boolean) ??
              "",
          ) || undefined,
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
