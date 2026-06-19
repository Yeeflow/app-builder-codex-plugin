#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const AREAS = [
  { key: "dataLists", title: "Data Lists and Document Libraries Plan", code: "GENERATION_READINESS_AREA_EMPTY", required: /data list|document library|not applicable|N\/A|none required|deferred|runtime-proof-required|export-learning-required/i, extra: validateDataLists },
  { key: "approvalForms", title: "Approval Forms Plan", code: "GENERATION_READINESS_APPROVAL_FORM_INCOMPLETE", required: /approval form|not applicable|N\/A|none required|deferred|runtime-proof-required|export-learning-required/i, extra: validateApprovalForms },
  { key: "formReports", title: "Form Reports Plan", code: "GENERATION_READINESS_FORM_REPORT_MISSING", required: /form report|not applicable|N\/A|none required|deferred|runtime-proof-required|export-learning-required/i, extra: validateFormReports },
  { key: "scheduleWorkflows", title: "Schedule Workflows Plan", required: /workflow|not applicable|N\/A|none required|deferred|runtime-proof-required|export-learning-required/i },
  { key: "aiAgents", title: "AI Agents Plan", required: /AI Agent|not applicable|N\/A|none required|deferred|runtime-proof-required|export-learning-required/i },
  { key: "copilots", title: "Copilots Plan", required: /Copilot|not applicable|N\/A|none required|deferred|runtime-proof-required|export-learning-required/i },
  { key: "customForms", title: "Custom Data List Forms Plan", required: /form|not applicable|N\/A|none required|deferred|runtime-proof-required|export-learning-required/i },
  { key: "dataListWorkflows", title: "Data List Workflows Plan", required: /workflow|not applicable|N\/A|none required|deferred|runtime-proof-required|export-learning-required/i },
  { key: "notifications", title: "Notifications Plan", required: /notification|not applicable|N\/A|none required|deferred|runtime-proof-required|export-learning-required/i },
  { key: "views", title: "Data List Views Plan", required: /view|not applicable|N\/A|none required|deferred|runtime-proof-required|export-learning-required/i },
  { key: "dashboards", title: "Dashboard Pages Plan", code: "GENERATION_READINESS_DASHBOARD_BINDING_MISSING", required: /dashboard|page|not applicable|N\/A|none required|deferred|runtime-proof-required|export-learning-required/i, extra: validateDashboards },
  { key: "navigation", title: "Application Navigation Plan", code: "GENERATION_READINESS_NAVIGATION_MISSING", required: /navigation|item|group|not applicable|N\/A|none required|deferred|runtime-proof-required|export-learning-required/i },
  { key: "permissions", title: "Target Users, Roles, Groups, and Permissions", code: "GENERATION_READINESS_ROLES_PERMISSIONS_MISSING", required: /role|permission|view|create|edit|approve|not applicable|N\/A|none required|deferred|runtime-proof-required|export-learning-required/i },
];

const PLACEHOLDER_ONLY = /^(?:\s|[|:\-#`])*<[^>]+>(?:\s|[|:\-#`])*$/;
const DEFERRED = /\b(not applicable|N\/A|none required|deferred|runtime-proof-required|export-learning-required)\b/i;
const RECORD_DISPLAY_CONTROLS = ["Data table", "Collection", "Kanban", "Vertical timeline", "Horizontal timeline"];

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-generation-readiness-review.mjs --plan <app-plan.md> [--json]",
    "",
    "Validates App Plan generation-readiness planning only. No API calls are made.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function normalizeHeadingTitle(title) {
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
    sections.push({
      heading: lines[index].trim(),
      title: match[2].trim(),
      normalizedTitle: normalizeHeadingTitle(match[2]),
      line: index + 1,
      body: lines.slice(index + 1, end).join("\n"),
    });
  }
  return sections;
}

function findSection(sections, title) {
  const wanted = title.toLowerCase();
  return sections.find((section) => section.normalizedTitle === wanted.toLowerCase() || section.normalizedTitle.includes(wanted.toLowerCase()));
}

function meaningfulBody(body) {
  const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.filter((line) => !/^\|?\s*:?-{3,}/.test(line) && !/^rules?:?$/i.test(line));
}

function isPlaceholderOnly(body) {
  const meaningful = meaningfulBody(body);
  if (!meaningful.length) return false;
  const relevant = meaningful.filter((line) => !/^include:|^repeat this|^return to|^required when|^rules:/i.test(line));
  if (!relevant.length) return false;
  return relevant.every((line) => PLACEHOLDER_ONLY.test(line) || /<[^>]+>/.test(line));
}

function validateDataLists(section) {
  if (DEFERRED.test(section.body)) return [];
  const findings = [];
  if (!/\bFields\b/i.test(section.body) && !/field order|display name|field key/i.test(section.body)) {
    findings.push(["GENERATION_READINESS_AREA_EMPTY", "Data list/library planning must include fields or an explicit reason fields are deferred."]);
  }
  return findings;
}

function validateApprovalForms(section) {
  if (DEFERRED.test(section.body)) return [];
  const findings = [];
  if (!/Submission Form Fields/i.test(section.body)) findings.push(["GENERATION_READINESS_APPROVAL_FORM_INCOMPLETE", "Approval form planning must include submission fields or explicit deferred/proof status."]);
  if (!/Workflow Nodes|Approval Workflow Nodes|Node Type/i.test(section.body)) findings.push(["GENERATION_READINESS_APPROVAL_FORM_INCOMPLETE", "Approval form planning must include workflow nodes or explicit deferred/proof status."]);
  return findings;
}

function validateFormReports(section, fullText) {
  const findings = [];
  if (/Form Reports?[^.\n]*(Dashboard-only|dashboard only)|Dashboard-only[^.\n]*Form Reports?/i.test(section.body)) {
    findings.push(["GENERATION_READINESS_FORM_REPORT_MISSING", "Form Report cannot be described as Dashboard-only."]);
  }
  const approvalSection = fullText.match(/##\s+\d+\.\s+Approval Forms Plan([\s\S]*?)##\s+\d+\.\s+Form Reports Plan/i)?.[1] ?? "";
  if (/Form reports required:\s*Yes/i.test(approvalSection) && !/Related Approval Form|based on|reason|not applicable|deferred/i.test(section.body)) {
    findings.push(["GENERATION_READINESS_FORM_REPORT_MISSING", "Required Approval form needs a Form Report or a reason why not."]);
  }
  return findings;
}

function validateDashboards(section) {
  if (DEFERRED.test(section.body)) return [];
  const hasName = /Page name:|Dashboard Page Name|Dashboard page|Page \|/i.test(section.body);
  const hasPurpose = /Business purpose:|Purpose/i.test(section.body);
  const hasControls = /Controls|Yeeflow Controls/i.test(section.body);
  const hasBindings = /Data Source|Fields Displayed|binding|source/i.test(section.body);
  return hasName && hasPurpose && hasControls && hasBindings
    ? []
    : [["GENERATION_READINESS_DASHBOARD_BINDING_MISSING", "Dashboard planning must include page name, purpose, controls, and data source/binding expectations or explicit deferred status."]];
}

function selectedControlsFromRecordDisplay(body) {
  const controls = [];
  const tableMatch = body.match(/Record Display Control Selection([\s\S]*?)(?:\n####|\n##|$)/i);
  const source = tableMatch?.[1] ?? "";
  for (const line of source.split(/\r?\n/)) {
    if (!line.includes("|")) continue;
    for (const control of RECORD_DISPLAY_CONTROLS) {
      if (new RegExp(`\\b${control.replace(/\s+/g, "\\s+")}\\b`, "i").test(line)) controls.push(control);
    }
  }
  return [...new Set(controls)];
}

function hasDataListRecordDisplayNeed(body) {
  return /\b(Data List records|data-list records|record display|Data Source|Source List|list records|records displayed)\b/i.test(body)
    || /\b(Data table|Collection|Kanban|Vertical timeline|Horizontal timeline|Vertical Timeline|Horizontal Timeline)\b/i.test(body);
}

function validateControlActionPropertyGates(text, sections) {
  const findings = [];
  const dashboard = findSection(sections, "Dashboard Pages Plan");
  const approvalForms = findSection(sections, "Approval Forms Plan");
  const customForms = findSection(sections, "Custom Data List Forms Plan");

  if (dashboard && hasDataListRecordDisplayNeed(dashboard.body)) {
    if (!/Record Display Control Selection/i.test(dashboard.body)) {
      findings.push({
        level: "error",
        code: "GENERATION_READINESS_RECORD_DISPLAY_CONTROL_MISSING",
        area: "Dashboard Pages Plan",
        message: "Dashboard pages that display Data List records must include Record Display Control Selection.",
      });
    } else {
      const controls = selectedControlsFromRecordDisplay(dashboard.body);
      if (!controls.length && !DEFERRED.test(dashboard.body)) {
        findings.push({
          level: "error",
          code: "GENERATION_READINESS_UNSUPPORTED_RECORD_DISPLAY_CONTROL",
          area: "Dashboard Pages Plan",
          message: `Record Display Control Selection must select one of: ${RECORD_DISPLAY_CONTROLS.join(", ")}.`,
        });
      }
    }
  }

  if (dashboard && /\b(Collection|Kanban|Vertical Timeline|Horizontal Timeline|Vertical timeline|Horizontal timeline)\b/i.test(dashboard.body) && !/Item Template Dynamic Controls/i.test(dashboard.body)) {
    findings.push({
      level: "error",
      code: "GENERATION_READINESS_ITEM_TEMPLATE_DYNAMIC_CONTROLS_MISSING",
      area: "Dashboard Pages Plan",
      message: "Collection/Kanban/Timeline controls must include item-template Dynamic control planning.",
    });
  }

  const dynamicSection = dashboard?.body.match(/Item Template Dynamic Controls([\s\S]*?)(?:\n####|\n##|$)/i)?.[1] ?? "";
  if (dynamicSection && /\b(magic-dynamic|custom-dynamic|unsupported-dynamic|invented-dynamic)\b/i.test(dynamicSection) && !DEFERRED.test(dynamicSection)) {
    findings.push({
      level: "error",
      code: "GENERATION_READINESS_UNSUPPORTED_TYPE_PROPERTY_UNMARKED",
      area: "Dashboard Pages Plan",
      message: "Unsupported Dynamic control types must be marked export-learning-required, runtime-proof-required, or deferred.",
    });
  }
  for (const line of dynamicSection.split(/\r?\n/)) {
    if (!/dynamic-user/i.test(line)) continue;
    const cells = line.split("|").map((cell) => cell.trim()).filter(Boolean);
    const boundField = cells[4] ?? line;
    if (/\b(Status|Priority|Amount|Total|Title|Date)\b/i.test(boundField) && !/\b(User|Owner|Requester|Approver|Assignee|Person|Member)\b/i.test(boundField)) {
      findings.push({
        level: "error",
        code: "GENERATION_READINESS_DYNAMIC_USER_FIELD_MISMATCH",
        area: "Dashboard Pages Plan",
        message: "Dynamic user controls must bind to User/person fields when detectable.",
      });
    }
  }

  if (dashboard && /\b(Collection|Kanban)\b/i.test(dashboard.body) && !/(Collection (and|\/) Kanban Item Actions|No Collection\/Kanban item actions required)/i.test(dashboard.body)) {
    findings.push({
      level: "error",
      code: "GENERATION_READINESS_COLLECTION_KANBAN_ACTION_DECISION_MISSING",
      area: "Dashboard Pages Plan",
      message: "Collection/Kanban controls must include item action planning or an explicit no-action decision.",
    });
  }
  const collectionActionSection = dashboard?.body.match(/Collection (?:and|\/) Kanban Item Actions([\s\S]*?)(?:\n####|\n##|$)/i)?.[1] ?? "";
  if (collectionActionSection && !/No Collection\/Kanban item actions required/i.test(collectionActionSection)) {
    if (!/Current Item Context/i.test(collectionActionSection) || !/\bSteps\b/i.test(collectionActionSection)) {
      findings.push({
        level: "error",
        code: "GENERATION_READINESS_COLLECTION_KANBAN_ACTION_DECISION_MISSING",
        area: "Dashboard Pages Plan",
        message: "Collection/Kanban item action planning must include current item context and steps.",
      });
    }
  }

  const subListText = [approvalForms?.body ?? "", customForms?.body ?? ""].join("\n");
  if (/\bSub List\b/i.test(subListText) && !/(Sub List List Actions|No custom Sub List actions required)/i.test(subListText)) {
    findings.push({
      level: "error",
      code: "GENERATION_READINESS_SUB_LIST_ACTION_DECISION_MISSING",
      area: "Approval Forms / Custom Data List Forms",
      message: "Sub List controls must include list action planning or an explicit no-action decision.",
    });
  }
  const subListActionSections = [...subListText.matchAll(/Sub List List Actions([\s\S]*?)(?:\n####|\n##|$)/gi)];
  for (const match of subListActionSections) {
    const body = match[1] ?? "";
    if (/No custom Sub List actions required/i.test(body)) continue;
    if (!/Current Row Context/i.test(body) || !/\bSteps\b/i.test(body)) {
      findings.push({
        level: "error",
        code: "GENERATION_READINESS_SUB_LIST_ACTION_DECISION_MISSING",
        area: "Approval Forms / Custom Data List Forms",
        message: "Sub List list action planning must include current row context and steps.",
      });
    }
  }

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!/\b(unsupported|unconfirmed|invented)\b/i.test(line)) continue;
    if (/do not|must not|must be marked|mark(ed)? it as|marked/i.test(line)) continue;
    if (DEFERRED.test(line)) continue;
    if (!/\b(control|type|property|path|action|binding|shape|configuration)\b/i.test(line)) continue;
    findings.push({
      level: "error",
      code: "GENERATION_READINESS_UNSUPPORTED_TYPE_PROPERTY_UNMARKED",
      area: "Plugin Capability and Standards Compliance",
      line: index + 1,
      message: "Unknown, unsupported, invented, or unconfirmed type/property/action wording must be marked export-learning-required, runtime-proof-required, or deferred.",
    });
  }

  return findings;
}

function validate(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const sections = extractSections(text);
  const findings = [];
  const areaStatus = {};

  for (const area of AREAS) {
    const section = findSection(sections, area.title);
    if (!section) {
      areaStatus[area.key] = { status: "fail", findingCode: "GENERATION_READINESS_SECTION_MISSING" };
      findings.push({ level: "error", code: "GENERATION_READINESS_SECTION_MISSING", area: area.title, message: `Missing required resource area section: ${area.title}` });
      continue;
    }
    const body = section.body.trim();
    if (!body) {
      areaStatus[area.key] = { status: "fail", findingCode: area.code || "GENERATION_READINESS_AREA_EMPTY" };
      findings.push({ level: "error", code: area.code || "GENERATION_READINESS_AREA_EMPTY", area: area.title, section: section.heading, message: `${area.title} is empty.` });
      continue;
    }
    if (isPlaceholderOnly(body)) {
      areaStatus[area.key] = { status: "fail", findingCode: "GENERATION_READINESS_PLACEHOLDER_ONLY" };
      findings.push({ level: "error", code: "GENERATION_READINESS_PLACEHOLDER_ONLY", area: area.title, section: section.heading, message: `${area.title} contains only placeholder/example text.` });
      continue;
    }
    if (!area.required.test(body)) {
      areaStatus[area.key] = { status: "fail", findingCode: area.code || "GENERATION_READINESS_AREA_EMPTY" };
      findings.push({ level: "error", code: area.code || "GENERATION_READINESS_AREA_EMPTY", area: area.title, section: section.heading, message: `${area.title} lacks concrete planned resources or explicit not-applicable/deferred status.` });
      continue;
    }
    const extraFindings = area.extra ? area.extra(section, text) : [];
    if (extraFindings.length) {
      areaStatus[area.key] = { status: "fail", findingCode: extraFindings[0][0] };
      for (const [code, message] of extraFindings) findings.push({ level: "error", code, area: area.title, section: section.heading, message });
    } else {
      areaStatus[area.key] = { status: "pass", section: section.heading };
    }
  }

  const gateEvidence = [
    ["Functional Specification review gate passed", /Functional spec(ification)? (review )?(gate )?(passed|approved)|Functional Specification review gate passed/i],
    ["App Plan review gate passed", /App Plan (review )?(gate )?(passed|approved)|App Plan review gate passed/i],
    ["Business decision gates answered/default-approved or no blockers", /business decision gates?.*(answered|default-approved|no blockers|resolved)|no business clarification blockers/i],
    ["No invented unsupported shapes", /no invented unsupported shapes|do not invent unsupported|unsupported.*marked.*(deferred|runtime-proof-required|export-learning-required)/i],
  ];
  for (const [label, pattern] of gateEvidence) {
    if (!pattern.test(text)) {
      findings.push({ level: "error", code: "GENERATION_READINESS_REVIEW_GATE_NOT_PASSED", area: "Review gates", message: `Missing readiness evidence: ${label}.` });
    }
  }

  for (const finding of validateControlActionPropertyGates(text, sections)) findings.push(finding);

  const errors = findings.length;
  return {
    status: errors ? "fail" : "pass",
    file: path.resolve(file),
    errors,
    warnings: 0,
    areas: areaStatus,
    findings,
    proofBoundary: "Generation readiness review checks planning completeness only; it does not prove package generation, schema validity, signing, API acceptance, or runtime behavior.",
  };
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) usage(0);
  const json = process.argv.includes("--json");
  const plan = argValue("--plan") ?? process.argv.slice(2).find((arg) => arg !== "--json");
  if (!plan) usage();
  if (!fs.existsSync(plan)) {
    const report = { status: "fail", file: path.resolve(plan), errors: 1, warnings: 0, findings: [{ level: "error", code: "GENERATION_READINESS_FILE_MISSING", message: "App Plan file does not exist." }] };
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  const report = validate(plan);
  if (json) console.log(JSON.stringify(report, null, 2));
  else if (report.status === "pass") console.log(`generation readiness validation passed: ${plan}`);
  else {
    console.error(`generation readiness validation failed: ${plan}`);
    for (const finding of report.findings) console.error(`${finding.code}: ${finding.message}`);
  }
  if (report.errors) process.exitCode = 1;
}

main();
