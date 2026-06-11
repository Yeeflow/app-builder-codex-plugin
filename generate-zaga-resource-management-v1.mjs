import fs from "node:fs";
import crypto from "node:crypto";

const sourcePath = "visitor-access-management-app-def.v11-five-fields-multitype.json";
const outAppPath = "zaga-resource-management-app-def.v1.2.json";
const outFormDefPath = "zaga-resource-intake-request-form-def.v1.2.json";
const outReportPath = "zaga-resource-management-generation-report.v1.2.json";

const oldPrefix = "216";
const newPrefix = "243";
const rootId = `${newPrefix}0000000000000001`;
const overviewLayoutId = `${newPrefix}0000000000001901`;
const overviewResourceId = overviewLayoutId;
const formKey = "ZRO";
const processId = `${newPrefix}0030000000000001`;
const iconUrl = JSON.stringify({ b: "#111827", i: "fa-regular fa-folder-open", c: "#ffffff" });
const now = "2026-05-12 23:45:00";
const tenantId = "1697103066096734208";
const userId = "1697103066163843073";
const appId = 41;

const src = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const app = JSON.parse(JSON.stringify(src).replaceAll(oldPrefix, newPrefix).replaceAll("VBB", formKey).replaceAll("vbb-", "zrm-"));
const data = JSON.parse(app.Data);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function id(listIndex, suffix) {
  return `${newPrefix}${String(listIndex).padStart(3, "0")}${suffix}`;
}

function textRules(placeholder, required = false, maxLength = 200) {
  return JSON.stringify({ required, placeholder, "input-maxlength": maxLength });
}

function textareaRules(placeholder, required = false) {
  return JSON.stringify({ required, placeholder, "input-maxlength": 2000 });
}

function choiceRules(choices, displayStyle = "dropdown", placeholder = "Select value", required = false) {
  return JSON.stringify({ required, placeholder, displayStyle, choices });
}

function numberRules(prefix = "", roundedTo = "0") {
  return JSON.stringify({ displayThousandths: "1", "rounded-to": roundedTo, number_min: 0, prefix: { value: prefix } });
}

function dateRules(placeholder, showtime = false) {
  return JSON.stringify({ required: false, placeholder, showtime, date_type: "0", dateformat: "0" });
}

function boolRules() {
  return JSON.stringify({ default: false });
}

function makeField(listId, listIndex, fieldIndex, fieldName, displayName, internalName, fieldType = "Text", type = "input", rules = null) {
  const isTitle = fieldName === "Title";
  return {
    FieldID: id(listIndex, String(1000 + fieldIndex).padStart(13, "0")),
    ListID: listId,
    FieldName: fieldName,
    FieldType: fieldType,
    FieldIndex: fieldIndex - 1,
    DisplayName: displayName,
    InternalName: internalName,
    DisplayName_EN: null,
    Type: type,
    Status: isTitle ? 0 : 1,
    Category: 0,
    DefaultValue: null,
    Rules: rules,
    TenantID: tenantId,
    AppID: appId,
    IsSort: false,
    IsIndex: isTitle,
    IsFilter: ["Title", "Text1", "Text2", "Text3", "Text4", "Bit1"].includes(fieldName),
    IsIndexCreated: false,
    IsSystem: isTitle,
    IsUnique: false,
    Created: now,
    Modified: now,
    CreatedBy: userId,
    ModifiedBy: userId,
    Ext1: null,
    Ext2: null,
    Ext3: null
  };
}

function makeViewLayout(list, visibleFieldNames = null) {
  const visible = visibleFieldNames ? new Set(visibleFieldNames) : null;
  const fields = list.Defs.filter((field) => field.Type !== "textarea");
  return JSON.stringify({
    layout: fields.map((field, index) => ({
      FieldID: field.FieldID,
      FieldName: field.FieldName,
      Mobile: index === 0 ? 2 : 0,
      Order: index,
      Show: visible ? visible.has(field.FieldName) : true,
      Type: field.Type,
      DisplayName: field.DisplayName
    })),
    sort: [{ SortName: "Modified", SortByDesc: true }],
    query: [],
    rowColor: [],
    filter: []
  });
}

function makeFormPage(layout, list) {
  return JSON.stringify({
    children: [
      {
        id: `${layout.LayoutID}-container`,
        type: "container",
        label: "Container",
        attrs: {},
        children: list.Defs.map((field) => ({
          id: `${layout.LayoutID}-${field.FieldName}`,
          type: field.Type,
          label: field.DisplayName,
          binding: field.FieldName,
          attrs: field.Rules ? JSON.parse(field.Rules) : {},
          displayLabel: true
        }))
      }
    ],
    attrs: {},
    title: layout.Title,
    filterVars: [],
    ver: 2,
    tempVars: []
  });
}

function makeListFromTemplate(template, listIndex, title, description, fieldSpecs, rows, layoutTitle, visibleFields) {
  const listId = id(listIndex, "0000000001000");
  const list = clone(template);
  list.ListModel.ListID = listId;
  list.ListModel.Title = title;
  list.ListModel.Description = description;
  list.ListModel.IconUrl = iconUrl;
  list.ListModel.Created = now;
  list.ListModel.Modified = now;
  list.ListModel.CreatedBy = userId;
  list.ListModel.ModifiedBy = userId;
  list.Defs = fieldSpecs.map((field, index) =>
    makeField(listId, listIndex, index + 1, field.fieldName, field.displayName, field.internalName, field.fieldType, field.type, field.rules ?? null)
  );
  list.Layouts = list.Layouts.map((layout, index) => {
    const next = clone(layout);
    const isForm = Number(next.Type) === 1 || index === list.Layouts.length - 1;
    next.ListID = listId;
    next.LayoutID = id(listIndex, isForm ? "0000000001900" : String(1801 + index).padStart(13, "0"));
    next.Title = isForm ? `${layoutTitle} Form` : `${layoutTitle} View`;
    next.Created = now;
    next.Modified = now;
    next.CreatedBy = userId;
    next.ModifiedBy = userId;
    next.LayoutView = isForm ? null : makeViewLayout(list, visibleFields);
    if (Array.isArray(next.LayoutInResources)) {
      next.LayoutInResources = next.LayoutInResources.map((resource) => ({
        ...resource,
        ID: next.LayoutID,
        RefId: next.LayoutID,
        Resource: isForm ? makeFormPage(next, list) : JSON.stringify({ title: next.Title })
      }));
    }
    return next;
  });
  const customForm = list.Layouts.find((layout) => Number(layout.Type) === 1);
  if (customForm) {
    const layoutView = JSON.parse(list.ListModel.LayoutView);
    layoutView.add = customForm.LayoutID;
    layoutView.edit = customForm.LayoutID;
    layoutView.view = customForm.LayoutID;
    list.ListModel.LayoutView = JSON.stringify(layoutView);
  }
  list.ListDatas = {};
  rows.forEach((row, index) => {
    const rowId = id(listIndex, String(11001 + index).padStart(13, "0"));
    list.ListDatas[rowId] = { ListDataID: rowId, ...row };
  });
  return list;
}

function pageNode(type, label, attrs = {}, children = []) {
  return { id: crypto.randomUUID(), type, label, attrs, children, displayLabel: true };
}

function heading(value, size = "h5-medium") {
  return pageNode("heading", "Text", { headc: { title: { value, variable: null } }, heads: { ty: [null, size] } });
}

function overviewPage() {
  const categories = [
    ["Templates", "12 files", "#ede9fe"],
    ["Brand Kits", "8 files", "#fce7f3"],
    ["Documents", "15 files", "#e0f2fe"],
    ["Images", "10 files", "#d1fae5"],
    ["Tools & Links", "3 files", "#ffe4e6"]
  ];
  return {
    children: [
      pageNode("container", "Container", { common: { padding: [null, { top: "--sp--s600", right: "--sp--s600", bottom: "--sp--s600", left: "--sp--s600" }] } }, [
        heading("Resources", "h3-bold"),
        heading("48 files · 127 MB used · Templates, brand assets, and shared docs", "md-light"),
        pageNode("container", "Container", { common: { padding: [null, { top: "--sp--s400", right: "--sp--s400", bottom: "--sp--s400", left: "--sp--s400" }] } }, [
          heading("Browse by category", "h5-medium"),
          heading("Quick access to your asset library", "sm-light"),
          pageNode("container", "Container", {}, categories.map(([name, count, color]) =>
            pageNode("container", "Container", { common: { background: { normal: { type: "classic", classic: { color } } } } }, [
              heading(name, "md-medium"),
              heading(count, "sm-light")
            ])
          ))
        ]),
        pageNode("container", "Container", {}, [
          heading("Pinned resources", "h5-medium"),
          heading("Master Service Agreement · ZOROMI Brand Guidelines v2 · Content Calendar Template · Acme Cloud Brand Pack", "md-light")
        ])
      ])
    ],
    attrs: {},
    title: "Resources Overview",
    ver: 2,
    filterVars: [],
    tempVars: [],
    exts: []
  };
}

const baseMaster = data.Childs[0];
const baseRequest = data.Childs[1];

const resourcesListId = id(1, "0000000001000");
const projectsListId = id(2, "0000000001000");
const clientsListId = id(3, "0000000001000");

const resources = makeListFromTemplate(
  baseRequest,
  1,
  "Resources",
  "Shared templates, brand assets, documents, images, and tools.",
  [
    { fieldName: "Title", displayName: "Resource Name", internalName: "ResourceName", rules: textRules("Enter resource name", true) },
    { fieldName: "Text1", displayName: "Category", internalName: "Category", type: "radio", rules: choiceRules(["Template", "Brand Kit", "Document", "Image", "Tool"], "dropdown", "Select category", true) },
    { fieldName: "Text2", displayName: "File Type", internalName: "FileType", rules: textRules("PDF, DOC, ZIP, Live link") },
    { fieldName: "Decimal1", displayName: "Size MB", internalName: "SizeMB", fieldType: "Decimal", type: "input_number", rules: numberRules("", "1") },
    { fieldName: "Text3", displayName: "Owner", internalName: "Owner", rules: textRules("Resource owner") },
    { fieldName: "Datetime1", displayName: "Last Updated", internalName: "LastUpdated", fieldType: "Datetime", type: "datepicker", rules: dateRules("Select update date") },
    { fieldName: "Bit1", displayName: "Pinned", internalName: "Pinned", fieldType: "Bit", type: "switch", rules: boolRules() },
    { fieldName: "Decimal2", displayName: "Uses", internalName: "Uses", fieldType: "Decimal", type: "input_number", rules: numberRules("", "0") },
    { fieldName: "Text4", displayName: "Status", internalName: "Status", type: "radio", rules: choiceRules(["Ready", "Review", "Archived"], "dropdown") },
    { fieldName: "Text5", displayName: "Location / Link", internalName: "LocationLink", rules: textRules("Paste URL or storage location", false, 500) },
    { fieldName: "Text6", displayName: "Description", internalName: "Description", type: "textarea", rules: textareaRules("Describe this resource") }
  ],
  [
    { Title: "Master Service Agreement", Text1: "Template", Text2: "PDF", Decimal1: 2.4, Text3: "Bayu", Datetime1: "2026-05-09 09:00:00", Bit1: "1", Decimal2: 24, Text4: "Ready", Text5: "Shared Docs / Legal", Text6: "Standard MSA template used for all new client engagements." },
    { Title: "ZOROMI Brand Guidelines v2", Text1: "Brand Kit", Text2: "PDF", Decimal1: 8.1, Text3: "Anam", Datetime1: "2026-04-28 10:00:00", Bit1: "1", Decimal2: 18, Text4: "Ready", Text5: "Brand / ZOROMI", Text6: "Logo usage, typography, color palette, and tone guidance." },
    { Title: "Content Calendar Template", Text1: "Template", Text2: "Sheet", Decimal1: 0.1, Text3: "Teguh", Datetime1: "2026-04-20 12:00:00", Bit1: "0", Decimal2: 16, Text4: "Ready", Text5: "Templates / Marketing", Text6: "Monthly content planning sheet with channels, status, assignee, and KPI columns." },
    { Title: "Acme Cloud Brand Pack", Text1: "Brand Kit", Text2: "ZIP", Decimal1: 24.5, Text3: "Anam", Datetime1: "2026-04-11 15:30:00", Bit1: "0", Decimal2: 9, Text4: "Review", Text5: "Client Assets / Acme", Text6: "Logo files, color tokens, type specs, and photo treatment guidelines." },
    { Title: "Brief Template", Text1: "Document", Text2: "DOC", Decimal1: 0.34, Text3: "Andi", Datetime1: "2026-05-05 14:00:00", Bit1: "1", Decimal2: 31, Text4: "Ready", Text5: "Templates / Project Briefs", Text6: "Project brief structure for discovery and campaign engagements." },
    { Title: "Performance Dashboard Link", Text1: "Tool", Text2: "Live link", Decimal1: 0, Text3: "Jimmy", Datetime1: "2026-05-12 08:30:00", Bit1: "1", Decimal2: 47, Text4: "Ready", Text5: "looker.studio", Text6: "Live link to the all-channel performance dashboard." }
  ],
  "Resources",
  ["Title", "Text1", "Text2", "Decimal1", "Text3", "Datetime1", "Bit1", "Decimal2", "Text4"]
);

const projects = makeListFromTemplate(
  baseMaster,
  2,
  "Projects",
  "Client and internal projects that consume shared resources.",
  [
    { fieldName: "Title", displayName: "Project Name", internalName: "ProjectName", rules: textRules("Enter project name", true) },
    { fieldName: "Text1", displayName: "Client", internalName: "Client", rules: textRules("Client name") },
    { fieldName: "Text2", displayName: "Stage", internalName: "Stage", type: "radio", rules: choiceRules(["Planning", "Active", "Review", "Complete"], "dropdown") },
    { fieldName: "Decimal1", displayName: "Budget", internalName: "Budget", fieldType: "Decimal", type: "input_number", rules: numberRules("SGD ", "0") },
    { fieldName: "Text3", displayName: "Owner", internalName: "Owner", rules: textRules("Project owner") }
  ],
  [
    { Title: "SaaS Blog Growth", Text1: "ZOROMI", Text2: "Active", Decimal1: 45000, Text3: "Jimmy Sullivan" },
    { Title: "Acme Cloud Launch", Text1: "Acme Cloud", Text2: "Planning", Decimal1: 82000, Text3: "Anam" },
    { Title: "Evergreen Webinar Kit", Text1: "Internal", Text2: "Review", Decimal1: 18000, Text3: "Bayu" }
  ],
  "Projects",
  ["Title", "Text1", "Text2", "Decimal1", "Text3"]
);

const clients = makeListFromTemplate(
  baseMaster,
  3,
  "Clients",
  "Client directory used by the resource management workspace.",
  [
    { fieldName: "Title", displayName: "Client Name", internalName: "ClientName", rules: textRules("Enter client name", true) },
    { fieldName: "Text1", displayName: "Industry", internalName: "Industry", rules: textRules("Industry") },
    { fieldName: "Text2", displayName: "Account Owner", internalName: "AccountOwner", rules: textRules("Account owner") },
    { fieldName: "Text3", displayName: "Status", internalName: "Status", type: "radio", rules: choiceRules(["Active", "Prospect", "Paused"], "dropdown") },
    { fieldName: "Decimal1", displayName: "Active Projects", internalName: "ActiveProjects", fieldType: "Decimal", type: "input_number", rules: numberRules("", "0") }
  ],
  [
    { Title: "ZOROMI", Text1: "Retail", Text2: "Jimmy Sullivan", Text3: "Active", Decimal1: 3 },
    { Title: "Acme Cloud", Text1: "Technology", Text2: "Anam", Text3: "Active", Decimal1: 2 },
    { Title: "Foliage Co", Text1: "Consumer Goods", Text2: "Teguh", Text3: "Prospect", Decimal1: 1 }
  ],
  "Clients",
  ["Title", "Text1", "Text2", "Text3", "Decimal1"]
);

data.Childs = [resources, projects, clients];

data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = "Zaga Resource Management";
data.Item.ListModel.Description = "Manage shared resources, project assets, clients, and intake approvals.";
data.Item.ListModel.IconUrl = iconUrl;
data.Item.ListModel.Created = now;
data.Item.ListModel.Modified = now;
data.Item.ListModel.CreatedBy = userId;
data.Item.ListModel.ModifiedBy = userId;
data.Item.ListModel.WorkspaceID = data.Item.ListModel.WorkspaceID || "default_workspace";

data.Item.Layouts[0].LayoutID = overviewLayoutId;
data.Item.Layouts[0].Title = "Resources Overview";
data.Item.Layouts[0].LayoutView = null;
data.Item.Layouts[0].Ext2 = "{\"src\":true}";
data.Item.Layouts[0].LayoutInResources = [{ ID: overviewResourceId, RefId: overviewResourceId, Resource: JSON.stringify(overviewPage()) }];

data.Item.ListModel.LayoutView = JSON.stringify({
  add: "default",
  edit: "default",
  view: "default",
  sort: [
    { AppID: appId, ListID: overviewLayoutId, ListSetID: rootId, Type: 103, Title: "Resources Overview", Icon: "fa-regular fa-grid-2", DisplayName: "Overview" },
    { AppID: appId, ListID: resourcesListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Resources", Icon: "fa-regular fa-folder-open" },
    { AppID: appId, ListID: projectsListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Projects", Icon: "fa-regular fa-chart-line" },
    { AppID: appId, ListID: clientsListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Clients", Icon: "fa-regular fa-building" },
    { AppID: "41", Title: "Resource Intake Request", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-pen-field" },
    { AppID: appId, Key: "Process_Waiting_Task", ListID: "/p/todo", Path: "/p/todo", ListSetID: rootId, Title: "Pending tasks", Icon: "wait-task", Type: "process", IsHidden: true },
    { AppID: appId, Key: "Process_My_Request", ListID: "/p/requests", Path: "/p/requests", ListSetID: rootId, Title: "My requests", Icon: "apply-task", Type: "process", IsHidden: true },
    { AppID: appId, Key: "Process_Finish_Task", ListID: "/p/completed", Path: "/p/completed", ListSetID: rootId, Title: "Completed tasks", Icon: "done-task", Type: "process", IsHidden: true }
  ],
  attrs: {
    appearance: { bgc: "#111827", color: "#ffffff" },
    "navigator-menu": { bgc: "var(--c--primary)", position: "default" },
    CustomColors: [
      { id: "zaga-black", label: "Zaga Black", value: "#111827" },
      { id: "zaga-mint", label: "Zaga Mint", value: "#10b981" },
      { id: "zaga-pink", label: "Zaga Pink", value: "#ec4899" }
    ],
    CustomFonts: []
  },
  sortVer: 1
});

const form = data.Forms[0];
form.Name = "Resource Intake Request";
form.Key = formKey;
form.Description = "Approval form for adding or updating a shared resource.";
form.ListID = 0;
form.ProcModelID = processId;
form.ImgResource = iconUrl;
form.DefKey = formKey;
form.ListSetID = rootId;
form.AppListSetID = rootId;
form.ProcModelListSetID = rootId;

let def = JSON.parse(form.DefResource);
def.name = "Resource Intake Request";
def.title = "Resource Intake Request";
def.workflowType = "approval";
def.defkey = formKey;
def.ProcModelListID = processId;
def.ProcModelAppID = appId;
def.ProcModelListSetID = rootId;
def.AppListSetID = rootId;
def.listSet = rootId;
def.listInfo = { ListID: resourcesListId, Title: "Resources" };
def.pageurls[0].id = crypto.randomUUID();
def.pageurls[0].title = "Resource Intake Request";
def.pageurls[0].formdef.id = def.pageurls[0].id;
def.pageurls[0].formdef.title = "Resource Intake Request";
def.pageurls[1].id = crypto.randomUUID();
def.pageurls[1].title = "Resource Review";
def.pageurls[1].formdef.id = def.pageurls[1].id;
def.pageurls[1].formdef.title = "Resource Review";

function variable(idValue, name, type, extra = {}) {
  return { idx: `zrm-var-${idValue.toLowerCase()}`, id: idValue, name, type, editable: true, ...extra };
}

def.variables.basic = [
  variable("__attachments", "Attachments", "file"),
  variable("ResourceNo", "Resource No.", "text"),
  variable("Applicant", "Applicant", "user"),
  variable("SubmissionDate", "Submission Date", "date"),
  variable("ResourceName", "Resource Name", "text"),
  variable("Category", "Category", "text"),
  variable("FileType", "File Type", "text"),
  variable("Owner", "Owner", "text"),
  variable("LocationLink", "Location / Link", "text"),
  variable("Description", "Description", "text")
];

function control(idValue, binding, type, label, attrs = {}, options = {}) {
  const suffix = options.pageSuffix || "";
  return {
    id: `zrm-control-${idValue}${suffix}`,
    binding,
    type,
    label,
    attrs,
    readonly: Boolean(options.readonly),
    ...(options.value ? { value: options.value } : {}),
    displayLabel: true
  };
}

function requestControls(readonly = false, pageSuffix = "") {
  return [
    control("Applicant", "Applicant", "identity-picker", "Applicant", { default: "currentUser" }, { readonly: true, value: "CurrentUser", pageSuffix }),
    control("SubmissionDate", "SubmissionDate", "datepicker", "Submission Date", { default: "currentDate", showtime: true, dateformat: "0", date_type: "0" }, { readonly: true, pageSuffix }),
    control("ResourceNo", "ResourceNo", "input", "Resource No.", {}, { readonly: true, pageSuffix }),
    control("ResourceName", "ResourceName", "input", "Resource Name", { required: true, placeholder: "e.g. Brand Guidelines v3" }, { readonly, pageSuffix }),
    control("Category", "Category", "radio", "Category", { displayStyle: "dropdown", choices: ["Template", "Brand Kit", "Document", "Image", "Tool"], required: true }, { readonly, pageSuffix }),
    control("FileType", "FileType", "input", "File Type", { placeholder: "PDF, DOC, Sheet, ZIP, Live link" }, { readonly, pageSuffix }),
    control("Owner", "Owner", "input", "Owner", { placeholder: "Resource owner" }, { readonly, pageSuffix }),
    control("LocationLink", "LocationLink", "input", "Location / Link", { placeholder: "URL or shared folder path" }, { readonly, pageSuffix }),
    control("Description", "Description", "textarea", "Description", { edit: { textarea_minrows: 3 }, placeholder: "Describe what this resource is used for" }, { readonly, pageSuffix })
  ];
}

def.pageurls[0].formdef.children[0].children[1].children[0].children = requestControls(false, "-request");
def.pageurls[1].formdef.children[0].children[1].children[0].children = requestControls(true, "-review");

for (const shape of def.childshapes) {
  if (shape.stencil?.id === "StartNoneEvent" && shape.properties) shape.properties.taskurl = def.pageurls[0].id;
  if (shape.stencil?.id === "MultiAssignmentTask" && shape.properties) shape.properties.taskurl = def.pageurls[1].id;
  if (shape.properties?.name) {
    shape.properties.name = shape.properties.name
      .replaceAll("Visitor Access Request", "Resource Intake Request")
      .replaceAll("Department Head Approval", "Resource Review")
      .replaceAll("Create Visitor Access Request Record Record", "Create Resource Record");
  }
  if (shape.stencil?.id === "SetVariableTask" && shape.properties) {
    shape.properties.name = "Set Resource No.";
    shape.properties.variablesetting = [
      {
        key: "zrm-set-resource-no",
        prop: null,
        id: "ResourceNo",
        name: "Resource No.",
        type: "text",
        value: "<input type=\"button\" data=\"${&quot;type&quot;:&quot;application&quot;,&quot;prop&quot;:&quot;FlowNo&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Tracking No.\">"
      }
    ];
  }
}

function varButton(varId, name) {
  return `<input type="button" data="\${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${varId}&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:${name}">`;
}

const contentNode = def.childshapes.find((shape) => shape.stencil?.id === "ContentList");
contentNode.properties.name = "Create Resource Record";
contentNode.properties.appid = appId;
contentNode.properties.listsetid = rootId;
contentNode.properties.listid = resourcesListId;
contentNode.properties.listdatas = [
  { Per: "0", Columns: "Title", Data: varButton("ResourceName", "Resource Name") },
  { Per: "0", Columns: "Text1", Data: varButton("Category", "Category") },
  { Per: "0", Columns: "Text2", Data: varButton("FileType", "File Type") },
  { Per: "0", Columns: "Decimal1", Data: "0" },
  { Per: "0", Columns: "Text3", Data: varButton("Owner", "Owner") },
  { Per: "0", Columns: "Datetime1", Data: [{ type: "func", func: "now", params: [] }] },
  { Per: "0", Columns: "Bit1", Data: "0" },
  { Per: "0", Columns: "Decimal2", Data: "0" },
  { Per: "0", Columns: "Text4", Data: "Review" },
  { Per: "0", Columns: "Text5", Data: varButton("LocationLink", "Location / Link") },
  { Per: "0", Columns: "Text6", Data: varButton("Description", "Description") }
];

def = JSON.parse(
  JSON.stringify(def)
    .replaceAll("Visitor Access Request", "Resource Intake Request")
    .replaceAll("Select a department and describe the visitor access needed.", "Submit a shared resource for review and publication.")
);

form.DefResource = JSON.stringify(def);
data.Forms = [form];

app.Title = "Zaga Resource Management";
app.Description = "A generated Yeeflow resource management app with resource, project, client, dashboard, and intake approval capabilities.";
app.IconUrl = iconUrl;
app.MainListType = 1024;
app.AppID = appId;
app.FormKeys = [formKey];
app.Data = JSON.stringify(data);
app.ReplaceIds = [
  rootId,
  overviewLayoutId,
  ...data.Childs.flatMap((list) => [
    list.ListModel.ListID,
    ...list.Defs.map((field) => field.FieldID),
    ...list.Layouts.map((layout) => layout.LayoutID),
    ...Object.keys(list.ListDatas || {})
  ]),
  processId,
  formKey
].filter((value, index, all) => value && all.indexOf(value) === index);

fs.writeFileSync(outAppPath, `${JSON.stringify(app, null, 2)}\n`);
fs.writeFileSync(outFormDefPath, `${JSON.stringify(def, null, 2)}\n`);
fs.writeFileSync(outReportPath, `${JSON.stringify({
  generatedAt: now,
  sourceBaseline: sourcePath,
  appName: app.Title,
  idFamily: `${newPrefix}...`,
  flowKey: formKey,
  resources: data.Childs.map((list) => ({
    title: list.ListModel.Title,
    listId: list.ListModel.ListID,
    fields: list.Defs.map((field) => ({
      fieldName: field.FieldName,
      displayName: field.DisplayName,
      fieldType: field.FieldType,
      type: field.Type,
      status: field.Status,
      isSystem: field.IsSystem,
      isIndex: field.IsIndex
    })),
    sampleRecords: Object.keys(list.ListDatas || {}).length
  })),
  approvalForm: { name: form.Name, key: form.Key, listId: form.ListID, procModelId: form.ProcModelID },
  dashboard: { layoutId: overviewLayoutId, resourceId: overviewResourceId, title: "Resources Overview" },
  notes: [
    "Uses native lists, a Type 103 overview page, and an app-level approval form.",
    "No custom code controls are included in v1.",
    "Every generated local ID uses a fresh 241... family and native Title fields remain Status 0, IsSystem true, IsIndex true."
  ]
}, null, 2)}\n`);

console.log(`Wrote ${outAppPath}`);
console.log(`Wrote ${outFormDefPath}`);
console.log(`Wrote ${outReportPath}`);
