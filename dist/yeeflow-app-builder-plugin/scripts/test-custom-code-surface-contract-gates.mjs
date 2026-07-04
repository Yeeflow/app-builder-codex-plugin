#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pluginRootMode } from "./lib/plugin-root-layout.mjs";

const ROOT = process.cwd();
const ROOT_MODE = pluginRootMode(ROOT);
const SKILL_ROOT =
  ROOT_MODE === "installed-cache-root"
    ? "skills/yeeflow-custom-code-generator"
    : "skills/installed/yeeflow-custom-code-generator";

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function assertIncludes(file, needle) {
  const content = read(file);
  assert.ok(content.includes(needle), `${file} includes ${needle}`);
}

const requiredFiles = [
  "docs/standards/custom-code-form-action-step-runtime-standard.md",
  "docs/custom-code-control-decision-guide.md",
  "docs/yeeflow-form-action-generation-rules.md",
  "docs/training/custom-code-control-form-action-step-contract-training-report.md",
  `${SKILL_ROOT}/SKILL.md`,
  `${SKILL_ROOT}/references/yeeflow-custom-code-standard.md`,
];

for (const file of requiredFiles) {
  assert.equal(fs.existsSync(path.join(ROOT, file)), true, `${file} exists`);
}

for (const file of requiredFiles) {
  assertIncludes(file, "Custom Code");
}

assertIncludes("docs/standards/custom-code-form-action-step-runtime-standard.md", "form_action_step");
assertIncludes("docs/standards/custom-code-form-action-step-runtime-standard.md", "execute(context");
assertIncludes("docs/standards/custom-code-form-action-step-runtime-standard.md", "render(context");
assertIncludes("docs/standards/custom-code-form-action-step-runtime-standard.md", "React 15.6");
assertIncludes("docs/standards/custom-code-form-action-step-runtime-standard.md", "AntDesign 2.13");
assertIncludes("docs/standards/custom-code-form-action-step-runtime-standard.md", "yeeSDKClient");
assertIncludes("docs/standards/custom-code-form-action-step-runtime-standard.md", "getYeeSDKAPIDetails");
assertIncludes("docs/standards/custom-code-form-action-step-runtime-standard.md", "number");
assertIncludes("docs/standards/custom-code-form-action-step-runtime-standard.md", "not yet export-proven");

assertIncludes(`${SKILL_ROOT}/SKILL.md`, "form_action_step");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "execute(context");
assertIncludes(`${SKILL_ROOT}/SKILL.md`, "render(context");
assertIncludes(
  `${SKILL_ROOT}/SKILL.md`,
  "docs/standards/custom-code-form-action-step-runtime-standard.md",
);

assertIncludes(
  `${SKILL_ROOT}/references/yeeflow-custom-code-standard.md`,
  "Form Action Custom Code step",
);
assertIncludes(
  `${SKILL_ROOT}/references/yeeflow-custom-code-standard.md`,
  "execute(context",
);
assertIncludes(
  `${SKILL_ROOT}/references/yeeflow-custom-code-standard.md`,
  "render(context",
);

assertIncludes("docs/custom-code-control-decision-guide.md", "custom-code-form-action-step-runtime-standard.md");
assertIncludes("docs/yeeflow-form-action-generation-rules.md", "execute(context");
assertIncludes("docs/training/custom-code-control-form-action-step-contract-training-report.md", "Proof Boundary");

function inspectScript({ surface, source }) {
  const hasRender = /\brender\s*\(/.test(source);
  const hasExecute = /\bexecute\s*\(/.test(source);
  const hasExport = /CodeInApplication\s+implements\s+CodeInComp/.test(source);
  const issues = [];

  if (!hasExport) issues.push("CUSTOM_CODE_EXPORT_MISSING");

  if (surface === "control") {
    if (!hasRender) issues.push("CUSTOM_CODE_CONTROL_RENDER_MISSING");
    if (hasExecute && !hasRender) issues.push("CUSTOM_CODE_CONTROL_EXECUTE_ONLY_INVALID");
  } else if (surface === "form_action_step") {
    if (!hasExecute) issues.push("CUSTOM_CODE_ACTION_STEP_EXECUTE_MISSING");
    if (hasRender && !hasExecute) issues.push("CUSTOM_CODE_ACTION_STEP_RENDER_ONLY_INVALID");
  } else {
    issues.push("CUSTOM_CODE_SURFACE_UNKNOWN");
  }

  return { hasRender, hasExecute, hasExport, issues };
}

const controlOk = inspectScript({
  surface: "control",
  source: `export class CodeInApplication implements CodeInComp { render(context, fieldsValues, readonly) { return null; } }`,
});
assert.deepEqual(controlOk.issues, []);

const controlExecuteOnly = inspectScript({
  surface: "control",
  source: `export class CodeInApplication implements CodeInComp { execute(context, fieldsValues) {} }`,
});
assert.ok(controlExecuteOnly.issues.includes("CUSTOM_CODE_CONTROL_RENDER_MISSING"));
assert.ok(controlExecuteOnly.issues.includes("CUSTOM_CODE_CONTROL_EXECUTE_ONLY_INVALID"));

const actionStepOk = inspectScript({
  surface: "form_action_step",
  source: `export default class CodeInApplication implements CodeInComp { execute(context, fieldsValues) {} }`,
});
assert.deepEqual(actionStepOk.issues, []);

const actionStepRenderOnly = inspectScript({
  surface: "form_action_step",
  source: `export class CodeInApplication implements CodeInComp { render(context, fieldsValues, readonly) { return null; } }`,
});
assert.ok(actionStepRenderOnly.issues.includes("CUSTOM_CODE_ACTION_STEP_EXECUTE_MISSING"));
assert.ok(actionStepRenderOnly.issues.includes("CUSTOM_CODE_ACTION_STEP_RENDER_ONLY_INVALID"));

const missingExport = inspectScript({
  surface: "form_action_step",
  source: `function execute(context, fieldsValues) {}`,
});
assert.ok(missingExport.issues.includes("CUSTOM_CODE_EXPORT_MISSING"));

console.log(
  JSON.stringify(
    {
      ok: true,
      gate: "custom-code-surface-contract",
      rootMode: ROOT_MODE,
      checkedFiles: requiredFiles.length,
    },
    null,
    2,
  ),
);
