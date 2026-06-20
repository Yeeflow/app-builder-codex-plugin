#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addFinding, asArray, isObject, readJsonFile, scalar, statusFromFindings, walkControls } from "./lib/yeeflow-ui-hard-gate-utils.mjs";
import {
  categoryAllowed,
  collectSurfaces,
  inferTemplateCategory,
  isNewEditSurface,
  loadRegistry,
  selectedTemplateIds,
  surfaceIdOf,
  surfaceTypeOf,
  validatePatternSelection,
} from "./validate-ui-pattern-selection.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_REGISTRY = path.join(ROOT, "docs/templates/yeeflow-ui-section-template-library.normalized.json");
const HTML_ONLY_CONTROLS = new Set(["html", "html-preview", "dom", "css", "div", "span", "section", "article", "web-component"]);
const PROOF_STATUSES = new Set(["runtime-proven", "export-proven", "inferred", "needs-golden-proof"]);

const args = parseArgs(process.argv.slice(2));
if (!args.blueprint && !args.blueprints && !args.input) {
  console.error("Usage: node scripts/validate-blueprint-ui-pattern-conformance.mjs --blueprint <page-implementation-blueprint.json> [--pattern-selection <selection.json>] [--registry <normalized-library.json>]");
  process.exit(2);
}

const blueprintPath = path.resolve(args.blueprint || args.blueprints || args.input);
const registryPath = path.resolve(args.registry || DEFAULT_REGISTRY);
const patternSelection = args["pattern-selection"] ? readJsonFile(path.resolve(args["pattern-selection"])) : null;
const result = validateBlueprintPatternConformance(readJsonFile(blueprintPath), {
  registry: loadRegistry(registryPath),
  registryPath,
  blueprintPath,
  patternSelection,
});

console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "pass" ? 0 : 1);

export function validateBlueprintPatternConformance(blueprint, options = {}) {
  const registry = options.registry || loadRegistry(options.registryPath || DEFAULT_REGISTRY);
  const findings = [];
  const surfaces = collectBlueprintSurfaces(blueprint);
  const selectionSurfaces = options.patternSelection ? new Map(collectSurfaces(options.patternSelection).map((surface) => [surfaceIdOf(surface), surface])) : new Map();

  if (!surfaces.length) {
    addFinding(findings, "error", "BLUEPRINT_UI_PATTERN_NO_SURFACES", "Blueprint artifact must include at least one UI surface/page blueprint.");
  }

  for (const surface of surfaces) {
    const mergedSurface = mergeSelection(surface, selectionSurfaces.get(surfaceIdOf(surface)));
    validateSurfaceBlueprint(findings, mergedSurface, registry);
  }

  const status = statusFromFindings(findings);
  return {
    status,
    validator: "validate-blueprint-ui-pattern-conformance",
    registry: relativePath(options.registryPath || DEFAULT_REGISTRY),
    surfaceCount: surfaces.length,
    findings,
  };
}

function validateSurfaceBlueprint(findings, surface, registry) {
  const surfaceId = surfaceIdOf(surface);
  const surfaceType = surfaceTypeOf(surface);
  const templateIds = selectedTemplateIds(surface);

  const selectionResult = validatePatternSelection({ surfaces: [surface] }, { registry });
  findings.push(...selectionResult.findings);

  const controls = collectControls(surface);
  const controlTokens = collectControlTokens(controls);
  const fieldTokens = collectFieldTokens(surface, controls);
  const bindingTokens = collectBindingTokens(surface, controls);
  const actionTokens = collectActionTokens(surface, controls);
  const deferredTokens = collectDeferredTokens(surface);

  if (!controls.length) {
    addFinding(findings, "error", "BLUEPRINT_UI_PATTERN_CONTROLS_MISSING", "Blueprint surface must include Yeeflow controls for the selected pattern.", {
      surfaceId,
      surfaceType,
    });
  }

  for (const control of controls) {
    const type = scalar(control.type || control.controlType || control.yeeflowControl || control.control || control.name).toLowerCase();
    if (HTML_ONLY_CONTROLS.has(type)) {
      addFinding(findings, "error", "BLUEPRINT_UI_PATTERN_HTML_ONLY_CONTROL", "Blueprint must not model HTML/DOM/CSS concepts as Yeeflow controls.", {
        surfaceId,
        controlType: type,
      });
    }
  }

  for (const templateId of templateIds) {
    const template = registry.templatesById.get(templateId);
    if (!template) continue;
    if (!categoryAllowed(surfaceType, template, templateId)) continue;

    requireTemplateTokens(findings, surface, template, templateId, "requiredControls", controlTokens, "BLUEPRINT_UI_PATTERN_REQUIRED_CONTROL_MISSING");
    requireTemplateTokens(findings, surface, template, templateId, "requiredChildControls", controlTokens, "BLUEPRINT_UI_PATTERN_REQUIRED_CHILD_CONTROL_MISSING");
    requireTemplateTokens(findings, surface, template, templateId, "requiredDataBindings", bindingTokens, "BLUEPRINT_UI_PATTERN_REQUIRED_BINDING_MISSING", deferredTokens);
    requireTemplateTokens(findings, surface, template, templateId, "requiredFields", fieldTokens, "BLUEPRINT_UI_PATTERN_REQUIRED_FIELD_MISSING", deferredTokens);
    requireTemplateTokens(findings, surface, template, templateId, "actionRules", actionTokens, "BLUEPRINT_UI_PATTERN_REQUIRED_ACTION_MISSING", deferredTokens, isActionRequired);

    const proofStatus = scalar(surface.templateProofStatuses?.[templateId] || surface.patternProofStatus || template.proofStatus);
    if (!proofStatus || !PROOF_STATUSES.has(proofStatus)) {
      addFinding(findings, "error", "BLUEPRINT_UI_PATTERN_PROOF_STATUS_MISSING", "Blueprint must preserve each selected pattern proof status.", {
        surfaceId,
        templateId,
        proofStatus,
      });
    }
  }

  validateNewEditBodyDiscipline(findings, surface, registry, templateIds);

  if (surface.readyForResourceGeneration === true && hasBlockingSurfaceFinding(findings, surfaceId)) {
    addFinding(findings, "error", "BLUEPRINT_UI_PATTERN_READY_FOR_RESOURCE_GENERATION_BLOCKED", "readyForResourceGeneration: true is blocked when blueprint pattern conformance fails.", {
      surfaceId,
    });
  }
}

function requireTemplateTokens(findings, surface, template, templateId, key, availableTokens, code, deferredTokens = new Set(), filter = () => true) {
  const surfaceId = surfaceIdOf(surface);
  for (const required of asArray(template[key]).map(scalar).filter(Boolean).filter(filter)) {
    if (tokenSetHas(availableTokens, required)) continue;
    if (tokenSetHas(deferredTokens, required)) continue;
    addFinding(findings, "error", code, `${key} from selected template must be present in the Blueprint or explicitly deferred.`, {
      surfaceId,
      templateId,
      required,
    });
  }
}

function validateNewEditBodyDiscipline(findings, surface, registry, templateIds) {
  if (!isNewEditSurface(surfaceTypeOf(surface))) return;
  const surfaceId = surfaceIdOf(surface);
  const regions = asArray(surface.regions || surface.lowerPageRegions || surface.relatedRegions || surface.sections);
  for (const region of regions) {
    const name = scalar(region.regionName || region.name || region.title || region.id || region);
    if (/\b(primary form fields|main form fields|editable fields|document metadata fields)\b/i.test(name)) {
      addFinding(findings, "error", "BLUEPRINT_UI_PATTERN_PRIMARY_FIELD_REGION_FORBIDDEN", "New/Edit form primary fields must be represented as form-body controls, not generic lower-page regions.", {
        surfaceId,
        regionName: name,
      });
    }
  }
  for (const templateId of templateIds) {
    const template = registry.templatesById.get(templateId);
    const category = scalar(template?.category || inferTemplateCategory(templateId));
    if (category === "dashboard" || /\b(kpi|dashboard|summary_card)\b/i.test(templateId)) {
      addFinding(findings, "error", "BLUEPRINT_UI_PATTERN_DASHBOARD_TEMPLATE_USED_AS_FORM_BODY", "Dashboard templates cannot be used as a New/Edit form body.", {
        surfaceId,
        templateId,
      });
    }
  }
}

function collectBlueprintSurfaces(blueprint) {
  if (Array.isArray(blueprint)) return blueprint;
  if (!isObject(blueprint)) return [];
  return asArray(blueprint.surfaces || blueprint.pages || blueprint.blueprints || blueprint.pageImplementationBlueprints || blueprint.uiSurfaces || [blueprint]).filter(isObject);
}

function mergeSelection(surface, selection) {
  if (!selection) return surface;
  return {
    ...selection,
    ...surface,
    templateId: surface.templateId || selection.templateId,
    templateIds: surface.templateIds || selection.templateIds,
    selectedTemplateIds: surface.selectedTemplateIds || selection.selectedTemplateIds,
    selectedTemplates: surface.selectedTemplates || selection.selectedTemplates,
    patternProofStatus: surface.patternProofStatus || selection.patternProofStatus,
    templateProofStatuses: { ...(selection.templateProofStatuses || {}), ...(surface.templateProofStatuses || {}) },
  };
}

function collectControls(surface) {
  const roots = asArray(surface.controls || surface.controlHierarchy || surface.yeeflowControls || surface.sections || surface.regions);
  const controls = [];
  for (const root of roots) {
    if (isObject(root)) walkControls(root, (control) => controls.push(control));
    else controls.push({ type: root, id: root, role: root });
  }
  return controls;
}

function collectControlTokens(controls) {
  const tokens = new Set();
  for (const control of controls) {
    for (const value of [
      control.type,
      control.controlType,
      control.yeeflowControl,
      control.control,
      control.role,
      control.controlRole,
      control.templateRole,
      control.id,
      control.blueprintId,
      control.nv_label,
      control.label,
      control.name,
    ]) addToken(tokens, value);
  }
  return tokens;
}

function collectFieldTokens(surface, controls) {
  const tokens = new Set();
  for (const field of asArray(surface.fields || surface.requiredFields || surface.fieldMappings || surface.fieldGroups)) {
    if (isObject(field)) {
      addToken(tokens, field.fieldName || field.name || field.id || field.fieldId);
      for (const nested of asArray(field.fields)) addToken(tokens, nested.fieldName || nested.name || nested);
    } else addToken(tokens, field);
  }
  for (const control of controls) {
    addToken(tokens, control.fieldName || control.field || control.fieldId || control.binding?.field || control.dataBinding?.field);
  }
  return tokens;
}

function collectBindingTokens(surface, controls) {
  const tokens = new Set();
  for (const binding of asArray(surface.dataBindings || surface.bindings || surface.requiredDataBindings || surface.bindingMappings)) {
    if (isObject(binding)) {
      addToken(tokens, binding.bindingId || binding.id || binding.name || binding.type || binding.fieldName || binding.field);
      for (const value of Object.values(binding)) addToken(tokens, value);
    } else addToken(tokens, binding);
  }
  for (const control of controls) {
    for (const value of [
      control.binding,
      control.dataBinding,
      control.sourceList,
      control.sourceField,
      control.fieldName,
      control.summaryBinding,
      control.variable,
      control.tempVar,
      control.parentBinding,
    ]) {
      if (isObject(value)) Object.values(value).forEach((nested) => addToken(tokens, nested));
      else addToken(tokens, value);
    }
  }
  return tokens;
}

function collectActionTokens(surface, controls) {
  const tokens = new Set();
  for (const action of asArray(surface.actions || surface.requiredActions || surface.actionMappings)) {
    if (isObject(action)) {
      addToken(tokens, action.actionId || action.id || action.name || action.type || action.actionType || action.rule);
      for (const value of Object.values(action)) addToken(tokens, value);
    } else addToken(tokens, action);
  }
  for (const control of controls) {
    for (const value of [control.actionId, control.actionType, control.action, control.actionRule, control.control_action, control.attrs?.actions]) {
      if (Array.isArray(value)) value.forEach((nested) => isObject(nested) ? Object.values(nested).forEach((token) => addToken(tokens, token)) : addToken(tokens, nested));
      else if (isObject(value)) Object.values(value).forEach((nested) => addToken(tokens, nested));
      else addToken(tokens, value);
    }
  }
  for (const deferred of asArray(surface.inactiveActions || surface.deferredActions)) addToken(tokens, deferred.actionId || deferred.id || deferred.name || deferred);
  return tokens;
}

function collectDeferredTokens(surface) {
  const tokens = new Set();
  for (const value of [
    ...asArray(surface.deferredDataBindings),
    ...asArray(surface.deferredFields),
    ...asArray(surface.deferredActions),
    ...asArray(surface.inactiveActions),
    ...asArray(surface.deferredPatternRequirements),
  ]) {
    if (isObject(value)) Object.values(value).forEach((nested) => addToken(tokens, nested));
    else addToken(tokens, value);
  }
  return tokens;
}

function isActionRequired(rule) {
  return /action|button|binding/i.test(rule);
}

function addToken(tokens, value) {
  const text = scalar(value);
  if (!text) return;
  tokens.add(normalizeToken(text));
}

function tokenSetHas(tokens, required) {
  const normalized = normalizeToken(required);
  if (tokens.has(normalized)) return true;
  for (const token of tokens) {
    if (token.includes(normalized) || normalized.includes(token)) return true;
  }
  return false;
}

function normalizeToken(value) {
  return scalar(value).toLowerCase().replace(/[_\s-]+/g, "");
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
