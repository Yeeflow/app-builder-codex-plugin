#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, quoteLargeJsonIntegers, readDecodedYapk, walk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILTER_PRODUCER_TYPES = new Set(["search-filter", "select-filter", "radio-filter", "checkbox-filter", "hierarchy-filter", "sorting-filter"]);

export function validatePageScopeTemplateDependencies(options = {}) {
  const findings = [];
  let decoded = options.decoded || null;
  if (!decoded) {
    try {
      ({ decoded } = readDecodedYapk(options.packagePath));
    } catch (err) {
      findings.push(error("PAGE_SCOPE_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: options.packagePath || "" }));
      return report(findings);
    }
  }
  for (const surface of collectPageSurfaces(decoded)) validateSurface(surface, findings);
  return report(findings);
}

function collectPageSurfaces(decoded) {
  const surfaces = [];
  for (const [index, page] of asArray(decoded?.Pages || decoded?.Data?.Pages).entries()) {
    if (Number(page?.Type) !== 103) continue;
    const resource = parseResource(asArray(page?.LayoutInResources)[0]?.Resource || page?.LayoutView || page?.Resource);
    if (isObject(resource)) surfaces.push({ kind: "dashboard", name: page?.Title || page?.Name || `Pages[${index}]`, pointer: `Pages[${index}]`, resource });
  }
  for (const [childIndex, child] of asArray(decoded?.Childs || decoded?.Data?.Childs).entries()) {
    const listName = child?.List?.Title || child?.ListModel?.Title || child?.Title || child?.Name || `Childs[${childIndex}]`;
    for (const [layoutIndex, layout] of asArray(child?.Layouts || child?.Item?.Layouts).entries()) {
      if (Number(layout?.Type) !== 1) continue;
      const resource = parseResource(layout?.LayoutView) || parseResource(asArray(layout?.LayoutInResources)[0]?.Resource);
      if (isObject(resource)) surfaces.push({ kind: "data-list-form", name: `${listName} / ${layout?.Title || layout?.Name || `Layouts[${layoutIndex}]`}`, pointer: `Childs[${childIndex}].Layouts[${layoutIndex}]`, resource });
    }
  }
  for (const [formIndex, form] of asArray(decoded?.Forms || decoded?.Data?.Forms).entries()) {
    const def = decodeDefResource(form?.DefResource);
    for (const [pageIndex, page] of asArray(def?.pageurls).entries()) {
      if (!isObject(page?.formdef)) continue;
      const role = Number(page?.type) === 1 ? "submission" : Number(page?.type) === 2 ? "task" : "page";
      surfaces.push({ kind: `approval-${role}`, name: `${form?.Name || form?.Title || `Forms[${formIndex}]`} / ${page?.title || page?.name || `pageurls[${pageIndex}]`}`, pointer: `Forms[${formIndex}].DefResource.pageurls[${pageIndex}]`, resource: page.formdef });
    }
  }
  for (const workflow of collectWorkflowTaskDefResources(decoded)) {
    const def = decodeDefResource(workflow.defResource);
    for (const [pageIndex, page] of asArray(def?.pageurls).entries()) {
      if (Number(page?.type) !== 2 || !isObject(page?.formdef)) continue;
      surfaces.push({ kind: "workflow-task", name: `${workflow.source} / ${page?.title || page?.name || `task page ${pageIndex + 1}`}`, pointer: `${workflow.pointer}.pageurls[${pageIndex}]`, resource: page.formdef });
    }
  }
  return surfaces;
}

function validateSurface(surface, findings) {
  checkDuplicateDeclarations(surface, "filterVars", canonicalFilterName, "PAGE_SCOPE_FILTER_VAR_DUPLICATE", findings);
  checkDuplicateDeclarations(surface, "tempVars", canonicalTempName, "PAGE_SCOPE_TEMP_VAR_DUPLICATE", findings);
  checkDuplicateDeclarations(surface, "actions", canonicalActionName, "PAGE_SCOPE_ACTION_DUPLICATE", findings);
  checkDuplicateFormActions(surface, findings);
  checkFilterProducers(surface, findings);
}

function checkDuplicateDeclarations(surface, key, canonicalize, code, findings) {
  const seen = new Map();
  for (const [index, item] of asArray(surface.resource?.[key]).entries()) {
    const name = canonicalize(dependencyName(item));
    if (!name) continue;
    if (seen.has(name)) {
      findings.push(error(code, `${key} names must be unique within one generated page/form scope. Clone template dependencies with a page/region namespace before merging them into the host resource.`, {
        surface: surface.name,
        surfaceKind: surface.kind,
        pointer: `${surface.pointer}.${key}[${index}]`,
        name,
        firstIndex: seen.get(name),
      }));
    } else {
      seen.set(name, index);
    }
  }
}

function checkDuplicateFormActions(surface, findings) {
  const names = [];
  const formAction = surface.resource?.formAction || surface.resource?.formActions;
  if (Array.isArray(formAction)) {
    formAction.forEach((item, index) => {
      const name = canonicalActionName(dependencyName(item));
      if (name) names.push({ name, pointer: `${surface.pointer}.formAction[${index}]` });
    });
  } else if (isObject(formAction)) {
    Object.keys(formAction).forEach((name) => names.push({ name: canonicalActionName(name), pointer: `${surface.pointer}.formAction.${name}` }));
  }
  const seen = new Map();
  for (const entry of names) {
    if (!entry.name) continue;
    if (seen.has(entry.name)) {
      findings.push(error("PAGE_SCOPE_FORM_ACTION_DUPLICATE", "formAction names must be unique within one generated page/form scope. Component template form actions must be renamed per page and per template instance.", {
        surface: surface.name,
        surfaceKind: surface.kind,
        pointer: entry.pointer,
        name: entry.name,
        firstPointer: seen.get(entry.name),
      }));
    } else {
      seen.set(entry.name, entry.pointer);
    }
  }
}

function checkFilterProducers(surface, findings) {
  const producers = new Map();
  walk(surface.resource, (node, pointer) => {
    if (!isObject(node) || !FILTER_PRODUCER_TYPES.has(String(node?.type || ""))) return;
    const name = canonicalFilterName(node.binding || node.attrs?.binding || node.attrs?.data?.binding || node.attrs?.filterVar || node.attrs?.filterVariable);
    if (!name) return;
    if (!producers.has(name)) producers.set(name, []);
    producers.get(name).push({
      pointer: `${surface.pointer}${pointer.slice(1)}`,
      id: node.id || node.name || node.nv_label || node.nav_label || "",
      type: node.type,
    });
  });
  for (const [name, entries] of producers) {
    const uniqueProducers = uniqueBy(entries, (entry) => `${entry.pointer}:${entry.id}`);
    if (uniqueProducers.length <= 1) continue;
    findings.push(error("PAGE_SCOPE_FILTER_VAR_MULTIPLE_PRODUCERS", "A page/form scope must not contain multiple Data Filter controls producing the same filter variable. When a page-layout template and an inserted component template both include Search/Data Filter controls, namespace the component filter variable and all consumers.", {
      surface: surface.name,
      surfaceKind: surface.kind,
      filterVar: name,
      producers: uniqueProducers,
    }));
  }
}

function dependencyName(item) {
  return String(item?.name || item?.key || item?.id || item?.ID || item?.Name || "").trim();
}

function canonicalFilterName(value) {
  const name = String(value || "").trim().replace(/^__filter_/, "");
  return name || "";
}

function canonicalTempName(value) {
  const name = String(value || "").trim().replace(/^__temp_/, "");
  return name || "";
}

function canonicalActionName(value) {
  return String(value || "").trim();
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function parseResource(value) {
  const parsed = parseJsonMaybe(value);
  if (isObject(parsed)) return parsed;
  if (isObject(value)) return value;
  return null;
}

function decodeDefResource(value) {
  if (isObject(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = parseJsonMaybe(value);
  if (isObject(parsed)) return parsed;
  try {
    const raw = Buffer.from(value, "base64");
    const payload = raw.subarray(0, 4).equals(Buffer.from([0x59, 0x57, 0x46, 0x01]))
      ? zlib.brotliDecompressSync(raw.subarray(4)).toString("utf8")
      : zlib.brotliDecompressSync(raw).toString("utf8");
    const decoded = JSON.parse(quoteLargeJsonIntegers(payload));
    return isObject(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function collectWorkflowTaskDefResources(decoded) {
  const out = [];
  const roots = [
    ["DataListWorkflows", decoded?.DataListWorkflows],
    ["ListWorkflows", decoded?.ListWorkflows],
    ["Workflows", decoded?.Workflows],
    ["ScheduleWorkflows", decoded?.ScheduleWorkflows],
    ["Processes", decoded?.Processes],
    ["Data.DataListWorkflows", decoded?.Data?.DataListWorkflows],
    ["Data.ScheduleWorkflows", decoded?.Data?.ScheduleWorkflows],
  ];
  for (const [label, value] of roots) collectDefResourceObjects(value, `$${label}`, out);
  return out;
}

function collectDefResourceObjects(value, pointer, out) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectDefResourceObjects(item, `${pointer}[${index}]`, out));
    return;
  }
  if (!isObject(value)) return;
  const defResource = value.DefResource || value.defResource || value.WorkflowResource || value.workflowResource;
  if (defResource) out.push({ source: value.Name || value.Title || value.Key || pointer, pointer, defResource });
  for (const [key, child] of Object.entries(value)) {
    if (key === "Forms" || key === "DefResource" || key === "defResource" || key === "WorkflowResource" || key === "workflowResource") continue;
    if (/workflow|process|schedule/i.test(key)) collectDefResourceObjects(child, `${pointer}.${key}`, out);
  }
}

function report(findings) {
  const errors = findings.filter((finding) => finding.severity === "error");
  return { ok: errors.length === 0, findings };
}

function error(code, message, details = {}) {
  return { severity: "error", code, message, ...details };
}

function parseArgs(argv) {
  const args = { json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--package") args.packagePath = argv[++index];
    else if (arg === "--resource") args.resourcePath = argv[++index];
    else if (arg === "--json") args.json = true;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  let result;
  if (args.resourcePath) {
    const resource = JSON.parse(fs.readFileSync(args.resourcePath, "utf8"));
    const findings = [];
    validateSurface({ kind: "resource", name: path.basename(args.resourcePath), pointer: "$", resource }, findings);
    result = report(findings);
  } else if (args.packagePath) {
    result = validatePageScopeTemplateDependencies({ packagePath: path.resolve(ROOT, args.packagePath) });
  } else {
    console.error("Usage: node scripts/validate-page-scope-template-dependencies.mjs --package <file.yapk> [--json]");
    process.exit(2);
  }
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`Page-scope template dependency validation: ${result.ok ? "pass" : "fail"}`);
    for (const finding of result.findings) console.log(`- ${finding.severity}: ${finding.code}: ${finding.message}`);
  }
  process.exit(result.ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
