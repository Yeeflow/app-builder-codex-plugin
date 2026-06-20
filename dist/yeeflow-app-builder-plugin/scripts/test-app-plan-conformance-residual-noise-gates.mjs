#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "app-plan-residual-noise-"));
const results = [];

function writeFile(name, content) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`);
  return file;
}

function layoutViewGrouped(groups) {
  return JSON.stringify({
    sortVer: 1,
    sort: groups.map((group, groupIndex) => ({
      Title: group.title,
      Type: "classes",
      list: group.items.map((title, itemIndex) => ({
        Title: title,
        Type: groupIndex === 1 && itemIndex === 0 ? 105 : group.title === "Reference Data" || title === "Facility Requests" ? 1 : 103,
        ListID: `${group.title}-${title}`,
      })),
    })),
  });
}

function decodedApp({ extraList = "", pages, reports, forms } = {}) {
  const dataLists = [
    "Rooms and Areas",
    "Equipment Assets",
    "Technician Directory",
    "Facility Requests",
    "Vendor Follow-ups",
    "Work Activity Log",
    extraList,
  ].filter(Boolean);
  const pageTitles = pages || ["Facility Operations Overview", "Triage Queue", "Technician Workload", "SLA and Safety Dashboard"];
  return {
    Item: {
      ListModel: {
        Title: "Facility Maintenance Request Management",
        ListID: "root",
        LayoutView: layoutViewGrouped([
          { title: "Overview", items: ["Facility Operations Overview"] },
          { title: "Requests", items: ["Submit Facility Request", "Facility Requests", "Triage Queue"] },
          { title: "Work Management", items: ["Technician Workload", "Vendor Follow-ups", "Work Activity Log"] },
          { title: "Reports", items: ["SLA and Safety Dashboard"] },
          { title: "Reference Data", items: ["Rooms and Areas", "Equipment Assets", "Technician Directory"] },
        ]),
      },
      Defs: [],
      Layouts: pageTitles.map((title) => ({ Title: title, Type: 103, LayoutID: `page-${title}` })),
    },
    Childs: dataLists.map((title) => ({ ListModel: { Title: title, ListID: `list-${title}` }, Defs: [], Layouts: [] })),
    Forms: (forms || ["Facility Maintenance Request"]).map((title) => ({ Name: title, key: title, nodes: [] })),
    FormNewReports: (reports || ["Facility Maintenance Request Report"]).map((title) => ({ Title: title })),
  };
}

function facilityResidualNoisePlan({ extraDataList = "" } = {}) {
  const extraRow = extraDataList ? `| Data management | Extra concrete list | Data list | ${extraDataList} | Yes | Real canonical resource row. |\n` : "";
  return `# Facility Maintenance Request Management - Yeeflow App Plan

## 2. Requirement-to-Yeeflow Resource Mapping Summary

| Requirement Area | Business Requirement | Yeeflow Resource Type | Planned Resource Name | Required | Notes |
| --- | --- | --- | --- | --- | --- |
| Data management | Track submitted facility maintenance tickets | Data list | Facility Requests | Yes | Primary transaction list. |
| Data management | Maintain room and area references | Data list | Rooms and Areas | Yes | Lookup reference. |
| Data management | Maintain facility equipment references | Data list | Equipment Assets | Yes | Lookup reference. |
| Data management | Maintain dispatchable technician references | Data list | Technician Directory | Yes | Avoids tenant user IDs. |
| Data management | Track parts and vendor follow-up | Data list | Vendor Follow-ups | Yes | Child transaction list. |
| Data management | Track request history and work notes | Data list | Work Activity Log | Yes | Timeline source. |
${extraRow}| Approval/review | Intake and closure review | Approval form | Facility Maintenance Request | Yes | Review workflow. |
| Approval output | Printable request summary | Form report | Facility Maintenance Request Report | Yes | Standalone Form report. |
| List browsing | Staff browse operational records | Data List view | Role-specific request and follow-up views | Yes | View metadata, not a resource. |
| Dashboard/workbench | Review SLA and workload | Dashboard page | Facility Operations Overview, Triage Queue, Technician Workload, SLA and Safety Dashboard | Yes | Comma-separated concrete page resources. |
| Automation | Assignment, activity logging, notifications, and SLA checks | Data-list workflow, Schedule workflow, Notification | Request lifecycle automations | Yes | Aggregate implementation note, not one resource. |
| AI | No AI needed | AI Agent or Copilot | Not applicable | No | No AI Agent or Copilot planned. |

## 3. Resource Generation Order

| Order | Resource Type | Resource Name | Depends On | Reason for Order | Blocking If Missing |
| --- | --- | --- | --- | --- | --- |
| 1 | Data lists and Document libraries | Rooms and Areas | None | Lookup target. | Yes |
| 2 | Data lists and Document libraries | Equipment Assets | Rooms and Areas | Lookup target. | Yes |
| 3 | Data lists and Document libraries | Technician Directory | None | Assignment lookup. | Yes |
| 4 | Data lists and Document libraries | Facility Requests | Reference lists | Main transaction list. | Yes |
| 5 | Data lists and Document libraries | Vendor Follow-ups | Facility Requests | Child follow-up list. | Yes |
| 6 | Data lists and Document libraries | Work Activity Log | Facility Requests | Timeline list. | Yes |
| 7 | Approval forms | Facility Maintenance Request | Data lists and fields | Review workflow. | Yes |
| 8 | Form reports | Facility Maintenance Request Report | Facility Maintenance Request approval form | Printable output. | No |
| 9 | AI Agents | Not applicable | None | No AI Agent planned. | No |
| 10 | Copilots | Not applicable | None | No Copilot planned. | No |
| 11 | Custom Data List forms | Edit Item and View Item forms for all lists | Data lists | Standard list form experience. | Yes |
| 12 | Data List workflows | Request and follow-up lifecycle workflows | Data lists | Automate status and activity updates. | No |
| 13 | Data List views | Operational views | Data lists | Role-based browsing. | Yes |
| 14 | Dashboard pages | Operations and workload dashboards | Lists and views | Dashboard category metadata. | Yes |
| 15 | Application navigation | Grouped app navigation | All resources | Must expose resources. | Yes |
| 16 | Target users, roles, groups, and permissions | Placeholder app groups and permission intent | Resources and navigation | Permissions depend on tenant setup. | Yes |

## 15. Application Navigation Plan

| Navigation Order | Group | Item | Yeeflow Resource Type | Target Resource | Visible | Icon | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Overview | Facility Operations Overview | Dashboard | Facility Operations Overview | Yes | fa-solid fa-chart-line | Type 103 page item. |
| 2 | Requests | Submit Facility Request | Approval form | Facility Maintenance Request | Yes | fa-solid fa-screwdriver-wrench | Type 105 form item. |
| 3 | Requests | Facility Requests | Data list | Facility Requests | Yes | fa-regular fa-clipboard-list | Type 1 list item. |
| 4 | Requests | Triage Queue | Dashboard | Triage Queue | Yes | fa-solid fa-list-check | Type 103 page item. |
| 5 | Work Management | Technician Workload | Dashboard | Technician Workload | Yes | fa-solid fa-user-gear | Type 103 page item. |
| 6 | Work Management | Vendor Follow-ups | Data list | Vendor Follow-ups | Yes | fa-solid fa-truck-field | Type 1 list item. |
| 7 | Work Management | Work Activity Log | Data list | Work Activity Log | Yes | fa-regular fa-clock | Type 1 list item. |
| 8 | Reports | SLA and Safety Dashboard | Dashboard | SLA and Safety Dashboard | Yes | fa-solid fa-shield-halved | Type 103 page item. |
| 9 | Reference Data | Rooms and Areas | Data list | Rooms and Areas | Yes | fa-regular fa-building | Type 1 list item. |
| 10 | Reference Data | Equipment Assets | Data list | Equipment Assets | Yes | fa-solid fa-toolbox | Type 1 list item. |
| 11 | Reference Data | Technician Directory | Data list | Technician Directory | Yes | fa-solid fa-users-gear | Type 1 list item. |

## 16. Target Users, Roles, Groups, and Permissions

| Role | User Group | Resource/Page/Form | View | Create | Edit | Delete/Archive | Approve | Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Facilities Coordinator | Facilities Coordinators placeholder | All resources | Yes | Yes | Yes | Limited | Review | No | Permission metadata, not a planned resource. |

## 21. Generation Contract and Hard Gates

- Output package: .yapk by default.
- YAPK signing gate: setsign and verifysign only when explicitly approved.
- Approval Form Contract: Facility Maintenance Request must not ship as an empty Forms entry.
- Navigation Runtime Contract: Type: "classes" with list[] for grouped navigation; no local children group shape.
- Plan-to-Package Conformance Contract: planned lists, forms, reports, pages, and navigation must match generated resources.
- Proof Boundary Contract: schema validation, app-plan conformance, signing, install/import acceptance, and runtime UI inspection are separate.
- Runtime Inspection Checklist: app opens, navigation groups render, request page opens, task pages exist, and lists open.
`;
}

function run(planFile, packageFile) {
  const result = spawnSync(process.execPath, [
    "scripts/validate-app-plan-conformance.mjs",
    "--plan",
    planFile,
    "--package",
    packageFile,
    "--mode",
    "strict",
    "--grouped-navigation-export-proven",
    "true",
  ], { encoding: "utf8", maxBuffer: 24 * 1024 * 1024 });
  if (!result.stdout.trim()) throw new Error(`validator produced no output\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function allFindingValues(report) {
  return (report.findings || []).flatMap((finding) => [
    finding.detail?.title,
    finding.detail?.item,
    finding.detail?.group,
  ]).filter(Boolean);
}

function expectCode(caseName, report, code) {
  if (!(report.findings || []).some((finding) => finding.code === code)) {
    throw new Error(`${caseName} did not report ${code}: ${JSON.stringify(report.findings, null, 2)}`);
  }
}

try {
  let report = run(
    writeFile("residual-noise-plan.md", facilityResidualNoisePlan()),
    writeFile("residual-noise-package.json", decodedApp()),
  );
  if (report.status !== "pass") throw new Error(`residual-noise fixture should pass: ${JSON.stringify(report.findings, null, 2)}`);
  const forbidden = [
    "Group",
    "Not applicable",
    "Edit Item and View Item forms for all lists",
    "Request and follow-up lifecycle workflows",
    "Operational views",
    "Operations and workload dashboards",
    "Placeholder app groups and permission intent",
    "Role-specific request and follow-up views",
  ];
  const values = allFindingValues(report);
  const leaked = forbidden.filter((value) => values.includes(value));
  if (leaked.length) throw new Error(`residual parser noise leaked into findings: ${leaked.join(", ")}`);
  results.push({ case: "residual Facility-style parser noise is ignored", status: "pass" });

  report = run(
    writeFile("missing-real-plan.md", facilityResidualNoisePlan({ extraDataList: "Inspection Tasks" })),
    writeFile("missing-real-package.json", decodedApp()),
  );
  expectCode("missing real data list", report, "PLAN_DATALISTS_MISSING");
  results.push({ case: "real missing canonical resource still fails", status: "pass" });

  report = run(
    writeFile("extra-real-plan.md", facilityResidualNoisePlan()),
    writeFile("extra-real-package.json", decodedApp({ extraList: "Unplanned Archive" })),
  );
  expectCode("extra real data list", report, "PLAN_DATALISTS_EXTRA_UNPLANNED");
  results.push({ case: "real extra generated resource still fails", status: "pass" });

  report = run(
    writeFile("partial-real-plan.md", facilityResidualNoisePlan()),
    writeFile("partial-real-package.json", decodedApp({ pages: ["Facility Operations Overview Archive", "Triage Queue", "Technician Workload", "SLA and Safety Dashboard"] })),
  );
  expectCode("partial page mismatch", report, "PLAN_PAGES_MISMATCH");
  results.push({ case: "real partial resource-name mismatch still fails", status: "pass" });

  console.log(JSON.stringify({ status: "pass", cases: results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
