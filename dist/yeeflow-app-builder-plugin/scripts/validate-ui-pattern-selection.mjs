#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addFinding, asArray, isObject, readJsonFile, scalar, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_REGISTRY = path.join(ROOT, "docs/templates/yeeflow-ui-section-template-library.normalized.json");
const IS_MAIN = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
const PROOF_STATUSES = new Set(["runtime-proven", "export-proven", "inferred", "needs-golden-proof"]);
const HTML_ONLY_CONTROLS = new Set(["html", "html-preview", "dom", "css", "div", "span", "section", "article", "web-component"]);
const PRIMARY_FIELD_REGION_RE = /\b(primary form fields|main form fields|editable fields|document metadata fields)\b/i;
const GENERIC_LOWER_REGION_RE = /\b(lower region|generic lower|supporting region|below fold|page filler)\b/i;
const DASHBOARD_CARD_RE = /\b(kpi|card|dashboard|summary|analytics)\b/i;

if (IS_MAIN) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.selection && !args.input) {
    console.error("Usage: node scripts/validate-ui-pattern-selection.mjs --selection <pattern-selection.json> [--registry <normalized-library.json>]");
    process.exit(2);
  }

  const selectionPath = path.resolve(args.selection || args.input);
  const registryPath = path.resolve(args.registry || DEFAULT_REGISTRY);
  const result = validatePatternSelection(readJsonFile(selectionPath), {
    registry: loadRegistry(registryPath),
    selectionPath,
    registryPath,
  });

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "pass" ? 0 : 1);
}

export function validatePatternSelection(selection, options = {}) {
  const registry = options.registry || loadRegistry(options.registryPath || DEFAULT_REGISTRY);
  const findings = [];
  const surfaces = collectSurfaces(selection);

  if (!surfaces.length) {
    addFinding(findings, "error", "UI_PATTERN_SELECTION_NO_SURFACES", "Pattern selection artifact must include at least one UI surface.");
  }

  for (const surface of surfaces) {
    validateSurfaceSelection(findings, surface, registry);
  }

  const status = statusFromFindings(findings);
  return {
    status,
    validator: "validate-ui-pattern-selection",
    registry: relativePath(options.registryPath || DEFAULT_REGISTRY),
    surfaceCount: surfaces.length,
    findings,
  };
}

function validateSurfaceSelection(findings, surface, registry) {
  const surfaceId = surfaceIdOf(surface);
  const surfaceType = surfaceTypeOf(surface);
  const templateIds = selectedTemplateIds(surface);

  if (!surfaceType) {
    addFinding(findings, "error", "UI_PATTERN_SURFACE_TYPE_MISSING", "Every UI surface must declare surfaceType.", { surfaceId });
  }

  if (!templateIds.length) {
    addFinding(findings, "error", "UI_PATTERN_TEMPLATE_ID_MISSING", "Every UI surface must select at least one templateId.", { surfaceId, surfaceType });
  }

  const declaredProofStatus = scalar(surface.patternProofStatus || surface.proofStatus || surface.patternProof?.status);
  if (declaredProofStatus && !PROOF_STATUSES.has(declaredProofStatus)) {
    addFinding(findings, "error", "UI_PATTERN_PROOF_STATUS_INVALID", "Pattern proof status must be runtime-proven, export-proven, inferred, or needs-golden-proof.", {
      surfaceId,
      proofStatus: declaredProofStatus,
    });
  }

  for (const templateId of templateIds) {
    const template = registry.templatesById.get(templateId);
    if (!template) {
      addFinding(findings, "error", "UI_PATTERN_TEMPLATE_ID_UNKNOWN", "Selected templateId must exist in docs/templates/yeeflow-ui-section-template-library.normalized.json.", {
        surfaceId,
        surfaceType,
        templateId,
      });
      continue;
    }

    if (!categoryAllowed(surfaceType, template, templateId)) {
      addFinding(findings, "error", "UI_PATTERN_TEMPLATE_CATEGORY_MISMATCH", "Selected template category must match the UI surface type.", {
        surfaceId,
        surfaceType,
        templateId,
        category: scalar(template.category || "collection-control"),
        allowedCategories: allowedCategoriesForSurface(surfaceType).join(", "),
      });
    }

    const proofStatus = scalar(surface.templateProofStatuses?.[templateId] || template.proofStatus || surface.patternProofStatus);
    if (proofStatus && !PROOF_STATUSES.has(proofStatus)) {
      addFinding(findings, "error", "UI_PATTERN_TEMPLATE_PROOF_STATUS_INVALID", "Template proof status must be preserved with an allowed proof-state value.", {
        surfaceId,
        templateId,
        proofStatus,
      });
    }
  }

  validateForbiddenMisuse(findings, surface, templateIds, registry);
  if (surface.readyForResourceGeneration === true && hasBlockingSurfaceFinding(findings, surfaceId)) {
    addFinding(findings, "error", "UI_PATTERN_READY_FOR_RESOURCE_GENERATION_BLOCKED", "readyForResourceGeneration: true is blocked when pattern selection fails.", {
      surfaceId,
    });
  }
}

function validateForbiddenMisuse(findings, surface, templateIds, registry) {
  const surfaceId = surfaceIdOf(surface);
  const surfaceType = surfaceTypeOf(surface);
  const lowerRegions = asArray(surface.lowerPageRegions || surface.relatedRegions || surface.allowedRegions || surface.regions)
    .map((region) => scalar(region.regionName || region.name || region.title || region))
    .filter(Boolean);

  if (isNewEditSurface(surfaceType)) {
    for (const templateId of templateIds) {
      const template = registry.templatesById.get(templateId);
      const category = scalar(template?.category || "collection-control");
      if (category === "dashboard" || DASHBOARD_CARD_RE.test(templateId)) {
        addFinding(findings, "error", "UI_PATTERN_DASHBOARD_TEMPLATE_USED_AS_FORM_BODY", "Dashboard KPI/card/templates must not be used as a New/Edit form body.", {
          surfaceId,
          surfaceType,
          templateId,
        });
      }
      if (["related_records_section", "collection_control_responsive_card_grid", "collection_control_grid_table"].includes(templateId)) {
        addFinding(findings, "error", "UI_PATTERN_GENERIC_LOWER_TEMPLATE_USED_FOR_PRIMARY_FIELDS", "Generic related/lower-region templates must not carry primary editable fields.", {
          surfaceId,
          surfaceType,
          templateId,
        });
      }
    }
    for (const regionName of lowerRegions) {
      if (PRIMARY_FIELD_REGION_RE.test(regionName) || GENERIC_LOWER_REGION_RE.test(regionName)) {
        addFinding(findings, "error", "UI_PATTERN_PRIMARY_FIELD_REGION_FORBIDDEN", "New/Edit primary editable fields belong in the form body, not generic lower-page regions.", {
          surfaceId,
          regionName,
        });
      }
    }
  }

  for (const control of asArray(surface.controls || surface.requiredControls || surface.plannedControls)) {
    const type = scalar(control.type || control.controlType || control.yeeflowControl || control).toLowerCase();
    if (HTML_ONLY_CONTROLS.has(type)) {
      addFinding(findings, "error", "UI_PATTERN_HTML_ONLY_CONTROL_FORBIDDEN", "HTML/DOM/CSS-only concepts must not be selected as Yeeflow controls.", {
        surfaceId,
        controlType: type,
      });
    }
  }
}

export function loadRegistry(registryPath = DEFAULT_REGISTRY) {
  const registry = readJsonFile(registryPath);
  const templates = asArray(registry.templates);
  return {
    raw: registry,
    templates,
    templatesById: new Map(templates.map((template) => [scalar(template.templateId), template]).filter(([id]) => id)),
  };
}

export function collectSurfaces(artifact) {
  if (Array.isArray(artifact)) return artifact;
  if (!isObject(artifact)) return [];
  return asArray(artifact.surfaces || artifact.uiSurfaces || artifact.patternSelections || artifact.pages || artifact.blueprints);
}

export function selectedTemplateIds(surface) {
  const values = [
    surface.templateId,
    surface.selectedTemplateId,
    surface.uiPatternTemplateId,
    ...asArray(surface.templateIds),
    ...asArray(surface.selectedTemplateIds),
    ...asArray(surface.selectedTemplates).map((template) => template.templateId || template.id || template),
    ...asArray(surface.patterns).map((pattern) => pattern.templateId || pattern.id || pattern),
  ];
  return [...new Set(values.map(scalar).filter(Boolean))];
}

export function surfaceIdOf(surface) {
  return scalar(surface.surfaceId || surface.pageId || surface.blueprintId || surface.id || surface.name || surface.surfaceName || "unknown-surface");
}

export function surfaceTypeOf(surface) {
  return scalar(surface.surfaceType || surface.type || surface.pageType || surface.resourceType || surface.kind);
}

export function categoryAllowed(surfaceType, template, templateId = "") {
  const category = scalar(template?.category || inferTemplateCategory(templateId));
  return allowedCategoriesForSurface(surfaceType).includes(category);
}

export function allowedCategoriesForSurface(surfaceType) {
  const type = scalar(surfaceType).toLowerCase();
  if (/dashboard|home|analytics|reporting|workbench|queue|workspace/.test(type)) return ["dashboard", "item-template", "collection-control", ""];
  if (/approval.*(submission|task)|task.*form|approval.*form/.test(type)) return ["approval-form-workspace", "data-list-form", "item-template", "collection-control"];
  if (/approval.*print|print/.test(type)) return ["data-list-form", "item-template", "collection-control"];
  if (/document.*(new|edit|view|detail|form)|library.*(new|edit|view|detail|form)/.test(type)) return ["data-list-form", "item-template", "collection-control"];
  if (/(data list|custom).*(new|edit|add|view|detail|form)|new\/edit|add\/edit/.test(type)) return ["data-list-form", "item-template", "collection-control"];
  if (/related|sub list|sub-list|collection|kanban|timeline|item template/.test(type)) return ["item-template", "collection-control", "data-list-form", "dashboard"];
  return ["dashboard", "approval-form-workspace", "data-list-form", "item-template", "collection-control", ""];
}

export function inferTemplateCategory(templateId) {
  if (/^collection_control_/.test(templateId)) return "collection-control";
  return "";
}

export function isNewEditSurface(surfaceType) {
  return /(new|edit|add|add\/edit|new\/edit)/i.test(surfaceType) && /(form|data list|document|library)/i.test(surfaceType);
}

function hasBlockingSurfaceFinding(findings, surfaceId) {
  return findings.some((finding) => finding.level === "error" && (!finding.surfaceId || finding.surfaceId === surfaceId));
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    parsed[arg.slice(2)] = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
  }
  return parsed;
}

function relativePath(file) {
  return file ? path.relative(ROOT, file) || file : null;
}
