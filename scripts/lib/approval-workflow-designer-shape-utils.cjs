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
  const leftInset = Number.isFinite(Number(options.leftInset)) ? Number(options.leftInset) : 90;
  const topInset = Number.isFinite(Number(options.topInset)) ? Number(options.topInset) : 45;
  const minimumWidth = Number.isFinite(Number(options.minimumWidth)) ? Number(options.minimumWidth) : 470;
  const minimumHeight = Number.isFinite(Number(options.minimumHeight)) ? Number(options.minimumHeight) : 185;
  const content = approvalWorkflowContentBounds(childshapes);
  if (!content) return { x: leftInset, y: topInset, width: minimumWidth, height: minimumHeight };
  const contentWidth = content.lowerRight.x - content.upperLeft.x;
  const contentHeight = content.lowerRight.y - content.upperLeft.y;
  return {
    x: content.upperLeft.x + leftInset,
    y: content.upperLeft.y + topInset,
    width: Math.max(minimumWidth, contentWidth),
    height: Math.max(minimumHeight, contentHeight),
  };
}

function inspectApprovalWorkflowGraphPosition(childshapes, graphposition, options = {}) {
  const content = approvalWorkflowContentBounds(childshapes);
  if (!content) return null;
  const expected = approvalWorkflowGraphPosition(childshapes, options);
  const actual = {
    x: finiteNumber(graphposition?.x),
    y: finiteNumber(graphposition?.y),
    width: finiteNumber(graphposition?.width),
    height: finiteNumber(graphposition?.height),
  };
  if (Object.values(actual).some((value) => value === null)) return null;
  const originTolerance = Number.isFinite(Number(options.originTolerance)) ? Number(options.originTolerance) : 1;
  const dimensionTolerance = Number.isFinite(Number(options.dimensionTolerance)) ? Number(options.dimensionTolerance) : 1;
  return {
    content,
    actual,
    expected,
    originMatches: Math.abs(actual.x - expected.x) <= originTolerance
      && Math.abs(actual.y - expected.y) <= originTolerance,
    dimensionsMatch: Math.abs(actual.width - expected.width) <= dimensionTolerance
      && Math.abs(actual.height - expected.height) <= dimensionTolerance,
  };
}

function normalizeApprovalWorkflowDesignerViewport(def, options = {}) {
  if (!def || typeof def !== "object") return def;
  return {
    ...def,
    graphposition: approvalWorkflowGraphPosition(def.childshapes, options),
  };
}

module.exports = {
  approvalWorkflowContentBounds,
  approvalWorkflowGraphPosition,
  inspectApprovalWorkflowGraphPosition,
  approvalWorkflowNodeSize,
  approvalWorkflowShapeBounds,
  normalizeApprovalWorkflowDesignerViewport,
  withApprovalWorkflowDesignerBounds,
};
