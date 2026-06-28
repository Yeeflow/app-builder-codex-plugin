#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { asArray, isObject, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_REFERENCE = path.join(ROOT, "docs/reference/workflow-layout-golden-references.json");
const BROTLI_PREFIX = Buffer.from("::brotli::", "utf8");

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.referenceOnly && !args.resource && !args.package)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateWorkflowLayoutGoldenReference(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateWorkflowLayoutGoldenReference(options = {}) {
  const referencePath = path.resolve(options.reference || DEFAULT_REFERENCE);
  const findings = [];
  const reference = readReference(referencePath, findings);
  const resources = [];

  if (options.resource) {
    const resourcePath = path.resolve(options.resource);
    try {
      const parsed = JSON.parse(fs.readFileSync(resourcePath, "utf8").replace(/^\uFEFF/, ""));
      for (const resource of extractWorkflowResources(parsed, resourcePath)) resources.push(resource);
    } catch (error) {
      findings.push(issue("WORKFLOW_LAYOUT_RESOURCE_DECODE_FAILED", `Workflow layout resource could not be read: ${error.message}`, { resource: resourcePath }));
    }
  }

  if (options.package) {
    collectPackageWorkflowResources(path.resolve(options.package), resources, findings);
  }

  if (!options.referenceOnly && !resources.length && !findings.some((finding) => finding.level === "error")) {
    return {
      status: "pass",
      reference: summarizePath(referencePath),
      package: options.package ? summarizePath(path.resolve(options.package)) : null,
      resource: options.resource ? summarizePath(path.resolve(options.resource)) : null,
      summary: {
        workflowResources: 0,
        errors: 0,
        warnings: 0,
        skipped: true,
        reason: "No workflow graph resources were found.",
      },
      findings,
    };
  }

  for (const resource of resources) {
    validateOneWorkflow(resource, reference, findings);
  }

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    reference: summarizePath(referencePath),
    package: options.package ? summarizePath(path.resolve(options.package)) : null,
    resource: options.resource ? summarizePath(path.resolve(options.resource)) : null,
    summary: {
      workflowResources: resources.length,
      errors: findings.filter((finding) => finding.level === "error").length,
      warnings: findings.filter((finding) => finding.level === "warning").length,
    },
    findings,
  };
}

function readReference(referencePath, findings) {
  if (!fs.existsSync(referencePath)) {
    findings.push(issue("WORKFLOW_LAYOUT_REFERENCE_MISSING", "Workflow layout golden reference registry is missing.", { reference: referencePath }));
    return defaultRules();
  }
  try {
    const reference = JSON.parse(fs.readFileSync(referencePath, "utf8").replace(/^\uFEFF/, ""));
    const rules = reference.generatedWorkflowRules || {};
    const spacing = rules.recommendedSpacing || {};
    for (const key of ["mainColumnGap", "minimumNearCollisionDeltaX", "minimumNearCollisionDeltaY", "crossLaneVertexRequiredDeltaY", "longFlowVertexRequiredDeltaX"]) {
      if (!Number.isFinite(Number(spacing[key]))) {
        findings.push(issue("WORKFLOW_LAYOUT_REFERENCE_RULE_MISSING", "Workflow layout reference is missing a required numeric spacing rule.", { reference: referencePath, key }));
      }
    }
    if (!Array.isArray(reference.sourceReferences) || reference.sourceReferences.length < 2) {
      findings.push(issue("WORKFLOW_LAYOUT_REFERENCE_SOURCE_COVERAGE_INCOMPLETE", "Workflow layout reference must summarize the two export-proven source workflows.", { reference: referencePath }));
    }
    return { ...defaultRules(), ...reference, generatedWorkflowRules: { ...defaultRules().generatedWorkflowRules, ...rules, recommendedSpacing: { ...defaultRules().generatedWorkflowRules.recommendedSpacing, ...spacing } } };
  } catch (error) {
    findings.push(issue("WORKFLOW_LAYOUT_REFERENCE_DECODE_FAILED", `Workflow layout reference could not be parsed: ${error.message}`, { reference: referencePath }));
    return defaultRules();
  }
}

function defaultRules() {
  return {
    generatedWorkflowRules: {
      recommendedSpacing: {
        mainColumnGap: 300,
        minimumNearCollisionDeltaX: 40,
        minimumNearCollisionDeltaY: 40,
        crossLaneVertexRequiredDeltaY: 120,
        longFlowVertexRequiredDeltaX: 520,
      },
      lineStyle: {
        allowed: ["rounded", "normal"],
      },
    },
  };
}

function collectPackageWorkflowResources(packagePath, resources, findings) {
  if (!fs.existsSync(packagePath)) {
    findings.push(issue("WORKFLOW_LAYOUT_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return;
  }
  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch (error) {
    findings.push(issue("WORKFLOW_LAYOUT_PACKAGE_DECODE_FAILED", `Package Resource could not be decoded: ${error.message}`, { package: packagePath }));
    return;
  }

  for (const [formIndex, form] of asArray(decoded?.Forms || decoded?.Data?.Forms).entries()) {
    const def = decodeDefResource(form?.DefResource);
    if (!def) continue;
    resources.push({
      source: `$.Forms[${formIndex}].DefResource`,
      workflowName: form?.Name || form?.Title || form?.Key || `Approval workflow ${formIndex + 1}`,
      def,
      childshapes: asArray(def.childshapes),
    });
  }

  const seen = new Set(resources.map((resource) => resource.childshapes));
  walk(decoded, "$", (value, pointer) => {
    if (!isObject(value) || !Array.isArray(value.childshapes) || seen.has(value.childshapes)) return;
    resources.push({
      source: pointer,
      workflowName: value.name || value.title || pointer,
      def: value,
      childshapes: value.childshapes,
    });
    seen.add(value.childshapes);
  });
}

function extractWorkflowResources(parsed, resourcePath) {
  if (Array.isArray(parsed) || looksLikeNumericObjectArray(parsed)) {
    const childshapes = numericObjectToArray(parsed);
    return [{ source: resourcePath, workflowName: path.basename(resourcePath), def: { childshapes }, childshapes }];
  }
  if (Array.isArray(parsed?.childshapes)) {
    return [{ source: resourcePath, workflowName: parsed.name || parsed.title || path.basename(resourcePath), def: parsed, childshapes: parsed.childshapes }];
  }
  const resources = [];
  walk(parsed, "$", (value, pointer) => {
    if (isObject(value) && Array.isArray(value.childshapes)) {
      resources.push({ source: `${resourcePath}:${pointer}`, workflowName: value.name || value.title || pointer, def: value, childshapes: value.childshapes });
    }
  });
  return resources;
}

function validateOneWorkflow(resource, reference, findings) {
  const shapes = asArray(resource.childshapes);
  const nodes = shapes
    .map((shape, index) => ({ shape, index, id: shapeId(shape), stencil: stencilId(shape), position: nodePosition(shape) }))
    .filter((entry) => entry.stencil && entry.stencil !== "SequenceFlow");
  const flows = shapes
    .map((shape, index) => ({ shape, index, id: shapeId(shape), stencil: stencilId(shape) }))
    .filter((entry) => entry.stencil === "SequenceFlow");
  const spacing = reference.generatedWorkflowRules.recommendedSpacing;
  const allowedLineTypes = new Set(reference.generatedWorkflowRules.lineStyle?.allowed || ["rounded", "normal"]);
  const ids = new Set(nodes.map((node) => node.id).filter(Boolean));

  if (!nodes.length && !flows.length) return;

  for (const node of nodes) {
    if (!node.position) {
      findings.push(issue("WORKFLOW_LAYOUT_NODE_POSITION_MISSING", "Every workflow node must have top-level numeric position.x and position.y coordinates.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `$.childshapes[${node.index}].position`,
        nodeId: node.id,
        stencil: node.stencil,
      }));
    }
  }

  validateNodeSpacing(nodes, spacing, resource, findings);
  validateGraphCompression(nodes, spacing, resource, findings);
  validateGraphPosition(resource, nodes, findings);

  for (const flow of flows) {
    const sourceId = refId(flow.shape.source);
    const targetId = refId(flow.shape.target);
    const sourceNode = nodes.find((node) => node.id === sourceId);
    const targetNode = nodes.find((node) => node.id === targetId);
    const flowPath = `$.childshapes[${flow.index}]`;
    if (!sourceId || !targetId || !ids.has(sourceId) || !ids.has(targetId)) {
      findings.push(issue("WORKFLOW_LAYOUT_SEQUENCE_ENDPOINT_INVALID", "SequenceFlow source and target must resolve to existing workflow node ids.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: flowPath,
        flowId: flow.id,
        sourceId: sourceId || null,
        targetId: targetId || null,
      }));
      continue;
    }
    const lineType = String(flow.shape.properties?.linetype || "");
    if (nodes.length >= 5 && !lineType) {
      findings.push(issue("WORKFLOW_LAYOUT_COMPLEX_FLOW_LINETYPE_MISSING", "Complex generated workflows must set SequenceFlow properties.linetype so Designer renders intentional routing.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `${flowPath}.properties.linetype`,
        flowId: flow.id,
      }));
    } else if (lineType && !allowedLineTypes.has(lineType)) {
      findings.push(issue("WORKFLOW_LAYOUT_FLOW_LINETYPE_INVALID", "SequenceFlow properties.linetype must use an approved workflow layout line style.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `${flowPath}.properties.linetype`,
        flowId: flow.id,
        lineType,
      }));
    }

    const vertices = asArray(flow.shape.vertices);
    const dx = Math.abs((sourceNode?.position?.x || 0) - (targetNode?.position?.x || 0));
    const dy = Math.abs((sourceNode?.position?.y || 0) - (targetNode?.position?.y || 0));
    const rejected = isRejectedFlow(flow.shape) || stencilId(targetNode?.shape) === "EndRejectEvent";
    if (rejected && nodes.length >= 3 && !vertices.length) {
      findings.push(issue("WORKFLOW_LAYOUT_REJECTED_FLOW_VERTICES_MISSING", "Rejected/cancel/exception paths must use explicit vertices so the line is visually separated from the main path.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `${flowPath}.vertices`,
        flowId: flow.id,
        sourceId,
        targetId,
      }));
    }
    if (!rejected && nodes.length >= 5 && dy >= Number(spacing.crossLaneVertexRequiredDeltaY) && dx >= 120 && !vertices.length) {
      findings.push(issue("WORKFLOW_LAYOUT_CROSS_LANE_FLOW_VERTICES_MISSING", "Cross-lane SequenceFlow edges in complex workflows must include vertices to avoid diagonal line overlap.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `${flowPath}.vertices`,
        flowId: flow.id,
        sourceId,
        targetId,
        delta: { x: dx, y: dy },
      }));
    }
    if (nodes.length >= 8 && dx >= Number(spacing.longFlowVertexRequiredDeltaX) && dy >= 60 && !vertices.length) {
      findings.push(issue("WORKFLOW_LAYOUT_LONG_FLOW_VERTICES_MISSING", "Long SequenceFlow edges that cross multiple columns must include vertices for readable routing.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `${flowPath}.vertices`,
        flowId: flow.id,
        sourceId,
        targetId,
        delta: { x: dx, y: dy },
      }));
    }
  }
}

function validateNodeSpacing(nodes, spacing, resource, findings) {
  const occupied = new Map();
  const nearX = Number(spacing.minimumNearCollisionDeltaX);
  const nearY = Number(spacing.minimumNearCollisionDeltaY);
  for (const node of nodes) {
    if (!node.position) continue;
    const key = `${node.position.x},${node.position.y}`;
    if (occupied.has(key)) {
      findings.push(issue("WORKFLOW_LAYOUT_NODE_POSITION_COLLISION", "Workflow nodes must not stack on identical canvas coordinates.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `$.childshapes[${node.index}].position`,
        nodeId: node.id,
        previousNodeId: occupied.get(key),
        position: node.position,
      }));
    } else {
      occupied.set(key, node.id);
    }
  }
  for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
      const left = nodes[leftIndex];
      const right = nodes[rightIndex];
      if (!left.position || !right.position) continue;
      const dx = Math.abs(left.position.x - right.position.x);
      const dy = Math.abs(left.position.y - right.position.y);
      if (dx > 0 && dy > 0 && dx < nearX && dy < nearY) {
        findings.push(issue("WORKFLOW_LAYOUT_NODE_POSITION_TOO_CLOSE", "Workflow nodes are too close on both axes and will be hard to read in Designer.", {
          source: resource.source,
          workflowName: resource.workflowName,
          nodeId: right.id,
          previousNodeId: left.id,
          delta: { x: dx, y: dy },
        }));
      }
    }
  }
}

function validateGraphCompression(nodes, spacing, resource, findings) {
  const positioned = nodes.filter((node) => node.position);
  if (positioned.length < 5) return;
  const xs = positioned.map((node) => node.position.x);
  const ys = positioned.map((node) => node.position.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  const minWidth = Math.min(900, Math.max(420, (positioned.length - 1) * Number(spacing.mainColumnGap) * 0.32));
  if (width < minWidth && height < 220) {
    findings.push(issue("WORKFLOW_LAYOUT_GRAPH_TOO_COMPRESSED", "Complex workflow graph is compressed into too small an area; spread main-path nodes into readable columns and lanes.", {
      source: resource.source,
      workflowName: resource.workflowName,
      nodeCount: positioned.length,
      bounds: { width, height },
      minimumSuggestedWidth: Math.round(minWidth),
    }));
  }
}

function validateGraphPosition(resource, nodes, findings) {
  const graph = resource.def?.graphposition;
  if (!isObject(graph) || nodes.length < 2) return;
  const positioned = nodes.filter((node) => node.position);
  if (!positioned.length) return;
  const minX = Math.min(...positioned.map((node) => node.position.x));
  const maxX = Math.max(...positioned.map((node) => node.position.x));
  const minY = Math.min(...positioned.map((node) => node.position.y));
  const maxY = Math.max(...positioned.map((node) => node.position.y));
  const graphMaxX = Number(graph.x || 0) + Number(graph.width || 0);
  const graphMaxY = Number(graph.y || 0) + Number(graph.height || 0);
  if (Number.isFinite(graphMaxX) && Number.isFinite(graphMaxY) && (graphMaxX + 40 < maxX || graphMaxY + 40 < maxY || Number(graph.x || 0) - 40 > minX || Number(graph.y || 0) - 40 > minY)) {
    findings.push(issue("WORKFLOW_LAYOUT_GRAPHPOSITION_BOUNDS_INVALID", "Workflow graphposition must cover generated node bounds with padding so Designer opens to a readable canvas.", {
      source: resource.source,
      workflowName: resource.workflowName,
      graphposition: graph,
      nodeBounds: { minX, maxX, minY, maxY },
    }));
  }
}

function decodeDefResource(value) {
  if (isObject(value)) return value;
  if (typeof value !== "string" || !value) return null;
  try {
    if (value.startsWith("::brotli::")) {
      const inflated = zlib.brotliDecompressSync(Buffer.from(value.slice("::brotli::".length), "base64"));
      return JSON.parse(inflated.toString("utf8"));
    }
    const buffer = Buffer.from(value, "base64");
    if (buffer.subarray(0, BROTLI_PREFIX.length).equals(BROTLI_PREFIX)) {
      const inflated = zlib.brotliDecompressSync(buffer.subarray(BROTLI_PREFIX.length));
      return JSON.parse(inflated.toString("utf8"));
    }
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function looksLikeNumericObjectArray(value) {
  if (!isObject(value) || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => /^\d+$/.test(key));
}

function numericObjectToArray(value) {
  if (Array.isArray(value)) return value;
  if (looksLikeNumericObjectArray(value)) return Object.keys(value).sort((a, b) => Number(a) - Number(b)).map((key) => value[key]);
  return [];
}

function nodePosition(shape) {
  if (isObject(shape?.position) && Number.isFinite(Number(shape.position.x)) && Number.isFinite(Number(shape.position.y))) {
    return { x: Number(shape.position.x), y: Number(shape.position.y) };
  }
  if (isObject(shape?.bounds?.upperLeft) && Number.isFinite(Number(shape.bounds.upperLeft.x)) && Number.isFinite(Number(shape.bounds.upperLeft.y))) {
    return { x: Number(shape.bounds.upperLeft.x), y: Number(shape.bounds.upperLeft.y) };
  }
  return null;
}

function isRejectedFlow(flow) {
  const text = JSON.stringify({
    name: flow?.properties?.name || "",
    documentation: flow?.properties?.documentation || "",
    conditioninfo: flow?.properties?.conditioninfo || [],
  }).toLowerCase();
  return /rejected|reject|cancel|deny|decline|revoke|exception/.test(text);
}

function stencilId(shape) {
  return String(shape?.stencil?.id || shape?.stencilId || shape?.type || "");
}

function shapeId(shape) {
  return String(shape?.id || shape?.resourceid || shape?.resourceId || "");
}

function refId(ref) {
  return String(ref?.id || ref?.resourceid || ref?.resourceId || ref || "");
}

function walk(value, pointer, visit) {
  visit(value, pointer);
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${pointer}[${index}]`, visit));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    walk(child, `${pointer}.${key}`, visit);
  }
}

function issue(code, message, detail = {}, level = "error") {
  return { level, code, message, ...detail };
}

function summarizePath(value) {
  return value ? path.resolve(value) : null;
}

function parseArgs(argv) {
  const args = { reference: DEFAULT_REFERENCE, resource: "", package: "", referenceOnly: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--reference") args.reference = argv[++index] || "";
    else if (arg === "--reference-only") args.referenceOnly = true;
    else if (arg === "--resource") args.resource = argv[++index] || "";
    else if (arg === "--package") args.package = argv[++index] || "";
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-workflow-layout-golden-reference.mjs --reference-only
  node scripts/validate-workflow-layout-golden-reference.mjs --resource workflow.json
  node scripts/validate-workflow-layout-golden-reference.mjs --package generated-final.yapk
`);
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
