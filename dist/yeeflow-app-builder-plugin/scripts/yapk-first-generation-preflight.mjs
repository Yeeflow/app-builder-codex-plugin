#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const result = runYapkFirstGenerationPreflight(args.package, {
    plan: args.plan,
    idProvenance: args.idProvenance,
    upgrade: args.upgrade,
    previousPackage: args.previousPackage,
    previousManifest: args.previousManifest,
    newManifest: args.newManifest,
  });
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else printTextResult(result);
  process.exit(result.ok ? 0 : 1);
}

export function runYapkFirstGenerationPreflight(packagePath, options = {}) {
  const resolvedPackage = path.resolve(options.cwd || ROOT, packagePath);
  const plan = options.plan ? path.resolve(options.cwd || ROOT, options.plan) : "";
  const idProvenance = options.idProvenance ? path.resolve(options.cwd || ROOT, options.idProvenance) : defaultIdProvenancePath(resolvedPackage);
  const gates = [];
  if (!resolvedPackage.endsWith(".yapk")) {
    return {
      ok: false,
      package: summarizePath(resolvedPackage),
      failedGate: "package-extension",
      gates: [{ gate: "package-extension", ok: false, code: "YAPK_REQUIRED" }],
    };
  }
  if (!fs.existsSync(resolvedPackage)) {
    return {
      ok: false,
      package: summarizePath(resolvedPackage),
      failedGate: "package-exists",
      gates: [{ gate: "package-exists", ok: false, code: "PACKAGE_NOT_FOUND" }],
    };
  }

  gates.push(runGate("canonical-schema", ["scripts/validate-standard-package-schema.mjs", resolvedPackage]));
  gates.push(runGate("application-fontawesome-icon", ["scripts/validate-application-icon.js", "--package", resolvedPackage]));
  gates.push(runGate("decoded-app-package-runtime", ["validate-yapk-package.js", resolvedPackage]));
  gates.push(runGate("data-list-system-schema", ["scripts/validate-data-list-system-schema.mjs", resolvedPackage, "--strict-generated-list", "--json"]));
  gates.push(runGate("data-list-bit-field-controls", ["scripts/validate-yapk-bit-field-controls.mjs", "--package", resolvedPackage]));
  gates.push(runGate("api-issued-content-id-provenance", ["scripts/validate-yapk-id-provenance.mjs", "--package", resolvedPackage, "--manifest", idProvenance]));
  gates.push(runGate("navigation-runtime-metadata", ["scripts/validate-yapk-navigation-runtime-metadata.mjs", "--package", resolvedPackage, "--id-provenance", idProvenance]));
  gates.push(runGate("live-install-readiness", ["scripts/validate-yapk-live-install-readiness.mjs", "--package", resolvedPackage, "--id-provenance", idProvenance]));
  gates.push(runGate("generated-yapk-export-shape-materialization", ["scripts/validate-generated-yapk-export-shape.mjs", "--package", resolvedPackage]));
  gates.push(runGate("dashboard-grid-table-collections", ["scripts/validate-dashboard-grid-table-collections.mjs", "--package", resolvedPackage]));
  gates.push(runGate("dashboard-dataset-presentation-golden-references", [
    "scripts/validate-dashboard-dataset-presentation-golden-references.mjs",
    "--package",
    resolvedPackage,
    ...(plan ? ["--app-plan", plan] : []),
  ]));
  gates.push(runGate("data-analytics-golden-references", [
    "scripts/validate-data-analytics-golden-references.mjs",
    "--package",
    resolvedPackage,
    ...(plan ? ["--plan", plan] : []),
  ]));
  gates.push(runGate("data-filter-standard-group", [
    "scripts/validate-data-filter-standard-group.mjs",
    "--package",
    resolvedPackage,
  ]));
  gates.push(runGate("data-list-form-layouts-v1.1", [
    "scripts/validate-data-list-form-layout-template.mjs",
    "--package",
    resolvedPackage,
    ...(plan ? ["--plan", plan] : []),
  ]));
  gates.push(runGate("data-list-form-fields-v1.1", [
    "scripts/validate-data-list-form-fields-template.mjs",
    "--package",
    resolvedPackage,
    ...(plan ? ["--plan", plan] : []),
  ]));
  gates.push(runGate("approval-form-layouts-v1.1", [
    "scripts/validate-approval-form-layout-template.mjs",
    "--package",
    resolvedPackage,
    ...(plan ? ["--plan", plan] : []),
  ]));
  gates.push(runGate("dashboard-generation-hard-gates", [
    "scripts/validate-dashboard-generation-hard-gates.mjs",
    "--package",
    resolvedPackage,
    ...(plan ? ["--plan", plan] : []),
  ]));
  gates.push(runGate("dashboard-summary-control-contract", [
    "scripts/inspect-dashboard-summary-control-contract.mjs",
    "--package",
    resolvedPackage,
  ]));
  gates.push(runGate("dashboard-golden-reference-conformance", [
    "scripts/validate-dashboard-golden-reference-conformance.mjs",
    "--package",
    resolvedPackage,
  ]));
  if (plan) {
    gates.push(runGate("generated-final-resource-completeness", ["scripts/validate-generated-final-resource-completeness.mjs", "--plan", plan, "--package", resolvedPackage]));
  }
  if (options.upgrade || options.previousPackage || options.previousManifest || options.newManifest) {
    gates.push(runUpgradeIdStabilityGate({
      resolvedPackage,
      cwd: options.cwd || ROOT,
      previousPackage: options.previousPackage,
      previousManifest: options.previousManifest,
      newManifest: options.newManifest,
    }));
  }
  gates.push({
    gate: "package-workspace-selection-readiness",
    ok: true,
    exitCode: 0,
    stdoutBytes: 0,
    stderrBytes: 0,
    codes: [],
    note: "Package install/import/upgrade must still stop with workspace_selection_required until an API-discovered flowcraft workspace is explicitly selected; local YEEFLOW_WORKSPACE_ID is ignored for package writes.",
  });

  const failed = gates.find((gate) => !gate.ok);
  const ok = !failed;
  return {
    ok,
    package: summarizePath(resolvedPackage),
    plan: plan ? summarizePath(plan) : null,
    idProvenance: summarizePath(idProvenance),
    failedGate: failed?.gate || null,
    preflightEligibleForSigning: ok,
    signingReadinessSource: "yapk-first-generation-preflight",
    signingReadiness: {
      status: ok ? "preflight-pass" : "preflight-fail",
      preflightEligibleForSigning: ok,
      source: "yapk-first-generation-preflight",
      blockedBy: failed?.gate || null,
      nextRequiredStages: ok
        ? ["setsign", "verifysign", "package API install/import or upgrade", "Version Management final success where applicable", "browser/runtime proof"]
        : ["fix generated-final preflight failures", "rerun yapk-first-generation-preflight"],
    },
    gates,
    proofBoundary: "Local preflight only. ID provenance, upgrade ID stability, Bit/switch data-list field controls, navigation metadata, dashboard dataset presentation reference conformance, dashboard grid-table Collection validation, and package workspace-selection readiness are separate hard gates; signing/signature verification do not prove ID continuity, workspace targeting correctness, or field runtime correctness, API acceptance is not runtime browser proof, and runtime designer proof still requires a separate explicit step.",
  };
}

function defaultIdProvenancePath(packagePath) {
  return packagePath.replace(/(?:\.signed)?\.yapk$/i, "-id-provenance-report.json");
}

function runGate(gate, args) {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  return {
    gate,
    ok: result.status === 0,
    exitCode: result.status,
    stdoutBytes: Buffer.byteLength(result.stdout || ""),
    stderrBytes: Buffer.byteLength(result.stderr || ""),
    codes: extractCodes(`${result.stdout || ""}\n${result.stderr || ""}`),
  };
}

function runUpgradeIdStabilityGate({ resolvedPackage, cwd, previousPackage, previousManifest, newManifest }) {
  const missing = [];
  if (!previousPackage) missing.push("--previous-package");
  if (!previousManifest) missing.push("--previous-manifest");
  if (!newManifest) missing.push("--new-manifest");
  if (missing.length) {
    return {
      gate: "upgrade-id-stability",
      ok: false,
      exitCode: 1,
      stdoutBytes: 0,
      stderrBytes: 0,
      codes: ["UPGRADE_ID_STABILITY_EVIDENCE_REQUIRED"],
      missing,
      note: "Upgrade/new-version YAPK validation requires previous package, previous lineage manifest, and new lineage manifest before signing, upgrade-check, upgrade, install-like writes, or handoff.",
    };
  }
  return runGate("upgrade-id-stability", [
    "scripts/validate-yapk-upgrade-id-stability.mjs",
    "--previous-package",
    path.resolve(cwd, previousPackage),
    "--previous-manifest",
    path.resolve(cwd, previousManifest),
    "--new-package",
    resolvedPackage,
    "--new-manifest",
    path.resolve(cwd, newManifest),
  ]);
}

function extractCodes(text) {
  const codes = new Set();
  for (const match of text.matchAll(/"code"\s*:\s*"([A-Z0-9_]+)"/g)) codes.add(match[1]);
  for (const match of text.matchAll(/\b([A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+)\b/g)) codes.add(match[1]);
  return [...codes].slice(0, 25);
}

function summarizePath(filePath) {
  return {
    name: path.basename(filePath),
    ext: path.extname(filePath),
    exists: fs.existsSync(filePath),
    fileSize: fs.existsSync(filePath) ? fs.statSync(filePath).size : null,
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--json") args.json = true;
    else if (token === "--upgrade") args.upgrade = true;
    else if (token === "--id-provenance") {
      args.idProvenance = argv[i + 1];
      i += 1;
    } else if (token === "--plan") {
      args.plan = argv[i + 1];
      i += 1;
    } else if (token === "--previous-package") {
      args.previousPackage = argv[i + 1];
      i += 1;
    } else if (token === "--previous-manifest" || token === "--previous-lineage" || token === "--previous-id-lineage") {
      args.previousManifest = argv[i + 1];
      i += 1;
    } else if (token === "--new-manifest" || token === "--new-lineage" || token === "--new-id-lineage") {
      args.newManifest = argv[i + 1];
      i += 1;
    }
    else if (token === "--package") {
      args.package = argv[i + 1];
      i += 1;
    } else if (!args.package && !token.startsWith("--")) {
      args.package = token;
    } else {
      throw new Error(`Unexpected argument: ${token}`);
    }
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/yapk-first-generation-preflight.mjs --package <file.yapk> [--id-provenance <report.json>] [--json]
  node scripts/yapk-first-generation-preflight.mjs --package <file.yapk> --plan <yeeflow-app-plan.md> [--id-provenance <report.json>] [--json]
  node scripts/yapk-first-generation-preflight.mjs --package <new.yapk> --upgrade \\
    --previous-package <previous.yapk> \\
    --previous-manifest <previous-id-lineage.json> \\
    --new-manifest <new-id-lineage.json> [--id-provenance <report.json>] [--json]`);
}

function printTextResult(result) {
  console.log(`YAPK first-generation preflight: ${result.ok ? "pass" : "fail"}`);
  for (const gate of result.gates) {
    console.log(`- ${gate.gate}: ${gate.ok ? "pass" : "fail"}`);
  }
  if (result.failedGate) console.log(`failedGate: ${result.failedGate}`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
