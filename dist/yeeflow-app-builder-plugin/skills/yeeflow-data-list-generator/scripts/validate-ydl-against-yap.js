#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const SECRET_KEY_RE = /(token|secret|password|credential|clientsecret|apikey|api_key|accesskey)/i;
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
  "ListID",
  "ListSetID",
]);

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node validate-ydl-against-yap.js <list.ydl|decoded-data.json> <metadata.json> --mode <compatibility|generator>",
    "",
    "Example:",
    "  node validate-ydl-against-yap.js \"./Communication Records.ydl\" ./nhic-ydl-metadata.json --mode compatibility",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, metadata: null, mode: "generator" };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--mode") args.mode = argv[++i];
    else if (!args.input) args.input = arg;
    else if (!args.metadata) args.metadata = arg;
    else usage();
  }
  if (!args.input || !args.metadata || !["compatibility", "generator"].includes(args.mode)) usage();
  return args;
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

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!isObject(value)) return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) out[key] = SECRET_KEY_RE.test(key) ? "__REDACTED__" : redact(child);
  return out;
}

function tryParseJson(value) {
  if (typeof value !== "string" || !value.trim()) return { ok: false, value: null };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (error) {
    return { ok: false, value: null, error: error.message };
  }
}

function issue(report, severity, code, message, details = {}) {
  report[severity === "error" ? "errors" : "warnings"].push({ code, message, ...redact(details) });
}

function generatorOrWarning(report, code, message, details = {}) {
  issue(report, report.mode === "generator" ? "error" : "warning", code, message, details);
}

function addDependency(report, dependency) {
  const key = JSON.stringify(dependency);
  if (!report._dependencyKeys.has(key)) {
    report._dependencyKeys.add(key);
    report.dependencies.push(redact(dependency));
  }
}

function runInspector(inputPath) {
  const inspector = path.join(__dirname, "inspect-ydl-package.js");
  if (!fs.existsSync(inspector)) throw new Error(`Required inspector not found: ${inspector}`);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ydl-app-context-"));
  const jsonPath = path.join(tmpDir, "inspection.json");
  const mdPath = path.join(tmpDir, "inspection.md");
  const result = spawnSync(process.execPath, [inspector, inputPath, "--json", jsonPath, "--md", mdPath], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) throw new Error(`inspect-ydl-package.js failed: ${result.stderr || result.stdout}`);
  const report = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return report;
}

function fieldKeyVariants(field) {
  return [
    field.fieldName,
    field.FieldName,
    field.storageFieldName,
    field.StorageFieldName,
    field.internalName,
    field.InternalName,
    field.displayName,
    field.DisplayName,
    field.fieldId,
    field.FieldID,
  ].filter(Boolean).map(String);
}

function listIdOf(list) {
  return list.listId || list.ListID || list.id || (list.listModel && list.listModel.ListID) || null;
}

function listTitleOf(list) {
  return list.title || list.name || list.listTitle || list.Title || list.displayName || null;
}

function listSetIdOf(list) {
  return list.listSetId || list.ListSetID || list.listsetid || null;
}

function appIdOf(list) {
  return list.appId || list.AppID || list.appid || null;
}

function fieldsOfList(list) {
  return asArray(list.fields || list.Fields || list.fieldInventory || list.defs || list.Defs);
}

function buildMetadataIndex(metadata) {
  const listsRaw = asArray(metadata.lists);
  const listsById = new Map();
  const fieldsByListId = new Map();
  const recordsByListId = new Map();

  for (const list of listsRaw) {
    const id = listIdOf(list);
    if (!id) continue;
    listsById.set(String(id), list);
    const fieldMap = new Map();
    for (const field of fieldsOfList(list)) {
      for (const key of fieldKeyVariants(field)) fieldMap.set(key, field);
    }
    fieldsByListId.set(String(id), fieldMap);
  }

  for (const sample of asArray(metadata.sampleData)) {
    const listId = sample.listId || sample.ListID;
    if (!listId) continue;
    const ids = new Set();
    for (const ref of asArray(sample.lookupValueExamples)) {
      if (ref.recordId) ids.add(String(ref.recordId));
    }
    for (const shape of asArray(sample.valueShapesByField)) {
      for (const example of asArray(shape.examples)) if (example.recordId) ids.add(String(example.recordId));
    }
    recordsByListId.set(String(listId), ids);
  }

  const app = metadata.app || {};
  return {
    raw: metadata,
    app: {
      appId: app.appId || metadata.appId || (metadata.packageSummaries && metadata.packageSummaries[0] && metadata.packageSummaries[0].appId) || null,
      mainListSetId: app.mainListSetId || metadata.mainListSetId || null,
      sourceKind: metadata.packageSummaries ? "ydl-compatible-metadata" : "yap-metadata",
    },
    listsById,
    fieldsByListId,
    recordsByListId,
  };
}

function parsedRules(field) {
  if (isObject(field.Rules)) return field.Rules;
  const parsed = tryParseJson(field.Rules);
  return parsed.ok ? parsed.value : {};
}

function localFieldMap(inspection) {
  const map = new Map();
  for (const field of asArray(inspection.fieldInventory)) {
    for (const key of [field.FieldName, field.InternalName, field.DisplayName, field.FieldID].filter(Boolean)) map.set(String(key), field);
  }
  return map;
}

function resolveMetadataField(index, listId, fieldRef) {
  if (!listId || !fieldRef) return null;
  const fieldMap = index.fieldsByListId.get(String(listId));
  return fieldMap ? fieldMap.get(String(fieldRef)) || null : null;
}

function validateTargetContext(inspection, index, report) {
  const summary = inspection.listSummary || {};
  const appId = summary.AppID;
  if (index.app.appId && appId && String(appId) !== String(index.app.appId)) {
    issue(report, "error", "APP_ID_MISMATCH", "List AppID does not match metadata appId.", { listAppId: appId, metadataAppId: index.app.appId });
  }
  if (summary.ListID && index.listsById.has(String(summary.ListID))) {
    report.resolvedReferences.formReferences.push({
      kind: "sourceList",
      listId: summary.ListID,
      listTitle: summary.title,
      resolved: true,
    });
  } else if (summary.ListID) {
    generatorOrWarning(report, "SOURCE_LIST_NOT_IN_METADATA", "Source .ydl ListID is not present in metadata.lists.", { listId: summary.ListID, title: summary.title });
  }
  if (!summary.ListSetID) {
    const sourceList = summary.ListID ? index.listsById.get(String(summary.ListID)) : null;
    const metadataListSetId = sourceList ? listSetIdOf(sourceList) : null;
    if (metadataListSetId) {
      report.resolvedReferences.formReferences.push({
        kind: "sourceListSetId",
        listId: summary.ListID,
        listTitle: summary.title,
        listSetId: metadataListSetId,
        resolvedFromMetadata: true,
      });
    } else {
      const dep = { type: "sourceListSetId", listId: summary.ListID, listTitle: summary.title, requiredForGeneratorMode: true };
      addDependency(report, dep);
      if (report.mode === "generator") issue(report, "error", "SOURCE_LISTSET_ID_MISSING", "Standalone .ydl is missing ListSetID; generated package must map or provide it.", dep);
      else issue(report, "warning", "SOURCE_LISTSET_ID_MISSING_COMPAT", "Standalone .ydl is missing ListSetID; tolerated for compatibility.", dep);
    }
  }
}

function validateLookupRelationships(inspection, index, report) {
  const sourceListId = inspection.listSummary.ListID;
  for (const lookup of asArray(inspection.lookupRelationships)) {
    report.summary.lookupRelationshipsChecked += 1;
    const targetListId = lookup.targetListID;
    const target = targetListId ? index.listsById.get(String(targetListId)) : null;
    if (!target) {
      const dep = {
        type: "lookupTargetList",
        sourceListId,
        sourceFieldName: lookup.sourceField,
        sourceFieldDisplayName: lookup.sourceDisplayName,
        targetListId: targetListId || null,
        targetListSetId: lookup.targetListSetID || null,
        requiredForGeneratorMode: true,
      };
      addDependency(report, dep);
      generatorOrWarning(report, "LOOKUP_TARGET_LIST_NOT_FOUND", "Lookup target list is not present in supplied app metadata.", dep);
      continue;
    }

    const targetListSetId = listSetIdOf(target);
    if (lookup.targetListSetID && targetListSetId && String(lookup.targetListSetID) !== String(targetListSetId)) {
      generatorOrWarning(report, "LOOKUP_LISTSET_MISMATCH", "Lookup target ListSetID does not match metadata.", {
        sourceFieldName: lookup.sourceField,
        targetListId,
        lookupListSetId: lookup.targetListSetID,
        metadataListSetId: targetListSetId,
      });
    }

    const displayField = lookup.targetDisplayField;
    const displayResolved = resolveMetadataField(index, targetListId, displayField);
    if (displayField && !displayResolved) {
      generatorOrWarning(report, "LOOKUP_DISPLAY_FIELD_NOT_FOUND", "Lookup target display field does not exist in target list metadata.", {
        sourceFieldName: lookup.sourceField,
        targetListId,
        targetDisplayField: displayField,
      });
    }

    const missingSearchFields = asArray(lookup.searchFields).filter((field) => !resolveMetadataField(index, targetListId, field));
    if (missingSearchFields.length) {
      generatorOrWarning(report, "LOOKUP_SEARCH_FIELDS_NOT_FOUND", "Lookup search fields were not found in target list metadata.", {
        sourceFieldName: lookup.sourceField,
        targetListId,
        missingSearchFields,
      });
    }

    report.resolvedReferences.lookupTargets.push({
      sourceListId,
      sourceFieldName: lookup.sourceField,
      sourceFieldDisplayName: lookup.sourceDisplayName,
      targetListId,
      targetListTitle: listTitleOf(target),
      targetDisplayField: displayField,
      targetDisplayFieldResolved: Boolean(displayResolved),
      multiple: lookup.multiple,
    });

    for (const sample of asArray(lookup.sampleValueShapes)) {
      report.summary.sampleReferencesChecked += 1;
      const shape = sample.valueShape;
      if (lookup.multiple && shape !== "jsonStringArray") {
        generatorOrWarning(report, "LOOKUP_SAMPLE_MULTIPLE_SHAPE_MISMATCH", "Multi lookup sample value should be a JSON-stringified array.", {
          sourceFieldName: lookup.sourceField,
          recordId: sample.recordId,
          valueShape: shape,
        });
      }
      if (!lookup.multiple && shape === "jsonStringArray") {
        generatorOrWarning(report, "LOOKUP_SAMPLE_SINGLE_SHAPE_MISMATCH", "Single lookup sample value looks like a multi-value JSON array.", {
          sourceFieldName: lookup.sourceField,
          recordId: sample.recordId,
          valueShape: shape,
        });
      }
      report.resolvedReferences.sampleReferences.push({
        sourceFieldName: lookup.sourceField,
        targetListId,
        recordId: sample.recordId,
        valueShape: shape,
        recordExistenceVerified: false,
        note: "Record-level verification is limited unless target sample records are available as explicit records.",
      });
    }
  }
}

function validateViews(inspection, report) {
  const localFields = localFieldMap(inspection);
  for (const view of asArray(inspection.viewInventory)) {
    if (String(view.type) === "1") continue;
    report.summary.viewsChecked += 1;
    const viewType = view.type === undefined || view.type === null ? "" : String(view.type);
    if (!["", "0", "104"].includes(viewType)) {
      issue(report, "warning", "UNKNOWN_VIEW_TYPE", "View type is not one of the learned view types.", { viewTitle: view.title, type: view.type });
    }
    for (const column of asArray(view.displayedColumns)) {
      if (column.fieldName && !localFields.has(String(column.fieldName)) && !KNOWN_SYSTEM_FIELDS.has(String(column.fieldName))) {
        generatorOrWarning(report, "VIEW_COLUMN_FIELD_NOT_FOUND", "View column does not resolve to a local field.", { viewTitle: view.title, fieldName: column.fieldName });
      } else if (column.fieldName) {
        report.resolvedReferences.viewReferences.push({ viewTitle: view.title, kind: "column", fieldName: column.fieldName, resolved: true });
      }
    }
    for (const filter of asArray(view.filters)) {
      const fieldName = filter.left || filter.field || filter.FieldName;
      if (fieldName && !localFields.has(String(fieldName)) && !KNOWN_SYSTEM_FIELDS.has(String(fieldName))) generatorOrWarning(report, "VIEW_FILTER_FIELD_NOT_FOUND", "View filter field does not resolve to a local field.", { viewTitle: view.title, fieldName });
    }
    for (const sort of asArray(view.sorts)) {
      const fieldName = sort.SortName || sort.field || sort.FieldName;
      if (fieldName && !localFields.has(String(fieldName)) && !KNOWN_SYSTEM_FIELDS.has(String(fieldName))) generatorOrWarning(report, "VIEW_SORT_FIELD_NOT_FOUND", "View sort field does not resolve to a local field.", { viewTitle: view.title, fieldName });
    }
  }
}

function validateForms(inspection, index, report) {
  const localFields = localFieldMap(inspection);
  for (const form of asArray(inspection.customFormInventory)) {
    report.summary.customFormsChecked += 1;
    for (const bound of asArray(form.boundFields)) {
      if (!localFields.has(String(bound.fieldName))) {
        generatorOrWarning(report, "FORM_BOUND_FIELD_NOT_FOUND", "Custom form bound field is not present in the local list.", { formTitle: form.title, fieldName: bound.fieldName });
      } else {
        report.resolvedReferences.formReferences.push({ formTitle: form.title, kind: "boundField", fieldName: bound.fieldName, resolved: true });
      }
    }
    for (const lookupControl of asArray(form.lookupControls)) {
      const boundField = lookupControl.binding ? localFields.get(String(lookupControl.binding)) : null;
      const rules = boundField ? parsedRules(boundField) : {};
      const targetListId = rules.listid || (lookupControl.attrs && lookupControl.attrs.listid);
      if (targetListId && !index.listsById.has(String(targetListId))) {
        generatorOrWarning(report, "FORM_LOOKUP_TARGET_NOT_FOUND", "Lookup control target list is not present in app metadata.", { formTitle: form.title, binding: lookupControl.binding, targetListId });
      }
    }
    for (const listControl of asArray(form.listControls)) {
      if (listControl.binding && !localFields.has(String(listControl.binding))) {
        generatorOrWarning(report, "FORM_LIST_CONTROL_FIELD_NOT_FOUND", "Data-list/nested-list control binding does not resolve to a local field.", { formTitle: form.title, binding: listControl.binding });
      }
    }
    if (asArray(form.customCodeControls).length) {
      addDependency(report, { type: "customCodeReview", formTitle: form.title, controlCount: form.customCodeControls.length, requiredForGeneratorMode: true });
      issue(report, "warning", "CUSTOM_CODE_CONTROLS_FOUND", "Custom code controls require manual review before generated package use.", { formTitle: form.title, controls: form.customCodeControls });
    }
  }
}

function extractFieldRefs(value) {
  const refs = new Set();
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!isObject(node)) return;
    if ((node.exprType === "list_field" || node.type === "list_field") && (node.prop || node.id)) refs.add(String(node.prop || node.id));
    if (typeof node.prop === "string" && /^(Title|Text\d+|Datetime\d+|Bit\d+)/.test(node.prop)) refs.add(node.prop);
    Object.values(node).forEach(visit);
  };
  visit(value);
  return [...refs];
}

function validateWorkflowFieldRefs(refs, localFields, report, context) {
  for (const ref of refs) {
    if (!localFields.has(String(ref))) {
      issue(report, "warning", "WORKFLOW_FIELD_REF_NOT_FOUND", "Workflow expression references a field not present in the local list.", { ...context, fieldRef: ref });
    }
  }
}

function validateWorkflows(inspection, index, report) {
  const localFields = localFieldMap(inspection);
  for (const workflow of asArray(inspection.workflowInventory)) {
    for (const node of asArray(workflow.contentListNodes)) {
      report.summary.workflowTargetsChecked += 1;
      const targetListId = node.listid || inspection.listSummary.ListID;
      const target = targetListId ? index.listsById.get(String(targetListId)) : null;
      if (!target) {
        const dep = { type: "workflowContentListTarget", workflowKey: workflow.key, nodeName: node.name, targetListId, requiredForGeneratorMode: true };
        addDependency(report, dep);
        generatorOrWarning(report, "CONTENTLIST_TARGET_LIST_NOT_FOUND", "ContentList target list is not present in app metadata.", dep);
      } else {
        report.resolvedReferences.workflowTargets.push({ workflowKey: workflow.key, nodeName: node.name, nodeType: "ContentList", targetListId, targetListTitle: listTitleOf(target), resolved: true });
        const targetFieldMap = index.fieldsByListId.get(String(targetListId)) || new Map();
        for (const item of asArray(node.listdatas)) {
          const column = item.Columns || item.column || item.field;
          if (column && !targetFieldMap.has(String(column))) {
            generatorOrWarning(report, "CONTENTLIST_TARGET_FIELD_NOT_FOUND", "ContentList mapping target field was not found in target list metadata.", { workflowKey: workflow.key, nodeName: node.name, targetListId, targetField: column });
          }
        }
      }
      validateWorkflowFieldRefs(extractFieldRefs({ listdatas: node.listdatas, wheres: node.wheres, expressionRefs: node.expressionRefs }), localFields, report, { workflowKey: workflow.key, nodeName: node.name });
    }
    for (const node of asArray(workflow.queryDataNodes)) {
      report.summary.workflowTargetsChecked += 1;
      const targetListId = node.listid;
      const target = targetListId ? index.listsById.get(String(targetListId)) : null;
      if (!target) {
        const dep = { type: "workflowQueryDataTarget", workflowKey: workflow.key, nodeName: node.name, targetListId, requiredForGeneratorMode: true };
        addDependency(report, dep);
        generatorOrWarning(report, "QUERYDATA_TARGET_LIST_NOT_FOUND", "QueryData target list is not present in app metadata.", dep);
      } else {
        report.resolvedReferences.workflowTargets.push({ workflowKey: workflow.key, nodeName: node.name, nodeType: "QueryData", targetListId, targetListTitle: listTitleOf(target), resolved: true });
      }
    }
    for (const node of asArray(workflow.aiNodes)) {
      addDependency(report, { type: "aiWorkflowNode", workflowKey: workflow.key, nodeName: node.name, requiredForGeneratorMode: true });
      issue(report, "warning", "AI_WORKFLOW_NODE_FOUND", "AI workflow node requires runtime/agent review.", { workflowKey: workflow.key, nodeName: node.name });
    }
    for (const node of asArray(workflow.httpActionNodes)) {
      addDependency(report, { type: "httpOrApiWorkflowNode", workflowKey: workflow.key, nodeName: node.name, requiredForGeneratorMode: true });
      issue(report, "warning", "HTTP_OR_API_WORKFLOW_NODE_FOUND", "HTTP/API workflow node requires endpoint/credential review.", { workflowKey: workflow.key, nodeName: node.name });
    }
  }
}

function validateSampleData(inspection, report) {
  for (const lookup of asArray(inspection.lookupRelationships)) {
    for (const sample of asArray(lookup.sampleValueShapes)) {
      report.summary.sampleReferencesChecked += 1;
      if (lookup.multiple && sample.valueShape !== "jsonStringArray") {
        generatorOrWarning(report, "SAMPLE_MULTI_LOOKUP_SHAPE_MISMATCH", "Sample lookup value shape does not match multiple=true.", { sourceField: lookup.sourceField, recordId: sample.recordId, valueShape: sample.valueShape });
      }
      if (!lookup.multiple && sample.valueShape === "jsonStringArray") {
        generatorOrWarning(report, "SAMPLE_SINGLE_LOOKUP_SHAPE_MISMATCH", "Sample lookup value shape looks multi-valued but lookup multiple=false.", { sourceField: lookup.sourceField, recordId: sample.recordId, valueShape: sample.valueShape });
      }
    }
  }
}

function finish(report) {
  delete report._dependencyKeys;
  if (report.errors.length) report.status = "fail";
  else if (report.warnings.length || report.dependencies.length) report.status = "pass_with_warnings";
  else report.status = "pass";
  return report;
}

function validate(inputPath, metadataPath, mode) {
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  const inspection = runInspector(inputPath);
  const index = buildMetadataIndex(metadata);
  const report = {
    status: "pass",
    mode,
    input: path.resolve(inputPath),
    metadata: path.resolve(metadataPath),
    metadataKind: index.app.sourceKind,
    errors: [],
    warnings: [],
    dependencies: [],
    resolvedReferences: {
      lookupTargets: [],
      workflowTargets: [],
      formReferences: [],
      viewReferences: [],
      sampleReferences: [],
    },
    summary: {
      lookupRelationshipsChecked: 0,
      workflowTargetsChecked: 0,
      customFormsChecked: 0,
      viewsChecked: 0,
      sampleReferencesChecked: 0,
    },
    _dependencyKeys: new Set(),
  };

  validateTargetContext(inspection, index, report);
  validateLookupRelationships(inspection, index, report);
  validateForms(inspection, index, report);
  validateViews(inspection, report);
  validateWorkflows(inspection, index, report);
  validateSampleData(inspection, report);
  return finish(report);
}

function main() {
  const args = parseArgs(process.argv);
  const report = validate(args.input, args.metadata, args.mode);
  console.log(JSON.stringify(report, null, 2));
  if (report.status === "fail") process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({
    status: "fail",
    errors: [{ code: "VALIDATOR_RUNTIME_ERROR", message: error.message }],
  }, null, 2));
  process.exit(1);
}
