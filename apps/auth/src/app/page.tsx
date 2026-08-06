import {
  CheckCircle2,
  Database,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@vanta/ui/components/badge";
import { Button } from "@vanta/ui/components/button";

import {
  canManageAuthClients,
  getAuthRuntimeStatus,
  getCentralAuthSession,
} from "@/lib/auth";
import { ClientRegistrationForm } from "./client-registration-form";

export default async function Home() {
  const [session, status] = await Promise.all([
    getCentralAuthSession(),
    getAuthRuntimeStatus(),
  ]);
  const isConfigured = status.missingEnv.length === 0 && !status.clientError;
  const canRegisterClients = canManageAuthClients(session?.user);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-6 sm:px-8 lg:px-10">
        <header className="grid gap-5 border-b border-border pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <Badge className="mb-4 gap-2 px-3 py-1" variant="outline">
              <ShieldCheck className="size-3.5 text-primary" />
              Central auth
            </Badge>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              Vanta Auth
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              One Vercel App sign-in broker for internal tools that need a
              stable Vanta user subject.
            </p>
          </div>
          {session ? (
            <form action="/api/auth/signout" method="post">
              <Button type="submit" variant="secondary">
                Sign out
                <LockKeyhole />
              </Button>
            </form>
          ) : (
            <Button asChild>
              <a href="/api/auth/login">
                Sign in with Vercel
                <KeyRound />
              </a>
            </Button>
          )}
        </header>

        <section
          aria-label="Auth app status"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatusTile
            detail={
              isConfigured
                ? "Required runtime settings are present."
                : "Add the missing environment settings before production use."
            }
            icon={isConfigured ? CheckCircle2 : TriangleAlert}
            label="Configuration"
            tone={isConfigured ? "ok" : "warn"}
            value={isConfigured ? "Ready" : "Needs setup"}
          />
          <StatusTile
            detail={status.edgeConfigId ?? "Connect Edge Config first"}
            icon={Database}
            label="Registry"
            tone={status.clientError ? "warn" : "ok"}
            value={status.clientError ? "Unavailable" : "Edge Config"}
          />
          <StatusTile
            detail="Allowed callback targets for internal apps."
            icon={UsersRound}
            label="Clients"
            value={
              status.clients.length === 0 ? "0" : String(status.clients.length)
            }
          />
          <StatusTile
            detail={
              session?.user.email ?? session?.user.id ?? "No active session"
            }
            icon={session ? CheckCircle2 : KeyRound}
            label="Session"
            tone={session ? "ok" : "default"}
            value={session ? "Signed in" : "Signed out"}
          />
        </section>

        {!isConfigured ? (
          <section className="rounded-lg border border-destructive/50 bg-destructive/10 p-5">
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-5 text-destructive" />
              <h2 className="text-lg font-semibold">Setup Needed</h2>
            </div>
            {status.missingEnv.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {status.missingEnv.map((name) => (
                  <Badge className="font-mono" key={name} variant="outline">
                    {name}
                  </Badge>
                ))}
              </div>
            ) : null}
            {status.clientError ? (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {status.clientError}
              </p>
            ) : null}
          </section>
        ) : null}

        {status.registrationMissingEnv.length > 0 ? (
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">
                Client Registration Needs Setup
              </h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {status.registrationMissingEnv.map((name) => (
                <Badge className="font-mono" key={name} variant="outline">
                  {name}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <EndpointCard
            description="Starts the central sign-in flow for a registered internal app."
            method="GET"
            path="/api/auth/authorize"
          />
          <EndpointCard
            description="Exchanges a short-lived code for the signed-in Vanta user."
            method="POST"
            path="/api/auth/token"
          />
        </section>

        {session ? (
          <ClientRegistrationForm
            disabled={!status.registrationEnabled || !canRegisterClients}
          />
        ) : null}

        {status.clients.length > 0 ? (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <UsersRound className="size-5 text-primary" />
              <h2 className="text-xl font-semibold">Registered Clients</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {status.clients.map((client) => (
                <article
                  className="rounded-lg border border-border bg-card p-4 shadow-sm"
                  key={client.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-mono text-sm font-semibold">
                        {client.id}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {client.name ? `${client.name} · ` : ""}
                        {client.redirectUriCount} redirect URI
                        {client.redirectUriCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Badge variant={client.enabled ? "secondary" : "outline"}>
                      {client.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function EndpointCard({
  description,
  method,
  path,
}: {
  description: string;
  method: string;
  path: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Badge className="font-mono" variant="outline">
          {method}
        </Badge>
        <code className="font-mono text-sm text-primary">{path}</code>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

function StatusTile({
  detail,
  icon: Icon,
  label,
  tone = "default",
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone?: "default" | "ok" | "warn";
  value: string;
}) {
  const iconClassName =
    tone === "ok"
      ? "text-primary"
      : tone === "warn"
        ? "text-destructive"
        : "text-accent-foreground";

  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 truncate text-2xl font-semibold">{value}</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className={`size-4 ${iconClassName}`} />
        </span>
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
        {detail}
      </p>
    </article>
  );
}
