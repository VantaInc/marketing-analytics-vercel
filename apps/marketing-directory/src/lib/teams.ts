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
  },
  {
    blurb:
      "Every dashboard the sales analytics team maintains, in one place. Certified dashboards are reviewed quarterly and safe to share.",
    homeBlurb:
      "Forecasting, pipeline, productivity, and performance dashboards for the sales org.",
    label: "Sales",
    rangeEnvVar: "SALES_CATALOG_RANGE",
    slug: "sales",
  },
];

/**
 * Falls back to `<Label>!A1:Z1000` when the env var is unset, so a team page
 * works as soon as its tab is named after the team. Wide by default: parsing is
 * header-driven, so trailing empty columns cost nothing, and a column added
 * past the range would otherwise read as empty with no warning.
 */
export function rangeFor(team: Team): string {
  return process.env[team.rangeEnvVar]?.trim() || `${team.label}!A1:Z1000`;
}

export function teamBySlug(slug: string): Team | undefined {
  return TEAMS.find((team) => team.slug === slug);
}
