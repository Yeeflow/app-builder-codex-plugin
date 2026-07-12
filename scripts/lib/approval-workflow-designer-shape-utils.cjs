function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function approvalWorkflowNodeSize(stencilId) {
  const id = String(stencilId || "");
  if (/Event$/i.test(id)) return { width: 36, height: 36 };
  if (/Gateway$/i.test(id)) return { width: 46, height: 46 };
  return { width: 190, height: 86 };
}

function approvalWorkflowShapeBounds(shape) {
  const upperLeft = shape?.bounds?.upperLeft;
  const lowerRight = shape?.bounds?.lowerRight;
  const left = finiteNumber(upperLeft?.x);
  const top = finiteNumber(upperLeft?.y);
  const right = finiteNumber(lowerRight?.x);
  const bottom = finiteNumber(lowerRight?.y);
  if (left !== null && top !== null && right !== null && bottom !== null && right > left && bottom > top) {
    return { upperLeft: { x: left, y: top }, lowerRight: { x: right, y: bottom } };
  }

  const x = finiteNumber(shape?.position?.x);
  const y = finiteNumber(shape?.position?.y);
  if (x === null || y === null) return null;
  const size = approvalWorkflowNodeSize(shape?.stencil?.id);
  return { upperLeft: { x, y }, lowerRight: { x: x + size.width, y: y + size.height } };
}

function withApprovalWorkflowDesignerBounds(shape) {
  if (shape?.stencil?.id === "SequenceFlow") return shape;
  return { ...shape, bounds: approvalWorkflowShapeBounds(shape) };
}

function approvalWorkflowContentBounds(childshapes) {
  const bounds = (Array.isArray(childshapes) ? childshapes : [])
    .filter((shape) => shape?.stencil?.id !== "SequenceFlow")
    .map(approvalWorkflowShapeBounds)
    .filter(Boolean);
  if (!bounds.length) return null;
  return {
    upperLeft: {
      x: Math.min(...bounds.map((box) => box.upperLeft.x)),
      y: Math.min(...bounds.map((box) => box.upperLeft.y)),
    },
    lowerRight: {
      x: Math.max(...bounds.map((box) => box.lowerRight.x)),
      y: Math.max(...bounds.map((box) => box.lowerRight.y)),
    },
  };
}

function approvalWorkflowGraphPosition(childshapes, options = {}) {
  const zoom = Number.isFinite(Number(options.zoom)) && Number(options.zoom) > 0 ? Number(options.zoom) : 1;
  const safeLeft = Number.isFinite(Number(options.safeLeft)) ? Number(options.safeLeft) : 80;
  const safeTop = Number.isFinite(Number(options.safeTop)) ? Number(options.safeTop) : 120;
  const minimumWidth = Number.isFinite(Number(options.minimumWidth)) ? Number(options.minimumWidth) : 470;
  const minimumHeight = Number.isFinite(Number(options.minimumHeight)) ? Number(options.minimumHeight) : 185;
  const content = approvalWorkflowContentBounds(childshapes);
  if (!content) return { x: safeLeft, y: safeTop, width: minimumWidth, height: minimumHeight };
  const contentWidth = (content.lowerRight.x - content.upperLeft.x) * zoom;
  const contentHeight = (content.lowerRight.y - content.upperLeft.y) * zoom;
  return {
    x: safeLeft - content.upperLeft.x * zoom,
    y: safeTop - content.upperLeft.y * zoom,
    width: Math.max(minimumWidth, contentWidth),
    height: Math.max(minimumHeight, contentHeight),
  };
}

function approvalWorkflowInitialViewportExtent(childshapes, graphposition, graphzoom = 1) {
  const content = approvalWorkflowContentBounds(childshapes);
  if (!content) return null;
  const zoom = Number.isFinite(Number(graphzoom)) && Number(graphzoom) > 0 ? Number(graphzoom) : 1;
  const offsetX = finiteNumber(graphposition?.x);
  const offsetY = finiteNumber(graphposition?.y);
  if (offsetX === null || offsetY === null) return null;
  return {
    left: content.upperLeft.x * zoom + offsetX,
    top: content.upperLeft.y * zoom + offsetY,
    right: content.lowerRight.x * zoom + offsetX,
    bottom: content.lowerRight.y * zoom + offsetY,
  };
}

function normalizeApprovalWorkflowDesignerViewport(def, options = {}) {
  if (!def || typeof def !== "object") return def;
  const graphzoom = Number.isFinite(Number(def.graphzoom)) && Number(def.graphzoom) > 0 ? Number(def.graphzoom) : 1;
  return {
    ...def,
    graphposition: approvalWorkflowGraphPosition(def.childshapes, { ...options, zoom: graphzoom }),
  };
}

module.exports = {
  approvalWorkflowContentBounds,
  approvalWorkflowGraphPosition,
  approvalWorkflowInitialViewportExtent,
  approvalWorkflowNodeSize,
  approvalWorkflowShapeBounds,
  normalizeApprovalWorkflowDesignerViewport,
  withApprovalWorkflowDesignerBounds,
};
