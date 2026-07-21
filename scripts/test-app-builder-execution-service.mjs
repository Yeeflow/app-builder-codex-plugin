#!/usr/bin/env node

import assert from "node:assert/strict";
import { buildApplicationFromCanonicalIntent } from "../packages/app-builder-core/lib/index.js";
import { executeWithCodexHost } from "../adapters/codex-plugin-adapter/lib/index.js";
import {
  createManagedProviderFakeModelPort,
  executeWithManagedProviderFake,
} from "../adapters/web-managed-provider-fake-adapter/lib/index.js";
import {
  createHostExtensionFixtureModelPort,
  executeWithHostExtensionFixture,
} from "../adapters/host-extension-fixture-adapter/lib/index.js";
import { createInProcessExecutionKernel } from "../runtimes/app-builder-execution-service/lib/index.js";
import {
  canonicalStructuredIntent,
  clone,
  executionContext,
  executionInput,
  executionProtocolVersion,
  requiredExecutionCapabilities,
} from "./test-fixtures/app-builder-execution-service-fixtures.mjs";

const codexInput = executionInput("codex-host-fixture", "opaque-codex-profile");
const webInput = executionInput("web-host-fixture", "opaque-web-profile");
const extensionInput = executionInput("future-host-fixture", "opaque-future-profile");

const codexResult = await executeWithCodexHost(codexInput, deterministicModelPort(canonicalStructuredIntent));
const webResult = await executeWithManagedProviderFake(webInput, createManagedProviderFakeModelPort(canonicalStructuredIntent));
const extensionResult = await executeWithHostExtensionFixture(extensionInput, createHostExtensionFixtureModelPort(canonicalStructuredIntent));

for (const result of [codexResult, webResult, extensionResult]) {
  assert.equal(result.status, "succeeded");
  assert.equal(result.output?.status, "succeeded");
  assert.equal(result.diagnostics.length, 0);
}
assert.deepEqual(codexResult.output, webResult.output);
assert.deepEqual(webResult.output, extensionResult.output);
assert.notEqual(codexResult.observability.origin, webResult.observability.origin);
console.log("APP_BUILDER_EXECUTION_CROSS_HOST_EQUIVALENCE_PASSED adapters=3");

const generated = codexResult.output?.materialization?.application;
assert.equal(generated?.name, "Equipment Register");
assert.equal(generated?.resources.length, 1);
assert.equal(generated?.resources[0]?.kind, "data-list");
assert.equal(generated?.resources[0]?.name, "Equipment");
assert.deepEqual(generated?.resources[0]?.fields.map((field) => field.displayName), ["Equipment Name", "Lifecycle Status"]);
assert.equal(generated?.resources[0]?.fields[0]?.fieldName, "Title");
assert.equal(generated?.resources[0]?.fields[1]?.fieldName, "Text1");
assert.deepEqual(JSON.parse(String(generated?.resources[0]?.fields[1]?.rules)).choices.map((choice) => choice.value), ["Active", "Retired"]);
assert.equal(Object.isFrozen(codexResult.output?.materialization), true);
console.log("APP_BUILDER_EXECUTION_CANONICAL_GENERATED_APP_MATERIALIZATION_PASSED resources=1 fields=2");

await assertNegotiationRejectsBeforeModel("unsupported-capability", (input) => {
  input.requiredCapabilities.push({ id: "application.unsupported", version: "1.0.0" });
}, "EXECUTION_CAPABILITY_UNSUPPORTED");
await assertNegotiationRejectsBeforeModel("protocol-mismatch", (input) => {
  input.context.protocolVersion = "app-builder.execution/9.0.0";
}, "EXECUTION_PROTOCOL_VERSION_MISMATCH");
await assertNegotiationRejectsBeforeModel("authority-escalation", (input) => {
  input.context.authority.allowedEffects.push("tenant.write");
}, "EXECUTION_WRITE_AUTHORITY_FORBIDDEN");
await assertNegotiationRejectsBeforeModel("context-secret-field", (input) => {
  input.context.credentials = "must-never-cross-boundary";
}, "EXECUTION_CONTEXT_FIELD_FORBIDDEN");
console.log("APP_BUILDER_EXECUTION_NEGOTIATION_FAIL_CLOSED_PASSED cases=4 modelInvocations=0");

let rejectedModelCoreInvocations = 0;
const rejectedModelKernel = createInProcessExecutionKernel({
  build(intent) {
    rejectedModelCoreInvocations += 1;
    return buildApplicationFromCanonicalIntent(intent);
  },
});
const modelLeakResult = await executeWithCodexHost(executionInput("model-leak-fixture"), Object.freeze({
  async invoke() {
    return { protocolVersion: executionProtocolVersion, intent: canonicalStructuredIntent, credentials: "forbidden" };
  },
}), rejectedModelKernel);
assert.equal(modelLeakResult.status, "rejected");
assert.equal(modelLeakResult.diagnostics[0]?.code, "EXECUTION_MODEL_RESULT_REJECTED");
assert.equal(rejectedModelCoreInvocations, 0);
console.log("APP_BUILDER_EXECUTION_MODEL_RESULT_LEAKAGE_REJECTED coreInvocations=0");

let capturedCoreIntent;
const isolationKernel = createInProcessExecutionKernel({
  build(intent) {
    capturedCoreIntent = clone(intent);
    return buildApplicationFromCanonicalIntent(intent);
  },
});
const isolatedProfile = "opaque-profile-must-not-echo";
const isolatedInput = clone(executionInput("arbitrary-new-host", isolatedProfile));
isolatedInput.modelInput = { privateInput: "model-input-must-not-echo" };
const isolatedResult = await executeWithCodexHost(isolatedInput, deterministicModelPort(canonicalStructuredIntent), isolationKernel);
assert.equal(isolatedResult.status, "succeeded");
assert.deepEqual(Object.keys(capturedCoreIntent).sort(), ["application", "operation", "schemaVersion"]);
assert.equal(JSON.stringify(capturedCoreIntent).includes(isolatedProfile), false);
assert.equal(JSON.stringify(isolatedResult).includes(isolatedProfile), false);
assert.equal(JSON.stringify(isolatedResult).includes("model-input-must-not-echo"), false);
assert.equal(JSON.stringify(capturedCoreIntent).includes("origin"), false);
assert.equal(JSON.stringify(capturedCoreIntent).includes("authority"), false);
assert.equal(JSON.stringify(capturedCoreIntent).includes("capabilities"), false);
console.log("APP_BUILDER_EXECUTION_CORE_INPUT_OUTPUT_ISOLATION_PASSED");

const invalidIntent = clone(canonicalStructuredIntent);
invalidIntent.application.resources[0].fields.push(clone(invalidIntent.application.resources[0].fields[0]));
const invalidResult = await executeWithManagedProviderFake(executionInput("repair-fixture"), createManagedProviderFakeModelPort(invalidIntent));
assert.equal(invalidResult.status, "rejected");
assert.equal(invalidResult.output?.status, "invalid");
assert.equal(invalidResult.output?.repair.required, true);
assert.equal(invalidResult.output?.repair.actions[0]?.action, "rename-declaration");
console.log("APP_BUILDER_EXECUTION_DETERMINISTIC_VERIFICATION_REPAIR_PASSED");

function deterministicModelPort(intent) {
  const output = clone(intent);
  return Object.freeze({
    async invoke() {
      return Object.freeze({ protocolVersion: executionProtocolVersion, intent: output });
    },
  });
}

async function assertNegotiationRejectsBeforeModel(name, mutate, expectedCode) {
  const input = clone(executionInput(name));
  mutate(input);
  let invocationCount = 0;
  const result = await executeWithCodexHost(input, Object.freeze({
    async invoke() {
      invocationCount += 1;
      return { protocolVersion: executionProtocolVersion, intent: canonicalStructuredIntent };
    },
  }));
  assert.equal(result.status, "rejected");
  assert.equal(invocationCount, 0);
  assert.equal(result.diagnostics.some((item) => item.code === expectedCode), true);
}
