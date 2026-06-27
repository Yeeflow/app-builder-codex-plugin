#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk, walk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/data-table-golden-references.json");
const CONTROL_TYPE = "data-list";
const LOCKED_ATTR_KEYS = ["table", "header", "body", "cardCont", "caption-style", "fallback"];
const REQUIRED_GUIDANCE_KEYS = [
  "summary",
  "suitableSourceResourceTypes",
  "whenToUse",
  "whenNotToUse",
  "requiredBusinessSignals",
  "requiredAppPlanDeclaration",
  "generationProof",
  "proofBoundary",
];

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.registry && !args.resource && !args.package && !args.appPlan)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateDataTableGoldenReferences(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDataTableGoldenReferences(options = {}) {
  const findings = [];
  const registryPath = path.resolve(options.registry || REGISTRY_PATH);
  const registry = readJson(registryPath, findings, "DATA_TABLE_REGISTRY_MISSING");
  const references = loadReferences(registry, registryPath, findings);
  validateRegistry(registry, references, findings);

  if (options.resource) {
    const resource = readJson(path.resolve(options.resource), findings, "DATA_TABLE_RESOURCE_MISSING");
    validateResource(resource?._ak_c || resource, {
      surface: String(options.surface || "resource"),
      title: path.basename(options.resource),
      references,
      findings,
    });
  }

  let packageSummary = null;
  if (options.package) packageSummary = validatePackage(path.resolve(options.package), { references, findings });
  const appPlanPath = options.appPlan || options.plan ? path.resolve(options.appPlan || options.plan) : null;
  if (appPlanPath) validateAppPlanMaterialization(appPlanPath, { references, findings, packageSummary });

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: registryPath,
    resource: options.resource ? path.resolve(options.resource) : null,
    package: options.package ? path.resolve(options.package) : null,
    appPlan: appPlanPath,
    packageSummary: packageSummary ? summarizePackage(packageSummary) : null,
    findings,
  };
}

function loadReferences(registry, registryPath, findings) {
  const refs = new Map();
  for (const ref of asArray(registry?.references)) {
    if (!ref?.templateId) continue;
    const templatePath = path.resolve(path.dirname(registryPath), "..", "..", ref.sourceTemplate || "");
    const template = fs.existsSync(templatePath) ? readJson(templatePath, findings, "DATA_TABLE_TEMPLATE_PARSE_FAILED") : null;
    refs.set(String(ref.templateId), {
      ...ref,
      templatePath,
      templateRoot: template?._ak_c || template,
    });
  }
  return refs;
}

function validateRegistry(registry, references, findings) {
  if (!registry) return;
  for (const id of asArray(registry.approvedTemplateIds).map(String)) {
    if (!references.has(id)) findings.push(error("DATA_TABLE_REGISTRY_REFERENCE_MISSING", "Approved Data table template ID must have a registry reference.", { templateId: id }));
  }
  for (const ref of references.values()) {
    for (const key of REQUIRED_GUIDANCE_KEYS) {
      const value = ref[key];
      if (value === undefined || (Array.isArray(value) && value.length === 0) || String(value || "").trim() === "") {
        findings.push(error("DATA_TABLE_REFERENCE_GUIDANCE_INCOMPLETE", "Data table golden reference is missing required App Plan selection guidance.", { templateId: ref.templateId, missing: key }));
      }
    }
    if (!fs.existsSync(ref.templatePath)) {
      findings.push(error("DATA_TABLE_TEMPLATE_FILE_MISSING", "Data table source template file is missing.", { templateId: ref.templateId, sourceTemplate: ref.sourceTemplate }));
      continue;
    }
    if (!isObject(ref.templateRoot)) {
      findings.push(error("DATA_TABLE_TEMPLATE_ROOT_INVALID", "Data table source template must parse to an object control.", { templateId: ref.templateId }));
      continue;
    }
    if (String(ref.templateRoot.type || "") !== CONTROL_TYPE) {
      findings.push(error("DATA_TABLE_TEMPLATE_CONTROL_TYPE_INVALID", "Data table source template root must be a data-list control.", { templateId: ref.templateId, actual: ref.templateRoot.type || null }));
    }
    validateTemplateVariant(ref.templateRoot, ref, findings, { title: ref.displayName || ref.templateId, surface: "registry", path: "$", registryMode: true });
  }
}

function validatePackage(packagePath, context) {
  if (!fs.existsSync(packagePath)) {
    context.findings.push(error("DATA_TABLE_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return null;
  }
  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch (err) {
    context.findings.push(error("DATA_TABLE_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: packagePath }));
    return null;
  }
  const summary = { occurrences: [], byTemplateId: new Map([...context.references.keys()].map((id) => [id, []])) };
  for (const resource of collectResources(decoded)) {
    const before = context.findings.length;
    validateResource(resource.root, {
      ...resource,
      references: context.references,
      findings: context.findings,
      summary,
    });
    if (context.findings.length > before) {
      const text = JSON.stringify(resource.root);
      if (text.includes("{{") || text.includes("[object Object]")) {
        context.findings.push(error("DATA_TABLE_RESOURCE_PLACEHOLDER_UNRESOLVED", "Data table host resource contains unresolved template placeholder text.", { title: resource.title, surface: resource.surface }));
      }
    }
  }
  return summary;
}

function validateResource(resource, context) {
  if (!isObject(resource)) return;
  const entries = flattenControls(resource);
  for (const entry of entries) {
    if (!isDataTableControl(entry.node)) continue;
    const ids = templateIdCandidates(entry.node);
    const approvedIds = ids.filter((id) => context.references.has(id));
    if (!approvedIds.length) {
      const unknown = ids.find((id) => /data_table|data-table/i.test(id));
      context.findings.push(error(unknown ? "DATA_TABLE_TEMPLATE_UNKNOWN" : "DATA_TABLE_TEMPLATE_ID_MISSING", unknown ? "Generated Data table control references an unapproved template ID." : "Generated Data table controls must carry an approved Data table template ID.", {
        title: context.title,
        surface: context.surface,
        path: entry.pointer,
        templateIds: ids,
      }));
      continue;
    }
    const templateId = approvedIds[0];
    const ref = context.references.get(templateId);
    validateGeneratedControl(entry.node, ref, context, entry.pointer);
    const occurrence = { templateId, title: context.title, surface: context.surface, path: entry.pointer };
    context.summary?.occurrences.push(occurrence);
    if (!context.summary?.byTemplateId.has(templateId)) context.summary?.byTemplateId.set(templateId, []);
    context.summary?.byTemplateId.get(templateId)?.push(occurrence);
  }
}

function validateGeneratedControl(control, ref, context, pointer) {
  if (String(control?.type || "") !== CONTROL_TYPE) {
    context.findings.push(error("DATA_TABLE_CONTROL_TYPE_MISMATCH", "Generated Data table control type must be data-list.", detail(context, pointer, { templateId: ref.templateId, actual: control?.type || null })));
    return;
  }
  if (Array.isArray(control.children) && control.children.length) {
    context.findings.push(error("DATA_TABLE_CHILDREN_FORBIDDEN", "Data table golden reference is a single data-list control and must not grow child controls.", detail(context, pointer, { templateId: ref.templateId, childCount: control.children.length })));
  }
  if (!templateIdCandidates(control).includes(ref.templateId) || !dataTableTemplateIdCandidates(control).includes(ref.templateId)) {
    context.findings.push(error("DATA_TABLE_TEMPLATE_ID_CONTRACT_MISSING", "Generated Data table controls must carry both templateId and dataTableTemplateId equal to the selected approved template ID.", detail(context, pointer, { templateId: ref.templateId, actual: templateIdCandidates(control) })));
  }
  validateLockedAttrs(control, ref, context, pointer);
  validateTemplateVariant(control, ref, context.findings, { title: context.title, surface: context.surface, path: pointer, registryMode: false });
  validateDataBinding(control, ref, context, pointer);
  const text = JSON.stringify(control);
  if (text.includes("{{") || text.includes("[object Object]")) {
    context.findings.push(error("DATA_TABLE_CONTROL_PLACEHOLDER_UNRESOLVED", "Generated Data table control must not contain unresolved template placeholder text.", detail(context, pointer, { templateId: ref.templateId })));
  }
}

function validateLockedAttrs(control, ref, context, pointer) {
  const templateAttrs = ref.templateRoot?.attrs || {};
  const attrs = control?.attrs || {};
  for (const key of LOCKED_ATTR_KEYS) {
    if (templateAttrs[key] === undefined) continue;
    if (!sameJson(attrs[key], templateAttrs[key])) {
      context.findings.push(error("DATA_TABLE_LOCKED_STYLE_DRIFT", "Generated Data table locked style/layout attrs must match the selected source template.", detail(context, pointer, { templateId: ref.templateId, attr: key })));
    }
  }
}

function validateTemplateVariant(control, ref, findings, context) {
  const attrs = control?.attrs || {};
  if (!sameJson(attrs.table?.cwt, ref.expectedTableCwt)) {
    findings.push(error("DATA_TABLE_COLUMN_WIDTH_MODE_INVALID", "Generated Data table Column width mode must match the selected template.", detail(context, context.path, { templateId: ref.templateId, expected: ref.expectedTableCwt, actual: attrs.table?.cwt ?? null })));
  }
  if (ref.caption) {
    const caption = attrs.caption || {};
    for (const key of ["display", "search", "add", "showmore"]) {
      if (caption[key] !== true) {
        findings.push(error("DATA_TABLE_CAPTION_CONTRACT_INVALID", "Caption Data table template must preserve caption display/search/add/more behavior.", detail(context, context.path, { templateId: ref.templateId, key, actual: caption[key] ?? null })));
      }
    }
    for (const key of ["title", "placeholder", "addtext"]) {
      if (!present(caption[key])) {
        findings.push(error("DATA_TABLE_CAPTION_TEXT_MISSING", "Caption Data table template must provide business caption title, search placeholder, and add button text.", detail(context, context.path, { templateId: ref.templateId, key })));
      }
    }
  } else if (attrs.caption?.display === true) {
    findings.push(error("DATA_TABLE_CAPTION_FORBIDDEN", "Standard no-caption Data table templates must not enable the caption toolbar.", detail(context, context.path, { templateId: ref.templateId })));
  }
}

function validateDataBinding(control, ref, context, pointer) {
  const attrs = control?.attrs || {};
  if (!isObject(attrs.data?.list)) {
    context.findings.push(error("DATA_TABLE_SOURCE_MISSING", "Generated Data table must map attrs.data.list to a legal source resource.", detail(context, pointer, { templateId: ref.templateId })));
  }
  const columns = asArray(attrs.listarr);
  if (!columns.length) {
    context.findings.push(error("DATA_TABLE_COLUMNS_MISSING", "Generated Data table must include meaningful display columns in attrs.listarr.", detail(context, pointer, { templateId: ref.templateId })));
    return;
  }
  for (const [index, column] of columns.entries()) {
    if (!present(column?.Field) || !present(column?.FieldName)) {
      context.findings.push(error("DATA_TABLE_COLUMN_BINDING_INVALID", "Every Data table display column must include Field and FieldName.", detail(context, pointer, { templateId: ref.templateId, columnIndex: index, Field: column?.Field ?? null, FieldName: column?.FieldName ?? null })));
    }
  }
}

function validateAppPlanMaterialization(appPlanPath, context) {
  if (!fs.existsSync(appPlanPath)) {
    context.findings.push(error("DATA_TABLE_APP_PLAN_MISSING", "App Plan file is missing.", { appPlan: appPlanPath }));
    return;
  }
  const planText = fs.readFileSync(appPlanPath, "utf8");
  const planned = collectPlannedTemplates(planText, context.references);
  if (!planned.length) return;
  if (!context.packageSummary) {
    context.findings.push(error("DATA_TABLE_PACKAGE_REQUIRED_FOR_APP_PLAN", "App Plan declares Data table templates, so package validation is required.", { appPlan: appPlanPath, plannedCount: planned.length }));
    return;
  }
  for (const record of planned) {
    const occurrences = context.packageSummary.byTemplateId.get(record.templateId) || [];
    if (!occurrences.length) {
      context.findings.push(error("DATA_TABLE_PLANNED_TEMPLATE_NOT_MATERIALIZED", "App Plan selected a Data table golden reference, but the generated package does not materialize that template.", record));
    }
  }
}

function collectPlannedTemplates(planText, references) {
  const records = [];
  const ids = [...references.keys()];
  const lines = String(planText || "").split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const id of ids) {
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(^|[^A-Za-z0-9_-])${escaped}($|[^A-Za-z0-9_-])`).test(line)) {
        records.push({ templateId: id, line: index + 1, row: line.trim() });
      }
    }
  }
  return records.filter((record) => references.has(record.templateId));
}

function collectResources(decoded) {
  const resources = [];
  const seen = new Set();
  function add(root, title, surface, pointer) {
    if (!isObject(root)) return;
    if (!containsDataTable(root)) return;
    if (seen.has(root)) return;
    seen.add(root);
    resources.push({ root, title, surface, pointer });
  }
  walkDecoded(decoded, (value, pointer) => {
    if (!isObject(value)) return;
    if (Array.isArray(value.children)) add(value, value.Title || value.title || value.name || pointer, inferSurface(pointer, value), pointer);
    for (const key of ["Resource", "DefResource", "formdef", "LayoutView"]) {
      const parsed = parseJsonMaybe(value[key]);
      if (isObject(parsed)) add(parsed?._ak_c || parsed, value.Title || value.title || value.name || key, inferSurface(pointer, value), `${pointer}.${key}`);
    }
    for (const item of asArray(value.LayoutInResources)) {
      const parsed = parseJsonMaybe(item?.Resource);
      if (isObject(parsed)) add(parsed?._ak_c || parsed, value.Title || value.title || "Layout resource", inferSurface(pointer, value), `${pointer}.LayoutInResources.Resource`);
    }
  });
  return resources;
}

function walkDecoded(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkDecoded(item, visitor, `${pointer}[${index}]`));
    return;
  }
  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (typeof child === "string") {
        const parsed = parseJsonMaybe(child);
        if (isObject(parsed)) walkDecoded(parsed, visitor, `${pointer}.${key}<json>`);
      }
      walkDecoded(child, visitor, `${pointer}.${key}`);
    }
  }
}

function containsDataTable(root) {
  let found = false;
  walk(root, (node) => {
    if (isDataTableControl(node)) found = true;
  });
  return found;
}

function flattenControls(root) {
  const entries = [];
  function visit(node, pointer = "$", ancestors = []) {
    if (!isObject(node)) return;
    entries.push({ node, pointer, ancestors });
    asArray(node.children).forEach((child, index) => visit(child, `${pointer}.children[${index}]`, [...ancestors, node]));
  }
  visit(root);
  return entries;
}

function isDataTableControl(node) {
  return isObject(node) && String(node.type || "") === CONTROL_TYPE && (isObject(node.attrs?.table) || Array.isArray(node.attrs?.listarr) || templateIdCandidates(node).some((id) => /data_table|data-table/i.test(id)));
}

function templateIdCandidates(node) {
  return [
    node?.templateId,
    node?.dataTableTemplateId,
    node?.goldenReferenceId,
    node?.attrs?.templateId,
    node?.attrs?.dataTableTemplateId,
    node?.attrs?.goldenReferenceId,
  ].filter(present).map(String);
}

function dataTableTemplateIdCandidates(node) {
  return [
    node?.dataTableTemplateId,
    node?.attrs?.dataTableTemplateId,
  ].filter(present).map(String);
}

function inferSurface(pointer, value) {
  const text = `${pointer} ${value?.Type || ""} ${value?.PageRole || ""} ${value?.Role || ""} ${value?.WorkflowType || ""}`.toLowerCase();
  if (text.includes("pages") || text.includes("dashboard") || text.includes("103")) return "dashboard";
  if (text.includes("approval") || text.includes("defresource") || text.includes("pageurls")) return "approval-form";
  if (text.includes("layout") || text.includes("formnewreports") || text.includes("datareports")) return "data-list-form";
  if (text.includes("schedule")) return "schedule-workflow-task";
  return "resource";
}

function summarizePackage(summary) {
  return {
    occurrenceCount: summary.occurrences.length,
    byTemplateId: Object.fromEntries([...summary.byTemplateId.entries()].map(([id, rows]) => [id, rows.length])),
  };
}

function readJson(file, findings, code) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    findings.push(error(code, err.message, { file }));
    return null;
  }
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function present(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function detail(context, pathValue, extra = {}) {
  return {
    surface: context.surface,
    title: context.title,
    path: pathValue,
    ...extra,
  };
}

function error(code, message, detailValue = {}) {
  return { level: "error", code, message, ...detailValue };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--registry") args.registry = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : REGISTRY_PATH;
    else if (arg === "--resource") args.resource = argv[++i];
    else if (arg === "--surface") args.surface = argv[++i];
    else if (arg === "--package") args.package = argv[++i];
    else if (arg === "--app-plan" || arg === "--plan") args.appPlan = argv[++i];
  }
  return args;
}

function printUsage() {
  console.error(`Usage:
  node scripts/validate-data-table-golden-references.mjs --registry
  node scripts/validate-data-table-golden-references.mjs --resource <resource.json> [--surface dashboard|data-list-form|approval-form-submission|approval-form-task|approval-form-print-page]
  node scripts/validate-data-table-golden-references.mjs --package <app.yapk> [--plan <yeeflow-app-plan.md>]`);
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
