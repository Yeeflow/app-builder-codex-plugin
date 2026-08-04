#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { atomicWriteAndReadBack, canonicalJson, readCanonicalJson, sha256 } = require("./scripts/lib/standalone-artifact-utils.cjs");
const { buildAIResourceWrapper } = require("./build-ai-resource-wrapper.js");
const { PROFILES, loadIssuedIds, validateAIResourceFile, validateAIResourceObject } = require("./validate-ai-resource-wrapper.js");

const EVIDENCE_KEYS = ["endpointKind", "envelope", "importRead", "operation", "responseId", "source"];
const ALLOWED_SOURCES = new Set(["yeeflow-official-export", "yeeflow-official-import-export-api"]);

function buildIntegrityReceipt(kind, evidence) {
  const profile = PROFILES[kind];
  if (!profile) throw Object.assign(new Error(`Unsupported AI resource kind: ${kind}`), { code: "AI_RESOURCE_KIND_INVALID" });
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) throw Object.assign(new Error("Official response evidence must be an object"), { code: "AI_RESOURCE_EVIDENCE_INVALID" });
  const actual = Object.keys(evidence).sort();
  if (JSON.stringify(actual) !== JSON.stringify(EVIDENCE_KEYS)) throw Object.assign(new Error(`Official response evidence must contain exactly: ${EVIDENCE_KEYS.join(", ")}`), { code: "AI_RESOURCE_EVIDENCE_KEYS_INVALID" });
  if (!ALLOWED_SOURCES.has(evidence.source)) throw Object.assign(new Error("Evidence source is not an allowed official Yeeflow source"), { code: "AI_RESOURCE_EVIDENCE_SOURCE_INVALID" });
  for (const key of ["operation", "endpointKind", "responseId"]) if (typeof evidence[key] !== "string" || !evidence[key].trim()) throw Object.assign(new Error(`Evidence ${key} must be a non-empty string`), { code: "AI_RESOURCE_EVIDENCE_RECEIPT_INCOMPLETE" });
  const wrapper = buildAIResourceWrapper(kind, evidence.envelope);
  return {
    wrapper,
    importRead: evidence.importRead,
    receipt: {
      source: evidence.source,
      artifactType: profile.extension.slice(1),
      packageJsonSha256: sha256(Buffer.from(wrapper.PackageJson, "utf8")),
      envelopeSha256: sha256(Buffer.from(canonicalJson(wrapper), "utf8")),
      importReadSha256: sha256(Buffer.from(canonicalJson(evidence.importRead), "utf8")),
      operation: evidence.operation,
      endpointKind: evidence.endpointKind,
      responseId: evidence.responseId,
    },
  };
}

function run(kindOverride = null) {
  const args = process.argv.slice(2);
  const kind = kindOverride || args.shift();
  const evidencePath = args.shift();
  const outputPath = args.shift();
  if (!PROFILES[kind] || !evidencePath || !outputPath) throw new Error("Usage: node finalize-ai-resource-from-official-response.js <agent|copilot> <official-response-evidence.json> <output> --receipt <receipt.json> [--issued-ids ids.json]");
  if (path.extname(outputPath).toLowerCase() !== PROFILES[kind].extension) throw new Error(`Output path must end with ${PROFILES[kind].extension}`);
  let receiptPath = null;
  let issuedIds = null;
  while (args.length) {
    const arg = args.shift();
    if (arg === "--receipt") receiptPath = args.shift();
    else if (arg === "--issued-ids") issuedIds = loadIssuedIds(args.shift());
    else if (arg === "--stage") throw new Error("AI resource finalization is fixed to final mode");
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!receiptPath) throw Object.assign(new Error("--receipt is required"), { code: "AI_RESOURCE_RECEIPT_OUTPUT_REQUIRED" });
  const evidence = readCanonicalJson(evidencePath).value;
  const { wrapper, importRead, receipt } = buildIntegrityReceipt(kind, evidence);
  const options = { stage: "final", provenance: receipt, importRead, issuedIds, requireCanonical: true };
  const prewrite = validateAIResourceObject(kind, wrapper, options);
  if (prewrite.errors.length) throw Object.assign(new Error("Official response evidence failed final pre-write validation"), { code: "AI_RESOURCE_EVIDENCE_PREWRITE_FAILED", report: prewrite });
  let postwrite;
  const committed = atomicWriteAndReadBack(outputPath, Buffer.from(canonicalJson(wrapper), "utf8"), (tempPath) => {
    postwrite = validateAIResourceFile(kind, tempPath, options);
    if (postwrite.status === "fail") throw Object.assign(new Error("Final AI resource failed post-write validation"), { code: "AI_RESOURCE_EVIDENCE_POSTWRITE_FAILED", report: postwrite });
  });
  const receiptCommitted = atomicWriteAndReadBack(receiptPath, Buffer.from(canonicalJson(receipt), "utf8"));
  console.log(JSON.stringify({ status: postwrite.warnings.length ? "pass_with_warnings" : "pass", kind, mode: "official-response-evidence", output: committed.outputPath, receipt: receiptCommitted.outputPath, bytes: committed.bytes, sha256: committed.sha256, postwrite }, null, 2));
}

if (require.main === module) {
  try { run(); }
  catch (error) { console.log(JSON.stringify({ status: "fail", code: error.code || "AI_RESOURCE_FINALIZATION_FAILED", message: error.message, report: error.report || null }, null, 2)); process.exit(1); }
}

module.exports = { buildIntegrityReceipt, run };
