import { DEFAULT_JIRA_CONNECTOR_UID } from "@vanta/jira/connect";

export function getJiraConnectorUid(): string {
  return (
    process.env.JIRA_CONNECTOR_UID?.trim() ||
    process.env.VERCEL_CONNECT_ATLASSIAN_JIRA?.trim() ||
    DEFAULT_JIRA_CONNECTOR_UID
  );
}
