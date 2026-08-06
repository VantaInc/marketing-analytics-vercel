import "server-only";

import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import {
  createCentralAuthClientProvider,
  createSignedSessionToken,
  verifySignedSessionToken,
  type AuthSession,
  type AuthUser,
} from "@vanta/auth";

export const AUTH_SESSION_COOKIE = "starter_auth_session";
export const AUTH_STATE_COOKIE = "starter_auth_state";

const AUTH_DEBUG_APP = "starter";
const SESSION_AUDIENCE = "@vanta/starter";
const SESSION_ISSUER = "@vanta/starter/auth";
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
  return new URL(AUTH_CALLBACK_PATH, request.nextUrl.origin).toString();
}

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value?.trim()) {
    throw new Error(`${name} is required.`);
  }

  return value;
}
