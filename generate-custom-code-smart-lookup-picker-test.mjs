import fs from "fs";
import { randomUUID } from "crypto";
import zlib from "zlib";

const SOURCE_YAP = "Approval Form Controls Test v1.generated.yap";
const SMART_LOOKUP_SCRIPT = "/Users/Renger/Documents/Codex Projects/Yeeflow Custom Code_26/templates/smart-lookup-picker/smart-lookup-picker.tsx";
const GZIP_PREFIX = "[______gizp______]";

const OUT_RESOURCE = "custom-code-smart-lookup-picker-test.resource.json";
const OUT_DATA = "custom-code-smart-lookup-picker-test.app-def.json";
const OUT_REPORT = "custom-code-smart-lookup-picker-test.generation-report.json";

const TITLE = "Custom Code Smart Lookup Picker Test";
const DESCRIPTION = "Focused runtime baseline for Smart Lookup Picker Custom Code controls on dashboard, approval form, and data-list custom form contexts.";
const FLOW_KEY = "SLPTEST";
const FRESH_ID_BASE = 6081000000000000000n;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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

function parseJson(value) {
  if (typeof value !== "string") return value;
  return JSON.parse(value);
}

function setJson(target, key, value) {
  target[key] = JSON.stringify(value);
}

function findFirst(root, predicate) {
  if (!root || typeof root !== "object") return null;
  if (predicate(root)) return root;
  for (const child of Object.values(root)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findFirst(item, predicate);
        if (found) return found;
      }
    } else if (isObject(child)) {
      const found = findFirst(child, predicate);
      if (found) return found;
    }
  }
  return null;
}

function codeinParams(listId, prefix, combinedTarget, selectedTarget, manualTarget, labelText) {
  return {
    dataListId: { type: 2, value: [{ type: "str", value: String(listId) }] },
    displayField: { type: 2, value: [{ type: "str", value: "Title" }] },
    valueField: { type: 2, value: [{ type: "str", value: "ListDataID" }] },
    saveToField: { type: 1, value: { prefix, value: combinedTarget } },
    selectedItemsField: { type: 1, value: { prefix, value: selectedTarget } },
    newItemsField: { type: 1, value: { prefix, value: manualTarget } },
    multiSelect: { type: 2, value: [{ type: "bool", value: true }] },
    allowManualEntry: { type: 2, value: [{ type: "bool", value: true }] },
    maxResults: "8",
    placeholderText: "Search sample record",
    labelText,
    noResultText: "No sample records found",
    manualTagText: "Manual",
    minSearchChars: "1",
    debounceMs: "260",
  };
}

function customCodeControl(script, params, title) {
  return {
    id: randomUUID(),
    type: "codein",
    label: "Custom code",
    attrs: {
      title,
      "codein-script": script,
      "codein-script-param": params,
    },
    children: [],
    nv_label: title,
  };
}

function heading(value, nvLabel) {
  return {
    id: randomUUID(),
    type: "heading",
    label: "Text",
    attrs: {
      headc: { title: { value, variable: null } },
      heads: { ty: [null, "s-regular"], color: "var(--c--neutral-dark-hover)" },
      common: { positioning: { widthtype: [null, "2"] } },
    },
    children: [],
    nv_label: nvLabel,
  };
}

function variableHeading(variableTokens, nvLabel) {
  return {
    id: randomUUID(),
    type: "heading",
    label: "Text",
    attrs: {
      headc: { title: { value: null, variable: variableTokens } },
      heads: { ty: [null, "s-regular"], color: "var(--c--text)" },
      common: { positioning: { widthtype: [null, "2"] } },
    },
    children: [],
    nv_label: nvLabel,
  };
}

function inputControl(binding, label, readonly = false) {
  return {
    id: randomUUID(),
    binding,
    type: "textarea",
    label,
    attrs: {
      edit: { fhlay: "auto", textarea_minrows: 2 },
      placeholder: label,
    },
    displayLabel: true,
    readonly,
    children: [],
    nv_label: `${label} output`,
  };
}

function variableExpr(id, name) {
  return { exprType: "variable", valueType: "string", id, type: "expr", name };
}

function updateNames(data, listId) {
  const root = data.Item.ListModel;
  root.Title = TITLE;
  root.Description = DESCRIPTION;
  root.IconUrl = "{\"b\":\"#E6F0FF\",\"i\":\"fa-solid fa-magnifying-glass\",\"c\":\"#0065FF\"}";

  const layoutView = parseJson(root.LayoutView);
  layoutView.sort.forEach((entry) => {
    if (entry.Type === 103) entry.Title = "Smart Lookup Dashboard";
    if (String(entry.ListID) === String(listId)) entry.Title = "Smart Lookup Test Records";
    if (entry.Type === 105) {
      entry.Title = "Smart Lookup Approval Test";
      entry.ListID = FLOW_KEY;
    }
  });
  root.LayoutView = JSON.stringify(layoutView);

  const dashboard = data.Item.Layouts[0];
  dashboard.Title = "Smart Lookup Dashboard";

  const list = data.Childs[0];
  list.ListModel.Title = "Smart Lookup Test Records";
  list.ListModel.Description = "Source and capture records for Smart Lookup Picker runtime testing.";
  list.ListModel.CustomType = `ListSite_${root.ListID}`;

  const form = data.Forms[0];
  form.Name = "Smart Lookup Approval Test";
  form.Key = FLOW_KEY;
  form.DefKey = FLOW_KEY;
  form.Description = "Approval form used to runtime-test Smart Lookup Picker writeback.";
  const def = parseJson(form.DefResource);
  def.defkey = FLOW_KEY;
  def.name = "Smart Lookup Approval Test";
  def.title = "Smart Lookup Approval Test";
  def.listInfo.Title = "Smart Lookup Test Records";
  form.DefResource = JSON.stringify(def);
}

function updateListFields(list) {
  const labels = {
    Title: ["Sample Record / Combined Output", "SampleRecordCombinedOutput"],
    Text1: ["Description", "Description"],
    Text2: ["Category", "Category"],
    Text3: ["Picker Combined JSON", "PickerCombinedJson"],
    Text6: ["Picker Selected Values", "PickerSelectedValues"],
    Text7: ["Picker Manual Values", "PickerManualValues"],
  };
  list.Defs.forEach((field) => {
    const label = labels[field.FieldName];
    if (!label) return;
    field.DisplayName = label[0];
    field.Title = label[0];
    field.InternalName = label[1];
    if (["Text3", "Text6", "Text7"].includes(field.FieldName)) {
      field.Type = "textarea";
      field.ControlType = "textarea";
      field.controlType = "textarea";
      field.Rules = field.Rules || {};
    }
  });

  list.ListDatas = {
    ...list.ListDatas,
    [String(BigInt(list.ListModel.ListID) + 10001n)]: {
      ListDataID: String(BigInt(list.ListModel.ListID) + 10001n),
      Title: "Acme Clinical Partner",
      Text1: "Seed lookup source record for dashboard, approval, and list-form picker tests.",
      Text2: "Partner",
      Text3: "",
      Text6: "",
      Text7: "",
      Bit1: "1",
      Decimal1: 1,
      Decimal2: 100,
      Decimal3: 100,
      Decimal4: 0.9,
      Datetime1: "2026-05-20 00:00:00",
      Datetime2: "2026-05-21 00:00:00",
      Datetime3: "2026-05-22 00:00:00",
      Text4: "",
      Text5: "Current User",
    },
    [String(BigInt(list.ListModel.ListID) + 10002n)]: {
      ListDataID: String(BigInt(list.ListModel.ListID) + 10002n),
      Title: "Beacon Research Vendor",
      Text1: "Second lookup source record used to prove search and selection.",
      Text2: "Vendor",
      Text3: "",
      Text6: "",
      Text7: "",
      Bit1: "1",
      Decimal1: 1,
      Decimal2: 150,
      Decimal3: 150,
      Decimal4: 0.8,
      Datetime1: "2026-05-21 00:00:00",
      Datetime2: "2026-05-21 00:00:00",
      Datetime3: "2026-05-22 00:00:00",
      Text4: "",
      Text5: "Current User",
    },
  };
}

function updateDashboard(data, script, listId) {
  const layout = data.Item.Layouts[0];
  const page = parseJson(layout.LayoutInResources[0].Resource);
  page.title = "Smart Lookup Dashboard";
  page.tempVars = [
    { idx: randomUUID(), id: "DashboardCombinedOutput" },
    { idx: randomUUID(), id: "DashboardSelectedValues" },
    { idx: randomUUID(), id: "DashboardManualValues" },
  ];
  const content = findFirst(page, (node) => node.nv_label === "Content");
  content.children.push(
    customCodeControl(script, codeinParams(listId, "__temp_", "DashboardCombinedOutput", "DashboardSelectedValues", "DashboardManualValues", "Dashboard Picker"), "Dashboard Smart Lookup Picker"),
    heading("Dashboard picker output:", "Dashboard picker output label"),
    variableHeading([
      variableExpr("__temp_DashboardCombinedOutput", "DashboardCombinedOutput"),
      { type: "op", op: "&" },
      variableExpr("__temp_DashboardSelectedValues", "DashboardSelectedValues"),
      { type: "op", op: "&" },
      variableExpr("__temp_DashboardManualValues", "DashboardManualValues"),
    ], "Dashboard picker output values")
  );
  setJson(layout.LayoutInResources[0], "Resource", page);
}

function updateListForm(data, script, listId) {
  const list = data.Childs[0];
  const layout = list.Layouts.find((item) => item.Type === 1 && item.Title === "Edit Item");
  const page = parseJson(layout.LayoutInResources[0].Resource);
  const content = findFirst(page, (node) => node.nv_label === "Content");
  content.children.splice(1, 0,
    customCodeControl(script, codeinParams(listId, "__list_", "Text3", "Text6", "Text7", "Data List Form Picker"), "Data List Form Smart Lookup Picker"),
    heading("List form outputs are written to Picker Combined JSON, Picker Selected Values, and Picker Manual Values.", "Data-list picker output note"),
    inputControl("Text3", "Picker Combined JSON"),
    inputControl("Text6", "Picker Selected Values"),
    inputControl("Text7", "Picker Manual Values")
  );
  setJson(layout.LayoutInResources[0], "Resource", page);
}

function updateApprovalForm(data, script, listId) {
  const form = data.Forms[0];
  const def = parseJson(form.DefResource);
  const basic = def.variables.basic;
  [
    ["PickerCombinedJson", "Picker Combined JSON"],
    ["PickerSelectedValues", "Picker Selected Values"],
    ["PickerManualValues", "Picker Manual Values"],
  ].forEach(([id, name]) => {
    if (!basic.some((item) => item.id === id)) {
      basic.push({ idx: randomUUID(), id, name, type: "text", editable: true });
    }
  });

  for (const [pageIndex, page] of def.pageurls.entries()) {
    const body = findFirst(page.formdef, (node) => node.nv_label === "Form body");
    const readonly = pageIndex > 0;
    body.children.splice(2, 0,
      customCodeControl(script, codeinParams(listId, "__variables_", "PickerCombinedJson", "PickerSelectedValues", "PickerManualValues", "Approval Form Picker"), pageIndex === 0 ? "Approval Submit Smart Lookup Picker" : "Approval Review Smart Lookup Picker"),
      heading("Approval picker outputs:", pageIndex === 0 ? "Approval submit output label" : "Approval review output label"),
      inputControl("PickerCombinedJson", "Picker Combined JSON", readonly),
      inputControl("PickerSelectedValues", "Picker Selected Values", readonly),
      inputControl("PickerManualValues", "Picker Manual Values", readonly)
    );
    page.title = pageIndex === 0 ? "Submit Smart Lookup Test" : "Review Smart Lookup Test";
    page.formdef.title = page.title;
  }

  const contentNode = def.childshapes.find((shape) => shape.stencil && shape.stencil.id === "ContentList");
  if (contentNode) {
    contentNode.properties.name = "Create Smart Lookup Test Record";
    contentNode.properties.listdatas = contentNode.properties.listdatas.map((mapping) => {
      const replacements = {
        Text3: ["PickerCombinedJson", "Picker Combined JSON"],
        Text6: ["PickerSelectedValues", "Picker Selected Values"],
        Text7: ["PickerManualValues", "Picker Manual Values"],
      };
      const replacement = replacements[mapping.Columns];
      if (!replacement) return mapping;
      const [id, name] = replacement;
      return {
        ...mapping,
        Data: `<input type="button" data="\${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${id}&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:${name}">`,
      };
    });
  }

  form.DefResource = JSON.stringify(def);
}

function collectLargeIds(value, ids = new Set()) {
  if (typeof value === "string" && /^-?\d{16,}$/.test(value)) ids.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectLargeIds(item, ids));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => {
    collectLargeIds(key, ids);
    collectLargeIds(child, ids);
  });
  return ids;
}

function loadSourcePackage() {
  const wrapper = JSON.parse(fs.readFileSync(SOURCE_YAP, "utf8"));
  if (!wrapper.Resource || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Source package Resource must start with ${GZIP_PREFIX}`);
  }
  const resource = JSON.parse(zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
  const data = JSON.parse(resource.Data);
  return { resource, data };
}

function main() {
  const { resource: sourceResource, data: sourceData } = loadSourcePackage();
  const script = fs.readFileSync(SMART_LOOKUP_SCRIPT, "utf8");

  const idMap = new Map();
  sourceResource.ReplaceIds.forEach((oldId, index) => {
    idMap.set(String(oldId), String(FRESH_ID_BASE + BigInt(index)));
  });

  const resource = deepRemap(clone(sourceResource), idMap);
  const data = deepRemap(clone(sourceData), idMap);
  resource.ReplaceIds = sourceResource.ReplaceIds.map((oldId) => idMap.get(String(oldId)));

  const listId = data.Childs[0].ListModel.ListID;
  updateNames(data, listId);
  updateListFields(data.Childs[0]);
  updateDashboard(data, script, listId);
  updateListForm(data, script, listId);
  updateApprovalForm(data, script, listId);

  resource.FormKeys = [FLOW_KEY];
  resource.ReportIds = [];
  resource.Data = JSON.stringify(data);
  data.OtherModules = {};

  const generatedSampleIds = [...collectLargeIds(data)].filter((id) => !resource.ReplaceIds.includes(id));
  generatedSampleIds.forEach((id) => resource.ReplaceIds.push(id));

  fs.writeFileSync(OUT_RESOURCE, `${JSON.stringify(resource, null, 2)}\n`);
  fs.writeFileSync(OUT_DATA, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(OUT_REPORT, `${JSON.stringify({
    status: "pass",
    title: TITLE,
    outputs: { resource: OUT_RESOURCE, data: OUT_DATA },
    source: SOURCE_YAP,
    listId,
    replaceIds: resource.ReplaceIds.length,
    contexts: ["dashboard", "approval-form", "data-list-form"],
    publicFormSupport: "not included",
  }, null, 2)}\n`);
}

main();
