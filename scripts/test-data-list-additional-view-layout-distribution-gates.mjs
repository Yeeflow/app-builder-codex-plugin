#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const core = resolve(root, "dist/yeeflow-app-builder-plugin/core");
const validator = resolve(root, "scripts/validate-core-distribution.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-additional-layout-gates-"));
try {
  test("missing-export", (directory) => mutateArtifact(directory, (text) => text.replace("export function projectDataListAdditionalViewLayout", "function projectDataListAdditionalViewLayout")), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  test("internal-export", (directory) => mutateArtifact(directory, (text) => `${text}\nexport const projectDataListAdditionalViewLayoutInternal = null;`), "CORE_DISTRIBUTION_EXPORT_UNRESOLVED");
  test("workspace-leak", (directory) => mutateArtifact(directory, (text) => `${text}\nimport \"@yeeflow/workspace-leak\";`), "CORE_DISTRIBUTION_WORKSPACE_LEAKAGE");
  test("source-map", (directory) => mutateArtifact(directory, (text) => `${text}\n//# sourceMappingURL=additional.map`), "CORE_DISTRIBUTION_WORKSPACE_LEAKAGE");
  console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_DISTRIBUTION_GATES_PASSED cases=4");
} finally { rmSync(temporary, { recursive: true, force: true }); }
function test(id, mutate, code) { const directory = resolve(temporary, id); cpSync(core, directory, { recursive: true }); mutate(directory); const result = spawnSync(process.execPath, [validator, directory], { cwd: root, encoding: "utf8" }); assert.notEqual(result.status, 0, `${id} must fail`); assert.match(`${result.stdout}${result.stderr}`, new RegExp(code)); }
function mutateArtifact(directory, change) { const file = resolve(directory, "yeeflow-app-builder-core-materializer.v0.1.0.mjs"); const text = change(readFileSync(file, "utf8")); writeFileSync(file, text, "utf8"); const manifestPath = resolve(directory, "yeeflow-app-builder-core-distribution.v0.1.0.json"); const manifest = JSON.parse(readFileSync(manifestPath, "utf8")); const artifact = manifest.artifacts.find((item) => item.path === "core/yeeflow-app-builder-core-materializer.v0.1.0.mjs"); artifact.sha256 = createHash("sha256").update(text).digest("hex"); manifest.artifactSha256 = manifest.artifacts[0].sha256; writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8"); }
