#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "scripts/materialize-full-app-generated-final.mjs";
const source = read(sourcePath);
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
const outputPath = "compatibility/capability-manifests/data-list-additional-view-layout-contract-audit.v0.1.0.json";
const matrixPath = "compatibility/capability-manifests/data-list-additional-view-layout-capability-matrix.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-5r-data-list-additional-view-layout-contract-audit.v0.1.0.md";
const phase5SPath = "compatibility/capability-manifests/data-list-additional-view-layout-internal-shadow.v0.1.0.json";
const phase5TPath = "compatibility/capability-manifests/data-list-additional-view-layout-public-api-readiness.v0.1.0.json";
const calls = checkedLayoutCalls(ast);
const functions = functionLocations(ast);

if (calls.default.length !== 1 || calls.additional.length !== 1 || calls.unknown.length) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_AUDIT_CALL_GRAPH_INVALID", "The current LayoutView call graph does not contain exactly one default route and one explicit Legacy additional-view route.");
const requiredFunctions = ["dataListViewRecordsForList", "selectDefaultDataListViewRecord", "buildDataListViewLayoutView", "buildDataListViewLayoutViewChecked", "parseDataViewFixedFilterConditions"];
for (const name of requiredFunctions) if (!functions[name]) fail("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_AUDIT_SOURCE_MISSING", `Required Legacy function is missing: ${name}.`);

const matrix = [
  row("view-selection", "default selection uses isDefault then an All-name fallback", "additional records are every record other than the selected default", "requires-extended-view-intent-contract", "Core receives an explicit non-default view intent; host selection remains Legacy-owned."),
  row("resource-identity-and-url", "LayoutID index zero, Title fallback Default View, Ext1.Url default, IsDefault true", "host selects a post-custom-layout LayoutID index, Title is viewRecord.viewName, Ext1.Url uses routeKey or slugify(viewName), IsDefault false", "requires-identity-allocation-contract", "Core must not receive or allocate ListID or LayoutID; host owns record identity, URL, and final resource integration."),
  row("layout-and-query-fragment", "Title-first, fallback, deduplication, twelve-column limit, query static fields", "identical buildDataListViewLayoutView structural path", "reusable-with-default-layout-contract", "The immutable fragment contract is reusable after an additional-view intent explicitly supplies a stable scope."),
  row("fixed-filter-intents-and-order", "Core route uses a default-scoped key request path", "Legacy parses the same filter language and condition order but currently calls crypto.randomUUID directly", "requires-extended-view-intent-contract", "Core must receive a stable non-default viewScope; Local Runtime must validate allocated keys, lower filters, and append findings."),
  row("findings-and-errors", "Core route returns immutable findings lowered by Local Runtime", "Legacy checked path appends DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED using listName, viewName, and filter text", "requires-extended-view-intent-contract", "Future Core projection returns immutable findings with additional view evidence; host alone appends them in original order."),
  row("sort-row-color-grouping", "sort and rowColor are empty arrays; no grouping is emitted", "identical empty arrays; no additional-view-only grouping behavior exists", "reusable-with-default-layout-contract", "No Core extension is required for this current Legacy behavior."),
  row("field-and-template-boundaries", "FieldIDs are host-supplied; static query descriptors are fixed by the fragment builder", "identical field records and static query descriptors", "reusable-with-default-layout-contract", "Future input remains immutable and supplies FieldIDs and an explicit static template snapshot."),
  row("runtime-and-cross-resource-dependencies", "No LayoutView fragment dependency on forms, dashboards, APIs, or package output", "same fragment behavior; host layout index is affected by custom form layout count", "requires-identity-allocation-contract", "The host retains custom-layout index allocation and all cross-resource layout ownership."),
];
const contract = {
  schemaVersion: "1.0.0",
  phase: "phase-5r-data-list-additional-view-layout-contract-audit",
  source: { path: sourcePath, sha256: sha256(source) },
  auditMethod: "TypeScript AST top-level function and call-expression inspection plus explicit Legacy output-path comparison.",
  decision: {
    status: "accepted",
    marker: "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CONTRACT_ACCEPTED",
    rationale: "The additional Type 0 LayoutView fragment uses the same deterministic field, query, filter, sort, and rowColor construction as the default view. A future single Data List vertical is bounded only when an explicit additional-view intent supplies a stable filter key request scope and host identity and final-resource integration remain outside Core."
  },
  legacyBoundaries: {
    functions: requiredFunctions.map((name) => ({ name, line: functions[name] })),
    productionCalls: {
      default: calls.default,
      additional: calls.additional
    },
    additionalRouteCurrentState: "explicit Legacy route with routeDefaultViewThroughCore false"
  },
  differenceMatrix: matrix,
  classificationCounts: count(matrix.map((item) => item.classification)),
  selectedVertical: {
    id: "data-list-additional-type-zero-layout-projection",
    classification: "requires-extended-view-intent-contract",
    scope: "One non-default Data List Type 0 LayoutView fragment only.",
    callerBoundary: "Only the extraDataViews loop call expression to buildDataListViewLayoutViewChecked after a future separate approval.",
    contract: {
      input: "DataListAdditionalViewLayoutProjectionInput { viewScope, viewIntent: { viewName, routeKey, displayFields, queryFields, filterConditions, isDefault: false }, fields, templateSnapshot, listName }",
      fieldIdentity: "Every FieldID is supplied by immutable field input. Core accepts no ListID, LayoutID, layout index, or generated identity.",
      templateSnapshot: "Only caller-supplied static query-field descriptors are accepted. Core loads and mutates no template graph.",
      output: "Immutable LayoutView fragment, fixed-filter intents and key requests, and immutable findings. No Legacy layout record, URL, title, or IsDefault resource metadata is returned.",
      hostLowering: "Host allocates opaque keys. Local Runtime lowerFixedFilterProjectionAtHost validates allocations, lowers filters, and optionally appends findings to an explicit caller-owned array.",
      prohibited: ["UUID or host ID allocation", "template or generated-resource mutation", "package or archive writing", "filesystem, API, environment, process, OAuth, or runtime access"]
    },
    proofPlan: {
      corpus: ["named non-default view with routeKey", "named non-default view with slugified URL fallback", "Title-first and fallback field selection", "duplicate display and query fields", "twelve-column limit", "supplied FieldIDs", "static query fields", "one, multiple, duplicate, and malformed fixed filters", "finding ordering and explicit host append", "unapproved default and non-Data-List scope gates"],
      surfaces: ["compiled Core source", "Plugin dist artifact", "temporary official ZIP extraction", "simulated installed Plugin layout"],
      assertions: ["fragment and decoded resource parity", "filter and findings ordering", "error parity", "serialization and immutability", "deterministic output with controlled host UUID allocation"],
      rollback: "In a temporary complete Plugin copy, remove only the additional-view adapter binding and branch while retaining the existing default-view route and Materializer and Local Runtime artifacts."
    }
  },
  currentProductionGuarantees: {
    additionalViewsRoutedThroughCore: false,
    materializerSourceChangedByAudit: false,
    adaptersChangedByAudit: false,
    distributionChangedByAudit: false
  },
  phase5SFollowUp: existsSync(resolve(root, phase5SPath)) ? {
    path: phase5SPath,
    status: "internal_shadow_complete_not_routed",
    marker: "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INTERNAL_SHADOW_IMPLEMENTED"
  } : {
    status: "not_started"
  },
  phase5TFollowUp: existsSync(resolve(root, phase5TPath)) ? {
    path: phase5TPath,
    status: "public_api_readiness_accepted_not_promoted",
    marker: "DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_READINESS_ACCEPTED"
  } : {
    status: "not_started"
  }
};
write(outputPath, contract);
write(matrixPath, { schemaVersion: "1.0.0", phase: contract.phase, source: contract.source, rows: matrix, selectedVertical: contract.selectedVertical });
writeFileSync(resolve(root, reportPath), report(contract), "utf8");
console.log("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CONTRACT_ACCEPTED");
console.log(`DATA_LIST_ADDITIONAL_VIEW_LAYOUT_AUDIT_WRITTEN differences=${matrix.length}`);

function report(value) { return `# Phase 5R Data List Additional-View LayoutView Contract Audit\n\n## Decision\n\n\`${value.decision.marker}\`\n\nThe non-default Type 0 LayoutView fragment is a bounded future Data List vertical, but it requires an explicit additional-view intent contract. This audit does not route, distribute, or implement that vertical.\n\n## Exact Legacy Boundary\n\nThe default and additional paths each invoke \`buildDataListViewLayoutViewChecked\` once. The default call is the only Core route. The additional call retains \`routeDefaultViewThroughCore: false\` and is reached from the \`extraDataViews\` loop. Both use the same structural layout/query/filter fragment builder, but the host owns different LayoutID, title, URL, IsDefault, and layout-index behavior.\n\n## Default Versus Additional Matrix\n\n${value.differenceMatrix.map((item) => `- **${item.capability}**: Default: ${item.defaultBehavior} Additional: ${item.additionalBehavior} Classification: \`${item.classification}\`. Boundary: ${item.boundary}`).join("\n")}\n\n## Future Contract\n\nThe future input is an immutable \`DataListAdditionalViewLayoutProjectionInput\` with an explicit stable view scope, \`isDefault: false\` view intent, supplied FieldIDs, and static template snapshot. Materializer Core returns only immutable fragment, fixed-filter intents, deterministic requests, and findings. Local Runtime owns key validation, filter lowering, and optional findings append. The host retains UUID allocation and final resource record identity, URL, title, layout index, and integration.\n\n## Follow-Up\n\nPhase 5S status: \`${value.phase5SFollowUp.status}\`. ${value.phase5SFollowUp.path ? `The internal shadow evidence is recorded at \`${value.phase5SFollowUp.path}\` and remains non-public, undistributed, and non-routed.` : "No Phase 5S shadow evidence is recorded by this Phase 5R audit."} Phase 5T status: \`${value.phase5TFollowUp.status}\`. ${value.phase5TFollowUp.path ? `The public API readiness record is \`${value.phase5TFollowUp.path}\`; it remains unpromoted and non-routed.` : "No Phase 5T readiness record exists."}\n\n## Proof and Rollback\n\nA future route requires the documented focused matrix in compiled source, Plugin dist, temporary official ZIP, and simulated installed layouts, followed by temporary-copy-only rollback that preserves the already proven default route.\n\n## Non-Goals\n\nNo current production route, Core or Local Runtime artifact, adapter, active installation, historical ZIP, or release state changed.\n`; }
function row(capability, defaultBehavior, additionalBehavior, classification, boundary) { return { capability, defaultBehavior, additionalBehavior, classification, boundary }; }
function checkedLayoutCalls(sourceFile) {
  const result = { default: [], additional: [], unknown: [] };
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "buildDataListViewLayoutViewChecked") {
      const argument = node.arguments[0];
      const route = objectBoolean(argument, "routeDefaultViewThroughCore", sourceFile);
      const item = { line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1, routeDefaultViewThroughCore: route };
      if (route === true) result.default.push(item); else if (route === false) result.additional.push(item); else result.unknown.push(item);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return result;
}
function objectBoolean(node, property, sourceFile) {
  if (!node || !ts.isObjectLiteralExpression(node)) return null;
  const value = node.properties.find((item) => ts.isPropertyAssignment(item) && item.name.getText(sourceFile).replace(/["']/g, "") === property);
  return value && ts.isPropertyAssignment(value) && value.initializer.kind === ts.SyntaxKind.TrueKeyword ? true : value && ts.isPropertyAssignment(value) && value.initializer.kind === ts.SyntaxKind.FalseKeyword ? false : null;
}
function functionLocations(sourceFile) { const result = {}; for (const statement of sourceFile.statements) if (ts.isFunctionDeclaration(statement) && statement.name) result[statement.name.text] = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)).line + 1; return result; }
function count(values) { return Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((item) => item === value).length])); }
function read(relativePath) { return readFileSync(resolve(root, relativePath), "utf8"); }
function write(relativePath, value) { const path = resolve(root, relativePath); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }
