import fs from "node:fs";

const sourceResourcePath = "service-desk-pro-dashboard-stage-j-resource.json";
const outputAppDefPath = "service-desk-pro-dashboard-stage-k-app-def.json";
const outputResourcePath = "service-desk-pro-dashboard-stage-k-resource.json";
const outputReportPath = "service-desk-pro-dashboard-stage-k-generation-report.json";

const oldFamily = "255";
const family = "256";
const supportTicketsListId = "2560020000000001000";
const generatedAt = "2026-05-13 10:00:00";
const appId = 41;
const rootId = "2560010000000000000";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function remapString(value) {
  return value
    .split(`${oldFamily}001`).join(`${family}001`)
    .split(`${oldFamily}002`).join(`${family}002`)
    .split(`${oldFamily}003`).join(`${family}003`)
    .split(`${oldFamily}c-`).join(`${family}c-`)
    .split(`${oldFamily}g-`).join(`${family}g-`)
    .split(`${oldFamily}h-`).join(`${family}h-`)
    .split(`${oldFamily}i-`).join(`${family}i-`)
    .split(`${oldFamily}j-`).join(`${family}j-`);
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

function supportTicketsDataList() {
  return {
    id: "256k-drilldown-ticket-data-list",
    type: "data-list",
    label: "Ticket table",
    displayLabel: true,
    attrs: {
      listarr: [
        { DisplayName: "Ticket ID", FieldName: "Ticket ID", Field: "Text1" },
        { DisplayName: "Title", FieldName: "Title", Field: "Title" },
        { DisplayName: "Priority", FieldName: "Priority", Field: "Text2" },
        { DisplayName: "Status", FieldName: "Status", Field: "Text3" },
        { DisplayName: "Assigned Team", FieldName: "Assigned Team", Field: "Text4" }
      ],
      data: {
        list: {
          AppID: appId,
          ListID: supportTicketsListId,
          Type: 1,
          Title: "Support Tickets",
          ListSetID: rootId
        },
        ps: 20,
        filter: [],
        fulltext: [],
        sort: [{ SortName: "Created", SortByDesc: false }]
      },
      header: {
        normal: {
          bgcolor: "#0f172a",
          color: "#ffffff"
        },
        ty: [null, "s-semi-bold"]
      },
      body: {
        bdt: "1",
        bdw: [
          null,
          {
            top: null,
            right: null,
            bottom: 1,
            left: null
          }
        ],
        bdc: "var(--c--neutral-light-hover)"
      },
      fallback: {
        et: "No support tickets found."
      }
    },
    children: []
  };
}

const sourceResource = JSON.parse(fs.readFileSync(sourceResourcePath, "utf8"));
const resource = deepRemap(clone(sourceResource));
const data = JSON.parse(resource.Data);

data.Item.ListModel.Title = "Service Desk Pro Dashboard Stage K";
data.Item.ListModel.Description = "Service Desk Pro dashboard with a data-bound Drill-down Tickets List table.";
data.Item.ListModel.Created = generatedAt;
data.Item.ListModel.Modified = generatedAt;

for (const layout of data.Item.Layouts) {
  layout.Created = generatedAt;
  layout.Modified = generatedAt;
}

const drilldownLayout = data.Item.Layouts.find((layout) => layout.Title === "Drill-down Tickets List");
const page = JSON.parse(drilldownLayout.LayoutInResources[0].Resource);
const column = page.children?.[0]?.children?.[0];
if (!column?.children) {
  throw new Error("Could not locate Drill-down Tickets List page column.");
}

const intro = column.children.find((child) => child.id?.includes("intro-drill-down-tickets-list"));
if (intro?.attrs?.value) {
  intro.attrs.value = "<p>Dynamic table bound to the local Support Tickets list. Query-parameter filters are still excluded until the original temp-variable filter semantics are rebuilt in isolation.</p>";
}

column.children = [
  ...column.children.slice(0, 3),
  supportTicketsDataList()
];

drilldownLayout.LayoutInResources[0].Resource = JSON.stringify(page);
resource.Data = JSON.stringify(data);

fs.writeFileSync(outputAppDefPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.writeFileSync(outputResourcePath, `${JSON.stringify(resource, null, 2)}\n`, "utf8");
fs.writeFileSync(outputReportPath, `${JSON.stringify({
  status: "pass",
  stage: "K",
  source: { previousStage: sourceResourcePath },
  outputs: { appDef: outputAppDefPath, resource: outputResourcePath },
  includedPatterns: [
    "Drill-down Tickets List uses dashboard data-list control",
    "data-list control binds to local Support Tickets",
    "columns map to Ticket ID, Title, Priority, Status, and Assigned Team"
  ],
  intentionallyExcluded: [
    "query parameter filters",
    "tempVars for Priority/Status/Owner/Team/SubmitPeriod",
    "custom collection card layout",
    "Settings click-through actions",
    "SLA report resources"
  ],
  replaceIds: resource.ReplaceIds
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status: "pass",
  stage: "K",
  appDef: outputAppDefPath,
  resource: outputResourcePath,
  report: outputReportPath,
  replaceIds: resource.ReplaceIds.length,
  dataList: supportTicketsListId
}, null, 2));
