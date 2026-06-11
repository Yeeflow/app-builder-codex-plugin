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
    "  node scripts/inspect-workflow-claim-tasks.mjs <input.yap> --out-dir <normalized-dir>",
    "",
    "Decodes a Yeeflow .yap read-only and writes redacted Claim Task normalized references.",
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

function parseJson(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function decodeYap(inputPath) {
  const largeNumbers = new Set();
  const wrapper = parseJson(fs.readFileSync(inputPath, "utf8"), largeNumbers);
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input Resource must start with ${GZIP_PREFIX}`);
  }
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const resource = parseJson(resourceText, largeNumbers);
  const data = parseJson(resource.Data, largeNumbers);
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

function redactText(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(EMAIL_RE, "<REDACTED_EMAIL>")
    .replace(/User:\s*[^<,\"]+/g, "User: <REDACTED_USER>")
    .replace(/Job position:\s*[^<,\"]+/g, "Job position: <REDACTED_POSITION>")
    .replace(PRIVATE_NUMBER_RE, "<REDACTED_PRIVATE_ID>");
}

function placeholderForKey(key) {
  if (/tenant/i.test(key)) return "<REDACTED_TENANT_ID>";
  if (/group/i.test(key)) return "<REDACTED_USER_GROUP_ID>";
  if (/department|org/i.test(key)) return "<REDACTED_DEPARTMENT_ID>";
  if (/location/i.test(key)) return "<REDACTED_LOCATION_ID>";
  if (/position/i.test(key)) return "<REDACTED_POSITION_ID>";
  if (/email|mail/i.test(key)) return "<REDACTED_EMAIL>";
  if (/form|taskurl|page/i.test(key)) return "<REDACTED_TASK_FORM_ID>";
  if (/flow|node|resource/i.test(key)) return "<REDACTED_WORKFLOW_NODE_ID>";
  return "<REDACTED_USER_ID>";
}

function redactScalar(value, key = "") {
  if (typeof value !== "string") return value;
  if (/^\d{8,}$/.test(value) || /id|url|key|position|group|tenant|user|department|location/i.test(key)) {
    return placeholderForKey(key);
  }
  return redactText(value);
}

function decodeHtml(value) {
  return String(value)
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function expressionHints(value) {
  if (typeof value !== "string") return null;
  const decoded = decodeHtml(value);
  const label = (decoded.match(/\bvalue="([^"]*)"/) || [])[1] || "";
  const hints = [];
  if (/usergroup/.test(decoded)) hints.push("user-group");
  if (/listitem/.test(decoded)) hints.push("list-item-context");
  if (/CreatedBy/.test(decoded)) hints.push("created-by");
  if (/ApplicantUserID/.test(decoded)) hints.push("applicant");
  if (/LineManager/.test(decoded)) hints.push("line-manager");
  if (/position/.test(decoded)) hints.push("position");
  if (/Manager/.test(decoded) && /org/.test(decoded)) hints.push("department-manager");
  if (!decoded.includes("<input")) return null;
  return {
    shape: "html-expression-button",
    label: redactText(label),
    sourceHints: hints,
  };
}

function redactAssignment(entry) {
  if (!isObject(entry)) return { shape: "invalid-entry" };
  const valueExpression = expressionHints(entry.value);
  return {
    type: entry.type || "unknown",
    method: entry.method || "unknown",
    title: redactText(entry.title || ""),
    value: valueExpression || redactScalar(entry.value || "", entry.method || entry.type || "value"),
    position: entry.position ? "<REDACTED_POSITION_ID>" : undefined,
    sourceCategory: classifyAssignment(entry),
  };
}

function classifyAssignment(entry) {
  const method = entry?.method || "";
  const value = `${entry?.value || ""} ${entry?.title || ""}`;
  if (method === "direct") return "static-user";
  if (/usergroup/.test(value)) return "user-group-expression";
  if (/listitem|CreatedBy/.test(value)) return "list-field-expression";
  if (/ApplicantUserID|Applicant/.test(value)) return "applicant-context-expression";
  if (entry?.type === "position" || method.includes("position")) return "position";
  if (method === "expression") return "expression";
  return "unknown";
}

function summarizeClaimTask(form, def, shape, pageMap) {
  const props = shape.properties || {};
  const assignments = asArray(props.usertaskassignment);
  return {
    proofLevel: "export-proven",
    workflowHost: workflowHost(form.WorkflowType ?? def.workflowType),
    workflowType: form.WorkflowType ?? def.workflowType,
    internalControlType: "CandidateTask",
    nodeId: "<REDACTED_WORKFLOW_NODE_ID>",
    nodeName: redactText(props.name || ""),
    taskTitlePresent: props.displayname !== undefined,
    taskForm: {
      taskurl: props.taskurl ? "<REDACTED_TASK_FORM_ID>" : "",
      resolvedTitle: props.taskurl ? redactText(pageMap.get(props.taskurl)?.title || "") : "",
      resolvedType: pageMap.get(props.taskurl)?.type === 2 ? "task-form" : "unknown",
    },
    taskType: props.tasktype || "approval/default-or-unspecified",
    taskTypeTrailingSpacePresent: Object.prototype.hasOwnProperty.call(props, "tasktype "),
    receiverConfigField: "properties.usertaskassignment",
    receiverCount: assignments.length,
    receiverSources: assignments.map(redactAssignment),
    dueDate: {
      duedatetype: props.duedatetype || null,
      duedatedefinition: props.duedatedefinition ?? null,
      duedateexpress: props.duedateexpress ? "expression-button-or-rich-text" : null,
      isfromworkcalendar: props.isfromworkcalendar ?? null,
      notifyrulesShape: props.notifyrules === undefined ? "absent" : Array.isArray(props.notifyrules) ? `array(${props.notifyrules.length})` : typeof props.notifyrules,
    },
    email: {
      isenabledemail: props.isenabledemail === true,
      hasTo: props.to !== undefined,
      hasSubject: props.subject !== undefined,
      hasHtml: props.html !== undefined,
      toExpression: expressionHints(props.to),
      subjectShape: props.subject ? "rich-text-or-expression" : "absent",
      htmlShape: props.html ? "rich-html-or-expression" : "absent",
    },
    quickCompletion: {
      disablequickapproval: props.disablequickapproval ?? null,
    },
    files: {
      hasFilesList: !!props.files?.list,
      hasFilesVariables: !!props.files?.variables,
    },
    flow: {
      incomingCount: asArray(shape.incoming).length,
      outgoingCount: asArray(shape.outgoing).length,
    },
  };
}

function workflowHost(workflowType) {
  if (Number(workflowType) === 2) return "approval-form-workflow";
  if (Number(workflowType) === 1) return "data-list-workflow";
  if (Number(workflowType) === 3) return "scheduled-workflow";
  return "unknown-workflow";
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function main() {
  const args = parseArgs(process.argv);
  const { data } = decodeYap(args.input);
  const claimTasks = [];
  const comparison = [];
  for (const form of asArray(data.Forms)) {
    const def = safeJson(form.DefResource);
    const pages = new Map(asArray(def.pageurls).map((page) => [page.id, page]));
    const shapes = asArray(def.childshapes || def.childShapes);
    for (const shape of shapes) {
      const type = stencilId(shape);
      if (type === "CandidateTask") claimTasks.push(summarizeClaimTask(form, def, shape, pages));
      if (type === "CandidateTask" || type === "MultiAssignmentTask") {
        comparison.push({
          proofLevel: "export-proven",
          workflowHost: workflowHost(form.WorkflowType ?? def.workflowType),
          internalControlType: type,
          nodeId: "<REDACTED_WORKFLOW_NODE_ID>",
          nodeName: redactText(shape.properties?.name || ""),
          taskurlPresent: !!shape.properties?.taskurl,
          taskType: shape.properties?.tasktype || "approval/default-or-unspecified",
          receiverOrAssigneeCount: asArray(shape.properties?.usertaskassignment).length,
          assignmentField: "properties.usertaskassignment",
          emailEnabled: shape.properties?.isenabledemail === true,
          dueDateType: shape.properties?.duedatetype || null,
          filesListPresent: !!shape.properties?.files?.list,
        });
      }
    }
  }

  if (!claimTasks.length) throw new Error("No CandidateTask nodes found.");

  const inventory = {
    sourceExport: path.basename(args.input),
    proofLevel: "export-proven",
    claimTaskCount: claimTasks.length,
    workflowHosts: [...new Set(claimTasks.map((task) => task.workflowHost))],
    claimTasks,
    assignmentTaskComparisonShape: comparison,
  };
  writeJson(path.join(args.outDir, "claim-task-inventory.normalized.json"), inventory);

  const firstApproval = claimTasks.find((task) => task.workflowHost === "approval-form-workflow");
  const firstDataList = claimTasks.find((task) => task.workflowHost === "data-list-workflow");
  const groupReceiver = claimTasks.find((task) => task.receiverSources.some((source) => source.sourceCategory === "user-group-expression"));
  const directReceiver = claimTasks.find((task) => task.receiverSources.some((source) => source.sourceCategory === "static-user"));
  const listFieldReceiver = claimTasks.find((task) => task.receiverSources.some((source) => source.sourceCategory === "list-field-expression"));
  const dueDate = claimTasks.find((task) => task.dueDate.duedatetype);
  const email = claimTasks.find((task) => task.email.isenabledemail);
  const approvalTaskForm = claimTasks.find((task) => task.taskType === "approve");
  const completeTaskForm = claimTasks.find((task) => task.taskType === "complete");

  const examples = [
    ["claim-task-approval-workflow-basic.normalized.json", firstApproval],
    ["claim-task-data-list-workflow-basic.normalized.json", firstDataList],
    ["claim-task-receiver-user-group.normalized.json", groupReceiver],
    ["claim-task-receiver-direct-user.normalized.json", directReceiver],
    ["claim-task-receiver-expression.normalized.json", listFieldReceiver || groupReceiver],
    ["claim-task-taskform-approval-task.normalized.json", approvalTaskForm],
    ["claim-task-taskform-complete-task.normalized.json", completeTaskForm],
    ["claim-task-due-date.normalized.json", dueDate],
    ["claim-task-email-notification.normalized.json", email],
  ];
  for (const [filename, example] of examples) {
    if (example) writeJson(path.join(args.outDir, filename), example);
  }

  console.log(JSON.stringify({
    claimTaskCount: claimTasks.length,
    workflowHosts: inventory.workflowHosts,
    outputDir: args.outDir,
  }, null, 2));
}

main();
