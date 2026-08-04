#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { buildWorkflowSetDataListDefResource } from "./materialize-full-app-generated-final.mjs";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { atomicWriteAndReadBack, canonicalJson, readCanonicalJson } = require(path.join(ROOT, "scripts/lib/standalone-artifact-utils.cjs"));
const { buildScheduledWrapper } = require(path.join(ROOT, "build-scheduled-ywf-wrapper.js"));
const { loadIssuedIds, validateScheduledYwfFile, validateScheduledYwfObject } = require(path.join(ROOT, "validate-scheduled-ywf.js"));

const INPUT_KEYS = ["Description", "FlowKey", "FlowName", "Icon", "Img", "Settings", "actionRecords", "defResourceId", "loopRecords", "resourceInventory", "rootListSetId"];

function normKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function validatePlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return ["Plan must be a JSON object"];
  const actual = Object.keys(plan).sort();
  if (JSON.stringify(actual) !== JSON.stringify(INPUT_KEYS)) errors.push(`Plan keys must exactly equal: ${INPUT_KEYS.join(", ")}`);
  for (const key of ["FlowName", "FlowKey", "rootListSetId", "defResourceId"]) if (typeof plan[key] !== "string" || !plan[key].trim()) errors.push(`${key} must be a non-empty string`);
  if (!Array.isArray(plan.actionRecords) || !plan.actionRecords.length) errors.push("actionRecords must contain at least one shared-builder action");
  if (!Array.isArray(plan.loopRecords)) errors.push("loopRecords must be an array");
  if (!Array.isArray(plan.resourceInventory) || !plan.resourceInventory.length) errors.push("resourceInventory must contain the selected target resources");
  for (const [index, resource] of (plan.resourceInventory || []).entries()) {
    if (!resource || typeof resource.name !== "string" || typeof resource.listId !== "string" || !/^\d{16,}$/.test(resource.listId)) errors.push(`resourceInventory[${index}] requires name and a long numeric string listId`);
  }
  return errors;
}

export function generateScheduledDefinitionFromPlan(plan) {
  const planErrors = validatePlan(plan);
  if (planErrors.length) throw Object.assign(new Error("Scheduled Workflow plan is not generation-ready"), { code: "SCHEDULED_YWF_PLAN_INVALID", details: planErrors });
  const listMetaByName = new Map(plan.resourceInventory.map((resource) => [normKey(resource.name), { ...resource }]));
  const findings = [];
  const def = buildWorkflowSetDataListDefResource({
    name: plan.FlowName,
    formKey: plan.FlowKey,
    defId: plan.defResourceId,
    workflowType: 3,
    rootListSetId: plan.rootListSetId,
    actionRecords: plan.actionRecords,
    loopRecords: plan.loopRecords,
    listMetaByName,
    findings,
  });
  const blockers = findings.filter((finding) => finding?.level === "error" || finding?.severity === "error" || String(finding?.code || "").startsWith("FULL_APP_"));
  if (!def || blockers.length) throw Object.assign(new Error("Shared workflow builder rejected the plan"), { code: "SCHEDULED_YWF_SHARED_BUILDER_REJECTED", details: findings });
  return { FlowName: plan.FlowName, FlowKey: plan.FlowKey, Description: plan.Description, Icon: plan.Icon, Img: plan.Img, Settings: plan.Settings, Def: def };
}

export function main() {
  const args = process.argv.slice(2);
  const inputPath = args.shift();
  const outputPath = args.shift();
  if (!inputPath || !outputPath) throw new Error("Usage: node scripts/generate-scheduled-ywf-from-plan.mjs <plan.json> <output.ywf> --issued-ids ids.json [--dependency-map map.json] [--allow-recipients]");
  if (path.extname(outputPath).toLowerCase() !== ".ywf") throw new Error("Output path must end with .ywf");
  const options = { stage: "final", issuedIds: null, dependencyMap: null, allowRecipients: false };
  while (args.length) {
    const arg = args.shift();
    if (arg === "--issued-ids") options.issuedIds = loadIssuedIds(args.shift());
    else if (arg === "--dependency-map") options.dependencyMap = JSON.parse(fs.readFileSync(args.shift(), "utf8"));
    else if (arg === "--allow-recipients") options.allowRecipients = true;
    else if (arg === "--stage") throw new Error("Scheduled Workflow generation is fixed to final mode");
    else throw new Error(`Unknown argument: ${arg}`);
  }
  const plan = readCanonicalJson(inputPath).value;
  const definition = generateScheduledDefinitionFromPlan(plan);
  const wrapper = buildScheduledWrapper(definition);
  const prewrite = validateScheduledYwfObject(wrapper, options);
  if (prewrite.errors.length) throw Object.assign(new Error("Generated Scheduled Workflow failed pre-write validation"), { code: "SCHEDULED_YWF_PREWRITE_FAILED", report: prewrite });
  let postwrite;
  const committed = atomicWriteAndReadBack(outputPath, Buffer.from(canonicalJson(wrapper), "utf8"), (tempPath) => {
    postwrite = validateScheduledYwfFile(tempPath, { ...options, requireCanonical: true });
    if (postwrite.status === "fail") throw Object.assign(new Error("Generated Scheduled Workflow failed post-write validation"), { code: "SCHEDULED_YWF_POSTWRITE_FAILED", report: postwrite });
  });
  console.log(JSON.stringify({ status: postwrite.warnings.length ? "pass_with_warnings" : "pass", mode: "shared-full-app-workflow-builder", output: committed.outputPath, bytes: committed.bytes, sha256: committed.sha256, postwrite }, null, 2));
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || "")) {
  try { main(); }
  catch (error) { console.log(JSON.stringify({ status: "fail", code: error.code || "SCHEDULED_YWF_GENERATION_FAILED", message: error.message, details: error.details || null, report: error.report || null }, null, 2)); process.exit(1); }
}
