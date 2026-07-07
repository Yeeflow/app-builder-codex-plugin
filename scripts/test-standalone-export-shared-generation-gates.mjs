#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST_ROOT = fs.existsSync(path.join(ROOT, "dist/yeeflow-app-builder-plugin"))
  ? path.join(ROOT, "dist/yeeflow-app-builder-plugin")
  : ROOT;

const checks = [];

expectFileContains("standard mentions ydl shared generation", "docs/standards/standalone-export-shared-generation-standard.md", [
  "Standalone `.ydl` generation and full-application `.yapk` Data List materialization must share",
  "Standalone Artifact Plan",
  "Trace JSON",
  "Data List Form Layouts v1.1",
  "Reverse-related Collection sections",
]);

expectFileContains("standard mentions ydp shared generation", "docs/standards/standalone-export-shared-generation-standard.md", [
  "Standalone `.ydp` generation and full-application `.yapk` Dashboard materialization must share",
  "Plan-vs-Actual Validator",
  "dashboard-page-layouts-two-panel-workspace",
  "validate-dashboard-generation-hard-gates.mjs",
]);

expectFileContains("standard mentions ywf shared generation", "docs/standards/standalone-export-shared-generation-standard.md", [
  "Standalone `.ywf` generation and full-application `.yapk` Approval Form materialization must share",
  "approvalForm.pages[]",
  "STANDALONE_YWF_SHARED_GENERATION_BYPASSED",
]);

expectFileContains("training report records both standalone export paths", "docs/training/standalone-ydl-ydp-shared-generation-training-report.md", [
  "Approval Form `.ywf` standalone exports",
  "Data List `.ydl` standalone exports",
  "Dashboard page `.ydp` standalone exports",
  "Standalone Artifact Plan",
  "validate-standalone-artifact-plan-trace.mjs",
]);

expectFileContains("approval-form skill enforces standalone plan trace path", "skills/installed/yeeflow-approval-form-generator/SKILL.md", [
  "Standalone `.ywf` generation and full-application `.yapk` Approval Form materialization must share",
  "approvalForm.pages[]",
  "validate-standalone-artifact-plan-trace.mjs",
]);

expectFileContains("data-list skill enforces shared ydl path", "skills/installed/yeeflow-data-list-generator/SKILL.md", [
  "Standalone `.ydl` generation and full-application `.yapk` Data List materialization must share",
  "Standalone `.ydl` generation must also be plan-first",
  "--strict-import-ready",
  "Do not hand-build a separate standalone `.ydl`",
  "STANDALONE_YDL_SHARED_GENERATION_BYPASSED",
]);

expectFileContains("dashboard skill enforces shared ydp path", "skills/installed/yeeflow-dashboard-generator/SKILL.md", [
  "Standalone `.ydp` generation and full-application `.yapk` Dashboard materialization must share",
  "Standalone `.ydp` generation must also be plan-first",
  "Do not hand-build a separate standalone `.ydp`",
  "STANDALONE_YDP_SHARED_GENERATION_BYPASSED",
]);

expectMirror("docs/standards/standalone-export-shared-generation-standard.md");
expectMirror("docs/training/standalone-ydl-ydp-shared-generation-training-report.md");
expectMirror("skills/installed/yeeflow-approval-form-generator/SKILL.md", "skills/yeeflow-approval-form-generator/SKILL.md");
expectMirror("skills/installed/yeeflow-data-list-generator/SKILL.md", "skills/yeeflow-data-list-generator/SKILL.md");
expectMirror("skills/installed/yeeflow-dashboard-generator/SKILL.md", "skills/yeeflow-dashboard-generator/SKILL.md");
expectMirror("scripts/test-standalone-export-shared-generation-gates.mjs");
expectMirror("scripts/validate-standalone-artifact-plan-trace.mjs");
expectMirror("scripts/test-ydl-strict-import-ready-gates.mjs");
expectMirror("validate-ydl-list.js");
expectStandalonePlanTraceValidator();
expectBadStandaloneYdlFails();

console.log(JSON.stringify({
  status: "pass",
  test: "test-standalone-export-shared-generation-gates",
  checks,
}, null, 2));

function expectFileContains(label, relativeFile, requiredSnippets) {
  const file = path.join(ROOT, relativeFile);
  assert.ok(fs.existsSync(file), `${label}: missing ${relativeFile}`);
  const text = fs.readFileSync(file, "utf8");
  for (const snippet of requiredSnippets) {
    assert.ok(text.includes(snippet), `${label}: missing snippet ${JSON.stringify(snippet)} in ${relativeFile}`);
  }
  checks.push({ case: label, status: "pass" });
}

function expectMirror(sourceRelative, distRelative = sourceRelative) {
  const source = path.join(ROOT, sourceRelative);
  const dist = path.join(DIST_ROOT, distRelative);
  assert.ok(fs.existsSync(source), `missing source mirror input ${sourceRelative}`);
  assert.ok(fs.existsSync(dist), `missing dist mirror ${distRelative}`);
  const sourceText = fs.readFileSync(source, "utf8");
  const distText = fs.readFileSync(dist, "utf8");
  assert.equal(distText, sourceText, `dist mirror differs: ${distRelative}`);
  checks.push({ case: `mirror: ${sourceRelative}`, status: "pass" });
}

function expectBadStandaloneYdlFails() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "standalone-ydl-shared-gate-"));
  const badList = path.join(tmpDir, "bad-standalone-list.json");
  const layoutId = "2074431339150327819";
  fs.writeFileSync(badList, JSON.stringify({
    Item: {
      ListModel: {
        TenantID: "1697103066096734208",
        AppID: 41,
        ListID: "2074431339146133506",
        ListSetID: "2074431339146133507",
        Title: "Bad Standalone List",
        Status: 1,
        Type: 1,
        ListType: 1,
        LayoutView: JSON.stringify({
          add: layoutId,
          edit: layoutId,
          view: layoutId,
          opentype: { add: "modal", edit: "modal", view: "slide" },
          modalsize: { add: 2, edit: 2, view: 2 },
        }),
      },
      Defs: [
        {
          FieldID: "2074431339146133508",
          ListID: "2074431339146133506",
          DisplayName: "Name",
          FieldName: "Title",
          InternalName: "Title",
          FieldType: "Text",
          Type: "input",
          IsSystem: true,
          IsIndex: true,
          FieldIndex: 0,
          Rules: "{}",
        },
        {
          FieldID: "2074431339146133509",
          ListID: "2074431339146133506",
          DisplayName: "Description",
          FieldName: "Text1",
          InternalName: "Description",
          FieldType: "Text",
          Type: "input",
          IsSystem: false,
          IsIndex: false,
          FieldIndex: 1,
          Rules: "{}",
        },
      ],
      Layouts: [
        {
          LayoutID: layoutId,
          Title: "Event Planning Form",
          Type: 1,
          LayoutView: null,
          Ext2: JSON.stringify({ src: true }),
          IsItemPerm: false,
          LayoutInResources: [
            {
              ID: layoutId,
              RefId: layoutId,
              Resource: JSON.stringify({
                title: "Event Planning Form",
                attrs: { container: { padding: 0 } },
                filterVars: [],
                tempVars: [],
                ver: 1,
                children: [
                  {
                    type: "container",
                    label: "Container",
                    children: [
                      { type: "input", label: "Name", binding: "Title", field: "Title" },
                      { type: "input", label: "Description", binding: "Text1", field: "Text1" },
                    ],
                  },
                ],
              }),
            },
          ],
        },
      ],
      ListDatas: {},
    },
  }, null, 2));

  let stdout = "";
  let failed = false;
  try {
    stdout = execFileSync(process.execPath, [
      path.join(ROOT, "validate-ydl-list.js"),
      badList,
      "--mode",
      "generator",
      "--stage",
      "final",
    ], { encoding: "utf8" });
  } catch (error) {
    failed = true;
    stdout = error.stdout || "";
  }
  assert.equal(failed, true, "bad standalone .ydl fixture must fail final generator validation");
  const report = JSON.parse(stdout);
  const codes = new Set((report.errors || []).map((entry) => entry.code));
  for (const expected of [
    "STANDALONE_YDL_SHARED_GENERATION_BYPASSED",
    "UI_STANDARD_EDIT_ITEM_FORM_MISSING",
    "UI_STANDARD_VIEW_ITEM_FORM_MISSING",
    "DATA_LIST_FORM_FIELDS_WRAPPER_MISSING",
  ]) {
    assert.ok(codes.has(expected), `bad standalone .ydl fixture missing expected error ${expected}`);
  }
  checks.push({ case: "bad standalone .ydl shared-generation bypass fixture", status: "pass" });
}

function expectStandalonePlanTraceValidator() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "standalone-artifact-plan-trace-"));
  const cases = [
    {
      artifactType: "approval_form",
      name: "Equipment Purchase Approval",
      planFile: "approval-form-plan.md",
      traceFile: "approval-form-plan.trace.json",
      plan: [
        "# Equipment Purchase Approval",
        "",
        "Artifact Type: approval_form",
        "",
        "## Generation Contract",
        "Use the shared Approval Form Layouts v1.1 builder.",
        "",
        "## Shared Builder",
        "approval-form-layout-builder",
        "",
        "## Proof Boundary",
        "Standalone YWF only.",
      ].join("\n"),
      traceExtra: {
        approvalForm: {
          pages: [{ name: "Submission form", templateId: "approval-form-layout-submission-v1.1" }],
          layoutTemplates: ["approval-form-layout-submission-v1.1"],
          workflow: { planned: true },
        },
      },
    },
    {
      artifactType: "data_list",
      name: "Event Planning",
      planFile: "data-list-plan.md",
      traceFile: "data-list-plan.trace.json",
      plan: [
        "# Event Planning",
        "",
        "Artifact Type: data_list",
        "",
        "## Generation Contract",
        "Use the shared Data List schema, view, and form builders.",
        "",
        "## Shared Builder",
        "data-list-schema-and-form-builder",
        "",
        "## Proof Boundary",
        "Standalone YDL only.",
      ].join("\n"),
      traceExtra: {
        dataList: {
          fields: [{ displayName: "Date", fieldName: "Datetime1" }],
          views: [{ name: "Schedule Overview" }],
          forms: [{ name: "Edit Item", templateId: "data_list_form_layout_new_edit_v1_1" }],
        },
      },
    },
    {
      artifactType: "dashboard",
      name: "Doctor Operations Dashboard",
      planFile: "dashboard-plan.md",
      traceFile: "dashboard-plan.trace.json",
      plan: [
        "# Doctor Operations Dashboard",
        "",
        "Artifact Type: dashboard",
        "",
        "## Generation Contract",
        "Use the shared Dashboard Page Layouts and Collection builders.",
        "",
        "## Shared Builder",
        "dashboard-page-layout-builder",
        "",
        "## Proof Boundary",
        "Standalone YDP only.",
      ].join("\n"),
      traceExtra: {
        dashboard: {
          pageLayoutTemplateId: "dashboard-page-layouts-v1.1",
          sections: [{ name: "Registry Queue", templateId: "collection_control_grid_table" }],
        },
      },
    },
  ];

  for (const testCase of cases) {
    const planPath = path.join(tmpDir, testCase.planFile);
    fs.writeFileSync(planPath, testCase.plan);
    const sha256 = cryptoHash(planPath);
    const trace = {
      artifactType: testCase.artifactType,
      name: testCase.name,
      plan: { path: planPath, sha256 },
      sharedBuilder: { required: true, builderFamily: `${testCase.artifactType}-shared-builder` },
      validators: ["validate-standalone-artifact-plan-trace.mjs"],
      conformance: {
        planToActualRequired: true,
        requiredChecks: ["template selection", "field/control mapping"],
      },
      ...testCase.traceExtra,
    };
    const tracePath = path.join(tmpDir, testCase.traceFile);
    fs.writeFileSync(tracePath, JSON.stringify(trace, null, 2));
    const stdout = execFileSync(process.execPath, [
      path.join(ROOT, "scripts/validate-standalone-artifact-plan-trace.mjs"),
      "--plan",
      planPath,
      "--trace",
      tracePath,
    ], { encoding: "utf8" });
    const report = JSON.parse(stdout);
    assert.equal(report.ok, true, `${testCase.artifactType} standalone plan/trace should pass`);
  }

  const badPlanPath = path.join(tmpDir, "bad-dashboard-plan.md");
  const badTracePath = path.join(tmpDir, "bad-dashboard-plan.trace.json");
  fs.writeFileSync(badPlanPath, [
    "# Bad Dashboard",
    "Artifact Type: dashboard",
    "## Generation Contract",
    "Incomplete plan.",
  ].join("\n"));
  fs.writeFileSync(badTracePath, JSON.stringify({
    artifactType: "dashboard",
    name: "Bad Dashboard",
    plan: { path: badPlanPath },
    validators: [],
    dashboard: { pageLayoutTemplateId: "", sections: [] },
  }, null, 2));
  let failed = false;
  let stdout = "";
  try {
    stdout = execFileSync(process.execPath, [
      path.join(ROOT, "scripts/validate-standalone-artifact-plan-trace.mjs"),
      "--plan",
      badPlanPath,
      "--trace",
      badTracePath,
    ], { encoding: "utf8" });
  } catch (error) {
    failed = true;
    stdout = error.stdout || "";
  }
  assert.equal(failed, true, "bad standalone artifact plan/trace fixture must fail");
  const report = JSON.parse(stdout);
  const codes = new Set((report.errors || []).map((entry) => entry.code));
  for (const expected of [
    "STANDALONE_ARTIFACT_SHARED_BUILDER_MISSING",
    "STANDALONE_ARTIFACT_VALIDATORS_MISSING",
    "STANDALONE_ARTIFACT_CONFORMANCE_MISSING",
    "STANDALONE_YDP_TRACE_PAGE_LAYOUT_MISSING",
    "STANDALONE_YDP_TRACE_SECTIONS_MISSING",
  ]) {
    assert.ok(codes.has(expected), `bad standalone artifact fixture missing expected error ${expected}`);
  }

  checks.push({ case: "standalone artifact plan/trace validator", status: "pass" });
}

function cryptoHash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
