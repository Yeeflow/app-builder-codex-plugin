#!/usr/bin/env node

const path = require("path");
const {
  atomicWriteAndReadBack,
  canonicalJson,
  readCanonicalJson,
} = require("./scripts/lib/standalone-artifact-utils.cjs");
const { loadIssuedIds, validateYcsFile, validateYcsObject } = require("./validate-ycs.js");

function buildYcsObject(input) {
  const config = typeof input.DraftConfig === "string" ? input.DraftConfig : JSON.stringify(input.DraftConfig || {});
  return {
    Name: input.Name,
    Description: input.Description ?? "",
    ImplType: input.ImplType ?? 0,
    DraftCode: input.DraftCode,
    DraftConfig: config,
    ExtData: input.ExtData ?? null,
  };
}

function main() {
  const args = process.argv.slice(2);
  const inputPath = args.shift();
  const outputPath = args.shift();
  if (!inputPath || !outputPath) {
    console.error("Usage: node build-ycs.js <service-definition.json> <output.ycs> [--issued-ids provenance.json]");
    process.exit(2);
  }
  let issuedIdsFile = null;
  while (args.length) {
    const arg = args.shift();
    if (arg === "--issued-ids") issuedIdsFile = args.shift();
    else throw new Error(`Unknown argument: ${arg}`);
  }
  const input = readCanonicalJson(inputPath).value;
  const artifact = buildYcsObject(input);
  const issuedIds = loadIssuedIds(issuedIdsFile);
  const prewrite = validateYcsObject(artifact, { issuedIds });
  if (prewrite.errors.length) {
    console.log(JSON.stringify({ status: "fail", stage: "prewrite", input: path.resolve(inputPath), output: path.resolve(outputPath), errors: prewrite.errors, warnings: prewrite.warnings }, null, 2));
    process.exit(1);
  }
  const bytes = Buffer.from(canonicalJson(artifact), "utf8");
  let postwrite;
  const committed = atomicWriteAndReadBack(outputPath, bytes, (tempPath) => {
    postwrite = validateYcsFile(tempPath, { issuedIds, requireCanonical: true });
    if (postwrite.status === "fail") {
      const error = new Error("Post-write .ycs validation failed");
      error.code = "YCS_POSTWRITE_VALIDATION_FAILED";
      error.report = postwrite;
      throw error;
    }
  });
  console.log(JSON.stringify({ status: postwrite.warnings.length ? "pass_with_warnings" : "pass", input: path.resolve(inputPath), output: committed.outputPath, bytes: committed.bytes, sha256: committed.sha256, prewrite, postwrite }, null, 2));
}

if (require.main === module) {
  try { main(); }
  catch (error) {
    console.log(JSON.stringify({ status: "fail", code: error.code || "YCS_BUILD_FAILED", message: error.message, report: error.report || null }, null, 2));
    process.exit(1);
  }
}

module.exports = { buildYcsObject, main };
