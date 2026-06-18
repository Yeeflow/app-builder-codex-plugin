#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const FAIL_STATUS = /\b(unanswered|pending|TBD|to be confirmed|requires clarification|not answered|open)\b/i;
const PASS_STATUS = /\b(answered|default-approved|default approved|approved default|resolved|not applicable|N\/A)\b/i;
const PAUSED = /generation is paused|paused until .*answered|stop before .*generation|cannot proceed .*until/i;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-business-clarification-gate.mjs --spec <functional-spec.md> --plan <app-plan.md> [--json]",
    "  node scripts/validate-business-clarification-gate.mjs --spec <functional-spec.md> [--json]",
    "  node scripts/validate-business-clarification-gate.mjs --plan <app-plan.md> [--json]",
    "",
    "Validates business clarification gate readiness from Markdown only. No API calls are made.",
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
  const lines = section.body.split(/\r?\n/).filter((line) => /^\s*\|.*\|\s*$/.test(line));
  const tables = [];
  for (let index = 0; index < lines.length - 1; index++) {
    const header = splitTableRow(lines[index]);
    const separator = splitTableRow(lines[index + 1]);
    if (!isSeparatorRow(separator)) continue;
    const rows = [];
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex++) {
      const cells = splitTableRow(lines[rowIndex]);
      if (!cells.length || isSeparatorRow(cells)) break;
      rows.push(cells);
    }
    tables.push({ header, rows });
  }
  return tables;
}

function gateSections(text) {
  return extractSections(text).filter((section) => /business decision gates|business clarification|clarification gate|generation contract and hard gates/i.test(section.title));
}

function rowValue(header, row, names) {
  const index = header.findIndex((cell) => names.some((name) => new RegExp(`^${name}$`, "i").test(cell)));
  return index === -1 ? "" : row[index] ?? "";
}

function analyzeFile(file, kind) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const sections = gateSections(text);
  const findings = [];
  const warnings = [];

  if (!sections.length) {
    findings.push({
      level: "error",
      code: "BUSINESS_CLARIFICATION_SECTION_MISSING",
      file: path.resolve(file),
      section: null,
      message: `${kind} does not include a Business Decision Gates or Business Clarification section.`,
    });
  }

  for (const section of sections) {
    if (PAUSED.test(section.body)) {
      findings.push({
        level: "error",
        code: "BUSINESS_CLARIFICATION_GENERATION_PAUSED",
        file: path.resolve(file),
        section: section.heading,
        statusText: section.body.match(PAUSED)?.[0] ?? "",
        message: "Document states generation is paused until clarification is answered.",
      });
    }

    const tables = tableRows(section);
    for (const table of tables) {
      const hasGateColumns = table.header.some((cell) => /key|question|gate/i.test(cell));
      if (!hasGateColumns) continue;
      const statusIndex = table.header.findIndex((cell) => /^status$/i.test(cell));
      const answerIndex = table.header.findIndex((cell) => /answer|default approval|recommended default|default/i.test(cell));
      if (statusIndex === -1 && answerIndex === -1) {
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
        const statusText = [statusIndex === -1 ? "" : row[statusIndex] ?? "", answerIndex === -1 ? "" : row[answerIndex] ?? ""].join(" ").trim();
        const gateKey = rowValue(table.header, row, ["Key", "Gate", "ID"]);
        const question = rowValue(table.header, row, ["Question", "Decision", "Gate Question"]);
        if (!statusText || /^<.*>$/.test(statusText)) {
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
  if (!spec && !plan) usage();

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
    reports.push(analyzeFile(file, kind));
  }

  const findings = [...errors, ...reports.flatMap((report) => report.findings)];
  const warnings = reports.flatMap((report) => report.warnings);
  const report = {
    status: findings.length ? "fail" : "pass",
    errors: findings.length,
    warnings: warnings.length,
    findings,
    spec: spec ? path.resolve(spec) : null,
    plan: plan ? path.resolve(plan) : null,
    proofBoundary: "Business clarification gate document readiness only; this does not prove the business answer is correct.",
  };

  if (json) console.log(JSON.stringify(report, null, 2));
  else if (report.status === "pass") console.log("business clarification gate validation passed");
  else {
    console.error("business clarification gate validation failed");
    for (const finding of findings) console.error(`${finding.code}: ${finding.message}`);
  }
  if (findings.length) process.exitCode = 1;
}

main();
