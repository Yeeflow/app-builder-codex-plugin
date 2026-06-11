#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { buildReport, parseJsonPreservingLargeInts } = require("./inspect-yap-package.js");

const GZIP_PREFIX = "[______gizp______]";

function usage(exitCode = 1) {
  const out = [
    "Usage:",
    "  node extract-yap-metadata.js <export.yap> --out <metadata.json> --md <metadata.md>",
    "",
    "Example:",
    "  node extract-yap-metadata.js \"./Procurement Management.yap\" --out ./procurement-metadata.json --md ./procurement-metadata.md",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(out);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, out: null, md: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") args.out = argv[++i];
    else if (arg === "--md") args.md = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input || !args.out || !args.md) usage();
  return args;
}

function decodeForFormKeys(inputPath) {
  const largeNumbers = new Set();
  const wrapper = parseJsonPreservingLargeInts(fs.readFileSync(inputPath, "utf8"), largeNumbers);
  if (!wrapper.Resource || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Resource does not start with ${GZIP_PREFIX}`);
  }
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const resource = parseJsonPreservingLargeInts(resourceText, largeNumbers);
  return { wrapper, resource };
}

function normalizedType(field) {
  const fieldType = String(field.fieldType || "").toLowerCase();
  const controlType = String(field.controlType || "").toLowerCase();
  const joined = `${fieldType} ${controlType}`;
  if (joined.includes("lookup")) return "lookup";
  if (joined.includes("file")) return "file";
  if (joined.includes("identity") || joined.includes("user") || joined.includes("person")) return "user";
  if (joined.includes("currency")) return "currency";
  if (joined.includes("decimal") || joined.includes("number") || joined.includes("percent") || joined.includes("bigint")) return "number";
  if (joined.includes("date") || joined.includes("time")) return "date";
  if (joined.includes("hyperlink")) return "hyperlink";
  if (joined.includes("calculated")) return "calculated";
  if (joined.includes("list")) return "list";
  if (joined.includes("textarea") || joined.includes("richtext") || joined.includes("longtext")) return "longText";
  if (joined.includes("radio") || joined.includes("select") || joined.includes("checkbox") || joined.includes("choice")) return "choice";
  if (joined.includes("text") || joined.includes("input")) return "text";
  return "unknown";
}

function sourceInfo(source) {
  if (!source) return baseSource("unknown", "");
  const preview = source.raw !== undefined ? JSON.stringify(source.raw).slice(0, 240) : String(source.text || "").slice(0, 240);
  if (source.kind === "literal") return baseSource("literal", source.text || preview);
  if (source.kind === "expressionArray") {
    const raw = Array.isArray(source.raw) ? source.raw : [];
    const first = raw.find((item) => item && typeof item === "object") || {};
    if (first.exprType === "list_field") {
      return {
        ...baseSource("listTriggerField", preview),
        sourceVariable: first.id || null,
        sourceListVariable: null,
        sourceRowField: first.prop || null,
      };
    }
    if (first.type === "func" || first.func) {
      return {
        ...baseSource("function", preview),
        sourceVariable: first.func || null,
      };
    }
    if (first.exprType === "variable") {
      return {
        ...baseSource("workflowVariable", preview),
        sourceVariable: first.id || null,
      };
    }
    return baseSource("expressionArray", preview);
  }
  if (source.kind === "expressionButton") {
    if (source.type === "variable" && source.prop) {
      return {
        ...baseSource("listRowVariable", preview || source.text || ""),
        sourceVariable: null,
        sourceListVariable: source.id || null,
        sourceRowField: source.prop || null,
      };
    }
    if (source.type === "variable") {
      return {
        ...baseSource("workflowVariable", preview || source.text || ""),
        sourceVariable: source.id || null,
      };
    }
    if (source.type === "application" || source.type === "instance") {
      return {
        ...baseSource("function", preview || source.text || ""),
        sourceVariable: source.prop || source.text || null,
      };
    }
    return {
      ...baseSource("unknown", preview || source.text || ""),
      sourceVariable: source.id || null,
      sourceRowField: source.prop || null,
    };
  }
  return baseSource("unknown", preview);
}

function baseSource(kind, preview) {
  return {
    sourceKind: kind,
    sourceVariable: null,
    sourceListVariable: null,
    sourceRowField: null,
    rawExpressionPreview: preview || "",
  };
}

function safeRawTypeInfo(field) {
  const info = {
    fieldType: field.fieldType || null,
    controlType: field.controlType || null,
    kind: field.kind || null,
    isUnique: !!field.isUnique,
  };
  if (field.rules) {
    const safeRules = {};
    for (const key of ["choices", "show_color", "displayStyle", "multiple", "dateformat", "showtime", "required"]) {
      if (field.rules[key] !== undefined) safeRules[key] = field.rules[key];
    }
    if (Object.keys(safeRules).length > 0) info.rules = safeRules;
  }
  return info;
}

function buildMetadata(inputPath) {
  const report = buildReport(inputPath);
  const decoded = decodeForFormKeys(inputPath);

  const lists = report.resourceInventory.map((resource) => {
    const fieldInventory = report.listFieldInventory.find((item) => String(item.listId) === String(resource.listId));
    const fields = (fieldInventory ? fieldInventory.fields : []).map((field) => {
      const norm = normalizedType(field);
      return {
        listName: resource.resourceName,
        listId: resource.listId,
        displayName: field.displayLabel,
        internalName: field.internalFieldName,
        storageFieldName: field.storageFieldName,
        fieldId: field.fieldId || null,
        fieldType: field.fieldType || null,
        controlType: field.controlType || null,
        normalizedType: norm,
        isRequired: !!(field.rules && field.rules.required),
        isSystemField: !!field.isSystem,
        rawTypeInfo: safeRawTypeInfo(field),
      };
    });
    return {
      name: resource.resourceName,
      resourceType: resource.resourceType,
      appId: resource.appId,
      listSetId: resource.listSetId,
      listId: resource.listId,
      listType: resource.listType,
      fieldCount: resource.fieldCount,
      fields,
    };
  });

  const fields = lists.flatMap((list) => list.fields);
  const contentByForm = groupBy(report.relationships.contentLists, (item) => item.formKey);
  const lookupByForm = groupBy(report.relationships.lookups, (item) => item.formKey);
  const aiByForm = groupBy(report.relationships.aiAgentReferences, (item) => item.formKey);
  const docByForm = groupBy(report.relationships.documentLibraries, (item) => item.formKey);

  const forms = report.formInventory.map((form) => ({
    name: form.name,
    key: form.key,
    workflowType: form.workflowType,
    defkey: form.defkey,
    pageTitles: [...new Set([...(form.approvalPageTitles || [])])],
    requestPageTitle: inferRequestPageTitle(form),
    approvalPageTitles: form.approvalPageTitles || [],
    variableCount: form.variablesBasicCount,
    listrefCount: form.variablesListrefCount,
    approvalTaskCount: form.approvalTaskCount,
    contentListCount: form.contentListNodeCount,
    lookupCount: (lookupByForm.get(form.key) || []).length,
    aiReferenceCount: (aiByForm.get(form.key) || []).length,
    documentGenerationCount: form.generateDocumentCount,
    generateDocumentNodes: (docByForm.get(form.key) || []).filter((item) => item.relationshipType === "GenerateDocument").map((item) => item.nodeName),
    contentListTargets: [...new Set((contentByForm.get(form.key) || []).map((item) => item.listId).filter(Boolean))].map((listId) => {
      const list = lists.find((candidate) => String(candidate.listId) === String(listId));
      return { listId, listName: list ? list.name : null };
    }),
    lookupSources: [...new Set((lookupByForm.get(form.key) || []).map((item) => item.sourceListId).filter(Boolean))].map((listId) => {
      const list = lists.find((candidate) => String(candidate.listId) === String(listId));
      return { listId, listName: list ? list.name : null };
    }),
  }));

  const contentListMappings = report.relationships.contentLists.map((node) => ({
    formName: node.formName,
    formKey: node.formKey,
    nodeName: node.nodeName,
    operation: node.operation,
    targetAppId: node.appId,
    targetListSetId: node.listSetId,
    targetListId: node.listId,
    targetListName: node.targetListName || null,
    whereConditions: node.wheres.map((where) => ({
      left: where.left,
      op: where.op,
      ...sourceInfo(where.right),
    })),
    mappings: node.mappedFields.map((mapping) => ({
      targetInternalField: mapping.targetField ? mapping.targetField.internalFieldName : mapping.targetColumn,
      targetStorageFieldName: mapping.targetColumn,
      targetDisplayName: mapping.targetField ? mapping.targetField.displayLabel : null,
      targetNormalizedType: mapping.targetField ? normalizedType(mapping.targetField) : "unknown",
      ...sourceInfo(mapping.source),
    })),
  }));

  const lookupMappings = report.relationships.lookups.map((lookup) => {
    const sourceList = lists.find((list) => String(list.listId) === String(lookup.sourceListId));
    const displayField = sourceList && sourceList.fields.find((field) => {
      return field.storageFieldName === lookup.displayField || field.internalName === lookup.displayField || field.displayName === lookup.displayField;
    });
    return {
      formName: lookup.formName,
      formKey: lookup.formKey,
      pageTitle: lookup.pageTitle,
      controlLabel: lookup.controlLabel,
      variable: lookup.variable,
      sourceAppId: lookup.sourceAppId,
      sourceListSetId: lookup.sourceListSetId,
      sourceListId: lookup.sourceListId,
      sourceListName: lookup.sourceListName,
      displayField: lookup.displayField,
      displayFieldName: displayField ? displayField.displayName : null,
      filters: lookup.filters,
    };
  });

  const reports = report.relationships.reports.map((item) => ({
    name: item.name,
    reportType: item.reportType,
    reportId: item.id,
    defKey: item.defKey || null,
    sourceListIds: item.inputLists ? item.inputLists.map((input) => input.listId).filter(Boolean) : [],
    sourceListNames: item.inputLists ? item.inputLists.map((input) => input.listName).filter(Boolean) : [],
    outputFields: item.inputLists ? item.inputLists.flatMap((input) => Object.entries(input.fields || {}).map(([field, label]) => ({ listId: input.listId, field, label }))) : [],
    settingsSummary: item.settingsSummary || null,
  }));

  const aiReferences = report.relationships.aiAgentReferences.map((item) => ({
    formName: item.formName,
    formKey: item.formKey,
    pageTitle: item.pageTitle || null,
    nodeName: item.nodeName || null,
    actionName: item.actionName || null,
    agentIds: item.agentIds || [],
    notes: item.agentIds && item.agentIds.length ? "Agent ID may require import remapping or bundled module validation." : "AI node/action found without a direct AgentID.",
  }));

  const documentDependencies = report.relationships.documentLibraries.map((item) => ({
    formName: item.formName,
    formKey: item.formKey,
    nodeName: item.nodeName,
    dependencyType: item.relationshipType || "documentLibrary",
    templateFiles: extractTemplateHints(item.properties),
    targetLibraryId: item.listId || item.properties?.libraryid || item.properties?.libraryId || null,
    targetLibraryName: item.libraryName || null,
  }));

  return {
    generatedAt: new Date().toISOString(),
    input: path.resolve(inputPath),
    app: {
      title: report.packageSummary.title,
      appId: report.packageSummary.appId,
      mainListSetId: report.packageSummary.mainListSetId,
      mainListType: report.packageSummary.mainListType,
      replaceIdsCount: report.packageSummary.replaceIdsCount,
      reportIdsCount: report.packageSummary.reportIdsCount,
      formKeys: decoded.resource.FormKeys || [],
    },
    lists,
    fields,
    forms,
    contentListMappings,
    lookupMappings,
    reports,
    aiReferences,
    documentDependencies,
    warnings: report.warnings,
  };
}

function inferRequestPageTitle(form) {
  const known = {
    PR: "Purchase Request",
    PO: "Purchase Order Request",
    PA: "Payment Request",
    "PM-NSF": "Supplier Selection Form",
    SPY: "SharePoint Update To Yeeflow",
    PIJob: "SharePoint Update To Yeeflow",
    RSTJ: "Refresh SharePoint Token  Job",
  };
  return known[form.key] || null;
}

function groupBy(items, keyFn) {
  const out = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!out.has(key)) out.set(key, []);
    out.get(key).push(item);
  }
  return out;
}

function extractTemplateHints(properties) {
  if (!properties) return [];
  const text = JSON.stringify(properties);
  const hints = [];
  for (const key of ["templateid", "templateId", "template", "file", "output"]) {
    if (properties[key]) hints.push({ key, value: properties[key] });
  }
  const matches = [...text.matchAll(/template[^"]*"\s*:\s*"([^"]+)"/gi)].map((match) => match[1]);
  for (const match of matches) hints.push({ key: "template", value: match });
  return hints;
}

function markdown(metadata) {
  const lines = [];
  lines.push(`# Yeeflow .yap Metadata: ${metadata.app.title}`);
  lines.push("");
  lines.push("Read-only metadata extraction. No import, UI operation, or package generation was performed.");
  lines.push("");
  lines.push("## App Summary");
  lines.push("");
  lines.push(`- AppID: \`${metadata.app.appId}\``);
  lines.push(`- Main ListSetID: \`${metadata.app.mainListSetId}\``);
  lines.push(`- MainListType: \`${metadata.app.mainListType}\``);
  lines.push(`- ReplaceIds: ${metadata.app.replaceIdsCount}`);
  lines.push(`- ReportIds: ${metadata.app.reportIdsCount}`);
  lines.push(`- FormKeys: ${metadata.app.formKeys.length}`);
  lines.push("");
  lines.push("## Lists");
  lines.push("");
  lines.push("| List | Type | ListID | Fields |");
  lines.push("| --- | --- | --- | ---: |");
  for (const list of metadata.lists) {
    lines.push(`| ${esc(list.name)} | ${esc(list.resourceType)} | \`${list.listId || ""}\` | ${list.fieldCount} |`);
  }
  lines.push("");
  lines.push("## Forms");
  lines.push("");
  lines.push("| Form | Key | Type | Variables/Listrefs | Approvals | ContentLists | Lookups | AI refs | Docs |");
  lines.push("| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |");
  for (const form of metadata.forms) {
    lines.push(`| ${esc(form.name)} | \`${form.key || ""}\` | ${form.workflowType || ""} | ${form.variableCount}/${form.listrefCount} | ${form.approvalTaskCount} | ${form.contentListCount} | ${form.lookupCount} | ${form.aiReferenceCount} | ${form.documentGenerationCount} |`);
  }
  lines.push("");
  lines.push("## ContentList Mapping Overview");
  lines.push("");
  lines.push("| Form | Node | Operation | Target list | Mappings |");
  lines.push("| --- | --- | --- | --- | ---: |");
  for (const mapping of metadata.contentListMappings.slice(0, 80)) {
    lines.push(`| ${esc(mapping.formKey)} | ${esc(mapping.nodeName)} | ${esc(mapping.operation)} | ${esc(mapping.targetListName || mapping.targetListId)} | ${mapping.mappings.length} |`);
  }
  if (metadata.contentListMappings.length > 80) lines.push(`| ... | ... | ... | ${metadata.contentListMappings.length - 80} more | ... |`);
  lines.push("");
  lines.push("## Lookup Overview");
  lines.push("");
  lines.push("| Form | Page/control | Variable | Source list | Display field |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const lookup of metadata.lookupMappings.slice(0, 80)) {
    lines.push(`| ${esc(lookup.formKey)} | ${esc([lookup.pageTitle, lookup.controlLabel].filter(Boolean).join(" / "))} | \`${lookup.variable || ""}\` | ${esc(lookup.sourceListName || lookup.sourceListId)} | \`${lookup.displayFieldName || lookup.displayField || ""}\` |`);
  }
  if (metadata.lookupMappings.length > 80) lines.push(`| ... | ... | ... | ${metadata.lookupMappings.length - 80} more | ... |`);
  lines.push("");
  lines.push("## Warnings");
  lines.push("");
  if (!metadata.warnings.length) {
    lines.push("No warnings.");
  } else {
    for (const warning of metadata.warnings) {
      lines.push(`- **${warning.code}**: ${warning.message}`);
      if (warning.count !== undefined) lines.push(`  Count: ${warning.count}`);
      if (warning.resources) lines.push(`  Resources: \`${JSON.stringify(warning.resources).slice(0, 500)}\``);
      if (warning.examples) lines.push(`  Examples: \`${JSON.stringify(warning.examples).slice(0, 500)}\``);
    }
  }
  lines.push("");
  lines.push("## Suggested Next Use");
  lines.push("");
  lines.push("- Use this metadata as the source for generated form dependency mapping.");
  lines.push("- Match generated ContentList placeholders against `lists[].fields[]` by display name, internal name, and normalized type.");
  lines.push("- Validate target app/list/field IDs in a sandbox before applying metadata to a decoded Def draft.");
  lines.push("- Keep token/client/secret resources out of generated packages unless a separate approved credential-mapping process exists.");
  return `${lines.join("\n")}\n`;
}

function esc(value) {
  return String(value === null || value === undefined ? "" : value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function main() {
  const args = parseArgs(process.argv);
  const metadata = buildMetadata(args.input);
  fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
  fs.mkdirSync(path.dirname(path.resolve(args.md)), { recursive: true });
  fs.writeFileSync(args.out, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  fs.writeFileSync(args.md, markdown(metadata), "utf8");
  console.log(JSON.stringify({
    status: "pass",
    input: args.input,
    out: args.out,
    md: args.md,
    counts: {
      lists: metadata.lists.length,
      fields: metadata.fields.length,
      forms: metadata.forms.length,
      contentListMappings: metadata.contentListMappings.length,
      lookupMappings: metadata.lookupMappings.length,
      reports: metadata.reports.length,
      aiReferences: metadata.aiReferences.length,
      documentDependencies: metadata.documentDependencies.length,
      warnings: metadata.warnings.length,
    },
  }, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.log(JSON.stringify({
      status: "fail",
      errors: [{ code: "EXTRACTION_FAILED", message: error.message }],
    }, null, 2));
    process.exit(1);
  }
}

module.exports = { buildMetadata, normalizedType, sourceInfo };
