#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiPath = "compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json";
const distributionPath = "compatibility/capability-manifests/yeeflow-app-builder-core-distribution-contract.v0.1.0.json";
const exportName = "projectApprovalFormSubListLookupStaticConfiguration";
const api = json(apiPath);
for (const value of [exportName]) if (!api.runtimeExports.includes(value)) api.runtimeExports.push(value);
for (const value of ["ApprovalFormSubListLookupStaticConfigurationInput", "ApprovalFormSubListLookupStaticConfiguration"]) if (!api.typeExports.includes(value)) api.typeExports.push(value);
api[exportName] = {
  input: "A JSON-safe Approval Form embedded-Sublist row-field Lookup configuration boundary. It accepts only type discriminators and static AppID/ListID/ListSetID/display-field candidates; it accepts no Data List DTO, target inventory, template, resource, control, host context, package state, or runtime event.",
  return: "A frozen ApprovalFormSubListLookupStaticConfiguration with appId 41 and lossless string listId, listSetId, and listField, or null for a non-Lookup/no-configuration shape.",
  errors: "APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_INVALID is thrown with the exact Legacy failure behavior for non-string supplied values, partial configuration, invalid AppID, malformed identifiers, or missing display field.",
  immutability: "The input is never mutated. A non-null result is frozen and JSON-serializable; its 19-digit IDs remain strings.",
  hostSideEffects: "None. The API does not retrieve Lookup targets, execute selection events, assign or clear values, evaluate expressions, mutate templates/resources/packages, or enforce frontend runtime behavior.",
  prohibited: "Data List DTOs, Lookup target resolution, Local Runtime APIs, frontend selection, target retrieval, automatic assignment, clearing, runtime writeback, readonly timing, host context, control identity, mutable template/resource/package state, and helper exports are excluded."
};
write(apiPath, api);
const distribution = json(distributionPath);
const artifact = distribution.approvedArtifacts.find((item) => item.packageName === "@yeeflow/app-builder-core-materializer");
if (!artifact) throw Error("CORE_EXTRACTION_WAVE2_MATERIALIZER_ARTIFACT_CONTRACT_MISSING");
if (!artifact.exports.includes(exportName)) artifact.exports.push(exportName);
write(distributionPath, distribution);
console.log("CORE_EXTRACTION_WAVE2_PUBLIC_CONTRACT_PREPARED");
function json(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }
function write(path, value) { writeFileSync(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`); }
