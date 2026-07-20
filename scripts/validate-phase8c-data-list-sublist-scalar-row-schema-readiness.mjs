#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const core = json(argument("--core-contract", "compatibility/capability-manifests/data-list-sublist-scalar-row-schema-core-public-api-readiness.v0.1.0.json"));
const runtime = json(argument("--runtime-contract", "compatibility/capability-manifests/data-list-sublist-scalar-row-schema-local-runtime-public-api-readiness.v0.1.0.json"));
const dual = json(argument("--dual-contract", "compatibility/capability-manifests/data-list-sublist-scalar-row-schema-dual-distribution-readiness.v0.1.0.json"));
const coreIndex = read("packages/app-builder-core-materializer/src/index.ts");
const runtimeIndex = read("runtimes/app-builder-core-local-runtime/src/index.ts");
const coreSource = read("packages/app-builder-core-materializer/src/internal/data-list-sublist-scalar-row-schema.ts");
const runtimeSource = read("runtimes/app-builder-core-local-runtime/src/internal-data-list-sublist-scalar-row-schema-lowering.ts");
const corpus = json("compatibility/differential-fixtures/data-list-sublist-scalar-row-schema-shadow.v0.1.0.json");
const lineagePath = "compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json";
const lineage = json(lineagePath);
const promoted = lineage.approvedTransitions?.some((item) => item.phase === "phase-8d-data-list-sublist-scalar-row-schema-dual-public-distribution-promotion");
const errors = ["SUBLIST_TEMPLATE_GRAPH_REFERENCE_MISSING", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_INVALID", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_DUPLICATE", "SUBLIST_TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN", "SUBLIST_ROW_SCHEMA_REFERENCE_MISSING", "SUBLIST_ROW_SCHEMA_REFERENCE_INVALID", "SUBLIST_ROW_SCHEMA_REFERENCE_SCOPE_MISMATCH", "SUBLIST_ROW_SCHEMA_REFERENCE_DUPLICATE", "SUBLIST_ROW_SCHEMA_REFERENCE_RELATIONSHIP_BROKEN"];
if (core.decision?.status !== "accepted" || core.decision?.marker !== "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_PUBLIC_API_READINESS_ACCEPTED" || core.prospectiveApi?.function !== "projectDataListSublistScalarRowSchema" || core.prospectiveApi?.publicDtos?.length !== 6) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_READINESS_INVALID");
if (!["mutable template object", "parent or child allocation map", "generated ID", "nested control", "summary", "Lookup", "identity user people person field", "file image binary field", "Legacy record shape"].every((value) => core.inputBoundary?.prohibited?.includes(value)) || !core.outputBoundary?.guarantees?.includes("no Legacy-shaped record")) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_LEAKAGE");
if (runtime.decision?.status !== "accepted" || runtime.decision?.marker !== "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED" || runtime.prospectiveApi?.function !== "lowerDataListSublistScalarRowSchemaAtHost" || !same(runtime.errorContract?.codes, errors) || !runtime.errorContract?.guarantees?.includes("no error is downgraded to fallback allocation")) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_RUNTIME_READINESS_INVALID");
if (dual.decision?.status !== "accepted" || dual.decision?.marker !== "DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_DUAL_DISTRIBUTION_READINESS_VALID" || dual.corpus?.caseCount !== 21 || dual.contracts?.length !== 2 || dual.coupledLegacyConsumers?.[0]?.consumers?.join(",") !== "buildDataListFormSubListControl,buildFieldRules") fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_DUAL_READINESS_INVALID");
if (!["nested controls", "summaries", "Lookup", "identity user people person", "department", "file image binary", "barcode", "Approval Forms", "Document Libraries", "Dashboards", "workflows"].every((value) => dual.scope?.excluded?.includes(value))) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_SCOPE_WIDENED");
if (!["compiled source", "Plugin dist", "temporary official ZIP", "simulated installed Plugin"].every((value) => dual.requiredFutureProof?.distribution?.includes(value)) || !dual.requiredFutureProof?.routing?.includes("both coupled Legacy consumers") || !dual.requiredFutureProof?.routing?.includes("temporary-copy-only Legacy rollback")) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_PROOF_PLAN_INCOMPLETE");
if (!promoted && (coreIndex.includes("projectDataListSublistScalarRowSchema") || runtimeIndex.includes("lowerDataListSublistScalarRowSchema"))) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ACCIDENTAL_PUBLIC_EXPORT");
if (promoted && (!coreIndex.includes("projectDataListSublistScalarRowSchema") || !runtimeIndex.includes("lowerDataListSublistScalarRowSchema"))) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_PUBLIC_PROMOTION_DRIFT");
if (!coreSource.includes("projectDataListSublistScalarRowSchemaInternal") || /randomUUID|node:|process\.|readFile|writeFile/.test(coreSource) || !runtimeSource.includes("lowerDataListSublistScalarRowSchemaAtHostInternal") || !errors.every((code) => runtimeSource.includes(code))) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_BOUNDARY_DRIFT");
if (corpus.caseCount !== 21 || corpus.cases.length !== 21 || !errors.every((code) => corpus.cases.some((item) => item.error === code))) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORPUS_DRIFT");
if (dual.closureProofLineage?.path !== lineagePath || (!promoted && dual.closureProofLineage?.sha256 !== sha(read(lineagePath)))) fail("PHASE_CLOSURE_PROOF_LINEAGE_DRIFT");
if (!promoted) for (const [name, expected] of Object.entries(dual.artifactState || {})) { const actual = sha(read(`dist/yeeflow-app-builder-plugin/${expected.path}`)); if (actual !== expected.sha256) fail("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ARTIFACT_DRIFT"); }
console.log("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CORE_PUBLIC_API_READINESS_ACCEPTED");
console.log("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED");
console.log("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_DUAL_DISTRIBUTION_READINESS_VALID");
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function fail(code) { console.error(code); process.exit(1); }
