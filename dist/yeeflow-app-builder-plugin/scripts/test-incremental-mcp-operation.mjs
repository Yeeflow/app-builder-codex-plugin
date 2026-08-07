#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SCRIPT = "scripts/plan-incremental-mcp-operation.mjs";
const directory = mkdtempSync(join(tmpdir(), "yeeflow-incremental-operation-"));

try {
  const ledgerPath = join(directory, "ledger.json");
  const registryPath = join(directory, "registry.json");
  writeJson(ledgerPath, ledger());
  writeJson(registryPath, registry());
  testDefaultRegistryIntegration(ledgerPath);
  testDefaultRegistryPlansEveryCapability(ledgerPath);
  testBootstrapApplicationPlan(ledgerPath);
  testServerAllocatedBootstrapApplicationPlan(ledgerPath);
  testHappyPath(ledgerPath, registryPath);
  testElevatedCredentialConfirmation(ledgerPath, registryPath);
  testElevatedDeleteAndPortalPublishConfirmation(ledgerPath, registryPath);
  testRejectedStates(ledgerPath, registryPath);
  testDependencies(ledgerPath, registryPath);
  testUnsupportedCapability(ledgerPath, registryPath);
  console.log("incremental MCP operation plan tests passed");
} finally {
  rmSync(directory, { recursive: true, force: true });
}

function testHappyPath(ledgerPath, registryPath) {
  const result = run(ledgerPath, registryPath, "data-list");
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.result, "INCREMENTAL_MCP_OPERATION_PLAN_READY");
  assert.equal(plan.executionMode, "plan-only-no-network-no-mcp-call");
  assert.equal(plan.confirmation.level, "explicit");
  assert.deepEqual(plan.lifecycle.map((item) => item.name), ["runtime-contract-discovery", "list-get-current-state", "mcp-id-allocation", "local-validation", "explicit-confirmation", "save", "get-readback", "ledger-update"]);
}

function testDefaultRegistryIntegration(ledgerPath) {
  const result = spawnSync(process.execPath, [SCRIPT, "--ledger", ledgerPath, "--operation", "data-list"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.capability.kind, "component");
  assert.equal(plan.capability.supportedActions.includes("create"), true);
  assert.equal(Array.isArray(plan.capability.requiredLifecycle), true);
  assert.equal(plan.capability.requiredLifecycle.includes("get_readback"), true);
}

function testDefaultRegistryPlansEveryCapability(ledgerPath) {
  const defaultRegistry = JSON.parse(readFileSync(resolve(ROOT, "schemas/mcp-incremental-capability-registry.v1.json"), "utf8"));
  for (const [resourceType, capability] of Object.entries(defaultRegistry.resources)) {
    writeJson(ledgerPath, fullCoverageLedger(defaultRegistry, resourceType));
    const result = spawnSync(process.execPath, [SCRIPT, "--ledger", ledgerPath, "--operation", `op-${resourceType}`], { cwd: ROOT, encoding: "utf8" });
    assert.equal(result.status, 0, `${resourceType}: ${result.stderr}`);
    const plan = JSON.parse(result.stdout);
    assert.equal(plan.operation.resourceType, resourceType);
    assert.deepEqual(plan.capability.requiredLifecycle, defaultRegistry.lifecycle[capability.requiredLifecycle]);
  }
  writeJson(ledgerPath, ledger());
}

function testBootstrapApplicationPlan(ledgerPath) {
  const value = ledger();
  value.application = bootstrapApplication("mcp-generated-before-create");
  value.operations = [operation({ operationId: "application-bootstrap", category: "application", resourceType: "Application", issuedValue: undefined })];
  value.operations[0].issuedIds = [{ kind: "id", value: "9001", issuedBy: "mcp.utils_generate_ids", issuedAt: "2026-08-07T00:00:00.000Z" }];
  writeJson(ledgerPath, value);
  const result = spawnSync(process.execPath, [SCRIPT, "--ledger", ledgerPath, "--operation", "application-bootstrap"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.lifecycle[2].applicationIdentityExpectedFrom, "mcp-issued-before-create");
  assert.equal(plan.lifecycle[2].issuedIdCount, 1);
  assert.equal(plan.applicationBootstrap.identityStrategy, "mcp-generated-before-create");
  assert.equal(plan.lifecycle[3].themeStrategy, "omit-until-live-contract-verified");
  writeJson(ledgerPath, ledger());
}

function testServerAllocatedBootstrapApplicationPlan(ledgerPath) {
  const value = ledger();
  value.application = bootstrapApplication("server-allocated-on-create");
  value.operations = [operation({ operationId: "application-bootstrap", category: "application", resourceType: "Application" })];
  value.operations[0].issuedIds = [];
  writeJson(ledgerPath, value);
  const result = spawnSync(process.execPath, [SCRIPT, "--ledger", ledgerPath, "--operation", "application-bootstrap"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.lifecycle[2].applicationIdentityExpectedFrom, "save-and-readback");
  assert.match(plan.lifecycle[2].purpose, /explicitly proves the server allocates/);
  writeJson(ledgerPath, ledger());
}

function testElevatedCredentialConfirmation(ledgerPath, registryPath) {
  const value = ledger();
  value.operations = [operation({ operationId: "credential", category: "shared-resource", resourceType: "Credential" })];
  writeJson(ledgerPath, value);
  const result = run(ledgerPath, registryPath, "credential");
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.confirmation.level, "elevated");
  assert.deepEqual(plan.confirmation.reasons, ["credential"]);
  writeJson(ledgerPath, ledger());
}

function testElevatedDeleteAndPortalPublishConfirmation(ledgerPath, registryPath) {
  const deleting = ledger();
  deleting.operations = [operation({ operationId: "delete-list", category: "component", resourceType: "DataList", action: "delete" })];
  deleting.operations[0].confirmationReceipt = {
    kind: "explicit-delete-confirmation",
    operationId: "delete-list",
    confirmedBy: "user",
    confirmedAt: "2026-08-07T00:00:00.000Z",
    confirmationText: "DELETE component/DataList: DataList example",
  };
  writeJson(ledgerPath, deleting);
  const deleteResult = run(ledgerPath, registryPath, "delete-list");
  assert.equal(deleteResult.status, 0, deleteResult.stderr);
  const deletePlan = JSON.parse(deleteResult.stdout);
  assert.equal(deletePlan.confirmation.level, "elevated");
  assert.deepEqual(deletePlan.confirmation.reasons, ["delete"]);
  assert.equal(deletePlan.lifecycle[5].name, "delete");

  const portal = ledger();
  portal.operations = [operation({ operationId: "publish-portal", category: "portal", resourceType: "Portal", portalPublish: true })];
  writeJson(ledgerPath, portal);
  const portalResult = run(ledgerPath, registryPath, "publish-portal");
  assert.equal(portalResult.status, 0, portalResult.stderr);
  const portalPlan = JSON.parse(portalResult.stdout);
  assert.equal(portalPlan.confirmation.level, "elevated");
  assert.deepEqual(portalPlan.confirmation.reasons, ["portal-publish"]);
  writeJson(ledgerPath, ledger());
}

function testRejectedStates(ledgerPath, registryPath) {
  const blocked = ledger();
  blocked.operations[1].status = "blocked";
  blocked.operations[1].statusHistory = ["planned", "blocked"];
  writeJson(ledgerPath, blocked);
  assertFailure(run(ledgerPath, registryPath, "data-list"), "OPERATION_BLOCKED");

  const verified = ledger();
  verified.operations[1].status = "readback-verified";
  verified.operations[1].statusHistory = ["planned", "materialized", "saved", "readback-verified"];
  writeJson(ledgerPath, verified);
  assertFailure(run(ledgerPath, registryPath, "data-list"), "OPERATION_ALREADY_VERIFIED");
  writeJson(ledgerPath, ledger());
}

function testDependencies(ledgerPath, registryPath) {
  const value = ledger();
  value.operations[1].dependsOn = ["application-ready"];
  value.operations[0].status = "saved";
  value.operations[0].statusHistory = ["planned", "materialized", "saved"];
  writeJson(ledgerPath, value);
  assertFailure(run(ledgerPath, registryPath, "data-list"), "OPERATION_DEPENDENCIES_UNRESOLVED");
  writeJson(ledgerPath, ledger());
}

function testUnsupportedCapability(ledgerPath, registryPath) {
  const badRegistry = registry();
  badRegistry.resources.DataList.semanticOperations = ["update"];
  writeJson(registryPath, badRegistry);
  assertFailure(run(ledgerPath, registryPath, "data-list"), "CAPABILITY_ACTION_UNSUPPORTED");
  writeJson(registryPath, registry());
}

function ledger() {
  return {
    schemaVersion: "1.0",
    application: {
      workspaceId: "workspace-redacted",
      applicationId: "app-1",
      name: "Procurement",
      identityProvenance: provenance("app-1", "mcp.application_create"),
    },
    plan: { revision: "r1", hash: `sha256:${"a".repeat(64)}` },
    operations: [
      operation({ operationId: "application-ready", category: "application", resourceType: "Application", status: "readback-verified", statusHistory: ["planned", "materialized", "saved", "readback-verified"] }),
      operation({ operationId: "data-list", category: "component", resourceType: "DataList", dependsOn: ["application-ready"] }),
    ],
  };
}

function fullCoverageLedger(defaultRegistry, plannedResourceType) {
  const capability = defaultRegistry.resources[plannedResourceType];
  const verifiedResourceTypes = new Set(capability.dependencies);
  const allPlanned = plannedResourceType === "Application";
  const operations = Object.entries(defaultRegistry.resources).map(([resourceType, entry], index) => {
    const status = allPlanned || resourceType === plannedResourceType || !verifiedResourceTypes.has(resourceType) ? "planned" : "readback-verified";
    return operation({
      operationId: `op-${resourceType}`,
      category: entry.kind,
      resourceType,
      status,
      statusHistory: status === "planned" ? ["planned"] : ["planned", "materialized", "saved", "readback-verified"],
      dependsOn: entry.dependencies.map((dependency) => `op-${dependency}`),
      issuedValue: `coverage-${index}`,
    });
  });
  return {
    schemaVersion: "1.0",
    application: { workspaceId: "workspace-redacted", applicationId: "coverage-app", name: "Coverage", identityProvenance: provenance("coverage-app", "mcp.application_create") },
    plan: { revision: "coverage-r1", hash: `sha256:${"b".repeat(64)}` },
    operations,
  };
}

function operation({ operationId, category, resourceType, action = "create", status = "planned", statusHistory = ["planned"], dependsOn = [], issuedValue = `id-${operationId}`, portalPublish = false }) {
  return {
    operationId,
    category,
    resourceType,
    action,
    resourceName: `${resourceType} example`,
    dependsOn,
    issuedIds: [{ kind: "id", value: issuedValue, issuedBy: "mcp.allocate_resource_id", issuedAt: "2026-08-07T00:00:00.000Z" }],
    status,
    statusHistory,
    ...(portalPublish ? { portalPublish: true } : {}),
  };
}

function provenance(value, issuedBy) { return { value, issuedBy, issuedAt: "2026-08-07T00:00:00.000Z" }; }

function bootstrapApplication(identityStrategy) {
  return {
    workspaceId: "workspace-redacted",
    name: "Procurement",
    status: "bootstrap",
    bootstrap: {
      identityStrategy,
      themeStrategy: "omit-until-live-contract-verified",
      iconUrl: '{"b":"#0F766E","i":"fa-solid fa-cart-shopping","c":"#FFFFFF"}',
    },
  };
}

function registry() {
  const resource = (kind) => ({ kind, semanticOperations: ["create", "update", "delete"], requiredLifecycle: ["contract", "list-get", "ids", "validate", "confirm", "save", "readback", "ledger"], dependencies: [], risk: {}, materialization: { strategy: "type-specific" } });
  return { schemaVersion: "1.0", server: {}, contractSnapshot: {}, lifecycle: {}, resources: { Application: resource("application"), DataList: resource("component"), Credential: resource("shared-resource"), Portal: resource("portal") } };
}

function run(ledgerPath, registryPath, operationId) {
  return spawnSync(process.execPath, [SCRIPT, "--ledger", ledgerPath, "--registry", registryPath, "--operation", operationId], { cwd: ROOT, encoding: "utf8" });
}
function writeJson(path, value) { writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function assertFailure(result, code) { assert.notEqual(result.status, 0, result.stdout); assert.match(`${result.stdout}${result.stderr}`, new RegExp(code)); }
