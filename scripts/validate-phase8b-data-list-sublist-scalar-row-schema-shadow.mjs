#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const core = read("packages/app-builder-core-materializer/src/internal/data-list-sublist-scalar-row-schema.ts");
const host = read("runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-scalar-row-schema-lowering.ts");
const coreIndex = read("packages/app-builder-core-materializer/src/index.ts");
const hostIndex = read("runtimes/app-builder-core-local-runtime/src/index.ts");
const legacy = read("scripts/materialize-full-app-generated-final.mjs");
const contract = JSON.parse(read("compatibility/capability-manifests/data-list-sublist-nested-template-graph-contract.v0.1.0.json"));
const corpus = JSON.parse(read("compatibility/differential-fixtures/data-list-sublist-scalar-row-schema-shadow.v0.1.0.json"));
const ast = ts.createSourceFile("legacy.mjs", legacy, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const errors = ["SUBLIST_TEMPLATE_GRAPH_REFERENCE_MISSING", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_INVALID", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_DUPLICATE", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN", "SUBLIST_ROW_SCHEMA_REFERENCE_MISSING", "SUBLIST_ROW_SCHEMA_REFERENCE_INVALID", "SUBLIST_ROW_SCHEMA_REFERENCE_SCOPE_MISMATCH", "SUBLIST_ROW_SCHEMA_REFERENCE_DUPLICATE", "SUBLIST_ROW_SCHEMA_REFERENCE_RELATIONSHIP_BROKEN"];
const lineage = JSON.parse(read("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json"));
const promoted = lineage.approvedTransitions?.some((item) => item.phase === "phase-8d-data-list-sublist-scalar-row-schema-dual-public-distribution-promotion");
if (!core.includes("projectDataListSublistScalarRowSchemaInternal") || /randomUUID|node:|process\.|readFile|writeFile|UUID/.test(core) || !core.includes("Object.freeze")) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_BOUNDARY_INVALID");
if (!host.includes("lowerDataListSublistScalarRowSchemaAtHostInternal") || !errors.every((code) => host.includes(code)) || /randomUUID|node:|process\.|readFile|writeFile/.test(host)) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_HOST_BOUNDARY_INVALID");
if (!promoted && (coreIndex.includes("projectDataListSublistScalarRowSchema") || hostIndex.includes("lowerDataListSublistScalarRowSchema"))) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_PUBLIC_EXPORT_FORBIDDEN");
if (promoted && (!coreIndex.includes("projectDataListSublistScalarRowSchema") || !hostIndex.includes("lowerDataListSublistScalarRowSchema"))) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_PUBLIC_EXPORT_PROMOTION_DRIFT");
if (corpus.caseCount !== corpus.cases.length || !errors.every((code) => corpus.cases.some((item) => item.error === code))) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORPUS_INCOMPLETE");
if (callCount("dataListSubListVariables") !== 2 || !["dataListSubListVariables", "normalizeSubListRowType", "buildDataListFormSubListControl", "buildFieldRules"].every((name) => legacy.includes(`function ${name}`))) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_LEGACY_BOUNDARY_DRIFT");
if (contract.selectedCandidate?.id !== "data-list-sublist-explicit-scalar-row-schema-intent" || contract.source?.sha256 !== sha(legacy)) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CONTRACT_DRIFT");
console.log(`DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_INTERNAL_SHADOW_VALID core=${sha(core)} host=${sha(host)}`);
function callCount(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code) { console.error(code); process.exit(1); }
