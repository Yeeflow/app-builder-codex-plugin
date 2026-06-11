#!/usr/bin/env node

import { listCapabilities, summarizeCapability } from "./lib/yeeflow-api-capabilities.mjs";

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printUsage();
  process.exit(0);
}

const capabilities = listCapabilities({
  readOnly: args.readOnly,
  write: args.write,
  filter: args.filter,
}).map(summarizeCapability);

console.log(JSON.stringify({
  count: capabilities.length,
  filters: {
    readOnly: Boolean(args.readOnly),
    write: Boolean(args.write),
    filter: args.filter || null,
  },
  capabilities,
}, null, 2));

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--read-only") parsed.readOnly = true;
    else if (token === "--write") parsed.write = true;
    else if (token === "--help") parsed.help = true;
    else if (token === "--filter") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error("--filter requires a value.");
      parsed.filter = value;
      i += 1;
    } else {
      throw new Error(`Unexpected argument: ${token}`);
    }
  }
  if (parsed.readOnly && parsed.write) throw new Error("Use either --read-only or --write, not both.");
  return parsed;
}

function printUsage() {
  console.log(`Usage:
  node scripts/yeeflow-api-list-capabilities.mjs
  node scripts/yeeflow-api-list-capabilities.mjs --read-only
  node scripts/yeeflow-api-list-capabilities.mjs --write
  node scripts/yeeflow-api-list-capabilities.mjs --filter locations

Lists the documented Yeeflow REST API capability map. This command makes no live API calls and prints no secrets.`);
}
