#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function page(children = [], attrs = {}) {
  return { attrs: { common: { padding: { left: 24, right: 24 } }, ...attrs }, children };
}

function control(type, attrs = {}, children = [], label = "") {
  return { type, label: label || type, attrs, children };
}

function resource(obj) {
  return [{ Resource: JSON.stringify(obj) }];
}

function layout(title, pageObj, extra = {}) {
  return {
    Title: title,
    Type: 103,
    LayoutID: `layout-${title}`,
    LayoutView: null,
    Ext2: "{\"src\":true}",
    LayoutInResources: resource(pageObj),
    ...extra,
  };
}

function formLayout(title, pageObj) {
  return {
    Title: title,
    Type: 1,
    LayoutID: `form-${title}`,
    LayoutInResources: resource(pageObj),
  };
}

function basePackage() {
  return {
    Item: {
      ListModel: { Title: "Vendor Onboarding & Compliance Management", ListID: "root" },
      Defs: [],
      Layouts: [
        layout("Vendor Management Dashboard", page([
          control("container", { style: { border: "1px solid #e5e7eb", radius: 8 } }, [
            control("heading", { headc: { title: { value: "Vendor Management Dashboard" } } }),
            control("button", { text: "Button" }),
            control("alert", { title: "Alert", description: "Here is the description" }),
            control("kanban", { actions: [] }, []),
          ]),
        ])),
        layout("Compliance Review Workspace", page([
          control("container", { style: { border: "1px solid #e5e7eb", radius: 8 } }, [
            control("heading", { headc: { title: { value: "Compliance Review Workspace" } } }),
            control("collection", { actions: [] }, []),
          ]),
        ])),
      ],
    },
    Childs: [
      {
        ListModel: { Title: "Vendors", ListID: "vendors" },
        Defs: [
          { FieldName: "Text0", InternalName: "VendorName", DisplayName: "Vendor Name" },
          { FieldName: "Text1", InternalName: "Status", DisplayName: "Status" },
        ],
        Layouts: [
          formLayout("Vendor Detail View Page", page([control("heading"), control("field", { field: "Text0" })])),
          formLayout("New Vendor Request Form", page([control("heading")])),
        ],
      },
    ],
  };
}

function writeCase(dir, name, pkg) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(pkg)}\n`);
  return file;
}

function writeSpec(dir) {
  const file = path.join(dir, "vendor-spec.md");
  fs.writeFileSync(file, [
    "# Vendor Onboarding & Compliance Management UI Implementation Spec",
    "",
    "Approved mockups include Vendor Management Dashboard, Vendor Detail View Page, New Vendor Request Form, Compliance Review Workspace, and Vendor Print Page.",
    "The design requires KPI cards, alert boxes, Kanban, Collection, Data table, buttons/actions, and print page.",
  ].join("\n"));
  return file;
}

function runInspector(file, spec) {
  const result = spawnSync(process.execPath, [
    "scripts/inspect-generated-app-quality.mjs",
    "--package",
    file,
    "--spec",
    spec,
    "--strict-visual-app-quality",
  ], { encoding: "utf8", maxBuffer: 24 * 1024 * 1024 });
  return result.stdout + result.stderr;
}

function expectCode(name, output, code) {
  if (!output.includes(code)) throw new Error(`${name} did not report ${code}.`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "strict-visual-app-quality-"));
const results = [];

try {
  const spec = writeSpec(tempDir);

  const blankForm = basePackage();
  blankForm.Childs[0].Layouts[0].LayoutInResources = [];
  expectCode("blank custom form", runInspector(writeCase(tempDir, "blank-form", blankForm), spec), "CUSTOM_FORM_BLANK");
  results.push({ case: "blank custom form fails", expected: "CUSTOM_FORM_BLANK", status: "pass" });

  const missingPadding = basePackage();
  missingPadding.Item.Layouts[0].LayoutInResources = resource({ children: [control("heading")] });
  expectCode("dashboard without padding", runInspector(writeCase(tempDir, "missing-padding", missingPadding), spec), "DASHBOARD_PADDING_MISSING");
  results.push({ case: "dashboard without padding fails", expected: "DASHBOARD_PADDING_MISSING", status: "pass" });

  const defaultAlert = basePackage();
  expectCode("default alert content", runInspector(writeCase(tempDir, "default-alert", defaultAlert), spec), "DASHBOARD_DEFAULT_ALERT_CONTENT");
  results.push({ case: "default alert content fails", expected: "DASHBOARD_DEFAULT_ALERT_CONTENT", status: "pass" });

  expectCode("button without action", runInspector(writeCase(tempDir, "button-action", basePackage()), spec), "BUTTON_ACTION_MISSING");
  results.push({ case: "button without action fails", expected: "BUTTON_ACTION_MISSING", status: "pass" });

  expectCode("empty Kanban template", runInspector(writeCase(tempDir, "empty-kanban", basePackage()), spec), "KANBAN_ITEM_TEMPLATE_EMPTY");
  results.push({ case: "Kanban item template with no dynamic fields fails", expected: "KANBAN_ITEM_TEMPLATE_EMPTY", status: "pass" });

  expectCode("empty Collection template", runInspector(writeCase(tempDir, "empty-collection", basePackage()), spec), "COLLECTION_ITEM_TEMPLATE_EMPTY");
  results.push({ case: "Collection item template with no dynamic fields fails", expected: "COLLECTION_ITEM_TEMPLATE_EMPTY", status: "pass" });

  expectCode("missing expected print page", runInspector(writeCase(tempDir, "missing-print", basePackage()), spec), "CUSTOM_PRINT_PAGE_MISSING");
  results.push({ case: "missing print page fails", expected: "CUSTOM_PRINT_PAGE_MISSING", status: "pass" });

  const onlyTwoPages = basePackage();
  onlyTwoPages.Item.Layouts = onlyTwoPages.Item.Layouts.slice(0, 1);
  expectCode("spec expects five pages", runInspector(writeCase(tempDir, "two-pages", onlyTwoPages), spec), "SPEC_PAGE_UNDERBUILT");
  results.push({ case: "spec expects five pages but package has only two pages fails", expected: "SPEC_PAGE_UNDERBUILT", status: "pass" });

  const underbuiltWithGoodTable = basePackage();
  underbuiltWithGoodTable.Item.Layouts[0].LayoutInResources = resource(page([
    control("data-list", {
      data: { list: { AppID: 41, ListID: "vendors", Type: 1, Title: "Vendors", ListSetID: "root" } },
      listarr: [{ Field: "Text0", FieldName: "Vendor Name" }, { Field: "Text1", FieldName: "Status" }],
    }),
  ]));
  expectCode("good table but underbuilt", runInspector(writeCase(tempDir, "good-table-underbuilt", underbuiltWithGoodTable), spec), "DASHBOARD_LAYOUT_TOO_PLAIN");
  results.push({ case: "good Data table still fails strict visual quality when underbuilt", expected: "DASHBOARD_LAYOUT_TOO_PLAIN", status: "pass" });

  console.log(JSON.stringify({ status: "pass", cases: results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
