#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const CATEGORIES = [
  { key: "businessObjects", spec: "Business Objects and Data Concepts", plan: ["Requirement-to-Yeeflow Resource Mapping Summary", "Data Lists and Document Libraries Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_BUSINESS_OBJECT_UNMAPPED", coverage: /data list|document library|master|transaction|reference|deferred|not applicable|N\/A/i },
  { key: "relationships", spec: "Business Relationships and Dependency Rules", plan: ["Data Lists and Document Libraries Plan", "Custom Data List Forms Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_RELATIONSHIP_UNMAPPED", coverage: /lookup|sublist|relationship|related|parent|child|deferred|not applicable|N\/A/i },
  { key: "approvals", spec: "Approval and Review Requirements", plan: ["Approval Forms Plan", "Form Reports Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_APPROVAL_REQUIREMENT_UNMAPPED", coverage: /approval form|approval workflow|no approval|not applicable|deferred|N\/A/i },
  { key: "forms", spec: "Data Entry and Form Requirements", plan: ["Approval Forms Plan", "Custom Data List Forms Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_FORM_REQUIREMENT_UNMAPPED", coverage: /submission form|task form|custom .*form|new\/edit|field|placeholder|deferred|not applicable|N\/A/i },
  { key: "workflows", spec: "Workflow, Automation, and Action Requirements", plan: ["Approval Forms Plan", "Schedule Workflows Plan", "Data List Workflows Plan", "Notifications Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_WORKFLOW_REQUIREMENT_UNMAPPED", coverage: /workflow|automation|form action|schedule|notification|trigger|deferred|not applicable|N\/A/i },
  { key: "reporting", spec: "Reporting, Dashboard, and Analytics Requirements", plan: ["Form Reports Plan", "Data List Views Plan", "Dashboard Pages Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_REPORTING_REQUIREMENT_UNMAPPED", coverage: /form report|view|dashboard|analytics|KPI|chart|deferred|not applicable|N\/A/i },
  { key: "documents", spec: "Document and Attachment Requirements", plan: ["Data Lists and Document Libraries Plan", "Approval Forms Plan", "Custom Data List Forms Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_DOCUMENT_REQUIREMENT_UNMAPPED", coverage: /document library|attachment|file|upload|print|deferred|not applicable|N\/A/i },
  { key: "ai", spec: "AI, Copilot, and Intelligent Assistance Requirements", plan: ["AI Agents Plan", "Copilots Plan", "Approval Forms Plan", "Schedule Workflows Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_AI_REQUIREMENT_UNMAPPED", coverage: /AI Agent|Copilot|AI Assistant|no AI|not applicable|deferred|N\/A/i },
  { key: "integrations", spec: "Integration Requirements", plan: ["Plugin Capability and Standards Compliance", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_INTEGRATION_REQUIREMENT_UNMAPPED", coverage: /integration|post-import|external|webhook|API|deferred|not applicable|N\/A/i },
  { key: "permissions", spec: "Permissions and Access Requirements", plan: ["Target Users, Roles, Groups, and Permissions", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_PERMISSION_REQUIREMENT_UNMAPPED", coverage: /role|permission|view|create|edit|approve|admin|group|deferred|not applicable|N\/A/i },
  { key: "ui", spec: "UI and Experience Requirements", plan: ["Dashboard Pages Plan", "Custom Data List Forms Plan", "Application Navigation Plan", "Plugin Capability and Standards Compliance", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_UI_REQUIREMENT_UNMAPPED", coverage: /dashboard|form|navigation|control|layout|page|UI|deferred|not applicable|N\/A/i },
];

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-functional-spec-to-app-plan-traceability.mjs --spec <functional-spec.md> --plan <app-plan.md> [--json]",
    "",
    "Validates planning traceability only. No API calls are made.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function normalizeTitle(title) {
  return title.replace(/^\d+\.\s*/, "").trim().toLowerCase();
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
    sections.push({ heading: lines[index].trim(), title: match[2].trim(), normalizedTitle: normalizeTitle(match[2]), body: lines.slice(index + 1, end).join("\n") });
  }
  return sections;
}

function sectionBody(sections, title) {
  const wanted = title.toLowerCase();
  return sections.find((section) => section.normalizedTitle === wanted || section.normalizedTitle.includes(wanted))?.body ?? "";
}

function meaningful(sectionText) {
  const stripped = sectionText
    .replace(/\|?\s*:?-{3,}:?\s*\|?/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/Examples?:[\s\S]*/i, "")
    .trim();
  if (!stripped) return false;
  if (/\b(no .* required|not applicable|N\/A|none required|no .+ identified)\b/i.test(stripped)) return false;
  return /[A-Za-z0-9]{3,}/.test(stripped);
}

function deferredWithoutReason(planText) {
  const findings = [];
  for (const line of planText.split(/\r?\n/)) {
    if (!/\bdeferred\b|runtime-proof-required|export-learning-required/i.test(line)) continue;
    if (!/\breason\b|\bfallback\b|\bimpact\b|\bproof\b|\bfollow-up\b|because|until|post-import/i.test(line)) {
      findings.push(line.trim());
    }
  }
  return findings;
}

function validate(specFile, planFile) {
  const specText = fs.readFileSync(specFile, "utf8").replace(/^\uFEFF/, "");
  const planText = fs.readFileSync(planFile, "utf8").replace(/^\uFEFF/, "");
  const specSections = extractSections(specText);
  const planSections = extractSections(planText);
  const findings = [];
  const categories = {};
  const coverage = {};
  const unmappedRequirementCategories = [];

  for (const category of CATEGORIES) {
    const specBody = sectionBody(specSections, category.spec);
    const hasRequirement = meaningful(specBody);
    const planBody = category.plan.map((title) => sectionBody(planSections, title)).join("\n");
    const covered = !hasRequirement || category.coverage.test(planBody);
    categories[category.key] = { specSection: category.spec, required: hasRequirement, covered };
    coverage[category.key] = { planSections: category.plan, matched: covered };
    if (hasRequirement && !covered) {
      unmappedRequirementCategories.push(category.key);
      findings.push({
        level: "error",
        code: category.code,
        category: category.key,
        specSection: category.spec,
        planSections: category.plan,
        message: `${category.spec} contains requirements with no matching App Plan resource, planning, not-applicable, or deferred coverage.`,
      });
    }
  }

  for (const line of deferredWithoutReason(planText)) {
    findings.push({
      level: "error",
      code: "TRACEABILITY_DEFERRED_WITHOUT_REASON",
      category: "deferred",
      message: "Deferred App Plan item lacks nearby reason, fallback, proof impact, or follow-up.",
      line,
    });
  }

  return {
    status: findings.length ? "fail" : "pass",
    spec: path.resolve(specFile),
    plan: path.resolve(planFile),
    categories,
    coverage,
    findings,
    unmappedRequirementCategories,
    proofBoundary: "Functional Spec to App Plan traceability checks planning coverage only; it does not prove generated package conformance or runtime behavior.",
  };
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) usage(0);
  const json = process.argv.includes("--json");
  const spec = argValue("--spec");
  const plan = argValue("--plan");
  if (!spec || !plan) usage();
  const missing = [spec, plan].filter((file) => !fs.existsSync(file));
  if (missing.length) {
    const report = { status: "fail", errors: missing.length, findings: missing.map((file) => ({ level: "error", code: "TRACEABILITY_FILE_MISSING", file: path.resolve(file), message: "Required input file does not exist." })) };
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  const report = validate(spec, plan);
  if (json) console.log(JSON.stringify(report, null, 2));
  else if (report.status === "pass") console.log("functional specification to app plan traceability validation passed");
  else {
    console.error("functional specification to app plan traceability validation failed");
    for (const finding of report.findings) console.error(`${finding.code}: ${finding.message}`);
  }
  if (report.status === "fail") process.exitCode = 1;
}

main();
