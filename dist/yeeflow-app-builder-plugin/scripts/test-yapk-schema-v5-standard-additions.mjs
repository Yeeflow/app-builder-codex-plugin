#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = 1700000000008000n;

function id(offset) {
  return String(API_BASE + BigInt(offset));
}

function encodeDefResource(def) {
  return Buffer.concat([
    Buffer.from("::brotli::", "utf8"),
    zlib.brotliCompressSync(Buffer.from(JSON.stringify(def), "utf8")),
  ]).toString("base64");
}

function baseDef() {
  const submitPageId = "11111111-1111-4111-8111-111111111111";
  const taskPageId = "22222222-2222-4222-8222-222222222222";
  const flowId = "flow-start-task";
  return {
    defkey: "SchemaV5Approval",
    workflowType: 2,
    deployed: true,
    graphposition: { x: 0, y: 0 },
    graphzoom: 1,
    graphver: 1,
    variables: { basic: [], listref: [], filter: [], tempVars: [] },
    pageurls: [
      { id: submitPageId, name: "Submit", title: "Submit", type: 1, pagetype: 1, formdef: { id: submitPageId, title: "Submit", pagetype: 1, ver: 2, children: [] } },
      { id: taskPageId, name: "Task", title: "Task", type: 2, pagetype: 1, formdef: { id: taskPageId, title: "Task", pagetype: 2, ver: 2, children: [] } },
    ],
    childshapes: [
      { resourceid: "start", stencil: { id: "StartNoneEvent" }, properties: { name: "Start", taskurl: submitPageId, taskUrl: submitPageId, TaskUrl: submitPageId }, incoming: [], outgoing: [{ resourceid: flowId }] },
      { resourceid: flowId, stencil: { id: "SequenceFlow" }, properties: { name: "Submit" }, source: { resourceid: "start" }, target: { resourceid: "task" }, incoming: [{ resourceid: "start" }], outgoing: [{ resourceid: "task" }] },
      { resourceid: "task", stencil: { id: "MultiAssignmentTask" }, properties: { name: "Review", taskurl: taskPageId, taskUrl: taskPageId, TaskUrl: taskPageId }, incoming: [{ resourceid: flowId }], outgoing: [] },
    ],
  };
}

function baseDecoded() {
  return {
    ListSet: {
      ListID: Number(id(1)),
      Title: "Schema V5 Smoke",
      Description: "",
      Status: 1,
      IsItemPerm: false,
      IsVerRecord: false,
      HasComment: false,
      IconUrl: "",
      Flags: 1,
      TableCode: "flowcraft",
      Type: 1024,
      IndexCode: "flowcraft",
    },
    Pages: [],
    Forms: [{
      Category: "approval",
      Name: "Schema V5 Approval",
      Key: "SchemaV5Approval",
      IsItemPerm: false,
      AppID: 41,
      ListID: id(2),
      ProcModelID: id(3),
      Description: "",
      Ext: "",
      DefResourceID: id(4),
      DefResource: encodeDefResource(baseDef()),
      Status: 1,
      DeployedDefID: id(5),
      WorkflowType: 2,
      Settings: "{}",
      Deployed: true,
      NoRule: { Prefix: "REQ-{index}", StartIndex: 1, CustomLength: 4, AutoIncrement: 1 },
      Perms: [],
    }],
    FormNewReports: [],
    DataReports: [],
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
    Childs: [],
  };
}

function wrapper(decoded) {
  return {
    PackageId: "schema-v5-standard-additions",
    TenantID: id(100),
    AppID: 41,
    ListID: id(1),
    Title: "Schema V5 Standard Additions",
    Description: "",
    IconUrl: "",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
    Notes: "",
    Author: "regression",
    Date: "2026-06-03T00:00:00Z",
    Version: "0.0.0-test",
    Sign: Buffer.alloc(32).toString("base64"),
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
  assert.equal(result.status, 0, `${label} failed\n${result.stdout}\n${result.stderr}`);
}

function expectCode(label, args, code) {
  const result = run(args);
  assert.notEqual(result.status, 0, `${label} should fail with ${code}`);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, new RegExp(code), `${label} did not emit ${code}\n${output}`);
}

function mutateDef(decoded, mutator) {
  const def = baseDef();
  mutator(def);
  decoded.Forms[0].DefResource = encodeDefResource(def);
}

const cases = [
  ["simple JSON DefResource", "APPROVAL_DEFRESOURCE_ENCODING_INVALID", (d) => { d.Forms[0].DefResource = JSON.stringify(baseDef()); }],
  ["zero deployed IDs", "APPROVAL_DEFRESOURCEID_API_ID_REQUIRED", (d) => { d.Forms[0].DefResourceID = 0; }],
  ["formdef id mismatch", "APPROVAL_PAGE_FORMDEF_ID_MISMATCH", (d) => mutateDef(d, (def) => { def.pageurls[1].formdef.id = "different-page-id"; })],
  ["missing sequence connector", "APPROVAL_WORKFLOW_SEQUENCE_CONNECTOR_MISSING", (d) => mutateDef(d, (def) => { def.childshapes = def.childshapes.filter((shape) => shape.stencil.id !== "SequenceFlow"); })],
  ["start not connected", "APPROVAL_WORKFLOW_START_SEQUENCE_MISSING", (d) => mutateDef(d, (def) => { def.childshapes[0].outgoing = [{ resourceid: "missing-flow" }]; })],
  ["taskurl unresolved", "APPROVAL_WORKFLOW_TASKURL_PAGE_NOT_FOUND", (d) => mutateDef(d, (def) => { def.childshapes[2].properties.taskurl = "missing-page"; })],
  ["FormNewReports missing", "FORMNEWREPORTS_REQUIRED", (d) => { delete d.FormNewReports; }],
];

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-schema-v5-"));
try {
  const valid = writePackage(tempDir, "valid", baseDecoded());
  expectPass("source validator valid v5 fixture", ["validate-yapk-package.js", valid]);
  expectPass("dist validator valid v5 fixture", ["dist/yeeflow-app-builder-plugin/scripts/validate-yapk-package.js", valid]);
  expectPass("canonical schema validator valid v5 fixture", ["scripts/validate-standard-package-schema.mjs", valid]);
  expectPass("dist canonical schema validator valid v5 fixture", ["dist/yeeflow-app-builder-plugin/scripts/validate-standard-package-schema.mjs", valid]);

  for (const [label, code, mutate] of cases) {
    const decoded = baseDecoded();
    mutate(decoded);
    const file = writePackage(tempDir, label.replace(/[^a-z0-9]+/gi, "-").toLowerCase(), decoded);
    if (code) {
      expectCode(`source validator ${label}`, ["validate-yapk-package.js", file], code);
      expectCode(`dist validator ${label}`, ["dist/yeeflow-app-builder-plugin/scripts/validate-yapk-package.js", file], code);
      expectCode(`canonical schema validator ${label}`, ["scripts/validate-standard-package-schema.mjs", file], code);
      expectCode(`dist canonical schema validator ${label}`, ["dist/yeeflow-app-builder-plugin/scripts/validate-standard-package-schema.mjs", file], code);
    } else {
      expectPass(`source validator ${label}`, ["validate-yapk-package.js", file]);
      expectPass(`dist validator ${label}`, ["dist/yeeflow-app-builder-plugin/scripts/validate-yapk-package.js", file]);
      expectPass(`canonical schema validator ${label}`, ["scripts/validate-standard-package-schema.mjs", file]);
      expectPass(`dist canonical schema validator ${label}`, ["dist/yeeflow-app-builder-plugin/scripts/validate-standard-package-schema.mjs", file]);
    }
  }

  console.log(JSON.stringify({ status: "pass", cases: cases.length + 1 }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
