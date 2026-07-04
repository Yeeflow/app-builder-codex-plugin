#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pluginRootMode } from "./lib/plugin-root-layout.mjs";

const ROOT = process.cwd();
const ROOT_MODE = pluginRootMode(ROOT);
const CUSTOM_CODE_SKILL_ROOT =
  ROOT_MODE === "installed-cache-root"
    ? "skills/yeeflow-custom-code-generator"
    : "skills/installed/yeeflow-custom-code-generator";
const CUSTOM_SERVICE_SKILL_ROOT =
  ROOT_MODE === "installed-cache-root"
    ? "skills/yeeflow-custom-service-generator"
    : "skills/installed/yeeflow-custom-service-generator";
const FEATURE_LEARNING_SKILL_ROOT =
  ROOT_MODE === "installed-cache-root"
    ? "skills/yeeflow-feature-learning-orchestrator"
    : "skills/installed/yeeflow-feature-learning-orchestrator";

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function assertExists(relativePath) {
  assert.equal(fs.existsSync(path.join(ROOT, relativePath)), true, `${relativePath} exists`);
}

function assertIncludes(relativePath, needle) {
  assert.ok(read(relativePath).includes(needle), `${relativePath} includes ${needle}`);
}

const requiredFiles = [
  "docs/standards/app-plan-standard-template.md",
  "docs/standards/custom-capability-app-plan-planning-standard.md",
  `${CUSTOM_CODE_SKILL_ROOT}/SKILL.md`,
  `${CUSTOM_SERVICE_SKILL_ROOT}/SKILL.md`,
  `${FEATURE_LEARNING_SKILL_ROOT}/SKILL.md`,
];

for (const file of requiredFiles) assertExists(file);

for (const needle of [
  "Custom Code and Custom Service Planning",
  "Custom Capability Decision Matrix",
  "Custom Code Plan",
  "Custom Service Plan",
  "Custom Service Invocation Plan",
  "Custom Capability Proof and Runtime Validation Plan",
  "Native Yeeflow Capability Considered",
  "Selected Capability",
  "Runtime Proof Required",
  "server-side queued execution",
  "type: \"invokeservice\"",
  "stencil.id = \"InvokeCode\"",
  "__variables_",
  "__list_",
  "__temp_",
  "Not planned",
]) {
  assertIncludes("docs/standards/app-plan-standard-template.md", needle);
}

for (const needle of [
  "Custom Code control",
  "Form Action Custom Code step",
  "Custom Service",
  "render(context, fieldsValues, readonly)",
  "execute(context, fieldsValues)",
  "main({ connections, params, modules })",
  "type: \"invokeservice\"",
  "stencil.id = \"InvokeCode\"",
  "server-side and queue-based",
  "connection variables",
  "Not planned",
  "must not materialize",
]) {
  assertIncludes("docs/standards/custom-capability-app-plan-planning-standard.md", needle);
}

assertIncludes(`${CUSTOM_CODE_SKILL_ROOT}/SKILL.md`, "Custom Code and Custom Service Planning");
assertIncludes(`${CUSTOM_CODE_SKILL_ROOT}/SKILL.md`, "custom-capability-app-plan-planning-standard.md");
assertIncludes(`${CUSTOM_CODE_SKILL_ROOT}/SKILL.md`, "Do not add Custom code as an unplanned shortcut");
assertIncludes(`${CUSTOM_CODE_SKILL_ROOT}/SKILL.md`, "render(context");
assertIncludes(`${CUSTOM_CODE_SKILL_ROOT}/SKILL.md`, "execute(context");

assertIncludes(`${CUSTOM_SERVICE_SKILL_ROOT}/SKILL.md`, "Custom Code and Custom Service Planning");
assertIncludes(`${CUSTOM_SERVICE_SKILL_ROOT}/SKILL.md`, "custom-capability-app-plan-planning-standard.md");
assertIncludes(`${CUSTOM_SERVICE_SKILL_ROOT}/SKILL.md`, "Do not add Custom Service");
assertIncludes(`${CUSTOM_SERVICE_SKILL_ROOT}/SKILL.md`, "invokeservice");
assertIncludes(`${CUSTOM_SERVICE_SKILL_ROOT}/SKILL.md`, "InvokeCode");
assertIncludes(`${CUSTOM_SERVICE_SKILL_ROOT}/SKILL.md`, "Not planned");

assertIncludes(`${FEATURE_LEARNING_SKILL_ROOT}/SKILL.md`, "Custom Code and Custom Service Planning");
assertIncludes(`${FEATURE_LEARNING_SKILL_ROOT}/SKILL.md`, "custom-capability-app-plan-planning-standard.md");
assertIncludes(`${FEATURE_LEARNING_SKILL_ROOT}/SKILL.md`, "must not materialize");

function inspectPlanSection(planText) {
  const hasSection = /Custom Code and Custom Service Planning/i.test(planText);
  const hasDecisionMatrix = /Custom Capability Decision Matrix/i.test(planText);
  const hasCustomCodePlan = /Custom Code Plan/i.test(planText);
  const hasCustomServicePlan = /Custom Service Plan/i.test(planText);
  const hasInvocationPlan = /Custom Service Invocation Plan/i.test(planText);
  const hasProofPlan = /Custom Capability Proof and Runtime Validation Plan/i.test(planText);
  const placeholderOnlyRows = (planText.match(/\|\s*(?:Not planned|N\/A|None|Not applicable)\s*\|/gi) || []).length;
  const hasMaterializedPlaceholderLanguage = /materialize(?:d)?\s+(?:Not planned|N\/A|None|Not applicable)/i.test(planText);
  return {
    hasSection,
    hasDecisionMatrix,
    hasCustomCodePlan,
    hasCustomServicePlan,
    hasInvocationPlan,
    hasProofPlan,
    placeholderOnlyRows,
    issues: [
      !hasSection && "CUSTOM_CAPABILITY_SECTION_MISSING",
      !hasDecisionMatrix && "CUSTOM_CAPABILITY_DECISION_MATRIX_MISSING",
      !hasCustomCodePlan && "CUSTOM_CODE_PLAN_MISSING",
      !hasCustomServicePlan && "CUSTOM_SERVICE_PLAN_MISSING",
      !hasInvocationPlan && "CUSTOM_SERVICE_INVOCATION_PLAN_MISSING",
      !hasProofPlan && "CUSTOM_CAPABILITY_PROOF_PLAN_MISSING",
      hasMaterializedPlaceholderLanguage && "CUSTOM_CAPABILITY_PLACEHOLDER_MATERIALIZATION_LANGUAGE_FORBIDDEN",
    ].filter(Boolean),
  };
}

const canonicalPlanTemplate = inspectPlanSection(read("docs/standards/app-plan-standard-template.md"));
assert.deepEqual(canonicalPlanTemplate.issues, []);

const validMinimalPlan = inspectPlanSection(`
## 17. Plugin Capability and Standards Compliance

### Custom Code and Custom Service Planning

#### Custom Capability Decision Matrix

| Requirement / Use Case | Native Yeeflow Capability Considered | Why Native Capability Is Enough or Insufficient | Selected Capability | Host Surface | Planning Status | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Price calculation | Expression | Enough | None | Not planned | Not planned | Local proof |

#### Custom Code Plan

| Custom Code Name | Surface | Host Page/Form/Action | Business Purpose | Inputs / Required Fields | Writable Outputs | Native Fallback Considered | Security / Privacy Notes | Runtime Proof Required |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Not planned | None | None | None | None | None | Native expression | None | None |

#### Custom Service Plan

| Custom Service Name | Business Purpose | Connection Variables | Input Variables | Output Variables | Backend / Integration Work | Native Fallback Considered | Security / Privacy Notes | Runtime Proof Required |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Not planned | None | None | None | None | None | Native workflow | None | None |

#### Custom Service Invocation Plan

| Invocation Name | Host Surface | Host Page/Form/Workflow | Service | Input Binding Source | Output Binding Target | Queue / Waiting UX | Follow-up Action | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Not planned | None | None | None | None | None | None | None | None |

#### Custom Capability Proof and Runtime Validation Plan

| Capability | Local Validation | Package Validation | Runtime Proof | Failure Handling / Fallback |
| --- | --- | --- | --- | --- |
| Not planned | None | None | None | None |
`);
assert.deepEqual(validMinimalPlan.issues, []);
assert.ok(validMinimalPlan.placeholderOnlyRows > 0);

const invalidPlan = inspectPlanSection(`
## 17. Plugin Capability and Standards Compliance

| Capability | Notes |
| --- | --- |
| Custom Service | materialized Not planned service |
`);
assert.ok(invalidPlan.issues.includes("CUSTOM_CAPABILITY_SECTION_MISSING"));
assert.ok(invalidPlan.issues.includes("CUSTOM_CAPABILITY_PLACEHOLDER_MATERIALIZATION_LANGUAGE_FORBIDDEN"));

console.log(
  JSON.stringify(
    {
      ok: true,
      gate: "custom-capability-app-plan",
      rootMode: ROOT_MODE,
      checkedFiles: requiredFiles.length,
    },
    null,
    2,
  ),
);
