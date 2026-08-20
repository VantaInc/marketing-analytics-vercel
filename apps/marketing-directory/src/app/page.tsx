import Link from "next/link";

import { TEAMS } from "@/lib/teams";
import { SiteHeader } from "./site-header";

/** Partner chips and their icons, in the mock's order. */
const PARTNERS = [
  { icon: "fa-bullhorn", label: "Marketing" },
  { icon: "fa-phone", label: "SDR" },
  { icon: "fa-handshake", label: "Pre-Sales" },
  { icon: "fa-diagram-project", label: "Channel" },
  { icon: "fa-rotate", label: "Post-Sales" },
  { icon: "fa-gears", label: "RevOps" },
  { icon: "fa-database", label: "Data Engineering" },
];

/** Icon beside each team card, keyed by slug. */
const TEAM_ICON: Record<string, string> = {
  marketing: "fa-bullhorn",
  sales: "fa-handshake",
};

const MISSION = [
  {
    body: "across all revenue teams, ensuring GTM leaders have the data they need to drive accountability and results.",
    icon: "fa-bullseye",
    lead: "Own forecasting, productivity, and performance metrics",
  },
  {
    body: "iterating on key meetings and reporting cadences to improve decision-making.",
    icon: "fa-calendar-check",
    lead: "Optimize the GTM rhythm of business,",
  },
  {
    body: "that enhance sales efficiency, pipeline creation, and close rates.",
    icon: "fa-lightbulb",
    lead: "Deliver analysis and insights",
  },
];

const FOCUS = [
  {
    points: [
      "Build and maintain Tableau dashboards for self-serve data access, enabling business users to inspect trends and key metrics.",
      "Support recurring Forecast Calls, Operating Reviews, and SIs, providing critical performance insights.",
    ],
    icon: "fa-sliders",
    title: "Self-service tooling & recurring deliverables",
  },
  {
    points: [
      "Conduct deep-dive ad-hoc analyses to answer specific business questions and inform strategic decisions.",
      "Identify emerging trends and opportunities to improve revenue team efficiency.",
    ],
    icon: "fa-magnifying-glass-chart",
    title: "Custom analysis",
  },
  {
    points: [
      "Develop data-driven models to optimize pipeline creation, sales execution, and customer expansion, such as: ICP Scoring, Intent Scoring, Catalyst Health Score, and Upsell Propensity modeling to improve targeting and conversion strategies.",
    ],
    icon: "fa-chart-line",
    title: "Advanced analytics & predictive modeling",
  },
];

export default async function Page() {
  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <SiteHeader current="/" label="GTM Analytics" />

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1000,
          margin: "0 auto",
          padding: "40px 32px 64px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 32,
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
            GTM Analytics
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
            Data-driven decision-making across the revenue organization. Pick
            your team to get to your dashboards.
          </p>
        </div>

        <div className="team-cards">
          {TEAMS.map((team) => (
            <Link
              key={team.slug}
              className="card team-card"
              href={`/${team.slug}`}
            >
              <i
                className={`fa-solid ${TEAM_ICON[team.slug] ?? "fa-chart-line"} team-card-icon`}
                aria-hidden="true"
              />
              <span className="team-card-title">{team.label}</span>
              <span className="team-card-blurb">{team.homeBlurb}</span>
              <span className="team-card-cta">
                Go to team page
                <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>

        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 className="home-heading">Scope &amp; charter</h2>
          <div className="card" style={{ gap: 12, padding: "20px 24px" }}>
            <p className="home-body">
              The GTM Analytics team at Vanta partners with Marketing, SDR,
              Pre-Sales, Channel, and Post-Sales teams, as well as RevOps, to
              drive data-driven decision-making and optimize performance across
              the revenue organization. We collaborate with RevOps on priorities
              and scope to ensure our deliverables support key GTM initiatives.
            </p>
            <p className="home-body">
              Additionally, we work closely with Data Engineering to define
              dataset requirements and enhance our ability to surface critical
              insights. Our work ensures accountability, efficiency, and growth
              through forecasting, performance measurement, and strategic
              analysis.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="home-label">Who we partner with</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {PARTNERS.map((partner) => (
                  <span key={partner.label} className="partner-chip">
                    <i
                      className={`fa-solid ${partner.icon}`}
                      aria-hidden="true"
                    />
                    {partner.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 className="home-heading">Our mission</h2>
          <div className="home-grid">
            {MISSION.map((item) => (
              <div
                key={item.lead}
                className="card"
                style={{ padding: "16px 18px", gap: 8 }}
              >
                <i
                  className={`fa-solid ${item.icon} home-icon`}
                  aria-hidden="true"
                />
                <p className="home-body">
                  <b>{item.lead}</b> {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 className="home-heading">Key areas of focus</h2>
          <div className="home-grid">
            {FOCUS.map((area) => (
              <div
                key={area.title}
                className="card"
                style={{ padding: "16px 18px", gap: 8 }}
              >
                <i
                  className={`fa-solid ${area.icon} home-icon`}
                  aria-hidden="true"
                />
                <span className="focus-title">{area.title}</span>
                <ul className="focus-list">
                  {area.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div
          style={{
            paddingTop: 20,
            borderTop: "1px solid var(--alp-token-border-weak)",
            fontSize: "var(--alp-token-fontSize-bodyS)",
            color: "var(--alp-token-text-secondary)",
          }}
        >
          Maintained by GTM Analytics · In partnership with RevOps and Data
          Engineering
        </div>
      </main>
    </div>
  );
}
