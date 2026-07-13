#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { validateFormActionQueryDataPlan } from "./validate-form-action-query-data-plan.mjs";
import { validateWorkflowQueryDataPlan } from "./validate-workflow-query-data-plan.mjs";
import { validateWorkflowLoopPlan } from "./validate-workflow-loop-plan.mjs";
import { validateWorkflowSetDataListPlan } from "./validate-workflow-set-data-list-plan.mjs";
import { validateSetVariablePlan } from "./validate-set-variable-plan.mjs";

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
const PROOF_OR_DEFERRED_LABEL = /\b(deferred|runtime-proof-required|export-learning-required)\b/i;
const RECORD_DISPLAY_CONTROLS = ["Data table", "Collection", "Kanban", "Vertical timeline", "Horizontal timeline"];
const AMBIGUOUS_IMPLEMENTATION_PATTERNS = [
  /\bTitle\s*\/\s*Text\b/i,
  /\bTitle\s*\/\s*input control\b/i,
  /\bCurrency\s*\/\s*Number\b/i,
  /\bUser\s*\/\s*person\b/i,
  /\bUser\s*\/\s*user picker control\b/i,
  /\bAttachment\s*\/\s*File upload\b/i,
  /\bAttachment\s*\/\s*upload control\b/i,
  /\bLookup\s*\/\s*radio dropdown control\b/i,
  /\bTextarea\s*\/\s*textarea control\b/i,
  /\bBoolean\s*\/\s*switch control\b/i,
  /\bDateTime\s*\/\s*date control\b/i,
  /\bMultiline Text\s*\/\s*textarea control\b/i,
  /\bChoice\s*\/\s*radio dropdown control\b/i,
  /\bText\s*\/\s*input control\b/i,
  /\bDocument library\s*\/\s*Data list\b/i,
  /\bType\s*1\s*\/\s*document library\b/i,
  /\bwhere supported\b/i,
  /\bif supported\b/i,
  /\bsupported where possible\b/i,
  /\bwhere available\b/i,
  /\bif available\b/i,
  /\bas supported\b/i,
  /\bwhen supported\b/i,
  /\bwhere safe\b/i,
  /\bopen detail\s*\/\s*slide panel where supported\b/i,
  /\bupdate row\s*\/\s*status where supported\b/i,
  /\bdocument\s*\/\s*list section\b/i,
  /\blookup\s*\/\s*read-only dynamic field\b/i,
];
const AMBIGUOUS_PHRASE = /\b(where supported|if supported|supported where possible|where available|if available|as supported|when supported|where safe)\b/i;
const SLASH_COMBINED_EXACT_VALUE = /\b[A-Za-z][A-Za-z0-9 -]*\s*\/\s*[A-Za-z][A-Za-z0-9 -]*(?:\s+(?:control|type|picker|dropdown|upload|input|textarea|switch|date|field))?\b/i;
const COMBINED_EXACT_HEADER = /\bExact\b.*\b(?:Field Type|Variable Type|Type)\s*\/\s*(?:Control Type|Action Type|Type)\b/i;
const EXACT_IMPLEMENTATION_HEADER = /\b(exact yeeflow|implementation type|implementation control|implementation action|selected resource type|selected control|action type|field type|variable type|control type|dynamic control type|property path|binding)\b/i;
const BUSINESS_LABEL_HEADER = /\b(business label|display label|business requirement|display need|selection reason|notes?|description|purpose|fallback|deferred reason|proof label|proof boundary|support source|why)\b/i;

function isNegativeGuardrailLine(line) {
  return /\b(do not|don't|must not|never|forbid|forbidden|reject|rejected|fail|fails|block|blocks|blocked|blocking|blocker|blockers|not generation-ready|must be marked|marked as|unless marked|without runtime proof|proof-required|deferred)\b/i.test(line);
}

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

function splitTableRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isSeparatorRow(cells) {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function tableRows(body) {
  const lines = body.split(/\r?\n/);
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
      rows.push({ cells, line: lines[rowIndex] });
    }
    tables.push({ header, rows });
  }
  return tables;
}

function isPlaceholderOnly(body) {
  const meaningful = meaningfulBody(body);
  if (!meaningful.length) return false;
  const relevant = meaningful.filter((line) => !/^include:|^repeat this|^return to|^required when|^rules:/i.test(line));
  if (!relevant.length) return false;
  return relevant.every((line) => PLACEHOLDER_ONLY.test(line) || /<[^>]+>/.test(line));
}

function hasPlaceholder(text) {
  return /<[^>]+>/.test(text);
}

function ambiguousPattern(text) {
  return AMBIGUOUS_IMPLEMENTATION_PATTERNS.find((pattern) => pattern.test(text)) ?? null;
}

function implementationCellsToScan(header, cells) {
  const hasExactColumn = header.some((cell) => EXACT_IMPLEMENTATION_HEADER.test(cell));
  if (!hasExactColumn) return cells.map((cell, index) => ({ cell, header: header[index] ?? "" }));
  return cells
    .map((cell, index) => ({ cell, header: header[index] ?? "" }))
    .filter(({ header: headerCell }) => !BUSINESS_LABEL_HEADER.test(headerCell));
}

function validateAmbiguousImplementationWording(text, sections) {
  const findings = [];
  const implementationSectionTitles = [
    "Requirement-to-Yeeflow Resource Mapping Summary",
    "Data Lists and Document Libraries Plan",
    "Approval Forms Plan",
    "Schedule Workflows Plan",
    "Custom Data List Forms Plan",
    "Data List Workflows Plan",
    "Notifications Plan",
    "Data List Views Plan",
    "Dashboard Pages Plan",
    "Application Navigation Plan",
    "Plugin Capability and Standards Compliance",
    "Generation Contract and Hard Gates",
    "Recommended Next Prompt",
  ];
  const implementationSections = sections.filter((section) =>
    implementationSectionTitles.some((title) => section.normalizedTitle.includes(title.toLowerCase())),
  );

  for (const section of implementationSections) {
    for (const table of tableRows(section.body)) {
      for (const headerCell of table.header) {
        if (COMBINED_EXACT_HEADER.test(headerCell)) {
          findings.push({
            level: "error",
            code: "GENERATION_READINESS_EXACT_TYPE_CONTROL_COMBINED",
            area: section.title,
            section: section.heading,
            statusText: headerCell,
            message: "Exact Yeeflow type/control/action headings must split exact types and exact controls/actions into separate columns.",
          });
        }
      }
      for (const row of table.rows) {
        const rowText = row.cells.join(" ");
        if (hasPlaceholder(rowText) || PROOF_OR_DEFERRED_LABEL.test(rowText)) continue;
        for (const { cell, header } of implementationCellsToScan(table.header, row.cells)) {
          const pattern = ambiguousPattern(cell);
          const exactSlash = /\bExact\b/i.test(header) && SLASH_COMBINED_EXACT_VALUE.test(cell);
          if (!pattern && !exactSlash) continue;
          findings.push({
            level: "error",
            code: exactSlash ? "GENERATION_READINESS_EXACT_VALUE_SLASH_COMBINED" : "GENERATION_READINESS_AMBIGUOUS_IMPLEMENTATION_WORDING",
            area: section.title,
            section: section.heading,
            statusText: cell,
            message: exactSlash
              ? `Slash-combined exact implementation value "${cell}" appears in ${header || "an exact implementation table"} without runtime-proof-required, export-learning-required, or deferred.`
              : `Ambiguous generation-ready wording "${cell}" appears in ${header || "an implementation table"} without runtime-proof-required, export-learning-required, or deferred.`,
          });
        }
      }
    }

    for (const [offset, line] of section.body.split(/\r?\n/).entries()) {
      if (!AMBIGUOUS_PHRASE.test(line) || PROOF_OR_DEFERRED_LABEL.test(line) || hasPlaceholder(line)) continue;
      if (!/\b(implementation|generation-ready|action|workflow|control|field|variable|binding|property|query data|temp variable|history|link|placeholder|dashboard filter)\b/i.test(line)) continue;
      findings.push({
        level: "error",
        code: "GENERATION_READINESS_AMBIGUOUS_IMPLEMENTATION_WORDING",
        area: section.title,
        section: section.heading,
        line: section.line + offset + 1,
        statusText: line.trim(),
        message: "Ambiguous support wording in implementation-contract sections must be marked runtime-proof-required, export-learning-required, or deferred with reason/fallback/proof impact.",
      });
    }
  }

  return findings;
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
    if (isNegativeGuardrailLine(line)) continue;
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
    ["Business decision gates answered/user-default-approved-for-generation or no blockers", /business decision gates?.*(answered|user-default-approved-for-generation|no blockers|resolved)|no business clarification blockers/i],
    ["No invented unsupported shapes", /no invented unsupported shapes|do not invent unsupported|unsupported.*marked.*(deferred|runtime-proof-required|export-learning-required)/i],
  ];
  for (const [label, pattern] of gateEvidence) {
    if (!pattern.test(text)) {
      findings.push({ level: "error", code: "GENERATION_READINESS_REVIEW_GATE_NOT_PASSED", area: "Review gates", message: `Missing readiness evidence: ${label}.` });
    }
  }

  for (const finding of validateControlActionPropertyGates(text, sections)) findings.push(finding);
  for (const finding of validateAmbiguousImplementationWording(text, sections)) findings.push(finding);

  const setVariablePlan = validateSetVariablePlan(text);
  for (const finding of setVariablePlan.findings) {
    findings.push({ level: "error", area: "Set Variable Planning", ...finding });
  }

  const queryDataPlan = validateFormActionQueryDataPlan(text);
  const hasFormActionQueryDataIntent = queryDataPlan.queryDataRows > 0 || text.split(/\r?\n/).some((line) =>
    /\bQuery\s*Data\b/i.test(line)
    && /\b(Form Action|Form Actions and Temp Variables|Dashboard|Custom Data List Form|Approval Submission|Approval Task)\b/i.test(line)
    && !/\b(no|none|not required|not planned|do not|must not|forbidden|deferred)\b/i.test(line),
  );
  if (hasFormActionQueryDataIntent && queryDataPlan.queryDataRows === 0) {
    findings.push({
      level: "error",
      code: "GENERATION_READINESS_QUERYDATA_PLAN_TABLE_MISSING",
      area: "Form Actions and Temp Variables",
      message: "Form Action Query Data intent requires a standard Form Actions and Temp Variables planning table before generation readiness can pass.",
    });
  }
  for (const finding of queryDataPlan.findings) {
    findings.push({
      level: finding.severity === "warning" ? "warning" : "error",
      area: "Form Actions and Temp Variables",
      ...finding,
    });
  }

  const workflowQueryDataPlan = validateWorkflowQueryDataPlan(text);
  const hasWorkflowQueryDataIntent = workflowQueryDataPlan.queryDataRows > 0 || text.split(/\r?\n/).some((line) =>
    /\bQuery\s*Data\b|\bQueryData\b/i.test(line)
    && /\b(Approval|Data List|Scheduled)\s+Workflow\b|\bworkflow\s+node\b/i.test(line)
    && !/\b(no|none|not required|not planned|do not|must not|forbidden|deferred)\b/i.test(line),
  );
  if (hasWorkflowQueryDataIntent && workflowQueryDataPlan.queryDataRows === 0) {
    findings.push({
      level: "error",
      code: "GENERATION_READINESS_WORKFLOW_QUERYDATA_PLAN_TABLE_MISSING",
      area: "Workflow Query Data Planning",
      message: "Workflow Query Data intent requires the standard Workflow Query Data Planning table before generation readiness can pass.",
    });
  }
  for (const finding of workflowQueryDataPlan.findings) {
    findings.push({
      level: finding.severity === "warning" ? "warning" : "error",
      area: "Workflow Query Data Planning",
      ...finding,
    });
  }

  const workflowLoopPlan = validateWorkflowLoopPlan(text);
  const hasWorkflowLoopIntent = workflowLoopPlan.loopRows > 0 || text.split(/\r?\n/).some((line) =>
    /\bLoop\b|Loop through list items|Loop through multiple values|Loop for fixed times/i.test(line)
    && /\b(Approval|Data List|Scheduled)\s+Workflow\b|\bworkflow\s+node\b|\bLoopBody\b/i.test(line)
    && !/\b(no|none|not required|not planned|do not|must not|forbidden|deferred)\b/i.test(line),
  );
  if (hasWorkflowLoopIntent && workflowLoopPlan.loopRows === 0) {
    findings.push({
      level: "error",
      code: "GENERATION_READINESS_WORKFLOW_LOOP_PLAN_TABLE_MISSING",
      area: "Workflow Loop Planning",
      message: "Workflow Loop intent requires the standard Workflow Loop Planning table before generation readiness can pass.",
    });
  }
  for (const finding of workflowLoopPlan.findings) {
    findings.push({
      level: finding.severity === "warning" ? "warning" : "error",
      area: "Workflow Loop Planning",
      ...finding,
    });
  }

  const workflowSetDataListPlan = validateWorkflowSetDataListPlan(text);
  const hasWorkflowSetDataListIntent = workflowSetDataListPlan.setDataListRows > 0 || text.split(/\r?\n/).some((line) =>
    /\bSet\s*Data\s*List\b/i.test(line)
    && /\b(Approval|Data List|Scheduled)\s+Workflow\b|\bworkflow\s+node\b/i.test(line)
    && !/\b(no|none|not required|not planned|do not|must not|forbidden|deferred)\b/i.test(line),
  );
  if (hasWorkflowSetDataListIntent && workflowSetDataListPlan.setDataListRows === 0) {
    findings.push({
      level: "error",
      code: "GENERATION_READINESS_WORKFLOW_SET_DATALIST_PLAN_TABLE_MISSING",
      area: "Workflow Set Data List Planning",
      message: "Workflow Set Data List intent requires the standard Workflow Set Data List Action Plan table before generation readiness can pass.",
    });
  }
  for (const finding of workflowSetDataListPlan.findings) {
    findings.push({
      level: finding.severity === "warning" ? "warning" : "error",
      area: "Workflow Set Data List Planning",
      ...finding,
    });
  }

  const errors = findings.filter((finding) => finding.level !== "warning").length;
  const warnings = findings.filter((finding) => finding.level === "warning").length;
  return {
    status: errors ? "fail" : "pass",
    file: path.resolve(file),
    errors,
    warnings,
    areas: areaStatus,
    findings,
    queryDataPlan: {
      validatorRan: true,
      detectedIntent: hasFormActionQueryDataIntent,
      queryDataRows: queryDataPlan.queryDataRows,
      status: queryDataPlan.status,
    },
    workflowQueryDataPlan: {
      validatorRan: true,
      detectedIntent: hasWorkflowQueryDataIntent,
      queryDataRows: workflowQueryDataPlan.queryDataRows,
      status: workflowQueryDataPlan.status,
    },
    workflowLoopPlan: {
      validatorRan: true,
      detectedIntent: hasWorkflowLoopIntent,
      loopRows: workflowLoopPlan.loopRows,
      status: workflowLoopPlan.status,
    },
    workflowSetDataListPlan: {
      validatorRan: true,
      detectedIntent: hasWorkflowSetDataListIntent,
      setDataListRows: workflowSetDataListPlan.setDataListRows,
      status: workflowSetDataListPlan.status,
    },
    setVariablePlan: {
      validatorRan: true,
      formActionRows: setVariablePlan.formActionRows,
      workflowRows: setVariablePlan.workflowRows,
      status: setVariablePlan.status,
    },
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
