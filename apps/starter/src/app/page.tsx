import {
  ArrowRight,
  ArrowUpRight,
  Blocks,
  CheckCircle2,
  Database,
  FolderKanban,
  GitBranch,
  Lightbulb,
  Layers3,
  Package,
  PackagePlus,
  Rocket,
  ShieldCheck,
  Slack,
  Sparkles,
} from "lucide-react";
import { Badge } from "@vanta/ui/components/badge";
import { Button } from "@vanta/ui/components/button";
import { createEnrichmentSummary, normalizeDomain } from "@vanta/enrichments";

import { IdeaSubmissionForm } from "./idea-submission-form";

const workspaceStats = [
  {
    label: "Deployable apps",
    value: "2",
    detail: "People-facing tools live in apps/* and can ship independently.",
    icon: FolderKanban,
  },
  {
    label: "Shared packages",
    value: "7",
    detail:
      "Reusable UI, data helpers, service clients, and code guardrails live in packages/*.",
    icon: Package,
  },
  {
    label: "Creator shortcuts",
    value: "3",
    detail: "Small scripts help teams add apps and packages consistently.",
    icon: PackagePlus,
  },
  {
    label: "Deployment pattern",
    value: "1",
    detail: "Each app can ship as its own Vercel project from this repo.",
    icon: Rocket,
  },
];

const workspaceAreas = [
  {
    name: "Apps",
    path: "apps/*",
    icon: Layers3,
    summary:
      "The actual internal tools people use. Each app can have its own owner, environment variables, domain, and Vercel project.",
    examples: ["apps/starter"],
  },
  {
    name: "Auth app",
    path: "apps/auth",
    icon: ShieldCheck,
    summary:
      "A centralized Sign in with Vercel broker that internal apps can use before requesting connector user tokens.",
    examples: ["apps/auth"],
  },
  {
    name: "Shared packages",
    path: "packages/*",
    icon: Blocks,
    summary:
      "Building blocks that apps reuse so teams do not rebuild buttons, formatting helpers, or code rules every time.",
    examples: [
      "packages/auth",
      "packages/ui",
      "packages/enrichments",
      "packages/google-sheets",
      "packages/slack",
      "packages/typescript-config",
    ],
  },
  {
    name: "Setup scripts",
    path: "scripts/*",
    icon: GitBranch,
    summary:
      "Repeatable shortcuts for creating new apps and packages with the same naming, ports, and workspace setup.",
    examples: [
      "scripts/create-app.mjs",
      "scripts/create-slack-app.mjs",
      "scripts/create-package.mjs",
    ],
  },
];

const launchFlow = [
  "Decide what internal workflow the tool should improve.",
  "Create a new app in apps/* or copy this starter when it fits.",
  "Reuse shared packages for UI, data cleanup, and code standards.",
  "Deploy the app as its own Vercel project with the app folder as the root.",
];

const enrichmentExample = createEnrichmentSummary({
  id: "company-domain",
  label: normalizeDomain("https://www.vanta.com/platform"),
});

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <header className="grid gap-6 border-b border-border pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <Badge className="mb-4 gap-2 px-3 py-1" variant="outline">
              <Blocks className="size-3.5 text-primary" />
              Template overview
            </Badge>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              Start a new internal app quickly
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              This template gives teams a working app, shared components, data
              helpers, setup scripts, and a deployment pattern they can copy
              into a new internal tool.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <a href="/slack-example">
                Slack example
                <Slack />
              </a>
            </Button>
            <Button asChild>
              <a
                href="https://github.com/VantaInc/base-internal-app-repository"
                rel="noreferrer"
                target="_blank"
              >
                View repo
                <ArrowUpRight />
              </a>
            </Button>
          </div>
        </header>

        <section
          aria-label="Workspace snapshot"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {workspaceStats.map((item) => {
            const Icon = item.icon;

            return (
              <article
                className="rounded-lg border border-border bg-card p-4 shadow-sm"
                key={item.label}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {item.detail}
                </p>
              </article>
            );
          })}
        </section>

        <section
          className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start"
          id="ideas"
        >
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-5 text-primary" />
              <h2 className="text-xl font-semibold">Internal app ideas</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Capture the workflow, owner, and access shape while the idea is
              fresh, then review it from the shared intake sheet.
            </p>
            <div className="mt-4 grid gap-2 font-mono text-xs text-muted-foreground">
              <span>submittedAt</span>
              <span>sourceApp</span>
              <span>sourceEnv</span>
              <span>appName</span>
              <span>submitterEmail</span>
              <span>description</span>
              <span>accessNeeded</span>
            </div>
          </div>
          <IdeaSubmissionForm />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Slack className="size-5 text-primary" />
              <h2 className="text-xl font-semibold">Slack Connector Example</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              The starter includes a read-only Vercel Connect example that signs
              in with Vercel and starts Slack user authorization with a stable
              app user subject.
            </p>
          </div>
          <Button asChild variant="outline">
            <a href="/slack-example">
              Open Slack example
              <ArrowRight />
            </a>
          </Button>
        </section>

        <section id="examples">
          <div className="mb-4 flex items-center gap-2">
            <Database className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">Live examples</h2>
          </div>
          <article className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Database className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold">Snowflake example</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Run a live query against the Vanta data warehouse and view the
                  results in a table.
                </p>
                <code className="mt-3 block w-fit rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs text-primary">
                  SELECT * FROM vanta.exports.vercel_dim_all_domains LIMIT 50
                </code>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Requires the shared Snowflake env vars linked and the app on
                  Vanta&apos;s secure compute network — available in Preview
                  today. See the setup guide.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <a
                    href="https://app.getguru.com/card/cdreMrji/How-to-Connect-Vercel-Apps-to-Snowflake"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Setup guide
                    <ArrowUpRight />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href="/snowflake-example">
                    Open example
                    <ArrowRight />
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Give it ~3 seconds to open — it runs a live query, so it is not
                instantaneous.
              </p>
            </div>
          </article>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]" id="map">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <FolderKanban className="size-5 text-primary" />
              <h2 className="text-xl font-semibold">What Lives Here</h2>
            </div>
            <div className="grid gap-4">
              {workspaceAreas.map((area) => {
                const Icon = area.icon;

                return (
                  <article
                    className="rounded-lg border border-border bg-card p-5 shadow-sm"
                    key={area.name}
                  >
                    <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                      <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h3 className="text-base font-semibold">
                            {area.name}
                          </h3>
                          <code className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs text-primary">
                            {area.path}
                          </code>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {area.summary}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {area.examples.map((example) => (
                            <Badge
                              className="font-mono text-muted-foreground"
                              key={example}
                              variant="outline"
                            >
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div id="deployment">
            <div className="mb-4 flex items-center gap-2">
              <Rocket className="size-5 text-primary" />
              <h2 className="text-xl font-semibold">How Work Goes Live</h2>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <ol className="grid gap-4">
                {launchFlow.map((step, index) => (
                  <li className="grid grid-cols-[auto_1fr] gap-3" key={step}>
                    <span className="flex size-8 items-center justify-center rounded-md bg-accent font-mono text-sm font-semibold text-accent-foreground">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-sm leading-6 text-card-foreground">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
              <div className="mt-6 rounded-md border border-border bg-background p-4">
                <p className="text-sm font-medium">Deployment pattern</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Each app is deployed separately. For this starter app, the
                  Vercel project root should be:
                </p>
                <code className="mt-3 block rounded-md bg-card px-3 py-2 font-mono text-sm text-primary">
                  apps/starter
                </code>
              </div>
            </div>
          </div>
        </section>

        <section id="decisions">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">What Is Already Settled</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              "Use one monorepo for internal apps.",
              "Put deployable tools in apps/*.",
              "Put reusable building blocks in packages/*.",
              "Use Next.js, Tailwind CSS, pnpm, and Turborepo.",
              "Deploy each app as its own Vercel project.",
            ].map((decision) => (
              <div
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
                key={decision}
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm leading-6">{decision}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <h2 className="text-xl font-semibold">Why This Starter Exists</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              The starter is both a demo and a template. It proves that an app
              can import shared UI and shared domain helpers, then gives future
              apps a clean place to begin.
            </p>
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              Shared helper example: {enrichmentExample.label} is normalized by
              @vanta/enrichments.
            </p>
          </div>
          <Button asChild variant="secondary">
            <a href="https://vercel.com/docs/monorepos/turborepo">
              Vercel monorepo guide
              <ArrowRight />
            </a>
          </Button>
        </section>
      </section>
    </main>
  );
}
