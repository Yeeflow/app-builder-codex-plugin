#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  canonicalStructuredIntent,
  clone,
  executionInput,
  executionProtocolVersion,
} from "./test-fixtures/app-builder-execution-service-fixtures.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-execution-parity-"));
const archive = resolve(temporary, "official-plugin.zip");
const unpacked = resolve(temporary, "archive");
const installed = resolve(temporary, "simulated-installed", "yeeflow-app-builder-plugin");

try {
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archive], {
    cwd: root,
    env: { ...process.env, YEEFLOW_CANDIDATE_CORE_VERSION: "1.0.0" },
    stdio: "pipe",
  });
  execFileSync("unzip", ["-qq", archive, "-d", unpacked], { cwd: root });
  cpSync(resolve(unpacked, "yeeflow-app-builder-plugin"), installed, { recursive: true });

  assertPluginArchiveBoundary(resolve(unpacked, "yeeflow-app-builder-plugin"));
  const source = await sourceSurface();
  const sourceResults = await executeSourceCrossHost(source);
  console.log("APP_BUILDER_EXECUTION_SOURCE_CROSS_HOST_EQUIVALENCE_PASSED adapters=3");

  const surfaces = [
    ["source", source],
    ["official-dist", await pluginDistributionSurface(resolve(root, "dist/yeeflow-app-builder-plugin/execution"), "dist")],
    ["archive", await pluginDistributionSurface(resolve(unpacked, "yeeflow-app-builder-plugin/execution"), "archive")],
    ["simulated-installed", await pluginDistributionSurface(resolve(installed, "execution"), "installed")],
  ];
  const outputs = [sourceResults.codex.output];
  for (const [name, surface] of surfaces) {
    const codex = name === "source" ? sourceResults.codex : await executeCodexSurface(name, surface);
    if (name !== "source") outputs.push(codex.output);
    assert.equal(Object.isFrozen(codex.output), true);
    assert.equal(Object.isFrozen(codex.output.plan), true);
    await assertFailClosed(name, surface);
  }
  for (const output of outputs.slice(1)) assert.deepEqual(output, outputs[0]);
  console.log("APP_BUILDER_EXECUTION_CODEX_SOURCE_DIST_ARCHIVE_INSTALLED_PARITY_PASSED surfaces=4");
  console.log("APP_BUILDER_EXECUTION_CODEX_DISTRIBUTED_FAIL_CLOSED_PARITY_PASSED surfaces=4 modelInvocations=0");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

async function sourceSurface() {
  const nonce = Date.now();
  return {
    contracts: await import(`${pathToFileURL(resolve(root, "packages/app-builder-execution-contracts/lib/index.js")).href}?surface=${nonce}`),
    codex: await import(`${pathToFileURL(resolve(root, "adapters/codex-plugin-adapter/lib/index.js")).href}?surface=${nonce}`),
    web: await import(`${pathToFileURL(resolve(root, "adapters/web-managed-provider-fake-adapter/lib/index.js")).href}?surface=${nonce}`),
    extension: await import(`${pathToFileURL(resolve(root, "adapters/host-extension-fixture-adapter/lib/index.js")).href}?surface=${nonce}`),
  };
}

async function pluginDistributionSurface(directory, nonce) {
  const module = (name) => import(`${pathToFileURL(resolve(directory, name)).href}?surface=${nonce}`);
  return {
    contracts: await module("app-builder-execution-contracts.v0.1.0.mjs"),
    codex: await module("codex-plugin-adapter.v0.1.0.mjs"),
  };
}

async function executeSourceCrossHost(surface) {
  const codex = await executeCodexSurface("source", surface);
  const profile = "opaque-source-cross-host-profile-must-not-echo";
  const web = await surface.web.executeWithManagedProviderFake(executionInput("source-web", profile), surface.web.createManagedProviderFakeModelPort(canonicalStructuredIntent));
  const extension = await surface.extension.executeWithHostExtensionFixture(executionInput("source-extension", profile), surface.extension.createHostExtensionFixtureModelPort(canonicalStructuredIntent));
  for (const result of [codex, web, extension]) assert.equal(result.status, "succeeded");
  assert.deepEqual(codex.output, web.output);
  assert.deepEqual(web.output, extension.output);
  return { codex, web, extension };
}

async function executeCodexSurface(name, surface) {
  assert.equal(surface.contracts.EXECUTION_PROTOCOL_VERSION, executionProtocolVersion);
  const profile = `opaque-${name}-profile-must-not-echo`;
  const codexInput = executionInput(`${name}-codex`, profile);
  const codex = await surface.codex.executeWithCodexHost(codexInput, deterministicModelPort(canonicalStructuredIntent));
  assert.equal(codex.status, "succeeded");
  assert.equal(JSON.stringify(codex).includes(profile), false);
  return codex;
}

async function assertFailClosed(name, surface) {
  const input = clone(executionInput(`${name}-authority-negative`));
  input.context.authority.allowedEffects.push("external.write");
  let invocations = 0;
  const result = await surface.codex.executeWithCodexHost(input, Object.freeze({
    async invoke() {
      invocations += 1;
      return { protocolVersion: executionProtocolVersion, intent: canonicalStructuredIntent };
    },
  }));
  assert.equal(result.status, "rejected");
  assert.equal(result.diagnostics.some((item) => item.code === "EXECUTION_WRITE_AUTHORITY_FORBIDDEN"), true);
  assert.equal(invocations, 0);
}

function deterministicModelPort(intent) {
  const output = clone(intent);
  return Object.freeze({ async invoke() { return Object.freeze({ protocolVersion: executionProtocolVersion, intent: output }); } });
}

function assertPluginArchiveBoundary(pluginRoot) {
  const forbidden = /(?:web-managed-provider-fake-adapter|host-extension-fixture-adapter|@yeeflow\/web-managed-provider-fake-adapter|@yeeflow\/host-extension-fixture-adapter)/u;
  for (const path of files(pluginRoot)) {
    assert.doesNotMatch(path, forbidden);
    if (/\.(?:json|mjs|js|md|txt)$/u.test(path)) assert.doesNotMatch(readFileSync(path, "utf8"), forbidden);
  }
  console.log("APP_BUILDER_EXECUTION_PLUGIN_ARCHIVE_HOST_BOUNDARY_PASSED excludedAdapters=2");
}

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}
