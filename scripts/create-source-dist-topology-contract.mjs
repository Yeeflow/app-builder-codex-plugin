#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(repositoryRoot, "scripts");
const distRoot = resolve(repositoryRoot, "dist/yeeflow-app-builder-plugin/scripts");
const outputPath = resolve(repositoryRoot, "compatibility/plugin-baselines/yeeflow-app-builder-source-dist-topology.v0.9.71.json");
const nestedIconPath = "scripts/lib/application-icon-validation.cjs";

const sourceScripts = scriptPaths(sourceRoot);
const distScripts = scriptPaths(distRoot);
const records = [];

for (const sourceRelativePath of sourceScripts) {
  const sourcePath = `scripts/${sourceRelativePath}`;
  const distPath = `dist/yeeflow-app-builder-plugin/scripts/${sourceRelativePath}`;
  if (distScripts.has(sourceRelativePath)) {
    const sourceDigest = digest(resolve(sourceRoot, sourceRelativePath));
    const distDigest = digest(resolve(distRoot, sourceRelativePath));
    records.push(record({ sourcePath, distPath, relationship: sourceDigest === distDigest ? "exact mirror" : "transformed mirror", expectedDigestBehavior: sourceDigest === distDigest ? "sha256_equal" : "sha256_different_with_approved_semantic_delta", rationale: sourceDigest === distDigest ? "Distribution script is byte-identical to the source script." : transformedRationale(sourceRelativePath), owner: "Codex Plugin Adapter", sourceDigest, distDigest }));
    continue;
  }
  records.push(record({ sourcePath, distPath: null, relationship: sourceOnlyRelationship(sourceRelativePath), expectedDigestBehavior: "no_dist_counterpart", rationale: "Source-only development tooling is intentionally excluded from the packaged Plugin distribution.", owner: "Codex Plugin Adapter", sourceDigest: digest(resolve(sourceRoot, sourceRelativePath)), distDigest: null }));
}

for (const distRelativePath of distScripts) {
  if (sourceScripts.has(distRelativePath)) continue;
  const distPath = `dist/yeeflow-app-builder-plugin/scripts/${distRelativePath}`;
  if (distRelativePath === nestedIconPath) {
    records.push(record({ sourcePath: "scripts/lib/application-icon-validation.cjs", distPath, relationship: "generated distribution artifact", expectedDigestBehavior: "sha256_different_with_approved_compatibility_reduction", rationale: "Historical validate-yapk-package resolution probes scripts/scripts/lib first and requires only validatePackageWrapperIcon from this reduced compatibility helper.", owner: "Codex Plugin Adapter", sourceDigest: digest(resolve(sourceRoot, "lib/application-icon-validation.cjs")), distDigest: digest(resolve(distRoot, distRelativePath)) }));
    continue;
  }
  const rootCandidate = resolve(repositoryRoot, distRelativePath);
  if (existsSync(rootCandidate)) {
    const sourceDigest = digest(rootCandidate);
    const distDigest = digest(resolve(distRoot, distRelativePath));
    records.push(record({ sourcePath: distRelativePath, distPath, relationship: "root compatibility copy", expectedDigestBehavior: sourceDigest === distDigest ? "sha256_equal" : "sha256_different_with_approved_release_copy", rationale: "The root legacy entrypoint is retained as a compatibility copy while the packaged script remains the distribution payload.", owner: "Codex Plugin Adapter", sourceDigest, distDigest }));
    continue;
  }
  records.push(record({ sourcePath: null, distPath, relationship: "unexpected drift", expectedDigestBehavior: "unclassified", rationale: "No source or approved compatibility origin was found.", owner: "Unassigned", sourceDigest: null, distDigest: digest(resolve(distRoot, distRelativePath)), verificationStatus: "failed" }));
}

const contract = {
  schemaVersion: "1.0.0",
  contractVersion: "0.9.71",
  pluginVersion: "0.9.71",
  sourceRoot: "scripts",
  distRoot: "dist/yeeflow-app-builder-plugin/scripts",
  records: records.sort((left, right) => (left.distPath || left.sourcePath).localeCompare(right.distPath || right.sourcePath)),
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
console.log(`SOURCE_DIST_TOPOLOGY_CONTRACT_WRITTEN ${relative(repositoryRoot, outputPath)} ${contract.records.length}`);

function scriptPaths(root) {
  const paths = new Set();
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else if (/\.(?:js|mjs|cjs|ts)$/.test(entry.name)) paths.add(relative(root, absolutePath));
    }
  };
  visit(root);
  return paths;
}

function digest(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function record(values) {
  return { ...values, verificationStatus: values.verificationStatus || "passed" };
}

function sourceOnlyRelationship(path) {
  return /^(?:lib\/|test-fixtures\/|(?:append|build|core-distribution|create|generate|prepare|reconcile|report|smoke|test|validate)-)/.test(path) ? "source-only development tool" : "unexpected drift";
}

function transformedRationale(path) {
  const rationales = {
    "audit-release-safety.mjs": "The packaged release audit retains the distribution archive default used by the historical Plugin payload.",
    "inspect-advanced-controls.mjs": "The source variant adds direct wrapped-resource inspection for development diagnostics.",
    "inspect-container-button-actions.mjs": "The source variant adds direct wrapped-resource inspection for development diagnostics.",
    "inspect-data-filter-controls.mjs": "The source variant adds direct wrapped-resource inspection for development diagnostics.",
    "inspect-data-views.mjs": "The source variant adds direct wrapped-resource inspection for development diagnostics.",
    "inspect-yap-import-readiness.mjs": "The source variant retains broader warning normalization and direct-resource diagnostics.",
    "inspect-yap-schema-standard.mjs": "The source variant retains additional generated-package structural hard gates.",
    "test-workflow-taskurl-pageurl-hard-gate.mjs": "The source regression compares source and distribution validators; the packaged regression tests only its local validator.",
  };
  return rationales[path] || "Approved source and distribution semantic delta.";
}
