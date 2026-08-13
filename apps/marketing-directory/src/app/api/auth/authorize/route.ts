import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import {
  createCentralAuthErrorUrl,
  logCentralAuthFlowEvent,
  summarizeAuthFlowError,
} from "@vanta/auth";

import {
  AUTH_STATE_COOKIE,
  authStateCookieOptions,
  createAuthProvider,
  getAuthDebugContext,
  getAuthCallbackUrl,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  try {
    const callbackUrl = getAuthCallbackUrl(request);
    const state = crypto.randomBytes(32).toString("base64url");
    const authorizationUrl = createAuthProvider().createAuthorizationUrl({
      redirectUri: callbackUrl,
      state,
    });

    logCentralAuthFlowEvent({
      ...getAuthDebugContext(),
      event: "authorize_redirect",
      level: "info",
      redirectUri: callbackUrl,
      requestUrl: request.url,
      state,
      safeDetails: {
        authorizationOrigin: authorizationUrl.origin,
      },
    });

    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set(AUTH_STATE_COOKIE, state, authStateCookieOptions());

    return response;
  } catch (error) {
    const summary = summarizeAuthFlowError(error, {
      fallbackCode: "authorize_failed",
      fallbackMessage: "Central auth authorize failed.",
    });

    logCentralAuthFlowEvent({
      ...getAuthDebugContext(),
      event: "authorize_failed",
      level: "error",
      requestUrl: request.url,
      error,
      safeDetails: {
        code: summary.code,
        message: summary.message,
        status: summary.status,
      },
    });

    return createAuthErrorRedirectResponse({
      code: summary.code,
      request,
    });
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
