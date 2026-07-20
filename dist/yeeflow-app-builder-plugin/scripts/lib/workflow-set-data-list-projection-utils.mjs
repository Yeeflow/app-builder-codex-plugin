import { projectWorkflowSetDataListProjection } from "./workflow-set-data-list-projection-core-adapter.mjs";

function text(value) {
  return String(value == null ? "" : value).trim();
}

function cloneProjection(value) {
  return JSON.parse(JSON.stringify(value));
}

export function workflowSetDataListProjectionRecord(record = {}) {
  return cloneProjection(projectWorkflowSetDataListProjection({ record }).record);
}

export function buildWorkflowVariablesFromSetDataListRecords(records = []) {
  return cloneProjection(projectWorkflowSetDataListProjection({ records }).variables);
}

export function mergeWorkflowVariableProjection(target, projected) {
  if (!target || !projected) return target;
  if (!Array.isArray(target.basic)) target.basic = [];
  if (!Array.isArray(target.listref)) target.listref = [];
  if (!Array.isArray(target.filter)) target.filter = [];

  const basicById = new Map(target.basic.map((entry) => [text(entry?.id).toLowerCase(), entry]));
  const listRefAliases = new Map();
  for (const variable of projected.basic || []) {
    const key = text(variable.id).toLowerCase();
    if (!key) continue;
    const existing = basicById.get(key);
    if (!existing) {
      target.basic.push(variable);
      basicById.set(key, variable);
    } else if (variable.type === "list") {
      existing.type = "list";
      if (!existing.value) existing.value = variable.value;
      if (variable.value && existing.value) listRefAliases.set(text(variable.value).toLowerCase(), text(existing.value));
    }
  }

  const listrefById = new Map(target.listref.map((entry) => [text(entry?.id).toLowerCase(), entry]));
  for (const definition of projected.listref || []) {
    const resolvedId = listRefAliases.get(text(definition.id).toLowerCase()) || text(definition.id);
    const resolvedDefinition = resolvedId === definition.id ? definition : { ...definition, id: resolvedId, idx: resolvedId };
    const key = resolvedId.toLowerCase();
    const existing = listrefById.get(key);
    if (!existing) {
      target.listref.push(resolvedDefinition);
      listrefById.set(key, resolvedDefinition);
      continue;
    }
    const fieldIds = new Set((existing.fields || []).map((field) => text(field?.id).toLowerCase()));
    if (!Array.isArray(existing.fields)) existing.fields = [];
    for (const field of resolvedDefinition.fields || []) {
      const fieldKey = text(field.id).toLowerCase();
      if (!fieldKey || fieldIds.has(fieldKey)) continue;
      existing.fields.push(field);
      fieldIds.add(fieldKey);
    }
  }
  return target;
}
