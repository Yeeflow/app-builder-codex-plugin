#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = argument("--host", "runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-child-resource-inventory.ts");
const host = read(modulePath); const runtimeIndex = read(argument("--runtime-index", "runtimes/app-builder-core-local-runtime/src/index.ts")); const legacyPath = argument("--legacy", "scripts/materialize-full-app-generated-final.mjs"); const legacy = read(legacyPath);
const contract = json("compatibility/capability-manifests/data-list-sublist-child-resource-identity-map-contract.v0.1.0.json");
const lineage = json("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
const corpus = json(argument("--corpus", "compatibility/differential-fixtures/data-list-sublist-child-resource-inventory-shadow.v0.1.0.json"));
const errors = ["SUBLIST_CHILD_RESOURCE_IDENTITY_MISSING", "SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID", "SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY", "SUBLIST_CHILD_RESOURCE_IDENTITY_DUPLICATE", "SUBLIST_CHILD_RESOURCE_IDENTITY_SCOPE_MISMATCH", "SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN", "SUBLIST_ROW_SCHEMA_IDENTITY_MISSING", "SUBLIST_ROW_SCHEMA_IDENTITY_INVALID", "SUBLIST_ROW_SCHEMA_IDENTITY_DUPLICATE", "SUBLIST_ROW_SCHEMA_IDENTITY_SCOPE_MISMATCH", "SUBLIST_ROW_SCHEMA_IDENTITY_RELATIONSHIP_BROKEN"];
const ast = ts.createSourceFile(legacyPath, legacy, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
if (!host.includes("buildDataListSublistChildResourceInventoryInternal") || !errors.every((code) => host.includes(code)) || /node:|process\.|readFile|writeFile|randomUUID|crypto\./.test(host)) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_HOST_BOUNDARY_INVALID");
const promoted = lineage.approvedTransitions?.some((item) => item.phase === "phase-9d-data-list-sublist-child-resource-inventory-local-runtime-public-api-and-distribution-promotion");
const approvedAlias = "export { buildDataListSublistChildResourceInventoryInternal as buildDataListSublistChildResourceInventoryAtHost } from \"./internal-data-list-sublist-child-resource-inventory.js\";";
if (!promoted && (runtimeIndex.includes("buildDataListSublistChildResourceInventoryInternal") || runtimeIndex.includes("sublist-child-resource-inventory"))) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_PUBLIC_EXPORT_FORBIDDEN");
if (promoted && (!runtimeIndex.includes(approvedAlias) || /export\s*\{\s*buildDataListSublistChildResourceInventoryInternal\s*\}/u.test(runtimeIndex) || runtimeIndex.includes("sublistChildResourceIdentityErrors"))) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_PUBLIC_EXPORT_FORBIDDEN");
if (contract.source?.sha256 !== sha(legacy) || callCount("dataListSubListVariables") !== 2) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_LEGACY_BOUNDARY_DRIFT");
if (corpus.caseCount !== 20 || corpus.caseCount !== corpus.cases.length || !errors.every((code) => corpus.cases.some((item) => item.error === code))) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_CORPUS_INCOMPLETE");
if (!corpus.cases.some((item) => item.id === "valid-no-child") || corpus.cases.filter((item) => item.kind === "excluded").length !== 4) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_CORPUS_INCOMPLETE");
if (/DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_ROUTE_START|coreProjectDataListSublistScalarRowSchema|coreLowerDataListSublistScalarRowSchemaAtHost/.test(legacy)) fail("SUBLIST_CHILD_RESOURCE_INVENTORY_AUDIT_SCOPE_VIOLATION");
console.log(`SUBLIST_CHILD_RESOURCE_INVENTORY_HOST_SHADOW_VALID host=${sha(host)}`);
function callCount(name) { let count = 0; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) count += 1; ts.forEachChild(node, visit); }; visit(ast); return count; }
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); } function json(path) { return JSON.parse(read(path)); } function sha(value) { return createHash("sha256").update(value).digest("hex"); } function fail(code) { console.error(code); process.exit(1); }
