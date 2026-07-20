#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const store = "/private/tmp/yeeflow-core-v1-rc-pnpm-store.2IAgzi";
const version = "1.0.0-rc.3";
const output = mkdtempSync(resolve(tmpdir(), "yeeflow-core-v1-rc2-oauth-"));
const workspace = resolve(output, "workspace");
const evidence = resolve(output, "candidate-evidence");
const candidateOutput = resolve(output, "candidate-output");

try {
  const boundary = originalBoundary();
  snapshot();
  mkdirSync(evidence, { recursive: true });
  mkdirSync(candidateOutput, { recursive: true });
  writeJson(resolve(evidence, "source-provenance.v1.0.0.json"), { version, store, boundary, allowlist: fileMap(workspace) });
  run("corepack", ["pnpm", "--version"], workspace);
  run("corepack", ["pnpm", "install", "--frozen-lockfile", "--offline", "--store-dir", store], workspace);
  const context = createCandidateBuildContext(boundary);
  alignVersions();
  const env = { ...process.env, YEEFLOW_CANDIDATE_CORE_VERSION: version, YEEFLOW_CANDIDATE_SOURCE_COMMIT: boundary.gitHead, YEEFLOW_CANDIDATE_SOURCE_TREE_STATE: "dirty-preserved" };
  run(resolve(workspace, "node_modules/.bin/tsc"), ["-b", "--pretty", "false"], workspace, env);
  run(process.execPath, ["scripts/test-workspace-skeleton.mjs"], workspace, env);
  run(process.execPath, ["scripts/validate-workspace-package-boundaries.mjs"], workspace, env);
  run(process.execPath, ["scripts/validate-dependency-boundaries.mjs"], workspace, env);
  run(process.execPath, ["scripts/build-core-distribution.mjs"], workspace, env);
  run(process.execPath, ["scripts/validate-core-distribution.mjs"], workspace, env);
  run(process.execPath, ["scripts/validate-core-extraction-core-v1-closure.mjs"], workspace, env);
  run(process.execPath, ["scripts/validate-phase-closure-proof-lineage.mjs"], workspace, env);
  for (const command of requiredCommands()) run(process.execPath, command.slice(1), workspace, env);
  run(process.execPath, ["scripts/test-yeeflow-oauth-auth.mjs"], workspace, env);
  run(process.execPath, ["scripts/test-yeeflow-oauth-on-demand-browser-login.mjs"], workspace, env);
  run(process.execPath, ["scripts/test-yeeflow-oauth-on-demand-browser-login-distribution.mjs"], workspace, env);
  const archive = resolve(candidateOutput, `yeeflow-app-builder-plugin-${version}.zip`);
  run(process.execPath, ["scripts/build-plugin-archive.mjs", "--output", archive], workspace, env);
  const manifest = {
    marker: "CORE_V1_RC3_OAUTH_READY_CANDIDATE_BUILT",
    version,
    archive: { path: archive, sha256: sha(readFileSync(archive)) },
    provenance: { store, pnpm: capture("corepack", ["pnpm", "--version"], workspace), lockfileSha256: sha(readFileSync(resolve(workspace, "pnpm-lock.yaml"))), boundary, candidateContext: context },
    oauth: { marker: "PLUGIN_YEEFLOW_OAUTH_SOURCE_DIST_ARCHIVE_INSTALLED_PARITY_PASSED", hostOnly: true, liveBrowserLogin: "not_run_requires_user_authorization" },
    nextPhase: "after-user-browser-oauth-login-codex-lite-disposable-install-live-e2e",
  };
  writeJson(resolve(evidence, "core-v1-rc2-oauth-ready-candidate-build-manifest.v1.0.0.json"), manifest);
  console.log(`CORE_V1_RC3_OAUTH_READY_CANDIDATE_BUILT ${archive} ${manifest.archive.sha256}`);
} catch (error) {
  mkdirSync(evidence, { recursive: true });
  writeJson(resolve(evidence, "core-v1-rc3-oauth-ready-candidate-blocker.v1.0.0.json"), { marker: "CORE_V1_RC3_OAUTH_READY_CANDIDATE_BLOCKED", version, workspace, error: String(error?.message || error) });
  console.error(String(error?.message || error));
  process.exitCode = 1;
}

function snapshot() {
  mkdirSync(workspace, { recursive: true });
  for (const item of [".env.example", ".gitignore", "README.md", "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json", "tsconfig.base.json", "packages", "runtimes", "adapters", "scripts", "compatibility", "docs", "schemas", "skills", "dist/yeeflow-app-builder-plugin", "validate-ywf-def.js", "workflow-action-config-validator.js", "workflow-action-configurations.normalized.json", "yeeflow-control-field-schema-utils.js", "yeeflow-expression-utils.js"]) {
    const source = resolve(root, item);
    if (!existsSync(source)) throw new Error(`RC2 snapshot input missing: ${item}`);
    cpSync(source, resolve(workspace, item), { recursive: true, filter: (path) => !/node_modules|\/\.git(?:\/|$)|(?:^|\/) [23](?:\.|\/|$)|yeeflow-app-builder-plugin-0\.9\.71\.zip/.test(path) });
  }
}

function alignVersions() {
  const rootPackage = resolve(workspace, "package.json");
  const rootJson = readJson(rootPackage);
  rootJson.version = version;
  writeJson(rootPackage, rootJson);
  const pluginManifest = resolve(workspace, "dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json");
  const plugin = readJson(pluginManifest); plugin.version = version; writeJson(pluginManifest, plugin);
  const contractFile = resolve(workspace, "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
  const contract = readJson(contractFile);
  for (const artifact of contract.approvedArtifacts || []) artifact.packageVersion = version;
  writeJson(contractFile, contract);
}

function createCandidateBuildContext(boundary) {
  const context = { schemaVersion: "1.0.0", candidateId: `yeeflow-app-builder-plugin-${version}`, candidateVersion: version, sourceProvenance: { gitHead: boundary.gitHead }, sourceTreeState: "dirty-preserved", expectedCoreDistributionProvenance: { coreVersion: version, artifactSchemaVersion: "v0.1.0" } };
  writeJson(resolve(workspace, ".yeeflow-candidate-build-context.json"), context);
  return context;
}

function requiredCommands() {
  const matrix = readJson(resolve(workspace, "compatibility/capability-manifests/core-v1-rc-application-e2e-coverage-matrix.v1.0.0.json"));
  return matrix.surfaces.flatMap((surface) => surface.requiredCommands || []).map((text) => text.trim().split(/\s+/u));
}
function packageFiles(directory) { const out = []; for (const name of readdirSync(directory)) { const file = resolve(directory, name); const stat = statSync(file); if (stat.isDirectory() && name !== "node_modules" && !name.startsWith(".")) out.push(...packageFiles(file)); else if (name === "package.json") out.push(file); } return out; }
function fileMap(directory) { const out = {}; for (const name of readdirSync(directory)) { const file = resolve(directory, name); const stat = statSync(file); if (stat.isDirectory()) Object.assign(out, fileMap(file)); else out[relative(directory === workspace ? workspace : workspace, file)] = sha(readFileSync(file)); } return out; }
function originalBoundary() { return { gitHead: capture("git", ["rev-parse", "HEAD"], root), gitTag: capture("git", ["describe", "--tags", "--exact-match"], root), historicalZipSha256: sha(readFileSync(resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip"))), activePluginManifestSha256: sha(readFileSync("/Users/rengerhu/.codex/.tmp/marketplaces/yeeflow/dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json")) }; }
function run(command, args, cwd, env = process.env) { execFileSync(command, args, { cwd, env, stdio: "inherit" }); }
function capture(command, args, cwd) { return execFileSync(command, args, { cwd, encoding: "utf8" }).trim(); }
function readJson(file) { return JSON.parse(readFileSync(file, "utf8")); }
function writeJson(file, value) { writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
