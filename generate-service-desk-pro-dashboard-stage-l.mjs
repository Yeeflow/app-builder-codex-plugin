import fs from "node:fs";

const sourceResourcePath = "service-desk-pro-dashboard-stage-k-resource.json";
const outputAppDefPath = "service-desk-pro-dashboard-stage-l-app-def.json";
const outputResourcePath = "service-desk-pro-dashboard-stage-l-resource.json";
const outputReportPath = "service-desk-pro-dashboard-stage-l-generation-report.json";

const oldFamily = "256";
const family = "257";
const supportTicketsListId = "2570020000000001000";
const generatedAt = "2026-05-13 11:00:00";

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
    .split(`${oldFamily}j-`).join(`${family}j-`)
    .split(`${oldFamily}k-`).join(`${family}k-`);
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

const sourceResource = JSON.parse(fs.readFileSync(sourceResourcePath, "utf8"));
const resource = deepRemap(clone(sourceResource));
const data = JSON.parse(resource.Data);

data.Item.ListModel.Title = "Service Desk Pro Dashboard Stage L";
data.Item.ListModel.Description = "Service Desk Pro dashboard with a static filtered Drill-down Tickets List table.";
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

const title = column.children.find((child) => child.id?.includes("page-title-drill-down-tickets-list"));
if (title?.attrs?.value) {
  title.attrs.value = "<h1>Drill-down Tickets List</h1>";
}

const intro = column.children.find((child) => child.id?.includes("intro-drill-down-tickets-list"));
if (intro?.attrs?.value) {
  intro.attrs.value = "<p>Dynamic table bound to local Support Tickets with a static Priority = High filter. Query-parameter and temp-variable filters remain excluded until their mapping is proven separately.</p>";
}

const table = (() => {
  const found = [];
  function walk(control) {
    if (!control || typeof control !== "object") return;
    if (control.type === "data-list") found.push(control);
    for (const child of control.children || []) walk(child);
  }
  walk(page);
  return found[0];
})();

if (!table) {
  throw new Error("Could not locate Drill-down Tickets List data-list control.");
}

table.id = "257l-drilldown-ticket-data-list-high-priority";
table.label = "High priority ticket table";
table.attrs.data.list.ListID = supportTicketsListId;
table.attrs.data.filter = [
  {
    key: "257l-filter-priority-high",
    pre: "and",
    left: "Text2",
    op: "0",
    right: "High",
    showCus: true
  }
];
table.attrs.fallback = {
  et: "No high priority support tickets found."
};

drilldownLayout.LayoutInResources[0].Resource = JSON.stringify(page);
resource.Data = JSON.stringify(data);

fs.writeFileSync(outputAppDefPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.writeFileSync(outputResourcePath, `${JSON.stringify(resource, null, 2)}\n`, "utf8");
fs.writeFileSync(outputReportPath, `${JSON.stringify({
  status: "pass",
  stage: "L",
  source: { previousStage: sourceResourcePath },
  outputs: { appDef: outputAppDefPath, resource: outputResourcePath },
  includedPatterns: [
    "Drill-down Tickets List keeps dashboard data-list control",
    "data-list control binds to local Support Tickets",
    "data-list control applies one static scalar filter: Text2 Priority equals High"
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
  stage: "L",
  appDef: outputAppDefPath,
  resource: outputResourcePath,
  report: outputReportPath,
  replaceIds: resource.ReplaceIds.length,
  dataList: supportTicketsListId,
  filter: "Text2 == High"
}, null, 2));
