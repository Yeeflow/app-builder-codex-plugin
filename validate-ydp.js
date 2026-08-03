#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const codec = require("./scripts/lib/standalone-ydp-codec.cjs");

function usage(exitCode = 1) {
  const message = [
    "Usage:",
    "  node validate-ydp.js <dashboard.ydp> [--build-result <dashboard-build-result.json>] [--plan <standalone-artifact-plan.md> --trace <plan.trace.json> --application-plan <core-application-plan.md>] [--mode <generator|compatibility>] [--stage <final|inspect>] [--json]",
    "",
    "Generator/final validation requires the shared Dashboard build-result, issued dependency closure, shared-builder evidence, plan-trace evidence, and all standalone resource gates.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(message);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, buildResult: null, plan: null, trace: null, applicationPlan: null, mode: "generator", stage: "final", json: false };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--build-result") args.buildResult = argv[++index];
    else if (arg === "--plan") args.plan = argv[++index];
    else if (arg === "--trace") args.trace = argv[++index];
    else if (arg === "--application-plan") args.applicationPlan = argv[++index];
    else if (arg === "--mode") args.mode = argv[++index];
    else if (arg === "--stage") args.stage = argv[++index];
    else if (arg === "--json") args.json = true;
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input || !["generator", "compatibility"].includes(args.mode) || !["final", "inspect"].includes(args.stage) || (args.mode === "generator" && args.stage !== "final")) usage();
  return args;
}

function issue(list, code, message, detail = null, level = "error") { list.push({ level, code, message, detail }); }
function readJson(filePath, errors, code) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
  catch (error) { issue(errors, code, "Required JSON evidence could not be read or parsed.", { filePath, error: error.message }); return null; }
}
function isSha(value) { return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value); }
function asArray(value) { return Array.isArray(value) ? value : []; }

function validateBuildResult(result, decoded, report) {
  if (!codec.isObject(result)) { issue(report.errors, "YDP_BUILD_RESULT_INVALID", "Shared Dashboard build-result must be an object."); return; }
  if (result.contractVersion !== "app-builder.standalone-dashboard-artifact/1.1.0") issue(report.errors, "YDP_BUILD_RESULT_CONTRACT_INVALID", "Build-result must use the current Core standalone Dashboard artifact contract.", { actual: result.contractVersion || null });
  if (typeof result.dashboardId !== "string" || !result.dashboardId.trim()) issue(report.errors, "YDP_DASHBOARD_ID_MISSING", "Core standalone Dashboard build-result requires a non-empty dashboardId.");
  if (result.platformImportReadiness !== "unproven") issue(report.errors, "YDP_PLATFORM_IMPORT_READINESS_INVALID", "Core standalone Dashboard build-result must preserve platformImportReadiness as unproven.", { actual: result.platformImportReadiness ?? null });
  if (!Array.isArray(result.blockers)) issue(report.errors, "YDP_BLOCKERS_INVALID", "Core standalone Dashboard build-result blockers must be an array.");
  if (result.readiness !== "wrapper-ready") issue(report.errors, "YDP_BUILD_RESULT_NOT_WRAPPER_READY", "Only wrapper-ready shared Dashboard build-results may be wrapped.", { readiness: result.readiness || null });
  if (decoded.profile !== codec.PROFILE || result.outerProfile !== codec.PROFILE || result.outerContext !== "standalone-export") issue(report.errors, "YDP_OUTER_PROFILE_INVALID", "Generated wrapper-ready output requires Core's export-proven 11-field standalone-export profile.", { decodedProfile: decoded.profile, buildResultProfile: result.outerProfile || null, outerContext: result.outerContext || null });
  if (result?.sourceBinding?.outerContractVersion !== codec.CONTRACT_VERSION) issue(report.errors, "YDP_OUTER_CONTRACT_VERSION_INVALID", "Build-result must bind the current standalone YDP outer contract version.", { expected: codec.CONTRACT_VERSION, actual: result?.sourceBinding?.outerContractVersion || null });
  if (!codec.isObject(result.body)) issue(report.errors, "YDP_BUILD_RESULT_BODY_MISSING", "Build-result body must be the shared Dashboard builder output object.");
  if (asArray(result.blockers).length) issue(report.errors, "YDP_BUILD_RESULT_BLOCKED", "Wrapper-ready build-result must not contain blockers.", { blockers: result.blockers });
  if (result.identityMode !== "externally-issued") issue(report.errors, "YDP_IDENTITY_MODE_INVALID", "Final YDP requires explicitly externally-issued identity mode.", { identityMode: result.identityMode ?? null });

  const provenance = asArray(result.identityProvenance);
  if (!provenance.length || provenance.some((entry) => entry?.status !== "issued" || entry?.provenance !== "credentialed-id-provider" || !/^[1-9]\d{15,}$/u.test(String(entry?.canonicalId || "")))) {
    issue(report.errors, "YDP_IDENTITY_PROVENANCE_NOT_ISSUED", "Final YDP requires a non-empty closure issued by the credentialed ID provider; copied export, deterministic, synthetic, and fabricated provenance is rejected.");
  }
  const dependencies = asArray(result?.dependencyMap?.dependencies);
  if (!dependencies.length || dependencies.some((entry) => entry?.status !== "issued" || entry?.provenance !== "credentialed-id-provider" || typeof entry?.logicalId !== "string" || typeof entry?.resourceCategory !== "string" || !/^[1-9]\d{15,}$/u.test(String(entry?.canonicalId || "")))) {
    issue(report.errors, "YDP_DEPENDENCY_MAP_NOT_ISSUED", "Final YDP requires a non-empty dependency map with issued canonical identities and resource categories.");
  }

  const binding = result.sourceBinding;
  if (!codec.isObject(binding) || typeof binding.authorizationId !== "string" || !binding.authorizationId.trim() || binding.bridgeContractVersion !== "app-builder.universal-dashboard-resource-graph-bridge/1.0.0" || !["functionalSpecificationSha256", "applicationPlanSha256", "graphSha256", "selectedClosureSha256", "materializationContextSha256"].every((key) => isSha(binding[key]))) issue(report.errors, "YDP_SHARED_BUILDER_SOURCE_BINDING_INVALID", "Core artifact contract, authorization, bridge version, planning hashes, graph closure, and materialization-context hashes are required as shared-builder evidence.");
  if (!codec.isObject(result.sourceBinding) || !isSha(result.sourceBinding.bodySha256) || result.sourceBinding.bodySha256 !== codec.sha256(result.body)) {
    issue(report.errors, "YDP_BODY_SOURCE_BINDING_INVALID", "sourceBinding.bodySha256 must bind the exact shared Dashboard body.");
  }
  if (!isSha(result?.sourceBinding?.dependencyMapSha256) || result.sourceBinding.dependencyMapSha256 !== codec.sha256(result.dependencyMap)) {
    issue(report.errors, "YDP_DEPENDENCY_SOURCE_BINDING_INVALID", "sourceBinding.dependencyMapSha256 must bind the exact dependency map.");
  }
  if (!isSha(result?.sourceBinding?.outerSha256) || result.sourceBinding.outerSha256 !== codec.sha256(result.outer)) issue(report.errors, "YDP_OUTER_SOURCE_BINDING_INVALID", "sourceBinding.outerSha256 must bind the exact export-proven outer.");
  if (result.outer && codec.stableStringify(codec.decode(result.outer).outer) !== codec.stableStringify(decoded.outer)) {
    issue(report.errors, "YDP_BUILD_RESULT_OUTER_MISMATCH", "YDP outer differs from the wrapper metadata in the shared build-result.");
  }
  if (codec.isObject(result.body) && codec.stableStringify(result.body) !== codec.stableStringify(decoded.body)) issue(report.errors, "YDP_BUILD_RESULT_BODY_MISMATCH", "YDP LayoutView differs from the shared Dashboard builder body.");
}

async function validateYdpArtifact({ bytes, buildResult = null, applicationPlan = null, input = null, requireBuildResult = true, requireGeneratedProfile = true, planTraceValidated = false } = {}) {
  const report = { contractVersion: codec.CONTRACT_VERSION, profile: null, status: "fail", input, errors: [], warnings: [], gates: [], roundTrip: { canonicalUtf8: false, requiredOuter: false, layoutViewObject: false, canonicalBytes: false, bodyMatchesBuildResult: false } };
  let decoded;
  try {
    decoded = codec.decode(bytes);
    report.profile = decoded.profile;
    report.roundTrip.canonicalUtf8 = true;
    report.roundTrip.requiredOuter = true;
    report.roundTrip.layoutViewObject = true;
    codec.assertRoundTrip(codec.encode(decoded.outer), decoded.body);
    report.roundTrip.canonicalBytes = Buffer.from(bytes).equals(codec.encode(decoded.outer));
    if (!report.roundTrip.canonicalBytes) issue(requireGeneratedProfile ? report.errors : report.warnings, "YDP_BYTES_NOT_CANONICAL", requireGeneratedProfile ? "Generated-final YDP must use canonical standalone export bytes." : "Compatibility artifact is readable but not canonically encoded.", null, requireGeneratedProfile ? "error" : "warning");
    if (requireGeneratedProfile && decoded.profile !== codec.PROFILE) issue(report.errors, "YDP_OUTER_PROFILE_INVALID", "Generated-final YDP requires the export-proven 11-field profile.", { actual: decoded.profile });
  } catch (error) {
    issue(report.errors, error.code || "YDP_DECODE_FAILED", error.message, { path: error.path || "artifact" });
    return report;
  }
  if (!buildResult) {
    if (requireBuildResult) issue(report.errors, "YDP_BUILD_RESULT_REQUIRED", "Generator/final YDP validation requires the shared Dashboard build-result evidence.");
  } else {
    try { validateBuildResult(buildResult, decoded, report); }
    catch (error) { issue(report.errors, error.code || "YDP_BUILD_RESULT_INVALID", error.message, { path: error.path || "buildResult" }); }
  }
  if (requireGeneratedProfile && !planTraceValidated) issue(report.errors, "YDP_PLAN_TRACE_VALIDATION_REQUIRED", "Generator/final YDP requires successful validate-standalone-artifact-plan-trace execution for --plan and --trace.");
  if (requireGeneratedProfile && !applicationPlan) issue(report.errors, "YDP_APPLICATION_PLAN_REQUIRED", "Generator/final validation requires --application-plan for Core source-binding verification.");
  if (requireGeneratedProfile && applicationPlan && buildResult && codec.sha256(fs.readFileSync(applicationPlan)) !== buildResult?.sourceBinding?.applicationPlanSha256) issue(report.errors, "YDP_APP_PLAN_SOURCE_BINDING_MISMATCH", "Core sourceBinding.applicationPlanSha256 must match the separately supplied Core application plan.");
  report.roundTrip.bodyMatchesBuildResult = Boolean(buildResult?.body) && codec.stableStringify(buildResult.body) === codec.stableStringify(decoded.body);

  if (buildResult) {
    try {
      const { validateStandaloneDashboardResource } = await import("./scripts/lib/standalone-dashboard-resource-gates.mjs");
      const resource = validateStandaloneDashboardResource({ outer: decoded.outer, body: decoded.body, dependencyMap: buildResult.dependencyMap, identityProvenance: buildResult.identityProvenance, plan: applicationPlan });
      report.gates = resource.gates;
      for (const finding of resource.findings) (finding.level === "error" ? report.errors : report.warnings).push(finding);
    } catch (error) { issue(report.errors, "YDP_RESOURCE_GATES_FAILED", "Standalone Dashboard aggregate gates could not run.", { error: error.message }); }
  }
  report.status = report.errors.length ? "fail" : report.warnings.length ? "pass_with_warnings" : "pass";
  return report;
}

async function main() {
  const args = parseArgs(process.argv);
  const errors = [];
  let bytes;
  try { bytes = fs.readFileSync(args.input); }
  catch (error) { issue(errors, "YDP_READ_FAILED", "YDP file could not be read.", { input: args.input, error: error.message }); }
  const buildResult = args.buildResult ? readJson(args.buildResult, errors, "YDP_BUILD_RESULT_READ_FAILED") : null;
  const compatibility = args.mode === "compatibility";
  const planTraceValidated = compatibility ? false : validatePlanTrace(args.plan, args.trace, errors);
  const report = bytes ? await validateYdpArtifact({ bytes, buildResult, applicationPlan: args.applicationPlan ? path.resolve(args.applicationPlan) : null, input: path.resolve(args.input), requireBuildResult: !compatibility, requireGeneratedProfile: !compatibility, planTraceValidated }) : { status: "fail", errors, warnings: [] };
  if (errors.length) report.errors.unshift(...errors);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" || report.status === "pass_with_warnings" ? 0 : 1);
}

function validatePlanTrace(plan, trace, errors) {
  if (!plan || !trace) { issue(errors, "YDP_PLAN_TRACE_REQUIRED", "Generator/final validation requires both --plan and --trace."); return false; }
  const result = spawnSync(process.execPath, [path.resolve(__dirname, "scripts/validate-standalone-artifact-plan-trace.mjs"), "--plan", path.resolve(plan), "--trace", path.resolve(trace)], { encoding: "utf8" });
  if (result.status !== 0) { issue(errors, "YDP_PLAN_TRACE_VALIDATION_FAILED", "Standalone Dashboard plan/trace validation failed.", { stdout: result.stdout, stderr: result.stderr }); return false; }
  return true;
}

module.exports = { main, validateBuildResult, validatePlanTrace, validateYdpArtifact };
if (require.main === module) main().catch((error) => { console.error(JSON.stringify({ status: "fail", errors: [{ code: "YDP_VALIDATOR_CRASHED", message: error.message }] }, null, 2)); process.exit(1); });
