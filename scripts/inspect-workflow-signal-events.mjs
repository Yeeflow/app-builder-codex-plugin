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
    "  node scripts/inspect-workflow-signal-events.mjs <input.yap> --out-dir <normalized-dir>",
    "",
    "Decodes a Yeeflow .yap read-only and writes redacted Signal event normalized references.",
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
  return { data };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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
    .replace(PRIVATE_NUMBER_RE, "<REDACTED_PRIVATE_ID>");
}

function workflowHost(workflowType) {
  if (String(workflowType) === "1") return "data-list-workflow";
  if (String(workflowType) === "2") return "approval-form-workflow";
  if (String(workflowType) === "3") return "scheduled-workflow";
  return "unknown-workflow";
}

function collectFlowCounts(shapes) {
  const incoming = new Map();
  const outgoing = new Map();
  const sequenceFlows = [];
  for (const shape of shapes) {
    if (stencilId(shape) !== "SequenceFlow") continue;
    const source = String(shape.source?.resourceId || shape.source?.resourceid || shape.source?.id || "");
    const target = String(shape.target?.resourceId || shape.target?.resourceid || shape.target?.id || "");
    const flow = {
      id: shapeId(shape) ? "<REDACTED_SEQUENCE_FLOW_ID>" : "",
      source,
      target,
      name: redactText(shape.properties?.name || ""),
    };
    sequenceFlows.push(flow);
    if (source) outgoing.set(source, (outgoing.get(source) || 0) + 1);
    if (target) incoming.set(target, (incoming.get(target) || 0) + 1);
  }
  return { incoming, outgoing, sequenceFlows };
}

function summarizeExpression(value) {
  const tokenTypes = new Set();
  const exprTypes = new Set();
  const valueTypes = new Set();
  const references = [];
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!isObject(node)) return;
    if (node.type) tokenTypes.add(String(node.type));
    if (node.exprType) exprTypes.add(String(node.exprType));
    if (node.valueType) valueTypes.add(String(node.valueType));
    if (node.exprType || node.name || node.id || node.prop) {
      references.push({
        exprType: node.exprType || "",
        valueType: node.valueType || "",
        id: node.id ? "<REDACTED_EXPR_ID>" : undefined,
        prop: node.prop ? "<REDACTED_FIELD_REF>" : undefined,
        name: redactText(node.name || ""),
      });
    }
    for (const child of Object.values(node)) visit(child);
  };
  visit(value);
  return {
    shape: Array.isArray(value) ? "expression-token-array" : typeof value,
    tokenTypes: [...tokenTypes].sort(),
    exprTypes: [...exprTypes].sort(),
    valueTypes: [...valueTypes].sort(),
    references,
  };
}

function summarizeWhere(where, index) {
  return {
    index,
    key: where?.key ? "<REDACTED_CONDITION_ID>" : "",
    pre: where?.pre || "",
    left: where?.left || "",
    op: where?.op || "",
    right: summarizeExpression(where?.right),
    nestedConditionCount: Array.isArray(where?.conditions) ? where.conditions.length : 0,
  };
}

function summarizeContentList(shape) {
  const props = shape?.properties || {};
  const mappings = asArray(props.listdatas);
  const wheres = asArray(props.wheres);
  return {
    internalControlType: "ContentList",
    frontEndAction: "Set data list",
    nodeId: "<REDACTED_WORKFLOW_NODE_ID>",
    nodeName: redactText(props.name || ""),
    listtype: props.listtype || "",
    operationType: props.type || "",
    target: {
      appid: props.appid ? "<REDACTED_APP_ID>" : "",
      listsetid: props.listsetid ? "<REDACTED_LISTSET_ID>" : "",
      listid: props.listid ? "<REDACTED_LIST_ID>" : "",
    },
    listdatasCount: mappings.length,
    listdatas: mappings.map((entry, index) => ({
      index,
      Columns: entry?.Columns || "",
      Per: entry?.Per ?? "",
      Data: summarizeExpression(entry?.Data),
    })),
    wheresCount: wheres.length,
    wheres: wheres.map(summarizeWhere),
    broadMutationRisk: ["edit", "remove"].includes(String(props.type)) && wheres.length === 0,
  };
}

function summarizeStart(shape, flowCounts) {
  const props = shape?.properties || {};
  return {
    internalControlType: "StartNoneEvent",
    nodeId: "<REDACTED_WORKFLOW_NODE_ID>",
    nodeName: redactText(props.name || ""),
    incomingCount: flowCounts.incoming.get(shapeId(shape)) || asArray(shape.incoming).length,
    outgoingCount: flowCounts.outgoing.get(shapeId(shape)) || asArray(shape.outgoing).length,
    hasTerminateField: Object.prototype.hasOwnProperty.call(props, "terminate"),
    terminate: props.terminate,
    hasTerminateConditions: Object.prototype.hasOwnProperty.call(props, "terminate-conditions"),
    terminateConditionsShape: props["terminate-conditions"] === null ? "null" : Array.isArray(props["terminate-conditions"]) ? "array" : typeof props["terminate-conditions"],
    hasRevokeConditions: Object.prototype.hasOwnProperty.call(props, "revoke-conditions"),
    revokeConditionsShape: props["revoke-conditions"] === null ? "null" : Array.isArray(props["revoke-conditions"]) ? "array" : typeof props["revoke-conditions"],
    revokeConditionCount: Array.isArray(props["revoke-conditions"]) ? props["revoke-conditions"].length : 0,
    isenabledemail: props.isenabledemail,
    emailFieldsPresent: ["to", "subject", "html"].filter((field) => Object.prototype.hasOwnProperty.call(props, field)),
  };
}

function summarizeSignalEvent(form, shape, shapes, flowCounts) {
  const props = shape.properties || {};
  const outgoingFlows = flowCounts.sequenceFlows.filter((flow) => flow.source === shapeId(shape));
  const downstream = outgoingFlows
    .map((flow) => shapes.find((candidate) => shapeId(candidate) === flow.target))
    .filter(Boolean)
    .map((node) => {
      if (stencilId(node) === "ContentList") return summarizeContentList(node);
      return {
        internalControlType: stencilId(node),
        nodeId: "<REDACTED_WORKFLOW_NODE_ID>",
        nodeName: redactText(node.properties?.name || ""),
      };
    });

  return {
    proofLevel: "export-proven",
    frontEndAction: "Signal event",
    internalControlType: "SignalEvent",
    workflowHost: workflowHost(form.WorkflowType),
    workflowType: form.WorkflowType,
    workflowName: redactText(form.Name || form.Title || ""),
    nodeId: "<REDACTED_WORKFLOW_NODE_ID>",
    nodeName: redactText(props.name || ""),
    incomingCount: flowCounts.incoming.get(shapeId(shape)) || asArray(shape.incoming).length,
    outgoingCount: flowCounts.outgoing.get(shapeId(shape)) || asArray(shape.outgoing).length,
    eventdefinitionsShape: Array.isArray(props.eventdefinitions) ? "array" : typeof props.eventdefinitions,
    eventdefinitions: asArray(props.eventdefinitions),
    listensForCancel: asArray(props.eventdefinitions).includes("CancelEventDefinition"),
    listensForRevoke: asArray(props.eventdefinitions).includes("RevokeEventDefinition"),
    outgoingFlows: outgoingFlows.map((flow) => ({
      id: flow.id,
      name: flow.name,
      source: "<REDACTED_WORKFLOW_NODE_ID>",
      target: "<REDACTED_WORKFLOW_NODE_ID>",
    })),
    downstreamFirstActions: downstream,
  };
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function selectFirst(nodes, predicate) {
  return nodes.find(predicate);
}

function main() {
  const args = parseArgs(process.argv);
  const { data } = decodeYap(args.input);
  const signalEvents = [];
  const startActions = [];
  const hostShapeCounts = {};

  for (const form of asArray(data.Forms)) {
    const def = safeJson(form.DefResource, {});
    const shapes = asArray(def.childshapes || def.childShapes);
    const flowCounts = collectFlowCounts(shapes);
    const host = workflowHost(form.WorkflowType);
    hostShapeCounts[host] ||= {};
    for (const shape of shapes) {
      hostShapeCounts[host][stencilId(shape)] = (hostShapeCounts[host][stencilId(shape)] || 0) + 1;
      if (stencilId(shape) === "StartNoneEvent") startActions.push({
        workflowHost: host,
        workflowName: redactText(form.Name || form.Title || ""),
        ...summarizeStart(shape, flowCounts),
      });
      if (stencilId(shape) === "SignalEvent") {
        signalEvents.push(summarizeSignalEvent(form, shape, shapes, flowCounts));
      }
    }
  }

  if (!signalEvents.length) throw new Error("No SignalEvent nodes found.");

  const summary = {
    proofLevel: "export-proven",
    inputFile: path.basename(args.input),
    signalEventNodeCount: signalEvents.length,
    countsByHost: Object.fromEntries(
      [...new Set(signalEvents.map((node) => node.workflowHost))].map((host) => [host, signalEvents.filter((node) => node.workflowHost === host).length]),
    ),
    eventdefinitions: [...new Set(signalEvents.flatMap((node) => node.eventdefinitions))].sort(),
    signalEventsOutsideApprovalWorkflow: signalEvents.filter((node) => node.workflowHost !== "approval-form-workflow").length,
    noIncomingSignalEvents: signalEvents.filter((node) => node.incomingCount === 0).length,
    signalEventsWithOutgoingFlow: signalEvents.filter((node) => node.outgoingCount > 0).length,
    downstreamActionTypes: [...new Set(signalEvents.flatMap((node) => node.downstreamFirstActions.map((action) => action.internalControlType)))].sort(),
    startActions,
    hostShapeCounts,
  };

  writeJson(path.join(args.outDir, "signal-event-inventory.normalized.json"), { summary, signalEvents });

  const refs = [
    ["signal-event-basic.normalized.json", () => true],
    ["signal-event-no-incoming-flow.normalized.json", (node) => node.incomingCount === 0],
    ["signal-event-cancel-definition.normalized.json", (node) => node.listensForCancel],
    ["signal-event-revoke-definition.normalized.json", (node) => node.listensForRevoke],
    ["signal-event-cancel-and-revoke-definition.normalized.json", (node) => node.listensForCancel && node.listensForRevoke],
    ["signal-event-downstream-cleanup-flow.normalized.json", (node) => node.downstreamFirstActions.length > 0],
  ];
  for (const [fileName, predicate] of refs) {
    const node = selectFirst(signalEvents, predicate);
    if (node) writeJson(path.join(args.outDir, fileName), node);
  }

  console.log(JSON.stringify(summary, null, 2));
}

main();
