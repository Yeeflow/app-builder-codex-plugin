#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { inspectApplicationLayoutDesignRules } from "./inspect-application-layout-design-rules.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "application-layout-design-rules-"));
const cases = [];

try {
  run();
  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

function run() {
  testPassLayout("application-layout-1-vertical-nav", "layout 1 vertical navigation contract");
  testPassLayout("application-layout-2-horizontal-nav", "layout 2 horizontal navigation contract");
  testPassLayout("application-layout-3-header-nav", "layout 3 header navigation contract");
  testPassLayout("application-layout-4-no-nav", "layout 4 no navigation contract");
  testMissingLayout();
  testUnsupportedLayout();
  testInconsistentMultiPageSet();
  testUnsupportedSidebarTopbar();
  testContentOverlap();
  testHumanReviewWarning();
  testCustomizationAllowed();
  testScreenshotReviewRequired();
  testArbitraryAppShellDetected();
  testMarkdownContractSupport();
  testStudySafety();
}

function testPassLayout(type, label) {
  const report = inspectContract(`${type}.json`, contract(type, { automaticallyVerified: true }));
  assert.equal(report.status, "pass");
  cases.push(`Pass: ${label}`);
}

function testMissingLayout() {
  const c = contract("application-layout-1-vertical-nav");
  delete c.applicationLayoutType;
  expectFail("Fail: no application layout declared", inspectContract("missing-layout.json", c), "APPLICATION_LAYOUT_MISSING");
}

function testUnsupportedLayout() {
  expectFail("Fail: unsupported layout declared", inspectContract("unsupported-layout.json", contract("made-up-layout")), "APPLICATION_LAYOUT_UNSUPPORTED");
}

function testInconsistentMultiPageSet() {
  const main = writeJson("main.json", contract("application-layout-1-vertical-nav", { automaticallyVerified: true }));
  const pages = writeJson("pages.json", {
    pages: [
      contract("application-layout-1-vertical-nav", { pageName: "Home", automaticallyVerified: true }),
      contract("application-layout-2-horizontal-nav", { pageName: "Sales", automaticallyVerified: true }),
    ],
  });
  const report = inspectApplicationLayoutDesignRules({ contract: main, multiPageSet: pages });
  expectFail("Fail: multi-page design set uses inconsistent layouts", report, "APPLICATION_LAYOUT_INCONSISTENT");
}

function testUnsupportedSidebarTopbar() {
  const c = contract("application-layout-2-horizontal-nav", {
    applicationChrome: "Use a custom SaaS shell with arbitrary top bar and unsupported sidebar.",
  });
  const report = inspectContract("unsupported-chrome.json", c);
  expectFail("Fail: arbitrary unsupported sidebar/topbar invented", report, "UNSUPPORTED_NAVIGATION_CHROME");
}

function testContentOverlap() {
  const c = contract("application-layout-1-vertical-nav", {
    contentSafeAreaRules: "Content may overlap under header and inside nav.",
  });
  expectFail("Fail: content overlaps header/nav safe area", inspectContract("overlap.json", c), "CONTENT_SAFE_AREA_VIOLATION");
}

function testHumanReviewWarning() {
  const c = contract("application-layout-3-header-nav", {
    humanReviewRequired: true,
    automaticallyVerified: false,
    humanReviewedDerivedRules: true,
  });
  const report = inspectContract("human-review.json", c);
  assert.equal(report.status, "warning");
  assertHasCode(report, "LAYOUT_REVIEW_REQUIRED");
  cases.push("Warn: layout cannot be verified automatically and requires human review");
}

function testCustomizationAllowed() {
  const c = contract("application-layout-1-vertical-nav", {
    automaticallyVerified: true,
    allowedCustomization: {
      appIcon: "custom",
      appName: "custom",
      menuIconColor: "#123456",
      menuTextColor: "#223344",
      backgroundColor: "#f8fafc",
      selectedColor: "#2563eb",
      hoverColor: "#dbeafe",
      foregroundColor: "#111827",
    },
  });
  const report = inspectContract("customization.json", c);
  assert.equal(report.status, "pass");
  cases.push("Pass: custom colors/icons/menu labels are allowed when inside supported layout structure");
}

function testScreenshotReviewRequired() {
  const screenshot = path.join(tmp, "mockup.png");
  fs.writeFileSync(screenshot, "synthetic image placeholder");
  const report = inspectApplicationLayoutDesignRules({
    contract: writeJson("screenshot-contract.json", contract("application-layout-1-vertical-nav", { humanReviewedDerivedRules: true })),
    screenshot,
  });
  assert.equal(report.status, "warning");
  assert.ok(report.findings.some((finding) => ["IMAGE_LAYOUT_VERIFICATION_UNPROVEN", "SCREENSHOT_REVIEW_REQUIRED"].includes(finding.code)));
  cases.push("Warn/fail: screenshot supplied but no screenshot parser exists");
}

function testArbitraryAppShellDetected() {
  const c = contract("application-layout-4-no-nav", {
    applicationChrome: "Invented app shell with custom SaaS shell.",
    navigationRules: "No nav, but add a floating navigation replacement.",
  });
  const report = inspectContract("arbitrary-shell.json", c);
  expectFail("Fail: arbitrary app shell or unsupported custom SaaS navigation is detected", report, "ARBITRARY_APP_SHELL_DETECTED");
}

function testMarkdownContractSupport() {
  const md = [
    "# Synthetic UI Contract",
    "- applicationLayoutType: application-layout-2-horizontal-nav",
    "- applicationLayoutName: Application layout 2: horizontal navigation menu bar",
    "- applicationChrome: Header plus horizontal menu bar below header.",
    "- headerRules: Header contains app icon, app name, and utility controls.",
    "- navigationRules: Horizontal navigation bar below header with dropdowns.",
    "- contentSafeAreaRules: Content starts below the horizontal menu bar.",
    "- allowedCustomization: colors and icons inside selected layout.",
    "- forbiddenChromePatterns: no arbitrary app shells or unsupported sidebars.",
    "- humanReviewRequired: false",
  ].join("\n");
  const report = inspectApplicationLayoutDesignRules({ contract: writeText("contract.md", md) });
  assert.equal(report.status, "warning");
  assert.ok(!report.findings.some((finding) => finding.code === "MARKDOWN_CONTRACT_UNSUPPORTED"));
  assertHasCode(report, "IMAGE_LAYOUT_VERIFICATION_UNPROVEN");
  cases.push("Markdown contract support: valid Markdown contract with declared layout parses and enforces review boundary");
}

function testStudySafety() {
  const docs = [
    "docs/standards/yeeflow-application-layout-design-rules.md",
    "dist/yeeflow-app-builder-plugin/docs/standards/yeeflow-application-layout-design-rules.md",
  ];
  const forbidden = [
    /"Resource"\s*:/,
    /"Sign"\s*:/,
    /raw package payload/i,
    /raw decoded package/i,
    /https?:\/\/(?!github\.com|example\.invalid)[^\s)]+/i,
    /\b\d{15,}\b/,
    /TenantID/i,
    /workspace/i,
  ];
  for (const doc of docs) {
    if (!fs.existsSync(doc)) continue;
    const text = fs.readFileSync(doc, "utf8");
    for (const pattern of forbidden) {
      assert.doesNotMatch(text, pattern, `${doc} includes unsafe raw/private-looking content: ${pattern}`);
    }
  }
  cases.push("YAPK study safety: docs/tests use only derived/redacted metadata and no raw package payloads");
}

function contract(type, overrides = {}) {
  const names = {
    "application-layout-1-vertical-nav": "Application layout 1: vertical navigation menu panel",
    "application-layout-2-horizontal-nav": "Application layout 2: horizontal navigation menu bar",
    "application-layout-3-header-nav": "Application layout 3: navigation menu on the header",
    "application-layout-4-no-nav": "Application layout 4: no navigation menu / hidden navigation",
  };
  return {
    pageName: overrides.pageName || "Home",
    applicationLayoutType: type,
    applicationLayoutName: names[type] || "Unsupported layout",
    applicationChrome: overrides.applicationChrome || "Use only the selected Yeeflow application header/navigation chrome.",
    headerRules: overrides.headerRules || "Header contains app icon, app name, and utility controls.",
    navigationRules: overrides.navigationRules || navigationRules(type),
    contentSafeAreaRules: overrides.contentSafeAreaRules || "Page content starts inside the content safe area, below the app chrome, and clear of header or navigation regions.",
    allowedCustomization: overrides.allowedCustomization || ["app icon", "app name", "menu colors", "selected color", "hover color", "foreground color"],
    forbiddenChromePatterns: overrides.forbiddenChromePatterns || ["unsupported SaaS shells", "arbitrary sidebars", "arbitrary top bars", "floating navigation"],
    humanReviewRequired: Boolean(overrides.humanReviewRequired),
    layoutVerification: {
      declaredCompliance: true,
      humanReviewedDerivedRules: Boolean(overrides.humanReviewedDerivedRules),
      automaticallyVerified: Boolean(overrides.automaticallyVerified),
    },
  };
}

function navigationRules(type) {
  if (type === "application-layout-1-vertical-nav") return "Persistent left vertical navigation panel below the header.";
  if (type === "application-layout-2-horizontal-nav") return "Horizontal navigation menu bar below the app header with dropdown behavior.";
  if (type === "application-layout-3-header-nav") return "Navigation menu appears on the header with dropdown behavior.";
  if (type === "application-layout-4-no-nav") return "Navigation menu is hidden; no replacement nav chrome is allowed.";
  return "Unsupported navigation.";
}

function inspectContract(name, data) {
  return inspectApplicationLayoutDesignRules({ contract: writeJson(name, data) });
}

function expectFail(label, report, code) {
  assert.equal(report.status, "fail", `${label} should fail`);
  assertHasCode(report, code);
  cases.push(label);
}

function assertHasCode(report, code) {
  assert.ok(report.findings.some((finding) => finding.code === code), `missing finding ${code}`);
}

function writeJson(name, data) {
  const file = path.join(tmp, name);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
}

function writeText(name, text) {
  const file = path.join(tmp, name);
  fs.writeFileSync(file, `${text}\n`);
  return file;
}
