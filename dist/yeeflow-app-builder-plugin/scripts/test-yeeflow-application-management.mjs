#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertApplicationDeleteConfirmation,
  expectedApplicationDeleteConfirmation,
  extractApplicationRecords,
  findVerifiedApplication,
  normalizeApplicationAppId,
  redactApplicationId,
  summarizeApplicationList,
} from "./lib/yeeflow-application-management.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

testAppIdContract();
testResponseShapesAndRedaction();
testExactApplicationVerification();
testStrongConfirmation();
testDeleteCliSafety();
testWorkspaceApplicationCliInputGate();

console.log("yeeflow-application-management tests passed");

function testAppIdContract() {
  assert.equal(normalizeApplicationAppId(), 41);
  assert.equal(normalizeApplicationAppId(""), 41);
  assert.equal(normalizeApplicationAppId(30), 30);
  assert.equal(normalizeApplicationAppId("41"), 41);
  assert.throws(() => normalizeApplicationAppId(0), /30, 41/);
  assert.throws(() => normalizeApplicationAppId(42), /30, 41/);
  assert.throws(() => normalizeApplicationAppId("nope"), /30, 41/);
}

function testResponseShapesAndRedaction() {
  const records = [
    { ListID: "2075835908265619456", Title: "Leave Management", AppID: 41, Status: 1 },
    { ApplicationID: "123456789", Name: "Travel Requests", appId: 41, state: "Active" },
  ];
  assert.deepEqual(extractApplicationRecords({ Data: records }), records);
  assert.deepEqual(extractApplicationRecords({ Data: { Items: records } }), records);
  const summary = summarizeApplicationList({ Data: records, TotalCount: 2 });
  assert.equal(summary.applicationCount, 2);
  assert.equal(summary.applications[0].title, "Leave Management");
  assert.equal(summary.applications[0].applicationIdPreview, "207...456");
  assert.equal(JSON.stringify(summary).includes("2075835908265619456"), false);
  assert.equal(redactApplicationId("123456789"), "123...789");
}

function testExactApplicationVerification() {
  const records = [
    { ListSetID: "101", Title: "Leave Management" },
    { ListSetID: "102", Title: "Travel Requests" },
  ];
  assert.equal(findVerifiedApplication(records, { applicationId: "101", expectedTitle: "Leave Management" }), records[0]);
  assert.throws(() => findVerifiedApplication(records, { applicationId: "999", expectedTitle: "Leave Management" }), /not found/);
  assert.throws(() => findVerifiedApplication(records, { applicationId: "101", expectedTitle: "leave management" }), /does not exactly match/);
  assert.throws(() => findVerifiedApplication([...records, records[0]], { applicationId: "101", expectedTitle: "Leave Management" }), /not unique/);
}

function testStrongConfirmation() {
  const expected = "DELETE APPLICATION: Leave Management";
  assert.equal(expectedApplicationDeleteConfirmation("Leave Management"), expected);
  assert.equal(assertApplicationDeleteConfirmation({ expectedTitle: "Leave Management", confirmation: expected }), expected);
  assert.throws(() => assertApplicationDeleteConfirmation({ expectedTitle: "Leave Management", confirmation: "yes" }), /Strong confirmation is required/);
}

function testDeleteCliSafety() {
  const dryRun = run(["scripts/yeeflow-application-delete.mjs", "--expected-title", "Leave Management"]);
  assert.equal(dryRun.status, 0, dryRun.stderr);
  const output = JSON.parse(dryRun.stdout);
  assert.equal(output.resultClass, "dry_run");
  assert.equal(output.liveCall, false);
  assert.equal(output.safeguards.expectedConfirmation, "DELETE APPLICATION: Leave Management");
  assert.equal(output.rawResponsePrinted, false);
  assert.equal(output.fullIdentifiersPrinted, false);

  const missingScope = run(["scripts/yeeflow-application-delete.mjs", "--execute"]);
  assert.notEqual(missingScope.status, 0);
  assert.match(missingScope.stderr, /--workspace-id is required/);

  const missingConfirmation = run([
    "scripts/yeeflow-application-delete.mjs",
    "--execute",
    "--workspace-id", "workspace-secret-id",
    "--application-id", "application-secret-id",
    "--expected-title", "Leave Management",
  ]);
  assert.notEqual(missingConfirmation.status, 0);
  assert.match(missingConfirmation.stderr, /Strong confirmation is required/);
  assert.doesNotMatch(missingConfirmation.stdout + missingConfirmation.stderr, /workspace-secret-id|application-secret-id/);

  const invalidAppId = run(["scripts/yeeflow-application-delete.mjs", "--app-id", "99"]);
  assert.notEqual(invalidAppId.status, 0);
  assert.match(invalidAppId.stderr, /30, 41/);
}

function testWorkspaceApplicationCliInputGate() {
  const missingWorkspace = run(["scripts/yeeflow-workspace-applications.mjs"]);
  assert.notEqual(missingWorkspace.status, 0);
  assert.match(missingWorkspace.stderr, /--workspace-id is required/);

  const invalidAppId = run(["scripts/yeeflow-workspace-applications.mjs", "--workspace-id", "hidden", "--app-id", "7"]);
  assert.notEqual(invalidAppId.status, 0);
  assert.match(invalidAppId.stderr, /30, 41/);
  assert.doesNotMatch(invalidAppId.stderr, /hidden/);
}

function run(args) {
  return spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      PATH: process.env.PATH || "",
      YEEFLOW_OAUTH_TOKEN_FILE: path.join(ROOT, "tmp", "missing-application-management-token-for-test.json"),
    },
  });
}
