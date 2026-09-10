import { planningIdentity } from "./planned-field-constraints.mjs";
import { loadRegistry, validate } from "../product-schema/runtime.mjs";

const registry = loadRegistry();
const native = registry.resources["workflow/node/SequenceFlow/schema.json"];
const conditionsRegistry = { resources: { condition: { schema: native.schema.properties.properties.properties.conditioninfo, issues: [] } } };

export function resolveApprovalBranches(branches, nodes, endId) {
  if (!Array.isArray(branches) || branches.length < 2) {
    throw new Error("APPROVAL_GATEWAY_BRANCHES_REQUIRED: declare at least two explicit branches with target and native conditioninfo");
  }
  return branches.map((branch) => {
    if (!branch || !Array.isArray(branch.conditioninfo) || !branch.conditioninfo.length) {
      throw new Error("APPROVAL_GATEWAY_CONDITION_REQUIRED");
    }
    const checked = validate(conditionsRegistry, "condition", branch.conditioninfo);
    if (!checked.valid) throw new Error(`APPROVAL_GATEWAY_CONDITION_INVALID: ${JSON.stringify(checked.errors)}`);
    const target = planningIdentity(branch.target);
    const matches = nodes.filter((node) => planningIdentity(node.properties.plannedWorkflowNodeName) === target);
    if (target !== "end" && matches.length !== 1) throw new Error(`APPROVAL_GATEWAY_TARGET_UNRESOLVED: ${branch.target}`);
    return { name: String(branch.name || branch.target), targetId: target === "end" ? endId : matches[0].id, conditioninfo: structuredClone(branch.conditioninfo) };
  });
}
