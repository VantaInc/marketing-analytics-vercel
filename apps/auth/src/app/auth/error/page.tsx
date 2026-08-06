import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@vanta/ui/components/button";

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <TriangleAlert className="size-5 text-destructive" />
          <h1 className="text-xl font-semibold">Sign-in failed</h1>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The Vercel sign-in callback could not be completed. Check the auth app
          environment variables and callback URL, then try again.
        </p>
        <Button asChild className="mt-5">
          <Link href="/">Back to auth app</Link>
        </Button>
      </section>
    </main>
  );
}
