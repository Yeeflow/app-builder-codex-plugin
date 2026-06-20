#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { pathToFileURL } from "node:url";
import { isObject, readDecodedYapk, walk } from "./lib/yapk-decode-utils.mjs";

const DRAFT_VALUE_RE = /(?:^|[^A-Za-z0-9])local-draft(?:-[A-Za-z0-9_.:-]+)?(?:$|[^A-Za-z0-9])|localDraft|sourceMarker:\s*local-draft-no-api/i;
const DRAFT_KEY_RE = /^(?:localDraft|local_draft|local-draft|sourceMarker)$/i;
const LOGICAL_REF_VALUE_RE = /(?:^|[^A-Za-z0-9])(?:logical-ref|logicalRef|unresolved-logical-ref|appPlanRef|pageFunctionPlanRef|blueprintRef):[A-Za-z0-9_.:/-]+/i;
const LOGICAL_REF_KEY_RE = /^(?:logicalRef|logical_ref|logical-ref|unresolvedLogicalRef|appPlanRef|pageFunctionPlanRef|blueprintRef)$/i;
const JSON_LIKE_RE = /^\s*[\[{]/;

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.package && !args.decoded)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateGeneratedFinalDraftPlaceholders(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateGeneratedFinalDraftPlaceholders(options) {
  const mode = options.mode || "generated-final";
  const findings = [];
  let roots;
  try {
    roots = loadRoots(options);
  } catch (error) {
    return {
      status: "fail",
      mode,
      findings: [finding("error", "DRAFT_PLACEHOLDER_INPUT_INVALID", error.message)],
    };
  }

  const matches = scanDraftPlaceholders(roots);
  const logicalRefs = scanUnresolvedLogicalRefs(roots);
  if (mode === "generated-final") {
    for (const match of matches.slice(0, 100)) {
      findings.push(finding("error", "GENERATED_FINAL_DRAFT_PLACEHOLDER", "Generated-final packages must not contain unresolved local draft placeholders after API ID allocation.", match));
    }
    for (const match of logicalRefs.slice(0, 100)) {
      findings.push(finding("error", "GENERATED_FINAL_UNRESOLVED_LOGICAL_REF", "Generated-final packages must be built ID-first from a complete logicalRef-to-apiIssuedId map and must not contain unresolved logical references.", match));
    }
    if (matches.length > 100) {
      findings.push(finding("error", "GENERATED_FINAL_DRAFT_PLACEHOLDER_TRUNCATED", "Additional unresolved local draft placeholders remain after the first 100 findings.", { additionalCount: matches.length - 100 }));
    }
    if (logicalRefs.length > 100) {
      findings.push(finding("error", "GENERATED_FINAL_UNRESOLVED_LOGICAL_REF_TRUNCATED", "Additional unresolved logical references remain after the first 100 findings.", { additionalCount: logicalRefs.length - 100 }));
    }
  }

  const passed = !findings.some((item) => item.level === "error");
  return {
    status: passed ? "pass" : "fail",
    mode,
    package: options.package ? path.resolve(options.package) : null,
    decoded: options.decoded ? path.resolve(options.decoded) : null,
    draftPlaceholderCount: matches.length,
    unresolvedLogicalRefCount: logicalRefs.length,
    signInstallEligible: mode === "generated-final" && passed,
    scannedRoots: Object.keys(roots),
    findings,
    localDraftModeBoundary: mode === "local-draft"
      ? "Local-draft mode reports placeholders without failing and is never sign/install eligible."
      : "Generated-final mode fails any local-draft/localDraft/sourceMarker local-draft sentinel or unresolved logical reference anywhere in wrapper, decoded resource, parsed resource strings, encoded approval definitions, actions, bindings, links, navigation metadata, theme payloads, or version fields.",
  };
}

export function scanDraftPlaceholders(roots) {
  const matches = [];
  const seenParsed = new Set();
  for (const [rootName, rootValue] of Object.entries(roots)) {
    scanValue(rootValue, rootName, matches, seenParsed, { keyRe: DRAFT_KEY_RE, valueRe: DRAFT_VALUE_RE, kindPrefix: "draft" });
  }
  return matches;
}

export function scanUnresolvedLogicalRefs(roots) {
  const matches = [];
  const seenParsed = new Set();
  for (const [rootName, rootValue] of Object.entries(roots)) {
    scanValue(rootValue, rootName, matches, seenParsed, { keyRe: LOGICAL_REF_KEY_RE, valueRe: LOGICAL_REF_VALUE_RE, kindPrefix: "logical-ref" });
  }
  return matches;
}

function scanValue(value, pointer, matches, seenParsed, options) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanValue(item, `${pointer}[${index}]`, matches, seenParsed, options));
    return;
  }
  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const childPointer = `${pointer}.${escapePathKey(key)}`;
      if (options.keyRe.test(key) && child !== undefined && child !== null && child !== "" && (child === true || child === "true" || options.valueRe.test(String(child ?? "")) || options.kindPrefix === "logical-ref")) {
        matches.push({ path: childPointer, kind: `${options.kindPrefix}-key`, key, value: redactValue(child) });
      }
      scanValue(child, childPointer, matches, seenParsed, options);
    }
    return;
  }
  if (typeof value !== "string") return;

  if (options.valueRe.test(value)) {
    matches.push({ path: pointer, kind: `${options.kindPrefix}-string`, value: redactValue(value) });
  }

  for (const parsed of parseEmbeddedPayloads(value, pointer)) {
    const dedupeKey = `${parsed.path}:${parsed.kind}:${stablePreview(parsed.value)}`;
    if (seenParsed.has(dedupeKey)) continue;
    seenParsed.add(dedupeKey);
    scanValue(parsed.value, parsed.path, matches, seenParsed, options);
  }
}

function parseEmbeddedPayloads(value, pointer) {
  const out = [];
  const trimmed = value.trim();
  if (JSON_LIKE_RE.test(trimmed)) {
    try {
      out.push({ kind: "json-string", path: `${pointer}<json>`, value: JSON.parse(trimmed) });
    } catch {
      // Not every runtime-bearing string is JSON.
    }
  }

  const approvalDef = decodeApprovalDefResource(value);
  if (approvalDef) out.push({ kind: "approval-defresource", path: `${pointer}<defresource-json>`, value: approvalDef });
  return out;
}

function decodeApprovalDefResource(value) {
  if (typeof value !== "string" || !/^Ojpicm90bGk6O[A-Za-z0-9+/]*={0,2}$/.test(value)) return null;
  try {
    const bytes = Buffer.from(value, "base64");
    const prefix = Buffer.from("::brotli::", "utf8");
    if (bytes.length <= prefix.length || !bytes.subarray(0, prefix.length).equals(prefix)) return null;
    return JSON.parse(zlib.brotliDecompressSync(bytes.subarray(prefix.length)).toString("utf8"));
  } catch {
    return null;
  }
}

function loadRoots(options) {
  if (options.package) {
    const { wrapper, decoded } = readDecodedYapk(options.package);
    return { wrapper: withoutOpaqueResource(wrapper), decoded };
  }
  const decoded = JSON.parse(fs.readFileSync(options.decoded, "utf8").replace(/^\uFEFF/, ""));
  return { decoded };
}

function withoutOpaqueResource(wrapper) {
  if (!isObject(wrapper)) return wrapper;
  const copy = { ...wrapper };
  delete copy.Resource;
  return copy;
}

function redactValue(value) {
  if (typeof value === "boolean" || typeof value === "number" || value === null) return value;
  const text = String(value);
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

function stablePreview(value) {
  try {
    return JSON.stringify(value).slice(0, 240);
  } catch {
    return String(value).slice(0, 240);
  }
}

function escapePathKey(key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

function finding(level, code, message, details = {}) {
  return { level, code, message, ...details };
}

function parseArgs(argv) {
  const args = { mode: "generated-final" };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--package") args.package = argv[++i];
    else if (token === "--decoded") args.decoded = argv[++i];
    else if (token === "--mode") args.mode = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  if (!["generated-final", "local-draft"].includes(args.mode)) throw new Error(`Unsupported mode: ${args.mode}`);
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-generated-final-draft-placeholders.mjs --package <app.yapk> [--mode generated-final|local-draft]
  node scripts/validate-generated-final-draft-placeholders.mjs --decoded <decoded-resource.json> [--mode generated-final|local-draft]`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
