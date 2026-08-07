#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { summarizeIncrementalBuildLedger, validateIncrementalBuildLedger } from "./lib/yeeflow-incremental-build-ledger.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const options = parseArgs(process.argv.slice(2));
if (!options.ledger || Object.keys(options).length !== 1) fail("LEDGER_ARGUMENT_INVALID", "Usage: node scripts/validate-incremental-mcp-build-ledger.mjs --ledger <path>");
const ledgerPath = resolve(root, options.ledger);
try {
  const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  validateIncrementalBuildLedger(ledger);
  console.log(JSON.stringify({ result: "INCREMENTAL_MCP_BUILD_LEDGER_VALID", ...summarizeIncrementalBuildLedger(ledger) }));
} catch (error) {
  if (error && error.code) fail(error.code, error.message.replace(/^[A-Z_]+: /, ""));
  fail("LEDGER_INVALID_JSON", "Ledger could not be parsed or read.");
}

function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 2) {
    if (!args[index]?.startsWith("--") || !args[index + 1] || args[index + 1].startsWith("--")) fail("LEDGER_ARGUMENT_INVALID", "Arguments must use --name value.");
    result[args[index].slice(2)] = args[index + 1];
  }
  return result;
}
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }
