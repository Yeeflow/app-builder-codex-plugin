function text(value) {
  return String(value == null ? "" : value).trim();
}

function variableType(value) {
  const normalized = text(value).toLowerCase();
  if (normalized === "string") return "text";
  if (["integer", "decimal", "currency", "bigint"].includes(normalized)) return "number";
  if (["bool", "bit"].includes(normalized)) return "boolean";
  if (["datetime", "time"].includes(normalized)) return "date";
  return normalized || "text";
}

function childFieldId(declaration) {
  const key = text(declaration?.key);
  return key.startsWith("_list.") ? key.slice("_list.".length) : "";
}

export function workflowSetDataListProjectionRecord(record = {}) {
  return {
    ...record,
    workflowVariableDeclarations: Array.isArray(record.workflowVariableDeclarations)
      ? record.workflowVariableDeclarations.map((declaration) => ({
        id: text(declaration?.id),
        ...(text(declaration?.key) ? { key: text(declaration.key) } : {}),
        type: text(declaration?.type),
        valueType: text(declaration?.valueType),
        name: text(declaration?.name),
        expressionName: text(declaration?.expressionName),
      }))
      : [],
  };
}

export function buildWorkflowVariablesFromSetDataListRecords(records = []) {
  const declarations = records.flatMap((record) => workflowSetDataListProjectionRecord(record).workflowVariableDeclarations);
  const groups = new Map();
  for (const declaration of declarations) {
    if (!declaration.id) continue;
    const key = declaration.id.toLowerCase();
    if (!groups.has(key)) groups.set(key, { id: declaration.id, name: declaration.name || declaration.id, declarations: [] });
    groups.get(key).declarations.push(declaration);
  }

  const basic = [];
  const listref = [];
  for (const group of groups.values()) {
    const isList = group.declarations.some((declaration) => text(declaration.type).toLowerCase() === "list" || childFieldId(declaration));
    if (!isList) {
      const declaration = group.declarations[0];
      basic.push({
        id: group.id,
        idx: group.id,
        name: group.name,
        title: group.name,
        type: variableType(declaration.type || declaration.valueType),
        source: "workflow-set-data-list-plan",
      });
      continue;
    }

    const listRefId = `${group.id}ListRef`;
    const fields = [];
    const seenFields = new Set();
    for (const declaration of group.declarations) {
      const id = childFieldId(declaration);
      if (!id || seenFields.has(id.toLowerCase())) continue;
      seenFields.add(id.toLowerCase());
      const displayName = text(declaration.expressionName).split(":").filter(Boolean).at(-1) || id;
      fields.push({ id, idx: id, name: displayName, type: variableType(declaration.valueType), editable: true });
    }
    basic.push({
      id: group.id,
      idx: group.id,
      name: group.name,
      title: group.name,
      type: "list",
      value: listRefId,
      source: "workflow-set-data-list-plan",
    });
    listref.push({ id: listRefId, idx: listRefId, name: `${group.name} Rows`, fields });
  }
  return { basic, listref, filter: [] };
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
