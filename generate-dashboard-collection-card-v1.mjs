import fs from "node:fs";
import crypto from "node:crypto";

const sourceResourcePath = "service-desk-pro-dashboard-stage-d-resource.json";
const outputAppDefPath = "generated-dashboard-collection-card-v1-app-def.json";
const outputResourcePath = "generated-dashboard-collection-card-v1-resource.json";
const outputReportPath = "generated-dashboard-collection-card-v1-generation-report.json";

const oldFamily = "248";
const family = "260";
const generatedAt = "2026-05-13 14:00:00";
const appTitle = "Generated Dashboard Collection Card v1";
const appDescription = "Minimal dashboard Collection test with one local Support Tickets list and one card/grid Collection control.";

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
  return {
    id: id(),
    type,
    label,
    attrs,
    children,
    ...extra
  };
}

function heading(value, size = "h5-medium", color = "#0f172a", extra = {}) {
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
    nv_label: "Collection priority badge",
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
      }, { nv_label: "Collection priority value" })
    ]
  };
}

function collectionPage(rootId, dashboardId, supportTicketsListId, appId) {
  const itemTemplate = control("container", "Container", {
    style: { gap: [null, "--sp--s100"] },
    common: {
      padding: [null, { top: "--sp--s300", right: "--sp--s300", bottom: "--sp--s300", left: "--sp--s300" }],
      background: { normal: { type: "classic", classic: { color: "#ffffff" } } },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)",
          radius: [null, { top: "--sp--s300", right: "--sp--s300", bottom: "--sp--s300", left: "--sp--s300" }]
        }
      }
    }
  }, [
    dynamicField("Title", {
      common: { positioning: { widthtype: [null, "2"] } },
      item_style: { ty: { size: [null, "--sp--s200"] }, normal: { color: "var(--c--text)" } }
    }, { nv_label: "Collection ticket title" }),
    control("container", "Container", {
      style: {
        direction: [null, "row"],
        justify_content: [null, "space-between"],
        align_items: [null, "center"],
        gap: [null, "--sp--s150"]
      }
    }, [
      priorityBadge(),
      dynamicField("Text3", {
        common: { positioning: { widthtype: [null, "2"] } },
        prefix: "Status:",
        "t-be": { gap: [null, 6], ty: { wei: "500" } }
      }, { nv_label: "Collection status value" })
    ], { nv_label: "Collection status row" }),
    dynamicField("Text4", {
      item_style: { normal: { color: "var(--c--neutral-dark-hover)" }, ty: [null, "s-regular"] }
    }, { nv_label: "Collection assigned team value" })
  ], { nv_label: "Collection card item template" });

  const collection = control("collection", "Collection", {
    data: {
      list: {
        AppID: appId,
        ListID: supportTicketsListId,
        Type: 1,
        Title: "Support Tickets",
        ListSetID: rootId
      },
      link: "default"
    },
    layout: {
      cg: [null, 24],
      rg: [null, 24],
      cp: [null, { top: "--sp--s300", right: "--sp--s300", bottom: "--sp--s300", left: "--sp--s300" }],
      normal: {
        border: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "var(--c--neutral-light-active)",
          radius: [null, { top: "--sp--s300", right: "--sp--s300", bottom: "--sp--s300", left: "--sp--s300" }]
        }
      },
      hover: {
        border: {
          boxShadow: { color: "rgba(0, 0, 0, 0.05)", x: 0, y: 1, blur: 3, spread: 0, position: "outline" },
          radius: [null, { top: "", right: "", bottom: "", left: "" }]
        },
        bgColor: "var(--c--neutral-light)"
      }
    }
  }, [itemTemplate], { nv_label: "Support Tickets card collection" });

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
          heading("Tickets Collection Test", "h2-bold"),
          text("<p>Generated minimal dashboard proving one Collection control bound to the local Support Tickets list.</p>")
        ], { nv_label: "Collection page header" }),
        collection
      ], { nv_label: "Collection page section" })
    ],
    attrs: {},
    title: "Tickets Collection Test",
    ver: 2,
    filterVars: [],
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
root.IconUrl = JSON.stringify({ b: "#2563eb", i: "fa-regular fa-layer-group", c: "#ffffff" });

dashboard.Title = "Tickets Collection Test";
dashboard.Created = generatedAt;
dashboard.Modified = generatedAt;
dashboard.LayoutInResources = [
  {
    ID: dashboard.LayoutID,
    RefId: dashboard.LayoutID,
    Resource: JSON.stringify(collectionPage(rootId, dashboard.LayoutID, supportTickets.ListModel.ListID, appId))
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
      Title: "Tickets Collection Test",
      Icon: "fa-regular fa-layer-group",
      DisplayName: "Tickets Collection Test"
    },
    {
      AppID: appId,
      ListID: dashboard.LayoutID,
      ListSetID: rootId,
      Type: 103,
      Title: "Tickets Collection Test",
      Icon: "fa-regular fa-layer-group",
      DisplayName: "Tickets Collection Test"
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
    "one card/grid Collection control",
    "dynamic-field controls with source 3",
    "conditional priority badge style rules",
    "designer nv_label names"
  ],
  intentionallyExcluded: [
    "table-style Collection",
    "Collection full-text filters",
    "dateFormat expression",
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
