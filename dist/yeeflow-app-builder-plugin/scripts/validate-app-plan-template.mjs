#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const REQUIRED_HEADINGS = [
  "## 1. Plan Status",
  "## 2. Application Purpose",
  "## 3. Target Users and Roles",
  "## 4. Business Process Overview",
  "## 5. Capability Coverage Plan",
  "## 6. Application Navigation",
  "## 7. Data Model and Lists",
  "## 8. Forms and Approval Forms",
  "## 9. Dashboards, Pages, and Reports",
  "## 10. UI/UX and Control Mapping",
  "## 11. Golden Template and Reference Strategy",
  "## 12. Actions and Workflow Logic",
  "## 13. Permissions",
  "## 14. Integrations and External Services",
  "## 15. Document Libraries and Attachments",
  "## 16. Reports and Analytics",
  "## 17. Data Validation Checklist",
  "## 18. Generation Contract and Hard Gates",
  "## 19. Generation Validation Plan",
  "## 20. Proof Boundary",
  "## 21. Assumptions",
  "## 22. Deferred or Runtime-Proof Items",
  "## 23. Recommended Next Prompt",
];

const REQUIRED_PATTERNS = [
  ["PLAN_STATUS_PLANNING_PLUGIN", /Planning plugin:/i],
  ["PLAN_STATUS_PACKAGE_TARGET", /Package target:/i],
  ["LIGHTWEIGHT_PLAN_MINIMUM", /lightweight plan is allowed only when the user explicitly asks for a quick outline/i],
  ["LIGHTWEIGHT_PLAN_REQUIRED_SECTIONS", /Data Model and Lists, Forms and Approval Forms, Application Navigation, UI\/UX and Control Mapping, Generation Contract and Hard Gates, Proof Boundary, and Assumptions\/Deferred Items/i],
  ["PURPOSE_SUCCESS_RUNTIME_EXPERIENCE", /successful runtime experience/i],
  ["ROLES_TABLE", /\|\s*Role\s*\|\s*Purpose\s*\|\s*Main Permissions/i],
  ["CAPABILITY_TABLE", /\|\s*Capability\s*\|\s*Required\s*\|\s*Planned Implementation\s*\|\s*Proof Level/i],
  ["CAPABILITY_DATA_LIST_VIEWS", /Data list views/i],
  ["CAPABILITY_DATA_LIST_WORKFLOWS", /Data-list workflows/i],
  ["CAPABILITY_SCHEDULED_WORKFLOWS", /Scheduled workflows/i],
  ["CAPABILITY_NOTIFICATIONS", /Notifications/i],
  ["CAPABILITY_CUSTOM_CODE", /Custom code\/control|Custom code control/i],
  ["CAPABILITY_GOLDEN_REFERENCES", /Golden functions\/references|Golden\/Template Reference/i],
  ["NAVIGATION_TYPE_CLASSES_LIST", /Type:\s*"classes"`?\s*(?:\+|with)\s*`?list/i],
  ["NAVIGATION_NO_CHILDREN", /Never use `children`|No `children` runtime groups/i],
  ["DATA_LIST_NATIVE_TITLE", /Retain native `Title`|retain native `Title`/i],
  ["DATA_LIST_RULES_CHOICES", /Rules\.choices/i],
  ["DATA_LIST_FIELD_DETAIL_TABLE", /\|\s*Field Name\s*\|\s*Display Name\s*\|\s*Type\s*\|\s*Required\s*\|\s*IsUnique\s*\|\s*Placeholder\s*\|\s*Example\/Values\s*\|\s*Description/i],
  ["DATA_LIST_FIELD_PLANNING_RULES", /Field planning rules:/i],
  ["DATA_LIST_REQUIRED_VIEWS_TABLE", /\|\s*View\s*\|\s*View Type\s*\|\s*Default\s*\|\s*Columns\/Fields/i],
  ["DATA_LIST_CUSTOM_FORMS", /Custom list forms and public forms/i],
  ["DATA_LIST_CUSTOM_FORM_FIELD_DESIGN", /Custom list form field design/i],
  ["DATA_LIST_CUSTOM_FORM_FIELD_BEHAVIOR_TABLE", /\|\s*Form\s*\|\s*Section\s*\|\s*Field ID\s*\|\s*Display Name\s*\|\s*Type\s*\|\s*Binding\s*\|\s*Required\s*\|\s*Read Only\s*\|\s*Default Value\s*\|\s*Auto Fill \/ Source\s*\|\s*Custom Validation/i],
  ["CUSTOM_VALIDATION_RULES", /Special custom validation must state the rule, trigger, error message, proof level, and implementation approach/i],
  ["DATA_LIST_WORKFLOWS_NOTIFICATIONS", /List workflows and notifications/i],
  ["APPROVAL_FORMS_EMPTY_GATE", /Forms:\s*\[\]/i],
  ["FORM_SECTION_TEMPLATE", /SECTION:\s*<Section Name>/i],
  ["FORM_CONTROL_DETAIL_TABLE", /\|\s*Field ID\s*\|\s*Display Name\s*\|\s*Type\s*\|\s*Binding\s*\|\s*Required\s*\|\s*Read Only\s*\|\s*Default Value\s*\|\s*Auto Fill \/ Source\s*\|\s*Custom Validation\s*\|\s*Description/i],
  ["FORM_FIELD_BEHAVIOR_RULES", /Read-only, default value, and autofill rules must be explicit/i],
  ["WORKFLOW_NODE_TABLE", /\|\s*Step Name\s*\|\s*Type\s*\|\s*Description\s*\|\s*Email Enabled\s*\|\s*Assignee Strategy\s*\|\s*Task\/Decision Settings\s*\|\s*Transition Rules/i],
  ["ASSIGNMENT_TASK_ASSIGNEE_PLAN", /Assignment task assignee plan:/i],
  ["ASSIGNMENT_TASK_ASSIGNEE_PLAN_TABLE", /\|\s*Task Name\s*\|\s*Assignment Type\s*\|\s*Required Job Position Name\s*\|\s*Source\s*\|\s*Proof Status\s*\|\s*Fallback or Blocker/i],
  ["ASSIGNMENT_ASSIGNEE_STRATEGY_REQUIRED", /Every Assignment Task must include an explicit assignee strategy/i],
  ["JOB_POSITION_DISCOVERED_CONFIRMED", /Job-position assignments must use discovered existing, user-selected existing, or admin-created-after-confirmation job positions/i],
  ["NO_INVENTED_JOB_POSITION_REFERENCES", /must not invent job-position IDs or names/i],
  ["MISSING_JOB_POSITIONS_BLOCK", /Missing job positions block generation/i],
  ["JOB_POSITION_ADMIN_CONFIRMATION", /explicit confirmation and confirmed system-admin permission/i],
  ["MANAGER_EXPRESSIONS_VALIDATED", /Manager-based assignments must use supported expression-editor patterns/i],
  ["APPROVAL_PLANNING_RULES", /Approval planning rules:/i],
  ["UI_CONTROL_MAPPING_TABLE", /\|\s*Page\/Form\s*\|\s*User Goal\s*\|\s*Layout Pattern\s*\|\s*Golden\/Template Reference\s*\|\s*Yeeflow Controls/i],
  ["CUSTOM_CODE_PLANNING_RULE", /native controls are insufficient/i],
  ["GOLDEN_TEMPLATE_REFERENCE", /Golden Template and Reference Strategy/i],
  ["GOLDEN_REFERENCE_TABLE", /\|\s*Area\s*\|\s*Required Function\/Page\/Layout\s*\|\s*Golden Reference or Template ID/i],
  ["AI_AGENT_COPILOT_SECTION", /AI Agents, Copilots, and Knowledge Resources/i],
  ["CUSTOM_CODE_SECTION", /Custom Code, Custom CSS, and Advanced Components/i],
  ["CREDENTIAL_RULE", /Never embed tenant URLs, API keys, webhook secrets, or private endpoints/i],
  ["OUTPUT_DEFAULT_YAPK", /Default output:\s*`\.yapk`/i],
  ["YAP_EXPLICIT_ONLY", /`\.yap` only if explicitly requested/i],
  ["SETSIGN_ENDPOINT", /POST \/utils\/apppackage\/setsign/i],
  ["VERIFYSIGN_ENDPOINT", /POST \/utils\/apppackage\/verifysign/i],
  ["PLACEHOLDER_SIGN_NOT_READY", /Placeholder `Sign` is not upload-ready/i],
  ["LOCAL_SCHEMA_NOT_UPLOAD_READY", /Local schema validation is not upload readiness/i],
  ["SIGNING_NOT_ID_NAV_PROOF", /Signing\/install acceptance does not prove ID provenance or navigation runtime metadata completeness/i],
  ["API_ID_PROVENANCE_GATE", /API-Issued Content ID Provenance Gate/i],
  ["API_ID_GENERATE_ENDPOINT", /GET \/utils\/generate\/ids\?count=<n>/i],
  ["ID_PROVENANCE_REPORT", /<app-name>-id-provenance-report\.json/i],
  ["ID_PROVENANCE_SOURCE_MARKER", /api-generated/i],
  ["LOCAL_ID_FALLBACK_FORBIDDEN", /Local sequential counters, hardcoded generated IDs, copied sample\/export IDs, random values, timestamps, UUID fallback, and deterministic local-only seeds are forbidden/i],
  ["APPROVAL_FORM_GATE", /Approval Form Gate/i],
  ["APPROVAL_ASSIGNMENT_PLAN_GATE", /Assignment task assignee plan required/i],
  ["APPROVAL_JOB_POSITION_RUNTIME_BOUNDARY", /Workflow assignment runtime correctness remains unproven until browser\/runtime verification/i],
  ["NAVIGATION_RUNTIME_GATE", /Navigation Runtime Gate/i],
  ["NAVIGATION_RUNTIME_METADATA_GATE", /Navigation runtime metadata validation/i],
  ["NAVIGATION_GROUP_FULL_METADATA", /Group shape: `ID`, `AppID`, `ListSetID`, `Type: "classes"`, `Title`, `Icon`, and `list`/i],
  ["NAVIGATION_GROUP_ID_API_ISSUED", /Group `ID` must be API-issued and present in the ID provenance manifest/i],
  ["NAVIGATION_CHILD_FULL_METADATA", /Every child item includes `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`/i],
  ["PLAN_TO_PACKAGE_CONFORMANCE_GATE", /Plan-to-Package Conformance Gate/i],
  ["ADVANCED_CAPABILITY_GATE", /Advanced Capability Gate/i],
  ["VALIDATION_PLAN_SCHEMA", /Schema validation:/i],
  ["VALIDATION_PLAN_ID_PROVENANCE", /ID provenance validation:/i],
  ["VALIDATION_PLAN_NAV_METADATA", /Navigation runtime metadata validation:/i],
  ["VALIDATION_PLAN_APP_CONFORMANCE", /App-plan conformance validation:/i],
  ["VALIDATION_PLAN_ADVANCED_CAPABILITIES", /AI Agent\/Copilot validation:|Custom code\/custom CSS validation:/i],
  ["PROOF_BOUNDARY_RUNTIME", /Runtime materialization\/render proof:/i],
  ["PROOF_BOUNDARY_ID_PROVENANCE", /ID provenance proof: pending \/ passed \/ failed/i],
  ["PROOF_BOUNDARY_NAV_METADATA", /Navigation runtime metadata proof: pending \/ passed \/ failed/i],
  ["PROOF_BOUNDARY_ID_NAV_EVIDENCE", /Evidence: ID allocation manifest and validator results/i],
  ["PROOF_BOUNDARY_ADVANCED_EXECUTION", /Notification delivery proof:|Custom code execution proof:/i],
  ["RECOMMENDED_NEXT_PROMPT", /Use this prompt after the plan is approved:/i],
];

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-app-plan-template.mjs <plan.md> [--json]",
    "",
    "Validates required Markdown section headings and hard-gate text for standard Yeeflow app plans. No API calls are made.",
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
  const titleMatch = text.match(/^#\s+(.+?)\s+-\s+Yeeflow Application Plan\s*$/m);
  if (!titleMatch) {
    findings.push({
      level: "error",
      code: "APP_PLAN_TITLE_HEADING_MISSING",
      message: "Missing required title heading: # <Application Name> - Yeeflow Application Plan",
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
  for (const [code, pattern] of REQUIRED_PATTERNS) {
    if (!pattern.test(text)) {
      findings.push({
        level: "error",
        code: `APP_PLAN_${code}_MISSING`,
        message: `Missing required app-plan template text for ${code}.`,
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
      findings: [{ level: "error", code: "APP_PLAN_FILE_MISSING", message: "Plan file does not exist." }],
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  const report = validate(file);
  if (json) console.log(JSON.stringify(report, null, 2));
  else if (report.status === "pass") console.log(`app plan template validation passed: ${file}`);
  else {
    console.error(`app plan template validation failed: ${file}`);
    for (const finding of report.findings) console.error(`${finding.code}: ${finding.message}`);
  }
  if (report.errors) process.exitCode = 1;
}

main();
