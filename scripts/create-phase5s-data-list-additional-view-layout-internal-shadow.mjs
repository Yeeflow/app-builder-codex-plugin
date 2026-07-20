#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const legacyPath = "scripts/materialize-full-app-generated-final.mjs";
const corePath = "packages/app-builder-core-materializer/src/internal/data-list-additional-view-layout-projection.ts";
const corpusPath = "compatibility/differential-fixtures/data-list-additional-view-layout-projection.v0.1.0.json";
const outputPath = "compatibility/capability-manifests/data-list-additional-view-layout-internal-shadow.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-5s-data-list-additional-view-layout-internal-shadow.v0.1.0.md";
const phase5TPath = "compatibility/capability-manifests/data-list-additional-view-layout-public-api-readiness.v0.1.0.json";
const legacy = read(legacyPath);
const core = read(corePath);
const corpus = JSON.parse(read(corpusPath));
const ast = ts.createSourceFile(legacyPath, legacy, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const routes = checkedLayoutRoutes(ast);

if (routes.default !== 1 || routes.additional !== 1 || routes.unknown !== 0) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_AUDIT_CALL_GRAPH_INVALID", "The current Legacy source must retain one default route and one explicit Legacy additional-view route.");
if (!core.includes("projectDataListAdditionalViewLayoutInternal") || !core.includes("isDefault: false") || !core.includes("isStableAdditionalViewScope")) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INTERNAL_SHADOW_INVALID", "The internal additional-view shadow does not enforce the accepted intent boundary.");
if (!Array.isArray(corpus.cases) || corpus.cases.length < 7 || !Array.isArray(corpus.contractCases) || corpus.contractCases.length < 3 || !Array.isArray(corpus.templateBoundaryCases) || corpus.templateBoundaryCases.length < 1) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CORPUS_INCOMPLETE", "The additional-view corpus is incomplete.");

const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-5s-data-list-additional-view-layout-shadow-contract",
  decision: { status: "complete_shadow_not_routed", marker: "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INTERNAL_SHADOW_IMPLEMENTED" },
  legacy: { path: legacyPath, sha256: sha256(legacy), additionalCheckedRouteCount: routes.additional, routeDefaultViewThroughCore: false },
  core: { path: corePath, sha256: sha256(core), functionName: "projectDataListAdditionalViewLayoutInternal", publicExport: false, distributionStatus: "excluded_from_public_artifact" },
  inputContract: {
    name: "DataListAdditionalViewLayoutProjectionInput",
    required: ["viewScope", "fields", "viewIntent.isDefault=false"],
    prohibitedHostProperties: ["LayoutID", "ListID", "URL", "slug", "routeKey", "layoutIndex", "host-selected index"],
    viewScopeRule: "A stable non-empty non-default scope is required. It must not end with /default, contain whitespace, or contain a backslash.",
    templateBoundary: "Only an immutable static query-field snapshot is accepted. Core performs no template loading or mutation.",
    fieldIdentityBoundary: "Every FieldID is supplied in immutable field input. Core allocates no identity."
  },
  outputContract: {
    fragment: "Immutable layout, empty filter, query, sort, and rowColor fragment.",
    fixedFilter: "Immutable intents, deterministic request IDs, and immutable findings from projectFixedFilterIntents.",
    hostBoundary: "Local Runtime lowerFixedFilterProjectionAtHost alone validates supplied keys, lowers filters, and optionally appends to a caller-owned findings array."
  },
  legacyBehavior: ["Title-first field selection", "fallback field selection and deduplication", "twelve-column maximum", "static query fields", "supplied FieldID propagation", "empty sort and rowColor arrays", "fixed-filter and finding ordering"],
  corpus: { path: corpusPath, parityCases: corpus.cases.length, contractBoundaryCases: corpus.contractCases.length, templateBoundaryCases: corpus.templateBoundaryCases.length, viewScopes: [...new Set(corpus.cases.map((item) => item.input.viewScope))].sort() },
  controlledUuid: corpus.legacy.uuidControl,
  productionGuarantees: { additionalViewsRoutedThroughCore: false, materializerSourceChanged: false, adaptersChanged: false, publicExportsChanged: false, distributionChanged: false },
  futureRoutingPrerequisites: ["A separate public API and distribution readiness decision.", "A separate additional-view adapter and selected routing approval.", "Source, official ZIP, and simulated installed parity.", "Scoped Legacy rollback that retains the default-view route."],
  phase5TFollowUp: existsSync(resolve(root, phase5TPath)) ? { path: phase5TPath, status: "public_api_readiness_accepted_not_promoted", marker: "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_READINESS_ACCEPTED" } : { status: "not_started" },
};
write(outputPath, contract);
writeFileSync(resolve(root, reportPath), report(contract), "utf8");
console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INTERNAL_SHADOW_IMPLEMENTED");
console.log(`DATA_LIST_ADDITIONAL_VIEW_LAYOUT_SHADOW_WRITTEN parityCases=${contract.corpus.parityCases} contractCases=${contract.corpus.contractBoundaryCases}`);

function report(value) { return `# Phase 5S Data List Additional Type 0 LayoutView Internal Shadow\n\n## Boundary\n\nThis internal-only Materializer Core shadow projects one non-default Data List Type 0 LayoutView fragment. It is not publicly exported, distributed, adapted, or production-routed. The retained Legacy additional-view call remains explicitly \`routeDefaultViewThroughCore: false\`.\n\n## Immutable Contract\n\n\`DataListAdditionalViewLayoutProjectionInput\` requires explicit fields with supplied FieldIDs, an immutable template snapshot, a non-default \`viewScope\`, and a \`viewIntent.isDefault: false\` intent. It accepts no LayoutID, ListID, URL, slug, route key, or host-selected layout index. The scope cannot end in \`/default\`, so an additional view cannot silently reuse the default key-request scope.\n\n## Responsibility Split\n\nMaterializer Core returns only frozen layout/query/sort/row-color data plus fixed-filter intents, deterministic key requests, and immutable findings. Local Runtime alone validates supplied allocated keys, lowers Legacy-shaped filters, and optionally appends findings to a host-owned target. Host code retains resource identity, URL, layout index, and final integration.\n\n## Parity Corpus\n\nThe versioned corpus contains ${value.corpus.parityCases} Legacy/Core parity cases across ${value.corpus.viewScopes.length} non-default scopes, ${value.corpus.contractBoundaryCases} explicit intent-boundary cases, and ${value.corpus.templateBoundaryCases} caller-supplied template-snapshot immutability case. Legacy UUID values are controlled in VM condition order and passed unchanged into Local Runtime allocation maps.\n\n## Follow-Up\n\nPhase 5T status: \`${value.phase5TFollowUp.status}\`. ${value.phase5TFollowUp.path ? `The public API readiness record is \`${value.phase5TFollowUp.path}\`; it does not promote an export or authorize routing.` : "No Phase 5T public API readiness record exists."}\n\n## Non-Goals\n\nNo public export, Plugin dist artifact, adapter, production routing, active installation, historical ZIP, or release state changed. Any future route requires separate API, distribution, source/archive/installed, and temporary-copy Legacy rollback proof.\n`; }
function checkedLayoutRoutes(file) { const result = { default: 0, additional: 0, unknown: 0 }; const visit = (node) => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "buildDataListViewLayoutViewChecked") { const route = routeFlag(node.arguments[0], file); if (route === true) result.default += 1; else if (route === false) result.additional += 1; else result.unknown += 1; } ts.forEachChild(node, visit); }; visit(file); return result; }
function routeFlag(node, file) { if (!node || !ts.isObjectLiteralExpression(node)) return null; const property = node.properties.find((item) => ts.isPropertyAssignment(item) && item.name.getText(file).replace(/["']/g, "") === "routeDefaultViewThroughCore"); if (!property || !ts.isPropertyAssignment(property)) return null; return property.initializer.kind === ts.SyntaxKind.TrueKeyword ? true : property.initializer.kind === ts.SyntaxKind.FalseKeyword ? false : null; }
function read(relativePath) { return readFileSync(resolve(root, relativePath), "utf8"); }
function write(relativePath, value) { const path = resolve(root, relativePath); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }
