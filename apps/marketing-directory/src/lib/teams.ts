import "server-only";

/**
 * The teams that get their own directory page.
 *
 * Each team's dashboards live in its own tab of one spreadsheet, so a team can
 * edit its own content without being able to touch another's, while every page
 * renders through the same component — which is what keeps the design from
 * drifting apart. Adding a team is an entry here plus a range env var; no new
 * page, no new component, no design review.
 */
export type Team = {
  /** Sentence under the heading on the team's own page. */
  blurb: string;
  /** Shown on the GTM Home chooser card. */
  homeBlurb: string;
  label: string;
  /** Env var holding the A1 range for this team's tab. */
  rangeEnvVar: string;
  slug: string;
  /** Tab name in the catalog spreadsheet, exactly as it appears. */
  tab: string;
};

export const TEAMS: Team[] = [
  {
    blurb:
      "Every dashboard the marketing analytics team maintains, in one place. Certified dashboards are reviewed quarterly and safe to share.",
    homeBlurb:
      "Dashboard directory, measurement guide, and paid media values for the marketing team.",
    label: "Marketing",
    rangeEnvVar: "MARKETING_CATALOG_RANGE",
    slug: "marketing",
    tab: "Marketing Catalog",
  },
  {
    blurb:
      "Every dashboard the sales analytics team maintains, in one place. Certified dashboards are reviewed quarterly and safe to share.",
    homeBlurb:
      "Forecasting, pipeline, productivity, and performance dashboards for the sales org.",
    label: "Sales",
    rangeEnvVar: "SALES_CATALOG_RANGE",
    slug: "sales",
    tab: "Sales Catalog",
  },
];

/**
 * A1 notation requires a sheet name containing spaces or punctuation to be
 * single-quoted, with any literal quote inside it doubled. "Marketing Catalog"
 * unquoted is rejected by the Sheets API, so this is not cosmetic.
 */
export function quoteSheetName(tab: string): string {
  return /^[A-Za-z0-9_]+$/.test(tab) ? tab : `'${tab.replace(/'/g, "''")}'`;
}

export function rangeFor(team: Team): string {
  return (
    process.env[team.rangeEnvVar]?.trim() ||
    `${quoteSheetName(team.tab)}!A1:Z1000`
  );
}

export function teamBySlug(slug: string): Team | undefined {
  return TEAMS.find((team) => team.slug === slug);
}
