#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import { validate as validateResourceOrderAppPlan } from "./validate-app-plan-resource-order.mjs";

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-app-plan-template.mjs <yeeflow-app-plan.md> [--json]",
    "",
    "Compatibility entrypoint for the canonical Yeeflow App Plan resource-order Markdown contract.",
    "The primary App Plan artifact is yeeflow-app-plan.md with title '# <Application Name> - Yeeflow App Plan'.",
    "This validator intentionally delegates to validate-app-plan-resource-order.mjs so both gates enforce one schema.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function missingFileReport(file) {
  return {
    status: "fail",
    schema: "yeeflow-app-plan-resource-order",
    compatibilityEntrypoint: "validate-app-plan-template.mjs",
    file: path.resolve(file),
    errors: 1,
    warnings: 0,
    findings: [{ level: "error", code: "APP_PLAN_FILE_MISSING", message: "Plan file does not exist." }],
  };
}

function validate(file) {
  const report = validateResourceOrderAppPlan(file);
  return {
    ...report,
    schema: "yeeflow-app-plan-resource-order",
    compatibilityEntrypoint: "validate-app-plan-template.mjs",
    primaryArtifact: "yeeflow-app-plan.md",
  };
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) usage(0);
  const json = process.argv.includes("--json");
  const file = process.argv.slice(2).find((arg) => arg !== "--json");
  if (!file) usage();
  const report = fs.existsSync(file) ? validate(file) : missingFileReport(file);
  if (json) console.log(JSON.stringify(report, null, 2));
  else if (report.status === "pass") console.log(`app plan template validation passed: ${file}`);
  else {
    console.error(`app plan template validation failed: ${file}`);
    for (const finding of report.findings) console.error(`${finding.code}: ${finding.message}`);
  }
  if (report.errors) process.exitCode = 1;
}

main();
