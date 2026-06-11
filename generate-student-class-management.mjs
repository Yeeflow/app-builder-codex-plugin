import fs from "node:fs";
import crypto from "node:crypto";

const sourcePath = "visitor-access-management-app-def.v11-five-fields-multitype.json";
const outAppPath = "student-class-management-app-def.v1.json";
const outFormDefPath = "student-class-management-enrollment-request-form-def.v1.json";
const reportPath = "student-class-management-generation-report.v1.json";

const oldPrefix = "216";
const newPrefix = "231";
const rootId = `${newPrefix}0000000000000001`;
const overviewLayoutId = `${newPrefix}0000000000001901`;
const formKey = "SCM";
const processId = `${newPrefix}0030000000000001`;
const iconUrl = JSON.stringify({ b: "#eef6ff", i: "fa-regular fa-graduation-cap", c: "#2563eb" });

const now = "2026-05-12 10:30:00";
const includeSampleData = false;
const userId = "1697103066163843073";
const tenantId = "1697103066096734208";
const appId = 41;

const src = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const app = JSON.parse(JSON.stringify(src).replaceAll(oldPrefix, newPrefix).replaceAll("VBB", formKey).replaceAll("vbb-", "scm-"));
const data = JSON.parse(app.Data);

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function id(listIndex, suffix) {
  return `${newPrefix}${String(listIndex).padStart(3, "0")}${suffix}`;
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
    IsFilter: ["Title", "Text1", "Text2", "Text3", "Text4", "Text5"].includes(fieldName),
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

function makeTextRules(placeholder, required = false, maxLength = 200) {
  return JSON.stringify({ required, placeholder, "input-maxlength": maxLength });
}

function makeTextareaRules(placeholder, required = false) {
  return JSON.stringify({ required, placeholder, "input-maxlength": 2000 });
}

function makeChoiceRules(choices, displayStyle = "dropdown", placeholder = "Select value", required = false) {
  return JSON.stringify({ required, placeholder, displayStyle, choices });
}

function makeDateRules(placeholder, showtime = false) {
  return JSON.stringify({ required: false, placeholder, showtime, date_type: "0", dateformat: "0" });
}

function makeLookupRules(targetListId, listfield = "Title", searchFields = ["Title", "Text1"], placeholder = "Select value") {
  return JSON.stringify({
    required: true,
    placeholder,
    displayStyle: "datapicker",
    appid: appId,
    listsetid: rootId,
    listid: targetListId,
    listfield,
    multiple: false,
    "max-selection": 20,
    search_fields: searchFields
  });
}

function makeDataListViewLayout(list, visibleFieldNames = null) {
  const visible = visibleFieldNames ? new Set(visibleFieldNames) : null;
  const gridFields = list.Defs.filter((field) => field.Type !== "textarea");
  return JSON.stringify({
    layout: gridFields.map((field, index) => ({
      FieldID: field.FieldID,
      FieldName: field.FieldName,
      Mobile: index === 0 ? 2 : 0,
      Order: index,
      Show: visible ? visible.has(field.FieldName) : true,
      Type: field.Type,
      DisplayName: field.DisplayName
    })),
    sort: [{ SortName: "Created", SortByDesc: true }],
    query: [],
    rowColor: [],
    filter: []
  });
}

function makeListFromTemplate(template, listIndex, title, description, fields, rows, layoutTitlePrefix) {
  const listId = id(listIndex, "0000000001000");
  const list = deepClone(template);
  list.ListModel.ListID = listId;
  list.ListModel.Title = title;
  list.ListModel.Description = description;
  list.ListModel.IconUrl = iconUrl;
  list.ListModel.Created = now;
  list.ListModel.Modified = now;
  list.ListModel.CreatedBy = userId;
  list.ListModel.ModifiedBy = userId;
  list.ListModel.LayoutView = list.ListModel.LayoutView.replaceAll(template.ListModel.ListID, listId);
  list.Defs = fields.map((field, index) =>
    makeField(listId, listIndex, index + 1, field.fieldName, field.displayName, field.internalName, field.fieldType, field.type, field.rules ?? null)
  );
  list.Layouts = list.Layouts.map((layout, i) => {
    const cloned = deepClone(layout);
    const isCustomForm = i === list.Layouts.length - 1;
    cloned.ListID = listId;
    cloned.LayoutID = id(listIndex, isCustomForm ? "0000000001900" : String(1801 + i).padStart(13, "0"));
    cloned.Title = isCustomForm ? `${layoutTitlePrefix} Form` : `${layoutTitlePrefix} View ${i + 1}`;
    cloned.Created = now;
    cloned.Modified = now;
    cloned.CreatedBy = userId;
    cloned.ModifiedBy = userId;
    cloned.LayoutView = isCustomForm ? null : makeDataListViewLayout(list);
    if (Array.isArray(cloned.LayoutInResources)) {
      cloned.LayoutInResources = cloned.LayoutInResources.map((resource, idx) => ({
        ...resource,
        ID: cloned.LayoutID,
        RefId: cloned.LayoutID,
        Resource: isCustomForm
          ? JSON.stringify({
              children: [
                {
                  id: `${cloned.LayoutID}-container`,
                  type: "container",
                  label: "Container",
                  attrs: {},
                  children: list.Defs.map((field) => ({
                    id: `${cloned.LayoutID}-${field.FieldName}`,
                    type: field.Type,
                    label: field.DisplayName,
                    binding: field.FieldName,
                    attrs: field.Rules ? JSON.parse(field.Rules) : {},
                    displayLabel: true
                  }))
                }
              ],
              attrs: {},
              filterVars: [],
              ver: 2,
              tempVars: [],
              title: cloned.Title
            })
          : JSON.stringify({ title: cloned.Title, listId, fields: list.Defs.map((field) => field.DisplayName), index: idx })
      }));
    }
    return cloned;
  });
  const customFormLayout = list.Layouts.find((layout) => Number(layout.Type) === 1);
  if (customFormLayout) {
    const listLayoutView = JSON.parse(list.ListModel.LayoutView);
    listLayoutView.add = customFormLayout.LayoutID;
    listLayoutView.edit = customFormLayout.LayoutID;
    listLayoutView.view = customFormLayout.LayoutID;
    list.ListModel.LayoutView = JSON.stringify(listLayoutView);
  }
  list.ListDatas = {};
  if (includeSampleData) {
    rows.forEach((row, index) => {
      const rowId = id(listIndex, String(11001 + index).padStart(13, "0"));
      list.ListDatas[rowId] = { ListDataID: rowId, ...row };
    });
  }
  return list;
}

const baseMaster = data.Childs[0];
const baseRequest = data.Childs[1];

const classesListId = id(1, "0000000001000");
const studentsListId = id(2, "0000000001000");
const enrollmentsListId = id(3, "0000000001000");

const classes = makeListFromTemplate(
  baseMaster,
  1,
  "Classes",
  "Class catalog with teacher, schedule, capacity, and status.",
  [
    { fieldName: "Title", displayName: "Class Name", internalName: "ClassName", fieldType: "Text", type: "input", rules: makeTextRules("Enter class name", true) },
    { fieldName: "Text1", displayName: "Class Code", internalName: "ClassCode", fieldType: "Text", type: "input", rules: makeTextRules("Enter class code", true) },
    { fieldName: "Text2", displayName: "Teacher", internalName: "Teacher", fieldType: "Text", type: "input", rules: makeTextRules("Enter teacher name") },
    { fieldName: "Text3", displayName: "Term", internalName: "Term", fieldType: "Text", type: "radio", rules: makeChoiceRules(["Spring", "Summer", "Fall", "Winter"]) },
    { fieldName: "Text4", displayName: "Schedule", internalName: "Schedule", fieldType: "Text", type: "input", rules: makeTextRules("Enter class schedule") },
    { fieldName: "Decimal1", displayName: "Capacity", internalName: "Capacity", fieldType: "Decimal", type: "input_number", rules: JSON.stringify({ "rounded-to": "0", number_min: 0 }) },
    { fieldName: "Text5", displayName: "Status", internalName: "Status", fieldType: "Text", type: "radio", rules: makeChoiceRules(["Open", "Full", "Closed"]) },
    { fieldName: "Text6", displayName: "Notes", internalName: "Notes", fieldType: "Text", type: "textarea", rules: makeTextareaRules("Optional notes") }
  ],
  [],
  "Classes"
);

const students = makeListFromTemplate(
  baseMaster,
  2,
  "Students",
  "Student profile list with contact details, grade level, and status.",
  [
    { fieldName: "Title", displayName: "Student Name", internalName: "StudentName", fieldType: "Text", type: "input", rules: makeTextRules("Enter student name", true) },
    { fieldName: "Text1", displayName: "Student ID", internalName: "StudentID", fieldType: "Text", type: "input", rules: makeTextRules("Enter student ID", true) },
    { fieldName: "Text2", displayName: "Email", internalName: "Email", fieldType: "Text", type: "input", rules: makeTextRules("Enter student email") },
    { fieldName: "Text3", displayName: "Phone", internalName: "Phone", fieldType: "Text", type: "input", rules: makeTextRules("Enter phone number") },
    { fieldName: "Text4", displayName: "Grade Level", internalName: "GradeLevel", fieldType: "Text", type: "radio", rules: makeChoiceRules(["Grade 9", "Grade 10", "Grade 11", "Grade 12", "Adult Learning"]) },
    { fieldName: "Text5", displayName: "Status", internalName: "Status", fieldType: "Text", type: "radio", rules: makeChoiceRules(["Active", "Inactive", "Graduated"]) },
    { fieldName: "Text6", displayName: "Guardian / Emergency Contact", internalName: "GuardianEmergencyContact", fieldType: "Text", type: "textarea", rules: makeTextareaRules("Enter guardian or emergency contact") }
  ],
  [],
  "Students"
);

const enrollments = makeListFromTemplate(
  baseRequest,
  3,
  "Enrollments",
  "Enrollment records created from student enrollment requests.",
  [
    { fieldName: "Title", displayName: "Enrollment No.", internalName: "EnrollmentNo", fieldType: "Text", type: "input", rules: makeTextRules("Workflow enrollment number") },
    { fieldName: "Text1", displayName: "Applicant", internalName: "Applicant", fieldType: "Text", type: "identity-picker", rules: JSON.stringify({ required: false, placeholder: "Select applicant" }) },
    { fieldName: "Datetime1", displayName: "Submission Date", internalName: "SubmissionDate", fieldType: "Datetime", type: "datepicker", rules: makeDateRules("Select submission date", true) },
    { fieldName: "Text2", displayName: "Student", internalName: "Student", fieldType: "Text", type: "lookup", rules: makeLookupRules(studentsListId, "Title", ["Title", "Text1", "Text2"], "Select student") },
    { fieldName: "Text3", displayName: "Student Email", internalName: "StudentEmail", fieldType: "Text", type: "input", rules: makeTextRules("Derived student email") },
    { fieldName: "Text4", displayName: "Class", internalName: "Class", fieldType: "Text", type: "lookup", rules: makeLookupRules(classesListId, "Title", ["Title", "Text1"], "Select class") },
    { fieldName: "Text8", displayName: "Class Code", internalName: "ClassCode", fieldType: "Text", type: "input", rules: makeTextRules("Derived class code") },
    { fieldName: "Datetime2", displayName: "Requested Start Date", internalName: "RequestedStartDate", fieldType: "Datetime", type: "datepicker", rules: makeDateRules("Select requested start date") },
    { fieldName: "Text9", displayName: "Enrollment Type", internalName: "EnrollmentType", fieldType: "Text", type: "radio", rules: makeChoiceRules(["New Enrollment", "Transfer", "Waitlist"]) },
    { fieldName: "Text10", displayName: "Reason / Notes", internalName: "ReasonNotes", fieldType: "Text", type: "textarea", rules: makeTextareaRules("Enter enrollment reason or notes") },
    { fieldName: "Text5", displayName: "Approval Status", internalName: "ApprovalStatus", fieldType: "Text", type: "radio", rules: makeChoiceRules(["Submitted", "Approved", "Rejected", "Waitlisted"]) },
    { fieldName: "Datetime3", displayName: "Approved Date", internalName: "ApprovedDate", fieldType: "Datetime", type: "datepicker", rules: makeDateRules("Select approved date", true) },
    { fieldName: "Text6", displayName: "Created From Workflow", internalName: "CreatedFromWorkflow", fieldType: "Text", type: "input", rules: makeTextRules("Workflow marker") }
  ],
  [],
  "Enrollments"
);

data.Childs = [classes, students, enrollments];

data.Item.ListModel.ListID = rootId;
data.Item.ListModel.Title = "Student and Class Management";
data.Item.ListModel.Description = "Manage students, classes, and enrollment approval requests.";
data.Item.ListModel.IconUrl = iconUrl;
data.Item.ListModel.Created = now;
data.Item.ListModel.Modified = now;
data.Item.ListModel.CreatedBy = userId;
data.Item.ListModel.ModifiedBy = userId;

data.Item.Layouts[0].LayoutID = overviewLayoutId;
data.Item.Layouts[0].Title = "Student and Class Management Overview";
data.Item.Layouts[0].LayoutView = null;
data.Item.Layouts[0].LayoutInResources = data.Item.Layouts[0].LayoutInResources.map((resource) => {
  const resourceId = `${newPrefix}0000000000001900`;
  return {
    ...resource,
    ID: resourceId,
    RefId: resourceId,
    Resource: JSON.stringify({
      children: [
        {
          id: crypto.randomUUID(),
          type: "container",
          label: "Container",
          displayLabel: true,
          attrs: {},
          children: [
            {
              id: crypto.randomUUID(),
              type: "heading",
              label: "Text",
              displayLabel: true,
              attrs: { headc: { title: { value: "Student and Class Management", variable: null } }, heads: { ty: [null, "h4-medium"] } },
              parentCol: null
            },
            {
              id: crypto.randomUUID(),
              type: "heading",
              label: "Text",
              displayLabel: true,
              attrs: { headc: { title: { value: "Use the navigation to maintain students, classes, enrollments, and enrollment approval requests.", variable: null } } },
              parentCol: null
            }
          ]
        }
      ],
      attrs: {},
      title: "Student and Class Management Overview",
      ver: 1,
      exts: [],
      filterVars: [],
      tempVars: []
    })
  };
});

data.Item.ListModel.LayoutView = JSON.stringify({
  add: "default",
  edit: "default",
  view: "default",
  sort: [
    { AppID: appId, ListID: overviewLayoutId, ListSetID: rootId, Type: 103, Title: "Student and Class Management Overview", Icon: "fa-regular fa-house", DisplayName: "Overview" },
    { AppID: appId, ListID: classesListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Classes", Icon: "fa-regular fa-chalkboard-user" },
    { AppID: appId, ListID: studentsListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Students", Icon: "fa-regular fa-user-graduate" },
    { AppID: appId, ListID: enrollmentsListId, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Enrollments", Icon: "fa-regular fa-list-check" },
    { AppID: "41", Title: "Student Enrollment Request", ListID: formKey, ListSetID: rootId, Type: 105, Icon: "fa-regular fa-pen-field" },
    { AppID: appId, Key: "Process_Waiting_Task", ListID: "/p/todo", Path: "/p/todo", ListSetID: rootId, Title: "Pending tasks", Icon: "wait-task", Type: "process", IsHidden: true },
    { AppID: appId, Key: "Process_My_Request", ListID: "/p/requests", Path: "/p/requests", ListSetID: rootId, Title: "My requests", Icon: "apply-task", Type: "process", IsHidden: true },
    { AppID: appId, Key: "Process_Finish_Task", ListID: "/p/completed", Path: "/p/completed", ListSetID: rootId, Title: "Completed tasks", Icon: "done-task", Type: "process", IsHidden: true }
  ],
  attrs: {
    appearance: { bgc: "#eef6ff", color: "#2563eb" },
    "navigator-menu": { bgc: "var(--c--primary)", position: "default" },
    CustomColors: [{ id: "extra-color-1", label: "School Blue", value: "#2563eb" }],
    CustomFonts: []
  },
  sortVer: 1
});

const form = data.Forms[0];
form.Name = "Student Enrollment Request";
form.Key = formKey;
form.Description = "Approval form for requesting a student enrollment into a class.";
form.ListID = 0;
form.ProcModelID = processId;
form.ImgResource = iconUrl;
form.DefKey = formKey;
form.ListSetID = rootId;
form.AppListSetID = rootId;
form.ProcModelListSetID = rootId;

const def = JSON.parse(form.DefResource);
def.name = "Student Enrollment Request";
def.title = "Student Enrollment Request";
def.workflowType = "approval";
def.pageurls[0].id = crypto.randomUUID();
def.pageurls[0].title = "Student Enrollment Request";
def.pageurls[0].formdef.title = "Student Enrollment Request";
def.pageurls[0].formdef.id = def.pageurls[0].id;
def.pageurls[1].id = crypto.randomUUID();
def.pageurls[1].title = "Student Enrollment Review";
def.pageurls[1].formdef.title = "Student Enrollment Review";
def.pageurls[1].formdef.id = def.pageurls[1].id;
for (const shape of def.childshapes) {
  if (shape.stencil?.id === "StartNoneEvent" && shape.properties) shape.properties.taskurl = def.pageurls[0].id;
  if (shape.stencil?.id === "MultiAssignmentTask" && shape.properties) shape.properties.taskurl = def.pageurls[1].id;
  if (shape.stencil?.id === "SetVariableTask" && shape.properties) {
    shape.properties.name = "Set Enrollment No.";
    shape.properties.variablesetting = [
      {
        key: "scm-set-enrollment-no",
        prop: null,
        id: "EnrollmentNo",
        name: "Enrollment No.",
        type: "text",
        value: "<input type=\"button\" data=\"${&quot;type&quot;:&quot;application&quot;,&quot;prop&quot;:&quot;FlowNo&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Tracking No.\">"
      }
    ];
  }
}

function variable(idValue, name, type, extra = {}) {
  return { idx: `scm-var-${idValue.toLowerCase()}`, id: idValue, name, type, editable: true, ...extra };
}

def.variables.basic = [
  variable("__attachments", "Attachments", "file"),
  variable("EnrollmentNo", "Enrollment No.", "text"),
  variable("Applicant", "Applicant", "user"),
  variable("SubmissionDate", "Submission Date", "date"),
  variable("field_9", "Student", "lookup", { value: { AppID: appId, ListID: studentsListId, ListSetID: rootId } }),
  variable("StudentEmail", "Student Email", "text"),
  variable("field_10", "Class", "lookup", { value: { AppID: appId, ListID: classesListId, ListSetID: rootId } }),
  variable("ClassCode", "Class Code", "text"),
  variable("RequestedStartDate", "Requested Start Date", "date"),
  variable("EnrollmentType", "Enrollment Type", "text"),
  variable("ReasonNotes", "Reason / Notes", "text")
];
def.ProcModelListID = processId;
def.ProcModelAppID = appId;
def.ProcModelListSetID = rootId;
def.AppListSetID = rootId;
def.listSet = rootId;
def.listInfo = { ListID: enrollmentsListId, Title: "Enrollments" };

function control(idValue, binding, type, label, attrs = {}, extra = {}) {
  return { id: `scm-control-${idValue}${extra.approval ? "-approval" : ""}`, binding, type, label, attrs, displayLabel: true, ...extra.props };
}

const studentLookupAttrs = {
  appid: appId,
  listsetid: rootId,
  listfield: "Title",
  listfilter: null,
  addition: [{ FieldName: "Text2", FieldID: students.Defs.find((field) => field.FieldName === "Text2").FieldID, IsShow: false, RelationName: "StudentEmail", Value: null, Order: null, RelationFieldIsMultiple: false }],
  "list_tooltip_field": null,
  "sort-first": { SortName: "Title", SortByDesc: false },
  listid: studentsListId,
  placeholder: "Select student",
  required: true
};

const classLookupAttrs = {
  appid: appId,
  listsetid: rootId,
  listfield: "Title",
  listfilter: null,
  addition: [{ FieldName: "Text1", FieldID: classes.Defs.find((field) => field.FieldName === "Text1").FieldID, IsShow: false, RelationName: "ClassCode", Value: null, Order: null, RelationFieldIsMultiple: false }],
  "list_tooltip_field": null,
  "sort-first": { SortName: "Title", SortByDesc: false },
  listid: classesListId,
  placeholder: "Select class",
  required: true
};

function pageControls(readonly = false) {
  const suffix = readonly ? { approval: true } : {};
  const ro = readonly ? { readonly: true } : {};
  return [
    control("Applicant", "Applicant", "identity-picker", "Applicant", { default: "currentUser" }, { ...suffix, props: { readonly: true, value: "CurrentUser" } }),
    control("SubmissionDate", "SubmissionDate", "datepicker", "Submission Date", { default: "currentDate", showtime: true, dateformat: "0", date_type: "0" }, { ...suffix, props: { readonly: true } }),
    control("EnrollmentNo", "EnrollmentNo", "input", "Enrollment No.", {}, { ...suffix, props: { readonly: true } }),
    control("Student", "field_9", "lookup", "Student", studentLookupAttrs, { ...suffix, props: ro }),
    control("StudentEmail", "StudentEmail", "input", "Student Email", {}, { ...suffix, props: { readonly: true } }),
    control("Class", "field_10", "lookup", "Class", classLookupAttrs, { ...suffix, props: ro }),
    control("ClassCode", "ClassCode", "input", "Class Code", {}, { ...suffix, props: { readonly: true } }),
    control("RequestedStartDate", "RequestedStartDate", "datepicker", "Requested Start Date", { dateformat: "0", date_type: "0" }, { ...suffix, props: ro }),
    control("EnrollmentType", "EnrollmentType", "radio", "Enrollment Type", { displayStyle: "dropdown", choices: ["New Enrollment", "Transfer", "Waitlist"], required: true }, { ...suffix, props: ro }),
    control("ReasonNotes", "ReasonNotes", "textarea", "Reason / Notes", { edit: { textarea_minrows: 3 }, placeholder: "Enter enrollment reason or notes" }, { ...suffix, props: ro })
  ];
}

def.pageurls[0].formdef.children[0].children[1].children[0].children = pageControls(false);
def.pageurls[1].formdef.children[0].children[1].children[0].children = pageControls(true);

for (const shape of def.childshapes) {
  if (shape.properties?.name) {
    shape.properties.name = shape.properties.name
      .replaceAll("Visitor Access Request", "Student Enrollment Request")
      .replaceAll("Department Head Approval", "Enrollment Review")
      .replaceAll("Create Student Enrollment Request Record Record", "Create Enrollment Record");
  }
}

const contentNode = def.childshapes.find((shape) => shape.stencil?.id === "ContentList");
contentNode.properties.name = "Create Enrollment Record";
contentNode.properties.appid = appId;
contentNode.properties.listsetid = rootId;
contentNode.properties.listid = enrollmentsListId;

function varButton(varId, name) {
  return `<input type="button" data="\${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${varId}&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:${name}">`;
}

contentNode.properties.listdatas = [
  { Per: "0", Columns: "Title", Data: varButton("EnrollmentNo", "Enrollment No.") },
  { Per: "0", Columns: "Text1", Data: varButton("Applicant", "Applicant") },
  { Per: "0", Columns: "Datetime1", Data: varButton("SubmissionDate", "Submission Date") },
  { Per: "0", Columns: "Text2", Data: varButton("field_9", "Student") },
  { Per: "0", Columns: "Text3", Data: varButton("StudentEmail", "Student Email") },
  { Per: "0", Columns: "Text4", Data: varButton("field_10", "Class") },
  { Per: "0", Columns: "Text8", Data: varButton("ClassCode", "Class Code") },
  { Per: "0", Columns: "Datetime2", Data: varButton("RequestedStartDate", "Requested Start Date") },
  { Per: "0", Columns: "Text9", Data: varButton("EnrollmentType", "Enrollment Type") },
  { Per: "0", Columns: "Text10", Data: varButton("ReasonNotes", "Reason / Notes") },
  { Per: "0", Columns: "Text5", Data: "Approved" },
  { Per: "0", Columns: "Datetime3", Data: [{ type: "func", func: "now", params: [] }] },
  { Per: "0", Columns: "Text6", Data: "Yes" }
];

form.DefResource = JSON.stringify(def);
data.Forms = [form];

app.Title = "Student and Class Management";
app.Description = "Manage students, classes, and enrollment approval requests.";
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
    ...Object.keys(list.ListDatas ?? {})
  ]),
  processId,
  formKey
].filter((value, index, all) => value && all.indexOf(value) === index);

fs.writeFileSync(outAppPath, `${JSON.stringify(app, null, 2)}\n`);
fs.writeFileSync(outFormDefPath, `${JSON.stringify(def, null, 2)}\n`);
fs.writeFileSync(reportPath, `${JSON.stringify({
  generatedAt: now,
  appName: "Student and Class Management",
  idFamily: `${newPrefix}...`,
  flowKey: formKey,
  sourceBaseline: sourcePath,
  sampleData: { included: includeSampleData, reason: "Disabled for conservative first import of generated app package." },
  resources: data.Childs.map((list) => ({ title: list.ListModel.Title, listId: list.ListModel.ListID, fields: list.Defs.map((field) => ({ displayName: field.DisplayName, fieldName: field.FieldName, fieldType: field.FieldType, type: field.Type, isSystem: field.IsSystem, status: field.Status })) })),
  approvalForm: { flowName: form.Name, flowKey: form.Key, procModelId: form.ProcModelID, listId: form.ListID },
  contentListMappings: contentNode.properties.listdatas.map((mapping) => ({ target: mapping.Columns, source: typeof mapping.Data === "string" ? mapping.Data : "now()" }))
}, null, 2)}\n`);

console.log(`Wrote ${outAppPath}`);
console.log(`Wrote ${outFormDefPath}`);
console.log(`Wrote ${reportPath}`);
