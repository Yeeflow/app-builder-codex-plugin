export function lowerDataListSublistScalarSummaryIntentForTest(intent) {
  if (!intent || !Object.isFrozen(intent) || intent.temporaryVariableReference !== undefined || !intent.summaryKey || !intent.summaryReference || !intent.sourceColumn) throw new Error("SUBLIST_SUMMARY_REFERENCE_INVALID");
  return Object.freeze({ field: intent.sourceColumn.name, type: intent.aggregateOperation, display: intent.display, binding: null });
}
