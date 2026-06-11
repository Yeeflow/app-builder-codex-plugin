import fs from "fs";

const sourceResource = JSON.parse(fs.readFileSync("visitor-access-management-isolate-a-departments-only.json", "utf8"));

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function walk(value, visitor) {
  visitor(value);
  if (Array.isArray(value)) value.forEach((item) => walk(item, visitor));
  else if (isObject(value)) Object.values(value).forEach((child) => walk(child, visitor));
}

function replaceDeep(value, mapper) {
  if (Array.isArray(value)) return value.map((item) => replaceDeep(item, mapper));
  if (isObject(value)) {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = replaceDeep(child, mapper);
    return out;
  }
  if (typeof value === "string") {
    let out = value;
    for (const [from, to] of mapper.entries()) out = out.split(from).join(to);
    return out;
  }
  return value;
}

function collectLocalResourceIds(resource) {
  const data = JSON.parse(resource.Data);
  const ids = new Set((resource.ReplaceIds || []).map(String));
  for (const layout of data.Item?.Layouts || []) {
    for (const layoutResource of layout.LayoutInResources || []) {
      if (layoutResource.ID) ids.add(String(layoutResource.ID));
      if (layoutResource.RefId) ids.add(String(layoutResource.RefId));
    }
  }
  return ids;
}

function remapLocalResourceIds(resource, base) {
  const ids = collectLocalResourceIds(resource);
  const mapper = new Map();
  [...ids].sort().forEach((id, index) => mapper.set(id, String(base + BigInt(index))));
  return replaceDeep(resource, mapper);
}

function headingPage(title, subtitle, extsValue = {}) {
  return {
    children: [
      {
        id: "4cf19c0a-a66d-47b6-bafd-c2ea7385a8c9",
        type: "container",
        label: "Container",
        displayLabel: true,
        attrs: {
          common: {
            background: { normal: { type: "classic", classic: { color: "#ffffff" } } },
            padding: [null, { top: 24, right: 24, bottom: 24, left: 24 }, null, { top: 16, right: 16, bottom: 16, left: 16 }],
          },
          style: { direction: [null, "column"], gap: [null, 16] },
        },
        children: [
          {
            id: "b02c5bf4-3b58-4b54-a89e-9e71c6de7ec9",
            type: "heading",
            label: "Text",
            displayLabel: true,
            attrs: {
              headc: { title: { value: title, variable: null } },
              heads: { ty: { size: [null, 28], wei: "500" } },
            },
            parentCol: 1,
          },
          {
            id: "a63e58e4-b1e0-4d96-b669-3548ca025407",
            type: "heading",
            label: "Text",
            displayLabel: true,
            attrs: {
              headc: { title: { value: subtitle, variable: null } },
              heads: { ty: { size: [null, 14], wei: "400" }, c: "var(--c--text-light)" },
            },
            parentCol: 1,
          },
        ],
      },
    ],
    attrs: {},
    title,
    ver: 1,
    exts: extsValue,
    filterVars: [],
    tempVars: [],
  };
}

function createPackage({ name, base, pageTitle, subtitle, extsValue }) {
  const resource = remapLocalResourceIds(JSON.parse(JSON.stringify(sourceResource)), base);
  const data = JSON.parse(resource.Data);
  const root = data.Item.ListModel;
  const child = data.Childs[0];
  const list = child.ListModel;

  root.Title = name;
  root.Description = "Dashboard isolation import test generated from a known-good app shell.";
  root.IconUrl = "{\"b\":\"#2563eb\",\"i\":\"fa-regular fa-chart-simple\",\"c\":\"#fff\"}";
  list.Title = "Dashboard Tickets";
  list.Description = "Minimal source list for dashboard isolation testing.";
  child.Defs[0].DisplayName = "Ticket Title";
  child.Defs[1].DisplayName = "Ticket ID";
  child.Defs[2].DisplayName = "Owner";
  child.Defs[3].DisplayName = "Region";
  child.Defs[4].DisplayName = "Status";
  child.Defs[5].DisplayName = "Notes";

  const dashboardLayout = data.Item.Layouts[0];
  dashboardLayout.Title = pageTitle;
  dashboardLayout.LayoutInResources[0].Resource = JSON.stringify(headingPage(pageTitle, subtitle, extsValue));

  const nav = JSON.parse(root.LayoutView);
  nav.sort[0].Title = pageTitle;
  nav.sort[1].Title = "Dashboard Tickets";
  root.LayoutView = JSON.stringify(nav);

  resource.Data = JSON.stringify(data);
  resource.ReplaceIds = Array.from(new Set(resource.ReplaceIds.map(String)));
  resource.FormKeys = [];

  fs.writeFileSync(`${name}.resource.json`, `${JSON.stringify(resource, null, 2)}\n`);
  fs.writeFileSync(`${name}.app-def.json`, `${JSON.stringify(data, null, 2)}\n`);
  return {
    name,
    resource: `${name}.resource.json`,
    appDef: `${name}.app-def.json`,
    rootListSetId: root.ListID,
    dashboardLayoutId: dashboardLayout.LayoutID,
    dashboardResourceId: dashboardLayout.LayoutInResources[0].ID,
    childListId: list.ListID,
  };
}

const outputs = [
  createPackage({
    name: "generated-dashboard-isolate-v2-shell",
    base: 2310010000000000000n,
    pageTitle: "Dashboard Shell",
    subtitle: "Dashboard page with no widgets or exts.",
    extsValue: {},
  }),
  createPackage({
    name: "generated-dashboard-isolate-v3-shell-exts-array",
    base: 2320010000000000000n,
    pageTitle: "Dashboard Shell Exts Array",
    subtitle: "Dashboard page with empty exts array.",
    extsValue: [],
  }),
  createPackage({
    name: "generated-dashboard-isolate-v4-shell-preserve-tenant",
    base: 2330010000000000000n,
    pageTitle: "Dashboard Shell Preserve Tenant",
    subtitle: "Dashboard page with empty exts array and original tenant/user metadata.",
    extsValue: [],
  }),
  createPackage({
    name: "generated-dashboard-isolate-v5-shell-replaceids-only",
    base: 2340010000000000000n,
    pageTitle: "Dashboard Shell ReplaceIds Only",
    subtitle: "Dashboard page with empty exts array and only ReplaceIds remapped.",
    extsValue: [],
  }),
];

console.log(JSON.stringify({ status: "pass", outputs }, null, 2));
