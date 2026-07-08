#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/validate-data-filter-standard-group.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "data-filter-group-"));
const results = [];

try {
  expectPass("registry validates", ["--registry"]);
  expectPass("single loose data filter passes", ["--resource", writeJson("single-filter.json", pageResource({ singleLoose: true })), "--surface", "dashboard"]);
  expectPass("dashboard filters inside standard group pass", ["--resource", writeJson("dashboard-filter-group.json", pageResource()), "--surface", "dashboard"]);
  expectPass("master-detail workspace left panel filter groups pass", ["--resource", writeJson("master-detail-left-panel-filters.json", masterDetailWorkspaceResource()), "--surface", "dashboard"]);
  expectPass("data-list form filters inside standard group pass", ["--resource", writeJson("data-list-form-filter-group.json", pageResource()), "--surface", "data-list-form"]);
  expectPass("approval task filters inside standard group pass", ["--resource", writeJson("approval-task-filter-group.json", pageResource()), "--surface", "approval-form-task"]);
  expectPass("package with dashboard, data-list form, and approval task filter groups passes", ["--package", writeYapk("valid-filter-groups.yapk", { includeAllSurfaces: true })]);

  expectCode("multiple loose filters fail", ["--resource", writeJson("loose-filters.json", pageResource({ loose: true })), "--surface", "dashboard"], "DATA_FILTER_GROUP_REQUIRED_FOR_MULTIPLE_FILTERS");
  expectCode("one filter outside group fails when multiple filters exist", ["--resource", writeJson("mixed-filters.json", pageResource({ mixed: true })), "--surface", "dashboard"], "DATA_FILTER_GROUP_FILTER_OUTSIDE_GROUP");
  expectCode("mutated group columns fail", ["--resource", writeJson("mutated-columns.json", pageResource({ mutateColumns: true })), "--surface", "dashboard"], "DATA_FILTER_GROUP_GRID_COLUMNS_INVALID");
  expectCode("left panel filter group with more than two filters fails", ["--resource", writeJson("left-panel-too-many-filters.json", masterDetailWorkspaceResource({ tooManyFilters: true })), "--surface", "dashboard"], "DATA_FILTER_LEFT_PANEL_GROUP_TOO_MANY_FILTERS");
  expectCode("child scalar label layout fails", ["--resource", writeJson("bad-lablay.json", pageResource({ badLablay: true })), "--surface", "dashboard"], "DATA_FILTER_GROUP_CHILD_LABEL_LAYOUT_INVALID");
  expectCode("child missing fixed width fails", ["--resource", writeJson("bad-width.json", pageResource({ badWidth: true })), "--surface", "dashboard"], "DATA_FILTER_GROUP_CHILD_FIXED_WIDTH_MISSING");

  printSummary(0);
} catch (error) {
  results.push({ name: "unexpected test harness error", status: "fail", error: error.message });
  printSummary(1);
}

function masterDetailWorkspaceResource(options = {}) {
  const leftPanelGroup = {
    type: "container",
    nv_label: "left_panel_filter_group",
    children: [
      dataFilter("status_filter", "radio-filter"),
      dataFilter("priority_filter", "radio-filter"),
      ...(options.tooManyFilters ? [dataFilter("category_filter", "radio-filter")] : []),
    ],
  };
  return {
    type: "page",
    derivedFromDashboardPageLayoutTemplate: "dashboard-page-layouts-two-panel-workspace",
    attrs: { dashboardPageLayoutTemplateId: "dashboard-page-layouts-two-panel-workspace" },
    children: [
      {
        type: "container",
        nv_label: "main",
        children: [
          {
            type: "container",
            nv_label: "left_panel",
            children: [leftPanelGroup],
          },
          {
            type: "container",
            nv_label: "content_panel",
            children: [],
          },
        ],
      },
    ],
  };
}

function expectPass(name, args) {
  const result = run(args);
  results.push({ name, status: result.status === 0 ? "pass" : "fail", args, stdout: result.stdout.slice(0, 1000), stderr: result.stderr.slice(0, 1000) });
  assert.equal(result.status, 0, `${name}\n${result.stdout}\n${result.stderr}`);
}

function expectCode(name, args, code) {
  const result = run(args);
  const output = `${result.stdout}\n${result.stderr}`;
  results.push({ name, status: result.status !== 0 && output.includes(code) ? "pass" : "fail", args, expectedCode: code, stdout: result.stdout.slice(0, 1000), stderr: result.stderr.slice(0, 1000) });
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.match(output, new RegExp(code), `${name} should include ${code}\n${output}`);
}

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

function pageResource(options = {}) {
  const group = filterGroup(options);
  const children = options.singleLoose
    ? [dataFilter("department_filter", "radio-filter")]
    : options.loose
      ? [dataFilter("department_filter", "radio-filter"), dataFilter("period_filter", "relative-period")]
      : options.mixed
        ? [group, dataFilter("status_filter", "radio-filter")]
        : [group];
  return {
    type: "page",
    nv_label: "dashboard-page-layouts-v1.1",
    children: [
      {
        type: "container",
        nv_label: "Main",
        children: [
          {
            type: "container",
            nv_label: "Content",
            children: [
              {
                type: "container",
                nv_label: "content_card_wrapper",
                children: [
                  {
                    type: "container",
                    nv_label: "section_content_area",
                    children,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function filterGroup(options = {}) {
  const group = {
    type: "flex_grid",
    id: "dashboard_standard_filter_group",
    name: "Standard filter group",
    label: "Standard filter group",
    nv_label: "dashboard_standard_filter_group",
    displayLabel: [null, false],
    attrs: {
      ver: 1,
      columns: {
        "1": {
          list: [
            { value: 1, unit: "fr" },
            { value: 1, unit: "fr" },
            { value: 1, unit: "fr" },
            { value: 1, unit: "fr" },
          ],
          last: { value: 1, unit: "fr" },
        },
        "2": {
          list: [
            { value: 1, unit: "fr" },
            { value: 1, unit: "fr" },
          ],
          last: { value: 1, unit: "fr" },
        },
        "3": {
          list: [
            { value: 1, unit: "fr" },
          ],
          last: { value: 1, unit: "fr" },
        },
      },
      rows: {
        "1": {
          list: [
            { unit: "auto" },
          ],
          last: { unit: "auto" },
        },
      },
      cgap: {
        "1": 16,
      },
      cgapU: {
        "1": "px",
      },
      rgap: [null, 16],
      rgapU: [null, "px"],
    },
    children: [
      dataFilter("department_filter", "radio-filter"),
      dataFilter("period_filter", "relative-period"),
      dataFilter("status_filter", "radio-filter"),
    ],
  };
  if (options.mutateColumns) group.attrs.columns = { count: 6, type: "repeat", minmax: ["160px", "1fr"] };
  if (options.badLablay) group.children[0].attrs.lablay = "top";
  if (options.badWidth) group.children[0].attrs.common.positioning.width = [null, 160];
  return group;
}

function dataFilter(id, type) {
  return {
    type,
    id,
    name: id,
    nv_label: id,
    label: id,
    binding: `__filter_${id}`,
    attrs: {
      lab: { value: id, ty: [null, "xs-light"] },
      lablay: [null, "top"],
      placeholder: `Select ${id}`,
      edit: {
        pcolor: "var(--c--neutral-dark-hover)",
        placeholder: { color: "#5f6b7a" },
        normal: {
          border: {
            radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }],
          },
        },
      },
      common: {
        positioning: {
          widthtype: [null, "3", "1", "1"],
          width: [null, 200],
          widthu: [null, "px"],
        },
      },
      data: {
        list: { AppID: 41, ListID: "list_1", Type: 1, Title: "Loan Requests", ListSetID: "app_1" },
        field: "Text1",
        filter: [],
      },
      display_f: "Text1",
      value_f: "Text1",
    },
    children: [],
  };
}

function writeYapk(name, options = {}) {
  const decoded = {
    ListSet: { ListID: "app_1", Title: "Filter Group App" },
    Pages: [
      {
        Title: "Operations Dashboard",
        Type: 103,
        LayoutInResources: [{ Resource: JSON.stringify(pageResource()) }],
      },
    ],
    FormNewReports: options.includeAllSurfaces
      ? [
          {
            Title: "Loan Request View",
            LayoutInResources: [{ Resource: JSON.stringify(pageResource()) }],
          },
        ]
      : [],
    Forms: options.includeAllSurfaces
      ? [
          {
            Title: "Loan Approval",
            DefResource: JSON.stringify({
              pageurls: [
                {
                  type: 2,
                  formdef: JSON.stringify(pageResource()),
                },
              ],
            }),
          },
        ]
      : [],
    Childs: [],
    DataReports: [],
    PortalInfo: null,
  };
  const wrapper = {
    PackageId: "pkg_1",
    TenantID: "tenant_1",
    AppID: 41,
    ListID: "app_1",
    Title: "Filter Group App",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
  };
  return writeJson(name, wrapper);
}

function writeJson(name, value) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
  return file;
}

function printSummary(exitCode) {
  const status = results.every((result) => result.status === "pass") ? "pass" : "fail";
  console.log(JSON.stringify({ status, results }, null, 2));
  process.exit(exitCode || (status === "pass" ? 0 : 1));
}
