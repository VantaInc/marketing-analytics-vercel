import {
  ArrowLeft,
  AtSign,
  CheckCircle2,
  Hash,
  Link2,
  Lock,
  MessageSquare,
  Slack,
} from "lucide-react";
import Link from "next/link";

import {
  SLACK_RECENT_ACTIVITY_SCOPE_GROUPS,
  SLACK_RECENT_ACTIVITY_USER_SCOPES,
} from "@vanta/slack/recent-activity";
import { Badge } from "@vanta/ui/components/badge";
import { Button } from "@vanta/ui/components/button";

import { SignInButton, SignOutButton } from "../auth-buttons";
import { getAuthSession, type AuthSession } from "@/lib/auth";
import { getSlackConnectorUid } from "@/lib/slack";

export const dynamic = "force-dynamic";

type SlackExamplePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SlackAuthorizationCallbackParams = {
  externalSubject?: string;
  installationId?: string;
  tenantId?: string;
};

export default async function SlackExamplePage({
  searchParams,
}: SlackExamplePageProps) {
  const session = await getAuthSession();

  if (!session) {
    return <SignedOutState />;
  }

  const callbackParams = readSlackCallbackParams(
    searchParams ? await searchParams : {},
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <SlackHeader session={session} />

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <h2 className="text-lg font-semibold">
                Slack user authorization
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This starter route only calls Vercel Connect user authorization
                for the signed-in app user subject.
              </p>
              <dl className="mt-4 grid gap-2 rounded-md border border-border bg-background p-4">
                <DiagnosticRow
                  label="Connector UID"
                  value={getSlackConnectorUid()}
                />
                <DiagnosticRow label="Subject type" value="user" />
                <DiagnosticRow label="Subject ID" value={session.user.id} />
                <DiagnosticRow
                  label="Scope bundle"
                  value="recent mentions and messages"
                />
              </dl>
            </div>
            <Button asChild>
              <a href="/api/slack/authorize">
                <Link2 />
                Authorize recent activity
              </a>
            </Button>
          </div>
        </section>

        <RecentActivityScopePanel callbackParams={callbackParams} />

        {hasCallbackParams(callbackParams) ? (
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <CheckCircle2 className="size-4" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">
                  Authorization callback received
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Vercel Connect redirected back after Slack user authorization
                  for the recent activity scope bundle.
                </p>
              </div>
            </div>
            <dl className="mt-4 grid gap-2 rounded-md border border-border bg-background p-4">
              <DiagnosticRow
                label="Slack subject"
                value={callbackParams.externalSubject}
              />
              <DiagnosticRow
                label="Installation ID"
                value={callbackParams.installationId}
              />
              <DiagnosticRow
                label="Tenant/workspace"
                value={callbackParams.tenantId}
              />
            </dl>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function SignedOutState() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-10 sm:px-8">
        <header className="flex items-center gap-3 border-b border-border pb-5">
          <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Slack className="size-4" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Slack example</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in first so Slack authorization can use a stable app user
              subject.
            </p>
          </div>
        </header>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm leading-6 text-muted-foreground">
            The starter only begins Slack user authorization after the app has a
            signed-in user.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <SignInButton />
            <Button asChild variant="secondary">
              <Link href="/">
                <ArrowLeft />
                Back to starter
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function SlackHeader({ session }: { session: AuthSession }) {
  return (
    <header className="grid gap-4 border-b border-border pb-5 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Slack className="size-4" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">Slack example</h1>
            <Badge variant="outline">User authorization only</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as{" "}
            {session.user.email ??
              session.user.username ??
              "authenticated user"}
            .
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/">
            <ArrowLeft />
            Starter
          </Link>
        </Button>
        <SignOutButton />
      </div>
    </header>
  );
}

function RecentActivityScopePanel({
  callbackParams,
}: {
  callbackParams: SlackAuthorizationCallbackParams;
}) {
  const isAuthorized = hasCallbackParams(callbackParams);

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <MessageSquare className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">
              Recent mentions and messages
            </h2>
            <Badge variant={isAuthorized ? "default" : "outline"}>
              {isAuthorized ? "Authorized" : "Authorization required"}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The Slack connector request uses read-only user scopes for
            conversations the signed-in user can access.
          </p>
        </div>
        <Badge className="font-mono text-muted-foreground" variant="outline">
          {SLACK_RECENT_ACTIVITY_USER_SCOPES.length} user scopes
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {SLACK_RECENT_ACTIVITY_SCOPE_GROUPS.map((group) => {
          const Icon =
            group.label === "Public channels"
              ? Hash
              : group.label === "Direct messages"
                ? AtSign
                : Lock;

          return (
            <article
              className="rounded-md border border-border bg-background p-4"
              key={group.label}
            >
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">{group.label}</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {group.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.scopes.map((scope) => (
                  <Badge
                    className="font-mono text-muted-foreground"
                    key={scope}
                    variant="outline"
                  >
                    {scope}
                  </Badge>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DiagnosticRow({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
      <dt className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="break-words font-mono text-xs">{value}</dd>
    </div>
  );
}

function hasCallbackParams({
  externalSubject,
  installationId,
  tenantId,
}: SlackAuthorizationCallbackParams): boolean {
  return Boolean(externalSubject || installationId || tenantId);
}

function readSlackCallbackParams(
  searchParams: Record<string, string | string[] | undefined>,
): SlackAuthorizationCallbackParams {
  return {
    externalSubject: readSearchParam(searchParams.externalSubject),
    installationId: readSearchParam(searchParams.installationId),
    tenantId: readSearchParam(searchParams.tenantId),
  };
}

function readSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  const normalized = Array.isArray(value) ? value[0] : value;

  return normalized?.trim() || undefined;
}
