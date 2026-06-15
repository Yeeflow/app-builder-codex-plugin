#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED_CONTAINER_ATTRS = [
  "widthtype",
  "direction",
  "align_items",
  "justify_content",
  "gap",
  "wrap",
];

const SNAKE_CASE_CONTAINER_ATTRS = [
  "align_items",
  "justify_content",
];

const CAMEL_CASE_ALIASES = {
  alignItems: "align_items",
  justifyContent: "justify_content",
  widthType: "widthtype",
};

const EXPECTED_FILTER_WIDTHS = {
  Region: 180,
  Period: 180,
  Status: 120,
  "Event Type": 140,
};

const DEFAULT_CONTROL_KNOWLEDGE_BASE = {
  normalizedRegistry: "docs/reference/yeeflow-control-configurations.normalized.json",
  extensionRegistry: "docs/reference/yeeflow-control-property-extensions.json",
  helper: "scripts/inspect-yeeflow-control-configurations.mjs",
};

const FINDING_MESSAGES = {
  CONTROL_TYPE_MISMATCH: "Control type does not match the expected Yeeflow control.",
  CONTAINER_ATTR_MISSING: "Container control is missing required attrs.",
  CONTAINER_ATTR_SCHEMA_ALIAS_MISMATCH: "Container attrs use unsupported aliases instead of Yeeflow snake_case attrs.",
  CONTAINER_WIDTHTYPE_MISMATCH: "Container widthtype does not match the expected fixed/full-width mode.",
  CONTAINER_FIXED_SIZE_MISMATCH: "Container fixed width/height does not match the expected visual target.",
  CONTAINER_ALIGNMENT_MISMATCH: "Container alignment or justify settings do not match the expected pattern.",
  CONTAINER_GAP_MISMATCH: "Container gap/wrap settings do not match the expected pattern.",
  CONTROL_MARGIN_PADDING_MISMATCH: "Control margin or padding does not match the expected zero/compact style.",
  CONTROL_BORDER_STYLE_MISMATCH: "Control border style does not match the expected borderless style.",
  DATA_FILTER_CONTROL_TYPE_MISMATCH: "Filter UI must use real Data Filter controls, not static Text or generic placeholders.",
  DATA_FILTER_DISPLAY_STYLE_MISMATCH: "Data Filter display style does not match the expected dropdown/chip style.",
  DATA_FILTER_TITLE_NOT_HIDDEN: "Data Filter title must be hidden for the compact filter/action row.",
  DATA_FILTER_PLACEHOLDER_STYLE_MISMATCH: "Data Filter placeholder style does not match the expected visual treatment.",
  DATA_FILTER_VISIBLE_BUT_NOT_BOUND: "Visible Data Filter must declare a filter variable binding.",
  FILTER_VARIABLE_NOT_CONSUMED_BY_TARGET_CONTROL: "Filter variable is not consumed by a target Summary, Collection, or List control.",
  ACTION_CONTAINER_SIZE_MISMATCH: "Action button/container fixed size does not match the expected pattern.",
  KPI_ICON_TILE_STYLE_MISMATCH: "KPI icon tile must use a fixed-size container with centered icon.",
  KPI_TEXT_STACK_LAYOUT_MISMATCH: "KPI card text stack/value/trend layout does not match the golden pattern.",
  GRID_USED_WHERE_CONTAINER_REQUIRED: "Use Container for visual composition rows/cards unless a real data grid is required.",
  DYNAMIC_KPI_PROOF_MISSING: "Dynamic KPI proof requires before/after mutation evidence.",
};

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.candidate) usage(args.help ? 0 : 1);
  const report = inspectUiControlPropertyFidelity(args);
  const rendered = args.format === "markdown" ? renderMarkdown(report) : `${JSON.stringify(report, null, 2)}\n`;
  if (args.out) fs.writeFileSync(args.out, rendered);
  else process.stdout.write(rendered);
  process.exit(report.status === "fail" || (args.strict && report.status === "warning") ? 1 : 0);
}

export function inspectUiControlPropertyFidelity({
  candidate,
  reference,
  page,
  out,
  format = "json",
  strict = false,
} = {}) {
  const findings = [];
  let candidateSpec = {};
  let referenceSpec = normalizeSpec({});

  if (!candidate) {
    addFinding(findings, "error", "CONTROL_PROPERTY_CANDIDATE_MISSING", "Candidate path is required.");
  } else {
    try {
      candidateSpec = normalizeSpec(readJson(candidate));
    } catch (error) {
      addFinding(findings, "error", "CONTROL_PROPERTY_CANDIDATE_READ_FAILED", `Could not read candidate JSON: ${error.message}`);
    }
  }

  if (reference) {
    try {
      referenceSpec = normalizeSpec(readJson(reference));
    } catch (error) {
      addFinding(findings, "error", "CONTROL_PROPERTY_REFERENCE_READ_FAILED", `Could not read reference JSON: ${error.message}`);
    }
  }

  if (!findings.some((finding) => finding.severity === "error")) {
    validateFilterActionRow(candidateSpec, referenceSpec, findings);
    validateDataFilters(candidateSpec, referenceSpec, findings);
    validateActions(candidateSpec, findings);
    validateKpiCards(candidateSpec, referenceSpec, findings);
    validateKpiProofBoundary(candidateSpec, findings);
  }

  const status = statusFromFindings(findings);
  return {
    status,
    summary: summarize(status, findings, strict),
    candidatePath: safePath(candidate),
    referencePath: safePath(reference),
    page: page || candidateSpec.page || null,
    strict,
    findingCodes: [...new Set(findings.map((finding) => finding.code))],
    controlSummary: {
      filterActionRowType: candidateSpec.filterActionRow?.controlType || null,
      filters: candidateSpec.dataFilters.map((filter) => ({
        name: filter.name,
        controlType: filter.controlType,
        filterMode: filter.filterMode,
        wrapperWidth: getFixedWidth(filter.wrapperAttrs),
        filterVariable: filter.filterVariable || null,
        consumedBy: filter.consumedBy || [],
      })),
      kpiCardCount: candidateSpec.kpiCards.length,
      actionCount: candidateSpec.actions.length,
    },
    controlPropertyKnowledgeBase: {
      ...DEFAULT_CONTROL_KNOWLEDGE_BASE,
      available: fs.existsSync(path.join(projectRoot(), DEFAULT_CONTROL_KNOWLEDGE_BASE.normalizedRegistry)),
      boundary: "Use the Yeeflow control property knowledge base before generating controls; catalog-backed paths prove legal property paths, not visual fidelity by themselves.",
    },
    findings,
    proofBoundary: [
      "This validator checks declared/redacted Yeeflow control specs and decoded metadata shapes only.",
      "Control-property paths should align with docs/reference/yeeflow-control-configurations.normalized.json plus evidence-backed extensions.",
      "It does not decode raw private YAPK payloads, parse screenshots, inspect Chrome, call Yeeflow APIs, sign, install, import, or upgrade packages.",
      "Runtime live values may differ from design mock values when marked visual-target-only.",
      "Dynamic KPI proof still requires before/after mutation evidence.",
    ],
    nextActions: nextActions(findings),
    output: out ? safePath(out) : null,
    format,
  };
}

function validateFilterActionRow(spec, reference, findings) {
  const row = spec.filterActionRow;
  if (!row) return;
  if (row.controlType === "Grid") {
    addFinding(findings, "error", "GRID_USED_WHERE_CONTAINER_REQUIRED", "Filter/action row must use Container for visual composition.");
  } else if (row.controlType && row.controlType !== "Container") {
    addFinding(findings, "error", "CONTROL_TYPE_MISMATCH", `Filter/action row must be Container, found ${row.controlType}.`);
  }

  const attrs = styleAttrs(row.attrs);
  for (const key of REQUIRED_CONTAINER_ATTRS) {
    if (!hasValue(attrs[key])) {
      addFinding(findings, "error", "CONTAINER_ATTR_MISSING", `Filter/action row missing attrs.style.${key}.`, { key });
    }
  }
  for (const [alias, canonical] of Object.entries(CAMEL_CASE_ALIASES)) {
    if (hasValue(attrs[alias]) && !hasValue(attrs[canonical])) {
      addFinding(findings, "error", "CONTAINER_ATTR_SCHEMA_ALIAS_MISMATCH", `Use attrs.style.${canonical}, not ${alias}.`, { alias, canonical });
    }
  }
  for (const key of SNAKE_CASE_CONTAINER_ATTRS) {
    if (!Object.prototype.hasOwnProperty.call(attrs, key)) {
      continue;
    }
  }
  if (attrs.widthtype && !["1", "full", "100%"].includes(String(attrs.widthtype))) {
    addFinding(findings, "error", "CONTAINER_WIDTHTYPE_MISMATCH", "Filter/action parent must be full-width.");
  }
  if (attrs.direction !== "row") {
    addFinding(findings, "error", "CONTAINER_ALIGNMENT_MISMATCH", "Filter/action parent must use direction row.");
  }
  if (attrs.align_items !== "center") {
    addFinding(findings, "error", "CONTAINER_ALIGNMENT_MISMATCH", "Filter/action parent must align_items center.");
  }
  if (attrs.justify_content !== "space-between") {
    addFinding(findings, "error", "CONTAINER_ALIGNMENT_MISMATCH", "Filter/action parent must justify_content space-between.");
  }
  if (attrs.wrap && attrs.wrap !== "nowrap") {
    addFinding(findings, "error", "CONTAINER_GAP_MISMATCH", "Filter/action parent must not wrap.");
  }
  if (!isZeroSpacing(row.margin) || !isZeroSpacing(row.padding)) {
    addFinding(findings, "error", "CONTROL_MARGIN_PADDING_MISMATCH", "Filter/action parent must use zero margin and padding.");
  }

  const refAttrs = reference.filterActionRow ? styleAttrs(reference.filterActionRow.attrs) : {};
  if (refAttrs.gap && attrs.gap !== refAttrs.gap) {
    addFinding(findings, "warning", "CONTAINER_GAP_MISMATCH", "Filter/action parent gap differs from the redacted golden reference.", {
      expected: refAttrs.gap,
      actual: attrs.gap,
    });
  }
}

function validateDataFilters(spec, reference, findings) {
  const targetVariables = new Set(spec.targetControls.flatMap((target) => target.consumedFilterVariables || []));
  const referenceFilters = new Map(reference.dataFilters.map((filter) => [filter.name, filter]));

  for (const filter of spec.dataFilters) {
    if (filter.controlType !== "Data Filter") {
      addFinding(findings, "error", "DATA_FILTER_CONTROL_TYPE_MISMATCH", `${filter.name || "Filter"} must use a real Data Filter control.`);
    }
    if (filter.displayStyle && !/dropdown|select|chip/i.test(filter.displayStyle)) {
      addFinding(findings, "error", "DATA_FILTER_DISPLAY_STYLE_MISMATCH", `${filter.name || "Filter"} must use dropdown/select display style.`);
    }
    if (filter.titleVisible === true || filter.displayTitleHidden === false) {
      addFinding(findings, "error", "DATA_FILTER_TITLE_NOT_HIDDEN", `${filter.name || "Filter"} title must be hidden.`);
    }
    if (!isZeroSpacing(filter.margin) || !isZeroSpacing(filter.padding)) {
      addFinding(findings, "error", "CONTROL_MARGIN_PADDING_MISMATCH", `${filter.name || "Filter"} margin and padding must be zero.`);
    }
    if (filter.border && !/none|0/i.test(String(filter.border))) {
      addFinding(findings, "error", "CONTROL_BORDER_STYLE_MISMATCH", `${filter.name || "Filter"} border must be none.`);
    }
    if (filter.placeholderStyle && filter.placeholderStyle !== "compact-muted") {
      addFinding(findings, "error", "DATA_FILTER_PLACEHOLDER_STYLE_MISMATCH", `${filter.name || "Filter"} placeholder style must match compact-muted.`);
    }
    const expectedWidth = EXPECTED_FILTER_WIDTHS[filter.name] || getFixedWidth(referenceFilters.get(filter.name)?.wrapperAttrs);
    const actualWidth = getFixedWidth(filter.wrapperAttrs);
    if (expectedWidth && actualWidth !== expectedWidth) {
      addFinding(findings, "error", "CONTAINER_FIXED_SIZE_MISMATCH", `${filter.name || "Filter"} wrapper must be fixed ${expectedWidth}px wide.`, {
        expectedWidth,
        actualWidth,
      });
    }
    if (filter.visible !== false && !filter.filterVariable) {
      addFinding(findings, "error", "DATA_FILTER_VISIBLE_BUT_NOT_BOUND", `${filter.name || "Filter"} is visible but has no filter variable.`);
    }
    if (filter.filterVariable && !targetVariables.has(filter.filterVariable) && !(filter.consumedBy || []).length) {
      addFinding(findings, "error", "FILTER_VARIABLE_NOT_CONSUMED_BY_TARGET_CONTROL", `${filter.name || "Filter"} variable is not consumed by target controls.`, {
        filterVariable: filter.filterVariable,
      });
    }
  }
}

function validateActions(spec, findings) {
  for (const action of spec.actions) {
    const width = getFixedWidth(action.attrs);
    const height = getFixedHeight(action.attrs);
    if (action.fixedSizeRequired && (!width || !height)) {
      addFinding(findings, "error", "ACTION_CONTAINER_SIZE_MISMATCH", `${action.name || "Action"} requires fixed width and height.`);
    }
  }
}

function validateKpiCards(spec, reference, findings) {
  if (!spec.kpiCards.length) return;
  const referencePattern = reference.kpiGoldenPattern || spec.kpiGoldenPattern || spec.kpiCards[0];
  for (const card of spec.kpiCards) {
    if (card.controlType === "Grid") {
      addFinding(findings, "error", "GRID_USED_WHERE_CONTAINER_REQUIRED", `${card.name || "KPI card"} should use Container for visual composition.`);
    }
    if (card.controlType && card.controlType !== "Container") {
      addFinding(findings, "error", "CONTROL_TYPE_MISMATCH", `${card.name || "KPI card"} must be a Container-based card.`);
    }
    if (!card.iconTile?.fixedWidth || !card.iconTile?.fixedHeight || card.iconTile?.iconAlign !== "center" || card.iconTile?.iconJustify !== "center") {
      addFinding(findings, "error", "KPI_ICON_TILE_STYLE_MISMATCH", `${card.name || "KPI card"} icon tile must be fixed-size and centered.`);
    }
    if (card.textStack?.direction !== "column" || !card.valuePlacement || !card.trendPlacement) {
      addFinding(findings, "error", "KPI_TEXT_STACK_LAYOUT_MISMATCH", `${card.name || "KPI card"} must include title/value/trend text stack placement.`);
    }
    if (referencePattern && !sameKpiPattern(card, referencePattern)) {
      addFinding(findings, "error", "KPI_TEXT_STACK_LAYOUT_MISMATCH", `${card.name || "KPI card"} is inconsistent with the golden first-card pattern.`);
    }
  }
}

function validateKpiProofBoundary(spec, findings) {
  for (const kpi of spec.kpiCards) {
    if (kpi.runtimeValueDiffersFromMock && kpi.mockValueBoundary === "visual-target-only") {
      continue;
    }
    if (kpi.runtimeValueDiffersFromMock && !kpi.mockValueBoundary) {
      addFinding(findings, "warning", "MOCK_VALUE_RUNTIME_VALUE_BOUNDARY_REQUIRED", `${kpi.name || "KPI"} runtime value differs from mock value without explicit boundary.`);
    }
    if (kpi.dynamicKpiProofClaimed && !kpi.beforeAfterMutationEvidence) {
      addFinding(findings, "error", "DYNAMIC_KPI_PROOF_MISSING", `${kpi.name || "KPI"} claims dynamic proof without before/after mutation evidence.`);
    }
  }
}

function normalizeSpec(data) {
  const root = data?.uiControlPropertyFidelity || data?.controlPropertyFidelity || data;
  return {
    page: root.page || root.pageName || null,
    filterActionRow: normalizeControl(root.filterActionRow || root.filterActionContainer || root.headerFilterActionParent),
    dataFilters: normalizeArray(root.dataFilters || root.filters).map(normalizeFilter),
    actions: normalizeArray(root.actions || root.actionButtons).map(normalizeAction),
    kpiCards: normalizeArray(root.kpiCards || root.kpis).map(normalizeKpiCard),
    targetControls: normalizeArray(root.targetControls || root.filterTargets).map((target) => ({
      name: target.name || target.label,
      controlType: target.controlType || target.type,
      consumedFilterVariables: normalizeArray(target.consumedFilterVariables || target.filterVariables || target.variables),
    })),
    kpiGoldenPattern: root.kpiGoldenPattern ? normalizeKpiCard(root.kpiGoldenPattern) : null,
  };
}

function normalizeControl(control = {}) {
  return {
    ...control,
    controlType: control.controlType || control.type || null,
    attrs: control.attrs || control,
  };
}

function normalizeFilter(filter = {}) {
  return {
    ...filter,
    name: filter.name || filter.label,
    controlType: filter.controlType || filter.type,
    filterMode: filter.filterMode || filter.mode,
    displayStyle: filter.displayStyle || filter.display,
    displayTitleHidden: filter.displayTitleHidden,
    titleVisible: filter.titleVisible,
    wrapperAttrs: filter.wrapperAttrs || filter.wrapper?.attrs || filter.wrapper || {},
    margin: filter.margin ?? filter.attrs?.common?.margin ?? filter.attrs?.style?.margin,
    padding: filter.padding ?? filter.attrs?.common?.padding ?? filter.attrs?.style?.padding,
    border: filter.border ?? filter.attrs?.common?.border ?? filter.attrs?.style?.border,
    placeholderStyle: filter.placeholderStyle || filter.attrs?.placeholderStyle,
    filterVariable: filter.filterVariable || filter.variable || filter.save_var?.name,
    consumedBy: normalizeArray(filter.consumedBy),
  };
}

function normalizeAction(action = {}) {
  return {
    ...action,
    name: action.name || action.label,
    attrs: action.attrs || action,
  };
}

function normalizeKpiCard(card = {}) {
  return {
    ...card,
    name: card.name || card.label,
    controlType: card.controlType || card.type,
    iconTile: card.iconTile || card.icon || {},
    textStack: card.textStack || {},
  };
}

function styleAttrs(attrs = {}) {
  return attrs.style || attrs;
}

function getFixedWidth(attrs = {}) {
  const style = styleAttrs(attrs);
  const width = style.width ?? attrs.width ?? style.fixedWidth ?? attrs.fixedWidth;
  return numeric(width);
}

function getFixedHeight(attrs = {}) {
  const style = styleAttrs(attrs);
  const height = style.height ?? style.cushei ?? attrs.height ?? attrs.fixedHeight;
  return numeric(height);
}

function sameKpiPattern(card, reference) {
  return numeric(card.iconTile?.fixedWidth) === numeric(reference.iconTile?.fixedWidth)
    && numeric(card.iconTile?.fixedHeight) === numeric(reference.iconTile?.fixedHeight)
    && card.iconTile?.iconAlign === reference.iconTile?.iconAlign
    && card.iconTile?.iconJustify === reference.iconTile?.iconJustify
    && card.textStack?.direction === reference.textStack?.direction
    && Boolean(card.valuePlacement) === Boolean(reference.valuePlacement)
    && Boolean(card.trendPlacement) === Boolean(reference.trendPlacement);
}

function isZeroSpacing(value) {
  if (value == null) return true;
  if (typeof value === "number") return value === 0;
  if (typeof value === "string") return value === "0" || value === "0px" || value.toLowerCase() === "none";
  if (Array.isArray(value)) return value.every(isZeroSpacing);
  if (typeof value === "object") return Object.values(value).every(isZeroSpacing);
  return false;
}

function numeric(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return value;
  const match = String(value).match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function hasValue(value) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function normalizeArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : Object.values(value);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function addFinding(findings, severity, code, message = FINDING_MESSAGES[code] || code, details = undefined) {
  findings.push({ severity, code, message, ...(details ? { details } : {}) });
}

function statusFromFindings(findings) {
  if (findings.some((finding) => finding.severity === "error")) return "fail";
  if (findings.some((finding) => finding.severity === "warning")) return "warning";
  return "pass";
}

function summarize(status, findings, strict) {
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  if (status === "pass") return "UI control-property fidelity passed.";
  if (status === "warning" && strict) return `UI control-property fidelity has ${warnings} warning finding(s); --strict treats warnings as nonzero.`;
  return `UI control-property fidelity ${status} with ${errors} error finding(s) and ${warnings} warning finding(s).`;
}

function nextActions(findings) {
  const codes = new Set(findings.map((finding) => finding.code));
  const actions = [];
  if (codes.has("GRID_USED_WHERE_CONTAINER_REQUIRED")) actions.push("Replace Grid/Flex-like visual wrappers with Container controls for composition rows/cards.");
  if (codes.has("DATA_FILTER_CONTROL_TYPE_MISMATCH")) actions.push("Use real Data Filter controls instead of static Text for filters.");
  if (codes.has("FILTER_VARIABLE_NOT_CONSUMED_BY_TARGET_CONTROL")) actions.push("Bind filter variables into target Summary, Collection, or List controls.");
  if (codes.has("KPI_ICON_TILE_STYLE_MISMATCH") || codes.has("KPI_TEXT_STACK_LAYOUT_MISMATCH")) actions.push("Make every KPI card follow the same golden card/icon/text-stack pattern.");
  if (!actions.length && findings.length) actions.push("Resolve the listed control-property findings before claiming design fidelity.");
  return actions;
}

function renderMarkdown(report) {
  const lines = [
    `# UI Control Property Fidelity: ${report.status}`,
    "",
    report.summary,
    "",
    "## Findings",
  ];
  if (!report.findings.length) lines.push("- None");
  for (const finding of report.findings) {
    lines.push(`- ${finding.severity.toUpperCase()} ${finding.code}: ${finding.message}`);
  }
  lines.push("", "## Proof Boundary");
  for (const item of report.proofBoundary) lines.push(`- ${item}`);
  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = { format: "json", strict: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--candidate") args.candidate = argv[++index];
    else if (arg === "--reference") args.reference = argv[++index];
    else if (arg === "--page") args.page = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--format") args.format = argv[++index];
    else if (arg === "--strict") args.strict = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function usage(exitCode) {
  const script = path.basename(fileURLToPath(import.meta.url));
  const message = [
    `Usage: node scripts/${script} --candidate <control-spec.json> [--reference <redacted-golden-control-spec.json>] [--page <page-name>] [--out <findings.json>] [--format json|markdown] [--strict]`,
    "",
    "Validates declared/redacted Yeeflow UI control-property fidelity metadata.",
  ].join("\n");
  (exitCode === 0 ? process.stdout : process.stderr).write(`${message}\n`);
  process.exit(exitCode);
}

function safePath(value) {
  if (!value) return null;
  return path.relative(process.cwd(), path.resolve(value)) || ".";
}

function projectRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
