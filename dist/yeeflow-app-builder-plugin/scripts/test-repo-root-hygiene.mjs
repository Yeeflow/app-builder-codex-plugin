#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT_ALLOWLIST = new Set([
  ".env.example",
  ".gitignore",
  "CHANGELOG.md",
  "README.md",
  "apply-ywf-metadata.js",
  "build-yap-wrapper.js",
  "build-ydl-wrapper.js",
  "build-ywf-wrapper.js",
  "control-configurations.normalized.json",
  "decode-yap-resource.js",
  "extract-yap-metadata.js",
  "extract-ydl-metadata.js",
  "field-configurations.normalized.json",
  "inspect-dashboard-pages.js",
  "inspect-yap-package.js",
  "inspect-ydl-package.js",
  "normalize-yeeflow-control-field-configs.mjs",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  "tsconfig.json",
  "validate-yap-graph.js",
  "validate-yap-package.js",
  "validate-yapk-package.js",
  "validate-ydl-against-yap.js",
  "validate-ydl-list.js",
  "validate-ywf-def-against-yap.js",
  "validate-ywf-def.js",
  "workflow-action-config-validator.js",
  "workflow-action-configurations.normalized.json",
  "yeeflow-control-field-schema-utils.js",
  "yeeflow-expression-function-knowledge-base.normalized.json",
  "yeeflow-expression-functions.normalized.json",
  "yeeflow-expression-operators.normalized.json",
  "yeeflow-expression-utils.js",
  "yeeflow-yapk-schema-standard-summary.json",
]);

const DIST_ROOT_ALLOWLIST = new Set([
  ".env.example",
  "CHANGELOG.md",
  "README.md",
  "control-configurations.normalized.json",
  "field-configurations.normalized.json",
  "inspect-yap-package.js",
  "validate-yap-graph.js",
  "validate-yap-package.js",
  "validate-yapk-package.js",
  "validate-ydl-list.js",
  "validate-ywf-def-against-yap.js",
  "validate-ywf-def.js",
  "workflow-action-config-validator.js",
  "workflow-action-configurations.normalized.json",
  "yeeflow-control-field-schema-utils.js",
  "yeeflow-expression-function-knowledge-base.normalized.json",
  "yeeflow-expression-functions.normalized.json",
  "yeeflow-expression-operators.normalized.json",
  "yeeflow-expression-utils.js",
  "yeeflow-yapk-schema-standard-summary.json",
]);

function gitLsFiles() {
  const result = spawnSync("git", ["ls-files"], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || "git ls-files failed");
  }
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function gitUntrackedFiles() {
  const result = spawnSync("git", ["status", "--porcelain", "-z", "--untracked-files=all"], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || "git status failed");
  }
  return result.stdout
    .split("\0")
    .filter(Boolean)
    .filter((record) => record.startsWith("?? "))
    .map((record) => record.slice(3));
}

function isGitCheckout() {
  const result = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { encoding: "utf8" });
  return result.status === 0 && result.stdout.trim() === "true";
}

function listFilesFromDisk(root = ".") {
  const files = [];
  const skipDirs = new Set([".git", "node_modules"]);
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skipDirs.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(root, fullPath).split(path.sep).join("/");
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(relPath);
      }
    }
  }
  walk(root);
  return files.sort();
}

function isDeprecatedRootArtifact(fileName) {
  return (
    /^generate-/.test(fileName) ||
    /-test-plan\.md$/.test(fileName) ||
    /-test-spec\.json$/.test(fileName) ||
    /runtime-coverage\.json$/.test(fileName) ||
    /validate-graph.*\.md$/.test(fileName) ||
    /ui-refresh-plan\.md$/.test(fileName) ||
    /app-plan\.md$/.test(fileName)
  );
}

function isDuplicateCopyArtifact(file) {
  return /(^|\/)[^/]* [2-9]\d*(?:\.[^/.]+)?$/.test(file);
}

const gitCheckout = isGitCheckout();
const files = gitCheckout ? gitLsFiles() : listFilesFromDisk(".");
const untrackedFiles = gitCheckout ? gitUntrackedFiles() : [];
const findings = [];
const sourceRootFiles = files.filter((file) => !file.includes("/"));
const distRootFiles = files
  .filter((file) => file.startsWith("dist/yeeflow-app-builder-plugin/"))
  .filter((file) => file.split("/").length === 3)
  .map((file) => path.basename(file));

for (const file of sourceRootFiles) {
  if (!ROOT_ALLOWLIST.has(file)) {
    findings.push({
      code: "ROOT_FILE_NOT_ALLOWLISTED",
      message: "Repository root should only contain documentation, compatibility CLI entrypoints, and root-level compatibility data.",
      file,
    });
  }
  if (isDeprecatedRootArtifact(file)) {
    findings.push({
      code: "ROOT_HISTORICAL_ARTIFACT_FORBIDDEN",
      message: "Historical generators, runtime proof plans, specs, and studies must live under tools/, docs/, or fixtures/ instead of repository root.",
      file,
    });
  }
}

for (const file of distRootFiles) {
  if (!DIST_ROOT_ALLOWLIST.has(file)) {
    findings.push({
      code: "DIST_ROOT_FILE_NOT_ALLOWLISTED",
      message: "Plugin dist root should only contain compatibility entrypoints and required runtime reference data.",
      file: `dist/yeeflow-app-builder-plugin/${file}`,
    });
  }
  if (isDeprecatedRootArtifact(file)) {
    findings.push({
      code: "DIST_ROOT_HISTORICAL_ARTIFACT_FORBIDDEN",
      message: "Historical generators and runtime proof artifacts must not sit at plugin dist root.",
      file: `dist/yeeflow-app-builder-plugin/${file}`,
    });
  }
}

for (const file of files.filter(isDuplicateCopyArtifact)) {
  findings.push({
    code: "TRACKED_DUPLICATE_COPY_ARTIFACT",
    message: "Tracked Finder/copy-style duplicate artifacts such as `name 2.ext` or `name 3.ext` must be renamed deliberately or removed.",
    file,
  });
}

for (const file of untrackedFiles.filter(isDuplicateCopyArtifact)) {
  findings.push({
    code: "UNTRACKED_DUPLICATE_COPY_ARTIFACT",
    message: "Untracked Finder/copy-style duplicate artifacts such as `name 2.ext` or `name 3.ext` must be cleaned before release packaging or cache smoke.",
    file,
  });
}

const requiredDirs = [
  "tools/generators",
];

if (gitCheckout) {
  requiredDirs.push("docs/studies/root-runtime-proofs");
  requiredDirs.push("fixtures/runtime-test-specs");
  requiredDirs.push("dist/yeeflow-app-builder-plugin/tools/generators");
}

for (const dir of requiredDirs) {
  const hasTrackedFile = files.some((file) => file.startsWith(`${dir}/`));
  if (!hasTrackedFile) {
    findings.push({
      code: "ROOT_HYGIENE_DIRECTORY_EMPTY",
      message: "Expected repository organization directory has no tracked files.",
      directory: dir,
    });
  }
}

const report = {
  status: findings.length ? "fail" : "pass",
  mode: gitCheckout ? "source-checkout" : "installed-cache-root",
  sourceRootFileCount: sourceRootFiles.length,
  distRootFileCount: distRootFiles.length,
  trackedDuplicateCopyCount: files.filter(isDuplicateCopyArtifact).length,
  untrackedDuplicateCopyCount: untrackedFiles.filter(isDuplicateCopyArtifact).length,
  findings,
};

console.log(JSON.stringify(report, null, 2));
process.exit(findings.length ? 1 : 0);
