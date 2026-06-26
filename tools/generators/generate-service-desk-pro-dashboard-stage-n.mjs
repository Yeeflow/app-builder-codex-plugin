import fs from "node:fs";

// Stage N is a local continuation generator. It intentionally depends on the
// ignored Stage M decoded artifacts, not on raw exported .yap files.
const sourceResourcePath = "service-desk-pro-dashboard-stage-m-resource.json";
const sourceAppDefPath = "service-desk-pro-dashboard-stage-m-app-def.json";
const previousGeneratedResourcePath = "service-desk-pro-dashboard-stage-m-resource.json";
const outputAppDefPath = "service-desk-pro-dashboard-stage-n-app-def.json";
const outputResourcePath = "service-desk-pro-dashboard-stage-n-resource.json";
const outputReportPath = "service-desk-pro-dashboard-stage-n-generation-report.json";

const oldFamily = "258";
const family = "259";
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
    .split(`${oldFamily}m-`).join(`${family}m-`)
    .split(`${oldFamily}n-`).join(`${family}n-`);
}

function makeIdMapper(sourceResource, previousGeneratedResource) {
  const sourceIds = sourceResource.ReplaceIds || [];
  const newIds = (previousGeneratedResource.ReplaceIds || []).map((id) =>
    typeof id === "string" ? id.replace(/^258/, "259") : id
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
    key: `259n-period-${controlId}`,
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

function updateExecutiveHelperText(page) {
  let updated = 0;
  const oldText = "Use the local Support Teams filter to narrow the KPI and priority chart bindings. Submitted period is rendered as a staged control; date filtering will be bound after period semantics are verified.";
  const newText = "Use the local Support Teams and Submitted period filters to narrow the KPI and priority chart bindings. Submitted period is now bound to the local Created Time field for the generated Support Tickets list.";
  function walk(control) {
    if (!control || typeof control !== "object") return;
    const value = control.attrs?.value;
    if (typeof value === "string" && value.includes(oldText)) {
      control.attrs.value = value.split(oldText).join(newText);
      updated += 1;
    }
    for (const child of control.children || []) walk(child);
  }
  walk(page);
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
        id: "259n-section-help-guide",
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
            id: "259n-column-help-guide",
            type: "section-column",
            label: "",
            displayLabel: true,
            attrs: {},
            children: [
              heading("259n-help-title", "Help Guide"),
              text(
                "259n-help-intro",
                "<p>Use this guide as the operating map for the generated Service Desk Pro dashboard. Links and workflow actions stay staged until each runtime dependency is proven.</p>"
              ),
              flexGrid("259n-help-grid-primary", "Dashboard Usage", [
                card(
                  "259n-help-card-dashboard",
                  "#eef6ff",
                  "fa-regular fa-chart-line",
                  "Executive Dashboard",
                  "Review submitted, resolved, open, and critical ticket indicators. Use the team and submitted-period filters to narrow dashboard metrics."
                ),
                card(
                  "259n-help-card-drilldown",
                  "#f1f8ec",
                  "fa-regular fa-table-list",
                  "Drill-down Tickets",
                  "Open the ticket detail table from navigation or the dashboard card. The current generated baseline proves local table binding and static priority filtering."
                ),
                card(
                  "259n-help-card-settings",
                  "#fff7e6",
                  "fa-regular fa-sliders",
                  "Settings Areas",
                  "Configuration cards are staged as safe static links until each target list and action pattern is regenerated and import-tested."
                )
              ]),
              flexGrid("259n-help-grid-process", "Operating Notes", [
                card(
                  "259n-help-card-source",
                  "#fff1f2",
                  "fa-regular fa-database",
                  "Source Lists",
                  "Support Tickets and Support Teams are local generated lists. Native Title metadata must remain unchanged to avoid query failures."
                ),
                card(
                  "259n-help-card-validation",
                  "#f4f1ff",
                  "fa-regular fa-circle-check",
                  "Validation",
                  "Every generated package is validated, wrapped, round-trip checked, imported, and opened before it is treated as a learned baseline."
                ),
                card(
                  "259n-help-card-next",
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
const previousGeneratedResource = JSON.parse(fs.readFileSync(previousGeneratedResourcePath, "utf8"));
const { newIds, remapString } = makeIdMapper(sourceResource, previousGeneratedResource);
const resource = deepRemap(clone(sourceResource), remapString);
resource.ReplaceIds = newIds;

const data = deepRemap(clone(sourceAppDef), remapString);
data.Item.ListModel.Title = "Service Desk Pro Dashboard Stage N";
data.Item.ListModel.Description = "Service Desk Pro dashboard with active submitted-period helper copy and refined Settings/Help layouts.";
data.Item.ListModel.Created = generatedAt;
data.Item.ListModel.Modified = generatedAt;

for (const layout of data.Item.Layouts) {
  layout.Created = generatedAt;
  layout.Modified = generatedAt;
}

const executiveLayout = data.Item.Layouts.find((layout) => layout.Title === "Executive Dashboard");
const executivePage = JSON.parse(executiveLayout.LayoutInResources[0].Resource);
const periodConditionsAdded = ensureSubmittedPeriodConditions(executivePage);
const helperTextUpdated = updateExecutiveHelperText(executivePage);
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
  stage: "N",
  source: {
    previousGeneratedResource: sourceResourcePath,
    previousGeneratedAppDef: sourceAppDefPath,
    previousGeneratedStage: previousGeneratedResourcePath
  },
  outputs: { appDef: outputAppDefPath, resource: outputResourcePath },
  includedPatterns: [
    "Fresh ID remap from Stage M to Stage N",
    "Executive Dashboard helper copy updated to describe active submitted-period binding",
    "Submitted period conditions preserved across KPI summaries and priority chart",
    "Settings 3-column grids and 24px gaps preserved",
    "Help Guide static card grids preserved"
  ],
  intentionallyExcluded: [
    "query parameter to tempVars mapping",
    "original collection card layout",
    "Settings tile click-through actions",
    "SLA report resources"
  ],
  replaceIds: resource.ReplaceIds,
  periodConditionsAdded,
  settingsGridsUpdated,
  helperTextUpdated
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status: "pass",
  stage: "N",
  appDef: outputAppDefPath,
  resource: outputResourcePath,
  report: outputReportPath,
  replaceIds: resource.ReplaceIds.length,
  periodConditionsAdded,
  settingsGridsUpdated,
  helperTextUpdated
}, null, 2));
