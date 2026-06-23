#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const ROOT_LIST_SET_ID = "1909100000000000001";
const SOURCE_PAGE_LIST_ID = "1909100000000000999";
const DASHBOARD_LAYOUT_ID = "1909100000000000101";

function templateResource() {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/dashboard-page-layout-templates.json"), "utf8"));
  const resource = JSON.parse(JSON.stringify(registry.templates[0].template.parsedResource));
  resource.derivedFromDashboardPageLayoutTemplate = "dashboard-page-layouts-v1.1";
  removeOperations(resource);
  return resource;
}

function removeOperations(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.children)) {
    node.children = node.children.filter((child) => !identity(child).includes("Operations"));
    node.children.forEach(removeOperations);
  }
}

function identity(node) {
  return [node?.id, node?.name, node?.nv_label, node?.attrs?.name, node?.attrs?.nv_label, node?.attrs?.nav_label].filter(Boolean).map(String);
}

function decoded({ pageListId = ROOT_LIST_SET_ID } = {}) {
  return {
    ListSet: {
      ListID: ROOT_LIST_SET_ID,
      Title: "Office Asset Loan Management",
      Flags: 1,
      TableCode: "flowcraft",
      IndexCode: "flowcraft",
      LayoutView: JSON.stringify({
        sort: [{
          Type: "classes",
          ID: "1909100000000000200",
          AppID: 41,
          ListSetID: ROOT_LIST_SET_ID,
          Title: "Dashboards",
          Icon: "fa-solid fa-chart-line",
          list: [{
            Type: "103",
            AppID: 41,
            ListSetID: ROOT_LIST_SET_ID,
            ListID: DASHBOARD_LAYOUT_ID,
            LayoutID: DASHBOARD_LAYOUT_ID,
            Title: "Asset Loan Dashboard",
          }],
        }],
      }),
    },
    Pages: [{
      Type: 103,
      Title: "Asset Loan Dashboard",
      ListID: pageListId,
      LayoutID: DASHBOARD_LAYOUT_ID,
      LayoutView: null,
      Ext2: JSON.stringify({ src: true }),
      LayoutInResources: [{
        ID: DASHBOARD_LAYOUT_ID,
        RefId: DASHBOARD_LAYOUT_ID,
        Resource: JSON.stringify(templateResource()),
      }],
    }],
    Childs: [],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    Workflows: [],
    Navigation: [],
    Roles: [],
    Permissions: [],
    IconUrl: "{\"b\":\"#0f766e\",\"i\":\"fa-solid fa-laptop\",\"c\":\"#ffffff\"}",
  };
}

function writePackage(dir, name, appPackage) {
  const resource = zlib.brotliCompressSync(Buffer.from(JSON.stringify(appPackage), "utf8")).toString("base64");
  const wrapper = {
    PackageId: "1909100000000000300",
    TenantID: "1909100000000000400",
    AppID: "41",
    ListID: ROOT_LIST_SET_ID,
    Title: "Office Asset Loan Management",
    Description: "",
    IconUrl: "{\"b\":\"#0f766e\",\"i\":\"fa-solid fa-laptop\",\"c\":\"#ffffff\"}",
    Resource: resource,
    Notes: "",
    Author: "Codex",
    Date: "2026-06-23T00:00:00Z",
    Version: "1.0.0",
    Sign: Buffer.alloc(32, 1).toString("base64"),
  };
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify(wrapper)}\n`);
  return file;
}

function runValidator(file) {
  return spawnSync(process.execPath, ["validate-yapk-package.js", file], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-root-binding-"));
try {
  const wrongRoot = writePackage(tempDir, "wrong-page-listid", decoded({ pageListId: SOURCE_PAGE_LIST_ID }));
  const result = runValidator(wrongRoot);
  assert.notEqual(result.status, 0, "wrong Pages[].ListID should fail validate-yapk-package");
  assert.match(`${result.stdout}\n${result.stderr}`, /YAPK_DASHBOARD_PAGE_ROOT_BINDING_INVALID/);

  const forcedZero = templateResource();
  const content = find(forcedZero, "content");
  content.attrs.container = { padding: { top: 0, right: 0, bottom: 0, left: 0 } };
  content.attrs.common = { padding: [null, { top: 0, right: 0, bottom: 0, left: 0 }] };
  const paddingPackage = writePackage(tempDir, "forced-zero-content-padding", decoded({ pageListId: ROOT_LIST_SET_ID }));
  const wrapper = JSON.parse(fs.readFileSync(paddingPackage, "utf8"));
  const appPackage = decoded({ pageListId: ROOT_LIST_SET_ID });
  appPackage.Pages[0].LayoutInResources[0].Resource = JSON.stringify(forcedZero);
  wrapper.Resource = zlib.brotliCompressSync(Buffer.from(JSON.stringify(appPackage), "utf8")).toString("base64");
  fs.writeFileSync(paddingPackage, `${JSON.stringify(wrapper)}\n`);
  const paddingResult = runValidator(paddingPackage);
  assert.notEqual(paddingResult.status, 0, "forced-zero v1.1 Content padding should fail validate-yapk-package");
  assert.match(`${paddingResult.stdout}\n${paddingResult.stderr}`, /DASHBOARD_V11_CONTENT_PADDING_MISMATCH/);

  console.log(JSON.stringify({ status: "pass", cases: ["type-103-page-root-binding", "v11-content-padding"] }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function find(root, expected) {
  let found = null;
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (!found && identity(node).some((candidate) => candidate.toLowerCase() === expected.toLowerCase())) found = node;
    for (const child of node.children || []) visit(child);
  };
  visit(root);
  return found;
}
