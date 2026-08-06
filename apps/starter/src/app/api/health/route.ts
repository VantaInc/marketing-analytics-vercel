export function GET() {
  return Response.json({
    ok: true,
    app: "@vanta/starter",
    checkedAt: new Date().toISOString(),
  });
}
