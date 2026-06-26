import fs from "node:fs";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const SOURCE_EXPORT = process.argv[2] || "/Users/Renger/Downloads/Document Library Sample.yap";
const OUT_PREFIX = "enterprise-document-center-form-hosted-doc-library";
const OUT_RESOURCE = `${OUT_PREFIX}.resource.json`;
const OUT_APP_DEF = `${OUT_PREFIX}.app-def.json`;
const OUT_YAP = `${OUT_PREFIX}.yap`;
const OUT_REPORT = `${OUT_PREFIX}.generation-report.json`;
const TITLE = "Enterprise Document Center - Form Hosted Doc Library";
const DESCRIPTION = "Form-host Doc library control test with Type 16 libraries, folders, dashboard controls, and approval/list/library custom forms. No uploaded files.";
const GENERATED_AT = "2026-05-18 23:40:00";
const ID_BASE = 2083000000001000000n;
const FORM_KEY = "DLFH";
const APP_ID = 41;

function quoteLargeIntegers(jsonText, largeNumbers = new Set()) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;
  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else {
          out += token;
        }
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function cloneWithFreshControlIds(value) {
  const copy = clone(value);
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.id && node.type) node.id = randomUUID();
    if (Array.isArray(node.children)) node.children.forEach(visit);
  };
  visit(copy);
  return copy;
}

function decodeYap(filePath) {
  const largeNumbers = new Set();
  const wrapper = parseJson(fs.readFileSync(filePath, "utf8"), largeNumbers);
  if (!wrapper.Resource || !wrapper.Resource.startsWith(GZIP_PREFIX)) throw new Error("Unsupported .yap Resource wrapper");
  const resource = parseJson(zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"), largeNumbers);
  const data = parseJson(resource.Data, largeNumbers);
  return { wrapper, resource, data };
}

function nextId() {
  const id = String(ID_BASE + BigInt(idOffset));
  idOffset += 1;
  return id;
}

function parseRules(field) {
  try {
    return JSON.parse(field.Rules || "{}");
  } catch {
    return {};
  }
}

function stringifyRules(rules) {
  return JSON.stringify(rules);
}

function createCustomField(baseField, spec, listId, fieldId, fieldIndex) {
  const field = clone(baseField);
  field.FieldID = fieldId;
  field.ListID = listId;
  field.FieldName = spec.fieldName;
  field.DisplayName = spec.displayName;
  field.InternalName = spec.internalName || spec.fieldName;
  field.FieldType = spec.fieldType;
  field.Type = spec.controlType;
  field.Status = 1;
  field.FieldIndex = fieldIndex;
  field.Category = 0;
  field.DefaultValue = null;
  field.Rules = stringifyRules(spec.rules || { displayLabel: true });
  field.IsSystem = false;
  field.IsUnique = false;
  field.IsSort = spec.isSort !== false;
  field.IsIndex = spec.isIndex !== false;
  field.IsFilter = spec.isFilter !== false;
  field.IsIndexCreated = spec.isIndexCreated !== false;
  field.Created = GENERATED_AT;
  field.Modified = GENERATED_AT;
  field.Ext1 = null;
  field.Ext2 = null;
  field.Ext3 = null;
  return field;
}

function viewColumn(field, order, show = true) {
  return {
    FieldID: field.FieldID,
    DisplayName: field.DisplayName,
    FieldName: field.FieldName,
    Show: show,
    Order: order,
    Type: field.Type,
    Mobile: 0,
    Rules: parseRules(field),
  };
}

function viewQuery(field) {
  return {
    FieldName: field.FieldName,
    ID: field.FieldID,
    Name: field.DisplayName,
    Type: field.Type,
  };
}

function createView({ layoutId, listId, title, url, fields, visibleNames, sort = [], filter = [] }, baseLayout) {
  const fieldByName = new Map(fields.map((field) => [field.FieldName, field]));
  const visibleFields = visibleNames.map((name) => {
    const field = fieldByName.get(name);
    if (!field) throw new Error(`View ${title} references missing field ${name}`);
    return field;
  });
  return {
    ...clone(baseLayout),
    LayoutID: layoutId,
    ListID: listId,
    Type: 0,
    Title: title,
    LayoutView: JSON.stringify({
      layout: visibleFields.map((field, index) => viewColumn(field, index + 1, true)),
      query: visibleFields.map(viewQuery),
      sort,
      filter,
      rowColor: [],
    }),
    Ext1: JSON.stringify({ Url: url }),
    Ext2: null,
    Ext3: null,
    IsDefault: false,
    IsItemPerm: false,
    LayoutInResources: null,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
  };
}

function createUploadForm(baseForm, listId, layoutId, title, uploadField) {
  const form = clone(baseForm);
  form.LayoutID = layoutId;
  form.ListID = listId;
  form.Title = title;
  form.LayoutView = null;
  form.Created = GENERATED_AT;
  form.Modified = GENERATED_AT;
  form.Ext2 = JSON.stringify({ src: true });
  const resource = JSON.parse(form.LayoutInResources[0].Resource);
  resource.title = title;
  const uploadControl = resource.children.find((child) => child.binding === "Text4" || child.type === "file-upload");
  if (!uploadControl) throw new Error("Base New file form has no upload control");
  uploadControl.fieldID = uploadField.FieldID;
  uploadControl.binding = "Text4";
  uploadControl.label = uploadField.DisplayName;
  form.LayoutInResources = [{
    ID: layoutId,
    RefId: layoutId,
    Resource: JSON.stringify(resource),
  }];
  return form;
}

function folderUniqueName(parentId, title) {
  return `${parentId}_${title.toLowerCase()}`;
}

function createFolderRow(folderId, title, customFields) {
  const row = {
    ListDataID: folderId,
    Title: title,
    Bigint1: "0",
    Text1: "folder",
    Bigint2: "",
    Text2: "",
    Text3: folderUniqueName("0", title),
  };

  for (const field of customFields) row[field.FieldName] = "";
  return row;
}

function fieldForListArr(field, widthPercent = null) {
  const item = {
    DisplayName: "",
    FieldName: field.DisplayName,
    Field: field.FieldName,
  };
  if (widthPercent) {
    item.Attrs = {
      table: {
        cw: [null, widthPercent],
        cwu: [null, "%"],
      },
    };
  }
  return item;
}

function listArrForLibrary(library, fieldNames) {
  const fieldsByName = new Map(library.Defs.map((field) => [field.FieldName, field]));
  return fieldNames
    .map((fieldName, index) => {
      const field = fieldsByName.get(fieldName);
      if (!field) throw new Error(`Dashboard Doc library control references missing field ${library.ListModel.Title}.${fieldName}`);
      return fieldForListArr(field, index === 0 ? 40 : null);
    });
}

function docLibraryControlAttrs({ rootId, library, folder, fieldNames, caption }) {
  const attrs = {
    listarr: listArrForLibrary(library, fieldNames),
    data: {
      list: {
        AppID: library.ListModel.AppID,
        ListID: library.ListModel.ListID,
        Type: 16,
        Title: library.ListModel.Title,
        ListSetID: rootId,
      },
    },
    header: {
      normal: {
        bgcolor: "var(--c--neutral-light)",
      },
      ty: [null, "s-medium"],
    },
    body: {
      bdt: "1",
      bdw: [
        null,
        {
          top: null,
          right: null,
          bottom: 1,
          left: null,
        },
      ],
      bdc: "var(--c--neutral-light-active)",
    },
    common: {
      padding: [
        null,
        {
          top: 8,
          right: 8,
          bottom: 8,
          left: 8,
        },
      ],
      border: {
        normal: {
          radius: [
            null,
            {
              top: 8,
              right: 8,
              bottom: 8,
              left: 8,
            },
          ],
          type: "1",
          color: "var(--c--neutral-light-active)",
        },
      },
    },
  };
  if (folder) {
    attrs.data.folder = {
      path: `0/${folder.ListDataID}`,
      label: folder.Title,
    };
  }
  if (caption) {
    attrs.caption = {
      display: caption.display !== false,
      add: caption.add !== false,
      search: caption.search !== false,
      placeholder: caption.placeholder,
      addtext: caption.addtext,
      layout: caption.layout,
      op: caption.op || "modal",
    };
    attrs["caption-style"] = {
      title: {
        ty: [null, "base-medium"],
      },
      border: {
        type: "1",
        width: [
          null,
          {
            top: "--sp--s012",
            right: "--sp--s012",
            bottom: "--sp--s012",
            left: "--sp--s012",
          },
        ],
        radius: [
          null,
          {
            top: "--sp--s100",
            right: "--sp--s100",
            bottom: "--sp--s100",
            left: "--sp--s100",
          },
        ],
        color: "var(--c--neutral-light-active)",
      },
      search: {
        normal: {
          border: {
            radius: [
              null,
              {
                top: "--sp--s100",
                right: "--sp--s100",
                bottom: "--sp--s100",
                left: "--sp--s100",
              },
            ],
          },
        },
        pcolor: "var(--c--neutral-hover)",
      },
    };
  }
  return attrs;
}

function heading(title) {
  return {
    id: randomUUID(),
    type: "heading",
    nv_label: "Doc library section heading",
    attrs: {
      headc: {
        title: {
          value: title,
          variable: null,
        },
      },
      heads: {
        ty: [null, "h5-medium"],
        color: "var(--c--text)",
      },
      common: {
        positioning: {
          widthtype: [null, "2"],
        },
      },
    },
  };
}

function dashboardSection(title, control) {
  return {
    id: randomUUID(),
    type: "container",
    nv_label: "Doc library section",
    attrs: {
      style: {
        gap: [null, "--sp--s100"],
        direction: [null, "column"],
      },
      common: {
        padding: [
          null,
          {
            top: "--sp--s200",
            right: "--sp--s200",
            bottom: "--sp--s200",
            left: "--sp--s200",
          },
        ],
        background: {
          normal: {
            type: "classic",
            classic: {
              color: "var(--c--background)",
            },
          },
        },
      },
    },
    children: [
      heading(title),
      control,
    ],
  };
}

function createDocLibraryControl({ rootId, library, folder, fieldNames, caption }) {
  return {
    id: randomUUID(),
    type: "document-library",
    nv_label: "Doc library",
    attrs: docLibraryControlAttrs({ rootId, library, folder, fieldNames, caption }),
  };
}

function folderRowByTitle(library, title) {
  const folder = Object.values(library.ListDatas || {}).find((row) => row && row.Title === title && String(row.Text1 || "").toLowerCase() === "folder");
  if (!folder) throw new Error(`Missing folder ${library.ListModel.Title} / ${title}`);
  return folder;
}

function padding(value = "--sp--s0") {
  return [null, { top: value, right: value, bottom: value, left: value }];
}

function control(type, label, attrs = {}, children = [], extra = {}) {
  return { id: randomUUID(), type, label, attrs, children, ...extra };
}

function container(nvLabel, attrs = {}, children = [], extra = {}) {
  return control("container", "Container", attrs, children, { nv_label: nvLabel, ...extra });
}

function paragraph(value, nvLabel) {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, "s-regular"], color: "var(--c--neutral-dark-hover)" },
    common: { positioning: { widthtype: [null, "2"] } },
  }, [], { nv_label: nvLabel });
}

function card(children, nvLabel = "Form body") {
  return container(nvLabel, {
    style: { gap: [null, "--sp--s200"], direction: [null, "column"] },
    common: {
      padding: padding("--sp--s300"),
      background: { normal: { type: "classic", classic: { color: "var(--c--background)" } } },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)",
          radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }],
        },
      },
    },
  }, children);
}

function formShell(title, bodyChildren, { approval = false } = {}) {
  const bottom = approval ? [
    container("Form bottom", { style: { gap: [null, "--sp--s200"], direction: [null, "column"] } }, [
      control("workflowControlPanel", "Action Panel", { "show-task-panel": true, rejectValidation: true, align: "center" }, [], { nv_label: "Action panel" }),
      control("workflowHistory", "Flow History", { "show-history": true }, [], { nv_label: "Flow history" }),
    ]),
  ] : [];

  return {
    children: [
      container("Main", {
        style: { gap: [null, "--sp--s0"], direction: [null, "column"], justify_content: [null, "flex-start"], align_items: [null, "center"] },
      }, [
        container("Content", {
          style: { gap: [null, "--sp--s300"], direction: [null, "column"], justify_content: [null, "flex-start"] },
          common: { padding: padding("--sp--s300") },
        }, [
          card([
            heading(title),
            paragraph("Runtime test page for form-hosted Doc library controls.", `${title} helper`),
            ...bodyChildren,
          ], approval ? "Form body" : "Content card"),
          ...bottom,
        ]),
      ]),
    ],
    attrs: {
      container: { cw: "2", padding: padding("--sp--s0") },
      background: { type: "classic", classic: { color: "var(--c--neutral-light)" } },
    },
    title,
    filterVars: [],
    ver: 2,
    tempVars: [],
  };
}

function listFieldControl(field, readonly = false) {
  const item = {
    id: randomUUID(),
    type: field.Type,
    label: field.DisplayName,
    binding: field.FieldName,
    displayLabel: [null, true],
    attrs: parseRules(field),
    nv_label: `${field.DisplayName} field`,
  };
  if (readonly) item.readonly = true;
  return item;
}

function approvalInput(binding, label, type = "input", attrs = {}, extra = {}) {
  return {
    id: randomUUID(),
    type,
    label,
    binding,
    displayLabel: true,
    attrs,
    nv_label: `${label} control`,
    ...extra,
  };
}

function createListField(listId, fieldId, index, fieldName, displayName, fieldType, type, rules = {}) {
  const isTitle = fieldName === "Title";
  return {
    FieldID: fieldId,
    ListID: listId,
    FieldName: fieldName,
    FieldType: fieldType,
    FieldIndex: isTitle ? 0 : index,
    DisplayName: displayName,
    InternalName: fieldName,
    DisplayName_EN: null,
    Type: type,
    Status: isTitle ? 0 : 1,
    Category: 0,
    DefaultValue: null,
    Rules: stringifyRules(rules),
    AppID: APP_ID,
    IsSort: isTitle,
    IsIndex: isTitle,
    IsFilter: ["Title", "Text1", "Text2", "Text3"].includes(fieldName),
    IsIndexCreated: false,
    IsSystem: isTitle,
    IsUnique: false,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
    Ext1: null,
    Ext2: null,
    Ext3: null,
  };
}

function createDataListView(layoutId, listId, fields, title = "All Tasks") {
  const visible = fields.filter((field) => field.Type !== "textarea");
  return {
    LayoutID: layoutId,
    ListID: listId,
    Type: 0,
    Title: title,
    LayoutView: JSON.stringify({
      layout: visible.map((field, index) => viewColumn(field, index + 1, true)),
      query: visible.map(viewQuery),
      sort: [{ SortName: "Title", SortByDesc: false }],
      filter: [],
      rowColor: [],
    }),
    Ext1: JSON.stringify({ Url: title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "all" }),
    Ext2: null,
    Ext3: null,
    IsDefault: true,
    IsItemPerm: false,
    LayoutInResources: null,
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
  };
}

function createDataListCustomForm(layoutId, listId, title, fields, docControl, readonly = false) {
  const formJson = formShell(title, [
    ...fields.map((field) => listFieldControl(field, readonly)),
    heading("Related document library"),
    docControl,
  ]);
  return {
    LayoutID: layoutId,
    ListID: listId,
    Type: 1,
    Title: title,
    LayoutView: null,
    Ext1: JSON.stringify({ Url: title.toLowerCase().replace(/[^a-z0-9]+/g, "-") }),
    Ext2: JSON.stringify({ src: true }),
    Ext3: null,
    IsDefault: false,
    IsItemPerm: false,
    LayoutInResources: [{ ID: layoutId, RefId: layoutId, Resource: JSON.stringify(formJson) }],
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
  };
}

function createReviewTasksList(rootId, company, projects) {
  const listId = nextId();
  const viewId = nextId();
  const newFormId = nextId();
  const editFormId = nextId();
  const viewFormId = nextId();
  const rowId = nextId();
  const fields = [
    createListField(listId, nextId(), 0, "Title", "Task Title", "Text", "input", { displayLabel: true }),
    createListField(listId, nextId(), 1, "Text1", "Related Department", "Text", "input", { displayLabel: true }),
    createListField(listId, nextId(), 2, "Text2", "Document Category", "Text", "input", { displayLabel: true }),
    createListField(listId, nextId(), 3, "Text3", "Status", "Text", "radio", { displayLabel: true, choices: ["Open", "In Review", "Completed"] }),
    createListField(listId, nextId(), 4, "Text4", "Owner", "Text", "input", { displayLabel: true }),
  ];
  const contractsControl = createDocLibraryControl({
    rootId,
    library: projects,
    folder: folderRowByTitle(projects, "Contracts"),
    fieldNames: ["Title", "Text5", "Text6", "Text7", "Text9", "Text10"],
    caption: {
      display: true,
      add: false,
      search: false,
      placeholder: "Search contracts",
      addtext: "New contract file",
      layout: projects.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "New file").LayoutID,
    },
  });
  const hrControl = createDocLibraryControl({
    rootId,
    library: company,
    folder: folderRowByTitle(company, "HR Policies"),
    fieldNames: ["Title", "Text5", "Text6", "Text7", "Datetime2"],
    caption: {
      display: true,
      add: true,
      search: true,
      placeholder: "Search HR policies",
      addtext: "New HR policy file",
      layout: company.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "New file").LayoutID,
    },
  });
  const layouts = [
    createDataListView(viewId, listId, fields),
    createDataListCustomForm(newFormId, listId, "New Review Task", fields, hrControl, false),
    createDataListCustomForm(editFormId, listId, "Edit Review Task", fields, contractsControl, false),
    createDataListCustomForm(viewFormId, listId, "View Review Task", fields, contractsControl, true),
  ];
  return {
    ListModel: {
      ListID: listId,
      ListSetID: rootId,
      AppID: APP_ID,
      Title: "Document Review Tasks",
      Description: "Runtime proof list for Doc library controls hosted in data-list custom forms.",
      Type: 1,
      ListType: 1,
      CustomType: `ListSite_${rootId}`,
      IconUrl: "{\"b\":\"#e6f0ff\",\"i\":\"fa-regular fa-list-check\",\"c\":\"#0065ff\"}",
      LayoutView: JSON.stringify({ add: newFormId, edit: editFormId, view: viewFormId, sortVer: 1 }),
      Created: GENERATED_AT,
      Modified: GENERATED_AT,
    },
    Defs: fields,
    Layouts: layouts,
    PublicForms: [],
    RemindRules: [],
    FlowMappings: [],
    ListDatas: {
      [rowId]: {
        ListDataID: rowId,
        Title: "Review contract folder access",
        Text1: "Project Management",
        Text2: "Contracts",
        Text3: "Open",
        Text4: "Document Center Team",
      },
    },
  };
}

function createDocumentLibraryHostedForm(rootId, targetLibrary, templates) {
  const uploadField = targetLibrary.Defs.find((field) => field.FieldName === "Text4");
  const layoutId = nextId();
  const templatesControl = createDocLibraryControl({
    rootId,
    library: templates,
    fieldNames: ["Title", "Text5", "Text6", "Text7"],
    caption: {
      display: true,
      add: false,
      search: false,
      placeholder: "Search templates",
      addtext: "New template",
      layout: templates.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "New file").LayoutID,
    },
  });
  const formJson = formShell("Policy File With Template Reference", [
    listFieldControl(uploadField, false),
    heading("Related templates"),
    templatesControl,
  ]);
  const layout = {
    LayoutID: layoutId,
    ListID: targetLibrary.ListModel.ListID,
    Type: 1,
    Title: "Policy File With Template Reference",
    LayoutView: null,
    Ext1: JSON.stringify({ Url: "policy-file-with-template-reference" }),
    Ext2: JSON.stringify({ src: true }),
    Ext3: null,
    IsDefault: false,
    IsItemPerm: false,
    LayoutInResources: [{ ID: layoutId, RefId: layoutId, Resource: JSON.stringify(formJson) }],
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
  };
  targetLibrary.Layouts.push(layout);
  targetLibrary.ListModel.LayoutView = JSON.stringify({
    add: layoutId,
    edit: layoutId,
    view: layoutId,
    sortVer: 1,
  });
  return layout;
}

function approvalVar(id, name, type = "text") {
  return { idx: `dlfh-var-${id.toLowerCase()}`, id, name, type, editable: true };
}

function varButton(varId, name) {
  return `<input type="button" data="\${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${varId}&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:${name}">`;
}

function createApprovalForm(rootId, company, projects) {
  const processId = nextId();
  const submitPageId = randomUUID();
  const reviewPageId = randomUUID();
  const startId = `dlfh-node-start-${processId}`;
  const reviewId = `dlfh-node-review-${processId}`;
  const endId = `dlfh-node-end-${processId}`;
  const rejectId = `dlfh-node-reject-${processId}`;
  const flowStartReview = `dlfh-flow-start-review-${processId}`;
  const flowApproved = `dlfh-flow-approved-${processId}`;
  const flowRejected = `dlfh-flow-rejected-${processId}`;
  const companyRootControl = createDocLibraryControl({
    rootId,
    library: company,
    fieldNames: ["Title", "Text5", "Text6", "Text7", "Datetime2"],
    caption: {
      display: true,
      add: true,
      search: true,
      placeholder: "Search policies",
      addtext: "New policy file",
      layout: company.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "New file").LayoutID,
    },
  });
  const hrFolderControl = createDocLibraryControl({
    rootId,
    library: company,
    folder: folderRowByTitle(company, "HR Policies"),
    fieldNames: ["Title", "Text5", "Text6", "Text7", "Datetime2"],
    caption: {
      display: true,
      add: false,
      search: false,
      placeholder: "Search HR policies",
      addtext: "New HR policy file",
      layout: company.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "New file").LayoutID,
    },
  });
  const contractsControl = createDocLibraryControl({
    rootId,
    library: projects,
    folder: folderRowByTitle(projects, "Contracts"),
    fieldNames: ["Title", "Text5", "Text6", "Text7", "Text9", "Text10"],
    caption: {
      display: true,
      add: true,
      search: true,
      placeholder: "Search contracts",
      addtext: "New contract file",
      layout: projects.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "New file").LayoutID,
    },
  });
  const submitForm = formShell("Document Review Request", [
    approvalInput("Requester", "Requester", "identity-picker", { default: "currentUser" }, { value: "CurrentUser", readonly: true }),
    approvalInput("Department", "Department", "input", { placeholder: "Department" }),
    approvalInput("DocumentCategory", "Document Category", "radio", { choices: ["Policy", "Contract", "Template"], displayStyle: "dropdown" }),
    approvalInput("Comments", "Comments", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Review notes" }),
    heading("Company Policies Root"),
    companyRootControl,
    heading("HR Policies Folder - disabled search/add"),
    hrFolderControl,
    heading("Project Contracts Folder"),
    contractsControl,
  ], { approval: true });
  submitForm.id = submitPageId;
  submitForm.pagetype = 1;
  const reviewForm = formShell("Document Review Task", [
    approvalInput("Requester", "Requester", "identity-picker", { default: "currentUser" }, { value: "CurrentUser", readonly: true }),
    approvalInput("Department", "Department", "input", { placeholder: "Department" }),
    approvalInput("DocumentCategory", "Document Category", "radio", { choices: ["Policy", "Contract", "Template"], displayStyle: "dropdown" }),
    approvalInput("Comments", "Comments", "textarea", { edit: { textarea_minrows: 3 }, placeholder: "Review notes" }),
    heading("Company Policies Root"),
    cloneWithFreshControlIds(companyRootControl),
    heading("HR Policies Folder - disabled search/add"),
    cloneWithFreshControlIds(hrFolderControl),
  ], { approval: true });
  reviewForm.id = reviewPageId;
  reviewForm.pagetype = 2;
  const def = {
    defkey: FORM_KEY,
    name: "Document Review Request",
    title: "Document Review Request",
    workflowType: "approval",
    graphposition: { x: 0, y: 0, width: 900, height: 520 },
    graphzoom: 1,
    pageurls: [
      {
        id: submitPageId,
        name: "Document Review Request",
        title: "Document Review Request",
        type: 1,
        pagetype: 1,
        formdef: submitForm,
      },
      {
        id: reviewPageId,
        name: "Document Review Task",
        title: "Document Review Task",
        type: 2,
        pagetype: 1,
        formdef: reviewForm,
      },
    ],
    variables: {
      basic: [
        approvalVar("Requester", "Requester", "user"),
        approvalVar("Department", "Department"),
        approvalVar("DocumentCategory", "Document Category"),
        approvalVar("Comments", "Comments"),
      ],
      listref: [],
      tempVars: [],
    },
    childshapes: [
      {
        resourceid: startId,
        stencil: { id: "StartNoneEvent" },
        properties: { name: "Start", taskurl: submitPageId },
        outgoing: [{ id: flowStartReview, resourceid: flowStartReview }],
        incoming: [],
        id: startId,
        date: 1760000000000,
        position: { x: 0, y: 100 },
      },
      {
        resourceid: reviewId,
        stencil: { id: "MultiAssignmentTask" },
        properties: {
          name: "Document Review",
          approveway: "allapprove",
          approvepercentage: 100,
          allowskip: true,
          isallowreassign: false,
          isallowsign: false,
          usertaskassignment: [{
            type: "user",
            method: "expression",
            value: varButton("Requester", "Requester"),
            title: `User:${varButton("Requester", "Requester")}`,
          }],
          taskurl: reviewPageId,
          duedatedefinition: 48,
          duedatetype: "hour",
        },
        outgoing: [
          { id: flowApproved, resourceid: flowApproved },
          { id: flowRejected, resourceid: flowRejected },
        ],
        incoming: [{ id: flowStartReview, resourceid: flowStartReview }],
        id: reviewId,
        date: 1760000000500,
        position: { x: 260, y: 100 },
      },
      {
        resourceid: endId,
        stencil: { id: "EndNoneEvent" },
        properties: { name: "End" },
        outgoing: [],
        incoming: [{ id: flowApproved, resourceid: flowApproved }],
        id: endId,
        date: 1760000001000,
        position: { x: 540, y: 100 },
      },
      {
        resourceid: rejectId,
        stencil: { id: "EndRejectEvent" },
        properties: { name: "Rejected" },
        outgoing: [],
        incoming: [{ id: flowRejected, resourceid: flowRejected }],
        id: rejectId,
        date: 1760000001500,
        position: { x: 540, y: 260 },
      },
      {
        resourceid: flowStartReview,
        stencil: { id: "SequenceFlow" },
        properties: { name: "Submit to Review", linetype: "rounded" },
        target: { id: reviewId, resourceid: reviewId },
        source: { id: startId, resourceid: startId },
        id: flowStartReview,
        date: 1760000002000,
      },
      {
        resourceid: flowApproved,
        stencil: { id: "SequenceFlow" },
        properties: {
          name: "Approved",
          documentation: "Approved",
          linetype: "rounded",
          conditioninfo: [{ key: "dlfh-approved", pre: "and", left: "Document Review:Outcome", op: "s.=", right: "Task outcome:Approved" }],
        },
        target: { id: endId, resourceid: endId },
        source: { id: reviewId, resourceid: reviewId },
        id: flowApproved,
        date: 1760000002100,
      },
      {
        resourceid: flowRejected,
        stencil: { id: "SequenceFlow" },
        properties: {
          name: "Rejected",
          documentation: "Rejected",
          linetype: "rounded",
          conditioninfo: [{ key: "dlfh-rejected", pre: "and", left: "Document Review:Outcome", op: "s.=", right: "Task outcome:Rejected" }],
        },
        target: { id: rejectId, resourceid: rejectId },
        source: { id: reviewId, resourceid: reviewId },
        id: flowRejected,
        date: 1760000002200,
      },
    ],
    ProcModelListID: processId,
    ProcModelAppID: APP_ID,
    ProcModelListSetID: rootId,
    AppListSetID: rootId,
    listSet: rootId,
    listInfo: null,
  };
  return {
    Name: "Document Review Request",
    Key: FORM_KEY,
    DefKey: FORM_KEY,
    WorkflowType: "2",
    Description: "Approval form runtime test for Doc library controls hosted inside form pages.",
    ListID: 0,
    ProcModelID: processId,
    ListSetID: rootId,
    AppListSetID: rootId,
    ProcModelListSetID: rootId,
    AppID: APP_ID,
    ImgResource: "{\"b\":\"#e6f0ff\",\"i\":\"fa-regular fa-file-lines\",\"c\":\"#0065ff\"}",
    DefResource: JSON.stringify(def),
  };
}

function createDocumentCenterDashboard(rootId, libraries) {
  const libraryByTitle = new Map(libraries.map((library) => [library.ListModel.Title, library]));
  const company = libraryByTitle.get("Company Policies");
  const projects = libraryByTitle.get("Project Documents");
  const templates = libraryByTitle.get("Templates and Forms");
  if (!company || !projects || !templates) throw new Error("Dashboard requires all three Enterprise Document Center libraries");

  const dashboardId = nextId();
  const templateNewFileForm = templates.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "New file");
  const page = {
    children: [
      {
        id: randomUUID(),
        type: "container",
        nv_label: "Content",
        attrs: {
          style: {
            gap: [null, "--sp--s300"],
            direction: [null, "column"],
            justify_content: [null, "flex-start"],
          },
          common: {
            padding: [
              null,
              {
                top: "--sp--s300",
                right: "--sp--s300",
                bottom: "--sp--s300",
                left: "--sp--s300",
              },
            ],
            background: {
              normal: {
                type: "classic",
                classic: {
                  color: "var(--c--neutral-light)",
                },
              },
            },
          },
        },
        children: [
          {
            id: randomUUID(),
            type: "container",
            nv_label: "Page header",
            attrs: {
              style: {
                gap: [null, "--sp--s100"],
                direction: [null, "column"],
              },
            },
            children: [
              {
                id: randomUUID(),
                type: "heading",
                nv_label: "Dashboard title",
                attrs: {
                  headc: {
                    title: {
                      value: "Document Center",
                      variable: null,
                    },
                  },
                  heads: {
                    ty: [null, "h2-bold"],
                    color: "var(--c--text)",
                  },
                  common: {
                    positioning: {
                      widthtype: [null, "2"],
                    },
                  },
                },
              },
              {
                id: randomUUID(),
                type: "text-editor",
                nv_label: "Dashboard description",
                attrs: {
                  value: "<p>Browse generated document libraries and selected folders.</p>",
                  common: {
                    padding: [
                      null,
                      {
                        top: "--sp--s0",
                        right: "--sp--s0",
                        bottom: "--sp--s0",
                        left: "--sp--s0",
                      },
                    ],
                    positioning: {
                      widthtype: [null, "2"],
                    },
                  },
                  ty: [null, "base-regular"],
                },
              },
            ],
          },
          dashboardSection("Company Policies Root", createDocLibraryControl({
            rootId,
            library: company,
            fieldNames: ["Title", "Text5", "Text6", "Text7", "Datetime2"],
            caption: {
              display: true,
              add: true,
              search: true,
              placeholder: "Search policies",
              addtext: "New policy file",
              layout: company.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "New file").LayoutID,
            },
          })),
          dashboardSection("HR Policies Folder", createDocLibraryControl({
            rootId,
            library: company,
            folder: folderRowByTitle(company, "HR Policies"),
            fieldNames: ["Title", "Text5", "Text6", "Text7", "Datetime2"],
            caption: {
              display: true,
              add: true,
              search: true,
              placeholder: "Search HR policies",
              addtext: "New HR policy file",
              layout: company.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "New file").LayoutID,
            },
          })),
          dashboardSection("Project Contracts Folder", createDocLibraryControl({
            rootId,
            library: projects,
            folder: folderRowByTitle(projects, "Contracts"),
            fieldNames: ["Title", "Text5", "Text6", "Text7", "Text9", "Text10"],
            caption: {
              display: true,
              add: true,
              search: true,
              placeholder: "Search contracts",
              addtext: "New contract file",
              layout: projects.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "New file").LayoutID,
            },
          })),
          dashboardSection("Templates Root", createDocLibraryControl({
            rootId,
            library: templates,
            fieldNames: ["Title", "Text5", "Text6", "Text7"],
            caption: {
              display: true,
              add: true,
              search: true,
              placeholder: "Search templates",
              addtext: "New template",
              layout: templateNewFileForm.LayoutID,
            },
          })),
        ],
      },
    ],
    attrs: {
      hideHeaderAll: true,
      container: {
        padding: [
          null,
          {
            top: "--sp--s0",
            right: "--sp--s0",
            bottom: "--sp--s0",
            left: "--sp--s0",
          },
        ],
      },
    },
    title: "Document Center",
    ver: "2.0",
    filterVars: [],
    tempVars: [],
    exts: {},
    filter: [],
    actions: [],
    formAction: [],
  };

  return {
    Type: 103,
    LayoutID: dashboardId,
    ListID: rootId,
    Title: "Document Center",
    Description: "Dashboard with Doc library controls linked to generated document libraries and folders.",
    LayoutView: null,
    Ext1: JSON.stringify({ Url: "document-center" }),
    Ext2: JSON.stringify({ src: true }),
    Ext3: null,
    IsDefault: false,
    IsItemPerm: false,
    LayoutInResources: [{
      ID: dashboardId,
      RefId: dashboardId,
      Resource: JSON.stringify(page),
    }],
    Created: GENERATED_AT,
    Modified: GENERATED_AT,
  };
}

function createLibrary(baseLibrary, spec, rootId, baseDefaultView, baseForm, textBaseField) {
  const listId = nextId();
  const defaultViewId = nextId();
  const formId = nextId();
  const baseFieldNames = ["Title", "Bigint1", "Text1", "Bigint2", "Text2", "Text3", "Text4"];
  const fieldIdByName = new Map(baseFieldNames.map((fieldName) => [fieldName, nextId()]));

  const library = clone(baseLibrary);
  library.ListModel.ListID = listId;
  library.ListModel.Title = spec.title;
  library.ListModel.Description = spec.purpose;
  library.ListModel.Type = 16;
  library.ListModel.CustomType = `ListSite_${rootId}`;
  library.ListModel.Created = GENERATED_AT;
  library.ListModel.Modified = GENERATED_AT;
  library.ListModel.LayoutView = null;
  library.ListDatas = {};
  library.FlowMappings = [];
  library.PublicForms = [];
  library.RemindRules = [];

  library.Defs = library.Defs
    .filter((field) => baseFieldNames.includes(field.FieldName))
    .sort((a, b) => baseFieldNames.indexOf(a.FieldName) - baseFieldNames.indexOf(b.FieldName))
    .map((field) => {
      const cloned = clone(field);
      cloned.FieldID = fieldIdByName.get(field.FieldName);
      cloned.ListID = listId;
      cloned.Created = GENERATED_AT;
      cloned.Modified = GENERATED_AT;
      return cloned;
    });

  const customFields = spec.fields.map((fieldSpec, index) => createCustomField(
    textBaseField,
    fieldSpec,
    listId,
    nextId(),
    5 + index,
  ));
  library.Defs.push(...customFields);
  library.ListDatas = Object.fromEntries((spec.folders || []).map((folderTitle) => {
    const folderId = nextId();
    return [folderId, createFolderRow(folderId, folderTitle, customFields)];
  }));

  const uploadField = library.Defs.find((field) => field.FieldName === "Text4");
  library.Layouts = [
    {
      ...clone(baseDefaultView),
      LayoutID: defaultViewId,
      ListID: listId,
      Type: 0,
      Title: "",
      LayoutView: "",
      Created: GENERATED_AT,
      Modified: GENERATED_AT,
      Ext1: JSON.stringify({ Url: "default" }),
      IsDefault: true,
      LayoutInResources: null,
    },
    createUploadForm(baseForm, listId, formId, "New file", uploadField),
  ];

  for (const viewSpec of spec.views) {
    const filter = viewSpec.statusEquals ? [{
      key: viewSpec.key,
      pre: "and",
      left: viewSpec.statusField || "Text10",
      op: "0",
      right: viewSpec.statusEquals,
    }] : [];
    const sort = viewSpec.sort || [];
    library.Layouts.push(createView({
      layoutId: nextId(),
      listId,
      title: viewSpec.title,
      url: viewSpec.url,
      fields: library.Defs,
      visibleNames: viewSpec.visible,
      sort,
      filter,
    }, baseDefaultView));
  }

  return library;
}

const librarySpecs = [
  {
    title: "Company Policies",
    purpose: "Store HR, IT, Finance, and compliance policies.",
    fields: [
      { fieldName: "Text5", displayName: "Department", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text6", displayName: "Policy Category", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Datetime1", displayName: "Effective Date", fieldType: "Datetime", controlType: "datepicker", rules: { displayLabel: true, showtime: false, dateformat: "0" } },
      { fieldName: "Datetime2", displayName: "Review Date", fieldType: "Datetime", controlType: "datepicker", rules: { displayLabel: true, showtime: false, dateformat: "0" } },
      { fieldName: "Text7", displayName: "Owner", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text8", displayName: "Status", fieldType: "Text", controlType: "radio", rules: { displayLabel: true, choices: ["Draft", "Active", "Pending Review", "Archived"] } },
    ],
    folders: [
      "HR Policies",
      "IT Policies",
      "Finance Policies",
      "Compliance Policies",
    ],
    views: [
      { title: "All Policies", url: "all-policies", visible: ["Title", "Text5", "Text6", "Datetime1", "Datetime2", "Text7", "Text8"], sort: [{ SortName: "Title", SortByDesc: false }] },
      { title: "Active Policies", url: "active-policies", visible: ["Title", "Text5", "Text6", "Datetime1", "Text7", "Text8"], statusField: "Text8", statusEquals: "Active", key: "company-policies-active" },
      { title: "Policies Pending Review", url: "policies-pending-review", visible: ["Title", "Text5", "Text6", "Datetime2", "Text7", "Text8"], statusField: "Text8", statusEquals: "Pending Review", key: "company-policies-pending-review" },
      { title: "By Department", url: "policies-by-department", visible: ["Text5", "Title", "Text6", "Text7", "Text8"], sort: [{ SortName: "Text5", SortByDesc: false }] },
    ],
  },
  {
    title: "Project Documents",
    purpose: "Store project-related files such as requirements, contracts, meeting notes, and delivery documents.",
    fields: [
      { fieldName: "Text5", displayName: "Project Name", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text6", displayName: "Document Category", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text7", displayName: "Customer", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text8", displayName: "Version", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text9", displayName: "Owner", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text10", displayName: "Status", fieldType: "Text", controlType: "radio", rules: { displayLabel: true, choices: ["Draft", "Active", "Latest", "Archived"] } },
    ],
    folders: [
      "Requirements",
      "Contracts",
      "Meeting Notes",
      "Deliverables",
    ],
    views: [
      { title: "All Project Documents", url: "all-project-documents", visible: ["Title", "Text5", "Text6", "Text7", "Text8", "Text9", "Text10"], sort: [{ SortName: "Text5", SortByDesc: false }] },
      { title: "By Project", url: "by-project", visible: ["Text5", "Title", "Text6", "Text8", "Text9", "Text10"], sort: [{ SortName: "Text5", SortByDesc: false }] },
      { title: "Contracts", url: "contracts", visible: ["Title", "Text5", "Text7", "Text8", "Text9", "Text10"], statusField: "Text6", statusEquals: "Contracts", key: "project-documents-contracts" },
      { title: "Latest Versions", url: "latest-versions", visible: ["Title", "Text5", "Text6", "Text8", "Text9", "Text10"], statusField: "Text10", statusEquals: "Latest", key: "project-documents-latest" },
    ],
  },
  {
    title: "Templates and Forms",
    purpose: "Store reusable company templates and standard forms.",
    fields: [
      { fieldName: "Text5", displayName: "Template Type", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text6", displayName: "Department", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text7", displayName: "Version", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text8", displayName: "Approved By", fieldType: "Text", controlType: "input", rules: { displayLabel: true } },
      { fieldName: "Text9", displayName: "Status", fieldType: "Text", controlType: "radio", rules: { displayLabel: true, choices: ["Draft", "Active", "Retired"] } },
    ],
    folders: [
      "HR Forms",
      "Finance Forms",
      "Project Templates",
      "Legal Templates",
    ],
    views: [
      { title: "All Templates", url: "all-templates", visible: ["Title", "Text5", "Text6", "Text7", "Text8", "Text9"], sort: [{ SortName: "Title", SortByDesc: false }] },
      { title: "Active Templates", url: "active-templates", visible: ["Title", "Text5", "Text6", "Text7", "Text8", "Text9"], statusField: "Text9", statusEquals: "Active", key: "templates-active" },
      { title: "By Department", url: "templates-by-department", visible: ["Text6", "Title", "Text5", "Text7", "Text9"], sort: [{ SortName: "Text6", SortByDesc: false }] },
    ],
  },
];

let idOffset = 0;
const decoded = decodeYap(SOURCE_EXPORT);
const sourceData = decoded.data;
const sourceRoot = sourceData.Item;
const sourceLibrary = sourceData.Childs.find((child) => Number(child.ListModel?.Type) === 16 && child.ListModel?.Title === "New Document Library");
if (!sourceLibrary) throw new Error("New Document Library base resource was not found in source export");

const rootId = nextId();
const root = clone(sourceRoot);
root.ListModel.ListID = rootId;
root.ListModel.Title = TITLE;
root.ListModel.Description = DESCRIPTION;
root.ListModel.IconUrl = "{\"b\":\"#2d7ff9\",\"i\":\"*text*\",\"c\":\"#fff\"}";
root.ListModel.Created = GENERATED_AT;
root.ListModel.Modified = GENERATED_AT;
root.ListModel.CustomType = "";
root.Layouts = [];
root.Defs = [];
root.ListDatas = {};

const baseDefaultView = sourceLibrary.Layouts.find((layout) => Number(layout.Type) === 0);
const baseForm = sourceLibrary.Layouts.find((layout) => Number(layout.Type) === 1 && layout.Title === "New file");
const textBaseField = sourceLibrary.Defs.find((field) => field.FieldName === "Title");
if (!baseDefaultView || !baseForm || !textBaseField) throw new Error("Base document library is missing required view/form/field templates");

const data = {
  Item: root,
  Childs: librarySpecs.map((spec) => createLibrary(sourceLibrary, spec, rootId, baseDefaultView, baseForm, textBaseField)),
  Forms: [],
  OtherModules: [],
  FormReports: [],
  DataReports: [],
  FormNewReports: [],
  AppGroups: [],
  AppThemes: [],
  AppTags: [],
  AppMetadatas: [],
  AppComponents: [],
  PortalInfo: null,
};

const libraryByTitle = new Map(data.Childs.map((library) => [library.ListModel.Title, library]));
const companyLibrary = libraryByTitle.get("Company Policies");
const projectLibrary = libraryByTitle.get("Project Documents");
const templateLibrary = libraryByTitle.get("Templates and Forms");
if (!companyLibrary || !projectLibrary || !templateLibrary) throw new Error("Expected Enterprise Document Center libraries were not generated");

const documentLibraryHostedForm = createDocumentLibraryHostedForm(rootId, companyLibrary, templateLibrary);
const reviewTasksList = createReviewTasksList(rootId, companyLibrary, projectLibrary);
data.Childs.push(reviewTasksList);
const approvalForm = createApprovalForm(rootId, companyLibrary, projectLibrary);
data.Forms = [approvalForm];

const documentCenterDashboard = createDocumentCenterDashboard(rootId, data.Childs);
root.Layouts = [documentCenterDashboard];

root.ListModel.LayoutView = JSON.stringify({
  add: "default",
  edit: "default",
  view: "default",
  sort: [
    {
      AppID: 41,
      ListID: documentCenterDashboard.LayoutID,
      ListSetID: rootId,
      Type: 103,
      Title: documentCenterDashboard.Title,
    },
    ...data.Childs.map((child) => ({
      AppID: 41,
      ListID: child.ListModel.ListID,
      ListSetID: rootId,
      Type: child.ListModel.Type,
      Title: child.ListModel.Title,
    })),
    {
      AppID: "41",
      Title: approvalForm.Name,
      ListID: FORM_KEY,
      ListSetID: rootId,
      Type: 105,
      Icon: "fa-regular fa-file-lines",
    },
  ],
  sortVer: 1,
});

function collectIds(value, ids = new Set(), key = "") {
  if (["TenantID", "CreatedBy", "ModifiedBy"].includes(key)) return ids;
  if (typeof value === "string" && LARGE_INTEGER_RE.test(value)) ids.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectIds(item, ids));
  else if (value && typeof value === "object") Object.entries(value).forEach(([childKey, child]) => collectIds(child, ids, childKey));
  return ids;
}

const resource = {
  ...clone(decoded.resource),
  MainListType: 1024,
  AppID: 41,
  ReportIds: [],
  FormKeys: [FORM_KEY],
  SimplePortal: null,
  ReplaceIds: [
    ...[...collectIds(data)].filter((id) => id.startsWith(String(ID_BASE).slice(0, 4))),
    FORM_KEY,
  ].filter((value, index, all) => value && all.indexOf(value) === index).sort(),
  Data: JSON.stringify(data),
};

fs.writeFileSync(OUT_APP_DEF, `${JSON.stringify(data, null, 2)}\n`);
fs.writeFileSync(OUT_RESOURCE, `${JSON.stringify(resource, null, 2)}\n`);

const buildOutput = execFileSync("node", [
  "build-yap-wrapper.js",
  OUT_RESOURCE,
  OUT_YAP,
  "--title",
  TITLE,
  "--description",
  DESCRIPTION,
], { encoding: "utf8" });

const report = {
  status: "pass",
  source: SOURCE_EXPORT,
  strategy: "document-library-form-host-doc-library-controls",
  outputs: { resource: OUT_RESOURCE, appDef: OUT_APP_DEF, yap: OUT_YAP },
  rootId,
  generatedIdFamily: String(ID_BASE).slice(0, 4),
  folderRowsGenerated: true,
  folderPlanRuntimeOnly: false,
  dashboard: {
    title: documentCenterDashboard.Title,
    layoutId: documentCenterDashboard.LayoutID,
    controls: [
      "Company Policies Root",
      "HR Policies Folder",
      "Project Contracts Folder",
      "Templates Root",
    ],
    dynamicFolderControlGenerated: false,
    addOffControlGenerated: true,
  },
  formHosts: {
    approvalForm: {
      name: approvalForm.Name,
      key: FORM_KEY,
      controls: [
        "Company Policies Root",
        "HR Policies Folder - disabled search/add",
        "Project Contracts Folder",
      ],
      dynamicFolderControlGenerated: false,
    },
    dataListForms: {
      list: reviewTasksList.ListModel.Title,
      forms: reviewTasksList.Layouts.filter((layout) => Number(layout.Type) === 1).map((layout) => layout.Title),
      disabledSearchAddControlGenerated: true,
    },
    documentLibraryForm: {
      library: companyLibrary.ListModel.Title,
      form: documentLibraryHostedForm.Title,
      assignedToAddEditView: true,
      disabledSearchAddControlGenerated: true,
    },
  },
  documentLibraries: data.Childs.filter((child) => Number(child.ListModel.Type) === 16).map((child) => ({
    title: child.ListModel.Title,
    listId: child.ListModel.ListID,
    type: child.ListModel.Type,
    nativeFields: child.Defs.slice(0, 7).map((field) => field.FieldName),
    customFields: child.Defs.slice(7).map((field) => ({
      fieldName: field.FieldName,
      displayName: field.DisplayName,
      fieldType: field.FieldType,
      controlType: field.Type,
    })),
    folders: Object.values(child.ListDatas || {}).map((row) => ({
      listDataId: row.ListDataID,
      title: row.Title,
      parentId: row.Bigint1,
      type: row.Text1,
      uniqueName: row.Text3,
    })),
    views: child.Layouts.filter((layout) => Number(layout.Type) === 0).map((layout) => ({
      title: layout.Title || "Default",
      layoutView: layout.LayoutView,
    })),
    forms: child.Layouts.filter((layout) => Number(layout.Type) === 1).map((layout) => layout.Title),
    containsListRows: Object.keys(child.ListDatas || {}).length > 0,
    containsUploadedRows: Object.values(child.ListDatas || {}).some((row) => Boolean(row && row.Text4)),
  })),
  dataLists: data.Childs.filter((child) => Number(child.ListModel.Type) !== 16).map((child) => ({
    title: child.ListModel.Title,
    listId: child.ListModel.ListID,
    type: child.ListModel.Type,
    fields: child.Defs.map((field) => field.FieldName),
    forms: child.Layouts.filter((layout) => Number(layout.Type) === 1).map((layout) => layout.Title),
    sampleRows: Object.keys(child.ListDatas || {}).length,
  })),
  build: JSON.parse(buildOutput),
};
fs.writeFileSync(OUT_REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
