const fs = require("fs");
const path = require("path");

const ADDITIONS_KEY = "x-yeeflow-standard-additions";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function findSchemaRoot(startDir = __dirname) {
  const candidates = [];
  let current = path.resolve(startDir);
  while (true) {
    candidates.push(path.join(current, "schemas"));
    candidates.push(path.join(current, "..", "schemas"));
    candidates.push(path.join(current, "..", "..", "schemas"));
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  for (const candidate of candidates) {
    const canonical = path.join(candidate, "yapk-schema.json");
    const overlay = path.join(candidate, "yapk-schema-codex.json");
    if (fs.existsSync(canonical) && fs.existsSync(overlay)) return candidate;
  }

  throw new Error(`Unable to locate schemas/yapk-schema.json and schemas/yapk-schema-codex.json from ${startDir}`);
}

function loadYapkSchemaCanonical(options = {}) {
  const schemaRoot = options.schemaRoot || findSchemaRoot(options.startDir || __dirname);
  return readJson(path.join(schemaRoot, "yapk-schema.json"));
}

function loadYapkSchemaCodexOverlay(options = {}) {
  const schemaRoot = options.schemaRoot || findSchemaRoot(options.startDir || __dirname);
  return readJson(path.join(schemaRoot, "yapk-schema-codex.json"));
}

function loadYapkSchemaEffective(options = {}) {
  const canonical = loadYapkSchemaCanonical(options);
  const overlay = loadYapkSchemaCodexOverlay(options);
  const effective = cloneJson(canonical);
  if (Object.prototype.hasOwnProperty.call(overlay, ADDITIONS_KEY)) {
    effective[ADDITIONS_KEY] = cloneJson(overlay[ADDITIONS_KEY]);
  }
  const appPackageInfo = effective.$defs?.AppPackageInfo;
  if (
    appPackageInfo?.properties &&
    Array.isArray(appPackageInfo.required) &&
    appPackageInfo.required.includes("FormReports") &&
    !Object.prototype.hasOwnProperty.call(appPackageInfo.properties, "FormReports") &&
    Object.prototype.hasOwnProperty.call(appPackageInfo.properties, "FormNewReports")
  ) {
    appPackageInfo.properties.FormReports = cloneJson(appPackageInfo.properties.FormNewReports);
    appPackageInfo.properties.FormReports.description = "Legacy workflow report collection retained by the effective Codex schema overlay for product-schema compatibility.";
  }
  return effective;
}

function getYapkStandardAdditions(options = {}) {
  const overlay = loadYapkSchemaCodexOverlay(options);
  return cloneJson(overlay[ADDITIONS_KEY] || {});
}

module.exports = {
  ADDITIONS_KEY,
  findSchemaRoot,
  loadYapkSchemaCanonical,
  loadYapkSchemaCodexOverlay,
  loadYapkSchemaEffective,
  getYapkStandardAdditions,
};
