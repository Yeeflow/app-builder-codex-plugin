#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const REQUIRED_HEADINGS = [
  "## 1. Plan Status",
  "## 2. Requirement-to-Yeeflow Resource Mapping Summary",
  "## 3. Resource Generation Order",
  "## 4. Data Lists and Document Libraries Plan",
  "## 5. Approval Forms Plan",
  "## 6. Form Reports Plan",
  "## 7. Schedule Workflows Plan",
  "## 8. AI Agents Plan",
  "## 9. Copilots Plan",
  "## 10. Custom Data List Forms Plan",
  "## 11. Data List Workflows Plan",
  "## 12. Notifications Plan",
  "## 13. Data List Views Plan",
  "## 14. Dashboard Pages Plan",
  "## 15. Application Navigation Plan",
  "## 16. Target Users, Roles, Groups, and Permissions",
  "## 17. Plugin Capability and Standards Compliance",
  "## 18. Generation Contract and Hard Gates",
  "## 19. Validation Plan",
  "## 20. Proof Boundary",
  "## 21. Assumptions",
  "## 22. Deferred or Runtime-Proof Items",
  "## 23. Recommended Next Prompt",
];

const RESOURCE_ORDER = [
  /Data lists and Document libraries/i,
  /Approval forms/i,
  /Form reports/i,
  /Schedule workflows/i,
  /AI Agents/i,
  /Copilots/i,
  /Custom Data List forms/i,
  /Data List workflows/i,
  /Notifications/i,
  /Data List views/i,
  /Dashboard pages/i,
  /Application navigation/i,
  /Target users, roles, groups, and permissions/i,
];

const REQUIRED_PATTERNS = [
  ["RESOURCE_GENERATION_ORDER", /Resource Generation Order/i],
  ["DATALIST_PLACEHOLDER", /Data Lists and Document Libraries Plan[\s\S]*Placeholder/i],
  ["APPROVAL_SUBMISSION_PLACEHOLDER", /Submission Form Fields[\s\S]*Placeholder/i],
  ["TASK_FORM_PLACEHOLDER", /Task Form Fields[\s\S]*Placeholder/i],
  ["CUSTOM_FORM_PLACEHOLDER", /Custom Data List Forms Plan[\s\S]*Placeholder/i],
  ["FORM_REPORTS", /Form Reports Plan/i],
  ["FORM_REPORT_STANDALONE", /Form report is a standalone Yeeflow resource type|Form Report is an independent Yeeflow resource/i],
  ["FORM_REPORT_APPROVAL_BASED", /based on (one )?specific Approval Form|based on their related Approval forms/i],
  ["FORM_REPORT_DASHBOARD_SEPARATE", /Do not (merge|mix).*Form report.*Dashboard|not a Dashboard/i],
  ["PLUGIN_CAPABILITY_COMPLIANCE", /Plugin Capability and Standards Compliance/i],
  ["PROOF_BOUNDARY", /Proof Boundary/i],
  ["ASSUMPTIONS", /Assumptions/i],
  ["DEFERRED_RUNTIME_PROOF", /Deferred or Runtime-Proof Items/i],
  ["RECOMMENDED_NEXT_PROMPT", /Recommended Next Prompt/i],
  ["DO_NOT_INVENT_UNSUPPORTED_SHAPES", /Do not invent unsupported|Do not plan invented/i],
  ["UNKNOWN_CAPABILITY_LABELS", /export-learning-required[\s\S]*runtime-proof-required[\s\S]*deferred/i],
];

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-app-plan-resource-order.mjs <plan.md> [--json]",
    "",
    "Validates the standard Yeeflow App Plan resource-order contract. No API calls are made.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function normalizeHeading(line) {
  return line.trim().replace(/\s+/g, " ");
}

function headingLineIndexes(text) {
  const map = new Map();
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/^#{1,6}\s+/.test(line)) map.set(normalizeHeading(line), index + 1);
  });
  return map;
}

function validateResourceOrder(text, findings) {
  const orderSection = text.split(REQUIRED_HEADINGS[3])[0].split(REQUIRED_HEADINGS[2])[1] || "";
  let previous = -1;
  RESOURCE_ORDER.forEach((pattern, index) => {
    const match = orderSection.match(pattern);
    if (!match || match.index === undefined) {
      findings.push({
        level: "error",
        code: "APP_PLAN_RESOURCE_ORDER_ITEM_MISSING",
        message: `Missing resource generation order item ${index + 1}.`,
      });
      return;
    }
    if (match.index <= previous) {
      findings.push({
        level: "error",
        code: "APP_PLAN_RESOURCE_ORDER_INVALID",
        message: `Resource generation order item ${index + 1} is out of order.`,
      });
    }
    previous = match.index;
  });
}

function validate(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const headings = headingLineIndexes(text);
  const findings = [];
  const titlePattern = /^#\s+.+?\s+-\s+Yeeflow App Plan\s*$/m;
  const titleMatch = text.match(titlePattern);

  if (!titleMatch) {
    findings.push({
      level: "error",
      code: "APP_PLAN_TITLE_HEADING_MISSING",
      message: "Missing required title heading: # <Application Name> - Yeeflow App Plan",
    });
  }

  let previousLine = titleMatch ? text.slice(0, titleMatch.index).split(/\r?\n/).length : 0;
  for (const heading of REQUIRED_HEADINGS) {
    const line = headings.get(heading);
    if (!line) {
      findings.push({
        level: "error",
        code: "APP_PLAN_REQUIRED_HEADING_MISSING",
        message: `Missing required heading: ${heading}`,
        heading,
      });
      continue;
    }
    if (line <= previousLine) {
      findings.push({
        level: "error",
        code: "APP_PLAN_REQUIRED_HEADING_ORDER_INVALID",
        message: `Required heading is out of order: ${heading}`,
        heading,
        line,
      });
    }
    previousLine = line;
  }

  validateResourceOrder(text, findings);

  for (const [code, pattern] of REQUIRED_PATTERNS) {
    if (!pattern.test(text)) {
      findings.push({
        level: "error",
        code: `APP_PLAN_${code}_MISSING`,
        message: `Missing required App Plan text for ${code}.`,
      });
    }
  }

  const errors = findings.filter((finding) => finding.level === "error").length;
  return {
    status: errors ? "fail" : "pass",
    file: path.resolve(file),
    requiredHeadingCount: REQUIRED_HEADINGS.length,
    errors,
    warnings: 0,
    findings,
  };
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) usage(0);
  const json = process.argv.includes("--json");
  const file = process.argv.slice(2).find((arg) => arg !== "--json");
  if (!file) usage();
  if (!fs.existsSync(file)) {
    const report = {
      status: "fail",
      file: path.resolve(file),
      errors: 1,
      warnings: 0,
      findings: [{ level: "error", code: "APP_PLAN_FILE_MISSING", message: "App Plan file does not exist." }],
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  const report = validate(file);
  if (json) console.log(JSON.stringify(report, null, 2));
  else if (report.status === "pass") console.log(`app plan resource-order validation passed: ${file}`);
  else {
    console.error(`app plan resource-order validation failed: ${file}`);
    for (const finding of report.findings) console.error(`${finding.code}: ${finding.message}`);
  }
  if (report.errors) process.exitCode = 1;
}

main();
