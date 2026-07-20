#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phase = "phase-9g-export-proven-data-list-sublist-embedded-schema-reconciliation";
const fixture = json(argument("--fixture", "compatibility/differential-fixtures/data-list-sublist-embedded-schema-export.v0.1.0.json"));
const contract = json(argument("--contract", "compatibility/capability-manifests/data-list-sublist-embedded-schema-contract.v0.1.0.json"));
const supersession = json(argument("--supersession", "compatibility/capability-manifests/data-list-sublist-child-identity-supersession.v0.1.0.json"));
const state = json(argument("--state", "docs/architecture/yeeflow-app-builder-core-migration-state.json"));
const coreSource = read("packages/app-builder-core-materializer/src/internal/data-list-sublist-embedded-schema.ts");
const forbidden = ["childListId", "childFieldId", "rowSchemaId"];

if (fixture.phase !== phase || fixture.source?.largeIntegerPolicy !== "All unquoted JSON integers with 16 or more digits are quoted before parsing; product identities remain strings.") fail("DATA_LIST_SUBLIST_EXPORT_FIXTURE_INVALID");
if (fixture.parent?.fieldType !== "Text" || fixture.parent?.type !== "list" || !lossless(fixture.parent?.listId) || !lossless(fixture.parent?.fieldId) || fixture.parent?.rulesStoredAs !== "string") fail("DATA_LIST_SUBLIST_EXPORT_PARENT_IDENTITY_INVALID");
if (!same(fixture.columns, fixture.customFormControl?.listFields) || !same(fixture.columns, fixture.customFormControl?.listVariables) || fixture.customFormControl?.binding !== fixture.parent?.fieldName || fixture.customFormControl?.fieldId !== fixture.parent?.fieldId) fail("DATA_LIST_SUBLIST_EXPORT_CONSUMER_SCHEMA_MISMATCH");
if (!fixture.columns?.every((column) => text(column.idx) && text(column.id) && text(column.name) && text(column.type) && typeof column.editable === "boolean")) fail("DATA_LIST_SUBLIST_EXPORT_SCHEMA_INVALID");
if (!same(fixture.forbiddenProductIdentityKeys, forbidden) || fixture.expected?.childProductResources !== false) fail("DATA_LIST_SUBLIST_EXPORT_CHILD_IDENTITY_INVALID");
if (contract.phase !== phase || contract.status !== "accepted" || contract.marker !== "DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_CONTRACT_VALID") fail("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_CONTRACT_INVALID");
if (!same(contract.identity?.productResourceIdentity, ["parentListId", "parentFieldId"]) || !same(contract.identity?.prohibitedProductResourceIdentity, forbidden)) fail("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_IDENTITY_INVALID");
if (!contract.identity?.prohibitedDerivations?.every((value) => ["UUID", "row.idx", "list-variables[].id", "parent ID reuse", "placeholder", "numeric conversion", "inferred value"].includes(value))) fail("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_PROHIBITION_INVALID");
if (contract.coupledConsumers?.requirement?.includes("same frozen EmbeddedSublistSchemaDescriptor") !== true || contract.phase8ERoutingReassessment?.status !== "reassessed_not_routed") fail("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_CONSUMER_CONTRACT_INVALID");
if (contract.coreBoundary?.publicApiChanged !== false || contract.coreBoundary?.distributionChanged !== false || contract.coreBoundary?.productionRoutingChanged !== false) fail("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_SCOPE_VIOLATION");
if (!supersession.supersededPhases?.every((entry) => entry.status === "superseded" && entry.supersededBy === phase) || supersession.preservedHistoricalObservation?.includes("Phase 9F correctly observed") !== true) fail("DATA_LIST_SUBLIST_IDENTITY_SUPERSESSION_INVALID");
for (const entry of supersession.supersededPhases) { const stateEntry = state.completed?.find((item) => item.id === entry.id); if (!stateEntry || stateEntry.status !== "superseded" || stateEntry.supersededBy !== phase) fail("DATA_LIST_SUBLIST_SUPERSESSION_STATE_INCOMPLETE"); }
const phaseRecord = state.completed?.find((item) => item.id === phase);
if (!phaseRecord || phaseRecord.status !== "complete" || !phaseRecord.evidence?.includes("DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_CONTRACT_VALID") || !state.migration?.currentPhase || state.inProgress?.length !== 0) fail("DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_STATE_INVALID");
if ((state.nextSteps || []).some((step) => /child.*identity|identity.*child/i.test(`${step.id} ${step.description}`))) fail("DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_STALE_NEXT_STEP");
for (const [key, expected] of Object.entries({ dataListSublistExportEvidence: "passed_lossless_string_decode", dataListSublistEmbeddedSchemaContract: "passed", dataListSublistEmbeddedSchemaDifferential: "passed", dataListSublistScalarRowSchemaCoupledConsumerRouting: "reassessed_not_routed_frozen_descriptor_seam_required" })) if (state.proofStatus?.[key] !== expected) fail("DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_PROOF_STATUS_INVALID", key);
if (!coreSource.includes("projectDataListEmbeddedSublistSchemaInternal") || !coreSource.includes("projectEmbeddedSublistRules") || !coreSource.includes("projectEmbeddedSublistCustomFormFields")) fail("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_CORE_BOUNDARY_INVALID");
if (/from\s+["'][^"']*(codex|oauth|browser|git|openai|next|react|prisma)[^"']*["']/i.test(coreSource)) fail("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_FORBIDDEN_DEPENDENCY");
console.log("DATA_LIST_SUBLIST_EXPORT_EVIDENCE_VALID");
console.log("DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_CONTRACT_VALID");
console.log("DATA_LIST_SUBLIST_CHILD_IDENTITY_PREMISE_SUPERSEDED");

function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function lossless(value) { return typeof value === "string" && /^\d{16,30}$/.test(value); }
function text(value) { return typeof value === "string" && value.trim().length > 0; }
function fail(code, detail = "") { console.error(`${code}${detail ? `: ${detail}` : ""}`); process.exit(1); }
