import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";

const GZIP_PREFIX = "[______gizp______]";
const SOURCE_RESOURCE = "custom-code-smart-lookup-picker-test.resource.json";
const OUT_PACKAGE = ".tmp/collection-kanban-actions-runtime-proof.v2.yap";
const OUT_RESOURCE = ".tmp/collection-kanban-actions-runtime-proof.v2.resource.json";
const OUT_DATA = ".tmp/collection-kanban-actions-runtime-proof.v2.app-def.json";
const OUT_REPORT = ".tmp/collection-kanban-actions-runtime-proof.v2.generation-report.json";
const DOWNLOADS_COPY = "/Users/Renger/Downloads/collection-kanban-actions-runtime-proof.v2.yap";

const APP_TITLE = "Collection Kanban Actions Runtime Proof";
const APP_DESCRIPTION = "Focused safe package for runtime testing Collection/Kanban item actions, selection, and bulk operations.";
const DASHBOARD_TITLE = "Collection Actions Runtime Dashboard";
const LIST_TITLE = "Action Runtime Items";
const GENERATED_AT = "2026-05-28 12:00:00";
const APP_ID = 42;
const FAMILY = 7472000000000000000n;
const ROOT_ID = String(FAMILY);
const DASHBOARD_ID = String(FAMILY + 1n);
const LIST_ID = String(FAMILY + 1000n);
const TITLE_FIELD_ID = String(FAMILY + 1001n);
const VIEW_LAYOUT_ID = String(FAMILY + 1100n);
const EDIT_LAYOUT_ID = String(FAMILY + 1101n);
const NEW_LAYOUT_ID = String(FAMILY + 1102n);

let idOffset = 2000n;

function nextId() {
  idOffset += 1n;
  return String(FAMILY + idOffset);
}

function uuid() {
  return crypto.randomUUID();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeInternalName(value) {
  const cleaned = String(value || "").replace(/[^A-Za-z0-9_]/g, "");
  return cleaned || `Field_${uuid().replace(/-/g, "").slice(0, 8)}`;
}

function control(type, label, attrs = {}, children = [], extra = {}) {
  return { id: uuid(), type, label, attrs, children, ...extra };
}

function listRef() {
  return { AppID: APP_ID, ListID: LIST_ID, Type: 1, Title: LIST_TITLE, ListSetID: ROOT_ID };
}

function variable(name, valueType = "string") {
  return { exprType: "variable", valueType, id: `__temp_${name}`, type: "expr", name };
}

function currentItem(fieldName, name, valueType = "input") {
  return { exprType: "variable_ctx", valueType, id: fieldName, ctx: "__ctx_coll", type: "expr", name };
}

function str(value) {
  return { type: "str", value };
}

function num(value) {
  return { type: "num", value: String(value) };
}

function bool(value) {
  return { type: "bool", value };
}

function op(value) {
  return { type: "op", op: value };
}

function func(name, params) {
  return { type: "func", func: name, params };
}

function heading(value, style = "h4-bold", color = "var(--c--text)", extra = {}) {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, style], color },
  }, [], extra);
}

function dynamicField(fieldName, extraAttrs = {}, extra = {}) {
  return control("dynamic-field", "Dynamic field", {
    source: "3",
    "obj-f": fieldName,
    common: { positioning: { widthtype: [null, "2"] } },
    ...extraAttrs,
  }, [], extra);
}

function formField(fieldName, extra = {}) {
  return control("dynamic-field", "Dynamic field", {
    source: "4",
    "obj-f": fieldName,
    common: { positioning: { widthtype: [null, "2"] } },
  }, [], extra);
}

function textExpr(tokens, extra = {}) {
  return control("heading", "Text", {
    headc: { title: { value: null, variable: tokens } },
    heads: { ty: [null, "base-medium"], color: "var(--c--text)" },
  }, [], extra);
}

function pageVarText(prefix, varName, suffix, extra = {}) {
  return textExpr([str(prefix), op("&"), variable(varName), op("&"), str(suffix)], extra);
}

function actionButton(label, actionId, style = "primary", extraAttrs = {}, extra = {}) {
  const danger = style === "danger";
  return control("action_button", label, {
    common: { positioning: { widthtype: [null, "2"] } },
    label: { variable: null },
    "button-style": danger ? "4" : style === "subtle" ? "3" : "2",
    button: danger ? {
      normal: {
        border: {
          type: "1",
          width: [null, { top: "--sp--s012", right: "--sp--s012", bottom: "--sp--s012", left: "--sp--s012" }],
          color: "var(--c--danger)",
        },
        c: "var(--c--danger)",
      },
      hover: { bg: "var(--c--danger-light)" },
    } : undefined,
    control_action: actionId,
    ...extraAttrs,
  }, [], extra);
}

function showRule(controlId, formulas) {
  return {
    id: uuid(),
    controlId,
    formulas,
    actions: {
      id: uuid(),
      type: 1,
      attrs: {
        style_regulation_action: "style_regulation_action_show",
        style_regulation_action_color: null,
        action_style: null,
        icon_type: null,
      },
    },
  };
}

function selectedExpr(compareOp) {
  return [
    func("strIndex", [[variable("var_SelectedItems")], [currentItem("ListDataID", "Collection item:Id")], []]),
    op(compareOp),
    num(0),
  ];
}

function selectionToggle(actionId) {
  const uncheckedId = uuid();
  const checkedId = uuid();
  return control("container", "Container", {
    style: { widthtype: [null, "2"], direction: [null, "row"], gap: [null, "--sp--s025"] },
    common: {
      ty: { normal: { color: "var(--c--neutral)" }, hover: { color: "var(--c--neutral-dark)" } },
      pos: [null, "absolute"],
      hor: [null, "right"],
      horoffset: [null, 12],
      veroffset: [null, 12],
      background: { normal: { type: "classic", classic: { color: "rgba(255, 255, 255, 0.76)" } } },
      border: { normal: { radius: [null, { top: "--sp--s100", right: "--sp--s100", bottom: "--sp--s100", left: "--sp--s100" }] } },
    },
    control_action: actionId,
  }, [
    {
      id: uncheckedId,
      type: "icon",
      label: "Icon",
      attrs: {
        icon: { icon: "fa-regular fa-square", size: [null, "--sp--s250"], normal: {}, hover: { pcolor: "var(--c--neutral-dark-hover)" } },
        common: { positioning: { widthtype: [null, "2"] } },
        control_display: [showRule(uncheckedId, selectedExpr("<"))],
      },
      children: [],
    },
    {
      id: checkedId,
      type: "icon",
      label: "Icon",
      attrs: {
        icon: { icon: "fa-regular fa-square-check", size: [null, "--sp--s250"], normal: { pcolor: "var(--c--primary)" } },
        common: { positioning: { widthtype: [null, "2"] } },
        control_display: [showRule(checkedId, selectedExpr(">="))],
      },
      children: [],
    },
  ], { nv_label: "Selection toggle" });
}

function makeField(template, spec, fieldId = nextId()) {
  return {
    ...template,
    FieldID: fieldId,
    ListID: LIST_ID,
    FieldName: spec.fieldName,
    FieldType: spec.fieldType,
    FieldIndex: spec.fieldIndex,
    DisplayName: spec.displayName,
    InternalName: sanitizeInternalName(spec.internalName || spec.displayName),
    DisplayName_EN: null,
    Type: spec.type,
    Status: spec.status ?? (spec.fieldName === "Title" ? 0 : 1),
    Category: 0,
    DefaultValue: spec.defaultValue ?? null,
    Rules: JSON.stringify(spec.rules || {}),
    AppID: APP_ID,
    IsSort: spec.isSort ?? spec.fieldName === "Title",
    IsIndex: spec.isIndex ?? spec.fieldName === "Title",
    IsFilter: spec.isFilter ?? false,
    IsIndexCreated: false,
    IsSystem: spec.isSystem ?? spec.fieldName === "Title",
    IsUnique: false,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    Ext1: null,
    Ext2: null,
    Ext3: null,
    Title: spec.displayName,
  };
}

function customFormResource(title) {
  return JSON.stringify({
    children: [
      control("container", "Container", {
        style: { gap: [null, "--sp--s250"], direction: [null, "column"] },
        common: { padding: [null, { top: "--sp--s500", right: "--sp--s500", bottom: "--sp--s500", left: "--sp--s500" }] },
      }, [
        heading(title, "h4-bold"),
        formField("Title", { nv_label: "Item title" }),
        formField("Text1", { nv_label: "Status" }),
        formField("Text2", { nv_label: "Owner" }),
        formField("Text3", { nv_label: "Priority" }),
        formField("Datetime1", { nv_label: "Due date" }),
        formField("Decimal1", { nv_label: "Progress" }),
        formField("Text4", { nv_label: "Description" }),
      ], { nv_label: "Main" }),
    ],
    attrs: { container: { cw: "2" } },
    title,
    filterVars: [],
    tempVars: [],
    ver: 2,
  });
}

function makeFormLayout(title, layoutId) {
  return {
    LayoutID: layoutId,
    Type: 1,
    Title: title,
    ListID: LIST_ID,
    LayoutView: null,
    Ext2: null,
    IsItemPerm: false,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    LayoutInResources: [{ ID: layoutId, RefId: layoutId, Resource: customFormResource(title) }],
  };
}

function makeListView(fields) {
  const visibleFields = fields.filter((field) => field.Type !== "textarea");
  return {
    LayoutID: nextId(),
    Type: 0,
    Title: "All Items",
    IsDefault: true,
    ListID: LIST_ID,
    LayoutView: JSON.stringify({
      layout: visibleFields.map((field, index) => ({
        FieldID: field.FieldID,
        FieldName: field.FieldName,
        Mobile: index === 0 ? 2 : 0,
        Order: index,
        Show: true,
        Type: field.Type,
        DisplayName: field.DisplayName,
      })),
      filter: [],
      query: [],
      sort: [{ SortName: "Datetime1", SortByDesc: false }],
      rowColor: [],
    }),
    Ext1: JSON.stringify({ Url: "all-items" }),
    Ext2: null,
    IsItemPerm: false,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    LayoutInResources: [],
  };
}

function makeRows() {
  const specs = [
    ["Client Intake Review", "New", "Avery", "High", "2026-06-03", 0.15, "Review intake checklist and confirm next owner."],
    ["Operations Readiness", "In Progress", "Morgan", "Medium", "2026-06-08", 0.45, "Prepare launch readiness actions."],
    ["Billing Follow-up", "New", "Taylor", "Low", "2026-06-11", 0.1, "Confirm billing details with safe synthetic data."],
    ["Support Queue Audit", "In Progress", "Jordan", "High", "2026-06-14", 0.6, "Audit current support queue and mark completion."],
    ["Knowledge Update", "Completed", "Casey", "Medium", "2026-06-18", 1, "Already completed baseline row."],
  ];
  const rows = {};
  specs.forEach(([title, status, owner, priority, due, progress, desc], index) => {
    const rowId = String(FAMILY + 9000n + BigInt(index + 1));
    rows[rowId] = {
      ListDataID: rowId,
      Title: title,
      Text1: status,
      Text2: owner,
      Text3: priority,
      Datetime1: due,
      Decimal1: progress,
      Text4: desc,
      Created: GENERATED_AT,
      Modified: GENERATED_AT,
    };
  });
  return rows;
}

function makeRuntimeList(baseList, baseField) {
  const specs = [
    { fieldName: "Title", fieldType: "Text", fieldIndex: 0, displayName: "Name", internalName: "Name", type: "input", isSystem: true, isIndex: true, isSort: true, isFilter: true, rules: { required: true } },
    { fieldName: "Text1", fieldType: "Text", fieldIndex: 1, displayName: "Status", internalName: "Status", type: "radio", isFilter: true, rules: { choices: ["New", "In Progress", "Completed"], color_choices: [{ value: "New", color: "#64748b" }, { value: "In Progress", color: "#2563eb" }, { value: "Completed", color: "#16a34a" }] } },
    { fieldName: "Text2", fieldType: "Text", fieldIndex: 2, displayName: "Owner", internalName: "Owner", type: "input", isFilter: true },
    { fieldName: "Text3", fieldType: "Text", fieldIndex: 3, displayName: "Priority", internalName: "Priority", type: "radio", isFilter: true, rules: { choices: ["Low", "Medium", "High"], color_choices: [{ value: "Low", color: "#64748b" }, { value: "Medium", color: "#2563eb" }, { value: "High", color: "#dc2626" }] } },
    { fieldName: "Datetime1", fieldType: "Datetime", fieldIndex: 1, displayName: "Due date", internalName: "DueDate", type: "datepicker", isFilter: true, rules: { showtime: false } },
    { fieldName: "Decimal1", fieldType: "Decimal", fieldIndex: 1, displayName: "Progress", internalName: "Progress", type: "percent", rules: { "rounded-to": 0, decimalPlaces: 0, number_min: 0, number_max: 1 } },
    { fieldName: "Text4", fieldType: "Text", fieldIndex: 4, displayName: "Description", internalName: "Description", type: "textarea" },
  ];
  const fields = specs.map((spec) => makeField(baseField, spec, spec.fieldName === "Title" ? TITLE_FIELD_ID : undefined));
  const list = clone(baseList);
  list.ListModel = {
    ...list.ListModel,
    AppID: APP_ID,
    ListID: LIST_ID,
    Title: LIST_TITLE,
    Description: "Safe synthetic source list for Collection/Kanban action runtime proof.",
    IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-list-check\",\"c\":\"#0065FF\"}",
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    Perm: 4,
    Type: 1,
    Flags: 1,
    CustomType: `ListSite_${ROOT_ID}`,
    LayoutView: JSON.stringify({
      add: EDIT_LAYOUT_ID,
      edit: EDIT_LAYOUT_ID,
      view: VIEW_LAYOUT_ID,
      opentype: { add: "modal", edit: "modal", view: "slide" },
      modalsize: { add: 0, edit: 0, view: 0 },
    }),
    IsBreakInherit: false,
    IsDataSeparate: false,
    AdvanceList: [],
    ListType: 1,
  };
  list.Defs = fields;
  list.Layouts = [makeListView(fields), makeFormLayout("View Item", VIEW_LAYOUT_ID), makeFormLayout("Edit Item", EDIT_LAYOUT_ID), makeFormLayout("New Item", NEW_LAYOUT_ID)];
  list.PublicForms = [];
  list.RemindRules = [];
  list.FlowMappings = [];
  list.LayoutInResources = [];
  list.ListDatas = makeRows();
  return list;
}

function stepEditItem() {
  return {
    type: "listitem",
    attrs: {
      data: { list: { AppID: APP_ID, ListSetID: ROOT_ID, ListID: LIST_ID } },
      op_type: "edit",
      listdataid: [currentItem("ListDataID", "Collection item:Id")],
      layout: EDIT_LAYOUT_ID,
      op: "modal",
      modalsize: 0,
    },
  };
}

function setDataWhereCurrent() {
  return [{
    key: uuid(),
    pre: "and",
    left: "ListDataID",
    op: "0",
    right: [currentItem("ListDataID", "Collection item:Id")],
    showCus: false,
  }];
}

function stepUpdateCompleted(where) {
  return {
    type: "setdatalist",
    attrs: {
      list: { AppID: APP_ID, ListSetID: ROOT_ID, ListID: LIST_ID },
      listtype: "select",
      type: "edit",
      wheres: where,
      listdatas: [
        { Per: "0", Columns: "Text1", Data: [str("Completed")] },
        { Per: "0", Columns: "Decimal1", Data: [num(1)] },
      ],
    },
  };
}

function stepResetSelection() {
  return {
    type: "setvar",
    attrs: {
      setvar_multi: true,
      setvar_array: [
        { var: variable("var_SelectedItems"), value: [str("")] },
        { var: variable("var_SelectedItemsAmount"), value: [num(0)] },
      ],
    },
  };
}

function selectedIdsArrayExpr() {
  return [func("split", [[func("replace", [[variable("var_SelectedItems")], [str(",")], [str("")], "2"])], [str(",")]])];
}

function stepOtherAction(actionId, name = "Reset selected items") {
  return { type: "otheraction", attrs: { control_action: actionId }, name };
}

function collectionActions(actionIds) {
  return [
    {
      id: actionIds.select,
      name: "Select Items",
      type: "coll",
      steps: [
        {
          type: "setvar",
          attrs: {
            setvar_var: variable("var_SelectedItems"),
            setvar_val: [func("iif", [
              [func("strIndex", [[variable("var_SelectedItems")], [currentItem("ListDataID", "Collection item:Id")], []]), op(">="), num(0)],
              [func("replace", [[variable("var_SelectedItems")], [currentItem("ListDataID", "Collection item:Id"), op("&"), str(",")], [str("")], "1"])],
              [variable("var_SelectedItems"), op("&"), currentItem("ListDataID", "Collection item:Id"), op("&"), str(",")],
            ])],
          },
        },
        {
          type: "setvar",
          attrs: {
            setvar_var: variable("var_SelectedItemsAmount"),
            setvar_val: [func("iif", [
              [func("isNullOrEmpty", [[variable("var_SelectedItems")]])],
              [num(0)],
              [func("arrayCount", [[func("split", [[variable("var_SelectedItems")], [str(",")]])], [], [], []])],
            ])],
          },
        },
      ],
    },
    { id: actionIds.edit, name: "Edit item", type: "coll", steps: [stepEditItem()] },
    {
      id: actionIds.delete,
      name: "Delete item",
      type: "coll",
      steps: [
        { type: "confirm", attrs: { confirm_qs: [str("Delete this current item?")], confirm_rs: variable("var_isDeleteConfirmed") } },
        {
          type: "setdatalist",
          condition: [variable("var_isDeleteConfirmed"), op("=="), bool(true)],
          attrs: { list: { AppID: APP_ID, ListSetID: ROOT_ID, ListID: LIST_ID }, listtype: "select", type: "remove", wheres: setDataWhereCurrent() },
        },
        stepOtherAction(actionIds.reset),
      ],
    },
    { id: actionIds.complete, name: "Mark current item as Completed", type: "coll", steps: [stepUpdateCompleted(setDataWhereCurrent()), stepOtherAction(actionIds.reset)] },
  ];
}

function kanbanActions(actionIds) {
  return [
    { id: actionIds.kanbanEdit, name: "Edit item", type: "coll", steps: [stepEditItem()] },
    { id: actionIds.kanbanDelete, name: "Delete item", type: "coll", steps: [{ type: "deleteitem", attrs: { showdlg: true } }] },
    { id: actionIds.kanbanComplete, name: "Mark current item as Completed", type: "coll", steps: [stepUpdateCompleted(setDataWhereCurrent())] },
  ];
}

function pageActions(actionIds) {
  return [
    {
      id: actionIds.bulkComplete,
      name: "Mark selected as completed",
      type: "page",
      steps: [
        { ...stepUpdateCompleted([{ key: uuid(), pre: "and", left: "ListDataID", op: "9", right: selectedIdsArrayExpr(), showCus: false }]), attrs: { ...stepUpdateCompleted([]).attrs, wheres: [{ key: uuid(), pre: "and", left: "ListDataID", op: "9", right: selectedIdsArrayExpr(), showCus: false }], totalcount: "var_UpdatedItemsAmount", totalparent: "__temp_" } },
        stepResetSelection(),
        { type: "confirm", attrs: { confirm_qs: [str("Completed "), op("&"), variable("var_UpdatedItemsAmount"), op("&"), str(" selected item(s).")] } },
      ],
    },
    {
      id: actionIds.bulkDelete,
      name: "Delete selected items",
      type: "page",
      steps: [
        { type: "confirm", attrs: { confirm_qs: [str("Delete selected items?")], confirm_rs: variable("var_isDeleteMultipleConfirmed") } },
        {
          type: "setdatalist",
          condition: [variable("var_isDeleteMultipleConfirmed"), op("=="), bool(true)],
          attrs: {
            list: { AppID: APP_ID, ListSetID: ROOT_ID, ListID: LIST_ID },
            listtype: "select",
            type: "remove",
            wheres: [{ key: uuid(), pre: "and", left: "ListDataID", op: "9", right: selectedIdsArrayExpr(), showCus: false }],
            totalcount: "var_DeletedItemsAmount",
            totalparent: "__temp_",
          },
        },
        stepResetSelection(),
        { type: "confirm", attrs: { confirm_qs: [str("Deleted "), op("&"), variable("var_DeletedItemsAmount"), op("&"), str(" selected item(s).")] } },
      ],
    },
    {
      id: actionIds.reset,
      name: "Set default values",
      type: "page",
      steps: [{
        type: "setvar",
        attrs: {
          setvar_multi: true,
          setvar_array: [
            { var: variable("var_SelectedItems"), value: [str("")] },
            { var: variable("var_SelectedItemsAmount"), value: [num(0)] },
            { var: variable("var_UpdatedItemsAmount"), value: [num(0)] },
            { var: variable("var_DeletedItemsAmount"), value: [num(0)] },
          ],
        },
      }],
    },
  ];
}

function statusDisplayRule(controlId) {
  return showRule(controlId, [currentItem("Text1", "Collection item:Status", "radio"), op("!="), str("Completed")]);
}

function itemCard(actionIds, includeSelection = false) {
  const completeButtonId = uuid();
  const children = [];
  if (includeSelection) children.push(selectionToggle(actionIds.select));
  children.push(
    dynamicField("Title", { item_style: { ty: [null, "base-medium"] } }, { nv_label: "Item name" }),
    control("container", "Container", { style: { direction: [null, "row"], gap: [null, "--sp--s150"], align_items: [null, "center"], justify_content: [null, "space-between"] } }, [
      dynamicField("Text1", { prefix: "Status:", item_style: { ty: [null, "s-medium"] } }, { nv_label: "Status" }),
      dynamicField("Text3", { prefix: "Priority:", item_style: { ty: [null, "s-regular"] } }, { nv_label: "Priority" }),
    ], { nv_label: "Status row" }),
    dynamicField("Text2", { prefix: "Owner:", item_style: { ty: [null, "s-regular"] } }, { nv_label: "Owner" }),
    dynamicField("Datetime1", { prefix: "Due:", item_style: { ty: [null, "s-regular"] } }, { nv_label: "Due date" }),
    dynamicField("Text4", { item_style: { ty: [null, "s-regular"] } }, { nv_label: "Description" }),
    control("container", "Container", { style: { direction: [null, "row"], gap: [null, "--sp--s150"], align_items: [null, "center"] } }, [
      actionButton("Edit item", includeSelection ? actionIds.edit : actionIds.kanbanEdit, "subtle"),
      { ...actionButton("Mark completed", includeSelection ? actionIds.complete : actionIds.kanbanComplete, "primary", {}, { id: completeButtonId }), attrs: { ...actionButton("Mark completed", includeSelection ? actionIds.complete : actionIds.kanbanComplete).attrs, control_display: [statusDisplayRule(completeButtonId)] } },
      actionButton("Delete Item", includeSelection ? actionIds.delete : actionIds.kanbanDelete, "danger"),
    ], { nv_label: "Action button row" }),
  );
  return control("container", "Container", {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"], align_items: [null, "stretch"] },
    common: {
      pos: [null, "relative"],
      padding: [null, { top: "--sp--s300", right: "--sp--s300", bottom: "--sp--s300", left: "--sp--s300" }],
      background: { normal: { type: "classic", classic: { color: "#ffffff" } } },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)",
          radius: [null, { top: "--sp--s200", right: "--sp--s200", bottom: "--sp--s200", left: "--sp--s200" }],
        },
      },
    },
  }, children, { nv_label: includeSelection ? "Collection item action template" : "Kanban item action template" });
}

function collectionControl(actionIds) {
  return control("collection", "Collection", {
    data: { list: listRef(), link: "default" },
    actions: collectionActions(actionIds),
    layout: { cg: [null, 18], rg: [null, 18], cp: [null, { top: "--sp--s100", right: "--sp--s100", bottom: "--sp--s100", left: "--sp--s100" }], "align-i": [null, "7"] },
  }, [itemCard(actionIds, true)], { nv_label: "Action Runtime Collection" });
}

function kanbanControl(actionIds) {
  return control("kanban", "Kanban", {
    data: { list: listRef(), cateField: "Text1" },
    actions: kanbanActions(actionIds),
    categories: { width: [null, 300], collapse: true, name: { ty: { size: [null, 14], wei: "600" } } },
    items: { normal: { bgColor: "#ffffff", border: { radius: [null, { top: 6, right: 6, bottom: 6, left: 6 }] } }, pd: [null, { top: 8, right: 8, bottom: 8, left: 8 }] },
    newItem: { add: false },
  }, [
    control("kanban-body", "Kanban body", {}, [itemCard(actionIds, false)], { nv_label: "Kanban body template" }),
    control("kanban-footer", "Kanban footer", {}, [], { nv_label: "Kanban footer" }),
  ], { nv_label: "Action Runtime Kanban" });
}

function bulkToolbar(actionIds) {
  const toolbarId = uuid();
  return {
    id: toolbarId,
    type: "container",
    label: "Container",
    nv_label: "Bulk action toolbar",
    attrs: {
      style: { direction: [null, "row"], gap: [null, "--sp--s200"], align_items: [null, "center"], justify_content: [null, "space-between"] },
      common: {
        padding: [null, { top: "--sp--s250", right: "--sp--s300", bottom: "--sp--s250", left: "--sp--s300" }],
        background: { normal: { type: "classic", classic: { color: "var(--c--primary-light)" } } },
        border: { normal: { radius: [null, { top: "--sp--s200", right: "--sp--s200", bottom: "--sp--s200", left: "--sp--s200" }] } },
      },
      control_display: [showRule(toolbarId, [variable("var_SelectedItemsAmount"), op(">"), num(0)])],
    },
    children: [
      pageVarText("Selected: ", "var_SelectedItemsAmount", " item(s)", { nv_label: "Selected count text" }),
      control("container", "Container", { style: { direction: [null, "row"], gap: [null, "--sp--s150"], align_items: [null, "center"] } }, [
        actionButton("Mark selected completed", actionIds.bulkComplete, "primary"),
        actionButton("Delete selected", actionIds.bulkDelete, "danger"),
      ], { nv_label: "Bulk action buttons" }),
    ],
  };
}

function section(title, children) {
  return control("container", "Container", {
    style: { gap: [null, "--sp--s250"], direction: [null, "column"], align_items: [null, "stretch"] },
    common: {
      padding: [null, { top: "--sp--s400", right: "--sp--s400", bottom: "--sp--s400", left: "--sp--s400" }],
      background: { normal: { type: "classic", classic: { color: "#ffffff" } } },
      border: { normal: { type: "1", width: [null, { top: 1, right: 1, bottom: 1, left: 1 }], color: "var(--c--neutral-light-active)", radius: [null, { top: "--sp--s200", right: "--sp--s200", bottom: "--sp--s200", left: "--sp--s200" }] } },
    },
  }, [heading(title, "h5-bold"), ...children], { nv_label: `${title} section` });
}

function dashboardPage(actionIds) {
  return {
    children: [
      control("container", "Container", {
        style: { gap: [null, "--sp--s500"], direction: [null, "column"], align_items: [null, "stretch"] },
        common: {
          padding: [null, { top: "--sp--s500", right: "--sp--s600", bottom: "--sp--s600", left: "--sp--s600" }],
          background: { normal: { type: "classic", classic: { color: "var(--c--neutral-light)" } } },
        },
      }, [
        control("container", "Container", { style: { gap: [null, "--sp--s100"], direction: [null, "column"] } }, [
          heading(DASHBOARD_TITLE, "h2-bold"),
          heading("Safe runtime proof for local item actions, current item context, selection state, and bulk operations.", "s-regular", "var(--c--neutral-dark-hover)"),
        ], { nv_label: "Dashboard header" }),
        section("Collection item actions and bulk operations", [bulkToolbar(actionIds), collectionControl(actionIds)]),
        section("Kanban item actions", [kanbanControl(actionIds)]),
      ], { nv_label: "Main" }),
    ],
    attrs: {
      hideHeaderAll: true,
      background: { normal: { type: "classic", classic: { color: "var(--c--neutral-light)" } } },
    },
    title: DASHBOARD_TITLE,
    ver: 2,
    filterVars: [],
    tempVars: [
      { idx: uuid(), id: "var_SelectedItems" },
      { idx: uuid(), id: "var_SelectedItemsAmount" },
      { idx: uuid(), id: "var_isDeleteConfirmed" },
      { idx: uuid(), id: "var_isDeleteMultipleConfirmed" },
      { idx: uuid(), id: "var_UpdatedItemsAmount" },
      { idx: uuid(), id: "var_DeletedItemsAmount" },
    ],
    formAction: { onLoad: actionIds.reset },
    exts: [],
    actions: pageActions(actionIds),
  };
}

function collectGeneratedIds(value, ids = new Set()) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/\b747200\d{9,}\b/g)) ids.add(match[0]);
    return ids;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectGeneratedIds(item, ids));
    return ids;
  }
  if (!value || typeof value !== "object") return ids;
  for (const [key, child] of Object.entries(value)) {
    collectGeneratedIds(key, ids);
    collectGeneratedIds(child, ids);
  }
  return ids;
}

function buildWrapper(resource) {
  return {
    Title: APP_TITLE,
    Description: APP_DESCRIPTION,
    IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-list-check\",\"c\":\"#0065FF\"}",
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(JSON.stringify(resource), "utf8")).toString("base64")}`,
  };
}

function main() {
  const sourceResource = JSON.parse(fs.readFileSync(SOURCE_RESOURCE, "utf8"));
  const sourceData = JSON.parse(sourceResource.Data);
  const baseList = sourceData.Childs?.[0];
  const baseField = baseList?.Defs?.find((field) => field.FieldName === "Title") || baseList?.Defs?.[0];
  if (!baseList || !baseField) throw new Error("Source baseline does not contain a usable data-list field template.");

  const actionIds = {
    select: uuid(),
    edit: uuid(),
    delete: uuid(),
    complete: uuid(),
    reset: uuid(),
    bulkComplete: uuid(),
    bulkDelete: uuid(),
    kanbanEdit: uuid(),
    kanbanDelete: uuid(),
    kanbanComplete: uuid(),
  };

  const root = clone(sourceData.Item);
  root.ListModel = {
    ...root.ListModel,
    AppID: APP_ID,
    ListID: ROOT_ID,
    Title: APP_TITLE,
    Description: APP_DESCRIPTION,
    IconUrl: "{\"b\":\"#E6F0FF\",\"i\":\"fa-regular fa-list-check\",\"c\":\"#0065FF\"}",
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    CustomType: "",
    LayoutView: JSON.stringify({
      sortVer: 1,
      sort: [
        { AppID: APP_ID, ListID: DASHBOARD_ID, ListSetID: ROOT_ID, Type: 103, IsHidden: false, Title: DASHBOARD_TITLE, Icon: "fa-regular fa-list-check", DisplayName: "Runtime Dashboard" },
        { AppID: APP_ID, ListID: LIST_ID, ListSetID: ROOT_ID, Type: 1, IsHidden: false, Title: LIST_TITLE, Icon: "fa-regular fa-table-list", DisplayName: LIST_TITLE },
      ],
      attrs: {
        appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)" },
        "navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" },
        CustomColors: [],
        CustomFonts: [],
      },
    }),
  };
  root.Defs = [];
  root.PublicForms = [];
  root.RemindRules = [];
  root.FlowMappings = [];
  root.ListDatas = {};
  root.Layouts = [{
    LayoutID: DASHBOARD_ID,
    Type: 103,
    Title: DASHBOARD_TITLE,
    IsDefault: true,
    ListID: ROOT_ID,
    LayoutView: null,
    Ext2: "{\"src\":true}",
    IsItemPerm: false,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    LayoutInResources: [{ ID: DASHBOARD_ID, RefId: DASHBOARD_ID, Resource: JSON.stringify(dashboardPage(actionIds)) }],
  }];

  const runtimeList = makeRuntimeList(baseList, baseField);
  const data = {
    ...sourceData,
    Item: root,
    Childs: [runtimeList],
    Forms: [],
    AppGroups: [],
    OtherModules: [],
    DataReports: [],
    FormReports: [],
    FormNewReports: [],
  };
  const resource = {
    ...sourceResource,
    MainListType: 1024,
    AppID: APP_ID,
    Title: APP_TITLE,
    Description: APP_DESCRIPTION,
    IconUrl: root.ListModel.IconUrl,
    FormKeys: [],
    ReportIds: [],
    SimplePortal: null,
    Data: JSON.stringify(data),
  };
  resource.ReplaceIds = [...collectGeneratedIds(resource)].sort();

  fs.mkdirSync(path.dirname(OUT_RESOURCE), { recursive: true });
  fs.writeFileSync(OUT_RESOURCE, `${JSON.stringify(resource, null, 2)}\n`);
  fs.writeFileSync(OUT_DATA, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(OUT_PACKAGE, `${JSON.stringify(buildWrapper(resource), null, 2)}\n`);
  fs.copyFileSync(OUT_PACKAGE, DOWNLOADS_COPY);
  fs.writeFileSync(OUT_REPORT, `${JSON.stringify({
    status: "generated",
    packagePath: path.resolve(OUT_PACKAGE),
    downloadsPath: DOWNLOADS_COPY,
    appTitle: APP_TITLE,
    dashboard: DASHBOARD_TITLE,
    dataList: LIST_TITLE,
    sampleRows: Object.keys(runtimeList.ListDatas).length,
    controls: ["collection", "kanban"],
    localActions: ["Select Items", "Edit item", "Delete item", "Mark current item as Completed"],
    pageActions: ["Mark selected as completed", "Delete selected items", "Set default values"],
    proofBoundary: "Generated package for manual runtime proof only; validation is not runtime proof.",
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    status: "generated",
    packagePath: path.resolve(OUT_PACKAGE),
    downloadsPath: DOWNLOADS_COPY,
    appTitle: APP_TITLE,
    dashboard: DASHBOARD_TITLE,
    dataList: LIST_TITLE,
    sampleRows: Object.keys(runtimeList.ListDatas).length,
    replaceIds: resource.ReplaceIds.length,
  }, null, 2));
}

main();
