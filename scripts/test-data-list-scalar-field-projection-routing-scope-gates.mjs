#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import choiceFieldOptionUtils from "./lib/choice-field-option-utils.cjs";
import { cleanPlanningLabel } from "./lib/planning-placeholder-utils.mjs";
import ts from "typescript";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "scripts/materialize-full-app-generated-final.mjs");
const source = readFileSync(sourcePath, "utf8");
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const names = ["buildFieldRecord", "shouldRouteDataListScalarFieldProjection", "shouldRouteDataListLookupResolution", "requireLosslessHostIdentity", "normalizeFieldType", "normalizeControlType", "controlTypeForFieldType", "schemaSafeFieldName", "cleanFieldName", "fieldPrefix", "fieldIndexFromName", "buildFieldRules", "inferChoiceValues", "unique", "normKey"];
const declarations = new Map();
for (const statement of ast.statements) {
  if (ts.isFunctionDeclaration(statement) && statement.name && names.includes(statement.name.text)) declarations.set(statement.name.text, source.slice(statement.getStart(ast), statement.getEnd()));
}
assert.equal(declarations.size, names.length, "The scalar routing branch must retain every required Legacy function.");
let coreInvocations = 0;
const api = vm.runInNewContext(`${names.map((name) => declarations.get(name)).join("\n")}\n({ buildFieldRecord })`, {
  Error,
  JSON,
  Number,
  RegExp,
  Set,
  String,
  cleanResourceName: cleanPlanningLabel,
  dataListSubListVariables: () => [],
  parseChoiceOptionValues: choiceFieldOptionUtils.parseChoiceOptionValues,
  coreDefaultValueForFieldType: (fieldType) => fieldType === "Bit" ? "0" : "",
  coreProjectDataListScalarField: (input) => {
    coreInvocations += 1;
    return { projection: { fieldName: "Text1", canonicalFieldType: "Text", fieldIndex: input.fieldIndex, displayName: input.displayName, internalName: "Text1", canonicalControlType: "input", status: 1, category: 0, defaultValue: "", rules: "", sortable: false, system: false, unique: false, index: false } };
  },
  coreProjectDataListScalarResourceDefinitionIntent: ({ resourceScope, fieldOrdinal, projection }) => ({
    fieldRequest: { requestId: `scalar:${resourceScope}:${fieldOrdinal}` },
    preIdFieldRecord: projection,
  }),
  coreLowerDataListScalarResourceIdentityAtHost: (intent, context) => ({
    FieldID: context.fieldIdsByRequestId[intent.fieldRequest.requestId],
    ListID: context.listId,
    FieldName: intent.preIdFieldRecord.fieldName,
  }),
});

const deferred = [
  { fieldType: "Lookup", controlType: "lookup", displayName: "Lookup", fieldName: "Text1" },
  { fieldType: "Sub List", controlType: "list", displayName: "Sublist", fieldName: "Text2" },
  { fieldType: "User", controlType: "identity-picker", displayName: "Owner", fieldName: "Text3" },
  { fieldType: "User", controlType: "input", displayName: "Owner Text", fieldName: "Text3b" },
  { fieldType: "File", controlType: "file-upload", displayName: "Attachment", fieldName: "Text4" },
  { fieldType: "Image", controlType: "icon-upload", displayName: "Photo", fieldName: "Text5" },
];
for (const field of deferred) {
  const before = coreInvocations;
  const record = api.buildFieldRecord({ field, fieldIndex: 1, listId: "list", fieldId: "field" });
  assert.equal(coreInvocations, before, `${field.controlType} must not invoke the Core scalar projection branch.`);
  assert.equal(record.FieldID, "field", `${field.controlType} must retain Legacy record assembly.`);
}
api.buildFieldRecord({ field: { fieldType: "Text", controlType: "input", displayName: "Scalar", fieldName: "Text1" }, fieldIndex: 1, listId: "list", fieldId: "field" });
assert.equal(coreInvocations, 1, "A supported scalar field must invoke the Core scalar projection branch exactly once.");
console.log(`DATA_LIST_SCALAR_FIELD_PROJECTION_ROUTING_SCOPE_GATES_PASSED deferredCases=${deferred.length} scalarCases=1`);
