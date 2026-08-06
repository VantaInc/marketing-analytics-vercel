import type { ConnectTokenParams } from "@vercel/connect";

import { buildJiraUserAuthorizationParams } from "./connect";

export const JIRA_BACKLOG_USER_SCOPES = [
  "read:jira-user",
  "read:jira-work",
  "write:jira-work",
] as const;

export const JIRA_BACKLOG_SCOPE_GROUPS = [
  {
    description: "Read the authorized Jira user's profile for a smoke test.",
    label: "User profile",
    scopes: ["read:jira-user"],
  },
  {
    description: "Read projects, issues, statuses, and issue fields.",
    label: "Backlog read",
    scopes: ["read:jira-work"],
  },
  {
    description: "Allow a later controlled mutation test against Jira work.",
    label: "Backlog write",
    scopes: ["write:jira-work"],
  },
] as const;

export type JiraBacklogUserScope = (typeof JIRA_BACKLOG_USER_SCOPES)[number];

export type JiraBacklogAuthorizationParamsInput = {
  installationId?: string;
  userId: string;
};

export function buildJiraBacklogAuthorizationParams({
  installationId,
  userId,
}: JiraBacklogAuthorizationParamsInput): ConnectTokenParams {
  return buildJiraUserAuthorizationParams({
    installationId,
    scopes: JIRA_BACKLOG_USER_SCOPES,
    userId,
  });
}
