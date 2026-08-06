import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { extname, join } from "node:path";

const appName = process.argv[2];

if (!appName) {
  console.error("Usage: pnpm rename:starter <app-name>");
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(appName)) {
  console.error("App names must use lowercase letters, numbers, and hyphens.");
  process.exit(1);
}

const repoRoot = process.cwd();
const source = join(repoRoot, "apps", "starter");
const target = join(repoRoot, "apps", appName);
const packageName = `@vanta/${appName}`;
const appPath = `apps/${appName}`;
const appTitle = titleize(appName);
const textExtensions = new Set([
  ".css",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

if (!existsSync(source)) {
  console.error("apps/starter does not exist.");
  process.exit(1);
}

if (existsSync(target)) {
  console.error(`${appPath} already exists.`);
  process.exit(1);
}

renameSync(source, target);

const packageJsonPath = join(target, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
packageJson.name = packageName;
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

rewriteTextFiles(target);

console.log(`Renamed apps/starter to ${appPath}.`);

function rewriteTextFiles(path) {
  for (const entry of readdirSync(path)) {
    const entryPath = join(path, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      rewriteTextFiles(entryPath);
      continue;
    }

    if (!textExtensions.has(extname(entryPath))) {
      continue;
    }

    const value = readFileSync(entryPath, "utf8")
      .replaceAll("@vanta/starter", packageName)
      .replaceAll("apps/starter", appPath)
      .replaceAll("Internal App Starter", appTitle);

    writeFileSync(entryPath, value);
  }
}

function titleize(value) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
