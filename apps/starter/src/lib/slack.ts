export const DEFAULT_SLACK_CONNECTOR_UID = "slack/slack-vercel-connection";

export function getSlackConnectorUid(): string {
  return (
    process.env.SLACK_CONNECTOR_UID?.trim() ||
    process.env.VERCEL_CONNECT_SLACK_CONNECTOR?.trim() ||
    DEFAULT_SLACK_CONNECTOR_UID
  );
}
