#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ICON = JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-laptop", c: "#0065FF" });

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }
  const report = materializeFullAppGeneratedFinal(args);
  if (args.json) console.log(JSON.stringify(report, null, 2));
  else printTextReport(report);
  process.exit(report.status === "pass" ? 0 : 1);
}

export function materializeFullAppGeneratedFinal(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const specPath = resolveRequiredPath(cwd, options.functionalSpec || options.spec, "functional-specification.md");
  const planPath = resolveRequiredPath(cwd, options.appPlan || options.plan, "yeeflow-app-plan.md");
  const outDir = path.resolve(cwd, options.outDir || "dist");
  const findings = [];

  if (!specPath) findings.push(error("FULL_APP_MATERIALIZATION_SPEC_REQUIRED", "Missing --functional-spec functional-specification.md input."));
  if (!planPath) findings.push(error("FULL_APP_MATERIALIZATION_PLAN_REQUIRED", "Missing --app-plan yeeflow-app-plan.md input."));
  if (findings.length) return buildFailure(findings, { outDir });

  const fixtureMode = options.allowFixtureApiIdsForTests === true;
  const idSource = loadIdSource({ cwd, apiIdManifest: options.apiIdManifest, fixtureMode, findings });
  if (findings.length) return buildFailure(findings, { outDir, specPath, planPath });

  const specText = fs.readFileSync(specPath, "utf8");
  const planText = fs.readFileSync(planPath, "utf8");
  const planDemand = analyzeAppPlanResourceDemand(planText);
  fs.mkdirSync(outDir, { recursive: true });
  const appTitle = sanitizeTitle(options.title || extractTitle(planText) || extractTitle(specText) || "Generated Yeeflow Application");
  const slug = slugify(appTitle);
  const idPaths = buildIdPaths(planDemand);
  const ids = allocateIds(idSource.ids, idPaths, findings);
  if (findings.length) return buildFailure(findings, { outDir, specPath, planPath });

  const decoded = planDemand.hasMaterialResources
    ? buildResourceGraphPackage({ appTitle, rootListId: numberId(ids["decoded.ListSet.ListID"]), planDemand, ids })
    : buildDecodedPackage({
      appTitle,
      rootListId: numberId(ids["decoded.ListSet.ListID"]),
      dashboardLayoutId: stringId(ids["decoded.Pages[0].LayoutID"]),
      layoutResourceId: numberId(ids["decoded.Pages[0].LayoutInResources[0].ID"]),
      layoutResourceRefId: numberId(ids["decoded.Pages[0].LayoutInResources[0].RefId"]),
    });
  const resource = zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64");
  const wrapper = {
    PackageId: stringId(ids["wrapper.PackageId"]),
    TenantID: options.tenantId ? String(options.tenantId) : "0",
    AppID: 41,
    ListID: stringId(ids["wrapper.ListID"]),
    Title: appTitle,
    Description: `Generated-final package materialized from ${path.basename(specPath)} and ${path.basename(planPath)}.`,
    IconUrl: options.iconUrl || DEFAULT_ICON,
    Resource: resource,
    Notes: fixtureMode
      ? "Fixture-ID materialization for plugin regression only. Not signing/install eligible."
      : "Generated-final materialization. Run generated-final preflight before signing.",
    Author: "Codex Yeeflow App Builder",
    Date: "2026-06-24T00:00:00Z",
    Version: "1.0",
    Sign: "",
  };

  const packagePath = path.join(outDir, `${slug}.generated-final.yapk`);
  const decodedPath = path.join(outDir, `${slug}.generated-final.decoded-resource.json`);
  const provenancePath = path.join(outDir, `${slug}.generated-final-id-provenance-report.json`);
  const generationReportPath = path.join(outDir, `${slug}.generated-final-generation-report.json`);
  fs.writeFileSync(packagePath, `${JSON.stringify(wrapper, null, 2)}\n`);
  fs.writeFileSync(decodedPath, `${JSON.stringify(decoded, null, 2)}\n`);

  const provenance = {
    status: "pass",
    generator: {
      name: "materialize-full-app-generated-final",
      version: "0.8.34-training",
      mode: fixtureMode ? "fixture-regression" : planDemand.hasMaterialResources ? "minimal-resource-graph" : "schema-smoke-only",
    },
    sourceMarker: fixtureMode ? "api-generated-fixture-for-tests" : "api-generated",
    allocationSource: "api-generated",
    signingEligible: false,
    package: summarizePath(packagePath),
    allocations: Object.entries(ids).map(([pathName, id]) => ({
      path: pathName,
      id: stringId(id),
      purpose: pathName,
      source: fixtureMode ? "api-generated-fixture-for-tests" : "api-generated",
    })),
    proofBoundary: fixtureMode
      ? "Fixture IDs are only for plugin regression. Do not sign, install, import, upgrade, or claim live Yeeflow ID provenance with this package."
      : "API-issued ID provenance report. Signing/install still require generated-final preflight, setsign, verifysign, package API acceptance, Version Management final success, and browser/runtime proof.",
  };
  fs.writeFileSync(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);

  const generationReport = {
    status: "pass",
    mode: fixtureMode ? "fixture-regression" : planDemand.hasMaterialResources ? "minimal-resource-graph" : "schema-smoke-only",
    signingEligible: false,
    plannedResourceDemand: planDemand,
    inputs: {
      functionalSpecification: summarizePath(specPath),
      appPlan: summarizePath(planPath),
      apiIdManifest: options.apiIdManifest ? summarizePath(path.resolve(cwd, options.apiIdManifest)) : null,
    },
    outputs: {
      package: summarizePath(packagePath),
      decodedResource: summarizePath(decodedPath),
      idProvenance: summarizePath(provenancePath),
    },
    hardStopsPreserved: [
      "No signing was attempted.",
      "No install/import/upgrade was attempted.",
      "No browser/runtime proof was attempted.",
      "Generated-final preflight is required before any signing request.",
      "Standalone materialization emits the planned generated-final resource surfaces but remains signing-ineligible until all generated-final hard gates pass.",
    ],
  };
  fs.writeFileSync(generationReportPath, `${JSON.stringify(generationReport, null, 2)}\n`);

  return {
    status: "pass",
    mode: generationReport.mode,
    signingEligible: generationReport.signingEligible,
    outputDirectory: outDir,
    outputs: {
      package: packagePath,
      decodedResource: decodedPath,
      idProvenance: provenancePath,
      generationReport: generationReportPath,
    },
    proofBoundary: generationReport.hardStopsPreserved,
    findings: [],
  };
}

function analyzeAppPlanResourceDemand(planText) {
  const sections = [
    { key: "dataLists", marker: /^##\s+4\.\s+Data Lists and Document Libraries Plan/im, tableHeaders: ["List Name", "Data List Name", "Document Library Name"], outputSurface: "$.Childs[]" },
    { key: "approvalForms", marker: /^##\s+5\.\s+Approval Forms Plan/im, tableHeaders: ["Approval Form Name", "Form Name"], outputSurface: "$.Forms[]" },
    { key: "formReports", marker: /^##\s+6\.\s+Form Reports Plan/im, tableHeaders: ["Form Report Name"], outputSurface: "$.FormNewReports[]" },
    { key: "customForms", marker: /^##\s+10\.\s+Custom Data List Forms Plan/im, tableHeaders: ["Form Name"], outputSurface: "$.Childs[].Layouts[]" },
    { key: "dashboards", marker: /^##\s+14\.\s+Dashboard Pages Plan/im, tableHeaders: ["Dashboard Page Name", "Dashboard Page", "Page Name"], outputSurface: "$.Pages[] Type 103" },
    { key: "navigationGroups", marker: /^##\s+15\.\s+Application Navigation Plan/im, tableHeaders: ["Group"], outputSurface: "$.ListSet.LayoutView.sort[]" },
  ];
  const counts = {};
  const resources = {};
  const evidence = [];
  const navigationItemsByGroup = {};
  for (const { key, marker, tableHeaders, outputSurface } of sections) {
    const section = extractNumberedSection(planText, marker);
    const names = collectPlannedResourceNames(section, { tableHeaders, key });
    if (key === "navigationGroups") Object.assign(navigationItemsByGroup, collectNavigationItemsByGroup(section));
    const count = names.length;
    counts[key] = count;
    resources[key] = names;
    if (count > 0) evidence.push({ section: key, outputSurface, plannedItems: count, names });
  }
  return {
    counts,
    resources,
    navigationItemsByGroup,
    evidence,
    hasMaterialResources: Object.values(counts).some((count) => count > 0),
  };
}

function buildMissingResourceGraph(planDemand) {
  const surfaceByKey = {
    dataLists: "$.Childs[] data list/document library resources",
    approvalForms: "$.Forms[] approval form definitions",
    formReports: "$.FormNewReports[] approval report registrations",
    customForms: "$.Childs[].Layouts[] custom data list form layouts",
    dashboards: "$.Pages[] Type 103 dashboard pages with materialized v1.1 content",
    navigationGroups: "$.ListSet.LayoutView.sort[] grouped navigation runtime metadata",
  };
  return Object.entries(planDemand.resources)
    .filter(([, names]) => names.length)
    .map(([category, names]) => ({
      category,
      plannedCount: names.length,
      plannedNames: names,
      requiredOutputSurface: surfaceByKey[category],
      materializerStatus: "not-implemented",
    }));
}

function buildIdPaths(planDemand) {
  if (!planDemand.hasMaterialResources) {
    return [
      "wrapper.PackageId",
      "wrapper.ListID",
      "decoded.ListSet.ListID",
      "decoded.Pages[0].LayoutID",
      "decoded.Pages[0].LayoutInResources[0].ID",
      "decoded.Pages[0].LayoutInResources[0].RefId",
    ];
  }
  const paths = [
    "wrapper.PackageId",
    "wrapper.ListID",
    "decoded.ListSet.ListID",
  ];
  planDemand.resources.dataLists.forEach((name, index) => {
    paths.push(`decoded.Childs[${index}].List.ListID`);
    paths.push(`decoded.Childs[${index}].Fields.Title.FieldID`);
    paths.push(`decoded.Childs[${index}].Layouts.default.LayoutID`);
  });
  planDemand.resources.customForms.forEach((name, index) => {
    paths.push(`decoded.Childs[0].Layouts.custom[${index}].LayoutID`);
  });
  planDemand.resources.approvalForms.forEach((name, index) => {
    paths.push(`decoded.Forms[${index}].Key`);
    paths.push(`decoded.Forms[${index}].FormDef.ID`);
  });
  planDemand.resources.formReports.forEach((name, index) => {
    paths.push(`decoded.FormNewReports[${index}].ReportID`);
  });
  planDemand.resources.dashboards.forEach((name, index) => {
    paths.push(`decoded.Pages[${index}].LayoutID`);
    paths.push(`decoded.Pages[${index}].LayoutInResources[0].ID`);
    paths.push(`decoded.Pages[${index}].LayoutInResources[0].RefId`);
    paths.push(`decoded.Pages[${index}].Summary.ID`);
    paths.push(`decoded.Pages[${index}].Filter.ID`);
    paths.push(`decoded.Pages[${index}].Collection.ID`);
  });
  return paths;
}

function extractNumberedSection(text, marker) {
  const match = marker.exec(text);
  if (!match) return "";
  const start = match.index;
  const next = text.slice(start + match[0].length).search(/\n##\s+\d+\.\s+/);
  return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next);
}

function collectPlannedResourceNames(section, { tableHeaders = [], key = "" } = {}) {
  if (!section.trim()) return [];
  const headingNames = [...section.matchAll(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/gim)]
    .map((match) => cleanResourceName(match[1]))
    .filter((name) => !isNonResourceName(name));
  if (headingNames.length) return unique(headingNames);

  const tableNames = [];
  for (const table of parseMarkdownTables(section)) {
    const nameHeader = tableHeaders.find((header) => table.headers.includes(header));
    if (!nameHeader) continue;
    for (const row of table.rows) {
      const name = cleanResourceName(row[nameHeader]);
      if (!isNonResourceName(name)) tableNames.push(name);
    }
  }
  if (key === "dashboards") {
    for (const match of section.matchAll(/^-\s*Page name:\s*(.+?)\s*$/gim)) {
      const name = cleanResourceName(match[1]);
      if (!isNonResourceName(name)) tableNames.push(name);
    }
  }
  return unique(tableNames);
}

function collectNavigationItemsByGroup(section) {
  const byGroup = {};
  for (const table of parseMarkdownTables(section)) {
    if (!table.headers.includes("Group") || !table.headers.includes("Item")) continue;
    for (const row of table.rows) {
      const group = cleanResourceName(row.Group);
      const item = cleanResourceName(row.Item || row["Target Resource"]);
      const target = cleanResourceName(row["Target Resource"] || item);
      const type = cleanResourceName(row["Yeeflow Resource Type"] || row.Type || "");
      if (!group || !item || isNonResourceName(group) || isNonResourceName(item)) continue;
      if (!byGroup[group]) byGroup[group] = [];
      byGroup[group].push({ title: item, target: target || item, type });
    }
  }
  return byGroup;
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
      const row = {};
      headers.forEach((header, cellIndex) => { row[header] = cells[cellIndex] || ""; });
      rows.push(row);
      rowIndex += 1;
    }
    tables.push({ headers, rows });
    index = rowIndex;
  }
  return tables;
}

function isTableLine(line) {
  return /^\s*\|.+\|\s*$/.test(line || "");
}

function splitTableLine(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cleanResourceName(cell));
}

function unique(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function cleanResourceName(value) {
  return String(value || "").replace(/`/g, "").replace(/\*\*/g, "").trim();
}

function isNonResourceName(value) {
  const text = cleanResourceName(value);
  if (!text) return true;
  if (/^(not applicable|n\/a|none|no|deferred|status|resource type|purpose|notes?|owner|used by|actions?|fields?)$/i.test(text)) return true;
  if (/^(dashboard page name|page name|list name|form name|group|item|section|metric name|filter name)$/i.test(text)) return true;
  return false;
}

function buildDecodedPackage({ appTitle, rootListId, dashboardLayoutId, layoutResourceId, layoutResourceRefId }) {
  return {
    ListSet: listInfo({ listId: rootListId, title: appTitle, type: 1024, ext2: "{\"src\":true}" }),
    Pages: [
      {
        ListID: rootListId,
        LayoutID: dashboardLayoutId,
        Type: 103,
        Title: "Getting Started Dashboard",
        LayoutView: null,
        Ext2: "{\"src\":true}",
        IsDefault: true,
        IsItemPerm: false,
        LayoutInResources: [
          {
            ID: layoutResourceId,
            RefId: layoutResourceRefId,
            Resource: JSON.stringify({
              id: "Main",
              type: "container",
              title: "Main",
              attrs: { container: { cw: "2", padding: ["--sp--s0", "--sp--s0", "--sp--s0", "--sp--s0"] } },
              children: [
                {
                  id: "Content",
                  type: "container",
                  title: "Content",
                  attrs: { container: { cw: "2", padding: ["--sp--s0", "--sp--s0", "--sp--s0", "--sp--s0"] } },
                  children: [
                    {
                      id: "generated_final_placeholder_notice",
                      type: "text",
                      title: "Generated-final materialization placeholder",
                      attrs: { text: { value: "Generated-final package materialized from approved planning artifacts." } },
                    },
                  ],
                },
              ],
            }),
          },
        ],
      },
    ],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    PortalInfo: null,
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
    Childs: [],
  };
}

function buildResourceGraphPackage({ appTitle, rootListId, planDemand, ids }) {
  const dataListNames = planDemand.resources.dataLists.length ? planDemand.resources.dataLists : [`${appTitle} Records`];
  const dataListByName = new Map();
  const childs = dataListNames.map((name, index) => {
    const listId = numberId(ids[`decoded.Childs[${index}].List.ListID`]);
    dataListByName.set(normKey(name), listId);
    const layouts = [
      {
        ListID: listId,
        LayoutID: stringId(ids[`decoded.Childs[${index}].Layouts.default.LayoutID`]),
        Title: "Default View",
        Type: 0,
        LayoutView: JSON.stringify({
          fields: ["Title"],
          query: [{ FieldName: "Title", FieldID: stringId(ids[`decoded.Childs[${index}].Fields.Title.FieldID`]) }],
        }),
        IsDefault: true,
        IsItemPerm: false,
        Perms: [],
        LayoutInResources: [],
      },
    ];
    if (index === 0) {
      for (const [customIndex, customName] of planDemand.resources.customForms.entries()) {
        layouts.push({
          ListID: listId,
          LayoutID: stringId(ids[`decoded.Childs[0].Layouts.custom[${customIndex}].LayoutID`]),
          Title: customName,
          Type: 1,
          LayoutView: JSON.stringify({ source: "minimal-resource-graph", formName: customName }),
          IsDefault: false,
          IsItemPerm: false,
          Perms: [],
          LayoutInResources: [
            {
              ID: numberId(ids[`decoded.Childs[0].Layouts.custom[${customIndex}].LayoutID`]),
              RefId: numberId(ids[`decoded.Childs[0].Layouts.custom[${customIndex}].LayoutID`]),
              Resource: JSON.stringify({
                type: "form",
                name: customName,
                children: [
                  { type: "text", name: `${customName} title`, attrs: { text: { value: customName } } },
                  { type: "dynamic-field", name: "Title", attrs: { data: { field: "Title" } } },
                ],
              }),
            },
          ],
        });
      }
    }
    return {
      List: listInfo({ listId, title: name, type: 1, ext2: "{\"generatedFinal\":true}" }),
      Fields: [
        {
          FieldID: stringId(ids[`decoded.Childs[${index}].Fields.Title.FieldID`]),
          ListID: listId,
          FieldName: "Title",
          FieldType: "Text",
          FieldIndex: 0,
          DisplayName: "Title",
          InternalName: "Title",
          Type: "input",
          Status: 0,
          Category: 0,
          DefaultValue: "",
          Rules: "",
          IsSort: false,
          IsSystem: true,
          IsUnique: false,
          IsIndex: true,
          Ext1: "",
          Ext2: "",
          Ext3: "",
        },
      ],
      Layouts: layouts,
      RemindRules: [],
      PublicForms: [],
      FlowMappings: [],
    };
  });

  const forms = planDemand.resources.approvalForms.map((name, index) => {
    const key = stringId(ids[`decoded.Forms[${index}].Key`]);
    return {
      Category: "",
      Name: name,
      Key: key,
      IsItemPerm: false,
      AppID: 41,
      ListID: 0,
      ProcModelID: stringId(ids[`decoded.Forms[${index}].FormDef.ID`]),
      Description: "",
      Ext: "",
      DefResourceID: stringId(ids[`decoded.Forms[${index}].FormDef.ID`]),
      DefResource: exportResource({
        type: "approval-form",
        name,
        children: [
          { type: "container", name: "Main", children: [{ type: "dynamic-field", name: "Title", attrs: { data: { field: "Title" } } }] },
        ],
      }),
      Status: 1,
      DeployedDefID: stringId(ids[`decoded.Forms[${index}].FormDef.ID`]),
      WorkflowType: 2,
      Settings: "",
      Deployed: true,
      NoRule: { Prefix: "REQ-{index}", StartIndex: 1, CustomLength: 4, AutoIncrement: 1 },
      Perms: [],
    };
  });

  const formNewReports = planDemand.resources.formReports.map((name, index) => ({
    ID: numberId(ids[`decoded.FormNewReports[${index}].ReportID`]),
    DefKey: forms[0]?.Key || "",
    Name: name,
    Description: "",
    Attr: "",
    Settings: JSON.stringify({
      Fields: ["Title"],
      Source: forms[0]?.Title || "Approval Forms",
    }),
  }));

  const pages = planDemand.resources.dashboards.map((name, index) => {
    const firstListName = dataListNames[index % dataListNames.length];
    const firstListId = dataListByName.get(normKey(firstListName)) || dataListByName.values().next().value || rootListId;
    return {
      ListID: rootListId,
      LayoutID: stringId(ids[`decoded.Pages[${index}].LayoutID`]),
      Type: 103,
      Title: name,
      LayoutView: null,
      Ext2: "{\"generatedFinal\":true}",
      IsDefault: index === 0,
      IsItemPerm: false,
      LayoutInResources: [
        {
          ID: numberId(ids[`decoded.Pages[${index}].LayoutInResources[0].ID`]),
          RefId: numberId(ids[`decoded.Pages[${index}].LayoutInResources[0].RefId`]),
          Resource: JSON.stringify(buildMaterialDashboardResource({
            name,
            listName: firstListName,
            listId: firstListId,
            summaryId: stringId(ids[`decoded.Pages[${index}].Summary.ID`]),
            filterId: stringId(ids[`decoded.Pages[${index}].Filter.ID`]),
            collectionId: stringId(ids[`decoded.Pages[${index}].Collection.ID`]),
          })),
        },
      ],
    };
  });

  return {
    ListSet: {
      ...listInfo({ listId: rootListId, title: appTitle, type: 1024, ext2: "{\"generatedFinal\":true}" }),
      LayoutView: buildNavigationLayoutView(planDemand),
    },
    Pages: pages,
    Forms: forms,
    FormNewReports: formNewReports,
    DataReports: [],
    PortalInfo: null,
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
    Childs: childs,
  };
}

function buildMaterialDashboardResource({ name, listName, listId, summaryId, filterId, collectionId }) {
  return {
    type: "page",
    id: `${slugify(name)}_root`,
    name,
    title: name,
    children: [
      {
        type: "container",
        id: "Main",
        name: "Main",
        title: "Main",
        attrs: { container: { cw: "2", direction: "vertical", gap: 16, padding: ["--sp--s0", "--sp--s0", "--sp--s0", "--sp--s0"] } },
        children: [
          {
            type: "container",
            id: "Content",
            name: "Content",
            title: "Content",
            attrs: { container: { cw: "2", direction: "vertical", gap: 16, padding: ["--sp--s0", "--sp--s0", "--sp--s0", "--sp--s0"] } },
            children: [
              { type: "text", id: `${slugify(name)}_title`, name, title: name, attrs: { text: { value: name, heads: "h2-bold" } } },
              {
                type: "summary",
                id: summaryId,
                name: "Active Records",
                title: "Active Records",
                attrs: { data: { ListID: stringId(listId), aggregation: "count", field: "ListDataID" } },
              },
              {
                type: "data-filter",
                id: filterId,
                name: "Status filter",
                title: "Status filter",
                attrs: { data: { ListID: stringId(listId), field: "Title" }, label: "Status", placeholder: `Filter ${listName}` },
              },
              {
                type: "collection",
                id: collectionId,
                name: `${listName} collection`,
                title: `${listName} collection`,
                attrs: { data: { ListID: stringId(listId), source: listName, field: "Title" }, collection: { template: "collection_control_grid_table" } },
                children: [
                  { type: "dynamic-field", id: `${collectionId}_title`, name: "Title", title: "Title", attrs: { data: { field: "Title", ListID: stringId(listId) } } },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function buildNavigationLayoutView(planDemand) {
  const groups = planDemand.resources.navigationGroups.length ? planDemand.resources.navigationGroups : ["Workspace"];
  const dashboardItems = planDemand.resources.dashboards.map((name) => ({ Title: name, Type: 103, Target: name }));
  const formItems = planDemand.resources.approvalForms.map((name) => ({ Title: name, Type: 105, Target: name }));
  const listItems = planDemand.resources.dataLists.map((name) => ({ Title: name, Type: 1, Target: name }));
  const reportItems = planDemand.resources.formReports.map((name) => ({ Title: name, Type: 106, Target: name }));
  const allItems = dashboardItems.concat(formItems, listItems, reportItems);
  const itemsByGroup = planDemand.navigationItemsByGroup || {};
  const typeForTarget = new Map(allItems.map((item) => [normKey(item.Target), item.Type]));
  const sort = groups.map((groupName, index) => ({
    Title: groupName,
    Type: "classes",
    list: (itemsByGroup[groupName] || []).length
      ? itemsByGroup[groupName].map((item) => ({ Title: item.title, Target: item.target, Type: typeForTarget.get(normKey(item.target)) || inferNavigationType(item.type) }))
      : allItems.filter((item, itemIndex) => itemIndex % groups.length === index),
  }));
  if (sort.length && sort.every((group) => !group.list.length)) sort[0].list = allItems;
  return JSON.stringify({ sortVer: 1, sort });
}

function inferNavigationType(value) {
  if (/approval/i.test(value)) return 105;
  if (/dashboard/i.test(value)) return 103;
  if (/report/i.test(value)) return 106;
  return 1;
}

function exportResource(resource) {
  return `::brotli::${zlib.brotliCompressSync(Buffer.from(JSON.stringify(resource), "utf8")).toString("base64")}`;
}

function listInfo({ listId, title, type, ext2 = "" }) {
  return {
    ListID: listId,
    Title: title,
    Description: "",
    Status: 1,
    IsItemPerm: false,
    IsVerRecord: false,
    HasComment: false,
    IconUrl: "",
    TableCode: "flowcraft",
    Ext1: "",
    Ext2: ext2,
    Ext3: "",
    Type: type,
    Flags: 1,
    LayoutView: "",
    Perms: [],
    AdvancePerms: [],
    IndexCode: "flowcraft",
  };
}

function loadIdSource({ cwd, apiIdManifest, fixtureMode, findings }) {
  if (apiIdManifest) {
    const file = path.resolve(cwd, apiIdManifest);
    if (!fs.existsSync(file)) {
      findings.push(error("FULL_APP_MATERIALIZATION_API_ID_MANIFEST_MISSING", "The API-issued ID manifest file does not exist.", { path: file }));
      return null;
    }
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const ids = Array.isArray(data.ids) ? data.ids : Array.isArray(data.allocations) ? data.allocations.map((item) => item.id) : [];
    if (!ids.length) findings.push(error("FULL_APP_MATERIALIZATION_API_ID_MANIFEST_EMPTY", "The API-issued ID manifest must contain ids[] or allocations[].id."));
    return { ids };
  }
  if (fixtureMode) {
    return { ids: ["910000000000000001", "910000000000000002", "910000000000000003", "910000000000000004", "910000000000000005", "910000000000000006"] };
  }
  findings.push(error("FULL_APP_MATERIALIZATION_API_ID_SOURCE_REQUIRED", "Generated-final materialization requires --api-id-manifest with API-issued IDs. Use --allow-fixture-api-ids-for-tests only in plugin regression tests."));
  return null;
}

function allocateIds(ids, paths, findings) {
  const cleanIds = ids.map((id) => String(id || "").trim()).filter(Boolean);
  if (cleanIds.length < paths.length) {
    findings.push(error("FULL_APP_MATERIALIZATION_API_ID_COUNT_INSUFFICIENT", "Not enough API-issued IDs for generated-final materialization.", { required: paths.length, received: cleanIds.length }));
    return {};
  }
  const out = {};
  paths.forEach((pathName, index) => {
    const id = cleanIds[index];
    if (!/^\d{16,}$/.test(id)) {
      findings.push(error("FULL_APP_MATERIALIZATION_API_ID_INVALID", "API-issued IDs must be large numeric strings.", { path: pathName }));
    }
    out[pathName] = id;
  });
  return out;
}

function extractTitle(text) {
  const heading = text.match(/^#\s+(.+)$/m)?.[1];
  if (heading) return heading.replace(/^(Functional Specification|Yeeflow App Plan)\s*[:\-]\s*/i, "").trim();
  return text.match(/\|\s*(?:Application|App) Name\s*\|\s*([^|]+)\|/i)?.[1]?.trim() || "";
}

function resolveRequiredPath(cwd, requested, fallbackName) {
  const candidate = requested ? path.resolve(cwd, requested) : path.resolve(cwd, fallbackName);
  return fs.existsSync(candidate) ? candidate : "";
}

function sanitizeTitle(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 120) || "Generated Yeeflow Application";
}

function slugify(value) {
  return sanitizeTitle(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "generated-yeeflow-application";
}

function stringId(id) {
  return String(id);
}

function numberId(id) {
  return Number(String(id));
}

function normKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function summarizePath(file) {
  return {
    path: file,
    name: path.basename(file),
    exists: fs.existsSync(file),
    fileSize: fs.existsSync(file) ? fs.statSync(file).size : null,
  };
}

function buildFailure(findings, context = {}) {
  return { status: "fail", ...context, findings };
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--json") args.json = true;
    else if (token === "--allow-fixture-api-ids-for-tests") args.allowFixtureApiIdsForTests = true;
    else if (token === "--functional-spec" || token === "--spec") args.functionalSpec = argv[++i];
    else if (token === "--app-plan" || token === "--plan") args.appPlan = argv[++i];
    else if (token === "--out-dir") args.outDir = argv[++i];
    else if (token === "--api-id-manifest") args.apiIdManifest = argv[++i];
    else if (token === "--tenant-id") args.tenantId = argv[++i];
    else if (token === "--title") args.title = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/materialize-full-app-generated-final.mjs \\
    --functional-spec functional-specification.md \\
    --app-plan yeeflow-app-plan.md \\
    --out-dir dist \\
    --api-id-manifest api-issued-ids.json [--tenant-id <tenant-id>] [--json]

Regression-only fixture mode:
  node scripts/materialize-full-app-generated-final.mjs --functional-spec <file> --app-plan <file> --out-dir <dir> --allow-fixture-api-ids-for-tests --json

This command materializes generated-final package artifacts only. It never signs, installs, imports, upgrades, seeds data, or runs browser/runtime proof.`);
}

function printTextReport(report) {
  console.log(`Full-app generated-final materialization: ${report.status}`);
  if (report.outputs?.package) console.log(`package: ${report.outputs.package}`);
  for (const finding of report.findings || []) console.log(`- ${finding.code}: ${finding.message}`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
