#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const PROOF_BOUNDARY =
  "Blueprint-to-UI Surface Contract comparison proves blueprint parity with the design contract only; it does not prove Yeeflow package validity, signing/API acceptance, install/upgrade success, or runtime rendering.";

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.contracts || !args.blueprints) {
    console.error("Usage: node scripts/compare-blueprint-to-ui-surface-contract.mjs --contracts <dir-or-json> --blueprints <dir-or-json> [--design-system <design-system.md|json>]");
    process.exit(2);
  }

  const contracts = loadObjects(args.contracts, ["contracts", "surfaces", "uiSurfaceContracts"]);
  const blueprints = loadObjects(args.blueprints, ["blueprints", "pageImplementationBlueprints", "surfaces"]);
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

  for (const control of asTextArray(contract.controlMapping)) {
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

function normalize(value) {
  return text(value).toLowerCase().replace(/\s+/g, " ").trim();
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
