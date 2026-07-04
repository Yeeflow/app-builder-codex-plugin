#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import {
  addFinding,
  allControlsFromPages,
  asArray,
  collectFieldMaps,
  collectPages,
  isObject,
  isSummaryControl,
  looksNumericField,
  normalizePackage,
  readPackageLike,
  safePath,
  scalar,
  statusFromFindings,
} from "./lib/yeeflow-ui-hard-gate-utils.mjs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROVEN_UUID_SUMMARY_SHAPE = "uuid-summary-v1.0.1";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package) usage(args.help ? 0 : 1);
  const report = inspectDashboardSummaryControlContract(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function inspectDashboardSummaryControlContract({ package: packagePath } = {}) {
  const findings = [];
  let pkg;
  try {
    pkg = normalizePackage(readPackageLike(packagePath).decoded);
  } catch (error) {
    addFinding(findings, "error", "SUMMARY_PACKAGE_READ_FAILED", `Could not read package for Summary/KPI inspection: ${error.message}`);
    return buildReport(packagePath, findings);
  }
  const fieldMaps = collectFieldMaps(pkg);
  const pages = collectPages(pkg);
  const summaries = allControlsFromPages(pages).filter((item) => isSummaryControl(item.control));
  const tempVars = new Set();
  const uuidProofRequested = hasUuidSummaryProofClaim(pkg);

  for (const item of summaries) {
    validateHiddenHost(item, findings);
    validateSummary(item, pkg, fieldMaps, findings);
    if (uuidProofRequested || controlRequestsUuidSummaryProof(item.control)) validateUuidSummaryProofShape(item, findings);
    const saveVar = item.control.attrs?.save_var;
    if (isObject(saveVar) && saveVar.name) {
      const name = scalar(saveVar.name);
      if (tempVars.has(`${item.page.layoutId}:${name}`)) {
        addFinding(findings, "error", "SUMMARY_TEMP_VAR_DUPLICATE", "Summary temp variable names must be unique per page/metric.", { page: item.page.title, variable: name });
      }
      tempVars.add(`${item.page.layoutId}:${name}`);
    }
    const controlId = scalar(item.control.id || item.control.ID || item.control.controlId);
    if (controlId && !layoutResourceReportIds(item).includes(controlId) && !hasExportProvenAlternativeReportIdsRegistration(item, controlId)) {
      addFinding(findings, "error", "SUMMARY_REPORTIDS_MISSING", "Summary control IDs must be registered in the dashboard layout resource ReportIds collection. Top-level Pages[].ReportIds is optional compatibility metadata.", { page: item.page.title, summaryId: controlId });
    }
  }

  if (summaries.length === 0) {
    addFinding(findings, "warning", "SUMMARY_CONTROLS_NOT_FOUND", "No Summary controls were found; run this gate only for dashboards that declare Summary/KPI generation.");
  }

  return buildReport(packagePath, findings, { summaryControlCount: summaries.length, uuidSummaryProofShapeChecked: uuidProofRequested });
}

function layoutResourceReportIds(item) {
  return [...new Set(item.page.roots
    .flatMap((root) => asArray(root.ReportIds || root.ReportIDs || root.reportIds))
    .map(scalar)
    .filter(Boolean))];
}

function hasExportProvenAlternativeReportIdsRegistration(item, controlId) {
  return item.control.attrs?.exportProvenAlternativeReportIdsRegistration === true
    && item.page.reportIds.includes(controlId);
}

function validateHiddenHost(item, findings) {
  const host = [...item.ancestors].reverse().find((ancestor) => ancestor?.attrs?.common?.hide || ancestor?.attrs?.display?.rule);
  if (!host) {
    addFinding(findings, "error", "SUMMARY_HIDDEN_HOST_MISSING", "Summary controls must be placed in a dedicated hidden host container.", { page: item.page.title, pointer: item.pointer });
    return;
  }
  const attrs = host.attrs || {};
  const hide = attrs.common?.hide;
  if (!Array.isArray(hide) || hide.length < 4 || hide[1] !== true || hide[2] !== true || hide[3] !== true) {
    addFinding(findings, "error", "SUMMARY_HIDDEN_HOST_HIDE_INVALID", "Hidden Summary host must use attrs.common.hide = [null, true, true, true].", { page: item.page.title });
  }
  const direction = attrs.style?.direction;
  if (!Array.isArray(direction) || direction[1] !== "row") {
    addFinding(findings, "error", "SUMMARY_HIDDEN_HOST_DIRECTION_INVALID", "Hidden Summary host must use attrs.style.direction = [null, \"row\"].", { page: item.page.title });
  }
  if (attrs.display && attrs.display.rule !== "1 == 0") {
    addFinding(findings, "warning", "SUMMARY_HIDDEN_HOST_DISPLAY_RULE_UNUSUAL", "Hidden Summary host display rule should preserve the learned non-rendering rule when used.", { page: item.page.title });
  }
}

function validateSummary(item, pkg, fieldMaps, findings) {
  const attrs = item.control.attrs || {};
  const data = attrs.data || {};
  const controlId = scalar(item.control.id || item.control.ID || item.control.controlId);
  const listId = scalar(data.list?.ListID || data.source?.ListID || data.ListID || attrs.list?.ListID);
  const fieldName = scalar(data.field?.FieldName || data.field?.fieldName || data.field || attrs.field?.FieldName || attrs.field);
  const func = scalar(data.func || attrs.func || data.summaryFunc || attrs.summaryFunc || attrs.aggregate || data.aggregate || "count").toLowerCase();

  if (!controlId) {
    addFinding(findings, "error", "SUMMARY_CONTROL_ID_MISSING", "Summary controls require explicit stable control IDs.", { page: item.page.title });
  } else if (!UUID_RE.test(controlId)) {
    addFinding(findings, "error", "SUMMARY_CONTROL_ID_NOT_RUNTIME_SAFE", "Generated Summary control IDs must be UUID-based. Semantic/layout-derived Summary IDs are not runtime-proven for dynamic KPI writeback.", { page: item.page.title, summaryId: controlId });
  }
  if ((item.control.runtimeModelProven === true || attrs.runtimeModelProven === true) && !UUID_RE.test(controlId)) {
    addFinding(findings, "error", "SUMMARY_RUNTIME_MODEL_PROVEN_UNSUPPORTED_SHAPE", "Do not mark Summary runtimeModelProven=true unless the generated Summary uses the proven UUID runtime shape.", { page: item.page.title, summaryId: controlId || null });
  }
  validateSummaryExtRegistration(item, controlId, findings);

  if (!resolvesCurrentApp(data, pkg)) {
    addFinding(findings, "error", "SUMMARY_APPLICATION_RELATION_INVALID", "Summary Application metadata must resolve to the current app.", { page: item.page.title, pointer: item.pointer });
  }
  if (!listId || !fieldMaps.has(listId)) {
    addFinding(findings, "error", "SUMMARY_DATA_SOURCE_INVALID", "Summary data source must resolve to a real target list.", { page: item.page.title, listId: listId || null });
    return;
  }
  if (!fieldName) {
    addFinding(findings, "error", "SUMMARY_FIELD_BLANK", "Summary Field must not be blank.", { page: item.page.title, listId });
    return;
  }
  const field = fieldMaps.get(listId).fields.get(fieldName);
  if (!field) {
    addFinding(findings, "error", "SUMMARY_FIELD_METADATA_MISSING", "Summary field must resolve to actual target-list field metadata.", { page: item.page.title, listId, field: fieldName });
    return;
  }
  if (!summaryFieldMetadataComplete(attrs, fieldName)) {
    addFinding(findings, "error", "SUMMARY_FIELD_METADATA_INCOMPLETE", "Summary field metadata must be populated with designer-shaped attrs.data.field/fieldObject/fieldInfo and attrs.field aliases.", { page: item.page.title, field: fieldName });
  }
  if (func === "count" && !hasCountShape(data, attrs, item)) {
    addFinding(findings, "error", "SUMMARY_COUNT_FIELD_SHAPE_INVALID", "Count summaries must use a valid count field shape, including ListDataID where required.", { page: item.page.title });
  }
  if (["sum", "avg", "average"].includes(func) && !looksNumericField(field)) {
    addFinding(findings, "error", "SUMMARY_NUMERIC_FIELD_REQUIRED", "Sum/average Summary controls must use numeric fields only.", { page: item.page.title, field: fieldName, func });
  }
  if (!filtersValid(attrs, fieldMaps.get(listId).fields, item)) {
    addFinding(findings, "error", "SUMMARY_FILTER_SHAPE_INVALID", "Summary filters must use designer-compatible condition/filter shapes that reference real fields.", { page: item.page.title });
  }
  if (!isObject(attrs.save_var) || attrs.save_var.type !== "expr" || attrs.save_var.exprType !== "variable" || !attrs.save_var.id || !attrs.save_var.name) {
    addFinding(findings, "error", "SUMMARY_SAVE_VAR_EXPRESSION_OBJECT_REQUIRED", "Summary save_var must use designer-exported expression-object shape, not a plain string.", { page: item.page.title });
  } else {
    const saveVarIds = [attrs.save_var.id, attrs.save_var.name].map(scalar).filter(Boolean);
    if (!summaryTempVarDeclared(item, saveVarIds)) {
      addFinding(findings, "error", "SUMMARY_TEMP_VAR_DECLARATION_MISSING", "Summary save_var must resolve to a dashboard layout resource tempVars[] declaration.", { page: item.page.title });
    }
    const visibleBinding = visibleSummaryBindingStatus(item, saveVarIds);
    if (!visibleBinding.valid) {
      addFinding(findings, "error", "SUMMARY_VISIBLE_BINDING_MISSING", "Visible Heading/Text controls must bind to Summary temp variables through attrs.headc.title.variable[].", { page: item.page.title });
    } else if (visibleBinding.mode === "static-visible-value") {
      addFinding(findings, "warning", "SUMMARY_VISIBLE_BINDING_STATIC_COMPATIBILITY", "Static visible KPI values are a compatibility display shape only; they do not prove dynamic KPI binding without before/after runtime mutation evidence.", { page: item.page.title });
    }
  }
}

function summaryFieldMetadataComplete(attrs, fieldName) {
  const data = attrs.data || {};
  const dataFieldIsObject = isObject(data.field);
  const dataFieldCompatibility = scalar(data.field) === fieldName && isObject(data.fieldObject) && isObject(data.fieldInfo);
  return (dataFieldIsObject || dataFieldCompatibility)
    && isObject(attrs.field)
    && isObject(attrs.fieldObject)
    && isObject(attrs.fieldInfo);
}

function validateSummaryExtRegistration(item, controlId, findings) {
  if (!controlId) return;
  const entry = matchingSummaryExtRegistration(item, controlId);
  if (!entry) {
    addFinding(findings, "error", "SUMMARY_EXTS_REGISTRATION_MISSING", "Summary controls require matching dashboard layout resource exts[] registration with i and id equal to the Summary control ID, category ___Pivot___, and key summary.", { page: item.page.title, summaryId: controlId || null });
    return;
  }
  if (scalar(entry.i) !== controlId || scalar(entry.id || entry.ID) !== controlId) {
    addFinding(findings, "error", "SUMMARY_EXTS_ID_MISMATCH", "Summary Resource.exts[] entries must set both i and id to the Summary control UUID.", { page: item.page.title, summaryId: controlId || null });
  }
  if (!summaryExtSourceMetadataComplete(entry)) {
    addFinding(findings, "error", "SUMMARY_EXTS_SOURCE_METADATA_INCOMPLETE", "Summary Resource.exts[].attr must include AppID, ListSetID, ListID, list, source, and export-shaped settings.values metadata.", { page: item.page.title, summaryId: controlId || null });
  }
}

function summaryExtRegistrationExists(item, controlId) {
  return Boolean(matchingSummaryExtRegistration(item, controlId));
}

function matchingSummaryExtRegistration(item, controlId) {
  const exts = item.page.roots.flatMap((root) => asArray(root.exts || root.Exts));
  return exts.find((entry) =>
    (scalar(entry.i) === controlId || scalar(entry.id || entry.ID) === controlId)
    && scalar(entry.category) === "___Pivot___"
    && scalar(entry.key).toLowerCase() === "summary"
  );
}

function summaryExtSourceMetadataComplete(entry) {
  const attr = entry?.attr || {};
  const listId = scalar(attr.ListID || attr.list?.ListID || attr.source?.ListID);
  const listSetId = scalar(attr.ListSetID || attr.list?.ListSetID || attr.source?.ListSetID);
  if (!scalar(attr.AppID) || !listId || !listSetId || !isObject(attr.list) || !isObject(attr.source)) return false;
  if (scalar(attr.list.ListID) !== listId || scalar(attr.source.ListID) !== listId) return false;
  if (scalar(attr.list.ListSetID) !== listSetId || scalar(attr.source.ListSetID) !== listSetId) return false;
  const values = asArray(attr.settings?.values || attr.settings?.Values);
  return values.some((value) =>
    isObject(value)
    && scalar(value.field || value.fieldName || value.FieldName) === "ListDataID"
    && scalar(value.func || value.aggregate).toUpperCase() === "COUNT"
  );
}

function validateUuidSummaryProofShape(item, findings) {
  const controlId = scalar(item.control.id || item.control.ID || item.control.controlId);
  if (!UUID_RE.test(controlId)) {
    addFinding(findings, "error", "SUMMARY_UUID_PROOF_ID_NOT_UUID", "The proven dynamic KPI shape requires UUID Summary control IDs.", { page: item.page.title, summaryId: controlId || null });
  }
  const saveVar = item.control.attrs?.save_var || {};
  const saveVarIds = [saveVar.id, saveVar.name].map(scalar).filter(Boolean);
  const pageResources = item.page.roots;
  const exts = pageResources.flatMap((root) => asArray(root.exts || root.Exts));
  const visibleBindings = [];
  for (const root of pageResources) {
    walkVisibleVariables(root, visibleBindings);
  }
  const extsMatch = exts.some((entry) =>
    scalar(entry.i || entry.id || entry.ID) === controlId
    && scalar(entry.category) === "___Pivot___"
    && scalar(entry.key).toLowerCase() === "summary"
  );
  if (!extsMatch) {
    addFinding(findings, "error", "SUMMARY_UUID_PROOF_EXTS_MISSING", "The proven UUID Summary shape requires Resource.exts[] with i equal to the Summary UUID, category ___Pivot___, and key summary.", { page: item.page.title, summaryId: controlId || null });
  }
  if (!summaryTempVarDeclared(item, saveVarIds)) {
    addFinding(findings, "error", "SUMMARY_UUID_PROOF_TEMPVAR_MISSING", "The proven UUID Summary shape requires Resource.tempVars[] to declare the same temp variable saved by Summary attrs.save_var.", { page: item.page.title, summaryId: controlId || null });
  }
  const visibleBindingMatch = saveVarIds.length && visibleBindings.some((variable) => saveVarIds.includes(scalar(variable.id || variable.ID || variable.name || variable.Name || variable)));
  if (!visibleBindingMatch) {
    addFinding(findings, "error", "SUMMARY_UUID_PROOF_VISIBLE_BINDING_MISSING", "The proven UUID Summary shape requires visible Heading/Text controls to bind through attrs.headc.title.variable[].", { page: item.page.title, summaryId: controlId || null });
  }
}

function summaryTempVarDeclared(item, saveVarIds) {
  if (!saveVarIds.length) return false;
  const tempVars = item.page.roots.flatMap((root) => asArray(root.tempVars || root.TempVars));
  return tempVars.some((variable) => saveVarIds.includes(scalar(variable.id || variable.ID || variable.name || variable.Name)));
}

function visibleSummaryBindingStatus(item, saveVarIds) {
  if (!saveVarIds.length) return false;
  const visibleBindings = [];
  const visibleTexts = [];
  for (const root of item.page.roots) {
    walkVisibleVariables(root, visibleBindings);
    walkVisibleText(root, visibleTexts);
  }
  const hasBinding = visibleBindings.some((variable) => saveVarIds.includes(scalar(variable.id || variable.ID || variable.name || variable.Name || variable)));
  const showsRawVariable = visibleTexts.some((text) => saveVarIds.some((saveVarId) => text.includes(saveVarId)));
  if (showsRawVariable) return { valid: false, mode: "raw-variable-text" };
  if (hasBinding) return { valid: true, mode: "dynamic-variable-binding" };
  return { valid: false, mode: "missing" };
}

function hasUuidSummaryProofClaim(pkg) {
  if (scalar(pkg.raw?.dynamicBindingShape || pkg.raw?.provenBindingShape || pkg.raw?.kpiRuntimeProofShape) === PROVEN_UUID_SUMMARY_SHAPE) return true;
  return collectPages(pkg).some((page) =>
    scalar(page.page?.dynamicBindingShape || page.page?.provenBindingShape || page.page?.kpiRuntimeProofShape) === PROVEN_UUID_SUMMARY_SHAPE
    || page.roots.some((root) => scalar(root.dynamicBindingShape || root.provenBindingShape || root.kpiRuntimeProofShape) === PROVEN_UUID_SUMMARY_SHAPE)
  );
}

function controlRequestsUuidSummaryProof(control) {
  const attrs = control.attrs || {};
  return scalar(attrs.dynamicBindingShape || attrs.provenBindingShape || attrs.kpiRuntimeProofShape) === PROVEN_UUID_SUMMARY_SHAPE;
}

function walkVisibleVariables(control, variables) {
  if (!isObject(control)) return;
  const vars = control.attrs?.headc?.title?.variable;
  if (Array.isArray(vars)) variables.push(...vars);
  for (const key of ["children", "columns", "controls", "items", "rows", "cells", "list", "content"]) {
    asArray(control[key]).forEach((child) => walkVisibleVariables(child, variables));
  }
}

function walkVisibleText(control, texts) {
  if (!isObject(control)) return;
  if (!isSummaryControl(control)) {
    const attrs = control.attrs || {};
    for (const value of [control.text, control.label, control.title, attrs.text, attrs.title, attrs.value, attrs.headc?.title?.value]) {
      const text = scalar(value);
      if (text) texts.push(text);
    }
  }
  for (const key of ["children", "columns", "controls", "items", "rows", "cells", "list", "content"]) {
    asArray(control[key]).forEach((child) => walkVisibleText(child, texts));
  }
}

function resolvesCurrentApp(data, pkg) {
  const rootId = scalar(pkg.root.ListID || pkg.root.ListSetID || pkg.root.ID);
  const app = data.app || data.application || data.Application || {};
  const appId = scalar(app.ListID || app.ListSetID || app.ID || app.id || data.AppID || data.ListSetID);
  return !appId || !rootId || appId === rootId || appId === "41";
}

function hasCountShape(data, attrs, item) {
  const candidates = [data.field, attrs.field, attrs.fieldObject, attrs.fieldInfo].filter(isObject);
  return candidates.some((field) => scalar(field.FieldName || field.fieldName) === "ListDataID" || scalar(field.ListDataID));
}

function filtersValid(attrs, fieldMap, item) {
  const filters = asArray(attrs.data?.filter || attrs.data?.filters || attrs.filter || attrs.filters || attrs.exts?.[0]?.attr?.settings?.Conditions);
  if (!filters.length) return attrs.allowAllRecords === true || attrs.kpiScope === "all-records";
  return filters.every((filter) => {
    const fieldName = scalar(filter.Field || filter.FieldName || filter.field || filter.fieldName || filter.name);
    return fieldName && fieldMap.has(fieldName) && ("Value" in filter || "value" in filter || "Values" in filter || "operator" in filter || "op" in filter);
  });
}

function buildReport(packagePath, findings, summary = {}) {
  return {
    status: statusFromFindings(findings),
    package: safePath(packagePath),
    summary,
    proofStates: ["designer-configured Summary control", "validator-valid Summary contract", "runtime-proven visible dynamic KPI rendering"],
    proofBoundary: "This validates designer-shaped Summary configuration. Generated Summary IDs must be UUID-based, registered in LayoutInResources[].Resource.ReportIds, and backed by Resource.exts[] runtime source metadata; top-level Pages[].ReportIds is optional compatibility metadata. Runtime before/after mutation evidence is still required before visible dynamic KPI proof can be claimed.",
    findings,
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--package") args.package = argv[++i];
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/inspect-dashboard-summary-control-contract.mjs --package <decoded.json|app.yapk>");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
