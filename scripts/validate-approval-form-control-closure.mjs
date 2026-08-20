#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { asArray, isObject, parseJsonMaybe, quoteLargeJsonIntegers, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BROTLI_PREFIX = Buffer.from("::brotli::", "utf8");
const FIELD_CONTROL_TYPES = new Set([
  "input", "textarea", "richtext", "list", "lookup", "radio", "checkbox", "tag",
  "datepicker", "date", "datetime", "input_number", "number", "currency", "identity-picker",
  "user-picker", "people", "location-picker", "file-upload", "image-upload", "switch", "select",
]);
const CHOICE_CONTROL_TYPES = new Set(["radio", "select"]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.resource && !args.package)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateApprovalFormControlClosure(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

/**
 * Validate the complete persisted Approval Form control tree, including nested
 * Sub List row controls.  This is deliberately independent of whether a node
 * has already been recognised as a legal Yeeflow field control: an unknown
 * bound control such as `drop` must fail closed rather than evade validation.
 */
export function validateApprovalFormControlClosure(options = {}) {
  const findings = [];
  const pages = [];
  if (options.resource) pages.push(...pagesFromResourceFile(path.resolve(options.resource), findings));
  if (options.package) pages.push(...pagesFromPackage(path.resolve(options.package), findings));

  const bindings = new Map();
  for (const page of pages) {
    for (const entry of walkApprovalControls(page.resource)) {
      const control = entry.control;
      if (!isBusinessFieldControl(entry)) continue;
      const type = String(control?.type || "").trim();
      const detail = {
        source: page.source,
        pageRole: page.role || "unknown",
        path: entry.path,
        hostListBinding: entry.hostListBinding || null,
        field: fieldIdentity(control),
        actualControlType: type || null,
      };
      if (!FIELD_CONTROL_TYPES.has(type)) {
        findings.push(error("APPROVAL_CONTROL_TYPE_UNKNOWN", "Every generated Approval Form field and Sub List row control must use a supported Yeeflow control type. Unknown controls such as `drop` are forbidden.", detail));
        continue;
      }
      if (!isSharedBuilderMaterialized(control)) {
        findings.push(error("APPROVAL_FIELD_SHARED_BUILDER_MARKER_MISSING", "Bound Approval Form fields must be emitted by the shared approval-form-layout-builder; copied template labels or page markers are not sufficient.", detail));
      }
      if (CHOICE_CONTROL_TYPES.has(type) && !choiceValues(control).length) {
        findings.push(error("CHOICE_CONTROL_OPTIONS_MISSING", "A generated Radio/Select Approval Form control must contain real business choices.", detail));
      }
      if (entry.kind === "sub-list-field" && entry.editable && !nonEmptyString(control?.attrs?.placeholder)) {
        findings.push(error("SUBLIST_EDITABLE_PLACEHOLDER_MISSING", "Every editable Approval Form Sub List row control must have a business-facing placeholder (for example Enter quantity, Select approver, or Upload attachment).", detail));
      }
      const binding = normalizedBinding(control);
      if (!binding) continue;
      const key = `${page.formKey || page.source}::${entry.hostListBinding ? `${normalise(entry.hostListBinding)}::` : ""}${binding}`;
      if (!bindings.has(key)) bindings.set(key, []);
      bindings.get(key).push({ ...detail, type, pageRole: page.role || "unknown" });
    }
  }

  for (const entries of bindings.values()) {
    const types = [...new Set(entries.map((entry) => entry.type))];
    if (types.length > 1) {
      findings.push(error("APPROVAL_PAGE_FIELD_TYPE_MISMATCH", "The same Approval Form field must retain one normalised control type across Submission and Task pages; only role properties such as readonly, required, or visibility may differ.", {
        binding: entries[0].field,
        controlTypes: types,
        pages: entries.map(({ source, pageRole, path, type }) => ({ source, pageRole, path, type })),
      }));
    }
  }

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    resource: options.resource ? path.resolve(options.resource) : null,
    package: options.package ? path.resolve(options.package) : null,
    pagesChecked: pages.length,
    findings,
  };
}

function pagesFromResourceFile(file, findings) {
  try {
    return pagesFromDefResource(JSON.parse(fs.readFileSync(file, "utf8")), path.basename(file));
  } catch (err) {
    findings.push(error("APPROVAL_CONTROL_CLOSURE_RESOURCE_INVALID", `Could not read Approval Form resource: ${err.message}`, { file }));
    return [];
  }
}

function pagesFromPackage(file, findings) {
  try {
    const { decoded } = readDecodedYapk(file);
    const pages = [];
    for (const [index, form] of asArray(decoded?.Forms || decoded?.Data?.Forms).entries()) {
      const formKey = normalise(form?.Key || form?.Name || form?.Title || `forms-${index + 1}`);
      const source = String(form?.Name || form?.Title || `Forms[${index}]`);
      pages.push(...pagesFromDefResource(decodeDefResource(form?.DefResource), source, formKey));
    }
    return pages;
  } catch (err) {
    findings.push(error("APPROVAL_CONTROL_CLOSURE_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: file }));
    return [];
  }
}

function pagesFromDefResource(raw, source, inheritedFormKey = "") {
  const def = decodeDefResource(raw);
  if (!isObject(def)) return [];
  if (isObject(def.formdef)) return [{ source, formKey: inheritedFormKey || normalise(source), role: roleForPage(def), resource: def.formdef }];
  if (!Array.isArray(def.pageurls)) return [{ source, formKey: inheritedFormKey || normalise(source), role: "", resource: def }];
  return asArray(def.pageurls)
    .filter((page) => isObject(page?.formdef))
    .map((page, index) => ({
      source: `${source} / ${page?.title || page?.name || `page ${index + 1}`}`,
      formKey: inheritedFormKey || normalise(def?.key || def?.name || def?.title || source),
      role: roleForPage(page),
      resource: page.formdef,
    }));
}

function roleForPage(page) {
  return Number(page?.type) === 1 ? "submission" : Number(page?.type) === 2 ? "task" : "";
}

function decodeDefResource(value) {
  if (isObject(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = parseJsonMaybe(value);
  if (isObject(parsed)) return parsed;
  try {
    const raw = Buffer.from(value, "base64");
    const payload = raw.subarray(0, BROTLI_PREFIX.length).equals(BROTLI_PREFIX)
      ? zlib.brotliDecompressSync(raw.subarray(BROTLI_PREFIX.length)).toString("utf8")
      : zlib.brotliDecompressSync(raw).toString("utf8");
    const decoded = JSON.parse(quoteLargeJsonIntegers(payload));
    return isObject(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function walkApprovalControls(root, path = "$.formdef", inherited = {}) {
  if (!isObject(root)) return [];
  const current = [{ control: root, path, kind: inherited.kind || "control", hostListBinding: inherited.hostListBinding || "", editable: inherited.editable !== false }];
  const children = asArray(root.children).flatMap((child, index) => walkApprovalControls(child, `${path}.children[${index}]`));
  const listFields = asArray(root?.attrs?.["list-fields"]).flatMap((rowField, index) => {
    if (!isObject(rowField?.control)) return [];
    return walkApprovalControls(rowField.control, `${path}.attrs[\"list-fields\"][${index}].control`, {
      kind: "sub-list-field",
      hostListBinding: String(root.binding || root.fieldName || ""),
      editable: rowField.editable !== false,
    });
  });
  return current.concat(children, listFields);
}

function isBusinessFieldControl(entry) {
  const control = entry.control;
  return entry.kind === "sub-list-field"
    || control?.approvalFieldMaterializedFromPlan === true
    || control?.approvalSubListFieldMaterializedFromPlan === true
    || Boolean(normalizedBinding(control));
}

function isSharedBuilderMaterialized(control) {
  return control?.approvalFieldMaterializedFromPlan === true || control?.approvalSubListFieldMaterializedFromPlan === true;
}

function normalizedBinding(control) {
  return normalise(control?.binding || control?.fieldName || control?.attrs?.data?.fieldName || control?.attrs?.data?.field || "");
}

function fieldIdentity(control) {
  return String(control?.binding || control?.fieldName || control?.attrs?.data?.fieldName || control?.attrs?.data?.field || control?.label || control?.name || "");
}

function choiceValues(control) {
  return [control?.attrs?.choices, control?.attrs?.options, control?.attrs?.data?.choices, control?.attrs?.Rules?.choices]
    .find((value) => Array.isArray(value) && value.length) || [];
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalise(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function error(code, message, detail = {}) {
  return { level: "error", code, message, detail };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help") args.help = true;
    else if (token === "--resource" || token === "--package") {
      args[token.slice(2)] = argv[index + 1];
      index += 1;
    } else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.error([
    "Usage:",
    "  node scripts/validate-approval-form-control-closure.mjs --resource <persisted-def-resource.json>",
    "  node scripts/validate-approval-form-control-closure.mjs --package <app.yapk>",
  ].join("\n"));
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
