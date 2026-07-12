function graphRefId(ref) {
  if (!ref) return "";
  if (typeof ref === "string") return String(ref);
  return String(ref.id || ref.resourceid || ref.resourceId || "");
}

function canonicalGraphRef(value) {
  const id = graphRefId(value);
  return id ? { id, resourceid: id } : null;
}

function inspectCanonicalGraphRef(ref) {
  const id = ref && typeof ref === "object" ? String(ref.id || "") : "";
  const resourceid = ref && typeof ref === "object" ? String(ref.resourceid || "") : "";
  return {
    id,
    resourceid,
    legacyResourceId: ref && typeof ref === "object" ? String(ref.resourceId || "") : "",
    valid: Boolean(id && resourceid && id === resourceid),
  };
}

function normalizeApprovalWorkflowGraphReferences(childshapes) {
  return (Array.isArray(childshapes) ? childshapes : []).map((shape) => {
    if (!shape || typeof shape !== "object") return shape;
    const shapeId = graphRefId(shape);
    const normalized = {
      ...shape,
      ...(shapeId ? { id: shapeId, resourceid: shapeId } : {}),
    };
    delete normalized.resourceId;

    for (const key of ["incoming", "outgoing"]) {
      if (!Array.isArray(shape[key])) continue;
      normalized[key] = shape[key].map(canonicalGraphRef).filter(Boolean);
    }
    if (shape?.stencil?.id === "SequenceFlow") {
      normalized.source = canonicalGraphRef(shape.source);
      normalized.target = canonicalGraphRef(shape.target);
    }
    return normalized;
  });
}

module.exports = {
  canonicalGraphRef,
  graphRefId,
  inspectCanonicalGraphRef,
  normalizeApprovalWorkflowGraphReferences,
};
