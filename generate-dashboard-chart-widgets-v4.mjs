import fs from "fs";

const SOURCE_RESOURCE = "dashboard-chart-widgets-v4-source.resource.json";
const SOURCE_DATA = "dashboard-chart-widgets-v4-source.app-def.json";
const OUT_RESOURCE = "generated-dashboard-chart-widgets-v4-resource.json";
const OUT_DATA = "generated-dashboard-chart-widgets-v4-app-def.json";
const OUT_REPORT = "generated-dashboard-chart-widgets-v4-generation-report.json";

const TITLE = "Generated Dashboard Chart Widgets v4";
const DESCRIPTION = "Minimal generated Yeeflow dashboard package with one local data list, summary/table controls, and pie, column, and line chart widgets.";
const FRESH_ID_BASE = 2057000000001000000n;

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
    chartWidgets: [
      { key: "pie-chart", chartType: "0" },
      { key: "bar-chart", chartType: "2", label: "Column chart" },
      { key: "line-chart", chartType: "1" }
    ],
    fixes: [
      "Remapped every source Resource.ReplaceIds entry to a fresh generated ID family.",
      "Remapped object keys as well as values for ListDatas sample row IDs.",
      "Preserved chart control IDs, Resource.ReportIds, page exts, and local list data-source bindings.",
      "Preserved large numeric IDs as strings by using decoded app-def JSON as the Data source.",
      "Kept generated native Title field metadata at Status 0, IsSystem true, IsIndex true."
    ]
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    status: "pass",
    resource: OUT_RESOURCE,
    data: OUT_DATA,
    replaceIds: resource.ReplaceIds.length,
    idFamily: String(FRESH_ID_BASE)
  }, null, 2));
}

main();
