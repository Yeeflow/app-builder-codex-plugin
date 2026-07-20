#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const blocker = json("compatibility/capability-manifests/data-list-sublist-scalar-row-schema-coupled-routing-blocker.v0.1.0.json");
const sourcePath = argument("--source", "scripts/materialize-full-app-generated-final.mjs"); const source = read(sourcePath); const file = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const calls = callsOf("dataListSubListVariables");
if (blocker.decision?.marker !== "NO_SAFE_DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING" || blocker.decision?.status !== "blocked" || JSON.stringify(calls) !== JSON.stringify([4777, 4960]) || blocker.sharedSeam?.consumers?.length !== 2) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING_BLOCKER_INVALID", "The documented shared seam is incomplete or stale.");
if (!source.includes("function dataListSubListVariables") || !source.includes("function buildDataListFormSubListControl") || !source.includes("function buildFieldRules") || /DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_ROUTE_START|coreProjectDataListSublistScalarRowSchema|coreLowerDataListSublistScalarRowSchemaAtHost/.test(source)) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING_SCOPE_VIOLATION", "The blocked audit must not add a Sublist Core route.");
if (blocker.source?.sha256 !== sha(source)) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING_BLOCKER_INVALID", "The documented source hash is stale.");
for (const key of ["childListIdentity", "childFieldIdentity", "rowSchemaIdentity"]) if (blocker.observedInput?.[key] !== "absent") fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING_BLOCKER_INVALID", `Unexpected supplied ${key}.`);
if (!Array.isArray(blocker.prohibitedWorkaround) || blocker.prohibitedWorkaround.length !== 6 || blocker.routing?.changed !== false || blocker.routing?.adaptersChanged !== false || blocker.routing?.artifactsChanged !== false || blocker.routing?.lineageTransitionAppended !== false) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING_SCOPE_VIOLATION", "The blocker contract permits an unsafe workaround.");
console.log("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING_BLOCKER_VALID");
function callsOf(name) { const result = []; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) result.push(file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1); ts.forEachChild(node, visit); }; visit(file); return result; }
function argument(option, fallback) { const i = process.argv.indexOf(option); return i < 0 ? fallback : process.argv[i + 1]; } function read(path) { return readFileSync(resolve(root, path), "utf8"); } function json(path) { return JSON.parse(read(path)); } function sha(text) { return createHash("sha256").update(text).digest("hex"); } function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }
