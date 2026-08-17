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

/**
 * The identifiers that decide whether a fully-qualified name resolves. Shown on
 * the page when a read fails: a grant made to a different role than the one the
 * app connects as is indistinguishable, from the error alone, from the table
 * not existing. Role, warehouse, and database are identifiers, not secrets —
 * the username and key are deliberately not included.
 */
export function getSnowflakeContext(): {
  database: string;
  role: string;
  warehouse: string;
} {
  return {
    database: process.env.SNOWFLAKE_DATABASE?.trim() || "(unset)",
    role: process.env.SNOWFLAKE_ROLE?.trim() || "(unset — user's default role)",
    warehouse:
      process.env.SNOWFLAKE_WAREHOUSE?.trim() ||
      "(unset — user's default warehouse)",
  };
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
