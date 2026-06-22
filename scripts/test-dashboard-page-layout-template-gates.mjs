#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const TEMPLATE_ID = "dashboard-page-layouts-v1.1";
const APP_ID = "1909100000000000001";
const LIST_ID = "1909100000000000100";

function registry() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/dashboard-page-layout-templates.json"), "utf8"));
}

function templateResource() {
  const resource = clone(registry().templates[0].template.parsedResource);
  resource.derivedFromDashboardPageLayoutTemplate = TEMPLATE_ID;
  removeOperations(resource);
  adaptText(resource);
  ensureCollection(resource);
  return resource;
}

function adaptText(node) {
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (typeof child === "string" && !["id", "key", "type", "name", "nv_label", "nav_label"].includes(key)) {
        value[key] = child
          .replaceAll("Campaign", "Loan")
          .replaceAll("Registration", "Checkout")
          .replaceAll("Marketing Event", "Asset Loan")
          .replaceAll("Template", "Asset Loan");
      } else {
        visit(child);
      }
    }
  };
  visit(node);
}

function ensureCollection(resource) {
  const section = find(resource, "section_content_area");
  section.children = section.children || [];
  section.children.push({
    type: "collection",
    name: "Asset Loan Work Queue",
    attrs: {
      data: { list: { ListID: LIST_ID, Title: "Loan Requests" } },
    },
  });
}

function removeOperations(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.children)) {
    node.children = node.children.filter((child) => !ids(child).includes("Operations"));
    node.children.forEach(removeOperations);
  }
}

function decoded(resource = templateResource()) {
  return {
    ListSet: { ListID: APP_ID, Title: "Office Asset Loan Management" },
    Pages: [{ Type: 103, Title: "Asset Loan Dashboard", LayoutID: "dashboard-layout-1", LayoutInResources: [{ ID: "dashboard-layout-1", RefId: "dashboard-layout-1", Resource: JSON.stringify(resource) }] }],
    Childs: [{ List: { ListID: LIST_ID, Title: "Loan Requests" }, Fields: [{ FieldName: "Title" }, { FieldName: "Borrower", FieldType: "User" }] }],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    Workflows: [],
    Navigation: [{ ID: "nav", Title: "Dashboard" }],
    IconUrl: "{\"b\":\"#0f766e\",\"i\":\"fa-solid fa-laptop\",\"c\":\"#ffffff\"}",
    Roles: [],
    Permissions: [],
  };
}

function writePackage(dir, name, data) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify({ Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(data), "utf8")).toString("base64") })}\n`);
  return file;
}

function writeJson(dir, name, data) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ids(node) {
  return [node?.id, node?.name, node?.nv_label, node?.attrs?.name, node?.attrs?.nv_label, node?.attrs?.nav_label, node?.derivedFromDashboardPageLayoutTemplate, node?.attrs?.derivedFromDashboardPageLayoutTemplate].filter(Boolean).map(String);
}

function visit(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  for (const child of node.children || []) visit(child, fn);
}

function find(node, id) {
  let found = null;
  visit(node, (current) => {
    if (!found && ids(current).includes(id)) found = current;
  });
  return found;
}

function findAll(node, id) {
  const found = [];
  visit(node, (current) => {
    if (ids(current).includes(id)) found.push(current);
  });
  return found;
}

function run(args) {
  return spawnSync(process.execPath, ["scripts/validate-dashboard-page-layout-template.mjs", ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectPass(label, args) {
  const result = run(args);
  assert.equal(result.status, 0, `${label} should pass.\n${result.stdout}\n${result.stderr}`);
}

function expectCode(label, args, code) {
  const result = run(args);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0, `${label} should fail.`);
  assert.match(output, new RegExp(code), `${label} did not report ${code}.\n${output}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-page-layout-v11-"));
try {
  expectPass("v1.1 template registry and quality lint pass", ["--registry", "docs/reference/dashboard-page-layout-templates.json"]);
  expectPass("generated dashboard uses v1.1 shell with selected sections and domain content", ["--package", writePackage(tempDir, "valid", decoded())]);

  expectCode("dashboard generated without main > content fails", ["--package", writePackage(tempDir, "missing-main-content", decoded({ attrs: templateResource().attrs, children: [] }))], "DASH_LAYOUT_RESOURCE_MAIN_CONTENT_MISSING");

  const missingBackground = templateResource();
  missingBackground.attrs.background.classic.color = "#ffffff";
  expectCode("page root background missing or different fails", ["--package", writePackage(tempDir, "bad-background", decoded(missingBackground))], "DASH_LAYOUT_RESOURCE_BACKGROUND_INVALID");

  const nonzeroPadding = templateResource();
  nonzeroPadding.attrs.container.padding = [null, { top: "--sp--s4", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }];
  expectCode("root page padding nonzero fails", ["--package", writePackage(tempDir, "nonzero-padding", decoded(nonzeroPadding))], "DASH_LAYOUT_RESOURCE_ROOT_PADDING_NONZERO");

  const conflictingContentBackground = templateResource();
  find(conflictingContentBackground, "content").attrs.background = { type: "classic", classic: { color: "#ffffff" } };
  expectCode("content container conflicting background fails", ["--package", writePackage(tempDir, "content-background", decoded(conflictingContentBackground))], "DASH_LAYOUT_RESOURCE_CONTENT_BACKGROUND_CONFLICT");

  const missingWidth = templateResource();
  delete find(missingWidth, "content_card_wrapper").attrs.style.widthtype;
  expectCode("section wrapper missing Full width fails", ["--package", writePackage(tempDir, "missing-width", decoded(missingWidth))], "DASH_LAYOUT_RESOURCE_FULL_WIDTH_MISSING");

  const missingTitle = templateResource();
  find(missingTitle, "content_card_wrapper").children = find(missingTitle, "content_card_wrapper").children.filter((child) => !ids(child).includes("section_title_area"));
  expectCode("section card missing section_title_area fails", ["--package", writePackage(tempDir, "missing-title-area", decoded(missingTitle))], "DASH_LAYOUT_RESOURCE_SECTION_TITLE_AREA_MISSING");

  const missingContent = templateResource();
  find(missingContent, "content_card_wrapper").children = find(missingContent, "content_card_wrapper").children.filter((child) => !ids(child).includes("section_content_area"));
  expectCode("section card missing section_content_area fails", ["--package", writePackage(tempDir, "missing-content-area", decoded(missingContent))], "DASH_LAYOUT_RESOURCE_SECTION_CONTENT_AREA_MISSING");

  const emptyOperations = templateResource();
  const header = find(emptyOperations, "page_title_header");
  header.children.push({ type: "container", name: "Operations", attrs: { style: { widthtype: [null, "2"] } }, children: [{ type: "heading", name: "Create Request Button", attrs: { heads: { title: { value: "Create Request" } } } }] });
  expectCode("Operations container with no real actions fails", ["--package", writePackage(tempDir, "empty-operations", decoded(emptyOperations))], "DASH_LAYOUT_OPERATIONS_WITHOUT_ACTIONS");

  const visualButton = templateResource();
  find(visualButton, "section_title_area").children.push({ type: "container", name: "Operations", attrs: { style: { widthtype: [null, "2"] } }, children: [{ type: "container", name: "Export Action", children: [{ type: "heading", attrs: { heads: { title: { value: "Export" } } } }] }] });
  expectCode("visual button without Yeeflow action binding fails", ["--package", writePackage(tempDir, "visual-button", decoded(visualButton))], "DASH_LAYOUT_VISUAL_ACTION_WITHOUT_BINDING");

  const templateLeak = templateResource();
  find(templateLeak, "section_content_area").children.push({ type: "heading", attrs: { heads: { title: { value: "Campaign Registration Placeholder" } } } });
  expectCode("unrelated template/domain labels remain fails", ["--package", writePackage(tempDir, "template-leak", decoded(templateLeak))], "DASH_LAYOUT_TEMPLATE_LABEL_LEAKAGE");

  expectCode("runtime proof using guessed /p route fails", ["--runtime-proof", writeJson(tempDir, "bad-route.json", { url: "https://codex.yeeflow.com/#/list-set/41/APP/p/LAYOUT", pageText: "Asset Loan Dashboard" })], "DASH_LAYOUT_RUNTIME_ROUTE_INVALID");
  expectPass("canonical route proof shape passes", ["--runtime-proof", writeJson(tempDir, "canonical-route.json", { url: "https://codex.yeeflow.com/#/list-set/41/APP/LAYOUT", pageText: "Asset Loan Dashboard" })]);

  const upgradeBefore = decoded();
  const upgradeAfter = clone(upgradeBefore);
  upgradeAfter.Childs[0].List.Title = "Changed Loan Requests";
  expectCode("dashboard-only upgrade changing non-dashboard resources fails", ["--upgrade-scope", writeJson(tempDir, "bad-upgrade.json", { scope: { type: "dashboard-only" }, before: upgradeBefore, after: upgradeAfter })], "DASH_LAYOUT_UPGRADE_NON_DASHBOARD_MUTATION");

  console.log(JSON.stringify({ status: "pass", cases: 15 }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
