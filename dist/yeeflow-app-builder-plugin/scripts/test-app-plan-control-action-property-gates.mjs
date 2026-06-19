#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

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
    throw new Error(`Could not parse output for ${args.join(" ")}: ${error.message}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
  return { result, report };
}

function expectPass(name, args, results) {
  const { result, report } = run(args);
  assert.equal(result.status, 0, `${name} should exit 0: ${result.stderr}\nstdout:\n${result.stdout}`);
  assert.equal(report.status, "pass", `${name} should pass: ${JSON.stringify(report.findings, null, 2)}`);
  results.push({ case: name, status: "pass" });
}

function expectFail(name, args, code, results) {
  const { result, report } = run(args);
  assert.notEqual(result.status, 0, `${name} should exit nonzero\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.equal(report.status, "fail", `${name} should fail`);
  assert.equal((report.findings || []).some((finding) => finding.code === code), true, `${name} expected ${code}; findings: ${JSON.stringify(report.findings, null, 2)}`);
  results.push({ case: name, status: "pass" });
}

const baseAreas = {
  dataLists: "### 4.1 Requests\n- Resource type: Data list\n- Business purpose: Track requests.\n#### Fields\n| Field Order | Display Name | Internal ID / Field Key | Yeeflow Field Type | Placeholder |\n| --- | --- | --- | --- | --- |\n| 1 | Request Title | Title | Title | Enter title |\n| 2 | Owner | User1 | User | Select owner |\n| 3 | Status | Text1 | Choice | Select status |",
  approvalForms: "### 5.1 Request Approval\n- Approval form name: Request Approval\n- Form reports required: Yes\n#### Submission Form Fields\n| Field | Placeholder | Sublist/Summary Notes |\n| --- | --- | --- |\n| Request Title | Enter title | N/A |\n#### Approval Workflow Nodes\n| Node Name | Node Type |\n| --- | --- |\n| Manager Approval | Assignment task |\n#### Sub List List Actions\nNo custom Sub List actions required.",
  formReports: "| Form Report Name | Related Approval Form | Purpose | Notes |\n| --- | --- | --- | --- |\n| Request Approval Report | Request Approval | Print approval outcome | Based on the Approval form |",
  scheduleWorkflows: "No schedule workflows required; not applicable.",
  aiAgents: "No AI Agent requirement identified; not applicable.",
  copilots: "No Copilot requirement identified; not applicable.",
  customForms: "### 10.1 Requests\n| Form Name | Form Type | Purpose |\n| --- | --- | --- |\n| Request Detail | Detail | View request details |\n#### Sub List List Actions\nNo custom Sub List actions required.",
  dataListWorkflows: "None required for this scope; not applicable.",
  notifications: "Notification: Request approved email; delivery proof boundary is runtime-proof-required because delivery is not locally proven.",
  views: "| View Name | Display Fields |\n| --- | --- |\n| Active Requests | Title, Status |",
  dashboards: `### 14.1 Operations Dashboard
- Page name: Operations Dashboard
- Business purpose: Monitor request throughput.
#### Sections and Controls
| Section Name | Purpose | Yeeflow Controls | Data Source | Fields Displayed |
| --- | --- | --- | --- | --- |
| Requests | Display Data List records | Collection | Requests | Title, Owner, Status |

#### Record Display Control Selection
| Section | Data Source | Display Need | Selected Control | Selection Reason | Detail/Open Behavior | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Requests | Requests | Card list for active requests | Collection | Collection fits scannable cards better than a dense table | Open detail slide | Runtime open proof required |

#### Item Template Dynamic Controls
| Host Control | Source List | Item Template Region | Dynamic Control Type | Bound Field | Display Purpose | Empty/Fallback Behavior | Style/Badge/Format Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Request Collection | Requests | Card title | dynamic-field | Title | Request title | Show Untitled | Title style |
| Request Collection | Requests | Card owner | dynamic-user | Owner | Request owner | Show Unassigned | Avatar style |

#### Collection and Kanban Item Actions
No Collection/Kanban item actions required.`,
  navigation: "| Group | Item | Yeeflow Resource Type | Target Resource |\n| --- | --- | --- | --- |\n| Operations | Requests | Data list | Requests |",
  permissions: "| Role | Resource/Page/Form | View | Create | Edit | Approve |\n| --- | --- | --- | --- | --- | --- |\n| Requester | Requests | Yes | Yes | Own | No |",
};

function readinessPlan(overrides = {}) {
  const area = { ...baseAreas, ...overrides };
  return `
# Example - Yeeflow App Plan

## 1. Plan Status
- Functional Specification review gate passed: Yes
- App Plan review gate passed: Yes
- Business decision gates answered/default-approved or no blockers: Yes
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
- Business decision gates answered/default-approved or no blockers: Yes
- No invented unsupported shapes: Yes
`;
}

function traceSpec(overrides = {}) {
  const body = {
    ui: "Users need a card list of request records, a status board, an activity history timeline, current item status update actions, and repeated line items with row-level duplicate/delete operations.",
    reporting: "Operations dashboard must show request cards, status board lanes, and activity history.",
    workflows: "Users need item-level actions, bulk update actions, and status updates from the workboard.",
    forms: "Request forms include repeated line items and row-level operations.",
    permissions: "Requester and Manager roles require view/create/edit/approve permissions.",
    ...overrides,
  };
  return `
# Example - Functional Specification

## 6. Business Objects and Data Concepts
| Business Object | Description |
| --- | --- |
| Request | Employee request record |

## 7. Business Relationships and Dependency Rules
Line items belong to a Request.

## 10. Approval and Review Requirements
Managers approve submitted requests.

## 11. Data Entry and Form Requirements
${body.forms}

## 12. Workflow, Automation, and Action Requirements
${body.workflows}

## 13. Reporting, Dashboard, and Analytics Requirements
${body.reporting}

## 17. Permissions and Access Requirements
${body.permissions}

## 18. UI and Experience Requirements
${body.ui}
`;
}

function tracePlan(overrides = {}) {
  const body = {
    dashboards: `${baseAreas.dashboards}
#### Additional Board
Kanban is selected for status board lanes. Vertical Timeline is selected for activity history.`,
    approvals: `${baseAreas.approvalForms}
Sub List planning covers repeated line items and row-level operations.`,
    customForms: baseAreas.customForms,
    deferred: "| Item | Category | Reason | User Impact | Fallback | Required Proof or Follow-up |\n| --- | --- | --- | --- | --- | --- |\n| Runtime actions | runtime-proof-required | Item and row actions require tenant runtime proof | Users may need manual fallback | Manual edit | Runtime proof after install |",
    pluginCompliance: "All controls and actions are plugin-supported or runtime-proof-required.",
    ...overrides,
  };
  return `
# Example - Yeeflow App Plan

## 2. Requirement-to-Yeeflow Resource Mapping Summary
| Requirement Area | Business Requirement | Yeeflow Resource Type | Planned Resource Name |
| --- | --- | --- | --- |
| Data management | Request | Data list | Requests |
| Approval/review | Request Approval | Approval form | Request Approval |
| Reporting | Request dashboard | Dashboard page | Operations Dashboard |

## 4. Data Lists and Document Libraries Plan
Data list: Requests with Title, Owner, and Status fields. Line Items relate to Requests through a parent-child Sub List relationship and lookup-style binding.

## 5. Approval Forms Plan
${body.approvals}

## 6. Form Reports Plan
Form Report: Request Approval Report based on Request Approval.

## 10. Custom Data List Forms Plan
${body.customForms}

## 13. Data List Views Plan
Active Requests view.

## 14. Dashboard Pages Plan
${body.dashboards}

## 15. Application Navigation Plan
Navigation includes Operations Dashboard and Requests.

## 16. Target Users, Roles, Groups, and Permissions
Roles and permissions: Requester can view/create Requests; Manager can approve.

## 17. Plugin Capability and Standards Compliance
${body.pluginCompliance}

## 22. Deferred or Runtime-Proof Items
${body.deferred}
`;
}

const results = [];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-app-plan-control-gates-"));

try {
  expectPass("record display selection passes with Collection and reason", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "pass-collection.md", readinessPlan()), "--json"], results);
  expectPass("Kanban selected for status board passes", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "pass-kanban.md", readinessPlan({ dashboards: baseAreas.dashboards.replace("Collection | Collection fits scannable cards better than a dense table", "Kanban | Kanban fits status lanes") })), "--json"], results);
  expectPass("Vertical Timeline selected for activity history passes", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "pass-timeline.md", readinessPlan({ dashboards: baseAreas.dashboards.replace("Collection | Collection fits scannable cards better than a dense table", "Vertical Timeline | Vertical Timeline fits activity history") })), "--json"], results);

  expectFail("Data List records displayed but no selected control fails", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "fail-no-selected-control.md", readinessPlan({ dashboards: "### 14.1 Dashboard\n- Page name: Ops\n- Business purpose: Display Data List records.\n#### Sections and Controls\n| Section Name | Purpose | Yeeflow Controls | Data Source | Fields Displayed |\n| --- | --- | --- | --- | --- |\n| Requests | Display Data List records | Collection | Requests | Title |" })), "--json"], "GENERATION_READINESS_RECORD_DISPLAY_CONTROL_MISSING", results);
  expectFail("unsupported selected control fails", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "fail-unsupported-control.md", readinessPlan({ dashboards: baseAreas.dashboards.replace("Collection | Collection fits scannable cards better than a dense table", "Magic board | unsupported control property") })), "--json"], "GENERATION_READINESS_UNSUPPORTED_RECORD_DISPLAY_CONTROL", results);
  expectFail("Collection item template missing Dynamic controls fails", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "fail-missing-dynamic.md", readinessPlan({ dashboards: baseAreas.dashboards.replace(/#### Item Template Dynamic Controls[\s\S]*?#### Collection and Kanban Item Actions/, "#### Collection and Kanban Item Actions") })), "--json"], "GENERATION_READINESS_ITEM_TEMPLATE_DYNAMIC_CONTROLS_MISSING", results);
  expectFail("Dynamic user bound to non-user field fails", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "fail-dynamic-user.md", readinessPlan({ dashboards: baseAreas.dashboards.replace("Card owner | dynamic-user | Owner | Request owner", "Card status | dynamic-user | Status | Status label") })), "--json"], "GENERATION_READINESS_DYNAMIC_USER_FIELD_MISMATCH", results);
  expectFail("unsupported Dynamic control without proof label fails", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "fail-unsupported-dynamic.md", readinessPlan({ dashboards: baseAreas.dashboards.replace("dynamic-field | Title", "magic-dynamic | Title") })), "--json"], "GENERATION_READINESS_UNSUPPORTED_TYPE_PROPERTY_UNMARKED", results);
  expectPass("Collection explicit no item actions passes", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "pass-no-actions.md", readinessPlan()), "--json"], results);
  expectPass("Collection action with current item context and steps passes", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "pass-action.md", readinessPlan({ dashboards: baseAreas.dashboards.replace("No Collection/Kanban item actions required.", "| Host Control | Action Name | Trigger Control | Action Type | Current Item Context | Temp Variables | Steps | Data Read | Data Write | Runtime Proof Boundary |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| Request Collection | Mark Complete | Button | setdatalist | __ctx_coll ListDataID | selectedRequestId | Set data list Status to Completed | Requests row | Requests.Status | Runtime action proof required |") })), "--json"], results);
  expectFail("Collection/Kanban present but no item action decision fails", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "fail-no-action-decision.md", readinessPlan({ dashboards: baseAreas.dashboards.replace(/#### Collection and Kanban Item Actions[\s\S]*/, "") })), "--json"], "GENERATION_READINESS_COLLECTION_KANBAN_ACTION_DECISION_MISSING", results);
  expectFail("Collection action without steps/current item context fails", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "fail-action-incomplete.md", readinessPlan({ dashboards: baseAreas.dashboards.replace("No Collection/Kanban item actions required.", "| Host Control | Action Name |\n| --- | --- |\n| Request Collection | Mark Complete |") })), "--json"], "GENERATION_READINESS_COLLECTION_KANBAN_ACTION_DECISION_MISSING", results);
  expectPass("Sub List explicit no list actions passes", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "pass-no-sublist-actions.md", readinessPlan()), "--json"], results);
  expectPass("Sub List action with row context and steps passes", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "pass-sublist-action.md", readinessPlan({ approvalForms: baseAreas.approvalForms.replace("No custom Sub List actions required.", "| Host Form | Sub List Field/Control | Action Name | Action Type | Current Row Context | Steps | Summary Fields Affected | Parent Field Binding | Runtime Proof Boundary |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| Request Approval | Line Items Sub List | Duplicate Item | duplicate item | Current row | list_dup step | Total Amount | TotalAmount | Runtime proof required |") })), "--json"], results);
  expectFail("Sub List present but no list action decision fails", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "fail-sublist-no-action.md", readinessPlan({
    approvalForms: baseAreas.approvalForms.replace(/#### Sub List List Actions[\s\S]*/, "Sub List field: Line Items."),
    customForms: "### 10.1 Requests\n| Form Name | Form Type | Purpose |\n| --- | --- | --- |\n| Request Detail | Detail | View request details |",
  })), "--json"], "GENERATION_READINESS_SUB_LIST_ACTION_DECISION_MISSING", results);
  expectFail("Sub List action missing row context and steps fails", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "fail-sublist-incomplete.md", readinessPlan({ approvalForms: baseAreas.approvalForms.replace("No custom Sub List actions required.", "| Host Form | Sub List Field/Control | Action Name |\n| --- | --- | --- |\n| Request Approval | Line Items | Duplicate |") })), "--json"], "GENERATION_READINESS_SUB_LIST_ACTION_DECISION_MISSING", results);
  expectPass("plugin-supported type/property rule passes", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "pass-plugin-rule.md", readinessPlan()), "--json"], results);
  expectFail("invented unsupported action wording without proof label fails", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "fail-unsupported-action.md", readinessPlan({ dashboards: `${baseAreas.dashboards}\n- Planned unsupported control action shape: turboMutateCurrentItem.` })), "--json"], "GENERATION_READINESS_UNSUPPORTED_TYPE_PROPERTY_UNMARKED", results);
  expectPass("unknown capability marked export-learning-required passes", ["scripts/validate-generation-readiness-review.mjs", "--plan", writeFixture(tmp, "pass-export-learning.md", readinessPlan({ dashboards: `${baseAreas.dashboards}\n- Planned unknown control property path is export-learning-required because a safe export is needed before generation.` })), "--json"], results);

  expectPass("traceability maps record display, actions, sublists, and permissions", ["scripts/validate-functional-spec-to-app-plan-traceability.mjs", "--spec", writeFixture(tmp, "trace-pass-spec.md", traceSpec()), "--plan", writeFixture(tmp, "trace-pass-plan.md", tracePlan()), "--json"], results);
  expectFail("traceability fails missing record display control", ["scripts/validate-functional-spec-to-app-plan-traceability.mjs", "--spec", writeFixture(tmp, "trace-fail-record-spec.md", traceSpec({ ui: "Users need a card list of request records." })), "--plan", writeFixture(tmp, "trace-fail-record-plan.md", tracePlan({ dashboards: "Dashboard page: Operations Dashboard without record control mapping.", deferred: "", pluginCompliance: "All controls and actions are plugin-supported." })), "--json"], "TRACEABILITY_RECORD_DISPLAY_CONTROL_UNMAPPED", results);
  expectFail("traceability fails missing item actions", ["scripts/validate-functional-spec-to-app-plan-traceability.mjs", "--spec", writeFixture(tmp, "trace-fail-action-spec.md", traceSpec({ workflows: "Users need item action and bulk action behavior for request cards." })), "--plan", writeFixture(tmp, "trace-fail-action-plan.md", tracePlan({ dashboards: baseAreas.dashboards.replace(/#### Collection and Kanban Item Actions[\s\S]*/, ""), deferred: "", pluginCompliance: "All controls and actions are plugin-supported." })), "--json"], "TRACEABILITY_ITEM_ACTION_UNMAPPED", results);
  expectFail("traceability fails missing Sub List actions", ["scripts/validate-functional-spec-to-app-plan-traceability.mjs", "--spec", writeFixture(tmp, "trace-fail-sublist-spec.md", traceSpec({ forms: "Request forms include repeated line items and duplicate row operations." })), "--plan", writeFixture(tmp, "trace-fail-sublist-plan.md", tracePlan({
    approvals: "Approval form with submission fields and approval workflow, but no repeated-row action coverage.",
    customForms: "Request New/Edit/View forms with fields and Placeholder planning.",
    deferred: "",
    pluginCompliance: "All controls and actions are plugin-supported.",
  })), "--json"], "TRACEABILITY_SUB_LIST_ACTION_UNMAPPED", results);

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
