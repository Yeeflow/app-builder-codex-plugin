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

function coercePlannedItems(value) {
  return asArray(value).flatMap((item) => {
    if (typeof item === "string") return [{ title: item }];
    if (isObject(item)) return [{ ...item, title: safeString(item.title || item.name || item.label || item.id) }];
    return [];
  }).filter((item) => item.title);
}

function extractMarkdownNavigation(text) {
  const groups = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) continue;
    const cells = trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
    if (cells.length < 2) continue;
    if (/^-+$/.test(cells[0].replace(/\s+/g, "")) || /navigation group/i.test(cells[0])) continue;
    const title = cells[0];
    const items = splitItems(cells[1]);
    if (title && items.length) groups.push({ title, items });
  }
  return groups;
}

function extractMarkdownResourceSection(text, headingPattern) {
  const lines = text.split(/\r?\n/);
  const items = [];
  let active = false;
  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line)) active = headingPattern.test(line);
    else if (active && /^\s*(?:[-*]|\d+[.)])\s+/.test(line)) {
      const value = line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, "").replace(/\s+-\s+.*$/, "").trim();
      if (value) items.push(value);
    }
  }
  return uniqueStrings(items).map((title) => ({ title }));
}

function parsePlan(planPath) {
  const text = fs.readFileSync(planPath, "utf8").replace(/^\uFEFF/, "");
  const parsed = parseMaybeJson(text);
  if (parsed) return normalizePlan(parsed, { path: planPath, sourceType: "json" });
  const navGroups = extractMarkdownNavigation(text);
  const resources = {
    dataLists: extractMarkdownResourceSection(text, /data lists?|tables?|resources?/i),
    approvalForms: extractMarkdownResourceSection(text, /forms?|approvals?/i),
    workflows: extractMarkdownResourceSection(text, /workflows?|operations?/i),
    pages: extractMarkdownResourceSection(text, /dashboards?|pages?|workspace/i),
    reports: extractMarkdownResourceSection(text, /reports?/i),
    integrations: extractMarkdownResourceSection(text, /integrations?|connections?/i),
    permissions: extractMarkdownResourceSection(text, /permissions?|security/i),
    adminResources: extractMarkdownResourceSection(text, /settings|admin/i),
  };
  for (const group of navGroups) {
    const target = /settings/i.test(group.title) ? "adminResources"
      : /operations/i.test(group.title) ? "workflows"
        : "pages";
    resources[target] = uniqueStrings([...(resources[target] || []).map((item) => item.title), ...group.items]).map((title) => ({ title }));
  }
  return normalizePlan({
    resources,
    navigation: {
      groupedNavigationRequired: navGroups.length > 0,
      groups: navGroups,
    },
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
  for (const item of sort) {
    const title = safeString(item.Title || item.title || item.name || item.label).trim();
    const children = asArray(item.children || item.items || item.Childs || item.childs);
    const groupTitle = safeString(item.Group || item.group || item.GroupTitle || item.groupTitle || item.ParentTitle || item.parentTitle).trim();
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

function buildRecommendations(findings, navigation) {
  const recommendations = [];
  if (navigation.groupedNavigationRequired && !navigation.groupedLayoutViewExportProven) {
    recommendations.push("Confirm grouped LayoutView export shape from an export-proven Yeeflow app before generating grouped navigation metadata.");
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
  const resourceResult = classifyPlannedResources(plan, inventory, findings);
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
    },
    plan: {
      path: plan.path,
      sourceType: plan.sourceType,
      navigationGroups: plan.navigation.groups.map((group) => group.title),
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
