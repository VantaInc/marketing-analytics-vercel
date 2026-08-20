import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { TEAMS } from "@/lib/teams";
import { getTeamRoster, isRosterConfigured } from "@/lib/team-roster";
import { SiteHeader } from "./site-header";

/** Re-read the roster tab at most every 5 minutes. */
export const revalidate = 300;

const PARTNERS = [
  "Marketing",
  "SDR",
  "Pre-Sales",
  "Channel",
  "Post-Sales",
  "RevOps",
  "Data Engineering",
];

const MISSION = [
  {
    body: "across all revenue teams, ensuring GTM leaders have the data they need to drive accountability and results.",
    lead: "Own forecasting, productivity, and performance metrics",
  },
  {
    body: "iterating on key meetings and reporting cadences to improve decision-making.",
    lead: "Optimize the GTM rhythm of business,",
  },
  {
    body: "that enhance sales efficiency, pipeline creation, and close rates.",
    lead: "Deliver analysis and insights",
  },
];

const FOCUS = [
  {
    points: [
      "Build and maintain Tableau dashboards for self-serve data access, enabling business users to inspect trends and key metrics.",
      "Support recurring Forecast Calls, Operating Reviews, and SIs, providing critical performance insights.",
    ],
    title: "Self-service tooling & recurring deliverables",
  },
  {
    points: [
      "Conduct deep-dive ad-hoc analyses to answer specific business questions and inform strategic decisions.",
      "Identify emerging trends and opportunities to improve revenue team efficiency.",
    ],
    title: "Custom analysis",
  },
  {
    points: [
      "Develop data-driven models to optimize pipeline creation, sales execution, and customer expansion, such as: ICP Scoring, Intent Scoring, Catalyst Health Score, and Upsell Propensity modeling to improve targeting and conversion strategies.",
    ],
    title: "Advanced analytics & predictive modeling",
  },
];

function initials(name: string): string {
  return (
    name
      .split(" ")
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export default async function Page() {
  const roster = isRosterConfigured() ? await getTeamRoster() : [];

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <SiteHeader current="/" />

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
              <span className="team-card-title">{team.label}</span>
              <span className="team-card-blurb">{team.homeBlurb}</span>
              <span className="team-card-cta">
                Go to team page
                <ArrowRight size={13} />
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
                  <span key={partner} className="partner-chip">
                    {partner}
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
                style={{ padding: "16px 18px" }}
              >
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

        {/*
         * Omitted entirely when no roster tab is configured, rather than
         * rendering an empty shell or a "not set up" notice on the landing page.
         */}
        {roster.length > 0 ? (
          <section
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 className="home-heading">Meet the team</h2>
              <span className="home-label" style={{ textTransform: "none" }}>
                Photos synced from Slack profiles.
              </span>
            </div>
            <div className="member-grid">
              {roster.map((member) => (
                <div key={member.email || member.name} className="card member">
                  {member.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="member-photo"
                      src={member.photoUrl}
                      alt={member.name}
                    />
                  ) : (
                    <span className="member-photo member-initials">
                      {initials(member.name)}
                    </span>
                  )}
                  <span className="member-name">{member.name}</span>
                  <span className="member-role">{member.role}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

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
