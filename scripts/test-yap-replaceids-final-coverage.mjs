#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const GZIP_PREFIX = "[______gizp______]";

function field(id, listId, name, index = 0) {
  return {
    FieldID: String(id),
    ListID: String(listId),
    Name: name,
    FieldName: index === 0 ? "Title" : `Text${index + 1}`,
    InternalName: index === 0 ? "Title" : `Text${index + 1}`,
    FieldType: "Text",
    Type: "text",
    Category: 1,
    FieldIndex: index,
    Rules: "{}",
  };
}

function makePackage({ completeReplaceIds }) {
  const rootId = "2065001000000000";
  const listId = "2065001000000001";
  const titleFieldId = "2065001000000002";
  const textFieldId = "2065001000000003";
  const layoutId = "2065001000000004";
  const sampleId = "2065001000000005";
  const formId = "2065001000000006";
  const startId = "2065001000000007";
  const sequenceId = "2065001000000008";
  const endId = "2065001000000009";
  const appGroupId = "2065001000000010";

  const allLocalIds = [
    rootId,
    listId,
    titleFieldId,
    textFieldId,
    layoutId,
    sampleId,
    formId,
    startId,
    sequenceId,
    endId,
    appGroupId,
  ];

  const defResource = {
    defkey: "REPLACEIDS-FORM",
    key: "REPLACEIDS-FORM",
    title: "ReplaceIds Form",
    pageurls: [{
      type: 1,
      pagetype: 1,
      formdef: {
        pagetype: 1,
        name: "ReplaceIds Form",
        title: "ReplaceIds Form",
        attrs: { container: { cw: "2", padding: { "1": { top: 0, right: 0, bottom: 0, left: 0 } } } },
        children: [{ type: "container", label: "Main", attrs: {}, children: [], ver: 1 }],
        exts: [],
        actions: [],
        formAction: {},
        ver: 1,
      },
    }],
    childshapes: [
      { stencil: { id: "StartNoneEvent" }, resourceid: startId, outgoing: [{ resourceid: sequenceId }], properties: { taskurl: "requester-page", taskUrl: "requester-page", TaskUrl: "requester-page" } },
      { stencil: { id: "SequenceFlow" }, resourceid: sequenceId, source: { resourceid: startId }, target: { resourceid: endId } },
      { stencil: { id: "EndNoneEvent" }, resourceid: endId, incoming: [{ resourceid: sequenceId }], properties: {} },
    ],
  };

  const data = {
    Item: {
      ListModel: {
        Title: completeReplaceIds ? "Complete ReplaceIds Fixture" : "Stale ReplaceIds Fixture",
        ListID: rootId,
        Type: 1024,
        Flags: 1,
        LayoutView: JSON.stringify({ sortVer: 1, sort: [{ Title: "ReplaceIds Form", Type: 105, ListID: "REPLACEIDS-FORM" }] }),
      },
      Layouts: [],
    },
    Childs: [{
      ListModel: { Title: "Tickets", ListID: listId, Type: 1, ListType: 1, Flags: 1, CustomType: `ListSite_${rootId}` },
      Defs: [field(titleFieldId, listId, "Title", 0), field(textFieldId, listId, "Ticket Number", 1)],
      Layouts: [{ LayoutID: layoutId, Title: "All Items", Type: 0, LayoutView: JSON.stringify({ layout: [{ Field: "Title", Type: "text" }] }) }],
      ListDatas: { [sampleId]: { ListDataID: sampleId, Title: "Access request", Text2: "T-1001" } },
    }],
    Forms: [{ ID: formId, Name: "ReplaceIds Form", Key: "REPLACEIDS-FORM", ListID: 0, WorkflowType: 2, ProcModelID: formId, DefResource: JSON.stringify(defResource) }],
    AppGroups: [{ ID: appGroupId, Name: "Support Agents", Description: "" }],
  };

  const resource = {
    AppID: 41,
    MainListType: 1024,
    Data: JSON.stringify(data),
    FormKeys: ["REPLACEIDS-FORM"],
    ReplaceIds: completeReplaceIds ? allLocalIds : [rootId, listId],
  };

  return {
    Title: completeReplaceIds ? "Complete ReplaceIds Fixture" : "Stale ReplaceIds Fixture",
    Description: "Synthetic ReplaceIds validation fixture.",
    IconUrl: "service-desk",
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(Buffer.from(JSON.stringify(resource), "utf8")).toString("base64")}`,
  };
}

function writePackage(tmp, name, pkg) {
  const file = path.join(tmp, `${name}.yap`);
  fs.writeFileSync(file, `${JSON.stringify(pkg)}\n`);
  return file;
}

function validate(file) {
  const result = spawnSync(process.execPath, ["validate-yap-package.js", file, "--mode", "generator", "--stage", "final"], { encoding: "utf8" });
  assert.ok(result.stdout.trim(), result.stderr || "validator produced no stdout");
  return JSON.parse(result.stdout);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "replaceids-final-coverage-"));

const stale = validate(writePackage(tmp, "stale", makePackage({ completeReplaceIds: false })));
assert.equal(stale.status, "fail");
assert.ok(stale.errors.some((error) => error.code === "LOCAL_ID_NOT_IN_REPLACEIDS"));

const complete = validate(writePackage(tmp, "complete", makePackage({ completeReplaceIds: true })));
const replaceFindings = [...complete.errors, ...complete.warnings].filter((entry) => String(entry.code).includes("REPLACEIDS") || String(entry.code).includes("LOCAL_ID_NOT_IN_REPLACEIDS"));
assert.deepEqual(replaceFindings, []);

console.log(JSON.stringify({
  status: "pass",
  cases: [
    "stale generated-final ReplaceIds fails",
    "complete generated-final ReplaceIds has no ReplaceIds coverage findings",
  ],
}, null, 2));
