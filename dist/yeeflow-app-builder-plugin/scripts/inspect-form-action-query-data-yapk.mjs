#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { decodeBrotliTextTolerant, quoteLargeJsonIntegers } from "./lib/yapk-decode-utils.mjs";

const require = createRequire(import.meta.url);
const { classifyFormActionQueryDataStep, isCountOnlyIntent } = require("./lib/form-action-query-data-utils.cjs");

const args = parseArgs(process.argv.slice(2));
if (!args.package) usage(1);
const report = inspectPackage(args.package, args.form, args.action, args.list, args.page);
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

function inspectPackage(packagePath, requestedForm = "", requestedAction = "", requestedList = "", requestedPage = "") {
  try {
    const wrapper = JSON.parse(quoteLargeJsonIntegers(fs.readFileSync(packagePath, "utf8").replace(/^\uFEFF/, "")));
    const decoded = JSON.parse(quoteLargeJsonIntegers(decodeBrotliTextTolerant(Buffer.from(String(wrapper.Resource || "").replace(/\s+/g, ""), "base64"))));
    const candidates = [
      ...collectApprovalFormActions(decoded),
      ...collectCustomDataListFormActions(decoded),
      ...collectDashboardActions(decoded),
    ];
    const selectedAction = candidates.find((candidate) => {
      if (requestedForm && lower(candidate.formName) !== lower(requestedForm)) return false;
      if (requestedAction && lower(candidate.action.name || candidate.action.title) !== lower(requestedAction)) return false;
      if (requestedList && lower(candidate.listName) !== lower(requestedList)) return false;
      if (requestedPage && lower(candidate.pageName) !== lower(requestedPage)) return false;
      return true;
    });
    if (!selectedAction) return fail("ACTION_NOT_FOUND", `Form Action not found for form/action/list: ${requestedForm || "<first>"} / ${requestedAction || "<first>"} / ${requestedList || "<any>"}`);
    const querySteps = (selectedAction.action.steps || []).filter((step) => step?.type === "querydata");
    return {
      status: "pass",
      package: path.basename(packagePath),
      surface: selectedAction.surface,
      list: selectedAction.listName || null,
      form: selectedAction.formName,
      page: selectedAction.pageName || null,
      action: selectedAction.action.name || selectedAction.action.title || null,
      trigger: selectedAction.trigger,
      queryStepCount: querySteps.length,
      steps: querySteps.map((step) => summarizeStep(step)),
      proofBoundary: "Structural export inspection only; source IDs and raw payloads are not printed.",
    };
  } catch (error) {
    return fail("QUERY_DATA_INSPECTION_FAILED", error.message);
  }
}

function summarizeStep(step) {
  const attrs = step.attrs || {};
  const targets = Object.values(attrs.querydata_fieldmap && typeof attrs.querydata_fieldmap === "object" ? attrs.querydata_fieldmap : {});
  return {
    name: step.name || step.title || null,
    normalizedMode: classifyFormActionQueryDataStep(step),
    queryType: attrs.querydata_type || "single(default)",
    sourceListType: attrs.querydata_list?.ListType ?? null,
    filterCount: Array.isArray(attrs.querydata_filters) ? attrs.querydata_filters.length : 0,
    sortCount: Array.isArray(attrs.querydata_sorts) ? attrs.querydata_sorts.length : 0,
    mappedFieldCount: attrs.querydata_fieldmap && typeof attrs.querydata_fieldmap === "object" ? Object.keys(attrs.querydata_fieldmap).length : 0,
    tempFieldTargetCount: targets.filter((target) => String(target || "").startsWith("__temp_")).length,
    currentListFieldTargetCount: targets.filter((target) => String(target || "").startsWith("____customListFields_")).length,
    selectedFieldCount: Array.isArray(attrs.querydata_fields) ? attrs.querydata_fields.length : 0,
    resultTargetParent: attrs.querydata_listname_parent || null,
    hasResultTarget: Boolean(attrs.querydata_listname),
    countTargetParent: attrs.querydata_totalparent || null,
    hasCountTarget: Boolean(attrs.querydata_totalcount),
    countOnlyIntent: isCountOnlyIntent(step),
    countOnlyHasStaleResultMapping: isCountOnlyIntent(step) && Boolean(attrs.querydata_listname || attrs.querydata_vartype || attrs.querydata_listname_parent || (attrs.querydata_fieldmap && Object.keys(attrs.querydata_fieldmap).length)),
    pageSize: attrs.querydata_pagesize ?? 100,
    pageSizeUsesDefault: attrs.querydata_pagesize === undefined,
    pageNumber: attrs.querydata_pageindex ?? 1,
    pageNumberUsesDefault: attrs.querydata_pageindex === undefined,
  };
}

function collectApprovalFormActions(decoded) {
  const out = [];
  for (const form of decoded.Forms || []) {
    const def = decodeDefResource(form.DefResource);
    for (const page of def.pageurls || []) {
      const formdef = page.formdef || {};
      for (const action of formdef.actions || []) out.push({
        surface: "approval_form",
        listName: "",
        formName: form.Name || def.name || "",
        pageName: page.name || page.title || "",
        action,
        trigger: findActionTrigger(formdef, action.id),
      });
    }
  }
  return out;
}

function collectCustomDataListFormActions(decoded) {
  const out = [];
  for (const child of decoded.Childs || []) {
    for (const layout of child.Layouts || []) {
      if (Number(layout.Type) !== 1) continue;
      for (const resource of layout.LayoutInResources || []) {
        if (typeof resource.Resource !== "string") continue;
        let formdef;
        try { formdef = JSON.parse(resource.Resource); } catch { continue; }
        for (const action of formdef.actions || []) out.push({
        surface: Number(child.List?.Type) === 16 ? "document_library_custom_form" : "data_list_custom_form",
          listName: child.List?.Title || "",
          formName: layout.Title || formdef.title || "",
          pageName: layout.Title || formdef.title || "",
          action,
          trigger: findActionTrigger(formdef, action.id),
        });
      }
    }
  }
  return out;
}

function collectDashboardActions(decoded) {
  const out = [];
  for (const page of decoded.Pages || []) {
    for (const resource of page.LayoutInResources || []) {
      if (typeof resource.Resource !== "string") continue;
      let formdef;
      try { formdef = JSON.parse(resource.Resource); } catch { continue; }
      for (const action of formdef.actions || []) out.push({
        surface: "dashboard",
        listName: "",
        formName: page.Title || formdef.title || "",
        pageName: page.Title || formdef.title || "",
        action,
        trigger: findActionTrigger(formdef, action.id),
      });
    }
  }
  return out;
}

function findActionTrigger(formdef, actionId) {
  const triggers = [];
  for (const [event, id] of Object.entries(formdef.formAction || {})) {
    if (String(id) === String(actionId)) triggers.push(`form:${event}`);
  }
  visit(formdef.children, (node) => {
    if (String(node?.attrs?.control_event_rule || "") === String(actionId)) {
      triggers.push(`control:${node.binding || node.name || node.label || node.type || "unknown"}:change`);
    }
  });
  return triggers.length ? triggers : ["unbound"];
}

function visit(value, callback) {
  if (Array.isArray(value)) return value.forEach((item) => visit(item, callback));
  if (!value || typeof value !== "object") return;
  callback(value);
  for (const child of Object.values(value)) visit(child, callback);
}

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function decodeDefResource(value) {
  const raw = Buffer.from(String(value || ""), "base64");
  const prefix = Buffer.from("::brotli::", "utf8");
  if (!raw.subarray(0, prefix.length).equals(prefix)) throw new Error("Approval DefResource prefix is not canonical ::brotli::");
  return JSON.parse(quoteLargeJsonIntegers(zlib.brotliDecompressSync(raw.subarray(prefix.length)).toString("utf8")));
}

function parseArgs(argv) {
  const out = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--package") out.package = argv[++index];
    else if (arg === "--form") out.form = argv[++index];
    else if (arg === "--action") out.action = argv[++index];
    else if (arg === "--list") out.list = argv[++index];
    else if (arg === "--page") out.page = argv[++index];
    else if (arg === "--help" || arg === "-h") usage(0);
    else usage(1);
  }
  return out;
}

function usage(exitCode) {
  console.error("Usage: node scripts/inspect-form-action-query-data-yapk.mjs --package <app.yapk> [--list <data-list>] [--form <name>] [--page <page/form title>] [--action <name>]");
  process.exit(exitCode);
}

function fail(code, message) {
  return { status: "fail", code, message };
}
