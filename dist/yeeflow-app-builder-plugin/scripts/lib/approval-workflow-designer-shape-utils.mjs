function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function approvalWorkflowNodeSize(stencilId) {
  const id = String(stencilId || "");
  if (/Event$/i.test(id)) return { width: 36, height: 36 };
  if (/Gateway$/i.test(id)) return { width: 46, height: 46 };
  return { width: 190, height: 86 };
}

export function approvalWorkflowShapeBounds(shape) {
  const upperLeft = shape?.bounds?.upperLeft;
  const lowerRight = shape?.bounds?.lowerRight;
  const left = finiteNumber(upperLeft?.x);
  const top = finiteNumber(upperLeft?.y);
  const right = finiteNumber(lowerRight?.x);
  const bottom = finiteNumber(lowerRight?.y);
  if (left !== null && top !== null && right !== null && bottom !== null && right > left && bottom > top) {
    return {
      upperLeft: { x: left, y: top },
      lowerRight: { x: right, y: bottom },
    };
  }

  const x = finiteNumber(shape?.position?.x);
  const y = finiteNumber(shape?.position?.y);
  if (x === null || y === null) return null;
  const size = approvalWorkflowNodeSize(shape?.stencil?.id);
  return {
    upperLeft: { x, y },
    lowerRight: { x: x + size.width, y: y + size.height },
  };
}

export function withApprovalWorkflowDesignerBounds(shape) {
  if (shape?.stencil?.id === "SequenceFlow") return shape;
  return {
    ...shape,
    bounds: approvalWorkflowShapeBounds(shape),
  };
}

export function approvalWorkflowGraphPosition(childshapes, options = {}) {
  const margin = Number.isFinite(Number(options.margin)) ? Number(options.margin) : 160;
  const minimumWidth = Number.isFinite(Number(options.minimumWidth)) ? Number(options.minimumWidth) : 960;
  const minimumHeight = Number.isFinite(Number(options.minimumHeight)) ? Number(options.minimumHeight) : 620;
  const bounds = (Array.isArray(childshapes) ? childshapes : [])
    .filter((shape) => shape?.stencil?.id !== "SequenceFlow")
    .map(approvalWorkflowShapeBounds)
    .filter(Boolean);
  if (!bounds.length) return { x: 0, y: 0, width: minimumWidth, height: minimumHeight };
  const minX = Math.min(...bounds.map((box) => box.upperLeft.x));
  const maxX = Math.max(...bounds.map((box) => box.lowerRight.x));
  const minY = Math.min(...bounds.map((box) => box.upperLeft.y));
  const maxY = Math.max(...bounds.map((box) => box.lowerRight.y));
  return {
    x: Math.min(0, minX - margin),
    y: Math.min(0, minY - margin),
    width: Math.max(minimumWidth, maxX - minX + margin * 2),
    height: Math.max(minimumHeight, maxY - minY + margin * 2),
  };
}
