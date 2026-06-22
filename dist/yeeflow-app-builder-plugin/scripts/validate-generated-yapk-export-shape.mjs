#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk, walk } from "./lib/yapk-decode-utils.mjs";

const DEFRESOURCE_PREFIX = "::brotli::";
const RECORD_DISPLAY_TYPES = new Set(["data-list", "collection", "kanban", "vertical-timeline", "horizontal-timeline"]);
const FILTER_TYPES = new Set(["select-filter", "radio-filter", "checkbox-filter", "data-filter"]);
const CHART_TYPES = new Set(["chart", "pie-chart", "bar-chart", "line-chart", "gauge", "funnel-chart", "pivot-table", "color-block", "data-analytics"]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateGeneratedYapkExportShape(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateGeneratedYapkExportShape(options = {}) {
  const findings = [];
  let decoded = null;
  const packagePath = path.resolve(options.package);
  if (!fs.existsSync(packagePath)) {
    return fail("YAPK_PACKAGE_MISSING", "Package file is missing.", { package: packagePath });
  }
  try {
    decoded = readPackageOrDecodedJson(packagePath);
  } catch (error) {
    return fail("YAPK_RESOURCE_DECODE_FAILED", `Could not decode generated-final package: ${error.message}`, { package: packagePath });
  }

  validateApprovalForms(decoded, findings);
  validateReports(decoded, findings);
  validateDashboards(decoded, findings);
  validateNativeTitleMetadata(decoded, findings);
  validateNoEmbeddedListDatas(decoded, findings);

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    package: packagePath,
    summary: {
      forms: asArray(decoded?.Forms).length,
      formNewReports: asArray(decoded?.FormNewReports).length,
      dataReports: asArray(decoded?.DataReports).length,
      dashboardPages: collectDashboardPages(decoded).length,
    },
    findings,
  };
}

function readPackageOrDecodedJson(file) {
  if (file.endsWith(".yapk")) return readDecodedYapk(file).decoded;
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function validateApprovalForms(decoded, findings) {
  for (const [formIndex, form] of asArray(decoded?.Forms).entries()) {
    const formPath = `$.Forms[${formIndex}]`;
    const defResult = decodeApprovalDefResource(form?.DefResource, `${formPath}.DefResource`);
    findings.push(...defResult.findings);
    if (!defResult.def) continue;
    const def = defResult.def;
    const formKey = String(form?.Key || form?.key || "");
    const defKey = String(def?.defkey || def?.DefKey || def?.key || "");
    if (!defKey || (formKey && defKey !== formKey)) {
      findings.push(error("APPROVAL_DEFRESOURCE_KEY_MISMATCH", "Approval DefResource key/defkey must align with Forms[].Key.", { path: formPath, formKey: formKey || null, defKey: defKey || null }));
    }
    for (const key of ["title", "workflowType", "AppListSetID", "ProcModelAppID", "ProcModelListID", "ProcModelListSetID", "variables", "graphposition", "graphzoom", "graphver"]) {
      if (!present(def?.[key])) findings.push(error(`APPROVAL_DEFRESOURCE_${key.toUpperCase()}_MISSING`, `Approval DefResource must include export-style ${key} metadata.`, { path: `${formPath}.DefResource.${key}` }));
    }
    validateApprovalPages(def, formPath, findings);
    validateApprovalWorkflow(def, formPath, findings);
  }
}

function decodeApprovalDefResource(raw, pathValue) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { def: null, findings: [error("APPROVAL_DEFRESOURCE_MISSING", "Approval forms must include export-style DefResource; deleting or minimizing the form is not a valid generated-final package.", { path: pathValue })] };
  }
  let bytes;
  try {
    bytes = Buffer.from(raw, "base64");
  } catch {
    return { def: null, findings: [error("APPROVAL_DEFRESOURCE_ENCODING_INVALID", "Approval DefResource must be base64 bytes containing ::brotli:: plus Brotli-compressed JSON.", { path: pathValue })] };
  }
  const prefix = Buffer.from(DEFRESOURCE_PREFIX, "utf8");
  if (bytes.length <= prefix.length || !bytes.subarray(0, prefix.length).equals(prefix)) {
    return { def: null, findings: [error("APPROVAL_DEFRESOURCE_PREFIX_MISSING", "Approval DefResource decoded bytes must begin with canonical ::brotli:: prefix.", { path: pathValue })] };
  }
  let text;
  try {
    text = zlib.brotliDecompressSync(bytes.subarray(prefix.length)).toString("utf8");
  } catch (decodeError) {
    return { def: null, findings: [error("APPROVAL_DEFRESOURCE_BROTLI_DECODE_FAILED", `Approval DefResource after ::brotli:: must Brotli-decompress to JSON: ${decodeError.message}`, { path: pathValue })] };
  }
  try {
    return { def: JSON.parse(text), findings: [] };
  } catch (parseError) {
    return { def: null, findings: [error("APPROVAL_DEFRESOURCE_JSON_INVALID", `Approval DefResource JSON did not parse: ${parseError.message}`, { path: pathValue })] };
  }
}

function validateApprovalPages(def, formPath, findings) {
  const pages = asArray(def?.pageurls);
  if (!pages.length) {
    findings.push(error("APPROVAL_PAGEURLS_MISSING", "Approval DefResource must include pageurls[] registrations.", { path: `${formPath}.DefResource.pageurls` }));
    return;
  }
  const pageIds = new Set();
  let hasRequest = false;
  let hasTask = false;
  for (const [pageIndex, page] of pages.entries()) {
    const pagePath = `${formPath}.DefResource.pageurls[${pageIndex}]`;
    const pageId = String(page?.id || page?.key || "");
    if (!pageId) findings.push(error("APPROVAL_PAGEURL_ID_MISSING", "Approval page registration must include id/key metadata.", { path: pagePath }));
    else pageIds.add(pageId);
    if (!present(page?.pageUrl) && !present(page?.url)) findings.push(error("APPROVAL_PAGEURL_URL_MISSING", "Approval page registration must include pageUrl/url metadata.", { path: pagePath }));
    if (!present(page?.type) && !present(page?.pagetype)) findings.push(error("APPROVAL_PAGEURL_TYPE_MISSING", "Approval page registration must include request/task type metadata.", { path: pagePath }));
    const typeText = `${page?.type ?? ""} ${page?.pagetype ?? ""} ${page?.title ?? ""}`.toLowerCase();
    if (/request|submit|^1$/.test(typeText)) hasRequest = true;
    if (/task|review|approve|^2$/.test(typeText)) hasTask = true;
    if (!isObject(page?.formdef)) findings.push(error("APPROVAL_PAGEURL_FORMDEF_MISSING", "Approval page registration must embed formdef.", { path: `${pagePath}.formdef` }));
    else {
      if (!Array.isArray(page.formdef.children) || page.formdef.children.length === 0) findings.push(error("APPROVAL_PAGE_FORMDEF_CHILDREN_MISSING", "Approval page formdef.children must contain designer controls.", { path: `${pagePath}.formdef.children` }));
      if (!present(page.formdef.ver)) findings.push(error("APPROVAL_PAGE_FORMDEF_VERSION_MISSING", "Approval page formdef.ver must be present.", { path: `${pagePath}.formdef.ver` }));
      validateUniqueDesignerControlIds(page.formdef.children, `${pagePath}.formdef.children`, findings);
    }
  }
  if (!hasRequest) findings.push(error("APPROVAL_REQUEST_PAGE_METADATA_MISSING", "Approval DefResource must register a request/submission page.", { path: `${formPath}.DefResource.pageurls` }));
  if (!hasTask) findings.push(error("APPROVAL_TASK_PAGE_METADATA_MISSING", "Approval DefResource must register at least one reviewer/task page.", { path: `${formPath}.DefResource.pageurls` }));
  validateWorkflowTaskUrls(def, formPath, pageIds, findings);
}

function validateUniqueDesignerControlIds(children, pathValue, findings) {
  const seen = new Map();
  walk(children, (node, pointer) => {
    if (!isObject(node)) return;
    const id = node.id || node.ID || node.key;
    if (!id) return;
    const key = String(id);
    if (seen.has(key)) findings.push(error("APPROVAL_DESIGNER_CONTROL_ID_DUPLICATE", "Approval page designer control ids must be unique.", { path: `${pathValue}${pointer.slice(1)}`, id: key, previousPath: seen.get(key) }));
    else seen.set(key, `${pathValue}${pointer.slice(1)}`);
  });
}

function validateApprovalWorkflow(def, formPath, findings) {
  const shapes = asArray(def?.childshapes);
  if (!shapes.length) {
    findings.push(error("APPROVAL_WORKFLOW_CHILDSHAPES_MISSING", "Approval DefResource must include export-style workflow childshapes.", { path: `${formPath}.DefResource.childshapes` }));
    return;
  }
  const nodeShapes = shapes.filter((shape) => String(shape?.stencil?.id || "").toLowerCase() !== "sequenceflow");
  const flows = shapes.filter((shape) => String(shape?.stencil?.id || "").toLowerCase() === "sequenceflow");
  if (!flows.length) findings.push(error("APPROVAL_WORKFLOW_SEQUENCE_LINKS_MISSING", "Approval workflow must include incoming/outgoing SequenceFlow links.", { path: `${formPath}.DefResource.childshapes` }));
  for (const [shapeIndex, shape] of shapes.entries()) {
    const shapePath = `${formPath}.DefResource.childshapes[${shapeIndex}]`;
    if (!present(shape?.id) || !present(shape?.resourceid)) findings.push(error("APPROVAL_WORKFLOW_GRAPH_ID_MISSING", "Workflow childshape must include id and resourceid.", { path: shapePath }));
    if (!hasGraphPosition(shape)) findings.push(error("APPROVAL_WORKFLOW_GRAPH_POSITION_MISSING", "Workflow childshape must include graph position/bounds metadata for designer readiness.", { path: shapePath }));
    const isFlow = String(shape?.stencil?.id || "").toLowerCase() === "sequenceflow";
    if (isFlow && (!present(shape?.source?.resourceid) || !present(shape?.target?.resourceid))) {
      findings.push(error("APPROVAL_WORKFLOW_LINK_ENDPOINTS_MISSING", "SequenceFlow must include source and target resource ids.", { path: shapePath }));
    }
    if (!isFlow && nodeShapes.length > 1 && (!Array.isArray(shape?.incoming) && !Array.isArray(shape?.outgoing))) {
      findings.push(error("APPROVAL_WORKFLOW_NODE_LINKS_MISSING", "Workflow nodes must include incoming/outgoing link metadata.", { path: shapePath }));
    }
  }
}

function validateWorkflowTaskUrls(def, formPath, pageIds, findings) {
  for (const [shapeIndex, shape] of asArray(def?.childshapes).entries()) {
    const stencil = String(shape?.stencil?.id || "");
    if (!/task/i.test(stencil)) continue;
    const taskUrl = shape?.properties?.taskurl || shape?.properties?.taskUrl || shape?.properties?.TaskUrl;
    if (!present(taskUrl)) {
      findings.push(error("APPROVAL_WORKFLOW_TASKURL_MISSING", "Approval task workflow nodes must include task URL metadata.", { path: `${formPath}.DefResource.childshapes[${shapeIndex}].properties.taskurl` }));
    } else if (!pageIds.has(String(taskUrl))) {
      findings.push(error("APPROVAL_WORKFLOW_TASKURL_PAGE_NOT_FOUND", "Approval task URL must resolve to a registered pageurls[] entry.", { path: `${formPath}.DefResource.childshapes[${shapeIndex}].properties.taskurl`, taskUrl }));
    }
  }
}

function hasGraphPosition(shape) {
  return isObject(shape?.bounds)
    || isObject(shape?.position)
    || (present(shape?.x) && present(shape?.y))
    || (Array.isArray(shape?.dockers) && shape.dockers.length > 0);
}

function validateReports(decoded, findings) {
  for (const [index, report] of asArray(decoded?.FormNewReports).entries()) validateReportResource(report, `$.FormNewReports[${index}]`, "FORMNEWREPORT", findings);
  for (const [index, report] of asArray(decoded?.DataReports).entries()) validateReportResource(report, `$.DataReports[${index}]`, "DATAREPORT", findings);
}

function validateReportResource(report, pathValue, codePrefix, findings) {
  if (!isObject(report)) {
    findings.push(error(`${codePrefix}_EXPORT_SHAPE_INVALID`, "Report resource must be an export-shaped object.", { path: pathValue }));
    return;
  }
  const keys = Object.keys(report);
  if (keys.length <= 2 || (keys.every((key) => /^(title|name|count)$/i.test(key)))) {
    findings.push(error(`${codePrefix}_PLACEHOLDER_FORBIDDEN`, "Report resources must not be count-only placeholders.", { path: pathValue, keys }));
  }
  const settings = parseJsonMaybe(report.Settings) || report.Settings || report.settings;
  if (!isObject(settings)) findings.push(error(`${codePrefix}_SETTINGS_MISSING`, "Report resources must include export-shaped Settings metadata.", { path: `${pathValue}.Settings` }));
  else if (!Array.isArray(settings.Fields) || settings.Fields.length === 0) findings.push(error(`${codePrefix}_FIELDS_MISSING`, "Report Settings.Fields[] must include selected source fields.", { path: `${pathValue}.Settings.Fields` }));
  if (codePrefix === "FORMNEWREPORT" && !present(report.DefKey)) findings.push(error("FORMNEWREPORT_DEFKEY_MISSING", "FormNewReports entries must reference the source approval form DefKey.", { path: `${pathValue}.DefKey` }));
  if (codePrefix === "DATAREPORT" && !present(report.ID) && !present(report.ListID) && !present(report.ReportID)) findings.push(error("DATAREPORT_ID_MISSING", "DataReports entries must include export-style report/list identity metadata.", { path: pathValue }));
}

function validateDashboards(decoded, findings) {
  const listIndex = buildListIndex(decoded);
  for (const page of collectDashboardPages(decoded)) {
    const controls = page.controls;
    const visibleBusinessControls = controls.filter((entry) => isVisibleBusinessControl(entry.control));
    const boundControls = visibleBusinessControls.filter((entry) => isBoundBusinessControl(entry.control, listIndex));
    const summaryControls = controls.filter((entry) => String(entry.control?.type || "") === "summary");
    const kpiControls = controls.filter((entry) => isKpiLikeControl(entry.control));
    if (!visibleBusinessControls.length) findings.push(error("DASHBOARD_VISIBLE_BUSINESS_CONTENT_MISSING", "Dashboard pages must contain visible business sections and controls; hidden hosts and shells are not content proof.", { page: page.title, path: page.pointer }));
    if (!boundControls.length) findings.push(error("DASHBOARD_BOUND_BUSINESS_CONTROL_MISSING", "Dashboard visible content must include controls bound to included data lists/resources.", { page: page.title, path: page.pointer }));
    if (kpiControls.length && !summaryControls.length) {
      findings.push(error("DASHBOARD_KPI_SUMMARY_CONTROL_MISSING", "Dynamic KPI cards must be backed by Summary controls; static KPI-looking text is not generated-final dashboard proof.", {
        page: page.title,
        path: page.pointer,
        kpiCount: kpiControls.length,
      }));
    }
    for (const entry of controls) {
      validateTextControlContent(entry, page, findings);
      if (String(entry.control?.type || "") === "summary") validateSummaryRuntimeContract(entry, page, listIndex, findings);
      if (CHART_TYPES.has(String(entry.control?.type || ""))) validateChartRuntimeContract(entry, page, listIndex, findings);
    }
  }
}

function validateNoEmbeddedListDatas(decoded, findings) {
  for (const [childIndex, child] of asArray(decoded?.Childs).entries()) {
    for (const [key, value] of Object.entries(child || {})) {
      if (/^ListDatas$/i.test(key)) {
        findings.push(error("YAPK_EMBEDDED_LISTDATAS_FORBIDDEN", "Generated YAPK AppPackageInfo must not embed sample rows in Childs[].ListDatas; generate a companion seed file/script and require explicit live seeding approval.", {
          path: `$.Childs[${childIndex}].${key}`,
          rowCount: Array.isArray(value) ? value.length : isObject(value) ? Object.keys(value).length : null,
        }));
      }
    }
    if (child?.List && isObject(child.List) && Object.prototype.hasOwnProperty.call(child.List, "ListDatas")) {
      findings.push(error("YAPK_EMBEDDED_LISTDATAS_FORBIDDEN", "Generated YAPK AppPackageInfo must not embed sample rows in Childs[].List.ListDatas; sample data belongs in a separate seed artifact.", {
        path: `$.Childs[${childIndex}].List.ListDatas`,
      }));
    }
  }
}

function collectDashboardPages(decoded) {
  const pages = [];
  for (const [pageIndex, page] of asArray(decoded?.Pages).entries()) {
    if (String(page?.Type) !== "103") continue;
    for (const [resourceIndex, resource] of asArray(page?.LayoutInResources).entries()) {
      const parsed = parseJsonMaybe(resource?.Resource);
      if (!isObject(parsed)) continue;
      const controls = [];
      collectControls(parsed, controls, "$");
      pages.push({ title: String(page?.Title || page?.Name || page?.LayoutID || `dashboard-${pageIndex}`), pointer: `$.Pages[${pageIndex}].LayoutInResources[${resourceIndex}].Resource`, resource: parsed, controls });
    }
  }
  return pages;
}

function collectControls(node, out, pointer) {
  if (!isObject(node)) return;
  if (node.type) out.push({ control: node, pointer });
  for (const key of ["children", "columns", "controls"]) asArray(node[key]).forEach((child, index) => collectControls(child, out, `${pointer}.${key}[${index}]`));
}

function isVisibleBusinessControl(control) {
  const type = String(control?.type || "");
  if (!type || type === "summary") return false;
  if (isHidden(control)) return false;
  if (type === "container") return hasVisibleBusinessText(control) || hasResourceBinding(control);
  return !["page", "main", "content"].includes(type);
}

function isBoundBusinessControl(control, listIndex) {
  const type = String(control?.type || "");
  if (isHidden(control)) return false;
  if (RECORD_DISPLAY_TYPES.has(type) || FILTER_TYPES.has(type)) return resolvesIncludedList(control, listIndex);
  return hasResourceBinding(control) && resolvesIncludedList(control, listIndex);
}

function isKpiLikeControl(control) {
  const text = `${control?.id || ""} ${control?.name || ""} ${control?.label || ""} ${control?.attrs?.nv_label || ""} ${control?.attrs?.nav_label || ""}`.toLowerCase();
  return String(control?.type || "") === "container" && /\bkpi\b|metric card|summary card|event_portfolio_kpi_/.test(text);
}

function validateTextControlContent(entry, page, findings) {
  const type = String(entry.control?.type || "");
  if (!["heading", "text", "text-editor"].includes(type)) return;
  if (!present(entry.control?.attrs?.headc?.title?.value) && !present(entry.control?.attrs?.headc?.title?.variable) && !present(entry.control?.attrs?.title?.value) && !present(entry.control?.value)) {
    findings.push(error("DASHBOARD_TEXT_CONTROL_CONTENT_MISSING", "Rendered Text/Heading controls must use real text/binding content; nav_label/nv_label metadata is not rendered content proof.", { page: page.title, path: entry.pointer, navLabel: entry.control?.attrs?.nav_label || entry.control?.attrs?.nv_label || null }));
  }
}

function validateSummaryRuntimeContract(entry, page, listIndex, findings) {
  const id = String(entry.control?.id || entry.control?.ID || "");
  const exts = asArray(page.resource?.exts);
  const ext = exts.find((item) => String(item?.i || item?.id || "") === id && item?.category === "___Pivot___" && item?.key === "summary");
  const saveVar = entry.control?.attrs?.save_var || entry.control?.attrs?.saveVar || entry.control?.save_var || entry.control?.saveVar;
  if (!ext || !asArray(ext?.attr?.settings?.values).length || !isObject(saveVar)) {
    findings.push(error("DASHBOARD_SUMMARY_RUNTIME_MODEL_INCOMPLETE", "Summary controls must fail unless the full runtime-proven model contract is present.", { page: page.title, path: entry.pointer, summaryId: id || null }));
    return;
  }
  const sourceListId = String(ext?.attr?.ListID || entry.control?.attrs?.data?.list?.ListID || "");
  if (sourceListId && !listIndex.has(sourceListId)) findings.push(error("DASHBOARD_SUMMARY_SOURCE_LIST_UNRESOLVED", "Summary source list must resolve to an included package resource.", { page: page.title, path: entry.pointer, sourceListId }));
  const reportIds = new Set(asArray(page.resource?.ReportIds).map(String));
  if (!reportIds.has(id)) findings.push(error("DASHBOARD_SUMMARY_REPORTIDS_MISSING", "Resource.ReportIds[] must include visible/generated Summary controls.", { page: page.title, path: `${page.pointer}.ReportIds`, summaryId: id }));
}

function validateChartRuntimeContract(entry, page, listIndex, findings) {
  if (!resolvesIncludedList(entry.control, listIndex) || !present(entry.control?.attrs?.model) && !present(entry.control?.attrs?.series) && !present(entry.control?.attrs?.data?.fields)) {
    findings.push(error("DASHBOARD_CHART_RUNTIME_MODEL_INCOMPLETE", "Chart/data analytics controls must not be generated unless their full runtime model contract is present; use visual-safe filters/tables/collections when proof is unavailable.", { page: page.title, path: entry.pointer, type: entry.control?.type }));
  }
}

function validateNativeTitleMetadata(decoded, findings) {
  for (const [childIndex, child] of asArray(decoded?.Childs).entries()) {
    const title = asArray(child?.Fields).find((field) => field?.FieldName === "Title" || field?.InternalName === "Title");
    if (!title) continue;
    if (title.IsSystem !== true) findings.push(error("NATIVE_TITLE_NOT_SYSTEM", "Native Title field must preserve IsSystem:true.", { path: `$.Childs[${childIndex}].Fields.Title.IsSystem` }));
    if (Number(title.Status) !== 0) findings.push(error("NATIVE_TITLE_STATUS_INVALID", "Native Title field must preserve Status:0.", { path: `$.Childs[${childIndex}].Fields.Title.Status` }));
    if (title.IsIndex !== true) findings.push(error("NATIVE_TITLE_ISINDEX_MISSING", "Native Title field must preserve IsIndex:true.", { path: `$.Childs[${childIndex}].Fields.Title.IsIndex` }));
  }
}

function buildListIndex(decoded) {
  const ids = new Set();
  for (const child of asArray(decoded?.Childs)) {
    const id = child?.List?.ListID;
    if (present(id)) ids.add(String(id));
  }
  return ids;
}

function resolvesIncludedList(control, listIndex) {
  const listId = control?.attrs?.data?.list?.ListID || control?.attrs?.data?.listId || control?.attrs?.list?.ListID || control?.data?.list?.ListID;
  return present(listId) && listIndex.has(String(listId));
}

function hasResourceBinding(control) {
  return present(control?.attrs?.data?.list?.ListID) || present(control?.attrs?.data?.listId) || present(control?.attrs?.list?.ListID) || present(control?.data?.list?.ListID);
}

function hasVisibleBusinessText(control) {
  return present(control?.attrs?.headc?.title?.value) || present(control?.attrs?.title?.value) || present(control?.value) || present(control?.name) || present(control?.label);
}

function isHidden(control) {
  const raw = JSON.stringify(control?.attrs || control || {}).toLowerCase();
  return /display"\s*:\s*"none"|hidden summary|summary host/.test(raw) || asArray(control?.attrs?.common?.hide).some((value) => value === true);
}

function present(value) {
  return value !== undefined && value !== null && !(typeof value === "string" && value.trim() === "") && !(Array.isArray(value) && value.length === 0);
}

function fail(code, message, details = {}) {
  return { status: "fail", findings: [error(code, message, details)] };
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--package") args.package = argv[++i];
    else if (token === "--plan") args.plan = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log("Usage: node scripts/validate-generated-yapk-export-shape.mjs --package <generated-final.yapk|decoded.json>");
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
