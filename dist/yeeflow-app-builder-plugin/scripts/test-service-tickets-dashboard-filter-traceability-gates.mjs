#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { materializeFullAppGeneratedFinal } from "./materialize-full-app-generated-final.mjs";
import { validateRuntimeBindingLessons } from "./validate-runtime-binding-lessons.mjs";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "service-tickets-filter-traceability-"));
const specPath = path.join(tmpDir, "functional-specification.md");
const planPath = path.join(tmpDir, "yeeflow-app-plan.md");
const outDir = path.join(tmpDir, "dist");

fs.writeFileSync(specPath, `# Service Tickets Management Functional Specification

The application manages help desk tickets with ticket status, priority, requester, category, and agent assignment. The Service Tickets Dashboard uses a two-panel workspace with a left ticket list and a right detail panel.
`);

fs.writeFileSync(planPath, `# Service Tickets Management - Yeeflow App Plan

## 1. Application Overview

Application Name: Service Tickets Management

## 4. Data Lists and Document Libraries Plan

### 4.1 Tickets

| Display Name | Exact Yeeflow Field Type | Exact Yeeflow Control Type | Choice Values |
| --- | --- | --- | --- |
| Ticket Number | Text | input | |
| Requester | Text | input | |
| Category | Text | select | Incident, Service Request, Change Request |
| Priority | Text | select | Low, Medium, High, Critical |
| Assigned Agent | Text | input | |
| Created Date | Datetime | date | |
| Due Date | Datetime | date | |
| Description | Text | textarea | |

## 14. Dashboard Pages Plan

### 14.1 Service Tickets Dashboard

| Dashboard Page | Selected Dashboard Page Layout Template | Purpose |
| --- | --- | --- |
| Service Tickets Dashboard | dashboard-page-layouts-two-panel-workspace | Manage and review service tickets in a master-detail workspace. |

| Dashboard Page | Dataset Region | Source Resource | Selected Collection Template | Display Fields |
| --- | --- | --- | --- | --- |
| Service Tickets Dashboard | Ticket queue | Tickets | collection_control_grid_table | Ticket Number, Requester, Category, Priority, Status |

| Dashboard Page | Filter Name | Source Resource | Field |
| --- | --- | --- | --- |
| Service Tickets Dashboard | Priority | Tickets | Priority |
| Service Tickets Dashboard | Status | Tickets | Status |

## 15. Application Navigation Plan

| Group | Item | Type |
| --- | --- | --- |
| Operations | Service Tickets Dashboard | Dashboard |
| Operations | Tickets | Data List |
`);

const report = materializeFullAppGeneratedFinal({
  cwd: tmpDir,
  functionalSpec: specPath,
  appPlan: planPath,
  outDir,
  allowFixtureApiIdsForTests: true,
  title: "Service Tickets Management",
});

assert.equal(report.status, "pass", JSON.stringify(report, null, 2));
const decodedPath = report.outputs.decodedResource;
const decoded = JSON.parse(fs.readFileSync(decodedPath, "utf8"));
const tickets = decoded.Childs.find((child) => child.List?.Title === "Tickets");
assert.ok(tickets, "Tickets data list should be generated");
const displayToField = new Map(tickets.Fields.map((field) => [field.DisplayName, field.FieldName]));
assert.ok(displayToField.has("Priority"), "Priority should be materialized from the planned filter/data-list fields");
assert.ok(displayToField.has("Status"), "Status should be inferred from the Dashboard filter plan and materialized on Tickets");

const dashboardLayout = decoded.Pages.find((page) => page.Title === "Service Tickets Dashboard");
assert.ok(dashboardLayout, "Service Tickets Dashboard should be generated");
const dashboard = JSON.parse(dashboardLayout.LayoutInResources[0].Resource);
const serializedDashboard = JSON.stringify(dashboard);
assert.equal(serializedDashboard.includes("__filter_filter_Status"), false, "unproven Status select-filter consumer should not be emitted");
assert.equal(serializedDashboard.includes("__filter_filter_Priority"), false, "unproven Priority select-filter consumer should not be emitted");

const runtimeReport = validateRuntimeBindingLessons(decoded);
assert.equal(runtimeReport.status, "pass", JSON.stringify(runtimeReport, null, 2));

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log("service tickets dashboard filter traceability regression tests passed");
