import type { NextConfig } from "next";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(appDir, "../..");
const packagesRoot = join(repoRoot, "packages");

function referencesSourceExport(value: unknown): boolean {
  if (typeof value === "string") {
    return value.startsWith("./src");
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  return Object.values(value).some(referencesSourceExport);
}

function getSourcePackageNames(): string[] {
  if (!existsSync(packagesRoot)) {
    return [];
  }

  return readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const packageJsonPath = join(packagesRoot, entry.name, "package.json");

      if (!existsSync(packageJsonPath)) {
        return [];
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
        exports?: unknown;
        name?: unknown;
      };

      if (
        typeof packageJson.name !== "string" ||
        !referencesSourceExport(packageJson.exports)
      ) {
        return [];
      }

      return [packageJson.name];
    });
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: getSourcePackageNames(),
};

export default nextConfig;
