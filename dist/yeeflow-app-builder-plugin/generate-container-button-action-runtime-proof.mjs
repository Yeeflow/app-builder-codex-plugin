import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const SOURCE_PACKAGE = process.env.YEEFLOW_SOURCE_PACKAGE || path.resolve("generated-dashboard-filter-controls-v5.yap");
const OUT_PACKAGE = "container-button-action-runtime-proof.layoutview-fixed.v1.yap";
const DOWNLOADS_COPY = process.env.YEEFLOW_DOWNLOADS_COPY || path.resolve(OUT_PACKAGE);
const OUT_RESOURCE = ".tmp/container-button-action-runtime-proof.layoutview-fixed.v1.resource.json";
const OUT_DATA = ".tmp/container-button-action-runtime-proof.layoutview-fixed.v1.app-def.json";
const OUT_REPORT = ".tmp/container-button-action-runtime-proof.layoutview-fixed.v1.generation-report.json";
const TITLE = "Container Button Action Runtime Proof";
const DESCRIPTION = "Focused generated package for representative Container/Button action navigation runtime proof.";
const FRESH_ID_BASE = 2060600000001000000n;

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
    throw new Error(`${inputPath} is not a gzip-prefixed .yap wrapper.`);
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

function fresh(suffix) {
  return String(FRESH_ID_BASE + BigInt(suffix));
}

function uuid(label) {
  return `cba-${label}-0000-4000-8000-${String(label).replace(/\D/g, "").padStart(12, "0").slice(-12)}`;
}

function collectReplaceIds(value, ids = new Set()) {
  if (typeof value === "string" && /^\d{16,}$/.test(value)) ids.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectReplaceIds(item, ids));
  else if (isObject(value)) Object.values(value).forEach((item) => collectReplaceIds(item, ids));
  return ids;
}

function firstDashboard(data) {
  const layout = data.Item.Layouts.find((item) => String(item.Type) === "103");
  if (!layout) throw new Error("Template package does not contain a Type 103 dashboard layout.");
  return layout;
}

function heading(id, text, size = 24, color = "#172554") {
  return {
    id,
    type: "heading",
    label: "Text",
    attrs: {
      headc: text,
      heads: { ty: [null, { size, wei: "600" }], color },
      common: { margin: [null, { top: 0, right: 0, bottom: "--sp--s075", left: 0 }] },
    },
  };
}

function paragraph(id, text) {
  return {
    id,
    type: "heading",
    label: "Text",
    attrs: {
      headc: text,
      heads: { ty: [null, { size: 14, wei: "400" }], color: "#475569" },
      common: { margin: [null, { top: 0, right: 0, bottom: "--sp--s050", left: 0 }] },
    },
  };
}

function actionButton(id, text, attrs, tone = "primary") {
  const palette = {
    primary: { bg: "#2563EB", color: "#ffffff" },
    neutral: { bg: "#F8FAFC", color: "#0F172A" },
    success: { bg: "#059669", color: "#ffffff" },
    warning: { bg: "#D97706", color: "#ffffff" },
  }[tone] || { bg: "#2563EB", color: "#ffffff" };
  return {
    id,
    type: "action_button",
    label: "Button",
    attrs: {
      ...attrs,
      text,
      heads: { ty: [null, { size: 14, wei: "600" }], color: palette.color },
      style: {
        bg: palette.bg,
        radius: [null, 6],
        padding: [null, { top: "--sp--s075", right: "--sp--s125", bottom: "--sp--s075", left: "--sp--s125" }],
        margin: [null, { top: 0, right: "--sp--s075", bottom: "--sp--s075", left: 0 }],
      },
    },
  };
}

function card(id, title, children, actionAttrs = null) {
  const attrs = {
    common: { nv_label: title },
    style: {
      bg: "#ffffff",
      radius: [null, 8],
      padding: [null, { top: "--sp--s150", right: "--sp--s150", bottom: "--sp--s150", left: "--sp--s150" }],
      border: { type: "1", color: "#E5E7EB", width: 1 },
    },
  };
  if (actionAttrs) Object.assign(attrs, actionAttrs);
  return {
    id,
    type: "container",
    label: "Container",
    attrs,
    children,
  };
}

function pageShell(title, subtitle, children) {
  return {
    title,
    ver: "1.0",
    attrs: {
      hideHeaderAll: true,
      background: "#F8FAFC",
      container: { padding: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }] },
    },
    filterVars: [],
    tempVars: [],
    exts: [],
    children: [{
      id: uuid(`${title}-main`),
      type: "container",
      label: "Container",
      nv_label: "Main",
      attrs: { common: { nv_label: "Main" }, style: { direction: [null, "column"], gap: [null, "--sp--s150"], padding: [null, { top: "--sp--s200", right: "--sp--s200", bottom: "--sp--s200", left: "--sp--s200" }] } },
      children: [{
        id: uuid(`${title}-content`),
        type: "container",
        label: "Container",
        nv_label: "Content",
        attrs: { common: { nv_label: "Content" }, style: { direction: [null, "column"], gap: [null, "--sp--s150"], width: [null, "100%"] } },
        children: [
          heading(uuid(`${title}-h`), title, 28),
          paragraph(uuid(`${title}-p`), subtitle),
          ...children,
        ],
      }],
    }],
  };
}

function formControl(field, index, readOnly = false) {
  const fieldName = String(field.FieldName || field.InternalName || `Field${index}`);
  const fieldType = String(field.Type || "input");
  return {
    id: uuid(`list-form-${fieldName}-${index}`),
    type: fieldType,
    label: field.DisplayName || field.Title || fieldName,
    binding: fieldName,
    fieldID: field.FieldID,
    isListControl: true,
    identifier: fieldName,
    InternalName: field.InternalName || fieldName,
    attrs: {
      ...(field.Rules ? parseJson(field.Rules, `Rules for ${fieldName}`) : {}),
      ...(readOnly ? { readonly: true, disabled: true } : {}),
    },
    children: [],
  };
}

function customFormResource(title, fields, readOnly = false) {
  return JSON.stringify({
    title,
    ver: "2.0",
    attrs: { container: { cw: "2" } },
    filterVars: [],
    tempVars: [],
    exts: [],
    children: [{
      id: uuid(`${title}-form-root`),
      type: "container",
      label: "Container",
      attrs: {
        container: { cw: "2" },
        common: { padding: { t: [null, "--sp--s0"], r: [null, "--sp--s0"], b: [null, "--sp--s0"], l: [null, "--sp--s0"] } },
      },
      children: [{
        id: uuid(`${title}-form-grid`),
        type: "flex_grid",
        label: "Grid",
        attrs: {
          ver: "2",
          columns: { 1: "1", 3: "2" },
          rows: { 1: "auto" },
          cgap: { 1: "16" },
          cgapU: "px",
        },
        children: fields.map((field, index) => formControl(field, index, readOnly)),
      }],
    }],
  });
}

function customFormLayout(layoutId, listId, title, fields, readOnly = false) {
  return {
    LayoutID: layoutId,
    Type: 1,
    Title: title,
    IsDefault: false,
    ListID: listId,
    LayoutView: null,
    LayoutInResources: [{ ID: layoutId, RefId: layoutId, Resource: customFormResource(title, fields, readOnly) }],
    Ext2: JSON.stringify({ src: true }),
    IsItemPerm: false,
    Created: new Date().toISOString(),
    Modified: new Date().toISOString(),
  };
}

function configureList(data) {
  const list = data.Childs?.[0];
  if (!list) throw new Error("Template package does not contain a child data list.");
  list.ListModel.Title = "Action Runtime Requests";
  list.ListModel.Description = "Synthetic safe list target for Container/Button Add list item action testing.";
  list.ListModel.Flags = 1;
  list.ListModel.Status = 1;
  list.ListModel.ListType = 1;
  const addLayoutId = fresh(601);
  const editLayoutId = fresh(602);
  const viewLayoutId = fresh(603);
  const fields = list.Defs || [];
  const existingViews = (list.Layouts || []).filter((layout) => Number(layout.Type) !== 1);
  list.Layouts = [
    ...existingViews,
    customFormLayout(addLayoutId, list.ListModel.ListID, "New Item", fields, false),
    customFormLayout(editLayoutId, list.ListModel.ListID, "Edit Item", fields, false),
    customFormLayout(viewLayoutId, list.ListModel.ListID, "View Item", fields, true),
  ];
  list.ListModel.LayoutView = JSON.stringify({
    add: addLayoutId,
    edit: editLayoutId,
    view: viewLayoutId,
    opentype: { add: "modal" },
    modalsize: { add: 1 },
  });
  for (const field of list.Defs || []) {
    if (typeof field.InternalName === "string") {
      field.InternalName = field.InternalName.replace(/[^A-Za-z0-9_]/g, "_");
    }
  }
  const allView = list.Layouts.find((layout) => Number(layout.Type) === 0);
  if (allView) allView.Title = "All Action Requests";
  return list;
}

function makeActionRefs(data, list, mainLayout, targetLayout, approvalForm) {
  const listSetId = String(data.Item.ListModel.ListID);
  const listId = String(list.ListModel.ListID);
  const addLayout = list.Layouts.find((layout) => layout.Title === "Edit Item")?.LayoutID || list.Layouts[1]?.LayoutID;
  return {
    link: {
      "action-type": "2",
      link: { opentype: true, url: "about:blank", variable: [] },
    },
    addModal: {
      "action-type": "5",
      op: "modal",
      modalsize: 1,
      data: { list: { AppID: 41, ListSetID: listSetId, ListID: listId } },
      layout: addLayout,
      passvalues: [{ Name: "Text1", Value: [{ type: "const", value: "Runtime navigation proof" }] }],
    },
    addSlide: {
      "action-type": "5",
      op: "slide",
      modalsize: 2,
      data: { list: { AppID: 41, ListSetID: listSetId, ListID: listId } },
      layout: addLayout,
    },
    openDashboard: {
      "action-type": "6",
      op: "target",
      modalsize: 9,
      cusize: { w: 80, wu: "vw" },
      data: {
        list: { AppID: 41, ListSetID: listSetId, ListID: listSetId },
        page: { AppID: 41, ListSetID: listSetId, PageID: String(targetLayout.LayoutID) },
      },
      layout: String(targetLayout.LayoutID),
    },
    openDashboardModal: {
      "action-type": "6",
      op: "modal",
      modalsize: 1,
      data: {
        list: { AppID: 41, ListSetID: listSetId, ListID: listSetId },
        page: { AppID: 41, ListSetID: listSetId, PageID: String(targetLayout.LayoutID) },
      },
      layout: String(targetLayout.LayoutID),
    },
    openApproval: {
      "action-type": "8",
      op: "slide",
      modalsize: 2,
      data: {
        list: { AppID: 41, ListSetID: listSetId, ListID: listSetId },
        page: { AppID: 41, ListSetID: listSetId, PageID: String(mainLayout.LayoutID) },
        form: { AppID: 41, ListSetID: listSetId, ProcKey: approvalForm.Key },
      },
      layout: String(mainLayout.LayoutID),
    },
  };
}

function configureDashboards(data, list, approvalForm) {
  const sourceLayout = firstDashboard(data);
  const mainLayout = sourceLayout;
  const targetLayout = clone(sourceLayout);
  targetLayout.LayoutID = fresh(501);
  targetLayout.Title = "Action Target Dashboard";
  targetLayout.LayoutInResources = [{ ID: targetLayout.LayoutID, RefId: targetLayout.LayoutID, Resource: "" }];
  data.Item.Layouts.push(targetLayout);

  mainLayout.Title = "Action Runtime Dashboard";
  mainLayout.LayoutInResources = [{ ID: mainLayout.LayoutID, RefId: mainLayout.LayoutID, Resource: "" }];

  const actions = makeActionRefs(data, list, mainLayout, targetLayout, approvalForm);
  const mainPage = pageShell("Action Runtime Dashboard", "Representative Container/Button action navigation proof using safe generated targets.", [
    card(uuid("card-link"), "Safe link action", [
      paragraph(uuid("card-link-p"), "Renders a harmless link action without private URL data."),
      actionButton(uuid("btn-link"), "Open Safe Link", actions.link, "neutral"),
    ], actions.link),
    card(uuid("card-add"), "Add list item actions", [
      paragraph(uuid("card-add-p"), "Targets the included Action Runtime Requests data list and its New/Edit item form."),
      actionButton(uuid("btn-add-modal"), "Add Request Modal", actions.addModal, "primary"),
      actionButton(uuid("btn-add-slide"), "Add Request Slide", actions.addSlide, "success"),
    ]),
    card(uuid("card-dashboard"), "Open dashboard actions", [
      paragraph(uuid("card-dashboard-p"), "Targets Action Target Dashboard with a concrete PageID."),
      actionButton(uuid("btn-dash-target"), "Open Target Full Page", actions.openDashboard, "primary"),
      actionButton(uuid("btn-dash-modal"), "Open Target Modal", actions.openDashboardModal, "neutral"),
    ]),
    card(uuid("card-approval"), "Open approval form action", [
      paragraph(uuid("card-approval-p"), "Opens the included Action Runtime Approval form without submitting it."),
      actionButton(uuid("btn-approval-slide"), "Open Approval Slide", actions.openApproval, "warning"),
    ], actions.openApproval),
  ]);
  mainLayout.LayoutInResources[0].Resource = JSON.stringify(mainPage);

  const targetPage = pageShell("Action Target Dashboard", "If this dashboard is visible, the Open dashboard action resolved a valid target PageID.", [
    card(uuid("target-card"), "Target dashboard reached", [
      paragraph(uuid("target-p"), "This page is intentionally simple so the runtime proof can focus on navigation, not analytics or data mutation."),
    ]),
  ]);
  targetLayout.LayoutInResources[0].Resource = JSON.stringify(targetPage);

  data.Item.ListModel.LayoutView = JSON.stringify({
    sortVer: 1,
    sort: [
      { AppID: 41, ListID: mainLayout.LayoutID, ListSetID: data.Item.ListModel.ListID, Type: 103, IsHidden: false, Title: "Action Runtime Dashboard" },
      { AppID: 41, ListID: targetLayout.LayoutID, ListSetID: data.Item.ListModel.ListID, Type: 103, IsHidden: false, Title: "Action Target Dashboard" },
      { AppID: 41, ListID: approvalForm.Key, ListSetID: data.Item.ListModel.ListID, Type: 105, IsHidden: false, Title: "Action Runtime Approval", Icon: "fa-regular fa-paper-plane" },
      { AppID: 41, ListID: list.ListModel.ListID, ListSetID: data.Item.ListModel.ListID, Type: 1, Title: list.ListModel.Title },
    ],
  });
  return { mainLayout, targetLayout };
}

function approvalPage(pageId) {
  return {
    id: pageId,
    type: 1,
    pagetype: 1,
    title: "Action Runtime Approval",
    name: "Action Runtime Approval",
    formdef: {
      id: pageId,
      name: "Action Runtime Approval",
      title: "Action Runtime Approval",
      pagetype: 1,
      ver: "1.0",
      attrs: {
        container: { cw: "2", padding: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }] },
        background: { type: "classic", classic: { color: "var(--c--neutral-light)" } },
      },
      filterVars: [],
      tempVars: [],
      children: [{
        id: uuid("approval-main"),
        type: "container",
        label: "Container",
        nv_label: "Main",
        attrs: { common: { nv_label: "Main" }, style: { direction: [null, "column"], gap: [null, "--sp--s150"], padding: [null, { top: "--sp--s200", right: "--sp--s200", bottom: "--sp--s200", left: "--sp--s200" }] } },
        children: [{
          id: uuid("approval-content"),
          type: "container",
          label: "Container",
          nv_label: "Content",
          attrs: { common: { nv_label: "Content" }, style: { direction: [null, "column"], gap: [null, "--sp--s100"], width: [null, "100%"] } },
          children: [
            heading(uuid("approval-heading"), "Action Runtime Approval", 24),
            paragraph(uuid("approval-copy"), "Runtime proof opens this approval form only. Submission and workflow execution are intentionally out of scope."),
          ],
        }],
      }],
    },
  };
}

function makeApprovalForm(data) {
  const formKey = "CBAR";
  const pageId = fresh(701);
  const startId = fresh(711);
  const endId = fresh(712);
  const flowId = fresh(713);
  const def = {
    defkey: formKey,
    workflowType: "2",
    deployed: true,
    status: 1,
    published: true,
    pageurls: [approvalPage(pageId)],
    flowPage: [],
    variables: { basic: [], listref: [], filter: [] },
    graphposition: { x: 0, y: 0 },
    graphzoom: 1,
    graphver: "1.0",
    childshapes: [
      {
        id: startId,
        resourceid: startId,
        stencil: { id: "StartNoneEvent" },
        outgoing: [{ resourceid: flowId }],
        incoming: [],
        position: { x: 80, y: 120 },
        properties: { name: "Start", taskurl: pageId, taskUrl: pageId, TaskUrl: pageId },
      },
      {
        id: flowId,
        resourceid: flowId,
        stencil: { id: "SequenceFlow" },
        source: { id: startId, resourceid: startId },
        target: { id: endId, resourceid: endId },
        outgoing: [{ resourceid: endId }],
        incoming: [{ resourceid: startId }],
        properties: { name: "Start to End", conditioninfo: [] },
      },
      {
        id: endId,
        resourceid: endId,
        stencil: { id: "EndNoneEvent" },
        outgoing: [],
        incoming: [{ resourceid: flowId }],
        position: { x: 360, y: 120 },
        properties: { name: "End" },
      },
    ],
  };
  const form = {
    Name: "Action Runtime Approval",
    Key: formKey,
    DefKey: formKey,
    FlowKey: formKey,
    IsItemPerm: true,
    AppID: 41,
    ListID: 0,
    ProcModelID: fresh(700),
    Description: "Synthetic approval form target for Container/Button Open approval form runtime proof.",
    Ext: null,
    ImgResource: null,
    Deployed: true,
    Status: 1,
    NoRule: { Prefix: "CBAR-{index}", StartIndex: 1, CustomLength: 4, AutoIncrement: 1 },
    WorkflowType: "2",
    Settings: null,
    DefResource: JSON.stringify(def),
    TenantID: data.Item.ListModel.TenantID,
    ListSetID: data.Item.ListModel.ListID,
    AppListSetID: data.Item.ListModel.ListID,
    ProcModelListSetID: data.Item.ListModel.ListID,
    CreatedBy: data.Item.ListModel.CreatedBy,
    ModifiedBy: data.Item.ListModel.ModifiedBy,
  };
  data.Forms = [form];
  return form;
}

function ensureApp(data) {
  data.Item.ListModel.Title = TITLE;
  data.Item.ListModel.Description = DESCRIPTION;
  data.Item.ListModel.Modified = new Date().toISOString();
  data.Item.ListModel.Flags = 1;
  data.Item.ListModel.ListType = 1;
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
  resource.FormKeys = ["CBAR"];
  resource.ReportIds = [];

  ensureApp(data);
  const list = configureList(data);
  const approvalForm = makeApprovalForm(data);
  const dashboards = configureDashboards(data, list, approvalForm);

  const preservedMetadata = new Set([
    String(data.Item.ListModel.TenantID || ""),
    String(data.Item.ListModel.CreatedBy || ""),
    String(data.Item.ListModel.ModifiedBy || ""),
  ].filter(Boolean));
  collectReplaceIds(data).forEach((id) => {
    if (!preservedMetadata.has(id)) resource.ReplaceIds.push(id);
  });
  resource.ReplaceIds = resource.ReplaceIds.filter((id) => !preservedMetadata.has(String(id)));
  resource.ReplaceIds = [...new Set(resource.ReplaceIds)];
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
    dashboards: [dashboards.mainLayout.Title, dashboards.targetLayout.Title],
    dataList: list.ListModel.Title,
    approvalForm: approvalForm.Name,
    actions: ["Link", "Add list item modal", "Add list item slide", "Open dashboard target", "Open dashboard modal", "Open approval form slide"],
    proofBoundary: "Generated package for representative action navigation only; no save, submit, workflow, cross-app, or form-action binding proof.",
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    status: "pass",
    package: OUT_PACKAGE,
    downloadsCopy: DOWNLOADS_COPY,
    dashboards: 2,
    actionTargets: 4,
  }, null, 2));
}

main();
