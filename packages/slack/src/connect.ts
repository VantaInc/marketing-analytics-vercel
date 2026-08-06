import {
  ConnectError,
  ConnectorInstallationRequiredError,
  NoValidTokenError,
  UserAuthorizationRequiredError,
  getToken,
  startAuthorization,
  type ConnectTokenParams,
} from "@vercel/connect";

import { testSlackToken, type SlackAuthTestResult } from "./web-api";

export {
  ConnectError,
  ConnectorInstallationRequiredError,
  NoValidTokenError,
  UserAuthorizationRequiredError,
};

export type SlackConnectClientOptions = {
  connectorUid: string;
};

export type SlackTokenRequest = {
  installationId?: string;
  scopes?: readonly string[];
};

export type SlackUserTokenRequest = SlackTokenRequest & {
  userId: string;
};

export type SlackAuthorizationRequest = SlackUserTokenRequest & {
  callbackUrl?: string;
};

export type SlackAuthorizationResult = {
  url: string;
};

export type SlackUserAuthorizationParamsInput = SlackTokenRequest & {
  userId: string;
};

export type SlackConnectClient = {
  getAppToken: (input?: SlackTokenRequest) => Promise<string>;
  getUserToken: (input: SlackUserTokenRequest) => Promise<string>;
  startUserAuthorization: (
    input: SlackAuthorizationRequest,
  ) => Promise<SlackAuthorizationResult>;
  testAppConnection: (
    input?: SlackTokenRequest,
  ) => Promise<SlackAuthTestResult>;
  testUserConnection: (
    input: SlackUserTokenRequest,
  ) => Promise<SlackAuthTestResult>;
};

/**
 * Creates a Vercel Connect-backed client for one Slack connector UID.
 * Keep this behind a server boundary; the returned token helpers can retrieve
 * Slack credentials when a future app is ready to call the Slack Web API.
 */
export function createSlackConnectClient({
  connectorUid,
}: SlackConnectClientOptions): SlackConnectClient {
  const normalizedConnectorUid = connectorUid.trim();

  if (!normalizedConnectorUid) {
    throw new Error("Slack connector UID is required.");
  }

  async function getAppToken(input: SlackTokenRequest = {}): Promise<string> {
    return getToken(normalizedConnectorUid, buildAppTokenParams(input));
  }

  async function getUserToken(input: SlackUserTokenRequest): Promise<string> {
    return getToken(normalizedConnectorUid, buildUserTokenParams(input));
  }

  return {
    getAppToken,
    getUserToken,
    async startUserAuthorization(input) {
      const result = await startAuthorization(
        normalizedConnectorUid,
        buildUserTokenParams(input),
        buildAuthorizationOptions(input),
      );

      if (!isRecord(result) || typeof result.url !== "string") {
        throw new Error("Vercel Connect did not return an authorization URL.");
      }

      return {
        url: result.url,
      };
    },
    async testAppConnection(input) {
      const token = await getAppToken(input);
      return testSlackToken(token);
    },
    async testUserConnection(input) {
      const token = await getUserToken(input);
      return testSlackToken(token);
    },
  };
}

/**
 * Builds the user-subject params shared by direct `startAuthorization` calls.
 * Use this when an app should prove user authorization before adding any
 * token-backed Slack API calls.
 */
export function buildSlackUserAuthorizationParams({
  installationId,
  scopes,
  userId,
}: SlackUserAuthorizationParamsInput): ConnectTokenParams {
  return buildUserTokenParams({
    installationId,
    scopes,
    userId,
  });
}

function buildAppTokenParams({ installationId, scopes }: SlackTokenRequest) {
  return {
    ...buildTokenOptions({ installationId, scopes }),
    subject: { type: "app" as const },
  };
}

function buildUserTokenParams({
  installationId,
  scopes,
  userId,
}: SlackUserTokenRequest) {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    throw new Error("Slack user subject id is required.");
  }

  return {
    ...buildTokenOptions({ installationId, scopes }),
    subject: { type: "user" as const, id: normalizedUserId },
  };
}

function buildAuthorizationOptions({ callbackUrl }: SlackAuthorizationRequest) {
  return {
    ...(callbackUrl?.trim()
      ? {
          callbackUrl: callbackUrl.trim(),
        }
      : {}),
  };
}

function buildTokenOptions({ installationId, scopes }: SlackTokenRequest) {
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
