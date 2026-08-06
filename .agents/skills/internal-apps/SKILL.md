---
name: internal-apps
description: Navigate and modify the Vanta internal-apps monorepo. Use when Codex is working in this repository on apps under apps/*, shared packages under packages/*, Turborepo or pnpm workspace configuration, scaffold scripts, shared enrichments, shared UI components, or repo-local conventions.
---

# Internal Apps

## Overview

Use this skill as the lightweight repo map for `internal-apps`. It captures the current workspace shape, ownership boundaries, and first checks to run before changing code.

## Start Here

1. Read `README.md` and `DECISIONS.md` for the current setup and open stack decisions.
2. For self-serve workflows, use the focused runbooks in `docs/`:
   - `docs/create-and-deploy-app.md`
   - `docs/slack-vercel-connect-app.md`
   - `docs/register-vanta-auth-client.md`
   - `docs/create-connector.md`
   - `docs/databases.md`
3. Check `git status --short` before editing; preserve unrelated user changes.
4. Use `rg --files` to locate code and configs quickly.
5. Read the nearest `package.json`, `tsconfig.json`, and `eslint.config.mjs` before changing an app or package.
6. Read `references/best-practices.md` when adding apps, packages, dependencies, or changing repo structure.

## Repo Map

- `apps/*`: deployable internal apps. Each app should be deployable as its own Vercel Project with the app directory as the project root.
- `packages/*`: shared code consumed by apps or other packages.
- `packages/ui`: shared shadcn-style React UI components and utilities.
- `packages/enrichments`: shared domain enrichment logic that apps import at runtime.
- `packages/typescript-config` and `packages/eslint-config`: shared config packages.
- `scripts/create-app.mjs`: scaffolds a new app from `apps/starter`.
- `scripts/create-slack-app.mjs`: scaffolds a new app and writes an app-specific Slack/Vercel Connect setup checklist.
- `scripts/create-package.mjs`: scaffolds a new shared package.

## Common Workflows

### Add an app

Use `pnpm new:app <app-name>`. The script copies `apps/starter`, rewrites package names, and assigns the next available local dev port.

### Add a Slack-backed app

Use `pnpm new:slack-app <app-name>`. The script creates the app from `apps/starter`, then writes `apps/<app-name>/SLACK_CONNECT_SETUP.md` with the Vanta Auth redirect URIs, Vercel Project settings, Slack connector UID, and local verification path.

### Add a shared package

Use `pnpm new:package <package-name>`. Keep the package focused on one purpose and export the intended public surface from `package.json`.

For connector-style packages and Vercel Connect connections, use `docs/create-connector.md`.

For persistence, use only the supported stores in `docs/databases.md`. Do not store CPD in them.

### Add enrichment logic

Prefer `packages/enrichments/src/index.ts` for reusable enrichment helpers. Keep enrichments pure and easy to call from apps; avoid app-specific UI or deployment concerns in this package.

### Add UI

Prefer `packages/ui/src/components` for reusable components. Import shared UI from package exports such as `@vanta/ui/components/button`, not by reaching across package folders.

## Verification

- Use `pnpm typecheck` after TypeScript or config changes.
- Use `pnpm lint` after React, package, or config changes.
- Use `pnpm build` when changing app wiring, package exports, or Turborepo behavior.
- For focused checks, use Turborepo filters, for example `pnpm typecheck --filter=@vanta/starter`.
