import { getSnowflakeConnector } from "./snowflake";

export type DomainRow = Record<string, unknown>;

export async function listDomains(): Promise<DomainRow[]> {
  return getSnowflakeConnector().query<DomainRow>(
    "SELECT * FROM vanta.exports.vercel_dim_all_domains LIMIT 50",
  );
}
