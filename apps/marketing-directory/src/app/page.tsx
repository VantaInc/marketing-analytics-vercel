import { getCatalog } from "@/lib/catalog";
import Directory from "./directory";

/** Re-read the catalog sheet at most every 5 minutes. */
export const revalidate = 300;

/**
 * This app performs no sign-in of its own. Access is enforced by Vercel
 * Authentication on the project, which requires Vanta Okta SSO.
 *
 * That makes the project setting the only thing gating the catalog: if Vercel
 * Authentication is ever disabled, or this app is deployed to a project without
 * it, the directory is public. See the README for how to restore app-level auth
 * once the shared broker in `apps/auth` is deployed.
 */
export default async function Page() {
  const { dashboards, isSample } = await getCatalog();

  return <Directory dashboards={dashboards} isSample={isSample} />;
}
