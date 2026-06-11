#!/usr/bin/env node

import { spawnSync } from "node:child_process";

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/report-generated-app-quality.mjs --package <app.yap|app.yapk> [--spec <spec.md>] [--plan <plan.md>] [--strict-visual-app-quality]",
    "",
    "Prints a concise readable generated-application quality report from inspect-generated-app-quality.mjs.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = [];
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (["--package", "--spec", "--plan", "--strict-app-quality", "--strict-visual-app-quality"].includes(arg)) {
      args.push(arg);
      if (!arg.startsWith("--strict")) args.push(argv[++index] || "");
    } else usage();
  }
  if (!args.includes("--package")) usage();
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const result = spawnSync(process.execPath, ["scripts/inspect-generated-app-quality.mjs", ...args], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    console.error(result.stdout || result.stderr);
    process.exit(1);
  }
  const findings = Array.isArray(report.findings) ? report.findings : [];
  const errors = findings.filter((finding) => finding.level === "error");
  const warnings = findings.filter((finding) => finding.level === "warning");
  const strict = report.strict?.visualSummary || {};
  const lines = [];
  lines.push(`# Generated App Quality Report`);
  lines.push("");
  lines.push(`Package: ${report.package}`);
  lines.push(`Package type: ${report.packageType || "unknown"}`);
  lines.push(`Status: ${report.status}`);
  lines.push(`Errors: ${report.errors || 0}`);
  lines.push(`Warnings: ${report.warnings || 0}`);
  lines.push("");
  if (Array.isArray(strict.expectedPages) && strict.expectedPages.length) {
    lines.push("Expected pages:");
    strict.expectedPages.forEach((page) => lines.push(`- ${page}`));
    lines.push("");
  }
  if (Array.isArray(strict.dashboards) && strict.dashboards.length) {
    lines.push("Dashboards:");
    strict.dashboards.forEach((dashboard) => {
      lines.push(`- ${dashboard.title}: ${dashboard.totalControls} controls, ${dashboard.dataTables} data tables, ${dashboard.buttons} buttons, ${dashboard.alerts} alerts, ${dashboard.itemTemplates} item-template controls`);
    });
    lines.push("");
  }
  if (Array.isArray(strict.customForms) && strict.customForms.length) {
    lines.push("Custom forms:");
    strict.customForms.forEach((form) => {
      lines.push(`- ${form.list} / ${form.title}: ${form.totalControls} controls, ${form.fieldControls} field controls`);
    });
    lines.push("");
  }
  lines.push("Blocking findings:");
  if (!errors.length) lines.push("- None");
  errors.forEach((finding) => lines.push(`- ${finding.code}: ${finding.message}`));
  lines.push("");
  lines.push("Warnings:");
  if (!warnings.length) lines.push("- None");
  warnings.forEach((finding) => lines.push(`- ${finding.code}: ${finding.message}`));
  console.log(lines.join("\n"));
  if (result.status) process.exitCode = result.status;
}

main();
