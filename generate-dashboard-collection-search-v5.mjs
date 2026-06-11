import fs from "node:fs";
import crypto from "node:crypto";

const sourceResourcePath = "service-desk-pro-dashboard-stage-d-resource.json";
const outputAppDefPath = "generated-dashboard-collection-search-v5-app-def.json";
const outputResourcePath = "generated-dashboard-collection-search-v5-resource.json";
const outputReportPath = "generated-dashboard-collection-search-v5-generation-report.json";

const oldFamily = "248";
const family = "264";
const generatedAt = "2026-05-13 17:15:00";
const appTitle = "Generated Dashboard Collection Search v5";
const appDescription = "Minimal dashboard Collection test with table-style search-filter binding and hidden grid captions.";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function remapFamilyString(value) {
  return value
    .split(`${oldFamily}001`).join(`${family}001`)
    .split(`${oldFamily}002`).join(`${family}002`);
}

function makeIdMapper(sourceResource) {
  const sourceIds = (sourceResource.ReplaceIds || []).map(String);
  const newIds = sourceIds.map((id) => remapFamilyString(id));
  if (!sourceIds.length) throw new Error("Source Resource.ReplaceIds is empty.");
  const pairs = sourceIds.map((id, index) => [id, newIds[index]]);
  return {
    newIds,
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

function id() {
  return crypto.randomUUID();
}

function control(type, label, attrs = {}, children = [], extra = {}) {
  return { id: id(), type, label, attrs, children, ...extra };
}

function heading(value, size = "h5-medium", color = "#0f172a", extra = {}) {
  return control("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, size], color: [null, color] }
  }, [], extra);
}

function dynamicField(fieldName, attrs = {}, extra = {}) {
  return control("dynamic-field", "Dynamic field", {
    source: "3",
    "obj-f": fieldName,
    ...attrs
  }, [], extra);
}

function text(html, extra = {}) {
  return control("text-editor", "Text Editor", {
    value: html,
    common: { padding: [null, { top: 0, right: 0, bottom: 0, left: 0 }] }
  }, [], extra);
}

function dateHeading() {
  return control("heading", "Text", {
    headc: {
      title: {
        value: null,
        variable: [
          {
            type: "func",
            func: "dateFormat",
            params: [
              [
                {
                  exprType: "variable_ctx",
                  valueType: "datepicker",
                  id: "Datetime1",
                  ctx: "__ctx_coll",
                  type: "expr",
                  name: "Collection item:Created Time"
                }
              ],
              [{ type: "str", value: "MMM DD, YYYY HH:MM" }]
            ]
          }
        ]
      }
    },
    heads: { ty: [null, "s-medium"], color: [null, "var(--c--neutral-dark-hover)"] }
  }, [], { nv_label: "Collection created time expression" });
}

function priorityStyleRule(targetControlId, priority, style) {
  return {
    id: id(),
    controlId: targetControlId,
    formulas: [
      {
        exprType: "variable_ctx",
        valueType: "radio",
        id: "Text2",
        ctx: "__ctx_coll",
        type: "expr",
        name: "Collection item:Priority"
      },
      { type: "op", op: "==" },
      { type: "str", value: priority }
    ],
    actions: {
      id: id(),
      type: 1,
      attrs: {
        style_regulation_action: "style_class",
        style_regulation_action_color: null,
        action_style: JSON.stringify({ normal: style }),
        icon_type: null
      }
    }
  };
}

function priorityBadge() {
  const badgeId = id();
  return {
    id: badgeId,
    type: "container",
    label: "Container",
    nv_label: "Table priority badge",
    attrs: {
      style: { widthtype: [null, "2"] },
      common: {
        padding: [null, { top: 2, right: 8, bottom: 2, left: 8 }],
        border: { normal: { radius: [null, { top: 999, right: 999, bottom: 999, left: 999 }] } }
      },
      control_display: [
        priorityStyleRule(badgeId, "Low", { bgcolor: "#f0f0f0", color: "#474747" }),
        priorityStyleRule(badgeId, "Medium", { bgcolor: "#ddffeb", color: "#31cc71" }),
        priorityStyleRule(badgeId, "High", { bgcolor: "rgba(245, 166, 35, 0.15)", color: "#f5a623" }),
        priorityStyleRule(badgeId, "Critical", { bgcolor: "rgba(208, 2, 27, 0.15)", color: "#d0021b" })
      ]
    },
    children: [
      dynamicField("Text2", {
        common: { positioning: { widthtype: [null, "2"] } },
        item_style: { normal: {}, ty: [null, "s-medium"] }
      }, { nv_label: "Table priority value" })
    ]
  };
}

function tableCell(children, extra = {}) {
  return control("container", "Container", {
    common: { padding: [null, { top: "--sp--s150", right: "--sp--s200", bottom: "--sp--s150", left: "--sp--s200" }] },
    style: { justify_content: [null, "center"] }
  }, children, extra);
}

function headerCell(label) {
  return tableCell([
    heading(label, "s-medium", "var(--c--neutral-dark-hover)")
  ], { nv_label: `Table header ${label}` });
}

function searchFilter() {
  return {
    id: id(),
    type: "search-filter",
    label: "Search tickets",
    attrs: {
      common: {
        positioning: {
          widthtype: [null, "3", null, "1"],
          width: [null, 280]
        }
      },
      edit: {
        normal: {
          bgColor: "var(--c--neutral-light)",
          border: {
            type: "1",
            radius: [null, { top: "", right: "", bottom: "", left: "" }]
          }
        },
        pcolor: "var(--c--neutral-dark)"
      },
      placeholder: "Search tickets"
    },
    binding: "__filter_filter_Tickets",
    displayLabel: [null, false],
    parentCol: 1,
    children: [],
    nv_label: "Collection search filter"
  };
}

function tablePage(rootId, dashboardId, supportTicketsListId, appId) {
  const gridColumns = {
    "1": {
      list: [
        { value: 1.5, unit: "fr" },
        { value: 1, unit: "fr" },
        { value: 1, unit: "fr" },
        { value: 1, unit: "fr" },
        { value: 1, unit: "fr" }
      ],
      last: { value: 1, unit: "fr" }
    },
    "2": {
      list: [
        { value: 2.5, unit: "fr" },
        { value: 1, unit: "fr" },
        { value: 1, unit: "fr" },
        { value: 1, unit: "fr" }
      ],
      last: { value: 1, unit: "fr" }
    },
    "3": {
      list: [
        { value: 1, unit: "fr" },
        { value: 1, unit: "fr" }
      ],
      last: { value: 1, unit: "fr" }
    }
  };
  const gridRows = {
    "1": {
      list: [{ unit: "auto" }],
      last: { unit: "auto" }
    }
  };

  const headerGrid = control("flex_grid", "Table header", {
    ver: 1,
    columns: gridColumns,
    rows: gridRows,
    cgap: { "1": 10 },
    cgapU: { "1": "px" },
    content: {
      pd: [null, { top: "--sp--s075", right: "--sp--s075", bottom: "--sp--s075", left: "--sp--s075" }]
    },
    common: {
      background: { normal: { type: "classic", classic: { color: "#f8fafc" } } },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)",
          radius: [null, { top: "--sp--s200", right: "--sp--s200", bottom: 0, left: 0 }]
        }
      }
    }
  }, [
    headerCell("Ticket"),
    headerCell("Priority"),
    headerCell("Status"),
    headerCell("Team"),
    headerCell("Created")
  ], { displayLabel: [null, false], nv_label: "Table header of the generated collection" });

  const itemGrid = control("flex_grid", "Table row", {
    ver: 1,
    columns: gridColumns,
    rows: gridRows,
    cgap: { "1": 10 },
    cgapU: { "1": "px" },
    content: {
      pd: [null, { top: "--sp--s075", right: "--sp--s075", bottom: "--sp--s075", left: "--sp--s075" }],
      "align-i": [null, "2"]
    },
    rgap: [null, null, null, 6],
    rgapU: [null, null, null, "px"],
    common: {
      background: { normal: { type: "classic", classic: { color: "#ffffff" } } },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 0, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)"
        }
      }
    }
  }, [
    tableCell([
      dynamicField("Title", {
        common: { positioning: { widthtype: [null, "2"] } },
        item_style: { ty: [null, "m-medium"], normal: { color: "var(--c--text)" } }
      }, { nv_label: "Table ticket title" }),
      dynamicField("Text1", {
        common: { positioning: { widthtype: [null, "2"] } },
        prefix: "ID:",
        item_style: { normal: { color: "var(--c--neutral-dark-hover)" }, ty: [null, "s-regular"] }
      }, { nv_label: "Table ticket id" })
    ], { nv_label: "Table ticket cell" }),
    tableCell([priorityBadge()], { nv_label: "Table priority cell" }),
    tableCell([
      dynamicField("Text3", {
        common: { positioning: { widthtype: [null, "2"] } },
        item_style: { ty: [null, "s-medium"] }
      }, { nv_label: "Table status value" })
    ], { nv_label: "Table status cell" }),
    tableCell([
      dynamicField("Text4", {
        common: { positioning: { widthtype: [null, "2"] } },
        item_style: { normal: { color: "var(--c--neutral-dark-hover)" }, ty: [null, "s-regular"] }
      }, { nv_label: "Table assigned team value" })
    ], { nv_label: "Table team cell" }),
    tableCell([dateHeading()], { nv_label: "Table created date cell" })
  ], { displayLabel: [null, false], nv_label: "Table item of the collection each item" });

  const itemTemplate = control("container", "Container", {
    style: { gap: [null, 0] }
  }, [itemGrid], { nv_label: "Row of item of the generated collection" });

  const collection = control("collection", "Collection", {
    data: {
      list: {
        AppID: appId,
        ListID: supportTicketsListId,
        Type: 1,
        Title: "Support Tickets",
        ListSetID: rootId
      },
      filter: [],
      fulltext: [
        {
          fields: ["Title", "Text1", "Text4"],
          value: [
            {
              exprType: "variable",
              valueType: "string",
              id: "__filter_filter_Tickets",
              type: "expr",
              name: "filter_Tickets"
            }
          ]
        }
      ],
      link: "default"
    },
    layout: {
      col: [null, 1],
      cg: [null, 0],
      rg: [null, 0]
    }
  }, [itemTemplate], { nv_label: "Support Tickets table collection" });

  return {
    children: [
      control("container", "Container", {
        common: {
          padding: [null, { top: "--sp--s500", right: "--sp--s600", bottom: "--sp--s500", left: "--sp--s600" }],
          background: { normal: { type: "classic", classic: { color: "#ffffff" } } }
        },
        style: { gap: [null, "--sp--s300"] }
      }, [
        control("container", "Container", {
          style: { gap: [null, "--sp--s050"] }
        }, [
          heading("Tickets Collection Search", "h2-bold"),
          text("<p>Generated table-style Collection proving search-filter binding to Collection full-text search.</p>")
        ], { nv_label: "Collection table page header" }),
        control("container", "Container", {
          style: {
            direction: [null, "row", null, "column"],
            align_items: [null, "center", null, "flex-start"],
            gap: [null, "--sp--s100"]
          }
        }, [searchFilter()], { nv_label: "Collection search controls" }),
        control("container", "Container", {
          style: { gap: [null, 0] }
        }, [headerGrid, collection], { nv_label: "Table collection wrapper" })
      ], { nv_label: "Collection table page section" })
    ],
    attrs: {},
    title: "Tickets Collection Search",
    ver: 2,
    filterVars: [
      {
        idx: id(),
        id: "filter_Tickets"
      }
    ],
    tempVars: [],
    exts: [],
    actions: []
  };
}

const sourceResource = JSON.parse(fs.readFileSync(sourceResourcePath, "utf8"));
const { newIds, remapString } = makeIdMapper(sourceResource);
const resource = deepRemap(clone(sourceResource), remapString);
resource.ReplaceIds = newIds;
resource.ReportIds = [];
resource.FormKeys = [];

const data = JSON.parse(resource.Data);
const root = data.Item.ListModel;
const appId = root.AppID;
const rootId = root.ListID;
const dashboard = data.Item.Layouts.find((layout) => Number(layout.Type) === 103);
const supportTickets = data.Childs.find((child) => child.ListModel?.Title === "Support Tickets");
if (!dashboard) throw new Error("Source baseline must include one Type 103 dashboard.");
if (!supportTickets) throw new Error("Source baseline must include Support Tickets list.");

root.Title = appTitle;
root.Description = appDescription;
root.Created = generatedAt;
root.Modified = generatedAt;
root.IconUrl = JSON.stringify({ b: "#2563eb", i: "fa-regular fa-table-list", c: "#ffffff" });

dashboard.Title = "Tickets Collection Search";
dashboard.Created = generatedAt;
dashboard.Modified = generatedAt;
dashboard.LayoutInResources = [
  {
    ID: dashboard.LayoutID,
    RefId: dashboard.LayoutID,
    Resource: JSON.stringify(tablePage(rootId, dashboard.LayoutID, supportTickets.ListModel.ListID, appId))
  }
];

for (const child of data.Childs || []) {
  child.ListModel.Created = generatedAt;
  child.ListModel.Modified = generatedAt;
  for (const def of child.Defs || []) {
    def.Created = generatedAt;
    def.Modified = generatedAt;
    if (def.FieldName === "Title") {
      def.Status = 0;
      def.IsSystem = true;
      def.IsIndex = true;
    }
  }
  for (const layout of child.Layouts || []) {
    layout.Created = generatedAt;
    layout.Modified = generatedAt;
  }
}

root.LayoutView = JSON.stringify({
  sortVer: 1,
  sort: [
    {
      AppID: appId,
      ListID: dashboard.LayoutID,
      ListSetID: rootId,
      Type: 103,
      IsHidden: false,
      Title: "Tickets Collection Search",
      Icon: "fa-regular fa-table-list",
      DisplayName: "Tickets Collection Search"
    },
    {
      AppID: appId,
      ListID: dashboard.LayoutID,
      ListSetID: rootId,
      Type: 103,
      Title: "Tickets Collection Search",
      Icon: "fa-regular fa-table-list",
      DisplayName: "Tickets Collection Search"
    },
    {
      AppID: appId,
      ListID: supportTickets.ListModel.ListID,
      ListSetID: rootId,
      Type: 1,
      Title: "Support Tickets",
      Icon: "fa-regular fa-ticket",
      DisplayName: "Support Tickets"
    }
  ]
});

data.Forms = [];
data.DataReports = [];
data.FormReports = [];
data.FormNewReports = [];
data.OtherModules = [];

resource.Data = JSON.stringify(data);

fs.writeFileSync(outputAppDefPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.writeFileSync(outputResourcePath, `${JSON.stringify(resource, null, 2)}\n`, "utf8");
fs.writeFileSync(outputReportPath, `${JSON.stringify({
  status: "pass",
  package: appTitle,
  source: sourceResourcePath,
  outputs: { appDef: outputAppDefPath, resource: outputResourcePath },
  freshIdFamily: family,
  includedPatterns: [
    "one Type 103 dashboard page",
    "one local Support Tickets data list",
    "one table-style Collection control",
    "one search-filter bound to __filter_filter_Tickets",
    "Collection fulltext search over Title, Text1, and Text4",
    "table header and row flex_grid controls with display captions turned off",
    "header flex_grid plus one repeated row per item",
    "dynamic-field controls with source 3",
    "dateFormat expression with variable_ctx __ctx_coll",
    "conditional priority badge style rules",
    "designer nv_label names"
  ],
  intentionallyExcluded: [
    "card/grid Collection",
    "hide/show dynamic display rules",
    "charts, summaries, reports, workflows, approval forms, AI, connections, and document libraries"
  ],
  replaceIds: resource.ReplaceIds
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status: "pass",
  appDef: outputAppDefPath,
  resource: outputResourcePath,
  report: outputReportPath,
  replaceIds: resource.ReplaceIds.length
}, null, 2));
