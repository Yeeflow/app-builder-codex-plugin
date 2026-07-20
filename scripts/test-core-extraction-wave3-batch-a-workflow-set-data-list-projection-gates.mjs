#!/usr/bin/env node
import assert from "node:assert/strict";
import { projectWorkflowSetDataListProjection } from "../packages/app-builder-core-planning/lib/markdown-planning-utils.js";

const projection = projectWorkflowSetDataListProjection({ records: [{ workflowVariableDeclarations: [{ id: "Rows", type: "list", key: "_list.2076284286981328898", valueType: "integer", name: "Rows", expressionName: "Rows:Hours" }] }] });
assert.equal(typeof projection.variables.listref[0].fields[0].id, "string");
assert.equal(projection.variables.listref[0].fields[0].id, "2076284286981328898");
assert.equal("mergeWorkflowVariableProjection" in projection, false);
assert.throws(() => { projection.variables.basic.push({}); }, TypeError);
assert.equal(projectWorkflowSetDataListProjection({ records: [] }).variables.basic.length, 0);
console.log("CORE_EXTRACTION_WAVE3_BATCH_A_NEGATIVE_REGRESSIONS_PASSED cases=4");
