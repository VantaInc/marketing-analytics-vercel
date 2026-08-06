import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, relative, sep } from "node:path";

const appName = process.argv[2];

if (!appName) {
  console.error("Usage: pnpm new:app <app-name>");
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(appName)) {
  console.error("App names must use lowercase letters, numbers, and hyphens.");
  process.exit(1);
}

const repoRoot = process.cwd();
const source = join(repoRoot, "apps", "starter");
const target = join(repoRoot, "apps", appName);
const appPath = `apps/${appName}`;
const packageName = `@vanta/${appName}`;
const appTitle = titleize(appName);
const ignoredCopySegments = new Set([
  ".next",
  ".turbo",
  ".vercel",
  "dist",
  "node_modules",
  "out",
]);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function getDevPort(packageJson) {
  const devScript = packageJson.scripts?.dev;

  if (typeof devScript !== "string") {
    return undefined;
  }

  const match = devScript.match(/(?:--port(?:=|\s+)|-p\s+)(\d+)/);
  return match ? Number(match[1]) : undefined;
}

function getNextAvailablePort() {
  const appsRoot = join(repoRoot, "apps");
  const usedPorts = new Set();

  for (const entry of readdirSync(appsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageJsonPath = join(appsRoot, entry.name, "package.json");

    if (!existsSync(packageJsonPath)) {
      continue;
    }

    const devPort = getDevPort(readJson(packageJsonPath));

    if (devPort) {
      usedPorts.add(devPort);
    }
  }

  let port = 3000;
  while (usedPorts.has(port)) {
    port += 1;
  }

  return port;
}

function shouldCopyStarterPath(path) {
  const relativePath = relative(source, path);

  if (!relativePath) {
    return true;
  }

  return !relativePath
    .split(sep)
    .some((segment) => ignoredCopySegments.has(segment));
}

if (existsSync(target)) {
  console.error(`apps/${appName} already exists.`);
  process.exit(1);
}

cpSync(source, target, {
  recursive: true,
  filter: shouldCopyStarterPath,
});

const packageJsonPath = join(target, "package.json");
const packageJson = readJson(packageJsonPath);
const devPort = getNextAvailablePort();
packageJson.name = packageName;
packageJson.scripts.dev = `next dev --turbopack --port ${devPort}`;
writeFileSync(
  `${packageJsonPath}`,
  `${JSON.stringify(packageJson, null, 2)}\n`,
);

const rewriteFiles = [
  join(target, "README.md"),
  join(target, "src", "app", "actions.ts"),
  join(target, "src", "app", "layout.tsx"),
  join(target, "src", "app", "page.tsx"),
  join(target, "src", "app", "api", "health", "route.ts"),
];

for (const file of rewriteFiles) {
  const value = readFileSync(file, "utf8")
    .replaceAll("Internal App Starter", appTitle)
    .replaceAll("@vanta/starter", packageName)
    .replaceAll("apps/starter", appPath)
    .replaceAll("localhost:3000", `localhost:${devPort}`);
  writeFileSync(file, value);
}

const created = readdirSync(target).length;
console.log(
  `Created apps/${appName} from apps/starter (${created} entries, dev port ${devPort}).`,
);

function titleize(value) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
