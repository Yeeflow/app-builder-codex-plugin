#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const errors = [];
const warnings = [];

const allowedTypes = new Set(["approval_form", "data_list", "dashboard"]);

if (!args.plan) {
  addError("STANDALONE_ARTIFACT_PLAN_MISSING", "Missing --plan <path>.");
}
if (!args.trace) {
  addError("STANDALONE_ARTIFACT_TRACE_MISSING", "Missing --trace <path>.");
}

let planText = "";
let trace = null;

if (args.plan) {
  if (!fs.existsSync(args.plan)) {
    addError("STANDALONE_ARTIFACT_PLAN_MISSING", `Plan file does not exist: ${args.plan}`);
  } else {
    planText = fs.readFileSync(args.plan, "utf8");
    if (!planText.trim()) {
      addError("STANDALONE_ARTIFACT_PLAN_EMPTY", `Plan file is empty: ${args.plan}`);
    }
  }
}

if (args.trace) {
  if (!fs.existsSync(args.trace)) {
    addError("STANDALONE_ARTIFACT_TRACE_MISSING", `Trace file does not exist: ${args.trace}`);
  } else {
    try {
      trace = JSON.parse(fs.readFileSync(args.trace, "utf8"));
    } catch (error) {
      addError("STANDALONE_ARTIFACT_TRACE_INVALID_JSON", `Trace JSON could not be parsed: ${error.message}`);
    }
  }
}

if (trace && typeof trace === "object") {
  validateTrace(trace);
}

if (trace && planText) {
  validatePlanText(planText, trace);
}

const ok = errors.length === 0;
const report = {
  ok,
  validator: "validate-standalone-artifact-plan-trace",
  plan: args.plan ? path.resolve(args.plan) : null,
  trace: args.trace ? path.resolve(args.trace) : null,
  artifactType: trace?.artifactType || null,
  errors,
  warnings,
};

console.log(JSON.stringify(report, null, 2));
process.exit(ok ? 0 : 1);

function validateTrace(value) {
  if (!value.artifactType || !allowedTypes.has(value.artifactType)) {
    addError(
      "STANDALONE_ARTIFACT_TRACE_TYPE_INVALID",
      `Trace artifactType must be one of ${Array.from(allowedTypes).join(", ")}.`,
      { artifactType: value.artifactType ?? null },
    );
  }
  if (!stringValue(value.name)) {
    addError("STANDALONE_ARTIFACT_TRACE_NAME_MISSING", "Trace must include a non-empty artifact name.");
  }
  if (!value.plan || typeof value.plan !== "object") {
    addError("STANDALONE_ARTIFACT_TRACE_PLAN_REF_MISSING", "Trace must include plan metadata.");
  } else {
    if (!stringValue(value.plan.path) && !stringValue(value.plan.source)) {
      addError("STANDALONE_ARTIFACT_TRACE_PLAN_REF_MISSING", "Trace plan metadata must include path or source.");
    }
    if (stringValue(value.plan.sha256) && args.plan && fs.existsSync(args.plan)) {
      const actualHash = crypto.createHash("sha256").update(fs.readFileSync(args.plan)).digest("hex");
      if (value.plan.sha256 !== actualHash) {
        addError("STANDALONE_ARTIFACT_TRACE_PLAN_HASH_MISMATCH", "Trace plan.sha256 does not match the plan file.", {
          expected: value.plan.sha256,
          actual: actualHash,
        });
      }
    }
  }
  if (!value.sharedBuilder || typeof value.sharedBuilder !== "object") {
    addError("STANDALONE_ARTIFACT_SHARED_BUILDER_MISSING", "Trace must declare the shared builder used.");
  } else {
    if (value.sharedBuilder.required !== true) {
      addError("STANDALONE_ARTIFACT_SHARED_BUILDER_NOT_REQUIRED", "Trace sharedBuilder.required must be true.");
    }
    if (!stringValue(value.sharedBuilder.builderFamily)) {
      addError("STANDALONE_ARTIFACT_SHARED_BUILDER_FAMILY_MISSING", "Trace sharedBuilder.builderFamily is required.");
    }
  }
  if (!Array.isArray(value.validators) || value.validators.length === 0) {
    addError("STANDALONE_ARTIFACT_VALIDATORS_MISSING", "Trace must list validators required for the generated artifact.");
  } else if (value.validators.some((validator) => !stringValue(validator))) {
    addError("STANDALONE_ARTIFACT_VALIDATORS_INVALID", "Trace validators must be non-empty strings.");
  }
  if (!value.conformance || typeof value.conformance !== "object") {
    addError("STANDALONE_ARTIFACT_CONFORMANCE_MISSING", "Trace must include plan-vs-actual conformance metadata.");
  } else {
    if (value.conformance.planToActualRequired !== true) {
      addError("STANDALONE_ARTIFACT_PLAN_TO_ACTUAL_NOT_REQUIRED", "Trace conformance.planToActualRequired must be true.");
    }
    if (!Array.isArray(value.conformance.requiredChecks) || value.conformance.requiredChecks.length === 0) {
      addError("STANDALONE_ARTIFACT_CONFORMANCE_CHECKS_MISSING", "Trace conformance.requiredChecks must list required checks.");
    }
  }

  if (value.artifactType === "approval_form") {
    validateApprovalTrace(value);
  } else if (value.artifactType === "data_list") {
    validateDataListTrace(value);
  } else if (value.artifactType === "dashboard") {
    validateDashboardTrace(value);
  }
}

function validateApprovalTrace(value) {
  const approval = value.approvalForm;
  if (!approval || typeof approval !== "object") {
    addError("STANDALONE_YWF_TRACE_APPROVAL_FORM_MISSING", "Approval Form trace must include approvalForm metadata.");
    return;
  }
  if (!Array.isArray(approval.pages) || approval.pages.length === 0) {
    addError("STANDALONE_YWF_TRACE_PAGES_MISSING", "Approval Form trace must include planned pages.");
  }
  if (!Array.isArray(approval.layoutTemplates) || approval.layoutTemplates.length === 0) {
    addError("STANDALONE_YWF_TRACE_LAYOUT_TEMPLATES_MISSING", "Approval Form trace must include layout template selections.");
  }
  if (!approval.workflow || typeof approval.workflow !== "object") {
    addError("STANDALONE_YWF_TRACE_WORKFLOW_MISSING", "Approval Form trace must include workflow planning metadata.");
  }
}

function validateDataListTrace(value) {
  const dataList = value.dataList;
  if (!dataList || typeof dataList !== "object") {
    addError("STANDALONE_YDL_TRACE_DATA_LIST_MISSING", "Data List trace must include dataList metadata.");
    return;
  }
  if (!Array.isArray(dataList.fields) || dataList.fields.length === 0) {
    addError("STANDALONE_YDL_TRACE_FIELDS_MISSING", "Data List trace must include planned fields.");
  }
  if (!Array.isArray(dataList.forms) || dataList.forms.length === 0) {
    addError("STANDALONE_YDL_TRACE_FORMS_MISSING", "Data List trace must include planned custom forms.");
  }
  if (!Array.isArray(dataList.views) || dataList.views.length === 0) {
    addError("STANDALONE_YDL_TRACE_VIEWS_MISSING", "Data List trace must include planned views.");
  }
}

function validateDashboardTrace(value) {
  const dashboard = value.dashboard;
  if (!dashboard || typeof dashboard !== "object") {
    addError("STANDALONE_YDP_TRACE_DASHBOARD_MISSING", "Dashboard trace must include dashboard metadata.");
    return;
  }
  if (!stringValue(dashboard.pageLayoutTemplateId)) {
    addError("STANDALONE_YDP_TRACE_PAGE_LAYOUT_MISSING", "Dashboard trace must include pageLayoutTemplateId.");
  }
  if (!Array.isArray(dashboard.sections) || dashboard.sections.length === 0) {
    addError("STANDALONE_YDP_TRACE_SECTIONS_MISSING", "Dashboard trace must include planned sections.");
  }
}

function validatePlanText(text, value) {
  const lower = text.toLowerCase();
  const requiredPlanPhrases = [
    "artifact type",
    "generation contract",
    "shared builder",
    "proof boundary",
  ];
  for (const phrase of requiredPlanPhrases) {
    if (!lower.includes(phrase)) {
      addError("STANDALONE_ARTIFACT_PLAN_SECTION_MISSING", `Plan must include ${phrase}.`, { phrase });
    }
  }
  const typeNeedle = value.artifactType.replaceAll("_", " ");
  if (!lower.includes(typeNeedle) && !lower.includes(value.artifactType)) {
    addError("STANDALONE_ARTIFACT_PLAN_TYPE_MISMATCH", "Plan text must identify the same artifact type as the trace.", {
      artifactType: value.artifactType,
    });
  }
}

function addError(code, message, details = undefined) {
  errors.push(details ? { code, message, details } : { code, message });
}

function stringValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--plan") {
      parsed.plan = argv[++index];
    } else if (arg === "--trace") {
      parsed.trace = argv[++index];
    } else if (arg === "--help" || arg === "-h") {
      console.log("Usage: validate-standalone-artifact-plan-trace.mjs --plan <artifact-plan.md> --trace <artifact-plan.trace.json>");
      process.exit(0);
    }
  }
  return parsed;
}
