const fs = require("fs");
const path = require("path");
const { validateExpressionTokens } = require("./yeeflow-expression-utils");

const DEFAULT_REFERENCE_PATH = path.join(__dirname, "workflow-action-configurations.normalized.json");
const SECRET_KEY_RE = /(token|secret|password|credential|clientsecret|api[_-]?key|accesskey|authorization|bearer|pwd)/i;
const UNSAFE_ACTION_RE = /^(AI|AzureOpenAI|Connector|HttpRequest|AcrobatSign|DocuSign|PandaDoc)$/i;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const REQUIRED_PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;

let cachedReference = null;

function loadWorkflowActionReference(referencePath = DEFAULT_REFERENCE_PATH) {
  if (cachedReference && cachedReference.__path === referencePath) return cachedReference;
  const parsed = JSON.parse(fs.readFileSync(referencePath, "utf8"));
  Object.defineProperty(parsed, "__path", { value: referencePath, enumerable: false });
  cachedReference = parsed;
  return parsed;
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

function shapeType(shape) {
  return shape && shape.stencil && (shape.stencil.id || shape.stencil) || shape && shape.type || "unknown";
}

function shapeId(shape) {
  return safeString(shape && (shape.resourceid || shape.resourceId || shape.id));
}

function getByPath(root, dottedPath) {
  const parts = safeString(dottedPath).split(".").filter(Boolean);
  let current = root;
  for (const part of parts) {
    if (!isObject(current) && !Array.isArray(current)) return { exists: false, value: undefined };
    if (!Object.prototype.hasOwnProperty.call(current, part)) return { exists: false, value: undefined };
    current = current[part];
  }
  return { exists: true, value: current };
}

function valueMissing(value) {
  return value === undefined || value === null || value === "";
}

function valueMatchesType(value, valueType) {
  if (valueMissing(value)) return true;
  if (valueType === "enum") return true;
  if (valueType === "array") return Array.isArray(value);
  if (valueType === "object") return isObject(value);
  if (valueType === "boolean") return typeof value === "boolean";
  if (valueType === "number") return typeof value === "number" || (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value)));
  if (valueType === "string") return typeof value === "string";
  return true;
}

function issue(issues, level, code, message, detail) {
  issues.push({ level, code, message, ...redact(detail || {}) });
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!isObject(value)) return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    out[key] = SECRET_KEY_RE.test(key) ? "__REDACTED__" : redact(child);
  }
  return out;
}

function strictLevel(options, compatibilityLevel = "warning") {
  if (options.mode === "generator" && options.stage === "final") return "error";
  if (options.mode === "final") return "error";
  return compatibilityLevel;
}

function validateWorkflowActionShapes(shapes, options = {}) {
  const reference = options.reference || loadWorkflowActionReference(options.referencePath);
  const issues = [];
  const summary = {
    checkedNodes: 0,
    supportedNodes: 0,
    unsupportedNodes: 0,
    partialNodes: 0,
    unsafeNodes: 0,
  };

  asArray(shapes).forEach((shape, index) => {
    if (!shape) return;
    const type = shapeType(shape);
    const action = reference.actions && reference.actions[type];
    const pointer = options.pointerForIndex ? options.pointerForIndex(index, shape) : `$.childshapes[${index}]`;
    summary.checkedNodes += 1;
    if (!action) {
      summary.unsupportedNodes += 1;
      issue(issues, strictLevel(options, "warning"), "WORKFLOW_ACTION_UNSUPPORTED", "Workflow node type is not present in the normalized action configuration reference.", {
        path: pointer,
        nodeType: type,
        nodeId: shapeId(shape),
      });
      return;
    }
    summary.supportedNodes += 1;
    if (action.risk !== "standard") summary.partialNodes += 1;
    if (action.risk === "external_or_credential_sensitive" || UNSAFE_ACTION_RE.test(type)) summary.unsafeNodes += 1;
    validateConfiguredProperties(issues, action, shape, type, pointer, options);
    validateKnownConditionalShapes(issues, action, shape, type, pointer, options);
  });

  return { issues, summary };
}

function validateConfiguredProperties(issues, action, shape, type, pointer, options) {
  const severity = strictLevel(options, "warning");
  for (const prop of action.properties || []) {
    const found = getByPath(shape, prop.path);
    const propPath = `${pointer}.${prop.path}`;
    if (prop.required && valueMissing(found.value)) {
      issue(issues, severity, "WORKFLOW_ACTION_REQUIRED_PROPERTY_MISSING", "Workflow node is missing a required property from the action configuration reference.", {
        path: propPath,
        nodeType: type,
        nodeId: shapeId(shape),
        property: prop.path,
      });
      continue;
    }
    if (!found.exists || valueMissing(found.value)) continue;
    if (!valueMatchesType(found.value, prop.valueType)) {
      issue(issues, severity, "WORKFLOW_ACTION_PROPERTY_TYPE_INVALID", "Workflow node property has an invalid value type for the action configuration reference.", {
        path: propPath,
        nodeType: type,
        nodeId: shapeId(shape),
        property: prop.path,
        expectedType: prop.valueType,
        actualType: Array.isArray(found.value) ? "array" : typeof found.value,
      });
    }
    if (prop.valueType === "enum" && prop.enumValues && prop.enumValues.length) {
      const allowed = new Set(prop.enumValues.map((entry) => safeString(entry.value)));
      if (!allowed.has(safeString(found.value))) {
        issue(issues, severity, "WORKFLOW_ACTION_ENUM_INVALID", "Workflow node property uses a value outside the action configuration enum.", {
          path: propPath,
          nodeType: type,
          nodeId: shapeId(shape),
          property: prop.path,
          value: safeString(found.value),
          allowed: [...allowed],
        });
      }
    }
  }
}

function validateKnownConditionalShapes(issues, action, shape, type, pointer, options) {
  if (UNSAFE_ACTION_RE.test(type) || action.risk === "external_or_credential_sensitive") {
    validateUnsafeAction(issues, shape, type, pointer, options);
  }
  if (type === "MultiAssignmentTask") validateMultiAssignmentTaskAssignees(issues, shape, pointer, options);
  if (type === "CandidateTask") validateCandidateTaskReceivers(issues, shape, pointer, options);
  if (type === "SetVariableTask") validateSetVariableTask(issues, shape, pointer, options);
  if (type === "StartNoneEvent") validateStartActionSettings(issues, shape, pointer, options);
  if (type === "SignalEvent") validateSignalEvent(issues, shape, pointer, options);
  if (type === "MailTask") validateMailTask(issues, shape, pointer, options);
  if (type === "AI") validateAiAction(issues, shape, pointer, options);
  if (type === "ContentList") validateContentList(issues, shape, pointer, options);
  if (type === "QueryData") validateQueryData(issues, shape, pointer, options);
  if (type === "SequenceFlow") validateSequenceFlow(issues, shape, pointer, options);
  if (type === "Delay") validateDelay(issues, shape, pointer, options);
  if (type === "Loop") validateLoop(issues, shape, pointer, options);
}

const ASSIGNMENT_TASK_ASSIGNEE_METHODS = new Set([
  "direct",
  "users",
  "expression",
  "position",
  "positionorg",
  "positionorgexpr",
  "positionloc",
  "positionlocexpr",
]);

const ASSIGNMENT_TASK_APPROVEWAYS = new Set([
  "allapprove",
  "anyprocess",
  "anyapprove",
  "anyreject",
  "custompercentage",
]);

const ASSIGNMENT_TASK_TASKTYPES = new Set(["complete"]);
const ASSIGNMENT_TASK_DUE_DATE_TYPES = new Set(["hour", "day", "minute", "express"]);
const ASSIGNMENT_TASK_NOTIFY_RELATIVES = new Set(["-1", "0", "1"]);
const ASSIGNMENT_TASK_NOTIFY_UNITS = new Set(["day", "hour", "minute"]);
const ASSIGNMENT_TASK_LIST_FIELD_RE = /listitem|List field|____customListFields/i;
const CLAIM_TASK_TASKTYPES = new Set(["approve", "complete"]);
const SET_VARIABLE_FORMTYPES = new Set(["current", "custom"]);
const SET_VARIABLE_TYPES = new Set(["text", "number", "date", "user", "boolean"]);
const CONTENTLIST_LISTTYPES = new Set(["current", "select"]);
const CONTENTLIST_OPERATION_TYPES = new Set(["add", "edit", "remove"]);
const CONTENTLIST_NUMERIC_OPERATION_CODES = new Set(["0", "1", "2", "3", "4"]);
const SIGNAL_EVENT_DEFINITIONS = new Set(["CancelEventDefinition", "RevokeEventDefinition"]);

function validateMultiAssignmentTaskAssignees(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const assignments = props.usertaskassignment;
  const severity = strictLevel(options, "warning");
  validateTaskFormReferenceAliases(issues, shape, pointer, options, "ASSIGNMENT_TASK", "Assignment task");
  if (props.tasktype !== undefined && !ASSIGNMENT_TASK_TASKTYPES.has(safeString(props.tasktype))) {
    issue(issues, severity, "ASSIGNMENT_TASK_TASKTYPE_UNKNOWN", "Assignment task tasktype is not in the export-proven task-type list. Absence of tasktype is treated as approval/default in studied exports.", {
      path: `${pointer}.properties.tasktype`,
      nodeId: shapeId(shape),
      tasktype: safeString(props.tasktype),
      allowedWhenPresent: [...ASSIGNMENT_TASK_TASKTYPES],
    });
  }
  if (props.approveway !== undefined && !ASSIGNMENT_TASK_APPROVEWAYS.has(safeString(props.approveway))) {
    issue(issues, severity, "ASSIGNMENT_TASK_APPROVEWAY_UNKNOWN", "Assignment task approveway is not in the export-proven completion-mode list.", {
      path: `${pointer}.properties.approveway`,
      nodeId: shapeId(shape),
      approveway: safeString(props.approveway),
      allowed: [...ASSIGNMENT_TASK_APPROVEWAYS],
    });
  }
  if (safeString(props.approveway) === "custompercentage" && typeof props.approvepercentage !== "number") {
    issue(issues, severity, "ASSIGNMENT_TASK_APPROVE_PERCENTAGE_INVALID", "Assignment task custom percentage completion should include numeric approvepercentage.", {
      path: `${pointer}.properties.approvepercentage`,
      nodeId: shapeId(shape),
      approveway: safeString(props.approveway),
    });
  }
  if (props.issequential !== undefined && typeof props.issequential !== "boolean") {
    issue(issues, severity, "ASSIGNMENT_TASK_APPOINTED_ORDER_INVALID", "Assignment task issequential should be boolean when present.", {
      path: `${pointer}.properties.issequential`,
      nodeId: shapeId(shape),
    });
  }
  validateAssignmentTaskDueDate(issues, props, pointer, severity);
  if (props.isenabledemail === true) {
    for (const field of ["to", "subject", "html"]) {
      if (valueMissing(props[field])) {
        issue(issues, severity, "ASSIGNMENT_TASK_EMAIL_NOTIFICATION_FIELD_MISSING", "Email-enabled assignment task should preserve notification recipient, subject, and body/html fields.", {
          path: `${pointer}.properties.${field}`,
          nodeId: shapeId(shape),
          field,
        });
      }
    }
  }
  validateAssignmentTaskNotifyRules(issues, props, pointer, severity);
  if (!Array.isArray(assignments)) {
    issue(issues, severity, "ASSIGNMENT_TASK_ASSIGNEE_CONFIG_MISSING", "Assignment task should store assignee configuration as properties.usertaskassignment array.", {
      path: `${pointer}.properties.usertaskassignment`,
      nodeId: shapeId(shape),
    });
    return;
  }
  if (!assignments.length) {
    issue(issues, severity, "ASSIGNMENT_TASK_ASSIGNEE_CONFIG_EMPTY", "Assignment task usertaskassignment array is empty.", {
      path: `${pointer}.properties.usertaskassignment`,
      nodeId: shapeId(shape),
    });
    return;
  }
  assignments.forEach((assignment, index) => {
    const itemPath = `${pointer}.properties.usertaskassignment[${index}]`;
    if (!isObject(assignment)) {
      issue(issues, severity, "ASSIGNMENT_TASK_ASSIGNEE_ENTRY_INVALID", "Assignment task assignee entries should be objects.", {
        path: itemPath,
        nodeId: shapeId(shape),
      });
      return;
    }
    const type = safeString(assignment.type);
    const method = safeString(assignment.method);
    if (!type) {
      issue(issues, severity, "ASSIGNMENT_TASK_ASSIGNEE_TYPE_MISSING", "Assignment task assignee entry should include type.", {
        path: `${itemPath}.type`,
        nodeId: shapeId(shape),
      });
    }
    if (!method) {
      issue(issues, severity, "ASSIGNMENT_TASK_ASSIGNEE_METHOD_MISSING", "Assignment task assignee entry should include method.", {
        path: `${itemPath}.method`,
        nodeId: shapeId(shape),
      });
      return;
    }
    if (!ASSIGNMENT_TASK_ASSIGNEE_METHODS.has(method)) {
      issue(issues, severity, "ASSIGNMENT_TASK_ASSIGNEE_METHOD_UNKNOWN", "Assignment task assignee method is not in the export-proven method list.", {
        path: `${itemPath}.method`,
        nodeId: shapeId(shape),
        assigneeType: type,
        method,
      });
    }
    if (type === "position" && valueMissing(assignment.position)) {
      issue(issues, severity, "ASSIGNMENT_TASK_POSITION_ID_MISSING", "Position-based assignment task assignee should include a position reference.", {
        path: `${itemPath}.position`,
        nodeId: shapeId(shape),
        method,
      });
    }
    if (type === "position" && !valueMissing(assignment.position) && REQUIRED_PLACEHOLDER_RE.test(safeString(assignment.position))) {
      issue(issues, severity, "ASSIGNMENT_TASK_POSITION_ID_INVALID", "Position assignment must not contain required-ID placeholders; use a real numeric tenant position ID or a post-import binding/fallback.", {
        path: `${itemPath}.position`,
        nodeId: shapeId(shape),
        method,
        value: safeString(assignment.position),
      });
    } else if (type === "position" && method === "position" && !valueMissing(assignment.position) && !/^\d+$/.test(safeString(assignment.position))) {
      issue(issues, severity, "ASSIGNMENT_TASK_POSITION_ID_INVALID", "Direct position assignment should use a numeric position ID; placeholders or labels can block workflow publish.", {
        path: `${itemPath}.position`,
        nodeId: shapeId(shape),
        method,
        value: safeString(assignment.position),
      });
    }
    if (["direct", "positionorg", "positionloc"].includes(method) && valueMissing(assignment.value)) {
      issue(issues, severity, "ASSIGNMENT_TASK_STATIC_REFERENCE_MISSING", "Static user, department, or location assignment should include a value reference.", {
        path: `${itemPath}.value`,
        nodeId: shapeId(shape),
        assigneeType: type,
        method,
      });
    }
    if (["expression", "positionorgexpr", "positionlocexpr"].includes(method)) {
      if (valueMissing(assignment.value)) {
        issue(issues, severity, "ASSIGNMENT_TASK_EXPRESSION_MISSING", "Expression-based assignment task assignee should include a rich expression value.", {
          path: `${itemPath}.value`,
          nodeId: shapeId(shape),
          assigneeType: type,
          method,
        });
      } else if (typeof assignment.value !== "string" || !assignment.value.includes("<input") || !assignment.value.includes("data=")) {
        issue(issues, severity, "ASSIGNMENT_TASK_EXPRESSION_OPAQUE", "Expression-based assignment task assignee value is not the export-proven expression-button shape.", {
          path: `${itemPath}.value`,
          nodeId: shapeId(shape),
          assigneeType: type,
          method,
        });
      }
    }
    if (typeof assignment.value === "string" && ASSIGNMENT_TASK_LIST_FIELD_RE.test(assignment.value)) {
      issue(issues, "warning", "ASSIGNMENT_TASK_LIST_FIELD_ASSIGNEE_RUNTIME_UNPROVEN", "Data-list workflow assignee expression references a list-item field value; preserve the expression-button shape and runtime-test with safe list records before claiming routing.", {
        path: itemPath,
        nodeId: shapeId(shape),
        method,
        fieldContext: assignment.value.includes("CreatedBy") ? "CreatedBy" : "listitem",
      });
    }
    if (type === "user" && method === "expression" && typeof assignment.value === "string" && assignment.value.includes("type&quot;:&quot;usergroup")) {
      issue(issues, "warning", "ASSIGNMENT_TASK_USER_GROUP_RUNTIME_UNPROVEN", "User group assignee shape is export-proven and can be API-category-assisted, but group expansion/routing still requires focused runtime proof.", {
        path: itemPath,
        nodeId: shapeId(shape),
      });
    }
    if (type === "user" && ["direct", "users"].includes(method)) {
      issue(issues, "warning", "ASSIGNMENT_TASK_DIRECT_USER_TENANT_SENSITIVE", "Direct user assignment is tenant-sensitive; use only with explicit authorized user mapping or safe read-only directory lookup, and do not commit private user data.", {
        path: itemPath,
        nodeId: shapeId(shape),
        method,
      });
    }
  });
}

function validateCandidateTaskReceivers(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const receivers = props.usertaskassignment;
  const severity = strictLevel(options, "warning");
  validateTaskFormReferenceAliases(issues, shape, pointer, options, "CLAIM_TASK", "Claim Task");
  if (Object.prototype.hasOwnProperty.call(props, "tasktype ")) {
    issue(issues, "warning", "CLAIM_TASK_TASKTYPE_TRAILING_SPACE_PRESENT", "Claim Task config reference mentions properties.tasktype with a trailing space, but studied exports use properties.tasktype. Preserve export field names and warn on trailing-space variants.", {
      path: `${pointer}.properties.tasktype `,
      nodeId: shapeId(shape),
    });
  }
  if (props.tasktype !== undefined && !CLAIM_TASK_TASKTYPES.has(safeString(props.tasktype))) {
    issue(issues, severity, "CLAIM_TASK_TASKTYPE_UNKNOWN", "Claim Task tasktype should be approve or complete when present in studied exports.", {
      path: `${pointer}.properties.tasktype`,
      nodeId: shapeId(shape),
      tasktype: safeString(props.tasktype),
      allowed: [...CLAIM_TASK_TASKTYPES],
    });
  }
  validateAssignmentTaskDueDate(issues, props, pointer, severity, "CLAIM_TASK");
  if (props.isenabledemail === true) {
    for (const field of ["to", "subject", "html"]) {
      if (valueMissing(props[field])) {
        issue(issues, severity, "CLAIM_TASK_EMAIL_NOTIFICATION_FIELD_MISSING", "Email-enabled Claim Task should preserve notification recipient, subject, and body/html fields.", {
          path: `${pointer}.properties.${field}`,
          nodeId: shapeId(shape),
          field,
        });
      }
    }
  }
  validateAssignmentTaskNotifyRules(issues, props, pointer, severity, "CLAIM_TASK");
  if (!Array.isArray(receivers)) {
    issue(issues, severity, "CLAIM_TASK_RECEIVER_CONFIG_MISSING", "Claim Task should store receiver/candidate configuration as properties.usertaskassignment array.", {
      path: `${pointer}.properties.usertaskassignment`,
      nodeId: shapeId(shape),
    });
    return;
  }
  if (!receivers.length) {
    issue(issues, severity, "CLAIM_TASK_RECEIVER_CONFIG_EMPTY", "Claim Task usertaskassignment receiver/candidate array is empty.", {
      path: `${pointer}.properties.usertaskassignment`,
      nodeId: shapeId(shape),
    });
    return;
  }
  receivers.forEach((receiver, index) => {
    const itemPath = `${pointer}.properties.usertaskassignment[${index}]`;
    if (!isObject(receiver)) {
      issue(issues, severity, "CLAIM_TASK_RECEIVER_ENTRY_INVALID", "Claim Task receiver/candidate entries should be objects.", {
        path: itemPath,
        nodeId: shapeId(shape),
      });
      return;
    }
    const type = safeString(receiver.type);
    const method = safeString(receiver.method);
    if (!type) {
      issue(issues, severity, "CLAIM_TASK_RECEIVER_TYPE_MISSING", "Claim Task receiver/candidate entry should include type.", {
        path: `${itemPath}.type`,
        nodeId: shapeId(shape),
      });
    }
    if (!method) {
      issue(issues, severity, "CLAIM_TASK_RECEIVER_METHOD_MISSING", "Claim Task receiver/candidate entry should include method.", {
        path: `${itemPath}.method`,
        nodeId: shapeId(shape),
      });
      return;
    }
    if (!ASSIGNMENT_TASK_ASSIGNEE_METHODS.has(method)) {
      issue(issues, severity, "CLAIM_TASK_RECEIVER_METHOD_UNKNOWN", "Claim Task receiver/candidate method is not in the export/config-reference-backed method list.", {
        path: `${itemPath}.method`,
        nodeId: shapeId(shape),
        receiverType: type,
        method,
      });
    }
    if (type === "position" && valueMissing(receiver.position)) {
      issue(issues, severity, "CLAIM_TASK_POSITION_ID_MISSING", "Position-based Claim Task receiver should include a position reference.", {
        path: `${itemPath}.position`,
        nodeId: shapeId(shape),
        method,
      });
    }
    if (type === "position" && !valueMissing(receiver.position) && REQUIRED_PLACEHOLDER_RE.test(safeString(receiver.position))) {
      issue(issues, severity, "CLAIM_TASK_POSITION_ID_INVALID", "Position-based Claim Task receiver must not contain required-ID placeholders; use a real numeric tenant position ID or a post-import binding/fallback.", {
        path: `${itemPath}.position`,
        nodeId: shapeId(shape),
        method,
        value: safeString(receiver.position),
      });
    }
    if (["direct", "positionorg", "positionloc"].includes(method) && valueMissing(receiver.value)) {
      issue(issues, severity, "CLAIM_TASK_STATIC_REFERENCE_MISSING", "Static Claim Task receiver references should include a value.", {
        path: `${itemPath}.value`,
        nodeId: shapeId(shape),
        receiverType: type,
        method,
      });
    }
    if (["expression", "positionorgexpr", "positionlocexpr"].includes(method)) {
      if (valueMissing(receiver.value)) {
        issue(issues, severity, "CLAIM_TASK_EXPRESSION_MISSING", "Expression-based Claim Task receiver should include a rich expression value.", {
          path: `${itemPath}.value`,
          nodeId: shapeId(shape),
          receiverType: type,
          method,
        });
      } else if (typeof receiver.value !== "string" || !receiver.value.includes("<input") || !receiver.value.includes("data=")) {
        issue(issues, severity, "CLAIM_TASK_EXPRESSION_OPAQUE", "Expression-based Claim Task receiver value is not the export-proven expression-button shape.", {
          path: `${itemPath}.value`,
          nodeId: shapeId(shape),
          receiverType: type,
          method,
        });
      }
    }
    if (typeof receiver.value === "string" && ASSIGNMENT_TASK_LIST_FIELD_RE.test(receiver.value)) {
      issue(issues, "warning", "CLAIM_TASK_LIST_FIELD_RECEIVER_RUNTIME_UNPROVEN", "Data-list Claim Task receiver expression references a list-item field value; preserve the expression shape and runtime-test with safe list records before claiming claim-routing behavior.", {
        path: itemPath,
        nodeId: shapeId(shape),
        method,
        fieldContext: receiver.value.includes("CreatedBy") ? "CreatedBy" : "listitem",
      });
    }
    if (type === "user" && method === "expression" && typeof receiver.value === "string" && receiver.value.includes("type&quot;:&quot;usergroup")) {
      issue(issues, "warning", "CLAIM_TASK_USER_GROUP_RUNTIME_UNPROVEN", "User group receiver shape is export-proven/config-reference-backed, but claim pool expansion and ownership behavior require focused runtime proof.", {
        path: itemPath,
        nodeId: shapeId(shape),
      });
    }
    if (type === "user" && ["direct", "users"].includes(method)) {
      issue(issues, "warning", "CLAIM_TASK_DIRECT_USER_TENANT_SENSITIVE", "Direct user receiver config is tenant-sensitive; use only with explicit authorized mapping or read-only directory lookup, and do not commit private user data.", {
        path: itemPath,
        nodeId: shapeId(shape),
        method,
      });
    }
  });
}

function validateTaskFormReferenceAliases(issues, shape, pointer, options, codePrefix, label) {
  const props = shape.properties || {};
  const severity = strictLevel(options, "warning");
  const aliases = ["taskurl", "taskUrl", "TaskUrl"].map((key) => ({ key, value: safeString(props[key]) }));
  const first = aliases.find((entry) => entry.value);
  if (!first) {
    issue(issues, severity, `${codePrefix}_TASKURL_MISSING`, `${label} must reference a task form/page; missing or null TaskUrl blocks generated approval workflow publish readiness.`, {
      path: `${pointer}.properties.taskurl`,
      nodeId: shapeId(shape),
    });
  } else if (aliases.some((entry) => entry.value !== first.value)) {
    issue(issues, severity, `${codePrefix}_TASKURL_ALIASES_NOT_MIRRORED`, `${label} task form references should be mirrored across properties.taskurl, properties.taskUrl, and properties.TaskUrl.`, {
      path: `${pointer}.properties.taskurl`,
      nodeId: shapeId(shape),
      taskurl: props.taskurl || null,
      taskUrl: props.taskUrl || null,
      TaskUrl: props.TaskUrl || null,
    });
  }
  if (props.pagetype !== 1) {
    issue(issues, severity, `${codePrefix}_PAGETYPE_INVALID`, `${label} workflow nodes should carry properties.pagetype = 1 for task-form publish readiness.`, {
      path: `${pointer}.properties.pagetype`,
      nodeId: shapeId(shape),
      pagetype: props.pagetype,
    });
  }
}

function validateAssignmentTaskDueDate(issues, props, pointer, severity, codePrefix = "ASSIGNMENT_TASK") {
  if (props.duedatedefinition !== undefined && !valueMatchesType(props.duedatedefinition, "number")) {
    issue(issues, severity, `${codePrefix}_DUE_DATE_VALUE_INVALID`, "Workflow task due date definition should be numeric when present.", {
      path: `${pointer}.properties.duedatedefinition`,
    });
  }
  if (props.duedatetype !== undefined && !ASSIGNMENT_TASK_DUE_DATE_TYPES.has(safeString(props.duedatetype))) {
    issue(issues, severity, `${codePrefix}_DUE_DATE_TYPE_UNKNOWN`, "Workflow task due date type is not in the product-documented/export-studied due date unit list.", {
      path: `${pointer}.properties.duedatetype`,
      duedatetype: safeString(props.duedatetype),
      allowed: [...ASSIGNMENT_TASK_DUE_DATE_TYPES],
    });
  }
  if (safeString(props.duedatetype) === "express" && valueMissing(props.duedateexpress)) {
    issue(issues, severity, `${codePrefix}_DUE_DATE_EXPRESSION_MISSING`, "Expression-based due date should preserve properties.duedateexpress.", {
      path: `${pointer}.properties.duedateexpress`,
    });
  }
  if (props.duedateexpress !== undefined && (typeof props.duedateexpress !== "string" || !props.duedateexpress.includes("<input"))) {
    issue(issues, severity, `${codePrefix}_DUE_DATE_EXPRESSION_OPAQUE`, "Workflow task due date expression is not the export-proven expression-button shape.", {
      path: `${pointer}.properties.duedateexpress`,
    });
  }
  if (props.isfromworkcalendar !== undefined && typeof props.isfromworkcalendar !== "boolean") {
    issue(issues, severity, `${codePrefix}_WORK_CALENDAR_FLAG_INVALID`, "Workflow task working-calendar due-date flag should be boolean when present.", {
      path: `${pointer}.properties.isfromworkcalendar`,
    });
  }
}

function validateAssignmentTaskNotifyRules(issues, props, pointer, severity, codePrefix = "ASSIGNMENT_TASK") {
  if (props.notifyrules === undefined) return;
  if (!Array.isArray(props.notifyrules)) {
    issue(issues, severity, `${codePrefix}_NOTIFY_RULES_INVALID`, "Workflow task due-date notification rules should be stored as an array when present.", {
      path: `${pointer}.properties.notifyrules`,
    });
    return;
  }
  props.notifyrules.forEach((rule, index) => {
    const rulePath = `${pointer}.properties.notifyrules[${index}]`;
    if (!isObject(rule)) {
      issue(issues, severity, `${codePrefix}_NOTIFY_RULE_INVALID`, "Workflow task due-date notification rule should be an object.", {
        path: rulePath,
      });
      return;
    }
    if (safeString(rule.actiontype) && safeString(rule.actiontype) !== "1") {
      issue(issues, "warning", `${codePrefix}_NOTIFY_ACTIONTYPE_UNSTUDIED`, "Workflow task due-date action type is not the reminder actiontype export-studied here.", {
        path: `${rulePath}.actiontype`,
        actiontype: safeString(rule.actiontype),
      });
    }
    const actiondate = rule.actiondate;
    if (!isObject(actiondate)) {
      issue(issues, severity, `${codePrefix}_NOTIFY_ACTIONDATE_MISSING`, "Workflow task due-date notification rule should include actiondate.", {
        path: `${rulePath}.actiondate`,
      });
      return;
    }
    const relative = safeString(actiondate.relative);
    if (!ASSIGNMENT_TASK_NOTIFY_RELATIVES.has(relative)) {
      issue(issues, severity, `${codePrefix}_NOTIFY_RELATIVE_UNKNOWN`, "Workflow task due-date notification relative timing is not export-proven.", {
        path: `${rulePath}.actiondate.relative`,
        relative,
      });
    }
    if (relative !== "0") {
      if (valueMissing(actiondate.value) || !valueMatchesType(actiondate.value, "number")) {
        issue(issues, severity, `${codePrefix}_NOTIFY_OFFSET_VALUE_INVALID`, "Before/after due-date notification rules should include a numeric offset value.", {
          path: `${rulePath}.actiondate.value`,
        });
      }
      if (!ASSIGNMENT_TASK_NOTIFY_UNITS.has(safeString(actiondate.type))) {
        issue(issues, severity, `${codePrefix}_NOTIFY_OFFSET_UNIT_UNKNOWN`, "Before/after due-date notification rules should use a studied time unit.", {
          path: `${rulePath}.actiondate.type`,
          type: safeString(actiondate.type),
          allowed: [...ASSIGNMENT_TASK_NOTIFY_UNITS],
        });
      }
    }
    for (const field of ["subject", "content"]) {
      if (valueMissing(rule[field])) {
        issue(issues, severity, `${codePrefix}_NOTIFY_CONTENT_FIELD_MISSING`, "Reminder notification rules should preserve subject and content fields.", {
          path: `${rulePath}.${field}`,
          field,
        });
      }
    }
  });
}

function validateSetVariableTask(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const severity = strictLevel(options, "warning");
  const formtype = safeString(props.formtype);
  if (!SET_VARIABLE_FORMTYPES.has(formtype)) {
    issue(issues, severity, "SET_VARIABLE_FORMTYPE_UNKNOWN", "Set variable formtype should be current or custom in the studied exports.", {
      path: `${pointer}.properties.formtype`,
      nodeId: shapeId(shape),
      formtype,
      allowed: [...SET_VARIABLE_FORMTYPES],
    });
  }
  if (formtype === "custom") {
    const data = props.data;
    if (!isObject(data)) {
      issue(issues, severity, "SET_VARIABLE_CUSTOM_TARGET_DATA_MISSING", "Another-workflow Set variable should include target approval workflow metadata in properties.data.", {
        path: `${pointer}.properties.data`,
        nodeId: shapeId(shape),
      });
    } else {
      for (const key of ["AppID", "ListSetID", "ProcKey"]) {
        if (valueMissing(data[key])) {
          issue(issues, severity, "SET_VARIABLE_CUSTOM_TARGET_FIELD_MISSING", "Another-workflow Set variable target metadata should include AppID, ListSetID, and ProcKey.", {
            path: `${pointer}.properties.data.${key}`,
            nodeId: shapeId(shape),
            field: key,
          });
        }
      }
    }
    if (valueMissing(props.formids)) {
      issue(issues, severity, "SET_VARIABLE_CUSTOM_FORMIDS_MISSING", "Another-workflow Set variable should include formids for the target submitted approval request/workflow instance.", {
        path: `${pointer}.properties.formids`,
        nodeId: shapeId(shape),
      });
    }
  }
  if (formtype === "current" && props.data !== undefined && props.data !== null) {
    issue(issues, "warning", "SET_VARIABLE_CURRENT_TARGET_DATA_PRESENT", "Current-workflow Set variable normally does not need target workflow metadata; preserve only if export-backed for the package.", {
      path: `${pointer}.properties.data`,
      nodeId: shapeId(shape),
    });
  }
  const settings = props.variablesetting;
  if (!Array.isArray(settings)) {
    issue(issues, severity, "SET_VARIABLE_VARIABLESETTING_INVALID", "Set variable should store assignments as properties.variablesetting array.", {
      path: `${pointer}.properties.variablesetting`,
      nodeId: shapeId(shape),
    });
    return;
  }
  if (!settings.length) {
    issue(issues, severity, "SET_VARIABLE_VARIABLESETTING_EMPTY", "Set variable variablesetting array should contain at least one variable assignment.", {
      path: `${pointer}.properties.variablesetting`,
      nodeId: shapeId(shape),
    });
    return;
  }
  settings.forEach((setting, index) => {
    const itemPath = `${pointer}.properties.variablesetting[${index}]`;
    if (!isObject(setting)) {
      issue(issues, severity, "SET_VARIABLE_ASSIGNMENT_INVALID", "Set variable assignment entries should be objects.", {
        path: itemPath,
        nodeId: shapeId(shape),
      });
      return;
    }
    for (const field of ["idx", "id", "name", "type", "value"]) {
      if (valueMissing(setting[field])) {
        issue(issues, severity, "SET_VARIABLE_ASSIGNMENT_FIELD_MISSING", "Set variable assignment should include idx, id, name, type, and value.", {
          path: `${itemPath}.${field}`,
          nodeId: shapeId(shape),
          field,
        });
      }
    }
    if (setting.type !== undefined && !SET_VARIABLE_TYPES.has(safeString(setting.type))) {
      issue(issues, "warning", "SET_VARIABLE_TYPE_UNSTUDIED", "Set variable assignment type is not in the export-studied variable type set.", {
        path: `${itemPath}.type`,
        nodeId: shapeId(shape),
        type: safeString(setting.type),
        studied: [...SET_VARIABLE_TYPES],
      });
    }
    if (setting.value !== undefined) {
      if (!Array.isArray(setting.value)) {
        issue(issues, severity, "SET_VARIABLE_VALUE_EXPRESSION_NOT_ARRAY", "Set variable assignment value should be an expression-token array.", {
          path: `${itemPath}.value`,
          nodeId: shapeId(shape),
        });
      } else {
        const result = validateExpressionTokens(setting.value, { path: `${itemPath}.value` });
        for (const exprIssue of result.issues || []) {
          if (exprIssue.code === "EXPRESSION_TOKEN_UNKNOWN_SHAPE" && exprIssue.detail && exprIssue.detail.exprType === "list_field") continue;
          const level = exprIssue.level === "error" ? severity : "warning";
          issue(issues, level, `SET_VARIABLE_${exprIssue.code}`, "Set variable assignment value expression did not fully match the expression reference.", {
            path: exprIssue.path,
            nodeId: shapeId(shape),
            detail: exprIssue.detail,
          });
        }
        const text = JSON.stringify(setting.value);
        if (text.includes("\"exprType\":\"list_field\"")) {
          issue(issues, "warning", "SET_VARIABLE_LIST_FIELD_VALUE_RUNTIME_UNPROVEN", "Set variable value uses a data-list field expression. Preserve this right-side expression shape and runtime-test before claiming variable mutation.", {
            path: `${itemPath}.value`,
            nodeId: shapeId(shape),
          });
        }
      }
    }
  });
}

function validateStartActionSettings(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const severity = strictLevel(options, "warning");
  if (asArray(shape.incoming).length > 0) {
    issue(issues, severity, "START_ACTION_INCOMING_FLOW_PRESENT", "Start action should not have incoming sequence flows.", {
      path: `${pointer}.incoming`,
      nodeId: shapeId(shape),
    });
  }
  if (asArray(shape.outgoing).length === 0) {
    issue(issues, severity, "START_ACTION_OUTGOING_FLOW_MISSING", "Start action should have at least one outgoing sequence flow.", {
      path: `${pointer}.outgoing`,
      nodeId: shapeId(shape),
    });
  }
  if (props.terminate !== undefined && typeof props.terminate !== "boolean") {
    issue(issues, severity, "START_ACTION_ALLOW_TERMINATE_INVALID", "Start action terminate setting should be boolean when present.", {
      path: `${pointer}.properties.terminate`,
      nodeId: shapeId(shape),
    });
  }
  for (const field of ["terminate-conditions", "revoke-conditions"]) {
    if (props[field] !== undefined && props[field] !== null && !Array.isArray(props[field])) {
      issue(issues, severity, "START_ACTION_CONDITIONS_INVALID", "Start action condition settings should be null or an array when present.", {
        path: `${pointer}.properties.${field}`,
        nodeId: shapeId(shape),
        field,
      });
    }
    validateConditionArray(issues, props[field], `${pointer}.properties.${field}`, "START_ACTION_CONDITION_ROW_INVALID", severity);
  }
  if (props.isenabledemail === true) {
    for (const field of ["to", "subject", "html"]) {
      if (valueMissing(props[field])) {
        issue(issues, severity, "START_ACTION_EMAIL_FIELD_MISSING", "Email-enabled Start action should preserve recipient, subject, and body/html fields.", {
          path: `${pointer}.properties.${field}`,
          nodeId: shapeId(shape),
          field,
        });
      }
    }
  }
}

function validateSignalEvent(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const severity = strictLevel(options, "warning");
  if (asArray(shape.incoming).length > 0) {
    issue(issues, severity, "SIGNAL_EVENT_INCOMING_FLOW_PRESENT", "Signal event is an event source and should not have incoming sequence flows in the studied export.", {
      path: `${pointer}.incoming`,
      nodeId: shapeId(shape),
    });
  }
  if (asArray(shape.outgoing).length === 0) {
    issue(issues, severity, "SIGNAL_EVENT_OUTGOING_FLOW_MISSING", "Signal event should have at least one outgoing sequence flow to a compensation or follow-up branch.", {
      path: `${pointer}.outgoing`,
      nodeId: shapeId(shape),
    });
  }
  if (!Array.isArray(props.eventdefinitions)) {
    issue(issues, severity, "SIGNAL_EVENT_DEFINITIONS_INVALID", "Signal event should store trigger events as properties.eventdefinitions array.", {
      path: `${pointer}.properties.eventdefinitions`,
      nodeId: shapeId(shape),
    });
    return;
  }
  if (!props.eventdefinitions.length) {
    issue(issues, severity, "SIGNAL_EVENT_DEFINITIONS_EMPTY", "Signal event should listen for at least one configured event definition.", {
      path: `${pointer}.properties.eventdefinitions`,
      nodeId: shapeId(shape),
    });
  }
  props.eventdefinitions.forEach((definition, index) => {
    if (!SIGNAL_EVENT_DEFINITIONS.has(safeString(definition))) {
      issue(issues, "warning", "SIGNAL_EVENT_DEFINITION_UNKNOWN", "Signal event uses an event definition outside the export/config-reference-backed set.", {
        path: `${pointer}.properties.eventdefinitions[${index}]`,
        nodeId: shapeId(shape),
        definition: safeString(definition),
        allowed: [...SIGNAL_EVENT_DEFINITIONS],
      });
    }
  });
}

function validateMailTask(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const severity = strictLevel(options, "warning");
  if (valueMissing(props.to)) {
    issue(issues, severity, "MAILTASK_RECIPIENT_MISSING", "Send email action should include a recipient expression or test recipient before runtime execution.", {
      path: `${pointer}.properties.to`,
      nodeId: shapeId(shape),
    });
  } else if (typeof props.to === "string" && EMAIL_RE.test(props.to) && !/example\.com|test/i.test(props.to)) {
    issue(issues, "dependency", "MAILTASK_FIXED_EMAIL_RECIPIENT_RUNTIME_RISK", "Send email action contains a fixed email recipient; redact in docs and do not execute generated/runtime tests unless the recipient is explicitly safe.", {
      path: `${pointer}.properties.to`,
      nodeId: shapeId(shape),
      recipientPattern: "<REDACTED_EMAIL>",
    });
  }
  if (valueMissing(props.subject)) {
    issue(issues, severity, "MAILTASK_SUBJECT_MISSING", "Send email action should include a subject literal or expression.", {
      path: `${pointer}.properties.subject`,
      nodeId: shapeId(shape),
    });
  }
  if (valueMissing(props.html)) {
    issue(issues, severity, "MAILTASK_BODY_MISSING", "Send email action should include body/html content.", {
      path: `${pointer}.properties.html`,
      nodeId: shapeId(shape),
    });
  }
}

function validateAiAction(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const severity = strictLevel(options, "warning");
  if (safeString(props.type) === "agent") {
    const agentId = props.data && props.data.AgentID;
    if (valueMissing(agentId)) {
      issue(issues, severity, "AI_ACTION_AGENT_ID_MISSING", "AI Assistant workflow action in agent mode should reference an AI Agent ID.", {
        path: `${pointer}.properties.data.AgentID`,
        nodeId: shapeId(shape),
      });
    }
  }
  if (!Array.isArray(props.inputVariables)) {
    issue(issues, severity, "AI_ACTION_INPUT_VARIABLES_INVALID", "AI Assistant workflow action should store inputVariables as an array.", {
      path: `${pointer}.properties.inputVariables`,
      nodeId: shapeId(shape),
    });
  }
  if (!Array.isArray(props.outputVariables)) {
    issue(issues, severity, "AI_ACTION_OUTPUT_VARIABLES_INVALID", "AI Assistant workflow action should store outputVariables as an array.", {
      path: `${pointer}.properties.outputVariables`,
      nodeId: shapeId(shape),
    });
  }
  if (Array.isArray(props.inputVariables)) {
    props.inputVariables.forEach((input, index) => {
      if (!isObject(input)) {
        issue(issues, severity, "AI_ACTION_INPUT_VARIABLE_INVALID", "AI Assistant workflow action inputVariables entries should be objects.", {
          path: `${pointer}.properties.inputVariables[${index}]`,
          nodeId: shapeId(shape),
        });
        return;
      }
      if (valueMissing(input.id)) {
        issue(issues, severity, "AI_ACTION_INPUT_VARIABLE_ID_MISSING", "AI Assistant workflow action input variable should include an id.", {
          path: `${pointer}.properties.inputVariables[${index}].id`,
          nodeId: shapeId(shape),
        });
      }
      if (valueMissing(input.type)) {
        issue(issues, severity, "AI_ACTION_INPUT_VARIABLE_TYPE_MISSING", "AI Assistant workflow action input variable should include a type.", {
          path: `${pointer}.properties.inputVariables[${index}].type`,
          nodeId: shapeId(shape),
        });
      }
      if (safeString(input.type) === "img") {
        const value = input.value;
        const expr = isObject(value) ? value.value : null;
        if (!isObject(value) || value.type === undefined) {
          issue(issues, severity, "AI_ACTION_IMAGE_INPUT_VALUE_MISSING", "AI Assistant workflow image input should include a structured value mapping.", {
            path: `${pointer}.properties.inputVariables[${index}].value`,
            nodeId: shapeId(shape),
          });
        } else if (isObject(expr) && safeString(expr.exprType) === "list_field") {
          const valueType = safeString(expr.valueType);
          if (valueType && !["icon-upload", "file-upload"].includes(valueType)) {
            issue(issues, "warning", "AI_ACTION_IMAGE_INPUT_VALUE_TYPE_UNSTUDIED", "AI Assistant workflow image input mapped from a list field usually uses valueType icon-upload or file-upload in the studied exports.", {
              path: `${pointer}.properties.inputVariables[${index}].value.value.valueType`,
              nodeId: shapeId(shape),
              valueType,
            });
          }
        }
      }
    });
  }
  if (Array.isArray(props.outputVariables)) {
    props.outputVariables.forEach((output, index) => {
      if (!isObject(output)) {
        issue(issues, severity, "AI_ACTION_OUTPUT_VARIABLE_INVALID", "AI Assistant workflow action outputVariables entries should be objects.", {
          path: `${pointer}.properties.outputVariables[${index}]`,
          nodeId: shapeId(shape),
        });
        return;
      }
      if (valueMissing(output.id)) {
        issue(issues, severity, "AI_ACTION_OUTPUT_VARIABLE_ID_MISSING", "AI Assistant workflow action output variable should include an id.", {
          path: `${pointer}.properties.outputVariables[${index}].id`,
          nodeId: shapeId(shape),
        });
      }
    });
  }
  if (isObject(props.context) && props.context.enabled === true && !isObject(props.context.selected)) {
    issue(issues, "warning", "AI_ACTION_CONTEXT_SELECTION_MISSING", "AI Assistant context enrichment is enabled but no selected context object is present.", {
      path: `${pointer}.properties.context.selected`,
      nodeId: shapeId(shape),
    });
  }
}

function validateUnsafeAction(issues, shape, type, pointer, options) {
  const level = type === "AI" ? "dependency" : strictLevel(options, "dependency");
  issue(issues, level, "WORKFLOW_ACTION_EXTERNAL_OR_CREDENTIAL_DEPENDENCY", "Workflow action depends on external services, connections, AI, HTTP, signing, or credentials and must not bundle sensitive values.", {
    path: pointer,
    nodeType: type,
    nodeId: shapeId(shape),
  });
  walk(shape.properties || {}, (value, childPath, key) => {
    if (!SECRET_KEY_RE.test(key || "") || valueMissing(value)) return;
    issue(issues, "error", "WORKFLOW_ACTION_SENSITIVE_VALUE_PRESENT", "Credential-like workflow action property is populated; generated packages must use safe placeholders or omit sensitive values.", {
      path: `${pointer}.properties${childPath}`,
      nodeType: type,
      nodeId: shapeId(shape),
      property: key,
    });
  });
}

function validateContentList(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const severity = strictLevel(options, "warning");
  const type = safeString(props.type);
  const listtype = safeString(props.listtype);
  if (!CONTENTLIST_LISTTYPES.has(listtype)) {
    issue(issues, severity, "CONTENTLIST_LISTTYPE_UNKNOWN", "Set data list / ContentList listtype should be current or select in the studied exports.", {
      path: `${pointer}.properties.listtype`,
      nodeType: "ContentList",
      nodeId: shapeId(shape),
      listtype,
      allowed: [...CONTENTLIST_LISTTYPES],
    });
  }
  if (!CONTENTLIST_OPERATION_TYPES.has(type)) {
    issue(issues, severity, "CONTENTLIST_OPERATION_TYPE_UNKNOWN", "Set data list / ContentList operation type should be add, edit, or remove in the studied exports.", {
      path: `${pointer}.properties.type`,
      nodeType: "ContentList",
      nodeId: shapeId(shape),
      type,
      allowed: [...CONTENTLIST_OPERATION_TYPES],
    });
  }
  if (listtype === "select") {
    for (const key of ["appid", "listsetid", "listid"]) {
      if (valueMissing(props[key])) issue(issues, severity, "CONTENTLIST_SELECTED_TARGET_PROPERTY_MISSING", "ContentList selected-list operation is missing target metadata.", {
        path: `${pointer}.properties.${key}`,
        nodeType: "ContentList",
        nodeId: shapeId(shape),
      });
    }
  }
  if (["add", "edit"].includes(type)) {
    if (!Array.isArray(props.listdatas)) {
      issue(issues, severity, "CONTENTLIST_LISTDATAS_INVALID", "ContentList add/edit operation requires properties.listdatas array.", {
        path: `${pointer}.properties.listdatas`,
        nodeId: shapeId(shape),
      });
    } else {
      props.listdatas.forEach((entry, index) => {
        const target = entry && (entry.Columns || entry.Column || entry.FieldName || entry.fieldName);
        if (!target) issue(issues, severity, "CONTENTLIST_MAPPING_TARGET_MISSING", "ContentList mapping is missing a target column/field.", {
          path: `${pointer}.properties.listdatas[${index}]`,
          nodeId: shapeId(shape),
        });
        if (entry && entry.Per !== undefined && !CONTENTLIST_NUMERIC_OPERATION_CODES.has(safeString(entry.Per))) {
          issue(issues, "warning", "CONTENTLIST_MAPPING_OPERATION_CODE_UNKNOWN", "Set data list mapping uses an unstudied Per operation code. Preserve it and runtime-test before generation claims.", {
            path: `${pointer}.properties.listdatas[${index}].Per`,
            nodeId: shapeId(shape),
            Per: safeString(entry.Per),
            studied: [...CONTENTLIST_NUMERIC_OPERATION_CODES],
          });
        }
        if (!entry || !Object.prototype.hasOwnProperty.call(entry, "Data")) issue(issues, severity, "CONTENTLIST_MAPPING_VALUE_MISSING", "ContentList mapping is missing Data value/expression.", {
          path: `${pointer}.properties.listdatas[${index}].Data`,
          nodeId: shapeId(shape),
        });
        else if (Array.isArray(entry.Data)) {
          const result = validateExpressionTokens(entry.Data, { path: `${pointer}.properties.listdatas[${index}].Data` });
          for (const exprIssue of result.issues || []) {
            if (exprIssue.code === "EXPRESSION_TOKEN_UNKNOWN_SHAPE" && exprIssue.detail && exprIssue.detail.exprType === "list_field") continue;
            const level = exprIssue.level === "error" ? severity : "warning";
            issue(issues, level, `CONTENTLIST_${exprIssue.code}`, "Set data list mapping expression did not fully match the expression reference.", {
              path: exprIssue.path,
              nodeId: shapeId(shape),
              detail: exprIssue.detail,
            });
          }
        } else {
          issue(issues, severity, "CONTENTLIST_MAPPING_VALUE_NOT_ARRAY", "Set data list mapping Data should be an expression-token array in the studied exports.", {
            path: `${pointer}.properties.listdatas[${index}].Data`,
            nodeId: shapeId(shape),
          });
        }
      });
    }
  }
  if (["edit", "remove"].includes(type) && !Array.isArray(props.wheres)) {
    issue(issues, severity, "CONTENTLIST_WHERES_INVALID", "ContentList edit/remove operation requires properties.wheres array.", {
      path: `${pointer}.properties.wheres`,
      nodeId: shapeId(shape),
    });
  }
  if (["edit", "remove"].includes(type) && Array.isArray(props.wheres) && props.wheres.length === 0) {
    issue(issues, "warning", "CONTENTLIST_BROAD_MUTATION_FILTER_MISSING", "Set data list update/delete has no filter conditions. Product behavior can affect many records; require explicit safe intent before generation or runtime execution.", {
      path: `${pointer}.properties.wheres`,
      nodeId: shapeId(shape),
      type,
    });
  }
  validateConditionArray(issues, props.wheres, `${pointer}.properties.wheres`, "CONTENTLIST_WHERE_CONDITION_INVALID", severity);
}

function validateQueryData(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const severity = strictLevel(options, "warning");
  if (!valueMissing(props.filters) && !Array.isArray(props.filters)) {
    issue(issues, severity, "QUERYDATA_FILTERS_NOT_ARRAY", "QueryData properties.filters must be an array when present.", {
      path: `${pointer}.properties.filters`,
      nodeId: shapeId(shape),
    });
  }
  validateConditionArray(issues, props.filters, `${pointer}.properties.filters`, "QUERYDATA_FILTER_CONDITION_INVALID", severity);
  if (props.datasource !== undefined) {
    if (!Array.isArray(props.datasource)) {
      issue(issues, severity, "QUERYDATA_DATASOURCE_NOT_ARRAY", "QueryData properties.datasource must be an array when present.", {
        path: `${pointer}.properties.datasource`,
        nodeId: shapeId(shape),
      });
    } else {
      props.datasource.forEach((sort, index) => {
        if (!isObject(sort) || valueMissing(sort.SortName || sort.sortName) || valueMissing(sort.SortByDesc !== undefined ? sort.SortByDesc : sort.sortByDesc)) {
          issue(issues, severity, "QUERYDATA_SORT_SHAPE_INVALID", "QueryData datasource sort entry should include SortName and SortByDesc.", {
            path: `${pointer}.properties.datasource[${index}]`,
            nodeId: shapeId(shape),
          });
        }
      });
    }
  }
  const resultType = props.result && props.result.type;
  if (safeString(resultType) === "multiple") {
    if (!props.result.listName) issue(issues, severity, "QUERYDATA_MULTIPLE_RESULT_TARGET_MISSING", "QueryData multiple result requires result.listName.", {
      path: `${pointer}.properties.result.listName`,
      nodeId: shapeId(shape),
    });
    if (props.result.fields !== undefined && !Array.isArray(props.result.fields)) {
      issue(issues, severity, "QUERYDATA_RESULT_FIELDS_INVALID", "QueryData result.fields must be an array when present.", {
        path: `${pointer}.properties.result.fields`,
        nodeId: shapeId(shape),
      });
    }
  }
}

function validateSequenceFlow(issues, shape, pointer, options) {
  const severity = strictLevel(options, "warning");
  const conditions = shape.properties && shape.properties.conditioninfo;
  if (conditions === undefined || conditions === null) return;
  if (!Array.isArray(conditions)) {
    issue(issues, severity, "SEQUENCEFLOW_CONDITIONINFO_NOT_ARRAY", "SequenceFlow properties.conditioninfo must be an array when present.", {
      path: `${pointer}.properties.conditioninfo`,
      nodeId: shapeId(shape),
    });
    return;
  }
  validateConditionArray(issues, conditions, `${pointer}.properties.conditioninfo`, "SEQUENCEFLOW_CONDITION_INVALID", severity);
}

function validateDelay(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const severity = strictLevel(options, "warning");
  const type = safeString(props.type);
  if (type === "duration") {
    if (valueMissing(props.duration && props.duration.count)) issue(issues, severity, "DELAY_DURATION_COUNT_MISSING", "Delay duration mode requires duration.count.", { path: `${pointer}.properties.duration.count`, nodeId: shapeId(shape) });
    if (valueMissing(props.duration && props.duration.unit)) issue(issues, severity, "DELAY_DURATION_UNIT_MISSING", "Delay duration mode requires duration.unit.", { path: `${pointer}.properties.duration.unit`, nodeId: shapeId(shape) });
  } else if (type === "until") {
    const subType = safeString(props.until && props.until.subType);
    if (!subType) issue(issues, severity, "DELAY_UNTIL_SUBTYPE_MISSING", "Delay until mode requires until.subType.", { path: `${pointer}.properties.until.subType`, nodeId: shapeId(shape) });
    if (subType === "specific" && valueMissing(props.until && props.until.specific && props.until.specific.date)) issue(issues, severity, "DELAY_UNTIL_SPECIFIC_DATE_MISSING", "Delay specific-until mode requires until.specific.date.", { path: `${pointer}.properties.until.specific.date`, nodeId: shapeId(shape) });
    if (subType === "dynamic" && valueMissing(props.until && props.until.dynamic && props.until.dynamic.time)) issue(issues, severity, "DELAY_UNTIL_DYNAMIC_TIME_MISSING", "Delay dynamic-until mode requires until.dynamic.time.", { path: `${pointer}.properties.until.dynamic.time`, nodeId: shapeId(shape) });
  } else if (type === "condition") {
    validateConditionArray(issues, props.condition && props.condition.conditions, `${pointer}.properties.condition.conditions`, "DELAY_CONDITION_SHAPE_INVALID", severity, true);
  }
}

function validateLoop(issues, shape, pointer, options) {
  const props = shape.properties || {};
  const severity = strictLevel(options, "warning");
  if (!valueMissing(props.loopType) && !["list", "values", "number"].includes(safeString(props.loopType))) {
    issue(issues, severity, "LOOP_TYPE_INVALID", "Loop loopType must be list, values, or number.", { path: `${pointer}.properties.loopType`, nodeId: shapeId(shape), value: props.loopType });
  }
  if (!valueMissing(props.loopType)) {
    const loopValue = props.loopValue || {};
    for (const key of ["prefix", "type", "value"]) {
      if (valueMissing(loopValue[key])) issue(issues, severity, "LOOP_VALUE_PROPERTY_MISSING", "Loop requires loopValue prefix/type/value when loopType is configured.", {
        path: `${pointer}.properties.loopValue.${key}`,
        nodeId: shapeId(shape),
      });
    }
  }
  validateConditionStringOrArray(issues, props.continueCondition, `${pointer}.properties.continueCondition`, "LOOP_CONTINUE_CONDITION_INVALID", severity);
  validateConditionStringOrArray(issues, props.breakCondition, `${pointer}.properties.breakCondition`, "LOOP_BREAK_CONDITION_INVALID", severity);
}

function validateConditionStringOrArray(issues, value, pointer, code, severity) {
  if (valueMissing(value)) return;
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      issue(issues, severity, code, "Condition field should be a condition array or JSON-encoded condition array.", { path: pointer });
      return;
    }
  }
  validateConditionArray(issues, parsed, pointer, code, severity, false);
}

function validateConditionArray(issues, value, pointer, code, severity, requirePresent = false) {
  if (valueMissing(value)) {
    if (requirePresent) issue(issues, severity, code, "Condition array is required for the selected action mode.", { path: pointer });
    return;
  }
  if (!Array.isArray(value)) {
    issue(issues, severity, code, "Condition configuration must be an array.", { path: pointer });
    return;
  }
  if (looksLikeExpressionTokenArray(value)) {
    const expressionReport = validateExpressionTokens(value, { path: pointer });
    expressionReport.issues.forEach((entry) => {
      issue(issues, entry.level === "error" ? severity : "warning", entry.code, entry.message, {
        path: entry.path,
        detail: entry.detail || null,
      });
    });
    return;
  }
  value.forEach((condition, index) => {
    if (!isObject(condition)) {
      issue(issues, severity, code, "Condition entry must be an object.", { path: `${pointer}[${index}]` });
      return;
    }
    const text = JSON.stringify(condition);
    const isTaskOutcome = /Outcome|Task outcome|任务结果|已同意|Rejected|Approved/.test(text);
    if (isTaskOutcome) return;
    const hasOp = !valueMissing(condition.op || condition.operator);
    const hasLeft = !valueMissing(condition.left || condition.field || condition.FieldName || condition.fieldName);
    const hasRight = Object.prototype.hasOwnProperty.call(condition, "right") || Object.prototype.hasOwnProperty.call(condition, "value") || Object.prototype.hasOwnProperty.call(condition, "Value");
    if (!hasOp || !hasLeft || !hasRight) {
      issue(issues, severity, code, "Condition entry should include operator plus left/right operands.", {
        path: `${pointer}[${index}]`,
        hasOp,
        hasLeft,
        hasRight,
      });
    }
    validateConditionOperandShape(issues, condition.left, `${pointer}[${index}].left`, "left");
    validateConditionOperandShape(issues, condition.right, `${pointer}[${index}].right`, "right");
  });
}

function looksLikeExpressionTokenArray(value) {
  return Array.isArray(value) && value.some((entry) => isObject(entry) && (
    entry.type === "op" ||
    entry.type === "func" ||
    entry.type === "str" ||
    entry.type === "num" ||
    entry.type === "bool" ||
    entry.exprType === "variable" ||
    entry.exprType === "variable_ctx"
  ));
}

function validateConditionOperandShape(issues, operand, pointer, side) {
  if (typeof operand === "string") {
    if (operand.includes("<input") && operand.includes("Workflow Variables:")) {
      issue(issues, "warning", "SEQUENCEFLOW_CONDITION_LEGACY_HTML_OPERAND", "Workflow transition condition uses legacy HTML expression-button operand; prefer operand wrapper objects for newly generated conditions.", { path: pointer, side });
    }
    return;
  }
  if (!isObject(operand)) return;
  if (![0, 1, 2].includes(operand.type)) {
    issue(issues, "warning", "SEQUENCEFLOW_CONDITION_OPERAND_UNKNOWN_TYPE", "Workflow transition condition operand wrapper should use type 0 direct value, type 1 direct selector, or type 2 expression editor.", { path: `${pointer}.type`, side, type: operand.type });
    return;
  }
  if (!Object.prototype.hasOwnProperty.call(operand, "value")) {
    issue(issues, "warning", "SEQUENCEFLOW_CONDITION_OPERAND_MISSING_VALUE", "Workflow transition condition operand wrapper should include value.", { path: `${pointer}.value`, side, type: operand.type });
  }
  if (operand.type === 2 && !looksLikeExpressionTokenArray(operand.value)) {
    issue(issues, "warning", "SEQUENCEFLOW_CONDITION_EXPR_OPERAND_BAD_VALUE", "Expression-editor workflow transition condition operands should store an expression-token array in value.", { path: `${pointer}.value`, side });
  }
  if (operand.type === 1 && !isObject(operand.value)) {
    issue(issues, "warning", "SEQUENCEFLOW_CONDITION_DIRECT_SELECTOR_BAD_VALUE", "Direct-selector workflow transition condition operands should store the selected variable/field token object in value.", { path: `${pointer}.value`, side });
  }
}

function walk(value, visitor, pointer = "", key = "") {
  visitor(value, pointer, key);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`, String(index)));
  else if (isObject(value)) Object.entries(value).forEach(([childKey, child]) => walk(child, visitor, `${pointer}.${childKey}`, childKey));
}

module.exports = {
  loadWorkflowActionReference,
  validateWorkflowActionShapes,
};
