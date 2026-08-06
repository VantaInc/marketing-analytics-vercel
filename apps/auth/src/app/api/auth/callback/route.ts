import { type NextRequest, NextResponse } from "next/server";

import {
  OAUTH_CODE_VERIFIER_COOKIE,
  OAUTH_NONCE_COOKIE,
  OAUTH_STATE_COOKIE,
  applySessionCookie,
  clearOauthCookies,
  createClientRedirectResponse,
  createVercelProvider,
  getCentralAuthService,
  readPendingAuthorizationRequest,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
    const storedNonce = request.cookies.get(OAUTH_NONCE_COOKIE)?.value;
    const codeVerifier = request.cookies.get(OAUTH_CODE_VERIFIER_COOKIE)?.value;

    if (!code) {
      throw new Error("Authorization code is required.");
    }

    if (!state || !storedState || state !== storedState) {
      throw new Error("OAuth state did not match.");
    }

    if (!storedNonce) {
      throw new Error("OAuth nonce is missing.");
    }

    if (!codeVerifier) {
      throw new Error("OAuth code verifier is missing.");
    }

    const provider = createVercelProvider(request);
    const identity = await provider.exchangeAuthorizationCode({
      code,
      codeVerifier,
      expectedNonce: storedNonce,
    });
    const pendingRequest = readPendingAuthorizationRequest(request);
    const service = await getCentralAuthService();

    service.assertUserAllowed(identity.user);

    const response = pendingRequest
      ? createClientRedirectResponse({
          code: await service.createAuthorizationCode({
            clientId: pendingRequest.clientId,
            expiresAtMs: identity.expiresAtMs,
            redirectUri: pendingRequest.redirectUri,
            user: identity.user,
          }),
          pendingRequest,
        })
      : NextResponse.redirect(new URL("/", request.url));

    await applySessionCookie({
      expiresAtMs: identity.expiresAtMs,
      response,
      user: identity.user,
    });
    clearOauthCookies(response);

    return response;
  } catch (error) {
    console.error("Vercel sign-in callback failed.", error);

    const response = NextResponse.redirect(new URL("/auth/error", request.url));
    clearOauthCookies(response);

    return response;
  }
}
