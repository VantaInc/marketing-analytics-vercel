# Getting Started

This guide is for teammates who are making their first change in GitHub or who
would rather follow a checklist than memorize developer tooling.

## The Short Version

1. Make your own copy of this template repository.
2. Optionally rename the starter app.
3. Create a branch for your change.
4. Edit the files for your app.
5. Save the change as a commit.
6. Open a pull request so someone can review it.
7. Deploy the app from Vercel when the change is ready.

For the focused app creation and deployment path, see
[`docs/create-and-deploy-app.md`](./docs/create-and-deploy-app.md).

## Helpful Words

- **Repository**: the project folder in GitHub.
- **Template repository**: a repository you copy when starting a new project.
- **Branch**: a safe place to make changes without changing `main`.
- **Commit**: a saved checkpoint of your changes.
- **Pull request**: a request for someone to review and merge your branch.
- **`main`**: the stable branch people should not edit directly.

## Create Your App Repository

1. Open the template repository in GitHub.
2. Click **Use this template**.
3. Click **Create a new repository**.
4. Choose `VantaInc` as the owner.
5. Name the repository after the app or team, such as
   `vendor-review-dashboard`.
6. Add a short description so teammates know what the app is for.
7. Create the repository.

Ask an engineer or GitHub admin to confirm the new repository has branch
protection on `main` before the app is used for production work.

## Make Your First Change In GitHub Codespaces

Codespaces is the easiest path if you do not already have a local developer
setup.

1. Open your new repository in GitHub.
2. Click **Code**.
3. Open the **Codespaces** tab.
4. Click **Create codespace on main**.
5. Wait for the browser editor to load.
6. Open the terminal at the bottom of the screen.
7. Run:

```bash
corepack enable
pnpm install
pnpm dev --filter=@vanta/starter
```

8. When Codespaces offers to open port `3000`, open it in the browser.

If you see the starter app, the setup worked.

If this repository will contain one app, you can rename the starter before
making app-specific edits:

```bash
pnpm rename:starter vendor-review-dashboard
pnpm dev --filter=@vanta/vendor-review-dashboard
```

## Create A Branch

Before editing files, create a branch. In the Codespaces terminal, run:

```bash
git switch -c your-name/short-description
```

Example:

```bash
git switch -c alex/update-homepage-copy
```

Use a branch name that says what you are changing.

## Files You Are Most Likely To Edit

- `apps/starter/src/app/page.tsx`: the main homepage.
- `apps/starter/src/app/globals.css`: shared styling tokens.
- `apps/starter/README.md`: setup notes for the starter app.
- `apps/starter/.env.example`: example environment variables.
- `packages/ui`: reusable buttons and UI building blocks.
- `packages/enrichments`: reusable TypeScript helper logic.
- `packages/google-sheets`: reusable Google Sheets helper logic.

Do not commit `.env`, `.env.local`, `.vercel`, `node_modules`, or files with
real secrets.

## Save Your Change

After editing, run the checks you can:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Then save your work:

```bash
git status
git add README.md apps/starter/src/app/page.tsx
git commit -m "Update starter app homepage"
git push --set-upstream origin your-name/short-description
```

Change the file names and commit message to match what you actually edited.

## Open A Pull Request

1. Open your repository in GitHub.
2. GitHub should show a banner for your pushed branch.
3. Click **Compare & pull request**.
4. Fill in what changed and how you tested it.
5. Ask a teammate to review it.
6. After approval, merge the pull request.

If GitHub does not show the banner, open the **Pull requests** tab and click
**New pull request**.

## Local Development Without Codespaces

If you prefer working on your computer:

1. Install Node.js 22 or newer.
2. Install GitHub Desktop or Git.
3. Clone your new repository.
4. Open a terminal in the repository folder.
5. Run:

```bash
corepack enable
pnpm install
pnpm dev --filter=@vanta/starter
```

Then open [http://localhost:3000](http://localhost:3000).

## Connect To Snowflake

Snowflake is pre-wired into the starter app. See:

- `apps/starter/src/lib/snowflake.ts` — connector helper
- `apps/starter/src/lib/example_snowflake_call.ts` — working example
- `apps/starter/.env.example` — required environment variables

## Connect To Slack

For a new Slack-backed app, run:

```bash
pnpm new:slack-app slack-review-tool
```

Then follow the generated
`apps/slack-review-tool/SLACK_CONNECT_SETUP.md` checklist. The reusable runbook
is [`docs/slack-vercel-connect-app.md`](./docs/slack-vercel-connect-app.md).

Slack-backed apps also need a Vanta Auth client. See
[`docs/register-vanta-auth-client.md`](./docs/register-vanta-auth-client.md)
for who can register one and what information to prepare.

## Create A Reusable Connector

When multiple apps need the same external service, create a shared package under
`packages/*` instead of copying client code between apps. See
[`docs/create-connector.md`](./docs/create-connector.md).

## When You Need Help

Ask for help if:

- You are not sure which file to edit.
- `pnpm install`, `pnpm dev`, or a check command fails.
- Git asks you to resolve a merge conflict.
- You need a secret or environment variable.
- You are unsure whether a change should go into an app or a shared package.
