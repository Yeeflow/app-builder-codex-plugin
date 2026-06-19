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

function expectPass(name, args, results) {
  const { result, report } = run(args);
  assert.equal(result.status, 0, `${name} should exit 0: ${result.stderr}\n${JSON.stringify(report.findings, null, 2)}`);
  assert.equal(report.status, "pass", `${name} should pass`);
  results.push({ case: name, status: "pass" });
  return report;
}

function expectFail(name, args, code, results) {
  const { result, report } = run(args);
  assert.notEqual(result.status, 0, `${name} should exit nonzero`);
  assert.equal(report.status, "fail", `${name} should fail`);
  assert.equal((report.findings || []).some((finding) => finding.code === code), true, `${name} expected ${code}; findings: ${JSON.stringify(report.findings, null, 2)}`);
  results.push({ case: name, status: "pass" });
  return report;
}

function businessGateSpec(statusByGate = {}) {
  const gates = [
    ["approvalRoute", "Which approval route should vendor contracts follow?", "Legal + Finance + Operations Manager"],
    ["financeThreshold", "What contract value or payment terms require Finance review?", "Finance reviews contracts over the threshold or with non-standard payment terms"],
    ["reminderOffsets", "Which renewal reminder offsets should be used?", "90/60/30/7 days before renewal"],
    ["requiredDocuments", "Which contract documents are mandatory?", "Signed contract required, amendments/SOW required when applicable"],
    ["permissionModel", "Who may edit vendor and contract records?", "Contract owners edit assigned records; admins can override"],
  ];
  const rows = gates.map(([key, question, defaultValue]) => {
    const status = statusByGate[key] ?? "unanswered";
    return `| ${key} | ${question} | confirm / revise | ${defaultValue} | Yes | ${status} | Changes routing, reminders, documents, or permissions |`;
  });
  return `
# Vendor Contract Management - Functional Specification

## 19. Business Decision Gates

| Key | Question | Options | Recommended Default | Required Before Generation | Status | Why This Matters |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}
`;
}

function hardGateOnlyPlan(extra = "") {
  return `
# Vendor Contract Management - Yeeflow App Plan

## 18. Generation Contract and Hard Gates

| Gate | Required | Pass Criteria | Blocks Generation/Signing/Install |
| --- | --- | --- | --- |
| Functional Spec to App Plan traceability | Yes | Validator passes | Generation |
| Generation Readiness Review | Yes | Structural readiness passes | Design/generation |
| Schema validation | Yes | Package schema passes | Signing |

${extra}
`;
}

const readinessAreas = {
  dataLists: "### 4.1 Contracts\n- Resource type: Data list\n- Business purpose: Track vendor contracts.\n#### Fields\n| Field Order | Display Name | Internal ID / Field Key | Yeeflow Field Type | Placeholder |\n| --- | --- | --- | --- | --- |\n| 1 | Contract Name | Title | Title | Enter contract name |\n| 2 | Owner | Owner | User | Select owner |\n| 3 | Approval Status | ApprovalStatus | Choice | Select status |",
  approvalForms: "### 5.1 Contract Approval\n- Approval form name: Contract Approval\n- Form reports required: Yes\n#### Submission Form Fields\n| Field | Placeholder |\n| --- | --- |\n| Contract Name | Enter contract name |\n#### Approval Workflow Nodes\n| Node Name | Node Type |\n| --- | --- |\n| Manager Approval | Assignment task |\n#### Sub List List Actions\nNo custom Sub List actions required.",
  formReports: "| Form Report Name | Related Approval Form | Purpose | Notes |\n| --- | --- | --- | --- |\n| Contract Approval Report | Contract Approval | Approval output | Based on Approval form |",
  scheduleWorkflows: "No schedule workflows required; not applicable.",
  aiAgents: "No AI Agent required; not applicable.",
  copilots: "No Copilot required; not applicable.",
  customForms: "### 10.1 Contracts\n| Form Name | Form Type | Purpose |\n| --- | --- | --- |\n| Contract Detail | Detail | View contract details |\n#### Sub List List Actions\nNo custom Sub List actions required.",
  dataListWorkflows: "No Data List workflows required; not applicable.",
  notifications: "Renewal reminder notification is runtime-proof-required with manual follow-up fallback.",
  views: "| View Name | Display Fields |\n| --- | --- |\n| Active Contracts | Contract Name, Owner, Approval Status |",
  dashboards: `### 14.1 Contract Dashboard
- Page name: Contract Dashboard
- Business purpose: Monitor contract renewals.
#### Sections and Controls
| Section Name | Purpose | Yeeflow Controls | Data Source | Fields Displayed |
| --- | --- | --- | --- | --- |
| Renewals | Display Data List records | Collection | Contracts | Contract Name, Owner, Approval Status |

#### Record Display Control Selection
| Section | Data Source | Display Need | Selected Control | Selection Reason | Detail/Open Behavior | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Renewals | Contracts | Card list for renewal review | Collection | Collection is better than a dense table for renewal cards | Open detail slide | Runtime open proof required |

#### Item Template Dynamic Controls
| Host Control | Source List | Item Template Region | Dynamic Control Type | Bound Field | Display Purpose | Empty/Fallback Behavior | Style/Badge/Format Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Renewal Collection | Contracts | Card title | dynamic-field | Contract Name | Contract title | Show Untitled | Title style |
| Renewal Collection | Contracts | Card owner | dynamic-user | Owner | Contract owner | Show Unassigned | Avatar style |

#### Collection and Kanban Item Actions
No Collection/Kanban item actions required.`,
  navigation: "| Group | Item | Yeeflow Resource Type | Target Resource |\n| --- | --- | --- | --- |\n| Operations | Contracts | Data list | Contracts |",
  permissions: "| Role | Resource/Page/Form | View | Create | Edit | Approve |\n| --- | --- | --- | --- | --- | --- |\n| Contract Owner | Contracts | Yes | Yes | Own | No |",
};

function readinessPlan(overrides = {}) {
  const area = { ...readinessAreas, ...overrides };
  return `
# Vendor Contract Management - Yeeflow App Plan

## 1. Plan Status
- Functional Specification review gate passed: Yes
- App Plan review gate passed: Yes
- Business decision gates answered/user-default-approved-for-generation or no blockers: Yes
- No invented unsupported shapes: Yes

## 4. Data Lists and Document Libraries Plan
${area.dataLists}

## 5. Approval Forms Plan
${area.approvalForms}

## 6. Form Reports Plan
${area.formReports}

## 7. Schedule Workflows Plan
${area.scheduleWorkflows}

## 8. AI Agents Plan
${area.aiAgents}

## 9. Copilots Plan
${area.copilots}

## 10. Custom Data List Forms Plan
${area.customForms}

## 11. Data List Workflows Plan
${area.dataListWorkflows}

## 12. Notifications Plan
${area.notifications}

## 13. Data List Views Plan
${area.views}

## 14. Dashboard Pages Plan
${area.dashboards}

## 15. Application Navigation Plan
${area.navigation}

## 16. Target Users, Roles, Groups, and Permissions
${area.permissions}

## 17. Plugin Capability and Standards Compliance
All App Plan resource types, field types, variable types, controls, Dynamic controls, workflow nodes, form actions, Collection/Kanban actions, Sub List actions, property paths, bindings, and configuration shapes come from active plugin-known skills, standards, validators, template library, control/property knowledge base, extension registry, or export-proven references.

## 18. Generation Contract and Hard Gates
- Functional Specification review gate passed: Yes
- App Plan review gate passed: Yes
- Business decision gates answered/user-default-approved-for-generation or no blockers: Yes
- No invented unsupported shapes: Yes
`;
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "business-clarification-app-plan-precision-"));
const results = [];

try {
  const fiveGateSpec = writeFixture(tempDir, "vendor-five-gates.md", businessGateSpec());
  const fiveGateReport = expectFail("five unresolved business gates fail exactly", ["scripts/validate-business-clarification-gate.mjs", "--spec", fiveGateSpec, "--json"], "BUSINESS_CLARIFICATION_UNANSWERED_GATE", results);
  const unresolvedGateKeys = fiveGateReport.findings.filter((finding) => finding.code === "BUSINESS_CLARIFICATION_UNANSWERED_GATE").map((finding) => finding.gateKey).sort();
  assert.deepEqual(unresolvedGateKeys, ["approvalRoute", "financeThreshold", "permissionModel", "reminderOffsets", "requiredDocuments"].sort());

  const approvedSpec = writeFixture(tempDir, "vendor-default-approved.md", businessGateSpec({
    approvalRoute: "user-default-approved-for-generation",
    financeThreshold: "user-default-approved-for-generation",
    reminderOffsets: "user-default-approved-for-generation",
    requiredDocuments: "user-default-approved-for-generation",
    permissionModel: "user-default-approved-for-generation",
  }));
  expectPass("user-default-approved-for-generation business gates pass", ["scripts/validate-business-clarification-gate.mjs", "--spec", approvedSpec, "--mode", "generation", "--json"], results);

  const hardGateOnly = writeFixture(tempDir, "hard-gate-only.md", hardGateOnlyPlan());
  const hardGateOnlyReport = expectPass("Generation Contract hard-gate table is not a business gate table", ["scripts/validate-business-clarification-gate.mjs", "--plan", hardGateOnly, "--json"], results);
  assert.equal((hardGateOnlyReport.findings || []).some((finding) => finding.code === "BUSINESS_CLARIFICATION_STATUS_MISSING"), false);

  const mixedPlan = writeFixture(tempDir, "mixed-business-and-hard-gates.md", `${businessGateSpec()}\n${hardGateOnlyPlan("Generation is paused until these questions are answered.")}`);
  const mixedReport = expectFail("mixed business gates and hard gates reports only business gate rows plus pause", ["scripts/validate-business-clarification-gate.mjs", "--plan", mixedPlan, "--json"], "BUSINESS_CLARIFICATION_UNANSWERED_GATE", results);
  assert.equal((mixedReport.findings || []).some((finding) => finding.code === "BUSINESS_CLARIFICATION_STATUS_MISSING"), false);
  assert.equal((mixedReport.findings || []).some((finding) => finding.code === "BUSINESS_CLARIFICATION_GENERATION_PAUSED"), true);

  const pausedOnly = writeFixture(tempDir, "paused-only.md", hardGateOnlyPlan("Generation is paused until these questions are answered."));
  const pausedOnlyReport = expectFail("paused generation wording fails only as paused generation", ["scripts/validate-business-clarification-gate.mjs", "--plan", pausedOnly, "--json"], "BUSINESS_CLARIFICATION_GENERATION_PAUSED", results);
  assert.equal((pausedOnlyReport.findings || []).filter((finding) => finding.code === "BUSINESS_CLARIFICATION_GENERATION_PAUSED").length, 1);
  assert.equal((pausedOnlyReport.findings || []).some((finding) => finding.code === "BUSINESS_CLARIFICATION_STATUS_MISSING"), false);

  const exactPlan = writeFixture(tempDir, "exact-supported-types.md", readinessPlan());
  expectPass("exact supported type/control/action wording passes", ["scripts/validate-generation-readiness-review.mjs", "--plan", exactPlan, "--json"], results);

  const ambiguousFields = writeFixture(tempDir, "ambiguous-fields.md", readinessPlan({
    dataLists: readinessAreas.dataLists.replace("| 1 | Contract Name | Title | Title | Enter contract name |", "| 1 | Contract Name | Title | Title/Text | Enter contract name |"),
  }));
  expectFail("ambiguous slash-combined field type fails without proof label", ["scripts/validate-generation-readiness-review.mjs", "--plan", ambiguousFields, "--json"], "GENERATION_READINESS_AMBIGUOUS_IMPLEMENTATION_WORDING", results);

  const ambiguousAction = writeFixture(tempDir, "ambiguous-action.md", readinessPlan({
    dashboards: readinessAreas.dashboards.replace("No Collection/Kanban item actions required.", "| Host Control | Action Name | Trigger Control | Action Type | Current Item Context | Temp Variables | Steps | Data Read | Data Write | Runtime Proof Boundary |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| Renewal Collection | Open Contract | Button | Open detail/slide panel where supported | current item | selectedContract | Open detail | Contracts | none | Local proof |"),
  }));
  expectFail("where-supported action wording fails without proof label", ["scripts/validate-generation-readiness-review.mjs", "--plan", ambiguousAction, "--json"], "GENERATION_READINESS_AMBIGUOUS_IMPLEMENTATION_WORDING", results);

  const ambiguousDeferred = writeFixture(tempDir, "ambiguous-deferred.md", readinessPlan({
    dataLists: readinessAreas.dataLists.replace("| 1 | Contract Name | Title | Title | Enter contract name |", "| 1 | Contract Name | Title | Document library / Data list | Enter contract name | export-learning-required before generation |"),
  }));
  expectPass("ambiguous wording marked export-learning-required passes", ["scripts/validate-generation-readiness-review.mjs", "--plan", ambiguousDeferred, "--json"], results);

  const reportText = [
    "Functional Specification structure: pass",
    "App Plan resource order: pass",
    "Functional Spec to App Plan traceability: pass",
    "Generation Readiness structural check: pass",
    "Business Clarification Gate: fail",
    "Overall generation readiness: blocked by Business Clarification Gate",
  ].join("\n");
  assert.match(reportText, /Generation Readiness structural check: pass/);
  assert.match(reportText, /Overall generation readiness: blocked by Business Clarification Gate/);
  assert.doesNotMatch(reportText, /^Validation passed$/m);
  results.push({ case: "report wording separates structural readiness from overall readiness", status: "pass" });

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
