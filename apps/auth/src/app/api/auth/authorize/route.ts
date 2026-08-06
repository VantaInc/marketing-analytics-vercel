import { type NextRequest } from "next/server";

import {
  buildVercelSignInResponse,
  createClientRedirectResponse,
  createErrorResponse,
  getCentralAuthService,
  getCentralAuthSession,
  readAuthorizeRequest,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const pendingRequest = readAuthorizeRequest(request.nextUrl.searchParams);
    const service = await getCentralAuthService();

    service.validateClientRedirectUri(pendingRequest);

    const session = await getCentralAuthSession();

    if (!session) {
      return buildVercelSignInResponse({
        pendingRequest,
        request,
      });
    }

    const code = await service.createAuthorizationCode({
      clientId: pendingRequest.clientId,
      expiresAtMs: new Date(session.expiresAt).getTime(),
      redirectUri: pendingRequest.redirectUri,
      user: session.user,
    });

    return createClientRedirectResponse({
      code,
      pendingRequest,
    });
  } catch (error) {
    console.error("Central auth authorize failed.", error);
    return createErrorResponse(error);
  }
}
