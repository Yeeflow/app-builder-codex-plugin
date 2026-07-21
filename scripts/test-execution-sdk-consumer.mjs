#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporaryDirectory = mkdtempSync(resolve(tmpdir(), "yeeflow-execution-sdk-consumer-"));
const buildDirectory = resolve(temporaryDirectory, "build");
const tarball = resolve(buildDirectory, "yeeflow-app-builder-execution-sdk-1.0.0.tgz");
const canonicalIntent = Object.freeze({
  schemaVersion: "app-builder.intent/1.0.0",
  operation: "materialize-application",
  application: Object.freeze({
    name: "SDK Consumer Smoke",
    resources: Object.freeze([
      Object.freeze({
        kind: "data-list",
        name: "Requests",
        fields: Object.freeze([
          Object.freeze({ name: "Title", fieldName: "Text1", fieldType: "Text", controlType: "input" }),
          Object.freeze({ name: "Priority", fieldName: "Text2", fieldType: "Text", controlType: "select", choiceValues: Object.freeze(["Low", "High"]) }),
        ]),
      }),
    ]),
  }),
});

try {
  execFileSync(process.execPath, [resolve(root, "scripts/build-execution-sdk-package.mjs"), "--output-dir", buildDirectory], { cwd: root, stdio: "pipe" });
  execFileSync(process.execPath, [resolve(root, "scripts/validate-execution-sdk-package.mjs"), "--tarball", tarball], { cwd: root, stdio: "pipe" });

  const sourceContracts = await import(pathToFileURL(resolve(root, "packages/app-builder-execution-contracts/lib/index.js")).href);
  const sourceService = await import(pathToFileURL(resolve(root, "runtimes/app-builder-execution-service/lib/index.js")).href);
  const source = await executeThroughInjectedFakeModel({ ...sourceContracts, ...sourceService }, "source");

  const expandedPackage = resolve(buildDirectory, "package-source");
  const expandedSdk = await import(pathToFileURL(resolve(expandedPackage, "dist/index.js")).href);
  const expanded = await executeThroughInjectedFakeModel(expandedSdk, "expanded");
  assert.deepEqual(expanded.output, source.output);
  assert.equal(expanded.externalCalls, 0);
  assert.equal(expanded.modelInvocations, 1);

  const archiveDirectory = resolve(temporaryDirectory, "archive");
  mkdirSync(archiveDirectory, { recursive: true });
  execFileSync("tar", ["-xzf", tarball, "-C", archiveDirectory], { stdio: "pipe" });
  const archiveSdk = await import(pathToFileURL(resolve(archiveDirectory, "package/dist/index.js")).href);
  const archive = await executeThroughInjectedFakeModel(archiveSdk, "archive");
  assert.deepEqual(archive.output, source.output);
  assert.equal(archive.externalCalls, 0);

  const consumerDirectory = resolve(temporaryDirectory, "consumer");
  mkdirSync(consumerDirectory, { recursive: true });
  writeFileSync(resolve(consumerDirectory, "package.json"), `${JSON.stringify({ name: "execution-sdk-consumer-smoke", private: true, type: "module" }, null, 2)}\n`, "utf8");
  writeFileSync(resolve(consumerDirectory, "tsconfig.json"), `${JSON.stringify({ compilerOptions: { strict: true, noEmit: true, target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", skipLibCheck: false }, include: ["consumer.ts"] }, null, 2)}\n`, "utf8");
  writeFileSync(resolve(consumerDirectory, "consumer.ts"), typeConsumerSource(), "utf8");
  writeFileSync(resolve(consumerDirectory, "consumer.mjs"), runtimeConsumerSource(), "utf8");
  execFileSync("npm", ["install", tarball, "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false"], { cwd: consumerDirectory, stdio: "pipe" });
  const dependencyTree = JSON.parse(execFileSync("npm", ["ls", "--all", "--json"], { cwd: consumerDirectory, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
  const sdkDependency = dependencyTree.dependencies?.["@yeeflow/app-builder-execution-sdk"];
  assert.equal(sdkDependency?.version, "1.0.0");
  assert.equal(Object.keys(sdkDependency?.dependencies || {}).length, 0);
  execFileSync(process.execPath, [resolve(root, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json", "--pretty", "false"], { cwd: consumerDirectory, stdio: "pipe" });
  const installedOutput = execFileSync(process.execPath, ["consumer.mjs"], {
    cwd: consumerDirectory,
    encoding: "utf8",
    env: { PATH: process.env.PATH || "", LANG: "C", LC_ALL: "C" },
    stdio: ["ignore", "pipe", "pipe"],
  }).trim().split("\n").at(-1);
  const installed = JSON.parse(installedOutput);
  assert.deepEqual(installed.output, source.output);
  assert.equal(installed.externalCalls, 0);
  assert.equal(installed.modelInvocations, 1);
  assert.equal(installed.credentialEnvironmentKeys, 0);

  console.log("EXECUTION_SDK_SOURCE_PARITY_PASSED");
  console.log("EXECUTION_SDK_EXPANDED_PACKAGE_PARITY_PASSED");
  console.log("EXECUTION_SDK_ARCHIVE_PARITY_PASSED");
  console.log("EXECUTION_SDK_INSTALLED_CONSUMER_PARITY_PASSED");
  console.log("EXECUTION_SDK_TYPESCRIPT_CONSUMER_PASSED");
  console.log("EXECUTION_SDK_NO_EXTERNAL_CALLS_PASSED externalCalls=0");
  console.log("EXECUTION_SDK_NO_CREDENTIALS_PASSED credentialEnvironmentKeys=0");
  console.log("EXECUTION_SDK_CONSUMER_SMOKE_PASSED surfaces=4 modelInvocationsPerSurface=1 writeAuthority=0");
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

async function executeThroughInjectedFakeModel(sdk, surfaceName) {
  let externalCalls = 0;
  let modelInvocations = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    externalCalls += 1;
    throw new Error("External calls are forbidden in the SDK consumer smoke.");
  };
  try {
    const context = Object.freeze({
      protocolVersion: sdk.EXECUTION_PROTOCOL_VERSION,
      capabilities: Object.freeze({ protocolVersion: sdk.EXECUTION_PROTOCOL_VERSION, descriptors: sdk.supportedExecutionCapabilities }),
      authority: Object.freeze({ allowedEffects: Object.freeze([]) }),
      origin: `temporary-${surfaceName}-consumer`,
      correlationId: `temporary-${surfaceName}-correlation`,
      modelProfileRef: `opaque-${surfaceName}-profile-must-not-echo`,
    });
    const kernel = sdk.createInProcessExecutionKernel();
    const negotiation = kernel.negotiate(context, sdk.supportedExecutionCapabilities);
    assert.equal(negotiation.accepted, true);
    const fakeModelPort = Object.freeze({
      async invoke() {
        modelInvocations += 1;
        return Object.freeze({ protocolVersion: sdk.EXECUTION_PROTOCOL_VERSION, intent: canonicalIntent });
      },
    });
    const modelResult = await fakeModelPort.invoke({ invocationId: `fake-${surfaceName}`, modelProfileRef: context.modelProfileRef, input: Object.freeze({ prompt: "deterministic fixture" }) });
    const output = kernel.execute({
      protocolVersion: sdk.EXECUTION_PROTOCOL_VERSION,
      requestId: `request-${surfaceName}`,
      context,
      requiredCapabilities: sdk.supportedExecutionCapabilities,
      intent: modelResult.intent,
    });
    assert.equal(output.status, "succeeded");
    assert.equal(JSON.stringify(output).includes(context.modelProfileRef), false);
    assert.equal(Object.isFrozen(output), true);
    return { output: normalize(output), externalCalls, modelInvocations };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function normalize(result) {
  const value = JSON.parse(JSON.stringify(result));
  value.requestId = "normalized-request";
  value.observability = {};
  return value;
}

function typeConsumerSource() {
  return `import {
  EXECUTION_PROTOCOL_VERSION,
  createInProcessExecutionKernel,
  supportedExecutionCapabilities,
  type ExecutionContext,
  type ModelInvocationPort,
  type StructuredApplicationIntent,
} from "@yeeflow/app-builder-execution-sdk";

const context: ExecutionContext = {
  protocolVersion: EXECUTION_PROTOCOL_VERSION,
  capabilities: { protocolVersion: EXECUTION_PROTOCOL_VERSION, descriptors: supportedExecutionCapabilities },
  authority: { allowedEffects: [] },
};
const intent: StructuredApplicationIntent = { schemaVersion: "app-builder.intent/1.0.0", operation: "materialize-application", application: { name: "Type Consumer", resources: [] } };
const port: ModelInvocationPort = { async invoke() { return { protocolVersion: EXECUTION_PROTOCOL_VERSION, intent }; } };
void port;
createInProcessExecutionKernel().negotiate(context, supportedExecutionCapabilities);
`;
}

function runtimeConsumerSource() {
  return `import * as sdk from "@yeeflow/app-builder-execution-sdk";
let externalCalls = 0;
let modelInvocations = 0;
globalThis.fetch = async () => { externalCalls += 1; throw new Error("External call blocked"); };
const credentialEnvironmentKeys = Object.keys(process.env).filter((key) => /(?:KEY|TOKEN|SECRET|CREDENTIAL|OAUTH)/u.test(key)).length;
const intent = ${JSON.stringify(canonicalIntent)};
const context = Object.freeze({ protocolVersion: sdk.EXECUTION_PROTOCOL_VERSION, capabilities: Object.freeze({ protocolVersion: sdk.EXECUTION_PROTOCOL_VERSION, descriptors: sdk.supportedExecutionCapabilities }), authority: Object.freeze({ allowedEffects: Object.freeze([]) }), origin: "temporary-installed-consumer", correlationId: "temporary-installed-correlation", modelProfileRef: "opaque-installed-profile-must-not-echo" });
const fakeModelPort = Object.freeze({ async invoke() { modelInvocations += 1; return Object.freeze({ protocolVersion: sdk.EXECUTION_PROTOCOL_VERSION, intent }); } });
const kernel = sdk.createInProcessExecutionKernel();
if (!kernel.negotiate(context, sdk.supportedExecutionCapabilities).accepted) throw new Error("Negotiation rejected");
const modelResult = await fakeModelPort.invoke({ invocationId: "fake-installed", modelProfileRef: context.modelProfileRef, input: Object.freeze({ prompt: "deterministic fixture" }) });
const raw = kernel.execute({ protocolVersion: sdk.EXECUTION_PROTOCOL_VERSION, requestId: "request-installed", context, requiredCapabilities: sdk.supportedExecutionCapabilities, intent: modelResult.intent });
if (raw.status !== "succeeded" || JSON.stringify(raw).includes(context.modelProfileRef)) throw new Error("Execution failed");
const output = JSON.parse(JSON.stringify(raw)); output.requestId = "normalized-request"; output.observability = {};
console.log(JSON.stringify({ output, externalCalls, modelInvocations, credentialEnvironmentKeys }));
`;
}
