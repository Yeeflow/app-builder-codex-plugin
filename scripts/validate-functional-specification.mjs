#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const REQUIRED_HEADINGS = [
  "## 1. Specification Status",
  "## 2. Source Input Summary",
  "## 3. Requirement Interpretation Method",
  "## 4. Business Purpose",
  "## 5. Target Users and Business Roles",
  "## 6. Business Objects and Data Concepts",
  "## 7. Business Relationships and Dependency Rules",
  "## 8. Business Process Overview",
  "## 9. Status Lifecycles",
  "## 10. Approval and Review Requirements",
  "## 11. Data Entry and Form Requirements",
  "## 12. Workflow, Automation, and Action Requirements",
  "## 13. Reporting, Dashboard, and Analytics Requirements",
  "## 14. Document and Attachment Requirements",
  "## 15. AI, Copilot, and Intelligent Assistance Requirements",
  "## 16. Integration Requirements",
  "## 17. Permissions and Access Requirements",
  "## 18. UI and Experience Requirements",
  "## 19. Business Decision Gates",
  "## 20. Assumptions",
  "## 21. Risks, Constraints, and Unknowns",
  "## 22. Functional Specification Completeness Review",
  "## 23. Readiness for App Plan",
];

const REQUIRED_PATTERNS = [
  ["REQUIREMENT_INTERPRETATION_METHOD", /Requirement Interpretation Method/i],
  ["INPUT_DETAIL_CLASSIFICATION", /brief.*detailed.*document-backed.*screenshot-backed|Requirement detail level:/is],
  ["BUSINESS_OBJECTS", /Business Objects and Data Concepts/i],
  ["BUSINESS_RELATIONSHIPS", /Business Relationships and Dependency Rules/i],
  ["BUSINESS_DECISION_GATES", /Business Decision Gates/i],
  ["BUSINESS_PAGE_REQUIREMENTS", /Business Page Requirements/i],
  ["PAGE_REQUIREMENTS_ROLE_TASK_INFO_ACTIONS", /Needed By Roles[\s\S]*Business Task Solved[\s\S]*Information Users Need To See[\s\S]*Operations \/ Actions Users Need/i],
  ["PAGE_REQUIREMENTS_FILTERING_MOBILE_ACCESS", /Filtering \/ Grouping \/ Sorting \/ Priority Needs[\s\S]*Mobile Required[\s\S]*Visibility \/ Access Requirements/i],
  ["COMPLETENESS_REVIEW", /Functional Specification Completeness Review/i],
  ["READINESS_FOR_APP_PLAN", /Readiness for App Plan/i],
];

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-functional-specification.mjs <spec.md> [--json]",
    "",
    "Validates the standard Yeeflow Functional Specification Markdown gate. No API calls are made.",
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

function validate(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const headings = headingLineIndexes(text);
  const findings = [];
  const titlePattern = /^#\s+.+?\s+-\s+Functional Specification\s*$/m;
  const titleMatch = text.match(titlePattern);

  if (!titleMatch) {
    findings.push({
      level: "error",
      code: "FUNCTIONAL_SPEC_TITLE_HEADING_MISSING",
      message: "Missing required title heading: # <Application Name> - Functional Specification",
    });
  }

  let previousLine = titleMatch ? text.slice(0, titleMatch.index).split(/\r?\n/).length : 0;
  for (const heading of REQUIRED_HEADINGS) {
    const line = headings.get(heading);
    if (!line) {
      findings.push({
        level: "error",
        code: "FUNCTIONAL_SPEC_REQUIRED_HEADING_MISSING",
        message: `Missing required heading: ${heading}`,
        heading,
      });
      continue;
    }
    if (line <= previousLine) {
      findings.push({
        level: "error",
        code: "FUNCTIONAL_SPEC_REQUIRED_HEADING_ORDER_INVALID",
        message: `Required heading is out of order: ${heading}`,
        heading,
        line,
      });
    }
    previousLine = line;
  }

  for (const [code, pattern] of REQUIRED_PATTERNS) {
    if (!pattern.test(text)) {
      findings.push({
        level: "error",
        code: `FUNCTIONAL_SPEC_${code}_MISSING`,
        message: `Missing required Functional Specification text for ${code}.`,
      });
    }
  }

  const sectionSix = text.split(REQUIRED_HEADINGS[6])[0].split(REQUIRED_HEADINGS[5])[1] || "";
  if (!/Business Object|not applicable|N\/A/i.test(sectionSix)) {
    findings.push({
      level: "error",
      code: "FUNCTIONAL_SPEC_BUSINESS_OBJECTS_NOT_PLANNED",
      message: "Business objects must be listed or explicitly marked not applicable.",
    });
  }

  const sectionSeven = text.split(REQUIRED_HEADINGS[7])[0].split(REQUIRED_HEADINGS[6])[1] || "";
  if (!/Relationship|not applicable|N\/A/i.test(sectionSeven)) {
    findings.push({
      level: "error",
      code: "FUNCTIONAL_SPEC_RELATIONSHIPS_NOT_PLANNED",
      message: "Business relationships must be listed or explicitly marked not applicable.",
    });
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
      findings: [{ level: "error", code: "FUNCTIONAL_SPEC_FILE_MISSING", message: "Functional Specification file does not exist." }],
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  const report = validate(file);
  if (json) console.log(JSON.stringify(report, null, 2));
  else if (report.status === "pass") console.log(`functional specification validation passed: ${file}`);
  else {
    console.error(`functional specification validation failed: ${file}`);
    for (const finding of report.findings) console.error(`${finding.code}: ${finding.message}`);
  }
  if (report.errors) process.exitCode = 1;
}

main();
