#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { inspectYeeflowControlConfigurations } from "./inspect-yeeflow-control-configurations.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const normalizedPath = path.join(ROOT, "docs", "reference", "yeeflow-control-configurations.normalized.json");
const extensionsPath = path.join(ROOT, "docs", "reference", "yeeflow-control-property-extensions.json");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-control-property-kb-"));

try {
  testRegistryShapeAndKeyControls();
  testContainerCatalogPaths();
  testRadioFilterCatalogPaths();
  testCollectionCatalogPaths();
  testSummaryCatalogPaths();
  testCamelCaseAliasFails();
  testStaticTextFilterClaimFails();
  testUnknownPropertyFails();
  testExtensionOnlyWarns();
  testNeedsStudyStrictFails();
  testExportProvenExtensionPasses();
  testWrongControlFails();
  testCliSmoke();
  testSourceDistMirrors();
  console.log("Yeeflow control property knowledge base tests passed");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

function testRegistryShapeAndKeyControls() {
  const registry = readJson(normalizedPath);
  assert.equal(registry.rawCatalogCommitted, false, "raw product catalog must not be committed");
  assert.ok(registry.controlCount >= 90, `expected 90+ controls, found ${registry.controlCount}`);
  for (const controlType of [
    "container",
    "radio-filter",
    "select-filter",
    "date-filter",
    "range-filter",
    "hierarchy-filter",
    "sorting-filters",
    "apply-button",
    "remove-filters",
    "action_button",
    "icon",
    "heading",
    "flex_grid",
    "data-list",
    "collection",
    "summary",
    "bar-chart",
    "line-chart",
    "pie-chart",
  ]) {
    assert.ok(registry.controls[controlType], `expected key control ${controlType}`);
  }
}

function testContainerCatalogPaths() {
  assertControlHas("container", [
    "attrs.style.widthtype",
    "attrs.style.align_items",
    "attrs.style.justify_content",
    "attrs.style.gap",
    "attrs.content.htmltag",
  ]);
}

function testRadioFilterCatalogPaths() {
  assertControlHas("radio-filter", [
    "binding",
    "attrs.displayStyle",
    "attrs.data.list.ListID",
    "attrs.data.filter",
    "attrs.display_f",
    "attrs.value_f",
  ]);
}

function testCollectionCatalogPaths() {
  assertControlHas("collection", [
    "attrs.data.list.AppID",
    "attrs.data.list.ListID",
    "attrs.data.list.ListSetID",
    "attrs.data.filter",
    "children",
    "attrs.layout.col",
  ]);
}

function testSummaryCatalogPaths() {
  assertControlHas("summary", [
    "exts.AppID",
    "exts.ListID",
    "exts.ListSetID",
    "exts.settings.Conditions",
    "exts.settings.values",
    "attrs.save_var",
  ]);
}

function testCamelCaseAliasFails() {
  const spec = writeSpec("camel-alias.json", {
    controls: [
      {
        controlType: "container",
        properties: {
          "attrs.style.alignItems": "center",
        },
      },
    ],
  });
  expectFail("camelCase aliases fail", inspectSpec(spec), "CONTROL_PROPERTY_PATH_ALIAS");
}

function testStaticTextFilterClaimFails() {
  const spec = writeSpec("static-text-filter.json", {
    controls: [
      {
        controlType: "text",
        claims: ["filter behavior"],
        properties: {
          label: "Region",
        },
      },
    ],
  });
  expectFail("static Text cannot claim filter behavior", inspectSpec(spec), "CONTROL_PROPERTY_WRONG_CONTROL");
}

function testUnknownPropertyFails() {
  const spec = writeSpec("unknown-property.json", {
    controls: [
      {
        controlType: "container",
        properties: {
          "attrs.style.magic_gap_formula": "12px",
        },
      },
    ],
  });
  expectFail("unknown property fails", inspectSpec(spec), "CONTROL_PROPERTY_UNKNOWN");
}

function testExtensionOnlyWarns() {
  const extensions = writeExtensions("extensions-warning.json", [
    extension("container", "attrs.style.study_only_gap_mode", "human_reviewed", "human_reviewed"),
  ]);
  const spec = writeSpec("extension-warning.json", {
    controls: [
      {
        controlType: "container",
        properties: {
          "attrs.style.study_only_gap_mode": "compact",
        },
      },
    ],
  });
  const report = inspectSpec(spec, extensions);
  assert.equal(report.status, "warning", "human-reviewed extension-only property should warn");
  assertCode(report, "CONTROL_PROPERTY_EXTENSION_ONLY");
}

function testNeedsStudyStrictFails() {
  const extensions = writeExtensions("extensions-needs-study.json", [
    extension("container", "attrs.style.future_card_shadow", "needs_study", "needs_study"),
  ]);
  const spec = writeSpec("needs-study.json", {
    controls: [
      {
        controlType: "container",
        properties: {
          "attrs.style.future_card_shadow": "soft",
        },
      },
    ],
  });
  const report = inspectSpec(spec, extensions, { strict: true });
  assert.equal(report.status, "warning", "needs_study is a warning before strict exit handling");
  assertCode(report, "CONTROL_PROPERTY_NEEDS_STUDY");
  const cli = spawnSync(process.execPath, [
    path.join(ROOT, "scripts", "inspect-yeeflow-control-configurations.mjs"),
    "--normalized",
    normalizedPath,
    "--extensions",
    extensions,
    "--validate-control-spec",
    spec,
    "--strict",
  ], { cwd: ROOT, encoding: "utf8" });
  assert.notEqual(cli.status, 0, "strict mode must exit nonzero for needs_study warning");
}

function testExportProvenExtensionPasses() {
  const extensions = writeExtensions("extensions-export-proven.json", [
    extension("container", "attrs.style.export_proven_card_accent", "export_proven", "export_proven"),
  ]);
  const spec = writeSpec("export-proven.json", {
    controls: [
      {
        controlType: "container",
        properties: {
          "attrs.style.export_proven_card_accent": "teal",
        },
      },
    ],
  });
  const report = inspectSpec(spec, extensions);
  assert.equal(report.status, "pass", "export_proven extension-only property should pass with an info finding");
  assertCode(report, "CONTROL_PROPERTY_EXTENSION_ONLY");
}

function testWrongControlFails() {
  const spec = writeSpec("wrong-control.json", {
    controls: [
      {
        controlType: "container",
        properties: {
          "exts.settings.values": [],
        },
      },
    ],
  });
  expectFail("summary property under container fails", inspectSpec(spec), "CONTROL_PROPERTY_WRONG_CONTROL");
}

function testCliSmoke() {
  const list = spawnSync(process.execPath, [
    path.join(ROOT, "scripts", "inspect-yeeflow-control-configurations.mjs"),
    "--normalized",
    normalizedPath,
    "--list-controls",
  ], { cwd: ROOT, encoding: "utf8" });
  assert.equal(list.status, 0, list.stderr || list.stdout);
  assert.match(list.stdout, /container/);
  assert.match(list.stdout, /radio-filter/);

  const inspectContainer = spawnSync(process.execPath, [
    path.join(ROOT, "scripts", "inspect-yeeflow-control-configurations.mjs"),
    "--normalized",
    normalizedPath,
    "--control",
    "container",
  ], { cwd: ROOT, encoding: "utf8" });
  assert.equal(inspectContainer.status, 0, inspectContainer.stderr || inspectContainer.stdout);
  assert.match(inspectContainer.stdout, /attrs\.style\.widthtype/);

  const validSpec = writeSpec("valid-cli.json", {
    controls: [
      {
        controlType: "container",
        properties: {
          "attrs.style.widthtype": "full",
          "attrs.style.align_items": "center",
        },
      },
      {
        controlType: "radio-filter",
        properties: {
          binding: "region_filter",
          "attrs.displayStyle": "dropdown",
        },
      },
    ],
  });
  const valid = spawnSync(process.execPath, [
    path.join(ROOT, "scripts", "inspect-yeeflow-control-configurations.mjs"),
    "--normalized",
    normalizedPath,
    "--extensions",
    extensionsPath,
    "--validate-control-spec",
    validSpec,
  ], { cwd: ROOT, encoding: "utf8" });
  assert.equal(valid.status, 0, valid.stderr || valid.stdout);

  const invalidSpec = writeSpec("invalid-cli.json", {
    controls: [
      {
        controlType: "container",
        properties: {
          "attrs.style.alignItems": "center",
        },
      },
    ],
  });
  const invalid = spawnSync(process.execPath, [
    path.join(ROOT, "scripts", "inspect-yeeflow-control-configurations.mjs"),
    "--normalized",
    normalizedPath,
    "--validate-control-spec",
    invalidSpec,
  ], { cwd: ROOT, encoding: "utf8" });
  assert.notEqual(invalid.status, 0, "invalid alias spec must fail CLI smoke");
  assert.match(invalid.stdout, /CONTROL_PROPERTY_PATH_ALIAS/);
}

function testSourceDistMirrors() {
  for (const sourcePath of [
    "scripts/inspect-yeeflow-control-configurations.mjs",
    "scripts/test-yeeflow-control-property-knowledge-base.mjs",
    "docs/reference/yeeflow-control-configurations.normalized.json",
    "docs/reference/yeeflow-control-property-extensions.json",
    "docs/standards/yeeflow-control-property-knowledge-base.md",
  ]) {
    const distPath = path.join("dist", "yeeflow-app-builder-plugin", sourcePath);
    assert.equal(fs.existsSync(path.join(ROOT, sourcePath)), true, `${sourcePath} exists`);
    assert.equal(fs.existsSync(path.join(ROOT, distPath)), true, `${distPath} exists`);
    assert.equal(fs.readFileSync(path.join(ROOT, distPath), "utf8"), fs.readFileSync(path.join(ROOT, sourcePath), "utf8"), `${distPath} mirrors ${sourcePath}`);
  }
}

function assertControlHas(controlType, propertyPaths) {
  const registry = readJson(normalizedPath);
  const properties = registry.controls[controlType]?.properties || {};
  for (const propertyPath of propertyPaths) {
    assert.ok(properties[propertyPath], `${controlType} should include ${propertyPath}`);
    assert.equal(properties[propertyPath].source, "product_catalog", `${propertyPath} should be product-catalog backed`);
  }
}

function inspectSpec(specPath, extensionPath = extensionsPath, options = {}) {
  return inspectYeeflowControlConfigurations({
    normalized: normalizedPath,
    extensions: extensionPath,
    validateControlSpec: specPath,
    ...options,
  });
}

function writeSpec(fileName, value) {
  const filePath = path.join(tmp, fileName);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
  return filePath;
}

function writeExtensions(fileName, extensions) {
  const filePath = path.join(tmp, fileName);
  fs.writeFileSync(filePath, `${JSON.stringify({ schemaVersion: 1, extensions }, null, 2)}\n`);
  return filePath;
}

function extension(controlType, propertyPath, confidence, status) {
  return {
    controlType,
    propertyPath,
    valueType: "string",
    allowDevice: false,
    source: "synthetic_redacted_test",
    confidence,
    evidence: ["synthetic fixture"],
    status,
    notes: "Synthetic test-only extension.",
  };
}

function expectFail(label, report, code) {
  assert.equal(report.status, "fail", `${label} should fail: ${JSON.stringify(report.findings, null, 2)}`);
  assertCode(report, code);
}

function assertCode(report, code) {
  assert.ok(report.findings.some((finding) => finding.code === code), `expected ${code} in ${JSON.stringify(report.findings, null, 2)}`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
