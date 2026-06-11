#!/usr/bin/env node

import fs from "node:fs";

function usage(exitCode = 1) {
  const text = "Usage: node scripts/validate-yap-generation-report.mjs <report.json>";
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const input = argv[2];
  if (!input) usage();
  return { input };
}

function asString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function walk(value, visit, pointer = "$") {
  visit(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visit, `${pointer}[${index}]`));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, child]) => walk(child, visit, `${pointer}.${key}`));
}

const { input } = parseArgs(process.argv);
let report;
try {
  report = JSON.parse(fs.readFileSync(input, "utf8"));
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: [{ code: "REPORT_JSON_INVALID", message: error.message }], warnings: [] }, null, 2));
  process.exit(1);
}

const errors = [];
const warnings = [];
const proofBoundary = report.proofBoundary || report.proof_boundary || report.proof || report.validationProof || null;
if (!proofBoundary) {
  errors.push({ code: "YAP_PROOF_BOUNDARY_MISSING", message: "Generated YAP reports must include a proof boundary field." });
}

let queuedMarkedSuccess = false;
walk(report, (value, pointer) => {
  if (typeof value !== "string") return;
  const text = value.toLowerCase();
  if ((text.includes("api accepted") || text.includes("queued") || text.includes("completed=false")) && /import (successful|success|passed)|successfully imported/.test(text)) {
    queuedMarkedSuccess = true;
    errors.push({ code: "YAP_REPORT_API_QUEUED_MARKED_SUCCESS", message: "Report labels API accepted/queued as import success.", path: pointer });
  }
});

if (!queuedMarkedSuccess) {
  const apiStatus = asString(report.apiStatus ?? report.api_status ?? report.api?.status);
  const completed = report.Completed ?? report.completed ?? report.api?.Completed ?? report.api?.completed;
  const result = asString(report.result ?? report.statusLabel ?? report.importStatus ?? report.import_status);
  if (apiStatus === "0" && completed === false && /success|successful|imported/i.test(result)) {
    errors.push({ code: "YAP_REPORT_API_QUEUED_MARKED_SUCCESS", message: "Report treats API status 0 with Completed=false as import success." });
  }
}

console.log(JSON.stringify({ status: errors.length ? "fail" : warnings.length ? "pass_with_warnings" : "pass", errors, warnings }, null, 2));
if (errors.length) process.exit(1);
