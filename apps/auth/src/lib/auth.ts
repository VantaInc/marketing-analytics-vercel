import "server-only";

import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import {
  AuthConfigurationError,
  AuthProviderError,
  EDGE_CONFIG_AUTH_CLIENT_KEY_PREFIX,
  createClientSecret,
  createCentralAuthService,
  createSignedSessionToken,
  createVercelAppIdentityProvider,
  getAuthClientConfigKey,
  hashClientSecret,
  normalizeAuthClientId,
  parseAuthClientConfig,
  verifySignedSessionToken,
  type AuthSession,
  type AuthUser,
  type CentralAuthClientConfig,
  type CentralAuthClientSummary,
  type CentralAuthAuthorizeRequest,
} from "@vanta/auth";
import { createClient as createEdgeConfigClient } from "@vercel/edge-config";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export const AUTH_SESSION_COOKIE = "vanta_auth_session";
export const OAUTH_CODE_VERIFIER_COOKIE = "vanta_auth_oauth_code_verifier";
export const OAUTH_NONCE_COOKIE = "vanta_auth_oauth_nonce";
export const OAUTH_STATE_COOKIE = "vanta_auth_oauth_state";
export const PENDING_AUTH_REQUEST_COOKIE = "vanta_auth_pending_request";

const OAUTH_COOKIE_MAX_AGE_SECONDS = 10 * 60;
const DEFAULT_ALLOWED_EMAIL_DOMAINS = "vanta.com";
const LEGACY_EDGE_CONFIG_AUTH_CLIENT_KEY_PREFIX = "auth_client:";
const SESSION_AUDIENCE = "@vanta/auth-app";
const SESSION_ISSUER = "@vanta/auth-app/session";
const VERCEL_CALLBACK_PATH = "/api/auth/callback";
const VERCEL_EDGE_CONFIG_API_URL = "https://api.vercel.com/v1/edge-config";

let edgeConfigClient: ReturnType<typeof createEdgeConfigClient> | undefined;

export type AuthRuntimeStatus = {
  allowedEmailDomains: string[];
  clientError?: string;
  clients: CentralAuthClientSummary[];
  edgeConfigId?: string;
  missingEnv: string[];
  registrationEnabled: boolean;
  registrationMissingEnv: string[];
};

export type PendingAuthorizationRequest = CentralAuthAuthorizeRequest;

export type RegisteredAuthClient = {
  client: CentralAuthClientConfig;
  clientSecret: string;
};

export async function applySessionCookie({
  expiresAtMs,
  response,
  user,
}: {
  expiresAtMs: number;
  response: NextResponse;
  user: AuthUser;
}) {
  const now = Date.now();
  const maxAgeSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
  const sessionToken = await createSignedSessionToken({
    audience: SESSION_AUDIENCE,
    expiresAtMs,
    issuer: SESSION_ISSUER,
    signingSecret: requireEnv("AUTH_SECRET"),
    user,
  });

  response.cookies.set(
    AUTH_SESSION_COOKIE,
    sessionToken,
    authCookieOptions(maxAgeSeconds),
  );
}

export function buildVercelSignInResponse({
  pendingRequest,
  request,
}: {
  pendingRequest?: PendingAuthorizationRequest;
  request: NextRequest;
}) {
  const codeVerifier = randomBase64Url();
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  const nonce = randomBase64Url();
  const state = randomBase64Url();
  const provider = createVercelProvider(request);
  const response = NextResponse.redirect(
    provider.createAuthorizationUrl({
      codeChallenge,
      nonce,
      state,
    }),
  );
  const cookieOptions = transientCookieOptions();

  response.cookies.set(OAUTH_CODE_VERIFIER_COOKIE, codeVerifier, cookieOptions);
  response.cookies.set(OAUTH_NONCE_COOKIE, nonce, cookieOptions);
  response.cookies.set(OAUTH_STATE_COOKIE, state, cookieOptions);

  if (pendingRequest) {
    response.cookies.set(
      PENDING_AUTH_REQUEST_COOKIE,
      encodePendingAuthorizationRequest(pendingRequest),
      cookieOptions,
    );
  }

  return response;
}

export function clearAuthCookies(response: NextResponse) {
  for (const cookieName of [
    AUTH_SESSION_COOKIE,
    OAUTH_CODE_VERIFIER_COOKIE,
    OAUTH_NONCE_COOKIE,
    OAUTH_STATE_COOKIE,
    PENDING_AUTH_REQUEST_COOKIE,
  ]) {
    response.cookies.set(cookieName, "", {
      maxAge: 0,
      path: "/",
    });
  }
}

export function clearOauthCookies(response: NextResponse) {
  for (const cookieName of [
    OAUTH_CODE_VERIFIER_COOKIE,
    OAUTH_NONCE_COOKIE,
    OAUTH_STATE_COOKIE,
    PENDING_AUTH_REQUEST_COOKIE,
  ]) {
    response.cookies.set(cookieName, "", {
      maxAge: 0,
      path: "/",
    });
  }
}

export function createClientRedirectResponse({
  code,
  pendingRequest,
}: {
  code: string;
  pendingRequest: PendingAuthorizationRequest;
}) {
  const redirectUrl = new URL(pendingRequest.redirectUri);

  redirectUrl.searchParams.set("code", code);
  redirectUrl.searchParams.set("state", pendingRequest.state);

  return NextResponse.redirect(redirectUrl);
}

export function createErrorResponse(error: unknown) {
  if (error instanceof AuthProviderError) {
    return NextResponse.json(
      {
        error: error.code ?? "auth_error",
        error_description: error.message,
      },
      { status: error.status ?? 400 },
    );
  }

  if (error instanceof AuthConfigurationError) {
    return NextResponse.json(
      {
        error: "server_configuration_error",
        error_description: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      error: "auth_error",
      error_description:
        error instanceof Error ? error.message : "Authentication failed.",
    },
    { status: 400 },
  );
}

export function createVercelProvider(request: NextRequest) {
  return createVercelAppIdentityProvider({
    callbackUrl: new URL(
      VERCEL_CALLBACK_PATH,
      request.nextUrl.origin,
    ).toString(),
    clientId: requireEnv("NEXT_PUBLIC_VERCEL_APP_CLIENT_ID"),
    clientSecret: requireEnv("VERCEL_APP_CLIENT_SECRET"),
  });
}

export async function getAuthRuntimeStatus(): Promise<AuthRuntimeStatus> {
  const missingEnv = [
    "NEXT_PUBLIC_VERCEL_APP_CLIENT_ID",
    "VERCEL_APP_CLIENT_SECRET",
    "AUTH_SECRET",
    "EDGE_CONFIG",
  ].filter((name) => !process.env[name]?.trim());
  const registrationMissingEnv = ["VERCEL_API_TOKEN"].filter(
    (name) => !process.env[name]?.trim(),
  );
  const adminEmails = readAdminEmails();

  if (adminEmails.length === 0) {
    registrationMissingEnv.push("VANTA_AUTH_ADMIN_EMAILS");
  }

  let clients: CentralAuthClientConfig[] = [];
  let clientError: string | undefined;
  let edgeConfigId: string | undefined;

  try {
    edgeConfigId = process.env.EDGE_CONFIG?.trim()
      ? getEdgeConfigId()
      : undefined;
    clients = process.env.EDGE_CONFIG?.trim() ? await readAuthClients() : [];
  } catch (error) {
    clientError = error instanceof Error ? error.message : String(error);
  }

  return {
    allowedEmailDomains: readAllowedEmailDomains(),
    clientError,
    clients: createCentralAuthService({
      allowedEmailDomains: readAllowedEmailDomains(),
      clients,
      issuer: SESSION_ISSUER,
      signingSecret: process.env.AUTH_SECRET || "status-placeholder",
    }).getClientSummaries(),
    edgeConfigId,
    missingEnv,
    registrationEnabled:
      missingEnv.length === 0 && registrationMissingEnv.length === 0,
    registrationMissingEnv,
  };
}

export function canManageAuthClients(user: AuthUser | null | undefined) {
  const adminEmails = readAdminEmails();
  const userEmail = user?.email?.trim().toLowerCase();

  return Boolean(
    userEmail && adminEmails.length > 0 && adminEmails.includes(userEmail),
  );
}

export async function getCentralAuthService() {
  return createCentralAuthService({
    allowedEmailDomains: readAllowedEmailDomains(),
    clients: await readAuthClients(),
    issuer: SESSION_ISSUER,
    signingSecret: requireEnv("AUTH_SECRET"),
  });
}

export async function getCentralAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    return await verifySignedSessionToken({
      audience: SESSION_AUDIENCE,
      issuer: SESSION_ISSUER,
      signingSecret: requireEnv("AUTH_SECRET"),
      token: sessionToken,
    });
  } catch {
    return null;
  }
}

export function readAuthorizeRequest(
  searchParams: URLSearchParams,
): PendingAuthorizationRequest {
  const responseType = searchParams.get("response_type") ?? "code";

  if (responseType !== "code") {
    throw new AuthProviderError({
      code: "unsupported_response_type",
      message: "Only response_type=code is supported.",
      status: 400,
    });
  }

  return {
    clientId: requireSearchParam(searchParams, "client_id"),
    redirectUri: requireSearchParam(searchParams, "redirect_uri"),
    state: requireSearchParam(searchParams, "state"),
  };
}

export async function registerAuthClient({
  id,
  name,
  redirectUris,
  user,
}: {
  id: string;
  name?: string;
  redirectUris: string[];
  user: AuthUser;
}): Promise<RegisteredAuthClient> {
  assertUserCanManageClients(user);

  const now = new Date().toISOString();
  const clientId = normalizeAuthClientId(id);
  const clientSecret = createClientSecret();
  const client = parseAuthClientConfig(
    {
      createdAt: now,
      createdBy: user.email ?? user.id,
      enabled: true,
      id: clientId,
      name,
      redirectUris,
      secretHash: await hashClientSecret({
        clientSecret,
        signingSecret: requireEnv("AUTH_SECRET"),
      }),
      updatedAt: now,
    },
    `auth client ${clientId}`,
  );

  await writeAuthClient(client);

  return {
    client,
    clientSecret,
  };
}

export function readPendingAuthorizationRequest(
  request: NextRequest,
): PendingAuthorizationRequest | null {
  const value = request.cookies.get(PENDING_AUTH_REQUEST_COOKIE)?.value;

  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    );

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const record = parsed as Record<string, unknown>;

    if (
      typeof record.clientId !== "string" ||
      typeof record.redirectUri !== "string" ||
      typeof record.state !== "string"
    ) {
      return null;
    }

    return {
      clientId: record.clientId,
      redirectUri: record.redirectUri,
      state: record.state,
    };
  } catch {
    return null;
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value?.trim()) {
    throw new AuthConfigurationError(`${name} is required.`);
  }

  return value;
}

function assertUserAllowed(user: AuthUser) {
  const allowedDomains = readAllowedEmailDomains();

  if (allowedDomains.length === 0) {
    return;
  }

  const emailDomain = user.email?.split("@").at(-1)?.toLowerCase();

  if (!emailDomain || !allowedDomains.includes(emailDomain)) {
    throw new AuthProviderError({
      code: "access_denied",
      message: "User email domain is not allowed to manage auth clients.",
      status: 403,
    });
  }
}

function assertUserCanManageClients(user: AuthUser) {
  assertUserAllowed(user);

  if (!canManageAuthClients(user)) {
    throw new AuthProviderError({
      code: "access_denied",
      message: "User is not allowed to manage auth clients.",
      status: 403,
    });
  }
}

function authCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    maxAge: maxAgeSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function encodePendingAuthorizationRequest(
  request: PendingAuthorizationRequest,
) {
  return Buffer.from(JSON.stringify(request), "utf8").toString("base64url");
}

function randomBase64Url() {
  return crypto.randomBytes(32).toString("base64url");
}

function readAllowedEmailDomains() {
  return (
    process.env.VANTA_AUTH_ALLOWED_EMAIL_DOMAINS ??
    DEFAULT_ALLOWED_EMAIL_DOMAINS
  )
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

function readAdminEmails() {
  return (process.env.VANTA_AUTH_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function readAuthClients(): Promise<CentralAuthClientConfig[]> {
  const values = (await getEdgeConfigClient().getAll()) as Record<
    string,
    unknown
  >;

  return Object.entries(values)
    .filter(
      ([key]) =>
        key.startsWith(EDGE_CONFIG_AUTH_CLIENT_KEY_PREFIX) ||
        key.startsWith(LEGACY_EDGE_CONFIG_AUTH_CLIENT_KEY_PREFIX),
    )
    .map(([key, value]) => parseAuthClientConfig(value, key));
}

function getEdgeConfigClient() {
  edgeConfigClient ??= createEdgeConfigClient(requireEnv("EDGE_CONFIG"));
  return edgeConfigClient;
}

function getEdgeConfigId(): string {
  const url = new URL(requireEnv("EDGE_CONFIG"));
  const [edgeConfigId] = url.pathname.split("/").filter(Boolean);

  if (!edgeConfigId) {
    throw new AuthConfigurationError(
      "EDGE_CONFIG must be a Vercel Edge Config connection string.",
    );
  }

  return edgeConfigId;
}

async function writeAuthClient(client: CentralAuthClientConfig) {
  const url = new URL(
    `${VERCEL_EDGE_CONFIG_API_URL}/${getEdgeConfigId()}/items`,
  );
  const teamId =
    process.env.VANTA_AUTH_EDGE_CONFIG_TEAM_ID ??
    process.env.VERCEL_TEAM_ID ??
    process.env.VERCEL_ORG_ID;

  if (teamId?.trim()) {
    url.searchParams.set("teamId", teamId.trim());
  }

  const response = await fetch(url, {
    body: JSON.stringify({
      items: [
        {
          description: `${client.name ?? client.id} auth client`,
          key: getAuthClientConfigKey(client.id),
          operation: "upsert",
          value: client,
        },
      ],
    }),
    headers: {
      Authorization: `Bearer ${requireEnv("VERCEL_API_TOKEN")}`,
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AuthProviderError({
      code: readStringProperty(body, "error"),
      message:
        readStringProperty(body, "message") ??
        readStringProperty(body, "error_description") ??
        `Failed to update Edge Config: ${response.status}.`,
      status: response.status,
    });
  }
}

function readStringProperty(value: unknown, property: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const propertyValue = (value as Record<string, unknown>)[property];

  return typeof propertyValue === "string" && propertyValue.trim()
    ? propertyValue
    : undefined;
}

function requireSearchParam(
  searchParams: URLSearchParams,
  name: string,
): string {
  const value = searchParams.get(name);

  if (!value?.trim()) {
    throw new AuthProviderError({
      code: "invalid_request",
      message: `${name} is required.`,
      status: 400,
    });
  }

  return value;
}

function transientCookieOptions() {
  return authCookieOptions(OAUTH_COOKIE_MAX_AGE_SECONDS);
}
