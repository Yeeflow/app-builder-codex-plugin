#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const FAIL_STATUS = /\b(unanswered|pending|TBD|to be confirmed|requires clarification|not answered|open)\b/i;
const PASS_STATUS = /\b(answered|resolved|not applicable|N\/A)\b/i;
const PLANNING_DEFAULT_STATUS = /\b(default-applied-for-planning|default approved for planning|default-approved for planning)\b/i;
const GENERATION_DEFAULT_STATUS = /\b(user-default-approved-for-generation|user default approved for generation|user approved default for generation)\b/i;
const AMBIGUOUS_DEFAULT_STATUS = /\b(default-approved|default approved|approved default)\b/i;
const DEFERRED_STATUS = /\b(deferred|runtime-proof-required|export-learning-required)\b/i;
const PAUSED = /generation is paused|paused until .*answered|stop before .*generation|cannot proceed .*until/i;
const NON_BUSINESS_GATE_SECTION = /\b(generation contract|hard gates?|required gates?|validation plan|generation validation|proof boundary|schema|signing|runtime|package validation|advanced capability|plan-to-package)\b/i;
const BUSINESS_GATE_SECTION = /\bbusiness\b.*\b(decision|decisions|clarification|clarifications)\b|\b(decision|decisions|clarification|clarifications)\b.*\bbusiness\b/i;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-business-clarification-gate.mjs --spec <functional-spec.md> --plan <app-plan.md> [--mode planning|generation] [--json]",
    "  node scripts/validate-business-clarification-gate.mjs --spec <functional-spec.md> [--mode planning|generation] [--json]",
    "  node scripts/validate-business-clarification-gate.mjs --plan <app-plan.md> [--mode planning|generation] [--json]",
    "",
    "Validates business clarification gate readiness from Markdown only. No API calls are made.",
    "Default mode is generation, which blocks defaults that were only applied for planning.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function normalizeHeading(line) {
  return line.trim().replace(/\s+/g, " ");
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
    sections.push({
      heading: normalizeHeading(lines[index]),
      title: match[2].trim(),
      line: index + 1,
      body: lines.slice(index + 1, end).join("\n"),
    });
  }
  return sections;
}

function splitTableRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isSeparatorRow(cells) {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function tableRows(section) {
  const lines = section.body.split(/\r?\n/);
  const tables = [];
  for (let index = 0; index < lines.length - 1; index++) {
    if (!/^\s*\|.*\|\s*$/.test(lines[index]) || !/^\s*\|.*\|\s*$/.test(lines[index + 1])) continue;
    const header = splitTableRow(lines[index]);
    const separator = splitTableRow(lines[index + 1]);
    if (!isSeparatorRow(separator)) continue;
    const rows = [];
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex++) {
      if (!/^\s*\|.*\|\s*$/.test(lines[rowIndex])) break;
      const cells = splitTableRow(lines[rowIndex]);
      if (!cells.length || isSeparatorRow(cells)) break;
      rows.push(cells);
    }
    tables.push({ header, rows });
  }
  return tables;
}

function gateSections(text) {
  return extractSections(text).filter((section) => BUSINESS_GATE_SECTION.test(section.title) && !NON_BUSINESS_GATE_SECTION.test(section.title));
}

function rowValue(header, row, names) {
  const index = header.findIndex((cell) => names.some((name) => new RegExp(`^${name}$`, "i").test(cell)));
  return index === -1 ? "" : row[index] ?? "";
}

function rowHasDeferredReason(header, row) {
  const rowText = row.join(" ");
  const headerText = header.join(" ");
  const hasReasonColumn = /\b(reason|fallback|proof|impact|follow-up|why|handling)\b/i.test(headerText);
  const hasImpactLanguage = /\b(fallback|proof|impact|generation impact|follow-up|because|manual|post-import|runtime)\b/i.test(rowText);
  const hasSubstantiveDeferredCell = row.some((cell, index) => /\b(reason|fallback|proof|impact|why|handling)\b/i.test(header[index] ?? "") && /\b\w{3,}\b/.test(cell.replace(DEFERRED_STATUS, "")));
  return hasImpactLanguage && (!hasReasonColumn || hasSubstantiveDeferredCell);
}

function hasWarningOrErrorIntegrity(report) {
  const warningFindings = report.findings.filter((finding) => finding.level === "warning").length;
  const errorFindings = report.findings.filter((finding) => finding.level === "error").length;
  return report.warnings === warningFindings && report.errors === errorFindings;
}

const UNRESOLVED_GATE_CODES = new Set([
  "BUSINESS_CLARIFICATION_UNANSWERED_GATE",
  "BUSINESS_CLARIFICATION_STATUS_MISSING",
  "BUSINESS_CLARIFICATION_DEFAULT_APPLIED_FOR_PLANNING",
  "BUSINESS_CLARIFICATION_DEFAULT_ONLY_FOR_PLANNING",
  "BUSINESS_CLARIFICATION_AMBIGUOUS_DEFAULT_APPROVAL",
  "BUSINESS_CLARIFICATION_STATUS_UNRECOGNIZED",
]);

function normalizeGateKey(value) {
  return String(value ?? "")
    .trim()
    .replace(/^`|`$/g, "")
    .replace(/^<|>$/g, "")
    .replace(/\s+/g, " ");
}

function summarizeUniqueUnresolvedGates(findings) {
  const gateMap = new Map();
  for (const finding of findings) {
    if (!UNRESOLVED_GATE_CODES.has(finding.code)) continue;
    const gateKey = normalizeGateKey(finding.gateKey);
    const question = normalizeGateKey(finding.question);
    if (!gateKey && !question) continue;
    const key = gateKey || question;
    const existing = gateMap.get(key) ?? {
      key,
      question: question || null,
      occurrences: [],
    };
    if (!existing.question && question) existing.question = question;
    existing.occurrences.push({
      level: finding.level,
      code: finding.code,
      file: finding.file,
      section: finding.section ?? null,
      statusText: finding.statusText ?? "",
    });
    gateMap.set(key, existing);
  }
  const gates = [...gateMap.values()].sort((left, right) => left.key.localeCompare(right.key));
  return {
    rawFindingCount: findings.length,
    uniqueUnresolvedGateCount: gates.length,
    uniqueUnresolvedGateKeys: gates.map((gate) => gate.key),
    gateOccurrences: Object.fromEntries(gates.map((gate) => [gate.key, gate.occurrences])),
  };
}

function analyzeFile(file, kind, mode) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const sections = gateSections(text);
  const findings = [];
  const warnings = [];

  if (PAUSED.test(text)) {
    findings.push({
      level: "error",
      code: "BUSINESS_CLARIFICATION_GENERATION_PAUSED",
      file: path.resolve(file),
      section: null,
      statusText: text.match(PAUSED)?.[0] ?? "",
      message: "Document states generation is paused until clarification is answered.",
    });
  }

  if (!sections.length) {
    warnings.push({
      level: "warning",
      code: "BUSINESS_CLARIFICATION_SECTION_MISSING",
      file: path.resolve(file),
      section: null,
      message: `${kind} does not include an explicit Business Decision Gates or Business Clarification section.`,
    });
  }

  for (const section of sections) {
    const tables = tableRows(section);
    for (const table of tables) {
      const hasGateColumns = table.header.some((cell) => /key|question|gate/i.test(cell));
      if (!hasGateColumns) continue;
      const statusIndex = table.header.findIndex((cell) => /^status$/i.test(cell));
      const answerIndex = table.header.findIndex((cell) => /answer|default approval|recommended default|default/i.test(cell));
      if (statusIndex === -1 || answerIndex === -1) {
        findings.push({
          level: "error",
          code: "BUSINESS_CLARIFICATION_STATUS_MISSING",
          file: path.resolve(file),
          section: section.heading,
          message: "Business Decision Gates table is missing status, answer, or default approval information.",
        });
      }
      for (const row of table.rows) {
        if (row.every((cell) => !cell || /^<.*>$/.test(cell))) continue;
        const statusCell = statusIndex === -1 ? "" : row[statusIndex] ?? "";
        const answerCell = answerIndex === -1 ? "" : row[answerIndex] ?? "";
        const statusText = [statusCell, answerCell].join(" ").trim();
        const gateKey = rowValue(table.header, row, ["Key", "Gate", "ID"]);
        const question = rowValue(table.header, row, ["Question", "Decision", "Gate Question"]);
        if (!statusCell.trim() || /^<.*>$/.test(statusCell.trim()) || !answerCell.trim() || /^<.*>$/.test(answerCell.trim())) {
          findings.push({
            level: "error",
            code: "BUSINESS_CLARIFICATION_STATUS_MISSING",
            file: path.resolve(file),
            section: section.heading,
            gateKey,
            question,
            statusText,
            message: "Business decision gate row is missing status, answer, or default approval information.",
          });
        } else if (FAIL_STATUS.test(statusText)) {
          findings.push({
            level: "error",
            code: "BUSINESS_CLARIFICATION_UNANSWERED_GATE",
            file: path.resolve(file),
            section: section.heading,
            gateKey,
            question,
            statusText,
            message: "Business decision gate is still unanswered or pending.",
          });
        } else if (DEFERRED_STATUS.test(statusText) && !rowHasDeferredReason(table.header, row)) {
          findings.push({
            level: "error",
            code: "BUSINESS_CLARIFICATION_STATUS_MISSING",
            file: path.resolve(file),
            section: section.heading,
            gateKey,
            question,
            statusText,
            message: "Deferred business decision gates must include reason, fallback, proof impact, or follow-up evidence.",
          });
        } else if (PLANNING_DEFAULT_STATUS.test(statusText)) {
          if (mode === "generation") {
            findings.push({
              level: "error",
              code: "BUSINESS_CLARIFICATION_DEFAULT_ONLY_FOR_PLANNING",
              file: path.resolve(file),
              section: section.heading,
              gateKey,
              question,
              statusText,
              message: "Default was applied for planning only and does not authorize generation.",
            });
          } else {
            warnings.push({
              level: "warning",
              code: "BUSINESS_CLARIFICATION_DEFAULT_APPLIED_FOR_PLANNING",
              file: path.resolve(file),
              section: section.heading,
              gateKey,
              question,
              statusText,
              message: "Default is applied for planning only; generation remains blocked until the user answers or approves defaults for generation.",
            });
          }
        } else if (GENERATION_DEFAULT_STATUS.test(statusText)) {
          // Explicit user generation approval is accepted in both modes.
        } else if (AMBIGUOUS_DEFAULT_STATUS.test(statusText)) {
          findings.push({
            level: "error",
            code: "BUSINESS_CLARIFICATION_AMBIGUOUS_DEFAULT_APPROVAL",
            file: path.resolve(file),
            section: section.heading,
            gateKey,
            question,
            statusText,
            message: "Ambiguous default-approved wording must be replaced with default-applied-for-planning or user-default-approved-for-generation.",
          });
        } else if (!PASS_STATUS.test(statusText)) {
          warnings.push({
            level: "warning",
            code: "BUSINESS_CLARIFICATION_STATUS_UNRECOGNIZED",
            file: path.resolve(file),
            section: section.heading,
            gateKey,
            question,
            statusText,
            message: "Business decision gate status is not a standard pass/fail keyword.",
          });
        }
      }
    }

    for (const line of section.body.split(/\r?\n/)) {
      if (!/^\s*[-*]\s+/.test(line)) continue;
      if (FAIL_STATUS.test(line)) {
        findings.push({
          level: "error",
          code: "BUSINESS_CLARIFICATION_UNANSWERED_GATE",
          file: path.resolve(file),
          section: section.heading,
          statusText: line.trim(),
          message: "Business decision gate bullet is still unanswered or pending.",
        });
      }
    }
  }

  return { kind, file: path.resolve(file), findings, warnings };
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) usage(0);
  const json = process.argv.includes("--json");
  const spec = argValue("--spec");
  const plan = argValue("--plan");
  const mode = argValue("--mode") ?? "generation";
  if (!spec && !plan) usage();
  if (!["planning", "generation"].includes(mode)) usage();

  const reports = [];
  const errors = [];
  for (const [file, kind] of [[spec, "spec"], [plan, "plan"]]) {
    if (!file) continue;
    if (!fs.existsSync(file)) {
      errors.push({
        level: "error",
        code: "BUSINESS_CLARIFICATION_FILE_MISSING",
        file: path.resolve(file),
        message: `${kind} file does not exist.`,
      });
      continue;
    }
    reports.push(analyzeFile(file, kind, mode));
  }

  const findings = [...errors, ...reports.flatMap((report) => report.findings)];
  const warnings = reports.flatMap((report) => report.warnings);
  const allFindings = [...findings, ...warnings];
  const unresolvedSummary = summarizeUniqueUnresolvedGates(allFindings);
  const report = {
    status: findings.length ? "fail" : "pass",
    errors: findings.length,
    warnings: warnings.length,
    findings: allFindings,
    rawFindingCount: unresolvedSummary.rawFindingCount,
    uniqueUnresolvedGateCount: unresolvedSummary.uniqueUnresolvedGateCount,
    uniqueUnresolvedGateKeys: unresolvedSummary.uniqueUnresolvedGateKeys,
    gateOccurrences: unresolvedSummary.gateOccurrences,
    spec: spec ? path.resolve(spec) : null,
    plan: plan ? path.resolve(plan) : null,
    mode,
    proofBoundary: "Business clarification gate document readiness only; this does not prove the business answer is correct.",
  };
  if (!hasWarningOrErrorIntegrity(report)) {
    report.status = "fail";
    report.errors += 1;
    report.findings.push({
      level: "error",
      code: "BUSINESS_CLARIFICATION_REPORT_INTEGRITY_MISMATCH",
      message: "Warning/error counts must match warning/error findings.",
    });
  }

  if (json) console.log(JSON.stringify(report, null, 2));
  else if (report.status === "pass") console.log("business clarification gate validation passed");
  else {
    console.error("business clarification gate validation failed");
    for (const finding of findings) console.error(`${finding.code}: ${finding.message}`);
  }
  if (report.errors) process.exitCode = 1;
}

main();
