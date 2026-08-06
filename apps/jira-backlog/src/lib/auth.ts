import "server-only";

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { type NextRequest } from "next/server";
import {
  createCentralAuthClientProvider,
  createSignedSessionToken,
  verifySignedSessionToken,
  type AuthSession,
  type AuthUser,
} from "@vanta/auth";

export const AUTH_SESSION_COOKIE = "jira_backlog_auth_session";
export const AUTH_STATE_COOKIE = "jira_backlog_auth_state";

const AUTH_DEBUG_APP = "jira-backlog";
const SESSION_AUDIENCE = "@vanta/jira-backlog";
const SESSION_ISSUER = "@vanta/jira-backlog/auth";
const AUTH_CALLBACK_PATH = "/api/auth/callback";

export type { AuthSession, AuthUser };

export async function getAuthSession(): Promise<AuthSession | null> {
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

export async function createSessionToken(
  user: AuthUser,
  expiresAtMs: number,
): Promise<string> {
  return createSignedSessionToken({
    audience: SESSION_AUDIENCE,
    expiresAtMs,
    issuer: SESSION_ISSUER,
    signingSecret: requireEnv("AUTH_SECRET"),
    user,
  });
}

export function authCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    maxAge: maxAgeSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function authStateCookieOptions() {
  return authCookieOptions(10 * 60);
}

export function createAuthProvider() {
  return createCentralAuthClientProvider({
    authBaseUrl: requireEnv("VANTA_AUTH_URL"),
    bypassSecret: process.env.VANTA_AUTH_BYPASS_SECRET,
    clientId: requireEnv("VANTA_AUTH_CLIENT_ID"),
    clientSecret: requireEnv("VANTA_AUTH_CLIENT_SECRET"),
  });
}

export function getAuthDebugContext() {
  return {
    app: process.env.VANTA_AUTH_CLIENT_ID?.trim() || AUTH_DEBUG_APP,
    authBaseUrl: process.env.VANTA_AUTH_URL,
    clientId: process.env.VANTA_AUTH_CLIENT_ID,
  };
}

export function getAuthCallbackUrl(request: NextRequest): string {
  return buildAuthCallbackUrl(request.nextUrl.origin);
}

export async function getAuthCallbackUrlForCurrentRequest(): Promise<string> {
  const headerStore = await headers();
  const host =
    readFirstHeaderValue(headerStore.get("x-forwarded-host")) ??
    readFirstHeaderValue(headerStore.get("host"));
  const protocol =
    readFirstHeaderValue(headerStore.get("x-forwarded-proto")) ??
    inferProtocol(host);

  return buildAuthCallbackUrl(host ? `${protocol}://${host}` : undefined);
}

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value?.trim()) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function buildAuthCallbackUrl(requestOrigin?: string): string {
  const origin =
    process.env.VANTA_AUTH_CALLBACK_ORIGIN?.trim() ??
    requestOrigin ??
    "http://localhost:3002";

  return new URL(AUTH_CALLBACK_PATH, normalizeOrigin(origin)).toString();
}

function normalizeOrigin(value: string): string {
  return new URL(value).origin;
}

function readFirstHeaderValue(value: string | null): string | undefined {
  return value?.split(",").at(0)?.trim() || undefined;
}

function inferProtocol(host?: string): "http" | "https" {
  return host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
    ? "http"
    : "https";
}
