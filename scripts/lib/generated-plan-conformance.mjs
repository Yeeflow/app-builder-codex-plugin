import zlib from "node:zlib";
import { planningIdentity, plannedBoolean } from "./planned-field-constraints.mjs";

export function validateGeneratedPlanConformance(decoded, demand) {
  const findings = [];
  const fail = (code, message) => findings.push({level:"error",code:`PLAN_CONFORMANCE_${code}`,message});
  for (const [name, specs] of Object.entries(demand.dataListFieldSpecs || {})) {
    const matches = (decoded.Childs || []).filter(c => planningIdentity(c.List?.Title) === name);
    if (matches.length !== 1) { fail("LIST_MISSING_OR_AMBIGUOUS", name); continue; }
    for (const spec of specs) {
      const fields = matches[0].Fields.filter(f => planningIdentity(f.DisplayName) === planningIdentity(spec.displayName));
      if (fields.length !== 1) { fail("FIELD_MISSING_OR_AMBIGUOUS", `${name}: ${spec.displayName}; generated labels: ${matches[0].Fields.map(f => f.DisplayName).join(", ")}`); continue; }
      const field = fields[0];
      const rules = field.Rules ? JSON.parse(field.Rules) : {};
      if (spec.required !== undefined && rules.required !== spec.required) fail("FIELD_REQUIRED", spec.displayName);
      if (spec.unique !== undefined && field.IsUnique !== spec.unique) fail("FIELD_UNIQUE", spec.displayName);
      if (planningIdentity(spec.controlType) === "currency" && field.Type !== "currency") fail("FIELD_CONTROL", spec.displayName);
      if (spec.defaultValue !== undefined && spec.defaultValue !== "") {
        const value = field.FieldType === "Bit" ? (plannedBoolean(spec.defaultValue, spec.displayName) ? "1" : "0") : String(spec.defaultValue);
        if (field.DefaultValue !== value) fail("FIELD_DEFAULT", spec.displayName);
      }
    }
  }
  for (const [name, specs] of Object.entries(demand.approvalWorkflowNodeSpecs || {})) {
    const form = (decoded.Forms || []).find(f => planningIdentity(f.Name) === name);
    if (!form) { fail("APPROVAL_MISSING", name); continue; }
    const bytes = Buffer.from(form.DefResource, "base64");
    const def = JSON.parse(zlib.brotliDecompressSync(bytes.subarray(10)).toString());
    const flatten = shapes => (shapes || []).flatMap(s => [s, ...flatten(s.children || s.childshapes)]);
    const shapes = flatten(def.childshapes);
    for (const spec of specs) {
      if (["StartNoneEvent","EndNoneEvent","EndRejectEvent","SequenceFlow"].includes(spec.nodeType)) continue;
      const matches = shapes.filter(s => planningIdentity(s.properties?.plannedOriginalWorkflowNodeName || s.properties?.plannedWorkflowNodeName || s.properties?.name) === planningIdentity(spec.nodeName));
      if (matches.length !== 1) { fail("NODE_MISSING_OR_AMBIGUOUS", spec.nodeName); continue; }
      const node = matches[0];
      if (["Loop","ExclusiveGateway","InclusiveGateway"].includes(spec.nodeType) && node.stencil?.id !== spec.nodeType) fail("NODE_TYPE", spec.nodeName);
      if (/Gateway$/.test(spec.nodeType) && node.outgoing.length < 2) fail("GATEWAY_BRANCHES", spec.nodeName);
      if (spec.nodeType === "Loop" && !shapes.some(s => s.id === node.bodyRef && s.stencil?.id === "LoopBody" && s.children?.length)) fail("LOOP_BODY", spec.nodeName);
    }
  }
  return findings;
}
