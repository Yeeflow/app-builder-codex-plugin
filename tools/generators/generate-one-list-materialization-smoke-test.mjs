import fs from "fs";

const SOURCE_RESOURCE = "custom-code-smart-lookup-picker-test.resource.json";
const OUT_RESOURCE = "one-list-materialization-smoke-test.resource.json";
const OUT_APP_DEF = "one-list-materialization-smoke-test.app-def.json";
const OUT_REPORT = "one-list-materialization-smoke-test.generation-report.json";

const SOURCE_ID_BASE = 6081000000000000000n;
const FRESH_ID_BASE = 6191000000000000000n;
const ROOT_ID = String(FRESH_ID_BASE);
const HOME_LAYOUT_ID = String(FRESH_ID_BASE + 1n);
const LIST_ID = String(FRESH_ID_BASE + 2n);
const GENERATED_AT = "2026-05-18 08:45:00";
const TITLE = "One Data List Materialization Smoke Test";
const LIST_TITLE = "Smoke Test Records";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function remapGeneratedId(value) {
  if (typeof value !== "string") return value;
  return value.replace(/\b608100\d{9,}\b/g, (match) => {
    try {
      const oldId = BigInt(match);
      return String(FRESH_ID_BASE + (oldId - SOURCE_ID_BASE));
    } catch {
      return match;
    }
  });
}

function deepRemap(value) {
  if (typeof value === "string") return remapGeneratedId(value);
  if (Array.isArray(value)) return value.map(deepRemap);
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    out[remapGeneratedId(key)] = deepRemap(child);
  }
  return out;
}

function parseJson(value, fallback) {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function collectGeneratedIds(value, ids = new Set()) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/\b619100\d{9,}\b/g)) ids.add(match[0]);
    return ids;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectGeneratedIds(item, ids));
    return ids;
  }
  if (!value || typeof value !== "object") return ids;
  Object.entries(value).forEach(([key, child]) => {
    collectGeneratedIds(key, ids);
    collectGeneratedIds(child, ids);
  });
  return ids;
}

function simplePageResource() {
  return JSON.stringify({
    children: [
      {
        id: "one-list-smoke-main",
        type: "container",
        label: "Container",
        attrs: {
          style: {
            gap: [null, "--sp--s4"],
            direction: [null, "column"],
            justify_content: [null, "flex-start"],
            align_items: [null, "stretch"],
          },
          container: { cw: "2" },
          common: { padding: { t: [null, "--sp--s4"], r: [null, "--sp--s4"], b: [null, "--sp--s4"], l: [null, "--sp--s4"] } },
        },
        children: [
          {
            id: "one-list-smoke-title",
            type: "heading",
            label: "Text",
            attrs: {
              headc: { title: { value: "One Data List Materialization Smoke Test", variable: null } },
              heads: { ty: [null, "xl-semibold"], color: "var(--c--text)" },
              common: { positioning: { widthtype: [null, "2"] } },
            },
            children: [],
            nv_label: "Page title",
          },
          {
            id: "one-list-smoke-note",
            type: "heading",
            label: "Text",
            attrs: {
              headc: { title: { value: "Open Smoke Test Records from the app navigation to confirm the imported data list materialized.", variable: null } },
              heads: { ty: [null, "s-regular"], color: "var(--c--neutral-dark-hover)" },
              common: { positioning: { widthtype: [null, "2"] } },
            },
            children: [],
            nv_label: "Runtime note",
          },
        ],
        nv_label: "Main",
      },
    ],
    attrs: {
      hideHeaderAll: true,
      common: { padding: { t: [null, "--sp--s0"], r: [null, "--sp--s0"], b: [null, "--sp--s0"], l: [null, "--sp--s0"] } },
    },
    title: "Home",
    filterVars: [],
    tempVars: [],
    ver: "2.0",
  });
}

function stripCodeInControls(node) {
  if (Array.isArray(node)) return node.map(stripCodeInControls);
  if (!node || typeof node !== "object") return node;
  if (node.type === "codein") {
    return {
      id: node.id || "removed-codein-note",
      type: "heading",
      label: "Text",
      attrs: {
        headc: { title: { value: "Custom code removed for one-list materialization smoke test.", variable: null } },
        heads: { ty: [null, "s-regular"], color: "var(--c--neutral-dark-hover)" },
        common: { positioning: { widthtype: [null, "2"] } },
      },
      children: [],
      nv_label: "Materialization smoke note",
    };
  }
  const out = {};
  for (const [key, value] of Object.entries(node)) out[key] = stripCodeInControls(value);
  return out;
}

const sourceResource = JSON.parse(fs.readFileSync(SOURCE_RESOURCE, "utf8"));
const resource = deepRemap(clone(sourceResource));
const data = JSON.parse(resource.Data);

const root = data.Item.ListModel;
root.ListID = ROOT_ID;
root.Title = TITLE;
root.Description = "Minimal generated app with exactly one data list for Yeeflow import materialization testing.";
root.IconUrl = "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-list-check\",\"c\":\"#0065FF\"}";
root.Created = GENERATED_AT;
root.Modified = GENERATED_AT;
root.CustomType = "";

const layoutView = parseJson(root.LayoutView, {});
root.LayoutView = JSON.stringify({
  add: "default",
  edit: "default",
  view: "default",
  sort: [
    {
      AppID: 41,
      ListID: HOME_LAYOUT_ID,
      ListSetID: ROOT_ID,
      Type: 103,
      IsHidden: false,
      Title: "Home",
      Icon: "fa-regular fa-house",
    },
    {
      AppID: 41,
      ListID: LIST_ID,
      ListSetID: ROOT_ID,
      Type: 1,
      IsHidden: false,
      Title: LIST_TITLE,
      Icon: "fa-regular fa-list-check",
    },
  ],
  attrs: layoutView.attrs || {
    appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)" },
    "navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" },
    CustomColors: [],
    CustomFonts: [],
  },
  sortVer: 1,
});

const homeLayout = data.Item.Layouts[0];
homeLayout.LayoutID = HOME_LAYOUT_ID;
homeLayout.ListID = ROOT_ID;
homeLayout.Title = "Home";
homeLayout.Created = GENERATED_AT;
homeLayout.Modified = GENERATED_AT;
homeLayout.LayoutInResources = [
  {
    ID: HOME_LAYOUT_ID,
    RefId: HOME_LAYOUT_ID,
    Resource: simplePageResource(),
  },
];
data.Item.Layouts = [homeLayout];
data.Item.LayoutInResources = [];
data.Forms = [];

data.Childs = [data.Childs[0]];
const list = data.Childs[0];
list.ListModel.ListID = LIST_ID;
list.ListModel.Title = LIST_TITLE;
list.ListModel.Description = "Simple records used to test whether a generated one-list .yap materializes after import.";
list.ListModel.CustomType = `ListSite_${ROOT_ID}`;
list.ListModel.Created = GENERATED_AT;
list.ListModel.Modified = GENERATED_AT;
const listLayoutView = parseJson(list.ListModel.LayoutView, {});
list.ListModel.LayoutView = JSON.stringify({
  ...listLayoutView,
  sort: [{ SortName: "Created", SortByDesc: true }],
});
for (const layout of list.Layouts || []) {
  for (const layoutResource of layout.LayoutInResources || []) {
    const parsed = parseJson(layoutResource.Resource, null);
    if (parsed) layoutResource.Resource = JSON.stringify(stripCodeInControls(parsed));
  }
}

const displayNames = new Map([
  ["Title", "Record Name"],
  ["Text1", "Description"],
  ["Text2", "Status"],
  ["Bit1", "Active"],
  ["Decimal1", "Score"],
  ["Datetime1", "Target Date"],
]);

list.Defs = list.Defs.map((field) => {
  if (!displayNames.has(field.FieldName)) return field;
  return {
    ...field,
    DisplayName: displayNames.get(field.FieldName),
    Title: displayNames.get(field.FieldName),
  };
});

list.ListDatas = {
  [String(FRESH_ID_BASE + 10001n)]: {
    ListDataID: String(FRESH_ID_BASE + 10001n),
    Title: "Smoke Record A",
    Text1: "First generated record for import materialization smoke testing.",
    Text2: "Open",
    Bit1: true,
    Decimal1: 10,
    Datetime1: "2026-05-18",
  },
  [String(FRESH_ID_BASE + 10002n)]: {
    ListDataID: String(FRESH_ID_BASE + 10002n),
    Title: "Smoke Record B",
    Text1: "Second generated record for validating list presence and sample data.",
    Text2: "Ready",
    Bit1: true,
    Decimal1: 20,
    Datetime1: "2026-05-19",
  },
};

resource.MainListType = 1024;
resource.Title = TITLE;
resource.Description = root.Description;
resource.IconUrl = root.IconUrl;
resource.FormKeys = [];
resource.ReportIds = [];
resource.Data = JSON.stringify(data);
resource.ReplaceIds = [...collectGeneratedIds(resource)].sort();

fs.writeFileSync(OUT_APP_DEF, `${JSON.stringify(data, null, 2)}\n`);
fs.writeFileSync(OUT_RESOURCE, `${JSON.stringify(resource, null, 2)}\n`);
fs.writeFileSync(OUT_REPORT, `${JSON.stringify({
  status: "generated",
  title: TITLE,
  resourcePath: OUT_RESOURCE,
  appDefPath: OUT_APP_DEF,
  rootListSetId: ROOT_ID,
  childLists: [{ title: LIST_TITLE, listId: LIST_ID, sampleRecords: Object.keys(list.ListDatas).length }],
  forms: data.Forms.length,
  rootLayouts: data.Item.Layouts.length,
  replaceIds: resource.ReplaceIds,
  generatedAt: GENERATED_AT,
}, null, 2)}\n`);

console.log(JSON.stringify({
  status: "pass",
  title: TITLE,
  resourcePath: OUT_RESOURCE,
  appDefPath: OUT_APP_DEF,
  rootListSetId: ROOT_ID,
  listId: LIST_ID,
  sampleRecords: Object.keys(list.ListDatas).length,
}, null, 2));
