#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { addFinding, readJsonFile, safePath, scalar, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

const RAW_VAR_RE = /__temp_|{{\s*__temp_|headc\.title\.variable|\btemp variable\b/i;
const PROVEN_UUID_SUMMARY_SHAPE = "uuid-summary-v1.0.1";

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
    if (evidence.dynamicVisibleKpiRuntimeProven === true && kpi.fallback === true) {
      addFinding(findings, "error", "KPI_DYNAMIC_PROOF_USES_FALLBACK", "Dynamic KPI proof must not rely on static or formatted fallback values.", { kpi: label });
    }
  }

  if (evidence.dynamicVisibleKpiRuntimeProven === true) {
    validateProvenUuidSummaryRuntimeEvidence(evidence, findings);
  }
  if (claimDynamic && evidence.dynamicVisibleKpiRuntimeProven !== true) {
    addFinding(findings, "error", "KPI_DYNAMIC_VISIBLE_BINDING_NOT_PROVEN", "Dynamic visible KPI binding must not be treated as solved unless the exact UUID Summary v1.0.1 shape and before/after runtime mutation evidence prove it.");
  }
  if (evidence.hiddenSummaryVisible === true) {
    addFinding(findings, "error", "KPI_HIDDEN_SUMMARY_VISIBLE", "Hidden Summary controls must not appear in screenshot/runtime evidence.");
  }

  return buildReport(evidencePath, findings, {
    kpiCount: kpis.length,
    dynamicVisibleKpiRuntimeProven: evidence.dynamicVisibleKpiRuntimeProven === true,
    provenShape: evidence.dynamicVisibleKpiRuntimeProven === true ? scalar(evidence.dynamicBindingShape || evidence.provenBindingShape) : null,
  });
}

function buildReport(evidencePath, findings, summary = {}) {
  return {
    status: statusFromFindings(findings),
    evidence: safePath(evidencePath),
    summary,
    proofBoundary: "Dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape with before/after source data mutation evidence and refreshed/recalculated runtime evidence. Other shapes remain unproven; fallback values must be labeled as fallback.",
    findings,
  };
}

function validateProvenUuidSummaryRuntimeEvidence(evidence, findings) {
  const shape = scalar(evidence.dynamicBindingShape || evidence.provenBindingShape);
  if (shape !== PROVEN_UUID_SUMMARY_SHAPE) {
    addFinding(findings, "error", "KPI_DYNAMIC_PROOF_SHAPE_UNSUPPORTED", "Dynamic visible KPI proof is accepted only for the exact UUID Summary v1.0.1 shape.", { shape: shape || null });
  }
  const summaryIds = Array.isArray(evidence.summaryControlIds)
    ? evidence.summaryControlIds
    : Array.isArray(evidence.summaryControls?.ids)
      ? evidence.summaryControls.ids
      : [];
  if (!summaryIds.length) {
    addFinding(findings, "error", "KPI_DYNAMIC_PROOF_SUMMARY_IDS_MISSING", "Dynamic KPI proof requires the Summary control UUIDs used by the proven shape.");
  }
  for (const summaryId of summaryIds) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(scalar(summaryId))) {
      addFinding(findings, "error", "KPI_DYNAMIC_PROOF_SUMMARY_ID_NOT_UUID", "The proven dynamic KPI shape does not cover semantic or non-UUID Summary IDs.", { summaryId: scalar(summaryId) || null });
    }
  }
  if (scalar(evidence.visibleBindingShape) !== "attrs.headc.title.variable[]") {
    addFinding(findings, "error", "KPI_DYNAMIC_PROOF_VISIBLE_BINDING_SHAPE_UNPROVEN", "The proven dynamic KPI shape requires visible Heading/Text controls to bind through attrs.headc.title.variable[].", { visibleBindingShape: scalar(evidence.visibleBindingShape) || null });
  }

  const proof = evidence.mutationProof || evidence.beforeAfterMutationProof || {};
  const before = proof.beforeValues || proof.before || {};
  const after = proof.afterValues || proof.after || {};
  const expectedAfter = proof.expectedAfterValues || proof.expectedAfter || after;
  const labels = new Set([...Object.keys(before), ...Object.keys(after), ...Object.keys(expectedAfter)]);
  if (!labels.size) {
    addFinding(findings, "error", "KPI_DYNAMIC_PROOF_MUTATION_VALUES_MISSING", "Dynamic KPI proof requires before/after expected-value evidence.");
  }
  let changedCount = 0;
  for (const label of labels) {
    const beforeValue = scalar(before[label]);
    const afterValue = scalar(after[label]);
    const expectedValue = scalar(expectedAfter[label]);
    if (!beforeValue || !afterValue || !expectedValue) {
      addFinding(findings, "error", "KPI_DYNAMIC_PROOF_MUTATION_VALUE_INCOMPLETE", "Dynamic KPI proof requires complete before, after, and expected-after values for each KPI.", { kpi: label });
      continue;
    }
    if (beforeValue !== afterValue) changedCount += 1;
    if (afterValue !== expectedValue) {
      addFinding(findings, "error", "KPI_DYNAMIC_PROOF_EXPECTED_VALUE_MISMATCH", "After-mutation runtime values must match expected recalculated KPI values.", { kpi: label });
    }
  }
  if (labels.size && changedCount === 0) {
    addFinding(findings, "error", "KPI_DYNAMIC_PROOF_STALE_AFTER_EVIDENCE", "After-mutation evidence did not change from before evidence; wait for refreshed/recalculated runtime state before claiming dynamic KPI proof.");
  }
  if (proof.sourceDataMutated !== true) {
    addFinding(findings, "error", "KPI_DYNAMIC_PROOF_SOURCE_MUTATION_MISSING", "Dynamic KPI proof requires source data mutation evidence.");
  }
  if (proof.refreshedRecalculatedRuntimeEvidenceCaptured !== true) {
    addFinding(findings, "error", "KPI_DYNAMIC_PROOF_REFRESHED_RUNTIME_MISSING", "Dynamic KPI proof requires refreshed/recalculated after-evidence because Summary recalculation can be asynchronous or cache-delayed.");
  }
  if (!scalar(proof.asyncRecalculationNote || proof.cacheDelayNote).trim()) {
    addFinding(findings, "warning", "KPI_DYNAMIC_PROOF_ASYNC_NOTE_MISSING", "Runtime proof should note that Summary recalculation can be asynchronous or cache-delayed.");
  }
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
