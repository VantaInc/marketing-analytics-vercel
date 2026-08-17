import "server-only";

import {
  createSnowflakeConnector,
  type SnowflakeConnector,
} from "@vanta/snowflake";

let connector: SnowflakeConnector | null = null;

/** True when enough is configured to attempt a query at all. */
export function isSnowflakeConfigured(): boolean {
  return Boolean(
    process.env.SNOWFLAKE_ACCOUNT?.trim() &&
    process.env.SNOWFLAKE_USERNAME?.trim() &&
    process.env.SNOWFLAKE_PRIVATE_KEY?.trim(),
  );
}

export function getSnowflakeConnector(): SnowflakeConnector {
  if (connector) {
    return connector;
  }

  connector = createSnowflakeConnector({
    account: requireEnv("SNOWFLAKE_ACCOUNT"),
    database: process.env.SNOWFLAKE_DATABASE,
    privateKey: requireEnv("SNOWFLAKE_PRIVATE_KEY"),
    role: process.env.SNOWFLAKE_ROLE,
    username: requireEnv("SNOWFLAKE_USERNAME"),
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  });

  return connector;
}

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value?.trim()) {
    throw new Error(`${name} is required.`);
  }

  return value;
}
