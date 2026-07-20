#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(root, process.argv[2] || "compatibility/capability-manifests/data-list-layoutview-projection-family-closure.v0.1.0.json");
const sourcePath = resolve(root, "scripts/materialize-full-app-generated-final.mjs");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const source = readFileSync(sourcePath, "utf8");
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const ids = new Map((manifest.matrix || []).map((entry) => [entry.id, entry]));

if (manifest.decision?.marker !== "DATA_LIST_LAYOUTVIEW_PROJECTION_FAMILY_CLOSED" || manifest.decision?.status !== "complete") fail("DATA_LIST_LAYOUTVIEW_PROJECTION_FAMILY_OPEN", "The LayoutView family closure decision is incomplete.");
for (const required of ["data-list-default-type-zero", "data-list-additional-type-zero", "data-list-custom-form-type-one", "data-list-listset-display-layout", "navigation-and-dashboard-layoutviews"]) if (!ids.has(required)) fail("DATA_LIST_LAYOUTVIEW_UNCLASSIFIED_PATH", `Missing LayoutView classification: ${required}.`);
if (ids.get("data-list-default-type-zero")?.classification !== "routed-core-local-runtime" || ids.get("data-list-additional-type-zero")?.classification !== "routed-core-local-runtime") fail("DATA_LIST_LAYOUTVIEW_ROUTE_PROOF_INCOMPLETE", "Default and additional Type 0 routes require separate Core and Local Runtime proof.");
if (ids.get("data-list-custom-form-type-one")?.classification === "routed-core-local-runtime") fail("DATA_LIST_LAYOUTVIEW_CROSS_TYPE_PROOF_FORBIDDEN", "Type 0 proof cannot cover Type 1 custom forms.");
if (!manifest.nextFamily?.coreBoundary || !manifest.nextFamily?.hostBoundary || !(manifest.nextFamily?.requiredProof || []).includes("temporary-copy-only Legacy rollback")) fail("DATA_LIST_LAYOUTVIEW_NEXT_FAMILY_BOUNDARY_MISSING", "The next family requires explicit Core, host, proof, and rollback boundaries.");
if (!source.includes("routeDefaultViewThroughCore: true") || !source.includes("routeAdditionalViewThroughCore: true")) fail("DATA_LIST_LAYOUTVIEW_ROUTE_BOUNDARY_STALE", "The routed Type 0 caller boundaries are stale.");
let checkedCalls = 0;
const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "buildDataListViewLayoutViewChecked") checkedCalls += 1; ts.forEachChild(node, visit); };
visit(ast);
if (checkedCalls !== 2) fail("DATA_LIST_LAYOUTVIEW_UNCLASSIFIED_PATH", "Unexpected checked LayoutView call count.");
console.log("DATA_LIST_LAYOUTVIEW_PROJECTION_FAMILY_CLOSED");
console.log("DATA_LIST_LAYOUTVIEW_PROJECTION_FAMILY_CLOSURE_VALID");
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }
