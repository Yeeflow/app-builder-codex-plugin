#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { validateWorkflowActionShapes } = require("./workflow-action-config-validator");
const { validatePackageWrapperIcon } = require("./scripts/lib/application-icon-validation.cjs");
const {
  isGeneratedValueControl,
  loadControlFieldSchemas,
  validateControlAgainstSchema,
  validateFieldAgainstSchema,
} = require("./yeeflow-control-field-schema-utils");
const { validateExpressionTokens } = require("./yeeflow-expression-utils");
const {
  validateWorkflowBranchConditionCoverage,
  validateWorkflowConditionEditorRows,
} = require("./scripts/lib/workflow-condition-editor-utils.cjs");
const {
  parseWorkflowExpressionButton,
  validateWorkflowAssigneeExpression,
} = require("./scripts/lib/workflow-assignee-expression-utils.cjs");
const { validateDataViewFixedFilters } = require("./scripts/lib/data-list-view-filter-utils.cjs");
const {
  PUBLIC_FORM_ALLOWED_FIELD_CONTROL_TYPES,
  PUBLIC_FORM_ALLOWED_VISUAL_CONTROL_TYPES,
  PUBLIC_FORM_DISALLOWED_CONTROL_TYPES,
  PUBLIC_FORM_DISALLOWED_FIELD_CONTROL_TYPES,
  validatePublicFormPageLayout,
} = require("./scripts/lib/public-form-template-utils.cjs");

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const SYSTEM_INT64_MAX = 9223372036854775807n;
const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;
const SECRET_KEY_RE = /(token|secret|password|credential|clientsecret|apikey|api_key|accesskey|authorization|bearer)/i;
const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const ROOT_STYLE_TOKEN_HEX = new Map([
  ["#0065ff", "--c--primary"],
  ["#e6f0ff", "--c--primary-light"],
  ["#00d1ff", "--c--secondary"],
  ["#15df42", "--c--success"],
  ["#f9c434", "--c--warning"],
  ["#f61515", "--c--danger"],
  ["#b3b7c0", "--c--neutral"],
  ["#ffffff", "--c--background"],
  ["#071638", "--c--text"],
  ["#e7e9eb", "--c--neutral-light-active"],
  ["#f7f8f9", "--c--neutral-light"],
  ["#f4f4f6", "--c--neutral-light-hover"],
]);
const KNOWN_SYSTEM_FIELDS = new Set([
  "ListDataID",
  "Title",
  "Created",
  "CreatedBy",
  "CreatedByName",
  "Modified",
  "ModifiedBy",
  "ModifiedByName",
  "Author",
  "Editor",
  "Status",
  "TenantID",
  "AppID",
]);
const APP_CREATION_SUPPORTED_LIST_TYPES = new Set([
  "input",
  "textarea",
  "richtext",
  "hyperlink",
  "input_number",
  "currency",
  "percent",
  "calculated-column",
  "rate",
  "switch",
  "checkbox",
  "radio",
  "select",
  "tag",
  "datepicker",
  "time",
  "identity-picker",
  "organization-picker",
  "cost-center-picker",
  "signer",
  "file-upload",
  "icon-upload",
  "lookup",
  "metadata",
  "mutiple-metadata",
  "location-picker",
  "flowstatus",
  "autonumber",
  "list",
]);
const APP_CREATION_IDENTIFIER_MAX_LENGTH = 255;
const APP_CREATION_INTERNAL_NAME_RE = /^[A-Za-z0-9_]+$/;
const APP_CREATION_PROCESS_KEY_RE = /^[A-Za-z0-9_]+$/;
const YAP_WRAPPER_REQUIRED_KEYS = ["Title", "Description", "IconUrl", "IsListSet", "Resource"];
const CUSTOM_LIST_MODEL_TYPES = new Set([1, 16, 32, 64, 128, 1024]);
const APP_RESOURCE_PERMISSION_RULES = {
  approvalForms: { mask: 1 | 16 | 32, label: "Submit=1, ReadTasks=16, ProcessTasks=32" },
  dataLists: { mask: 1 | 2 | 4 | 8, label: "Submit=1, Edit=2, Delete=4, Read=8" },
  documentLibraries: { mask: 1 | 2 | 4 | 8, label: "Submit=1, Edit=2, Delete=4, Read=8" },
  aiAgents: { mask: 1, label: "Submit=1" },
};
const APP_RESOURCE_PERMISSION_CONFLICT_KEYS = {
  formReports: { schemaAllowed: new Set([0, 8]), rulesAllowed: new Set([0, 1]), label: "schema says Read=8; rules document says Submit=1" },
  dataReports: { schemaAllowed: new Set([0, 8]), rulesAllowed: new Set([0, 1]), label: "schema says Read=8; rules document says Submit=1" },
};
const CANONICAL_YAP_DATA_LIST_FIELD_TYPES = new Set(["Text", "Bit", "Decimal", "Datetime"]);
const COMMON_INVALID_YAP_FIELD_TYPES = new Set(["Int", "Date", "DateTime", "Boolean", "Number", "Bool"]);
const YAP_FIELD_INDEX_RANGE_BY_FIELD_TYPE = new Map([
  ["Text", { min: 1, max: 300 }],
  ["Bit", { min: 1, max: 50 }],
  ["Decimal", { min: 1, max: 200 }],
  ["Datetime", { min: 1, max: 200 }],
]);
const CANONICAL_FIELDTYPE_BY_CONTROL_TYPE = new Map([
  ["input_number", "Decimal"],
  ["currency", "Decimal"],
  ["percent", "Decimal"],
  ["switch", "Bit"],
  ["datepicker", "Datetime"],
]);
const APPROVAL_APPROVEWAYS = new Set(["allapprove", "anyapprove", "anyprocess", "anyreject", "custompercentage", "anyone"]);
const ASSIGNMENT_PLACEHOLDER_RE = /(?:^|[\s_<{\[])(?:todo|tbd|placeholder|replace[_\s-]?me|sample|dummy|mock|fake|unknown|unresolved|required)(?:[\s_>}\]]|$)/i;
const ASSIGNMENT_REFERENCE_PLACEHOLDER_RE = /^<[^>]+>$|^\{\{[^}]+\}\}$|^__.*__$|^(?:todo|tbd|placeholder|replace[_-]?me|sample|dummy|mock|fake|unknown|unresolved|required)$/i;
const ASSIGNMENT_LOCAL_ID_RE = /^(?:local|temp|tmp|mock|placeholder|fallback|generated|test|demo|sample|fake)[-_]/i;
const JOB_POSITION_METHODS = new Set(["position", "positionorg", "positionorgexpr", "positionloc", "positionlocexpr"]);
const JOB_POSITION_PROOF_SOURCES = new Set(["discovered-existing-job-position", "user-selected-existing-job-position", "admin-created-job-position", "explicitly-confirmed-existing-job-position"]);
const JOB_POSITION_PROOF_STATUSES = new Set(["discovered", "confirmed", "created-after-confirmation", "user-selected"]);
const JOB_POSITION_OAUTH_AVAILABLE_STATUSES = new Set(["authenticated", "refreshed-authenticated", "valid", "available", "oauth-available"]);
const JOB_POSITION_LOOKUP_PROVEN_STATUSES = new Set(["queried", "found", "not-found", "not-found-before-create", "matched-existing", "created-readback-confirmed"]);
const MANAGER_ASSIGNMENT_TYPES = new Set(["line-manager", "department-manager", "location-manager"]);
const CUSTOM_FORM_DISPLAY_USAGES = ["add", "edit", "view"];
const PIVOT_TABLE_SOURCE_TYPES = new Map([[1, "Data list"], [16, "Document library"], [32, "Form report"], [64, "Data report"]]);
const PIVOT_TABLE_DATE_GROUPINGS = new Set(["DAY", "MONTH", "QUARTER", "YEAR"]);
const PIVOT_TABLE_COUNT_AGGREGATIONS = new Set(["COUNT", "COUNT_DISTINCT"]);
const PIVOT_TABLE_NUMERIC_AGGREGATIONS = new Set(["SUM", "AVG", "MIN", "MAX"]);
const PIVOT_TABLE_NUMERIC_FIELD_TYPES = new Set(["input_number", "currency", "percent", "rate", "calculated-column", "Decimal", "Int", "Bigint", "Number"]);
const PIVOT_TABLE_DATE_FIELD_TYPES = new Set(["datepicker", "time", "Datetime", "DateTime", "Date", "Time"]);
const DYNAMIC_DISPLAY_CONTROL_TYPES = new Set(["dynamic-field", "dynamic-user", "dynamic-image", "dynamic-file"]);
const DYNAMIC_USER_FIELD_TYPES = new Set(["identity-picker", "signer", "user", "users", "person"]);
const DYNAMIC_IMAGE_FIELD_TYPES = new Set(["icon-upload", "image", "picture"]);
const DYNAMIC_FILE_FIELD_TYPES = new Set(["file-upload", "file-upload-merge", "attachment", "file"]);
const DASHBOARD_ITEM_CONTEXT_CONTROL_TYPES = new Set(["collection", "kanban", "timeline-v", "timeline-h"]);
const DASHBOARD_TIMELINE_CONTROL_TYPES = new Set(["timeline-v", "timeline-h"]);
const CUSTOM_FORM_OPEN_MODE_LABELS = {
  modal: "Pop-up window",
  slide: "Slide in",
  target: "Current page",
  new: "New page",
  page: "Full page",
  fullpage: "Full page",
  fullPage: "Full page",
};
const CUSTOM_FORM_SIZE_LABELS = new Map([[0, "Medium"], [1, "Small"], [2, "Large"], [3, "Full screen"]]);
const PUBLIC_FORM_ALLOWED_FIELD_TYPES = PUBLIC_FORM_ALLOWED_FIELD_CONTROL_TYPES;
const PUBLIC_FORM_DISALLOWED_FIELD_TYPES = new Set([
  ...PUBLIC_FORM_DISALLOWED_FIELD_CONTROL_TYPES,
  "calculated-column",
  "autonumber",
]);
const PUBLIC_FORM_DISALLOWED_SYSTEM_FIELDS = new Set([
  "ListDataID",
  "Id",
  "ID",
  "Created",
  "CreatedBy",
  "CreatedByName",
  "Modified",
  "ModifiedBy",
  "ModifiedByName",
]);
const PUBLIC_FORM_KNOWN_CONTROL_TYPES = PUBLIC_FORM_ALLOWED_VISUAL_CONTROL_TYPES;
const ADVANCED_CONTROL_TYPES = new Set(["aktabs", "toggle", "timer", "icon_list", "line", "alert", "progress", "gap", "progress-circle", "steps-bar", "list-qrcode", "qrcode", "barcode", "embed", "document-embed"]);
const ADVANCED_CONTAINER_CHILD_TYPES = new Map([["aktabs", "ak-tabs-tab"], ["toggle", "toggle-panel"]]);
const ADVANCED_NUMERIC_FIELD_TYPES = new Set(["input_number", "currency", "percent", "rate", "calculated-column", "Decimal", "Int", "Bigint", "Number"]);
const ADVANCED_SINGLE_SELECT_FIELD_TYPES = new Set(["radio", "select", "flowstatus", "status"]);
const ADVANCED_FILE_FIELD_TYPES = new Set(["file-upload", "file-upload-merge", "icon-upload", "file", "image"]);
const ADVANCED_BARCODE_TYPES = new Set(["CODE128", "CODE128A", "CODE128B", "CODE128C", "EAN13", "EAN8", "UPC", "CODE39", "ITF14", "MSI", "pharmacode", "codabar"]);

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node validate-yap-package.js <app.yap|decoded-data.json> --mode <compatibility|generator> [--stage <draft|final>]",
    "",
    "Examples:",
    "  node validate-yap-package.js \"./NHIC Innovation Ecosystem Platform.yap\" --mode compatibility",
    "  node validate-yap-package.js ./generated-app.decoded.json --mode generator --stage draft",
    "  node validate-yap-package.js ./generated-app.decoded.json --mode generator --stage final",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, mode: "generator", stage: "final" };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--mode") args.mode = argv[++i];
    else if (arg === "--stage") args.stage = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input || !["compatibility", "generator"].includes(args.mode) || !["draft", "final"].includes(args.stage)) usage();
  return args;
}

function quoteLargeIntegers(jsonText, largeNumbers) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;

  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else {
          out += token;
        }
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJsonPreservingLargeInts(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function attrRuntimeValue(value) {
  return Array.isArray(value) ? value[1] : value;
}

function isNumericStringConfig(value) {
  const actual = attrRuntimeValue(value);
  return typeof actual === "string" && /^\d+(?:\.\d+)?$/.test(actual.trim());
}

function displayLabelDisabled(value) {
  if (value === false) return true;
  return Array.isArray(value) && value[1] === false;
}

function displayLabelEnabled(value) {
  if (value === true) return true;
  return Array.isArray(value) && value[1] === true;
}

function pageUrlId(page) {
  return safeString(page && (page.id || page.ID || page.pageid || page.pageId || page.key));
}

function isWorkflowTaskNodeType(type) {
  return type === "MultiAssignmentTask" || type === "CandidateTask";
}

function taskNodeLabel(type) {
  return type === "CandidateTask" ? "Claim Task" : "Assignment Task";
}

function isDefaultWorkflowActionName(value) {
  const text = safeString(value).trim();
  if (!text) return true;
  return /^(assignment\s*task|candidate\s*task|claim\s*task|content\s*list|inclusive\s*gateway|gateway|task|workflow\s*task(?:\s*\d+)?|sequence\s*flow(?:[_\s-]*\d+)?)$/i.test(text);
}

function isDefaultWorkflowConnectorDescription(value) {
  const text = safeString(value).trim();
  if (!text) return true;
  return /^(sequence\s*flow(?:[_\s-]*\d+)?|connector|transition|line)$/i.test(text);
}

function nodeDisplayName(shape) {
  return safeString(shape && shape.properties && shape.properties.name) || safeString(shapeId(shape));
}

function collectTaskUrlAliases(props = {}) {
  return ["taskurl", "taskUrl", "TaskUrl"].map((key) => ({ key, value: safeString(props[key]) }));
}

function collectPageUrlAliases(page = {}) {
  return ["pageUrl", "pageurl", "PageUrl"].map((key) => ({ key, value: safeString(page[key]) }));
}

function primaryTaskUrl(props = {}) {
  for (const { value } of collectTaskUrlAliases(props)) {
    if (value) return value;
  }
  return "";
}

function assignmentExpressionData(value) {
  const parsed = parseWorkflowExpressionButton(value);
  return parsed.ok ? parsed.data : null;
}

function assignmentBlob(assignment) {
  return `${safeString(assignment && assignment.title)} ${safeString(assignment && assignment.value)} ${JSON.stringify(assignment || {})}`;
}

function classifyManagerAssignment(assignment) {
  const text = assignmentBlob(assignment);
  const expression = assignmentExpressionData(assignment && assignment.value) || {};
  const type = safeString(expression.type).toLowerCase();
  const prop = safeString(expression.prop || expression.param && expression.param.prop).toLowerCase();
  if (/line\s*manager|linemanager|LineManager/i.test(text) || prop === "linemanager") return "line-manager";
  if (/department\s*:\s*manager|department\s*manager|organization.*manager|OrganizationID.*Manager/i.test(text) || (type.includes("department") && prop === "manager")) return "department-manager";
  if (/location\s*:\s*manager|location\s*manager|LocationID.*Manager/i.test(text) || (type.includes("location") && prop === "manager")) return "location-manager";
  return "";
}

function assignmentReferenceValue(assignment) {
  if (!isObject(assignment)) return "";
  if (assignment.type === "position" || JOB_POSITION_METHODS.has(safeString(assignment.method))) return safeString(assignment.position);
  return safeString(assignment.value);
}

function hasAssignmentPlaceholder(value) {
  const text = safeString(value).trim();
  if (!text) return false;
  return ASSIGNMENT_REFERENCE_PLACEHOLDER_RE.test(text) || ASSIGNMENT_PLACEHOLDER_RE.test(text);
}

function validateAssignmentReferenceNotInvented(assignment, report, context, reference, kind) {
  if (!reference) return;
  if (hasAssignmentPlaceholder(reference)) {
    issue(report, generatorFinalSeverity(report), "TASK_ASSIGNEE_PLACEHOLDER", "Workflow assignment assignee contains placeholder or unresolved assignee text.", { ...context, assigneeKind: kind });
    return;
  }
  if (ASSIGNMENT_LOCAL_ID_RE.test(reference)) {
    issue(report, generatorFinalSeverity(report), "TASK_ASSIGNEE_INVENTED_REFERENCE", "Workflow assignment assignee uses a local/mock/generated reference instead of discovered or explicitly confirmed Yeeflow org data.", { ...context, assigneeKind: kind });
  }
}

function validateJobPositionProof(assignment, report, context) {
  const source = safeString(assignment.source || assignment.assigneeSource || assignment.jobPositionSource);
  const proofStatus = safeString(assignment.proofStatus || assignment.jobPositionProofStatus);
  const requiredName = safeString(assignment.requiredJobPositionName || assignment.jobPositionName);
  const creationRequired = assignment.creationRequired === true || /create|missing|unresolved/i.test(source) || /unresolved|blocked/i.test(proofStatus);
  const creationConfirmed = assignment.creationConfirmed === true || assignment.adminCreationConfirmed === true;
  const adminConfirmed = assignment.systemAdminConfirmed === true || assignment.adminPermissionConfirmed === true;
  const apiAssisted = source === "discovered-existing-job-position" || source === "admin-created-job-position";
  const oauthStatus = safeString(assignment.oauthStatus || assignment.oauthProofStatus || assignment.oauthReadinessStatus);
  const oauthRefreshAttempted = assignment.oauthRefreshAttempted === true || assignment.oauthRefreshed === true || assignment.oauthRefreshStatus === "attempted" || assignment.oauthRefreshStatus === "success";
  const oauthRefreshStatus = safeString(assignment.oauthRefreshStatus);
  const lookupStatus = safeString(assignment.jobPositionLookupStatus || assignment.positionLookupStatus || assignment.apiLookupStatus);
  const lookupAttempted = assignment.jobPositionLookupAttempted === true || assignment.positionLookupAttempted === true || assignment.apiLookupAttempted === true || JOB_POSITION_LOOKUP_PROVEN_STATUSES.has(lookupStatus);
  const createAttemptCount = Number(assignment.jobPositionCreateAttemptCount || assignment.positionCreateAttemptCount || assignment.createAttemptCount || 0);
  const createResponseIdRecorded = assignment.createResponseIdRecorded === true || assignment.positionCreateResponseIdRecorded === true || assignment.jobPositionCreateResponseIdRecorded === true;
  const duplicateScanRecorded = assignment.duplicateNameScanRecorded === true || assignment.duplicateJobPositionScanRecorded === true;

  if (!requiredName || hasAssignmentPlaceholder(requiredName)) {
    issue(report, generatorFinalSeverity(report), "TASK_JOB_POSITION_NAME_UNCONFIRMED", "Job-position assignment must include a safe required job position name from discovery or explicit user selection; placeholders are not allowed.", context);
  }
  if (!JOB_POSITION_PROOF_SOURCES.has(source) || !JOB_POSITION_PROOF_STATUSES.has(proofStatus)) {
    issue(report, generatorFinalSeverity(report), "TASK_JOB_POSITION_PROOF_MISSING", "Job-position assignment must be backed by a discovered existing, user-selected existing, or admin-created-after-confirmation job position proof status.", { ...context, source: source || null, proofStatus: proofStatus || null });
  }
  if (/admin-created/.test(source) && (!creationConfirmed || !adminConfirmed)) {
    issue(report, generatorFinalSeverity(report), "TASK_JOB_POSITION_WRITE_NOT_CONFIRMED", "Job-position creation/update is a write operation and must be explicitly confirmed by a system admin before generation can use the resulting position.", { ...context, source, proofStatus });
  }
  if (creationRequired && (!creationConfirmed || !adminConfirmed)) {
    issue(report, generatorFinalSeverity(report), "TASK_JOB_POSITION_MISSING_BLOCKED", "Missing job positions block generation unless a system admin explicitly confirms creation/update and the resulting job position is used.", { ...context, source: source || null, proofStatus: proofStatus || null });
  }
  if (apiAssisted) {
    if (!JOB_POSITION_OAUTH_AVAILABLE_STATUSES.has(oauthStatus)) {
      issue(report, generatorFinalSeverity(report), "TASK_JOB_POSITION_OAUTH_PROOF_MISSING", "API-assisted Job Position assignment must record authenticated OAuth proof before using discovered or created Job Position IDs.", { ...context, source, oauthStatus: oauthStatus || null });
    }
    if (/expired/i.test(oauthStatus) && !oauthRefreshAttempted) {
      issue(report, generatorFinalSeverity(report), "TASK_JOB_POSITION_OAUTH_REFRESH_REQUIRED", "Expired OAuth must be refreshed before declaring Job Position lookup unavailable or falling back to placeholders.", { ...context, source, oauthStatus, oauthRefreshStatus: oauthRefreshStatus || null });
    }
    if (!lookupAttempted) {
      issue(report, generatorFinalSeverity(report), "TASK_JOB_POSITION_LOOKUP_NOT_PROVEN", "Job Position assignment must prove a read-only positions lookup was attempted before using API-assisted discovered/admin-created proof.", { ...context, source, lookupStatus: lookupStatus || null });
    }
  }
  if (source === "admin-created-job-position") {
    if (createAttemptCount > 1) {
      issue(report, generatorFinalSeverity(report), "TASK_JOB_POSITION_CREATE_RETRY_UNSAFE", "Job Position creation must not be retried after an accepted create response only because list read-back is eventually consistent.", { ...context, createAttemptCount });
    }
    if (!createResponseIdRecorded) {
      issue(report, generatorFinalSeverity(report), "TASK_JOB_POSITION_CREATE_RESPONSE_ID_MISSING", "Admin-created Job Position proof must record the numeric ID returned by POST /positions instead of relying only on immediate list read-back.", { ...context });
    }
    if (!duplicateScanRecorded) {
      issue(report, generatorFinalSeverity(report), "TASK_JOB_POSITION_DUPLICATE_SCAN_MISSING", "Admin-created Job Position proof must include a duplicate-name scan before assigning users or using the position in workflow routing.", { ...context });
    }
  }
}

function validateWorkflowTaskAssignees(shape, form, report, index, nodeLabel) {
  const props = shape.properties || {};
  const assignments = asArray(props.usertaskassignment);
  const node = nodeDisplayName(shape);
  if (!assignments.length) {
    issue(report, generatorFinalSeverity(report), "TASK_USERTASKASSIGNMENT_EMPTY", `${nodeLabel} nodes must include non-empty export-shaped usertaskassignment metadata.`, { form: form.Name, node });
    return;
  }
  assignments.forEach((assignment, assignmentIndex) => {
    const context = { form: form.Name, node, assignmentIndex, path: `Data.Forms[].DefResource.childshapes[${index}].properties.usertaskassignment[${assignmentIndex}]` };
    if (!isObject(assignment)) {
      issue(report, generatorFinalSeverity(report), "TASK_ASSIGNEE_NOT_OBJECT", "Workflow assignment assignee entries must be objects.", context);
      return;
    }
    const type = safeString(assignment.type);
    const method = safeString(assignment.method);
    const ref = assignmentReferenceValue(assignment);
    if (!type || !method) {
      issue(report, generatorFinalSeverity(report), "TASK_ASSIGNEE_TYPE_METHOD_MISSING", "Workflow assignment assignee entries must include export-shaped type and method.", { ...context, type: type || null, method: method || null });
    }
    if (!ref) {
      issue(report, generatorFinalSeverity(report), "TASK_ASSIGNEE_EMPTY", "Workflow assignment assignee entry must include a non-empty value or position reference.", { ...context, type: type || null, method: method || null });
    } else if (!(type === "user" && method === "expression")) {
      validateAssignmentReferenceNotInvented(assignment, report, context, ref, type === "position" ? "job-position" : type || "assignee");
    }
    if (type === "user" && method === "direct" && assignment.explicitlyRequested !== true && assignment.userAssignmentExplicitlyRequested !== true) {
      issue(report, generatorFinalSeverity(report), "TASK_DIRECT_USER_REQUIRES_EXPLICIT_REQUEST", "Hardcoded user assignees are tenant-sensitive and require an explicit app-plan/user request.", context);
    }
    if (type === "user" && method === "expression") {
      const managerType = classifyManagerAssignment(assignment);
      const expression = assignmentExpressionData(assignment.value);
      const expressionValidation = validateWorkflowAssigneeExpression(assignment);
      for (const finding of expressionValidation.findings) {
        issue(report, generatorFinalSeverity(report), finding.code, finding.message, {
          ...context,
          path: `${context.path}.${finding.path}`,
          actual: finding.actual ?? null,
        });
      }
      if (managerType) {
        if (!MANAGER_ASSIGNMENT_TYPES.has(managerType)) {
          issue(report, generatorFinalSeverity(report), "TASK_MANAGER_EXPRESSION_UNSUPPORTED", "Manager-based assignment must use a supported expression-editor manager pattern.", { ...context, managerType });
        }
      }
      if (!expression && expressionValidation.findings.length === 0 && !/{{[^}]+}}/.test(safeString(assignment.value))) {
        issue(report, generatorFinalSeverity(report), "TASK_MANAGER_EXPRESSION_MALFORMED", "Expression-editor user assignee must preserve a supported expression-button value or a validated expression token.", context);
      }
    }
    if (type === "position" || JOB_POSITION_METHODS.has(method)) validateJobPositionProof(assignment, report, context);
  });
}

function zeroPadding(padding) {
  const value = Array.isArray(padding) ? padding[1] : padding;
  if (!isObject(value)) return false;
  return ["top", "right", "bottom", "left"].every((side) => value[side] === "--sp--s0" || value[side] === 0 || value[side] === "0" || value[side] === "");
}

function hasSafeHorizontalPaddingValue(value) {
  if (value === undefined || value === null || value === "") return false;
  if (typeof value === "number") return value >= 16;
  if (typeof value === "string") {
    if (/--sp--s([3-9]|[1-9]\d+)/.test(value)) return true;
    const numeric = Number(value.trim().replace(/px$/, ""));
    return Number.isFinite(numeric) && numeric >= 16;
  }
  if (Array.isArray(value)) return value.some(hasSafeHorizontalPaddingValue);
  if (!isObject(value)) return false;
  return ["left", "right", "x", "horizontal"].some((key) => hasSafeHorizontalPaddingValue(value[key]));
}

function controlPaddingCandidates(control) {
  const attrs = control && control.attrs || {};
  const common = attrs.common || {};
  return [
    attrs.padding,
    attrs.container && attrs.container.padding,
    attrs.style && attrs.style.padding,
    common.padding,
    common.positioning && common.positioning.padding,
    control && control.padding,
  ];
}

function hasSafeHorizontalPaddingNearRoot(root) {
  if (!isObject(root)) return false;
  if (controlPaddingCandidates(root).some(hasSafeHorizontalPaddingValue)) return true;
  let found = false;
  asArray(root.children).forEach((child, index) => {
    walkControls(child, (control, pointer) => {
      if (found) return;
      const depth = pointer.split(".children[").length - 1 + pointer.split(".columns[").length - 1;
      if (depth > 2) return;
      if (controlPaddingCandidates(control).some(hasSafeHorizontalPaddingValue)) found = true;
    }, `$.children[${index}]`);
  });
  return found;
}

function displayColumnFieldName(column) {
  if (!isObject(column)) return safeString(column);
  for (const candidate of [column.Field, column.field, column.FieldName, column.fieldName, column.Name, column.name, column.SortName, column.id, column.FieldID, column.fieldID, column.value]) {
    const value = safeString(candidate);
    if (value) return value;
  }
  return "";
}

function findControlByLabel(root, label) {
  let found = null;
  walkControls(root, (control) => {
    if (!found && control && control.nv_label === label) found = control;
  });
  return found;
}

function controlContains(parent, child) {
  if (!parent || !child) return false;
  let found = false;
  walkControls(parent, (control) => {
    if (control === child) found = true;
  });
  return found;
}

function uiStandardWarning(report, code, message, details) {
  issue(report, "warning", code, message, details);
}

function uiStandardContainerIssue(report, context, code, message, details = {}) {
  const hard = context && context.surface === "approval form page" && isGeneratedFinal(report);
  issue(report, hard ? "error" : "warning", code, message, { ...context, ...details });
}

function issue(report, level, code, message, details = {}) {
  const entry = { code, message, ...redactDetails(details) };
  if (level === "error") report.errors.push(entry);
  else if (level === "dependency") report.dependencies.push(entry);
  else report.warnings.push(entry);
}

function generatorFinalSeverity(report, fallback = "warning") {
  return report.mode === "generator" && report.stage === "final" ? "error" : fallback;
}

function validateGeneratedIntegerId(value, report, context = {}) {
  if (value === undefined || value === null || value === "") return;
  const severity = generatorFinalSeverity(report);
  const rawLargeIntegerToken = typeof value === "string" && report._largeNumbers && report._largeNumbers.has(value);
  if (isLongNumericString(value)) return;
  if (rawLargeIntegerToken) return;
  if (!Number.isInteger(value)) {
    issue(report, severity, "INVALID_ID_TYPE", "Generated YAP ID values must be JSON integers.", {
      ...context,
      actualType: Array.isArray(value) ? "array" : value === null ? "null" : typeof value,
    });
  } else if (!Number.isSafeInteger(value)) {
    issue(report, severity, "UNSAFE_INTEGER_ID", "Generated YAP integer IDs must be within Number.MAX_SAFE_INTEGER to avoid JSON rounding duplicates.", {
      ...context,
      value,
    });
  } else if (report.mode === "generator" && report.stage === "final" && isLikelyLocalGeneratedId(value)) {
    issue(report, severity, "ID_SOURCE_NOT_API", "Import-proof generated YAP IDs should come from the Yeeflow generate-unique-ids API, not the local fallback ID range.", {
      ...context,
      value,
    });
  }
}

function isLikelyLocalGeneratedId(value) {
  return /^7601000000000\d+$/.test(safeString(value));
}

function isGeneratedFinal(report) {
  return report.mode === "generator" && report.stage === "final";
}

function isLongNumericString(value) {
  return typeof value === "string" && /^\d{16,}$/.test(value);
}

function validateExportLocalId(value, report, context = {}) {
  if (!isGeneratedFinal(report) || value === undefined || value === null || value === "") return;
  if (!isLongNumericString(value)) {
    issue(report, "error", "YAP_LOCAL_ID_SHAPE_INVALID", "Generated-final YAP local app/list/field/layout/form/workflow/sample IDs must use export-style long numeric-string IDs, not short synthetic IDs or JSON numbers.", {
      ...context,
      actualType: Array.isArray(value) ? "array" : value === null ? "null" : typeof value,
      shape: typeof value === "string" && /^\d+$/.test(value) ? "short-numeric-string" : typeof value,
    });
  }
}

function validateExportStringId(value, report, code, message, context = {}) {
  if (!isGeneratedFinal(report) || value === undefined || value === null || value === "") return;
  if (typeof value !== "string") {
    issue(report, "error", code, message, {
      ...context,
      actualType: Array.isArray(value) ? "array" : typeof value,
    });
  }
}

function validateUniqueGeneratedId(value, seen, report, code, message, context = {}) {
  if (value === undefined || value === null || value === "") return;
  const key = safeString(value);
  const previous = seen.get(key);
  if (previous) {
    issue(report, generatorFinalSeverity(report), code, message, {
      ...context,
      value: key,
      previousPath: previous.path,
      previousList: previous.list,
      previousName: previous.name,
    });
  } else {
    seen.set(key, context);
  }
}

function isSchemaDirectYap(report) {
  return report && report.wrapper && report.wrapper.inputType === "wrapped-yap-schema-direct";
}

function validateAppCreationFieldRules(field, report, context = {}) {
  const severity = generatorFinalSeverity(report);
  const fieldName = safeString(field && field.FieldName);
  const internalName = safeString(field && field.InternalName);
  const displayName = safeString(field && field.DisplayName);
  const type = safeString(field && field.Type).toLowerCase();
  const pathPrefix = context.path || "field";
  const list = context.list || null;

  for (const [key, value] of [["DisplayName", displayName], ["FieldName", fieldName], ["InternalName", internalName]]) {
    if (value && value.length > APP_CREATION_IDENTIFIER_MAX_LENGTH) {
      issue(report, severity, `FIELD_${key.toUpperCase()}_TOO_LONG`, `${key} must not exceed 255 characters.`, { list, path: `${pathPrefix}.${key}`, length: value.length });
    }
  }

  if (internalName && !APP_CREATION_INTERNAL_NAME_RE.test(internalName)) {
    issue(report, severity, "FIELD_INTERNAL_NAME_INVALID_CHARS", "InternalName may contain only letters, numbers, and underscores.", { list, path: `${pathPrefix}.InternalName`, internalName });
  }

  if (type && !APP_CREATION_SUPPORTED_LIST_TYPES.has(type)) {
    issue(report, "warning", "LIST_FIELD_TYPE_UNSUPPORTED", "List field Type is not in the product-team supported Type list.", { list, path: `${pathPrefix}.Type`, fieldName, type });
  }

  if (!fieldName || KNOWN_SYSTEM_FIELDS.has(fieldName)) return;
  const fieldIndex = Number(field && field.FieldIndex);
  if (!Number.isInteger(fieldIndex) || fieldIndex <= 0) return;
  const suffixMatch = fieldName.match(/(\d+)$/);
  if (!suffixMatch) {
    issue(report, severity, "FIELD_NAME_NUMERIC_SUFFIX_MISSING", "FieldName numeric suffix must match FieldIndex; generated non-system fields must end with their FieldIndex value.", { list, path: `${pathPrefix}.FieldName`, fieldName, fieldIndex });
    return;
  }
  const suffix = Number(suffixMatch[1]);
  if (suffix !== fieldIndex) {
    issue(report, severity, "FIELD_NAME_FIELDINDEX_MISMATCH", "FieldName numeric suffix must match FieldIndex.", { list, path: `${pathPrefix}.FieldName`, fieldName, fieldIndex, suffix });
  }
}

function validateProcessKey(value, report, context = {}) {
  const key = safeString(value);
  if (!key) return;
  const severity = generatorFinalSeverity(report);
  if (key.length > APP_CREATION_IDENTIFIER_MAX_LENGTH) {
    issue(report, severity, "PROCESS_KEY_TOO_LONG", "Process keys must not exceed 255 characters.", { path: context.path, form: context.form, keyLength: key.length });
  }
  if (!APP_CREATION_PROCESS_KEY_RE.test(key)) {
    issue(report, severity, "PROCESS_KEY_INVALID_CHARS", "Process keys may contain only letters, numbers, and underscores.", { path: context.path, form: context.form, key });
  }
}

function validateNoRule(form, report, context = {}) {
  const severity = generatorFinalSeverity(report);
  const formName = context.form || safeString(form && form.Name);
  const key = context.key || safeString(form && form.Key);
  const pathPrefix = context.path || "Data.Forms[]";
  if (!Object.prototype.hasOwnProperty.call(form || {}, "NoRule")) {
    issue(report, severity, "NORULE_MISSING", "Approval form NoRule must be an object with Prefix, StartIndex, CustomLength, and AutoIncrement.", { form: formName, key, path: `${pathPrefix}.NoRule` });
    return;
  }
  const noRule = form.NoRule;
  if (!isObject(noRule)) {
    issue(report, severity, "NORULE_INVALID_OBJECT", "NoRule must be an object with Prefix, StartIndex, CustomLength, and AutoIncrement.", { form: formName, key, path: `${pathPrefix}.NoRule`, actualType: Array.isArray(noRule) ? "array" : noRule === null ? "null" : typeof noRule });
    return;
  }
  const prefix = safeString(noRule.Prefix);
  if (!prefix) {
    issue(report, severity, "NORULE_PREFIX_MISSING", "NoRule.Prefix is required.", { form: formName, key, path: `${pathPrefix}.NoRule.Prefix` });
  } else if (!prefix.includes("{index}")) {
    issue(report, severity, "NORULE_PREFIX_INDEX_MISSING", "NoRule.Prefix must include {index}.", { form: formName, key, path: `${pathPrefix}.NoRule.Prefix`, prefix });
  }
  for (const [prop, minimum] of [["StartIndex", 1], ["CustomLength", 1], ["AutoIncrement", 0]]) {
    const value = noRule[prop];
    if (!Number.isInteger(value) || value < minimum) {
      issue(report, severity, `NORULE_${prop.toUpperCase()}_INVALID`, `NoRule.${prop} must be an integer greater than or equal to ${minimum}.`, { form: formName, key, path: `${pathPrefix}.NoRule.${prop}`, value });
    }
  }
  for (const prop of Object.keys(noRule)) {
    if (!["Prefix", "StartIndex", "CustomLength", "AutoIncrement"].includes(prop)) {
      issue(report, "warning", "NORULE_UNKNOWN_FIELD", "NoRule contains an unknown optional field; confirm import behavior before relying on it.", { form: formName, key, path: `${pathPrefix}.NoRule.${prop}` });
    }
  }
}

function redactDetails(value) {
  if (Array.isArray(value)) return value.map(redactDetails);
  if (!isObject(value)) return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    out[key] = SECRET_KEY_RE.test(key) ? "__REDACTED__" : redactDetails(child);
  }
  return out;
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function walkControls(control, visitor, pointer = "$") {
  if (!isObject(control)) return;
  visitor(control, pointer);
  for (const key of ["children", "columns"]) {
    if (Array.isArray(control[key])) control[key].forEach((child, index) => walkControls(child, visitor, `${pointer}.${key}[${index}]`));
  }
}

function tryParseJson(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isMalformedJsonString(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed || !/^[{[]/.test(trimmed)) return false;
  try {
    JSON.parse(trimmed);
    return false;
  } catch {
    return true;
  }
}

function decodeHtmlEntities(value) {
  return String(value)
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function decodeInput(inputPath, report) {
  const raw = fs.readFileSync(inputPath, "utf8");
  let parsed;
  try {
    parsed = parseJsonPreservingLargeInts(raw, report._largeNumbers);
  } catch (error) {
    issue(report, "error", "INPUT_JSON_INVALID", "Input is not valid JSON.", { error: error.message });
    return null;
  }

  if (parsed && typeof parsed.Resource === "string") {
    const wrapper = parsed;
    report.wrapper = {
      inputType: "wrapped-yap",
      wrapperJsonValid: true,
      resourcePrefixValid: wrapper.Resource.startsWith(GZIP_PREFIX),
    };
    validateYapWrapperSchema(wrapper, report);
    if (!wrapper.Resource.startsWith(GZIP_PREFIX)) {
      issue(report, "error", "RESOURCE_PREFIX_MISSING", `Wrapped .yap Resource must start with ${GZIP_PREFIX}.`);
      return null;
    }
    let resourceText;
    try {
      const compressed = Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64");
      resourceText = zlib.gunzipSync(compressed).toString("utf8");
    } catch (error) {
      issue(report, "error", "RESOURCE_DECODE_FAILED", "Resource base64/gzip decode failed.", { error: error.message });
      return null;
    }
    let resource;
    try {
      resource = parseJsonPreservingLargeInts(resourceText, report._largeNumbers);
    } catch (error) {
      issue(report, "error", "RESOURCE_JSON_INVALID", "Decoded Resource JSON is invalid.", { error: error.message });
      return null;
    }
    if ((resource && typeof resource === "object") && (resource.Item || Array.isArray(resource.Childs))) {
      report.wrapper.inputType = "wrapped-yap-schema-direct";
      return { wrapper, resource, data: resource };
    }
    if (typeof resource.Data !== "string") {
      issue(report, "error", "RESOURCE_DATA_MISSING", "Decoded Resource should be schema-direct ListExportInfo, or legacy Resource.Data must be a JSON string.");
      return null;
    }
    let data;
    try {
      data = parseJsonPreservingLargeInts(resource.Data, report._largeNumbers);
    } catch (error) {
      issue(report, "error", "RESOURCE_DATA_JSON_INVALID", "Resource.Data JSON is invalid.", { error: error.message });
      return null;
    }
    if (Number(resource.MainListType) === 1024 && Object.prototype.hasOwnProperty.call(resource, "Data")) {
      report.wrapper.inputType = "wrapped-yap-list-export-result";
    }
    return { wrapper, resource, data };
  }

  if (parsed && typeof parsed.Data === "string" && (parsed.MainListType !== undefined || parsed.AppID !== undefined || parsed.ReplaceIds !== undefined)) {
    let data;
    try {
      data = parseJsonPreservingLargeInts(parsed.Data, report._largeNumbers);
    } catch (error) {
      issue(report, "error", "RESOURCE_DATA_JSON_INVALID", "Decoded Resource.Data JSON is invalid.", { error: error.message });
      return null;
    }
    report.wrapper = { inputType: "decoded-resource-json", wrapperJsonValid: true, resourcePrefixValid: null };
    return { wrapper: null, resource: parsed, data };
  }

  report.wrapper = { inputType: "decoded-data-json", wrapperJsonValid: true, resourcePrefixValid: null };
  return { wrapper: null, resource: null, data: parsed };
}

function validateYapWrapperSchema(wrapper, report) {
  for (const key of YAP_WRAPPER_REQUIRED_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(wrapper || {}, key)) {
      issue(report, "error", "YAP_WRAPPER_REQUIRED_PROPERTY_MISSING", "YAP wrapper is missing a product-schema-required property.", { path: `$.${key}`, key });
    }
  }
  const iconSeverity = report.mode === "generator" && report.stage === "final" ? "error" : "warning";
  for (const finding of validatePackageWrapperIcon(wrapper).findings) {
    issue(report, iconSeverity, finding.code, finding.message, finding);
  }
  if (typeof wrapper.Resource !== "string") {
    issue(report, "error", "YAP_RESOURCE_NOT_STRING", "YAP wrapper Resource must be a string.");
  } else if (!wrapper.Resource.startsWith(GZIP_PREFIX)) {
    issue(report, "error", "YAP_RESOURCE_PREFIX_INVALID", `YAP wrapper Resource must start with ${GZIP_PREFIX}.`);
  }
}

function normalizeType(field) {
  const rules = tryParseJson(field && field.Rules) || {};
  const fieldType = safeString(field && field.FieldType).toLowerCase();
  const controlType = safeString(field && field.Type).toLowerCase();
  const combined = `${fieldType} ${controlType}`;
  if (controlType === "lookup" || rules.listid || rules.listsetid || rules.listfield) return "lookup";
  if (controlType === "metadata" || controlType === "mutiple-metadata") return "metadata";
  if (controlType === "textarea" || controlType === "richtext") return "longText";
  if (controlType === "checkbox") return "multiChoice";
  if (controlType === "radio" || controlType === "dropdown" || controlType === "select") return "choice";
  if (controlType === "datepicker") return "date";
  if (controlType === "switch" || fieldType === "bit") return "boolean";
  if (controlType === "flowstatus") return "flowstatus";
  if (controlType === "hyperlink") return "hyperlink";
  if (controlType === "list") return "list";
  if (combined.includes("file")) return "file";
  if (combined.includes("identity") || combined.includes("user") || combined.includes("person")) return "user";
  if (combined.includes("currency")) return "currency";
  if (combined.includes("percent")) return "percent";
  if (combined.includes("decimal") || combined.includes("number") || combined.includes("bigint") || combined.includes("int")) return "number";
  if (combined.includes("calculated")) return "calculated";
  if (combined.includes("date") || combined.includes("time")) return "date";
  if (combined.includes("text") || controlType === "input") return "text";
  return "unknown";
}

function expectedFieldTypeForFieldName(fieldName) {
  const name = safeString(fieldName);
  if (name === "Title" || /^Text\d+$/i.test(name)) return { family: "text", allowed: ["text", "string"] };
  if (/^Datetime\d+$/i.test(name)) return { family: "date", allowed: ["datetime", "date", "time"] };
  if (/^Decimal\d+$/i.test(name)) return { family: "decimal", allowed: ["decimal", "currency", "number"] };
  if (/^Bigint\d+$/i.test(name)) return { family: "integer", allowed: ["bigint", "int", "integer", "number"] };
  if (/^Bit\d+$/i.test(name)) return { family: "boolean", allowed: ["bit", "bool", "boolean"] };
  return null;
}

function validateFieldNameStorageTypeAlignment(field, listTitle, pathPrefix, report) {
  const expected = expectedFieldTypeForFieldName(field && field.FieldName);
  if (!expected) return;
  const fieldType = safeString(field && field.FieldType).toLowerCase();
  if (!fieldType) return;
  if (!expected.allowed.some((token) => fieldType.includes(token))) {
    issue(
      report,
      generatorFinalSeverity(report),
      "FIELD_NAME_FIELDTYPE_MISMATCH",
      "Generated data-list fields must keep FieldName storage prefix aligned with FieldType; cloned template fields must be selected by FieldName, not by array position, before seeded rows or add-new-item runtime tests.",
      {
        list: listTitle,
        path: `${pathPrefix}.FieldType`,
        fieldName: field && field.FieldName,
        fieldType: field && field.FieldType,
        expectedFamily: expected.family,
      }
    );
  }
}

function validateCanonicalYapDataListFieldType(field, listTitle, pathPrefix, report) {
  const fieldType = safeString(field && field.FieldType);
  const controlType = safeString(field && field.Type);
  const fieldName = safeString(field && field.FieldName);
  const fieldIndex = Number(field && field.FieldIndex);
  const isSystem = field && field.IsSystem === true;
  const context = {
    list: listTitle,
    field: field && (field.DisplayName || field.FieldName || field.InternalName) || null,
    fieldName: fieldName || null,
    fieldType: fieldType || null,
    controlType: controlType || null,
    path: `${pathPrefix}.FieldType`,
  };

  if (!CANONICAL_YAP_DATA_LIST_FIELD_TYPES.has(fieldType)) {
    issue(
      report,
      "error",
      COMMON_INVALID_YAP_FIELD_TYPES.has(fieldType) ? "YAP_DATALIST_FIELDTYPE_UNSUPPORTED_LEAKED_VALUE" : "YAP_DATALIST_FIELDTYPE_UNSUPPORTED",
      "Generated YAP data-list FieldType must use the canonical schema enum Text, Bit, Decimal, or Datetime. Helper/storage names such as Int, Date, DateTime, Boolean, Number, or Bool must not leak into FieldType.",
      context
    );
  }

  const expected = CANONICAL_FIELDTYPE_BY_CONTROL_TYPE.get(controlType);
  if (expected && fieldType !== expected) {
    issue(
      report,
      "error",
      "YAP_DATALIST_FIELDTYPE_CONTROL_MAPPING_INVALID",
      "Generated YAP data-list FieldType must stay separate from UI Type and match the canonical storage category for the control.",
      { ...context, expectedFieldType: expected }
    );
  }

  if (fieldName === "Title") {
    if (!isSystem || Number(field && field.FieldIndex) !== 0) {
      issue(
        report,
        "error",
        "YAP_DATALIST_TITLE_FIELD_SYSTEM_METADATA_INVALID",
        "The YAP schema requires the Title field to be the system field with IsSystem=true and FieldIndex=0.",
        { ...context, isSystem: field && field.IsSystem, fieldIndex: field && field.FieldIndex, path: `${pathPrefix}.FieldName` }
      );
    }
    return;
  }

  if (isSystem) {
    issue(
      report,
      "error",
      "YAP_DATALIST_SYSTEM_FIELD_NOT_TITLE",
      "The YAP schema allows only the native Title field to use IsSystem=true.",
      { ...context, isSystem: true, fieldIndex: field && field.FieldIndex, path: `${pathPrefix}.IsSystem` }
    );
    return;
  }

  const expectedFieldName = fieldType && Number.isInteger(fieldIndex) ? `${fieldType}${fieldIndex}` : null;
  if (expectedFieldName && fieldName !== expectedFieldName) {
    issue(
      report,
      "error",
      "YAP_DATALIST_CUSTOM_FIELDNAME_SCHEMA_MISMATCH",
      "Custom YAP field names must be storage-code style and exactly equal FieldType + FieldIndex; business labels belong in DisplayName.",
      { ...context, expectedFieldName, fieldIndex: field && field.FieldIndex, path: `${pathPrefix}.FieldName` }
    );
  }

  const range = YAP_FIELD_INDEX_RANGE_BY_FIELD_TYPE.get(fieldType);
  if (!Number.isInteger(fieldIndex) || !range || fieldIndex < range.min || fieldIndex > range.max) {
    issue(
      report,
      "error",
      "YAP_DATALIST_FIELDINDEX_OUT_OF_RANGE",
      "Custom YAP field indexes must start at 1 and stay within the schema range for the field storage type.",
      { ...context, fieldIndex: field && field.FieldIndex, min: range && range.min, max: range && range.max, path: `${pathPrefix}.FieldIndex` }
    );
  }
}

function classifyListResource(item, isRoot = false) {
  const list = item && item.ListModel ? item.ListModel : {};
  const type = Number(list.Type);
  if (isRoot || type === 1024) return "app/listset";
  if (type === 16) return "document library";
  if (type === 32) return "form report/list resource";
  if (type === 64) return "report/data resource";
  if (type === 1) return "data list";
  return "unknown";
}

function isDocumentLibraryOnlyPackage(data) {
  const children = asArray(data && data.Childs);
  return children.length > 0 && children.every((child) => classifyListResource(child) === "document library");
}

function validateDocumentLibraryFields(item, fieldsByName, pathPrefix, report) {
  const list = item.ListModel || {};
  const title = safeString(list.Title);
  const listId = safeString(list.ListID);
  const required = [
    {
      fieldName: "Title",
      displayName: "Name",
      fieldType: "Text",
      controlType: "input",
      rules: ["isLibrary"],
      message: "Document library native Name field should preserve FieldName Title with Text/input metadata and Rules.isLibrary.",
    },
    {
      fieldName: "Text1",
      displayName: "Type",
      fieldType: "Text",
      controlType: "input",
      message: "Document library Type field should use Text1 with Text/input metadata.",
    },
    {
      fieldName: "Bigint2",
      displayName: "Size/FileSize",
      fieldType: "Bigint",
      controlType: "input_number",
      rules: ["readonly"],
      message: "Document library Size/FileSize field should use Bigint2 with Bigint/input_number readonly metadata.",
    },
    {
      fieldName: "Text4",
      displayName: "Upload File",
      fieldType: "Text",
      controlType: "file-upload",
      rules: ["required", "isLabrary"],
      message: "Document library Upload File field should use Text4 with file-upload control metadata and library upload rules.",
    },
  ];

  for (const spec of required) {
    const field = fieldsByName.get(spec.fieldName);
    if (!field) {
      issue(report, "warning", "DOCUMENT_LIBRARY_DEFAULT_FIELD_MISSING", spec.message, { list: title, listId, fieldName: spec.fieldName });
      continue;
    }
    const rules = parsedFieldRules(field);
    const mismatches = [];
    if (safeString(field.FieldType) !== spec.fieldType) mismatches.push(`FieldType expected ${spec.fieldType}`);
    if (safeString(field.Type) !== spec.controlType) mismatches.push(`Type expected ${spec.controlType}`);
    if (field.ListID !== undefined && listId && safeString(field.ListID) !== listId) mismatches.push("ListID does not match parent document library");
    for (const ruleName of spec.rules || []) {
      if (rules[ruleName] !== true) mismatches.push(`Rules.${ruleName} expected true`);
    }
    if (spec.fieldName === "Title") {
      if (field.IsSystem !== true) mismatches.push("IsSystem expected true");
      if (field.IsIndex !== true) mismatches.push("IsIndex expected true");
    }
    if (mismatches.length) {
      issue(report, "warning", "DOCUMENT_LIBRARY_DEFAULT_FIELD_SIGNATURE_UNUSUAL", spec.message, {
        list: title,
        listId,
        fieldName: spec.fieldName,
        displayName: field.DisplayName || null,
        mismatches,
      });
    }
  }

  const parentField = fieldsByName.get("Bigint1");
  if (!parentField) {
    issue(report, "warning", "DOCUMENT_LIBRARY_PARENT_FIELD_MISSING", "Document library exports include Bigint1/ParentID for folder hierarchy support; keep it unless a focused export proves it is optional.", { list: title, listId });
  } else {
    const rules = parsedFieldRules(parentField);
    if (safeString(parentField.FieldType) !== "Bigint" || safeString(parentField.Type) !== "input_number" || rules.isNotInListFiles !== true) {
      issue(report, "warning", "DOCUMENT_LIBRARY_PARENT_FIELD_SIGNATURE_UNUSUAL", "Document library ParentID field should use Bigint1 with Bigint/input_number metadata and Rules.isNotInListFiles.", {
        list: title,
        listId,
        fieldName: parentField.FieldName,
        displayName: parentField.DisplayName || null,
      });
    }
  }

  if (safeString(list.CustomType) && !safeString(list.CustomType).startsWith("ListSite_")) {
    issue(report, "warning", "DOCUMENT_LIBRARY_CUSTOMTYPE_UNUSUAL", "Document library CustomType should usually link back to the app/listset as ListSite_<root ListID>.", { list: title, listId, customType: list.CustomType });
  }
  if (list.IsItemPerm !== true) {
    issue(report, "warning", "DOCUMENT_LIBRARY_ITEM_PERMISSION_UNUSUAL", "Studied document libraries keep ListModel.IsItemPerm true; confirm generated permission behavior if this differs.", { list: title, listId, isItemPerm: list.IsItemPerm });
  }
}

function listIdOf(item) {
  return safeString(item && item.ListModel && item.ListModel.ListID);
}

function parsedFieldRules(field) {
  if (!field) return {};
  if (isObject(field.Rules)) return field.Rules;
  return tryParseJson(field.Rules) || {};
}

function lookupSampleValues(value, multiple) {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) return value.map(safeString).filter(Boolean);
  if (multiple && typeof value === "string") {
    const parsed = tryParseJson(value);
    if (Array.isArray(parsed)) return parsed.map(safeString).filter(Boolean);
  }
  return [safeString(value)].filter(Boolean);
}

function listSetIdOf(item, rootListSetId) {
  const list = item && item.ListModel ? item.ListModel : {};
  const candidates = [list.ListSetID, list.ListSetId, list.ListSiteID, list.CustomType, rootListSetId];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = safeString(candidate).match(/\d{12,}/);
    if (match) return match[0];
  }
  return "";
}

function parseDefResource(form, report, index) {
  const raw = form && form.DefResource;
  if (!raw) return null;
  const candidates = [];
  if (typeof raw === "string") {
    candidates.push(raw);
    try {
      candidates.push(Buffer.from(raw, "base64").toString("utf8"));
    } catch {
      // ignore
    }
  }
  for (const candidate of candidates) {
    if (!candidate || !candidate.trim().startsWith("{")) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // try next
    }
  }
  issue(report, generatorFinalSeverity(report), "FORM_DEFRESOURCE_PARSE_FAILED", "Form DefResource could not be parsed.", { form: form && form.Name, key: form && form.Key, index });
  issue(report, generatorFinalSeverity(report), "YAP_DEFRESOURCE_DECODE_INVALID", "Generated-final YAP form DefResource must decode to valid JSON.", { form: form && form.Name, key: form && form.Key, index });
  return null;
}

function shapeType(shape) {
  return shape && shape.stencil && (shape.stencil.id || shape.stencil) || shape && shape.type || "unknown";
}

function shapeId(shape) {
  return shape && (shape.resourceid || shape.resourceId || shape.id);
}

function refId(ref) {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  return ref.resourceid || ref.resourceId || ref.id || "";
}

function collectShapes(def) {
  const out = [];
  function visit(nodes) {
    for (const node of asArray(nodes)) {
      out.push(node);
      if (node.childshapes) visit(node.childshapes);
    }
  }
  visit(def && def.childshapes);
  return out;
}

function validate(inputPath, mode, stage) {
  const report = {
    status: "pass",
    mode,
    stage,
    errors: [],
    warnings: [],
    dependencies: [],
    summary: {
      childResources: 0,
      dataLists: 0,
      forms: 0,
      approvalForms: 0,
      scheduledWorkflows: 0,
      listWorkflows: 0,
      reports: 0,
      dashboards: 0,
      agents: 0,
      copilots: 0,
      connections: 0,
      knowledges: 0,
      appUserGroups: 0,
      replaceIds: 0,
      lookupRelationships: 0,
      contentListReferences: 0,
      workflowActionConfig: {
        checkedNodes: 0,
        supportedNodes: 0,
        unsupportedNodes: 0,
        partialNodes: 0,
        unsafeNodes: 0,
      },
    },
    inventories: {
      resources: [],
      forms: [],
      modules: [],
    },
    _largeNumbers: new Set(),
    _controlFieldSchemas: loadControlFieldSchemas(__dirname),
  };

  const decoded = decodeInput(inputPath, report);
  if (!decoded) return finish(report);
  const { wrapper, resource, data } = decoded;

  validateBasicStructure(data, resource, report);
  const rootItem = data && data.Item;
  const rootList = rootItem && rootItem.ListModel ? rootItem.ListModel : {};
  const rootListSetId = safeString((resource && (resource.ListSetID || resource.ListSetId)) || rootList.ListID);
  const replaceIds = new Set(asArray(resource && resource.ReplaceIds).map(String));
  report.summary.replaceIds = replaceIds.size;

  const resourceItems = [rootItem, ...asArray(data && data.Childs)].filter(Boolean);
  const listsById = new Map();
  const fieldsByList = new Map();
  const localIds = new Set();
  const fieldIdsByApp = new Map();
  const listIdsByApp = new Map();
  const layoutIdsByApp = new Map();
  const layoutResourceIdsByApp = new Map();

  resourceItems.forEach((item, index) => {
    validateResourceItem(item, index, index === 0, rootListSetId, replaceIds, localIds, listsById, fieldsByList, fieldIdsByApp, listIdsByApp, layoutIdsByApp, layoutResourceIdsByApp, report);
  });

  validateRootAppShell(data, wrapper, replaceIds, listsById, fieldsByList, report, resource);
  validateApplicationUserGroups(data, replaceIds, report);
  validateReplaceIds(replaceIds, localIds, report);
  validateGeneratedFinalExportShape(data, resource, localIds, report);
  validateCustomFormDocLibraryControls(data, listsById, fieldsByList, report);
  const aiResourcesById = buildAiResourcesById(data);
  validateForms(data, listsById, fieldsByList, replaceIds, localIds, report, aiResourcesById);
  validateGeneratedListRuntimeUsage(data, report);
  validateReportsDashboardsModules(data, listsById, fieldsByList, replaceIds, localIds, report);
  validateAgentCopilotModules(data, listsById, report);
  validateLookupRelationships(listsById, fieldsByList, report);
  validateSensitiveResources(data, report);
  validateDesignSystemColorUsage({ resource, data }, report);
  validatePlaceholders({ wrapper, resource, data }, report);
  validateSystemInt64Range({ wrapper, resource, data }, report);

  if (report._largeNumbers.size) {
    issue(report, "warning", "LARGE_NUMERIC_IDS", "Large numeric IDs were preserved as strings.", { count: report._largeNumbers.size });
  }

  return finish(report);
}

function missingKeys(object, keys) {
  return keys.filter((key) => object == null || object[key] === undefined);
}

const YAP_APPROVAL_FORM_DESIGNER_SAFE_CONTROLS = new Set([
  "section",
  "section-column",
  "container",
  "heading",
  "text",
  "icon",
  "button",
  "workflowcontrolpanel",
  "workflowhistory",
]);

const YAP_HEADING_PLACEHOLDER_RE = /^(here is the title|text|heading|title)$/i;

function generatedControlId(control) {
  return safeString(control && (control.id || control.ID || control.controlId || control.controlID));
}

function isExportProvenControl(control) {
  return control?.attrs?.exportProven === true
    || control?.attrs?.exportProven?.[1] === true
    || control?.attrs?.__exportProven === true
    || control?.attrs?.__exportProven?.[1] === true;
}

function controlNativeText(control) {
  const attrs = control && control.attrs || {};
  return safeString(
    attrRuntimeValue(attrs.headc && attrs.headc.title && attrs.headc.title.value)
      ?? attrRuntimeValue(attrs.textc && attrs.textc.value)
      ?? attrRuntimeValue(attrs.text && attrs.text.value)
      ?? attrRuntimeValue(attrs.content && attrs.content.value)
      ?? ""
  );
}

function collectControlReferences(control) {
  const references = [];
  walk(control, (value, pointer) => {
    if (!isObject(value)) return;
    for (const [key, child] of Object.entries(value)) {
      if (!/(parent|container|target|control).*id$/i.test(key) && !/^controlId$/i.test(key)) continue;
      if (typeof child === "string") references.push({ pointer: `${pointer}.${key}`, value: child });
    }
  });
  return references;
}

function validateGeneratedApprovalDesignerControls(formdef, report, context) {
  const controls = [];
  asArray(formdef && formdef.children).forEach((child, index) => walkControls(child, (control, pointer) => controls.push({ control, pointer: `formdef.children[${index}]${pointer.slice(1)}` })));
  if (!controls.length) return;

  const ids = new Map();
  const duplicateIds = new Set();
  for (const { control, pointer } of controls) {
    const type = safeString(control && control.type).toLowerCase();
    const id = generatedControlId(control);
    if (Object.prototype.hasOwnProperty.call(control || {}, "binding") && control.binding !== undefined && control.binding !== null && typeof control.binding !== "string") {
      issue(report, generatorFinalSeverity(report), "YAP_FORM_CONTROL_BINDING_NOT_STRING", "Generated approval form controls must store binding as a string variable or field id; object binding values can leave the designer loading.", { ...context, path: `${pointer}.binding`, controlType: control && control.type || null, bindingType: Array.isArray(control && control.binding) ? "array" : typeof (control && control.binding) });
    }
    if (type === "date") {
      issue(report, generatorFinalSeverity(report), "YAP_FORM_DATE_CONTROL_LEGACY", "Generated approval forms must use the export-backed datepicker control type; legacy date controls can fail designer hydration.", { ...context, path: `${pointer}.type`, controlType: control && control.type || null });
    }
    const width = control && control.attrs && control.attrs.common && control.attrs.common.positioning && control.attrs.common.positioning.width;
    if (isNumericStringConfig(width)) {
      issue(report, generatorFinalSeverity(report), "YAP_FORM_CONTROL_WIDTH_STRING_INVALID", "Generated approval form control widths must use Yeeflow config pair values, for example width: [null, 960] and widthu: [null, \"px\"], not numeric strings.", { ...context, path: `${pointer}.attrs.common.positioning.width`, controlType: control && control.type || null, width });
    }
    if (!id) {
      issue(report, "error", "YAP_FORM_CONTROL_ID_MISSING", "Generated approval form controls must include unique designer-level id values for designer hydration and single-control selection.", { ...context, path: pointer, controlType: control && control.type || null, label: safeString(control && (control.label || control.name || control.title)) || null });
      issue(report, "error", "YAP_FORM_DESIGNER_SELECTION_RISK", "Missing designer IDs can cause selecting one generated approval form control to select many or all controls.", { ...context, path: pointer, controlType: control && control.type || null });
    } else if (ids.has(id)) {
      duplicateIds.add(id);
      issue(report, "error", "YAP_FORM_CONTROL_ID_DUPLICATE", "Generated approval form designer-level control IDs must be unique across the full form tree.", { ...context, path: pointer, duplicateId: id, firstPath: ids.get(id) });
      issue(report, "error", "YAP_FORM_DESIGNER_SELECTION_RISK", "Duplicate designer IDs can make the designer selection model bind multiple controls to one selection.", { ...context, duplicateId: id });
    } else {
      ids.set(id, pointer);
    }

    if (type && !YAP_APPROVAL_FORM_DESIGNER_SAFE_CONTROLS.has(type) && !isExportProvenControl(control)) {
      issue(report, "error", "YAP_FORM_DESIGNER_UNPROVEN_CONTROL", "Generated approval form workspaces must use designer-safe export-proven control families unless a control family has separate runtime proof.", { ...context, path: pointer, controlType: control.type });
      issue(report, "error", "YAP_FORM_DESIGNER_HYDRATION_RISK", "Unproven approval form controls can import but leave the designer blank, loading, or partially hydrated.", { ...context, path: pointer, controlType: control.type });
    }

    if (type === "heading") {
      const native = safeString(attrRuntimeValue(control?.attrs?.headc?.title?.value));
      const label = safeString(control && (control.label || control.title || control.name));
      if (!native) {
        issue(report, "error", "YAP_HEADING_NATIVE_TITLE_MISSING", "Generated heading controls must populate export-style native heading text at attrs.headc.title.value, not only label/display metadata.", { ...context, path: pointer, label: label || null });
      } else if (YAP_HEADING_PLACEHOLDER_RE.test(native)) {
        issue(report, "error", "YAP_HEADING_NATIVE_TITLE_PLACEHOLDER", "Generated heading controls must not emit default placeholder text such as 'Here is the title'.", { ...context, path: pointer });
      }
      if (label && native && label !== native) {
        issue(report, "error", "YAP_CONTROL_LABEL_NATIVE_TEXT_MISMATCH", "Generated heading labels and native rendered title values must stay synchronized when both exist.", { ...context, path: pointer, label, native });
      }
    }

    if (type === "text") {
      const native = controlNativeText(control);
      const label = safeString(control && (control.label || control.title || control.name));
      if (!native) {
        issue(report, "error", "YAP_TEXT_NATIVE_VALUE_MISSING", "Generated text controls must populate export-style native text value metadata, not only label/display metadata.", { ...context, path: pointer, label: label || null });
      }
      if (label && native && label !== native) {
        issue(report, "error", "YAP_CONTROL_LABEL_NATIVE_TEXT_MISMATCH", "Generated text labels and native rendered values must stay synchronized when both exist.", { ...context, path: pointer, label, native });
      }
    }
  }

  for (const { control, pointer } of controls) {
    for (const ref of collectControlReferences(control)) {
      if (!ids.has(ref.value) && !duplicateIds.has(ref.value)) {
        issue(report, "error", "YAP_FORM_CONTROL_ID_REFERENCE_INVALID", "Generated approval form control ID references must resolve to a control in the same form tree.", { ...context, path: `${pointer}${ref.pointer.slice(1)}`, reference: ref.value });
      }
    }
  }
}

function validateGeneratedFinalExportShape(data, resource, localIds, report) {
  if (!isGeneratedFinal(report) || isSchemaDirectYap(report) || !isObject(data) || !isObject(resource)) return;

  const appLevelMissing = [];
  if (!Object.prototype.hasOwnProperty.call(resource, "SimplePortal")) appLevelMissing.push("Resource.SimplePortal");
  if (!Object.prototype.hasOwnProperty.call(data, "PortalInfo")) appLevelMissing.push("Data.PortalInfo");
  for (const key of ["AppTags", "AppMetadatas", "AppComponents", "AppThemes", "OtherModules", "FormReports", "FormNewReports", "AppGroups"]) {
    if (!Array.isArray(data[key])) appLevelMissing.push(`Data.${key}`);
  }
  if (appLevelMissing.length) {
    issue(report, "error", "YAP_APP_LEVEL_EXPORT_FIELDS_MISSING", "Generated-final YAP packages must preserve export-level app structures even when they are empty or null.", { missing: appLevelMissing });
  }

  const root = data.Item && data.Item.ListModel ? data.Item.ListModel : {};
  const rootMissing = missingKeys(root, ["WorkspaceID", "TenantID", "AppID", "TableCode", "IndexCode", "Flags", "Status", "Perm", "Ext1", "Ext2", "Ext3", "Created", "CreatedBy", "Modified", "ModifiedBy", "LayoutView"]);
  if (rootMissing.length) {
    issue(report, "error", "YAP_ROOT_METADATA_INCOMPLETE", "Generated root app/ListSet metadata is too thin. Use export-shaped root metadata rather than a title/ListID/type skeleton.", { missing: rootMissing });
  }
  validateExportLocalId(root.ListID, report, { path: "$.Item.ListModel.ListID", kind: "root app/listset" });

  let thinSignals = 0;
  if (rootMissing.length >= 5) thinSignals += 1;
  if (appLevelMissing.length) thinSignals += 1;

  for (const [index, child] of asArray(data.Childs).entries()) {
    const list = child && child.ListModel ? child.ListModel : {};
    const title = safeString(list.Title) || `Child ${index}`;
    const listMissing = missingKeys(list, ["WorkspaceID", "TenantID", "AppID", "TableCode", "IndexCode", "Flags", "Status", "Perm", "Ext1", "Ext2", "Ext3", "Created", "CreatedBy", "Modified", "ModifiedBy", "LayoutView", "ListType", "CustomType"]);
    if (listMissing.length) {
      issue(report, "error", "YAP_CHILD_LIST_METADATA_INCOMPLETE", "Generated child list metadata is too thin for import-qualified YAP generation.", { list: title, path: `$.Childs[${index}].ListModel`, missing: listMissing });
      issue(report, "error", "YAP_LIST_EXPORT_METADATA_INCOMPLETE", "Generated child list metadata must preserve export-shaped list metadata for import/materialization.", { list: title, path: `$.Childs[${index}].ListModel`, missing: listMissing });
      if (listMissing.includes("ListType")) {
        issue(report, "error", "YAP_CHILD_LISTTYPE_MISSING", "Generated child list metadata must include ListModel.ListType; missing ListType can materialize incomplete lists.", { list: title, path: `$.Childs[${index}].ListModel.ListType` });
      }
    }
    if (listMissing.length >= 6) thinSignals += 1;
    validateExportLocalId(list.ListID, report, { path: `$.Childs[${index}].ListModel.ListID`, list: title, kind: "child list" });

    for (const [fieldIndex, field] of asArray(child.Defs).entries()) {
      const fieldMissing = missingKeys(field, ["FieldID", "ListID", "AppID", "FieldName", "InternalName", "DisplayName", "FieldType", "Type", "Category", "FieldIndex", "Status", "IsSystem", "IsIndex", "Rules"]);
      if (fieldMissing.length) {
        issue(report, "error", "YAP_FIELD_METADATA_INCOMPLETE", "Generated fields must include export-style field metadata, not only names and types.", { list: title, path: `$.Childs[${index}].Defs[${fieldIndex}]`, field: field && (field.DisplayName || field.FieldName) || null, missing: fieldMissing });
      }
      if (field && field.Rules !== undefined && typeof field.Rules !== "string") {
        issue(report, "error", "YAP_FIELD_RULES_NOT_STRING", "Generated YAP fields must store Rules as stringified JSON, matching export shape.", { list: title, path: `$.Childs[${index}].Defs[${fieldIndex}].Rules`, field: field.DisplayName || field.FieldName || null });
      }
      validateExportLocalId(field && field.FieldID, report, { path: `$.Childs[${index}].Defs[${fieldIndex}].FieldID`, list: title, field: field && (field.DisplayName || field.FieldName) || null, kind: "field" });
    }

    for (const [layoutIndex, layout] of asArray(child.Layouts).entries()) {
      const layoutMissing = missingKeys(layout, ["LayoutID", "Title", "Type", "LayoutView", "Ext1", "Ext2", "Ext3", "AppID", "ListID", "Status"]);
      if (layoutMissing.length) {
        issue(report, "error", "YAP_LAYOUT_METADATA_INCOMPLETE", "Generated data-list views/layouts must include export-style layout metadata.", { list: title, path: `$.Childs[${index}].Layouts[${layoutIndex}]`, layout: layout && layout.Title || null, missing: layoutMissing });
        issue(report, "error", "YAP_LAYOUT_EXPORT_METADATA_INCOMPLETE", "Generated data-list layouts must preserve export-shaped layout/view metadata for import/materialization.", { list: title, path: `$.Childs[${index}].Layouts[${layoutIndex}]`, layout: layout && layout.Title || null, missing: layoutMissing });
      }
      validateExportLocalId(layout && layout.LayoutID, report, { path: `$.Childs[${index}].Layouts[${layoutIndex}].LayoutID`, list: title, layout: layout && layout.Title || null, kind: "layout/view" });

      if (Number(layout && layout.Type) === 0) {
        const ext1 = tryParseJson(layout.Ext1) || {};
        const view = tryParseJson(layout.LayoutView) || {};
        const defaultViewMissing = [];
        if (ext1.Url !== "default") defaultViewMissing.push("Ext1.Url=default");
        if (!Array.isArray(view.layout) || !view.layout.length) defaultViewMissing.push("LayoutView.layout");
        if (!Array.isArray(view.query)) defaultViewMissing.push("LayoutView.query");
        if (layout.IsDefault !== true) defaultViewMissing.push("IsDefault=true");
        if (defaultViewMissing.length) {
          issue(report, "error", "YAP_DEFAULT_VIEW_EXPORT_SHAPE_INCOMPLETE", "Generated data lists must include an import-ready Type 0 default view with export-shaped visible and query field metadata.", { list: title, layout: layout.Title || null, missing: defaultViewMissing });
        }
      }
    }

    const listDatas = child && child.ListDatas;
    if (Array.isArray(listDatas) || isObject(listDatas) && Array.isArray(listDatas.Datas)) {
      issue(report, "error", "YAP_LISTDATAS_KEYED_RECORDS_MISSING", "Generated sample rows must use export-style ListDatas keyed by record ID, not arrays or ListDatas.Datas wrappers.", { list: title, path: `$.Childs[${index}].ListDatas` });
    } else if (isObject(listDatas)) {
      for (const [recordId, record] of Object.entries(listDatas)) {
        validateExportLocalId(recordId, report, { path: `$.Childs[${index}].ListDatas`, list: title, kind: "sample record key" });
        validateExportLocalId(record && record.ListDataID, report, { path: `$.Childs[${index}].ListDatas[record].ListDataID`, list: title, kind: "sample record ListDataID" });
      }
    }
  }

  for (const [index, form] of asArray(data.Forms).entries()) {
    const formName = safeString(form.Name || form.Key) || `Form ${index}`;
    validateExportLocalId(form.ID || form.ProcModelID, report, { path: `$.Forms[${index}].ID`, form: formName, kind: "form/process" });
    const formMissing = missingKeys(form, ["AppID", "Description", "Ext", "ImgResource", "IsItemPerm", "Key", "ListID", "Name", "NoRule", "ProcModelID", "Settings", "WorkflowType", "DefResource"]);
    if (formMissing.length) {
      issue(report, "error", "YAP_APPROVAL_DEFRESOURCE_METADATA_INCOMPLETE", "Generated approval form registration must keep export-style form/process metadata.", { form: formName, path: `$.Forms[${index}]`, missing: formMissing });
    }
    if (form.Status !== 1 || form.Deployed !== true) {
      issue(report, "error", "YAP_FORM_STATUS_NOT_PUBLISHED", "Generated-final approval form registrations must be export-shaped and published: Status=1 and Deployed=true unless draft mode is explicit.", { form: formName, status: form.Status, deployed: form.Deployed });
    }
    const noRule = form.NoRule;
    const noRuleValid = isObject(noRule)
      && typeof noRule.Prefix === "string"
      && noRule.Prefix.includes("{index}")
      && Number.isInteger(Number(noRule.StartIndex))
      && Number(noRule.StartIndex) >= 0
      && Number.isInteger(Number(noRule.CustomLength))
      && Number(noRule.CustomLength) >= 1
      && Number.isInteger(Number(noRule.AutoIncrement))
      && Number(noRule.AutoIncrement) >= 1;
    if (!noRuleValid) {
      issue(report, "error", "YAP_NORULE_INVALID", "Generated-final approval forms must preserve a real export-shaped NoRule object with Prefix containing {index}, StartIndex, CustomLength, and AutoIncrement.", { form: formName, path: `$.Forms[${index}].NoRule` });
    }

    const def = parseDefResource(form, report, index);
    if (!def) continue;
    const defMissing = missingKeys(def, ["name", "title", "workflowType", "AppListSetID", "ProcModelAppID", "ProcModelListID", "ProcModelListSetID", "ext", "lineType", "iconURL", "flowPage", "variables", "graphposition", "graphzoom", "graphver", "pageurls", "childshapes"]);
    if (defMissing.length) {
      issue(report, "error", "YAP_APPROVAL_DEFRESOURCE_METADATA_INCOMPLETE", "Generated approval DefResource is missing export-style process metadata.", { form: formName, missing: defMissing });
    }

    if (!isObject(def.graphposition) || def.graphzoom === undefined || def.graphver === undefined || !Array.isArray(def.flowPage) || !Array.isArray(def.childshapes)) {
      issue(report, "error", "YAP_WORKFLOW_GRAPH_METADATA_INCOMPLETE", "Generated workflow DefResource must include graph metadata, flowPage, and childshapes for designer hydration.", { form: formName });
    }
    if (!isObject(def.variables) || !Array.isArray(def.variables.basic) || !Array.isArray(def.variables.listref) || !Array.isArray(def.variables.filter)) {
      issue(report, "error", "YAP_WORKFLOW_GRAPH_METADATA_INCOMPLETE", "Generated workflow variables must use export-style variables.basic/listref/filter arrays.", { form: formName });
    }

    for (const [pageIndex, page] of asArray(def.pageurls).entries()) {
      validateExportStringId(page && page.id, report, "YAP_PAGEURL_ID_SHAPE_INVALID", "Generated approval DefResource.pageurls[].id must use the export-observed string shape, not numeric IDs.", { form: formName, pageIndex });
      const formdef = isObject(page.formdef) ? page.formdef : tryParseJson(page.formdef) || {};
      if (Object.prototype.hasOwnProperty.call(formdef, "controls") && !Array.isArray(formdef.children)) {
        issue(report, "error", "YAP_EXPORT_SHAPE_TOO_SYNTHETIC", "Generated approval form uses a thin controls-only formdef skeleton instead of export-shaped formdef.children.", { form: formName, pageIndex });
      }
      if (Array.isArray(formdef.children)) {
        validateGeneratedApprovalDesignerControls(formdef, report, { form: formName, pageIndex, pageId: page && page.id || null });
      }
    }

    for (const [shapeIndex, shape] of asArray(def.childshapes).entries()) {
      validateExportStringId(shape && shape.id, report, "YAP_CHILD_SHAPE_ID_SHAPE_INVALID", "Generated workflow childshape IDs must use the export-observed string shape, not numeric IDs.", { form: formName, shapeIndex, type: shapeType(shape) });
      validateExportStringId(shape && shape.resourceid, report, "YAP_CHILD_SHAPE_ID_SHAPE_INVALID", "Generated workflow childshape resource IDs must use the export-observed string shape, not numeric IDs.", { form: formName, shapeIndex, type: shapeType(shape) });
      if (shapeType(shape) !== "SequenceFlow" && !isObject(shape && shape.position)) {
        issue(report, "error", "YAP_WORKFLOW_GRAPH_METADATA_INCOMPLETE", "Generated non-sequence workflow nodes must include position metadata.", { form: formName, shapeIndex, type: shapeType(shape) });
      }
    }
  }

  if (thinSignals >= 2) {
    issue(report, "error", "YAP_EXPORT_SHAPE_TOO_SYNTHETIC", "Generated-final YAP package is too synthetic for import qualification. Build from an export-like baseline with full root/list/layout/field/form/app metadata.", { thinSignals });
  }
}

function validateSystemInt64Range(root, report) {
  const hits = [];
  walk(root, (value, pointer) => {
    if (typeof value !== "string" || !/^\d{16,}$/.test(value)) return;
    if (BigInt(value) <= SYSTEM_INT64_MAX) return;
    hits.push({ pointer, value });
  });
  const severity = generatorFinalSeverity(report);
  for (const hit of hits.slice(0, 20)) {
    issue(report, severity, "SYSTEM_INT64_ID_OVERFLOW", "Generated numeric ID exceeds System.Int64 range and can fail Yeeflow import/materialization.", hit);
  }
  if (hits.length > 20) {
    issue(report, severity, "SYSTEM_INT64_ID_OVERFLOW_TRUNCATED", "Additional generated numeric IDs exceed System.Int64 range.", { additionalCount: hits.length - 20 });
  }
}

function validateRootAppShell(data, wrapper, replaceIds, listsById, fieldsByList, report, outerResource) {
  const root = data && data.Item && data.Item.ListModel ? data.Item.ListModel : {};
  if (!root) return;
  if (wrapper && (!safeString(wrapper.Title) || wrapper.Description === undefined)) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "WRAPPER_TITLE_DESCRIPTION_INCOMPLETE", "Generated .yap wrapper should include import dialog Title and Description fields.", { titlePresent: Boolean(safeString(wrapper.Title)), descriptionPresent: wrapper.Description !== undefined });
  }
  if (safeString(root.CustomType)) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_CUSTOMTYPE_NOT_EMPTY", "Root app/ListSet CustomType should be empty; child lists use ListSite_<ListSetID>.", { customType: root.CustomType });
  }
  if (root.Perm !== undefined && Number(root.Perm) !== 0) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_PERM_NOT_APP_LEVEL", "Root app/ListSet Perm should match real app exports, usually 0.", { perm: root.Perm });
  }
  if (!safeString(root.WorkspaceID)) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_WORKSPACE_ID_MISSING", "Root app/ListSet WorkspaceID is missing; real app exports include workspace metadata.");
  }
  if (!safeString(root.CreatedBy) || !safeString(root.ModifiedBy)) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_AUDIT_USERS_MISSING", "Root app/ListSet CreatedBy and ModifiedBy should be populated; real imports/exports preserve creator metadata used by app access/open flows.", { createdByPresent: Boolean(safeString(root.CreatedBy)), modifiedByPresent: Boolean(safeString(root.ModifiedBy)) });
  }
  for (const key of ["TenantID", "CreatedBy", "ModifiedBy"]) {
    const value = safeString(root[key]);
    if (value && replaceIds.has(value)) {
      issue(report, generatorFinalSeverity(report), "ROOT_METADATA_IN_REPLACEIDS", "Generated .yap packages must preserve TenantID, CreatedBy, and ModifiedBy as real baseline metadata; do not include them in Resource.ReplaceIds or generated fake-ID remapping.", { field: key, value });
    }
  }
  for (const key of ["AppTags", "AppMetadatas", "AppComponents"]) {
    if (!Array.isArray(data[key])) {
      issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", `${key.toUpperCase()}_NOT_ARRAY`, `Data.${key} should be an array for app-level packages; real app exports use an array even when empty.`);
    }
  }
  if (!Array.isArray(data.AppThemes)) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "APPTHEMES_NOT_ARRAY", "Data.AppThemes should be an array for app-level packages; real app exports use an array even when empty.");
  } else if (!data.AppThemes.length) {
    issue(report, "warning", "APP_THEME_EMPTY", "AppThemes is empty. The minimal dashboard-only export uses an empty theme array, but richer generated apps should usually include application style metadata.");
  } else {
    validateAppThemeStandards(data.AppThemes, report);
  }
  const rootLayouts = asArray(data.Item && data.Item.Layouts);
  const rootPageLayouts = new Set(rootLayouts.filter((layout) => safeString(layout.Type) === "103").map((layout) => safeString(layout.LayoutID)).filter(Boolean));
  const approvalFormsByKey = new Set(asArray(data.Forms).map((form) => safeString(form.Key || form.DefKey || form.ProcKey)).filter(Boolean));
  const layoutsById = new Set();
  for (const resource of [data.Item, ...asArray(data.Childs)]) {
    for (const candidateLayout of asArray(resource && resource.Layouts)) {
      const candidateLayoutId = safeString(candidateLayout.LayoutID);
      if (candidateLayoutId) layoutsById.add(candidateLayoutId);
    }
  }
  const documentLibraryOnlyPackage = isDocumentLibraryOnlyPackage(data);
  if (!rootPageLayouts.size) {
    issue(
      report,
      documentLibraryOnlyPackage || isSchemaDirectYap(report) ? "warning" : report.mode === "generator" && report.stage === "final" ? "error" : "warning",
      "ROOT_APP_PAGE_LAYOUT_MISSING",
      "Root app/ListSet has no Type 103 app page layout. Document-library-only exports can omit root pages; richer generated apps usually need an openable app shell.",
    );
  }
  for (const layout of rootLayouts.filter((candidate) => safeString(candidate.Type) === "103")) {
    const layoutId = safeString(layout.LayoutID);
    const ext2 = tryParseJson(layout.Ext2);
    const resources = asArray(layout.LayoutInResources);
    if (!resources.length) {
      if (layout.LayoutView !== null || !ext2 || ext2.src !== true) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "DASHBOARD_USES_LEGACY_SCHEMA", "Generated Type 103 dashboard shell should use the current export-proven shape: LayoutView null, Ext2 {\"src\":true}, and empty LayoutInResources.", { title: layout.Title, layoutId, layoutViewType: layout.LayoutView === null ? "null" : typeof layout.LayoutView, ext2 });
      }
      if (!ext2 || ext2.src !== true) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "DASHBOARD_CURRENT_VERSION_MARKER_MISSING", "Generated dashboard shell is missing the current-version Ext2 {\"src\":true} marker.", { title: layout.Title, layoutId });
      }
    }
    if (layout.LayoutView !== null && layout.LayoutView !== undefined) {
      if (!(isSchemaDirectYap(report) && layout.LayoutView === "")) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_LAYOUTVIEW_NOT_NULL", "Root Type 103 app page LayoutView should be null; working exports store page content in LayoutInResources.Resource.", { title: layout.Title, layoutId });
      }
    }
    if (!Array.isArray(layout.LayoutInResources)) {
      issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_LAYOUTINRESOURCES_NOT_ARRAY", "Root Type 103 app page LayoutInResources must be an array. Minimal dashboard-only exports use an empty array.", { title: layout.Title, layoutId });
      continue;
    }
    if (!resources.length) {
      const isMinimalDashboardShell = ext2 && ext2.src === true && replaceIds.has(layoutId);
      if (!isMinimalDashboardShell) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_MISSING", "Root Type 103 app page layout without embedded page content must match the minimal dashboard-only export pattern: LayoutInResources empty, Ext2 {\"src\":true}, and LayoutID in ReplaceIds.", { title: layout.Title, layoutId });
      }
      continue;
    }
    for (const resource of resources) {
      const resourceId = safeString(resource.ID);
      const refId = safeString(resource.RefId);
      if (!resourceId || !refId || !safeString(resource.Resource)) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_INCOMPLETE", "Root Type 103 app page LayoutInResources entry must include ID, RefId, and Resource.", { title: layout.Title, layoutId });
      }
      const usesInlinePageResourceId = resourceId === layoutId && refId === layoutId;
      if ((resourceId === layoutId || refId === layoutId) && !usesInlinePageResourceId) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_ID_PARTIAL_LAYOUTID_MATCH", "Root Type 103 app page LayoutInResources ID and RefId should either both match LayoutID for inline dashboard page resources, or both use a separate resource ID.", { title: layout.Title, layoutId, resourceId, refId });
      }
      if (resourceId && refId && resourceId !== refId) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_ID_REFID_MISMATCH", "Root Type 103 app page LayoutInResources ID and RefId should match each other.", { title: layout.Title, layoutId, resourceId, refId });
      }
      const page = tryParseJson(resource.Resource);
      if (!page) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_JSON_INVALID", "Root Type 103 app page Resource must be valid page JSON.", { title: layout.Title, layoutId, resourceId });
      } else {
        for (const key of ["children", "attrs", "title", "ver", "filterVars", "tempVars"]) {
          if (page[key] === undefined) issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_REQUIRED_KEY_MISSING", `Root Type 103 app page Resource missing ${key}.`, { title: layout.Title, layoutId, resourceId, key });
        }
        if (!Array.isArray(page.children) || !page.children.length) {
          issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_APP_PAGE_RESOURCE_EMPTY_CHILDREN", "Root Type 103 app page Resource should contain at least one child component.", { title: layout.Title, layoutId, resourceId });
        }
        validateDashboardPageResource(page, layout, resource, listsById, fieldsByList, rootPageLayouts, approvalFormsByKey, layoutsById, report, outerResource);
      }
    }
  }
  const layoutView = tryParseJson(root.LayoutView);
  if (!layoutView) {
    if (isSchemaDirectYap(report) && !asArray(data.Item && data.Item.Layouts).some((layout) => safeString(layout.Type) === "103")) return;
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_LAYOUTVIEW_INVALID", "Root app/ListSet LayoutView must be parseable JSON navigation metadata.");
    return;
  }
  validateRootNavigationStyle(layoutView, report);
  validateRootNavigationMenuStructure(layoutView.sort || [], report);
  const navItems = flattenNavigationItems(layoutView.sort || []);
  if (!navItems.length) {
    issue(
      report,
      documentLibraryOnlyPackage ? "warning" : report.mode === "generator" && report.stage === "final" ? "error" : "warning",
      "ROOT_NAVIGATION_EMPTY",
      "Root app/ListSet LayoutView.sort is empty. The minimal Document Library Sample export uses only {sortVer:1}; richer generated apps usually need navigation entries.",
    );
    return;
  }
  const formKeys = new Set(asArray(data.Forms).map((form) => safeString(form.Key || form.FlowKey || form.key)).filter(Boolean));
  for (const item of navItems) {
    const type = safeString(item.Type);
    const listId = safeString(item.ListID);
    if (type === "process" || listId.startsWith("/p/")) continue;
    if (type === "103") {
      if (!rootPageLayouts.has(listId)) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_NAV_PAGE_REFERENCE_UNRESOLVED", "Root navigation item references a missing Type 103 app page layout.", { title: item.Title, type: item.Type, listId });
      }
    } else if (type === "1" || type === "16" || type === "32" || type === "64") {
      if (!listsById.has(listId)) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_NAV_LIST_REFERENCE_UNRESOLVED", "Root navigation item references a missing list/page resource.", { title: item.Title, type: item.Type, listId });
      }
    } else if (type === "105") {
      if (!formKeys.has(listId)) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "ROOT_NAV_FORM_REFERENCE_UNRESOLVED", "Root navigation item references a missing approval/form key.", { title: item.Title, formKey: listId });
      }
    }
  }
}

function validateAppThemeStandards(appThemes, report) {
  for (const theme of appThemes) {
    const config = tryParseJson(theme && theme.Config);
    if (!config || !config.neutral) continue;
    const neutralLightModel = safeString(config.neutral.lightmodel || config.neutral.lightModel);
    if (neutralLightModel && neutralLightModel !== "Luminance") {
      uiStandardWarning(report, "UI_STANDARD_NEUTRAL_LIGHTMODEL_NOT_LUMINANCE", "Generated app themes should use Neutral lightmodel \"Luminance\" so neutral variants follow the Yeeflow root style standard.", {
        theme: theme.Name || theme.ID || null,
        neutralLightModel
      });
    }
  }
}

function validateRootNavigationStyle(layoutView, report) {
  const attrs = layoutView && layoutView.attrs;
  if (!isObject(attrs)) return;
  const appearance = attrs.appearance;
  const navigatorMenu = attrs["navigator-menu"];
  if (isObject(appearance)) validateApplicationHeaderSettings(appearance, report);
  if (isObject(navigatorMenu)) validateNavigationMenuSettings(navigatorMenu, report);
  if (!isObject(appearance) || !isObject(navigatorMenu)) return;
  const headerBackground = safeString(appearance.bgc);
  const headerText = safeString(appearance.color);
  const navBackground = safeString(navigatorMenu.bgc);
  const navText = safeString(navigatorMenu.color);
  if (!headerBackground || !headerText || !navBackground) return;
  if (!navText) {
    uiStandardWarning(report, "UI_STANDARD_NAV_TEXT_COLOR_MISSING", "Generated app navigation should set navigator-menu.color explicitly. Use the header background color as nav text/icon color.", {
      expectedColor: headerBackground,
      navBackground
    });
    return;
  }
  if (navBackground !== headerText || navText !== headerBackground) {
    uiStandardWarning(report, "UI_STANDARD_NAV_COLOR_NOT_INVERTED", "Generated app navigation should invert header colors: navigator-menu.bgc should equal appearance.color and navigator-menu.color should equal appearance.bgc.", {
      headerBackground,
      headerText,
      navBackground,
      navText
    });
  }
}

function validateApplicationHeaderSettings(appearance, report) {
  if (appearance.height !== undefined) {
    const height = Number(appearance.height);
    if (!Number.isFinite(height) || height <= 0) {
      issue(report, generatorFinalSeverity(report), "APP_HEADER_HEIGHT_INVALID", "Application header appearance.height should be a positive number when present.", { height: appearance.height });
    } else if (![46, 56].includes(height)) {
      issue(report, "warning", "APP_HEADER_HEIGHT_UNPROVEN", "Application header appearance.height uses a value not yet export-proven by the application settings study. The studied default is omitted/56px and v6 proves 46px.", { height });
    }
  }
  if (appearance.hideTitle !== undefined && typeof appearance.hideTitle !== "boolean") {
    issue(report, generatorFinalSeverity(report), "APP_HEADER_HIDETITLE_NOT_BOOLEAN", "Application header appearance.hideTitle should be boolean when present.", { hideTitle: appearance.hideTitle });
  }
}

function validateNavigationMenuSettings(navigatorMenu, report) {
  const position = navigatorMenu.position;
  if (position === undefined || position === null || position === "") return;
  const allowed = new Set(["default", "left", "onheader", "none"]);
  if (!allowed.has(safeString(position))) {
    issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_POSITION_INVALID", "Application navigation menu attrs[\"navigator-menu\"].position should be one of the export-proven layout values: default, left, onheader, none.", { position });
  }
}

function validateRootNavigationMenuStructure(items, report, depth = 1, path = "$.Item.ListModel.LayoutView.sort") {
  const allowedResourceTypes = new Set(["1", "16", "32", "64", "103", "105"]);
  const observedNonResourceTypes = new Set(["process", "link"]);
  asArray(items).forEach((item, index) => {
    if (!isObject(item)) {
      issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_ITEM_NOT_OBJECT", "Application navigation menu entries should be objects.", { path: `${path}[${index}]` });
      return;
    }
    const itemPath = `${path}[${index}]`;
    const type = safeString(item.Type);
    const hasChildren = Array.isArray(item.list);
    if (depth > 2) {
      issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_DEPTH_EXCEEDED", "Application navigation menu supports only two levels: top-level item and child resource inside a group.", { path: itemPath, title: item.Title || item.DisplayName || null });
    }
    if (type === "classes") {
      if (depth !== 1) {
        issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_NESTED_GROUP", "Navigation groups cannot be nested inside other groups.", { path: itemPath, title: item.Title || null });
      }
      if (!safeString(item.Title) && !safeString(item.DisplayName)) {
        issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_GROUP_TEXT_MISSING", "Navigation group items should always have display text. Exports store it in Title.", { path: itemPath, id: item.ID || null });
      }
      if (!hasChildren) {
        issue(report, "warning", "APP_NAVIGATION_GROUP_CHILDREN_MISSING", "Navigation group item has no list[] children. Empty groups are runtime-sensitive and not proven useful.", { path: itemPath, title: item.Title || null });
      }
      if (item.ListID !== undefined) {
        issue(report, "warning", "APP_NAVIGATION_GROUP_LISTID_PRESENT", "Export-proven navigation groups use ID, Type classes, Title, Icon, and list[]; ListID on a group is not proven.", { path: itemPath, title: item.Title || null });
      }
      validateRootNavigationMenuStructure(item.list || [], report, depth + 1, `${itemPath}.list`);
      return;
    }
    if (hasChildren) {
      issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_RESOURCE_HAS_CHILDREN", "Only Type classes navigation groups should contain list[] children.", { path: itemPath, title: item.Title || item.DisplayName || null, type: item.Type });
      validateRootNavigationMenuStructure(item.list || [], report, depth + 1, `${itemPath}.list`);
    }
    if (!allowedResourceTypes.has(type) && !observedNonResourceTypes.has(type)) {
      issue(report, "warning", "APP_NAVIGATION_TYPE_UNPROVEN", "Navigation item Type is not one of the export-proven application resource types. Use warnings until the runtime behavior is studied.", { path: itemPath, title: item.Title || item.DisplayName || null, type: item.Type });
    }
    if (allowedResourceTypes.has(type) && !safeString(item.ListID)) {
      issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_RESOURCE_LISTID_MISSING", "Application resource navigation items should include ListID/Key reference metadata.", { path: itemPath, title: item.Title || item.DisplayName || null, type: item.Type });
    }
    if (item.DisplayName !== undefined && item.DisplayName !== null && typeof item.DisplayName !== "string") {
      issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_DISPLAYNAME_NOT_STRING", "Navigation DisplayName/custom text should be a string when present. Omit it to allow the resource-name fallback.", { path: itemPath, displayName: item.DisplayName });
    }
    if (item.Icon !== undefined && item.Icon !== null && typeof item.Icon !== "string") {
      issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_ICON_NOT_STRING", "Navigation Icon should be a string. Export-proven no-icon uses an empty string.", { path: itemPath, icon: item.Icon });
    }
    if (item.Icon === null) {
      issue(report, "warning", "APP_NAVIGATION_ICON_NULL_UNPROVEN", "Export-proven no-icon navigation items use Icon as an empty string rather than null.", { path: itemPath, title: item.Title || item.DisplayName || null });
    }
    if (item.IsHidden !== undefined && typeof item.IsHidden !== "boolean") {
      issue(report, generatorFinalSeverity(report), "APP_NAVIGATION_ISHIDDEN_NOT_BOOLEAN", "Navigation IsHidden should be boolean when present.", { path: itemPath, isHidden: item.IsHidden });
    }
  });
}

function validateDashboardPageResource(page, layout, resource, listsById, fieldsByList, rootPageLayouts, approvalFormsByKey, layoutsById, report, outerResource) {
  const severity = generatorFinalSeverity(report);
  const title = layout.Title;
  const layoutId = safeString(layout.LayoutID);
  if (page.attrs && page.attrs.hideHeaderAll !== true) {
    uiStandardWarning(report, "UI_STANDARD_DASHBOARD_HEADER_NOT_HIDDEN", "UI/UX standard dashboards should set attrs.hideHeaderAll to true.", { title, layoutId });
  }
  const dashboardRootPadding = page.attrs && page.attrs.container && page.attrs.container.padding;
  if (!zeroPadding(dashboardRootPadding) && !hasSafeHorizontalPaddingValue(dashboardRootPadding)) {
    uiStandardWarning(report, "UI_STANDARD_DASHBOARD_PADDING_UNUSUAL", "Dashboard page root padding should be either zero with padded inner sections or safe horizontal page padding.", { title, layoutId });
  }
  if (!hasSafeHorizontalPaddingNearRoot(page)) {
    uiStandardWarning(report, "UI_QUALITY_DASHBOARD_SAFE_PADDING_MISSING", "Generated dashboards should include safe left/right padding on an outer page section or container so controls do not touch window edges.", { title, layoutId });
  }
  validateUiStandardContainers(page, report, { surface: "dashboard", title, layoutId, requireFormBody: false });
  if (page.filterVars !== undefined && !Array.isArray(page.filterVars)) {
    issue(report, severity, "DASHBOARD_FILTERVARS_NOT_ARRAY", "Dashboard page filterVars must be an array when present.", { title, layoutId });
  }
  if (page.tempVars !== undefined && !Array.isArray(page.tempVars)) {
    issue(report, severity, "DASHBOARD_TEMPVARS_NOT_ARRAY", "Dashboard page tempVars must be an array when present.", { title, layoutId });
  }
  if (page.exts !== undefined && !Array.isArray(page.exts) && !(isObject(page.exts) && Object.keys(page.exts).length === 0)) {
    issue(report, severity, "DASHBOARD_EXTS_NOT_ARRAY", "Dashboard page exts must be an array when populated; an empty object is accepted for simple Type 103 page shells.", { title, layoutId });
  }

  const tempVars = new Set(asArray(page.tempVars).map((item) => safeString(item.id)).filter(Boolean));
  const filterVars = new Set(asArray(page.filterVars).map((item) => safeString(item.id)).filter(Boolean));
  const reportIds = new Set(asArray(outerResource && outerResource.ReportIds).map(safeString).filter(Boolean));
  const controlIds = new Set();
  const applyButtonIds = new Set();
  const dataFilterControls = [];
  const removeFilterControls = [];
  const pivotTableControls = [];
  const seenTempVars = new Set();
  for (const item of asArray(page.tempVars)) {
    const id = safeString(item.id);
    if (!id) issue(report, severity, "DASHBOARD_TEMPVAR_ID_MISSING", "Dashboard tempVars entries should include id.", { title, layoutId, item });
    else if (seenTempVars.has(id)) issue(report, severity, "DASHBOARD_TEMPVAR_ID_DUPLICATE", "Dashboard tempVars ids should be unique.", { title, layoutId, id });
    seenTempVars.add(id);
  }

  walk(page, (node, pointer) => {
    if (!isObject(node)) return;
    const controlId = safeString(node.id);
    if (controlId) controlIds.add(controlId);
    const controlType = safeString(node.type);
    if (controlType === "apply-button" && controlId) applyButtonIds.add(controlId);
    if (isDashboardDataFilterControlType(controlType)) {
      dataFilterControls.push({ pointer, controlId, controlType, binding: safeString(node.binding), attrs: node.attrs || {} });
    } else if (controlType === "remove-filters" || controlType === "remove-filers") {
      removeFilterControls.push({ pointer, controlId, controlType, attrs: node.attrs || {} });
    } else if (controlType === "data-list") {
      validateDashboardDataTableControl(node, title, layoutId, pointer, listsById, fieldsByList, report);
    } else if (controlType && /filter/i.test(controlType) && !isKnownNonDataFilterControlType(controlType)) {
      issue(report, "warning", "DASHBOARD_DATA_FILTER_TYPE_UNKNOWN", "Dashboard contains an unknown filter-like control type. Treat this as unproven until an export maps the schema.", { title, layoutId, pointer, controlType });
    }
    const binding = safeString(node.binding);
    if (binding && binding.startsWith("__filter_")) {
      const filterId = binding.replace(/^__filter_/, "");
      if (!filterVars.has(filterId)) {
        issue(report, severity, "DASHBOARD_FILTER_CONTROL_BINDING_UNRESOLVED", "Dashboard filter control binding should reference a filterVars id.", { title, layoutId, pointer, binding, filterId });
      }
    }
    const saveVar = node.attrs && node.attrs.save_var;
    const saveVarId = saveVar && safeString(saveVar.id).replace(/^__temp_/, "");
    if (saveVarId && !tempVars.has(saveVarId)) {
      issue(report, severity, "DASHBOARD_SAVE_VAR_UNRESOLVED", "Dashboard component save_var should reference a tempVars id.", { title, layoutId, pointer, saveVarId });
    }
    const dataList = node.attrs && node.attrs.data && node.attrs.data.list;
    if (dataList && safeString(dataList.ListID) && !listsById.has(safeString(dataList.ListID))) {
      issue(report, severity, "DASHBOARD_CONTROL_LIST_REFERENCE_UNRESOLVED", "Dashboard control data.list references a list not included in the package.", { title, layoutId, pointer, listId: safeString(dataList.ListID) });
    }
    if (node.attrs && node.attrs.data) {
      validateDashboardFilterConsumerRefs(title, layoutId, `${pointer}.attrs.data`, node.attrs.data, filterVars, report);
    }
    if (safeString(node.type) === "document-library") {
      validateDashboardDocLibraryControl(node, title, layoutId, pointer, listsById, fieldsByList, report);
    }
    if (safeString(node.type) === "pivot-table") {
      pivotTableControls.push({ pointer, controlId, control: node });
    }
    validateAdvancedControl(node, report, {
      surface: "dashboard",
      title,
      path: pointer,
      fieldsByName: null,
    });
    validateContainerButtonActionControl(node, title, layoutId, pointer, listsById, fieldsByList, rootPageLayouts, approvalFormsByKey, layoutsById, report);
    const dataForm = node.attrs && node.attrs.data && node.attrs.data.form;
    if (dataForm && safeString(dataForm.ListSetID) && safeString(dataForm.ListSetID) !== safeString(resource.ListSetID || (resource.Item && resource.Item.ListID)) && !listsById.has(safeString(dataForm.ListSetID))) {
      issue(report, report.mode === "generator" ? "error" : "dependency", "DASHBOARD_FORM_EXTERNAL_LISTSET_REFERENCE", "Dashboard action references a form/listset outside the package; generated dashboards should model or exclude external dependencies.", { title, layoutId, pointer, listSetId: safeString(dataForm.ListSetID), procKey: safeString(dataForm.ProcKey) });
    }
    const pageRef = node.type === "opendashboard" && node.attrs && node.attrs.data && node.attrs.data.page;
    if (pageRef && safeString(pageRef.PageID) && !rootPageLayouts.has(safeString(pageRef.PageID))) {
      issue(report, severity, "DASHBOARD_ACTION_PAGE_REFERENCE_UNRESOLVED", "Dashboard opendashboard action references a missing Type 103 page.", { title, layoutId, pointer, pageId: safeString(pageRef.PageID) });
    }
  });

  validateDashboardDataFilterControls(title, layoutId, filterVars, applyButtonIds, dataFilterControls, removeFilterControls, report);

  const pivotExtByControlId = new Map();
  asArray(page.exts).forEach((ext, index) => {
    const attr = ext && ext.attr;
    const extId = safeString(ext && ext.i);
    if (extId && !controlIds.has(extId)) {
      issue(report, severity, "DASHBOARD_EXT_CONTROL_REFERENCE_UNRESOLVED", "Dashboard ext i should reference a page control id.", { title, layoutId, index, extId });
    }
    if (extId && reportIds.size && !reportIds.has(extId)) {
      issue(report, severity, "DASHBOARD_EXT_REPORTID_MISSING", "Dashboard ext i should be included in Resource.ReportIds for import/runtime binding.", { title, layoutId, index, extId });
    }
    if (!isObject(attr)) {
      issue(report, severity, "DASHBOARD_EXT_ATTR_MISSING", "Dashboard ext entries should include attr configuration.", { title, layoutId, index });
      return;
    }
    if (safeString(ext && ext.key) === "PivotTable" || (safeString(ext && ext.category) === "___Pivot___" && pivotTableControls.some((control) => control.controlId === extId))) {
      pivotExtByControlId.set(extId, { ext, index });
    }
    validateDashboardListId(title, layoutId, `$.exts[${index}].attr.ListID`, attr.ListID, listsById, report);
    validateDashboardExtFieldRefs(title, layoutId, `$.exts[${index}]`, attr, fieldsByList, filterVars, report);
    walk(attr, (node, pointer) => {
      if (!isObject(node)) return;
      validateDashboardListId(title, layoutId, `$.exts[${index}].attr${pointer.slice(1)}.listid`, node.listid, listsById, report);
      validateDashboardListId(title, layoutId, `$.exts[${index}].attr${pointer.slice(1)}.ListID`, node.ListID, listsById, report);
    });
  });
  validateDashboardPivotTableControls(title, layoutId, pivotTableControls, pivotExtByControlId, listsById, fieldsByList, filterVars, report);
  validateDashboardCollectionControls(page, title, layoutId, listsById, fieldsByList, filterVars, report);
  validateDashboardFunctionalQuality(page, title, layoutId, report);
}

function validateAdvancedControl(control, report, context) {
  const type = safeString(control && control.type);
  if (!ADVANCED_CONTROL_TYPES.has(type)) return;
  const attrs = control.attrs && isObject(control.attrs) ? control.attrs : {};
  const severity = generatorFinalSeverity(report);
  const base = { surface: context.surface, title: context.title, path: context.path, controlType: type };
  const childType = ADVANCED_CONTAINER_CHILD_TYPES.get(type);
  if (childType) {
    const children = asArray(control.children).filter((child) => safeString(child.type) === childType);
    if (!children.length) issue(report, severity, `ADVANCED_${type === "aktabs" ? "TAB" : "TOGGLE"}_ITEMS_MISSING`, `${type === "aktabs" ? "Tab" : "Toggle"} controls should include ${childType} child containers.`, base);
    children.forEach((child, index) => {
      if (!safeString(child.id)) issue(report, severity, "ADVANCED_CONTAINER_ITEM_ID_MISSING", "Advanced Tab/Toggle child containers need stable ids.", { ...base, item: index + 1, childType });
      if (type === "aktabs" && !safeString(child.label)) issue(report, severity, "ADVANCED_TAB_ITEM_TITLE_MISSING", "Tab items should include a title/label.", { ...base, item: index + 1 });
      if (type === "toggle" && !safeString(child.attrs && child.attrs.title && child.attrs.title.value)) issue(report, severity, "ADVANCED_TOGGLE_SECTION_TITLE_MISSING", "Toggle sections should include attrs.title.value.", { ...base, item: index + 1 });
      if (!asArray(child.children).length) issue(report, "warning", "ADVANCED_CONTAINER_ITEM_EMPTY", "Advanced Tab/Toggle child containers should include nested controls.", { ...base, item: index + 1, childType });
    });
  }
  if (type === "timer" && !attrs.set && !attrs.date && !attrs.value && !attrs["obj-f"]) {
    issue(report, severity, "ADVANCED_TIMER_DATE_MISSING", "Timer controls should include static date settings or a dynamic date binding.", base);
  }
  if (type === "icon_list" && !advancedIconListItems(attrs).length) {
    issue(report, "warning", "ADVANCED_ICON_LIST_ITEMS_UNOBSERVED", "Icon list controls should include item configuration when generated; this export may store variants opaquely.", base);
  }
  if (type === "progress" || type === "progress-circle") {
    const value = attrs.value || attrs.per || attrs.percent || attrs.progress || attrs["current-value"];
    if (value === undefined || value === null || value === "") issue(report, severity, "ADVANCED_PROGRESS_VALUE_MISSING", "Progress bar/circle controls should include a static numeric value or dynamic numeric binding.", base);
    validateAdvancedFieldBinding(value, context.fieldsByName, ADVANCED_NUMERIC_FIELD_TYPES, report, base, "ADVANCED_PROGRESS_FIELD_TYPE_UNPROVEN", "Progress bar/circle bindings should resolve to numeric-compatible fields.");
  }
  if (type === "steps-bar") {
    if (!asArray(attrs["steps-options"]).length) issue(report, severity, "ADVANCED_STEPS_ITEMS_MISSING", "Steps bar controls should include steps-options entries.", base);
    const fieldBinding = attrs["obj-f"] || attrs["current-step"];
    validateAdvancedFieldBinding(fieldBinding, context.fieldsByName, ADVANCED_SINGLE_SELECT_FIELD_TYPES, report, base, "ADVANCED_STEPS_FIELD_TYPE_UNPROVEN", "Field-bound Steps bar controls should resolve to single-select/status fields.");
  }
  if ((type === "list-qrcode" || type === "qrcode") && !attrs.value && !attrs.url && !attrs.source && !attrs["qr-source"] && !attrs["qr-code-link"]) {
    issue(report, "warning", "ADVANCED_QR_VALUE_IMPLICIT", "QR Code has no explicit URL/value; treat current page/form/item URL behavior as host-sensitive until runtime-proven.", base);
  }
  if (type === "barcode") {
    if (!attrs.value) issue(report, severity, "ADVANCED_BARCODE_VALUE_MISSING", "Barcode controls should include a static value or dynamic value binding.", base);
    const barcodeType = safeString(attrs.type);
    if (barcodeType && !ADVANCED_BARCODE_TYPES.has(barcodeType)) issue(report, "warning", "ADVANCED_BARCODE_TYPE_UNPROVEN", "Barcode type is not in the export-backed supported set.", { ...base, barcodeType });
  }
  if (type === "embed" && !attrs.code && !attrs.src && !attrs.url) {
    issue(report, severity, "ADVANCED_EMBED_SOURCE_MISSING", "Embed controls should include iframe/code/src/url configuration.", base);
  }
  if (type === "document-embed") {
    if (!attrs["doc-source"]) issue(report, severity, "ADVANCED_DOCUMENT_EMBED_SOURCE_MISSING", "Document embed controls should bind to an attachment/file field.", base);
    validateAdvancedFieldBinding(attrs["doc-source"], context.fieldsByName, ADVANCED_FILE_FIELD_TYPES, report, base, "ADVANCED_DOCUMENT_EMBED_FIELD_TYPE_UNPROVEN", "Document embed controls should bind to file/image attachment fields.");
  }
}

function validateAdvancedFieldBinding(value, fieldsByName, allowedTypes, report, context, code, message) {
  if (!fieldsByName || value === undefined || value === null || value === "") return;
  const fieldName = advancedFieldName(value);
  if (!fieldName) return;
  const field = fieldsByName.get(fieldName);
  if (!field) {
    issue(report, generatorFinalSeverity(report), "ADVANCED_FIELD_BINDING_UNRESOLVED", "Advanced control field binding should resolve to a field on the host form/list.", { ...context, fieldName });
    return;
  }
  const fieldType = safeString(field.Type);
  if (fieldType && !allowedTypes.has(fieldType)) issue(report, generatorFinalSeverity(report), code, message, { ...context, fieldName, fieldType });
}

function advancedIconListItems(attrs) {
  if (Array.isArray(attrs.items)) return attrs.items;
  if (Array.isArray(attrs.options)) return attrs.options;
  if (Array.isArray(attrs.data)) return attrs.data;
  if (attrs.data && Array.isArray(attrs.data.links)) return attrs.data.links;
  return [];
}

function advancedFieldName(value) {
  if (typeof value === "string") return value;
  let found = "";
  walk(value, (node) => {
    if (found || !isObject(node) || safeString(node.type) !== "expr") return;
    if (safeString(node.exprType) !== "list_field") return;
    found = safeString(node.prop || node.id);
  });
  return found;
}

function validateContainerButtonActionControl(node, title, layoutId, pointer, listsById, fieldsByList, rootPageLayouts, approvalFormsByKey, layoutsById, report) {
  if (!node || !["container", "button", "action_button"].includes(safeString(node.type))) return;
  const attrs = node.attrs;
  if (!attrs || !Object.prototype.hasOwnProperty.call(attrs, "action-type")) return;
  const severity = generatorFinalSeverity(report);
  const controlType = safeString(node.type);
  const actionType = safeString(attrs["action-type"]);
  const knownActionTypes = new Set(["1", "2", "5", "6", "8"]);
  const knownOpenModes = new Set(["", "modal", "slide", "target", "new"]);
  const knownModalSizes = new Set(["0", "1", "2", "3", "9"]);
  if (!knownActionTypes.has(actionType)) {
    issue(report, report.mode === "generator" ? "error" : "warning", "CONTAINER_BUTTON_ACTION_TYPE_UNKNOWN", "Container/Button action-type should be one of the export-proven action codes: 1 form action, 2 Link, 5 Add list item, 6 Open dashboard, 8 Open approval form.", { title, layoutId, pointer, controlType, actionType });
  }
  const op = safeString(attrs.op);
  if (!knownOpenModes.has(op)) {
    issue(report, report.mode === "generator" ? "error" : "warning", "CONTAINER_BUTTON_ACTION_OPEN_MODE_UNKNOWN", "Container/Button open behavior should use an export-proven op value: empty/default, modal, slide, target, or new.", { title, layoutId, pointer, controlType, actionType, op });
  }
  if (attrs.modalsize !== undefined && !knownModalSizes.has(safeString(attrs.modalsize))) {
    issue(report, report.mode === "generator" ? "error" : "warning", "CONTAINER_BUTTON_ACTION_SIZE_UNKNOWN", "Container/Button modal size should use an export-proven value. Custom size uses modalsize 9 with cusize.", { title, layoutId, pointer, controlType, actionType, modalsize: attrs.modalsize });
  }
  if (safeString(attrs.modalsize) === "9" && attrs.cusize !== undefined && !isObject(attrs.cusize)) {
    issue(report, severity, "CONTAINER_BUTTON_ACTION_CUSTOM_SIZE_INVALID", "Container/Button custom size should be an object such as { w } or { w, wu } when modalsize is 9.", { title, layoutId, pointer, controlType, actionType });
  }

  if (actionType === "2") {
    const link = attrs.link;
    const hasUrl = typeof link?.url === "string" && link.url.trim();
    const hasVariable = Array.isArray(link?.variable) && link.variable.length > 0;
    if (!isObject(link) || (!hasUrl && !hasVariable)) {
      issue(report, severity, "CONTAINER_BUTTON_LINK_TARGET_MISSING", "Link actions should include attrs.link with a literal URL or a URL expression variable.", { title, layoutId, pointer, controlType });
    }
    return;
  }

  if (actionType === "5") {
    const listId = safeString(attrs.data && attrs.data.list && attrs.data.list.ListID);
    if (!listId) {
      issue(report, severity, "CONTAINER_BUTTON_ADD_LIST_TARGET_MISSING", "Add list item actions should include attrs.data.list.ListID.", { title, layoutId, pointer, controlType });
    } else if (!listsById.has(listId)) {
      issue(report, severity, "CONTAINER_BUTTON_ADD_LIST_TARGET_UNRESOLVED", "Add list item actions must reference an included Data List or Document Library when generated for this app.", { title, layoutId, pointer, controlType, listId });
    }
    const actionLayoutId = safeString(attrs.layout);
    if (actionLayoutId && !layoutsById.has(actionLayoutId)) {
      issue(report, severity, "CONTAINER_BUTTON_ADD_LIST_LAYOUT_UNRESOLVED", "Add list item layout should resolve to a target list/document-library form layout when present.", { title, layoutId, pointer, controlType, actionLayoutId });
    }
    for (const [index, passvalue] of asArray(attrs.passvalues).entries()) {
      const fieldName = safeString(passvalue && passvalue.Name);
      if (fieldName && listId && fieldsByList.has(listId) && !fieldsByList.get(listId).has(fieldName)) {
        issue(report, severity, "CONTAINER_BUTTON_PASSVALUE_FIELD_UNRESOLVED", "Container/Button Add list item passvalues must reference fields on the target list.", { title, layoutId, pointer: `${pointer}.attrs.passvalues[${index}]`, controlType, listId, fieldName });
      }
    }
    return;
  }

  if (actionType === "6") {
    const pageId = safeString(attrs.data && attrs.data.page && attrs.data.page.PageID);
    if (!pageId) {
      issue(report, severity, "CONTAINER_BUTTON_OPEN_DASHBOARD_TARGET_MISSING", "Open dashboard actions should include attrs.data.page.PageID.", { title, layoutId, pointer, controlType });
    } else if (!rootPageLayouts.has(pageId)) {
      issue(report, severity, "CONTAINER_BUTTON_OPEN_DASHBOARD_TARGET_UNRESOLVED", "Open dashboard actions must reference an included Type 103 dashboard when generated for this app.", { title, layoutId, pointer, controlType, pageId });
    }
    return;
  }

  if (actionType === "8") {
    const procKey = safeString(attrs.data && attrs.data.form && attrs.data.form.ProcKey);
    if (!procKey) {
      issue(report, severity, "CONTAINER_BUTTON_OPEN_APPROVAL_FORM_TARGET_MISSING", "Open approval form actions should include attrs.data.form.ProcKey.", { title, layoutId, pointer, controlType });
    } else if (!approvalFormsByKey.has(procKey)) {
      issue(report, severity, "CONTAINER_BUTTON_OPEN_APPROVAL_FORM_TARGET_UNRESOLVED", "Open approval form actions must reference an included approval form when generated for this app.", { title, layoutId, pointer, controlType, procKey });
    }
    return;
  }

  if (actionType === "1" && !safeString(attrs.control_action || attrs.action || attrs["control_action"])) {
    issue(report, report.mode === "generator" ? "error" : "warning", "CONTAINER_BUTTON_FORM_ACTION_TARGET_MISSING", "Form action binding actions should include an action/control_action reference.", { title, layoutId, pointer, controlType });
  }
}

function isDashboardDataFilterControlType(type) {
  return [
    "search-filter",
    "select-filter",
    "check-filter",
    "checkbox-filter",
    "radio-filter",
    "range-filter",
    "check-range",
    "date-filter",
    "relative-period",
    "hierarchy-filter",
    "sorting-filter",
    "sorting-filters",
  ].includes(safeString(type));
}

function isKnownNonDataFilterControlType(type) {
  return [
    "filter",
    "data-list",
    "document-library",
    "collection",
    "pivot-table",
    "pie-chart",
    "bar-chart",
    "line-chart",
  ].includes(safeString(type));
}

function collectFilterVariableRefs(value) {
  const refs = [];
  walk(value, (node, pointer) => {
    if (!isObject(node)) return;
    const id = safeString(node.id);
    const name = safeString(node.name);
    if (id.startsWith("__filter_") || (node.exprType === "variable" && name.startsWith("filter_"))) {
      refs.push({ pointer, id, name: name || id.replace(/^__filter_/, "") });
    }
  });
  return refs;
}

function validateDashboardFilterConsumerRefs(title, layoutId, pointer, data, filterVars, report) {
  const severity = generatorFinalSeverity(report);
  for (const [fulltextIndex, item] of asArray(data.fulltext).entries()) {
    for (const ref of collectFilterVariableRefs(item.value)) {
      if (ref.name && !filterVars.has(ref.name)) {
        issue(report, severity, "DASHBOARD_FULLTEXT_FILTER_VARIABLE_UNRESOLVED", "Dashboard fulltext filter expression should reference a page filterVars id.", { title, layoutId, pointer: `${pointer}.fulltext[${fulltextIndex}].value${ref.pointer.slice(1)}`, filterVar: ref.name });
      }
      if (ref.name && ref.id && ref.id !== `__filter_${ref.name}`) {
        issue(report, severity, "DASHBOARD_FULLTEXT_FILTER_VARIABLE_ID_MISMATCH", "Dashboard fulltext filter expression id should use the __filter_ prefix plus the filter variable name.", { title, layoutId, pointer: `${pointer}.fulltext[${fulltextIndex}].value${ref.pointer.slice(1)}`, id: ref.id, expected: `__filter_${ref.name}` });
      }
    }
  }
  for (const [sortIndex, ref] of collectFilterVariableRefs(data.sortingfilter).entries()) {
    if (ref.name && !filterVars.has(ref.name)) {
      issue(report, severity, "DASHBOARD_SORTING_FILTER_VARIABLE_UNRESOLVED", "Dashboard sortingfilter expression should reference a page filterVars id.", { title, layoutId, pointer: `${pointer}.sortingfilter[${sortIndex}]`, filterVar: ref.name });
    }
    if (ref.name && ref.id && ref.id !== `__filter_${ref.name}`) {
      issue(report, severity, "DASHBOARD_SORTING_FILTER_VARIABLE_ID_MISMATCH", "Dashboard sortingfilter expression id should use the __filter_ prefix plus the filter variable name.", { title, layoutId, pointer: `${pointer}.sortingfilter[${sortIndex}]`, id: ref.id, expected: `__filter_${ref.name}` });
    }
  }
}

function validateDashboardDataFilterControls(title, layoutId, filterVars, applyButtonIds, dataFilterControls, removeFilterControls, report) {
  const severity = generatorFinalSeverity(report);
  for (const control of dataFilterControls) {
    const filterVar = control.binding.startsWith("__filter_") ? control.binding.slice("__filter_".length) : "";
    if (!filterVar) {
      issue(report, severity, "DASHBOARD_DATA_FILTER_VARIABLE_MISSING", "Dashboard Data Filter controls should bind to a page filter variable with binding = __filter_<filterVarId>.", { title, layoutId, pointer: control.pointer, controlId: control.controlId, controlType: control.controlType });
    } else if (!filterVars.has(filterVar)) {
      issue(report, severity, "DASHBOARD_DATA_FILTER_VARIABLE_UNRESOLVED", "Dashboard Data Filter control binding must resolve to page.filterVars.", { title, layoutId, pointer: control.pointer, controlId: control.controlId, controlType: control.controlType, filterVar });
    }
    const applyType = safeString(control.attrs.apply_t || control.attrs.applyType);
    const applyButton = safeString(control.attrs.apply_btn || control.attrs.applyButton);
    if (applyType === "2") {
      if (!applyButton) {
        issue(report, severity, "DASHBOARD_DATA_FILTER_CLICK_APPLY_BUTTON_MISSING", "Click-on-apply Data Filter controls should reference an Apply button control.", { title, layoutId, pointer: control.pointer, controlId: control.controlId, filterVar });
      } else if (!applyButtonIds.has(applyButton)) {
        issue(report, severity, "DASHBOARD_DATA_FILTER_APPLY_BUTTON_UNRESOLVED", "Data Filter apply_btn should reference an existing apply-button control id.", { title, layoutId, pointer: control.pointer, controlId: control.controlId, filterVar, applyButton });
      }
    } else if (applyType && !["1", "2"].includes(applyType)) {
      issue(report, "warning", "DASHBOARD_DATA_FILTER_APPLY_TYPE_UNKNOWN", "Data Filter apply type is not one of the export/documented values 1 or 2. Treat as unproven.", { title, layoutId, pointer: control.pointer, controlId: control.controlId, applyType });
    }
  }
  for (const control of removeFilterControls) {
    const refs = collectFilterVariableRefs(control.attrs);
    for (const ref of refs) {
      if (ref.name && !filterVars.has(ref.name)) {
        issue(report, severity, "DASHBOARD_REMOVE_FILTERS_VARIABLE_UNRESOLVED", "Remove filters reset targets should resolve to page.filterVars when explicit targets are configured.", { title, layoutId, pointer: `${control.pointer}.attrs${ref.pointer.slice(1)}`, controlId: control.controlId, filterVar: ref.name });
      }
    }
    if (!refs.length) {
      issue(report, "warning", "DASHBOARD_REMOVE_FILTERS_TARGETS_UNSPECIFIED", "Remove filters control has no export-visible explicit reset targets; treat clear-all vs selected-reset behavior as runtime-sensitive.", { title, layoutId, pointer: control.pointer, controlId: control.controlId, controlType: control.controlType });
    }
  }
}

function dashboardTextValue(node) {
  if (!isObject(node)) return "";
  const attrs = node.attrs || {};
  return safeString(
    attrs.value ??
    (attrs.headc && attrs.headc.title && attrs.headc.title.value) ??
    (attrs.layout && attrs.layout.title && attrs.layout.title.value) ??
    node.label ??
    node.nv_label ??
    ""
  );
}

function validateDashboardFunctionalQuality(page, title, layoutId, report) {
  const severity = generatorFinalSeverity(report);
  const counts = { summary: 0, dataList: 0, collection: 0, chart: 0 };
  const allText = [];

  function visit(node, pointer, contextLabels) {
    if (!isObject(node)) return;
    const ownLabel = [node.type, node.label, node.nv_label, dashboardTextValue(node)].map(safeString).filter(Boolean).join(" ");
    const context = `${contextLabels} ${ownLabel}`;
    const type = safeString(node.type);
    if (type === "summary") counts.summary += 1;
    if (type === "data-list") counts.dataList += 1;
    if (type === "collection") counts.collection += 1;
    if (["pie-chart", "bar-chart", "line-chart"].includes(type)) counts.chart += 1;

    const textValue = dashboardTextValue(node);
    if (textValue) allText.push(textValue);
    if (["heading", "text-editor", "text"].includes(type) && /(^|>|\s)(0|0\.00|N\/A)(\s|<|$)/i.test(textValue) && /\b(kpi|summary|card|metric|queue|operations|reporting|trend|chart)\b/i.test(context)) {
      issue(report, severity, "DASHBOARD_STATIC_KPI_PLACEHOLDER", "Dashboard KPI/summary-like sections must not use static Text controls for values such as 0, 0.00, or N/A. Use a Summary control or a data-bound fallback.", { title, layoutId, pointer, text: textValue.slice(0, 120), context: context.slice(0, 240) });
    }
    asArray(node.children).forEach((child, index) => visit(child, `${pointer}.children[${index}]`, context));
  }

  visit(page, "$", "");
  const joined = allText.join(" \n ");
  const hasQueueLanguage = /\b(queue|queues|pending hr|pending finance|needs my action|returned requests|expiry follow-up)\b/i.test(joined);
  const hasReportingLanguage = /\b(advanced reporting|reporting|analytics|trend|ranking|chart)\b/i.test(joined);
  const hasChartLanguage = /\b(pie chart|column chart|line chart|trend|by status|by product type|self vs family|custom vs standard)\b/i.test(joined);

  if (/hr operations/i.test(title) && counts.summary === 0) {
    issue(report, severity, "DASHBOARD_HR_OPERATIONS_NO_SUMMARY_CONTROLS", "HR Operations dashboards must use real Summary controls for KPI cards; static text KPI cards are not acceptable.", { title, layoutId });
  }
  if (hasQueueLanguage && counts.dataList + counts.collection === 0) {
    issue(report, severity, "DASHBOARD_QUEUES_NOT_DATA_BOUND", "Dashboard queue/operations sections must use Collection or data-list controls, not only explanatory text.", { title, layoutId, dataListControls: counts.dataList, collectionControls: counts.collection });
  }
  if (hasReportingLanguage && counts.summary + counts.dataList + counts.collection + counts.chart === 0) {
    issue(report, severity, "DASHBOARD_REPORTING_NOT_FUNCTIONAL", "Dashboard reporting/analytics sections must contain Summary, chart, Collection, or data-list controls.", { title, layoutId });
  }
  if (hasChartLanguage && counts.chart === 0 && counts.dataList + counts.collection === 0) {
    issue(report, severity, "DASHBOARD_CHARTS_NO_CONTROL_OR_FALLBACK", "Dashboard chart/trend language requires real chart controls or a functional data-list/Collection fallback.", { title, layoutId });
  }
}

function dynamicFieldTypeIssue(controlType) {
  if (controlType === "dynamic-user") return { code: "DYNAMIC_USER_FIELD_TYPE_MISMATCH", message: "Dynamic user controls should bind to user/person fields.", allowed: DYNAMIC_USER_FIELD_TYPES };
  if (controlType === "dynamic-image") return { code: "DYNAMIC_IMAGE_FIELD_TYPE_MISMATCH", message: "Dynamic image controls should bind to image fields.", allowed: DYNAMIC_IMAGE_FIELD_TYPES };
  if (controlType === "dynamic-file") return { code: "DYNAMIC_FILE_FIELD_TYPE_MISMATCH", message: "Dynamic file controls should bind to attachment/file fields.", allowed: DYNAMIC_FILE_FIELD_TYPES };
  return null;
}

function fieldControlType(field) {
  return safeString(field && (field.Type || field.FieldType));
}

function validateDynamicFieldType(controlType, field, report, severity, context) {
  if (!field) return;
  const mismatch = dynamicFieldTypeIssue(controlType);
  const sourceType = fieldControlType(field);
  if (mismatch && sourceType && !mismatch.allowed.has(sourceType)) {
    issue(report, severity, mismatch.code, mismatch.message, { ...context, sourceType, fieldName: safeString(field.FieldName), fieldDisplayName: safeString(field.DisplayName) });
  }
  if (controlType === "dynamic-field" && sourceType && (DYNAMIC_USER_FIELD_TYPES.has(sourceType) || DYNAMIC_IMAGE_FIELD_TYPES.has(sourceType) || DYNAMIC_FILE_FIELD_TYPES.has(sourceType))) {
    issue(report, "warning", "DYNAMIC_FIELD_SPECIALIZED_CONTROL_RECOMMENDED", "Dynamic field can display general values; for user/image/file fields prefer the specialized Dynamic user/image/file control when generating new layouts.", { ...context, sourceType, fieldName: safeString(field.FieldName), fieldDisplayName: safeString(field.DisplayName) });
  }
}

function validateDashboardCollectionControls(page, title, layoutId, listsById, fieldsByList, filterVars, report) {
  const severity = generatorFinalSeverity(report);
  const seenControlIds = new Set();
  const pageTempVars = new Set(asArray(page && page.tempVars).map((variable) => safeString(variable && variable.id)).filter(Boolean));
  const pageActionIds = new Set(asArray(page && page.actions).map((action) => safeString(action && action.id)).filter(Boolean));
  const hostContexts = [];
  function isDeclaredPageVariable(id, name) {
    const rawId = safeString(id);
    const rawName = safeString(name);
    if (!rawId && !rawName) return true;
    if (rawId.startsWith("__filter_")) return filterVars.has(rawId.slice("__filter_".length)) || filterVars.has(rawName);
    if (rawId.startsWith("__temp_")) return pageTempVars.has(rawId.slice("__temp_".length)) || pageTempVars.has(rawName);
    return pageTempVars.has(rawId) || pageTempVars.has(rawName) || filterVars.has(rawId) || filterVars.has(rawName);
  }
  function validateExpressionNode(node, pointer, itemContext) {
    if (!isObject(node)) return;
    if (node.exprType === "variable_ctx" && (node.ctx === "__ctx_coll" || node.ctx === "__ctx_kanban" || node.ctx === "__ctx_timeline")) {
      if (!itemContext) {
        issue(report, severity, "DASHBOARD_ITEM_CONTEXT_EXPR_OUTSIDE_TEMPLATE", "Collection/Kanban/Timeline item expressions should be nested inside an item template.", { title, layoutId, pointer, ctx: safeString(node.ctx), field: safeString(node.id) });
        return;
      }
      const fieldName = safeString(node.id);
      if (fieldName && fieldName !== "_cate" && fieldName !== "ListDataID" && !itemContext.fields.has(fieldName)) {
        issue(report, severity, "DASHBOARD_ITEM_EXPR_FIELD_UNRESOLVED", "Collection/Kanban/Timeline item expression references a field not present on the source list.", { title, layoutId, pointer, host: itemContext.host, listId: itemContext.listId, fieldName });
      }
    }
    if (node.exprType === "variable" && safeString(node.id).startsWith("__filter_")) {
      const name = safeString(node.name);
      const expectedId = name ? `__filter_${name}` : "";
      if (name && !filterVars.has(name)) {
        issue(report, severity, "DASHBOARD_COLLECTION_FILTER_VARIABLE_UNRESOLVED", "Collection filter expression should reference a page filterVars id.", { title, layoutId, pointer, filterVar: name });
      }
      if (expectedId && safeString(node.id) !== expectedId) {
        issue(report, severity, "DASHBOARD_COLLECTION_FILTER_VARIABLE_ID_MISMATCH", "Collection filter expression id should use the __filter_ prefix plus the filter variable name.", { title, layoutId, pointer, id: safeString(node.id), expected: expectedId });
      }
    } else if (node.exprType === "variable" && safeString(node.id).startsWith("__temp_") && !isDeclaredPageVariable(node.id, node.name)) {
      issue(report, severity, "DASHBOARD_PAGE_VARIABLE_UNRESOLVED", "Dashboard action or dynamic display expression references a temp/page variable not declared on the page.", { title, layoutId, pointer, id: safeString(node.id), name: safeString(node.name) });
    }
  }

  function validateControlDisplay(control, pointer, itemContext) {
    for (const [index, rule] of asArray(control.attrs && control.attrs.control_display).entries()) {
      walk(rule.formulas, (node, formulaPointer) => validateExpressionNode(node, `${pointer}.attrs.control_display[${index}].formulas${formulaPointer.slice(1)}`, itemContext));
      const ruleControlId = safeString(rule.controlId);
      const controlId = safeString(control.id);
      if (ruleControlId && controlId && ruleControlId !== controlId) {
        issue(report, severity, "DASHBOARD_COLLECTION_DISPLAY_RULE_CONTROL_MISMATCH", "Collection dynamic display rule controlId should match the target control id.", { title, layoutId, pointer: `${pointer}.attrs.control_display[${index}].controlId`, controlId, ruleControlId });
      }
      const action = rule.actions || {};
      const actionAttrs = action.attrs || {};
      const regulationAction = safeString(actionAttrs.style_regulation_action);
      const actionStyle = actionAttrs.action_style;
      if (safeString(action.type) && safeString(action.type) !== "1") {
        issue(report, severity, "DASHBOARD_COLLECTION_DISPLAY_ACTION_TYPE_UNSUPPORTED", "Collection dynamic display actions should use the studied action type 1.", { title, layoutId, pointer: `${pointer}.attrs.control_display[${index}].actions.type`, actionType: action.type });
      }
      if (regulationAction === "style_class") {
        if (typeof actionStyle !== "string" || !actionStyle.trim()) {
          issue(report, severity, "DASHBOARD_COLLECTION_STYLE_ACTION_MISSING", "Collection conditional style action should include action_style JSON.", { title, layoutId, pointer: `${pointer}.attrs.control_display[${index}].actions.attrs.action_style` });
        } else if (!tryParseJson(actionStyle)) {
          issue(report, severity, "DASHBOARD_COLLECTION_STYLE_ACTION_JSON_INVALID", "Collection conditional style action_style should be valid JSON.", { title, layoutId, pointer: `${pointer}.attrs.control_display[${index}].actions.attrs.action_style` });
        }
      } else if (regulationAction === "style_regulation_action_show") {
        if (actionStyle !== null && actionStyle !== undefined) {
          issue(report, severity, "DASHBOARD_COLLECTION_SHOW_ACTION_STYLE_NOT_NULL", "Collection show dynamic display action should keep action_style null.", { title, layoutId, pointer: `${pointer}.attrs.control_display[${index}].actions.attrs.action_style` });
        }
      } else if (regulationAction) {
        issue(report, severity, "DASHBOARD_COLLECTION_DISPLAY_ACTION_UNSTUDIED", "Collection dynamic display rule uses an unstudied style_regulation_action.", { title, layoutId, pointer: `${pointer}.attrs.control_display[${index}].actions.attrs.style_regulation_action`, regulationAction });
      }
    }
  }

  function collectVariableCtxFieldIds(value) {
    const fields = [];
    const visit = (node) => {
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      if (!isObject(node)) return;
      if (node.exprType === "variable_ctx" && safeString(node.id)) fields.push(safeString(node.id));
      Object.values(node).forEach(visit);
    };
    visit(value);
    return fields;
  }

  function makeHostContext(host, listId) {
    const fields = fieldsByList.get(listId) || new Map();
    const sourceList = listsById.get(listId);
    const layouts = new Set(asArray(sourceList && sourceList.item && sourceList.item.Layouts).map((layout) => safeString(layout.LayoutID)).filter(Boolean));
    return { host, listId, fields, layouts };
  }

  function actionStepContext(step, fallbackContext) {
    const listId = safeString(step && step.attrs && step.attrs.data && step.attrs.data.list && step.attrs.data.list.ListID);
    if (listId && listsById.has(listId)) return makeHostContext("page-action", listId);
    return fallbackContext;
  }

  function validateCollectionActionStep(step, stepPath, hostContext, localActionIds) {
    if (!isObject(step)) {
      issue(report, severity, "DASHBOARD_COLLECTION_ACTION_STEP_BAD_SHAPE", "Collection/Kanban action steps should be objects.", { title, layoutId, pointer: stepPath });
      return;
    }
    const stepType = safeString(step.type);
    const allowedStepTypes = new Set(["listitem", "deleteitem", "setdatalist", "setvar", "confirm", "otheraction", "redirect", "close", "aiassistant", "barcode", "nfc"]);
    if (!stepType) {
      issue(report, severity, "DASHBOARD_COLLECTION_ACTION_STEP_TYPE_MISSING", "Collection/Kanban action steps should include type.", { title, layoutId, pointer: `${stepPath}.type` });
    } else if (!allowedStepTypes.has(stepType)) {
      issue(report, "warning", "DASHBOARD_COLLECTION_ACTION_STEP_TYPE_UNSTUDIED", "Collection/Kanban action step type is not covered by current export-backed validation.", { title, layoutId, pointer: `${stepPath}.type`, stepType });
    }
    const stepContext = stepType === "otheraction" ? null : hostContext;
    walk(step, (node, pointer) => validateExpressionNode(node, `${stepPath}${pointer.slice(1)}`, stepContext));
    const attrs = step.attrs || {};
    if (stepType === "listitem") {
      const opType = safeString(attrs.op_type);
      if (!["view", "edit"].includes(opType)) issue(report, "warning", "DASHBOARD_COLLECTION_LISTITEM_OP_UNSTUDIED", "Collection item Open item form step is export-proven for edit in this study; view is UI-reference-backed.", { title, layoutId, pointer: `${stepPath}.attrs.op_type`, opType });
      const listDataIdTokens = asArray(attrs.listdataid);
      if (!listDataIdTokens.some((token) => isObject(token) && token.exprType === "variable_ctx" && token.ctx === "__ctx_coll" && token.id === "ListDataID")) {
        issue(report, severity, "DASHBOARD_COLLECTION_LISTITEM_ID_CONTEXT_MISSING", "Collection item open/edit step should pass current item ListDataID through __ctx_coll.", { title, layoutId, pointer: `${stepPath}.attrs.listdataid` });
      }
      const layout = safeString(attrs.layout);
      if (layout && hostContext && !hostContext.layouts.has(layout)) {
        issue(report, severity, "DASHBOARD_COLLECTION_LISTITEM_LAYOUT_UNRESOLVED", "Collection item open/edit step references a layout not present on the source list.", { title, layoutId, pointer: `${stepPath}.attrs.layout`, targetLayout: layout });
      }
    }
    if (stepType === "setdatalist") {
      const opType = safeString(attrs.type);
      if (!["edit", "remove", "add"].includes(opType)) issue(report, "warning", "DASHBOARD_COLLECTION_SETDATALIST_OP_UNSTUDIED", "Collection action Set data list step uses an unstudied operation type.", { title, layoutId, pointer: `${stepPath}.attrs.type`, opType });
      for (const [index, where] of asArray(attrs.wheres).entries()) {
        const left = safeString(where && where.left);
        if (left && left !== "ListDataID" && hostContext && !hostContext.fields.has(left)) {
          issue(report, severity, "DASHBOARD_COLLECTION_SETDATALIST_WHERE_FIELD_UNRESOLVED", "Collection action Set data list filter field does not resolve on the source list.", { title, layoutId, pointer: `${stepPath}.attrs.wheres[${index}].left`, fieldName: left });
        }
      }
      for (const [index, row] of asArray(attrs.listdatas).entries()) {
        const fieldName = safeString(row && row.Columns);
        if (fieldName && hostContext && !hostContext.fields.has(fieldName)) {
          issue(report, severity, "DASHBOARD_COLLECTION_UPDATE_FIELD_UNRESOLVED", "Collection action Update fields target does not resolve on the source list.", { title, layoutId, pointer: `${stepPath}.attrs.listdatas[${index}].Columns`, fieldName });
        }
      }
      if (attrs.totalcount && !isDeclaredPageVariable(attrs.totalcount, attrs.totalcount)) {
        issue(report, severity, "DASHBOARD_COLLECTION_TOTALCOUNT_VARIABLE_UNRESOLVED", "Collection bulk Set data list totalcount target should resolve to a declared page temp variable.", { title, layoutId, pointer: `${stepPath}.attrs.totalcount`, totalcount: safeString(attrs.totalcount) });
      }
    }
    if (stepType === "setvar") {
      const entries = attrs.setvar_multi === true ? asArray(attrs.setvar_array) : [{ var: attrs.setvar_var, value: attrs.setvar_val }];
      entries.forEach((entry, index) => {
        const target = entry && entry.var;
        if (!isObject(target) || !isDeclaredPageVariable(target.id, target.name)) {
          issue(report, severity, "DASHBOARD_COLLECTION_SETVAR_TARGET_UNRESOLVED", "Collection action Set variables target should resolve to a declared dashboard/page variable.", { title, layoutId, pointer: `${stepPath}.attrs.setvar${attrs.setvar_multi === true ? `_array[${index}]` : "_var"}` });
        }
      });
    }
    if (stepType === "otheraction") {
      const target = safeString(attrs.control_action);
      if (target && !localActionIds.has(target) && !pageActionIds.has(target)) {
        issue(report, severity, "DASHBOARD_COLLECTION_OTHERACTION_TARGET_UNRESOLVED", "Collection action Start another action step should resolve to a local Collection/Kanban action or page action.", { title, layoutId, pointer: `${stepPath}.attrs.control_action` });
      }
    }
  }

  function validateCollectionActions(control, pointer, hostContext) {
    const actions = control.attrs && control.attrs.actions;
    if (actions === undefined) return;
    if (!Array.isArray(actions)) {
      issue(report, severity, "DASHBOARD_COLLECTION_ACTIONS_NOT_ARRAY", "Collection/Kanban local actions should be stored as attrs.actions[].", { title, layoutId, pointer: `${pointer}.attrs.actions`, controlType: control.type });
      return;
    }
    const localActionIds = new Set(actions.map((action) => safeString(action && action.id)).filter(Boolean));
    actions.forEach((action, actionIndex) => {
      const actionPath = `${pointer}.attrs.actions[${actionIndex}]`;
      if (!isObject(action)) {
        issue(report, severity, "DASHBOARD_COLLECTION_ACTION_BAD_SHAPE", "Collection/Kanban local action entries should be objects.", { title, layoutId, pointer: actionPath });
        return;
      }
      if (safeString(action.type) !== "coll") issue(report, "warning", "DASHBOARD_COLLECTION_ACTION_TYPE_UNEXPECTED", "Collection/Kanban local actions are export-proven with type = coll.", { title, layoutId, pointer: `${actionPath}.type`, actionType: safeString(action.type) });
      if (!safeString(action.id)) issue(report, severity, "DASHBOARD_COLLECTION_ACTION_ID_MISSING", "Collection/Kanban local actions should include id for item-template binding.", { title, layoutId, pointer: `${actionPath}.id` });
      if (!safeString(action.name)) issue(report, "warning", "DASHBOARD_COLLECTION_ACTION_NAME_MISSING", "Collection/Kanban local actions should include a readable name.", { title, layoutId, pointer: `${actionPath}.name` });
      if (!asArray(action.steps).length) issue(report, severity, "DASHBOARD_COLLECTION_ACTION_STEPS_EMPTY", "Collection/Kanban local actions should include at least one step.", { title, layoutId, pointer: `${actionPath}.steps` });
      asArray(action.steps).forEach((step, stepIndex) => validateCollectionActionStep(step, `${actionPath}.steps[${stepIndex}]`, hostContext, localActionIds));
    });
    walkControls(control, (node, nodePointer) => {
      const ref = safeString(node.attrs && node.attrs.control_action);
      if (!ref) return;
      if (!localActionIds.has(ref)) {
        issue(report, severity, "DASHBOARD_COLLECTION_ACTION_BINDING_UNRESOLVED", "Item-template buttons/containers/icons inside Collection/Kanban should bind to local attrs.actions[].id.", { title, layoutId, pointer: `${pointer}${nodePointer.slice(1)}.attrs.control_action`, controlType: node.type, label: safeString(node.label || node.nv_label) });
      }
    });
  }

  function validateDashboardPageActions() {
    const fallbackContext = hostContexts[0] || null;
    asArray(page && page.actions).forEach((action, actionIndex) => {
      const actionPath = `$.actions[${actionIndex}]`;
      if (!isObject(action)) return;
      asArray(action.steps).forEach((step, stepIndex) => {
        validateCollectionActionStep(step, `${actionPath}.steps[${stepIndex}]`, actionStepContext(step, fallbackContext), new Set());
      });
    });
    const onLoad = safeString(page && page.formAction && page.formAction.onLoad);
    if (onLoad && !pageActionIds.has(onLoad)) {
      issue(report, severity, "DASHBOARD_PAGE_ONLOAD_ACTION_UNRESOLVED", "Dashboard page onLoad action should resolve to a page-level action id.", { title, layoutId, pointer: "$.formAction.onLoad" });
    }
  }

  function visit(control, pointer, itemContext) {
    if (!isObject(control)) return;
    const controlId = safeString(control.id);
    if (controlId) {
      if (seenControlIds.has(controlId)) {
        issue(report, severity, "DASHBOARD_CONTROL_ID_DUPLICATE", "Dashboard page control ids should be unique.", { title, layoutId, pointer, controlId });
      }
      seenControlIds.add(controlId);
    }
    if (control.type === "flex_grid") {
      const attrs = control.attrs || {};
      if (attrs.layout && attrs.layout.cols && !attrs.columns) {
        issue(report, severity, "DASHBOARD_FLEX_GRID_COLUMNS_SCHEMA_INVALID", "Dashboard flex_grid columns should use attrs.columns/attrs.rows, not attrs.layout.cols.", { title, layoutId, pointer, controlId });
      }
      if (attrs.columns && !attrs.rows) {
        issue(report, severity, "DASHBOARD_FLEX_GRID_ROWS_MISSING", "Dashboard flex_grid controls with columns should also include attrs.rows.", { title, layoutId, pointer, controlId });
      }
      if (["Table header", "Table row"].includes(safeString(control.label)) && !displayLabelDisabled(control.displayLabel)) {
        issue(report, severity, "DASHBOARD_FLEX_GRID_DISPLAY_CAPTION_VISIBLE", "Table-style Collection header and row flex_grid controls should turn off Display caption with displayLabel [null,false].", { title, layoutId, pointer, controlId, label: safeString(control.label) });
      }
    }
    const binding = safeString(control.binding);
    if (binding.startsWith("__filter_")) {
      const filterVar = binding.slice("__filter_".length);
      if (!filterVars.has(filterVar)) {
        issue(report, severity, "DASHBOARD_FILTER_CONTROL_BINDING_UNRESOLVED", "Dashboard filter control binding should resolve to page.filterVars.", { title, layoutId, pointer, controlId, binding, filterVar });
      }
    }
    let activeContext = itemContext;
    if (DASHBOARD_ITEM_CONTEXT_CONTROL_TYPES.has(control.type)) {
      const listId = safeString(control.attrs && control.attrs.data && control.attrs.data.list && control.attrs.data.list.ListID);
      if (!listId) {
        const code = control.type === "kanban" ? "DASHBOARD_KANBAN_LIST_MISSING" : DASHBOARD_TIMELINE_CONTROL_TYPES.has(control.type) ? "DASHBOARD_TIMELINE_LIST_MISSING" : "DASHBOARD_COLLECTION_LIST_MISSING";
        issue(report, severity, code, "Kanban/Collection/Timeline control should include attrs.data.list.ListID.", { title, layoutId, pointer, controlType: control.type });
      } else if (!listsById.has(listId)) {
        const code = control.type === "kanban" ? "DASHBOARD_KANBAN_LIST_REFERENCE_UNRESOLVED" : DASHBOARD_TIMELINE_CONTROL_TYPES.has(control.type) ? "DASHBOARD_TIMELINE_LIST_REFERENCE_UNRESOLVED" : "DASHBOARD_COLLECTION_LIST_REFERENCE_UNRESOLVED";
        issue(report, severity, code, "Kanban/Collection/Timeline control data source should resolve to a list included in the package.", { title, layoutId, pointer, listId });
      }
      activeContext = makeHostContext(control.type, listId);
      if (control.type === "collection" || control.type === "kanban") hostContexts.push(activeContext);
      const fields = activeContext.fields;
      if (control.type === "kanban") {
        const categoryField = safeString(control.attrs && control.attrs.data && control.attrs.data.cateField);
        if (!categoryField) {
          issue(report, severity, "DASHBOARD_KANBAN_CATEGORY_FIELD_MISSING", "Kanban control should include attrs.data.cateField for grouping.", { title, layoutId, pointer, listId });
        } else if (!fields.has(categoryField)) {
          issue(report, severity, "DASHBOARD_KANBAN_CATEGORY_FIELD_UNRESOLVED", "Kanban category/group-by field should resolve to a source list field.", { title, layoutId, pointer: `${pointer}.attrs.data.cateField`, listId, fieldName: categoryField });
        }
      }
      if (DASHBOARD_TIMELINE_CONTROL_TYPES.has(control.type)) {
        const sortFields = asArray(control.attrs && control.attrs.data && control.attrs.data.sort).map((sort) => safeString(sort && sort.SortName)).filter(Boolean);
        const titleFields = collectVariableCtxFieldIds(control.attrs && control.attrs.data && control.attrs.data.title);
        if (!sortFields.length && !titleFields.length) {
          issue(report, severity, "DASHBOARD_TIMELINE_DATE_FIELD_MISSING", "Timeline controls should include a resolvable date/time field in attrs.data.title or attrs.data.sort so timeline points can be ordered/labeled.", { title, layoutId, pointer, controlType: control.type, listId });
        }
        for (const [index, fieldName] of sortFields.entries()) {
          if (!fields.has(fieldName)) {
            issue(report, severity, "DASHBOARD_TIMELINE_SORT_FIELD_UNRESOLVED", "Timeline sort/date field should resolve to the source list fields.", { title, layoutId, pointer: `${pointer}.attrs.data.sort[${index}].SortName`, controlType: control.type, listId, fieldName });
          }
        }
        for (const fieldName of titleFields) {
          if (!fields.has(fieldName)) {
            issue(report, severity, "DASHBOARD_TIMELINE_TITLE_FIELD_UNRESOLVED", "Timeline title/date expression should resolve to a source list field.", { title, layoutId, pointer: `${pointer}.attrs.data.title`, controlType: control.type, listId, fieldName });
          }
        }
      }
      if (!asArray(control.children).length) {
        const code = control.type === "kanban" ? "DASHBOARD_KANBAN_ITEM_TEMPLATE_MISSING" : DASHBOARD_TIMELINE_CONTROL_TYPES.has(control.type) ? "DASHBOARD_TIMELINE_ITEM_TEMPLATE_MISSING" : "DASHBOARD_COLLECTION_ITEM_TEMPLATE_MISSING";
        issue(report, severity, code, "Kanban/Collection/Timeline control should include an item-template child.", { title, layoutId, pointer, listId });
      }
      for (const [fulltextIndex, item] of asArray(control.attrs && control.attrs.data && control.attrs.data.fulltext).entries()) {
        for (const [fieldIndex, fieldName] of asArray(item.fields).map(safeString).entries()) {
          if (fieldName && !fields.has(fieldName)) {
            issue(report, severity, "DASHBOARD_COLLECTION_FULLTEXT_FIELD_UNRESOLVED", "Collection fulltext search references a field not present on the collection source list.", { title, layoutId, pointer: `${pointer}.attrs.data.fulltext[${fulltextIndex}].fields[${fieldIndex}]`, listId, fieldName });
          }
        }
        walk(item.value, (node, valuePointer) => validateExpressionNode(node, `${pointer}.attrs.data.fulltext[${fulltextIndex}].value${valuePointer.slice(1)}`, activeContext));
      }
      if (control.type === "collection" || control.type === "kanban") {
        validateCollectionActions(control, pointer, activeContext);
      }
    }
    if (DYNAMIC_DISPLAY_CONTROL_TYPES.has(safeString(control.type)) && safeString(control.attrs && control.attrs.source) === "3") {
      if (!activeContext) {
        issue(report, severity, "DASHBOARD_DYNAMIC_CONTROL_OUTSIDE_ITEM_CONTEXT", "Dynamic controls with source 3 should be nested inside a Kanban/Collection/Timeline item template.", { title, layoutId, pointer, controlType: control.type, fieldName: safeString(control.attrs && control.attrs["obj-f"]) });
      } else {
        const fieldName = safeString(control.attrs && control.attrs["obj-f"]);
        const field = activeContext.fields.get(fieldName);
        if (fieldName && !field) {
          issue(report, severity, "DASHBOARD_DYNAMIC_CONTROL_FIELD_UNRESOLVED", "Dynamic control source 3 references a field not present on the Kanban/Collection/Timeline source list.", { title, layoutId, pointer, host: activeContext.host, controlType: control.type, listId: activeContext.listId, fieldName });
        } else {
          validateDynamicFieldType(safeString(control.type), field, report, severity, { title, layoutId, pointer, host: activeContext.host, controlType: control.type });
        }
      }
    }
    validateControlDisplay(control, pointer, activeContext);
    if (control.attrs) walk(control.attrs, (node, attrPointer) => validateExpressionNode(node, `${pointer}.attrs${attrPointer.slice(1)}`, activeContext));
    asArray(control.children).forEach((child, index) => visit(child, `${pointer}.children[${index}]`, activeContext));
  }

  asArray(page.children).forEach((child, index) => visit(child, `$.children[${index}]`, null));
  validateDashboardPageActions();
}

function validateDashboardDataTableControl(control, title, layoutId, pointer, listsById, fieldsByList, report) {
  const severity = generatorFinalSeverity(report);
  const listId = safeString(control.attrs && control.attrs.data && control.attrs.data.list && control.attrs.data.list.ListID);
  const columns = asArray(control.attrs && control.attrs.listarr);
  if (!listId) {
    issue(report, severity, "DASHBOARD_DATA_TABLE_SOURCE_MISSING", "Generated dashboard Data table controls must configure attrs.data.list.", { title, layoutId, pointer });
    return;
  }
  if (!listsById.has(listId)) {
    issue(report, severity, "DASHBOARD_DATA_TABLE_SOURCE_UNRESOLVED", "Generated dashboard Data table controls must reference a packaged data list.", { title, layoutId, pointer, listId });
  }
  if (!columns.length) {
    issue(report, severity, "DASHBOARD_DATA_TABLE_DISPLAY_COLUMNS_MISSING", "Generated dashboard Data table controls must include attrs.listarr display fields. Empty table field configuration is not handoff-ready.", { title, layoutId, pointer, listId });
    return;
  }
  if (columns.length < 3) {
    issue(report, "warning", "DASHBOARD_DATA_TABLE_DISPLAY_COLUMNS_THIN", "Generated dashboard Data table controls should include 3 to 5 meaningful display columns when source fields are available.", { title, layoutId, pointer, listId, columnCount: columns.length });
  }
  const fields = fieldsByList.get(listId) || new Map();
  columns.forEach((column, index) => {
    const explicitField = isObject(column) ? safeString(column.Field) : "";
    if (isObject(column) && !explicitField) {
      issue(report, severity, "DASHBOARD_DATA_TABLE_DISPLAY_FIELD_BINDING_MISSING", "Dashboard Data table display columns must include export-proven Field bindings. FieldName is the visible label and is not enough for the query configuration.", { title, layoutId, pointer: `${pointer}.attrs.listarr[${index}]`, listId });
    }
    const fieldName = explicitField || displayColumnFieldName(column);
    if (!fieldName) {
      issue(report, severity, "DASHBOARD_DATA_TABLE_DISPLAY_FIELD_MISSING", "Data table display column entries must identify a source field.", { title, layoutId, pointer: `${pointer}.attrs.listarr[${index}]`, listId });
    } else if (fieldsByList.has(listId) && !fields.has(fieldName)) {
      issue(report, severity, "DASHBOARD_DATA_TABLE_DISPLAY_FIELD_UNRESOLVED", "Data table display column must resolve to the selected source list fields.", { title, layoutId, pointer: `${pointer}.attrs.listarr[${index}]`, listId, fieldName });
    }
  });
}

function validateDashboardExtFieldRefs(title, layoutId, pointer, attr, fieldsByList, filterVars, report) {
  const listId = safeString(attr && attr.ListID);
  if (!listId) return;
  const fields = fieldsByList.get(listId);
  if (!fields) return;
  const systemFields = new Set(["ListDataID", "CreatedBy", "Created", "ModifiedBy", "Modified"]);
  const settings = attr.settings;
  if (!isObject(settings)) return;
  for (const key of ["rows", "columns", "values"]) {
    for (const [index, item] of asArray(settings[key]).entries()) {
      const fieldName = safeString(item && item.fieldName);
      if (!fieldName || fields.has(fieldName) || systemFields.has(fieldName)) continue;
      issue(report, generatorFinalSeverity(report), "DASHBOARD_EXT_FIELD_REFERENCE_UNRESOLVED", "Dashboard ext settings fieldName does not resolve to the referenced list fields.", { title, layoutId, pointer: `${pointer}.attr.settings.${key}[${index}].fieldName`, listId, fieldName });
    }
  }
  validateDashboardConditions(title, layoutId, `${pointer}.attr.settings.Conditions`, settings.Conditions, fields, filterVars, report);
}

function validateDashboardPivotTableControls(title, layoutId, controls, extByControlId, listsById, fieldsByList, filterVars, report) {
  const severity = generatorFinalSeverity(report);
  for (const control of controls) {
    if (!control.controlId) {
      issue(report, severity, "PIVOT_TABLE_CONTROL_ID_MISSING", "Pivot Table controls need stable ids so page.exts can bind data analytics settings.", { title, layoutId, pointer: control.pointer });
      continue;
    }
    const match = extByControlId.get(control.controlId);
    if (!match) {
      issue(report, severity, "PIVOT_TABLE_EXT_MISSING", "Pivot Table controls must have a matching page.exts entry with key PivotTable and i equal to the control id.", { title, layoutId, pointer: control.pointer, controlId: control.controlId });
      continue;
    }
    validatePivotTableExt(title, layoutId, `$.exts[${match.index}]`, match.ext, listsById, fieldsByList, filterVars, report);
  }
}

function validatePivotTableExt(title, layoutId, pointer, ext, listsById, fieldsByList, filterVars, report) {
  const severity = generatorFinalSeverity(report);
  const attr = ext && ext.attr;
  if (safeString(ext && ext.key) !== "PivotTable") {
    issue(report, "warning", "PIVOT_TABLE_EXT_KEY_UNKNOWN", "Pivot Table data analytics ext entries are export-proven with key = PivotTable.", { title, layoutId, pointer, key: safeString(ext && ext.key) });
  }
  if (!isObject(attr)) {
    issue(report, severity, "PIVOT_TABLE_EXT_ATTR_MISSING", "Pivot Table ext entries should include attr with ListID and settings.", { title, layoutId, pointer });
    return;
  }
  const listId = safeString(attr.ListID);
  if (!listId) {
    issue(report, severity, "PIVOT_TABLE_DATA_SOURCE_MISSING", "Pivot Table ext attr must include a data source ListID.", { title, layoutId, pointer });
    return;
  }
  const source = listsById.get(listId);
  if (!source) {
    issue(report, severity, "PIVOT_TABLE_DATA_SOURCE_UNRESOLVED", "Pivot Table data source ListID must resolve to an included data list, document library, Form Report, or Data Report resource.", { title, layoutId, pointer, listId });
    return;
  }
  const sourceType = Number(source.item && source.item.ListModel && source.item.ListModel.Type);
  if (!PIVOT_TABLE_SOURCE_TYPES.has(sourceType)) {
    issue(report, "warning", "PIVOT_TABLE_SOURCE_TYPE_UNPROVEN", "Pivot Table source type is not in the product-supported Data Analytics source set.", { title, layoutId, pointer, listId, sourceType, source: source.title });
  }
  const settings = attr.settings;
  if (!isObject(settings)) {
    issue(report, severity, "PIVOT_TABLE_SETTINGS_MISSING", "Pivot Table ext attr.settings should include rows, columns, and values.", { title, layoutId, pointer, listId });
    return;
  }
  const fields = fieldsByList.get(listId) || new Map();
  for (const axis of ["rows", "columns", "values"]) {
    if (!Array.isArray(settings[axis])) {
      issue(report, severity, "PIVOT_TABLE_AXIS_NOT_ARRAY", "Pivot Table settings rows, columns, and values should be arrays.", { title, layoutId, pointer: `${pointer}.attr.settings.${axis}`, axis });
      continue;
    }
    settings[axis].forEach((item, index) => validatePivotTableAxisItem(title, layoutId, `${pointer}.attr.settings.${axis}[${index}]`, axis, item, fields, report));
  }
  validateDashboardConditions(title, layoutId, `${pointer}.attr.settings.Conditions`, settings.Conditions, fields, filterVars, report);
}

function validatePivotTableAxisItem(title, layoutId, pointer, axis, item, fields, report) {
  const severity = generatorFinalSeverity(report);
  if (!isObject(item)) {
    issue(report, "warning", "PIVOT_TABLE_AXIS_ITEM_UNKNOWN", "Pivot Table axis item uses an unknown schema variant.", { title, layoutId, pointer, axis });
    return;
  }
  const fieldName = safeString(item.fieldName);
  const field = fields.get(fieldName);
  if (fieldName && !field && !KNOWN_SYSTEM_FIELDS.has(fieldName)) {
    issue(report, severity, "PIVOT_TABLE_FIELD_UNRESOLVED", "Pivot Table rows, columns, and values must reference fields on the selected data source.", { title, layoutId, pointer: `${pointer}.fieldName`, axis, fieldName });
  }
  const func = safeString(item.func);
  const fieldType = safeString(item.fieldType || field && field.Type);
  if (axis === "values") {
    if (!func) {
      issue(report, severity, "PIVOT_TABLE_VALUE_AGGREGATION_MISSING", "Pivot Table value entries should declare an aggregation such as COUNT, SUM, AVG, MIN, or MAX.", { title, layoutId, pointer, fieldName });
    } else if (!PIVOT_TABLE_COUNT_AGGREGATIONS.has(func) && !PIVOT_TABLE_NUMERIC_AGGREGATIONS.has(func)) {
      issue(report, "warning", "PIVOT_TABLE_VALUE_AGGREGATION_UNKNOWN", "Pivot Table value aggregation is not export-proven.", { title, layoutId, pointer: `${pointer}.func`, aggregation: func });
    } else if (PIVOT_TABLE_NUMERIC_AGGREGATIONS.has(func) && fieldType && !PIVOT_TABLE_NUMERIC_FIELD_TYPES.has(fieldType)) {
      issue(report, severity, "PIVOT_TABLE_VALUE_AGGREGATION_FIELD_TYPE_UNPROVEN", "Numeric Pivot Table aggregations should target numeric/currency fields where detectable.", { title, layoutId, pointer, fieldName, fieldType, aggregation: func });
    }
  } else if (func) {
    if (!PIVOT_TABLE_DATE_GROUPINGS.has(func)) {
      issue(report, "warning", "PIVOT_TABLE_AXIS_GROUPING_UNKNOWN", "Pivot Table row/column grouping is not export-proven.", { title, layoutId, pointer: `${pointer}.func`, axis, grouping: func });
    } else if (fieldType && !PIVOT_TABLE_DATE_FIELD_TYPES.has(fieldType)) {
      issue(report, severity, "PIVOT_TABLE_DATE_GROUPING_FIELD_TYPE_INVALID", "Pivot Table date grouping should only be used on date/time fields where detectable.", { title, layoutId, pointer, axis, fieldName, fieldType, grouping: func });
    }
  }
}

function validateDashboardConditions(title, layoutId, pointer, conditions, fields, filterVars, report) {
  asArray(conditions).forEach((condition, index) => {
    if (!isObject(condition)) return;
    const conditionPointer = `${pointer}[${index}]`;
    const left = safeString(condition.left);
    if (left && !fields.has(left)) {
      issue(report, generatorFinalSeverity(report), "DASHBOARD_EXT_CONDITION_FIELD_UNRESOLVED", "Dashboard ext condition left field does not resolve to the referenced list fields.", { title, layoutId, pointer: `${conditionPointer}.left`, fieldName: left });
    }
    for (const [rightIndex, item] of asArray(condition.right).entries()) {
      if (!isObject(item) || item.exprType !== "variable") continue;
      const name = safeString(item.name);
      const id = safeString(item.id);
      if (name && !filterVars.has(name)) {
        issue(report, generatorFinalSeverity(report), "DASHBOARD_EXT_FILTER_VARIABLE_UNRESOLVED", "Dashboard ext condition variable name should resolve to page filterVars.", { title, layoutId, pointer: `${conditionPointer}.right[${rightIndex}].name`, filterVar: name });
      }
      if (id && name && id !== `__filter_${name}`) {
        issue(report, generatorFinalSeverity(report), "DASHBOARD_EXT_FILTER_VARIABLE_ID_MISMATCH", "Dashboard ext condition variable id should use the __filter_ prefix plus the filter variable name.", { title, layoutId, pointer: `${conditionPointer}.right[${rightIndex}].id`, id, expected: `__filter_${name}` });
      }
    }
    validateDashboardConditions(title, layoutId, `${conditionPointer}.conditions`, condition.conditions, fields, filterVars, report);
  });
}

function validateDashboardListId(title, layoutId, pointer, value, listsById, report) {
  const listId = safeString(value);
  if (!listId) return;
  if (!listsById.has(listId)) {
    issue(report, generatorFinalSeverity(report), "DASHBOARD_DATA_SOURCE_UNRESOLVED", "Dashboard data source ListID/listid does not resolve to a package list or report resource.", { title, layoutId, pointer, listId });
  }
}

function validateDashboardDocLibraryControl(node, title, layoutId, pointer, listsById, fieldsByList, report) {
  const attrs = node.attrs || {};
  const data = attrs.data || {};
  const listRef = data.list || {};
  const listId = safeString(listRef.ListID);
  if (!listId) {
    issue(report, "warning", "DOC_LIBRARY_CONTROL_LIST_MISSING", "Doc library dashboard control should include attrs.data.list.ListID.", { title, layoutId, pointer });
    return;
  }

  const list = listsById.get(listId);
  if (!list) {
    issue(report, generatorFinalSeverity(report), "DOC_LIBRARY_CONTROL_LIST_UNRESOLVED", "Doc library dashboard control references a list not included in the package.", { title, layoutId, pointer, listId });
    return;
  }
  if (list.resourceType !== "document library" || Number(list.item && list.item.ListModel && list.item.ListModel.Type) !== 16) {
    issue(report, "warning", "DOC_LIBRARY_CONTROL_TARGET_NOT_TYPE16", "Doc library dashboard control should target a Type 16 document library resource.", { title, layoutId, pointer, listId, targetType: list.resourceType });
  }
  if (safeString(listRef.Type) && safeString(listRef.Type) !== "16") {
    issue(report, "warning", "DOC_LIBRARY_CONTROL_LIST_TYPE_UNUSUAL", "Doc library dashboard control attrs.data.list.Type should be 16.", { title, layoutId, pointer, listId, type: listRef.Type });
  }
  if (safeString(listRef.Title) && safeString(listRef.Title) !== list.title) {
    issue(report, "warning", "DOC_LIBRARY_CONTROL_LIST_TITLE_MISMATCH", "Doc library dashboard control list title should match the referenced document library.", { title, layoutId, pointer, listId, controlTitle: listRef.Title, targetTitle: list.title });
  }

  const fields = fieldsByList.get(listId) || new Map();
  asArray(attrs.listarr).forEach((column, index) => {
    const fieldName = safeString(column && column.Field);
    if (fieldName && !fields.has(fieldName)) {
      issue(report, "warning", "DOC_LIBRARY_CONTROL_FIELD_UNRESOLVED", "Doc library dashboard control listarr field should resolve to a field on the target document library.", { title, layoutId, pointer: `${pointer}.attrs.listarr[${index}]`, listId, fieldName });
    }
  });

  const folder = data.folder;
  if (folder !== undefined) {
    const pathValue = safeString(folder && folder.path);
    if (!pathValue) {
      issue(report, "warning", "DOC_LIBRARY_CONTROL_FOLDER_PATH_MISSING", "Folder-bound Doc library dashboard controls should include attrs.data.folder.path.", { title, layoutId, pointer, listId });
    } else {
      const folderIds = pathValue.split("/").filter((part) => part && part !== "0");
      const rows = list.item && isObject(list.item.ListDatas) ? list.item.ListDatas : {};
      for (const folderId of folderIds) {
        const row = rows[folderId] || Object.values(rows).find((candidate) => safeString(candidate && candidate.ListDataID) === folderId);
        if (!row) {
          issue(report, "warning", "DOC_LIBRARY_CONTROL_FOLDER_UNRESOLVED", "Doc library dashboard control folder.path should resolve to folder rows in the target document library.", { title, layoutId, pointer, listId, folderId, path: pathValue });
          continue;
        }
        if (safeString(row.Text1).toLowerCase() !== "folder") {
          issue(report, "warning", "DOC_LIBRARY_CONTROL_FOLDER_ROW_NOT_FOLDER", "Doc library dashboard control folder.path should point to rows with Text1 = folder.", { title, layoutId, pointer, listId, folderId, rowType: row.Text1 });
        }
        if (row.Text4) {
          issue(report, "warning", "DOC_LIBRARY_CONTROL_FOLDER_ROW_HAS_UPLOAD_PAYLOAD", "Folder rows referenced by Doc library controls should not include uploaded file payloads.", { title, layoutId, pointer, listId, folderId });
        }
      }
    }
  }

  if (data.customPath !== undefined) {
    if (!Array.isArray(data.customPath)) {
      issue(report, "warning", "DOC_LIBRARY_CONTROL_CUSTOMPATH_NOT_ARRAY", "Dynamic folder customPath should be an expression-token array when present.", { title, layoutId, pointer, listId });
    } else {
      const result = validateExpressionTokens(data.customPath);
      result.issues.forEach((expressionIssue) => {
        issue(report, "warning", `DOC_LIBRARY_CONTROL_CUSTOMPATH_${expressionIssue.code}`, expressionIssue.message, { title, layoutId, pointer: `${pointer}.attrs.data.customPath`, listId });
      });
    }
  }

  const caption = attrs.caption;
  if (caption !== undefined && isObject(caption)) {
    const captionLayout = safeString(caption.layout);
    if (captionLayout) {
      const layoutIds = new Set(asArray(list.item && list.item.Layouts).map((candidate) => safeString(candidate.LayoutID)).filter(Boolean));
      if (!layoutIds.has(captionLayout)) {
        issue(report, "warning", "DOC_LIBRARY_CONTROL_CAPTION_LAYOUT_UNRESOLVED", "Doc library dashboard control caption.layout should reference a layout on the target document library.", { title, layoutId, pointer, listId, captionLayout });
      }
    }
    for (const key of ["display", "add", "search"]) {
      if (caption[key] !== undefined && typeof caption[key] !== "boolean") {
        issue(report, "warning", "DOC_LIBRARY_CONTROL_CAPTION_FLAG_NOT_BOOLEAN", "Doc library dashboard control caption display/add/search settings should be booleans.", { title, layoutId, pointer: `${pointer}.attrs.caption.${key}`, key, value: caption[key] });
      }
    }
  }
}

function flattenNavigationItems(items) {
  const out = [];
  for (const item of asArray(items)) {
    if (!item || typeof item !== "object") continue;
    if (Array.isArray(item.list)) out.push(...flattenNavigationItems(item.list));
    else out.push(item);
  }
  return out;
}

function validateBasicStructure(data, resource, report) {
  if (!isObject(data)) {
    issue(report, "error", "DATA_NOT_OBJECT", "Decoded Resource.Data must be an object.");
    return;
  }
  if (!isObject(data.Item)) issue(report, "error", "DATA_ITEM_MISSING", "Data.Item is required.");
  if (!Array.isArray(data.Childs)) issue(report, "error", "DATA_CHILDS_NOT_ARRAY", "Data.Childs must be an array.");
  validateListExportItemSchema(data.Item, "Data.Item", report);
  asArray(data.Childs).forEach((child, index) => validateListExportItemSchema(child, `Data.Childs[${index}]`, report));
  for (const key of ["Forms", "OtherModules", "FormReports", "DataReports", "FormNewReports", "AppGroups", "AppThemes"]) {
    if (data[key] !== undefined && data[key] !== null && !Array.isArray(data[key])) {
      issue(report, "error", `${key.toUpperCase()}_NOT_ARRAY`, `Data.${key} must be an array when present.`);
    }
  }
  if (resource) {
    if (!isSchemaDirectYap(report) && !Array.isArray(resource.ReplaceIds)) issue(report, "error", "REPLACEIDS_NOT_ARRAY", "Resource.ReplaceIds must be an array.");
    if (!isSchemaDirectYap(report) && (resource.AppID === undefined || resource.AppID === null || resource.AppID === "")) {
      issue(report, "error", "RESOURCE_APPID_MISSING", "Resource.AppID is required in wrapped .yap packages.");
    } else if (!isSchemaDirectYap(report) && report.mode === "generator" && report.stage === "final" && safeString(resource.AppID) !== "41") {
      issue(report, "error", "RESOURCE_APPID_NOT_FIXED_41", "Generated YAP Resource.AppID must stay fixed at 41; do not request this ID from the generate-unique-ids API.", { appId: resource.AppID });
    }
    if (isDocumentLibraryOnlyPackage(data) && resource.SimplePortal !== null) {
      issue(report, "warning", "DOCUMENT_LIBRARY_SIMPLEPORTAL_NOT_NULL", "Known-good document-library exports use Resource.SimplePortal = null. Generated [] wrappers failed Yeeflow create in v1/v2.", { simplePortalType: Array.isArray(resource.SimplePortal) ? "array" : typeof resource.SimplePortal });
    }
  }
}

function validateListExportItemSchema(item, pathPrefix, report) {
  if (!isObject(item)) return;
  for (const key of ["Defs", "Layouts"]) {
    const value = item[key];
    const path = `${pathPrefix}.${key}`;
    if (!Object.prototype.hasOwnProperty.call(item, key)) {
      issue(report, "error", `LIST_EXPORT_ITEM_${key.toUpperCase()}_MISSING`, `ListExportItem.${key} is required by yap-schema.json. Use an empty array when there are no entries.`, { path });
    } else if (value === null) {
      issue(report, "error", `LIST_EXPORT_ITEM_${key.toUpperCase()}_NULL`, `ListExportItem.${key} cannot be null. Use [] for an empty collection.`, { path });
    } else if (!Array.isArray(value)) {
      issue(report, "error", `LIST_EXPORT_ITEM_${key.toUpperCase()}_NOT_ARRAY`, `ListExportItem.${key} must be an array.`, { path, actualType: Array.isArray(value) ? "array" : typeof value });
    }
  }
  if (!isObject(item.ListModel)) {
    issue(report, generatorFinalSeverity(report), "LIST_EXPORT_ITEM_LISTMODEL_MISSING", "Generated app/list resources should include ListExportItem.ListModel.", { path: `${pathPrefix}.ListModel` });
  } else {
    if (report.mode === "generator" && report.stage === "final" && item.ListModel.AppID !== undefined && safeString(item.ListModel.AppID) !== "41") {
      issue(report, "error", "LISTMODEL_APPID_NOT_FIXED_41", "Generated YAP ListModel.AppID must stay fixed at 41; use API-issued IDs for list/field/layout IDs only.", { path: `${pathPrefix}.ListModel.AppID`, appId: item.ListModel.AppID });
    }
    if (item.ListModel.Flags !== 1) {
      issue(report, generatorFinalSeverity(report), "LISTMODEL_FLAGS_MISSING_OR_INVALID", "Product schema v2 requires CustomListModel.Flags = 1 on generated root and child list resources; missing or different values can fail import.", { path: `${pathPrefix}.ListModel.Flags`, value: item.ListModel.Flags });
    }
    if (item.ListModel.Status !== undefined && item.ListModel.Status !== 1) {
      issue(report, generatorFinalSeverity(report), "LISTMODEL_STATUS_INVALID", "Product schema v2 fixes CustomListModel.Status to 1 when present.", { path: `${pathPrefix}.ListModel.Status`, value: item.ListModel.Status });
    }
    if (item.ListModel.Type !== undefined && !CUSTOM_LIST_MODEL_TYPES.has(Number(item.ListModel.Type))) {
      issue(report, generatorFinalSeverity(report), "LISTMODEL_TYPE_INVALID", "Product schema v2 allows CustomListModel.Type values 1, 16, 32, 64, 128, or 1024.", { path: `${pathPrefix}.ListModel.Type`, value: item.ListModel.Type });
    }
  }
}

function validateApplicationUserGroups(data, replaceIds, report) {
  const groups = asArray(data && data.AppGroups);
  report.summary.appUserGroups = groups.length;
  const seen = new Set();
  groups.forEach((group, index) => {
    if (!isObject(group)) {
      issue(report, generatorFinalSeverity(report), "APP_USER_GROUP_NOT_OBJECT", "Application user group entries should be objects.", { index });
      return;
    }
    const id = safeString(group.ID);
    const name = safeString(group.Name);
    if (!id) issue(report, generatorFinalSeverity(report), "APP_USER_GROUP_ID_MISSING", "Application user groups should include an ID.", { index, name });
    if (!name) issue(report, generatorFinalSeverity(report), "APP_USER_GROUP_NAME_MISSING", "Application user groups should include a Name.", { index, id });
    if (id && seen.has(id)) issue(report, generatorFinalSeverity(report), "APP_USER_GROUP_ID_DUPLICATE", "Application user group IDs should be unique inside Data.AppGroups.", { index, id, name });
    seen.add(id);
    if (id && replaceIds.size && !replaceIds.has(id)) {
      issue(report, "warning", "APP_USER_GROUP_ID_NOT_IN_REPLACEIDS", "The v6 application user group export includes group IDs in ReplaceIds. Confirm import behavior if generated group IDs are not remapped.", { index, id, name });
      if (isGeneratedFinal(report)) {
        issue(report, "error", "YAP_REPLACEIDS_APP_GROUP_ID_MISSING", "Generated-final YAP Resource.ReplaceIds must include application user group IDs collected from the final decoded package.", { index, id, name });
      }
    }
    if (group.Description !== undefined && group.Description !== null && typeof group.Description !== "string") {
      issue(report, "warning", "APP_USER_GROUP_DESCRIPTION_NOT_STRING", "Application user group Description should be null or string based on the export-proven schema.", { index, id, name });
    }
    const raw = JSON.stringify(group);
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(raw)) {
      issue(report, generatorFinalSeverity(report), "APP_USER_GROUP_PRIVATE_EMAIL_PRESENT", "Generated application packages must not embed real user email addresses in AppGroups or related group metadata.", { index, id, name });
    }
    for (const key of Object.keys(group)) {
      if (/users?|members?/i.test(key)) {
        issue(report, "warning", "APP_USER_GROUP_MEMBER_SCHEMA_UNPROVEN", "This export study proves Data.AppGroups group records, but does not yet prove a safe member list schema. Treat member data as private and runtime-sensitive.", { index, id, name, key });
      }
    }
  });
}

function validateDataListPermissionsAndNotifications(item, pathPrefix, resourceType, report) {
  const list = item.ListModel || {};
  const title = safeString(list.Title);
  if (!["data list", "document library"].includes(resourceType)) return;

  if (list.Perm !== undefined && typeof list.Perm !== "number") {
    issue(report, "warning", "DATA_LIST_PERMISSION_PERM_INVALID", "ListModel.Perm should be numeric when present.", { path: `${pathPrefix}.ListModel.Perm`, list: title, valueType: typeof list.Perm });
  }
  if (list.IsBreakInherit !== undefined && typeof list.IsBreakInherit !== "boolean") {
    issue(report, "warning", "DATA_LIST_PERMISSION_INHERIT_FLAG_INVALID", "ListModel.IsBreakInherit should be boolean when present.", { path: `${pathPrefix}.ListModel.IsBreakInherit`, list: title, valueType: typeof list.IsBreakInherit });
  }
  if (list.IsItemPerm !== undefined && typeof list.IsItemPerm !== "boolean") {
    issue(report, "warning", "DATA_LIST_PERMISSION_ITEM_FLAG_INVALID", "ListModel.IsItemPerm should be boolean when present.", { path: `${pathPrefix}.ListModel.IsItemPerm`, list: title, valueType: typeof list.IsItemPerm });
  }
  if (list.AdvanceList !== undefined && !Array.isArray(list.AdvanceList)) {
    issue(report, "warning", "DATA_LIST_PERMISSION_ADVANCELIST_INVALID", "ListModel.AdvanceList should be an array when present in studied data-list exports.", { path: `${pathPrefix}.ListModel.AdvanceList`, list: title });
  }
  for (const key of ["Ext1", "Ext2", "Ext3"]) {
    if (typeof list[key] === "string" && /perm|permission|admin|advanced|audience/i.test(list[key]) && !tryParseJson(list[key])) {
      issue(report, "warning", "DATA_LIST_PERMISSION_EXT_JSON_INVALID", `ListModel.${key} contains permission-like text but does not parse as JSON.`, { path: `${pathPrefix}.ListModel.${key}`, list: title });
    }
  }

  const rules = asArray(item.RemindRules);
  const knownNotificationTypes = new Set(["1", "2", "3", "4"]);
  const knownRecipientTypes = new Set(["1", "2", "3"]);
  rules.forEach((rule, index) => {
    if (!isObject(rule)) {
      issue(report, "warning", "DATA_LIST_NOTIFICATION_RULE_NOT_OBJECT", "RemindRules entries should be objects.", { path: `${pathPrefix}.RemindRules[${index}]`, list: title });
      return;
    }
    const type = safeString(rule.Type);
    if (type && !knownNotificationTypes.has(type)) {
      issue(report, "warning", "DATA_LIST_NOTIFICATION_TYPE_UNKNOWN", "Unknown RemindRules Type; export-proven types are 1 item-added, 2 regular reminder, 3 date-field reminder, and 4 item-changed.", { path: `${pathPrefix}.RemindRules[${index}].Type`, list: title, type });
    }
    if (rule.Status !== undefined && typeof rule.Status !== "number") {
      issue(report, "warning", "DATA_LIST_NOTIFICATION_STATUS_INVALID", "RemindRules Status should be numeric when present.", { path: `${pathPrefix}.RemindRules[${index}].Status`, list: title });
    }
    const parsedRules = typeof rule.Rules === "string" ? tryParseJson(rule.Rules) : rule.Rules;
    if (!isObject(parsedRules)) {
      issue(report, "warning", "DATA_LIST_NOTIFICATION_RULES_JSON_INVALID", "RemindRules.Rules should parse as JSON.", { path: `${pathPrefix}.RemindRules[${index}].Rules`, list: title });
    } else {
      const conditionData = parsedRules.Conditions && parsedRules.Conditions.Data;
      if (typeof conditionData === "string" && conditionData.trim()) {
        const parsedConditions = tryParseJson(conditionData);
        if (!Array.isArray(parsedConditions)) {
          issue(report, "warning", "DATA_LIST_NOTIFICATION_CONDITIONS_JSON_INVALID", "RemindRules.Conditions.Data should parse as an array when non-empty.", { path: `${pathPrefix}.RemindRules[${index}].Rules.Conditions.Data`, list: title });
        }
      }
      if (type === "2") {
        const period = safeString(parsedRules.Rules && parsedRules.Rules.Period);
        if (period && !["Daily", "Weekly", "Monthly", "Yearly"].includes(period)) {
          issue(report, "warning", "DATA_LIST_NOTIFICATION_PERIOD_UNKNOWN", "Regular reminder Period is not one of the export-proven values.", { path: `${pathPrefix}.RemindRules[${index}].Rules.Rules.Period`, list: title, period });
        }
      }
    }
    const parsedReceiver = typeof rule.Receiver === "string" ? tryParseJson(rule.Receiver) : rule.Receiver;
    if (!isObject(parsedReceiver)) {
      issue(report, "warning", "DATA_LIST_NOTIFICATION_RECEIVER_JSON_INVALID", "RemindRules.Receiver should parse as JSON.", { path: `${pathPrefix}.RemindRules[${index}].Receiver`, list: title });
    } else {
      asArray(parsedReceiver.Identities).forEach((identity, identityIndex) => {
        const recipientType = safeString(identity && identity.Type);
        if (recipientType && !knownRecipientTypes.has(recipientType)) {
          issue(report, "warning", "DATA_LIST_NOTIFICATION_RECIPIENT_TYPE_UNKNOWN", "Unknown notification recipient Type; export-proven values are 1 user, 2 department, and 3 user group.", { path: `${pathPrefix}.RemindRules[${index}].Receiver.Identities[${identityIndex}].Type`, list: title, recipientType });
        }
      });
      if (parsedReceiver.ListDefs !== undefined && !Array.isArray(parsedReceiver.ListDefs)) {
        issue(report, "warning", "DATA_LIST_NOTIFICATION_LISTDEFS_INVALID", "Notification Receiver.ListDefs should be an array when present.", { path: `${pathPrefix}.RemindRules[${index}].Receiver.ListDefs`, list: title });
      }
    }
  });
}

function validateDataListFieldTypeSettings(field, listTitle, pathPrefix, report) {
  const type = safeString(field && field.Type).toLowerCase();
  const rules = parsedFieldRules(field);
  const context = { list: listTitle, field: field.DisplayName || field.FieldName || null, path: pathPrefix, type };

  if (["radio", "checkbox", "select"].includes(type) && !Array.isArray(rules.choices)) {
    issue(report, generatorFinalSeverity(report), "CHOICE_OPTIONS_MISSING", "Choice fields should include Rules.choices.", context);
  }
  if (type === "tag" && rules.customTags !== true && !Array.isArray(rules.customTags) && !Array.isArray(rules.choices)) {
    issue(report, "warning", "TAG_OPTIONS_MISSING", "Tag fields should include Rules.customTags=true, a customTags array, or choices before generation.", context);
  }
  if (type === "tag" && (!rules.source || !rules.category)) {
    issue(report, "warning", "TAG_SOURCE_MISSING", "Tag fields should include Rules.source and Rules.category.", context);
  }
  if (["metadata", "mutiple-metadata"].includes(type) && (!rules.source || !rules.categoryId)) {
    issue(report, "warning", "METADATA_SOURCE_MISSING", "Metadata fields should include Rules.source and Rules.categoryId.", context);
  }
  if (type === "lookup") {
    const missing = ["appid", "listsetid", "listid", "listfield"].filter((key) => !rules[key] && !rules[key.replace(/^[a-z]/, (ch) => ch.toUpperCase())]);
    if (missing.length) {
      issue(report, generatorFinalSeverity(report), "LOOKUP_RULES_INCOMPLETE", "Lookup fields should include appid, listsetid, listid, and listfield Rules metadata.", { ...context, missing });
    }
  }
  if (type === "calculated-column" && (!rules.calculated_result || !rules.calculated)) {
    issue(report, "warning", "CALCULATED_COLUMN_RULES_INCOMPLETE", "Calculated columns should include Rules.calculated_result and Rules.calculated.", context);
  }
  if (type === "list" && !Array.isArray(rules["list-variables"])) {
    issue(report, "warning", "LIST_FIELD_METADATA_MISSING", "Sub-list fields should include Rules.list-variables.", context);
  }
  if (type === "autonumber" && (rules.minDigits === undefined || rules.startNum === undefined)) {
    issue(report, "warning", "AUTONUMBER_RULES_INCOMPLETE", "Auto number fields should include Rules.minDigits and Rules.startNum.", context);
  }
}

function validateResourceItem(item, index, isRoot, rootListSetId, replaceIds, localIds, listsById, fieldsByList, fieldIdsByApp, listIdsByApp, layoutIdsByApp, layoutResourceIdsByApp, report) {
  const pathPrefix = isRoot ? "$.Item" : `$.Childs[${index - 1}]`;
  if (!isObject(item) || !isObject(item.ListModel)) {
    issue(report, "error", "RESOURCE_LISTMODEL_MISSING", "Resource Item.ListModel is required.", { path: pathPrefix });
    return;
  }
  const list = item.ListModel;
  const listId = safeString(list.ListID);
  const title = safeString(list.Title);
  const resourceType = classifyListResource(item, isRoot);
  const listSetId = listSetIdOf(item, rootListSetId);
  if (isRoot) {
    if (!title) issue(report, "error", "ROOT_TITLE_MISSING", "Root app title is required.", { path: `${pathPrefix}.ListModel.Title` });
    if (!list.AppID && report.mode === "generator" && report.stage === "final") issue(report, "error", "ROOT_APPID_MISSING", "Root AppID is required.", { path: `${pathPrefix}.ListModel.AppID` });
    if (!listId) issue(report, "error", "ROOT_LISTSET_ID_MISSING", "Root ListID/ListSetID is required.", { path: `${pathPrefix}.ListModel.ListID` });
    if (safeString(list.CustomType)) {
      issue(report, generatorFinalSeverity(report), "ROOT_CUSTOMTYPE_NOT_EMPTY", "Root app/ListSet CustomType should be empty; child list CustomType values should point to ListSite_<root ListID>.", { path: `${pathPrefix}.ListModel.CustomType`, customType: list.CustomType });
    }
  } else {
    if (!listId) issue(report, "error", "CHILD_LISTID_MISSING", "Child ListID is required.", { path: `${pathPrefix}.ListModel.ListID`, title });
    if (!title) issue(report, "warning", "CHILD_TITLE_MISSING", "Child resource title is missing.", { path: `${pathPrefix}.ListModel.Title`, listId });
    const expectedCustomType = `ListSite_${rootListSetId}`;
    if (safeString(list.CustomType) !== expectedCustomType) {
      issue(report, generatorFinalSeverity(report), "CHILD_CUSTOMTYPE_LISTSITE_MISMATCH", "Child list CustomType must point to the generated root application/ListSet ID as ListSite_<root ListID>.", { path: `${pathPrefix}.ListModel.CustomType`, title, customType: list.CustomType, expectedCustomType });
    }
    if (!isSchemaDirectYap(report) && resourceType === "data list" && list.ListType === undefined) {
      issue(report, generatorFinalSeverity(report), "MAIN_LIST_TYPE_MISSING", "Generated child data lists must include ListModel.ListType before handoff; missing ListType can block Yeeflow import/materialization.", { path: `${pathPrefix}.ListModel.ListType`, title, listId });
    } else if (!isSchemaDirectYap(report) && resourceType === "data list" && Number(list.ListType) !== 1) {
      issue(report, generatorFinalSeverity(report), "MAIN_LIST_TYPE_INVALID", "Generated Type 1 data lists must use ListModel.ListType = 1 before handoff.", { path: `${pathPrefix}.ListModel.ListType`, title, listId, listType: list.ListType });
    }
  }

  if (listId) {
    validateGeneratedIntegerId(list.ListID, report, { path: `${pathPrefix}.ListModel.ListID`, list: title });
    validateUniqueGeneratedId(list.ListID, listIdsByApp, report, "DUPLICATE_LIST_ID", "ListID values must be globally unique across generated ListExportItem resources.", { path: `${pathPrefix}.ListModel.ListID`, list: title, name: title });
    listsById.set(listId, { item, title, listId, listSetId, resourceType });
    localIds.add(listId);
  }
  const fields = asArray(item.Defs);
  const fieldsByName = new Map();
  const fieldNames = new Set();
  const fieldInternal = new Set();
  const fieldDisplayNames = new Set();
  const fieldIndexes = new Set();
  for (const [fieldIndex, field] of fields.entries()) {
    const fp = `${pathPrefix}.Defs[${fieldIndex}]`;
    const fieldId = safeString(field.FieldID);
    const fieldName = safeString(field.FieldName);
    const internalName = safeString(field.InternalName);
    const displayName = safeString(field.DisplayName);
    validateGeneratedIntegerId(field.FieldID, report, { path: `${fp}.FieldID`, list: title, field: displayName || fieldName || internalName || null });
    validateGeneratedIntegerId(field.FieldIndex, report, { path: `${fp}.FieldIndex`, list: title, field: displayName || fieldName || internalName || null });
    if (!Number.isInteger(field.Category)) {
      issue(report, generatorFinalSeverity(report), "FIELD_CATEGORY_NOT_INT", "Field.Category must be an integer for generated packages.", {
        path: `${fp}.Category`,
        list: title,
        field: displayName || fieldName || internalName || null,
        actualType: field.Category === undefined ? "missing" : Array.isArray(field.Category) ? "array" : field.Category === null ? "null" : typeof field.Category,
      });
    }
    if (!fieldId) issue(report, "error", "FIELD_ID_MISSING", "FieldID is required.", { path: `${fp}.FieldID`, list: title });
    else {
      localIds.add(fieldId);
      const previous = fieldIdsByApp.get(fieldId);
      if (previous) {
        issue(report, generatorFinalSeverity(report), "APP_FIELD_ID_DUPLICATE", "Duplicate FieldID across application resources; generated .yap data-list fields must use app-wide unique FieldID values to avoid blank-app materialization failures.", {
          fieldId,
          list: title,
          fieldName,
          previousList: previous.list,
          previousFieldName: previous.fieldName,
        });
      } else {
        fieldIdsByApp.set(fieldId, { list: title, fieldName });
      }
    }
    if (field.FieldIndex !== undefined) {
      const indexKey = `${safeString(field.FieldType)}:${safeString(field.FieldIndex)}`;
      if (fieldIndexes.has(indexKey)) issue(report, generatorFinalSeverity(report), "DUPLICATE_FIELD_INDEX", "FieldIndex values must be unique within each FieldType family in a list.", { path: `${fp}.FieldIndex`, list: title, field: displayName || fieldName || internalName || null, value: field.FieldIndex, fieldType: field.FieldType || null });
      fieldIndexes.add(indexKey);
    }
    if (safeString(field.ListID) && listId && safeString(field.ListID) !== listId) {
      issue(report, generatorFinalSeverity(report), "FIELD_LIST_ID_MISMATCH", "Field ListID must match its parent data-list ListID; otherwise Yeeflow may materialize the list shell without custom fields.", {
        list: title,
        fieldName,
        fieldId,
        fieldListId: safeString(field.ListID),
        parentListId: listId,
        path: `${fp}.ListID`,
      });
    }
    if (!fieldName) issue(report, "error", "FIELD_NAME_MISSING", "FieldName is required.", { path: `${fp}.FieldName`, list: title });
    if (!displayName) issue(report, "warning", "FIELD_DISPLAY_NAME_MISSING", "Field DisplayName is missing.", { path: `${fp}.DisplayName`, list: title, fieldName });
    if (fieldName) {
      if (fieldNames.has(fieldName)) issue(report, "error", "FIELD_NAME_DUPLICATE", "Duplicate FieldName in resource.", { list: title, fieldName });
      fieldNames.add(fieldName);
      fieldsByName.set(fieldName, field);
    }
    if (internalName) {
      if (fieldInternal.has(internalName)) issue(report, "error", "DUPLICATE_INTERNAL_NAME", "Duplicate InternalName in resource; generated data lists must use unique internal field names.", { list: title, internalName });
      fieldInternal.add(internalName);
      fieldsByName.set(internalName, field);
    }
    if (displayName) {
      if (fieldDisplayNames.has(displayName)) {
        issue(report, generatorFinalSeverity(report), "FIELD_DISPLAY_NAME_DUPLICATE", "Duplicate DisplayName in data-list resource; Yeeflow runtime import may skip materializing the list/app shell.", { list: title, displayName });
      }
      fieldDisplayNames.add(displayName);
      fieldsByName.set(displayName, field);
    }
    validateAppCreationFieldRules(field, report, { list: title, path: fp });
    if (fieldId) fieldsByName.set(fieldId, field);
    if (!isRoot && resourceType === "data list" && fieldName === "Title" && (field.Status !== 0 || field.IsSystem !== true || field.IsIndex !== true || field.FieldIndex !== 0)) {
      issue(
        report,
        generatorFinalSeverity(report),
        "DATA_LIST_TITLE_FIELD_NATIVE_METADATA_INVALID",
        "Generated child data lists must preserve Yeeflow's native Title field metadata; otherwise import can succeed partially, list materialization can fail, or api/crafts/datas/{AppID}/{ListID}/query can fail or hang at runtime.",
        {
          list: title,
          listId,
          path: fp,
          status: field.Status,
          isSystem: field.IsSystem,
          isIndex: field.IsIndex,
          fieldIndex: field.FieldIndex,
          expected: { Status: 0, IsSystem: true, IsIndex: true, FieldIndex: 0 },
        }
      );
    }
    if (field.Rules && !tryParseJson(field.Rules)) {
      issue(report, "warning", "FIELD_RULES_JSON_INVALID", "Field Rules is not valid JSON.", { list: title, field: displayName || fieldName });
      issue(report, generatorFinalSeverity(report), "YAP_FIELD_RULES_JSON_INVALID", "Generated-final YAP field Rules must be valid stringified JSON.", { list: title, field: displayName || fieldName, path: `${fp}.Rules` });
    }
    validateFieldNameStorageTypeAlignment(field, title, fp, report);
    if (!isRoot && resourceType === "data list") validateCanonicalYapDataListFieldType(field, title, fp, report);
    validateDataListFieldTypeSettings(field, title, fp, report);
    validateFieldAgainstSchema(field, report._controlFieldSchemas).forEach((schemaIssue) => {
      issue(report, "warning", `FIELD_SCHEMA_${schemaIssue.code}`, schemaIssue.message, {
        list: title,
        path: fp,
        field: displayName || fieldName || null,
        fieldType: field.Type || null,
        ...(schemaIssue.detail || {}),
      });
    });
    if (normalizeType(field) === "unknown") issue(report, "warning", "FIELD_TYPE_UNKNOWN", "Field type could not be normalized.", { list: title, field: displayName || fieldName, fieldType: field.FieldType, controlType: field.Type });
  }
  if (listId) fieldsByList.set(listId, fieldsByName);
  if (!isRoot && resourceType === "document library") {
    validateDocumentLibraryFields(item, fieldsByName, pathPrefix, report);
  }
  if (!isRoot) validateDataListPermissionsAndNotifications(item, pathPrefix, resourceType, report);

  const layouts = asArray(item.Layouts);
  const layoutIds = new Set(layouts.map((layout) => safeString(layout.LayoutID)).filter(Boolean));
  const viewNames = new Set();
  const viewUrls = new Set();
  let defaultViewCount = 0;
  let viewCount = 0;
  if (!isRoot && item.ListModel && item.ListModel.LayoutView) {
    const listLayoutView = tryParseJson(item.ListModel.LayoutView);
    if (listLayoutView) {
      if (resourceType === "document library") {
        const assignedKeys = ["add", "edit", "view"].filter((key) => safeString(listLayoutView[key]));
        if (assignedKeys.length > 0 && assignedKeys.length < 3) {
          issue(report, "warning", "DOCUMENT_LIBRARY_LAYOUTVIEW_PARTIAL_ASSIGNMENT", "Document Library Sample uses null LayoutView for the minimal library, while configured libraries assign add/edit/view together. A partial New-only assignment is runtime-sensitive.", { list: title, assignedKeys });
        }
      }
      for (const key of ["add", "edit", "view"]) {
        const assignedLayoutId = safeString(listLayoutView[key]);
        if (assignedLayoutId && !layoutIds.has(assignedLayoutId)) {
          issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "LIST_LAYOUTVIEW_FORM_REFERENCE_UNRESOLVED", "ListModel.LayoutView add/edit/view points to a layout ID that does not belong to this list.", { list: title, key, assignedLayoutId });
        }
      }
      if (resourceType === "data list" && report.mode === "generator") {
        const customFormsByTitle = new Map(layouts.filter((layout) => Number(layout.Type) === 1 && layout.Title).map((layout) => [safeString(layout.Title).toLowerCase(), layout]));
        const editLayout = customFormsByTitle.get("edit item");
        const viewLayout = customFormsByTitle.get("view item");
        if (!editLayout) issue(report, "warning", "UI_STANDARD_EDIT_ITEM_FORM_MISSING", "Generated data lists should include a current-standard custom form titled \"Edit Item\".", { list: title, listId });
        if (!viewLayout) issue(report, "warning", "UI_STANDARD_VIEW_ITEM_FORM_MISSING", "Generated data lists should include a current-standard custom form titled \"View Item\".", { list: title, listId });
        if (editLayout && safeString(listLayoutView.add) !== safeString(editLayout.LayoutID)) {
          issue(report, "warning", "UI_STANDARD_NEW_NOT_USING_EDIT_ITEM_FORM", "Generated data-list New item display setting should use the Edit Item custom form.", { list: title, listId, expectedLayoutId: editLayout.LayoutID, actualLayoutId: listLayoutView.add });
        }
        if (editLayout && safeString(listLayoutView.edit) !== safeString(editLayout.LayoutID)) {
          issue(report, "warning", "UI_STANDARD_EDIT_NOT_USING_EDIT_ITEM_FORM", "Generated data-list Edit item display setting should use the Edit Item custom form.", { list: title, listId, expectedLayoutId: editLayout.LayoutID, actualLayoutId: listLayoutView.edit });
        }
        if (viewLayout && safeString(listLayoutView.view) !== safeString(viewLayout.LayoutID)) {
          issue(report, "warning", "UI_STANDARD_VIEW_NOT_USING_VIEW_ITEM_FORM", "Generated data-list View item display setting should use the View Item custom form.", { list: title, listId, expectedLayoutId: viewLayout.LayoutID, actualLayoutId: listLayoutView.view });
        }
      }
      validateCustomFormDisplaySettings(listLayoutView, layouts, report, { list: title, listId, path: `${pathPrefix}.ListModel.LayoutView` });
    }
  }
  layouts.forEach((layout, layoutIndex) => {
    const layoutId = safeString(layout.LayoutID);
    if (!layoutId) issue(report, "error", "LAYOUT_ID_MISSING", "LayoutID is required.", { path: `${pathPrefix}.Layouts[${layoutIndex}].LayoutID`, list: title });
    else {
      validateGeneratedIntegerId(layout.LayoutID, report, { path: `${pathPrefix}.Layouts[${layoutIndex}].LayoutID`, list: title, layout: layout.Title || null });
      validateUniqueGeneratedId(layout.LayoutID, layoutIdsByApp, report, "DUPLICATE_LAYOUT_ID", "LayoutID values must be globally unique across all ListExportItem.Layouts.", { path: `${pathPrefix}.Layouts[${layoutIndex}].LayoutID`, list: title, name: layout.Title || null });
      localIds.add(layoutId);
    }
    asArray(layout.LayoutInResources).forEach((resource, resourceIndex) => {
      if (resource && resource.ID !== undefined) {
        validateGeneratedIntegerId(resource.ID, report, { path: `${pathPrefix}.Layouts[${layoutIndex}].LayoutInResources[${resourceIndex}].ID`, list: title, layout: layout.Title || null });
        validateUniqueGeneratedId(resource.ID, layoutResourceIdsByApp, report, "DUPLICATE_RESOURCE_ID", "LayoutInResources ID values must be globally unique across layout resources.", { path: `${pathPrefix}.Layouts[${layoutIndex}].LayoutInResources[${resourceIndex}].ID`, list: title, name: layout.Title || null });
        localIds.add(safeString(resource.ID));
      }
      if (resource && resource.RefId !== undefined) {
        validateGeneratedIntegerId(resource.RefId, report, { path: `${pathPrefix}.Layouts[${layoutIndex}].LayoutInResources[${resourceIndex}].RefId`, list: title, layout: layout.Title || null });
        localIds.add(safeString(resource.RefId));
      }
    });
    if (!isRoot && Number(layout.Type) !== 1) {
      viewCount += 1;
      if (layout.IsDefault === true) defaultViewCount += 1;
      const viewName = safeString(layout.Title);
      if (!viewName) issue(report, "warning", "DATA_VIEW_NAME_MISSING", "Data view should have a name.", { path: `${pathPrefix}.Layouts[${layoutIndex}]`, list: title });
      else if (viewNames.has(viewName)) issue(report, "warning", "DATA_VIEW_NAME_DUPLICATE", "Data view names should be unique within a list-like resource unless a focused export proves duplicates are accepted.", { list: title, viewName });
      viewNames.add(viewName);
      const ext = tryParseJson(layout.Ext1) || {};
      for (const extKey of ["Ext1", "Ext2", "Ext3"]) {
        if (isMalformedJsonString(layout[extKey])) {
          issue(report, generatorFinalSeverity(report), "YAP_LAYOUT_EXT_JSON_INVALID", `Generated-final YAP layout ${extKey} must be valid JSON when it contains JSON text.`, { list: title, layout: layout.Title || null, path: `${pathPrefix}.Layouts[${layoutIndex}].${extKey}` });
        }
      }
      const viewUrl = safeString(ext.Url);
      if (viewUrl && viewUrls.has(viewUrl)) issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "DATA_VIEW_URL_DUPLICATE", "Data view URL/key should be unique within a list-like resource.", { list: title, viewUrl });
      if (viewUrl) viewUrls.add(viewUrl);
      validateDataListViewLayout(layout, fieldsByName, `${pathPrefix}.Layouts[${layoutIndex}]`, report, resourceType);
    }
    if (Number(layout.Type) === 1) validateCustomFormLayout(layout, fieldsByName, `${pathPrefix}.Layouts[${layoutIndex}]`, report, new Map(layouts.map((item) => [safeString(item.LayoutID), item]).filter(([id]) => Boolean(id))));
    if (Number(layout.Type) === 103 && isRoot) report.summary.dashboards += 1;
  });
  if (!isRoot && resourceType === "data list") validatePublicForms(item, fieldsByName, pathPrefix, report);
  if (!isRoot && viewCount === 0 && ["data list", "document library", "form report/list resource"].includes(resourceType)) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "DATA_VIEW_MISSING", "List-like resources should include at least one data view.", { list: title, resourceType });
  }
  if (!isRoot && viewCount > 0 && defaultViewCount === 0) {
    issue(report, "warning", "DATA_VIEW_DEFAULT_MISSING", "List-like resources should include one default data view; detect it with IsDefault=true rather than only the view name.", { list: title, resourceType });
  }
  if (!isRoot && defaultViewCount > 1) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "DATA_VIEW_DEFAULT_DUPLICATE", "Only one default data view is export-proven per list-like resource.", { list: title, defaultViewCount });
  }

  const recordCount = item.ListDatas && isObject(item.ListDatas) ? Object.keys(item.ListDatas).length : 0;
  if (item.ListDatas && !isObject(item.ListDatas)) issue(report, "error", "LISTDATAS_BAD_TYPE", "Item.ListDatas must be an object when present.", { path: `${pathPrefix}.ListDatas`, list: title });
  if (recordCount) {
    const recordIds = new Set();
    const documentFolderIds = new Set(Object.entries(item.ListDatas)
      .filter(([, record]) => isObject(record) && safeString(record.Text1).toLowerCase() === "folder")
      .flatMap(([recordId, record]) => [safeString(recordId), safeString(record.ListDataID)])
      .filter(Boolean));
    for (const [recordId, record] of Object.entries(item.ListDatas)) {
      const normalizedRecordId = safeString(recordId);
      const listDataId = safeString(record && record.ListDataID);
      const canonicalRecordId = listDataId || normalizedRecordId;
      if (canonicalRecordId) {
        if (recordIds.has(canonicalRecordId)) issue(report, "error", "LISTDATA_ID_DUPLICATE", "ListDataID/sample record IDs must be unique within a resource.", { list: title, recordId: canonicalRecordId });
        recordIds.add(canonicalRecordId);
      }
      if (recordId && LARGE_INTEGER_RE.test(recordId)) localIds.add(recordId);
      if (record && record.ListDataID && LARGE_INTEGER_RE.test(String(record.ListDataID))) localIds.add(String(record.ListDataID));
      if (isObject(record)) {
        Object.keys(record).forEach((key) => {
          if (!["ListDataID", "Created", "CreatedBy", "Modified", "ModifiedBy", "CreatedByName", "ModifiedByName"].includes(key) && !fieldsByName.has(key)) {
            issue(report, "warning", "SAMPLE_FIELD_NOT_FOUND", "Sample data field does not resolve to a known field.", { list: title, recordId, field: key });
          }
          if (resourceType === "document library" && key === "Text4" && record[key]) {
            issue(report, "warning", "DOCUMENT_LIBRARY_SAMPLE_FILE_CONTENT_PRESENT", "Document library sample data includes a Text4 upload value. Do not include raw file/document payloads in generated packages unless a focused runtime export proves the expected safe shape.", { list: title, recordId, field: key });
          }
        });
        if (resourceType === "document library" && safeString(record.Text1).toLowerCase() === "folder") {
          if (!listDataId) issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_LISTDATAID_MISSING", "Document library folder rows should include ListDataID.", { list: title, recordId });
          if (!safeString(record.Title)) issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_TITLE_MISSING", "Document library folder rows should include Title/Name.", { list: title, recordId });
          const parentId = safeString(record.Bigint1);
          if (parentId === "") issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_PARENT_MISSING", "Document library folder rows should include Bigint1/ParentID; root folders use \"0\" in studied exports.", { list: title, recordId });
          if (parentId && parentId !== "0" && !documentFolderIds.has(parentId)) {
            issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_PARENT_UNRESOLVED", "Document library folder ParentID should be 0 or point to another folder row.", { list: title, recordId, parentId });
          }
          if (record.Text4) issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_UPLOAD_PAYLOAD_PRESENT", "Document library folder rows should not include uploaded file payloads.", { list: title, recordId });
          if (record.Bigint2 !== undefined && record.Bigint2 !== "") issue(report, "warning", "DOCUMENT_LIBRARY_FOLDER_SIZE_UNUSUAL", "Studied document-library folder rows leave Bigint2/FileSize blank.", { list: title, recordId, value: record.Bigint2 });
        }
      }
    }
  }

  report.inventories.resources.push({ title, listId, listSetId, resourceType, fields: fields.length, layouts: layouts.length, sampleRecords: recordCount });
  if (!isRoot) report.summary.childResources += 1;
  if (resourceType === "data list") report.summary.dataLists += 1;
  if (resourceType === "document library") report.dependencies.push({ code: "DOCUMENT_LIBRARY_RESOURCE", message: "Document library resource present; validate Type 16 fields, views, forms, folder behavior, and upload behavior before runtime claims.", list: title, listId });
  if (resourceType === "report/data resource" || resourceType === "form report/list resource") report.summary.reports += 1;
}

function defaultCustomFormOpenModeForUsage(usage) {
  return usage === "view" ? "Slide in" : "Pop-up window";
}

function validateCustomFormDisplaySettings(layoutView, layouts, report, context) {
  if (!isObject(layoutView)) return;
  const customFormLayoutIds = new Set(asArray(layouts).filter((layout) => Number(layout.Type) === 1).map((layout) => safeString(layout.LayoutID)).filter(Boolean));
  const opentype = isObject(layoutView.opentype) ? layoutView.opentype : {};
  const modalsize = isObject(layoutView.modalsize) ? layoutView.modalsize : {};
  const finalGenerated = report.mode === "generator" && report.stage === "final";
  for (const usage of CUSTOM_FORM_DISPLAY_USAGES) {
    const formRef = safeString(layoutView[usage] === undefined ? "default" : layoutView[usage]);
    const usesDefault = formRef === "" || formRef === "default";
    if (usage === "add" && usesDefault && finalGenerated) {
      issue(report, "error", "LAYOUTVIEW_ADD_LAYOUT_MISSING", "Generated data lists must assign ListModel.LayoutView.add to a real custom form layout. A display setting with only opentype/modalsize can make the default New item modal load forever.", { ...context, usage, formRef });
    }
    if (!usesDefault && !customFormLayoutIds.has(formRef)) {
      issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_DISPLAY_FORM_REF_NOT_FOUND", "New/Edit/View display setting references a custom list form layout that does not exist.", { ...context, usage, formRef });
    }
    const rawOpenMode = safeString(opentype[usage]);
    const openMode = rawOpenMode ? CUSTOM_FORM_OPEN_MODE_LABELS[rawOpenMode] : defaultCustomFormOpenModeForUsage(usage);
    if (!openMode) issue(report, "warning", "CUSTOM_FORM_DISPLAY_OPEN_MODE_UNKNOWN", "Custom list form display setting uses an unknown open mode.", { ...context, usage, openMode: rawOpenMode });
    const rawSize = modalsize[usage];
    const hasSize = rawSize !== undefined && rawSize !== null && rawSize !== "";
    if (hasSize && !CUSTOM_FORM_SIZE_LABELS.has(Number(rawSize))) issue(report, "warning", "CUSTOM_FORM_DISPLAY_SIZE_UNKNOWN", "Custom list form display setting uses an unknown size code.", { ...context, usage, size: rawSize });
    if (openMode === "Full page" && hasSize) issue(report, "warning", "CUSTOM_FORM_DISPLAY_FULL_PAGE_SIZE_SET", "Full page display settings should not rely on pop-up/slide size behavior unless a future export proves it.", { ...context, usage, size: rawSize });
  }
  if (layoutView.sort !== undefined) {
    if (!Array.isArray(layoutView.sort)) {
      issue(report, finalGenerated ? "error" : "warning", "LAYOUTVIEW_SORT_SHAPE_UNSUPPORTED", "Data-list ListModel.LayoutView.sort must be omitted or use an export-supported array shape.", { ...context, shape: typeof layoutView.sort });
    } else {
      layoutView.sort.forEach((entry, index) => {
        if (isObject(entry)) {
          issue(report, finalGenerated ? "error" : "warning", "LAYOUTVIEW_SORT_OBJECT_UNSUPPORTED", "Data-list ListModel.LayoutView.sort object entries such as SortName/SortByDesc are not runtime-supported for display settings; omit sort or use an export-shaped field-id array.", { ...context, index });
        } else if (Array.isArray(entry) && !entry.every((fieldId) => typeof fieldId === "string" || typeof fieldId === "number")) {
          issue(report, finalGenerated ? "error" : "warning", "LAYOUTVIEW_SORT_FIELD_ARRAY_INVALID", "Data-list ListModel.LayoutView.sort field-id arrays must contain field IDs only.", { ...context, index });
        }
      });
    }
  }
}

function validateDataListViewLayout(layout, fieldsByName, pathPrefix, report, resourceType = "data list") {
  const view = tryParseJson(layout.LayoutView);
  const isFormReportResource = resourceType === "form report/list resource";
  const severity = report.mode === "generator" && report.stage === "final" && !isFormReportResource ? "error" : "warning";
  const type = safeString(layout.Type);
  const knownViewTypes = new Set(["0", "100", "104", "999"]);
  const listLikeViewTypes = new Set(["0", "104", "999"]);
  const ext = tryParseJson(layout.Ext1) || {};
  const viewTitle = layout.Title || null;
  if (!knownViewTypes.has(type)) {
    issue(report, "warning", "DATA_VIEW_TYPE_UNKNOWN", "Data view uses an unknown view Type; known export-proven codes are 0 list, 100 calendar, 104 kanban, and 999 gallery.", { path: pathPrefix, title: viewTitle, type });
  }
  if (type !== "0" && resourceType !== "data list") {
    issue(report, "warning", "DATA_VIEW_TYPE_RESOURCE_SCOPE_UNPROVEN", "Gallery, calendar, and kanban settings are data-list export-proven in this workspace but not yet proven for this resource type.", { path: pathPrefix, title: viewTitle, type, resourceType });
  }
  if (layout.IsDefault === true && safeString(ext.Url) && !["default", "all"].includes(safeString(ext.Url))) {
    issue(report, "warning", "DATA_VIEW_DEFAULT_URL_UNUSUAL", "Default views commonly use URL/key default or all in studied exports; confirm custom default URLs before relying on runtime behavior.", { path: pathPrefix, title: viewTitle, url: ext.Url });
  }
  if (!view) {
    if (resourceType === "document library") {
      issue(report, "warning", "DOCUMENT_LIBRARY_VIEW_LAYOUTVIEW_EMPTY_OR_INVALID", "A newly created document library export may have an empty default view LayoutView; configured libraries should use the normal list view layout JSON.", { path: `${pathPrefix}.LayoutView`, title: layout.Title || null });
      return;
    }
    issue(report, severity, "DATA_LIST_VIEW_LAYOUTVIEW_INVALID", "Data-list view LayoutView must be parseable JSON.", { path: `${pathPrefix}.LayoutView`, title: layout.Title });
    return;
  }
  if (Array.isArray(view.fields) && !Array.isArray(view.layout)) {
    issue(report, severity, "DATA_LIST_VIEW_LAYOUTVIEW_LIGHTWEIGHT_FIELDS", "Generated data-list view LayoutView uses a lightweight fields array instead of Yeeflow's layout/sort/query/rowColor/filter schema.", { title: layout.Title });
  }
  if (listLikeViewTypes.has(type)) {
    const formReportMinimalView = isFormReportResource && view.Attr_IsViewDetail !== undefined && !Array.isArray(view.layout) && !Array.isArray(view.query);
    if (!formReportMinimalView) {
      for (const key of ["layout", "query"]) {
        if (!Array.isArray(view[key])) {
          issue(report, severity, "DATA_LIST_VIEW_LAYOUTVIEW_REQUIRED_ARRAY_MISSING", `Data-list view LayoutView missing ${key} array.`, { title: layout.Title, key });
        }
      }
      for (const key of ["sort", "rowColor", "filter"]) {
        if (view[key] !== undefined && !Array.isArray(view[key])) {
          issue(report, severity, "DATA_LIST_VIEW_LAYOUTVIEW_OPTIONAL_ARRAY_INVALID", `Data-list view LayoutView ${key} should be an array when present.`, { title: layout.Title, key });
        }
      }
    }
  }
  if (type === "100") {
    const columns = isObject(view.Columns) ? view.Columns : null;
    if (!columns) issue(report, severity, "CALENDAR_VIEW_COLUMNS_MISSING", "Calendar view should include LayoutView.Columns.", { title: layout.Title });
    for (const [setting, fieldName] of Object.entries(columns || {})) {
      const ref = safeString(fieldName);
      if (ref && !fieldsByName.has(ref) && !KNOWN_SYSTEM_FIELDS.has(ref)) {
        issue(report, severity, "CALENDAR_VIEW_COLUMN_FIELD_NOT_FOUND", "Calendar view Columns setting references an unknown field.", { title: layout.Title, setting, fieldName: ref });
      }
    }
    for (const key of ["Scope", "DefaultColor", "ColorClass", "ColorClassSetting", "Filter", "ExternalSetting", "query"]) {
      if (view[key] === undefined) issue(report, "warning", "CALENDAR_VIEW_SETTING_MISSING", "Calendar view is missing a setting found in the studied export shape.", { title: layout.Title, key });
    }
  }
  if (type === "999") validateViewExtField(ext, "TitleField", fieldsByName, layout, report, severity);
  if (type === "999" && ext.CoverField !== undefined) validateViewExtField(ext, "CoverField", fieldsByName, layout, report, severity);
  if (type === "104") {
    validateViewExtField(ext, "TitleField", fieldsByName, layout, report, severity);
    validateViewExtField(ext, "CategoryField", fieldsByName, layout, report, severity);
    if (ext.CoverField !== undefined) validateViewExtField(ext, "CoverField", fieldsByName, layout, report, severity);
  }
  asArray(view.layout).forEach((column, index) => {
    const fieldId = safeString(column.FieldID);
    const fieldName = safeString(column.FieldName);
    const displayName = safeString(column.DisplayName);
    if (!fieldId || !fieldName || !displayName || column.Mobile === undefined || column.Order === undefined || column.Show === undefined || !safeString(column.Type)) {
      issue(report, severity, "DATA_LIST_VIEW_COLUMN_INCOMPLETE", "Data-list view layout column should include FieldID, FieldName, Mobile, Order, Show, Type, and DisplayName.", { title: layout.Title, index, fieldId, fieldName });
    }
    if (fieldId && !fieldsByName.has(fieldId)) {
      issue(report, severity, "DATA_LIST_VIEW_FIELDID_NOT_FOUND", "Data-list view FieldID does not resolve to a list field.", { title: layout.Title, index, fieldId });
    }
    if (fieldName && !fieldsByName.has(fieldName)) {
      issue(report, severity, "DATA_LIST_VIEW_FIELDNAME_NOT_FOUND", "Data-list view FieldName does not resolve to a list field.", { title: layout.Title, index, fieldName });
    }
    if (type === "0" && safeString(column.Type) === "textarea") {
      issue(report, severity, "DATA_LIST_VIEW_TEXTAREA_COLUMN_UNPROVEN", "Generated Type 0 data-list grid views should not include textarea columns; working app exports keep long text fields in forms but omit them from grid layout.", { title: layout.Title, index, fieldName });
    }
  });
  asArray(view.sort).forEach((sort, index) => {
    const fieldName = safeString(sort.SortName || sort.FieldName || sort.field);
    if (fieldName && !fieldsByName.has(fieldName) && !KNOWN_SYSTEM_FIELDS.has(fieldName)) {
      issue(report, severity, "DATA_VIEW_SORT_FIELD_NOT_FOUND", "Data view sort field does not resolve to a list field or known system field.", { title: layout.Title, index, fieldName });
    }
    if (sort.SortByDesc !== undefined && typeof sort.SortByDesc !== "boolean") {
      issue(report, severity, "DATA_VIEW_SORT_DIRECTION_INVALID", "Data view SortByDesc should be boolean when present.", { title: layout.Title, index });
    }
  });
  validateDataViewFixedFilters({
    filters: view.filter,
    fieldsByName,
    knownSystemFields: KNOWN_SYSTEM_FIELDS,
    severity,
    viewTitle: layout.Title || null,
    pathPrefix: `${pathPrefix}.LayoutView.filter`,
    addIssue: (severity, code, message, details) => issue(report, severity, code, message, details),
  });
  asArray(view.query).forEach((query, index) => {
    const fieldName = safeString(query.FieldName || query.field || query.Name);
    if (fieldName && !fieldsByName.has(fieldName) && !KNOWN_SYSTEM_FIELDS.has(fieldName)) {
      issue(report, severity, "DATA_VIEW_USER_FILTER_FIELD_NOT_FOUND", "Data view query/user-filter field does not resolve to a list field or known system field.", { title: layout.Title, index, fieldName });
    }
    if (query.IsFilter !== undefined && typeof query.IsFilter !== "boolean") {
      issue(report, "warning", "DATA_VIEW_USER_FILTER_FLAG_INVALID", "Data view query IsFilter should be boolean when present.", { title: layout.Title, index });
    }
  });
}

function validateViewExtField(ext, key, fieldsByName, layout, report, severity) {
  const raw = ext[key];
  const parsed = typeof raw === "string" ? tryParseJson(raw) : raw;
  if (!isObject(parsed)) {
    issue(report, severity, "DATA_VIEW_TYPE_SETTING_INVALID", `Data view ${key} setting should be a field reference object or JSON string.`, { title: layout.Title, key });
    return;
  }
  const fieldName = safeString(parsed.FieldName);
  const fieldId = safeString(parsed.FieldID);
  if (fieldName && !fieldsByName.has(fieldName) && !KNOWN_SYSTEM_FIELDS.has(fieldName)) {
    issue(report, severity, "DATA_VIEW_TYPE_SETTING_FIELD_NOT_FOUND", `Data view ${key} field name does not resolve to a list field.`, { title: layout.Title, key, fieldName });
  }
  if (fieldId && !fieldsByName.has(fieldId)) {
    issue(report, severity, "DATA_VIEW_TYPE_SETTING_FIELD_ID_NOT_FOUND", `Data view ${key} field ID does not resolve to a list field.`, { title: layout.Title, key, fieldId });
  }
}

function validateCustomFormLayout(layout, fieldsByName, pathPrefix, report, layoutsById = new Map()) {
  if (layout.LayoutView !== null && layout.LayoutView !== undefined) {
    if (!(isSchemaDirectYap(report) && layout.LayoutView === "")) {
      issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "CUSTOM_FORM_LAYOUTVIEW_NOT_NULL", "Custom form LayoutView should be null.", { path: `${pathPrefix}.LayoutView`, title: layout.Title });
    }
  }
  const resources = asArray(layout.LayoutInResources);
  if (!resources.length) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "CUSTOM_FORM_RESOURCE_MISSING", "Custom form LayoutInResources is missing.", { path: `${pathPrefix}.LayoutInResources`, title: layout.Title });
    return;
  }
  const layoutId = safeString(layout.LayoutID);
  const first = resources[0];
  if (safeString(first.ID) !== layoutId || safeString(first.RefId) !== layoutId) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "CUSTOM_FORM_RESOURCE_ID_MISMATCH", "LayoutInResources ID/RefId should match LayoutID.", { title: layout.Title, layoutId, id: first.ID, refId: first.RefId });
  }
  const form = tryParseJson(first.Resource);
  if (!form) {
    issue(report, "error", "CUSTOM_FORM_RESOURCE_JSON_INVALID", "Custom form Resource is not valid JSON.", { title: layout.Title });
    return;
  }
  for (const key of ["children", "attrs", "title", "filterVars", "ver", "tempVars"]) {
    if (form[key] === undefined) issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_REQUIRED_KEY_MISSING", `Custom form Resource missing ${key}.`, { title: layout.Title, key });
  }
  validateCustomFormActions(form, fieldsByName, pathPrefix, report, layout.Title, layoutsById);
  validateUiStandardFormRoot(form, report, { surface: "custom list form", title: layout.Title, path: pathPrefix });
  if (!hasSafeHorizontalPaddingNearRoot(form)) {
    uiStandardWarning(report, "UI_QUALITY_CUSTOM_FORM_SAFE_PADDING_MISSING", "Generated Data List custom forms should include safe left/right padding on an outer section or container so fields do not touch page edges.", { title: layout.Title, path: pathPrefix });
  }
  validateUiStandardContainers(form, report, { surface: "custom list form", title: layout.Title, path: pathPrefix, requireFormBody: false });
  if (!asArray(form.children).length) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "CUSTOM_FORM_EMPTY_CHILDREN", "Assigned custom form has no controls.", { title: layout.Title });
  }
  asArray(form.children).forEach((child, index) => walkControls(child, (control, pointer) => {
    validateEmbeddedControlSchema(control, report, {
      title: layout.Title,
      path: `${pathPrefix}.LayoutInResources[0].Resource.children[${index}]${pointer.slice(1)}`,
      surface: "custom list form",
    });
    validateAdvancedControl(control, report, {
      surface: "data-list-custom-form",
      title: layout.Title,
      path: `${pathPrefix}.LayoutInResources[0].Resource.children[${index}]${pointer.slice(1)}`,
      fieldsByName,
    });
    const binding = control.binding;
    if (binding && !(control.attrs && control.attrs.list_field === true) && !fieldsByName.has(String(binding))) {
      issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_BINDING_NOT_FOUND", "Custom form control binding does not resolve to a field.", { title: layout.Title, binding, path: `${pathPrefix}.LayoutInResources[0].Resource.children[${index}]${pointer.slice(1)}` });
    }
    if (control.fieldID && !fieldsByName.has(String(control.fieldID))) {
      issue(report, "warning", "CUSTOM_FORM_FIELDID_NOT_FOUND", "Custom form control fieldID does not resolve to a field.", { title: layout.Title, fieldID: control.fieldID });
    }
    if (DYNAMIC_DISPLAY_CONTROL_TYPES.has(safeString(control.type)) && safeString(control.attrs && control.attrs.source) === "4") {
      const fieldName = safeString(control.attrs && control.attrs["obj-f"]);
      const field = fieldsByName.get(fieldName);
      const controlPath = `${pathPrefix}.LayoutInResources[0].Resource.children[${index}]${pointer.slice(1)}`;
      if (!fieldName) {
        issue(report, generatorFinalSeverity(report), "CUSTOM_FORM_DYNAMIC_FIELD_BINDING_MISSING", "Dynamic controls on Data List custom forms should include attrs.obj-f for the current list item field.", { title: layout.Title, path: controlPath, controlType: control.type });
      } else if (!field) {
        issue(report, generatorFinalSeverity(report), "CUSTOM_FORM_DYNAMIC_FIELD_BINDING_UNRESOLVED", "Dynamic controls on Data List custom forms should bind to a field on the current list item.", { title: layout.Title, path: controlPath, controlType: control.type, fieldName });
      } else {
        validateDynamicFieldType(safeString(control.type), field, report, generatorFinalSeverity(report), { title: layout.Title, path: controlPath, host: "data-list-custom-form", controlType: control.type });
      }
    }
    if (safeString(control.type) === "list") validateCustomFormSubListControl(control, fieldsByName, report, { title: layout.Title, path: `${pathPrefix}.LayoutInResources[0].Resource.children[${index}]${pointer.slice(1)}` });
  }));
}

function validatePublicForms(item, fieldsByName, pathPrefix, report) {
  const publicForms = asArray(item.PublicForms);
  publicForms.forEach((publicForm, publicFormIndex) => {
    const context = {
      path: `${pathPrefix}.PublicForms[${publicFormIndex}]`,
      publicForm: publicForm && publicForm.Name || null,
    };
    if (!publicForm || !publicForm.Resource) {
      issue(report, generatorFinalSeverity(report), "PUBLIC_FORM_RESOURCE_MISSING", "PublicForms[] entry must include Resource.", context);
      return;
    }
    const resource = tryParseJson(publicForm.Resource);
    if (!resource) {
      issue(report, "error", "PUBLIC_FORM_RESOURCE_JSON_INVALID", "PublicForms[] Resource must be valid JSON.", context);
      return;
    }
    if (resource.pagetype !== 3) issue(report, "warning", "PUBLIC_FORM_PAGETYPE_UNKNOWN", "Data List Public Form Resource.pagetype is export-proven as 3.", { ...context, pagetype: resource.pagetype });
    if (!Array.isArray(resource.children)) {
      issue(report, generatorFinalSeverity(report), "PUBLIC_FORM_CHILDREN_NOT_ARRAY", "Data List Public Form Resource.children must be an array.", { ...context, location: `${context.path}.Resource.children` });
      return;
    }
    if (resource.tempVars !== undefined && !Array.isArray(resource.tempVars)) {
      issue(report, "warning", "PUBLIC_FORM_TEMPVARS_NOT_ARRAY", "Data List Public Form Resource.tempVars should be an array when present.", { ...context, location: `${context.path}.Resource.tempVars` });
    }
    for (const templateIssue of validatePublicFormPageLayout(resource, {
      pathPrefix: `${context.path}.Resource`,
      publicFormName: context.publicForm,
      severity: generatorFinalSeverity(report),
      generatedOutput: true,
    })) {
      issue(report, templateIssue.severity, templateIssue.code, templateIssue.message, templateIssue.details);
    }

    const seenControlIds = new Set();
    let submitControls = 0;
    resource.children.forEach((child, childIndex) => walkControls(child, (control, pointer) => {
      const type = safeString(control && control.type);
      const controlPath = `${context.path}.Resource.children[${childIndex}]${pointer.slice(1)}`;
      if (!type) return;
      if (type === "submit-button") submitControls += 1;
      if (type === "pivot-table") {
        issue(report, generatorFinalSeverity(report), "PIVOT_TABLE_PUBLIC_FORM_UNSUPPORTED", "Pivot Table is a Data Analytics control and should not be generated on Data List Public Forms.", { ...context, path: controlPath });
      }
      if (PUBLIC_FORM_DISALLOWED_CONTROL_TYPES.has(type)) {
        issue(report, generatorFinalSeverity(report), "PUBLIC_FORM_CONTROL_TYPE_NOT_ALLOWED", "This control type is not allowed on anonymous Data List Public Forms.", { ...context, path: controlPath, type });
      } else if (!PUBLIC_FORM_KNOWN_CONTROL_TYPES.has(type)) {
        issue(report, "warning", "PUBLIC_FORM_CONTROL_TYPE_UNKNOWN", "Public form uses a control type that is not yet export-proven for public forms.", { ...context, path: controlPath, type });
      }
      const controlId = safeString(control.id);
      if (controlId) {
        if (seenControlIds.has(controlId)) issue(report, "error", "PUBLIC_FORM_CONTROL_ID_DUPLICATE", "Public form control IDs must be unique within a form.", { ...context, path: controlPath, controlId });
        seenControlIds.add(controlId);
      }

      const binding = typeof control.binding === "string" ? control.binding : "";
      const field = control.fieldID ? fieldsByName.get(String(control.fieldID)) : binding ? fieldsByName.get(binding) : null;
      const isNestedListField = control.attrs && control.attrs.list_field === true;
      if ((binding || control.fieldID) && !isNestedListField && type !== "total") {
        if (!field) {
          issue(report, generatorFinalSeverity(report), "PUBLIC_FORM_FIELD_BINDING_NOT_FOUND", "Public form list-bound control does not resolve to a field in the same data list.", { ...context, path: controlPath, binding: binding || null, type });
          return;
        }
        const fieldName = safeString(field.FieldName);
        const fieldType = safeString(field.Type);
        if (PUBLIC_FORM_DISALLOWED_SYSTEM_FIELDS.has(fieldName)) {
          issue(report, generatorFinalSeverity(report), "PUBLIC_FORM_DEFAULT_FIELD_NOT_ALLOWED", "Default/system list fields should not be generated into Public Forms. Title is the export-proven primary-field exception.", { ...context, path: controlPath, fieldName, fieldType });
        }
        if (PUBLIC_FORM_DISALLOWED_FIELD_TYPES.has(fieldType)) {
          issue(report, generatorFinalSeverity(report), "PUBLIC_FORM_FIELD_TYPE_NOT_ALLOWED", "This field type is UI-reference-backed as unavailable for Data List Public Forms.", { ...context, path: controlPath, fieldName, fieldType });
        } else if (!PUBLIC_FORM_ALLOWED_FIELD_TYPES.has(fieldType)) {
          issue(report, "warning", "PUBLIC_FORM_FIELD_TYPE_UNPROVEN", "Public form uses a field type that is not in the export-proven allowed set from Data Lists (4).yap.", { ...context, path: controlPath, fieldName, fieldType });
        }
      }
    }));
    if (!submitControls) issue(report, "warning", "PUBLIC_FORM_SUBMIT_CONTROL_MISSING", "Public forms intended for anonymous collection should include an export-proven submit control.", context);
  });
}

function customFormTempVarAliases(tempVar) {
  const id = safeString(tempVar && tempVar.id);
  if (!id) return [];
  return [id, id.startsWith("__temp_") ? id.replace(/^__temp_/, "") : `__temp_${id}`];
}

function collectCustomFormActionRefs(value) {
  const refs = { fields: [], tempVars: [] };
  walk(value, (node) => {
    if (!isObject(node)) return;
    if (node.exprType === "list_field" && node.prop) refs.fields.push(String(node.prop));
    if (node.exprType === "variable" && (node.id || node.name)) refs.tempVars.push(String(node.id || node.name));
  });
  return refs;
}

function validateCustomFormActions(form, fieldsByName, pathPrefix, report, title, layoutsById = new Map()) {
  if (form.tempVars !== undefined && !Array.isArray(form.tempVars)) {
    issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_TEMPVARS_NOT_ARRAY", "Custom form tempVars must be an array.", { title, path: `${pathPrefix}.LayoutInResources[0].Resource.tempVars` });
  }
  if (form.actions !== undefined && !Array.isArray(form.actions)) {
    issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_ACTIONS_NOT_ARRAY", "Custom form actions must be an array when present.", { title, path: `${pathPrefix}.LayoutInResources[0].Resource.actions` });
  }
  const tempVars = new Set();
  const seenTempVars = new Set();
  asArray(form.tempVars).forEach((tempVar, index) => {
    if (!tempVar || !tempVar.id) {
      issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_TEMPVAR_ID_MISSING", "Custom form tempVars entries should include id.", { title, path: `${pathPrefix}.LayoutInResources[0].Resource.tempVars[${index}]` });
      return;
    }
    for (const alias of customFormTempVarAliases(tempVar)) tempVars.add(alias);
    const id = safeString(tempVar.id);
    if (seenTempVars.has(id)) issue(report, "error", "CUSTOM_FORM_TEMPVAR_ID_DUPLICATE", "Custom form tempVars ids should be unique within the form.", { title, path: `${pathPrefix}.LayoutInResources[0].Resource.tempVars[${index}]`, id });
    seenTempVars.add(id);
  });

  const actionIds = new Set();
  asArray(form.actions).forEach((action, actionIndex) => {
    if (!action || !action.id) {
      issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_ACTION_ID_MISSING", "Custom form actions should include id.", { title, path: `${pathPrefix}.LayoutInResources[0].Resource.actions[${actionIndex}]` });
    } else if (actionIds.has(String(action.id))) {
      issue(report, "error", "CUSTOM_FORM_ACTION_ID_DUPLICATE", "Custom form action ids should be unique within the form.", { title, actionId: action.id });
    } else {
      actionIds.add(String(action.id));
    }
    if (!Array.isArray(action && action.steps)) {
      issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_ACTION_STEPS_NOT_ARRAY", "Custom form action steps must be an array.", { title, actionName: action && action.name || null });
    }
    asArray(action && action.steps).forEach((step, stepIndex) => {
      if (!step || !step.type) issue(report, "warning", "CUSTOM_FORM_ACTION_STEP_TYPE_MISSING", "Custom form action step should include type.", { title, actionName: action.name || null, stepIndex });
      if (step && step.type && !["setvar", "submit", "submit_form", "save", "close", "open", "message", "print"].includes(String(step.type))) {
        issue(report, "warning", "CUSTOM_FORM_ACTION_STEP_UNKNOWN", "Custom form action step type is not yet export-learned.", { title, actionName: action.name || null, stepIndex, stepType: step.type });
      }
      if (safeString(step && step.type) === "print") {
        const attrs = step.attrs || {};
        const layoutId = safeString(attrs.layout);
        if (!layoutId) {
          issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_PRINT_ACTION_LAYOUT_MISSING", "Print page action step should include attrs.layout pointing to the target Print Page custom form.", { title, actionName: action.name || null, stepIndex });
        } else if (!layoutsById.has(layoutId)) {
          issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_PRINT_ACTION_LAYOUT_UNRESOLVED", "Print page action target layout must resolve to an existing custom form on the current list.", { title, actionName: action.name || null, stepIndex, layoutId });
        } else {
          const target = layoutsById.get(layoutId);
          const targetName = safeString(target.Title || target.Name || target.LayoutName);
          if (!/print/i.test(targetName)) issue(report, "warning", "CUSTOM_FORM_PRINT_ACTION_TARGET_NOT_PRINT_NAMED", "Print page action target resolves, but target form name does not indicate a print page; verify this is intentional.", { title, actionName: action.name || null, stepIndex, targetName });
        }
        if (safeString(attrs.printtype) && safeString(attrs.printtype) !== "select") issue(report, "warning", "CUSTOM_FORM_PRINT_ACTION_PRINTTYPE_UNSTUDIED", "The studied Print page action uses attrs.printtype = \"select\".", { title, actionName: action.name || null, stepIndex, printtype: attrs.printtype });
        if (!asArray(attrs.listdataid).length) issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_PRINT_ACTION_LISTDATAID_MISSING", "Print page action should pass current record context through attrs.listdataid.", { title, actionName: action.name || null, stepIndex });
      }
      const refs = collectCustomFormActionRefs(step);
      refs.fields.forEach((fieldRef) => {
        if (!fieldsByName.has(fieldRef) && !KNOWN_SYSTEM_FIELDS.has(fieldRef)) issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_ACTION_FIELD_REF_NOT_FOUND", "Custom form action references an unknown list field.", { title, actionName: action.name || null, fieldRef });
      });
      refs.tempVars.forEach((tempVar) => {
        if (!tempVars.has(tempVar) && !tempVars.has(tempVar.replace(/^__temp_/, ""))) issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_ACTION_TEMPVAR_REF_NOT_FOUND", "Custom form action references an unknown temp variable.", { title, actionName: action.name || null, tempVar });
      });
    });
  });
  for (const [hook, actionId] of Object.entries(form.formAction || {})) {
    if (actionId && !actionIds.has(String(actionId))) {
      issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_FORMACTION_REF_NOT_FOUND", "Custom form formAction hook references an unknown action.", { title, hook, actionId });
    }
  }
  asArray(form.children).forEach((child, index) => walkControls(child, (control, pointer) => {
    const actionId = control && control.attrs && control.attrs.control_action;
    if (actionId && !actionIds.has(String(actionId))) {
      issue(report, report.mode === "generator" ? "error" : "warning", "CUSTOM_FORM_BUTTON_ACTION_REF_NOT_FOUND", "Custom form action button references an unknown action.", { title, actionId, path: `${pathPrefix}.LayoutInResources[0].Resource.children[${index}]${pointer.slice(1)}` });
    }
  }));
}

function validateCustomFormSubListControl(control, fieldsByName, report, context) {
  const variables = asArray(control.attrs && control.attrs["list-variables"]);
  const listFields = asArray(control.attrs && control.attrs["list-fields"]);
  const layout = safeString(control.attrs && control.attrs["list-display-preference"]);
  if (!variables.length) issue(report, "warning", "CUSTOM_FORM_SUBLIST_VARIABLES_MISSING", "Sub-list custom form control should include attrs.list-variables.", context);
  if (!listFields.length) issue(report, "warning", "CUSTOM_FORM_SUBLIST_FIELDS_MISSING", "Sub-list custom form control should include attrs.list-fields.", context);
  const variableNames = new Set(variables.map((item) => safeString(item && item.name)).filter(Boolean));
  const variableIds = new Set(variables.map((item) => safeString(item && item.id)).filter(Boolean));
  listFields.forEach((entry, index) => {
    const name = safeString(entry && entry.name);
    if (name && !variableNames.has(name)) issue(report, "warning", "CUSTOM_FORM_SUBLIST_FIELD_VARIABLE_NOT_FOUND", "Sub-list attrs.list-fields entry should resolve to attrs.list-variables by name.", { ...context, index, name });
    const nestedControl = entry && entry.control;
    if (!nestedControl || !nestedControl.type || !nestedControl.binding) issue(report, "warning", "CUSTOM_FORM_SUBLIST_NESTED_CONTROL_INCOMPLETE", "Sub-list nested field controls should include type and binding.", { ...context, index, name });
    if (nestedControl && nestedControl.attrs && nestedControl.attrs.list_field_binding !== control.binding) {
      issue(report, "warning", "CUSTOM_FORM_SUBLIST_PARENT_BINDING_MISMATCH", "Sub-list nested field control should point back to the parent sub-list field binding.", { ...context, index, name });
    }
  });
  const boundField = fieldsByName.get(safeString(control.binding));
  const rules = tryParseJson(boundField && boundField.Rules) || {};
  const ruleVariables = asArray(rules["list-variables"]);
  if (boundField && ruleVariables.length && variables.length !== ruleVariables.length) {
    issue(report, "warning", "CUSTOM_FORM_SUBLIST_VARIABLE_COUNT_DIFFERS_FROM_FIELD_RULES", "Sub-list form control variable count differs from the parent field Rules.list-variables count.", { ...context, controlVariables: variables.length, fieldRuleVariables: ruleVariables.length });
  }
  asArray(control.attrs && control.attrs["list-fields-summary"]).forEach((summary, index) => {
    const fieldId = safeString(summary && summary.field);
    if (fieldId && !variableIds.has(fieldId) && !variableNames.has(fieldId)) {
      issue(report, "warning", "CUSTOM_FORM_SUBLIST_SUMMARY_FIELD_UNRESOLVED", "Sub-list summary field should resolve to the control's row variables. Data List custom-form Sub List summaries are product-understanding-backed unless separately export-proven.", { ...context, index, fieldId });
    }
  });
  if (layout === "dynamic") {
    const body = asArray(control.children).find((child) => child && child.type === "list-body");
    if (!body) {
      issue(report, "warning", "CUSTOM_FORM_SUBLIST_DYNAMIC_BODY_MISSING", "Dynamic content Sub List should include a list-body item template. Data List custom-form dynamic Sub List support is product-understanding-backed unless separately export-proven.", context);
    } else {
      let childCount = 0;
      walkControls(body, (node) => {
        if (node !== body && node.type) childCount += 1;
        if (!node.attrs || node.attrs.list_field !== true) return;
        const fieldBinding = safeString(node.binding);
        if (fieldBinding && !variableIds.has(fieldBinding) && !variableNames.has(fieldBinding)) {
          issue(report, "warning", "CUSTOM_FORM_SUBLIST_DYNAMIC_FIELD_UNRESOLVED", "Dynamic Sub List item-template field binding should resolve to a row variable.", { ...context, fieldBinding });
        }
        if (safeString(node.attrs.list_field_binding) !== safeString(control.binding)) {
          issue(report, "warning", "CUSTOM_FORM_SUBLIST_DYNAMIC_PARENT_BINDING_MISMATCH", "Dynamic Sub List item-template field control should keep attrs.list_field_binding equal to the parent Sub List binding.", { ...context, fieldBinding });
        }
      });
      if (!childCount) issue(report, "warning", "CUSTOM_FORM_SUBLIST_DYNAMIC_TEMPLATE_EMPTY", "Dynamic content Sub List should include child controls inside list-body.", context);
    }
    const actionLabels = [];
    walkControls(control, (node) => {
      if (node.type === "action_button") actionLabels.push(safeString(node.label || node.nv_label));
    });
    if (/print/i.test(safeString(context.title)) && actionLabels.some((label) => /add|import|delete|duplicate|insert|move/i.test(label))) {
      issue(report, "warning", "CUSTOM_FORM_PRINT_SUBLIST_ACTIONS_PRESENT", "Print Page read-only Dynamic Sub Lists usually should not expose Add/Import/Edit row actions unless intentionally configured.", { ...context, buttons: actionLabels.filter(Boolean) });
    }
  } else if (layout && !["default", "responsive", "table", "table-view", "card", "card-view", "dynamic"].includes(layout)) {
    issue(report, "warning", "CUSTOM_FORM_SUBLIST_LAYOUT_MODE_UNSTUDIED", "Sub-list custom form layout mode is not covered by current export-backed validation.", { ...context, layout });
  }
  const actions = control.attrs && control.attrs.actions;
  if (actions !== undefined && !Array.isArray(actions)) {
    issue(report, "warning", "CUSTOM_FORM_SUBLIST_ACTIONS_NOT_ARRAY", "Sub List list actions should be stored as attrs.actions[] when configured.", context);
  }
  const allowedStepTypes = new Set(["list_new", "list_import", "list_dup", "list_del", "list_move", "list_update"]);
  asArray(actions).forEach((action, actionIndex) => {
    if (!action || typeof action !== "object") {
      issue(report, "warning", "CUSTOM_FORM_SUBLIST_ACTION_BAD_SHAPE", "Sub List list action entries should be objects.", { ...context, actionIndex });
      return;
    }
    if (safeString(action.type) && safeString(action.type) !== "list") {
      issue(report, "warning", "CUSTOM_FORM_SUBLIST_ACTION_TYPE_UNEXPECTED", "Approval Form export-proven Sub List actions use type = \"list\"; verify Data List custom-form variants separately.", { ...context, actionIndex, type: safeString(action.type) });
    }
    asArray(action.steps).forEach((step, stepIndex) => {
      const stepType = safeString(step && step.type);
      if (!stepType) {
        issue(report, "warning", "CUSTOM_FORM_SUBLIST_ACTION_STEP_TYPE_MISSING", "Sub List list action steps should include type.", { ...context, actionIndex, stepIndex });
      } else if (!allowedStepTypes.has(stepType)) {
        issue(report, "warning", "CUSTOM_FORM_SUBLIST_ACTION_STEP_TYPE_UNSTUDIED", "Sub List list action step type is not export-proven by the current study.", { ...context, actionIndex, stepIndex, stepType });
      }
    });
  });
}

function validateCustomFormDocLibraryControls(data, listsById, fieldsByList, report) {
  const items = [data && data.Item, ...asArray(data && data.Childs)];
  items.forEach((item, itemIndex) => {
    const pathPrefix = itemIndex === 0 ? "$.Item" : `$.Childs[${itemIndex - 1}]`;
    asArray(item && item.Layouts).forEach((layout, layoutIndex) => {
      if (Number(layout.Type) !== 1) return;
      const resource = asArray(layout.LayoutInResources)[0];
      const form = resource && tryParseJson(resource.Resource);
      if (!form) return;
      const layoutId = safeString(layout.LayoutID);
      asArray(form.children).forEach((child, childIndex) => {
        walkControls(child, (control, pointer) => {
          if (safeString(control.type) !== "document-library") return;
          validateDashboardDocLibraryControl(control, layout.Title, layoutId, `${pathPrefix}.Layouts[${layoutIndex}].LayoutInResources[0].Resource.children[${childIndex}]${pointer.slice(1)}`, listsById, fieldsByList, report);
        });
      });
    });
  });
}

function validateEmbeddedControlSchema(control, report, context) {
  validateControlAgainstSchema(control, report._controlFieldSchemas).forEach((schemaIssue) => {
    issue(report, "warning", `CONTROL_SCHEMA_${schemaIssue.code}`, schemaIssue.message, {
      surface: context.surface,
      title: context.title,
      path: schemaIssue.detail && schemaIssue.detail.path ? `${context.path}.${schemaIssue.detail.path}` : context.path,
      controlType: control && control.type || null,
      ...(schemaIssue.detail || {}),
    });
  });
  if (context.surface === "approval form page" && Object.prototype.hasOwnProperty.call(control || {}, "binding") && control.binding !== undefined && control.binding !== null && typeof control.binding !== "string") {
    issue(report, generatorFinalSeverity(report), "YAP_FORM_CONTROL_BINDING_NOT_STRING", "Generated approval form controls must store binding as a string variable or field id; object binding values can leave the designer loading.", {
      surface: context.surface,
      title: context.title,
      path: `${context.path}.binding`,
      controlType: control && control.type || null,
      bindingType: Array.isArray(control && control.binding) ? "array" : typeof (control && control.binding),
    });
  }
  if (context.surface === "approval form page" && safeString(control && control.type).toLowerCase() === "date") {
    issue(report, generatorFinalSeverity(report), "YAP_FORM_DATE_CONTROL_LEGACY", "Generated approval forms must use the export-backed datepicker control type; legacy date controls can fail designer hydration.", {
      surface: context.surface,
      title: context.title,
      path: `${context.path}.type`,
      controlType: control && control.type || null,
    });
  }
  const width = control && control.attrs && control.attrs.common && control.attrs.common.positioning && control.attrs.common.positioning.width;
  if (context.surface === "approval form page" && isNumericStringConfig(width)) {
    issue(report, generatorFinalSeverity(report), "YAP_FORM_CONTROL_WIDTH_STRING_INVALID", "Generated approval form control widths must use Yeeflow config pair values, for example width: [null, 960] and widthu: [null, \"px\"], not numeric strings.", {
      surface: context.surface,
      title: context.title,
      path: `${context.path}.attrs.common.positioning.width`,
      controlType: control && control.type || null,
      width,
    });
  }
  if (
    report.mode === "generator" &&
    report.stage === "final" &&
    isGeneratedValueControl(control && control.type) &&
    control.readonly !== true &&
    !control.binding
  ) {
    issue(report, "warning", "CONTROL_BINDING_MISSING_FOR_VALUE_CONTROL", "Generated value-entry controls should usually include a binding unless intentionally display-only.", {
      surface: context.surface,
      title: context.title,
      path: context.path,
      controlType: control.type,
      label: control.label || control.nv_label || null,
    });
  }
  validateEmbeddedControlExpressions(control, report, context);
}

function validateEmbeddedControlExpressions(control, report, context) {
  const candidates = [
    { value: control && control.attrs && control.attrs.calculated, label: "attrs.calculated" },
    { value: control && control.attrs && control.attrs.formula, label: "attrs.formula" },
    { value: control && control.attrs && control.attrs.default_value_expr, label: "attrs.default_value_expr" },
  ].filter((entry) => entry.value);
  for (const entry of candidates) {
    const expressionReport = validateExpressionTokens(entry.value, { path: `${context.path}.${entry.label}` });
    expressionReport.issues.forEach((expressionIssue) => {
      issue(report, expressionIssue.code === "EXPRESSION_NOT_ARRAY" ? "error" : "warning", expressionIssue.code, expressionIssue.message, {
        surface: context.surface,
        title: context.title,
        path: expressionIssue.path,
        controlType: control && control.type || null,
        detail: expressionIssue.detail || null,
      });
    });
  }
  asArray(control && control.attrs && control.attrs.control_display).forEach((rule, index) => {
    if (!rule || !rule.formulas) return;
    const expressionReport = validateExpressionTokens(rule.formulas, { path: `${context.path}.attrs.control_display[${index}].formulas` });
    expressionReport.issues.forEach((expressionIssue) => {
      issue(report, "warning", expressionIssue.code, expressionIssue.message, {
        surface: context.surface,
        title: context.title,
        path: expressionIssue.path,
        controlType: control && control.type || null,
        detail: expressionIssue.detail || null,
      });
    });
  });
}

function validateReplaceIds(replaceIds, localIds, report) {
  if (isSchemaDirectYap(report)) return;
  if (!replaceIds.size) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "REPLACEIDS_EMPTY", "Resource.ReplaceIds is empty or unavailable. Generated-final YAP packages must rebuild ReplaceIds from the final decoded package before import.");
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "YAP_REPLACEIDS_EMPTY", "Resource.ReplaceIds must not be empty for generated-final YAP packages with local generated resources.");
    return;
  }
  const seen = new Set();
  for (const id of replaceIds) {
    if (seen.has(id)) issue(report, "warning", "REPLACEIDS_DUPLICATE", "Duplicate ID found in ReplaceIds.", { id });
    seen.add(id);
  }
  let missing = 0;
  for (const id of localIds) {
    if (!replaceIds.has(id)) {
      missing += 1;
      if (missing <= 20) {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "LOCAL_ID_NOT_IN_REPLACEIDS", "Local app/list/field/layout/sample ID is not present in ReplaceIds. Rebuild ReplaceIds from the final decoded package rather than reusing a baseline package's list.", { id });
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "YAP_REPLACEIDS_FINAL_COVERAGE_INCOMPLETE", "Generated-final YAP Resource.ReplaceIds is missing a local generated resource ID collected from the final decoded package.", { id });
      }
    }
  }
  if (missing > 20) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "LOCAL_ID_NOT_IN_REPLACEIDS_TRUNCATED", "Additional local IDs are missing from ReplaceIds. Generated-final packages must include complete final-package ID coverage before import.", { additionalCount: missing - 20 });
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "YAP_REPLACEIDS_FINAL_COVERAGE_INCOMPLETE", "Additional local generated resource IDs are missing from Resource.ReplaceIds.", { additionalCount: missing - 20 });
  }
}

function validateForms(data, listsById, fieldsByList, replaceIds, localIds, report, aiResourcesById = new Map()) {
  const forms = asArray(data && data.Forms);
  report.summary.forms = forms.length;
  forms.forEach((form, index) => {
    const formName = safeString(form.Name);
    const key = safeString(form.Key);
    const workflowType = String(form.WorkflowType || "");
    if (isMalformedJsonString(form.Settings)) {
      issue(report, generatorFinalSeverity(report), "YAP_FORM_SETTINGS_JSON_INVALID", "Generated-final YAP form Settings must be valid JSON when it contains JSON text.", { form: formName, key, index });
    }
    if (!formName) issue(report, "warning", "FORM_NAME_MISSING", "Form Name is missing.", { index });
    if (!key) issue(report, "error", "FORM_KEY_MISSING", "Form Key is required.", { form: formName, index });
    validateProcessKey(key, report, { form: formName, path: `Data.Forms[${index}].Key` });
    validateProcessKey(form.FlowKey, report, { form: formName, path: `Data.Forms[${index}].FlowKey` });
    if (!workflowType) issue(report, "warning", "FORM_WORKFLOWTYPE_MISSING", "Form WorkflowType is missing.", { form: formName, key });
    const def = parseDefResource(form, report, index);
    const shapes = collectShapes(def);
    const nodeTypes = {};
    shapes.forEach((shape) => { nodeTypes[shapeType(shape)] = (nodeTypes[shapeType(shape)] || 0) + 1; });
    const scheduledLike = workflowType === "3";
    const hasApprovalTask = shapes.some((shape) => shapeType(shape) === "MultiAssignmentTask");
    const approvalLike = workflowType === "2" || (!scheduledLike && hasApprovalTask && asArray(def && def.pageurls).length >= 2);
    if (approvalLike) report.summary.approvalForms += 1;
    else if (scheduledLike) report.summary.scheduledWorkflows += 1;
    else report.summary.listWorkflows += 1;
    report.inventories.forms.push({ name: formName, key, workflowType, kind: approvalLike ? "approval form" : scheduledLike ? "scheduled workflow" : "list/process workflow", pages: asArray(def && def.pageurls).length, nodeTypes });
    if (approvalLike && String(form.ListID || "0") === "0") validateNoRule(form, report, { form: formName, key, path: `Data.Forms[${index}]` });
    if (approvalLike && Object.prototype.hasOwnProperty.call(form, "ListID") && String(form.ListID) !== "0") {
      issue(
        report,
        report.mode === "generator" && report.stage === "final" ? "error" : "warning",
        "APPROVAL_FORM_LISTID_NOT_ZERO",
        "App-level approval form registration should keep Data.Forms[].ListID as 0; using the ProcModelID here can import without registering the form in navigation.",
        { form: formName, key, listId: safeString(form.ListID), procModelId: safeString(form.ProcModelID) }
      );
    }
    if (!def) return;
    validateProcessKey(def.defkey, report, { form: formName, path: `Data.Forms[${index}].DefResource.defkey` });
    if (def.defkey && key && String(def.defkey) !== key) issue(report, "warning", "FORM_DEFKEY_MISMATCH", "Form Key and decoded Def defkey differ.", { form: formName, key, defkey: def.defkey });
    validateWorkflowDesignerCompatibility(form, def, report);
    if (scheduledLike) validateScheduledWorkflow(form, def, report);
    else validateListWorkflowRegistration(form, listsById, fieldsByList, report);
    if (approvalLike) validateApprovalDef(def, form, report, listsById, fieldsByList);
    validateFormLookupControls(def, form, listsById, fieldsByList, report);
    validateWorkflowGraph(def, form, report);
    validateWorkflowActionConfigurations(def, form, report);
    validateWorkflowReferences(def, form, listsById, fieldsByList, report, aiResourcesById);
    if (Object.prototype.hasOwnProperty.call(nodeTypes, "AI")) issue(report, "dependency", "AI_NODE_PRESENT", "AI node present in workflow; validate agent/tool dependencies before generated package use.", { form: formName, key });
    if (Object.prototype.hasOwnProperty.call(nodeTypes, "HttpRequest")) issue(report, "dependency", "HTTP_REQUEST_NODE_PRESENT", "HTTP request node present; external connection/credential dependency must be resolved.", { form: formName, key });
    if (Object.prototype.hasOwnProperty.call(nodeTypes, "GenerateDocument")) issue(report, "dependency", "GENERATE_DOCUMENT_NODE_PRESENT", "Document generation node present; template/library dependencies must be resolved.", { form: formName, key });
  });
}

function validateWorkflowDesignerCompatibility(form, def, report) {
  const severity = generatorFinalSeverity(report);
  const formName = safeString(form.Name);
  const key = safeString(form.Key);
  if (!Array.isArray(def.pageurls)) issue(report, severity, "WORKFLOW_DEF_PAGEURLS_NOT_ARRAY", "Workflow designer expects DefResource.pageurls to be an array, even for list workflows with no pages.", { form: formName, key });
  if (!Array.isArray(def.flowPage)) issue(report, severity, "WORKFLOW_DEF_FLOWPAGE_NOT_ARRAY", "Workflow designer expects DefResource.flowPage to be an array.", { form: formName, key });
  if (!isObject(def.variables)) {
    issue(report, severity, "WORKFLOW_DEF_VARIABLES_INVALID", "Workflow designer expects DefResource.variables to be an object with basic/listref/filter arrays.", { form: formName, key });
  } else {
    for (const group of ["basic", "listref", "filter"]) {
      if (!Array.isArray(def.variables[group])) {
        issue(report, severity, "WORKFLOW_DEF_VARIABLE_GROUP_NOT_ARRAY", "Workflow designer expects DefResource.variables.basic/listref/filter to be arrays.", { form: formName, key, group });
      }
    }
  }
  if (!isObject(def.graphposition)) issue(report, severity, "WORKFLOW_DEF_GRAPHPOSITION_MISSING", "Workflow designer expects DefResource.graphposition metadata.", { form: formName, key });
  if (def.graphzoom === undefined) issue(report, severity, "WORKFLOW_DEF_GRAPHZOOM_MISSING", "Workflow designer expects DefResource.graphzoom metadata.", { form: formName, key });
  if (def.graphver === undefined) issue(report, severity, "WORKFLOW_DEF_GRAPHVER_MISSING", "Workflow designer expects DefResource.graphver metadata.", { form: formName, key });
  if (def.lineType !== "rounded") {
    issue(report, severity, "WORKFLOW_DEF_LINETYPE_NOT_ROUNDED", "New workflow designer exports require DefResource.lineType = rounded.", { form: formName, key, actual: def.lineType ?? null, expected: "rounded" });
  }
  if (Number(def.graphver) !== 2) {
    issue(report, severity, "WORKFLOW_DEF_GRAPHVER_NOT_V2", "New workflow designer exports require DefResource.graphver = 2.", { form: formName, key, actual: def.graphver ?? null, expected: 2 });
  }

  const shapes = collectShapes(def);
  const workflowVariables = collectWorkflowVariables(def);
  shapes.forEach((shape, index) => {
    const type = shapeType(shape);
    const id = safeString(shape.id);
    const resourceId = safeString(shape.resourceid);
    if (!id || !resourceId) {
      issue(report, severity, "WORKFLOW_SHAPE_ID_MISSING", "Workflow designer expects each childshape to include both id and resourceid.", { form: formName, key, index, type, id, resourceid: resourceId });
    }
    if (type === "SequenceFlow") {
      if (!shape.source || !safeString(shape.source.id) || !safeString(shape.source.resourceid)) {
        issue(report, severity, "WORKFLOW_SEQUENCE_SOURCE_INVALID", "SequenceFlow source should include id and resourceid.", { form: formName, key, index });
      }
      if (!shape.target || !safeString(shape.target.id) || !safeString(shape.target.resourceid)) {
        issue(report, severity, "WORKFLOW_SEQUENCE_TARGET_INVALID", "SequenceFlow target should include id and resourceid.", { form: formName, key, index });
      }
      if (shape.properties?.linetype !== "rounded") {
        issue(report, severity, "WORKFLOW_SEQUENCE_LINETYPE_NOT_ROUNDED", "New workflow designer SequenceFlow must set properties.linetype = rounded.", { form: formName, key, index, actual: shape.properties?.linetype ?? null, expected: "rounded" });
      }
      if (!Object.prototype.hasOwnProperty.call(shape.properties || {}, "documentation")) {
        issue(report, severity, "WORKFLOW_SEQUENCE_DOCUMENTATION_MISSING", "New workflow designer SequenceFlow must include properties.documentation as a concise business Description.", { form: formName, key, index });
      } else {
        const description = safeString(shape.properties && shape.properties.documentation).trim();
        if (!description) {
          issue(report, severity, "WORKFLOW_SEQUENCE_DESCRIPTION_MISSING", "SequenceFlow Description must be a short business label such as Approved, Rejected, Completed, or Amount >= 100.", { form: formName, key, index });
        } else if (isDefaultWorkflowConnectorDescription(description)) {
          issue(report, severity, "WORKFLOW_SEQUENCE_DESCRIPTION_DEFAULT", "SequenceFlow Description must not keep default Designer text such as Sequence flow.", { form: formName, key, index, description });
        } else if (description.length > 42) {
          issue(report, severity, "WORKFLOW_SEQUENCE_DESCRIPTION_TOO_LONG", "SequenceFlow Description should be concise so connector labels remain readable.", { form: formName, key, index, description, length: description.length, maximum: 42 });
        }
      }
      if (!Array.isArray(shape.dockers) || shape.dockers.length !== 0) {
        issue(report, severity, "WORKFLOW_SEQUENCE_DOCKERS_NOT_EMPTY", "New workflow designer rounded routing expects SequenceFlow.dockers to be an empty array by default.", { form: formName, key, index, actualLength: Array.isArray(shape.dockers) ? shape.dockers.length : null });
      }
      validateWorkflowOutcomeConditionShape(shape, report, { form: formName, key, index });
      validateSequenceFlowConditionVariables(shape, workflowVariables, report, { form: formName, key, index, path: `Data.Forms[].DefResource.childshapes[${index}].properties.conditioninfo` });
    } else if (["MultiAssignmentTask", "CandidateTask", "ContentList", "ExclusiveGateway", "InclusiveGateway", "QueryData"].includes(type)) {
      const actionName = safeString(shape.properties && (shape.properties.name || shape.properties.title || shape.properties.label)).trim();
      if (!actionName) {
        issue(report, severity, "WORKFLOW_ACTION_NAME_MISSING", "Workflow action nodes must have a concise business-specific Action name.", { form: formName, key, index, type });
      } else if (isDefaultWorkflowActionName(actionName)) {
        issue(report, severity, "WORKFLOW_ACTION_NAME_DEFAULT", "Workflow action nodes must not keep default Designer names such as Assignment Task.", { form: formName, key, index, type, actionName });
      } else if (actionName.length > 48) {
        issue(report, severity, "WORKFLOW_ACTION_NAME_TOO_LONG", "Workflow action names should be concise enough to render on the node card.", { form: formName, key, index, type, actionName, length: actionName.length, maximum: 48 });
      }
      if (type === "MultiAssignmentTask" || type === "CandidateTask") {
        validateTaskAssignmentVariables(shape, workflowVariables, report, { form: formName, key, index, path: `Data.Forms[].DefResource.childshapes[${index}].properties.usertaskassignment` });
      }
    } else if (type === "SetVariableTask") {
      validateSetVariableTaskTargets(shape, workflowVariables, report, { form: formName, key, index, path: `Data.Forms[].DefResource.childshapes[${index}].properties.variablesetting` });
    } else if (!isObject(shape.position)) {
      issue(report, severity, "WORKFLOW_NODE_POSITION_MISSING", "Workflow designer expects non-sequence workflow nodes to include position metadata.", { form: formName, key, index, type });
    }
  });
}

function validateWorkflowOutcomeConditionShape(shape, report, context) {
  const severity = generatorFinalSeverity(report);
  const conditions = asArray(shape && shape.properties && shape.properties.conditioninfo);
  const sourceId = safeString(shape && shape.source && (shape.source.id || shape.source.resourceid));
  function expectedTaskOutcome(text) {
    const value = safeString(text);
    if (/\bapproved\b/i.test(value) || /已同意/.test(value)) return "Approved";
    if (/\brejected\b/i.test(value) || /已拒绝/.test(value)) return "Rejected";
    if (/\bcompleted\b/i.test(value) || /已完成/.test(value)) return "Completed";
    return "";
  }
  conditions.forEach((condition, conditionIndex) => {
    const text = JSON.stringify(condition || {});
    const flowLabel = safeString(shape && shape.properties && (shape.properties.name || shape.properties.label || shape.properties.documentation));
    const labelLooksLikeOutcome = /\b(approved|rejected|completed|approve|reject|complete)\b/i.test(flowLabel) || /\b(approved|rejected|completed|approve|reject|complete)\b/i.test(text);
    if (!labelLooksLikeOutcome) return;
    if (!isObject(condition) || condition.left === undefined || condition.right === undefined || !condition.op) {
      issue(report, severity, "WORKFLOW_OUTCOME_CONDITION_SHAPE_INCOMPLETE", "Approval and complete task outcome transitions must include conditioninfo rows with left, op, and right; label-only condition metadata is not publish-ready.", {
        ...context,
        conditionIndex,
        flowLabel,
      });
      return;
    }
    const isTaskOutcome = text.includes("&quot;type&quot;:&quot;task&quot;") || text.includes(":Outcome") || text.includes(":结果");
    if (!isTaskOutcome) return;
    const expectedOutcome = expectedTaskOutcome(flowLabel) || expectedTaskOutcome(text);
    const leftText = typeof condition.left === "string" ? condition.left : JSON.stringify(condition.left || {});
    const rightText = typeof condition.right === "string" ? condition.right : JSON.stringify(condition.right || {});
    if (condition.op !== "s.=") {
      issue(report, severity, "WORKFLOW_OUTCOME_CONDITION_BAD_OP", "Approval task outcome condition should use op: s.=.", {
        ...context,
        conditionIndex,
        flowLabel,
      });
    }
    if (
      typeof condition.left !== "string" ||
      !leftText.includes("<input") ||
      !leftText.includes("&quot;type&quot;:&quot;task&quot;") ||
      !leftText.includes("&quot;prop&quot;:&quot;Outcome&quot;") ||
      (sourceId && !leftText.includes(sourceId))
    ) {
      issue(report, severity, "WORKFLOW_OUTCOME_CONDITION_LEFT_TASK_REF_INVALID", "Approval task outcome condition left operand must be an export-style task Outcome expression-button for the source Assignment task, not a generic Outcome variable token.", {
        ...context,
        conditionIndex,
        flowLabel,
        sourceId,
      });
    }
    if (
      typeof condition.right !== "string" ||
      !rightText.includes("<input") ||
      !rightText.includes("Task outcome:") ||
      (expectedOutcome && !rightText.includes(`Task outcome:${expectedOutcome}`))
    ) {
      issue(report, severity, "WORKFLOW_OUTCOME_CONDITION_RIGHT_RESULT_INVALID", "Approval task outcome condition right operand must be an export-style Task outcome expression-button matching the outgoing branch.", {
        ...context,
        conditionIndex,
        flowLabel,
        expectedOutcome,
      });
    }
  });
}

function collectWorkflowVariables(def) {
  const ids = new Set();
  const keys = new Set();
  const byId = new Map();
  function addVariable(variable) {
    if (!isObject(variable)) return;
    const id = safeString(variable.id);
    const idx = safeString(variable.idx);
    const name = safeString(variable.name);
    if (id) {
      ids.add(id);
      keys.add(id);
      byId.set(id, { id, idx, name, type: safeString(variable.type), valueType: safeString(variable.valueType) });
    }
    if (idx) keys.add(idx);
    if (name) keys.add(name);
  }
  for (const variable of asArray(def && def.variables && def.variables.basic)) {
    addVariable(variable);
  }
  for (const listref of asArray(def && def.variables && def.variables.listref)) {
    addVariable(listref);
    for (const field of asArray(listref && listref.fields)) {
      addVariable(field);
    }
  }
  return { ids, keys, byId };
}

function validateSequenceFlowConditionVariables(shape, workflowVariables, report, context) {
  const conditions = asArray(shape && shape.properties && shape.properties.conditioninfo);
  for (const finding of validateWorkflowConditionEditorRows({
    conditions,
    variablesById: workflowVariables.byId,
    path: context.path,
    node: safeString(shape && shape.properties && shape.properties.name) || shapeId(shape),
  })) {
    issue(report, generatorFinalSeverity(report), finding.code, finding.message, {
      ...context,
      path: finding.path,
      node: safeString(shape && shape.properties && shape.properties.name) || shapeId(shape),
      ...(finding.detail || {}),
    });
  }
  conditions.forEach((condition, conditionIndex) => {
    for (const side of ["left", "right"]) {
      const operand = condition && condition[side];
      const token = isObject(operand) && isObject(operand.value) ? operand.value : null;
      if (!token || token.exprType !== "variable") continue;
      const id = safeString(token.id);
      const name = safeString(token.name);
      const key = id || name;
      if (key && !workflowVariables.keys.has(key)) {
        issue(report, generatorFinalSeverity(report), "WORKFLOW_SEQUENCE_CONDITION_VARIABLE_UNRESOLVED", "SequenceFlow condition references a workflow variable that is not present in DefResource.variables.", {
          ...context,
          path: `${context.path}[${conditionIndex}].${side}.value`,
          node: safeString(shape && shape.properties && shape.properties.name) || shapeId(shape),
          variableId: id || null,
          variableName: name || null,
        });
      }
    }
  });
}

function validateSetVariableTaskTargets(shape, workflowVariables, report, context) {
  asArray(shape && shape.properties && shape.properties.variablesetting).forEach((setting, settingIndex) => {
    const id = safeString(setting && setting.id);
    const idx = safeString(setting && setting.idx);
    const declared = workflowVariables.byId.get(id);
    if (id && !workflowVariables.ids.has(id)) {
      issue(report, generatorFinalSeverity(report), "SETVARIABLE_UNKNOWN_VARIABLE", "SetVariableTask references a workflow variable that is not present in DefResource.variables.", {
        ...context,
        path: `${context.path}[${settingIndex}].id`,
        node: safeString(shape && shape.properties && shape.properties.name) || shapeId(shape),
        variableId: id,
      });
    } else if (declared && idx && declared.idx && idx !== declared.idx) {
      issue(report, generatorFinalSeverity(report), "SETVARIABLE_UNKNOWN_VARIABLE", "SetVariableTask target idx does not match the declared workflow variable idx.", {
        ...context,
        path: `${context.path}[${settingIndex}].idx`,
        node: safeString(shape && shape.properties && shape.properties.name) || shapeId(shape),
        variableId: id,
        variableIdx: idx,
        declaredIdx: declared.idx,
      });
    }
  });
}

function validateTaskAssignmentVariables(shape, workflowVariables, report, context) {
  asArray(shape && shape.properties && shape.properties.usertaskassignment).forEach((assignment, assignmentIndex) => {
    const expressionValidation = validateWorkflowAssigneeExpression(assignment);
    const variableIds = expressionValidation.variableIds.filter((id) => id && !["FlowNo"].includes(id));
    for (const id of variableIds) {
      if (workflowVariables.keys.has(id)) continue;
      issue(report, generatorFinalSeverity(report), "ASSIGNMENT_TASK_VARIABLE_UNRESOLVED", "Task assignment references a workflow variable that is not present in DefResource.variables.", {
        ...context,
        path: `${context.path}[${assignmentIndex}]`,
        node: safeString(shape && shape.properties && shape.properties.name) || shapeId(shape),
        variableId: id,
      });
    }
  });
}

function validateListWorkflowRegistration(form, listsById, fieldsByList, report) {
  const workflowType = safeString(form.WorkflowType);
  if (workflowType !== "1") return;
  const formName = safeString(form.Name);
  const key = safeString(form.Key);
  const listId = safeString(form.ListID);
  if (!listId) {
    issue(report, report.mode === "generator" ? "error" : "warning", "LIST_WORKFLOW_LISTID_MISSING", "Data-list workflow should include a ListID that links it to its host data list.", { form: formName, key });
    return;
  }
  const list = listsById.get(listId);
  if (!list) {
    issue(report, report.mode === "generator" ? "error" : "dependency", "LIST_WORKFLOW_LISTID_UNRESOLVED", "Data-list workflow ListID does not resolve to a package data list.", { form: formName, key, listId });
    return;
  }
  const mappings = asArray(list.item && list.item.FlowMappings);
  const mapping = mappings.find((entry) => safeString(entry.DefKey) === key);
  if (!mapping) {
    issue(report, report.mode === "generator" ? "error" : "warning", "LIST_WORKFLOW_FLOWMAPPING_MISSING", "Data-list workflow has no matching FlowMappings registration on the host list.", { form: formName, key, list: list.title, listId });
    return;
  }
  const mappingSetting = tryParseJson(mapping.Setting) || {};
  if (!isObject(mappingSetting)) {
    issue(report, "warning", "LIST_WORKFLOW_FLOWMAPPING_SETTING_INVALID", "Data-list workflow FlowMappings Setting should be parseable JSON.", { form: formName, key, list: list.title });
  }
  if (isObject(mappingSetting) && mappingSetting.NewTrigger !== true) {
    issue(report, report.mode === "generator" ? "error" : "warning", "LIST_WORKFLOW_NEW_TRIGGER_MISSING", "Generated data-list new-item workflows should register the trigger through FlowMappings.Setting.NewTrigger = true.", { form: formName, key, list: list.title });
  }
  if (form.Settings !== null && form.Settings !== undefined && safeString(form.Settings) !== "") {
    issue(report, generatorFinalSeverity(report), "LIST_WORKFLOW_FORM_SETTINGS_NOT_NULL", "Export-proven data-list new-item workflows keep Data.Forms[].Settings null; trigger configuration belongs in FlowMappings.Setting.", { form: formName, key, list: list.title });
  }
  const fieldName = safeString(mapping.FieldName);
  if (isObject(mappingSetting) && mappingSetting.NewTrigger === true && fieldName) {
    issue(report, generatorFinalSeverity(report), "LIST_WORKFLOW_NEW_TRIGGER_FIELDNAME_NOT_NULL", "Export-proven Add Item new-item triggers keep FlowMappings.FieldName null; non-null FieldName can render an empty trigger condition and break designer open.", { form: formName, key, list: list.title, fieldName });
  }
  if (fieldName) {
    const fields = fieldsByList.get(listId) || new Map();
    const field = fields.get(fieldName);
    if (!field) {
      issue(report, report.mode === "generator" ? "error" : "warning", "LIST_WORKFLOW_FLOWSTATUS_FIELD_UNRESOLVED", "FlowMappings FieldName does not resolve on the host data list.", { form: formName, key, list: list.title, fieldName });
    } else if (normalizeType(field) !== "flowstatus") {
      issue(report, "warning", "LIST_WORKFLOW_FLOWSTATUS_FIELD_TYPE_UNEXPECTED", "The mapped FlowMappings field is present but is not export-proven as a flowstatus field.", {
        form: formName,
        key,
        list: list.title,
        fieldName,
        fieldType: normalizeType(field),
      });
    }
  }
}

function validateScheduledWorkflow(form, def, report) {
  const severity = report.mode === "generator" && report.stage === "final" ? "error" : "warning";
  const formName = safeString(form.Name);
  const settings = isObject(form.Settings) ? form.Settings : tryParseJson(form.Settings) || {};
  const workflowType = safeString(form.WorkflowType || def && def.workflowType);
  if (workflowType !== "3") {
    issue(report, severity, "SCHEDULED_WORKFLOW_TYPE_MISMATCH", "Scheduled Workflow resources should use WorkflowType = 3.", { form: formName, key: form.Key, workflowType });
  }
  for (const key of ["TimeZone", "Times", "StartDate", "Frequency", "Interval"]) {
    if (settings[key] === undefined || settings[key] === null || settings[key] === "") {
      issue(report, severity, "SCHEDULED_WORKFLOW_SETTING_MISSING", "Scheduled Workflow Settings is missing a schedule field observed in the export.", { form: formName, key: form.Key, setting: key });
    }
  }
  if (settings.Times !== undefined && !Array.isArray(settings.Times)) {
    issue(report, severity, "SCHEDULED_WORKFLOW_TIMES_INVALID", "Scheduled Workflow Settings.Times should be an array of time strings.", { form: formName, key: form.Key });
  }
  const frequency = safeString(settings.Frequency);
  if (frequency && !["0", "1", "2"].includes(frequency)) {
    issue(report, "warning", "SCHEDULED_WORKFLOW_FREQUENCY_UNSTUDIED", "Scheduled Workflow Frequency value is not proven by the current export. Observed values are 0 for daily and 1 for weekly.", { form: formName, key: form.Key, frequency });
  }
  if (settings.Interval !== undefined && (Number.isNaN(Number(settings.Interval)) || Number(settings.Interval) < 1)) {
    issue(report, severity, "SCHEDULED_WORKFLOW_INTERVAL_INVALID", "Scheduled Workflow Interval should be a positive number.", { form: formName, key: form.Key, interval: settings.Interval });
  }
  if (frequency === "1" && !Array.isArray(settings.Values)) {
    issue(report, severity, "SCHEDULED_WORKFLOW_WEEKLY_DAYS_MISSING", "Weekly Scheduled Workflow Settings.Values should contain selected weekday numbers.", { form: formName, key: form.Key });
  }
  if (Object.prototype.hasOwnProperty.call(settings, "IsWorkday") && typeof settings.IsWorkday !== "boolean") {
    issue(report, severity, "SCHEDULED_WORKFLOW_ISWORKDAY_INVALID", "Scheduled Workflow IsWorkday should be boolean when present.", { form: formName, key: form.Key, isWorkday: settings.IsWorkday });
  }
  if (safeString(form.ListID) !== "0") {
    issue(report, severity, "SCHEDULED_WORKFLOW_LISTID_NOT_ZERO", "App-level Scheduled Workflow registration should keep Data.Forms[].ListID as 0.", { form: formName, key: form.Key, listId: safeString(form.ListID) });
  }
  if (safeString(form.Deployed) && form.Deployed !== true) {
    issue(report, "warning", "SCHEDULED_WORKFLOW_DEPLOYED_UNUSUAL", "Studied Scheduled Workflow resources export with Deployed true; confirm runtime behavior if generated packages differ.", { form: formName, key: form.Key, deployed: form.Deployed });
  }
}

function validateFormLookupControls(def, form, listsById, fieldsByList, report) {
  const severity = report.mode === "generator" && report.stage === "final" ? "error" : "warning";
  for (const page of asArray(def && def.pageurls)) {
    const formdef = typeof page.formdef === "string" ? tryParseJson(page.formdef) : page.formdef;
    asArray(formdef && formdef.children).forEach((child, childIndex) => {
      walkControls(child, (control, pointer) => {
        if (control.type !== "lookup") return;
        const attrs = control.attrs || {};
        const listId = safeString(attrs.listid || attrs.ListID || attrs.data && attrs.data.list && attrs.data.list.ListID);
        const displayField = safeString(attrs.listfield || attrs.displayfield || attrs.DisplayField || attrs.data && attrs.data.listfield);
        const location = `Data.Forms[${safeString(form.Key || form.Name)}].pageurls[${safeString(page.id || page.title)}].formdef.children[${childIndex}]${pointer.slice(1)}`;
        if (!listId) {
          issue(report, severity, "FORM_LOOKUP_TARGET_LISTID_MISSING", "Approval-form lookup control should declare target list metadata.", { form: form.Name, page: page.title || page.id, location, label: control.label || control.nv_label || null });
          return;
        }
        const target = listsById.get(listId);
        if (!target) {
          issue(report, severity, "FORM_LOOKUP_TARGET_UNRESOLVED", "Approval-form lookup control references a master/reference list not included in the package.", { form: form.Name, page: page.title || page.id, location, listId, label: control.label || control.nv_label || null });
          return;
        }
        const sampleCount = target.item && target.item.ListDatas && isObject(target.item.ListDatas) ? Object.keys(target.item.ListDatas).length : 0;
        if (!sampleCount) {
          issue(report, "warning", "FORM_LOOKUP_TARGET_LIST_EMPTY", "Approval-form lookup target list is included but has no sample/reference rows; runtime lookup selection may be empty until data is maintained.", { form: form.Name, page: page.title || page.id, location, list: target.title, listId });
        }
        const targetFields = fieldsByList.get(listId) || new Map();
        if (displayField && !targetFields.has(displayField)) {
          issue(report, severity, "FORM_LOOKUP_DISPLAY_FIELD_NOT_FOUND", "Approval-form lookup display field does not resolve on the target list.", { form: form.Name, page: page.title || page.id, location, list: target.title, listId, displayField });
        }
      });
    });
  }
}

function validateApprovalDef(def, form, report, listsById = new Map(), fieldsByList = new Map()) {
  const pages = asArray(def.pageurls);
  const severity = generatorFinalSeverity(report);
  if (!pages.length) issue(report, "error", "APPROVAL_PAGEURLS_MISSING", "Approval form must include pageurls.", { form: form.Name, key: form.Key });
  validateApprovalPublishFlags(def, form, report);
  const pageById = new Map();
  const taskPageIds = new Set();
  const requestPageIds = new Set();
  pages.forEach((page, index) => {
    const id = pageUrlId(page);
    if (!id) issue(report, "error", "PAGEURL_ID_MISSING", "pageurls entry missing id.", { form: form.Name, index });
    if (id) {
      pageById.set(id, page);
      if (Number(page.type) === 1) requestPageIds.add(id);
      if (Number(page.type) === 2) taskPageIds.add(id);
    }
    const pageType = Number(page.type);
    const pageName = page.title || page.name || page.id || index;
    if (!safeString(page.key)) {
      issue(report, severity, "PAGEURL_KEY_MISSING", "Approval request/task pageurls entries must include a non-empty key for runtime pageUrl registration.", { form: form.Name, page: pageName, pageType, index });
    }
    const aliases = collectPageUrlAliases(page);
    const presentAliases = aliases.filter((entry) => entry.value);
    if (!presentAliases.length) {
      issue(report, severity, "PAGEURL_REGISTRATION_MISSING", "Approval request/task pageurls entries must populate pageUrl/pageurl/PageUrl registration aliases.", { form: form.Name, page: pageName, pageType, index });
    } else {
      const canonicalPageUrl = presentAliases[0].value;
      const mismatched = aliases.filter((entry) => entry.value !== canonicalPageUrl);
      if (mismatched.length || presentAliases.length !== aliases.length) {
        issue(report, severity, "PAGEURL_ALIASES_NOT_MIRRORED", "Approval pageUrl registration should be mirrored across pageUrl, pageurl, and PageUrl.", { form: form.Name, page: pageName, pageType, pageUrl: page.pageUrl || null, pageurl: page.pageurl || null, PageUrl: page.PageUrl || null });
      }
    }
    if (!page.formdef) issue(report, "error", "PAGEURL_FORMDEF_MISSING", "pageurls entry missing formdef.", { form: form.Name, page: page.title || page.name || page.id });
    const formdef = typeof page.formdef === "string" ? tryParseJson(page.formdef) : page.formdef;
    if (pageType === 1) {
      if (Number(page.pagetype) !== 1) issue(report, severity, "WORKFLOW_REQUEST_PAGEURL_PAGETYPE_INVALID", "Request pageurls[] entries must use pagetype=1.", { form: form.Name, page: pageName, pagetype: page.pagetype });
      if (formdef && Number(formdef.pagetype) !== 1) issue(report, severity, "WORKFLOW_REQUEST_FORMDEF_PAGETYPE_INVALID", "Request page embedded formdef.pagetype must use 1.", { form: form.Name, page: pageName, formdefPagetype: formdef.pagetype });
    }
    if (pageType === 2) {
      if (Number(page.pagetype) !== 1) issue(report, severity, "WORKFLOW_TASK_PAGEURL_PAGETYPE_INVALID", "Task pageurls[] entries must use pagetype=1; only embedded formdef.pagetype should be 2.", { form: form.Name, page: pageName, pagetype: page.pagetype });
      if (formdef && Number(formdef.pagetype) !== 2) issue(report, severity, "WORKFLOW_TASK_FORMDEF_PAGETYPE_INVALID", "Task page embedded formdef.pagetype must use 2.", { form: form.Name, page: pageName, formdefPagetype: formdef.pagetype });
    }
    if (formdef && !Array.isArray(formdef.children)) issue(report, "error", "PAGEURL_FORMDEF_CHILDREN_NOT_ARRAY", "formdef.children must be an array.", { form: form.Name, page: page.title || page.id });
    if (isObject(formdef)) {
      validateUiStandardFormRoot(formdef, report, { surface: "approval form page", title: page.title || page.name || page.id, form: form.Name });
      validateUiStandardContainers(formdef, report, { surface: "approval form page", title: page.title || page.name || page.id, form: form.Name, requireFormBody: true });
      validateApprovalFormLayoutQuality(formdef, page, form, report, index);
      validateApprovalSubListControls(def, formdef, page, form, report, index);
      asArray(formdef.children).forEach((child, childIndex) => {
        walkControls(child, (control, pointer) => {
          validateEmbeddedControlSchema(control, report, {
            title: page.title || page.name || page.id,
            path: `Data.Forms[${form.Name || form.Key}].pageurls[${index}].formdef.children[${childIndex}]${pointer.slice(1)}`,
            surface: "approval form page",
          });
          if (safeString(control.type) === "document-library") {
            validateDashboardDocLibraryControl(control, page.title || page.name || page.id, page.id || index, `Data.Forms[${form.Name || form.Key}].pageurls[${index}].formdef.children[${childIndex}]${pointer.slice(1)}`, listsById, fieldsByList, report);
          }
        });
      });
    }
  });
  if (!requestPageIds.size) {
    issue(report, severity, "APPROVAL_REQUEST_PAGE_MISSING", "Generated approval forms must include a request page with pageurls[].type = 1.", { form: form.Name, key: form.Key });
  }
  if (!taskPageIds.size) {
    issue(report, severity, "APPROVAL_TASK_PAGE_MISSING", "Generated approval forms must include a task page with pageurls[].type = 2.", { form: form.Name, key: form.Key });
  }
  validateApprovalTaskPageReferences(def, form, report, pageById, taskPageIds, requestPageIds);
}

function validateApprovalSubListControls(def, formdef, page, form, report, pageIndex) {
  const severity = generatorFinalSeverity(report, "warning");
  const formName = safeString(form.Name || form.Key);
  const pageName = safeString(page.title || page.name || page.id || pageIndex);
  const basicVars = new Map(asArray(def.variables && def.variables.basic).map((variable) => [safeString(variable && variable.id), variable]));
  const listrefs = new Map(asArray(def.variables && def.variables.listref).map((listref) => [safeString(listref && listref.id), listref]));

  asArray(formdef.children).forEach((child, childIndex) => {
    walkControls(child, (control, pointer) => {
      if (control.type !== "list" || !control.attrs) return;
      const path = `Data.Forms[${formName}].pageurls[${pageIndex}].formdef.children[${childIndex}]${pointer.slice(1)}`;
      const binding = safeString(control.binding);
      const listVar = basicVars.get(binding);
      const listref = listVar ? listrefs.get(safeString(listVar.value)) : null;
      if (!binding || !listVar || listVar.type !== "list" || !listref) {
        issue(report, severity, "SUBLIST_ASSOCIATED_VARIABLE_UNRESOLVED", "Sub List control must bind to a variables.basic list variable whose value resolves to variables.listref.", { form: formName, page: pageName, path, binding });
        return;
      }

      const fields = new Set(asArray(listref.fields).map((field) => safeString(field && field.id)).filter(Boolean));
      const listFields = asArray(control.attrs["list-fields"]);
      const listVariables = asArray(control.attrs["list-variables"]);
      if (!listFields.length) issue(report, severity, "SUBLIST_FIELDS_MISSING", "Sub List should include attrs[\"list-fields\"] entries for the displayed row fields.", { form: formName, page: pageName, path });
      if (!listVariables.length) issue(report, severity, "SUBLIST_VARIABLES_MISSING", "Sub List should include attrs[\"list-variables\"] entries for the row schema.", { form: formName, page: pageName, path });

      for (const field of listFields) {
        const fieldId = safeString(field && field.id);
        if (fieldId && !fields.has(fieldId)) issue(report, severity, "SUBLIST_FIELD_UNRESOLVED", "Sub List displayed field does not resolve to the associated listref field set.", { form: formName, page: pageName, path, fieldId });
      }

      validateApprovalSubListSummaries(control, fields, formName, pageName, path, report);
      validateApprovalSubListDynamicTemplate(control, fields, binding, formName, pageName, path, report, severity);
      validateApprovalSubListActions(control, formName, pageName, path, report, severity);
    });
  });
}

function validateApprovalSubListSummaries(control, fields, formName, pageName, path, report) {
  asArray(control.attrs && control.attrs["list-fields-summary"]).forEach((summary, index) => {
    const fieldId = safeString(summary && summary.field);
    if (!fieldId || !fields.has(fieldId)) {
      issue(report, generatorFinalSeverity(report, "warning"), "SUBLIST_SUMMARY_FIELD_UNRESOLVED", "Sub List summary field must resolve to a row field in the associated listref.", { form: formName, page: pageName, path: `${path}.attrs.list-fields-summary[${index}]`, fieldId });
    }
  });
}

function validateApprovalSubListDynamicTemplate(control, fields, binding, formName, pageName, path, report, severity) {
  const layout = safeString(control.attrs && control.attrs["list-display-preference"]);
  if (layout && !["default", "responsive", "table", "table-view", "card", "card-view", "dynamic"].includes(layout)) {
    issue(report, "warning", "SUBLIST_LAYOUT_MODE_UNSTUDIED", "Sub List layout mode is not covered by current export-backed validation.", { form: formName, page: pageName, path: `${path}.attrs.list-display-preference`, layout });
  }
  if (layout !== "dynamic") return;

  const body = asArray(control.children).find((child) => child && child.type === "list-body");
  if (!body) {
    issue(report, severity, "SUBLIST_DYNAMIC_BODY_MISSING", "Dynamic content Sub List must include a list-body template container.", { form: formName, page: pageName, path: `${path}.children` });
    return;
  }
  let childControlCount = 0;
  const bodyGrids = [];
  walkControls(body, (node, pointer) => {
    if (node !== body && node.type) childControlCount += 1;
    if (node.type === "flex_grid" || node.type === "grid") bodyGrids.push({ node, pointer });
    if (!node.attrs || node.attrs.list_field !== true) return;
    const nodePath = `${path}.children[list-body]${pointer.slice(1)}`;
    if (safeString(node.attrs.list_field_binding) !== binding) {
      issue(report, severity, "SUBLIST_DYNAMIC_FIELD_BINDING_MISMATCH", "Dynamic Sub List field controls must keep attrs.list_field_binding equal to the parent Sub List binding.", { form: formName, page: pageName, path: `${nodePath}.attrs.list_field_binding`, expected: binding, actual: safeString(node.attrs.list_field_binding) });
    }
    const fieldBinding = safeString(node.binding);
    if (fieldBinding && !fields.has(fieldBinding)) {
      issue(report, severity, "SUBLIST_DYNAMIC_FIELD_UNRESOLVED", "Dynamic Sub List item template field binding does not resolve to the associated listref fields.", { form: formName, page: pageName, path: `${nodePath}.binding`, fieldBinding });
    }
  });
  if (!childControlCount) issue(report, severity, "SUBLIST_DYNAMIC_TEMPLATE_EMPTY", "Dynamic content Sub List should include child controls inside list-body.", { form: formName, page: pageName, path: `${path}.children` });
  if (!displayLabelDisabled(control.displayLabel) && !displayLabelDisabled(control.attrs && control.attrs.displayLabel)) {
    issue(report, "warning", "SUBLIST_DYNAMIC_CAPTION_VISIBLE", "Generated table-style Dynamic Sub Lists should turn off Display caption with displayLabel = [null,false].", { form: formName, page: pageName, path: `${path}.displayLabel` });
  }
  if (asArray(control.attrs && control.attrs["list-fields"]).length >= 3 && !bodyGrids.length) {
    issue(report, "warning", "SUBLIST_DYNAMIC_TABLE_BODY_GRID_MISSING", "Generated table-style Dynamic Sub Lists should use a grid/flex_grid as the first list-body layout control so header and row columns align.", { form: formName, page: pageName, path: `${path}.children[list-body]` });
  }
  for (const { node, pointer } of bodyGrids) {
    if (!displayLabelDisabled(node.displayLabel) && !displayLabelDisabled(node.attrs && node.attrs.displayLabel)) {
      issue(report, "warning", "SUBLIST_DYNAMIC_BODY_GRID_CAPTION_VISIBLE", "Grid/flex_grid controls inside Dynamic Sub List bodies should turn off Display caption unless a visible grid title is intentional.", { form: formName, page: pageName, path: `${path}.children[list-body]${pointer.slice(1)}.displayLabel` });
    }
    const columns = node.attrs && node.attrs.columns;
    const columnCount = isObject(columns)
      ? Math.max(0, ...Object.keys(columns).map((key) => Number(key)).filter(Number.isFinite))
      : asArray(columns).length;
    if (columnCount && asArray(node.children).length && asArray(node.children).length < columnCount) {
      issue(report, "warning", "SUBLIST_DYNAMIC_BODY_GRID_COLUMN_CHILDREN_MISMATCH", "Dynamic Sub List body grid has fewer child controls than configured column tracks; Designer/render alignment may be fragile.", { form: formName, page: pageName, path: `${path}.children[list-body]${pointer.slice(1)}.children` });
    }
  }

  const css = safeString(control.attrs && control.attrs.common && control.attrs.common.css);
  if (css.includes(".dynamic-list .list-footer") && !css.includes("position: absolute")) {
    issue(report, "warning", "SUBLIST_DYNAMIC_FOOTER_CSS_UNEXPECTED", "A .dynamic-list .list-footer custom CSS rule is present but differs from the export-proven fixed-footer pattern; preserve intentionally but verify layout.", { form: formName, page: pageName, path: `${path}.attrs.common.css` });
  }
}

function validateApprovalSubListActions(control, formName, pageName, path, report, severity) {
  const actions = control.attrs && control.attrs.actions;
  if (actions === undefined) return;
  if (!Array.isArray(actions)) {
    issue(report, severity, "SUBLIST_ACTIONS_NOT_ARRAY", "Sub List attrs.actions must be an array when list actions are configured.", { form: formName, page: pageName, path: `${path}.attrs.actions` });
    return;
  }
  const allowedStepTypes = new Set(["list_new", "list_import", "list_dup", "list_del", "list_move", "list_update"]);
  const actionIds = new Set(actions.map((action) => safeString(action && action.id)).filter(Boolean));
  const actionById = new Map(actions.map((action) => [safeString(action && action.id), action]).filter(([id]) => Boolean(id)));
  actions.forEach((action, actionIndex) => {
    const actionPath = `${path}.attrs.actions[${actionIndex}]`;
    if (!isObject(action)) {
      issue(report, severity, "SUBLIST_ACTION_BAD_SHAPE", "Sub List action entries must be objects.", { form: formName, page: pageName, path: actionPath });
      return;
    }
    if (safeString(action.type) !== "list") issue(report, "warning", "SUBLIST_ACTION_TYPE_UNEXPECTED", "Export-proven Sub List actions use type = \"list\".", { form: formName, page: pageName, path: `${actionPath}.type`, type: safeString(action.type) });
    if (!safeString(action.id)) issue(report, "warning", "SUBLIST_ACTION_ID_MISSING", "Sub List action should include an id so action_button.attrs.control_action can resolve.", { form: formName, page: pageName, path: `${actionPath}.id` });
    if (!safeString(action.name)) issue(report, "warning", "SUBLIST_ACTION_NAME_MISSING", "Sub List action should include a readable name.", { form: formName, page: pageName, path: `${actionPath}.name` });
    const steps = asArray(action.steps);
    if (!steps.length) {
      issue(report, severity, "SUBLIST_ACTION_STEPS_EMPTY", "Sub List action must include at least one step definition.", { form: formName, page: pageName, path: `${actionPath}.steps` });
      return;
    }
    steps.forEach((step, stepIndex) => {
      const stepPath = `${actionPath}.steps[${stepIndex}]`;
      if (!isObject(step)) {
        issue(report, severity, "SUBLIST_ACTION_STEP_BAD_SHAPE", "Sub List action steps must be objects.", { form: formName, page: pageName, path: stepPath });
        return;
      }
      const stepType = safeString(step.type);
      if (!stepType) issue(report, severity, "SUBLIST_ACTION_STEP_TYPE_MISSING", "Sub List action steps must include type.", { form: formName, page: pageName, path: `${stepPath}.type` });
      else if (!allowedStepTypes.has(stepType)) issue(report, "warning", "SUBLIST_ACTION_STEP_TYPE_UNSTUDIED", "Sub List action step type is not export-proven by the current study.", { form: formName, page: pageName, path: `${stepPath}.type`, stepType });
      if (stepType === "list_new" && step.attrs && step.attrs.position !== undefined && !["0", "1"].includes(String(step.attrs.position))) {
        issue(report, "warning", "SUBLIST_ACTION_INSERT_POSITION_UNEXPECTED", "Insert-before/after Sub List actions use list_new with attrs.position \"0\" or \"1\" in the studied export.", { form: formName, page: pageName, path: `${stepPath}.attrs.position`, position: step.attrs.position });
      }
      if (stepType === "list_move" && step.attrs && step.attrs.moveMode !== undefined && String(step.attrs.moveMode) !== "2") {
        issue(report, "warning", "SUBLIST_ACTION_MOVE_MODE_UNEXPECTED", "Move-down Sub List actions use list_move with attrs.moveMode \"2\" in the studied export; move-up uses list_move without attrs.", { form: formName, page: pageName, path: `${stepPath}.attrs.moveMode`, moveMode: step.attrs.moveMode });
      }
    });
  });

  walkControls(control, (node, pointer) => {
    const ref = safeString(node.attrs && node.attrs.control_action);
    if (ref && !actionIds.has(ref)) {
      issue(report, severity, "SUBLIST_ACTION_BUTTON_TARGET_UNRESOLVED", "Action buttons inside a Sub List item/footer template should resolve to attrs.actions[].id on the same Sub List.", { form: formName, page: pageName, path: `${path}${pointer.slice(1)}.attrs.control_action` });
    }
  });

  const dropbars = [];
  walkControls(control, (node, pointer) => {
    if (node.type === "dropbar") dropbars.push({ node, pointer });
  });
  dropbars.forEach(({ node: dropbar, pointer: dropbarPointer }) => {
    const menuLabels = [];
    const menuStepTypes = [];
    walkControls(dropbar, (node, pointer) => {
      if (node.type !== "action_button") return;
      const label = safeString(node.label || node.nv_label);
      const action = actionById.get(safeString(node.attrs && node.attrs.control_action));
      const stepTypes = asArray(action && action.steps).map((step) => safeString(step && step.type)).filter(Boolean);
      menuLabels.push(label);
      menuStepTypes.push(...stepTypes);
      if (!action) {
        issue(report, severity, "SUBLIST_ROW_MENU_ACTION_TARGET_UNRESOLVED", "Row operation menu action buttons should bind to local Sub List attrs.actions[] entries.", { form: formName, page: pageName, path: `${path}${dropbarPointer.slice(1)}${pointer.slice(1)}.attrs.control_action`, label });
      }
    });
    const duplicated = menuLabels.filter((label, index) => label && menuLabels.indexOf(label) !== index);
    if (duplicated.length) {
      issue(report, "warning", "SUBLIST_ROW_MENU_DUPLICATE_LABELS", "Row operation menu contains duplicate labels; verify the intended menu action list.", { form: formName, page: pageName, path: `${path}${dropbarPointer.slice(1)}`, labels: [...new Set(duplicated)] });
    }
    if (menuLabels.includes("Delete")) {
      const visibleDeleteOutsideMenu = [];
      walkControls(control, (node, pointer) => {
        if (pointer.startsWith(dropbarPointer)) return;
        if (node.type === "action_button" && safeString(node.label || node.nv_label) === "Delete") visibleDeleteOutsideMenu.push(pointer);
        if (node.attrs && actionById.get(safeString(node.attrs.control_action))?.name === "Delete item" && !pointer.startsWith(dropbarPointer)) visibleDeleteOutsideMenu.push(pointer);
      });
      if (visibleDeleteOutsideMenu.length) {
        issue(report, "warning", "SUBLIST_ROW_MENU_DELETE_DUPLICATES_VISIBLE_DELETE", "Delete is available both in the row operation menu and as a visible row action; the generated table pattern usually keeps Delete visible and omits it from the menu.", { form: formName, page: pageName, path: `${path}${dropbarPointer.slice(1)}` });
      }
    }
    if (menuLabels.some((label) => /^Insert |^Move /i.test(label)) && !menuStepTypes.some((type) => type === "list_new" || type === "list_move")) {
      issue(report, "warning", "SUBLIST_ROW_MENU_ORDER_ACTION_STEPS_MISSING", "Insert/move row operation menu labels should resolve to list_new position or list_move action steps.", { form: formName, page: pageName, path: `${path}${dropbarPointer.slice(1)}`, labels: menuLabels });
    }
  });
}

function validateApprovalPublishFlags(def, form, report) {
  const severity = generatorFinalSeverity(report);
  const context = { form: form.Name, key: form.Key };
  if (form.Deployed !== true) {
    issue(report, severity, "APPROVAL_FORM_DEPLOYED_NOT_TRUE", "Generated approval forms should be published by default: Data.Forms[].Deployed must be true unless draft mode was explicitly requested.", { ...context, path: "Data.Forms[].Deployed", value: form.Deployed });
  }
  if (form.Status !== 1) {
    issue(report, severity, "APPROVAL_FORM_STATUS_NOT_PUBLISHED", "Generated approval forms should be published by default: Data.Forms[].Status must be 1 unless draft mode was explicitly requested.", { ...context, path: "Data.Forms[].Status", value: form.Status });
  }
  for (const [key, expected] of [["deployed", true], ["status", 1], ["published", true]]) {
    if (!Object.prototype.hasOwnProperty.call(def || {}, key)) continue;
    if (def[key] !== expected) {
      issue(report, severity, "APPROVAL_DEFRESOURCE_PUBLISH_FLAG_INVALID", "Generated approval form DefResource publish/deploy flags must be set consistently when present.", { ...context, path: `Data.Forms[].DefResource.${key}`, expected, value: def[key] });
    }
  }
}

function validateApprovalTaskPageReferences(def, form, report, pageById, taskPageIds, requestPageIds) {
  const severity = generatorFinalSeverity(report);
  let taskNodeCount = 0;
  collectShapes(def).forEach((shape, index) => {
    const type = shapeType(shape);
    const props = shape.properties || {};
    if (type === "StartNoneEvent") {
      const taskurl = primaryTaskUrl(props);
      if (!taskurl) {
        issue(report, severity, "START_TASKURL_MISSING_OR_NULL", "StartNoneEvent must reference the request page through taskurl/taskUrl/TaskUrl so the process request pageUrl can resolve.", { form: form.Name, node: props.name || shapeId(shape), path: `Data.Forms[].DefResource.childshapes[${index}].properties.taskurl` });
      } else if (!requestPageIds.has(taskurl)) {
        issue(report, severity, "START_TASKURL_PAGE_NOT_FOUND", "StartNoneEvent task page reference must resolve to a request/submission page.", { form: form.Name, node: props.name || shapeId(shape), taskurl });
      }
      const aliases = collectTaskUrlAliases(props);
      const mismatched = aliases.filter((entry) => entry.value !== taskurl);
      if (taskurl && (mismatched.length || aliases.some((entry) => !entry.value))) {
        issue(report, severity, "START_TASKURL_ALIASES_NOT_MIRRORED", "StartNoneEvent request page references must be mirrored across taskurl, taskUrl, and TaskUrl.", { form: form.Name, node: props.name || shapeId(shape), taskurl: props.taskurl || null, taskUrl: props.taskUrl || null, TaskUrl: props.TaskUrl || null });
      }
      return;
    }
    if (!isWorkflowTaskNodeType(type)) return;
    taskNodeCount += 1;
    const nodeLabel = taskNodeLabel(type);
    const node = props.name || shapeId(shape);
    const aliases = collectTaskUrlAliases(props);
    const presentAliases = aliases.filter((entry) => entry.value);
    const taskurl = presentAliases.length ? presentAliases[0].value : "";
    if (!taskurl) {
      issue(report, severity, "TASKURL_MISSING_OR_NULL", `${nodeLabel} nodes must reference a task form/page; missing or null TaskUrl is a publish blocker for generated approval workflows.`, { form: form.Name, node, path: `Data.Forms[].DefResource.childshapes[${index}].properties.taskurl` });
      return;
    }
    const mismatched = aliases.filter((entry) => entry.value !== taskurl);
    if (mismatched.length || presentAliases.length !== aliases.length) {
      issue(report, severity, "TASKURL_ALIASES_NOT_MIRRORED", `${nodeLabel} task form references must be mirrored across taskurl, taskUrl, and TaskUrl for publish readiness.`, {
        form: form.Name,
        node,
        taskurl: props.taskurl || null,
        taskUrl: props.taskUrl || null,
        TaskUrl: props.TaskUrl || null,
      });
    }
    const page = pageById.get(taskurl);
    if (!page) {
      issue(report, severity, "WORKFLOW_TASKURL_PAGE_NOT_FOUND", `${nodeLabel} task form reference does not resolve to a pageurls id.`, { form: form.Name, node, taskurl });
      return;
    }
    if (!taskPageIds.has(taskurl)) {
      issue(report, severity, "WORKFLOW_TASKURL_PAGE_TYPE_INVALID", `${nodeLabel} task form reference must resolve to a task page with pageurls[].type = 2.`, { form: form.Name, node, taskurl, pageType: page.type });
    }
    if (page.type === 2 && page.pagetype !== 1) {
      issue(report, severity, "WORKFLOW_TASK_PAGEURL_PAGETYPE_INVALID", "Assignment task pageurls[] entries must use pagetype=1; only embedded formdef.pagetype should be 2.", { form: form.Name, node, taskurl, pagetype: page.pagetype });
    }
    if (page.type === 2 && page.formdef && page.formdef.pagetype !== 2) {
      issue(report, severity, "WORKFLOW_TASK_FORMDEF_PAGETYPE_INVALID", "Assignment task embedded formdef.pagetype must use 2.", { form: form.Name, node, taskurl, formdefPagetype: page.formdef.pagetype });
    }
    if (props.pagetype !== 1) {
      issue(report, severity, "TASK_NODE_PAGETYPE_INVALID", `${nodeLabel} workflow nodes should carry properties.pagetype = 1 for task-form publish readiness.`, { form: form.Name, node, pagetype: props.pagetype });
    }
    const approveway = safeString(props.approveway);
    if (!APPROVAL_APPROVEWAYS.has(approveway)) {
      issue(report, severity, "TASK_APPROVEWAY_INVALID", `${nodeLabel} nodes must include an export-shaped valid approveway value.`, { form: form.Name, node, approveway: approveway || null });
    }
    validateWorkflowTaskAssignees(shape, form, report, index, nodeLabel);
  });
  if (!taskNodeCount) {
    issue(report, severity, "APPROVAL_ASSIGNMENT_TASK_MISSING", "Generated approval workflows must include a real task node such as MultiAssignmentTask; StartNoneEvent -> EndNoneEvent alone is not a valid approval workflow.", { form: form.Name, key: form.Key });
  }
}

function validateApprovalFormLayoutQuality(formdef, page, form, report, pageIndex) {
  const severity = generatorFinalSeverity(report);
  const pageId = pageUrlId(page) || pageIndex;
  const pageName = page.title || page.name || pageId;
  const isSubmitPage = page.type === 1;
  walkControls({ children: asArray(formdef.children) }, (control, pointer) => {
    if (!control || control === formdef) return;
    const type = safeString(control.type).toLowerCase();
    const label = safeString(control.nv_label || control.label || control.title || control.binding || control.id);
    const hasChildren = asArray(control.children).length > 0 || asArray(control.columns).length > 0;
    const explicitlyTitled = control.attrs && (control.attrs.layoutRole === "titled-grid" || control.attrs.visibleGridCaption === true);
    if (["grid", "flex_grid"].includes(type) && hasChildren && !explicitlyTitled && !displayLabelDisabled(control.displayLabel) && !displayLabelDisabled(control.attrs && control.attrs.displayLabel)) {
      issue(report, severity, "LAYOUT_GRID_CAPTION_VISIBLE", "Grid/flex_grid controls used as layout containers should turn off Display caption with displayLabel [null,false] unless explicitly configured as a titled grid.", { form: form.Name, page: pageName, pageId, path: `Data.Forms[].DefResource.pageurls[${pageIndex}].formdef${pointer.slice(1)}`, control: label, controlType: control.type });
    }
    if (["grid", "flex_grid"].includes(type) && /(route|routing|status|summary|kpi|metric)/i.test(label) && (displayLabelEnabled(control.displayLabel) || !displayLabelDisabled(control.displayLabel))) {
      issue(report, "warning", "ROUTE_SUMMARY_GRID_LAYOUT", "Route summaries, KPI blocks, and horizontal information blocks should use container/card blocks with spacing instead of captioned Grid/flex_grid controls.", { form: form.Name, page: pageName, pageId, path: `Data.Forms[].DefResource.pageurls[${pageIndex}].formdef${pointer.slice(1)}`, control: label, controlType: control.type });
    }
    if (isSubmitPage && /(internal routing|approval routing|routing details|budget owner|finance approver|decision notes|reviewer decision|approver notes)/i.test(label)) {
      issue(report, severity, "SUBMIT_FORM_INTERNAL_ROUTING_DETAILS", "Submission forms should focus on submitter inputs and business context; internal routing, approver, and reviewer decision details belong on task pages unless explicitly requested.", { form: form.Name, page: pageName, pageId, path: `Data.Forms[].DefResource.pageurls[${pageIndex}].formdef${pointer.slice(1)}`, control: label, controlType: control.type });
    }
    if (type === "pivot-table") {
      issue(report, severity, "PIVOT_TABLE_APPROVAL_FORM_UNSUPPORTED", "Pivot Table is a Data Analytics control and should not be generated on approval forms or approval task pages.", { form: form.Name, page: pageName, pageId, path: `Data.Forms[].DefResource.pageurls[${pageIndex}].formdef${pointer.slice(1)}`, control: label });
    }
  });
}

function validateUiStandardFormRoot(form, report, context = {}) {
  const container = form && form.attrs && form.attrs.container;
  if (container && container.cw !== "2") {
    uiStandardWarning(report, "UI_STANDARD_CONTENT_WIDTH_NOT_FULL", "UI/UX standard forms should use full-width content area: attrs.container.cw = \"2\".", context);
  }
  const rootPadding = container && container.padding;
  if (!zeroPadding(rootPadding) && !hasSafeHorizontalPaddingValue(rootPadding)) {
    uiStandardWarning(report, "UI_STANDARD_FORM_PADDING_UNUSUAL", "Form root padding should be either zero with padded inner sections or safe horizontal page padding.", context);
  }
}

function hasPageLevelBackground(root) {
  return Boolean(root && root.attrs && root.attrs.background);
}

function hasContainerBackground(control) {
  return Boolean(control && control.attrs && control.attrs.common && control.attrs.common.background);
}

function validateUiStandardContainers(root, report, context = {}) {
  const main = findControlByLabel(root, "Main");
  const content = findControlByLabel(root, "Content");
  if (!main) {
    uiStandardWarning(report, "UI_STANDARD_MAIN_CONTAINER_MISSING", "UI/UX standard pages/forms should have a top-level container with nv_label \"Main\".", context);
    return;
  }
  if (!content) {
    uiStandardWarning(report, "UI_STANDARD_CONTENT_CONTAINER_MISSING", "UI/UX standard pages/forms should place visible content inside a container with nv_label \"Content\".", context);
    return;
  }
  if (!controlContains(main, content)) {
    uiStandardWarning(report, "UI_STANDARD_CONTENT_NOT_INSIDE_MAIN", "UI/UX standard Content container should be inside Main.", context);
  }
  if (hasContainerBackground(main)) {
    uiStandardWarning(report, "MAIN_CONTAINER_PAGE_BACKGROUND", "Main should stay structural. Put full-page background on the page/form background property, and reserve container backgrounds for specific sections, cards, headers, and content surfaces.", context);
    if (!hasPageLevelBackground(root)) {
      uiStandardWarning(report, "PAGE_BACKGROUND_MISSING_WITH_MAIN_BACKGROUND", "Page/form background is missing while Main carries a background. Generated dashboards, custom list forms, and approval pages should use the page-level background setting for full-page color.", context);
    }
  }
  const actionPanel = [];
  const flowHistory = [];
  walkControls(root, (control) => {
    if (control.type === "workflowControlPanel") actionPanel.push(control);
    if (control.type === "workflowHistory") flowHistory.push(control);
  });
  if (!context.requireFormBody && !actionPanel.length && !flowHistory.length) return;
  const formBody = findControlByLabel(root, "Form body");
  const formBottom = findControlByLabel(root, "Form bottom");
  if (!formBody) uiStandardContainerIssue(report, context, "UI_STANDARD_FORM_BODY_MISSING", "Approval form pages should put main fields inside a container with nv_label \"Form body\".");
  if (!formBottom) uiStandardContainerIssue(report, context, "UI_STANDARD_FORM_BOTTOM_MISSING", "Approval form pages should put Action Panel and Flow History inside a container with nv_label \"Form bottom\".");
  if (formBottom) {
    for (const control of actionPanel) {
      if (!controlContains(formBottom, control)) uiStandardContainerIssue(report, context, "UI_STANDARD_ACTION_PANEL_NOT_IN_FORM_BOTTOM", "workflowControlPanel should be placed inside Form bottom.");
    }
    for (const control of flowHistory) {
      if (!controlContains(formBottom, control)) uiStandardContainerIssue(report, context, "UI_STANDARD_FLOW_HISTORY_NOT_IN_FORM_BOTTOM", "workflowHistory should be placed inside Form bottom.");
    }
  }
}

function validateWorkflowGraph(def, form, report) {
  const shapes = collectShapes(def);
  if (!shapes.length) {
    issue(report, "warning", "WORKFLOW_NODES_MISSING", "Workflow has no childshapes.", { form: form.Name, key: form.Key });
    return;
  }
  const ids = new Set(shapes.map(shapeId).filter(Boolean));
  shapes.forEach((shape) => {
    for (const ref of asArray(shape.outgoing)) {
      const id = refId(ref);
      if (id && !ids.has(id)) issue(report, "warning", "WORKFLOW_OUTGOING_TARGET_NOT_FOUND", "Workflow outgoing reference does not resolve.", { form: form.Name, node: shapeId(shape), outgoing: id });
    }
    for (const ref of asArray(shape.incoming)) {
      const id = refId(ref);
      if (id && !ids.has(id)) issue(report, "warning", "WORKFLOW_INCOMING_SOURCE_NOT_FOUND", "Workflow incoming reference does not resolve.", { form: form.Name, node: shapeId(shape), incoming: id });
    }
  });
  const workflowVariables = collectWorkflowVariables(def);
  for (const finding of validateWorkflowBranchConditionCoverage({
    shapes,
    variablesById: workflowVariables.byId,
    path: "Data.Forms[].DefResource.childshapes",
    workflow: safeString(form && (form.Name || form.Title || form.Key)),
  })) {
    issue(report, generatorFinalSeverity(report), finding.code, finding.message, {
      form: form.Name,
      key: form.Key,
      path: finding.path,
      ...(finding.detail || {}),
    });
  }
  const flowsById = new Map(shapes.filter((shape) => shapeType(shape) === "SequenceFlow").map((shape) => [shapeId(shape), shape]));
  shapes.forEach((shape) => {
    if (shapeType(shape) !== "MultiAssignmentTask") return;
    const outgoingIds = asArray(shape.outgoing).map(refId).filter(Boolean);
    if (outgoingIds.length < 2) return;
    const outgoingFlows = outgoingIds.map((id) => flowsById.get(id)).filter(Boolean);
    const conditionBlob = JSON.stringify(outgoingFlows.map((flow) => flow.properties && flow.properties.conditioninfo || []));
    if (conditionBlob.includes("HasCustomPackageProduct")) {
      const hasStandardNo = conditionBlob.includes("Has Custom Package Product") && conditionBlob.includes("s.=") && conditionBlob.includes("No");
      const hasFallbackNotNo = conditionBlob.includes("Has Custom Package Product") && conditionBlob.includes("s.!=") && conditionBlob.includes("No");
      if (hasStandardNo && !hasFallbackNotNo) {
        issue(report, "warning", "WORKFLOW_BRANCH_CUSTOM_PACKAGE_FALLBACK_MISSING", "Workflow branches on HasCustomPackageProduct should include a fallback for Yes, empty, or unexpected values, typically routing to Finance/Benefits Review.", { form: form.Name, node: shape.properties && shape.properties.name || shapeId(shape) });
      }
    }
  });
}

function validateGeneratedListRuntimeUsage(data, report) {
  const listTitles = new Map();
  asArray(data && data.Childs).forEach((child) => {
    const list = child && child.ListModel ? child.ListModel : {};
    const id = safeString(list.ListID);
    const title = safeString(list.Title);
    if (id && title) listTitles.set(id, title);
  });
  if (!listTitles.size) return;
  const reads = new Map();
  const writes = new Map();
  const edits = new Map();
  for (const form of asArray(data && data.Forms)) {
    const def = parseDefResource(form, report, -1);
    if (!def) continue;
    for (const shape of collectShapes(def)) {
      if (shapeType(shape) === "ContentList") {
        const props = shape.properties || {};
        const id = safeString(props.listid || props.ListID);
        if (!id) continue;
        writes.set(id, (writes.get(id) || 0) + 1);
        if (["edit", "remove"].includes(safeString(props.type))) edits.set(id, (edits.get(id) || 0) + 1);
      }
    }
    for (const page of asArray(def.pageurls)) {
      const formdef = typeof page.formdef === "string" ? tryParseJson(page.formdef) : page.formdef;
      for (const action of asArray(formdef && formdef.actions)) {
        for (const step of asArray(action && action.steps)) {
          if (step && step.type === "querydata") {
            const ref = step.attrs && step.attrs.querydata_list;
            const id = safeString(ref && (ref.ListID || ref.listid));
            if (id) reads.set(id, (reads.get(id) || 0) + 1);
          }
        }
      }
    }
  }
  for (const [id, title] of listTitles.entries()) {
    const businessConfigLike = /(Requirement Rules|Configuration|Rules)$/i.test(title);
    const usageLike = /(Quota Usage|Usage History|Usage)$/i.test(title);
    if ((businessConfigLike || usageLike) && !reads.has(id) && !writes.has(id)) {
      issue(report, "warning", "GENERATED_LIST_UNUSED_RUNTIME_PURPOSE", "Generated configuration/usage list has no detected form-action read or workflow ContentList write/update. Use it in v1 or defer it out of the package.", { list: title, listId: id });
    }
    if (/Attachment Requirement Rules/i.test(title) && !reads.has(id)) {
      issue(report, "warning", "ATTACHMENT_RULES_NOT_READ_BY_FORM_ACTION", "Attachment Requirement Rules exists but no Query data form action reads it; prefer using it for guidance/validation or defer the list.", { list: title, listId: id });
    }
    if (/Family Quota Usage/i.test(title)) {
      if (!writes.has(id)) {
        issue(report, "warning", "FAMILY_QUOTA_USAGE_NOT_WRITTEN", "Family Quota Usage exists but no workflow ContentList write/update targets it.", { list: title, listId: id });
      }
      if (!reads.has(id)) {
        issue(report, "warning", "FAMILY_QUOTA_USAGE_NOT_READ_BY_QUOTA_CHECK", "Family Quota Usage should be read by quota-check Query data actions.", { list: title, listId: id });
      }
      if (!edits.has(id)) {
        issue(report, "warning", "FAMILY_QUOTA_USAGE_RELEASE_NOT_MODELED", "Family Quota Usage should model approval confirmation or rejection release through ContentList edit/remove when runtime-safe.", { list: title, listId: id });
      }
    }
  }
}

function validateWorkflowActionConfigurations(def, form, report) {
  const shapes = collectShapes(def);
  const actionReport = validateWorkflowActionShapes(shapes, {
    mode: report.mode,
    stage: report.stage,
    pointerForIndex: (index) => `Data.Forms[${safeString(form.Key || form.Name)}].DefResource.childshapes[${index}]`,
  });
  for (const [key, value] of Object.entries(actionReport.summary)) {
    report.summary.workflowActionConfig[key] = (report.summary.workflowActionConfig[key] || 0) + value;
  }
  actionReport.issues.forEach((entry) => {
    let level = entry.level;
    if (level === "dependency") level = "dependency";
    else if (level !== "error") level = "warning";
    issue(report, level, entry.code, entry.message, { form: form.Name, key: form.Key, ...entry });
  });
}

function validateWorkflowReferences(def, form, listsById, fieldsByList, report, aiResourcesById = new Map()) {
  collectShapes(def).forEach((shape) => {
    const type = shapeType(shape);
    const props = shape.properties || {};
    if (type === "ContentList") {
      report.summary.contentListReferences += 1;
      const listId = safeString(props.listid || props.ListID);
      if (!listId) issue(report, "error", "CONTENTLIST_LISTID_MISSING", "ContentList node missing target listid.", { form: form.Name, node: props.name || shapeId(shape) });
      else if (!listsById.has(listId)) issue(report, report.mode === "generator" ? "error" : "dependency", "CONTENTLIST_TARGET_UNRESOLVED", "ContentList target list does not resolve inside package.", { form: form.Name, node: props.name || shapeId(shape), listId });
      const targetFields = fieldsByList.get(listId) || new Map();
      asArray(props.listdatas).forEach((entry) => {
        if (entry && entry.Columns && targetFields.size && !targetFields.has(String(entry.Columns))) {
          issue(report, report.mode === "generator" ? "error" : "warning", "CONTENTLIST_TARGET_FIELD_NOT_FOUND", "ContentList target field does not resolve.", { form: form.Name, node: props.name || shapeId(shape), listId, column: entry.Columns });
        }
      });
    }
    if (type === "QueryData") {
      const listId = safeString(props.listid || props.ListID || props.sourceListId || props.sourceListID);
      if (listId && !listsById.has(listId)) issue(report, report.mode === "generator" ? "error" : "dependency", "QUERYDATA_TARGET_UNRESOLVED", "QueryData target list does not resolve inside package.", { form: form.Name, node: props.name || shapeId(shape), listId });
    }
    if (type === "AI") {
      const agentId = safeString(props.data && props.data.AgentID);
      if (safeString(props.type) === "agent") {
        if (!agentId) {
          issue(report, report.mode === "generator" ? "error" : "warning", "AI_ACTION_AGENT_REFERENCE_MISSING", "AI Assistant workflow action in agent mode is missing properties.data.AgentID.", { form: form.Name, node: props.name || shapeId(shape) });
        } else if (!aiResourcesById.has(agentId)) {
          issue(report, report.mode === "generator" ? "error" : "dependency", "AI_ACTION_AGENT_REFERENCE_UNRESOLVED", "AI Assistant workflow action references an AI Agent not included in the package.", { form: form.Name, node: props.name || shapeId(shape), agentId });
        }
      }
      if (!Array.isArray(props.inputVariables)) {
        issue(report, report.mode === "generator" ? "error" : "warning", "AI_ACTION_INPUT_VARIABLES_INVALID", "AI Assistant workflow action should store inputVariables as an array.", { form: form.Name, node: props.name || shapeId(shape) });
      } else {
        for (const input of props.inputVariables) {
          if (!isObject(input) || !safeString(input.id)) {
            issue(report, report.mode === "generator" ? "error" : "warning", "AI_ACTION_INPUT_VARIABLE_ID_MISSING", "AI Assistant workflow action input variable should include an id.", { form: form.Name, node: props.name || shapeId(shape) });
            continue;
          }
          if (!safeString(input.type)) {
            issue(report, report.mode === "generator" ? "error" : "warning", "AI_ACTION_INPUT_VARIABLE_TYPE_MISSING", "AI Assistant workflow action input variable should include a type.", { form: form.Name, node: props.name || shapeId(shape), inputId: input.id });
          }
          const expr = isObject(input.value) ? input.value.value : null;
          if (safeString(input.type) === "img") {
            if (!isObject(input.value)) {
              issue(report, report.mode === "generator" ? "error" : "warning", "AI_ACTION_IMAGE_INPUT_VALUE_MISSING", "AI Assistant workflow image input should include a structured value mapping.", { form: form.Name, node: props.name || shapeId(shape), inputId: input.id });
            } else if (isObject(expr) && safeString(expr.exprType) === "list_field") {
              const valueType = safeString(expr.valueType);
              if (valueType && !["icon-upload", "file-upload"].includes(valueType)) {
                issue(report, "warning", "AI_ACTION_IMAGE_INPUT_VALUE_TYPE_UNSTUDIED", "Studied workflow image inputs map from list fields using valueType icon-upload or file-upload.", {
                  form: form.Name,
                  node: props.name || shapeId(shape),
                  inputId: input.id,
                  valueType,
                });
              }
            }
          }
        }
      }
      if (!Array.isArray(props.outputVariables)) {
        issue(report, report.mode === "generator" ? "error" : "warning", "AI_ACTION_OUTPUT_VARIABLES_INVALID", "AI Assistant workflow action should store outputVariables as an array.", { form: form.Name, node: props.name || shapeId(shape) });
      }
      for (const output of asArray(props.outputVariables)) {
        const target = output && output.value;
        if (!isObject(target) || !safeString(target.prefix) || !safeString(target.value)) {
          issue(report, report.mode === "generator" ? "error" : "warning", "AI_ACTION_OUTPUT_MAPPING_INVALID", "AI Assistant output variable should map to a workflow variable using value.prefix and value.value.", { form: form.Name, node: props.name || shapeId(shape), outputId: output && output.id || null });
        }
      }
    }
  });
}

function buildAiResourcesById(data) {
  const out = new Map();
  for (const module of asArray(data && data.OtherModules)) {
    if (safeString(module.Type) !== "Agents") continue;
    for (const item of asArray(module.Data)) {
      const id = safeString(item && item.ID);
      if (id) out.set(id, item);
    }
  }
  return out;
}

function validateReportsDashboardsModules(data, listsById, fieldsByList, replaceIds, localIds, report) {
  report.summary.reports += asArray(data && data.DataReports).length + asArray(data && data.FormReports).length + asArray(data && data.FormNewReports).length;
  validateFormNewReports(data, report);
  for (const reportItem of [...asArray(data && data.DataReports), ...asArray(data && data.FormReports), ...asArray(data && data.FormNewReports)]) {
    const raw = JSON.stringify(reportItem);
    const ids = [...raw.matchAll(/"ListID"\s*:\s*"?(\d{12,})"?/g)].map((m) => m[1]);
    ids.forEach((id) => {
      if (!listsById.has(String(id))) issue(report, report.mode === "generator" ? "error" : "dependency", "REPORT_SOURCE_LIST_UNRESOLVED", "Report source ListID does not resolve inside package.", { report: reportItem.Title || reportItem.Name || reportItem.Key || null, listId: String(id) });
    });
  }

  const rootLayouts = asArray(data && data.Item && data.Item.Layouts);
  rootLayouts.filter((layout) => Number(layout.Type) === 103).forEach((layout) => {
    const resources = asArray(layout.LayoutInResources);
    resources.forEach((resource, index) => {
      const form = tryParseJson(resource.Resource);
      if (!form) {
        if (resource.Resource) issue(report, "warning", "DASHBOARD_RESOURCE_JSON_INVALID", "Dashboard/page Resource is not valid JSON.", { layout: layout.Title, index });
        return;
      }
      walk(form, (node) => {
        if (!isObject(node)) return;
        const listId = node.ListID || node.listid || node.listId;
        if (listId && LARGE_INTEGER_RE.test(String(listId)) && !listsById.has(String(listId))) {
          issue(report, report.mode === "generator" ? "error" : "dependency", "DASHBOARD_LIST_REFERENCE_UNRESOLVED", "Dashboard/page references a ListID not found inside package.", { layout: layout.Title, listId: String(listId) });
        }
      });
    });
  });

  asArray(data && data.OtherModules).forEach((module, index) => {
    const type = safeString(module.Type || module.type || "unknown");
    const count = Array.isArray(module.Data) ? module.Data.length : isObject(module.Data) ? Object.keys(module.Data).length : 0;
    report.inventories.modules.push({ type, count });
    if (!/^(Agents|Knowledges|Connections)$/i.test(type)) issue(report, report.mode === "generator" ? "warning" : "warning", "UNKNOWN_OTHER_MODULE", "OtherModules entry has an unknown module type.", { type, index });
  });
}

function validateFormNewReports(data, report) {
  const formsByKey = new Map();
  for (const form of asArray(data && data.Forms)) {
    const def = tryParseJson(form && form.DefResource) || {};
    const key = safeString(form && (form.Key || def.defkey));
    if (!key) continue;
    formsByKey.set(key, { form, def, variables: formReportVariableIndex(def) });
  }

  const reportChildrenById = new Map();
  for (const child of asArray(data && data.Childs)) {
    if (Number(child && child.ListModel && child.ListModel.Type) === 32) {
      reportChildrenById.set(safeString(child.ListModel.ListID), child);
    }
  }

  for (const [index, formReport] of asArray(data && data.FormNewReports).entries()) {
    const label = formReport && (formReport.Name || formReport.Title || formReport.ID || `FormNewReports[${index}]`);
    const settings = tryParseJson(formReport && formReport.Settings);
    if (!isObject(settings)) {
      issue(report, generatorFinalSeverity(report), "FORM_REPORT_SETTINGS_INVALID", "Form Report Settings must be parseable JSON object.", { report: label, index });
      continue;
    }

    const attr = tryParseJson(formReport && formReport.Attr) || {};
    for (const key of ["isViewDetail", "isExport"]) {
      if (attr[key] !== undefined && typeof attr[key] !== "boolean") {
        issue(report, "warning", "FORM_REPORT_ATTR_UNKNOWN_VALUE", "Form Report Attr uses an unrecognized value type.", { report: label, attr: key, valueType: typeof attr[key] });
      }
    }

    const source = formsByKey.get(safeString(formReport && formReport.DefKey));
    if (!source) {
      issue(report, generatorFinalSeverity(report, "dependency"), "FORM_REPORT_SOURCE_APPROVAL_FORM_UNRESOLVED", "Form Report DefKey should resolve to an included approval form.", { report: label, defKey: formReport && formReport.DefKey });
      continue;
    }

    const child = reportChildrenById.get(safeString(formReport && formReport.ID));
    if (!child) {
      issue(report, generatorFinalSeverity(report, "dependency"), "FORM_REPORT_CHILD_RESOURCE_MISSING", "Form Report should have a matching child resource with ListModel.Type = 32 and ListID equal to the report ID.", { report: label });
    } else {
      if (asArray(child.FlowMappings).length || asArray(child.PublicForms).length) {
        issue(report, generatorFinalSeverity(report), "FORM_REPORT_SHOULD_NOT_DEFINE_WORKFLOW_OR_FORMS", "Form Report resources should not define workflow mappings or edit/create forms.", { report: label, flowMappings: asArray(child.FlowMappings).length, publicForms: asArray(child.PublicForms).length });
      }
      if (child.ListModel && child.ListModel.IsBreakInherit === true && child.ListModel.Perm === undefined) {
        issue(report, "warning", "FORM_REPORT_CUSTOM_PERMISSION_INCOMPLETE", "Custom Form Report permissions should include explicit permission metadata when inheritance is disabled.", { report: label });
      }
      for (const [viewIndex, layout] of asArray(child.Layouts).entries()) {
        const layoutView = tryParseJson(layout && layout.LayoutView) || {};
        if (layoutView.Attr_IsViewDetail !== undefined && typeof layoutView.Attr_IsViewDetail !== "boolean") {
          issue(report, "warning", "FORM_REPORT_VIEW_DETAIL_ACCESS_UNRECOGNIZED", "Form Report view detail-page access flag should be boolean when present.", { report: label, viewIndex });
        }
      }
      if (asArray(child.Defs).length && asArray(settings.Fields).length && asArray(child.Defs).length !== asArray(settings.Fields).length) {
        issue(report, "warning", "FORM_REPORT_FIELD_RESOURCE_COUNT_MISMATCH", "Form Report child resource fields should align with Settings.Fields.", { report: label, settingsFields: asArray(settings.Fields).length, childFields: asArray(child.Defs).length });
      }
    }

    const subListId = safeString(settings.SubListID);
    if (Array.isArray(settings.SubListID) || isObject(settings.SubListID) || subListId.includes(",")) {
      issue(report, "warning", "FORM_REPORT_MULTIPLE_SUBLISTS_UNPROVEN", "Only one selected Form Report sub-list is export-proven; multiple sub-list generation should warn.", { report: label, subListID: settings.SubListID });
    }
    if (subListId && !source.variables.listVariables.has(subListId)) {
      issue(report, generatorFinalSeverity(report, "warning"), "FORM_REPORT_SUBLIST_UNRESOLVED", "Form Report SubListID should resolve to an approval form list variable key.", { report: label, subListID: subListId });
    }

    const keys = new Set();
    const names = new Set();
    let selectedSubListFieldCount = 0;
    for (const [fieldIndex, field] of asArray(settings.Fields).entries()) {
      const key = safeString(field && field.Key);
      const displayName = safeString(field && (field.Name || field.Label || field.PropName));
      if (!key) {
        issue(report, generatorFinalSeverity(report), "FORM_REPORT_FIELD_KEY_MISSING", "Form Report fields should include a stable Key.", { report: label, fieldIndex });
      } else if (keys.has(key)) {
        issue(report, generatorFinalSeverity(report), "FORM_REPORT_FIELD_KEY_DUPLICATE", "Form Report field Keys should be unique inside one report.", { report: label, key });
      }
      keys.add(key);
      if (displayName) {
        if (names.has(displayName)) issue(report, "warning", "FORM_REPORT_FIELD_DISPLAY_NAME_DUPLICATE", "Form Report field display names should be unique inside one report.", { report: label, fieldIndex });
        names.add(displayName);
      }

      const sourceInfo = formReportFieldSource(field, subListId, source.variables);
      if (!sourceInfo.resolved && !field.IsSystem) {
        issue(report, generatorFinalSeverity(report, "warning"), "FORM_REPORT_FIELD_SOURCE_UNRESOLVED", "Form Report field should reference a valid approval variable or selected sub-list field.", { report: label, fieldIndex, key, sourceKind: sourceInfo.kind });
      }
      if (sourceInfo.kind === "sub-list-field") selectedSubListFieldCount += 1;
      if (sourceInfo.resolved && !formReportMappingCompatible(sourceInfo.variableType, field && (field.L_Type || field.Type))) {
        issue(report, "warning", "FORM_REPORT_FIELD_TYPE_MAPPING_UNSTUDIED", "Form Report variable-to-field type mapping is not in the export-backed compatibility table.", { report: label, fieldIndex, variableType: sourceInfo.variableType, reportFieldType: field && (field.L_Type || field.Type) });
      }
      validateFormReportFieldSettings(field, label, fieldIndex, report);
    }
    if (subListId && selectedSubListFieldCount === 0) {
      issue(report, "warning", "FORM_REPORT_SUBLIST_FIELDS_MISSING", "Form Report selected a sub-list but no sub-list field mappings were detected.", { report: label, subListID: subListId });
    }
  }
}

function formReportVariableIndex(def) {
  const basicById = new Map();
  const listVariables = new Set();
  const listRefsByListVariable = new Map();
  const listFieldTypes = new Map();
  const listRefs = new Map();
  for (const variable of asArray(def && def.variables && def.variables.basic)) {
    basicById.set(safeString(variable.id), safeString(variable.type || "unknown"));
  }
  for (const listRef of asArray(def && def.variables && def.variables.listref)) {
    listRefs.set(safeString(listRef.id), asArray(listRef.fields));
  }
  for (const variable of asArray(def && def.variables && def.variables.basic)) {
    if (safeString(variable.type) !== "list") continue;
    const listVariableKey = `vlist_${safeString(variable.id)}`;
    listVariables.add(listVariableKey);
    const listRefId = safeString(variable.value && variable.value.listref);
    listRefsByListVariable.set(listVariableKey, listRefId);
    for (const field of asArray(listRefs.get(listRefId))) {
      listFieldTypes.set(`${listVariableKey}:${safeString(field.id)}`, safeString(field.type || "unknown"));
    }
  }
  return { basicById, listVariables, listRefsByListVariable, listFieldTypes };
}

function formReportFieldSource(field, subListId, variables) {
  const key = safeString(field && field.Key);
  const id = safeString(field && field.ID);
  if (field && field.IsSystem) return { kind: "system", resolved: true, variableType: "system" };
  if (subListId && key.startsWith(`${subListId}_`)) {
    const subFieldId = key.slice(`${subListId}_`.length);
    const variableType = variables.listFieldTypes.get(`${subListId}:${subFieldId}`);
    return { kind: "sub-list-field", resolved: Boolean(variableType), variableType: variableType || safeString(field && field.Type) || "unknown" };
  }
  if (key.startsWith("vlist_")) {
    return { kind: "approval-list-variable", resolved: variables.listVariables.has(key) || variables.basicById.has(id), variableType: variables.basicById.get(id) || safeString(field && field.Type) || "list" };
  }
  return { kind: "approval-variable", resolved: variables.basicById.has(id), variableType: variables.basicById.get(id) || safeString(field && field.Type) || "unknown" };
}

function formReportMappingCompatible(variableType, reportFieldType) {
  const vt = safeString(variableType).toLowerCase();
  const ft = safeString(reportFieldType).toLowerCase();
  if (!vt || !ft || vt === "system") return true;
  const allowed = {
    text: new Set(["input", "textarea", "richtext", "percent", "switch", "signature", "input_number", "currency", "datepicker", "time", "identity-picker", "organization-picker", "location-picker", "cost-center-picker", "file-upload", "icon-upload"]),
    number: new Set(["input_number", "percent", "currency", "input"]),
    boolean: new Set(["switch"]),
    date: new Set(["datepicker", "time"]),
    file: new Set(["file-upload"]),
    img: new Set(["icon-upload"]),
    user: new Set(["identity-picker"]),
    groupselect: new Set(["organization-picker"]),
    location: new Set(["location-picker"]),
    costcenter: new Set(["cost-center-picker"]),
    metadata: new Set(["metadata"]),
    "mutiple-metadata": new Set(["mutiple-metadata"]),
    lookup: new Set(["lookup"]),
    list: new Set(["textarea"]),
  };
  return allowed[vt] ? allowed[vt].has(ft) : false;
}

function validateFormReportFieldSettings(field, reportLabel, fieldIndex, report) {
  const type = safeString(field && (field.L_Type || field.Type)).toLowerCase();
  const rules = field && field.Rules;
  const hasRules = isObject(rules);
  const requireRule = (ruleName) => {
    if (!hasRules || rules[ruleName] === undefined || rules[ruleName] === null || rules[ruleName] === "") {
      issue(report, "warning", "FORM_REPORT_FIELD_SETTING_MISSING", "Form Report field type usually carries an additional setting in studied exports.", { report: reportLabel, fieldIndex, fieldType: type, setting: ruleName });
    }
  };
  if (["input_number", "percent"].includes(type)) requireRule("rounded-to");
  if (type === "currency") {
    requireRule("currencyCode");
    requireRule("displayFormat");
    requireRule("rounded-to");
  }
  if (type === "switch") requireRule("displayStyle");
  if (type === "datepicker") {
    requireRule("showtime");
    requireRule("dateformat");
  }
  if (type === "time") requireRule("dateformat");
  if (["identity-picker", "organization-picker", "cost-center-picker"].includes(type)) requireRule("multiple");
  if (type === "lookup") {
    requireRule("listid");
    requireRule("listfield");
  }
}

function parseOtherModuleData(module, report, expectedType) {
  if (!module) return [];
  const raw = module.Data;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const parsed = tryParseJson(raw);
    if (Array.isArray(parsed)) return parsed;
    issue(report, "warning", "OTHER_MODULE_DATA_JSON_INVALID", "OtherModules Data should parse to an array for studied AI/resource modules.", { type: expectedType || module.Type || null });
    return [];
  }
  if (raw === undefined || raw === null) return [];
  issue(report, "warning", "OTHER_MODULE_DATA_NOT_ARRAY", "OtherModules Data should be an array for studied AI/resource modules.", { type: expectedType || module.Type || null, dataType: typeof raw });
  return [];
}

function validateConnectionModuleEntry(connection, index, report) {
  const name = safeString(connection && connection.Name);
  const id = safeString(connection && connection.ID);
  const type = Number(connection && connection.Type);
  if (!id) issue(report, generatorFinalSeverity(report), "CONNECTION_ID_MISSING", "Connection entries should include ID so Agent/Copilot tools can reference them.", { index, name });
  if (!name) issue(report, "warning", "CONNECTION_NAME_MISSING", "Connection entries should include a display name.", { index, id });
  if (!Number.isFinite(type)) {
    issue(report, "warning", "CONNECTION_TYPE_MISSING", "Connection entry Type is missing or not numeric.", { index, name });
  } else if (![10, 11].includes(type)) {
    issue(report, "warning", "CONNECTION_TYPE_UNSTUDIED", "Connection entry uses a Type that is not yet proven by the AI Agent/Copilot application-resource export study.", { index, name, type });
  }

  const config = tryParseJson(connection && connection.Config) || connection && connection.Config;
  if (!isObject(config)) {
    issue(report, generatorFinalSeverity(report), "CONNECTION_CONFIG_INVALID", "Connection Config should be parseable object metadata.", { index, name, id });
    return;
  }

  const configKeys = Object.keys(config);
  if (type === 10) {
    for (const key of ["Environment", "Timeout", "BaseUrl", "AuthenticationMethod", "AllowedMethods"]) {
      if (config[key] === undefined) issue(report, "warning", "HTTP_CONNECTION_CONFIG_KEY_MISSING", "HTTP API / Generic connection is missing an export-proven Config key.", { connection: name, key });
    }
  }
  if (type === 11) {
    for (const key of ["Environment", "Timeout", "BaseUrl", "GrantType", "AuthorizationMode", "AuthorizationEndpoint", "TokenEndpoint", "ClientId", "Scopes", "AllowedMethods", "AuthenticationMethod"]) {
      if (config[key] === undefined) issue(report, "warning", "OAUTH_CONNECTION_CONFIG_KEY_MISSING", "OAuth 2.0 connection is missing an export-proven Config key.", { connection: name, key });
    }
  }
  if (configKeys.some((key) => /(access[_-]?token|refresh[_-]?token|id[_-]?token|secret|password|api[_-]?key|accesskey)/i.test(key) && safeString(config[key]))) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "dependency", "CONNECTION_CONFIG_SECRET_FIELD_PRESENT", "Connection Config contains a secret/token-like field. Do not commit raw values; generated packages must use placeholders or require reconfiguration.", { connection: name });
  }
  if (configKeys.some((key) => /(clientid|endpoint|baseurl|authorization)/i.test(key) && safeString(config[key]))) {
    issue(report, "dependency", "CONNECTION_CONFIG_SENSITIVE_FIELD_PRESENT", "Connection Config contains tenant/environment-sensitive metadata. Reports and references must redact the value.", { connection: name, keys: configKeys.filter((key) => /(clientid|endpoint|baseurl|authorization)/i.test(key)) });
  }
}

function validateAgentCopilotModules(data, listsById, report) {
  const modules = new Map(asArray(data && data.OtherModules).map((module) => [safeString(module.Type), module]));
  const connections = parseOtherModuleData(modules.get("Connections"), report, "Connections");
  const aiResources = parseOtherModuleData(modules.get("Agents"), report, "Agents");
  const knowledges = parseOtherModuleData(modules.get("Knowledges"), report, "Knowledges");

  report.summary.connections = connections.length;
  report.summary.knowledges = knowledges.length;

  const connectionIds = new Set(connections.map((connection) => safeString(connection.ID)).filter(Boolean));
  const aiResourceIds = new Set(aiResources.map((resource) => safeString(resource.ID)).filter(Boolean));
  const knowledgeNames = new Set(knowledges.map((knowledge) => safeString(knowledge.Name)).filter(Boolean));
  const rootListSetId = safeString(data && data.Item && data.Item.ListModel && data.Item.ListModel.ListID);

  connections.forEach((connection, index) => validateConnectionModuleEntry(connection, index, report));

  report.summary.agents = aiResources.filter((resource) => Number(resource.Type) === 0).length;
  report.summary.copilots = aiResources.filter((resource) => Number(resource.Type) === 1).length;

  aiResources.forEach((aiResource, index) => {
    const resourceName = safeString(aiResource.Name);
    const resourceId = safeString(aiResource.ID);
    const resourceType = Number(aiResource.Type);
    if (!resourceId) issue(report, generatorFinalSeverity(report), "AI_RESOURCE_ID_MISSING", "AI Agent/Copilot resource is missing ID.", { index, name: resourceName });
    if (!resourceName) issue(report, "warning", "AI_RESOURCE_NAME_MISSING", "AI Agent/Copilot resource is missing Name.", { index, id: resourceId });
    if (aiResource.Publisher === null || aiResource.Publisher === undefined || aiResource.Publisher === "") {
      issue(report, generatorFinalSeverity(report), "AI_RESOURCE_PUBLISHER_MISSING", "Generated AI Agent/Copilot resources should set Publisher to 0 by default; null publisher metadata can fail Yeeflow import/materialization.", { index, name: resourceName, id: resourceId });
    } else if (Number.isNaN(Number(aiResource.Publisher))) {
      issue(report, generatorFinalSeverity(report), "AI_RESOURCE_PUBLISHER_INVALID", "Generated AI Agent/Copilot Publisher should be numeric, usually 0 for default generated resources.", { index, name: resourceName, id: resourceId, publisher: aiResource.Publisher });
    }
    if (![0, 1].includes(resourceType)) {
      issue(report, "warning", "AI_RESOURCE_TYPE_UNSTUDIED", "AI resources in the studied Agents module use Type 0 for AI Agent and Type 1 for Copilot.", { index, name: resourceName, type: aiResource.Type });
    }
    const settings = tryParseJson(aiResource.Settings);
    const draft = tryParseJson(aiResource.Draft);
    if (!isObject(settings)) issue(report, generatorFinalSeverity(report), "AI_RESOURCE_SETTINGS_INVALID", "AI Agent/Copilot Settings should be parseable JSON object.", { name: resourceName, id: resourceId });
    if (aiResource.Draft !== undefined && !isObject(draft)) issue(report, "warning", "AI_RESOURCE_DRAFT_INVALID", "AI Agent/Copilot Draft should be parseable JSON object when present.", { name: resourceName, id: resourceId });
    if (resourceType === 0 && isObject(settings) && settings.Prompt === undefined) {
      issue(report, "warning", "AI_AGENT_PROMPT_MISSING", "Studied AI Agent resources store persona/prompt content in Settings.Prompt.", { name: resourceName, id: resourceId });
    }
    if (resourceType === 1 && isObject(settings) && settings.Instructions === undefined) {
      issue(report, "warning", "COPILOT_INSTRUCTIONS_MISSING", "Studied Copilot resources store user-facing guidance in Settings.Instructions.", { name: resourceName, id: resourceId });
    }
    if (!Array.isArray(aiResource.Components)) {
      issue(report, generatorFinalSeverity(report), "AI_RESOURCE_COMPONENTS_NOT_ARRAY", "AI Agent/Copilot Components should be an array of knowledge/tool bindings.", { name: resourceName, id: resourceId });
      return;
    }
    aiResource.Components.forEach((component, componentIndex) => {
      const componentName = safeString(component.Name);
      const componentType = Number(component.Type);
      if (![1, 2].includes(componentType)) {
        issue(report, "warning", "AI_COMPONENT_TYPE_UNSTUDIED", "Studied AI resource Components use Type 1 for knowledge and Type 2 for tools.", { aiResource: resourceName, component: componentName, componentType });
      }
      if (componentType === 1 && componentName && !knowledgeNames.has(componentName)) {
        issue(report, "warning", "AI_KNOWLEDGE_COMPONENT_NAME_UNRESOLVED", "Knowledge component name does not match an included Knowledges module entry. Confirm import remapping before generation.", { aiResource: resourceName, component: componentName });
      }
      if (componentType !== 2) return;
      const componentSettings = tryParseJson(component.Settings);
      if (!isObject(componentSettings)) {
        issue(report, generatorFinalSeverity(report), "AI_TOOL_SETTINGS_INVALID", "AI tool component Settings should be parseable JSON object.", { aiResource: resourceName, component: componentName, componentIndex });
        return;
      }
      const dataRef = isObject(componentSettings.Data) ? componentSettings.Data : null;
      const value = safeString(dataRef && dataRef.Value);
      if (!dataRef || !value) {
        issue(report, "warning", "AI_TOOL_DATA_REFERENCE_MISSING", "AI tool component has no Settings.Data.Value reference. It may be configuration-only, but generation should not assume a target.", { aiResource: resourceName, component: componentName });
        return;
      }
      if (connectionIds.has(value)) {
        issue(report, "dependency", "AI_TOOL_EXTERNAL_CONNECTION_REFERENCE", "AI tool references an application connection. Runtime testing must not call the external system without safe test credentials.", { aiResource: resourceName, component: componentName, connectionId: value, credentialstype: componentSettings.credentialstype || null });
      } else if (value === rootListSetId) {
        if (!isObject(componentSettings.resources)) {
          issue(report, "warning", "AI_APPLICATION_RESOURCE_TOOL_RESOURCES_MISSING", "Application-resource access tool should include Settings.resources when exporting selectable app resources; absence may mean all resources are implied.", { aiResource: resourceName, component: componentName });
        } else {
          const dataListItems = asArray(componentSettings.resources.dataLists && componentSettings.resources.dataLists.items);
          if (componentSettings.resources.dataLists && !Array.isArray(componentSettings.resources.dataLists.items)) {
            issue(report, "warning", "AI_APPLICATION_RESOURCE_TOOL_DATALISTS_INVALID", "Application-resource access tool dataLists.items should be an array when present.", { aiResource: resourceName, component: componentName });
          }
          validateApplicationResourcePermissionGroups(componentSettings.resources, report, { aiResource: resourceName, component: componentName });
          dataListItems.forEach((entry, entryIndex) => {
            const resourceListId = safeString(entry && entry.id);
            if (!resourceListId) {
              issue(report, generatorFinalSeverity(report), "AI_APPLICATION_RESOURCE_TOOL_DATALIST_ID_MISSING", "Application-resource access tool data list entry should include an id.", { aiResource: resourceName, component: componentName, entryIndex });
              return;
            }
            if (!listsById.has(resourceListId)) {
              issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "dependency", "AI_APPLICATION_RESOURCE_TOOL_DATALIST_UNRESOLVED", "Application-resource access tool references a data list that is not included in the package.", {
                aiResource: resourceName,
                component: componentName,
                listId: resourceListId,
              });
            }
            if (entry.permissions === undefined || entry.permissions === null || entry.permissions === "") {
              issue(report, generatorFinalSeverity(report), "AI_APPLICATION_RESOURCE_TOOL_PERMISSION_MISSING", "Application-resource access tool data list entry should include numeric bitmask permissions.", {
                aiResource: resourceName,
                component: componentName,
                listId: resourceListId,
              });
            } else if (Number.isNaN(Number(entry.permissions))) {
              issue(report, generatorFinalSeverity(report), "AI_APPLICATION_RESOURCE_TOOL_PERMISSION_INVALID", "Application-resource access tool data list permissions should be numeric bitmask values, not arrays or labels.", {
                aiResource: resourceName,
                component: componentName,
                listId: resourceListId,
                permissions: entry.permissions,
              });
            } else if ((Number(entry.permissions) & ~15) !== 0) {
              issue(report, "warning", "AI_APPLICATION_RESOURCE_TOOL_PERMISSION_UNEXPECTED_BITS", "Application-resource access tool permissions should use known bitmask values: create/add=1, edit/update=2, delete=4, read/view=8.", {
                aiResource: resourceName,
                component: componentName,
                listId: resourceListId,
                permissions: entry.permissions,
              });
            }
          });
        }
      } else if (listsById.has(value)) {
        const list = listsById.get(value);
        if (!Array.isArray(componentSettings.Inputs)) issue(report, "warning", "AI_LIST_TOOL_INPUTS_NOT_ARRAY", "List-backed AI tool Settings.Inputs should be an array.", { aiResource: resourceName, component: componentName, list: list.title });
        if (!Array.isArray(componentSettings.Outputs)) issue(report, "warning", "AI_LIST_TOOL_OUTPUTS_NOT_ARRAY", "List-backed AI tool Settings.Outputs should be an array.", { aiResource: resourceName, component: componentName, list: list.title });
      } else if (aiResourceIds.has(value)) {
        issue(report, "dependency", "AI_TOOL_CONNECTED_AGENT_REFERENCE", "AI tool references another AI Agent resource. Generated packages must include and remap the target Agent/Copilot together or defer the binding.", { aiResource: resourceName, component: componentName, targetResourceId: value });
      } else {
        issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "dependency", "AI_TOOL_DATA_REFERENCE_UNRESOLVED", "AI tool Settings.Data.Value does not resolve to an included list, connection, or current app/listset.", { aiResource: resourceName, component: componentName, value });
      }
    });
  });
}

function validateApplicationResourcePermissionGroups(resources, report, context = {}) {
  if (!isObject(resources)) return;
  const permissionRoot = isObject(resources.permissions) ? resources.permissions : resources;
  for (const [groupName, rule] of Object.entries(APP_RESOURCE_PERMISSION_RULES)) {
    const entries = asArray(permissionRoot[groupName] && permissionRoot[groupName].items);
    entries.forEach((entry, entryIndex) => {
      validateApplicationResourcePermissionValue(entry && entry.permissions, groupName, rule, report, { ...context, entryIndex, resourceId: safeString(entry && entry.id) });
    });
  }
  for (const [groupName, conflict] of Object.entries(APP_RESOURCE_PERMISSION_CONFLICT_KEYS)) {
    const entries = asArray(permissionRoot[groupName] && permissionRoot[groupName].items);
    entries.forEach((entry, entryIndex) => {
      const raw = entry && entry.permissions;
      if (raw === undefined || raw === null || raw === "") {
        issue(report, generatorFinalSeverity(report), "AI_APPLICATION_RESOURCE_TOOL_PERMISSION_MISSING", "Application-resource access tool entry should include numeric permissions.", { ...context, groupName, entryIndex, resourceId: safeString(entry && entry.id) });
        return;
      }
      const value = Number(raw);
      if (!Number.isInteger(value)) {
        issue(report, generatorFinalSeverity(report), "AI_APPLICATION_RESOURCE_TOOL_PERMISSION_INVALID", "Application-resource access tool permissions should be an integer bitmask.", { ...context, groupName, entryIndex, resourceId: safeString(entry && entry.id), permissions: raw });
        return;
      }
      const inSchema = conflict.schemaAllowed.has(value);
      const inRules = conflict.rulesAllowed.has(value);
      if (!inSchema || !inRules) {
        issue(report, "warning", "AI_APPLICATION_RESOURCE_TOOL_PERMISSION_SCHEMA_RULE_CONFLICT", "YAP schema and updated app-creation rules disagree for this resource permission family; keep warning-level until product team clarifies.", { ...context, groupName, entryIndex, resourceId: safeString(entry && entry.id), permissions: value, conflict: conflict.label });
      }
    });
  }
}

function validateApplicationResourcePermissionValue(raw, groupName, rule, report, context = {}) {
  if (raw === undefined || raw === null || raw === "") {
    issue(report, generatorFinalSeverity(report), "AI_APPLICATION_RESOURCE_TOOL_PERMISSION_MISSING", "Application-resource access tool entry should include numeric permissions.", { ...context, groupName });
    return;
  }
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    issue(report, generatorFinalSeverity(report), "AI_APPLICATION_RESOURCE_TOOL_PERMISSION_INVALID", "Application-resource access tool permissions should be an integer bitmask.", { ...context, groupName, permissions: raw });
    return;
  }
  if ((value & ~rule.mask) !== 0) {
    issue(report, generatorFinalSeverity(report), "AI_APPLICATION_RESOURCE_TOOL_PERMISSION_INVALID_BITS", "Application-resource access tool permissions include bits outside the schema-backed allowed mask.", { ...context, groupName, permissions: value, allowed: rule.label });
  }
}

function validateLookupRelationships(listsById, fieldsByList, report) {
  for (const list of listsById.values()) {
    const fields = asArray(list.item.Defs);
    for (const field of fields) {
      const rules = parsedFieldRules(field);
      if (normalizeType(field) !== "lookup" && !rules.listid && !rules.listfield) continue;
      report.summary.lookupRelationships += 1;
      const targetListId = safeString(rules.listid || rules.ListID);
      const displayField = safeString(rules.listfield || rules.listField);
      if (!targetListId) {
        issue(report, report.mode === "generator" ? "error" : "warning", "LOOKUP_TARGET_LISTID_MISSING", "Lookup field missing target listid.", { list: list.title, field: field.DisplayName || field.FieldName });
        continue;
      }
      if (!listsById.has(targetListId)) {
        issue(report, report.mode === "generator" ? "error" : "dependency", "LOOKUP_TARGET_LIST_UNRESOLVED", "Lookup target list does not resolve inside package.", { list: list.title, field: field.DisplayName || field.FieldName, targetListId });
        continue;
      }
      if (report.mode === "generator" && report.stage === "final") {
        issue(report, "warning", "LOOKUP_FIELD_SCHEMA_UNPROVEN", "Lookup field schema is included for isolation but remains import-experimental until product confirms this generated lookup shape.", { list: list.title, field: field.DisplayName || field.FieldName, targetListId, displayField });
      }
      const target = listsById.get(targetListId);
      const targetRecords = target.item && target.item.ListDatas && isObject(target.item.ListDatas) ? target.item.ListDatas : {};
      const targetRecordIds = new Set(Object.entries(targetRecords).flatMap(([recordId, record]) => [safeString(recordId), safeString(record && record.ListDataID)]).filter(Boolean));
      if (!targetRecordIds.size) {
        issue(report, "warning", "LOOKUP_TARGET_LIST_EMPTY", "Lookup target list is included but has no sample/reference rows; generated master/reference lists should include usable sample data when forms depend on them.", { list: list.title, field: field.DisplayName || field.FieldName, targetList: target.title, targetListId });
      }
      const targetFields = fieldsByList.get(targetListId) || new Map();
      if (displayField && !targetFields.has(displayField)) {
        issue(report, report.mode === "generator" ? "error" : "warning", "LOOKUP_DISPLAY_FIELD_NOT_FOUND", "Lookup display field does not resolve in target list.", { list: list.title, field: field.DisplayName || field.FieldName, targetListId, displayField });
      }
      const sourceRecords = list.item && list.item.ListDatas && isObject(list.item.ListDatas) ? list.item.ListDatas : {};
      for (const [recordId, record] of Object.entries(sourceRecords)) {
        if (!isObject(record)) continue;
        const value = record[field.FieldName] !== undefined ? record[field.FieldName] : record[field.InternalName];
        for (const lookupId of lookupSampleValues(value, rules.multiple === true || rules.multiple === "true")) {
          if (!targetRecordIds.has(lookupId)) {
            issue(report, report.mode === "generator" ? "error" : "warning", "SAMPLE_LOOKUP_TARGET_RECORD_NOT_FOUND", "Lookup sample value does not reference a valid target row in the included master/reference list.", {
              list: list.title,
              field: field.DisplayName || field.FieldName,
              recordId,
              value: lookupId,
              targetList: target.title,
              targetListId,
            });
          }
        }
      }
    }
  }
}

function validateSensitiveResources(data, report) {
  for (const list of [data && data.Item, ...asArray(data && data.Childs)].filter(Boolean)) {
    const title = safeString(list.ListModel && list.ListModel.Title);
    if (SECRET_KEY_RE.test(title)) issue(report, "dependency", "TOKEN_OR_CREDENTIAL_LIST", "Token/credential-like list detected. Values are not included in the report.", { title });
    for (const field of asArray(list.Defs)) {
      const label = `${field.DisplayName || ""} ${field.InternalName || ""} ${field.FieldName || ""}`;
      if (SECRET_KEY_RE.test(label)) issue(report, "dependency", "TOKEN_OR_CREDENTIAL_FIELD", "Token/credential-like field detected. Values are not included in the report.", { list: title, field: field.DisplayName || field.InternalName || field.FieldName });
    }
  }
  asArray(data && data.OtherModules).forEach((module) => {
    const type = safeString(module.Type || module.type || "unknown");
    if (/connection/i.test(type)) issue(report, "dependency", "CONNECTION_MODULE_PRESENT", "Connection module present; treat as sensitive external dependency.", { type });
    if (/agent/i.test(type)) issue(report, "dependency", "AI_AGENT_MODULE_PRESENT", "AI Agent module present; validate agent dependencies before generated package use.", { type });
    if (/knowledge/i.test(type)) issue(report, "dependency", "KNOWLEDGE_MODULE_PRESENT", "Knowledge module present; validate knowledge/copilot dependencies before generated package use.", { type });
  });
}

function validateDesignSystemColorUsage(root, report) {
  if (report.mode !== "generator") return;
  const literalHits = [];
  const arbitraryHits = [];
  walk(root, (node, pointer) => {
    if (typeof node !== "string") return;
    for (const match of node.matchAll(HEX_COLOR_RE)) {
      const color = match[0].toLowerCase();
      const token = ROOT_STYLE_TOKEN_HEX.get(color);
      const hit = { color: match[0], path: pointer, token: token || null };
      if (token) literalHits.push(hit);
      else arbitraryHits.push(hit);
    }
  });
  if (literalHits.length) {
    issue(report, "warning", "DESIGN_SYSTEM_RESOLVED_TOKEN_COLOR", "Generated UI contains literal hex colors that match known Yeeflow root tokens. Prefer token references where the target schema supports them, but do not fail exports that store resolved values.", {
      count: literalHits.length,
      examples: literalHits.slice(0, 8),
    });
  }
  if (arbitraryHits.length > 12) {
    issue(report, "warning", "DESIGN_SYSTEM_ARBITRARY_COLOR_USAGE", "Generated UI contains many hard-coded hex colors. Prefer semantic Yeeflow root tokens for primary, success, warning, danger, neutral, background, and text colors where supported.", {
      count: arbitraryHits.length,
      examples: arbitraryHits.slice(0, 8),
    });
  }
}

function validatePlaceholders(root, report) {
  const placeholders = [];
  walk(root, (node, pointer) => {
    if (typeof node === "string" && PLACEHOLDER_RE.test(node)) placeholders.push({ placeholder: node, path: pointer });
  });
  for (const entry of placeholders) {
    issue(report, report.mode === "generator" && report.stage === "final" ? "error" : "warning", "UNRESOLVED_PLACEHOLDER", "Unresolved placeholder found.", entry);
  }
}

function finish(report) {
  delete report._largeNumbers;
  delete report._controlFieldSchemas;
  if (report.errors.length) report.status = "fail";
  else if (report.warnings.length || report.dependencies.length) report.status = "pass_with_warnings";
  else report.status = "pass";
  return report;
}

function main() {
  const args = parseArgs(process.argv);
  const report = validate(args.input, args.mode, args.stage);
  console.log(JSON.stringify(report, null, 2));
  if (report.status === "fail") process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({
    status: "fail",
    mode: null,
    stage: null,
    errors: [{ code: "VALIDATOR_RUNTIME_ERROR", message: error.message }],
    warnings: [],
    dependencies: [],
  }, null, 2));
  process.exit(1);
}
