#!/usr/bin/env node

import fs from "node:fs";
import zlib from "node:zlib";
import { pathToFileURL } from "node:url";
import { quoteLargeJsonIntegers } from "./lib/yapk-decode-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package) usage(args.help ? 0 : 1);
  const report = decodeYapkTolerantBrotli(args.package);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function decodeYapkTolerantBrotli(packagePath) {
  const attempts = [];
  try {
    const wrapper = JSON.parse(quoteLargeJsonIntegers(fs.readFileSync(packagePath, "utf8").replace(/^\uFEFF/, "")));
    if (!wrapper || typeof wrapper.Resource !== "string") {
      return fail("YAPK_RESOURCE_MISSING", "YAPK wrapper Resource is missing or not a string.", attempts);
    }
    const normalized = normalizeResourceString(wrapper.Resource);
    const buffers = candidateBuffers(normalized);
    for (const candidate of buffers) {
      try {
        const decoded = zlib.brotliDecompressSync(candidate.buffer).toString("utf8");
        const parsed = JSON.parse(quoteLargeJsonIntegers(decoded));
        attempts.push({ mode: candidate.mode, status: "pass" });
        return {
          status: "pass",
          package: packagePath.split("/").slice(-3).join("/"),
          diagnostics: safeDiagnostics(parsed),
          attempts,
          proofBoundary: "This helper only reports safe structural diagnostics. It never prints raw Resource, Sign, payloads, tenant URLs, or decoded package bodies.",
        };
      } catch (error) {
        attempts.push({ mode: candidate.mode, status: "fail", error: error.message.split("\n")[0].slice(0, 120) });
      }
    }
    return fail("YAPK_TOLERANT_BROTLI_DECODE_FAILED", "All safe Brotli decode attempts failed.", attempts);
  } catch (error) {
    return fail("YAPK_TOLERANT_READ_FAILED", `Could not read YAPK wrapper: ${error.message}`, attempts);
  }
}

function normalizeResourceString(resource) {
  return resource.trim().replace(/\s+/g, "");
}

function candidateBuffers(resource) {
  const candidates = [{ mode: "base64-strict", buffer: Buffer.from(resource, "base64") }];
  const padded = resource.padEnd(Math.ceil(resource.length / 4) * 4, "=");
  if (padded !== resource) candidates.push({ mode: "base64-padded", buffer: Buffer.from(padded, "base64") });
  const urlSafe = padded.replace(/-/g, "+").replace(/_/g, "/");
  if (urlSafe !== padded) candidates.push({ mode: "base64-url-safe", buffer: Buffer.from(urlSafe, "base64") });
  return candidates;
}

function safeDiagnostics(decoded) {
  return {
    rootKeys: Object.keys(decoded || {}).filter((key) => !/resource|sign|token|secret|payload/i.test(key)).sort(),
    hasListSet: Boolean(decoded?.ListSet),
    pageCount: Array.isArray(decoded?.Pages) ? decoded.Pages.length : 0,
    childCount: Array.isArray(decoded?.Childs) ? decoded.Childs.length : 0,
    hasReplaceIds: Array.isArray(decoded?.ReplaceIds) || Array.isArray(decoded?.Resource?.ReplaceIds),
  };
}

function fail(code, message, attempts) {
  return {
    status: "fail",
    code,
    message,
    attempts,
    proofBoundary: "Decode failure is reported without printing raw package payloads.",
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--package") args.package = argv[++i];
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/decode-yapk-tolerant-brotli.mjs --package <official-export.yapk>");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
