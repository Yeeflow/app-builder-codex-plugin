#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const REQUIRED_SECTIONS = [
  "design/mockup reference",
  "target page name",
  "page purpose",
  "visual sections",
  "yeeflow control mapping",
  "data/list bindings",
  "kpi/summary plan",
  "filter/action plan",
  "grid/table plan",
  "status/badge plan",
  "spacing/layout rules",
  "runtime evidence requirement",
  "proof boundary",
  "unresolved items",
];

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.design) usage(args.help ? 0 : 1);
  const contract = generateUiContractFromDesign(args);
  const rendered = args.format === "json" ? `${JSON.stringify(contract, null, 2)}\n` : renderMarkdown(contract);
  if (args.output) fs.writeFileSync(args.output, rendered);
  else process.stdout.write(rendered);
}

export function generateUiContractFromDesign({
  design,
  plan,
  output,
  format = output && output.toLowerCase().endsWith(".json") ? "json" : "markdown",
  targetPage,
} = {}) {
  if (!design) throw new Error("--design is required");
  const planInfo = plan ? readPlan(plan) : {};
  const page = choosePage(planInfo, targetPage);
  const targetPageName = targetPage || page?.name || planInfo.appName || inferNameFromPath(design);

  return {
    schema: "yeeflow-ui-implementation-contract/v1",
    generatedAt: new Date().toISOString(),
    reviewRequired: true,
    visionParser: {
      available: false,
      note: "No local vision parser was used. Visual extraction from the design image requires human review before implementation claims.",
    },
    "design/mockup reference": {
      path: safePath(design),
      providedPath: design,
      extractionStatus: "not-parsed-review-required",
    },
    "target page name": targetPageName,
    "page purpose": page?.purpose || planInfo.purpose || `Review and implement the ${targetPageName} UI from the referenced design.`,
    "visual sections": inferSections(page, planInfo),
    "yeeflow control mapping": inferControls(page, planInfo),
    "data/list bindings": inferBindings(page, planInfo),
    "kpi/summary plan": inferKpis(page, planInfo),
    "filter/action plan": inferFiltersActions(page, planInfo),
    "grid/table plan": inferGrid(page, planInfo),
    "status/badge plan": inferBadges(page, planInfo),
    "spacing/layout rules": [
      "Map design spacing into explicit Yeeflow container padding, gap, border, and card background settings.",
      "Use export-proven shapes such as attrs.common.padding, attrs.style.gap, attrs.common.border.normal, and attrs.common.background.normal.classic.color.",
      "Keep page-level density, section grouping, and responsive behavior reviewable in the implementation notes.",
    ],
    "runtime evidence requirement": [
      "Capture redacted runtime evidence after implementation before claiming UI quality.",
      "Evidence must include visible KPI labels/values, filters/actions, grid/table headers and rows, badge-like cells, card-like sections, hidden Summary visibility check, and screenshot status.",
      "Runtime evidence must be compatible with inspect-runtime-evidence.mjs and inspect-visible-kpi-runtime-bindings.mjs.",
    ],
    "proof boundary": [
      "This contract is a planning artifact. It does not prove runtime UI quality, dynamic KPI binding, schema validity, signing, install, import, or upgrade success.",
      "Because no image parser is available here, the design image is a reference requiring human visual review before implementation is treated as complete.",
    ],
    "unresolved items": [
      "Human reviewer must extract exact visual hierarchy, colors, typography, iconography, and spatial measurements from the design image.",
      "Confirm which Yeeflow controls best match each visual section before generation or upgrade.",
      "Confirm real list, field, filter, action, Summary, and grid bindings from the approved app plan or installed package metadata.",
    ],
    sourcePlan: plan ? safePath(plan) : null,
    requiredSections: REQUIRED_SECTIONS,
  };
}

function renderMarkdown(contract) {
  const lines = [
    "# UI Implementation Contract",
    "",
    `Review required: ${contract.reviewRequired ? "yes" : "no"}`,
    `Vision parser available: ${contract.visionParser.available ? "yes" : "no"}`,
    `Vision parser note: ${contract.visionParser.note}`,
    "",
    `## Page: ${contract["target page name"]}`,
  ];

  for (const section of REQUIRED_SECTIONS) {
    lines.push("", headingFor(section));
    const value = contract[section];
    if (Array.isArray(value)) {
      for (const item of value.length ? value : ["Review required."]) lines.push(`- ${stringifyItem(item)}`);
    } else if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) lines.push(`- ${key}: ${stringifyItem(item)}`);
    } else {
      lines.push(`${labelFor(section)}: ${stringifyItem(value || "Review required.")}`);
    }
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function headingFor(section) {
  return `### ${section.split(/[\s/-]+/).map((word) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : word).join(" ")}`;
}

function labelFor(section) {
  return section.replace(/\b\w/g, (char) => char.toUpperCase());
}

function readPlan(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  if (file.toLowerCase().endsWith(".json")) return normalizeJsonPlan(JSON.parse(raw));
  return normalizeTextPlan(raw);
}

function normalizeJsonPlan(plan) {
  const pages = [
    ...(Array.isArray(plan.pages) ? plan.pages : []),
    ...(Array.isArray(plan.Pages) ? plan.Pages : []),
    ...(Array.isArray(plan.uiPages) ? plan.uiPages : []),
  ].map((page, index) => ({
    name: text(page.name || page.title || page.Title || page.pageName || `Page ${index + 1}`),
    purpose: text(page.purpose || page.description || page.summary),
    sections: arrayText(page.sections || page.visualSections),
    controls: arrayText(page.controls || page.yeeflowControls || page.controlMapping),
    bindings: arrayText(page.bindings || page.dataBindings || page.lists),
    kpis: arrayText(page.kpis || page.summaryPlan || page.metrics),
    filters: arrayText(page.filters || page.actions || page.filterActionPlan),
    grid: arrayText(page.grid || page.table || page.gridTablePlan),
    badges: arrayText(page.badges || page.statuses || page.statusBadgePlan),
  }));
  return {
    appName: text(plan.appName || plan.name || plan.title || plan.Title),
    purpose: text(plan.purpose || plan.description || plan.summary),
    pages,
    lists: arrayText(plan.lists || plan.dataLists || plan.Childs),
  };
}

function normalizeTextPlan(raw) {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const heading = lines.find((line) => /^#{1,3}\s+/.test(line));
  const pageLine = lines.find((line) => /target page name|page name|dashboard/i.test(line));
  return {
    appName: heading ? heading.replace(/^#+\s+/, "") : "",
    purpose: valueAfterColon(lines.find((line) => /purpose|overview|goal/i.test(line)) || ""),
    pages: [{
      name: valueAfterColon(pageLine || "") || (heading ? heading.replace(/^#+\s+/, "") : ""),
      purpose: valueAfterColon(lines.find((line) => /page purpose|purpose/i.test(line)) || ""),
      sections: grepLines(lines, /section|card|header|table|grid|filter|badge|kpi/i),
      controls: grepLines(lines, /control|summary|collection|heading|button|filter/i),
      bindings: grepLines(lines, /list|field|binding|data/i),
      kpis: grepLines(lines, /kpi|summary|metric/i),
      filters: grepLines(lines, /filter|action|button|search/i),
      grid: grepLines(lines, /grid|table|column|row/i),
      badges: grepLines(lines, /badge|status|chip/i),
    }],
    lists: grepLines(lines, /list|field/i),
  };
}

function choosePage(planInfo, targetPage) {
  const pages = Array.isArray(planInfo.pages) ? planInfo.pages : [];
  if (!pages.length) return null;
  if (!targetPage) return pages[0];
  const lower = targetPage.toLowerCase();
  return pages.find((page) => page.name.toLowerCase() === lower || page.name.toLowerCase().includes(lower)) || pages[0];
}

function inferSections(page) {
  return nonEmpty(page?.sections, [
    "Top page header and page-level action area to be confirmed from the design image.",
    "KPI or summary area to be confirmed from the design image and app plan.",
    "Filter/action row to be confirmed from the design image and app plan.",
    "Primary grid/table or content section to be confirmed from the design image and app plan.",
    "Status/badge treatment to be confirmed from the design image.",
  ]);
}

function inferControls(page) {
  return nonEmpty(page?.controls, [
    "Heading/Text controls for page title, section labels, and KPI visible labels.",
    "Container controls for card-like grouping and layout spacing.",
    "Summary controls only when real list/field metadata and runtime proof plan are available.",
    "Data Filter, Button, Collection, and status Text controls as required by the approved page plan.",
  ]);
}

function inferBindings(page, planInfo) {
  return nonEmpty(page?.bindings, planInfo.lists?.length ? planInfo.lists : [
    "Bind to approved Yeeflow data lists and fields only; do not invent field IDs or placeholder fields.",
  ]);
}

function inferKpis(page) {
  return nonEmpty(page?.kpis, [
    "Declare each KPI label, source list, source field, aggregation, filters, hidden Summary control, temp variable, and visible value binding.",
    "Dynamic visible KPI claims require redacted runtime evidence and before/after mutation proof for the exact binding shape.",
  ]);
}

function inferFiltersActions(page) {
  return nonEmpty(page?.filters, [
    "Declare visible filters, search controls, action buttons, target pages, and row/action behavior.",
  ]);
}

function inferGrid(page) {
  return nonEmpty(page?.grid, [
    "Declare Collection grid-table columns, headers, row templates, empty state, row actions, source list, and visible sample row expectations.",
  ]);
}

function inferBadges(page) {
  return nonEmpty(page?.badges, [
    "Declare each status label, source field, condition, color style, border/radius style, and fallback state.",
  ]);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--design") args.design = argv[++i];
    else if (arg === "--plan" || arg === "--spec") args.plan = argv[++i];
    else if (arg === "--output" || arg === "-o") args.output = argv[++i];
    else if (arg === "--format") args.format = argv[++i] === "json" ? "json" : "markdown";
    else if (arg === "--target-page") args.targetPage = argv[++i];
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  const out = [
    "Usage:",
    "  node scripts/generate-ui-contract-from-design.mjs --design <image-path> [--plan <app-plan.md|json>] [--target-page <name>] [--output <contract.md|json>] [--format markdown|json]",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(out);
  process.exit(exitCode);
}

function nonEmpty(value, fallback) {
  return Array.isArray(value) && value.length ? value.map(stringifyItem) : fallback;
}

function arrayText(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(stringifyItem).filter(Boolean);
  if (typeof value === "object") return Object.entries(value).map(([key, item]) => `${key}: ${stringifyItem(item)}`);
  return [text(value)];
}

function grepLines(lines, pattern) {
  return lines.filter((line) => pattern.test(line)).map((line) => line.replace(/^[-*]\s+/, ""));
}

function valueAfterColon(line) {
  const index = line.indexOf(":");
  return index >= 0 ? line.slice(index + 1).trim() : "";
}

function text(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function stringifyItem(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim();
  return JSON.stringify(value);
}

function inferNameFromPath(file) {
  return path.basename(file, path.extname(file)).replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function safePath(file) {
  return file ? file.split("/").slice(-3).join("/") : null;
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
