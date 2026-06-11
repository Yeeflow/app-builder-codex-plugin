#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PRIVATE_NUMBER_RE = /\b\d{8,}\b/g;
const TARGET_LISTS = new Set([
  "Event Planning",
  "Event planning 2",
  "Event planning 3",
  "Event planning 4",
  "Event planning 5",
]);
const PERMISSION_KEY_RE = /(perm|permission|itemperm|isitemperm|isbreakinherit|inherit|administrator|admin|basic|advanced|edit|delete|new|import|export|view|audience|users|groups|departments|usergroups|datasecurity|security|policy|role|roleassignments|acl|access|auth)/i;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-data-list-permissions.mjs <input.yap>",
    "",
    "Decodes a Yeeflow .yap read-only, inspects target data-list permission settings, and prints a redacted summary.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const input = argv[2];
  if (!input || argv.length > 3) usage();
  return { input };
}

function quoteLargeIntegers(jsonText) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;
  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        out += LARGE_INTEGER_RE.test(token) ? `"${token}"` : token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text) {
  return JSON.parse(quoteLargeIntegers(text));
}

function decodeYap(inputPath) {
  const wrapper = parseJson(fs.readFileSync(inputPath, "utf8"));
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input Resource must start with ${GZIP_PREFIX}`);
  }
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const resource = parseJson(resourceText);
  if (typeof resource.Data !== "string") throw new Error("Decoded Resource.Data is missing.");
  return { wrapper, resource, data: parseJson(resource.Data) };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return value === null || value === undefined ? "" : String(value);
}

function redactScalar(value) {
  if (value === null || value === undefined) return value;
  return String(value)
    .replace(EMAIL_RE, "<email>")
    .replace(PRIVATE_NUMBER_RE, "<id>");
}

function fieldMap(resource) {
  const out = new Map();
  for (const field of asArray(resource.Defs)) {
    for (const key of [field.FieldName, field.InternalName, field.DisplayName, field.FieldID]) {
      if (safeString(key)) out.set(safeString(key), {
        field: redactScalar(field.FieldName || field.InternalName || ""),
        display: redactScalar(field.DisplayName || ""),
        type: redactScalar(field.Type || field.FieldType || ""),
      });
    }
  }
  for (const system of ["CreatedBy", "ModifiedBy", "Created", "Modified", "ListDataID", "Title"]) {
    out.set(system, { field: system, display: system, type: "system" });
  }
  out.set("Created By", { field: "CreatedBy", display: "Created By", type: "system" });
  out.set("Modified By", { field: "ModifiedBy", display: "Modified By", type: "system" });
  return out;
}

function parseStringifiedJson(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || !["{", "["].includes(trimmed[0])) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function inspectPermissionCandidates(root) {
  const hits = [];
  function visit(value, pointer) {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${pointer}[${index}]`));
      return;
    }
    if (isObject(value)) {
      for (const [key, child] of Object.entries(value)) {
        const childPointer = `${pointer}.${key}`;
        if (PERMISSION_KEY_RE.test(key)) {
          hits.push({ path: childPointer, kind: "key", valueType: Array.isArray(child) ? "array" : typeof child });
        }
        visit(child, childPointer);
      }
      return;
    }
    if (typeof value === "string") {
      if (PERMISSION_KEY_RE.test(value)) {
        hits.push({ path: pointer, kind: "string", sample: redactScalar(value).slice(0, 120) });
      }
      const parsed = parseStringifiedJson(value);
      if (parsed) visit(parsed, `${pointer}<json>`);
    }
  }
  visit(root, "$");
  return hits;
}

function inspectResource(resource, index) {
  const list = resource.ListModel || {};
  const fields = fieldMap(resource);
  const title = safeString(list.Title);
  const layoutFlags = asArray(resource.Layouts).map((layout, layoutIndex) => ({
    layoutIndex,
    title: redactScalar(layout.Title || ""),
    type: safeString(layout.Type),
    isDefault: layout.IsDefault === true,
    isItemPerm: layout.IsItemPerm === true,
    hasPermField: Object.prototype.hasOwnProperty.call(layout, "Perm"),
  }));
  const candidates = inspectPermissionCandidates(resource);
  const detailedCandidatePaths = candidates
    .map((hit) => hit.path)
    .filter((hitPath) => !/\.LayoutView($|<json>|\.|\[)/.test(hitPath) && !/\.Defs\[\d+\]\.Rules/.test(hitPath));
  const fieldReferences = ["Guest List", "Created By", "Service Team", "Product A", "CreatedBy"]
    .map((ref) => ({ ref: redactScalar(ref), resolved: fields.has(ref), field: fields.get(ref) || null }));

  const warnings = [];
  if (list.Perm === undefined) warnings.push({ code: "LIST_PERMISSION_BITMASK_MISSING", message: "ListModel.Perm was not present." });
  if (list.IsBreakInherit === undefined) warnings.push({ code: "LIST_PERMISSION_INHERIT_FLAG_MISSING", message: "ListModel.IsBreakInherit was not present." });
  if (list.IsItemPerm === undefined) warnings.push({ code: "LIST_PERMISSION_ITEM_FLAG_MISSING", message: "ListModel.IsItemPerm was not present." });
  const detailedPaths = detailedCandidatePaths.filter((hitPath) => (
    !/\.ListModel\.(Perm|IsItemPerm|IsBreakInherit|CreatedBy|ModifiedBy)$/.test(hitPath)
    && !/\.Layouts\[\d+\]\.(IsItemPerm|Title|Ext1)(<json>)?(\.|$)/.test(hitPath)
    && !/\.RemindRules\[/.test(hitPath)
  ));
  if (!detailedPaths.length) {
    warnings.push({
      code: "DETAILED_PERMISSION_AUDIENCE_SCHEMA_NOT_LOCATED",
      message: "No administrator/edit/view/advanced audience matrix was found in the decoded export after parsing nested JSON strings.",
    });
  }

  return {
    resourceIndex: index,
    resourceName: title,
    resourceType: Number(list.Type) === 16 ? "document library" : "data list",
    listId: "<list-id>",
    listModelPermissionFields: {
      Perm: list.Perm,
      IsBreakInherit: list.IsBreakInherit,
      IsItemPerm: list.IsItemPerm,
      AdvanceListLength: asArray(list.AdvanceList).length,
      Ext1Type: list.Ext1 === null ? "null" : typeof list.Ext1,
      Ext2Type: list.Ext2 === null ? "null" : typeof list.Ext2,
      Ext3Type: list.Ext3 === null ? "null" : typeof list.Ext3,
    },
    layoutPermissionFlags: layoutFlags,
    permissionCandidatePathCount: candidates.length,
    permissionCandidatePaths: [...new Set(detailedCandidatePaths)].slice(0, 40),
    fieldReferenceChecks: fieldReferences,
    warnings,
  };
}

function main() {
  const args = parseArgs(process.argv);
  const input = path.resolve(args.input);
  const { resource, data } = decodeYap(input);
  const lists = asArray(data.Childs).filter((child) => Number(child?.ListModel?.Type) === 1);
  const targetResources = lists.filter((child) => TARGET_LISTS.has(safeString(child?.ListModel?.Title)));
  const warnings = [];
  for (const target of TARGET_LISTS) {
    if (!targetResources.some((resourceItem) => safeString(resourceItem?.ListModel?.Title) === target)) {
      warnings.push({ code: "TARGET_LIST_MISSING", list: target });
    }
  }
  const documentLibraries = asArray(data.Childs).filter((child) => Number(child?.ListModel?.Type) === 16);
  if (!documentLibraries.length) {
    warnings.push({ code: "DOCUMENT_LIBRARY_NOT_PRESENT", message: "No Type 16 document-library resource exists in this export; applicability is product-documented only in this pass." });
  }
  const inventory = targetResources.map(inspectResource);
  const report = {
    status: inventory.length === TARGET_LISTS.size ? "pass" : "warning",
    input,
    source: "Data Lists (1).yap",
    replaceIds: Array.isArray(resource.ReplaceIds) ? resource.ReplaceIds.length : 0,
    dataLists: lists.length,
    targetListsInspected: inventory.length,
    documentLibraries: documentLibraries.length,
    proofLevel: "export-proven for located ListModel/layout flags; UI-confirmed but not export-located for detailed audience matrix",
    inventory,
    warnings,
  };
  console.log(JSON.stringify(report, null, 2));
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: [{ code: "INSPECT_DATA_LIST_PERMISSIONS_FAILED", message: error.message }] }, null, 2));
  process.exit(1);
}
