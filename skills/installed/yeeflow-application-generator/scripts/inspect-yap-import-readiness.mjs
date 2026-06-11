#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const GZIP_PREFIX = "[______gizp______]";
const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-yap-import-readiness.mjs <app.yap|resource.json|app-def.json>",
    "",
    "Runs the strict generated-app import-readiness gate before handing off a new .yap.",
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

function parseJson(text) {
  return JSON.parse(text);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function collectPlaceholders(value) {
  const found = [];
  walk(value, (node, pointer) => {
    if (typeof node === "string" && PLACEHOLDER_RE.test(node)) found.push({ path: pointer, placeholder: node });
  });
  return found;
}

function decodeWrapper(inputPath) {
  const parsed = parseJson(fs.readFileSync(inputPath, "utf8"));
  if (typeof parsed?.Resource !== "string") return { wrapperPresent: false, wrapper: parsed, resource: null, data: parsed };
  if (!parsed.Resource.startsWith(GZIP_PREFIX)) return { wrapperPresent: true, wrapper: parsed, resourcePrefixValid: false, resource: null, data: null };
  const resource = parseJson(zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
  const data = parseJson(resource.Data);
  return { wrapperPresent: true, resourcePrefixValid: true, wrapper: parsed, resource, data };
}

function runJsonStep(name, command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
  let report = null;
  const reportPath = options.reportPath;
  try {
    const text = reportPath ? fs.readFileSync(reportPath, "utf8") : result.stdout;
    report = parseJson(text || "{}");
  } catch (error) {
    report = {
      status: "fail",
      errors: [{ code: "REPORT_PARSE_FAILED", message: `${name} did not emit parseable JSON.`, detail: { error: error.message, stderr: result.stderr } }],
      warnings: [],
    };
  }
  const errors = Array.isArray(report.errors) ? report.errors.length : Number(report.errors || 0);
  const warnings = Array.isArray(report.warnings) ? report.warnings.length : Number(report.warnings || 0);
  const findings = Array.isArray(report.findings) ? report.findings : [];
  const ignoredFindingCodes = new Set(options.ignoredFindingCodes || []);
  const activeFindings = findings.filter((finding) => !ignoredFindingCodes.has(finding.code));
  const ignoredFindings = findings.length - activeFindings.length;
  const findingErrors = activeFindings.filter((finding) => finding.level === "error" || finding.severity === "error").length;
  const findingWarnings = activeFindings.filter((finding) => finding.level === "warning" || finding.severity === "warning").length + ignoredFindings;
  const normalizedStatus = report.status || (warnings + findingWarnings > 0 ? "pass_with_warnings" : "pass");
  return {
    name,
    status: (result.status === 0 || ignoredFindings === findings.length) && report.status !== "fail" && errors + findingErrors === 0 ? normalizedStatus : "fail",
    exitCode: result.status,
    errors: errors + findingErrors,
    warnings: warnings + findingWarnings,
    dependencies: Array.isArray(report.dependencies) ? report.dependencies.length : 0,
    report,
  };
}

function main() {
  const { input } = parseArgs(process.argv);
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const inputPath = path.resolve(input);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "yap-import-readiness-"));
  const steps = [];

  try {
    steps.push(runJsonStep("strict-package-validation", process.execPath, [path.join(repoRoot, "validate-yap-package.js"), inputPath, "--mode", "generator", "--stage", "final"]));

    const graphJson = path.join(tmp, "graph.json");
    steps.push(runJsonStep("strict-graph-validation", process.execPath, [path.join(repoRoot, "validate-yap-graph.js"), inputPath, "--mode", "generator", "--stage", "final", "--json", graphJson], { reportPath: graphJson }));

    const materializationJson = path.join(tmp, "materialization.json");
    steps.push(runJsonStep("materialization-inspection", process.execPath, [path.join(repoRoot, "scripts/inspect-yap-materialization.mjs"), inputPath, "--out", materializationJson], { reportPath: materializationJson }));

    steps.push(runJsonStep("schema-standard-inspection", process.execPath, [path.join(repoRoot, "scripts/inspect-yap-schema-standard.mjs"), inputPath]));
    steps.push(runJsonStep("app-creation-rules-inspection", process.execPath, [path.join(repoRoot, "scripts/inspect-app-creation-rules.mjs"), inputPath]));
    steps.push(runJsonStep("data-view-inspection", process.execPath, [path.join(repoRoot, "scripts/inspect-data-views.mjs"), inputPath]));
    steps.push(runJsonStep("data-filter-controls-inspection", process.execPath, [path.join(repoRoot, "scripts/inspect-data-filter-controls.mjs"), inputPath]));
    steps.push(runJsonStep("pivot-table-controls-inspection", process.execPath, [path.join(repoRoot, "scripts/inspect-pivot-table-controls.mjs"), inputPath], {
      ignoredFindingCodes: ["TARGET_DASHBOARD_PAGE_NOT_FOUND"],
    }));
    steps.push(runJsonStep("kanban-collection-dynamic-controls-inspection", process.execPath, [path.join(repoRoot, "scripts/inspect-kanban-collection-dynamic-controls.mjs"), inputPath]));
    steps.push(runJsonStep("collection-kanban-actions-inspection", process.execPath, [path.join(repoRoot, "scripts/inspect-collection-kanban-actions.mjs"), inputPath]));
    steps.push(runJsonStep("timeline-dynamic-controls-inspection", process.execPath, [path.join(repoRoot, "scripts/inspect-timeline-dynamic-controls.mjs"), inputPath], {
      ignoredFindingCodes: ["TARGET_DASHBOARD_PAGE_NOT_FOUND"],
    }));
    steps.push(runJsonStep("generated-ui-quality-inspection", process.execPath, [path.join(repoRoot, "scripts/inspect-generated-ui-quality.mjs"), inputPath]));
    steps.push(runJsonStep("advanced-controls-inspection", process.execPath, [path.join(repoRoot, "scripts/inspect-advanced-controls.mjs"), inputPath]));
    steps.push(runJsonStep("container-button-actions-inspection", process.execPath, [path.join(repoRoot, "scripts/inspect-container-button-actions.mjs"), inputPath]));
    steps.push(runJsonStep("sub-list-dynamic-controls-inspection", process.execPath, [path.join(repoRoot, "scripts/inspect-sub-list-dynamic-controls.mjs"), inputPath]));

    const decoded = decodeWrapper(inputPath);
    const placeholders = collectPlaceholders(decoded);
    const wrapperRoundTrip = {
      name: "wrapper-round-trip-and-placeholder-scan",
      status: decoded.wrapperPresent && decoded.resourcePrefixValid && decoded.resource && decoded.data && placeholders.length === 0 ? "pass" : "fail",
      exitCode: decoded.wrapperPresent ? 0 : 1,
      errors: decoded.wrapperPresent && decoded.resourcePrefixValid && decoded.resource && decoded.data ? placeholders.length : 1,
      warnings: decoded.wrapperPresent ? 0 : 1,
      dependencies: 0,
      report: {
        wrapperPresent: decoded.wrapperPresent,
        resourcePrefixValid: Boolean(decoded.resourcePrefixValid),
        resourceJsonValid: Boolean(decoded.resource),
        resourceDataJsonValid: Boolean(decoded.data),
        placeholdersRemaining: placeholders.length,
        placeholders: placeholders.slice(0, 25),
      },
    };
    steps.push(wrapperRoundTrip);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  const failed = steps.filter((step) => step.status === "fail");
  const report = {
    input: inputPath,
    status: failed.length ? "fail" : steps.some((step) => step.status === "pass_with_warnings") ? "pass_with_warnings" : "pass",
    errors: steps.reduce((sum, step) => sum + step.errors, 0),
    warnings: steps.reduce((sum, step) => sum + step.warnings, 0),
    dependencies: steps.reduce((sum, step) => sum + step.dependencies, 0),
    steps: steps.map((step) => ({
      name: step.name,
      status: step.status,
      errors: step.errors,
      warnings: step.warnings,
      dependencies: step.dependencies,
    })),
  };
  console.log(JSON.stringify(report, null, 2));
  if (failed.length) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: 1, warnings: 0, dependencies: 0, steps: [], failure: { code: "IMPORT_READINESS_INSPECTION_FAILED", message: error.message } }, null, 2));
  process.exit(1);
}
