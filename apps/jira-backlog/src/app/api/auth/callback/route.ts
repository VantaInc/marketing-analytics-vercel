import { type NextRequest, NextResponse } from "next/server";
import {
  analyzeCentralAuthCallback,
  createCentralAuthErrorUrl,
  logCentralAuthFlowEvent,
  summarizeAuthFlowError,
} from "@vanta/auth";

import {
  AUTH_SESSION_COOKIE,
  AUTH_STATE_COOKIE,
  authCookieOptions,
  createAuthProvider,
  createSessionToken,
  getAuthDebugContext,
  getAuthCallbackUrl,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const providerError = request.nextUrl.searchParams.get("error");
    const providerErrorDescription =
      request.nextUrl.searchParams.get("error_description");
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const storedState = request.cookies.get(AUTH_STATE_COOKIE)?.value;
    const redirectUri = getAuthCallbackUrl(request);
    const callback = analyzeCentralAuthCallback({
      code,
      providerError,
      providerErrorDescription,
      state,
      storedState,
    });

    if (!callback.ok) {
      logCentralAuthFlowEvent({
        ...getAuthDebugContext(),
        code,
        event: callback.event,
        level: callback.level,
        providerError: callback.providerError,
        providerErrorDescription: callback.providerErrorDescription,
        redirectUri,
        requestUrl: request.url,
        state,
        storedState,
      });

      const response = createAuthErrorRedirectResponse({
        code: callback.code,
        request,
      });
      clearAuthStateCookie(response);

      return response;
    }

    logCentralAuthFlowEvent({
      ...getAuthDebugContext(),
      code: callback.code,
      event: "callback_exchange_start",
      level: "info",
      redirectUri,
      requestUrl: request.url,
      state: callback.state,
      storedState: callback.storedState,
    });

    const session = await createAuthProvider().exchangeAuthorizationCode({
      code: callback.code,
      redirectUri,
    });
    const now = Date.now();
    const expiresAtMs = new Date(session.expiresAt).getTime();
    const sessionToken = await createSessionToken(session.user, expiresAtMs);
    const maxAgeSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));

    const response = NextResponse.redirect(new URL("/", request.url));

    response.cookies.set(
      AUTH_SESSION_COOKIE,
      sessionToken,
      authCookieOptions(maxAgeSeconds),
    );
    clearAuthStateCookie(response);

    logCentralAuthFlowEvent({
      ...getAuthDebugContext(),
      event: "callback_success",
      level: "info",
      redirectUri,
      requestUrl: request.url,
      safeDetails: {
        hasEmail: Boolean(session.user.email),
        userId: session.user.id,
      },
    });

    return response;
  } catch (error) {
    const summary = summarizeAuthFlowError(error, {
      fallbackCode: "callback_failed",
      fallbackMessage: "The auth callback failed.",
    });

    logCentralAuthFlowEvent({
      ...getAuthDebugContext(),
      event: "callback_failed",
      level: "error",
      redirectUri: getAuthCallbackUrl(request),
      requestUrl: request.url,
      error,
      safeDetails: {
        code: summary.code,
        message: summary.message,
        status: summary.status,
      },
    });

    const response = createAuthErrorRedirectResponse({
      code: summary.code,
      request,
    });
    clearAuthStateCookie(response);

    return response;
  }
}

function createAuthErrorRedirectResponse({
  code,
  request,
}: {
  code: string;
  request: NextRequest;
}) {
  return NextResponse.redirect(
    createCentralAuthErrorUrl({
      code,
      requestUrl: request.url,
    }),
  );
}

function clearAuthStateCookie(response: NextResponse) {
  response.cookies.set(AUTH_STATE_COOKIE, "", {
    maxAge: 0,
    path: "/",
  });
}
