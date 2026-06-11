import fs from "node:fs";

const sourceResourcePath = "service-desk-pro-dashboard-stage-g-resource.json";
const outputAppDefPath = "service-desk-pro-dashboard-stage-h-app-def.json";
const outputResourcePath = "service-desk-pro-dashboard-stage-h-resource.json";
const outputReportPath = "service-desk-pro-dashboard-stage-h-generation-report.json";

const oldFamily = "252";
const family = "253";
const rootId = "2530010000000000000";
const executiveDashboardId = "2530010000000000001";
const settingsDashboardId = "2530010000000000002";
const drilldownDashboardId = "2530010000000000003";
const helpGuideDashboardId = "2530010000000000004";
const supportTicketsListId = "2530020000000001000";
const supportTicketsViewId = "2530020000000001801";
const generatedAt = "2026-05-13 03:25:00";
const appId = 41;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function remapString(value) {
  return value
    .split(`${oldFamily}001`).join(`${family}001`)
    .split(`${oldFamily}002`).join(`${family}002`)
    .split(`${oldFamily}003`).join(`${family}003`)
    .split(`${oldFamily}c-`).join(`${family}c-`)
    .split(`${oldFamily}g-`).join(`${family}g-`);
}

function deepRemap(value) {
  if (typeof value === "string") return remapString(value);
  if (Array.isArray(value)) return value.map((item) => deepRemap(item));
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[remapString(key)] = deepRemap(child);
    return out;
  }
  return value;
}

function heading(id, value, size = 22, weight = "700", color = "#071638") {
  return {
    id,
    type: "heading",
    label: "Text",
    displayLabel: true,
    attrs: {
      headc: {
        title: { value, variable: null }
      },
      font: {
        ty: { size: [null, size], wei: weight },
        c: color
      }
    },
    children: []
  };
}

function paragraph(id, html) {
  return {
    id,
    type: "text-editor",
    label: "Text editor",
    displayLabel: true,
    attrs: { value: html },
    children: []
  };
}

function container(id, children, color = "#ffffff") {
  return {
    id,
    type: "container",
    label: "Container",
    displayLabel: true,
    attrs: {
      common: {
        padding: [null, { top: "--sp--s300", right: "--sp--s300", bottom: "--sp--s300", left: "--sp--s300" }],
        background: { normal: { type: "classic", classic: { color } } },
        border: {
          normal: {
            type: "1",
            width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
            color: "var(--c--neutral-light-active)",
            radius: [null, { top: "--sp--s200", right: "--sp--s200", bottom: "--sp--s200", left: "--sp--s200" }]
          }
        }
      }
    },
    children
  };
}

function shell(title, intro, children) {
  return {
    children: [
      {
        id: `253h-section-${title.toLowerCase().replaceAll(" ", "-")}`,
        type: "section",
        label: "Section",
        displayLabel: true,
        attrs: {
          common: {
            padding: [null, { top: "--sp--s500", right: "--sp--s500", bottom: "--sp--s500", left: "--sp--s500" }]
          }
        },
        children: [
          {
            id: `253h-column-${title.toLowerCase().replaceAll(" ", "-")}`,
            type: "section-column",
            label: "",
            displayLabel: true,
            attrs: {},
            children: [
              heading(`253h-title-${title.toLowerCase().replaceAll(" ", "-")}`, title, 30, "700"),
              paragraph(`253h-intro-${title.toLowerCase().replaceAll(" ", "-")}`, `<p>${intro}</p>`),
              ...children
            ]
          }
        ]
      }
    ],
    attrs: {},
    title,
    ver: "1.0.0",
    filterVars: [],
    tempVars: [],
    exts: []
  };
}

function ticketRow(id, ticketId, title, priority, status, team) {
  return container(
    id,
    [
      heading(`${id}-title`, `${ticketId} - ${title}`, 17, "700"),
      paragraph(`${id}-meta`, `<p>Priority: ${priority} | Status: ${status} | Team: ${team}</p>`)
    ],
    priority === "Critical" ? "#fff1f2" : priority === "High" ? "#fff7e6" : "#eef6ff"
  );
}

function makeDrilldownPage() {
  return shell("Drill-down Tickets List", "Static drill-down page scaffold using the same six local Support Tickets sample rows. Dynamic filter variables and collection binding remain excluded until the original collection pattern is rebuilt in isolation.", [
    heading("253h-drilldown-header", "Current Ticket Snapshot", 20, "700"),
    ticketRow("253h-ticket-1001", "T-1001", "VPN access fails for sales team", "High", "In Progress", "Infrastructure Support"),
    ticketRow("253h-ticket-1002", "T-1002", "Laptop replacement request", "Medium", "Assigned", "Workplace Services"),
    ticketRow("253h-ticket-1003", "T-1003", "Email delivery delay", "Critical", "Resolved", "Messaging Support"),
    ticketRow("253h-ticket-1004", "T-1004", "New finance software access", "Low", "Closed", "Application Support"),
    ticketRow("253h-ticket-1005", "T-1005", "Printer unavailable on level 8", "Medium", "On Hold", "Workplace Services"),
    ticketRow("253h-ticket-1006", "T-1006", "CRM permission review", "High", "New", "Application Support")
  ]);
}

function makeHelpGuidePage() {
  return shell("Help Guide", "Static help guide scaffold for Service Desk Pro dashboard users. Runtime links, request submission actions, and workflow references are intentionally excluded in this stage.", [
    container("253h-help-overview", [
      heading("253h-help-overview-title", "Dashboard Overview", 20, "700"),
      paragraph("253h-help-overview-text", "<p>Use Executive Dashboard for SLA-focused status, priority, and ticket volume monitoring. Use Support Tickets to inspect the local source list used by the generated dashboard package.</p>")
    ], "#eef6ff"),
    container("253h-help-settings", [
      heading("253h-help-settings-title", "Configuration Areas", 20, "700"),
      paragraph("253h-help-settings-text", "<p>Settings lists such as request types, categories, support teams, and SLA targets are represented as static cards until each list pattern is generated and imported successfully.</p>")
    ], "#f1f8ec"),
    container("253h-help-next", [
      heading("253h-help-next-title", "Next Runtime Learning Step", 20, "700"),
      paragraph("253h-help-next-text", "<p>The next safe expansion is either dashboard filters bound to local fields or a collection-style drill-down list, but only one of those patterns should be introduced per package.</p>")
    ], "#fff7e6")
  ]);
}

function makeLayout(template, id, title, page) {
  const layout = clone(template);
  layout.LayoutID = id;
  layout.Title = title;
  layout.Type = 103;
  layout.Created = generatedAt;
  layout.Modified = generatedAt;
  layout.LayoutInResources = [
    {
      ...(layout.LayoutInResources?.[0] || {}),
      ID: id,
      RefId: id,
      Resource: JSON.stringify(page),
      Type: 103
    }
  ];
  return layout;
}

const sourceResource = JSON.parse(fs.readFileSync(sourceResourcePath, "utf8"));
const resource = deepRemap(clone(sourceResource));
const data = JSON.parse(resource.Data);

data.Item.ListModel.Title = "Service Desk Pro Dashboard Stage H";
data.Item.ListModel.Description = "Service Desk Pro Executive Dashboard rebuild with Settings, Drill-down Tickets List, and Help Guide static page scaffolds.";
data.Item.ListModel.Created = generatedAt;
data.Item.ListModel.Modified = generatedAt;

for (const layout of data.Item.Layouts) {
  layout.Created = generatedAt;
  layout.Modified = generatedAt;
}

const templateLayout = data.Item.Layouts.find((layout) => layout.LayoutID === executiveDashboardId);
if (!templateLayout) throw new Error(`Executive dashboard layout ${executiveDashboardId} was not found after remap.`);

data.Item.Layouts.push(makeLayout(templateLayout, drilldownDashboardId, "Drill-down Tickets List", makeDrilldownPage()));
data.Item.Layouts.push(makeLayout(templateLayout, helpGuideDashboardId, "Help Guide", makeHelpGuidePage()));

const nav = JSON.parse(data.Item.ListModel.LayoutView);
nav.sort = [
  {
    AppID: appId,
    ListID: executiveDashboardId,
    ListSetID: rootId,
    Type: 103,
    IsHidden: false,
    Title: "Executive Dashboard",
    Icon: "fa-regular fa-chart-line",
    DisplayName: "Executive Dashboard"
  },
  {
    AppID: appId,
    ListID: executiveDashboardId,
    ListSetID: rootId,
    Type: 103,
    Title: "Executive Dashboard",
    Icon: "fa-regular fa-chart-line",
    DisplayName: "Executive Dashboard"
  },
  {
    AppID: appId,
    ListID: settingsDashboardId,
    ListSetID: rootId,
    Type: 103,
    Title: "Settings",
    Icon: "fa-regular fa-gear",
    DisplayName: "Settings"
  },
  {
    AppID: appId,
    ListID: drilldownDashboardId,
    ListSetID: rootId,
    Type: 103,
    Title: "Drill-down Tickets List",
    Icon: "fa-regular fa-list-ul",
    DisplayName: "Drill-down Tickets List"
  },
  {
    AppID: appId,
    ListID: helpGuideDashboardId,
    ListSetID: rootId,
    Type: 103,
    Title: "Help Guide",
    Icon: "fa-regular fa-circle-question",
    DisplayName: "Help Guide"
  },
  {
    AppID: appId,
    ListID: supportTicketsListId,
    ListSetID: rootId,
    Type: 1,
    Title: "Support Tickets",
    Icon: "fa-regular fa-ticket",
    DisplayName: "Support Tickets"
  }
];
data.Item.ListModel.LayoutView = JSON.stringify(nav);

data.Forms = [];
data.DataReports = [];
data.FormReports = [];
resource.Data = JSON.stringify(data);

const supportTickets = data.Childs[0];
const fieldIds = supportTickets.Defs.map((def) => def.FieldID);
const sampleRowIds = Object.keys(supportTickets.ListDatas);
resource.ReplaceIds = [
  executiveDashboardId,
  settingsDashboardId,
  drilldownDashboardId,
  helpGuideDashboardId,
  rootId,
  supportTicketsViewId,
  supportTicketsListId,
  ...fieldIds,
  ...sampleRowIds
];

fs.writeFileSync(outputAppDefPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.writeFileSync(outputResourcePath, `${JSON.stringify(resource, null, 2)}\n`, "utf8");
fs.writeFileSync(outputReportPath, `${JSON.stringify({
  status: "pass",
  stage: "H",
  source: {
    exportStudied: "/Users/Renger/Downloads/Service Desk Pro (1).yap",
    previousStage: sourceResourcePath
  },
  outputs: {
    appDef: outputAppDefPath,
    resource: outputResourcePath
  },
  ids: {
    rootListSetId: rootId,
    executiveDashboardLayoutId: executiveDashboardId,
    settingsDashboardLayoutId: settingsDashboardId,
    drilldownDashboardLayoutId: drilldownDashboardId,
    helpGuideDashboardLayoutId: helpGuideDashboardId,
    supportTicketsListId,
    supportTicketsViewId
  },
  includedPatterns: [
    "Stage G Executive Dashboard, Settings page, and local Support Tickets list",
    "static Drill-down Tickets List Type 103 page scaffold",
    "static Help Guide Type 103 page scaffold",
    "root navigation entries for all staged pages"
  ],
  intentionallyExcluded: [
    "dynamic drill-down collection control and filterVars",
    "opendashboard actions",
    "Settings click-through actions",
    "request submission forms, workflows, AI modules, document libraries, and reports"
  ],
  replaceIds: resource.ReplaceIds
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status: "pass",
  stage: "H",
  appDef: outputAppDefPath,
  resource: outputResourcePath,
  report: outputReportPath,
  replaceIds: resource.ReplaceIds.length,
  layouts: data.Item.Layouts.map((layout) => ({ id: layout.LayoutID, title: layout.Title, type: layout.Type })),
  reportIds: resource.ReportIds.length
}, null, 2));
