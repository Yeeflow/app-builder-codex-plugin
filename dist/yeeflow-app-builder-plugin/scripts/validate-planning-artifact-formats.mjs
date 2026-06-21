#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const REQUIRED_MARKDOWN = [
  {
    kind: "Functional Specification",
    fileName: "functional-specification.md",
    jsonNames: ["functional-specification.json", "functional-specification.trace.json"],
    requiredText: [/Functional Specification/i, /Business Context/i, /Dashboard Page Requirements/i, /Business Rules/i],
    skeletalCode: "PLANNING_ARTIFACT_FUNCTIONAL_SPEC_MARKDOWN_SKELETAL",
    jsonOnlyCode: "PLANNING_ARTIFACT_FUNCTIONAL_SPEC_JSON_ONLY",
  },
  {
    kind: "Yeeflow App Plan",
    fileName: "yeeflow-app-plan.md",
    jsonNames: ["yeeflow-app-plan.json", "app-plan.json", "app-plan.trace.json"],
    requiredText: [/Yeeflow App Plan/i, /Resource Generation Order/i, /Dashboard Pages Plan/i, /Selected Yeeflow Control Type Category/i],
    skeletalCode: "PLANNING_ARTIFACT_APP_PLAN_MARKDOWN_SKELETAL",
    jsonOnlyCode: "PLANNING_ARTIFACT_APP_PLAN_JSON_ONLY",
  },
];

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-planning-artifact-formats.mjs --dir <artifact-dir> [--json]",
    "",
    "Validates that Functional Specification and Yeeflow App Plan are primary human-readable Markdown artifacts.",
    "Companion JSON trace/projection files are allowed only when they reference the Markdown source.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function add(findings, level, code, message, extra = {}) {
  findings.push({ level, code, message, ...extra });
}

function markdownLooksSkeletal(text) {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (trimmed.length < 800) return true;
  const nonEmptyLines = trimmed.split(/\r?\n/).filter((line) => line.trim()).length;
  if (nonEmptyLines < 20) return true;
  const linkOnlyLines = trimmed.split(/\r?\n/).filter((line) => /\[[^\]]+\]\([^)]+\.json\)|\.json\b/i.test(line)).length;
  if (linkOnlyLines >= Math.max(2, nonEmptyLines - 4)) return true;
  if (/^\s*(see|refer to|generated from).+\.json\s*$/i.test(trimmed)) return true;
  return false;
}

function readJson(file, findings) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    add(findings, "error", "PLANNING_ARTIFACT_COMPANION_JSON_INVALID", "Companion JSON projection must parse as JSON.", { file: path.resolve(file), error: error.message });
    return null;
  }
}

function validateCompanionJson(jsonFile, markdownFile, markdownText, findings) {
  const parsed = readJson(jsonFile, findings);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
  const source = parsed.sourceMarkdown || parsed.sourceDocument || parsed.markdownSource || parsed.source?.markdown || parsed.source?.path;
  const expected = path.basename(markdownFile);
  if (!source || path.basename(String(source)) !== expected) {
    add(findings, "error", "PLANNING_ARTIFACT_COMPANION_JSON_SOURCE_MISMATCH", "Companion JSON projection must reference the Markdown source document it projects from.", {
      file: path.resolve(jsonFile),
      expectedSource: expected,
      actualSource: source || null,
    });
  }
  const digest = parsed.sourceSha256 || parsed.markdownSha256 || parsed.source?.sha256;
  if (digest && digest !== sha256(markdownText)) {
    add(findings, "error", "PLANNING_ARTIFACT_COMPANION_JSON_HASH_MISMATCH", "Companion JSON projection source hash does not match the Markdown source document.", {
      file: path.resolve(jsonFile),
      expectedSha256: sha256(markdownText),
      actualSha256: digest,
    });
  }
}

function validateDirectory(dir) {
  const findings = [];
  const root = path.resolve(dir);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    return {
      status: "fail",
      dir: root,
      errors: 1,
      warnings: 0,
      findings: [{ level: "error", code: "PLANNING_ARTIFACT_DIR_MISSING", message: "Artifact directory does not exist.", dir: root }],
    };
  }

  const files = new Set(fs.readdirSync(root));
  for (const required of REQUIRED_MARKDOWN) {
    const mdFile = path.join(root, required.fileName);
    const companionJsonFiles = required.jsonNames.filter((name) => files.has(name)).map((name) => path.join(root, name));
    if (!files.has(required.fileName)) {
      const jsonOnly = companionJsonFiles.length > 0;
      add(
        findings,
        "error",
        jsonOnly ? required.jsonOnlyCode : "PLANNING_ARTIFACT_MARKDOWN_MISSING",
        jsonOnly
          ? `${required.kind} cannot be generated only as JSON; ${required.fileName} is required as the primary Markdown artifact.`
          : `${required.kind} primary Markdown artifact is missing: ${required.fileName}.`,
        { expectedFile: required.fileName, companionJsonFiles: companionJsonFiles.map((file) => path.resolve(file)) },
      );
      continue;
    }

    const mdText = fs.readFileSync(mdFile, "utf8").replace(/^\uFEFF/, "");
    if (markdownLooksSkeletal(mdText) || required.requiredText.some((pattern) => !pattern.test(mdText))) {
      add(findings, "error", required.skeletalCode, `${required.kind} Markdown artifact is empty, skeletal, only links to JSON, or missing required planning content.`, {
        file: path.resolve(mdFile),
      });
    }

    for (const jsonFile of companionJsonFiles) validateCompanionJson(jsonFile, mdFile, mdText, findings);
  }

  const errors = findings.filter((finding) => finding.level === "error").length;
  return {
    status: errors ? "fail" : "pass",
    dir: root,
    requiredMarkdown: REQUIRED_MARKDOWN.map((item) => item.fileName),
    errors,
    warnings: 0,
    findings,
    proofBoundary: "Planning artifact format validation checks Markdown-primary artifact presence and JSON companion consistency only; it does not prove business correctness or package/runtime behavior.",
  };
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) usage(0);
  const json = process.argv.includes("--json");
  const dir = argValue("--dir") || process.argv.slice(2).find((arg) => arg !== "--json");
  if (!dir) usage();
  const report = validateDirectory(dir);
  if (json) console.log(JSON.stringify(report, null, 2));
  else if (report.status === "pass") console.log(`planning artifact format validation passed: ${dir}`);
  else {
    console.error(`planning artifact format validation failed: ${dir}`);
    for (const finding of report.findings) console.error(`${finding.code}: ${finding.message}`);
  }
  if (report.errors) process.exitCode = 1;
}

main();
