#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

function usage(exitCode = 1) {
  const out = [
    "Usage:",
    "  node inspect-yap-package.js <export.yap> --json <report.json> --md <report.md>",
    "",
    "Example:",
    "  node inspect-yap-package.js \"./Procurement Management.yap\" --json ./procurement-inspection.json --md ./procurement-inspection.md",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(out);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, json: null, md: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") args.json = argv[++i];
    else if (arg === "--md") args.md = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input || !args.json || !args.md) usage();
  return args;
}

function quoteLargeIntegers(jsonText, largeNumbers) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;

  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }

    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }

    const canStartNumber = ch === "-" || (ch >= "0" && ch <= "9");
    if (canStartNumber) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      const hasDecimalOrExponent = jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E";
      if (hasDecimalOrExponent) {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else {
          out += token;
        }
      }
      i = j;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

function parseJsonPreservingLargeInts(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
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

function fieldKind(field) {
  const raw = `${field.FieldType || ""} ${field.Type || ""}`.toLowerCase();
  if (raw.includes("lookup")) return "lookup";
  if (raw.includes("file")) return "file";
  if (raw.includes("identity") || raw.includes("user")) return "user";
  if (raw.includes("decimal") || raw.includes("number") || raw.includes("currency") || raw.includes("percent") || raw.includes("bigint")) return "number";
  if (raw.includes("date") || raw.includes("time")) return "date";
  if (raw.includes("calculated")) return "calculated";
  if (raw.includes("list")) return "list";
  if (raw.includes("hyperlink")) return "hyperlink";
  if (raw.includes("radio") || raw.includes("select") || raw.includes("checkbox")) return "choice";
  if (raw.includes("textarea") || raw.includes("richtext") || raw.includes("text") || raw.includes("input")) return "text";
  return "unknown";
}

function decodeHtmlEntities(value) {
  return String(value)
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function expressionSummary(value) {
  if (value === null || value === undefined) return { kind: "empty", text: "" };
  if (Array.isArray(value)) {
    return {
      kind: "expressionArray",
      text: value.map((item) => item.name || item.value || item.func || item.type || "").filter(Boolean).join(" "),
      raw: value,
    };
  }
  if (typeof value !== "string") return { kind: "literal", text: String(value), raw: value };
  if (value.includes("<input") && value.includes("data=")) {
    const decoded = decodeHtmlEntities(value);
    const label = (decoded.match(/value="([^"]*)"/) || [])[1] || "";
    const id = (decoded.match(/"id":"([^"]+)"/) || [])[1] || null;
    const prop = (decoded.match(/"prop":"([^"]+)"/) || [])[1] || null;
    const type = (decoded.match(/"type":"([^"]+)"/) || [])[1] || null;
    return { kind: "expressionButton", text: label, id, prop, type };
  }
  return { kind: "literal", text: value };
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function walkControls(control, visitor, pathPrefix) {
  if (!control || typeof control !== "object") return;
  visitor(control, pathPrefix);
  for (const key of ["children", "columns"]) {
    if (Array.isArray(control[key])) control[key].forEach((child, index) => walkControls(child, visitor, `${pathPrefix}.${key}[${index}]`));
  }
}

function parseRules(rules) {
  if (!rules || typeof rules !== "string") return null;
  try {
    return JSON.parse(rules);
  } catch {
    return null;
  }
}

function decodeYap(inputPath) {
  const largeNumbers = new Set();
  const raw = fs.readFileSync(inputPath, "utf8");
  const wrapper = parseJsonPreservingLargeInts(raw, largeNumbers);
  const format = {
    isJson: true,
    topLevelKeys: Object.keys(wrapper),
    hasResource: typeof wrapper.Resource === "string",
    resourceHasGzipPrefix: typeof wrapper.Resource === "string" && wrapper.Resource.startsWith(GZIP_PREFIX),
  };

  if (!format.hasResource) throw new Error("Top-level Resource field is missing or not a string");
  if (!format.resourceHasGzipPrefix) throw new Error(`Resource does not start with ${GZIP_PREFIX}`);

  const compressed = Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64");
  const resourceText = zlib.gunzipSync(compressed).toString("utf8");
  const resource = parseJsonPreservingLargeInts(resourceText, largeNumbers);
  const data = parseJsonPreservingLargeInts(resource.Data, largeNumbers);
  return { wrapper, resource, data, format, largeNumbers: [...largeNumbers].sort() };
}

function buildReport(inputPath) {
  const { wrapper, resource, data, format, largeNumbers } = decodeYap(inputPath);
  const mainItem = data.Item || {};
  const mainList = mainItem.ListModel || {};
  const allListResources = [mainItem, ...asArray(data.Childs)];
  const listById = new Map(allListResources.map((item) => [String(item.ListModel && item.ListModel.ListID), item]));
  const fieldsByListId = new Map(allListResources.map((item) => {
    const listId = String(item.ListModel && item.ListModel.ListID);
    return [listId, new Map(asArray(item.Defs).map((field) => [field.FieldName || field.InternalName || field.DisplayName, field]))];
  }));

  const decodedForms = asArray(data.Forms).map((form) => decodeForm(form));
  const resourceInventory = allListResources.map((item, index) => listResourceInventory(item, index === 0, String(mainList.ListID)));
  const listFieldInventory = allListResources.map((item) => listFieldInventoryFor(item));
  const relationships = buildRelationships(decodedForms, data, listById, fieldsByListId);
  const warnings = buildWarnings(data, largeNumbers, relationships, resourceInventory);

  return {
    generatedAt: new Date().toISOString(),
    input: path.resolve(inputPath),
    format,
    packageSummary: {
      title: wrapper.Title || null,
      description: wrapper.Description || null,
      iconUrl: wrapper.IconUrl || null,
      isListSet: wrapper.IsListSet,
      appId: resource.AppID || mainList.AppID || null,
      mainListType: resource.MainListType || mainList.Type || null,
      mainListSetId: mainList.ListID || null,
      replaceIdsCount: asArray(resource.ReplaceIds).length,
      reportIdsCount: asArray(resource.ReportIds).length,
      formKeysCount: asArray(resource.FormKeys).length,
      counts: {
        item: data.Item ? 1 : 0,
        childs: asArray(data.Childs).length,
        forms: asArray(data.Forms).length,
        formReports: asArray(data.FormReports).length,
        dataReports: asArray(data.DataReports).length,
        formNewReports: asArray(data.FormNewReports).length,
        appGroups: asArray(data.AppGroups).length,
        appThemes: asArray(data.AppThemes).length,
        otherModules: asArray(data.OtherModules).length,
      },
    },
    resourceInventory,
    formInventory: decodedForms.map((item) => item.inventory),
    listFieldInventory,
    relationships,
    warnings,
  };
}

function decodeForm(form) {
  const result = { form, def: null, parseError: null };
  try {
    result.def = JSON.parse(form.DefResource);
  } catch (error) {
    result.parseError = error.message;
  }

  const def = result.def || {};
  const nodes = asArray(def.childshapes);
  const contentListNodes = nodes.filter((node) => stencilId(node) === "ContentList");
  const aiNodes = nodes.filter((node) => stencilId(node) === "AI");
  const aiActions = asArray(def.pageurls).flatMap((page) => asArray(page.formdef && page.formdef.actions)).filter((action) => {
    return JSON.stringify(action).includes('"type":"ai"') || JSON.stringify(action).includes("\"AgentID\"");
  });
  const approvalPages = asArray(def.pageurls)
    .filter((page) => page.type === 2)
    .map((page) => page.title || page.name || (page.formdef && (page.formdef.title || page.formdef.name)) || page.id);

  result.inventory = {
    name: form.Name || null,
    key: form.Key || null,
    defkey: def.defkey || null,
    appId: form.AppID || null,
    listId: form.ListID || null,
    procModelId: form.ProcModelID || null,
    workflowType: form.WorkflowType || def.workflowType || null,
    defResourceParses: !!result.def,
    parseError: result.parseError,
    variablesBasicCount: asArray(def.variables && def.variables.basic).length,
    variablesListrefCount: asArray(def.variables && def.variables.listref).length,
    pageCount: asArray(def.pageurls).length,
    approvalTaskCount: nodes.filter((node) => stencilId(node) === "MultiAssignmentTask").length,
    contentListNodeCount: contentListNodes.length,
    aiNodeCount: aiNodes.length,
    aiActionCount: aiActions.length,
    generateDocumentCount: nodes.filter((node) => stencilId(node) === "GenerateDocument").length,
    approvalPageTitles: approvalPages,
    targetListsUsedByContentList: [...new Set(contentListNodes.map((node) => String(node.properties && node.properties.listid)).filter(Boolean))],
  };

  return result;
}

function listResourceInventory(item, isMain, listSetId) {
  const model = item.ListModel || {};
  return {
    resourceName: model.Title || null,
    resourceType: classifyListType(model.Type),
    appId: model.AppID || null,
    listSetId,
    listId: model.ListID || null,
    resourceId: model.ListID || null,
    listType: model.Type || null,
    customType: model.CustomType || null,
    fieldCount: asArray(item.Defs).length,
    layoutCount: asArray(item.Layouts).length,
    flowMappingCount: asArray(item.FlowMappings).length,
    notes: isMain ? "Main application/listset resource" : "",
  };
}

function classifyListType(type) {
  const map = {
    1: "data list",
    16: "document library",
    32: "form report/list resource",
    64: "report/data resource",
    1024: "app/listset",
  };
  return map[Number(type)] || `list type ${type}`;
}

function listFieldInventoryFor(item) {
  const model = item.ListModel || {};
  return {
    listDisplayName: model.Title || null,
    appId: model.AppID || null,
    listId: model.ListID || null,
    listType: model.Type || null,
    fields: asArray(item.Defs).map((field) => ({
      fieldId: field.FieldID || null,
      displayLabel: field.DisplayName || null,
      internalFieldName: field.InternalName || null,
      storageFieldName: field.FieldName || null,
      fieldType: field.FieldType || null,
      controlType: field.Type || null,
      kind: fieldKind(field),
      isSystem: !!field.IsSystem,
      isUnique: !!field.IsUnique,
      rules: parseRules(field.Rules),
    })),
  };
}

function buildRelationships(decodedForms, data, listById, fieldsByListId) {
  const contentLists = [];
  const lookups = [];
  const documentLibraries = [];
  const aiAgentReferences = [];
  const reports = [];

  for (const decoded of decodedForms) {
    const form = decoded.form;
    const def = decoded.def;
    if (!def) continue;
    for (const node of asArray(def.childshapes)) {
      const st = stencilId(node);
      const props = node.properties || {};
      if (st === "ContentList") {
        const targetList = listById.get(String(props.listid));
        contentLists.push({
          formName: form.Name || null,
          formKey: form.Key || null,
          nodeName: props.name || null,
          operation: props.type || null,
          appId: props.appid || null,
          listSetId: props.listsetid || null,
          listId: props.listid || null,
          targetListName: targetList && targetList.ListModel && targetList.ListModel.Title,
          wheres: asArray(props.wheres).map((where) => ({
            left: where.left,
            op: where.op,
            right: expressionSummary(where.right),
          })),
          mappedFields: asArray(props.listdatas).map((item) => ({
            targetColumn: item.Columns,
            targetField: resolveField(props.listid, item.Columns, fieldsByListId),
            source: expressionSummary(item.Data),
          })),
        });
        if (targetList && Number(targetList.ListModel && targetList.ListModel.Type) === 16) {
          documentLibraries.push({
            formName: form.Name || null,
            formKey: form.Key || null,
            nodeName: props.name || null,
            listId: props.listid || null,
            libraryName: targetList.ListModel.Title,
          });
        }
      }
      if (st === "AI" || JSON.stringify(props).includes("AgentID")) {
        aiAgentReferences.push({
          formName: form.Name || null,
          formKey: form.Key || null,
          nodeName: props.name || null,
          stencil: st,
          agentIds: extractAgentIds(props),
        });
      }
      if (st === "GenerateDocument") {
        documentLibraries.push({
          formName: form.Name || null,
          formKey: form.Key || null,
          nodeName: props.name || null,
          relationshipType: "GenerateDocument",
          properties: compactObject(props, ["name", "templateid", "templateId", "libraryid", "libraryId", "output", "file"]),
        });
      }
    }

    for (const page of asArray(def.pageurls)) {
      const pageTitle = page.title || page.name || (page.formdef && (page.formdef.title || page.formdef.name)) || page.id;
      walkControls(page.formdef || page, (control, controlPath) => {
        const attrs = control.attrs || {};
        if (control.type === "lookup" || control.type === "lookup-list" || attrs.listid || attrs.listId) {
          lookups.push({
            formName: form.Name || null,
            formKey: form.Key || null,
            pageTitle,
            controlLabel: control.label || control.title || control.name || null,
            controlType: control.type || null,
            variable: control.binding || null,
            sourceAppId: attrs.appid || attrs.appId || null,
            sourceListSetId: attrs.listsetid || attrs.listSetId || null,
            sourceListId: attrs.listid || attrs.listId || null,
            sourceListName: listById.get(String(attrs.listid || attrs.listId))?.ListModel?.Title || null,
            displayField: attrs.listfield || null,
            additionList: attrs["addition-list"] || null,
            filters: asArray(attrs.listfilter).map((filter) => ({
              left: filter.left,
              op: filter.op,
              right: expressionSummary(filter.right),
              showCus: filter.showCus,
            })),
            path: controlPath,
          });
        }
      }, "$.formdef");

      for (const action of asArray(page.formdef && page.formdef.actions)) {
        if (JSON.stringify(action).includes("AgentID")) {
          aiAgentReferences.push({
            formName: form.Name || null,
            formKey: form.Key || null,
            pageTitle,
            actionName: action.name || null,
            stencil: "formAction",
            agentIds: extractAgentIds(action),
          });
        }
      }
    }
  }

  for (const report of asArray(data.DataReports)) {
    const settings = safeJson(report.Settings);
    const stages = asArray(settings && settings.Stages);
    reports.push({
      reportType: "DataReport",
      id: report.ID || null,
      name: report.Name || null,
      inputLists: stages.filter((stage) => stage.Type === "input").map((stage) => ({
        name: stage.Name || null,
        appId: stage.AppID || null,
        listId: stage.ListID || null,
        listName: stage.ListName || listById.get(String(stage.ListID))?.ListModel?.Title || null,
        fields: stage.SourceFields || null,
      })),
    });
  }

  for (const report of asArray(data.FormNewReports)) {
    reports.push({
      reportType: "FormNewReport",
      id: report.ID || null,
      defKey: report.DefKey || null,
      name: report.Name || null,
      settingsSummary: safeJson(report.Settings) ? {
        fieldCount: asArray(safeJson(report.Settings).Fields).length,
        subListId: safeJson(report.Settings).SubListID || null,
      } : null,
    });
  }

  return { contentLists, lookups, documentLibraries, aiAgentReferences, reports };
}

function resolveField(listId, column, fieldsByListId) {
  const fields = fieldsByListId.get(String(listId));
  if (!fields) return null;
  const field = fields.get(column) || [...fields.values()].find((candidate) => candidate.InternalName === column || candidate.DisplayName === column);
  if (!field) return null;
  return {
    displayLabel: field.DisplayName || null,
    internalFieldName: field.InternalName || null,
    storageFieldName: field.FieldName || null,
    fieldType: field.FieldType || null,
    controlType: field.Type || null,
    kind: fieldKind(field),
  };
}

function extractAgentIds(value) {
  const ids = new Set();
  walk(value, (node) => {
    if (isObject(node)) {
      if (node.AgentID) ids.add(String(node.AgentID));
      if (node.AgentId) ids.add(String(node.AgentId));
      if (node.agentId) ids.add(String(node.agentId));
    }
    if (typeof node === "string") {
      for (const match of node.matchAll(/"AgentID"\s*:\s*"([^"]+)"/g)) ids.add(match[1]);
    }
  });
  return [...ids];
}

function safeJson(value) {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function compactObject(obj, keys) {
  const out = {};
  for (const key of keys) if (obj[key] !== undefined) out[key] = obj[key];
  return out;
}

function buildWarnings(data, largeNumbers, relationships, resourceInventory) {
  const warnings = [];
  if (largeNumbers.length > 0) {
    warnings.push({
      code: "LARGE_NUMERIC_IDS",
      message: "Large integer tokens were preserved as strings because they may exceed JavaScript safe integer precision.",
      count: largeNumbers.length,
      examples: largeNumbers.slice(0, 12),
    });
  }

  const knownListIds = new Set(resourceInventory.map((item) => String(item.listId)).filter(Boolean));
  const missingContentTargets = relationships.contentLists.filter((item) => item.listId && !knownListIds.has(String(item.listId)));
  if (missingContentTargets.length > 0) {
    warnings.push({
      code: "CONTENTLIST_TARGET_NOT_IN_PACKAGE",
      message: "Some ContentList targets were not found in the package list inventory.",
      count: missingContentTargets.length,
      examples: missingContentTargets.slice(0, 10).map((item) => ({ formKey: item.formKey, nodeName: item.nodeName, listId: item.listId })),
    });
  }

  const missingLookupTargets = relationships.lookups.filter((item) => item.sourceListId && !knownListIds.has(String(item.sourceListId)));
  if (missingLookupTargets.length > 0) {
    warnings.push({
      code: "LOOKUP_SOURCE_NOT_IN_PACKAGE",
      message: "Some lookup source lists were not found in the package list inventory.",
      count: missingLookupTargets.length,
      examples: missingLookupTargets.slice(0, 10).map((item) => ({ formKey: item.formKey, controlLabel: item.controlLabel, sourceListId: item.sourceListId })),
    });
  }

  const tokenLike = resourceInventory.filter((item) => /token|credential|secret|client/i.test(item.resourceName || ""));
  if (tokenLike.length > 0) {
    warnings.push({
      code: "TOKEN_OR_CREDENTIAL_RESOURCE",
      message: "Package includes token/credential-like resources. Do not expose or copy secret values blindly.",
      resources: tokenLike.map((item) => ({ name: item.resourceName, listId: item.listId })),
    });
  }

  if (relationships.aiAgentReferences.some((item) => item.agentIds.length > 0)) {
    warnings.push({
      code: "AI_AGENT_REFERENCES",
      message: "AI Agent references were found and may require import remapping or bundled module validation.",
      examples: relationships.aiAgentReferences.filter((item) => item.agentIds.length > 0).slice(0, 10),
    });
  }

  if (relationships.documentLibraries.length > 0) {
    warnings.push({
      code: "DOCUMENT_LIBRARY_DEPENDENCIES",
      message: "Document library or document generation dependencies were found. Confirm templates/files/libraries after import.",
      examples: relationships.documentLibraries.slice(0, 10),
    });
  }

  return warnings;
}

function markdownReport(report) {
  const lines = [];
  lines.push(`# Yeeflow .yap Inspection: ${report.packageSummary.title || "Untitled"}`);
  lines.push("");
  lines.push("Read-only package inspection. No import, UI operation, or package generation was performed.");
  lines.push("");
  lines.push("## Package Summary");
  lines.push("");
  lines.push(`- Input: \`${report.input}\``);
  lines.push(`- AppID: \`${report.packageSummary.appId}\``);
  lines.push(`- MainListType: \`${report.packageSummary.mainListType}\``);
  lines.push(`- Main ListSetID: \`${report.packageSummary.mainListSetId}\``);
  lines.push(`- ReplaceIds: ${report.packageSummary.replaceIdsCount}`);
  lines.push(`- ReportIds: ${report.packageSummary.reportIdsCount}`);
  lines.push(`- FormKeys: ${report.packageSummary.formKeysCount}`);
  lines.push(`- Child resources: ${report.packageSummary.counts.childs}`);
  lines.push(`- Forms/workflows: ${report.packageSummary.counts.forms}`);
  lines.push(`- DataReports: ${report.packageSummary.counts.dataReports}`);
  lines.push(`- FormNewReports: ${report.packageSummary.counts.formNewReports}`);
  lines.push(`- OtherModules: ${report.packageSummary.counts.otherModules}`);
  lines.push("");

  lines.push("## Resource Inventory");
  lines.push("");
  lines.push("| Name | Type | AppID | ListSetID | ListID | Fields | Notes |");
  lines.push("| --- | --- | --- | --- | --- | ---: | --- |");
  for (const item of report.resourceInventory) {
    lines.push(`| ${esc(item.resourceName)} | ${esc(item.resourceType)} | \`${item.appId || ""}\` | \`${item.listSetId || ""}\` | \`${item.listId || ""}\` | ${item.fieldCount} | ${esc(item.notes || "")} |`);
  }
  lines.push("");

  lines.push("## Form / Workflow Inventory");
  lines.push("");
  lines.push("| Name | Key | Type | Def parses | basic/listref | Pages | Approval tasks | ContentList | AI | GenerateDocument | Approval pages |");
  lines.push("| --- | --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const form of report.formInventory) {
    lines.push(`| ${esc(form.name)} | \`${form.key || ""}\` | ${form.workflowType || ""} | ${form.defResourceParses ? "yes" : "no"} | ${form.variablesBasicCount}/${form.variablesListrefCount} | ${form.pageCount} | ${form.approvalTaskCount} | ${form.contentListNodeCount} | ${form.aiNodeCount + form.aiActionCount} | ${form.generateDocumentCount} | ${esc(form.approvalPageTitles.join(", "))} |`);
  }
  lines.push("");

  lines.push("## Relationship Counts");
  lines.push("");
  lines.push(`- ContentList relationships: ${report.relationships.contentLists.length}`);
  lines.push(`- Lookup relationships: ${report.relationships.lookups.length}`);
  lines.push(`- Document library relationships: ${report.relationships.documentLibraries.length}`);
  lines.push(`- AI Agent references: ${report.relationships.aiAgentReferences.length}`);
  lines.push(`- Reports: ${report.relationships.reports.length}`);
  lines.push("");

  lines.push("## ContentList Targets");
  lines.push("");
  lines.push("| Form | Node | Operation | Target list | Mapped fields |");
  lines.push("| --- | --- | --- | --- | ---: |");
  for (const item of report.relationships.contentLists.slice(0, 80)) {
    lines.push(`| ${esc(item.formKey)} | ${esc(item.nodeName)} | ${esc(item.operation)} | ${esc(item.targetListName || item.listId)} | ${item.mappedFields.length} |`);
  }
  if (report.relationships.contentLists.length > 80) lines.push(`| ... | ... | ... | ${report.relationships.contentLists.length - 80} more | ... |`);
  lines.push("");

  lines.push("## Lookup Sources");
  lines.push("");
  lines.push("| Form | Page/control | Variable | Source list | Display field |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const item of report.relationships.lookups.slice(0, 80)) {
    lines.push(`| ${esc(item.formKey)} | ${esc([item.pageTitle, item.controlLabel].filter(Boolean).join(" / "))} | \`${item.variable || ""}\` | ${esc(item.sourceListName || item.sourceListId)} | \`${item.displayField || ""}\` |`);
  }
  if (report.relationships.lookups.length > 80) lines.push(`| ... | ... | ... | ${report.relationships.lookups.length - 80} more | ... |`);
  lines.push("");

  lines.push("## Warnings");
  lines.push("");
  if (report.warnings.length === 0) {
    lines.push("No warnings.");
  } else {
    for (const warning of report.warnings) {
      lines.push(`- **${warning.code}**: ${warning.message}`);
      if (warning.count !== undefined) lines.push(`  Count: ${warning.count}`);
      if (warning.examples) lines.push(`  Examples: \`${JSON.stringify(warning.examples).slice(0, 600)}\``);
      if (warning.resources) lines.push(`  Resources: \`${JSON.stringify(warning.resources).slice(0, 600)}\``);
    }
  }
  lines.push("");
  lines.push("## Safety Notes");
  lines.push("");
  lines.push("- Treat AppID/ListSetID/ListID/user/position/agent IDs as environment-specific unless proven remapped by import.");
  lines.push("- Do not copy token/client/secret values from app resources.");
  lines.push("- Validate lookup sources, ContentList targets, document libraries, and AI Agents in the target sandbox before final package generation.");
  return `${lines.join("\n")}\n`;
}

function esc(value) {
  return String(value === null || value === undefined ? "" : value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function main() {
  const args = parseArgs(process.argv);
  const report = buildReport(args.input);
  fs.mkdirSync(path.dirname(path.resolve(args.json)), { recursive: true });
  fs.mkdirSync(path.dirname(path.resolve(args.md)), { recursive: true });
  fs.writeFileSync(args.json, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(args.md, markdownReport(report), "utf8");
  console.log(JSON.stringify({
    status: "pass",
    input: args.input,
    json: args.json,
    md: args.md,
    summary: report.packageSummary,
    warningCount: report.warnings.length,
    warnings: report.warnings.map((warning) => ({ code: warning.code, count: warning.count || warning.resources?.length || warning.examples?.length || null })),
  }, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.log(JSON.stringify({
      status: "fail",
      errors: [{ code: "INSPECTION_FAILED", message: error.message }],
    }, null, 2));
    process.exit(1);
  }
}

module.exports = { buildReport, quoteLargeIntegers, parseJsonPreservingLargeInts };
