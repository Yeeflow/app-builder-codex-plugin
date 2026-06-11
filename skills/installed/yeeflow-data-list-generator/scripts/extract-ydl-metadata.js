#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node extract-ydl-metadata.js <export.ydl> [more.ydl ...] --out <metadata.json> --md <summary.md>",
    "",
    "Examples:",
    "  node extract-ydl-metadata.js \"./Portfolio Management.ydl\" --out ./portfolio-metadata.json --md ./portfolio-metadata.md",
    "  node extract-ydl-metadata.js \"./Portfolio Management.ydl\" \"./Partner Management.ydl\" \"./Communication Records.ydl\" --out ./nhic-ydl-metadata.json --md ./nhic-ydl-metadata.md",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { inputs: [], out: null, md: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") args.out = argv[++i];
    else if (arg === "--md") args.md = argv[++i];
    else if (arg.startsWith("--")) usage();
    else args.inputs.push(arg);
  }
  if (!args.inputs.length || !args.out || !args.md) usage();
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

function preview(value, max = 900) {
  if (value === null || value === undefined) return null;
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function runInspector(inputPath) {
  const inspector = path.join(__dirname, "inspect-ydl-package.js");
  if (!fs.existsSync(inspector)) throw new Error(`Required inspector not found: ${inspector}`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ydl-metadata-"));
  const jsonPath = path.join(tmpDir, "inspection.json");
  const mdPath = path.join(tmpDir, "inspection.md");
  const result = spawnSync(process.execPath, [inspector, inputPath, "--json", jsonPath, "--md", mdPath], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    throw new Error(`inspect-ydl-package.js failed for ${inputPath}: ${result.stderr || result.stdout}`);
  }

  const report = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return report;
}

function choicesFromRules(rules) {
  if (!isObject(rules)) return [];
  const raw = rules.choices || rules.options || rules.items || rules.dataSource || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (isObject(item)) return item.label || item.text || item.value || item.name || preview(item, 160);
    return item;
  });
}

function lookupConfigFromRules(rules) {
  if (!isObject(rules)) return null;
  if (!rules.listid && !rules.listsetid && !rules.listfield && !rules.appid) return null;
  return {
    appId: rules.appid ?? rules.AppID ?? null,
    listSetId: rules.listsetid ?? rules.ListSetID ?? null,
    listId: rules.listid ?? rules.ListID ?? null,
    displayField: rules.listfield ?? rules.displayfield ?? rules.DisplayField ?? null,
    multiple: rules.multiple === true || rules.multiple === "true",
    maxSelection: rules["max-selection"] ?? rules.maxSelection ?? null,
    displayStyle: rules.displayStyle ?? null,
    searchFields: rules.search_fields || rules.searchFields || [],
    filters: rules.filters || rules.filter || rules.query || null,
  };
}

function fieldToMetadata(field, listSummary) {
  const rules = isObject(field.Rules) ? field.Rules : {};
  return {
    listTitle: listSummary.title || null,
    listId: listSummary.ListID || null,
    fieldId: field.FieldID ?? null,
    fieldName: field.FieldName ?? null,
    internalName: field.InternalName ?? null,
    displayName: field.DisplayName ?? null,
    fieldType: field.FieldType ?? null,
    controlType: field.Type ?? null,
    normalizedType: field.normalizedType ?? "unknown",
    defaultValue: field.DefaultValue ?? null,
    isSystem: field.IsSystem ?? null,
    isSort: field.IsSort ?? null,
    isIndex: field.IsIndex ?? null,
    isFilter: field.IsFilter ?? null,
    isRequired: rules.required === true || rules.required === "true",
    choices: choicesFromRules(rules),
    lookupConfig: lookupConfigFromRules(rules),
    rawRulesPreview: preview(rules, 1200),
  };
}

function viewToMetadata(view, listSummary) {
  return {
    listTitle: listSummary.title || null,
    listId: listSummary.ListID || null,
    title: view.title || null,
    type: view.type ?? null,
    isDefault: view.isDefault ?? false,
    columns: asArray(view.displayedColumns).map((column) => ({
      order: column.order ?? null,
      fieldName: column.fieldName ?? null,
      title: column.title ?? null,
      width: column.width ?? null,
      hidden: false,
    })),
    hiddenColumns: asArray(view.hiddenColumns).map((column) => ({
      order: column.order ?? null,
      fieldName: column.fieldName ?? null,
      title: column.title ?? null,
      width: column.width ?? null,
      hidden: true,
    })),
    filters: view.filters || [],
    sorts: view.sorts || [],
    rowColor: view.rowColor || [],
    notes: view.viewTypeNotes || null,
  };
}

function formStructureSummary(form) {
  const parts = [];
  if (form.containers.length) parts.push(`${form.containers.length} container(s)`);
  if (form.grids.length) parts.push(`${form.grids.length} grid(s)`);
  if (form.lookupControls.length) parts.push(`${form.lookupControls.length} lookup control(s)`);
  if (form.listControls.length) parts.push(`${form.listControls.length} list control(s)`);
  if (form.customCodeControls.length) parts.push(`${form.customCodeControls.length} custom code control(s)`);
  if (!parts.length) parts.push("flat control layout");
  return parts.join(", ");
}

function customFormToMetadata(form, listSummary) {
  const boundFields = asArray(form.boundFields).map((field) => ({
    fieldName: field.fieldName || null,
    displayName: field.displayName || null,
    internalName: field.internalName || null,
    normalizedType: field.normalizedType || null,
  }));
  const unboundControls = asArray(form.unboundDisplayTextControls).map((control) => ({
    id: control.id || null,
    type: control.type || null,
    label: control.label || null,
    pointer: control.pointer || null,
  }));
  return {
    listTitle: listSummary.title || null,
    listId: listSummary.ListID || null,
    title: form.title || null,
    type: form.type ?? null,
    controlCount: form.controlCount || 0,
    boundFields,
    unboundControls,
    containers: asArray(form.containers).length,
    grids: asArray(form.grids).length,
    lookupControls: asArray(form.lookupControls).length,
    listControls: asArray(form.listControls).length,
    customCodeControls: asArray(form.customCodeControls).length,
    formStructureSummary: formStructureSummary(form),
  };
}

function workflowToMetadata(workflow, listSummary, warningIndex) {
  const workflowWarnings = [];
  if (asArray(workflow.aiNodes).length) {
    workflowWarnings.push({ code: "AI_WORKFLOW_NODES_FOUND", message: "AI nodes may require external agent/runtime dependencies." });
  }
  if (asArray(workflow.httpActionNodes).length) {
    workflowWarnings.push({ code: "HTTP_OR_API_NODES_FOUND", message: "HTTP/API nodes may require endpoint and credential review." });
  }
  for (const listId of asArray(workflow.targetListsReferenced)) {
    workflowWarnings.push({ code: "WORKFLOW_REFERENCES_LIST", message: `Workflow references list ${listId}.`, listId });
  }

  return {
    listTitle: listSummary.title || null,
    listId: listSummary.ListID || null,
    name: workflow.name || null,
    key: workflow.key || null,
    workflowType: workflow.workflowType || null,
    variableCount: workflow.variablesCount || 0,
    nodeTypes: Object.entries(workflow.nodeTypes || {}).map(([type, count]) => ({ type, count })),
    contentListNodes: asArray(workflow.contentListNodes).map((node) => ({
      name: node.name || null,
      operation: node.operation || null,
      listtype: node.listtype || null,
      appid: node.appid || null,
      listsetid: node.listsetid || null,
      listid: node.listid || null,
      listdatas: node.listdatas || [],
      wheres: node.wheres || [],
      expressionRefs: node.expressionRefs || [],
    })),
    queryDataNodes: asArray(workflow.queryDataNodes).map((node) => ({
      name: node.name || null,
      appid: node.appid || null,
      listsetid: node.listsetid || null,
      listid: node.listid || null,
      filters: node.filters || [],
      sorts: node.sorts || [],
      result: node.result || [],
    })),
    aiNodes: asArray(workflow.aiNodes),
    httpOrApiNodes: asArray(workflow.httpActionNodes),
    referencedFields: asArray(workflow.fieldsReferenced),
    referencedLists: asArray(workflow.targetListsReferenced),
    warnings: workflowWarnings,
  };
}

function sampleDataToMetadata(report) {
  const summary = report.listSummary;
  const sample = report.sampleDataInventory || {};
  const fieldsWithValues = asArray(sample.valueShapeByField).map((field) => ({
    fieldName: field.fieldName,
    displayName: field.displayName || null,
    internalName: field.internalName || null,
    normalizedType: field.normalizedType || null,
    nonEmptyExamples: asArray(field.examples).filter((example) => !["emptyString", "null", "missing"].includes(example.shape)).slice(0, 3),
  })).filter((field) => field.nonEmptyExamples.length);

  return {
    listTitle: summary.title || null,
    listId: summary.ListID || null,
    recordCount: sample.sampleRecordCount || 0,
    fieldsWithValues,
    valueShapesByField: asArray(sample.valueShapeByField),
    lookupValueExamples: asArray(sample.lookupValues).slice(0, 50),
    multiChoiceValueExamples: asArray(sample.checkboxOrMultiSelectJsonStringValues).slice(0, 50),
    dateValueExamples: [...asArray(sample.dateValues), ...asArray(sample.datetimeValues)].slice(0, 50),
    emptyValuePatterns: sample.emptyNullPatterns || {},
  };
}

function packageSummaryFromReport(report) {
  const s = report.listSummary || {};
  return {
    title: s.title || null,
    description: s.description || report.topLevel.Description || null,
    appId: s.AppID || null,
    listSetId: s.ListSetID || null,
    listId: s.ListID || null,
    mainListType: s.MainListType || null,
    fieldCount: s.fieldCount || 0,
    layoutCount: s.layoutCount || 0,
    viewCount: s.viewCount || 0,
    customFormCount: s.customFormCount || 0,
    workflowCount: s.workflowCount || 0,
    sampleRecordCount: s.sampleRecordCount || 0,
    lookupCount: asArray(report.lookupRelationships).length,
  };
}

function lookupToMetadata(lookup, listSummary, suppliedListIds) {
  return {
    sourceListTitle: listSummary.title || null,
    sourceListId: listSummary.ListID || null,
    sourceFieldDisplayName: lookup.sourceDisplayName || null,
    sourceFieldInternalName: lookup.sourceInternalName || null,
    sourceFieldName: lookup.sourceField || null,
    targetAppId: lookup.targetAppID || null,
    targetListSetId: lookup.targetListSetID || null,
    targetListId: lookup.targetListID || null,
    targetDisplayField: lookup.targetDisplayField || null,
    multiple: lookup.multiple === true,
    searchFields: lookup.searchFields || [],
    filters: lookup.filters || null,
    sampleValues: asArray(lookup.sampleValueShapes).map((sample) => ({
      recordId: sample.recordId,
      valueShape: sample.valueShape,
      valuePreview: sample.valuePreview,
    })),
    targetResolvedWithinInputFiles: lookup.targetListID ? suppliedListIds.has(String(lookup.targetListID)) : false,
  };
}

function listToMetadata(report, fields, views, customForms, workflows, sampleData) {
  const s = report.listSummary || {};
  return {
    title: s.title || null,
    appId: s.AppID || null,
    listSetId: s.ListSetID || null,
    listId: s.ListID || null,
    mainListType: s.MainListType || null,
    fields,
    views,
    customForms,
    workflows,
    sampleDataSummary: {
      recordCount: sampleData.recordCount,
      fieldValueShapeCount: sampleData.valueShapesByField.length,
      lookupExampleCount: sampleData.lookupValueExamples.length,
      multiChoiceExampleCount: sampleData.multiChoiceValueExamples.length,
      dateExampleCount: sampleData.dateValueExamples.length,
    },
  };
}

function buildRelationshipGraph(lists, lookupRelationships, workflows) {
  const nodes = [];
  const nodeKeys = new Set();
  function addNode(node) {
    if (!node.id || nodeKeys.has(node.id)) return;
    nodeKeys.add(node.id);
    nodes.push(node);
  }

  for (const list of lists) {
    addNode({ id: `list:${list.listId}`, type: "list", label: list.title, listId: list.listId });
    for (const field of asArray(list.fields)) {
      addNode({
        id: `field:${list.listId}:${field.fieldName}`,
        type: "field",
        label: field.displayName || field.fieldName,
        listId: list.listId,
        fieldName: field.fieldName,
        normalizedType: field.normalizedType,
      });
    }
  }

  const edges = [];
  for (const lookup of lookupRelationships) {
    edges.push({
      type: "lookup",
      from: `field:${lookup.sourceListId}:${lookup.sourceFieldName}`,
      to: `list:${lookup.targetListId}`,
      label: `${lookup.sourceFieldDisplayName || lookup.sourceFieldName} -> ${lookup.targetDisplayField || "target display field"}`,
      sourceListId: lookup.sourceListId,
      targetListId: lookup.targetListId,
      resolved: lookup.targetResolvedWithinInputFiles,
    });
  }

  for (const workflow of workflows) {
    for (const listId of workflow.referencedLists || []) {
      edges.push({
        type: "workflowTarget",
        from: `list:${workflow.listId}`,
        to: `list:${listId}`,
        label: `${workflow.name || workflow.key} references ${listId}`,
        workflowKey: workflow.key,
        sourceListId: workflow.listId,
        targetListId: listId,
        resolved: lists.some((list) => String(list.listId) === String(listId)),
      });
    }
  }

  return { nodes, edges };
}

function buildMetadata(inputPaths) {
  const reports = inputPaths.map((input) => runInspector(input));
  const suppliedListIds = new Set(reports.map((report) => String(report.listSummary.ListID)).filter(Boolean));

  const packageSummaries = [];
  const lists = [];
  const fields = [];
  const lookupRelationships = [];
  const views = [];
  const customForms = [];
  const workflows = [];
  const sampleData = [];
  const warnings = [];
  const largeIds = new Set();

  for (const report of reports) {
    const summary = report.listSummary;
    const fieldItems = asArray(report.fieldInventory).map((field) => fieldToMetadata(field, summary));
    const rawViewItems = asArray(report.viewInventory).map((view) => viewToMetadata(view, summary));
    const formLayoutPlaceholders = rawViewItems.filter((view) => String(view.type) === "1");
    const viewItems = rawViewItems.filter((view) => String(view.type) !== "1");
    const formItems = asArray(report.customFormInventory).map((form) => customFormToMetadata(form, summary));
    const workflowItems = asArray(report.workflowInventory).map((workflow) => workflowToMetadata(workflow, summary));
    const sampleItem = sampleDataToMetadata(report);
    const lookupItems = asArray(report.lookupRelationships).map((lookup) => lookupToMetadata(lookup, summary, suppliedListIds));

    const packageSummary = packageSummaryFromReport(report);
    packageSummary.viewCount = viewItems.length;
    packageSummary.customFormCount = formItems.length;
    packageSummaries.push(packageSummary);
    fields.push(...fieldItems);
    views.push(...viewItems);
    customForms.push(...formItems);
    workflows.push(...workflowItems);
    sampleData.push(sampleItem);
    lookupRelationships.push(...lookupItems);
    lists.push(listToMetadata(report, fieldItems, viewItems, formItems, workflowItems, sampleItem));
    for (const id of asArray(report.largeNumericIdsPreserved)) largeIds.add(id);
    for (const warning of asArray(report.warnings)) {
      warnings.push({
        sourceFile: report.input,
        listTitle: summary.title,
        code: warning.code,
        message: warning.message,
        details: Object.fromEntries(Object.entries(warning).filter(([key]) => !["code", "message"].includes(key))),
      });
    }
    for (const placeholder of formLayoutPlaceholders) {
      warnings.push({
        sourceFile: report.input,
        listTitle: summary.title,
        code: "FORM_LAYOUT_WITHOUT_PARSED_FORM_RESOURCE",
        message: `Layout ${placeholder.title || "(untitled)"} has Type 1 but no parsed form resource; excluded from views and customForms.`,
        details: {
          title: placeholder.title,
          type: placeholder.type,
          listId: summary.ListID,
        },
      });
    }
  }

  for (const lookup of lookupRelationships) {
    if (!lookup.targetResolvedWithinInputFiles) {
      warnings.push({
        sourceFile: null,
        listTitle: lookup.sourceListTitle,
        code: "LOOKUP_TARGET_NOT_INCLUDED_IN_SUPPLIED_FILES",
        message: `Lookup ${lookup.sourceFieldDisplayName || lookup.sourceFieldName} targets list ${lookup.targetListId}, which is not one of the supplied .ydl files.`,
        details: {
          sourceListId: lookup.sourceListId,
          sourceFieldName: lookup.sourceFieldName,
          targetListId: lookup.targetListId,
        },
      });
    }
  }

  const relationshipGraph = buildRelationshipGraph(lists, lookupRelationships, workflows);

  return {
    generatedAt: new Date().toISOString(),
    inputs: inputPaths.map((input) => path.resolve(input)),
    packageSummaries,
    lists,
    fields,
    lookupRelationships,
    views,
    customForms,
    workflows,
    sampleData,
    relationshipGraph,
    warnings,
    largeNumericIdsPreserved: [...largeIds].sort(),
    summary: {
      packages: packageSummaries.length,
      lists: lists.length,
      fields: fields.length,
      lookups: lookupRelationships.length,
      views: views.length,
      customForms: customForms.length,
      workflows: workflows.length,
      sampleRecordCount: sampleData.reduce((sum, item) => sum + item.recordCount, 0),
      warnings: warnings.length,
      graphNodes: relationshipGraph.nodes.length,
      graphEdges: relationshipGraph.edges.length,
    },
  };
}

function table(headers, rows) {
  const clean = (value) => safeString(value).replace(/\n/g, " ").replace(/\|/g, "\\|");
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(clean).join(" | ")} |`),
  ].join("\n");
}

function renderMarkdown(metadata) {
  const packageRows = metadata.packageSummaries.map((pkg) => [
    pkg.title,
    pkg.appId,
    pkg.listId,
    pkg.fieldCount,
    pkg.viewCount,
    pkg.customFormCount,
    pkg.workflowCount,
    pkg.sampleRecordCount,
    pkg.lookupCount,
  ]);
  const listRows = metadata.lists.map((list) => [
    list.title,
    list.appId,
    list.listSetId || "",
    list.listId,
    list.fields.length,
    list.views.length,
    list.customForms.length,
    list.workflows.length,
    list.sampleDataSummary.recordCount,
  ]);
  const fieldTypeCounts = new Map();
  for (const field of metadata.fields) fieldTypeCounts.set(field.normalizedType, (fieldTypeCounts.get(field.normalizedType) || 0) + 1);
  const fieldTypeRows = [...fieldTypeCounts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([type, count]) => [type, count]);
  const lookupRows = metadata.lookupRelationships.map((lookup) => [
    lookup.sourceListTitle,
    lookup.sourceFieldDisplayName || lookup.sourceFieldName,
    lookup.targetListId,
    lookup.targetDisplayField,
    lookup.multiple,
    lookup.targetResolvedWithinInputFiles,
  ]);
  const viewRows = metadata.views.map((view) => [
    view.listTitle,
    view.title,
    view.type || "",
    view.isDefault,
    view.columns.length,
    JSON.stringify(view.filters || []).slice(0, 120),
  ]);
  const formRows = metadata.customForms.map((form) => [
    form.listTitle,
    form.title,
    form.controlCount,
    form.boundFields.length,
    form.containers,
    form.grids,
    form.lookupControls,
    form.listControls,
    form.customCodeControls,
    form.formStructureSummary,
  ]);
  const workflowRows = metadata.workflows.map((workflow) => [
    workflow.listTitle,
    workflow.name,
    workflow.key,
    workflow.workflowType,
    workflow.variableCount,
    workflow.nodeTypes.map((node) => `${node.type}:${node.count}`).join(", "),
    workflow.referencedLists.join(", "),
    workflow.warnings.map((warning) => warning.code).join(", "),
  ]);
  const sampleRows = metadata.sampleData.map((sample) => [
    sample.listTitle,
    sample.recordCount,
    sample.fieldsWithValues.length,
    sample.lookupValueExamples.length,
    sample.multiChoiceValueExamples.length,
    sample.dateValueExamples.length,
  ]);
  const warningCounts = new Map();
  for (const warning of metadata.warnings) warningCounts.set(warning.code, (warningCounts.get(warning.code) || 0) + 1);
  const warningRows = [...warningCounts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([code, count]) => [code, count]);

  return [
    "# Yeeflow .ydl Metadata Extraction",
    "",
    "## Package Summary",
    "",
    table(["Title", "AppID", "ListID", "Fields", "Views", "Forms", "Workflows", "Samples", "Lookups"], packageRows),
    "",
    "## List Summary",
    "",
    table(["List", "AppID", "ListSetID", "ListID", "Fields", "Views", "Forms", "Workflows", "Samples"], listRows),
    "",
    "## Field Type Summary",
    "",
    table(["Normalized type", "Count"], fieldTypeRows),
    "",
    "## Lookup Relationship Map",
    "",
    lookupRows.length ? table(["Source list", "Source field", "Target ListID", "Target display", "Multiple", "Resolved in inputs"], lookupRows) : "_No lookup relationships found._",
    "",
    "## Views Summary",
    "",
    viewRows.length ? table(["List", "View", "Type", "Default", "Columns", "Filters"], viewRows) : "_No views found._",
    "",
    "## Custom Forms Summary",
    "",
    formRows.length ? table(["List", "Form", "Controls", "Bound", "Containers", "Grids", "Lookups", "Lists", "Code", "Structure"], formRows) : "_No custom forms found._",
    "",
    "## Workflow Summary",
    "",
    workflowRows.length ? table(["List", "Workflow", "Key", "Type", "Variables", "Node types", "Referenced lists", "Warnings"], workflowRows) : "_No workflows found._",
    "",
    "## Sample Data Summary",
    "",
    table(["List", "Records", "Fields with values", "Lookup examples", "Multi-choice examples", "Date examples"], sampleRows),
    "",
    "## Warnings",
    "",
    warningRows.length ? table(["Code", "Count"], warningRows) : "_No warnings._",
    "",
    "## Suggested Next Use",
    "",
    "- Use `lists[]` and flattened `fields[]` as the source for generated data-list mapping and validation.",
    "- Use `lookupRelationships[]` plus `relationshipGraph` to validate lookup dependencies before generating final `.ydl` packages.",
    "- Use `sampleData[]` only as example value-shape evidence; do not treat sample IDs or user/file references as production-safe.",
    "- Use warnings to decide whether generation must stop for missing lookup targets, external workflow dependencies, AI nodes, or unresolved resource metadata.",
    "",
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  const metadata = buildMetadata(args.inputs);
  fs.writeFileSync(args.out, `${JSON.stringify(metadata, null, 2)}\n`);
  fs.writeFileSync(args.md, renderMarkdown(metadata));
  console.log(JSON.stringify({
    status: "pass",
    inputs: args.inputs.map((input) => path.resolve(input)),
    out: path.resolve(args.out),
    md: path.resolve(args.md),
    summary: metadata.summary,
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({
    status: "fail",
    errors: [error.message],
  }, null, 2));
  process.exit(1);
}
