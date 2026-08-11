#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { validateDataReportDetail } from "./validate-data-report-detail.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(readFileSync(resolve(root, "fixtures/data-report-live-contract/data-report.detail.valid.json"), "utf8"));
expectPass("synthetic observed pipeline passes", fixture);
expectCode("wrong list type fails", mutate((detail) => { detail.List.Type = 1; }), "DATA_REPORT_LIST_TYPE_INVALID");
expectCode("output before final fails", mutate((detail) => { detail.Model.Settings = JSON.stringify({ Stages: [detail.Model.Settings ? JSON.parse(detail.Model.Settings).Stages.at(-1) : {}, ...JSON.parse(detail.Model.Settings).Stages.slice(0, -1)] }); }), "DATA_REPORT_OUTPUT_STAGE_NOT_FINAL");
expectCode("unresolved group dependency fails", mutate((detail) => { const stages = JSON.parse(detail.Model.Settings).Stages; stages[1].Sqls = ["SELECT 1"]; stages[1].Tables = []; detail.Model.Settings = JSON.stringify({ Stages: stages }); }), "DATA_REPORT_STAGE_DEPENDENCY_UNRESOLVED");
expectCode("join without two sources fails", mutate((detail) => { const stages = JSON.parse(detail.Model.Settings).Stages; stages[2].Type = "join"; detail.Model.Settings = JSON.stringify({ Stages: stages }); }), "DATA_REPORT_STAGE_DEPENDENCY_UNRESOLVED");
console.log("DATA_REPORT_DETAIL_TESTS_PASSED count=5");

function mutate(change) { const copy = structuredClone(fixture); change(copy); return copy; }
function expectPass(name, detail) { assert.deepEqual(validateDataReportDetail(detail), [], name); }
function expectCode(name, detail, code) { assert.ok(validateDataReportDetail(detail).some((finding) => finding.code === code), name); }
