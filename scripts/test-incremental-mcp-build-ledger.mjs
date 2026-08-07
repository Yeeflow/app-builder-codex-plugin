#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  IncrementalBuildLedgerValidationError,
  SUPPORTED_COMPONENT_TYPES,
  SUPPORTED_SHARED_RESOURCE_TYPES,
  validateIncrementalBuildLedger,
} from "./lib/yeeflow-incremental-build-ledger.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

testFullCapabilityLedger();
testBootstrapLedger();
testServerAllocatedBootstrapLedger();
testBootstrapRejectsApplicationTransition();
testBootstrapRejectsUnissuedApplicationId();
testBootstrapRejectsInvalidApplicationIcon();
testBootstrapRejectsUnprovenThemeContract();
testBootstrapRejectsAdvancedResource();
testRejectsUnsafeStatusTransition();
testRejectsUnverifiedDependency();
testRejectsDeleteWithoutBoundReceipt();
testRejectsRawSecrets();
testCliValidation();
console.log("incremental MCP build ledger tests passed");

function testFullCapabilityLedger() {
  const ledger = validLedger();
  const summary = validateIncrementalBuildLedger(ledger);
  assert.equal(summary.operationCount, 22);
  assert.equal(summary.operationsByStatus["readback-verified"], 22);
}

function testBootstrapLedger() {
  const ledger = bootstrapLedger();
  const summary = validateIncrementalBuildLedger(ledger);
  assert.equal(summary.operationCount, 22);
  assert.equal(summary.operationsByStatus.planned, 22);
}

function testServerAllocatedBootstrapLedger() {
  const ledger = bootstrapLedger({ identityStrategy: "server-allocated-on-create" });
  const applicationOperation = ledger.operations.find((operation) => operation.category === "application");
  applicationOperation.issuedIds = [];
  assert.equal(validateIncrementalBuildLedger(ledger).operationsByStatus.planned, 22);
}

function testBootstrapRejectsApplicationTransition() {
  const ledger = bootstrapLedger();
  const applicationOperation = ledger.operations.find((operation) => operation.category === "application");
  applicationOperation.status = "materialized";
  applicationOperation.statusHistory = ["planned", "materialized"];
  assertValidationCode(() => validateIncrementalBuildLedger(ledger), "LEDGER_BOOTSTRAP_APPLICATION_OPERATION_INVALID");
}

function testBootstrapRejectsUnissuedApplicationId() {
  const ledger = bootstrapLedger();
  const applicationOperation = ledger.operations.find((operation) => operation.category === "application");
  applicationOperation.issuedIds[0].issuedBy = "mcp.allocate_resource_id";
  assertValidationCode(() => validateIncrementalBuildLedger(ledger), "LEDGER_BOOTSTRAP_APPLICATION_ISSUED_IDS_INVALID");
}

function testBootstrapRejectsInvalidApplicationIcon() {
  const ledger = bootstrapLedger();
  ledger.application.bootstrap.iconUrl = "https://example.invalid/icon.png";
  assertValidationCode(() => validateIncrementalBuildLedger(ledger), "LEDGER_BOOTSTRAP_ICON_INVALID");
}

function testBootstrapRejectsUnprovenThemeContract() {
  const ledger = bootstrapLedger();
  ledger.application.bootstrap.themeStrategy = "create-with-live-contract-validated";
  assertValidationCode(() => validateIncrementalBuildLedger(ledger), "LEDGER_BOOTSTRAP_THEME_CONTRACT_MISSING");
}

function testBootstrapRejectsAdvancedResource() {
  const ledger = bootstrapLedger();
  ledger.operations[0].status = "materialized";
  ledger.operations[0].statusHistory = ["planned", "materialized"];
  assertValidationCode(() => validateIncrementalBuildLedger(ledger), "LEDGER_BOOTSTRAP_NON_APPLICATION_STATUS_INVALID");
}

function testRejectsUnsafeStatusTransition() {
  const ledger = validLedger();
  ledger.operations[0].statusHistory = ["planned", "saved"];
  assertValidationCode(() => validateIncrementalBuildLedger(ledger), "LEDGER_STATUS_TRANSITION_INVALID");
}

function testRejectsUnverifiedDependency() {
  const ledger = validLedger();
  ledger.operations[0].status = "saved";
  ledger.operations[0].statusHistory = ["planned", "materialized", "saved"];
  ledger.operations[1].dependsOn = [ledger.operations[0].operationId];
  assertValidationCode(() => validateIncrementalBuildLedger(ledger), "LEDGER_DEPENDENCY_NOT_VERIFIED");
}

function testRejectsDeleteWithoutBoundReceipt() {
  const ledger = validLedger();
  const operation = ledger.operations[0];
  operation.action = "delete";
  assertValidationCode(() => validateIncrementalBuildLedger(ledger), "LEDGER_DELETE_CONFIRMATION_MISSING");
  operation.confirmationReceipt = { kind: "explicit-delete-confirmation", operationId: "other", confirmedBy: "user", confirmedAt: "2026-08-07T00:00:00.000Z", confirmationText: "DELETE component/DataList: wrong" };
  assertValidationCode(() => validateIncrementalBuildLedger(ledger), "LEDGER_DELETE_CONFIRMATION_INVALID");
}

function testRejectsRawSecrets() {
  const ledger = validLedger();
  ledger.operations[0].apiKey = "not-allowed";
  assertValidationCode(() => validateIncrementalBuildLedger(ledger), "LEDGER_SECRET_FORBIDDEN");
}

function testCliValidation() {
  const directory = mkdtempSync(join(tmpdir(), "yeeflow-incremental-ledger-"));
  try {
    const ledgerPath = join(directory, "ledger.json");
    writeFileSync(ledgerPath, JSON.stringify(validLedger()));
    const result = spawnSync(process.execPath, ["scripts/validate-incremental-mcp-build-ledger.mjs", "--ledger", ledgerPath], { cwd: ROOT, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).result, "INCREMENTAL_MCP_BUILD_LEDGER_VALID");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function validLedger() {
  const resources = [
    ...SUPPORTED_COMPONENT_TYPES.map((resourceType) => ["component", resourceType]),
    ...SUPPORTED_SHARED_RESOURCE_TYPES.map((resourceType) => ["shared-resource", resourceType]),
    ["application", "Application"], ["portal", "Portal"], ["navigation", "Navigation"], ["permissions", "Permissions"],
  ];
  return {
    schemaVersion: "1.0",
    application: {
      workspaceId: "workspace-redacted-reference",
      applicationId: "application-001",
      name: "Procurement",
      identityProvenance: { value: "application-001", issuedBy: "mcp.application_create", issuedAt: "2026-08-07T00:00:00.000Z" },
    },
    plan: { revision: "plan-r1", hash: `sha256:${"a".repeat(64)}` },
    operations: resources.map(([category, resourceType], index) => ({
      operationId: `op-${index + 1}`,
      category,
      resourceType,
      action: "create",
      resourceName: `${resourceType} example`,
      dependsOn: [],
      issuedIds: [{ kind: index % 2 ? "guid" : "id", value: `issued-${index + 1}`, issuedBy: "mcp.allocate_resource_id", issuedAt: "2026-08-07T00:00:00.000Z" }],
      status: "readback-verified",
      statusHistory: ["planned", "materialized", "saved", "readback-verified"],
    })),
  };
}

function bootstrapLedger({ identityStrategy = "mcp-generated-before-create" } = {}) {
  const ledger = validLedger();
  ledger.application = {
    workspaceId: ledger.application.workspaceId,
    name: ledger.application.name,
    status: "bootstrap",
    bootstrap: {
      identityStrategy,
      themeStrategy: "omit-until-live-contract-verified",
      iconUrl: '{"b":"#0F766E","i":"fa-solid fa-cart-shopping","c":"#FFFFFF"}',
    },
  };
  for (const operation of ledger.operations) {
    operation.status = "planned";
    operation.statusHistory = ["planned"];
  }
  const applicationOperation = ledger.operations.find((operation) => operation.category === "application");
  applicationOperation.issuedIds = identityStrategy === "mcp-generated-before-create"
    ? [{ kind: "id", value: "9001", issuedBy: "mcp.utils_generate_ids", issuedAt: "2026-08-07T00:00:00.000Z" }]
    : [];
  return ledger;
}

function assertValidationCode(fn, code) {
  assert.throws(fn, (error) => error instanceof IncrementalBuildLedgerValidationError && error.code === code);
}
