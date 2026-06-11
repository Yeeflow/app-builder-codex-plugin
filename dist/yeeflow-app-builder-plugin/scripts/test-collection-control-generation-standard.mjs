import assert from "node:assert/strict";
import { createRequire } from "node:module";
import zlib from "node:zlib";

const require = createRequire(import.meta.url);
const { collectYapkCollectionSurfaces, decodeYapkResource, validateCollectionControls } = require("./collection-control-generation-standard.js");

const listId = "list_Tickets";
const listsById = new Map([[listId, { title: "Tickets" }]]);
const fieldsByList = new Map([
  [
    listId,
    new Map(
      ["Title", "Text1", "Text2", "Text3", "Text4", "Text6", "Text8", "Text10", "Text11", "Decimal1", "Decimal2", "Datetime1", "Datetime2"].map((field) => [
        field,
        { FieldName: field },
      ])
    ),
  ],
]);
const filterVars = new Set(["filter_Tickets", "task_search"]);

function dynamicControl(id, type, field, extraAttrs = {}) {
  return {
    id,
    type,
    label: type === "dynamic-field" ? "Dynamic field" : type,
    attrs: {
      source: "3",
      "obj-f": field,
      ...extraAttrs,
    },
  };
}

function actionStepCurrentItem() {
  return {
    type: "listitem",
    attrs: {
      op: "modal",
      op_type: "edit",
      layout: "layout_Edit",
      listdataid: [{ exprType: "variable_ctx", valueType: "input", id: "ListDataID", ctx: "__ctx_coll", type: "expr" }],
      data: {
        list: { AppID: 41, ListID: listId, Type: 1, Title: "Tickets", ListSetID: "app_root" },
      },
    },
  };
}

function setDataListCurrentItemStep() {
  return {
    type: "setdatalist",
    attrs: {
      type: "edit",
      wheres: [
        {
          left: "ListDataID",
          right: [{ exprType: "variable_ctx", valueType: "input", id: "ListDataID", ctx: "__ctx_coll", type: "expr" }],
        },
      ],
      listdatas: [{ Columns: "Text1", Value: "Completed" }],
    },
  };
}

function validCollection(overrides = {}) {
  const base = {
    id: "coll_tickets",
    type: "collection",
    label: "Collection",
    attrs: {
      data: {
        list: { AppID: 41, ListID: listId, Type: 1, Title: "Tickets", ListSetID: "app_root" },
        sort: [{ SortName: "Created", SortByDesc: true }],
        ps: 9,
        fulltext: [
          {
            fields: ["Title", "Text4"],
            value: [{ exprType: "variable", valueType: "string", id: "__filter_filter_Tickets", type: "expr", name: "filter_Tickets" }],
          },
        ],
      },
      layout: {
        cg: [null, 16],
        rg: [null, 16],
        cp: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }],
        "align-i": [null, "7"],
        col: [null, null, 2, 1],
      },
      pagination: {
        p: {
          sp: [null, 16],
          ty: { size: [null, "--sp--s200"] },
        },
      },
      actions: [
        {
          id: "select_ticket",
          name: "Select Items",
          type: "coll",
          steps: [
            {
              type: "setvar",
              attrs: {
                variable: "__temp_var_SelectedItems",
                value: [
                  { exprType: "variable", valueType: "string", id: "__temp_var_SelectedItems", type: "expr", name: "var_SelectedItems" },
                  { type: "op", op: "&" },
                  { exprType: "variable_ctx", valueType: "input", id: "ListDataID", ctx: "__ctx_coll", type: "expr" },
                ],
              },
            },
            {
              type: "setvar",
              attrs: {
                variable: "__temp_var_SelectedItemsAmount",
                value: [{ exprType: "variable", valueType: "string", id: "__temp_var_SelectedItemsAmount", type: "expr", name: "var_SelectedItemsAmount" }],
              },
            },
          ],
        },
        {
          id: "edit_ticket",
          name: "Edit item",
          type: "coll",
          steps: [actionStepCurrentItem()],
        },
        {
          id: "complete_ticket",
          name: "Mark current item as Completed",
          type: "coll",
          steps: [setDataListCurrentItemStep(), { type: "otheraction", attrs: { control_action: "select_ticket" } }],
        },
      ],
    },
    children: [
      {
        id: "item_template",
        type: "container",
        label: "Container",
        attrs: { style: {} },
        children: [
          dynamicControl("ticket_image", "dynamic-image", "Text11", { image: {}, preview_image: {} }),
          dynamicControl("ticket_title", "dynamic-field", "Title"),
          dynamicControl("ticket_status", "dynamic-field", "Text1"),
          {
            id: "ticket_summary",
            type: "heading",
            label: "Text",
            attrs: {
              headc: {
                title: {
                  value: null,
                  variable: [{ exprType: "variable_ctx", valueType: "input", id: "Text3", ctx: "__ctx_coll", type: "expr" }],
                },
              },
            },
          },
          dynamicControl("ticket_owner", "dynamic-user", "Text10", { common: {}, picture_style: {}, text_style: {} }),
          dynamicControl("ticket_file", "dynamic-file", "Text8", { content: {}, opbtn: {} }),
          {
            id: "ticket_select_container",
            type: "container",
            label: "Container",
            attrs: {
              style: { widthtype: [null, "2"], direction: [null, "row"], gap: [null, "--sp--s025"] },
              common: { pos: [null, "absolute"], hor: [null, "right"], horoffset: [null, 12], veroffset: [null, 12] },
              control_action: "select_ticket",
            },
            children: [
              {
                id: "ticket_select_icon_unchecked",
                type: "icon",
                label: "Icon",
                attrs: {
                  icon: { icon: "fa-regular fa-square", size: [null, "--sp--s250"] },
                  common: { positioning: { widthtype: [null, "2"] } },
                  control_display: [{ formulas: [{ exprType: "variable_ctx", valueType: "input", id: "ListDataID", ctx: "__ctx_coll", type: "expr" }] }],
                },
              },
              {
                id: "ticket_select_icon_checked",
                type: "icon",
                label: "Icon",
                attrs: {
                  icon: { icon: "fa-regular fa-square-check", size: [null, "--sp--s250"] },
                  common: { positioning: { widthtype: [null, "2"] } },
                  control_display: [{ formulas: [{ exprType: "variable_ctx", valueType: "input", id: "ListDataID", ctx: "__ctx_coll", type: "expr" }] }],
                },
              },
            ],
          },
          {
            id: "ticket_edit_button",
            type: "action_button",
            label: "Edit item",
            attrs: {
              value: "Edit item",
              control_action: "edit_ticket",
            },
          },
          {
            id: "ticket_complete_button",
            type: "action_button",
            label: "Mark as completed",
            attrs: {
              value: "Mark as completed",
              control_action: "complete_ticket",
              control_display: [{ formulas: [{ exprType: "variable_ctx", valueType: "radio", id: "Text1", ctx: "__ctx_coll", type: "expr" }] }],
            },
          },
        ],
      },
    ],
  };
  return {
    ...base,
    ...overrides,
    attrs: overrides.attrs || base.attrs,
    children: overrides.children || base.children,
  };
}

function resource(object) {
  return JSON.stringify(object);
}

function validPage(surfaceType = "dashboard") {
  return {
    id: `${surfaceType}_page`,
    type: "page",
    surfaceType,
    __collectionMultiselectToolbarPresent: true,
    formAction: { submit: "<redacted-form-action>" },
    children: [
      {
        id: "selected_count",
        type: "heading",
        attrs: {
          headc: {
            title: {
              variable: [
                { exprType: "variable", valueType: "string", id: "__temp_var_SelectedItemsAmount", type: "expr", name: "var_SelectedItemsAmount" },
                { type: "str", value: " Items are selected." },
              ],
            },
          },
        },
      },
      validCollection(),
    ],
  };
}

function validYapkWrapper() {
  const appPackageInfo = {
    ListSet: { Title: "Company Overview" },
    Pages: [
      {
        Title: "Collection of activity",
        LayoutInResources: [{ Resource: resource(validPage("dashboard")) }],
      },
    ],
    Forms: [
      {
        Title: "Collection in Approval form",
        DefResource: Buffer.concat([
          Buffer.from("::brotli::"),
          zlib.brotliCompressSync(Buffer.from(resource({ pageurls: [{ title: "Collection in Approval form", formdef: validPage("approval-form") }] }))),
        ]).toString("base64"),
      },
    ],
    FormReports: [],
    FormNewReports: [],
    DataReports: [],
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
    PortalInfo: null,
    Childs: [
      {
        List: { Title: "Company Overview data" },
        Fields: [],
        Layouts: [
          {
            Title: "Collection in Data list form",
            LayoutInResources: [{ Resource: resource(validPage("data-list-form")) }],
          },
        ],
      },
    ],
  };
  return {
    Title: "Company Overview",
    Resource: zlib.brotliCompressSync(Buffer.from(resource(appPackageInfo))).toString("base64"),
    Sign: Buffer.alloc(32).toString("base64"),
  };
}

function flexGrid(id, widths, children, extraAttrs = {}) {
  return {
    id,
    type: "flex_grid",
    displayLabel: [null, false],
    attrs: {
      ver: 1,
      canFold: false,
      columns: {
        1: {
          list: widths.map(([value, unit]) => ({ value, unit })),
          last: { value: 1, unit: "fr" },
        },
        ...(extraAttrs.mobileColumns ? { 3: { list: extraAttrs.mobileColumns.map(([value, unit]) => ({ value, unit })), last: { value: 1, unit: "fr" } } } : {}),
      },
      rows: { 1: { list: [{ unit: "auto" }], last: { unit: "auto" } } },
      cgap: { 1: 10 },
      rgap: [null, 0, null, 10],
      content: {
        border: { type: "1", width: [null, { bottom: 1 }], color: "#f2f2f2" },
        pd: [null, { top: 5, right: 10, bottom: 5, left: 10 }],
      },
      common: extraAttrs.common || {},
    },
    children,
  };
}

function headerCell(id, value) {
  return {
    id,
    type: "container",
    label: "Container",
    children: [
      {
        id: `${id}_text`,
        type: "heading",
        label: "Text",
        attrs: { headc: { title: { value, variable: null } } },
      },
    ],
  };
}

function rowDynamicCell(id, type, field) {
  return {
    id,
    type: "container",
    label: "Container",
    children: [dynamicControl(`${id}_dynamic`, type, field)],
  };
}

function rowProgressCell(id) {
  return {
    id,
    type: "container",
    label: "Container",
    children: [
      {
        id: `${id}_progress`,
        type: "progress",
        label: "Progress bar",
        attrs: {
          value: [{ exprType: "variable_ctx", valueType: "number", id: "Decimal2", ctx: "__ctx_coll", type: "expr" }],
        },
      },
    ],
  };
}

function rowStatusCell(id) {
  return {
    id,
    type: "container",
    label: "Container",
    attrs: { control_display: [{ formulas: [{ exprType: "variable_ctx", valueType: "radio", id: "Text1", ctx: "__ctx_coll", type: "expr" }] }] },
    children: [
      {
        id: `${id}_status`,
        type: "heading",
        label: "Text",
        attrs: { headc: { title: { value: null, variable: [{ exprType: "variable_ctx", valueType: "radio", id: "Text1", ctx: "__ctx_coll", type: "expr" }] } } },
      },
    ],
  };
}

function rowCheckboxCell(id) {
  return {
    id,
    type: "container",
    label: "Container",
    attrs: {
      control_action: "select_ticket",
      control_display: [{ formulas: [{ type: "func", func: "strIndex", params: [[{ exprType: "variable", id: "__temp_var_SelectedItems", type: "expr", name: "var_SelectedItems" }], [{ exprType: "variable_ctx", valueType: "input", id: "ListDataID", ctx: "__ctx_coll", type: "expr" }]] }] }],
    },
    children: [
      { id: `${id}_unchecked`, type: "icon", label: "Icon", attrs: { icon: { icon: "fa-regular fa-square" } } },
      { id: `${id}_checked`, type: "icon", label: "Icon", attrs: { icon: { icon: "fa-regular fa-square-check" } } },
    ],
  };
}

function validGridTablePage({ multiselect = false, headerOverrides = {}, itemOverrides = {}, collectionOverrides = {} } = {}) {
  const widths = multiselect
    ? [[46, "px"], [2, "fr"], [1, "fr"], [1, "fr"], [1, "fr"], [1, "fr"], [1, "fr"]]
    : [[2, "fr"], [1, "fr"], [1, "fr"], [1, "fr"], [1, "fr"], [1, "fr"]];
  const headerLabels = multiselect ? ["", "Title", "Assignee", "Start date", "End date", "Completion (%)", "Status"] : ["Title", "Assignee", "Start date", "End date", "Completion (%)", "Status"];
  const rowCells = [
    ...(multiselect ? [rowCheckboxCell("row_select")] : []),
    rowDynamicCell("row_title", "dynamic-field", "Title"),
    rowDynamicCell("row_assignee", "dynamic-user", "Text2"),
    rowDynamicCell("row_start", "dynamic-field", "Datetime1"),
    rowDynamicCell("row_end", "dynamic-field", "Datetime2"),
    rowProgressCell("row_completion"),
    rowStatusCell("row_status"),
  ];
  const header = flexGrid(
    "task_header_grid",
    widths,
    headerLabels.map((label, index) => headerCell(`header_${index}`, label)),
    { common: { hide: [null, null, null, true] }, ...headerOverrides }
  );
  const itemGrid = flexGrid("task_item_grid", widths, rowCells, { mobileColumns: [[1, "fr"]], ...itemOverrides });
  const collection = {
    id: "task_collection",
    type: "collection",
    label: "Collection",
    attrs: {
      data: {
        list: { AppID: 41, ListID: listId, Type: 1, Title: "Tasks", ListSetID: "app_root" },
        link: "layout_task_detail",
        modalsize: 2,
        sort: [{ SortName: "Datetime1", SortByDesc: true }],
        fulltext: [{ fields: ["Title", "Text2", "Text6"], value: [{ exprType: "variable", id: "__filter_task_search", type: "expr", name: "task_search" }] }],
        ...(multiselect ? { ps: 16 } : {}),
      },
      layout: {
        col: [null, 1],
        rg: [null, 0, null, 10],
        cg: [null, 10],
        hover: { bgColor: "#f2f2f2" },
      },
      pagination: { p: { sp: [null, "--sp--s150"], ty: { size: [null, "--sp--s200"] } } },
      ...(multiselect ? {
        actions: [
          {
            id: "select_ticket",
            type: "coll",
            steps: [
              { type: "setvar", attrs: { variable: "__temp_var_SelectedItems", value: [{ exprType: "variable_ctx", valueType: "input", id: "ListDataID", ctx: "__ctx_coll", type: "expr" }] } },
              { type: "setvar", attrs: { variable: "__temp_var_SelectedItemsAmount", value: [{ exprType: "variable", id: "__temp_var_SelectedItemsAmount", type: "expr", name: "var_SelectedItemsAmount" }] } },
            ],
          },
          {
            id: "complete_ticket",
            type: "coll",
            steps: [setDataListCurrentItemStep(), { type: "otheraction", attrs: { control_action: "select_ticket" } }],
          },
          {
            id: "delete_ticket",
            type: "coll",
            steps: [{ type: "confirm", attrs: { message: "Confirm" } }, setDataListCurrentItemStep(), { type: "otheraction", attrs: { control_action: "select_ticket" } }],
          },
        ],
      } : {}),
    },
    children: [itemGrid],
  };
  Object.assign(collection.attrs, collectionOverrides.attrs || {});
  if (collectionOverrides.children) collection.children = collectionOverrides.children;
  return {
    id: "task_table_page",
    type: "page",
    surfaceType: "dashboard",
    children: [
      { id: "task_search", type: "search-filter", label: "Search tasks", attrs: { placeholder: "Search tasks" } },
      ...(multiselect ? [
        {
          id: "bulk_toolbar",
          type: "container",
          label: "Container",
          children: [
            { id: "bulk_complete", type: "action_button", label: "Mark as completed", attrs: { value: "Mark as completed", control_action: "complete_ticket" } },
            { id: "bulk_delete", type: "action_button", label: "Delete selected items", attrs: { value: "Delete selected items", control_action: "delete_ticket" } },
          ],
        },
      ] : []),
      header,
      collection,
    ],
  };
}

function run(control, extra = {}) {
  const report = { errors: [] };
  validateCollectionControls({
    page: extra.page || {
      id: "page",
      type: "page",
      surfaceType: extra.surface || "dashboard",
      __collectionMultiselectToolbarPresent: true,
      children: [
        {
          id: "selected_count",
          type: "heading",
          attrs: {
            headc: {
              title: {
                variable: [
                  { exprType: "variable", valueType: "string", id: "__temp_var_SelectedItemsAmount", type: "expr", name: "var_SelectedItemsAmount" },
                  { type: "str", value: " Items are selected." },
                ],
              },
            },
          },
        },
        control,
      ],
    },
    listsById,
    fieldsByList,
    filterVars,
    severity: "error",
    issue(level, code, message, details) {
      report.errors.push({ level, code, message, ...details });
    },
    ...Object.fromEntries(Object.entries(extra).filter(([key]) => key !== "page")),
  });
  return report.errors.map((entry) => entry.code);
}

function expectCode(name, control, code, extra = {}) {
  const codes = run(control, extra);
  assert.ok(codes.includes(code), `${name} should include ${code}; got ${codes.join(", ")}`);
}

assert.deepEqual(run(validCollection()), []);
assert.deepEqual(run(validCollection(), { requireCollection: true, requireResponsiveCardGrid: true, requireItemActions: true, requireMultiselect: true, requireAbsoluteOperationContainer: true, requireSelectedCountBinding: true, surface: "dashboard", validateSurfaceContext: true }), []);
assert.deepEqual(run(validCollection(), { requireCollection: true, requireResponsiveCardGrid: true, requireItemActions: true, requireMultiselect: true, requireAbsoluteOperationContainer: true, requireSelectedCountBinding: true, surface: "approval-form", validateSurfaceContext: true, page: { id: "approval_page", type: "page", surfaceType: "approval-form", __collectionMultiselectToolbarPresent: true, children: [{ id: "selected_count", type: "heading", attrs: { headc: { title: { variable: [{ exprType: "variable", valueType: "string", id: "__temp_var_SelectedItemsAmount", type: "expr", name: "var_SelectedItemsAmount" }, { type: "str", value: " Items are selected." }] } } } }, validCollection()] } }), []);
assert.deepEqual(run(validCollection(), { requireCollection: true, requireResponsiveCardGrid: true, requireItemActions: true, requireMultiselect: true, requireAbsoluteOperationContainer: true, requireSelectedCountBinding: true, surface: "data-list-form", validateSurfaceContext: true, page: { id: "list_form_page", type: "page", surfaceType: "data-list-form", __collectionMultiselectToolbarPresent: true, children: [{ id: "selected_count", type: "heading", attrs: { headc: { title: { variable: [{ exprType: "variable", valueType: "string", id: "__temp_var_SelectedItemsAmount", type: "expr", name: "var_SelectedItemsAmount" }, { type: "str", value: " Items are selected." }] } } } }, validCollection()] } }), []);
assert.deepEqual(run(validCollection(), { requireCollection: true, requireResponsiveCardGrid: true, requireItemActions: true, format: "YAPK" }), []);
assert.deepEqual(run(validCollection(), { requireCollection: true, requestedCollectionPattern: "card" }), []);
assert.deepEqual(run(validCollection(), { requireCollection: true, requestedCollectionPattern: "grid-table", explicitCardFallbackAccepted: true }), []);
assert.deepEqual(run(null, { page: validGridTablePage(), requireCollection: true, requestedCollectionPattern: "grid-table", requireGridTablePattern: true, requireGridTableSearch: true, requireGridTableMobile: true, requireGridTablePagination: true, requireGridTableHover: true }), []);
assert.deepEqual(run(null, { page: validGridTablePage(), requireCollection: true, requestedCollectionPattern: "collection_control_grid_table", format: "YAPK", requireGridTablePattern: true }), []);
assert.deepEqual(run(null, { page: validGridTablePage({ multiselect: true }), requireCollection: true, requestedCollectionPattern: "grid-table", requireGridTablePattern: true, requireGridTableSearch: true, requireGridTableMobile: true, requireGridTablePagination: true, requireGridTableMultiselect: true }), []);

const yapkInspection = collectYapkCollectionSurfaces(validYapkWrapper());
assert.deepEqual(yapkInspection.errors, []);
assert.deepEqual(yapkInspection.surfaces.map((surface) => [surface.kind, surface.name, surface.cardCollectionCount]), [
  ["dashboard", "Collection of activity", 1],
  ["approval-form", "Collection in Approval form", 1],
  ["data-list-form", "Collection in Data list form", 1],
]);
assert.equal(decodeYapkResource(validYapkWrapper().Resource).decoded.Childs.length, 1);

expectCode("missing data source", validCollection({ attrs: { data: { list: {} }, layout: {} } }), "COLLECTION_DATA_SOURCE_MISSING");
expectCode("invalid data source", validCollection({ attrs: { data: { list: { ListID: "missing_list" } }, layout: {} } }), "COLLECTION_DATA_SOURCE_INVALID");
expectCode("missing item template", validCollection({ children: [] }), "COLLECTION_ITEM_TEMPLATE_MISSING");
expectCode("child without id", validCollection({ children: [{ id: "item_template", type: "container", children: [dynamicControl("", "dynamic-field", "Title")] }] }), "COLLECTION_CHILD_CONTROL_ID_DUPLICATE");
expectCode("duplicate child ids", validCollection({ children: [{ id: "item_template", type: "container", children: [dynamicControl("dup", "dynamic-field", "Title"), dynamicControl("dup", "dynamic-field", "Text2")] }] }), "COLLECTION_CHILD_CONTROL_ID_DUPLICATE");
expectCode("dynamic image missing field", validCollection({ children: [{ id: "item_template", type: "container", children: [dynamicControl("missing", "dynamic-image", "MissingField")] }] }), "COLLECTION_REFERENCED_FIELD_MISSING");
expectCode("missing current item", validCollection({ children: [{ id: "item_template", type: "container", children: [{ id: "static", type: "heading", attrs: { headc: { title: { value: "Static" } } } }] }] }), "COLLECTION_CURRENT_ITEM_CONTEXT_MISSING");
expectCode("placeholder", validCollection({ children: [{ id: "item_template", type: "container", children: [{ id: "placeholder", type: "heading", attrs: { headc: { title: { value: "Here is the title" } } } }, dynamicControl("ok", "dynamic-field", "Title")] }] }), "COLLECTION_PLACEHOLDER_TEXT_LEAK");
expectCode("invalid filter", validCollection({ attrs: { data: { list: { ListID: listId }, fulltext: [{ fields: ["MissingField"], value: [] }] }, layout: {} } }), "COLLECTION_FILTER_FIELD_INVALID");
expectCode("invalid sort", validCollection({ attrs: { data: { list: { ListID: listId }, sort: [{ SortName: "MissingField" }] }, layout: {} } }), "COLLECTION_SORT_FIELD_INVALID");
expectCode("invalid page size", validCollection({ attrs: { ...validCollection().attrs, data: { ...validCollection().attrs.data, ps: 0 } } }), "COLLECTION_DATA_PAGE_SIZE_INVALID");
expectCode("invalid pagination", validCollection({ attrs: { ...validCollection().attrs, pagination: { bad: true } } }), "COLLECTION_PAGINATION_INVALID");
expectCode("invalid control action", validCollection({ children: [{ id: "item_template", type: "container", children: [dynamicControl("ok", "dynamic-field", "Title"), { id: "bad_action_button", type: "action_button", attrs: { value: "Bad", control_action: "missing_action" } }] }] }), "COLLECTION_CONTROL_ACTION_REFERENCE_INVALID");
expectCode("unsupported action shape", validCollection({ attrs: { ...validCollection().attrs, actions: [{ id: "edit_ticket", type: "page", steps: [actionStepCurrentItem()] }] } }), "COLLECTION_ACTION_SHAPE_INVALID");
expectCode("untriggered action", validCollection({ children: [{ id: "item_template", type: "container", children: [dynamicControl("ok", "dynamic-field", "Title")] }] }), "COLLECTION_ACTION_TRIGGER_MISSING");
expectCode("action missing current context", validCollection({ attrs: { ...validCollection().attrs, actions: [{ id: "edit_ticket", name: "Edit item", type: "coll", steps: [{ type: "noop", attrs: {} }] }] } }), "COLLECTION_CURRENT_ITEM_CONTEXT_MISSING");
expectCode("unsupported shape", validCollection({ label: "Repeater" }), "COLLECTION_CONTROL_UNPROVEN_SHAPE");
expectCode("schema-pass render risk", validCollection({ children: [{ id: "item_template", type: "container", children: [] }] }), "COLLECTION_ITEM_TEMPLATE_INVALID");

expectCode("missing responsive columns", validCollection({ attrs: { ...validCollection().attrs, layout: { cg: [null, 16], rg: [null, 16] } } }), "COLLECTION_RESPONSIVE_COLUMNS_MISSING", { requireResponsiveCardGrid: true });
assert.ok(run(validCollection({ attrs: { ...validCollection().attrs, layout: { ...validCollection().attrs.layout, col: [null, null, 3, 1] } } }), { requireResponsiveCardGrid: true }).includes("COLLECTION_RESPONSIVE_COLUMNS_INVALID"));
assert.ok(run(validCollection({ children: [{ ...validCollection().children[0], children: validCollection().children[0].children.filter((child) => child.id !== "ticket_select_container") }] }), { requireMultiselect: true, requireAbsoluteOperationContainer: true }).includes("COLLECTION_OPERATION_CONTAINER_POSITION_INVALID"));
assert.ok(run(validCollection({ attrs: { ...validCollection().attrs, actions: [{ id: "edit_ticket", name: "Edit item", type: "coll", steps: [{ type: "noop", attrs: {} }] }] } }), { requireItemActions: true }).includes("COLLECTION_ITEM_ACTION_MISSING_CONTEXT"));
assert.ok(run(validCollection({ attrs: { ...validCollection().attrs, actions: [{ id: "edit_ticket", name: "Edit item", type: "coll", steps: [{ type: "noop", attrs: { value: [{ exprType: "variable_ctx", id: "Text1", ctx: "__ctx_coll" }] } }] }] } }), { requireItemActions: true }).includes("COLLECTION_ACTION_LISTDATAID_MISSING"));
assert.ok(run(validCollection(), { requireCollection: true, requestedCollectionPattern: "grid-table" }).includes("COLLECTION_GRID_TABLE_SHAPE_INVALID"));
assert.ok(run(null, { page: validGridTablePage(), requireCollection: true, requireResponsiveCardGrid: true }).includes("COLLECTION_GRID_TABLE_PATTERN_UNPROVEN"));
assert.ok(run(validCollection({ attrs: { data: { list: { ListID: listId } }, layout: { mode: "row-list" } } }), { requireCollection: true }).includes("COLLECTION_NON_CARD_PATTERN_UNPROVEN"));
assert.ok(run(validCollection({ attrs: { data: { list: { ListID: listId } }, layout: { mode: "mystery-collection" } } }), { requireCollection: true }).includes("COLLECTION_PATTERN_UNPROVEN"));
assert.ok(run(validCollection({ attrs: { data: { list: { ListID: listId } }, layout: { mode: "timeline" } } }), { requireCollection: true, format: "YAPK" }).includes("COLLECTION_YAPK_SHAPE_UNPROVEN"));
assert.ok(run(validCollection(), { requireCollection: true, requestedCollectionPattern: "kanban" }).includes("COLLECTION_NON_CARD_PATTERN_UNPROVEN"));
assert.ok(run(null, { page: { ...validGridTablePage(), children: validGridTablePage().children.filter((child) => child.id !== "task_header_grid") }, requireCollection: true, requestedCollectionPattern: "grid-table" }).includes("COLLECTION_GRID_TABLE_HEADER_GRID_MISSING"));
assert.ok(run(null, { page: validGridTablePage({ collectionOverrides: { children: [] } }), requireCollection: true, requestedCollectionPattern: "grid-table" }).includes("COLLECTION_GRID_TABLE_SHAPE_INVALID"));
const mismatchedItemGridPage = validGridTablePage({
  collectionOverrides: {
    children: [
      flexGrid("task_item_grid", [[1, "fr"], [1, "fr"], [1, "fr"], [1, "fr"], [1, "fr"], [1, "fr"]], [
        rowDynamicCell("row_title", "dynamic-field", "Title"),
        rowDynamicCell("row_assignee", "dynamic-user", "Text2"),
        rowDynamicCell("row_start", "dynamic-field", "Datetime1"),
        rowDynamicCell("row_end", "dynamic-field", "Datetime2"),
        rowProgressCell("row_completion"),
        rowStatusCell("row_status"),
      ], { mobileColumns: [[1, "fr"]] }),
    ],
  },
});
assert.ok(run(null, { page: mismatchedItemGridPage, requireCollection: true, requestedCollectionPattern: "grid-table" }).includes("COLLECTION_GRID_TABLE_COLUMN_WIDTH_MISMATCH"));
const visibleHeaderPage = validGridTablePage({ headerOverrides: { common: { hide: [null, null, null, false] } } });
assert.ok(run(null, { page: visibleHeaderPage, requireCollection: true, requestedCollectionPattern: "grid-table" }).includes("COLLECTION_GRID_TABLE_MOBILE_HEADER_NOT_HIDDEN"));
const noMobileItemPage = validGridTablePage({ itemOverrides: { mobileColumns: [] } });
assert.ok(run(null, { page: noMobileItemPage, requireCollection: true, requestedCollectionPattern: "grid-table" }).includes("COLLECTION_GRID_TABLE_MOBILE_ITEM_GRID_COLUMNS_INVALID"));
const noSearchPage = { ...validGridTablePage(), children: validGridTablePage().children.filter((child) => child.type !== "search-filter") };
assert.ok(run(null, { page: noSearchPage, requireCollection: true, requestedCollectionPattern: "grid-table" }).includes("COLLECTION_GRID_TABLE_SEARCH_FILTER_MISSING"));
const noProgressPage = validGridTablePage({ collectionOverrides: { children: [flexGrid("task_item_grid", [[2, "fr"], [1, "fr"], [1, "fr"], [1, "fr"], [1, "fr"], [1, "fr"]], [rowDynamicCell("row_title", "dynamic-field", "Title"), rowDynamicCell("row_assignee", "dynamic-user", "Text2"), rowDynamicCell("row_start", "dynamic-field", "Datetime1"), rowDynamicCell("row_end", "dynamic-field", "Datetime2"), rowDynamicCell("row_completion_text", "dynamic-field", "Decimal2"), rowStatusCell("row_status")], { mobileColumns: [[1, "fr"]] })] } });
assert.ok(run(null, { page: noProgressPage, requireCollection: true, requestedCollectionPattern: "grid-table" }).includes("COLLECTION_GRID_TABLE_PROGRESS_VALUE_BINDING_INVALID"));
const badMultiselectPage = validGridTablePage({ multiselect: true, collectionOverrides: { attrs: { actions: [] } } });
assert.ok(run(null, { page: badMultiselectPage, requireCollection: true, requestedCollectionPattern: "grid-table", requireGridTableMultiselect: true }).includes("COLLECTION_GRID_TABLE_MULTISELECT_ACTION_INVALID"));
assert.ok(decodeYapkResource("not-base64-resource").errorCode === "COLLECTION_YAPK_DECODE_FAILED");
assert.ok(collectYapkCollectionSurfaces({ Resource: zlib.brotliCompressSync(Buffer.from(resource({ ListSet: {}, Pages: [], Forms: [], Childs: [] }))).toString("base64") }).errors.some((error) => error.code === "COLLECTION_YAPK_RESOURCE_LOCATION_MISSING"));
assert.ok(run(validCollection(), { requireCollection: true, requireMultiselect: true, requireSelectedCountBinding: true, page: { id: "page", type: "page", surfaceType: "dashboard", children: [validCollection()] } }).includes("COLLECTION_SELECTED_COUNT_BINDING_INVALID"));
assert.ok(run(validCollection(), { surface: "approval-form", validateSurfaceContext: true, page: { id: "page", type: "page", surfaceType: "dashboard", children: [validCollection()] } }).includes("COLLECTION_APPROVAL_FORM_CONTEXT_INVALID"));
assert.ok(run(validCollection(), { surface: "data-list-form", validateSurfaceContext: true, page: { id: "page", type: "page", surfaceType: "dashboard", children: [validCollection()] } }).includes("COLLECTION_DATA_LIST_FORM_CONTEXT_INVALID"));

console.log("collection-control-generation-standard fixtures passed");
