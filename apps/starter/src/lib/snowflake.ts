import {
  createSnowflakeConnector,
  type SnowflakeConnector,
} from "@vanta/snowflake";

let connector: SnowflakeConnector | null = null;

export function getSnowflakeConnector(): SnowflakeConnector {
  if (connector) {
    return connector;
  }

  const account = requireEnv("SNOWFLAKE_ACCOUNT");
  const username = requireEnv("SNOWFLAKE_USERNAME");
  const privateKey = requireEnv("SNOWFLAKE_PRIVATE_KEY");

  connector = createSnowflakeConnector({
    account,
    username,
    privateKey,
    role: process.env.SNOWFLAKE_ROLE,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: process.env.SNOWFLAKE_DATABASE,
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
