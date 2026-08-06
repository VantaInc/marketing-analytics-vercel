import {
  ConnectError,
  ConnectorInstallationRequiredError,
  NoValidTokenError,
  UserAuthorizationRequiredError,
  getToken,
  getTokenResponse,
  startAuthorization,
  type ConnectTokenParams,
  type ConnectTokenResponse,
} from "@vercel/connect";

export {
  ConnectError,
  ConnectorInstallationRequiredError,
  NoValidTokenError,
  UserAuthorizationRequiredError,
};

export const DEFAULT_JIRA_CONNECTOR_UID = "atlassian.com/jira";

export type JiraConnectClientOptions = {
  connectorUid: string;
};

export type JiraTokenRequest = {
  installationId?: string;
  scopes?: readonly string[];
  userId: string;
};

export type JiraAuthorizationRequest = JiraTokenRequest & {
  callbackUrl?: string;
};

export type JiraAuthorizationResult = {
  url: string;
};

export type JiraUserAuthorizationParamsInput = JiraTokenRequest;

export type JiraConnectClient = {
  getUserToken: (input: JiraTokenRequest) => Promise<string>;
  getUserTokenResponse: (
    input: JiraTokenRequest,
  ) => Promise<ConnectTokenResponse>;
  startUserAuthorization: (
    input: JiraAuthorizationRequest,
  ) => Promise<JiraAuthorizationResult>;
};

export function createJiraConnectClient({
  connectorUid,
}: JiraConnectClientOptions): JiraConnectClient {
  const normalizedConnectorUid = connectorUid.trim();

  if (!normalizedConnectorUid) {
    throw new Error("Jira connector UID is required.");
  }

  return {
    async getUserToken(input) {
      return getToken(normalizedConnectorUid, buildJiraUserTokenParams(input));
    },
    async getUserTokenResponse(input) {
      return getTokenResponse(
        normalizedConnectorUid,
        buildJiraUserTokenParams(input),
      );
    },
    async startUserAuthorization(input) {
      const result = await startAuthorization(
        normalizedConnectorUid,
        buildJiraUserTokenParams(input),
        buildAuthorizationOptions(input),
      );

      if (!isRecord(result) || typeof result.url !== "string") {
        throw new Error("Vercel Connect did not return an authorization URL.");
      }

      return {
        url: result.url,
      };
    },
  };
}

export function buildJiraUserAuthorizationParams({
  installationId,
  scopes,
  userId,
}: JiraUserAuthorizationParamsInput): ConnectTokenParams {
  return buildJiraUserTokenParams({
    installationId,
    scopes,
    userId,
  });
}

function buildJiraUserTokenParams({
  installationId,
  scopes,
  userId,
}: JiraTokenRequest): ConnectTokenParams {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    throw new Error("Jira user subject id is required.");
  }

  return {
    ...buildTokenOptions({ installationId, scopes }),
    subject: { type: "user" as const, id: normalizedUserId },
  };
}

function buildAuthorizationOptions({ callbackUrl }: JiraAuthorizationRequest) {
  return {
    ...(callbackUrl?.trim()
      ? {
          callbackUrl: callbackUrl.trim(),
        }
      : {}),
  };
}

function buildTokenOptions({
  installationId,
  scopes,
}: {
  installationId?: string;
  scopes?: readonly string[];
}) {
  return {
    ...(installationId?.trim()
      ? {
          installationId: installationId.trim(),
        }
      : {}),
    ...(scopes && scopes.length > 0
      ? {
          scopes: normalizeScopes(scopes),
        }
      : {}),
  };
}

function normalizeScopes(scopes: readonly string[]): string[] {
  return scopes.map((scope) => scope.trim()).filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
