import fs from "fs";

const sourceResourcePath = "test-dashboard-only-2.resource.json";
const outputDataPath = "generated-dashboard-simple-elements-v2-app-def.json";
const outputResourcePath = "generated-dashboard-simple-elements-v2-resource.json";

const oldRootId = "2054177183285133312";
const oldDashboardId = "2054177238306013185";
const freshRootId = "2360010000000000000";
const freshDashboardId = "2360010000000000001";
const appTitle = "Generated Dashboard Simple Elements v2";
const appDescription = "Generated from the simple static dashboard elements export pattern.";
const generatedAt = "2026-05-12 21:20:00";

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function replaceIds(value, replacements) {
  if (Array.isArray(value)) return value.map((item) => replaceIds(item, replacements));
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = replaceIds(child, replacements);
    return out;
  }
  if (typeof value !== "string") return value;
  let out = value;
  for (const [from, to] of replacements) out = out.split(from).join(to);
  return out;
}

const sourceResource = JSON.parse(fs.readFileSync(sourceResourcePath, "utf8"));
const resource = replaceIds(deepClone(sourceResource), new Map([
  [oldRootId, freshRootId],
  [oldDashboardId, freshDashboardId],
]));
const data = JSON.parse(resource.Data);
const root = data.Item.ListModel;
const dashboardLayout = data.Item.Layouts[0];
const nav = JSON.parse(root.LayoutView);

root.Title = appTitle;
root.Description = appDescription;
root.Created = generatedAt;
root.Modified = generatedAt;
root.LayoutView = JSON.stringify({
  sortVer: 1,
  sort: nav.sort.map((item, index) => ({
    AppID: item.AppID,
    ListID: freshDashboardId,
    ListSetID: freshRootId,
    Type: 103,
    ...(index === 0 ? { IsHidden: false } : {}),
    Title: "Dashboard",
  })),
});

dashboardLayout.Title = "Dashboard";
dashboardLayout.Created = generatedAt;
dashboardLayout.Modified = generatedAt;
dashboardLayout.LayoutInResources = dashboardLayout.LayoutInResources.map((item) => ({
  ...item,
  ID: freshDashboardId,
  RefId: freshDashboardId,
}));

resource.Data = JSON.stringify(data);
resource.ReplaceIds = [freshDashboardId, freshRootId];
resource.ReportIds = [];
resource.FormKeys = [];

fs.writeFileSync(outputDataPath, `${JSON.stringify(data, null, 2)}\n`);
fs.writeFileSync(outputResourcePath, `${JSON.stringify(resource, null, 2)}\n`);
console.log(JSON.stringify({
  status: "pass",
  sourceResourcePath,
  outputDataPath,
  outputResourcePath,
  rootListSetId: freshRootId,
  dashboardLayoutId: freshDashboardId,
  replaceIds: resource.ReplaceIds,
  childResources: data.Childs.length,
  layoutInResources: dashboardLayout.LayoutInResources.length,
  pageResourceLength: dashboardLayout.LayoutInResources[0]?.Resource.length || 0,
}, null, 2));
