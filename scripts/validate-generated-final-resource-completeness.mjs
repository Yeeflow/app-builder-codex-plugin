#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk, walk } from "./lib/yapk-decode-utils.mjs";

const DASHBOARD_RECORD_CONTROLS = new Set(["collection", "data-table", "datatable", "kanban", "vertical-timeline", "horizontal-timeline", "timeline"]);
const DASHBOARD_FILTER_CONTROLS = new Set(["data-filter", "select-filter", "radio-filter", "checkbox-filter", "filter", "search-filter"]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.plan || !args.package) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateGeneratedFinalResourceCompleteness(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateGeneratedFinalResourceCompleteness(options = {}) {
  const findings = [];
  const planPath = path.resolve(options.plan || "");
  const packagePath = path.resolve(options.package || "");
  let plan = null;
  let decoded = null;

  if (!fs.existsSync(planPath)) findings.push(error("GENERATED_FINAL_APP_PLAN_MISSING", "Approved App Plan file is missing.", { appPlanPath: planPath }));
  else plan = parseAppPlan(planPath);

  if (!fs.existsSync(packagePath)) findings.push(error("GENERATED_FINAL_PACKAGE_MISSING", "Generated-final package or decoded JSON file is missing.", { packagePath }));
  else {
    try {
      decoded = readPackageOrDecodedJson(packagePath);
    } catch (decodeError) {
      findings.push(error("GENERATED_FINAL_PACKAGE_DECODE_FAILED", `Could not decode generated-final package: ${decodeError.message}`, { packagePath }));
    }
  }

  if (plan && decoded) {
    const inventory = collectInventory(decoded);
    validatePlanParserDidNotFailOpen(plan, findings);
    validateResourceCompleteness(plan, inventory, findings);
    validateFormsCompleteness(plan, inventory, findings);
    validateDashboardMaterialization(plan, inventory, findings);
    validateNavigationCompleteness(plan, inventory, findings);
    validateNoPartialSurface(plan, inventory, decoded, findings);
  }

  const errors = findings.filter((finding) => finding.level === "error").length;
  return {
    status: errors ? "fail" : "pass",
    plan: { path: planPath, planned: plan ? summarizePlan(plan) : null },
    package: { path: packagePath, decodedSummary: decoded ? summarizeDecoded(decoded) : null },
    errors,
    findings,
  };
}

function validatePlanParserDidNotFailOpen(plan, findings) {
  const counts = summarizePlan(plan);
  const parsedResourceCount = counts.dataLists
    + counts.approvalForms
    + counts.formReports
    + counts.customForms
    + counts.dashboards
    + counts.navigationGroups;
  const looksLikeResourcePlan = /##\s+\d+\.\s+(?:Data Lists|Approval Forms|Form Reports|Custom Data List Forms|Dashboard Pages|Application Navigation) Plan/i.test(plan.text)
    || /\b(?:data list|document library|approval form|dashboard|navigation group|FormNewReports|DataReports|workflow)\b/i.test(plan.text);
  if (plan.text.trim().length > 200 && looksLikeResourcePlan && parsedResourceCount === 0) {
    findings.push(error("GENERATED_FINAL_APP_PLAN_RESOURCE_PARSE_EMPTY", "Non-empty App Plan appears to declare Yeeflow resources, but the completeness parser found zero planned resources. This is a parser/generation contract failure and must not pass open.", {
      appPlanReference: { section: "Yeeflow App Plan resource sections" },
      parsed: counts,
    }));
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--plan") args.plan = argv[++index];
    else if (token === "--package") args.package = argv[++index];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-generated-final-resource-completeness.mjs --plan <yeeflow-app-plan.md> --package <app.yapk|decoded.json>

Compares the approved App Plan against the generated-final package surface before signing readiness.`);
}

function readPackageOrDecodedJson(file) {
  if (file.toLowerCase().endsWith(".yapk")) return readDecodedYapk(file).decoded;
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function parseAppPlan(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/);
  const deferred = parseDeferredItems(text);
  const plan = {
    text,
    lines,
    dataLists: parseDataListHeadings(text),
    approvalForms: parseApprovalForms(text),
    formReports: parseTableItems(text, /^##\s+6\.\s+Form Reports Plan/i, "Form Report Name", "FormNewReports"),
    scheduleWorkflows: parseTableItems(text, /^##\s+7\.\s+Schedule Workflows Plan/i, "Schedule Workflow Name", "ScheduleWorkflows"),
    customForms: parseCustomForms(text),
    dataListWorkflows: parseTableItems(text, /^##\s+11\.\s+Data List Workflows Plan/i, "Workflow Name", "DataListWorkflows"),
    notifications: parseTableItems(text, /^##\s+12\.\s+Notifications Plan/i, "Notification Name", "Notifications"),
    dataListFieldSpecs: parseDataListFieldSpecs(text),
    dataListViews: parseDataListViews(text),
    dashboards: parseDashboards(text),
    navigation: parseNavigation(text),
    deferred,
    explicitFormsEmptyForbidden: /\bForms:\s*\[\]\s*(?:is|are)?\s*(?:forbidden|not allowed|must not|invalid)/i.test(text),
  };
  for (const bucket of ["dataLists", "approvalForms", "formReports", "scheduleWorkflows", "customForms", "dataListWorkflows", "notifications", "dataListViews", "dashboards"]) {
    plan[bucket] = plan[bucket].filter((item) => !isPlaceholder(item.name)).map((item) => ({
      ...item,
      deferred: item.deferred || isDeferred(plan.deferred, item.name, item.category || bucket),
    }));
  }
  plan.navigation.groups = plan.navigation.groups.filter((group) => !isPlaceholder(group.name)).map((group) => ({
    ...group,
    deferred: isDeferred(plan.deferred, group.name, "navigation"),
    items: group.items.filter((item) => !isPlaceholder(item.name)).map((item) => ({ ...item, deferred: isDeferred(plan.deferred, item.name, "navigation") })),
  }));
  return plan;
}

function parseDataListViews(text) {
  const section = extractSection(text, /^##\s+13\.\s+Data List Views Plan/i);
  return parseMarkdownTables(section)
    .filter((table) => table.headers.includes("View Name") && (table.headers.includes("Data List") || table.headers.includes("List/Library") || table.headers.includes("List")))
    .flatMap((table) => table.rows.map((row) => plannedItem(row["View Name"], section, row.__index, "dataListViews", {
      host: row["Data List"] || row["List/Library"] || row.List || "",
    })));
}

function parseDataListFieldSpecs(text) {
  const section = extractSection(text, /^##\s+4\.\s+Data Lists and Document Libraries Plan/i);
  const byList = new Map();
  if (!section) return [];
  const lines = section.split(/\r?\n/);
  let currentList = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+4\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) {
      currentList = cleanName(heading[1]);
      continue;
    }
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => norm(header));
    const listColumn = findHeaderIndex(normalizedHeaders, ["list", "data list", "data list name", "list name", "document library", "source list"]);
    const displayColumn = findHeaderIndex(normalizedHeaders, ["field label", "display name", "field display name", "business field", "business label", "label", "name"]);
    const typeColumn = findHeaderIndex(normalizedHeaders, ["field type", "business type", "type", "yeeflow field type", "exact yeeflow field type"]);
    const lookupTargetColumn = findHeaderIndex(normalizedHeaders, ["lookup target", "target list", "lookup data list", "lookup list", "related list"]);
    if (displayColumn === -1 || lookupTargetColumn === -1) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const listName = cleanName(cells[listColumn] || currentList);
      const displayName = cleanName(cells[displayColumn]);
      const fieldType = typeColumn === -1 ? "" : cleanName(cells[typeColumn]);
      const lookupTarget = cleanName(cells[lookupTargetColumn]);
      if (!listName || isPlaceholder(listName) || !displayName || isPlaceholder(displayName) || !lookupTarget || isPlaceholder(lookupTarget)) {
        rowIndex += 1;
        continue;
      }
      const key = norm(listName);
      if (!byList.has(key)) byList.set(key, []);
      byList.get(key).push({
        listName,
        displayName,
        fieldType,
        lookupTarget,
        line: lineNumberFor(text, lines[rowIndex].trim()) || null,
      });
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return [...byList.values()].flat();
}

function parseDataListHeadings(text) {
  const section = extractSection(text, /^##\s+4\.\s+Data Lists and Document Libraries Plan/i);
  const tableItems = parseMarkdownTables(section)
    .filter((table) => table.headers.includes("List Name") || table.headers.includes("Data List Name") || table.headers.includes("Document Library Name") || table.headers.includes("List") || table.headers.includes("Data List"))
    .flatMap((table) => table.rows.map((row) => plannedItem(row["List Name"] || row["Data List Name"] || row["Document Library Name"] || row.List || row["Data List"], section, row.__index, "dataLists")));
  if (tableItems.length) return uniqueByName(tableItems);
  const headingItems = [...section.matchAll(/^###\s+4\.[x0-9]+\s+(.+?)\s*$/gim)]
    .map((match) => plannedItem(match[1], section, match.index, "dataLists"))
    .filter((item) => !/\b(?:schema|field|fields|table|selection|template|view|views)\b/i.test(item.name));
  return headingItems;
}

function parseApprovalForms(text) {
  const section = extractSection(text, /^##\s+5\.\s+Approval Forms Plan/i);
  return [...section.matchAll(/^###\s+5\.[x0-9]+\s+(.+?)\s*$/gim)].map((match) => {
    const name = cleanName(match[1]);
    const sub = extractSubsection(section, new RegExp(`^###\\s+5\\.[x0-9]+\\s+${escapeRegExp(match[1].trim())}\\s*$`, "im"));
    return {
      ...plannedItem(name, section, match.index, "approvalForms"),
      requiresTaskForm: /Assignment task required:\s*Yes|Assignment Task Forms|Task Form Name/i.test(sub),
      requiresFormAction: /Form Actions and Temp Variables|Action Name\s*\|/i.test(sub) && !/No form actions required/i.test(sub),
      requiresPrintForm: /\bprint\b/i.test(sub) && !/\bprint\b[^.\n|]*(?:not applicable|not required|no)/i.test(sub),
    };
  });
}

function parseCustomForms(text) {
  const section = extractSection(text, /^##\s+10\.\s+Custom Data List Forms Plan/i);
  return parseMarkdownTables(section)
    .filter((table) => table.headers.includes("Form Name"))
    .flatMap((table) => table.rows.map((row) => plannedItem(row["Form Name"], section, row.__index, "customForms", { host: row["Used By"] || row["Form Type"] || "" })));
}

function parseDashboards(text) {
  const section = extractSection(text, /^##\s+14\.\s+Dashboard Pages Plan/i);
  const dashboardMatches = [...section.matchAll(/^###\s+14\.[x0-9]+\s+(.+?)\s*$/gim)]
    .filter((match) => isDashboardPageName(cleanName(match[1])));
  const dashboards = [];
  for (let index = 0; index < dashboardMatches.length; index += 1) {
    const match = dashboardMatches[index];
    const next = dashboardMatches[index + 1]?.index ?? section.length;
    const body = section.slice(match.index, next);
    const name = cleanName(extractBullet(body, "Page name") || firstTableValue(body, "Dashboard Page Name") || match[1]);
    if (!isDashboardPageName(name)) continue;
    dashboards.push({
      name,
      category: "dashboards",
      line: lineNumberFor(text, name) || lineNumberFor(text, "Dashboard Pages Plan"),
      deferred: hasExplicitDeferredStatus(body),
      metrics: parseTableItems(body, /^####\s+Summary Metrics/i, "Metric Name", "dashboardMetrics"),
      filters: parseTableItems(body, /^####\s+Dashboard Filters/i, "Filter Name", "dashboardFilters"),
      recordRegions: parseTableItems(body, /^####\s+Record Display Control Selection/i, "Section", "dashboardRecordRegions"),
      sections: parseTableItems(body, /^####\s+Dashboard Sections/i, "Section Name", "dashboardSections"),
      dynamicControls: parseTableItems(body, /^####\s+Item Template Dynamic Controls/i, "Business Label", "dashboardDynamicControls"),
      raw: body,
    });
  }
  if (!dashboards.length) {
    const tableDashboards = parseMarkdownTables(section)
      .filter((table) => table.headers.includes("Dashboard Page Name") || table.headers.includes("Dashboard Page") || table.headers.includes("Page Name"))
      .flatMap((table) => table.rows.map((row) => cleanName(row["Dashboard Page Name"] || row["Dashboard Page"] || row["Page Name"])))
      .filter((name) => !isPlaceholder(name));
    const pageNameDashboards = [...section.matchAll(/^Page name:\s*(.+?)\s*$/gim)]
      .map((match) => cleanName(match[1]))
      .filter((name) => !isPlaceholder(name));
    const names = uniqueByNorm(tableDashboards.concat(pageNameDashboards));
    for (const name of names) {
      dashboards.push({
        name,
        category: "dashboards",
        line: lineNumberFor(text, name) || lineNumberFor(text, "Dashboard Pages Plan"),
        deferred: hasExplicitDeferredStatus(sectionForDashboardName(section, name)),
        metrics: parseTableItems(section, /^####\s+Summary Metrics/i, "Metric Name", "dashboardMetrics"),
        filters: parseTableItems(section, /^####\s+Dashboard Filters/i, "Filter Name", "dashboardFilters"),
        recordRegions: parseDashboardScopedItems(section, /^####\s+Record Display Control Selection/i, name, "Section", "dashboardRecordRegions"),
        sections: parseDashboardScopedItems(section, /^####\s+Dashboard Sections/i, name, "Section Name", "dashboardSections"),
        dynamicControls: parseTableItems(section, /^####\s+Item Template Dynamic Controls/i, "Business Label", "dashboardDynamicControls"),
        raw: sectionForDashboardName(section, name) || section,
      });
    }
  }
  return dashboards.filter((item) => !isPlaceholder(item.name) && isDashboardPageName(item.name));
}

function isDashboardPageName(value) {
  const name = cleanName(value);
  if (!name || isPlaceholder(name)) return false;
  const lower = name.toLowerCase();
  if (/\b(template coverage|coverage matrix|selection matrix|business decision gate|business decision gates|dataset presentation plan|dashboard sections|dashboard filters|dashboard actions|summary metrics|record display control selection|dashboard record display|dataset presentation|item template dynamic controls|collection and kanban item actions|collection template selection|dashboard page layout template selection|data analytics template selection|data table template selection)\b/.test(lower)) return false;
  if (/^(dashboard|record display|item template|collection|kanban|dashboard generation|dashboard template coverage matrix)$/i.test(name)) return false;
  return true;
}

function parseNavigation(text) {
  const section = extractSection(text, /^##\s+15\.\s+Application Navigation Plan/i);
  const table = parseMarkdownTables(section).find((candidate) => candidate.headers.includes("Group") && candidate.headers.includes("Item"));
  const groupMap = new Map();
  if (table) {
    for (const row of table.rows) {
      const groupName = cleanName(row.Group);
      const itemName = cleanName(row.Item || row["Target Resource"]);
      const target = cleanName(row["Target Resource"] || row.Item);
      if (!groupName || !itemName || /no|not applicable/i.test(row.Visible || "")) continue;
      if (!groupMap.has(norm(groupName))) groupMap.set(norm(groupName), { name: groupName, category: "navigation", line: lineNumberFor(text, groupName), items: [] });
      groupMap.get(norm(groupName)).items.push({ name: target || itemName, item: itemName, category: "navigation", line: lineNumberFor(text, itemName), type: row["Yeeflow Resource Type"] || "" });
    }
  } else {
    const match = section.match(/Navigation groups:\s*(.+?)\s*$/im);
    if (match) {
      for (const part of match[1].split(/\s*,\s*/)) {
        const groupName = cleanName(part.replace(/\s+with\s+.+$/i, ""));
        if (groupName && !groupMap.has(norm(groupName))) groupMap.set(norm(groupName), { name: groupName, category: "navigation", line: lineNumberFor(text, groupName), items: [] });
      }
    }
  }
  return { groups: [...groupMap.values()] };
}

function parseTableItems(text, headingPattern, nameHeader, category) {
  const section = extractSection(text, headingPattern);
  if (!section) return [];
  return parseMarkdownTables(section)
    .filter((table) => table.headers.includes(nameHeader))
    .flatMap((table) => table.rows.map((row) => plannedItem(row[nameHeader], section, row.__index, category, { row })));
}

function parseDashboardScopedItems(text, headingPattern, dashboardName, nameHeader, category) {
  const section = extractSection(text, headingPattern);
  if (!section) return [];
  return parseMarkdownTables(section)
    .filter((table) => table.headers.includes(nameHeader))
    .flatMap((table) => table.rows
      .filter((row) => {
        const dashboardCell = row["Dashboard Page"] || row["Dashboard Page Name"] || row.Page || "";
        return !dashboardCell || norm(dashboardCell) === norm(dashboardName);
      })
      .map((row) => plannedItem(row[nameHeader], section, row.__index, category, { row })));
}

function sectionForDashboardName(section, dashboardName) {
  const escaped = escapeRegExp(dashboardName);
  const pageNamePattern = new RegExp(`^Page name:\\s*${escaped}\\s*$`, "im");
  const lines = section.split(/\r?\n/);
  const start = lines.findIndex((line) => pageNamePattern.test(line));
  if (start < 0) return "";
  const end = lines.findIndex((line, index) => index > start && /^Page name:\s*/i.test(line));
  return lines.slice(start, end < 0 ? lines.length : end).join("\n");
}

function parseMarkdownTables(section) {
  const lines = section.split(/\r?\n/);
  const tables = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const rows = [];
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const row = { __index: rowIndex };
      headers.forEach((header, cellIndex) => { row[header] = cells[cellIndex] || ""; });
      if (Object.values(row).some((value) => typeof value === "string" && value.trim())) rows.push(row);
      rowIndex += 1;
    }
    tables.push({ headers, rows });
    index = rowIndex;
  }
  return tables;
}

function parseDeferredItems(text) {
  const section = extractSection(text, /^##\s+22\.\s+Deferred or Runtime-Proof Items/i);
  return parseMarkdownTables(section)
    .flatMap((table) => table.rows.map((row) => ({
      name: cleanName(row.Item),
      category: cleanName(row.Category),
      reason: cleanName(row.Reason),
      proof: cleanName(row["Required Proof or Follow-up"] || row.Fallback),
    })))
    .filter((item) => item.name && item.reason && item.proof);
}

function collectInventory(decoded) {
  const data = appData(decoded);
  return {
    data,
    dataLists: asArray(data.childs).map((child, index) => ({ name: titleOf(child.list), path: data.isListSet ? `$.Childs[${index}].List` : `$.Childs[${index}].ListModel`, raw: child })),
    approvalForms: asArray(data.forms).map((form, index) => ({ name: titleOf(form) || titleOf(form.formdef) || String(form.Key || form.key || ""), path: data.isListSet ? `$.Forms[${index}]` : `$.Forms[${index}]`, raw: form })),
    formReports: asArray(data.formNewReports).map((report, index) => ({ name: titleOf(report) || String(report.Name || report.ReportName || report.DefKey || ""), path: `$.FormNewReports[${index}]`, raw: report })),
    dataReports: asArray(data.dataReports).map((report, index) => ({ name: titleOf(report) || String(report.Name || report.ReportName || ""), path: `$.DataReports[${index}]`, raw: report })),
    pages: collectPages(data.pages),
    navigation: collectNavigation(data.root),
  };
}

function appData(decoded) {
  if (isObject(decoded?.ListSet)) {
    return {
      isListSet: true,
      root: decoded.ListSet,
      pages: asArray(decoded.Pages),
      forms: asArray(decoded.Forms),
      formNewReports: asArray(decoded.FormNewReports),
      dataReports: asArray(decoded.DataReports),
      childs: asArray(decoded.Childs).map((child) => ({ list: child.List, fields: child.Fields, layouts: child.Layouts })),
      workflows: asArray(decoded.Workflows || decoded.Flows || decoded.FlowMappings),
      notifications: asArray(decoded.Notifications),
    };
  }
  return {
    isListSet: false,
    root: decoded?.Item?.ListModel || {},
    pages: asArray(decoded?.Pages || decoded?.Item?.Layouts),
    forms: asArray(decoded?.Forms || decoded?.Data?.Forms),
    formNewReports: asArray(decoded?.FormNewReports || decoded?.Data?.FormNewReports),
    dataReports: asArray(decoded?.DataReports || decoded?.Data?.DataReports),
    childs: asArray(decoded?.Childs || decoded?.Data?.Childs).map((child) => ({ list: child.ListModel || child.List, fields: child.Defs || child.Fields, layouts: child.Layouts })),
    workflows: asArray(decoded?.Workflows || decoded?.Data?.Workflows || decoded?.FlowMappings || decoded?.Data?.FlowMappings),
    notifications: asArray(decoded?.Notifications || decoded?.Data?.Notifications),
  };
}

function collectPages(pages) {
  return asArray(pages).map((page, index) => {
    const resources = asArray(page.LayoutInResources).map((resource, resourceIndex) => ({
      raw: parseJsonMaybe(resource?.Resource) || resource?.Resource || resource,
      path: `$.Pages[${index}].LayoutInResources[${resourceIndex}].Resource`,
    }));
    const controls = [];
    const contentNodes = [];
    for (const resource of resources) collectControls(resource.raw, controls, contentNodes, resource.path);
    return { name: titleOf(page) || `page-${index + 1}`, type: String(page.Type || ""), path: `$.Pages[${index}]`, raw: page, resources, controls, contentNodes };
  });
}

function collectControls(node, controls, contentNodes, pointer) {
  if (!isObject(node)) return;
  const type = String(node.type || node.Type || "");
  const name = `${node.name || node.Name || node.label || node.Label || node.id || node.ID || node.attrs?.nv_label || node.attrs?.label || ""}`;
  if (type) controls.push({ type: type.toLowerCase(), name, pointer, raw: node });
  if (/^content$/i.test(name.trim()) || /content/i.test(String(node.id || node.ID || ""))) contentNodes.push({ pointer, raw: node, children: controlChildren(node) });
  for (const [key, value] of Object.entries(node)) {
    if (["children", "Childs", "columns", "controls", "Items", "items"].includes(key) && Array.isArray(value)) {
      value.forEach((child, index) => collectControls(child, controls, contentNodes, `${pointer}.${key}[${index}]`));
    }
  }
}

function validateResourceCompleteness(plan, inventory, findings) {
  validateAppPlanReferencedResourceCompleteness(plan, inventory, findings);
  comparePlanned(plan.dataLists, inventory.dataLists, findings, {
    code: "GENERATED_FINAL_DATA_LIST_MISSING",
    message: "App Plan declares a data list/document library that is missing from the decoded package.",
    decodedPath: "$.Childs[]",
  });
  comparePlanned(plan.approvalForms, inventory.approvalForms, findings, {
    code: "GENERATED_FINAL_APPROVAL_FORM_MISSING",
    message: "App Plan declares an approval form that is missing from decoded $.Forms[].",
    decodedPath: "$.Forms[]",
  });
  comparePlanned(plan.formReports, inventory.formReports, findings, {
    code: "GENERATED_FINAL_FORMNEWREPORT_MISSING",
    message: "App Plan declares a form report that is missing from decoded $.FormNewReports[].",
    decodedPath: "$.FormNewReports[]",
  });
}

function validateAppPlanReferencedResourceCompleteness(plan, inventory, findings) {
  const plannedDataLists = plan.dataLists.filter((item) => !item.deferred);
  const generatedDataLists = inventory.dataLists;
  const plannedDataListViews = plan.dataListViews.filter((item) => !item.deferred);

  for (const group of plan.navigation.groups.filter((item) => !item.deferred)) {
    for (const item of group.items.filter((candidate) => !candidate.deferred)) {
      if (!isDataListNavigationItem(item)) continue;
      const target = item.name || item.item;
      if (isPlaceholder(target)) continue;
      const plannedList = findByName(plannedDataLists, target);
      const generatedList = findByName(generatedDataLists, target);
      const plannedView = plannedDataListViews.find((view) => norm(view.name) === norm(target) || norm(view.name) === norm(item.item));
      const plannedViewHost = plannedView ? findByName(plannedDataLists, plannedView.host) : null;
      if (!plannedList && !generatedList && !plannedViewHost) {
        findings.push(error("APP_PLAN_NAVIGATION_DATA_LIST_TARGET_NOT_PLANNED", "Navigation declares a data-list target that is not planned as a Data List and cannot be resolved through a planned Data List View host.", {
          appPlanReference: ref(item),
          plannedGroup: group.name,
          plannedNavigationItem: item.item || item.name,
          plannedTarget: target,
          expectedPlanSection: "## 4. Data Lists and Document Libraries Plan",
        }));
      }
    }
  }

  for (const field of plan.dataListFieldSpecs || []) {
    const hostPlanned = findByName(plannedDataLists, field.listName);
    if (!hostPlanned) continue;
    if (isPlaceholder(field.lookupTarget)) continue;
    const targetPlanned = findByName(plannedDataLists, field.lookupTarget);
    const targetGenerated = findByName(generatedDataLists, field.lookupTarget);
    if (!targetPlanned && !targetGenerated) {
      findings.push(error("APP_PLAN_LOOKUP_TARGET_DATA_LIST_NOT_PLANNED", "A Data List field declares a lookup target that is not planned or generated as a Data List. Lookup targets must be first-class generated resources, not implicit placeholder names.", {
        appPlanReference: {
          item: `${field.listName}.${field.displayName}`,
          category: "dataListFieldLookup",
          line: field.line || null,
        },
        sourceDataList: field.listName,
        fieldDisplayName: field.displayName,
        lookupTarget: field.lookupTarget,
        expectedPlanSection: "## 4. Data Lists and Document Libraries Plan",
      }));
    }
  }
}

function isDataListNavigationItem(item) {
  const type = String(item?.type || "").toLowerCase();
  if (/external|approval|dashboard|form report|data report|agent|copilot/.test(type)) return false;
  if (/\b(data\s*list|document\s*library)\b/.test(type)) return true;
  return /^(list|library)$/i.test(type.trim());
}

function validateFormsCompleteness(plan, inventory, findings) {
  const requiredForms = plan.approvalForms.filter((item) => !item.deferred);
  if (requiredForms.length && !inventory.approvalForms.length) {
    findings.push(error("GENERATED_FINAL_FORMS_EMPTY_WITH_PLANNED_APPROVAL_FORMS", "App Plan declares approval forms, but decoded package has Forms: [].", {
      appPlanReference: refs(requiredForms),
      decodedPath: "$.Forms",
      plannedForms: requiredForms.map((item) => item.name),
    }));
  }
  if (plan.explicitFormsEmptyForbidden && !inventory.approvalForms.length) {
    findings.push(error("GENERATED_FINAL_FORMS_ARRAY_FORBIDDEN", "App Plan explicitly forbids Forms: [], but decoded package has no forms.", {
      appPlanReference: { line: lineNumberFor(plan.text, "Forms: []") },
      decodedPath: "$.Forms",
    }));
  }
  for (const form of requiredForms) {
    const actual = findByName(inventory.approvalForms, form.name);
    if (!actual) continue;
    const formText = JSON.stringify(actual.raw);
    if (form.requiresTaskForm && !/TaskUrl|taskurl|pageurls|AssignmentTask|MultiAssignmentTask|CandidateTask/i.test(formText)) {
      findings.push(error("GENERATED_FINAL_APPROVAL_TASK_FORM_MISSING", "Approval form is generated but required task form/task page references are missing.", {
        appPlanReference: ref(form),
        decodedPath: actual.path,
        plannedForm: form.name,
      }));
    }
    if (form.requiresPrintForm && !/print/i.test(formText)) {
      findings.push(error("GENERATED_FINAL_APPROVAL_PRINT_FORM_MISSING", "Approval form is generated but required print/report form surface is missing.", {
        appPlanReference: ref(form),
        decodedPath: actual.path,
        plannedForm: form.name,
      }));
    }
    if (form.requiresFormAction && !/control_action|form_action|Submit|submitType|actions?/i.test(formText)) {
      findings.push(error("GENERATED_FINAL_FORM_ACTION_MISSING", "Approval form is generated but App Plan-required form actions are missing.", {
        appPlanReference: ref(form),
        decodedPath: actual.path,
        plannedForm: form.name,
      }));
    }
  }
  const requiredCustomForms = plan.customForms.filter((item) => !item.deferred);
  if (requiredCustomForms.length) {
    const layoutText = JSON.stringify(inventory.data.childs.flatMap((child) => asArray(child.layouts)));
    for (const customForm of requiredCustomForms) {
      if (!layoutText.toLowerCase().includes(customForm.name.toLowerCase())) {
        findings.push(error("GENERATED_FINAL_CUSTOM_DATA_LIST_FORM_MISSING", "App Plan declares a custom data list/document library form, but no corresponding generated layout/form was found.", {
          appPlanReference: ref(customForm),
          decodedPath: "$.Childs[].Layouts[]",
          plannedForm: customForm.name,
        }));
      }
    }
  }
}

function validateDashboardMaterialization(plan, inventory, findings) {
  for (const dashboard of plan.dashboards.filter((item) => !item.deferred)) {
    const page = findByName(inventory.pages, dashboard.name) || inventory.pages.find((candidate) => candidate.type === "103" && norm(candidate.name).includes(norm(dashboard.name)));
    if (!page) {
      findings.push(error("GENERATED_FINAL_DASHBOARD_PAGE_MISSING", "App Plan declares a dashboard page that is missing from decoded $.Pages[].", {
        appPlanReference: ref(dashboard),
        decodedPath: "$.Pages[]",
        plannedDashboard: dashboard.name,
      }));
      continue;
    }
    const contentNodes = page.contentNodes.length ? page.contentNodes : page.resources.map((resource) => ({ pointer: resource.path, raw: resource.raw, children: controlChildren(resource.raw) }));
    const hasMaterializedContent = contentNodes.some((node) => asArray(node.children).length > 0);
    const businessControls = page.controls.filter((control) => control.type && control.type !== "page" && control.type !== "main");
    if (!hasMaterializedContent || !businessControls.length || onlyShellControls(businessControls)) {
      findings.push(error("GENERATED_FINAL_DASHBOARD_SHELL_ONLY", "Dashboard page is only a shell or has empty Content.children while App Plan declares business dashboard content.", {
        appPlanReference: ref(dashboard),
        decodedPath: page.contentNodes[0]?.pointer ? `${page.contentNodes[0].pointer}.children` : `${page.path}.LayoutInResources[].Resource`,
        plannedDashboard: dashboard.name,
      }));
    }
    if (dashboard.metrics.length && !page.controls.some((control) => control.type === "summary" || /\bkpi\b|summary card|metric/i.test(control.name))) {
      findings.push(error("GENERATED_FINAL_DASHBOARD_METRICS_MISSING", "Dashboard App Plan declares metrics/Summary/KPI regions, but no data-bound Summary/KPI controls were found.", {
        appPlanReference: refs(dashboard.metrics),
        decodedPath: page.path,
        plannedDashboard: dashboard.name,
      }));
    }
    if (dashboard.filters.length && !page.controls.some((control) => DASHBOARD_FILTER_CONTROLS.has(control.type))) {
      findings.push(error("GENERATED_FINAL_DASHBOARD_FILTERS_MISSING", "Dashboard App Plan declares filters, but no generated filter controls were found.", {
        appPlanReference: refs(dashboard.filters),
        decodedPath: page.path,
        plannedDashboard: dashboard.name,
      }));
    }
    const plannedRecordRegions = dashboard.recordRegions.length || dashboard.sections.some((section) => /work queue|portfolio|register|list|table|collection|kanban|timeline|records?/i.test(JSON.stringify(section)));
    if (plannedRecordRegions && !page.controls.some((control) => DASHBOARD_RECORD_CONTROLS.has(control.type))) {
      findings.push(error("GENERATED_FINAL_DASHBOARD_RECORD_REGION_MISSING", "Dashboard App Plan declares record-display regions, but no Collection/Data table/Kanban/Timeline region was generated.", {
        appPlanReference: dashboard.recordRegions.length ? refs(dashboard.recordRegions) : refs(dashboard.sections),
        decodedPath: page.path,
        plannedDashboard: dashboard.name,
      }));
    }
    if (dashboard.dynamicControls.length && onlyShellControls(businessControls)) {
      findings.push(error("GENERATED_FINAL_DASHBOARD_DYNAMIC_TEMPLATE_MISSING", "Dashboard App Plan declares item-template dynamic display needs, but the generated dashboard has no materialized item-template controls.", {
        appPlanReference: refs(dashboard.dynamicControls),
        decodedPath: page.path,
        plannedDashboard: dashboard.name,
      }));
    }
  }
}

function validateNavigationCompleteness(plan, inventory, findings) {
  const plannedGroups = plan.navigation.groups.filter((group) => !group.deferred);
  if (!plannedGroups.length) return;
  const generatedGroups = inventory.navigation.groups;
  if (generatedGroups.length <= 1 && plannedGroups.length > 1) {
    findings.push(error("GENERATED_FINAL_NAVIGATION_GENERIC_ONLY", "App Plan declares multiple navigation groups, but decoded package has only a generic/default group.", {
      appPlanReference: refs(plannedGroups),
      decodedPath: "$.ListSet.LayoutView.sort",
      generatedGroups: generatedGroups.map((group) => group.name),
    }));
  }
  for (const group of plannedGroups) {
    const actualGroup = generatedGroups.find((candidate) => norm(candidate.name) === norm(group.name));
    if (!actualGroup) {
      findings.push(error("GENERATED_FINAL_NAVIGATION_GROUP_MISSING", "App Plan declares a navigation group that is missing from decoded navigation.", {
        appPlanReference: ref(group),
        decodedPath: "$.ListSet.LayoutView.sort[]",
        plannedGroup: group.name,
      }));
      continue;
    }
    for (const item of group.items.filter((candidate) => !candidate.deferred)) {
      if (!findByName(actualGroup.items, item.item) && !findByName(actualGroup.items, item.name)) {
        findings.push(error("GENERATED_FINAL_NAVIGATION_ITEM_MISSING", "App Plan declares a navigation item that is missing from its planned group.", {
          appPlanReference: ref(item),
          decodedPath: `${actualGroup.path}.list[]`,
          plannedGroup: group.name,
          plannedItem: item.item || item.name,
        }));
      }
      const plannedDataListView = plan.dataListViews.find((view) => norm(view.name) === norm(item.name) || norm(view.name) === norm(item.item));
      const plannedViewHostExists = plannedDataListView
        ? inventory.dataLists.some((resource) => norm(resource.name) === norm(plannedDataListView.host))
        : false;
      const resourceExists = plannedViewHostExists || inventory.dataLists.concat(inventory.approvalForms, inventory.formReports, inventory.pages).some((resource) => norm(resource.name) === norm(item.name) || norm(resource.name) === norm(item.item));
      if (!resourceExists && !/external|not applicable|deferred/i.test(item.type)) {
        findings.push(error("GENERATED_FINAL_NAVIGATION_TARGET_UNRESOLVED", "Navigation item target does not match any generated dashboard/form/list/report resource.", {
          appPlanReference: ref(item),
          decodedPath: "$.ListSet.LayoutView.sort",
          plannedTarget: item.name,
        }));
      }
    }
  }
}

function validateNoPartialSurface(plan, inventory, decoded, findings) {
  const text = `${decoded.Description || ""} ${decoded.GenerationStatus || ""} ${decoded.Status || ""} ${JSON.stringify(decoded.GenerationReport || decoded.generatedFinalReport || {})}`;
  if (/intentionally incomplete|partial generated-final|shell-only|placeholder package|incomplete surface/i.test(text)) {
    const hasAllowedDeferral = plan.deferred.length > 0;
    if (!hasAllowedDeferral) {
      findings.push(error("GENERATED_FINAL_PARTIAL_SURFACE_DECLARED_COMPLETE", "Generated-final package/report indicates an incomplete or shell-only surface without explicit App Plan deferral.", {
        appPlanReference: { section: "## 22. Deferred or Runtime-Proof Items" },
        decodedPath: "$.GenerationReport|$.Description",
      }));
    }
  }
  if (plan.formReports.some((item) => !item.deferred) && !inventory.formReports.length) {
    findings.push(error("GENERATED_FINAL_FORMNEWREPORTS_EMPTY_WITH_PLANNED_REPORTS", "App Plan declares Form Reports, but decoded package has FormNewReports: [].", {
      appPlanReference: refs(plan.formReports.filter((item) => !item.deferred)),
      decodedPath: "$.FormNewReports",
    }));
  }
  const dataReportPlanned = /\bDataReports?\b/i.test(plan.text) && /Required|Yes|planned/i.test(plan.text);
  if (dataReportPlanned && !inventory.dataReports.length && !isDeferred(plan.deferred, "DataReports", "reports")) {
    findings.push(error("GENERATED_FINAL_DATAREPORTS_EMPTY_WITH_PLANNED_REPORTS", "App Plan declares DataReports/Data Reports, but decoded package has DataReports: [].", {
      appPlanReference: { line: lineNumberFor(plan.text, "DataReports") },
      decodedPath: "$.DataReports",
    }));
  }
}

function comparePlanned(plannedItems, actualItems, findings, config) {
  for (const item of plannedItems.filter((candidate) => !candidate.deferred)) {
    if (!findByName(actualItems, item.name)) {
      findings.push(error(config.code, config.message, {
        appPlanReference: ref(item),
        decodedPath: config.decodedPath,
        plannedName: item.name,
      }));
    }
  }
}

function collectNavigation(root) {
  const layoutView = parseJsonMaybe(root?.LayoutView) || root?.LayoutView || {};
  const sort = asArray(layoutView.sort);
  const groups = [];
  const flatItems = [];
  for (const [index, entry] of sort.entries()) {
    const name = titleOf(entry);
    const children = asArray(entry.list || entry.children || entry.items || entry.Childs);
    if (children.length || entry.Type === "classes") {
      groups.push({
        name,
        path: `$.ListSet.LayoutView.sort[${index}]`,
        items: children.map((child, childIndex) => ({ name: titleOf(child), path: `$.ListSet.LayoutView.sort[${index}].list[${childIndex}]`, raw: child })),
      });
    } else if (name) {
      flatItems.push({ name, path: `$.ListSet.LayoutView.sort[${index}]`, raw: entry });
    }
  }
  return { groups, flatItems };
}

function plannedItem(name, section, index, category, extras = {}) {
  const cleaned = cleanName(name);
  const near = section.slice(Math.max(0, index - 300), Math.min(section.length, index + 800));
  return {
    name: cleaned,
    category,
    line: null,
    deferred: hasExplicitDeferredStatus(near),
    ...extras,
  };
}

function extractSection(text, headingPattern) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let active = false;
  let level = 0;
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      const currentLevel = heading[1].length;
      if (active && currentLevel <= level) break;
      if (!active && headingPattern.test(line)) {
        active = true;
        level = currentLevel;
      }
    }
    if (active) out.push(line);
  }
  return out.join("\n");
}

function extractSubsection(section, headingPattern) {
  const lines = section.split(/\r?\n/);
  const out = [];
  let active = false;
  let level = 0;
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      const currentLevel = heading[1].length;
      if (active && currentLevel <= level) break;
      if (!active && headingPattern.test(line)) {
        active = true;
        level = currentLevel;
      }
    }
    if (active) out.push(line);
  }
  return out.join("\n");
}

function firstTableValue(text, header) {
  const table = parseMarkdownTables(text).find((candidate) => candidate.headers.includes(header));
  return table?.rows?.[0]?.[header] || "";
}

function extractBullet(text, label) {
  const match = text.match(new RegExp(`^-\\s*${escapeRegExp(label)}:\\s*(.+?)\\s*$`, "im"));
  return match?.[1] || "";
}

function isTableLine(line) {
  return /^\s*\|.+\|\s*$/.test(line || "");
}

function splitTableLine(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cleanName(cell));
}

function findHeaderIndex(normalizedHeaders, candidates) {
  const normalizedCandidates = candidates.map((candidate) => norm(candidate));
  return normalizedHeaders.findIndex((header) => normalizedCandidates.includes(header));
}

function uniqueByNorm(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const key = norm(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function uniqueByName(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = norm(item?.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function controlChildren(control) {
  if (!isObject(control)) return [];
  return ["children", "Childs", "columns", "controls", "Items", "items"].flatMap((key) => asArray(control[key]));
}

function onlyShellControls(controls) {
  const material = controls.filter((control) => !["page", "main", "root"].includes(control.type));
  return material.length > 0 && material.every((control) => control.type === "container");
}

function titleOf(value) {
  return cleanName(value?.Title || value?.title || value?.Name || value?.name || value?.DisplayName || value?.displayName || value?.Key || value?.key || value?.ListName || "");
}

function cleanName(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isPlaceholder(value) {
  const text = cleanName(value);
  return !text
    || /^x$/i.test(text)
    || /^(not planned|not applicable|n\/a|none|no|deferred)$/i.test(text)
    || /^no\s+(?:form\s+)?reports?\b/i.test(text)
    || /^(name|dashboard|form|report|workflow|section|filter|metric|list|library|item)$/i.test(text)
    || /^<.*>$/.test(String(value || "").trim());
}

function norm(value) {
  return cleanName(value).replace(/[_-]+/g, " ").replace(/[^\p{L}\p{N} ]/gu, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function findByName(items, name) {
  const key = norm(name);
  return items.find((item) => {
    const candidate = norm(item.name);
    return candidate === key || candidate.includes(key) || key.includes(candidate);
  });
}

function isDeferred(deferredItems, name, category) {
  const key = norm(name);
  const categoryKey = norm(category);
  return deferredItems.some((item) => {
    const itemKey = norm(item.name);
    const itemCategory = norm(item.category);
    return (itemKey === key || itemKey.includes(key) || key.includes(itemKey)) && (!itemCategory || itemCategory.includes(categoryKey) || categoryKey.includes(itemCategory));
  });
}

function hasExplicitDeferredStatus(text) {
  return String(text || "")
    .split(/\r?\n/)
    .filter((line) => !/Proof Boundary or Deferred Note|Fallback \/ Deferred Reason|^\s*\|?\s*:?-{3,}/i.test(line))
    .some((line) => /\bdeferred\b/i.test(line) && /\breason\b|\bfallback\b|\bproof\b|\bimpact\b|\bfollow-up\b/i.test(line));
}

function ref(item) {
  return { item: item.name, category: item.category || null, line: item.line || null };
}

function refs(items) {
  return items.map(ref);
}

function lineNumberFor(text, needle) {
  const normalizedNeedle = String(needle || "").trim();
  if (!normalizedNeedle) return null;
  const lines = text.split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(normalizedNeedle));
  return index >= 0 ? index + 1 : null;
}

function summarizePlan(plan) {
  return {
    dataLists: plan.dataLists.length,
    approvalForms: plan.approvalForms.length,
    formReports: plan.formReports.length,
    customForms: plan.customForms.length,
    dashboards: plan.dashboards.length,
    navigationGroups: plan.navigation.groups.length,
    deferredItems: plan.deferred.length,
  };
}

function summarizeDecoded(decoded) {
  const data = appData(decoded);
  return {
    forms: asArray(data.forms).length,
    formNewReports: asArray(data.formNewReports).length,
    dataReports: asArray(data.dataReports).length,
    pages: asArray(data.pages).length,
    childs: asArray(data.childs).length,
  };
}

function error(code, message, detail = {}) {
  return { level: "error", code, message, ...detail };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
