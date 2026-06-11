import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  ADDITIONS_KEY,
  loadYapkSchemaCanonical,
  loadYapkSchemaCodexOverlay,
  loadYapkSchemaEffective,
  getYapkStandardAdditions,
} = require("./lib/load-yapk-schema.js");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaRoot = path.join(root, "schemas");
const canonicalPath = path.join(schemaRoot, "yapk-schema.json");
const overlayPath = path.join(schemaRoot, "yapk-schema-codex.json");

assert.ok(fs.existsSync(canonicalPath), "canonical YAPK schema must exist");
assert.ok(fs.existsSync(overlayPath), "Codex YAPK schema overlay must exist");

const canonical = loadYapkSchemaCanonical({ schemaRoot });
const overlay = loadYapkSchemaCodexOverlay({ schemaRoot });
const effective = loadYapkSchemaEffective({ schemaRoot });
const additions = getYapkStandardAdditions({ schemaRoot });

assert.equal(Object.prototype.hasOwnProperty.call(canonical, ADDITIONS_KEY), false, "canonical schema must not contain Codex additions");
assert.equal(Object.prototype.hasOwnProperty.call(overlay, ADDITIONS_KEY), true, "overlay must contain Codex additions");
assert.equal(Object.prototype.hasOwnProperty.call(effective, ADDITIONS_KEY), true, "effective schema must expose Codex additions");
assert.deepEqual(effective[ADDITIONS_KEY], additions, "effective schema additions must match overlay additions");
assert.ok(additions && typeof additions === "object" && !Array.isArray(additions), "Codex additions must be an object");

const replacementCanonical = JSON.parse(JSON.stringify(canonical));
const replacementEffective = {
  ...replacementCanonical,
  [ADDITIONS_KEY]: overlay[ADDITIONS_KEY],
};
assert.equal(Object.prototype.hasOwnProperty.call(replacementCanonical, ADDITIONS_KEY), false, "replacement canonical fixture must stay clean");
assert.deepEqual(replacementEffective[ADDITIONS_KEY], additions, "replacement safety fixture must still compose additions");

const formNewReportsText = JSON.stringify(additions);
assert.match(formNewReportsText, /FormNewReports/, "FormNewReports guidance must remain available through overlay additions");
assert.match(formNewReportsText, /FormReports/, "FormReports guidance must remain available through overlay additions");

console.log("yapk schema Codex overlay fixtures passed");
