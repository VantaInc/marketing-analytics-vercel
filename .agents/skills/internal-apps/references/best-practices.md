# Internal Apps Best Practices

This repo is a small pnpm/Turborepo workspace. Keep the conventions lightweight until a real app need justifies more structure.

## Structure

- Keep deployable surfaces in `apps/*`.
- Keep reusable code in `packages/*`.
- Do not put shared code inside an app. Move it to a package when another app or package needs it.
- Do not add nested package globs such as `packages/**`; this repo currently uses only `apps/*` and `packages/*`.

## Packages

- Use the `@vanta/*` namespace for internal packages.
- Keep one purpose per package: UI, enrichments, config, auth, data access, or service clients.
- Export a clear public surface from `package.json`.
- Prefer workspace imports such as `@vanta/enrichments` or `@vanta/ui/components/button` over relative imports across package boundaries.
- Start with TypeScript source exports for simple internal packages; add compiled outputs only when a concrete consumer or cache need appears.

## Dependencies

- Install dependencies where they are used, not at the repo root.
- Keep root `package.json` limited to repo-level tools such as Turborepo, Prettier, and TypeScript.
- Use `workspace:*` for internal package dependencies.
- Commit `pnpm-lock.yaml` changes when dependency changes are intentional.

## Turborepo

- Keep root scripts as `turbo run ...` delegates.
- Prefer package-level scripts for `build`, `lint`, and `typecheck`.
- Keep `dev` uncached and persistent.
- Update `turbo.json` outputs when a package starts producing real build artifacts.

## Skills

- Keep repo-local skills small and specific to this repo.
- Prefer one concise `SKILL.md` plus short references over vendoring large third-party skills.
- Use global or per-developer installs for large external skill packs unless the repo needs to pin exact agent behavior.
