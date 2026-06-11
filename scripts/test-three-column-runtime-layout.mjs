#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PROPERTY_MAP = "docs/studies/normalized/three-column-runtime-css/reference-property-map.normalized.json";

function control(type, attrs = {}, children = [], label = "") {
  return { type, label: label || type, attrs, children };
}

function page(children = []) {
  return { attrs: { contentWidth: "full", container: { padding: { left: 0, right: 0, top: 0, bottom: 0 } } }, children };
}

function panel(label, bodyText, bottomText, side = "main") {
  const fixed = side !== "main";
  return control("container", {
    style: {
      widthtype: fixed ? "3" : "0",
      width: side === "left" ? 360 : side === "right" ? 480 : 300,
      height: "2",
      cushei: 100,
      cusheiu: "%",
      overflow: "hidden",
      justify_content: "flex-start",
      gap: "--sp--s0",
    },
  }, [
    control("container", { common: { pos: [null, "sticky"], sticky: { to: [null, "1"] }, zidx: [null, 2] }, style: { direction: [null, "row"], align_items: [null, "center"], justify_content: [null, "space-between"], minheight: [null, 52] } }, [
      control("icon", { icon: label, style: { widthtype: [null, "1"], size: [null, 20] } }, [], `${label} icon`),
      control("heading", { headc: { title: { value: label } } }, [], label),
    ], `${label} header`),
    control("container", { style: { overflow: "scroll", height: "2", cushei: 100, cusheiu: "%", gap: "--sp--s150" } }, [
      control("heading", { headc: { title: { value: bodyText } } }, [], bodyText),
    ], `${label} body`),
    control("container", { style: { direction: [null, "row"], align_items: [null, "center"], gap: "--sp--s150" } }, [
      control("heading", { headc: { title: { value: bottomText } } }, [], bottomText),
    ], `${label} bottom`),
  ], label);
}

function workspacePage(shellAttrs = {}) {
  return page([
    control("container", {
      common: { pos: [null, "absolute"], hor: [null, "center"], ver: [null, "center"] },
      style: { direction: [null, "row"], gap: [null, "--sp--s100"] },
      ...shellAttrs,
    }, [
      panel("Left ticket queue context", "Ticket queues and priority filters", "Bottom queue notes", "left"),
      panel("Main content ticket inbox", "Ticket list work area with status and owner", "Bottom main activity", "main"),
      panel("Right detail information action panel", "Selected ticket detail and next action", "Bottom detail history", "right"),
    ], "Service Desk Inbox"),
  ]);
}

function nestedWorkspacePage() {
  const shell = workspacePage().children[0];
  return page([
    control("container", { style: { direction: [null, "column"] } }, [
      control("container", { style: { direction: [null, "column"] } }, [
        shell,
      ], "Content"),
    ], "Main"),
  ]);
}

function packageFixture(pageObj) {
  return {
    Item: {
      ListModel: { Title: "Three Column Runtime Test", ListID: "root" },
      Defs: [],
      Layouts: [{
        Title: "Service Desk Inbox",
        Type: 103,
        LayoutID: "dashboard",
        LayoutView: null,
        Ext2: "{\"src\":true}",
        LayoutInResources: [{ Resource: JSON.stringify(pageObj) }],
      }],
    },
    Childs: [],
  };
}

function library() {
  return {
    library: "Three Column Runtime Test Library",
    version: "test",
    templates: [{
      templateId: "three_column_workspace_shell",
      requiredControls: ["container", "heading", "icon"],
      layoutRules: ["three_column_workspace_shell", "three_column_reference_mechanics", "meaningful_panel_content"],
      validationRules: ["section_exists", "no_placeholder_content"],
    }],
  };
}

function checklist() {
  return {
    application: "Three Column Runtime Test",
    version: "test",
    pages: [{
      id: "service_desk_inbox",
      title: "Service Desk Inbox",
      type: "dashboard",
      required: true,
      sections: [{
        id: "workspace_shell",
        title: "Service Desk Inbox",
        status: "required",
        templateId: "three_column_workspace_shell",
        controls: ["container", "heading", "icon"],
        matchText: ["Service Desk Inbox"],
        layoutRules: ["three_column_workspace_shell", "three_column_reference_mechanics", "meaningful_panel_content"],
      }],
    }],
  };
}

function writeJson(dir, name, value) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function runInspector(pkg, check, lib) {
  const result = spawnSync(process.execPath, [
    "scripts/inspect-generated-app-quality.mjs",
    "--package", pkg,
    "--composition-checklist", check,
    "--template-library", lib,
    "--strict-visual-app-quality",
  ], { encoding: "utf8", maxBuffer: 24 * 1024 * 1024 });
  return JSON.parse(result.stdout || "{}");
}

function templateErrors(report) {
  return (report.findings || []).filter((finding) => finding.source === "template-library" && finding.level === "error");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const propertyMap = JSON.parse(fs.readFileSync(PROPERTY_MAP, "utf8"));
assert(propertyMap.runtimeCssEvidence.shell.display === "flex", "reference property map must record flex shell");
assert(propertyMap.runtimeCssEvidence.shell.flexDirection === "row", "reference property map must record row shell");
assert(propertyMap.packageAttrEvidence.leftPanel["attrs.style.widthtype"] === "3", "reference property map must record fixed left panel");
assert(propertyMap.packageAttrEvidence.mainPanel["attrs.style.widthtype"] === "0", "reference property map must record fill-width main panel");
assert(propertyMap.runtimeCssEvidence.bodies.overflow === "scroll", "reference property map must record scrollable bodies");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "three-column-runtime-layout-"));
try {
  const lib = writeJson(tempDir, "library", library());
  const check = writeJson(tempDir, "checklist", checklist());

  const goodReport = runInspector(writeJson(tempDir, "good", packageFixture(workspacePage())), check, lib);
  assert(templateErrors(goodReport).length === 0, `valid runtime-layout fixture should pass: ${JSON.stringify(templateErrors(goodReport), null, 2)}`);

  const nestedReport = runInspector(writeJson(tempDir, "nested", packageFixture(nestedWorkspacePage())), check, lib);
  const nestedCodes = templateErrors(nestedReport).map((finding) => finding.code);
  assert(nestedCodes.includes("THREE_COLUMN_SHELL_NOT_ROOT"), "nested fixture must fail with THREE_COLUMN_SHELL_NOT_ROOT");
  assert(nestedCodes.includes("THREE_COLUMN_SHELL_NESTED_IN_MAIN_CONTENT"), "nested fixture must fail with THREE_COLUMN_SHELL_NESTED_IN_MAIN_CONTENT");
  assert(nestedCodes.includes("THREE_COLUMN_PARENT_HEIGHT_DEFAULT_RISK"), "nested fixture must fail with THREE_COLUMN_PARENT_HEIGHT_DEFAULT_RISK");

  const stacked = workspacePage({ common: {}, style: { gap: [null, "--sp--s100"] } });
  const stackedReport = runInspector(writeJson(tempDir, "stacked", packageFixture(stacked)), check, lib);
  assert(templateErrors(stackedReport).some((finding) => finding.code === "THREE_COLUMN_PANELS_STACKED_VERTICALLY"), "stacked fixture must fail with THREE_COLUMN_PANELS_STACKED_VERTICALLY");

  const narrowPage = workspacePage();
  narrowPage.attrs.contentWidth = "boxed";
  const narrowReport = runInspector(writeJson(tempDir, "narrow", packageFixture(narrowPage)), check, lib);
  assert(templateErrors(narrowReport).some((finding) => finding.code === "THREE_COLUMN_PAGE_WIDTH_NOT_FULL"), "non-full-width page must fail with THREE_COLUMN_PAGE_WIDTH_NOT_FULL");

  const paddedPage = workspacePage();
  paddedPage.attrs.container.padding.left = 24;
  const paddedReport = runInspector(writeJson(tempDir, "padded", packageFixture(paddedPage)), check, lib);
  assert(templateErrors(paddedReport).some((finding) => finding.code === "THREE_COLUMN_PAGE_PADDING_NOT_ZERO"), "non-zero padding page must fail with THREE_COLUMN_PAGE_PADDING_NOT_ZERO");

  const iconPage = workspacePage();
  iconPage.children[0].children[0].children[0].children[0].attrs.style.widthtype = [null, "0"];
  const iconReport = runInspector(writeJson(tempDir, "icon", packageFixture(iconPage)), check, lib);
  assert(templateErrors(iconReport).some((finding) => finding.code === "THREE_COLUMN_ICON_WIDTH_NOT_INLINE"), "block-width icon must fail with THREE_COLUMN_ICON_WIDTH_NOT_INLINE");

  const placeholder = workspacePage();
  placeholder.children[0].children[1].children[1].children[0].attrs.headc.title.value = "Drag to add controls here";
  const placeholderReport = runInspector(writeJson(tempDir, "placeholder", packageFixture(placeholder)), check, lib);
  assert(templateErrors(placeholderReport).some((finding) => finding.code === "THREE_COLUMN_PLACEHOLDER_PANEL"), "placeholder panel must fail with THREE_COLUMN_PLACEHOLDER_PANEL");

  console.log(JSON.stringify({
    status: "pass",
    cases: [
      "sanitized reference property map records runtime CSS mechanics",
      "correct root three-column shell fixture passes",
      "Main > Content nested shell fixture fails",
      "non-full-width page fixture fails",
      "non-zero page padding fixture fails",
      "block-width icon fixture fails",
      "stacked/sequential three-panel fixture fails",
      "placeholder panel fixture fails",
    ],
  }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
