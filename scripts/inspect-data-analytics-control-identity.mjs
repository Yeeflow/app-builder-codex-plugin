#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import {
  addFinding,
  allControlsFromPages,
  asArray,
  collectFieldMaps,
  collectPages,
  isObject,
  normalizePackage,
  readJsonFile,
  readPackageLike,
  safePath,
  scalar,
  statusFromFindings,
} from "./lib/yeeflow-ui-hard-gate-utils.mjs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ANALYTICS_TYPES = new Map([
  ["pie-chart", "Pie chart"],
  ["pie", "Pie chart"],
  ["column-chart", "Column chart"],
  ["bar-chart", "Column chart"],
  ["line-chart", "Line chart"],
  ["line", "Line chart"],
  ["gauge", "Gauge"],
  ["funnel-chart", "Funnel chart"],
  ["funnel", "Funnel chart"],
  ["color-block-heatmap", "Color block heatmap"],
  ["heatmap", "Color block heatmap"],
  ["summary", "Summary"],
  ["summary-card", "Summary"],
  ["summary_control", "Summary"],
  ["report-summary", "Summary"],
  ["pivot-table", "Pivot table"],
  ["pivot", "Pivot table"],
]);

const EXTS_REQUIRED = new Map([
  ["Summary", { category: "___Pivot___", key: "summary" }],
  ["Pivot table", { category: "___Pivot___", key: "PivotTable" }],
]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package) usage(args.help ? 0 : 1);
  const report = inspectDataAnalyticsControlIdentity(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function inspectDataAnalyticsControlIdentity({ package: packagePath, lineage: lineagePath } = {}) {
  const findings = [];
  let pkg;
  try {
    pkg = normalizePackage(readPackageLike(packagePath).decoded);
  } catch (error) {
    addFinding(findings, "error", "ANALYTICS_PACKAGE_READ_FAILED", `Could not read package for Data Analytics control inspection: ${error.message}`);
    return buildReport(packagePath, findings);
  }

  let lineage = null;
  if (lineagePath) {
    try {
      lineage = readJsonFile(lineagePath);
    } catch (error) {
      addFinding(findings, "error", "ANALYTICS_LINEAGE_READ_FAILED", `Could not read analytics lineage metadata: ${error.message}`);
    }
  }

  const fieldMaps = collectFieldMaps(pkg);
  const pages = collectPages(pkg);
  const analytics = allControlsFromPages(pages)
    .map((item) => ({ ...item, analyticsType: analyticsType(item.control) }))
    .filter((item) => item.analyticsType);

  for (const item of analytics) {
    validateAnalyticsControl(item, fieldMaps, findings);
  }
  if (lineage) validateUpgradeLineage(analytics, lineage, findings);

  return buildReport(packagePath, findings, {
    analyticsControlCount: analytics.length,
    analyticsTypes: [...new Set(analytics.map((item) => item.analyticsType))].sort(),
  });
}

function validateAnalyticsControl(item, fieldMaps, findings) {
  const control = item.control;
  const controlId = scalar(control.id || control.ID || control.controlId);
  const label = scalar(control.attrs?.nv_label || control.title || control.name || item.analyticsType);
  const exportProvenIdShape = control.attrs?.exportProvenRuntimeSafeIdShape === true
    || control.exportProvenRuntimeSafeIdShape === true;

  if (!controlId) {
    addFinding(findings, "error", "ANALYTICS_CONTROL_ID_MISSING", "Data Analytics controls require explicit stable control IDs.", { page: item.page.title, analyticsType: item.analyticsType, control: label });
  } else if (!UUID_RE.test(controlId) && !exportProvenIdShape) {
    addFinding(findings, "error", "ANALYTICS_CONTROL_ID_NOT_RUNTIME_SAFE", "Data Analytics control IDs must be UUID-based unless an export-proven Yeeflow sample proves another ID shape for that exact control type.", { page: item.page.title, analyticsType: item.analyticsType, controlId });
  }

  const requiredExt = EXTS_REQUIRED.get(item.analyticsType);
  if (requiredExt) validateExtRegistration(item, controlId, requiredExt, findings);
  else validateOptionalExts(item, controlId, findings);

  validateDesignerShape(item, fieldMaps, findings);

  if (control.attrs?.runtimeProofClaimed === true || control.runtimeProofClaimed === true) {
    if (control.attrs?.runtimeEvidenceConfirmed !== true && control.runtimeEvidenceConfirmed !== true) {
      addFinding(findings, "error", "ANALYTICS_RUNTIME_PROOF_EVIDENCE_MISSING", "Do not claim runtime proof for Data Analytics controls unless runtime screenshot/evidence confirms the control renders correctly.", { page: item.page.title, analyticsType: item.analyticsType, controlId });
    }
  }
}

function validateExtRegistration(item, controlId, requiredExt, findings) {
  if (!controlId) return;
  const exts = item.page.roots.flatMap((root) => asArray(root.exts || root.Exts));
  const matchingExt = exts.find((entry) =>
    scalar(entry.i || entry.id || entry.ID) === controlId
    && scalar(entry.category) === requiredExt.category
    && scalar(entry.key) === requiredExt.key
  );
  if (!matchingExt) {
    addFinding(findings, "error", "ANALYTICS_EXTS_REGISTRATION_MISSING", "Data Analytics control requires matching Resource.exts[] registration for its export-proven control type.", { page: item.page.title, analyticsType: item.analyticsType, controlId });
  }
  if (!item.page.reportIds.includes(controlId)) {
    addFinding(findings, "error", "ANALYTICS_REPORTIDS_REGISTRATION_MISSING", "Data Analytics controls with report registration requirements must appear in page Resource.ReportIds[].", { page: item.page.title, analyticsType: item.analyticsType, controlId });
  }
}

function validateOptionalExts(item, controlId, findings) {
  if (!controlId) return;
  const exts = item.page.roots.flatMap((root) => asArray(root.exts || root.Exts));
  const related = exts.filter((entry) => [entry.i, entry.id, entry.ID].map(scalar).some(Boolean));
  for (const ext of related) {
    if (scalar(ext.i || ext.id || ext.ID) === controlId) continue;
    if (scalar(ext.forControlType || ext.controlType) === item.analyticsType) {
      addFinding(findings, "error", "ANALYTICS_EXTS_ID_MISMATCH", "Resource.exts[].i must match the Data Analytics control ID when an analytics ext entry is present.", { page: item.page.title, analyticsType: item.analyticsType, controlId });
    }
  }
}

function validateDesignerShape(item, fieldMaps, findings) {
  const attrs = item.control.attrs || {};
  const data = attrs.data || attrs.source || {};
  const settings = attrs.settings || attrs.exts?.[0]?.attr?.settings || attrs.chart || {};
  const listId = scalar(data.list?.ListID || data.ListID || attrs.list?.ListID || settings.listId || settings.ListID);
  const fieldRefs = collectFieldRefs(attrs);

  if (!Object.keys(data).length && !Object.keys(settings).length) {
    addFinding(findings, "error", "ANALYTICS_DESIGNER_METADATA_MISSING", "Data Analytics controls require designer-shaped settings/data-source metadata.", { page: item.page.title, analyticsType: item.analyticsType });
  }
  if (listId && !fieldMaps.has(listId)) {
    addFinding(findings, "error", "ANALYTICS_DATA_SOURCE_INVALID", "Data Analytics control data source must resolve to a real list.", { page: item.page.title, analyticsType: item.analyticsType, listId });
  }
  if (listId && fieldRefs.length) {
    const fields = fieldMaps.get(listId)?.fields;
    for (const fieldRef of fieldRefs) {
      if (/placeholder|sample|fake|field-id|required/i.test(fieldRef)) {
        addFinding(findings, "error", "ANALYTICS_PLACEHOLDER_FIELD_REFERENCE", "Data Analytics controls must not use placeholder fields or invented field IDs.", { page: item.page.title, analyticsType: item.analyticsType, field: fieldRef });
      } else if (fields && !fields.has(fieldRef)) {
        addFinding(findings, "error", "ANALYTICS_FIELD_REFERENCE_INVALID", "Data Analytics control field references must resolve to source-list field metadata.", { page: item.page.title, analyticsType: item.analyticsType, field: fieldRef });
      }
    }
  }
}

function validateUpgradeLineage(analytics, lineage, findings) {
  const previous = lineage.previousAnalyticsControlIds || lineage.existingAnalyticsControlIds || {};
  const added = new Set(asArray(lineage.newAnalyticsControlIds || lineage.addedAnalyticsControlIds).map(scalar));
  const currentByKey = new Map();
  for (const item of analytics) {
    const key = scalar(item.control.attrs?.semanticKey || item.control.semanticKey || item.control.attrs?.nv_label || item.control.title || item.analyticsType);
    const id = scalar(item.control.id || item.control.ID || item.control.controlId);
    if (key && id) currentByKey.set(key, id);
  }
  for (const [key, previousId] of Object.entries(previous)) {
    const currentId = currentByKey.get(key);
    if (!currentId) {
      addFinding(findings, "error", "ANALYTICS_UPGRADE_CONTROL_MISSING", "Upgrade workflow must preserve existing Data Analytics controls unless removal is explicitly in scope.", { semanticKey: key });
    } else if (scalar(previousId) !== currentId) {
      addFinding(findings, "error", "ANALYTICS_UPGRADE_CONTROL_ID_DRIFT", "Upgrade/new-version workflows must preserve existing Data Analytics control IDs.", { semanticKey: key });
    }
  }
  for (const item of analytics) {
    const key = scalar(item.control.attrs?.semanticKey || item.control.semanticKey || item.control.attrs?.nv_label || item.control.title || item.analyticsType);
    const id = scalar(item.control.id || item.control.ID || item.control.controlId);
    if (!previous[key] && id && !added.has(id) && lineage.requestedOperation === "update") {
      addFinding(findings, "warning", "ANALYTICS_UPGRADE_NEW_CONTROL_NOT_DECLARED", "New analytics controls in upgrades should be declared as newly added UUID/API-issued controls.", { semanticKey: key || item.analyticsType });
    }
  }
}

function collectFieldRefs(value, refs = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectFieldRefs(item, refs));
  } else if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (/^(field|fieldName|Field|FieldName|FieldID|fieldId|name)$/i.test(key) && typeof child === "string" && child.trim()) refs.push(child);
      else collectFieldRefs(child, refs);
    }
  }
  return [...new Set(refs.map(scalar).filter(Boolean))];
}

function analyticsType(control) {
  const raw = scalar(control?.type || control?.Type).toLowerCase().replace(/_/g, "-");
  return ANALYTICS_TYPES.get(raw) || "";
}

function buildReport(packagePath, findings, summary = {}) {
  return {
    status: statusFromFindings(findings),
    package: safePath(packagePath),
    summary,
    inventory: ["Pie chart", "Column chart", "Line chart", "Gauge", "Funnel chart", "Color block heatmap", "Summary", "Pivot table"],
    proofBoundary: "Data Analytics controls require UUID/runtime-safe IDs by default. Summary has a proven UUID runtime shape; other analytics controls require export-proven shapes and runtime screenshot/evidence before runtime correctness claims.",
    findings,
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--package") args.package = argv[++i];
    else if (arg === "--lineage") args.lineage = argv[++i];
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/inspect-data-analytics-control-identity.mjs --package <decoded.json|app.yapk> [--lineage <analytics-lineage.json>]");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
