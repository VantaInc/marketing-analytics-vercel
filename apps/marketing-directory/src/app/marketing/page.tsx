import type { Metadata } from "next";

import { TeamDirectory } from "../team-directory";

export const metadata: Metadata = { title: "Marketing dashboards" };

/** Re-read the catalog tab at most every 5 minutes. */
export const revalidate = 300;

export default async function Page() {
  return <TeamDirectory slug="marketing" />;
}
