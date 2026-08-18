import "server-only";

/**
 * Change history for the conversion values.
 *
 * The values live in a dbt *seed* — a CSV that `dbt seed` truncates and reloads
 * on every run. Snowflake therefore only ever holds the current state, and no
 * query against it can say who changed what. That history exists in git, where
 * every edit to the CSV is a commit with an author, a timestamp, and a diff.
 *
 * This reads those commits and reconstructs the per-value changes between
 * consecutive versions.
 */

const REPO = "VantaInc/dbt";
const SEED_PATH =
  "seeds/offline_conversions/seed_offline_conversion_values.csv";

/** Bounds the work: each commit costs one contents request. */
const MAX_COMMITS = 25;

/**
 * Git history changes far less often than the values themselves. The Snowflake
 * read stays per-request; this is cached, so opening the page does not spend
 * GitHub rate limit on an unchanged commit list.
 */
const CACHE_SECONDS = 3600;

/** Columns whose movement counts as a change worth showing. */
const TRACKED_FIELDS = ["base_value_usd", "multiplier", "is_active"] as const;

export type TrackedField = (typeof TRACKED_FIELDS)[number];

export type ValueChange = {
  field: TrackedField | "added" | "removed";
  from: string | null;
  /** Human label for the row, e.g. "S0 · Growth". */
  label: string;
  to: string | null;
};

export type HistoryEntry = {
  authorName: string;
  changes: ValueChange[];
  /** ISO date, rendered as a plain day. */
  date: string;
  /** First line of the commit message. */
  message: string;
  /** Pull request number parsed from the message, when present. */
  prNumber: number | null;
  sha: string;
  url: string;
};

export type ValueHistory = {
  entries: HistoryEntry[] | null;
  /** Set when the history could not be read. */
  error: string | null;
  /** True when more commits exist than MAX_COMMITS. */
  truncated: boolean;
};

export function isHistoryConfigured(): boolean {
  return Boolean(process.env.DBT_REPO_TOKEN?.trim());
}

type GitHubCommit = {
  commit: {
    author: { date: string; name: string } | null;
    message: string;
  };
  html_url: string;
  sha: string;
};

async function github<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com/${path}`, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${process.env.DBT_REPO_TOKEN?.trim() ?? ""}`,
      "x-github-api-version": "2022-11-28",
    },
    next: { revalidate: CACHE_SECONDS },
  });

  if (!response.ok) {
    // The body can echo the request; keep only status text out of caution.
    throw new Error(
      `GitHub ${response.status} ${response.statusText} for ${path.split("?")[0]}`,
    );
  }

  return (await response.json()) as T;
}

/**
 * Minimal CSV reader. Handles quoted fields and escaped quotes, which is enough
 * for a seed of short identifiers and numbers, and avoids a dependency.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((entry) =>
    entry.some((cell) => cell.trim() !== ""),
  );

  if (!header) {
    return [];
  }

  const columns = header.map((cell) => cell.trim().toLowerCase());

  return body.map((cells) =>
    Object.fromEntries(
      columns.map((column, index) => [column, (cells[index] ?? "").trim()]),
    ),
  );
}

/** Identity of a row across versions. Geo is part of the key, not a value. */
function rowKey(row: Record<string, string>): string {
  return [row.event_name, row.segment, row.geo]
    .map((part) => (part ?? "").trim().toLowerCase())
    .join("|");
}

/** How a row is named in the UI. */
function rowLabel(row: Record<string, string>): string {
  const event = (row.event_name ?? "").toUpperCase();
  const segment = row.segment === "*" ? "Default" : (row.segment ?? "");
  const geo = row.geo && row.geo !== "*" ? ` · ${row.geo}` : "";

  return `${event} · ${segment}${geo}`;
}

/**
 * Compares two versions of the seed. `before` is null for the commit that
 * created the file, which is reported as one "added" entry per row rather than
 * thirteen separate field changes.
 */
export function diffVersions(
  before: Record<string, string>[] | null,
  after: Record<string, string>[],
): ValueChange[] {
  if (before === null) {
    return after.map((row) => ({
      field: "added" as const,
      from: null,
      label: rowLabel(row),
      to: row.base_value_usd ?? null,
    }));
  }

  const beforeByKey = new Map(before.map((row) => [rowKey(row), row]));
  const afterByKey = new Map(after.map((row) => [rowKey(row), row]));
  const changes: ValueChange[] = [];

  for (const [key, row] of afterByKey) {
    const previous = beforeByKey.get(key);

    if (!previous) {
      changes.push({
        field: "added",
        from: null,
        label: rowLabel(row),
        to: row.base_value_usd ?? null,
      });
      continue;
    }

    for (const field of TRACKED_FIELDS) {
      const from = previous[field] ?? "";
      const to = row[field] ?? "";

      if (from !== to) {
        changes.push({ field, from, label: rowLabel(row), to });
      }
    }
  }

  for (const [key, row] of beforeByKey) {
    if (!afterByKey.has(key)) {
      changes.push({
        field: "removed",
        from: row.base_value_usd ?? null,
        label: rowLabel(row),
        to: null,
      });
    }
  }

  return changes;
}

function prNumberFrom(message: string): number | null {
  const match = message.match(/\(#(\d+)\)|Merge pull request #(\d+)/);
  const found = match?.[1] ?? match?.[2];

  return found ? Number(found) : null;
}

async function seedAt(sha: string): Promise<Record<string, string>[]> {
  const file = await github<{ content: string; encoding: string }>(
    `repos/${REPO}/contents/${SEED_PATH}?ref=${sha}`,
  );
  const text = Buffer.from(file.content, "base64").toString("utf8");

  return parseCsv(text);
}

/**
 * Reads the seed's commit history and the value changes each commit made.
 *
 * Never throws, matching the values read: a GitHub outage or an expired token
 * should cost the history section, not the page.
 */
export async function getValueHistory(): Promise<ValueHistory> {
  if (!isHistoryConfigured()) {
    return { entries: null, error: null, truncated: false };
  }

  try {
    const commits = await github<GitHubCommit[]>(
      `repos/${REPO}/commits?path=${encodeURIComponent(SEED_PATH)}&per_page=${MAX_COMMITS + 1}`,
    );
    const truncated = commits.length > MAX_COMMITS;
    const considered = commits.slice(0, MAX_COMMITS);

    // Newest first from GitHub. One contents request per commit; the version
    // before each is the next one in the list, so nothing is fetched twice.
    const versions = await Promise.all(
      considered.map((commit) => seedAt(commit.sha)),
    );

    const entries: HistoryEntry[] = considered.map((commit, index) => {
      const previous = versions[index + 1] ?? null;
      const message = commit.commit.message.split("\n")[0] ?? "";

      return {
        authorName: commit.commit.author?.name ?? "Unknown",
        changes: diffVersions(
          // The oldest commit in view has no predecessor here. Treat that as
          // the file's creation only when it genuinely is — when the history
          // is truncated, compare against an empty set instead, so a partial
          // window does not report thirteen rows as newly added.
          truncated && index === considered.length - 1 ? [] : previous,
          versions[index] ?? [],
        ),
        date: commit.commit.author?.date?.slice(0, 10) ?? "",
        message,
        prNumber: prNumberFrom(message),
        sha: commit.sha,
        url: commit.html_url,
      };
    });

    return { entries, error: null, truncated };
  } catch (cause) {
    console.error("Failed to read seed history from GitHub", cause);

    return {
      entries: null,
      error: cause instanceof Error ? cause.message : String(cause),
      truncated: false,
    };
  }
}
