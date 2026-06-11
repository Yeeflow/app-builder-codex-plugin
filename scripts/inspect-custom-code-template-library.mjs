#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const EXPECTED_TEMPLATES = [
  "activity-timeline",
  "approval-decision-panel",
  "approval-timeline",
  "checklist-compliance-block",
  "dependent-selector",
  "distribution-chart-module",
  "exception-alert-panel",
  "hierarchical-selector",
  "kpi-card-set",
  "multi-entry-tag-input",
  "related-record-summary-grid",
  "smart-lookup-picker",
  "trend-chart-module",
];

const FUNCTIONAL_CATEGORIES = {
  "Dashboard / analytics": [
    "kpi-card-set",
    "distribution-chart-module",
    "trend-chart-module",
    "exception-alert-panel",
    "related-record-summary-grid",
    "activity-timeline",
  ],
  "Approval / workflow experience": [
    "approval-decision-panel",
    "approval-timeline",
  ],
  "Data entry / picker / selection": [
    "smart-lookup-picker",
    "dependent-selector",
    "hierarchical-selector",
    "multi-entry-tag-input",
    "checklist-compliance-block",
  ],
};

const TEMPLATE_OVERRIDES = {
  "activity-timeline": {
    purpose: "Show record events, changes, comments, and operational actions in chronological order.",
    supportedContexts: { dashboard: true, approvalForm: true, dataListForm: true, publicForm: false },
    proof: "Inventory-only. Runtime rendering is not proven for this template.",
    readOnly: true,
    interactive: false,
    dataSource: "Activity / timeline event list with relation, date, actor, title, detail, and status/type fields.",
    output: "Display-only; no writeback targets.",
    recommendedUseCases: ["recent request activity", "case history", "audit-style event visibility"],
  },
  "approval-decision-panel": {
    purpose: "Capture or display reviewer decision and comments in an approval context.",
    supportedContexts: { dashboard: false, approvalForm: true, dataListForm: false, publicForm: false },
    proof: "Inventory-only. Needs focused approval-task runtime proof before relying on decision writeback.",
    readOnly: false,
    interactive: true,
    dataSource: "Approval form variables/fields for decision and comment values.",
    output: "Writes decision and comment to configured form variables/fields.",
    recommendedUseCases: ["manager review", "compliance review", "approval reason capture"],
  },
  "approval-timeline": {
    purpose: "Show approval history, actors, timestamps, decisions, and comments.",
    supportedContexts: { dashboard: false, approvalForm: true, dataListForm: true, publicForm: false },
    proof: "Inventory-only. Runtime rendering against generated approval-history records is not proven.",
    readOnly: true,
    interactive: false,
    dataSource: "Approval history / timeline list filtered by current request id.",
    output: "Display-only; no writeback targets.",
    recommendedUseCases: ["approval history on task pages", "request detail audit trail"],
  },
  "checklist-compliance-block": {
    purpose: "Render compliance checklist items and save checked state.",
    supportedContexts: { dashboard: false, approvalForm: true, dataListForm: true, publicForm: false },
    proof: "Inventory-only. Needs runtime proof for checklist writeback in each form context.",
    readOnly: false,
    interactive: true,
    dataSource: "Static JSON checklist item configuration.",
    output: "Writes checklist JSON to the configured save target.",
    recommendedUseCases: ["policy confirmation", "pre-submit compliance checks", "review checklist"],
  },
  "dependent-selector": {
    purpose: "Provide cascading parent-child selection from a source list.",
    supportedContexts: { dashboard: false, approvalForm: true, dataListForm: true, publicForm: false },
    proof: "Inventory-only. Needs runtime proof for source-list query, filtering, and dual writeback.",
    readOnly: false,
    interactive: true,
    dataSource: "Source list with parent and child option fields.",
    output: "Writes parent and child selections to configured targets.",
    recommendedUseCases: ["category/subcategory", "country/state", "department/service type"],
  },
  "distribution-chart-module": {
    purpose: "Render grouped category/count analytics from a Yeeflow data list.",
    supportedContexts: { dashboard: true, approvalForm: false, dataListForm: false, publicForm: false },
    proof: "Inventory-only. Needs dashboard runtime proof with real list records.",
    readOnly: true,
    interactive: false,
    dataSource: "Data list queried and grouped by a category/status field.",
    output: "Display-only; no writeback targets.",
    recommendedUseCases: ["requests by status", "work by category", "exceptions by severity"],
  },
  "exception-alert-panel": {
    purpose: "Highlight anomalies, SLA breaches, missing data, and records needing attention.",
    supportedContexts: { dashboard: true, approvalForm: true, dataListForm: true, publicForm: false },
    proof: "Inventory-only. Needs runtime proof for rule/filter behavior.",
    readOnly: true,
    interactive: false,
    dataSource: "Exception/source list with title, severity, description, and optional rules.",
    output: "Display-only; no writeback targets.",
    recommendedUseCases: ["overdue requests", "high-risk items", "missing compliance information"],
  },
  "hierarchical-selector": {
    purpose: "Render and select values from a tree structure.",
    supportedContexts: { dashboard: false, approvalForm: true, dataListForm: true, publicForm: false },
    proof: "Inventory-only. Needs runtime proof for hierarchy query and save target.",
    readOnly: false,
    interactive: true,
    dataSource: "Hierarchy list with id, parent id, label, and value fields.",
    output: "Writes selected node value(s) to configured save target.",
    recommendedUseCases: ["service taxonomy", "location hierarchy", "organization/category tree"],
  },
  "kpi-card-set": {
    purpose: "Display configurable KPI cards from static JSON or mapped data.",
    supportedContexts: { dashboard: true, approvalForm: true, dataListForm: true, publicForm: false },
    proof: "Inventory-only. Render proof needed for each context; dashboard is the primary target.",
    readOnly: true,
    interactive: false,
    dataSource: "Static JSON cardsConfig or data object/array supplied through expression parameters.",
    output: "Display-only; no writeback targets.",
    recommendedUseCases: ["operational scorecards", "request summary", "review-context metrics"],
  },
  "multi-entry-tag-input": {
    purpose: "Capture multiple tags, emails, IDs, labels, or SKUs as chips.",
    supportedContexts: { dashboard: false, approvalForm: true, dataListForm: true, publicForm: false },
    proof: "Inventory-only. Needs runtime proof for add/remove and writeback.",
    readOnly: false,
    interactive: true,
    dataSource: "User-entered chip values; no list query required.",
    output: "Writes tags as JSON or delimiter text to configured save target.",
    recommendedUseCases: ["request tags", "watchers/recipients", "keyword capture"],
  },
  "related-record-summary-grid": {
    purpose: "Display related records inline as cards or table rows.",
    supportedContexts: { dashboard: true, approvalForm: true, dataListForm: true, publicForm: false },
    proof: "Inventory-only. Needs runtime proof for relation filtering and display fields.",
    readOnly: true,
    interactive: false,
    dataSource: "Related data list filtered by relation field/value and displayed field list.",
    output: "Display-only; no writeback targets.",
    recommendedUseCases: ["linked assets/vendors", "related incidents", "child request summary"],
  },
  "smart-lookup-picker": {
    purpose: "Search, select, and optionally manually add lookup records from a target list.",
    supportedContexts: { dashboard: true, approvalForm: true, dataListForm: true, publicForm: false },
    proof: "Export-backed and runtime-proven for dashboard, approval form, and data-list custom form. Public form is not tested.",
    readOnly: false,
    interactive: true,
    dataSource: "Lookup source list queried by display/value fields.",
    output: "Writes full JSON, matched selected values, and manual values to configured targets.",
    recommendedUseCases: ["asset/vendor picker", "supplier search", "large master-data lookup"],
  },
  "trend-chart-module": {
    purpose: "Render time-based list trends by day, week, or month.",
    supportedContexts: { dashboard: true, approvalForm: false, dataListForm: false, publicForm: false },
    proof: "Inventory-only. Needs dashboard runtime proof with dated records.",
    readOnly: true,
    interactive: false,
    dataSource: "Data list queried and bucketed by a date/datetime field.",
    output: "Display-only; no writeback targets.",
    recommendedUseCases: ["submission trend", "completion trend", "monthly approval volume"],
  },
};

function parseArgs(argv) {
  const args = {
    templatesDir: null,
    jsonOut: "custom-code-template-library-inspection.json",
    studyOut: "docs/custom-code-template-library-study.md",
    planOut: "custom-code-template-showcase-app-plan.md",
    specOut: "custom-code-template-showcase-app-spec.json",
  };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json-out") args.jsonOut = argv[++index];
    else if (arg === "--study-out") args.studyOut = argv[++index];
    else if (arg === "--plan-out") args.planOut = argv[++index];
    else if (arg === "--spec-out") args.specOut = argv[++index];
    else if (!args.templatesDir) args.templatesDir = arg;
    else throw new Error(`Unexpected argument: ${arg}`);
  }
  if (!args.templatesDir) throw new Error("Usage: node scripts/inspect-custom-code-template-library.mjs <templates-dir>");
  return args;
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function matchOne(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return "";
}

function parseInputParameters(text) {
  const match = text.match(/inputParameters\(\)\s*:?\s*InputParameter\[\]\s*{\s*return\s*\[([\s\S]*?)\];\s*}/);
  if (!match) return [];
  const params = [];
  const objectRe = /{[\s\S]*?}/g;
  let objectMatch;
  while ((objectMatch = objectRe.exec(match[1]))) {
    const source = objectMatch[0];
    const get = (key) => {
      const keyMatch = source.match(new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']*)["']`));
      return keyMatch ? keyMatch[1] : "";
    };
    const id = get("id");
    if (id) {
      params.push({
        id,
        name: get("name"),
        type: get("type"),
        desc: get("desc"),
        example: get("example"),
      });
    }
  }
  return params;
}

function parseWritableTargets(text) {
  const match = text.match(/const WRITABLE_TARGETS = ([^;]+);/);
  if (!match) return [];
  try {
    return JSON.parse(match[1].replaceAll("'", "\""));
  } catch {
    return [];
  }
}

function apiUsage(text) {
  const usage = new Set();
  if (text.includes("context.params")) usage.add("context.params");
  if (text.includes("context.getFieldValue")) usage.add("context.getFieldValue");
  if (text.includes("context.modules")) usage.add("context.modules");
  if (text.includes("yeeSDKClient")) usage.add("context.modules.yeeSDKClient");
  if (text.includes("queryItems")) usage.add("yeeSDKClient.lists.queryItems");
  if (/setFieldValue|setFormFieldValue|setVariableValue|setTempVariableValue|setValue|fieldsValues\[/.test(text)) usage.add("writeback setter candidates");
  return [...usage];
}

function inspectTemplate(templatesDir, name) {
  const folder = path.join(templatesDir, name);
  const tsxPath = path.join(folder, `${name}.tsx`);
  const guidePath = path.join(folder, `${name}-user-guide.md`);
  const configPath = path.join(folder, `${name}-example-config.md`);
  const source = readText(tsxPath);
  const inputParameters = parseInputParameters(source);
  const writableTargets = parseWritableTargets(source);
  const override = TEMPLATE_OVERRIDES[name] || {};
  const requiredParameters = inputParameters
    .filter((param) => {
      if (writableTargets.includes(param.id)) return true;
      if (["titleText", "subtitleText", "emptyText", "placeholderText", "maxItems", "maxResults", "height", "pageSize"].includes(param.id)) return false;
      if (param.id.endsWith("Text") || param.id.endsWith("Label") || param.id.endsWith("Json")) return false;
      if (["filterExpression", "rulesJson", "decisionOptionsJson", "cardsConfig"].includes(param.id)) return false;
      return ["variable"].includes(param.type);
    })
    .map((param) => param.id);
  const optionalParameters = inputParameters.map((param) => param.id).filter((id) => !requiredParameters.includes(id));
  const category = Object.entries(FUNCTIONAL_CATEGORIES).find(([, names]) => names.includes(name))?.[0] || "Other";
  return {
    name,
    category,
    files: {
      tsx: fs.existsSync(tsxPath),
      userGuide: fs.existsSync(guidePath),
      exampleConfig: fs.existsSync(configPath),
      packageMetadata: false,
    },
    componentName: matchOne(source, [/class\s+([A-Za-z0-9_]+)\s+extends\s+React\.Component/, /class\s+([A-Za-z0-9_]+)\s+extends\s+Component/]) || "ReusableTemplatePanel",
    description: matchOne(source, [/const TEMPLATE_DESC = ['"]([^'"]+)['"]/, /description\(\)[\s\S]*?return\s+['"]([^'"]+)['"]/]) || override.purpose || "",
    businessPurpose: override.purpose || "",
    supportedContexts: override.supportedContexts || { dashboard: false, approvalForm: false, dataListForm: false, publicForm: false },
    runtimeProofStatus: override.proof || "Inventory-only.",
    readOnly: override.readOnly === true,
    interactive: override.interactive === true,
    inputParameters,
    requiredParameters,
    optionalParameters,
    writableTargets,
    expectedDataSource: override.dataSource || "",
    expectedOutputWriteback: override.output || "",
    yeeflowApis: apiUsage(source),
    usesListQuery: source.includes("queryItems"),
    usesStaticJsonConfig: inputParameters.some((param) => param.id.toLowerCase().includes("json") || param.id === "cardsConfig"),
    needsDataListRecords: /dataListId|sourceListId|targetListId/.test(inputParameters.map((param) => param.id).join(",")),
    needsWorkflowVariables: name.includes("approval") || override.supportedContexts?.approvalForm === true,
    needsCurrentContext: /recordIdValue|relationValue/.test(inputParameters.map((param) => param.id).join(",")),
    runtimeRisks: [
      ...(override.supportedContexts?.publicForm ? [] : ["Public form support is not proven and must not be claimed."]),
      ...(source.includes("queryItems") ? ["List query filter/payload shape must be runtime-tested with real Yeeflow records."] : []),
      ...(writableTargets.length ? ["Writable targets must be bound with the correct context prefix and verified by save/persistence tests."] : []),
    ],
    recommendedUseCases: override.recommendedUseCases || [],
    validationChecksNeeded: [
      "script embedded in attrs[\"codein-script\"]",
      "parameters stored in attrs[\"codein-script-param\"]",
      "all required parameters configured",
      "parameter types match inputParameters()",
      "public form not claimed unless separately tested",
      ...(writableTargets.length ? ["writeback target exists and uses __temp_, __variables_, or __list_ according to context"] : []),
      ...(source.includes("queryItems") ? ["source list exists and sample records cover non-empty display"] : []),
    ],
    docsSummary: {
      userGuideBytes: readText(guidePath).length,
      exampleConfigBytes: readText(configPath).length,
    },
  };
}

function makeInspection(templatesDir) {
  const templates = EXPECTED_TEMPLATES.map((name) => inspectTemplate(templatesDir, name));
  const missing = templates.filter((template) => !template.files.tsx || !template.files.userGuide || !template.files.exampleConfig).map((template) => template.name);
  return {
    source: {
      templatesDir,
      expectedTemplateCount: EXPECTED_TEMPLATES.length,
    },
    summary: {
      templatesInspected: templates.length,
      missingDeliverables: missing,
      publicFormRuntimeProvenTemplates: [],
      smartLookupPickerRuntimeProvenContexts: ["dashboard", "approval form", "data-list custom form"],
      publicFormSupportClaim: "not claimed",
    },
    functionalCategories: FUNCTIONAL_CATEGORIES,
    customCodeControlPatternBaseline: {
      script: "attrs[\"codein-script\"]",
      parameters: "attrs[\"codein-script-param\"]",
      dashboardOutputPrefix: "__temp_",
      approvalFormOutputPrefix: "__variables_",
      dataListFormOutputPrefix: "__list_",
    },
    templates,
  };
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell ?? "").replaceAll("\n", "<br>")).join(" | ")} |`),
  ].join("\n");
}

function renderStudy(inspection) {
  const rows = inspection.templates.map((template) => [
    template.name,
    template.category,
    template.businessPurpose,
    Object.entries(template.supportedContexts).filter(([, value]) => value).map(([key]) => key).join(", ") || "none planned",
    template.interactive ? "Interactive" : "Read-only",
    template.writableTargets.join(", ") || "none",
    template.runtimeProofStatus,
  ]);
  const paramSections = inspection.templates.map((template) => {
    const paramRows = template.inputParameters.map((param) => [
      param.id,
      param.type,
      template.requiredParameters.includes(param.id) ? "Yes" : "No",
      param.desc,
      param.example || "",
    ]);
    return [
      `### ${template.name}`,
      "",
      `Purpose: ${template.businessPurpose}`,
      "",
      `Expected data source: ${template.expectedDataSource}`,
      "",
      `Expected output/writeback: ${template.expectedOutputWriteback}`,
      "",
      mdTable(["Parameter", "Type", "Required", "Description", "Example"], paramRows),
      "",
      `Runtime risks: ${template.runtimeRisks.join("; ")}`,
      "",
      `Validation checks: ${template.validationChecksNeeded.join("; ")}`,
    ].join("\n");
  });
  return [
    "# Custom Code Template Library Study",
    "",
    "Source: `Custom Code templates.zip` extracted read-only to a temporary working folder.",
    "",
    "This study inventories all 13 Yeeflow custom code templates before app generation. Runtime support is claimed only where already proven by prior Smart Lookup Picker testing. Public form support remains untested and is not claimed for any template.",
    "",
    "## Summary",
    "",
    mdTable(["Template", "Category", "Business purpose", "Planned safe contexts", "Mode", "Writable targets", "Runtime proof"], rows),
    "",
    "## Functional Classification",
    "",
    ...Object.entries(inspection.functionalCategories).flatMap(([category, names]) => [`### ${category}`, "", names.map((name) => `- \`${name}\``).join("\n"), ""]),
    "## Export-Backed Custom Code Control Baseline",
    "",
    "- Script source is embedded in `attrs[\"codein-script\"]`.",
    "- Input parameters are stored in `attrs[\"codein-script-param\"]`.",
    "- Dashboard writable outputs use `__temp_` targets.",
    "- Approval form writable outputs use `__variables_` targets.",
    "- Data-list custom form writable outputs use `__list_` targets.",
    "- Public forms require separate export/runtime proof before generation claims.",
    "",
    "## Template Details",
    "",
    ...paramSections,
    "",
    "## Source Of Truth",
    "",
    "- Source-code `inputParameters()` is the parameter-schema source of truth.",
    "- User guides and example configs are setup guidance and should be checked against source code.",
    "- Smart Lookup Picker export/runtime baselines are the only current source of runtime support claims.",
    "- For the other 12 templates, this study is inventory evidence, not runtime proof.",
  ].join("\n");
}

function showcaseSpec(inspection) {
  const usage = {
    "activity-timeline": { location: "Dashboard and request detail section", context: "dashboard/form display", source: "Approval History / Timeline Events", output: "none" },
    "approval-decision-panel": { location: "Manager Review and Compliance Review task pages", context: "approval form", source: "decision/comment variables", output: "__variables_.ReviewDecision and __variables_.ReviewComment" },
    "approval-timeline": { location: "Approval form review section", context: "approval form", source: "Approval History / Timeline Events", output: "none" },
    "checklist-compliance-block": { location: "Submission form compliance section", context: "approval form", source: "static checklist JSON", output: "__variables_.ComplianceChecklistJson" },
    "dependent-selector": { location: "Submission form category section", context: "approval form", source: "Subcategories", output: "__variables_.SelectedCategory and __variables_.SelectedSubcategory" },
    "distribution-chart-module": { location: "Operations dashboard analytics band", context: "dashboard", source: "Service Requests", output: "none" },
    "exception-alert-panel": { location: "Operations dashboard exception band", context: "dashboard", source: "Exception Rules / Alerts or filtered Service Requests", output: "none" },
    "hierarchical-selector": { location: "Submission form taxonomy section", context: "approval form", source: "Request Categories", output: "__variables_.SelectedHierarchy" },
    "kpi-card-set": { location: "Dashboard KPI header", context: "dashboard", source: "static/dashboard KPI config JSON backed by seeded records", output: "none" },
    "multi-entry-tag-input": { location: "Submission form tags section", context: "approval form", source: "user-entered tags", output: "__variables_.RequestTagsJson" },
    "related-record-summary-grid": { location: "Submission form related records and dashboard recent records", context: "approval form/dashboard", source: "Asset / Vendor / Related Records", output: "none" },
    "smart-lookup-picker": { location: "Submission form asset/vendor lookup and data-list custom form", context: "approval form/data-list form/dashboard", source: "Asset / Vendor / Related Records", output: "__variables_, __list_, or __temp_ targets by context" },
    "trend-chart-module": { location: "Operations dashboard trend band", context: "dashboard", source: "Service Requests date fields", output: "none" },
  };
  return {
    appName: "Enterprise Service Request & Compliance Review",
    purpose: "Focused showcase app to use all 13 reusable Yeeflow custom code templates in realistic request, compliance, approval, and dashboard contexts.",
    sourceZip: "Custom Code templates.zip",
    readyForGeneration: false,
    doNotGenerateYet: true,
    generationGateReason: "Phase 1 inventory and plan/spec completed. Generate in Phase 2 after accepting the app wiring plan and adding package-specific custom-code parameter validation.",
    publicFormSupport: "not claimed; no public form usage planned",
    templates: inspection.templates.map((template) => ({
      name: template.name,
      category: template.category,
      runtimeProofStatus: template.runtimeProofStatus,
      plannedUsage: usage[template.name],
      requiredParameters: template.requiredParameters,
      writableTargets: template.writableTargets,
    })),
    dataModel: [
      "Service Requests",
      "Request Categories",
      "Subcategories",
      "Asset / Vendor / Related Records",
      "Compliance Checklist Items",
      "Request Tags",
      "Approval History / Timeline Events",
      "Exception Rules / Alerts",
      "Request Metrics / Summary Records",
    ],
    workflow: ["Submit", "Manager Review", "Compliance Review", "Final Approval", "Rejected / Returned", "Completed persistence"],
    validationPlan: [
      "JSON parse checks",
      "TSX static parse/transpile check if TypeScript tooling is available",
      "package validation",
      "graph validation",
      "YWF validation",
      "YDL validation for every list",
      "workflow action validation",
      "wrapper round trip",
      "custom code control inspection",
      "custom code parameter validation",
      "dashboard structure inspection",
      "duplicate field name check",
      "lookup dependency check",
      "safety scan for raw packages before commit",
    ],
    runtimeTestPlan: inspection.templates.map((template) => ({
      template: template.name,
      targetClassification: template.name === "smart-lookup-picker" ? "Regression proof required in this generated app" : "Not runtime-proven yet; must be classified after tenant test",
      contextsToTest: Object.entries(template.supportedContexts).filter(([, value]) => value).map(([key]) => key).filter((key) => key !== "publicForm"),
      expectedBehavior: template.interactive ? "render plus interaction/writeback if configured" : "render with representative data",
    })),
    blockers: [
      "Full showcase .yap generation and runtime testing are intentionally deferred to Phase 2/3 to avoid silently skipping templates.",
      "Local workspace currently lacks TypeScript/esbuild packages for real TSX compile; only source parsing is available unless tooling is installed or provided.",
      "Twelve templates are inventory-only and need generated-app runtime proof before support claims.",
      "Public form support is not planned or claimed.",
    ],
  };
}

function renderPlan(spec) {
  const rows = spec.templates.map((item) => [
    item.name,
    item.plannedUsage.context,
    item.plannedUsage.location,
    item.plannedUsage.source,
    item.plannedUsage.output,
  ]);
  return [
    "# Custom Code Template Showcase App Plan",
    "",
    `App: ${spec.appName}`,
    "",
    spec.purpose,
    "",
    "## Generation Gate",
    "",
    `- readyForGeneration: \`${spec.readyForGeneration}\``,
    `- doNotGenerateYet: \`${spec.doNotGenerateYet}\``,
    `- reason: ${spec.generationGateReason}`,
    "- Public form support remains unclaimed.",
    "",
    "## Template Placement Plan",
    "",
    mdTable(["Template", "Context", "Location", "Source", "Output/writeback"], rows),
    "",
    "## Data Model",
    "",
    spec.dataModel.map((item) => `- ${item}`).join("\n"),
    "",
    "## Workflow",
    "",
    spec.workflow.map((item) => `- ${item}`).join("\n"),
    "",
    "## Sample Data Strategy",
    "",
    "- Seed service requests across statuses, categories, priorities, dates, and risk levels.",
    "- Seed category/subcategory and hierarchy records to support selector templates.",
    "- Seed asset/vendor/related records so lookup and related-record components render meaningful data.",
    "- Seed approval history and activity events linked to request ids.",
    "- Seed exception records or service requests that satisfy overdue/high-risk/missing-compliance conditions.",
    "",
    "## Runtime Test Plan",
    "",
    spec.runtimeTestPlan.map((item) => `- \`${item.template}\`: ${item.expectedBehavior}; contexts: ${item.contextsToTest.join(", ") || "none"}.`).join("\n"),
    "",
    "## Known Risks / Blockers",
    "",
    spec.blockers.map((item) => `- ${item}`).join("\n"),
    "",
    "## Phase Split",
    "",
    "1. Inventory and plan/spec: complete in this branch phase.",
    "2. Generated showcase app: next phase after reviewing this plan/spec.",
    "3. Runtime testing and skill updates: final phase after local validation passes.",
  ].join("\n");
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

const args = parseArgs(process.argv);
const inspection = makeInspection(args.templatesDir);
const spec = showcaseSpec(inspection);

for (const [filePath, content] of [
  [args.jsonOut, JSON.stringify(inspection, null, 2) + "\n"],
  [args.studyOut, renderStudy(inspection) + "\n"],
  [args.specOut, JSON.stringify(spec, null, 2) + "\n"],
  [args.planOut, renderPlan(spec) + "\n"],
]) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, content);
  console.log(`Wrote ${filePath}`);
}
