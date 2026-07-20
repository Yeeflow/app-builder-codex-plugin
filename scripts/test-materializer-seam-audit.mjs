#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const auditPath = resolve(root, "compatibility/capability-manifests/materializer-seam-audit.v0.1.0.json");
const validator = resolve(root, "scripts/validate-materializer-seam-audit.mjs");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-materializer-seam-audit-"));

try {
  positive();
  negative("unknown-classification", (audit) => { selected(audit).coreClassification = "unknown"; }, "MATERIALIZER_SEAM_AUDIT_CLASSIFICATION_UNKNOWN");
  negative("deterministic-host-effect", (audit) => { selected(audit).detectedSideEffects = ["filesystem"]; }, "MATERIALIZER_SEAM_AUDIT_DETERMINISTIC_HOST_EFFECT");
  negative("missing-io", (audit) => { selected(audit).inputOutputContract = null; }, "MATERIALIZER_SEAM_AUDIT_IO_CONTRACT_MISSING");
  negative("missing-parity", (audit) => { selected(audit).requiredParityFixture = null; }, "MATERIALIZER_SEAM_AUDIT_PARITY_REQUIREMENT_MISSING");
  negative("unknown-target", (audit) => { selected(audit).recommendedTargetCorePackage = "@yeeflow/not-approved"; }, "MATERIALIZER_SEAM_AUDIT_TARGET_PACKAGE_UNKNOWN");
  negative("nondeterminism", (audit) => { selected(audit).nondeterminism = ["time"]; }, "MATERIALIZER_SEAM_AUDIT_NONDETERMINISM_UNREJECTED");
  negative("shadow-evidence", (audit) => { selected(audit).shadowImplementation.corpusCaseCount = 0; }, "MATERIALIZER_SEAM_AUDIT_SHADOW_EVIDENCE_INVALID");
  negative("unclassified", (audit) => { audit.records = audit.records.filter((record) => record.functionName !== selected(audit).functionName); }, "MATERIALIZER_SEAM_AUDIT_FUNCTION_UNCLASSIFIED");
  negative("phase4f-missing-candidate", (audit) => { audit.phase4fCandidateSelection.candidates.pop(); }, "MATERIALIZER_SEAM_AUDIT_PHASE4F_CANDIDATE_INVENTORY_INVALID");
  negative("phase4f-mutation", (audit) => { audit.phase4fCandidateSelection.productionRoutingChanged = true; }, "MATERIALIZER_SEAM_AUDIT_PHASE4F_MUTATION_FORBIDDEN");
  if (JSON.parse(readFileSync(auditPath, "utf8")).phase4fCandidateSelection.recommendedNextSlice) negative("phase4f-recommendation", (audit) => { audit.phase4fCandidateSelection.recommendedNextSlice.recordId = "scripts/materialize-full-app-generated-final.mjs#fieldIndexFromName"; }, "MATERIALIZER_SEAM_AUDIT_PHASE4F_RECOMMENDATION_INVALID");
  console.log("MATERIALIZER_SEAM_AUDIT_TESTS_PASSED cases=11");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function positive() {
  const result = run(auditPath);
  if (result.status !== 0) throw new Error(`Positive materializer seam audit validation failed: ${result.stderr}`);
}

function negative(name, mutate, code) {
  const audit = JSON.parse(readFileSync(auditPath, "utf8"));
  mutate(audit);
  const candidate = resolve(temporary, `${name}.json`);
  writeFileSync(candidate, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  const result = run(candidate);
  if (result.status === 0 || !`${result.stdout}${result.stderr}`.includes(code)) throw new Error(`Negative case ${name} did not report ${code}.`);
}

function selected(audit) {
  const record = audit.records.find((item) => item.id === audit.selection.selectedRecordId);
  if (!record) throw new Error("Expected deterministic Core selection was not present.");
  return record;
}

function run(candidate) { return spawnSync(process.execPath, [validator, "--audit", candidate], { cwd: root, encoding: "utf8" }); }
