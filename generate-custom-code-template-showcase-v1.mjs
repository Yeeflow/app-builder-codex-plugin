import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

const ZIP_PATH = "/Users/Renger/Documents/Codex Projects/Yeeflow Custom Code_26/Custom Code templates.zip";
const BASE_RESOURCE = "custom-code-smart-lookup-picker-test.resource.json";
const BASE_APP = "custom-code-smart-lookup-picker-test.app-def.json";
const OUT_RESOURCE = "custom-code-template-showcase.v1.resource.json";
const OUT_APP = "custom-code-template-showcase.v1.app-def.json";
const OUT_APPROVAL = "custom-code-template-showcase.v1.approval-form-def.json";
const OUT_DASHBOARD = "custom-code-template-showcase.v1.dashboard-def.json";
const OUT_REPORT = "custom-code-template-showcase.v1.runtime-test-report.json";
const OUT_BASELINE = "docs/custom-code-template-showcase-local-validation-baseline.md";
const OUT_YAP = "custom-code-template-showcase.v1.yap";
const TITLE = "Enterprise Service Request & Compliance Review";
const DESCRIPTION = "Generated showcase app for all 13 reusable Yeeflow Custom Code templates. Runtime proof remains pending until imported and tested.";
const FLOW_KEY = "CCTSHOW";
const ID_BASE = 6182000000000000000n;
const LOCAL_ID_PREFIX = "6182";

const TEMPLATE_NAMES = [
  "activity-timeline",
  "approval-decision-panel",
  "approval-timeline",
  "checklist-compliance-block",
  "dependent-selector",
  "distribution-chart-module",
  "exception-alert-panel",
  "hierarchical-selector",
  "kpi-card-set",
  "multi-entry-tag-input",
  "related-record-summary-grid",
  "smart-lookup-picker",
  "trend-chart-module",
];

const LISTS = [
  { key: "serviceRequests", title: "Service Requests", icon: "fa-regular fa-rectangle-list" },
  { key: "requestCategories", title: "Request Categories", icon: "fa-regular fa-folder-tree" },
  { key: "subcategories", title: "Subcategories", icon: "fa-regular fa-diagram-subtask" },
  { key: "relatedRecords", title: "Assets / Vendors / Related Records", icon: "fa-regular fa-building" },
  { key: "checklistItems", title: "Compliance Checklist Items", icon: "fa-regular fa-square-check" },
  { key: "requestTags", title: "Request Tags", icon: "fa-regular fa-tags" },
  { key: "timelineEvents", title: "Approval History / Timeline Events", icon: "fa-regular fa-timeline" },
  { key: "exceptionAlerts", title: "Exception Rules / Alerts", icon: "fa-regular fa-triangle-exclamation" },
  { key: "requestMetrics", title: "Request Metrics / Summary Records", icon: "fa-regular fa-chart-simple" },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseJson(value) {
  return typeof value === "string" ? JSON.parse(value) : value;
}

function setJson(target, key, value) {
  target[key] = JSON.stringify(value);
}

function nextId(offset) {
  return String(ID_BASE + BigInt(offset));
}

function localIdPrefixFrom(resource) {
  const firstId = resource.ReplaceIds.find((id) => /^\d{16,}$/.test(String(id)));
  return firstId ? String(firstId).slice(0, 4) : "";
}

function isLocalId(value, prefix = LOCAL_ID_PREFIX) {
  return typeof value === "string" && /^\d{16,}$/.test(value) && value.startsWith(prefix);
}

function textExpr(value) {
  return { type: 2, value: [{ type: "str", value: String(value) }] };
}

function boolExpr(value) {
  return { type: 2, value: [{ type: "bool", value: value === true }] };
}

function target(prefix, value) {
  return { type: 1, value: { prefix, value } };
}

function readTemplates() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cct-showcase-"));
  execFileSync("unzip", ["-q", ZIP_PATH, "-d", tmp]);
  const root = path.join(tmp, "templates");
  const scripts = {};
  for (const name of TEMPLATE_NAMES) {
    scripts[name] = patchTemplateRuntimeCompat(fs.readFileSync(path.join(root, name, `${name}.tsx`), "utf8"));
  }
  return scripts;
}

function patchTemplateRuntimeCompat(script) {
  const oldCandidates = `const candidates=[
      response.items,response.Items,response.data,response.Data,response.rows,response.Rows,response.records,response.Records,response.list,response.List,response.result,response.Result,response.value,response.Value];`;
  const newCandidates = `const candidates=[
      response.items,response.Items,response.rows,response.Rows,response.records,response.Records,response.listData,response.ListData,response.data,response.Data,response.list,response.List,response.result,response.Result,response.value,response.Value];`;
  script = script.split(oldCandidates).join(newCandidates);
  script = script.split("const candidates=[response.items,response.Items,response.data,response.Data,response.rows,response.Rows,response.records,response.Records,response.list,response.List,response.result,response.Result,response.value,response.Value];")
    .join("const candidates=[response.items,response.Items,response.rows,response.Rows,response.records,response.Records,response.listData,response.ListData,response.data,response.Data,response.list,response.List,response.result,response.Result,response.value,response.Value];");

  const oldPrettyCandidates = `const candidates = [
      response.items,
      response.Items,
      response.data,
      response.Data,
      response.rows,
      response.Rows,
      response.records,
      response.Records,
      response.list,
      response.List,
      response.result,
      response.Result,
      response.value,
      response.Value,
    ];`;
  const newPrettyCandidates = `const candidates = [
      response.items,
      response.Items,
      response.rows,
      response.Rows,
      response.records,
      response.Records,
      response.listData,
      response.ListData,
      response.data,
      response.Data,
      response.list,
      response.List,
      response.result,
      response.Result,
      response.value,
      response.Value,
    ];`;
  script = script.split(oldPrettyCandidates).join(newPrettyCandidates);

  const compactAttempts = "const attempts=[()=>client.lists.queryItems(payload),()=>client.lists.queryItems(listId,payload2),()=>client.lists.queryItems(listId,payload),()=>client.lists.queryItems(listId,payload2,{})];";
  const compactAttemptsWithFallback = "const broadPayload={listId:listId,dataListId:listId,pageIndex:1,pageNo:1,pageSize:pageSize}; const broadPayload2={pageIndex:1,pageNo:1,pageSize:pageSize}; const attempts=[()=>client.lists.queryItems(payload),()=>client.lists.queryItems(listId,payload2),()=>client.lists.queryItems(listId,payload),()=>client.lists.queryItems(listId,payload2,{}),()=>client.lists.queryItems(broadPayload),()=>client.lists.queryItems(listId,broadPayload2)];";
  script = script.split(compactAttempts).join(compactAttemptsWithFallback);

  const prettyAttempts = `const attempts = [
      () => client.lists.queryItems(basePayload),
      () => client.lists.queryItems(config.dataListId, payloadWithoutListId),
      () => client.lists.queryItems(config.dataListId, basePayload),
      () => client.lists.queryItems(config.dataListId, payloadWithoutListId, {}),
      () => client.lists.queryItems(config.dataListId, basePayload, {}),
    ];`;
  const prettyAttemptsWithFallback = `const broadPayload: any = {
      listId: config.dataListId,
      dataListId: config.dataListId,
      pageIndex: 1,
      pageNo: 1,
      pageSize: config.pageSize,
    };
    const broadPayloadWithoutListId: any = {
      pageIndex: 1,
      pageNo: 1,
      pageSize: config.pageSize,
    };
    const attempts = [
      () => client.lists.queryItems(basePayload),
      () => client.lists.queryItems(config.dataListId, payloadWithoutListId),
      () => client.lists.queryItems(config.dataListId, basePayload),
      () => client.lists.queryItems(config.dataListId, payloadWithoutListId, {}),
      () => client.lists.queryItems(config.dataListId, basePayload, {}),
      () => client.lists.queryItems(broadPayload),
      () => client.lists.queryItems(config.dataListId, broadPayloadWithoutListId),
    ];`;
  script = script.split(prettyAttempts).join(prettyAttemptsWithFallback);
  return script;
}

function findFirst(root, predicate) {
  if (!root || typeof root !== "object") return null;
  if (predicate(root)) return root;
  for (const child of Object.values(root)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findFirst(item, predicate);
        if (found) return found;
      }
    } else if (isObject(child)) {
      const found = findFirst(child, predicate);
      if (found) return found;
    }
  }
  return null;
}

function remapIds(value, idMap) {
  if (typeof value === "string") {
    let next = value;
    for (const [from, to] of idMap.entries()) next = next.split(from).join(to);
    return next;
  }
  if (Array.isArray(value)) return value.map((item) => remapIds(item, idMap));
  if (!isObject(value)) return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) out[remapIds(key, idMap)] = remapIds(child, idMap);
  return out;
}

function field(list, fieldName) {
  return list.Defs.find((item) => item.FieldName === fieldName);
}

function renameFields(list, mapping) {
  for (const [fieldName, [displayName, internalName, type]] of Object.entries(mapping)) {
    const def = field(list, fieldName);
    if (!def) continue;
    def.DisplayName = displayName;
    def.Title = displayName;
    def.InternalName = internalName;
    if (type) {
      def.Type = type;
      def.ControlType = type;
      def.controlType = type;
    }
  }
}

function makeList(baseList, meta, index) {
  let list = clone(baseList);
  const originalListId = String(list.ListModel.ListID);
  const listId = nextId(100 + index * 100);
  const viewId = nextId(101 + index * 100);
  const editId = nextId(102 + index * 100);
  const viewFormId = nextId(103 + index * 100);
  const idMap = new Map([[originalListId, listId]]);
  for (const [fieldIndex, def] of list.Defs.entries()) {
    idMap.set(String(def.FieldID), nextId(10000 + index * 1000 + fieldIndex + 1));
  }
  list = remapIds(list, idMap);
  list.ListModel.ListID = listId;
  list.ListModel.Title = meta.title;
  list.ListModel.Description = `${meta.title} for the Custom Code Template Showcase app.`;
  list.ListModel.IconUrl = JSON.stringify({ b: "#E6F0FF", i: meta.icon, c: "#0065FF" });
  list.ListModel.CustomType = `ListSite_${nextId(0)}`;
  list.ListModel.LayoutView = JSON.stringify({
    add: editId,
    edit: editId,
    view: viewFormId,
    opentype: { add: "modal" },
    modalsize: {},
    sort: [{ SortName: "Created", SortByDesc: true }],
  });
  list.Layouts[0].LayoutID = viewId;
  list.Layouts[0].ListID = listId;
  list.Layouts[0].Title = `All ${meta.title}`;
  list.Layouts[1].LayoutID = editId;
  list.Layouts[1].ListID = listId;
  list.Layouts[1].Title = "Edit Item";
  list.Layouts[2].LayoutID = viewFormId;
  list.Layouts[2].ListID = listId;
  list.Layouts[2].Title = "View Item";
  for (const def of list.Defs) {
    def.ListID = listId;
  }
  for (const layout of list.Layouts) {
    if (layout.LayoutInResources?.[0]) {
      layout.LayoutInResources[0].ID = layout.LayoutID;
      layout.LayoutInResources[0].RefId = layout.LayoutID;
      const page = parseJson(layout.LayoutInResources[0].Resource);
      page.title = layout.Title;
      removeCodeinControls(page);
      setJson(layout.LayoutInResources[0], "Resource", page);
    }
  }
  list.ListDatas = {};
  return { list, ids: { listId, viewId, editId, viewFormId } };
}

function removeCodeinControls(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.children)) {
    node.children = node.children.filter((child) => child?.type !== "codein");
    node.children.forEach(removeCodeinControls);
  }
  for (const child of Object.values(node)) {
    if (!child || typeof child !== "object" || child === node.children) continue;
    if (Array.isArray(child)) child.forEach(removeCodeinControls);
    else removeCodeinControls(child);
  }
}

function seedLists(lists) {
  const samples = {
    serviceRequests: [
      ["Workstation Refresh for Finance", "Hardware", "Finance / End User Devices", "Open", "High", "2026-05-01 09:00:00"],
      ["Vendor Security Review", "Compliance", "Risk / Vendor Review", "Manager Review", "Critical", "2026-05-04 10:30:00"],
      ["CRM Access Change", "Application", "Sales Systems", "Completed", "Medium", "2026-05-08 14:15:00"],
      ["Overdue Laptop Repair", "Hardware", "IT Operations", "Overdue", "High", "2026-05-12 08:45:00"],
    ],
    requestCategories: [
      ["IT Services", "", "IT Services", "Active", "blue", "2026-05-01 00:00:00"],
      ["Hardware", "IT Services", "Hardware", "Active", "green", "2026-05-01 00:00:00"],
      ["Compliance", "IT Services", "Compliance", "Active", "amber", "2026-05-01 00:00:00"],
      ["Application Access", "IT Services", "Application", "Active", "violet", "2026-05-01 00:00:00"],
    ],
    subcategories: [
      ["Hardware", "Laptop", "End User Devices", "Active", "standard", "2026-05-01 00:00:00"],
      ["Hardware", "Peripheral", "End User Devices", "Active", "standard", "2026-05-01 00:00:00"],
      ["Compliance", "Vendor Review", "Risk", "Active", "standard", "2026-05-01 00:00:00"],
      ["Application", "CRM Access", "Sales Systems", "Active", "standard", "2026-05-01 00:00:00"],
    ],
    relatedRecords: [
      ["Acme Managed Services", "Vendor", "SR-1001", "Active", "Preferred vendor", "2026-05-02 00:00:00"],
      ["Finance Laptop Pool", "Asset", "SR-1001", "Available", "Shared asset group", "2026-05-03 00:00:00"],
      ["Security Review Package", "Document", "SR-1002", "Pending", "Compliance evidence", "2026-05-04 00:00:00"],
    ],
    checklistItems: [
      ["Business owner confirmed", "Submission", "Required", "Active", "Confirm owner and budget", "2026-05-01 00:00:00"],
      ["Data/privacy impact reviewed", "Compliance", "Required", "Active", "Check data sensitivity", "2026-05-01 00:00:00"],
      ["Rollback plan documented", "Implementation", "Optional", "Active", "Operational fallback", "2026-05-01 00:00:00"],
    ],
    requestTags: [
      ["urgent", "Priority", "High", "Active", "Urgent request tag", "2026-05-01 00:00:00"],
      ["vendor", "Category", "Compliance", "Active", "Vendor-related request", "2026-05-01 00:00:00"],
      ["hardware", "Category", "IT", "Active", "Hardware request tag", "2026-05-01 00:00:00"],
    ],
    timelineEvents: [
      ["SR-1001", "Request submitted", "Renger H", "Submitted", "Requester submitted the request", "2026-05-01 09:00:00"],
      ["SR-1001", "Manager review started", "Manager", "Manager Review", "Manager review task opened", "2026-05-01 12:00:00"],
      ["SR-1002", "Compliance exception raised", "Compliance", "Exception", "Missing vendor evidence", "2026-05-04 16:00:00"],
      ["SR-1003", "Request completed", "IT Ops", "Completed", "Access change completed", "2026-05-09 11:30:00"],
    ],
    exceptionAlerts: [
      ["Overdue Laptop Repair", "High", "Overdue", "SR-1004", "SLA breach by two days", "2026-05-12 08:45:00"],
      ["Vendor Security Review", "Critical", "Missing Compliance", "SR-1002", "Data processing evidence missing", "2026-05-04 16:00:00"],
      ["CRM Access Change", "Medium", "Watch", "SR-1003", "Pending post-completion audit", "2026-05-09 11:30:00"],
    ],
    requestMetrics: [
      ["Open Requests", "42", "Pending review", "up", "+12%", "2026-05-01 00:00:00"],
      ["Approval Rate", "91.4", "This month", "up", "+4.2%", "2026-05-01 00:00:00"],
      ["Overdue Items", "7", "Need attention", "down", "-3", "2026-05-01 00:00:00"],
      ["Cycle Time", "3.8", "Average business days", "neutral", "Stable", "2026-05-01 00:00:00"],
    ],
  };
  for (const [key, rows] of Object.entries(samples)) {
    const list = lists[key].list;
    rows.forEach((row, index) => {
      const id = String(BigInt(list.ListModel.ListID) + BigInt(index + 1));
      list.ListDatas[id] = {
        ListDataID: id,
        Title: row[0],
        Text1: row[1],
        Text2: row[2],
        Text3: row[3],
        Text4: row[4],
        Text5: "System",
        Text6: "",
        Text7: "",
        Bit1: "1",
        Decimal1: index + 1,
        Decimal2: 100 + index * 25,
        Decimal3: 100 + index * 25,
        Decimal4: index / 10,
        Datetime1: row[5],
        Datetime2: row[5],
        Datetime3: row[5],
      };
    });
  }
}

function configureListFields(lists) {
  renameFields(lists.serviceRequests.list, {
    Title: ["Request Title", "RequestTitle", "input"],
    Text1: ["Category", "Category", "input"],
    Text2: ["Service Area", "ServiceArea", "input"],
    Text3: ["Status", "Status", "input"],
    Text4: ["Priority", "Priority", "input"],
    Text6: ["Picker Selected Values", "PickerSelectedValues", "textarea"],
    Text7: ["Picker Manual Values", "PickerManualValues", "textarea"],
    Datetime1: ["Submitted Date", "SubmittedDate", "datepicker"],
  });
  renameFields(lists.requestCategories.list, {
    Title: ["Category Name", "CategoryName", "input"],
    Text1: ["Parent ID", "ParentId", "input"],
    Text2: ["Category Value", "CategoryValue", "input"],
    Text3: ["Status", "Status", "input"],
  });
  renameFields(lists.subcategories.list, {
    Title: ["Parent Category", "ParentCategory", "input"],
    Text1: ["Subcategory", "Subcategory", "input"],
    Text2: ["Service Area", "ServiceArea", "input"],
    Text3: ["Status", "Status", "input"],
  });
  renameFields(lists.relatedRecords.list, {
    Title: ["Related Record", "RelatedRecord", "input"],
    Text1: ["Record Type", "RecordType", "input"],
    Text2: ["Request ID", "RequestId", "input"],
    Text3: ["Status", "Status", "input"],
    Text4: ["Description", "Description", "textarea"],
  });
  renameFields(lists.checklistItems.list, {
    Title: ["Checklist Item", "ChecklistItem", "input"],
    Text1: ["Checklist Group", "ChecklistGroup", "input"],
    Text2: ["Requirement", "Requirement", "input"],
    Text3: ["Status", "Status", "input"],
  });
  renameFields(lists.requestTags.list, {
    Title: ["Tag", "Tag", "input"],
    Text1: ["Tag Type", "TagType", "input"],
    Text2: ["Default Category", "DefaultCategory", "input"],
    Text3: ["Status", "Status", "input"],
  });
  renameFields(lists.timelineEvents.list, {
    Title: ["Record ID", "RecordId", "input"],
    Text1: ["Event Title", "EventTitle", "input"],
    Text2: ["Actor", "Actor", "input"],
    Text3: ["Event Type", "EventType", "input"],
    Text4: ["Description", "Description", "textarea"],
    Datetime1: ["Event Date", "EventDate", "datepicker"],
  });
  renameFields(lists.exceptionAlerts.list, {
    Title: ["Alert Title", "AlertTitle", "input"],
    Text1: ["Severity", "Severity", "input"],
    Text2: ["Alert Type", "AlertType", "input"],
    Text3: ["Request ID", "RequestId", "input"],
    Text4: ["Description", "Description", "textarea"],
  });
  renameFields(lists.requestMetrics.list, {
    Title: ["Metric Name", "MetricName", "input"],
    Text1: ["Metric Value", "MetricValue", "input"],
    Text2: ["Metric Subtitle", "MetricSubtitle", "input"],
    Text3: ["Trend Direction", "TrendDirection", "input"],
    Text4: ["Trend Text", "TrendText", "input"],
  });
}

function control(script, params, title) {
  return {
    id: cryptoId(title),
    type: "codein",
    label: title,
    attrs: { title, "codein-script": script, "codein-script-param": params },
    children: [],
    nv_label: title,
  };
}

function cryptoId(seed) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  return `cct-${hash.toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

function heading(value, label) {
  return {
    id: cryptoId(label),
    type: "heading",
    label: "Text",
    attrs: {
      headc: { title: { value, variable: null } },
      heads: { ty: [null, "h5-medium"], color: "var(--c--text)" },
      common: { positioning: { widthtype: [null, "2"] } },
    },
    children: [],
    nv_label: label,
  };
}

function input(binding, label, readonly = false) {
  return {
    id: cryptoId(label),
    binding,
    type: "textarea",
    label,
    attrs: { edit: { fhlay: "auto", textarea_minrows: 2 }, placeholder: label },
    displayLabel: true,
    readonly,
    children: [],
    nv_label: label,
  };
}

function dashboardControls(scripts, ids) {
  return [
    heading("Operational Dashboard", "Dashboard header"),
    nativeDataListControl(ids.serviceRequests.listId),
    control(scripts["kpi-card-set"], {
      cardsConfig: textExpr(JSON.stringify([
        { title: "Open Requests", value: 42, subtitle: "Pending review", trend: "+12%", trendDirection: "up", tone: "blue", format: "number", icon: "REQ" },
        { title: "Approval Rate", value: 91.4, subtitle: "This month", trend: "+4.2%", trendDirection: "up", tone: "green", format: "percent", decimals: 1, icon: "APR" },
        { title: "Overdue Items", value: 7, subtitle: "Need attention", trend: "-3", trendDirection: "down", tone: "amber", format: "number", icon: "OD" },
      ])),
      titleText: "Operational KPI Summary",
      subtitleText: "Sample metrics for service request operations",
      layoutMode: "auto",
      cardTone: "blue",
      showTrend: boolExpr(true),
      showIcon: boolExpr(true),
      compactMode: boolExpr(false),
      emptyStateText: "No KPI metrics configured",
      numberLocale: "en-US",
      decimalPlaces: "0",
      minCardWidth: "220",
      valueSize: "medium",
    }, "KPI Card Set"),
    control(scripts["distribution-chart-module"], {
      dataListId: textExpr(ids.serviceRequests.listId),
      categoryField: textExpr("Text3"),
      titleText: "Requests by Status",
      subtitleText: "Seeded service requests grouped by status",
      chartType: "donut",
      maxCategories: "8",
      showLegend: boolExpr(true),
      showCount: boolExpr(true),
      emptyText: "No request records found",
      colorMode: "status",
      sortMode: "countDesc",
      filterExpression: textExpr(""),
      height: "280",
      pageSize: "500",
      unknownLabel: "Unspecified",
      otherLabel: "Other",
    }, "Distribution Chart Module"),
    control(scripts["trend-chart-module"], {
      dataListId: textExpr(ids.serviceRequests.listId),
      dateField: textExpr("Datetime1"),
      titleText: "Monthly Request Trend",
      subtitleText: "Seeded requests by submitted date",
      chartType: "column",
      timeGranularity: "month",
      maxPoints: "12",
      showPointLabels: boolExpr(true),
      showXAxisLabels: boolExpr(true),
      showYAxis: boolExpr(true),
      emptyText: "No dated request records found",
      colorMode: "yeeflow",
      sortMode: "chronological",
      filterExpression: textExpr(""),
      height: "300",
      pageSize: "500",
      dateRangeMode: "last12Months",
      cumulativeMode: boolExpr(false),
      fillMissingBuckets: boolExpr(true),
      unknownDateLabel: "Invalid date",
    }, "Trend Chart Module"),
    control(scripts["exception-alert-panel"], {
      sourceListId: textExpr(ids.exceptionAlerts.listId),
      rulesJson: textExpr("[]"),
      titleField: textExpr("Title"),
      severityField: textExpr("Text1"),
      statusField: textExpr("Text1"),
      descriptionField: textExpr("Text4"),
      titleText: "Exception Alerts",
      subtitleText: "Seeded high-risk and overdue records",
      showSeverity: boolExpr(true),
      maxItems: "8",
      emptyText: "No exceptions found",
      filterExpression: textExpr(""),
    }, "Exception Alert Panel"),
    control(scripts["activity-timeline"], {
      sourceListId: textExpr(ids.timelineEvents.listId),
      recordIdField: textExpr("Title"),
      recordIdValue: textExpr("SR-1001"),
      eventDateField: textExpr("Datetime1"),
      actorField: textExpr("Text2"),
      titleField: textExpr("Text1"),
      descriptionField: textExpr("Text4"),
      statusField: textExpr("Text3"),
      titleText: "Recent Activity Timeline",
      maxItems: "10",
      emptyText: "No activity yet",
      filterExpression: textExpr(""),
    }, "Activity Timeline"),
    control(scripts["related-record-summary-grid"], {
      targetListId: textExpr(ids.relatedRecords.listId),
      relationField: textExpr("Text2"),
      relationValue: textExpr("SR-1001"),
      displayedFieldsJson: textExpr(JSON.stringify(["Title", "Text1", "Text3"])),
      displayType: "card",
      titleField: textExpr("Title"),
      statusField: textExpr("Text3"),
      titleText: "Related Records",
      subtitleText: "Linked assets, vendors, and documents",
      maxItems: "6",
      emptyText: "No related records",
      filterExpression: textExpr(""),
    }, "Related Record Summary Grid"),
    control(scripts["smart-lookup-picker"], smartLookupParams(ids.relatedRecords.listId, "__temp_", "DashboardLookupJson", "DashboardLookupSelected", "DashboardLookupManual", "Dashboard Asset / Vendor Lookup"), "Dashboard Smart Lookup Picker"),
  ];
}

function nativeDataListControl(listId) {
  return {
    id: cryptoId("native-request-data-list"),
    type: "data-list",
    label: "Service Request Queue",
    attrs: {
      listarr: [
        { DisplayName: "Request", FieldName: "Request", Field: "Title" },
        { DisplayName: "Category", FieldName: "Category", Field: "Text1" },
        { DisplayName: "Status", FieldName: "Status", Field: "Text3" },
        { DisplayName: "Priority", FieldName: "Priority", Field: "Text4" },
      ],
      data: {
        list: {
          AppID: 41,
          ListID: String(listId),
          Type: 1,
          Title: "Service Requests",
          ListSetID: nextId(0),
        },
      },
      title: { value: "Service Request Queue", variable: null },
    },
    children: [],
    nv_label: "Native Service Request Queue",
  };
}

function smartLookupParams(listId, prefix, combined, selected, manual, label) {
  return {
    dataListId: textExpr(listId),
    displayField: textExpr("Title"),
    valueField: textExpr("ListDataID"),
    saveToField: target(prefix, combined),
    selectedItemsField: target(prefix, selected),
    newItemsField: target(prefix, manual),
    multiSelect: boolExpr(true),
    allowManualEntry: boolExpr(true),
    maxResults: "8",
    placeholderText: "Search asset, vendor, or related record",
    labelText: label,
    noResultText: "No matching records found",
    manualTagText: "Manual",
    minSearchChars: "1",
    debounceMs: "260",
  };
}

function updateDashboard(data, scripts, ids) {
  const layout = data.Item.Layouts[0];
  layout.Title = "Service Request & Compliance Dashboard";
  const page = parseJson(layout.LayoutInResources[0].Resource);
  page.title = "Service Request & Compliance Dashboard";
  page.tempVars = [
    { idx: cryptoId("dash-combined"), id: "DashboardLookupJson" },
    { idx: cryptoId("dash-selected"), id: "DashboardLookupSelected" },
    { idx: cryptoId("dash-manual"), id: "DashboardLookupManual" },
  ];
  const content = findFirst(page, (node) => node.nv_label === "Content") || page;
  content.children = dashboardControls(scripts, ids);
  setJson(layout.LayoutInResources[0], "Resource", page);
  fs.writeFileSync(OUT_DASHBOARD, JSON.stringify(page, null, 2) + "\n");
}

function ensureVariable(def, id, name, type = "text") {
  if (!def.variables.basic.some((item) => item.id === id)) {
    def.variables.basic.push({ idx: cryptoId(id), id, name, type, editable: true });
  }
}

function approvalControls(scripts, ids, readonly) {
  return [
    heading(readonly ? "Review Request Context" : "Submit Service Request", readonly ? "Review header" : "Submit header"),
    control(scripts["dependent-selector"], {
      dataListId: textExpr(ids.subcategories.listId),
      parentField: textExpr("Title"),
      childField: textExpr("Text1"),
      parentSaveToField: target("__variables_", "SelectedCategory"),
      childSaveToField: target("__variables_", "SelectedSubcategory"),
      titleText: "Category / Subcategory",
      subtitleText: "Choose a category and dependent service type",
      maxItems: "500",
      emptyText: "No options",
      filterExpression: textExpr(""),
    }, "Dependent Selector"),
    control(scripts["hierarchical-selector"], {
      dataListId: textExpr(ids.requestCategories.listId),
      idField: textExpr("ListDataID"),
      parentField: textExpr("Text1"),
      labelField: textExpr("Title"),
      valueField: textExpr("Text2"),
      saveToField: target("__variables_", "SelectedHierarchy"),
      multiSelect: boolExpr(true),
      titleText: "Service Area Hierarchy",
      subtitleText: "Select the relevant service taxonomy",
      maxItems: "200",
      emptyText: "No hierarchy records",
      filterExpression: textExpr(""),
    }, "Hierarchical Selector"),
    control(scripts["smart-lookup-picker"], smartLookupParams(ids.relatedRecords.listId, "__variables_", "PickerCombinedJson", "PickerSelectedValues", "PickerManualValues", "Approval Asset / Vendor Lookup"), "Approval Smart Lookup Picker"),
    control(scripts["multi-entry-tag-input"], {
      saveToField: target("__variables_", "RequestTagsJson"),
      titleText: "Request Tags",
      subtitleText: "Press Enter to add each tag",
      placeholderText: "Type tag and press Enter",
      maxTags: "20",
      allowDuplicates: boolExpr(false),
      saveMode: "json",
      delimiter: ",",
      emptyText: "",
    }, "Multi Entry Tag Input"),
    control(scripts["checklist-compliance-block"], {
      itemsJson: textExpr(JSON.stringify([
        { id: "owner", label: "Business owner confirmed", required: true },
        { id: "privacy", label: "Data/privacy impact reviewed", required: true },
        { id: "rollback", label: "Rollback plan documented", required: false },
      ])),
      saveToField: target("__variables_", "ComplianceChecklistJson"),
      requireAllChecked: boolExpr(true),
      showProgress: boolExpr(true),
      titleText: "Compliance Checklist",
      subtitleText: "Confirm required controls before submission",
      emptyText: "No checklist configured",
    }, "Checklist Compliance Block"),
    control(scripts["approval-timeline"], {
      sourceListId: textExpr(ids.timelineEvents.listId),
      recordIdField: textExpr("Title"),
      recordIdValue: textExpr("SR-1001"),
      eventDateField: textExpr("Datetime1"),
      actorField: textExpr("Text2"),
      decisionField: textExpr("Text3"),
      commentField: textExpr("Text4"),
      titleText: "Approval Timeline",
      subtitleText: "Review history",
      maxItems: "8",
      emptyText: "No history yet",
      filterExpression: textExpr(""),
    }, "Approval Timeline"),
    control(scripts["activity-timeline"], {
      sourceListId: textExpr(ids.timelineEvents.listId),
      recordIdField: textExpr("Title"),
      recordIdValue: textExpr("SR-1001"),
      eventDateField: textExpr("Datetime1"),
      actorField: textExpr("Text2"),
      titleField: textExpr("Text1"),
      descriptionField: textExpr("Text4"),
      statusField: textExpr("Text3"),
      titleText: "Activity Timeline",
      maxItems: "8",
      emptyText: "No activity yet",
      filterExpression: textExpr(""),
    }, "Approval Activity Timeline"),
    control(scripts["related-record-summary-grid"], {
      targetListId: textExpr(ids.relatedRecords.listId),
      relationField: textExpr("Text2"),
      relationValue: textExpr("SR-1001"),
      displayedFieldsJson: textExpr(JSON.stringify(["Title", "Text1", "Text3"])),
      displayType: "table",
      titleField: textExpr("Title"),
      statusField: textExpr("Text3"),
      titleText: "Related Assets and Vendors",
      subtitleText: "Records linked to this request",
      maxItems: "6",
      emptyText: "No related records",
      filterExpression: textExpr(""),
    }, "Approval Related Record Summary Grid"),
    ...(readonly ? [
      control(scripts["approval-decision-panel"], {
        decisionField: target("__variables_", "ReviewDecision"),
        commentField: target("__variables_", "ReviewComment"),
        titleText: "Reviewer Decision Support",
        subtitleText: "Capture the review recommendation before using the native workflow action.",
        approveLabel: "Approve",
        rejectLabel: "Reject",
        reviseLabel: "Request Changes",
        defaultDecision: textExpr(""),
        requireCommentOnReject: boolExpr(true),
        requireCommentOnRevise: boolExpr(true),
        showCommentBox: boolExpr(true),
        commentPlaceholder: "Add your reason or comment...",
        panelStyle: "standard",
        showStatusSummary: boolExpr(true),
        readonlyText: "No approval decision has been captured yet.",
        decisionOptionsJson: textExpr("[]"),
        validationMessageReject: "Reject requires a comment.",
        validationMessageRevise: "Request changes requires a comment.",
      }, "Approval Decision Panel"),
      input("ReviewDecision", "Review Decision", readonly),
      input("ReviewComment", "Review Comment", readonly),
    ] : []),
    input("SelectedCategory", "Selected Category", readonly),
    input("SelectedSubcategory", "Selected Subcategory", readonly),
    input("SelectedHierarchy", "Selected Hierarchy", readonly),
    input("PickerCombinedJson", "Picker Combined JSON", readonly),
    input("RequestTagsJson", "Request Tags JSON", readonly),
    input("ComplianceChecklistJson", "Compliance Checklist JSON", readonly),
  ];
}

function updateApproval(data, scripts, ids) {
  const form = data.Forms[0];
  form.Name = "Enterprise Service Request Review";
  form.Key = FLOW_KEY;
  form.DefKey = FLOW_KEY;
  form.Description = "Approval workflow with all reusable custom code templates in form context.";
  form.ListID = 0;
  const def = parseJson(form.DefResource);
  def.defkey = FLOW_KEY;
  def.name = "Enterprise Service Request Review";
  def.title = "Enterprise Service Request Review";
  def.listInfo.Title = "Service Requests";
  [
    ["SelectedCategory", "Selected Category"],
    ["SelectedSubcategory", "Selected Subcategory"],
    ["SelectedHierarchy", "Selected Hierarchy"],
    ["RequestTagsJson", "Request Tags JSON"],
    ["ComplianceChecklistJson", "Compliance Checklist JSON"],
    ["ReviewDecision", "Review Decision"],
    ["ReviewComment", "Review Comment"],
  ].forEach(([id, name]) => ensureVariable(def, id, name));
  for (const [pageIndex, page] of def.pageurls.entries()) {
    page.title = pageIndex === 0 ? "Submit Service Request" : "Review Service Request";
    page.formdef.title = page.title;
    const body = findFirst(page.formdef, (node) => node.nv_label === "Form body");
    if (body) body.children = approvalControls(scripts, ids, pageIndex > 0);
  }
  updateWorkflow(def, ids.serviceRequests.listId);
  form.DefResource = JSON.stringify(def);
  fs.writeFileSync(OUT_APPROVAL, JSON.stringify(def, null, 2) + "\n");
}

function taskOutcome(taskId, taskName, outcome) {
  return `<input type="button" data="\${&quot;type&quot;:&quot;task&quot;,&quot;param&quot;:{&quot;defid&quot;:&quot;${taskId}&quot;}, &quot;prop&quot;:&quot;Outcome&quot;}" expr="__" tabindex="-1" value="${taskName}:Outcome">`;
}

function outcomeValue(value) {
  return `<input type="button" data="${value}" expr="__" tabindex="-1" value="Task outcome:${value}">`;
}

function updateWorkflow(def, serviceListId) {
  const start = def.childshapes.find((s) => s.stencil?.id === "StartNoneEvent");
  const review = def.childshapes.find((s) => s.stencil?.id === "MultiAssignmentTask");
  const persist = def.childshapes.find((s) => s.stencil?.id === "ContentList");
  const end = def.childshapes.find((s) => s.stencil?.id === "EndNoneEvent");
  const reject = def.childshapes.find((s) => s.stencil?.id === "EndRejectEvent");
  const pageId = review.properties.taskurl;
  const requesterAssignment = clone(review.properties.usertaskassignment);
  const task = (id, name, x, y) => ({
    resourceid: id,
    stencil: { id: "MultiAssignmentTask" },
    properties: { ...clone(review.properties), name, taskurl: pageId, usertaskassignment: requesterAssignment },
    outgoing: [],
    incoming: [],
    id,
    date: 1760001900000,
    position: { x, y },
  });
  const manager = task("cct-node-manager-review", "Manager Review", 180, 100);
  const compliance = task("cct-node-compliance-review", "Compliance Review", 420, 100);
  const final = task("cct-node-final-approval", "Final Approval", 660, 100);
  persist.resourceid = "cct-node-persist";
  persist.id = "cct-node-persist";
  persist.position = { x: 900, y: 100 };
  persist.properties.name = "Create Service Request Record";
  persist.properties.listid = serviceListId;
  persist.properties.listsetid = nextId(0);
  persist.properties.listdatas = [
    ["Title", "RequestTitle", "Request Title"],
    ["Text1", "SelectedCategory", "Selected Category"],
    ["Text2", "SelectedSubcategory", "Selected Subcategory"],
    ["Text3", "ReviewDecision", "Review Decision"],
    ["Text4", "ReviewComment", "Review Comment"],
    ["Text6", "PickerSelectedValues", "Picker Selected Values"],
    ["Text7", "PickerManualValues", "Picker Manual Values"],
  ].map(([column, id, name]) => ({ Per: "0", Columns: column, Data: `<input type="button" data="\${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${id}&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:${name}">` }));
  end.resourceid = "cct-node-completed";
  end.id = "cct-node-completed";
  end.properties.name = "Completed";
  end.position = { x: 1140, y: 100 };
  reject.resourceid = "cct-node-rejected";
  reject.id = "cct-node-rejected";
  reject.properties.name = "Rejected / Returned";
  reject.position = { x: 660, y: 320 };
  const flow = (id, name, source, target, condition) => ({
    resourceid: id,
    stencil: { id: "SequenceFlow" },
    properties: { linetype: "rounded", name, ...(condition ? { documentation: condition, conditioninfo: [{ key: `${id}-cond`, pre: "and", left: taskOutcome(source.id, source.properties?.name || "Task", condition), op: "s.=", right: outcomeValue(condition) }] } : {}) },
    target: { id: target.id, resourceid: target.resourceid },
    id,
    date: 1760001910000,
    source: { id: source.id, resourceid: source.resourceid },
  });
  const f1 = flow("cct-flow-start-manager", "Submit to Manager Review", start, manager);
  const f2 = flow("cct-flow-manager-compliance", "Manager Approved to Compliance Review", manager, compliance, "Approved");
  const f3 = flow("cct-flow-manager-reject", "Manager Rejected or Returned", manager, reject, "Rejected");
  const f4 = flow("cct-flow-compliance-final", "Compliance Approved to Final Approval", compliance, final, "Approved");
  const f5 = flow("cct-flow-compliance-reject", "Compliance Rejected or Returned", compliance, reject, "Rejected");
  const f6 = flow("cct-flow-final-persist", "Final Approved to Persistence", final, persist, "Approved");
  const f7 = flow("cct-flow-final-reject", "Final Rejected or Returned", final, reject, "Rejected");
  const f8 = flow("cct-flow-persist-complete", "Persisted Request to Completed", persist, end);
  start.outgoing = [{ id: f1.id, resourceid: f1.resourceid }];
  manager.incoming = [{ id: f1.id, resourceid: f1.resourceid }];
  manager.outgoing = [{ id: f2.id, resourceid: f2.resourceid }, { id: f3.id, resourceid: f3.resourceid }];
  compliance.incoming = [{ id: f2.id, resourceid: f2.resourceid }];
  compliance.outgoing = [{ id: f4.id, resourceid: f4.resourceid }, { id: f5.id, resourceid: f5.resourceid }];
  final.incoming = [{ id: f4.id, resourceid: f4.resourceid }];
  final.outgoing = [{ id: f6.id, resourceid: f6.resourceid }, { id: f7.id, resourceid: f7.resourceid }];
  persist.incoming = [{ id: f6.id, resourceid: f6.resourceid }];
  persist.outgoing = [{ id: f8.id, resourceid: f8.resourceid }];
  end.incoming = [{ id: f8.id, resourceid: f8.resourceid }];
  reject.incoming = [{ id: f3.id, resourceid: f3.resourceid }, { id: f5.id, resourceid: f5.resourceid }, { id: f7.id, resourceid: f7.resourceid }];
  def.childshapes = [start, manager, compliance, final, persist, end, reject, f1, f2, f3, f4, f5, f6, f7, f8];
}

function updateServiceListForm(lists, scripts, ids) {
  const list = lists.serviceRequests.list;
  const layout = list.Layouts.find((item) => item.Type === 1 && item.Title === "Edit Item");
  if (!layout?.LayoutInResources?.[0]) return;
  const page = parseJson(layout.LayoutInResources[0].Resource);
  const content = findFirst(page, (node) => node.nv_label === "Content");
  if (content) {
    content.children.splice(1, 0,
      control(scripts["smart-lookup-picker"], smartLookupParams(ids.relatedRecords.listId, "__list_", "Text5", "Text6", "Text7", "List Form Asset / Vendor Lookup"), "Data List Form Smart Lookup Picker"),
      input("Text5", "Picker Combined JSON"),
      input("Text6", "Picker Selected Values"),
      input("Text7", "Picker Manual Values")
    );
  }
  setJson(layout.LayoutInResources[0], "Resource", page);
}

function updateRootNavigation(data, ids) {
  const root = data.Item.ListModel;
  root.ListID = nextId(0);
  root.Title = TITLE;
  root.Description = DESCRIPTION;
  root.IconUrl = JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-layer-group", c: "#0065FF" });
  const layout = data.Item.Layouts[0];
  layout.LayoutID = nextId(1);
  layout.ListID = nextId(0);
  layout.Title = "Service Request & Compliance Dashboard";
  layout.LayoutInResources[0].ID = nextId(1);
  layout.LayoutInResources[0].RefId = nextId(1);
  root.LayoutView = JSON.stringify({
    add: "default",
    edit: "default",
    view: "default",
    sort: [
      { AppID: 41, ListID: nextId(1), ListSetID: nextId(0), Type: 103, Title: "Service Request & Compliance Dashboard", Icon: "fa-regular fa-chart-line", DisplayName: "Overview" },
      ...LISTS.map((meta) => ({ AppID: 41, ListID: ids[meta.key].listId, ListSetID: nextId(0), Type: 1, IsHidden: false, Title: meta.title, Icon: meta.icon })),
      { AppID: "41", Title: "Enterprise Service Request Review", ListID: FLOW_KEY, ListSetID: nextId(0), Type: 105, Icon: "fa-regular fa-paper-plane" },
    ],
    attrs: {
      appearance: { bgc: "var(--c--primary-light)", color: "var(--c--primary)" },
      "navigator-menu": { bgc: "var(--c--primary)", color: "var(--c--primary-light)", position: "default" },
      CustomColors: [],
      CustomFonts: [],
    },
    sortVer: 1,
  });
}

function collectLargeIds(value, ids = new Set()) {
  if (typeof value === "string" && /^-?\d{16,}$/.test(value)) ids.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectLargeIds(item, ids));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => {
    collectLargeIds(key, ids);
    collectLargeIds(child, ids);
  });
  return ids;
}

function collectLocalIds(value, ids = new Set()) {
  if (isLocalId(value)) ids.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectLocalIds(item, ids));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => {
    collectLocalIds(key, ids);
    collectLocalIds(child, ids);
  });
  return ids;
}

function writeReports(data, resource) {
  const report = {
    appName: TITLE,
    phase: "Phase 2 local generation",
    runtimeStatus: "not tested",
    publicFormSupport: "not claimed",
    generatedPackage: OUT_YAP,
    templates: TEMPLATE_NAMES.map((name) => ({ name, localGeneration: "included", runtimeClassification: name === "smart-lookup-picker" ? "previously proven elsewhere; regression not yet tested in this app" : "not tested" })),
    localValidation: "pending; see validator artifacts generated after this script runs",
  };
  fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync(OUT_BASELINE, [
    "# Custom Code Template Showcase Local Validation Baseline",
    "",
    `App: ${TITLE}`,
    "",
    "Phase 2 generated a local `.yap` showcase package with all 13 custom code templates embedded in Custom Code controls.",
    "",
    "Runtime status: not tested. Do not claim runtime proof from this baseline.",
    "",
    "Public form support: not claimed.",
    "",
    "Generated package path: `custom-code-template-showcase.v1.yap`",
    "",
    "Included contexts:",
    "- Dashboard: KPI, distribution, trend, exception alerts, activity timeline, related-record grid, Smart Lookup Picker.",
    "- Approval form: dependent selector, hierarchical selector, Smart Lookup Picker, multi-entry tags, checklist, approval timeline, activity timeline, related-record grid, approval decision panel.",
    "- Data-list custom form: Smart Lookup Picker regression placement using `__list_` output targets.",
    "",
    "Local validation results are recorded in the generated `custom-code-template-showcase.v1.validate-*.json` artifacts after the validator chain is run.",
  ].join("\n") + "\n");
  fs.writeFileSync(OUT_RESOURCE, JSON.stringify(resource, null, 2) + "\n");
  fs.writeFileSync(OUT_APP, JSON.stringify(data, null, 2) + "\n");
}

function updateSpecReadiness() {
  const specPath = "custom-code-template-showcase-app-spec.json";
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  spec.readyForGeneration = true;
  spec.doNotGenerateYet = false;
  spec.generationGateReason = "Phase 2 readiness accepted for local package generation. Runtime proof remains pending for all templates in this generated app.";
  spec.runtimeRiskAssumptions = [
    "Twelve templates remain inventory-only until this generated app is imported and exercised.",
    "Smart Lookup Picker has previous runtime proof, but this showcase still needs regression testing.",
    "Public forms are not included and public-form support is not claimed.",
    "Custom code writeback is configured only for templates that expose writable targets.",
  ];
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2) + "\n");
}

function main() {
  const scripts = readTemplates();
  const baseResource = JSON.parse(fs.readFileSync(BASE_RESOURCE, "utf8"));
  const baseData = JSON.parse(fs.readFileSync(BASE_APP, "utf8"));
  const idMap = new Map();
  const oldLocalPrefix = localIdPrefixFrom(baseResource);
  baseResource.ReplaceIds.forEach((oldId, index) => {
    const id = String(oldId);
    if (isLocalId(id, oldLocalPrefix)) idMap.set(id, nextId(index));
  });
  const resource = remapIds(clone(baseResource), idMap);
  const data = remapIds(clone(baseData), idMap);
  resource.Title = TITLE;
  resource.Description = DESCRIPTION;
  resource.FormKeys = [FLOW_KEY];
  resource.ReportIds = [];
  resource.ReplaceIds = [...new Set([...baseResource.ReplaceIds.filter((id) => isLocalId(String(id), oldLocalPrefix)).map((_, index) => nextId(index))])];

  const baseList = data.Childs[0];
  const lists = {};
  const ids = {};
  LISTS.forEach((meta, index) => {
    const generated = makeList(baseList, meta, index);
    lists[meta.key] = generated;
    ids[meta.key] = generated.ids;
  });
  configureListFields(lists);
  seedLists(lists);
  data.Childs = LISTS.map((meta) => lists[meta.key].list);

  updateRootNavigation(data, ids);
  updateDashboard(data, scripts, ids);
  updateApproval(data, scripts, ids);
  updateServiceListForm(lists, scripts, ids);
  data.OtherModules = [];
  resource.Data = JSON.stringify(data);
  for (const id of collectLocalIds({ resource, data })) {
    if (!resource.ReplaceIds.includes(id)) resource.ReplaceIds.push(id);
  }
  updateSpecReadiness();
  writeReports(data, resource);
  execFileSync("node", ["build-yap-wrapper.js", OUT_RESOURCE, OUT_YAP, "--title", TITLE, "--description", DESCRIPTION, "--validation-mode", "generator"], { stdio: "inherit" });
}

main();
