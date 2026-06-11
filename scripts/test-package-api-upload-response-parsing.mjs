#!/usr/bin/env node

import assert from "node:assert/strict";
import { classifyApiResult, extractPackageFile, summarizeResponse } from "./yeeflow-package-api-automation.mjs";

const metadata = { id: "synthetic_upload_file_id_for_test", name: "safe-package-name.yapk", fileSize: 12345 };

await testJsonContentType();
await testTextPlainJson();
await testPlainIdentifierString();
testExtractPackageFileAliases();
testUpgradeCheckClassification();

console.log("package-api-upload-response-parsing tests passed");

async function testJsonContentType() {
  const summary = await summarizeResponse(makeResponse(JSON.stringify(metadata), "application/json; charset=utf-8"), "upload");
  assert.equal(summary.ok, true);
  assert.deepEqual(summary.responseKeys, ["id", "name", "fileSize"]);
  assert.equal(summary.packageFile.Id, "[redacted]");
  assert.equal(summary.packageFile.Name, "safe-package-name.yapk");
  assert.equal(summary.packageFile.FileSize, 12345);
  assert.equal(JSON.stringify(summary).includes("synthetic_upload_file_id_for_test"), false);
}

async function testTextPlainJson() {
  const summary = await summarizeResponse(makeResponse(JSON.stringify(metadata), "text/plain; charset=utf-8"), "upload");
  assert.equal(summary.ok, true);
  assert.deepEqual(summary.responseKeys, ["id", "name", "fileSize"]);
  assert.equal(summary.packageFile.Id, "[redacted]");
  assert.equal(summary.dataShape.type, "object");
  assert.deepEqual(summary.dataShape.keys, ["id", "name", "fileSize"]);
  assert.equal(JSON.stringify(summary).includes("synthetic_upload_file_id_for_test"), false);
}

async function testPlainIdentifierString() {
  const summary = await summarizeResponse(makeResponse("opaque-upload-id", "text/plain; charset=utf-8"), "upload");
  assert.equal(summary.ok, true);
  assert.equal(summary.responseKeys.length, 0);
  assert.equal(summary.packageFile, undefined);
  assert.equal(summary.dataShape, null);
}

function testExtractPackageFileAliases() {
  assert.deepEqual(extractPackageFile({ ID: "synthetic_id", Name: "x.yapk", FileSize: 7 }), {
    Id: "synthetic_id",
    Name: "x.yapk",
    FileSize: 7,
  });
}

function testUpgradeCheckClassification() {
  assert.equal(
    classifyApiResult({ httpStatus: 200, apiStatus: 0, message: "", upgradeCheck: true }).resultClass,
    "upgrade_check_passed",
  );
  assert.equal(
    classifyApiResult({ httpStatus: 200, apiStatus: 0, message: "", upgradeCheck: false }).resultClass,
    "upgrade_applied",
  );
  assert.notEqual(
    classifyApiResult({ httpStatus: 200, apiStatus: 0, message: "", upgradeCheck: true }).resultClass,
    "success",
  );
}

function makeResponse(body, contentType) {
  return new Response(body, {
    status: 200,
    headers: { "content-type": contentType },
  });
}
