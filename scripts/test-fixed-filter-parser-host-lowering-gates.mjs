#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const coreSourcePath = resolve(root, "packages/app-builder-core-materializer/src/index.ts");
const coreSource = readFileSync(coreSourcePath, "utf8");
const core = await import(pathToFileURL(resolve(root, "packages/app-builder-core-materializer/lib/index.js")).href);
const runtime = await import(pathToFileURL(resolve(root, "runtimes/app-builder-core-local-runtime/lib/index.js")).href);

const ast = ts.createSourceFile(coreSourcePath, coreSource, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
assert.equal(hasNodeImport(ast), false, "FIXED_FILTER_CORE_NODE_IMPORT_FORBIDDEN");
assert.equal(coreSource.includes("crypto.randomUUID"), false, "FIXED_FILTER_CORE_UUID_GENERATION_FORBIDDEN");

const findings = [];
const input = { viewScope: "assets/default", fields: [{ FieldName: "Status", DisplayName: "Status", InternalName: "Status", FieldType: "Text" }], filterText: "Status = Active", findings };
const before = JSON.stringify(input);
const first = core.projectFixedFilterIntents(input);
const second = core.projectFixedFilterIntents(structuredClone(input));
assert.equal(JSON.stringify(input), before, "FIXED_FILTER_CORE_FINDINGS_MUTATION_FORBIDDEN");
assert.deepEqual(first.keyRequests, second.keyRequests, "FIXED_FILTER_CORE_KEY_REQUEST_NONDETERMINISTIC");
assert.throws(() => runtime.lowerFixedFilterProjectionAtHost(first, { keysByRequestId: {} }, []), /FIXED_FILTER_KEY_ALLOCATION_MISSING/);
assert.throws(() => runtime.lowerFixedFilterProjectionAtHost(first, { keysByRequestId: { "assets/default:fixed-filter:0": " " } }, []), /FIXED_FILTER_KEY_ALLOCATION_INVALID/);
const duplicate = core.projectFixedFilterIntents({ ...input, filterText: "Status = Active and Status = Closed" });
assert.throws(() => runtime.lowerFixedFilterProjectionAtHost(duplicate, { keysByRequestId: { "assets/default:fixed-filter:0": "shared", "assets/default:fixed-filter:1": "shared" } }, []), /FIXED_FILTER_KEY_ALLOCATION_COLLISION/);
console.log("FIXED_FILTER_PARSER_NEGATIVE_GATES_PASSED cases=5");

function hasNodeImport(sourceFile) { let found = false; const visit = (node) => { if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith("node:")) found = true; ts.forEachChild(node, visit); }; visit(sourceFile); return found; }
