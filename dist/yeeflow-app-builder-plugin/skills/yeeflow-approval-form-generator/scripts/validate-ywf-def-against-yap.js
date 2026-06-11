#!/usr/bin/env node

const fs = require("fs");
const { parseJsonPreservingLargeInts } = require("./inspect-yap-package.js");

const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;

function usage(exitCode = 1) {
  const out = [
    "Usage:",
    "  node validate-ywf-def-against-yap.js <decoded-def.json> <metadata.json> --mode <draft|final> [--profile <generator|compat>]",
    "",
    "Example:",
    "  node validate-ywf-def-against-yap.js ./travel-request-def.sandbox.json ./procurement-metadata.json --mode final --profile generator",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(out);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { defPath: null, metadataPath: null, mode: "draft", profile: "generator" };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--mode") args.mode = argv[++i];
    else if (arg === "--profile") args.profile = argv[++i];
    else if (!args.defPath) args.defPath = arg;
    else if (!args.metadataPath) args.metadataPath = arg;
    else usage();
  }
  if (!args.defPath || !args.metadataPath || !["draft", "final"].includes(args.mode) || !["generator", "compat"].includes(args.profile)) usage();
  return args;
}

function readJsonLossless(filePath) {
  return parseJsonPreservingLargeInts(fs.readFileSync(filePath, "utf8"), new Set());
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function stencilId(node) {
  return node && node.stencil && (node.stencil.id || node.stencil);
}

function shapeName(node) {
  return node && node.properties && node.properties.name;
}

function addIssue(list, code, message, path, detail) {
  list.push({ code, message, path: path || null, detail: detail || null });
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function collectPlaceholders(value) {
  const found = new Map();
  walk(value, (node, pointer) => {
    if (typeof node === "string" && PLACEHOLDER_RE.test(node)) {
      if (!found.has(node)) found.set(node, []);
      found.get(node).push(pointer);
    }
  });
  return [...found.entries()].map(([placeholder, paths]) => ({ placeholder, paths }));
}

function decodeHtmlEntities(value) {
  return String(value)
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseExpression(value) {
  if (value === null || value === undefined || value === "") return { sourceKind: "literal", rawExpressionPreview: "" };
  if (Array.isArray(value)) {
    const first = value.find((item) => isObject(item)) || {};
    if (first.exprType === "list_field") {
      return {
        sourceKind: "listTriggerField",
        sourceVariable: first.id || null,
        sourceListVariable: null,
        sourceRowField: first.prop || null,
        sourceType: first.valueType || null,
        rawExpressionPreview: JSON.stringify(value).slice(0, 240),
      };
    }
    if (first.exprType === "variable") {
      if (first.key && String(first.key).startsWith("_list.")) {
        return {
          sourceKind: "listRowVariable",
          sourceVariable: null,
          sourceListVariable: first.id || null,
          sourceRowField: String(first.key).replace(/^_list\./, ""),
          sourceType: first.valueType || null,
          rawExpressionPreview: JSON.stringify(value).slice(0, 240),
        };
      }
      return {
        sourceKind: "workflowVariable",
        sourceVariable: first.id || null,
        sourceListVariable: null,
        sourceRowField: null,
        sourceType: first.valueType || null,
        rawExpressionPreview: JSON.stringify(value).slice(0, 240),
      };
    }
    if (first.type === "func" || first.func) {
      return {
        sourceKind: "function",
        sourceVariable: first.func || null,
        sourceListVariable: null,
        sourceRowField: null,
        sourceType: null,
        rawExpressionPreview: JSON.stringify(value).slice(0, 240),
      };
    }
    return { sourceKind: "expressionArray", rawExpressionPreview: JSON.stringify(value).slice(0, 240) };
  }
  if (typeof value !== "string") return { sourceKind: "literal", rawExpressionPreview: String(value) };
  if (!value.includes("<input")) return { sourceKind: "literal", rawExpressionPreview: value.slice(0, 240) };

  const decoded = decodeHtmlEntities(value);
  const label = (decoded.match(/value="([^"]*)"/) || [])[1] || "";
  const encodedDataJson = (value.match(/data="\$\{([\s\S]*?)\}"\s+expr=/) || [])[1] || null;
  const dataJson = encodedDataJson ? decodeHtmlEntities(encodedDataJson) : null;
  let data = null;
  if (dataJson) {
    try {
      data = JSON.parse(dataJson.trim().startsWith("{") ? dataJson : `{${dataJson}}`);
    } catch {
      data = null;
    }
  }
  const exprType = data && data.type;
  const param = data && data.param;
  const id = param && param.id;
  const prop = data && data.prop;
  const isList = param && param.t === "list";
  if (exprType === "variable" && isList) {
    return {
      sourceKind: "listRowVariable",
      sourceVariable: null,
      sourceListVariable: id || null,
      sourceRowField: prop || null,
      sourceType: null,
      rawExpressionPreview: label || decoded.slice(0, 240),
    };
  }
  if (exprType === "variable") {
    return {
      sourceKind: "workflowVariable",
      sourceVariable: id || null,
      sourceListVariable: null,
      sourceRowField: null,
      sourceType: null,
      rawExpressionPreview: label || decoded.slice(0, 240),
    };
  }
  if (exprType === "application" || exprType === "instance") {
    return {
      sourceKind: "function",
      sourceVariable: prop || label || null,
      sourceListVariable: null,
      sourceRowField: null,
      sourceType: null,
      rawExpressionPreview: label || decoded.slice(0, 240),
    };
  }
  return {
    sourceKind: "unknown",
    sourceVariable: id || null,
    sourceListVariable: null,
    sourceRowField: prop || null,
    sourceType: null,
    rawExpressionPreview: label || decoded.slice(0, 240),
  };
}

function normalizedVariableType(type) {
  const t = String(type || "").toLowerCase();
  if (t === "user" || t.includes("identity")) return "user";
  if (t === "file" || t.includes("file")) return "file";
  if (t === "number" || t === "decimal" || t === "currency") return "number";
  if (t === "date" || t.includes("time")) return "date";
  if (t === "lookup") return "lookup";
  if (t === "list") return "list";
  if (t === "text" || t === "string") return "text";
  return t || "unknown";
}

function isCompatible(sourceType, targetType, sourceKind) {
  if (!sourceType || !targetType || sourceType === "unknown" || targetType === "unknown") return true;
  if (sourceKind === "literal" || sourceKind === "function" || sourceKind === "expressionArray") return true;
  if (sourceType === targetType) return true;
  if (sourceType === "text" && ["longText", "choice", "hyperlink"].includes(targetType)) return true;
  if (sourceType === "number" && targetType === "currency") return true;
  if (sourceType === "lookup" && ["text", "lookup"].includes(targetType)) return true;
  return false;
}

function buildContext(def, metadata) {
  const listsById = new Map(asArray(metadata.lists).map((list) => [String(list.listId), list]));
  const fieldsByListAndStorage = new Map();
  const fieldsByListAndInternal = new Map();
  const fieldsByListAndId = new Map();
  for (const list of asArray(metadata.lists)) {
    const byStorage = new Map();
    const byInternal = new Map();
    const byId = new Map();
    for (const field of asArray(list.fields)) {
      if (field.storageFieldName) byStorage.set(String(field.storageFieldName), field);
      if (field.internalName) byStorage.set(String(field.internalName), field);
      if (field.internalName) byInternal.set(String(field.internalName), field);
      if (field.displayName) byInternal.set(String(field.displayName), field);
      if (field.fieldId) byId.set(String(field.fieldId), field);
      if (field.FieldID) byId.set(String(field.FieldID), field);
      if (field.id) byId.set(String(field.id), field);
    }
    fieldsByListAndStorage.set(String(list.listId), byStorage);
    fieldsByListAndInternal.set(String(list.listId), byInternal);
    fieldsByListAndId.set(String(list.listId), byId);
  }

  const basicVars = new Map(asArray(def.variables && def.variables.basic).map((variable) => [variable.id, variable]));
  const listrefs = new Map(asArray(def.variables && def.variables.listref).map((listref) => [listref.id, listref]));
  const listRowFieldsByVar = new Map();
  for (const variable of basicVars.values()) {
    if (variable.type === "list" && variable.value && listrefs.has(variable.value)) {
      listRowFieldsByVar.set(variable.id, new Map(asArray(listrefs.get(variable.value).fields).map((field) => [field.id, field])));
    }
  }
  const listControlFieldsByVar = collectListControlFields(def);
  const metadataAgentIds = new Set(asArray(metadata.aiReferences).flatMap((item) => asArray(item.agentIds).map(String)));
  const documentLibraryIds = new Set(asArray(metadata.lists).filter((list) => list.resourceType === "document library").map((list) => String(list.listId)));
  for (const dep of asArray(metadata.documentDependencies)) {
    if (dep.targetLibraryId) documentLibraryIds.add(String(dep.targetLibraryId));
  }
  const formName = asArray(metadata.forms).find((form) => form.defkey === def.defkey || form.key === def.defkey)?.name || null;

  return { listsById, fieldsByListAndStorage, fieldsByListAndInternal, fieldsByListAndId, basicVars, listRowFieldsByVar, listControlFieldsByVar, metadataAgentIds, documentLibraryIds, formName };
}

function resolveField(ctx, listId, column) {
  const key = String(listId);
  return (ctx.fieldsByListAndStorage.get(key) && ctx.fieldsByListAndStorage.get(key).get(String(column))) ||
    (ctx.fieldsByListAndInternal.get(key) && ctx.fieldsByListAndInternal.get(key).get(String(column))) ||
    (ctx.fieldsByListAndId.get(key) && ctx.fieldsByListAndId.get(key).get(String(column))) ||
    null;
}

function walkControls(control, visitor, pointer) {
  if (!control || typeof control !== "object") return;
  visitor(control, pointer);
  for (const key of ["children", "columns"]) {
    if (Array.isArray(control[key])) {
      control[key].forEach((child, index) => walkControls(child, visitor, `${pointer}.${key}[${index}]`));
    } else if (isObject(control[key]) && Array.isArray(control[key].children)) {
      control[key].children.forEach((child, index) => walkControls(child, visitor, `${pointer}.${key}.children[${index}]`));
    }
  }
}

function collectListControlFields(def) {
  const byVar = new Map();
  asArray(def.pageurls).forEach((page) => {
    walkControls(page.formdef || page, (control) => {
      if (control.type !== "list" || !control.binding) return;
      if (!byVar.has(control.binding)) byVar.set(control.binding, new Map());
      const fields = byVar.get(control.binding);
      for (const field of asArray(control.attrs && control.attrs["list-fields"])) {
        if (field.id) fields.set(String(field.id), field);
        if (field.name) fields.set(String(field.name), field);
        if (field.control && field.control.binding) fields.set(String(field.control.binding), field);
        if (field.control && field.control.label) fields.set(String(field.control.label), field);
      }
      for (const field of asArray(control.attrs && control.attrs["list-variables"])) {
        if (field.id) fields.set(String(field.id), field);
        if (field.name) fields.set(String(field.name), field);
      }
    }, "$.formdef");
  });
  return byVar;
}

function normalizeName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function sameText(a, b) {
  return normalizeName(a) === normalizeName(b);
}

function pluralSingularVariants(value) {
  const raw = String(value || "");
  const variants = new Set();
  if (!raw) return [];
  if (raw.endsWith("s")) variants.add(raw.slice(0, -1));
  else variants.add(`${raw}s`);
  if (raw.endsWith("y")) variants.add(`${raw.slice(0, -1)}ies`);
  if (raw.endsWith("ies")) variants.add(`${raw.slice(0, -3)}y`);
  return [...variants];
}

function extractAgentIds(value) {
  const ids = new Set();
  walk(value, (node) => {
    if (isObject(node)) {
      for (const key of ["AgentID", "AgentId", "agentId"]) if (node[key]) ids.add(String(node[key]));
    }
    if (typeof node === "string") {
      for (const match of node.matchAll(/"AgentID"\s*:\s*"([^"]+)"/g)) ids.add(match[1]);
    }
  });
  return [...ids];
}

function validate(def, metadata, mode, profile = "generator") {
  const errors = [];
  const warnings = [];
  const resolvedReferences = {
    contentListTargets: [],
    fieldMappings: [],
    lookupSources: [],
    documentDependencies: [],
    aiReferences: [],
  };
  const summary = {
    contentListNodesChecked: 0,
    fieldMappingsChecked: 0,
    lookupSourcesChecked: 0,
    documentDependenciesChecked: 0,
    aiReferencesChecked: 0,
    typeWarnings: 0,
    compatWarnings: 0,
  };

  if (!def || !metadata) {
    addIssue(errors, "INVALID_INPUT", "Decoded Def and metadata must both be valid JSON objects");
    return finish();
  }

  const ctx = buildContext(def, metadata);
  validatePlaceholders();
  validateContentLists();
  validateLookups();
  validateDocuments();
  validateAI();
  return finish();

  function finish() {
    return {
      status: errors.length ? "fail" : warnings.length ? "pass_with_warnings" : "pass",
      mode,
      profile,
      errors,
      warnings,
      resolvedReferences,
      summary,
    };
  }

  function validatePlaceholders() {
    const placeholders = collectPlaceholders(def);
    if (placeholders.length === 0) return;
    const issue = mode === "final" ? errors : warnings;
    addIssue(issue, "UNRESOLVED_PLACEHOLDERS", `${placeholders.length} unresolved required placeholder(s) remain`, "$", placeholders);
  }

  function validateContentLists() {
    asArray(def.childshapes).forEach((node, nodeIndex) => {
      if (stencilId(node) !== "ContentList") return;
      summary.contentListNodesChecked += 1;
      const props = node.properties || {};
      const path = `$.childshapes[${nodeIndex}].properties`;
      const listId = props.listid;
      const targetList = listId ? ctx.listsById.get(String(listId)) : null;
      const appMatches = props.appid === undefined || props.appid === null || String(props.appid) === String(metadata.app && metadata.app.appId);
      const listSetMatches = props.listsetid === undefined || props.listsetid === null ||
        String(props.listsetid) === String(metadata.app && metadata.app.mainListSetId) ||
        asArray(metadata.lists).some((list) => String(list.listSetId) === String(props.listsetid));

      if (!appMatches) addIssue(errors, "CONTENTLIST_APPID_UNKNOWN", "ContentList appid does not match metadata appId", `${path}.appid`, { nodeName: shapeName(node), appid: props.appid, metadataAppId: metadata.app && metadata.app.appId });
      if (!listSetMatches) addIssue(errors, "CONTENTLIST_LISTSET_UNKNOWN", "ContentList listsetid is not known in metadata", `${path}.listsetid`, { nodeName: shapeName(node), listsetid: props.listsetid });
      if (!targetList) addIssue(errors, "CONTENTLIST_LIST_NOT_FOUND", "ContentList target listid was not found in metadata.lists", `${path}.listid`, { nodeName: shapeName(node), listid: listId });

      resolvedReferences.contentListTargets.push({
        nodeName: shapeName(node),
        operation: props.type,
        listId,
        listName: targetList ? targetList.name : null,
        appIdValid: appMatches,
        listSetValid: listSetMatches,
        listFound: !!targetList,
      });

      asArray(props.listdatas).forEach((mapping, mappingIndex) => {
        summary.fieldMappingsChecked += 1;
        const mappingPath = `${path}.listdatas[${mappingIndex}]`;
        const targetField = targetList ? resolveField(ctx, listId, mapping.Columns) : null;
        if (targetList && !targetField) {
          addIssue(errors, "CONTENTLIST_FIELD_NOT_FOUND", "ContentList Columns value does not resolve to a target list field", `${mappingPath}.Columns`, { nodeName: shapeName(node), listId, columns: mapping.Columns });
        }
        const source = parseExpression(mapping.Data);
        validateSourceReference(source, `${mappingPath}.Data`, node, targetField);
        const sourceType = inferSourceType(source);
        const targetType = targetField ? targetField.normalizedType : "unknown";
        if (!isCompatible(sourceType, targetType, source.sourceKind)) {
          summary.typeWarnings += 1;
          addIssue(warnings, "TYPE_MISMATCH_POSSIBLE", "Source variable type may not match target field type", mappingPath, {
            nodeName: shapeName(node),
            targetDisplayName: targetField && targetField.displayName,
            targetType,
            sourceKind: source.sourceKind,
            sourceType,
            sourceVariable: source.sourceVariable,
            sourceListVariable: source.sourceListVariable,
            sourceRowField: source.sourceRowField,
          });
        }
        resolvedReferences.fieldMappings.push({
          nodeName: shapeName(node),
          targetListId: listId,
          targetListName: targetList ? targetList.name : null,
          targetColumn: mapping.Columns,
          targetDisplayName: targetField ? targetField.displayName : null,
          targetNormalizedType: targetType,
          source,
          sourceType,
        });
      });

      if (["edit", "remove"].includes(props.type)) {
        asArray(props.wheres).forEach((where, whereIndex) => {
          const wherePath = `${path}.wheres[${whereIndex}]`;
          if (targetList && !resolveField(ctx, listId, where.left) && where.left !== "ListDataID") {
            addIssue(errors, "WHERE_FIELD_NOT_FOUND", "ContentList where left field does not exist in target list", `${wherePath}.left`, { nodeName: shapeName(node), listId, left: where.left });
          }
          validateSourceReference(parseExpression(where.right), `${wherePath}.right`, node, null);
        });
      }
    });
  }

  function validateSourceReference(source, path, node, targetField) {
    if (source.sourceKind === "workflowVariable" && source.sourceVariable && !ctx.basicVars.has(source.sourceVariable)) {
      addIssue(errors, "SOURCE_VARIABLE_NOT_FOUND", "Expression references a workflow variable that does not exist in variables.basic", path, { nodeName: shapeName(node), sourceVariable: source.sourceVariable });
    }
    if (source.sourceKind === "listRowVariable") {
      if (!source.sourceListVariable || !ctx.listRowFieldsByVar.has(source.sourceListVariable)) {
        addIssue(errors, "SOURCE_LIST_VARIABLE_NOT_FOUND", "Expression references a list variable that does not exist or has no listref", path, { nodeName: shapeName(node), sourceListVariable: source.sourceListVariable });
      } else if (source.sourceRowField && !ctx.listRowFieldsByVar.get(source.sourceListVariable).has(source.sourceRowField)) {
        if (profile === "compat" && targetField) {
          summary.compatWarnings += 1;
          addIssue(warnings, "SOURCE_ROW_FIELD_NOT_FOUND_COMPAT", "Expression references a row field missing from listref; downgraded in compat profile because target field resolves and source list variable exists", path, {
            originalCode: "SOURCE_ROW_FIELD_NOT_FOUND",
            formName: ctx.formName,
            nodeName: shapeName(node),
            sourceListVariable: source.sourceListVariable,
            missingRowField: source.sourceRowField,
            targetField: {
              displayName: targetField.displayName || null,
              internalName: targetField.internalName || null,
              storageFieldName: targetField.storageFieldName || null,
              normalizedType: targetField.normalizedType || null,
            },
            suggestedAliases: suggestedAliases(source, targetField),
          });
        } else {
          addIssue(errors, "SOURCE_ROW_FIELD_NOT_FOUND", "Expression references a row field that does not exist in the listref", path, { nodeName: shapeName(node), sourceListVariable: source.sourceListVariable, sourceRowField: source.sourceRowField });
        }
      }
    }
  }

  function suggestedAliases(source, targetField) {
    const missing = String(source.sourceRowField || "");
    const suggestions = [];
    const add = (kind, value, detail) => {
      if (!value) return;
      const key = `${kind}:${value}`;
      if (!suggestions.some((item) => `${item.kind}:${item.value}` === key)) suggestions.push({ kind, value, detail: detail || null });
    };

    const variants = pluralSingularVariants(missing);
    const rowFields = ctx.listRowFieldsByVar.get(source.sourceListVariable) || new Map();
    const controlFields = ctx.listControlFieldsByVar.get(source.sourceListVariable) || new Map();

    for (const variant of variants) {
      if (rowFields.has(variant)) add("pluralSingularRowField", variant, "Exact plural/singular row-field variation exists in variables.listref");
      if (controlFields.has(variant)) add("pluralSingularListControlField", variant, "Exact plural/singular field exists in list control metadata");
    }

    for (const field of rowFields.values()) {
      if (sameText(field.id, missing) || sameText(field.name, missing)) add("caseInsensitiveRowField", field.id, `Row field name: ${field.name || ""}`);
    }

    for (const field of controlFields.values()) {
      if (sameText(field.id, missing) || sameText(field.name, missing) || sameText(field.control && field.control.binding, missing) || sameText(field.control && field.control.label, missing)) {
        add("listControlMetadata", field.id || field.name, `List control field: ${field.name || field.control?.label || ""}`);
      }
    }

    for (const value of [targetField.displayName, targetField.internalName, targetField.storageFieldName]) {
      if (value && (sameText(value, missing) || variants.some((variant) => sameText(value, variant)))) {
        add("targetFieldMatch", value, "Target display/internal/storage field resembles the missing row field");
      }
    }

    for (const variable of ctx.basicVars.values()) {
      if (sameText(variable.id, missing) || sameText(variable.name, missing) || variants.some((variant) => sameText(variable.id, variant) || sameText(variable.name, variant))) {
        add("standaloneVariable", variable.id, `Workflow variable name: ${variable.name || ""}`);
      }
    }

    return suggestions;
  }

  function inferSourceType(source) {
    if (source.sourceKind === "workflowVariable" && source.sourceVariable && ctx.basicVars.has(source.sourceVariable)) {
      return normalizedVariableType(ctx.basicVars.get(source.sourceVariable).type);
    }
    if (source.sourceKind === "listRowVariable" && source.sourceListVariable && source.sourceRowField && ctx.listRowFieldsByVar.has(source.sourceListVariable)) {
      const field = ctx.listRowFieldsByVar.get(source.sourceListVariable).get(source.sourceRowField);
      return normalizedVariableType(field && field.type);
    }
    if (source.sourceKind === "listTriggerField") return normalizedVariableType(source.sourceType);
    return source.sourceKind === "literal" ? "unknown" : normalizedVariableType(source.sourceType);
  }

  function validateLookups() {
    const controlsByBinding = new Map();
    asArray(def.pageurls).forEach((page) => {
      walkControls(page.formdef || page, (control, pointer) => {
        if (control && typeof control.binding === "string" && !controlsByBinding.has(control.binding)) {
          controlsByBinding.set(control.binding, { control, pointer, page });
        }
      }, "$.formdef");
    });

    asArray(def.pageurls).forEach((page, pageIndex) => {
      const pageTitle = page.title || page.name || (page.formdef && (page.formdef.title || page.formdef.name)) || page.id;
      walkControls(page.formdef || page, (control, pointer) => {
        const attrs = control.attrs || {};
        if (!(control.type === "lookup" || control.type === "lookup-list" || attrs.listid || attrs.listId)) return;
        summary.lookupSourcesChecked += 1;
        const listId = attrs.listid || attrs.listId;
        const list = listId ? ctx.listsById.get(String(listId)) : null;
        const displayField = list ? resolveField(ctx, listId, attrs.listfield) : null;
        const sortName = attrs["sort-first"] && attrs["sort-first"].SortName;
        const sortField = list && sortName ? resolveField(ctx, listId, sortName) : null;
        const path = `$.pageurls[${pageIndex}]${pointer.replace(/^\$/, "")}`;
        const appMatches = !attrs.appid || !metadata.app || !metadata.app.appId || String(attrs.appid) === String(metadata.app.appId);
        const listSetMatches = !attrs.listsetid || !list ||
          String(attrs.listsetid) === String(list.listSetId || list.listSetID || "") ||
          String(attrs.listsetid) === String(metadata.app && metadata.app.mainListSetId);
        if (!appMatches) addIssue(errors, "LOOKUP_APPID_NOT_IN_METADATA", "Lookup source appid does not match metadata appId", `${path}.attrs.appid`, { pageTitle, controlLabel: control.label, appid: attrs.appid, metadataAppId: metadata.app && metadata.app.appId });
        if (list && !listSetMatches) addIssue(errors, "LOOKUP_LISTSET_NOT_IN_METADATA", "Lookup source listsetid does not match source list metadata", `${path}.attrs.listsetid`, { pageTitle, controlLabel: control.label, listsetid: attrs.listsetid, sourceListId: listId, sourceListSetId: list.listSetId });
        if (listId && !list) addIssue(errors, "LOOKUP_LIST_NOT_FOUND", "Lookup source listid was not found in metadata.lists", path, { pageTitle, controlLabel: control.label, listId });
        if (list && attrs.listfield && !displayField) addIssue(errors, "LOOKUP_DISPLAY_FIELD_NOT_FOUND", "Lookup display field was not found in source list", `${path}.attrs.listfield`, { pageTitle, controlLabel: control.label, listId, displayField: attrs.listfield });
        if (list && sortName && !sortField) addIssue(errors, "LOOKUP_SORT_FIELD_NOT_FOUND", "Lookup sort field was not found in source list", `${path}.attrs["sort-first"].SortName`, { pageTitle, controlLabel: control.label, listId, sortField: sortName });

        const additions = [];
        asArray(attrs.addition).forEach((addition, additionIndex) => {
          const additionPath = `${path}.attrs.addition[${additionIndex}]`;
          const sourceByName = list && addition && addition.FieldName ? resolveField(ctx, listId, addition.FieldName) : null;
          const sourceById = list && addition && addition.FieldID ? resolveField(ctx, listId, addition.FieldID) : null;
          if (list && addition && addition.FieldName && !sourceByName) {
            addIssue(errors, "LOOKUP_ADDITION_SOURCE_FIELD_NOT_FOUND", "Lookup additional mapping source FieldName was not found in source list", `${additionPath}.FieldName`, { pageTitle, controlLabel: control.label, listId, fieldName: addition.FieldName });
          }
          if (list && addition && addition.FieldID && !sourceById) {
            addIssue(errors, "LOOKUP_ADDITION_SOURCE_FIELD_ID_NOT_FOUND", "Lookup additional mapping source FieldID was not found in source list", `${additionPath}.FieldID`, { pageTitle, controlLabel: control.label, listId, fieldId: addition.FieldID });
          }
          if (addition && addition.RelationName && !ctx.basicVars.has(addition.RelationName)) {
            addIssue(errors, "LOOKUP_ADDITION_TARGET_VARIABLE_NOT_FOUND", "Lookup additional mapping target RelationName was not found in variables.basic", `${additionPath}.RelationName`, { pageTitle, controlLabel: control.label, relationName: addition.RelationName });
          }
          if (addition && addition.RelationName && ctx.basicVars.has(addition.RelationName)) {
            const targetControl = controlsByBinding.get(addition.RelationName);
            if (!targetControl) {
              addIssue(warnings, "LOOKUP_DERIVED_TARGET_CONTROL_NOT_FOUND", "Lookup additional target variable exists but no visible control is bound to it", additionPath, { pageTitle, controlLabel: control.label, relationName: addition.RelationName });
            } else if (targetControl.control.readonly !== true) {
              addIssue(warnings, "LOOKUP_DERIVED_TARGET_CONTROL_EDITABLE", "Control populated by lookup additional mapping should usually be readonly", targetControl.pointer, { pageTitle, controlLabel: targetControl.control.label, relationName: addition.RelationName });
            }
          }
          additions.push({
            sourceFieldName: addition && addition.FieldName || null,
            sourceFieldId: addition && addition.FieldID || null,
            sourceResolvedByName: !!sourceByName,
            sourceResolvedById: !!sourceById,
            targetVariable: addition && addition.RelationName || null,
            targetVariableExists: !!(addition && addition.RelationName && ctx.basicVars.has(addition.RelationName)),
            relationFieldIsMultiple: addition && addition.RelationFieldIsMultiple === true,
          });
        });

        resolvedReferences.lookupSources.push({
          pageTitle,
          controlLabel: control.label || null,
          controlType: control.type || null,
          binding: control.binding || null,
          appId: attrs.appid || null,
          listSetId: attrs.listsetid || null,
          sourceListId: listId || null,
          sourceListName: list ? list.name : null,
          displayField: attrs.listfield || null,
          displayFieldName: displayField ? displayField.displayName : null,
          sortField: sortName || null,
          sortFieldName: sortField ? sortField.displayName : null,
          singleSelectConfirmed: !(attrs.multiple === true || attrs.multiple === "true"),
          additionalFields: additions,
          resolved: !listId || !!list,
        });
      }, "$.formdef");
    });
  }

  function validateDocuments() {
    asArray(def.childshapes).forEach((node, nodeIndex) => {
      if (stencilId(node) !== "GenerateDocument") return;
      summary.documentDependenciesChecked += 1;
      const props = node.properties || {};
      const text = JSON.stringify(props);
      const ids = [...text.matchAll(/\b\d{16,}\b/g)].map((match) => match[0]);
      const matched = ids.filter((id) => ctx.documentLibraryIds.has(String(id)));
      if (ids.length === 0) {
        addIssue(warnings, "DOCUMENT_TEMPLATE_NOT_VERIFIABLE", "GenerateDocument node found, but template/library IDs were not clearly extractable", `$.childshapes[${nodeIndex}].properties`, { nodeName: shapeName(node) });
      } else if (matched.length === 0) {
        addIssue(warnings, "DOCUMENT_DEPENDENCY_EXTERNAL_OR_UNRESOLVED", "GenerateDocument node references IDs not resolved to known document libraries/dependencies", `$.childshapes[${nodeIndex}].properties`, { nodeName: shapeName(node), ids });
      }
      resolvedReferences.documentDependencies.push({ nodeName: shapeName(node), ids, matchedDocumentLibraryIds: matched });
    });
  }

  function validateAI() {
    asArray(def.childshapes).forEach((node, nodeIndex) => {
      if (stencilId(node) !== "AI") return;
      summary.aiReferencesChecked += 1;
      const ids = extractAgentIds(node.properties || {});
      if (ids.length && ids.some((id) => !ctx.metadataAgentIds.has(String(id)))) {
        addIssue(warnings, "AI_AGENT_NOT_IN_METADATA", "AI node references an Agent ID not found in metadata.aiReferences", `$.childshapes[${nodeIndex}].properties`, { nodeName: shapeName(node), agentIds: ids });
      }
      if (!ids.length) addIssue(warnings, "AI_NODE_WITHOUT_AGENT_ID", "AI node found without a direct Agent ID; it may be prompt-only or external", `$.childshapes[${nodeIndex}].properties`, { nodeName: shapeName(node) });
      resolvedReferences.aiReferences.push({ nodeName: shapeName(node), agentIds: ids, resolved: ids.every((id) => ctx.metadataAgentIds.has(String(id))) });
    });
    asArray(def.pageurls).forEach((page, pageIndex) => {
      asArray(page.formdef && page.formdef.actions).forEach((action, actionIndex) => {
        const ids = extractAgentIds(action);
        const hasAI = JSON.stringify(action).includes('"type":"ai"') || ids.length > 0;
        if (!hasAI) return;
        summary.aiReferencesChecked += 1;
        if (ids.length && ids.some((id) => !ctx.metadataAgentIds.has(String(id)))) {
          addIssue(warnings, "AI_AGENT_NOT_IN_METADATA", "AI form action references an Agent ID not found in metadata.aiReferences", `$.pageurls[${pageIndex}].formdef.actions[${actionIndex}]`, { actionName: action.name, agentIds: ids });
        }
        if (!ids.length) addIssue(warnings, "AI_ACTION_WITHOUT_AGENT_ID", "AI form action found without a direct Agent ID; it may be prompt-only", `$.pageurls[${pageIndex}].formdef.actions[${actionIndex}]`, { actionName: action.name });
        resolvedReferences.aiReferences.push({ pageTitle: page.title || page.name, actionName: action.name || null, agentIds: ids, resolved: ids.every((id) => ctx.metadataAgentIds.has(String(id))) });
      });
    });
  }
}

function main() {
  const args = parseArgs(process.argv);
  const def = readJsonLossless(args.defPath);
  const metadata = readJsonLossless(args.metadataPath);
  const report = validate(def, metadata, args.mode, args.profile);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.log(JSON.stringify({
      status: "fail",
      profile: "generator",
      errors: [{ code: "VALIDATOR_FAILED", message: error.message }],
      warnings: [],
      resolvedReferences: {
        contentListTargets: [],
        fieldMappings: [],
        lookupSources: [],
        documentDependencies: [],
        aiReferences: [],
      },
      summary: {
        contentListNodesChecked: 0,
        fieldMappingsChecked: 0,
        lookupSourcesChecked: 0,
        documentDependenciesChecked: 0,
        aiReferencesChecked: 0,
        typeWarnings: 0,
        compatWarnings: 0,
      },
    }, null, 2));
    process.exit(1);
  }
}

module.exports = { validate, parseExpression };
