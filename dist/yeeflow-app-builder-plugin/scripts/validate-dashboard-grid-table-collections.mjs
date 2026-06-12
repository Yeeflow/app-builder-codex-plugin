#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk, walk } from "./lib/yapk-decode-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateDashboardGridTableCollections(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDashboardGridTableCollections(options) {
  const findings = [];
  if (!options.package || !fs.existsSync(options.package)) {
    return fail("YAPK_PACKAGE_MISSING", "Package file is missing.", { package: options.package || "" });
  }

  let decoded;
  try {
    ({ decoded } = readDecodedYapk(options.package));
  } catch (error) {
    return fail("YAPK_RESOURCE_DECODE_FAILED", `Could not decode package Resource: ${error.message}`);
  }

  const detailLayouts = buildDetailLayoutIndex(decoded, findings);
  detectHelperLeaks(decoded, findings);
  const dashboardPages = collectDashboardPages(decoded);
  let collectionCount = 0;
  let dataListCount = 0;

  dashboardPages.forEach((page) => {
    validateDashboardPage(page, { options, detailLayouts, findings });
    dataListCount += page.controls.filter((entry) => entry.control.type === "data-list").length;
    const collections = page.controls.filter((entry) => entry.control.type === "collection");
    collectionCount += collections.length;
    collections.forEach((entry) => validateGridTableCollection(entry, page, { options, detailLayouts, findings }));
    if (options.requireGridTableCollections) {
      page.controls.filter((entry) => entry.control.type === "data-list").forEach((entry) => {
        findings.push(error("DASHBOARD_DATA_LIST_USED_WHEN_COLLECTION_REQUIRED", "Dashboard record-list section uses data-list where grid-table Collection is required.", { page: page.title, path: entry.pointer }));
      });
    }
  });

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    package: path.resolve(options.package),
    dashboardPages: dashboardPages.length,
    collections: collectionCount,
    dataListControls: dataListCount,
    findings,
  };
}

function validateDashboardPage(page, context) {
  const { options, findings } = context;
  if (options.requireHideHeader && page.resource?.attrs?.hideHeaderAll !== true) {
    findings.push(error("DASHBOARD_HEADER_HIDE_METADATA_MISSING", "Dashboard page should set attrs.hideHeaderAll = true when app shell/navigation provides page context.", { page: page.title, path: page.pointer }));
  }
  const titleControls = page.controls.filter((entry) => isTextLike(entry.control) && hasTitleText(entry.control));
  if (options.requireVisibleTitle) {
    if (!titleControls.length) {
      findings.push(error("DASHBOARD_TITLE_CONTROL_MISSING", "Dashboard page should include a visible title Text/Heading control.", { page: page.title, path: page.pointer }));
    }
    for (const entry of titleControls) {
      validateTextStyle(entry.control, entry.pointer, page, findings, { requireTitleStyle: true });
    }
  }
  for (const entry of page.controls.filter((item) => isTextLike(item.control))) {
    validateTextStyle(entry.control, entry.pointer, page, findings, { requireTitleStyle: false });
  }
}

function validateGridTableCollection(entry, page, context) {
  const { options, detailLayouts, findings } = context;
  const { control, pointer, parent, parentPointer, siblingIndex } = entry;
  const header = findPairedHeader(parent, siblingIndex);
  if (!header) {
    findings.push(error("DASHBOARD_GRID_TABLE_HEADER_GRID_MISSING", "Grid-table Collection must be paired with a header flex_grid in the same wrapper container.", { page: page.title, path: pointer }));
  }
  if (!parent || parent.type !== "container") {
    findings.push(error("DASHBOARD_GRID_TABLE_WRAPPER_MISSING", "Header flex_grid and Collection must be wrapped together in one container.", { page: page.title, path: pointer }));
  } else {
    if (parent?.attrs?.container?.gap !== 0) {
      findings.push(error("DASHBOARD_GRID_TABLE_WRAPPER_CONTAINER_GAP_MISSING", "Grid-table wrapper must set attrs.container.gap = 0.", { page: page.title, path: `${parentPointer}.attrs.container.gap` }));
    }
    if (!Array.isArray(parent?.attrs?.style?.gap) || parent.attrs.style.gap[0] !== null || parent.attrs.style.gap[1] !== 0) {
      findings.push(error("DASHBOARD_GRID_TABLE_WRAPPER_STYLE_GAP_MISSING", "Grid-table wrapper must set attrs.style.gap = [null, 0].", { page: page.title, path: `${parentPointer}.attrs.style.gap` }));
    }
  }

  const itemGrid = firstDescendant(control, (node) => node.type === "flex_grid");
  if (!itemGrid) {
    findings.push(error("DASHBOARD_GRID_TABLE_ITEM_GRID_MISSING", "Grid-table Collection must contain a repeated flex_grid item row.", { page: page.title, path: pointer }));
  }
  if (options.requireRowDetailLinks !== false) validateRowDetailLink(control, pointer, page, detailLayouts, findings);
}

function validateRowDetailLink(collection, pointer, page, detailLayouts, findings) {
  const data = collection?.attrs?.data || {};
  const listId = String(data?.list?.ListID || "");
  const link = data.link === undefined || data.link === null ? "" : String(data.link);
  if (!link) {
    findings.push(error("DASHBOARD_COLLECTION_DETAIL_LINK_MISSING", "Collection row-click detail requires attrs.data.link to a concrete custom detail layout.", { page: page.title, path: `${pointer}.attrs.data.link`, listId }));
    return;
  }
  const layout = detailLayouts.byLayoutId.get(link);
  if (!layout) {
    findings.push(error("DASHBOARD_COLLECTION_DETAIL_LAYOUT_MISSING", "Collection attrs.data.link points to a missing custom detail layout.", { page: page.title, path: `${pointer}.attrs.data.link`, link, listId }));
  } else if (listId && layout.listId !== listId) {
    findings.push(error("DASHBOARD_COLLECTION_DETAIL_LAYOUT_LIST_MISMATCH", "Collection detail layout must belong to the Collection source list.", { page: page.title, path: `${pointer}.attrs.data.link`, link, listId, layoutListId: layout.listId }));
  }
  if (data.opentype !== "slide") {
    findings.push(error("DASHBOARD_COLLECTION_DETAIL_OPENTYPE_INVALID", "Collection row-click detail must set attrs.data.opentype = \"slide\".", { page: page.title, path: `${pointer}.attrs.data.opentype`, actual: data.opentype ?? null }));
  }
  if (Number(data.modalsize) !== 2) {
    findings.push(error("DASHBOARD_COLLECTION_DETAIL_MODALSIZE_INVALID", "Collection row-click detail must set attrs.data.modalsize = 2.", { page: page.title, path: `${pointer}.attrs.data.modalsize`, actual: data.modalsize ?? null }));
  }
}

function validateTextStyle(control, pointer, page, findings, { requireTitleStyle }) {
  const heads = control?.attrs?.heads || control?.attrs?.headc || {};
  const ty = heads.ty || control?.attrs?.heads?.ty;
  const color = heads.color || control?.attrs?.heads?.color;
  const widthType = control?.attrs?.common?.positioning?.widthtype || control?.attrs?.common?.widthtype;
  if (requireTitleStyle && !(Array.isArray(ty) && ty[1] === "h5-medium")) {
    findings.push(error("DASHBOARD_TITLE_STYLE_TOO_SMALL", "Dashboard page title should use attrs.heads.ty = [null, \"h5-medium\"] unless another validated style is intentionally planned.", { page: page.title, path: `${pointer}.attrs.heads.ty` }));
  }
  if (!ty) {
    findings.push(error("DASHBOARD_TEXT_TYPOGRAPHY_METADATA_MISSING", "Text controls must include token typography metadata.", { page: page.title, path: `${pointer}.attrs.heads.ty` }));
  }
  if (color !== undefined && typeof color !== "string") {
    findings.push(error("DASHBOARD_TEXT_COLOR_METADATA_INVALID", "Text control color should be a plain string or validated color token.", { page: page.title, path: `${pointer}.attrs.heads.color` }));
  }
  if (requireTitleStyle && !widthType) {
    findings.push(error("DASHBOARD_TEXT_WIDTH_METADATA_MISSING", "Dashboard title Text control should include width/positioning metadata where needed for designer fidelity.", { page: page.title, path: `${pointer}.attrs.common.positioning.widthtype` }));
  }
}

function buildDetailLayoutIndex(decoded, findings) {
  const byLayoutId = new Map();
  asArray(decoded?.Childs).forEach((child, childIndex) => {
    const listId = String(child?.List?.ListID || "");
    asArray(child?.Layouts).forEach((layout, layoutIndex) => {
      const layoutId = String(layout?.LayoutID || "");
      if (String(layout?.Type) === "1" && layoutId) {
        byLayoutId.set(layoutId, { layout, listId, childIndex, layoutIndex });
        if (layout.LayoutView === null) {
          findings.push(error("DASHBOARD_TYPE1_DETAIL_LAYOUTVIEW_NULL", "Custom Type 1 detail layout LayoutView must use a schema-compatible value such as an empty string, not null.", { path: `decoded.Childs[${childIndex}].Layouts[${layoutIndex}].LayoutView`, layoutId, listId }));
        }
      }
    });
  });
  return { byLayoutId };
}

function detectHelperLeaks(decoded, findings) {
  walk(decoded, (value, pointer) => {
    if (!isObject(value)) return;
    for (const key of Object.keys(value)) {
      if (/^(DetailLayoutID|__.*|_helper|helper[A-Z_].*)$/.test(key)) {
        findings.push(error("DASHBOARD_HELPER_METADATA_LEAK", "Internal helper metadata must not be enumerable on encoded package objects.", { path: `${pointer}.${key}`, key }));
      }
    }
  });
}

function collectDashboardPages(decoded) {
  const pages = [];
  asArray(decoded?.Pages).forEach((page, pageIndex) => {
    if (String(page?.Type) !== "103") return;
    asArray(page?.LayoutInResources).forEach((resource, resourceIndex) => {
      const parsed = parseJsonMaybe(resource?.Resource);
      if (!isObject(parsed)) return;
      const controls = [];
      collectControls(parsed, controls, "$", null, "", -1);
      pages.push({
        title: String(page?.Title || page?.Name || page?.LayoutID || `dashboard-${pageIndex}`),
        layoutId: String(page?.LayoutID || ""),
        pointer: `decoded.Pages[${pageIndex}].LayoutInResources[${resourceIndex}].Resource`,
        resource: parsed,
        controls,
      });
    });
  });
  return pages;
}

function collectControls(node, out, pointer, parent, parentPointer, siblingIndex) {
  if (!isObject(node)) return;
  if (node.type) out.push({ control: node, pointer, parent, parentPointer, siblingIndex });
  for (const key of ["children", "columns", "controls"]) {
    if (Array.isArray(node[key])) {
      node[key].forEach((child, index) => collectControls(child, out, `${pointer}.${key}[${index}]`, node, pointer, index));
    }
  }
}

function findPairedHeader(parent, collectionIndex) {
  const siblings = asArray(parent?.children);
  for (let index = collectionIndex - 1; index >= 0; index -= 1) {
    if (siblings[index]?.type === "flex_grid") return siblings[index];
    if (siblings[index]?.type === "collection") return null;
  }
  return null;
}

function firstDescendant(node, predicate) {
  let found = null;
  function visit(value) {
    if (found || !isObject(value)) return;
    if (predicate(value)) {
      found = value;
      return;
    }
    for (const key of ["children", "columns", "controls"]) asArray(value[key]).forEach(visit);
  }
  asArray(node?.children).forEach(visit);
  return found;
}

function isTextLike(control) {
  return ["heading", "text", "text-editor"].includes(String(control?.type || ""));
}

function hasTitleText(control) {
  const text = JSON.stringify(control || {});
  return /title|dashboard|tasks|portfolio|reports|administration/i.test(text);
}

function fail(code, message, details = {}) {
  return { status: "fail", findings: [error(code, message, details)] };
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function parseArgs(argv) {
  const args = { requireRowDetailLinks: true };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--package") args.package = argv[++i];
    else if (token === "--require-grid-table-collections") args.requireGridTableCollections = true;
    else if (token === "--require-hide-header") args.requireHideHeader = true;
    else if (token === "--require-visible-title") args.requireVisibleTitle = true;
    else if (token === "--no-require-row-detail-links") args.requireRowDetailLinks = false;
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log("Usage: node scripts/validate-dashboard-grid-table-collections.mjs --package <app.yapk> [--require-grid-table-collections] [--require-hide-header] [--require-visible-title] [--no-require-row-detail-links]");
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
