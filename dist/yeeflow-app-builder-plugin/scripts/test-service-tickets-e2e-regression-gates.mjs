#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { materializeFullAppGeneratedFinal } from "./materialize-full-app-generated-final.mjs";
import { readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

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
| Field Order | Display Name | Internal ID / Field Key | Yeeflow Field Type | Exact Yeeflow Control Type | Choice Values |
| --- | --- | --- | --- | --- | --- |
| 1 | Ticket Number | Text1 | Text | input | |
| 2 | Subject | Text2 | Text | input | |
| 3 | Requester | User1 | User | identity-picker | |
| 4 | Category | Text3 | Choice | select | Hardware, Software, Access |
| 5 | Priority | Text4 | Choice | select | Low, Medium, High, Critical |
| 6 | Status | Text5 | Choice | select | Open, In Progress, Resolved, Closed |
| 7 | Assigned Agent | User2 | User | identity-picker | |
| 8 | Created Date | Datetime1 | Datetime | datepicker | |
| 9 | Due Date | Datetime2 | Datetime | datepicker | |
| 10 | Description | Text6 | Text | textarea | |

### 4.2 Ticket Comments
#### Fields
| Field Order | Display Name | Internal ID / Field Key | Yeeflow Field Type | Exact Yeeflow Control Type | Choice Values |
| --- | --- | --- | --- | --- | --- |
| 1 | Comment | Text1 | Text | textarea | |
| 2 | Ticket | Lookup1 | Text | lookup | |
| 3 | Commented By | User1 | User | identity-picker | |

### 4.3 Ticket Attachments
#### Fields
| Field Order | Display Name | Internal ID / Field Key | Yeeflow Field Type | Exact Yeeflow Control Type | Choice Values |
| --- | --- | --- | --- | --- | --- |
| 1 | File | File1 | Text | file-upload | |
| 2 | Ticket | Lookup1 | Text | lookup | |
| 3 | Uploaded By | User1 | User | identity-picker | |

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
### 14.1 Service Tickets Dashboard
- Page name: Service Tickets Dashboard

#### Dashboard Page Layout Template Selection
| Dashboard Page | Selected Dashboard Page Layout Template |
| --- | --- |
| Service Tickets Dashboard | dashboard-page-layouts-two-panel-workspace |

#### Summary Metrics
| Metric Name | Dashboard Page | Source Data List | Source Field(s) | Calculation Logic |
| --- | --- | --- | --- | --- |
| Open Tickets | Service Tickets Dashboard | Tickets | Status | Count open tickets |

#### Record Display Control Selection
| Dashboard Page | Dataset Region | Source List | Selected Collection Template |
| --- | --- | --- | --- |
| Service Tickets Dashboard | Ticket list | Tickets | collection_control_grid_table |

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
assert.match(ticketFields.get("Requester")?.FieldName || "", /^Text[1-9]\d*$/, "Requester must use a schema-safe Text-backed field key for identity-picker storage");
assert.equal(ticketFields.get("Requester")?.Type, "identity-picker", "Requester must use identity-picker control type");
assert.match(ticketFields.get("Assigned Agent")?.FieldName || "", /^Text[1-9]\d*$/, "Assigned Agent must use a schema-safe Text-backed field key for identity-picker storage");
assert.equal(ticketFields.get("Assigned Agent")?.Type, "identity-picker", "Assigned Agent must use identity-picker control type");

const pageTitles = decoded.Pages.map((page) => page.Title);
assert.deepEqual(pageTitles, ["Service Tickets Dashboard"], "Summary Metrics must not materialize as an extra Dashboard page");

const layoutsByList = new Map(decoded.Childs.map((child) => [child.List.Title, child.Layouts.filter((layout) => Number(layout.Type) === 1).map((layout) => layout.Title)]));
assert.deepEqual(layoutsByList.get("Tickets"), ["Tickets New/Edit Form", "Tickets View Item"]);
assert.deepEqual(layoutsByList.get("Ticket Comments"), ["Ticket Comments New/Edit Form", "Ticket Comments View Item"]);
assert.deepEqual(layoutsByList.get("Ticket Attachments"), ["Ticket Attachments New/Edit Form", "Ticket Attachments View Item"]);

const decodedText = JSON.stringify(decoded);
assert.doesNotMatch(decodedText, /\b(?:Office Asset|Active Loan Pipeline|current loan volume|return activity signal)\b/i, "Service Tickets package must not retain Office Asset/Loan template residue");

console.log(JSON.stringify({
  status: "pass",
  cases: [
    "planned Status field preserved",
    "planned User fields preserved as identity-picker controls with schema-safe storage keys",
    "Summary Metrics not generated as Dashboard",
    "custom forms assigned to correct host lists",
    "template business residue absent",
  ],
}, null, 2));
