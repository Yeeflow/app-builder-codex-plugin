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

function formLayout(title, pageObj, extra = {}) {
  return {
    Title: title,
    Type: 1,
    LayoutID: `form-${title}`,
    LayoutInResources: pageObj ? resource(pageObj) : [],
    ...extra,
  };
}

function basePackage() {
  return {
    Item: {
      ListModel: { Title: "Vendor Onboarding & Compliance Management", ListID: "root" },
      Defs: [],
      Layouts: [
        layout("Vendor Management Dashboard", page([
          control("container", { style: { border: "1px solid #e5e7eb", radius: 8, gap: 24 } }, [
            control("text", { text: "Vendor Management Dashboard Vendors" }, [], "Vendor Management Dashboard"),
            control("button", { text: "New Vendor Request", control_action: "open-new-vendor" }, [], "New Vendor Request"),
            control("data-list", { data: { list: { Title: "Vendors" } }, listarr: [{ Field: "Text0", FieldName: "Vendor Name" }] }, [], "Vendor Records"),
          ], "Header Card"),
        ])),
      ],
    },
    Childs: [
      {
        ListModel: { Title: "Vendors", ListID: "vendors" },
        Defs: [{ FieldName: "Text0", DisplayName: "Vendor Name" }],
        Layouts: [formLayout("Vendor Detail View Page", page([control("text", { text: "Vendor Detail View Page Vendor Name" }, [], "Vendor Detail View Page")]))],
      },
    ],
  };
}

function checklist(pageOverrides = {}, sectionOverrides = {}) {
  return {
    application: "Vendor Onboarding & Compliance Management",
    version: "test",
    pages: [
      {
        id: "vendor_management_dashboard",
        title: "Vendor Management Dashboard",
        type: "dashboard",
        required: true,
        ...pageOverrides,
        sections: [
          {
            id: "header_action_area",
            title: "Header/action area",
            status: "required",
            controls: ["container", "button"],
            dataSources: ["Vendors"],
            requiredFields: ["Vendor Name"],
            matchText: ["Vendor Management Dashboard"],
            layoutRules: ["safe_padding", "card_container"],
            actionBindings: ["New Vendor Request"],
            validationRules: ["section_exists", "no_placeholder_content"],
            ...sectionOverrides,
          },
        ],
      },
    ],
  };
}

function writeJson(dir, name, obj) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(obj, null, 2)}\n`);
  return file;
}

function runInspector(pkg, check) {
  const result = spawnSync(process.execPath, [
    "scripts/inspect-generated-app-quality.mjs",
    "--package",
    pkg,
    "--composition-checklist",
    check,
    "--strict-visual-app-quality",
  ], { encoding: "utf8", maxBuffer: 24 * 1024 * 1024 });
  try {
    return JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`Inspector did not return JSON: ${error.message}\n${result.stdout}\n${result.stderr}`);
  }
}

function compositionErrors(report) {
  return (report.findings || []).filter((finding) => finding.source === "composition-checklist" && finding.level === "error");
}

function expectCode(name, report, code) {
  if (!compositionErrors(report).some((finding) => finding.code === code)) {
    throw new Error(`${name} did not report ${code}. Composition findings: ${JSON.stringify(compositionErrors(report), null, 2)}`);
  }
}

function expectNoCompositionErrors(name, report) {
  const errors = compositionErrors(report);
  if (errors.length) throw new Error(`${name} reported composition errors: ${JSON.stringify(errors, null, 2)}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "composition-checklist-quality-"));
const results = [];

try {
  expectCode(
    "missing required page",
    runInspector(writeJson(tempDir, "missing-page-pkg", basePackage()), writeJson(tempDir, "missing-page-checklist", checklist({ title: "Missing Required Page" }))),
    "COMPOSITION_REQUIRED_PAGE_MISSING",
  );
  results.push({ case: "missing required page fails", expected: "COMPOSITION_REQUIRED_PAGE_MISSING", status: "pass" });

  expectCode(
    "missing required section",
    runInspector(writeJson(tempDir, "missing-section-pkg", basePackage()), writeJson(tempDir, "missing-section-checklist", checklist({}, { matchText: ["Not Rendered Section"] }))),
    "COMPOSITION_REQUIRED_SECTION_MISSING",
  );
  results.push({ case: "missing required section fails", expected: "COMPOSITION_REQUIRED_SECTION_MISSING", status: "pass" });

  const placeholderPackage = basePackage();
  placeholderPackage.Item.Layouts[0].LayoutInResources = resource(page([
    control("container", { style: { border: "1px solid #e5e7eb", radius: 8 }, text: "Vendor Management Dashboard Vendors Vendor Name Alert Here is the description" }, [
      control("button", { text: "New Vendor Request", control_action: "open-new-vendor" }, [], "New Vendor Request"),
    ], "Header Card"),
  ]));
  expectCode(
    "placeholder-only controls",
    runInspector(writeJson(tempDir, "placeholder-pkg", placeholderPackage), writeJson(tempDir, "placeholder-checklist", checklist())),
    "COMPOSITION_PLACEHOLDER_CONTENT",
  );
  results.push({ case: "section exists but controls are placeholder-only fails", expected: "COMPOSITION_PLACEHOLDER_CONTENT", status: "pass" });

  const noActionPackage = basePackage();
  noActionPackage.Item.Layouts[0].LayoutInResources = resource(page([
    control("container", { style: { border: "1px solid #e5e7eb", radius: 8 }, text: "Vendor Management Dashboard Vendors Vendor Name" }, [
      control("button", { text: "New Vendor Request" }, [], "New Vendor Request"),
    ], "Header Card"),
  ]));
  expectCode(
    "button without action",
    runInspector(writeJson(tempDir, "no-action-pkg", noActionPackage), writeJson(tempDir, "no-action-checklist", checklist())),
    "COMPOSITION_REQUIRED_ACTION_BINDING_MISSING",
  );
  results.push({ case: "button without action fails", expected: "COMPOSITION_REQUIRED_ACTION_BINDING_MISSING", status: "pass" });

  const blankFormPackage = basePackage();
  blankFormPackage.Childs[0].Layouts = [formLayout("Vendor Detail View Page", null)];
  expectCode(
    "blank custom form",
    runInspector(
      writeJson(tempDir, "blank-form-pkg", blankFormPackage),
      writeJson(tempDir, "blank-form-checklist", {
        application: "Vendor Onboarding & Compliance Management",
        version: "test",
        pages: [{ id: "vendor_detail_view_page", title: "Vendor Detail View Page", type: "custom_view_form", required: true, sections: [{ id: "header", title: "Header", status: "required", controls: ["container"], matchText: ["Vendor Detail View Page"], layoutRules: ["safe_padding"] }] }],
      }),
    ),
    "COMPOSITION_CUSTOM_FORM_BLANK",
  );
  results.push({ case: "blank custom form fails", expected: "COMPOSITION_CUSTOM_FORM_BLANK", status: "pass" });

  const emptyKanbanPackage = basePackage();
  emptyKanbanPackage.Item.Layouts[0].LayoutInResources = resource(page([
    control("container", { style: { border: "1px solid #e5e7eb", radius: 8 }, text: "Vendor Management Dashboard Vendors Vendor Name Onboarding Status Board" }, [
      control("kanban", { data: { list: { Title: "Vendors" } }, actions: [] }, [], "Onboarding Status Board"),
      control("button", { text: "New Vendor Request", control_action: "open-new-vendor" }, [], "New Vendor Request"),
    ], "Header Card"),
  ]));
  expectCode(
    "Kanban item template without fields",
    runInspector(
      writeJson(tempDir, "empty-kanban-pkg", emptyKanbanPackage),
      writeJson(tempDir, "empty-kanban-checklist", checklist({}, {
        id: "onboarding_status_board",
        title: "Onboarding status board",
        controls: ["kanban"],
        matchText: ["Onboarding Status Board"],
        itemTemplate: { controls: ["kanban"], minDynamicFields: 3, requiredFields: ["Vendor Name"], requiresActions: true },
      })),
    ),
    "COMPOSITION_ITEM_TEMPLATE_TOO_MINIMAL",
  );
  results.push({ case: "Kanban item template without fields fails", expected: "COMPOSITION_ITEM_TEMPLATE_TOO_MINIMAL", status: "pass" });

  expectNoCompositionErrors(
    "valid simplified fixture",
    runInspector(writeJson(tempDir, "valid-pkg", basePackage()), writeJson(tempDir, "valid-checklist", checklist())),
  );
  results.push({ case: "valid simplified fixture passes composition checks", expected: "no composition errors", status: "pass" });

  console.log(JSON.stringify({ status: "pass", cases: results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
