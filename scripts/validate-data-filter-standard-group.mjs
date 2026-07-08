#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk, walk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/data-filter-golden-references.json");
const TEMPLATE_ID = "dashboard_standard_filter_group";
const TEMPLATE_PATH = path.join(ROOT, "docs/reference/data-filter-standard-filter-group.template.json");
const STANDARD_FILTER_GRID_COLUMNS = {
  "1": {
    list: [
      { value: 1, unit: "fr" },
      { value: 1, unit: "fr" },
      { value: 1, unit: "fr" },
      { value: 1, unit: "fr" },
    ],
    last: { value: 1, unit: "fr" },
  },
  "2": {
    list: [
      { value: 1, unit: "fr" },
      { value: 1, unit: "fr" },
    ],
    last: { value: 1, unit: "fr" },
  },
  "3": {
    list: [
      { value: 1, unit: "fr" },
    ],
    last: { value: 1, unit: "fr" },
  },
};
const STANDARD_FILTER_GRID_ROWS = {
  "1": {
    list: [
      { unit: "auto" },
    ],
    last: { unit: "auto" },
  },
};
const DATA_FILTER_TYPES = new Set([
  "select-filter",
  "radio-filter",
  "checkbox-filter",
  "relative-period",
  "hierarchy-filter",
  "sorting-filters",
]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.registry && !args.resource && !args.package)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateDataFilterStandardGroup(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDataFilterStandardGroup(options = {}) {
  const findings = [];
  const registryPath = path.resolve(options.registry || REGISTRY_PATH);
  const registry = readJson(registryPath, findings, "DATA_FILTER_GROUP_REGISTRY_MISSING");
  const template = readJson(TEMPLATE_PATH, findings, "DATA_FILTER_GROUP_TEMPLATE_MISSING");
  const templateRoot = template?._ak_c || template;
  validateRegistry(registry, templateRoot, findings);

  if (options.resource) {
    const resourcePath = path.resolve(options.resource);
    const resource = readJson(resourcePath, findings, "DATA_FILTER_GROUP_RESOURCE_MISSING");
    validateResource(resource?._ak_c || resource, {
      title: path.basename(resourcePath),
      surface: String(options.surface || "resource"),
      pointer: "$",
      findings,
    });
  }

  if (options.package) validatePackage(path.resolve(options.package), findings);

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: registryPath,
    template: TEMPLATE_PATH,
    resource: options.resource ? path.resolve(options.resource) : null,
    package: options.package ? path.resolve(options.package) : null,
    findings,
  };
}

function validateRegistry(registry, templateRoot, findings) {
  if (!registry) return;
  if (!asArray(registry.approvedTemplateIds).includes(TEMPLATE_ID)) {
    findings.push(error("DATA_FILTER_GROUP_TEMPLATE_ID_NOT_APPROVED", "Data Filter golden reference registry must approve dashboard_standard_filter_group."));
  }
  const reference = asArray(registry.references).find((item) => item?.templateId === TEMPLATE_ID);
  if (!reference) {
    findings.push(error("DATA_FILTER_GROUP_REFERENCE_MISSING", "Data Filter golden reference registry must include dashboard_standard_filter_group."));
  } else {
    for (const surface of ["dashboard", "data-list-form", "approval-form-submission", "approval-form-task", "data-list-workflow-task", "schedule-workflow-task"]) {
      if (!asArray(reference.allowedSurfaces).includes(surface)) {
        findings.push(error("DATA_FILTER_GROUP_SURFACE_MISSING", "dashboard_standard_filter_group must declare every supported page/form surface.", { surface }));
      }
    }
    for (const type of DATA_FILTER_TYPES) {
      if (!asArray(reference.controlTypes).includes(type)) {
        findings.push(error("DATA_FILTER_GROUP_CONTROL_TYPE_MISSING", "dashboard_standard_filter_group must declare every supported page-level Data Filter type.", { type }));
      }
    }
  }
  if (!templateRoot || !hasIdentity(templateRoot, TEMPLATE_ID)) {
    findings.push(error("DATA_FILTER_GROUP_TEMPLATE_ROOT_MISSING", "The source template must preserve dashboard_standard_filter_group as the root wrapper identity."));
    return;
  }
  validateGroupContract({ node: templateRoot, pointer: "$", ancestors: [] }, { title: "source template", surface: "registry", findings });
}

function validatePackage(packagePath, findings) {
  if (!fs.existsSync(packagePath)) {
    findings.push(error("DATA_FILTER_GROUP_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return;
  }
  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch (err) {
    findings.push(error("DATA_FILTER_GROUP_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: packagePath }));
    return;
  }
  const resources = collectPotentialResources(decoded);
  for (const resource of resources) {
    validateResource(resource.root, {
      title: resource.title,
      surface: resource.surface,
      pointer: resource.pointer,
      findings,
    });
  }
}

function validateResource(resource, context) {
  if (!isObject(resource)) return;
  const entries = flattenControls(resource);
  const filters = entries.filter((entry) => DATA_FILTER_TYPES.has(String(entry.node?.type || "")));
  if (filters.length < 2) return;
  if (isMasterDetailLeftPanelFilterPattern(entries, filters)) {
    validateLeftPanelFilterGroups(entries, context);
    return;
  }
  const groups = entries.filter((entry) => hasIdentity(entry.node, TEMPLATE_ID));
  if (!groups.length) {
    context.findings.push(error("DATA_FILTER_GROUP_REQUIRED_FOR_MULTIPLE_FILTERS", "Pages or forms with two or more page-level Data Filter controls must wrap them in dashboard_standard_filter_group.", {
      surface: context.surface,
      title: context.title,
      filterCount: filters.length,
      pointer: context.pointer,
    }));
  }
  for (const filter of filters) {
    if (!filter.ancestors.some((ancestor) => hasIdentity(ancestor, TEMPLATE_ID))) {
      context.findings.push(error("DATA_FILTER_GROUP_FILTER_OUTSIDE_GROUP", "Every page-level Data Filter control must be inside dashboard_standard_filter_group when multiple filters are present.", {
        surface: context.surface,
        title: context.title,
        path: filter.pointer,
        type: filter.node?.type || null,
        identity: firstIdentity(filter.node),
      }));
    }
  }
  for (const group of groups) validateGroupContract(group, context);
}

function isMasterDetailLeftPanelFilterPattern(entries, filters) {
  const pageLayoutMarkers = new Set(["dashboard-page-layouts-two-panel-workspace", "dashboard-page-layouts-three-panel-workspace"]);
  const hasMasterDetailMarker = entries.some((entry) => pageLayoutMarkers.has(String(entry.node?.derivedFromDashboardPageLayoutTemplate || entry.node?.templateMarker || entry.node?.attrs?.dashboardPageLayoutTemplateId || "").trim()));
  if (!hasMasterDetailMarker) return false;
  return filters.every((filter) => filter.ancestors.some((ancestor) => hasIdentity(ancestor, "left_panel_filter_group")));
}

function validateLeftPanelFilterGroups(entries, context) {
  const groups = entries.filter((entry) => hasIdentity(entry.node, "left_panel_filter_group"));
  for (const group of groups) {
    const childFilters = flattenControls(group.node)
      .filter((entry) => entry.node !== group.node && DATA_FILTER_TYPES.has(String(entry.node?.type || "")));
    if (childFilters.length > 2) {
      context.findings.push(error("DATA_FILTER_LEFT_PANEL_GROUP_TOO_MANY_FILTERS", "Master-detail workspace left_panel_filter_group may contain at most two Data Filter controls; add another left_panel_filter_group for additional filters.", {
        surface: context.surface,
        title: context.title,
        path: group.pointer,
        filterCount: childFilters.length,
      }));
    }
  }
}

function validateGroupContract(group, context) {
  const node = group.node || group;
  const attrs = node?.attrs || {};
  if (String(node?.type || "") !== "flex_grid") {
    context.findings.push(error("DATA_FILTER_GROUP_GRID_TYPE_INVALID", "dashboard_standard_filter_group must use the export-proven flex_grid standard filter group control.", detail(context, group.pointer, node?.type || null)));
  }
  if (String(node?.label || "") !== "Standard filter group") {
    context.findings.push(error("DATA_FILTER_GROUP_LABEL_INVALID", "dashboard_standard_filter_group must preserve label \"Standard filter group\".", detail(context, group.pointer, node?.label || null)));
  }
  if (!sameJson(node?.displayLabel, [null, false])) {
    context.findings.push(error("DATA_FILTER_GROUP_DISPLAY_LABEL_INVALID", "dashboard_standard_filter_group must hide its own Grid label with displayLabel [null,false].", detail(context, group.pointer, node?.displayLabel ?? null)));
  }
  if (attrs.ver !== 1) {
    context.findings.push(error("DATA_FILTER_GROUP_GRID_VERSION_INVALID", "dashboard_standard_filter_group flex_grid must preserve attrs.ver = 1.", detail(context, group.pointer, attrs.ver ?? null)));
  }
  if (!sameJson(attrs.columns, STANDARD_FILTER_GRID_COLUMNS)) {
    context.findings.push(error("DATA_FILTER_GROUP_GRID_COLUMNS_INVALID", "dashboard_standard_filter_group must preserve the responsive 4/2/1 column flex_grid definition; simplified count/minmax columns are invalid.", detail(context, group.pointer, attrs.columns ?? null)));
  }
  if (!sameJson(attrs.rows, STANDARD_FILTER_GRID_ROWS)) {
    context.findings.push(error("DATA_FILTER_GROUP_GRID_ROWS_INVALID", "dashboard_standard_filter_group must preserve the export-proven auto row definition.", detail(context, group.pointer, attrs.rows ?? null)));
  }
  if (!sameJson(attrs.cgap, { "1": 16 }) || !sameJson(attrs.cgapU, { "1": "px" })) {
    context.findings.push(error("DATA_FILTER_GROUP_GRID_COLUMN_GAP_INVALID", "dashboard_standard_filter_group must preserve 16px column gap settings.", detail(context, group.pointer, { cgap: attrs.cgap ?? null, cgapU: attrs.cgapU ?? null })));
  }
  if (!sameJson(attrs.rgap, [null, 16]) || !sameJson(attrs.rgapU, [null, "px"])) {
    context.findings.push(error("DATA_FILTER_GROUP_GRID_ROW_GAP_INVALID", "dashboard_standard_filter_group must preserve 16px row gap settings.", detail(context, group.pointer, { rgap: attrs.rgap ?? null, rgapU: attrs.rgapU ?? null })));
  }
  const childFilters = flattenControls(node)
    .filter((entry) => entry.node !== node && DATA_FILTER_TYPES.has(String(entry.node?.type || "")));
  for (const filter of childFilters) validateChildFilterContract(filter, context);
}

function validateChildFilterContract(entry, context) {
  const control = entry.node;
  const attrs = control?.attrs || {};
  if (!sameJson(attrs.lab?.ty, [null, "xs-light"])) {
    context.findings.push(error("DATA_FILTER_GROUP_CHILD_LABEL_TYPOGRAPHY_INVALID", "Child Data Filter controls must preserve attrs.lab.ty = [null,\"xs-light\"].", detail(context, entry.pointer, attrs.lab?.ty)));
  }
  if (!sameJson(attrs.lablay, [null, "top"])) {
    context.findings.push(error("DATA_FILTER_GROUP_CHILD_LABEL_LAYOUT_INVALID", "Child Data Filter controls must preserve tuple label layout [null,\"top\"].", detail(context, entry.pointer, attrs.lablay)));
  }
  if (!present(attrs.edit?.pcolor) && !present(attrs.edit?.placeholder?.color)) {
    context.findings.push(error("DATA_FILTER_GROUP_CHILD_PLACEHOLDER_COLOR_MISSING", "Child Data Filter controls must preserve placeholder color.", detail(context, entry.pointer, null)));
  }
  if (!present(attrs.edit?.normal?.border?.radius)) {
    context.findings.push(error("DATA_FILTER_GROUP_CHILD_RADIUS_MISSING", "Child Data Filter controls must preserve supported border radius.", detail(context, entry.pointer, null)));
  }
  const positioning = attrs.common?.positioning || {};
  if (!Array.isArray(positioning.widthtype) || positioning.widthtype[0] !== null || String(positioning.widthtype[1] || "") !== "3") {
    context.findings.push(error("DATA_FILTER_GROUP_CHILD_FIXED_WIDTH_MODE_MISSING", "Child Data Filter controls must preserve custom-width positioning widthtype beginning with [null,\"3\"].", detail(context, entry.pointer, positioning.widthtype ?? null)));
  }
  if (!Array.isArray(positioning.width) || Number(positioning.width[1]) !== 200) {
    context.findings.push(error("DATA_FILTER_GROUP_CHILD_FIXED_WIDTH_MISSING", "Child Data Filter controls must preserve fixed positioning width [null,200].", detail(context, entry.pointer, positioning.width ?? null)));
  }
}

function collectPotentialResources(decoded) {
  const resources = [];
  const seen = new Set();
  function add(root, title, surface, pointer) {
    if (!isObject(root)) return;
    if (!containsDataFilter(root)) return;
    const key = root;
    if (seen.has(key)) return;
    seen.add(key);
    resources.push({ root, title, surface, pointer });
  }
  walkDecoded(decoded, (value, pointer) => {
    if (!isObject(value)) return;
    for (const key of ["Resource", "DefResource", "formdef", "LayoutView"]) {
      const parsed = parseJsonMaybe(value[key]);
      if (isObject(parsed)) add(parsed?._ak_c || parsed, value.Title || value.title || value.name || key, inferSurface(pointer, value), `${pointer}.${key}`);
    }
    for (const item of asArray(value.LayoutInResources)) {
      const parsed = parseJsonMaybe(item?.Resource);
      if (isObject(parsed)) add(parsed?._ak_c || parsed, value.Title || value.title || "Dashboard resource", "dashboard", `${pointer}.LayoutInResources.Resource`);
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

function inferSurface(pointer, value) {
  const text = `${pointer} ${value?.Type || ""} ${value?.PageRole || ""} ${value?.Role || ""}`.toLowerCase();
  if (text.includes("pages") || text.includes("dashboard") || text.includes("103")) return "dashboard";
  if (text.includes("formnewreports") || text.includes("datareports")) return "data-list-form";
  if (text.includes("approval") || text.includes("defresource") || text.includes("pageurls")) return "approval-form";
  if (text.includes("schedule")) return "schedule-workflow-task";
  if (text.includes("workflow")) return "data-list-workflow-task";
  return "resource";
}

function containsDataFilter(resource) {
  let found = false;
  walk(resource, (node) => {
    if (isObject(node) && DATA_FILTER_TYPES.has(String(node.type || ""))) found = true;
  });
  return found;
}

function flattenControls(root, pointer = "$", ancestors = [], out = []) {
  if (!isObject(root)) return out;
  out.push({ node: root, pointer, ancestors });
  asArray(root.children).forEach((child, index) => flattenControls(child, `${pointer}.children[${index}]`, [...ancestors, root], out));
  return out;
}

function hasIdentity(node, expected) {
  return identityCandidates(node).some((candidate) => normalize(candidate) === normalize(expected));
}

function firstIdentity(node) {
  return identityCandidates(node)[0] || null;
}

function identityCandidates(node) {
  if (!isObject(node)) return [];
  return [
    node.id,
    node.ID,
    node.name,
    node.Name,
    node.label,
    node.Label,
    node.nv_label,
    node.nav_label,
    node.attrs?.id,
    node.attrs?.name,
    node.attrs?.label,
    node.attrs?.nv_label,
    node.attrs?.nav_label,
    node.attrs?.goldenReferenceId,
    node.attrs?.derivedFromGoldenReference,
  ].filter((item) => typeof item === "string" && item.trim());
}

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function present(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function detail(context, pathValue, actual) {
  return {
    surface: context.surface,
    title: context.title,
    path: pathValue,
    actual,
  };
}

function readJson(filePath, findings, code) {
  if (!fs.existsSync(filePath)) {
    findings.push(error(code, "JSON file is missing.", { file: filePath }));
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch (err) {
    findings.push(error(code, `JSON file could not be parsed: ${err.message}`, { file: filePath }));
    return null;
  }
}

function error(code, message, extra = {}) {
  return { level: "error", code, message, ...extra };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--registry") {
      args.registry = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : REGISTRY_PATH;
    } else if (token === "--resource") {
      args.resource = argv[++i];
    } else if (token === "--surface") {
      args.surface = argv[++i];
    } else if (token === "--package") {
      args.package = argv[++i];
    } else {
      throw new Error(`Unexpected argument: ${token}`);
    }
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-data-filter-standard-group.mjs --registry
  node scripts/validate-data-filter-standard-group.mjs --resource <resource.json> [--surface dashboard|data-list-form|approval-form]
  node scripts/validate-data-filter-standard-group.mjs --package <file.yapk>`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
