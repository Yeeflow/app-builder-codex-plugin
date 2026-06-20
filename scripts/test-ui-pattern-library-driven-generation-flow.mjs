#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-ui-pattern-flow-"));
const selectionValidator = path.join(ROOT, "scripts/validate-ui-pattern-selection.mjs");
const blueprintValidator = path.join(ROOT, "scripts/validate-blueprint-ui-pattern-conformance.mjs");

expectSelectionPass("valid dashboard pattern selection", {
  surfaces: [
    surface({
      surfaceId: "dashboard-home",
      surfaceType: "Dashboard page",
      templateId: "kpi_card_row",
      patternProofStatus: "export-proven",
    }),
  ],
});

expectSelectionFail(
  "unknown templateId fails",
  { surfaces: [surface({ templateId: "made_up_template", readyForResourceGeneration: true })] },
  "UI_PATTERN_TEMPLATE_ID_UNKNOWN",
);

expectSelectionFail(
  "dashboard KPI template cannot be New/Edit form body",
  { surfaces: [surface({ surfaceType: "Data List New/Edit form", templateId: "kpi_card_row", readyForResourceGeneration: true })] },
  "UI_PATTERN_DASHBOARD_TEMPLATE_USED_AS_FORM_BODY",
);

expectSelectionFail(
  "HTML-only controls fail pattern selection",
  { surfaces: [surface({ controls: [{ type: "div" }] })] },
  "UI_PATTERN_HTML_ONLY_CONTROL_FORBIDDEN",
);

expectSelectionFail(
  "bad proof status fails",
  { surfaces: [surface({ patternProofStatus: "looks-good" })] },
  "UI_PATTERN_PROOF_STATUS_INVALID",
);

expectBlueprintPass("valid New/Edit sectioned form blueprint", {
  surfaces: [newEditBlueprint()],
});

expectBlueprintPass("valid dashboard KPI blueprint", {
  surfaces: [dashboardBlueprint()],
});

expectBlueprintPass("valid related records blueprint with collection template", {
  surfaces: [relatedRecordsBlueprint()],
});

expectBlueprintFail(
  "missing required child controls fail",
  { surfaces: [newEditBlueprint({ controls: [{ id: "form-shell", type: "container" }] })] },
  "BLUEPRINT_UI_PATTERN_REQUIRED_CHILD_CONTROL_MISSING",
);

expectBlueprintFail(
  "missing data binding fails",
  { surfaces: [dashboardBlueprint({ dataBindings: [], deferredDataBindings: [] })] },
  "BLUEPRINT_UI_PATTERN_REQUIRED_BINDING_MISSING",
);

expectBlueprintPass("explicitly deferred required binding is accepted but preserved", {
  surfaces: [dashboardBlueprint({ dataBindings: [], deferredDataBindings: ["summary_control_source_list", "summary_ext_binding", "summary_save_var", "dashboard_temp_var", "visible_text_temp_var_binding"] })],
});

expectBlueprintFail(
  "HTML-only blueprint control fails",
  { surfaces: [newEditBlueprint({ controls: [...newEditBlueprint().controls, { id: "visual-div", type: "div" }] })] },
  "BLUEPRINT_UI_PATTERN_HTML_ONLY_CONTROL",
);

expectBlueprintFail(
  "readyForResourceGeneration true is blocked by failed conformance",
  { surfaces: [newEditBlueprint({ templateId: "related_records_section", readyForResourceGeneration: true })] },
  "BLUEPRINT_UI_PATTERN_READY_FOR_RESOURCE_GENERATION_BLOCKED",
);

console.log("UI pattern library driven generation flow tests passed");

function surface(overrides = {}) {
  return {
    surfaceId: "contract-new-edit",
    surfaceName: "Contract New/Edit",
    surfaceType: "Data List New/Edit form",
    templateId: "sectioned_new_edit_form",
    patternProofStatus: "export-proven",
    readyForResourceGeneration: false,
    controls: [{ type: "container" }, { type: "grid" }, { type: "field" }, { type: "button" }],
    ...overrides,
  };
}

function newEditBlueprint(overrides = {}) {
  return {
    surfaceId: "contract-new-edit",
    surfaceName: "Contract New/Edit",
    surfaceType: "Data List New/Edit form",
    templateId: "sectioned_new_edit_form",
    patternProofStatus: "export-proven",
    readyForResourceGeneration: true,
    fields: ["Contract title", "Start date", "End date"],
    dataBindings: ["Contracts", "host_list_fields", "Contract title", "Start date", "End date"],
    actions: ["Save", "Cancel", "active_buttons_require_binding"],
    controls: [
      {
        id: "form_shell",
        type: "container",
        role: "form_section",
        nv_label: "Contract form section",
        children: [
          { id: "form_grid", type: "grid", role: "field_grid" },
          { id: "section_title", type: "text", role: "section_title" },
          { id: "contract_title", type: "field", role: "field_control", fieldName: "Contract title" },
          { id: "start_date", type: "field", role: "field_control", fieldName: "Start date" },
          { id: "end_date", type: "field", role: "field_control", fieldName: "End date" },
          { id: "save_action", type: "button", role: "action_area", actionId: "Save", actionType: "save-record" },
          { id: "cancel_action", type: "button", role: "action_area", actionId: "Cancel", actionType: "cancel" },
        ],
      },
    ],
    ...overrides,
  };
}

function dashboardBlueprint(overrides = {}) {
  return {
    surfaceId: "dashboard-home",
    surfaceName: "Executive Dashboard",
    surfaceType: "Dashboard page",
    templateId: "kpi_card_row",
    patternProofStatus: "export-proven",
    readyForResourceGeneration: true,
    dataBindings: ["summary_control_source_list", "summary_ext_binding", "summary_save_var", "dashboard_temp_var", "visible_text_temp_var_binding"],
    actions: [],
    controls: [
      {
        id: "kpi_row",
        type: "container",
        role: "kpi_card_row",
        nv_label: "KPI card row",
        children: [
          { id: "kpi_grid", type: "grid", role: "grid_row" },
          { id: "open_contracts_card", type: "container", role: "kpi_card" },
          { id: "open_contracts_label", type: "text", role: "kpi_label" },
          { id: "open_contracts_summary", type: "summary", role: "kpi_value", summaryBinding: "summary_control_source_list" },
          { id: "open_contracts_context", type: "text", role: "kpi_context", tempVar: "dashboard_temp_var" },
        ],
      },
    ],
    ...overrides,
  };
}

function relatedRecordsBlueprint(overrides = {}) {
  return {
    surfaceId: "contract-detail-related-docs",
    surfaceName: "Related Documents",
    surfaceType: "related-record section",
    templateId: "collection_control_grid_table",
    patternProofStatus: "export-proven",
    readyForResourceGeneration: true,
    fields: ["Document name", "Document type", "Status"],
    dataBindings: ["Contract Documents", "Current Contract ID", "Document name", "Document type", "Status"],
    actions: ["Open document", "active_buttons_require_binding"],
    controls: [
      {
        id: "related_docs",
        type: "collection",
        role: "collection_control_grid_table",
        sourceList: "Contract Documents",
        parentBinding: "Current Contract ID",
        children: [
          { id: "doc_name", type: "dynamic-field", role: "item_template", fieldName: "Document name" },
          { id: "doc_type", type: "dynamic-field", role: "item_template", fieldName: "Document type" },
          { id: "doc_status", type: "dynamic-field", role: "item_template", fieldName: "Status" },
          { id: "open_doc", type: "button", role: "item_action", actionId: "Open document" },
        ],
      },
    ],
    ...overrides,
  };
}

function expectSelectionPass(label, artifact) {
  const result = run([selectionValidator, "--selection", writeJson(artifact)]);
  assert.equal(result.status, 0, `${label}\n${result.stdout}\n${result.stderr}`);
}

function expectSelectionFail(label, artifact, code) {
  const result = run([selectionValidator, "--selection", writeJson(artifact)]);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(result.stdout, new RegExp(code), `${label} should report ${code}\n${result.stdout}`);
}

function expectBlueprintPass(label, artifact) {
  const result = run([blueprintValidator, "--blueprint", writeJson(artifact)]);
  assert.equal(result.status, 0, `${label}\n${result.stdout}\n${result.stderr}`);
}

function expectBlueprintFail(label, artifact, code) {
  const result = run([blueprintValidator, "--blueprint", writeJson(artifact)]);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(result.stdout, new RegExp(code), `${label} should report ${code}\n${result.stdout}`);
}

function writeJson(value) {
  const file = path.join(tempRoot, `${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function run(command) {
  return spawnSync(process.execPath, command, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 10,
  });
}
