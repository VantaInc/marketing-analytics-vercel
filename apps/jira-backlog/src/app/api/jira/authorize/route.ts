import { type NextRequest, NextResponse } from "next/server";
import { createJiraConnectClient } from "@vanta/jira/connect";
import { JIRA_BACKLOG_USER_SCOPES } from "@vanta/jira/scopes";

import { getAuthSession } from "@/lib/auth";
import { getJiraConnectorUid } from "@/lib/jira";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.redirect(new URL("/api/auth/authorize", request.url));
  }

  const callbackUrl = new URL("/", request.url).toString();
  const connectorUid = getJiraConnectorUid();
  const client = createJiraConnectClient({ connectorUid });

  try {
    const { url } = await client.startUserAuthorization({
      callbackUrl,
      scopes: JIRA_BACKLOG_USER_SCOPES,
      userId: session.user.id,
    });

    return NextResponse.redirect(url);
  } catch (error) {
    console.warn(
      "Failed to start Jira Connect authorization.",
      getJiraAuthorizationErrorDetails(
        error,
        callbackUrl,
        connectorUid,
        session.user.id,
      ),
    );
    throw error;
  }
}

function getJiraAuthorizationErrorDetails(
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
    scopes: JIRA_BACKLOG_USER_SCOPES,
    userSubject: userId,
  };
}
