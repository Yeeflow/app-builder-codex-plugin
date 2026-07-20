/** Lowers one frozen scope-resolved intent without resolving or mutating any host inventory. */
export function lowerDataListSublistDynamicSummaryIntentAtHost(intent) {
    const value = intent;
    if (!intent || !Object.isFrozen(intent) || value.runtimeExpression !== undefined || value.hostContext !== undefined || value.tempVars !== undefined || value.template !== undefined || value.resource !== undefined)
        fail("SUBLIST_DYNAMIC_SUMMARY_LOWERING_INVALID");
    const scope = intent.scope;
    const source = intent.sourceColumn;
    const summary = intent.summary;
    const binding = intent.binding;
    if (!scope || ![scope.parentListId, scope.layoutId, scope.layoutResourceId, scope.parentFieldId, scope.sublistControlId, scope.summaryId].every(text) || !source || !text(source.id) || !text(source.idx) || !text(source.name) || !summary || summary.field !== source.id || !operations.has(summary.type) || !binding || !text(binding.value) || !text(binding.targetDescriptor?.id) || !text(binding.targetDescriptor?.idx))
        fail("SUBLIST_DYNAMIC_SUMMARY_SCOPE_INVALID");
    if (!((binding.kind === "data-list-field" && binding.prefix === "__list_") || (binding.kind === "temp-variable" && binding.prefix === "__temp_")))
        fail("SUBLIST_DYNAMIC_SUMMARY_BINDING_INVALID");
    return Object.freeze({ id: scope.summaryId, field: summary.field, type: summary.type, display: summary.display === true, binding: Object.freeze({ prefix: binding.prefix, value: binding.value }) });
}
const operations = new Set(["total", "average", "minimum", "maximum", "count"]);
function text(value) { return typeof value === "string" && value.length > 0; }
function fail(code) { throw new Error(code); }
//# sourceMappingURL=internal-data-list-sublist-dynamic-summary-intent-lowering.js.map