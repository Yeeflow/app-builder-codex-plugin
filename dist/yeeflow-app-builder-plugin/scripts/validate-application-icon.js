#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { validatePackageApplicationIcons } = require("./lib/application-icon-validation.cjs");

function usage() {
  console.error("Usage: node scripts/validate-application-icon.js --package <app.yap|app.yapk> [--domain <domain-key>]");
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--package") args.package = argv[++i];
    else if (token === "--domain") args.domain = argv[++i];
    else if (!args.package && !token.startsWith("--")) args.package = token;
    else usage();
  }
  if (!args.package) usage();
  return args;
}

function readWrapper(packagePath) {
  const resolved = path.resolve(packagePath);
  if (!fs.existsSync(resolved)) {
    return { error: { code: "APPLICATION_PACKAGE_MISSING", message: "Package file is missing.", package: resolved } };
  }
  try {
    return { wrapper: JSON.parse(fs.readFileSync(resolved, "utf8").replace(/^\uFEFF/, "")), package: resolved };
  } catch (error) {
    return { error: { code: "APPLICATION_PACKAGE_JSON_INVALID", message: "Package wrapper must be JSON.", error: error.message, package: resolved } };
  }
}

const args = parseArgs(process.argv);
const loaded = readWrapper(args.package);
if (loaded.error) {
  console.log(JSON.stringify({ status: "fail", errors: [loaded.error] }, null, 2));
  process.exit(1);
}

const result = validatePackageApplicationIcons(loaded.wrapper, { domain: args.domain });
const report = {
  status: result.ok ? "pass" : "fail",
  package: loaded.package,
  icon: result.parsed,
  decodedRootIconSurfaces: result.decodedRootIconSurfaces || [],
  domainRule: result.domainRule ? {
    domain: result.domainRule.domain,
    allowedIconTokens: result.domainRule.allowedIconTokens,
  } : null,
  errors: result.findings,
};
console.log(JSON.stringify(report, null, 2));
process.exit(result.ok ? 0 : 1);
