#!/usr/bin/env node

import { existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const index = process.argv.indexOf("--output");
if (index < 0 || !process.argv[index + 1]) throw new Error("CORE_DISTRIBUTION_ARTIFACT_MISSING: --output is required.");
const outputPath = resolve(root, process.argv[index + 1]);
execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
rmSync(outputPath, { force: true });
execFileSync("zip", ["-qr", outputPath, "yeeflow-app-builder-plugin"], { cwd: resolve(root, "dist") });
if (!existsSync(outputPath)) throw new Error("CORE_DISTRIBUTION_ARTIFACT_MISSING");
console.log(`PLUGIN_ARCHIVE_BUILT ${outputPath}`);
