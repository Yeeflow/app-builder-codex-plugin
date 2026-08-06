import zlib from "node:zlib";
import {
  buildDataListWorkflowType1DefResource,
  buildLinearDataListWorkflowShapes,
  materializeDataListWorkflowType1,
} from "./data-list-workflow-type1-materializer.mjs";

const BROTLI_PREFIX = Buffer.from("::brotli::", "utf8");

function text(value) {
  return String(value ?? "").trim();
}

function required(value, code, property) {
  const normalized = text(value);
  if (!normalized) {
    const error = new Error(`${code}: ${property}`);
    error.code = code;
    error.property = property;
    throw error;
  }
  return normalized;
}

function numericString(value, property) {
  const normalized = required(value, "DATA_LIST_WORKFLOW_LIVE_ID_REQUIRED", property);
  if (!/^\d+$/.test(normalized)) {
    const error = new Error(`DATA_LIST_WORKFLOW_LIVE_ID_INVALID: ${property}`);
    error.code = "DATA_LIST_WORKFLOW_LIVE_ID_INVALID";
    error.property = property;
    throw error;
  }
  return normalized;
}

function graphId(value, property) {
  const normalized = required(value, "DATA_LIST_WORKFLOW_LIVE_GRAPH_ID_REQUIRED", property);
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(normalized)) {
    const error = new Error(`DATA_LIST_WORKFLOW_LIVE_GRAPH_ID_INVALID: ${property}`);
    error.code = "DATA_LIST_WORKFLOW_LIVE_GRAPH_ID_INVALID";
    error.property = property;
    throw error;
  }
  return normalized;
}

function validateSpec(spec) {
  const name = required(spec?.name, "DATA_LIST_WORKFLOW_LIVE_NAME_REQUIRED", "name");
  const key = required(spec?.key, "DATA_LIST_WORKFLOW_LIVE_KEY_REQUIRED", "key");
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(key)) {
    const error = new Error("DATA_LIST_WORKFLOW_LIVE_KEY_INVALID: key");
    error.code = "DATA_LIST_WORKFLOW_LIVE_KEY_INVALID";
    throw error;
  }
  const actions = Array.isArray(spec?.actions) ? spec.actions : [];
  if (!actions.length) {
    const error = new Error("DATA_LIST_WORKFLOW_LIVE_ACTION_REQUIRED");
    error.code = "DATA_LIST_WORKFLOW_LIVE_ACTION_REQUIRED";
    throw error;
  }
  actions.forEach((action, index) => graphId(action?.id, `actions[${index}].id`));
  const flows = Array.isArray(spec?.graphIds?.flows) ? spec.graphIds.flows : [];
  if (flows.length !== actions.length + 1) {
    const error = new Error("DATA_LIST_WORKFLOW_LIVE_GRAPH_FLOW_COUNT_INVALID");
    error.code = "DATA_LIST_WORKFLOW_LIVE_GRAPH_FLOW_COUNT_INVALID";
    throw error;
  }
  flows.forEach((id, index) => graphId(id, `graphIds.flows[${index}]`));
  const fieldName = required(spec?.flowStatus?.fieldName, "DATA_LIST_WORKFLOW_LIVE_FLOWSTATUS_FIELD_NAME_REQUIRED", "flowStatus.fieldName");
  const fieldIndex = Number(spec?.flowStatus?.fieldIndex);
  if (!Number.isInteger(fieldIndex) || fieldIndex < 1 || fieldName !== `Text${fieldIndex}`) {
    const error = new Error("DATA_LIST_WORKFLOW_LIVE_FLOWSTATUS_FIELD_INDEX_MISMATCH");
    error.code = "DATA_LIST_WORKFLOW_LIVE_FLOWSTATUS_FIELD_INDEX_MISMATCH";
    throw error;
  }
  const appId = Number(spec?.appId ?? 41);
  if (!Number.isInteger(appId) || appId < 1) {
    const error = new Error("DATA_LIST_WORKFLOW_LIVE_APP_ID_INVALID");
    error.code = "DATA_LIST_WORKFLOW_LIVE_APP_ID_INVALID";
    throw error;
  }
  return {
    name,
    key,
    actions,
    flows,
    fieldName,
    fieldIndex,
    appId,
    listSetId: numericString(spec?.listSetId, "listSetId"),
    listId: numericString(spec?.listId, "listId"),
    procModelId: numericString(spec?.ids?.procModelId, "ids.procModelId"),
    defResourceId: numericString(spec?.ids?.defResourceId, "ids.defResourceId"),
    deployedDefId: numericString(spec?.ids?.deployedDefId, "ids.deployedDefId"),
    flowMappingId: numericString(spec?.ids?.flowMappingId, "ids.flowMappingId"),
    remindRuleId: numericString(spec?.ids?.remindRuleId, "ids.remindRuleId"),
    flowStatusFieldId: numericString(spec?.ids?.flowStatusFieldId, "ids.flowStatusFieldId"),
    startId: graphId(spec?.graphIds?.start, "graphIds.start"),
    endId: graphId(spec?.graphIds?.end, "graphIds.end"),
  };
}

export function materializeDataListWorkflowLiveBundle(spec = {}) {
  const validated = validateSpec(spec);
  const entryConditions = Array.isArray(spec.entryConditions) ? spec.entryConditions : [];
  const childshapes = buildLinearDataListWorkflowShapes({
    seed: spec.seed || validated.key,
    ids: { start: validated.startId, end: validated.endId, flows: validated.flows },
    entryConditions,
    actions: validated.actions,
  });
  const defResource = buildDataListWorkflowType1DefResource({
    name: validated.name,
    key: validated.key,
    defResourceId: validated.defResourceId,
    appId: validated.appId,
    listSetId: validated.listSetId,
    listId: validated.listId,
    variables: spec.variables || { basic: [], listref: [], filter: [] },
    childshapes,
    ext: spec.ext || {},
  });
  const materialized = materializeDataListWorkflowType1({
    name: validated.name,
    key: validated.key,
    description: spec.description || "",
    appId: validated.appId,
    listId: validated.listId,
    procModelId: validated.procModelId,
    defResourceId: validated.defResourceId,
    deployedDefId: validated.deployedDefId,
    flowMappingId: validated.flowMappingId,
    triggerFieldName: validated.fieldName,
    triggerSettings: spec.triggerSettings || { NewTrigger: true },
    defResource,
    encodeDefResource: (resource) => JSON.stringify(resource),
  });
  const compressedDefResource = Buffer.concat([
    BROTLI_PREFIX,
    zlib.brotliCompressSync(Buffer.from(JSON.stringify(defResource), "utf8")),
  ]).toString("base64");
  const flowStatusField = {
    ListID: validated.listId,
    FieldID: validated.flowStatusFieldId,
    FieldName: validated.fieldName,
    FieldType: "Text",
    FieldIndex: validated.fieldIndex,
    DisplayName: text(spec.flowStatus?.displayName) || validated.name,
    InternalName: text(spec.flowStatus?.internalName) || validated.key,
    Type: "flowstatus",
    Status: Number(spec.flowStatus?.status ?? 162),
    Category: 0,
    DefaultValue: "",
    Rules: JSON.stringify({ displayLabel: true }),
    IsSort: false,
    IsSystem: false,
    IsUnique: false,
    Ext1: validated.key,
    Ext2: "",
    Ext3: "",
  };
  const remindRule = {
    ID: validated.remindRuleId,
    CategoryID: validated.flowMappingId,
    ListID: validated.listId,
    Title: text(spec.remindRuleTitle) || "Add Item - When creating a new item",
    SendType: 16,
    Type: 1,
    From: null,
    Subject: "",
    Content: "",
    Rules: JSON.stringify({
      Rules: { Period: "Daily" },
      Conditions: { Type: 2, Data: JSON.stringify(entryConditions) },
      RunAsUser: text(spec.runAsUser) || "CreatedBy",
    }),
    Receiver: JSON.stringify({ Identities: [], ListDefs: [] }),
    Status: 1,
  };
  return {
    bundle: {
      workflow: { ...materialized.workflow, DefResource: compressedDefResource },
      flowMapping: materialized.flowMapping,
      flowStatusField,
      remindRule,
    },
    defResource,
    validation: materialized.validation,
    proofBoundary: {
      localMaterialization: "passed",
      mcpSave: "not-run",
      mcpReadback: "not-run",
      designerOpen: "not-run",
      workflowExecution: "not-run",
      emailDelivery: "not-run",
    },
  };
}

export function decodeDataListWorkflowLiveDefResource(value) {
  const encoded = required(value, "DATA_LIST_WORKFLOW_LIVE_DEFRESOURCE_REQUIRED", "workflow.DefResource");
  let bytes;
  try {
    bytes = Buffer.from(encoded, "base64");
  } catch {
    const error = new Error("DATA_LIST_WORKFLOW_LIVE_DEFRESOURCE_BASE64_INVALID");
    error.code = "DATA_LIST_WORKFLOW_LIVE_DEFRESOURCE_BASE64_INVALID";
    throw error;
  }
  if (bytes.length <= BROTLI_PREFIX.length || !bytes.subarray(0, BROTLI_PREFIX.length).equals(BROTLI_PREFIX)) {
    const error = new Error("DATA_LIST_WORKFLOW_LIVE_DEFRESOURCE_PREFIX_INVALID");
    error.code = "DATA_LIST_WORKFLOW_LIVE_DEFRESOURCE_PREFIX_INVALID";
    throw error;
  }
  try {
    const parsed = JSON.parse(zlib.brotliDecompressSync(bytes.subarray(BROTLI_PREFIX.length)).toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not-object");
    return parsed;
  } catch {
    const error = new Error("DATA_LIST_WORKFLOW_LIVE_DEFRESOURCE_DECODE_INVALID");
    error.code = "DATA_LIST_WORKFLOW_LIVE_DEFRESOURCE_DECODE_INVALID";
    throw error;
  }
}
