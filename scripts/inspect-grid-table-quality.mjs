#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { addFinding, allControlsFromPages, asArray, collectPages, getControlText, normalizePackage, readPackageLike, safePath, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package) usage(args.help ? 0 : 1);
  const report = inspectGridTableQuality(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function inspectGridTableQuality({ package: packagePath, requireGridTable = false } = {}) {
  const findings = [];
  let pkg;
  try {
    pkg = normalizePackage(readPackageLike(packagePath).decoded);
  } catch (error) {
    addFinding(findings, "error", "GRID_TABLE_PACKAGE_READ_FAILED", `Could not read package for grid/table quality inspection: ${error.message}`);
    return buildReport(packagePath, findings);
  }
  const controls = allControlsFromPages(collectPages(pkg));
  const planned = controls.filter(({ control }) => control.attrs?.layoutIntent === "grid-table" || control.attrs?.role === "grid-table" || control.attrs?.gridTablePlanned === true);
  const collections = controls.filter(({ control }) => String(control.type || control.Type || "").toLowerCase() === "collection");

  if (requireGridTable && !planned.length && !collections.length) {
    addFinding(findings, "error", "GRID_TABLE_PLANNED_CONTROL_MISSING", "Grid-table planned but no Collection grid-table control exists.");
  }
  for (const item of planned.length ? planned : collections) {
    const type = String(item.control.type || item.control.Type || "").toLowerCase();
    if (type === "data-list" && requireGridTable) {
      addFinding(findings, "error", "DASHBOARD_DATA_LIST_USED_WHEN_COLLECTION_REQUIRED", "Dashboard data-list must not be used when Collection grid-table was intended.", { page: item.page.title });
      continue;
    }
    if (type !== "collection") continue;
    const columns = collectColumns(item.control);
    if (columns.length === 0) addFinding(findings, "error", "GRID_TABLE_COLUMNS_MISSING", "Collection grid-table templates must define columns.", { page: item.page.title });
    if (columns.some((column) => !meaningfulHeader(column))) {
      addFinding(findings, "error", "GRID_TABLE_HEADERS_NOT_MEANINGFUL", "Grid-table headers must be meaningful, not blank/default.", { page: item.page.title });
    }
    if (!hasItemTemplate(item.control)) addFinding(findings, "error", "GRID_TABLE_ITEM_TEMPLATE_EMPTY", "Collection grid-table item templates must not be empty.", { page: item.page.title });
    if (!hasMeaningfulEmptyState(item.control)) addFinding(findings, "error", "GRID_TABLE_EMPTY_STATE_MISSING", "Collection grid-table needs a meaningful empty state.", { page: item.page.title });
    if (item.control.attrs?.rowActionPlanned === true && !hasRowAction(item.control)) {
      addFinding(findings, "error", "GRID_TABLE_ROW_ACTION_LINK_MISSING", "Planned row/action links must be present on Collection grid-table controls.", { page: item.page.title });
    }
  }

  return buildReport(packagePath, findings, { plannedGridTableCount: planned.length, collectionCount: collections.length });
}

function collectColumns(control) {
  const attrs = control.attrs || {};
  return asArray(attrs.columns || attrs.listarr || attrs.headers || attrs.cells || attrs.grid?.columns);
}

function meaningfulHeader(column) {
  const text = typeof column === "string" ? column : getControlText({ attrs: column, ...column });
  return Boolean(text.trim()) && !/^(column|field|text|header|container)$/i.test(text.trim());
}

function hasItemTemplate(control) {
  return asArray(control.children).some((child) => asArray(child.children).length || getControlText(child).trim() || child.attrs?.field || child.attrs?.data?.field);
}

function hasMeaningfulEmptyState(control) {
  const text = getControlText({ attrs: control.attrs?.emptyState || control.attrs?.empty || {} });
  return Boolean(text.trim()) && !/^(no data|empty|blank)$/i.test(text.trim());
}

function hasRowAction(control) {
  const data = control.attrs?.data || {};
  return Boolean(data.link || asArray(control.attrs?.actions).length || control.attrs?.rowAction || control.attrs?.control_action);
}

function buildReport(packagePath, findings, summary = {}) {
  return {
    status: statusFromFindings(findings),
    package: safePath(packagePath),
    summary,
    proofBoundary: "Grid/table quality validation checks generated control structure. Runtime row rendering and click behavior require separate runtime proof.",
    findings,
  };
}

function parseArgs(argv) {
  const args = { requireGridTable: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--package") args.package = argv[++i];
    else if (arg === "--require-grid-table") args.requireGridTable = true;
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/inspect-grid-table-quality.mjs --package <decoded.json|app.yapk> [--require-grid-table]");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
