import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const SOURCE_PACKAGE = process.env.YEEFLOW_SOURCE_PACKAGE || path.resolve("generated-dashboard-filter-controls-v5.yap");
const OUT_PACKAGE = "pivot-table-control-runtime-proof-with-sample-data.v2.yap";
const DOWNLOADS_COPY = process.env.YEEFLOW_DOWNLOADS_COPY || path.resolve(OUT_PACKAGE);
const OUT_RESOURCE = ".tmp/pivot-table-control-runtime-proof-with-sample-data.v2.resource.json";
const OUT_DATA = ".tmp/pivot-table-control-runtime-proof-with-sample-data.v2.app-def.json";
const OUT_REPORT = ".tmp/pivot-table-control-runtime-proof-with-sample-data.v2.generation-report.json";
const TITLE = "Pivot Table Runtime Proof with Sample Data";
const DESCRIPTION = "Focused generated dashboard package for Pivot Table manual import testing with 20 safe synthetic list rows.";
const FRESH_ID_BASE = 2060500000001000000n;

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
  const pageResource = layout.LayoutInResources?.[0]?.Resource;
  if (!pageResource) throw new Error("Template dashboard is missing LayoutInResources[0].Resource.");
  return { layout, page: parseJson(pageResource, "Dashboard page") };
}

function uuid(seed) {
  return `pt-${seed}-0000-4000-8000-${String(seed).padStart(12, "0")}`;
}

function setField(def, config, listId, index) {
  def.FieldName = config.fieldName;
  def.DisplayName = config.displayName;
  def.InternalName = config.internalName;
  def.Type = config.type;
  def.ListID = listId;
  def.Status = config.fieldName === "Title" ? 0 : 1;
  def.IsSystem = config.fieldName === "Title";
  def.IsIndex = config.fieldName === "Title";
  def.FieldIndex = config.fieldIndex ?? index;
  def.Rules = JSON.stringify(config.rules || {});
  delete def.ControlType;
  return def;
}

function configureSyntheticList(data) {
  const list = data.Childs?.[0];
  if (!list) throw new Error("Template package does not contain a child data list.");
  const listId = String(list.ListModel.ListID);
  list.ListModel.Title = "Deals Analytics Runtime Test";
  list.ListModel.Description = "Synthetic safe rows for Pivot Table runtime proof.";
  list.ListModel.Flags = 1;
  list.ListModel.ListType = 1;
  list.ListModel.Status = 1;

  const fields = [
    { fieldName: "Title", displayName: "Deal Name", internalName: "Title", type: "input", fieldIndex: 0 },
    { fieldName: "Text1", displayName: "Deal Type", internalName: "Deal_Type", type: "input", fieldIndex: 1 },
    { fieldName: "Text2", displayName: "Deal Owner", internalName: "Deal_Owner", type: "input", fieldIndex: 2 },
    { fieldName: "Text3", displayName: "Country or Region", internalName: "Country_or_Region", type: "input", fieldIndex: 3 },
    { fieldName: "Text4", displayName: "Lead Source", internalName: "Lead_Source", type: "input", fieldIndex: 4 },
    { fieldName: "Datetime1", displayName: "Close Date", internalName: "Close_Date", type: "datepicker", rules: { format: "YYYY-MM-DD" }, fieldIndex: 1 },
    { fieldName: "Decimal1", displayName: "Amount", internalName: "Amount", type: "currency", rules: { "rounded-to": 2 }, fieldIndex: 1 },
    { fieldName: "Text5", displayName: "Stage", internalName: "Stage", type: "input", fieldIndex: 5 },
    { fieldName: "Text6", displayName: "Status", internalName: "Status", type: "input", fieldIndex: 6 },
  ];
  // Clone by storage FieldName so FieldType/Type metadata stays aligned with seeded row keys.
  const templateDefByFieldName = new Map(list.Defs.map((def) => [String(def.FieldName), def]));
  list.Defs = fields.map((field, index) => {
    const templateDef = templateDefByFieldName.get(field.fieldName);
    if (!templateDef) throw new Error(`Template package does not contain a reusable field definition for ${field.fieldName}.`);
    return setField(clone(templateDef), field, listId, index);
  });

  const layout = list.Layouts?.[0];
  if (layout) {
    layout.Title = "All Items";
    layout.Type = 0;
    layout.LayoutView = JSON.stringify({
      layout: list.Defs.map((def, index) => ({
        FieldID: def.FieldID,
        FieldName: def.FieldName,
        Mobile: 2,
        Order: index + 1,
        Show: true,
        Type: def.Type,
        DisplayName: def.DisplayName,
        Rules: typeof def.Rules === "string" ? JSON.parse(def.Rules || "{}") : def.Rules || {},
      })),
      query: [],
      sort: [{ FieldName: "Datetime1", SortByDesc: true }],
      rowColor: [],
      filter: [],
    });
  }

  const rows = [
    ["2060500000001000101", "Alpha Renewal", "Existing Business", "Avery", "North", "Referral", "2024-02-15", "12000", "Qualified", "Open"],
    ["2060500000001000102", "Beta Expansion", "New Business", "Blake", "West", "Paid Search", "2024-03-20", "18000", "Proposal", "Open"],
    ["2060500000001000103", "Cedar Pilot", "New Business", "Avery", "East", "Organic Social", "2024-04-10", "8500", "Qualified", "Open"],
    ["2060500000001000104", "Delta Renewal", "Existing Business", "Casey", "North", "Referral", "2024-07-01", "24000", "Won", "Closed"],
    ["2060500000001000105", "Elm Upgrade", "Existing Business", "Blake", "South", "Email Marketing", "2024-09-14", "15500", "Won", "Closed"],
    ["2060500000001000106", "Fjord Launch", "New Business", "Casey", "West", "Paid Search", "2025-01-18", "31000", "Proposal", "Open"],
    ["2060500000001000107", "Granite Cross Sell", "Existing Business", "Avery", "East", "Referral", "2025-03-11", "14000", "Qualified", "Open"],
    ["2060500000001000108", "Harbor Entry", "New Business", "Blake", "North", "Organic Social", "2025-05-06", "22000", "Negotiation", "Open"],
    ["2060500000001000109", "Iris Renewal", "Existing Business", "Casey", "South", "Referral", "2025-06-19", "17500", "Won", "Closed"],
    ["2060500000001000110", "Juniper Pilot", "New Business", "Avery", "West", "Direct Traffic", "2025-07-22", "9500", "Qualified", "Open"],
    ["2060500000001000111", "Keystone Rollout", "New Business", "Blake", "East", "Paid Search", "2024-10-03", "42000", "Negotiation", "Open"],
    ["2060500000001000112", "Lumen Services", "Existing Business", "Casey", "North", "Email Marketing", "2024-11-12", "26000", "Proposal", "Open"],
    ["2060500000001000113", "Maple Renewal", "Existing Business", "Avery", "South", "Organic Social", "2025-02-04", "13400", "Won", "Closed"],
    ["2060500000001000114", "Nimbus Entry", "New Business", "Blake", "West", "Referral", "2025-08-18", "28800", "Proposal", "Open"],
    ["2060500000001000115", "Orchid Upgrade", "Existing Business", "Casey", "East", "Direct Traffic", "2024-12-06", "19800", "Qualified", "Open"],
    ["2060500000001000116", "Pioneer Expansion", "New Business", "Avery", "North", "Paid Search", "2025-09-09", "36500", "Negotiation", "Open"],
    ["2060500000001000117", "Quartz Renewal", "Existing Business", "Blake", "South", "Email Marketing", "2024-05-17", "11100", "Won", "Closed"],
    ["2060500000001000118", "River Pilot", "New Business", "Casey", "West", "Organic Social", "2024-08-26", "16400", "Qualified", "Open"],
    ["2060500000001000119", "Summit Services", "Existing Business", "Avery", "East", "Referral", "2025-10-14", "24500", "Proposal", "Open"],
    ["2060500000001000120", "Timber Rollout", "New Business", "Blake", "North", "Direct Traffic", "2025-11-03", "33750", "Negotiation", "Open"],
  ];
  list.ListDatas = Object.fromEntries(rows.map(([id, title, type, owner, region, source, closeDate, amount, stage, status]) => [id, {
    ListDataID: id,
    Title: title,
    Text1: type,
    Text2: owner,
    Text3: region,
    Text4: source,
    Datetime1: closeDate,
    Decimal1: amount,
    Text5: stage,
    Text6: status,
  }]));
  return list;
}

function heading(id, text, size = 24) {
  return {
    id,
    type: "heading",
    label: "Text",
    attrs: {
      headc: text,
      heads: { ty: [null, { size, wei: "600" }], color: "#172554" },
      common: { margin: [null, { top: 0, right: 0, bottom: "--sp--s100", left: 0 }] },
    },
  };
}

function pivotAttrs(rowKeys, columnKeys, valueKeys, { showTotal = true } = {}) {
  const widths = {};
  rowKeys.forEach((key, index) => {
    widths[key] = { cw: [null, index === 0 ? 160 : 120] };
  });
  const columns = {};
  columnKeys.forEach((key) => {
    columns[key] = { cw: [null, 130] };
  });
  const values = {};
  valueKeys.forEach((key) => {
    values[key] = {};
  });
  if (!showTotal) values.showtotal = false;
  return {
    rows: widths,
    columns,
    values,
    header: {
      bdt: "1",
      bdw: [null, { top: null, right: null, bottom: 1, left: null }],
      bdc: "var(--c--neutral-light-active)",
      normal: { bgcolor: "#4B5563", color: "#ffffff" },
      ty: { size: [null, 14], wei: "600" },
      pd: [null, { top: "--sp--s050", right: "--sp--s075", bottom: "--sp--s050", left: "--sp--s075" }],
    },
    body: {
      pd: [null, { top: "--sp--s050", right: "--sp--s075", bottom: "--sp--s050", left: "--sp--s075" }],
      bdt: "1",
      bdw: [null, { top: null, right: null, bottom: 1, left: null }],
      bdc: "var(--c--neutral-light-active)",
      normal: { rcolor: "var(--c--neutral-dark-active)" },
      align: [null, "left"],
      va: [null, "2"],
    },
    subtotal: { normal: { rbgcolor: "#ffffff" } },
    grandtotal: {
      ty: { wei: "700" },
      normal: { color: "#1D4ED8", bgcolor: "rgba(29, 78, 216, 0.10)" },
    },
  };
}

function pivotControl(id, rowKeys, columnKeys, valueKeys, options) {
  return {
    id,
    type: "pivot-table",
    label: "Pivot table",
    attrs: pivotAttrs(rowKeys, columnKeys, valueKeys, options),
  };
}

function pivotExt(controlId, listId, listSetId, rows, columns, values) {
  return {
    category: "___Pivot___",
    key: "PivotTable",
    i: controlId,
    attr: {
      modelType: 3,
      settings: { rows, columns, values },
      AppID: 41,
      ListID: listId,
      ListSetID: listSetId,
    },
  };
}

function card(id, title, control) {
  return {
    id,
    type: "container",
    label: "Container",
    attrs: {
      common: { nv_label: title },
      style: {
        bg: "#ffffff",
        radius: [null, 8],
        padding: [null, { top: "--sp--s150", right: "--sp--s150", bottom: "--sp--s150", left: "--sp--s150" }],
        margin: [null, { top: 0, right: 0, bottom: "--sp--s150", left: 0 }],
        border: { type: "1", color: "#E5E7EB", width: 1 },
      },
    },
    children: [heading(uuid(`${id}-h`), title, 18), control],
  };
}

function configureDashboard(data, list, reportIds) {
  const { layout } = pageFromDashboard(data);
  const listId = String(list.ListModel.ListID);
  const listSetId = String(data.Item.ListModel.ListID);
  const countId = uuid(101);
  const sumId = uuid(102);
  const avgId = uuid(103);
  reportIds.push(countId, sumId, avgId);

  const page = {
    title: "Dashboard",
    ver: "1.0",
    attrs: {
      hideHeaderAll: true,
      background: "#F8FAFC",
      container: { padding: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }] },
    },
    filterVars: [],
    tempVars: [],
    exts: [
      pivotExt(countId, listId, listSetId,
        [{ fieldName: "Text1", func: "", id: "Text1", mapkey: "pt_c_0" }],
        [{ fieldName: "Text2", func: "", id: "Text2", mapkey: "pt_c_0" }],
        [{ fieldName: "ListDataID", func: "COUNT", id: "ListDataID_COUNT", mapkey: "pt_c_0" }]),
      pivotExt(sumId, listId, listSetId,
        [{ fieldName: "Text4", func: "", id: "Text4", mapkey: "pt_c_0" }],
        [{ fieldName: "Datetime1", func: "YEAR", id: "Datetime1_YEAR", mapkey: "pt_c_0" }],
        [{ fieldName: "Decimal1", func: "SUM", id: "Decimal1_SUM", mapkey: "pt_c_0" }]),
      pivotExt(avgId, listId, listSetId,
        [{ fieldName: "Text5", func: "", id: "Text5", mapkey: "pt_c_0" }],
        [{ fieldName: "Text1", func: "", id: "Text1", mapkey: "pt_c_0" }],
        [{ fieldName: "Decimal1", func: "AVG", id: "Decimal1_AVG", mapkey: "pt_c_0" }]),
    ],
    children: [{
      id: uuid(1),
      type: "container",
      label: "Container",
      nv_label: "Main",
      attrs: { common: { nv_label: "Main" }, style: { direction: [null, "column"], gap: [null, "--sp--s150"], padding: [null, { top: "--sp--s200", right: "--sp--s200", bottom: "--sp--s200", left: "--sp--s200" }] } },
      children: [{
        id: uuid(2),
        type: "container",
        label: "Container",
        nv_label: "Content",
        attrs: { common: { nv_label: "Content" }, style: { direction: [null, "column"], gap: [null, "--sp--s150"], width: [null, "100%"] } },
        children: [
          heading(uuid(3), "Pivot Table Runtime Proof", 26),
          card(uuid(4), "Count by Deal Type and Owner", pivotControl(countId, ["pt_c_0"], ["pt_c_0"], ["pt_c_0"])),
          card(uuid(5), "Sum Amount by Lead Source and Year", pivotControl(sumId, ["pt_c_0"], ["pt_c_0"], ["pt_c_0"])),
          card(uuid(6), "Average Amount by Stage and Deal Type", pivotControl(avgId, ["pt_c_0"], ["pt_c_0"], ["pt_c_0"])),
        ],
      }],
    }],
  };
  layout.Title = "Dashboard";
  layout.LayoutInResources = [{ ID: layout.LayoutID, RefId: layout.LayoutID, Resource: JSON.stringify(page) }];
  return {
    pivotTables: [
      { id: countId, rows: "Deal Type", columns: "Deal Owner", value: "COUNT ListDataID" },
      { id: sumId, rows: "Lead Source", columns: "Close Date YEAR", value: "SUM Amount" },
      { id: avgId, rows: "Stage", columns: "Deal Type", value: "AVG Amount" },
    ],
  };
}

function ensureApp(data) {
  data.Item.ListModel.Title = TITLE;
  data.Item.ListModel.Description = DESCRIPTION;
  data.Item.ListModel.Modified = new Date().toISOString();
  data.Item.ListModel.Flags = 1;
  data.Item.ListModel.ListType = 1;
  const list = data.Childs[0];
  const dashboard = data.Item.Layouts.find((item) => String(item.Type) === "103" && item.Title === "Dashboard");
  data.Item.ListModel.LayoutView = JSON.stringify({
    sortVer: 1,
    sort: [
      { AppID: 41, ListID: dashboard.LayoutID, ListSetID: data.Item.ListModel.ListID, Type: 103, IsHidden: false, Title: "Dashboard" },
      { AppID: 41, ListID: list.ListModel.ListID, ListSetID: data.Item.ListModel.ListID, Type: 1, Title: list.ListModel.Title },
    ],
  });
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
  if (!fs.existsSync(SOURCE_PACKAGE)) throw new Error(`Template package not found: ${SOURCE_PACKAGE}`);
  const decoded = decodePackage(SOURCE_PACKAGE);
  const replaceIds = decoded.resource.ReplaceIds || [];
  if (!replaceIds.length) throw new Error("Template Resource.ReplaceIds is empty.");
  const idMap = new Map();
  replaceIds.forEach((oldId, index) => idMap.set(String(oldId), String(FRESH_ID_BASE + BigInt(index))));

  const resource = deepRemap(clone(decoded.resource), idMap);
  const data = deepRemap(clone(decoded.data), idMap);
  resource.ReplaceIds = replaceIds.map((oldId) => idMap.get(String(oldId)));
  resource.FormKeys = [];
  resource.ReportIds = [];

  const list = configureSyntheticList(data);
  for (const id of Object.keys(list.ListDatas)) {
    if (!resource.ReplaceIds.includes(id)) resource.ReplaceIds.push(id);
  }
  ensureApp(data);
  const dashboardReport = configureDashboard(data, list, resource.ReportIds);

  resource.Title = TITLE;
  resource.Description = DESCRIPTION;
  resource.Data = JSON.stringify(data);
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
    syntheticRows: Object.keys(list.ListDatas).length,
    reportIds: resource.ReportIds,
    pivotTables: dashboardReport.pivotTables,
    localValidationExpectation: "strict generated-app/import-readiness must pass with 0 errors before runtime import",
    proofBoundary: "Generated dashboard runtime proof package; no source export or private CRM data included.",
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    status: "pass",
    package: OUT_PACKAGE,
    downloadsCopy: DOWNLOADS_COPY,
    syntheticRows: Object.keys(list.ListDatas).length,
    pivotTables: dashboardReport.pivotTables.length,
  }, null, 2));
}

main();
