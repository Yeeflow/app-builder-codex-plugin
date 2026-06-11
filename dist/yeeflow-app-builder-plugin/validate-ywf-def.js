#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { validateWorkflowActionShapes } = require("./workflow-action-config-validator");
const {
  isGeneratedValueControl,
  loadControlFieldSchemas,
  validateControlAgainstSchema,
} = require("./yeeflow-control-field-schema-utils");
const { validateExpressionTokens } = require("./yeeflow-expression-utils");

const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;
const NUMERIC_OPS = new Set(["n.>", "n.>=", "n.<", "n.<=", "n.=", "n.!=", ">", ">=", "<", "<="]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CORRUPTED_REPLACEMENT_KEY_RE = /^pr[0-9]+x$/;
const PROCESS_KEY_RE = /^[A-Za-z0-9_]+$/;
const PROCESS_KEY_MAX_LENGTH = 255;
const FLOW_KEY_RESERVED_PROPERTY_NAMES = [
  "prefix",
  "suffix",
  "field",
  "fields",
  "profile",
  "definition",
  "workflow",
  "variable",
  "filter",
  "ref",
  "href",
  "control",
  "collection",
  "condition",
  "expression",
  "attributes",
  "actions",
  "binding",
];
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

function usage(exitCode = 1) {
  const out = [
    "Usage:",
    "  node validate-ywf-def.js <decoded-def.json> --mode <draft|final> [--dependency-map <mapping.json>]",
    "",
    "Examples:",
    "  node validate-ywf-def.js ./travel-request-def.json --mode draft",
    "  node validate-ywf-def.js ./travel-request-def.json --mode final",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(out);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { input: null, mode: "draft", dependencyMap: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") usage(0);
    if (arg === "--mode") {
      args.mode = argv[++i];
    } else if (arg === "--dependency-map") {
      args.dependencyMap = argv[++i];
    } else if (!args.input) {
      args.input = arg;
    } else {
      usage();
    }
  }
  if (!args.input || !["draft", "final"].includes(args.mode)) usage();
  return args;
}

function readJson(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  return JSON.parse(text);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function zeroPadding(padding) {
  const value = Array.isArray(padding) ? padding[1] : padding;
  if (!isObject(value)) return false;
  return ["top", "right", "bottom", "left"].every((side) => value[side] === "--sp--s0" || value[side] === 0 || value[side] === "0" || value[side] === "");
}

function configValue(value) {
  return Array.isArray(value) && value.length === 2 && value[0] === null ? value[1] : value;
}

function displayLabelDisabled(value) {
  if (value === false) return true;
  return Array.isArray(value) && value[1] === false;
}

function controlName(control) {
  return control && (control.nv_label || control.label || control.title || control.binding || control.id || control.type || "control");
}

function controlWidthType(control) {
  return configValue(control && control.attrs && control.attrs.common && control.attrs.common.positioning && control.attrs.common.positioning.widthtype);
}

function isSequenceFlow(shape) {
  return shape && shape.stencil && shape.stencil.id === "SequenceFlow";
}

function shapeId(shape) {
  return shape && (shape.resourceid || shape.resourceId || shape.id);
}

function refId(ref) {
  if (!ref) return undefined;
  if (typeof ref === "string") return ref;
  return ref.resourceid || ref.resourceId || ref.id;
}

function addIssue(list, code, message, path, detail) {
  list.push({ code, message, path: path || null, detail });
}

function deepWalk(value, visitor, pointer = "$", parent = null) {
  visitor(value, pointer, parent);
  if (Array.isArray(value)) {
    value.forEach((item, index) => deepWalk(item, visitor, `${pointer}[${index}]`, value));
  } else if (isObject(value)) {
    Object.entries(value).forEach(([key, child]) => {
      deepWalk(child, visitor, `${pointer}.${key}`, value);
    });
  }
}

function findControlByLabel(root, label) {
  let found = null;
  deepWalk(root, (node) => {
    if (!found && isObject(node) && node.nv_label === label) found = node;
  });
  return found;
}

function controlContains(parent, child) {
  if (!parent || !child) return false;
  let found = false;
  deepWalk(parent, (node) => {
    if (node === child) found = true;
  });
  return found;
}

function collectPlaceholders(value) {
  const found = new Map();
  deepWalk(value, (node, pointer) => {
    if (typeof node === "string" && PLACEHOLDER_RE.test(node)) {
      if (!found.has(node)) found.set(node, []);
      found.get(node).push(pointer);
    }
  });
  return [...found.entries()].map(([placeholder, paths]) => ({ placeholder, paths }));
}

function validateDecodedDef(def, options = {}) {
  const mode = options.mode || "draft";
  const dependencyMap = options.dependencyMap || null;
  const errors = [];
  const warnings = [];
  const summary = {
    variables: 0,
    listrefs: 0,
    pages: 0,
    controls: 0,
    workflowNodes: 0,
    sequenceFlows: 0,
    approvalTasks: 0,
    contentListNodes: 0,
    lookupControls: 0,
    workflowActionConfig: null,
  };

  if (!isObject(def)) {
    addIssue(errors, "DEF_NOT_OBJECT", "Decoded Def JSON must be an object", "$");
    return finish();
  }

  validateBasicStructure();

  const basicVars = asArray(def.variables && def.variables.basic);
  const listrefs = asArray(def.variables && def.variables.listref);
  const pages = asArray(def.pageurls);
  const childshapes = asArray(def.childshapes);
  const variableById = new Map();
  const listrefById = new Map();
  const rowFieldsByListVar = new Map();
  const tempVarIds = new Set(asArray(def.variables && def.variables.tempVars).map((item) => item && item.id).filter(Boolean));
  const tempExprIds = new Set([...tempVarIds].map((id) => `__temp_${id}`));
  const requestPageIds = new Set();
  const approvalPageIds = new Set();
  const controls = [];
  const controlEntries = [];
  const placeholders = collectPlaceholders(def);
  const controlFieldSchemas = loadControlFieldSchemas(__dirname);

  summary.variables = basicVars.length;
  summary.listrefs = listrefs.length;
  summary.pages = pages.length;
  summary.workflowNodes = childshapes.filter((s) => !isSequenceFlow(s)).length;
  summary.sequenceFlows = childshapes.filter(isSequenceFlow).length;
  summary.approvalTasks = childshapes.filter((s) => s.stencil && s.stencil.id === "MultiAssignmentTask").length;
  summary.contentListNodes = childshapes.filter((s) => s.stencil && s.stencil.id === "ContentList").length;

  validateVariables();
  validatePagesAndControls();
  validateLookupControls();
  validateTaskUrls();
  validateWorkflowGraph();
  validateApprovalTasks();
  validateSequenceFlowConditions();
  validateContentLists();
  validateSetVariableTasks();
  validateWorkflowActionConfigurations();
  validatePlaceholderPolicy();
  validateDesignSystemColorUsage();
  validateFlowKeyReplacementSafety();
  validateCorruptedReplacementKeys();

  return finish();

  function finish() {
    const status = errors.length > 0 ? "fail" : warnings.length > 0 ? "pass_with_warnings" : "pass";
    return {
      status,
      mode,
      errors,
      warnings,
      placeholders,
      summary,
    };
  }

  function validateBasicStructure() {
    const required = [
      ["defkey", def.defkey],
      ["variables.basic", def.variables && def.variables.basic],
      ["variables.listref", def.variables && def.variables.listref],
      ["pageurls", def.pageurls],
      ["childshapes", def.childshapes],
      ["graphposition", def.graphposition],
      ["graphzoom", def.graphzoom],
    ];
    for (const [key, value] of required) {
      if (value === undefined || value === null) {
        addIssue(errors, "MISSING_REQUIRED_SECTION", `Missing required section: ${key}`, `$.${key}`);
      }
    }
    if (def.variables && !Array.isArray(def.variables.basic)) {
      addIssue(errors, "VARIABLES_BASIC_NOT_ARRAY", "variables.basic must be an array", "$.variables.basic");
    }
    if (def.variables && !Array.isArray(def.variables.listref)) {
      addIssue(errors, "VARIABLES_LISTREF_NOT_ARRAY", "variables.listref must be an array", "$.variables.listref");
    }
    if (!Array.isArray(def.pageurls)) {
      addIssue(errors, "PAGEURLS_NOT_ARRAY", "pageurls must be an array", "$.pageurls");
    }
    if (!Array.isArray(def.childshapes)) {
      addIssue(errors, "CHILDSHAPES_NOT_ARRAY", "childshapes must be an array", "$.childshapes");
    }
    if (isObject(def.graphposition)) {
      for (const key of ["x", "y", "width", "height"]) {
        if (typeof def.graphposition[key] !== "number") {
          addIssue(errors, "GRAPHPOSITION_MISSING_DIMENSION", `graphposition.${key} must be a number for workflow designer layout`, `$.graphposition.${key}`);
        }
      }
    }
    if (typeof def.defkey === "string" && def.defkey.length > PROCESS_KEY_MAX_LENGTH) {
      addIssue(errors, "PROCESS_KEY_TOO_LONG", "Process keys must not exceed 255 characters", "$.defkey", { keyLength: def.defkey.length });
    }
    if (typeof def.defkey === "string" && def.defkey && !PROCESS_KEY_RE.test(def.defkey)) {
      addIssue(errors, "PROCESS_KEY_INVALID_CHARS", "Process keys may contain only letters, numbers, and underscores", "$.defkey", { flowKey: def.defkey });
    }
  }

  function validateFlowKeyReplacementSafety() {
    const flowKey = typeof def.defkey === "string" ? def.defkey.trim() : "";
    if (!flowKey) return;
    const lowerFlowKey = flowKey.toLowerCase();
    const collisions = FLOW_KEY_RESERVED_PROPERTY_NAMES.filter((name) => name.includes(lowerFlowKey));
    if (!collisions.length) return;
    addIssue(
      warnings,
      "FLOW_KEY_RESERVED_PROPERTY_COLLISION",
      `FlowKey ${flowKey} can collide with reserved JSON property names during Yeeflow import replacement: ${collisions.join(", ")}`,
      "$.defkey",
      { flowKey, collisions }
    );
  }

  function validateCorruptedReplacementKeys() {
    deepWalk(def, (node, pointer) => {
      if (!isObject(node)) return;
      for (const key of Object.keys(node)) {
        if (CORRUPTED_REPLACEMENT_KEY_RE.test(key)) {
          addIssue(
            warnings,
            "CORRUPTED_REPLACEMENT_KEY",
            `Suspicious generated/import replacement key ${key}; this may indicate a reserved property such as prefix was corrupted`,
            `${pointer}.${key}`,
            { key }
          );
        }
      }
    });
  }

  function validateVariables() {
    const ids = new Set();
    const idxs = new Set();
    basicVars.forEach((variable, index) => {
      const p = `$.variables.basic[${index}]`;
      if (!variable || typeof variable.id !== "string") {
        addIssue(errors, "VARIABLE_MISSING_ID", "variables.basic entry must have a string id", p);
        return;
      }
      if (ids.has(variable.id)) addIssue(errors, "DUPLICATE_VARIABLE_ID", `Duplicate variables.basic id: ${variable.id}`, p);
      ids.add(variable.id);
      variableById.set(variable.id, variable);
      if (variable.idx) {
        if (idxs.has(variable.idx)) addIssue(errors, "DUPLICATE_VARIABLE_IDX", `Duplicate variables.basic idx: ${variable.idx}`, p);
        idxs.add(variable.idx);
      }
    });

    const listrefIds = new Set();
    listrefs.forEach((listref, index) => {
      const p = `$.variables.listref[${index}]`;
      if (!listref || typeof listref.id !== "string") {
        addIssue(errors, "LISTREF_MISSING_ID", "variables.listref entry must have a string id", p);
        return;
      }
      if (listrefIds.has(listref.id)) addIssue(errors, "DUPLICATE_LISTREF_ID", `Duplicate listref id: ${listref.id}`, p);
      listrefIds.add(listref.id);
      listrefById.set(listref.id, listref);

      const rowIds = new Set();
      asArray(listref.fields).forEach((field, fieldIndex) => {
        const fieldPath = `${p}.fields[${fieldIndex}]`;
        if (!field || typeof field.id !== "string") {
          addIssue(errors, "LISTREF_FIELD_MISSING_ID", "listref field must have a string id", fieldPath);
          return;
        }
        if (rowIds.has(field.id)) {
          addIssue(errors, "DUPLICATE_LISTREF_ROW_FIELD", `Duplicate row field id ${field.id} in ${listref.id}`, fieldPath);
        }
        rowIds.add(field.id);
      });
    });

    basicVars.forEach((variable, index) => {
      if (variable && variable.type === "list") {
        if (!variable.value || !listrefById.has(variable.value)) {
          addIssue(errors, "LIST_VARIABLE_BAD_LISTREF", `List variable ${variable.id} must point to an existing listref id`, `$.variables.basic[${index}].value`);
        } else {
          rowFieldsByListVar.set(variable.id, new Set(asArray(listrefById.get(variable.value).fields).map((f) => f.id)));
        }
      }
    });
  }

  function validatePagesAndControls() {
    let hasRequest = false;
    let hasApproval = false;
    let requestHasPanel = false;
    let requestHasHistory = false;
    let approvalHasPanel = false;
    let approvalHasHistory = false;

    pages.forEach((page, pageIndex) => {
      const pagePath = `$.pageurls[${pageIndex}]`;
      if (!page || !page.id) addIssue(errors, "PAGE_MISSING_ID", "Page must have id", pagePath);
      if (mode === "final" && page && page.id && !UUID_RE.test(String(page.id))) {
        addIssue(errors, "PAGE_ID_NOT_UUID", "Page id should be UUID-shaped for import-ready approval form packages", `${pagePath}.id`);
      }
      if (page && typeof page.pagetype !== "number") {
        addIssue(errors, "PAGE_MISSING_PAGETYPE", "Page must include page-level pagetype for publish-time pageUrl registration", `${pagePath}.pagetype`);
      }
      if (page.type === 1) {
        hasRequest = true;
        requestPageIds.add(page.id);
        if (!Object.prototype.hasOwnProperty.call(page, "name")) {
          addIssue(errors, "REQUEST_PAGE_MISSING_NAME", "Request page should include name field, matching real exports", `${pagePath}.name`);
        }
      }
      if (page.type === 2) {
        hasApproval = true;
        approvalPageIds.add(page.id);
      }
      if (!page.formdef) {
        addIssue(errors, "PAGE_MISSING_FORMDEF", "Every page must have formdef", pagePath);
        return;
      }
      if (!Array.isArray(page.formdef.children)) {
        addIssue(errors, "FORMDEF_CHILDREN_NOT_ARRAY", "Every formdef must have children array", `${pagePath}.formdef.children`);
        return;
      }
      if (page.formdef.pagetype !== page.type) {
        addIssue(errors, "FORMDEF_PAGETYPE_MISMATCH", "formdef.pagetype must match page type", `${pagePath}.formdef.pagetype`, {
          pageType: page.type,
          formdefPagetype: page.formdef.pagetype,
        });
      }
      if (page.formdef.ver !== 2) {
        addIssue(errors, "FORMDEF_VERSION_UNSUPPORTED", "formdef.ver should be 2, matching current real approval exports", `${pagePath}.formdef.ver`);
      }
      if (page.formdef.exts !== undefined && !Array.isArray(page.formdef.exts)) {
        addIssue(errors, "FORMDEF_EXTS_NOT_ARRAY", "formdef.exts must be an array when present", `${pagePath}.formdef.exts`);
      }
      validateUiUxStandardPage(page, pagePath);
      validateFormActions(page, pagePath);
      walkControls(page.formdef.children, { page, pagePath, listContext: null });
      if (page.type === 1) {
        deepWalk(page.formdef.children, (node) => {
          if (isObject(node) && node.type === "workflowControlPanel") requestHasPanel = true;
          if (isObject(node) && node.type === "workflowHistory") requestHasHistory = true;
        });
      }
      if (page.type === 2) {
        deepWalk(page.formdef.children, (node) => {
          if (isObject(node) && node.type === "workflowControlPanel") approvalHasPanel = true;
          if (isObject(node) && node.type === "workflowHistory") approvalHasHistory = true;
        });
      }
    });

    if (!hasRequest) addIssue(errors, "REQUEST_PAGE_MISSING", "Request page type 1 must exist", "$.pageurls");
    if (!hasApproval) addIssue(errors, "APPROVAL_PAGE_MISSING", "Approval page type 2 must exist", "$.pageurls");
    if (!requestHasPanel) addIssue(errors, "REQUEST_PANEL_MISSING", "Request page must include workflowControlPanel for Save as draft / Submit actions", "$.pageurls");
    if (!requestHasHistory) addIssue(warnings, "REQUEST_HISTORY_MISSING", "Request page should include workflowHistory", "$.pageurls");
    if (!approvalHasPanel) addIssue(errors, "APPROVAL_PANEL_MISSING", "Approval page must include workflowControlPanel", "$.pageurls");
    if (!approvalHasHistory) addIssue(errors, "APPROVAL_HISTORY_MISSING", "Approval page must include workflowHistory", "$.pageurls");

    summary.controls = controls.length;
    const controlIds = new Map();
    for (const entry of controlEntries) {
      const controlId = entry.control && entry.control.id;
      if (!controlId) continue;
      if (controlIds.has(controlId)) {
        addIssue(errors, "DUPLICATE_CONTROL_ID", `Duplicate form control id: ${controlId}`, entry.path, { firstPath: controlIds.get(controlId) });
      } else {
        controlIds.set(controlId, entry.path);
      }
    }
  }

  function isKnownFormVariableToken(token) {
    if (!isObject(token) || token.exprType !== "variable") return true;
    if (!token.id) return false;
    return variableById.has(token.id) || tempExprIds.has(token.id) || tempVarIds.has(token.id);
  }

  function validateActionExpression(expr, exprPath) {
    if (!Array.isArray(expr)) return;
    validateExpressionStructure(expr, exprPath);
    deepWalk(expr, (node, pointer) => {
      if (!isObject(node) || node.exprType !== "variable") return;
      if (!isKnownFormVariableToken(node)) {
        addIssue(warnings, "FORM_ACTION_EXPRESSION_UNKNOWN_VARIABLE", `Form action expression references unknown variable ${node.id}`, `${exprPath}${pointer.slice(1)}`);
      }
    });
  }

  function validateSetvarTarget(target, targetPath) {
    if (!isObject(target)) {
      addIssue(warnings, "FORM_ACTION_SETVAR_TARGET_MISSING", "Set variable form action step should include attrs.setvar_var or setvar_array[].var", targetPath);
      return;
    }
    if (!isKnownFormVariableToken(target)) {
      addIssue(warnings, "FORM_ACTION_SETVAR_UNKNOWN_TARGET", `Set variable form action target ${target.id} is not a known workflow or temp variable`, targetPath, {
        target,
      });
    }
  }

  function variableNamespaceHasTarget(parent, id) {
    if (!id) return false;
    if (parent === "__temp_") return tempVarIds.has(id) || tempExprIds.has(id) || tempExprIds.has(`__temp_${id}`);
    if (parent === "__variables_") return variableById.has(id);
    if (parent === "" || parent === undefined || parent === null) return variableById.has(id) || tempVarIds.has(id);
    return false;
  }

  function validateQueryDataStep(step, stepPath) {
    const attrs = step.attrs || {};
    if (!isObject(attrs.querydata_list)) {
      addIssue(warnings, "FORM_ACTION_QUERYDATA_SOURCE_MISSING", "Query data step should include attrs.querydata_list source metadata", `${stepPath}.attrs.querydata_list`);
    } else {
      for (const key of ["AppID", "ListSetID", "ListID", "ListType"]) {
        if (attrs.querydata_list[key] === undefined || attrs.querydata_list[key] === null || attrs.querydata_list[key] === "") {
          addIssue(warnings, "FORM_ACTION_QUERYDATA_SOURCE_INCOMPLETE", `Query data source is missing ${key}`, `${stepPath}.attrs.querydata_list.${key}`);
        }
      }
    }

    if (!["multiple", "single"].includes(attrs.querydata_type)) {
      addIssue(warnings, "FORM_ACTION_QUERYDATA_TYPE_UNKNOWN", "Query data step should use querydata_type single or multiple", `${stepPath}.attrs.querydata_type`, {
        querydata_type: attrs.querydata_type,
      });
    }

    if (attrs.querydata_totalcount && !variableNamespaceHasTarget(attrs.querydata_totalparent, attrs.querydata_totalcount)) {
      addIssue(warnings, "FORM_ACTION_QUERYDATA_COUNT_TARGET_MISSING", `Query data total count target ${attrs.querydata_totalparent || ""}${attrs.querydata_totalcount} is not declared`, `${stepPath}.attrs.querydata_totalcount`);
    }

    if (Array.isArray(attrs.querydata_filter) && !Array.isArray(attrs.querydata_filters)) {
      addIssue(warnings, "FORM_ACTION_QUERYDATA_FILTER_SINGULAR_IGNORED", "Query data filters should use attrs.querydata_filters; attrs.querydata_filter is ignored by runtime", `${stepPath}.attrs.querydata_filter`);
    }

    if (Array.isArray(attrs.querydata_filters)) {
      attrs.querydata_filters.forEach((filter, index) => {
        const filterPath = `${stepPath}.attrs.querydata_filters.${index}`;
        if (!isObject(filter)) {
          addIssue(warnings, "FORM_ACTION_QUERYDATA_FILTER_BAD_ENTRY", "Query data filter entries should be objects", filterPath);
          return;
        }
        if (!filter.left || filter.op === undefined || filter.op === null || filter.right === undefined || filter.right === null) {
          addIssue(warnings, "FORM_ACTION_QUERYDATA_FILTER_INCOMPLETE", "Query data filter entries should include left, op, and right", filterPath);
        }
        if (filter.right === "ON" || filter.right === "OFF") {
          addIssue(warnings, "FORM_ACTION_QUERYDATA_FILTER_BOOLEAN_LABEL", "Boolean Query data filters should use true/false string values, not ON/OFF labels", `${filterPath}.right`, { right: filter.right });
        }
        if (typeof filter.right === "string" && (filter.right.includes("<input") || filter.right.includes("&quot;") || filter.right.includes("Workflow Variables:"))) {
          addIssue(warnings, "FORM_ACTION_QUERYDATA_FILTER_HTML_VALUE_OPERAND", "Query data filter variable/calculated operands must use expression-editor token arrays with showCus false; HTML expression-button strings in direct-value mode are treated as literal strings at runtime", `${filterPath}.right`, { right: filter.right, showCus: filter.showCus });
        }
        if (Array.isArray(filter.right) && filter.showCus !== false) {
          addIssue(warnings, "FORM_ACTION_QUERYDATA_FILTER_EXPR_MODE_MISMATCH", "Query data filter expression-token operands should set showCus false so the right operand is in expression-editor mode", `${filterPath}.showCus`, { showCus: filter.showCus });
        }
      });
    }

    if (attrs.querydata_type === "multiple") {
      const parent = attrs.querydata_listname_parent;
      const target = attrs.querydata_listname;
      if (!target) {
        addIssue(warnings, "FORM_ACTION_QUERYDATA_RESULT_TARGET_MISSING", "Multiple query data step should include querydata_listname when results are needed", `${stepPath}.attrs.querydata_listname`);
      } else if (!variableNamespaceHasTarget(parent, target)) {
        addIssue(warnings, "FORM_ACTION_QUERYDATA_RESULT_TARGET_UNKNOWN", `Multiple query data target ${parent || ""}${target} is not a known workflow or temp variable`, `${stepPath}.attrs.querydata_listname`);
      }
      if (parent === "__variables_" && target && variableById.has(target)) {
        const variable = variableById.get(target);
        if (variable.type !== "list") {
          addIssue(warnings, "FORM_ACTION_QUERYDATA_RESULT_TARGET_NOT_LIST", "Multiple query data mapped to workflow variables should target a list variable", `${stepPath}.attrs.querydata_listname`, { target });
        }
      }
    }

    if (isObject(attrs.querydata_fieldmap)) {
      for (const [sourceField, targetField] of Object.entries(attrs.querydata_fieldmap)) {
        if (!sourceField || !targetField) {
          addIssue(warnings, "FORM_ACTION_QUERYDATA_FIELDMAP_BAD_ENTRY", "Query data field map entries should map source fields to target variables/row fields", `${stepPath}.attrs.querydata_fieldmap`);
          continue;
        }
        if (attrs.querydata_type === "multiple" && attrs.querydata_listname_parent === "__variables_" && rowFieldsByListVar.has(attrs.querydata_listname)) {
          const rowFields = rowFieldsByListVar.get(attrs.querydata_listname);
          if (!rowFields.has(targetField)) {
            addIssue(warnings, "FORM_ACTION_QUERYDATA_ROW_FIELD_MISSING", `Query data maps ${sourceField} to missing list row field ${targetField}`, `${stepPath}.attrs.querydata_fieldmap.${sourceField}`);
          }
        } else if (attrs.querydata_type === "single" && !variableById.has(targetField) && !tempVarIds.has(targetField)) {
          addIssue(warnings, "FORM_ACTION_QUERYDATA_VARIABLE_TARGET_MISSING", `Query data maps ${sourceField} to missing variable ${targetField}`, `${stepPath}.attrs.querydata_fieldmap.${sourceField}`);
        }
      }
    } else if (attrs.querydata_type === "single") {
      addIssue(warnings, "FORM_ACTION_QUERYDATA_SINGLE_FIELDMAP_MISSING", "Single query data steps should map selected fields into variables", `${stepPath}.attrs.querydata_fieldmap`);
    }

    if (attrs.querydata_listname_parent === "__temp_" && attrs.querydata_type === "multiple") {
      const fields = attrs.querydata_fields;
      if (!Array.isArray(fields) || fields.length === 0) {
        addIssue(warnings, "FORM_ACTION_QUERYDATA_SELECTED_FIELDS_MISSING", "Temp collection query results should include explicit querydata_fields[]", `${stepPath}.attrs.querydata_fields`);
      }
    }
  }

  function validateSubmitStep(step, stepPath, page) {
    const attrs = step.attrs || {};
    if (page && page.type === 103) {
      addIssue(warnings, "FORM_ACTION_SUBMIT_ON_DASHBOARD", "Submit form steps are not supported on dashboard pages", stepPath);
    }
    if (attrs.submitType !== undefined && !["1", "2", "3", "4", "5", "6"].includes(String(attrs.submitType))) {
      addIssue(warnings, "FORM_ACTION_SUBMIT_TYPE_UNKNOWN", "Submit form step uses an unknown submitType", `${stepPath}.attrs.submitType`, { submitType: attrs.submitType });
    }
    if (String(attrs.submitType) === "3" && attrs.ignoreValid === true) {
      addIssue(warnings, "FORM_ACTION_SAVE_CHANGES_IGNORE_VALID", "Save changes action ignores validation; generate only for intentional draft/save behavior", `${stepPath}.attrs.ignoreValid`);
    }
  }

  function validateFormActions(page, pagePath) {
    const formdef = page && page.formdef;
    if (!formdef) return;
    const actions = asArray(formdef.actions);
    const actionIds = new Set(actions.map((action) => action && action.id).filter(Boolean));
    const listActionIds = new Set();
    const buttonActionRefs = new Map();
    const triggeredActionRefs = new Map();

    deepWalk(formdef.children, (node, pointer) => {
      if (!isObject(node)) return;
      if (node.type === "list") {
        asArray(node.attrs && node.attrs.actions).forEach((action) => {
          if (action && action.id) listActionIds.add(action.id);
        });
      }
      if (node.type === "action_button") {
        const actionRef = node.attrs && node.attrs.control_action;
        const controlPath = `${pagePath}.formdef.children${pointer.slice(1)}`;
        if (actionRef) {
          buttonActionRefs.set(actionRef, controlPath);
          if (listActionIds.has(actionRef)) {
            return;
          }
          triggeredActionRefs.set(actionRef, controlPath);
          if (!actionIds.has(actionRef)) {
            addIssue(warnings, "FORM_ACTION_BUTTON_TARGET_MISSING", `Action button references missing form action ${actionRef}`, `${controlPath}.attrs.control_action`);
          }
        }
        if (actionRef && !node.nv_label && !(node.attrs && node.attrs.nv_label)) {
          addIssue(warnings, "FORM_ACTION_BUTTON_NV_LABEL_MISSING", "Generated action buttons should have meaningful nv_label names when they trigger form actions", controlPath);
        }
      }
    });

    const onLoad = formdef.formAction && formdef.formAction.onLoad;
    const onSubmit = formdef.formAction && formdef.formAction.onSubmit;
    if (onLoad && !actionIds.has(onLoad)) {
      addIssue(warnings, "FORM_ACTION_ONLOAD_TARGET_MISSING", `Page load action references missing form action ${onLoad}`, `${pagePath}.formdef.formAction.onLoad`);
    }
    if (onLoad) triggeredActionRefs.set(onLoad, `${pagePath}.formdef.formAction.onLoad`);
    if (onSubmit && !actionIds.has(onSubmit)) {
      addIssue(warnings, "FORM_ACTION_ONSUBMIT_TARGET_MISSING", `Form submit action references missing form action ${onSubmit}`, `${pagePath}.formdef.formAction.onSubmit`);
    }
    if (onSubmit) triggeredActionRefs.set(onSubmit, `${pagePath}.formdef.formAction.onSubmit`);

    actions.forEach((action, actionIndex) => {
      asArray(action && action.steps).forEach((step, stepIndex) => {
        if (step && step.type === "otheraction" && step.attrs && step.attrs.control_action) {
          triggeredActionRefs.set(step.attrs.control_action, `${pagePath}.formdef.actions[${actionIndex}].steps[${stepIndex}].attrs.control_action`);
        }
      });
    });

    actions.forEach((action, actionIndex) => {
      const actionPath = `${pagePath}.formdef.actions[${actionIndex}]`;
      if (!action || typeof action !== "object") {
        addIssue(warnings, "FORM_ACTION_BAD_SHAPE", "Form action entries should be objects", actionPath);
        return;
      }
      if (!action.id) addIssue(warnings, "FORM_ACTION_ID_MISSING", "Form action should include id", `${actionPath}.id`);
      if (!action.name) addIssue(warnings, "FORM_ACTION_NAME_MISSING", "Form action should include a business-readable name", `${actionPath}.name`);
      if (!Array.isArray(action.steps) || action.steps.length === 0) {
        addIssue(warnings, "FORM_ACTION_STEPS_EMPTY", "Form action should include at least one step", `${actionPath}.steps`);
        return;
      }
      if (!triggeredActionRefs.has(action.id)) {
        addIssue(warnings, "FORM_ACTION_UNTRIGGERED", "Form action is not referenced by an action button or page-load trigger", actionPath, {
          actionName: action.name,
        });
      }

      action.steps.forEach((step, stepIndex) => {
        const stepPath = `${actionPath}.steps[${stepIndex}]`;
        if (!step || typeof step !== "object") {
          addIssue(warnings, "FORM_ACTION_STEP_BAD_SHAPE", "Form action step should be an object", stepPath);
          return;
        }
        if (!step.type) addIssue(warnings, "FORM_ACTION_STEP_TYPE_MISSING", "Form action step should include type", `${stepPath}.type`);
        if (step.condition) validateActionExpression(step.condition, `${stepPath}.condition`);
        if (step.type === "setvar") {
          const attrs = step.attrs || {};
          if (attrs.setvar_multi === true) {
            const entries = asArray(attrs.setvar_array);
            if (!entries.length) addIssue(warnings, "FORM_ACTION_SETVAR_ARRAY_EMPTY", "Multi set variable action should include attrs.setvar_array entries", `${stepPath}.attrs.setvar_array`);
            entries.forEach((entry, entryIndex) => {
              validateSetvarTarget(entry && entry.var, `${stepPath}.attrs.setvar_array[${entryIndex}].var`);
              validateActionExpression(entry && entry.value, `${stepPath}.attrs.setvar_array[${entryIndex}].value`);
            });
          } else {
            validateSetvarTarget(attrs.setvar_var, `${stepPath}.attrs.setvar_var`);
            validateActionExpression(attrs.setvar_val, `${stepPath}.attrs.setvar_val`);
          }
        } else if (step.type === "confirm") {
          const attrs = step.attrs || {};
          if (!Array.isArray(attrs.confirm_qs) || attrs.confirm_qs.length === 0) {
            addIssue(warnings, "FORM_ACTION_CONFIRM_MESSAGE_MISSING", "Show confirm dialog step should include attrs.confirm_qs message tokens", `${stepPath}.attrs.confirm_qs`);
          } else {
            validateActionExpression(attrs.confirm_qs, `${stepPath}.attrs.confirm_qs`);
          }
          validateSetvarTarget(attrs.confirm_rs, `${stepPath}.attrs.confirm_rs`);
        } else if (step.type === "querydata") {
          validateQueryDataStep(step, stepPath);
        } else if (step.type === "submit") {
          validateSubmitStep(step, stepPath, page);
        } else if (step.type === "otheraction") {
          const targetAction = step.attrs && step.attrs.control_action;
          if (!targetAction) {
            addIssue(warnings, "FORM_ACTION_OTHERACTION_TARGET_MISSING", "Call action step should include attrs.control_action", `${stepPath}.attrs.control_action`);
          } else if (!actionIds.has(targetAction)) {
            addIssue(warnings, "FORM_ACTION_OTHERACTION_TARGET_UNKNOWN", `Call action step references missing action ${targetAction}`, `${stepPath}.attrs.control_action`);
          } else if (targetAction === action.id) {
            addIssue(errors, "FORM_ACTION_OTHERACTION_SELF_REFERENCE", "Call action step must not call the same action; this creates a recursive submit/action loop", `${stepPath}.attrs.control_action`);
          }
        } else if (step.type && !["listitem"].includes(step.type)) {
          addIssue(warnings, "FORM_ACTION_STEP_TYPE_UNCLASSIFIED", "Form action step type is not covered by current Phase 1 validation rules", `${stepPath}.type`, {
            type: step.type,
          });
        }
      });

      validateFormActionConditionFlow(action, actionPath, onSubmit === action.id);
    });

    validateRequesterApplicantActionRules(actions, formdef, pagePath);
  }

  function validateFormActionConditionFlow(action, actionPath, isSubmitTriggerAction) {
    const steps = asArray(action && action.steps);
    steps.forEach((step, stepIndex) => {
      if (!step || typeof step !== "object" || !step.condition) return;
      const laterSubmitIndex = steps.findIndex((candidate, candidateIndex) => candidateIndex > stepIndex && candidate && candidate.type === "submit");
      if (laterSubmitIndex === -1) return;
      const name = String(step.name || "");
      const nameLooksLikeGuard = /warn|warning|confirm|guard|check|block|exceed|exceeded|validation|validate/i.test(name);
      if (step.continue === true) return;
      if (step.type === "confirm" || nameLooksLikeGuard || isSubmitTriggerAction) {
        addIssue(
          warnings,
          "FORM_ACTION_CONDITIONAL_GUARD_CONTINUE_MISSING",
          "Conditional warning/confirm/check steps before a Submit form step usually need continue: true so the valid path can skip the guard and continue to submit",
          `${actionPath}.steps[${stepIndex}].continue`,
          {
            actionName: action.name,
            stepName: step.name,
            followingSubmitStepIndex: laterSubmitIndex,
            exportBackedProperty: "continue",
          }
        );
      }
    });
  }

  function validateRequesterApplicantActionRules(actions, formdef, pagePath) {
    let requesterControl = null;
    deepWalk(formdef && formdef.children, (node) => {
      if (!isObject(node)) return;
      if (node.binding === "RequesterApplicant") requesterControl = node;
    });
    const requesterHasCurrentUserDefault = requesterControl && requesterControl.value === "CurrentUser" && requesterControl.attrs && requesterControl.attrs.default === "currentUser";
    const actionIds = new Set(asArray(actions).map((action) => action && action.id).filter(Boolean));
    if (requesterControl && requesterControl.readonly !== true) {
      const changeAction = requesterControl.attrs && requesterControl.attrs.control_event_rule;
      if (!changeAction) {
        addIssue(warnings, "REQUESTER_APPLICANT_EDITABLE_CHANGE_ACTION_MISSING", "Editable RequesterApplicant controls should rerun applicant snapshot/quota logic on change for proxy submission scenarios", `${pagePath}.formdef.children`);
      } else if (!actionIds.has(changeAction)) {
        addIssue(warnings, "REQUESTER_APPLICANT_CHANGE_ACTION_UNKNOWN", `RequesterApplicant change action ${changeAction} does not match a form action on this page`, `${pagePath}.formdef.children`);
      }
    }

    actions.forEach((action, actionIndex) => {
      asArray(action && action.steps).forEach((step, stepIndex) => {
        const stepPath = `${pagePath}.formdef.actions[${actionIndex}].steps[${stepIndex}]`;
        if (step && step.type === "setvar") {
          const attrs = step.attrs || {};
          const target = attrs.setvar_var;
          const value = attrs.setvar_val;
          if (requesterHasCurrentUserDefault && target && target.id === "RequesterApplicant" && JSON.stringify(value || "").includes("CurrentUser")) {
            addIssue(warnings, "REQUESTER_APPLICANT_REDUNDANT_CURRENT_USER_SETVAR", "RequesterApplicant already has Default value = Current User; do not generate a duplicate form-action setvar to Current User", stepPath);
          }
        }
        deepWalk(step, (node, pointer) => {
          if (!isObject(node) || node.func !== "getUserAttr") return;
          const subject = JSON.stringify(node.params && node.params[0] || "");
          const stepName = String(step && step.name || "");
          const actionName = String(action && action.name || "");
          const applicantSnapshotContext = /applicant|requester/i.test(`${actionName} ${stepName}`);
          if (applicantSnapshotContext && subject.includes("CurrentUser") && !subject.includes("RequesterApplicant")) {
            addIssue(warnings, "APPLICANT_PROFILE_READS_CURRENT_USER", "Applicant profile snapshot actions should read profile fields from RequesterApplicant, not Context:Current User, after the applicant is initialized", `${stepPath}${pointer.slice(1)}`);
          }
        });
      });
    });
  }

  function validateUiUxStandardPage(page, pagePath) {
    const formdef = page.formdef;
    const container = formdef && formdef.attrs && formdef.attrs.container;
    if (container && container.cw !== "2") {
      addIssue(warnings, "UI_STANDARD_CONTENT_WIDTH_NOT_FULL", "UI/UX standard approval pages should use full-width content area: formdef.attrs.container.cw = \"2\"", `${pagePath}.formdef.attrs.container.cw`);
    }
    if (!zeroPadding(container && container.padding)) {
      addIssue(warnings, "UI_STANDARD_FORM_PADDING_NOT_ZERO", "UI/UX standard approval pages should use zero page padding with --sp--s0 on all sides", `${pagePath}.formdef.attrs.container.padding`);
    }
    const main = findControlByLabel(formdef, "Main");
    const content = findControlByLabel(formdef, "Content");
    if (!main) addIssue(warnings, "UI_STANDARD_MAIN_CONTAINER_MISSING", "Approval pages should have a container with nv_label \"Main\"", `${pagePath}.formdef.children`);
    if (!content) addIssue(warnings, "UI_STANDARD_CONTENT_CONTAINER_MISSING", "Approval pages should have a container with nv_label \"Content\"", `${pagePath}.formdef.children`);
    if (page.type === 1 && !(formdef.attrs && formdef.attrs.background)) {
      addIssue(warnings, "FORM_PAGE_BACKGROUND_MISSING", "Generated full-page submission forms should set page-level formdef.attrs.background instead of relying on Main/Content backgrounds", `${pagePath}.formdef.attrs.background`);
    }
    if (main && main.attrs && main.attrs.common && main.attrs.common.background) {
      addIssue(warnings, "MAIN_CONTAINER_PAGE_BACKGROUND", "Main should stay primarily structural; put full-page form background on formdef.attrs.background", `${pagePath}.formdef.children`);
      if (!(formdef.attrs && formdef.attrs.background)) {
        addIssue(warnings, "FORM_PAGE_BACKGROUND_MISSING_WITH_MAIN_BACKGROUND", "Page/form background is missing while Main carries a background. Generated submission and task pages should use formdef.attrs.background for full-page color.", `${pagePath}.formdef.attrs.background`);
      }
    }
    if (main && content && !controlContains(main, content)) {
      addIssue(warnings, "UI_STANDARD_CONTENT_NOT_INSIDE_MAIN", "Approval page Content container should be inside Main", `${pagePath}.formdef.children`);
    }

    const panels = [];
    const histories = [];
    deepWalk(formdef, (node) => {
      if (!isObject(node)) return;
      if (node.type === "workflowControlPanel") panels.push(node);
      if (node.type === "workflowHistory") histories.push(node);
    });
    const formBody = findControlByLabel(formdef, "Form body");
    const formBottom = findControlByLabel(formdef, "Form bottom");
    const formHeader = findControlByLabel(formdef, "Form header");
    const requestSummary = findControlByLabel(formdef, "Request summary panel");
    if (panels.length || histories.length || page.type === 1 || page.type === 2) {
      if (!formBody) addIssue(warnings, "UI_STANDARD_FORM_BODY_MISSING", "Approval pages should place main fields in a container with nv_label \"Form body\"", `${pagePath}.formdef.children`);
      if (!formBottom) addIssue(warnings, "UI_STANDARD_FORM_BOTTOM_MISSING", "Approval pages should place Action Panel and Flow History in a container with nv_label \"Form bottom\"", `${pagePath}.formdef.children`);
    }
    if (page.type === 1 && requestSummary && !formHeader) {
      addIssue(warnings, "FORM_HEADER_CONTAINER_MISSING", "Submission form request summary should be wrapped by a Form header container so background, border, radius, and overflow are controlled together", `${pagePath}.formdef.children`);
    }
    if (formHeader) {
      const overflow = configValue(formHeader.attrs && formHeader.attrs.style && formHeader.attrs.style.overflow);
      const normalBorder = formHeader.attrs && formHeader.attrs.common && formHeader.attrs.common.border && formHeader.attrs.common.border.normal;
      const normalBackground = formHeader.attrs && formHeader.attrs.common && formHeader.attrs.common.background && formHeader.attrs.common.background.normal;
      if (overflow !== "hidden") addIssue(warnings, "FORM_HEADER_OVERFLOW_NOT_HIDDEN", "Form header containers should set attrs.style.overflow = [null, \"hidden\"] when they carry rounded borders or gradient panels", `${pagePath}.formdef.children`);
      if (!normalBackground) addIssue(warnings, "FORM_HEADER_BACKGROUND_MISSING", "Form header containers should carry an explicit background", `${pagePath}.formdef.children`);
      if (!normalBorder || !normalBorder.radius) addIssue(warnings, "FORM_HEADER_BORDER_RADIUS_MISSING", "Form header containers should carry border radius on attrs.common.border.normal.radius", `${pagePath}.formdef.children`);
    }
    if (formBottom) {
      panels.forEach((panel) => {
        if (!controlContains(formBottom, panel)) addIssue(warnings, "UI_STANDARD_ACTION_PANEL_NOT_IN_FORM_BOTTOM", "workflowControlPanel should be inside Form bottom", `${pagePath}.formdef.children`);
      });
      histories.forEach((history) => {
        if (!controlContains(formBottom, history)) addIssue(warnings, "UI_STANDARD_FLOW_HISTORY_NOT_IN_FORM_BOTTOM", "workflowHistory should be inside Form bottom", `${pagePath}.formdef.children`);
      });
    }
  }

  function walkControls(nodes, context) {
    asArray(nodes).forEach((control, index) => {
      const controlPath = `${context.pagePath}.formdef.children${context.suffix || ""}[${index}]`;
      if (!isObject(control)) return;
      controls.push(control);
      controlEntries.push({ control, path: controlPath, page: context.page, listContext: context.listContext });

      if (typeof control.binding === "string") {
        validateBinding(control.binding, controlPath, context.listContext);
      }
      validateControlSchema(control, controlPath);
      validateApprovalFormUsabilityControl(control, controlPath, context.page);
      validateFormDesignQualityControl(control, controlPath, context.page);

      if (control.type === "list") {
        validateListControl(control, controlPath);
      }

      if (control.attrs && Array.isArray(control.attrs["list-fields"])) {
        const listContext = control.binding;
        control.attrs["list-fields"].forEach((field, fieldIndex) => {
          const fieldPath = `${controlPath}.attrs["list-fields"][${fieldIndex}]`;
          if (field && field.control) {
            controls.push(field.control);
            controlEntries.push({ control: field.control, path: `${fieldPath}.control`, page: context.page, listContext });
            if (typeof field.control.binding === "string") {
              validateBinding(field.control.binding, `${fieldPath}.control`, listContext);
            }
            validateControlSchema(field.control, `${fieldPath}.control`);
            validateApprovalFormUsabilityControl(field.control, `${fieldPath}.control`, context.page);
            validateFormDesignQualityControl(field.control, `${fieldPath}.control`, context.page);
            validateCalculationExpressions(field.control.attrs && field.control.attrs.calculated, `${fieldPath}.control.attrs.calculated`, listContext);
          }
        });
      }

      validateCalculationExpressions(control.attrs && control.attrs.calculated, `${controlPath}.attrs.calculated`, context.listContext);

      for (const child of childControlCollections(control)) {
        walkControls(child.children, {
          page: context.page,
          pagePath: context.pagePath,
          listContext: control.type === "list" ? control.binding : context.listContext,
          suffix: `${context.suffix || ""}[${index}].${child.suffixKey}`,
        });
      }
    });
  }

  function validateFormDesignQualityControl(control, controlPath, page) {
    if (!control || !control.type) return;
    const name = controlName(control);
    const attrs = control.attrs || {};

    if ((control.type === "heading" || control.type === "text-editor") && controlWidthType(control) !== "2") {
      addIssue(warnings, "TEXT_CONTROL_INLINE_WIDTH_MISSING", "Generated text and heading controls should default to inline width via attrs.common.positioning.widthtype = [null, \"2\"] unless intentionally full-row", controlPath, {
        control: name,
        type: control.type,
      });
    }

    if (control.type === "heading") {
      const headingType = attrs.heads && attrs.heads.ty;
      const headingTypeIsPair = Array.isArray(headingType) && headingType[0] === null && typeof headingType[1] === "string";
      const headingTypeIsObject = isObject(headingType);
      if (!headingTypeIsPair && !headingTypeIsObject) {
        addIssue(warnings, "TEXT_CONTROL_TOKEN_TYPOGRAPHY_MISSING", "Generated heading controls should use the Text Style Sample export-backed shape: attrs.heads.ty = [null, \"h5-medium\"] for named presets, or a custom typography object for explicit font settings.", `${controlPath}.attrs.heads.ty`, {
          control: name,
        });
      }
      const headingColor = attrs.heads && attrs.heads.color;
      if (typeof headingColor !== "string") {
        addIssue(warnings, "TEXT_CONTROL_COLOR_SHAPE_UNSAFE", "Generated heading controls should use the Text Style Sample export-backed plain string color shape such as attrs.heads.color = \"var(--c--text)\". Avoid [null, color] here because it can leave the designer style editors unresponsive.", `${controlPath}.attrs.heads.color`, {
          control: name,
        });
      }
    }

    if (control.type === "icon" && controlWidthType(control) !== "2") {
      addIssue(warnings, "ICON_CONTROL_INLINE_WIDTH_MISSING", "Generated icon controls used as visual badges should default to inline width and be centered inside a square wrapper container", controlPath, {
        control: name,
      });
    }

    if (control.type === "container" && String(control.nv_label || "").endsWith(" fields")) {
      const children = asArray(control.children);
      const hasGrid = children.some((child) => child && child.type === "flex_grid");
      const longFullRowTypes = new Set(["textarea", "richtext", "list"]);
      const hasNormalValueControls = children.some((child) => child && isGeneratedValueControl(child.type) && !longFullRowTypes.has(child.type));
      if (hasNormalValueControls && !hasGrid) {
        addIssue(warnings, "FIELD_SECTION_GRID_MISSING", "Generated field sections should place normal value-entry controls in a flex_grid, usually two columns; long controls may sit outside the grid as full-row controls", controlPath, {
          control: name,
        });
      }
    }

    if (control.type === "flex_grid") {
      const target = mode === "final" ? errors : warnings;
      const explicitlyTitled = control.attrs && (control.attrs.layoutRole === "titled-grid" || control.attrs.visibleGridCaption === true);
      if (!explicitlyTitled && !displayLabelDisabled(control.displayLabel) && !displayLabelDisabled(attrs.displayLabel)) {
        addIssue(target, "FIELD_GRID_CAPTION_VISIBLE", "Generated flex_grid controls used for form field layout should set displayLabel = [null, false] so the grid caption is not displayed", `${controlPath}.displayLabel`, {
          control: name,
        });
      }
      if (/(route|routing|status|summary|kpi|metric)/i.test(name) && !displayLabelDisabled(control.displayLabel)) {
        addIssue(warnings, "ROUTE_SUMMARY_GRID_LAYOUT", "Route summaries, KPI blocks, and horizontal information blocks should use container/card blocks with spacing instead of captioned flex_grid controls", controlPath, {
          control: name,
        });
      }
      const desktopColumns = attrs.columns && attrs.columns["1"] && attrs.columns["1"].list;
      if (!Array.isArray(desktopColumns) || desktopColumns.length !== 2) {
        addIssue(warnings, "FIELD_GRID_NOT_TWO_COLUMNS", "Standard generated form field grids should use two desktop columns unless a studied export proves another layout", `${controlPath}.attrs.columns`);
      }
    }

    if (page && page.type === 1 && /(internal routing|approval routing|routing details|budget owner|finance approver|decision notes|reviewer decision|approver notes)/i.test(name)) {
      const target = mode === "final" ? errors : warnings;
      addIssue(target, "SUBMIT_FORM_INTERNAL_ROUTING_DETAILS", "Submission forms should focus on submitter inputs and business context; internal routing, approver, and reviewer decision details belong on task pages unless explicitly requested", controlPath, {
        control: name,
      });
    }

    if ((control.type === "location-picker" || control.type === "cost-center-picker") && (attrs.placeholder !== undefined || attrs.required !== undefined)) {
      addIssue(warnings, "PICKER_CONTROL_RUNTIME_SENSITIVE_ATTRS", "Runtime V2 repaired environment picker controls by re-adding native controls with minimal attrs; generated picker placeholder/required attrs should be export-backed before use", controlPath, {
        control: name,
        type: control.type,
      });
    }

    if (control.type === "file-upload" && attrs.ver !== 1) {
      addIssue(warnings, "FILE_UPLOAD_VERSION_MISSING", "Runtime V2 export stores working file-upload controls with attrs.ver = 1; generated file uploads should include it until another export proves otherwise", `${controlPath}.attrs.ver`, {
        control: name,
      });
    }

    if (control.type === "icon-upload" && attrs.controlmultiple !== true) {
      addIssue(warnings, "ICON_UPLOAD_CONTROL_MULTIPLE_MISSING", "Runtime V2 repaired image/icon upload with attrs.controlmultiple = true; generated icon-upload controls should use the export-backed pattern or fallback", `${controlPath}.attrs.controlmultiple`, {
        control: name,
      });
    }

    const maybeCalculated = /\\b(sub\\s*total|subtotal|total|amount|balance|difference|duration)\\b/i.test(String(control.label || control.nv_label || control.binding || ""));
    if (maybeCalculated && ["input", "input_number", "currency"].includes(control.type) && attrs.readonly !== true && attrs.disabled !== true) {
      addIssue(warnings, "CALCULATED_LOOKING_FIELD_EDITABLE", "Fields that read like calculated values should not default to editable input controls; use a calculated control or readonly display when the requirement implies a formula", controlPath, {
        control: name,
        type: control.type,
      });
    }

    const binding = String(control.binding || "");
    const label = String(control.label || control.nv_label || "");
    const applicantSnapshotField = /^Applicant(?!$)/.test(binding) || /^Applicant\s+/i.test(label);
    const requesterApplicantIdentity = binding === "RequesterApplicant" || /^Requester\s*\/\s*Applicant$/i.test(label);
    if (applicantSnapshotField && !requesterApplicantIdentity && isGeneratedValueControl(control.type) && control.readonly !== true && attrs.readonly !== true && attrs.disabled !== true) {
      addIssue(warnings, "APPLICANT_SNAPSHOT_FIELD_EDITABLE", "Applicant/profile snapshot fields populated from requester data should be readonly by default; only the Requester / Applicant identity picker should remain editable when scoped by the business process", controlPath, {
        control: name,
        binding,
        type: control.type,
      });
    }

    const derivedBindings = new Set([
      "ProductName",
      "ProductType",
      "UnitPrice",
      "ProductRowSubtotal",
      "TotalApplicationAmount",
      "UsedQuotaBefore",
      "RemainingQuotaAfter",
      "EligibilityDate",
      "EligibilityStatus",
      "QuotaExceeded",
      "QuotaUsageStatus",
    ]);
    if (derivedBindings.has(binding) && isGeneratedValueControl(control.type) && control.readonly !== true && attrs.readonly !== true && attrs.disabled !== true) {
      addIssue(warnings, "AUTOFILL_OR_DERIVED_FIELD_EDITABLE", "Lookup/autofill/calculated target fields should be readonly by default unless the user is explicitly expected to override them", controlPath, {
        control: name,
        binding,
        type: control.type,
      });
    }
  }

  function validateControlSchema(control, controlPath) {
    const schemaIssues = validateControlAgainstSchema(control, controlFieldSchemas);
    for (const schemaIssue of schemaIssues) {
      addIssue(
        warnings,
        `CONTROL_${schemaIssue.code}`,
        schemaIssue.message,
        schemaIssue.detail && schemaIssue.detail.path ? `${controlPath}.${schemaIssue.detail.path}` : controlPath,
        schemaIssue.detail
      );
    }
    if (
      mode === "final" &&
      isGeneratedValueControl(control && control.type) &&
      control.readonly !== true &&
      !control.binding
    ) {
      addIssue(
        warnings,
        "CONTROL_BINDING_MISSING_FOR_VALUE_CONTROL",
        "Generated value-entry controls should usually include a binding unless intentionally display-only.",
        controlPath,
        { controlType: control.type, label: control.label || control.nv_label || null }
      );
    }
  }

  function childControlCollections(control) {
    const collections = [];
    if (Array.isArray(control.children)) collections.push({ children: control.children, suffixKey: "children" });
    if (isObject(control.children) && Array.isArray(control.children.children)) collections.push({ children: control.children.children, suffixKey: "children.children" });
    if (Array.isArray(control.columns)) collections.push({ children: control.columns, suffixKey: "columns" });
    return collections;
  }

  function isLookupControl(control) {
    const attrs = control && control.attrs ? control.attrs : {};
    return control && (control.type === "lookup" || control.type === "lookup-list" || attrs.listid || attrs.listId || attrs.listfield || Array.isArray(attrs.addition));
  }

  function validateLookupControls() {
    const controlsByBinding = new Map();
    for (const entry of controlEntries) {
      if (entry.control && typeof entry.control.binding === "string" && !controlsByBinding.has(entry.control.binding)) {
        controlsByBinding.set(entry.control.binding, entry);
      }
    }

    for (const entry of controlEntries) {
      const control = entry.control;
      if (!isLookupControl(control)) continue;
      summary.lookupControls += 1;
      const attrs = control.attrs || {};
      const lookupPath = entry.path;

      const rowFields = entry.listContext ? rowFieldsByListVar.get(entry.listContext) : null;
      const bindingIsRowField = rowFields && rowFields.has(control.binding);
      if (!control.binding || (!variableById.has(control.binding) && !bindingIsRowField)) {
        addIssue(errors, "LOOKUP_BINDING_UNKNOWN", "Lookup control binding must reference variables.basic", `${lookupPath}.binding`);
      } else if (variableById.has(control.binding)) {
        const variable = variableById.get(control.binding);
        if (variable.type !== "lookup") {
          addIssue(errors, "LOOKUP_BINDING_NON_LOOKUP_VARIABLE", "Lookup control should bind to a variables.basic entry with type \"lookup\"", `${lookupPath}.binding`, {
            binding: control.binding,
            variableType: variable.type,
          });
        }
      }

      for (const [key, value] of [["appid", attrs.appid], ["listsetid", attrs.listsetid], ["listid", attrs.listid || attrs.listId], ["listfield", attrs.listfield]]) {
        if (value === undefined || value === null || value === "") {
          addIssue(errors, "LOOKUP_SOURCE_METADATA_MISSING", `Lookup control must include attrs.${key}`, `${lookupPath}.attrs.${key}`);
        }
      }

      if (attrs["sort-first"] !== undefined) {
        const sort = attrs["sort-first"];
        if (!isObject(sort)) {
          addIssue(errors, "LOOKUP_SORT_BAD_SHAPE", "Lookup attrs[\"sort-first\"] must be an object when present", `${lookupPath}.attrs["sort-first"]`);
        } else {
          if (!sort.SortName) addIssue(errors, "LOOKUP_SORT_FIELD_MISSING", "Lookup sort-first must include SortName", `${lookupPath}.attrs["sort-first"].SortName`);
          if (sort.SortByDesc !== undefined && typeof sort.SortByDesc !== "boolean") {
            addIssue(warnings, "LOOKUP_SORT_DIRECTION_NOT_BOOLEAN", "Lookup sort-first.SortByDesc should be boolean", `${lookupPath}.attrs["sort-first"].SortByDesc`);
          }
        }
      }

      if (attrs.multiple === true || attrs.multiple === "true") {
        addIssue(warnings, "LOOKUP_MULTI_SELECT_UNCONFIRMED", "Multi-select lookup controls need a real export example before generator use", `${lookupPath}.attrs.multiple`);
      }

      for (const [index, addition] of asArray(attrs.addition).entries()) {
        const additionPath = `${lookupPath}.attrs.addition[${index}]`;
        if (!isObject(addition)) {
          addIssue(errors, "LOOKUP_ADDITION_BAD_SHAPE", "Lookup additional field mapping must be an object", additionPath);
          continue;
        }
        if (!addition.FieldName) addIssue(errors, "LOOKUP_ADDITION_SOURCE_FIELD_MISSING", "Lookup additional mapping must include source FieldName", `${additionPath}.FieldName`);
        if (!addition.FieldID) addIssue(errors, "LOOKUP_ADDITION_SOURCE_FIELD_ID_MISSING", "Lookup additional mapping must include source FieldID", `${additionPath}.FieldID`);
        if (!addition.RelationName) {
          addIssue(errors, "LOOKUP_ADDITION_TARGET_VARIABLE_MISSING", "Lookup additional mapping must include RelationName target variable", `${additionPath}.RelationName`);
        } else if (!variableById.has(addition.RelationName) && !(rowFields && rowFields.has(addition.RelationName))) {
          addIssue(errors, "LOOKUP_ADDITION_TARGET_VARIABLE_NOT_FOUND", "Lookup additional mapping RelationName must reference variables.basic", `${additionPath}.RelationName`, {
            relationName: addition.RelationName,
          });
        } else {
          const targetControl = controlsByBinding.get(addition.RelationName);
          if (!targetControl) {
            addIssue(warnings, "LOOKUP_DERIVED_TARGET_CONTROL_NOT_FOUND", "Lookup additional target variable exists but no visible control is bound to it", additionPath, {
              relationName: addition.RelationName,
            });
          } else if (targetControl.control.readonly !== true) {
            addIssue(warnings, "LOOKUP_DERIVED_TARGET_CONTROL_EDITABLE", "Control populated by lookup additional mapping should usually be readonly", targetControl.path, {
              relationName: addition.RelationName,
              controlType: targetControl.control.type,
              controlLabel: targetControl.control.label,
            });
          }
        }
        if (addition.RelationFieldIsMultiple === true || addition.RelationFieldIsMultiple === "true") {
          addIssue(warnings, "LOOKUP_ADDITION_MULTI_SELECT_UNCONFIRMED", "Additional field mappings for multi-select lookup need a real export example before generator use", `${additionPath}.RelationFieldIsMultiple`);
        }
      }
    }
  }

  function validateApprovalFormUsabilityControl(control, controlPath, page) {
    if (!control || !page || page.type !== 1) return;
    const attrs = control.attrs || {};
    if (control.readonly === true && (control.binding === "Applicant" || control.label === "Applicant")) {
      if (control.value !== "CurrentUser") {
        addIssue(errors, "APPLICANT_CURRENT_USER_VALUE_MISSING", "Readonly Applicant control should use value \"CurrentUser\"", `${controlPath}.value`);
      }
      if (attrs.default !== "currentUser") {
        addIssue(errors, "APPLICANT_CURRENT_USER_DEFAULT_MISSING", "Readonly Applicant control should use attrs.default \"currentUser\"", `${controlPath}.attrs.default`);
      }
    }

    if (control.readonly === true && (control.binding === "SubmissionDate" || control.label === "Submission Date")) {
      if (attrs.default !== "currentDate") {
        addIssue(errors, "SUBMISSION_DATE_CURRENT_DATE_DEFAULT_MISSING", "Readonly Submission Date control should use attrs.default \"currentDate\"", `${controlPath}.attrs.default`);
      }
      if (attrs.date_type !== "0") {
        addIssue(errors, "SUBMISSION_DATE_DATE_TYPE_MISSING", "Readonly Submission Date control should use attrs.date_type \"0\"", `${controlPath}.attrs.date_type`);
      }
    }

    if (control.type === "datepicker" && typeof control.value === "string" && /^\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}:\d{2})?$/.test(control.value) && attrs.default !== "currentDate") {
      addIssue(warnings, "DATEPICKER_STATIC_DEFAULT_WITHOUT_CURRENT_DATE", "Datepicker has a static timestamp value but lacks attrs.default \"currentDate\"", `${controlPath}.value`);
    }
  }

  function validateBinding(binding, controlPath, listContext) {
    if (variableById.has(binding)) return;
    if (listContext && rowFieldsByListVar.get(listContext) && rowFieldsByListVar.get(listContext).has(binding)) return;
    addIssue(errors, "CONTROL_BINDING_UNKNOWN", `Control binding ${binding} does not reference a variable or valid list row field`, `${controlPath}.binding`);
  }

  function validateListControl(control, controlPath) {
    if (typeof control.binding !== "string" || !variableById.has(control.binding)) {
      addIssue(errors, "LIST_CONTROL_UNKNOWN_BINDING", "List control binding must reference variables.basic", `${controlPath}.binding`);
      return;
    }
    const listVar = variableById.get(control.binding);
    if (listVar.type !== "list") {
      addIssue(errors, "LIST_CONTROL_NON_LIST_BINDING", `List control ${control.binding} must bind to a variable of type list`, `${controlPath}.binding`);
      return;
    }
    const listref = listrefById.get(listVar.value);
    if (!listref) {
      addIssue(errors, "LIST_CONTROL_MISSING_LISTREF", `List control ${control.binding} points to missing listref ${listVar.value}`, `${controlPath}.binding`);
      return;
    }
    if (!control.attrs || !Array.isArray(control.attrs["list-fields"])) {
      addIssue(errors, "LIST_CONTROL_MISSING_FIELDS", "List control must have attrs[\"list-fields\"]", `${controlPath}.attrs`);
      return;
    }
    if (!Array.isArray(control.attrs["list-variables"])) {
      addIssue(errors, "LIST_CONTROL_MISSING_VARIABLES", "List control must have attrs[\"list-variables\"]", `${controlPath}.attrs`);
    }
    const expected = new Set(asArray(listref.fields).map((f) => f.id));
    const actual = new Set(control.attrs["list-fields"].map((f) => f && f.id).filter(Boolean));
    const listVariables = new Set(asArray(control.attrs["list-variables"]).map((f) => f && f.id).filter(Boolean));
    expected.forEach((id) => {
      if (actual.has(id)) return;
      if (listVariables.has(id)) {
        addIssue(warnings, "LIST_FIELD_HIDDEN_FROM_UI", `List control ${control.binding} does not render row field ${id} in list-fields, but it exists in list-variables`, `${controlPath}.attrs["list-fields"]`);
      } else if (control.readonly === true) {
        addIssue(warnings, "LIST_FIELD_HIDDEN_ON_READONLY_PAGE", `Readonly list control ${control.binding} does not render row field ${id}; this is allowed when the submit page owns calculation/summary display.`, `${controlPath}.attrs["list-fields"]`);
      } else {
        addIssue(errors, "LIST_FIELD_MISSING", `List control ${control.binding} is missing row field ${id}`, `${controlPath}.attrs["list-fields"]`);
      }
    });
    actual.forEach((id) => {
      if (!expected.has(id)) addIssue(errors, "LIST_FIELD_EXTRA", `List control ${control.binding} has row field not in listref: ${id}`, `${controlPath}.attrs["list-fields"]`);
    });
    validateListSummaries(control, controlPath, listref);
    validateSubListDynamicLayout(control, controlPath, listref);
    validateSubListActions(control, controlPath);
  }

  function validateSubListDynamicLayout(control, controlPath, listref) {
    const attrs = control.attrs || {};
    const layout = attrs["list-display-preference"];
    if (layout && !["default", "responsive", "table", "table-view", "card", "card-view", "dynamic"].includes(String(layout))) {
      addIssue(warnings, "SUBLIST_LAYOUT_MODE_UNSTUDIED", "Sub List layout mode is not covered by current export-backed validation.", `${controlPath}.attrs["list-display-preference"]`, { layout });
    }
    if (layout !== "dynamic") return;

    const body = asArray(control.children).find((child) => child && child.type === "list-body");
    if (!body) {
      addIssue(errors, "SUBLIST_DYNAMIC_BODY_MISSING", "Dynamic content Sub List must include a list-body template container.", `${controlPath}.children`);
      return;
    }
    const templateControls = [];
    deepWalk(body.children, (node, pointer) => {
      if (isObject(node) && node.type) templateControls.push({ node, pointer });
    });
    if (!templateControls.length) {
      addIssue(errors, "SUBLIST_DYNAMIC_TEMPLATE_EMPTY", "Dynamic content Sub List must include child controls inside list-body.", `${controlPath}.children`);
    }
    if (!displayLabelDisabled(control.displayLabel) && !displayLabelDisabled(attrs.displayLabel)) {
      addIssue(warnings, "SUBLIST_DYNAMIC_CAPTION_VISIBLE", "Generated table-style Dynamic Sub Lists should turn off Display caption with displayLabel = [null,false].", `${controlPath}.displayLabel`);
    }
    const bodyGrids = templateControls.filter(({ node }) => node.type === "flex_grid" || node.type === "grid");
    if (asArray(attrs["list-fields"]).length >= 3 && !bodyGrids.length) {
      addIssue(warnings, "SUBLIST_DYNAMIC_TABLE_BODY_GRID_MISSING", "Generated table-style Dynamic Sub Lists should use a grid/flex_grid as the first list-body layout control so header and row columns align.", `${controlPath}.children[list-body]`);
    }
    for (const { node, pointer } of bodyGrids) {
      if (!displayLabelDisabled(node.displayLabel) && !displayLabelDisabled(node.attrs && node.attrs.displayLabel)) {
        addIssue(warnings, "SUBLIST_DYNAMIC_BODY_GRID_CAPTION_VISIBLE", "Grid/flex_grid controls inside Dynamic Sub List bodies should turn off Display caption unless a visible grid title is intentional.", `${controlPath}.children[list-body]${pointer.slice(1)}.displayLabel`);
      }
      const columns = node.attrs && node.attrs.columns;
      const columnCount = isObject(columns)
        ? Math.max(0, ...Object.keys(columns).map((key) => Number(key)).filter(Number.isFinite))
        : asArray(columns).length;
      if (columnCount && asArray(node.children).length && asArray(node.children).length < columnCount) {
        addIssue(warnings, "SUBLIST_DYNAMIC_BODY_GRID_COLUMN_CHILDREN_MISMATCH", "Dynamic Sub List body grid has fewer child controls than configured column tracks; Designer/render alignment may be fragile.", `${controlPath}.children[list-body]${pointer.slice(1)}.children`);
      }
    }
    const rowFields = new Set(asArray(listref && listref.fields).map((field) => field && field.id).filter(Boolean));
    templateControls.forEach(({ node, pointer }) => {
      const nodePath = `${controlPath}.children[list-body]${pointer.slice(1)}`;
      if (!node.attrs || node.attrs.list_field !== true) return;
      if (node.attrs.list_field_binding !== control.binding) {
        addIssue(errors, "SUBLIST_DYNAMIC_FIELD_BINDING_MISMATCH", "Sub List field controls inside a dynamic item template must keep attrs.list_field_binding equal to the parent Sub List binding.", `${nodePath}.attrs.list_field_binding`, {
          expected: control.binding,
          actual: node.attrs.list_field_binding,
        });
      }
      if (node.binding && !rowFields.has(node.binding)) {
        addIssue(errors, "SUBLIST_DYNAMIC_FIELD_UNRESOLVED", `Dynamic item template field binding ${node.binding} is not declared in the Sub List listref fields.`, `${nodePath}.binding`);
      }
    });

    const css = attrs.common && attrs.common.css;
    if (typeof css === "string" && css.includes(".dynamic-list .list-footer") && !css.includes("position: absolute")) {
      addIssue(warnings, "SUBLIST_DYNAMIC_FOOTER_CSS_UNEXPECTED", "A .dynamic-list .list-footer custom CSS rule is present but differs from the export-proven fixed-footer pattern; preserve intentionally but verify layout.", `${controlPath}.attrs.common.css`);
    }
  }

  function validateSubListActions(control, controlPath) {
    const actions = control.attrs && control.attrs.actions;
    if (actions === undefined) return;
    if (!Array.isArray(actions)) {
      addIssue(errors, "SUBLIST_ACTIONS_NOT_ARRAY", "Sub List attrs.actions must be an array when list actions are configured.", `${controlPath}.attrs.actions`);
      return;
    }
    const allowedStepTypes = new Set(["list_new", "list_import", "list_dup", "list_del", "list_move", "list_update"]);
    actions.forEach((action, actionIndex) => {
      const actionPath = `${controlPath}.attrs.actions[${actionIndex}]`;
      if (!isObject(action)) {
        addIssue(errors, "SUBLIST_ACTION_BAD_SHAPE", "Sub List action entries must be objects.", actionPath);
        return;
      }
      if (action.type !== "list") {
        addIssue(warnings, "SUBLIST_ACTION_TYPE_UNEXPECTED", "Export-proven Sub List actions use type = \"list\".", `${actionPath}.type`, { type: action.type });
      }
      if (!action.id) addIssue(warnings, "SUBLIST_ACTION_ID_MISSING", "Sub List action should include an id so action_button.attrs.control_action can resolve.", `${actionPath}.id`);
      if (!action.name) addIssue(warnings, "SUBLIST_ACTION_NAME_MISSING", "Sub List action should include a readable name.", `${actionPath}.name`);
      if (!Array.isArray(action.steps) || action.steps.length === 0) {
        addIssue(errors, "SUBLIST_ACTION_STEPS_EMPTY", "Sub List action must include at least one step definition.", `${actionPath}.steps`);
        return;
      }
      action.steps.forEach((step, stepIndex) => {
        const stepPath = `${actionPath}.steps[${stepIndex}]`;
        if (!isObject(step)) {
          addIssue(errors, "SUBLIST_ACTION_STEP_BAD_SHAPE", "Sub List action steps must be objects.", stepPath);
          return;
        }
        if (!step.type) {
          addIssue(errors, "SUBLIST_ACTION_STEP_TYPE_MISSING", "Sub List action steps must include type.", `${stepPath}.type`);
        } else if (!allowedStepTypes.has(step.type)) {
          addIssue(warnings, "SUBLIST_ACTION_STEP_TYPE_UNSTUDIED", "Sub List action step type is not export-proven by the current study.", `${stepPath}.type`, { type: step.type });
        }
        if (step.type === "list_new" && step.attrs && step.attrs.position !== undefined && !["0", "1"].includes(String(step.attrs.position))) {
          addIssue(warnings, "SUBLIST_ACTION_INSERT_POSITION_UNEXPECTED", "Insert-before/after Sub List actions use list_new with attrs.position \"0\" or \"1\" in the studied export.", `${stepPath}.attrs.position`, { position: step.attrs.position });
        }
      });
    });
  }

  function validateListSummaries(control, controlPath, listref) {
    const summaries = asArray(control.attrs && control.attrs["list-fields-summary"]);
    if (!summaries.length) return;
    const fields = new Map(asArray(listref.fields).map((field) => [field.id, field]));
    summaries.forEach((summaryEntry, summaryIndex) => {
      const p = `${controlPath}.attrs["list-fields-summary"][${summaryIndex}]`;
      if (!summaryEntry || typeof summaryEntry !== "object") {
        addIssue(errors, "LIST_SUMMARY_BAD_ENTRY", "List summary entry must be an object", p);
        return;
      }
      const sourceField = fields.get(summaryEntry.field);
      if (!sourceField) {
        addIssue(errors, "LIST_SUMMARY_UNKNOWN_FIELD", `List summary references missing row field ${summaryEntry.field}`, `${p}.field`);
        return;
      }
      const summaryType = summaryEntry.type;
      const isNumericField = sourceField.type === "number" || sourceField.type === "currency" || sourceField.type === "percent";
      const allowedTypes = isNumericField ? new Set(["total", "avg", "max", "min", "concat"]) : new Set(["concat"]);
      if (!allowedTypes.has(summaryType)) {
        addIssue(warnings, "LIST_SUMMARY_TYPE_FIELD_MISMATCH", `Summary type ${summaryType} may not be compatible with ${sourceField.type} row field ${sourceField.id}`, `${p}.type`, {
          field: sourceField.id,
          fieldType: sourceField.type,
          summaryType,
        });
      }
      if (summaryEntry.binding) {
        if (!Object.prototype.hasOwnProperty.call(summaryEntry.binding, "prefix")) {
          addIssue(errors, "LIST_SUMMARY_BINDING_PREFIX_MISSING", "List summary binding must contain literal key prefix", `${p}.binding`);
        } else if (summaryEntry.binding.prefix !== "__variables_") {
          addIssue(warnings, "LIST_SUMMARY_BINDING_PREFIX_UNEXPECTED", "List summary binding prefix should normally be __variables_", `${p}.binding.prefix`, {
            prefix: summaryEntry.binding.prefix,
          });
        }
        for (const key of Object.keys(summaryEntry.binding)) {
          if (CORRUPTED_REPLACEMENT_KEY_RE.test(key)) {
            addIssue(errors, "LIST_SUMMARY_BINDING_CORRUPTED_PREFIX_KEY", `List summary binding contains corrupted prefix key ${key}`, `${p}.binding.${key}`, {
              key,
            });
          }
        }
        const target = summaryEntry.binding.value;
        const targetVar = variableById.get(target);
        if (!targetVar) {
          addIssue(errors, "LIST_SUMMARY_BINDING_UNKNOWN_VARIABLE", `List summary binding target variable ${target} does not exist`, `${p}.binding.value`);
        } else if (isNumericField && targetVar.type !== "number") {
          addIssue(errors, "LIST_SUMMARY_BINDING_TYPE_MISMATCH", `Numeric list summary ${summaryEntry.field} should bind to a number variable`, `${p}.binding.value`, {
            target,
            targetType: targetVar.type,
          });
        }
      }
    });
  }

  function validateCalculationExpressions(expr, exprPath, listContext) {
    if (!expr) return;
    validateExpressionStructure(expr, exprPath);
    deepWalk(expr, (node, pointer) => {
      if (!isObject(node) || node.exprType !== "variable") return;
      const id = node.id;
      if (!id) return;
      if (variableById.has(id)) return;
      if (listContext && rowFieldsByListVar.get(listContext) && rowFieldsByListVar.get(listContext).has(id)) return;
      addIssue(errors, "CALC_UNKNOWN_VARIABLE", `Calculation references unknown variable ${id}`, `${exprPath}${pointer.slice(1)}`);
    });
    deepWalk(expr, (node, pointer) => {
      if (!isObject(node) || node.exprType !== "variable_ctx") return;
      const ctx = node.ctx;
      const id = node.id;
      if (!rowFieldsByListVar.has(ctx) || !rowFieldsByListVar.get(ctx).has(id)) {
        addIssue(errors, "CALC_UNKNOWN_ROW_FIELD", `Calculation references unknown row field ${ctx}.${id}`, `${exprPath}${pointer.slice(1)}`);
      }
    });
  }

  function validateExpressionStructure(expr, exprPath) {
    const report = validateExpressionTokens(expr, { path: exprPath });
    report.issues.forEach((entry) => {
      const target = entry.code === "EXPRESSION_NOT_ARRAY" || entry.code === "EXPRESSION_VARIABLE_MISSING_PROPERTY" ? errors : warnings;
      addIssue(target, entry.code, entry.message, entry.path, entry.detail);
    });
  }

  function validateTaskUrls() {
    childshapes.forEach((shape, index) => {
      if (!shape || !shape.stencil) return;
      const type = shape.stencil.id;
      const props = shape.properties || {};
      const aliases = ["taskurl", "taskUrl", "TaskUrl"].map((key) => ({ key, value: String(props[key] || "") }));
      const first = aliases.find((entry) => entry.value);
      const taskurl = first && first.value;
      const p = `$.childshapes[${index}].properties.taskurl`;
      if (type === "StartNoneEvent") {
        if (!requestPageIds.has(taskurl)) addIssue(errors, "START_TASKURL_BAD_PAGE", "StartNoneEvent.properties.taskurl must reference a request page id", p);
      }
      if (type === "MultiAssignmentTask" || type === "CandidateTask") {
        const label = type === "CandidateTask" ? "Claim Task" : "MultiAssignmentTask";
        if (!taskurl) {
          addIssue(errors, "APPROVAL_TASKURL_MISSING", `${label} must reference a task form/page; missing or null TaskUrl blocks generated approval workflow publish readiness`, p);
          return;
        }
        if (aliases.some((entry) => entry.value !== taskurl)) {
          addIssue(errors, "APPROVAL_TASKURL_ALIASES_NOT_MIRRORED", `${label} task form references must be mirrored across properties.taskurl, properties.taskUrl, and properties.TaskUrl`, p, {
            taskurl: props.taskurl || null,
            taskUrl: props.taskUrl || null,
            TaskUrl: props.TaskUrl || null,
          });
        }
        const taskPage = pages.find((page) => page && page.id === taskurl);
        if (!approvalPageIds.has(taskurl)) addIssue(errors, "APPROVAL_TASKURL_BAD_PAGE", `${label}.properties.taskurl must reference an approval task page id`, p);
        if (taskPage && taskPage.pagetype !== 1) addIssue(errors, "APPROVAL_TASK_PAGE_OUTER_PAGETYPE_INVALID", `${label} referenced task page must use outer pagetype = 1`, `$.pageurls`, { taskurl, pagetype: taskPage.pagetype });
        if (props.pagetype !== 1) addIssue(errors, "APPROVAL_TASK_NODE_PAGETYPE_INVALID", `${label} workflow node must carry properties.pagetype = 1`, `$.childshapes[${index}].properties.pagetype`, { pagetype: props.pagetype });
      }
    });
  }

  function validateWorkflowGraph() {
    const nodeById = new Map();
    const seqById = new Map();
    const sourceBySeqId = new Map();
    childshapes.forEach((shape) => {
      const id = shapeId(shape);
      if (!id) return;
      if (isSequenceFlow(shape)) seqById.set(id, shape);
      else nodeById.set(id, shape);
    });

    childshapes.forEach((shape, index) => {
      if (!shape || isSequenceFlow(shape)) return;
      const p = `$.childshapes[${index}]`;
      const id = shapeId(shape);
      if (!shape.id || shape.id !== shape.resourceid) {
        addIssue(errors, "GRAPH_NODE_ID_MISSING_OR_MISMATCHED", "Workflow node must include id matching resourceid for designer layout", `${p}.id`, {
          id: shape.id,
          resourceid: shape.resourceid,
        });
      }
      if (!isObject(shape.position) || typeof shape.position.x !== "number" || typeof shape.position.y !== "number") {
        addIssue(errors, "GRAPH_NODE_POSITION_MISSING", "Workflow node must include top-level position {x, y} for designer layout", `${p}.position`, { nodeId: id });
      }
      for (const outgoing of asArray(shape.outgoing)) {
        const id = refId(outgoing);
        if (!seqById.has(id)) addIssue(errors, "OUTGOING_SEQUENCE_MISSING", `Outgoing SequenceFlow ${id} does not exist`, `$.childshapes[${index}].outgoing`);
        else sourceBySeqId.set(id, shapeId(shape));
        if (!outgoing || outgoing.id !== outgoing.resourceid) {
          addIssue(errors, "OUTGOING_SEQUENCE_REF_INCOMPLETE", "Outgoing SequenceFlow reference should include matching id and resourceid", `$.childshapes[${index}].outgoing`);
        }
      }
      for (const incoming of asArray(shape.incoming)) {
        const id = refId(incoming);
        if (!seqById.has(id)) addIssue(errors, "INCOMING_SEQUENCE_MISSING", `Incoming SequenceFlow ${id} does not exist`, `$.childshapes[${index}].incoming`);
        if (!incoming || incoming.id !== incoming.resourceid) {
          addIssue(errors, "INCOMING_SEQUENCE_REF_INCOMPLETE", "Incoming SequenceFlow reference should include matching id and resourceid", `$.childshapes[${index}].incoming`);
        }
      }
    });

    childshapes.forEach((shape, index) => {
      if (!isSequenceFlow(shape)) return;
      const p = `$.childshapes[${index}]`;
      const id = shapeId(shape);
      if (!shape.id || shape.id !== shape.resourceid) {
        addIssue(errors, "SEQUENCE_ID_MISSING_OR_MISMATCHED", "SequenceFlow must include id matching resourceid for designer layout", `${p}.id`, {
          id: shape.id,
          resourceid: shape.resourceid,
        });
      }
      const explicitSource = refId(shape.source);
      if (!explicitSource || !nodeById.has(explicitSource)) {
        addIssue(errors, "SEQUENCE_EXPLICIT_SOURCE_MISSING", `SequenceFlow ${id} source.resourceid must reference an existing non-SequenceFlow node`, `${p}.source`);
      }
      const target = refId(shape.target);
      if (!target || !nodeById.has(target)) {
        addIssue(errors, "SEQUENCE_TARGET_MISSING", `SequenceFlow ${id} target.resourceid must reference an existing non-SequenceFlow node`, `${p}.target`);
      }
      const inferredSource = sourceBySeqId.get(id);
      if (!inferredSource) {
        addIssue(errors, "SEQUENCE_SOURCE_MISSING", `SequenceFlow ${id} should have an inferred source from a node outgoing reference`, p);
      } else if (explicitSource && inferredSource !== explicitSource) {
        addIssue(errors, "SEQUENCE_SOURCE_MISMATCH", `SequenceFlow ${id} explicit source does not match node outgoing reference`, `${p}.source`, {
          explicitSource,
          inferredSource,
        });
      }
      const targetNode = target && nodeById.get(target);
      const targetIncoming = asArray(targetNode && targetNode.incoming).map(refId);
      if (targetNode && !targetIncoming.includes(id)) {
        addIssue(errors, "SEQUENCE_TARGET_INCOMING_MISSING", `SequenceFlow ${id} target node must include the flow in incoming`, `${p}.target`, {
          target,
        });
      }
    });

    const starts = [...nodeById.values()].filter((shape) => shape.stencil && shape.stencil.id === "StartNoneEvent");
    if (starts.length === 0) {
      addIssue(errors, "START_MISSING", "StartNoneEvent must exist", "$.childshapes");
      return;
    }
    const reachable = new Set();
    const queue = starts.map(shapeId);
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || reachable.has(current)) continue;
      reachable.add(current);
      const node = nodeById.get(current);
      for (const outgoing of asArray(node && node.outgoing)) {
        const seq = seqById.get(refId(outgoing));
        const target = seq && refId(seq.target);
        if (target && !reachable.has(target)) queue.push(target);
      }
    }
    const endReachable = [...reachable].some((id) => nodeById.get(id) && nodeById.get(id).stencil.id === "EndNoneEvent");
    if (!endReachable) addIssue(errors, "END_NOT_REACHABLE", "EndNoneEvent must be reachable from StartNoneEvent", "$.childshapes");
    const hasApproval = [...nodeById.values()].some((shape) => shape.stencil.id === "MultiAssignmentTask");
    const rejectReachable = [...reachable].some((id) => nodeById.get(id) && nodeById.get(id).stencil.id === "EndRejectEvent");
    if (hasApproval && !rejectReachable) {
      addIssue(errors, "REJECT_END_NOT_REACHABLE", "EndRejectEvent should be reachable from StartNoneEvent when approval tasks exist", "$.childshapes");
    }
  }

  function validateApprovalTasks() {
    const seqById = new Map(childshapes.filter(isSequenceFlow).map((shape) => [shapeId(shape), shape]));
    childshapes.forEach((shape, index) => {
      if (!shape || !shape.stencil || shape.stencil.id !== "MultiAssignmentTask") return;
      const p = `$.childshapes[${index}]`;
      const props = shape.properties || {};
      if (!props.approveway) addIssue(errors, "APPROVAL_MISSING_APPROVEWAY", "Approval task must have approveway", `${p}.properties.approveway`);
      if (props.approvepercentage === undefined) addIssue(errors, "APPROVAL_MISSING_PERCENTAGE", "Approval task must have approvepercentage", `${p}.properties.approvepercentage`);
      if (!Array.isArray(props.usertaskassignment)) addIssue(errors, "APPROVAL_ASSIGNMENT_NOT_ARRAY", "usertaskassignment must be an array", `${p}.properties.usertaskassignment`);
      for (const [assignmentIndex, assignment] of asArray(props.usertaskassignment).entries()) {
        if (assignment && assignment.method === "users" && Array.isArray(assignment.value) && assignment.value.length > 0) {
          addIssue(warnings, "APPROVAL_DIRECT_USER_ASSIGNMENT_TENANT_SENSITIVE", "Direct user assignee IDs are tenant-sensitive and can fail publish after import. Prefer requester/current-user expression assignment unless an export-backed valid user mapping is intentionally supplied.", `${p}.properties.usertaskassignment[${assignmentIndex}]`);
        }
      }
      if (!props.taskurl) addIssue(errors, "APPROVAL_MISSING_TASKURL", "Approval task must have taskurl", `${p}.properties.taskurl`);

      let approved = false;
      let rejected = false;
      let completed = false;
      for (const outgoing of asArray(shape.outgoing)) {
        const seq = seqById.get(refId(outgoing));
        const text = JSON.stringify((seq && seq.properties && seq.properties.conditioninfo) || []);
        if (text.includes("Task outcome:Approved") || text.includes("已同意") || text.includes("Approved")) approved = true;
        if (text.includes("Task outcome:Rejected") || text.includes("Rejected")) rejected = true;
        if (text.includes("Task outcome:Completed") || text.includes("Completed")) completed = true;
      }
      if (props.tasktype === "complete") {
        if (!completed) addIssue(errors, "COMPLETE_TASK_COMPLETED_PATH_MISSING", "Complete task must have at least one Completed outgoing condition", `${p}.outgoing`);
        return;
      }
      if (!approved) addIssue(errors, "APPROVAL_APPROVED_PATH_MISSING", "Approval task must have at least one Approved outgoing condition", `${p}.outgoing`);
      if (!rejected && props.allowNoRejectedPath !== true) {
        addIssue(errors, "APPROVAL_REJECTED_PATH_MISSING", "Approval task must have at least one Rejected outgoing condition unless explicitly marked otherwise", `${p}.outgoing`);
      }
    });
  }

  function validateSequenceFlowConditions() {
    function looksLikeConditionExpressionArray(value) {
      return Array.isArray(value) && value.some((entry) => isObject(entry) && (
        entry.type === "op" ||
        entry.type === "func" ||
        entry.type === "str" ||
        entry.type === "num" ||
        entry.type === "bool" ||
        entry.exprType === "variable" ||
        entry.exprType === "application" ||
        entry.exprType === "variable_ctx"
      ));
    }
    function validateOperandWrapper(operand, side, p) {
      if (typeof operand === "string") {
        if (operand.includes("<input") && operand.includes("Workflow Variables:")) {
          addIssue(warnings, "SEQUENCE_CONDITION_LEGACY_HTML_OPERAND", "Workflow transition condition uses legacy HTML expression-button operand; prefer export-backed operand wrapper objects for newly generated conditions", p);
        }
        return;
      }
      if (!isObject(operand)) return;
      if (![0, 1, 2].includes(operand.type)) {
        addIssue(warnings, "SEQUENCE_CONDITION_OPERAND_UNKNOWN_TYPE", "Workflow transition condition operand wrapper should use type 0 direct value, type 1 direct selector, or type 2 expression editor", `${p}.type`, { side, type: operand.type });
        return;
      }
      if (!Object.prototype.hasOwnProperty.call(operand, "value")) {
        addIssue(warnings, "SEQUENCE_CONDITION_OPERAND_MISSING_VALUE", "Workflow transition condition operand wrapper should include value", `${p}.value`, { side, type: operand.type });
      }
      if (operand.type === 2 && !looksLikeConditionExpressionArray(operand.value)) {
        addIssue(warnings, "SEQUENCE_CONDITION_EXPR_OPERAND_BAD_VALUE", "Expression-editor workflow transition condition operands should store an expression-token array in value", `${p}.value`, { side });
      }
      if (operand.type === 1 && !isObject(operand.value)) {
        addIssue(warnings, "SEQUENCE_CONDITION_DIRECT_SELECTOR_BAD_VALUE", "Direct-selector workflow transition condition operands should store the selected variable/field token object in value", `${p}.value`, { side });
      }
    }
    childshapes.forEach((shape, index) => {
      if (!isSequenceFlow(shape)) return;
      const conditions = asArray(shape.properties && shape.properties.conditioninfo);
      conditions.forEach((condition, conditionIndex) => {
        const p = `$.childshapes[${index}].properties.conditioninfo[${conditionIndex}]`;
        const text = JSON.stringify(condition);
        validateOperandWrapper(condition.left, "left", `${p}.left`);
        validateOperandWrapper(condition.right, "right", `${p}.right`);
        const isApprovalOutcome = text.includes("&quot;type&quot;:&quot;task&quot;") || text.includes(":Outcome") || text.includes(":结果");
        if (isApprovalOutcome) {
          if (condition.op !== "s.=") addIssue(errors, "APPROVAL_CONDITION_BAD_OP", "Approval outcome condition should use op: s.=", `${p}.op`);
          if (!text.includes("Outcome") && !text.includes("结果")) addIssue(errors, "APPROVAL_CONDITION_MISSING_OUTCOME", "Approval outcome condition should include task Outcome reference", p);
          if (!text.includes("Task outcome:Approved") && !text.includes("Task outcome:Rejected") && !text.includes("Task outcome:Completed") && !text.includes("任务结果:已同意")) {
            addIssue(errors, "APPROVAL_CONDITION_MISSING_RESULT", "Approval outcome condition should include Task outcome:Approved, Task outcome:Rejected, or Task outcome:Completed", p);
          }
        }
        const isNumeric = condition.group === "number" || (typeof condition.op === "string" && condition.op.startsWith("n."));
        if (isNumeric) {
          if (condition.group !== "number") addIssue(warnings, "NUMERIC_CONDITION_MISSING_GROUP", "Numeric threshold condition should include group: number", `${p}.group`);
          if (!NUMERIC_OPS.has(condition.op)) addIssue(errors, "NUMERIC_CONDITION_BAD_OP", "Numeric threshold condition has unsupported operator", `${p}.op`);
          const leftValue = condition.left && (condition.left.value || condition.left);
          const rightValue = condition.right && (condition.right.value !== undefined ? condition.right.value : condition.right);
          if (!leftValue || leftValue.valueType !== "number" || !variableById.has(leftValue.id)) {
            addIssue(errors, "NUMERIC_CONDITION_BAD_LEFT", "Numeric threshold left value must reference an existing number variable", `${p}.left`);
          }
          const rightToken = Array.isArray(rightValue) && rightValue.length === 1 ? rightValue[0] : null;
          const rightTokenNumeric = rightToken && rightToken.type === "num" && !Number.isNaN(Number(rightToken.value));
          if (typeof rightValue !== "number" && !(typeof rightValue === "string" && rightValue.trim() !== "" && !Number.isNaN(Number(rightValue))) && !rightTokenNumeric) {
            addIssue(errors, "NUMERIC_CONDITION_BAD_RIGHT", "Numeric threshold right value must be numeric", `${p}.right`);
          }
        }
      });
    });
  }

  function validateContentLists() {
    childshapes.forEach((shape, index) => {
      if (!shape || !shape.stencil || shape.stencil.id !== "ContentList") return;
      const p = `$.childshapes[${index}]`;
      const props = shape.properties || {};
      for (const key of ["type", "appid", "listsetid", "listid", "listtype"]) {
        if (props[key] === undefined || props[key] === null || props[key] === "") {
          addIssue(errors, "CONTENTLIST_MISSING_TARGET", `ContentList must have properties.${key}`, `${p}.properties.${key}`);
        }
      }
      if (["add", "edit"].includes(props.type) && !Array.isArray(props.listdatas)) {
        addIssue(errors, "CONTENTLIST_MISSING_LISTDATAS", "ContentList add/edit operations must have listdatas", `${p}.properties.listdatas`);
      }
      if (["edit", "remove"].includes(props.type) && !Array.isArray(props.wheres)) {
        addIssue(errors, "CONTENTLIST_MISSING_WHERES", "ContentList edit/remove operations must have wheres", `${p}.properties.wheres`);
      }
      asArray(props.listdatas).forEach((entry, entryIndex) => {
        validateDataExpression(entry && entry.Data, `${p}.properties.listdatas[${entryIndex}].Data`);
      });
      asArray(props.wheres).forEach((where, whereIndex) => {
        validateDataExpression(where && where.right, `${p}.properties.wheres[${whereIndex}].right`);
      });
    });
  }

  function validateDataExpression(value, valuePath) {
    if (value === null || value === undefined) return;
    if (typeof value === "number" || typeof value === "boolean") return;
    if (Array.isArray(value)) {
      validateExpressionStructure(value, valuePath);
      deepWalk(value, (node, pointer) => {
        if (!isObject(node) || node.exprType !== "variable") return;
        if (!variableById.has(node.id)) {
          addIssue(errors, "EXPRESSION_ARRAY_UNKNOWN_VARIABLE", `Expression array references unknown variable ${node.id}`, `${valuePath}${pointer.slice(1)}`);
        }
      });
      return;
    }
    if (typeof value !== "string") {
      addIssue(errors, "CONTENTLIST_DATA_BAD_TYPE", "ContentList Data must be literal, expression-button string, or expression array", valuePath);
      return;
    }
    if (!value.startsWith("<input")) return;
    if (!value.includes("expr=\"__\"")) {
      addIssue(warnings, "EXPRESSION_BUTTON_MISSING_EXPR", "Expression-button string usually includes expr=\"__\"", valuePath);
    }
    const typeMatch = value.match(/&quot;type&quot;:&quot;([^&]+)&quot;/);
    const type = typeMatch && typeMatch[1];
    if (type !== "variable") return;
    const idMatch = value.match(/&quot;id&quot;:&quot;([^&]+)&quot;/);
    const varId = idMatch && idMatch[1];
    if (!varId) {
      addIssue(errors, "EXPRESSION_BUTTON_MISSING_VARIABLE_ID", "Variable expression-button string must include a variable id", valuePath);
      return;
    }
    if (!variableById.has(varId)) {
      addIssue(errors, "EXPRESSION_BUTTON_UNKNOWN_VARIABLE", `Expression-button references unknown variable ${varId}`, valuePath);
      return;
    }
    if (value.includes("&quot;t&quot;:&quot;list&quot;")) {
      const propMatch = value.match(/&quot;prop&quot;:&quot;([^&]+)&quot;/);
      const prop = propMatch && propMatch[1];
      if (!rowFieldsByListVar.has(varId)) {
        addIssue(errors, "EXPRESSION_BUTTON_LIST_VAR_NOT_LIST", `Expression-button treats ${varId} as list, but variable is not a valid list variable`, valuePath);
      } else if (!prop || !rowFieldsByListVar.get(varId).has(prop)) {
        addIssue(errors, "EXPRESSION_BUTTON_UNKNOWN_ROW_FIELD", `Expression-button references unknown row field ${varId}.${prop}`, valuePath);
      }
    }
  }

  function validateSetVariableTasks() {
    childshapes.forEach((shape, index) => {
      if (!shape || !shape.stencil || shape.stencil.id !== "SetVariableTask") return;
      const settings = asArray(shape.properties && shape.properties.variablesetting);
      settings.forEach((setting, settingIndex) => {
        const p = `$.childshapes[${index}].properties.variablesetting[${settingIndex}]`;
        if (!setting.id || !variableById.has(setting.id)) {
          addIssue(errors, "SETVARIABLE_UNKNOWN_VARIABLE", `SetVariableTask references unknown variable ${setting && setting.id}`, `${p}.id`);
        }
        if (typeof setting.value === "string" && setting.value.includes("&quot;prop&quot;:&quot;FlowNo&quot;")) {
          return;
        }
        validateDataExpression(setting.value, `${p}.value`);
      });
    });
  }

  function validateWorkflowActionConfigurations() {
    const actionReport = validateWorkflowActionShapes(childshapes, {
      mode,
      stage: mode,
      pointerForIndex: (index) => `$.childshapes[${index}]`,
    });
    summary.workflowActionConfig = actionReport.summary;
    actionReport.issues.forEach((entry) => {
      const target = entry.level === "error" ? errors : warnings;
      addIssue(target, entry.code, entry.message, entry.path, entry);
    });
  }

  function validateDesignSystemColorUsage() {
    const literalHits = [];
    const arbitraryHits = [];
    deepWalk(def, (node, pointer) => {
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
      addIssue(warnings, "DESIGN_SYSTEM_RESOLVED_TOKEN_COLOR", "Generated approval UI contains literal hex colors that match known Yeeflow root tokens. Prefer token references where supported, but do not fail exports that store resolved values.", literalHits[0].path, {
        count: literalHits.length,
        examples: literalHits.slice(0, 8),
      });
    }
    if (arbitraryHits.length > 8) {
      addIssue(warnings, "DESIGN_SYSTEM_ARBITRARY_COLOR_USAGE", "Generated approval UI contains many hard-coded hex colors. Prefer semantic Yeeflow root tokens where supported.", arbitraryHits[0].path, {
        count: arbitraryHits.length,
        examples: arbitraryHits.slice(0, 8),
      });
    }
  }

  function validatePlaceholderPolicy() {
    if (mode === "final" && placeholders.length > 0) {
      placeholders.forEach((entry) => {
        addIssue(errors, "UNRESOLVED_PLACEHOLDER_FINAL", `Final mode cannot contain unresolved placeholder ${entry.placeholder}`, entry.paths[0]);
      });
    }
    if (dependencyMap) {
      const dependencyPlaceholders = new Set();
      deepWalk(dependencyMap, (node) => {
        if (typeof node === "string" && PLACEHOLDER_RE.test(node)) dependencyPlaceholders.add(node);
      });
      placeholders.forEach((entry) => {
        if (!dependencyPlaceholders.has(entry.placeholder)) {
          addIssue(warnings, "PLACEHOLDER_NOT_IN_DEPENDENCY_MAP", `Placeholder ${entry.placeholder} is not present in dependency mapping`, entry.paths[0]);
        }
      });
    }
  }
}

function main() {
  const args = parseArgs(process.argv);
  let def;
  let dependencyMap = null;
  try {
    def = readJson(args.input);
  } catch (error) {
    const report = {
      status: "fail",
      mode: args.mode,
      errors: [{ code: "INVALID_JSON", message: `Failed to read or parse JSON: ${error.message}`, path: args.input }],
      warnings: [],
      placeholders: [],
      summary: {},
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  if (args.dependencyMap) {
    try {
      dependencyMap = readJson(args.dependencyMap);
    } catch (error) {
      const report = {
        status: "fail",
        mode: args.mode,
        errors: [{ code: "INVALID_DEPENDENCY_MAP", message: `Failed to read dependency map: ${error.message}`, path: args.dependencyMap }],
        warnings: [],
        placeholders: [],
        summary: {},
      };
      console.log(JSON.stringify(report, null, 2));
      process.exit(1);
    }
  }

  const report = validateDecodedDef(def, { mode: args.mode, dependencyMap });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { validateDecodedDef };
