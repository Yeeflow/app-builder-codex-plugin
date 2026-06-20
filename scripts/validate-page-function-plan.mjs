#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const SUPPORTED_CONTROLS = new Set([
  "Alert",
  "Button",
  "Collection",
  "Container",
  "Data Filter",
  "Data table",
  "Document embed",
  "Dynamic field",
  "Dynamic file",
  "Dynamic image",
  "Dynamic user",
  "Flex Grid",
  "Gauge",
  "Heading",
  "Horizontal timeline",
  "Kanban",
  "Line chart",
  "Pie chart",
  "Pivot table",
  "Progress",
  "QR Code",
  "Sub List",
  "Summary",
  "Tabs",
  "Text",
  "Vertical timeline",
]);

const DOCUMENTED_DASHBOARD_PAGE_PATTERNS = new Set([
  "standard_dashboard_page_shell",
  "standard_dashboard_shell",
  "documented_standard_dashboard_page_shell",
  "three_column_workspace_shell",
]);

const TEMPLATE_LIBRARY_PATHS = [
  path.join(process.cwd(), "docs/templates/yeeflow-ui-section-template-library.normalized.json"),
  path.join(process.cwd(), "dist/yeeflow-app-builder-plugin/docs/templates/yeeflow-ui-section-template-library.normalized.json"),
];

const ACTION_REQUIRED_TEMPLATES = new Set([
  "dashboard_header_action_bar",
  "kanban_status_board",
  "collection_card_board",
  "quick_links_icon_list",
]);

const KPI_SUMMARY_TEMPLATES = new Set(["kpi_card_row", "progress_summary_card"]);
const RICH_TABLE_TEMPLATES = new Set(["data_table_section", "collection_card_board", "kanban_status_board"]);
const COLLECTION_GRID_TABLE_TEMPLATES = new Set(["collection_card_board"]);
const FILTER_ACTION_TEMPLATES = new Set(["dashboard_header_action_bar", "quick_links_icon_list"]);
const HIGH_FIDELITY_DASHBOARD = /\b(marketing event|event portfolio|high-quality|high quality|high-fidelity|runtime fidelity|portfolio\/status|portfolio status|operational table|rich table|rich card|rich grid-table|grid-table fidelity)\b/i;
const TRUEISH = /\b(true|yes|required|must|enabled|planned|specified|semantic|real|bound|runtime|format|compact|fixed|badge|progress|avatar|person|metadata|nv_label)\b/i;

const TEMPLATE_PURPOSE_RULES = [
  { templateId: "kpi_card_row", pattern: /\b(kpi|metric|summary|count|total|aggregate|sla|risk total|workload)\b/i },
  { templateId: "progress_summary_card", pattern: /\b(progress|completion|score|percentage|percent|risk score)\b/i },
  { templateId: "business_alert_card", pattern: /\b(alert|warning|risk|expiry|expired|compliance|blocking|exception)\b/i },
  { templateId: "data_table_section", pattern: /\b(table|grid|record list|list|queue|search|scan|register|work queue)\b/i },
  { templateId: "kanban_status_board", pattern: /\b(kanban|status|board|lane|triage|queue|stage|workflow)\b/i },
  { templateId: "collection_card_board", pattern: /\b(card|collection|review queue|queue|related record|grouped list|browse)\b/i },
  { templateId: "quick_links_icon_list", pattern: /\b(quick link|shortcut|navigation|launch|open|action)\b/i },
  { templateId: "recent_activity_timeline", pattern: /\b(activity|history|timeline|milestone|event|audit|chronological)\b/i },
  { templateId: "dashboard_header_action_bar", pattern: /\b(header|title|subtitle|action bar|page action|entry point)\b/i },
  { templateId: "three_column_workspace_shell", pattern: /\b(three column|workspace|inbox|triage|service desk|crm|renewal|review queue|task center|list-detail|left|right|main)\b/i },
];

const DEFERRED = /\b(runtime-proof-required|export-learning-required|deferred)\b/i;
const DASHBOARD_STYLE_REGION = /\b(Collection|Data analytics|Analytics|Summary|KPI|Data table|Kanban|Timeline|audit|dashboard|chart)\b/i;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-page-function-plan.mjs <page-function-plan.md|json> [--json]",
    "",
    "Validates Page Function Plan structure and page-level guardrails. No API calls are made.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function normalizeName(value) {
  return safeString(value).trim().toLowerCase();
}

function parseMaybeJson(text) {
  try {
    return JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

function readPlan(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const parsed = parseMaybeJson(text);
  if (parsed) return { type: "json", text, plan: parsed };
  return { type: "markdown", text, plan: null };
}

function readDashboardTemplateLibrary() {
  for (const file of TEMPLATE_LIBRARY_PATHS) {
    if (!fs.existsSync(file)) continue;
    const parsed = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
    const templates = asArray(parsed.templates);
    const byId = new Map();
    for (const template of templates) {
      const id = safeString(template.templateId || template.id).trim();
      if (id) byId.set(id, template);
    }
    return byId;
  }
  return new Map();
}

function hasTextValue(value) {
  if (Array.isArray(value)) return value.some((item) => safeString(item).trim());
  return Boolean(safeString(value).trim());
}

function flattenText(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(flattenText).join(" ");
  if (typeof value === "object") return Object.values(value).map(flattenText).join(" ");
  return "";
}

function hasStructuredIntent(value, pattern = TRUEISH) {
  return pattern.test(flattenText(value));
}

function hasFidelityReference(dashboard, entry) {
  return hasTextValue(entry.marketingEventFidelityReference)
    || hasTextValue(entry.eventPortfolioFidelityReference)
    || hasTextValue(entry.fidelityReference)
    || hasTextValue(dashboard.marketingEventFidelityReference)
    || hasTextValue(dashboard.eventPortfolioFidelityReference)
    || hasTextValue(dashboard.dashboardFidelityReference);
}

function dashboardRequestsHighFidelity(dashboard, entry) {
  const text = flattenText({
    dashboardFidelityProfile: dashboard.dashboardFidelityProfile,
    qualityProfile: dashboard.qualityProfile,
    qualityClaim: dashboard.qualityClaim,
    eventPortfolioStyle: dashboard.eventPortfolioStyle,
    highQualityUi: dashboard.highQualityUi,
    marketingEventFidelityReference: dashboard.marketingEventFidelityReference,
    eventPortfolioFidelityReference: dashboard.eventPortfolioFidelityReference,
    pagePurpose: dashboard.pagePurpose,
    businessTaskSolved: dashboard.businessTaskSolved,
    primaryBusinessWorkflow: dashboard.primaryBusinessWorkflow,
    sectionFidelityProfile: entry.fidelityProfile,
    sectionQualityProfile: entry.qualityProfile,
    sectionQualityClaim: entry.qualityClaim,
    sectionEventPortfolioStyle: entry.eventPortfolioStyle,
    sectionBusinessPurpose: entry.businessPurpose,
    sectionTreatment: entry.richTableTreatmentRequirements,
    sectionFidelityReference: entry.marketingEventFidelityReference || entry.eventPortfolioFidelityReference || entry.fidelityReference,
  });
  return HIGH_FIDELITY_DASHBOARD.test(text);
}

function entryHasFilters(entry) {
  return hasTextValue(entry.filters) || hasTextValue(entry.dataFilterRequirements);
}

function entryHasActions(entry) {
  return hasTextValue(entry.actions) || hasTextValue(entry.actionMetadataRequirements);
}

function validateDashboardFidelityRequirements(dashboard, entry, templateId, findings) {
  const highFidelity = dashboardRequestsHighFidelity(dashboard, entry);
  if (!highFidelity) return;

  const section = entry.sectionName || entry.regionName;
  if (!hasFidelityReference(dashboard, entry)) {
    findings.push({
      level: "error",
      code: "PAGE_FUNCTION_DASHBOARD_FIDELITY_REFERENCE_MISSING",
      dashboard: dashboard.name,
      section,
      templateId,
      message: "High-quality/Event Portfolio-style Dashboard sections must reference plugin-contained Marketing Event/Event Portfolio fidelity lessons or standards.",
    });
  }

  if (!hasStructuredIntent(entry.runtimeProofBoundary || dashboard.runtimeProofBoundary, /\b(runtime proof|runtime-proof|screenshot|browser|install is not proof|boundary|required|deferred|evidence)\b/i)) {
    findings.push({
      level: "error",
      code: "PAGE_FUNCTION_DASHBOARD_RUNTIME_PROOF_BOUNDARY_MISSING",
      dashboard: dashboard.name,
      section,
      templateId,
      message: "High-quality/Event Portfolio-style Dashboard sections must declare the runtime proof boundary.",
    });
  }

  if (!hasStructuredIntent(entry.designerTraceabilityRequirements || entry.nvLabelRequirements || dashboard.designerTraceabilityRequirements, /\b(nv_label|semantic|designer|traceability|label)\b/i)) {
    findings.push({
      level: "error",
      code: "PAGE_FUNCTION_DASHBOARD_NV_LABEL_REQUIREMENTS_MISSING",
      dashboard: dashboard.name,
      section,
      templateId,
      message: "High-quality/Event Portfolio-style Dashboard sections must declare semantic nv_label/designer traceability requirements.",
    });
  }

  if (KPI_SUMMARY_TEMPLATES.has(templateId)) {
    if (!hasStructuredIntent(entry.kpiSummaryBindingRequirements, /\b(summary|pivot|temp|variable|source|field|metric|filter|hidden|binding|report|list)\b/i)) {
      findings.push({
        level: "error",
        code: "PAGE_FUNCTION_DASHBOARD_KPI_SUMMARY_BINDING_MISSING",
        dashboard: dashboard.name,
        section,
        templateId,
        message: "High-quality KPI/Summary sections must declare Summary binding, source, fields/metrics, filters, and visible KPI binding requirements.",
      });
    }
    if (!hasStructuredIntent(entry.kpiFormattingRequirements, /\b(formatNumber|compact|K\/M\/B|fixed|decimal|currency|percent|raw value|format)\b/i)) {
      findings.push({
        level: "error",
        code: "PAGE_FUNCTION_DASHBOARD_KPI_FORMATTING_MISSING",
        dashboard: dashboard.name,
        section,
        templateId,
        message: "High-quality KPI/Summary sections must declare KPI formatting requirements.",
      });
    }
  }

  if (entryHasFilters(entry) && !hasStructuredIntent(entry.dataFilterRequirements, /\b(data filter|filter variable|consumer|summary|collection|table|list|dropdown|target|runtime)\b/i)) {
    findings.push({
      level: "error",
      code: "PAGE_FUNCTION_DASHBOARD_DATA_FILTER_REQUIREMENTS_MISSING",
      dashboard: dashboard.name,
      section,
      templateId,
      message: "High-quality filtered Dashboard sections must declare real Data Filter controls, filter variables, and target consumers.",
    });
  }

  if (entryHasActions(entry) && !hasStructuredIntent(entry.actionMetadataRequirements, /\b(action metadata|actionType|target|list|open|detail|add|row context|metadata|Yeeflow)\b/i)) {
    findings.push({
      level: "error",
      code: "PAGE_FUNCTION_DASHBOARD_ACTION_METADATA_MISSING",
      dashboard: dashboard.name,
      section,
      templateId,
      message: "High-quality Dashboard actions must declare real Yeeflow action metadata instead of only action-looking visuals.",
    });
  }

  if (RICH_TABLE_TEMPLATES.has(templateId) && !hasStructuredIntent(entry.richTableTreatmentRequirements, /\b(badge|progress|avatar|person|dynamic user|header|row density|rich|status)\b/i)) {
    findings.push({
      level: "error",
      code: "PAGE_FUNCTION_DASHBOARD_RICH_TABLE_TREATMENT_MISSING",
      dashboard: dashboard.name,
      section,
      templateId,
      message: "Event Portfolio-style status/operational tables must declare rich table/card treatment: badges, progress, person/avatar treatment, header hierarchy, and row density where applicable.",
    });
  }

  const asksCollectionGridTable = COLLECTION_GRID_TABLE_TEMPLATES.has(templateId)
    || /\b(collection grid-table|grid-table|portfolio table|operational table)\b/i.test(flattenText(entry));
  if (asksCollectionGridTable && !hasStructuredIntent(entry.collectionGridTableRequirements, /\b(source|fields|row context|detail|open|action|binding|collection|grid-table)\b/i)) {
    findings.push({
      level: "error",
      code: "PAGE_FUNCTION_DASHBOARD_COLLECTION_GRID_TABLE_REQUIREMENTS_MISSING",
      dashboard: dashboard.name,
      section,
      templateId,
      message: "Collection grid-table style requires source list, fields, row context, and detail/open actions.",
    });
  }
}

function markdownFindings(text) {
  const findings = [];
  const required = [
    [/^#\s+.+?\s+-\s+Page Function Plan\s*$/m, "PAGE_FUNCTION_PLAN_TITLE_MISSING"],
    [/## 1\. Plan Status/i, "PAGE_FUNCTION_PLAN_STATUS_SECTION_MISSING"],
    [/## 2\. App Plan Traceability Summary/i, "PAGE_FUNCTION_PLAN_TRACEABILITY_SECTION_MISSING"],
    [/## 3\. Yeeflow Application Layout Guidance/i, "PAGE_FUNCTION_PLAN_LAYOUT_SECTION_MISSING"],
    [/## 4\. Dashboard Page Functions/i, "PAGE_FUNCTION_PLAN_DASHBOARD_SECTION_MISSING"],
    [/## 5\. Approval Form Page Functions/i, "PAGE_FUNCTION_PLAN_APPROVAL_SECTION_MISSING"],
    [/## 6\. Data List and Document Library Form Page Functions/i, "PAGE_FUNCTION_PLAN_DATA_FORM_SECTION_MISSING"],
    [/## 7\. Full-Page and Responsive Requirements/i, "PAGE_FUNCTION_PLAN_RESPONSIVE_SECTION_MISSING"],
    [/Form Reports are not required/i, "PAGE_FUNCTION_PLAN_FORM_REPORT_EXCLUSION_MISSING"],
    [/Save as draft[\s\S]*Submit/i, "PAGE_FUNCTION_PLAN_APPROVAL_SUBMIT_BUTTONS_MISSING"],
    [/New\/Edit forms should normally include only editable fields/i, "PAGE_FUNCTION_PLAN_NEW_EDIT_RULE_MISSING"],
    [/source list\/library, parent\/current-item binding, display fields, filters, actions, and opening behavior/i, "PAGE_FUNCTION_PLAN_RELATED_REGION_RULE_MISSING"],
    [/dashboardPagePattern/i, "PAGE_FUNCTION_PLAN_DASHBOARD_PAGE_PATTERN_FIELD_MISSING"],
    [/dashboardSectionTemplates\[\]/i, "PAGE_FUNCTION_PLAN_DASHBOARD_SECTION_TEMPLATES_FIELD_MISSING"],
    [/templateId[\s\S]*Region \/ Section[\s\S]*Why This Template Fits/i, "PAGE_FUNCTION_PLAN_DASHBOARD_TEMPLATE_SELECTION_TABLE_MISSING"],
    [/Template selection is part of the Page Function Plan implementation contract/i, "PAGE_FUNCTION_PLAN_DASHBOARD_TEMPLATE_CONTRACT_MISSING"],
    [/Dashboard Fidelity Requirements/i, "PAGE_FUNCTION_PLAN_DASHBOARD_FIDELITY_SECTION_MISSING"],
    [/Marketing Event \/ Event Portfolio Fidelity Reference/i, "PAGE_FUNCTION_PLAN_DASHBOARD_FIDELITY_REFERENCE_FIELD_MISSING"],
    [/KPI \/ Summary Binding Requirements/i, "PAGE_FUNCTION_PLAN_DASHBOARD_KPI_BINDING_FIELD_MISSING"],
    [/Data Filter Requirements/i, "PAGE_FUNCTION_PLAN_DASHBOARD_FILTER_FIELD_MISSING"],
    [/Collection Grid-Table Requirements/i, "PAGE_FUNCTION_PLAN_DASHBOARD_COLLECTION_GRID_FIELD_MISSING"],
    [/Badge \/ Progress \/ Avatar \/ Person Treatment/i, "PAGE_FUNCTION_PLAN_DASHBOARD_RICH_TREATMENT_FIELD_MISSING"],
    [/Action Metadata Requirements/i, "PAGE_FUNCTION_PLAN_DASHBOARD_ACTION_METADATA_FIELD_MISSING"],
    [/KPI Formatting Requirements/i, "PAGE_FUNCTION_PLAN_DASHBOARD_KPI_FORMATTING_FIELD_MISSING"],
    [/`nv_label` \/ Designer Traceability/i, "PAGE_FUNCTION_PLAN_DASHBOARD_NV_LABEL_FIELD_MISSING"],
    [/Runtime Proof Boundary/i, "PAGE_FUNCTION_PLAN_DASHBOARD_RUNTIME_PROOF_FIELD_MISSING"],
  ];
  for (const [pattern, code] of required) {
    if (!pattern.test(text)) {
      findings.push({ level: "error", code, message: `Missing required Page Function Plan template text for ${code}.` });
    }
  }
  return findings;
}

function allControls(plan) {
  const controls = [];
  for (const dashboard of asArray(plan.dashboards)) {
    for (const region of asArray(dashboard.regions)) {
      controls.push({ control: region.controlType, context: `dashboard:${dashboard.name}:${region.name}` });
    }
  }
  for (const approval of asArray(plan.approvalForms)) {
    for (const field of asArray(approval.submissionForm?.fields)) controls.push({ control: field.controlType, context: `approval:${approval.name}:submission:${field.name}` });
    for (const task of asArray(approval.taskForms)) {
      for (const field of asArray(task.fields)) controls.push({ control: field.controlType, context: `approval:${approval.name}:task:${task.name}:${field.name}` });
    }
    for (const page of asArray(approval.printPages)) {
      for (const item of asArray(page.content)) controls.push({ control: item.controlType, context: `approval:${approval.name}:print:${page.name}:${item.name}` });
    }
  }
  for (const resource of [...asArray(plan.dataListForms), ...asArray(plan.documentLibraryForms)]) {
    for (const form of asArray(resource.forms)) {
      for (const field of asArray(form.fields)) controls.push({ control: field.controlType, context: `form:${resource.resourceName}:${form.name}:${field.name}` });
      for (const region of asArray(form.relatedRegions)) controls.push({ control: region.regionType, context: `form:${resource.resourceName}:${form.name}:related:${region.name}` });
    }
  }
  return controls;
}

function validateSupportedControls(plan, findings) {
  for (const item of allControls(plan)) {
    const control = safeString(item.control).trim();
    if (!control || DEFERRED.test(control)) continue;
    if (!SUPPORTED_CONTROLS.has(control)) {
      findings.push({
        level: "error",
        code: "PAGE_FUNCTION_UNSUPPORTED_CONTROL",
        context: item.context,
        value: control,
        message: `Unsupported Page Function Plan control "${control}" is not in the plugin-supported control allowlist or marked runtime-proof/deferred.`,
      });
    }
  }
}

function validateDashboardTemplateSelection(plan, findings) {
  const templateLibrary = readDashboardTemplateLibrary();
  const dashboardTemplateIds = new Set(
    [...templateLibrary.values()]
      .filter((template) => normalizeName(template.category) === "dashboard")
      .map((template) => safeString(template.templateId || template.id).trim()),
  );

  for (const dashboard of asArray(plan.dashboards)) {
    const pagePattern = safeString(dashboard.dashboardPagePattern).trim();
    if (!pagePattern) {
      const prose = safeString(dashboard.pagePurpose || dashboard.primaryBusinessWorkflow || dashboard.notes || dashboard.description);
      findings.push({
        level: "error",
        code: /template|pattern|shell/i.test(prose)
          ? "PAGE_FUNCTION_DASHBOARD_TEMPLATE_PROSE_ONLY"
          : "PAGE_FUNCTION_DASHBOARD_PAGE_PATTERN_MISSING",
        dashboard: dashboard.name,
        message: "Dashboard pages must declare structured dashboardPagePattern; prose-only template mentions do not satisfy the gate.",
      });
    } else if (!DOCUMENTED_DASHBOARD_PAGE_PATTERNS.has(pagePattern) && !dashboardTemplateIds.has(pagePattern)) {
      findings.push({
        level: "error",
        code: "PAGE_FUNCTION_DASHBOARD_PAGE_PATTERN_UNKNOWN",
        dashboard: dashboard.name,
        value: pagePattern,
        message: "Dashboard page pattern must be a documented dashboard shell/pattern from plugin-contained standards or templates.",
      });
    }

    const sectionTemplates = asArray(dashboard.dashboardSectionTemplates);
    if (!sectionTemplates.length) {
      findings.push({
        level: "error",
        code: "PAGE_FUNCTION_DASHBOARD_SECTION_TEMPLATES_MISSING",
        dashboard: dashboard.name,
        message: "Dashboard pages must declare structured dashboardSectionTemplates[].",
      });
      if (/\b(kpi_card_row|data_table_section|kanban_status_board|collection_card_board|quick_links_icon_list|business_alert_card|recent_activity_timeline|three_column_workspace_shell)\b/i.test(JSON.stringify(dashboard))) {
        findings.push({
          level: "error",
          code: "PAGE_FUNCTION_DASHBOARD_TEMPLATE_PROSE_ONLY",
          dashboard: dashboard.name,
          message: "Dashboard template selection mentioned outside structured dashboardSectionTemplates[] is not enough.",
        });
      }
      continue;
    }

    const hasThreeColumn = sectionTemplates.some((entry) => safeString(entry.templateId).trim() === "three_column_workspace_shell")
      || pagePattern === "three_column_workspace_shell";

    for (const entry of sectionTemplates) {
      const templateId = safeString(entry.templateId).trim();
      if (!templateId) {
        findings.push({ level: "error", code: "PAGE_FUNCTION_DASHBOARD_TEMPLATE_ID_MISSING", dashboard: dashboard.name, section: entry.sectionName || entry.regionName, message: "Each dashboardSectionTemplates[] entry must include templateId." });
        continue;
      }
      const template = templateLibrary.get(templateId);
      if (!template || !dashboardTemplateIds.has(templateId)) {
        findings.push({
          level: "error",
          code: /template|layout|pattern|section/i.test(templateId)
            ? "PAGE_FUNCTION_DASHBOARD_TEMPLATE_GENERIC_OR_UNKNOWN"
            : "PAGE_FUNCTION_DASHBOARD_TEMPLATE_UNKNOWN",
          dashboard: dashboard.name,
          section: entry.sectionName || entry.regionName,
          templateId,
          message: "Dashboard section templateId must exist as a Dashboard template in the plugin-contained template library.",
        });
        continue;
      }

      const purposeText = [
        entry.regionName,
        entry.sectionName,
        entry.businessPurpose,
        entry.purpose,
        entry.whyTemplateFits,
      ].map(safeString).join(" ");
      const purposeRule = TEMPLATE_PURPOSE_RULES.find((rule) => rule.templateId === templateId);
      if (purposeRule && !purposeRule.pattern.test(purposeText)) {
        findings.push({
          level: "error",
          code: "PAGE_FUNCTION_DASHBOARD_TEMPLATE_PURPOSE_INCOMPATIBLE",
          dashboard: dashboard.name,
          section: entry.sectionName || entry.regionName,
          templateId,
          message: "Selected dashboard template does not match the stated region purpose.",
        });
      }

      if (!hasTextValue(entry.source) && !hasTextValue(entry.sourceList) && !hasTextValue(entry.sourceResource) && !hasTextValue(entry.sourceListOrResource)) {
        findings.push({
          level: "error",
          code: "PAGE_FUNCTION_DASHBOARD_TEMPLATE_SOURCE_MISSING",
          dashboard: dashboard.name,
          section: entry.sectionName || entry.regionName,
          templateId,
          message: "Each dashboardSectionTemplates[] entry must include source list/report/resource.",
        });
      }
      if (!hasTextValue(entry.displayedFields) && !hasTextValue(entry.fields)) {
        findings.push({
          level: "error",
          code: "PAGE_FUNCTION_DASHBOARD_TEMPLATE_FIELDS_MISSING",
          dashboard: dashboard.name,
          section: entry.sectionName || entry.regionName,
          templateId,
          message: "Each dashboardSectionTemplates[] entry must include displayed fields.",
        });
      }
      if (ACTION_REQUIRED_TEMPLATES.has(templateId) && !hasTextValue(entry.actions) && !hasTextValue(entry.noActionReason) && !hasTextValue(entry.fallback)) {
        findings.push({
          level: "error",
          code: "PAGE_FUNCTION_DASHBOARD_TEMPLATE_ACTIONS_MISSING",
          dashboard: dashboard.name,
          section: entry.sectionName || entry.regionName,
          templateId,
          message: "Selected dashboard template requires actions, action bindings, or an explicit no-action/fallback reason.",
        });
      }
      if (!hasTextValue(entry.requiredControls)) {
        findings.push({
          level: "error",
          code: "PAGE_FUNCTION_DASHBOARD_TEMPLATE_REQUIRED_CONTROLS_MISSING",
          dashboard: dashboard.name,
          section: entry.sectionName || entry.regionName,
          templateId,
          message: "Each dashboardSectionTemplates[] entry must list required controls consumed by generation.",
        });
      }
      if (!hasTextValue(entry.proofStatus) && !hasTextValue(entry.fallback)) {
        findings.push({
          level: "error",
          code: "PAGE_FUNCTION_DASHBOARD_TEMPLATE_PROOF_STATUS_MISSING",
          dashboard: dashboard.name,
          section: entry.sectionName || entry.regionName,
          templateId,
          message: "Each dashboardSectionTemplates[] entry must include proof status or fallback.",
        });
      }
      if (!hasTextValue(entry.whyTemplateFits)) {
        findings.push({
          level: "error",
          code: "PAGE_FUNCTION_DASHBOARD_TEMPLATE_FIT_REASON_MISSING",
          dashboard: dashboard.name,
          section: entry.sectionName || entry.regionName,
          templateId,
          message: "Each selected dashboard template must explain why it fits the page purpose.",
        });
      }
      validateDashboardFidelityRequirements(dashboard, entry, templateId, findings);
    }

    if (hasThreeColumn) {
      const panels = dashboard.threeColumnPanels || {};
      for (const [panel, code] of [
        ["left", "PAGE_FUNCTION_THREE_COLUMN_LEFT_PANEL_MISSING"],
        ["main", "PAGE_FUNCTION_THREE_COLUMN_MAIN_PANEL_MISSING"],
        ["right", "PAGE_FUNCTION_THREE_COLUMN_RIGHT_PANEL_MISSING"],
      ]) {
        const value = panels[panel];
        const meaningful = typeof value === "object"
          ? hasTextValue(value.purpose) && hasTextValue(value.source) && hasTextValue(value.content)
          : hasTextValue(value);
        if (!meaningful) {
          findings.push({
            level: "error",
            code,
            dashboard: dashboard.name,
            message: "three_column_workspace_shell requires meaningful left/main/right panel purpose, source, and content.",
          });
        }
      }
      if (!/\b(inbox|triage|review|queue|workspace|task center|service desk|crm|renewal|list-detail)\b/i.test(`${dashboard.pagePurpose || ""} ${dashboard.primaryBusinessWorkflow || ""} ${dashboard.businessTaskSolved || ""}`)) {
        findings.push({
          level: "error",
          code: "PAGE_FUNCTION_THREE_COLUMN_SIMPLE_DASHBOARD_INVALID",
          dashboard: dashboard.name,
          message: "three_column_workspace_shell must not be selected for a simple dashboard without meaningful workspace/list-detail purpose.",
        });
      }
    }
  }
}

function validateApprovalForms(plan, findings) {
  for (const approval of asArray(plan.approvalForms)) {
    if (!approval.submissionForm) {
      findings.push({ level: "error", code: "PAGE_FUNCTION_APPROVAL_SUBMISSION_MISSING", approvalForm: approval.name, message: "Approval form is missing a submission form page function." });
      continue;
    }
    const actions = asArray(approval.submissionForm.actions).map(normalizeName);
    for (const requiredAction of ["save as draft", "submit"]) {
      if (!actions.includes(requiredAction)) {
        findings.push({
          level: "error",
          code: "PAGE_FUNCTION_APPROVAL_SUBMISSION_REQUIRED_BUTTON_MISSING",
          approvalForm: approval.name,
          action: requiredAction,
          message: "Approval submission forms must include Save as draft and Submit.",
        });
      }
    }
    const unrelated = asArray(approval.submissionForm.regions).find((region) => DASHBOARD_STYLE_REGION.test(`${region.name || ""} ${region.regionType || ""}`) && !region.explicitlyPlanned);
    if (unrelated) {
      findings.push({
        level: "error",
        code: "PAGE_FUNCTION_APPROVAL_SUBMISSION_UNRELATED_REGION",
        approvalForm: approval.name,
        region: unrelated.name,
        message: "Approval submission forms must not include unrelated dashboard/audit/logic-only regions unless explicitly required by the App Plan.",
      });
    }
    for (const task of asArray(approval.taskForms)) {
      if (!asArray(task.actions).length) {
        findings.push({ level: "error", code: "PAGE_FUNCTION_APPROVAL_TASK_ACTIONS_MISSING", approvalForm: approval.name, taskForm: task.name, message: "Task forms must define buttons/actions matching the task type." });
      }
      if (!safeString(task.differencesFromSubmission).trim()) {
        findings.push({ level: "error", code: "PAGE_FUNCTION_APPROVAL_TASK_DIFFERENCE_UNEXPLAINED", approvalForm: approval.name, taskForm: task.name, message: "Task form differences from the submission form must be explicit." });
      }
    }
  }
}

function validateDataForms(plan, findings) {
  for (const resource of [...asArray(plan.dataListForms), ...asArray(plan.documentLibraryForms)]) {
    for (const form of asArray(resource.forms)) {
      const formType = normalizeName(form.type);
      const relatedRegions = asArray(form.relatedRegions);
      if (/^(new|edit|add|add\/edit|new\/edit)$/.test(formType) && relatedRegions.length) {
        const bad = relatedRegions.find((region) => DASHBOARD_STYLE_REGION.test(`${region.name || ""} ${region.regionType || ""}`) && !region.explicitlyPlannedAndJustified);
        if (bad) {
          findings.push({
            level: "error",
            code: "PAGE_FUNCTION_NEW_EDIT_UNRELATED_REGION",
            resource: resource.resourceName,
            form: form.name,
            region: bad.name,
            message: "New/Edit forms must not include unrelated Collection/Data analytics/audit/dashboard regions unless explicitly planned and justified.",
          });
        }
      }
      if (/^(view|detail|custom)$/.test(formType)) {
        for (const region of relatedRegions) {
          for (const [key, code] of [
            ["source", "PAGE_FUNCTION_VIEW_RELATED_REGION_SOURCE_MISSING"],
            ["binding", "PAGE_FUNCTION_VIEW_RELATED_REGION_BINDING_MISSING"],
            ["fields", "PAGE_FUNCTION_VIEW_RELATED_REGION_FIELDS_MISSING"],
            ["actions", "PAGE_FUNCTION_VIEW_RELATED_REGION_ACTIONS_MISSING"],
            ["filters", "PAGE_FUNCTION_VIEW_RELATED_REGION_FILTERS_MISSING"],
            ["openingBehavior", "PAGE_FUNCTION_VIEW_RELATED_REGION_OPENING_MISSING"],
          ]) {
            const value = region[key];
            const missing = Array.isArray(value) ? value.length === 0 : !safeString(value).trim();
            if (missing) {
              findings.push({
                level: "error",
                code,
                resource: resource.resourceName,
                form: form.name,
                region: region.name,
                message: "View/detail related regions must specify source, binding, fields, filters, actions, and opening behavior.",
              });
            }
          }
        }
      }
    }
  }
}

function validateResponsive(plan, findings) {
  const pages = [
    ...asArray(plan.dashboards).map((page) => ({ type: "dashboard", name: page.name, value: page })),
    ...asArray(plan.approvalForms).flatMap((approval) => [
      { type: "approval-submission", name: `${approval.name}:submission`, value: approval.submissionForm || {} },
      ...asArray(approval.taskForms).map((task) => ({ type: "approval-task", name: `${approval.name}:${task.name}`, value: task })),
      ...asArray(approval.printPages).map((page) => ({ type: "approval-print", name: `${approval.name}:${page.name}`, value: page })),
    ]),
    ...[...asArray(plan.dataListForms), ...asArray(plan.documentLibraryForms)].flatMap((resource) =>
      asArray(resource.forms).map((form) => ({ type: "data-form", name: `${resource.resourceName}:${form.name}`, value: form })),
    ),
  ];
  for (const page of pages) {
    if (!safeString(page.value.mobileBehavior).trim()) {
      findings.push({ level: "error", code: "PAGE_FUNCTION_MOBILE_BEHAVIOR_MISSING", pageType: page.type, page: page.name, message: "Every UI page must define mobile behavior." });
    }
    if (!safeString(page.value.desktopBehavior).trim() && !safeString(page.value.desktopLayout).trim()) {
      findings.push({ level: "error", code: "PAGE_FUNCTION_DESKTOP_BEHAVIOR_MISSING", pageType: page.type, page: page.name, message: "Every UI page must define desktop layout behavior." });
    }
  }
}

function validateJson(plan) {
  const findings = [];
  if (!safeString(plan.applicationName).trim()) findings.push({ level: "error", code: "PAGE_FUNCTION_APPLICATION_NAME_MISSING", message: "applicationName is required." });
  if (!safeString(plan.applicationLayout).trim()) findings.push({ level: "error", code: "PAGE_FUNCTION_APPLICATION_LAYOUT_MISSING", message: "applicationLayout is required." });
  validateDashboardTemplateSelection(plan, findings);
  validateSupportedControls(plan, findings);
  validateApprovalForms(plan, findings);
  validateDataForms(plan, findings);
  validateResponsive(plan, findings);
  return findings;
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) usage(0);
  const json = process.argv.includes("--json");
  const file = process.argv.slice(2).find((arg) => arg !== "--json");
  if (!file) usage();
  if (!fs.existsSync(file)) {
    console.log(JSON.stringify({ status: "fail", file: path.resolve(file), errors: 1, findings: [{ level: "error", code: "PAGE_FUNCTION_PLAN_FILE_MISSING", message: "Page Function Plan file does not exist." }] }, null, 2));
    process.exit(1);
  }
  const input = readPlan(file);
  const findings = input.type === "json" ? validateJson(input.plan) : markdownFindings(input.text);
  const errors = findings.filter((finding) => finding.level === "error").length;
  const report = { status: errors ? "fail" : "pass", file: path.resolve(file), inputType: input.type, errors, warnings: 0, findings };
  if (json) console.log(JSON.stringify(report, null, 2));
  else if (report.status === "pass") console.log(`page function plan validation passed: ${file}`);
  else {
    console.error(`page function plan validation failed: ${file}`);
    for (const finding of findings) console.error(`${finding.code}: ${finding.message}`);
  }
  if (errors) process.exitCode = 1;
}

main();
