#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const materializer = await import(`${new URL("../packages/app-builder-core-materializer/lib/index.js", import.meta.url).href}?retained=${Date.now()}`);
const lineage = json("compatibility/capability-manifests/phase-closure-proof-lineage.v0.1.0.json");
for (const name of ["projectDataListDefaultViewLayout", "projectDataListDefaultViewSelector", "projectDataListLookupResolutionIntent", "projectDataListSublistScalarSummaryIntent", "projectDataListEmbeddedSublistDescriptor"]) assert.equal(typeof materializer[name], "function", `CORE_EXTRACTION_WAVE3_BATCH_I_RETAINED_EXPORT:${name}`);
const source = read("scripts/materialize-full-app-generated-final.mjs");
for (const token of ["coreProjectDataListDefaultViewLayout", "coreProjectDataListDefaultViewSelector", "coreProjectDataListLookupResolutionIntent", "coreProjectDataListSublistScalarSummaryIntent", "coreProjectDataListEmbeddedSublistDescriptor"]) assert(source.includes(token), `CORE_EXTRACTION_WAVE3_BATCH_I_RETAINED_ROUTE:${token}`);
for (const phase of ["phase-6e-data-list-lookup-resolution-selective-routing-proof", "phase-9n-selective-data-list-embedded-sublist-frozen-descriptor-production-host-context-routing-proof", "phase-10e-data-list-sublist-scalar-summary-intent-selective-routing-proof", "core-extraction-wave3-batch-i-data-list-static-configuration-selection-and-execution"]) assert(lineage.approvedTransitions.some((item) => item.phase === phase), `CORE_EXTRACTION_WAVE3_BATCH_I_RETAINED_LINEAGE:${phase}`);
assert.deepEqual(materializer.projectDataListDefaultViewSelector({ views: [{ viewName: "Custom", isDefault: false }, { viewName: "All Items", isDefault: false }] }), { selectedIndex: 1 });
console.log("CORE_EXTRACTION_WAVE3_BATCH_I_RETAINED_DATA_LIST_ROUTING_REGRESSIONS_PASSED");
