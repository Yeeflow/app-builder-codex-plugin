import fs from "node:fs";

const sourceResourcePath = "service-desk-pro-dashboard-stage-h-resource.json";
const outputAppDefPath = "service-desk-pro-dashboard-stage-i-app-def.json";
const outputResourcePath = "service-desk-pro-dashboard-stage-i-resource.json";
const outputReportPath = "service-desk-pro-dashboard-stage-i-generation-report.json";

const oldFamily = "253";
const family = "254";
const rootId = "2540010000000000000";
const supportTicketsListId = "2540020000000001000";
const supportTicketsViewId = "2540020000000001801";
const supportTeamsListId = "2540020000000002000";
const supportTeamsViewId = "2540020000000002801";
const generatedAt = "2026-05-13 09:05:00";
const appId = 41;
const tenantId = "2054071949946798081";
const userId = "2054071950001324033";

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
    .split(`${oldFamily}h-`).join(`${family}h-`);
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

function titleField(listId, fieldId) {
  return {
    FieldID: fieldId,
    ListID: listId,
    FieldName: "Title",
    FieldType: "Text",
    FieldIndex: 0,
    DisplayName: "Team Name",
    InternalName: "Title",
    DisplayName_EN: null,
    Type: "input",
    Status: 0,
    Category: 0,
    DefaultValue: null,
    Rules: JSON.stringify({ required: true }),
    TenantID: tenantId,
    AppID: appId,
    IsSort: false,
    IsIndex: true,
    IsFilter: true,
    IsIndexCreated: false,
    IsSystem: true,
    IsUnique: false,
    Created: generatedAt,
    Modified: generatedAt,
    CreatedBy: userId,
    ModifiedBy: userId,
    Ext1: null,
    Ext2: null,
    Ext3: null
  };
}

function makeSupportTeamsList(templateList) {
  const fieldId = "2540020000000002001";
  const list = clone(templateList);
  const def = titleField(supportTeamsListId, fieldId);
  list.ListModel = {
    ...list.ListModel,
    ListID: supportTeamsListId,
    Title: "Support Teams",
    Description: "Local support teams for Service Desk dashboard team filter testing.",
    IconUrl: JSON.stringify({ b: "#0f766e", i: "fa-regular fa-users-gear", c: "#ffffff" }),
    Created: generatedAt,
    Modified: generatedAt,
    CreatedBy: userId,
    ModifiedBy: userId,
    CustomType: `ListSite_${rootId}`,
    WorkspaceID: null,
    LayoutView: null
  };
  list.Defs = [def];
  list.Layouts = [
    {
      ...(templateList.Layouts[0] || {}),
      LayoutID: supportTeamsViewId,
      ListID: supportTeamsListId,
      Type: 0,
      Title: "All Teams",
      LayoutView: JSON.stringify({
        layout: [
          {
            FieldID: fieldId,
            FieldName: "Title",
            Mobile: 2,
            Order: 1,
            Show: true,
            Type: "input",
            DisplayName: "Team Name",
            Rules: JSON.parse(def.Rules)
          }
        ],
        query: [
          {
            ID: fieldId,
            Name: "Team Name",
            Type: "input",
            FieldName: "Title",
            Rules: JSON.parse(def.Rules),
            FieldID: fieldId,
            InternalName: "Title"
          },
          {
            ID: "-1",
            Name: "Id",
            Type: "input",
            FieldName: "ListDataID",
            Rules: { displayLabel: true, readonly: true },
            FieldID: "-1",
            InternalName: "ListDataID"
          }
        ],
        sort: [{ SortName: "Title", SortByDesc: false }],
        rowColor: [],
        filter: []
      }),
      AppID: appId,
      TenantID: tenantId,
      Created: generatedAt,
      Modified: generatedAt,
      CreatedBy: userId,
      ModifiedBy: userId,
      Ext1: JSON.stringify({ Url: "default" }),
      Ext2: null,
      Ext3: null,
      IsDefault: true,
      IsItemPerm: false,
      LayoutInResources: null
    }
  ];
  list.ListDatas = {};
  ["Infrastructure Support", "Workplace Services", "Messaging Support", "Application Support"].forEach((team, index) => {
    const id = `254002000000002${String(1000 + index + 1).padStart(4, "0")}`;
    list.ListDatas[id] = { ListDataID: id, Title: team };
  });
  return list;
}

function filterVariable(name) {
  return [
    {
      exprType: "variable",
      valueType: "string",
      id: `__filter_${name}`,
      type: "expr",
      name
    }
  ];
}

function teamCondition(key) {
  return {
    key,
    pre: "and",
    left: "Text4",
    op: "0",
    right: filterVariable("filter_Team"),
    showCus: false
  };
}

function addTeamCondition(exts) {
  for (const ext of exts) {
    if (!ext?.attr?.settings || ext.attr.ListID !== supportTicketsListId) continue;
    const conditions = ext.attr.settings.Conditions || [];
    if (!conditions.some((condition) => condition.key === `254i-team-${ext.i}`)) {
      conditions.push(teamCondition(`254i-team-${ext.i}`));
    }
    ext.attr.settings.Conditions = conditions;
  }
}

function filterControls() {
  return {
    id: "254i-filter-row",
    type: "container",
    label: "Container",
    displayLabel: true,
    attrs: {
      style: {
        direction: [null, "row", null, "column"],
        gap: [null, 16],
        align_items: [null, "center", null, "stretch"]
      },
      common: {
        padding: [null, { top: "--sp--s250", right: 0, bottom: 0, left: 0 }]
      }
    },
    children: [
      {
        id: "254i-team-filter",
        type: "select-filter",
        label: "Select Team",
        displayLabel: true,
        attrs: {
          data: {
            list: {
              AppID: appId,
              ListID: supportTeamsListId,
              Type: 1,
              Title: "Support Teams",
              ListSetID: rootId
            }
          },
          display_f: "Title",
          value_f: "Title",
          ps: 50,
          placeholder: "Search a team",
          edit: {
            ty: { size: [null, 16] },
            normal: {
              border: {
                type: "1",
                width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
                color: "var(--cus-c--TextGrey)"
              }
            },
            pcolor: "var(--cus-c--TextGrey)"
          }
        },
        binding: "__filter_filter_Team",
        children: []
      },
      {
        id: "254i-period-filter",
        type: "relative-period",
        label: "Submitted period",
        displayLabel: true,
        attrs: {
          ver: 1,
          "choice-options": ["w_t_1", "w_l_1", "m_t_1", "m_l_1", "q_t_1", "q_l_1", "y_t_1", "d_t_1"],
          "menu-options": {
            m: ["m_l_1"],
            q: ["q_l_1"],
            w: ["w_l_1"]
          },
          show_control: false,
          multiple: false
        },
        binding: "__filter_f_SubmittedPeriod",
        children: []
      }
    ]
  };
}

const sourceResource = JSON.parse(fs.readFileSync(sourceResourcePath, "utf8"));
const resource = deepRemap(clone(sourceResource));
const data = JSON.parse(resource.Data);

data.Item.ListModel.Title = "Service Desk Pro Dashboard Stage I";
data.Item.ListModel.Description = "Service Desk Pro dashboard with local Support Teams list and Executive Dashboard filter controls.";
data.Item.ListModel.Created = generatedAt;
data.Item.ListModel.Modified = generatedAt;

for (const layout of data.Item.Layouts) {
  layout.Created = generatedAt;
  layout.Modified = generatedAt;
}

const executiveLayout = data.Item.Layouts.find((layout) => layout.Title === "Executive Dashboard");
const page = JSON.parse(executiveLayout.LayoutInResources[0].Resource);
page.filterVars = [
  { id: "f_SubmittedPeriod", idx: "254i-filter-period-var" },
  { id: "filter_Team", idx: "254i-filter-team-var" }
];
page.children[0].children[1].children[1].attrs.value = "<p>Use the local Support Teams filter to narrow the KPI and priority chart bindings. Submitted period is rendered as a staged control; date filtering will be bound after period semantics are verified.</p>";
page.children[0].children[1].children.splice(2, 0, filterControls());
addTeamCondition(page.exts || []);
executiveLayout.LayoutInResources[0].Resource = JSON.stringify(page);

const supportTeams = makeSupportTeamsList(data.Childs[0]);
data.Childs.push(supportTeams);

const nav = JSON.parse(data.Item.ListModel.LayoutView);
nav.sort.push({
  AppID: appId,
  ListID: supportTeamsListId,
  ListSetID: rootId,
  Type: 1,
  Title: "Support Teams",
  Icon: "fa-regular fa-users-gear",
  DisplayName: "Support Teams"
});
data.Item.ListModel.LayoutView = JSON.stringify(nav);

resource.Data = JSON.stringify(data);

const supportTickets = data.Childs.find((child) => child.ListModel.ListID === supportTicketsListId);
const supportTicketFieldIds = supportTickets.Defs.map((def) => def.FieldID);
const supportTicketRowIds = Object.keys(supportTickets.ListDatas);
const supportTeamFieldIds = supportTeams.Defs.map((def) => def.FieldID);
const supportTeamRowIds = Object.keys(supportTeams.ListDatas);
const layoutIds = data.Item.Layouts.map((layout) => layout.LayoutID);
resource.ReplaceIds = [
  ...layoutIds,
  rootId,
  supportTicketsViewId,
  supportTicketsListId,
  ...supportTicketFieldIds,
  ...supportTicketRowIds,
  supportTeamsViewId,
  supportTeamsListId,
  ...supportTeamFieldIds,
  ...supportTeamRowIds
];

fs.writeFileSync(outputAppDefPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.writeFileSync(outputResourcePath, `${JSON.stringify(resource, null, 2)}\n`, "utf8");
fs.writeFileSync(outputReportPath, `${JSON.stringify({
  status: "pass",
  stage: "I",
  source: { previousStage: sourceResourcePath },
  outputs: { appDef: outputAppDefPath, resource: outputResourcePath },
  includedPatterns: [
    "local Support Teams child data list",
    "Executive Dashboard select-filter bound to filter_Team",
    "Executive Dashboard relative-period control bound to f_SubmittedPeriod",
    "team variable condition added to Support Tickets summary and chart exts"
  ],
  intentionallyExcluded: [
    "submitted period date condition binding",
    "dynamic drill-down collection",
    "opendashboard actions",
    "Settings click-through actions",
    "SLA report resources"
  ],
  replaceIds: resource.ReplaceIds
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status: "pass",
  stage: "I",
  appDef: outputAppDefPath,
  resource: outputResourcePath,
  report: outputReportPath,
  replaceIds: resource.ReplaceIds.length,
  childLists: data.Childs.map((child) => child.ListModel.Title),
  reportIds: resource.ReportIds.length
}, null, 2));
