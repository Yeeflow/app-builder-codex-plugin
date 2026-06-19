#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const PROOF_BOUNDARY =
  "HTML-to-Yeeflow control mapping validation proves control-mapped HTML and blueprint-readiness metadata only; it does not prove Yeeflow package validity, signing/API acceptance, install/upgrade success, or runtime rendering.";

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

const FIELD_CONTROLS = new Set(["field-input", "textarea", "select", "choice", "date-picker", "user-picker", "number-input", "file-upload"]);
const ACTION_CONTROLS = new Set(["button"]);
const LIST_CONTROLS = new Set(["sub-list", "collection", "data-table", "kanban", "vertical-timeline", "horizontal-timeline"]);
const IMPLEMENTATION_TAGS = new Set(["input", "textarea", "select", "button", "table"]);
const ALLOWED_PROOF_LABEL_RE = /\b(export-learning-required|runtime-proof-required|deferred)\b/i;

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.contracts || !args.html) {
    console.error("Usage: node scripts/validate-html-to-yeeflow-control-mapping.mjs --contracts <dir-or-json> --html <dir> [--registry <registry.md|json>]");
    process.exit(2);
  }

  const registry = loadRegistry(args.registry);
  const contracts = loadObjects(args.contracts, ["contracts", "surfaces", "uiSurfaceContracts"]);
  const findings = [];
  const missingHtmlMappings = [];
  const unknownControlMappings = [];
  const fieldMappingFindings = [];
  const actionMappingFindings = [];
  const styleTokenFindings = [];
  let mappedControlCount = 0;

  for (const [index, contract] of contracts.entries()) {
    const surfaceId = text(contract.surfaceId || contract.surfaceName || `surface-${index + 1}`);
    const htmlPath = resolveHtmlPath(args.html, contract, index);
    if (!htmlPath || !fs.existsSync(htmlPath)) {
      const finding = findingFor("error", "HTML_MAPPING_PREVIEW_MISSING", "Control-mapped HTML preview is missing for the UI Surface Contract.", { surfaceId, htmlPath: safePath(htmlPath) });
      findings.push(finding);
      missingHtmlMappings.push(finding);
      continue;
    }

    const html = fs.readFileSync(htmlPath, "utf8");
    const elements = extractElements(html).filter(isImplementationRelevantElement);
    mappedControlCount += elements.filter((element) => attr(element, "data-yeeflow-control")).length;
    validateElements(contract, elements, registry, findings, {
      surfaceId,
      missingHtmlMappings,
      unknownControlMappings,
      fieldMappingFindings,
      actionMappingFindings,
      styleTokenFindings,
    });
  }

  const result = {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    surfaceCount: contracts.length,
    mappedControlCount,
    missingHtmlMappings,
    unknownControlMappings,
    fieldMappingFindings,
    actionMappingFindings,
    styleTokenFindings,
    findings,
    proofBoundary: PROOF_BOUNDARY,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "pass" ? 0 : 1);
}

export function validateElements(contract, elements, registry, findings, buckets) {
  const surfaceId = buckets.surfaceId;
  const mappings = controlMappings(contract);
  const elementByBlueprint = groupBy(elements, (element) => attr(element, "data-blueprint-id"));
  const elementByField = groupBy(elements, (element) => attr(element, "data-field-id"));
  const elementByAction = groupBy(elements, (element) => attr(element, "data-action-id"));

  for (const mapping of mappings) {
    const matched = firstMatch([
      mapping.blueprintId && elementByBlueprint.get(normalize(mapping.blueprintId)),
      mapping.fieldId && elementByField.get(normalize(mapping.fieldId)),
      mapping.actionId && elementByAction.get(normalize(mapping.actionId)),
      mapping.htmlDataSelector && elements.filter((element) => selectorMatches(element, mapping.htmlDataSelector)),
    ]);
    if (!matched) {
      const finding = findingFor("error", "HTML_CONTRACT_CONTROL_MAPPING_MISSING", "Every UI Surface Contract controlMapping entry must have a matching HTML element.", {
        surfaceId,
        blueprintId: mapping.blueprintId,
        fieldId: mapping.fieldId,
        actionId: mapping.actionId,
      });
      findings.push(finding);
      buckets.missingHtmlMappings.push(finding);
    }
  }

  const blueprintCounts = new Map();
  for (const element of elements) {
    const blueprintId = attr(element, "data-blueprint-id");
    if (blueprintId) blueprintCounts.set(normalize(blueprintId), (blueprintCounts.get(normalize(blueprintId)) || 0) + 1);
  }

  for (const element of elements) {
    const control = normalize(attr(element, "data-yeeflow-control"));
    const blueprintId = attr(element, "data-blueprint-id");
    const proofBoundary = attr(element, "data-proof-boundary");
    const proofLabel = attr(element, "data-supported-status") || attr(element, "data-proof-label") || proofBoundary;

    if (!blueprintId) {
      const finding = findingFor("error", "HTML_IMPLEMENTATION_ELEMENT_BLUEPRINT_ID_MISSING", "Implementation-relevant HTML elements must declare data-blueprint-id.", { surfaceId, tag: element.tag });
      findings.push(finding);
      buckets.missingHtmlMappings.push(finding);
    }
    if (blueprintId && blueprintCounts.get(normalize(blueprintId)) > 1 && !isRepeatedTemplate(element)) {
      findings.push(findingFor("error", "HTML_BLUEPRINT_ID_DUPLICATE", "Duplicate data-blueprint-id is allowed only for declared repeated row templates.", { surfaceId, blueprintId }));
    }
    if (!control) {
      const finding = findingFor("error", "HTML_YEEFLOW_CONTROL_MISSING", "Implementation-relevant HTML elements must declare data-yeeflow-control.", { surfaceId, blueprintId });
      findings.push(finding);
      buckets.missingHtmlMappings.push(finding);
      continue;
    }
    if (!registry.has(control) && !ALLOWED_PROOF_LABEL_RE.test(proofLabel)) {
      const finding = findingFor("error", "HTML_UNKNOWN_YEEFLOW_CONTROL_MAPPING", "data-yeeflow-control must exist in the Control Mapping Registry unless explicitly deferred/proof-labeled.", {
        surfaceId,
        blueprintId,
        control,
      });
      findings.push(finding);
      buckets.unknownControlMappings.push(finding);
    }
    if (!attr(element, "data-control-role")) {
      findings.push(findingFor("error", "HTML_CONTROL_ROLE_MISSING", "Mapped HTML elements must declare data-control-role.", { surfaceId, blueprintId, control }));
    }
    if (!proofBoundary) {
      findings.push(findingFor("error", "HTML_PROOF_BOUNDARY_MISSING", "Mapped HTML elements must declare data-proof-boundary.", { surfaceId, blueprintId, control }));
    }

    if (FIELD_CONTROLS.has(control)) validateFieldElement(contract, element, findings, buckets);
    if (ACTION_CONTROLS.has(control)) validateActionElement(contract, element, findings, buckets);
    if (LIST_CONTROLS.has(control)) validateListElement(contract, element, findings, buckets);
    validateStyleTokens(element, findings, buckets);
  }
}

function validateFieldElement(contract, element, findings, buckets) {
  const surfaceId = buckets.surfaceId;
  const blueprintId = attr(element, "data-blueprint-id");
  const required = ["data-field-id", "data-field-name", "data-field-type", "data-binding", "data-required", "data-readonly"];
  for (const name of required) {
    if (!attr(element, name)) {
      const finding = findingFor("error", "HTML_FIELD_MAPPING_ATTRIBUTE_MISSING", `Field controls must declare ${name}.`, { surfaceId, blueprintId, attribute: name });
      findings.push(finding);
      buckets.fieldMappingFindings.push(finding);
    }
  }
  const mapping = findContractMapping(contract, element);
  if (!mapping) return;
  for (const [code, htmlAttr, mappingKey, label] of [
    ["HTML_FIELD_ID_MISMATCH", "data-field-id", "fieldId", "field ID"],
    ["HTML_FIELD_NAME_MISMATCH", "data-field-name", "fieldName", "field name"],
    ["HTML_FIELD_TYPE_MISMATCH", "data-field-type", "fieldType", "field type"],
    ["HTML_FIELD_BINDING_MISMATCH", "data-binding", "binding", "binding"],
    ["HTML_FIELD_REQUIRED_MISMATCH", "data-required", "required", "required"],
    ["HTML_FIELD_READONLY_MISMATCH", "data-readonly", "readonly", "readonly"],
  ]) {
    if (mapping[mappingKey] !== undefined && normalize(attr(element, htmlAttr)) !== normalize(mapping[mappingKey])) {
      const finding = findingFor("error", code, `HTML field ${label} must match UI Surface Contract controlMapping.`, {
        surfaceId,
        blueprintId,
        expected: text(mapping[mappingKey]),
        actual: attr(element, htmlAttr),
      });
      findings.push(finding);
      buckets.fieldMappingFindings.push(finding);
    }
  }
}

function validateActionElement(contract, element, findings, buckets) {
  const surfaceId = buckets.surfaceId;
  const blueprintId = attr(element, "data-blueprint-id");
  for (const name of ["data-action-id", "data-action-type", "data-action-contract"]) {
    if (!attr(element, name)) {
      const finding = findingFor("error", "HTML_ACTION_MAPPING_ATTRIBUTE_MISSING", `Action controls must declare ${name}.`, { surfaceId, blueprintId, attribute: name });
      findings.push(finding);
      buckets.actionMappingFindings.push(finding);
    }
  }
  const mapping = findContractMapping(contract, element);
  if (!mapping) return;
  for (const [code, htmlAttr, mappingKey, label] of [
    ["HTML_ACTION_ID_MISMATCH", "data-action-id", "actionId", "action ID"],
    ["HTML_ACTION_TYPE_MISMATCH", "data-action-type", "actionType", "action type"],
    ["HTML_ACTION_CONTRACT_MISMATCH", "data-action-contract", "actionContract", "action contract"],
    ["HTML_ROW_CONTEXT_MISMATCH", "data-row-context", "rowContext", "row context"],
    ["HTML_PARENT_BINDING_MISMATCH", "data-parent-binding", "parentBinding", "parent binding"],
  ]) {
    if (mapping[mappingKey] !== undefined && normalize(attr(element, htmlAttr)) !== normalize(mapping[mappingKey])) {
      const finding = findingFor("error", code, `HTML action ${label} must match UI Surface Contract controlMapping.`, {
        surfaceId,
        blueprintId,
        expected: text(mapping[mappingKey]),
        actual: attr(element, htmlAttr),
      });
      findings.push(finding);
      buckets.actionMappingFindings.push(finding);
    }
  }
}

function validateListElement(contract, element, findings, buckets) {
  const surfaceId = buckets.surfaceId;
  const blueprintId = attr(element, "data-blueprint-id");
  const control = normalize(attr(element, "data-yeeflow-control"));
  const required = control === "sub-list"
    ? ["data-source-list", "data-parent-binding", "data-row-context"]
    : ["data-source-list", "data-row-context"];
  for (const name of required) {
    if (!attr(element, name)) {
      findings.push(findingFor("error", "HTML_LIST_MAPPING_ATTRIBUTE_MISSING", `List/region controls must declare ${name}.`, { surfaceId, blueprintId, control, attribute: name }));
    }
  }
  const mapping = findContractMapping(contract, element);
  if (!mapping) return;
  for (const [code, htmlAttr, mappingKey, label] of [
    ["HTML_SOURCE_RESOURCE_MISMATCH", "data-source-resource", "sourceResource", "source resource"],
    ["HTML_SOURCE_LIST_MISMATCH", "data-source-list", "sourceList", "source list"],
    ["HTML_ROW_CONTEXT_MISMATCH", "data-row-context", "rowContext", "row context"],
    ["HTML_PARENT_BINDING_MISMATCH", "data-parent-binding", "parentBinding", "parent binding"],
  ]) {
    if (mapping[mappingKey] !== undefined && normalize(attr(element, htmlAttr)) !== normalize(mapping[mappingKey])) {
      findings.push(findingFor("error", code, `HTML list/region ${label} must match UI Surface Contract controlMapping.`, {
        surfaceId,
        blueprintId,
        expected: text(mapping[mappingKey]),
        actual: attr(element, htmlAttr),
      }));
    }
  }
}

function validateStyleTokens(element, findings, buckets) {
  const surfaceId = buckets.surfaceId;
  const blueprintId = attr(element, "data-blueprint-id");
  const control = normalize(attr(element, "data-yeeflow-control"));
  const proofLabel = attr(element, "data-supported-status") || attr(element, "data-proof-label") || attr(element, "data-proof-boundary");
  for (const [code, name] of [
    ["HTML_STYLE_TOKEN_MISSING", "data-style-token"],
    ["HTML_LAYOUT_TOKEN_MISSING", "data-layout-token"],
    ["HTML_RESPONSIVE_TOKEN_MISSING", "data-responsive-token"],
  ]) {
    const value = attr(element, name);
    if (!value && control && !ALLOWED_PROOF_LABEL_RE.test(proofLabel)) {
      const finding = findingFor("error", code, `Mapped HTML controls must declare ${name} or an explicit proof/deferred label.`, { surfaceId, blueprintId, control });
      findings.push(finding);
      buckets.styleTokenFindings.push(finding);
    } else if (value && !knownToken(value) && !ALLOWED_PROOF_LABEL_RE.test(proofLabel)) {
      const finding = findingFor("error", "HTML_STYLE_TOKEN_UNKNOWN", "Style/layout/responsive tokens must be known design-system tokens or explicitly proof-labeled.", {
        surfaceId,
        blueprintId,
        token: value,
      });
      findings.push(finding);
      buckets.styleTokenFindings.push(finding);
    }
  }
}

export function extractElements(html) {
  const elements = [];
  const tagRe = /<([a-z][a-z0-9-]*)(\s[^<>]*?)?>/gi;
  let match;
  while ((match = tagRe.exec(html))) {
    const tag = match[1].toLowerCase();
    const rawAttrs = match[2] || "";
    if (tag.startsWith("!") || tag === "html" || tag === "head" || tag === "meta" || tag === "link" || tag === "script" || tag === "style") continue;
    elements.push({ tag, attrs: parseAttrs(rawAttrs), raw: match[0] });
  }
  return elements;
}

function parseAttrs(rawAttrs) {
  const attrs = {};
  const attrRe = /([:@a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = attrRe.exec(rawAttrs))) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "true";
  }
  return attrs;
}

function isImplementationRelevantElement(element) {
  if (attr(element, "data-yeeflow-control") || attr(element, "data-blueprint-id") || attr(element, "data-field-id") || attr(element, "data-action-id")) return true;
  return IMPLEMENTATION_TAGS.has(element.tag) && !/presentation|decorative|false/i.test(attr(element, "data-implementation-relevant"));
}

function controlMappings(contract) {
  const mapping = contract.controlMapping;
  if (!Array.isArray(mapping)) return [];
  return mapping.filter((entry) => entry && typeof entry === "object").map((entry) => ({ ...entry }));
}

function findContractMapping(contract, element) {
  const mappings = controlMappings(contract);
  const blueprintId = normalize(attr(element, "data-blueprint-id"));
  const fieldId = normalize(attr(element, "data-field-id"));
  const actionId = normalize(attr(element, "data-action-id"));
  return mappings.find((mapping) =>
    (mapping.blueprintId && normalize(mapping.blueprintId) === blueprintId) ||
    (mapping.fieldId && normalize(mapping.fieldId) === fieldId) ||
    (mapping.actionId && normalize(mapping.actionId) === actionId)
  );
}

function loadRegistry(registryPath) {
  const registry = new Map(DEFAULT_REGISTRY);
  if (!registryPath) return registry;
  const textValue = fs.readFileSync(registryPath, "utf8");
  if (registryPath.endsWith(".json")) {
    const parsed = JSON.parse(textValue);
    const entries = Array.isArray(parsed) ? parsed : parsed.mappings || parsed.controls || [];
    for (const entry of entries) {
      const id = normalize(entry.id || entry.htmlControl || entry.dataYeeflowControl || entry.control);
      if (id) registry.set(id, text(entry.yeeflowControl || entry.mapsTo || entry.description || id));
    }
    return registry;
  }
  const re = /`([^`]+)`\s*(?:->|maps to|=>)\s*([^\n]+)/gi;
  let match;
  while ((match = re.exec(textValue))) registry.set(normalize(match[1]), match[2].trim());
  return registry;
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
  for (const key of arrayKeys) if (Array.isArray(value[key])) return value[key];
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

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = normalize(keyFn(item));
    if (!key) continue;
    const list = map.get(key) || [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

function firstMatch(lists) {
  for (const list of lists) {
    if (Array.isArray(list) && list.length) return list[0];
  }
  return null;
}

function selectorMatches(element, selector) {
  const match = /\[([^=\]]+)=["']?([^"'\]]+)["']?\]/.exec(text(selector));
  return match ? normalize(attr(element, match[1])) === normalize(match[2]) : false;
}

function isRepeatedTemplate(element) {
  return /true|yes|row-template|repeated/i.test(text([attr(element, "data-repeat-template"), attr(element, "data-repeat-context"), attr(element, "data-row-template")]));
}

function knownToken(value) {
  return /\b(ds-|yf-|--yf-|--yeeflow-|token|surface|field|button|layout|responsive|stack|card|table|form|badge)\b/i.test(text(value));
}

function attr(element, name) {
  return text(element?.attrs?.[name.toLowerCase()]);
}

function findingFor(level, code, message, detail = {}) {
  return { level, code, message, ...detail };
}

function text(value) {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim();
}

function normalize(value) {
  return text(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function slug(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function safePath(file) {
  return file ? file.split("/").slice(-3).join("/") : null;
}

main();
