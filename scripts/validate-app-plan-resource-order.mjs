#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  ["APPROVAL_SUBMISSION_PLACEHOLDER", /(?:Submission Form Fields|Submission fields|Submitter-entered fields|Request intake fields)[\s\S]*(?:Placeholder|input hint|entry hint|prompt text)/i],
  ["TASK_FORM_PLACEHOLDER", /(?:Task Form Fields|Task page fields|Task fields|Assignee task fields)[\s\S]*(?:Placeholder|input hint|entry hint|prompt text)/i],
  ["CUSTOM_FORM_PLACEHOLDER", /Custom Data List Forms Plan[\s\S]*Placeholder/i],
  ["DATA_LIST_FORM_LAYOUT_TEMPLATE_SELECTION", /Data List Form Layout Template Selection/i],
  ["DATA_LIST_FORM_FIELDS_TEMPLATE_SELECTION", /Form Fields Layout Template Selection/i],
  ["FORM_REPORTS", /Form Reports Plan/i],
  ["FORM_REPORT_STANDALONE", /Form report is a standalone Yeeflow resource type|Form Report is an independent Yeeflow resource|Form reports? (?:are|is) independent approval-based resources?/i],
  ["FORM_REPORT_APPROVAL_BASED", /based on (one )?specific Approval Form|based on their related Approval forms|approval-based resources?|created from a specific Approval form/i],
  ["FORM_REPORT_DASHBOARD_SEPARATE", /Do not (merge|mix).*Form report.*Dashboard|not a Dashboard|Form reports?[\s\S]{0,200}separate from (?:Dashboard\/page|Dashboard page|workbench page|page|list view) planning/i],
  ["PLUGIN_CAPABILITY_COMPLIANCE", /Plugin Capability and Standards Compliance/i],
  ["PROOF_BOUNDARY", /Proof Boundary/i],
  ["ASSUMPTIONS", /Assumptions/i],
  ["DEFERRED_RUNTIME_PROOF", /Deferred or Runtime-Proof Items/i],
  ["RECOMMENDED_NEXT_PROMPT", /Recommended Next Prompt/i],
  ["DO_NOT_INVENT_UNSUPPORTED_SHAPES", /Do not invent unsupported|Do not plan invented|Unsupported[\s\S]{0,160}should not be generated/i],
  ["UNKNOWN_CAPABILITY_LABELS", /export-learning-required[\s\S]*runtime-proof-required[\s\S]*deferred/i],
  ["RECORD_DISPLAY_CONTROL_SELECTION", /Record Display Control Selection/i],
  ["DASHBOARD_FILTERS", /Dashboard Filters/i],
  ["SUMMARY_METRICS", /Summary Metrics/i],
  ["DATA_ANALYTICS_TEMPLATE_SELECTION", /Data Analytics Template Selection/i],
  ["DASHBOARD_ACTIONS", /Dashboard Actions/i],
  ["ITEM_TEMPLATE_DYNAMIC_CONTROLS", /Item Template Dynamic Controls/i],
  ["COLLECTION_KANBAN_ACTIONS", /Collection (and|\/) Kanban Item Actions|Collection\/Kanban item actions/i],
  ["SUB_LIST_ACTIONS", /Sub List List Actions|No custom Sub List actions required|No Sub List actions are needed|Sub List actions are not required/i],
  [
    "PLUGIN_SUPPORTED_TYPE_PROPERTY_RULE",
    /resource types[\s\S]*field types[\s\S]*variable types[\s\S]*controls[\s\S]*Dynamic controls[\s\S]*workflow nodes[\s\S]*form actions[\s\S]*Collection\/Kanban actions[\s\S]*Sub List actions[\s\S]*property paths[\s\S]*(configuration shapes|bindings)/i,
  ],
];

const REQUIRED_TABLE_SCHEMAS = [
  {
    section: "Dashboard Pages Plan",
    code: "DASHBOARD_PAGE_IDENTITY_TABLE_SCHEMA_MISSING",
    headers: ["Dashboard Page Name", "Business Purpose", "Functional Spec Dashboard Requirement Reference", "Source Data Lists/Business Objects", "Navigation Placement", "Page Function Plan Reference"],
  },
  {
    section: "Dashboard Pages Plan",
    code: "DASHBOARD_SECTIONS_TABLE_SCHEMA_MISSING",
    headers: ["Section Order", "Section Name", "Business Purpose", "Source Data List or Business Object", "Required Fields or Metrics", "Selected Yeeflow Control Type Category", "Why This Control Type Is Appropriate", "User Actions Needed", "Proof Boundary or Deferred Note"],
  },
  {
    section: "Dashboard Pages Plan",
    code: "DASHBOARD_FILTERS_TABLE_SCHEMA_MISSING",
    headers: ["Filter Name", "Source Data List", "Filter Field", "Applies-to Dashboard Sections", "Selected Yeeflow Filter/Control Type If Known", "Default Business Scope", "Proof Boundary or Deferred Note"],
  },
  {
    section: "Dashboard Pages Plan",
    code: "SUMMARY_METRICS_TABLE_SCHEMA_MISSING",
    headers: ["Metric Name", "Source Data List", "Source Field(s)", "Calculation Logic", "Selected Yeeflow Control Type Category", "Display Format Intent", "Proof Boundary or Deferred Note"],
  },
  {
    section: "Dashboard Pages Plan",
    code: "DATA_ANALYTICS_TEMPLATE_SELECTION_TABLE_SCHEMA_MISSING",
    headers: ["Section", "Surface", "Data Source", "Business Question", "Selected Data Analytics Template", "Grouping/Axis Fields", "Value/Aggregate Fields", "Selection Reason", "Proof Boundary"],
  },
  {
    section: "Dashboard Pages Plan",
    code: "DASHBOARD_ACTIONS_TABLE_SCHEMA_MISSING",
    headers: ["Action Name", "Business Purpose", "Source/Target Business Object", "Expected User Outcome", "Supported Yeeflow Action Category When Known", "Proof Boundary or Deferred Note"],
  },
  {
    section: "Dashboard Pages Plan",
    code: "RECORD_DISPLAY_CONTROL_SELECTION_TABLE_SCHEMA_MISSING",
    headers: ["Section", "Data Source", "Display Need", "Selected Record Display Control", "Selection Reason", "Detail/Open Behavior", "Proof Boundary"],
  },
  {
    section: "Dashboard Pages Plan",
    code: "ITEM_TEMPLATE_DYNAMIC_CONTROLS_TABLE_SCHEMA_MISSING",
    headers: ["Host Control", "Source List", "Business Label", "Source Field", "Expected Dynamic Display Control Category", "Display Purpose", "Proof Boundary or Deferred Note"],
  },
  {
    section: "Custom Data List Forms Plan",
    code: "DATA_LIST_FORM_LAYOUT_TEMPLATE_SELECTION_TABLE_SCHEMA_MISSING",
    headers: ["Data List or Library", "Custom Form", "Form Usage", "Selected Data List Form Layout Template", "Business Sections Needed", "Related Data / Analytics Needed", "Selection Reason", "Proof Boundary"],
  },
  {
    section: "Custom Data List Forms Plan",
    code: "DATA_LIST_FORM_FIELDS_TEMPLATE_SELECTION_TABLE_SCHEMA_MISSING",
    headers: ["Data List or Library", "Custom Form", "Field Group", "Selected Form Fields Layout Template", "PC/Laptop Columns", "Tablet Columns", "Mobile Columns", "Full-Row Field Controls", "Dynamic Display Grouping", "Proof Boundary"],
  },
];

const DASHBOARD_ALLOWED_CONTROL_CATEGORIES = [
  /Summary\s*\/\s*KPI card/i,
  /\bSummary\b/i,
  /\bKPI card\b/i,
  /\bData Filter\b/i,
  /\bCollection\b/i,
  /\bData table\b/i,
  /\bKanban\b/i,
  /\bVertical Timeline\b/i,
  /\bVertical timeline\b/i,
  /\bHorizontal Timeline\b/i,
  /\bHorizontal timeline\b/i,
  /\bText\s*\/\s*Heading\b/i,
  /\bText\b/i,
  /\bHeading\b/i,
  /\bButton\s*\/\s*action button\b/i,
  /\bButton\b/i,
  /\baction button\b/i,
  /\bContainer\b/i,
  /\bGrid\s*\/\s*flex grid\b/i,
  /\bGrid\b/i,
  /\bflex grid\b/i,
  /\bChart\s*\/\s*Data analytics\b/i,
  /\bChart\b/i,
  /\bData analytics\b/i,
];

const DASHBOARD_PROOF_LABEL = /\b(runtime-proof-required|export-learning-required|deferred)\b/i;
const DASHBOARD_UNSUPPORTED_CONTROL_HINTS = [
  /\bmega\s*widget\b/i,
  /\bmagic\s*dashboard\b/i,
  /\bsuper\s*chart\b/i,
  /\bworkflow\s*matrix\b/i,
  /\bAI\s*control\b/i,
  /\bcustom\s*react\b/i,
  /\bunsupported\s*control\b/i,
  /\binvented\s*control\b/i,
];

const DASHBOARD_FORBIDDEN_IMPLEMENTATION_PATTERNS = [
  ["APP_PLAN_DASHBOARD_LOW_LEVEL_ID_LEAK", /\b(?:ListID|PageID|FormID|LayoutID|ProcKey)\s*[:=]\s*[A-Za-z0-9_-]+|\b(?:ListID|PageID|FormID|LayoutID|ProcKey)\b(?!\/)/i],
  ["APP_PLAN_DASHBOARD_ACTIONTYPECODE_LEAK", /\bactionTypeCode\s*[:=]\s*["']?\d+["']?/i],
  ["APP_PLAN_DASHBOARD_JSON_PROPERTY_PATH_LEAK", /\b(?:attrs|Resource|Pages|Data|Childs|LayoutInResources|Ext2)\.[A-Za-z0-9_.[\]]+/i],
  ["APP_PLAN_DASHBOARD_FAKE_PLACEHOLDER_ID_LEAK", /\b(?:LIST|PAGE|FORM|LAYOUT|PROC)-[A-Za-z0-9_-]+\b/i],
  ["APP_PLAN_DASHBOARD_EXACT_RESOURCE_ID_LEAK", /\b\d{16,}\b/],
  ["APP_PLAN_DASHBOARD_LAYOUT_JSON_LEAK", /"type"\s*:\s*"?(?:container|collection|summary|data-table|kanban|text|heading)"?|^\s*[{[]\s*$/im],
];

const APPROVED_DATA_ANALYTICS_TEMPLATE_IDS = new Set([
  "data_analytics_pie_chart_with_title",
  "data_analytics_column_chart_with_title",
  "data_analytics_bar_chart_with_title",
  "data_analytics_line_chart_with_title",
  "data_analytics_area_chart_with_title",
  "data_analytics_pivot_table_standard",
]);

const APPROVED_DATA_LIST_FORM_LAYOUT_TEMPLATE_IDS = new Set([
  "data_list_form_layout_new_edit_v1_1",
  "data_list_form_layout_view_item_v1_1",
]);

const APPROVED_DATA_LIST_FORM_FIELDS_TEMPLATE_IDS = new Set([
  "data_list_form_fields_grid_v1_1",
]);

const APPROVED_APPROVAL_FORM_LAYOUT_TEMPLATE_IDS = new Set([
  "approval_form_layout_submission_v1_1",
  "approval_form_layout_task_v1_1",
]);

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
    if (!tableHeaderIncludes(body, schema.headers)) {
      findings.push({
        level: "error",
        code: `APP_PLAN_${schema.code}`,
        message: `${schema.section} must use the canonical template schema and include: ${schema.headers.join(", ")}.`,
        section: schema.section,
      });
    }
  }
}

function splitTableRows(sectionText) {
  return sectionText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .filter((line) => !/^\|\s*:?-{3,}:?/.test(line))
    .filter((line) => !/<[^>]+>/.test(line));
}

function rawTableRows(sectionText) {
  return sectionText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .filter((line) => !/^\|\s*:?-{3,}:?/.test(line));
}

function hasAllowedDashboardControlCategory(text) {
  return DASHBOARD_ALLOWED_CONTROL_CATEGORIES.some((pattern) => pattern.test(text));
}

function lineLooksLikeDashboardControlPlanning(line) {
  return /\b(control type|control category|Selected Yeeflow|Summary|KPI|Data Filter|Collection|Data table|Kanban|Timeline|Text|Heading|Button|Container|Grid|Chart|Data analytics|widget|control)\b/i.test(line);
}

function policyDashboardText(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => !/\b(do not include|must not include|belongs? to|belong to|those belong|without specifying|for example|such as)\b/i.test(line))
    .join("\n")
    .replace(/```[\s\S]*?```/g, "");
}

function isNegativeGuardrailLine(line) {
  return /\b(do not|don't|must not|never|forbid|forbidden|reject|rejected|fail|fails|block|blocks|blocked|blocking|blocker|blockers|not generation-ready|must be marked|marked as|unless marked|without runtime proof|proof-required|deferred)\b/i.test(line);
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

function validateControlActionPlanning(text, findings) {
  if (/\b(Collection|Kanban|Vertical Timeline|Horizontal Timeline|Vertical timeline|Horizontal timeline)\b/i.test(text) && !/Item Template Dynamic Controls/i.test(text)) {
    findings.push({
      level: "error",
      code: "APP_PLAN_ITEM_TEMPLATE_DYNAMIC_CONTROLS_MISSING",
      message: "Collection, Kanban, Vertical Timeline, or Horizontal Timeline planning requires item-template Dynamic control planning.",
    });
  }

  if (/\b(Collection|Kanban)\b/i.test(text) && !/(Collection (and|\/) Kanban Item Actions|No Collection\/Kanban item actions required)/i.test(text)) {
    findings.push({
      level: "error",
      code: "APP_PLAN_COLLECTION_KANBAN_ACTION_DECISION_MISSING",
      message: "Collection/Kanban planning requires item action planning or an explicit no-action decision.",
    });
  }

  if (/\bSub List\b/i.test(text) && !/(Sub List List Actions|No custom Sub List actions required|No Sub List actions are needed|Sub List actions are not required)/i.test(text)) {
    findings.push({
      level: "error",
      code: "APP_PLAN_SUB_LIST_ACTION_DECISION_MISSING",
      message: "Sub List planning requires list action planning or an explicit no-action decision.",
    });
  }
}

function validateDashboardPagesPlan(text, findings) {
  const sections = extractSections(text);
  const dashboard = sectionBody(sections, "Dashboard Pages Plan");
  if (!dashboard.trim()) return;

  const requiredIdentityPatterns = [
    ["APP_PLAN_DASHBOARD_PAGE_IDENTITY_NAME_MISSING", /Page name:/i],
    ["APP_PLAN_DASHBOARD_PAGE_IDENTITY_PURPOSE_MISSING", /Business purpose:/i],
    ["APP_PLAN_DASHBOARD_SOURCE_SPEC_REFERENCE_MISSING", /Source Functional Specification dashboard requirement reference:/i],
    ["APP_PLAN_DASHBOARD_SOURCE_DATA_MISSING", /Source data lists\/business objects:/i],
    ["APP_PLAN_DASHBOARD_NAVIGATION_PLACEMENT_MISSING", /Navigation placement:/i],
    ["APP_PLAN_DASHBOARD_PAGE_FUNCTION_REFERENCE_MISSING", /Page Function Plan reference if applicable:/i],
  ];
  for (const [code, pattern] of requiredIdentityPatterns) {
    if (!pattern.test(dashboard)) {
      findings.push({
        level: "error",
        code,
        message: "Dashboard Pages Plan entries must include page identity, source requirement, source data, navigation, and Page Function Plan reference fields.",
      });
    }
  }

  const requiredSubsections = [
    ["APP_PLAN_DASHBOARD_SECTIONS_MISSING", /#### Dashboard Sections/i],
    ["APP_PLAN_DASHBOARD_FILTERS_MISSING", /#### Dashboard Filters/i],
    ["APP_PLAN_DASHBOARD_SUMMARY_METRICS_MISSING", /#### Summary Metrics/i],
    ["APP_PLAN_DASHBOARD_DATA_ANALYTICS_SELECTION_MISSING", /#### Data Analytics Template Selection/i],
    ["APP_PLAN_DASHBOARD_ACTIONS_MISSING", /#### Dashboard Actions/i],
    ["APP_PLAN_DASHBOARD_RECORD_DISPLAY_SELECTION_MISSING", /#### Record Display Control Selection/i],
    ["APP_PLAN_DASHBOARD_DYNAMIC_CONTROLS_MISSING", /#### Item Template Dynamic Controls/i],
  ];
  for (const [code, pattern] of requiredSubsections) {
    if (!pattern.test(dashboard)) {
      findings.push({
        level: "error",
        code,
        message: "Dashboard Pages Plan must include section-level controls, filters, metrics, actions, record display selection, and dynamic display planning.",
      });
    }
  }

  const dashboardRows = splitTableRows(dashboard);
  const dashboardSectionsBlock = dashboard.split(/#### Dashboard Filters/i)[0].split(/#### Dashboard Sections/i)[1] || "";
  const hasSectionControlRow = rawTableRows(dashboardSectionsBlock).some((row) => hasAllowedDashboardControlCategory(row));
  const hasConcreteSectionRow = dashboardRows.some((row) => /Summary|KPI|Data Filter|Collection|Data table|Kanban|Timeline|Text|Heading|Button|Container|Grid|Chart|Data analytics/i.test(row) && /\|[^|]{3,}\|/.test(row))
    || hasSectionControlRow;
  if (!hasConcreteSectionRow) {
    findings.push({
      level: "error",
      code: "APP_PLAN_DASHBOARD_CONTROL_TYPE_PLANNING_MISSING",
      message: "Dashboard Pages Plan must map dashboard sections to legal Yeeflow control type categories; saying only 'dashboard' is not enough.",
    });
  }

  if (/\bdashboard\b/i.test(dashboard) && !hasSectionControlRow) {
    findings.push({
      level: "error",
      code: "APP_PLAN_DASHBOARD_CONTROL_TYPE_PLANNING_MISSING",
      message: "Dashboard Pages Plan mentions a dashboard but does not choose supported Yeeflow control type categories.",
    });
  }

  validateDashboardDataAnalyticsTemplateSelection(dashboard, findings);

  const policyText = policyDashboardText(dashboard);
  for (const line of policyText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || /^\|?\s*:?-{3,}:?\s*\|?/.test(trimmed)) continue;
    if (/No custom (actions|Sub List actions|required)|No Collection\/Kanban item actions required/i.test(trimmed)) continue;
    if (isNegativeGuardrailLine(trimmed)) continue;
    const unsupported = DASHBOARD_UNSUPPORTED_CONTROL_HINTS.find((pattern) => pattern.test(trimmed));
    if (unsupported && !DASHBOARD_PROOF_LABEL.test(trimmed)) {
      findings.push({
        level: "error",
        code: "APP_PLAN_DASHBOARD_UNSUPPORTED_CONTROL_TYPE",
        message: "Dashboard Pages Plan uses an unsupported or invented control type without runtime-proof-required, export-learning-required, or deferred.",
        line: trimmed,
      });
    }
    if (lineLooksLikeDashboardControlPlanning(trimmed) && /\b(?:custom|invented|unsupported|magic|mega|super)\b/i.test(trimmed) && !DASHBOARD_PROOF_LABEL.test(trimmed)) {
      findings.push({
        level: "error",
        code: "APP_PLAN_DASHBOARD_UNSUPPORTED_CONTROL_TYPE",
        message: "Dashboard Pages Plan uses an unsupported or invented control type without runtime-proof-required, export-learning-required, or deferred.",
        line: trimmed,
      });
    }
  }

  for (const [code, pattern] of DASHBOARD_FORBIDDEN_IMPLEMENTATION_PATTERNS) {
    const match = policyText.match(pattern);
    if (match) {
      findings.push({
        level: "error",
        code,
        message: "Dashboard Pages Plan contains implementation-level IDs, action codes, property paths, fake placeholder IDs, or layout JSON that belong to Blueprint/resource generation.",
        value: match[0],
      });
    }
  }
}

function validateDashboardDataAnalyticsTemplateSelection(dashboard, findings) {
  const dashboardSectionsBlock = dashboard.split(/#### Dashboard Filters/i)[0].split(/#### Dashboard Sections/i)[1] || "";
  const analyticsPlanned = splitTableRows(dashboardSectionsBlock).some((row) => /\b(Chart|Data analytics|Pie chart|Column chart|Bar chart|Line chart|Area chart|Pivot table)\b/i.test(row));
  const selectionBlock = dashboard.split(/#### Dashboard Actions/i)[0].split(/#### Data Analytics Template Selection/i)[1] || "";
  const rows = splitTableRows(selectionBlock);
  const selectedIds = [];
  for (const row of rows) {
    const ids = [...row.matchAll(/\bdata_analytics_[a-z0-9_]+\b/g)].map((match) => match[0]);
    for (const id of ids) {
      selectedIds.push(id);
      if (!APPROVED_DATA_ANALYTICS_TEMPLATE_IDS.has(id)) {
        findings.push({
          level: "error",
          code: "APP_PLAN_DATA_ANALYTICS_TEMPLATE_UNKNOWN",
          message: "Data Analytics Template Selection must use an approved Data Analytics golden reference template ID.",
          templateId: id,
        });
      }
    }
  }
  if (analyticsPlanned && selectedIds.length === 0) {
    findings.push({
      level: "error",
      code: "APP_PLAN_DATA_ANALYTICS_TEMPLATE_SELECTION_REQUIRED",
      message: "Dashboard sections that select Chart/Data analytics must include an approved Data Analytics template ID in the Data Analytics Template Selection table.",
    });
  }
}

function validateDataListFormLayoutTemplateSelection(text, findings) {
  const sections = extractSections(text);
  const customForms = sectionBody(sections, "Custom Data List Forms Plan");
  if (!customForms.trim()) return;
  const hasConcreteCustomFormRows = splitTableRows(customForms).some((row) => /\|\s*(New|Edit|View|New\/Edit|Detail|Custom|Print)\s*\|/i.test(row));
  const selectionBlock = customForms.split(/#### Form Fields/i)[0].split(/#### Data List Form Layout Template Selection/i)[1] || "";
  const rows = splitTableRows(selectionBlock);
  const selectedIds = [];
  for (const row of rows) {
    const ids = [...row.matchAll(/\bdata_list_form_layout_[a-z0-9_]+\b/g)].map((match) => match[0]);
    for (const id of ids) {
      selectedIds.push(id);
      if (!APPROVED_DATA_LIST_FORM_LAYOUT_TEMPLATE_IDS.has(id)) {
        findings.push({
          level: "error",
          code: "APP_PLAN_DATA_LIST_FORM_LAYOUT_TEMPLATE_UNKNOWN",
          message: "Data List Form Layout Template Selection must use an approved Data List Form Layouts v1.1 template ID.",
          templateId: id,
        });
      }
    }
    if (/\b(?:new|edit|new\/edit)\b/i.test(row) && !row.includes("data_list_form_layout_new_edit_v1_1")) {
      findings.push({
        level: "error",
        code: "APP_PLAN_DATA_LIST_FORM_LAYOUT_NEW_EDIT_TEMPLATE_MISMATCH",
        message: "New/Edit custom Data List forms must select data_list_form_layout_new_edit_v1_1.",
        row,
      });
    }
    if (/\bview\b/i.test(row) && !row.includes("data_list_form_layout_view_item_v1_1")) {
      findings.push({
        level: "error",
        code: "APP_PLAN_DATA_LIST_FORM_LAYOUT_VIEW_TEMPLATE_MISMATCH",
        message: "View Item custom Data List forms must select data_list_form_layout_view_item_v1_1.",
        row,
      });
    }
  }
  if (hasConcreteCustomFormRows && selectedIds.length === 0) {
    findings.push({
      level: "error",
      code: "APP_PLAN_DATA_LIST_FORM_LAYOUT_TEMPLATE_SELECTION_REQUIRED",
      message: "Custom Data List Forms Plan must select an approved Data List Form Layouts v1.1 template for generated New/Edit/View forms.",
    });
  }
}

function validateDataListFormFieldsTemplateSelection(text, findings) {
  const sections = extractSections(text);
  const customForms = sectionBody(sections, "Custom Data List Forms Plan");
  if (!customForms.trim()) return;
  const hasConcreteCustomFormRows = splitTableRows(customForms).some((row) => /\|\s*(?:New|Edit|View|New\/Edit)\s*\|/i.test(row));
  if (!hasConcreteCustomFormRows) return;
  if (/intentionally has no current-record field controls/i.test(customForms)) return;
  const selectionBlock = customForms.split(/#### Custom Form Actions|#### Sub List List Actions|##\s+11\./i)[0].split(/#### Form Fields Layout Template Selection/i)[1] || "";
  const rows = splitTableRows(selectionBlock);
  const selectedIds = [];
  for (const row of rows) {
    const ids = [...row.matchAll(/\bdata_list_form_fields_[a-z0-9_]+\b/g)].map((match) => match[0]);
    for (const id of ids) {
      selectedIds.push(id);
      if (!APPROVED_DATA_LIST_FORM_FIELDS_TEMPLATE_IDS.has(id)) {
        findings.push({
          level: "error",
          code: "APP_PLAN_DATA_LIST_FORM_FIELDS_TEMPLATE_UNKNOWN",
          message: "Form Fields Layout Template Selection must use an approved Data List Form field-layout template ID.",
          templateId: id,
        });
      }
    }
    if (!row.includes("data_list_form_fields_grid_v1_1")) continue;
    const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
    const pc = Number(cells[4]);
    const tablet = Number(cells[5]);
    const mobile = Number(cells[6]);
    if (!Number.isFinite(pc) || pc < 2 || pc > 3) {
      findings.push({
        level: "error",
        code: "APP_PLAN_DATA_LIST_FORM_FIELDS_PC_COLUMNS_INVALID",
        message: "PC/laptop columns for data_list_form_fields_grid_v1_1 must be 2 or 3.",
        row,
      });
    }
    if (Number.isFinite(tablet) && Number.isFinite(pc) && tablet > pc) {
      findings.push({
        level: "error",
        code: "APP_PLAN_DATA_LIST_FORM_FIELDS_TABLET_COLUMNS_INVALID",
        message: "Tablet columns must not exceed PC/laptop columns for data_list_form_fields_grid_v1_1.",
        row,
      });
    }
    if (Number.isFinite(mobile) && mobile !== 1) {
      findings.push({
        level: "error",
        code: "APP_PLAN_DATA_LIST_FORM_FIELDS_MOBILE_COLUMNS_INVALID",
        message: "Mobile columns should be 1 for data_list_form_fields_grid_v1_1.",
        row,
      });
    }
  }
  if (selectedIds.length === 0) {
    findings.push({
      level: "error",
      code: "APP_PLAN_DATA_LIST_FORM_FIELDS_TEMPLATE_SELECTION_REQUIRED",
      message: "Custom Data List Forms Plan must select data_list_form_fields_grid_v1_1 for generated current-record field groups.",
    });
  }
}

function validateApprovalFormLayoutTemplateSelection(text, findings) {
  const sections = extractSections(text);
  const approvalForms = sectionBody(sections, "Approval Forms Plan");
  if (!approvalForms.trim()) return;
  const dataRows = splitTableRows(approvalForms).filter((row) => !/^\|\s*(Approval Form|Field Order|Step Order|Task Form Name|Action Name|Host Form)\s*\|/i.test(row));
  const hasApprovalRows = dataRows.some((row) => /\b(Submission|Task|Workflow|Review|Approve|Reject|approval_form_layout_)\b/i.test(row));
  if (!hasApprovalRows) return;
  const selectionBlock = approvalForms.split(/##\s+6\./i)[0].split(/#### Approval Form Layout Template Selection/i)[1] || "";
  const rows = splitTableRows(selectionBlock);
  const selectedIds = [];
  for (const row of rows) {
    const ids = [...row.matchAll(/\bapproval_form_layout_[a-z0-9_]+\b/g)].map((match) => match[0]);
    for (const id of ids) {
      selectedIds.push(id);
      if (!APPROVED_APPROVAL_FORM_LAYOUT_TEMPLATE_IDS.has(id)) {
        findings.push({
          level: "error",
          code: "APP_PLAN_APPROVAL_FORM_LAYOUT_TEMPLATE_UNKNOWN",
          message: "Approval Form Layout Template Selection must use an approved Approval Form Layouts v1.1 template ID.",
          templateId: id,
        });
      }
    }
    if (/\bsubmission\b/i.test(row) && !row.includes("approval_form_layout_submission_v1_1")) {
      findings.push({
        level: "error",
        code: "APP_PLAN_APPROVAL_FORM_LAYOUT_SUBMISSION_TEMPLATE_MISMATCH",
        message: "Submission form pages must select approval_form_layout_submission_v1_1.",
        row,
      });
    }
    if (/\btask\b/i.test(row) && !row.includes("approval_form_layout_task_v1_1")) {
      findings.push({
        level: "error",
        code: "APP_PLAN_APPROVAL_FORM_LAYOUT_TASK_TEMPLATE_MISMATCH",
        message: "Task form pages must select approval_form_layout_task_v1_1.",
        row,
      });
    }
  }
  if (selectedIds.length === 0) {
    findings.push({
      level: "error",
      code: "APP_PLAN_APPROVAL_FORM_LAYOUT_TEMPLATE_SELECTION_REQUIRED",
      message: "Approval Forms Plan must select approved Approval Form Layouts v1.1 templates for generated submission and task pages.",
    });
  }
}

export function validate(file) {
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
  validateControlActionPlanning(text, findings);
  validateApprovalFormLayoutTemplateSelection(text, findings);
  validateDataListFormLayoutTemplateSelection(text, findings);
  validateDataListFormFieldsTemplateSelection(text, findings);
  validateDashboardPagesPlan(text, findings);
  validateRequiredTableSchemas(extractSections(text), findings);

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

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main();
