#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const REQUIRED_HEADINGS = [
  "## 1. Specification Status",
  "## 2. Source Input Summary",
  "## 3. Requirement Interpretation Method",
  "## 4. Business Context",
  "## 5. User Roles and Responsibilities",
  "## 6. Business Objects and Data Requirements",
  "## 7. Business Relationships and Dependency Rules",
  "## 8. Core Business Process",
  "## 9. Business Rules and Status Lifecycles",
  "## 10. Approval and Review Requirements",
  "## 11. Data Entry and Form Requirements",
  "## 12. Workflow and Notification Requirements",
  "## 13. Dashboard Page Requirements",
  "## 14. Reporting and Audit Requirements",
  "## 15. Document and Attachment Requirements",
  "## 16. AI, Copilot, and Intelligent Assistance Requirements",
  "## 17. Integration Requirements",
  "## 18. Permissions and Access Requirements",
  "## 19. UI and Experience Requirements",
  "## 20. Business Clarification Gates",
  "## 21. Assumptions",
  "## 22. Risks, Constraints, and Unknowns",
  "## 23. Functional Specification Completeness Review",
  "## 24. Readiness for App Plan",
];

const REQUIRED_PATTERNS = [
  ["REQUIREMENT_INTERPRETATION_METHOD", /Requirement Interpretation Method/i],
  ["DOCUMENT_METADATA", /Document metadata/i],
  ["INPUT_DETAIL_CLASSIFICATION", /brief.*detailed.*document-backed.*screenshot-backed|Requirement detail level:/is],
  ["BUSINESS_CONTEXT", /Business Context/i],
  ["GOALS_AND_NON_GOALS", /Goals and non-goals|Business goals[\s\S]*Non-goals/i],
  ["ROLE_RESPONSIBILITIES", /User Roles and Responsibilities/i],
  ["BUSINESS_OBJECTS", /Business Objects and Data Requirements/i],
  ["BUSINESS_RELATIONSHIPS", /Business Relationships and Dependency Rules/i],
  ["BUSINESS_RULES", /Business Rules and Status Lifecycles/i],
  ["DASHBOARD_PAGE_REQUIREMENTS", /Dashboard Page Requirements/i],
  ["REPORTING_AUDIT_REQUIREMENTS", /Reporting and Audit Requirements/i],
  ["PERMISSIONS_VISIBILITY_RULES", /Permissions and visibility rules|Permissions and Access Requirements/i],
  ["BUSINESS_CLARIFICATION_GATES", /Business Clarification Gates/i],
  ["ASSUMPTIONS_DEFAULTS_DEFERRED", /Assumptions, defaults, and deferred decisions|Defaults applied for planning[\s\S]*Deferred business decisions/i],
  ["VALIDATION_CHECKLIST", /Functional Specification validation checklist|Functional Specification Completeness Review/i],
  ["COMPLETENESS_REVIEW", /Functional Specification Completeness Review/i],
  ["READINESS_FOR_APP_PLAN", /Readiness for App Plan/i],
];

const SECTION_RULES = [
  {
    title: "Business Context",
    code: "BUSINESS_CONTEXT_INCOMPLETE",
    terms: ["business problem", "target users", "operational scope", "expected outcome"],
  },
  {
    title: "User Roles and Responsibilities",
    code: "ROLE_RESPONSIBILITIES_INCOMPLETE",
    terms: ["what they need to do", "records they can see", "actions they can perform", "decisions they own", "dashboards/pages they need"],
  },
  {
    title: "Core Business Process",
    code: "BUSINESS_PROCESS_STEPS_INCOMPLETE",
    terms: ["start trigger", "submission/intake", "review/approval", "assignment/fulfillment", "status tracking", "completion/closure", "exception handling", "audit/history needs"],
  },
  {
    title: "Business Rules and Status Lifecycles",
    code: "BUSINESS_RULES_INCOMPLETE",
    terms: ["status lifecycle", "approval", "assignment", "SLA", "validation", "notification", "escalation", "completion", "cancellation", "permission"],
  },
  {
    title: "Business Objects and Data Requirements",
    code: "BUSINESS_OBJECT_DATA_REQUIREMENTS_INCOMPLETE",
    terms: ["business purpose", "required fields", "field meaning", "field type expectation", "lookup/reference relationships", "lifecycle/status fields", "audit fields", "reporting/dashboard fields"],
  },
  {
    title: "Dashboard Page Requirements",
    code: "DASHBOARD_PAGE_CONTENT_REQUIREMENTS_INCOMPLETE",
    terms: ["dashboard name", "primary users", "business questions", "source business objects", "required summary metrics", "calculation logic", "required data regions", "display fields", "filter requirements", "source field", "applies to regions", "sorting/grouping", "user actions", "mobile support", "business exceptions"],
  },
  {
    title: "Approval and Review Requirements",
    code: "APPROVAL_FORM_REQUIREMENTS_INCOMPLETE",
    terms: ["trigger", "submitter", "reviewers", "decisions", "rework", "attachments", "completion"],
  },
  {
    title: "Workflow and Notification Requirements",
    code: "WORKFLOW_NOTIFICATION_REQUIREMENTS_INCOMPLETE",
    terms: ["trigger condition", "business condition", "actor/recipient", "action/result", "timing/SLA", "notification content intent"],
  },
  {
    title: "Reporting and Audit Requirements",
    code: "REPORTING_AUDIT_REQUIREMENTS_INCOMPLETE",
    terms: ["auditable", "reports", "dashboards", "history", "compliance", "operational evidence"],
  },
  {
    title: "Business Clarification Gates",
    code: "BUSINESS_CLARIFICATION_GATE_DETAILS_INCOMPLETE",
    terms: ["decision key", "question", "options", "recommended default", "why it matters", "approval status"],
  },
];

const REQUIRED_TABLE_SCHEMAS = [
  {
    section: "User Roles and Responsibilities",
    code: "ROLE_RESPONSIBILITIES_TABLE_SCHEMA_MISSING",
    headers: ["Role", "What They Need To Do", "Records They Can See", "Actions They Can Perform", "Decisions They Own", "Dashboards/Pages They Need"],
  },
  {
    section: "Business Objects and Data Requirements",
    code: "BUSINESS_OBJECT_DATA_TABLE_SCHEMA_MISSING",
    headers: ["Business Object", "Business Purpose", "Required Fields", "Field Meaning", "Field Type Expectation", "Lookup/Reference Relationships", "Lifecycle/Status Fields", "Audit Fields", "Reporting/Dashboard Fields"],
  },
  {
    section: "Core Business Process",
    code: "CORE_BUSINESS_PROCESS_REQUIRED_BLOCKS_MISSING",
    headers: ["Start trigger", "Submission/intake", "Review/approval", "Assignment/fulfillment", "Status tracking", "Completion/closure", "Exception handling", "Audit/history needs"],
    listOnly: true,
  },
  {
    section: "Business Rules and Status Lifecycles",
    code: "STATUS_LIFECYCLE_TABLE_SCHEMA_MISSING",
    headers: ["Lifecycle Name", "Applies To", "Status Values", "Initial Status", "Final Statuses", "Transition Rules"],
  },
  {
    section: "Business Rules and Status Lifecycles",
    code: "BUSINESS_RULES_TABLE_SCHEMA_MISSING",
    headers: ["Rule Area", "Business Rule", "Applies To", "Condition", "Required Data/Fields", "Responsible Role", "Exception/Rework Behavior", "Reporting Impact"],
  },
  {
    section: "Approval and Review Requirements",
    code: "APPROVAL_REVIEW_TABLE_SCHEMA_MISSING",
    headers: ["Approval/Review Process", "Trigger", "Submitter", "Reviewers/Approvers", "Decisions", "Required Task Work"],
  },
  {
    section: "Workflow and Notification Requirements",
    code: "WORKFLOW_NOTIFICATION_TABLE_SCHEMA_MISSING",
    headers: ["Workflow/Notification", "Trigger Condition", "Business Condition", "Actor/Recipient", "Action/Result", "Timing/SLA", "Notification Content Intent"],
  },
  {
    section: "Dashboard Page Requirements",
    code: "DASHBOARD_IDENTITY_TABLE_SCHEMA_MISSING",
    headers: ["Dashboard Name", "Primary Users", "Business Purpose", "Business Questions It Must Answer", "Source Business Objects/Data Lists", "Mobile Support Requirement", "Business Exceptions/Alerts To Highlight"],
  },
  {
    section: "Dashboard Page Requirements",
    code: "DASHBOARD_METRICS_TABLE_SCHEMA_MISSING",
    headers: ["Dashboard", "Metric", "Source Object/List", "Source Fields", "Calculation Logic", "Default Scope", "Alert/Threshold Logic"],
  },
  {
    section: "Dashboard Page Requirements",
    code: "DASHBOARD_DATA_REGIONS_TABLE_SCHEMA_MISSING",
    headers: ["Dashboard", "Data Region", "Business Purpose", "Source Object/List", "Display Fields", "User Actions Needed", "Sorting/Grouping Requirements"],
  },
  {
    section: "Dashboard Page Requirements",
    code: "DASHBOARD_FILTERS_TABLE_SCHEMA_MISSING",
    headers: ["Dashboard", "Filter", "Source Object/List", "Source Field", "Default Scope", "Applies To Regions"],
  },
  {
    section: "Reporting and Audit Requirements",
    code: "REPORTING_AUDIT_TABLE_SCHEMA_MISSING",
    headers: ["Report/Page/KPI", "Business Question", "Users", "Data Needed", "Filters", "Actions"],
  },
  {
    section: "Permissions and Access Requirements",
    code: "PERMISSIONS_VISIBILITY_TABLE_SCHEMA_MISSING",
    headers: ["Role", "Resource/Process", "View", "Create", "Edit", "Delete/Archive", "Approve", "Admin"],
  },
  {
    section: "Business Clarification Gates",
    code: "BUSINESS_CLARIFICATION_GATES_TABLE_SCHEMA_MISSING",
    headers: ["Decision Key", "Question", "Options", "Recommended Default", "Why It Matters", "Required Before App Plan?", "Approval Status"],
  },
  {
    section: "Functional Specification Completeness Review",
    code: "FUNCTIONAL_SPEC_VALIDATION_CHECKLIST_TABLE_SCHEMA_MISSING",
    headers: ["Review Item", "Status", "Notes"],
  },
];

const VAGUE_PHRASES = [
  ["show dashboard", "FUNCTIONAL_SPEC_VAGUE_SHOW_DASHBOARD"],
  ["track status", "FUNCTIONAL_SPEC_VAGUE_TRACK_STATUS"],
  ["manage requests", "FUNCTIONAL_SPEC_VAGUE_MANAGE_REQUESTS"],
  ["send notifications", "FUNCTIONAL_SPEC_VAGUE_SEND_NOTIFICATIONS"],
];

const PROHIBITED_IMPLEMENTATION_PATTERNS = [
  ["FUNCTIONAL_SPEC_LOW_LEVEL_YEEFLOW_ID_LEAK", /\b(?:ListID|PageID|FormID|LayoutID|ProcKey)\s*[:=]\s*[A-Za-z0-9_-]+|\b(?:ListID|PageID|FormID|LayoutID|ProcKey)\b(?!\/)/i],
  ["FUNCTIONAL_SPEC_LOW_LEVEL_ACTIONTYPECODE_LEAK", /\bactionTypeCode\s*[:=]\s*["']?\d+["']?/i],
  ["FUNCTIONAL_SPEC_LOW_LEVEL_JSON_PATH_LEAK", /\b(?:attrs|Resource|Pages|Data|Childs|LayoutInResources|Ext2)\.[A-Za-z0-9_.[\]]+/i],
  ["FUNCTIONAL_SPEC_LOW_LEVEL_CONTROL_TYPE_LEAK", /\b(?:summary|collection|data table|kanban|flex_grid|container|dynamic field|dynamic user|data filter|pivot table)\s+control\b/i],
  ["FUNCTIONAL_SPEC_EXACT_RESOURCE_ID_LEAK", /\b\d{16,}\b/],
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

function extractSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = [];
  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!match) continue;
    const level = match[1].length;
    let end = lines.length;
    for (let next = index + 1; next < lines.length; next++) {
      const nextMatch = lines[next].match(/^(#{1,6})\s+(.+?)\s*$/);
      if (nextMatch && nextMatch[1].length <= level) {
        end = next;
        break;
      }
    }
    const title = match[2].trim().replace(/^\d+\.\s*/, "");
    sections.push({ title, normalizedTitle: title.toLowerCase(), body: lines.slice(index + 1, end).join("\n") });
  }
  return sections;
}

function sectionBody(sections, title) {
  const wanted = title.toLowerCase();
  return sections.find((section) => section.normalizedTitle === wanted || section.normalizedTitle.includes(wanted))?.body ?? "";
}

function hasTerm(sectionText, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\//g, "[/ ]");
  return new RegExp(escaped, "i").test(sectionText);
}

function normalizeHeaderCell(value) {
  return value.toLowerCase().replace(/`/g, "").replace(/\s+/g, " ").trim();
}

function tableHeaderRows(sectionText) {
  return sectionText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .filter((line) => !/^\|\s*:?-{3,}:?/.test(line));
}

function tableHeaderIncludes(sectionText, expectedHeaders) {
  const normalizedExpected = expectedHeaders.map(normalizeHeaderCell);
  return tableHeaderRows(sectionText).some((row) => {
    const cells = row
      .split("|")
      .slice(1, -1)
      .map(normalizeHeaderCell);
    return normalizedExpected.every((expected) => cells.includes(expected));
  });
}

function validateRequiredTableSchemas(sections, findings) {
  for (const schema of REQUIRED_TABLE_SCHEMAS) {
    const body = sectionBody(sections, schema.section);
    const missing = schema.headers.filter((header) => !hasTerm(body, header));
    const valid = schema.listOnly ? missing.length === 0 : tableHeaderIncludes(body, schema.headers);
    if (!valid) {
      findings.push({
        level: "error",
        code: `FUNCTIONAL_SPEC_${schema.code}`,
        message: `${schema.section} must use the canonical template schema and include: ${schema.headers.join(", ")}.`,
        section: schema.section,
        missing,
      });
    }
  }
}

function strippedForPolicyChecks(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => !/\b(do not include|do not select|exclude|must not include|belongs? in|defer .* to|low-level Yeeflow implementation details)\b/i.test(line))
    .join("\n")
    .replace(/```[\s\S]*?```/g, "");
}

function genericLineHasConcreteContext(line) {
  return /\b(role|field|status|condition|rule|calculation|source|filter|metric|approval|assignment|SLA|overdue|recipient|trigger|exception|audit|permission|region|display|record|object|default|threshold)\b/i.test(line);
}

function validate(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const headings = headingLineIndexes(text);
  const sections = extractSections(text);
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

  for (const rule of SECTION_RULES) {
    const body = sectionBody(sections, rule.title);
    const missing = rule.terms.filter((term) => !hasTerm(body, term));
    if (missing.length) {
      findings.push({
        level: "error",
        code: `FUNCTIONAL_SPEC_${rule.code}`,
        message: `${rule.title} is missing required business-analysis content: ${missing.join(", ")}.`,
        section: rule.title,
        missing,
      });
    }
  }

  validateRequiredTableSchemas(sections, findings);

  const sectionSix = sectionBody(sections, "Business Objects and Data Requirements");
  if (!/Business Object|not applicable|N\/A/i.test(sectionSix)) {
    findings.push({
      level: "error",
      code: "FUNCTIONAL_SPEC_BUSINESS_OBJECTS_NOT_PLANNED",
      message: "Business objects must be listed or explicitly marked not applicable.",
    });
  }

  const sectionSeven = sectionBody(sections, "Business Relationships and Dependency Rules");
  if (!/Relationship|not applicable|N\/A/i.test(sectionSeven)) {
    findings.push({
      level: "error",
      code: "FUNCTIONAL_SPEC_RELATIONSHIPS_NOT_PLANNED",
      message: "Business relationships must be listed or explicitly marked not applicable.",
    });
  }

  const policyText = strippedForPolicyChecks(text);
  for (const line of policyText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || /^#{1,6}\s/.test(trimmed) || /^\|?\s*:?-{3,}:?\s*\|?/.test(trimmed)) continue;
    for (const [phrase, code] of VAGUE_PHRASES) {
      if (trimmed.toLowerCase().includes(phrase) && !genericLineHasConcreteContext(trimmed)) {
        findings.push({
          level: "error",
          code,
          message: `Vague Functional Specification wording must be expanded with business rules, fields, roles, or conditions: "${phrase}".`,
          line: trimmed,
        });
      }
    }
  }

  for (const [code, pattern] of PROHIBITED_IMPLEMENTATION_PATTERNS) {
    const match = policyText.match(pattern);
    if (match) {
      findings.push({
        level: "error",
        code,
        message: "Functional Specification contains low-level implementation detail that belongs in App Plan, Page Function Plan, Blueprint, or resource generation.",
        value: match[0],
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
