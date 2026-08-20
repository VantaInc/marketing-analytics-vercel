"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CircleCheck,
  CircleDashed,
  CircleMinus,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
} from "lucide-react";

import type { Dashboard, DashboardStatus } from "@/lib/catalog";
import { SiteHeader } from "./site-header";

/*
 * Keyed on the tool name lowercased and whitespace-collapsed. Sheet values are
 * typed by hand, so "tableau", "Tableau ", and "Google  Sheets" all have to land
 * on the same colour — an exact-match lookup silently fell through to grey.
 */
const TOOL_DOT: Record<string, string> = {
  looker: "var(--alp-token-dataViz-category4)",
  tableau: "var(--alp-token-dataViz-category6)",
  sigma: "var(--alp-token-dataViz-category2)",
  amplitude: "var(--alp-token-dataViz-category1)",
  sheets: "var(--alp-token-dataViz-category7)",
  "google sheets": "var(--alp-token-dataViz-category7)",
  vercel: "var(--alp-token-sand-1400)",
};

const TOOL_LABEL: Record<string, string> = { sheets: "Google Sheets" };

/** Sheet values are hand-typed; normalise before matching. */
function toolKey(tool: string): string {
  return tool.trim().toLowerCase().replace(/\s+/g, " ");
}

const STATUS: Record<
  DashboardStatus,
  { bg: string; color: string; Icon: typeof CircleCheck }
> = {
  Certified: {
    bg: "var(--alp-token-bg-successWeak)",
    color: "var(--alp-token-text-success)",
    Icon: CircleCheck,
  },
  Working: {
    bg: "var(--alp-token-bg-neutralWeak)",
    color: "var(--alp-token-text-secondary)",
    Icon: CircleDashed,
  },
  Deprecated: {
    bg: "var(--alp-token-bg-dangerWeak)",
    color: "var(--alp-token-text-danger)",
    Icon: CircleMinus,
  },
};

const DOC_ICON: Record<string, typeof BookOpen> = {
  Guru: BookOpen,
  Glean: Search,
};

const ALL = "All";

function initials(owner: string): string {
  return owner
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

/**
 * Card body: the description, clamped to two lines so the grid stays even,
 * and the screenshot. One toggle reveals both.
 *
 * The toggle appears when the text overflows or there is a screenshot to show.
 * Overflow depends on how wide the card is, so that check re-runs on resize
 * rather than once on mount — a description that fits at desktop width can
 * clamp on a narrow one.
 *
 * A screenshot that fails to load removes itself rather than leaving a broken
 * frame in the card. Drive serves a sign-in page instead of image bytes when a
 * file is not shared widely enough, which is the usual way this goes wrong.
 */
function CardBody({
  description,
  name,
  screenshot,
}: {
  description: string;
  name: string;
  screenshot?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;

    // While expanded there is no clamp to measure against, so leave the last
    // reading in place — it is what the toggle needs on the way back down.
    if (!node || expanded) {
      return;
    }

    const measure = () => setOverflows(node.scrollHeight > node.clientHeight);
    const observer = new ResizeObserver(measure);

    observer.observe(node);
    measure();

    return () => observer.disconnect();
  }, [description, expanded]);

  const hasScreenshot = Boolean(screenshot) && !imageBroken;

  return (
    <>
      <div
        ref={ref}
        className={expanded ? undefined : "truncate-2"}
        style={{
          fontSize: "var(--alp-token-fontSize-bodyM)",
          lineHeight: "var(--alp-token-lineHeight-bodyM)",
          color: "var(--alp-token-text-secondary)",
        }}
      >
        {description}
      </div>
      {expanded && hasScreenshot ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="screenshot"
          src={screenshot}
          alt={`Screenshot of ${name}`}
          loading="lazy"
          decoding="async"
          onError={() => setImageBroken(true)}
        />
      ) : null}
      {overflows || hasScreenshot || expanded ? (
        <button
          className="link-button"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </>
  );
}

export type DirectoryProps = {
  /** Sentence under the heading — differs per team. */
  blurb: string;
  dashboards: Dashboard[];
  /** Set when the catalog read failed; shown instead of an empty grid. */
  error?: string | null;
  isSample: boolean;
  /** Omitted while the app delegates access control to Vercel Authentication. */
  viewerInitials?: string;
};

export default function Directory({
  blurb,
  dashboards,
  error = null,
  isSample,
  viewerInitials,
}: DirectoryProps) {
  const [query, setQuery] = useState("");
  const [tool, setTool] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [category, setCategory] = useState(ALL);

  const tools = useMemo(
    () => [...new Set(dashboards.map((d) => d.tool))].sort(),
    [dashboards],
  );

  const categories = useMemo(
    () => [ALL, ...new Set(dashboards.map((d) => d.category))],
    [dashboards],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return dashboards.filter(
      (d) =>
        (tool === ALL || d.tool === tool) &&
        (status === ALL || d.status === status) &&
        (category === ALL || d.category === category) &&
        (!q ||
          `${d.name} ${d.description} ${d.owner}`.toLowerCase().includes(q)),
    );
  }, [dashboards, query, tool, status, category]);

  const clear = () => {
    setQuery("");
    setTool(ALL);
    setStatus(ALL);
    setCategory(ALL);
  };

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <SiteHeader current="/" viewerInitials={viewerInitials} />

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 32px 64px",
          boxSizing: "border-box",
        }}
      >
        {error !== null ? (
          <div
            className="card"
            style={{ gap: 6, marginBottom: 24, alignItems: "flex-start" }}
          >
            <span style={{ color: "var(--alp-token-text-danger)" }}>
              Couldn&rsquo;t read this team&rsquo;s tab from the catalog sheet.
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
              Most often the tab was renamed. The range is set per team by
              environment variable.
            </span>
          </div>
        ) : null}

        {isSample ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 24,
              padding: "10px 14px",
              borderRadius: "var(--alp-token-borderRadius-card)",
              background: "var(--alp-token-bg-neutralWeak)",
              border: "1px dashed var(--alp-token-border-default)",
              fontSize: "var(--alp-token-fontSize-bodyS)",
              color: "var(--alp-token-text-secondary)",
            }}
          >
            Showing sample data. Set{" "}
            <code>DASHBOARD_CATALOG_SPREADSHEET_ID</code> and{" "}
            <code>GOOGLE_SERVICE_ACCOUNT_JSON_B64</code> to read the real
            catalog.
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            marginBottom: 24,
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
              Find the right dashboard
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "var(--alp-token-fontSize-bodyM)",
                lineHeight: "var(--alp-token-lineHeight-bodyM)",
                color: "var(--alp-token-text-secondary)",
                maxWidth: 560,
              }}
            >
              {blurb}
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
            {filtered.length} of {dashboards.length} dashboards
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              position: "relative",
              flex: 1,
              minWidth: 260,
              maxWidth: 420,
            }}
          >
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--alp-token-icon-secondary)",
              }}
            />
            <input
              className="control"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, metric, or question…"
              aria-label="Search dashboards"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "0 12px 0 34px",
              }}
            />
          </div>
          <select
            className="control"
            value={tool}
            onChange={(event) => setTool(event.target.value)}
            aria-label="Filter by tool"
            style={{ padding: "0 10px" }}
          >
            <option value={ALL}>All tools</option>
            {tools.map((name) => (
              <option key={name} value={name}>
                {TOOL_LABEL[toolKey(name)] ?? name}
              </option>
            ))}
          </select>
          <select
            className="control"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
            style={{ padding: "0 10px" }}
          >
            <option value={ALL}>All statuses</option>
            <option value="Certified">Certified</option>
            <option value="Working">Working</option>
            <option value="Deprecated">Deprecated</option>
          </select>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 28,
          }}
        >
          {categories.map((name) => (
            <button
              key={name}
              className="chip"
              type="button"
              data-active={name === category}
              aria-pressed={name === category}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((dashboard) => {
              const { bg, color, Icon } = STATUS[dashboard.status];

              return (
                <div key={dashboard.name} className="card">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        height: 22,
                        padding: "0 9px",
                        borderRadius: 999,
                        background: "var(--alp-token-bg-neutralWeak)",
                        border: "1px solid var(--alp-token-border-weak)",
                        fontSize: "var(--alp-token-fontSize-bodyS)",
                        fontWeight: 500,
                        color: "var(--alp-token-text-secondary)",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background:
                            TOOL_DOT[toolKey(dashboard.tool)] ??
                            "var(--alp-token-icon-weak)",
                        }}
                      />
                      {TOOL_LABEL[toolKey(dashboard.tool)] ?? dashboard.tool}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        height: 22,
                        padding: "0 8px",
                        borderRadius: 4,
                        background: bg,
                        color,
                        fontSize: "var(--alp-token-fontSize-bodyS)",
                        fontWeight: 500,
                      }}
                    >
                      <Icon size={11} />
                      {dashboard.status}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <a
                      className="card-link"
                      href={dashboard.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {dashboard.name}
                    </a>
                    <CardBody
                      description={dashboard.description}
                      name={dashboard.name}
                      screenshot={dashboard.screenshot}
                    />
                  </div>

                  {dashboard.docs.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {dashboard.docs.map((doc) => {
                        const DocIcon = DOC_ICON[doc.source] ?? FileText;

                        return (
                          <a
                            key={`${doc.source}:${doc.label}`}
                            className="doc-pill"
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            title={`Opens in ${doc.source}`}
                          >
                            <DocIcon size={10} />
                            {doc.label}
                            <ExternalLink
                              size={8}
                              style={{ color: "var(--alp-token-icon-weak)" }}
                            />
                          </a>
                        );
                      })}
                    </div>
                  ) : null}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      marginTop: "auto",
                      paddingTop: 12,
                      borderTop: "1px solid var(--alp-token-border-weak)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          flex: "none",
                          width: 20,
                          height: 20,
                          borderRadius: 999,
                          background: "var(--alp-token-purple-200)",
                          color: "var(--alp-token-purple-1100)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          fontWeight: 600,
                        }}
                      >
                        {initials(dashboard.owner)}
                      </span>
                      <span
                        style={{
                          fontSize: "var(--alp-token-fontSize-bodyS)",
                          color: "var(--alp-token-text-secondary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {dashboard.owner}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: "var(--alp-token-fontSize-bodyS)",
                        color: "var(--alp-token-text-secondary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <RefreshCw
                        size={11}
                        style={{ color: "var(--alp-token-icon-weak)" }}
                      />
                      {dashboard.refresh}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              padding: "72px 24px",
              background: "var(--alp-token-bg-default)",
              border: "1px dashed var(--alp-token-border-default)",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <Search size={20} style={{ color: "var(--alp-token-icon-weak)" }} />
            <div
              style={{
                fontSize: "var(--alp-token-fontSize-bodyL)",
                fontWeight: 600,
              }}
            >
              No dashboards match
            </div>
            <div
              style={{
                fontSize: "var(--alp-token-fontSize-bodyM)",
                color: "var(--alp-token-text-secondary)",
                maxWidth: 380,
              }}
            >
              Try a different search, or clear the filters.
            </div>
            <button
              className="chip"
              type="button"
              onClick={clear}
              style={{
                marginTop: 6,
                height: 32,
                borderRadius: 4,
                fontSize: "var(--alp-token-fontSize-bodyM)",
                fontWeight: 500,
                color: "var(--alp-token-text-default)",
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        <div
          style={{
            marginTop: 48,
            paddingTop: 20,
            borderTop: "1px solid var(--alp-token-border-weak)",
            fontSize: "var(--alp-token-fontSize-bodyS)",
            color: "var(--alp-token-text-secondary)",
          }}
        >
          Maintained by Marketing Analytics · Owners re-certify quarterly
        </div>
      </main>
    </div>
  );
}
