#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const codec = require("./scripts/lib/standalone-ydp-codec.cjs");
const { validatePlanTrace, validateYdpArtifact } = require("./validate-ydp.js");

function usage(exitCode = 1) {
  const message = [
    "Usage:",
    "  node build-ydp-wrapper.js <dashboard-build-result.json> <output.ydp> --plan <standalone-artifact-plan.md> --trace <plan.trace.json> --application-plan <core-application-plan.md> [--report <validation-report.json>]",
    "",
    "The input must be a wrapper-ready shared Dashboard build-result. Bare Dashboard bodies are intentionally rejected.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(message);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const positional = [];
  const options = { plan: null, trace: null, applicationPlan: null, report: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--plan") options.plan = argv[++index];
    else if (arg === "--trace") options.trace = argv[++index];
    else if (arg === "--application-plan") options.applicationPlan = argv[++index];
    else if (arg === "--report") options.report = argv[++index];
    else if (arg.startsWith("--")) usage();
    else positional.push(arg);
  }
  if (positional.length !== 2 || !options.plan || !options.trace || !options.applicationPlan) usage();
  return { input: positional[0], output: positional[1], ...options };
}

function fail(code, message, detail = null) {
  const error = new Error(message); error.code = code; error.detail = detail; throw error;
}

function readBuildResult(filePath) {
  let value;
  try { value = JSON.parse(fs.readFileSync(filePath, "utf8")); }
  catch (error) { fail("YDP_BUILD_RESULT_READ_FAILED", "Shared Dashboard build-result could not be read or parsed.", { filePath, error: error.message }); }
  if (!codec.isObject(value) || !codec.isObject(value.body) || !codec.isObject(value.outer)) fail("YDP_BUILD_RESULT_SHAPE_INVALID", "Input must be a shared Dashboard build-result with body and outer objects; bare bodies are not accepted.");
  return value;
}

function tempName(target) { return `${target}.tmp-${process.pid}-${crypto.randomBytes(8).toString("hex")}`; }
function cleanupNew(filePath) { try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {} }

async function main() {
  const args = parseArgs(process.argv);
  const input = path.resolve(args.input);
  const output = path.resolve(args.output);
  const reportPath = path.resolve(args.report || `${args.output}.validation-report.json`);
  if (input === output || input === reportPath || output === reportPath) fail("YDP_PATH_COLLISION", "Input, output YDP, and validation report paths must be distinct.");
  if (fs.existsSync(output) || fs.existsSync(reportPath)) fail("YDP_OUTPUT_EXISTS", "Refusing to overwrite an existing YDP or validation report.", { output, report: reportPath });

  const buildResult = readBuildResult(input);
  const planTraceErrors = [];
  if (!validatePlanTrace(args.plan, args.trace, planTraceErrors)) fail("YDP_PLAN_TRACE_VALIDATION_FAILED", "Dashboard plan/trace did not pass the formal standalone artifact validator.", { errors: planTraceErrors });
  const outer = codec.buildOuter({ listId: buildResult.outer.ListID, layoutId: buildResult.outer.LayoutID, title: buildResult.outer.Title, body: buildResult.body });
  if (codec.stableStringify(outer) !== codec.stableStringify(buildResult.outer)) fail("YDP_BUILD_RESULT_OUTER_MISMATCH", "Build-result outer must be the exact export-proven 11-field wrapper for its shared body.");
  const bytes = codec.encode(outer);

  const preWrite = await validateYdpArtifact({ bytes, buildResult, applicationPlan: path.resolve(args.applicationPlan), input: `${input}#candidate`, planTraceValidated: true });
  if (!/^pass/u.test(preWrite.status)) fail("YDP_PREWRITE_VALIDATION_FAILED", "Generated YDP candidate failed strict pre-write validation.", { errors: preWrite.errors, gates: preWrite.gates });

  fs.mkdirSync(path.dirname(output), { recursive: true });
  const ydpTemporary = tempName(output);
  const reportTemporary = tempName(reportPath);
  let postWrite;
  let report;
  let ydpCommitted = false;
  let reportCommitted = false;
  try {
    fs.writeFileSync(ydpTemporary, bytes, { flag: "wx" });
    const reread = fs.readFileSync(ydpTemporary);
    codec.assertRoundTrip(reread, buildResult.body);
    if (!reread.equals(bytes)) fail("YDP_BYTE_ROUND_TRIP_MISMATCH", "YDP bytes changed after filesystem write/read round-trip.");
    postWrite = await validateYdpArtifact({ bytes: reread, buildResult, applicationPlan: path.resolve(args.applicationPlan), input: ydpTemporary, planTraceValidated: true });
    if (!/^pass/u.test(postWrite.status)) fail("YDP_POSTWRITE_VALIDATION_FAILED", "Generated YDP failed strict post-write validation.", { errors: postWrite.errors, gates: postWrite.gates });
    report = {
      contractVersion: "app-builder.ydp-wrapper-report/1.0.0",
      status: "pass",
      inputBuildResult: input,
      output,
      profile: codec.PROFILE,
      sha256: codec.sha256(bytes),
      byteLength: bytes.length,
      preWrite,
      postWrite,
      proofBoundary: "Static generated-final wrapper and dependency validation only; Yeeflow import, Designer open, rendering, and runtime behavior are not proven.",
    };
    try {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportTemporary, Buffer.from(`${JSON.stringify(report, null, 2)}\n`, "utf8"), { flag: "wx" });
    } catch (error) {
      fail("YDP_REPORT_WRITE_FAILED", "Validation report temporary file could not be created before commit.", { cause: error.code || error.message, report: reportPath });
    }
    fs.renameSync(ydpTemporary, output); ydpCommitted = true;
    fs.renameSync(reportTemporary, reportPath); reportCommitted = true;
  } catch (error) {
    cleanupNew(ydpTemporary);
    cleanupNew(reportTemporary);
    if (ydpCommitted) cleanupNew(output);
    if (reportCommitted) cleanupNew(reportPath);
    throw error;
  }
  console.log(JSON.stringify({ status: "pass", output, report: reportPath, sha256: report.sha256, byteLength: bytes.length }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "fail", errors: [{ code: error.code || "YDP_WRAPPER_FAILED", message: error.message, detail: error.detail || null }] }, null, 2));
  process.exit(1);
});
