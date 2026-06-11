import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const SOURCE_PACKAGE = "/Users/Renger/Downloads/generated-dashboard-filter-controls-v5.yap";
const OUT_PACKAGE = "data-filter-controls-runtime-proof.v1.yap";
const OUT_RESOURCE = ".tmp/data-filter-controls-runtime-proof.v1.resource.json";
const OUT_DATA = ".tmp/data-filter-controls-runtime-proof.v1.app-def.json";
const OUT_REPORT = ".tmp/data-filter-controls-runtime-proof.v1.generation-report.json";
const DOWNLOADS_COPY = "/Users/Renger/Downloads/data-filter-controls-runtime-proof.v1.yap";
const TITLE = "Data Filter Runtime Proof";
const DESCRIPTION = "Focused generated dashboard package for Data Filter import/open/render and basic interaction runtime proof with synthetic local rows only.";
const FRESH_ID_BASE = 2059300000001000000n;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function decodePackage(inputPath) {
  const wrapper = parseJson(fs.readFileSync(inputPath, "utf8"), inputPath);
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`${inputPath} is not a valid gzip-prefixed .yap wrapper.`);
  }
  const resource = parseJson(zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"), "Resource");
  const data = parseJson(resource.Data, "Resource.Data");
  return { wrapper, resource, data };
}

function remapString(value, idMap) {
  let next = value;
  for (const [oldId, newId] of idMap.entries()) next = next.split(oldId).join(newId);
  return next;
}

function deepRemap(value, idMap) {
  if (typeof value === "string") return remapString(value, idMap);
  if (Array.isArray(value)) return value.map((item) => deepRemap(item, idMap));
  if (!isObject(value)) return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) out[remapString(key, idMap)] = deepRemap(child, idMap);
  return out;
}

function pageFromDashboard(data) {
  const layout = data.Item.Layouts.find((item) => String(item.Type) === "103" && item.Title === "Dashboard");
  if (!layout) throw new Error("Template package does not contain a Dashboard Type 103 layout.");
  const resource = layout.LayoutInResources?.[0]?.Resource;
  const page = parseJson(resource, "Dashboard LayoutInResources[0].Resource");
  return { layout, page };
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function findControl(page, type) {
  let found = null;
  walk(page, (node) => {
    if (!found && isObject(node) && node.type === type) found = node;
  });
  return found;
}

function ensureGeneratedListRules(data) {
  data.Item.ListModel.Title = TITLE;
  data.Item.ListModel.Description = DESCRIPTION;
  data.Item.ListModel.Modified = new Date().toISOString();
  data.Item.ListModel.Flags = 1;
  if (!data.Item.ListModel.ListType) data.Item.ListModel.ListType = 1;

  for (const child of data.Childs || []) {
    child.ListModel.Flags = 1;
    child.ListModel.ListType = 1;
    child.ListModel.Status = 1;
    for (const def of child.Defs || []) {
      if (def.FieldName === "Title") {
        def.Status = 0;
        def.IsSystem = true;
        def.IsIndex = true;
        def.FieldIndex = 0;
      }
      if (typeof def.InternalName === "string" && /[^A-Za-z0-9_]/.test(def.InternalName)) {
        def.InternalName = def.FieldName;
      }
    }
  }
}

function listRef(data) {
  const child = data.Childs?.[0];
  if (!child) throw new Error("Template package does not contain a local child data list.");
  return {
    AppID: 41,
    ListID: child.ListID,
    Type: 1,
    Title: child.ListModel.Title,
    ListSetID: data.Item.ListID,
  };
}

function expressionFilter(filterVarId) {
  return {
    exprType: "variable",
    valueType: "string",
    id: `__filter_${filterVarId}`,
    type: "expr",
    name: filterVarId,
  };
}

function addRuntimeFilterControls(data) {
  const { layout, page } = pageFromDashboard(data);
  page.title = "Dashboard";
  page.filterVars = page.filterVars || [];
  if (!page.filterVars.some((item) => item.id === "filter_Sorting")) page.filterVars.push({ id: "filter_Sorting" });

  const applyButtonId = "2e419cfe-df10-4635-ae51-63d1cf410121";
  const sortingFilterId = "6d47eec8-b3d5-45da-8e5a-8d01ee92dd05";
  const sourceList = listRef(data);

  const search = findControl(page, "search-filter");
  if (!search) throw new Error("Template package does not contain a search-filter control.");
  search.attrs = {
    ...search.attrs,
    placeholder: "Search event",
    apply_t: "2",
    apply_btn: applyButtonId,
  };

  const dataList = findControl(page, "data-list");
  if (!dataList) throw new Error("Template package does not contain a dashboard data-list control.");
  dataList.attrs.data.fulltext = [
    {
      key: "df-search-title",
      pre: "and",
      fields: ["Title", "Text7"],
      value: [expressionFilter("filter_Search")],
    },
  ];
  dataList.attrs.data.sortingfilter = [expressionFilter("filter_Sorting")];

  const filterContainer = page.children?.[0]?.children?.[0]?.children?.find((child) =>
    Array.isArray(child.children) && child.children.some((item) => item.type === "search-filter")
  );
  if (!filterContainer) throw new Error("Template package does not contain the expected filter container.");

  filterContainer.children.push(
    {
      id: sortingFilterId,
      type: "sorting-filters",
      label: "Sorting filter",
      attrs: {
        data: { list: sourceList },
        sort_list: [
          { mapkey: "df-sort-title-asc", title: "Name A to Z", orderby: "Title", order: "asc" },
          { mapkey: "df-sort-title-desc", title: "Name Z to A", orderby: "Title", order: "desc" },
          { mapkey: "df-sort-budget-desc", title: "Budget high to low", orderby: "Decimal1", order: "desc" },
        ],
        placeholder: "Sort events",
      },
      binding: "__filter_filter_Sorting",
    },
    {
      id: applyButtonId,
      type: "apply-button",
      label: "Apply Search",
      displayLabel: true,
      attrs: {
        common: {
          padding: [null, { top: 0, right: 5, bottom: 0, left: 5 }],
        },
        button: {
          normal: {
            bg: "var(--c--primary)",
            c: "#ffffff",
            border: { type: "0" },
          },
          ty: { size: [null, 14] },
        },
        align: [null, "justify"],
      },
    }
  );

  layout.LayoutInResources[0].Resource = JSON.stringify(page);
  return {
    filterVars: page.filterVars.map((item) => item.id),
    addedControls: ["sorting-filters", "apply-button"],
    clickApplyFilter: "filter_Search",
    valueChangeFilter: "filter_Range_BudgetNumber",
  };
}

function buildWrapper(sourceWrapper, resource) {
  const resourceText = JSON.stringify(resource);
  return {
    ...sourceWrapper,
    Title: TITLE,
    Description: DESCRIPTION,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(resourceText, "utf8")).toString("base64")}`,
  };
}

function main() {
  if (!fs.existsSync(SOURCE_PACKAGE)) {
    throw new Error(`Template package not found: ${SOURCE_PACKAGE}`);
  }
  const decoded = decodePackage(SOURCE_PACKAGE);
  const replaceIds = decoded.resource.ReplaceIds || [];
  if (!replaceIds.length) throw new Error("Template package Resource.ReplaceIds is empty.");

  const idMap = new Map();
  replaceIds.forEach((oldId, index) => idMap.set(String(oldId), String(FRESH_ID_BASE + BigInt(index))));

  const resource = deepRemap(clone(decoded.resource), idMap);
  const data = deepRemap(clone(decoded.data), idMap);
  resource.ReplaceIds = replaceIds.map((oldId) => idMap.get(String(oldId)));
  resource.ReportIds = Array.isArray(decoded.resource.ReportIds) ? [...decoded.resource.ReportIds] : [];
  resource.FormKeys = Array.isArray(decoded.resource.FormKeys) ? [...decoded.resource.FormKeys] : [];

  ensureGeneratedListRules(data);
  const filterReport = addRuntimeFilterControls(data);
  resource.Data = JSON.stringify(data);
  resource.Title = TITLE;
  resource.Description = DESCRIPTION;

  const wrapper = buildWrapper(decoded.wrapper, resource);

  fs.mkdirSync(path.dirname(OUT_RESOURCE), { recursive: true });
  fs.writeFileSync(OUT_RESOURCE, `${JSON.stringify(resource, null, 2)}\n`);
  fs.writeFileSync(OUT_DATA, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(OUT_PACKAGE, `${JSON.stringify(wrapper, null, 2)}\n`);
  fs.copyFileSync(OUT_PACKAGE, DOWNLOADS_COPY);
  fs.writeFileSync(OUT_REPORT, `${JSON.stringify({
    status: "pass",
    sourcePackage: SOURCE_PACKAGE,
    outputPackage: OUT_PACKAGE,
    downloadsCopy: DOWNLOADS_COPY,
    title: TITLE,
    replaceIds: resource.ReplaceIds.length,
    filterReport,
    localValidationExpectation: "strict generated-app/import-readiness must pass with 0 errors before runtime import",
    proofBoundary: "Generated dashboard runtime proof package; no source export or private data included.",
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    status: "pass",
    package: OUT_PACKAGE,
    downloadsCopy: DOWNLOADS_COPY,
    replaceIds: resource.ReplaceIds.length,
    filterVars: filterReport.filterVars,
  }, null, 2));
}

main();
