#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const DEFAULT_INPUT = "/Users/Renger/Downloads/business-travel-budget-control.v1.yap";
const DEFAULT_OUTPUT = "business-travel-budget-control.schema-fixed.v1.yap";
const DEFAULT_DOWNLOADS_OUTPUT = "/Users/Renger/Downloads/business-travel-budget-control.schema-fixed.v1.yap";

const WORKFLOW_VALUE_TYPES = new Map([
  ["TotalAmount", "number"],
  ["EstimatedTotalAmount", "number"],
  ["AvailableBudget", "number"],
  ["BudgetCheckResult", "text"],
  ["LineItemsSummary", "text"],
  ["RequestTitle", "text"],
  ["ProjectCode", "text"],
  ["ProjectName", "text"],
  ["Destination", "text"],
  ["TravelPurpose", "text"],
  ["TRid", "text"],
]);

const WORKFLOW_VARIABLE_RENAMES = new Map([
  ["EstimatedTotalAmount", "TotalAmount"],
]);

const REQUIRED_WORKFLOW_VARIABLES = [
  {
    idx: "btr1-var-applicant",
    id: "Applicant",
    name: "Applicant",
    type: "user",
    editable: true,
  },
  {
    idx: "btr1-var-trid",
    id: "TRid",
    name: "Travel Request No.",
    type: "text",
    editable: true,
  },
];

const APPLICANT_LINE_MANAGER_ASSIGNMENT = {
  type: "user",
  method: "expression",
  value: "<input type=\"button\" data=\"${ &quot;type&quot;:&quot;user&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${\\&quot;type\\&quot;:\\&quot;variable\\&quot;, \\&quot;param\\&quot;:{\\&quot;id\\&quot;:\\&quot;Applicant\\&quot;}}&quot;},&quot;prop&quot;:&quot;LineManager&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Workflow Variables:Applicant:Line Manager\">",
  title: "User:<input type=\"button\" data=\"${ &quot;type&quot;:&quot;user&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${\\&quot;type\\&quot;:\\&quot;variable\\&quot;, \\&quot;param\\&quot;:{\\&quot;id\\&quot;:\\&quot;Applicant\\&quot;}}&quot;},&quot;prop&quot;:&quot;LineManager&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Workflow Variables:Applicant:Line Manager\">",
};

function parseArgs(argv) {
  const args = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    downloadsOutput: DEFAULT_DOWNLOADS_OUTPUT,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") args.input = argv[++i];
    else if (arg === "--output") args.output = argv[++i];
    else if (arg === "--downloads-output") args.downloadsOutput = argv[++i];
    else if (arg === "--no-downloads-copy") args.downloadsOutput = "";
    else if (arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/repair-business-travel-yap-schema.mjs [--input file.yap] [--output fixed.yap] [--downloads-output /path/fixed.yap]

Repairs the generated Business Travel package for YAP schema-standard issues:
- root/child Defs and Layouts arrays
- approval form NoRule object
- generated FieldName suffixes matching FieldIndex
- legacy workflow expression HTML values converted to expression-token arrays`);
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function decodeYap(inputPath) {
  const wrapper = parseJson(fs.readFileSync(inputPath, "utf8"), "YAP wrapper");
  if (!wrapper.Resource || typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error("YAP wrapper Resource is missing the required gzip prefix.");
  }
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const resource = parseJson(resourceText, "decoded Resource");
  if (typeof resource.Data !== "string") {
    throw new Error("decoded Resource.Data must be a JSON string.");
  }
  const data = parseJson(resource.Data, "decoded Resource.Data");
  return { wrapper, resource, data };
}

function encodeYap(wrapper, resource, data) {
  const nextResource = { ...resource, Data: JSON.stringify(data) };
  const resourceJson = JSON.stringify(nextResource);
  const nextWrapper = {
    ...wrapper,
    Resource: GZIP_PREFIX + zlib.gzipSync(Buffer.from(resourceJson, "utf8")).toString("base64"),
  };
  return JSON.stringify(nextWrapper, null, 2);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function ensureArrayProperty(item, property, label, repairs) {
  if (!isObject(item)) return;
  if (!Array.isArray(item[property])) {
    if (item[property] === null || item[property] === undefined) {
      item[property] = [];
      repairs.arrayNormalizations.push(`${label}.${property}`);
      return;
    }
    throw new Error(`${label}.${property} exists but is not an array/null/missing; refusing unsafe repair.`);
  }
}

function listLabel(item, fallback) {
  return item?.ListModel?.Title || item?.ListModel?.ListID || fallback;
}

function collectListItems(data) {
  const items = [];
  if (data.Item) items.push({ item: data.Item, label: "Data.Item" });
  for (const [index, child] of (data.Childs || []).entries()) {
    items.push({ item: child, label: `Data.Childs[${index}]` });
  }
  return items;
}

function buildFieldRenameMap(item) {
  const map = new Map();
  const defs = Array.isArray(item?.Defs) ? item.Defs : [];
  for (const def of defs) {
    if (!isObject(def)) continue;
    const fieldName = typeof def.FieldName === "string" ? def.FieldName : "";
    const fieldIndex = Number(def.FieldIndex);
    if (!fieldName || !Number.isFinite(fieldIndex) || fieldIndex <= 0) continue;
    const match = fieldName.match(/^(.*?)(\d+)$/);
    if (!match) continue;
    const suffix = Number(match[2]);
    if (suffix !== fieldIndex) {
      map.set(fieldName, `${match[1]}${fieldIndex}`);
    }
  }

  if (!map.size) return map;
  const finalNames = defs.map((def) => map.get(def.FieldName) || def.FieldName).filter(Boolean);
  if (new Set(finalNames).size !== finalNames.length) {
    throw new Error(`FieldName suffix repair would create duplicate FieldName values for ${listLabel(item, "unknown list")}.`);
  }
  return map;
}

function remapExactStringKeysAndValues(value, mapping) {
  if (!mapping || !mapping.size) return value;
  if (Array.isArray(value)) return value.map((entry) => remapExactStringKeysAndValues(entry, mapping));
  if (isObject(value)) {
    const out = {};
    for (const [key, entry] of Object.entries(value)) {
      out[mapping.get(key) || key] = remapExactStringKeysAndValues(entry, mapping);
    }
    return out;
  }
  if (typeof value === "string") {
    if (mapping.has(value)) return mapping.get(value);
    const trimmed = value.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(remapExactStringKeysAndValues(parsed, mapping));
      } catch {
        return value;
      }
    }
  }
  return value;
}

function applyFieldRenameMaps(data, repairs) {
  const renameMapsByListId = new Map();
  for (const entry of collectListItems(data)) {
    const map = buildFieldRenameMap(entry.item);
    if (!map.size) continue;
    const listId = String(entry.item?.ListModel?.ListID || "");
    if (listId) renameMapsByListId.set(listId, map);
    const remapped = remapExactStringKeysAndValues(entry.item, map);
    Object.keys(entry.item).forEach((key) => delete entry.item[key]);
    Object.assign(entry.item, remapped);
    repairs.fieldRenames.push({
      list: listLabel(entry.item, entry.label),
      renames: Object.fromEntries(map.entries()),
    });
  }
  return renameMapsByListId;
}

function decodeHtmlEntities(value) {
  return String(value)
    .replaceAll("&quot;", "\"")
    .replaceAll("&#34;", "\"")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function parseLegacyButtonExpression(value) {
  if (typeof value !== "string") return null;
  const dataMatch = value.match(/\bdata="([^"]+)"/);
  if (!dataMatch) return null;
  const labelMatch = value.match(/\bvalue="([^"]*)"/);
  let dataText = decodeHtmlEntities(dataMatch[1]).trim();
  if (dataText.startsWith("${") && dataText.endsWith("}")) dataText = dataText.slice(2, -1);
  if (dataText.startsWith("\"")) dataText = `{${dataText}}`;
  const data = parseJson(dataText, "legacy expression data attribute");
  const label = labelMatch ? decodeHtmlEntities(labelMatch[1]) : "";
  return { data, label };
}

function inferValueType(id, fallback = "text") {
  return WORKFLOW_VALUE_TYPES.get(String(id || "")) || fallback;
}

function legacyValueToExpressionTokens(value) {
  if (Array.isArray(value)) return value;
  const parsed = parseLegacyButtonExpression(value);
  if (parsed?.data?.type === "variable") {
    const id = parsed.data.param?.id || parsed.data.id || parsed.label;
    return [{
      exprType: "variable",
      valueType: inferValueType(id),
      id,
      type: "expr",
      name: parsed.label || `Workflow Variables:${id}`,
    }];
  }
  if (parsed?.data?.type === "application") {
    const id = parsed.data.prop || parsed.data.param?.id || parsed.label || "ApplicationValue";
    return [{
      exprType: "application",
      valueType: inferValueType(id, "text"),
      id,
      type: "expr",
      name: parsed.label || id,
    }];
  }
  if (typeof value === "number") return [{ type: "num", value }];
  if (typeof value === "boolean") return [{ type: "bool", value }];
  return [{ type: "str", value: value === undefined || value === null ? "" : String(value) }];
}

function safeParseJsonString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || !["{", "["].includes(trimmed[0])) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function repairWorkflowDefResource(form, renameMapsByListId, repairs) {
  if (!form || typeof form.DefResource !== "string") return;
  const defResource = safeParseJsonString(form.DefResource);
  if (!defResource) return;

  if (!isObject(defResource.variables)) defResource.variables = {};
  if (!Array.isArray(defResource.variables.basic)) defResource.variables.basic = [];
  for (const variable of REQUIRED_WORKFLOW_VARIABLES) {
    if (!defResource.variables.basic.some((entry) => entry && entry.id === variable.id)) {
      defResource.variables.basic.push({ ...variable });
      repairs.workflowRepairs.push(`DefResource.variables.basic[].${variable.id}`);
    }
  }
  const variablesById = new Map(defResource.variables.basic.map((variable) => [variable.id, variable]));

  const renameWorkflowVariables = (value, pointer = "") => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => renameWorkflowVariables(entry, `${pointer}[${index}]`));
      return;
    }
    if (!isObject(value)) return;
    for (const [key, entry] of Object.entries(value)) {
      if ((key === "id" || key === "binding" || key === "value") && WORKFLOW_VARIABLE_RENAMES.has(entry)) {
        value[key] = WORKFLOW_VARIABLE_RENAMES.get(entry);
        repairs.workflowRepairs.push(`DefResource${pointer}.${key}`);
      } else if (key === "name" && entry === "Workflow Variables:Estimated Total Amount") {
        value[key] = "Workflow Variables:Total Requested Amount";
        repairs.workflowRepairs.push(`DefResource${pointer}.name`);
      } else {
        renameWorkflowVariables(entry, `${pointer}.${key}`);
      }
    }
  };
  renameWorkflowVariables(defResource);

  for (const shape of defResource.childshapes || []) {
    const props = shape?.properties;
    if (!isObject(props)) continue;
    const stencilId = shape?.stencil?.id || shape?.resourceId || shape?.resourceid || "";

    if (Array.isArray(props.usertaskassignment)) {
      props.usertaskassignment = props.usertaskassignment.map((assignment) => {
        if (
          assignment &&
          assignment.type === "position" &&
          assignment.method === "position" &&
          !/^\d+$/.test(String(assignment.position || ""))
        ) {
          repairs.workflowRepairs.push("MultiAssignmentTask.properties.usertaskassignment[].position");
          return { ...APPLICANT_LINE_MANAGER_ASSIGNMENT };
        }
        return assignment;
      });
    }

    if (stencilId === "SetVariableTask" || Array.isArray(props.variablesetting)) {
      if (!props.formtype) {
        props.formtype = "current";
        repairs.workflowRepairs.push("SetVariableTask.properties.formtype");
      }
      for (const setting of props.variablesetting || []) {
        if (!isObject(setting)) continue;
        const targetVariable = variablesById.get(setting.id);
        if (targetVariable) {
          if (setting.idx !== targetVariable.idx) {
            setting.idx = targetVariable.idx;
            repairs.workflowRepairs.push("SetVariableTask.properties.variablesetting[].idx");
          }
          if (setting.name !== targetVariable.name) {
            setting.name = targetVariable.name;
            repairs.workflowRepairs.push("SetVariableTask.properties.variablesetting[].name");
          }
          if (setting.type !== targetVariable.type) {
            setting.type = targetVariable.type;
            repairs.workflowRepairs.push("SetVariableTask.properties.variablesetting[].type");
          }
        }
        if (!setting.idx) {
          setting.idx = setting.key || setting.id || setting.name || "1";
          repairs.workflowRepairs.push("SetVariableTask.properties.variablesetting[].idx");
        }
        if (!Array.isArray(setting.value)) {
          setting.value = legacyValueToExpressionTokens(setting.value);
          repairs.workflowRepairs.push("SetVariableTask.properties.variablesetting[].value");
        }
      }
    }

    if (stencilId === "ContentList" || Array.isArray(props.listdatas)) {
      const listMap = renameMapsByListId.get(String(props.listid || ""));
      for (const entry of props.listdatas || []) {
        if (!isObject(entry)) continue;
        if (listMap?.has(entry.Columns)) {
          entry.Columns = listMap.get(entry.Columns);
          repairs.workflowRepairs.push("ContentList.properties.listdatas[].Columns");
        }
        if (!Array.isArray(entry.Data)) {
          entry.Data = legacyValueToExpressionTokens(entry.Data);
          repairs.workflowRepairs.push("ContentList.properties.listdatas[].Data");
        }
      }
    }
  }
  form.DefResource = JSON.stringify(defResource);
}

function repairNoRule(data, repairs) {
  for (const [index, form] of (data.Forms || []).entries()) {
    if (!isObject(form)) continue;
    const noRule = form.NoRule;
    const validObject = isObject(noRule) &&
      typeof noRule.Prefix === "string" &&
      noRule.Prefix.includes("{index}") &&
      Number.isInteger(Number(noRule.StartIndex)) &&
      Number.isInteger(Number(noRule.CustomLength)) &&
      Number.isInteger(Number(noRule.AutoIncrement));
    if (validObject) continue;
    form.NoRule = {
      Prefix: "BTR_{yyyy}_{index}",
      StartIndex: 1,
      CustomLength: 8,
      AutoIncrement: 1,
    };
    repairs.noRuleRepairs.push(`Data.Forms[${index}].NoRule`);
  }
}

function repair(data) {
  const repairs = {
    arrayNormalizations: [],
    listModelFlagsRepairs: [],
    fieldRenames: [],
    noRuleRepairs: [],
    workflowRepairs: [],
  };

  if (!isObject(data.Item)) throw new Error("Decoded Resource.Data.Item is missing or not an object.");
  ensureArrayProperty(data.Item, "Defs", "Data.Item", repairs);
  ensureArrayProperty(data.Item, "Layouts", "Data.Item", repairs);
  for (const [index, child] of (data.Childs || []).entries()) {
    ensureArrayProperty(child, "Defs", `Data.Childs[${index}]`, repairs);
    ensureArrayProperty(child, "Layouts", `Data.Childs[${index}]`, repairs);
  }
  for (const entry of collectListItems(data)) {
    if (!isObject(entry.item.ListModel)) continue;
    if (entry.item.ListModel.Flags !== 1) {
      entry.item.ListModel.Flags = 1;
      repairs.listModelFlagsRepairs.push(`${entry.label}.ListModel.Flags`);
    }
  }

  const renameMapsByListId = applyFieldRenameMaps(data, repairs);
  repairNoRule(data, repairs);
  for (const form of data.Forms || []) repairWorkflowDefResource(form, renameMapsByListId, repairs);

  repairs.workflowRepairs = [...new Set(repairs.workflowRepairs)];
  return repairs;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { wrapper, resource, data } = decodeYap(args.input);
  const repairs = repair(data);
  const outputText = encodeYap(wrapper, resource, data);
  fs.writeFileSync(args.output, outputText);
  if (args.downloadsOutput) {
    fs.mkdirSync(path.dirname(args.downloadsOutput), { recursive: true });
    fs.writeFileSync(args.downloadsOutput, outputText);
  }
  console.log(JSON.stringify({
    status: "repaired",
    input: args.input,
    output: args.output,
    downloadsOutput: args.downloadsOutput || null,
    repairs,
  }, null, 2));
}

main();
