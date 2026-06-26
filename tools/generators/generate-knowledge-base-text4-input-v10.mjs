import fs from "node:fs";
import crypto from "node:crypto";

const sourceResourcePath = "generated-dashboard-collection-grid-display-v8-resource.json";
const outputAppDefPath = "knowledge-base-text4-input-v10-app-def.json";
const outputResourcePath = "knowledge-base-text4-input-v10-resource.json";
const outputReportPath = "knowledge-base-text4-input-v10-generation-report.json";

const oldFamily = "267";
const family = "279";
const generatedAt = "2026-05-14 03:05:00";
const appTitle = "Knowledge Base Text4 Input v10";
const appDescription = "Knowledge Base field-slot isolation package based on the runtime-proven v4 shape, adding Articles.Text4 as a plain input field instead of lookup metadata.";

const appId = 41;
const tenantId = "2054071949946798081";
const userId = "2054071950001324033";
const rootId = `${family}0010000000000000`;
const dashboardId = `${family}0010000000000001`;
const articlesListId = `${family}0020000000001000`;
const categoriesListId = `${family}0030000000001000`;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function id() {
  return crypto.randomUUID();
}

function remapFamilyString(value) {
  return value
    .split(`${oldFamily}001`).join(`${family}001`)
    .split(`${oldFamily}002`).join(`${family}002`);
}

function makeIdMapper(sourceResource) {
  const sourceIds = (sourceResource.ReplaceIds || []).map(String);
  const newIds = sourceIds.map((sourceId) => remapFamilyString(sourceId));
  const pairs = sourceIds.map((sourceId, index) => [sourceId, newIds[index]]);
  return {
    remapString(value) {
      let out = value;
      for (const [from, to] of pairs) out = out.split(from).join(to);
      return remapFamilyString(out);
    }
  };
}

function deepRemap(value, remapString) {
  if (typeof value === "string") return remapString(value);
  if (Array.isArray(value)) return value.map((item) => deepRemap(item, remapString));
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[remapString(key)] = deepRemap(child, remapString);
    return out;
  }
  return value;
}

function control(type, label, attrs = {}, children = [], extra = {}) {
  return { id: id(), type, label, attrs, children, ...extra };
}

function heading(value, size = "h4-bold", color = "#111827", extra = {}) {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, size], color: [null, color] }
  }, [], extra);
}

function text(html, extra = {}) {
  return control("text-editor", "Text Editor", {
    value: html,
    common: { padding: [null, { top: 0, right: 0, bottom: 0, left: 0 }] }
  }, [], extra);
}

function dynamicField(fieldName, attrs = {}, extra = {}) {
  return control("dynamic-field", "Dynamic field", {
    source: "3",
    "obj-f": fieldName,
    ...attrs
  }, [], extra);
}

function searchFilter(binding) {
  return control("search-filter", "Search filter", {
    placeholder: "Search articles",
    edit: {
      normal: {
        border: { type: "1", color: "var(--c--neutral-light-active)", radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] }
      }
    }
  }, [], { binding, nv_label: "Knowledge search filter" });
}

function articleCollection() {
  const item = control("container", "Container", {
    style: { gap: [null, "--sp--s100"] },
    common: {
      padding: [null, { top: "--sp--s300", right: "--sp--s300", bottom: "--sp--s300", left: "--sp--s300" }],
      background: { normal: { type: "classic", classic: { color: "#ffffff" } } },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)",
          radius: [null, { top: "--sp--s250", right: "--sp--s250", bottom: "--sp--s250", left: "--sp--s250" }]
        }
      }
    }
  }, [
    dynamicField("Title", {
      item_style: { ty: { size: [null, "--sp--s200"], wei: "600" }, normal: { color: "var(--c--text)" } }
    }, { nv_label: "Article title" }),
    dynamicField("Text1", {
      item_style: { ty: [null, "s-regular"], normal: { color: "var(--c--neutral-dark-hover)" } }
    }, { nv_label: "Article summary" }),
    dynamicField("Text2", {
      prefix: "Category:",
      item_style: { ty: [null, "s-medium"], normal: { color: "var(--c--primary)" } }
    }, { nv_label: "Article category label" })
  ], { nv_label: "Article card item" });

  return control("collection", "Collection", {
    data: {
      list: { AppID: appId, ListID: articlesListId, Type: 1, Title: "Articles", ListSetID: rootId },
      limit: false,
      disv: false,
      ps: 12,
      filter: [],
      link: "default",
      op: "new",
      fulltext: [
        {
          fields: ["Title", "Text1", "Text2"],
          value: [
            {
              exprType: "variable",
              valueType: "string",
              id: "__filter_filter_Keywords",
              type: "expr",
              name: "filter_Keywords"
            }
          ]
        }
      ]
    },
    layout: {
      cg: [null, 24],
      rg: [null, 24],
      cp: [null, { top: "--sp--s200", right: "--sp--s200", bottom: "--sp--s200", left: "--sp--s200" }]
    }
  }, [item], { nv_label: "Article card collection" });
}

function categoryCollection() {
  const item = control("container", "Container", {
    style: { gap: [null, "--sp--s075"] },
    common: {
      padding: [null, { top: "--sp--s250", right: "--sp--s250", bottom: "--sp--s250", left: "--sp--s250" }],
      background: { normal: { type: "classic", classic: { color: "#f8fafc" } } },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)",
          radius: [null, { top: "--sp--s200", right: "--sp--s200", bottom: "--sp--s200", left: "--sp--s200" }]
        }
      }
    }
  }, [
    dynamicField("Title", {
      item_style: { ty: { size: [null, "--sp--s175"], wei: "600" }, normal: { color: "var(--c--text)" } }
    }, { nv_label: "Category title" }),
    dynamicField("Text1", {
      item_style: { ty: [null, "s-regular"], normal: { color: "var(--c--neutral-dark-hover)" } }
    }, { nv_label: "Category description" })
  ], { nv_label: "Category card item" });

  return control("collection", "Collection", {
    data: {
      list: { AppID: appId, ListID: categoriesListId, Type: 1, Title: "Categories", ListSetID: rootId },
      limit: false,
      disv: false,
      ps: 12,
      filter: [],
      link: "default",
      op: "new"
    },
    layout: {
      cg: [null, 24],
      rg: [null, 24],
      cp: [null, { top: "--sp--s200", right: "--sp--s200", bottom: "--sp--s200", left: "--sp--s200" }]
    }
  }, [item], { nv_label: "Category card collection" });
}

function dashboardPage() {
  return {
    children: [
      control("container", "Container", {
        common: {
          padding: [null, { top: "--sp--s600", right: "--sp--s700", bottom: "--sp--s600", left: "--sp--s700" }],
          background: { normal: { type: "classic", classic: { color: "#ffffff" } } }
        },
        style: { gap: [null, "--sp--s450"] }
      }, [
        control("container", "Container", {
          style: { gap: [null, "--sp--s150"] }
        }, [
          heading("Knowledge Base", "h1-bold"),
          text("<p>Find practical guides, implementation notes, and reusable platform knowledge.</p>"),
          searchFilter("__filter_filter_Keywords")
        ], { nv_label: "Knowledge hero and search" }),
        control("container", "Container", {
          style: { gap: [null, "--sp--s200"] }
        }, [
          heading("Featured articles", "h3-bold"),
          articleCollection()
        ], { nv_label: "Featured articles section" }),
        control("container", "Container", {
          style: { gap: [null, "--sp--s200"] }
        }, [
          heading("Browse by category", "h3-bold"),
          categoryCollection()
        ], { nv_label: "Browse categories section" })
      ], { nv_label: "Knowledge Base home page" })
    ],
    attrs: {},
    title: "Home Page",
    ver: 2,
    filterVars: [{ idx: id(), id: "filter_Keywords" }],
    tempVars: [],
    exts: [],
    actions: []
  };
}

function makeField(listId, fieldId, fieldName, displayName, type, rules = {}, overrides = {}) {
  const isTitle = fieldName === "Title";
  return {
    FieldID: fieldId,
    ListID: listId,
    FieldName: fieldName,
    FieldType: "Text",
    FieldIndex: isTitle ? 0 : Number(fieldName.match(/\d+$/)?.[0] || 1),
    DisplayName: displayName,
    InternalName: displayName.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "") || fieldName,
    DisplayName_EN: null,
    Type: type,
    Status: isTitle ? 0 : 1,
    Category: 0,
    DefaultValue: null,
    Rules: JSON.stringify(rules),
    TenantID: tenantId,
    AppID: appId,
    IsSort: isTitle,
    IsIndex: isTitle,
    IsFilter: isTitle,
    IsIndexCreated: isTitle,
    IsSystem: isTitle,
    IsUnique: false,
    Created: generatedAt,
    Modified: generatedAt,
    CreatedBy: userId,
    ModifiedBy: userId,
    Ext1: null,
    Ext2: null,
    Ext3: null,
    ...overrides
  };
}

function makeLookupField(listId, fieldId, fieldName, displayName, targetListId, targetListSetId, targetField = "Title") {
  return makeField(
    listId,
    fieldId,
    fieldName,
    displayName,
    "lookup",
    {
      "max-selection": 20,
      appid: appId,
      listid: targetListId,
      listsetid: targetListSetId,
      listfield: targetField,
      displayStyle: "dropdown"
    },
    {
      IsSort: false,
      IsIndex: false,
      IsFilter: false,
      IsIndexCreated: false,
      IsSystem: false
    }
  );
}

function makeListView(layoutId, listId, title, fields, visibleFieldNames = null) {
  const visibleFields = fields.filter((field) => {
    if (visibleFieldNames) return visibleFieldNames.includes(field.FieldName);
    return field.Type !== "textarea";
  });
  const visible = visibleFields.map((field, index) => ({
    FieldID: field.FieldID,
    FieldName: field.FieldName,
    Mobile: index === 0 ? 2 : 0,
    Order: index + 1,
    Show: true,
    Type: field.Type,
    DisplayName: field.DisplayName,
    Rules: field.Rules ? JSON.parse(field.Rules) : {}
  }));
  return {
    AppID: appId,
    ListSetID: rootId,
    ListID: listId,
    LayoutID: layoutId,
    Type: 0,
    Title: title,
    Description: null,
    LayoutView: JSON.stringify({
      layout: visible,
      query: [
        {
          ID: fields[0].FieldID,
          Name: fields[0].DisplayName,
          Type: fields[0].Type,
          FieldName: fields[0].FieldName,
          Rules: fields[0].Rules ? JSON.parse(fields[0].Rules) : {},
          FieldID: fields[0].FieldID,
          InternalName: fields[0].InternalName
        },
        {
          ID: "-1",
          Name: "Id",
          Type: "input",
          FieldName: "ListDataID",
          Rules: { displayLabel: true, readonly: true },
          FieldID: "-1",
          InternalName: "ListDataID"
        },
        {
          ID: "-4",
          Name: "Created Time",
          Type: "datepicker",
          FieldName: "Created",
          Rules: { displayLabel: true, readonly: true, showtime: true, dateformat: "0" },
          FieldID: "-4",
          InternalName: "Created"
        }
      ],
      sort: [{ SortName: "Created", SortByDesc: true }],
      rowColor: [],
      filter: []
    }),
    Created: generatedAt,
    Modified: generatedAt,
    CreatedBy: userId,
    ModifiedBy: userId,
    Ext1: null,
    Ext2: null,
    Ext3: null,
    LayoutInResources: []
  };
}

function makeList(listId, title, fields, rows, options = {}) {
  const layoutId = `${listId.slice(0, 6)}0000000001801`;
  return {
    ListModel: {
      TenantID: tenantId,
      AppID: appId,
      ListID: listId,
      Title: title,
      Description: null,
      Status: 1,
      IsItemPerm: true,
      IsVerRecord: false,
      HasComment: false,
      IconUrl: null,
      TableCode: "flowcraft",
      IndexCode: "flowcraft",
      Created: generatedAt,
      Modified: generatedAt,
      CreatedBy: userId,
      ModifiedBy: userId,
      Ext1: null,
      Ext2: null,
      Ext3: null,
      Perm: 4,
      Type: 1,
      Flags: 1,
      CustomType: `ListSite_${rootId}`,
      WorkspaceID: null,
      LayoutView: null,
      IsBreakInherit: false,
      IsDataSeparate: false,
      AdvanceList: []
    },
    Defs: fields,
    Layouts: [makeListView(layoutId, listId, `All ${title}`, fields, options.visibleFieldNames)],
    PublicForms: [],
    RemindRules: [],
    FlowMappings: [],
    ListDatas: Object.fromEntries(rows.map((row) => [row.ListDataID, row])),
  };
}

function row(listDataId, values) {
  return {
    ListDataID: listDataId,
    Created: generatedAt,
    Modified: generatedAt,
    CreatedBy: userId,
    ModifiedBy: userId,
    ...values
  };
}

const categoryFields = [
  makeField(categoriesListId, `${family}0030000000001001`, "Title", "Category Name", "input", { required: true }),
  makeField(categoriesListId, `${family}0030000000001002`, "Text1", "Description", "textarea", { placeholder: "Describe this knowledge category" })
];

const articleFields = [
  makeField(articlesListId, `${family}0020000000001001`, "Title", "Article Title", "input", { required: true, placeholder: "Article title" }),
  makeField(articlesListId, `${family}0020000000001002`, "Text1", "Summary", "textarea", { placeholder: "Short searchable article summary" }),
  makeField(articlesListId, `${family}0020000000001003`, "Text2", "Category Label", "input", { placeholder: "Display category" }),
  makeField(articlesListId, `${family}0020000000001004`, "Text4", "Category Slot", "input", { placeholder: "Text4 plain input slot" })
];

const categoryRows = [
  row(`${family}0030000000011001`, { Title: "Getting Started", Text1: "Introductory guides for new users and makers." }),
  row(`${family}0030000000011002`, { Title: "Application Builder", Text1: "Patterns for lists, dashboards, forms, and navigation." }),
  row(`${family}0030000000011003`, { Title: "Operations", Text1: "Practical administration, permissions, and governance notes." })
];

const articleRows = [
  row(`${family}0020000000011001`, {
    Title: "Create your first application",
    Text1: "A short guide to structure a workspace app with lists, dashboards, and navigation.",
    Text2: "Getting Started",
    Text4: ""
  }),
  row(`${family}0020000000011002`, {
    Title: "Design a useful knowledge list",
    Text1: "Use Title for article names, summaries for search, and categories for browsing.",
    Text2: "Application Builder",
    Text4: ""
  }),
  row(`${family}0020000000011003`, {
    Title: "Keep content ownership clear",
    Text1: "Define owners, review cadence, and simple governance before a knowledge base grows.",
    Text2: "Operations",
    Text4: ""
  })
];

const sourceResource = JSON.parse(fs.readFileSync(sourceResourcePath, "utf8"));
const { remapString } = makeIdMapper(sourceResource);
const resource = deepRemap(clone(sourceResource), remapString);
const data = JSON.parse(resource.Data);

const root = data.Item.ListModel;
root.Title = appTitle;
root.Description = appDescription;
root.IconUrl = JSON.stringify({ b: "#8b46ff", i: "fa-regular fa-book-sparkles", c: "#ffffff" });
root.Created = generatedAt;
root.Modified = generatedAt;
root.ListID = rootId;
delete root.ListSetID;

const dashboard = data.Item.Layouts.find((layout) => Number(layout.Type) === 103);
dashboard.Title = "Home Page";
dashboard.LayoutID = dashboardId;
dashboard.ListID = rootId;
dashboard.ListSetID = rootId;
dashboard.Created = generatedAt;
dashboard.Modified = generatedAt;
dashboard.LayoutInResources = [{ ID: dashboardId, RefId: dashboardId, Resource: JSON.stringify(dashboardPage()) }];
data.Item.Layouts = [dashboard];

data.Childs = [
  makeList(categoriesListId, "Categories", categoryFields, categoryRows),
  makeList(articlesListId, "Articles", articleFields, articleRows, { visibleFieldNames: ["Title", "Text2"] })
];

root.LayoutView = JSON.stringify({
  sortVer: 1,
  sort: [
    { AppID: appId, ListID: dashboardId, ListSetID: rootId, Type: 103, IsHidden: false, Title: "Home Page", Icon: "fa-regular fa-house", DisplayName: "Home Page" },
    { AppID: appId, ListID: dashboardId, ListSetID: rootId, Type: 103, Title: "Home Page", Icon: "fa-regular fa-house", DisplayName: "Home Page" },
    { AppID: appId, ListID: categoriesListId, ListSetID: rootId, Type: 1, Title: "Categories", Icon: "fa-regular fa-folder-open", DisplayName: "Categories" },
    { AppID: appId, ListID: articlesListId, ListSetID: rootId, Type: 1, Title: "Articles", Icon: "fa-regular fa-file-lines", DisplayName: "Articles" }
  ]
});

data.Forms = [];
data.DataReports = [];
data.FormReports = [];
data.FormNewReports = [];
data.OtherModules = [];

const replaceIds = [
  rootId,
  dashboardId,
  categoriesListId,
  ...categoryFields.map((field) => field.FieldID),
  `${categoriesListId.slice(0, 6)}0000000001801`,
  ...categoryRows.map((item) => item.ListDataID),
  articlesListId,
  ...articleFields.map((field) => field.FieldID),
  `${articlesListId.slice(0, 6)}0000000001801`,
  ...articleRows.map((item) => item.ListDataID)
];

resource.Title = appTitle;
resource.Description = appDescription;
resource.IconUrl = root.IconUrl;
resource.ReplaceIds = replaceIds;
resource.ReportIds = [];
resource.FormKeys = [];
resource.Data = JSON.stringify(data);

fs.writeFileSync(outputAppDefPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.writeFileSync(outputResourcePath, `${JSON.stringify(resource, null, 2)}\n`, "utf8");
fs.writeFileSync(outputReportPath, `${JSON.stringify({
  status: "pass",
  package: appTitle,
  sourceExportStudied: "/Users/Renger/Downloads/Knowledge Base_1.yap",
  sourceGenerationBaseline: sourceResourcePath,
  freshIdFamily: family,
  outputs: { appDef: outputAppDefPath, resource: outputResourcePath },
  includedPatterns: [
    "root app shell",
    "two local data lists",
    "category label text metadata and sample values",
    "plain Text4 input metadata",
    "blank article Text4 sample values",
    "no generated Text3 placeholder field",
    "Text4 field hidden from the Articles list view",
    "one Type 103 Home dashboard",
    "dashboard search filter bound to page filterVars",
    "Article Collection with full-text search",
    "Category Collection",
    "dynamic-field controls inside Collection item templates",
    "designer nv_label names"
  ],
  intentionallyDeferred: [
    "article-to-category lookup",
    "Sections and article-to-section lookup",
    "richtext article body",
    "icon-upload/image fields",
    "article detail page links",
    "Home Page category-to-article nested Collection filters",
    "Search page query-param behavior",
    "Admin action cards",
    "approval forms, workflows, reports, AI modules, connections, document libraries"
  ],
  replaceIds
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ status: "pass", appDef: outputAppDefPath, resource: outputResourcePath, report: outputReportPath, replaceIds: replaceIds.length }, null, 2));
