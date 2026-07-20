#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contract = JSON.parse(readFileSync(resolve(root, process.argv[2] || "compatibility/capability-manifests/data-list-resource-identity-allocation-contract.v0.1.0.json"), "utf8"));
if (contract.decision?.marker !== "DATA_LIST_RESOURCE_IDENTITY_CONTRACT_VALID") fail("DATA_LIST_RESOURCE_IDENTITY_CONTRACT_BLOCKED", "The identity contract decision is incomplete.");
for (const identity of ["rootListId", "ListID", "FieldID", "LayoutID", "lookupTargetListId"]) { const row = contract.identityFlowMatrix?.find((item) => item.identity === identity); if (!row || row.representation !== "lossless string" || !row.owner || !(row.targets || []).length) fail("DATA_LIST_IDENTITY_FLOW_INCOMPLETE", `Identity flow is incomplete: ${identity}.`); }
const prohibited = new Set(contract.coreContract?.prohibitions || []);
for (const rule of ["crypto.randomUUID", "numeric identity coercion", "implicit fallback IDs", "lookup map resolution", "host map mutation"]) if (!prohibited.has(rule)) fail("DATA_LIST_IDENTITY_CORE_BOUNDARY_INVALID", `Core prohibition is missing: ${rule}.`);
for (const code of ["DATA_LIST_IDENTITY_ALLOCATION_MISSING", "DATA_LIST_IDENTITY_ALLOCATION_INVALID", "DATA_LIST_IDENTITY_ALLOCATION_COLLISION", "DATA_LIST_IDENTITY_SCOPE_MISMATCH", "DATA_LIST_IDENTITY_RELATIONSHIP_BROKEN", "DATA_LIST_LOOKUP_TARGET_UNRESOLVED", "DATA_LIST_IDENTITY_LOSSY_INPUT"]) if (!(contract.hostContract?.validationErrors || []).includes(code)) fail("DATA_LIST_IDENTITY_VALIDATION_INCOMPLETE", `Host validation code is missing: ${code}.`);
if (!(contract.futurePhase5Y?.proof || []).includes("temporary-copy-only Legacy rollback")) fail("DATA_LIST_IDENTITY_ROUTING_PROOF_MISSING", "A future route requires rollback proof.");
console.log("DATA_LIST_RESOURCE_IDENTITY_CONTRACT_VALID");
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }
