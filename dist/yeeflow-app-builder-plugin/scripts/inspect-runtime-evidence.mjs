#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import path from "node:path";
import { addFinding, readJsonFile, safePath, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.evidence) usage(args.help ? 0 : 1);
  const report = inspectRuntimeEvidence(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function inspectRuntimeEvidence({ evidence: evidencePath, claimHighQualityUi = false } = {}) {
  const findings = [];
  let evidence;
  try {
    evidence = readJsonFile(evidencePath);
  } catch (error) {
    addFinding(findings, "error", "RUNTIME_EVIDENCE_READ_FAILED", `Could not read runtime evidence metadata: ${error.message}`);
    return buildReport(evidencePath, findings);
  }

  if (claimHighQualityUi && evidence.runtimeScreenshotCaptured !== true) {
    addFinding(findings, "error", "UI_QUALITY_RUNTIME_SCREENSHOT_MISSING", "Runtime screenshot evidence is required before claiming high-quality UI.");
  }
  if (claimHighQualityUi && evidence.installOrSigningOnly === true) {
    addFinding(findings, "error", "INSTALL_SIGNING_NOT_UI_PROOF", "Install/signing/API acceptance is not visual runtime proof.");
  }
  if (evidence.kpiValuesVisible !== true) addFinding(findings, "error", "RUNTIME_KPI_VALUES_NOT_VISIBLE", "Runtime evidence must confirm KPI values are visible.");
  if (evidence.hiddenSummaryVisible === true) addFinding(findings, "error", "RUNTIME_HIDDEN_SUMMARY_VISIBLE", "Hidden Summary controls must not be visible at runtime.");
  if (evidence.dashboardCardsCardLike !== true) addFinding(findings, "error", "RUNTIME_DASHBOARD_CARDS_NOT_CARDLIKE", "Dashboard KPI/content sections must be card-like in runtime evidence.");
  if (evidence.filtersActionsVisible !== true) addFinding(findings, "error", "RUNTIME_FILTERS_ACTIONS_NOT_VISIBLE", "Filters/actions must be visible when planned.");
  if (evidence.tablesGridsNonScaffold !== true) addFinding(findings, "error", "RUNTIME_TABLES_GRIDS_SCAFFOLD", "Tables/grids must not be empty scaffolds in runtime evidence.");
  if (evidence.badgesDistinct !== true) addFinding(findings, "error", "RUNTIME_BADGES_NOT_DISTINCT", "Badges/chips must be visually distinct in runtime evidence.");
  if (evidence.pageLooksPlainScaffold === true) addFinding(findings, "error", "RUNTIME_PAGE_LOOKS_SCAFFOLD", "Runtime page still looks like a plain scaffold.");
  validateAsyncSummaryChartProof(evidence, findings);
  const visibleText = collectVisibleRuntimeText(evidence);
  if (/\bStart to build with Components\b/i.test(visibleText) || /\bADD NEW COMPONENT\b/i.test(visibleText)) {
    addFinding(findings, "error", "YAPK_RUNTIME_EMPTY_COMPONENT_SHELL_BLOCKER", "Runtime proof must fail when the installed app opens to Yeeflow's empty Components builder shell instead of generated app content.");
  }
  if (runtimeTargetShowsInstallFailed(evidence, visibleText)) {
    addFinding(findings, "error", "YAPK_RUNTIME_INSTALL_FAILED_TILE", "Runtime proof must fail when the installed app tile or page reports Install failed.");
  }

  return buildReport(evidencePath, findings, {
    screenshot: evidence.screenshot || evidence.screenshotPath ? path.basename(evidence.screenshot || evidence.screenshotPath) : "redacted",
    runtimeScreenshotCaptured: evidence.runtimeScreenshotCaptured === true,
    refreshAttemptCount: refreshAttemptCount(evidence),
    delayedRuntimeMaterializationProofCaptured: delayedRuntimeMaterializationProofCaptured(evidence),
  });
}

function validateAsyncSummaryChartProof(evidence, findings) {
  const summaryChartProofRequired = evidence.summaryChartRuntimeProofRequired === true
    || evidence.dashboardRuntimeMaterializationProofRequired === true
    || evidence.kpiSummaryRuntimeProofRequired === true
    || evidence.dataAnalyticsRuntimeProofRequired === true;
  if (!summaryChartProofRequired) return;

  if (!delayedRuntimeMaterializationProofCaptured(evidence)) {
    addFinding(findings, "error", "RUNTIME_ASYNC_REFRESH_WINDOW_MISSING", "Summary/KPI and Data Analytics runtime proof must include a delayed retry/refresh window before declaring success or failure.");
  }
  validateVisibleKpiNumbers(evidence, findings);
  validateChartOutputProof(evidence, findings);
}

function delayedRuntimeMaterializationProofCaptured(evidence) {
  if (evidence.delayedRuntimeMaterializationProofCaptured === true) return true;
  if (evidence.runtimeMaterialization?.delayedRefreshProofCaptured === true) return true;
  if (evidence.asyncRefreshWindow?.status === "pass") return true;
  if (evidence.delayedRuntimeProof?.status === "pass") return true;
  return refreshAttemptCount(evidence) > 0 && (evidence.finalRuntimeStateCaptured === true || evidence.refreshedRuntimeStateCaptured === true);
}

function refreshAttemptCount(evidence) {
  const attempts = evidence.refreshAttempts || evidence.runtimeRefreshAttempts || evidence.asyncRefreshWindow?.attempts || evidence.delayedRuntimeProof?.attempts;
  if (Array.isArray(attempts)) return attempts.length;
  const count = Number(evidence.refreshAttemptCount ?? evidence.asyncRefreshWindow?.attemptCount ?? evidence.delayedRuntimeProof?.attemptCount ?? 0);
  return Number.isFinite(count) ? count : 0;
}

function validateVisibleKpiNumbers(evidence, findings) {
  const kpis = collectKpiEntries(evidence);
  if (!kpis.length) {
    if (evidence.kpiValuesVisible !== true) {
      addFinding(findings, "error", "RUNTIME_KPI_NUMERIC_VALUES_MISSING", "Final delayed runtime proof must show visible KPI numbers, not only structural package validation.");
    }
    return;
  }
  const missing = [];
  for (const kpi of kpis) {
    const text = String(kpi.renderedText ?? kpi.text ?? kpi.value ?? "").trim();
    if (!/\d/.test(text)) missing.push(String(kpi.label || kpi.name || "KPI"));
  }
  if (missing.length) {
    addFinding(findings, "error", "RUNTIME_KPI_NUMERIC_VALUES_MISSING", "Final delayed runtime proof must show visible KPI numbers for every captured KPI.", { kpis: missing });
  }
}

function collectKpiEntries(evidence) {
  const entries = [];
  if (Array.isArray(evidence.kpis)) entries.push(...evidence.kpis);
  if (Array.isArray(evidence.runtimeProof?.kpis)) entries.push(...evidence.runtimeProof.kpis);
  if (Array.isArray(evidence.delayedRuntimeProof?.kpis)) entries.push(...evidence.delayedRuntimeProof.kpis);
  if (Array.isArray(evidence.finalRuntimeState?.kpis)) entries.push(...evidence.finalRuntimeState.kpis);
  return entries.filter((item) => item && typeof item === "object");
}

function validateChartOutputProof(evidence, findings) {
  const charts = collectChartEntries(evidence);
  if (!charts.length) {
    if (evidence.chartCanvasVisible === true || Number(evidence.chartCanvasCount || evidence.canvasCount || 0) > 0) {
      addFinding(findings, "error", "RUNTIME_CHART_CANVAS_ONLY_PROOF", "Chart canvas existence is not enough; final proof must show visible rendered chart output after refresh.");
      return;
    }
    if (evidence.dataAnalyticsRuntimeProofRequired === true || evidence.summaryChartRuntimeProofRequired === true) {
      addFinding(findings, "error", "RUNTIME_CHART_OUTPUT_PROOF_MISSING", "Data Analytics runtime proof must include visible rendered chart output evidence after refresh.");
    }
    return;
  }
  const canvasOnly = [];
  const missing = [];
  for (const chart of charts) {
    const name = String(chart.label || chart.name || chart.type || "chart");
    const outputVisible = chart.renderedOutputVisible === true
      || chart.visibleRenderedOutput === true
      || chart.nonEmptyRenderedOutput === true
      || chart.screenshotVisibleOutput === true;
    if (!outputVisible && (chart.canvasVisible === true || Number(chart.canvasCount || 0) > 0)) canvasOnly.push(name);
    else if (!outputVisible) missing.push(name);
  }
  if (canvasOnly.length) {
    addFinding(findings, "error", "RUNTIME_CHART_CANVAS_ONLY_PROOF", "Chart canvas existence is not enough; final proof must show visible rendered chart output after refresh.", { charts: canvasOnly });
  }
  if (missing.length) {
    addFinding(findings, "error", "RUNTIME_CHART_OUTPUT_PROOF_MISSING", "Data Analytics runtime proof must include visible rendered chart output evidence after refresh.", { charts: missing });
  }
}

function collectChartEntries(evidence) {
  const entries = [];
  for (const value of [
    evidence.charts,
    evidence.dataAnalyticsCharts,
    evidence.runtimeProof?.charts,
    evidence.delayedRuntimeProof?.charts,
    evidence.finalRuntimeState?.charts,
  ]) {
    if (Array.isArray(value)) entries.push(...value);
  }
  return entries.filter((item) => item && typeof item === "object");
}

function runtimeTargetShowsInstallFailed(evidence, visibleText) {
  const targetTitle = normalizeTitle(evidence.targetAppTitle || evidence.expectedAppTitle || evidence.appTitle || evidence.packageTitle || evidence.title);
  const tileEntries = collectAppTiles(evidence);
  if (targetTitle && tileEntries.length) {
    const matchingTiles = tileEntries.filter((tile) => tileMatchesTarget(tile, targetTitle));
    if (matchingTiles.length) {
      return matchingTiles.some((tile) => /install failed|failed/i.test(tileText(tile)));
    }
  }
  return /\bInstall failed\b/i.test(visibleText) || /failed/i.test(String(evidence.appTileStatus || evidence.installTileStatus || ""));
}

function collectAppTiles(evidence) {
  const tiles = [];
  for (const key of ["appTiles", "tiles", "applicationTiles", "workspaceTiles"]) {
    if (Array.isArray(evidence[key])) tiles.push(...evidence[key]);
  }
  if (evidence.appTile && typeof evidence.appTile === "object") tiles.push(evidence.appTile);
  if (evidence.installTile && typeof evidence.installTile === "object") tiles.push(evidence.installTile);
  return tiles.filter((tile) => tile && typeof tile === "object");
}

function tileMatchesTarget(tile, normalizedTargetTitle) {
  return [
    tile.title,
    tile.name,
    tile.appName,
    tile.label,
    tile.text,
    tile.visibleText,
    tile.ariaLabel,
  ].some((value) => normalizeTitle(value) === normalizedTargetTitle);
}

function tileText(tile) {
  return [
    tile.title,
    tile.name,
    tile.status,
    tile.appTileStatus,
    tile.installTileStatus,
    tile.text,
    tile.visibleText,
    tile.bodyText,
  ].filter((value) => value !== undefined && value !== null).map(String).join("\n");
}

function normalizeTitle(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function collectVisibleRuntimeText(evidence) {
  const values = [
    evidence.visibleText,
    evidence.pageText,
    evidence.bodyText,
    evidence.runtimeText,
    evidence.html,
    evidence.text,
    ...(Array.isArray(evidence.pages) ? evidence.pages.flatMap((page) => [page.visibleText, page.pageText, page.bodyText, page.html, page.text]) : []),
  ];
  return values.filter((value) => typeof value === "string").join("\n");
}

function buildReport(evidencePath, findings, summary = {}) {
  return {
    status: statusFromFindings(findings),
    evidence: safePath(evidencePath),
    summary,
    unavailableMessage: "When runtime evidence is unavailable, reports must say: UI runtime proof not completed; dynamic KPI visible binding not proven; install/signing is not visual runtime proof.",
    proofBoundary: "This gate validates redacted runtime evidence metadata. It does not perform live screenshot capture. Structural package validation, Version Management Succeed, chart canvas existence, and absence of raw temp-variable text are not final Dashboard runtime proof; Summary/KPI and chart claims require delayed refresh evidence with visible KPI numbers and visible rendered chart output.",
    findings,
  };
}

function parseArgs(argv) {
  const args = { claimHighQualityUi: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--evidence") args.evidence = argv[++i];
    else if (arg === "--claim-high-quality-ui") args.claimHighQualityUi = true;
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/inspect-runtime-evidence.mjs --evidence <runtime-evidence.json> [--claim-high-quality-ui]");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
