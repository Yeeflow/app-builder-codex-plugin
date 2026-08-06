import { decodeDataListWorkflowLiveDefResource } from "./data-list-workflow-live-bundle.mjs";
import { validateDataListWorkflowType1 } from "./data-list-workflow-type1-materializer.mjs";

function text(value) {
  return String(value ?? "").trim();
}

function fail(code, message, detail = {}) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  error.detail = detail;
  throw error;
}

function ensureArray(detail, property) {
  if (!Array.isArray(detail?.[property])) fail("DATA_LIST_WORKFLOW_LIVE_ARRAY_REQUIRED", `Data List component ${property} must be an array.`, { property });
}

function indexesOf(entries, predicate) {
  const indexes = [];
  entries.forEach((entry, index) => {
    if (predicate(entry)) indexes.push(index);
  });
  return indexes;
}

function exactlyOne(indexes, code, message, detail = {}) {
  if (indexes.length !== 1) fail(code, message, { ...detail, matches: indexes.length });
  return indexes[0];
}

export function normalizeDataListWorkflowComponentDetail(value) {
  let current = value;
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current === "string") {
      try { current = JSON.parse(current); } catch { fail("DATA_LIST_WORKFLOW_LIVE_COMPONENT_RESPONSE_INVALID", "Component response string must contain JSON."); }
      continue;
    }
    if (Array.isArray(current?.content)) {
      const textEntry = current.content.find((entry) => entry?.type === "text" && text(entry?.text));
      if (!textEntry) fail("DATA_LIST_WORKFLOW_LIVE_COMPONENT_RESPONSE_INVALID", "MCP tool result must contain one JSON text content entry.");
      current = textEntry.text;
      continue;
    }
    if (current?.Data && typeof current.Data === "object" && !Array.isArray(current.Data)) {
      current = current.Data;
      continue;
    }
    break;
  }
  if (!current || typeof current !== "object" || Array.isArray(current) || !current.List) {
    fail("DATA_LIST_WORKFLOW_LIVE_COMPONENT_DETAIL_INVALID", "A decoded Data List component detail with List metadata is required.");
  }
  return current;
}

function validateBundle(detail, bundle) {
  const { workflow, flowMapping, flowStatusField, remindRule } = bundle || {};
  const key = text(workflow?.Key);
  if (!key) fail("DATA_LIST_WORKFLOW_LIVE_KEY_REQUIRED", "Workflow Key is required.");
  if (!text(workflow?.ProcModelID) || !text(workflow?.DefResourceID)) fail("DATA_LIST_WORKFLOW_LIVE_WORKFLOW_IDS_REQUIRED", "Workflow ProcModelID and DefResourceID are required.", { key });
  if (Number(workflow?.WorkflowType) !== 1) fail("DATA_LIST_WORKFLOW_LIVE_TYPE_INVALID", "Live Data List Workflow must use WorkflowType 1.", { key });
  if (text(workflow?.ListID) !== text(detail?.List?.ListID)) fail("DATA_LIST_WORKFLOW_LIVE_LIST_ID_MISMATCH", "Workflow ListID must match the host Data List.", { key });
  if (!text(flowMapping?.ID) || text(flowMapping?.DefKey) !== key) fail("DATA_LIST_WORKFLOW_LIVE_FLOW_MAPPING_INVALID", "FlowMapping ID and DefKey must resolve to the workflow.", { key });
  if (text(flowMapping?.ListID) !== text(workflow.ListID)) fail("DATA_LIST_WORKFLOW_LIVE_FLOW_MAPPING_LIST_ID_MISMATCH", "FlowMapping ListID must match workflow ListID.", { key });
  let setting;
  try { setting = JSON.parse(flowMapping.Setting); } catch { setting = null; }
  if (setting?.NewTrigger !== true) fail("DATA_LIST_WORKFLOW_LIVE_NEW_TRIGGER_REQUIRED", "FlowMapping Setting.NewTrigger must be true.", { key });
  if (!text(flowStatusField?.FieldID) || text(flowStatusField?.Type) !== "flowstatus") fail("DATA_LIST_WORKFLOW_LIVE_FLOWSTATUS_FIELD_INVALID", "A persisted flowstatus field with FieldID is required.", { key });
  if (text(flowStatusField?.ListID) !== text(workflow.ListID) || text(flowStatusField?.FieldName) !== text(flowMapping.FieldName)) fail("DATA_LIST_WORKFLOW_LIVE_FLOWSTATUS_MAPPING_MISMATCH", "FlowMapping FieldName must resolve to the supplied host flowstatus field.", { key });
  if (text(flowStatusField?.InternalName) !== key && text(flowStatusField?.Ext1) !== key) fail("DATA_LIST_WORKFLOW_LIVE_FLOWSTATUS_KEY_MISMATCH", "Flowstatus field InternalName or Ext1 must resolve to the workflow Key.", { key });
  if (!text(remindRule?.ID) || text(remindRule?.CategoryID) !== text(flowMapping.ID)) fail("DATA_LIST_WORKFLOW_LIVE_REMIND_RULE_INVALID", "RemindRule ID and CategoryID must resolve to the FlowMapping.", { key });
  if (text(remindRule?.ListID) !== text(workflow.ListID) || Number(remindRule?.Type) !== 1 || Number(remindRule?.SendType) !== 16) fail("DATA_LIST_WORKFLOW_LIVE_REMIND_RULE_TRIGGER_INVALID", "New-item RemindRule must target the host list with Type 1 and SendType 16.", { key });
  const defResource = decodeDataListWorkflowLiveDefResource(workflow.DefResource);
  const validation = validateDataListWorkflowType1({ workflow, flowMapping, defResource });
  if (!validation.ok) fail("DATA_LIST_WORKFLOW_LIVE_BUNDLE_VALIDATION_FAILED", "Live bundle failed the shared WorkflowType 1 validator before merge.", { findings: validation.findings });
  return { workflow, flowMapping, flowStatusField, remindRule, key };
}

function assertNoDuplicates(detail) {
  const checks = [
    ["Workflows", (entry) => text(entry?.Key), "DATA_LIST_WORKFLOW_LIVE_DUPLICATE_KEY"],
    ["FlowMappings", (entry) => text(entry?.DefKey), "DATA_LIST_WORKFLOW_LIVE_DUPLICATE_MAPPING_KEY"],
    ["Fields", (entry) => text(entry?.FieldName), "DATA_LIST_WORKFLOW_LIVE_DUPLICATE_FIELD_NAME"],
    ["Fields", (entry) => text(entry?.InternalName), "DATA_LIST_WORKFLOW_LIVE_DUPLICATE_FIELD_INTERNAL_NAME"],
    ["RemindRules", (entry) => text(entry?.ID), "DATA_LIST_WORKFLOW_LIVE_DUPLICATE_REMIND_RULE_ID"],
  ];
  for (const [property, keyOf, code] of checks) {
    const seen = new Set();
    for (const entry of detail[property]) {
      const key = keyOf(entry);
      if (!key) continue;
      if (seen.has(key)) fail(code, `${property} contains duplicate identity ${key}.`, { property, key });
      seen.add(key);
    }
  }
}

export function mergeDataListWorkflowLiveComponent({ detail, mode, bundle } = {}) {
  if (!["create", "update", "replace"].includes(mode)) fail("DATA_LIST_WORKFLOW_LIVE_MODE_INVALID", "Mode must be create, update, or replace.", { mode });
  const componentDetail = normalizeDataListWorkflowComponentDetail(detail);
  for (const property of ["Fields", "RemindRules", "FlowMappings", "Workflows"]) ensureArray(componentDetail, property);
  const normalized = validateBundle(componentDetail, bundle);
  const result = structuredClone(componentDetail);
  const workflowIndexes = indexesOf(result.Workflows, (entry) => text(entry?.Key) === normalized.key);
  const mappingIndexes = indexesOf(result.FlowMappings, (entry) => text(entry?.DefKey) === normalized.key);
  const fieldIndexes = indexesOf(result.Fields, (entry) => text(entry?.InternalName) === normalized.key || text(entry?.Ext1) === normalized.key);

  if (mode === "create") {
    if (workflowIndexes.length || mappingIndexes.length || fieldIndexes.length) fail("DATA_LIST_WORKFLOW_LIVE_ALREADY_EXISTS", "Create mode requires the workflow Key and related resources to be absent.", { key: normalized.key });
    result.Workflows.push(normalized.workflow);
    result.FlowMappings.push(normalized.flowMapping);
    result.Fields.push(normalized.flowStatusField);
    result.RemindRules.push(normalized.remindRule);
  } else {
    const workflowIndex = exactlyOne(workflowIndexes, "DATA_LIST_WORKFLOW_LIVE_EXISTING_WORKFLOW_AMBIGUOUS", "Update/replace mode requires exactly one existing workflow.", { key: normalized.key });
    const mappingIndex = exactlyOne(mappingIndexes, "DATA_LIST_WORKFLOW_LIVE_EXISTING_MAPPING_AMBIGUOUS", "Update/replace mode requires exactly one existing FlowMapping.", { key: normalized.key });
    const fieldIndex = exactlyOne(fieldIndexes, "DATA_LIST_WORKFLOW_LIVE_EXISTING_FIELD_AMBIGUOUS", "Update/replace mode requires exactly one existing flowstatus field.", { key: normalized.key });
    const oldWorkflow = result.Workflows[workflowIndex];
    const oldMapping = result.FlowMappings[mappingIndex];
    const oldField = result.Fields[fieldIndex];
    const reminderIndexes = indexesOf(result.RemindRules, (entry) => text(entry?.CategoryID) === text(oldMapping.ID));
    const reminderIndex = exactlyOne(reminderIndexes, "DATA_LIST_WORKFLOW_LIVE_EXISTING_REMINDER_AMBIGUOUS", "Update/replace mode requires exactly one existing trigger RemindRule.", { key: normalized.key });
    if (mode === "update") {
      const continuity = [
        ["ProcModelID", oldWorkflow.ProcModelID, normalized.workflow.ProcModelID],
        ["DefResourceID", oldWorkflow.DefResourceID, normalized.workflow.DefResourceID],
        ["FlowMapping.ID", oldMapping.ID, normalized.flowMapping.ID],
        ["FieldID", oldField.FieldID, normalized.flowStatusField.FieldID],
        ["FieldName", oldField.FieldName, normalized.flowStatusField.FieldName],
        ["RemindRule.ID", result.RemindRules[reminderIndex].ID, normalized.remindRule.ID],
      ];
      const changed = continuity.filter(([, before, after]) => text(before) !== text(after));
      if (changed.length) fail("DATA_LIST_WORKFLOW_LIVE_UPDATE_ID_CONTINUITY_FAILED", "Update mode must preserve existing workflow resource IDs; use replace mode for new IDs.", { key: normalized.key, changed: changed.map(([property]) => property) });
    }
    result.Workflows[workflowIndex] = normalized.workflow;
    result.FlowMappings[mappingIndex] = normalized.flowMapping;
    result.Fields[fieldIndex] = normalized.flowStatusField;
    result.RemindRules[reminderIndex] = normalized.remindRule;
  }

  assertNoDuplicates(result);
  return {
    detail: result,
    report: {
      status: "pass",
      mode,
      key: normalized.key,
      counts: {
        fields: result.Fields.length,
        workflows: result.Workflows.length,
        flowMappings: result.FlowMappings.length,
        remindRules: result.RemindRules.length,
      },
      deleteMissingRequired: false,
      readbackRequired: true,
    },
  };
}

export function validateDataListWorkflowLiveReadback({ detail, key } = {}) {
  const componentDetail = normalizeDataListWorkflowComponentDetail(detail);
  for (const property of ["Fields", "RemindRules", "FlowMappings", "Workflows"]) ensureArray(componentDetail, property);
  const normalizedKey = text(key);
  if (!normalizedKey) fail("DATA_LIST_WORKFLOW_LIVE_KEY_REQUIRED", "Expected workflow Key is required for readback validation.");
  const workflow = componentDetail.Workflows[exactlyOne(
    indexesOf(componentDetail.Workflows, (entry) => text(entry?.Key) === normalizedKey),
    "DATA_LIST_WORKFLOW_LIVE_READBACK_WORKFLOW_AMBIGUOUS",
    "Readback must contain exactly one workflow with the expected Key.",
    { key: normalizedKey },
  )];
  const flowMapping = componentDetail.FlowMappings[exactlyOne(
    indexesOf(componentDetail.FlowMappings, (entry) => text(entry?.DefKey) === normalizedKey),
    "DATA_LIST_WORKFLOW_LIVE_READBACK_MAPPING_AMBIGUOUS",
    "Readback must contain exactly one FlowMapping for the expected Key.",
    { key: normalizedKey },
  )];
  const flowStatusField = componentDetail.Fields[exactlyOne(
    indexesOf(componentDetail.Fields, (entry) => text(entry?.FieldName) === text(flowMapping.FieldName) && text(entry?.Type) === "flowstatus"),
    "DATA_LIST_WORKFLOW_LIVE_READBACK_FIELD_AMBIGUOUS",
    "Readback must contain exactly one mapped flowstatus field.",
    { key: normalizedKey },
  )];
  const remindRule = componentDetail.RemindRules[exactlyOne(
    indexesOf(componentDetail.RemindRules, (entry) => text(entry?.CategoryID) === text(flowMapping.ID)),
    "DATA_LIST_WORKFLOW_LIVE_READBACK_REMINDER_AMBIGUOUS",
    "Readback must contain exactly one trigger RemindRule for the FlowMapping.",
    { key: normalizedKey },
  )];
  const normalized = validateBundle(componentDetail, { workflow, flowMapping, flowStatusField, remindRule });
  const defResource = decodeDataListWorkflowLiveDefResource(workflow.DefResource);
  const validation = validateDataListWorkflowType1({ workflow, flowMapping, defResource });
  if (!validation.ok) fail("DATA_LIST_WORKFLOW_LIVE_READBACK_VALIDATION_FAILED", "Readback workflow failed the shared WorkflowType 1 validator.", { findings: validation.findings });
  return {
    status: "pass",
    key: normalized.key,
    identitiesResolved: true,
    defResourceDecoded: true,
    workflowValidation: "passed",
    proofBoundary: {
      mcpReadback: "passed",
      designerOpen: "not-run",
      workflowExecution: "not-run",
      emailDelivery: "not-run",
    },
  };
}
