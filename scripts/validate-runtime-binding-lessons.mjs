#!/usr/bin/env node

import fs from "node:fs";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const API_ISSUED_ID_RE = /^\d{16,}$/;
const DASHBOARD_CONSUMER_TYPES = new Set(["summary", "collection", "data-list", "pivot-table", "pie-chart", "bar-chart", "line-chart"]);
const DATA_FILTER_TYPES = new Set(["search", "select", "checkbox", "radio", "date", "range", "check-range", "relative-period", "hierarchy", "sorting"]);
const LOOKUP_CONTROL_TYPES = new Set(["lookup", "organization-picker", "identity-picker"]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function add(findings, severity, code, message, detail = {}) {
  findings.push({ severity, code, message, ...detail });
}

function parseMaybeJson(value) {
  if (isObject(value) || Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value.replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function decodeInput(file) {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  if (typeof parsed.Resource === "string" && file.toLowerCase().endsWith(".yapk")) {
    return JSON.parse(zlib.brotliDecompressSync(Buffer.from(parsed.Resource, "base64")).toString("utf8"));
  }
  if (typeof parsed.Resource === "string" && parsed.Resource.startsWith(GZIP_PREFIX)) {
    const decoded = JSON.parse(zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
    return typeof decoded.Data === "string" ? JSON.parse(decoded.Data) : decoded.Data || decoded;
  }
  return parsed;
}

function controlTitle(control) {
  return safeString(
    control?.title ||
    control?.label ||
    control?.name ||
    control?.nv_label ||
    control?.attrs?.title?.value ||
    control?.attrs?.headc?.title?.value ||
    control?.attrs?.layout?.title?.value,
  );
}

function normalizeFieldName(value) {
  return safeString(value).trim();
}

function fieldKey(field) {
  return normalizeFieldName(field?.FieldName || field?.InternalName || field?.DisplayName || field?.field || field?.Field);
}

function collectLists(decoded) {
  const lists = new Map();
  const addList = (id, title, fields = []) => {
    const key = safeString(id);
    if (!key) return;
    const existing = lists.get(key) || { id: key, title: safeString(title), fields: new Map() };
    if (!existing.title) existing.title = safeString(title);
    for (const field of asArray(fields)) {
      const name = fieldKey(field);
      if (name) existing.fields.set(name, field);
    }
    lists.set(key, existing);
  };

  if (isObject(decoded?.Item?.ListModel)) addList(decoded.Item.ListModel.ListID, decoded.Item.ListModel.Title, decoded.Item.Defs);
  if (isObject(decoded?.ListSet)) addList(decoded.ListSet.ListID, decoded.ListSet.Title, []);
  for (const child of asArray(decoded?.Childs)) {
    addList(child?.List?.ListID || child?.ListModel?.ListID, child?.List?.Title || child?.ListModel?.Title, child?.Fields || child?.Defs);
  }
  return lists;
}

function extractPageResource(page) {
  const resources = asArray(page?.LayoutInResources);
  for (const resource of resources) {
    const parsed = parseMaybeJson(resource?.Resource);
    if (parsed) return { page: parsed, resource };
  }
  const parsed = parseMaybeJson(page?.Resource || page?.LayoutView);
  if (parsed) return { page: parsed, resource: page };
  return { page: null, resource: null };
}

function collectDashboardPages(decoded) {
  const pages = [];
  for (const page of asArray(decoded?.Pages || decoded?.Item?.Layouts)) {
    const type = Number(page?.Type);
    if (type !== 103) continue;
    const extracted = extractPageResource(page);
    if (extracted.page) pages.push({ layout: page, page: extracted.page, resource: extracted.resource });
  }
  return pages;
}

function listIdFromControl(control) {
  return safeString(control?.attrs?.data?.list?.ListID || control?.attrs?.data?.list?.ListSetID || control?.attrs?.data?.ListID || control?.attrs?.list?.ListID);
}

function fieldNameFromAny(value) {
  if (typeof value === "string") return value;
  if (!isObject(value)) return "";
  return safeString(value.Field || value.FieldName || value.field || value.name || value.id || value.value_f);
}

function conditionField(condition) {
  return fieldNameFromAny(condition?.field || condition?.Field || condition?.left || condition?.left_f || condition?.column || condition?.FieldName || condition?.value_f);
}

function conditionValue(condition) {
  return condition?.value ?? condition?.right ?? condition?.Value ?? condition?.defaultValue ?? condition?.values;
}

function containsFilterVar(value, filterVar) {
  let found = false;
  walk(value, (node) => {
    if (found) return;
    if (typeof node === "string" && (node === filterVar || node === `__filter_${filterVar}` || node.includes(`__filter_${filterVar}`))) found = true;
    else if (isObject(node)) {
      const id = safeString(node.id);
      const name = safeString(node.name);
      if (id === filterVar || id === `__filter_${filterVar}` || name === filterVar) found = true;
    }
  });
  return found;
}

function validRecordIdLike(value) {
  if (Array.isArray(value)) return value.every(validRecordIdLike);
  if (isObject(value)) return true;
  const text = safeString(value);
  return !text || API_ISSUED_ID_RE.test(text);
}

function validateConsumerConditions({ findings, pageName, layoutId, control, pointer, filterVars, lists }) {
  const data = control?.attrs?.data || {};
  const listId = listIdFromControl(control);
  const list = lists.get(listId);
  const conditions = [
    ...asArray(data.filter),
    ...asArray(data.Conditions),
    ...asArray(data.conditions),
  ];
  for (const [index, condition] of conditions.entries()) {
    const fieldName = conditionField(condition);
    if (fieldName && list && !list.fields.has(fieldName)) {
      add(findings, "error", "DASHBOARD_FILTER_CONSUMER_INVALID_FIELD", "Dashboard filter consumer condition references a field that is not on the consumer source list.", {
        page: pageName,
        controlId: safeString(control?.id),
        controlTitle: controlTitle(control),
        pointer: `${pointer}.attrs.data.filter[${index}]`,
        sourceList: list.title || listId,
        sourceField: fieldName,
        recommendedFix: "Bind the condition to a field present on the consumer list.",
      });
    }
    const field = list?.fields.get(fieldName);
    const value = conditionValue(condition);
    if (field && LOOKUP_CONTROL_TYPES.has(safeString(field.Type)) && value !== undefined && !containsFilterVar(value, "") && !validRecordIdLike(value)) {
      add(findings, "error", "DASHBOARD_LOOKUP_FILTER_VALUE_NOT_RECORD_ID", "Lookup-backed dashboard filters should compare record ids, not display labels.", {
        page: pageName,
        controlId: safeString(control?.id),
        controlTitle: controlTitle(control),
        sourceList: list.title || listId,
        sourceField: fieldName,
        severity: "error",
        recommendedFix: "Use the lookup record id/ListDataID value for filter comparisons.",
      });
    }
  }
  for (const filterVar of filterVars) {
    if (containsFilterVar(data.filter, filterVar) || containsFilterVar(data.fulltext, filterVar) || containsFilterVar(data.sortingfilter, filterVar)) {
      return filterVar;
    }
  }
  return "";
}

export function validateDashboardBindings(decoded, options = {}) {
  const findings = [];
  const lists = collectLists(decoded);
  const dashboards = collectDashboardPages(decoded);
  const rootReportIds = new Set(asArray(decoded?.ReportIds || decoded?.Item?.ReportIds || decoded?.ListSet?.ReportIds).map(safeString));

  for (const { layout, page, resource } of dashboards) {
    const pageName = safeString(layout?.Title || page?.title || "Dashboard");
    const layoutId = safeString(layout?.LayoutID);
    const filterVars = new Set(asArray(page?.filterVars).map((item) => safeString(item?.id || item?.name)).filter(Boolean));
    const consumedVars = new Map();
    const exts = asArray(page?.exts);
    const extByControlId = new Map(exts.map((ext) => [safeString(ext?.i), ext]));
    const reportIds = new Set([
      ...rootReportIds,
      ...asArray(layout?.ReportIds).map(safeString),
      ...asArray(resource?.ReportIds).map(safeString),
    ].filter(Boolean));
    const summaryIds = new Set();
    const filterControlVars = new Set();

    walk(page, (node, pointer) => {
      if (!isObject(node)) return;
      const type = safeString(node.type);
      const controlId = safeString(node.id);
      if (type === "summary") {
        summaryIds.add(controlId);
        const listId = listIdFromControl(node);
        const fieldName = fieldNameFromAny(node?.attrs?.field || node?.attrs?.data?.field);
        const list = lists.get(listId);
        const detail = { page: pageName, controlId, controlTitle: controlTitle(node), sourceList: list?.title || listId, sourceField: fieldName };
        if (!listId) add(findings, "error", "DASHBOARD_SUMMARY_MISSING_DATA_LIST", "Summary controls must configure attrs.data.list.", { ...detail, recommendedFix: "Set attrs.data.list to the source list." });
        if (!fieldName) add(findings, "error", "DASHBOARD_SUMMARY_MISSING_FIELD", "Summary controls must configure attrs.field or attrs.data.field.", { ...detail, recommendedFix: "Bind Summary to a resolvable aggregate field." });
        if (fieldName && list && !list.fields.has(fieldName)) add(findings, "error", "DASHBOARD_FILTER_CONSUMER_INVALID_FIELD", "Summary source field does not resolve on the source list.", { ...detail, recommendedFix: "Use a field present on the Summary source list." });
        const ext = extByControlId.get(controlId);
        if (!ext) {
          add(findings, "error", "DASHBOARD_SUMMARY_MISSING_EXT", "Summary controls require a matching page.exts[] entry.", { ...detail, recommendedFix: "Add a category ___Pivot___, key summary ext with i equal to the Summary control id." });
        } else {
          if (safeString(ext.category) !== "___Pivot___" || safeString(ext.key) !== "summary" || safeString(ext.i) !== controlId) {
            add(findings, "error", "DASHBOARD_SUMMARY_EXT_MISMATCH", "Summary ext must use category ___Pivot___, key summary, and i equal to the Summary control id.", { ...detail, extCategory: safeString(ext.category), extKey: safeString(ext.key), extI: safeString(ext.i) });
          }
          const settings = ext?.attr?.settings || {};
          if (!asArray(settings.values).length) {
            add(findings, "error", "DASHBOARD_SUMMARY_MISSING_VALUES", "Summary ext settings.values[] must define aggregate field/type/function.", { ...detail, recommendedFix: "Add settings.values[] with field, field type, and COUNT/SUM/AVG/MIN/MAX." });
          }
          for (const filterVar of filterVars) {
            if (containsFilterVar(settings.Conditions, filterVar)) consumedVars.set(filterVar, [...(consumedVars.get(filterVar) || []), controlId || "summary"]);
          }
        }
        if (controlId && !reportIds.has(controlId)) {
          add(findings, "error", "DASHBOARD_SUMMARY_MISSING_REPORT_ID", "Summary control id must be registered in Resource.ReportIds[].", { ...detail, recommendedFix: "Add the Summary control id to the dashboard Resource.ReportIds[] collection." });
        }
      }

      if (DATA_FILTER_TYPES.has(type) || safeString(node.binding).startsWith("__filter_")) {
        const binding = safeString(node.binding);
        const filterVar = binding.startsWith("__filter_") ? binding.slice("__filter_".length) : "";
        if (!filterVar || !filterVars.has(filterVar)) {
          add(findings, "error", "DASHBOARD_FILTER_CONTROL_WITHOUT_FILTER_VAR", "Dashboard filter controls must bind to a stable page-level filterVars[] entry.", {
            page: pageName,
            controlId,
            controlTitle: controlTitle(node),
            filterVariable: filterVar,
            recommendedFix: "Declare page.filterVars[] and bind the control with __filter_<filterVarId>.",
          });
        } else {
          filterControlVars.add(filterVar);
        }
      }

      if (DASHBOARD_CONSUMER_TYPES.has(type) && type !== "summary") {
        const consumed = validateConsumerConditions({ findings, pageName, layoutId, control: node, pointer, filterVars, lists });
        if (consumed) consumedVars.set(consumed, [...(consumedVars.get(consumed) || []), controlId || type]);
      }
    });

    for (const filterVar of filterVars) {
      if (!consumedVars.has(filterVar)) {
        add(findings, options.strictFilters === false ? "warning" : "error", "DASHBOARD_FILTER_VAR_DECLARED_NOT_CONSUMED", "Dashboard filterVars[] entries must be consumed by Summary, Collection, Data table, chart, or pivot controls.", {
          page: pageName,
          filterVariable: filterVar,
          consumerControls: [],
          recommendedFix: "Apply the filter variable to Summary Conditions[] or consumer attrs.data.filter[].",
        });
      }
    }

    walk(page, (node, pointer) => {
      if (!isObject(node)) return;
      const type = safeString(node.type);
      const text = controlTitle(node);
      if (["text", "heading", "text-editor"].includes(type) && /\b(kpi|metric|summary|total|count|average|pending|stock|balance)\b/i.test(`${text} ${pointer}`) && /\b(0|0\.00|N\/A|placeholder)\b/i.test(text)) {
        add(findings, "error", "DASHBOARD_VISUAL_ONLY_KPI_CARD", "Dashboard KPI cards must be data-bound Summary controls, not visual/static text placeholders.", {
          page: pageName,
          controlId: safeString(node.id),
          controlTitle: text,
          recommendedFix: "Replace static KPI text with a Summary control and matching ext/report-id registration.",
        });
      }
    });

    if (summaryIds.size && !asArray(page?.exts).length) {
      add(findings, "error", "DASHBOARD_SUMMARY_MISSING_EXT", "Dashboard page has Summary controls but no exts[] Summary registrations.", { page: pageName, layoutId });
    }
  }

  return findings;
}

function collectNavigationItems(decoded) {
  const layoutView = parseMaybeJson(decoded?.ListSet?.LayoutView || decoded?.Item?.ListModel?.LayoutView);
  const visible = [];
  const groups = [];
  const hidden = [];
  function visit(items, group = "") {
    for (const item of asArray(items)) {
      const title = safeString(item.Title || item.DisplayName || item.Name);
      const isHidden = item.IsHidden === true || item.hideTitle === true;
      const children = asArray(item.list || item.children || item.Childs);
      const isGroup = children.length > 0 || safeString(item.Type) === "classes" || safeString(item.Type) === "group";
      if (isGroup) {
        if (!isHidden && title) groups.push(title);
        visit(children, title);
      } else if (title) {
        (isHidden ? hidden : visible).push({ title, group, listId: safeString(item.ListID || item.LayoutID || item.PageID) });
      }
    }
  }
  visit(layoutView?.sort || layoutView?.list || []);
  return { groups, visible, hidden };
}

export function validateRuntimeCompleteness(decoded, plan = {}, options = {}) {
  const findings = [];
  const navigation = collectNavigationItems(decoded);
  const plannedGroups = asArray(plan?.navigation?.groups).map((group) => safeString(group.title || group.name)).filter(Boolean);
  const plannedEntries = asArray(plan?.navigation?.groups).flatMap((group) => asArray(group.items).map((item) => ({ title: safeString(item.title || item.name || item), group: safeString(group.title || group.name) }))).filter((item) => item.title);
  const visibleTitles = new Set(navigation.visible.map((item) => item.title.toLowerCase()));
  const groupTitles = new Set(navigation.groups.map((item) => item.toLowerCase()));

  for (const group of plannedGroups) {
    if (!groupTitles.has(group.toLowerCase())) add(findings, "error", "NAVIGATION_GROUP_MISSING", "Visible app navigation is missing a planned group.", { group, recommendedFix: "Generate app-level grouped navigation that matches the approved app plan." });
  }
  for (const entry of plannedEntries) {
    if (!visibleTitles.has(entry.title.toLowerCase())) add(findings, "error", "NAVIGATION_VISIBLE_ENTRY_MISSING", "Visible app navigation is missing a planned entry.", { group: entry.group, entry: entry.title });
  }

  const resourceTitles = [
    ...asArray(decoded?.Childs).map((child) => child?.List?.Title || child?.ListModel?.Title),
    ...asArray(decoded?.Pages || decoded?.Item?.Layouts).map((page) => page?.Title),
  ].map(safeString).filter(Boolean);
  for (const title of resourceTitles) {
    if (!visibleTitles.has(title.toLowerCase()) && !navigation.hidden.some((item) => item.title.toLowerCase() === title.toLowerCase())) {
      add(findings, "error", "NAVIGATION_RESOURCE_UNREACHABLE", "Generated resource exists but is unreachable from visible navigation or hidden anchors.", { resource: title });
    }
  }

  for (const [index, group] of asArray(decoded?.Groups || decoded?.AppGroups || decoded?.ListSet?.Groups).entries()) {
    const id = safeString(group?.ID || group?.GroupID || group?.ListGroupID);
    if (id && !API_ISSUED_ID_RE.test(id)) add(findings, "error", "APP_GROUP_ID_NOT_API_ISSUED", "App/navigation group ids must be API-issued long ids, not small local placeholders.", { path: `Groups[${index}]`, groupId: id });
  }

  if (options.servicePortal === "absent") {
    const portalKeys = ["PortalInfo", "AppPortalInfo", "AppPortalResourceInfo", "AppPortalPermInfo", "PortalResources", "PortalPerms"];
    for (const key of portalKeys) {
      if (decoded?.[key] !== undefined && decoded?.[key] !== null && !(Array.isArray(decoded[key]) && decoded[key].length === 0)) {
        add(findings, "error", "SERVICE_PORTAL_PAYLOAD_PRESENT_WHEN_EXCLUDED", "Service portal payloads must be absent when service portal is not in the approved app plan.", { key });
      }
    }
  }

  return findings;
}

function formPages(form) {
  const pages = asArray(form?.pageurls || form?.PageUrls || form?.pages);
  return pages.map((page) => ({ outer: page, formdef: isObject(page?.formdef) ? page.formdef : parseMaybeJson(page?.formdef) || page }));
}

function hasRealBoundControl(page) {
  let found = false;
  walk(page, (node) => {
    if (found || !isObject(node)) return;
    if (node.binding || node.fieldID || node.FieldName || node?.attrs?.field || node?.attrs?.["obj-f"]) found = true;
  });
  return found;
}

function hasControlType(page, types) {
  let found = false;
  walk(page, (node) => {
    if (!found && isObject(node) && types.has(safeString(node.type))) found = true;
  });
  return found;
}

export function validateApprovalRuntime(decoded) {
  const findings = [];
  for (const [formIndex, form] of asArray(decoded?.Forms).entries()) {
    const pages = formPages(form);
    const requestPages = pages.filter((page) => Number(page.outer?.type) === 1 || Number(page.formdef?.pagetype) === 1);
    const taskPages = pages.filter((page) => Number(page.outer?.type) === 2 || Number(page.formdef?.pagetype) === 2);
    if (!requestPages.length) add(findings, "error", "APPROVAL_REQUEST_PAGE_URL_MISSING", "Approval forms must include a request page URL.");
    if (!taskPages.length) add(findings, "error", "APPROVAL_TASK_PAGE_URL_MISSING", "Approval forms must include a task page URL.");
    for (const [pageIndex, page] of pages.entries()) {
      const url = safeString(page.outer?.pageUrl || page.outer?.pageurl || page.outer?.PageUrl || page.outer?.taskurl || page.outer?.TaskUrl);
      if (!url) add(findings, "error", "APPROVAL_PAGE_URL_MISSING", "Approval request/task pages must include resolvable pageUrl/pageurl/PageUrl metadata.", { formIndex, pageIndex });
      if (!hasRealBoundControl(page.formdef)) add(findings, "error", "APPROVAL_FORM_STATIC_ONLY", "Approval form pages must include real bound controls, not static text-only content.", { formIndex, pageIndex });
    }
    const allPages = { pages };
    if (!hasControlType(allPages, new Set(["workflowControlPanel", "workflow-control-panel"]))) add(findings, "error", "APPROVAL_WORKFLOW_PANEL_MISSING", "Approval forms must include workflow control panel controls.");
    if (!hasControlType(allPages, new Set(["workflowHistory", "workflow-history"]))) add(findings, "error", "APPROVAL_WORKFLOW_HISTORY_MISSING", "Approval forms must include workflow history controls.");
  }
  return findings;
}

function containsFunction(value, name) {
  let found = false;
  walk(value, (node) => {
    if (found) return;
    if (isObject(node) && (node.func === name || node.function === name || node.name === name || node.id === name)) found = true;
    else if (typeof node === "string" && node === name) found = true;
  });
  return found;
}

function containsOldVariableToken(value) {
  let found = false;
  walk(value, (node) => {
    if (found) return;
    if (typeof node === "string" && /^__variables_/.test(node)) found = true;
    else if (isObject(node) && /^__variables_/.test(safeString(node.id))) found = true;
  });
  return found;
}

export function validateRequesterContext(decoded, options = {}) {
  const findings = [];
  const expected = {
    Department: { valueType: "groupselect", attr: "DepartmentID" },
    Manager: { valueType: "user", attr: "LineManager" },
    Requester: { valueType: "user" },
  };
  let sawGetUserAttr = false;
  let sawQueryData = false;
  let sawValidWrapper = false;

  walk(decoded, (node, pointer) => {
    if (!isObject(node)) return;
    if (safeString(node.type).toLowerCase().includes("query")) sawQueryData = true;
    if (containsFunction(node, "getUserAttr")) sawGetUserAttr = true;
    if (containsOldVariableToken(node)) {
      add(findings, "error", "REQUESTER_CONTEXT_OLD_VARIABLE_TOKEN_SHAPE", "Requester-context Set variable actions must not use old __variables_ token ids.", { pointer });
    }
    const variableSettings = asArray(node.variablesetting || node.variableSetting || node.attrs?.variablesetting || node.properties?.variablesetting);
    if (variableSettings.length) {
      const okDepartment = variableSettings.some((row) => safeString(row.id || row.target?.id) === "Department" && safeString(row.name || row.target?.name).includes("Workflow Variables:Department") && safeString(row.valueType || row.target?.valueType) === expected.Department.valueType && containsFunction(row, "getUserAttr") && containsFunction(row, expected.Department.attr));
      const okManager = variableSettings.some((row) => safeString(row.id || row.target?.id) === "Manager" && safeString(row.name || row.target?.name).includes("Workflow Variables:Manager") && safeString(row.valueType || row.target?.valueType) === expected.Manager.valueType && containsFunction(row, "getUserAttr") && containsFunction(row, expected.Manager.attr));
      if (okDepartment && okManager) sawValidWrapper = true;
      if (sawGetUserAttr && (!okDepartment || !okManager)) {
        add(findings, "error", "REQUESTER_CONTEXT_WRAPPER_INVALID", "Correct getUserAttr function tokens are not enough; Set variable wrappers must target current workflow-variable ids and valueTypes.", { pointer });
      }
    }
  });

  if (options.nativeUserAttributesExpected && sawQueryData) {
    add(findings, "error", "REQUESTER_CONTEXT_QUERYDATA_NATIVE_ATTRIBUTES", "Requester Department/Manager should use getUserAttr native profile attributes, not Employee Profiles querydata, unless the plan explicitly requires HR master data.");
  }
  if (options.nativeUserAttributesExpected && !sawGetUserAttr) add(findings, "error", "REQUESTER_CONTEXT_GETUSERATTR_MISSING", "Requester-context autofill requires getUserAttr when native user attributes are expected.");
  if (options.nativeUserAttributesExpected && sawGetUserAttr && !sawValidWrapper) add(findings, "error", "REQUESTER_CONTEXT_VERIFIED_WRAPPER_MISSING", "Requester-context action must use verified Department/Manager workflow-variable token wrappers.");
  return findings;
}

export function validateProofBoundaries(report) {
  const findings = [];
  const proof = report?.proof || report?.proofs || report || {};
  const hasRuntime = Boolean(proof.runtimeDesignerProof || proof.runtimeProof || proof.designerProof || proof.manualRuntimeProof);
  if (proof.signingHttpStatus === 200 && !proof.signatureVerified) add(findings, "error", "SIGNING_HTTP_200_NOT_VERIFYSIGN_PROOF", "HTTP 200 from signing is not enough; verify signature shape and verifysign proof separately.");
  if (proof.signatureBytes !== undefined && proof.signatureBytes !== 32) add(findings, "error", "SIGNATURE_NOT_32_BYTES", "Package signing should produce a 32-byte signature where applicable.", { signatureBytes: proof.signatureBytes });
  if ((proof.upgrade_check_passed || proof.upgrade_applied) && !hasRuntime) {
    add(findings, "warning", "API_ACCEPTANCE_NOT_RUNTIME_PROOF", "API upgrade-check/apply acceptance is API proof only and does not prove runtime UI/designer correctness.");
  }
  return findings;
}

export function validateBusinessPolicyModel(model = {}) {
  const findings = [];
  const policies = asArray(model.policyCatalog || model.leaveTypes || model.policies);
  if (model.requiresPolicyCatalog && !policies.length) add(findings, "error", "POLICY_CATALOG_MISSING", "Business rule variants should be modeled as policy data, not hardcoded universal logic.");
  for (const [index, policy] of policies.entries()) {
    for (const key of ["Balance Limited", "Balance Block Mode", "Attachment Required After Days", "HR Review Required"]) {
      if (!(key in policy)) add(findings, "warning", "POLICY_FIELD_MISSING", "Policy catalog entries should include reusable rule-variant fields.", { index, policy: safeString(policy.Title || policy.Name), field: key });
    }
  }
  if (model.overBalanceSubmitBehavior === "hardcoded") add(findings, "error", "SUBMIT_VALIDATION_POLICY_HARDCODED", "Over-balance submit behavior should be represented as validation/action metadata driven by policy fields.");
  return findings;
}

export function validateRuntimeBindingLessons(decoded, options = {}) {
  const findings = [
    ...validateDashboardBindings(decoded, options.dashboard || {}),
    ...validateRuntimeCompleteness(decoded, options.plan || {}, options.runtime || {}),
    ...validateApprovalRuntime(decoded),
    ...validateRequesterContext(decoded, options.requesterContext || {}),
    ...validateProofBoundaries(options.proof || {}),
    ...validateBusinessPolicyModel(options.businessPolicy || {}),
  ];
  const errors = findings.filter((finding) => finding.severity === "error").length;
  return { status: errors ? "fail" : findings.length ? "pass_with_warnings" : "pass", findings };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  if (!file || process.argv.includes("--help")) {
    console.error("Usage: node scripts/validate-runtime-binding-lessons.mjs <decoded-app.json|app.yap|app.yapk>");
    process.exit(file ? 0 : 1);
  }
  const decoded = decodeInput(file);
  const report = validateRuntimeBindingLessons(decoded, {
    runtime: { servicePortal: process.env.YEEFLOW_EXPECT_SERVICE_PORTAL_ABSENT === "1" ? "absent" : undefined },
    requesterContext: { nativeUserAttributesExpected: process.env.YEEFLOW_EXPECT_NATIVE_REQUESTER_CONTEXT === "1" },
  });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}
