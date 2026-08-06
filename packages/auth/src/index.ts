import { SignJWT, createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export const DEFAULT_AUTH_CODE_TTL_SECONDS = 60;
export const DEFAULT_CENTRAL_AUTH_AUTHORIZE_PATH = "/api/auth/authorize";
export const DEFAULT_CENTRAL_AUTH_TOKEN_PATH = "/api/auth/token";
export const DEFAULT_CLIENT_SECRET_BYTES = 32;
export const DEFAULT_VERCEL_SCOPES = ["openid", "email", "profile"] as const;
export const EDGE_CONFIG_AUTH_CLIENT_KEY_PREFIX = "auth_client_";
export const VERCEL_PROTECTION_BYPASS_HEADER = "x-vercel-protection-bypass";
export const VERCEL_AUTHORIZE_URL = "https://vercel.com/oauth/authorize";
export const VERCEL_ID_TOKEN_ISSUER = "https://vercel.com";
export const VERCEL_JWKS_URL = "https://vercel.com/.well-known/jwks";
export const VERCEL_TOKEN_URL = "https://api.vercel.com/login/oauth/token";

let vercelJwks: ReturnType<typeof createRemoteJWKSet> | undefined;

export type AuthUser = {
  email?: string;
  id: string;
  name?: string;
  picture?: string;
  username?: string;
};

export type AuthSession = {
  expiresAt: string;
  user: AuthUser;
};

export type AuthProviderAuthorizationInput = {
  redirectUri: string;
  scope?: string;
  state: string;
};

export type AuthProviderCallbackInput = {
  code: string;
  redirectUri: string;
};

export type AuthProvider = {
  createAuthorizationUrl: (input: AuthProviderAuthorizationInput) => URL;
  exchangeAuthorizationCode: (
    input: AuthProviderCallbackInput,
  ) => Promise<AuthSession>;
};

export type VercelAppIdentityProviderOptions = {
  callbackUrl: string;
  clientId: string;
  clientSecret: string;
  scopes?: readonly string[];
};

export type VercelAuthorizationUrlInput = {
  codeChallenge: string;
  nonce: string;
  state: string;
};

export type VercelAuthorizationCodeInput = {
  code: string;
  codeVerifier: string;
  expectedNonce: string;
};

export type VercelIdentity = {
  expiresAtMs: number;
  user: AuthUser;
};

export type VercelAppIdentityProvider = {
  createAuthorizationUrl: (input: VercelAuthorizationUrlInput) => URL;
  exchangeAuthorizationCode: (
    input: VercelAuthorizationCodeInput,
  ) => Promise<VercelIdentity>;
};

export type CentralAuthClientConfig = {
  createdAt?: string;
  createdBy?: string;
  enabled?: boolean;
  id: string;
  name?: string;
  redirectUris: string[];
  secretHash: string;
  updatedAt?: string;
};

export type CentralAuthAuthorizeRequest = {
  clientId: string;
  redirectUri: string;
  state: string;
};

export type CentralAuthServiceOptions = {
  allowedEmailDomains?: string[];
  clients: CentralAuthClientConfig[];
  codeTtlSeconds?: number;
  issuer: string;
  signingSecret: string;
};

export type CentralAuthCodeInput = {
  clientId: string;
  expiresAtMs?: number;
  redirectUri: string;
  user: AuthUser;
};

export type CentralAuthExchangeInput = {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
};

export type CentralAuthClientSummary = {
  enabled: boolean;
  id: string;
  name?: string;
  redirectUriCount: number;
};

export type CentralAuthService = {
  assertUserAllowed: (user: AuthUser) => void;
  createAuthorizationCode: (input: CentralAuthCodeInput) => Promise<string>;
  exchangeAuthorizationCode: (
    input: CentralAuthExchangeInput,
  ) => Promise<AuthSession>;
  getClientSummaries: () => CentralAuthClientSummary[];
  validateClientRedirectUri: (
    input: Pick<CentralAuthCodeInput, "clientId" | "redirectUri">,
  ) => CentralAuthClientConfig;
};

export type CentralAuthClientProviderOptions = {
  authBaseUrl: string;
  authorizePath?: string;
  bypassSecret?: string;
  clientId: string;
  clientSecret: string;
  debugApp?: string;
  fetch?: typeof fetch;
  logTokenExchangeFailures?: boolean;
  tokenPath?: string;
};

export type SignedSessionTokenInput = {
  audience: string;
  expiresAtMs: number;
  issuer: string;
  signingSecret: string;
  user: AuthUser;
};

export type HashClientSecretInput = {
  clientSecret: string;
  signingSecret: string;
};

export type VerifySignedSessionTokenInput = {
  audience: string;
  issuer: string;
  signingSecret: string;
  token: string;
};

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConfigurationError";
  }
}

export class AuthProviderError extends Error {
  readonly code?: string;
  readonly status?: number;

  constructor({
    cause,
    code,
    message,
    status,
  }: {
    cause?: unknown;
    code?: string;
    message: string;
    status?: number;
  }) {
    super(message, { cause });
    this.name = "AuthProviderError";
    this.code = code;
    this.status = status;
  }
}

export type AuthFlowErrorSummary = {
  code: string;
  message: string;
  name?: string;
  status?: number;
};

export type AuthFlowLogLevel = "error" | "info" | "warn";

export type CentralAuthFlowLogInput = {
  app: string;
  authBaseUrl?: string;
  clientId?: string;
  code?: string | null;
  error?: unknown;
  event: string;
  level?: AuthFlowLogLevel;
  providerError?: string | null;
  providerErrorDescription?: string | null;
  redirectUri?: string;
  requestUrl?: string | URL;
  safeDetails?: Record<string, unknown>;
  state?: string | null;
  storedState?: string | null;
};

export type SummarizeAuthFlowErrorOptions = {
  fallbackCode?: string;
  fallbackMessage?: string;
};

type AuthFlowUrlLogSummary = {
  origin: string;
  path: string;
  queryKeys: string[];
};

export type CentralAuthCallbackAnalysisInput = {
  code?: string | null;
  providerError?: string | null;
  providerErrorDescription?: string | null;
  state?: string | null;
  storedState?: string | null;
};

export type CentralAuthErrorUrlInput = {
  code: string;
  errorPath?: string;
  requestUrl: string | URL;
};

export type CentralAuthCallbackFailure = {
  code: string;
  event:
    | "callback_missing_code"
    | "callback_provider_error"
    | "callback_state_mismatch";
  level: Extract<AuthFlowLogLevel, "warn">;
  ok: false;
  providerError?: string | null;
  providerErrorDescription?: string | null;
};

export type CentralAuthCallbackSuccess = {
  code: string;
  ok: true;
  state: string;
  storedState: string;
};

export type CentralAuthCallbackAnalysis =
  | CentralAuthCallbackFailure
  | CentralAuthCallbackSuccess;

export function analyzeCentralAuthCallback({
  code,
  providerError,
  providerErrorDescription,
  state,
  storedState,
}: CentralAuthCallbackAnalysisInput): CentralAuthCallbackAnalysis {
  if (providerError) {
    return {
      code: providerError,
      event: "callback_provider_error",
      level: "warn",
      ok: false,
      providerError,
      providerErrorDescription,
    };
  }

  if (!code) {
    return {
      code: "missing_code",
      event: "callback_missing_code",
      level: "warn",
      ok: false,
    };
  }

  if (!state || !storedState || state !== storedState) {
    return {
      code: "state_mismatch",
      event: "callback_state_mismatch",
      level: "warn",
      ok: false,
    };
  }

  return {
    code,
    ok: true,
    state,
    storedState,
  };
}

export function createCentralAuthErrorUrl({
  code,
  errorPath = "/auth/error",
  requestUrl,
}: CentralAuthErrorUrlInput): URL {
  const url = new URL(errorPath, requestUrl);

  url.searchParams.set("code", code);

  return url;
}

export function logCentralAuthFlowEvent({
  app,
  authBaseUrl,
  clientId,
  code,
  error,
  event,
  level = error ? "error" : "info",
  providerError,
  providerErrorDescription,
  redirectUri,
  requestUrl,
  safeDetails,
  state,
  storedState,
}: CentralAuthFlowLogInput): void {
  const payload: Record<string, unknown> = {
    app,
    event,
  };

  addUrlSummary(payload, "request", requestUrl);
  addUrlSummary(payload, "redirectUri", redirectUri);
  addUrlSummary(payload, "authBaseUrl", authBaseUrl);
  addOptionalString(payload, "clientId", clientId);
  addOptionalBoolean(payload, "codePresent", code !== undefined, Boolean(code));
  addOptionalBoolean(
    payload,
    "stateParamPresent",
    state !== undefined,
    Boolean(state),
  );
  addOptionalBoolean(
    payload,
    "storedStatePresent",
    storedState !== undefined,
    Boolean(storedState),
  );

  if (state !== undefined && storedState !== undefined) {
    payload.stateMatches = Boolean(
      state && storedState && state === storedState,
    );
  }

  addOptionalString(payload, "providerError", providerError);

  addOptionalString(
    payload,
    "providerErrorDescription",
    truncateForLog(providerErrorDescription ?? undefined),
  );

  if (safeDetails) {
    payload.details = safeDetails;
  }

  if (error) {
    payload.error = summarizeAuthFlowError(error);
  }

  const message = "Central auth flow event.";

  if (level === "error") {
    console.error(message, payload);
    return;
  }

  if (level === "warn") {
    console.warn(message, payload);
    return;
  }

  console.info(message, payload);
}

export function summarizeAuthFlowError(
  error: unknown,
  {
    fallbackCode = "auth_flow_failed",
    fallbackMessage = "The auth flow failed.",
  }: SummarizeAuthFlowErrorOptions = {},
): AuthFlowErrorSummary {
  if (error instanceof AuthProviderError) {
    return {
      code: error.code ?? fallbackCode,
      message: error.message,
      name: error.name,
      status: error.status,
    };
  }

  if (error instanceof Error) {
    return {
      code: fallbackCode,
      message: error.message,
      name: error.name,
    };
  }

  return {
    code: fallbackCode,
    message: fallbackMessage,
  };
}

export function createClientSecret(
  byteLength = DEFAULT_CLIENT_SECRET_BYTES,
): string {
  const bytes = new Uint8Array(byteLength);

  globalThis.crypto.getRandomValues(bytes);

  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createCentralAuthClientProvider({
  authBaseUrl,
  authorizePath = DEFAULT_CENTRAL_AUTH_AUTHORIZE_PATH,
  bypassSecret,
  clientId,
  clientSecret,
  debugApp,
  fetch: fetchImpl = fetch,
  logTokenExchangeFailures = true,
  tokenPath = DEFAULT_CENTRAL_AUTH_TOKEN_PATH,
}: CentralAuthClientProviderOptions): AuthProvider {
  const normalizedBaseUrl = normalizeBaseUrl(authBaseUrl, "authBaseUrl");
  const normalizedClientId = requireNonEmpty(clientId, "clientId");
  const normalizedClientSecret = requireNonEmpty(clientSecret, "clientSecret");
  const tokenFetch = createCentralAuthTokenFetch({
    app: debugApp ?? normalizedClientId,
    bypassSecret,
    fetch: fetchImpl,
    logFailures: logTokenExchangeFailures,
  });

  return {
    createAuthorizationUrl({ redirectUri, scope, state }) {
      const url = new URL(authorizePath, normalizedBaseUrl);

      url.searchParams.set("client_id", normalizedClientId);
      url.searchParams.set("redirect_uri", normalizeUrl(redirectUri));
      url.searchParams.set("response_type", "code");
      url.searchParams.set("state", requireNonEmpty(state, "state"));

      if (scope?.trim()) {
        url.searchParams.set("scope", scope.trim());
      }

      return url;
    },
    async exchangeAuthorizationCode({ code, redirectUri }) {
      const response = await tokenFetch(new URL(tokenPath, normalizedBaseUrl), {
        body: new URLSearchParams({
          client_id: normalizedClientId,
          client_secret: normalizedClientSecret,
          code: requireNonEmpty(code, "code"),
          grant_type: "authorization_code",
          redirect_uri: normalizeUrl(redirectUri),
        }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new AuthProviderError({
          code:
            readStringProperty(body, "error") ??
            getCentralAuthTokenEndpointErrorCode(response, body),
          message:
            readStringProperty(body, "error_description") ??
            getCentralAuthTokenEndpointErrorMessage(response, body),
          status: response.status,
        });
      }

      if (!isCentralAuthTokenResponse(body)) {
        throw new AuthProviderError({
          code: "invalid_response",
          message: "Central auth token response was invalid.",
          status: response.status,
        });
      }

      return {
        expiresAt: body.expires_at,
        user: body.user,
      };
    },
  };
}

export function createCentralAuthService({
  allowedEmailDomains = [],
  clients,
  codeTtlSeconds = DEFAULT_AUTH_CODE_TTL_SECONDS,
  issuer,
  signingSecret,
}: CentralAuthServiceOptions): CentralAuthService {
  const normalizedIssuer = requireNonEmpty(issuer, "issuer");
  const secret = getSigningSecret(signingSecret);
  const normalizedSigningSecret = requireNonEmpty(
    signingSecret,
    "signingSecret",
  );
  const normalizedAllowedDomains = allowedEmailDomains
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  const clientMap = new Map(
    clients.map((client) => {
      const normalizedClient = normalizeClientConfig(client);
      return [normalizedClient.id, normalizedClient] as const;
    }),
  );

  function validateClientRedirectUri({
    clientId,
    redirectUri,
  }: Pick<CentralAuthCodeInput, "clientId" | "redirectUri">) {
    const client = clientMap.get(normalizeAuthClientId(clientId));
    const normalizedRedirectUri = normalizeUrl(redirectUri);

    if (!client) {
      throw new AuthProviderError({
        code: "invalid_client",
        message: "Central auth client is not configured.",
        status: 400,
      });
    }

    if (client.enabled === false) {
      throw new AuthProviderError({
        code: "invalid_client",
        message: "Central auth client is disabled.",
        status: 400,
      });
    }

    if (!client.redirectUris.includes(normalizedRedirectUri)) {
      throw new AuthProviderError({
        code: "invalid_redirect_uri",
        message: "Redirect URI is not allowed for this auth client.",
        status: 400,
      });
    }

    return client;
  }

  function assertUserAllowed(user: AuthUser) {
    if (normalizedAllowedDomains.length === 0) {
      return;
    }

    const emailDomain = user.email?.split("@").at(-1)?.toLowerCase();

    if (!emailDomain || !normalizedAllowedDomains.includes(emailDomain)) {
      throw new AuthProviderError({
        code: "access_denied",
        message: "User email domain is not allowed.",
        status: 403,
      });
    }
  }

  return {
    assertUserAllowed,
    async createAuthorizationCode({
      clientId,
      expiresAtMs,
      redirectUri,
      user,
    }) {
      const client = validateClientRedirectUri({ clientId, redirectUri });
      const normalizedUser = normalizeUser(user);

      assertUserAllowed(normalizedUser);

      const codeExpiresAtMs = Math.min(
        expiresAtMs ?? Number.POSITIVE_INFINITY,
        Date.now() + codeTtlSeconds * 1000,
      );
      const claims = {
        ...buildUserClaims(normalizedUser),
        client_id: client.id,
        redirect_uri: normalizeUrl(redirectUri),
      };

      return new SignJWT(claims)
        .setProtectedHeader({ alg: "HS256" })
        .setAudience(client.id)
        .setExpirationTime(Math.floor(codeExpiresAtMs / 1000))
        .setIssuedAt()
        .setIssuer(normalizedIssuer)
        .setJti(createJwtId())
        .sign(secret);
    },
    async exchangeAuthorizationCode({
      clientId,
      clientSecret,
      code,
      redirectUri,
    }) {
      const client = validateClientRedirectUri({ clientId, redirectUri });
      const clientSecretHash = await hashClientSecret({
        clientSecret,
        signingSecret: normalizedSigningSecret,
      });

      if (!constantTimeEqual(client.secretHash, clientSecretHash)) {
        throw new AuthProviderError({
          code: "invalid_client",
          message: "Central auth client credentials are invalid.",
          status: 401,
        });
      }

      const { payload } = await jwtVerify(
        requireNonEmpty(code, "code"),
        secret,
        {
          audience: client.id,
          issuer: normalizedIssuer,
        },
      );

      if (payload.client_id !== client.id) {
        throw new AuthProviderError({
          code: "invalid_grant",
          message: "Authorization code client does not match.",
          status: 400,
        });
      }

      if (payload.redirect_uri !== normalizeUrl(redirectUri)) {
        throw new AuthProviderError({
          code: "invalid_grant",
          message: "Authorization code redirect URI does not match.",
          status: 400,
        });
      }

      const user = parseUserClaims(payload);
      assertUserAllowed(user);

      return {
        expiresAt: new Date((payload.exp ?? 0) * 1000).toISOString(),
        user,
      };
    },
    getClientSummaries() {
      return [...clientMap.values()].map((client) => ({
        enabled: client.enabled !== false,
        id: client.id,
        name: client.name,
        redirectUriCount: client.redirectUris.length,
      }));
    },
    validateClientRedirectUri,
  };
}

export function getAuthClientConfigKey(clientId: string): string {
  return `${EDGE_CONFIG_AUTH_CLIENT_KEY_PREFIX}${normalizeAuthClientId(
    clientId,
  )}`;
}

export async function hashClientSecret({
  clientSecret,
  signingSecret,
}: HashClientSecretInput): Promise<string> {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(requireNonEmpty(signingSecret, "signingSecret")),
    {
      hash: "SHA-256",
      name: "HMAC",
    },
    false,
    ["sign"],
  );
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(requireNonEmpty(clientSecret, "clientSecret")),
  );

  return `hmac-sha256:${base64UrlEncode(new Uint8Array(signature))}`;
}

export function normalizeAuthClientId(value: string): string {
  const normalized = value.trim().toLowerCase();

  if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(normalized)) {
    throw new AuthConfigurationError(
      "Client id must use 3-64 lowercase letters, numbers, or hyphens, and must start and end with a letter or number.",
    );
  }

  return normalized;
}

export function parseAuthClientConfig(
  value: unknown,
  name = "auth client",
): CentralAuthClientConfig {
  if (!isRecord(value)) {
    throw new AuthConfigurationError(`${name} must be an object.`);
  }

  const redirectUris = value.redirectUris ?? value.redirect_uris;

  if (!Array.isArray(redirectUris)) {
    throw new AuthConfigurationError(`${name}.redirectUris must be an array.`);
  }

  return normalizeClientConfig({
    createdAt: readStringClaim(value.createdAt ?? value.created_at),
    createdBy: readStringClaim(value.createdBy ?? value.created_by),
    enabled: typeof value.enabled === "boolean" ? value.enabled : undefined,
    id: readRequiredString(value.id, `${name}.id`),
    name: readStringClaim(value.name),
    redirectUris: redirectUris.map((redirectUri, redirectIndex) =>
      readRequiredString(redirectUri, `${name}.redirectUris[${redirectIndex}]`),
    ),
    secretHash: readRequiredString(
      value.secretHash ?? value.secret_hash,
      `${name}.secretHash`,
    ),
    updatedAt: readStringClaim(value.updatedAt ?? value.updated_at),
  });
}

export function createVercelAppIdentityProvider({
  callbackUrl,
  clientId,
  clientSecret,
  scopes = DEFAULT_VERCEL_SCOPES,
}: VercelAppIdentityProviderOptions): VercelAppIdentityProvider {
  const normalizedCallbackUrl = normalizeUrl(callbackUrl);
  const normalizedClientId = requireNonEmpty(clientId, "clientId");
  const normalizedClientSecret = requireNonEmpty(clientSecret, "clientSecret");
  const scope = scopes
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ");

  return {
    createAuthorizationUrl({ codeChallenge, nonce, state }) {
      const url = new URL(VERCEL_AUTHORIZE_URL);

      url.searchParams.set("client_id", normalizedClientId);
      url.searchParams.set(
        "code_challenge",
        requireNonEmpty(codeChallenge, "codeChallenge"),
      );
      url.searchParams.set("code_challenge_method", "S256");
      url.searchParams.set("nonce", requireNonEmpty(nonce, "nonce"));
      url.searchParams.set("redirect_uri", normalizedCallbackUrl);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", scope);
      url.searchParams.set("state", requireNonEmpty(state, "state"));

      return url;
    },
    async exchangeAuthorizationCode({ code, codeVerifier, expectedNonce }) {
      const tokenData = await exchangeVercelCodeForToken({
        callbackUrl: normalizedCallbackUrl,
        clientId: normalizedClientId,
        clientSecret: normalizedClientSecret,
        code,
        codeVerifier,
      });
      const { payload } = await jwtVerify(tokenData.id_token, getVercelJwks(), {
        audience: normalizedClientId,
        issuer: VERCEL_ID_TOKEN_ISSUER,
      });

      if (payload.nonce !== expectedNonce) {
        throw new AuthProviderError({
          code: "invalid_nonce",
          message: "Vercel ID token nonce did not match.",
          status: 400,
        });
      }

      const expiresAtMs = Math.min(
        typeof payload.exp === "number"
          ? payload.exp * 1000
          : Number.POSITIVE_INFINITY,
        Date.now() + tokenData.expires_in * 1000,
      );

      return {
        expiresAtMs:
          Number.isFinite(expiresAtMs) && expiresAtMs > Date.now()
            ? expiresAtMs
            : Date.now() + 60 * 60 * 1000,
        user: parseUserClaims(payload),
      };
    },
  };
}

export async function createSignedSessionToken({
  audience,
  expiresAtMs,
  issuer,
  signingSecret,
  user,
}: SignedSessionTokenInput): Promise<string> {
  return new SignJWT(buildUserClaims(normalizeUser(user)))
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(requireNonEmpty(audience, "audience"))
    .setExpirationTime(Math.floor(expiresAtMs / 1000))
    .setIssuedAt()
    .setIssuer(requireNonEmpty(issuer, "issuer"))
    .sign(getSigningSecret(signingSecret));
}

export async function verifySignedSessionToken({
  audience,
  issuer,
  signingSecret,
  token,
}: VerifySignedSessionTokenInput): Promise<AuthSession> {
  const { payload } = await jwtVerify(
    requireNonEmpty(token, "token"),
    getSigningSecret(signingSecret),
    {
      audience: requireNonEmpty(audience, "audience"),
      issuer: requireNonEmpty(issuer, "issuer"),
    },
  );

  return {
    expiresAt: new Date((payload.exp ?? 0) * 1000).toISOString(),
    user: parseUserClaims(payload),
  };
}

export function parseCentralAuthClients(
  value: string | undefined,
): CentralAuthClientConfig[] {
  if (!value?.trim()) {
    throw new AuthConfigurationError("VANTA_AUTH_CLIENTS is required.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throw new AuthConfigurationError(
      `VANTA_AUTH_CLIENTS must be valid JSON: ${String(error)}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new AuthConfigurationError("VANTA_AUTH_CLIENTS must be an array.");
  }

  return parsed.map((client, index) =>
    normalizeClientConfig(readRawClientConfig(client, index)),
  );
}

async function exchangeVercelCodeForToken({
  callbackUrl,
  clientId,
  clientSecret,
  code,
  codeVerifier,
}: {
  callbackUrl: string;
  clientId: string;
  clientSecret: string;
  code: string;
  codeVerifier: string;
}): Promise<VercelTokenResponse> {
  const response = await fetch(VERCEL_TOKEN_URL, {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: requireNonEmpty(code, "code"),
      code_verifier: requireNonEmpty(codeVerifier, "codeVerifier"),
      grant_type: "authorization_code",
      redirect_uri: callbackUrl,
    }),
    method: "POST",
  });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AuthProviderError({
      code: readStringProperty(body, "error"),
      message:
        readStringProperty(body, "error_description") ??
        `Vercel token exchange failed with ${response.status}.`,
      status: response.status,
    });
  }

  if (!isVercelTokenResponse(body)) {
    throw new AuthProviderError({
      code: "invalid_response",
      message: "Vercel token response was invalid.",
      status: response.status,
    });
  }

  return body;
}

function buildUserClaims(user: AuthUser): JWTPayload {
  return withOptionalClaims(
    {
      sub: user.id,
    },
    {
      email: user.email,
      name: user.name,
      picture: user.picture,
      preferred_username: user.username,
      username: user.username,
    },
  );
}

function base64UrlEncode(bytes: Uint8Array): string {
  const binary = [...bytes].map((byte) => String.fromCharCode(byte)).join("");

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function constantTimeEqual(first: string, second: string): boolean {
  const firstBytes = new TextEncoder().encode(first);
  const secondBytes = new TextEncoder().encode(second);
  const length = Math.max(firstBytes.length, secondBytes.length);
  let result = firstBytes.length ^ secondBytes.length;

  for (let index = 0; index < length; index += 1) {
    result |= (firstBytes[index] ?? 0) ^ (secondBytes[index] ?? 0);
  }

  return result === 0;
}

function createJwtId(): string {
  return globalThis.crypto.randomUUID();
}

function getSigningSecret(value: string): Uint8Array {
  return new TextEncoder().encode(requireNonEmpty(value, "signingSecret"));
}

function getVercelJwks(): ReturnType<typeof createRemoteJWKSet> {
  vercelJwks ??= createRemoteJWKSet(new URL(VERCEL_JWKS_URL));
  return vercelJwks;
}

function isCentralAuthTokenResponse(
  value: unknown,
): value is { expires_at: string; user: AuthUser } {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.expires_at === "string" && isAuthUser(value.user);
}

function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.trim().length > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isVercelTokenResponse(value: unknown): value is VercelTokenResponse {
  return (
    isRecord(value) &&
    typeof value.access_token === "string" &&
    typeof value.expires_in === "number" &&
    typeof value.id_token === "string" &&
    typeof value.token_type === "string"
  );
}

function normalizeBaseUrl(value: string, name: string): URL {
  return new URL(requireNonEmpty(value, name));
}

function addOptionalBoolean(
  payload: Record<string, unknown>,
  key: string,
  shouldAdd: boolean,
  value: boolean,
) {
  if (shouldAdd) {
    payload[key] = value;
  }
}

function addOptionalString(
  payload: Record<string, unknown>,
  key: string,
  value: string | null | undefined,
) {
  const normalized = value?.trim();

  if (normalized) {
    payload[key] = normalized;
  }
}

function addUrlSummary(
  payload: Record<string, unknown>,
  prefix: string,
  value: string | URL | undefined,
) {
  const summary = summarizeUrlForLog(value);

  if (!summary) {
    return;
  }

  payload[`${prefix}Origin`] = summary.origin;
  payload[`${prefix}Path`] = summary.path;

  if (summary.queryKeys.length > 0) {
    payload[`${prefix}QueryKeys`] = summary.queryKeys;
  }
}

function normalizeClientConfig(
  client: CentralAuthClientConfig,
): CentralAuthClientConfig {
  const id = normalizeAuthClientId(client.id);
  const secretHash = requireNonEmpty(
    client.secretHash,
    `client ${id} secretHash`,
  );
  const redirectUris = client.redirectUris.map((redirectUri) =>
    normalizeUrl(redirectUri),
  );

  if (redirectUris.length === 0) {
    throw new AuthConfigurationError(
      `Central auth client ${id} needs at least one redirect URI.`,
    );
  }

  return {
    createdAt: normalizeOptionalString(client.createdAt),
    createdBy: normalizeOptionalString(client.createdBy),
    enabled: client.enabled,
    id,
    name: normalizeOptionalString(client.name),
    redirectUris,
    secretHash,
    updatedAt: normalizeOptionalString(client.updatedAt),
  };
}

function normalizeUrl(value: string): string {
  const url = new URL(requireNonEmpty(value, "url"));

  if (url.hash) {
    url.hash = "";
  }

  return url.toString();
}

function normalizeUser(user: AuthUser): AuthUser {
  const id = requireNonEmpty(user.id, "user.id");

  return {
    email: normalizeOptionalString(user.email),
    id,
    name: normalizeOptionalString(user.name),
    picture: normalizeOptionalString(user.picture),
    username: normalizeOptionalString(user.username),
  };
}

function normalizeOptionalString(value: string | undefined) {
  return value?.trim() || undefined;
}

function parseUserClaims(payload: JWTPayload): AuthUser {
  if (typeof payload.sub !== "string" || !payload.sub.trim()) {
    throw new AuthProviderError({
      code: "invalid_subject",
      message: "Auth token is missing a subject.",
      status: 400,
    });
  }

  return {
    email: readStringClaim(payload.email),
    id: payload.sub,
    name: readStringClaim(payload.name),
    picture: readStringClaim(payload.picture),
    username:
      readStringClaim(payload.username) ??
      readStringClaim(payload.preferred_username),
  };
}

function readRawClientConfig(
  value: unknown,
  index: number,
): CentralAuthClientConfig {
  return parseAuthClientConfig(value, `VANTA_AUTH_CLIENTS[${index}]`);
}

function readRequiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AuthConfigurationError(`${name} must be a non-empty string.`);
  }

  return value;
}

function readStringClaim(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readStringProperty(value: unknown, property: string) {
  if (!isRecord(value)) {
    return undefined;
  }

  return readStringClaim(value[property]);
}

function createCentralAuthTokenFetch({
  app,
  bypassSecret,
  fetch: fetchImpl,
  logFailures,
}: {
  app: string;
  bypassSecret?: string;
  fetch: typeof fetch;
  logFailures: boolean;
}): typeof fetch {
  const normalizedBypassSecret = bypassSecret?.trim();

  return async (input, init) => {
    const headers = new Headers(init?.headers);

    if (normalizedBypassSecret) {
      headers.set(VERCEL_PROTECTION_BYPASS_HEADER, normalizedBypassSecret);
    }

    const response = await fetchImpl(input, {
      ...init,
      headers,
    });

    if (logFailures && !response.ok) {
      logCentralAuthTokenRequestFailure({
        app,
        bypassConfigured: Boolean(normalizedBypassSecret),
        input,
        response,
      });
    }

    return response;
  };
}

function logCentralAuthTokenRequestFailure({
  app,
  bypassConfigured,
  input,
  response,
}: {
  app: string;
  bypassConfigured: boolean;
  input: RequestInfo | URL;
  response: Response;
}) {
  console.error("Central auth token request failed.", {
    app,
    bypassConfigured,
    contentType: response.headers.get("content-type"),
    status: response.status,
    statusText: response.statusText,
    target: summarizeFetchTarget(input),
    vercelId: response.headers.get("x-vercel-id"),
  });
}

function summarizeFetchTarget(input: RequestInfo | URL) {
  const url =
    input instanceof Request
      ? input.url
      : input instanceof URL
        ? input.toString()
        : String(input);

  try {
    const parsed = new URL(url);

    return {
      origin: parsed.origin,
      path: parsed.pathname,
    };
  } catch {
    return {
      origin: "unknown",
      path: "unknown",
    };
  }
}

function getCentralAuthTokenEndpointErrorCode(
  response: Response,
  body: unknown,
): string | undefined {
  if (response.status === 401 && !isRecord(body)) {
    return "token_endpoint_unauthorized";
  }

  return undefined;
}

function getCentralAuthTokenEndpointErrorMessage(
  response: Response,
  body: unknown,
): string {
  if (response.status === 401 && !isRecord(body)) {
    return "Central auth token endpoint returned 401 before sending an OAuth JSON error. Check VANTA_AUTH_URL and any deployment-protection bypass secret on the client app.";
  }

  return `Central auth token exchange failed with ${response.status}.`;
}

function requireNonEmpty(value: string, name: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new AuthConfigurationError(`${name} is required.`);
  }

  return trimmed;
}

function summarizeUrlForLog(
  value: string | URL | undefined,
): AuthFlowUrlLogSummary | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const url = value instanceof URL ? value : new URL(value);

    return {
      origin: url.origin,
      path: url.pathname,
      queryKeys: [...new Set(url.searchParams.keys())].sort(),
    };
  } catch {
    return undefined;
  }
}

function truncateForLog(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  return normalized.length > 300
    ? `${normalized.slice(0, 297)}...`
    : normalized;
}

function withOptionalClaims(
  base: JWTPayload,
  optionalClaims: Record<string, string | undefined>,
): JWTPayload {
  const claims = { ...base };

  for (const [key, value] of Object.entries(optionalClaims)) {
    if (value?.trim()) {
      claims[key] = value.trim();
    }
  }

  return claims;
}

type VercelTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token: string;
  scope?: string;
  token_type: string;
};
