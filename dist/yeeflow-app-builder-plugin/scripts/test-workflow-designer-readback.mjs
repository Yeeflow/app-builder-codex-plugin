import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildApprovalWorkflowShapes } from "./materialize-full-app-generated-final.mjs";
const require = createRequire(import.meta.url);
const { validateDecodedDef } = require("../validate-ywf-def.js");
const { withApprovalWorkflowDesignerBounds, approvalWorkflowGraphPosition } = require("./lib/approval-workflow-designer-shape-utils.cjs");

function fixture(data = [{type:"str",value:"Synthetic"}]) {
  const childshapes = buildApprovalWorkflowShapes({defId:"100",formKey:"synthetic",rootListSetId:"200",submissionPageId:"submission",taskPageId:"task",startId:"start",endId:"end",rejectEndId:"reject",workflowSteps:[{nodeName:"Create detail rows",nodeType:"Loop",loopRecord:{nodeName:"Create detail rows",mode:"number",expression:[{type:"num",value:"2"}]},loopActions:[{nodeName:"Write detail",parentLoop:"Create detail rows",targetMode:"select",targetResource:"Details",operation:"add",mappings:[{Columns:"Title",TargetType:"Text",Data:data}]}]}],dataListMetas:[{listName:"Details",listId:"300",fields:[{FieldName:"Title",FieldType:"Text"}]}]}).map(withApprovalWorkflowDesignerBounds);
  return {key:"synthetic",defkey:"synthetic",workflowType:2,variables:{basic:[],listref:[],filter:[]},pageurls:[],childshapes,graphposition:approvalWorkflowGraphPosition(childshapes),graphver:2};
}
const report = (def,inputOrigin="generated") => validateDecodedDef(def,{mode:"final",inputOrigin});
test("LoopBody resolves only its own entry flow, with reciprocal target references",()=>{
  const def=fixture();
  assert.ok(!report(def).errors.some(e=>e.code==="OUTGOING_SEQUENCE_MISSING"));
  const body=def.childshapes.find(s=>s.stencil.id==="LoopBody");
  const entry=body.children.find(s=>s.source?.port==="start");
  entry.source.id=entry.source.resourceid="unrelated-container";
  assert.ok(report(def).errors.some(e=>e.code==="OUTGOING_SEQUENCE_MISSING"));
});
test("Designer readback dimension differences warn without relaxing generated layout checks",()=>{
  const def=fixture();def.graphposition.width+=174;
  const code="APPROVAL_WORKFLOW_GRAPHPOSITION_CONTENT_SPAN_MISMATCH";
  assert.ok(report(def).errors.some(e=>e.code===code));
  assert.ok(!report(def,"designer-readback").errors.some(e=>e.code===code));
  assert.ok(report(def,"designer-readback").warnings.some(e=>e.code===code));
  def.graphposition.width=-1;
  assert.ok(report(def,"designer-readback").errors.some(e=>e.code==="APPROVAL_WORKFLOW_GRAPHPOSITION_DIMENSIONS_INVALID"));
  assert.throws(()=>report(def,"unknown"),/INVALID_INPUT_ORIGIN/);
});

test("Approval loop current-row tokens bind to the final owning node, including nested function arguments",()=>{
  const token={exprType:"loop_ctx",key:"LoopItem.Quantity",type:"expr",valueType:"number"};
  const input=[token,{type:"func",func:"round",params:[[token],[{type:"num",value:"2"}]]},{...token,id:"explicit-outer-loop"}];
  const def=fixture(input);
  const loop=def.childshapes.find(s=>s.stencil.id==="Loop");
  const body=def.childshapes.find(s=>s.stencil.id==="LoopBody");
  const data=body.children.find(s=>s.stencil.id==="ContentList").properties.listdatas[0].Data;
  assert.equal(data[0].id,loop.id);
  assert.equal(data[1].params[0][0].id,loop.id);
  assert.equal(data[2].id,"explicit-outer-loop");
  assert.equal(input[0].id,undefined,"must not mutate plan tokens");
});
test("LoopBody rejects missing child targets and missing reciprocal incoming references",()=>{
  for(const breakTarget of [true,false]) {
    const def=fixture();
    const body=def.childshapes.find(s=>s.stencil.id==="LoopBody");
    const entry=body.children.find(s=>s.source?.port==="start");
    if(breakTarget) entry.target.id=entry.target.resourceid="missing-child";
    else body.children.find(s=>s.stencil.id==="ContentList").incoming=[];
    assert.ok(report(def).errors.some(e=>e.code==="OUTGOING_SEQUENCE_MISSING"));
  }
});

test("Loop child actions use canvas coordinates inside their rendered container",()=>{
  const def=fixture();
  const body=def.childshapes.find(s=>s.stencil.id==="LoopBody");
  for(const child of body.children.filter(s=>s.stencil.id!=="SequenceFlow")) {
    assert.ok(child.position.x >= body.position.x);
    assert.ok(child.position.y >= body.position.y+40);
    assert.ok(child.position.x+190 <= body.bounds.lowerRight.x);
    assert.ok(child.position.y+86 <= body.bounds.lowerRight.y);
  }
});
