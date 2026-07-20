#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-data-list-default-view-layout-internal-shadow.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-layoutview-shadow-gates-"));
const source = resolve(root, "packages/app-builder-core-materializer/src/internal/data-list-default-view-layout-projection.ts");
const index = resolve(root, "packages/app-builder-core-materializer/src/index.ts");
const publicContract = resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const distributionContract = resolve(root, "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const distributionManifest = resolve(root, "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");

try {
  assert.equal(run({}).status, 0, "The valid internal LayoutView shadow must pass the guard.");
  runNegative("uuid", { sourceAppend: "\nvoid crypto.randomUUID();\n" }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_CORE_UUID_FORBIDDEN");
  runNegative("findings", { sourceAppend: "\nconst findings = []; findings.push(\"forbidden\");\n" }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_CORE_FINDINGS_MUTATION_FORBIDDEN");
  runNegative("template", { sourceAppend: "\nconst templateSnapshot = {}; templateSnapshot.changed = true;\n" }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_CORE_TEMPLATE_MUTATION_FORBIDDEN");
  runNegative("host-lowering", { sourceAppend: "\nconst lowerFixedFilterProjectionAtHost = null; void lowerFixedFilterProjectionAtHost;\n" }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_CORE_HOST_LOWERING_FORBIDDEN");
  runNegative("public-index", { indexAppend: "\nexport { projectDataListDefaultViewLayoutInternal } from \"./internal/data-list-default-view-layout-projection.js\";\n" }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_EXPORT_FORBIDDEN");
  runNegative("public-contract", { publicContractMutation: (value) => ({ ...value, runtimeExports: [...value.runtimeExports, "projectDataListDefaultViewLayoutInternal"] }) }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_CONTRACT_FORBIDDEN");
  runNegative("distribution-contract", { distributionContractMutation: (value) => ({ ...value, approvedArtifacts: value.approvedArtifacts.map((artifact) => artifact.packageName === "@yeeflow/app-builder-core-materializer" ? { ...artifact, exports: [...artifact.exports, "projectDataListDefaultViewLayoutInternal"] } : artifact) }) }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_DIST_EXPORT_FORBIDDEN");
  runNegative("distribution-artifact", { distributionManifestMutation: (value) => ({ ...value, artifacts: value.artifacts.map((artifact) => artifact.packageName === "@yeeflow/app-builder-core-materializer" ? { ...artifact, exports: [...artifact.exports, "projectDataListDefaultViewLayoutInternal"] } : artifact) }) }, "DATA_LIST_DEFAULT_VIEW_LAYOUT_DIST_ARTIFACT_EXPORT_FORBIDDEN");
  console.log("DATA_LIST_DEFAULT_VIEW_LAYOUT_NEGATIVE_GATES_PASSED cases=8");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function runNegative(id, mutation, code) {
  const sourcePath = resolve(temporary, `${id}.ts`);
  const indexPath = resolve(temporary, `${id}.index.ts`);
  const publicContractPath = resolve(temporary, `${id}.public.json`);
  const distributionContractPath = resolve(temporary, `${id}.distribution.json`);
  const distributionManifestPath = resolve(temporary, `${id}.manifest.json`);
  cpSync(source, sourcePath);
  cpSync(index, indexPath);
  cpSync(publicContract, publicContractPath);
  cpSync(distributionContract, distributionContractPath);
  cpSync(distributionManifest, distributionManifestPath);
  if (mutation.sourceAppend) writeFileSync(sourcePath, `${readFileSync(sourcePath, "utf8")}${mutation.sourceAppend}`, "utf8");
  if (mutation.indexAppend) writeFileSync(indexPath, `${readFileSync(indexPath, "utf8")}${mutation.indexAppend}`, "utf8");
  if (mutation.publicContractMutation) writeFileSync(publicContractPath, `${JSON.stringify(mutation.publicContractMutation(JSON.parse(readFileSync(publicContractPath, "utf8"))), null, 2)}\n`, "utf8");
  if (mutation.distributionContractMutation) writeFileSync(distributionContractPath, `${JSON.stringify(mutation.distributionContractMutation(JSON.parse(readFileSync(distributionContractPath, "utf8"))), null, 2)}\n`, "utf8");
  if (mutation.distributionManifestMutation) writeFileSync(distributionManifestPath, `${JSON.stringify(mutation.distributionManifestMutation(JSON.parse(readFileSync(distributionManifestPath, "utf8"))), null, 2)}\n`, "utf8");
  const result = run({ sourcePath, indexPath, publicContractPath, distributionContractPath, distributionManifestPath });
  assert.notEqual(result.status, 0, `${id} must fail the real validator.`);
  assert.match(result.output, new RegExp(code), `${id} must report ${code}.`);
}

function run({ sourcePath = source, indexPath = index, publicContractPath = publicContract, distributionContractPath = distributionContract, distributionManifestPath = distributionManifest }) {
  const result = spawnSync(process.execPath, [validator, "--source", sourcePath, "--public-index", indexPath, "--public-contract", publicContractPath, "--distribution-contract", distributionContractPath, "--distribution-manifest", distributionManifestPath], { cwd: root, encoding: "utf8" });
  return { status: result.status, output: `${result.stdout || ""}${result.stderr || ""}` };
}
