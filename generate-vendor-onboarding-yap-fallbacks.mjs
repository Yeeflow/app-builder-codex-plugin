import fs from "node:fs";
import zlib from "node:zlib";
import { createApiIdAllocator, fetchYeeflowUniqueIds, loadYeeflowApiEnvironment, summarizeIds } from "./scripts/yeeflow-id-api-utils.mjs";

const SOURCE_RESOURCE = ".tmp/vendor-onboarding-compliance-management/vendor-onboarding-compliance-management.decoded-resource.json";
const TMP_DIR = ".tmp/vendor-onboarding-compliance-management";
const TITLE = "Vendor Onboarding & Compliance Management";
const DESCRIPTION = "Generated Yeeflow application package from the approved Vendor Onboarding UI implementation spec.";
const ICON_URL = "{\"b\":\"#E6F7FF\",\"i\":\"fa-regular fa-building-shield\",\"c\":\"#008DA6\"}";
const SAFE_ID_BASE = 760100000000000;

function parseResource() {
  const resource = JSON.parse(fs.readFileSync(SOURCE_RESOURCE, "utf8"));
  return { resource, data: JSON.parse(resource.Data) };
}

function writeResource(name, resource, data) {
  const out = `${TMP_DIR}/${name}.json`;
  const next = { ...resource, MainListType: 1024, SimplePortal: null, Data: JSON.stringify(data) };
  fs.writeFileSync(out, `${JSON.stringify(next, null, 2)}\n`);
  return out;
}

function buildYap(input, output) {
  throw new Error(`Legacy buildYap is disabled for ${output}; use product-schema ListExportResult generation.`);
}

function parseJsonMaybe(value, fallback = {}) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeLayoutResource(layout) {
  const resources = Array.isArray(layout.LayoutInResources) ? layout.LayoutInResources : [];
  return resources.map((item) => ({
    ...item,
    ID: layout.LayoutID,
    RefId: layout.LayoutID,
  }));
}

function minimalSurface(title) {
  return {
    title,
    ver: "2.0",
    filterVars: [],
    tempVars: [],
    attrs: { hideHeaderAll: true },
    children: [{
      id: `main-${layoutSafeId(title)}`,
      type: "container",
      label: "Container",
      nv_label: "Main",
      attrs: {
        style: { direction: "column", gap: "16px", align_items: "stretch" },
        common: { padding: { left: 24, right: 24, top: 24, bottom: 24 } },
      },
      children: [{
        id: `heading-${layoutSafeId(title)}`,
        type: "heading",
        label: "Text",
        nv_label: title,
        attrs: {
          headc: { title: { value: title, variable: null } },
          heads: { ty: "h4-bold", color: "var(--c--text)" },
        },
        children: [],
      }],
    }],
  };
}

function layoutSafeId(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "surface";
}

function normalizeViewLayout(layout, index) {
  return {
    ...layout,
    Title: index === 0 ? "All Records" : layout.Title || `View ${index + 1}`,
    Status: layout.Status ?? 1,
    IsDefault: index === 0,
    IsItemPerm: false,
    Perms: null,
    Ext1: layout.Ext1 ?? null,
    Ext2: layout.Ext2 ?? null,
    Ext3: layout.Ext3 ?? null,
    LayoutInResources: normalizeLayoutResource(layout),
  };
}

function normalizeFormLayout(layout, title) {
  return {
    ...layout,
    Title: title,
    Status: layout.Status ?? 1,
    Type: 1,
    LayoutView: null,
    Ext1: layout.Ext1 ?? null,
    Ext2: "{\"src\":true}",
    Ext3: layout.Ext3 ?? null,
    IsDefault: false,
    IsItemPerm: false,
    Perms: null,
    LayoutInResources: [{
      ID: layout.LayoutID,
      RefId: layout.LayoutID,
      Resource: JSON.stringify(minimalSurface(title)),
    }],
  };
}

function makeMinimalHomePage(layout) {
  return makeCurrentDashboardLayout(layout, "Home");
}

function makeCurrentDashboardLayout(layout, title = "Home") {
  const next = {
    ...layout,
    Title: title,
    Type: 103,
    LayoutView: null,
    Ext1: layout.Ext1 ?? null,
    Ext2: "{\"src\":true}",
    Ext3: layout.Ext3 ?? null,
    IsDefault: false,
    IsItemPerm: false,
    LayoutInResources: [],
  };
  delete next.Perms;
  return next;
}

function makeDataModelOnly(data) {
  const next = structuredClone(data);
  const home = makeMinimalHomePage(next.Item.Layouts[0]);
  next.Item.Layouts = [home];
  next.Item.ListModel.LayoutView = JSON.stringify({
    add: "default",
    edit: "default",
    view: "default",
    sort: [
      {
        AppID: next.AppID,
        ListID: home.LayoutID,
        ListSetID: next.Item.ListModel.ListID,
        Type: 103,
        IsHidden: false,
        Title: "Home",
        Icon: "fa-regular fa-house",
      },
      ...next.Childs.map((child) => ({
      AppID: next.AppID,
      ListID: child.ListModel.ListID,
      ListSetID: next.Item.ListModel.ListID,
      Type: child.ListModel.Type,
      IsHidden: false,
      Title: child.ListModel.Title,
      Icon: "fa-regular fa-list-check",
      })),
    ],
    sortVer: 1,
  });

  for (const child of next.Childs) {
    const views = child.Layouts.filter((layout) => Number(layout.Type) === 0).map(normalizeViewLayout);
    const forms = child.Layouts.filter((layout) => Number(layout.Type) === 1);
    const edit = forms[0] ? normalizeFormLayout(forms[0], "Edit Item") : null;
    const view = forms[1] ? normalizeFormLayout(forms[1], "View Item") : edit;
    child.Layouts = [edit, view, ...views].filter(Boolean);
    child.ListModel.LayoutView = JSON.stringify({
      add: edit?.LayoutID || "default",
      edit: edit?.LayoutID || "default",
      view: view?.LayoutID || edit?.LayoutID || "default",
      opentype: { add: "modal" },
      modalsize: {},
      sortVer: 1,
    });
    child.ListModel.Type = 1;
    child.ListModel.ListType = 1;
    child.ListModel.Flags = 1;
  }

  next.AppGroups = [];
  next.AppThemes = [];
  next.OtherModules = [];
  next.ReplaceIds = Array.from(new Set([
    next.Item.ListModel.ListID,
    ...next.Childs.flatMap((child) => [
      child.ListModel.ListID,
      ...child.Defs.map((field) => field.FieldID),
      ...child.Layouts.map((layout) => layout.LayoutID),
    ]),
  ].map(String)));
  return next;
}

async function main() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const { resource, data } = parseResource();

  const dataModel = makeDataModelOnly(data);
  const schemaDirect = makeSchemaDirectData(dataModel);
  const schemaDirectPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.3-schema-direct.yap";
  writeSchemaDirectYap(schemaDirect, schemaDirectPath);
  const categoryFixedPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yap";
  writeSchemaDirectYap(schemaDirect, categoryFixedPath);
  const schemaResultPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-yap-schema-result.yap";
  writeSchemaResultYap(schemaDirect, schemaResultPath);
  const schemaResultNoLookups = removeLookupRelationships(schemaDirect);
  const schemaResultNoLookupsPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-yap-schema-result-no-lookups.yap";
  writeSchemaResultYap(schemaResultNoLookups, schemaResultNoLookupsPath);
  const uniqueIds = assignSafeSchemaIds(schemaDirect);
  const uniqueIdsPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.5-unique-ids.yap";
  writeSchemaResultYap(uniqueIds, uniqueIdsPath);
  const uniqueIdsNoLookups = removeLookupRelationships(uniqueIds);
  const uniqueIdsNoLookupsPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.5-unique-ids-no-lookups.yap";
  writeSchemaResultYap(uniqueIdsNoLookups, uniqueIdsNoLookupsPath);
  const apiEnv = loadYeeflowApiEnvironment();
  const apiIdCount = countSchemaIds(schemaDirect);
  const apiIds = await fetchYeeflowUniqueIds({ apiBaseUrl: apiEnv.apiBaseUrl, apiKey: apiEnv.apiKey, count: apiIdCount * 6 });
  const apiIdBatches = [
    apiIds.slice(0, apiIdCount),
    apiIds.slice(apiIdCount, apiIdCount * 2),
    apiIds.slice(apiIdCount * 2, apiIdCount * 3),
    apiIds.slice(apiIdCount * 3, apiIdCount * 4),
    apiIds.slice(apiIdCount * 4, apiIdCount * 5),
    apiIds.slice(apiIdCount * 5, apiIdCount * 6),
  ];
  const apiIdsNoLookups = assignApiSchemaIds(schemaDirect, createApiIdAllocator(apiIdBatches[0]), { dashboard: "minimal" });
  const apiIdsNoLookupsWithoutLookupFields = removeLookupRelationships(apiIdsNoLookups);
  const apiIdsNoLookupsPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.9-customtype-fixed-no-lookups.yap";
  writeSchemaResultYap(apiIdsNoLookupsWithoutLookupFields, apiIdsNoLookupsPath);
  const apiIdsWithLookups = assignApiSchemaIds(schemaDirect, createApiIdAllocator(apiIdBatches[1]), { dashboard: "minimal" });
  const apiIdsWithLookupsPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.9-customtype-fixed-with-lookups.yap";
  writeSchemaResultYap(apiIdsWithLookups, apiIdsWithLookupsPath);
  const apiIdsSimpleDashboard = assignApiSchemaIds(schemaDirect, createApiIdAllocator(apiIdBatches[2]), { dashboard: "simple-data-table" });
  const apiIdsSimpleDashboardNoLookups = removeLookupRelationships(apiIdsSimpleDashboard);
  const apiIdsSimpleDashboardPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.9-customtype-fixed-simple-dashboard.yap";
  writeSchemaResultYap(apiIdsSimpleDashboardNoLookups, apiIdsSimpleDashboardPath);
  const apiIdsCurrentDashboard = assignApiSchemaIds(schemaDirect, createApiIdAllocator(apiIdBatches[3]), { dashboard: "current-shell" });
  const apiIdsCurrentDashboardNoLookups = removeLookupRelationships(apiIdsCurrentDashboard);
  const apiIdsCurrentDashboardPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.10-current-dashboard.yap";
  writeSchemaResultYap(apiIdsCurrentDashboardNoLookups, apiIdsCurrentDashboardPath);
  const apiIdsCurrentDashboardDataTable = assignApiSchemaIds(schemaDirect, createApiIdAllocator(apiIdBatches[4]), { dashboard: "simple-data-table" });
  const apiIdsCurrentDashboardDataTableNoLookups = removeLookupRelationships(apiIdsCurrentDashboardDataTable);
  const apiIdsCurrentDashboardDataTablePath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.11-current-dashboard-data-table.yap";
  writeSchemaResultYap(apiIdsCurrentDashboardDataTableNoLookups, apiIdsCurrentDashboardDataTablePath);
  const apiIdsCurrentDashboardDataTableFixed = assignApiSchemaIds(schemaDirect, createApiIdAllocator(apiIdBatches[5]), { dashboard: "simple-data-table" });
  const apiIdsCurrentDashboardDataTableFixedNoLookups = removeLookupRelationships(apiIdsCurrentDashboardDataTableFixed);
  const apiIdsCurrentDashboardDataTableFixedPath = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.12-current-dashboard-data-table-fields-fixed.yap";
  writeSchemaResultYap(apiIdsCurrentDashboardDataTableFixedNoLookups, apiIdsCurrentDashboardDataTableFixedPath);

  console.log(JSON.stringify({
    status: "generated",
    outputs: [
      {
        path: "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.1-mainlisttype.yap",
        purpose: "numeric MainListType candidate",
        buildStatus: "skipped; legacy Resource shape is superseded by product-schema ListExportResult YAP",
      },
      {
        path: "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.2-data-model.yap",
        purpose: "data-model import isolation candidate",
        buildStatus: "skipped; legacy Resource shape is superseded by product-schema ListExportResult YAP",
        dataLists: dataModel.Childs.length,
        fields: dataModel.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: dataModel.Item.Layouts.length,
        layouts: dataModel.Childs.reduce((total, child) => total + child.Layouts.length, 0),
      },
      {
        path: schemaDirectPath,
        purpose: "schema-direct YAP v1 candidate",
        buildStatus: "written",
        dataLists: schemaDirect.Childs.length,
        fields: schemaDirect.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: schemaDirect.Item.Layouts.length,
        layouts: schemaDirect.Childs.reduce((total, child) => total + child.Layouts.length, 0) + schemaDirect.Item.Layouts.length,
      },
      {
        path: categoryFixedPath,
        purpose: "schema-direct YAP with integer Field.Category values",
        buildStatus: "written",
        dataLists: schemaDirect.Childs.length,
        fields: schemaDirect.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: schemaDirect.Item.Layouts.length,
        layouts: schemaDirect.Childs.reduce((total, child) => total + child.Layouts.length, 0) + schemaDirect.Item.Layouts.length,
      },
      {
        path: schemaResultNoLookupsPath,
        purpose: "ListExportResult YAP with Data string, no lookup relationships",
        buildStatus: "written",
        dataLists: schemaResultNoLookups.Childs.length,
        fields: schemaResultNoLookups.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: schemaResultNoLookups.Item.Layouts.length,
        layouts: schemaResultNoLookups.Childs.reduce((total, child) => total + child.Layouts.length, 0) + schemaResultNoLookups.Item.Layouts.length,
      },
      {
        path: schemaResultPath,
        purpose: "ListExportResult YAP with Data string and lookup relationships",
        buildStatus: "written",
        dataLists: schemaDirect.Childs.length,
        fields: schemaDirect.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: schemaDirect.Item.Layouts.length,
        layouts: schemaDirect.Childs.reduce((total, child) => total + child.Layouts.length, 0) + schemaDirect.Item.Layouts.length,
      },
      {
        path: uniqueIdsNoLookupsPath,
        purpose: "ListExportResult YAP with safe unique IDs, no lookup relationships",
        buildStatus: "written",
        dataLists: uniqueIdsNoLookups.Childs.length,
        fields: uniqueIdsNoLookups.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: uniqueIdsNoLookups.Item.Layouts.length,
        layouts: uniqueIdsNoLookups.Childs.reduce((total, child) => total + child.Layouts.length, 0) + uniqueIdsNoLookups.Item.Layouts.length,
      },
      {
        path: uniqueIdsPath,
        purpose: "ListExportResult YAP with safe unique IDs and lookup relationships",
        buildStatus: "written",
        dataLists: uniqueIds.Childs.length,
        fields: uniqueIds.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: uniqueIds.Item.Layouts.length,
        layouts: uniqueIds.Childs.reduce((total, child) => total + child.Layouts.length, 0) + uniqueIds.Item.Layouts.length,
      },
      {
        path: apiIdsNoLookupsPath,
        purpose: "ListExportResult YAP with fixed AppID 41, generated ListSite CustomType, API-issued list/field/layout IDs, and populated ReplaceIds; no lookup relationships",
        buildStatus: "written",
        apiIds: summarizeIds(apiIdBatches[0]),
        dataLists: apiIdsNoLookupsWithoutLookupFields.Childs.length,
        fields: apiIdsNoLookupsWithoutLookupFields.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: apiIdsNoLookupsWithoutLookupFields.Item.Layouts.length,
        layouts: apiIdsNoLookupsWithoutLookupFields.Childs.reduce((total, child) => total + child.Layouts.length, 0) + apiIdsNoLookupsWithoutLookupFields.Item.Layouts.length,
      },
      {
        path: apiIdsWithLookupsPath,
        purpose: "ListExportResult YAP with fixed AppID 41, generated ListSite CustomType, API-issued list/field/layout IDs, populated ReplaceIds, and lookup relationships",
        buildStatus: "written",
        apiIds: summarizeIds(apiIdBatches[1]),
        dataLists: apiIdsWithLookups.Childs.length,
        fields: apiIdsWithLookups.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: apiIdsWithLookups.Item.Layouts.length,
        layouts: apiIdsWithLookups.Childs.reduce((total, child) => total + child.Layouts.length, 0) + apiIdsWithLookups.Item.Layouts.length,
      },
      {
        path: apiIdsSimpleDashboardPath,
        purpose: "ListExportResult YAP with fixed AppID 41, generated ListSite CustomType, API-issued list/field/layout IDs, populated ReplaceIds, no lookups, and one simple dashboard data table",
        buildStatus: "written",
        apiIds: summarizeIds(apiIdBatches[2]),
        dataLists: apiIdsSimpleDashboardNoLookups.Childs.length,
        fields: apiIdsSimpleDashboardNoLookups.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: apiIdsSimpleDashboardNoLookups.Item.Layouts.length,
        layouts: apiIdsSimpleDashboardNoLookups.Childs.reduce((total, child) => total + child.Layouts.length, 0) + apiIdsSimpleDashboardNoLookups.Item.Layouts.length,
      },
      {
        path: apiIdsCurrentDashboardPath,
        purpose: "ListExportResult YAP with fixed AppID 41, API-issued IDs, populated ReplaceIds, no lookups, and export-proven current dashboard shell",
        buildStatus: "written",
        apiIds: summarizeIds(apiIdBatches[3]),
        dataLists: apiIdsCurrentDashboardNoLookups.Childs.length,
        fields: apiIdsCurrentDashboardNoLookups.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: apiIdsCurrentDashboardNoLookups.Item.Layouts.length,
        layouts: apiIdsCurrentDashboardNoLookups.Childs.reduce((total, child) => total + child.Layouts.length, 0) + apiIdsCurrentDashboardNoLookups.Item.Layouts.length,
      },
      {
        path: apiIdsCurrentDashboardDataTablePath,
        purpose: "ListExportResult YAP with fixed AppID 41, API-issued IDs, populated ReplaceIds, no lookups, current dashboard shell, and simple Vendors Data table content",
        buildStatus: "written",
        apiIds: summarizeIds(apiIdBatches[4]),
        dataLists: apiIdsCurrentDashboardDataTableNoLookups.Childs.length,
        fields: apiIdsCurrentDashboardDataTableNoLookups.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: apiIdsCurrentDashboardDataTableNoLookups.Item.Layouts.length,
        layouts: apiIdsCurrentDashboardDataTableNoLookups.Childs.reduce((total, child) => total + child.Layouts.length, 0) + apiIdsCurrentDashboardDataTableNoLookups.Item.Layouts.length,
      },
      {
        path: apiIdsCurrentDashboardDataTableFixedPath,
        purpose: "ListExportResult YAP with fixed AppID 41, API-issued IDs, populated ReplaceIds, no lookups, current dashboard shell, and export-proven Vendors Data table Field bindings",
        buildStatus: "written",
        apiIds: summarizeIds(apiIdBatches[5]),
        dataLists: apiIdsCurrentDashboardDataTableFixedNoLookups.Childs.length,
        fields: apiIdsCurrentDashboardDataTableFixedNoLookups.Childs.reduce((total, child) => total + child.Defs.length, 0),
        dashboards: apiIdsCurrentDashboardDataTableFixedNoLookups.Item.Layouts.length,
        layouts: apiIdsCurrentDashboardDataTableFixedNoLookups.Childs.reduce((total, child) => total + child.Layouts.length, 0) + apiIdsCurrentDashboardDataTableFixedNoLookups.Item.Layouts.length,
      },
    ],
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "fail", error: error.message }, null, 2));
  process.exit(1);
});

function makeSchemaDirectData(source) {
  const data = structuredClone(source);
  const normalizeDate = "2026-05-29T01:30:00Z";
  const mapFieldName = (name) => name === "Title" ? "Text0" : name;
  const fixLayoutView = (value) => {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const parsed = JSON.parse(value);
      const rewrite = (node) => {
        if (Array.isArray(node)) return node.map(rewrite);
        if (node && typeof node === "object") {
          for (const [key, child] of Object.entries(node)) {
            if ((key === "FieldName" || key === "SortName" || key === "listfield" || key === "displayField") && child === "Title") node[key] = "Text0";
            else node[key] = rewrite(child);
          }
        }
        return node;
      };
      return JSON.stringify(rewrite(parsed));
    } catch {
      return value;
    }
  };
  const listModel = (model) => ({
    TenantID: 0,
    AppID: model.AppID || 41,
    ListID: model.ListID,
    Title: model.Title,
    Description: model.Description || "",
    Status: 1,
    IsItemPerm: false,
    IsVerRecord: false,
    HasComment: false,
    IconUrl: model.IconUrl || ICON_URL,
    TableCode: model.TableCode || "flowcraft",
    IndexCode: "",
    Created: normalizeDate,
    Modified: normalizeDate,
    CreatedBy: 0,
    ModifiedBy: 0,
    Ext1: "",
    Ext2: "",
    Ext3: "",
    Perm: 0,
    Type: model.Type,
    Flags: 1,
    CustomType: model.CustomType || "",
    WorkspaceID: "0",
    LayoutView: fixLayoutView(model.LayoutView),
    IsBreakInherit: false,
    IsDataSeparate: false,
    HasDeleted: false,
    HasEnabled: true,
    HasDisabled: false,
    AdvanceList: [],
  });
  const field = (item) => {
    const next = { ...item };
    next.FieldName = mapFieldName(next.FieldName);
    if (next.FieldName === "Text0") {
      next.FieldIndex = 0;
      next.IsSystem = false;
      next.Status = 1;
      next.Type = "input";
    }
    if (typeof next.Rules === "string") {
      try {
        const rules = JSON.parse(next.Rules);
        if (rules.listfield === "Title") rules.listfield = "Text0";
        if (rules.displayField === "Title") rules.displayField = "Text0";
        next.Rules = JSON.stringify(rules);
      } catch {
        // Leave opaque Rules strings unchanged.
      }
    }
    next.Category = normalizeFieldCategory(next.Category);
    return next;
  };
  const layout = (item) => ({
    LayoutID: item.LayoutID,
    ListID: item.ListID,
    Type: item.Type,
    Title: item.Title || "",
    LayoutView: fixLayoutView(item.LayoutView),
    AppID: 41,
    TenantID: 0,
    Created: normalizeDate,
    Modified: normalizeDate,
    CreatedBy: 0,
    ModifiedBy: 0,
    Ext1: typeof item.Ext1 === "string" ? item.Ext1 : "",
    Ext2: typeof item.Ext2 === "string" ? item.Ext2 : "",
    Ext3: typeof item.Ext3 === "string" ? item.Ext3 : "",
    IsDefault: !!item.IsDefault,
    IsItemPerm: !!item.IsItemPerm,
    LayoutInResources: (item.LayoutInResources || []).map((resource) => ({
      ID: item.LayoutID,
      RefId: item.LayoutID,
      Resource: resource.Resource || "",
    })),
  });
  return {
    Item: {
      ListModel: listModel(data.Item.ListModel),
      Defs: [],
      Layouts: (data.Item.Layouts || []).map(layout),
      PublicForms: [],
      RemindRules: [],
      FlowMappings: [],
      ListDatas: {},
    },
    Childs: data.Childs.map((child) => ({
      ListModel: listModel(child.ListModel),
      Defs: child.Defs.map(field),
      Layouts: child.Layouts.map(layout),
      PublicForms: [],
      RemindRules: [],
      FlowMappings: [],
      ListDatas: {},
    })),
    Forms: [],
    FormReports: [],
    DataReports: [],
    FormNewReports: [],
    AppGroups: [],
    AppTags: [],
    AppMetadatas: [],
    AppThemes: [],
    AppComponents: [],
    OtherModules: [],
  };
}

function normalizeFieldCategory(value) {
  if (Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) return Number.parseInt(value, 10);
  if (value === undefined || value === null || value === "" || value === "List") return 0;
  throw new Error(`Field.Category must be an integer; got ${Array.isArray(value) ? "array" : typeof value}.`);
}

function removeLookupRelationships(data) {
  const next = structuredClone(data);
  for (const child of next.Childs || []) {
    for (const field of child.Defs || []) {
      if (field.Type === "lookup") {
        field.Type = "input";
        field.Rules = null;
      }
    }
  }
  return next;
}

function createIdAllocator(base = SAFE_ID_BASE) {
  let next = base;
  const seen = new Set();
  return (step = 1) => {
    next += step;
    if (!Number.isSafeInteger(next)) throw new Error(`Generated ID ${next} exceeds Number.MAX_SAFE_INTEGER.`);
    if (seen.has(next)) throw new Error(`Generated duplicate ID ${next}.`);
    seen.add(next);
    return next;
  };
}

function assignSafeSchemaIds(source) {
  const data = structuredClone(source);
  const nextId = createIdAllocator();
  const appId = data.Item?.ListModel?.AppID || 41;
  const rootListId = nextId();
  const listIdByTitle = new Map();

  data.Item.ListModel.AppID = appId;
  data.Item.ListModel.ListID = rootListId;
  data.Item.ListModel.LayoutView = "";
  data.Item.ListModel.CustomType = "";

  for (const layout of data.Item.Layouts || []) {
    const layoutId = nextId();
    layout.AppID = appId;
    layout.ListID = rootListId;
    layout.LayoutID = layoutId;
    if (Number(layout.Type) === 103) {
      Object.assign(layout, makeCurrentDashboardLayout(layout, layout.Title || "Home"));
    } else {
      layout.LayoutInResources = (layout.LayoutInResources || []).map((resource) => ({
        ...resource,
        ID: layoutId,
        RefId: layoutId,
      }));
    }
  }

  for (const child of data.Childs || []) {
    const listId = nextId();
    const title = child.ListModel?.Title || "";
    if (title) listIdByTitle.set(title, listId);
    child.ListModel.AppID = appId;
    child.ListModel.ListID = listId;
    child.ListModel.CustomType = `ListSite_${rootListId}`;

    child.Defs.forEach((field, index) => {
      field.AppID = appId;
      field.ListID = listId;
      field.FieldID = nextId();
      field.FieldIndex = index;
      const prefix = field.FieldType === "DateTime" ? "DateTime" : field.FieldType === "Decimal" ? "Decimal" : field.FieldType === "Bit" ? "Bit" : "Text";
      field.FieldName = `${prefix}${field.FieldIndex}`;
      if (!field.InternalName) field.InternalName = field.FieldName;
      field.Category = normalizeFieldCategory(field.Category);
    });

    const layoutIds = [];
    child.Layouts.forEach((layout) => {
      const layoutId = nextId();
      layoutIds.push(layoutId);
      layout.AppID = appId;
      layout.ListID = listId;
      layout.LayoutID = layoutId;
      if (Number(layout.Type) !== 1) layout.LayoutView = JSON.stringify(makeListViewLayout(child));
      layout.LayoutInResources = (layout.LayoutInResources || []).map((resource) => ({
        ...resource,
        ID: layoutId,
        RefId: layoutId,
      }));
    });
    const editLayout = child.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "Edit Item") || child.Layouts.find((layout) => Number(layout.Type) === 1);
    const viewLayout = child.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "View Item") || editLayout;
    child.ListModel.LayoutView = JSON.stringify({
      add: editLayout?.LayoutID || layoutIds[0] || "default",
      edit: editLayout?.LayoutID || layoutIds[0] || "default",
      view: viewLayout?.LayoutID || editLayout?.LayoutID || layoutIds[0] || "default",
      opentype: { add: "modal" },
      modalsize: {},
      sortVer: 1,
    });
  }

  const home = data.Item.Layouts[0];
  data.Item.ListModel.LayoutView = JSON.stringify({
    add: "default",
    edit: "default",
    view: "default",
    sort: [
      {
        AppID: appId,
        ListID: home?.LayoutID || rootListId,
        ListSetID: rootListId,
        Type: 103,
        IsHidden: false,
        Title: "Home",
        Icon: "fa-regular fa-house",
      },
      ...(data.Childs || []).map((child) => ({
        AppID: appId,
        ListID: child.ListModel.ListID,
        ListSetID: rootListId,
        Type: child.ListModel.Type,
        IsHidden: false,
        Title: child.ListModel.Title,
        Icon: "fa-regular fa-list-check",
      })),
    ],
    sortVer: 1,
  });

  const vendorListId = listIdByTitle.get("Vendors");
  const vendorTitleField = (data.Childs || []).find((child) => child.ListModel?.Title === "Vendors")?.Defs?.[0]?.FieldName || "Text0";
  for (const child of data.Childs || []) {
    for (const field of child.Defs || []) {
      if (field.Type !== "lookup") continue;
      if (!vendorListId) {
        field.Type = "input";
        field.Rules = null;
        continue;
      }
      field.Rules = JSON.stringify({
        appid: appId,
        listsetid: rootListId,
        listid: vendorListId,
        listfield: vendorTitleField,
        displayField: vendorTitleField,
      });
    }
  }

  return data;
}

function countSchemaIds(source) {
  return 1 + (source.Item?.Layouts || []).length + (source.Childs || []).reduce((total, child) => total + 1 + (child.Defs || []).length + (child.Layouts || []).length, 0);
}

function assignApiSchemaIds(source, allocator, options = {}) {
  const data = structuredClone(source);
  const appId = 41;
  const rootListId = allocator.next("root ListID");
  const listIdByTitle = new Map();

  data.Item.ListModel.AppID = appId;
  data.Item.ListModel.ListID = rootListId;
  data.Item.ListModel.LayoutView = "";
  data.Item.ListModel.CustomType = "";

  for (const layout of data.Item.Layouts || []) {
    const layoutId = allocator.next(`root layout ${layout.Title || ""}`);
    layout.AppID = appId;
    layout.ListID = rootListId;
    layout.LayoutID = layoutId;
    if (Number(layout.Type) === 103) {
      Object.assign(layout, makeCurrentDashboardLayout(layout, layout.Title || "Home"));
    } else {
      layout.LayoutInResources = [{
        ID: layoutId,
        RefId: layoutId,
        Resource: JSON.stringify(minimalSurface(layout.Title || "Page")),
      }];
    }
  }

  for (const child of data.Childs || []) {
    const listId = allocator.next(`${child.ListModel?.Title || "child"} ListID`);
    const title = child.ListModel?.Title || "";
    if (title) listIdByTitle.set(title, listId);
    child.ListModel.AppID = appId;
    child.ListModel.ListID = listId;
    child.ListModel.CustomType = `ListSite_${rootListId}`;

    child.Defs.forEach((field, index) => {
      field.AppID = appId;
      field.ListID = listId;
      field.FieldID = allocator.next(`${title || "child"} field ${index}`);
      field.FieldIndex = index;
      const prefix = field.FieldType === "DateTime" ? "DateTime" : field.FieldType === "Decimal" ? "Decimal" : field.FieldType === "Bit" ? "Bit" : "Text";
      field.FieldName = `${prefix}${field.FieldIndex}`;
      if (!field.InternalName) field.InternalName = field.FieldName;
      field.Category = normalizeFieldCategory(field.Category);
    });

    const layoutIds = [];
    child.Layouts.forEach((layout) => {
      const layoutId = allocator.next(`${title || "child"} layout ${layout.Title || ""}`);
      layoutIds.push(layoutId);
      layout.AppID = appId;
      layout.ListID = listId;
      layout.LayoutID = layoutId;
      if (Number(layout.Type) !== 1) layout.LayoutView = JSON.stringify(makeListViewLayout(child));
      layout.LayoutInResources = (layout.LayoutInResources || []).map((resource) => ({
        ...resource,
        ID: layoutId,
        RefId: layoutId,
      }));
    });

    const editLayout = child.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "Edit Item") || child.Layouts.find((layout) => Number(layout.Type) === 1);
    const viewLayout = child.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "View Item") || editLayout;
    child.ListModel.LayoutView = JSON.stringify({
      add: editLayout?.LayoutID || layoutIds[0] || "default",
      edit: editLayout?.LayoutID || layoutIds[0] || "default",
      view: viewLayout?.LayoutID || editLayout?.LayoutID || layoutIds[0] || "default",
      opentype: { add: "modal" },
      modalsize: {},
      sortVer: 1,
    });
  }

  const home = data.Item.Layouts[0];
  if (home && options.dashboard === "simple-data-table") {
    home.LayoutInResources = [{
      ID: home.LayoutID,
      RefId: home.LayoutID,
      Resource: JSON.stringify(simpleDashboardSurface(data)),
    }];
  }
  data.Item.ListModel.LayoutView = JSON.stringify({
    add: "default",
    edit: "default",
    view: "default",
    sort: [
      {
        AppID: appId,
        ListID: home?.LayoutID || rootListId,
        ListSetID: rootListId,
        Type: 103,
        IsHidden: false,
        Title: "Home",
        Icon: "fa-regular fa-house",
      },
      ...(data.Childs || []).map((child) => ({
        AppID: appId,
        ListID: child.ListModel.ListID,
        ListSetID: rootListId,
        Type: child.ListModel.Type,
        IsHidden: false,
        Title: child.ListModel.Title,
        Icon: "fa-regular fa-list-check",
      })),
    ],
    sortVer: 1,
  });

  const vendorList = (data.Childs || []).find((child) => child.ListModel?.Title === "Vendors");
  const vendorListId = vendorList?.ListModel?.ListID || listIdByTitle.get("Vendors");
  const vendorTitleField = vendorList?.Defs?.[0]?.FieldName || "Text0";
  for (const child of data.Childs || []) {
    for (const field of child.Defs || []) {
      if (field.Type !== "lookup") continue;
      if (!vendorListId) {
        field.Type = "input";
        field.Rules = null;
        continue;
      }
      field.Rules = JSON.stringify({
        appid: appId,
        listsetid: rootListId,
        listid: vendorListId,
        listfield: vendorTitleField,
        displayField: vendorTitleField,
      });
    }
  }

  return data;
}

function simpleDashboardSurface(data) {
  const vendors = (data.Childs || []).find((child) => child.ListModel?.Title === "Vendors");
  const columns = (vendors?.Defs || []).slice(0, 6).map((field, index) => ({
    DisplayName: "",
    FieldName: field.DisplayName,
    Field: field.FieldName,
  }));
  return {
    title: "Vendor Management Dashboard",
    ver: "2.0",
    filterVars: [],
    tempVars: [],
    attrs: { hideHeaderAll: true },
    children: [{
      id: "dashboard-content",
      type: "container",
      label: "Container",
      nv_label: "Content",
      attrs: {
        style: { direction: "column", gap: "16px", align_items: "stretch" },
        common: { padding: { left: 32, right: 32, top: 28, bottom: 28 } },
      },
      children: [
        {
          id: "dashboard-title",
          type: "heading",
          label: "Text",
          nv_label: "Dashboard Title",
          attrs: {
            headc: { title: { value: "Vendor Management Dashboard", variable: null } },
            heads: { ty: "h3-bold", color: "var(--c--text)" },
          },
          children: [],
        },
        {
          id: "vendor-table",
          type: "data-list",
          label: "Data table",
          nv_label: "Vendor Data Table",
          attrs: {
            data: {
              list: {
                AppID: 41,
                ListID: vendors?.ListModel?.ListID || "",
                Type: 1,
                Title: "Vendors",
                ListSetID: data.Item?.ListModel?.ListID || "",
              },
              ps: 10,
              filter: [],
              fulltext: [],
              sort: [],
            },
            listarr: columns,
            fallback: { et: "There are no vendors yet." },
          },
          children: [],
        },
      ],
    }],
  };
}

function makeListViewLayout(child) {
  const fields = (child.Defs || []).filter((field) => field.Type !== "textarea").slice(0, 10);
  return {
    layout: fields.map((field, index) => ({
      FieldID: field.FieldID,
      FieldName: field.FieldName,
      DisplayName: field.DisplayName,
      Mobile: true,
      Order: index + 1,
      Show: true,
      Type: field.Type || "input",
    })),
    sort: [],
    filter: [],
    query: [],
    search: fields.slice(0, 3).map((field) => ({
      FieldID: field.FieldID,
      FieldName: field.FieldName,
      DisplayName: field.DisplayName,
      Type: field.Type || "input",
    })),
  };
}

function writeSchemaDirectYap(data, output) {
  let resourceText = JSON.stringify(data);
  resourceText = unquoteIntegerProperties(resourceText);
  const wrapper = {
    Title: TITLE,
    Description: DESCRIPTION,
    IconUrl: ICON_URL,
    IsListSet: true,
    Resource: `[______gizp______]${zlib.gzipSync(Buffer.from(resourceText, "utf8")).toString("base64")}`,
  };
  fs.writeFileSync(output, `${JSON.stringify(wrapper, null, 2)}\n`);
}

function writeSchemaResultYap(data, output) {
  const listExportInfoText = unquoteIntegerProperties(JSON.stringify(data));
  const listExportResult = {
    MainListType: 1024,
    AppID: data.Item?.ListModel?.AppID || 41,
    ReplaceIds: collectGeneratedReplaceIds(data),
    ReportIds: [],
    FormKeys: collectFormKeys(data),
    Data: listExportInfoText,
  };
  const resourceText = unquoteIntegerProperties(JSON.stringify(listExportResult));
  const wrapper = {
    Title: TITLE,
    Description: DESCRIPTION,
    IconUrl: ICON_URL,
    IsListSet: true,
    Resource: `[______gizp______]${zlib.gzipSync(Buffer.from(resourceText, "utf8")).toString("base64")}`,
  };
  fs.writeFileSync(output, `${JSON.stringify(wrapper, null, 2)}\n`);
}

function collectGeneratedReplaceIds(data) {
  const ids = new Set();
  const add = (value) => {
    if (value === undefined || value === null || value === "") return;
    const id = String(value);
    if (!/^\d+$/.test(id)) return;
    if (id === "0" || id === "1" || id === "41") return;
    ids.add(id);
  };
  const collectItem = (item) => {
    if (!item) return;
    add(item.ListModel?.ListID);
    for (const field of item.Defs || []) add(field.FieldID);
    for (const layout of item.Layouts || []) {
      add(layout.LayoutID);
      for (const resource of layout.LayoutInResources || []) {
        add(resource.ID);
        add(resource.RefId);
      }
    }
    for (const form of item.PublicForms || []) {
      add(form.ID);
      add(form.Key);
    }
    for (const rule of item.RemindRules || []) add(rule.ID);
    for (const mapping of item.FlowMappings || []) add(mapping.ID);
    for (const [recordId, record] of Object.entries(item.ListDatas || {})) {
      add(recordId);
      add(record?.ListDataID);
    }
  };
  collectItem(data.Item);
  for (const child of data.Childs || []) collectItem(child);
  for (const group of data.AppGroups || []) add(group.ID);
  for (const tag of data.AppTags || []) add(tag.ID);
  for (const metadata of data.AppMetadatas || []) add(metadata.ID);
  for (const theme of data.AppThemes || []) add(theme.ID);
  for (const component of data.AppComponents || []) add(component.ID);
  return Array.from(ids);
}

function collectFormKeys(data) {
  const keys = new Set();
  const add = (value) => {
    if (typeof value === "string" && value.trim()) keys.add(value.trim());
  };
  for (const form of data.Forms || []) add(form.Key || form.FormKey || form.ProcKey);
  for (const item of [data.Item, ...(data.Childs || [])]) {
    for (const mapping of item?.FlowMappings || []) add(mapping.ProcKey || mapping.FormKey || mapping.Key);
  }
  return Array.from(keys);
}

function unquoteIntegerProperties(jsonText) {
  const keys = [
    "TenantID",
    "AppID",
    "ListID",
    "CreatedBy",
    "ModifiedBy",
    "Perm",
    "Type",
    "Flags",
    "LayoutID",
    "FieldID",
    "FieldIndex",
    "ID",
    "RefId",
    "Status",
  ];
  let out = jsonText;
  for (const key of keys) {
    out = out.replace(new RegExp(`"${key}":"(-?\\d+)"`, "g"), `"${key}":$1`);
  }
  return out;
}
