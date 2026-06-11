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
    "  node scripts/inspect-workflow-set-variable-actions.mjs <input.yap> --out-dir <normalized-dir>",
    "",
    "Decodes a Yeeflow .yap read-only and writes redacted Set variable normalized references.",
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
  return { wrapper, resource, data };
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

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stencilId(shape) {
  return shape?.stencil?.id || shape?.stencil || shape?.type || "unknown";
}

function shapeId(shape) {
  return String(shape?.resourceid || shape?.resourceId || shape?.id || "");
}

function workflowHost(workflowType) {
  if (String(workflowType) === "1") return "data-list-workflow";
  if (String(workflowType) === "2") return "approval-form-workflow";
  if (String(workflowType) === "3") return "scheduled-workflow";
  return "unknown-workflow";
}

function redactText(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(EMAIL_RE, "<REDACTED_EMAIL>")
    .replace(PRIVATE_NUMBER_RE, "<REDACTED_PRIVATE_ID>");
}

function redactExpressionToken(token) {
  if (Array.isArray(token)) return token.map(redactExpressionToken);
  if (!isObject(token)) return redactText(token);
  const out = {};
  for (const [key, value] of Object.entries(token)) {
    if (/id|idx|prop/i.test(key) && typeof value === "string" && /^\d{8,}$/.test(value)) {
      out[key] = "<REDACTED_ID>";
    } else if (/^name$/.test(key)) {
      out[key] = redactText(value);
    } else if (/value/.test(key) && typeof value === "string") {
      out[key] = redactText(value);
    } else {
      out[key] = redactExpressionToken(value);
    }
  }
  return out;
}

function summarizeValueExpression(value) {
  const tokens = asArray(value);
  const tokenTypes = new Set();
  const exprTypes = new Set();
  const funcs = new Set();
  const refs = [];
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!isObject(node)) return;
    if (node.type) tokenTypes.add(node.type);
    if (node.exprType) exprTypes.add(node.exprType);
    if (node.func) funcs.add(node.func);
    if (node.exprType || node.name) {
      refs.push({
        exprType: node.exprType || "",
        valueType: node.valueType || "",
        name: redactText(node.name || ""),
        prop: node.prop ? "<REDACTED_FIELD_REF>" : undefined,
      });
    }
    for (const child of Object.values(node)) visit(child);
  };
  visit(tokens);
  return {
    shape: "expression-token-array",
    tokenTypes: [...tokenTypes].sort(),
    exprTypes: [...exprTypes].sort(),
    functions: [...funcs].sort(),
    references: refs,
    redactedTokens: redactExpressionToken(tokens),
  };
}

function summarizeVariableSetting(entry) {
  return {
    idx: "<REDACTED_VARIABLE_IDX>",
    id: entry?.id || "",
    name: redactText(entry?.name || ""),
    type: entry?.type || "",
    editable: entry?.editable,
    value: summarizeValueExpression(entry?.value),
  };
}

function summarizeSetVariable(form, def, shape) {
  const props = shape.properties || {};
  const settings = asArray(props.variablesetting);
  const data = isObject(props.data) ? props.data : null;
  const hasListFieldValue = settings.some((entry) => JSON.stringify(entry?.value || "").includes("\"exprType\":\"list_field\""));
  const hasWorkflowVariableValue = settings.some((entry) => JSON.stringify(entry?.value || "").includes("\"exprType\":\"variable\""));
  const hasStaticValue = settings.some((entry) => JSON.stringify(entry?.value || "").includes("\"type\":\"str\"") || JSON.stringify(entry?.value || "").includes("\"type\":\"num\""));
  return {
    proofLevel: "export-proven",
    workflowHost: workflowHost(form.WorkflowType ?? def.workflowType),
    workflowType: form.WorkflowType ?? def.workflowType,
    internalControlType: "SetVariableTask",
    nodeId: "<REDACTED_WORKFLOW_NODE_ID>",
    nodeName: redactText(props.name || ""),
    formtype: props.formtype || "",
    target: props.formtype === "custom" ? {
      kind: "another-approval-workflow",
      data: data ? {
        AppID: data.AppID ? "<REDACTED_APP_ID>" : "",
        ListSetID: data.ListSetID ? "<REDACTED_APP_LISTSET_ID>" : "",
        ProcKey: data.ProcKey || "",
      } : null,
      formids: props.formids ? "<REDACTED_TARGET_FORM_ID>" : "",
      formidsShape: props.formids ? "literal-or-expression-string" : "empty",
    } : {
      kind: "current-workflow",
      data: data === null ? null : data,
      formids: props.formids || "",
    },
    variablesSetCount: settings.length,
    variableTypes: [...new Set(settings.map((entry) => entry?.type || "").filter(Boolean))].sort(),
    valueExpressionKinds: {
      hasStaticValue,
      hasWorkflowVariableValue,
      hasListFieldValue,
    },
    variablesetting: settings.map(summarizeVariableSetting),
    incomingCount: asArray(shape.incoming).length,
    outgoingCount: asArray(shape.outgoing).length,
  };
}

function buildVariableIndex(data) {
  const out = {};
  for (const form of asArray(data.Forms)) {
    const def = safeJson(form.DefResource, {});
    out[form.Key] = {
      formName: form.Name,
      workflowType: form.WorkflowType,
      variables: Object.fromEntries(Object.entries(def.variables || {}).map(([key, value]) => [
        key,
        asArray(value).map((entry) => ({
          idx: "<REDACTED_VARIABLE_IDX>",
          id: entry.id,
          name: redactText(entry.name || ""),
          type: entry.type,
          editable: entry.editable,
        })),
      ])),
    };
  }
  return out;
}

function buildListFieldIndex(data) {
  return asArray(data.Childs).map((child) => ({
    title: redactText(child.ListModel?.Title || ""),
    listId: "<REDACTED_LIST_ID>",
    type: child.ListModel?.Type,
    fields: asArray(child.Defs).map((field) => ({
      FieldName: field.FieldName,
      InternalName: field.InternalName,
      DisplayName: redactText(field.DisplayName || ""),
      FieldID: "<REDACTED_FIELD_ID>",
      Type: field.Type,
    })),
  }));
}

function collectSetVariables(data) {
  const entries = [];
  for (const form of asArray(data.Forms)) {
    const def = safeJson(form.DefResource, {});
    for (const shape of asArray(def.childshapes)) {
      if (stencilId(shape) !== "SetVariableTask") continue;
      entries.push(summarizeSetVariable(form, def, shape));
    }
  }
  return entries;
}

function writeJson(outDir, fileName, value) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  const args = parseArgs(process.argv);
  const { data } = decodeYap(args.input);
  const setVariables = collectSetVariables(data);
  const currentSingle = setVariables.find((entry) => entry.formtype === "current" && entry.variablesSetCount === 1);
  const currentMultiple = setVariables.find((entry) => entry.formtype === "current" && entry.variablesSetCount > 1);
  const anotherWorkflow = setVariables.find((entry) => entry.formtype === "custom");
  const listFieldValue = setVariables.find((entry) => entry.valueExpressionKinds.hasListFieldValue);
  const workflowValue = setVariables.find((entry) => entry.valueExpressionKinds.hasWorkflowVariableValue);
  const fixedValue = setVariables.find((entry) => entry.valueExpressionKinds.hasStaticValue);
  const anotherMultiple = setVariables.find((entry) => entry.formtype === "custom" && entry.variablesSetCount > 1);

  writeJson(args.outDir, "set-variable-inventory.normalized.json", {
    proofLevel: "export-proven",
    setVariableTaskCount: setVariables.length,
    workflowHosts: [...new Set(setVariables.map((entry) => entry.workflowHost))],
    variablesByForm: buildVariableIndex(data),
    listFields: buildListFieldIndex(data),
    nodes: setVariables,
  });
  const candidates = [
    ["set-variable-current-workflow-single.normalized.json", currentSingle],
    ["set-variable-current-workflow-multiple.normalized.json", currentMultiple],
    ["set-variable-another-approval-workflow.normalized.json", anotherWorkflow],
    ["set-variable-another-workflow-formid-expression.normalized.json", anotherWorkflow],
    ["set-variable-another-workflow-multiple.normalized.json", anotherMultiple],
    ["set-variable-value-expression-list-field.normalized.json", listFieldValue],
    ["set-variable-value-expression-variable.normalized.json", workflowValue],
    ["set-variable-value-expression-fixed.normalized.json", fixedValue],
  ];
  for (const [fileName, value] of candidates) {
    if (value) writeJson(args.outDir, fileName, value);
  }
  console.log(JSON.stringify({
    setVariableTaskCount: setVariables.length,
    workflowHosts: [...new Set(setVariables.map((entry) => entry.workflowHost))],
    outputDir: args.outDir,
  }, null, 2));
}

main();
