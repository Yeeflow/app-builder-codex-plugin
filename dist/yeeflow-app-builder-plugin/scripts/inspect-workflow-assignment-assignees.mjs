#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const PRIVATE_NUMBER_RE = /^\d{8,}$/;

function usage(exitCode = 1) {
  const message = [
    "Usage:",
    "  node scripts/inspect-workflow-assignment-assignees.mjs <input.yap> --out <normalized-dir>",
    "",
    "Decodes a Yeeflow .yap read-only and writes redacted normalized assignment-task assignee references.",
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

function decodeYap(inputPath) {
  const largeNumbers = new Set();
  const wrapper = parseJsonPreservingLargeInts(fs.readFileSync(inputPath, "utf8"), largeNumbers);
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input Resource must start with ${GZIP_PREFIX}`);
  }
  const compressed = Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64");
  const resource = parseJsonPreservingLargeInts(zlib.gunzipSync(compressed).toString("utf8"), largeNumbers);
  const data = parseJsonPreservingLargeInts(resource.Data, largeNumbers);
  return { wrapper, resource, data, largeNumbers: [...largeNumbers].sort() };
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
  return String(value)
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractExpressionButton(value) {
  if (typeof value !== "string" || !value.includes("<input") || !value.includes("data=")) return null;
  const decoded = decodeHtml(value);
  const label = (decoded.match(/\bvalue="([^"]*)"/) || [])[1] || "";
  const rawData = extractExpressionDataAttribute(decoded);
  return {
    kind: "expressionButton",
    label,
    dataShape: rawData ? parseExpressionDataShape(rawData) : { parseStatus: "not-found" },
  };
}

function extractExpressionDataAttribute(decodedHtml) {
  const marker = 'data="${';
  const markerIndex = decodedHtml.indexOf(marker);
  if (markerIndex === -1) return null;
  const start = markerIndex + 'data="$'.length;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < decodedHtml.length; i += 1) {
    const ch = decodedHtml[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return decodedHtml.slice(start, i + 1);
    }
  }
  return null;
}

function parseExpressionDataShape(rawData) {
  try {
    const normalized = rawData.trim();
    return sanitizeExpressionData(JSON.parse(normalized));
  } catch {
    return {
      parseStatus: "opaque",
      rawShape: "html-expression-button",
    };
  }
}

function sanitizeExpressionData(value) {
  if (Array.isArray(value)) return value.map(sanitizeExpressionData);
  if (!isObject(value)) {
    if (typeof value === "string" && PRIVATE_NUMBER_RE.test(value)) return placeholderForKey("id");
    return value;
  }
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "id" && typeof child === "string" && child.includes("${")) {
      out[key] = parseNestedExpressionString(child);
    } else if (isPrivateKey(key)) {
      out[key] = placeholderForKey(key);
    } else {
      out[key] = sanitizeExpressionData(child);
    }
  }
  return out;
}

function parseNestedExpressionString(value) {
  let text = String(value).trim();
  if (text.startsWith("${") && text.endsWith("}")) text = text.slice(2, -1).trim();
  try {
    return sanitizeExpressionData(JSON.parse(text));
  } catch {
    try {
      return sanitizeExpressionData(JSON.parse(text.replace(/\\"/g, "\"")));
    } catch {
      return summarizeOpaqueNestedExpression(text);
    }
  }
}

function summarizeOpaqueNestedExpression(text) {
  const props = [...String(text).matchAll(/\\?"prop\\?"\s*:\s*\\?"([^"\\]+)\\?"/g)].map((match) => match[1]);
  const types = [...String(text).matchAll(/\\?"type\\?"\s*:\s*\\?"([^"\\]+)\\?"/g)].map((match) => match[1]);
  return {
    parseStatus: "opaque",
    expressionSourceHints: {
      types,
      props,
      usesApplicantUserId: String(text).includes("ApplicantUserID"),
    },
  };
}

function isPrivateKey(key) {
  return /(tenant|user|department|location|position|manager|email|phone|name|title|account|createdby|modifiedby|id)$/i.test(key);
}

function placeholderForKey(key) {
  if (/tenant/i.test(key)) return "<REDACTED_TENANT_ID>";
  if (/usergroup|user_group|group/i.test(key)) return "<REDACTED_USER_GROUP_ID>";
  if (/department|org/i.test(key)) return "<REDACTED_DEPARTMENT_ID>";
  if (/location/i.test(key)) return "<REDACTED_LOCATION_ID>";
  if (/position/i.test(key)) return "<REDACTED_POSITION_ID>";
  if (/email|mail/i.test(key)) return "<REDACTED_USER_EMAIL>";
  return "<REDACTED_USER_ID>";
}

function redactAssignment(assignment) {
  if (!isObject(assignment)) return assignment;
  const out = {};
  for (const [key, value] of Object.entries(assignment)) {
    if (key === "value" && typeof value === "string") {
      const expression = extractExpressionButton(value);
      out.value = expression || placeholderForKey(classificationReferenceKey(assignment));
    } else if (key === "position") {
      out.position = "<REDACTED_POSITION_ID>";
    } else if (key === "title") {
      out.title = "<REDACTED_ASSIGNEE_LABEL>";
    } else if (isPrivateKey(key) || (typeof value === "string" && PRIVATE_NUMBER_RE.test(value))) {
      out[key] = placeholderForKey(key);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function classificationReferenceKey(assignment) {
  const method = assignment?.method || "";
  if (method.includes("loc")) return "location";
  if (method.includes("org")) return "department";
  if (assignment?.type === "position") return "position";
  return "user";
}

function classifyAssignment(assignment) {
  const type = assignment?.type || "unknown";
  const method = assignment?.method || "unknown";
  const expression = extractExpressionButton(assignment?.value);
  const expressionType = expression?.dataShape?.type || "";
  const expressionProp = expression?.dataShape?.prop || "";
  if (type === "user" && method === "expression" && expressionType === "usergroup") return "user-group";
  if (type === "user" && method === "expression" && expressionType === "position") return "position-all-users-expression";
  if (type === "user" && method === "direct") return "specific-user";
  if (type === "user" && method === "expression" && expression?.label?.includes("Line Manager")) return "applicant-line-manager";
  if (type === "user" && method === "expression" && expression?.label?.includes("Department:Manager")) return "applicant-department-manager";
  if (type === "user" && method === "expression" && expressionProp === "Users_ID") return `${expressionType || "expression"}-all-users`;
  if (type === "user" && method === "expression") return "expression";
  if (type === "position" && method === "position") return "job-position";
  if (type === "position" && method === "positionorg") return "position-by-department";
  if (type === "position" && method === "positionorgexpr") return "position-by-applicant-department";
  if (type === "position" && method === "positionloc") return "position-by-location";
  if (type === "position" && method === "positionlocexpr") return "position-by-applicant-location";
  return `${type}-${method}`;
}

function fileNameForPattern(pattern) {
  const map = {
    "specific-user": "assignment-assignee-specific-user.normalized.json",
    expression: "assignment-assignee-expression.normalized.json",
    "applicant-line-manager": "assignment-assignee-applicant-line-manager.normalized.json",
    "applicant-department-manager": "assignment-assignee-department-manager.normalized.json",
    "user-group": "assignment-assignee-user-group.normalized.json",
    "position-all-users-expression": "assignment-assignee-position-all-users-expression.normalized.json",
    "job-position": "assignment-assignee-job-position.normalized.json",
    "position-by-department": "assignment-assignee-position-by-department.normalized.json",
    "position-by-applicant-department": "assignment-assignee-position-by-applicant-department.normalized.json",
    "position-by-location": "assignment-assignee-position-by-location.normalized.json",
    "position-by-applicant-location": "assignment-assignee-position-by-applicant-location.normalized.json",
  };
  return map[pattern] || `assignment-assignee-${pattern}.normalized.json`;
}

function classifyMultiAssignee(patterns, entries) {
  if (patterns.length <= 1) return patterns[0] || "empty";
  const directUserCount = entries.filter((entry) => entry?.type === "user" && entry?.method === "direct").length;
  const positionCount = entries.filter((entry) => entry?.type === "position").length;
  const expressionCount = entries.filter((entry) => entry?.method === "expression").length;
  if (directUserCount === patterns.length) return "multiple-specific-users";
  if (positionCount === patterns.length) return "multiple-job-positions";
  if (directUserCount > 0 && positionCount > 0) return "mixed-static-and-position";
  if (expressionCount === patterns.length) return "multi-source-expression";
  return "mixed";
}

function appointedOrderFor(props) {
  if (props.issequential === true) return "sequential";
  return "parallel-or-default";
}

function dueDateShapeFor(props) {
  return {
    duedatedefinition: props.duedatedefinition ?? null,
    duedatetype: props.duedatetype ?? null,
    hasDueDateExpression: props.duedateexpress !== undefined,
    dueDateExpression: props.duedateexpress ? (extractExpressionButton(props.duedateexpress) || "<REDACTED_DUE_DATE_EXPRESSION>") : null,
    isfromworkcalendar: props.isfromworkcalendar ?? null,
  };
}

function notifyRulesShapeFor(props) {
  if (!Array.isArray(props.notifyrules)) return null;
  return props.notifyrules.map((rule) => ({
    id: rule?.id ? "<REDACTED_NOTIFY_RULE_ID>" : null,
    actiontype: rule?.actiontype ?? null,
    actiondate: rule?.actiondate ? {
      relative: rule.actiondate.relative ?? null,
      value: rule.actiondate.value ?? null,
      type: rule.actiondate.type ?? null,
    } : null,
    subject: rule?.subject ? "<REDACTED_REMINDER_SUBJECT_SHAPE>" : null,
    content: rule?.content ? "<REDACTED_REMINDER_BODY_SHAPE>" : null,
  }));
}

function notificationShapeFor(props) {
  const enabled = props.isenabledemail ?? null;
  const shape = {
    isenabledemail: enabled,
  };
  if (enabled === true) {
    shape.to = props.to ? (extractExpressionButton(props.to) || "<REDACTED_NOTIFICATION_TO>") : null;
    shape.subject = props.subject ? (extractExpressionButton(props.subject) || "<REDACTED_NOTIFICATION_SUBJECT>") : null;
    shape.html = props.html ? "<REDACTED_NOTIFICATION_BODY_SHAPE>" : null;
    shape.notifyrules = notifyRulesShapeFor(props);
    shape.duedatetype = props.duedatetype ?? null;
  }
  return shape;
}

function inspectStartActions(forms, largeNumbers) {
  const starts = [];
  for (const [formIndex, form] of forms.entries()) {
    let def = null;
    try {
      def = typeof form.DefResource === "string" ? parseJsonPreservingLargeInts(form.DefResource, new Set(largeNumbers)) : form.DefResource;
    } catch {
      continue;
    }
    for (const [nodeIndex, shape] of asArray(def?.childshapes).entries()) {
      if (stencilId(shape) !== "StartNoneEvent") continue;
      const props = shape.properties || {};
      starts.push({
        sourceForm: {
          index: formIndex,
          name: form.Name || "<unnamed>",
          key: "<REDACTED_FORM_KEY>",
          workflowType: form.WorkflowType,
        },
        node: {
          index: nodeIndex,
          type: "StartNoneEvent",
          id: "<REDACTED_WORKFLOW_NODE_ID>",
          resourceid: "<REDACTED_WORKFLOW_NODE_ID>",
          label: props.name || "Start",
        },
        settings: {
          isenabledemail: props.isenabledemail ?? null,
          terminate: props.terminate ?? null,
          terminateConditions: Array.isArray(props["terminate-conditions"]) ? `array(${props["terminate-conditions"].length})` : props["terminate-conditions"] ?? null,
          revokeConditions: Array.isArray(props["revoke-conditions"]) ? `array(${props["revoke-conditions"].length})` : props["revoke-conditions"] ?? null,
          to: props.to ? "<REDACTED_START_NOTIFICATION_RECIPIENT_EXPRESSION>" : null,
          subject: props.subject ? "<REDACTED_START_NOTIFICATION_SUBJECT_SHAPE>" : null,
          html: props.html ? "<REDACTED_START_NOTIFICATION_BODY_SHAPE>" : null,
          taskurl: props.taskurl ? "<REDACTED_TASK_FORM_PAGE_ID>" : null,
        },
        graph: {
          incoming: asArray(shape.incoming).length,
          outgoing: asArray(shape.outgoing).length,
        },
        confidence: "export-proven",
      });
    }
  }
  return starts;
}

function inspect(data, inputPath, largeNumbers) {
  const forms = asArray(data.Forms);
  const inventory = [];
  for (const [formIndex, form] of forms.entries()) {
    let def = null;
    try {
      def = typeof form.DefResource === "string" ? parseJsonPreservingLargeInts(form.DefResource, new Set(largeNumbers)) : form.DefResource;
    } catch {
      continue;
    }
    for (const [nodeIndex, shape] of asArray(def?.childshapes).entries()) {
      if (stencilId(shape) !== "MultiAssignmentTask") continue;
      const assignments = asArray(shape.properties?.usertaskassignment);
      const patterns = assignments.map(classifyAssignment);
      const multiClassification = classifyMultiAssignee(patterns, assignments);
      inventory.push({
        taskNumber: inventory.length + 1,
        sourceForm: {
          index: formIndex,
          name: form.Name || "<unnamed>",
          key: "<REDACTED_FORM_KEY>",
          workflowType: form.WorkflowType,
        },
        node: {
          index: nodeIndex,
          type: "MultiAssignmentTask",
          id: "<REDACTED_WORKFLOW_NODE_ID>",
          resourceid: "<REDACTED_WORKFLOW_NODE_ID>",
          label: shape.properties?.name || "Assignment Task",
        },
        approvalSettings: {
          tasktype: shape.properties?.tasktype ?? null,
          approveway: shape.properties?.approveway ?? null,
          approvepercentage: shape.properties?.approvepercentage ?? null,
          appointedOrder: appointedOrderFor(shape.properties || {}),
          issequential: shape.properties?.issequential ?? null,
          isenabledemail: shape.properties?.isenabledemail ?? null,
          isallowreassign: shape.properties?.isallowreassign ?? null,
          isallowrecalled: shape.properties?.isallowrecalled ?? null,
          automaticapproveddefinition: shape.properties?.automaticapproveddefinition ?? null,
          isallowsign: shape.properties?.isallowsign ?? null,
          allowskip: shape.properties?.allowskip ?? null,
          dueDateSettings: dueDateShapeFor(shape.properties || {}),
          taskurl: shape.properties?.taskurl ? "<REDACTED_TASK_FORM_PAGE_ID>" : null,
        },
        notificationSettings: notificationShapeFor(shape.properties || {}),
        assignee: {
          classification: patterns.length === 1 ? patterns[0] : multiClassification,
          entryClassifications: patterns,
          assignmentCount: assignments.length,
          rawFieldNames: assignments.map((entry) => Object.keys(entry || {})),
          normalizedEntries: assignments.map(redactAssignment),
        },
        runtimeDependencies: runtimeDependenciesFor(patterns),
        confidence: "export-proven",
      });
    }
  }
  return {
    source: {
        path: path.resolve(inputPath),
      fileName: path.basename(inputPath),
      title: data.Item?.ListModel?.Title || "Test ABC",
      largeNumericIdsPreservedAsStrings: largeNumbers.length,
    },
    forms: {
      total: forms.length,
      approvalWorkflowForms: forms.filter((form) => form.WorkflowType === 2).length,
    },
    startActions: inspectStartActions(forms, largeNumbers),
    assignmentTaskCount: inventory.length,
    inventory,
  };
}

function runtimeDependenciesFor(patterns) {
  const deps = new Set();
  for (const pattern of patterns) {
    if (pattern.includes("user") || pattern.includes("manager")) deps.add("valid-user-directory-data");
    if (pattern.includes("department")) deps.add("valid-department-hierarchy-and-manager-data");
    if (pattern.includes("position")) deps.add("valid-position-assignments");
    if (pattern.includes("location")) deps.add("valid-location-assignments");
    if (pattern.includes("applicant")) deps.add("runtime-applicant-user-context");
  }
  return [...deps].sort();
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function main() {
  const args = parseArgs(process.argv);
  const { data, largeNumbers } = decodeYap(args.input);
  const report = inspect(data, args.input, largeNumbers);
  const outDir = path.resolve(args.out);
  fs.mkdirSync(outDir, { recursive: true });
  writeJson(path.join(outDir, "assignment-assignee-inventory.normalized.json"), report);

  const examples = new Map();
  for (const task of report.inventory) {
    const pattern = task.assignee.classification;
    if (!examples.has(pattern)) {
      examples.set(pattern, {
        proofLevel: "export-proven",
        sourceExport: path.basename(args.input),
        nodeType: task.node.type,
        assigneePattern: pattern,
        rawAssigneeFieldNames: task.assignee.rawFieldNames,
        normalizedConfig: task.assignee.assignmentCount > 1 ? task.assignee.normalizedEntries : (task.assignee.normalizedEntries[0] || null),
        approvalSettingsShape: task.approvalSettings,
        notificationSettingsShape: task.notificationSettings,
        runtimeDependencies: task.runtimeDependencies,
        generationSafety: generationSafetyFor(pattern),
      });
    }
  }
  for (const [pattern, example] of examples) {
    writeJson(path.join(outDir, fileNameForPattern(pattern)), example);
  }

  console.log(JSON.stringify({
    status: "pass",
    assignmentTaskCount: report.assignmentTaskCount,
    patterns: [...examples.keys()].sort(),
    outDir,
  }, null, 2));
}

function generationSafetyFor(pattern) {
  if (pattern === "specific-user") {
    return "tenant-sensitive; use only with explicit authorized user mapping or safe read-only directory lookup";
  }
  if (pattern.includes("position") || pattern.includes("department") || pattern.includes("location")) {
    return "requires target-tenant org/reference data and focused runtime proof before broad generation claims";
  }
  if (pattern.includes("applicant")) {
    return "depends on runtime applicant context and target-tenant user/org attributes";
  }
  return "export-proven shape; runtime routing unproven";
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", error: error instanceof Error ? error.message : "unknown error" }, null, 2));
  process.exit(1);
}
