import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Cloud,
  ExternalLink,
  Gauge,
  Kanban,
  Link2,
  ListFilter,
  RefreshCw,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  ConnectError,
  ConnectorInstallationRequiredError,
  NoValidTokenError,
  UserAuthorizationRequiredError,
  createJiraConnectClient,
} from "@vanta/jira/connect";
import {
  JIRA_BACKLOG_SCOPE_GROUPS,
  JIRA_BACKLOG_USER_SCOPES,
} from "@vanta/jira/scopes";
import {
  JiraApiError,
  fetchJiraBacklogSnapshot,
  type JiraAccessibleResource,
  type JiraBacklogSnapshot,
  type JiraIssue,
} from "@vanta/jira/web-api";
import { Badge } from "@vanta/ui/components/badge";
import { Button } from "@vanta/ui/components/button";
import { Input } from "@vanta/ui/components/input";

import { SignInButton, SignOutButton } from "./auth-buttons";
import {
  getAuthCallbackUrlForCurrentRequest,
  getAuthSession,
  type AuthSession,
} from "@/lib/auth";
import { getJiraConnectorUid } from "@/lib/jira";

export const dynamic = "force-dynamic";

const DEFAULT_JQL = "resolution = Unresolved ORDER BY updated DESC";
const MAX_ISSUES = 25;

type JiraBacklogPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type BacklogQueryOptions = {
  cloudId?: string;
  jql: string;
};

type JiraTokenMetadata = {
  connectorUid?: string;
  externalSubject?: string;
  installationId?: string;
  name?: string;
  tenantId?: string;
};

type JiraConnectionState =
  | {
      snapshot: JiraBacklogSnapshot;
      status: "connected";
      token: JiraTokenMetadata;
    }
  | {
      error: ErrorSummary;
      status: "needs_authorization" | "not_installed" | "error";
    };

type ErrorSummary = {
  detail?: string;
  message: string;
  title: string;
};

type BreakdownItem = {
  count: number;
  label: string;
};

type JiraCallbackParams = {
  externalSubject?: string;
  installationId?: string;
  tenantId?: string;
};

export default async function JiraBacklogPage({
  searchParams,
}: JiraBacklogPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const options = readBacklogQueryOptions(resolvedSearchParams);
  const callbackParams = readJiraCallbackParams(resolvedSearchParams);
  const session = await getAuthSession();
  const connectorUid = getJiraConnectorUid();
  const authCallbackUrl = await getAuthCallbackUrlForCurrentRequest();

  if (!session) {
    return (
      <SignedOutState
        authCallbackUrl={authCallbackUrl}
        connectorUid={connectorUid}
        callbackParams={callbackParams}
      />
    );
  }

  const connection = await loadJiraConnection(session, options, connectorUid);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-6 sm:px-8 lg:px-10">
        <AppHeader
          connection={connection}
          connectorUid={connectorUid}
          session={session}
        />

        <ConnectionDiagnostics
          authCallbackUrl={authCallbackUrl}
          callbackParams={callbackParams}
          connectorUid={connectorUid}
          session={session}
        />

        {connection.status === "connected" ? (
          <ConnectedBacklogView
            options={options}
            snapshot={connection.snapshot}
            token={connection.token}
          />
        ) : (
          <ConnectionActionPanel connection={connection} />
        )}
      </section>
    </main>
  );
}

async function loadJiraConnection(
  session: AuthSession,
  options: BacklogQueryOptions,
  connectorUid: string,
): Promise<JiraConnectionState> {
  try {
    const client = createJiraConnectClient({ connectorUid });
    const tokenResponse = await client.getUserTokenResponse({
      scopes: JIRA_BACKLOG_USER_SCOPES,
      userId: session.user.id,
    });
    const snapshot = await fetchJiraBacklogSnapshot({
      cloudId: options.cloudId,
      jql: options.jql,
      maxResults: MAX_ISSUES,
      token: tokenResponse.token,
    });

    return {
      snapshot,
      status: "connected",
      token: {
        connectorUid: tokenResponse.connector.uid,
        externalSubject: tokenResponse.externalSubject,
        installationId: tokenResponse.installationId,
        name: tokenResponse.name,
        tenantId: tokenResponse.tenantId,
      },
    };
  } catch (error) {
    if (
      error instanceof UserAuthorizationRequiredError ||
      error instanceof NoValidTokenError
    ) {
      return {
        error: summarizeError(error, "Jira authorization is required."),
        status: "needs_authorization",
      };
    }

    if (error instanceof ConnectorInstallationRequiredError) {
      return {
        error: summarizeError(
          error,
          "The Jira connector is not attached to this project.",
        ),
        status: "not_installed",
      };
    }

    return {
      error: summarizeError(error, "Jira connection check failed."),
      status: "error",
    };
  }
}

function SignedOutState({
  authCallbackUrl,
  callbackParams,
  connectorUid,
}: {
  authCallbackUrl: string;
  callbackParams: JiraCallbackParams;
  connectorUid: string;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-10 sm:px-8">
        <header className="grid gap-4 border-b border-border pb-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Kanban className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold">Jira backlog</h1>
              <Badge variant="outline">Vercel Connect</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Sign in before starting Jira user authorization.
            </p>
          </div>
        </header>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <h2 className="text-lg font-semibold">App user session</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Vercel Connect user tokens need a stable app user subject.
              </p>
              <dl className="mt-4 grid gap-2 rounded-md border border-border bg-background p-4 text-sm">
                <DiagnosticRow label="Connector UID" value={connectorUid} />
                <DiagnosticRow
                  label="Vanta Auth redirect URI"
                  value={authCallbackUrl}
                />
                <DiagnosticRow label="Subject type" value="user" />
                <DiagnosticRow label="Scopes" value={scopeLabel()} />
              </dl>
            </div>
            <SignInButton />
          </div>
        </section>

        {hasCallbackParams(callbackParams) ? (
          <CallbackPanel callbackParams={callbackParams} />
        ) : null}
      </section>
    </main>
  );
}

function AppHeader({
  connection,
  connectorUid,
  session,
}: {
  connection: JiraConnectionState;
  connectorUid: string;
  session: AuthSession;
}) {
  return (
    <header className="grid gap-5 border-b border-border pb-6 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Kanban className="size-5" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold">Jira backlog</h1>
            <Badge
              variant={
                connection.status === "connected" ? "default" : "outline"
              }
            >
              {connection.status === "connected"
                ? "Connected"
                : "Connector check"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {displayUser(session)}.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <a href="/api/jira/authorize">
            <Link2 />
            Connect Jira
          </a>
        </Button>
        <SignOutButton />
      </div>
      <p className="sr-only">Using Jira connector {connectorUid}</p>
    </header>
  );
}

function ConnectionDiagnostics({
  authCallbackUrl,
  callbackParams,
  connectorUid,
  session,
}: {
  authCallbackUrl: string;
  callbackParams: JiraCallbackParams;
  connectorUid: string;
  session: AuthSession;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Cloud className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Connection request</h2>
        </div>
        <dl className="mt-4 grid gap-2 text-sm">
          <DiagnosticRow label="Connector UID" value={connectorUid} />
          <DiagnosticRow
            label="Vanta Auth redirect URI"
            value={authCallbackUrl}
          />
          <DiagnosticRow label="Subject type" value="user" />
          <DiagnosticRow label="Subject ID" value={session.user.id} />
          <DiagnosticRow label="Scope bundle" value={scopeLabel()} />
        </dl>
      </article>

      <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ListFilter className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Requested scopes</h2>
        </div>
        <div className="mt-4 grid gap-3">
          {JIRA_BACKLOG_SCOPE_GROUPS.map((group) => (
            <div
              className="grid gap-2 rounded-md border border-border bg-background p-3"
              key={group.label}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{group.label}</span>
                <div className="flex flex-wrap gap-2">
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
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {group.description}
              </p>
            </div>
          ))}
        </div>
      </article>

      {hasCallbackParams(callbackParams) ? (
        <div className="lg:col-span-2">
          <CallbackPanel callbackParams={callbackParams} />
        </div>
      ) : null}
    </section>
  );
}

function ConnectedBacklogView({
  options,
  snapshot,
  token,
}: {
  options: BacklogQueryOptions;
  snapshot: JiraBacklogSnapshot;
  token: JiraTokenMetadata;
}) {
  const statusBreakdown = countBy(
    snapshot.issues,
    (issue) => issue.fields?.status?.name,
  );
  const typeBreakdown = countBy(
    snapshot.issues,
    (issue) => issue.fields?.issuetype?.name,
  );
  const unassignedCount = snapshot.issues.filter(
    (issue) => !issue.fields?.assignee?.displayName,
  ).length;

  return (
    <>
      <section
        aria-label="Jira connection summary"
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          detail={snapshot.selectedResource?.name ?? "No Jira site selected"}
          icon={Cloud}
          label="Accessible sites"
          value={snapshot.resources.length.toString()}
        />
        <MetricCard
          detail={snapshot.total ? "Jira reported total" : "Current sample"}
          icon={Kanban}
          label="Issues"
          value={(snapshot.total ?? snapshot.issues.length).toString()}
        />
        <MetricCard
          detail={`${snapshot.issues.length} loaded into this view`}
          icon={Gauge}
          label="Sample size"
          value={snapshot.issues.length.toString()}
        />
        <MetricCard
          detail="No Jira write call made"
          icon={UserRound}
          label="Unassigned"
          value={unassignedCount.toString()}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-primary" />
                <h2 className="text-lg font-semibold">Token-backed check</h2>
              </div>
              <dl className="mt-4 grid gap-2 text-sm">
                <DiagnosticRow
                  label="Connector"
                  value={token.connectorUid ?? "Jira connector"}
                />
                <DiagnosticRow
                  label="Installation"
                  value={token.installationId}
                />
                <DiagnosticRow label="Tenant" value={token.tenantId} />
                <DiagnosticRow
                  label="External subject"
                  value={token.externalSubject}
                />
              </dl>
            </div>
            {snapshot.selectedResource ? (
              <Button asChild variant="outline">
                <a
                  href={snapshot.selectedResource.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ArrowUpRight />
                  Open Jira
                </a>
              </Button>
            ) : null}
          </div>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <UserRound className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Jira user</h2>
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            <DiagnosticRow
              label="Name"
              value={snapshot.currentUser?.displayName}
            />
            <DiagnosticRow
              label="Account"
              value={snapshot.currentUser?.accountId}
            />
            <DiagnosticRow
              label="Email"
              value={snapshot.currentUser?.emailAddress}
            />
          </dl>
        </article>
      </section>

      <BacklogControls options={options} snapshot={snapshot} />

      <section className="grid gap-5 lg:grid-cols-2">
        <BreakdownBars data={statusBreakdown} title="Status mix" />
        <BreakdownBars data={typeBreakdown} title="Issue types" />
      </section>

      <IssueList
        issues={snapshot.issues}
        resource={snapshot.selectedResource}
      />
    </>
  );
}

function ConnectionActionPanel({
  connection,
}: {
  connection: Extract<
    JiraConnectionState,
    { status: "error" | "needs_authorization" | "not_installed" }
  >;
}) {
  const Icon =
    connection.status === "needs_authorization" ? Link2 : AlertTriangle;

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">{connection.error.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {connection.error.message}
            </p>
            {connection.error.detail ? (
              <p className="mt-3 break-words rounded-md border border-border bg-background p-3 font-mono text-xs text-muted-foreground">
                {connection.error.detail}
              </p>
            ) : null}
          </div>
        </div>
        <Button asChild>
          <a href="/api/jira/authorize">
            <Link2 />
            Connect Jira
          </a>
        </Button>
      </div>
    </section>
  );
}

function CallbackPanel({
  callbackParams,
}: {
  callbackParams: JiraCallbackParams;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <CheckCircle2 className="size-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">
            Authorization callback received
          </h2>
          <dl className="mt-4 grid gap-2 text-sm">
            <DiagnosticRow
              label="External subject"
              value={callbackParams.externalSubject}
            />
            <DiagnosticRow
              label="Installation ID"
              value={callbackParams.installationId}
            />
            <DiagnosticRow label="Tenant" value={callbackParams.tenantId} />
          </dl>
        </div>
      </div>
    </section>
  );
}

function BacklogControls({
  options,
  snapshot,
}: {
  options: BacklogQueryOptions;
  snapshot: JiraBacklogSnapshot;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <form className="grid gap-4 lg:grid-cols-[0.9fr_1.6fr_auto]" method="get">
        <label className="grid gap-2 text-sm font-medium" htmlFor="cloudId">
          Site
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
            defaultValue={snapshot.selectedResource?.id ?? ""}
            id="cloudId"
            name="cloudId"
          >
            {snapshot.resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium" htmlFor="jql">
          JQL
          <Input
            defaultValue={options.jql}
            id="jql"
            name="jql"
            placeholder={DEFAULT_JQL}
          />
        </label>
        <Button className="self-end" type="submit">
          <RefreshCw />
          Run check
        </Button>
      </form>
    </section>
  );
}

function BreakdownBars({
  data,
  title,
}: {
  data: BreakdownItem[];
  title: string;
}) {
  const max = data.reduce((current, item) => Math.max(current, item.count), 1);

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="mt-5 grid gap-4">
        {data.length > 0 ? (
          data.map((item) => (
            <div className="grid gap-2" key={item.label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{item.label}</span>
                <span className="text-muted-foreground">{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No issues returned.</p>
        )}
      </div>
    </section>
  );
}

function IssueList({
  issues,
  resource,
}: {
  issues: JiraIssue[];
  resource?: JiraAccessibleResource;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Kanban className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">Backlog sample</h2>
      </div>
      <div className="grid gap-3">
        {issues.length > 0 ? (
          issues.map((issue) => (
            <IssueRow issue={issue} key={issue.id} resource={resource} />
          ))
        ) : (
          <article className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
            No Jira issues matched the current query.
          </article>
        )}
      </div>
    </section>
  );
}

function IssueRow({
  issue,
  resource,
}: {
  issue: JiraIssue;
  resource?: JiraAccessibleResource;
}) {
  const issueUrl = resource ? `${resource.url}/browse/${issue.key}` : undefined;

  return (
    <article className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="font-mono" variant="outline">
            {issue.key}
          </Badge>
          <Badge variant="secondary">
            {issue.fields?.status?.name ?? "No status"}
          </Badge>
          {issue.fields?.issuetype?.name ? (
            <Badge variant="outline">{issue.fields.issuetype.name}</Badge>
          ) : null}
        </div>
        <h3 className="mt-3 truncate text-base font-semibold">
          {issue.fields?.summary ?? "Untitled issue"}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {issue.fields?.assignee?.displayName ?? "Unassigned"} - updated{" "}
          {formatDate(issue.fields?.updated)}
        </p>
      </div>
      {issueUrl ? (
        <Button asChild size="sm" variant="outline">
          <a href={issueUrl} rel="noreferrer" target="_blank">
            <ExternalLink />
            Open
          </a>
        </Button>
      ) : null}
    </article>
  );
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold">{value}</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{detail}</p>
    </article>
  );
}

function DiagnosticRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid gap-1 rounded-md border border-border bg-background p-3 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words font-mono text-foreground">
        {value?.trim() || "Not available"}
      </dd>
    </div>
  );
}

function readBacklogQueryOptions(
  searchParams: Record<string, string | string[] | undefined>,
): BacklogQueryOptions {
  return {
    cloudId: readSearchParam(searchParams.cloudId),
    jql: readSearchParam(searchParams.jql) || DEFAULT_JQL,
  };
}

function readJiraCallbackParams(
  searchParams: Record<string, string | string[] | undefined>,
): JiraCallbackParams {
  return {
    externalSubject: readSearchParam(searchParams.externalSubject),
    installationId: readSearchParam(searchParams.installationId),
    tenantId: readSearchParam(searchParams.tenantId),
  };
}

function readSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function hasCallbackParams(params: JiraCallbackParams): boolean {
  return Boolean(
    params.externalSubject || params.installationId || params.tenantId,
  );
}

function countBy(
  issues: JiraIssue[],
  getLabel: (issue: JiraIssue) => string | undefined,
): BreakdownItem[] {
  const counts = new Map<string, number>();

  for (const issue of issues) {
    const label = getLabel(issue)?.trim() || "Unknown";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ count, label }))
    .sort((first, second) => second.count - first.count);
}

function summarizeError(error: unknown, fallbackTitle: string): ErrorSummary {
  if (error instanceof JiraApiError) {
    return {
      detail: error.response ? JSON.stringify(error.response) : error.message,
      message: "The Jira token worked, but the Atlassian API request failed.",
      title: fallbackTitle,
    };
  }

  if (error instanceof ConnectError) {
    return {
      detail: error.code ?? error.statusText,
      message: error.message,
      title: fallbackTitle,
    };
  }

  if (error instanceof Error) {
    return {
      detail: error.name,
      message: error.message,
      title: fallbackTitle,
    };
  }

  return {
    message: "An unknown error occurred.",
    title: fallbackTitle,
  };
}

function scopeLabel(): string {
  return JIRA_BACKLOG_USER_SCOPES.join(", ");
}

function displayUser(session: AuthSession): string {
  return session.user.email ?? session.user.username ?? session.user.id;
}

function formatDate(value?: string): string {
  if (!value) {
    return "unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(date);
}
