import fs from "node:fs";
import zlib from "node:zlib";

const OUT_DIR = "/Users/Renger/Downloads";
const GZIP_PREFIX = "[______gizp______]";
const APP_TITLE = "Vendor Onboarding Import Isolation";
const ICON_URL = "{\"b\":\"#E6F7FF\",\"i\":\"fa-regular fa-building-shield\",\"c\":\"#008DA6\"}";
const CREATED = "2026-05-29T02:20:00Z";
const APP_ID = "7602000000000000001";
const ROOT_LIST_ID = "7602000000000000002";
let controlSeq = 0;

const variants = [
  {
    file: "vendor-onboarding-isolation.v1-data-list-only.yap",
    title: "Vendor Onboarding Isolation V1 - Data List Only",
    description: "One schema-direct Vendors data list with minimal safe fields. No dashboards, custom forms, advanced controls, or lookup relationships.",
    lists: ["vendors-minimal"],
    lookups: false,
    forms: false,
    dashboard: null,
  },
  {
    file: "vendor-onboarding-isolation.v2-five-lists-no-lookups.yap",
    title: "Vendor Onboarding Isolation V2 - Five Lists No Lookups",
    description: "Five schema-direct data lists with fields only. No lookup relationships, dashboards, custom forms, or advanced controls.",
    lists: ["vendors", "documents-no-lookup", "reviews-no-lookup", "tasks-no-lookup", "activity-no-lookup"],
    lookups: false,
    forms: false,
    dashboard: null,
  },
  {
    file: "vendor-onboarding-isolation.v3-five-lists-with-lookups.yap",
    title: "Vendor Onboarding Isolation V3 - Five Lists With Lookups",
    description: "Five schema-direct data lists with lookup relationships to Vendors. No dashboards, custom forms, or advanced controls.",
    lists: ["vendors", "documents", "reviews", "tasks", "activity"],
    lookups: true,
    forms: false,
    dashboard: null,
  },
  {
    file: "vendor-onboarding-isolation.v4-simple-forms.yap",
    title: "Vendor Onboarding Isolation V4 - Simple Forms",
    description: "Five schema-direct data lists with lookup relationships and simple list forms. No rich dashboard or advanced controls.",
    lists: ["vendors", "documents", "reviews", "tasks", "activity"],
    lookups: true,
    forms: true,
    dashboard: null,
  },
  {
    file: "vendor-onboarding-isolation.v5-simple-dashboard-table.yap",
    title: "Vendor Onboarding Isolation V5 - Simple Dashboard Table",
    description: "Five schema-direct data lists with simple forms plus one dashboard Data table with configured columns. No Kanban, Collection, Timeline, or advanced controls.",
    lists: ["vendors", "documents", "reviews", "tasks", "activity"],
    lookups: true,
    forms: true,
    dashboard: "table",
  },
  {
    file: "vendor-onboarding-isolation.v6-dashboard-kanban.yap",
    title: "Vendor Onboarding Isolation V6 - Dashboard Kanban",
    description: "Five schema-direct data lists with simple forms, one dashboard Data table, and one Kanban with meaningful fields. No document embed, sub list, print page, or timeline controls.",
    lists: ["vendors", "documents", "reviews", "tasks", "activity"],
    lookups: true,
    forms: true,
    dashboard: "kanban",
  },
];

const listCatalog = {
  "vendors-minimal": {
    title: "Vendors",
    id: "7602000000000001000",
    fields: [
      textField("Vendor Name", "input"),
      textField("Onboarding Status", "select", ["Draft", "Procurement Review", "Compliance Review", "Approved"]),
      textField("Risk Level", "select", ["Low", "Medium", "High"]),
      textField("Owner", "input"),
      dateField("Created Date"),
    ],
  },
  vendors: {
    title: "Vendors",
    id: "7602000000000001000",
    fields: [
      textField("Vendor Name", "input"),
      textField("Vendor Type", "select", ["Supplier", "Contractor", "Service Provider"]),
      textField("Country / Region", "select", ["United States", "Singapore", "United Kingdom"]),
      textField("Primary Contact", "input"),
      textField("Email", "input"),
      textField("Phone", "input"),
      textField("Risk Level", "select", ["Low", "Medium", "High"]),
      textField("Onboarding Status", "select", ["Draft", "Procurement Review", "Compliance Review", "Legal Review", "Finance Review", "Approved"]),
      textField("Compliance Status", "select", ["Pending", "In Review", "Compliant", "Action Required"]),
      textField("Contract Status", "select", ["Not Started", "In Review", "Approved", "Expired"]),
      textField("Payment Terms", "select", ["Net 15", "Net 30", "Net 45", "Net 60"]),
      decimalField("Annual Spend Estimate"),
      dateField("Renewal Date"),
      textField("Owner", "input"),
      dateField("Created Date"),
      dateField("Last Review Date"),
    ],
  },
  "documents-no-lookup": {
    title: "Vendor Documents",
    id: "7602000000000002000",
    fields: [
      textField("Vendor", "input"),
      textField("Document Type", "select", ["Tax Form", "Insurance", "Certification", "Contract"]),
      textField("File Attachment", "file-upload"),
      dateField("Expiry Date"),
      textField("Review Status", "select", ["Pending", "Approved", "Rejected", "Expired"]),
      textField("Reviewer", "input"),
      textField("Notes", "textarea"),
    ],
  },
  documents: {
    title: "Vendor Documents",
    id: "7602000000000002000",
    fields: [
      lookupField("Vendor"),
      textField("Document Type", "select", ["Tax Form", "Insurance", "Certification", "Contract"]),
      textField("File Attachment", "file-upload"),
      dateField("Expiry Date"),
      textField("Review Status", "select", ["Pending", "Approved", "Rejected", "Expired"]),
      textField("Reviewer", "input"),
      textField("Notes", "textarea"),
    ],
  },
  "reviews-no-lookup": {
    title: "Compliance Reviews",
    id: "7602000000000003000",
    fields: [
      textField("Vendor", "input"),
      textField("Review Type", "select", ["Sanctions", "Insurance", "Certification", "Financial"]),
      decimalField("Risk Score"),
      textField("Findings", "textarea"),
      textField("Required Actions", "textarea"),
      textField("Review Status", "select", ["Pending", "In Review", "Passed", "Action Required"]),
      textField("Reviewer", "input"),
      dateField("Review Date"),
    ],
  },
  reviews: {
    title: "Compliance Reviews",
    id: "7602000000000003000",
    fields: [
      lookupField("Vendor"),
      textField("Review Type", "select", ["Sanctions", "Insurance", "Certification", "Financial"]),
      decimalField("Risk Score"),
      textField("Findings", "textarea"),
      textField("Required Actions", "textarea"),
      textField("Review Status", "select", ["Pending", "In Review", "Passed", "Action Required"]),
      textField("Reviewer", "input"),
      dateField("Review Date"),
    ],
  },
  "tasks-no-lookup": {
    title: "Vendor Tasks",
    id: "7602000000000004000",
    fields: [
      textField("Vendor", "input"),
      textField("Task Name", "input"),
      textField("Task Type", "select", ["Document", "Compliance", "Legal", "Finance"]),
      textField("Assigned To", "input"),
      dateField("Due Date"),
      textField("Status", "select", ["Open", "In Progress", "Done", "Blocked"]),
      textField("Priority", "select", ["Low", "Medium", "High"]),
      textField("Notes", "textarea"),
    ],
  },
  tasks: {
    title: "Vendor Tasks",
    id: "7602000000000004000",
    fields: [
      lookupField("Vendor"),
      textField("Task Name", "input"),
      textField("Task Type", "select", ["Document", "Compliance", "Legal", "Finance"]),
      textField("Assigned To", "input"),
      dateField("Due Date"),
      textField("Status", "select", ["Open", "In Progress", "Done", "Blocked"]),
      textField("Priority", "select", ["Low", "Medium", "High"]),
      textField("Notes", "textarea"),
    ],
  },
  "activity-no-lookup": {
    title: "Vendor Activity",
    id: "7602000000000005000",
    fields: [
      textField("Vendor", "input"),
      textField("Activity Type", "select", ["Request", "Review", "Approval", "Document"]),
      textField("Summary", "input"),
      textField("Actor", "input"),
      dateField("Activity Date"),
      textField("Notes", "textarea"),
    ],
  },
  activity: {
    title: "Vendor Activity",
    id: "7602000000000005000",
    fields: [
      lookupField("Vendor"),
      textField("Activity Type", "select", ["Request", "Review", "Approval", "Document"]),
      textField("Summary", "input"),
      textField("Actor", "input"),
      dateField("Activity Date"),
      textField("Notes", "textarea"),
    ],
  },
};

function textField(displayName, controlType, options = []) {
  return { displayName, fieldType: "Text", controlType, options };
}

function dateField(displayName) {
  return { displayName, fieldType: "DateTime", controlType: "datepicker" };
}

function decimalField(displayName) {
  return { displayName, fieldType: "Decimal", controlType: "input_number" };
}

function lookupField(displayName) {
  return { displayName, fieldType: "Text", controlType: "lookup", lookup: true };
}

function makeListModel(list) {
  return {
    TenantID: 0,
    AppID: APP_ID,
    ListID: list.id,
    Title: list.title,
    Description: `${list.title} isolation data list.`,
    Status: 1,
    IsItemPerm: false,
    IsVerRecord: false,
    HasComment: false,
    IconUrl: ICON_URL,
    TableCode: "flowcraft",
    IndexCode: "",
    Created: CREATED,
    Modified: CREATED,
    CreatedBy: 0,
    ModifiedBy: 0,
    Ext1: "",
    Ext2: "",
    Ext3: "",
    Perm: 0,
    Type: 1,
    Flags: 1,
    CustomType: "",
    WorkspaceID: "0",
    LayoutView: "",
    IsBreakInherit: false,
    IsDataSeparate: false,
    HasDeleted: false,
    HasEnabled: true,
    HasDisabled: false,
    AdvanceList: [],
  };
}

function makeRootModel(title, dashboardLayoutId) {
  const layoutView = dashboardLayoutId ? JSON.stringify({
    sortVer: 1,
    sort: [{
      AppID: APP_ID,
      ListID: dashboardLayoutId,
      ListSetID: ROOT_LIST_ID,
      Type: 103,
      IsHidden: false,
      Title: "Vendor Management Dashboard",
      Icon: "fa-regular fa-gauge-high",
    }],
  }) : "";
  return {
    TenantID: 0,
    AppID: APP_ID,
    ListID: ROOT_LIST_ID,
    Title: title,
    Description: "Import isolation app shell.",
    Status: 1,
    IsItemPerm: false,
    IsVerRecord: false,
    HasComment: false,
    IconUrl: ICON_URL,
    TableCode: "flowcraft",
    IndexCode: "",
    Created: CREATED,
    Modified: CREATED,
    CreatedBy: 0,
    ModifiedBy: 0,
    Ext1: "",
    Ext2: "",
    Ext3: "",
    Perm: 0,
    Type: 1024,
    Flags: 1,
    CustomType: "",
    WorkspaceID: "0",
    LayoutView: layoutView,
    IsBreakInherit: false,
    IsDataSeparate: false,
    HasDeleted: false,
    HasEnabled: true,
    HasDisabled: false,
    AdvanceList: [],
  };
}

function makeFields(list) {
  return list.fields.map((field, index) => {
    const prefix = field.fieldType === "DateTime" ? "DateTime" : field.fieldType === "Decimal" ? "Decimal" : "Text";
    const fieldName = `${prefix}${index}`;
    const options = Array.isArray(field.options) ? field.options : [];
    const rules = field.lookup ? {
      appid: APP_ID,
      listsetid: ROOT_LIST_ID,
      listid: listCatalog.vendors.id,
      listfield: "Text0",
      displayField: "Text0",
    } : options.length ? { choices: options.map((label) => ({ label, value: label })) } : {};
    return {
      FieldID: `${BigInt(list.id) + BigInt(index + 1)}`,
      ListID: list.id,
      FieldName: fieldName,
      FieldType: field.fieldType,
      FieldIndex: index,
      DisplayName: field.displayName,
      InternalName: internalName(field.displayName),
      DisplayName_EN: field.displayName,
      Type: field.controlType,
      Status: 1,
      Category: 0,
      DefaultValue: "",
      Rules: JSON.stringify(rules),
      AppID: APP_ID,
      IsSort: false,
      IsIndex: false,
      IsFilter: ["Onboarding Status", "Risk Level", "Review Status", "Status"].includes(field.displayName),
      IsIndexCreated: false,
      IsSystem: false,
      IsUnique: false,
      Created: CREATED,
      Modified: CREATED,
      Ext1: "",
      Ext2: "",
      Ext3: "",
    };
  });
}

function makeLayouts(list, fields, includeForms) {
  const viewLayoutId = `${BigInt(list.id) + 900n}`;
  const layouts = [{
    LayoutID: viewLayoutId,
    ListID: list.id,
    Type: 0,
    Title: "All Records",
    LayoutView: JSON.stringify({
      layout: fields.filter((field) => field.Type !== "textarea").slice(0, Math.min(6, fields.length)).map((field, index) => ({
        FieldID: field.FieldID,
        FieldName: field.FieldName,
        DisplayName: field.DisplayName,
        Mobile: true,
        Order: index,
        Show: true,
        Type: field.Type,
      })),
      filter: [],
      query: [],
      sort: [],
    }),
    AppID: APP_ID,
    TenantID: 0,
    Created: CREATED,
    Modified: CREATED,
    CreatedBy: 0,
    ModifiedBy: 0,
    Ext1: "",
    Ext2: "",
    Ext3: "",
    IsDefault: true,
    IsItemPerm: false,
    LayoutInResources: [],
  }];
  if (!includeForms) return layouts;
  const editLayoutId = `${BigInt(list.id) + 901n}`;
  const viewFormLayoutId = `${BigInt(list.id) + 902n}`;
  const form = (layoutId, title, mode) => ({
    LayoutID: layoutId,
    ListID: list.id,
    Type: 1,
    Title: title,
    LayoutView: "",
    AppID: APP_ID,
    TenantID: 0,
    Created: CREATED,
    Modified: CREATED,
    CreatedBy: 0,
    ModifiedBy: 0,
    Ext1: "",
    Ext2: "{\"src\":true}",
    Ext3: "",
    IsDefault: false,
    IsItemPerm: false,
    LayoutInResources: [{
      ID: layoutId,
      RefId: layoutId,
      Resource: JSON.stringify(simpleFormSurface(list.title, fields, mode)),
    }],
  });
  layouts.unshift(form(editLayoutId, "Edit Item", "edit"), form(viewFormLayoutId, "View Item", "view"));
  return layouts;
}

function simpleFormSurface(title, fields, mode) {
  return {
    title: `${title} ${mode === "view" ? "View" : "Form"}`,
    ver: "2.0",
    filterVars: [],
    tempVars: [],
    attrs: { hideHeaderAll: true },
    children: [{
      id: `container-${internalName(title)}`,
      type: "container",
      label: "Container",
      nv_label: "Padded form container",
      attrs: {
        style: { direction: "column", gap: "16px", align_items: "stretch" },
        common: { padding: { left: 24, right: 24, top: 24, bottom: 24 } },
      },
      children: [
        textControl(`${title} Details`, "h4-bold"),
        {
          id: `grid-${internalName(title)}`,
          type: "grid",
          label: "Grid",
          nv_label: "Form field grid",
          attrs: { layout: { columns: 2, gap: 16 } },
          children: fields.slice(0, 8).map((field) => dynamicFieldControl(field, mode === "view")),
        },
      ],
    }],
  };
}

function makeDashboardLayout(mode, vendorsList, vendorFields) {
  if (!mode) return null;
  const layoutId = "7602000000000009000";
  const tableColumns = vendorFields.slice(0, 6).map((field) => ({
    FieldID: field.FieldID,
    FieldName: field.FieldName,
    DisplayName: field.DisplayName,
  }));
  const children = [
    textControl("Vendor Management Dashboard", "h3-bold"),
    {
      id: "kpi-grid",
      type: "grid",
      label: "Grid",
      nv_label: "KPI card grid",
      attrs: { layout: { columns: 4, gap: 16 } },
      children: ["Total Vendors", "Pending Onboarding", "High Risk Vendors", "Expiring Documents"].map((label, index) => ({
        id: `kpi-${index}`,
        type: "container",
        label: "Container",
        nv_label: label,
        attrs: {
          style: { direction: "column", gap: "6px" },
          common: { padding: { left: 16, right: 16, top: 16, bottom: 16 } },
        },
        children: [textControl(label, "body-regular"), textControl(index === 0 ? "Total" : "Review", "h4-bold")],
      })),
    },
    {
      id: "vendor-table",
      type: "data-table",
      label: "Data table",
      nv_label: "Vendor records table",
      attrs: {
        data: { list: { ListID: vendorsList.id, Title: vendorsList.title, Type: 1 } },
        columns: tableColumns,
        listarr: tableColumns.map((column) => ({ Field: column.FieldName, Title: column.DisplayName })),
      },
      children: [],
    },
  ];
  if (mode === "kanban") {
    const status = vendorFields.find((field) => field.DisplayName === "Onboarding Status") || vendorFields[1];
    children.push({
      id: "vendor-kanban",
      type: "kanban",
      label: "Kanban",
      nv_label: "Onboarding status board",
      attrs: {
        data: {
          list: { ListID: vendorsList.id, Title: vendorsList.title, Type: 1 },
          groupField: status.FieldName,
          cateField: status.FieldName,
          templateFields: vendorFields.slice(0, 5).map((field) => field.FieldName),
        },
        card: {
          title: vendorFields[0].FieldName,
          subtitle: status.FieldName,
          fields: vendorFields.slice(2, 5).map((field) => field.FieldName),
        },
      },
      children: vendorFields.slice(0, 5).map((field) => dynamicFieldControl(field, true)),
    });
  }
  return {
    LayoutID: layoutId,
    ListID: ROOT_LIST_ID,
    Type: 103,
    Title: "Vendor Management Dashboard",
    LayoutView: "",
    AppID: APP_ID,
    TenantID: 0,
    Created: CREATED,
    Modified: CREATED,
    CreatedBy: 0,
    ModifiedBy: 0,
    Ext1: "",
    Ext2: "",
    Ext3: "",
    IsDefault: false,
    IsItemPerm: false,
    LayoutInResources: [{
      ID: layoutId,
      RefId: layoutId,
      Resource: JSON.stringify({
        title: "Vendor Management Dashboard",
        ver: "2.0",
        filterVars: [],
        tempVars: [],
        attrs: { hideHeaderAll: false },
        children: [{
          id: "dashboard-container",
          type: "container",
          label: "Container",
          nv_label: "Padded dashboard container",
          attrs: {
            style: { direction: "column", gap: "20px", align_items: "stretch" },
            common: { padding: { left: 32, right: 32, top: 28, bottom: 28 } },
          },
          children,
        }],
      }),
    }],
  };
}

function textControl(value, style) {
  return {
    id: `text-${internalName(value)}-${style}-${controlSeq++}`,
    type: "heading",
    label: "Text",
    nv_label: value,
    attrs: {
      headc: { title: { value, variable: null } },
      heads: { ty: style, color: "var(--c--text)" },
    },
    children: [],
  };
}

function dynamicFieldControl(field, readonly) {
  return {
    id: `field-${field.FieldName}`,
    type: "dynamic-field",
    label: "Dynamic field",
    nv_label: field.DisplayName,
    attrs: {
      data: {
        FieldID: field.FieldID,
        FieldName: field.FieldName,
        DisplayName: field.DisplayName,
      },
      readonly,
    },
    children: [],
  };
}

function makeExportInfo(variant) {
  const listDefs = variant.lists.map((key) => listCatalog[key]);
  const children = listDefs.map((list) => {
    const fields = makeFields(list);
    const layouts = makeLayouts(list, fields, variant.forms);
    const listModel = makeListModel(list);
    if (variant.forms) {
      const edit = layouts.find((layout) => layout.Type === 1 && layout.Title === "Edit Item");
      const view = layouts.find((layout) => layout.Type === 1 && layout.Title === "View Item");
      listModel.LayoutView = JSON.stringify({
        add: edit?.LayoutID || "default",
        edit: edit?.LayoutID || "default",
        view: view?.LayoutID || edit?.LayoutID || "default",
        opentype: { add: "modal" },
        modalsize: {},
        sortVer: 1,
      });
    }
    return {
      ListModel: listModel,
      Defs: fields,
      Layouts: layouts,
      PublicForms: [],
      RemindRules: [],
      FlowMappings: [],
      ListDatas: {},
    };
  });
  const vendorsChild = children[0];
  const dashboard = makeDashboardLayout(variant.dashboard, listDefs[0], vendorsChild.Defs);
  return {
    Item: {
      ListModel: makeRootModel(variant.title, dashboard?.LayoutID),
      Defs: [],
      Layouts: dashboard ? [dashboard] : [],
      PublicForms: [],
      RemindRules: [],
      FlowMappings: [],
      ListDatas: {},
    },
    Childs: children,
    Forms: [],
    FormReports: [],
    DataReports: [],
    FormNewReports: [],
    AppGroups: [],
    AppTags: [],
    AppMetadatas: [],
    AppThemes: [],
    AppComponents: [],
    OtherModules: [],
  };
}

function writeYap(variant, data) {
  let resourceText = JSON.stringify(data);
  resourceText = unquoteIntegerProperties(resourceText);
  const wrapper = {
    Title: variant.title,
    Description: variant.description,
    IconUrl: ICON_URL,
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(resourceText, "utf8")).toString("base64")}`,
  };
  const output = `${OUT_DIR}/${variant.file}`;
  fs.writeFileSync(output, `${JSON.stringify(wrapper, null, 2)}\n`);
  return output;
}

function unquoteIntegerProperties(jsonText) {
  const keys = ["TenantID", "AppID", "ListID", "CreatedBy", "ModifiedBy", "Perm", "Type", "Flags", "LayoutID", "FieldID", "FieldIndex", "ID", "RefId", "Status"];
  let out = jsonText;
  for (const key of keys) out = out.replace(new RegExp(`"${key}":"(-?\\d+)"`, "g"), `"${key}":$1`);
  return out;
}

function internalName(value) {
  return String(value).replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "Field";
}

function main() {
  controlSeq = 0;
  const outputs = variants.map((variant) => {
    const data = makeExportInfo(variant);
    const output = writeYap(variant, data);
    return {
      output,
      childLists: data.Childs.length,
      fields: data.Childs.reduce((total, child) => total + child.Defs.length, 0),
      rootLayouts: data.Item.Layouts.length,
      childLayouts: data.Childs.reduce((total, child) => total + child.Layouts.length, 0),
      scope: variant.description,
    };
  });
  console.log(JSON.stringify({ status: "generated", outputs }, null, 2));
}

main();
