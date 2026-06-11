#!/usr/bin/env node

import fs from "fs";
import path from "path";
import zlib from "zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

function usage() {
  console.error("Usage: node scripts/inspect-scheduled-workflows.mjs <app.yap|decoded-app.json> --out-dir <dir>");
  process.exit(1);
}

function parseArgs(argv) {
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
        out += LARGE_INTEGER_RE.test(token) ? `"${token}"` : token;
        if (LARGE_INTEGER_RE.test(token)) largeNumbers.add(token);
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function decodeInput(inputPath) {
  const largeNumbers = new Set();
  const raw = fs.readFileSync(inputPath, "utf8");
  const parsed = parseJson(raw, largeNumbers);
  if (typeof parsed.Resource === "string" && parsed.Resource.startsWith(GZIP_PREFIX)) {
    const resourceText = zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
    const resource = parseJson(resourceText, largeNumbers);
    const data = parseJson(resource.Data, largeNumbers);
    return { data, resource, wrapper: parsed, largeNumbers: [...largeNumbers] };
  }
  return { data: parsed, resource: null, wrapper: null, largeNumbers: [...largeNumbers] };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
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

function redactText(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(EMAIL_RE, "<REDACTED_EMAIL>")
    .replace(/\b\d{16,}\b/g, "<REDACTED_PRIVATE_ID>");
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return redactText(value);
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (/tenant|publisher|createdby|modifiedby|userid|workspaceid/i.test(key)) {
      out[key] = `<REDACTED_${key.toUpperCase()}>`;
    } else {
      out[key] = redact(child);
    }
  }
  return out;
}

function shapeType(shape) {
  return shape?.stencil?.id || shape?.stencil || shape?.type || "unknown";
}

function expressionLabel(value) {
  if (typeof value !== "string" || !value.includes("<input")) return null;
  const decoded = value
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  return (decoded.match(/\bvalue="([^"]*)"/) || [])[1] || "expression-button";
}

function expressionContextHints(value) {
  if (typeof value !== "string") return [];
  const hints = new Set();
  if (/application|Applicant|ApplicantUserID|FlowNo/.test(value)) hints.add("approval-or-application-context");
  if (/listitem|____customListFields|Created By/.test(value)) hints.add("data-list-item-context");
  if (/variable|Workflow Variables/.test(value)) hints.add("workflow-variable-context");
  if (/task|AssigneeID|TaskURL|Current Task Context/.test(value)) hints.add("task-context");
  if (/usergroup/.test(value)) hints.add("user-group-reference");
  if (/position/.test(value)) hints.add("position-reference");
  return [...hints].sort();
}

function summarizeStartAction(shape) {
  const props = shape.properties || {};
  return {
    id: "<REDACTED_WORKFLOW_NODE_ID>",
    resourceid: "<REDACTED_WORKFLOW_NODE_ID>",
    type: "StartNoneEvent",
    name: props.name || "Start",
    graph: {
      incoming: asArray(shape.incoming).length,
      outgoing: asArray(shape.outgoing).length,
    },
    fieldPresence: {
      taskurl: props.taskurl !== undefined,
      terminate: props.terminate !== undefined,
      terminateConditions: props["terminate-conditions"] !== undefined,
      revokeConditions: props["revoke-conditions"] !== undefined,
      isenabledemail: props.isenabledemail !== undefined,
      to: props.to !== undefined,
      subject: props.subject !== undefined,
      html: props.html !== undefined,
    },
    settingsShape: {
      isenabledemail: props.isenabledemail ?? null,
      terminate: props.terminate ?? null,
      terminateConditions: Array.isArray(props["terminate-conditions"]) ? `array(${props["terminate-conditions"].length})` : props["terminate-conditions"] ?? null,
      revokeConditions: Array.isArray(props["revoke-conditions"]) ? `array(${props["revoke-conditions"].length})` : props["revoke-conditions"] ?? null,
      to: props.to ? {
        expressionLabel: expressionLabel(props.to),
        contextHints: expressionContextHints(props.to),
      } : null,
      subject: props.subject ? {
        expressionLabel: expressionLabel(props.subject),
        contextHints: expressionContextHints(props.subject),
      } : null,
      html: props.html ? {
        redactedShape: "rich-text-html",
        contextHints: expressionContextHints(props.html),
      } : null,
      taskurl: props.taskurl ? "<REDACTED_TASK_FORM_PAGE_ID>" : null,
    },
  };
}

function summarizeAssignmentTask(shape) {
  const props = shape.properties || {};
  const assignments = asArray(props.usertaskassignment);
  return {
    id: "<REDACTED_WORKFLOW_NODE_ID>",
    resourceid: "<REDACTED_WORKFLOW_NODE_ID>",
    type: "MultiAssignmentTask",
    name: props.name || "Assignment Task",
    graph: {
      incoming: asArray(shape.incoming).length,
      outgoing: asArray(shape.outgoing).length,
    },
    fieldPresence: {
      usertaskassignment: props.usertaskassignment !== undefined,
      tasktype: props.tasktype !== undefined,
      approveway: props.approveway !== undefined,
      approvepercentage: props.approvepercentage !== undefined,
      issequential: props.issequential !== undefined,
      duedatedefinition: props.duedatedefinition !== undefined,
      duedatetype: props.duedatetype !== undefined,
      notifyrules: props.notifyrules !== undefined,
      isenabledemail: props.isenabledemail !== undefined,
      taskurl: props.taskurl !== undefined,
    },
    settingsShape: {
      tasktype: props.tasktype ?? null,
      approveway: props.approveway ?? null,
      approvepercentage: props.approvepercentage ?? null,
      appointedOrder: props.issequential === true ? "sequential" : "parallel-or-default",
      issequential: props.issequential ?? null,
      isenabledemail: props.isenabledemail ?? null,
      duedatedefinition: props.duedatedefinition ?? null,
      duedatetype: props.duedatetype ?? null,
      notifyrules: Array.isArray(props.notifyrules) ? `array(${props.notifyrules.length})` : props.notifyrules ?? null,
      taskurl: props.taskurl ? "<REDACTED_TASK_FORM_PAGE_ID>" : null,
    },
    assigneeShape: {
      count: assignments.length,
      entryFieldNames: assignments.map((entry) => Object.keys(entry || {})),
      entries: assignments.map((entry) => ({
        type: entry?.type || null,
        method: entry?.method || null,
        hasValue: entry?.value !== undefined,
        hasPosition: entry?.position !== undefined,
        valueShape: entry?.value ? {
          expressionLabel: expressionLabel(entry.value),
          contextHints: expressionContextHints(entry.value),
          redactedReference: expressionLabel(entry.value) ? "expression-button" : "<REDACTED_ASSIGNEE_REFERENCE>",
        } : null,
        position: entry?.position ? "<REDACTED_POSITION_ID>" : null,
        title: entry?.title ? "<REDACTED_ASSIGNEE_LABEL>" : null,
      })),
    },
  };
}

function summarizeActions(def) {
  return asArray(def.childshapes).map((shape) => {
    const props = shape.properties || {};
    const type = shapeType(shape);
    const base = {
      id: shape.id || null,
      resourceid: shape.resourceid || null,
      type,
      name: props.name || null,
    };
    if (type === "MailTask") {
      return {
        ...base,
        to: redactText(props.to || ""),
        cc: redactText(props.cc || ""),
        subject: redactText(props.subject || ""),
        html: redactText(props.html || ""),
      };
    }
    if (type === "QueryData") {
      return {
        ...base,
        listid: props.listid || null,
        listsetid: props.listsetid || null,
        result: redact(props.result || null),
        filters: redact(props.filters || []),
        sorts: redact(props.sorts || props.datasource || []),
      };
    }
    if (type === "AI") {
      return {
        ...base,
        aiType: props.type || null,
        data: redact(props.data || null),
        inputVariables: redact(props.inputVariables || []),
        outputVariables: redact(props.outputVariables || []),
        context: redact(props.context || null),
      };
    }
    return base;
  });
}

function summarizeScheduledWorkflow(form) {
  const def = safeJson(form.DefResource, {});
  const startActions = asArray(def.childshapes).filter((shape) => shapeType(shape) === "StartNoneEvent").map(summarizeStartAction);
  const assignmentTasks = asArray(def.childshapes).filter((shape) => shapeType(shape) === "MultiAssignmentTask").map(summarizeAssignmentTask);
  const expressionContextHintsFound = [...new Set([
    ...startActions.flatMap((start) => [
      ...asArray(start.settingsShape.to?.contextHints),
      ...asArray(start.settingsShape.subject?.contextHints),
      ...asArray(start.settingsShape.html?.contextHints),
    ]),
    ...assignmentTasks.flatMap((task) => task.assigneeShape.entries.flatMap((entry) => asArray(entry.valueShape?.contextHints))),
  ])].sort();
  return {
    name: form.Name || null,
    key: form.Key || null,
    procModelId: form.ProcModelID || null,
    listId: form.ListID,
    workflowType: form.WorkflowType,
    deployed: form.Deployed,
    settings: redact(safeJson(form.Settings, {})),
    def: {
      defkey: def.defkey || null,
      workflowType: def.workflowType || null,
      appListSetId: def.AppListSetID || null,
      variables: redact(def.variables || {}),
      pageurls: asArray(def.pageurls).map((page) => ({ id: page.id || null, title: page.title || page.name || null, pagetype: page.pagetype || null })),
      actions: summarizeActions(def),
      startActions,
      assignmentTasks,
      expressionContextHintsFound,
    },
  };
}

function summarizeAgents(data) {
  const module = asArray(data.OtherModules).find((entry) => entry.Type === "Agents");
  return asArray(module?.Data).map((item) => ({
    id: item.ID,
    name: item.Name,
    type: item.Type,
    status: item.Status,
    isPublished: item.IsPublished,
    settings: redact(safeJson(item.Settings, {})),
    components: asArray(item.Components).map((component) => ({
      id: component.ID,
      type: component.Type,
      subType: component.SubType,
      name: component.Name,
      description: component.Description,
      settings: redact(safeJson(component.Settings, {})),
    })),
  }));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const args = parseArgs(process.argv);
const { data, resource, wrapper, largeNumbers } = decodeInput(args.input);
const workflows = asArray(data.Forms).filter((form) => String(form.WorkflowType) === "3").map(summarizeScheduledWorkflow);
const actions = workflows.flatMap((workflow) => workflow.def.actions.map((action) => ({ workflow: workflow.name, workflowKey: workflow.key, ...action })));
const agents = summarizeAgents(data);
const listResources = asArray(data.Childs).map((child) => ({
  title: child.ListModel?.Title || null,
  listId: child.ListModel?.ListID || null,
  type: child.ListModel?.Type || null,
  fields: asArray(child.Defs).map((field) => ({
    fieldId: field.FieldID,
    fieldName: field.FieldName,
    displayName: field.DisplayName,
    type: field.Type,
    fieldType: field.FieldType,
  })),
}));

const summary = {
  inputPath: path.resolve(args.input),
  title: wrapper?.Title || data.Item?.ListModel?.Title || null,
  replaceIds: asArray(resource?.ReplaceIds).length,
  largeNumbersPreserved: largeNumbers.length,
  scheduledWorkflows: workflows.length,
  aiResources: agents.length,
  localLists: listResources.length,
  actionCounts: actions.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    return acc;
  }, {}),
};

writeJson(path.join(args.outDir, "scheduled-workflow-reference.normalized.json"), { summary, workflows, listResources });
writeJson(path.join(args.outDir, "workflow-send-email-action-reference.normalized.json"), { summary, actions: actions.filter((action) => action.type === "MailTask") });
writeJson(path.join(args.outDir, "workflow-query-data-action-reference.normalized.json"), { summary, actions: actions.filter((action) => action.type === "QueryData") });
writeJson(path.join(args.outDir, "workflow-ai-assistant-action-reference.normalized.json"), { summary, actions: actions.filter((action) => action.type === "AI") });
writeJson(path.join(args.outDir, "ai-agent-workflow-invocation-reference.normalized.json"), { summary, agents, aiActions: actions.filter((action) => action.type === "AI") });

console.log(JSON.stringify({ status: "pass", ...summary }, null, 2));
