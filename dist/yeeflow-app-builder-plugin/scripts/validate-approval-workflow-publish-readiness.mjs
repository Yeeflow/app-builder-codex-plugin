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

  if (options.resource) {
    const resourcePath = path.resolve(options.resource);
    try {
      resources.push({
        source: resourcePath,
        formName: path.basename(resourcePath),
        def: JSON.parse(fs.readFileSync(resourcePath, "utf8").replace(/^\uFEFF/, "")),
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
    });
  }

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    package: options.package ? path.resolve(options.package) : null,
    resource: options.resource ? path.resolve(options.resource) : null,
    summary: {
      approvalWorkflowResources: resources.length,
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
  validateRejectedPath(def, context);
  validateNodePositions(def, context);
  validateGraphRefs(def, context);
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
    "  node scripts/validate-approval-workflow-publish-readiness.mjs --package <generated-final.yapk>",
    "  node scripts/validate-approval-workflow-publish-readiness.mjs --resource <decoded-approval-def.json>",
    "",
    "This gate validates approval workflow Designer publish readiness before signing.",
  ].join("\n"));
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
