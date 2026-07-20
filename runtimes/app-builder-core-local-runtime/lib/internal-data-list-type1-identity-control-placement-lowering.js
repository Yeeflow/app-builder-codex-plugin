export function lowerDataListType1IdentityControlPlacementAtHost(intent, snapshot, context) {
    if (!intent || !snapshot || !context)
        throw new Error("TEMPLATE_GRAPH_REFERENCE_MISSING");
    if (!valid(intent.templateId) || !valid(intent.templateScope) || !valid(intent.fieldsGridNodeRef) || !valid(intent.controlSlotRef) || !valid(context.controlId))
        throw new Error("TEMPLATE_GRAPH_REFERENCE_INVALID");
    if (snapshot.templateId !== intent.templateId || snapshot.templateScope !== intent.templateScope)
        throw new Error("TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH");
    const nodes = snapshot.nodes || [];
    const slots = snapshot.slots || [];
    if (duplicates(nodes.map((node) => node.reference)) || duplicates(slots.map((slot) => slot.reference)))
        throw new Error("TEMPLATE_GRAPH_REFERENCE_DUPLICATE");
    const grid = nodes.find((node) => node.reference === intent.fieldsGridNodeRef);
    const slot = slots.find((item) => item.reference === intent.controlSlotRef);
    if (!grid || !slot)
        throw new Error("TEMPLATE_GRAPH_REFERENCE_MISSING");
    if (grid.scope !== intent.templateScope || slot.scope !== intent.templateScope)
        throw new Error("TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH");
    if (slot.parentReference !== grid.reference)
        throw new Error("TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN");
    const descriptor = clone(intent.descriptor);
    const { type, ...rest } = descriptor;
    return freeze({ type, id: context.controlId, ...rest });
}
function valid(value) { return typeof value === "string" && value.trim().length > 0; }
function duplicates(values) { return new Set(values).size !== values.length; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function freeze(value) { if (value && typeof value === "object") {
    for (const item of Object.values(value))
        freeze(item);
    Object.freeze(value);
} return value; }
//# sourceMappingURL=internal-data-list-type1-identity-control-placement-lowering.js.map