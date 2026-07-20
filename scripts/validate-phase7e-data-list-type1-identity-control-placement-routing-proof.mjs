#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = json("compatibility/capability-manifests/data-list-type1-identity-control-placement-selective-routing-proof.v0.1.0.json");
const source = read("scripts/materialize-full-app-generated-final.mjs");
const requiredTokens = ["DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_ROUTE_START", "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_ROUTE_END", "coreProjectDataListType1IdentityControlPlacement", "coreLowerDataListType1IdentityControlPlacementAtHost", "type === \"dynamic-user\""];
if (contract.decision?.status !== "complete" || contract.decision?.marker !== "DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ADAPTER_ROUTING_PASSED" || contract.proof?.caseCount !== 17 || contract.productionBoundary?.buildDataListFormFieldsGridProductionCallerCount !== 1 || contract.productionBoundary?.buildDataListFormFieldControlProductionCallerCount !== 1) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTING_CONTRACT_INVALID", "The Phase 7E routing contract is incomplete.");
if (!requiredTokens.every((token) => source.includes(token)) || JSON.stringify(contract.productionBoundary?.routeTokens) !== JSON.stringify(requiredTokens)) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTING_CONTRACT_INVALID", "The exact Type 1 route tokens are missing.");
for (const retained of ["buildDataListFormSubListControl", "dynamic-image", "dynamic-file", "isSubListFormField(field, type)"]) if (!source.includes(retained)) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTING_SCOPE_INVALID", `The retained Legacy scope is missing ${retained}.`);
if (!contract.retainedLegacy?.includes("sublists") || !contract.retainedLegacy?.includes("Type 0 layouts") || !contract.retainedLegacy?.includes("Approval Forms")) fail("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTING_SCOPE_INVALID", "The routing contract omits retained Legacy families.");
console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTING_CONTRACT_VALID");
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function json(path) { return JSON.parse(read(path)); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }
