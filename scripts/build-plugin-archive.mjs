#!/usr/bin/env node

import { existsSync, rmSync, readFileSync, mkdtempSync, mkdirSync, copyFileSync, lstatSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CORE_DISTRIBUTION_COMPATIBILITY_VERSION = "1.0.0";
const index = process.argv.indexOf("--output");
const trackedOnly = process.argv.includes("--tracked-only");
if (index < 0 || !process.argv[index + 1]) throw new Error("CORE_DISTRIBUTION_ARTIFACT_MISSING: --output is required.");
const outputPath = resolve(root, process.argv[index + 1]);
if (process.env.YEEFLOW_CANDIDATE_CORE_VERSION && process.env.YEEFLOW_CANDIDATE_CORE_VERSION !== CORE_DISTRIBUTION_COMPATIBILITY_VERSION) {
  throw new Error(`PLUGIN_ARCHIVE_CORE_VERSION_CONFLICT: expected ${CORE_DISTRIBUTION_COMPATIBILITY_VERSION}.`);
}
if (!trackedOnly) {
  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], {
    cwd: root,
    env: { ...process.env, YEEFLOW_CANDIDATE_CORE_VERSION: CORE_DISTRIBUTION_COMPATIBILITY_VERSION },
    stdio: "inherit",
  });
  execFileSync(process.execPath, [resolve(root, "scripts/build-execution-service-distribution.mjs")], { cwd: root, stdio: "inherit" });
}
// Package tracked payload files plus explicitly reviewed local additions only.
const distRoot = resolve(root, "dist/yeeflow-app-builder-plugin");
const tracked = execFileSync("git", ["ls-files", "-z", "--", "dist/yeeflow-app-builder-plugin"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
const manifest = JSON.parse(readFileSync(resolve(root, "docs/standards/product-14.5/distribution-files.json"), "utf8"));
const files = new Set([...tracked.map(file => relative(distRoot, resolve(root, file))), ...manifest.mirrors.map(entry => entry.destination)]);
const stage = mkdtempSync(resolve(tmpdir(), "yeeflow-plugin-archive-"));
try {
  for (const file of [...files].sort()) {
    if (file.startsWith("..") || file.startsWith("/") || /(?:^|\/)\.env$|(?:^|\/)node_modules\/| [2-9]\./.test(file)) throw new Error(`PLUGIN_ARCHIVE_PATH_REJECTED: ${file}`);
    const input = resolve(distRoot, file);
    if (relative(distRoot, input).startsWith("..")) throw new Error(`PLUGIN_ARCHIVE_PATH_REJECTED: ${file}`);
    if (!lstatSync(input).isFile()) throw new Error(`PLUGIN_ARCHIVE_FILE_INVALID: ${file}`);
    const destination = resolve(stage, "yeeflow-app-builder-plugin", file);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(input, destination);
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  rmSync(outputPath, { force: true });
  execFileSync("zip", ["-qr", outputPath, "yeeflow-app-builder-plugin"], { cwd: stage });
} finally {
  rmSync(stage, { recursive: true, force: true });
}
if (!existsSync(outputPath)) throw new Error("CORE_DISTRIBUTION_ARTIFACT_MISSING");
console.log(`PLUGIN_ARCHIVE_BUILT ${outputPath} trackedOnly=${trackedOnly}`);
