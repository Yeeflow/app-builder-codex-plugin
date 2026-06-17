#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { addFinding, allControlsFromPages, collectPages, extractLayoutResources, isObject, normalizePackage, readPackageLike, safePath, scalar, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

export const DASHBOARD_ROOT_ZERO_PADDING = Object.freeze({
  top: "--sp--s0",
  right: "--sp--s0",
  bottom: "--sp--s0",
  left: "--sp--s0",
});
export const DASHBOARD_ROOT_PADDING_SHAPE = Object.freeze([null, DASHBOARD_ROOT_ZERO_PADDING]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package) usage(args.help ? 0 : 1);
  const report = inspectDashboardStyleShapes(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function inspectDashboardStyleShapes({ package: packagePath, strict = true } = {}) {
  const findings = [];
  let pkg;
  try {
    pkg = normalizePackage(readPackageLike(packagePath).decoded);
  } catch (error) {
    addFinding(findings, "error", "STYLE_PACKAGE_READ_FAILED", `Could not read package for dashboard style inspection: ${error.message}`);
    return buildReport(packagePath, findings);
  }

  let cardLikeCount = 0;
  let exportProvenCardCount = 0;
  const pages = collectPages(pkg);
  for (const page of pages) {
    validateDashboardRootContentPadding(page, findings);
  }
  for (const form of collectDataListCustomForms(pkg)) {
    validateDataListCustomFormRootContentPadding(form, findings);
  }
  for (const item of allControlsFromPages(pages)) {
    const attrs = item.control.attrs || {};
    const type = String(item.control.type || item.control.Type || "").toLowerCase();
    const wantsCard = type === "card" || attrs.role === "kpi-card" || attrs.role === "dashboard-card" || attrs.styleIntent === "card" || attrs["data-ui-role"] === "card";
    const hasWeakStyle = hasWeakUnsupportedStyle(attrs);
    const hasExportProven = hasExportProvenCardShape(attrs);
    const gridTable = attrs.role === "grid-table" || attrs.layoutIntent === "grid-table";

    if (wantsCard || hasWeakStyle || hasExportProven) {
      cardLikeCount += 1;
      if (hasExportProven) exportProvenCardCount += 1;
      if (!hasExportProven) {
        addFinding(findings, strict ? "error" : "warning", "DASHBOARD_CARD_EXPORT_PROVEN_STYLE_MISSING", "Card-like dashboard control must use export-proven attrs.common background, border, radius, and padding shapes.", {
          page: item.page.title,
          pointer: item.pointer,
        });
      }
    }
    if (hasWeakStyle) {
      addFinding(findings, strict ? "error" : "warning", "DASHBOARD_WEAK_UNSUPPORTED_STYLE_SHAPE", "Weak top-level style keys can look plausible in JSON while flattening at runtime; use export-proven attrs.common shapes or sandbox first.", {
        page: item.page.title,
        pointer: item.pointer,
      });
    }
    if (gridTable && type !== "collection") {
      addFinding(findings, "error", "DASHBOARD_GRID_TABLE_COLLECTION_SHAPE_REQUIRED", "Grid-table visual intent should use the export-proven Collection grid-table pattern, not a generic dashboard control.");
    }
  }

  return buildReport(packagePath, findings, { cardLikeCount, exportProvenCardCount });
}

export function normalizeDashboardRootContentPadding(resourceRoot) {
  return normalizeRootContentPadding(resourceRoot);
}

export function normalizeDataListCustomFormRootContentPadding(resourceRoot) {
  return normalizeRootContentPadding(resourceRoot);
}

function normalizeRootContentPadding(resourceRoot) {
  if (!isObject(resourceRoot)) return resourceRoot;
  resourceRoot.attrs = isObject(resourceRoot.attrs) ? resourceRoot.attrs : {};
  resourceRoot.attrs.container = isObject(resourceRoot.attrs.container) ? resourceRoot.attrs.container : {};
  resourceRoot.attrs.container.cw = "2";
  resourceRoot.attrs.container.padding = [null, { ...DASHBOARD_ROOT_ZERO_PADDING }];
  return resourceRoot;
}

function validateDashboardRootContentPadding(page, findings) {
  if (!isDashboardPage(page.page)) return;
  page.roots.forEach((root, index) => {
    const container = root?.attrs?.container;
    const cw = container?.cw;
    const padding = container?.padding;
    const valid = cw === "2" && isRequiredDashboardRootPadding(padding);
    if (!valid) {
      addFinding(findings, "error", "DASHBOARD_ROOT_CONTENT_PADDING_INVALID", "Dashboard/app page root Resource must set attrs.container.cw = \"2\" and attrs.container.padding to the exact token-array zero-padding shape [null, { top/right/bottom/left: \"--sp--s0\" }]. Scalar, object, numeric, attrs.common, and attrs.style padding shapes do not satisfy the root content-area gate.", {
        page: page.title,
        pointer: `Pages[${page.index}].LayoutInResources[${index}].Resource.attrs.container`,
        cw: scalar(cw),
        paddingShape: describePaddingShape(root?.attrs),
      });
    }
  });
}

function validateDataListCustomFormRootContentPadding(form, findings) {
  form.roots.forEach((root, index) => {
    const container = root?.attrs?.container;
    const cw = container?.cw;
    const padding = container?.padding;
    const valid = cw === "2" && isRequiredDashboardRootPadding(padding);
    if (!valid) {
      addFinding(findings, "error", "DATA_LIST_CUSTOM_FORM_ROOT_CONTENT_PADDING_INVALID", "Data-list custom form root Resource must set attrs.container.cw = \"2\" and attrs.container.padding to the exact token-array zero-padding shape [null, { top/right/bottom/left: \"--sp--s0\" }]. Scalar, object, numeric, attrs.common, and attrs.style padding shapes do not satisfy the form root content-area gate.", {
        list: form.listTitle,
        layout: form.title,
        pointer: `${form.path}.LayoutInResources[${index}].Resource.attrs.container`,
        cw: scalar(cw),
        paddingShape: describePaddingShape(root?.attrs),
      });
    }
  });
}

function collectDataListCustomForms(pkg) {
  const forms = [];
  for (const [childIndex, child] of pkg.children.entries()) {
    const listTitle = scalar(child.list.Title || child.list.Name || child.list.DisplayName || `Child ${childIndex + 1}`);
    for (const [layoutIndex, layout] of child.layouts.entries()) {
      if (scalar(layout.Type || layout.type) !== "1") continue;
      forms.push({
        childIndex,
        layoutIndex,
        listTitle,
        title: scalar(layout.Title || layout.Name || `Custom form ${layoutIndex + 1}`),
        path: `${pkg.raw?.Data ? "Data." : ""}Childs[${childIndex}].Layouts[${layoutIndex}]`,
        layout,
        roots: extractLayoutResources(layout),
      });
    }
  }
  return forms;
}

function isDashboardPage(page) {
  const type = scalar(page?.Type || page?.type || page?.LayoutType || page?.layoutType);
  return type === "103" || /dashboard|app page/i.test(scalar(page?.Title || page?.Name || page?.title));
}

function isRequiredDashboardRootPadding(value) {
  return Array.isArray(value)
    && value.length === 2
    && value[0] === null
    && isObject(value[1])
    && Object.keys(value[1]).sort().join(",") === "bottom,left,right,top"
    && value[1].top === DASHBOARD_ROOT_ZERO_PADDING.top
    && value[1].right === DASHBOARD_ROOT_ZERO_PADDING.right
    && value[1].bottom === DASHBOARD_ROOT_ZERO_PADDING.bottom
    && value[1].left === DASHBOARD_ROOT_ZERO_PADDING.left;
}

function describePaddingShape(attrs) {
  if (!isObject(attrs)) return "attrs missing";
  if (attrs.container?.padding !== undefined) {
    if (Array.isArray(attrs.container.padding)) return "attrs.container.padding array";
    if (isObject(attrs.container.padding)) return "attrs.container.padding object";
    return `attrs.container.padding ${typeof attrs.container.padding}`;
  }
  if (attrs.common?.padding !== undefined) return "attrs.common.padding only";
  if (attrs.style?.padding !== undefined) return "attrs.style.padding only";
  return "attrs.container.padding missing";
}

function hasExportProvenCardShape(attrs) {
  return Boolean(
    attrs.common?.background?.normal?.classic?.color &&
    attrs.common?.border?.normal?.type &&
    attrs.common?.border?.normal?.width !== undefined &&
    attrs.common?.border?.normal?.color &&
    attrs.common?.border?.normal?.radius !== undefined &&
    attrs.common?.padding !== undefined,
  );
}

function hasWeakUnsupportedStyle(attrs) {
  return Boolean(
    attrs.style?.border ||
    attrs.style?.radius !== undefined ||
    attrs.style?.background ||
    attrs.border ||
    attrs.radius !== undefined ||
    attrs.background,
  );
}

function buildReport(packagePath, findings, summary = {}) {
  return {
    status: statusFromFindings(findings),
    package: safePath(packagePath),
    summary,
    proofBoundary: "Style-shape validation checks export-proven JSON structure only. Use sandbox pages and runtime screenshots before claiming UI quality.",
    findings,
  };
}

function parseArgs(argv) {
  const args = { strict: true };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--package") args.package = argv[++i];
    else if (arg === "--warn-only") args.strict = false;
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/inspect-dashboard-style-shapes.mjs --package <decoded.json|app.yapk> [--warn-only]");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
