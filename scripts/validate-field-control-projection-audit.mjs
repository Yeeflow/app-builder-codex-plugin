#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const audit = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/field-control-projection-audit.v0.1.0.json"), "utf8"));
const matrix = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/field-control-projection-capability-matrix.v0.1.0.json"), "utf8"));
const scalarContract = JSON.parse(readFileSync(resolve(root, "compatibility/capability-manifests/data-list-scalar-field-projection-contract.v0.1.0.json"), "utf8"));
if (audit.selectedPhase5BVertical?.surface !== "data-list" || audit.selectedPhase5BVertical?.name !== "Data List scalar field projection for non-lookup, non-sublist fields") throw new Error("FIELD_CONTROL_PROJECTION_VERTICAL_TOO_BROAD");
if (audit.selectedPhase5BVertical.rejectedBreadth.includes("other resource") === false || audit.canonicalContract.prohibitions.length < 3) throw new Error("FIELD_CONTROL_PROJECTION_CONTRACT_INVALID");
if (!Array.isArray(audit.legacyEntryPoints) || audit.legacyEntryPoints.length < 8 || matrix.surfaces.length !== 4) throw new Error("FIELD_CONTROL_PROJECTION_AUDIT_INCOMPLETE");
if (!["shadow_parity_passed", "production_routed"].includes(scalarContract.status) || scalarContract.sourceBoundary.buildFieldRecordProductionCallExpressionCount !== 1 || scalarContract.coreContract.hostEffects.length !== 0) throw new Error("FIELD_CONTROL_PROJECTION_SHADOW_CONTRACT_INVALID");
if (scalarContract.differential.projectedCases < 1 || scalarContract.differential.immutabilityCases < scalarContract.differential.projectedCases) throw new Error("FIELD_CONTROL_PROJECTION_DIFFERENTIAL_CONTRACT_INVALID");
console.log("FIELD_CONTROL_PROJECTION_AUDIT_VALID entries=" + audit.legacyEntryPoints.length + " scalarProjection=" + scalarContract.status);
