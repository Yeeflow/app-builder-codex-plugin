#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = 1700000000010000n;

function id(offset) {
  return String(API_BASE + BigInt(offset));
}

function numId(offset) {
  return Number(API_BASE + BigInt(offset));
}

function encodeDefResource(def) {
  return Buffer.concat([
    Buffer.from("::brotli::", "utf8"),
    zlib.brotliCompressSync(Buffer.from(JSON.stringify(def), "utf8")),
  ]).toString("base64");
}

function dashboardResource(listId, pageId) {
  return {
    title: "Maintenance Dashboard",
    ver: "1.0.0",
    attrs: { container: { padding: { top: 0, right: 0, bottom: 0, left: 0 } } },
    filterVars: [],
    tempVars: [{ name: "openWorkOrders" }],
    exts: [],
    actions: [],
    children: [{
      id: "Main",
      name: "Main",
      type: "container",
      children: [{
        id: "Content",
        name: "Content",
        type: "container",
        children: [
          { type: "summary", name: "Open Work Orders Summary", attrs: { save_var: { name: "openWorkOrders" } }, exts: { ListID: listId, settings: { values: [{ field: "ListDataID", method: "COUNT" }] } } },
          { type: "heading", label: "Text", name: "Open Work Orders KPI Value", attrs: { headc: { title: { variable: ["openWorkOrders"] } }, heads: { ty: [null, "heading-lg"], color: "var(--c--text)" }, style: { width: "auto" } } },
          { type: "data-list", name: "Work Orders Table", binding: listId, attrs: { table: { link: pageId }, data: { list: { AppID: 41, ListID: listId, Type: 1, Title: "Work Orders", ListSetID: id(1) } }, listarr: [{ Field: "Title", FieldName: "Title" }] } },
          { type: "action_button", name: "Open Dashboard", attrs: { "action-type": "6", data: { page: { PageID: pageId } } } },
          { type: "action_button", name: "Submit Action", attrs: { "action-type": "1", control_action: "submit" } },
          { type: "collection", name: "Recent Work Orders", children: [] },
        ],
      }],
    }],
  };
}

function approvalDef() {
  return {
    defkey: "MaintenanceApproval",
    pageurls: [{ id: "submit-page", type: 1, formdef: { id: "submit-page", pagetype: 1, children: [] } }],
    childshapes: [],
  };
}

function baseDecoded() {
  const rootId = numId(1);
  const pageId = id(2);
  const listId = numId(3);
  return {
    ListSet: { ListID: rootId, Title: "Maintenance", Type: 1024, Flags: 1, TableCode: "flowcraft", IndexCode: "flowcraft" },
    Pages: [{
      ListID: rootId,
      LayoutID: pageId,
      Type: 103,
      Title: "Maintenance Dashboard",
      LayoutView: null,
      Ext2: JSON.stringify({ src: true }),
      LayoutInResources: [{ ID: numId(4), RefId: numId(4), Resource: JSON.stringify(dashboardResource(listId, pageId)) }],
    }],
    Forms: [{ Key: id(20), Title: "Maintenance Approval", DefResourceID: id(21), DeployedDefID: id(22), DefResource: encodeDefResource(approvalDef()), WorkflowType: 2, Deployed: false }],
    FormNewReports: [],
    DataReports: [],
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [{ ID: id(30), Config: JSON.stringify({ primary: "var(--c--primary)" }), Ext: JSON.stringify({ generatedFinal: true }) }],
    Components: [],
    Childs: [{
      List: { ListID: listId, Title: "Work Orders", Type: 1, Flags: 1, LayoutView: null, TableCode: "flowcraft", IndexCode: "flowcraft" },
      Fields: [
        { ListID: listId, FieldID: numId(40), FieldName: "Title", InternalName: "Title", DisplayName: "Title", FieldIndex: 0, IsSystem: true, Type: "input", FieldType: "Text", Category: 1, Rules: "{}", Status: 0 },
      ],
      Layouts: [],
      RemindRules: [],
      PublicForms: [],
      FlowMappings: [],
    }],
  };
}

function wrapper(decoded) {
  return {
    PackageId: "draft-placeholder-test",
    TenantID: id(100),
    AppID: 41,
    ListID: id(1),
    Title: "Draft Placeholder Test",
    Description: "",
    IconUrl: "",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
    Notes: "",
    Author: "regression",
    Date: "2026-06-20T00:00:00Z",
    Version: "0.0.0-test",
    Sign: Buffer.alloc(32, 1).toString("base64"),
  };
}

function writePackage(dir, name, decoded) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify(wrapper(decoded))}\n`);
  return file;
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectPass(label, args) {
  const result = run(args);
  assert.equal(result.status, 0, `${label} should pass\n${result.stdout}\n${result.stderr}`);
}

function expectCode(label, args, code) {
  const result = run(args);
  assert.notEqual(result.status, 0, `${label} should fail with ${code}`);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, new RegExp(code), `${label} did not report ${code}\n${output}`);
}

function runJson(label, args) {
  const result = run(args);
  assert.equal(result.status, 0, `${label} should pass\n${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function mutateDashboard(decoded, mutator) {
  const resource = decoded.Pages[0].LayoutInResources[0];
  const parsed = JSON.parse(resource.Resource);
  mutator(parsed);
  resource.Resource = JSON.stringify(parsed);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "generated-final-draft-placeholders-"));
const cases = [];

try {
  const clean = writePackage(tempDir, "clean", baseDecoded());
  expectPass("clean generated-final draft scan", ["scripts/validate-generated-final-draft-placeholders.mjs", "--package", clean]);
  cases.push({ case: "clean generated-final package passes after replacement", status: "pass" });

  const invalid = baseDecoded();
  mutateDashboard(invalid, (page) => {
    const controls = page.children[0].children[0].children;
    controls[0].exts.ListID = "local-draft";
    controls[0].exts.settings.values = "local-draft";
    controls[2].binding = "local-draft";
    controls[2].attrs.table.link = "local-draft";
    controls[3].attrs.data.page.PageID = "local-draft";
    controls[4].attrs.control_action = "local-draft";
    controls[5].children = "local-draft";
    page.ver = "local-draft-1";
  });
  invalid.Forms[0].Ext = JSON.stringify({ source: "local-draft-generation" });
  invalid.Forms[0].DefResource = encodeDefResource({ ...approvalDef(), sourceMarker: "local-draft-no-api" });
  invalid.Themes[0].Ext = JSON.stringify({ localDraft: true });
  const invalidFile = writePackage(tempDir, "invalid", invalid);

  expectCode("generated-final draft placeholder CLI", ["scripts/validate-generated-final-draft-placeholders.mjs", "--package", invalidFile], "GENERATED_FINAL_DRAFT_PLACEHOLDER");
  cases.push({ case: "generated-final CLI fails local-draft strings in nested runtime payloads", status: "pass" });

  const localDraftReport = runJson("local-draft mode reports but passes", ["scripts/validate-generated-final-draft-placeholders.mjs", "--package", invalidFile, "--mode", "local-draft"]);
  assert.equal(localDraftReport.signInstallEligible, false, "local-draft mode must never be sign/install eligible");
  cases.push({ case: "local-draft mode distinguishes local-only packages", status: "pass" });

  expectCode("standard YAPK validator blocks before signing", ["validate-yapk-package.js", invalidFile], "GENERATED_FINAL_DRAFT_PLACEHOLDER");
  cases.push({ case: "standard YAPK validator blocks generated-final placeholders before signing", status: "pass" });

  const logicalRef = baseDecoded();
  mutateDashboard(logicalRef, (page) => {
    const controls = page.children[0].children[0].children;
    controls[2].binding = "logicalRef:list:work-orders";
    controls[2].attrs.table.link = "logicalRef:layout:work-order-detail";
    controls[3].attrs.data.page.PageID = "logicalRef:dashboard:maintenance";
    controls[4].attrs.control_action = "logicalRef:formAction:approve";
  });
  logicalRef.ListSet.LayoutView = JSON.stringify({ sort: [{ Type: "classes", Title: "Ops", ID: id(70), AppID: 41, ListSetID: id(1), Icon: "folder", list: [{ Type: 103, Title: "Maintenance", AppID: 41, ListSetID: id(1), ListID: "logicalRef:dashboard:maintenance", LayoutID: "logicalRef:dashboard:maintenance" }] }] });
  logicalRef.Forms[0].Ext = JSON.stringify({ workflowTarget: "logicalRef:workflow:maintenance-approval" });
  const logicalRefFile = writePackage(tempDir, "logical-ref", logicalRef);
  expectCode("generated-final unresolved logical refs fail", ["scripts/validate-generated-final-draft-placeholders.mjs", "--package", logicalRefFile], "GENERATED_FINAL_UNRESOLVED_LOGICAL_REF");
  expectCode("standard YAPK validator blocks unresolved logical refs", ["validate-yapk-package.js", logicalRefFile], "GENERATED_FINAL_UNRESOLVED_LOGICAL_REF");
  cases.push({ case: "generated-final ID-first output fails unresolved logical refs", status: "pass" });

  const preflight = run(["scripts/yapk-first-generation-preflight.mjs", "--package", invalidFile, "--json"]);
  assert.notEqual(preflight.status, 0, "preflight should fail when generated-final draft placeholders remain");
  assert.match(preflight.stdout, /generated-final-draft-placeholders/, `preflight did not include placeholder gate\n${preflight.stdout}\n${preflight.stderr}`);
  assert.match(preflight.stdout, /GENERATED_FINAL_DRAFT_PLACEHOLDER/, `preflight did not report placeholder code\n${preflight.stdout}\n${preflight.stderr}`);
  cases.push({ case: "first-generation preflight includes generated-final draft placeholder gate", status: "pass" });

  const decodedFile = path.join(tempDir, "invalid-decoded.json");
  fs.writeFileSync(decodedFile, `${JSON.stringify(invalid, null, 2)}\n`);
  expectCode("decoded resource scan", ["scripts/validate-generated-final-draft-placeholders.mjs", "--decoded", decodedFile], "GENERATED_FINAL_DRAFT_PLACEHOLDER");
  cases.push({ case: "decoded-resource scan fails unresolved draft sentinels", status: "pass" });

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
