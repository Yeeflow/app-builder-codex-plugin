#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { addFinding, readJsonFile, safePath, scalar, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

const RAW_VAR_RE = /__temp_|{{\s*__temp_|headc\.title\.variable|\btemp variable\b/i;

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.evidence) usage(args.help ? 0 : 1);
  const report = inspectVisibleKpiRuntimeBindings(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function inspectVisibleKpiRuntimeBindings({ evidence: evidencePath, claimDynamic = false } = {}) {
  const findings = [];
  let evidence;
  try {
    evidence = readJsonFile(evidencePath);
  } catch (error) {
    addFinding(findings, "error", "KPI_RUNTIME_EVIDENCE_READ_FAILED", `Could not read KPI runtime evidence metadata: ${error.message}`);
    return buildReport(evidencePath, findings);
  }

  const kpis = Array.isArray(evidence.kpis) ? evidence.kpis : [];
  if (!kpis.length) addFinding(findings, "error", "KPI_RUNTIME_EVIDENCE_KPIS_MISSING", "Runtime evidence must include visible KPI entries.");

  for (const kpi of kpis) {
    const label = scalar(kpi.label || kpi.name || "KPI");
    const text = scalar(kpi.renderedText ?? kpi.text ?? kpi.value);
    if (!text.trim()) addFinding(findings, "error", "KPI_VISIBLE_RUNTIME_BLANK", "Visible KPI heading/text rendered blank in runtime evidence.", { kpi: label });
    if (RAW_VAR_RE.test(text)) addFinding(findings, "error", "KPI_VISIBLE_RAW_VARIABLE_NAME", "Visible KPI heading/text must not show raw temp variable names.", { kpi: label });
    if (kpi.dynamicBindingClaimed === true && kpi.runtimeProven !== true) {
      addFinding(findings, "error", "KPI_DYNAMIC_BINDING_UNPROVEN", "Dynamic visible KPI binding is claimed without runtime proof.", { kpi: label });
    }
    if (kpi.fallback === true && kpi.fallbackLabeled !== true) {
      addFinding(findings, "error", "KPI_FALLBACK_UNLABELED", "Fallback KPI text is allowed only when explicitly labeled as fallback.", { kpi: label });
    }
  }

  if (claimDynamic && evidence.dynamicVisibleKpiRuntimeProven !== true) {
    addFinding(findings, "error", "KPI_DYNAMIC_VISIBLE_BINDING_NOT_PROVEN", "Dynamic visible KPI binding must not be treated as solved without runtime-proven evidence.");
  }
  if (evidence.hiddenSummaryVisible === true) {
    addFinding(findings, "error", "KPI_HIDDEN_SUMMARY_VISIBLE", "Hidden Summary controls must not appear in screenshot/runtime evidence.");
  }

  return buildReport(evidencePath, findings, { kpiCount: kpis.length, dynamicVisibleKpiRuntimeProven: evidence.dynamicVisibleKpiRuntimeProven === true });
}

function buildReport(evidencePath, findings, summary = {}) {
  return {
    status: statusFromFindings(findings),
    evidence: safePath(evidencePath),
    summary,
    proofBoundary: "Dynamic visible KPI binding is not solved unless runtime evidence proves nonblank visible values without raw variable names. Fallback values must be labeled as fallback.",
    findings,
  };
}

function parseArgs(argv) {
  const args = { claimDynamic: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--evidence") args.evidence = argv[++i];
    else if (arg === "--claim-dynamic") args.claimDynamic = true;
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/inspect-visible-kpi-runtime-bindings.mjs --evidence <runtime-evidence.json> [--claim-dynamic]");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
