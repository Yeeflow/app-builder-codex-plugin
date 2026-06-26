import fs from "node:fs";

const sourceResourcePath = "service-desk-pro-dashboard-stage-l-exportback-resource.json";
const sourceAppDefPath = "service-desk-pro-dashboard-stage-l-exportback-app-def.json";
const stageLResourcePath = "service-desk-pro-dashboard-stage-l-resource.json";
const outputAppDefPath = "service-desk-pro-dashboard-stage-m-app-def.json";
const outputResourcePath = "service-desk-pro-dashboard-stage-m-resource.json";
const outputReportPath = "service-desk-pro-dashboard-stage-m-generation-report.json";

const oldFamily = "257";
const family = "258";
const generatedAt = "2026-05-13 12:00:00";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function remapFamilyString(value) {
  return value
    .split(`${oldFamily}c-`).join(`${family}c-`)
    .split(`${oldFamily}g-`).join(`${family}g-`)
    .split(`${oldFamily}h-`).join(`${family}h-`)
    .split(`${oldFamily}i-`).join(`${family}i-`)
    .split(`${oldFamily}j-`).join(`${family}j-`)
    .split(`${oldFamily}k-`).join(`${family}k-`)
    .split(`${oldFamily}l-`).join(`${family}l-`)
    .split(`${oldFamily}m-`).join(`${family}m-`);
}

function makeIdMapper(sourceResource, stageLResource) {
  const sourceIds = sourceResource.ReplaceIds || [];
  const newIds = (stageLResource.ReplaceIds || []).map((id) =>
    typeof id === "string" ? id.replace(/^257/, "258") : id
  );
  if (sourceIds.length !== newIds.length) {
    throw new Error(`ReplaceIds length mismatch: source ${sourceIds.length}, target ${newIds.length}`);
  }
  const pairs = sourceIds.map((id, index) => [String(id), String(newIds[index])]);
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

function periodCondition(controlId) {
  return {
    key: `258m-period-${controlId}`,
    pre: "and",
    left: "Datetime1",
    op: "0",
    right: [
      {
        exprType: "variable",
        valueType: "string",
        id: "__filter_f_SubmittedPeriod",
        type: "expr",
        name: "f_SubmittedPeriod"
      }
    ],
    showCus: false
  };
}

function ensureSubmittedPeriodConditions(page) {
  let updated = 0;
  for (const ext of page.exts || []) {
    if (!["summary", "bar-chart"].includes(ext.key)) continue;
    const settings = ext.attr?.settings;
    if (!settings) continue;
    settings.Conditions ||= [];
    const hasPeriod = settings.Conditions.some((condition) => {
      const right = condition.right;
      return Array.isArray(right) && right.some((expr) => expr?.name === "f_SubmittedPeriod");
    });
    if (!hasPeriod) {
      settings.Conditions.push(periodCondition(ext.i));
      updated += 1;
    }
  }
  return updated;
}

function updateSettingsPage(page) {
  let grids = 0;
  function walk(control) {
    if (!control || typeof control !== "object") return;
    if (control.type === "flex_grid") {
      control.attrs ||= {};
      control.attrs.cgap = { ...(control.attrs.cgap || {}), "1": 24 };
      control.attrs.cgapU = { ...(control.attrs.cgapU || {}), "1": "px" };
      control.attrs.rgap = { ...(control.attrs.rgap || {}), "1": 24 };
      control.attrs.rgapU = { ...(control.attrs.rgapU || {}), "1": "px" };
      grids += 1;
    }
    for (const child of control.children || []) walk(child);
  }
  walk(page);
  return grids;
}

function heading(id, value, size = "h2-bold") {
  return {
    id,
    type: "heading",
    label: "Text",
    displayLabel: true,
    attrs: {
      heads: {
        ty: [null, size],
        color: [null, "#0f172a"]
      },
      headc: {
        title: { value, variable: null }
      }
    },
    children: []
  };
}

function text(id, html) {
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

function icon(id, iconName) {
  return {
    id,
    type: "icon",
    label: "Icon",
    displayLabel: true,
    attrs: {
      icon: {
        value: iconName,
        color: "#071638",
        size: 24,
        align: [null, "start"]
      },
      common: {
        positioning: {
          widthtype: [null, "2"]
        }
      }
    },
    children: []
  };
}

function card(id, color, iconName, title, body) {
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
    children: [
      icon(`${id}-icon`, iconName),
      heading(`${id}-title`, title, "l-medium"),
      text(`${id}-text`, `<p>${body}</p>`)
    ]
  };
}

function flexGrid(id, title, children) {
  return {
    id,
    type: "flex_grid",
    label: title,
    displayLabel: true,
    attrs: {
      title: { value: title, variable: null },
      common: { margin: [null, { top: "--sp--s400", right: null, bottom: null, left: null }] },
      columns: [
        null,
        {
          list: [
            { sizing: "minmax", min: 0, minU: "px", max: 1, maxU: "fr" },
            { value: 1, unit: "fr" },
            { value: 1, unit: "fr" }
          ],
          last: { value: 1, unit: "fr" }
        },
        null,
        {
          list: [{ sizing: "minmax", min: 0, minU: "px", max: 1, maxU: "fr" }],
          last: { value: 1, unit: "fr" }
        }
      ],
      ver: 1,
      cgap: { "1": 24 },
      cgapU: { "1": "px" },
      rgap: { "1": 24 },
      rgapU: { "1": "px" },
      rows: [null, { list: [{ unit: "auto" }], last: { unit: "auto" } }]
    },
    children
  };
}

function improvedHelpPage() {
  return {
    children: [
      {
        id: "258m-section-help-guide",
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
            id: "258m-column-help-guide",
            type: "section-column",
            label: "",
            displayLabel: true,
            attrs: {},
            children: [
              heading("258m-help-title", "Help Guide"),
              text(
                "258m-help-intro",
                "<p>Use this guide as the operating map for the generated Service Desk Pro dashboard. Links and workflow actions stay staged until each runtime dependency is proven.</p>"
              ),
              flexGrid("258m-help-grid-primary", "Dashboard Usage", [
                card(
                  "258m-help-card-dashboard",
                  "#eef6ff",
                  "fa-regular fa-chart-line",
                  "Executive Dashboard",
                  "Review submitted, resolved, open, and critical ticket indicators. Use the team and submitted-period filters to narrow dashboard metrics."
                ),
                card(
                  "258m-help-card-drilldown",
                  "#f1f8ec",
                  "fa-regular fa-table-list",
                  "Drill-down Tickets",
                  "Open the ticket detail table from navigation or the dashboard card. The current generated baseline proves local table binding and static priority filtering."
                ),
                card(
                  "258m-help-card-settings",
                  "#fff7e6",
                  "fa-regular fa-sliders",
                  "Settings Areas",
                  "Configuration cards are staged as safe static links until each target list and action pattern is regenerated and import-tested."
                )
              ]),
              flexGrid("258m-help-grid-process", "Operating Notes", [
                card(
                  "258m-help-card-source",
                  "#fff1f2",
                  "fa-regular fa-database",
                  "Source Lists",
                  "Support Tickets and Support Teams are local generated lists. Native Title metadata must remain unchanged to avoid query failures."
                ),
                card(
                  "258m-help-card-validation",
                  "#f4f1ff",
                  "fa-regular fa-circle-check",
                  "Validation",
                  "Every generated package is validated, wrapped, round-trip checked, imported, and opened before it is treated as a learned baseline."
                ),
                card(
                  "258m-help-card-next",
                  "#ecfeff",
                  "fa-regular fa-route",
                  "Next Learning",
                  "The next risky areas are query-parameter to temp-variable filtering, original collection cards, Settings actions, and SLA report resources."
                )
              ])
            ]
          }
        ]
      }
    ],
    attrs: {},
    title: "Help Guide",
    ver: 2,
    filterVars: [],
    tempVars: [],
    exts: []
  };
}

const sourceResource = JSON.parse(fs.readFileSync(sourceResourcePath, "utf8"));
const sourceAppDef = JSON.parse(fs.readFileSync(sourceAppDefPath, "utf8"));
const stageLResource = JSON.parse(fs.readFileSync(stageLResourcePath, "utf8"));
const { newIds, remapString } = makeIdMapper(sourceResource, stageLResource);
const resource = deepRemap(clone(sourceResource), remapString);
resource.ReplaceIds = newIds;

const data = deepRemap(clone(sourceAppDef), remapString);
data.Item.ListModel.Title = "Service Desk Pro Dashboard Stage M";
data.Item.ListModel.Description = "Service Desk Pro dashboard with submitted-period bindings and refined Settings/Help layouts.";
data.Item.ListModel.Created = generatedAt;
data.Item.ListModel.Modified = generatedAt;

for (const layout of data.Item.Layouts) {
  layout.Created = generatedAt;
  layout.Modified = generatedAt;
}

const executiveLayout = data.Item.Layouts.find((layout) => layout.Title === "Executive Dashboard");
const executivePage = JSON.parse(executiveLayout.LayoutInResources[0].Resource);
const periodConditionsAdded = ensureSubmittedPeriodConditions(executivePage);
executiveLayout.LayoutInResources[0].Resource = JSON.stringify(executivePage);

const settingsLayout = data.Item.Layouts.find((layout) => layout.Title === "Settings");
const settingsPage = JSON.parse(settingsLayout.LayoutInResources[0].Resource);
const settingsGridsUpdated = updateSettingsPage(settingsPage);
settingsLayout.LayoutInResources[0].Resource = JSON.stringify(settingsPage);

const helpLayout = data.Item.Layouts.find((layout) => layout.Title === "Help Guide");
helpLayout.LayoutInResources[0].Resource = JSON.stringify(improvedHelpPage());

resource.Data = JSON.stringify(data);

fs.writeFileSync(outputAppDefPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.writeFileSync(outputResourcePath, `${JSON.stringify(resource, null, 2)}\n`, "utf8");
fs.writeFileSync(outputReportPath, `${JSON.stringify({
  status: "pass",
  stage: "M",
  source: {
    exportBack: sourceResourcePath,
    exportBackAppDef: sourceAppDefPath,
    previousGeneratedStage: stageLResourcePath
  },
  outputs: { appDef: outputAppDefPath, resource: outputResourcePath },
  includedPatterns: [
    "Submitted period condition copied from export-back Total Submitted summary",
    "Submitted period condition applied to remaining KPI summaries and priority chart",
    "Settings export-back layout preserved with 3-column grids and widened 24px gaps",
    "Help Guide rebuilt as static card grids with no external actions"
  ],
  intentionallyExcluded: [
    "query parameter to tempVars mapping",
    "original collection card layout",
    "Settings tile click-through actions",
    "SLA report resources"
  ],
  replaceIds: resource.ReplaceIds,
  periodConditionsAdded,
  settingsGridsUpdated
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status: "pass",
  stage: "M",
  appDef: outputAppDefPath,
  resource: outputResourcePath,
  report: outputReportPath,
  replaceIds: resource.ReplaceIds.length,
  periodConditionsAdded,
  settingsGridsUpdated
}, null, 2));
