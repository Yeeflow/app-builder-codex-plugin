#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scalarContract = readJson("compatibility/capability-manifests/data-list-scalar-field-projection-contract.v0.1.0.json");
const state = readJson("docs/architecture/yeeflow-app-builder-core-migration-state.json");
const distribution = readJson("dist/yeeflow-app-builder-plugin/core/yeeflow-app-builder-core-distribution.v0.1.0.json");
const materializerSource = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
const adapterSource = readFileSync(resolve(root, "scripts/lib/materializer-core-adapter.mjs"), "utf8");
const routing = scalarContract.routing;
const artifact = distribution.artifacts?.find((item) => item.packageName === "@yeeflow/app-builder-core-materializer");

if (routing?.status !== "production_routed" || routing?.readinessMarker !== "DATA_LIST_SCALAR_FIELD_PROJECTION_ADAPTER_ROUTING_PASSED") fail("DATA_LIST_SCALAR_FIELD_PROJECTION_ROUTING_READINESS_REJECTED", "The scalar projection contract does not record the approved production routing state.");
if (state.proofStatus?.dataListScalarFieldProjectionShadow !== "passed" || state.proofStatus?.dataListScalarFieldProjectionPublicApiDistribution !== "passed" || state.proofStatus?.dataListScalarFieldProjectionRoutingReadiness !== "accepted" || state.proofStatus?.dataListScalarFieldProjectionRouting !== "passed") fail("DATA_LIST_SCALAR_FIELD_PROJECTION_ROUTING_READINESS_REJECTED", "Required shadow, distribution, readiness, or routing evidence is not passed.");
if (!routing.phase5DRoutingBoundary?.legacyFunction || routing.phase5DRoutingBoundary.productionInvokerCount !== 1 || !routing.phase5DRoutingBoundary.adapterExport || !routing.phase5DRoutingBoundary.integrationFixture || !routing.phase5DRoutingBoundary.rollbackBoundary) fail("DATA_LIST_SCALAR_FIELD_PROJECTION_ROUTING_READINESS_REJECTED", "The proposed Phase 5D routing boundary is incomplete.");
if (!artifact || artifact.sha256 !== routing.distributionArtifact?.sha256 || !artifact.exports.includes("projectDataListScalarField")) fail("DATA_LIST_SCALAR_FIELD_PROJECTION_ROUTING_READINESS_REJECTED", "The approved Materializer artifact does not contain the required projection export.");
const artifactPath = resolve(root, "dist/yeeflow-app-builder-plugin", artifact.path);
if (createHash("sha256").update(readFileSync(artifactPath)).digest("hex") !== artifact.sha256) fail("DATA_LIST_SCALAR_FIELD_PROJECTION_ROUTING_READINESS_REJECTED", "The approved Materializer artifact checksum does not match the distribution manifest.");
if (!materializerSource.includes("projectDataListScalarField as coreProjectDataListScalarField") || !materializerSource.includes("DATA_LIST_SCALAR_FIELD_PROJECTION_CORE_ROUTE_START")) fail("DATA_LIST_SCALAR_FIELD_PROJECTION_ROUTING_READINESS_REJECTED", "The Legacy materializer does not contain the approved scalar-only pre-ID routing branch.");
if (!adapterSource.includes("export const projectDataListScalarField = core.projectDataListScalarField;")) fail("DATA_LIST_SCALAR_FIELD_PROJECTION_ROUTING_READINESS_REJECTED", "The Materializer compatibility adapter does not expose the approved scalar projection API.");
console.log("DATA_LIST_SCALAR_FIELD_PROJECTION_ADAPTER_ROUTING_PASSED");

function readJson(relativePath) { return JSON.parse(readFileSync(resolve(root, relativePath), "utf8")); }
function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }
