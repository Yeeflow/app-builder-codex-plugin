#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_REGISTRY = path.join(ROOT, "docs/reference/full-app-generation-entrypoints.json");

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }
  const report = inspectFullAppGenerationEntrypoints({
    registry: args.registry || DEFAULT_REGISTRY,
    root: args.root || ROOT,
  });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function inspectFullAppGenerationEntrypoints(options = {}) {
  const root = path.resolve(options.root || ROOT);
  const registryPath = path.resolve(options.registry || DEFAULT_REGISTRY);
  const findings = [];
  const registry = readJson(registryPath, findings);
  if (!registry) {
    return buildReport("fail", root, registryPath, [], findings);
  }

  const entrypoints = Array.isArray(registry.entrypoints) ? registry.entrypoints : [];
  if (!entrypoints.length) {
    findings.push(error("FULL_APP_GENERATOR_ENTRYPOINTS_MISSING", "Full-application generation entrypoint registry must declare at least one supported entrypoint."));
  }

  const fullAppEntrypoints = [];
  for (const entrypoint of entrypoints) {
    const normalized = validateEntrypoint(entrypoint, root, findings);
    if (normalized) fullAppEntrypoints.push(normalized);
  }

  if (!fullAppEntrypoints.some((entrypoint) => entrypoint.kind === "skill-orchestrated-full-app-generator")) {
    findings.push(error("FULL_APP_GENERATOR_SKILL_ENTRYPOINT_MISSING", "The plugin must expose at least one skill-orchestrated full-app generator entrypoint for Functional Spec + App Plan generation."));
  }

  validateNonFullAppEntrypoints(registry.nonFullAppEntrypoints, root, findings);
  return buildReport(findings.some((finding) => finding.level === "error") ? "fail" : "pass", root, registryPath, fullAppEntrypoints, findings);
}

function validateEntrypoint(entrypoint, root, findings) {
  if (!entrypoint || typeof entrypoint !== "object") {
    findings.push(error("FULL_APP_GENERATOR_ENTRYPOINT_INVALID", "Entrypoint must be an object.", { entrypoint }));
    return null;
  }
  const id = String(entrypoint.id || "").trim();
  const kind = String(entrypoint.kind || "").trim();
  const entryPath = String(entrypoint.path || "").trim();
  const bundledPath = String(entrypoint.bundledPath || "").trim();
  const sourcePath = String(entrypoint.sourcePath || "").trim();
  const candidatePaths = unique([entryPath, bundledPath, sourcePath].filter(Boolean));
  const resolvedPath = candidatePaths.find((candidate) => fs.existsSync(path.join(root, candidate))) || "";
  if (!id) findings.push(error("FULL_APP_GENERATOR_ENTRYPOINT_ID_MISSING", "Entrypoint is missing id.", { entrypoint }));
  if (!kind) findings.push(error("FULL_APP_GENERATOR_ENTRYPOINT_KIND_MISSING", "Entrypoint is missing kind.", { id }));
  if (!entryPath) findings.push(error("FULL_APP_GENERATOR_ENTRYPOINT_PATH_MISSING", "Entrypoint is missing path.", { id }));
  if (entryPath && !resolvedPath) {
    findings.push(error("FULL_APP_GENERATOR_ENTRYPOINT_PATH_NOT_FOUND", "Entrypoint path does not exist in the current plugin root. Use path for source checkouts and bundledPath for installed plugin payloads when the layouts differ.", { id, path: entryPath, candidatePaths }));
  }
  if (!Array.isArray(entrypoint.inputs) || !entrypoint.inputs.includes("functional-specification.md") || !entrypoint.inputs.includes("yeeflow-app-plan.md")) {
    findings.push(error("FULL_APP_GENERATOR_ENTRYPOINT_INPUT_CONTRACT_INVALID", "Full-app generator entrypoint must declare functional-specification.md and yeeflow-app-plan.md inputs.", { id, inputs: entrypoint.inputs || [] }));
  }
  if (!Array.isArray(entrypoint.supportedOutputs) || !entrypoint.supportedOutputs.some((item) => /\.yapk/i.test(String(item)))) {
    findings.push(error("FULL_APP_GENERATOR_ENTRYPOINT_OUTPUT_CONTRACT_INVALID", "Full-app generator entrypoint must declare generated-final .yapk as a supported output.", { id, supportedOutputs: entrypoint.supportedOutputs || [] }));
  }
  if (!Array.isArray(entrypoint.requiredPlanningGates) || entrypoint.requiredPlanningGates.length < 2) {
    findings.push(error("FULL_APP_GENERATOR_PLANNING_GATES_MISSING", "Full-app generator entrypoint must declare required planning gates.", { id }));
  }
  if (!Array.isArray(entrypoint.requiredGeneratedFinalGates) || entrypoint.requiredGeneratedFinalGates.length < 2) {
    findings.push(error("FULL_APP_GENERATOR_FINAL_GATES_MISSING", "Full-app generator entrypoint must declare required generated-final gates.", { id }));
  }
  validateCallableContract(entrypoint, id, kind, findings);
  if (candidatePaths.some((candidate) => /runtime-proof|delivery-workflow|package-api-automation|vendor-onboarding/i.test(candidate)) && kind.includes("full-app")) {
    findings.push(error("FULL_APP_GENERATOR_ENTRYPOINT_MISCLASSIFIED_HELPER", "Runtime-proof, delivery, package API, and sample-specific helpers must not be classified as generic full-app generators.", { id, path: entryPath, candidatePaths, kind }));
  }
  return { id, kind, path: entryPath, bundledPath: bundledPath || null, resolvedPath: resolvedPath || null, defaultPackageType: entrypoint.defaultPackageType || null };
}

function validateCallableContract(entrypoint, id, kind, findings) {
  if (!kind.includes("full-app")) return;
  const callable = entrypoint.callable === true;
  const callableAs = String(entrypoint.callableAs || "").trim();
  const contract = entrypoint.invocationContract;
  if (!callable || callableAs !== "codex-skill-entrypoint" || !contract || typeof contract !== "object" || Array.isArray(contract)) {
    findings.push(error("FULL_APP_GENERATOR_CALLABLE_CONTRACT_MISSING", "Full-app generator entrypoints must be explicitly callable as Codex skill entrypoints, not only descriptive registry records.", {
      id,
      callable: entrypoint.callable,
      callableAs: entrypoint.callableAs || null,
    }));
    return;
  }

  const executionMode = String(contract.executionMode || "").trim();
  const entrySkill = String(contract.entrySkill || "").trim();
  const requiredInputs = Array.isArray(contract.requiredInputs) ? contract.requiredInputs : [];
  const continuation = String(contract.planningPassContinuation || "").trim();
  if (executionMode !== "codex-skill-callable" || !entrySkill) {
    findings.push(error("FULL_APP_GENERATOR_CALLABLE_CONTRACT_INVALID", "Callable full-app generation entrypoints must declare executionMode codex-skill-callable and an entrySkill.", { id, executionMode, entrySkill }));
  }
  if (!requiredInputs.includes("functional-specification.md") || !requiredInputs.includes("yeeflow-app-plan.md")) {
    findings.push(error("FULL_APP_GENERATOR_CALLABLE_INPUTS_INVALID", "Callable full-app generation contract must repeat the Functional Specification and App Plan Markdown inputs.", { id, requiredInputs }));
  }
  if (contract.mustProceedAfterPlanningPass !== true || !/generated-final/i.test(continuation) || !/do not stop/i.test(continuation) || !/standalone CLI/i.test(continuation)) {
    findings.push(error("FULL_APP_GENERATOR_PLANNING_CONTINUATION_INVALID", "Callable full-app generation contract must require continuation after planning pass and forbid stopping solely because no standalone CLI exists.", {
      id,
      mustProceedAfterPlanningPass: contract.mustProceedAfterPlanningPass || null,
      planningPassContinuation: continuation || null,
    }));
  }
  const hardStops = Array.isArray(contract.hardStops) ? contract.hardStops.map((item) => String(item || "")) : [];
  if (!hardStops.some((item) => /business defaults/i.test(item)) || !hardStops.some((item) => /validators fail/i.test(item) || /validators/i.test(item))) {
    findings.push(error("FULL_APP_GENERATOR_HARD_STOPS_INCOMPLETE", "Callable full-app generation contract must name real hard stops such as unapproved business defaults and generated-final validator failures.", { id, hardStops }));
  }
}

function validateNonFullAppEntrypoints(entries, root, findings) {
  for (const entry of Array.isArray(entries) ? entries : []) {
    const entryPath = String(entry?.path || "").trim();
    const pattern = String(entry?.pattern || "").trim();
    if (!entryPath && !pattern) {
      findings.push(error("NON_FULL_APP_ENTRYPOINT_TARGET_MISSING", "Non-full-app entrypoint records must include path or pattern.", { entry }));
    }
    if (entryPath && !fs.existsSync(path.join(root, entryPath))) {
      findings.push(error("NON_FULL_APP_ENTRYPOINT_PATH_NOT_FOUND", "Non-full-app helper path should exist when declared.", { path: entryPath }));
    }
    if (!String(entry?.reason || "").trim()) {
      findings.push(error("NON_FULL_APP_ENTRYPOINT_REASON_MISSING", "Non-full-app helper records must explain why they are not full-app generators.", { path: entryPath || pattern }));
    }
  }
}

function buildReport(status, root, registry, fullAppEntrypoints, findings) {
  return { status, root, registry, fullAppEntrypoints, findings };
}

function readJson(file, findings) {
  if (!fs.existsSync(file)) {
    findings.push(error("FULL_APP_GENERATOR_REGISTRY_MISSING", "Full-app generation entrypoint registry is missing.", { registry: file }));
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    findings.push(error("FULL_APP_GENERATOR_REGISTRY_JSON_INVALID", `Could not parse full-app generation entrypoint registry: ${err.message}`, { registry: file }));
    return null;
  }
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function unique(values) {
  return [...new Set(values)];
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") {
      args.help = true;
      continue;
    }
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${token}`);
    args[key] = value;
    i += 1;
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/inspect-full-app-generation-entrypoints.mjs [--registry docs/reference/full-app-generation-entrypoints.json] [--root <plugin-root>]

Validates that the plugin declares full-app generation entrypoints and does not misclassify delivery/proof/sample helper scripts as generic generators.`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
