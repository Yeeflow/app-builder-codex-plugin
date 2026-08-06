import crypto from "node:crypto";
import workflowGraphReferenceUtils from "./approval-workflow-graph-reference-utils.cjs";
import workflowConditionEditorUtils from "./workflow-condition-editor-utils.cjs";

const {
  canonicalGraphRef,
  graphRefId,
  inspectCanonicalGraphRef,
  normalizeApprovalWorkflowGraphReferences,
} = workflowGraphReferenceUtils;
const { validateWorkflowConditionEditorRows } = workflowConditionEditorUtils;

function text(value) {
  return String(value ?? "").trim();
}

function deterministicUuid(seed) {
  const hex = crypto.createHash("sha256").update(String(seed)).digest("hex");
  const variant = ((Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

function issue(code, message, path, detail = {}) {
  return { code, message, path, detail };
}

function parseJsonObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function workflowVariablesById(variables) {
  const groups = variables && typeof variables === "object" ? Object.values(variables) : [];
  return new Map(groups.flatMap((group) => Array.isArray(group) ? group : []).map((variable) => [text(variable?.id), variable]).filter(([id]) => id));
}

function allShapes(shapes) {
  const result = [];
  const visit = (entries) => {
    for (const shape of Array.isArray(entries) ? entries : []) {
      if (!shape || typeof shape !== "object") continue;
      result.push(shape);
      visit(shape.children);
      visit(shape.childshapes);
    }
  };
  visit(shapes);
  return result;
}

const CONDITION_OPS_BY_GROUP = Object.freeze({
  string: new Set(["s.=", "s.!=" , "s.contains", "s.notContains", "s.startWith", "s.endWith", "isNull", "isNotNull"]),
  number: new Set(["n.=", "n.!=" , "n.>", "n.>=", "n.<", "n.<=", "isNull", "isNotNull"]),
  boolean: new Set(["b.=", "b.!=" , "b.isTrue", "b.isFalse", "isNull", "isNotNull"]),
  datetime: new Set(["dt.=", "dt.!=" , "dt.>", "dt.>=", "dt.<", "dt.<=", "isNull", "isNotNull"]),
});

function validateDesignerConditionRows(conditions, path) {
  const findings = [];
  for (const [index, condition] of (Array.isArray(conditions) ? conditions : []).entries()) {
    if (!condition || typeof condition !== "object" || typeof condition.left !== "string") continue;
    const rowPath = `${path}[${index}]`;
    const left = condition.left;
    if (!text(condition.key)) findings.push(issue("DATA_LIST_WORKFLOW_CONDITION_KEY_REQUIRED", "Designer condition row key is required.", `${rowPath}.key`));
    if (!left.includes("<input") || !left.includes("expr=\"__\"") || !/\$\{.*(?:listitem|variable|application).*\}/s.test(left)) findings.push(issue("DATA_LIST_WORKFLOW_CONDITION_LEFT_EXPRESSION_INVALID", "Designer condition left side must be an export-shaped Expression Button.", `${rowPath}.left`));
    const group = text(condition.group);
    if (!CONDITION_OPS_BY_GROUP[group]) findings.push(issue("DATA_LIST_WORKFLOW_CONDITION_GROUP_INVALID", "Designer condition group must be string, number, boolean, or datetime.", `${rowPath}.group`, { group }));
    else if (!CONDITION_OPS_BY_GROUP[group].has(condition.op)) findings.push(issue("DATA_LIST_WORKFLOW_CONDITION_OPERATOR_INVALID", "Designer condition operator must match its condition group.", `${rowPath}.op`, { group, op: condition.op }));
    if (group === "number" && !["isNull", "isNotNull"].includes(condition.op) && (text(condition.right) === "" || Number.isNaN(Number(condition.right)))) findings.push(issue("DATA_LIST_WORKFLOW_CONDITION_RIGHT_NUMBER_REQUIRED", "Numeric Designer condition right side must be numeric.", `${rowPath}.right`, { right: condition.right }));
  }
  return findings;
}

export function buildLinearDataListWorkflowShapes({ seed, actions, entryConditions = [], ids = {} } = {}) {
  if (!Array.isArray(actions) || actions.length === 0) {
    throw new Error("DATA_LIST_WORKFLOW_ACTION_REQUIRED: at least one workflow action is required.");
  }
  const workflowSeed = text(seed) || "data-list-workflow";
  const startId = text(ids.start) || deterministicUuid(`${workflowSeed}:start`);
  const endId = text(ids.end) || deterministicUuid(`${workflowSeed}:end`);
  const actionNodes = actions.map((action, index) => {
    const type = text(action?.type);
    if (!type) throw new Error(`DATA_LIST_WORKFLOW_ACTION_TYPE_REQUIRED: actions[${index}].type is required.`);
    const id = text(action.id) || deterministicUuid(`${workflowSeed}:action:${index + 1}:${type}:${text(action.name)}`);
    return {
      id,
      resourceid: id,
      stencil: { id: type },
      position: action.position || { x: 500 + index * 340, y: 200 },
      properties: { ...(action.properties || {}), name: text(action.name || action.properties?.name) },
    };
  });
  const nodes = [
    {
      id: startId,
      resourceid: startId,
      stencil: { id: "StartNoneEvent" },
      position: { x: 180, y: 200 },
      properties: { name: "Start", taskurl: "", isenabledemail: false, subject: "", to: "", html: "" },
    },
    ...actionNodes,
    {
      id: endId,
      resourceid: endId,
      stencil: { id: "EndNoneEvent" },
      position: { x: 500 + actionNodes.length * 340, y: 200 },
      properties: { name: "End", isenabledemail: false, subject: "", to: "", html: "" },
    },
  ];
  const flows = nodes.slice(0, -1).map((source, index) => {
    const target = nodes[index + 1];
    const id = text(ids.flows?.[index]) || deterministicUuid(`${workflowSeed}:flow:${index + 1}`);
    return {
      id,
      resourceid: id,
      stencil: { id: "SequenceFlow" },
      source: canonicalGraphRef(source.id),
      target: canonicalGraphRef(target.id),
      properties: {
        name: index === 0 && entryConditions.length ? "Condition matched" : "Next",
        linetype: "rounded",
        documentation: "",
        conditioninfo: index === 0 ? entryConditions : [],
      },
      dockers: [],
    };
  });
  for (const [index, node] of nodes.entries()) {
    node.incoming = index === 0 ? [] : [canonicalGraphRef(flows[index - 1].id)];
    node.outgoing = index === nodes.length - 1 ? [] : [canonicalGraphRef(flows[index].id)];
  }
  return normalizeApprovalWorkflowGraphReferences([...flows, ...nodes]);
}

export function buildDataListWorkflowType1DefResource({
  name,
  key,
  defResourceId,
  appId = 41,
  listSetId,
  listId,
  variables = { basic: [], listref: [], filter: [] },
  childshapes,
  ext = {},
} = {}) {
  const normalizedShapes = normalizeApprovalWorkflowGraphReferences(childshapes);
  return {
    id: text(defResourceId),
    key: text(key),
    defkey: text(key),
    name: text(name),
    title: text(name),
    workflowType: 1,
    AppListSetID: text(listSetId),
    ProcModelAppID: appId,
    ProcModelListID: text(listId),
    ProcModelListSetID: text(listSetId),
    ext,
    lineType: "rounded",
    iconURL: "",
    flowPage: [],
    variables,
    graphposition: { x: 0, y: 0, width: 1500, height: 600 },
    graphzoom: 1,
    graphver: 2,
    pageurls: [],
    childshapes: normalizedShapes,
  };
}

export function validateDataListWorkflowType1({ workflow, flowMapping, defResource } = {}) {
  const findings = [];
  const def = defResource || parseJsonObject(workflow?.DefResource);
  const add = (code, message, path, detail) => findings.push(issue(code, message, path, detail));
  if (Number(workflow?.WorkflowType) !== 1) add("DATA_LIST_WORKFLOW_TYPE_INVALID", "Data List Workflow must use WorkflowType 1.", "$.workflow.WorkflowType");
  if (!text(workflow?.ListID) || text(workflow?.ListID) === "0") add("DATA_LIST_WORKFLOW_LIST_ID_REQUIRED", "Data List Workflow must reference a nonzero host ListID.", "$.workflow.ListID");
  if (workflow?.Settings !== null && workflow?.Settings !== "" && workflow?.Settings !== undefined) add("DATA_LIST_WORKFLOW_FORM_SETTINGS_INVALID", "WorkflowType 1 form Settings must be null or empty; trigger settings belong to FlowMappings.", "$.workflow.Settings");
  if (!def) {
    add("DATA_LIST_WORKFLOW_DEFRESOURCE_INVALID", "Data List Workflow DefResource must be a parsed object or a JSON object string.", "$.workflow.DefResource");
    return { ok: false, findings };
  }
  if (Number(def.workflowType) !== 1) add("DATA_LIST_WORKFLOW_DEF_TYPE_INVALID", "DefResource workflowType must be 1.", "$.defResource.workflowType");
  if (!text(workflow?.ProcModelID)) add("DATA_LIST_WORKFLOW_PROC_MODEL_ID_REQUIRED", "Workflow ProcModelID is required.", "$.workflow.ProcModelID");
  if (!text(def.id) || text(def.id) !== text(workflow?.DefResourceID)) add("DATA_LIST_WORKFLOW_DEF_ID_MISMATCH", "DefResource id must match workflow DefResourceID.", "$.defResource.id");
  if (!text(def.key) || text(def.key) !== text(workflow?.Key) || text(def.defkey) !== text(workflow?.Key)) add("DATA_LIST_WORKFLOW_DEF_KEY_MISMATCH", "DefResource key and defkey must match the workflow Key.", "$.defResource.key");
  if (text(def.ProcModelListID) !== text(workflow?.ListID)) add("DATA_LIST_WORKFLOW_DEF_LIST_ID_MISMATCH", "DefResource ProcModelListID must match the workflow ListID.", "$.defResource.ProcModelListID");
  for (const property of ["flowPage", "pageurls", "childshapes"]) {
    if (!Array.isArray(def[property])) add("DATA_LIST_WORKFLOW_DEF_ARRAY_REQUIRED", `DefResource ${property} must be an array.`, `$.defResource.${property}`);
  }
  if (!def.variables || typeof def.variables !== "object") add("DATA_LIST_WORKFLOW_VARIABLES_REQUIRED", "DefResource variables object is required.", "$.defResource.variables");

  const shapes = allShapes(def.childshapes);
  const byId = new Map();
  for (const [index, shape] of shapes.entries()) {
    const id = text(shape.id || shape.resourceid);
    if (!id) add("DATA_LIST_WORKFLOW_SHAPE_ID_REQUIRED", "Every workflow shape must have an id/resourceid.", `$.defResource.childshapes[${index}]`);
    else if (byId.has(id)) add("DATA_LIST_WORKFLOW_SHAPE_ID_DUPLICATE", "Workflow shape ids must be unique.", `$.defResource.childshapes[${index}].id`, { id });
    else byId.set(id, shape);
    if (text(shape.id) !== text(shape.resourceid)) add("DATA_LIST_WORKFLOW_SHAPE_ID_MISMATCH", "Workflow shape id and resourceid must match.", `$.defResource.childshapes[${index}]`, { id: shape.id, resourceid: shape.resourceid });
  }
  const typeOf = (shape) => text(shape?.stencil?.id);
  if (shapes.filter((shape) => typeOf(shape) === "StartNoneEvent").length !== 1) add("DATA_LIST_WORKFLOW_START_COUNT_INVALID", "Workflow must contain exactly one StartNoneEvent.", "$.defResource.childshapes");
  if (shapes.filter((shape) => typeOf(shape) === "EndNoneEvent").length < 1) add("DATA_LIST_WORKFLOW_END_REQUIRED", "Workflow must contain at least one EndNoneEvent.", "$.defResource.childshapes");

  const variablesById = workflowVariablesById(def.variables);
  for (const [index, shape] of shapes.entries()) {
    const type = typeOf(shape);
    if (type === "SequenceFlow") {
      for (const side of ["source", "target"]) {
        const inspected = inspectCanonicalGraphRef(shape[side]);
        if (!inspected.valid) add("DATA_LIST_WORKFLOW_EDGE_REF_INVALID", `SequenceFlow ${side} must use matching id/resourceid.`, `$.defResource.childshapes[${index}].${side}`);
        else if (!byId.has(inspected.id)) add("DATA_LIST_WORKFLOW_EDGE_ENDPOINT_UNRESOLVED", `SequenceFlow ${side} must resolve to an existing node.`, `$.defResource.childshapes[${index}].${side}`, { id: inspected.id });
      }
      const conditionPath = `$.defResource.childshapes[${index}].properties.conditioninfo`;
      findings.push(...validateWorkflowConditionEditorRows({ conditions: shape.properties?.conditioninfo, variablesById, path: conditionPath, node: text(shape.properties?.name) }));
      findings.push(...validateDesignerConditionRows(shape.properties?.conditioninfo, conditionPath));
      const source = byId.get(graphRefId(shape.source));
      const target = byId.get(graphRefId(shape.target));
      if (source && (!Array.isArray(source.outgoing) || !source.outgoing.some((ref) => graphRefId(ref) === text(shape.id)))) add("DATA_LIST_WORKFLOW_EDGE_OUTGOING_MISSING", "SequenceFlow must be mirrored in its source node outgoing refs.", `$.defResource.childshapes[${index}].source`);
      if (target && (!Array.isArray(target.incoming) || !target.incoming.some((ref) => graphRefId(ref) === text(shape.id)))) add("DATA_LIST_WORKFLOW_EDGE_INCOMING_MISSING", "SequenceFlow must be mirrored in its target node incoming refs.", `$.defResource.childshapes[${index}].target`);
    }
    if (type === "MailTask") {
      for (const property of ["to", "subject", "html"]) {
        if (!text(shape.properties?.[property])) add("DATA_LIST_WORKFLOW_MAIL_PROPERTY_REQUIRED", `MailTask properties.${property} is required.`, `$.defResource.childshapes[${index}].properties.${property}`);
      }
    }
  }

  if (!flowMapping || typeof flowMapping !== "object") add("DATA_LIST_WORKFLOW_FLOW_MAPPING_REQUIRED", "WorkflowType 1 requires a host FlowMapping.", "$.flowMapping");
  else {
    if (!text(flowMapping.ID)) add("DATA_LIST_WORKFLOW_FLOW_MAPPING_ID_REQUIRED", "FlowMapping ID is required.", "$.flowMapping.ID");
    if (text(flowMapping.ListID) !== text(workflow?.ListID)) add("DATA_LIST_WORKFLOW_FLOW_MAPPING_LIST_ID_MISMATCH", "FlowMapping ListID must match workflow ListID.", "$.flowMapping.ListID");
    if (text(flowMapping.DefKey) !== text(workflow?.Key)) add("DATA_LIST_WORKFLOW_FLOW_MAPPING_DEF_KEY_MISMATCH", "FlowMapping DefKey must match workflow Key.", "$.flowMapping.DefKey");
    const setting = parseJsonObject(flowMapping.Setting);
    if (!setting || setting.NewTrigger !== true) add("DATA_LIST_WORKFLOW_NEW_TRIGGER_REQUIRED", "New-record Data List Workflow FlowMapping Setting must contain NewTrigger=true.", "$.flowMapping.Setting");
  }
  return { ok: findings.length === 0, findings };
}

export function materializeDataListWorkflowType1({
  name,
  key,
  description = "",
  appId = 41,
  listId,
  defResourceId,
  procModelId = defResourceId,
  deployedDefId = defResourceId,
  flowMappingId,
  triggerFieldName = "",
  triggerSettings = { NewTrigger: true },
  defResource,
  encodeDefResource = JSON.stringify,
  status = 1,
  deployed = true,
} = {}) {
  const workflow = {
    Category: "",
    Name: text(name),
    Key: text(key),
    IsItemPerm: false,
    AppID: appId,
    ListID: text(listId),
    ProcModelID: text(procModelId),
    Description: text(description),
    Ext: "",
    DefResourceID: text(defResourceId),
    DefResource: encodeDefResource(defResource),
    Status: status,
    DeployedDefID: text(deployedDefId),
    WorkflowType: 1,
    Settings: "",
    Deployed: deployed,
    NoRule: { Prefix: "WF-{index}", StartIndex: 1, CustomLength: 4, AutoIncrement: 1 },
    Perms: [],
  };
  const flowMapping = {
    ID: text(flowMappingId),
    ListID: text(listId),
    Method: 0,
    Setting: JSON.stringify(triggerSettings),
    Title: text(name),
    DefKey: text(key),
    FieldName: text(triggerFieldName),
    Ext1: "",
    Ext2: "",
    Ext3: "",
  };
  const validation = validateDataListWorkflowType1({ workflow, flowMapping, defResource });
  if (!validation.ok) {
    const error = new Error(`DATA_LIST_WORKFLOW_TYPE1_VALIDATION_FAILED: ${validation.findings.map((finding) => finding.code).join(", ")}`);
    error.code = "DATA_LIST_WORKFLOW_TYPE1_VALIDATION_FAILED";
    error.findings = validation.findings;
    throw error;
  }
  return { workflow, flowMapping, defResource, validation };
}
