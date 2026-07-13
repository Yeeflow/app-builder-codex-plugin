#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { decodeBrotliTextTolerant, quoteLargeJsonIntegers } from "./lib/yapk-decode-utils.mjs";

const require = createRequire(import.meta.url);
const { classifyFormActionSetDataListStep } = require("./lib/form-action-set-data-list-utils.cjs");

const args = parseArgs(process.argv.slice(2));
if (!args.package) usage(1);
const report = inspectPackage(args.package);
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);

export function inspectPackage(packagePath) {
  try {
    const wrapper = JSON.parse(quoteLargeJsonIntegers(fs.readFileSync(packagePath, "utf8").replace(/^\uFEFF/, "")));
    const decoded = JSON.parse(quoteLargeJsonIntegers(decodeBrotliTextTolerant(Buffer.from(String(wrapper.Resource || "").replace(/\s+/g, ""), "base64"))));
    const actions = collectActions(decoded);
    const records = [];
    for (const entry of actions) {
      for (const [index, step] of (entry.action.steps || []).entries()) {
        if (step?.type !== "setdatalist") continue;
        const attrs = step.attrs || {};
        records.push({
          surface: entry.surface,
          host: entry.host,
          page: entry.page,
          action: entry.action.name || entry.action.title || null,
          trigger: findActionTrigger(entry.formdef, entry.action.id),
          stepOrder: index + 1,
          stepName: step.name || step.title || null,
          normalizedMode: classifyFormActionSetDataListStep(step),
          targetMode: attrs.listtype || (attrs.list ? "select" : "current"),
          targetResourceType: attrs.list ? "data-list-or-document-library" : "current-resource",
          mappingCount: Array.isArray(attrs.listdatas) ? attrs.listdatas.length : 0,
          numericOperations: Array.isArray(attrs.listdatas) ? attrs.listdatas.map((item) => String(item.Per ?? "0")) : [],
          filterCount: Array.isArray(attrs.wheres) ? attrs.wheres.length : 0,
          conditionTokenCount: Array.isArray(step.condition) ? step.condition.length : 0,
          continueWhenNotMet: step.continue === true,
          statusResultParent: attrs.codeparent || null,
          itemResultAttribute: attrs.itemid ? "itemid" : (attrs.totalcount ? "totalcount" : null),
          itemResultParent: attrs.itemidparent || attrs.totalparent || null,
        });
      }
    }
    return {
      status: "pass",
      package: path.basename(packagePath),
      setDataListStepCount: records.length,
      records,
      proofBoundary: "Structural export inspection only; tenant IDs, target IDs, filter values, and raw payloads are not printed.",
    };
  } catch (error) {
    return { status: "fail", code: "FORM_ACTION_SET_DATA_LIST_INSPECTION_FAILED", message: error.message };
  }
}

function collectActions(decoded) {
  const out = [];
  for (const form of decoded.Forms || []) {
    const def = decodeDefResource(form.DefResource);
    for (const page of def.pageurls || []) for (const action of page.formdef?.actions || []) out.push({
      surface: approvalSurface(page), host: form.Name || def.name || "", page: page.name || page.title || "", formdef: page.formdef, action,
    });
  }
  for (const child of decoded.Childs || []) for (const layout of child.Layouts || []) {
    if (Number(layout.Type) !== 1) continue;
    for (const resource of layout.LayoutInResources || []) {
      let formdef;
      try { formdef = JSON.parse(resource.Resource); } catch { continue; }
      for (const action of formdef.actions || []) out.push({
        surface: customFormSurface(child, layout), host: child.List?.Title || "", page: layout.Title || formdef.title || "", formdef, action,
      });
    }
  }
  for (const page of decoded.Pages || []) for (const resource of page.LayoutInResources || []) {
    let formdef;
    try { formdef = JSON.parse(resource.Resource); } catch { continue; }
    for (const action of formdef.actions || []) out.push({ surface: "dashboard", host: page.Title || "", page: page.Title || formdef.title || "", formdef, action });
  }
  for (const child of decoded.Childs || []) for (const publicForm of child.PublicForms || []) {
    let formdef;
    try { formdef = JSON.parse(publicForm.Resource); } catch { continue; }
    for (const action of formdef.actions || []) out.push({ surface: "public_form", host: child.List?.Title || "", page: publicForm.Name || "", formdef, action });
  }
  return out;
}

function approvalSurface(page) {
  const name = String(page.name || page.title || "").toLowerCase();
  if (/task/.test(name)) return "approval_task";
  if (/print/.test(name)) return "approval_print";
  return "approval_submission";
}

function customFormSurface(child, layout) {
  const prefix = Number(child.List?.Type) === 16 ? "document_library" : "data_list";
  const name = String(layout.Title || "").toLowerCase();
  if (/\bnew\b/.test(name)) return `${prefix}_new`;
  if (/\bedit\b/.test(name)) return `${prefix}_edit`;
  return `${prefix}_view`;
}

function findActionTrigger(formdef, actionId) {
  const triggers = [];
  for (const [event, id] of Object.entries(formdef.formAction || {})) if (String(id) === String(actionId)) triggers.push(`form:${event}`);
  visit(formdef.children, (node) => {
    if (String(node?.attrs?.control_event_rule || "") === String(actionId)) triggers.push(`control:${node.binding || node.name || node.label || node.type}:change`);
    if (String(node?.attrs?.control_action || "") === String(actionId)) triggers.push(`control:${node.binding || node.name || node.label || node.type}:click`);
  });
  return triggers.length ? triggers : ["unbound"];
}

function decodeDefResource(value) {
  const raw = Buffer.from(String(value || ""), "base64");
  const prefix = Buffer.from("::brotli::", "utf8");
  if (!raw.subarray(0, prefix.length).equals(prefix)) throw new Error("Approval DefResource prefix is not canonical ::brotli::");
  return JSON.parse(quoteLargeJsonIntegers(zlib.brotliDecompressSync(raw.subarray(prefix.length)).toString("utf8")));
}

function visit(value, callback) {
  if (Array.isArray(value)) return value.forEach((item) => visit(item, callback));
  if (!value || typeof value !== "object") return;
  callback(value);
  for (const child of Object.values(value)) visit(child, callback);
}

function parseArgs(argv) {
  const out = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--package") out.package = argv[++index];
    else if (argv[index] === "--help" || argv[index] === "-h") usage(0);
    else usage(1);
  }
  return out;
}

function usage(exitCode) {
  console.error("Usage: node scripts/inspect-form-action-set-data-list-yapk.mjs --package <app.yapk>");
  process.exit(exitCode);
}
