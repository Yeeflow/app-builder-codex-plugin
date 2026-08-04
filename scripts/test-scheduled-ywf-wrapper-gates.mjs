import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const fixture = (...parts) => join(root, "fixtures", "standalone-resource-tools", ...parts);
const temp = mkdtempSync(join(tmpdir(), "yeeflow-scheduled-ywf-gates-"));
const output = join(temp, "valid.ywf");
const ids = fixture("scheduled-workflow.issued-ids.json");

const build = JSON.parse(execFileSync(process.execPath, [join(root, "build-scheduled-ywf-wrapper.js"), fixture("scheduled-workflow.valid.input.json"), output, "--issued-ids", ids], { encoding: "utf8" }));
assert.match(build.status, /^pass/);
const validate = JSON.parse(execFileSync(process.execPath, [join(root, "validate-scheduled-ywf.js"), output, "--stage", "final", "--issued-ids", ids], { encoding: "utf8" }));
assert.match(validate.status, /^pass/);
assert.equal(validate.roundTrip.defBase64Valid, true);
assert.equal(validate.roundTrip.settingsJsonValid, true);

const noIds = spawnSync(process.execPath, [join(root, "validate-scheduled-ywf.js"), output, "--stage", "final"], { encoding: "utf8" });
assert.notEqual(noIds.status, 0);
assert.match(noIds.stdout, /SCHEDULED_YWF_ID_PROVENANCE_REQUIRED/);

const broken = JSON.parse(readFileSync(output, "utf8"));
broken.Settings = "{}";
const brokenPath = join(temp, "broken.ywf");
writeFileSync(brokenPath, `${JSON.stringify(broken, null, 2)}\n`);
const invalid = spawnSync(process.execPath, [join(root, "validate-scheduled-ywf.js"), brokenPath, "--stage", "structural"], { encoding: "utf8" });
assert.notEqual(invalid.status, 0);
assert.match(invalid.stdout, /SCHEDULED_YWF_SETTING_REQUIRED/);

const badStage = spawnSync(process.execPath, [join(root, "build-scheduled-ywf-wrapper.js"), fixture("scheduled-workflow.valid.input.json"), join(temp, "bad-stage.ywf"), "--stage", "typo", "--issued-ids", ids], { encoding: "utf8" });
assert.notEqual(badStage.status, 0);

const badRecurrenceInput = JSON.parse(readFileSync(fixture("scheduled-workflow.valid.input.json"), "utf8"));
badRecurrenceInput.Settings = { TimeZone: "not-a-timezone", Times: ["25:99"], StartDate: "tomorrow", EndDate: "yesterday", Frequency: "banana", Interval: 0.5 };
const badRecurrencePath = join(temp, "bad-recurrence.input.json");
writeFileSync(badRecurrencePath, `${JSON.stringify(badRecurrenceInput, null, 2)}\n`);
const badRecurrence = spawnSync(process.execPath, [join(root, "build-scheduled-ywf-wrapper.js"), badRecurrencePath, join(temp, "bad-recurrence.ywf"), "--issued-ids", ids], { encoding: "utf8" });
assert.notEqual(badRecurrence.status, 0);
assert.match(badRecurrence.stdout, /SCHEDULED_YWF_TIMEZONE_INVALID/);

const sharedOutput = join(temp, "shared-builder.ywf");
const sharedBuilt = JSON.parse(execFileSync(process.execPath, [join(root, "scripts/generate-scheduled-ywf-from-plan.mjs"), fixture("scheduled-workflow.shared-plan.json"), sharedOutput, "--issued-ids", fixture("scheduled-workflow.shared-plan-issued-ids.json")], { encoding: "utf8" }));
assert.match(sharedBuilt.status, /^pass/);
assert.equal(sharedBuilt.mode, "shared-full-app-workflow-builder");
const sharedChecked = JSON.parse(execFileSync(process.execPath, [join(root, "validate-scheduled-ywf.js"), sharedOutput, "--stage", "final", "--issued-ids", fixture("scheduled-workflow.shared-plan-issued-ids.json")], { encoding: "utf8" }));
assert.match(sharedChecked.status, /^pass/);

console.log(JSON.stringify({ status: "pass", marker: "SCHEDULED_YWF_WRAPPER_GATES_PASSED", cases: 8 }, null, 2));
