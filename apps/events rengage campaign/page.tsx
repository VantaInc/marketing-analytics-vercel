import "./tokens.css";
import { getDashboardData } from "@/lib/reengage/queries";
import Dashboard from "./dashboard";

// Snowflake SDK requires the Node runtime; queries can be slow.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function ReengagePage() {
  const data = await getDashboardData();
  return <Dashboard data={data} />;
}
