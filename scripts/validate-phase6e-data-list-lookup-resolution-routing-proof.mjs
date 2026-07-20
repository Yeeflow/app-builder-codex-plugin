#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/data-list-lookup-resolution-selective-routing-proof.v0.1.0.json"), "utf8"));
const source = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
if (contract.decision?.status !== "complete" || contract.proof?.caseCount !== 15 || contract.productionBoundary?.buildFieldRecordCallExpressionCount !== 1) fail("DATA_LIST_LOOKUP_RESOLUTION_ROUTING_CONTRACT_INVALID", "Routing contract state is incomplete.");
for (const name of ["coreProjectDataListLookupResolutionIntent", "coreLowerDataListLookupResolutionAtHost", "DATA_LIST_LOOKUP_RESOLUTION_CORE_ROUTE_START", "DATA_LIST_LOOKUP_RESOLUTION_CORE_ROUTE_END"]) if (!source.includes(name)) fail("DATA_LIST_LOOKUP_RESOLUTION_ROUTING_CONTRACT_INVALID", `Lookup route binding is missing: ${name}.`);
if (!source.includes('type === "lookup"') || !source.includes('targetListIdsByLogicalKey') || !source.includes('targetScopesByLogicalKey')) fail("DATA_LIST_LOOKUP_RESOLUTION_ROUTING_CONTRACT_INVALID", "Lookup route lost its explicit scope or host-map boundary.");
console.log("DATA_LIST_LOOKUP_RESOLUTION_ROUTING_CONTRACT_VALID");
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }
