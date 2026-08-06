export function GET() {
  return Response.json({
    ok: true,
    app: "@vanta/jira-backlog",
    checkedAt: new Date().toISOString(),
  });
}
