#!/usr/bin/env node

const path = require("path");
const { atomicWriteAndReadBack, canonicalJson, readCanonicalJson } = require("./scripts/lib/standalone-artifact-utils.cjs");
const { PROFILES, loadIssuedIds, loadJson, validateAIResourceFile, validateAIResourceObject } = require("./validate-ai-resource-wrapper.js");

function buildAIResourceWrapper(kind, officialEnvelope) {
  const profile = PROFILES[kind];
  if (!profile) throw new Error(`Unsupported AI resource kind: ${kind}`);
  const actual = Object.keys(officialEnvelope).sort();
  if (JSON.stringify(actual) !== JSON.stringify(profile.keys)) {
    const error = new Error(`Official envelope must contain exactly ${profile.keys.join(", ")}`);
    error.code = "AI_RESOURCE_INPUT_ENVELOPE_KEYS_INVALID";
    throw error;
  }
  return officialEnvelope;
}

function run(kindOverride = null) {
  const args = process.argv.slice(2);
  const kind = kindOverride || args.shift();
  const inputPath = args.shift();
  const outputPath = args.shift();
  if (!PROFILES[kind] || !inputPath || !outputPath) {
    console.error("Usage: node build-ai-resource-wrapper.js <agent|copilot> <official-envelope.json> <output> --provenance file --import-read file [--issued-ids file]");
    process.exit(2);
  }
  const options = { stage: "final", provenance: null, importRead: null, issuedIds: null };
  while (args.length) {
    const arg = args.shift();
    if (arg === "--stage") throw new Error("AI_RESOURCE_BUILD_STAGE_FIXED_FINAL");
    else if (arg === "--provenance") options.provenance = loadJson(args.shift());
    else if (arg === "--import-read") options.importRead = loadJson(args.shift());
    else if (arg === "--issued-ids") options.issuedIds = loadIssuedIds(args.shift());
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (path.extname(outputPath).toLowerCase() !== PROFILES[kind].extension) throw new Error(`Output path must end with ${PROFILES[kind].extension}`);
  const input = readCanonicalJson(inputPath).value;
  const wrapper = buildAIResourceWrapper(kind, input);
  const prewrite = validateAIResourceObject(kind, wrapper, options);
  if (prewrite.errors.length) {
    console.log(JSON.stringify({ status: "fail", stage: "prewrite", kind, input: path.resolve(inputPath), output: path.resolve(outputPath), errors: prewrite.errors, warnings: prewrite.warnings }, null, 2));
    process.exit(1);
  }
  const bytes = Buffer.from(canonicalJson(wrapper), "utf8");
  let postwrite;
  const committed = atomicWriteAndReadBack(outputPath, bytes, (tempPath) => {
    postwrite = validateAIResourceFile(kind, tempPath, { ...options, requireCanonical: true });
    if (postwrite.status === "fail") {
      const error = new Error(`Post-write ${PROFILES[kind].extension} validation failed`);
      error.code = "AI_RESOURCE_POSTWRITE_VALIDATION_FAILED";
      error.report = postwrite;
      throw error;
    }
  });
  console.log(JSON.stringify({ status: postwrite.warnings.length ? "pass_with_warnings" : "pass", kind, input: path.resolve(inputPath), output: committed.outputPath, bytes: committed.bytes, sha256: committed.sha256, prewrite, postwrite }, null, 2));
}

if (require.main === module) {
  try { run(); }
  catch (error) {
    console.log(JSON.stringify({ status: "fail", code: error.code || "AI_RESOURCE_BUILD_FAILED", message: error.message, report: error.report || null }, null, 2));
    process.exit(1);
  }
}
module.exports = { buildAIResourceWrapper, run };
