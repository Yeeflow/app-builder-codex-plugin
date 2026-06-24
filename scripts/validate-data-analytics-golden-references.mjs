#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk, walk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/data-analytics-golden-references.json");
const DASHBOARD_V11_TEMPLATE_ID = "dashboard-page-layouts-v1.1";
const ANALYTICS_TYPES = new Set(["pie-chart", "bar-chart", "line-chart", "pivot-table"]);
const APPROVED_DASHBOARD_V11_SECTION_IDS = new Set(["2_columns_section", "3_columns_section"]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.registry && !args.resource && !args.package)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateDataAnalyticsGoldenReferences(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDataAnalyticsGoldenReferences(options = {}) {
  const findings = [];
  const registryPath = path.resolve(options.registry || REGISTRY_PATH);
  const registry = readJson(registryPath, findings, "DATA_ANALYTICS_REGISTRY_MISSING");
  const references = new Map(asArray(registry?.references).map((item) => [String(item?.templateId || ""), item]).filter(([id]) => id));
  validateRegistry(registry, references, findings, registryPath);

  if (options.resource) {
    const surface = String(options.surface || "dashboard");
    const resource = readJson(path.resolve(options.resource), findings, "DATA_ANALYTICS_RESOURCE_MISSING");
    validateResource(resource, { surface, pageTitle: path.basename(options.resource), findings, references });
  }

  if (options.package) validatePackage(path.resolve(options.package), { findings, references });

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: registryPath,
    resource: options.resource ? path.resolve(options.resource) : null,
    package: options.package ? path.resolve(options.package) : null,
    findings,
  };
}

function validateRegistry(registry, references, findings, registryPath) {
  if (!registry) return;
  const approved = new Set(asArray(registry.approvedTemplateIds).map(String));
  for (const id of approved) {
    if (!references.has(id)) {
      findings.push(error("DATA_ANALYTICS_REGISTRY_REFERENCE_MISSING", "Approved Data Analytics template ID must have a registry reference.", { templateId: id }));
    }
  }
  for (const reference of references.values()) {
    const templatePath = path.resolve(path.dirname(registryPath), "..", "..", reference.sourceTemplate || "");
    if (!fs.existsSync(templatePath)) {
      findings.push(error("DATA_ANALYTICS_TEMPLATE_FILE_MISSING", "Data Analytics source template file is missing.", { templateId: reference.templateId, sourceTemplate: reference.sourceTemplate }));
      continue;
    }
    const template = readJson(templatePath, findings, "DATA_ANALYTICS_TEMPLATE_PARSE_FAILED");
    const root = template?._ak_c || template;
    const index = indexResource(root);
    const wrapper = findByIdentity(index, reference.rootWrapperId);
    if (!wrapper) {
      findings.push(error("DATA_ANALYTICS_TEMPLATE_ROOT_MISSING", "Data Analytics template must include its declared root wrapper/control identity.", { templateId: reference.templateId, rootWrapperId: reference.rootWrapperId }));
    }
    if (reference.titleControlId && !findByIdentity(index, reference.titleControlId)) {
      findings.push(error("DATA_ANALYTICS_TEMPLATE_TITLE_MISSING", "Chart-with-title template must include its declared title Text control.", { templateId: reference.templateId, titleControlId: reference.titleControlId }));
    }
    const analyticsControls = index.entries.filter((entry) => ANALYTICS_TYPES.has(String(entry.node?.type || "")));
    if (!analyticsControls.some((entry) => String(entry.node?.type || "") === String(reference.controlType || ""))) {
      findings.push(error("DATA_ANALYTICS_TEMPLATE_CONTROL_TYPE_MISSING", "Data Analytics template must include the declared analytics control type.", { templateId: reference.templateId, expectedControlType: reference.controlType }));
    }
    for (const editableId of asArray(reference.editableRegions)) {
      if (!findByIdentity(index, editableId)) {
        findings.push(error("DATA_ANALYTICS_TEMPLATE_EDITABLE_REGION_MISSING", "Data Analytics template is missing a declared editable region.", { templateId: reference.templateId, editableRegion: editableId }));
      }
    }
  }
}

function validatePackage(packagePath, context) {
  if (!fs.existsSync(packagePath)) {
    context.findings.push(error("DATA_ANALYTICS_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return;
  }
  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch (err) {
    context.findings.push(error("DATA_ANALYTICS_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: packagePath }));
    return;
  }

  for (const page of collectDashboardPages(decoded)) {
    validateResource(page.resource, { surface: "dashboard", pageTitle: page.title, findings: context.findings, references: context.references });
  }
  for (const form of collectDataListForms(decoded)) {
    validateResource(form.resource, { surface: "data-list-form", pageTitle: form.title, findings: context.findings, references: context.references });
  }
  for (const form of collectApprovalForms(decoded)) {
    validateResource(form.resource, { surface: "approval-form", pageTitle: form.title, findings: context.findings, references: context.references });
  }
}

function validateResource(resource, context) {
  if (!isObject(resource)) {
    context.findings.push(error("DATA_ANALYTICS_RESOURCE_INVALID", "Resource must parse as an object.", { page: context.pageTitle, surface: context.surface }));
    return;
  }
  const index = indexResource(resource);
  validateUnknownTemplateMarkers(index, context);
  const analyticsControls = index.entries.filter((entry) => ANALYTICS_TYPES.has(String(entry.node?.type || "")));
  if (!analyticsControls.length) return;

  if (context.surface === "approval-form") {
    for (const entry of analyticsControls) {
      context.findings.push(error("DATA_ANALYTICS_APPROVAL_FORM_FORBIDDEN", "Data Analytics templates must not be used on Approval forms.", { page: context.pageTitle, path: entry.pointer, type: entry.node?.type }));
    }
    return;
  }

  const isDashboardV11 = context.surface === "dashboard" && resourceHasIdentity(resource, DASHBOARD_V11_TEMPLATE_ID);
  for (const entry of analyticsControls) {
    const provenance = resolveTemplateProvenance(entry, index, context.references);
    if (!provenance.templateId) {
      context.findings.push(error("DATA_ANALYTICS_TEMPLATE_PROVENANCE_MISSING", "Every Data Analytics control must carry or inherit one approved Data Analytics golden reference template ID.", { page: context.pageTitle, path: entry.pointer, type: entry.node?.type }));
      continue;
    }
    const reference = context.references.get(provenance.templateId);
    if (!reference) {
      context.findings.push(error("DATA_ANALYTICS_TEMPLATE_UNKNOWN", "Data Analytics control references an unapproved template ID.", { page: context.pageTitle, path: entry.pointer, templateId: provenance.templateId }));
      continue;
    }
    if (String(entry.node?.type || "") !== String(reference.controlType || "")) {
      context.findings.push(error("DATA_ANALYTICS_TEMPLATE_CONTROL_TYPE_MISMATCH", "Generated Data Analytics control type must match the selected golden reference.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, expectedControlType: reference.controlType, actualControlType: entry.node?.type }));
    }
    if (reference.rootWrapperId && !findNearestAncestorByIdentity(entry, reference.rootWrapperId, true)) {
      context.findings.push(error("DATA_ANALYTICS_TEMPLATE_WRAPPER_MISSING", "Generated Data Analytics control must live inside the full approved template wrapper/control subtree, not a simplified lookalike.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, rootWrapperId: reference.rootWrapperId }));
    }
    if (reference.titleControlId && !findByIdentity(index, reference.titleControlId)) {
      context.findings.push(error("DATA_ANALYTICS_TEMPLATE_TITLE_CONTROL_MISSING", "Chart-with-title templates must include the approved title Text control.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, titleControlId: reference.titleControlId }));
    }
    if (isDashboardV11 && !hasAncestorInSet(entry, APPROVED_DASHBOARD_V11_SECTION_IDS)) {
      context.findings.push(error("DATA_ANALYTICS_DASHBOARD_V11_SECTION_PLACEMENT_INVALID", "Dashboard Page Layouts v1.1 Data Analytics templates must be placed inside 2_columns_section or 3_columns_section.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, approvedSectionContainers: [...APPROVED_DASHBOARD_V11_SECTION_IDS] }));
    }
  }
}

function validateUnknownTemplateMarkers(index, context) {
  for (const entry of index.entries) {
    for (const candidate of templateIdCandidates(entry.node)) {
      if (/^data_analytics_/.test(candidate) && !context.references.has(candidate)) {
        context.findings.push(error("DATA_ANALYTICS_TEMPLATE_UNKNOWN", "Resource contains an unapproved Data Analytics template ID.", { page: context.pageTitle, path: entry.pointer, templateId: candidate }));
      }
    }
  }
}

function collectDashboardPages(decoded) {
  const pages = [];
  for (const [index, page] of asArray(decoded?.Pages).entries()) {
    const resource = parseResource(page?.LayoutInResources?.[0]?.Resource || page?.Resource || page?.LayoutView);
    if (resource) pages.push({ title: page?.Title || page?.Name || `Pages[${index}]`, resource });
  }
  return pages;
}

function collectDataListForms(decoded) {
  const forms = [];
  for (const [childIndex, child] of asArray(decoded?.Childs || decoded?.Data?.Childs).entries()) {
    for (const [layoutIndex, layout] of asArray(child?.Layouts).entries()) {
      for (const [resourceIndex, layoutResource] of asArray(layout?.LayoutInResources).entries()) {
        const resource = parseResource(layoutResource?.Resource);
        if (resource) forms.push({ title: `${child?.Title || child?.Name || `Childs[${childIndex}]`} / ${layout?.Title || layout?.Name || `Layouts[${layoutIndex}]`} / ${resourceIndex}`, resource });
      }
    }
  }
  return forms;
}

function collectApprovalForms(decoded) {
  const forms = [];
  for (const [index, form] of asArray(decoded?.Forms || decoded?.FormNewReports).entries()) {
    const candidates = [
      form?.LayoutInResources?.[0]?.Resource,
      form?.DefResource,
      form?.Resource,
      form?.LayoutView,
    ];
    for (const candidate of candidates) {
      const resource = parseResource(candidate);
      if (resource) forms.push({ title: form?.Title || form?.Name || `ApprovalForm[${index}]`, resource });
    }
  }
  return forms;
}

function parseResource(value) {
  const parsed = parseJsonMaybe(value);
  if (isObject(parsed)) return parsed;
  if (isObject(value)) return value;
  return null;
}

function indexResource(resource) {
  const entries = [];
  const parentByPointer = new Map();
  const entryByPointer = new Map();
  function visit(node, pointer, parentPointer) {
    if (!isObject(node)) return;
    const entry = { node, pointer, parentPointer, index: null };
    entries.push(entry);
    entryByPointer.set(pointer, entry);
    if (parentPointer) parentByPointer.set(pointer, parentPointer);
    for (const [key, child] of Object.entries(node)) {
      if (Array.isArray(child)) child.forEach((item, index) => visit(item, `${pointer}.${key}[${index}]`, pointer));
      else if (isObject(child) && key !== "attrs") visit(child, `${pointer}.${key}`, pointer);
    }
  }
  visit(resource, "$", null);
  const index = { entries, parentByPointer, entryByPointer };
  for (const entry of entries) entry.index = index;
  return index;
}

function resolveTemplateProvenance(entry, index, references) {
  const approved = new Set(references.keys());
  let current = entry;
  while (current) {
    const id = templateIdFromNode(current.node, approved);
    if (id) return { templateId: id, sourcePointer: current.pointer };
    current = index.entryByPointer.get(index.parentByPointer.get(current.pointer));
  }
  return {};
}

function templateIdFromNode(node, approved) {
  const candidates = templateIdCandidates(node);
  return candidates.find((candidate) => approved.has(candidate)) || candidates.find((candidate) => /^data_analytics_/.test(candidate)) || "";
}

function templateIdCandidates(node) {
  return [
    node?.dataAnalyticsTemplateId,
    node?.analyticsTemplateId,
    node?.templateId,
    node?.derivedFromDataAnalyticsGoldenReference,
    node?.derivedFromGoldenReference,
    node?.attrs?.dataAnalyticsTemplateId,
    node?.attrs?.analyticsTemplateId,
    node?.attrs?.templateId,
    node?.attrs?.derivedFromDataAnalyticsGoldenReference,
    node?.attrs?.derivedFromGoldenReference,
    node?.attrs?.provenance?.dataAnalyticsTemplateId,
  ].map((value) => String(value || ""));
}

function findNearestAncestorByIdentity(entry, identity, includeSelf = false) {
  let current = includeSelf ? entry : null;
  if (!current) return null;
  while (current) {
    if (resourceHasIdentity(current.node, identity)) return current;
    current = current.index?.entryByPointer?.get(current.index?.parentByPointer?.get(current.pointer));
  }
  return null;
}

function hasAncestorInSet(entry, identitySet) {
  let current = entry;
  while (current) {
    if (identityCandidates(current.node).some((id) => identitySet.has(id))) return true;
    current = current.index?.entryByPointer?.get(current.index?.parentByPointer?.get(current.pointer));
  }
  return false;
}

function findByIdentity(index, identity) {
  return index.entries.find((entry) => identityCandidates(entry.node).includes(identity)) || null;
}

function resourceHasIdentity(node, identity) {
  return identityCandidates(node).includes(identity) || JSON.stringify([
    node?.derivedFromDashboardPageLayoutTemplate,
    node?.attrs?.derivedFromDashboardPageLayoutTemplate,
    node?.templateId,
    node?.attrs?.templateId,
  ]).includes(identity);
}

function identityCandidates(node) {
  if (!isObject(node)) return [];
  const attrs = isObject(node.attrs) ? node.attrs : {};
  return [
    node.id,
    node.name,
    node.label,
    node.nv_label,
    node.nav_label,
    node.key,
    node.title,
    attrs.id,
    attrs.name,
    attrs.label,
    attrs.nv_label,
    attrs.nav_label,
    attrs.key,
    attrs.title,
    attrs?.common?.name,
    attrs?.common?.nv_label,
  ].filter((value) => value !== undefined && value !== null).map(String);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}

function readJson(filePath, findings, code) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    findings.push(error(code, `Could not read JSON: ${err.message}`, { path: filePath }));
    return null;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help") args.help = true;
    else if (token === "--registry") args.registry = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : REGISTRY_PATH;
    else if (token === "--resource") args.resource = argv[++index];
    else if (token === "--surface") args.surface = argv[++index];
    else if (token === "--package") args.package = argv[++index];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-data-analytics-golden-references.mjs --registry
  node scripts/validate-data-analytics-golden-references.mjs --resource <resource.json> --surface <dashboard|data-list-form|approval-form>
  node scripts/validate-data-analytics-golden-references.mjs --package <app.yapk>`);
}

function error(code, message, data = {}) {
  return { level: "error", code, message, ...data };
}
