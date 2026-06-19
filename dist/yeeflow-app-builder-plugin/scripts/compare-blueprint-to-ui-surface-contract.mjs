#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const PROOF_BOUNDARY =
  "Blueprint-to-UI Surface Contract comparison proves blueprint parity with the design contract only; it does not prove Yeeflow package validity, signing/API acceptance, install/upgrade success, or runtime rendering.";
const DEFAULT_REGISTRY = new Map([
  ["container", "Yeeflow Container"],
  ["grid", "Yeeflow layout grid/container pattern"],
  ["layout-grid", "Yeeflow layout grid/container pattern"],
  ["heading", "Heading"],
  ["text", "Text"],
  ["field-input", "Field input"],
  ["textarea", "Multiline text field control"],
  ["select", "Choice/dropdown field control"],
  ["choice", "Choice/dropdown field control"],
  ["date-picker", "Date/DateTime field control"],
  ["user-picker", "User/person field control"],
  ["number-input", "Number/Currency field control"],
  ["file-upload", "File/attachment/document upload control"],
  ["sub-list", "Sub List"],
  ["collection", "Collection"],
  ["data-table", "Data Table"],
  ["kanban", "Kanban"],
  ["vertical-timeline", "Vertical Timeline"],
  ["horizontal-timeline", "Horizontal Timeline"],
  ["button", "Button/action control"],
  ["status-badge", "Text/label/status style pattern"],
  ["summary-card", "Summary + display wrapper"],
  ["document-preview", "Document preview/open/download pattern"],
  ["custom-code", "Custom code"],
]);
const ALLOWED_PROOF_LABEL_RE = /\b(export-learning-required|runtime-proof-required|deferred)\b/i;
const NEW_EDIT_SURFACE_RE = /\b(new\/edit|add\/edit)\b|\bnew\b.*\bedit\b/i;
const GENERIC_PRIMARY_FIELD_REGION_RE = /\b(primary form fields?|main form fields?|editable fields?|document metadata fields?|primary editable fields?|main editable fields?)\b/i;
const PRIMARY_ACTION_RE = /\b(save(?: as draft)?|cancel|submit|upload|approve|reject|complete)\b/i;

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.contracts || !args.blueprints) {
    console.error("Usage: node scripts/compare-blueprint-to-ui-surface-contract.mjs --contracts <dir-or-json> --blueprints <dir-or-json> [--html <dir>] [--registry <registry.md|json>] [--design-system <design-system.md|json>]");
    process.exit(2);
  }

  const contracts = loadObjects(args.contracts, ["contracts", "surfaces", "uiSurfaceContracts"]);
  const blueprints = loadObjects(args.blueprints, ["blueprints", "pageImplementationBlueprints", "surfaces"]);
  const registry = loadRegistry(args.registry);
  const blueprintBySurface = new Map(blueprints.map((blueprint) => [normalize(blueprint.surfaceId || blueprint.surfaceName || blueprint.pageName), blueprint]));
  const findings = [];

  for (const [index, contract] of contracts.entries()) {
    const surfaceId = text(contract.surfaceId || contract.surfaceName || `surface-${index + 1}`);
    const key = normalize(surfaceId);
    const blueprint = blueprintBySurface.get(key);
    if (!blueprint) {
      add(findings, "error", "BLUEPRINT_SURFACE_MISSING", "A Page Implementation Blueprint is missing for a contract/html-validated surface.", { surfaceId });
      continue;
    }
    validateBlueprintParity(contract, blueprint, findings, surfaceId);
    if (args.html) {
      const htmlPath = resolveHtmlPath(args.html, contract, index);
      if (!htmlPath || !fs.existsSync(htmlPath)) {
        add(findings, "error", "BLUEPRINT_HTML_MAPPING_PREVIEW_MISSING", "Control-mapped HTML preview is missing for blueprint parity comparison.", { surfaceId, htmlPath: safePath(htmlPath) });
      } else {
        const htmlControls = extractMappedHtmlControls(fs.readFileSync(htmlPath, "utf8"));
        validateBlueprintHtmlMappingParity(contract, blueprint, htmlControls, registry, findings, surfaceId);
      }
    }
  }

  const failedIds = new Set(findings.filter((finding) => finding.level === "error").map((finding) => finding.surfaceId).filter(Boolean));
  const surfaceIds = contracts.map((contract, index) => text(contract.surfaceId || contract.surfaceName || `surface-${index + 1}`));
  const result = {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    blueprintCount: blueprints.length,
    passedBlueprints: surfaceIds.filter((surfaceId) => !failedIds.has(surfaceId)),
    failedBlueprints: [...failedIds],
    findings,
    proofBoundary: PROOF_BOUNDARY,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "pass" ? 0 : 1);
}

export function validateBlueprintParity(contract, blueprint, findings, surfaceId) {
  const blueprintText = normalize(blueprint);
  validateNewEditBlueprintDiscipline(contract, blueprint, blueprintText, findings, surfaceId);

  for (const field of asTextArray(contract.requiredFields)) {
    if (!containsItem(blueprint, blueprintText, field) && !hasDeferral(blueprint, field)) {
      add(findings, "error", "BLUEPRINT_REQUIRED_FIELD_MISSING", "Blueprint omits a required field from the UI Surface Contract.", { surfaceId, field });
    }
  }

  for (const action of asTextArray(contract.requiredActions)) {
    if (!containsItem(blueprint, blueprintText, action) && !hasDeferral(blueprint, action)) {
      add(findings, "error", "BLUEPRINT_REQUIRED_ACTION_MISSING", "Blueprint omits a required action from the UI Surface Contract.", { surfaceId, action });
    }
  }

  for (const region of asTextArray(contract.forbiddenRegions)) {
    if (containsItem(blueprint, blueprintText, region) && !hasExplicitPlanning(contract, region) && !hasDeferral(blueprint, region)) {
      add(findings, "error", "BLUEPRINT_FORBIDDEN_REGION_REINTRODUCED", "Blueprint reintroduces a forbidden region from the UI Surface Contract.", { surfaceId, region });
    }
  }

  for (const control of controlMappingNeedles(contract.controlMapping)) {
    if (control && !containsItem(blueprint, blueprintText, control) && !hasDeferral(blueprint, control)) {
      add(findings, "error", "BLUEPRINT_CONTROL_MAPPING_MISSING", "Blueprint omits intended Yeeflow control mapping from the UI Surface Contract.", { surfaceId, control });
    }
  }

  const styleIntent = normalize([
    blueprint.designSystemStyleIntent,
    blueprint.styleIntent,
    blueprint.typographyHierarchy,
    blueprint.spacingScale,
    blueprint.sectionPattern,
    blueprint.cardPattern,
    blueprint.tablePattern,
    blueprint.formPattern,
    blueprint.actionPlacement,
    blueprint.statusBadgeSemantics,
    blueprint.mobileResponsiveIntent,
  ]);
  for (const [code, pattern, label] of [
    ["BLUEPRINT_STYLE_TYPOGRAPHY_INTENT_MISSING", /\b(typography|heading|page title|section title|font)\b/i, "typography hierarchy"],
    ["BLUEPRINT_STYLE_SPACING_INTENT_MISSING", /\b(spacing|gap|padding|density|section gap)\b/i, "spacing scale"],
    ["BLUEPRINT_STYLE_PATTERN_INTENT_MISSING", /\b(card|section|table|form|surface pattern)\b/i, "section/card/table/form pattern"],
    ["BLUEPRINT_ACTION_PLACEMENT_INTENT_MISSING", /\b(action placement|action bar|button row|primary action|decision action)\b/i, "action placement"],
    ["BLUEPRINT_BADGE_STATUS_INTENT_MISSING", /\b(badge|chip|status)\b/i, "status badge/chip semantics"],
    ["BLUEPRINT_MOBILE_INTENT_MISSING", /\b(mobile|responsive|stack|single column|card list|horizontal scroll)\b/i, "mobile/responsive intent"],
  ]) {
    if (!pattern.test(styleIntent) && !hasDeferral(blueprint, label)) {
      add(findings, "error", code, `Blueprint loses design-system style intent for ${label}.`, { surfaceId });
    }
  }

  if (/\bunsupported control|unsupported property|invented property|unknown control\b/i.test(blueprintText) && !hasDeferral(blueprint, "unsupported")) {
    add(findings, "error", "BLUEPRINT_UNSUPPORTED_CONTROL_OR_PROPERTY", "Blueprint must not invent unsupported controls or properties unless explicitly deferred/proof-labeled.", { surfaceId });
  }
}

function validateNewEditBlueprintDiscipline(contract, blueprint, blueprintText, findings, surfaceId) {
  if (!isNewEditSurface(contract.surfaceType)) return;

  if (GENERIC_PRIMARY_FIELD_REGION_RE.test(blueprintText) && !hasDeferral(blueprint, "primary form fields")) {
    add(findings, "error", "BLUEPRINT_NEW_EDIT_PRIMARY_FIELD_REGION_FORBIDDEN", "Blueprint must not preserve a generic Primary form fields/Main form fields lower region for New/Edit surfaces.", {
      surfaceId,
    });
  }

  const controls = blueprintControlObjects(blueprint);
  for (const control of controls) {
    const section = text([control.sectionId, control.regionName, control.sectionName, control.controlRole, control.label, control.title]);
    if (GENERIC_PRIMARY_FIELD_REGION_RE.test(section) && /\b(grid|collection|data-table|data table|kanban|timeline|card|lower-region)\b/i.test(text([control.yeeflowControl, control.controlType, control.type, control.pattern]))) {
      add(findings, "error", "BLUEPRINT_NEW_EDIT_PRIMARY_FORM_BODY_AS_REGION_CONTROL", "Blueprint must model New/Edit primary fields as field controls, not lower-region grid/collection/table/card controls.", {
        surfaceId,
        blueprintId: text(control.blueprintId || control.id || control.controlId),
      });
    }
    const fieldName = text(control.fieldName || control.label || control.name);
    const value = text(control.value ?? control.sampleValue ?? control.currentValue);
    const semantics = text(control.valueSemantics);
    if (fieldName && value && normalize(fieldName) === normalize(value) && !/\bplaceholder\b/i.test(text([semantics, control.placeholder, control.valueRole]))) {
      add(findings, "error", "BLUEPRINT_LABEL_AS_FIELD_VALUE", "Blueprint editable fields must not reuse labels as field values without placeholder semantics.", {
        surfaceId,
        blueprintId: text(control.blueprintId || control.id || control.controlId),
        fieldName,
      });
    }
  }

  const primaryActions = controls
    .filter((control) => PRIMARY_ACTION_RE.test(text([control.actionId, control.actionType, control.actionContract, control.label, control.actionName])))
    .filter((control) => !isRowOrItemAction(control));
  const seen = new Map();
  for (const control of primaryActions) {
    const action = primaryActionName(text([control.actionName, control.actionId, control.actionType, control.actionContract, control.label]));
    if (!action) continue;
    if (seen.has(action)) {
      add(findings, "error", "BLUEPRINT_DUPLICATE_PRIMARY_ACTION", "Blueprint must not duplicate primary Save/Cancel/Submit actions unless the duplicate is row/item/sublist-scoped and declared.", {
        surfaceId,
        action,
        firstBlueprintId: text(seen.get(action).blueprintId || seen.get(action).id || seen.get(action).controlId),
        duplicateBlueprintId: text(control.blueprintId || control.id || control.controlId),
      });
    } else {
      seen.set(action, control);
    }
  }
}

export function validateBlueprintHtmlMappingParity(contract, blueprint, htmlControls, registry, findings, surfaceId) {
  const blueprintControls = blueprintControlObjects(blueprint);
  const byBlueprintId = new Map(blueprintControls.map((control) => [normalize(control.blueprintId || control.id || control.controlId), control]).filter(([key]) => key));
  const declaredContractIds = new Set(controlMappings(contract).map((mapping) => normalize(mapping.blueprintId)).filter(Boolean));
  const declaredHtmlIds = new Set(htmlControls.map((control) => normalize(control.blueprintId)).filter(Boolean));

  for (const htmlControl of htmlControls) {
    const blueprintId = normalize(htmlControl.blueprintId);
    if (!blueprintId) continue;
    const blueprintControl = byBlueprintId.get(blueprintId);
    if (!blueprintControl) {
      add(findings, "error", "BLUEPRINT_HTML_CONTROL_MISSING", "Every data-blueprint-id from control-mapped HTML must appear in the Page Implementation Blueprint.", {
        surfaceId,
        blueprintId: htmlControl.blueprintId,
      });
      continue;
    }
    const htmlControlType = normalize(htmlControl.yeeflowControl);
    const blueprintControlType = normalize(blueprintControl.yeeflowControl || blueprintControl.controlType || blueprintControl.type);
    if (!registry.has(htmlControlType) && !ALLOWED_PROOF_LABEL_RE.test(text([htmlControl.supportedStatus, htmlControl.proofBoundary, htmlControl.proofLabel]))) {
      add(findings, "error", "BLUEPRINT_HTML_CONTROL_MAPPING_UNREGISTERED", "HTML control mapping must be registered before blueprint parity can pass.", {
        surfaceId,
        blueprintId: htmlControl.blueprintId,
        yeeflowControl: htmlControl.yeeflowControl,
      });
    }
    if (htmlControlType && blueprintControlType && !controlTypesMatch(htmlControlType, blueprintControlType, registry)) {
      add(findings, "error", "BLUEPRINT_HTML_CONTROL_TYPE_MISMATCH", "Blueprint control type must match the HTML data-yeeflow-control registry mapping.", {
        surfaceId,
        blueprintId: htmlControl.blueprintId,
        htmlControl: htmlControl.yeeflowControl,
        blueprintControl: text(blueprintControl.yeeflowControl || blueprintControl.controlType || blueprintControl.type),
      });
    }
    for (const [code, htmlKey, blueprintKey, label] of [
      ["BLUEPRINT_HTML_FIELD_BINDING_MISMATCH", "binding", "binding", "field binding"],
      ["BLUEPRINT_HTML_FIELD_ID_MISMATCH", "fieldId", "fieldId", "field ID"],
      ["BLUEPRINT_HTML_FIELD_TYPE_MISMATCH", "fieldType", "fieldType", "field type"],
      ["BLUEPRINT_HTML_ACTION_CONTRACT_MISMATCH", "actionContract", "actionContract", "action contract"],
      ["BLUEPRINT_HTML_ACTION_TYPE_MISMATCH", "actionType", "actionType", "action type"],
      ["BLUEPRINT_HTML_SOURCE_LIST_MISMATCH", "sourceList", "sourceList", "source list"],
      ["BLUEPRINT_HTML_PARENT_BINDING_MISMATCH", "parentBinding", "parentBinding", "parent/current item binding"],
      ["BLUEPRINT_HTML_ROW_CONTEXT_MISMATCH", "rowContext", "rowContext", "row context"],
      ["BLUEPRINT_HTML_STYLE_TOKEN_MISMATCH", "styleToken", "styleToken", "style token"],
      ["BLUEPRINT_HTML_LAYOUT_TOKEN_MISMATCH", "layoutToken", "layoutToken", "layout token"],
      ["BLUEPRINT_HTML_RESPONSIVE_TOKEN_MISMATCH", "responsiveToken", "responsiveToken", "responsive token"],
    ]) {
      if (htmlControl[htmlKey] && blueprintControl[blueprintKey] && normalize(htmlControl[htmlKey]) !== normalize(blueprintControl[blueprintKey])) {
        add(findings, "error", code, `Blueprint ${label} must match HTML mapping metadata.`, {
          surfaceId,
          blueprintId: htmlControl.blueprintId,
          expected: htmlControl[htmlKey],
          actual: text(blueprintControl[blueprintKey]),
        });
      } else if (htmlControl[htmlKey] && !blueprintControl[blueprintKey] && !isHelperControl(blueprintControl)) {
        add(findings, "error", code, `Blueprint must preserve HTML ${label}.`, {
          surfaceId,
          blueprintId: htmlControl.blueprintId,
          expected: htmlControl[htmlKey],
        });
      }
    }
  }

  for (const control of blueprintControls) {
    const blueprintId = normalize(control.blueprintId || control.id || control.controlId);
    if (!blueprintId || declaredContractIds.has(blueprintId) || declaredHtmlIds.has(blueprintId) || isHelperControl(control)) continue;
    add(findings, "error", "BLUEPRINT_UNDECLARED_IMPLEMENTATION_CONTROL", "Blueprint must not introduce implementation-relevant controls missing from the UI Surface Contract and HTML mapping.", {
      surfaceId,
      blueprintId: text(control.blueprintId || control.id || control.controlId),
    });
  }
}

function loadObjects(inputPath, arrayKeys) {
  const stat = fs.statSync(inputPath);
  if (stat.isDirectory()) {
    return fs
      .readdirSync(inputPath)
      .filter((name) => name.endsWith(".json"))
      .flatMap((name) => objectsFromJson(JSON.parse(fs.readFileSync(path.join(inputPath, name), "utf8")), arrayKeys));
  }
  return objectsFromJson(JSON.parse(fs.readFileSync(inputPath, "utf8")), arrayKeys);
}

function loadRegistry(registryPath) {
  const registry = new Map(DEFAULT_REGISTRY);
  if (!registryPath) return registry;
  const raw = fs.readFileSync(registryPath, "utf8");
  if (registryPath.endsWith(".json")) {
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed) ? parsed : parsed.mappings || parsed.controls || [];
    for (const entry of entries) {
      const id = normalize(entry.id || entry.htmlControl || entry.dataYeeflowControl || entry.control);
      if (id) registry.set(id, text(entry.yeeflowControl || entry.mapsTo || entry.description || id));
    }
    return registry;
  }
  const re = /`([^`]+)`\s*(?:->|maps to|=>)\s*([^\n]+)/gi;
  let match;
  while ((match = re.exec(raw))) registry.set(normalize(match[1]), match[2].trim());
  return registry;
}

function objectsFromJson(value, arrayKeys) {
  if (Array.isArray(value)) return value;
  for (const key of arrayKeys) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [value];
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg.startsWith("--")) args[arg.slice(2)] = argv[index + 1];
  }
  return args;
}

function resolveHtmlPath(htmlRoot, contract, index) {
  const candidates = [
    contract.htmlPreviewPath,
    contract.htmlPath,
    contract.previewPath,
    path.join(htmlRoot, `${text(contract.surfaceId || `surface-${index + 1}`)}.html`),
    path.join(htmlRoot, `${slug(text(contract.surfaceId || contract.surfaceName || `surface-${index + 1}`))}.html`),
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

function extractMappedHtmlControls(html) {
  return extractElements(html)
    .filter((element) => attr(element, "data-yeeflow-control") || attr(element, "data-blueprint-id"))
    .map((element) => ({
      blueprintId: attr(element, "data-blueprint-id"),
      yeeflowControl: attr(element, "data-yeeflow-control"),
      controlRole: attr(element, "data-control-role"),
      sourceResource: attr(element, "data-source-resource"),
      sourceList: attr(element, "data-source-list"),
      fieldId: attr(element, "data-field-id"),
      fieldName: attr(element, "data-field-name"),
      fieldType: attr(element, "data-field-type"),
      binding: attr(element, "data-binding"),
      required: attr(element, "data-required"),
      readonly: attr(element, "data-readonly"),
      defaultValue: attr(element, "data-default-value"),
      validation: attr(element, "data-validation"),
      actionId: attr(element, "data-action-id"),
      actionType: attr(element, "data-action-type"),
      actionContract: attr(element, "data-action-contract"),
      rowContext: attr(element, "data-row-context"),
      parentBinding: attr(element, "data-parent-binding"),
      styleToken: attr(element, "data-style-token"),
      layoutToken: attr(element, "data-layout-token"),
      responsiveToken: attr(element, "data-responsive-token"),
      supportedStatus: attr(element, "data-supported-status"),
      proofBoundary: attr(element, "data-proof-boundary"),
    }));
}

function extractElements(html) {
  const elements = [];
  const tagRe = /<([a-z][a-z0-9-]*)(\s[^<>]*?)?>/gi;
  let match;
  while ((match = tagRe.exec(html))) elements.push({ tag: match[1].toLowerCase(), attrs: parseAttrs(match[2] || "") });
  return elements;
}

function parseAttrs(rawAttrs) {
  const attrs = {};
  const attrRe = /([:@a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = attrRe.exec(rawAttrs))) attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "true";
  return attrs;
}

function blueprintControlObjects(blueprint) {
  const controls = [];
  for (const key of ["controls", "controlMappings", "blueprintControls", "elements"]) {
    if (Array.isArray(blueprint[key])) {
      for (const item of blueprint[key]) {
        if (item && typeof item === "object") controls.push(item);
      }
    }
  }
  return controls;
}

function controlMappings(contract) {
  return Array.isArray(contract.controlMapping) ? contract.controlMapping.filter((entry) => entry && typeof entry === "object") : [];
}

function controlTypesMatch(htmlType, blueprintType, registry) {
  if (normalize(htmlType) === normalize(blueprintType)) return true;
  const mapped = normalize(registry.get(normalize(htmlType)));
  const blueprint = normalize(blueprintType);
  return Boolean(mapped && (mapped.includes(blueprint) || blueprint.includes(mapped) || mapped.split(/[+/]/).some((part) => blueprint.includes(part.trim()))));
}

function isHelperControl(control) {
  return /helper|hidden|runtime/.test(normalize([control.helperRuntimeControl, control.controlRole, control.supportedStatus]));
}

function isNewEditSurface(surfaceType) {
  return NEW_EDIT_SURFACE_RE.test(text(surfaceType)) && /\b(data\s+list|document|library|form)\b/i.test(text(surfaceType));
}

function isRowOrItemAction(control) {
  return /\b(row|item|sub\s*list|collection|kanban|current row|current item)\b/i.test(text([control.rowContext, control.parentBinding, control.controlRole, control.actionScope, control.regionType]));
}

function primaryActionName(value) {
  const match = text(value).match(PRIMARY_ACTION_RE);
  return match ? normalize(match[1]) : "";
}

function add(findings, level, code, message, detail = {}) {
  findings.push({ level, code, message, ...detail });
}

function text(value) {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim();
}

function asTextArray(value) {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  if (typeof value === "string") return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
  if (value && typeof value === "object") return Object.values(value).flatMap(asTextArray);
  return [];
}

function controlMappingNeedles(value) {
  if (!Array.isArray(value)) return asTextArray(value);
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return asTextArray(entry);
    return [entry.blueprintId, entry.controlId, entry.yeeflowControl, entry.fieldName, entry.actionId, entry.actionContract].map(text).filter(Boolean);
  });
}

function normalize(value) {
  return text(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function slug(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function attr(element, name) {
  return text(element?.attrs?.[name.toLowerCase()]);
}

function safePath(file) {
  return file ? file.split("/").slice(-3).join("/") : null;
}

function containsItem(object, objectText, value) {
  return objectText.includes(normalize(value)) || asTextArray(object.fields || object.controls || object.actions || object.regions || object.sections).map(normalize).includes(normalize(value));
}

function hasDeferral(object, needle = "") {
  const combined = normalize([object.deferredItems, object.deferrals, object.fallback, object.proofImpact, object.deferredReason, object.unsupportedItems]);
  return /deferred|runtime-proof-required|export-learning-required/.test(combined) && (!needle || combined.includes(normalize(needle).slice(0, 20)) || /reason|fallback|proof impact/.test(combined));
}

function hasExplicitPlanning(contract, region) {
  const combined = normalize([contract.allowedRegions, contract.explicitlyPlannedRegions, contract.appPlanTraceabilityNotes]);
  return combined.includes(normalize(region)) && /explicitly planned|app plan|allowed|mapped|visible ui/.test(combined);
}

main();
