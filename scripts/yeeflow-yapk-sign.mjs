#!/usr/bin/env node

import { resolveYeeflowApiAuth, mergeAuthHeaders, safeAuthError } from "./lib/yeeflow-api-auth.mjs";
import { signAndVerifyYapk, YeeflowYapkSigningError } from "./lib/yeeflow-yapk-signing.mjs";

const args = parseArgs(process.argv.slice(2));

try {
  if (!args.execute) throw new Error("YAPK_SIGN_EXECUTE_REQUIRED: add --execute after generated-final preflight passes and signing is authorized.");
  const auth = await resolveYeeflowApiAuth({ dotenv: args.dotenv, onDemandLogin: true, oauthOnly: true });
  if (auth.mode !== "oauth") throw new Error("YAPK_SIGN_AUTH_REQUIRED: Yeeflow browser login did not complete; no signing request was sent.");
  const result = await signAndVerifyYapk({
    inputPath: args.package,
    outputPath: args.output,
    apiBaseUrl: auth.env.apiBaseUrl,
    headers: mergeAuthHeaders(auth),
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  const report = {
    status: "signing_failed",
    installAllowed: false,
    code: error instanceof YeeflowYapkSigningError ? error.code : publicErrorCode(error),
    diagnostics: error instanceof YeeflowYapkSigningError ? error.diagnostics : {},
  };
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

function publicErrorCode(error) {
  const candidate = safeAuthError(error).split(":", 1)[0];
  return /^YAPK_[A-Z0-9_.-]+$/u.test(candidate) ? candidate : "YAPK_SIGN_OPERATION_FAILED";
}

function parseArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--execute") { values.set("execute", true); continue; }
    if (!arg.startsWith("--") || !argv[index + 1] || argv[index + 1].startsWith("--")) throw new Error(`YAPK_SIGN_ARGUMENT_INVALID:${arg}`);
    values.set(arg.slice(2), argv[index + 1]);
    index += 1;
  }
  if (!values.get("package")) throw new Error("YAPK_SIGN_PACKAGE_REQUIRED");
  if (!values.get("output")) throw new Error("YAPK_SIGN_OUTPUT_REQUIRED");
  return { package: values.get("package"), output: values.get("output"), dotenv: values.get("dotenv") || ".env.local", execute: values.get("execute") === true };
}
