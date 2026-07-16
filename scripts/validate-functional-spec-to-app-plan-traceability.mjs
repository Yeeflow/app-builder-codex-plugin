#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {
  findMarkdownTable,
  isNegativeRequirementStatement,
  markdownRowValue,
  positivePlanningText,
} from "./lib/markdown-planning-utils.mjs";

const CATEGORIES = [
  { key: "businessObjects", spec: "Business Objects and Data Requirements", plan: ["Requirement-to-Yeeflow Resource Mapping Summary", "Data Lists and Document Libraries Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_BUSINESS_OBJECT_UNMAPPED", coverage: /data list|document library|master|transaction|reference|deferred|not applicable|N\/A/i },
  { key: "relationships", spec: "Business Relationships and Dependency Rules", plan: ["Data Lists and Document Libraries Plan", "Custom Data List Forms Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_RELATIONSHIP_UNMAPPED", coverage: /lookup|sublist|relationship|related|parent|child|deferred|not applicable|N\/A/i },
  { key: "approvals", spec: "Approval and Review Requirements", plan: ["Approval Forms Plan", "Form Reports Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_APPROVAL_REQUIREMENT_UNMAPPED", coverage: /approval form|approval workflow|no approval|not applicable|deferred|N\/A/i },
  { key: "forms", spec: "Data Entry and Form Requirements", plan: ["Approval Forms Plan", "Custom Data List Forms Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_FORM_REQUIREMENT_UNMAPPED", coverage: /submission form|task form|custom .*form|new\/edit|field|placeholder|deferred|not applicable|N\/A/i },
  { key: "workflows", spec: "Workflow and Notification Requirements", plan: ["Approval Forms Plan", "Schedule Workflows Plan", "Data List Workflows Plan", "Notifications Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_WORKFLOW_REQUIREMENT_UNMAPPED", coverage: /workflow|automation|form action|schedule|notification|trigger|deferred|not applicable|N\/A/i },
  { key: "reporting", spec: "Dashboard Page Requirements", plan: ["Form Reports Plan", "Data List Views Plan", "Dashboard Pages Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_REPORTING_REQUIREMENT_UNMAPPED", coverage: /form report|view|dashboard|analytics|KPI|chart|deferred|not applicable|N\/A/i },
  { key: "auditReporting", spec: "Reporting and Audit Requirements", plan: ["Form Reports Plan", "Data List Views Plan", "Dashboard Pages Plan", "Deferred or Runtime-Proof Items"], code: "TRACEABILITY_AUDIT_REPORTING_REQUIREMENT_UNMAPPED", coverage: /form report|view|dashboard|analytics|audit|history|compliance|KPI|chart|deferred|not applicable|N\/A/i },
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

function deferredWithoutReason(planSections) {
  const findings = [];
  const section = sectionBody(planSections, "Deferred or Runtime-Proof Items");
  if (!section.trim()) return findings;
  const table = findMarkdownTable(section, ["Item", "Category", "Reason", "Fallback"]);
  if (table) {
    for (const row of table.rows) {
      const disposition = markdownRowValue(table, row, ["Category", "Disposition", "Status"]);
      if (!/\b(deferred|runtime-proof-required|export-learning-required|post-import-config)\b/i.test(disposition)) continue;
      const reason = markdownRowValue(table, row, ["Reason", "Why"]);
      const fallback = markdownRowValue(table, row, ["Fallback", "Alternative"]);
      const impact = markdownRowValue(table, row, ["User Impact", "Impact", "Generation Impact"]);
      const proof = markdownRowValue(table, row, ["Required Proof or Follow-up", "Proof", "Follow-up", "Required Proof"]);
      const missing = [
        ["reason", reason],
        ["fallback", fallback],
        ["impact", impact],
        ["proof/follow-up", proof],
      ].filter(([, value]) => !value || /^(?:none|n\/a|not provided|tbd)$/i.test(value)).map(([name]) => name);
      if (missing.length) findings.push({ line: row.raw, missing });
    }
    return findings;
  }
  for (const line of section.split(/\r?\n/)) {
    if (isNegativeRequirementStatement(line)) continue;
    if (!/^\s*[-*]\s+/.test(line) || !/\b(deferred|runtime-proof-required|export-learning-required)\b/i.test(line)) continue;
    const missing = ["reason", "fallback", "impact", "proof|follow-up"].filter((marker) => !new RegExp(`\\b(?:${marker})\\b\\s*:`, "i").test(line));
    if (missing.length) findings.push({ line: line.trim(), missing });
  }
  return findings;
}

function requirementIds(text) {
  const withoutTemplatePlaceholders = String(text || "").replace(/<[^>]+>/g, " ");
  return [...new Set(withoutTemplatePlaceholders.match(/\b(?:REQ|FS)-[A-Z0-9][A-Z0-9_-]*\b/gi) || [])].map((id) => id.toUpperCase());
}

function hasRelevantDeferredCoverage(planText, topicPattern) {
  return planText.split(/\r?\n/).some((line) => topicPattern.test(line) && /\b(deferred|runtime-proof-required|export-learning-required|not applicable|N\/A)\b/i.test(line));
}

function addSpecializedTraceabilityFindings(specText, planText, findings, unmappedRequirementCategories, coverage) {
  specText = positivePlanningText(specText);
  planText = positivePlanningText(planText);
  const recordDisplayNeed = /\b(card list|cards|board|status board|work board|timeline|history|audit|activity feed|event feed|list view|record display|record list|queue)\b/i;
  const recordDisplayCovered = /\b(Data table|Collection|Kanban|Vertical Timeline|Horizontal Timeline|Vertical timeline|Horizontal timeline)\b/i;
  if (recordDisplayNeed.test(specText) && !recordDisplayCovered.test(planText) && !hasRelevantDeferredCoverage(planText, /\b(record display|card|cards|board|timeline|history|audit|activity|queue|dashboard)\b/i)) {
    unmappedRequirementCategories.push("recordDisplayControls");
    coverage.recordDisplayControls = { matched: false, planSections: ["Dashboard Pages Plan", "Data List Views Plan", "Deferred or Runtime-Proof Items"] };
    findings.push({
      level: "error",
      code: "TRACEABILITY_RECORD_DISPLAY_CONTROL_UNMAPPED",
      category: "recordDisplayControls",
      message: "Functional Specification describes record display needs, but the App Plan does not map them to Data table, Collection, Kanban, Vertical Timeline, Horizontal Timeline, or explicit deferred coverage.",
    });
  } else {
    coverage.recordDisplayControls = { matched: true, planSections: ["Dashboard Pages Plan", "Data List Views Plan", "Deferred or Runtime-Proof Items"] };
  }

  const itemActionNeed = /\b(item-level action|item action|bulk action|bulk update|bulk delete|edit item|delete item|update item|status update|current item|selected item|selection toolbar|mark .* complete)\b/i;
  const itemActionCovered = /\b(Collection\/Kanban item actions|Collection and Kanban Item Actions|current item context|No Collection\/Kanban item actions required|setdatalist|update row|bulk toolbar)\b/i;
  if (itemActionNeed.test(specText) && !itemActionCovered.test(planText) && !hasRelevantDeferredCoverage(planText, /\b(item action|bulk action|status update|current item|selected item|Collection|Kanban)\b/i)) {
    unmappedRequirementCategories.push("itemActions");
    coverage.itemActions = { matched: false, planSections: ["Dashboard Pages Plan", "Deferred or Runtime-Proof Items"] };
    findings.push({
      level: "error",
      code: "TRACEABILITY_ITEM_ACTION_UNMAPPED",
      category: "itemActions",
      message: "Functional Specification describes item or bulk actions, but the App Plan does not include Collection/Kanban action planning or explicit deferred coverage.",
    });
  } else {
    coverage.itemActions = { matched: true, planSections: ["Dashboard Pages Plan", "Deferred or Runtime-Proof Items"] };
  }

  const subListNeed = /\b(line item|line items|request item|request items|invoice item|invoice items|quotation item|quotation items|sublist rows|sub-list rows|Sub List|repeated row|repeated rows|row-level operation|row operation|row operations|duplicate row|delete row|insert row|move row)\b/i;
  const subListCovered = /\b(Sub List List Actions|No custom Sub List actions required|current row context|summary fields affected|parent field binding)\b/i;
  if (subListNeed.test(specText) && !subListCovered.test(planText) && !hasRelevantDeferredCoverage(planText, /\b(Sub List|line item|request item|invoice item|quotation item|row-level|row action|duplicate row|delete row|insert row|move row)\b/i)) {
    unmappedRequirementCategories.push("subListActions");
    coverage.subListActions = { matched: false, planSections: ["Approval Forms Plan", "Custom Data List Forms Plan", "Deferred or Runtime-Proof Items"] };
    findings.push({
      level: "error",
      code: "TRACEABILITY_SUB_LIST_ACTION_UNMAPPED",
      category: "subListActions",
      message: "Functional Specification describes repeated line items or row-level operations, but the App Plan does not include Sub List and Sub List action planning or explicit deferred coverage.",
    });
  } else {
    coverage.subListActions = { matched: true, planSections: ["Approval Forms Plan", "Custom Data List Forms Plan", "Deferred or Runtime-Proof Items"] };
  }
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

  for (const item of deferredWithoutReason(planSections)) {
    findings.push({
      level: "error",
      code: "TRACEABILITY_DEFERRED_WITHOUT_REASON",
      category: "deferred",
      message: `Deferred App Plan disposition is missing required contract fields: ${item.missing.join(", ")}.`,
      line: item.line,
      missing: item.missing,
    });
  }

  const specRequirementIds = requirementIds(specText);
  const planRequirementIds = new Set(requirementIds(planText));
  for (const requirementId of specRequirementIds) {
    if (planRequirementIds.has(requirementId)) continue;
    unmappedRequirementCategories.push(`requirement:${requirementId}`);
    findings.push({
      level: "error",
      code: "TRACEABILITY_REQUIREMENT_ID_UNMAPPED",
      category: "requirementId",
      requirementId,
      message: `Functional Specification requirement ${requirementId} is not mapped by ID in the App Plan.`,
    });
  }

  addSpecializedTraceabilityFindings(specText, planText, findings, unmappedRequirementCategories, coverage);

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
