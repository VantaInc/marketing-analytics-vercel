import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@vanta/ui/components/button";

type AuthErrorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const params = searchParams ? await searchParams : {};
  const code = readSearchParam(params.code);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-10 sm:px-8">
        <header className="flex items-center gap-3 border-b border-border pb-5">
          <span className="flex size-9 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <AlertTriangle className="size-4" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Sign in failed</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The central auth flow did not complete for this session.
            </p>
          </div>
        </header>

        <div className="rounded-lg border border-border bg-card p-5 text-sm leading-6 text-muted-foreground shadow-sm">
          <p>
            Try signing in again. If it keeps failing, check the auth app URL,
            registered client credentials, and callback URL. Backend logs
            include the detailed auth diagnostics for this attempt.
          </p>

          {code ? (
            <dl className="mt-5 grid gap-2">
              <DiagnosticRow label="Error code" value={code} />
            </dl>
          ) : null}

          {code === "state_mismatch" ? (
            <p className="mt-5">
              This often means the sign-in started on one origin but the
              callback returned to another. Open the app from the same origin as
              the registered redirect URI, or register the current app origin.
            </p>
          ) : null}
        </div>

        <Button asChild variant="secondary">
          <Link href="/">
            <ArrowLeft />
            Back to Jira backlog
          </Link>
        </Button>
      </section>
    </main>
  );
}

function DiagnosticRow({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) {
    return null;
  }

  return (
    <div className="grid gap-1 rounded-md border border-border bg-background p-3 sm:grid-cols-[8rem_1fr] sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words font-mono text-foreground">{value}</dd>
    </div>
  );
}

function readSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
