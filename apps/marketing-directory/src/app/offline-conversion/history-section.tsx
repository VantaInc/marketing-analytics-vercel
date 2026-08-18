import { ExternalLink } from "lucide-react";

import type { HistoryEntry, ValueChange } from "@/lib/value-history";

const usd = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

/** Changes shown per commit before collapsing the rest into a count. */
const VISIBLE_PER_COMMIT = 5;

function formatValue(field: ValueChange["field"], raw: string | null): string {
  if (raw === null || raw === "") {
    return "—";
  }

  if (field === "multiplier") {
    return `× ${raw}`;
  }

  if (field === "is_active") {
    return raw;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) ? usd.format(parsed) : raw;
}

function describe(change: ValueChange): string {
  if (change.field === "added") {
    return `added at ${formatValue("base_value_usd", change.to)}`;
  }

  if (change.field === "removed") {
    return `removed (was ${formatValue("base_value_usd", change.from)})`;
  }

  const label =
    change.field === "base_value_usd"
      ? "value"
      : change.field === "multiplier"
        ? "multiplier"
        : "active";

  return `${label} ${formatValue(change.field, change.from)} → ${formatValue(change.field, change.to)}`;
}

export type HistorySectionProps = {
  entries: HistoryEntry[] | null;
  error: string | null;
  truncated: boolean;
};

export function HistorySection({
  entries,
  error,
  truncated,
}: HistorySectionProps) {
  return (
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
          Change history
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
          Every edit to the seed, from the dbt repository&rsquo;s git history.
          The table itself holds only current values — a dbt seed is reloaded in
          full on each run — so who changed what lives in the commits.
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {error !== null ? (
          <div
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ color: "var(--alp-token-text-danger)" }}>
              Couldn&rsquo;t read the seed&rsquo;s history from GitHub.
            </span>
            <code
              style={{
                fontSize: "var(--alp-token-fontSize-bodyS)",
                color: "var(--alp-token-text-secondary)",
              }}
            >
              {error}
            </code>
          </div>
        ) : entries === null ? (
          <div className="muted" style={{ padding: 24 }}>
            History is not configured for this deployment. Set{" "}
            <code>DBT_REPO_TOKEN</code> to a token with read access to the dbt
            repository.
          </div>
        ) : entries.length === 0 ? (
          <div className="muted" style={{ padding: 24 }}>
            No commits found for the seed file.
          </div>
        ) : (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {entries.map((entry) => {
              const shown = entry.changes.slice(0, VISIBLE_PER_COMMIT);
              const hidden = entry.changes.length - shown.length;

              return (
                <li
                  key={entry.sha}
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--alp-token-border-weak)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--alp-token-fontSize-bodyS)",
                        color: "var(--alp-token-text-secondary)",
                        fontVariantNumeric: "tabular-nums",
                        minWidth: 82,
                      }}
                    >
                      {entry.date}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--alp-token-fontSize-bodyM)",
                        fontWeight: 600,
                      }}
                    >
                      {entry.authorName}
                    </span>
                    <a
                      className="doc-pill"
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      title={entry.message}
                    >
                      {entry.prNumber === null
                        ? entry.sha.slice(0, 7)
                        : `#${entry.prNumber}`}
                      <ExternalLink
                        size={8}
                        style={{ color: "var(--alp-token-icon-weak)" }}
                      />
                    </a>
                  </div>

                  {entry.changes.length === 0 ? (
                    <span
                      className="muted"
                      style={{ fontSize: "var(--alp-token-fontSize-bodyS)" }}
                    >
                      Touched the file without changing any tracked value.
                    </span>
                  ) : (
                    <ul
                      style={{
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                      }}
                    >
                      {shown.map((change) => (
                        <li
                          key={`${change.label}-${change.field}`}
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            fontSize: "var(--alp-token-fontSize-bodyS)",
                            color: "var(--alp-token-text-secondary)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          <span
                            style={{
                              minWidth: 190,
                              color: "var(--alp-token-text-default)",
                            }}
                          >
                            {change.label}
                          </span>
                          <span>{describe(change)}</span>
                        </li>
                      ))}
                      {hidden > 0 ? (
                        <li
                          className="muted"
                          style={{
                            fontSize: "var(--alp-token-fontSize-bodyS)",
                          }}
                        >
                          + {hidden} more in this commit
                        </li>
                      ) : null}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {truncated ? (
          <div
            className="muted"
            style={{
              padding: "12px 20px",
              fontSize: "var(--alp-token-fontSize-bodyS)",
            }}
          >
            Showing the most recent commits only; older history exists in the
            dbt repository.
          </div>
        ) : null}
      </div>
    </div>
  );
}
