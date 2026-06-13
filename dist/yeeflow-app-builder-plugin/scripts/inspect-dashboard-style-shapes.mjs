#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { addFinding, allControlsFromPages, collectPages, normalizePackage, readPackageLike, safePath, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

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
  for (const item of allControlsFromPages(collectPages(pkg))) {
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
