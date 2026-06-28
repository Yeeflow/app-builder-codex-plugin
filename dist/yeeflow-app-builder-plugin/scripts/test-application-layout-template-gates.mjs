#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VALIDATOR = path.join(ROOT, "scripts/validate-application-layout-template.mjs");
const MATERIALIZER = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const TEMPLATE = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/application-layout-sidebar-workspace-1.template.json"), "utf8"));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "application-layout-template-"));
const cases = [];

try {
  expectPass("registry and template validate", [VALIDATOR, "--registry"]);
  cases.push("registry/template validation passes");

  const validPackage = writePackage("valid.yapk", buildDecoded());
  expectPass("valid package carries sidebar workspace application layout", [VALIDATOR, "--package", validPackage]);
  cases.push("valid generated package carries application layout attrs and FontAwesome navigation icons");

  const missingLayoutView = writePackage("missing-layoutview.yapk", { ListSet: { ListID: "1001" } });
  expectCode("missing LayoutView fails", [VALIDATOR, "--package", missingLayoutView], "APPLICATION_LAYOUT_ROOT_LAYOUTVIEW_MISSING");

  const wrongHeight = buildDecoded();
  const wrongHeightLayout = JSON.parse(wrongHeight.ListSet.LayoutView);
  wrongHeightLayout.attrs.appearance.height = 54;
  wrongHeight.ListSet.LayoutView = JSON.stringify(wrongHeightLayout);
  expectCode("wrong header height fails", [VALIDATOR, "--package", writePackage("wrong-height.yapk", wrongHeight)], "APPLICATION_LAYOUT_APPEARANCE_MISMATCH");

  const wrongPosition = buildDecoded();
  const wrongPositionLayout = JSON.parse(wrongPosition.ListSet.LayoutView);
  wrongPositionLayout.attrs["navigator-menu"].position = "default";
  wrongPosition.ListSet.LayoutView = JSON.stringify(wrongPositionLayout);
  expectCode("wrong nav position fails", [VALIDATOR, "--package", writePackage("wrong-position.yapk", wrongPosition)], "APPLICATION_LAYOUT_NAVIGATOR_MENU_MISMATCH");

  const missingIcon = buildDecoded();
  const missingIconLayout = JSON.parse(missingIcon.ListSet.LayoutView);
  delete missingIconLayout.sort[0].list[0].Icon;
  missingIcon.ListSet.LayoutView = JSON.stringify(missingIconLayout);
  expectCode("visible item missing icon fails", [VALIDATOR, "--package", writePackage("missing-icon.yapk", missingIcon)], "APPLICATION_LAYOUT_NAV_ICON_MISSING");

  const nonFontAwesomeGroup = buildDecoded();
  const nonFontAwesomeLayout = JSON.parse(nonFontAwesomeGroup.ListSet.LayoutView);
  nonFontAwesomeLayout.sort[0].Icon = "folder";
  nonFontAwesomeGroup.ListSet.LayoutView = JSON.stringify(nonFontAwesomeLayout);
  expectCode("visible group non-FontAwesome icon fails", [VALIDATOR, "--package", writePackage("non-fa-group.yapk", nonFontAwesomeGroup)], "APPLICATION_LAYOUT_NAV_ICON_NOT_FONTAWESOME");

  const hiddenProcessIcon = buildDecoded();
  const hiddenProcessLayout = JSON.parse(hiddenProcessIcon.ListSet.LayoutView);
  hiddenProcessLayout.sort.push({ Title: "Pending tasks", Type: "process", Icon: "wait-task", IsHidden: true });
  hiddenProcessIcon.ListSet.LayoutView = JSON.stringify(hiddenProcessLayout);
  expectPass("hidden process icon exception passes", [VALIDATOR, "--package", writePackage("hidden-process.yapk", hiddenProcessIcon)]);
  cases.push("hidden process/task icons may retain Yeeflow built-in icon names");

  const spec = path.join(tempDir, "functional-specification.md");
  const plan = path.join(tempDir, "yeeflow-app-plan.md");
  fs.writeFileSync(spec, ["# Functional Specification: Application Layout Smoke", "", "| Application Name | Application Layout Smoke |"].join("\n"));
  fs.writeFileSync(plan, [
    "# Yeeflow App Plan: Application Layout Smoke",
    "",
    "## Plan Status",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
    "",
    "## 15. Application Navigation Plan",
    "",
    "Application layout template: `application-layout-sidebar-workspace-1`.",
    "",
    "| Navigation Order | Group | Item | Yeeflow Resource Type | Target Resource | Visible | Icon | Notes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | Requests | Travel Requests | Data list | Travel Requests | Yes |  | Primary request data |",
  ].join("\n"));
  const materialized = expectPass("materializer emits application layout template", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", path.join(tempDir, "materialized"),
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ]);
  const materializerReport = JSON.parse(materialized.stdout);
  expectPass("materializer package passes application layout validator", [VALIDATOR, "--package", materializerReport.outputs.package]);
  const decoded = readDecodedPackage(materializerReport.outputs.package);
  const layout = JSON.parse(decoded.ListSet.LayoutView);
  assert.deepEqual(layout.attrs, TEMPLATE.requiredLayoutView.attrs, "materializer must emit template LayoutView attrs exactly");
  assert.ok(layout.sort.every((group) => /^fa-/.test(group.Icon || "")), "materializer groups must have FontAwesome icons");
  assert.ok(layout.sort.flatMap((group) => group.list || []).every((item) => /^fa-/.test(item.Icon || "")), "materializer items must have FontAwesome icons");
  cases.push("materializer output includes sidebar workspace application layout template");

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function buildDecoded() {
  return {
    ListSet: {
      ListID: "1001",
      Title: "Application Layout Smoke",
      LayoutView: JSON.stringify({
        sortVer: TEMPLATE.requiredLayoutView.sortVer,
        sort: [
          {
            ID: "2001",
            AppID: 41,
            ListSetID: "1001",
            Title: "Requests",
            Type: "classes",
            Icon: "fa-solid fa-folder",
            list: [
              {
                AppID: 41,
                Title: "Travel Requests",
                Type: 1,
                ListID: "3001",
                ListSetID: "1001",
                Icon: "fa-regular fa-table-list",
              },
              {
                AppID: 41,
                Title: "Operations Dashboard",
                Type: 103,
                ListID: "4001",
                LayoutID: "4001",
                ListSetID: "1001",
                Icon: "fa-solid fa-chart-pie",
              },
            ],
          },
        ],
        attrs: TEMPLATE.requiredLayoutView.attrs,
      }),
    },
  };
}

function writePackage(name, decoded) {
  const filePath = path.join(tempDir, name);
  const wrapper = {
    AppID: 41,
    TenantID: "1234567890123456",
    PackageID: "9000000000000001",
    ListID: decoded?.ListSet?.ListID || "1001",
    Sign: "",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
  };
  fs.writeFileSync(filePath, `${JSON.stringify(wrapper, null, 2)}\n`);
  return filePath;
}

function readDecodedPackage(packagePath) {
  const wrapper = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  return JSON.parse(zlib.brotliDecompressSync(Buffer.from(wrapper.Resource, "base64")).toString("utf8"));
}

function expectPass(label, args, options = {}) {
  const result = runNode(args, options);
  assert.equal(result.status, 0, `${label}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  return result;
}

function expectCode(label, args, code) {
  const result = runNode(args);
  assert.notEqual(result.status, 0, `${label} unexpectedly passed`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(code), `${label} did not emit ${code}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  return result;
}

function runNode(args, options = {}) {
  return spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: options.maxBuffer || 64 * 1024 * 1024,
  });
}
