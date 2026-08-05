#!/usr/bin/env node

const path = require("path");
const { atomicWriteAndReadBack, canonicalJson, readCanonicalJson } = require("./scripts/lib/standalone-artifact-utils.cjs");
const { loadIssuedIds, validateScheduledYwfFile, validateScheduledYwfObject } = require("./validate-scheduled-ywf.js");

function buildScheduledWrapper(input) {
  const def = input.Def ?? input.def;
  const flowKey = input.FlowKey ?? input.Key ?? def?.defkey;
  const settings = input.Settings ?? input.settings;
  return {
    Def: Buffer.from(JSON.stringify(def), "utf8").toString("base64"),
    Img: input.Img ?? null,
    Icon: input.Icon ?? "",
    FlowName: input.FlowName ?? input.Name,
    FlowKey: flowKey,
    Description: input.Description ?? "",
    WorkflowType: 3,
    Settings: typeof settings === "string" ? settings : JSON.stringify(settings),
  };
}

function main() {
  const args = process.argv.slice(2);
  const inputPath = args.shift();
  const outputPath = args.shift();
  if (!inputPath || !outputPath) {
    console.error("Usage: node build-scheduled-ywf-wrapper.js <scheduled-definition.json> <output.ywf> --issued-ids provenance.json [--dependency-map dependencies.json] [--allow-recipients]");
    process.exit(2);
  }
  const options = { stage: "final", issuedIds: null, allowRecipients: false, dependencyMap: null };
  while (args.length) {
    const arg = args.shift();
    if (arg === "--stage") throw new Error("Scheduled Workflow builder always runs in final mode; --stage is not accepted");
    else if (arg === "--issued-ids") options.issuedIds = loadIssuedIds(args.shift());
    else if (arg === "--dependency-map") options.dependencyMap = JSON.parse(require("fs").readFileSync(args.shift(), "utf8"));
    else if (arg === "--allow-recipients") options.allowRecipients = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  const input = readCanonicalJson(inputPath).value;
  if (path.extname(outputPath).toLowerCase() !== ".ywf") throw new Error("Output path must end with .ywf");
  const wrapper = buildScheduledWrapper(input);
  const prewrite = validateScheduledYwfObject(wrapper, options);
  if (prewrite.errors.length) {
    console.log(JSON.stringify({ status: "fail", stage: "prewrite", input: path.resolve(inputPath), output: path.resolve(outputPath), errors: prewrite.errors, warnings: prewrite.warnings }, null, 2));
    process.exit(1);
  }
  const bytes = Buffer.from(canonicalJson(wrapper), "utf8");
  let postwrite;
  const committed = atomicWriteAndReadBack(outputPath, bytes, (tempPath) => {
    postwrite = validateScheduledYwfFile(tempPath, { ...options, requireCanonical: true });
    if (postwrite.status === "fail") {
      const error = new Error("Post-write Scheduled .ywf validation failed");
      error.code = "SCHEDULED_YWF_POSTWRITE_VALIDATION_FAILED";
      error.report = postwrite;
      throw error;
    }
  });
  console.log(JSON.stringify({ status: postwrite.warnings.length ? "pass_with_warnings" : "pass", input: path.resolve(inputPath), output: committed.outputPath, bytes: committed.bytes, sha256: committed.sha256, prewrite: { errors: prewrite.errors, warnings: prewrite.warnings }, postwrite }, null, 2));
}

if (require.main === module) {
  try { main(); }
  catch (error) {
    console.log(JSON.stringify({ status: "fail", code: error.code || "SCHEDULED_YWF_BUILD_FAILED", message: error.message, report: error.report || null }, null, 2));
    process.exit(1);
  }
}
module.exports = { buildScheduledWrapper, main };
