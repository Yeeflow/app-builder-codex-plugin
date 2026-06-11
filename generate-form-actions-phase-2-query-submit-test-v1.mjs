import fs from "node:fs";
import crypto from "node:crypto";

const sourcePath = "form-actions-phase-1-test-v1-app-def.json";
const outAppPath = "form-actions-phase-2-query-submit-test-v1-app-def.json";
const outFormDefPath = "form-actions-phase-2-query-submit-test-v1-approval-form-def.json";
const outSourceListDefPath = "form-actions-phase-2-query-submit-test-v1-source-list-def.json";
const outTargetListDefPath = "form-actions-phase-2-query-submit-test-v1-target-list-def.json";
const outReportPath = "form-actions-phase-2-query-submit-test-v1-generation-report.json";

const family = "479";
const formKey = "FAP2Q";
const generatedAt = "2026-05-15 17:10:00";
const appId = 41;
const tenantId = "1697103066096734208";
const userId = "1697103066163843073";
const rootId = `${family}0010000000000000`;
const dashboardId = `${family}0010000000000001`;
const sourceListId = `${family}0020000000001000`;
const targetListId = `${family}0030000000001000`;
const processId = `${family}0040000000000001`;
const iconUrl = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-database", c: "#0065FF" });

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const app = JSON.parse(JSON.stringify(source).replaceAll("473", family).replaceAll("FAP1S", formKey).replaceAll("fap1-", "fap2-"));
const data = JSON.parse(app.Data);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uuid() {
  return crypto.randomUUID();
}

function localId(area, suffix) {
  return `${family}${String(area).padStart(3, "0")}${suffix}`;
}

function tokenPadding(value = "--sp--s0") {
  return [null, { top: value, right: value, bottom: value, left: value }];
}

function inlinePositioning() {
  return { positioning: { widthtype: [null, "2"] } };
}

function control(type, label, attrs = {}, children = [], extra = {}) {
  return { id: uuid(), type, label, attrs, children, ...extra };
}

function container(nvLabel, attrs = {}, children = [], extra = {}) {
  return control("container", "Container", attrs, children, { nv_label: nvLabel, ...extra });
}

function textControl(value, nvLabel, ty = "h5-medium", color = "var(--c--text)") {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, ty], color },
    common: inlinePositioning()
  }, [], { nv_label: nvLabel });
}

function expressionText(tokens, nvLabel, ty = "base-regular", color = "var(--c--text)") {
  return control("heading", "Text", {
    headc: { title: { value: null, variable: tokens } },
    heads: { ty: [null, ty], color },
    common: inlinePositioning()
  }, [], { nv_label: nvLabel });
}

function paragraph(value, nvLabel) {
  return textControl(value, nvLabel, "s-regular", "var(--c--neutral-dark-hover)");
}

function cardAttrs() {
  return {
    style: { gap: [null, "--sp--s200"], direction: [null, "column"] },
    common: {
      padding: tokenPadding("--sp--s300"),
      background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)",
          radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }]
        }
      }
    }
  };
}

function rowAttrs() {
  return {
    style: {
      gap: [null, "--sp--s150"],
      direction: [null, "row"],
      justify_content: [null, "flex-start"],
      align_items: [null, "center"],
      flex_wrap: [null, "wrap"]
    },
    common: { padding: tokenPadding("--sp--s0") }
  };
}

function flexGrid(children, nvLabel) {
  return control("flex_grid", "Grid", {
    ver: 1,
    columns: {
      "1": { list: [{ value: 1, unit: "fr" }, { value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } },
      "2": { list: [{ value: 1, unit: "fr" }, { value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } },
      "3": { list: [{ value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } }
    },
    rows: { "1": { list: [{ unit: "auto" }], last: { unit: "auto" } } },
    cgap: { "1": 16 },
    cgapU: { "1": "px" },
    rgap: { "1": 16 },
    rgapU: { "1": "px" }
  }, children, { nv_label: nvLabel, displayLabel: [null, false] });
}

function makeField(listId, area, index, fieldName, displayName, internalName, fieldType, type, rules = {}) {
  const isTitle = fieldName === "Title";
  return {
    FieldID: localId(area, String(1000 + index).padStart(13, "0")),
    ListID: listId,
    FieldName: fieldName,
    FieldType: fieldType,
    FieldIndex: isTitle ? 0 : index,
    DisplayName: displayName,
    InternalName: internalName,
    DisplayName_EN: null,
    Type: type,
    Status: isTitle ? 0 : 1,
    Category: 0,
    DefaultValue: null,
    Rules: Object.keys(rules).length ? JSON.stringify(rules) : null,
    TenantID: tenantId,
    AppID: appId,
    IsSort: isTitle,
    IsIndex: isTitle,
    IsFilter: ["Title", "Text1", "Text2", "Text3", "Text4", "Decimal1", "Bit1"].includes(fieldName),
    IsIndexCreated: false,
    IsSystem: isTitle,
    IsUnique: false,
    Created: generatedAt,
    Modified: generatedAt,
    CreatedBy: userId,
    ModifiedBy: userId,
    Ext1: null,
    Ext2: null,
    Ext3: null
  };
}

function listViewLayout(fields, visible = fields.map((field) => field.FieldName)) {
  return JSON.stringify({
    layout: fields.filter((field) => !["textarea", "richtext"].includes(field.Type)).map((field, index) => ({
      FieldID: field.FieldID,
      FieldName: field.FieldName,
      Mobile: index === 0 ? 2 : 0,
      Order: index,
      Show: visible.includes(field.FieldName),
      Type: field.Type,
      DisplayName: field.DisplayName
    })),
    sort: [{ SortName: "Created", SortByDesc: true }],
    query: [],
    rowColor: [],
    filter: []
  });
}

function listFieldControl(field, readonly = false) {
  const attrs = field.Rules ? JSON.parse(field.Rules) : {};
  const item = {
    id: uuid(),
    type: field.Type,
    label: field.DisplayName,
    binding: field.FieldName,
    displayLabel: [null, true],
    attrs,
    nv_label: `${field.DisplayName} list form control`
  };
  if (readonly) item.readonly = true;
  return item;
}

function customListForm(title, layoutId, listId, fields, readonly = false) {
  const formJson = {
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] }
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: { padding: tokenPadding("--sp--s300") }
        }, [
          container("Page header", { style: { gap: [null, "--sp--s100"], direction: [null, "column"] } }, [
            textControl(title, `${title} heading`, "h4-medium"),
            paragraph(readonly ? "Review records used by the Phase 2 form action query test." : "Maintain records used by the Phase 2 form action query test.", `${title} helper`)
          ]),
          container(readonly ? "Readonly section" : "Field group", cardAttrs(), fields.map((field) => listFieldControl(field, readonly)))
        ])
      ])
    ],
    attrs: {
      container: { cw: "2", padding: tokenPadding("--sp--s0") },
      background: { type: "classic", classic: { color: "var(--c--neutral-light)" } }
    },
    title,
    filterVars: [],
    ver: 2,
    tempVars: []
  };
  return {
    LayoutID: layoutId,
    Type: 1,
    Title: title,
    ListID: listId,
    LayoutView: null,
    Ext2: "{\"src\":true}",
    IsItemPerm: false,
    Created: generatedAt,
    Modified: generatedAt,
    CreatedBy: userId,
    ModifiedBy: userId,
    LayoutInResources: [{ ID: layoutId, RefId: layoutId, Resource: JSON.stringify(formJson) }]
  };
}

function makeList(listId, area, title, description, fields, samples = {}) {
  const base = clone(data.Childs[0]);
  const editLayout = localId(area, "0000000001901");
  const viewLayout = localId(area, "0000000001902");
  base.ListModel.ListID = listId;
  base.ListModel.ListType = 1;
  base.ListModel.Title = title;
  base.ListModel.Description = description;
  base.ListModel.IconUrl = iconUrl;
  base.ListModel.CustomType = `ListSite_${rootId}`;
  base.ListModel.Created = generatedAt;
  base.ListModel.Modified = generatedAt;
  base.ListModel.CreatedBy = userId;
  base.ListModel.ModifiedBy = userId;
  base.Defs = fields;
  base.Layouts = [
    {
      LayoutID: localId(area, "0000000001801"),
      Type: 0,
      Title: "All Records",
      IsDefault: true,
      ListID: listId,
      LayoutView: listViewLayout(fields),
      Ext2: null,
      IsItemPerm: false,
      Created: generatedAt,
      Modified: generatedAt,
      CreatedBy: userId,
      ModifiedBy: userId,
      LayoutInResources: []
    },
    customListForm("Edit Item", editLayout, listId, fields, false),
    customListForm("View Item", viewLayout, listId, fields, true)
  ];
  base.ListModel.LayoutView = JSON.stringify({
    add: editLayout,
    edit: editLayout,
    view: viewLayout,
    opentype: { add: "modal" },
    modalsize: {},
    sort: [{ SortName: "Created", SortByDesc: true }]
  });
  base.ListDatas = samples;
  return base;
}

function dashboardPage() {
  return {
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] }
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: { padding: tokenPadding("--sp--s300") }
        }, [
          container("Page header", cardAttrs(), [
            textControl("Form Actions Phase 2 Query Submit Test v1", "Dashboard title", "h3-bold"),
            paragraph("A focused proof package for Query data, Submit form, Save changes, query result mapping, and query result expressions.", "Dashboard description")
          ])
        ])
      ])
    ],
    attrs: {
      hideHeaderAll: true,
      container: { padding: tokenPadding("--sp--s0") },
      background: { type: "classic", classic: { color: "var(--c--neutral-light)" } }
    },
    title: "Overview",
    ver: 2,
    filterVars: [],
    tempVars: [],
    exts: [],
    actions: []
  };
}

function approvalControl(key, type, label, attrs = {}, readonly = false, pageKey = "submit", extra = {}) {
  const item = {
    id: `fap2-control-${key}-${pageKey}`,
    binding: key,
    type,
    label,
    attrs,
    displayLabel: [null, true],
    nv_label: `${label} control`,
    ...extra
  };
  if (readonly) item.readonly = true;
  return item;
}

function actionButton(label, style, nvLabel, controlAction = null) {
  const attrs = {
    "button-style": style,
    common: inlinePositioning()
  };
  if (controlAction) attrs.control_action = controlAction;
  return control("action_button", label, attrs, [], { nv_label: nvLabel });
}

function tempVarToken(id, name = id, valueType = "text") {
  return { exprType: "variable", valueType, id: `__temp_${id}`, type: "expr", name };
}

function workflowVarToken(id, name, valueType = "text") {
  return { exprType: "variable", valueType, id, type: "expr", name: `Workflow Variables:${name}` };
}

function varButton(varId, name) {
  return `<input type="button" data="\${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${varId}&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:${name}">`;
}

function taskOutcomeButton(taskId, taskName) {
  return `<input type="button" data="\${&quot;type&quot;:&quot;task&quot;,&quot;param&quot;:{&quot;defid&quot;:&quot;${taskId}&quot;}, &quot;prop&quot;:&quot;Outcome&quot;}" expr="__" tabindex="-1" value="${taskName}:Outcome">`;
}

function outcomeValueButton(value) {
  return `<input type="button" data="${value}" expr="__" tabindex="-1" value="Task outcome:${value}">`;
}

function literalString(value) {
  return [{ type: "str", value }];
}

const queryListRefId = "fap2-listref-query-results";
const queryRowFields = [
  { idx: "fap2-row-title", id: "field_Title", name: "Title", type: "text", editable: true },
  { idx: "fap2-row-request-title", id: "field_RequestTitle", name: "Request Title", type: "text", editable: true },
  { idx: "fap2-row-approval-status", id: "field_ApprovalStatus", name: "Approval Status", type: "text", editable: true },
  { idx: "fap2-row-amount", id: "field_Amount", name: "Amount", type: "number", editable: true }
];

function listFieldControlForApproval(field, readonly = false) {
  const base = {
    id: `fap2-list-${field.id}-control${readonly ? "-review" : "-submit"}`,
    label: field.name,
    binding: field.id,
    displayLabel: [null, true],
    attrs: {
      list_field: true,
      list_field_binding: "QueryResults",
      list_control_id: `fap2-control-QueryResults-${readonly ? "review" : "submit"}`
    },
    nv_label: `${field.name} query result row control`
  };
  if (field.type === "number") {
    base.type = "input_number";
    base.attrs.displayThousandths = "1";
    base.attrs["rounded-to"] = 2;
  } else {
    base.type = "input";
    base.attrs.placeholder = `Query ${field.name.toLowerCase()}`;
  }
  if (readonly) base.readonly = true;
  return base;
}

function queryResultsControl(readonly = false) {
  return {
    id: `fap2-control-QueryResults-${readonly ? "review" : "submit"}`,
    type: "list",
    label: "Query Results",
    binding: "QueryResults",
    readonly,
    displayLabel: [null, true],
    nv_label: "Query results sublist",
    attrs: {
      "list-fields": queryRowFields.map((field, index) => ({
        ...field,
        control: listFieldControlForApproval(field, readonly),
        attrs: { table: { cw: [null, field.id === "field_RequestTitle" ? 240 : 160] } },
        Order: index
      })),
      "list-variables": queryRowFields.map((field) => ({ ...field })),
      "list-fields-summary": [],
      operation: readonly ? false : true
    }
  };
}

const loadMultipleActionId = uuid();
const loadSingleActionId = uuid();
const calculateSumActionId = uuid();
const submitFormActionId = uuid();
const saveDraftActionId = uuid();

function queryListRef() {
  return {
    AppID: appId,
    ListSetID: rootId,
    ListID: sourceListId,
    ListType: 1
  };
}

function queryActiveFilters() {
  return [
    {
      key: uuid(),
      pre: "and",
      left: "Bit1",
      op: "0",
      right: "true",
      showCus: true
    }
  ];
}

function queryActions() {
  const totalCount = tempVarToken("var_TotalQueryItems", "var_TotalQueryItems", "number");
  const loadedCount = workflowVarToken("LoadedCount", "Loaded Count", "number");
  const querySummary = workflowVarToken("QuerySummary", "Query Summary", "text");
  const amountSum = workflowVarToken("QueryAmountSum", "Query Amount Sum", "number");
  return [
    {
      id: loadMultipleActionId,
      name: "Load Multiple Test Requests",
      steps: [
        {
          type: "querydata",
          name: "Load active source requests into sublist",
          attrs: {
            querydata_list: queryListRef(),
            querydata_filters: queryActiveFilters(),
            querydata_sorts: [{ SortName: "Created", SortByDesc: true }],
            querydata_type: "multiple",
            querydata_fieldmap: {
              Title: "field_Title",
              Text1: "field_RequestTitle",
              Text3: "field_ApprovalStatus",
              Decimal1: "field_Amount"
            },
            querydata_listname: "QueryResults",
            querydata_vartype: "list",
            querydata_listname_parent: "__variables_",
            querydata_fields: null,
            querydata_totalcount: "var_TotalQueryItems",
            querydata_totalparent: "__temp_",
            querydata_pagesize: 200
          }
        },
        {
          type: "setvar",
          name: "Copy loaded count for persistence",
          attrs: {
            setvar_var: loadedCount,
            setvar_val: [totalCount]
          }
        },
        {
          type: "setvar",
          name: "Mark query summary after multiple load",
          attrs: {
            setvar_var: querySummary,
            setvar_val: literalString("Multiple active source requests loaded into the Query Results sub list.")
          }
        }
      ]
    },
    {
      id: loadSingleActionId,
      name: "Load Single Test Request",
      steps: [
        {
          type: "querydata",
          name: "Load one active source request into workflow variables",
          attrs: {
            querydata_list: queryListRef(),
            querydata_filters: queryActiveFilters(),
            querydata_sorts: [{ SortName: "Created", SortByDesc: true }],
            querydata_type: "single",
            querydata_fieldmap: {
              Title: "QueryTitle",
              Text1: "QueryRequestTitle",
              Text2: "QueryFinalNotes",
              Text3: "QueryApprovalStatus",
              Decimal1: "QueryAmount"
            },
            querydata_listname: "",
            querydata_vartype: "",
            querydata_listname_parent: "",
            querydata_fields: null,
            querydata_totalcount: "var_TotalQueryItems",
            querydata_totalparent: "__temp_",
            querydata_pagesize: 200
          }
        }
      ]
    },
    {
      id: calculateSumActionId,
      name: "Calculate Sum with arraySum",
      steps: [
        {
          type: "querydata",
          name: "Load active source amounts into temp collection",
          attrs: {
            querydata_list: queryListRef(),
            querydata_filters: queryActiveFilters(),
            querydata_type: "multiple",
            querydata_fieldmap: null,
            querydata_listname: "var_CollectionofQueryItems",
            querydata_vartype: "text",
            querydata_listname_parent: "__temp_",
            querydata_fields: [
              { FieldName: "Title", Type: "input", DisplayName: "Title" },
              { FieldName: "Decimal1", Type: "input_number", DisplayName: "Amount" }
            ],
            querydata_totalcount: "var_TotalQueryItems",
            querydata_totalparent: "__temp_",
            querydata_pagesize: 300
          }
        },
        {
          type: "setvar",
          name: "Sum Amount query items",
          attrs: {
            setvar_var: amountSum,
            setvar_val: [
              {
                type: "func",
                func: "arraySum",
                params: [[tempVarToken("var_CollectionofQueryItems", "var_CollectionofQueryItems", "text")], [{ type: "str", value: "Amount" }], [], []]
              }
            ]
          }
        }
      ]
    },
    {
      id: submitFormActionId,
      name: "Submit form for testing",
      steps: [
        {
          type: "submit",
          name: "Submit form"
        }
      ]
    },
    {
      id: saveDraftActionId,
      name: "Save as draft",
      steps: [
        {
          type: "submit",
          name: "Save changes",
          attrs: {
            submitType: "3",
            closeForm: true,
            ignoreValid: true
          }
        }
      ]
    }
  ];
}

function buttonActionSection() {
  return container("Query Action Buttons", {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
    common: { padding: tokenPadding("--sp--s0") }
  }, [
    textControl("Query Action Buttons", "Query action buttons heading", "h6-medium"),
    container("Query action button row", rowAttrs(), [
      actionButton("Load Multiple Test Requests", "2", "Load multiple test requests action button", loadMultipleActionId),
      actionButton("Load Single Test Request", "2", "Load single test request action button", loadSingleActionId),
      actionButton("Calculate Sum with arraySum", "4", "Calculate sum with arraySum action button", calculateSumActionId)
    ])
  ]);
}

function submitActionSection() {
  return container("Form Submit Actions", {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
    common: { padding: tokenPadding("--sp--s0") }
  }, [
    textControl("Form Submit Actions", "Form submit actions heading", "h6-medium"),
    container("Submit action button row", rowAttrs(), [
      actionButton("Submit form for testing", "2", "Submit form action button", submitFormActionId),
      actionButton("Save as draft", "3", "Save as draft action button", saveDraftActionId)
    ])
  ]);
}

function requestFieldsSection(readonly, pageKey) {
  return container("Request Fields", {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
    common: { padding: tokenPadding("--sp--s0") }
  }, [
    textControl("Request Fields", "Request fields heading", "h6-medium"),
    flexGrid([
      approvalControl("RequestTitle", "input", "Request Title", { placeholder: "Enter a short request title", required: true }, readonly, pageKey),
      approvalControl("Requester", "identity-picker", "Requester", { default: "currentUser" }, true, pageKey, { value: "CurrentUser" }),
      approvalControl("FinalNotes", "textarea", "Final Notes", { edit: { fhlay: "auto", textarea_minrows: 3 }, placeholder: "Optional notes for the approver." }, readonly, pageKey)
    ], "Request fields grid")
  ]);
}

function multipleQuerySection(readonly, pageKey) {
  return container("Multiple Query Results", {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
    common: { padding: tokenPadding("--sp--s0") }
  }, [
    textControl("Multiple Query Results", "Multiple query results heading", "h6-medium"),
    queryResultsControl(readonly),
    expressionText([
      { type: "str", value: "Loaded count: " },
      { type: "op", op: "&" },
      tempVarToken("var_TotalQueryItems", "var_TotalQueryItems", "number")
    ], "Loaded count display text"),
    approvalControl("LoadedCount", "input_number", "Loaded Count for Persistence", { displayThousandths: "1", "rounded-to": 0 }, readonly, pageKey),
    approvalControl("QueryAmountSum", "input_number", "Query Amount Sum", { displayThousandths: "1", "rounded-to": 2 }, readonly, pageKey),
    expressionText([
      { type: "str", value: "Query JSON: " },
      { type: "op", op: "&" },
      { type: "func", func: "JSONStringfy", params: [[tempVarToken("var_CollectionofQueryItems", "var_CollectionofQueryItems", "text")]] }
    ], "Query collection JSON display text", "s-regular", "var(--c--neutral-dark-hover)")
  ]);
}

function singleQuerySection(readonly, pageKey) {
  return container("Single Query Result", {
    style: { gap: [null, "--sp--s150"], direction: [null, "column"] },
    common: { padding: tokenPadding("--sp--s0") }
  }, [
    textControl("Single Query Result", "Single query result heading", "h6-medium"),
    flexGrid([
      approvalControl("QueryTitle", "input", "Query Title", { placeholder: "Loaded from single query" }, readonly, pageKey),
      approvalControl("QueryRequestTitle", "input", "Query Request Title", { placeholder: "Loaded from single query" }, readonly, pageKey),
      approvalControl("QueryApprovalStatus", "input", "Query Approval Status", { placeholder: "Loaded from single query" }, readonly, pageKey),
      approvalControl("QueryAmount", "input_number", "Query Amount", { displayThousandths: "1", "rounded-to": 2 }, readonly, pageKey),
      approvalControl("QueryFinalNotes", "textarea", "Query Final Notes", { edit: { fhlay: "auto", textarea_minrows: 3 }, placeholder: "Loaded from single query" }, readonly, pageKey)
    ], "Single query result fields grid")
  ]);
}

function makeApprovalPage(title, review = false, pageKey = review ? "review" : "submit") {
  const readonly = review;
  const body = [
    textControl(title, `${title} heading`, "h4-medium"),
    paragraph(review ? "Review query action results and complete the approval task." : "Use Query data and Submit form actions to prove Phase 2 form actions.", `${title} helper`),
    requestFieldsSection(readonly, pageKey),
    ...(!review ? [buttonActionSection()] : []),
    multipleQuerySection(readonly, pageKey),
    singleQuerySection(readonly, pageKey),
    approvalControl("QuerySummary", "textarea", "Query Summary", { edit: { fhlay: "auto", textarea_minrows: 3 }, placeholder: "Summary updated by query actions." }, readonly, pageKey),
    ...(!review ? [submitActionSection()] : [])
  ];
  return {
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] }
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: { padding: tokenPadding("--sp--s300") }
        }, [
          container("Form body", cardAttrs(), body),
          container("Form bottom", {
            style: { gap: [null, "--sp--s200"], direction: [null, "column"] }
          }, [
            { id: `fap2-control-panel-${pageKey}`, type: "workflowControlPanel", label: "Action Panel", attrs: { "show-task-panel": true, rejectValidation: true, align: "center" }, nv_label: "Action panel" },
            { id: `fap2-flow-history-${pageKey}`, type: "workflowHistory", label: "Flow History", attrs: { "show-history": true }, nv_label: "Flow history" }
          ])
        ])
      ])
    ],
    attrs: {
      container: { cw: "2", padding: tokenPadding("--sp--s0") },
      background: { type: "classic", classic: { color: "var(--c--neutral-light)" } }
    },
    title,
    pagetype: review ? 2 : 1,
    filterVars: [],
    ver: 2,
    tempVars: []
  };
}

const sourceFields = [
  ["Title", "Title", "Title", "Text", "input", { required: true, placeholder: "Source ID" }],
  ["Text1", "Request Title", "RequestTitle", "Text", "input", { required: false }],
  ["Text2", "Final Notes", "FinalNotes", "Text", "textarea", { required: false }],
  ["Text3", "Approval Status", "ApprovalStatus", "Text", "input", { required: false }],
  ["Decimal1", "Amount", "Amount", "Decimal", "input_number", { required: false }],
  ["Bit1", "Active", "Active", "Bit", "switch", { required: false }]
].map(([fieldName, displayName, internalName, fieldType, type, rules], index) =>
  makeField(sourceListId, 2, index, fieldName, displayName, internalName, fieldType, type, rules)
);

const targetFields = [
  ["Title", "Title", "Title", "Text", "input", { required: true, placeholder: "Request title" }],
  ["Text1", "Request Title", "RequestTitle", "Text", "input", { required: false }],
  ["Decimal1", "Loaded Count", "LoadedCount", "Decimal", "input_number", { required: false }],
  ["Text2", "Selected Query Title", "SelectedQueryTitle", "Text", "input", { required: false }],
  ["Text3", "Selected Query Status", "SelectedQueryStatus", "Text", "input", { required: false }],
  ["Decimal2", "Query Amount Sum", "QueryAmountSum", "Decimal", "input_number", { required: false }],
  ["Text4", "Query Summary", "QuerySummary", "Text", "textarea", { required: false }],
  ["Text5", "Approval Status", "ApprovalStatus", "Text", "input", { required: false }],
  ["Text6", "Created From Workflow", "CreatedFromWorkflow", "Text", "input", { required: false }]
].map(([fieldName, displayName, internalName, fieldType, type, rules], index) =>
  makeField(targetListId, 3, index, fieldName, displayName, internalName, fieldType, type, rules)
);

const sourceSamples = {
  [localId(2, "0000000011001")]: {
    ListDataID: localId(2, "0000000011001"),
    Title: "SRC-001",
    Text1: "Laptop replacement",
    Text2: "Standard approved replacement",
    Text3: "Approved",
    Decimal1: 1200,
    Bit1: "1"
  },
  [localId(2, "0000000011002")]: {
    ListDataID: localId(2, "0000000011002"),
    Title: "SRC-002",
    Text1: "Software license renewal",
    Text2: "Annual renewal",
    Text3: "Approved",
    Decimal1: 800,
    Bit1: "1"
  },
  [localId(2, "0000000011003")]: {
    ListDataID: localId(2, "0000000011003"),
    Title: "SRC-003",
    Text1: "Archived monitor request",
    Text2: "Inactive sample",
    Text3: "Closed",
    Decimal1: 300,
    Bit1: "0"
  }
};

const targetSamples = {
  [localId(3, "0000000011001")]: {
    ListDataID: localId(3, "0000000011001"),
    Title: "Existing query submit sample",
    Text1: "Existing query submit sample",
    Decimal1: 0,
    Text2: "SRC-001",
    Text3: "Seed",
    Decimal2: 0,
    Text4: "Seed row for list validation.",
    Text5: "Seed",
    Text6: "Yes"
  }
};

const sourceList = makeList(sourceListId, 2, "Source Requests", "Internal packaged source list for Form Actions Phase 2 query tests.", sourceFields, sourceSamples);
const targetList = makeList(targetListId, 3, "Phase 2 Query Submit Requests", "Persisted records created by the Form Actions Phase 2 Query Submit Test workflow.", targetFields, targetSamples);

data.Childs = [sourceList, targetList];
data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = "Form Actions Phase 2 Query Submit Test v1";
data.Item.ListModel.Description = "Small app to prove Query data and Submit form action generation.";
data.Item.ListModel.IconUrl = iconUrl;
data.Item.ListModel.Created = generatedAt;
data.Item.ListModel.Modified = generatedAt;
data.Item.ListModel.CreatedBy = userId;
data.Item.ListModel.ModifiedBy = userId;
data.Item.Layouts = [clone(data.Item.Layouts[0])];
data.Item.Layouts[0].LayoutID = dashboardId;
data.Item.Layouts[0].ListID = rootId;
data.Item.Layouts[0].Title = "Overview";
data.Item.Layouts[0].LayoutView = null;
data.Item.Layouts[0].Ext2 = "{\"src\":true}";
data.Item.Layouts[0].LayoutInResources = [{ ID: dashboardId, RefId: dashboardId, Resource: JSON.stringify(dashboardPage()) }];
data.Item.ListModel.LayoutView = JSON.stringify({
  add: "default",
  edit: "default",
  view: "default",
  sort: [
    { AppID: appId, ListID: dashboardId, ListSetID: rootId, Type: 103, Title: "Overview", Icon: "fa-regular fa-chart-line", DisplayName: "Overview" },
    { AppID: appId, ListID: sourceListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Source Requests", Icon: "fa-regular fa-database" },
    { AppID: appId, ListID: targetListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Phase 2 Query Submit Requests", Icon: "fa-regular fa-list-check" },
    { AppID: "41", Title: "Submit Phase 2 Query Test", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-bolt" }
  ],
  attrs: {
    appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)" },
    "navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" },
    CustomColors: [],
    CustomFonts: []
  },
  sortVer: 1
});

const form = data.Forms[0];
form.Name = "Form Actions Phase 2 Query Submit Test v1";
form.Key = formKey;
form.Description = "Approval form with Query data, Submit form, Save changes, and query-result expressions.";
form.ListID = 0;
form.ProcModelID = processId;
form.ImgResource = iconUrl;
form.DefKey = formKey;
form.ListSetID = rootId;
form.AppListSetID = rootId;
form.ProcModelListSetID = rootId;

const def = JSON.parse(form.DefResource);
def.defkey = formKey;
def.name = "Form Actions Phase 2 Query Submit Test v1";
def.title = "Form Actions Phase 2 Query Submit Test v1";
def.workflowType = "approval";
def.ProcModelListID = processId;
def.ProcModelAppID = appId;
def.ProcModelListSetID = rootId;
def.AppListSetID = rootId;
def.listSet = rootId;
def.listInfo = { ListID: targetListId, Title: "Phase 2 Query Submit Requests" };
def.pageurls[0].id = uuid();
def.pageurls[0].title = "Submit Phase 2 Query Test";
def.pageurls[0].type = 1;
def.pageurls[0].formdef = makeApprovalPage("Submit Phase 2 Query Test", false, "submit");
def.pageurls[0].formdef.id = def.pageurls[0].id;
def.pageurls[0].formdef.actions = queryActions();
def.pageurls[0].formdef.formAction = null;
def.pageurls[1].id = uuid();
def.pageurls[1].title = "Review Phase 2 Query Test";
def.pageurls[1].type = 2;
def.pageurls[1].formdef = makeApprovalPage("Review Phase 2 Query Test", true, "review");
def.pageurls[1].formdef.id = def.pageurls[1].id;
def.pageurls = def.pageurls.slice(0, 2);
def.variables.basic = [
  { idx: "fap2-var-request-title", id: "RequestTitle", name: "Request Title", type: "text", editable: true },
  { idx: "fap2-var-requester", id: "Requester", name: "Requester", type: "user", editable: true },
  { idx: "fap2-var-final-notes", id: "FinalNotes", name: "Final Notes", type: "text", editable: true },
  { idx: "fap2-var-query-results", id: "QueryResults", name: "Query Results", type: "list", editable: true, value: queryListRefId },
  { idx: "fap2-var-loaded-count", id: "LoadedCount", name: "Loaded Count", type: "number", editable: true },
  { idx: "fap2-var-query-title", id: "QueryTitle", name: "Query Title", type: "text", editable: true },
  { idx: "fap2-var-query-request-title", id: "QueryRequestTitle", name: "Query Request Title", type: "text", editable: true },
  { idx: "fap2-var-query-approval-status", id: "QueryApprovalStatus", name: "Query Approval Status", type: "text", editable: true },
  { idx: "fap2-var-query-final-notes", id: "QueryFinalNotes", name: "Query Final Notes", type: "text", editable: true },
  { idx: "fap2-var-query-amount", id: "QueryAmount", name: "Query Amount", type: "number", editable: true },
  { idx: "fap2-var-query-amount-sum", id: "QueryAmountSum", name: "Query Amount Sum", type: "number", editable: true },
  { idx: "fap2-var-query-summary", id: "QuerySummary", name: "Query Summary", type: "text", editable: true }
];
def.variables.listref = [
  {
    id: queryListRefId,
    name: "QueryResults",
    idx: "fap2-listref-query-results-idx",
    fields: queryRowFields
  }
];
def.variables.tempVars = [
  { idx: "fap2-temp-total-query-items", id: "var_TotalQueryItems", type: "number" },
  { idx: "fap2-temp-query-collection", id: "var_CollectionofQueryItems", type: "text" }
];

function workflowNode(resourceid, type, properties, position, incoming = [], outgoing = []) {
  return {
    resourceid,
    stencil: { id: type },
    properties,
    outgoing: outgoing.map((flowId) => ({ id: flowId, resourceid: flowId })),
    incoming: incoming.map((flowId) => ({ id: flowId, resourceid: flowId })),
    id: resourceid,
    date: 1760004900000,
    position
  };
}

function workflowFlow(resourceid, sourceNode, targetNode, properties) {
  return {
    resourceid,
    stencil: { id: "SequenceFlow" },
    properties: { linetype: "rounded", ...properties },
    target: { id: targetNode, resourceid: targetNode },
    id: resourceid,
    date: 1760004910000,
    source: { id: sourceNode, resourceid: sourceNode }
  };
}

const startNodeId = "fap2-node-start-0001";
const reviewNodeId = "fap2-node-review-0002";
const persistNodeId = "fap2-node-persist-0003";
const endNodeId = "fap2-node-end-0004";
const rejectNodeId = "fap2-node-reject-0005";
const flowStartReview = "fap2-flow-0001";
const flowApproved = "fap2-flow-0002";
const flowRejected = "fap2-flow-0003";
const flowPersistEnd = "fap2-flow-0004";

def.childshapes = [
  workflowNode(startNodeId, "StartNoneEvent", { name: "Start", taskurl: def.pageurls[0].id }, { x: -80, y: 100 }, [], [flowStartReview]),
  workflowNode(reviewNodeId, "MultiAssignmentTask", {
    name: "Reviewer Approval",
    approveway: "allapprove",
    approvepercentage: 100,
    allowskip: true,
    isallowreassign: false,
    isallowsign: false,
    usertaskassignment: [{ type: "user", method: "expression", value: varButton("Requester", "Requester"), title: `User:${varButton("Requester", "Requester")}` }],
    taskurl: def.pageurls[1].id,
    duedatedefinition: 48,
    duedatetype: "hour"
  }, { x: 190, y: 100 }, [flowStartReview], [flowApproved, flowRejected]),
  workflowNode(persistNodeId, "ContentList", {
    name: "Create Phase 2 Query Submit Record",
    type: "add",
    appid: appId,
    listsetid: rootId,
    listid: targetListId,
    listtype: "select",
    listdatas: [
      { Per: "0", Columns: "Title", Data: varButton("RequestTitle", "Request Title") },
      { Per: "0", Columns: "Text1", Data: varButton("RequestTitle", "Request Title") },
      { Per: "0", Columns: "Decimal1", Data: varButton("LoadedCount", "Loaded Count") },
      { Per: "0", Columns: "Text2", Data: varButton("QueryTitle", "Query Title") },
      { Per: "0", Columns: "Text3", Data: varButton("QueryApprovalStatus", "Query Approval Status") },
      { Per: "0", Columns: "Decimal2", Data: varButton("QueryAmountSum", "Query Amount Sum") },
      { Per: "0", Columns: "Text4", Data: varButton("QuerySummary", "Query Summary") },
      { Per: "0", Columns: "Text5", Data: "Approved" },
      { Per: "0", Columns: "Text6", Data: "Yes" }
    ],
    wheres: []
  }, { x: 470, y: 100 }, [flowApproved], [flowPersistEnd]),
  workflowNode(endNodeId, "EndNoneEvent", { name: "End" }, { x: 750, y: 100 }, [flowPersistEnd], []),
  workflowNode(rejectNodeId, "EndRejectEvent", { name: "Rejected" }, { x: 470, y: 280 }, [flowRejected], []),
  workflowFlow(flowStartReview, startNodeId, reviewNodeId, { name: "Start to Reviewer Approval" }),
  workflowFlow(flowApproved, reviewNodeId, persistNodeId, {
    name: "Approved",
    documentation: "Approved",
    conditioninfo: [{ key: "fap2-cond-approved", pre: "and", left: taskOutcomeButton(reviewNodeId, "Reviewer Approval"), op: "s.=", right: outcomeValueButton("Approved") }]
  }),
  workflowFlow(flowRejected, reviewNodeId, rejectNodeId, {
    name: "Rejected",
    documentation: "Rejected",
    conditioninfo: [{ key: "fap2-cond-rejected", pre: "and", left: taskOutcomeButton(reviewNodeId, "Reviewer Approval"), op: "s.=", right: outcomeValueButton("Rejected") }]
  }),
  workflowFlow(flowPersistEnd, persistNodeId, endNodeId, { name: "Record Created to End" })
];

form.DefResource = JSON.stringify(def);
data.Forms = [form];

app.Title = "Form Actions Phase 2 Query Submit Test v1";
app.Description = "Small generated app proving Yeeflow Form Actions Phase 2 Query data and Submit form generation.";
app.IconUrl = iconUrl;
app.MainListType = 1024;
app.AppID = appId;
app.FormKeys = [formKey];
app.Data = JSON.stringify(data);
app.ReportIds = [];
app.ReplaceIds = [
  rootId,
  dashboardId,
  sourceListId,
  targetListId,
  ...sourceFields.map((field) => field.FieldID),
  ...targetFields.map((field) => field.FieldID),
  ...sourceList.Layouts.map((layout) => layout.LayoutID),
  ...targetList.Layouts.map((layout) => layout.LayoutID),
  ...Object.keys(sourceSamples),
  ...Object.keys(targetSamples),
  processId,
  formKey
].filter((value, index, all) => value && all.indexOf(value) === index);

fs.writeFileSync(outAppPath, `${JSON.stringify(app, null, 2)}\n`);
fs.writeFileSync(outFormDefPath, `${JSON.stringify(def, null, 2)}\n`);
fs.writeFileSync(outSourceListDefPath, `${JSON.stringify({ Item: sourceList, MainListType: 1, AppID: appId, ReplaceIds: app.ReplaceIds }, null, 2)}\n`);
fs.writeFileSync(outTargetListDefPath, `${JSON.stringify({ Item: targetList, MainListType: 1, AppID: appId, ReplaceIds: app.ReplaceIds }, null, 2)}\n`);
fs.writeFileSync(outReportPath, `${JSON.stringify({
  generatedAt,
  appName: app.Title,
  idFamily: `${family}...`,
  flowKey: formKey,
  sourceBaseline: sourcePath,
  includedFormActions: [
    "querydata multiple to list variable",
    "querydata single to workflow variables",
    "querydata multiple to temp collection",
    "setvar arraySum from temp collection",
    "submit form",
    "save changes"
  ],
  expressionFunctions: ["arraySum", "JSONStringfy"],
  deferredFunctions: ["vLookup"],
  queryDataFilterPattern: {
    status: "export-backed from Form Actions Phase 2 Query Submit Test v1 Filter Patch.yap",
    property: "attrs.querydata_filters",
    note: "Do not use attrs.querydata_filter singular; runtime reads querydata_filters plural.",
    activeCondition: { left: "Bit1", op: "0", right: "true", pre: "and", showCus: true }
  },
  resources: {
    dataLists: ["Source Requests", "Phase 2 Query Submit Requests"],
    approvalForms: ["Form Actions Phase 2 Query Submit Test v1"],
    dashboards: ["Overview"]
  },
  notes: [
    "uses requester/current-user expression assignment rather than hardcoded tenant user",
    "uses arraySum, not arraySub",
    "uses export-backed JSONStringfy spelling",
    "uses export-backed attrs.querydata_filters plural for Query data Data filter condition"
  ]
}, null, 2)}\n`);

console.log(JSON.stringify({
  status: "pass",
  appDef: outAppPath,
  formDef: outFormDefPath,
  sourceListDef: outSourceListDefPath,
  targetListDef: outTargetListDefPath,
  report: outReportPath,
  replaceIds: app.ReplaceIds.length
}, null, 2));
