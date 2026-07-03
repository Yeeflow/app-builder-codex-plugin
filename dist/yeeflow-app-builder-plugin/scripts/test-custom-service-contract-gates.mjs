#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pluginRootMode } from "./lib/plugin-root-layout.mjs";

const ROOT = process.cwd();
const ROOT_MODE = pluginRootMode(ROOT);
const SKILL_ROOT =
  ROOT_MODE === "installed-cache-root"
    ? "skills/yeeflow-custom-service-generator"
    : "skills/installed/yeeflow-custom-service-generator";

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function assertExists(relativePath) {
  assert.equal(fs.existsSync(path.join(ROOT, relativePath)), true, `${relativePath} exists`);
}

function assertIncludes(relativePath, needle) {
  assert.ok(read(relativePath).includes(needle), `${relativePath} includes ${needle}`);
}

const requiredFiles = [
  "docs/standards/custom-service-nodejs22-runtime-standard.md",
  "docs/reference/custom-service-ycs-examples.normalized.json",
  "docs/reference/custom-service-invocation-examples.normalized.json",
  "docs/training/custom-service-nodejs22-ycs-training-report.md",
  `${SKILL_ROOT}/SKILL.md`,
];

for (const file of requiredFiles) assertExists(file);

assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "Custom Service");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "Node.js 22");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "main({ connections, params, modules }");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "DraftConfig");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "modules.yeeSDKClient");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "no `require");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "SSRF");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "type = \"invokeservice\"");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "stencil.id = \"InvokeCode\"");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "__variables_");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "__list_");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "__temp_");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "server side");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "backend queue");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "Connection Variable Rules");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "sharePointConnection");
assertIncludes("docs/standards/custom-service-nodejs22-runtime-standard.md", "properties.connections[]");

assertIncludes(`${SKILL_ROOT}/SKILL.md`, "yeeflow-custom-service-generator");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "main({ connections, params, modules }");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "Do not generate `render");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "Do not generate `execute");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "DraftConfig");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "connections[connectionId]");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "Generate Custom Service Code");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "Plan Or Generate Custom Service Invocation");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "InvokeCode");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "invokeservice");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "properties.connections[]");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "exprType: \"list_field\"");

const normalized = JSON.parse(read("docs/reference/custom-service-ycs-examples.normalized.json"));
assert.equal(normalized.proofBoundary, "export-proven-normalized-summary");
assert.equal(Array.isArray(normalized.examples), true);
assert.equal(normalized.examples.length, 3);
assert.deepEqual(
  normalized.examples.map((example) => example.name).sort(),
  ["Add SharePoint Supplier List Item", "Insert Excel Data to Data List", "Sub List to HTML Table"].sort(),
);
const sharePointExample = normalized.examples.find((example) => example.name === "Add SharePoint Supplier List Item");
assert.equal(sharePointExample.draftConfig.connections[0].id, "sharePointConnection");
assert.equal(sharePointExample.draftConfig.connections[0].type, "http");
assert.ok(sharePointExample.draftCodePattern.usesConnections.includes("connections?.sharePointConnection"));
assert.ok(sharePointExample.draftCodePattern.usesModules.includes("modules.fetch"));
assert.ok(sharePointExample.draftCodePattern.returns.includes("itemId"));

const invocation = JSON.parse(read("docs/reference/custom-service-invocation-examples.normalized.json"));
assert.equal(invocation.proofBoundary, "export-proven-normalized-summary");
assert.equal(Array.isArray(invocation.surfaces), true);
assert.equal(invocation.surfaces.length, 5);

const surfaces = new Map(invocation.surfaces.map((surface) => [surface.id, surface]));
for (const surfaceId of [
  "approval_form_action",
  "workflow_action",
  "data_list_form_action",
  "dashboard_form_action",
  "data_list_workflow_action_with_connection",
]) {
  assert.equal(surfaces.has(surfaceId), true, `${surfaceId} invocation surface exists`);
}

const approvalAction = surfaces.get("approval_form_action");
assert.equal(approvalAction.actionStep.type, "invokeservice");
assert.equal(approvalAction.actionStep.serviceIdPath, "attrs.serviceId");
assert.equal(approvalAction.inputBindings[0].shape.value.prefix, "__variables_");
assert.equal(approvalAction.outputBindings[0].shape.prefix, "__variables_");

const workflowAction = surfaces.get("workflow_action");
assert.equal(workflowAction.workflowNode.stencilId, "InvokeCode");
assert.equal(workflowAction.workflowNode.serviceIdPath, "properties.serviceId");
assert.equal(workflowAction.inputBindings[0].shape.type, 1);
assert.equal(workflowAction.inputBindings[0].shape.value.exprType, "variable");
assert.equal(workflowAction.inputBindings[0].shape.value.type, "expr");
assert.equal(workflowAction.outputBindings[0].shape.prefix, "__variables_");

const dataListAction = surfaces.get("data_list_form_action");
assert.equal(dataListAction.actionStep.type, "invokeservice");
assert.equal(dataListAction.inputBindings[0].shape.value.prefix, "__list_");
assert.equal(dataListAction.outputBindings[0].shape.prefix, "__temp_");

const dashboardAction = surfaces.get("dashboard_form_action");
assert.equal(dashboardAction.actionStep.type, "invokeservice");
assert.equal(dashboardAction.inputBindings[0].shape.value.prefix, "__temp_");
assert.equal(dashboardAction.outputBindings[0].shape.prefix, "__temp_");
assert.ok(
  invocation.executionNotes.some((note) => /server-side|server side/i.test(note)),
  "Custom Service server-side execution note exists",
);
assert.ok(
  invocation.executionNotes.some((note) => /queued|queue/i.test(note)),
  "Custom Service queue execution note exists",
);

const dataListWorkflowWithConnection = surfaces.get("data_list_workflow_action_with_connection");
assert.equal(dataListWorkflowWithConnection.workflowNode.stencilId, "InvokeCode");
assert.equal(dataListWorkflowWithConnection.workflowNode.connectionsPath, "properties.connections[]");
assert.equal(dataListWorkflowWithConnection.connectionBindings[0].id, "sharePointConnection");
assert.equal(dataListWorkflowWithConnection.connectionBindings[0].type, "http");
assert.equal(typeof dataListWorkflowWithConnection.connectionBindings[0].shape.connectionid, "string");
assert.equal(dataListWorkflowWithConnection.inputBindings[0].shape.type, 2);
assert.equal(dataListWorkflowWithConnection.inputBindings[1].shape.type, 1);
assert.equal(dataListWorkflowWithConnection.inputBindings[1].shape.value.exprType, "list_field");
assert.equal(dataListWorkflowWithConnection.outputBindings[0].shape.prefix, "__variables_");
assert.equal(dataListWorkflowWithConnection.downstreamActions[0].stencilId, "ContentList");

function inspectCustomService({ draftCode, draftConfig }) {
  const issues = [];
  let parsedConfig = null;

  if (!/\bexport\s+async\s+function\s+main\b|\bexport\s+function\s+main\b|\basync\s+function\s+main\b|\bfunction\s+main\b/.test(draftCode)) {
    issues.push("CUSTOM_SERVICE_MAIN_MISSING");
  }
  if (/\brender\s*\(/.test(draftCode)) issues.push("CUSTOM_SERVICE_RENDER_ENTRYPOINT_INVALID");
  if (/\bexecute\s*\(/.test(draftCode)) issues.push("CUSTOM_SERVICE_EXECUTE_ENTRYPOINT_INVALID");
  if (/\brequire\s*\(/.test(draftCode)) issues.push("CUSTOM_SERVICE_NODE_REQUIRE_FORBIDDEN");
  if (/\bimport\s+.*\s+from\s+['\"](?:fs|path|crypto|os|child_process|http|https)['\"]/.test(draftCode)) {
    issues.push("CUSTOM_SERVICE_NODE_IMPORT_FORBIDDEN");
  }
  if (/\bprocess\b|\bglobal\b|\b__dirname\b|\b__filename\b/.test(draftCode)) {
    issues.push("CUSTOM_SERVICE_NODE_GLOBAL_FORBIDDEN");
  }
  if (/\bsetTimeout\s*\(|\bsetInterval\s*\(/.test(draftCode)) {
    issues.push("CUSTOM_SERVICE_TIMER_FORBIDDEN");
  }
  if (/localhost|127\.0\.0\.1|169\.254\.169\.254|\.local\b|\.internal\b|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+/.test(draftCode)) {
    issues.push("CUSTOM_SERVICE_SSRF_TARGET_FORBIDDEN");
  }
  if (/api[_-]?key|bearer\s+[a-z0-9._-]{10,}|password\s*[:=]|client[_-]?secret/i.test(draftCode)) {
    issues.push("CUSTOM_SERVICE_CREDENTIAL_LITERAL_FORBIDDEN");
  }

  try {
    parsedConfig = typeof draftConfig === "string" ? JSON.parse(draftConfig) : null;
  } catch {
    issues.push("CUSTOM_SERVICE_DRAFTCONFIG_INVALID_JSON_STRING");
  }

  if (!parsedConfig) {
    if (!issues.includes("CUSTOM_SERVICE_DRAFTCONFIG_INVALID_JSON_STRING")) {
      issues.push("CUSTOM_SERVICE_DRAFTCONFIG_NOT_JSON_STRING");
    }
  } else {
    for (const key of ["params", "connections", "outputs"]) {
      if (!Array.isArray(parsedConfig[key])) issues.push(`CUSTOM_SERVICE_DRAFTCONFIG_${key.toUpperCase()}_MISSING`);
    }
  }

  return { issues, parsedConfig };
}

function inspectInvocationStep(surfaceId, stepOrNode) {
  const issues = [];

  if (surfaceId === "workflow_action" || surfaceId === "data_list_workflow_action_with_connection") {
    if (stepOrNode?.stencil?.id !== "InvokeCode") issues.push("CUSTOM_SERVICE_WORKFLOW_STENCIL_INVALID");
    if (!stepOrNode?.properties?.serviceId) issues.push("CUSTOM_SERVICE_WORKFLOW_SERVICE_ID_MISSING");
    if (!Array.isArray(stepOrNode?.properties?.params)) issues.push("CUSTOM_SERVICE_WORKFLOW_PARAMS_MISSING");
    if (!Array.isArray(stepOrNode?.properties?.outputs)) issues.push("CUSTOM_SERVICE_WORKFLOW_OUTPUTS_MISSING");
    if (surfaceId === "data_list_workflow_action_with_connection") {
      if (!Array.isArray(stepOrNode?.properties?.connections)) {
        issues.push("CUSTOM_SERVICE_WORKFLOW_CONNECTIONS_MISSING");
      }
      for (const connection of stepOrNode?.properties?.connections || []) {
        if (!connection?.id || !connection?.type || !connection?.value?.connectionid) {
          issues.push("CUSTOM_SERVICE_WORKFLOW_CONNECTION_BINDING_INVALID");
        }
      }
    }
    for (const param of stepOrNode?.properties?.params || []) {
      const bindingType = param?.value?.type;
      const exprType = param?.value?.value?.exprType;
      const isWorkflowVariable = bindingType === 1 && exprType === "variable";
      const isListField = surfaceId === "data_list_workflow_action_with_connection" && bindingType === 1 && exprType === "list_field";
      const isStaticExpression = surfaceId === "data_list_workflow_action_with_connection" && bindingType === 2 && Array.isArray(param?.value?.value);
      const isOptionalUnbound = surfaceId === "data_list_workflow_action_with_connection" && param?.value === null;
      if (!isWorkflowVariable && !isListField && !isStaticExpression && !isOptionalUnbound) {
        issues.push("CUSTOM_SERVICE_WORKFLOW_PARAM_VARIABLE_EXPR_INVALID");
      }
    }
    return issues;
  }

  if (stepOrNode?.type !== "invokeservice") issues.push("CUSTOM_SERVICE_FORM_ACTION_STEP_TYPE_INVALID");
  if (!stepOrNode?.attrs?.serviceId) issues.push("CUSTOM_SERVICE_FORM_ACTION_SERVICE_ID_MISSING");
  if (!Array.isArray(stepOrNode?.attrs?.params)) issues.push("CUSTOM_SERVICE_FORM_ACTION_PARAMS_MISSING");
  if (!Array.isArray(stepOrNode?.attrs?.outputs)) issues.push("CUSTOM_SERVICE_FORM_ACTION_OUTPUTS_MISSING");

  for (const param of stepOrNode?.attrs?.params || []) {
    const prefix = param?.value?.value?.prefix;
    if (surfaceId === "dashboard_form_action" && prefix !== "__temp_") {
      issues.push("CUSTOM_SERVICE_DASHBOARD_PARAM_PREFIX_INVALID");
    }
    if (surfaceId === "data_list_form_action" && !["__list_", "__temp_"].includes(prefix)) {
      issues.push("CUSTOM_SERVICE_DATA_LIST_FORM_PARAM_PREFIX_INVALID");
    }
    if (surfaceId === "approval_form_action" && prefix !== "__variables_") {
      issues.push("CUSTOM_SERVICE_APPROVAL_FORM_PARAM_PREFIX_INVALID");
    }
  }

  for (const output of stepOrNode?.attrs?.outputs || []) {
    const prefix = output?.value?.prefix;
    if (surfaceId === "dashboard_form_action" && prefix !== "__temp_") {
      issues.push("CUSTOM_SERVICE_DASHBOARD_OUTPUT_PREFIX_INVALID");
    }
    if (surfaceId === "data_list_form_action" && prefix !== "__temp_") {
      issues.push("CUSTOM_SERVICE_DATA_LIST_FORM_OUTPUT_PREFIX_INVALID");
    }
    if (surfaceId === "approval_form_action" && prefix !== "__variables_") {
      issues.push("CUSTOM_SERVICE_APPROVAL_FORM_OUTPUT_PREFIX_INVALID");
    }
  }

  return issues;
}

const validService = inspectCustomService({
  draftCode: `export async function main({ connections, params, modules }: ServiceContext) { return { total: 1 }; }`,
  draftConfig: JSON.stringify({ params: [], connections: [], outputs: [{ id: "total", type: "number" }] }),
});
assert.deepEqual(validService.issues, []);

const validConnectionService = inspectCustomService({
  draftCode: `export async function main({ connections, params, modules }: ServiceContext) { const conn = connections?.sharePointConnection; if (!conn) throw new Error("Required connection missing: sharePointConnection"); const response = await modules.fetch("https://graph.microsoft.com/v1.0/me", { method: "GET", connection: conn }); return { itemId: "1" }; }`,
  draftConfig: JSON.stringify({
    params: [{ id: "siteUrl", type: "text" }],
    connections: [{ id: "sharePointConnection", type: "http" }],
    outputs: [{ id: "itemId", type: "text" }],
  }),
});
assert.deepEqual(validConnectionService.issues, []);

const missingMain = inspectCustomService({
  draftCode: `export async function execute(context) { return {}; }`,
  draftConfig: JSON.stringify({ params: [], connections: [], outputs: [] }),
});
assert.ok(missingMain.issues.includes("CUSTOM_SERVICE_MAIN_MISSING"));
assert.ok(missingMain.issues.includes("CUSTOM_SERVICE_EXECUTE_ENTRYPOINT_INVALID"));

const nodeBuiltin = inspectCustomService({
  draftCode: `export async function main() { const fs = require('fs'); return {}; }`,
  draftConfig: JSON.stringify({ params: [], connections: [], outputs: [] }),
});
assert.ok(nodeBuiltin.issues.includes("CUSTOM_SERVICE_NODE_REQUIRE_FORBIDDEN"));

const invalidConfig = inspectCustomService({
  draftCode: `export async function main() { return {}; }`,
  draftConfig: { params: [], connections: [], outputs: [] },
});
assert.ok(invalidConfig.issues.includes("CUSTOM_SERVICE_DRAFTCONFIG_NOT_JSON_STRING"));

const ssrf = inspectCustomService({
  draftCode: `export async function main({ modules }) { await modules.fetch('http://127.0.0.1/admin'); return {}; }`,
  draftConfig: JSON.stringify({ params: [], connections: [], outputs: [] }),
});
assert.ok(ssrf.issues.includes("CUSTOM_SERVICE_SSRF_TARGET_FORBIDDEN"));

assert.deepEqual(
  inspectInvocationStep("data_list_form_action", {
    type: "invokeservice",
    attrs: {
      serviceId: "2072624440809492481",
      params: [{ id: "subListJson", value: { value: { prefix: "__list_", value: "Text1" }, variable: null } }],
      outputs: [{ id: "htmlTable", value: { prefix: "__temp_", value: "var_HTMLTable" } }],
    },
  }),
  [],
);

assert.deepEqual(
  inspectInvocationStep("workflow_action", {
    stencil: { id: "InvokeCode" },
    properties: {
      serviceId: "2072624440809492481",
      params: [
        {
          id: "subListJson",
          value: { type: 1, value: { exprType: "variable", valueType: "list", id: "Expense_Details", type: "expr" } },
        },
      ],
      outputs: [{ id: "htmlTable", value: { prefix: "__variables_", value: "EmailHTMLItems" } }],
    },
  }),
  [],
);

assert.deepEqual(
  inspectInvocationStep("data_list_workflow_action_with_connection", {
    stencil: { id: "InvokeCode" },
    properties: {
      serviceId: "2072927631207972864",
      connections: [
        {
          id: "sharePointConnection",
          type: "http",
          desc: "SharePoint OAuth connection used to authenticate and access the specified SharePoint site and list.",
          value: { connectionid: "2056384963824988160", userconnectionid: "0" },
        },
      ],
      params: [
        { id: "siteUrl", value: { type: 2, value: [{ type: "str", value: "https://example.sharepoint.com/" }] } },
        {
          id: "supplierName",
          value: { type: 1, value: { exprType: "list_field", valueType: "input", prop: "Title", id: "Title", type: "expr" } },
        },
        { id: "product", value: null },
      ],
      outputs: [{ id: "itemId", value: { prefix: "__variables_", value: "Supplier_ID" } }],
    },
  }),
  [],
);

assert.ok(
  inspectInvocationStep("data_list_workflow_action_with_connection", {
    stencil: { id: "InvokeCode" },
    properties: {
      serviceId: "2072927631207972864",
      connections: [],
      params: [],
      outputs: [],
    },
  }).includes("CUSTOM_SERVICE_WORKFLOW_CONNECTION_BINDING_INVALID") ||
    inspectInvocationStep("data_list_workflow_action_with_connection", {
      stencil: { id: "InvokeCode" },
      properties: {
        serviceId: "2072927631207972864",
        params: [],
        outputs: [],
      },
    }).includes("CUSTOM_SERVICE_WORKFLOW_CONNECTIONS_MISSING"),
);

assert.ok(
  inspectInvocationStep("dashboard_form_action", {
    type: "invokeservice",
    attrs: {
      serviceId: "2072624440809492481",
      params: [{ id: "subListJson", value: { value: { prefix: "__list_", value: "Text1" }, variable: null } }],
      outputs: [{ id: "htmlTable", value: { prefix: "__temp_", value: "var_HTMLTable" } }],
    },
  }).includes("CUSTOM_SERVICE_DASHBOARD_PARAM_PREFIX_INVALID"),
);

console.log(
  JSON.stringify(
    {
      ok: true,
      gate: "custom-service-contract",
      rootMode: ROOT_MODE,
      checkedFiles: requiredFiles.length,
      checkedExamples: normalized.examples.length,
      checkedInvocationSurfaces: invocation.surfaces.length,
    },
    null,
    2,
  ),
);
