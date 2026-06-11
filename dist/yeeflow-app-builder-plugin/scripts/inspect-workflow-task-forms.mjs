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
    "  node scripts/inspect-workflow-task-forms.mjs <input.yap|input.ywf> --out-dir <normalized-dir>",
    "",
    "Decodes a Yeeflow .yap/.ywf read-only and writes redacted task-form normalized references.",
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

function parseJson(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function decodeInput(inputPath) {
  const largeNumbers = new Set();
  const wrapper = parseJson(fs.readFileSync(inputPath, "utf8"), largeNumbers);
  if (typeof wrapper.Def === "string") {
    const defResource = parseJson(Buffer.from(wrapper.Def, "base64").toString("utf8"), largeNumbers);
    return {
      inputType: "ywf",
      wrapper,
      resource: null,
      data: {
        Forms: [
          {
            Name: wrapper.FlowName || "Approval Form",
            Key: wrapper.FlowKey || "FORM",
            WorkflowType: wrapper.WorkflowType ?? defResource.workflowType ?? 2,
            ListID: 0,
            DefResource: JSON.stringify(defResource),
            Settings: wrapper.Settings ?? null,
          },
        ],
      },
      largeNumbers: [...largeNumbers].sort(),
    };
  }
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input must be a .yap Resource with ${GZIP_PREFIX} or a .ywf Def wrapper`);
  }
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const resource = parseJson(resourceText, largeNumbers);
  const data = parseJson(resource.Data, largeNumbers);
  return { inputType: "yap", wrapper, resource, data, largeNumbers: [...largeNumbers].sort() };
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

function walk(value, visitor, pathParts = []) {
  if (!value || typeof value !== "object") return;
  visitor(value, pathParts);
  if (Array.isArray(value)) {
    value.forEach((child, index) => walk(child, visitor, pathParts.concat(index)));
  } else {
    Object.entries(value).forEach(([key, child]) => walk(child, visitor, pathParts.concat(key)));
  }
}

function redactText(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(EMAIL_RE, "<REDACTED_EMAIL>")
    .replace(PRIVATE_NUMBER_RE, "<REDACTED_PRIVATE_ID>");
}

function redactValue(value, key = "") {
  if (Array.isArray(value)) return value.map((child) => redactValue(child, key));
  if (isObject(value)) {
    const out = {};
    for (const [childKey, childValue] of Object.entries(value)) out[childKey] = redactValue(childValue, childKey);
    return out;
  }
  if (/id$/i.test(key) || /tenant|user|department|location|position|group|email|phone|createdby|modifiedby/i.test(key)) {
    if (typeof value === "string" && value) return placeholderForKey(key);
  }
  return redactText(value);
}

function placeholderForKey(key) {
  if (/form|taskurl|page/i.test(key)) return "<REDACTED_TASK_FORM_ID>";
  if (/workflow|node|resource/i.test(key)) return "<REDACTED_WORKFLOW_NODE_ID>";
  if (/action/i.test(key)) return "<REDACTED_ACTION_ID>";
  if (/control/i.test(key)) return "<REDACTED_CONTROL_ID>";
  if (/user/i.test(key)) return "<REDACTED_USER_ID>";
  if (/group/i.test(key)) return "<REDACTED_USER_GROUP_ID>";
  if (/tenant/i.test(key)) return "<REDACTED_TENANT_ID>";
  if (/email/i.test(key)) return "<REDACTED_EMAIL>";
  return "<REDACTED_PRIVATE_ID>";
}

function controlSummary(control) {
  return {
    type: control.type || "unknown",
    label: redactText(control.label || control.title || ""),
    readonly: control.readonly ?? control.attrs?.readonly ?? null,
    actionBinding: control.controlAction || control.attrs?.control_action ? "<REDACTED_ACTION_ID>" : null,
  };
}

function collectFormControls(formdef) {
  const controls = [];
  walk(formdef, (node) => {
    if (!node?.type || !node.id) return;
    controls.push({
      id: "<REDACTED_CONTROL_ID>",
      type: node.type,
      label: redactText(node.label || node.title || ""),
      readonly: node.readonly ?? node.attrs?.readonly ?? null,
      controlAction: node.attrs?.control_action ? "<REDACTED_ACTION_ID>" : null,
    });
  });
  return controls;
}

function summarizeFormPage(page, index) {
  const formdef = safeJson(page.formdef);
  const controls = collectFormControls(formdef);
  const counts = {};
  for (const control of controls) counts[control.type] = (counts[control.type] || 0) + 1;
  const readonly = controls.filter((control) => control.readonly === true).length;
  const editable = controls.filter((control) => control.readonly === false).length;
  const buttons = controls.filter((control) => control.type === "action_button");
  const hasActionPanel = controls.some((control) => control.type === "workflowControlPanel");
  const hasWorkflowHistory = controls.some((control) => control.type === "workflowHistory");
  const actions = asArray(formdef.actions).map((action) => ({
    id: "<REDACTED_ACTION_ID>",
    name: redactText(action.name || ""),
    stepTypes: asArray(action.steps).map((step) => step.type || "unknown"),
    submitSteps: asArray(action.steps)
      .filter((step) => step.type === "submit")
      .map((step) => submitStepSummary(step)),
  }));
  return {
    pageIndex: index,
    pageId: "<REDACTED_TASK_FORM_ID>",
    title: redactText(page.title || ""),
    pageType: page.type === 1 ? "submission-form" : "task-form",
    rawType: page.type ?? null,
    hasActionPanel,
    hasWorkflowHistory,
    controlCounts: counts,
    readonlyControlCount: readonly,
    editableControlCount: editable,
    actionButtons: buttons.map(controlSummary),
    actions,
  };
}

function submitStepSummary(step) {
  const attrs = step.attrs || {};
  const submitType = attrs.submitType || "default";
  return {
    name: redactText(step.name || ""),
    submitType,
    inferredOperation: inferSubmitOperation(submitType, step.name),
    fieldPresence: {
      comment: attrs.comment !== undefined,
      forword: attrs.forword !== undefined,
      remark: attrs.remark !== undefined,
      assignee: attrs.assignee !== undefined,
    },
    expressionSources: summarizeSubmitExpressions(attrs),
  };
}

function inferSubmitOperation(submitType, name = "") {
  if (submitType === "2") return "reject";
  if (submitType === "4") return "reassign";
  if (submitType === "5") return "add-assignee";
  if (/complete/i.test(name)) return "complete-task";
  return "approve-or-complete-default";
}

function summarizeSubmitExpressions(attrs) {
  const keys = ["comment", "forword", "remark", "assignee"];
  const out = {};
  for (const key of keys) {
    if (attrs[key] === undefined) continue;
    out[key] = asArray(attrs[key]).map((expr) => ({
      exprType: expr.exprType || expr.type || null,
      valueType: expr.valueType || null,
      id: expr.id ? `<${String(expr.id).toUpperCase()}_VARIABLE_REF>` : null,
      name: redactText(expr.name || ""),
    }));
  }
  return out;
}

function stencilId(shape) {
  return shape?.stencil?.id || shape?.stencil || shape?.type || "unknown";
}

function summarizeAssignments(defResource, pages) {
  const pageById = new Map(pages.map((page) => [page.__rawId, page.title]));
  return asArray(defResource.childshapes)
    .filter((shape) => stencilId(shape) === "MultiAssignmentTask")
    .map((shape) => {
      const props = shape.properties || {};
      return {
        nodeId: "<REDACTED_WORKFLOW_NODE_ID>",
        taskName: redactText(props.name || ""),
        taskType: props.tasktype === "complete" ? "complete" : "approval-default",
        taskForm: props.taskurl ? redactText(pageById.get(props.taskurl) || "unresolved") : "missing",
        taskFormId: props.taskurl ? "<REDACTED_TASK_FORM_ID>" : null,
        usertaskassignmentCount: asArray(props.usertaskassignment).length,
        approvalSettings: {
          approveway: props.approveway ?? null,
          approvepercentage: props.approvepercentage ?? null,
          appointedOrder: props.issequential === true ? "sequential" : "parallel-or-default",
        },
        taskOptions: {
          isallowreassign: props.isallowreassign ?? null,
          isallowsign: props.isallowsign ?? null,
          allowskip: props.allowskip ?? null,
        },
        notification: {
          isenabledemail: props.isenabledemail ?? null,
          to: props.to !== undefined,
          subject: props.subject !== undefined,
          html: props.html !== undefined,
        },
      };
    });
}

function normalizePages(defResource) {
  return asArray(defResource.pageurls).map((page, index) => ({
    ...summarizeFormPage(page, index),
    __rawId: page.id,
  }));
}

function writeJson(outDir, filename, value) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, filename), `${JSON.stringify(redactValue(value), null, 2)}\n`);
}

function writeJsonIfAbsent(outDir, filename, value) {
  const target = path.join(outDir, filename);
  if (fs.existsSync(target)) return;
  writeJson(outDir, filename, value);
}

function main() {
  const args = parseArgs(process.argv);
  const decoded = decodeInput(args.input);
  const forms = asArray(decoded.data.Forms);
  const approvalForms = forms.filter((form) => form.WorkflowType === 2 && form.ListID === 0);
  if (!approvalForms.length) throw new Error("No app-level approval form workflows found.");

  const summaries = [];
  for (const form of approvalForms) {
    const defResource = safeJson(form.DefResource);
    const pages = normalizePages(defResource);
    const pagesForOutput = pages.map(({ __rawId, ...page }) => page);
    const assignments = summarizeAssignments(defResource, pages);
    summaries.push({
      formName: redactText(form.Name || form.Key || "Approval Form"),
      formKey: "<REDACTED_FORM_KEY>",
      workflowType: form.WorkflowType,
      submissionForms: pagesForOutput.filter((page) => page.pageType === "submission-form"),
      taskForms: pagesForOutput.filter((page) => page.pageType === "task-form"),
      assignmentTaskAssociations: assignments,
    });
  }

  writeJson(args.outDir, "workflow-task-form-inventory.normalized.json", {
    proofLevel: "export-proven",
    sourceExport: path.basename(args.input),
    inputType: decoded.inputType,
    approvalFormCount: approvalForms.length,
    summaries,
  });

  const first = summaries[0];
  const submission = first.submissionForms[0];
  const taskWithPanel = first.taskForms.find((page) => page.hasActionPanel);
  const taskWithoutPanel = first.taskForms.find((page) => !page.hasActionPanel && page.actionButtons.length);
  const completeTaskForm = first.taskForms.find((page) => page.title === "WARTB Task4") || taskWithoutPanel;

  if (submission?.hasActionPanel) writeJson(args.outDir, "action-panel-submission-form.normalized.json", submission);
  if (taskWithPanel?.hasActionPanel) writeJson(args.outDir, "action-panel-approval-task-form.normalized.json", taskWithPanel);
  if (completeTaskForm) writeJson(args.outDir, "action-panel-complete-task-form.normalized.json", {
    proofLevel: "export-proven-plus-product-documented-button-derivation",
    note: "Complete buttons are derived by task type when a task form uses workflowControlPanel; custom complete button shape is export-proven separately.",
    taskForm: completeTaskForm,
  });
  for (const taskForm of first.taskForms.filter((page) => !page.hasActionPanel && page.actionButtons.length)) {
    for (const action of taskForm.actions) {
      for (const submit of action.submitSteps) {
        let op = submit.inferredOperation;
        if (op === "approve-or-complete-default" && /complete/i.test(taskForm.title)) op = "complete";
        else if (op === "approve-or-complete-default") op = "approve";
        writeJsonIfAbsent(args.outDir, `submit-form-step-${op}.normalized.json`, {
          proofLevel: "export-proven",
          taskForm: taskForm.title,
          actionName: action.name,
          submitStep: submit,
        });
      }
    }
    for (const button of taskForm.actionButtons) {
      const label = String(button.label || "").toLowerCase();
      let op = null;
      if (label.includes("approval") || label.includes("approve")) op = "approve";
      else if (label.includes("reject")) op = "reject";
      else if (label.includes("reassign")) op = "reassign";
      else if (label.includes("add")) op = "add-assignee";
      else if (label.includes("complete")) op = "complete";
      if (op) writeJson(args.outDir, `task-form-custom-button-${op}.normalized.json`, {
        proofLevel: "export-proven",
        taskForm: taskForm.title,
        button,
      });
    }
  }

  console.log(JSON.stringify({
    source: args.input,
    approvalFormCount: approvalForms.length,
    taskForms: summaries.reduce((sum, item) => sum + item.taskForms.length, 0),
    assignmentTaskAssociations: summaries.reduce((sum, item) => sum + item.assignmentTaskAssociations.length, 0),
    outputDirectory: args.outDir,
    generatedFiles: fs.readdirSync(args.outDir).filter((name) => name.endsWith(".json")).sort(),
  }, null, 2));
}

main();
