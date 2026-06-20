#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const DEFAULT_GROUPED_NAVIGATION_EXPORT_PROVEN = false;
const RESOURCE_BUCKETS = [
  "dataLists",
  "approvalForms",
  "workflows",
  "pages",
  "reports",
  "agents",
  "copilots",
  "tools",
  "knowledgeResources",
  "integrations",
  "connections",
  "permissions",
  "adminResources",
  "teams",
];
const STATUS = {
  IMPLEMENTED: "implemented",
  PARTIAL: "partially_implemented",
  MISSING: "missing",
  EXTRA: "extra_unplanned",
  UNSUPPORTED: "unsupported_unproven_export_shape",
  DEFERRED: "intentionally_deferred_with_reason",
};

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-app-plan-conformance.mjs --plan <plan.md|plan.json> --package <app.yap|app.yapk|decoded.json> [--mode default|strict] [--grouped-navigation-export-proven true|false]",
    "",
    "Compares an approved app plan to a generated Yeeflow package implementation without printing raw Resource, Sign, API payloads, or private IDs.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = {
    planPath: "",
    packagePath: "",
    mode: "default",
    groupedNavigationExportProven: DEFAULT_GROUPED_NAVIGATION_EXPORT_PROVEN,
  };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--plan") args.planPath = argv[++index] || "";
    else if (arg === "--package") args.packagePath = argv[++index] || "";
    else if (arg === "--mode") args.mode = argv[++index] || "";
    else if (arg === "--grouped-navigation-export-proven") {
      const value = String(argv[++index] || "").toLowerCase();
      args.groupedNavigationExportProven = value === "true" || value === "1" || value === "yes";
    } else usage();
  }
  if (!args.planPath || !args.packagePath) usage();
  if (!["default", "strict"].includes(args.mode)) usage();
  return args;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function normalizeName(value) {
  return safeString(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .trim()
    .toLowerCase();
}

function titleCaseBucket(bucket) {
  return bucket.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function uniqueStrings(values) {
  const seen = new Set();
  const out = [];
  for (const value of values.map(safeString).map((v) => v.trim()).filter(Boolean)) {
    const key = normalizeName(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function parseMaybeJson(value) {
  if (isObject(value) || Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value.replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function decodePackage(file) {
  const parsed = readJson(file);
  if (typeof parsed?.Resource === "string" && file.toLowerCase().endsWith(".yapk")) {
    return {
      packageType: "yapk",
      wrapperSummary: { hasResource: true, hasSign: Boolean(parsed.Sign) },
      decoded: JSON.parse(zlib.brotliDecompressSync(Buffer.from(parsed.Resource, "base64")).toString("utf8")),
    };
  }
  if (typeof parsed?.Resource === "string") {
    if (!parsed.Resource.startsWith(GZIP_PREFIX)) {
      return { packageType: "unknown", wrapperSummary: { hasResource: true, hasSign: Boolean(parsed.Sign) }, decoded: parsed };
    }
    const decoded = JSON.parse(zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
    const data = typeof decoded?.Data === "string" ? JSON.parse(decoded.Data) : decoded?.Data || decoded;
    return { packageType: "yap", wrapperSummary: { hasResource: true, hasSign: Boolean(parsed.Sign) }, decoded: data };
  }
  return { packageType: "decoded", wrapperSummary: { hasResource: false, hasSign: false }, decoded: parsed };
}

function splitItems(text) {
  return uniqueStrings(
    safeString(text)
      .split(/,|;|\||\band\b/gi)
      .map((item) => item.replace(/^[\s\-*0-9.)]+/, "").trim())
      .filter(Boolean),
  );
}

function splitResourceNames(text) {
  return uniqueStrings(
    safeString(text)
      .split(/[,;|]/g)
      .map((item) => item.replace(/^[\s\-*0-9.)]+/, "").trim())
      .filter(Boolean),
  );
}

function coercePlannedItems(value) {
  return asArray(value).flatMap((item) => {
    if (typeof item === "string") return [{ title: item }];
    if (isObject(item)) return [{ ...item, title: safeString(item.title || item.name || item.label || item.id) }];
    return [];
  }).filter((item) => item.title);
}

function extractMarkdownNavigation(text) {
  const groups = [];
  const section = extractMarkdownSection(text, /application navigation|navigation/i);
  for (const table of markdownTables(section || "")) {
    const header = table.header.map((cell) => normalizeName(cell));
    const groupIndex = header.findIndex((cell) => /^(navigation )?group$/.test(cell) || cell === "group name");
    const itemIndex = header.findIndex((cell) => /^(navigation )?(item|items|page|pages|resource|resources)$/.test(cell) || cell === "child items");
    if (groupIndex >= 0 && itemIndex >= 0) {
      for (const row of table.rows) {
        const title = row[groupIndex];
        const items = splitResourceNames(row[itemIndex]);
        if (title && items.length) groups.push({ title, items });
      }
      continue;
    }
    if (table.header.length === 2) {
      for (const row of table.rows) {
        const title = row[0];
        const items = splitResourceNames(row[1]);
        if (title && items.length) groups.push({ title, items });
      }
    }
  }
  return groups;
}

function isPlaceholderResourceName(value) {
  const text = safeString(value).trim();
  if (!text) return true;
  if (/^<.*>$/.test(text)) return true;
  if (/^(name|resource name|planned resource name|n\/a|na|none|not applicable|applicable|tbd|yes\/no|yes|no|true|false|group|item|visible|hidden)$/i.test(text)) return true;
  if (/^(empty|standard|native|default|optional|required|not required|not planned|no .+ planned)$/i.test(text)) return true;
  return false;
}

function isAggregateOrDetailResourceName(value) {
  const text = safeString(value).trim();
  if (!text) return true;
  return [
    /\bforms? for all lists\b/i,
    /\bstandard (list|data list|form|view) experience\b/i,
    /\boperational views?\b/i,
    /\brole[-\s]specific .*views?\b/i,
    /\b(workload|operations?) dashboards?\b/i,
    /\bgrouped app navigation\b/i,
    /\bplaceholder app groups?\b/i,
    /\bpermission intent\b/i,
    /\bfollow-up lifecycle workflows?\b/i,
    /\blifecycle automations?\b/i,
    /\blifecycle notifications?\b/i,
    /\bcurrent requester intent\b/i,
  ].some((pattern) => pattern.test(text));
}

function bucketForResourceType(value) {
  const type = safeString(value).toLowerCase();
  if (/\b(form reports?|reports?)\b/.test(type)) return "reports";
  if (/\b(workflows?|automations?|form actions?)\b/.test(type)) return "workflows";
  if (/\b(dashboards?|pages?|workspaces?)\b/.test(type) && !/\bviews?\b/.test(type)) return "pages";
  if (/\bapproval forms?\b|\bforms?\b/.test(type) && !/\breports?\b/.test(type)) return "approvalForms";
  if (/\b(document libraries|document library|data lists?|lists?)\b/.test(type)) return "dataLists";
  if (/\bai agents?\b|\bagents?\b/.test(type)) return "agents";
  if (/\bcopilots?\b/.test(type)) return "copilots";
  if (/\btools?\b/.test(type)) return "tools";
  if (/\bknowledge\b/.test(type)) return "knowledgeResources";
  if (/\bintegration\b/.test(type)) return "integrations";
  if (/\bconnection|connector\b/.test(type)) return "connections";
  if (/\bpermission|security|role|access\b/.test(type)) return "permissions";
  if (/\badmin|setting|category|tag|attribute|audit\b/.test(type)) return "adminResources";
  if (/\bteam|group\b/.test(type)) return "teams";
  return "";
}

function splitMarkdownTableCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  return trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
}

function isMarkdownSeparatorRow(cells) {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, "")));
}

function markdownTables(text) {
  const lines = text.split(/\r?\n/);
  const tables = [];
  for (let index = 0; index < lines.length; index += 1) {
    const header = splitMarkdownTableCells(lines[index]);
    const separator = splitMarkdownTableCells(lines[index + 1] || "");
    if (!header || !separator || !isMarkdownSeparatorRow(separator)) continue;
    const rows = [];
    index += 2;
    while (index < lines.length) {
      const cells = splitMarkdownTableCells(lines[index]);
      if (!cells) break;
      rows.push(cells);
      index += 1;
    }
    index -= 1;
    tables.push({ header, rows });
  }
  return tables;
}

function addMarkdownResource(resources, bucket, title) {
  if (!bucket || isPlaceholderResourceName(title)) return;
  if (isAggregateOrDetailResourceName(title)) return;
  resources[bucket] = resources[bucket] || [];
  resources[bucket].push({ title: safeString(title).trim() });
}

function addMarkdownResources(resources, bucket, titleCell) {
  for (const title of splitResourceNames(titleCell)) addMarkdownResource(resources, bucket, title);
}

function extractMarkdownResourceDeclarations(text) {
  const resources = Object.fromEntries(RESOURCE_BUCKETS.map((bucket) => [bucket, []]));
  for (const table of markdownTables(text)) {
    const header = table.header.map((cell) => normalizeName(cell));
    const resourceTypeIndex = header.findIndex((cell) => cell === "yeeflow resource type" || cell === "resource type");
    const resourceNameIndex = header.findIndex((cell) => cell === "planned resource name" || cell === "resource name");
    if (resourceTypeIndex >= 0 && resourceNameIndex >= 0) {
      for (const row of table.rows) addMarkdownResources(resources, bucketForResourceType(row[resourceTypeIndex]), row[resourceNameIndex]);
      continue;
    }
    const directColumns = [
      ["form report name", "reports"],
      ["workflow name", "workflows"],
      ["schedule workflow name", "workflows"],
      ["ai agent name", "agents"],
      ["copilot name", "copilots"],
      ["tool name", "tools"],
      ["knowledge resource name", "knowledgeResources"],
      ["integration name", "integrations"],
      ["connection name", "connections"],
      ["permission resource name", "permissions"],
      ["admin resource name", "adminResources"],
      ["team name", "teams"],
      ["dashboard page name", "pages"],
      ["page name", "pages"],
    ];
    for (const [column, bucket] of directColumns) {
      const index = header.indexOf(column);
      if (index < 0) continue;
      for (const row of table.rows) addMarkdownResources(resources, bucket, row[index]);
    }
  }
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^###\s+(4|5)\.(?:x|\d+)\s+(.+?)\s*$/i);
    if (!match) continue;
    const bucket = match[1] === "4" ? "dataLists" : "approvalForms";
    addMarkdownResource(resources, bucket, match[2]);
  }
  return Object.fromEntries(Object.entries(resources).map(([bucket, items]) => [bucket, uniqueStrings(items.map((item) => item.title)).map((title) => ({ title }))]));
}

function extractMarkdownSection(text, headingPattern) {
  const lines = text.split(/\r?\n/);
  const section = [];
  let active = false;
  let activeLevel = 0;
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      const level = heading[1].length;
      if (active && level <= activeLevel) break;
      if (!active && headingPattern.test(heading[2])) {
        active = true;
        activeLevel = level;
        section.push(line);
        continue;
      }
    }
    if (active) section.push(line);
  }
  return section.join("\n").trim();
}

function hasPattern(text, pattern) {
  return pattern.test(safeString(text));
}

function inspectMarkdownGenerationContract(text) {
  const section = extractMarkdownSection(text, /generation contract and hard gates/i);
  if (!section) return { present: false, source: "markdown", sections: {}, findings: [] };
  const sections = {
    outputPackage: hasPattern(section, /output package|default output|package generation|\.yapk|\.yap/i),
    signingGate: hasPattern(section, /signing|setsign|verifysign|placeholder sign|upload readiness/i),
    approvalFormContract: hasPattern(section, /approval form contract|approval required|request page|task pages|workflow control panel|DefResource/i),
    navigationRuntimeContract: hasPattern(section, /navigation runtime contract|Type:\s*"?classes"?|Type:\s*105|Type:\s*103|Type:\s*1|unreachable/i),
    planToPackageConformance: hasPattern(section, /plan-to-package|plan to package|planned lists|planned fields|planned forms|planned workflows|conformance/i),
    proofBoundary: hasPattern(section, /proof boundary|required proof report|schema validation|app-plan conformance|runtime UI inspection/i),
    runtimeInspectionChecklist: hasPattern(section, /runtime inspection|app opens|navigation groups render|request page opens|task pages exist|lists open/i),
  };
  return { present: true, source: "markdown", sections, findings: [] };
}

function inspectObjectGenerationContract(source) {
  const contract = source.generationContract || source.generationContractAndHardGates || source.hardGates || source.outputContract || {};
  if (!isObject(contract) || !Object.keys(contract).length) return { present: false, source: "json", sections: {}, findings: [] };
  const has = (...keys) => keys.some((key) => contract[key] !== undefined);
  const sections = {
    outputPackage: has("outputPackage", "package", "defaultOutput", "packageType"),
    signingGate: has("signingGate", "yapkSigningGate", "signing", "apiSigning"),
    approvalFormContract: has("approvalFormContract", "approval", "approvalForms"),
    navigationRuntimeContract: has("navigationRuntimeContract", "navigation", "navigationRuntime"),
    planToPackageConformance: has("planToPackageConformance", "conformance", "planConformance"),
    proofBoundary: has("proofBoundary", "proofReport", "requiredProofReport"),
    runtimeInspectionChecklist: has("runtimeInspectionChecklist", "runtimeInspection", "runtimeChecklist"),
  };
  return { present: true, source: "json", sections, findings: [] };
}

function parsePlan(planPath) {
  const text = fs.readFileSync(planPath, "utf8").replace(/^\uFEFF/, "");
  const parsed = parseMaybeJson(text);
  if (parsed) return normalizePlan(parsed, { path: planPath, sourceType: "json" });
  const navGroups = extractMarkdownNavigation(text);
  const resources = extractMarkdownResourceDeclarations(text);
  return normalizePlan({
    resources,
    navigation: {
      groupedNavigationRequired: navGroups.length > 0,
      groups: navGroups,
    },
    generationContract: inspectMarkdownGenerationContract(text),
  }, { path: planPath, sourceType: "markdown" });
}

function normalizePlan(raw, meta = {}) {
  const source = raw.appPlanConformance || raw.planConformance || raw;
  const resources = {};
  const rawResources = source.resources || source.plannedResources || {};
  for (const bucket of RESOURCE_BUCKETS) {
    resources[bucket] = coercePlannedItems(rawResources[bucket] || source[bucket]);
  }
  const navigation = source.navigation || source.plannedNavigation || {};
  const groups = asArray(navigation.groups || navigation.navigationGroups).map((group) => ({
    title: safeString(group.title || group.name || group.group).trim(),
    items: uniqueStrings(asArray(group.items || group.children || group.resources).map((item) => safeString(isObject(item) ? item.title || item.name || item.label || item.id : item))),
  })).filter((group) => group.title);
  const deferred = coercePlannedItems(source.deferred || source.intentionallyDeferred || source.deferredItems)
    .filter((item) => item.reason || item.deferReason)
    .map((item) => ({ ...item, reason: safeString(item.reason || item.deferReason) }));
  return {
    path: meta.path || "",
    sourceType: meta.sourceType || "object",
    resources,
    navigation: {
      groupedNavigationRequired: Boolean(navigation.groupedNavigationRequired ?? navigation.requiresGroupedNavigation ?? groups.length),
      groups,
    },
    deferred,
    generationContract: source.generationContract?.present !== undefined
      ? source.generationContract
      : inspectObjectGenerationContract(source),
  };
}

function appData(decoded) {
  if (isObject(decoded?.ListSet)) {
    return {
      root: decoded.ListSet,
      pages: asArray(decoded.Pages),
      forms: asArray(decoded.Forms),
      reports: [...asArray(decoded.FormNewReports), ...asArray(decoded.DataReports)],
      childs: asArray(decoded.Childs).map((child) => ({
        list: child.List,
        fields: asArray(child.Fields),
        layouts: asArray(child.Layouts),
      })),
      agents: asArray(decoded.Agents || decoded.AppAgents),
      knowledge: asArray(decoded.Knowledges || decoded.AppKnowledges),
      portals: asArray(decoded.Portals || decoded.PortalInfo ? [decoded.PortalInfo].filter(Boolean) : []),
    };
  }
  return {
    root: decoded?.Item?.ListModel || {},
    pages: asArray(decoded?.Item?.Layouts),
    forms: asArray(decoded?.Forms),
    reports: [...asArray(decoded?.FormNewReports), ...asArray(decoded?.DataReports)],
    childs: asArray(decoded?.Childs).map((child) => ({
      list: child.ListModel || child.List,
      fields: asArray(child.Defs || child.Fields),
      layouts: asArray(child.Layouts),
    })),
    agents: asArray(decoded?.Agents || decoded?.AppAgents || decoded?.OtherModules?.Agents),
    knowledge: asArray(decoded?.Knowledges || decoded?.AppKnowledges || decoded?.OtherModules?.Knowledge),
    portals: asArray(decoded?.Portals || decoded?.SimplePortal ? [decoded.SimplePortal].filter(Boolean) : []),
  };
}

function titleOf(value) {
  return safeString(value?.Title || value?.title || value?.Name || value?.name || value?.DisplayName || value?.displayName || value?.Key || value?.key);
}

function collectInventory(decoded) {
  const data = appData(decoded);
  const pages = uniqueStrings(data.pages.map(titleOf));
  const dataLists = uniqueStrings(data.childs.map((child) => titleOf(child.list)));
  const approvalForms = uniqueStrings(data.forms.map((form) => titleOf(form) || titleOf(form.formdef) || safeString(form.key)));
  const reports = uniqueStrings(data.reports.map(titleOf));
  const formsText = JSON.stringify(data.forms);
  const allTitles = uniqueStrings([...pages, ...dataLists, ...approvalForms, ...reports]);
  const keywordMatches = (pattern) => allTitles.filter((title) => pattern.test(title));
  const workflows = uniqueStrings([
    ...approvalForms,
    ...keywordMatches(/workflow|approval|routing|process/i),
    ...Array.from(formsText.matchAll(/"type"\s*:\s*"?(MultiAssignmentTask|AssignmentTask|StartNoneEvent|EndRejectEvent)"?/gi)).map((match) => match[1]),
  ]);
  return {
    resources: {
      dataLists,
      approvalForms,
      workflows,
      pages,
      reports,
      agents: uniqueStrings(data.agents.map(titleOf)),
      copilots: uniqueStrings(data.agents.map(titleOf).filter((title) => /copilot/i.test(title))),
      tools: uniqueStrings(data.agents.flatMap((agent) => asArray(agent.Tools || agent.tools).map(titleOf))),
      knowledgeResources: uniqueStrings(data.knowledge.map(titleOf)),
      integrations: keywordMatches(/integration|connection|api|webhook|connector/i),
      connections: keywordMatches(/connection|integration|connector/i),
      permissions: keywordMatches(/permission|security|role|access/i),
      adminResources: keywordMatches(/setting|categor|tag|attribute|permission|audit|admin/i),
      teams: keywordMatches(/team/i),
    },
    navigation: collectNavigation(data.root),
    allTitles,
  };
}

function collectNavigation(root) {
  const layoutView = parseMaybeJson(root?.LayoutView) || {};
  const sort = asArray(layoutView.sort);
  const groups = [];
  const flatItems = [];
  const itemGroup = new Map();
  const invalidGroups = [];
  for (const item of sort) {
    const title = safeString(item.Title || item.title || item.name || item.label).trim();
    const runtimeList = asArray(item.list);
    const localChildren = asArray(item.children || item.items || item.Childs || item.childs);
    const children = runtimeList.length ? runtimeList : localChildren;
    const groupTitle = safeString(item.Group || item.group || item.GroupTitle || item.groupTitle || item.ParentTitle || item.parentTitle).trim();
    const isRuntimeGroup = item.Type === "classes";
    if (isRuntimeGroup && !runtimeList.length) invalidGroups.push({ title, reason: "TYPE_CLASSES_WITHOUT_LIST" });
    if (localChildren.length) invalidGroups.push({ title, reason: "LOCAL_CHILDREN_GROUP_SHAPE" });
    if (children.length) {
      const childTitles = uniqueStrings(children.map((child) => safeString(child.Title || child.title || child.name || child.label)));
      groups.push({ title, items: childTitles });
      childTitles.forEach((childTitle) => itemGroup.set(normalizeName(childTitle), title));
      continue;
    }
    if (groupTitle) {
      let group = groups.find((candidate) => normalizeName(candidate.title) === normalizeName(groupTitle));
      if (!group) {
        group = { title: groupTitle, items: [] };
        groups.push(group);
      }
      group.items.push(title);
      itemGroup.set(normalizeName(title), groupTitle);
    } else if (title) flatItems.push(title);
  }
  for (const group of groups) group.items = uniqueStrings(group.items);
  return {
    shape: groups.length ? "grouped" : flatItems.length ? "flat" : "empty",
    groups,
    flatItems: uniqueStrings(flatItems),
    itemGroup,
    rawSortCount: sort.length,
    invalidGroups,
  };
}

function plannedDeferred(plan, bucket, title) {
  const key = normalizeName(title);
  return plan.deferred.find((item) => normalizeName(item.title) === key && (!item.bucket || item.bucket === bucket));
}

function hasGeneratedTitle(values, title) {
  const key = normalizeName(title);
  return values.some((value) => {
    const candidate = normalizeName(value);
    return candidate === key || candidate.includes(key) || key.includes(candidate);
  });
}

function classifyPlannedResources(plan, inventory, findings) {
  const coverage = {};
  let plannedCount = 0;
  let implementedCount = 0;
  let partialCount = 0;
  let missingCount = 0;
  let deferredCount = 0;
  for (const bucket of RESOURCE_BUCKETS) {
    const planned = plan.resources[bucket] || [];
    const generated = inventory.resources[bucket] || [];
    const generatedMatched = new Set();
    coverage[bucket] = {
      planned: planned.map((item) => {
        plannedCount += 1;
        const deferred = plannedDeferred(plan, bucket, item.title);
        if (deferred) {
          deferredCount += 1;
          return { title: item.title, status: STATUS.DEFERRED, reason: deferred.reason };
        }
        const generatedIndex = generated.findIndex((title) => normalizeName(title) === normalizeName(item.title));
        const partial = generatedIndex < 0 && generated.findIndex((title) => {
          const a = normalizeName(title);
          const b = normalizeName(item.title);
          return a.includes(b) || b.includes(a);
        });
        if (generatedIndex >= 0) {
          generatedMatched.add(generatedIndex);
          implementedCount += 1;
          return { title: item.title, status: STATUS.IMPLEMENTED, generatedTitle: generated[generatedIndex] };
        }
        if (partial >= 0) {
          generatedMatched.add(partial);
          partialCount += 1;
          return { title: item.title, status: STATUS.PARTIAL, generatedTitle: generated[partial] };
        }
        missingCount += 1;
        findings.push({
          level: "error",
          code: `PLAN_${bucket.toUpperCase()}_MISSING`,
          message: `Planned ${titleCaseBucket(bucket)} item is missing from the generated package.`,
          detail: { bucket, title: item.title },
          source: "plan-conformance",
        });
        return { title: item.title, status: STATUS.MISSING };
      }),
      generated,
      extra: generated.filter((_, index) => !generatedMatched.has(index) && planned.length > 0).map((title) => ({ title, status: STATUS.EXTRA })),
    };
  }
  return { coverage, counts: { plannedCount, implementedCount, partialCount, missingCount, deferredCount } };
}

function addNavigationFinding(findings, level, code, message, detail) {
  findings.push({ level, code, message, detail, source: "plan-conformance:navigation" });
}

function classifyNavigation(plan, inventory, options, findings) {
  const plannedGroups = plan.navigation.groups || [];
  const generatedNav = inventory.navigation;
  const groupedRequired = Boolean(plan.navigation.groupedNavigationRequired || plannedGroups.length);
  const summary = {
    groupedNavigationRequired: groupedRequired,
    groupedLayoutViewExportProven: options.groupedNavigationExportProven,
    generatedShape: generatedNav.shape,
    plannedGroups: plannedGroups.map((group) => ({ title: group.title, items: group.items })),
    generatedGroups: generatedNav.groups.map((group) => ({ title: group.title, items: group.items })),
    generatedFlatItems: generatedNav.flatItems,
    groupCoverage: [],
    unsupportedCount: 0,
    missingCount: 0,
    flatOnlyCount: 0,
    wrongGroupCount: 0,
    implementedCount: 0,
    resourceMissingFromNavigationCount: 0,
  };
  for (const invalidGroup of generatedNav.invalidGroups || []) {
    addNavigationFinding(
      findings,
      "error",
      invalidGroup.reason === "TYPE_CLASSES_WITHOUT_LIST" ? "PLAN_NAVIGATION_TYPE_CLASSES_MISSING_LIST" : "PLAN_NAVIGATION_LOCAL_CHILDREN_GROUP_SHAPE",
      invalidGroup.reason === "TYPE_CLASSES_WITHOUT_LIST"
        ? "Runtime navigation groups must use Type: \"classes\" with list[]."
        : "Runtime grouped navigation must not use local-only children/items/Childs group shape.",
      { group: invalidGroup.title, reason: invalidGroup.reason },
    );
  }
  if (!groupedRequired) return summary;
  if (!options.groupedNavigationExportProven && generatedNav.shape !== "grouped") {
    summary.unsupportedCount += plannedGroups.length;
    const level = options.mode === "strict" ? "error" : "warning";
    addNavigationFinding(
      findings,
      level,
      "PLAN_GROUPED_NAVIGATION_UNPROVEN_EXPORT_SHAPE",
      "Grouped navigation was requested by the plan, but grouped LayoutView export shape is not yet proven. Preserve plan grouping in the report and do not claim grouped navigation as fully implemented.",
      { plannedGroups: plannedGroups.map((group) => group.title), generatedShape: generatedNav.shape },
    );
  }
  if (generatedNav.shape === "flat") {
    const level = options.mode === "strict" ? "error" : "warning";
    addNavigationFinding(
      findings,
      level,
      "PLAN_NAVIGATION_FLAT_ONLY",
      "Generated navigation is flat while the approved app plan requested grouped navigation.",
      { plannedGroups: plannedGroups.map((group) => group.title), generatedFlatItems: generatedNav.flatItems },
    );
  }
  for (const plannedGroup of plannedGroups) {
    const generatedGroup = generatedNav.groups.find((group) => normalizeName(group.title) === normalizeName(plannedGroup.title));
    const groupStatus = generatedGroup ? STATUS.IMPLEMENTED : generatedNav.shape === "flat" && !options.groupedNavigationExportProven ? STATUS.UNSUPPORTED : STATUS.MISSING;
    if (groupStatus === STATUS.MISSING) {
      summary.missingCount += 1;
      addNavigationFinding(findings, "error", "PLAN_NAVIGATION_GROUP_MISSING", "Planned navigation group is missing from generated navigation.", { group: plannedGroup.title });
    }
    const items = plannedGroup.items.map((item) => {
      const inGroup = generatedGroup && hasGeneratedTitle(generatedGroup.items, item);
      const flat = hasGeneratedTitle(generatedNav.flatItems, item);
      const wrongGroup = generatedNav.groups.find((group) => normalizeName(group.title) !== normalizeName(plannedGroup.title) && hasGeneratedTitle(group.items, item));
      const existsAsResource = hasGeneratedTitle(inventory.allTitles, item);
      if (inGroup) {
        summary.implementedCount += 1;
        return { title: item, status: STATUS.IMPLEMENTED, group: plannedGroup.title };
      }
      if (wrongGroup) {
        summary.wrongGroupCount += 1;
        addNavigationFinding(findings, "error", "PLAN_NAVIGATION_ITEM_WRONG_GROUP", "Planned navigation item was generated under the wrong group.", { item, plannedGroup: plannedGroup.title, generatedGroup: wrongGroup.title });
        return { title: item, status: STATUS.PARTIAL, plannedGroup: plannedGroup.title, generatedGroup: wrongGroup.title };
      }
      if (flat) {
        summary.flatOnlyCount += 1;
        const level = options.mode === "strict" ? "error" : "warning";
        addNavigationFinding(findings, level, "PLAN_NAVIGATION_ITEM_FLAT_ONLY", "Planned grouped navigation item exists only in flat navigation.", { item, plannedGroup: plannedGroup.title });
        return { title: item, status: options.groupedNavigationExportProven ? STATUS.PARTIAL : STATUS.UNSUPPORTED, plannedGroup: plannedGroup.title };
      }
      if (existsAsResource) {
        summary.resourceMissingFromNavigationCount += 1;
        addNavigationFinding(findings, "error", "PLAN_RESOURCE_MISSING_FROM_NAVIGATION", "Planned item exists as a generated resource but is missing from navigation.", { item, plannedGroup: plannedGroup.title });
        return { title: item, status: STATUS.PARTIAL, plannedGroup: plannedGroup.title };
      }
      summary.missingCount += 1;
      addNavigationFinding(findings, "error", "PLAN_NAVIGATION_ITEM_MISSING", "Planned navigation item is missing from generated resources/navigation.", { item, plannedGroup: plannedGroup.title });
      return { title: item, status: STATUS.MISSING, plannedGroup: plannedGroup.title };
    });
    summary.groupCoverage.push({ title: plannedGroup.title, status: groupStatus, items });
  }
  const plannedItemKeys = new Set(plannedGroups.flatMap((group) => group.items).map(normalizeName));
  summary.extraNavigationItems = uniqueStrings([...generatedNav.flatItems, ...generatedNav.groups.flatMap((group) => group.items)])
    .filter((item) => !plannedItemKeys.has(normalizeName(item)))
    .map((item) => ({ title: item, status: STATUS.EXTRA }));
  for (const item of summary.extraNavigationItems) {
    addNavigationFinding(findings, "warning", "PLAN_NAVIGATION_EXTRA_UNPLANNED", "Generated navigation contains an extra item not found in the approved plan.", { item: item.title });
  }
  return summary;
}

function classifyGenerationContract(plan, decodedPackage, findings) {
  const contract = plan.generationContract || {};
  const requiredSections = [
    ["outputPackage", "Output Package"],
    ["signingGate", "YAPK Signing Gate"],
    ["approvalFormContract", "Approval Form Contract"],
    ["navigationRuntimeContract", "Navigation Runtime Contract"],
    ["planToPackageConformance", "Plan-to-Package Conformance Contract"],
    ["proofBoundary", "Proof Boundary Contract"],
    ["runtimeInspectionChecklist", "Runtime Inspection Checklist"],
  ];
  if (!contract.present) {
    findings.push({
      level: "error",
      code: "PLAN_GENERATION_CONTRACT_MISSING",
      message: "App plan is missing the mandatory Generation Contract and Hard Gates section.",
      source: "plan-conformance:generation-contract",
    });
    return { present: false, sections: {}, missingSections: requiredSections.map(([, label]) => label), source: contract.source || plan.sourceType };
  }
  const missingSections = [];
  for (const [key, label] of requiredSections) {
    if (!contract.sections?.[key]) {
      missingSections.push(label);
      findings.push({
        level: "error",
        code: `PLAN_GENERATION_CONTRACT_${key.replace(/[A-Z]/g, (char) => `_${char}`).toUpperCase()}_MISSING`,
        message: `Generation Contract and Hard Gates is missing ${label}.`,
        source: "plan-conformance:generation-contract",
      });
    }
  }
  if (decodedPackage.packageType === "yapk" && !decodedPackage.wrapperSummary.hasSign) {
    findings.push({
      level: "warning",
      code: "PLAN_YAPK_SIGNING_STATUS_UNREPORTED",
      message: "Generated YAPK wrapper has no Sign value; final reports must not describe it as upload-ready without setsign and verifysign proof.",
      source: "plan-conformance:generation-contract",
    });
  }
  return { present: true, sections: contract.sections || {}, missingSections, source: contract.source || plan.sourceType };
}

function classifyStrictResourceDrift(resourceCoverage, mode, findings) {
  if (mode !== "strict") return;
  const nonResourceWorkflowMarkers = new Set(["multiassignmenttask", "assignmenttask", "startnoneevent", "endrejectevent"]);
  for (const [bucket, coverage] of Object.entries(resourceCoverage)) {
    for (const item of coverage.planned || []) {
      if (item.status !== STATUS.PARTIAL) continue;
      findings.push({
        level: "error",
        code: `PLAN_${bucket.toUpperCase()}_MISMATCH`,
        message: `Planned ${titleCaseBucket(bucket)} item only partially matches the generated package in strict mode.`,
        detail: { bucket, title: item.title, generatedTitle: item.generatedTitle },
        source: "plan-conformance",
      });
    }
    for (const item of coverage.extra || []) {
      if (bucket === "workflows" && nonResourceWorkflowMarkers.has(normalizeName(item.title))) continue;
      findings.push({
        level: "error",
        code: `PLAN_${bucket.toUpperCase()}_EXTRA_UNPLANNED`,
        message: `Generated ${titleCaseBucket(bucket)} item is not declared by the approved app plan in strict mode.`,
        detail: { bucket, title: item.title },
        source: "plan-conformance",
      });
    }
  }
}

function buildRecommendations(findings, navigation) {
  const recommendations = [];
  if (findings.some((finding) => finding.code === "PLAN_GENERATION_CONTRACT_MISSING")) {
    recommendations.push("Add the mandatory Generation Contract and Hard Gates section to the approved app plan before generation.");
  }
  if (navigation.groupedNavigationRequired && !navigation.groupedLayoutViewExportProven) {
    recommendations.push("Confirm grouped LayoutView export shape from an export-proven Yeeflow app before generating grouped navigation metadata.");
  }
  if (findings.some((finding) => finding.code === "PLAN_NAVIGATION_LOCAL_CHILDREN_GROUP_SHAPE")) {
    recommendations.push("Replace local-only navigation group children/items/Childs with runtime Type: \"classes\" plus list[].");
  }
  if (findings.some((finding) => finding.code?.includes("_MISSING"))) {
    recommendations.push("Regenerate or repair the package so every planned resource is implemented or explicitly deferred with a reason.");
  }
  if (findings.some((finding) => finding.code === "PLAN_NAVIGATION_FLAT_ONLY" || finding.code === "PLAN_NAVIGATION_ITEM_FLAT_ONLY")) {
    recommendations.push("Preserve the approved navigation groups in the implementation report and use best-effort flat ordering only as an explicit fallback.");
  }
  if (findings.some((finding) => finding.code === "PLAN_NAVIGATION_EXTRA_UNPLANNED")) {
    recommendations.push("Review extra generated resources and either add them to the approved plan or remove them from the package/navigation.");
  }
  return uniqueStrings(recommendations);
}

function main() {
  const args = parseArgs(process.argv);
  const planPath = path.resolve(args.planPath);
  const packagePath = path.resolve(args.packagePath);
  if (!fs.existsSync(planPath)) throw new Error(`Plan file does not exist: ${planPath}`);
  if (!fs.existsSync(packagePath)) throw new Error(`Package file does not exist: ${packagePath}`);
  const plan = parsePlan(planPath);
  const decodedPackage = decodePackage(packagePath);
  const inventory = collectInventory(decodedPackage.decoded);
  const findings = [];
  const generationContract = classifyGenerationContract(plan, decodedPackage, findings);
  const resourceResult = classifyPlannedResources(plan, inventory, findings);
  classifyStrictResourceDrift(resourceResult.coverage, args.mode, findings);
  const navigation = classifyNavigation(plan, inventory, { mode: args.mode, groupedNavigationExportProven: args.groupedNavigationExportProven }, findings);
  const counts = {
    plannedFeatureCount: resourceResult.counts.plannedCount,
    implementedFeatureCount: resourceResult.counts.implementedCount,
    partiallyImplementedFeatureCount: resourceResult.counts.partialCount + navigation.flatOnlyCount + navigation.wrongGroupCount + navigation.resourceMissingFromNavigationCount,
    missingFeatureCount: resourceResult.counts.missingCount + navigation.missingCount,
    extraUnplannedResourceCount: Object.values(resourceResult.coverage).reduce((count, bucket) => count + bucket.extra.length, 0),
    unsupportedUnprovenItemCount: navigation.unsupportedCount,
    intentionallyDeferredItemCount: resourceResult.counts.deferredCount,
  };
  const errors = findings.filter((finding) => finding.level === "error").length;
  const warnings = findings.filter((finding) => finding.level === "warning").length;
  const report = {
    status: errors ? "fail" : warnings ? "pass_with_warnings" : "pass",
    mode: args.mode,
    proofBoundary: {
      schemaValidation: "separate",
      packageValidation: "separate",
      workflowGraphValidation: "separate",
      uiMaterializationValidation: "separate",
      planConformanceValidation: "this report",
      generationContractValidation: "this report",
      signingValidation: "separate",
      signatureVerification: "separate",
      apiInstallImportAcceptance: "separate",
      runtimeUiInspection: "separate",
    },
    plan: {
      path: plan.path,
      sourceType: plan.sourceType,
      navigationGroups: plan.navigation.groups.map((group) => group.title),
      generationContract,
    },
    package: {
      path: packagePath,
      packageType: decodedPackage.packageType,
      wrapperSummary: decodedPackage.wrapperSummary,
    },
    counts,
    resources: resourceResult.coverage,
    navigation,
    recommendations: buildRecommendations(findings, navigation),
    errors,
    warnings,
    findings,
  };
  console.log(JSON.stringify(report, null, 2));
  if (errors) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({
    status: "fail",
    errors: 1,
    warnings: 0,
    findings: [{ level: "error", code: "PLAN_CONFORMANCE_VALIDATION_FAILED", message: error.message, source: "plan-conformance" }],
  }, null, 2));
  process.exit(1);
}
