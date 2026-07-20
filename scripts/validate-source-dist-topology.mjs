#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = resolve(repositoryRoot, argumentValue("--contract") || "compatibility/plugin-baselines/yeeflow-app-builder-source-dist-topology.v0.9.71.json");
const sourceRoot = resolve(repositoryRoot, "scripts");
const distRoot = resolve(repositoryRoot, "dist/yeeflow-app-builder-plugin/scripts");
const relationships = new Set(["exact mirror", "transformed mirror", "root compatibility copy", "source-only development tool", "generated distribution artifact", "unexpected drift"]);
const findings = [];

if (!existsSync(contractPath)) fail("SOURCE_DIST_TOPOLOGY_CONTRACT_MISSING", "Source/dist topology contract is missing.");
let contract;
try { contract = JSON.parse(readFileSync(contractPath, "utf8")); } catch (error) { fail("SOURCE_DIST_TOPOLOGY_CONTRACT_INVALID_JSON", `Source/dist topology contract cannot be parsed: ${error.message}`); }
const records = Array.isArray(contract.records) ? contract.records : [];
const expectedPairs = expectedTopologyPairs();
const actualKeys = new Set();

for (const item of records) {
  const key = `${item.sourcePath || "<none>"}|${item.distPath || "<none>"}`;
  if (actualKeys.has(key)) findings.push(finding("SOURCE_DIST_TOPOLOGY_RECORD_DUPLICATE", key, "Topology contract contains a duplicate source/dist record."));
  actualKeys.add(key);
  if (!relationships.has(item.relationship)) findings.push(finding("SOURCE_DIST_TOPOLOGY_RELATIONSHIP_INVALID", key, "Topology record has an unsupported relationship."));
  if (!item.rationale || !item.owner || !item.verificationStatus) findings.push(finding("SOURCE_DIST_TOPOLOGY_RECORD_INCOMPLETE", key, "Topology record must declare rationale, owner, and verificationStatus."));
  if (item.relationship === "unexpected drift" || item.verificationStatus !== "passed") findings.push(finding("SOURCE_DIST_TOPOLOGY_UNRESOLVED", key, "Topology contract contains an unresolved source/dist relationship."));
  verifyDigest(item, key);
}
for (const pair of expectedPairs) if (!actualKeys.has(pair.key)) findings.push(finding("SOURCE_DIST_TOPOLOGY_PATH_UNKNOWN", pair.key, "Source or distribution script has no topology contract record."));
for (const key of actualKeys) if (!expectedPairs.some((pair) => pair.key === key)) findings.push(finding("SOURCE_DIST_TOPOLOGY_RECORD_OUT_OF_SCOPE", key, "Topology contract record does not map to a current source/dist script relationship."));

if (findings.length > 0) { console.error(JSON.stringify({ status: "failed", findings }, null, 2)); process.exit(1); }
console.log(JSON.stringify({ status: "passed", code: "SOURCE_DIST_TOPOLOGY_VALID", recordCount: records.length, unknownRelationshipCount: 0 }, null, 2));

function expectedTopologyPairs() {
  const sourceScripts = scriptPaths(sourceRoot);
  const distScripts = scriptPaths(distRoot);
  const pairs = [];
  for (const sourceRelativePath of sourceScripts) pairs.push({ key: `scripts/${sourceRelativePath}|${distScripts.has(sourceRelativePath) ? `dist/yeeflow-app-builder-plugin/scripts/${sourceRelativePath}` : "<none>"}` });
  for (const distRelativePath of distScripts) {
    if (sourceScripts.has(distRelativePath)) continue;
    const sourcePath = distRelativePath === "scripts/lib/application-icon-validation.cjs" ? "scripts/lib/application-icon-validation.cjs" : existsSync(resolve(repositoryRoot, distRelativePath)) ? distRelativePath : "<none>";
    pairs.push({ key: `${sourcePath}|dist/yeeflow-app-builder-plugin/scripts/${distRelativePath}` });
  }
  return pairs;
}

function verifyDigest(item, key) {
  if (item.expectedDigestBehavior === "no_dist_counterpart") return;
  if (!item.sourcePath || !item.distPath) { findings.push(finding("SOURCE_DIST_TOPOLOGY_DIGEST_PATH_MISSING", key, "Digest behavior requires both sourcePath and distPath.")); return; }
  const sourcePath = resolve(repositoryRoot, item.sourcePath);
  const distPath = resolve(repositoryRoot, item.distPath);
  if (!existsSync(sourcePath) || !existsSync(distPath)) { findings.push(finding("SOURCE_DIST_TOPOLOGY_DIGEST_INPUT_MISSING", key, "Digest input path is missing.")); return; }
  const sourceDigest = digest(sourcePath);
  const distDigest = digest(distPath);
  if (item.sourceDigest !== sourceDigest || item.distDigest !== distDigest) findings.push(finding("SOURCE_DIST_TOPOLOGY_DIGEST_CHANGED", key, "Recorded SHA-256 digest does not match the current file."));
  if (item.expectedDigestBehavior === "sha256_equal" && sourceDigest !== distDigest) findings.push(finding("SOURCE_DIST_TOPOLOGY_EXACT_MIRROR_MISMATCH", key, "Exact mirror requires equal SHA-256 digests."));
  if (item.expectedDigestBehavior.startsWith("sha256_different") && sourceDigest === distDigest) findings.push(finding("SOURCE_DIST_TOPOLOGY_TRANSFORM_EXPECTATION_INVALID", key, "Transformed relationship requires different SHA-256 digests."));
}

function scriptPaths(root) {
  const paths = new Set();
  const visit = (directory) => { for (const entry of readdirSync(directory, { withFileTypes: true })) { const absolutePath = resolve(directory, entry.name); if (entry.isDirectory()) visit(absolutePath); else if (/\.(?:js|mjs|cjs|ts)$/.test(entry.name)) paths.add(relative(root, absolutePath)); } };
  visit(root);
  return paths;
}
function digest(path) { return createHash("sha256").update(readFileSync(path)).digest("hex"); }
function argumentValue(option) { const index = process.argv.indexOf(option); if (index === -1) return null; const value = process.argv[index + 1]; if (!value || value.startsWith("--")) fail("SOURCE_DIST_TOPOLOGY_ARGUMENT_VALUE_MISSING", `${option} requires a value.`); return value; }
function finding(code, path, message) { return { code, path, message }; }
function fail(code, message) { console.error(JSON.stringify({ status: "failed", findings: [{ code, message }] }, null, 2)); process.exit(1); }
