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
    for (const key of [
      "mainColumnGap",
      "minimumNearCollisionDeltaX",
      "minimumNearCollisionDeltaY",
      "minimumForwardFlowDeltaX",
      "minimumTaskColumnDeltaX",
      "crossLaneVertexRequiredDeltaY",
      "longFlowVertexRequiredDeltaX",
      "maximumRejectedSourcesPerEnd",
      "endRejectCenterToleranceX",
      "endRejectVerticalSeparationMin",
      "endRejectSharedLaneToleranceY",
      "gatewayBranchColumnToleranceX",
      "workflowRowToleranceY",
      "targetCanvasAspectRatio",
      "singleRowSprawlNodeThreshold",
      "singleRowSprawlAspectRatio",
      "maximumWorkflowRows",
      "mediumWorkflowNodeThreshold",
      "mediumWorkflowMaxWidth",
      "mediumWorkflowReadableWidthAllowance",
      "mediumWorkflowMinRowsForWideAllowance",
      "rowNodeDensityThreshold",
      "endRejectSourceSpanMax",
      "gatewayLabelCongestionMinLength",
      "gatewayLabelLaneToleranceY",
      "connectorLabelCollisionMinLength",
      "connectorLabelApproxCharWidth",
      "connectorLabelPaddingX",
      "connectorLabelHeight",
      "connectorLabelNodePadding",
      "verticalRouteLaneDensityToleranceX",
      "verticalRouteLaneDensityMaxSegments",
      "workflowNodeWidth",
      "workflowNodeHeight",
      "minimumRowGapForMidpointRoute",
      "minimumRowGapForLabeledMidpointRoute",
      "rowGapRouteYTolerance",
      "minimumColumnGapForMidpointRoute",
      "columnGapRouteXTolerance",
      "externalReturnLanePaddingMin",
      "vertexEconomyNodeThreshold",
      "maxNonReturnVertexFlowRatio",
      "maxAverageVerticesPerFlow",
      "connectorDetourRatioMax",
      "gatewayBranchLocalMaxDeltaX",
      "endMergeMaxDeltaX",
      "endMergeVerticalToleranceY",
      "connectorLabelMaxChars",
      "localRejectVertexMaxDeltaX",
      "localRejectVertexMaxDeltaY",
      "localForwardAutoRouteMaxDeltaX",
      "localForwardAutoRouteMaxDeltaY",
    ]) {
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
        minimumForwardFlowDeltaX: 180,
        minimumTaskColumnDeltaX: 305,
        mainLaneY: 40,
        rejectUpGap: 125,
        rejectDownGap: 135,
        crossLaneVertexRequiredDeltaY: 120,
        longFlowVertexRequiredDeltaX: 520,
        maximumRejectedSourcesPerEnd: 3,
        endRejectCenterToleranceX: 80,
        endRejectVerticalSeparationMin: 110,
        endRejectSharedLaneToleranceY: 40,
        gatewayBranchColumnToleranceX: 80,
        workflowRowToleranceY: 60,
        targetCanvasAspectRatio: 1.7778,
        singleRowSprawlNodeThreshold: 10,
        singleRowSprawlAspectRatio: 2.4,
        maximumWorkflowRows: 5,
        mediumWorkflowNodeThreshold: 14,
        mediumWorkflowMaxWidth: 2600,
        mediumWorkflowReadableWidthAllowance: 3400,
        mediumWorkflowMinRowsForWideAllowance: 3,
        rowNodeDensityThreshold: 7,
        endRejectSourceSpanMax: 760,
        gatewayLabelCongestionMinLength: 16,
        gatewayLabelLaneToleranceY: 60,
        connectorLabelCollisionMinLength: 16,
        connectorLabelApproxCharWidth: 7,
        connectorLabelPaddingX: 24,
        connectorLabelHeight: 24,
        connectorLabelNodePadding: 8,
        verticalRouteLaneDensityToleranceX: 18,
        verticalRouteLaneDensityMaxSegments: 2,
        workflowNodeWidth: 190,
        workflowNodeHeight: 86,
        minimumRowGapForMidpointRoute: 60,
        minimumRowGapForLabeledMidpointRoute: 40,
        rowGapRouteYTolerance: 12,
        minimumColumnGapForMidpointRoute: 48,
        columnGapRouteXTolerance: 12,
        externalReturnLanePaddingMin: 80,
        vertexEconomyNodeThreshold: 8,
        maxNonReturnVertexFlowRatio: 0.25,
        maxAverageVerticesPerFlow: 1.25,
        connectorDetourRatioMax: 2.35,
        gatewayBranchLocalMaxDeltaX: 650,
        endMergeMaxDeltaX: 650,
        endMergeVerticalToleranceY: 130,
        connectorLabelMaxChars: 42,
        localRejectVertexMaxDeltaX: 760,
        localRejectVertexMaxDeltaY: 260,
        localForwardAutoRouteMaxDeltaX: 1250,
        localForwardAutoRouteMaxDeltaY: 360,
      },
      lineStyle: {
        default: "rounded",
        allowed: ["rounded"],
        requiredGraphver: 2,
        requireEmptyDockers: true,
        requireDocumentation: true,
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
  const lineStyleRules = reference.generatedWorkflowRules.lineStyle || {};
  const allowedLineTypes = new Set(lineStyleRules.allowed || ["rounded"]);
  const ids = new Set(nodes.map((node) => node.id).filter(Boolean));

  if (!nodes.length && !flows.length) return;

  validateWorkflowDesignerV2Style(resource, flows, allowedLineTypes, lineStyleRules, findings);

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
  validateCanvasRows(nodes, spacing, resource, findings);
  validateGraphPosition(resource, nodes, findings);
  validateWorkflowSemantics(resource, nodes, flows, spacing, findings);
  validateWorkflowMotifs(resource, nodes, flows, spacing, findings);
  validateVertexEconomy(resource, nodes, flows, spacing, findings);
  validateConnectorDetourEconomy(resource, nodes, flows, spacing, findings);

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
    const vertices = asArray(flow.shape.vertices);
    const signedDx = (targetNode?.position?.x || 0) - (sourceNode?.position?.x || 0);
    const dx = Math.abs(signedDx);
    const dy = Math.abs((sourceNode?.position?.y || 0) - (targetNode?.position?.y || 0));
    const targetStencil = stencilId(targetNode?.shape);
    const sameRow = sourceNode?.position && targetNode?.position && dy <= Number(spacing.workflowRowToleranceY);
    const directAdjacentForward = sameRow && signedDx > 0 && dx <= Number(spacing.mainColumnGap || 335) + 120;
    const sourceStencil = stencilId(sourceNode?.shape);
    if (sourceStencil === "StartNoneEvent" && directAdjacentForward && isSubmittedFlow(flow.shape) && vertices.length) {
      findings.push(issue("WORKFLOW_LAYOUT_SUBMITTED_VERTICES_UNNECESSARY", "Direct Start-to-first-task Submitted connectors must use clean rounded auto-routing with empty or absent vertices.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `${flowPath}.vertices`,
        flowId: flow.id,
        sourceId,
        targetId,
        vertices,
      }));
    }
    if (directAdjacentForward && targetStencil !== "EndRejectEvent" && sourceStencil !== "StartNoneEvent" && vertices.length) {
      findings.push(issue("WORKFLOW_LAYOUT_DIRECT_FORWARD_VERTICES_UNNECESSARY", "Direct adjacent same-row forward connectors must not include cosmetic vertices when no obstacle requires explicit routing.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `${flowPath}.vertices`,
        flowId: flow.id,
        sourceId,
        targetId,
        delta: { x: dx, y: dy },
      }));
    }
    validateFlowRouteY({
      resource,
      flow,
      flowPath,
      sourceNode,
      targetNode,
      nodes,
      vertices,
      spacing,
      findings,
    });
    validateFlowRouteX({
      resource,
      flow,
      flowPath,
      sourceNode,
      targetNode,
      nodes,
      vertices,
      spacing,
      findings,
    });
    if (sourceNode?.position && targetNode?.position && signedDx > 0 && sameRow && nodes.length >= 5 && targetStencil !== "EndRejectEvent" && dx < Number(spacing.minimumForwardFlowDeltaX)) {
      findings.push(issue("WORKFLOW_LAYOUT_FORWARD_FLOW_TOO_CLOSE", "Forward SequenceFlow edges should reserve enough horizontal space between workflow action nodes.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: flowPath,
        flowId: flow.id,
        sourceId,
        targetId,
        delta: { x: dx, y: dy },
      }));
    }
    const isLongBackwardFlow = signedDx < 0 && dx >= Number(spacing.longFlowVertexRequiredDeltaX);
    if (sourceNode?.position && targetNode?.position && signedDx < 0 && nodes.length >= 3 && targetStencil !== "EndRejectEvent" && (isReturnFlow(flow.shape) || isLongBackwardFlow || dy < Number(spacing.laneGap || 155)) && !vertices.length) {
      findings.push(issue("WORKFLOW_LAYOUT_BACKWARD_FLOW_VERTICES_MISSING", "Backward or return SequenceFlow edges must use explicit vertices so the return path does not cut through the main workflow lane.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `${flowPath}.vertices`,
        flowId: flow.id,
        sourceId,
        targetId,
      }));
    }
    const localForwardAutoRoute = isLocalForwardAutoRouteCandidate({ flow: flow.shape, sourceNode, targetNode, spacing });
    if (vertices.length && localForwardAutoRoute) {
      findings.push(issue("WORKFLOW_LAYOUT_LOCAL_FORWARD_VERTICES_UNNECESSARY", "Local forward or merge SequenceFlow edges should use clean rounded auto-routing; if explicit vertices are needed for this short local link, move the nodes instead of drawing a bent connector.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `${flowPath}.vertices`,
        flowId: flow.id,
        sourceId,
        targetId,
        delta: { x: dx, y: dy },
        vertexCount: vertices.length,
      }));
    }
    if (nodes.length >= 8 && dx >= Number(spacing.longFlowVertexRequiredDeltaX) && dy >= 60 && !vertices.length && !localForwardAutoRoute) {
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

  validateConnectorReadability(resource, nodes, flows, spacing, findings);
}

function isLocalForwardAutoRouteCandidate({ flow, sourceNode, targetNode, spacing }) {
  if (!flow || !sourceNode?.position || !targetNode?.position) return false;
  const sourceStencil = stencilId(sourceNode.shape);
  const targetStencil = stencilId(targetNode.shape);
  if (sourceStencil === "StartNoneEvent" || sourceStencil === "EndRejectEvent" || targetStencil === "EndRejectEvent") return false;
  if (isRejectedFlow(flow) || isReturnFlow(flow)) return false;
  const signedDx = Number(targetNode.position.x) - Number(sourceNode.position.x);
  if (signedDx <= 0) return false;
  const dx = Math.abs(signedDx);
  const dy = Math.abs(Number(targetNode.position.y) - Number(sourceNode.position.y));
  return dx <= Number(spacing.localForwardAutoRouteMaxDeltaX || 1250) && dy <= Number(spacing.localForwardAutoRouteMaxDeltaY || 360);
}

function validateWorkflowDesignerV2Style(resource, flows, allowedLineTypes, lineStyleRules, findings) {
  const def = resource.def || {};
  if (def.lineType !== "rounded") {
    findings.push(issue("WORKFLOW_LAYOUT_ROOT_LINETYPE_NOT_ROUNDED", "New workflow designer requires root lineType = rounded for generated Approval, Data List, and Scheduled workflow graphs.", {
      source: resource.source,
      workflowName: resource.workflowName,
      path: "$.lineType",
      actual: def.lineType ?? null,
      expected: "rounded",
    }));
  }
  const requiredGraphver = Number(lineStyleRules.requiredGraphver || 2);
  if (Number(def.graphver) !== requiredGraphver) {
    findings.push(issue("WORKFLOW_LAYOUT_ROOT_GRAPHVER_NOT_V2", "New workflow designer requires root graphver = 2 for generated workflow graphs.", {
      source: resource.source,
      workflowName: resource.workflowName,
      path: "$.graphver",
      actual: def.graphver ?? null,
      expected: requiredGraphver,
    }));
  }
  for (const flow of flows) {
    const flowPath = `$.childshapes[${flow.index}]`;
    const lineType = String(flow.shape.properties?.linetype || "");
    if (!lineType) {
      findings.push(issue("WORKFLOW_LAYOUT_FLOW_LINETYPE_MISSING", "Generated SequenceFlow must set properties.linetype for the new workflow designer.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `${flowPath}.properties.linetype`,
        flowId: flow.id,
      }));
    } else if (!allowedLineTypes.has(lineType)) {
      findings.push(issue("WORKFLOW_LAYOUT_FLOW_LINETYPE_INVALID", "SequenceFlow properties.linetype must use an approved workflow layout line style.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `${flowPath}.properties.linetype`,
        flowId: flow.id,
        lineType,
        allowed: [...allowedLineTypes],
      }));
    }
    if (lineStyleRules.requireDocumentation !== false && !Object.prototype.hasOwnProperty.call(flow.shape.properties || {}, "documentation")) {
      findings.push(issue("WORKFLOW_LAYOUT_FLOW_DOCUMENTATION_MISSING", "New workflow designer SequenceFlow should include properties.documentation, usually an empty string.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `${flowPath}.properties.documentation`,
        flowId: flow.id,
      }));
    }
    if (lineStyleRules.requireEmptyDockers !== false && (!Array.isArray(flow.shape.dockers) || flow.shape.dockers.length !== 0)) {
      findings.push(issue("WORKFLOW_LAYOUT_FLOW_DOCKERS_NOT_EMPTY", "New workflow designer rounded routing expects SequenceFlow.dockers to be an empty array by default.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `${flowPath}.dockers`,
        flowId: flow.id,
        actualLength: Array.isArray(flow.shape.dockers) ? flow.shape.dockers.length : null,
      }));
    }
  }
}

function validateFlowRouteY({ resource, flow, flowPath, sourceNode, targetNode, nodes, vertices, spacing, findings }) {
  if (!sourceNode?.position || !targetNode?.position || !vertices.length) return;
  if (stencilId(targetNode.shape) === "EndRejectEvent" || stencilId(sourceNode.shape) === "EndRejectEvent") return;
  const sourceY = Number(sourceNode.position.y);
  const targetY = Number(targetNode.position.y);
  const rowDeltaY = Math.abs(sourceY - targetY);
  if (rowDeltaY <= Number(spacing.workflowRowToleranceY)) return;
  const horizontal = longestHorizontalVertexSegment(vertices);
  if (!horizontal) return;
  const nodeHeight = Number(spacing.workflowNodeHeight || 86);
  const upperRowY = Math.min(sourceY, targetY);
  const lowerRowY = Math.max(sourceY, targetY);
  const routeY = horizontal.y;
  const minimumGap = Number(spacing.minimumRowGapForLabeledMidpointRoute || 40);
  const preferredGap = Number(spacing.minimumRowGapForMidpointRoute || 60);
  const tolerance = Number(spacing.rowGapRouteYTolerance || 12);
  const rowBands = workflowRowBandsBetween(nodes, sourceNode, targetNode, spacing);
  const occupiedBand = rowBands.find((band) => routeY >= band.top && routeY <= band.bottom);
  if (occupiedBand) {
    findings.push(issue("WORKFLOW_LAYOUT_ROUTE_Y_CROSSES_INTERMEDIATE_ROW", "Long cross-row connector horizontal segments must not run through any intermediate workflow row node bounds; route through an adjacent row-gap midpoint or a justified external lane.", {
      source: resource.source,
      workflowName: resource.workflowName,
      path: `${flowPath}.vertices`,
      flowId: flow.id,
      sourceId: refId(flow.shape.source),
      targetId: refId(flow.shape.target),
      routeY,
      occupiedRow: {
        top: occupiedBand.top,
        bottom: occupiedBand.bottom,
        nodeIds: occupiedBand.nodes.map((node) => node.id),
      },
    }));
    return;
  }
  const rowGaps = workflowRowGaps(rowBands);
  const matchingGap = rowGaps.find((gap) => routeY > gap.top && routeY < gap.bottom);
  const expectedRouteY = matchingGap ? Math.round((matchingGap.top + matchingGap.bottom) / 2) : Math.round((upperRowY + nodeHeight + lowerRowY) / 2);
  const netGap = matchingGap ? matchingGap.height : lowerRowY - (upperRowY + nodeHeight);
  const isInsideRowGap = Boolean(matchingGap);
  if (isInsideRowGap && netGap >= minimumGap && Math.abs(routeY - expectedRouteY) > tolerance) {
    findings.push(issue("WORKFLOW_LAYOUT_ROUTE_Y_NOT_ROW_GAP_MIDPOINT", "Cross-row connector horizontal segments in the row gap must route through the midpoint of the net gap between rows.", {
      source: resource.source,
      workflowName: resource.workflowName,
      path: `${flowPath}.vertices`,
      flowId: flow.id,
      sourceId: refId(flow.shape.source),
      targetId: refId(flow.shape.target),
      routeY,
      expectedRouteY,
      netGap,
      rowGap: matchingGap ? { top: matchingGap.top, bottom: matchingGap.bottom } : null,
      tolerance,
    }));
  }
  if (isInsideRowGap && netGap < minimumGap && flowLabel(flow.shape)) {
    findings.push(issue("WORKFLOW_LAYOUT_ROW_GAP_TOO_SMALL_FOR_LABELED_ROUTE", "Labeled cross-row connectors must not be routed through a row gap that is too small; increase row spacing or use a justified external return lane.", {
      source: resource.source,
      workflowName: resource.workflowName,
      path: `${flowPath}.vertices`,
      flowId: flow.id,
      sourceId: refId(flow.shape.source),
      targetId: refId(flow.shape.target),
      routeY,
      netGap,
      minimumGap,
    }));
  }
  const firstBand = rowBands[0] || { top: upperRowY, bottom: upperRowY + nodeHeight };
  const lastBand = rowBands[rowBands.length - 1] || { top: lowerRowY, bottom: lowerRowY + nodeHeight };
  const isOutsideRows = routeY <= firstBand.top - Number(spacing.externalReturnLanePaddingMin || 80) || routeY >= lastBand.bottom + Number(spacing.externalReturnLanePaddingMin || 80);
  const dx = Math.abs(Number(targetNode.position.x) - Number(sourceNode.position.x));
  const isBackwardOrReturn = Number(targetNode.position.x) < Number(sourceNode.position.x) || isReturnFlow(flow.shape);
  if (isOutsideRows && netGap >= preferredGap && dx < Number(spacing.longFlowVertexRequiredDeltaX || 700) && !isBackwardOrReturn) {
    findings.push(issue("WORKFLOW_LAYOUT_EXTERNAL_RETURN_LANE_UNJUSTIFIED", "External return lanes are reserved for long backward, return, or crowded reroutes; short cross-row connectors should use row-gap midpoint routing or direct auto-routing.", {
      source: resource.source,
      workflowName: resource.workflowName,
      path: `${flowPath}.vertices`,
      flowId: flow.id,
      sourceId: refId(flow.shape.source),
      targetId: refId(flow.shape.target),
      routeY,
      netGap,
      deltaX: dx,
    }));
  }
}

function validateFlowRouteX({ resource, flow, flowPath, sourceNode, targetNode, nodes, vertices, spacing, findings }) {
  if (!sourceNode?.position || !targetNode?.position || !vertices.length) return;
  if (stencilId(targetNode.shape) === "EndRejectEvent" || stencilId(sourceNode.shape) === "EndRejectEvent") return;
  const vertical = longestVerticalVertexSegment(vertices);
  if (!vertical) return;
  const nodeHeight = Number(spacing.workflowNodeHeight || 86);
  if (vertical.length < nodeHeight) return;
  const routeX = vertical.x;
  const tolerance = Number(spacing.columnGapRouteXTolerance || 12);
  const minimumGap = Number(spacing.minimumColumnGapForMidpointRoute || 48);
  const sourceId = refId(flow.shape.source);
  const targetId = refId(flow.shape.target);
  const crossingNode = nodes.find((node) => {
    if (!node.position || node.id === sourceId || node.id === targetId) return false;
    const bounds = nodeBounds(node);
    const overlapsY = vertical.bottom >= bounds.top && vertical.top <= bounds.bottom;
    return overlapsY && routeX >= bounds.left && routeX <= bounds.right;
  });
  if (crossingNode) {
    const bounds = nodeBounds(crossingNode);
    findings.push(issue("WORKFLOW_LAYOUT_ROUTE_X_CROSSES_INTERMEDIATE_COLUMN", "Long connector vertical segments must not run through intermediate workflow node bounds; route through an adjacent column-gap midpoint or a justified external lane.", {
      source: resource.source,
      workflowName: resource.workflowName,
      path: `${flowPath}.vertices`,
      flowId: flow.id,
      sourceId,
      targetId,
      routeX,
      verticalSegment: { top: vertical.top, bottom: vertical.bottom },
      occupiedColumn: {
        left: bounds.left,
        right: bounds.right,
        nodeId: crossingNode.id,
      },
    }));
    return;
  }
  const columnBands = workflowColumnBandsBetween(nodes, sourceNode, targetNode, spacing);
  const columnGaps = workflowColumnGaps(columnBands);
  const matchingGap = columnGaps.find((gap) => routeX > gap.left && routeX < gap.right);
  if (!matchingGap || matchingGap.width < minimumGap) return;
  const expectedRouteX = Math.round((matchingGap.left + matchingGap.right) / 2);
  if (Math.abs(routeX - expectedRouteX) > tolerance) {
    findings.push(issue("WORKFLOW_LAYOUT_ROUTE_X_NOT_COLUMN_GAP_MIDPOINT", "Connector vertical segments in a column gap must route through the midpoint of the net gap between adjacent columns.", {
      source: resource.source,
      workflowName: resource.workflowName,
      path: `${flowPath}.vertices`,
      flowId: flow.id,
      sourceId,
      targetId,
      routeX,
      expectedRouteX,
      netGap: matchingGap.width,
      columnGap: { left: matchingGap.left, right: matchingGap.right },
      tolerance,
    }));
  }
}

function workflowRowBandsBetween(nodes, sourceNode, targetNode, spacing) {
  const tolerance = Number(spacing.workflowRowToleranceY || 60);
  const sourceCenterY = nodeCenter(sourceNode).y;
  const targetCenterY = nodeCenter(targetNode).y;
  const minCenterY = Math.min(sourceCenterY, targetCenterY) - tolerance;
  const maxCenterY = Math.max(sourceCenterY, targetCenterY) + tolerance;
  return clusterRows(nodes.filter((node) => node.position), tolerance)
    .map((row) => {
      const top = Math.min(...row.nodes.map((node) => Number(node.position.y)));
      const bottom = Math.max(...row.nodes.map((node) => Number(node.position.y) + nodeSize(node).height));
      const centerY = (top + bottom) / 2;
      return { top, bottom, centerY, nodes: row.nodes };
    })
    .filter((band) => band.centerY >= minCenterY && band.centerY <= maxCenterY)
    .sort((left, right) => left.top - right.top);
}

function workflowColumnBandsBetween(nodes, sourceNode, targetNode, spacing) {
  const tolerance = Number(spacing.gatewayBranchColumnToleranceX || 80);
  const sourceCenterX = nodeCenter(sourceNode).x;
  const targetCenterX = nodeCenter(targetNode).x;
  const minCenterX = Math.min(sourceCenterX, targetCenterX) - tolerance;
  const maxCenterX = Math.max(sourceCenterX, targetCenterX) + tolerance;
  return clusterColumns(nodes.filter((node) => node.position), tolerance)
    .map((column) => {
      const left = Math.min(...column.nodes.map((node) => Number(node.position.x)));
      const right = Math.max(...column.nodes.map((node) => Number(node.position.x) + nodeSize(node).width));
      const centerX = (left + right) / 2;
      return { left, right, centerX, nodes: column.nodes };
    })
    .filter((band) => band.centerX >= minCenterX && band.centerX <= maxCenterX)
    .sort((left, right) => left.left - right.left);
}

function workflowRowGaps(rowBands) {
  const gaps = [];
  for (let index = 0; index < rowBands.length - 1; index += 1) {
    const top = rowBands[index].bottom;
    const bottom = rowBands[index + 1].top;
    if (bottom > top) gaps.push({ top, bottom, height: bottom - top });
  }
  return gaps;
}

function workflowColumnGaps(columnBands) {
  const gaps = [];
  for (let index = 0; index < columnBands.length - 1; index += 1) {
    const left = columnBands[index].right;
    const right = columnBands[index + 1].left;
    if (right > left) gaps.push({ left, right, width: right - left });
  }
  return gaps;
}

function longestHorizontalVertexSegment(vertices) {
  const points = asArray(vertices)
    .filter((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)))
    .map((point) => ({ x: Number(point.x), y: Number(point.y) }));
  let best = null;
  for (let index = 0; index < points.length - 1; index += 1) {
    const left = points[index];
    const right = points[index + 1];
    if (Math.abs(left.y - right.y) > 1) continue;
    const length = Math.abs(right.x - left.x);
    if (!best || length > best.length) best = { y: Math.round((left.y + right.y) / 2), length };
  }
  return best;
}

function longestVerticalVertexSegment(vertices) {
  const points = asArray(vertices)
    .filter((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)))
    .map((point) => ({ x: Number(point.x), y: Number(point.y) }));
  let best = null;
  for (let index = 0; index < points.length - 1; index += 1) {
    const top = points[index];
    const bottom = points[index + 1];
    if (Math.abs(top.x - bottom.x) > 1) continue;
    const y1 = Math.min(top.y, bottom.y);
    const y2 = Math.max(top.y, bottom.y);
    const length = y2 - y1;
    if (!best || length > best.length) best = { x: Math.round((top.x + bottom.x) / 2), top: y1, bottom: y2, length };
  }
  return best;
}

function verticalVertexSegments(vertices) {
  const points = asArray(vertices)
    .filter((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)))
    .map((point) => ({ x: Number(point.x), y: Number(point.y) }));
  const segments = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const top = points[index];
    const bottom = points[index + 1];
    if (Math.abs(top.x - bottom.x) > 1) continue;
    const y1 = Math.min(top.y, bottom.y);
    const y2 = Math.max(top.y, bottom.y);
    segments.push({
      x: Math.round((top.x + bottom.x) / 2),
      top: y1,
      bottom: y2,
      length: y2 - y1,
    });
  }
  return segments;
}

function connectorLabelBounds(flow, sourceNode, targetNode, spacing) {
  const label = flowLabel(flow);
  if (!label) return null;
  const anchor = connectorLabelAnchor(flow, sourceNode, targetNode);
  if (!anchor) return null;
  const width = label.length * Number(spacing.connectorLabelApproxCharWidth || 7) + Number(spacing.connectorLabelPaddingX || 24);
  const height = Number(spacing.connectorLabelHeight || 24);
  return {
    left: anchor.x - width / 2,
    right: anchor.x + width / 2,
    top: anchor.y - height / 2,
    bottom: anchor.y + height / 2,
  };
}

function connectorLabelAnchor(flow, sourceNode, targetNode) {
  const points = asArray(flow?.vertices)
    .filter((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)))
    .map((point) => ({ x: Number(point.x), y: Number(point.y) }));
  if (points.length >= 2) {
    let best = null;
    for (let index = 0; index < points.length - 1; index += 1) {
      const left = points[index];
      const right = points[index + 1];
      const length = Math.hypot(right.x - left.x, right.y - left.y);
      if (!best || length > best.length) {
        best = {
          length,
          x: (left.x + right.x) / 2,
          y: (left.y + right.y) / 2,
        };
      }
    }
    if (best) return { x: best.x, y: best.y };
  }
  if (sourceNode?.position && targetNode?.position) {
    const source = nodeCenter(sourceNode);
    const target = nodeCenter(targetNode);
    return {
      x: (source.x + target.x) / 2,
      y: (source.y + target.y) / 2,
    };
  }
  return null;
}

function boxesIntersect(left, right) {
  return left.left <= right.right
    && left.right >= right.left
    && left.top <= right.bottom
    && left.bottom >= right.top;
}

function inflateBox(box, padding) {
  return {
    left: box.left - padding,
    right: box.right + padding,
    top: box.top - padding,
    bottom: box.bottom + padding,
  };
}

function roundBox(box) {
  return {
    left: Math.round(box.left),
    right: Math.round(box.right),
    top: Math.round(box.top),
    bottom: Math.round(box.bottom),
  };
}

function validateWorkflowSemantics(resource, nodes, flows, spacing, findings) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const outgoingBySource = new Map();
  const incomingByTarget = new Map();
  for (const flow of flows) {
    const sourceId = refId(flow.shape.source);
    const targetId = refId(flow.shape.target);
    if (!outgoingBySource.has(sourceId)) outgoingBySource.set(sourceId, []);
    if (!incomingByTarget.has(targetId)) incomingByTarget.set(targetId, []);
    outgoingBySource.get(sourceId).push(flow);
    incomingByTarget.get(targetId).push(flow);
  }

  for (const node of nodes) {
    if (!isAssignmentTask(node)) continue;
    const outgoing = outgoingBySource.get(node.id) || [];
    const outcomes = new Set(outgoing.map((flow) => normalizeOutcome(extractTaskOutcome(flow.shape))).filter(Boolean));
    if (isCompleteAssignmentTask(node)) {
      const misspelled = outgoing.find((flow) => String(extractTaskOutcome(flow.shape) || "").trim().toLowerCase().replace(/[^a-z]/g, "") === "comepleted");
      if (misspelled) {
        findings.push(issue("WORKFLOW_LAYOUT_COMPLETE_TASK_OUTCOME_MISSPELLED", "Complete Assignment Task outcome must use the canonical Completed spelling.", {
          source: resource.source,
          workflowName: resource.workflowName,
          path: `$.childshapes[${misspelled.index}]`,
          nodeId: node.id,
          flowId: misspelled.id,
          invalidOutcome: extractTaskOutcome(misspelled.shape),
          requiredOutcome: "Completed",
        }));
      }
      if (!outcomes.has("completed")) {
        findings.push(issue("WORKFLOW_LAYOUT_COMPLETE_TASK_OUTCOME_MISSING", "Complete Assignment Task nodes must expose a Completed outcome SequenceFlow.", {
          source: resource.source,
          workflowName: resource.workflowName,
          path: `$.childshapes[${node.index}]`,
          nodeId: node.id,
          nodeName: node.shape.properties?.name || "",
          outcomes: [...outcomes],
        }));
      }
      continue;
    }

    for (const requiredOutcome of ["approved", "rejected"]) {
      if (!outcomes.has(requiredOutcome)) {
        findings.push(issue("WORKFLOW_LAYOUT_APPROVAL_TASK_OUTCOME_MISSING", "Approval Assignment Task nodes must expose both Approved and Rejected outcome SequenceFlows.", {
          source: resource.source,
          workflowName: resource.workflowName,
          path: `$.childshapes[${node.index}]`,
          nodeId: node.id,
          nodeName: node.shape.properties?.name || "",
          missingOutcome: titleCase(requiredOutcome),
          outcomes: [...outcomes],
        }));
      }
    }

    const businessBranches = outgoing.filter((flow) => isBusinessConditionFlow(flow.shape));
    if (businessBranches.length > 1) {
      findings.push(issue("WORKFLOW_LAYOUT_BUSINESS_BRANCH_GATEWAY_MISSING", "Business-field branch fan-out must be modeled with an InclusiveGateway instead of direct condition fan-out from an Assignment Task.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `$.childshapes[${node.index}]`,
        nodeId: node.id,
        branchCount: businessBranches.length,
      }));
    }
  }

  for (const gateway of nodes.filter((node) => stencilId(node.shape) === "InclusiveGateway")) {
    const outgoing = (outgoingBySource.get(gateway.id) || []).filter((flow) => isBusinessConditionFlow(flow.shape));
    if (outgoing.length < 2) continue;
    const targetNodes = outgoing.map((flow) => nodeById.get(refId(flow.shape.target))).filter((target) => target?.position);
    if (targetNodes.length < 2) continue;
    const xs = targetNodes.map((target) => target.position.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    if (maxX - minX > Number(spacing.gatewayBranchColumnToleranceX)) {
      findings.push(issue("WORKFLOW_LAYOUT_GATEWAY_BRANCH_COLUMN_MISMATCH", "InclusiveGateway branch targets should share the same vertical column when they represent parallel condition choices.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `$.childshapes[${gateway.index}]`,
        nodeId: gateway.id,
        targetColumns: xs,
        tolerance: Number(spacing.gatewayBranchColumnToleranceX),
      }));
    }
    const labelCandidates = outgoing
      .map((flow) => ({ flow, target: nodeById.get(refId(flow.shape.target)), label: flowLabel(flow.shape) }))
      .filter((item) => item.target?.position && item.label.length >= Number(spacing.gatewayLabelCongestionMinLength));
    for (let leftIndex = 0; leftIndex < labelCandidates.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < labelCandidates.length; rightIndex += 1) {
        const left = labelCandidates[leftIndex];
        const right = labelCandidates[rightIndex];
        const targetDeltaY = Math.abs(left.target.position.y - right.target.position.y);
        if (targetDeltaY <= Number(spacing.gatewayLabelLaneToleranceY)) {
          findings.push(issue("WORKFLOW_LAYOUT_GATEWAY_BRANCH_LABEL_CONGESTION", "Long InclusiveGateway branch labels must not share the same horizontal label lane; separate sibling branch targets vertically or shorten labels.", {
            source: resource.source,
            workflowName: resource.workflowName,
            path: `$.childshapes[${gateway.index}]`,
            nodeId: gateway.id,
            labels: [
              { flowId: left.flow.id, label: left.label, targetId: refId(left.flow.shape.target), targetY: left.target.position.y },
              { flowId: right.flow.id, label: right.label, targetId: refId(right.flow.shape.target), targetY: right.target.position.y },
            ],
            tolerance: Number(spacing.gatewayLabelLaneToleranceY),
          }));
        }
      }
    }
  }

  const assignmentRows = clusterRows(nodes.filter((node) => node.position && isAssignmentTask(node) && !isCompleteAssignmentTask(node)), Number(spacing.workflowRowToleranceY));
  const firstAssignmentRowY = assignmentRows.length ? Math.min(...assignmentRows.map((row) => row.y)) : null;

  for (const endReject of nodes.filter((node) => stencilId(node.shape) === "EndRejectEvent")) {
    const incomingRejected = (incomingByTarget.get(endReject.id) || [])
      .filter((flow) => isRejectedFlow(flow.shape))
      .map((flow) => nodeById.get(refId(flow.shape.source)))
      .filter((sourceNode) => sourceNode?.position && isAssignmentTask(sourceNode) && !isCompleteAssignmentTask(sourceNode));
    if (!incomingRejected.length || !endReject.position) continue;
    const maxSources = Number(spacing.maximumRejectedSourcesPerEnd);
    if (incomingRejected.length > maxSources) {
      findings.push(issue("WORKFLOW_LAYOUT_END_REJECT_TOO_MANY_SOURCES", "A shared End with Rejection node should collect at most three adjacent Approval Assignment Task rejected paths.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `$.childshapes[${endReject.index}]`,
        nodeId: endReject.id,
        incomingRejectedSources: incomingRejected.map((sourceNode) => sourceNode.id),
        maximum: maxSources,
      }));
    }
    const sourceCenters = incomingRejected.map((sourceNode) => nodeCenter(sourceNode));
    const endRejectCenter = nodeCenter(endReject);
    const minX = Math.min(...sourceCenters.map((center) => center.x));
    const maxX = Math.max(...sourceCenters.map((center) => center.x));
    const centerX = (minX + maxX) / 2;
    const sourceSpanX = maxX - minX;
    if (incomingRejected.length > 1 && sourceSpanX > Number(spacing.endRejectSourceSpanMax)) {
      findings.push(issue("WORKFLOW_LAYOUT_END_REJECT_SOURCE_SPAN_TOO_WIDE", "End with Rejection nodes should collect only local adjacent approval tasks; split distant rejected sources into separate local rejection endpoints.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `$.childshapes[${endReject.index}]`,
        nodeId: endReject.id,
        incomingRejectedSources: incomingRejected.map((sourceNode, index) => ({ id: sourceNode.id, centerX: sourceCenters[index].x })),
        sourceSpanX,
        maximumSuggestedSpan: Number(spacing.endRejectSourceSpanMax),
      }));
    }
    const minY = Math.min(...sourceCenters.map((center) => center.y));
    const maxY = Math.max(...sourceCenters.map((center) => center.y));
    const sourceYSpan = maxY - minY;
    if (sourceYSpan > Number(spacing.endRejectSharedLaneToleranceY)) {
      findings.push(issue("WORKFLOW_LAYOUT_END_REJECT_SOURCE_LANES_MISMATCH", "A shared End with Rejection node may only collect rejected paths from Approval Assignment Tasks on the same horizontal lane.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `$.childshapes[${endReject.index}]`,
        nodeId: endReject.id,
        incomingRejectedSources: incomingRejected.map((sourceNode, index) => ({ id: sourceNode.id, centerY: sourceCenters[index].y })),
        tolerance: Number(spacing.endRejectSharedLaneToleranceY),
      }));
    }
    const above = endRejectCenter.y < minY;
    const below = endRejectCenter.y > maxY;
    const verticalSeparation = above ? minY - endRejectCenter.y : below ? endRejectCenter.y - maxY : 0;
    if (firstAssignmentRowY !== null) {
      const sourceRowY = sourceCenters.reduce((sum, center) => sum + center.y, 0) / sourceCenters.length;
      const sourceOnFirstAssignmentRow = Math.abs(sourceRowY - firstAssignmentRowY) <= Number(spacing.workflowRowToleranceY);
      if ((sourceOnFirstAssignmentRow && !above) || (!sourceOnFirstAssignmentRow && !below)) {
        findings.push(issue("WORKFLOW_LAYOUT_END_REJECT_ROW_DIRECTION_MISMATCH", "End with Rejection nodes must be placed above first-row approval tasks and below approval tasks on lower rows.", {
          source: resource.source,
          workflowName: resource.workflowName,
          path: `$.childshapes[${endReject.index}].position`,
          nodeId: endReject.id,
          sourceRowY,
          firstAssignmentRowY,
          expectedPlacement: sourceOnFirstAssignmentRow ? "above" : "below",
          actualPlacement: above ? "above" : below ? "below" : "same-row",
          endRejectCenter,
        }));
      }
    }
    if (Math.abs(endRejectCenter.x - centerX) > Number(spacing.endRejectCenterToleranceX) || verticalSeparation < Number(spacing.endRejectVerticalSeparationMin)) {
      findings.push(issue("WORKFLOW_LAYOUT_END_REJECT_POSITION_MISMATCH", "End with Rejection nodes must be vertically above or below their source approval task group and centered on that group.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `$.childshapes[${endReject.index}].position`,
        nodeId: endReject.id,
        sourceGroupCenterX: centerX,
        endRejectCenterX: endRejectCenter.x,
        endRejectPosition: endReject.position,
        verticalSeparation,
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

function validateCanvasRows(nodes, spacing, resource, findings) {
  const positioned = nodes.filter((node) => node.position);
  if (positioned.length < 5) return;
  const xs = positioned.map((node) => node.position.x);
  const ys = positioned.map((node) => node.position.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  const rowTolerance = Number(spacing.workflowRowToleranceY);
  const rows = clusterRows(positioned, rowTolerance);
  const maximumRows = Number(spacing.maximumWorkflowRows);
  const rowNodeDensityThreshold = Number(spacing.rowNodeDensityThreshold);
  for (const row of rows) {
    if (positioned.length >= Number(spacing.mediumWorkflowNodeThreshold) && row.nodes.length > rowNodeDensityThreshold) {
      findings.push(issue("WORKFLOW_LAYOUT_ROW_NODE_DENSITY_TOO_HIGH", "A complex workflow row contains too many nodes; split later steps or branch targets into upper/lower lanes so labels and routing stay readable.", {
        source: resource.source,
        workflowName: resource.workflowName,
        rowY: Math.round(row.y),
        rowNodeCount: row.nodes.length,
        maximumSuggestedNodes: rowNodeDensityThreshold,
        nodeIds: row.nodes.map((node) => node.id),
      }));
    }
  }
  if (rows.length > maximumRows) {
    findings.push(issue("WORKFLOW_LAYOUT_TOO_MANY_VERTICAL_ROWS", "Generated workflow diagrams should use at most five readable vertical rows within the Designer canvas.", {
      source: resource.source,
      workflowName: resource.workflowName,
      nodeCount: positioned.length,
      rowCount: rows.length,
      maximumRows,
      rowYValues: rows.map((row) => Math.round(row.y)),
    }));
  }
  const sprawlThreshold = Number(spacing.singleRowSprawlNodeThreshold);
  const maxAspect = Number(spacing.singleRowSprawlAspectRatio);
  const aspect = width / Math.max(height, 1);
  if (positioned.length >= sprawlThreshold && rows.length <= 1 && aspect > maxAspect) {
    findings.push(issue("WORKFLOW_LAYOUT_SINGLE_ROW_SPRAWL", "Large workflows should use the roughly 16:9 Designer canvas area by adding vertical rows instead of placing every node on one long horizontal line.", {
      source: resource.source,
      workflowName: resource.workflowName,
      nodeCount: positioned.length,
      rowCount: rows.length,
      bounds: { width, height },
      aspectRatio: Number(aspect.toFixed(2)),
      targetAspectRatio: Number(spacing.targetCanvasAspectRatio),
      maximumSingleRowAspectRatio: maxAspect,
    }));
  }
  const mediumThreshold = Number(spacing.mediumWorkflowNodeThreshold);
  const mediumMaxWidth = Number(spacing.mediumWorkflowMaxWidth);
  const readableWidthAllowance = Number(spacing.mediumWorkflowReadableWidthAllowance || mediumMaxWidth);
  const minRowsForWideAllowance = Number(spacing.mediumWorkflowMinRowsForWideAllowance || 3);
  const maxRowNodeCount = Math.max(...rows.map((row) => row.nodes.length));
  const tooWideWithoutReadableFolding = width > mediumMaxWidth
    && (
      width > readableWidthAllowance
      || rows.length < minRowsForWideAllowance
      || maxRowNodeCount > rowNodeDensityThreshold
    );
  if (positioned.length >= mediumThreshold && positioned.length < 26 && tooWideWithoutReadableFolding) {
    findings.push(issue("WORKFLOW_LAYOUT_MEDIUM_GRAPH_TOO_WIDE", "Medium-complexity workflows should fold later branches into upper or lower lanes instead of stretching into a very wide horizontal strip.", {
      source: resource.source,
      workflowName: resource.workflowName,
      nodeCount: positioned.length,
      rowCount: rows.length,
      maxRowNodeCount,
      bounds: { width, height },
      maximumSuggestedWidth: mediumMaxWidth,
      readableWidthAllowance,
      rule: "Width is an advisory readability signal. Do not compress standard node spacing just to satisfy this value; fix real overlap, lane density, and vertex-overuse failures first.",
    }, "warning"));
  }
}

function validateConnectorReadability(resource, nodes, flows, spacing, findings) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  validateVerticalRouteLaneDensity(resource, flows, spacing, findings);
  validateConnectorLabelReadability(resource, nodes, flows, nodeById, spacing, findings);
}

function validateWorkflowMotifs(resource, nodes, flows, spacing, findings) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  validateGatewayLocalFanOut(resource, nodes, flows, nodeById, spacing, findings);
  validateEndMergeLocality(resource, flows, nodeById, spacing, findings);
  validateLocalRejectVertexEconomy(resource, flows, nodeById, spacing, findings);
  validateConnectorLabelLength(resource, flows, spacing, findings);
}

function validateGatewayLocalFanOut(resource, nodes, flows, nodeById, spacing, findings) {
  const maxDeltaX = Number(spacing.gatewayBranchLocalMaxDeltaX || 650);
  for (const gateway of nodes.filter((node) => stencilId(node.shape) === "InclusiveGateway" && node.position)) {
    const gatewayCenter = nodeCenter(gateway);
    const businessTargets = flows
      .filter((flow) => refId(flow.shape.source) === gateway.id && isBusinessConditionFlow(flow.shape))
      .map((flow) => ({ flow, targetNode: nodeById.get(refId(flow.shape.target)) }))
      .filter(({ targetNode }) => targetNode?.position && !["EndRejectEvent", "EndNoneEvent"].includes(stencilId(targetNode.shape)));
    if (businessTargets.length < 2) continue;
    for (const { flow, targetNode } of businessTargets) {
      const targetCenter = nodeCenter(targetNode);
      const deltaX = targetCenter.x - gatewayCenter.x;
      if (deltaX < -Number(spacing.minimumForwardFlowDeltaX || 180) || deltaX > maxDeltaX) {
        findings.push(issue("WORKFLOW_LAYOUT_GATEWAY_BRANCH_TOO_FAR", "InclusiveGateway branches must fan out into nearby upper/lower lanes like the golden reference; do not send condition branches far across the canvas and repair them with long connectors.", {
          source: resource.source,
          workflowName: resource.workflowName,
          gatewayId: gateway.id,
          flowId: flow.id,
          targetId: targetNode.id,
          label: flowLabel(flow.shape),
          deltaX: Math.round(deltaX),
          maximumSuggestedDeltaX: maxDeltaX,
        }));
      }
    }
  }
}

function validateEndMergeLocality(resource, flows, nodeById, spacing, findings) {
  const maxDeltaX = Number(spacing.endMergeMaxDeltaX || 650);
  const verticalTolerance = Number(spacing.endMergeVerticalToleranceY || 130);
  const incomingByTarget = new Map();
  for (const flow of flows) {
    const targetId = refId(flow.shape.target);
    if (!incomingByTarget.has(targetId)) incomingByTarget.set(targetId, []);
    incomingByTarget.get(targetId).push(flow);
  }
  for (const [targetId, incoming] of incomingByTarget.entries()) {
    const endNode = nodeById.get(targetId);
    if (!endNode?.position || stencilId(endNode.shape) !== "EndNoneEvent" || incoming.length < 2) continue;
    const sourceNodes = incoming
      .map((flow) => nodeById.get(refId(flow.shape.source)))
      .filter((node) => node?.position && stencilId(node.shape) !== "StartNoneEvent");
    if (sourceNodes.length < 2) continue;
    const endCenter = nodeCenter(endNode);
    const sourceCenters = sourceNodes.map((node) => nodeCenter(node));
    const maxSourceX = Math.max(...sourceCenters.map((center) => center.x));
    const minSourceY = Math.min(...sourceCenters.map((center) => center.y));
    const maxSourceY = Math.max(...sourceCenters.map((center) => center.y));
    const deltaX = endCenter.x - maxSourceX;
    if (deltaX < -Number(spacing.minimumForwardFlowDeltaX || 180) || deltaX > maxDeltaX) {
      findings.push(issue("WORKFLOW_LAYOUT_END_MERGE_TOO_FAR", "End nodes with multiple incoming branches should be a local merge beside the incoming source group, not a distant fixed endpoint that creates long wrapping connectors.", {
        source: resource.source,
        workflowName: resource.workflowName,
        endId: endNode.id,
        incomingSourceIds: sourceNodes.map((node) => node.id),
        deltaX: Math.round(deltaX),
        maximumSuggestedDeltaX: maxDeltaX,
      }));
    }
    if (endCenter.y < minSourceY - verticalTolerance || endCenter.y > maxSourceY + verticalTolerance) {
      findings.push(issue("WORKFLOW_LAYOUT_END_MERGE_VERTICAL_MISMATCH", "End nodes with multiple incoming branches should be vertically aligned with the incoming branch group so the final merge remains readable.", {
        source: resource.source,
        workflowName: resource.workflowName,
        endId: endNode.id,
        incomingSourceIds: sourceNodes.map((node) => node.id),
        endCenterY: Math.round(endCenter.y),
        sourceCenterYRange: { min: Math.round(minSourceY), max: Math.round(maxSourceY) },
        verticalTolerance,
      }));
    }
  }
}

function validateLocalRejectVertexEconomy(resource, flows, nodeById, spacing, findings) {
  const maxDeltaX = Number(spacing.localRejectVertexMaxDeltaX || 760);
  const maxDeltaY = Number(spacing.localRejectVertexMaxDeltaY || 260);
  for (const flow of flows) {
    const vertices = asArray(flow.shape.vertices);
    if (!vertices.length || !isRejectedFlow(flow.shape)) continue;
    const sourceNode = nodeById.get(refId(flow.shape.source));
    const targetNode = nodeById.get(refId(flow.shape.target));
    if (!sourceNode?.position || !targetNode?.position || stencilId(targetNode.shape) !== "EndRejectEvent") continue;
    const sourceCenter = nodeCenter(sourceNode);
    const targetCenter = nodeCenter(targetNode);
    const deltaX = Math.abs(targetCenter.x - sourceCenter.x);
    const deltaY = Math.abs(targetCenter.y - sourceCenter.y);
    if (deltaX <= maxDeltaX && deltaY <= maxDeltaY) {
      findings.push(issue("WORKFLOW_LAYOUT_LOCAL_REJECT_VERTICES_UNNECESSARY", "Local rejected connectors to a nearby End with rejection node should use clean rounded auto-routing with no vertices, matching the golden reference.", {
        source: resource.source,
        workflowName: resource.workflowName,
        flowId: flow.id,
        sourceId: sourceNode.id,
        targetId: targetNode.id,
        delta: { x: Math.round(deltaX), y: Math.round(deltaY) },
        vertexCount: vertices.length,
      }));
    }
  }
}

function validateConnectorLabelLength(resource, flows, spacing, findings) {
  const maxChars = Number(spacing.connectorLabelMaxChars || 42);
  for (const flow of flows) {
    const label = flowLabel(flow.shape);
    if (!label || label.length <= maxChars || !isBusinessConditionFlow(flow.shape)) continue;
    findings.push(issue("WORKFLOW_LAYOUT_CONNECTOR_LABEL_TOO_LONG", "Connector display labels should be short like the golden reference; keep full logic in conditioninfo and use concise labels to avoid Designer overlap.", {
      source: resource.source,
      workflowName: resource.workflowName,
      flowId: flow.id,
      label,
      length: label.length,
      maximumSuggestedLength: maxChars,
    }));
  }
}

function validateVertexEconomy(resource, nodes, flows, spacing, findings) {
  const threshold = Number(spacing.vertexEconomyNodeThreshold || 8);
  if (nodes.length < threshold || !flows.length) return;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const routedFlows = flows
    .map((flow) => ({ flow, vertices: asArray(flow.shape.vertices) }))
    .filter((entry) => entry.vertices.length);
  if (!routedFlows.length) return;
  const nonReturnRouted = routedFlows.filter(({ flow }) => {
    const sourceNode = nodeById.get(refId(flow.shape.source));
    const targetNode = nodeById.get(refId(flow.shape.target));
    if (!sourceNode?.position || !targetNode?.position) return false;
    const signedDx = targetNode.position.x - sourceNode.position.x;
    const sourceStencil = stencilId(sourceNode.shape);
    const targetStencil = stencilId(targetNode.shape);
    if (targetStencil === "EndRejectEvent" || sourceStencil === "EndRejectEvent") return false;
    if (isRejectedFlow(flow.shape) || isReturnFlow(flow.shape) || signedDx < 0) return false;
    return true;
  });
  const maxNonReturn = Math.max(2, Math.floor(flows.length * Number(spacing.maxNonReturnVertexFlowRatio || 0.25)));
  const averageVerticesPerFlow = routedFlows.reduce((sum, entry) => sum + entry.vertices.length, 0) / flows.length;
  const maxAverage = Number(spacing.maxAverageVerticesPerFlow || 1.25);
  if (nonReturnRouted.length > maxNonReturn || averageVerticesPerFlow > maxAverage) {
    findings.push(issue("WORKFLOW_LAYOUT_VERTICES_OVERUSED", "Workflow layout must be node-placement first: if many non-return connectors need vertices, move nodes into clearer reference-template lanes instead of repairing the diagram with line bends.", {
      source: resource.source,
      workflowName: resource.workflowName,
      nodeCount: nodes.length,
      flowCount: flows.length,
      routedFlowCount: routedFlows.length,
      nonReturnRoutedFlowCount: nonReturnRouted.length,
      maxNonReturnRoutedFlowCount: maxNonReturn,
      averageVerticesPerFlow: Number(averageVerticesPerFlow.toFixed(2)),
      maxAverageVerticesPerFlow: maxAverage,
      routedFlows: nonReturnRouted.map(({ flow, vertices }) => ({
        flowId: flow.id,
        sourceId: refId(flow.shape.source),
        targetId: refId(flow.shape.target),
        vertexCount: vertices.length,
        label: flowLabel(flow.shape),
      })),
    }));
  }
}

function validateConnectorDetourEconomy(resource, nodes, flows, spacing, findings) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const maxRatio = Number(spacing.connectorDetourRatioMax || 2.35);
  for (const flow of flows) {
    const vertices = asArray(flow.shape.vertices);
    if (!vertices.length) continue;
    const sourceNode = nodeById.get(refId(flow.shape.source));
    const targetNode = nodeById.get(refId(flow.shape.target));
    if (!sourceNode?.position || !targetNode?.position) continue;
    if (stencilId(targetNode.shape) === "EndRejectEvent" || stencilId(sourceNode.shape) === "EndRejectEvent") continue;
    const points = [nodeCenter(sourceNode), ...vertices.map((vertex) => ({ x: Number(vertex.x), y: Number(vertex.y) })), nodeCenter(targetNode)]
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (points.length < 3) continue;
    const direct = Math.max(1, Math.abs(nodeCenter(targetNode).x - nodeCenter(sourceNode).x) + Math.abs(nodeCenter(targetNode).y - nodeCenter(sourceNode).y));
    const routed = polylineManhattanLength(points);
    const ratio = routed / direct;
    if (ratio > maxRatio) {
      findings.push(issue("WORKFLOW_LAYOUT_CONNECTOR_DETOUR_TOO_HIGH", "Connector vertices must not create a long detour around a poor node layout; move the source/target nodes into a local golden-reference motif instead.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `$.childshapes[${flow.index}].vertices`,
        flowId: flow.id,
        sourceId: refId(flow.shape.source),
        targetId: refId(flow.shape.target),
        label: flowLabel(flow.shape),
        directManhattanLength: Math.round(direct),
        routedManhattanLength: Math.round(routed),
        detourRatio: Number(ratio.toFixed(2)),
        maxDetourRatio: maxRatio,
      }));
    }
  }
}

function validateVerticalRouteLaneDensity(resource, flows, spacing, findings) {
  const toleranceX = Number(spacing.verticalRouteLaneDensityToleranceX || 18);
  const maximumSegments = Number(spacing.verticalRouteLaneDensityMaxSegments || 2);
  const minimumLength = Number(spacing.workflowNodeHeight || 86);
  const groups = [];
  for (const flow of flows) {
    const vertices = asArray(flow.shape.vertices);
    for (const segment of verticalVertexSegments(vertices)) {
      if (segment.length < minimumLength) continue;
      let group = groups.find((item) => Math.abs(item.x - segment.x) <= toleranceX);
      if (!group) {
        group = { x: segment.x, segments: [] };
        groups.push(group);
      }
      group.segments.push({ ...segment, flow });
      group.x = group.segments.reduce((sum, item) => sum + item.x, 0) / group.segments.length;
    }
  }
  for (const group of groups) {
    const longSegments = group.segments.filter((segment) => segment.length >= minimumLength);
    if (longSegments.length <= maximumSegments) continue;
    const sorted = longSegments.sort((left, right) => left.top - right.top);
    const laneSpan = {
      top: Math.min(...sorted.map((segment) => segment.top)),
      bottom: Math.max(...sorted.map((segment) => segment.bottom)),
    };
    findings.push(issue("WORKFLOW_LAYOUT_VERTICAL_ROUTE_LANE_DENSITY_TOO_HIGH", "Too many long vertical connector segments share the same routing lane; use lane offsets or more local routes so the workflow does not render as a vertical line wall.", {
      source: resource.source,
      workflowName: resource.workflowName,
      routeX: Math.round(group.x),
      toleranceX,
      maximumSegments,
      segmentCount: longSegments.length,
      laneSpan,
      segments: sorted.map((segment) => ({
        flowId: segment.flow.id,
        sourceId: refId(segment.flow.shape.source),
        targetId: refId(segment.flow.shape.target),
        top: segment.top,
        bottom: segment.bottom,
      })),
    }));
  }
}

function validateConnectorLabelReadability(resource, nodes, flows, nodeById, spacing, findings) {
  const minLength = Number(spacing.connectorLabelCollisionMinLength || spacing.gatewayLabelCongestionMinLength || 16);
  const labels = [];
  for (const flow of flows) {
    const label = flowLabel(flow.shape);
    if (label.length < minLength) continue;
    const sourceNode = nodeById.get(refId(flow.shape.source));
    const targetNode = nodeById.get(refId(flow.shape.target));
    const bbox = connectorLabelBounds(flow.shape, sourceNode, targetNode, spacing);
    if (!bbox) continue;
    labels.push({ flow, label, bbox, sourceNode, targetNode });
    const padded = Number(spacing.connectorLabelNodePadding || 8);
    const collidingNode = nodes.find((node) => {
      if (!node.position || node.id === sourceNode?.id || node.id === targetNode?.id) return false;
      return boxesIntersect(bbox, inflateBox(nodeBounds(node), padded));
    });
    if (collidingNode) {
      findings.push(issue("WORKFLOW_LAYOUT_CONNECTOR_LABEL_NODE_COLLISION", "Long connector labels must not overlap workflow nodes; separate sibling branches vertically, shorten the label, or route the connector through a clearer lane.", {
        source: resource.source,
        workflowName: resource.workflowName,
        path: `$.childshapes[${flow.index}]`,
        flowId: flow.id,
        label,
        labelBounds: roundBox(bbox),
        nodeId: collidingNode.id,
        nodeBounds: roundBox(nodeBounds(collidingNode)),
      }));
    }
  }
  for (let leftIndex = 0; leftIndex < labels.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < labels.length; rightIndex += 1) {
      const left = labels[leftIndex];
      const right = labels[rightIndex];
      if (left.flow.id === right.flow.id || !boxesIntersect(left.bbox, right.bbox)) continue;
      findings.push(issue("WORKFLOW_LAYOUT_CONNECTOR_LABEL_COLLISION", "Long connector labels must not overlap each other; use distinct branch lanes, local routes, or shorter labels.", {
        source: resource.source,
        workflowName: resource.workflowName,
        labels: [
          { flowId: left.flow.id, label: left.label, bounds: roundBox(left.bbox) },
          { flowId: right.flow.id, label: right.label, bounds: roundBox(right.bbox) },
        ],
      }));
    }
  }
}

function clusterRows(positioned, tolerance) {
  const rows = [];
  for (const node of [...positioned].sort((left, right) => left.position.y - right.position.y)) {
    const existing = rows.find((row) => Math.abs(row.y - node.position.y) <= tolerance);
    if (existing) {
      existing.nodes.push(node);
      existing.y = existing.nodes.reduce((sum, item) => sum + item.position.y, 0) / existing.nodes.length;
    } else {
      rows.push({ y: node.position.y, nodes: [node] });
    }
  }
  return rows;
}

function clusterColumns(positioned, tolerance) {
  const columns = [];
  for (const node of [...positioned].sort((left, right) => left.position.x - right.position.x)) {
    const existing = columns.find((column) => Math.abs(column.x - node.position.x) <= tolerance);
    if (existing) {
      existing.nodes.push(node);
      existing.x = existing.nodes.reduce((sum, item) => sum + item.position.x, 0) / existing.nodes.length;
    } else {
      columns.push({ x: node.position.x, nodes: [node] });
    }
  }
  return columns;
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

function nodeSize(node) {
  const shape = node?.shape || node;
  const upperLeft = shape?.bounds?.upperLeft;
  const lowerRight = shape?.bounds?.lowerRight;
  if (
    isObject(upperLeft)
    && isObject(lowerRight)
    && Number.isFinite(Number(upperLeft.x))
    && Number.isFinite(Number(lowerRight.x))
    && Number.isFinite(Number(upperLeft.y))
    && Number.isFinite(Number(lowerRight.y))
  ) {
    return {
      width: Math.max(1, Number(lowerRight.x) - Number(upperLeft.x)),
      height: Math.max(1, Number(lowerRight.y) - Number(upperLeft.y)),
    };
  }
  return { width: 190, height: 86 };
}

function nodeCenter(node) {
  const position = node?.position || nodePosition(node?.shape || node) || { x: 0, y: 0 };
  const size = nodeSize(node);
  return {
    x: Number(position.x) + size.width / 2,
    y: Number(position.y) + size.height / 2,
  };
}

function nodeBounds(node) {
  const position = node?.position || nodePosition(node?.shape || node) || { x: 0, y: 0 };
  const size = nodeSize(node);
  const left = Number(position.x);
  const top = Number(position.y);
  return {
    left,
    right: left + size.width,
    top,
    bottom: top + size.height,
  };
}

function polylineManhattanLength(points) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += Math.abs(points[index].x - points[index - 1].x) + Math.abs(points[index].y - points[index - 1].y);
  }
  return total;
}

function isAssignmentTask(node) {
  return stencilId(node?.shape) === "MultiAssignmentTask";
}

function isCompleteAssignmentTask(node) {
  return String(node?.shape?.properties?.tasktype || "").trim().toLowerCase() === "complete";
}

function isRejectedFlow(flow) {
  const text = JSON.stringify({
    name: flow?.properties?.name || "",
    documentation: flow?.properties?.documentation || "",
    conditioninfo: flow?.properties?.conditioninfo || [],
  }).toLowerCase();
  return /rejected|reject|cancel|deny|decline|revoke|exception/.test(text);
}

function isSubmittedFlow(flow) {
  const text = JSON.stringify({
    name: flow?.properties?.name || "",
    documentation: flow?.properties?.documentation || "",
    conditioninfo: flow?.properties?.conditioninfo || [],
  }).toLowerCase();
  return /\bsubmitted?\b|\bsubmit\b/.test(text);
}

function isReturnFlow(flow) {
  const text = JSON.stringify({
    name: flow?.properties?.name || "",
    documentation: flow?.properties?.documentation || "",
    conditioninfo: flow?.properties?.conditioninfo || [],
  }).toLowerCase();
  return /return|resubmit|rework|send back|back to/.test(text);
}

function extractTaskOutcome(flow) {
  const text = JSON.stringify({
    name: flow?.properties?.name || "",
    documentation: flow?.properties?.documentation || "",
    conditioninfo: flow?.properties?.conditioninfo || [],
  });
  const taskOutcome = text.match(/Task outcome:([^"<>]+)/i);
  if (taskOutcome?.[1]) return taskOutcome[1].trim();
  const dataOutcome = text.match(/data=\\?"(Approved|Rejected|Completed|comepleted)\\?"/i);
  if (dataOutcome?.[1]) return dataOutcome[1].trim();
  const plainOutcome = text.match(/\b(Approved|Rejected|Completed|comepleted)\b/i);
  return plainOutcome?.[1]?.trim() || "";
}

function normalizeOutcome(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z]/g, "");
  if (normalized === "comepleted") return "completed";
  return normalized;
}

function isBusinessConditionFlow(flow) {
  const outcome = normalizeOutcome(extractTaskOutcome(flow));
  if (["approved", "rejected", "completed"].includes(outcome)) return false;
  const text = JSON.stringify({
    name: flow?.properties?.name || "",
    documentation: flow?.properties?.documentation || "",
    conditioninfo: flow?.properties?.conditioninfo || [],
  });
  return /(?:n\.|s\.|d\.|b\.)[<>=!]|[<>]=?|Amount|Total|Budget|Cost|Price|Score|Risk|Required|Sensitive|License|Availability|valueType\\?":\\?"(?:number|boolean|string|text)|valueType":"(?:number|boolean|string|text)/i.test(text);
}

function flowLabel(flow) {
  const props = flow?.properties || {};
  return String(props.documentation || props.name || "").trim();
}

function titleCase(value) {
  const text = String(value || "");
  return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : "";
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
