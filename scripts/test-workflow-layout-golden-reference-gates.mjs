#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VALIDATOR = path.join(ROOT, "scripts/validate-workflow-layout-golden-reference.mjs");
const MATERIALIZER = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-layout-golden-reference-"));
const cases = [];

try {
  expectPass("reference registry passes standalone validation", ["--reference-only"]);
  cases.push({ case: "pass: workflow layout reference registry is complete", status: "pass" });

  expectPass("readable workflow resource passes layout gate", ["--resource", writeResource("good-workflow.json", readableWorkflow())]);
  cases.push({ case: "pass: readable lane-based workflow resource", status: "pass" });

  expectCode("duplicate node coordinates fail", mutateReadable("duplicate-position.json", (def) => {
    const nodes = def.childshapes.filter((shape) => shape.stencil.id !== "SequenceFlow");
    nodes[2].position = { ...nodes[1].position };
  }), "WORKFLOW_LAYOUT_NODE_POSITION_COLLISION");
  cases.push({ case: "fail: duplicate workflow node positions", status: "pass" });

  expectCode("near-collision node coordinates fail", mutateReadable("near-position.json", (def) => {
    const nodes = def.childshapes.filter((shape) => shape.stencil.id !== "SequenceFlow");
    nodes[2].position = { x: nodes[1].position.x + 20, y: nodes[1].position.y + 20 };
  }), "WORKFLOW_LAYOUT_NODE_POSITION_TOO_CLOSE");
  cases.push({ case: "fail: near-collision workflow node positions", status: "pass" });

  expectCode("approval task missing rejected outcome fails", mutateReadable("approval-missing-rejected.json", (def) => {
    def.childshapes = def.childshapes.filter((shape) => shape.id !== "flow-rejected");
  }), "WORKFLOW_LAYOUT_APPROVAL_TASK_OUTCOME_MISSING");
  cases.push({ case: "fail: approval assignment task missing rejected outcome", status: "pass" });

  expectCode("complete task missing completed outcome fails", mutateReadable("complete-missing-completed.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    review.properties.tasktype = "complete";
  }), "WORKFLOW_LAYOUT_COMPLETE_TASK_OUTCOME_MISSING");
  cases.push({ case: "fail: complete assignment task missing completed outcome", status: "pass" });

  expectCode("complete task misspelled completed outcome fails", mutateReadable("complete-misspelled-completed.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    const end = def.childshapes.find((shape) => shape.id === "end");
    review.properties.tasktype = "complete";
    def.childshapes.push(flow("flow-misspelled-completed", review, end, "comepleted"));
  }), "WORKFLOW_LAYOUT_COMPLETE_TASK_OUTCOME_MISSPELLED");
  cases.push({ case: "fail: complete assignment task outcome misspelling", status: "pass" });

  expectCode("business branch directly from assignment task fails", mutateReadable("direct-business-branch.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    const end = def.childshapes.find((shape) => shape.id === "end");
    const create = def.childshapes.find((shape) => shape.id === "create");
    def.childshapes.push(flow("flow-amount-high", review, end, "Amount >= 5000"));
    def.childshapes.push(flow("flow-amount-low", review, create, "Amount < 5000"));
  }), "WORKFLOW_LAYOUT_BUSINESS_BRANCH_GATEWAY_MISSING");
  cases.push({ case: "fail: business condition fan-out bypasses InclusiveGateway", status: "pass" });

  expectCode("backward return flow without vertices fails", mutateReadable("backward-return-no-vertices.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    const create = def.childshapes.find((shape) => shape.id === "create");
    def.childshapes.push(flow("flow-return", create, review, "Reject and return"));
  }), "WORKFLOW_LAYOUT_BACKWARD_FLOW_VERTICES_MISSING");
  cases.push({ case: "fail: backward return flow missing vertices", status: "pass" });

  expectCode("end reject collecting too many sources fails", mutateReadable("end-reject-too-many.json", (def) => {
    const reject = def.childshapes.find((shape) => shape.id === "reject");
    for (let index = 0; index < 3; index += 1) {
      const extra = node(`extra-review-${index}`, "MultiAssignmentTask", `Extra Review ${index + 1}`, 720 + index * 305, 520);
      def.childshapes.push(extra);
      def.childshapes.push(flow(`flow-extra-rejected-${index}`, extra, reject, "Rejected"));
      def.childshapes.push(flow(`flow-extra-approved-${index}`, extra, def.childshapes.find((shape) => shape.id === "end"), "Approved"));
    }
  }), "WORKFLOW_LAYOUT_END_REJECT_TOO_MANY_SOURCES");
  cases.push({ case: "fail: end reject collects more than three approval sources", status: "pass" });

  expectCode("end reject shared across different horizontal lanes fails", mutateReadable("end-reject-cross-lane.json", (def) => {
    const reject = def.childshapes.find((shape) => shape.id === "reject");
    const extra = node("extra-review-cross-lane", "MultiAssignmentTask", "Extra Cross Lane Review", 720, 360);
    def.childshapes.push(extra);
    def.childshapes.push(flow("flow-extra-cross-lane-rejected", extra, reject, "Rejected", [{ x: 860, y: 360 }, { x: 860, y: 520 }]));
    def.childshapes.push(flow("flow-extra-cross-lane-approved", extra, def.childshapes.find((shape) => shape.id === "end"), "Approved"));
  }), "WORKFLOW_LAYOUT_END_REJECT_SOURCE_LANES_MISMATCH");
  cases.push({ case: "fail: end reject shared by approval tasks on different horizontal lanes", status: "pass" });

  expectCode("first-row end reject placed below source row fails", mutateReadable("end-reject-first-row-below.json", (def) => {
    const reject = def.childshapes.find((shape) => shape.id === "reject");
    reject.position = { x: 420, y: 520 };
  }), "WORKFLOW_LAYOUT_END_REJECT_ROW_DIRECTION_MISMATCH");
  cases.push({ case: "fail: first-row approval reject endpoint must be above source row", status: "pass" });

  expectCode("three-source shared end reject not centered fails", mutateReadable("end-reject-three-source-off-center.json", (def) => {
    const reject = def.childshapes.find((shape) => shape.id === "reject");
    const end = def.childshapes.find((shape) => shape.id === "end");
    end.position = { x: 1500, y: 220 };
    const extraA = node("extra-review-a", "MultiAssignmentTask", "Extra Review A", 720, 220);
    const extraB = node("extra-review-b", "MultiAssignmentTask", "Extra Review B", 1020, 220);
    reject.position = { x: 900, y: 80 };
    def.childshapes.push(extraA);
    def.childshapes.push(extraB);
    def.childshapes.push(flow("flow-extra-a-rejected", extraA, reject, "Rejected", [{ x: 860, y: 220 }, { x: 860, y: 80 }]));
    def.childshapes.push(flow("flow-extra-a-approved", extraA, end, "Approved", [{ x: 900, y: 220 }, { x: 900, y: 300 }, { x: 1500, y: 300 }]));
    def.childshapes.push(flow("flow-extra-b-rejected", extraB, reject, "Rejected", [{ x: 1160, y: 220 }, { x: 1160, y: 80 }]));
    def.childshapes.push(flow("flow-extra-b-approved", extraB, end, "Approved", [{ x: 1200, y: 220 }, { x: 1200, y: 300 }, { x: 1500, y: 300 }]));
  }), "WORKFLOW_LAYOUT_END_REJECT_POSITION_MISMATCH");
  cases.push({ case: "fail: shared end reject must be centered on three source task centers", status: "pass" });

  expectCode("workflow using more than five vertical rows fails", mutateReadable("too-many-rows.json", (def) => {
    for (let index = 0; index < 4; index += 1) {
      def.childshapes.push(node(`extra-row-${index}`, "ContentList", `Extra Row ${index + 1}`, 100 + index * 320, 700 + index * 120));
    }
  }), "WORKFLOW_LAYOUT_TOO_MANY_VERTICAL_ROWS");
  cases.push({ case: "fail: workflow exceeds five vertical rows", status: "pass" });

  expectCode("large workflow spread on one long horizontal line fails", mutateReadable("single-row-sprawl.json", (def) => {
    const nodes = def.childshapes.filter((shape) => shape.stencil.id !== "SequenceFlow");
    nodes.forEach((node, index) => {
      node.position = { x: 100 + index * 360, y: 220 };
    });
    for (let index = 0; index < 6; index += 1) {
      def.childshapes.push(node(`extra-sprawl-${index}`, "ContentList", `Extra Sprawl ${index + 1}`, 1900 + index * 360, 220));
    }
  }), "WORKFLOW_LAYOUT_SINGLE_ROW_SPRAWL");
  cases.push({ case: "fail: large workflow uses a single over-wide horizontal row", status: "pass" });

  expectCode("compressed complex graph fails", mutateReadable("compressed.json", (def) => {
    const nodes = def.childshapes.filter((shape) => shape.stencil.id !== "SequenceFlow");
    nodes.forEach((node, index) => {
      node.position = { x: 100 + index * 30, y: 220 };
    });
  }), "WORKFLOW_LAYOUT_GRAPH_TOO_COMPRESSED");
  cases.push({ case: "fail: complex graph compressed into unreadable span", status: "pass" });

  const packagePath = materializeApprovalPackage();
  expectPass("materialized generated-final package passes workflow layout gate", ["--package", packagePath]);
  cases.push({ case: "pass: materializer emits lane-based readable Approval workflow layout", status: "pass" });

  console.log(JSON.stringify({
    status: "pass",
    test: path.basename(fileURLToPath(import.meta.url)),
    cases,
  }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function expectPass(label, args) {
  const result = runValidator(args);
  assert.equal(result.status, 0, `${label}\nstdout=${result.stdout}\nstderr=${result.stderr}`);
}

function expectCode(label, resourcePath, expectedCode) {
  const result = runValidator(["--resource", resourcePath]);
  assert.notEqual(result.status, 0, `${label} should fail`);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "fail", label);
  assert.ok(report.findings.some((finding) => finding.code === expectedCode), `${label} expected ${expectedCode}\n${result.stdout}`);
}

function runValidator(args) {
  return spawnSync(process.execPath, [VALIDATOR, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function mutateReadable(fileName, mutate) {
  const resource = readableWorkflow();
  mutate(resource);
  return writeResource(fileName, resource);
}

function writeResource(fileName, resource) {
  const filePath = path.join(tempDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(resource, null, 2));
  return filePath;
}

function readableWorkflow() {
  const nodes = {
    start: node("start", "StartNoneEvent", "Start", 100, 220),
    review: node("review", "MultiAssignmentTask", "Review", 420, 220),
    create: node("create", "ContentList", "Create record", 720, 360),
    end: node("end", "EndNoneEvent", "End", 1020, 220),
    reject: node("reject", "EndRejectEvent", "Rejected", 420, 80),
  };
  return {
    lineType: "rounded",
    graphver: 2,
    graphzoom: 1,
    graphposition: { x: -60, y: 60, width: 1240, height: 640 },
    childshapes: [
      nodes.start,
      flow("flow-submit", nodes.start, nodes.review, "Submit"),
      flow("flow-approved", nodes.review, nodes.create, "Approved", [{ x: 560, y: 220 }, { x: 560, y: 360 }]),
      flow("flow-rejected", nodes.review, nodes.reject, "Rejected", [{ x: 720, y: 220 }, { x: 720, y: 80 }, { x: 540, y: 80 }]),
      flow("flow-complete", nodes.create, nodes.end, "Complete", [{ x: 870, y: 360 }, { x: 870, y: 220 }]),
      nodes.review,
      nodes.create,
      nodes.end,
      nodes.reject,
    ],
  };
}

function node(id, stencil, name, x, y) {
  return {
    id,
    resourceid: id,
    stencil: { id: stencil },
    position: { x, y },
    incoming: [],
    outgoing: [],
    properties: { name },
  };
}

function flow(id, source, target, name, vertices = []) {
  const resource = {
    id,
    resourceid: id,
    stencil: { id: "SequenceFlow" },
    source: { id: source.id, resourceid: source.id },
    target: { id: target.id, resourceid: target.id },
    properties: { name, linetype: "rounded", documentation: "" },
    incoming: [{ id: source.id, resourceid: source.id }],
    outgoing: [{ id: target.id, resourceid: target.id }],
    dockers: [],
  };
  if (vertices.length) resource.vertices = vertices;
  source.outgoing.push({ id, resourceid: id });
  target.incoming.push({ id, resourceid: id });
  return resource;
}

function materializeApprovalPackage() {
  const spec = path.join(tempDir, "functional-specification.md");
  const plan = path.join(tempDir, "yeeflow-app-plan.md");
  const outDir = path.join(tempDir, "out");
  const idManifest = path.join(tempDir, "api-issued-ids.json");
  fs.writeFileSync(spec, [
    "# Functional Specification: Workflow Layout Test",
    "",
    "| Application Name | Workflow Layout Test |",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
  ].join("\n"));
  fs.writeFileSync(plan, approvalPlanMarkdown());
  fs.writeFileSync(idManifest, JSON.stringify({
    ids: Array.from({ length: 180 }, (_, index) => String(970000000000000001n + BigInt(index))),
  }, null, 2));
  const result = spawnSync(process.execPath, [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", outDir,
    "--api-id-manifest", idManifest,
    "--tenant-id", "1234567890123456",
    "--json",
  ], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "pass");
  assert.equal(fs.existsSync(report.outputs.package), true);
  return report.outputs.package;
}

function approvalPlanMarkdown() {
  return [
    "# Yeeflow App Plan: Workflow Layout Test",
    "",
    "## Plan Status",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
    "",
    "## 4. Data Lists and Document Libraries Plan",
    "",
    "### 4.1 Vendor Requests",
    "",
    "| Field Name | Type | Purpose |",
    "| --- | --- | --- |",
    "| Vendor Name | Text | Vendor identity. |",
    "",
    "### 4.2 Vendor Master",
    "",
    "| Field Name | Type | Purpose |",
    "| --- | --- | --- |",
    "| Vendor Name | Text | Approved vendor. |",
    "",
    "## 5. Approval Forms Plan",
    "",
    "### 5.1 Vendor Approval",
    "",
    "##### Submission Form Fields",
    "",
    "| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Proof Label |",
    "| --- | --- | --- | --- | --- | --- |",
    "| 1 | Vendor Name | VendorName | Text | input | Generated-final validation |",
    "",
    "##### Task Form Fields",
    "",
    "| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Read Only | Proof Label |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | Vendor Name | VendorName | Text | input | Yes | Generated-final validation |",
    "",
    "#### Approval Workflow Nodes",
    "",
    "| Step | Node Name | Node Type | Description | Assignee/Role | Assignment Strategy | Outcomes | Condition/Branch | Data Read/Write | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | Department Manager Review | MultiAssignmentTask | Manager review. | Department Manager | Role based | Approved; Rejected | Always | Read request | Generated-final validation |",
    "| 2 | Procurement Review | MultiAssignmentTask | Procurement review. | Procurement | Role based | Approved; Rejected | Always | Read request | Generated-final validation |",
    "| 3 | Finance Review | MultiAssignmentTask | Finance approval. | Finance Manager | Job position | Approved; Rejected | Always | Read request | Generated-final validation |",
    "| 4 | Create Vendor Master | ContentList | Create approved vendor record. | System | System action | Complete | Approved path only | Vendor Master create | Generated-final validation |",
  ].join("\n");
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
