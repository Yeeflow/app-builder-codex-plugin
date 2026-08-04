#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  collectLongNumericStrings,
  collectStrings,
  isObject,
  readCanonicalJson,
} = require("./scripts/lib/standalone-artifact-utils.cjs");

const OUTER_KEYS = ["Description", "DraftCode", "DraftConfig", "ExtData", "ImplType", "Name"];
const ALLOWED_SDK_METHODS = new Set([
  "files.getContent",
  "files.upload",
  "lists.getFields",
  "lists.createItemsBatch",
  "lists.queryItems",
]);
const ALLOWED_VALUE_TYPES = new Set(["text", "file", "number", "boolean", "date/time", "datetime", "image", "rich text", "richtext"]);
const ALLOWED_CONNECTION_TYPES = new Set(["http"]);

function issue(level, code, message, context = null) {
  return { level, code, message, context };
}

function visibleReturnKeys(code) {
  const keys = new Set();
  for (const match of code.matchAll(/return\s*\{([\s\S]*?)\}\s*;?/g)) {
    const body = match[1];
    if (/\.\.\./.test(body)) return null;
    for (const part of body.split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const keyMatch = trimmed.match(/^(?:["']([^"']+)["']|([A-Za-z_$][\w$]*))\s*(?::|$)/);
      if (!keyMatch) return null;
      keys.add(keyMatch[1] || keyMatch[2]);
    }
  }
  return keys.size ? keys : null;
}

function codeWithoutCommentsAndStrings(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, (value) => " ".repeat(value.length))
    .replace(/\/\/[^\n\r]*/g, (value) => " ".repeat(value.length))
    .replace(/(?:`(?:\\[\s\S]|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, (value) => " ".repeat(value.length));
}

function syntaxCheckSource(code) {
  try {
    const ts = require("typescript");
    const source = ts.createSourceFile("custom-service.ts", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    if (!source.parseDiagnostics.length) return null;
    return source.parseDiagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join("; ");
  } catch (error) {
    if (error && error.code !== "MODULE_NOT_FOUND") return error.message;
  }
  const transformed = code
    .replace(/\bexport\s+(?=(?:async\s+)?function\b)/g, "")
    .replace(/(function\s+main\s*\(\s*\{[^)]*\})\s*:\s*[A-Za-z_$][\w$<>,.\[\]\s|&?]*(?=\))/g, "$1")
    .replace(/([A-Za-z_$][\w$]*)\s*:\s*(?:string|number|boolean|unknown|any)(?=\s*[,)=;])/g, "$1")
    .replace(/\)\s*:\s*[A-Za-z_$][\w$<>,.\[\]\s|&?]*(?=\s*\{)/g, ")")
    .replace(/\b(const|let|var)\s+([A-Za-z_$][\w$]*)\s*:\s*[^=;]+(?=\s*=)/g, "$1 $2");
  try { new Function(transformed); return null; }
  catch (error) { return error.message; }
}

function validateYcsObject(value, options = {}) {
  const errors = [];
  const warnings = [];
  if (!isObject(value)) {
    errors.push(issue("error", "YCS_OUTER_NOT_OBJECT", ".ycs root must be a JSON object"));
    return { errors, warnings, draftConfig: null };
  }

  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(OUTER_KEYS)) {
    errors.push(issue("error", "YCS_OUTER_KEYS_INVALID", ".ycs must contain exactly the six export-proven outer keys", { expected: OUTER_KEYS, actual: actualKeys }));
  }
  if (typeof value.Name !== "string" || !value.Name.trim()) errors.push(issue("error", "YCS_NAME_REQUIRED", "Name must be a non-empty string"));
  if (typeof value.Description !== "string") errors.push(issue("error", "YCS_DESCRIPTION_INVALID", "Description must be a string"));
  if (value.ImplType !== 0) errors.push(issue("error", "YCS_IMPL_TYPE_INVALID", "ImplType must equal 0"));
  if (value.ExtData !== null) errors.push(issue("error", "YCS_EXT_DATA_INVALID", "ExtData must be null for the export-proven standalone profile"));
  if (typeof value.DraftCode !== "string" || !value.DraftCode.trim()) errors.push(issue("error", "YCS_DRAFT_CODE_REQUIRED", "DraftCode must be a non-empty string"));
  if (typeof value.DraftConfig !== "string") errors.push(issue("error", "YCS_DRAFT_CONFIG_NOT_STRING", "DraftConfig must be a JSON string, not an object"));

  let config = null;
  if (typeof value.DraftConfig === "string") {
    try { config = JSON.parse(value.DraftConfig); }
    catch (error) { errors.push(issue("error", "YCS_DRAFT_CONFIG_JSON_INVALID", "DraftConfig is not valid JSON", { message: error.message })); }
  }
  if (config !== null) {
    if (!isObject(config)) errors.push(issue("error", "YCS_DRAFT_CONFIG_INVALID", "DraftConfig must decode to an object"));
    else {
      for (const key of ["params", "connections", "outputs"]) {
        if (!Array.isArray(config[key])) errors.push(issue("error", "YCS_DRAFT_CONFIG_ARRAY_REQUIRED", `DraftConfig.${key} must be an array`, { key }));
      }
      const ids = new Map();
      for (const group of ["params", "connections", "outputs"]) {
        for (const [index, entry] of (Array.isArray(config[group]) ? config[group] : []).entries()) {
          if (!isObject(entry) || typeof entry.id !== "string" || !entry.id.trim()) {
            errors.push(issue("error", "YCS_CONFIG_ID_REQUIRED", `${group}[${index}].id must be a non-empty string`));
            continue;
          }
          if (ids.has(entry.id)) errors.push(issue("error", "YCS_CONFIG_ID_DUPLICATE", "DraftConfig IDs must be unique across params, connections, and outputs", { id: entry.id, first: ids.get(entry.id), duplicate: `${group}[${index}]` }));
          else ids.set(entry.id, `${group}[${index}]`);
          if (typeof entry.type !== "string" || !entry.type.trim()) errors.push(issue("error", "YCS_CONFIG_TYPE_REQUIRED", `${group}[${index}].type must be a non-empty string`, { id: entry.id }));
          else {
            const normalizedType = entry.type.trim().toLowerCase();
            const allowed = group === "connections" ? ALLOWED_CONNECTION_TYPES : ALLOWED_VALUE_TYPES;
            if (!allowed.has(normalizedType)) errors.push(issue("error", "YCS_CONFIG_TYPE_UNPROVEN", `${group}[${index}].type is outside the export/product-proven allowlist`, { id: entry.id, type: entry.type }));
          }
        }
      }
    }
  }

  const code = typeof value.DraftCode === "string" ? value.DraftCode : "";
  const executableCode = codeWithoutCommentsAndStrings(code);
  const syntaxError = syntaxCheckSource(code);
  if (syntaxError) errors.push(issue("error", "YCS_DRAFT_CODE_SYNTAX_INVALID", "DraftCode did not pass the conservative JavaScript/ServiceContext syntax check", { message: syntaxError }));
  if (!/\bexport\s+(?:async\s+)?function\s+main\s*\(/.test(executableCode)) errors.push(issue("error", "YCS_MAIN_EXPORT_REQUIRED", "DraftCode must contain a real exported function main declaration"));
  if (/\b(?:render|execute)\s*\(/.test(executableCode)) errors.push(issue("error", "YCS_WRONG_ENTRYPOINT", "Custom Service must not use render(...) or execute(...) as an entrypoint"));

  const forbidden = [
    [/\brequire\s*\(/, "require"],
    [/\b(?:process|global|__dirname|__filename)\b/, "Node global"],
    [/\b(?:setTimeout|setInterval)\s*\(/, "timer"],
    [/\b(?:from\s+["'](?:node:)?(?:fs(?:\/promises)?|path|crypto|http|https|net|tls|child_process)["']|import\s*(?:\([^)]*)?\s*["'](?:node:)?(?:fs(?:\/promises)?|path|crypto|http|https|net|tls|child_process)["'])/, "Node built-in import"],
  ];
  for (const [pattern, label] of forbidden) if (pattern.test(code)) errors.push(issue("error", "YCS_FORBIDDEN_RUNTIME_API", `DraftCode contains forbidden ${label}`));

  const secretPatterns = [
    /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/i,
    /\b(?:api[_-]?key|client[_-]?secret|password|access[_-]?token)\s*[:=]\s*["'][^"']{6,}["']/i,
    /["'](?:sk-(?:proj-)?|ghp_|github_pat_|xox[baprs]-)[A-Za-z0-9_-]{16,}["']/i,
  ];
  const allArtifactText = collectStrings(value).map((item) => item.value).join("\n");
  if (secretPatterns.some((pattern) => pattern.test(allArtifactText))) errors.push(issue("error", "YCS_HARDCODED_SECRET", "Custom Service artifact appears to contain a hardcoded credential"));
  if (/(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|\[?::1\]?|169\.254\.169\.254|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|[^\s/]+\.(?:local|internal))(?:[/:\s"']|$)/i.test(code)) {
    errors.push(issue("error", "YCS_PRIVATE_NETWORK_TARGET", "DraftCode contains a private or internal network target"));
  }

  const sdkAccess = /modules\.yeeSDKClient\s*(?:\.([A-Za-z_$][\w$]*)|\[\s*["']([^"']+)["']\s*\])\s*(?:\.([A-Za-z_$][\w$]*)|\[\s*["']([^"']+)["']\s*\])/g;
  const matchedSdkStarts = new Set();
  for (const match of code.matchAll(sdkAccess)) {
    matchedSdkStarts.add(match.index);
    const method = `${match[1] || match[2]}.${match[3] || match[4]}`;
    if (!ALLOWED_SDK_METHODS.has(method)) errors.push(issue("error", "YCS_SDK_METHOD_UNPROVEN", "DraftCode uses a YeeSDK method outside the export-proven allowlist", { method }));
  }
  for (const match of code.matchAll(/modules\.yeeSDKClient/g)) if (![...matchedSdkStarts].some((index) => index === match.index)) errors.push(issue("error", "YCS_SDK_ACCESS_UNPROVEN", "YeeSDK access could not be resolved to a static export-proven method"));

  if (/modules\.fetch\s*\(/.test(executableCode)) {
    const connections = config && Array.isArray(config.connections) ? config.connections : [];
    if (!connections.length) errors.push(issue("error", "YCS_FETCH_CONNECTION_REQUIRED", "modules.fetch requires at least one DraftConfig connection"));
    if (!/\bconnection\s*(?::|[,}])/.test(executableCode)) errors.push(issue("error", "YCS_FETCH_CONNECTION_OPTION_REQUIRED", "modules.fetch options must pass a configured connection"));
    for (const entry of connections) {
      const escaped = String(entry?.id || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (escaped && !new RegExp(`connections(?:\\?\\.)?(?:${escaped}|\\[\\s*["']${escaped}["']\\s*\\])`).test(code)) warnings.push(issue("warning", "YCS_CONNECTION_USE_NOT_STATICALLY_PROVEN", "Declared connection was not found in a static runtime lookup", { id: entry.id }));
    }
  }

  if (config && Array.isArray(config.outputs)) {
    const configured = new Set(config.outputs.map((entry) => entry && entry.id).filter(Boolean));
    const returned = visibleReturnKeys(code);
    if (!configured.size && returned && returned.size) {
      errors.push(issue("error", "YCS_RETURN_OUTPUT_UNDECLARED", "DraftCode returns named outputs but DraftConfig.outputs is empty", { returned: [...returned] }));
    } else if (returned) {
      for (const key of returned) if (!configured.has(key)) errors.push(issue("error", "YCS_RETURN_OUTPUT_UNDECLARED", "A statically visible returned key is not declared in DraftConfig.outputs", { key }));
      for (const key of configured) if (!returned.has(key)) warnings.push(issue("warning", "YCS_OUTPUT_RETURN_NOT_STATICALLY_PROVEN", "A configured output was not found in a statically visible return object", { key }));
    } else if (configured.size) warnings.push(issue("warning", "YCS_RETURN_SHAPE_NOT_STATICALLY_PROVEN", "Return keys could not be established with the conservative static check"));
  }

  if (options.issuedIds) {
    const allowed = new Set(options.issuedIds);
    for (const found of collectLongNumericStrings(value)) if (!allowed.has(found.id)) errors.push(issue("error", "YCS_ID_NOT_ISSUED", "Long numeric resource ID is missing from issued-ID provenance", found));
  }
  for (const item of collectStrings({ value, config })) if (/__[^\s"']*(?:REQUIRED|PLACEHOLDER)[^\s"']*__/i.test(item.value)) errors.push(issue("error", "YCS_PLACEHOLDER_UNRESOLVED", "Unresolved required placeholder remains", item));
  return { errors, warnings, draftConfig: config };
}

function loadIssuedIds(filePath) {
  if (!filePath) return null;
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const ids = Array.isArray(value) ? value : value.issuedIds;
  if (!Array.isArray(ids)) throw new Error("Issued-ID provenance must be an array or contain issuedIds[]");
  return ids.map(String);
}

function validateYcsFile(filePath, options = {}) {
  const report = { status: "fail", file: path.resolve(filePath), errors: [], warnings: [], roundTrip: { canonicalUtf8: false, jsonValid: false } };
  let parsed;
  try {
    const read = readCanonicalJson(filePath);
    parsed = read.value;
    report.roundTrip.jsonValid = true;
    report.roundTrip.canonicalUtf8 = read.bytes.equals(read.canonical);
    if (options.requireCanonical !== false && !report.roundTrip.canonicalUtf8) report.errors.push(issue("error", "YCS_NON_CANONICAL_BYTES", ".ycs must be canonical UTF-8 JSON with two-space indentation and one trailing newline"));
  } catch (error) {
    report.errors.push(issue("error", error.code || "YCS_READ_FAILED", "Unable to read canonical .ycs JSON", { message: error.message }));
    return report;
  }
  const result = validateYcsObject(parsed, options);
  report.errors.push(...result.errors);
  report.warnings.push(...result.warnings);
  report.status = report.errors.length ? "fail" : report.warnings.length ? "pass_with_warnings" : "pass";
  return report;
}

function cli() {
  const args = process.argv.slice(2);
  const file = args.shift();
  if (!file) {
    console.error("Usage: node validate-ycs.js <file.ycs> [--issued-ids provenance.json] [--allow-noncanonical]");
    process.exit(2);
  }
  let issuedIdsFile = null;
  let requireCanonical = true;
  while (args.length) {
    const arg = args.shift();
    if (arg === "--issued-ids") issuedIdsFile = args.shift();
    else if (arg === "--allow-noncanonical") requireCanonical = false;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  const report = validateYcsFile(file, { issuedIds: loadIssuedIds(issuedIdsFile), requireCanonical });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}

if (require.main === module) cli();

module.exports = { cli, loadIssuedIds, validateYcsFile, validateYcsObject };
