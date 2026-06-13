#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { addFinding, safePath, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

const REQUIRED_FIELDS = [
  ["target page name", "UI_CONTRACT_TARGET_PAGE_MISSING"],
  ["page purpose", "UI_CONTRACT_PURPOSE_MISSING"],
  ["visual sections", "UI_CONTRACT_VISUAL_SECTIONS_MISSING"],
  ["yeeflow control mapping", "UI_CONTRACT_CONTROL_MAPPING_MISSING"],
  ["data/list bindings", "UI_CONTRACT_DATA_BINDINGS_MISSING"],
  ["kpi/summary plan", "UI_CONTRACT_KPI_PLAN_MISSING"],
  ["filter/action plan", "UI_CONTRACT_FILTER_ACTION_PLAN_MISSING"],
  ["grid/table plan", "UI_CONTRACT_GRID_TABLE_PLAN_MISSING"],
  ["status/badge plan", "UI_CONTRACT_STATUS_BADGE_PLAN_MISSING"],
  ["runtime evidence requirement", "UI_CONTRACT_RUNTIME_EVIDENCE_MISSING"],
  ["proof boundary", "UI_CONTRACT_PROOF_BOUNDARY_MISSING"],
];

const PLACEHOLDER_RE = /\b(here is the title|here is the description|lorem ipsum|placeholder|todo|coming soon|sample dashboard|scaffold)\b/i;

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.contract) {
    usage(args.help ? 0 : 1);
  }
  const report = inspectYeeflowUiDesignContract(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function inspectYeeflowUiDesignContract({ contract, highQualityClaim = false, designRequested = false, broadRestyle = false } = {}) {
  const findings = [];
  if (!contract || !fs.existsSync(contract)) {
    addFinding(findings, "error", "UI_CONTRACT_MISSING", "A page-by-page UI implementation contract is required before high-quality dashboard/UI generation.");
    return buildReport(contract, findings);
  }
  const text = fs.readFileSync(contract, "utf8").replace(/^\uFEFF/, "");
  const lower = text.toLowerCase();
  const pageSections = countPageSections(text);

  if ((highQualityClaim || broadRestyle) && pageSections === 0) {
    addFinding(findings, "error", "UI_CONTRACT_PAGE_BY_PAGE_MISSING", "High-quality UI work must include page-by-page implementation sections.");
  }
  for (const [label, code] of REQUIRED_FIELDS) {
    if (!lower.includes(label)) addFinding(findings, "error", code, `UI contract is missing required field: ${label}.`);
  }
  if (designRequested && !/design\/mockup reference|mockup reference|design reference/i.test(text)) {
    addFinding(findings, "error", "UI_CONTRACT_DESIGN_REFERENCE_MISSING", "A requested design/mockup must be mapped into the UI implementation contract.");
  }
  if (PLACEHOLDER_RE.test(text)) {
    addFinding(findings, "error", "UI_CONTRACT_PLACEHOLDER_TEXT", "UI contract or generated UI wording still contains placeholder/scaffold language.");
  }
  if (broadRestyle && pageSections < 2) {
    addFinding(findings, "error", "UI_CONTRACT_BROAD_RESTYLE_WITHOUT_PAGE_SCOPE", "Broad full-app restyling must declare page-level scope and contracts before generated-final handoff.");
  }

  return buildReport(contract, findings, { pageSections });
}

function countPageSections(text) {
  const matches = text.match(/^#{2,4}\s+(page|target page|dashboard|form):?\s+/gim);
  if (matches?.length) return matches.length;
  return (text.match(/target page name\s*:/gi) || []).length;
}

function buildReport(contract, findings, summary = {}) {
  return {
    status: statusFromFindings(findings),
    contract: safePath(contract),
    summary,
    proofBoundary: "This validates the page-by-page UI implementation contract only. Schema validation, signing, install, and upgrade acceptance are not visual runtime proof.",
    findings,
  };
}

function parseArgs(argv) {
  const args = { help: false, highQualityClaim: false, designRequested: false, broadRestyle: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--contract") args.contract = argv[++i];
    else if (arg === "--claim-high-quality-ui") args.highQualityClaim = true;
    else if (arg === "--design-requested") args.designRequested = true;
    else if (arg === "--broad-restyle") args.broadRestyle = true;
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  const out = [
    "Usage:",
    "  node scripts/inspect-yeeflow-ui-design-contract.mjs --contract <ui-contract.md> [--claim-high-quality-ui] [--design-requested] [--broad-restyle]",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(out);
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
