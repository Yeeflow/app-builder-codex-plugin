#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { quoteLargeJsonIntegers } from "./lib/yapk-decode-utils.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-9g-export-proven-data-list-sublist-embedded-schema-reconciliation";
const exportPath = resolve(argument("--export", "/Users/rengerhu/Downloads/Employee Leave Balances.ydl"));
const wrapperText = readFileSync(exportPath, "utf8").replace(/^\uFEFF/, "");
const wrapper = JSON.parse(quoteLargeJsonIntegers(wrapperText));
const resourceText = decodeGzipResource(wrapper);
const resource = JSON.parse(quoteLargeJsonIntegers(resourceText));
const decoded = typeof resource.Data === "string" ? JSON.parse(quoteLargeJsonIntegers(resource.Data)) : resource.Data || resource;
const evidence = extractEvidence(decoded);
const wrapperSha256 = sha(wrapperText);
const resourceSha256 = sha(resourceText);

const fixturePath = "compatibility/differential-fixtures/data-list-sublist-embedded-schema-export.v0.1.0.json";
const contractPath = "compatibility/capability-manifests/data-list-sublist-embedded-schema-contract.v0.1.0.json";
const supersessionPath = "compatibility/capability-manifests/data-list-sublist-child-identity-supersession.v0.1.0.json";
const reportPath = "docs/architecture/yeeflow-app-builder-phase-9g-export-proven-data-list-sublist-embedded-schema-reconciliation.v0.1.0.md";

const fixture = {
  schemaVersion: "1.0.0",
  phase,
  source: { kind: "user-supplied-product-export", fileName: "Employee Leave Balances.ydl", absolutePath: exportPath, wrapperSha256, decodedResourceSha256: resourceSha256, decoding: ["UTF-8 wrapper string", "gzip base64 Resource string", "UTF-8 resource string", "Data JSON string"], largeIntegerPolicy: "All unquoted JSON integers with 16 or more digits are quoted before parsing; product identities remain strings." },
  parent: evidence.parent,
  columns: evidence.columns,
  customFormControl: evidence.customFormControl,
  forbiddenProductIdentityKeys: ["childListId", "childFieldId", "rowSchemaId"],
  expected: { rulesAndCustomFormColumnMetadataEqual: true, descriptorIsEmbeddedUnderParentField: true, childProductResources: false },
};

const contract = {
  schemaVersion: "1.0.0",
  phase,
  status: "accepted",
  marker: "DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_CONTRACT_VALID",
  identity: {
    productResourceIdentity: ["parentListId", "parentFieldId"],
    parentField: "The only product-owned Data List Sublist resource is the parent field whose FieldType is Text and Type is list.",
    prohibitedProductResourceIdentity: ["childListId", "childFieldId", "rowSchemaId"],
    prohibitedDerivations: ["UUID", "row.idx", "list-variables[].id", "parent ID reuse", "placeholder", "numeric conversion", "inferred value"],
  },
  embeddedSchema: {
    source: "parent field Rules[\"list-variables\"]",
    columnProperties: ["idx", "id", "name", "type", "editable"],
    idxSemantics: "Export row-shape and presentation descriptor. It may be stable within an export but is not a product resource ID and must not be allocated, converted, or compared as one.",
    idSemantics: "Embedded logical-column key. It may be stable within a parent field schema but is not a product resource ID and must not be allocated, converted, or compared as one.",
    ordering: "Descriptor column order is the exported list-variables order.",
  },
  coupledConsumers: {
    ruleConsumer: "parent field Rules.list-variables",
    customFormConsumer: "Sublist control attrs.list-fields schema metadata",
    requirement: "Both consumers must receive the same frozen EmbeddedSublistSchemaDescriptor before their lowerings diverge. Custom-form control IDs and visual properties remain host presentation data outside the descriptor.",
  },
  coreBoundary: { module: "packages/app-builder-core-materializer/src/internal/data-list-sublist-embedded-schema.ts", publicApiChanged: false, distributionChanged: false, productionRoutingChanged: false, forbiddenDependencies: ["Codex", "OAuth", "browser", "Git", "AI SDK", "Next.js", "React", "Prisma"] },
  phase8ERoutingReassessment: { status: "reassessed_not_routed", conclusion: "The missing-child-resource-identity premise is superseded. A future routing audit must instead prove one frozen embedded descriptor is selected before both existing consumers, while preserving template, presentation-control, summary, and graph-lowering boundaries." },
};

const supersession = {
  schemaVersion: "1.0.0",
  phase,
  status: "supersedes_identity_premise_only",
  marker: "DATA_LIST_SUBLIST_CHILD_IDENTITY_PREMISE_SUPERSEDED",
  reason: "A product-exported Data List proves that child columns are embedded in the parent field schema and have no child product-resource identities.",
  supersededPhases: phaseRecords(),
  preservedHistoricalObservation: "Phase 9F correctly observed that Legacy has no child-resource identity provider. The superseded premise is that such a provider is necessary for Data List Sublist schema reconciliation.",
  retainedFiles: "No historical scripts, reports, manifests, validators, or regressions are deleted. They remain audit history and are superseded by this manifest for child-resource-identity requirements only.",
};

writeJson(fixturePath, fixture);
writeJson(contractPath, contract);
writeJson(supersessionPath, supersession);
write(reportPath, report({ fixture, contract, supersession }));
updateMigrationState();
console.log("DATA_LIST_SUBLIST_EXPORT_EVIDENCE_RECORDED");
console.log("DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_CONTRACT_RECORDED");
console.log("DATA_LIST_SUBLIST_CHILD_IDENTITY_PREMISE_SUPERSEDED");

function extractEvidence(value) {
  const item = value?.Item || value;
  const list = item?.ListModel || item?.List;
  const parentField = array(item?.Defs || item?.Fields).find((field) => field?.DisplayName === "Leave details" && field?.FieldType === "Text" && field?.Type === "list");
  if (!list || !parentField || typeof parentField.Rules !== "string") fail("DATA_LIST_SUBLIST_EXPORT_PARENT_FIELD_MISSING");
  const rules = JSON.parse(quoteLargeJsonIntegers(parentField.Rules));
  const columns = normalColumns(rules["list-variables"]);
  const controls = [];
  walkJsonStrings(value, (node, pointer) => { if (node?.type === "list" && node?.binding === parentField.FieldName) controls.push({ node, pointer }); });
  if (controls.length !== 1) fail("DATA_LIST_SUBLIST_EXPORT_CUSTOM_FORM_CONTROL_INVALID");
  const control = controls[0].node;
  const listFields = normalColumns(array(control.attrs?.["list-fields"]));
  if (JSON.stringify(columns) !== JSON.stringify(listFields)) fail("DATA_LIST_SUBLIST_EXPORT_CONSUMER_SCHEMA_MISMATCH");
  const forbidden = new Set(["childlistid", "childfieldid", "rowschemaid"]);
  const found = [];
  walkJsonStrings(value, (node) => { for (const key of Object.keys(node || {})) if (forbidden.has(key.toLowerCase())) found.push(key); });
  if (found.length) fail("DATA_LIST_SUBLIST_EXPORT_UNEXPECTED_CHILD_IDENTITY", found.join(","));
  if (!lossless(parentField.ListID) || !lossless(parentField.FieldID) || parentField.ListID !== list.ListID) fail("DATA_LIST_SUBLIST_EXPORT_PARENT_IDENTITY_INVALID");
  return {
    parent: { listId: parentField.ListID, fieldId: parentField.FieldID, fieldName: parentField.FieldName, displayName: parentField.DisplayName, fieldType: parentField.FieldType, type: parentField.Type, rulesStoredAs: "string" },
    columns,
    customFormControl: { pointer: controls[0].pointer, binding: control.binding, fieldId: control.fieldID, listVariables: normalColumns(array(control.attrs?.["list-variables"])), listFields: listFields, controlBindings: array(control.attrs?.["list-fields"]).map((column) => ({ binding: column?.control?.binding, parentBinding: column?.control?.attrs?.list_field_binding, controlType: column?.control?.type })) },
  };
}

function phaseRecords() {
  const ids = ["phase-8a-data-list-sublist-nested-template-graph-contract-audit", "phase-8b-data-list-sublist-explicit-scalar-row-schema-shadow", "phase-8c-data-list-sublist-scalar-row-schema-dual-public-distribution-readiness", "phase-8d-data-list-sublist-scalar-row-schema-dual-public-distribution-promotion", "phase-8e-data-list-sublist-scalar-row-schema-coupled-consumer-routing-proof", "phase-9a-data-list-sublist-child-resource-identity-map-and-row-schema-allocation-contract-audit", "phase-9b-data-list-sublist-child-resource-inventory-host-shadow", "phase-9c-data-list-sublist-child-resource-inventory-local-runtime-distribution-readiness", "phase-9d-data-list-sublist-child-resource-inventory-local-runtime-public-api-and-distribution-promotion", "phase-9e-data-list-sublist-child-resource-inventory-post-allocation-integration-readiness", "phase-9f-data-list-sublist-child-identity-provenance-and-host-provider-audit"];
  return ids.map((id) => ({ id, status: "superseded", supersededBy: phase, scope: "child ListID, child FieldID, or rowSchemaId as required product resource identity" }));
}

function updateMigrationState() {
  const path = "docs/architecture/yeeflow-app-builder-core-migration-state.json";
  const state = JSON.parse(read(path));
  state.lastUpdated = "2026-07-19";
  state.migration.currentPhase = phase;
  state.migration.currentPhaseStatus = "complete";
  state.migration.nextPhase = "phase-9h-export-proven-sublist-frozen-descriptor-routing-readiness-audit";
  state.migration.overallStatus = "in_progress";
  for (const record of state.completed || []) {
    if (phaseRecords().some((item) => item.id === record.id)) {
      record.status = "superseded";
      record.supersededBy = phase;
      record.supersededReason = "The product export proves an embedded parent-field schema and no required child product-resource identity.";
    }
  }
  upsert(state.completed, { id: phase, status: "complete", evidence: "2026-07-19: DATA_LIST_SUBLIST_EXPORT_EVIDENCE_VALID, DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_CONTRACT_VALID, DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_DIFFERENTIAL_PASSED, and DATA_LIST_SUBLIST_CHILD_IDENTITY_PREMISE_SUPERSEDED. The product export proves parent ListID and FieldID are the only product resource identities; Rules and custom-form list-fields share one embedded descriptor." });
  state.inProgress = [];
  state.blocked = (state.blocked || []).filter((item) => !String(item.id).includes("sublist-scalar-row-schema"));
  state.nextSteps = (state.nextSteps || []).filter((item) => !String(item.id).includes("sublist-child") && !String(item.id).includes("phase-8-sublist"));
  state.nextSteps.unshift({ order: 1, id: state.migration.nextPhase, description: "Audit routing readiness for one frozen embedded Sublist schema descriptor selected before Rules and custom-form lowerings. Do not route production materializer behavior without separate authorization and Legacy/Core differential, source, archive, installed, determinism, scope, and rollback proof." });
  state.proofStatus ||= {};
  Object.assign(state.proofStatus, {
    dataListSublistExportEvidence: "passed_lossless_string_decode",
    dataListSublistEmbeddedSchemaContract: "passed",
    dataListSublistEmbeddedSchemaDifferential: "passed",
    dataListSublistScalarRowSchemaCoupledConsumerRouting: "reassessed_not_routed_frozen_descriptor_seam_required",
    dataListSublistChildResourceIdentityContract: "superseded_embedded_schema_has_no_child_product_resources",
    dataListSublistChildResourceInventoryHostShadow: "superseded_not_applicable",
    dataListSublistChildResourceInventoryLocalRuntimePublicApiReadiness: "superseded_not_applicable",
    dataListSublistChildResourceInventoryDistributionReadiness: "superseded_not_applicable",
    dataListSublistChildResourceInventoryLocalRuntimePublicDistribution: "superseded_not_applicable",
    dataListSublistChildResourceInventoryPostAllocationBoundary: "superseded_not_applicable",
    dataListSublistChildResourceInventoryIntegrationReadiness: "superseded_no_child_api_identity_required",
    dataListSublistLegacyIdentityProvenance: "retained_observation_superseded_premise",
  });
  writeJson(path, state);
}

function report(value) {
  const { fixture, contract, supersession } = value;
  return `# Phase 9G Export-Proven Data List Sublist Embedded Schema Reconciliation\n\n## Decision\n\n\`${contract.marker}\`\n\nA Data List Sublist is an embedded schema of one parent field. The only product resource identities are the parent ListID and parent FieldID. Child columns are not child Data Lists or independently allocated product resources.\n\n## Lossless Export Evidence\n\nThe user-supplied product export was decoded as UTF-8 strings through the wrapper, gzip/base64 Resource, decoded resource, and Data payload. Unquoted 16+ digit JSON integers were quoted before parsing so product identities remained strings.\n\n| Evidence | Value |\n| --- | --- |\n| Wrapper SHA-256 | \`${fixture.source.wrapperSha256}\` |\n| Decoded resource SHA-256 | \`${fixture.source.decodedResourceSha256}\` |\n| Parent ListID | \`${fixture.parent.listId}\` |\n| Parent FieldID | \`${fixture.parent.fieldId}\` |\n| Parent field | \`${fixture.parent.displayName}\` / \`${fixture.parent.fieldName}\` |\n| Parent field shape | \`${fixture.parent.fieldType}\` / \`${fixture.parent.type}\` |\n| Embedded columns | ${fixture.columns.length} |\n\nThe parent Rules string contains \`list-variables\`. The custom-form Sublist control binds \`${fixture.customFormControl.binding}\` and its \`list-fields\` metadata equals the Rules schema. The export contains no \`childListId\`, \`childFieldId\`, or \`rowSchemaId\` key.\n\n## Embedded Descriptor Contract\n\n| Descriptor element | Meaning | Product resource identity |\n| --- | --- | --- |\n| \`parentListId\` | Parent Data List | Yes |\n| \`parentFieldId\` | Parent Sublist field | Yes |\n| \`list-variables[].id\` | Logical embedded column key | No |\n| \`list-variables[].idx\` | Export row-shape and presentation descriptor | No |\n| \`list-variables[].name/type/editable\` | Embedded column semantics | No |\n\nRules and custom-form schema lowerings must receive the same frozen descriptor. Custom-form visual control IDs, control types, summaries, templates, graph mutation, and package integration remain host-owned.\n\n## Supersession\n\n\`${supersession.marker}\`\n\nPhase 9F remains historically correct that Legacy lacks a child-resource identity provider. The requirement for such a provider is superseded because this product export proves no child product resource exists. Historical Phase 8A–E and 9A–F artifacts are retained and explicitly marked superseded for that premise only.\n\n## Phase 8E Reassessment\n\nThe child-identity routing blocker is removed as a premise, but production routing is not approved. The remaining real prerequisite is a separately authorized audit proving a single frozen embedded descriptor is selected before the Rules and custom-form consumers diverge, with all template and presentation boundaries retained.\n\n## Preserved Boundaries\n\nNo production materializer route, API allocation, adapter, public API, dist artifact, active installation, historical ZIP, protected duplicate, Git, release, or stable state changed.\n`;
}

function decodeGzipResource(value) { const prefix = "[______gizp______]"; if (typeof value?.Resource !== "string" || !value.Resource.startsWith(prefix)) fail("DATA_LIST_SUBLIST_EXPORT_RESOURCE_INVALID"); return gunzipSync(Buffer.from(value.Resource.slice(prefix.length), "base64")).toString("utf8"); }
function normalColumns(rows) { if (!Array.isArray(rows) || !rows.length) fail("DATA_LIST_SUBLIST_EXPORT_SCHEMA_MISSING"); const output = rows.map((row) => ({ idx: row?.idx, id: row?.id, name: row?.name, type: row?.type, editable: row?.editable })); if (output.some((row) => !text(row.idx) || !text(row.id) || !text(row.name) || !text(row.type) || typeof row.editable !== "boolean")) fail("DATA_LIST_SUBLIST_EXPORT_SCHEMA_INVALID"); return output; }
function walkJsonStrings(value, visitor, pointer = "$") { if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) { try { return walkJsonStrings(JSON.parse(quoteLargeJsonIntegers(value)), visitor, `${pointer}<json>`); } catch { return; } } if (!value || typeof value !== "object") return; visitor(value, pointer); for (const [key, child] of Object.entries(value)) walkJsonStrings(child, visitor, `${pointer}.${key}`); }
function array(value) { return Array.isArray(value) ? value : []; }
function lossless(value) { return typeof value === "string" && /^\d{16,30}$/.test(value); }
function text(value) { return typeof value === "string" && value.trim().length > 0; }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function write(path, value) { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, value, "utf8"); }
function writeJson(path, value) { write(path, `${JSON.stringify(value, null, 2)}\n`); }
function upsert(list, value) { const existing = list.find((item) => item.id === value.id); if (existing) Object.assign(existing, value); else list.push(value); }
function fail(code, detail = "") { console.error(`${code}${detail ? `: ${detail}` : ""}`); process.exit(1); }
