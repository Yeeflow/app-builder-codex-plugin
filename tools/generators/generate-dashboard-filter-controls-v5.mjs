import fs from "fs";

const SOURCE_RESOURCE = "dashboard-filter-controls-v5-source.resource.json";
const SOURCE_DATA = "dashboard-filter-controls-v5-source.app-def.json";
const OUT_RESOURCE = "generated-dashboard-filter-controls-v5-resource.json";
const OUT_DATA = "generated-dashboard-filter-controls-v5-app-def.json";
const OUT_REPORT = "generated-dashboard-filter-controls-v5-generation-report.json";

const TITLE = "Generated Dashboard Filter Controls v5";
const DESCRIPTION = "Minimal generated Yeeflow dashboard package with local data, summary/table controls, pie/column/line charts, and search/radio/range dashboard filters.";
const FRESH_ID_BASE = 2058000000001000000n;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

function parseJsonMaybe(value) {
  if (typeof value !== "string" || !value.trim().startsWith("{")) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function fixGeneratedListMetadata(data) {
  for (const child of data.Childs || []) {
    for (const def of child.Defs || []) {
      if (def.FieldName === "Title") {
        def.Status = 0;
        def.IsSystem = true;
        def.IsIndex = true;
      }
    }

    for (const layout of child.Layouts || []) {
      const layoutView = parseJsonMaybe(layout.LayoutView);
      if (!layoutView) continue;
      layoutView.layout = (layoutView.layout || []).filter((column) => {
        if (String(column.FieldID || "").startsWith("-")) return false;
        if (column.Type === "textarea") return false;
        return true;
      });
      layoutView.layout.forEach((column, index) => {
        column.Order = index + 1;
      });
      if (!Array.isArray(layoutView.sort)) layoutView.sort = [];
      if (!Array.isArray(layoutView.query)) layoutView.query = [];
      if (!Array.isArray(layoutView.rowColor)) layoutView.rowColor = [];
      if (!Array.isArray(layoutView.filter)) layoutView.filter = [];
      layout.LayoutView = JSON.stringify(layoutView);
    }
  }
}

function extractDashboardPage(data) {
  const layout = data.Item.Layouts.find((item) => String(item.Type) === "103");
  if (!layout) throw new Error("Source app does not include a Type 103 dashboard layout.");
  const pageResource = layout.LayoutInResources && layout.LayoutInResources[0] && layout.LayoutInResources[0].Resource;
  const page = parseJsonMaybe(pageResource);
  if (!page) throw new Error("Source dashboard LayoutInResources[0].Resource is not valid page JSON.");
  return page;
}

function collectFilterControls(node, out = []) {
  if (!isObject(node)) return out;
  if (["search-filter", "radio-filter", "range-filter"].includes(node.type)) {
    out.push({
      id: node.id,
      type: node.type,
      label: node.label,
      binding: node.binding,
      attrsKeys: node.attrs ? Object.keys(node.attrs) : []
    });
  }
  for (const child of node.children || []) collectFilterControls(child, out);
  return out;
}

function main() {
  const source = JSON.parse(fs.readFileSync(SOURCE_RESOURCE, "utf8"));
  const sourceData = JSON.parse(fs.readFileSync(SOURCE_DATA, "utf8"));
  const replaceIds = source.ReplaceIds || [];
  if (!replaceIds.length) throw new Error("Source Resource.ReplaceIds is empty.");

  const idMap = new Map();
  replaceIds.forEach((oldId, index) => {
    idMap.set(String(oldId), String(FRESH_ID_BASE + BigInt(index)));
  });

  const resource = deepRemap(clone(source), idMap);
  const data = deepRemap(clone(sourceData), idMap);

  resource.ReplaceIds = replaceIds.map((oldId) => idMap.get(String(oldId)));
  resource.ReportIds = Array.isArray(source.ReportIds) ? [...source.ReportIds] : [];
  resource.FormKeys = Array.isArray(source.FormKeys) ? [...source.FormKeys] : [];

  data.Item.ListModel.Title = TITLE;
  data.Item.ListModel.Description = DESCRIPTION;
  data.Item.ListModel.Modified = new Date().toISOString();

  fixGeneratedListMetadata(data);
  resource.Data = JSON.stringify(data);

  const page = extractDashboardPage(data);
  const filterControls = collectFilterControls(page);
  const chartConditions = (page.exts || [])
    .filter((ext) => ["pie-chart", "bar-chart", "line-chart"].includes(ext.key))
    .map((ext) => ({
      key: ext.key,
      controlId: ext.i,
      conditions: ext.attr && ext.attr.settings && ext.attr.settings.Conditions ? ext.attr.settings.Conditions.length : 0
    }));

  fs.writeFileSync(OUT_RESOURCE, `${JSON.stringify(resource, null, 2)}\n`);
  fs.writeFileSync(OUT_DATA, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(OUT_REPORT, `${JSON.stringify({
    status: "pass",
    title: TITLE,
    source: SOURCE_RESOURCE,
    outputs: { resource: OUT_RESOURCE, data: OUT_DATA },
    idFamily: String(FRESH_ID_BASE),
    replaceIds: resource.ReplaceIds.length,
    reportIds: resource.ReportIds,
    filterVars: page.filterVars,
    filterControls,
    chartConditions,
    fixes: [
      "Remapped every source Resource.ReplaceIds entry to a fresh generated ID family.",
      "Remapped object keys as well as values for ListDatas sample row IDs.",
      "Preserved filterVars, filter control bindings, chart condition variable expressions, chart control IDs, and Resource.ReportIds.",
      "Preserved large numeric IDs as strings by using decoded app-def JSON as the Data source.",
      "Kept generated native Title field metadata at Status 0, IsSystem true, IsIndex true."
    ]
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    status: "pass",
    resource: OUT_RESOURCE,
    data: OUT_DATA,
    replaceIds: resource.ReplaceIds.length,
    idFamily: String(FRESH_ID_BASE),
    filters: filterControls.length
  }, null, 2));
}

main();
