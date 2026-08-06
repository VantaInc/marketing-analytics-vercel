import { type NextRequest, NextResponse } from "next/server";
import { startAuthorization } from "@vercel/connect";
import {
  SLACK_RECENT_ACTIVITY_USER_SCOPES,
  buildSlackRecentActivityAuthorizationParams,
} from "@vanta/slack/recent-activity";

import { getAuthSession } from "@/lib/auth";
import { getSlackConnectorUid } from "@/lib/slack";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.redirect(new URL("/api/auth/authorize", request.url));
  }

  const callbackUrl = new URL("/slack-example", request.url).toString();
  const connectorUid = getSlackConnectorUid();

  try {
    const { url } = await startAuthorization(
      connectorUid,
      buildSlackRecentActivityAuthorizationParams({
        userId: session.user.id,
      }),
      { callbackUrl },
    );

    return NextResponse.redirect(url);
  } catch (error) {
    console.warn(
      "Failed to start Slack Connect authorization.",
      getSlackAuthorizationErrorDetails(
        error,
        callbackUrl,
        connectorUid,
        session.user.id,
      ),
    );
    throw error;
  }
}

function getSlackAuthorizationErrorDetails(
  error: unknown,
  callbackUrl: string,
  connectorUid: string,
  userId: string,
) {
  return {
    callbackUrl,
    connectorUid,
    message: error instanceof Error ? error.message : undefined,
    name: error instanceof Error ? error.name : typeof error,
    scopes: SLACK_RECENT_ACTIVITY_USER_SCOPES,
    userSubject: userId,
  };
}
