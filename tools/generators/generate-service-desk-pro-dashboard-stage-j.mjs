import fs from "node:fs";

const sourceResourcePath = "service-desk-pro-dashboard-stage-i-resource.json";
const outputAppDefPath = "service-desk-pro-dashboard-stage-j-app-def.json";
const outputResourcePath = "service-desk-pro-dashboard-stage-j-resource.json";
const outputReportPath = "service-desk-pro-dashboard-stage-j-generation-report.json";

const oldFamily = "254";
const family = "255";
const rootId = "2550010000000000000";
const drilldownDashboardId = "2550010000000000003";
const actionId = "255j-open-drilldown";
const generatedAt = "2026-05-13 09:40:00";
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
    .split(`${oldFamily}g-`).join(`${family}g-`)
    .split(`${oldFamily}h-`).join(`${family}h-`)
    .split(`${oldFamily}i-`).join(`${family}i-`);
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

function makeOpenDrilldownAction() {
  return {
    id: actionId,
    name: "Open Drill-down Tickets List",
    steps: [
      {
        type: "opendashboard",
        attrs: {
          data: {
            page: {
              AppID: appId,
              ListSetID: rootId,
              PageID: drilldownDashboardId
            }
          },
          op: "modal",
          modalsize: 2,
          queryParams: [
            {
              name: "Title",
              value: {
                value: "Open Tickets",
                variable: null
              }
            }
          ]
        }
      }
    ]
  };
}

function findNode(value, predicate) {
  if (!value || typeof value !== "object") return null;
  if (predicate(value)) return value;
  const children = Array.isArray(value.children) ? value.children : [];
  for (const child of children) {
    const found = findNode(child, predicate);
    if (found) return found;
  }
  return null;
}

const sourceResource = JSON.parse(fs.readFileSync(sourceResourcePath, "utf8"));
const resource = deepRemap(clone(sourceResource));
const data = JSON.parse(resource.Data);

data.Item.ListModel.Title = "Service Desk Pro Dashboard Stage J";
data.Item.ListModel.Description = "Service Desk Pro dashboard with one isolated Executive Dashboard open-dashboard action.";
data.Item.ListModel.Created = generatedAt;
data.Item.ListModel.Modified = generatedAt;

for (const layout of data.Item.Layouts) {
  layout.Created = generatedAt;
  layout.Modified = generatedAt;
}

const executiveLayout = data.Item.Layouts.find((layout) => layout.Title === "Executive Dashboard");
const page = JSON.parse(executiveLayout.LayoutInResources[0].Resource);
page.actions = [makeOpenDrilldownAction()];

const drilldownCard = findNode(page, (node) =>
  Array.isArray(node.children) &&
  node.children.some((child) => child?.attrs?.headc?.title?.value === "Drill-down Tickets List")
);

if (!drilldownCard) {
  throw new Error("Could not locate Drill-down Tickets List action target card.");
}

drilldownCard.attrs = drilldownCard.attrs || {};
drilldownCard.attrs.control_action = actionId;
const helpText = drilldownCard.children.find((child) =>
  child?.attrs?.headc?.title?.value?.startsWith("Future action:")
);
if (helpText) {
  helpText.attrs.headc.title.value = "Click to open the staged Drill-down Tickets List page in a modal.";
}

executiveLayout.LayoutInResources[0].Resource = JSON.stringify(page);
resource.Data = JSON.stringify(data);

fs.writeFileSync(outputAppDefPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.writeFileSync(outputResourcePath, `${JSON.stringify(resource, null, 2)}\n`, "utf8");
fs.writeFileSync(outputReportPath, `${JSON.stringify({
  status: "pass",
  stage: "J",
  source: { previousStage: sourceResourcePath },
  outputs: { appDef: outputAppDefPath, resource: outputResourcePath },
  includedPatterns: [
    "one Executive Dashboard page action using opendashboard",
    "local Type 103 Drill-down Tickets List target",
    "modal open behavior with one static Title query parameter"
  ],
  intentionallyExcluded: [
    "priority/team/submitted-period query parameters",
    "dynamic drill-down collection",
    "Settings click-through actions",
    "SLA report resources"
  ],
  action: {
    id: actionId,
    targetPageId: drilldownDashboardId,
    targetListSetId: rootId
  },
  replaceIds: resource.ReplaceIds
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status: "pass",
  stage: "J",
  appDef: outputAppDefPath,
  resource: outputResourcePath,
  report: outputReportPath,
  replaceIds: resource.ReplaceIds.length,
  actionId,
  targetPageId: drilldownDashboardId
}, null, 2));
