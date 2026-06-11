import fs from "fs";

const sourceResourcePath = "test-dashboard-only.resource.json";
const outputDataPath = "generated-dashboard-minimal-v1-app-def.json";
const outputResourcePath = "generated-dashboard-minimal-v1-resource.json";

const oldRootId = "2054177183285133312";
const oldDashboardId = "2054177238306013185";
const freshRootId = "2350010000000000000";
const freshDashboardId = "2350010000000000001";
const appTitle = "Generated Dashboard Minimal v1";
const dashboardTitle = "Dashboard";
const generatedAt = "2026-05-12 20:45:00";

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
root.Description = "Generated from the minimal dashboard-only export pattern.";
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
    Title: dashboardTitle,
  })),
});

dashboardLayout.Title = dashboardTitle;
dashboardLayout.Created = generatedAt;
dashboardLayout.Modified = generatedAt;
dashboardLayout.LayoutInResources = [];

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
  appThemes: data.AppThemes.length,
  appComponents: data.AppComponents.length,
}, null, 2));
