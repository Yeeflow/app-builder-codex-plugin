#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const PRIVATE_NUMBER_RE = /\b\d{8,}\b/g;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

function usage(exitCode = 1) {
  const message = [
    "Usage:",
    "  node scripts/inspect-workflow-set-data-list-actions.mjs <input.yap> --out-dir <normalized-dir>",
    "",
    "Decodes a Yeeflow .yap read-only and writes redacted Set data list / ContentList normalized references.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(message);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, outDir: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out-dir") args.outDir = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input || !args.outDir) usage();
  return args;
}

function quoteLargeIntegers(jsonText) {
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
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        out += LARGE_INTEGER_RE.test(token) ? `"${token}"` : token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text) {
  return JSON.parse(quoteLargeIntegers(text));
}

function decodeYap(inputPath) {
  const wrapper = parseJson(fs.readFileSync(inputPath, "utf8"));
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input Resource must start with ${GZIP_PREFIX}`);
  }
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const resource = parseJson(resourceText);
  const data = parseJson(resource.Data);
  return { data };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function stencilId(shape) {
  return shape?.stencil?.id || shape?.stencil || shape?.type || "unknown";
}

function shapeId(shape) {
  return String(shape?.resourceid || shape?.resourceId || shape?.id || "");
}

function redactText(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(EMAIL_RE, "<REDACTED_EMAIL>")
    .replace(PRIVATE_NUMBER_RE, "<REDACTED_PRIVATE_ID>");
}

function workflowHost(workflowType) {
  if (String(workflowType) === "1") return "data-list-workflow";
  if (String(workflowType) === "2") return "approval-form-workflow";
  if (String(workflowType) === "3") return "scheduled-workflow";
  return "unknown-workflow";
}

function listTypeLabel(type) {
  if (String(type) === "1") return "data-list";
  if (String(type) === "16") return "document-library";
  if (String(type) === "32") return "report";
  return "unknown-data-source";
}

function summarizeExpression(value) {
  const tokenTypes = new Set();
  const exprTypes = new Set();
  const valueTypes = new Set();
  const functions = new Set();
  const props = new Set();
  const references = [];
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!isObject(node)) return;
    if (node.type) tokenTypes.add(String(node.type));
    if (node.exprType) exprTypes.add(String(node.exprType));
    if (node.valueType) valueTypes.add(String(node.valueType));
    if (node.func) functions.add(String(node.func));
    if (node.prop) props.add(String(node.prop));
    if (node.exprType || node.name) {
      references.push({
        exprType: node.exprType || "",
        valueType: node.valueType || "",
        prop: node.prop ? "<REDACTED_FIELD_REF>" : undefined,
        id: node.id && PRIVATE_NUMBER_RE.test(String(node.id)) ? "<REDACTED_ID>" : node.id || undefined,
        name: redactText(node.name || ""),
      });
    }
    for (const child of Object.values(node)) visit(child);
  };
  visit(value);
  return {
    shape: Array.isArray(value) ? "expression-token-array" : typeof value,
    tokenTypes: [...tokenTypes].sort(),
    exprTypes: [...exprTypes].sort(),
    valueTypes: [...valueTypes].sort(),
    functions: [...functions].sort(),
    listFieldProps: [...props].sort().map(() => "<REDACTED_FIELD_REF>"),
    references,
  };
}

function summarizeWhere(where, index) {
  return {
    index,
    key: where?.key ? "<REDACTED_CONDITION_ID>" : "",
    pre: where?.pre || "",
    left: where?.left || "",
    op: where?.op || "",
    right: summarizeExpression(where?.right),
    showCus: where?.showCus,
    nestedConditionCount: Array.isArray(where?.conditions) ? where.conditions.length : 0,
  };
}

function summarizeMapping(mapping, index, targetList) {
  const field = asArray(targetList?.Defs).find((def) => def.FieldName === mapping?.Columns);
  return {
    index,
    Columns: mapping?.Columns || "",
    targetField: field ? {
      FieldID: "<REDACTED_FIELD_ID>",
      FieldName: field.FieldName || "",
      DisplayName: redactText(field.DisplayName || ""),
      FieldType: field.FieldType || "",
      Type: field.Type || "",
      IsSystem: field.IsSystem,
    } : null,
    Per: mapping?.Per ?? "",
    numericOperationCode: mapping?.Per ?? "",
    Data: summarizeExpression(mapping?.Data),
  };
}

function buildListIndex(data) {
  const lists = new Map();
  for (const child of asArray(data.Childs)) {
    const model = child.ListModel || {};
    if (!model.ListID) continue;
    lists.set(String(model.ListID), child);
  }
  return lists;
}

function summarizeContentList(form, def, shape, listIndex, flowCounts) {
  const props = shape.properties || {};
  const target = listIndex.get(String(props.listid));
  const mappings = Array.isArray(props.listdatas) ? props.listdatas : [];
  const wheres = Array.isArray(props.wheres) ? props.wheres : [];
  const mappingSummaries = mappings.map((entry, index) => summarizeMapping(entry, index, target));
  const whereSummaries = wheres.map(summarizeWhere);
  const hasSubListValue = mappingSummaries.some((entry) =>
    entry.Data.valueTypes.includes("list") ||
    entry.Data.references.some((ref) => /Sub List|sub list/i.test(ref.name || "")),
  );
  const hasListFieldValue = mappingSummaries.some((entry) => entry.Data.exprTypes.includes("list_field")) ||
    whereSummaries.some((entry) => entry.right.exprTypes.includes("list_field"));
  return {
    proofLevel: "export-proven",
    internalControlType: "ContentList",
    frontEndAction: "Set data list",
    workflowHost: workflowHost(form.WorkflowType ?? def.workflowType),
    workflowType: form.WorkflowType ?? def.workflowType,
    workflowName: redactText(form.Name || form.Title || ""),
    nodeId: "<REDACTED_WORKFLOW_NODE_ID>",
    nodeName: redactText(props.name || ""),
    listtype: props.listtype || "",
    operationType: props.type || "",
    target: {
      mode: props.listtype === "current" ? "current-list" : "selected-data-source",
      appid: props.appid ? "<REDACTED_APP_ID>" : "",
      listsetid: props.listsetid ? "<REDACTED_LISTSET_ID>" : "",
      listid: props.listid ? "<REDACTED_LIST_ID>" : "",
      resolvedTitle: redactText(target?.ListModel?.Title || ""),
      resolvedType: listTypeLabel(target?.ListModel?.Type),
    },
    listdatasShape: Array.isArray(props.listdatas) ? "array" : typeof props.listdatas,
    listdatasCount: mappings.length,
    mappings: mappingSummaries,
    wheresShape: Array.isArray(props.wheres) ? "array" : typeof props.wheres,
    wheresCount: wheres.length,
    wheres: whereSummaries,
    hasListFieldValue,
    hasSubListValue,
    broadMutationRisk: ["edit", "remove"].includes(String(props.type)) && wheres.length === 0,
    incomingCount: flowCounts.incoming.get(shapeId(shape)) || asArray(shape.incoming).length,
    outgoingCount: flowCounts.outgoing.get(shapeId(shape)) || asArray(shape.outgoing).length,
  };
}

function collectFlowCounts(shapes) {
  const incoming = new Map();
  const outgoing = new Map();
  for (const shape of shapes) {
    if (stencilId(shape) !== "SequenceFlow") continue;
    const source = String(shape.source?.resourceId || shape.source?.resourceid || shape.source?.id || "");
    const target = String(shape.target?.resourceId || shape.target?.resourceid || shape.target?.id || "");
    if (source) outgoing.set(source, (outgoing.get(source) || 0) + 1);
    if (target) incoming.set(target, (incoming.get(target) || 0) + 1);
  }
  return { incoming, outgoing };
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function selectFirst(nodes, predicate) {
  return nodes.find(predicate);
}

function main() {
  const args = parseArgs(process.argv);
  const { data } = decodeYap(args.input);
  const listIndex = buildListIndex(data);
  const nodes = [];
  for (const form of asArray(data.Forms)) {
    const def = safeJson(form.DefResource, {});
    const shapes = asArray(def.childShapes || def.childshapes);
    const flowCounts = collectFlowCounts(shapes);
    for (const shape of shapes) {
      if (stencilId(shape) !== "ContentList") continue;
      nodes.push(summarizeContentList(form, def, shape, listIndex, flowCounts));
    }
  }

  const summary = {
    proofLevel: "export-proven",
    inputFile: path.basename(args.input),
    contentListNodeCount: nodes.length,
    countsByHost: Object.fromEntries(
      [...new Set(nodes.map((node) => node.workflowHost))].map((host) => [host, nodes.filter((node) => node.workflowHost === host).length]),
    ),
    operationTypes: [...new Set(nodes.map((node) => node.operationType))].sort(),
    listtypes: [...new Set(nodes.map((node) => node.listtype))].sort(),
    targetTypes: [...new Set(nodes.map((node) => node.target.resolvedType))].sort(),
    numericOperationCodes: [...new Set(nodes.flatMap((node) => node.mappings.map((mapping) => String(mapping.Per))))].sort(),
    hasListFieldValues: nodes.some((node) => node.hasListFieldValue),
    hasSubListValues: nodes.some((node) => node.hasSubListValue),
    broadMutationRisks: nodes.filter((node) => node.broadMutationRisk).length,
  };
  writeJson(path.join(args.outDir, "set-data-list-inventory.normalized.json"), { summary, nodes });

  const refs = [
    ["set-data-list-target-selected-data-list.normalized.json", (node) => node.listtype === "select"],
    ["set-data-list-target-current-list.normalized.json", (node) => node.listtype === "current"],
    ["set-data-list-add-selected-list.normalized.json", (node) => node.listtype === "select" && node.operationType === "add"],
    ["set-data-list-add-current-list.normalized.json", (node) => node.listtype === "current" && node.operationType === "add"],
    ["set-data-list-edit-selected-list.normalized.json", (node) => node.listtype === "select" && node.operationType === "edit"],
    ["set-data-list-remove-selected-list.normalized.json", (node) => node.listtype === "select" && node.operationType === "remove"],
    ["set-data-list-edit-filter.normalized.json", (node) => node.operationType === "edit" && node.wheresCount > 0],
    ["set-data-list-remove-filter.normalized.json", (node) => node.operationType === "remove" && node.wheresCount > 0],
    ["set-data-list-value-expression-list-field.normalized.json", (node) => node.hasListFieldValue],
    ["set-data-list-sublist-source-approval-form.normalized.json", (node) => node.workflowHost === "approval-form-workflow" && node.hasSubListValue],
    ["set-data-list-sublist-source-data-list.normalized.json", (node) => node.workflowHost === "data-list-workflow" && node.hasSubListValue],
    ["set-data-list-sublist-to-multiple-records.normalized.json", (node) => node.hasSubListValue],
  ];
  for (const [fileName, predicate] of refs) {
    const node = selectFirst(nodes, predicate);
    if (node) writeJson(path.join(args.outDir, fileName), node);
  }
  for (const code of ["0", "1", "2", "3", "4"]) {
    const node = selectFirst(nodes, (candidate) => candidate.mappings.some((mapping) => String(mapping.Per) === code));
    if (node) {
      const mapping = node.mappings.find((entry) => String(entry.Per) === code);
      const names = {
        0: "set-data-list-number-value.normalized.json",
        1: "set-data-list-number-increase.normalized.json",
        2: "set-data-list-number-decrease.normalized.json",
        3: "set-data-list-number-multiply.normalized.json",
        4: "set-data-list-number-divide.normalized.json",
      };
      writeJson(path.join(args.outDir, names[code]), { ...node, mappings: [mapping] });
    }
  }
  console.log(JSON.stringify(summary, null, 2));
}

main();
