#!/usr/bin/env node

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  loadControlFieldSchemas,
  validateControlAgainstSchema,
  validateFieldAgainstSchema,
} = require("../yeeflow-control-field-schema-utils.js");

const schemas = loadControlFieldSchemas({ baseDir: process.cwd() });

const controlSamples = [
  "input",
  "textarea",
  "richtext",
  "input_number",
  "currency",
  "radio",
  "checkbox",
  "switch",
  "datepicker",
  "file-upload",
  "icon-upload",
  "identity-picker",
  "lookup",
  "list",
  "signer",
].map((type) => ({
  type,
  label: `Smoke ${type}`,
  binding: `Smoke_${type.replace(/[^a-z0-9]/gi, "_")}`,
  attrs: {},
}));

const fieldSamples = [
  ["input", "Text"],
  ["textarea", "Text"],
  ["richtext", "Text"],
  ["input_number", "Decimal"],
  ["currency", "Decimal"],
  ["switch", "Bit"],
  ["radio", "Text"],
  ["checkbox", "Text"],
  ["datepicker", "Datetime"],
  ["file-upload", "File"],
  ["icon-upload", "File"],
  ["identity-picker", "Text"],
  ["lookup", "Text"],
  ["calculated-column", "Calculated"],
].map(([type, fieldType], index) => ({
  FieldID: String(9000000000000000n + BigInt(index)),
  ListID: "9000000000001000",
  FieldName: `Smoke${index}`,
  DisplayName: `Smoke ${type}`,
  FieldType: fieldType,
  Type: type,
  Rules: "{}",
}));

const controlIssues = controlSamples.flatMap((sample) => validateControlAgainstSchema(sample, schemas));
const fieldIssues = fieldSamples.flatMap((sample) => validateFieldAgainstSchema(sample, schemas));
const unknownIssues = [...controlIssues, ...fieldIssues].filter((issue) => issue.code.includes("UNKNOWN"));

if (!schemas.hasControlReference || !schemas.hasFieldReference) {
  console.error("Normalized control/field references were not found.");
  process.exit(1);
}

if (unknownIssues.length) {
  console.error(JSON.stringify({ status: "fail", unknownIssues }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "pass",
  controlsChecked: controlSamples.length,
  fieldsChecked: fieldSamples.length,
  warningsObserved: controlIssues.length + fieldIssues.length,
}, null, 2));
