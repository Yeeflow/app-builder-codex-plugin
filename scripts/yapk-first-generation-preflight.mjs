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
  const result = runYapkFirstGenerationPreflight(args.package, { idProvenance: args.idProvenance });
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else printTextResult(result);
  process.exit(result.ok ? 0 : 1);
}

export function runYapkFirstGenerationPreflight(packagePath, options = {}) {
  const resolvedPackage = path.resolve(options.cwd || ROOT, packagePath);
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
  gates.push(runGate("decoded-app-package-runtime", ["validate-yapk-package.js", resolvedPackage]));
  gates.push(runGate("data-list-system-schema", ["scripts/validate-data-list-system-schema.mjs", resolvedPackage, "--strict-generated-list", "--json"]));
  gates.push(runGate("api-issued-content-id-provenance", ["scripts/validate-yapk-id-provenance.mjs", "--package", resolvedPackage, "--manifest", idProvenance]));
  gates.push(runGate("navigation-runtime-metadata", ["scripts/validate-yapk-navigation-runtime-metadata.mjs", "--package", resolvedPackage, "--id-provenance", idProvenance]));

  const failed = gates.find((gate) => !gate.ok);
  return {
    ok: !failed,
    package: summarizePath(resolvedPackage),
    idProvenance: summarizePath(idProvenance),
    failedGate: failed?.gate || null,
    gates,
    proofBoundary: "Local preflight only. ID provenance and navigation metadata are local hard gates; signing/API acceptance/runtime proof still require separate explicit steps.",
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
    else if (token === "--id-provenance") {
      args.idProvenance = argv[i + 1];
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
  console.log("Usage: node scripts/yapk-first-generation-preflight.mjs --package <file.yapk> [--id-provenance <report.json>] [--json]");
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
