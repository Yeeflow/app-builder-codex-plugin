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

  expectCode("submitted connector with cosmetic vertices fails", mutateReadable("submitted-with-vertices.json", (def) => {
    const submit = def.childshapes.find((shape) => shape.id === "flow-submit");
    submit.properties.name = "Submitted";
    submit.vertices = [{ x: 260, y: 220 }];
  }), "WORKFLOW_LAYOUT_SUBMITTED_VERTICES_UNNECESSARY");
  cases.push({ case: "fail: submitted connector must not carry unnecessary vertices", status: "pass" });

  expectCode("direct same-row forward connector with cosmetic vertices fails", mutateReadable("direct-forward-with-vertices.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    const sameRowAction = node("same-row-action", "ContentList", "Same Row Action", 720, 220);
    def.childshapes.push(sameRowAction);
    def.childshapes.push(flow("flow-review-to-same-row-action", review, sameRowAction, "Approved", [{ x: 560, y: 220 }, { x: 650, y: 220 }]));
  }), "WORKFLOW_LAYOUT_DIRECT_FORWARD_VERTICES_UNNECESSARY");
  cases.push({ case: "fail: direct same-row forward connector should use auto-routing", status: "pass" });

  expectCode("row-gap return route not at midpoint fails", mutateReadable("row-gap-return-not-midpoint.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    const create = def.childshapes.find((shape) => shape.id === "create");
    def.childshapes.push(flow("flow-return-wrong-route-y", create, review, "Reject and return", [{ x: 815, y: 350 }, { x: 515, y: 350 }]));
  }), "WORKFLOW_LAYOUT_ROUTE_Y_NOT_ROW_GAP_MIDPOINT");
  cases.push({ case: "fail: row-gap return route must use midpoint routeY", status: "pass" });

  expectCode("multi-row long return route cannot cross an intermediate row", mutateReadable("multi-row-return-crosses-intermediate-row.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    review.position = { x: 420, y: 160 };
    const middle = node("middle-review-row", "MultiAssignmentTask", "Middle Review Row", 980, 320);
    const clarification = node("request-clarification", "MultiAssignmentTask", "Request clarification", 1420, 480);
    def.childshapes.push(middle, clarification);
    def.childshapes.push(flow("flow-clarification-completed-crosses-middle-row", clarification, review, "Completed", [{ x: 1550, y: 363 }, { x: 520, y: 363 }]));
  }), "WORKFLOW_LAYOUT_ROUTE_Y_CROSSES_INTERMEDIATE_ROW");
  cases.push({ case: "fail: multi-row long return route cannot cross intermediate row bounds", status: "pass" });

  expectCode("long vertical route cannot cross an intermediate node column", mutateReadable("vertical-route-crosses-intermediate-column.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    review.position = { x: 420, y: 160 };
    const middle = node("middle-column-review", "MultiAssignmentTask", "Middle Column Review", 980, 320);
    const clarification = node("request-clarification", "MultiAssignmentTask", "Request clarification", 1420, 480);
    def.childshapes.push(middle, clarification);
    def.childshapes.push(flow("flow-vertical-segment-crosses-middle-column", review, clarification, "Completed", [{ x: 1075, y: 220 }, { x: 1075, y: 520 }]));
  }), "WORKFLOW_LAYOUT_ROUTE_X_CROSSES_INTERMEDIATE_COLUMN");
  cases.push({ case: "fail: long vertical route cannot cross intermediate node column bounds", status: "pass" });

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

  expectCode("local end reject cannot collect distant same-lane sources", mutateReadable("end-reject-source-span-too-wide.json", (def) => {
    const reject = def.childshapes.find((shape) => shape.id === "reject");
    const end = def.childshapes.find((shape) => shape.id === "end");
    end.position = { x: 2600, y: 220 };
    const farA = node("far-review-a", "MultiAssignmentTask", "Far Review A", 1120, 220);
    const farB = node("far-review-b", "MultiAssignmentTask", "Far Review B", 1940, 220);
    reject.position = { x: 1180, y: 80 };
    def.childshapes.push(farA, farB);
    def.childshapes.push(flow("flow-far-a-rejected", farA, reject, "Rejected", [{ x: 1260, y: 220 }, { x: 1260, y: 80 }]));
    def.childshapes.push(flow("flow-far-a-approved", farA, end, "Approved", [{ x: 1300, y: 220 }, { x: 1300, y: 300 }, { x: 2600, y: 300 }]));
    def.childshapes.push(flow("flow-far-b-rejected", farB, reject, "Rejected", [{ x: 2080, y: 220 }, { x: 2080, y: 80 }]));
    def.childshapes.push(flow("flow-far-b-approved", farB, end, "Approved", [{ x: 2120, y: 220 }, { x: 2120, y: 300 }, { x: 2600, y: 300 }]));
  }), "WORKFLOW_LAYOUT_END_REJECT_SOURCE_SPAN_TOO_WIDE");
  cases.push({ case: "fail: shared end reject cannot collect distant same-lane sources", status: "pass" });

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

  expectWarning("medium workflow stretched too wide is advisory only", writeResource("medium-too-wide-warning-only.json", mediumWideWarningOnlyWorkflow()), "WORKFLOW_LAYOUT_MEDIUM_GRAPH_TOO_WIDE");
  cases.push({ case: "warning: medium workflow width is advisory and must not force spacing compression", status: "pass" });

  expectPass("medium workflow wider than advisory width passes when folded into readable rows", ["--resource", writeResource("medium-readable-wide-folded.json", readableWideFoldedWorkflow())]);
  cases.push({ case: "pass: medium workflow may exceed advisory width when folded into readable rows", status: "pass" });

  expectCode("complex row node density fails", mutateReadable("row-density-too-high.json", (def) => {
    const nodes = def.childshapes.filter((shape) => shape.stencil.id !== "SequenceFlow");
    nodes.forEach((node, index) => {
      node.position = { x: 100 + index * 280, y: index % 2 === 0 ? 220 : 360 };
    });
    for (let index = 0; index < 10; index += 1) {
      def.childshapes.push(node(`dense-row-${index}`, "ContentList", `Dense Row ${index + 1}`, 1300 + index * 220, 220));
    }
  }), "WORKFLOW_LAYOUT_ROW_NODE_DENSITY_TOO_HIGH");
  cases.push({ case: "fail: complex workflow row cannot contain too many nodes", status: "pass" });

  expectCode("gateway sibling labels on same lane fail", mutateReadable("gateway-label-congestion.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    const create = def.childshapes.find((shape) => shape.id === "create");
    const end = def.childshapes.find((shape) => shape.id === "end");
    const gateway = node("gateway", "InclusiveGateway", "Budget gateway", 720, 220);
    const security = node("security", "ContentList", "Security Review", 1320, 220);
    const compliance = node("compliance", "ContentList", "Compliance Review", 1320, 250);
    def.childshapes = def.childshapes.filter((shape) => !["flow-approved", "flow-complete"].includes(shape.id));
    def.childshapes.push(gateway, security, compliance);
    def.childshapes.push(flow("flow-approved-to-gateway", review, gateway, "Approved"));
    def.childshapes.push(flow("flow-sensitive-data", gateway, security, "Contains Sensitive Data = true"));
    def.childshapes.push(flow("flow-software-license", gateway, compliance, "Software License Required = true"));
    def.childshapes.push(flow("flow-security-done", security, create, "Done", [{ x: 1420, y: 220 }, { x: 1420, y: 360 }]));
    def.childshapes.push(flow("flow-compliance-done", compliance, create, "Done", [{ x: 1480, y: 250 }, { x: 1480, y: 360 }]));
    def.childshapes.push(flow("flow-complete-readded", create, end, "Complete", [{ x: 870, y: 360 }, { x: 870, y: 220 }]));
  }), "WORKFLOW_LAYOUT_GATEWAY_BRANCH_LABEL_CONGESTION");
  cases.push({ case: "fail: long gateway branch labels cannot share one lane", status: "pass" });

  expectCode("shared vertical route lane density fails", mutateReadable("vertical-route-lane-density.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    const create = def.childshapes.find((shape) => shape.id === "create");
    create.position = { x: 720, y: 520 };
    const end = def.childshapes.find((shape) => shape.id === "end");
    end.position = { x: 1020, y: 80 };
    const extra = node("extra-vertical-target", "ContentList", "Extra vertical target", 1020, 520);
    def.childshapes.push(extra);
    def.childshapes.push(flow("flow-shared-lane-a", review, create, "Sensitive data", [{ x: 665, y: 140 }, { x: 665, y: 560 }]));
    def.childshapes.push(flow("flow-shared-lane-b", review, end, "Software license", [{ x: 670, y: 140 }, { x: 670, y: 560 }]));
    def.childshapes.push(flow("flow-shared-lane-c", create, extra, "Need more information", [{ x: 660, y: 140 }, { x: 660, y: 560 }]));
  }), "WORKFLOW_LAYOUT_VERTICAL_ROUTE_LANE_DENSITY_TOO_HIGH");
  cases.push({ case: "fail: long vertical route segments cannot stack into one visual lane", status: "pass" });

  expectCode("gateway branches cannot target distant nodes", mutateReadable("gateway-branch-too-far.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    const create = def.childshapes.find((shape) => shape.id === "create");
    const gateway = node("local-branch-gateway", "InclusiveGateway", "Budget gateway", 720, 220);
    const nearTarget = node("near-branch-target", "MultiAssignmentTask", "Near branch target", 1040, 80);
    const farTarget = node("far-branch-target", "MultiAssignmentTask", "Far branch target", 1840, 360);
    def.childshapes = def.childshapes.filter((shape) => !["flow-approved"].includes(shape.id));
    def.childshapes.push(gateway, nearTarget, farTarget);
    def.childshapes.push(flow("flow-review-to-local-gateway", review, gateway, "Approved"));
    def.childshapes.push(flow("flow-gateway-near", gateway, nearTarget, "Budget > 1000"));
    def.childshapes.push(flow("flow-gateway-far", gateway, farTarget, "Sensitive data"));
    def.childshapes.push(flow("flow-near-target-done", nearTarget, create, "Completed", [{ x: 1150, y: 123 }, { x: 1150, y: 403 }]));
    def.childshapes.push(flow("flow-far-target-done", farTarget, create, "Completed", [{ x: 1970, y: 403 }, { x: 870, y: 403 }]));
  }), "WORKFLOW_LAYOUT_GATEWAY_BRANCH_TOO_FAR");
  cases.push({ case: "fail: gateway fan-out targets must stay local to the gateway", status: "pass" });

  expectCode("multi-source end merge cannot be far from source group", mutateReadable("end-merge-too-far.json", (def) => {
    const create = def.childshapes.find((shape) => shape.id === "create");
    const end = def.childshapes.find((shape) => shape.id === "end");
    const extra = node("extra-end-source", "MultiAssignmentTask", "Extra End Source", 1020, 80);
    end.position = { x: 2400, y: 220 };
    def.childshapes.push(extra);
    def.childshapes.push(flow("flow-extra-end-source-complete", extra, end, "Completed", [{ x: 1160, y: 123 }, { x: 1160, y: 263 }]));
    def.childshapes.push(flow("flow-create-to-end-readded", create, end, "Completed", [{ x: 870, y: 403 }, { x: 870, y: 263 }]));
  }), "WORKFLOW_LAYOUT_END_MERGE_TOO_FAR");
  cases.push({ case: "fail: final End merge must stay local to incoming branches", status: "pass" });

  expectCode("local rejected connector cannot carry unnecessary vertices", mutateReadable("local-reject-with-vertices.json", (def) => {
    const rejected = def.childshapes.find((shape) => shape.id === "flow-rejected");
    rejected.vertices = [{ x: 540, y: 220 }, { x: 540, y: 80 }];
  }), "WORKFLOW_LAYOUT_LOCAL_REJECT_VERTICES_UNNECESSARY");
  cases.push({ case: "fail: local rejected connector should not use vertices", status: "pass" });

  expectCode("overlong connector display label fails", mutateReadable("connector-label-too-long.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    const create = def.childshapes.find((shape) => shape.id === "create");
    const gateway = node("label-length-gateway", "InclusiveGateway", "Label length gateway", 720, 220);
    const security = node("label-length-security", "MultiAssignmentTask", "Security Review", 1040, 80);
    def.childshapes = def.childshapes.filter((shape) => !["flow-approved"].includes(shape.id));
    def.childshapes.push(gateway, security);
    def.childshapes.push(flow("flow-review-to-label-length-gateway", review, gateway, "Approved"));
    def.childshapes.push(flow("flow-overlong-business-condition-label", gateway, security, "Software License Required And Sensitive Data Is True"));
    def.childshapes.push(flow("flow-label-length-security-done", security, create, "Completed", [{ x: 1150, y: 123 }, { x: 1150, y: 403 }]));
  }), "WORKFLOW_LAYOUT_CONNECTOR_LABEL_TOO_LONG");
  cases.push({ case: "fail: connector display labels must stay short", status: "pass" });

  expectCode("non-return vertices overused fails", mutateReadable("vertices-overused.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    for (let index = 0; index < 7; index += 1) {
      const target = node(`vertex-overuse-target-${index}`, "ContentList", `Vertex Overuse Target ${index + 1}`, 760 + index * 260, index % 2 === 0 ? 220 : 360);
      def.childshapes.push(target);
      def.childshapes.push(flow(`flow-vertex-overuse-${index}`, review, target, `Branch ${index + 1}`, [
        { x: 600 + index * 20, y: 180 },
        { x: 680 + index * 40, y: 420 },
        { x: 820 + index * 90, y: target.position.y },
      ]));
    }
  }), "WORKFLOW_LAYOUT_VERTICES_OVERUSED");
  cases.push({ case: "fail: generated workflow cannot rely on many non-return connector vertices", status: "pass" });

  expectCode("connector detour too high fails", mutateReadable("connector-detour-too-high.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    const create = def.childshapes.find((shape) => shape.id === "create");
    create.position = { x: 1020, y: 360 };
    def.childshapes.push(flow("flow-large-detour", review, create, "Sensitive data", [
      { x: 520, y: -320 },
      { x: 1900, y: -320 },
      { x: 1900, y: 760 },
      { x: 1120, y: 760 },
    ]));
  }), "WORKFLOW_LAYOUT_CONNECTOR_DETOUR_TOO_HIGH");
  cases.push({ case: "fail: connector detours cannot compensate for poor node layout", status: "pass" });

  expectCode("long connector labels overlapping each other fail", mutateReadable("connector-label-overlap.json", (def) => {
    const review = def.childshapes.find((shape) => shape.id === "review");
    const create = def.childshapes.find((shape) => shape.id === "create");
    const end = def.childshapes.find((shape) => shape.id === "end");
    create.position = { x: 900, y: 220 };
    end.position = { x: 1280, y: 220 };
    def.childshapes.push(flow("flow-long-label-a", review, create, "Software License Required = true"));
    def.childshapes.push(flow("flow-long-label-b", review, end, "Budget Amount <= 1000"));
  }), "WORKFLOW_LAYOUT_CONNECTOR_LABEL_COLLISION");
  cases.push({ case: "fail: long connector labels cannot overlap", status: "pass" });

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

function expectWarning(label, resourcePath, expectedCode) {
  const result = runValidator(["--resource", resourcePath]);
  assert.equal(result.status, 0, `${label} should pass with warning\nstdout=${result.stdout}\nstderr=${result.stderr}`);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "pass", label);
  assert.ok(report.findings.some((finding) => finding.level === "warning" && finding.code === expectedCode), `${label} expected warning ${expectedCode}\n${result.stdout}`);
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
      flow("flow-approved", nodes.review, nodes.create, "Approved"),
      flow("flow-rejected", nodes.review, nodes.reject, "Rejected"),
      flow("flow-complete", nodes.create, nodes.end, "Complete"),
      nodes.review,
      nodes.create,
      nodes.end,
      nodes.reject,
    ],
  };
}

function readableWideFoldedWorkflow() {
  return {
    lineType: "rounded",
    graphver: 2,
    graphzoom: 1,
    graphposition: { x: -80, y: 40, width: 3300, height: 760 },
    childshapes: Array.from({ length: 17 }, (_, index) => {
      const row = Math.floor(index / 6);
      const col = index % 6;
      return node(`folded-${index}`, index === 0 ? "StartNoneEvent" : index === 16 ? "EndNoneEvent" : "ContentList", `Folded Step ${index + 1}`, 100 + col * 560, 140 + row * 170);
    }),
  };
}

function mediumWideWarningOnlyWorkflow() {
  const childshapes = [];
  for (let index = 0; index < 14; index += 1) {
    const row = Math.floor(index / 5);
    const col = index % 5;
    childshapes.push(node(`medium-warning-${index}`, index === 0 ? "StartNoneEvent" : index === 13 ? "EndNoneEvent" : "ContentList", `Medium Warning ${index + 1}`, 100 + col * 880, 120 + row * 170));
  }
  return {
    lineType: "rounded",
    graphver: 2,
    graphzoom: 1,
    graphposition: { x: -80, y: 40, width: 3950, height: 760 },
    childshapes,
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
    "| 4 | Compliance Review | MultiAssignmentTask | Compliance approval. | Compliance Officer | Job position | Approved; Rejected | Always | Read request | Generated-final validation |",
    "| 5 | Security Review | MultiAssignmentTask | Security approval. | Security Officer | Job position | Approved; Rejected | Always | Read request | Generated-final validation |",
    "| 6 | Director Approval | MultiAssignmentTask | Director approval. | Director | Job position | Approved; Rejected | Always | Read request | Generated-final validation |",
    "| 7 | Create Vendor Master | ContentList | Create approved vendor record. | System | System action | Complete | Approved path only | Vendor Master create | Generated-final validation |",
  ].join("\n");
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
