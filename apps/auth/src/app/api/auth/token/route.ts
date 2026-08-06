import { Buffer } from "node:buffer";
import { type NextRequest, NextResponse } from "next/server";

import { createErrorResponse, getCentralAuthService } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await readRequestBody(request);
    const credentials = readClientCredentials(request, body);

    if (body.grant_type !== "authorization_code") {
      return NextResponse.json(
        {
          error: "unsupported_grant_type",
          error_description: "Only grant_type=authorization_code is supported.",
        },
        { status: 400 },
      );
    }

    const service = await getCentralAuthService();
    const session = await service.exchangeAuthorizationCode({
      clientId: requireBodyValue(credentials.clientId, "client_id"),
      clientSecret: requireBodyValue(credentials.clientSecret, "client_secret"),
      code: requireBodyValue(body.code, "code"),
      redirectUri: requireBodyValue(body.redirect_uri, "redirect_uri"),
    });

    return NextResponse.json({
      expires_at: session.expiresAt,
      token_type: "vanta_user_session",
      user: session.user,
    });
  } catch (error) {
    console.error("Central auth token exchange failed.", error);
    return createErrorResponse(error);
  }
}

async function readRequestBody(
  request: NextRequest,
): Promise<Record<string, string | undefined>> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body: unknown = await request.json().catch(() => ({}));

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(body).map(([key, value]) => [
        key,
        typeof value === "string" ? value : undefined,
      ]),
    );
  }

  const params = new URLSearchParams(await request.text());

  return Object.fromEntries(params.entries());
}

function readClientCredentials(
  request: NextRequest,
  body: Record<string, string | undefined>,
) {
  const basicAuth = readBasicAuth(request.headers.get("authorization"));

  return {
    clientId: basicAuth?.clientId ?? body.client_id,
    clientSecret: basicAuth?.clientSecret ?? body.client_secret,
  };
}

function readBasicAuth(value: string | null) {
  if (!value?.startsWith("Basic ")) {
    return null;
  }

  const decoded = Buffer.from(value.slice("Basic ".length), "base64").toString(
    "utf8",
  );
  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex < 0) {
    return null;
  }

  return {
    clientId: decoded.slice(0, separatorIndex),
    clientSecret: decoded.slice(separatorIndex + 1),
  };
}

function requireBodyValue(value: string | undefined, name: string) {
  if (!value?.trim()) {
    throw new Error(`${name} is required.`);
  }

  return value;
}
