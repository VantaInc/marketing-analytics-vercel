import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@vanta/ui/components/button";

export default function AuthErrorPage() {
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
          Try signing in again. If it keeps failing, check the auth app URL,
          registered client credentials, and callback URL.
        </div>

        <Button asChild variant="secondary">
          <Link href="/">
            <ArrowLeft />
            Back to directory
          </Link>
        </Button>
      </section>
    </main>
  );
}
