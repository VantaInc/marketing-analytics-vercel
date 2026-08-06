import type { ConnectTokenParams } from "@vercel/connect";

import { buildSlackUserAuthorizationParams } from "./connect";

export const SLACK_RECENT_ACTIVITY_USER_SCOPES = [
  "channels:read",
  "channels:history",
  "groups:read",
  "groups:history",
  "im:read",
  "im:history",
  "mpim:read",
  "mpim:history",
] as const;

export const SLACK_RECENT_ACTIVITY_SCOPE_GROUPS = [
  {
    description: "Public channel membership and message history.",
    label: "Public channels",
    scopes: ["channels:read", "channels:history"],
  },
  {
    description: "Private channel membership and message history.",
    label: "Private channels",
    scopes: ["groups:read", "groups:history"],
  },
  {
    description: "One-to-one direct message metadata and message history.",
    label: "Direct messages",
    scopes: ["im:read", "im:history"],
  },
  {
    description: "Group direct message metadata and message history.",
    label: "Group DMs",
    scopes: ["mpim:read", "mpim:history"],
  },
] as const;

export type SlackRecentActivityUserScope =
  (typeof SLACK_RECENT_ACTIVITY_USER_SCOPES)[number];

export type SlackRecentActivityAuthorizationParamsInput = {
  installationId?: string;
  userId: string;
};

/**
 * Requests the read-only user scopes a later recent-activity reader will need.
 * This intentionally builds authorization params only; it does not retrieve a
 * token or call Slack history APIs.
 */
export function buildSlackRecentActivityAuthorizationParams({
  installationId,
  userId,
}: SlackRecentActivityAuthorizationParamsInput): ConnectTokenParams {
  return buildSlackUserAuthorizationParams({
    installationId,
    scopes: SLACK_RECENT_ACTIVITY_USER_SCOPES,
    userId,
  });
}
