#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-yapk-signing-"));
const signature = Buffer.alloc(32, 7).toString("base64");
const secretMarkers = ["secret-access-token", "12345678901234567890", "RAW_RESOURCE_MUST_NOT_LEAK", signature];

try {
  const archive = resolve(temporary, "official-plugin.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archive], { cwd: root, stdio: "pipe" });
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", archive, "-d", archiveRoot]);
  const installedRoot = resolve(temporary, "simulated-installed", "yeeflow-app-builder-plugin");
  cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installedRoot, { recursive: true });

  const surfaces = [
    ["source", root],
    ["official-dist", resolve(root, "dist/yeeflow-app-builder-plugin")],
    ["archive", resolve(archiveRoot, "yeeflow-app-builder-plugin")],
    ["simulated-installed", installedRoot],
  ];
  const sourceEntrypoint = readFileSync(resolve(root, "scripts/yeeflow-yapk-sign.mjs"));
  const sourceLibrary = readFileSync(resolve(root, "scripts/lib/yeeflow-yapk-signing.mjs"));
  for (const [, surfaceRoot] of surfaces) {
    assert.deepEqual(readFileSync(resolve(surfaceRoot, "scripts/yeeflow-yapk-sign.mjs")), sourceEntrypoint);
    assert.deepEqual(readFileSync(resolve(surfaceRoot, "scripts/lib/yeeflow-yapk-signing.mjs")), sourceLibrary);
  }
  const reports = [];
  for (const [surface, surfaceRoot] of surfaces) reports.push(await probe(surface, surfaceRoot));
  for (const report of reports.slice(1)) assert.deepEqual(report, reports[0]);
  console.log(JSON.stringify({
    status: "pass",
    marker: "YEEFLOW_YAPK_SIGNING_SOURCE_DIST_ARCHIVE_INSTALLED_PARITY_PASSED",
    surfaces: surfaces.map(([surface]) => surface),
    casesPerSurface: reports[0].caseCount,
  }, null, 2));
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

async function probe(surface, surfaceRoot) {
  const modulePath = resolve(surfaceRoot, "scripts/lib/yeeflow-yapk-signing.mjs");
  const entrypointPath = resolve(surfaceRoot, "scripts/yeeflow-yapk-sign.mjs");
  const signing = await import(`${pathToFileURL(modulePath).href}?surface=${surface}`);
  let caseCount = 0;

  {
    const scenario = fixture(surface, "execute-required");
    const dryRun = spawnSync(process.execPath, [entrypointPath, "--package", scenario.input, "--output", scenario.output], { encoding: "utf8" });
    assert.equal(dryRun.status, 1);
    assert.equal(dryRun.stdout, "");
    const report = JSON.parse(dryRun.stderr);
    assert.deepEqual(report, { status: "signing_failed", installAllowed: false, code: "YAPK_SIGN_EXECUTE_REQUIRED", diagnostics: {} });
    assert.equal(exists(scenario.output), false);
    assertRedacted(report);
    caseCount += 1;
  }

  for (const response of [
    responseOf(200, "application/json", JSON.stringify({ Data: signature })),
    responseOf(200, "application/json", JSON.stringify(signature)),
    responseOf(200, "text/plain", signature),
  ]) {
    const scenario = fixture(surface, `shape-${caseCount}`);
    const calls = [];
    const result = await signing.signAndVerifyYapk({
      inputPath: scenario.input,
      outputPath: scenario.output,
      apiBaseUrl: "https://api.yeeflow.com/v1",
      headers: { Authorization: "Bearer secret-access-token" },
      fetchImpl: signingFetch([response, responseOf(204, "", "")], calls),
    });
    assert.equal(result.status, "signed_and_verified");
    assert.equal(result.installAllowed, true);
    assert.equal(result.sourcePackagePreserved, true);
    assert.equal(readFileSync(scenario.input, "utf8"), scenario.original);
    const signed = JSON.parse(readFileSync(scenario.output, "utf8"));
    assert.equal(signed.Resource, scenario.wrapper.Resource);
    assert.equal(signed.Sign, signature);
    assert.equal(calls.length, 2);
    assert.equal(JSON.parse(calls[0].body).Resource, scenario.wrapper.Resource);
    assert.equal(JSON.parse(calls[1].body).Sign, signature);
    assertRedacted(result);
    caseCount += 1;
  }

  for (const invalid of [Buffer.alloc(31, 1).toString("base64"), "not-base64", `${signature}=`]) {
    const scenario = fixture(surface, `invalid-${caseCount}`);
    await assert.rejects(
      signing.signAndVerifyYapk({
        inputPath: scenario.input,
        outputPath: scenario.output,
        apiBaseUrl: "https://api.yeeflow.com/v1",
        fetchImpl: signingFetch([responseOf(200, "application/json", JSON.stringify({ Sign: invalid }))]),
      }),
      (error) => {
        assert.equal(error.code, "YAPK_SETSIGN_SIGNATURE_INVALID");
        assert.equal(error.diagnostics.setsign.httpStatus, 200);
        assertRedacted(error.diagnostics);
        return true;
      },
    );
    assert.equal(exists(scenario.output), false);
    caseCount += 1;
  }

  {
    const scenario = fixture(surface, `setsign-http-${caseCount}`);
    await assert.rejects(
      signing.signAndVerifyYapk({
        inputPath: scenario.input,
        outputPath: scenario.output,
        apiBaseUrl: "https://api.yeeflow.com/v1",
        fetchImpl: signingFetch([responseOf(401, "application/json", JSON.stringify({ error: "secret-access-token", Resource: "RAW_RESOURCE_MUST_NOT_LEAK", tenantId: "12345678901234567890" }))]),
      }),
      (error) => {
        assert.equal(error.code, "YAPK_SETSIGN_HTTP_FAILED");
        assert.equal(error.diagnostics.setsign.apiErrorCategory, "authentication");
        assertRedacted(error.diagnostics);
        return true;
      },
    );
    assert.equal(exists(scenario.output), false);
    caseCount += 1;
  }

  {
    const scenario = fixture(surface, `verify-http-${caseCount}`);
    await assert.rejects(
      signing.signAndVerifyYapk({
        inputPath: scenario.input,
        outputPath: scenario.output,
        apiBaseUrl: "https://api.yeeflow.com/v1",
        fetchImpl: signingFetch([
          responseOf(200, "application/json", JSON.stringify({ Sign: signature })),
          responseOf(500, "text/plain", `server failed ${signature} RAW_RESOURCE_MUST_NOT_LEAK`),
        ]),
      }),
      (error) => {
        assert.equal(error.code, "YAPK_VERIFYSIGN_HTTP_FAILED");
        assert.equal(error.diagnostics.verifysign.apiErrorCategory, "server");
        assertRedacted(error.diagnostics);
        return true;
      },
    );
    assert.equal(exists(scenario.output), false);
    caseCount += 1;
  }

  const sourceText = readFileSync(modulePath, "utf8");
  assert.doesNotMatch(sourceText, /console\.(?:log|error)\s*\(/u);
  return { caseCount };
}

function fixture(surface, name) {
  const directory = resolve(temporary, "fixtures", surface, name);
  mkdirSync(directory, { recursive: true });
  const input = resolve(directory, "unsigned.yapk");
  const output = resolve(directory, "signed.yapk");
  const wrapper = { AppID: 41, TenantID: "0", Resource: "RAW_RESOURCE_MUST_NOT_LEAK", Sign: "", PackageId: "fixture" };
  const original = `${JSON.stringify(wrapper, null, 2)}\n`;
  writeFileSync(input, original);
  return { input, output, wrapper, original };
}

function signingFetch(responses, calls = []) {
  return async (url, options) => {
    calls.push({ url, body: options.body });
    const response = responses.shift();
    if (!response) throw new Error("unexpected fetch");
    return response;
  };
}

function responseOf(status, contentType, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name) => name.toLowerCase() === "content-type" ? contentType : "" },
    text: async () => body,
  };
}

function exists(file) {
  try { readFileSync(file); return true; } catch { return false; }
}

function assertRedacted(value) {
  const text = JSON.stringify(value);
  for (const marker of secretMarkers) assert.equal(text.includes(marker), false, `sensitive marker leaked: ${marker.slice(0, 8)}`);
  assert.doesNotMatch(text, /Resource|TenantID|Authorization|rawText|rawResponse|"Sign"/u);
}
