import fs from "node:fs";
import crypto from "node:crypto";

const sourceResourcePath = "generated-dashboard-collection-grid-display-v8-resource.json";
const outputAppDefPath = "knowledge-base-category-lookup-v11-app-def.json";
const outputResourcePath = "knowledge-base-category-lookup-v11-resource.json";
const outputReportPath = "knowledge-base-category-lookup-v11-generation-report.json";

const oldFamily = "267";
const family = "280";
const generatedAt = "2026-05-14 04:30:00";
const appTitle = "Knowledge Base Category Lookup v11";
const appDescription = "Knowledge Base lookup isolation package based on the manually updated v10 export, adding Categories.Order and Articles.Category Lookup sorted by Order.";

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

function makeDecimalField(listId, fieldId, fieldName, displayName, rules = {}, overrides = {}) {
  return makeField(listId, fieldId, fieldName, displayName, "input_number", rules, {
    FieldType: "Decimal",
    IsSort: false,
    IsIndex: false,
    IsFilter: false,
    IsIndexCreated: false,
    IsSystem: false,
    ...overrides
  });
}

function makeLookupField(listId, fieldId, fieldName, displayName, targetListId, targetListSetId, targetField = "Title", rules = {}) {
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
      list_tooltip_field: null,
      addition: null,
      "sort-first": null,
      "sort-second": null,
      listfilter: null,
      "search-scope": null,
      "search-fields": null,
      displayStyle: "dropdown",
      ...rules
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

function systemLayoutFields(startOrder) {
  return [
    {
      DisplayName: "Id",
      FieldID: "-1",
      FieldName: "ListDataID",
      Mobile: 0,
      Order: startOrder,
      Show: false,
      Type: "input",
      Rules: { displayLabel: true, readonly: true }
    },
    {
      DisplayName: "Created By",
      FieldID: "-2",
      FieldName: "CreatedBy",
      Mobile: 0,
      Order: startOrder + 1,
      Show: false,
      Type: "identity-picker",
      Rules: { displayLabel: true, readonly: true }
    },
    {
      DisplayName: "Created Time",
      FieldID: "-4",
      FieldName: "Created",
      Mobile: 0,
      Order: startOrder + 2,
      Show: false,
      Type: "datepicker",
      Rules: { displayLabel: true, readonly: true, showtime: true, dateformat: "0" }
    },
    {
      DisplayName: "Modified By",
      FieldID: "-3",
      FieldName: "ModifiedBy",
      Mobile: 0,
      Order: startOrder + 3,
      Show: false,
      Type: "identity-picker",
      Rules: { displayLabel: true, readonly: true }
    },
    {
      DisplayName: "Modified Time",
      FieldID: "-5",
      FieldName: "Modified",
      Mobile: 0,
      Order: startOrder + 4,
      Show: false,
      Type: "datepicker",
      Rules: { displayLabel: true, readonly: true, showtime: true, dateformat: "0" }
    }
  ];
}

function makeListView(layoutId, listId, title, fields, visibleFieldNames = null, options = {}) {
  const byName = new Map(fields.map((field) => [field.FieldName, field]));
  const preSystemNames = options.preSystemFieldNames || fields.map((field) => field.FieldName);
  const postSystemNames = options.postSystemFieldNames || [];
  const visibleNames = new Set(visibleFieldNames || fields.filter((field) => field.Type !== "textarea").map((field) => field.FieldName));
  const preSystem = preSystemNames.map((fieldName) => byName.get(fieldName)).filter(Boolean);
  const postSystem = postSystemNames.map((fieldName) => byName.get(fieldName)).filter(Boolean);
  const layout = preSystem.map((field, index) => ({
    FieldID: field.FieldID,
    FieldName: field.FieldName,
    Mobile: index === 0 ? 2 : 0,
    Order: index,
    Show: visibleNames.has(field.FieldName),
    Type: field.Type,
    DisplayName: field.DisplayName,
    Rules: field.Rules ? JSON.parse(field.Rules) : {}
  }));
  if (options.includeSystemFields === true) {
    layout.push(...systemLayoutFields(layout.length));
  }
  for (const field of postSystem) {
    layout.push({
      FieldID: field.FieldID,
      FieldName: field.FieldName,
      Mobile: 0,
      Order: layout.length,
      Show: visibleNames.has(field.FieldName),
      Type: field.Type,
      DisplayName: field.DisplayName,
      Rules: field.Rules ? JSON.parse(field.Rules) : {}
    });
  }
  return {
    AppID: appId,
    ListSetID: rootId,
    ListID: listId,
    LayoutID: layoutId,
    Type: 0,
    Title: title,
    Description: null,
    LayoutView: JSON.stringify({
      layout,
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
    Layouts: [makeListView(layoutId, listId, `All ${title}`, fields, options.visibleFieldNames, options)],
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
  makeField(categoriesListId, `${family}0030000000001002`, "Text1", "Description", "textarea", { placeholder: "Describe this knowledge category" }),
  makeDecimalField(categoriesListId, `${family}0030000000001003`, "Decimal1", "Order", { number_min: 1, number_step: 1, "rounded-to": "0" }, { FieldIndex: 1 })
];

const articleFields = [
  makeField(articlesListId, `${family}0020000000001001`, "Title", "Article Title", "input", { required: true, placeholder: "Article title" }),
  makeField(articlesListId, `${family}0020000000001002`, "Text1", "Summary", "textarea", { placeholder: "Short searchable article summary" }),
  makeField(articlesListId, `${family}0020000000001003`, "Text2", "Category Label", "input", { placeholder: "Display category" }),
  makeField(articlesListId, `${family}0020000000001004`, "Text4", "Category Slot", "input", { placeholder: "Text4 plain input slot" }),
  makeLookupField(articlesListId, `${family}0020000000001005`, "Text3", "Category Lookup", categoriesListId, rootId, "Title", {
    "sort-first": { SortName: "Decimal1", SortByDesc: false },
    required: true
  })
];

const categoryRows = [
  row(`${family}0030000000011001`, { Title: "Getting Started", Text1: "Introductory guides for new users and makers.", Decimal1: "1" }),
  row(`${family}0030000000011002`, { Title: "Application Builder", Text1: "Patterns for lists, dashboards, forms, and navigation.", Decimal1: "3" }),
  row(`${family}0030000000011003`, { Title: "Operations", Text1: "Practical administration, permissions, and governance notes.", Decimal1: "2" })
];

const articleRows = [
  row(`${family}0020000000011001`, {
    Title: "Create your first application",
    Text1: "A short guide to structure a workspace app with lists, dashboards, and navigation.",
    Text2: "Getting Started",
    Text3: "",
    Text4: ""
  }),
  row(`${family}0020000000011002`, {
    Title: "Design a useful knowledge list",
    Text1: "Use Title for article names, summaries for search, and categories for browsing.",
    Text2: "Application Builder",
    Text3: "",
    Text4: ""
  }),
  row(`${family}0020000000011003`, {
    Title: "Keep content ownership clear",
    Text1: "Define owners, review cadence, and simple governance before a knowledge base grows.",
    Text2: "Operations",
    Text3: "",
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
  makeList(categoriesListId, "Categories", categoryFields, categoryRows, {
    visibleFieldNames: ["Title", "Decimal1"],
    preSystemFieldNames: ["Title"],
    postSystemFieldNames: ["Decimal1"]
  }),
  makeList(articlesListId, "Articles", articleFields, articleRows, {
    visibleFieldNames: ["Title", "Text2", "Text3"],
    preSystemFieldNames: ["Title", "Text2", "Text4"],
    postSystemFieldNames: ["Text3"]
  })
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
    "Categories Decimal1 Order metadata and sample values",
    "plain Text4 input metadata",
    "Articles Text3 Category Lookup metadata",
    "lookup sorted by Categories.Decimal1 ascending",
    "blank article Text4 sample values",
    "blank article Text3 lookup sample values",
    "Text4 field hidden from the Articles list view",
    "one Type 103 Home dashboard",
    "dashboard search filter bound to page filterVars",
    "Article Collection with full-text search",
    "Category Collection",
    "dynamic-field controls inside Collection item templates",
    "designer nv_label names"
  ],
  intentionallyDeferred: [
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
