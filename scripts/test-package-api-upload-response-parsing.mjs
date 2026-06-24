#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildApplicationAccessReport,
  classifyApiResult,
  extractApplicationListSetId,
  extractPackageFile,
  summarizeResponse,
} from "./yeeflow-package-api-automation.mjs";

const metadata = { id: "synthetic_upload_file_id_for_test", name: "safe-package-name.yapk", fileSize: 12345 };

await testJsonContentType();
await testTextPlainJson();
await testPlainIdentifierString();
testExtractPackageFileAliases();
await testApplicationListSetExtraction();
testApplicationAccessLinkBuilder();
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

async function testApplicationListSetExtraction() {
  const installSummary = await summarizeResponse(makeResponse(JSON.stringify({
    Status: 0,
    Data: { ID: 123456, Continue: false, Status: 0 },
  }), "application/json"), "/listset/package/install");
  assert.equal(installSummary.applicationListSetId, undefined);

  assert.equal(extractApplicationListSetId({
    Status: 0,
    Data: { ListSetID: "listset-safe-123" },
  }, { label: "/listset/package/import" }), "listset-safe-123");

  assert.equal(extractApplicationListSetId({
    Status: 0,
    Data: { ActionLogID: "not-a-listset-id" },
  }, { label: "/listset/package/import" }), "");

  assert.equal(extractApplicationListSetId({
    Status: 0,
    Data: { ListSetID: "<listset-id>" },
  }, { label: "/listset/package/import" }), "");
}

function testApplicationAccessLinkBuilder() {
  const oauthAuth = {
    mode: "oauth",
    env: {
      tenantUrl: "https://safe-tenant.yeeflow.com",
      tenantUrlSource: "oauth-token-claim",
    },
  };
  const available = buildApplicationAccessReport({
    operation: "install-yapk",
    responseSummary: { ok: true, applicationListSetId: "123456" },
    auth: oauthAuth,
  });
  assert.equal(available.status, "available");
  assert.equal(available.listSetId, "123456");
  assert.equal(available.link, "https://safe-tenant.yeeflow.com/#/list-set/41/123456");
  assert.match(available.proofBoundary, /not browser runtime proof/);

  const packageRoot = buildApplicationAccessReport({
    operation: "install-yapk",
    responseSummary: { ok: true, applicationListSetId: "999999" },
    auth: oauthAuth,
    packageRootProof: { wrapperListId: "123456", decodedListSetId: "123456", rootIdsMatch: true },
  });
  assert.equal(packageRoot.status, "available");
  assert.equal(packageRoot.listSetId, "123456");
  assert.equal(packageRoot.apiReturnedApplicationListSetId, "999999");
  assert.equal(packageRoot.packageRootListSetId, "123456");
  assert.equal(packageRoot.canonicalUrlSource, "decoded-package-root");
  assert.equal(packageRoot.apiRootMatchesPackageRoot, false);
  assert.equal(packageRoot.link, "https://safe-tenant.yeeflow.com/#/list-set/41/123456");

  const envTenant = buildApplicationAccessReport({
    operation: "install-yapk",
    responseSummary: { ok: true, applicationListSetId: "123456" },
    auth: { mode: "oauth", env: { tenantUrl: "https://env-tenant.yeeflow.com", tenantUrlSource: "env" } },
  });
  assert.equal(envTenant.status, "unavailable");
  assert.equal(envTenant.link, null);
  assert.equal(envTenant.message, "Application link: unavailable; ListSetID or tenant URL was not safely resolved.");

  const missingListSet = buildApplicationAccessReport({
    operation: "import-yap",
    responseSummary: { ok: true },
    auth: oauthAuth,
  });
  assert.equal(missingListSet.status, "unavailable");
  assert.equal(missingListSet.link, null);

  const placeholderListSet = buildApplicationAccessReport({
    operation: "install-yapk",
    responseSummary: { ok: true, applicationListSetId: "<listset-id>" },
    auth: oauthAuth,
  });
  assert.equal(placeholderListSet.status, "unavailable");
  assert.equal(placeholderListSet.listSetId, null);

  const rejected = buildApplicationAccessReport({
    operation: "install-yapk",
    responseSummary: { ok: false, applicationListSetId: "123456" },
    auth: oauthAuth,
  });
  assert.equal(rejected.status, "unavailable");
  assert.equal(rejected.link, null);
}

function testUpgradeCheckClassification() {
  const installSubmitted = classifyApiResult({ httpStatus: 200, apiStatus: 0, message: "" });
  assert.equal(installSubmitted.resultClass, "submitted");
  assert.notEqual(installSubmitted.resultClass, "success");
  assert.equal(
    classifyApiResult({ httpStatus: 200, apiStatus: 0, message: "", upgradeCheck: true }).resultClass,
    "upgrade_check_passed",
  );
  assert.equal(
    classifyApiResult({ httpStatus: 200, apiStatus: 0, message: "", upgradeCheck: false }).resultClass,
    "upgrade_submitted",
  );
  assert.notEqual(
    classifyApiResult({ httpStatus: 200, apiStatus: 0, message: "", upgradeCheck: true }).resultClass,
    "success",
  );
  const alreadyInstalled = classifyApiResult({ httpStatus: 200, apiStatus: 540017, message: "already installed" });
  assert.equal(alreadyInstalled.resultClass, "already_installed_in_tenant");
  assert.equal(alreadyInstalled.suggestedNextOperation, "upgrade-check-yapk / upgrade-apply-yapk");
}

function makeResponse(body, contentType) {
  return new Response(body, {
    status: 200,
    headers: { "content-type": contentType },
  });
}
