#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateDataListFormLayoutTemplate } from "./validate-data-list-form-layout-template.mjs";
import { validateDataListFormFieldsTemplate } from "./validate-data-list-form-fields-template.mjs";
import { validateApprovalFormFieldsTemplate } from "./validate-approval-form-fields-template.mjs";

const VALIDATORS = Object.freeze([
  ["validate-data-list-form-layout-template.mjs", validateDataListFormLayoutTemplate],
  ["validate-data-list-form-fields-template.mjs", validateDataListFormFieldsTemplate],
  ["validate-approval-form-fields-template.mjs", validateApprovalFormFieldsTemplate],
]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.plan) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validatePreIdAllocationReadiness({ appPlan: args.plan });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validatePreIdAllocationReadiness(options = {}) {
  const appPlan = path.resolve(String(options.appPlan || options.plan || ""));
  const gates = VALIDATORS.map(([validator, validate]) => {
    const report = validate({ plan: appPlan });
    return {
      validator,
      status: report.status,
      findings: report.findings || [],
    };
  });
  const findings = gates.flatMap((gate) => gate.findings.map((finding) => ({ ...finding, validator: gate.validator })));
  const status = findings.some((finding) => finding.level === "error") ? "fail" : "pass";
  return {
    status,
    marker: status === "pass" ? "FULL_APP_PRE_ID_ALLOCATION_READINESS_VALID" : "FULL_APP_PRE_ID_ALLOCATION_READINESS_BLOCKED",
    appPlan,
    gates,
    findings,
    proofBoundary: {
      apiIdAllocationAllowed: status === "pass",
      packageMaterializationAllowed: status === "pass",
      signingAllowed: false,
      installationAllowed: false,
      tenantMutationAllowed: false,
    },
  };
}

export async function runPreIdAllocationReadiness(options = {}) {
  const report = validatePreIdAllocationReadiness(options);
  if (report.status !== "pass") return { ...report, allocationInvoked: false };
  if (typeof options.allocateIds !== "function") return { ...report, allocationInvoked: false };
  const allocationResult = await options.allocateIds();
  return { ...report, allocationInvoked: true, allocationResult };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--plan" || token === "--app-plan") args.plan = argv[++index];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.error("Usage: node scripts/validate-pre-id-allocation-readiness.mjs --plan <yeeflow-app-plan.md>");
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
