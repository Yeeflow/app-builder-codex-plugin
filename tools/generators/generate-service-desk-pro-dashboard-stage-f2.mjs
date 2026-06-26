import fs from "node:fs";

const sourceResourcePath = "service-desk-pro-dashboard-stage-f1-resource.json";
const outputAppDefPath = "service-desk-pro-dashboard-stage-f2-app-def.json";
const outputResourcePath = "service-desk-pro-dashboard-stage-f2-resource.json";
const outputReportPath = "service-desk-pro-dashboard-stage-f2-generation-report.json";

const oldRootId = "2500010000000000000";
const oldDashboardId = "2500010000000000001";
const oldSupportTicketsListId = "2500020000000001000";
const oldSupportTicketsViewId = "2500020000000001801";
const oldTotalSubmittedSummaryId = "25000300-0000-4000-8000-000000000001";
const oldResolvedSummaryId = "25000300-0000-4000-8000-000000000002";
const oldOpenSummaryId = "25000300-0000-4000-8000-000000000003";
const oldCriticalOpenSummaryId = "25000300-0000-4000-8000-000000000004";
const rootId = "2510010000000000000";
const dashboardId = "2510010000000000001";
const supportTicketsListId = "2510020000000001000";
const supportTicketsViewId = "2510020000000001801";
const totalSubmittedSummaryId = "25100300-0000-4000-8000-000000000001";
const resolvedSummaryId = "25100300-0000-4000-8000-000000000002";
const openSummaryId = "25100300-0000-4000-8000-000000000003";
const criticalOpenSummaryId = "25100300-0000-4000-8000-000000000004";
const openTicketsByPriorityChartId = "25100300-0000-4000-8000-000000000005";
const generatedAt = "2026-05-13 02:15:00";
const tenantId = "2054071949946798081";
const userId = "2054071950001324033";
const appId = 41;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function remapString(value, replacements) {
  let out = value;
  for (const [from, to] of replacements) out = out.split(from).join(to);
  return out;
}

function deepRemap(value, replacements) {
  if (typeof value === "string") return remapString(value, replacements);
  if (Array.isArray(value)) return value.map((item) => deepRemap(item, replacements));
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[remapString(key, replacements)] = deepRemap(child, replacements);
    return out;
  }
  return value;
}

function fieldId(index) {
  return `251002000000000${String(1000 + index).padStart(4, "0")}`;
}

function rowId(index) {
  return `251002000000001${String(1000 + index).padStart(4, "0")}`;
}

function rules(value) {
  return JSON.stringify(value || {});
}

function field(index, fieldName, displayName, internalName, fieldType = "Text", type = "input", ruleValue = {}) {
  const isTitle = fieldName === "Title";
  return {
    FieldID: fieldId(index),
    ListID: supportTicketsListId,
    FieldName: fieldName,
    FieldType: fieldType,
    FieldIndex: index - 1,
    DisplayName: displayName,
    InternalName: internalName,
    DisplayName_EN: null,
    Type: type,
    Status: isTitle ? 0 : 1,
    Category: 0,
    DefaultValue: null,
    Rules: rules(ruleValue),
    TenantID: tenantId,
    AppID: appId,
    IsSort: false,
    IsIndex: isTitle,
    IsFilter: ["Title", "Text1", "Text2", "Text3", "Text4"].includes(fieldName),
    IsIndexCreated: false,
    IsSystem: isTitle,
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

function makeLayoutView(defs) {
  const visible = new Set(["Title", "Text1", "Text2", "Text3", "Text4", "Datetime1", "Decimal1", "Decimal2", "Bit1", "Bit2"]);
  return JSON.stringify({
    layout: defs.map((def, index) => ({
      FieldID: def.FieldID,
      FieldName: def.FieldName,
      Mobile: index === 0 ? 2 : 0,
      Order: index + 1,
      Show: visible.has(def.FieldName),
      Type: def.Type,
      DisplayName: def.DisplayName,
      Rules: JSON.parse(def.Rules || "{}")
    })),
    query: [
      {
        ID: defs[0].FieldID,
        Name: defs[0].DisplayName,
        Type: defs[0].Type,
        FieldName: defs[0].FieldName,
        Rules: JSON.parse(defs[0].Rules || "{}"),
        FieldID: defs[0].FieldID,
        InternalName: defs[0].InternalName
      },
      {
        ID: "-1",
        Name: "Id",
        Type: "input",
        FieldName: "ListDataID",
        Rules: { displayLabel: true, readonly: true },
        FieldID: "-1",
        InternalName: "ListDataID"
      },
      {
        ID: "-4",
        Name: "Created Time",
        Type: "datepicker",
        FieldName: "Created",
        Rules: { displayLabel: true, readonly: true, showtime: true, dateformat: "0" },
        FieldID: "-4",
        InternalName: "Created"
      }
    ],
    sort: [{ SortName: "Created", SortByDesc: true }],
    rowColor: [],
    filter: []
  });
}

function makeSupportTicketsList(templateList) {
  const defs = [
    field(1, "Title", "Ticket Title", "Title", "Text", "input", { required: true, placeholder: "Briefly summarize the issue" }),
    field(2, "Text1", "Ticket ID", "TicketID", "Text", "input", { placeholder: "T-1001" }),
    field(3, "Text2", "Priority", "Priority", "Text", "radio", { choices: ["Critical", "High", "Medium", "Low"], displayStyle: "dropdown" }),
    field(4, "Text3", "Status", "Status", "Text", "radio", { choices: ["New", "Assigned", "In Progress", "On Hold", "Resolved", "Closed"], displayStyle: "dropdown" }),
    field(5, "Text4", "Assigned Team", "AssignedTeam", "Text", "input", { placeholder: "Support team" }),
    field(6, "Datetime1", "Created Time", "CreatedTime", "Datetime", "datepicker", { showtime: true, dateformat: "0" }),
    field(7, "Decimal1", "First Response Hours", "FirstResponseHours", "Decimal", "input_number", { displayThousandths: "1", "rounded-to": "2" }),
    field(8, "Decimal2", "Resolution Hours", "ResolutionHours", "Decimal", "input_number", { displayThousandths: "1", "rounded-to": "2" }),
    field(9, "Bit1", "First Response SLA Compliance", "FirstResponseSLACompliance", "Bit", "switch", { default: false }),
    field(10, "Bit2", "Resolution SLA Compliance", "ResolutionSLACompliance", "Bit", "switch", { default: false })
  ];

  const list = clone(templateList);
  list.ListModel = {
    ...list.ListModel,
    ListID: supportTicketsListId,
    Title: "Support Tickets",
    Description: "Minimal local Support Tickets source list for the Service Desk Pro dashboard rebuild.",
    IconUrl: JSON.stringify({ b: "#2563eb", i: "fa-regular fa-ticket", c: "#ffffff" }),
    Created: generatedAt,
    Modified: generatedAt,
    CreatedBy: userId,
    ModifiedBy: userId,
    CustomType: `ListSite_${rootId}`,
    WorkspaceID: null,
    LayoutView: null
  };
  list.Defs = defs;
  list.Layouts = [
    {
      ...(templateList.Layouts[0] || {}),
      LayoutID: supportTicketsViewId,
      ListID: supportTicketsListId,
      Type: 0,
      Title: "All Tickets",
      LayoutView: makeLayoutView(defs),
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

  const rows = [
    ["VPN access fails for sales team", "T-1001", "High", "In Progress", "Infrastructure Support", "2026-05-01 09:15:00", "1.20", "8.50", "1", "0"],
    ["Laptop replacement request", "T-1002", "Medium", "Assigned", "Workplace Services", "2026-05-02 11:30:00", "2.00", "0.00", "1", "0"],
    ["Email delivery delay", "T-1003", "Critical", "Resolved", "Messaging Support", "2026-05-03 08:20:00", "0.50", "4.25", "1", "1"],
    ["New finance software access", "T-1004", "Low", "Closed", "Application Support", "2026-05-04 14:10:00", "3.25", "18.00", "1", "1"],
    ["Printer unavailable on level 8", "T-1005", "Medium", "On Hold", "Workplace Services", "2026-05-06 10:05:00", "4.00", "0.00", "0", "0"],
    ["CRM permission review", "T-1006", "High", "New", "Application Support", "2026-05-07 16:45:00", "0.00", "0.00", "0", "0"]
  ];
  list.ListDatas = {};
  rows.forEach((row, index) => {
    const id = rowId(index + 1);
    list.ListDatas[id] = {
      ListDataID: id,
      Title: row[0],
      Text1: row[1],
      Text2: row[2],
      Text3: row[3],
      Text4: row[4],
      Datetime1: row[5],
      Decimal1: row[6],
      Decimal2: row[7],
      Bit1: row[8],
      Bit2: row[9]
    };
  });
  return list;
}

const sourceResource = JSON.parse(fs.readFileSync(sourceResourcePath, "utf8"));
const resource = deepRemap(clone(sourceResource), new Map([
  [oldRootId, rootId],
  [oldDashboardId, dashboardId],
  [oldSupportTicketsListId, supportTicketsListId],
  [oldSupportTicketsViewId, supportTicketsViewId],
  [oldTotalSubmittedSummaryId, totalSubmittedSummaryId],
  [oldResolvedSummaryId, resolvedSummaryId],
  [oldOpenSummaryId, openSummaryId],
  [oldCriticalOpenSummaryId, criticalOpenSummaryId],
  ["250002000000000", "251002000000000"],
  ["250002000000001", "251002000000001"],
  ["250c-", "251c-"]
]));
const data = JSON.parse(resource.Data);
const templateData = JSON.parse(JSON.parse(fs.readFileSync("generated-dashboard-data-bound-v3-resource.json", "utf8")).Data);

data.Item.ListModel.Title = "Service Desk Pro Dashboard Stage F2";
data.Item.ListModel.Description = "Service Desk Pro Executive Dashboard rebuild with bound KPIs and one Open Tickets by Priority column chart.";
data.Item.ListModel.Created = generatedAt;
data.Item.ListModel.Modified = generatedAt;
data.Item.Layouts[0].Title = "Executive Dashboard";
data.Item.Layouts[0].Created = generatedAt;
data.Item.Layouts[0].Modified = generatedAt;

const page = JSON.parse(data.Item.Layouts[0].LayoutInResources[0].Resource);
function summaryControl(id) {
  return {
    id,
    type: "summary",
    label: "Summary",
    displayLabel: true,
    attrs: {
      layout: {
        desc: {
          value: "",
          variable: null,
          ty: {
            size: [null, 12],
            wei: "300"
          },
          c: "rgba(7, 22, 56, 0.55)"
        },
        number: {
          ty: {
            size: [null, 28],
            wei: "700"
          },
          c: "#111827"
        },
        pic: {},
        title: {}
      },
      common: {
        padding: [null, { top: 0, right: 0, bottom: 0, left: 0 }],
        border: {
          normal: {
            type: "0",
            width: [null, { top: 0, right: 0, bottom: 0, left: 0 }],
            color: "rgba(255, 255, 255, 0)",
            radius: [null, 0]
          },
          hover: {
            type: "0",
            width: [null, { top: 0, right: 0, bottom: 0, left: 0 }],
            color: "rgba(255, 255, 255, 0)",
            radius: [null, 0]
          }
        }
      }
    },
    children: []
  };
}

function bindCard(node, numberHeadingId, helperHeadingId, summaryId, helperText) {
  node.children = node.children.filter((child) => child.id !== numberHeadingId && child.id !== summaryId);
  const helperIndex = node.children.findIndex((child) => child.id === helperHeadingId);
  node.children.splice(helperIndex < 0 ? node.children.length : helperIndex, 0, summaryControl(summaryId));
  const helper = node.children.find((child) => child.id === helperHeadingId);
  if (helper?.attrs?.headc?.title) helper.attrs.headc.title.value = helperText;
}

function walk(node) {
  if (!node || typeof node !== "object") return;
  if (node.type === "text-editor" && typeof node.attrs?.value === "string") {
    node.attrs.value = "<p>Four KPI cards and one priority column chart are now bound to the local Support Tickets list. Filters and drill-down actions remain staged.</p>";
  }
  if (node.id === "d5eab245-ad78-482d-b8e5-90f058ba0d2c") {
    bindCard(node, "4f374f52-b3a8-4645-9af4-86d61c2c28b9", "8aa43171-b238-440f-9fcd-d05197f1cb82", totalSubmittedSummaryId, "Bound count of local Support Tickets");
  }
  if (node.id === "fa9ba701-ea5b-471b-ad41-18b3e4d9053d") {
    bindCard(node, "fe79d5a2-7308-4358-869d-eeb80bdfdd3b", "3a87d9e9-7ab0-4f9c-91e7-f6ff0de330bc", resolvedSummaryId, "Bound count where Status is Resolved or Closed");
  }
  if (node.id === "10c5adba-b2f2-4300-862a-3b776dc4b927") {
    bindCard(node, "b2c6b16c-5d6e-4a3b-b7b1-9900943ab5e4", "20ec15cd-30dc-4cfb-b744-d0c1e80a14bc", openSummaryId, "Bound count of active open statuses");
  }
  if (node.id === "b252eb93-d04b-4edb-8e19-9eb7ad37feae") {
    bindCard(node, "4712a1e5-4855-46c3-aba8-b42fdeefceab", "e90e9100-5c91-478f-8da4-ee7120a513a1", criticalOpenSummaryId, "Bound count of Critical active tickets");
  }
  if (node.id === "bfa4e5a6-4baa-4d8f-aa0a-8bcba8e8ed1b") {
    node.children = [
      {
        id: openTicketsByPriorityChartId,
        type: "bar-chart",
        label: "Column chart",
        displayLabel: true,
        attrs: {
          title: {
            display: true,
            title: {
              value: "Open Tickets by Priority",
              variable: null
            },
            "align-t": "center",
            pd: [null, { top: null, right: null, bottom: "--sp--s300", left: null }],
            ty: [null, "base-medium"],
            color: "var(--c--primary)"
          },
          common: {
            padding: [null, { top: "--sp--s250", right: "--sp--s250", bottom: "--sp--s250", left: "--sp--s250" }],
            border: {
              normal: {
                radius: [null, { top: "--sp--s250", right: "--sp--s250", bottom: "--sp--s250", left: "--sp--s250" }],
                type: "1",
                width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
                color: "var(--c--neutral-light-active)"
              },
              hover: {
                boxShadow: {
                  color: "rgba(0, 0, 0, 0.05)",
                  x: 0,
                  y: 1,
                  blur: 3,
                  spread: 0,
                  position: "outline"
                }
              }
            }
          }
        },
        children: []
      }
    ];
  }
  for (const child of node.children || []) walk(child);
}
walk(page);
function countExt(id, conditions = []) {
  return {
    category: "___Pivot___",
    key: "summary",
    i: id,
    attr: {
      AppID: appId,
      ListID: supportTicketsListId,
      ListSetID: rootId,
      settings: {
        values: [
          {
            type: "input",
            label: "Id",
            attr: {
              displayLabel: true,
              readonly: true
            },
            fieldName: "ListDataID",
            fieldType: "Bigint",
            func: "COUNT",
            id: "ListDataID"
          }
        ],
        preConditions: null,
        Conditions: conditions
      }
    }
  };
}

function eq(key, left, right, pre = "and") {
  return { key, pre, left, op: "0", right, showCus: true };
}

function anyStatus(key, statuses) {
  return {
    key,
    pre: "and",
    left: "Title",
    op: "0",
    right: null,
    conditions: statuses.map((status, index) => eq(`${key}-${index + 1}`, "Text3", status, "or"))
  };
}

const openStatuses = ["New", "Assigned", "In Progress", "On Hold"];
page.exts = [
  countExt(totalSubmittedSummaryId),
  countExt(resolvedSummaryId, [anyStatus("251c-resolved-statuses", ["Resolved", "Closed"])]),
  countExt(openSummaryId, [anyStatus("251c-open-statuses", openStatuses)]),
  countExt(criticalOpenSummaryId, [
    anyStatus("251c-critical-open-statuses", openStatuses),
    eq("251c-critical-priority", "Text2", "Critical")
  ]),
  {
    category: "___Pivot___",
    key: "bar-chart",
    i: openTicketsByPriorityChartId,
    attr: {
      chartType: "2",
      settings: {
        rows: [
          {
            type: "radio",
            label: "Priority",
            attr: {},
            fieldName: "Text2",
            fieldType: "Text",
            func: "",
            id: "Text2"
          }
        ],
        values: [
          {
            type: "input",
            label: "Id",
            attr: {
              displayLabel: true,
              readonly: true
            },
            fieldName: "ListDataID",
            fieldType: "Bigint",
            func: "COUNT",
            id: "ListDataID_COUNT"
          }
        ],
        Conditions: [anyStatus("251c-chart-open-statuses", openStatuses)]
      },
      AppID: appId,
      ListID: supportTicketsListId,
      ListSetID: rootId
    }
  }
];
data.Item.Layouts[0].LayoutInResources[0].Resource = JSON.stringify(page);

const nav = JSON.parse(data.Item.ListModel.LayoutView);
nav.sort = [
  ...nav.sort,
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

const supportTickets = makeSupportTicketsList(templateData.Childs[0]);
data.Childs = [supportTickets];
data.Forms = [];
data.DataReports = [];
data.FormReports = [];
resource.Data = JSON.stringify(data);

const fieldIds = supportTickets.Defs.map((def) => def.FieldID);
const sampleRowIds = Object.keys(supportTickets.ListDatas);
resource.ReplaceIds = [dashboardId, rootId, supportTicketsViewId, supportTicketsListId, ...fieldIds, ...sampleRowIds];
resource.ReportIds = [totalSubmittedSummaryId, resolvedSummaryId, openSummaryId, criticalOpenSummaryId, openTicketsByPriorityChartId];
resource.FormKeys = [];

fs.writeFileSync(outputAppDefPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
fs.writeFileSync(outputResourcePath, `${JSON.stringify(resource, null, 2)}\n`, "utf8");
fs.writeFileSync(outputReportPath, `${JSON.stringify({
  status: "pass",
  stage: "F2",
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
    executiveDashboardLayoutId: dashboardId,
    supportTicketsListId,
    supportTicketsViewId,
    totalSubmittedSummaryId,
    resolvedSummaryId,
    openSummaryId,
    criticalOpenSummaryId,
    openTicketsByPriorityChartId
  },
  includedPatterns: [
    "Stage F1 Executive Dashboard with four bound KPIs",
    "one local Support Tickets data list",
    "minimal Service Desk ticket fields",
    "six sample ticket rows",
    "root navigation entry for Support Tickets",
    "four dashboard summary controls bound to COUNT(ListDataID)",
    "simple status and priority conditions",
    "one bar-chart control grouped by Priority"
  ],
  intentionallyExcluded: [
    "additional chart/table data binding",
    "filterVars and tempVars",
    "Settings page",
    "Drill-down Tickets List action",
    "approval forms, workflows, AI modules, document libraries, and reports"
  ],
  replaceIds: resource.ReplaceIds
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status: "pass",
  stage: "F2",
  appDef: outputAppDefPath,
  resource: outputResourcePath,
  report: outputReportPath,
  replaceIds: resource.ReplaceIds.length,
  childResources: data.Childs.length,
  supportTicketsFields: supportTickets.Defs.length,
  supportTicketsRows: sampleRowIds.length,
  reportIds: resource.ReportIds.length
}, null, 2));
