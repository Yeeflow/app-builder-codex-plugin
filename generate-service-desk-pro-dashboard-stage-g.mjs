import fs from "node:fs";

const sourceResourcePath = "service-desk-pro-dashboard-stage-f2-resource.json";
const outputAppDefPath = "service-desk-pro-dashboard-stage-g-app-def.json";
const outputResourcePath = "service-desk-pro-dashboard-stage-g-resource.json";
const outputReportPath = "service-desk-pro-dashboard-stage-g-generation-report.json";

const oldFamily = "251";
const family = "252";
const rootId = "2520010000000000000";
const executiveDashboardId = "2520010000000000001";
const settingsDashboardId = "2520010000000000002";
const supportTicketsListId = "2520020000000001000";
const supportTicketsViewId = "2520020000000001801";
const generatedAt = "2026-05-13 03:05:00";
const appId = 41;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function remapString(value) {
  return value
    .split(`${oldFamily}001`).join(`${family}001`)
    .split(`${oldFamily}002`).join(`${family}002`)
    .split(`${oldFamily}003`).join(`${family}003`)
    .split(`${oldFamily}c-`).join(`${family}c-`);
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
        title: {
          value,
          variable: null
        }
      },
      font: {
        ty: {
          size: [null, size],
          wei: weight
        },
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
    attrs: {
      value: html,
      common: {
        padding: [null, { top: 0, right: 0, bottom: 0, left: 0 }]
      }
    },
    children: []
  };
}

function card(id, iconId, titleId, descId, title, desc, icon, color) {
  return {
    id,
    type: "container",
    label: "Container",
    displayLabel: true,
    attrs: {
      common: {
        padding: [null, { top: "--sp--s300", right: "--sp--s300", bottom: "--sp--s300", left: "--sp--s300" }],
        background: {
          normal: {
            type: "classic",
            classic: { color }
          }
        },
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
    children: [
      {
        id: iconId,
        type: "icon",
        label: "Icon",
        displayLabel: true,
        attrs: {
          icon: {
            value: icon,
            color: "#071638",
            size: 24
          }
        },
        children: []
      },
      heading(titleId, title, 18, "700"),
      paragraph(descId, `<p>${desc}</p>`)
    ]
  };
}

function makeSettingsPage() {
  return {
    children: [
      {
        id: "252g-section-settings",
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
            id: "252g-column-settings",
            type: "section-column",
            label: "",
            displayLabel: true,
            attrs: {},
            children: [
              heading("252g-settings-title", "Settings", 30, "700"),
              paragraph("252g-settings-intro", "<p>Service Desk Pro configuration areas staged as safe static dashboard links. Runtime actions will be added only after each target resource pattern is regenerated and tested.</p>"),
              {
                id: "252g-settings-grid-ticket",
                type: "flex_grid",
                label: "Ticket Management",
                displayLabel: true,
                attrs: {
                  title: {
                    value: "Ticket Management",
                    variable: null
                  },
                  common: {
                    margin: [null, { top: "--sp--s400", right: null, bottom: null, left: null }]
                  }
                },
                children: [
                  card("252g-card-request-types", "252g-icon-request-types", "252g-title-request-types", "252g-desc-request-types", "Request Types", "Classify incoming requests before dashboard filters and charts bind to the source list.", "fa-regular fa-list-check", "#eef6ff"),
                  card("252g-card-categories", "252g-icon-categories", "252g-title-categories", "252g-desc-categories", "Ticket Categories", "Manage operational groupings for ticket routing and reporting.", "fa-regular fa-tags", "#f1f8ec"),
                  card("252g-card-support-teams", "252g-icon-support-teams", "252g-title-support-teams", "252g-desc-support-teams", "Support Teams", "Prepare team ownership values used by filters and escalation views.", "fa-regular fa-users-gear", "#fff7e6")
                ]
              },
              {
                id: "252g-settings-grid-operations",
                type: "flex_grid",
                label: "Operational Settings",
                displayLabel: true,
                attrs: {
                  title: {
                    value: "Operational Settings",
                    variable: null
                  },
                  common: {
                    margin: [null, { top: "--sp--s300", right: null, bottom: null, left: null }]
                  }
                },
                children: [
                  card("252g-card-sla-targets", "252g-icon-sla-targets", "252g-title-sla-targets", "252g-desc-sla-targets", "SLA Targets", "Define response and resolution targets after SLA report resources are studied.", "fa-regular fa-stopwatch", "#fff1f2"),
                  card("252g-card-config-items", "252g-icon-config-items", "252g-title-config-items", "252g-desc-config-items", "Configuration Items", "Track affected services or assets for later ticket analysis.", "fa-regular fa-diagram-project", "#f4f1ff"),
                  card("252g-card-help-guide", "252g-icon-help-guide", "252g-title-help-guide", "252g-desc-help-guide", "Help Guide", "Static guide page will be introduced in the next stage before any linked actions are enabled.", "fa-regular fa-circle-question", "#ecfeff")
                ]
              }
            ]
          }
        ]
      }
    ],
    attrs: {},
    title: "Settings",
    ver: "1.0.0",
    filterVars: [],
    tempVars: [],
    exts: []
  };
}

const sourceResource = JSON.parse(fs.readFileSync(sourceResourcePath, "utf8"));
const resource = deepRemap(clone(sourceResource));
const data = JSON.parse(resource.Data);

data.Item.ListModel.Title = "Service Desk Pro Dashboard Stage G";
data.Item.ListModel.Description = "Service Desk Pro Executive Dashboard rebuild with proven KPIs, one chart, and a static Settings page.";
data.Item.ListModel.Created = generatedAt;
data.Item.ListModel.Modified = generatedAt;

for (const layout of data.Item.Layouts) {
  layout.Created = generatedAt;
  layout.Modified = generatedAt;
}

const executiveLayout = data.Item.Layouts.find((layout) => layout.LayoutID === executiveDashboardId);
if (!executiveLayout) throw new Error(`Executive dashboard layout ${executiveDashboardId} was not found after remap.`);

const settingsLayout = clone(executiveLayout);
settingsLayout.LayoutID = settingsDashboardId;
settingsLayout.Title = "Settings";
settingsLayout.Type = 103;
settingsLayout.LayoutInResources = [
  {
    ...(settingsLayout.LayoutInResources?.[0] || {}),
    ID: settingsDashboardId,
    RefId: settingsDashboardId,
    Resource: JSON.stringify(makeSettingsPage()),
    Type: 103
  }
];
data.Item.Layouts.push(settingsLayout);

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
resource.ReplaceIds = [executiveDashboardId, settingsDashboardId, rootId, supportTicketsViewId, supportTicketsListId, ...fieldIds, ...sampleRowIds];

fs.writeFileSync(outputAppDefPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.writeFileSync(outputResourcePath, `${JSON.stringify(resource, null, 2)}\n`, "utf8");
fs.writeFileSync(outputReportPath, `${JSON.stringify({
  status: "pass",
  stage: "G",
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
    supportTicketsListId,
    supportTicketsViewId
  },
  includedPatterns: [
    "Stage F2 Executive Dashboard with four bound KPIs and one bound priority chart",
    "one local Support Tickets data list",
    "static Settings Type 103 page",
    "root navigation entries for Executive Dashboard, Settings, and Support Tickets"
  ],
  intentionallyExcluded: [
    "Settings click-through actions",
    "Request Types, Ticket Categories, SLA Targets, Support Teams, and Configuration Items child lists",
    "Dashboard filters",
    "Drill-down Tickets List and Help Guide pages",
    "approval forms, workflows, AI modules, document libraries, and reports"
  ],
  replaceIds: resource.ReplaceIds
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status: "pass",
  stage: "G",
  appDef: outputAppDefPath,
  resource: outputResourcePath,
  report: outputReportPath,
  replaceIds: resource.ReplaceIds.length,
  layouts: data.Item.Layouts.map((layout) => ({ id: layout.LayoutID, title: layout.Title, type: layout.Type })),
  reportIds: resource.ReportIds.length
}, null, 2));
