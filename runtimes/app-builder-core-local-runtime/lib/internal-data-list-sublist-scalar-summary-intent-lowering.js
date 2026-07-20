/** Lowers immutable static aggregate intent without any temporary-variable lifecycle or host binding. */
export function lowerDataListSublistScalarSummaryIntentAtHost(intent) {
    const candidate = intent;
    if (!intent || candidate.temporaryVariableReference !== undefined || candidate.tempVars !== undefined || candidate.runtimeExpression !== undefined || candidate.binding !== undefined)
        fail("SUBLIST_TEMP_VARIABLE_REFERENCE_INVALID");
    if (!Object.isFrozen(intent) || !summaryText(intent.summaryKey) || intent.summaryReference !== `summary:${intent.summaryKey}` || !intent.sourceColumn || !summaryText(intent.sourceColumn.id) || !summaryText(intent.sourceColumn.name))
        fail("SUBLIST_SUMMARY_REFERENCE_INVALID");
    if (!operations.has(intent.aggregateOperation) || !scalarTypes.has(intent.sourceColumn.scalarType))
        fail("SUBLIST_SUMMARY_REFERENCE_INVALID");
    if (intent.aggregateOperation !== "count" && intent.sourceColumn.scalarType !== "number" && intent.sourceColumn.scalarType !== "decimal")
        fail("SUBLIST_SUMMARY_REFERENCE_INVALID");
    return Object.freeze({ field: intent.sourceColumn.name, type: intent.aggregateOperation, display: intent.display === true, binding: null });
}
const operations = new Set(["total", "average", "minimum", "maximum", "count"]);
const scalarTypes = new Set(["text", "date", "datetime", "number", "decimal", "boolean", "bit"]);
function summaryText(value) { return typeof value === "string" ? value.trim() : ""; }
function fail(code) { throw new Error(code); }
//# sourceMappingURL=internal-data-list-sublist-scalar-summary-intent-lowering.js.map