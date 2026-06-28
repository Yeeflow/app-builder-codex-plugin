#!/usr/bin/env node

import assert from "node:assert/strict";
import zlib from "node:zlib";
import {
  validateApprovalRuntime,
  validateBusinessPolicyModel,
  validateDashboardBindings,
  validateProofBoundaries,
  validateRequesterContext,
  validateRuntimeCompleteness,
} from "./validate-runtime-binding-lessons.mjs";

const API_ID = "1700000000009001";

function field(name, type = "input", fieldType = "Text") {
  return { FieldName: name, DisplayName: name, Type: type, FieldType: fieldType };
}

function decodedDashboard({ summary = {}, filter = {}, visualOnly = false } = {}) {
  const summaryControl = {
    id: "sum_total",
    type: "summary",
    label: "Total Resources",
    attrs: {
      data: summary.noList ? {} : { list: { ListID: "resources", Title: "Resources" } },
      ...(summary.noField ? {} : { field: "ListDataID" }),
    },
  };
  const page = {
    title: "Overview",
    attrs: {},
    filterVars: filter.noVars ? [] : [{ id: "filter_Overview_Category" }],
    tempVars: [],
    actions: [],
    exts: summary.noExt ? [] : [{
      i: "sum_total",
      key: summary.badExt ? "not-summary" : "summary",
      category: "___Pivot___",
      attr: {
        settings: {
          ...(summary.noValues ? {} : { values: [{ field: "ListDataID", fieldType: "Text", func: "COUNT" }] }),
          Conditions: filter.summaryConsumes ? [{ field: "Category", value: [{ exprType: "variable", id: "__filter_filter_Overview_Category", name: "filter_Overview_Category" }] }] : [],
        },
      },
    }],
    children: [{
      id: "Main",
      type: "container",
      children: [
        summaryControl,
        ...(visualOnly ? [{ id: "kpi_text", type: "text", label: "KPI placeholder 0" }] : []),
        ...(filter.noControl ? [] : [{ id: "filter_category", type: "select", binding: filter.noBinding ? "" : "__filter_filter_Overview_Category", label: "Category" }]),
        {
          id: "table_resources",
          type: "data-list",
          label: "Resources table",
          attrs: {
            data: {
              list: { ListID: "resources", Title: "Resources" },
              filter: filter.consumer
                ? [{ field: filter.invalidField ? "MissingField" : "Category", value: filter.lookupDisplayValue ? "Hardware" : [{ exprType: "variable", id: "__filter_filter_Overview_Category", name: "filter_Overview_Category" }] }]
                : [],
            },
          },
        },
      ],
    }],
  };
  const fields = [field("Title"), field("Category", "lookup"), field("Owner")];
  if (!summary.omitListDataIdFromSchema) fields.splice(1, 0, field("ListDataID"));
  return {
    ListSet: { LayoutView: JSON.stringify({ sort: [{ Title: "Overview", Type: 103, LayoutID: "overview" }] }) },
    Pages: [{
      Title: "Overview",
      Type: 103,
      LayoutID: "overview",
      ReportIds: summary.noReportId ? [] : ["sum_total"],
      LayoutInResources: [{ Resource: JSON.stringify(page), ReportIds: summary.noReportId ? [] : ["sum_total"] }],
    }],
    Childs: [{
      List: { ListID: "resources", Title: "Resources" },
      Fields: fields,
      Layouts: [],
      RemindRules: [],
      PublicForms: [],
      FlowMappings: [],
    }],
  };
}

function codes(findings) {
  return findings.map((finding) => finding.code);
}

function expectCode(caseName, findings, code) {
  assert.ok(codes(findings).includes(code), `${caseName} expected ${code}, got ${JSON.stringify(findings, null, 2)}`);
}

function expectNoCode(caseName, findings, code) {
  assert.ok(!codes(findings).includes(code), `${caseName} did not expect ${code}, got ${JSON.stringify(findings, null, 2)}`);
}

expectCode("summary missing list", validateDashboardBindings(decodedDashboard({ summary: { noList: true }, filter: { summaryConsumes: true, consumer: true } })), "DASHBOARD_SUMMARY_MISSING_DATA_LIST");
expectCode("summary missing field", validateDashboardBindings(decodedDashboard({ summary: { noField: true }, filter: { summaryConsumes: true, consumer: true } })), "DASHBOARD_SUMMARY_MISSING_FIELD");
expectCode("summary missing ext", validateDashboardBindings(decodedDashboard({ summary: { noExt: true }, filter: { consumer: true } })), "DASHBOARD_SUMMARY_MISSING_EXT");
expectCode("summary ext missing values", validateDashboardBindings(decodedDashboard({ summary: { noValues: true }, filter: { summaryConsumes: true, consumer: true } })), "DASHBOARD_SUMMARY_MISSING_VALUES");
expectCode("summary missing report id", validateDashboardBindings(decodedDashboard({ summary: { noReportId: true }, filter: { summaryConsumes: true, consumer: true } })), "DASHBOARD_SUMMARY_MISSING_REPORT_ID");
assert.equal(validateDashboardBindings(decodedDashboard({ summary: { omitListDataIdFromSchema: true }, filter: { summaryConsumes: true, consumer: true } })).filter((finding) => finding.severity === "error").length, 0, "ListDataID Summary count is a system field and does not need to appear in business Fields[]");
expectCode("declared filter not consumed", validateDashboardBindings(decodedDashboard()), "DASHBOARD_FILTER_VAR_DECLARED_NOT_CONSUMED");
expectCode("filter control without var", validateDashboardBindings(decodedDashboard({ filter: { noBinding: true } })), "DASHBOARD_FILTER_CONTROL_WITHOUT_FILTER_VAR");
expectCode("consumer invalid field", validateDashboardBindings(decodedDashboard({ filter: { summaryConsumes: true, consumer: true, invalidField: true } })), "DASHBOARD_FILTER_CONSUMER_INVALID_FIELD");
expectCode("lookup display filter", validateDashboardBindings(decodedDashboard({ filter: { summaryConsumes: true, consumer: true, lookupDisplayValue: true } })), "DASHBOARD_LOOKUP_FILTER_VALUE_NOT_RECORD_ID");
expectCode("visual KPI card", validateDashboardBindings(decodedDashboard({ visualOnly: true, filter: { summaryConsumes: true, consumer: true } })), "DASHBOARD_VISUAL_ONLY_KPI_CARD");
assert.equal(validateDashboardBindings(decodedDashboard({ filter: { summaryConsumes: true, consumer: true } })).filter((finding) => finding.severity === "error").length, 0);

const multiFilterDashboard = decodedDashboard({ filter: { summaryConsumes: true, consumer: true } });
const multiFilterPage = JSON.parse(multiFilterDashboard.Pages[0].LayoutInResources[0].Resource);
multiFilterPage.filterVars.push({ id: "filter_Tasks" });
multiFilterPage.children[0].children.push({ id: "filter_tasks", type: "search", binding: "__filter_filter_Tasks", label: "Task search" });
multiFilterPage.children[0].children.find((child) => child.id === "table_resources").attrs.data.fulltext = [
  { field: "Title", value: [{ exprType: "variable", id: "__filter_filter_Tasks", name: "filter_Tasks" }] },
];
multiFilterDashboard.Pages[0].LayoutInResources[0].Resource = JSON.stringify(multiFilterPage);
assert.equal(validateDashboardBindings(multiFilterDashboard).filter((finding) => finding.severity === "error").length, 0, "a single consumer may consume more than one declared dashboard filter variable");

const plan = {
  navigation: {
    groups: [
      { title: "My Leave", items: ["Request Leave", "My Balances"] },
      { title: "Approvals", items: ["Pending Approvals"] },
    ],
  },
};
const navApp = {
  ListSet: {
    LayoutView: JSON.stringify({
      sort: [{ Title: "My Leave", Type: "classes", list: [{ Title: "Request Leave", Type: 103, LayoutID: "request" }] }],
    }),
  },
  Pages: [{ Title: "Request Leave", Type: 103, LayoutID: "request", LayoutInResources: [] }, { Title: "Hidden Report", Type: 103, LayoutID: "hidden", LayoutInResources: [] }],
  Groups: [{ ID: "1", Name: "Local group" }],
};
let findings = validateRuntimeCompleteness(navApp, plan, {});
expectCode("missing nav group", findings, "NAVIGATION_GROUP_MISSING");
expectCode("missing nav entry", findings, "NAVIGATION_VISIBLE_ENTRY_MISSING");
expectCode("unreachable resource", findings, "NAVIGATION_RESOURCE_UNREACHABLE");
expectCode("small group id", findings, "APP_GROUP_ID_NOT_API_ISSUED");
expectNoCode("api issued group id", validateRuntimeCompleteness({ ...navApp, Groups: [{ ID: API_ID, Name: "Issued" }] }, { navigation: { groups: [{ title: "My Leave", items: ["Request Leave"] }] } }, {}), "APP_GROUP_ID_NOT_API_ISSUED");

const childrenNavApp = {
  ListSet: {
    LayoutView: JSON.stringify({
      sort: [{ Title: "Requests", Type: "classes", children: [{ Title: "New Leave Request", Type: 105, ListID: "LRF" }] }],
    }),
  },
  Forms: [{ Key: "LRF" }],
};
expectCode("children navigation group", validateRuntimeCompleteness(childrenNavApp, {}, {}), "NAVIGATION_GROUP_CHILDREN_UNSUPPORTED");

const approvalRequiredPlan = { workflows: [{ title: "Leave Request Approval", type: "approval" }] };
expectCode("approval form required by plan", validateRuntimeCompleteness({ ListSet: { LayoutView: "{}" }, Forms: [] }, approvalRequiredPlan, {}), "APPROVAL_FORM_REQUIRED_BY_PLAN_MISSING");

expectCode("service portal payload excluded", validateRuntimeCompleteness({ PortalInfo: { Title: "Portal" }, ListSet: { LayoutView: "{}" } }, {}, { servicePortal: "absent" }), "SERVICE_PORTAL_PAYLOAD_PRESENT_WHEN_EXCLUDED");
expectNoCode("service portal absent", validateRuntimeCompleteness({ ListSet: { LayoutView: "{}" }, PortalInfo: null }, {}, { servicePortal: "absent" }), "SERVICE_PORTAL_PAYLOAD_PRESENT_WHEN_EXCLUDED");

const staticApproval = {
  Forms: [{
    pageurls: [{
      type: 1,
      pageUrl: "request",
      formdef: { pagetype: 1, children: [{ type: "text", label: "Static request text" }] },
    }],
  }],
};
findings = validateApprovalRuntime(staticApproval);
expectCode("static approval page", findings, "APPROVAL_FORM_STATIC_ONLY");
expectCode("missing task page", findings, "APPROVAL_TASK_PAGE_URL_MISSING");
expectCode("missing workflow panel", findings, "APPROVAL_WORKFLOW_PANEL_MISSING");

const validApproval = {
  Forms: [{
    pageurls: [
      { type: 1, pageUrl: "request", formdef: { pagetype: 1, children: [{ type: "input", binding: "Requester" }, { type: "workflowControlPanel" }, { type: "workflowHistory" }] } },
      { type: 2, pageUrl: "task", formdef: { pagetype: 2, children: [{ type: "textarea", binding: "DecisionComment" }, { type: "workflowControlPanel" }, { type: "workflowHistory" }] } },
    ],
  }],
};
assert.equal(validateApprovalRuntime(validApproval).filter((finding) => finding.severity === "error").length, 0);

const encodedValidApproval = {
  Forms: [{
    DefResource: Buffer.concat([
      Buffer.from("::brotli::", "utf8"),
      zlib.brotliCompressSync(Buffer.from(JSON.stringify({ pageurls: validApproval.Forms[0].pageurls }), "utf8")),
    ]).toString("base64"),
  }],
};
assert.equal(validateApprovalRuntime(encodedValidApproval).filter((finding) => finding.severity === "error").length, 0, "approval runtime validator must inspect encoded DefResource.pageurls[]");

const oldRequester = {
  actions: [{
    type: "SetVariableTask",
    variablesetting: [{
      id: "__variables_Department",
      name: "Department",
      valueType: "groupselect",
      value: [{ func: "getUserAttr" }, { id: "__variables_Requester" }, "DepartmentID"],
    }],
  }],
};
findings = validateRequesterContext(oldRequester, { nativeUserAttributesExpected: true });
expectCode("old requester token", findings, "REQUESTER_CONTEXT_OLD_VARIABLE_TOKEN_SHAPE");
expectCode("getUserAttr wrong wrapper", findings, "REQUESTER_CONTEXT_WRAPPER_INVALID");

const queryRequester = { actions: [{ type: "QueryData", target: "Employee Profiles" }] };
expectCode("native attrs should not querydata", validateRequesterContext(queryRequester, { nativeUserAttributesExpected: true }), "REQUESTER_CONTEXT_QUERYDATA_NATIVE_ATTRIBUTES");

const validRequester = {
  actions: [{
    type: "SetVariableTask",
    variablesetting: [
      { id: "Department", name: "Workflow Variables:Department", valueType: "groupselect", value: [{ func: "getUserAttr" }, { id: "Requester", name: "Workflow Variables:Requester", valueType: "user" }, "DepartmentID"] },
      { id: "Manager", name: "Workflow Variables:Manager", valueType: "user", value: [{ func: "getUserAttr" }, { id: "Requester", name: "Workflow Variables:Requester", valueType: "user" }, "LineManager"] },
    ],
  }],
};
assert.equal(validateRequesterContext(validRequester, { nativeUserAttributesExpected: true }).filter((finding) => finding.severity === "error").length, 0);

expectCode("signing http 200 boundary", validateProofBoundaries({ signingHttpStatus: 200, signatureBytes: 12, upgrade_applied: true }), "SIGNING_HTTP_200_NOT_VERIFYSIGN_PROOF");
expectCode("api not runtime proof", validateProofBoundaries({ upgrade_check_passed: true, upgrade_applied: true }), "API_ACCEPTANCE_NOT_RUNTIME_PROOF");

findings = validateBusinessPolicyModel({ requiresPolicyCatalog: true, overBalanceSubmitBehavior: "hardcoded" });
expectCode("policy catalog", findings, "POLICY_CATALOG_MISSING");
expectCode("hardcoded submit", findings, "SUBMIT_VALIDATION_POLICY_HARDCODED");

findings = validateBusinessPolicyModel({
  requiresPolicyCatalog: true,
  policyCatalog: [{ Title: "Annual Leave", "Balance Limited": true, "Balance Block Mode": "hard-block", "Attachment Required After Days": 3, "HR Review Required": false }],
});
assert.equal(findings.filter((finding) => finding.severity === "error").length, 0);

console.log("runtime binding lessons regression tests passed");
