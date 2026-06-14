#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PLACEHOLDER_RE = /\b(lorem ipsum|here is the title|here is the description|placeholder|todo|coming soon|sample dashboard|scaffold)\b/i;
const RAW_VARIABLE_RE = /\{\{[^}]+\}\}|\$\{[^}]+\}|\btemp(?:Var|_var| variable)?[:.\w-]*\b|@[A-Za-z0-9_.-]+/i;

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.contract || !args.runtimeEvidence) usage(args.help ? 0 : 1);
  const report = compareDesignToRuntimeStructure(args);
  const rendered = args.format === "markdown" ? renderMarkdown(report) : `${JSON.stringify(report, null, 2)}\n`;
  if (args.out) fs.writeFileSync(args.out, rendered);
  else process.stdout.write(rendered);
  process.exit(report.status === "fail" || (args.strict && report.status === "warning") ? 1 : 0);
}

export function compareDesignToRuntimeStructure({
  contract: contractPath,
  runtimeEvidence: runtimeEvidencePath,
  designImage,
  out,
  format = "json",
  strict = false,
} = {}) {
  const findings = [];
  const pageResults = [];
  const reviewRequired = Boolean(designImage);
  let contract;
  let evidence;

  if (!contractPath) addFinding(findings, "error", "CONTRACT_MISSING", "UI implementation contract path is required.");
  else {
    try {
      contract = normalizeContract(readContract(contractPath));
    } catch (error) {
      addFinding(findings, "error", "CONTRACT_READ_FAILED", `Could not read UI contract: ${error.message}`);
    }
  }

  if (!runtimeEvidencePath) addFinding(findings, "error", "RUNTIME_EVIDENCE_MISSING", "Runtime evidence path is required.");
  else {
    try {
      evidence = normalizeEvidence(readJson(runtimeEvidencePath));
    } catch (error) {
      addFinding(findings, "error", "RUNTIME_EVIDENCE_MISSING", `Could not read runtime evidence: ${error.message}`);
    }
  }

  if (designImage) {
    addFinding(
      findings,
      "warning",
      "DESIGN_IMAGE_PARSE_REVIEW_REQUIRED",
      "Design image was supplied as a referenced artifact only; no reliable image parser was used, so human visual review is required.",
      { designImagePath: safePath(designImage) },
    );
  }

  if (evidence && !evidence.trustedCapture) {
    addFinding(
      findings,
      "warning",
      "RUNTIME_EVIDENCE_WEAK",
      "Runtime evidence does not include trusted Phase 1 capture metadata and should be treated as weaker hand-written evidence.",
    );
  }

  if (contract && evidence) {
    comparePage(contract, evidence, findings, pageResults);
    compareSections(contract, evidence, findings, pageResults);
    compareKpis(contract, evidence, findings, pageResults);
    compareTables(contract, evidence, findings, pageResults);
    compareFiltersActions(contract, evidence, findings, pageResults);
    compareBadges(contract, evidence, findings, pageResults);
    compareHierarchy(contract, evidence, findings, pageResults);
    comparePlaceholders(evidence, findings, pageResults);
    compareProofBoundaries(evidence, findings, pageResults);
  }

  const status = statusFromFindings(findings);
  return {
    status,
    summary: summarize(status, findings, strict),
    contractPath: safePath(contractPath),
    designImagePath: designImage ? safePath(designImage) : undefined,
    runtimeEvidencePath: safePath(runtimeEvidencePath),
    comparisonMode: "contract-runtime",
    reviewRequired,
    findings,
    pageResults,
    proofBoundary: [
      "This structural comparison checks contract expectations against redacted runtime evidence.",
      "It is not pixel-perfect visual diffing and does not claim full automatic design-image understanding.",
      "Design images require human review unless a reliable parser is explicitly available.",
      "Install, signing, import, upgrade, API acceptance, and package validation are not runtime visual evidence.",
      "Static visible KPI values do not establish dynamic KPI proof; before/after mutation evidence remains required by the existing KPI/runtime validators.",
      "Screenshot status and redacted paths are helpful evidence, but screenshots are not mandatory unless high-quality visual proof is claimed.",
    ],
    nextActions: nextActions(findings),
    strict,
    output: out ? safePath(out) : null,
    format,
  };
}

function comparePage(contract, evidence, findings, pageResults) {
  const result = pageResult(contract.pageName);
  if (!evidence.pageOpened) {
    addFinding(findings, "error", "PAGE_MISSING", `Expected page "${contract.pageName}" was not opened in runtime evidence.`);
    result.status = "fail";
  }
  if (contract.pageName && evidence.visibleTitle && !looselyMatches(evidence.visibleTitle, contract.pageName)) {
    addFinding(
      findings,
      "warning",
      "PAGE_TITLE_MISMATCH",
      `Runtime title "${evidence.visibleTitle}" does not closely match expected page "${contract.pageName}".`,
      { expected: contract.pageName, actual: evidence.visibleTitle },
    );
    result.status = downgrade(result.status, "warning");
  }
  pageResults.push(result);
}

function compareSections(contract, evidence, findings, pageResults) {
  if (!contract.sections.length) return;
  const result = pageResult(contract.pageName, "sections");
  const actualNames = evidence.sections.map((section) => section.name);
  for (const section of contract.sections) {
    if (!containsLoose(actualNames, section.name)) {
      addFinding(findings, "error", "SECTION_MISSING", `Expected section "${section.name}" was not visible in runtime evidence.`, { section: section.name });
      result.status = "fail";
    }
  }
  if (contract.sections.length > 1 && actualNames.length) {
    const expectedOrder = contract.sections.map((section) => section.name);
    if (!orderApproximatelyPreserved(expectedOrder, actualNames)) {
      addFinding(findings, "warning", "SECTION_ORDER_WEAK", "Expected section order is not clearly preserved by runtime evidence.", { expectedOrder, actualOrder: actualNames });
      result.status = downgrade(result.status, "warning");
    }
  } else if (contract.sections.length > 1 && !actualNames.length) {
    addFinding(findings, "warning", "SECTION_ORDER_WEAK", "Runtime evidence does not include enough ordered section metadata to prove section order.");
    result.status = downgrade(result.status, "warning");
  }
  pageResults.push(result);
}

function compareKpis(contract, evidence, findings, pageResults) {
  if (!contract.kpis.length && !contract.expectedKpiCount) return;
  const result = pageResult(contract.pageName, "kpis");
  const actual = evidence.kpis;
  const expectedCount = contract.expectedKpiCount || contract.kpis.length;
  if (expectedCount && actual.length < expectedCount) {
    addFinding(findings, "error", "KPI_CARD_COUNT_MISMATCH", `Expected ${expectedCount} KPI cards but runtime evidence includes ${actual.length}.`, { expectedCount, actualCount: actual.length });
    result.status = "fail";
  }
  for (const kpi of contract.kpis) {
    const match = actual.find((item) => looselyMatches(item.label, kpi.label));
    if (!match) {
      addFinding(findings, "error", "KPI_LABEL_MISSING", `Expected KPI label "${kpi.label}" was not visible.`, { label: kpi.label });
      result.status = "fail";
      continue;
    }
    if (!String(match.renderedText || match.value || "").trim()) {
      addFinding(findings, "error", "KPI_VALUE_MISSING", `Expected KPI "${kpi.label}" has no visible runtime value.`, { label: kpi.label });
      result.status = "fail";
    }
  }
  if (expectedCount && evidence.cardSignals.length < Math.min(expectedCount, 2)) {
    addFinding(findings, "warning", "KPI_CARD_VISUAL_TREATMENT_WEAK", "KPI cards are structurally present but card-like visual treatment is weak or not captured.", { cardSignals: evidence.cardSignals.length });
    result.status = downgrade(result.status, "warning");
  }
  pageResults.push(result);
}

function compareTables(contract, evidence, findings, pageResults) {
  if (!contract.tables.length) return;
  const result = pageResult(contract.pageName, "tables");
  const actualTableNames = evidence.tables.map((table) => table.name);
  for (const table of contract.tables) {
    const hasNamedEvidence = actualTableNames.length > 0 || evidence.sections.length > 0;
    const tablePresent = !table.section
      || containsLoose(actualTableNames, table.section)
      || containsLoose(evidence.sections.map((section) => section.name), table.section)
      || (!hasNamedEvidence && evidence.headers.length > 0);
    if (!tablePresent) {
      addFinding(findings, "error", "TABLE_SECTION_MISSING", `Expected table section "${table.section}" was not visible.`, { section: table.section });
      result.status = "fail";
      continue;
    }
    for (const header of table.headers) {
      if (!containsLoose(evidence.headers, header)) {
        addFinding(findings, "error", "TABLE_COLUMN_MISSING", `Expected table column "${header}" was not visible.`, { column: header, table: table.section });
        result.status = "fail";
      }
    }
    const hasRows = evidence.rows.length > 0;
    const hasEmptyState = evidence.emptyStates.some((state) => looselyMatches(state, table.emptyState || "empty"));
    if (!hasRows && !hasEmptyState) {
      addFinding(findings, "error", "TABLE_EMPTY_WITHOUT_EMPTY_STATE", `Table "${table.section}" has no rows and no meaningful empty state.`, { table: table.section });
      result.status = "fail";
    }
  }
  if (evidence.tableLooksScaffold) {
    addFinding(findings, "error", "TABLE_LOOKS_LIKE_SCAFFOLD", "Runtime grid/table evidence still looks like an empty scaffold.");
    result.status = "fail";
  }
  pageResults.push(result);
}

function compareFiltersActions(contract, evidence, findings, pageResults) {
  if (!contract.filters.length && !contract.actions.length) return;
  const result = pageResult(contract.pageName, "filters-actions");
  for (const filter of contract.filters) {
    if (!containsLoose(evidence.filters, filter)) {
      addFinding(findings, "error", "FILTER_MISSING", `Expected filter "${filter}" was not visible.`, { filter });
      result.status = "fail";
    }
  }
  for (const action of contract.actions) {
    if (!containsLoose(evidence.actions, action)) {
      addFinding(findings, "error", "ACTION_MISSING", `Expected action "${action}" was not visible.`, { action });
      result.status = "fail";
    }
  }
  if ((contract.actions.length || contract.filters.length) && evidence.actionStylePlain) {
    addFinding(findings, "warning", "ACTION_BUTTON_STYLE_TOO_PLAIN", "Action/filter controls are visible but style evidence is plain or scaffold-like.");
    result.status = downgrade(result.status, "warning");
  }
  pageResults.push(result);
}

function compareBadges(contract, evidence, findings, pageResults) {
  if (!contract.badges.length) return;
  const result = pageResult(contract.pageName, "badges");
  for (const badge of contract.badges) {
    if (!containsLoose(evidence.badges, badge)) {
      addFinding(findings, "error", "BADGE_FIELD_MISSING", `Expected badge/status field "${badge}" was not visible.`, { badge });
      result.status = "fail";
    }
  }
  if (evidence.badges.length && !evidence.badgesDistinct) {
    addFinding(findings, "warning", "BADGE_VISUAL_TREATMENT_MISSING", "Badge/status values are visible but distinct badge-like treatment is not captured.");
    result.status = downgrade(result.status, "warning");
  }
  pageResults.push(result);
}

function compareHierarchy(contract, evidence, findings, pageResults) {
  const expectsHierarchy = contract.sections.length || contract.kpis.length || contract.tables.length;
  if (!expectsHierarchy) return;
  const result = pageResult(contract.pageName, "visual-hierarchy");
  if (evidence.pageLooksPlainScaffold) {
    addFinding(findings, "error", "PAGE_LOOKS_LIKE_PLAIN_SCAFFOLD", "Runtime evidence indicates the page still looks like a plain scaffold.");
    result.status = "fail";
  }
  if (evidence.cardSignals.length === 0 && expectsHierarchy) {
    addFinding(findings, "warning", "SECTION_SPACING_TOO_FLAT", "Runtime evidence does not include card-like section or spacing hierarchy signals.");
    result.status = downgrade(result.status, "warning");
  }
  pageResults.push(result);
}

function comparePlaceholders(evidence, findings, pageResults) {
  const result = pageResult(evidence.visibleTitle || "runtime", "placeholder-scan");
  for (const text of evidence.placeholderMatches) {
    addFinding(findings, "error", "PLACEHOLDER_TEXT_VISIBLE", `Placeholder or filler text is visible: "${text}".`, { text });
    result.status = "fail";
  }
  for (const text of evidence.rawVariableMatches) {
    addFinding(findings, "error", "RAW_VARIABLE_TEXT_VISIBLE", `Raw variable-like text is visible: "${text}".`, { text });
    result.status = "fail";
  }
  pageResults.push(result);
}

function compareProofBoundaries(evidence, findings, pageResults) {
  const result = pageResult(evidence.visibleTitle || "runtime", "proof-boundary");
  if (evidence.installOrSigningOnly) {
    addFinding(findings, "error", "RUNTIME_EVIDENCE_MISSING", "Install/signing/API success alone is not runtime UI evidence.");
    result.status = "fail";
  }
  if (evidence.dynamicKpiClaimed && !evidence.dynamicKpiProven) {
    addFinding(findings, "warning", "DYNAMIC_KPI_PROOF_NOT_ESTABLISHED", "Structural comparison found visible KPI values, but dynamic KPI proof still requires before/after mutation evidence.");
    result.status = downgrade(result.status, "warning");
  } else if (!evidence.dynamicKpiProven && evidence.kpis.length) {
    addFinding(findings, "warning", "DYNAMIC_KPI_PROOF_NOT_ESTABLISHED", "Static visible KPI values are structural evidence only; dynamic KPI proof is not established by this comparator.");
    result.status = downgrade(result.status, "warning");
  }
  if (evidence.highQualityVisualClaimed && !evidence.screenshotCaptured) {
    addFinding(findings, "warning", "RUNTIME_EVIDENCE_WEAK", "High-quality visual proof was claimed, but screenshot evidence is unavailable.");
    result.status = downgrade(result.status, "warning");
  }
  pageResults.push(result);
}

function normalizeContract(raw) {
  const source = typeof raw === "string" ? parseMarkdownContract(raw) : raw;
  const pageName = text(source.targetPageName || source.pageName || source["target page name"] || source.targetPage || "Target page");
  const sections = normalizeNamedItems(source.visualSections || source.sections || source["visual sections"]);
  const kpiSource = source.kpiSummaryPlan || source.kpis || source.metrics || source["kpi/summary plan"];
  const kpis = normalizeNamedItems(kpiSource, ["label", "name", "title"]);
  const filtersActions = source.filterActionPlan || source.filtersActions || source["filter/action plan"] || {};
  const filters = [
    ...normalizeStringItems(filtersActions.filters || source.filters),
    ...inferItemsFromLines(Array.isArray(filtersActions) ? filtersActions : [], /filter|search|segment|date|status/i),
  ];
  const actions = [
    ...normalizeStringItems(filtersActions.actions || source.actions),
    ...inferItemsFromLines(Array.isArray(filtersActions) ? filtersActions : [], /action|button|export|create|open|view|chip/i),
  ];
  const tables = normalizeTables(source.gridTablePlan || source.tables || source.grids || source["grid/table plan"]);
  const badges = normalizeStringItems(source.statusBadgePlan || source.badges || source.statuses || source["status/badge plan"]);
  return {
    pageName,
    sections,
    kpis,
    expectedKpiCount: Number(source.expectedKpiCount || source.kpiCardCount || 0),
    filters: unique(filters),
    actions: unique(actions),
    tables,
    badges: unique(badges),
  };
}

function normalizeEvidence(raw) {
  const pages = Array.isArray(raw?.pages) ? raw.pages : [];
  const sections = normalizeNamedItems(raw.visibleSections || raw.sections || pages.flatMap((page) => page.visibleSections || page.sections || []));
  const tableObjects = normalizeEvidenceTables(raw.tables || raw.grids || pages.flatMap((page) => page.tables || page.grids || []));
  const headers = unique([
    ...normalizeStringItems(raw.gridTableHeaders),
    ...pages.flatMap((page) => normalizeStringItems(page.gridTableHeaders)),
    ...tableObjects.flatMap((table) => table.headers),
  ]);
  const rows = [
    ...normalizeRows(raw.gridTableRows),
    ...pages.flatMap((page) => normalizeRows(page.gridTableRows)),
    ...tableObjects.flatMap((table) => table.rows),
  ];
  const allVisibleText = unique([
    raw.visibleTitle,
    ...normalizeStringItems(raw.visibleText),
    ...normalizeStringItems(raw.filters),
    ...normalizeStringItems(raw.actions),
    ...normalizeStringItems(raw.badgeLikeCells),
    ...normalizeStringItems(raw.cardLikeSectionSignals),
    ...headers,
    ...rows.flat(),
    ...normalizeKpis(raw.kpis).flatMap((kpi) => [kpi.label, kpi.renderedText, kpi.value]),
    ...pages.flatMap((page) => [
      page.visibleTitle,
      ...normalizeStringItems(page.visibleText),
      ...normalizeStringItems(page.filters),
      ...normalizeStringItems(page.actions),
      ...normalizeStringItems(page.badgeLikeCells),
      ...normalizeStringItems(page.cardLikeSectionSignals),
      ...normalizeKpis(page.kpis).flatMap((kpi) => [kpi.label, kpi.renderedText, kpi.value]),
    ]),
  ]).filter(Boolean);
  const placeholderMatches = unique([
    ...normalizeStringItems(raw.placeholderFillerTextScan?.matches),
    ...normalizeStringItems(raw.placeholderMatches),
    ...pages.flatMap((page) => normalizeStringItems(page.placeholderMatches)),
    ...allVisibleText.filter((item) => PLACEHOLDER_RE.test(item)),
  ]);
  const rawVariableMatches = unique([
    ...normalizeStringItems(raw.rawVariableMatches),
    ...pages.flatMap((page) => normalizeStringItems(page.rawVariableMatches)),
    ...allVisibleText.filter((item) => RAW_VARIABLE_RE.test(item)),
  ]);
  const cardSignals = unique([
    ...normalizeStringItems(raw.cardLikeSectionSignals),
    ...pages.flatMap((page) => normalizeStringItems(page.cardLikeSectionSignals)),
  ]);
  const screenshotCaptured = raw.runtimeScreenshotCaptured === true || raw.screenshotEvidence?.status === "captured-redacted" || raw.screenshotStatus === "captured-redacted";
  const trustedCapture = raw.schema === "yeeflow-redacted-runtime-ui-evidence/v1" || normalizeStringItems(raw.captureNotes).some((note) => /captured|redacted pages json|safe fetch/i.test(note));
  return {
    pageOpened: raw.pageOpened === true || pages.some((page) => page.pageOpened === true),
    visibleTitle: text(raw.visibleTitle || pages.find((page) => page.visibleTitle)?.visibleTitle),
    kpis: [...normalizeKpis(raw.kpis), ...pages.flatMap((page) => normalizeKpis(page.kpis))],
    filters: unique([...normalizeStringItems(raw.filters), ...pages.flatMap((page) => normalizeStringItems(page.filters))]),
    actions: unique([...normalizeStringItems(raw.actions), ...pages.flatMap((page) => normalizeStringItems(page.actions))]),
    headers,
    rows,
    tables: tableObjects,
    emptyStates: unique([...normalizeStringItems(raw.emptyStates), ...pages.flatMap((page) => normalizeStringItems(page.emptyStates))]),
    badges: unique([...normalizeStringItems(raw.badgeLikeCells), ...normalizeStringItems(raw.badges), ...pages.flatMap((page) => [...normalizeStringItems(page.badgeLikeCells), ...normalizeStringItems(page.badges)])]),
    badgesDistinct: raw.badgesDistinct === true || normalizeStringItems(raw.badgeLikeCells).length > 0 || pages.some((page) => normalizeStringItems(page.badgeLikeCells).length > 0),
    cardSignals,
    sections,
    placeholderMatches,
    rawVariableMatches,
    pageLooksPlainScaffold: raw.pageLooksPlainScaffold === true || raw.placeholderFillerTextScan?.found === true,
    tableLooksScaffold: raw.tablesGridsNonScaffold === false && headers.length > 0 && rows.length === 0,
    actionStylePlain: raw.actionButtonStylePlain === true || raw.actionStylePlain === true,
    installOrSigningOnly: raw.installOrSigningOnly === true || raw.apiSuccessOnly === true,
    dynamicKpiClaimed: raw.dynamicVisibleKpiRuntimeClaimed === true || raw.dynamicKpiClaimed === true || normalizeKpis(raw.kpis).some((kpi) => kpi.dynamicBindingClaimed),
    dynamicKpiProven: raw.dynamicVisibleKpiRuntimeProven === true,
    highQualityVisualClaimed: raw.claimHighQualityVisualProof === true || raw.highQualityVisualProofClaimed === true,
    screenshotCaptured,
    trustedCapture,
  };
}

function readContract(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  if (file.toLowerCase().endsWith(".json")) return JSON.parse(raw);
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function parseMarkdownContract(raw) {
  const lines = raw.split(/\r?\n/);
  const result = {};
  let current = "";
  for (const line of lines) {
    const heading = line.match(/^#{2,4}\s+(.+?)\s*$/);
    if (heading) {
      current = keyForHeading(heading[1]);
      result[current] ||= [];
      continue;
    }
    const page = line.match(/^##\s+Page:\s*(.+?)\s*$/i);
    if (page) result["target page name"] = page[1].trim();
    const kv = line.match(/^([^:]{3,60}):\s*(.+)$/);
    if (kv && /target page name|page purpose/i.test(kv[1])) result[keyForHeading(kv[1])] = kv[2].trim();
    const bullet = line.match(/^\s*[-*]\s+(.+?)\s*$/);
    if (bullet && current) result[current].push(bullet[1].trim());
  }
  return result;
}

function keyForHeading(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim()
    .replace("visual sections", "visual sections")
    .replace("kpi summary plan", "kpi/summary plan")
    .replace("filter action plan", "filter/action plan")
    .replace("grid table plan", "grid/table plan")
    .replace("status badge plan", "status/badge plan");
}

function normalizeNamedItems(value, keys = ["name", "label", "title", "section"]) {
  if (!value) return [];
  const items = Array.isArray(value?.items) ? value.items : Array.isArray(value) ? value : [value];
  return items.map((item, index) => {
    if (typeof item === "string" || typeof item === "number") return { name: cleanLabel(item), label: cleanLabel(item), order: index };
    const label = keys.map((key) => item?.[key]).find(Boolean) || item?.text || item?.value || `Item ${index + 1}`;
    return { ...item, name: cleanLabel(label), label: cleanLabel(label), order: item.order ?? index };
  }).filter((item) => item.name);
}

function normalizeTables(value) {
  if (!value) return [];
  const items = Array.isArray(value?.tables) ? value.tables : Array.isArray(value?.items) ? value.items : Array.isArray(value) ? value : [value];
  if (items.every((item) => typeof item === "string")) {
    const headers = items.map(cleanLabel).filter((item) => !/grid|table|section|row|empty/i.test(item));
    const section = cleanLabel(items.find((item) => /grid|table|section/i.test(item)) || "Primary table");
    return [{ section, headers, emptyState: "" }];
  }
  return items.map((item, index) => ({
    section: cleanLabel(item.section || item.name || item.title || item.label || `Table ${index + 1}`),
    headers: unique(normalizeStringItems(item.headers || item.columns || item.fields)),
    emptyState: cleanLabel(item.emptyState || item.empty || ""),
  })).filter((table) => table.section || table.headers.length);
}

function normalizeEvidenceTables(value) {
  if (!value) return [];
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => ({
    name: cleanLabel(item.name || item.section || item.title || `Table ${index + 1}`),
    headers: unique(normalizeStringItems(item.headers || item.columns || item.gridTableHeaders)),
    rows: normalizeRows(item.rows || item.gridTableRows),
  }));
}

function normalizeKpis(value) {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  return items.map((item, index) => {
    if (typeof item === "string" || typeof item === "number") return { label: `KPI ${index + 1}`, renderedText: text(item), value: text(item) };
    return {
      label: text(item.label || item.name || item.title || `KPI ${index + 1}`),
      renderedText: text(item.renderedText ?? item.text ?? item.value ?? ""),
      value: text(item.value ?? item.renderedText ?? item.text ?? ""),
      dynamicBindingClaimed: item.dynamicBindingClaimed === true,
    };
  });
}

function normalizeRows(value) {
  if (!Array.isArray(value)) return [];
  return value.map((row) => Array.isArray(row) ? row.map(text) : Object.values(row || {}).map(text)).filter((row) => row.length);
}

function normalizeStringItems(value) {
  if (value === undefined || value === null) return [];
  const items = Array.isArray(value?.items) ? value.items : Array.isArray(value) ? value : [value];
  return items.flatMap((item) => {
    if (Array.isArray(item)) return item.map(cleanLabel);
    if (item && typeof item === "object") return [cleanLabel(item.label || item.name || item.title || item.text || item.value || item.field || item.header)];
    return [cleanLabel(item)];
  }).filter(Boolean);
}

function inferItemsFromLines(lines, pattern) {
  return normalizeStringItems(lines).filter((line) => pattern.test(line)).map((line) => line.replace(/^(filters?|actions?|buttons?)\s*:\s*/i, "").trim());
}

function containsLoose(values, expected) {
  return values.some((value) => looselyMatches(value, expected));
}

function looselyMatches(actual, expected) {
  const a = normalizeComparable(actual);
  const e = normalizeComparable(expected);
  return Boolean(a && e && (a === e || a.includes(e) || e.includes(a)));
}

function orderApproximatelyPreserved(expected, actual) {
  let cursor = -1;
  for (const item of expected) {
    const index = actual.findIndex((value, current) => current > cursor && looselyMatches(value, item));
    if (index === -1) return false;
    cursor = index;
  }
  return true;
}

function addFinding(findings, level, code, message, detail = {}) {
  findings.push({ level, code, message, ...redactDetail(detail) });
}

function statusFromFindings(findings) {
  if (findings.some((finding) => finding.level === "error")) return "fail";
  if (findings.some((finding) => finding.level === "warning")) return "warning";
  return "pass";
}

function summarize(status, findings, strict) {
  const counts = {
    errors: findings.filter((finding) => finding.level === "error").length,
    warnings: findings.filter((finding) => finding.level === "warning").length,
  };
  if (status === "pass") return `Structural contract-runtime comparison passed with ${counts.warnings} warnings.`;
  if (status === "warning") return `Structural contract-runtime comparison completed with ${counts.warnings} warnings${strict ? " and strict mode will exit nonzero" : ""}.`;
  return `Structural contract-runtime comparison failed with ${counts.errors} errors and ${counts.warnings} warnings.`;
}

function nextActions(findings) {
  const actions = [];
  if (findings.some((finding) => finding.code === "DESIGN_IMAGE_PARSE_REVIEW_REQUIRED")) actions.push("Complete human visual review of the design image or provide reliable parsed design metadata.");
  if (findings.some((finding) => finding.code.startsWith("KPI_"))) actions.push("Align KPI labels/counts and visible values with the UI contract, then recapture redacted runtime evidence.");
  if (findings.some((finding) => finding.code.startsWith("TABLE_"))) actions.push("Repair table/grid sections, headers, rows, or empty states before UI-quality claims.");
  if (findings.some((finding) => finding.code === "DYNAMIC_KPI_PROOF_NOT_ESTABLISHED")) actions.push("Run existing KPI/runtime before-after mutation proof before claiming dynamic KPI binding.");
  if (!actions.length) actions.push("Keep this report with the UI proof bundle and run existing hard gates before package handoff.");
  return actions;
}

function pageResult(pageName, area = "page") {
  return { pageName, area, status: "pass" };
}

function downgrade(current, candidate) {
  if (current === "fail") return current;
  return candidate;
}

function renderMarkdown(report) {
  const lines = [
    "# Design-To-Runtime Structure Findings",
    "",
    `Status: ${report.status}`,
    `Comparison mode: ${report.comparisonMode}`,
    `Review required: ${report.reviewRequired ? "yes" : "no"}`,
    "",
    "## Summary",
    report.summary,
    "",
    "## Findings",
  ];
  if (!report.findings.length) lines.push("- None");
  for (const finding of report.findings) lines.push(`- ${finding.level.toUpperCase()} ${finding.code}: ${finding.message}`);
  lines.push("", "## Proof Boundary");
  for (const item of report.proofBoundary) lines.push(`- ${item}`);
  lines.push("", "## Next Actions");
  for (const item of report.nextActions) lines.push(`- ${item}`);
  return `${lines.join("\n")}\n`;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function parseArgs(argv) {
  const args = { format: "json", strict: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--contract") args.contract = argv[++i];
    else if (arg === "--runtime-evidence") args.runtimeEvidence = argv[++i];
    else if (arg === "--design-image") args.designImage = argv[++i];
    else if (arg === "--out" || arg === "-o") args.out = argv[++i];
    else if (arg === "--format") args.format = argv[++i] === "markdown" ? "markdown" : "json";
    else if (arg === "--strict") args.strict = true;
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  const out = [
    "Usage:",
    "  node scripts/compare-design-to-runtime-structure.mjs --contract <ui-contract.md|json> --runtime-evidence <runtime-evidence.redacted.json> [--design-image <mockup.png|jpg>] [--out <findings.json>] [--format json|markdown] [--strict]",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(out);
  process.exit(exitCode);
}

function text(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function cleanLabel(value) {
  return text(value).replace(/^[A-Za-z /_-]+:\s*/, "").trim();
}

function normalizeComparable(value) {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function unique(values) {
  return [...new Set(values.map(text).filter(Boolean))];
}

function safePath(file) {
  return file ? file.split(path.sep).slice(-3).join("/") : undefined;
}

function redactDetail(detail) {
  const safe = {};
  for (const [key, value] of Object.entries(detail || {})) {
    if (/payload|resource|sign|token|secret|raw|url/i.test(key)) continue;
    safe[key] = value;
  }
  return safe;
}

function isMainModule() {
  return process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
}
