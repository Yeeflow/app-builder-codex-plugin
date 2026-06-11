#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

function usage(exitCode = 1) {
  const message = [
    "Usage:",
    "  node scripts/inspect-data-list-workflow-actions.mjs <input.ydl> --out <normalized-dir>",
    "",
    "Decodes a Yeeflow .ydl read-only and writes redacted normalized data-list workflow action references.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(message);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, out: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") args.out = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input || !args.out) usage();
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

function decodeYdl(inputPath) {
  const largeNumbers = new Set();
  const wrapper = parseJsonPreservingLargeInts(fs.readFileSync(inputPath, "utf8"), largeNumbers);
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input Resource must start with ${GZIP_PREFIX}`);
  }
  const resource = parseJsonPreservingLargeInts(
    zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"),
    largeNumbers,
  );
  const data = parseJsonPreservingLargeInts(resource.Data, largeNumbers);
  return { wrapper, data, largeNumbers: [...largeNumbers].sort() };
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

function decodeHtml(value) {
  return String(value || "")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function expressionLabels(value) {
  const decoded = decodeHtml(value);
  return [...decoded.matchAll(/\bvalue="([^"]*)"/g)].map((match) => match[1]);
}

function expressionCategory(value) {
  const text = decodeHtml(value);
  if (/type\\":\\"listitem\\"|type":"listitem"|List field/i.test(text)) {
    if (/CreatedBy|Created By/i.test(text)) return "created-by-list-field-expression";
    return "data-list-field-expression";
  }
  if (/type":"usergroup"|type&quot;:&quot;usergroup/i.test(text)) return "user-group-expression";
  if (/Applicant:Line Manager/i.test(text)) return "applicant-line-manager-expression";
  return value ? "expression-button" : "none";
}

function fieldKind(field) {
  if (field?.FieldName === "Title" || field?.Status === 0 || field?.IsSystem === true) return "default-native";
  return "custom";
}

function walkControls(control, visitor, pointer = "$") {
  if (!isObject(control)) return;
  visitor(control, pointer);
  for (const childKey of ["children", "columns"]) {
    if (!Array.isArray(control[childKey])) continue;
    control[childKey].forEach((child, index) => walkControls(child, visitor, `${pointer}.${childKey}[${index}]`));
  }
}

function redactTaskAssignment(entry) {
  return {
    type: entry?.type || null,
    method: entry?.method || null,
    value: entry?.method === "direct" ? "<REDACTED_USER_ID>" : "<REDACTED_EXPRESSION_BUTTON>",
    sourceCategory: entry?.method === "direct" ? "static-direct-user" : expressionCategory(entry?.value),
    labels: expressionLabels(entry?.value).map((label) => label.replace(/^Sample Group:.+$/i, "<REDACTED_USER_GROUP_LABEL>")),
    title: "<REDACTED_ASSIGNEE_LABEL>",
  };
}

function parseDefResource(form) {
  if (isObject(form.DefResource)) return form.DefResource;
  if (typeof form.DefResource !== "string") return null;
  return JSON.parse(form.DefResource);
}

function inspect(data, inputPath, largeNumbers) {
  const resourceItems = [data.Item, ...asArray(data.Childs)].filter(Boolean);
  const listItemsById = new Map(resourceItems.map((item) => [String(item.ListModel?.ListID || ""), item]));
  const fields = resourceItems.flatMap((item) => asArray(item.Defs).map((field) => ({
    listTitle: item.ListModel?.Title || null,
    listId: "<REDACTED_LIST_ID>",
    field: field.FieldName || null,
    internalName: field.InternalName || null,
    display: field.DisplayName || field.Title || null,
    fieldType: field.FieldType || null,
    controlType: field.Type || null,
    kind: fieldKind(field),
    fieldId: "<REDACTED_FIELD_ID>",
  })));
  const workflows = [];
  for (const [formIndex, form] of asArray(data.Forms).entries()) {
    const def = parseDefResource(form);
    if (!def) continue;
    if (form.WorkflowType !== 1) continue;
    const hostList = listItemsById.get(String(form.ListID || ""));
    const starts = [];
    const assignmentTasks = [];
    for (const [nodeIndex, shape] of asArray(def.childshapes).entries()) {
      const props = shape.properties || {};
      if (stencilId(shape) === "StartNoneEvent") {
        starts.push({
          nodeIndex,
          nodeId: "<REDACTED_WORKFLOW_NODE_ID>",
          fields: Object.keys(props).sort(),
          hasTerminate: Object.prototype.hasOwnProperty.call(props, "terminate"),
          hasTerminateConditions: Object.prototype.hasOwnProperty.call(props, "terminate-conditions"),
          hasRecallConditions: Object.prototype.hasOwnProperty.call(props, "revoke-conditions"),
          email: {
            isenabledemail: props.isenabledemail ?? null,
            to: props.to ? "<REDACTED_START_NOTIFICATION_RECIPIENT_EXPRESSION>" : null,
            toLabels: expressionLabels(props.to),
            subject: props.subject ? "<REDACTED_START_NOTIFICATION_SUBJECT_SHAPE>" : null,
            html: props.html ? "<REDACTED_START_NOTIFICATION_BODY_SHAPE>" : null,
          },
          graph: {
            incoming: asArray(shape.incoming).length,
            outgoing: asArray(shape.outgoing).length,
          },
        });
      }
      if (stencilId(shape) === "MultiAssignmentTask") {
        assignmentTasks.push({
          nodeIndex,
          nodeId: "<REDACTED_WORKFLOW_NODE_ID>",
          fields: Object.keys(props).sort(),
          tasktype: props.tasktype ?? null,
          approveway: props.approveway ?? null,
          approvepercentage: props.approvepercentage ?? null,
          dueDate: {
            duedatedefinition: props.duedatedefinition ?? null,
            duedatetype: props.duedatetype ?? null,
          },
          notification: {
            isenabledemail: props.isenabledemail ?? null,
            to: props.to ? "<CURRENT_TASK_ASSIGNEE_EMAIL_EXPRESSION>" : null,
            notifyrulesCount: asArray(props.notifyrules).length,
          },
          taskurl: props.taskurl ? "<REDACTED_FORM_ID>" : null,
          assignments: asArray(props.usertaskassignment).map(redactTaskAssignment),
        });
      }
    }
    const taskForms = asArray(def.pageurls).map((page, pageIndex) => {
      const controls = [];
      walkControls(page.formdef, (control, pointer) => {
        if (!control?.isListControl) return;
        controls.push({
          pointer,
          type: control.type || null,
          label: control.label || null,
          identifier: control.identifier || null,
          internalName: control.InternalName || null,
          fieldID: "<REDACTED_FIELD_ID>",
          binding: control.binding ? "<CUSTOM_LIST_FIELD_BINDING>" : null,
          readonly: control.readonly ?? control.attrs?.readonly ?? null,
          listFieldKind: control.identifier === "CreatedBy" ? "default-native" : "custom-or-title",
        });
      });
      return {
        pageIndex,
        id: "<REDACTED_FORM_ID>",
        title: page.title || page.formdef?.title || null,
        type: page.type ?? null,
        pagetype: page.pagetype ?? null,
        listFieldControls: controls,
        hasWorkflowControlPanel: JSON.stringify(page.formdef || {}).includes("workflowControlPanel"),
        hasWorkflowHistory: JSON.stringify(page.formdef || {}).includes("workflowHistory"),
      };
    });
    workflows.push({
      formIndex,
      name: form.Name || null,
      key: form.Key || null,
      workflowType: form.WorkflowType,
      listId: "<REDACTED_LIST_ID>",
      hostListTitle: hostList?.ListModel?.Title || null,
      settings: form.Settings ?? null,
      defkey: def.defkey || null,
      shapeCount: asArray(def.childshapes).length,
      starts,
      assignmentTasks,
      taskForms,
    });
  }
  return {
    source: {
      path: path.resolve(inputPath),
      fileName: path.basename(inputPath),
      title: data.Item?.ListModel?.Title || null,
      listId: "<REDACTED_LIST_ID>",
      largeNumericIdsPreservedAsStrings: largeNumbers.length,
    },
    fields,
    flowMappings: resourceItems.flatMap((item) => asArray(item.FlowMappings).map((mapping) => ({
      listTitle: item.ListModel?.Title || null,
      title: mapping.Title || null,
      defKey: mapping.DefKey || null,
      method: mapping.Method ?? null,
      fieldName: mapping.FieldName ?? null,
      setting: typeof mapping.Setting === "string" ? JSON.parse(mapping.Setting) : mapping.Setting,
      listId: "<REDACTED_LIST_ID>",
    }))),
    workflows,
  };
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function main() {
  const args = parseArgs(process.argv);
  const { data, largeNumbers } = decodeYdl(args.input);
  const report = inspect(data, args.input, largeNumbers);
  const outDir = path.resolve(args.out);
  writeJson(path.join(outDir, "data-list-workflow-actions.normalized.json"), report);
  console.log(JSON.stringify({
    status: "pass",
    workflows: report.workflows.length,
    assignmentTasks: report.workflows.reduce((sum, workflow) => sum + workflow.assignmentTasks.length, 0),
    startActions: report.workflows.reduce((sum, workflow) => sum + workflow.starts.length, 0),
    outDir,
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", error: error instanceof Error ? error.message : "unknown error" }, null, 2));
  process.exit(1);
}
