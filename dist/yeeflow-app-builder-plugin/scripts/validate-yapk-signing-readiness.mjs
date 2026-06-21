#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { validateYapkSigningReadiness } from "./lib/yapk-signing-readiness-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateYapkSigningReadiness(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--package") args.package = argv[++i];
    else if (token === "--expected-tenant-id") args.expectedTenantId = argv[++i];
    else if (token === "--auth-mode") args.authMode = argv[++i];
    else if (token === "--tenant-url") args.tenantUrl = argv[++i];
    else if (token === "--workspace-id") args.workspaceId = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-yapk-signing-readiness.mjs --package <app.yapk> [--expected-tenant-id <oauth-tenant-id>] [--auth-mode oauth] [--tenant-url <url>] [--workspace-id <id>]`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
