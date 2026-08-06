import {
  createConnection,
  configure as snowflakeConfigure,
  type Connection,
} from "snowflake-sdk";

export type SnowflakeCredentials = {
  account: string;
  username: string;
  privateKey: string;
  role?: string;
  warehouse?: string;
  database?: string;
  schema?: string;
};

export type SnowflakeConnector = {
  query: <Row = Record<string, unknown>>(
    sqlText: string,
    binds?: Array<string | number | boolean | null>,
  ) => Promise<Row[]>;
};

let configured = false;

/**
 * Creates a Snowflake connector that reuses one underlying connection
 * across queries. The ~1-2s JWT handshake is paid once per warm
 * serverless instance, not per query. Dead connections are detected
 * via connection.isUp() and silently re-established on the next call.
 *
 * Gotchas:
 *   - Must run on Node.js runtime. The SDK uses node:crypto/fs/net;
 *     `export const runtime = 'edge'` will fail at request time.
 *   - Default Vercel function timeout is 10s (Hobby) / 60s (Pro).
 *     Set `export const maxDuration = 60` on route files that run
 *     slow queries.
 */
export function createSnowflakeConnector(
  credentials: SnowflakeCredentials,
): SnowflakeConnector {
  const normalized: SnowflakeCredentials = {
    ...credentials,
    privateKey: normalizePrivateKey(credentials.privateKey),
  };

  let connectionPromise: Promise<Connection> | null = null;

  async function getOrCreateConnection(): Promise<Connection> {
    const cached = connectionPromise;
    if (cached) {
      try {
        const conn = await cached;
        if (conn.isUp()) {
          return conn;
        }
      } catch {
        // Previous attempt errored; fall through and reconnect.
      }
    }
    if (connectionPromise === cached) {
      connectionPromise = openConnection(normalized);
    }
    return connectionPromise!;
  }

  return {
    async query(sqlText, binds) {
      const connection = await getOrCreateConnection();
      return executeQuery(connection, sqlText, binds);
    },
  };
}

async function openConnection(
  credentials: SnowflakeCredentials,
): Promise<Connection> {
  if (!configured) {
    snowflakeConfigure({ logLevel: "ERROR" });
    configured = true;
  }

  const connection = createConnection({
    authenticator: "SNOWFLAKE_JWT",
    account: credentials.account,
    username: credentials.username,
    privateKey: credentials.privateKey,
    role: credentials.role,
    warehouse: credentials.warehouse,
    database: credentials.database,
    schema: credentials.schema,
  });

  return new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(conn);
    });
  });
}

async function executeQuery<Row>(
  connection: Connection,
  sqlText: string,
  binds?: Array<string | number | boolean | null>,
): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      binds,
      complete(err, _stmt, rows) {
        if (err) {
          reject(err);
          return;
        }
        resolve((rows ?? []) as Row[]);
      },
    });
  });
}

function normalizePrivateKey(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\r\n?/g, "\n")
    .trim();
}
