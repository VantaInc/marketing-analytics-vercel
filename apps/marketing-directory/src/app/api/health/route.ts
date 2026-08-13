export function GET() {
  return Response.json({
    ok: true,
    app: "@vanta/marketing-directory",
    checkedAt: new Date().toISOString(),
  });
}
