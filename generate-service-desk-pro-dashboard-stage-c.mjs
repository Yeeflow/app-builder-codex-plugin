import fs from "node:fs";
import crypto from "node:crypto";

const sourceResourcePath = "generated-dashboard-simple-elements-v2-resource.json";
const outputAppDefPath = "service-desk-pro-dashboard-stage-b-or-c-app-def.json";
const outputResourcePath = "service-desk-pro-dashboard-stage-b-or-c-resource.json";
const outputReportPath = "service-desk-pro-dashboard-stage-b-or-c-generation-report.json";

const oldRootId = "2360010000000000000";
const oldDashboardId = "2360010000000000001";
const freshRootId = "2470010000000000000";
const freshDashboardId = "2470010000000000001";
const appTitle = "Service Desk Pro Dashboard Stage C";
const appDescription = "Static Service Desk Pro Executive Dashboard rebuild: filters, KPI cards, chart placeholders, and ticket-focus sections without data bindings.";
const generatedAt = "2026-05-13 00:20:00";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function remapString(value, replacements) {
  let out = value;
  for (const [from, to] of replacements) out = out.split(from).join(to);
  return out;
}

function deepRemap(value, replacements) {
  if (typeof value === "string") return remapString(value, replacements);
  if (Array.isArray(value)) return value.map((item) => deepRemap(item, replacements));
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      out[remapString(key, replacements)] = deepRemap(child, replacements);
    }
    return out;
  }
  return value;
}

function pageNode(type, label, attrs = {}, children = []) {
  return {
    id: crypto.randomUUID(),
    type,
    label,
    displayLabel: true,
    attrs,
    children
  };
}

function heading(value, size = "h5-medium", color = null) {
  return pageNode("heading", "Text", {
    headc: { title: { value, variable: null } },
    heads: { ty: [null, size], ...(color ? { color: [null, color] } : {}) }
  });
}

function textEditor(html) {
  return pageNode("text-editor", "Text Editor", { value: html });
}

function icon(iconName, color = "#2563eb") {
  return pageNode("icon", "Icon", {
    icon: { icon: iconName },
    style: { color: [null, color], size: [null, 20] }
  });
}

function line() {
  return pageNode("line", "Line", {
    line: { color: [null, "#e5e7eb"], weight: [null, 1] }
  });
}

function card(title, value, detail, color = "#eff6ff", iconName = "fa-regular fa-chart-simple") {
  return pageNode("container", "Container", {
    common: {
      padding: [null, { top: "--sp--s300", right: "--sp--s300", bottom: "--sp--s300", left: "--sp--s300" }],
      background: { normal: { type: "classic", classic: { color } } },
      border: { normal: { radius: [null, 8], color: [null, "#e5e7eb"], width: [null, 1] } }
    }
  }, [
    icon(iconName),
    heading(title, "sm-medium", "#475569"),
    heading(value, "h3-bold", "#111827"),
    heading(detail, "sm-light", "#64748b")
  ]);
}

function placeholder(title, subtitle, tone = "#f8fafc") {
  return pageNode("container", "Container", {
    common: {
      padding: [null, { top: "--sp--s400", right: "--sp--s400", bottom: "--sp--s400", left: "--sp--s400" }],
      background: { normal: { type: "classic", classic: { color: tone } } },
      border: { normal: { radius: [null, 8], color: [null, "#e5e7eb"], width: [null, 1] } }
    }
  }, [
    heading(title, "h5-medium", "#111827"),
    heading(subtitle, "sm-light", "#64748b"),
    line()
  ]);
}

function executiveDashboardPage() {
  return {
    children: [
      pageNode("container", "Container", {
        common: {
          padding: [null, { top: "--sp--s500", right: "--sp--s600", bottom: "--sp--s500", left: "--sp--s600" }],
          background: { normal: { type: "classic", classic: { color: "#ffffff" } } }
        }
      }, [
        pageNode("container", "Container", {}, [
          heading("Executive Dashboard", "h2-bold", "#0f172a"),
          heading("Service health, SLA focus, and ticket flow overview", "md-light", "#64748b")
        ]),
        pageNode("container", "Container", {
          common: {
            padding: [null, { top: "--sp--s300", right: "--sp--s300", bottom: "--sp--s300", left: "--sp--s300" }],
            background: { normal: { type: "classic", classic: { color: "#f8fafc" } } },
            border: { normal: { radius: [null, 8], color: [null, "#e2e8f0"], width: [null, 1] } }
          }
        }, [
          heading("Dashboard filters", "h5-medium", "#0f172a"),
          textEditor("<p>Select Team and Submitted Period controls will be reintroduced after the Service Desk source lists and filter variables are regenerated.</p>")
        ]),
        pageNode("flex_grid", "KPI Cards", { columns: [null, 4], gap: [null, "--sp--s300"] }, [
          card("Total Submitted", "128", "Static placeholder for vTotalSubmitted", "#e0f2fe", "fa-regular fa-inbox"),
          card("Resolved Tickets", "96", "Static placeholder for vTicketsResolved", "#dcfce7", "fa-regular fa-circle-check"),
          card("Open Tickets", "24", "Static placeholder for v_TicketsOpen", "#fef3c7", "fa-regular fa-ticket"),
          card("Critical Open", "6", "Static placeholder for v_TicketsOpenCritical", "#fee2e2", "fa-regular fa-triangle-exclamation")
        ]),
        pageNode("flex_grid", "Chart Placeholders", { columns: [null, 2], gap: [null, "--sp--s300"] }, [
          placeholder("Tickets by Request Type", "Future chart: grouped by Type of Request, filtered by team and submitted period."),
          placeholder("Open Tickets by Priority", "Future chart: priority column chart using Support Tickets.")
        ]),
        pageNode("flex_grid", "Operational Placeholders", { columns: [null, 2], gap: [null, "--sp--s300"] }, [
          placeholder("SLA Compliance", "Future chart: SLA Report and SLA Compliance Rate resources will be studied before binding.", "#f0fdf4"),
          placeholder("Drill-down Tickets List", "Future action: open dashboard link after Drill-down Tickets List page pattern is regenerated.", "#f5f3ff")
        ])
      ])
    ],
    attrs: {},
    title: "Executive Dashboard",
    ver: 2,
    filterVars: [],
    tempVars: [],
    exts: [],
    actions: []
  };
}

const sourceResource = JSON.parse(fs.readFileSync(sourceResourcePath, "utf8"));
const replacements = new Map([
  [oldRootId, freshRootId],
  [oldDashboardId, freshDashboardId]
]);
const resource = deepRemap(clone(sourceResource), replacements);
const data = JSON.parse(resource.Data);
const root = data.Item.ListModel;
const dashboardLayout = data.Item.Layouts.find((layout) => Number(layout.Type) === 103);
if (!dashboardLayout) throw new Error("Source simple dashboard resource does not include a Type 103 layout.");

root.Title = appTitle;
root.Description = appDescription;
root.Created = generatedAt;
root.Modified = generatedAt;
root.LayoutView = JSON.stringify({
  sortVer: 1,
  sort: [
    {
      AppID: root.AppID,
      ListID: freshDashboardId,
      ListSetID: freshRootId,
      Type: 103,
      IsHidden: false,
      Title: "Executive Dashboard",
      Icon: "fa-regular fa-chart-line",
      DisplayName: "Executive Dashboard"
    },
    {
      AppID: root.AppID,
      ListID: freshDashboardId,
      ListSetID: freshRootId,
      Type: 103,
      Title: "Executive Dashboard",
      Icon: "fa-regular fa-chart-line",
      DisplayName: "Executive Dashboard"
    }
  ]
});

dashboardLayout.LayoutID = freshDashboardId;
dashboardLayout.ListID = freshRootId;
dashboardLayout.Title = "Executive Dashboard";
dashboardLayout.Created = generatedAt;
dashboardLayout.Modified = generatedAt;
dashboardLayout.LayoutView = null;
dashboardLayout.Ext2 = JSON.stringify({ src: true });
dashboardLayout.LayoutInResources = [
  {
    ID: freshDashboardId,
    RefId: freshDashboardId,
    Resource: JSON.stringify(executiveDashboardPage())
  }
];

resource.Data = JSON.stringify(data);
resource.ReplaceIds = [freshDashboardId, freshRootId];
resource.ReportIds = [];
resource.FormKeys = [];

fs.writeFileSync(outputAppDefPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.writeFileSync(outputResourcePath, `${JSON.stringify(resource, null, 2)}\n`, "utf8");
fs.writeFileSync(outputReportPath, `${JSON.stringify({
  status: "pass",
  stage: "C",
  source: {
    exportStudied: "/Users/Renger/Downloads/Service Desk Pro (1).yap",
    generatorPattern: sourceResourcePath
  },
  outputs: {
    appDef: outputAppDefPath,
    resource: outputResourcePath
  },
  ids: {
    rootListSetId: freshRootId,
    executiveDashboardLayoutId: freshDashboardId
  },
  includedPatterns: [
    "one root app/listset",
    "one Type 103 Executive Dashboard page",
    "embedded page JSON with LayoutInResources ID and RefId equal to LayoutID",
    "static headings and text-editor notes",
    "static KPI/card placeholders",
    "static chart/table/drill-down placeholders"
  ],
  intentionallyExcluded: [
    "Support Tickets data list",
    "summary controls and dashboard exts",
    "chart widgets",
    "filter variables and filter controls",
    "opendashboard actions",
    "Settings external form actions",
    "approval forms, workflows, AI modules, document libraries, and reports"
  ],
  replaceIds: resource.ReplaceIds
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status: "pass",
  stage: "C",
  appDef: outputAppDefPath,
  resource: outputResourcePath,
  report: outputReportPath,
  replaceIds: resource.ReplaceIds,
  childResources: data.Childs.length,
  forms: data.Forms.length,
  reportIds: resource.ReportIds.length
}, null, 2));
