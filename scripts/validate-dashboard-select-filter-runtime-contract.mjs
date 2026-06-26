#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk, walk } from "./lib/yapk-decode-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.package && !args.resource)) usage(args.help ? 0 : 1);
  const report = validateDashboardSelectFilterRuntimeContract(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDashboardSelectFilterRuntimeContract(options = {}) {
  const findings = [];
  const resources = [];
  if (options.resource) {
    const resourcePath = path.resolve(options.resource);
    resources.push({ title: path.basename(resourcePath), resource: readJson(resourcePath), source: resourcePath });
  }
  if (options.package) {
    const packagePath = path.resolve(options.package);
    const { decoded } = readDecodedYapk(packagePath);
    resources.push(...dashboardResources(decoded, packagePath));
  }
  for (const entry of resources) validateResource(entry, findings);
  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    package: options.package ? path.resolve(options.package) : null,
    resource: options.resource ? path.resolve(options.resource) : null,
    findings,
  };
}

function validateResource({ title, resource, source }, findings) {
  const selectFilters = [];
  const collections = [];
  walk(resource, (node, pointer) => {
    if (!isObject(node)) return;
    const type = String(node.type || node.Type || "").toLowerCase();
    if (type === "select-filter") selectFilters.push({ control: node, pointer, variableNames: selectFilterVariableNames(node) });
    if (type === "collection") collections.push({ control: node, pointer });
  });
  if (!selectFilters.length || !collections.length) return;
  for (const collection of collections) {
    const filters = asArray(collection.control?.attrs?.data?.filter);
    const filterBindings = asArray(collection.control?.attrs?.data?.filterBindings);
    for (const [index, condition] of filters.entries()) {
      if (!isObject(condition)) continue;
      const operator = String(condition.operator ?? condition.op ?? condition.Oper ?? "");
      if (operator !== "9") continue;
      const refs = variableRefs(condition);
      for (const selectFilter of selectFilters) {
        const linkedBySource = refs.some((ref) => ref.sourceFilterId && ref.sourceFilterId === idOf(selectFilter.control))
          || filterBindings.some((binding) => isObject(binding) && String(binding.sourceFilterId || "") === idOf(selectFilter.control));
        const linkedByVariable = refs.some((ref) => [...selectFilter.variableNames].some((name) => sameVariable(name, ref.name) || sameVariable(name, ref.id)))
          || filterBindings.some((binding) => [...selectFilter.variableNames].some((name) => sameVariable(name, binding?.name) || sameVariable(name, binding?.id)));
        if (linkedBySource || linkedByVariable) {
          findings.push(error("DASH_SELECT_FILTER_COLLECTION_IN_EMPTY_UNPROVEN", "Page-level select-filter variables must not be consumed by Collection op/operator 9 conditions until an export-proven empty-value bypass contract exists. Live runtime evidence showed empty select-filter variables can clear all Collection rows.", {
            page: title,
            source: safePath(source),
            selectFilterPath: selectFilter.pointer,
            collectionPath: collection.pointer,
            conditionPath: `${collection.pointer}.attrs.data.filter[${index}]`,
            operator,
            selectFilterId: idOf(selectFilter.control) || null,
            variables: [...selectFilter.variableNames],
            recommendedFix: "Prefer proven search-filter/fulltext linkage or omit the page-level select-filter condition until runtime proof establishes empty-value bypass behavior.",
          }));
        }
      }
    }
  }
}

function selectFilterVariableNames(control) {
  const names = new Set();
  for (const value of [
    control.binding,
    control.filterVariable,
    control.attrs?.binding,
    control.attrs?.filterVariable,
    control.attrs?.data?.binding,
    control.attrs?.data?.filterVariable,
    control.attrs?.data?.value,
    control.attrs?.save_var?.name,
    control.save_var?.name,
    control.id,
    control.name,
  ]) {
    const normalized = normalizeVariable(value);
    if (normalized) names.add(normalized);
  }
  return names;
}

function variableRefs(value) {
  const refs = [];
  walk(value, (node) => {
    if (!isObject(node)) return;
    if (node.exprType === "variable" || node.type === "expr" || node.id || node.name || node.sourceFilterId) {
      refs.push({
        id: normalizeVariable(node.id),
        name: normalizeVariable(node.name),
        sourceFilterId: String(node.sourceFilterId || ""),
      });
    }
  });
  return refs;
}

function normalizeVariable(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/^__filter_/, "").replace(/^filter_/, "").replace(/^flt_/, "flt_");
}

function sameVariable(a, b) {
  const left = normalizeVariable(a);
  const right = normalizeVariable(b);
  if (!left || !right) return false;
  return left === right || left.endsWith(`_${right}`) || right.endsWith(`_${left}`);
}

function idOf(control) {
  return String(control?.id || control?.ID || control?.key || "");
}

function dashboardResources(decoded, packagePath) {
  const out = [];
  for (const [pageIndex, page] of asArray(decoded?.Pages).entries()) {
    if (String(page?.Type ?? page?.type) !== "103") continue;
    for (const [resourceIndex, item] of asArray(page?.LayoutInResources).entries()) {
      const resource = parseJsonMaybe(item?.Resource);
      if (isObject(resource) || Array.isArray(resource)) {
        out.push({
          title: page?.Title || page?.title || `Dashboard ${pageIndex + 1}`,
          resource,
          source: `${packagePath}#Pages[${pageIndex}].LayoutInResources[${resourceIndex}].Resource`,
        });
      }
    }
    const layoutView = parseJsonMaybe(page?.LayoutView);
    if (isObject(layoutView) || Array.isArray(layoutView)) {
      out.push({
        title: page?.Title || page?.title || `Dashboard ${pageIndex + 1}`,
        resource: layoutView,
        source: `${packagePath}#Pages[${pageIndex}].LayoutView`,
      });
    }
  }
  return out;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function error(code, message, detail = {}) {
  return { level: "error", code, message, ...detail };
}

function safePath(file) {
  return file ? file.split("/").slice(-4).join("/") : null;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--package") args.package = argv[++i];
    else if (token === "--resource") args.resource = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/validate-dashboard-select-filter-runtime-contract.mjs --package <file.yapk>\n  node scripts/validate-dashboard-select-filter-runtime-contract.mjs --resource <dashboard-resource.json>");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
