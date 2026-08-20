import { notFound } from "next/navigation";

import { getCatalog } from "@/lib/catalog";
import { rangeFor, teamBySlug } from "@/lib/teams";
import Directory from "./directory";

/**
 * One renderer for every team's page. Teams differ only in which tab they read
 * and the sentence under the heading, so there is deliberately no per-team
 * component to drift out of sync.
 */
export async function TeamDirectory({ slug }: { slug: string }) {
  const team = teamBySlug(slug);

  if (!team) {
    notFound();
  }

  const { dashboards, error, isSample } = await getCatalog(rangeFor(team));

  return (
    <Directory
      blurb={team.blurb}
      dashboards={dashboards}
      error={error}
      isSample={isSample}
    />
  );
}
