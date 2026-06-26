import fs from "fs";

const SOURCE_RESOURCE = "dashboard-data-bound-v3-source.resource.json";
const SOURCE_DATA = "dashboard-data-bound-v3-source.app-def.json";
const OUT_RESOURCE = "generated-dashboard-data-bound-v3-resource.json";
const OUT_DATA = "generated-dashboard-data-bound-v3-app-def.json";
const OUT_REPORT = "generated-dashboard-data-bound-v3-generation-report.json";

const TITLE = "Generated Dashboard Data Bound v3";
const DESCRIPTION = "Minimal generated Yeeflow dashboard package with one local data list, two summary controls, and one data table control.";
const FRESH_ID_BASE = 2056000000001000000n;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function remapString(value, idMap) {
  let next = value;
  for (const [oldId, newId] of idMap.entries()) {
    next = next.split(oldId).join(newId);
  }
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

function stringifyJson(value) {
  return JSON.stringify(value);
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
      layout.LayoutView = stringifyJson(layoutView);
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
  const rootLayoutView = parseJsonMaybe(data.Item.ListModel.LayoutView);
  if (rootLayoutView && Array.isArray(rootLayoutView.sort)) {
    rootLayoutView.sort.forEach((entry) => {
      if (entry.ListID === data.Item.ListModel.ListID) entry.Title = TITLE;
    });
    data.Item.ListModel.LayoutView = stringifyJson(rootLayoutView);
  }

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
    fixes: [
      "Remapped every source Resource.ReplaceIds entry to a fresh generated ID family.",
      "Preserved dashboard page JSON, summary exts, and data-list control references through string remapping.",
      "Set generated native Title field metadata to Status 0, IsSystem true, IsIndex true.",
      "Normalized generated data-list view LayoutView arrays and removed unproven textarea/system pseudo columns from the list grid view."
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
