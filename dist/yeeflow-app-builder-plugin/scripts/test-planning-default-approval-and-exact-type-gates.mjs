#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();

function writeFixture(dir, name, text) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `${text.trim()}\n`);
  return file;
}

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  let report;
  try {
    report = JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`Could not parse JSON for ${args.join(" ")}: ${error.message}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
  return { result, report };
}

function assertReportIntegrity(report) {
  const warningFindings = (report.findings || []).filter((finding) => finding.level === "warning").length;
  const errorFindings = (report.findings || []).filter((finding) => finding.level === "error").length;
  assert.equal(report.warnings || 0, warningFindings, "warning count must match warning findings");
  assert.equal(report.errors || 0, errorFindings, "error count must match error findings");
}

function expectPass(name, args, results) {
  const { result, report } = run(args);
  assert.equal(result.status, 0, `${name} should exit 0: ${result.stderr}\n${JSON.stringify(report.findings, null, 2)}`);
  assert.equal(report.status, "pass", `${name} should pass`);
  assertReportIntegrity(report);
  results.push({ case: name, status: "pass" });
  return report;
}

function expectFail(name, args, code, results) {
  const { result, report } = run(args);
  assert.notEqual(result.status, 0, `${name} should exit nonzero`);
  assert.equal(report.status, "fail", `${name} should fail`);
  assert.equal((report.findings || []).some((finding) => finding.code === code), true, `${name} expected ${code}; findings: ${JSON.stringify(report.findings, null, 2)}`);
  assertReportIntegrity(report);
  results.push({ case: name, status: "pass" });
  return report;
}

function businessGates(status, reason = "Recommended defaults unblock planning only; user approval is still required before generation.") {
  return `
# Vendor Contract Management Functional Specification

## 19. Business Decision Gates

| Key | Question | Options | Recommended Default | Required Before Generation | Status | Reason / Fallback / Proof Impact |
| --- | --- | --- | --- | --- | --- | --- |
| approvalRoute | Which approval route should contracts follow? | Legal / Finance / Operations | Legal + Finance + Operations Manager | Yes | ${status} | ${reason} |
| financeThreshold | What threshold requires Finance review? | 0 / 10000 / 25000 | Finance reviews over 25000 | Yes | ${status} | ${reason} |
| reminderOffsets | Which reminder offsets are required? | 90/60/30 / custom | 90/60/30/7 days | Yes | ${status} | ${reason} |
| requiredDocuments | Which documents are mandatory? | Contract / SOW / amendment | Signed contract required | Yes | ${status} | ${reason} |
| permissionModel | Who can edit records? | Owners / admins | Owners edit own records, admins override | Yes | ${status} | ${reason} |

## 18. Generation Contract and Hard Gates

| Gate | Required | Pass Criteria |
| --- | --- | --- |
| Schema validation | Yes | Later package validation |
`;
}

function duplicatedVendorBusinessGates(status) {
  const gates = [
    ["approvalRoute", "Which approval route should contracts follow?", "Legal + Finance + Operations Manager"],
    ["renewalReminderOffsets", "Which renewal reminder offsets should be used?", "90/60/30/7 days before renewal"],
    ["requiredDocumentPolicy", "Which documents are mandatory before a contract can be active?", "Signed contract plus amendments when applicable"],
    ["renewalDecisionPolicy", "Who decides whether a contract renews, renegotiates, or terminates?", "Contract owner recommends; operations manager approves"],
    ["permissionModel", "Who may view and edit vendor and contract records?", "Operations can view; owners edit assigned records; admins override"],
  ];
  const rows = gates.map(([key, question, defaultValue]) => `| ${key} | ${question} | confirm / revise | ${defaultValue} | Yes | ${status} | Planning default only; generation requires user approval |`);
  return `
# Vendor Contract Management Planning Artifact

## 19. Business Decision Gates

| Key | Question | Options | Recommended Default | Required Before Generation | Status | Reason / Fallback / Proof Impact |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}
`;
}

function basePlan(overrides = {}) {
  const dataListHeader = overrides.dataListHeader ?? "| Field | Exact Yeeflow Field Type | Exact Yeeflow Control Type | Proof Label | Fallback / Deferred Reason |";
  const dataListRow = overrides.dataListRow ?? "| Contract Owner | User | user picker control | validator-backed | N/A |";
  const actionLine = overrides.actionLine ?? "| Renewal Collection | Open Contract | button control | open detail action | current item | Open detail page | validator-backed | N/A |";
  const note = overrides.note ?? "";
  return `
# Vendor Contract Management Yeeflow App Plan

## 1. Plan Status
- Functional Specification review gate passed: Yes
- App Plan review gate passed: Yes
- Business decision gates answered/user-default-approved-for-generation or no blockers: Yes
- No invented unsupported shapes: Yes

## 4. Data Lists and Document Libraries Plan
### Contracts
${dataListHeader}
| --- | --- | --- | --- | --- |
${dataListRow}

## 5. Approval Forms Plan
No Approval forms required; not applicable.

## 6. Form Reports Plan
No Form Reports required; not applicable.

## 7. Schedule Workflows Plan
No Schedule workflows required; not applicable.

## 8. AI Agents Plan
No AI Agents required; not applicable.

## 9. Copilots Plan
No Copilots required; not applicable.

## 10. Custom Data List Forms Plan
### Contract Forms
| Field | Exact Yeeflow Field Type | Exact Yeeflow Control Type | Proof Label | Fallback / Deferred Reason |
| --- | --- | --- | --- | --- |
| Contract Owner | User | user picker control | validator-backed | N/A |
No custom Sub List actions required.

## 11. Data List Workflows Plan
No Data List workflows required; not applicable.

## 12. Notifications Plan
Renewal reminder notification planned with supported notification action.

## 13. Data List Views Plan
Active Contracts view planned.

## 14. Dashboard Pages Plan
### Contract Dashboard
- Page name: Contract Dashboard
- Business purpose: Monitor renewals.
#### Sections and Controls
| Section Name | Purpose | Yeeflow Controls | Data Source | Fields Displayed |
| --- | --- | --- | --- | --- |
| Renewals | Display Data List records | Collection | Contracts | Contract Owner |
#### Record Display Control Selection
| Section | Data Source | Display Need | Selected Control | Selection Reason | Detail/Open Behavior | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Renewals | Contracts | Card list | Collection | Collection fits renewal cards | Open detail | Runtime open proof required |
#### Item Template Dynamic Controls
| Host Control | Source List | Item Template Region | Dynamic Control Type | Bound Field | Display Purpose | Empty/Fallback Behavior | Style/Badge/Format Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Renewal Collection | Contracts | Owner | dynamic-user | Contract Owner | Owner display | Show Unassigned | Avatar |
#### Collection and Kanban Item Actions
| Host Control | Action Name | Trigger Control | Exact Yeeflow Action Type | Current Item Context | Steps | Proof Label | Fallback / Deferred Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
${actionLine}
${note}

## 15. Application Navigation Plan
Contracts navigation item planned.

## 16. Target Users, Roles, Groups, and Permissions
Contract Owner role can view/create/edit own records.

## 17. Plugin Capability and Standards Compliance
All resource types, field types, variable types, controls, Dynamic controls, workflow nodes, form actions, Collection/Kanban actions, Sub List actions, property paths, bindings, and configuration shapes come from active plugin-known skills, standards, validators, template library, control/property knowledge base, extension registry, or export-proven references.

## 18. Generation Contract and Hard Gates
- Functional Specification review gate passed: Yes
- App Plan review gate passed: Yes
- Business decision gates answered/user-default-approved-for-generation or no blockers: Yes
- No invented unsupported shapes: Yes
`;
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "planning-default-exact-type-gates-"));
const results = [];

try {
  const planningDefault = writeFixture(tempDir, "planning-default.md", businessGates("default-applied-for-planning"));
  const planningReport = expectPass("default-applied-for-planning passes planning mode with warning finding", ["scripts/validate-business-clarification-gate.mjs", "--spec", planningDefault, "--mode", "planning", "--json"], results);
  assert.equal(planningReport.warnings > 0, true);
  assert.equal(planningReport.findings.some((finding) => finding.level === "warning" && finding.code === "BUSINESS_CLARIFICATION_DEFAULT_APPLIED_FOR_PLANNING"), true);

  const duplicatedSpec = writeFixture(tempDir, "duplicated-vendor-spec.md", duplicatedVendorBusinessGates("default-applied-for-planning"));
  const duplicatedPlan = writeFixture(tempDir, "duplicated-vendor-plan.md", duplicatedVendorBusinessGates("default-applied-for-planning"));
  const duplicatedPlanningReport = expectPass("duplicated planning defaults report five unique gates from ten raw findings", ["scripts/validate-business-clarification-gate.mjs", "--spec", duplicatedSpec, "--plan", duplicatedPlan, "--mode", "planning", "--json"], results);
  assert.equal(duplicatedPlanningReport.warnings, 10);
  assert.equal(duplicatedPlanningReport.rawFindingCount, 10);
  assert.equal(duplicatedPlanningReport.uniqueUnresolvedGateCount, 5);
  assert.deepEqual(duplicatedPlanningReport.uniqueUnresolvedGateKeys, [
    "approvalRoute",
    "permissionModel",
    "renewalDecisionPolicy",
    "renewalReminderOffsets",
    "requiredDocumentPolicy",
  ]);
  assert.equal(duplicatedPlanningReport.gateOccurrences.approvalRoute.length, 2);

  expectFail("default-applied-for-planning fails generation mode", ["scripts/validate-business-clarification-gate.mjs", "--spec", planningDefault, "--mode", "generation", "--json"], "BUSINESS_CLARIFICATION_DEFAULT_ONLY_FOR_PLANNING", results);

  const duplicatedGenerationReport = expectFail("duplicated planning defaults fail generation mode with five unique gates", ["scripts/validate-business-clarification-gate.mjs", "--spec", duplicatedSpec, "--plan", duplicatedPlan, "--mode", "generation", "--json"], "BUSINESS_CLARIFICATION_DEFAULT_ONLY_FOR_PLANNING", results);
  assert.equal(duplicatedGenerationReport.errors, 10);
  assert.equal(duplicatedGenerationReport.rawFindingCount, 10);
  assert.equal(duplicatedGenerationReport.uniqueUnresolvedGateCount, 5);
  assert.deepEqual(duplicatedGenerationReport.uniqueUnresolvedGateKeys, duplicatedPlanningReport.uniqueUnresolvedGateKeys);

  const generationDefault = writeFixture(tempDir, "generation-default.md", businessGates("user-default-approved-for-generation"));
  expectPass("user-default-approved-for-generation passes generation mode", ["scripts/validate-business-clarification-gate.mjs", "--spec", generationDefault, "--mode", "generation", "--json"], results);

  const unanswered = writeFixture(tempDir, "unanswered.md", businessGates("TBD"));
  expectFail("both modes reject unanswered pending TBD", ["scripts/validate-business-clarification-gate.mjs", "--spec", unanswered, "--mode", "planning", "--json"], "BUSINESS_CLARIFICATION_UNANSWERED_GATE", results);
  expectFail("generation mode rejects unanswered pending TBD", ["scripts/validate-business-clarification-gate.mjs", "--spec", unanswered, "--mode", "generation", "--json"], "BUSINESS_CLARIFICATION_UNANSWERED_GATE", results);

  const deferredBad = writeFixture(tempDir, "deferred-bad.md", businessGates("deferred", ""));
  expectFail("deferred without reason fallback proof impact fails", ["scripts/validate-business-clarification-gate.mjs", "--spec", deferredBad, "--mode", "generation", "--json"], "BUSINESS_CLARIFICATION_STATUS_MISSING", results);

  const hardGateOnly = writeFixture(tempDir, "hard-gate-only.md", `
# App Plan
## 18. Generation Contract and Hard Gates
| Gate | Required | Pass Criteria |
| --- | --- | --- |
| Schema validation | Yes | Later package validation |
`);
  expectPass("generic hard-gate tables are still ignored", ["scripts/validate-business-clarification-gate.mjs", "--plan", hardGateOnly, "--mode", "generation", "--json"], results);

  const exactGood = writeFixture(tempDir, "exact-good.md", basePlan());
  expectPass("split columns with exact values pass", ["scripts/validate-generation-readiness-review.mjs", "--plan", exactGood, "--json"], results);

  const combinedHeader = writeFixture(tempDir, "combined-header.md", basePlan({
    dataListHeader: "| Field | Exact Yeeflow Field Type / Control Type | Proof Label | Fallback / Deferred Reason |",
    dataListRow: "| Contract Owner | User / user picker control | validator-backed | N/A |",
  }));
  expectFail("combined exact heading fails", ["scripts/validate-generation-readiness-review.mjs", "--plan", combinedHeader, "--json"], "GENERATION_READINESS_EXACT_TYPE_CONTROL_COMBINED", results);

  const combinedValue = writeFixture(tempDir, "combined-value.md", basePlan({
    dataListRow: "| Contract Owner | Lookup / lookup control | user picker control | validator-backed | N/A |",
  }));
  expectFail("combined exact value fails", ["scripts/validate-generation-readiness-review.mjs", "--plan", combinedValue, "--json"], "GENERATION_READINESS_EXACT_VALUE_SLASH_COMBINED", results);

  const whereSupported = writeFixture(tempDir, "where-supported.md", basePlan({
    actionLine: "| Renewal Collection | Open Contract | button control | open detail where supported | current item | Open detail where supported | validator-backed | N/A |",
  }));
  expectFail("where supported in implementation rows fails without proof label", ["scripts/validate-generation-readiness-review.mjs", "--plan", whereSupported, "--json"], "GENERATION_READINESS_AMBIGUOUS_IMPLEMENTATION_WORDING", results);

  const whereSupportedDeferred = writeFixture(tempDir, "where-supported-deferred.md", basePlan({
    actionLine: "| Renewal Collection | Open Contract | button control | open detail where supported | current item | Open detail where supported | runtime-proof-required | Fallback: use standard detail page; proof impact: runtime open proof required before generation-ready claim |",
  }));
  expectPass("where supported passes with proof label and fallback impact", ["scripts/validate-generation-readiness-review.mjs", "--plan", whereSupportedDeferred, "--json"], results);

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
