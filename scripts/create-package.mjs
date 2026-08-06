import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const packageName = process.argv[2];

if (!packageName) {
  console.error("Usage: pnpm new:package <package-name>");
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(packageName)) {
  console.error(
    "Package names must use lowercase letters, numbers, and hyphens.",
  );
  process.exit(1);
}

const repoRoot = process.cwd();
const target = join(repoRoot, "packages", packageName);

if (existsSync(target)) {
  console.error(`packages/${packageName} already exists.`);
  process.exit(1);
}

mkdirSync(join(target, "src"), { recursive: true });

writeFileSync(
  join(target, "package.json"),
  `${JSON.stringify(
    {
      name: `@vanta/${packageName}`,
      version: "0.1.0",
      private: true,
      type: "module",
      exports: {
        ".": "./src/index.ts",
      },
      scripts: {
        build: "tsc --noEmit",
        lint: "eslint .",
        typecheck: "tsc --noEmit",
      },
      devDependencies: {
        "@vanta/eslint-config": "workspace:*",
        "@vanta/typescript-config": "workspace:*",
        "@types/node": "^22.15.0",
        eslint: "^9.28.0",
        typescript: "^5.9.0",
      },
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  join(target, "tsconfig.json"),
  `${JSON.stringify(
    {
      extends: "@vanta/typescript-config/base.json",
      include: ["src"],
      exclude: ["node_modules", "dist"],
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  join(target, "eslint.config.mjs"),
  'import config from "@vanta/eslint-config/base";\n\nexport default config;\n',
);

writeFileSync(
  join(target, "src", "index.ts"),
  `export const packageName = "${packageName}";\n`,
);

console.log(`Created packages/${packageName}.`);
