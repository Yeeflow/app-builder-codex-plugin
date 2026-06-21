#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseSetSignResponse, redactSigningResponseReport } from "./lib/yapk-signing-readiness-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = 1900000000100000n;

function id(offset) {
  return String(API_BASE + BigInt(offset));
}

function decoded() {
  const listSetId = id(1);
  const pageId = id(2);
  const listId = id(3);
  return {
    ListSet: { ListID: listSetId, Title: "Tenant Gate Test", Type: 1024, Flags: 1, TableCode: "flowcraft", IndexCode: "flowcraft" },
    Pages: [{
      ListID: listSetId,
      LayoutID: pageId,
      Type: 103,
      Title: "Dashboard",
      LayoutView: null,
      Ext2: JSON.stringify({ src: true }),
      LayoutInResources: [{ ID: pageId, RefId: pageId, Resource: JSON.stringify({
        title: "Dashboard",
        ver: "1.0.0",
        filterVars: [],
        tempVars: [],
        exts: [],
        actions: [],
        attrs: { container: { padding: 0 } },
        children: [{ id: "Main", name: "Main", type: "container", children: [{ id: "Content", name: "Content", type: "container", children: [] }] }],
      }) }],
    }],
    Forms: [],
    FormNewReports: [],
    Childs: [{
      List: { ListID: listId, Title: "Work Orders", Type: 1, Flags: 1, LayoutView: null, TableCode: "flowcraft", IndexCode: "flowcraft" },
      Fields: [{ ListID: listId, FieldID: id(4), FieldName: "Title", InternalName: "Title", DisplayName: "Title", FieldIndex: 0, IsSystem: true, Type: "input", FieldType: "Text", Category: 1, Rules: "{}", Status: 0 }],
      Layouts: [],
      RemindRules: [],
      PublicForms: [],
      FlowMappings: [],
    }],
  };
}

function wrapper(tenantId, decodedPayload = decoded()) {
  const out = {
    PackageId: "tenant-signing-readiness-test",
    AppID: 41,
    ListID: decodedPayload.ListSet.ListID,
    Title: "Tenant Signing Readiness Test",
    Description: "",
    IconUrl: "",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decodedPayload), "utf8")).toString("base64"),
    Notes: "",
    Author: "regression",
    Date: "2026-06-21T00:00:00Z",
    Version: "0.0.0-test",
    Sign: Buffer.alloc(32, 1).toString("base64"),
  };
  if (tenantId !== undefined) out.TenantID = tenantId;
  return out;
}

function writePackage(dir, name, tenantId, decodedPayload = decoded()) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify(wrapper(tenantId, decodedPayload))}\n`);
  return file;
}

function manifest(decodedPayload, includeTenant = false) {
  const allocations = [
    ["decoded.ListSet.ListID", decodedPayload.ListSet.ListID, "root listset"],
    ["decoded.Pages[0].LayoutID", decodedPayload.Pages[0].LayoutID, "dashboard layout"],
    ["decoded.Childs[0].List.ListID", decodedPayload.Childs[0].List.ListID, "data list"],
    ["decoded.Childs[0].Fields[0].FieldID", decodedPayload.Childs[0].Fields[0].FieldID, "field"],
  ];
  if (includeTenant) allocations.push(["wrapper.TenantID", id(100), "tenant metadata should not be required"]);
  const items = allocations.map(([pathValue, value, purpose]) => ({ path: pathValue, id: String(value), purpose, source: "api-generated" }));
  return {
    sourceMarker: "api-generated",
    totalRequestedIds: items.length,
    totalReceivedIds: items.length,
    generatorProvenance: { generator: "tenant-signing-readiness-test" },
    pathToPurpose: Object.fromEntries(items.map((item) => [item.path, { id: item.id, purpose: item.purpose, source: item.source }])),
    allocations: items,
    unusedCount: 0,
    nonApiIds: [],
  };
}

function writeManifest(dir, name, payload) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
  return file;
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectPass(label, args) {
  const result = run(args);
  assert.equal(result.status, 0, `${label} should pass\n${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function expectCode(label, args, code) {
  const result = run(args);
  assert.notEqual(result.status, 0, `${label} should fail with ${code}`);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, new RegExp(code), `${label} did not report ${code}\n${output}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-signing-readiness-tenantid-"));
const cases = [];

try {
  const base = decoded();
  const realTenantId = id(100);
  const validPackage = writePackage(tempDir, "valid", realTenantId, base);
  const validManifest = writeManifest(tempDir, "valid-id-provenance-report", manifest(base));

  expectCode("TenantID zero blocks signing readiness", ["scripts/validate-yapk-signing-readiness.mjs", "--package", writePackage(tempDir, "zero-tenant", "0")], "SIGNING_TENANT_ID_PLACEHOLDER");
  cases.push({ case: "fail: signing readiness with TenantID 0", status: "pass" });

  expectCode("missing TenantID blocks signing readiness", ["scripts/validate-yapk-signing-readiness.mjs", "--package", writePackage(tempDir, "missing-tenant", undefined)], "SIGNING_TENANT_ID_MISSING");
  expectCode("empty TenantID blocks signing readiness", ["scripts/validate-yapk-signing-readiness.mjs", "--package", writePackage(tempDir, "empty-tenant", "")], "SIGNING_TENANT_ID_MISSING");
  cases.push({ case: "fail: missing/empty TenantID", status: "pass" });

  expectCode("local draft TenantID blocks signing readiness", ["scripts/validate-yapk-signing-readiness.mjs", "--package", writePackage(tempDir, "draft-tenant", "local-draft")], "SIGNING_TENANT_ID_PLACEHOLDER");
  cases.push({ case: "fail: local/draft TenantID placeholder", status: "pass" });

  const readiness = expectPass("real OAuth tenant ID matches context", ["scripts/validate-yapk-signing-readiness.mjs", "--package", validPackage, "--expected-tenant-id", realTenantId, "--auth-mode", "oauth", "--tenant-url", "https://example.yeeflow.example", "--workspace-id", id(200)]);
  assert.equal(readiness.tenantMetadata.classification, "tenant-metadata-not-generated-app-content-id");
  assert.equal(readiness.signingRequestMetadata.rawSignPrinted, false);
  cases.push({ case: "pass: real OAuth tenant ID present and matching context", status: "pass" });

  expectCode("TenantID mismatch blocks signing readiness", ["scripts/validate-yapk-signing-readiness.mjs", "--package", validPackage, "--expected-tenant-id", id(999)], "SIGNING_TENANT_ID_CONTEXT_MISMATCH");
  cases.push({ case: "fail: TenantID mismatch against OAuth context", status: "pass" });

  expectPass("ID provenance ignores wrapper TenantID", ["scripts/validate-yapk-id-provenance.mjs", "--package", validPackage, "--manifest", validManifest]);
  cases.push({ case: "pass: ID provenance ignores wrapper TenantID as generated app content ID", status: "pass" });

  const badContent = decoded();
  badContent.Childs[0].Fields[0].FieldID = id(777);
  const badContentPackage = writePackage(tempDir, "bad-content-id", realTenantId, badContent);
  expectCode("generated app content ID still fails provenance", ["scripts/validate-yapk-id-provenance.mjs", "--package", badContentPackage, "--manifest", validManifest], "ID_PROVENANCE_PACKAGE_ID_NOT_IN_MANIFEST");
  cases.push({ case: "fail: generated app content IDs not in API-ID manifest still fail", status: "pass" });

  const stringSignature = "abc123signature==";
  const parsedString = parseSetSignResponse({ body: JSON.stringify(stringSignature), contentType: "application/json" });
  assert.equal(parsedString.status, "pass");
  assert.equal(parsedString.signature, stringSignature);
  assert.equal(parsedString.report.signatureRedacted, `[redacted-signature:${stringSignature.length}]`);
  cases.push({ case: "pass: setsign parser handles top-level JSON string signature", status: "pass" });

  const objectSignature = "objectSignature==";
  const parsedObject = parseSetSignResponse({ body: JSON.stringify({ Status: 0, Data: { Sign: objectSignature } }), contentType: "application/json" });
  assert.equal(parsedObject.status, "pass");
  assert.equal(parsedObject.signature, objectSignature);
  cases.push({ case: "pass: parser handles object-field signature", status: "pass" });

  const unknown = parseSetSignResponse({ body: JSON.stringify({ Status: 0, Data: { ok: true } }), contentType: "application/json" });
  assert.equal(unknown.status, "fail");
  assert.equal(unknown.report.findings[0].code, "SETSIGN_RESPONSE_SIGNATURE_MISSING");
  cases.push({ case: "fail: unknown signature response shape", status: "pass" });

  const redacted = redactSigningResponseReport({ body: JSON.stringify({ signature: "superSecretSignatureValue" }), contentType: "application/json" });
  assert.equal(redacted.rawSignaturePrinted, false);
  assert.equal(JSON.stringify(redacted).includes("superSecretSignatureValue"), false);
  assert.match(redacted.signatureRedacted, /^\[redacted-signature:\d+\]$/);
  cases.push({ case: "pass: saved signing report redacts signature value", status: "pass" });

  const preflight = run(["scripts/yapk-first-generation-preflight.mjs", "--package", writePackage(tempDir, "preflight-zero-tenant", "0"), "--id-provenance", validManifest, "--json"]);
  assert.notEqual(preflight.status, 0, "preflight should block signing readiness when TenantID is 0");
  assert.match(preflight.stdout, /signing-readiness-tenantid/, `preflight did not include signing readiness gate\n${preflight.stdout}\n${preflight.stderr}`);
  assert.match(preflight.stdout, /SIGNING_TENANT_ID_PLACEHOLDER/, `preflight did not report TenantID placeholder\n${preflight.stdout}\n${preflight.stderr}`);
  cases.push({ case: "fail: signing readiness blocks before setsign when TenantID validation fails", status: "pass" });

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
