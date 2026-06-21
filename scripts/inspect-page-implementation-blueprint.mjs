#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { addFinding, asArray, isObject, readJsonFile, safePath, scalar, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.blueprint) usage(args.help ? 0 : 1);
  const report = inspectPageImplementationBlueprint(args);
  console.log(args.format === "markdown" ? formatMarkdown(report) : JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function inspectPageImplementationBlueprint({
  blueprint: blueprintPath,
  normalizedRegistry = "docs/reference/yeeflow-control-configurations.normalized.json",
  extensionRegistry = "docs/reference/yeeflow-control-property-extensions.json",
  format = "json",
} = {}) {
  const findings = [];
  const blueprint = readJsonFile(blueprintPath);
  const registry = loadPropertyRegistry(normalizedRegistry, extensionRegistry);
  const pages = asArray(blueprint.pages || blueprint.pageBlueprints);

  if (!pages.length) {
    addFinding(findings, "error", "PAGE_IMPLEMENTATION_BLUEPRINT_MISSING", "Every page requires a page implementation blueprint before Yeeflow resource generation.");
  }

  for (const page of pages) validatePageBlueprint(page, registry, findings);
  validateBlueprintStepEvidence(blueprint.workflow || blueprint.stepEvidence, findings);

  return {
    status: statusFromFindings(findings),
    blueprint: safePath(blueprintPath),
    findings,
  };
}

function validatePageBlueprint(page, registry, findings) {
  const slug = scalar(page.pageSlug || page.slug || page.id || page.title);
  for (const field of ["purpose", "layout", "sections", "controls", "runtimeProofPlan"]) {
    if (field === "sections" || field === "controls") {
      if (!asArray(page[field]).length) addFinding(findings, "error", "PAGE_BLUEPRINT_INCOMPLETE", "Page implementation blueprint is missing required section/control detail.", { page: slug, field });
    } else if (!page[field]) {
      addFinding(findings, "error", "PAGE_BLUEPRINT_INCOMPLETE", "Page implementation blueprint is missing required page purpose, layout, or runtime proof plan.", { page: slug, field });
    }
  }

  const controlIds = new Set(asArray(page.controls).map((control) => scalar(control.id)).filter(Boolean));
  for (const element of asArray(page.designElements || page.visibleElements)) {
    const mapped = scalar(element.controlId || element.mappedControlId || element.id);
    if (!mapped || !controlIds.has(mapped)) {
      addFinding(findings, "error", "DESIGN_ELEMENT_UNMAPPED_TO_CONTROL", "Every visible design element must map to a generated Yeeflow control.", { page: slug, element: safeLabel(element) });
    }
  }

  for (const control of asArray(page.controls)) validateControlContract(control, registry, findings, slug);
}

function validateControlContract(control, registry, findings, pageSlug) {
  const id = scalar(control.id);
  const type = normalizeType(control.type || control.controlType);
  if (!id || !type || !control.nv_label || !("parentId" in control) && !control.root) {
    addFinding(findings, "error", "PAGE_BLUEPRINT_INCOMPLETE", "Each blueprint control needs id, type, nv_label, and parent/child relationship metadata.", { page: pageSlug, control: id || safeLabel(control) });
  }

  const properties = asArray(control.properties || control.propertyPaths);
  if (!properties.length && control.requiresProperties !== false) {
    addFinding(findings, "error", "CONTROL_PROPERTY_CONTRACT_INCOMPLETE", "Blueprint controls must declare exact Yeeflow property paths before resource generation.", { page: pageSlug, control: id });
  }
  for (const property of properties) {
    const path = scalar(property.path || property.propertyPath || property);
    if (!path) {
      addFinding(findings, "error", "CONTROL_PROPERTY_CONTRACT_INCOMPLETE", "Control-property contract includes a blank property path.", { page: pageSlug, control: id });
      continue;
    }
    if (!isPropertyVerified(type, path, registry)) {
      addFinding(findings, "error", "CONTROL_PROPERTY_PATH_UNVERIFIED", "Every blueprint property path must be product-catalog-backed or evidence-backed by the extension registry.", { page: pageSlug, control: id, propertyPath: path });
    }
  }

  if (control.requiresBinding && !isObject(control.binding)) {
    addFinding(findings, "error", "CONTROL_BINDING_CONTRACT_INCOMPLETE", "Controls with data behavior need source/list/field/filter/Summary binding contracts.", { page: pageSlug, control: id });
  }
  if (control.requiresAction && !isObject(control.action)) {
    addFinding(findings, "error", "CONTROL_INTERACTION_CONTRACT_INCOMPLETE", "Action-looking controls need Yeeflow action metadata in the blueprint.", { page: pageSlug, control: id });
  }
}

function validateBlueprintStepEvidence(workflow, findings) {
  if (!workflow) return;
  if (!isComplete(workflow.fullPageDesignImages)) {
    addFinding(findings, "error", "NEXT_STEP_STARTED_WITH_INCOMPLETE_PRIOR_STEP", "Blueprinting cannot start until full-page canonical design images are complete.");
  }
  if (started(workflow.resourceGeneration) && !isComplete(workflow.blueprintValidation)) {
    addFinding(findings, "error", "BLUEPRINT_VALIDATION_NOT_RUN", "Resource generation cannot start until blueprint validation passes.");
  }
}

function loadPropertyRegistry(normalizedRegistry, extensionRegistry) {
  const normalized = readJsonFile(normalizedRegistry);
  const extensions = readJsonFile(extensionRegistry);
  const catalogByType = new Map();
  for (const [controlType, controlSpec] of Object.entries(normalized.controls || {})) {
    catalogByType.set(normalizeType(controlType), new Set(Object.keys(controlSpec.properties || {})));
  }
  const extensionPaths = new Set();
  for (const pattern of asArray(extensions.patterns)) {
    for (const key of Object.keys(pattern.requiredProperties || pattern.required || {})) {
      if (key !== "type") extensionPaths.add(key);
    }
  }
  for (const extension of asArray(extensions.extensions)) {
    const path = scalar(extension.path || extension.propertyPath);
    if (path) extensionPaths.add(path);
  }
  return { catalogByType, extensionPaths };
}

function isPropertyVerified(type, propertyPath, registry) {
  const catalog = registry.catalogByType.get(normalizeType(type));
  return Boolean(catalog?.has(propertyPath) || registry.extensionPaths.has(propertyPath));
}

function isComplete(step) {
  return isObject(step) && (step.status === "complete" || step.status === "pass") && Boolean(step.evidence || step.artifact || step.path || step.completedAt);
}

function started(step) {
  return isObject(step) && step.status && step.status !== "not-started";
}

function normalizeType(value) {
  return scalar(value).trim().toLowerCase();
}

function safeLabel(value) {
  return scalar(value?.id || value?.slug || value?.title || value?.name || value);
}

function parseArgs(argv) {
  const args = { format: "json" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--blueprint") args.blueprint = argv[++index];
    else if (arg === "--normalized-registry") args.normalizedRegistry = argv[++index];
    else if (arg === "--extension-registry") args.extensionRegistry = argv[++index];
    else if (arg === "--format") args.format = argv[++index];
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage: node scripts/inspect-page-implementation-blueprint.mjs --blueprint <page-blueprint.json> [--normalized-registry <normalized.json>] [--extension-registry <extensions.json>] [--format json|markdown]");
  process.exit(exitCode);
}

function formatMarkdown(report) {
  const lines = [`# Page Implementation Blueprint Fidelity: ${report.status}`];
  for (const finding of report.findings) lines.push(`- ${finding.level}: ${finding.code} - ${finding.message}`);
  return lines.join("\n");
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
