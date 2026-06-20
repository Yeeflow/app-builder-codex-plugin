#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { addFinding, asArray, isObject, readJsonFile, safePath, scalar, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.blueprint || !args.resource) usage(args.help ? 0 : 1);
  const report = compareBlueprintToDecodedResource(args);
  console.log(args.format === "markdown" ? formatMarkdown(report) : JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function compareBlueprintToDecodedResource({ blueprint: blueprintPath, resource: resourcePath, format = "json" } = {}) {
  const findings = [];
  const blueprint = readJsonFile(blueprintPath);
  const resource = readJsonFile(resourcePath);
  const pages = asArray(blueprint.pages || blueprint.pageBlueprints);
  const resourcePages = normalizeResourcePages(resource);

  if (!resource.parityValidationRun && !resource.resourceBlueprintParityValidated) {
    addFinding(findings, "error", "RESOURCE_BLUEPRINT_PARITY_MISSING", "Decoded resource parity validation must run before package/sign/upgrade claims.");
  }

  for (const page of pages) validatePageParity(page, resourcePages, findings);
  validateWorkflow(resource.workflow || blueprint.workflow, findings);

  return {
    status: statusFromFindings(findings),
    blueprint: safePath(blueprintPath),
    resource: safePath(resourcePath),
    findings,
  };
}

function validatePageParity(page, resourcePages, findings) {
  const slug = scalar(page.pageSlug || page.slug || page.id || page.title);
  const actualPage = resourcePages.find((candidate) => candidate.slug === slug);
  if (!actualPage) {
    addFinding(findings, "error", "RESOURCE_SECTION_MISSING_FROM_BLUEPRINT", "Decoded resource is missing a page declared by the blueprint.", { page: slug });
    return;
  }
  const actualControls = collectControls(actualPage.resource);
  const byId = new Map(actualControls.map((control) => [scalar(control.id || control.ID), control]));
  const sections = new Set(actualControls.map((control) => normalizeName(control.section || control.sectionId || control.attrs?.section || control.nv_label)).filter(Boolean));

  for (const section of asArray(page.sections).map(normalizeName).filter(Boolean)) {
    if (!sections.has(section)) {
      addFinding(findings, "error", "RESOURCE_SECTION_MISSING_FROM_BLUEPRINT", "Decoded resource is missing a blueprint section.", { page: slug, section });
    }
  }

  for (const expected of asArray(page.controls)) {
    const id = scalar(expected.id);
    const actual = byId.get(id);
    if (!actual) {
      addFinding(findings, "error", "RESOURCE_CONTROL_MISSING_FROM_BLUEPRINT", "Decoded resource is missing a blueprint-mapped control.", { page: slug, control: id });
      continue;
    }
    if (normalizeType(actual.type || actual.Type) !== normalizeType(expected.type || expected.controlType)) {
      addFinding(findings, "error", "RESOURCE_CONTROL_TYPE_MISMATCH", "Decoded resource control type does not match the blueprint.", { page: slug, control: id });
    }
    if (expected.nv_label && actual.nv_label !== expected.nv_label) {
      addFinding(findings, "error", "RESOURCE_CONTROL_PROPERTY_MISSING", "Decoded resource control is missing the blueprint nv_label.", { page: slug, control: id, propertyPath: "nv_label" });
    }
    for (const property of asArray(expected.properties || expected.propertyPaths)) {
      const propertyPath = scalar(property.path || property.propertyPath || property);
      if (propertyPath && !hasPath(actual, propertyPath)) {
        addFinding(findings, "error", "RESOURCE_CONTROL_PROPERTY_MISSING", "Decoded resource control is missing a required blueprint property.", { page: slug, control: id, propertyPath });
      }
    }
    if (expected.requiresBinding && !isObject(actual.binding) && !isObject(actual.attrs?.data) && !isObject(actual.attrs?.field)) {
      addFinding(findings, "error", "RESOURCE_BINDING_MISSING", "Decoded resource control is missing required blueprint binding metadata.", { page: slug, control: id });
    }
    if (expected.requiresAction && !actual.attrs?.["action-type"] && !actual["action-type"]) {
      addFinding(findings, "error", "RESOURCE_ACTION_MISSING", "Decoded resource action control is missing required action metadata.", { page: slug, control: id });
    }
    validateTextResourceParity(expected, actual, findings, slug, id);
  }

  for (const control of actualControls) {
    if (normalizeType(control.type || control.Type) === "text") {
      addFinding(findings, "error", "RESOURCE_TEXT_CONTROL_UNSUPPORTED_TYPE", "Decoded generated resource must not use unsupported ad hoc type:\"text\" for Text controls.", { page: slug, control: scalar(control.id || control.ID) });
    }
    const visible = [control.text, control.label, control.title, control.attrs?.text, control.attrs?.title, control.attrs?.headc?.title?.value].map(scalar).join(" ");
    if (/(__temp_|temp_[a-z0-9_]+|\{\{.*\}\}|\$\{.*\})/i.test(visible)) {
      addFinding(findings, "error", "RAW_VARIABLE_TEXT_VISIBLE", "Decoded resource must not render raw variables or formulas in visible text.", { page: slug, control: scalar(control.id || control.ID) });
    }
    if (control.placeholder === true || /placeholder|todo|lorem/i.test(visible)) {
      addFinding(findings, "error", "RESOURCE_CONTROL_MISSING_FROM_BLUEPRINT", "Decoded resource contains placeholder text instead of mapped design content.", { page: slug, control: scalar(control.id || control.ID) });
    }
    const link = control.detailLink || control.attrs?.detailLink || control.attrs?.link;
    if (isObject(link) && (link.resolved === false || link.rawIdOnly === true || !link.target)) {
      addFinding(findings, "error", "COLLECTION_LINK_FORM_UNRESOLVED", "Collection/detail/form links must resolve to valid form/layout choices.", { page: slug, control: scalar(control.id || control.ID) });
    }
  }
}

function validateTextResourceParity(expected, actual, findings, page, id) {
  if (normalizeType(expected.type || expected.controlType) !== "heading") return;
  const attrs = actual.attrs || {};
  const title = attrs.headc?.title || {};
  const expectedStyle = expected.textStyleContract || expected.textStyle || {};
  const dynamicExpected = /field value|variable binding|calculated value|runtime value|dynamic|summary|temp variable/i.test(scalar(expectedStyle.contentSource || expected.contentSource))
    || expected.requiresBinding
    || expected.dynamicText === true;
  if (!Array.isArray(attrs.heads?.ty) && !isObject(attrs.heads?.ty)) {
    addFinding(findings, "error", "RESOURCE_TEXT_TYPOGRAPHY_MISSING", "Decoded Text control must include supported attrs.heads.ty typography shape.", { page, control: id, propertyPath: "attrs.heads.ty" });
  }
  if (typeof attrs.heads?.color !== "string" || /^\[/.test(attrs.heads?.color || "")) {
    addFinding(findings, "error", "RESOURCE_TEXT_COLOR_SHAPE_UNSUPPORTED", "Decoded Text control color must use the proven plain string attrs.heads.color format.", { page, control: id, propertyPath: "attrs.heads.color" });
  }
  if (!actual.nv_label || /^(title|description|text|label|value)$/i.test(actual.nv_label)) {
    addFinding(findings, "error", "RESOURCE_TEXT_NV_LABEL_MISSING", "Decoded Text control must keep a meaningful nv_label.", { page, control: id, propertyPath: "nv_label" });
  }
  if (dynamicExpected && !Array.isArray(title.variable)) {
    addFinding(findings, "error", "RESOURCE_TEXT_DYNAMIC_BINDING_MISSING", "Dynamic Text content must be generated as attrs.headc.title.variable[] rather than static placeholder text.", { page, control: id, propertyPath: "attrs.headc.title.variable" });
  }
  if (!dynamicExpected && !scalar(title.value).trim()) {
    addFinding(findings, "error", "RESOURCE_TEXT_STATIC_VALUE_MISSING", "Static Text controls must include attrs.headc.title.value.", { page, control: id, propertyPath: "attrs.headc.title.value" });
  }
}

function validateWorkflow(workflow, findings) {
  if (!workflow) return;
  if (started(workflow.packageSignUpgrade) && !isComplete(workflow.resourceBlueprintParityValidation)) {
    addFinding(findings, "error", "NEXT_STEP_STARTED_WITH_INCOMPLETE_PRIOR_STEP", "Package/sign/upgrade cannot start until resource-vs-blueprint parity and local hard gates pass.");
  }
  if (workflow.runtimeProof?.status === "claimed" && !isComplete(workflow.runtimeBrowserEvidence)) {
    addFinding(findings, "error", "STEP_COMPLETION_EVIDENCE_MISSING", "Runtime proof cannot claim success until Chrome/runtime evidence exists.");
  }
}

function normalizeResourcePages(resource) {
  if (Array.isArray(resource.pages)) return resource.pages.map((page) => ({ slug: scalar(page.pageSlug || page.slug || page.id || page.title), resource: page.resource || page }));
  if (Array.isArray(resource.Pages)) return resource.Pages.map((page) => ({ slug: scalar(page.pageSlug || page.slug || page.ID || page.Title), resource: page.resource || page.Resource || page }));
  return [{ slug: scalar(resource.pageSlug || resource.slug || "page"), resource }];
}

function collectControls(root) {
  const controls = [];
  walk(root, (node) => {
    if (isObject(node) && (node.id || node.ID || node.type || node.Type)) controls.push(node);
  });
  return controls;
}

function walk(value, visitor) {
  if (!isObject(value)) return;
  visitor(value);
  for (const key of ["children", "controls", "items", "columns", "rows", "cells", "content"]) {
    for (const child of asArray(value[key])) walk(child, visitor);
  }
}

function hasPath(object, propertyPath) {
  let current = object;
  for (const part of propertyPath.split(".")) {
    if (!isObject(current) || !(part in current)) return false;
    current = current[part];
  }
  return true;
}

function isComplete(step) {
  return isObject(step) && (step.status === "complete" || step.status === "pass") && Boolean(step.evidence || step.artifact || step.path || step.completedAt);
}

function started(step) {
  return isObject(step) && step.status && step.status !== "not-started";
}

function normalizeName(value) {
  return scalar(value?.id || value?.slug || value?.title || value?.name || value).trim().toLowerCase();
}

function normalizeType(value) {
  return scalar(value).trim().toLowerCase();
}

function parseArgs(argv) {
  const args = { format: "json" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--blueprint") args.blueprint = argv[++index];
    else if (arg === "--resource") args.resource = argv[++index];
    else if (arg === "--format") args.format = argv[++index];
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage: node scripts/compare-blueprint-to-decoded-resource.mjs --blueprint <page-blueprint.json> --resource <decoded-resource.json> [--format json|markdown]");
  process.exit(exitCode);
}

function formatMarkdown(report) {
  const lines = [`# Blueprint/Decoded Resource Parity: ${report.status}`];
  for (const finding of report.findings) lines.push(`- ${finding.level}: ${finding.code} - ${finding.message}`);
  return lines.join("\n");
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
