#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { materializeFullAppGeneratedFinal } from "./materialize-full-app-generated-final.mjs";
import { readDecodedYapk } from "./lib/yapk-decode-utils.mjs";
import { validateDashboardGenerationHardGates } from "./validate-dashboard-generation-hard-gates.mjs";
import { validateDashboardPageLayoutTemplate } from "./validate-dashboard-page-layout-template.mjs";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "service-tickets-regression-"));
const specPath = path.join(tempDir, "functional-specification.md");
const planPath = path.join(tempDir, "yeeflow-app-plan.md");
const outDir = path.join(tempDir, "dist");

fs.writeFileSync(specPath, `# Functional Specification: Service Tickets Management

Service desk ticket management with Tickets, Ticket Comments, and Ticket Attachments.
`);

fs.writeFileSync(planPath, `# Service Tickets Management - Yeeflow App Plan

## 1. Plan Status
Approved for generated-final validation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Tickets
#### Fields
| Order | Display Name | Internal Name | Business Type | Yeeflow Type | Choices |
| --- | --- | --- | --- | --- | --- |
| 1 | Ticket Number | Text1 | Text | input | |
| 2 | Subject | Text2 | Text | input | |
| 3 | Requester | Text4 | User identity | identity-picker | Existing system user |
| 4 | Category | Text3 | Choice | select | Hardware, Software, Access |
| 5 | Priority | Text7 | Choice | select | Low, Medium, High, Critical |
| 6 | Status | Text5 | Choice | select | Open, In Progress, Resolved, Closed |
| 7 | Assigned Agent | Text8 | User identity | identity-picker | Existing system user |
| 8 | Created Date | Datetime1 | Datetime | datepicker | |
| 9 | Due Date | Datetime2 | Datetime | datepicker | |
| 10 | Description | Text6 | Text | textarea | |

### 4.2 Ticket Comments
#### Fields
| Order | Display Name | Internal Name | Business Type | Yeeflow Type | Choices |
| --- | --- | --- | --- | --- | --- |
| 1 | Comment | Text1 | Text | textarea | |
| 2 | Ticket | Lookup1 | Text | lookup | |
| 3 | Commented By | Text4 | User identity | identity-picker | |

### 4.3 Ticket Attachments
#### Fields
| Order | Display Name | Internal Name | Business Type | Yeeflow Type | Choices |
| --- | --- | --- | --- | --- | --- |
| 1 | File | File1 | Text | file-upload | |
| 2 | Ticket | Lookup1 | Text | lookup | |
| 3 | Uploaded By | Text4 | User identity | identity-picker | |

## 5. Approval Forms Plan
Not planned.

## 6. Form Reports Plan
Not planned.

## 10. Custom Data List Forms Plan
| Data List | Form Name | Form Type | Selected Data List Form Layout Template | Open in |
| --- | --- | --- | --- | --- |
| Tickets | Tickets New/Edit Form | New/Edit | data_list_form_layout_new_edit_v1_1 | Pop-up window |
| Tickets | Tickets View Item | View | data_list_form_layout_view_item_v1_1 | Pop-up window |
| Ticket Comments | Ticket Comments New/Edit Form | New/Edit | data_list_form_layout_new_edit_v1_1 | Pop-up window |
| Ticket Comments | Ticket Comments View Item | View | data_list_form_layout_view_item_v1_1 | Pop-up window |
| Ticket Attachments | Ticket Attachments New/Edit Form | New/Edit | data_list_form_layout_new_edit_v1_1 | Pop-up window |
| Ticket Attachments | Ticket Attachments View Item | View | data_list_form_layout_view_item_v1_1 | Pop-up window |

## 13. Data List Views Plan
Not planned.

## 14. Dashboard Pages Plan
Dashboard page selection:

| Dashboard | Layout template | Dataset presentation |
| --- | --- | --- |
| Service Tickets Dashboard | dashboard-page-layouts-two-panel-workspace | collection_control_grid_table |

Left panel work queue:

| Region | Source | Required bindings |
| --- | --- | --- |
| Ticket list | Tickets | Subject \`Text2\`, Requester \`Text4\`, Priority \`Text7\`, Status \`Text5\`, Created Date \`Datetime1\`, Due Date \`Datetime2\` |

Right panel selected ticket detail:

| Visible label | Binding |
| --- | --- |
| Detail title | Subject / Text2 |
| Status | Text5 |

Explicit dashboard exclusions:

Do not generate KPI Cards, empty business sections, right-header placeholder buttons, or loan-domain copy.

#### Summary Metrics
| Metric Name | Dashboard Page | Source Data List | Source Field(s) | Calculation Logic |
| --- | --- | --- | --- | --- |
| Open Tickets | Service Tickets Dashboard | Tickets | Status | Count open tickets |

#### Record Display Control Selection
| Dashboard Page | Dataset Region | Source List | Selected Collection Template | Selection Reason |
| --- | --- | --- | --- | --- |
| Service Tickets Dashboard | Ticket list | Tickets | collection_control_grid_table | Dense operational table for row/column scanning of ticket status, owner, priority, and due date fields. |

## 15. Application Navigation Plan
| Group | Item | Target Resource | Yeeflow Resource Type | Icon |
| --- | --- | --- | --- | --- |
| Workspace | Service Tickets Dashboard | Service Tickets Dashboard | Dashboard | fa-solid fa-ticket |
| Workspace | Tickets | Tickets | Data list | fa-solid fa-list |
`);

const report = materializeFullAppGeneratedFinal({
  functionalSpec: specPath,
  appPlan: planPath,
  outDir,
  allowFixtureApiIdsForTests: true,
  cwd: tempDir,
});

assert.equal(report.status, "pass", JSON.stringify(report.findings || [], null, 2));
const packagePath = report.outputs.package;
const { decoded } = readDecodedYapk(packagePath);

const tickets = decoded.Childs.find((child) => child.List.Title === "Tickets");
assert.ok(tickets, "Tickets data list must materialize");
const ticketFields = new Map(tickets.Fields.map((field) => [field.DisplayName, field]));
assert.equal(ticketFields.get("Status")?.FieldName, "Text5", "Status field must preserve its planned field key");
assert.equal(ticketFields.get("Status")?.Type, "select", "Status field must remain a selectable choice field");
assert.match(ticketFields.get("Requester")?.FieldName || "", /^Text\d+$/, "Requester must materialize on a schema-safe Text-backed storage field");
assert.equal(ticketFields.get("Requester")?.FieldType, "Text", "Requester must use canonical Text storage for identity-picker fields");
assert.equal(ticketFields.get("Requester")?.Type, "identity-picker", "Requester must use identity-picker control type");
assert.doesNotMatch(ticketFields.get("Requester")?.FieldName || "", /^User\d+$/, "Requester must not emit unsupported User* storage keys");
assert.match(ticketFields.get("Assigned Agent")?.FieldName || "", /^Text\d+$/, "Assigned Agent must materialize on a schema-safe Text-backed storage field");
assert.equal(ticketFields.get("Assigned Agent")?.FieldType, "Text", "Assigned Agent must use canonical Text storage for identity-picker fields");
assert.equal(ticketFields.get("Assigned Agent")?.Type, "identity-picker", "Assigned Agent must use identity-picker control type");
assert.doesNotMatch(ticketFields.get("Assigned Agent")?.FieldName || "", /^User\d+$/, "Assigned Agent must not emit unsupported User* storage keys");

const comments = decoded.Childs.find((child) => child.List.Title === "Ticket Comments");
const attachments = decoded.Childs.find((child) => child.List.Title === "Ticket Attachments");
assert.ok(comments, "Ticket Comments data list must materialize");
assert.ok(attachments, "Ticket Attachments data list must materialize");
const commentFields = new Map(comments.Fields.map((field) => [field.DisplayName, field]));
const attachmentFields = new Map(attachments.Fields.map((field) => [field.DisplayName, field]));
assert.match(commentFields.get("Commented By")?.FieldName || "", /^Text\d+$/, "Commented By must materialize on a schema-safe Text-backed storage field");
assert.equal(commentFields.get("Commented By")?.FieldType, "Text", "Commented By must use canonical Text storage for identity-picker fields");
assert.equal(commentFields.get("Commented By")?.Type, "identity-picker", "Commented By must use identity-picker control type");
assert.doesNotMatch(commentFields.get("Commented By")?.FieldName || "", /^User\d+$/, "Commented By must not emit unsupported User* storage keys");
assert.match(attachmentFields.get("Uploaded By")?.FieldName || "", /^Text\d+$/, "Uploaded By must materialize on a schema-safe Text-backed storage field");
assert.equal(attachmentFields.get("Uploaded By")?.FieldType, "Text", "Uploaded By must use canonical Text storage for identity-picker fields");
assert.equal(attachmentFields.get("Uploaded By")?.Type, "identity-picker", "Uploaded By must use identity-picker control type");
assert.doesNotMatch(attachmentFields.get("Uploaded By")?.FieldName || "", /^User\d+$/, "Uploaded By must not emit unsupported User* storage keys");

const pageTitles = decoded.Pages.map((page) => page.Title);
assert.deepEqual(pageTitles, ["Service Tickets Dashboard"], "Summary Metrics must not materialize as an extra Dashboard page");
const dashboardResource = JSON.parse(decoded.Pages[0].LayoutInResources[0].Resource);
assert.equal(
  dashboardResource.derivedFromDashboardPageLayoutTemplate,
  "dashboard-page-layouts-two-panel-workspace",
  "Service Tickets Dashboard must materialize the App Plan-selected two-panel workspace layout",
);
assert.ok(JSON.stringify(dashboardResource).includes("left_panel_data_items_wrapper"), "Two-panel workspace must include the left record-list panel");
assert.ok(JSON.stringify(dashboardResource).includes("content_panel_current_item_wrapper"), "Two-panel workspace must include the selected-item detail panel");
const leftCollection = findFirstByIdentity(dashboardResource, "left_panel_data_items_wrapper");
assert.ok(leftCollection, "Two-panel workspace left collection must be present");
assert.deepEqual(leftCollection.attrs?.data?.filter || [], [], "Left record-list collection must not apply unsafe empty select-filter conditions");
const leftFilters = findAllByIdentity(dashboardResource, "left_panel_filter_control");
const priorityFilter = leftFilters.find((filter) => /priority/i.test(`${filter.name || ""} ${filter.title || ""} ${filter.attrs?.lab?.value || ""}`));
const statusFilter = leftFilters.find((filter) => /status/i.test(`${filter.name || ""} ${filter.title || ""} ${filter.attrs?.lab?.value || ""}`));
assert.ok(priorityFilter, "Two-panel workspace must keep a Priority filter control when planned by the template");
assert.ok(statusFilter, "Two-panel workspace must keep a Status filter control when planned by the template");
assert.equal(priorityFilter.attrs?.data?.field, ticketFields.get("Priority")?.FieldName, "Priority filter must bind to the planned Priority field");
assert.equal(priorityFilter.attrs?.display_f, ticketFields.get("Priority")?.FieldName, "Priority filter display field must match the planned Priority field");
assert.equal(priorityFilter.attrs?.value_f, ticketFields.get("Priority")?.FieldName, "Priority filter value field must match the planned Priority field");
assert.equal(priorityFilter.attrs?.optionSourceProven, true, "Priority filter must carry an export-proven option source contract");
assert.ok((priorityFilter.attrs?.["choice-options"] || []).includes("High"), "Priority filter must expose planned choice values instead of an empty dropdown");
assert.equal(statusFilter.attrs?.data?.field, ticketFields.get("Status")?.FieldName, "Status filter must bind to the planned Status field");
assert.ok((statusFilter.attrs?.["choice-options"] || []).includes("Open"), "Status filter must expose planned choice values");

const pageLayoutValidation = validateDashboardPageLayoutTemplate({ package: packagePath, appPlan: planPath });
assert.equal(pageLayoutValidation.status, "pass", JSON.stringify(pageLayoutValidation.findings || [], null, 2));
const dashboardHardGates = validateDashboardGenerationHardGates({ package: packagePath, plan: planPath });
assert.equal(dashboardHardGates.status, "pass", JSON.stringify(dashboardHardGates.findings || [], null, 2));

const layoutsByList = new Map(decoded.Childs.map((child) => [child.List.Title, child.Layouts.filter((layout) => Number(layout.Type) === 1).map((layout) => layout.Title)]));
assert.deepEqual(layoutsByList.get("Tickets"), ["Tickets New/Edit Form", "Tickets View Item"]);
assert.deepEqual(layoutsByList.get("Ticket Comments"), ["Ticket Comments New/Edit Form", "Ticket Comments View Item"]);
assert.deepEqual(layoutsByList.get("Ticket Attachments"), ["Ticket Attachments New/Edit Form", "Ticket Attachments View Item"]);

const seedData = JSON.parse(fs.readFileSync(report.outputs.seedData, "utf8"));
const ticketSeed = seedData.lists.find((list) => list.listTitle === "Tickets");
const attachmentSeed = seedData.lists.find((list) => list.listTitle === "Ticket Attachments");
assert.ok(ticketSeed, "Seed artifact must include Tickets list instructions");
assert.ok(attachmentSeed, "Seed artifact must include Ticket Attachments list instructions");
const requesterSeed = ticketSeed.rows[0][ticketFields.get("Requester").FieldName];
const assignedAgentSeed = ticketSeed.rows[0][ticketFields.get("Assigned Agent").FieldName];
const fileSeed = attachmentSeed.rows[0][attachmentFields.get("File").FieldName];
assert.equal(requesterSeed?.seedValueType, "identity-picker", "identity-picker seed values must be structured live-user resolution placeholders, not plain strings");
assert.equal(requesterSeed?.requiresLiveUserResolution, true, "identity-picker seed values must require live tenant user resolution");
assert.equal(assignedAgentSeed?.seedValueType, "identity-picker", "Assigned Agent seed values must use the identity-picker seed contract");
assert.equal(fileSeed?.seedValueType, "file-upload", "file-upload seed values must be structured file reference placeholders, not plain strings");
assert.equal(fileSeed?.requiresFileUploadReference, true, "file-upload seed values must require a file upload reference before live write");
assert.ok(
  ticketSeed.fieldSeedRequirements.some((requirement) => requirement.displayName === "Requester" && requirement.requiresLiveUserResolution),
  "Seed artifact must declare identity-picker live-user requirements",
);
assert.ok(
  attachmentSeed.fieldSeedRequirements.some((requirement) => requirement.displayName === "File" && requirement.requiresFileUploadReference),
  "Seed artifact must declare file-upload reference requirements",
);

const decodedText = JSON.stringify(decoded);
assert.doesNotMatch(decodedText, /\b(?:Office Asset|Active Loans|Active Loan Pipeline|current loan volume|return activity signal|Coordinator view of active loans|checkout status|return follow-up)\b/i, "Service Tickets package must not retain Office Asset/Loan template residue");
assert.doesNotMatch(decodedText, /\b(?:event_portfolio_header_band|event_portfolio_pipeline_section|Asset Loan Operations Header Band)\b/i, "Service Tickets custom forms must not retain source-template metadata residue");
assert.doesNotMatch(decodedText, /\b(?:summary_approved_budget|summary_registration_rate|summary_lead_follow_up|approved_budget_count|registration_rate_count|lead_follow_up_count)\b/i, "Generated KPI/Summary runtime identifiers must use business metric names, not source-template identifiers");

console.log(JSON.stringify({
  status: "pass",
  cases: [
    "planned Status field preserved",
    "planned user/person fields preserved as Text-backed identity-picker controls",
    "Summary Metrics not generated as Dashboard",
    "two-panel Dashboard layout matches App Plan selection",
    "left-panel Priority/Status filters use proven option sources",
    "dashboard page-layout and hard-gate validators pass",
    "custom forms assigned to correct host lists",
    "seed artifacts use structured identity-picker and file-upload contracts",
    "template business residue absent",
  ],
}, null, 2));

function findFirstByIdentity(node, identity) {
  if (!node || typeof node !== "object") return null;
  if (hasIdentity(node, identity)) return node;
  for (const child of node.children || []) {
    const found = findFirstByIdentity(child, identity);
    if (found) return found;
  }
  return null;
}

function findAllByIdentity(node, identity) {
  const matches = [];
  const visit = (current) => {
    if (!current || typeof current !== "object") return;
    if (hasIdentity(current, identity)) matches.push(current);
    for (const child of current.children || []) visit(child);
  };
  visit(node);
  return matches;
}

function hasIdentity(node, identity) {
  const values = [
    node.id,
    node.name,
    node.label,
    node.title,
    node.nv_label,
    node.nav_label,
    node.attrs?.nv_label,
    node.attrs?.nav_label,
  ];
  return values.some((value) => String(value || "") === identity);
}
