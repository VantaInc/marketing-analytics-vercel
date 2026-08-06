import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_AUTH_URL = "https://vanta-internal-auth.vercel.app";
const DEFAULT_CONNECTOR_UID = "slack/slack-vercel-connection";

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printUsage();
  process.exit(0);
}

if (!options.appName) {
  printUsage();
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(options.appName)) {
  console.error("App names must use lowercase letters, numbers, and hyphens.");
  process.exit(1);
}

const repoRoot = process.cwd();
const appPath = `apps/${options.appName}`;
const target = join(repoRoot, appPath);

if (!options.checklistOnly) {
  const createResult = spawnSync(
    process.execPath,
    [join(repoRoot, "scripts", "create-app.mjs"), options.appName],
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  );

  if (createResult.status !== 0) {
    process.exit(createResult.status ?? 1);
  }
} else if (!existsSync(target)) {
  console.error(`${appPath} does not exist.`);
  process.exit(1);
}

const packageJsonPath = join(target, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const devPort = getDevPort(packageJson);

if (!devPort) {
  console.error(`Could not find a dev port in ${appPath}/package.json.`);
  process.exit(1);
}

const setupPath = join(target, "SLACK_CONNECT_SETUP.md");

if (existsSync(setupPath) && !options.force) {
  console.error(
    `${appPath}/SLACK_CONNECT_SETUP.md already exists. Re-run with --force to replace it.`,
  );
  process.exit(1);
}

const packageName = packageJson.name ?? `@vanta/${options.appName}`;
const appTitle = titleize(options.appName);
const authUrl = options.authUrl ?? DEFAULT_AUTH_URL;
const connectorUid = options.connectorUid ?? DEFAULT_CONNECTOR_UID;
const localUrl = `http://localhost:${devPort}`;
const productionUrl =
  options.productionUrl ?? `https://${options.appName}.vercel.app`;

writeFileSync(
  setupPath,
  buildSetupMarkdown({
    appName: options.appName,
    appPath,
    appTitle,
    authUrl,
    connectorUid,
    localUrl,
    packageName,
    productionUrl,
  }),
);

console.log(`Wrote ${appPath}/SLACK_CONNECT_SETUP.md.`);
console.log("");
console.log("Next steps:");
console.log(`1. Read ${appPath}/SLACK_CONNECT_SETUP.md.`);
console.log(`2. Create a Vercel Project with root directory ${appPath}.`);
console.log(
  `3. Register auth redirect URIs for ${localUrl} and ${productionUrl}.`,
);
console.log(`4. Attach connector ${connectorUid} and test /slack-example.`);

function parseArgs(args) {
  const parsed = {
    appName: undefined,
    authUrl: undefined,
    checklistOnly: false,
    connectorUid: undefined,
    force: false,
    help: false,
    productionUrl: undefined,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--checklist-only") {
      parsed.checklistOnly = true;
      continue;
    }

    if (arg === "--force") {
      parsed.force = true;
      continue;
    }

    if (arg.startsWith("--connector-uid=")) {
      parsed.connectorUid = readFlagValue(arg, "--connector-uid=");
      continue;
    }

    if (arg === "--connector-uid") {
      index += 1;
      parsed.connectorUid = requireNextValue(args[index], arg);
      continue;
    }

    if (arg.startsWith("--auth-url=")) {
      parsed.authUrl = readFlagValue(arg, "--auth-url=");
      continue;
    }

    if (arg === "--auth-url") {
      index += 1;
      parsed.authUrl = requireNextValue(args[index], arg);
      continue;
    }

    if (arg.startsWith("--production-url=")) {
      parsed.productionUrl = readFlagValue(arg, "--production-url=");
      continue;
    }

    if (arg === "--production-url") {
      index += 1;
      parsed.productionUrl = requireNextValue(args[index], arg);
      continue;
    }

    if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }

    if (parsed.appName) {
      console.error(`Unexpected argument: ${arg}`);
      process.exit(1);
    }

    parsed.appName = arg;
  }

  return parsed;
}

function readFlagValue(arg, prefix) {
  const value = arg.slice(prefix.length).trim();

  if (!value) {
    console.error(`${prefix.slice(0, -1)} requires a value.`);
    process.exit(1);
  }

  return value;
}

function requireNextValue(value, flag) {
  if (!value || value.startsWith("-")) {
    console.error(`${flag} requires a value.`);
    process.exit(1);
  }

  return value.trim();
}

function getDevPort(packageJson) {
  const devScript = packageJson.scripts?.dev;

  if (typeof devScript !== "string") {
    return undefined;
  }

  const match = devScript.match(/(?:--port(?:=|\s+)|-p\s+)(\d+)/);
  return match ? Number(match[1]) : undefined;
}

function buildSetupMarkdown({
  appName,
  appPath,
  appTitle,
  authUrl,
  connectorUid,
  localUrl,
  packageName,
  productionUrl,
}) {
  return `# ${appTitle} Slack Connect Setup

Generated by \`pnpm new:slack-app ${appName}\`.

Use this checklist after the app exists locally and before the first production
deploy. The general runbook lives in
[\`docs/slack-vercel-connect-app.md\`](../../docs/slack-vercel-connect-app.md).

## App Facts

| Item | Value |
| --- | --- |
| App path | \`${appPath}\` |
| Package | \`${packageName}\` |
| Local URL | \`${localUrl}\` |
| Production URL | \`${productionUrl}\` |
| Vanta Auth URL | \`${authUrl}\` |
| Slack connector UID | \`${connectorUid}\` |

## 1. Create The Vercel Project

Create one Vercel Project for this app.

- Framework Preset: \`Next.js\`
- Root Directory: \`${appPath}\`
- Build Command: detected default or \`pnpm build\`
- Output Directory: leave unset

Do not set Output Directory to \`public\`; this app builds to \`.next\`.

## 2. Register This App With Vanta Auth

Open the centralized auth app at \`${authUrl}\` and register a client for
\`${appTitle}\`.

Registration is self-serve for auth admins. If you are not listed in the auth
app's \`VANTA_AUTH_ADMIN_EMAILS\`, ask any current auth admin for
\`vanta-internal-auth\` to register this client or add you as an admin. The
reusable guide lives in
[\`docs/register-vanta-auth-client.md\`](../../docs/register-vanta-auth-client.md).

Use these redirect URIs:

\`\`\`txt
${localUrl}/api/auth/callback
${productionUrl}/api/auth/callback
\`\`\`

Copy the generated client id and one-time client secret into this app's local
and Vercel environment variables.

## 3. Create Or Attach The Slack Connector

Create or choose the Vercel Connect Slack connection with this connector UID:

\`\`\`txt
${connectorUid}
\`\`\`

Attach it to the Vercel Project for \`${appPath}\` and enable it for the
environments that should call Slack. Install or authorize the Slack connection
in the target Slack workspace.

The starter's read-only check only starts Slack user authorization. It does not
call \`getToken\`, Slack \`auth.test\`, or app-token authorization.

## 4. Configure Environment Variables

Add these to \`${appPath}/.env.local\` for local development and to the Vercel
Project for Preview and Production as appropriate:

\`\`\`txt
VANTA_AUTH_URL="${authUrl}"
VANTA_AUTH_CLIENT_ID="<id from Vanta Auth registration>"
VANTA_AUTH_CLIENT_SECRET="<secret shown once by Vanta Auth registration>"
AUTH_SECRET="<generate with openssl rand -base64 32>"
SLACK_CONNECTOR_UID="${connectorUid}"
\`\`\`

Mark \`VANTA_AUTH_CLIENT_SECRET\` and \`AUTH_SECRET\` as Sensitive in Vercel.
Do not prefix server-only secrets with \`NEXT_PUBLIC_\`.

## 5. Create The Local Environment File

Local environment variables are not sourced from Vercel in this repo. Create
\`${appPath}/.env.local\` manually from the approved source for this app's
secrets and environment-specific values.

At minimum, keep these values in local development:

\`\`\`txt
VANTA_AUTH_URL="${authUrl}"
VANTA_AUTH_CLIENT_ID="<id from Vanta Auth registration>"
VANTA_AUTH_CLIENT_SECRET="<secret shown once by Vanta Auth registration>"
AUTH_SECRET="<generate with openssl rand -base64 32>"
SLACK_CONNECTOR_UID="${connectorUid}"
\`\`\`

The starter also accepts Vercel-generated local env aliases named
\`VERCEL_CONNECT_SLACK_CONNECTOR\`.

If you use the Vercel CLI for project context, run only the project-linking
step from the app directory:

\`\`\`bash
cd ${appPath}
vercel link
\`\`\`

Keep \`.env.local\` out of git. When Vercel-specific runtime credentials are not
available locally, verify the Slack connector flow in a Vercel Preview
deployment after the project environment variables and connector attachment are
configured.

## 6. Run And Verify

From the repo root:

\`\`\`bash
pnpm dev --filter=${packageName}
\`\`\`

Then open:

\`\`\`txt
${localUrl}/slack-example
\`\`\`

Expected result:

- You can sign in through centralized Vanta Auth.
- The page shows the connector UID, subject type \`user\`, and signed-in app
  user subject id.
- Clicking Start authorization calls Vercel Connect \`startAuthorization\`.
- After authorization, Vercel Connect redirects back to \`/slack-example\` with
  callback metadata from Slack.

## 7. Use The Slack Authorization Route

Keep Slack authorization in route handlers or server actions.

\`\`\`ts
import { startAuthorization } from "@vercel/connect";

const { url } = await startAuthorization("${connectorUid}", {
  subject: { type: "user", id: session.user.id },
});
\`\`\`

Add \`getToken\` only later, in a separate code path, when the app is ready to
call the Slack Web API.
`;
}

function titleize(value) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function printUsage() {
  console.error(`Usage: pnpm new:slack-app <app-name> [options]

Creates a new app from apps/starter and writes an app-specific Slack/Vercel
Connect setup checklist.

Options:
  --connector-uid <uid>    Slack Vercel Connect connector UID.
                           Default: ${DEFAULT_CONNECTOR_UID}
  --auth-url <url>         Centralized Vanta Auth URL.
                           Default: ${DEFAULT_AUTH_URL}
  --production-url <url>   Expected production app URL.
                           Default: https://<app-name>.vercel.app
  --checklist-only         Write the checklist for an existing app.
  --force                  Replace an existing SLACK_CONNECT_SETUP.md.
  --help, -h               Show this help text.
`);
}
