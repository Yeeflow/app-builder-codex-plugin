#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { asArray, isObject, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { validateDecodedDef } = require(path.join(ROOT, "validate-ywf-def.js"));
const BROTLI_PREFIX = Buffer.from("::brotli::", "utf8");

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.package && !args.resource)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateApprovalWorkflowPublishReadiness(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateApprovalWorkflowPublishReadiness(options = {}) {
  const findings = [];
  const resources = [];
  const plannedWorkflowNodesByForm = options.plan ? collectPlannedWorkflowNodes(options.plan, findings) : {};

  if (options.resource) {
    const resourcePath = path.resolve(options.resource);
    try {
      const def = JSON.parse(fs.readFileSync(resourcePath, "utf8").replace(/^\uFEFF/, ""));
      resources.push({
        source: resourcePath,
        formName: def?.name || def?.title || path.basename(resourcePath),
        def,
      });
    } catch (error) {
      findings.push(issue("APPROVAL_WORKFLOW_RESOURCE_DECODE_FAILED", `Approval workflow resource JSON could not be read: ${error.message}`, { resource: resourcePath }));
    }
  }

  if (options.package) {
    const packagePath = path.resolve(options.package);
    collectPackageApprovalDefs(packagePath, resources, findings);
  }

  if (!resources.length && !findings.length && options.package && !options.resource) {
    return {
      status: "pass",
      package: path.resolve(options.package),
      resource: null,
      summary: {
        approvalWorkflowResources: 0,
        errors: 0,
        warnings: 0,
        skipped: true,
        reason: "No approval workflow DefResource was found in the package.",
      },
      findings,
    };
  }

  if (!resources.length && !findings.length) {
    findings.push(issue("APPROVAL_WORKFLOW_RESOURCE_MISSING", "No approval workflow DefResource was found for publish-readiness validation."));
  }

  for (const [index, resource] of resources.entries()) {
    validateOneDef(resource.def, {
      findings,
      source: resource.source || `approval-resource-${index}`,
      formName: resource.formName || `Approval form ${index + 1}`,
      plannedWorkflowNodes: plannedWorkflowNodesByForm[normKey(resource.formName)] || [],
    });
  }

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    package: options.package ? path.resolve(options.package) : null,
    resource: options.resource ? path.resolve(options.resource) : null,
    summary: {
      approvalWorkflowResources: resources.length,
      plannedWorkflowParityChecked: Boolean(options.plan),
      errors: findings.filter((finding) => finding.level === "error").length,
      warnings: findings.filter((finding) => finding.level === "warning").length,
    },
    findings,
  };
}

function collectPackageApprovalDefs(packagePath, resources, findings) {
  if (!fs.existsSync(packagePath)) {
    findings.push(issue("APPROVAL_WORKFLOW_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return;
  }
  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch (error) {
    findings.push(issue("APPROVAL_WORKFLOW_PACKAGE_DECODE_FAILED", `Package Resource could not be decoded: ${error.message}`, { package: packagePath }));
    return;
  }
  for (const [formIndex, form] of asArray(decoded?.Forms || decoded?.Data?.Forms).entries()) {
    const source = `$.Forms[${formIndex}].DefResource`;
    const decodedDef = decodeDefResource(form?.DefResource);
    if (!decodedDef) {
      findings.push(issue("APPROVAL_WORKFLOW_DEFRESOURCE_DECODE_FAILED", "Approval Forms[].DefResource must be canonical ::brotli:: + Brotli JSON before workflow publish-readiness validation.", {
        source,
        formName: form?.Name || form?.Title || form?.Key || "",
      }));
      continue;
    }
    resources.push({
      source,
      formName: form?.Name || form?.Title || form?.Key || `Forms[${formIndex}]`,
      formKey: form?.Key || "",
      def: decodedDef,
    });
  }
}

function validateOneDef(def, context) {
  if (!isObject(def)) {
    context.findings.push(issue("APPROVAL_WORKFLOW_DEF_NOT_OBJECT", "Decoded approval workflow DefResource must be an object.", { source: context.source }));
    return;
  }

  const ywfReport = validateDecodedDef(def, { mode: "final" });
  for (const entry of asArray(ywfReport.errors)) {
    context.findings.push(issue("APPROVAL_WORKFLOW_YWF_FINAL_VALIDATION_FAILED", `Approval workflow final-mode validation failed: ${entry.code || entry.message}`, {
      source: context.source,
      formName: context.formName,
      validatorCode: entry.code || null,
      validatorMessage: entry.message || "",
      validatorPath: entry.path || "",
      detail: entry.detail || null,
    }));
  }

  validateFlowPage(def, context);
  validateVariableShape(def, context);
  validateTaskUrlAliases(def, context);
  validateAssignmentShape(def, context);
  validateSequenceFlowOutcomeConditions(def, context);
  validateRejectedPath(def, context);
  validateNodePositions(def, context);
  validateGraphRefs(def, context);
  validatePlanWorkflowNodeParity(def, context);
}

function validateFlowPage(def, context) {
  if (!Array.isArray(def.flowPage)) {
    context.findings.push(issue("APPROVAL_WORKFLOW_FLOWPAGE_MISSING", "Approval workflow DefResource must include flowPage as an array for Designer publish readiness.", {
      source: context.source,
      path: "$.flowPage",
    }));
  }
}

function validateVariableShape(def, context) {
  if (!isObject(def.variables)) {
    context.findings.push(issue("APPROVAL_WORKFLOW_VARIABLES_SHAPE_INVALID", "Approval workflow variables must be an object with basic/listref/filter arrays, not a flat array.", {
      source: context.source,
      path: "$.variables",
    }));
    return;
  }
  for (const key of ["basic", "listref", "filter"]) {
    if (!Array.isArray(def.variables[key])) {
      context.findings.push(issue("APPROVAL_WORKFLOW_VARIABLES_SHAPE_INVALID", `Approval workflow variables.${key} must be an array.`, {
        source: context.source,
        path: `$.variables.${key}`,
      }));
    }
  }
}

function validateTaskUrlAliases(def, context) {
  const pagesByType = {
    submission: new Set(asArray(def.pageurls).filter((page) => Number(page?.type) === 1).map((page) => String(page.id || ""))),
    task: new Set(asArray(def.pageurls).filter((page) => Number(page?.type) === 2).map((page) => String(page.id || ""))),
  };
  for (const [shapeIndex, shape] of asArray(def.childshapes).entries()) {
    const stencil = String(shape?.stencil?.id || "");
    if (stencil !== "StartNoneEvent" && stencil !== "MultiAssignmentTask" && stencil !== "CandidateTask") continue;
    const props = shape.properties || {};
    const aliases = ["taskurl", "taskUrl", "TaskUrl"].map((key) => String(props[key] || ""));
    const first = aliases.find(Boolean) || "";
    const pathPrefix = `$.childshapes[${shapeIndex}].properties`;
    if (!first) {
      context.findings.push(issue("APPROVAL_WORKFLOW_TASKURL_ALIAS_MISSING", `${stencil} must define taskurl/taskUrl/TaskUrl aliases.`, {
        source: context.source,
        path: `${pathPrefix}.taskurl`,
      }));
      continue;
    }
    if (aliases.some((value) => value !== first)) {
      context.findings.push(issue("APPROVAL_WORKFLOW_TASKURL_ALIAS_MISMATCH", `${stencil} taskurl/taskUrl/TaskUrl aliases must mirror the same page id.`, {
        source: context.source,
        path: pathPrefix,
        aliases: { taskurl: props.taskurl || null, taskUrl: props.taskUrl || null, TaskUrl: props.TaskUrl || null },
      }));
    }
    const validPages = stencil === "StartNoneEvent" ? pagesByType.submission : pagesByType.task;
    if (!validPages.has(first)) {
      context.findings.push(issue(stencil === "StartNoneEvent" ? "APPROVAL_WORKFLOW_START_TASKURL_INVALID" : "APPROVAL_WORKFLOW_TASK_TASKURL_INVALID", `${stencil} task URL must resolve to the correct registered page type.`, {
        source: context.source,
        path: `${pathPrefix}.taskurl`,
        taskurl: first,
      }));
    }
  }
}

function validateAssignmentShape(def, context) {
  for (const [shapeIndex, shape] of asArray(def.childshapes).entries()) {
    if (String(shape?.stencil?.id || "") !== "MultiAssignmentTask") continue;
    const props = shape.properties || {};
    if (!Array.isArray(props.usertaskassignment) || props.usertaskassignment.length === 0) {
      context.findings.push(issue("APPROVAL_WORKFLOW_ASSIGNMENT_SHAPE_INVALID", "MultiAssignmentTask.properties.usertaskassignment must be a non-empty array.", {
        source: context.source,
        path: `$.childshapes[${shapeIndex}].properties.usertaskassignment`,
      }));
    }
    if (!props.approveway) {
      context.findings.push(issue("APPROVAL_WORKFLOW_APPROVEWAY_MISSING", "MultiAssignmentTask must include approveway metadata.", {
        source: context.source,
        path: `$.childshapes[${shapeIndex}].properties.approveway`,
      }));
    }
    if (props.approvepercentage === undefined) {
      context.findings.push(issue("APPROVAL_WORKFLOW_APPROVEPERCENTAGE_MISSING", "MultiAssignmentTask must include approvepercentage metadata.", {
        source: context.source,
        path: `$.childshapes[${shapeIndex}].properties.approvepercentage`,
      }));
    }
  }
}

function validateRejectedPath(def, context) {
  const shapeById = new Map(asArray(def.childshapes).map((shape) => [shapeId(shape), shape]));
  const flows = asArray(def.childshapes).filter((shape) => stencilId(shape) === "SequenceFlow");
  for (const [flowIndex, flow] of flows.entries()) {
    if (!isRejectedFlow(flow)) continue;
    const target = shapeById.get(refId(flow.target));
    if (stencilId(target) !== "EndRejectEvent") {
      context.findings.push(issue("APPROVAL_WORKFLOW_REJECTED_PATH_NOT_END_REJECT", "Rejected approval transition must target EndRejectEvent.", {
        source: context.source,
        path: `$.childshapes[${flowIndex}].target`,
        targetStencil: stencilId(target) || null,
      }));
    }
  }
}

function validateSequenceFlowOutcomeConditions(def, context) {
  const shapes = asArray(def.childshapes);
  const shapeById = new Map(shapes.map((shape) => [shapeId(shape), shape]));
  const flows = shapes.filter((shape) => stencilId(shape) === "SequenceFlow");
  for (const [shapeIndex, task] of shapes.entries()) {
    if (stencilId(task) !== "MultiAssignmentTask") continue;
    const taskId = shapeId(task);
    const outgoingIds = new Set(asArray(task.outgoing).map(refId).filter(Boolean));
    const outgoingFlows = flows.filter((flow) => outgoingIds.has(shapeId(flow)) || refId(flow.source) === taskId);
    for (const outcome of ["Approved", "Rejected"]) {
      const flow = outgoingFlows.find((candidate) => flowMatchesOutcome(candidate, outcome));
      if (!flow) {
        context.findings.push(issue("APPROVAL_WORKFLOW_OUTCOME_FLOW_MISSING", `MultiAssignmentTask must have an outgoing ${outcome} SequenceFlow.`, {
          source: context.source,
          path: `$.childshapes[${shapeIndex}].outgoing`,
          taskId,
          outcome,
        }));
        continue;
      }
      const conditionPath = workflowShapePath(shapes, flow, "properties.conditioninfo");
      const conditions = asArray(flow?.properties?.conditioninfo);
      if (!conditions.length) {
        context.findings.push(issue("APPROVAL_WORKFLOW_OUTCOME_CONDITION_MISSING", `${outcome} SequenceFlow must include Designer-readable task Outcome conditioninfo.`, {
          source: context.source,
          path: conditionPath,
          taskId,
          flowId: shapeId(flow),
          outcome,
        }));
        continue;
      }
      if (conditions.some((condition) => isLegacyLabelValueCondition(condition))) {
        context.findings.push(issue("APPROVAL_WORKFLOW_OUTCOME_CONDITION_LEGACY_SHAPE", `${outcome} SequenceFlow conditioninfo must not use simplified {label,value}; it must use left/op/right task Outcome expression shape.`, {
          source: context.source,
          path: conditionPath,
          taskId,
          flowId: shapeId(flow),
          outcome,
        }));
      }
      if (!conditions.some((condition) => isDesignerOutcomeCondition(condition, taskId, outcome))) {
        context.findings.push(issue("APPROVAL_WORKFLOW_OUTCOME_CONDITION_INVALID", `${outcome} SequenceFlow conditioninfo must compare the current task Outcome to ${outcome} with left/op/right Designer expression fields.`, {
          source: context.source,
          path: conditionPath,
          taskId,
          flowId: shapeId(flow),
          outcome,
        }));
      }
      const target = shapeById.get(refId(flow.target));
      if (outcome === "Approved" && stencilId(target) !== "EndNoneEvent") {
        if (stencilId(target) === "EndRejectEvent" || !stencilId(target)) {
          context.findings.push(issue("APPROVAL_WORKFLOW_APPROVED_PATH_NOT_VALID_STEP", "Approved approval transition must target a valid next workflow node or EndNoneEvent.", {
          source: context.source,
          path: workflowShapePath(shapes, flow, "target"),
          targetStencil: stencilId(target) || null,
          }));
        }
      }
    }
  }
}

function validatePlanWorkflowNodeParity(def, context) {
  const planned = asArray(context.plannedWorkflowNodes)
    .filter((node) => !["StartNoneEvent", "EndNoneEvent", "EndRejectEvent", "SequenceFlow"].includes(node.nodeType));
  if (!planned.length) return;
  const actualNodes = asArray(def.childshapes)
    .filter((shape) => !["StartNoneEvent", "EndNoneEvent", "EndRejectEvent", "SequenceFlow"].includes(stencilId(shape)))
    .map((shape, index) => ({
      index,
      id: shapeId(shape),
      name: cleanResourceName(shape?.properties?.name || shape?.name || shape?.label),
      stencil: stencilId(shape),
    }));
  const actualByName = new Map(actualNodes.map((node) => [normKey(node.name), node]));
  const plannedTasks = planned.filter((node) => node.nodeType === "MultiAssignmentTask" || node.nodeType === "CandidateTask");
  const actualTasks = actualNodes.filter((node) => node.stencil === "MultiAssignmentTask" || node.stencil === "CandidateTask");
  if (plannedTasks.length > actualTasks.length) {
    context.findings.push(issue("APPROVAL_WORKFLOW_PLANNED_TASK_COUNT_MISMATCH", "Generated Approval workflow must materialize every planned task node from the App Plan instead of collapsing to a single baseline task.", {
      source: context.source,
      formName: context.formName,
      plannedTaskCount: plannedTasks.length,
      actualTaskCount: actualTasks.length,
      plannedTaskNames: plannedTasks.map((node) => node.nodeName),
      actualTaskNames: actualTasks.map((node) => node.name),
    }));
  }
  for (const node of planned) {
    const actual = actualByName.get(normKey(node.nodeName));
    if (!actual) {
      context.findings.push(issue("APPROVAL_WORKFLOW_PLANNED_NODE_NOT_MATERIALIZED", "Generated Approval workflow is missing a node required by the App Plan workflow node table.", {
        source: context.source,
        formName: context.formName,
        plannedNodeName: node.nodeName,
        plannedNodeType: node.nodeType,
        actualNodeNames: actualNodes.map((item) => item.name),
      }));
      continue;
    }
    if (!workflowNodeTypeMatches(node.nodeType, actual.stencil)) {
      context.findings.push(issue("APPROVAL_WORKFLOW_PLANNED_NODE_TYPE_MISMATCH", "Generated Approval workflow node type must match the App Plan workflow node table.", {
        source: context.source,
        formName: context.formName,
        plannedNodeName: node.nodeName,
        plannedNodeType: node.nodeType,
        actualNodeType: actual.stencil,
        actualNodeId: actual.id,
      }));
    }
  }
}

function validateNodePositions(def, context) {
  const occupied = new Map();
  for (const [shapeIndex, shape] of asArray(def.childshapes).entries()) {
    if (stencilId(shape) === "SequenceFlow") continue;
    const position = nodePosition(shape);
    if (!position) {
      context.findings.push(issue("APPROVAL_WORKFLOW_NODE_POSITION_MISSING", "Workflow node must include top-level position or bounds coordinates.", {
        source: context.source,
        path: `$.childshapes[${shapeIndex}].position`,
        nodeId: shapeId(shape),
      }));
      continue;
    }
    const key = `${position.x},${position.y}`;
    if (occupied.has(key)) {
      context.findings.push(issue("APPROVAL_WORKFLOW_NODE_POSITION_COLLISION", "Workflow nodes must not stack on identical canvas coordinates.", {
        source: context.source,
        path: `$.childshapes[${shapeIndex}].position`,
        nodeId: shapeId(shape),
        previousNodeId: occupied.get(key),
        position,
      }));
    } else {
      occupied.set(key, shapeId(shape));
    }
  }
}

function validateGraphRefs(def, context) {
  const shapes = asArray(def.childshapes);
  const ids = new Set(shapes.map(shapeId).filter(Boolean));
  for (const [shapeIndex, shape] of shapes.entries()) {
    const id = shapeId(shape);
    if (!id || String(shape?.id || "") !== String(shape?.resourceid || "")) {
      context.findings.push(issue("APPROVAL_WORKFLOW_GRAPH_ID_REF_INVALID", "Workflow shape id and resourceid must be present and equal.", {
        source: context.source,
        path: `$.childshapes[${shapeIndex}].id`,
        id: shape?.id || null,
        resourceid: shape?.resourceid || null,
      }));
    }
    if (stencilId(shape) === "SequenceFlow") {
      for (const endpoint of ["source", "target"]) {
        const endpointId = refId(shape[endpoint]);
        if (!endpointId || !ids.has(endpointId)) {
          context.findings.push(issue("APPROVAL_WORKFLOW_SEQUENCE_ENDPOINT_INVALID", "SequenceFlow source and target must resolve to existing workflow node ids.", {
            source: context.source,
            path: `$.childshapes[${shapeIndex}].${endpoint}`,
            endpoint,
            endpointId: endpointId || null,
          }));
        }
      }
    }
  }
}

function decodeDefResource(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const bytes = Buffer.from(value, "base64");
    const payload = bytes.subarray(0, BROTLI_PREFIX.length).equals(BROTLI_PREFIX)
      ? bytes.subarray(BROTLI_PREFIX.length)
      : bytes;
    const text = zlib.brotliDecompressSync(payload).toString("utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function shapeId(shape) {
  return shape && String(shape.resourceid || shape.id || "");
}

function stencilId(shape) {
  return String(shape?.stencil?.id || "");
}

function refId(ref) {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  return String(ref.resourceid || ref.resourceId || ref.id || "");
}

function isRejectedFlow(flow) {
  return /reject|rejected/i.test(JSON.stringify([flow?.properties?.name, flow?.properties?.conditioninfo, flow?.name, flow?.label]));
}

function flowMatchesOutcome(flow, outcome) {
  const text = JSON.stringify([flow?.properties?.name, flow?.properties?.conditioninfo, flow?.name, flow?.label]);
  return new RegExp(outcome, "i").test(text);
}

function isLegacyLabelValueCondition(condition) {
  return isObject(condition)
    && Object.prototype.hasOwnProperty.call(condition, "label")
    && Object.prototype.hasOwnProperty.call(condition, "value")
    && !Object.prototype.hasOwnProperty.call(condition, "left")
    && !Object.prototype.hasOwnProperty.call(condition, "op")
    && !Object.prototype.hasOwnProperty.call(condition, "right");
}

function isDesignerOutcomeCondition(condition, taskId, outcome) {
  if (!isObject(condition)) return false;
  const left = String(condition.left || "");
  const op = String(condition.op || "");
  const right = String(condition.right || "");
  return left.includes(taskId)
    && /type(?:&quot;|")?\s*(?::|=)?(?:&quot;|")?task/i.test(left)
    && /Outcome/i.test(left)
    && op === "s.="
    && right.includes(outcome)
    && /Task outcome/i.test(right);
}

function workflowNodeTypeMatches(plannedType, actualType) {
  if (plannedType === actualType) return true;
  if (plannedType === "MultiAssignmentTask" && actualType === "AssignmentTask") return true;
  if (plannedType === "AssignmentTask" && actualType === "MultiAssignmentTask") return true;
  return false;
}

function collectPlannedWorkflowNodes(planPath, findings) {
  const resolved = path.resolve(planPath);
  const byForm = {};
  if (!fs.existsSync(resolved)) {
    findings.push(issue("APPROVAL_WORKFLOW_PLAN_MISSING", "App Plan file is missing for approval workflow node parity validation.", { plan: resolved }));
    return byForm;
  }
  let text = "";
  try {
    text = fs.readFileSync(resolved, "utf8");
  } catch (error) {
    findings.push(issue("APPROVAL_WORKFLOW_PLAN_READ_FAILED", `App Plan could not be read: ${error.message}`, { plan: resolved }));
    return byForm;
  }
  const section = extractNumberedSection(text, /^##\s+5\.\s+Approval Forms Plan/im);
  if (!section.trim()) return byForm;
  const lines = section.split(/\r?\n/);
  let currentApprovalForm = "";
  for (let index = 0; index < lines.length; index += 1) {
    const approvalHeading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (approvalHeading) {
      currentApprovalForm = cleanResourceName(approvalHeading[1]);
      if (currentApprovalForm && !byForm[normKey(currentApprovalForm)]) byForm[normKey(currentApprovalForm)] = [];
      continue;
    }
    if (!currentApprovalForm || !isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const nameColumn = findHeaderIndex(normalizedHeaders, ["node name", "workflow node", "step name", "approval step", "task name"]);
    const typeColumn = findHeaderIndex(normalizedHeaders, ["node type", "workflow node type", "stencil", "type"]);
    if (nameColumn === -1 || typeColumn === -1) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const nodeName = cleanResourceName(cells[nameColumn]);
      const nodeType = normalizeWorkflowNodeType(cells[typeColumn]);
      if (nodeName && nodeType && !isNonResourceName(nodeName)) {
        byForm[normKey(currentApprovalForm)].push({ nodeName, nodeType });
      }
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return Object.fromEntries(Object.entries(byForm).map(([key, nodes]) => [key, uniqueWorkflowNodes(nodes)]));
}

function extractNumberedSection(text, marker) {
  const match = marker.exec(text);
  if (!match) return "";
  const start = match.index;
  const next = text.slice(start + match[0].length).search(/\n##\s+\d+\.\s+/);
  return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next);
}

function findHeaderIndex(normalizedHeaders, candidates) {
  const normalizedCandidates = candidates.map(normKey);
  return normalizedHeaders.findIndex((header) => normalizedCandidates.includes(header));
}

function isTableLine(line) {
  return /^\s*\|.+\|\s*$/.test(line || "");
}

function splitTableLine(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cleanResourceName(cell));
}

function cleanResourceName(value) {
  return String(value || "").replace(/`/g, "").replace(/\*\*/g, "").trim();
}

function isNonResourceName(value) {
  const text = cleanResourceName(value);
  if (!text) return true;
  if (/^(not applicable|n\/a|none|no|deferred|status|resource type|purpose|notes?|owner|used by|actions?|fields?)$/i.test(text)) return true;
  return false;
}

function normKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeWorkflowNodeType(value) {
  const text = cleanResourceName(value);
  const key = normKey(text);
  if (!key) return "";
  if (/^start/.test(key)) return "StartNoneEvent";
  if (/end\s*reject|reject\s*end/.test(key)) return "EndRejectEvent";
  if (/^end/.test(key)) return "EndNoneEvent";
  if (/sequence|flow|transition/.test(key)) return "SequenceFlow";
  if (/content\s*list|service\s*action|serviceaction|action\s*node|create|update|archive|persist|master/.test(key) || text === "ContentList") return "ContentList";
  if (/candidate/.test(key)) return "CandidateTask";
  if (/assignment|approval|review|task|multi/.test(key) || text === "MultiAssignmentTask" || text === "AssignmentTask") return "MultiAssignmentTask";
  return text.replace(/[^A-Za-z0-9_]/g, "") || "MultiAssignmentTask";
}

function uniqueWorkflowNodes(nodes) {
  const seen = new Set();
  const out = [];
  for (const node of nodes) {
    const key = `${normKey(node.nodeName)}::${node.nodeType}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(node);
  }
  return out;
}

function workflowShapePath(shapes, targetShape, suffix = "") {
  const index = shapes.findIndex((shape) => shape === targetShape || shapeId(shape) === shapeId(targetShape));
  return `$.childshapes[${index < 0 ? "?" : index}]${suffix ? `.${suffix}` : ""}`;
}

function nodePosition(shape) {
  if (isObject(shape?.position) && typeof shape.position.x === "number" && typeof shape.position.y === "number") {
    return { x: shape.position.x, y: shape.position.y };
  }
  if (isObject(shape?.bounds) && isObject(shape.bounds.upperLeft)) {
    const x = Number(shape.bounds.upperLeft.x);
    const y = Number(shape.bounds.upperLeft.y);
    if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
  }
  return null;
}

function issue(code, message, detail = {}, level = "error") {
  return { level, code, message, ...detail };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--package") {
      args.package = argv[i + 1];
      i += 1;
    } else if (token === "--resource") {
      args.resource = argv[i + 1];
      i += 1;
    } else if (token === "--plan") {
      args.plan = argv[i + 1];
      i += 1;
    } else if (token === "--json") {
      args.json = true;
    } else if (!args.package && token.endsWith(".yapk")) {
      args.package = token;
    } else if (!args.resource && token.endsWith(".json")) {
      args.resource = token;
    }
  }
  return args;
}

function printUsage() {
  console.error([
    "Usage:",
    "  node scripts/validate-approval-workflow-publish-readiness.mjs --package <generated-final.yapk> [--plan <yeeflow-app-plan.md>]",
    "  node scripts/validate-approval-workflow-publish-readiness.mjs --resource <decoded-approval-def.json>",
    "",
    "This gate validates approval workflow Designer publish readiness before signing.",
  ].join("\n"));
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
