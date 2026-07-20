#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json(argument("--contract", "compatibility/capability-manifests/data-list-sublist-frozen-descriptor-production-routing.v0.1.0.json"));
const source = text(argument("--source", "scripts/materialize-full-app-generated-final.mjs"));
const context = text(argument("--context", "scripts/lib/data-list-sublist-frozen-descriptor-host-context.mjs"));
const adapter = text(argument("--adapter", "scripts/lib/materializer-core-adapter.mjs"));

if (contract.phase !== "phase-9n-selective-data-list-embedded-sublist-frozen-descriptor-production-host-context-routing-proof" || contract.decision?.marker !== "SUBLIST_EMBEDDED_SCHEMA_ADAPTER_ROUTING_PASSED") fail("SUBLIST_EMBEDDED_SCHEMA_ROUTING_CONTRACT_INVALID");
if (contract.route?.selectionBoundary !== "buildResourceGraphPackage -> fieldSpecsForList(...).map -> buildFieldRecord" || contract.route?.buildFieldRecordCallerCount !== 1 || contract.route?.selectionCountPerEligibleParentField !== 1) fail("SUBLIST_EMBEDDED_SCHEMA_SELECTION_BOUNDARY_INVALID");
if (JSON.stringify(contract.route?.forbiddenProductIdentities) !== JSON.stringify(["childListId", "childFieldId", "rowSchemaId"])) fail("SUBLIST_CHILD_IDENTITY_PREREQUISITE_RESTORED");
if (contract.hostContext?.globalState !== false || contract.hostContext?.serialization !== "absent from plan, resource, template, package, and Core DTO JSON") fail("SUBLIST_DESCRIPTOR_CONTEXT_CONTRACT_INVALID");
if (!Array.isArray(contract.excluded) || !["nested controls", "summaries", "Lookup", "package output"].every((item) => contract.excluded.includes(item))) fail("SUBLIST_EMBEDDED_SCHEMA_ROUTING_SCOPE_INVALID");

for (const token of ["projectDataListEmbeddedSublistDescriptor as coreProjectDataListEmbeddedSublistDescriptor", "createDataListEmbeddedSublistDescriptorHostContext", "DATA_LIST_EMBEDDED_SUBLIST_FROZEN_DESCRIPTOR_RULES_ROUTE_START", "DATA_LIST_EMBEDDED_SUBLIST_FROZEN_DESCRIPTOR_CUSTOM_FORM_ROUTE_START", "embeddedSublistDescriptorHostContext.dispose()"] ) if (!source.includes(token)) fail("SUBLIST_EMBEDDED_SCHEMA_PRODUCTION_ROUTE_MISSING");
if ((source.match(/coreProjectDataListEmbeddedSublistDescriptor\(/gu) || []).length !== 1) fail("SUBLIST_EMBEDDED_SCHEMA_DUPLICATE_SELECTION");
if ((source.match(/=>\s*buildFieldRecord\s*\(/gu) || []).length !== 1) fail("SUBLIST_EMBEDDED_SCHEMA_PRE_DIVERGENCE_CALLER_COUNT_INVALID");
const route = source.slice(source.indexOf("function selectExportProvenEmbeddedSublistDescriptor"), source.indexOf("function buildDataListSubListColumn"));
for (const forbidden of ["childListId", "childFieldId", "rowSchemaId", "randomUUID", "inventory", "fallback"]) if (route.toLowerCase().includes(forbidden.toLowerCase())) fail("SUBLIST_CHILD_IDENTITY_OR_FALLBACK_FORBIDDEN");
if (!adapter.includes("export const projectDataListEmbeddedSublistDescriptor = core.projectDataListEmbeddedSublistDescriptor;")) fail("SUBLIST_EMBEDDED_SCHEMA_ADAPTER_EXPORT_MISSING");
for (const forbidden of ["globalThis", "process.", "JSON.stringify", "childListId", "childFieldId", "rowSchemaId", "new Map()"] ) if (context.includes(forbidden)) fail("SUBLIST_DESCRIPTOR_CONTEXT_LEAKAGE_OR_IDENTITY_INVALID");
for (const token of ["let rawToDescriptor = new WeakMap()", "let recordToDescriptor = new WeakMap()", "selectAndBindRaw", "bindCompletedRecord", "readForRules", "readForCustomForm", "dispose()"]) if (!context.includes(token)) fail("SUBLIST_DESCRIPTOR_CONTEXT_LIFECYCLE_INVALID");

console.log("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_PRODUCTION_ROUTE_VALID");
console.log("SUBLIST_CHILD_IDENTITY_PREREQUISITE_SUPERSESSION_RECONFIRMED");

function argument(option, fallback) { const index = process.argv.indexOf(option); return index < 0 ? fallback : process.argv[index + 1]; }
function text(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(text(path)); }
function fail(code) { console.error(code); process.exit(1); }
