#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  collectLongNumericStrings,
  collectStrings,
  canonicalJson,
  isObject,
  readCanonicalJson,
  sha256,
} = require("./scripts/lib/standalone-artifact-utils.cjs");

const PROFILES = {
  agent: { extension: ".yaia", type: 0, keys: ["Category", "Description", "IconUrl", "Name", "PackageJson", "TemplateId", "Type"], contentField: "Prompt" },
  copilot: { extension: ".yaic", type: 1, keys: ["Category", "Description", "IconUrl", "Name", "PackageJson", "Type"], contentField: "Instructions" },
};

function issue(level, code, message, context = null) { return { level, code, message, context }; }

function canonicalBase64(value) {
  if (typeof value !== "string" || value.length < 16) return false;
  if (/\s/.test(value) || !/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) return false;
  return Buffer.from(value, "base64").toString("base64") === value;
}

function validateNormalizedRead(kind, value, options, errors, warnings) {
  if (!value) return;
  if (!isObject(value)) {
    errors.push(issue("error", "AI_RESOURCE_IMPORT_READ_INVALID", "Normalized importRead result must be an object"));
    return;
  }
  const profile = PROFILES[kind];
  if (typeof value[profile.contentField] !== "string" || !value[profile.contentField].trim()) errors.push(issue("error", "AI_RESOURCE_PRIMARY_CONTENT_REQUIRED", `Normalized ${kind} importRead result requires non-empty ${profile.contentField}`));
  if (value.Components !== undefined && !Array.isArray(value.Components)) errors.push(issue("error", "AI_RESOURCE_COMPONENTS_NOT_ARRAY", "Normalized Components must be an array when present"));
  const strings = collectStrings(value);
  if (strings.some(({ value: text }) => /\b(?:Bearer\s+[A-Za-z0-9._~+/=-]{12,}|api[_-]?key\s*[:=]|client[_-]?secret\s*[:=]|access[_-]?token\s*[:=])/i.test(text))) errors.push(issue("error", "AI_RESOURCE_SECRET_MATERIAL_FOUND", "Normalized importRead result appears to contain secret material"));
  const ids = collectLongNumericStrings(value);
  if (ids.length) {
    if (options.issuedIds) {
      const issued = new Set(options.issuedIds.map(String));
      for (const found of ids) if (!issued.has(found.id)) errors.push(issue("error", "AI_RESOURCE_REFERENCE_ID_NOT_ISSUED", "Normalized AI resource contains an ID missing from issued-ID provenance", found));
    } else if (options.stage === "final") errors.push(issue("error", "AI_RESOURCE_ID_PROVENANCE_REQUIRED", "Final AI resource contains long numeric references but no issued-ID map was supplied", { count: ids.length }));
    else warnings.push(issue("warning", "AI_RESOURCE_REFERENCE_IDS_UNVERIFIED", "Normalized AI resource contains long numeric references but no issued-ID map was supplied", { count: ids.length }));
  }
}

function validateAIResourceObject(kind, wrapper, options = {}) {
  const profile = PROFILES[kind];
  if (!profile) throw new Error(`Unsupported AI resource kind: ${kind}`);
  const errors = [];
  const warnings = [];
  if (!new Set(["structural", "final"]).has(options.stage || "structural")) errors.push(issue("error", "AI_RESOURCE_STAGE_INVALID", "Validation stage must be structural or final", { stage: options.stage }));
  if (!isObject(wrapper)) return { errors: [issue("error", "AI_RESOURCE_OUTER_NOT_OBJECT", `${profile.extension} root must be an object`)], warnings };
  const actual = Object.keys(wrapper).sort();
  if (JSON.stringify(actual) !== JSON.stringify(profile.keys)) errors.push(issue("error", "AI_RESOURCE_OUTER_KEYS_INVALID", `${profile.extension} must contain exactly the export-proven outer keys`, { expected: profile.keys, actual }));
  if (wrapper.Type !== profile.type) errors.push(issue("error", "AI_RESOURCE_TYPE_INVALID", `${kind} Type must equal ${profile.type}`));
  if (typeof wrapper.Name !== "string" || !wrapper.Name.trim()) errors.push(issue("error", "AI_RESOURCE_NAME_REQUIRED", "Name must be a non-empty string"));
  if (typeof wrapper.Description !== "string") errors.push(issue("error", "AI_RESOURCE_DESCRIPTION_INVALID", "Description must be a string"));
  if (!canonicalBase64(wrapper.PackageJson)) errors.push(issue("error", "AI_RESOURCE_PACKAGE_JSON_INVALID", "PackageJson must be a non-empty canonical base64 payload"));
  if (kind === "copilot") {
    if (typeof wrapper.IconUrl !== "string" || !wrapper.IconUrl.trim()) errors.push(issue("error", "COPILOT_ICON_URL_REQUIRED", "Copilot IconUrl must be a non-empty string"));
    if (wrapper.Category !== null && typeof wrapper.Category !== "string") errors.push(issue("error", "COPILOT_CATEGORY_INVALID", "Copilot Category must be null or a string"));
  }
  if (kind === "agent") {
    if (typeof wrapper.IconUrl !== "string" || !wrapper.IconUrl.trim()) errors.push(issue("error", "AGENT_ICON_URL_REQUIRED", "AI Agent IconUrl must be a non-empty string"));
    if (wrapper.Category !== null && typeof wrapper.Category !== "string") errors.push(issue("error", "AGENT_CATEGORY_INVALID", "AI Agent Category must be null or a string"));
    if (wrapper.TemplateId !== null && typeof wrapper.TemplateId !== "string") errors.push(issue("error", "AGENT_TEMPLATE_ID_INVALID", "AI Agent TemplateId must be null or a string"));
  }
  const artifactStrings = collectStrings(wrapper);
  if (artifactStrings.some(({ value }) => /\b(?:Bearer\s+[A-Za-z0-9._~+/=-]{12,}|(?:api[_-]?key|client[_-]?secret|password|access[_-]?token)\s*[:=]\s*["'][^"']{6,}["']|(?:sk-(?:proj-)?|ghp_|github_pat_|xox[baprs]-)[A-Za-z0-9_-]{16,})/i.test(value))) errors.push(issue("error", "AI_RESOURCE_SECRET_MATERIAL_FOUND", "AI resource wrapper appears to contain secret material"));
  if (artifactStrings.some(({ value }) => /(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|\[?::1\]?|169\.254\.169\.254|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|[^\s/]+\.(?:local|internal))(?:[/:\s"']|$)/i.test(value))) errors.push(issue("error", "AI_RESOURCE_PRIVATE_NETWORK_TARGET", "AI resource contains a private or internal network target"));
  if (options.stage === "final") {
    if (!options.provenance) errors.push(issue("error", "AI_RESOURCE_OFFICIAL_PROVENANCE_REQUIRED", `Final ${profile.extension} generation requires official payload provenance`));
    if (!options.importRead) errors.push(issue("error", "AI_RESOURCE_IMPORT_READ_REQUIRED", `Final ${profile.extension} generation requires a normalized importRead result`));
  }
  if (options.provenance) {
    const allowedSources = new Set(["yeeflow-official-export", "yeeflow-official-import-export-api"]);
    if (!isObject(options.provenance) || !allowedSources.has(options.provenance.source)) errors.push(issue("error", "AI_RESOURCE_PROVENANCE_SOURCE_INVALID", "Provenance source must identify an official Yeeflow export or import/export API"));
    if (options.provenance.artifactType !== profile.extension.slice(1)) errors.push(issue("error", "AI_RESOURCE_PROVENANCE_TYPE_MISMATCH", "Provenance artifactType does not match output profile", { expected: profile.extension.slice(1), actual: options.provenance.artifactType }));
    const payloadHash = sha256(Buffer.from(String(wrapper.PackageJson || ""), "utf8"));
    if (options.provenance.packageJsonSha256 !== payloadHash) errors.push(issue("error", "AI_RESOURCE_PROVENANCE_HASH_MISMATCH", "Provenance PackageJson hash does not match the wrapper payload", { expected: payloadHash, actual: options.provenance.packageJsonSha256 }));
    const envelopeHash = sha256(Buffer.from(canonicalJson(wrapper), "utf8"));
    if (options.provenance.envelopeSha256 !== envelopeHash) errors.push(issue("error", "AI_RESOURCE_PROVENANCE_ENVELOPE_HASH_MISMATCH", "Provenance envelope hash does not match the canonical wrapper", { expected: envelopeHash, actual: options.provenance.envelopeSha256 }));
    if (!options.provenance.operation || !options.provenance.endpointKind || !options.provenance.responseId) errors.push(issue("error", "AI_RESOURCE_PROVENANCE_RECEIPT_INCOMPLETE", "Provenance receipt requires operation, endpointKind, and responseId"));
    if (options.importRead) {
      const importReadHash = sha256(Buffer.from(canonicalJson(options.importRead), "utf8"));
      if (options.provenance.importReadSha256 !== importReadHash) errors.push(issue("error", "AI_RESOURCE_PROVENANCE_IMPORT_READ_HASH_MISMATCH", "Provenance importRead hash does not match the normalized readback", { expected: importReadHash, actual: options.provenance.importReadSha256 }));
    }
  }
  validateNormalizedRead(kind, options.importRead, options, errors, warnings);
  return { errors, warnings };
}

function loadJson(filePath) { return filePath ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null; }
function loadIssuedIds(filePath) {
  const value = loadJson(filePath);
  if (!value) return null;
  const ids = Array.isArray(value) ? value : value.issuedIds;
  if (!Array.isArray(ids)) throw new Error("Issued-ID provenance must be an array or contain issuedIds[]");
  return ids.map(String);
}

function validateAIResourceFile(kind, filePath, options = {}) {
  const profile = PROFILES[kind];
  const report = { status: "fail", kind, file: path.resolve(filePath), stage: options.stage || "structural", errors: [], warnings: [], roundTrip: { canonicalUtf8: false, wrapperJsonValid: false, packageJsonBase64Valid: false } };
  let wrapper;
  try {
    const read = readCanonicalJson(filePath);
    wrapper = read.value;
    report.roundTrip.wrapperJsonValid = true;
    report.roundTrip.canonicalUtf8 = read.bytes.equals(read.canonical);
    if (options.requireCanonical !== false && !report.roundTrip.canonicalUtf8) report.errors.push(issue("error", "AI_RESOURCE_NON_CANONICAL_BYTES", `${profile.extension} must be canonical UTF-8 JSON`));
  } catch (error) {
    report.errors.push(issue("error", error.code || "AI_RESOURCE_READ_FAILED", `Unable to read ${profile.extension}`, { message: error.message }));
    return report;
  }
  const result = validateAIResourceObject(kind, wrapper, options);
  report.errors.push(...result.errors);
  report.warnings.push(...result.warnings);
  report.roundTrip.packageJsonBase64Valid = canonicalBase64(wrapper.PackageJson);
  report.status = report.errors.length ? "fail" : report.warnings.length ? "pass_with_warnings" : "pass";
  return report;
}

function parseCli(expectedKind = null) {
  const args = process.argv.slice(2);
  const kind = expectedKind || args.shift();
  const file = args.shift();
  if (!PROFILES[kind] || !file) {
    console.error("Usage: node validate-ai-resource-wrapper.js <agent|copilot> <file> [--stage structural|final] [--provenance file] [--import-read file] [--issued-ids file]");
    process.exit(2);
  }
  const options = { stage: "structural", requireCanonical: true, provenance: null, importRead: null, issuedIds: null };
  while (args.length) {
    const arg = args.shift();
    if (arg === "--stage") options.stage = args.shift();
    else if (arg === "--provenance") options.provenance = loadJson(args.shift());
    else if (arg === "--import-read") options.importRead = loadJson(args.shift());
    else if (arg === "--issued-ids") options.issuedIds = loadIssuedIds(args.shift());
    else if (arg === "--allow-noncanonical") options.requireCanonical = false;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  const report = validateAIResourceFile(kind, file, options);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}

if (require.main === module) parseCli();
module.exports = { PROFILES, loadIssuedIds, loadJson, parseCli, validateAIResourceFile, validateAIResourceObject };
