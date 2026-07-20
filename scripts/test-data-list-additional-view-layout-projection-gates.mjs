#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-data-list-additional-view-layout-internal-shadow.mjs");
const source = resolve(root, "packages/app-builder-core-materializer/src/internal/data-list-additional-view-layout-projection.ts");
const index = resolve(root, "packages/app-builder-core-materializer/src/index.ts");
const publicContract = resolve(root, "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json");
const distributionContract = resolve(root, "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json");
const distributionManifest = resolve(root, "dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-additional-layout-shadow-gates-"));

try {
  assert.equal(run({}).status, 0, "The valid additional-view internal shadow must pass the guard.");
  negative("uuid", "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CORE_UUID_FORBIDDEN", { sourceAppend: "\nvoid crypto.randomUUID();\n" });
  negative("findings", "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CORE_FINDINGS_MUTATION_FORBIDDEN", { sourceAppend: "\nconst findings = []; findings.push(\"forbidden\");\n" });
  negative("template", "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CORE_TEMPLATE_MUTATION_FORBIDDEN", { sourceAppend: "\nconst templateSnapshot = {}; templateSnapshot.changed = true;\n" });
  negative("host-lowering", "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CORE_HOST_LOWERING_FORBIDDEN", { sourceAppend: "\nconst lowerFixedFilterProjectionAtHost = null; void lowerFixedFilterProjectionAtHost;\n" });
  negative("host-identity", "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_HOST_IDENTITY_FORBIDDEN", { sourceAppend: "\ntype ForbiddenInput = { LayoutID: string };\n" });
  negative("public-index", "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_EXPORT_FORBIDDEN", { indexAppend: "\nexport { projectDataListAdditionalViewLayoutInternal } from \"./internal/data-list-additional-view-layout-projection.js\";\n" });
  negative("distribution", "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_DIST_EXPORT_FORBIDDEN", { distributionContractMutation: (value) => ({ ...value, approvedArtifacts: value.approvedArtifacts.map((artifact) => artifact.packageName === "@yeeflow/app-builder-core-materializer" ? { ...artifact, exports: [...artifact.exports, "projectDataListAdditionalViewLayoutInternal"] } : artifact) }) });
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_NEGATIVE_GATES_PASSED cases=7");
} finally { rmSync(temporary, { recursive: true, force: true }); }

function negative(id, code, mutation) { const paths = fixture(id); if (mutation.sourceAppend) writeFileSync(paths.source, `${readFileSync(paths.source, "utf8")}${mutation.sourceAppend}`, "utf8"); if (mutation.indexAppend) writeFileSync(paths.index, `${readFileSync(paths.index, "utf8")}${mutation.indexAppend}`, "utf8"); if (mutation.distributionContractMutation) writeFileSync(paths.distributionContract, `${JSON.stringify(mutation.distributionContractMutation(JSON.parse(readFileSync(paths.distributionContract, "utf8"))), null, 2)}\n`, "utf8"); const result = run(paths); assert.notEqual(result.status, 0, `${id} must fail.`); assert.match(result.output, new RegExp(code), `${id} must emit ${code}.`); }
function fixture(id) { const paths = { source: resolve(temporary, `${id}.ts`), index: resolve(temporary, `${id}.index.ts`), publicContract: resolve(temporary, `${id}.public.json`), distributionContract: resolve(temporary, `${id}.distribution.json`), distributionManifest: resolve(temporary, `${id}.manifest.json`) }; for (const [key, path] of Object.entries(paths)) cpSync({ source, index, publicContract, distributionContract, distributionManifest }[key], path); return paths; }
function run({ source: sourcePath = source, index: indexPath = index, publicContract: publicContractPath = publicContract, distributionContract: distributionContractPath = distributionContract, distributionManifest: distributionManifestPath = distributionManifest }) { const result = spawnSync(process.execPath, [validator, "--source", sourcePath, "--public-index", indexPath, "--public-contract", publicContractPath, "--distribution-contract", distributionContractPath, "--distribution-manifest", distributionManifestPath], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout || ""}${result.stderr || ""}` }; }
