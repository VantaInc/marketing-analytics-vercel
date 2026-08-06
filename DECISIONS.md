# Decision Log

Last updated: 2026-06-09

This log captures the major decisions made in the initial internal-apps scaffold, plus the remaining high-level stack decisions to make.

## Decisions Made

### Monorepo

Decision: Use a single monorepo for internal apps.

Reasoning: Vercel's monorepo guidance supports multiple deployable projects in one repository. This gives us one place for shared code while still allowing each app to deploy independently.

References:

- [Vercel: Using Monorepos](https://vercel.com/docs/monorepos)
- [Vercel: Monorepo with Turborepo template](https://vercel.com/templates/monorepos/monorepo-turborepo)

### App and package layout

Decision: Use `apps/*` for deployable apps and `packages/*` for shared code.

Reasoning: This follows the Vercel/Turborepo template shape and keeps the intended ownership boundary clear: apps compose shared packages; packages do not become deploy targets by themselves.

References:

- [Vercel: Monorepo with Turborepo template](https://vercel.com/templates/monorepos/monorepo-turborepo)
- [Vercel: Configure pnpm workspaces](https://vercel.com/docs/conformance/rules/WORKSPACE_MISSING_PACKAGE_JSON)

### Vercel deployment model

Decision: Treat each app under `apps/*` as its own Vercel Project, with that app directory as the project root, for example `apps/starter`.

Reasoning: This keeps deployments, environment variables, domains, and ownership independent per internal app while preserving code reuse through the monorepo.

References:

- [Vercel: Using Monorepos](https://vercel.com/docs/monorepos)
- [Vercel: Configure a Build](https://vercel.com/docs/builds/configure-a-build)

### Turborepo

Decision: Use Turborepo to run `build`, `dev`, `lint`, and `typecheck` across the workspace.

Reasoning: Turborepo is the path used by Vercel's monorepo template and gives us package-aware builds, caching, and filtering as the repo grows.

References:

- [Vercel: Deploying Turborepo to Vercel](https://vercel.com/docs/monorepos/turborepo)
- [Vercel: Turborepo on Vercel](https://vercel.com/solutions/turborepo)

### pnpm workspaces

Decision: Use pnpm workspaces with a single lockfile.

Reasoning: This gives us local `workspace:*` dependencies for shared packages and matches Vercel's documented `apps/*` and `packages/*` workspace pattern.

References:

- [Vercel: Configure pnpm workspaces](https://vercel.com/docs/conformance/rules/WORKSPACE_MISSING_PACKAGE_JSON)

### Next.js

Decision: Use Next.js App Router for the starter app.

Reasoning: Next.js is Vercel's primary full-stack React framework with first-class deployment support.

References:

- [Vercel: Next.js on Vercel](https://vercel.com/docs/concepts/next.js/overview)
- [Vercel: Monorepo with Turborepo template](https://vercel.com/templates/monorepos/monorepo-turborepo)

### Tailwind and shadcn-style UI

Decision: Use Tailwind CSS and start a shared `packages/ui` package with shadcn-style source-owned components.

Reasoning: Vercel templates commonly pair Next.js, Tailwind, and shadcn/ui for app surfaces. Keeping UI in a shared package gives future apps a reuse path without introducing a heavy design system upfront.

References:

- [Vercel: Next.js Admin Dashboard template](https://vercel.com/templates/next.js/admin-dashboard)

### Shared enrichments

Decision: Add `packages/enrichments` as an initial shared domain package.

Reasoning: Shared enrichments were one of the main reasons to choose a monorepo. Adding the package now gives app teams a clear home for reusable enrichment logic.

### Repo-local AI agent skills

Decision: Store lightweight repo-specific AI agent skills under `.agents/skills`.

Reasoning: Project-local skills make coding-agent behavior portable with the repo while keeping the distinction clear between agent playbooks and runtime app packages. Start with a small `internal-apps` skill for repo navigation and conventions; install large external skill packs globally or per-developer unless exact agent behavior needs to be pinned in the repo.

References:

- [Vercel: Agent Skills](https://vercel.com/docs/agent-resources/skills)
- [Turborepo best-practices reference shape](https://github.com/vercel/turborepo/tree/main/skills/turborepo/references/best-practices)

### Shared config packages

Decision: Add shared TypeScript and ESLint config packages.

Reasoning: This follows the Vercel/Turborepo template and keeps baseline checks consistent across apps and shared packages.

References:

- [Vercel: Monorepo with Turborepo template](https://vercel.com/templates/monorepos/monorepo-turborepo)

### Lightweight scaffolding

Decision: Add small `new:app` and `new:package` scripts instead of starting with a full platform service.

Reasoning: This gives the org a usable path immediately while leaving room to automate GitHub and Vercel setup later.

Update: Add `new:slack-app` as a local wrapper around app creation that writes
an app-specific Slack/Vercel Connect setup checklist. It documents the Vercel
Project settings, Vanta Auth redirect URIs, connector UID, local environment
setup, and `/slack-example` verification path without requiring automation
tokens for Vercel or Slack.

### Template repository onboarding

Decision: Treat this repo as a GitHub template for new internal app repositories.

Reasoning: New app teams need a low-friction way to copy the repo, understand
the first files to edit, make changes safely through branches and pull requests,
and deploy an app without rebuilding the same monorepo structure.

### Slack connector starter

Decision: Add a shared `@vanta/slack` package and a read-only Slack example in
the starter app using Vercel Connect.

Reasoning: Slack is a common internal-app integration. Keeping the Connect
token wiring in a shared package gives future Slack apps a safe default:
request short-lived provider tokens at runtime, keep tokens server-side, and
avoid long-lived Slack secrets in environment variables.

References:

- [Vercel Connect](https://vercel.com/docs/connect)
- [Vercel Connect SDK Reference](https://vercel.com/docs/connect/ts-sdk-reference)
- [Slack Web API: auth.test](https://docs.slack.dev/reference/methods/auth.test)

### Starter authentication

Decision: Use centralized Vanta Auth for the starter Slack example.

Reasoning: Vercel Connect user tokens need a stable application user subject.
The starter delegates sign-in to `apps/auth` through `@vanta/auth`, so new Slack
apps copied from the starter do not need their own Sign in with Vercel app. The
starter stores only an app-owned signed session cookie and does not persist
Vercel or Slack provider tokens.

References:

- [Sign in with Vercel](https://vercel.com/docs/sign-in-with-vercel)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)

### Centralized auth app

Decision: Add `apps/auth` and `packages/auth` so internal apps can delegate
user sign-in to one Vercel App-backed auth broker.

Reasoning: Vercel Connect user tokens need stable app user subjects, but each
new internal app should not need its own Sign in with Vercel integration. The
auth app owns the single Vercel OAuth client, validates registered internal app
redirect URIs from Edge Config, issues short-lived authorization codes, and
lets client apps exchange those codes for normalized user identity through
`@vanta/auth`. Edge Config keeps client registration self-service without
requiring an auth-app redeploy for every new internal app, while raw client
secrets are shown once and only hashed values are stored. Registration is
limited to a small configured auth-admin email allowlist rather than every user
with an allowed email domain.

References:

- [Sign in with Vercel](https://vercel.com/docs/sign-in-with-vercel)
- [Vercel Edge Config](https://vercel.com/docs/edge-config)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)

## Remaining Stack Decisions

### Database

Status: Not implemented.

Current policy: Use only the supported stores listed in
[`docs/databases.md`](./docs/databases.md). None of those stores are approved
for CPD, so internal apps created from this template must not store CPD in them.
Add a shared database package only after the first real app has a persistence
need and has chosen one of the supported stores.

References:

- [Vanta-supported internal app databases](./docs/databases.md)

### Auth

Status: Partially implemented with the starter Slack example and centralized
auth broker.

Notes: `apps/auth` centralizes Sign in with Vercel for internal apps that only
need a stable user identity. A broader auth choice for production apps can
still use Auth.js, Clerk, better-auth, or another provider when the app needs
roles, groups, persistence, or enterprise SSO.

References:

- [Vercel: Next.js Admin Dashboard template](https://vercel.com/templates/next.js/admin-dashboard)
- [Vercel: Clerk Authentication Starter](https://vercel.com/templates/next.js/clerk-authentication-starter)

### AI and agent framework

Status: Not implemented.

Notes: Could add a shared `packages/ai` package when there is a concrete app use case, and route model calls through Vercel AI Gateway.

References:

- [Vercel: AI Gateway SDKs and APIs](https://vercel.com/docs/ai-gateway/sdks-and-apis)
- [Vercel: AI Gateway authentication](https://vercel.com/docs/ai-gateway/authentication-and-byok/authentication)
- [Vercel: Next.js AI Chatbot template](https://vercel.com/templates/Next.js/nextjs-ai-chatbot)

### GitHub and Vercel automation

Status: Partially implemented.

Notes: Local scaffold scripts now cover app creation, package creation, and
Slack/Vercel Connect setup checklist generation. They do not yet create Vercel
Projects, attach connector resources, write environment variables through the
Vercel API, or open GitHub pull requests. Add that only after the manual setup
path has settled.

References:

- [Vercel: Configure a Build](https://vercel.com/docs/builds/configure-a-build)
- [Vercel: Vercel SDK](https://vercel.com/docs/rest-api/sdk)

### CI and production readiness

Status: Not implemented.

Notes: Add CI, remote caching, and observability after the first app is deployed so those choices mirror the real deployment path.

References:

- [Vercel: Deploying Turborepo to Vercel](https://vercel.com/docs/monorepos/turborepo)
