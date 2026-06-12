#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { validateDashboardGridTableCollections } from "./validate-dashboard-grid-table-collections.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-grid-table-gate-"));

try {
  run();
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

function run() {
  assertPass("valid grid-table Collection pattern passes", packagePath());
  assertFails("dashboard data-list control fails when Collection is required", packagePath({ useDataList: true }), "DASHBOARD_DATA_LIST_USED_WHEN_COLLECTION_REQUIRED");
  assertFails("Collection without header grid fails", packagePath({ omitHeaderGrid: true }), "DASHBOARD_GRID_TABLE_HEADER_GRID_MISSING");
  assertFails("header grid and Collection in separate controls fails", packagePath({ separateHeaderWrapper: true }), "DASHBOARD_GRID_TABLE_HEADER_GRID_MISSING");
  assertFails("wrapper missing attrs.style.gap fails", packagePath({ omitStyleGap: true }), "DASHBOARD_GRID_TABLE_WRAPPER_STYLE_GAP_MISSING");
  assertFails("wrapper missing attrs.container.gap fails", packagePath({ omitContainerGap: true }), "DASHBOARD_GRID_TABLE_WRAPPER_CONTAINER_GAP_MISSING");
  assertFails("Collection without detail link fails", packagePath({ omitDetailLink: true }), "DASHBOARD_COLLECTION_DETAIL_LINK_MISSING");
  assertFails("Collection detail link to missing custom layout fails", packagePath({ missingDetailLayout: true }), "DASHBOARD_COLLECTION_DETAIL_LAYOUT_MISSING");
  assertFails("Type 1 custom layout with LayoutView null fails", packagePath({ nullDetailLayoutView: true }), "DASHBOARD_TYPE1_DETAIL_LAYOUTVIEW_NULL");
  assertFails("enumerable helper field leaks fail", packagePath({ helperLeak: true }), "DASHBOARD_HELPER_METADATA_LEAK");
  assertFails("dashboard header visibility check fails when hideHeaderAll is missing", packagePath({ omitHideHeader: true }), "DASHBOARD_HEADER_HIDE_METADATA_MISSING");
  assertFails("dashboard title style check fails on small heading", packagePath({ smallTitle: true }), "DASHBOARD_TITLE_STYLE_TOO_SMALL");
  console.log("Dashboard grid-table Collection gate tests passed");
}

function assertPass(label, file) {
  const report = validateDashboardGridTableCollections(options(file));
  assert.equal(report.status, "pass", `${label}: ${JSON.stringify(report.findings, null, 2)}`);
}

function assertFails(label, file, code) {
  const report = validateDashboardGridTableCollections(options(file));
  assert.equal(report.status, "fail", `${label}: expected failure`);
  assert.ok(report.findings.some((finding) => finding.code === code), `${label}: expected ${code}, got ${report.findings.map((finding) => finding.code).join(", ")}`);
}

function options(file) {
  return {
    package: file,
    requireGridTableCollections: true,
    requireHideHeader: true,
    requireVisibleTitle: true,
    requireRowDetailLinks: true,
  };
}

function packagePath(flags = {}) {
  const file = path.join(tmp, `${Object.keys(flags).join("-") || "valid"}.yapk`);
  fs.writeFileSync(file, JSON.stringify({ Resource: encodeResource(decodedPackage(flags)) }, null, 2));
  return file;
}

function encodeResource(decoded) {
  return zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded))).toString("base64");
}

function decodedPackage(flags) {
  const listId = "list-tasks";
  const detailLayoutId = "layout-task-detail";
  const layouts = flags.missingDetailLayout ? [] : [{
    LayoutID: detailLayoutId,
    Type: 1,
    LayoutView: flags.nullDetailLayoutView ? null : "",
  }];
  const child = {
    List: { ListID: listId, Title: "Tasks" },
    Layouts: layouts,
  };
  if (flags.helperLeak) child.DetailLayoutID = detailLayoutId;

  return {
    App: { AppID: 41, Name: "Task Tracker" },
    Childs: [child],
    Pages: [{
      LayoutID: "dashboard-main",
      Type: 103,
      Title: "Dashboard",
      LayoutInResources: [{
        Resource: JSON.stringify(dashboardResource({ ...flags, listId, detailLayoutId })),
      }],
    }],
  };
}

function dashboardResource(flags) {
  return {
    type: "page",
    attrs: flags.omitHideHeader ? {} : { hideHeaderAll: true },
    children: [
      titleControl(flags),
      ...recordListControls(flags),
    ],
  };
}

function titleControl(flags) {
  return {
    type: "heading",
    attrs: {
      heads: {
        text: "Task Dashboard",
        ty: [null, flags.smallTitle ? "heading-md" : "h5-medium"],
        color: "var(--text-primary)",
      },
      common: { positioning: { widthtype: "fill" } },
    },
  };
}

function recordListControls(flags) {
  if (flags.useDataList) return [{ type: "data-list", attrs: { data: { list: { ListID: flags.listId } } } }];
  if (flags.separateHeaderWrapper) {
    return [
      wrapper([headerGrid()], "header-wrapper"),
      wrapper([collection(flags)], "collection-wrapper"),
    ];
  }
  return [wrapper([...(flags.omitHeaderGrid ? [] : [headerGrid()]), collection(flags)], "grid-table-wrapper", flags)];
}

function wrapper(children, id, flags = {}) {
  const attrs = { container: {}, style: {} };
  if (!flags.omitContainerGap) attrs.container.gap = 0;
  if (!flags.omitStyleGap) attrs.style.gap = [null, 0];
  return { type: "container", id, attrs, children };
}

function headerGrid() {
  return {
    type: "flex_grid",
    attrs: { cells: [{ text: "Task" }, { text: "Owner" }, { text: "Status" }] },
  };
}

function collection(flags) {
  const data = {
    list: { ListID: flags.listId },
    opentype: "slide",
    modalsize: 2,
  };
  if (!flags.omitDetailLink) data.link = flags.detailLayoutId;
  return {
    type: "collection",
    attrs: { data },
    children: [{ type: "flex_grid", attrs: { role: "row" } }],
  };
}
