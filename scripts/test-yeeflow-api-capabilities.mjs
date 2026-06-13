#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getCapability,
  listCapabilities,
  pathParamsFor,
  YEEFLOW_API_CAPABILITIES,
} from "./lib/yeeflow-api-capabilities.mjs";
import {
  APP_PACKAGE_WORKSPACE_CATEGORY,
  DOCUMENTED_WORKSPACE_CATEGORIES,
} from "./lib/yeeflow-workspace-selection.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_FIELDS = ["name", "method", "path", "summary", "readOnly", "requiresConfirmation", "confirmationLevel", "auth", "requiredParams", "optionalParams", "source", "notes"];
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

testUniqueNames();
testRequiredFields();
testSafetyClassification();
testPathsAndRawCapabilityPolicy();
testLocationsList();
testWorkspaceCapabilities();
testListCommand();
testCallHelperBlocksWrites();
testCallHelperAcceptsWorkspaceReads();
testCallHelperAuthRequiredForPositions();
testWorkspaceListAuthRequired();
testApiAuthSmokeAuthRequired();
testPathParamsCovered();

console.log("yeeflow-api-capabilities tests passed");

function testUniqueNames() {
  const names = new Set();
  for (const capability of YEEFLOW_API_CAPABILITIES) {
    assert.equal(names.has(capability.name), false, `Duplicate capability name: ${capability.name}`);
    names.add(capability.name);
  }
}

function testRequiredFields() {
  for (const capability of YEEFLOW_API_CAPABILITIES) {
    for (const field of REQUIRED_FIELDS) assert.ok(Object.prototype.hasOwnProperty.call(capability, field), `${capability.name} missing ${field}`);
    assert.match(capability.name, /^[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)+$/);
    assert.match(capability.path, /^\//);
    assert.equal(Array.isArray(capability.requiredParams), true, `${capability.name} requiredParams must be an array`);
    assert.equal(Array.isArray(capability.optionalParams), true, `${capability.name} optionalParams must be an array`);
    assert.ok(["oauth-or-api-key", "oauth"].includes(capability.auth), `${capability.name} has unsupported auth mode`);
  }
}

function testSafetyClassification() {
  for (const capability of YEEFLOW_API_CAPABILITIES) {
    if (capability.method === "GET") assert.equal(capability.readOnly, true, `${capability.name} GET should be read-only`);
    if (WRITE_METHODS.has(capability.method) && !isDocumentedReadOnlyPost(capability)) {
      assert.equal(capability.requiresConfirmation, true, `${capability.name} write operation must require confirmation`);
      assert.equal(capability.readOnly, false, `${capability.name} write operation must not be read-only`);
    }
  }
}

function testPathsAndRawCapabilityPolicy() {
  for (const capability of YEEFLOW_API_CAPABILITIES) {
    assert.equal(capability.path.includes("<"), false, `${capability.name} has placeholder angle path`);
    assert.equal(capability.path.includes("TODO"), false, `${capability.name} has TODO path`);
    assert.equal(/raw|arbitrary/i.test(capability.name), false, `${capability.name} exposes raw capability`);
  }
}

function testLocationsList() {
  const capability = getCapability("locations.list");
  assert.ok(capability);
  assert.equal(capability.method, "GET");
  assert.equal(capability.path, "/locations");
  assert.equal(capability.readOnly, true);
  assert.equal(capability.requiresConfirmation, false);
}

function testWorkspaceCapabilities() {
  const list = getCapability("workspaces.listByCategory");
  assert.ok(list);
  assert.equal(list.method, "GET");
  assert.equal(list.path, "/workspaces/{category}");
  assert.equal(list.readOnly, true);
  assert.equal(list.requiresConfirmation, false);
  assert.equal(list.auth, "oauth");
  assert.deepEqual(list.requiredParams, ["path:category"]);
  assert.deepEqual(DOCUMENTED_WORKSPACE_CATEGORIES, ["settings", "flowcraft"]);
  assert.equal(APP_PACKAGE_WORKSPACE_CATEGORY, "flowcraft");
  assert.match(list.notes, /settings/);
  assert.match(list.notes, /flowcraft/);
  assert.match(list.notes, /redacted ID previews/);

  const get = getCapability("workspaces.get");
  assert.ok(get);
  assert.equal(get.method, "GET");
  assert.equal(get.path, "/workspaces/{category}/{id}");
  assert.equal(get.readOnly, true);
  assert.equal(get.requiresConfirmation, false);
  assert.equal(get.auth, "oauth");
  assert.deepEqual(get.requiredParams, ["path:category", "path:id"]);

  const expectedWritePaths = {
    "workspaces.add": ["POST", "/workspaces/{category}", ["path:category", "body:workspace"]],
    "workspaces.edit": ["PUT", "/workspaces/{category}/{id}", ["path:category", "path:id", "body:workspace"]],
    "workspaces.delete": ["DELETE", "/workspaces/{category}/{id}", ["path:category", "path:id"]],
    "workspaces.sort": ["POST", "/workspaces/{category}/sort", ["path:category", "body:sort"]],
  };
  for (const [name, [method, expectedPath, requiredParams]] of Object.entries(expectedWritePaths)) {
    const capability = getCapability(name);
    assert.ok(capability, `${name} missing`);
    assert.equal(capability.method, method);
    assert.equal(capability.path, expectedPath);
    assert.deepEqual(capability.requiredParams, requiredParams);
    assert.equal(capability.readOnly, false, `${name} should be classified as write`);
    assert.equal(capability.requiresConfirmation, true, `${name} should require confirmation`);
    assert.equal(capability.confirmationLevel, name === "workspaces.delete" ? "strong" : "standard");
  }
}

function testListCommand() {
  const all = run(["scripts/yeeflow-api-list-capabilities.mjs"]);
  assert.equal(all.status, 0, all.stderr);
  const parsed = JSON.parse(all.stdout);
  assert.equal(parsed.count, YEEFLOW_API_CAPABILITIES.length);

  const readOnly = JSON.parse(run(["scripts/yeeflow-api-list-capabilities.mjs", "--read-only"]).stdout);
  assert.ok(readOnly.capabilities.length > 0);
  assert.equal(readOnly.capabilities.every((capability) => capability.readOnly), true);

  const write = JSON.parse(run(["scripts/yeeflow-api-list-capabilities.mjs", "--write"]).stdout);
  assert.ok(write.capabilities.length > 0);
  assert.equal(write.capabilities.every((capability) => !capability.readOnly), true);

  const locations = JSON.parse(run(["scripts/yeeflow-api-list-capabilities.mjs", "--filter", "locations"]).stdout);
  assert.ok(locations.capabilities.some((capability) => capability.name === "locations.list"));

  const workspaces = JSON.parse(run(["scripts/yeeflow-api-list-capabilities.mjs", "--filter", "workspaces"]).stdout);
  assert.ok(workspaces.capabilities.some((capability) => capability.name === "workspaces.listByCategory"));
}

function testCallHelperBlocksWrites() {
  const result = run(["scripts/yeeflow-api-call-capability.mjs", "--name", "items.create"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /does not execute write capabilities/);

  const workspaceWrite = run(["scripts/yeeflow-api-call-capability.mjs", "--name", "workspaces.add"]);
  assert.notEqual(workspaceWrite.status, 0);
  assert.match(workspaceWrite.stderr, /does not execute write capabilities/);
}

function testCallHelperAcceptsWorkspaceReads() {
  const result = run(["scripts/yeeflow-api-call-capability.mjs", "--name", "workspaces.listByCategory"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing required path parameter: category/);
  assert.doesNotMatch(result.stderr, /does not execute write capabilities/);

  const invalidCategory = run(["scripts/yeeflow-workspace-list.mjs", "--category", "apps", "--dotenv", path.join(ROOT, "missing.env")]);
  assert.notEqual(invalidCategory.status, 0);
  assert.match(invalidCategory.stderr, /settings, flowcraft/);
}

function testCallHelperAuthRequiredForPositions() {
  const result = run(
    ["scripts/yeeflow-api-call-capability.mjs", "--name", "positions.list", "--dotenv", path.join(ROOT, "missing.env")],
    { YEEFLOW_OAUTH_TOKEN_FILE: path.join(ROOT, "tmp", "missing-oauth-token-for-test.json") },
  );
  assert.notEqual(result.status, 0);
  assert.equal(result.stderr, "");
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.resultClass, "auth_required");
  assert.equal(parsed.reason, "login_flow_required");
  assert.equal(parsed.originalCapability, "positions.list");
  assert.equal(parsed.originalEndpoint, "GET /positions");
  assert.equal(parsed.liveCall, false);
  assert.equal(parsed.requestShaped, false);
  assert.equal(parsed.rawResponsePrinted, false);
  assert.equal(parsed.login.message, "Please sign in to Yeeflow using the plugin login flow so I can continue this operation.");
  assert.equal(parsed.login.unavailableMessage, "I need Yeeflow login before I can continue, but the plugin login action is not available in this runtime. Please open the Yeeflow plugin login flow in Codex, then ask me to retry this operation.");
  assert.match(parsed.login.retry, /positions\.list/);
  assertNoLocalLoginRecovery(result.stdout);
}

function testWorkspaceListAuthRequired() {
  const result = run(
    ["scripts/yeeflow-workspace-list.mjs", "--category", "flowcraft", "--dotenv", path.join(ROOT, "missing.env")],
    { YEEFLOW_OAUTH_TOKEN_FILE: path.join(ROOT, "tmp", "missing-workspace-token-for-test.json") },
  );
  assert.notEqual(result.status, 0);
  assert.equal(result.stderr, "");
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.resultClass, "auth_required");
  assert.equal(parsed.reason, "login_flow_required");
  assert.equal(parsed.originalCapability, "workspaces.listByCategory");
  assert.equal(parsed.originalOperation, "workspace discovery for flowcraft");
  assert.equal(parsed.originalEndpoint, "GET /workspaces/{category}");
  assert.equal(parsed.liveCall, false);
  assert.equal(parsed.requestShaped, false);
  assert.equal(parsed.rawResponsePrinted, false);
  assertNoLocalLoginRecovery(result.stdout);
}

function testApiAuthSmokeAuthRequired() {
  const result = run(
    ["scripts/yeeflow-api-auth-smoke.mjs", "--dotenv", path.join(ROOT, "missing.env")],
    { YEEFLOW_OAUTH_TOKEN_FILE: path.join(ROOT, "tmp", "missing-smoke-token-for-test.json") },
  );
  assert.notEqual(result.status, 0);
  assert.equal(result.stderr, "");
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.resultClass, "auth_required");
  assert.equal(parsed.reason, "login_flow_required");
  assert.equal(parsed.originalOperation, "Yeeflow API auth smoke");
  assert.equal(parsed.originalEndpoint, "GET /locations");
  assert.equal(parsed.liveCall, false);
  assert.equal(parsed.requestShaped, false);
  assertNoLocalLoginRecovery(result.stdout);
}

function assertNoLocalLoginRecovery(text) {
  assert.doesNotMatch(text, /yeeflow-oauth-login\.mjs/);
  assert.doesNotMatch(text, /node\s+/);
  assert.doesNotMatch(text, /\.codex\/plugins\/cache/);
  assert.doesNotMatch(text, /(ask|set|configure|use|paste|run).*YEEFLOW_API_KEY/i);
  assert.doesNotMatch(text, /(ask|set|configure|create|use).*\.env\.local/i);
}

function testPathParamsCovered() {
  for (const capability of YEEFLOW_API_CAPABILITIES) {
    const requiredNames = new Set(capability.requiredParams.filter((entry) => entry.startsWith("path:")).map((entry) => entry.slice(5)));
    for (const name of pathParamsFor(capability)) assert.equal(requiredNames.has(name), true, `${capability.name} missing required path param ${name}`);
  }
}

function isDocumentedReadOnlyPost(capability) {
  return capability.name === "items.query" || capability.name === "users.search";
}

function run(args, extraEnv = {}) {
  return spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: "utf8",
    env: { PATH: process.env.PATH || "", ...extraEnv },
  });
}
