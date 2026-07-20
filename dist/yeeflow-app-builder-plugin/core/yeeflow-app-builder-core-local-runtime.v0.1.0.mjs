export const capabilityMetadata = {
    packageName: "@yeeflow/app-builder-core-local-runtime",
    version: "0.1.0",
    capabilities: ["Local Runtime capability metadata and explicit fixed-filter key allocation and findings lowering shadow support."],
};
/**
 * Host-only lowering validates supplied opaque keys and performs the explicit
 * caller-owned findings append. It never allocates a fallback key.
 */
export function lowerFixedFilterProjectionAtHost(projection, allocation, callerFindings = null) {
    const requests = [...projection.keyRequests].sort((left, right) => left.ordinal - right.ordinal);
    const keys = allocation?.keysByRequestId;
    const values = new Map();
    for (const request of requests) {
        const key = keys?.[request.requestId];
        if (key === undefined)
            throw new Error(`FIXED_FILTER_KEY_ALLOCATION_MISSING: ${request.requestId}`);
        if (typeof key !== "string" || !key.trim())
            throw new Error(`FIXED_FILTER_KEY_ALLOCATION_INVALID: ${request.requestId}`);
        const prior = values.get(key);
        if (prior && prior !== request.requestId)
            throw new Error(`FIXED_FILTER_KEY_ALLOCATION_COLLISION: ${prior},${request.requestId}`);
        values.set(key, request.requestId);
    }
    const filters = projection.intents
        .slice()
        .sort((left, right) => left.ordinal - right.ordinal)
        .map((intent) => Object.freeze({
        key: keys[intent.requestId],
        pre: intent.pre,
        left: intent.left,
        op: intent.op,
        right: intent.right,
        ...(intent.showCus === undefined ? {} : { showCus: intent.showCus }),
    }));
    const findings = projection.findings.map((finding) => Object.freeze({ level: "error", code: finding.code, message: finding.message, ...finding.context }));
    if (callerFindings)
        for (const finding of findings)
            callerFindings.push(finding);
    return Object.freeze({ filter: Object.freeze(filters), findings: Object.freeze(findings) });
}
export function lowerDataListScalarResourceIdentityAtHost(intent, allocation) {
    const listId = validateIdentity(allocation?.listId, "list");
    const request = intent?.fieldRequest;
    if (!request || request.kind !== "FieldID" || request.resourceScope !== intent.resourceScope || request.ordinal !== intent.fieldOrdinal)
        throw new Error("DATA_LIST_IDENTITY_RELATIONSHIP_BROKEN");
    const fieldId = allocation?.fieldIdsByRequestId?.[request.requestId];
    if (fieldId === undefined)
        throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_MISSING: ${request.requestId}`);
    const scope = allocation?.fieldScopesByRequestId?.[request.requestId];
    if (scope !== intent.resourceScope)
        throw new Error(`DATA_LIST_IDENTITY_SCOPE_MISMATCH: ${request.requestId}`);
    if (intent.requiredLookupTarget !== undefined && (!allocation.lookupResolution || typeof allocation.lookupResolution[intent.requiredLookupTarget] !== "string" || !allocation.lookupResolution[intent.requiredLookupTarget].trim())) {
        throw new Error(`DATA_LIST_LOOKUP_TARGET_UNRESOLVED: ${intent.requiredLookupTarget}`);
    }
    const validFieldId = validateIdentity(fieldId, request.requestId);
    const duplicate = Object.entries(allocation.fieldIdsByRequestId).find(([id, value]) => id !== request.requestId && value === validFieldId);
    if (duplicate)
        throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_COLLISION: ${duplicate[0]},${request.requestId}`);
    return Object.freeze({ FieldID: validFieldId, ListID: listId, ...intent.preIdFieldRecord });
}
function validateIdentity(value, key) {
    if (value === undefined || value === null || value === "")
        throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_MISSING: ${key}`);
    if (typeof value === "number")
        throw new Error(`DATA_LIST_IDENTITY_LOSSY_INPUT: ${key}`);
    if (typeof value !== "string")
        throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_INVALID: ${key}`);
    if (!/^\d{1,30}$/.test(value))
        throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_INVALID: ${key}`);
    return value;
}
/**
 * Internal-only host lowering. The host owns target maps, validates them, and
 * returns a fresh Legacy-shaped Rules payload without mutating any input.
 */
export function lowerDataListLookupResolutionAtHost(intent, targetMap, source) {
    if (!intent || intent.surface !== "data-list" || !intent.resolutionRequest)
        throw new Error("DATA_LIST_LOOKUP_TARGET_UNRESOLVED");
    if (!intent.declaredTargetKey || intent.resolutionRequest.candidateKeys.length === 0)
        throw new Error("DATA_LIST_LOOKUP_TARGET_UNRESOLVED");
    validateSourceContext(source);
    const matches = intent.resolutionRequest.candidateKeys
        .map((candidate) => ({ candidate, listId: targetMap?.targetListIdsByLogicalKey?.[candidate] }))
        .filter((entry) => entry.listId !== undefined);
    if (!matches.length)
        throw new Error(`LOOKUP_RESOLUTION_TARGET_MAPPING_MISSING: ${intent.declaredTargetKey}`);
    if (matches.length > 1)
        throw new Error(`LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS: ${matches.map((entry) => entry.candidate).join(",")}`);
    const matched = matches[0];
    const targetListId = validateLosslessId(matched.listId, matched.candidate);
    const expectedScope = `data-list:${targetListId}`;
    if (targetMap?.targetScopesByLogicalKey?.[matched.candidate] !== expectedScope) {
        throw new Error(`LOOKUP_RESOLUTION_TARGET_SCOPE_MISMATCH: ${matched.candidate}`);
    }
    return Object.freeze({
        rules: JSON.stringify({ listid: targetListId, listfield: "Title", displayField: intent.displayField, fieldName: intent.displayField, listtype: "select" }),
        targetListId,
        matchedCandidateKey: matched.candidate,
    });
}
function validateSourceContext(source) {
    const sourceListId = validateLosslessId(source?.sourceListId, "source-list");
    validateLosslessId(source?.sourceFieldId, "source-field");
    const sourceFieldListId = validateLosslessId(source?.sourceFieldListId, "source-field-list");
    if (sourceListId !== sourceFieldListId)
        throw new Error("LOOKUP_RESOLUTION_SOURCE_TARGET_RELATIONSHIP_BROKEN");
}
function validateLosslessId(value, key) {
    if (typeof value !== "string" || !/^\d{1,30}$/.test(value))
        throw new Error(`LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID: ${key}`);
    return value;
}
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
export function lowerDataListSublistScalarRowSchemaAtHost(intent, context) {
    if (!intent || !context)
        sublistFail("SUBLIST_TEMPLATE_GRAPH_REFERENCE_MISSING");
    for (const value of [intent.parentListId, intent.childListId, intent.parentFieldId, intent.childFieldId, context.parentListId, context.childListId, context.parentFieldId, context.childFieldId]) {
        if (typeof value !== "string" || !/^\d{1,30}$/.test(value))
            sublistFail("SUBLIST_TEMPLATE_GRAPH_REFERENCE_INVALID");
    }
    if (![intent.parentListId, intent.childListId, intent.parentFieldId, intent.childFieldId].every((value, index) => value === [context.parentListId, context.childListId, context.parentFieldId, context.childFieldId][index]))
        sublistFail("SUBLIST_TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH");
    if (!sublistText(intent.rowSchemaId) || !sublistText(context.rowSchemaId) || !sublistText(intent.templateScope) || !sublistText(context.templateScope))
        sublistFail("SUBLIST_ROW_SCHEMA_REFERENCE_MISSING");
    if (!sublistReference(intent.rowSchemaId) || !sublistReference(context.rowSchemaId) || !sublistReference(intent.templateScope) || !sublistReference(context.templateScope))
        sublistFail("SUBLIST_ROW_SCHEMA_REFERENCE_INVALID");
    if (intent.rowSchemaId !== context.rowSchemaId || intent.templateScope !== context.templateScope)
        sublistFail("SUBLIST_ROW_SCHEMA_REFERENCE_SCOPE_MISMATCH");
    if (sublistDuplicates(context.parentNodes.map((node) => node.reference)))
        sublistFail("SUBLIST_TEMPLATE_GRAPH_REFERENCE_DUPLICATE");
    if (sublistDuplicates(context.rowSchemas.map((schema) => schema.reference)))
        sublistFail("SUBLIST_ROW_SCHEMA_REFERENCE_DUPLICATE");
    const parent = context.parentNodes.find((node) => node.reference === intent.parentFieldId);
    if (!parent)
        sublistFail("SUBLIST_TEMPLATE_GRAPH_REFERENCE_MISSING");
    if (parent.scope !== intent.templateScope)
        sublistFail("SUBLIST_TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH");
    if (parent.parentListId !== intent.parentListId)
        sublistFail("SUBLIST_TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN");
    const rowSchema = context.rowSchemas.find((schema) => schema.reference === intent.rowSchemaId);
    if (!rowSchema)
        sublistFail("SUBLIST_ROW_SCHEMA_REFERENCE_MISSING");
    if (rowSchema.scope !== intent.templateScope)
        sublistFail("SUBLIST_ROW_SCHEMA_REFERENCE_SCOPE_MISMATCH");
    if (rowSchema.parentFieldId !== intent.parentFieldId || rowSchema.childListId !== intent.childListId)
        sublistFail("SUBLIST_ROW_SCHEMA_REFERENCE_RELATIONSHIP_BROKEN");
    if (!Array.isArray(intent.rows) || sublistDuplicates(intent.rows.map((row) => row.id)) || sublistDuplicates(intent.rows.map((row) => row.idx)))
        sublistFail("SUBLIST_ROW_SCHEMA_REFERENCE_DUPLICATE");
    for (const row of intent.rows)
        if (!sublistText(row.idx) || !sublistText(row.id) || !Number.isInteger(row.ordinal))
            sublistFail("SUBLIST_ROW_SCHEMA_REFERENCE_INVALID");
    return sublistFreeze(intent.rows.map(({ ordinal: _ordinal, ...row }) => ({ ...row })));
}
function sublistText(value) { return typeof value === "string" && value.trim().length > 0; }
function sublistReference(value) { return /^[A-Za-z0-9:_-]+$/.test(value); }
function sublistDuplicates(values) { return new Set(values).size !== values.length; }
function sublistFail(code) { throw new Error(code); }
function sublistFreeze(value) { if (value && typeof value === "object") {
    for (const child of Object.values(value))
        sublistFreeze(child);
    Object.freeze(value);
} return value; }
/** Internal Phase 9B host-only inventoryIdentity-inventory shadow. It is not publicly exported. */
const sublistChildResourceIdentityErrors = [
    "SUBLIST_CHILD_RESOURCE_IDENTITY_MISSING",
    "SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID",
    "SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY",
    "SUBLIST_CHILD_RESOURCE_IDENTITY_DUPLICATE",
    "SUBLIST_CHILD_RESOURCE_IDENTITY_SCOPE_MISMATCH",
    "SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN",
    "SUBLIST_ROW_SCHEMA_IDENTITY_MISSING",
    "SUBLIST_ROW_SCHEMA_IDENTITY_INVALID",
    "SUBLIST_ROW_SCHEMA_IDENTITY_DUPLICATE",
    "SUBLIST_ROW_SCHEMA_IDENTITY_SCOPE_MISMATCH",
    "SUBLIST_ROW_SCHEMA_IDENTITY_RELATIONSHIP_BROKEN",
];
/**
 * Validates host-supplied, post-allocation identities. This function has no
 * allocation authority and cannot infer a child resource from planning input.
 */
export function buildDataListSublistChildResourceInventoryAtHost(input) {
    if (!input || !Array.isArray(input.relationships))
        inventoryFail("SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID");
    const seenLogical = new Set();
    const seenChildFields = new Set();
    const parentToChild = new Map();
    const childToParent = new Map();
    const rowSchemaOwners = new Map();
    const seenRowOrdinals = new Set();
    const descriptors = input.relationships.map((allocation) => {
        if (!allocation || allocation.fieldFamily !== "sublist-scalar")
            inventoryFail("SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID");
        const parentListId = inventoryIdentity(allocation.parentListId, "child");
        const parentFieldId = inventoryIdentity(allocation.parentFieldId, "child");
        const childListId = inventoryIdentity(allocation.childListId, "child");
        const childFieldId = inventoryIdentity(allocation.childFieldId, "child");
        const rowSchemaId = inventoryIdentity(allocation.rowSchemaId, "row");
        if (!inventoryLogicalKey(allocation.childLogicalFieldKey) || !Number.isInteger(allocation.childOrdinal) || allocation.childOrdinal < 0)
            inventoryFail("SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID");
        if (parentListId === childListId || parentFieldId === childFieldId)
            inventoryFail("SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN");
        const parentScope = `data-list:${parentListId}`;
        const childScope = `data-list:${childListId}`;
        const rowSchemaScope = `${childScope}:row-schema:${rowSchemaId}`;
        if (allocation.parentScope !== parentScope || allocation.childScope !== childScope)
            inventoryFail("SUBLIST_CHILD_RESOURCE_IDENTITY_SCOPE_MISMATCH");
        if (allocation.rowSchemaScope !== rowSchemaScope)
            inventoryFail("SUBLIST_ROW_SCHEMA_IDENTITY_SCOPE_MISMATCH");
        const parentKey = `${parentListId}:${parentFieldId}`;
        const childKey = `${childListId}:${childFieldId}`;
        const rowSchemaKey = `${childListId}:${rowSchemaId}`;
        const logical = `${parentKey}:${allocation.childLogicalFieldKey}`;
        const rowOrdinal = `${parentKey}:${rowSchemaId}:${allocation.childOrdinal}`;
        if (seenLogical.has(logical) || seenChildFields.has(childKey))
            inventoryFail("SUBLIST_CHILD_RESOURCE_IDENTITY_DUPLICATE");
        if (seenRowOrdinals.has(rowOrdinal))
            inventoryFail("SUBLIST_ROW_SCHEMA_IDENTITY_DUPLICATE");
        const knownChild = parentToChild.get(parentKey);
        if (knownChild && knownChild !== `${childListId}:${rowSchemaId}`)
            inventoryFail("SUBLIST_ROW_SCHEMA_IDENTITY_RELATIONSHIP_BROKEN");
        const knownParent = childToParent.get(childListId);
        if (knownParent && knownParent !== parentKey)
            inventoryFail("SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN");
        const knownRowSchemaOwner = rowSchemaOwners.get(rowSchemaKey);
        if (knownRowSchemaOwner && knownRowSchemaOwner !== parentKey)
            inventoryFail("SUBLIST_ROW_SCHEMA_IDENTITY_DUPLICATE");
        seenLogical.add(logical);
        seenChildFields.add(childKey);
        seenRowOrdinals.add(rowOrdinal);
        parentToChild.set(parentKey, `${childListId}:${rowSchemaId}`);
        childToParent.set(childListId, parentKey);
        rowSchemaOwners.set(rowSchemaKey, parentKey);
        return Object.freeze({ parentListId, parentFieldId, childListId, childFieldId, rowSchemaId, childLogicalFieldKey: allocation.childLogicalFieldKey, childOrdinal: allocation.childOrdinal, parentScope, childScope, rowSchemaScope });
    }).sort(inventoryCompare);
    const byParentField = {};
    for (const descriptor of descriptors) {
        const key = `${descriptor.parentListId}:${descriptor.parentFieldId}`;
        byParentField[key] = Object.freeze([...(byParentField[key] || []), descriptor]);
    }
    return inventoryDeepFreeze({ descriptors: Object.freeze(descriptors), descriptorsByParentField: byParentField });
}
function inventoryIdentity(value, family) {
    const prefix = family === "row" ? "SUBLIST_ROW_SCHEMA_IDENTITY" : "SUBLIST_CHILD_RESOURCE_IDENTITY";
    if (value === undefined || value === null)
        inventoryFail(`${prefix}_MISSING`);
    if (typeof value === "number" || typeof value === "bigint")
        inventoryFail("SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY");
    if (typeof value !== "string" || !value.trim() || !/^\d{16,30}$/.test(value))
        inventoryFail(`${prefix}_INVALID`);
    return value;
}
function inventoryLogicalKey(value) { return typeof value === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(value); }
function inventoryCompare(left, right) { return left.parentListId.localeCompare(right.parentListId) || left.parentFieldId.localeCompare(right.parentFieldId) || left.childOrdinal - right.childOrdinal || left.childLogicalFieldKey.localeCompare(right.childLogicalFieldKey); }
function inventoryFail(code) { throw new Error(code); }
function inventoryDeepFreeze(value) { if (value && typeof value === "object") {
    for (const child of Object.values(value))
        inventoryDeepFreeze(child);
    Object.freeze(value);
} return value; }
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
/** Lowers one frozen scope-resolved intent without resolving or mutating any host inventory. */
export function lowerDataListSublistDynamicSummaryIntentAtHost(intent) {
    const value = intent;
    if (!intent || !Object.isFrozen(intent) || value.runtimeExpression !== undefined || value.hostContext !== undefined || value.tempVars !== undefined || value.template !== undefined || value.resource !== undefined)
        dynamicSummaryFail("SUBLIST_DYNAMIC_SUMMARY_LOWERING_INVALID");
    const scope = intent.scope;
    const source = intent.sourceColumn;
    const summary = intent.summary;
    const binding = intent.binding;
    if (!scope || ![scope.parentListId, scope.layoutId, scope.layoutResourceId, scope.parentFieldId, scope.sublistControlId, scope.summaryId].every(dynamicSummaryText) || !source || !dynamicSummaryText(source.id) || !dynamicSummaryText(source.idx) || !dynamicSummaryText(source.name) || !summary || summary.field !== source.id || !dynamicSummaryOperations.has(summary.type) || !binding || !dynamicSummaryText(binding.value) || !dynamicSummaryText(binding.targetDescriptor?.id) || !dynamicSummaryText(binding.targetDescriptor?.idx))
        dynamicSummaryFail("SUBLIST_DYNAMIC_SUMMARY_SCOPE_INVALID");
    if (!((binding.kind === "data-list-field" && binding.prefix === "__list_") || (binding.kind === "temp-variable" && binding.prefix === "__temp_")))
        dynamicSummaryFail("SUBLIST_DYNAMIC_SUMMARY_BINDING_INVALID");
    return Object.freeze({ id: scope.summaryId, field: summary.field, type: summary.type, display: summary.display === true, binding: Object.freeze({ prefix: binding.prefix, value: binding.value }) });
}
const dynamicSummaryOperations = new Set(["total", "average", "minimum", "maximum", "count"]);
function dynamicSummaryText(value) { return typeof value === "string" && value.length > 0; }
function dynamicSummaryFail(code) { throw new Error(code); }
/** Lowers frozen intent and explicit host IDs to fresh metadata; it never loads or mutates a graph. */
export function lowerDataListSublistNestedControlPlacementAtHost(intent, bindings) {
    if (!intent || !Object.isFrozen(intent) || !Array.isArray(bindings) || bindings.length !== intent.placements?.length || intent.template !== undefined || intent.resource !== undefined)
        nestedControlFail("SUBLIST_NESTED_CONTROL_LOWERING_INVALID");
    const used = new Set();
    const output = intent.placements.map((placement) => {
        const binding = bindings.find((item) => item?.childControlReference === placement.childControlReference);
        if (!binding || !nestedControlText(binding.controlId) || !nestedControlText(binding.parentBinding) || !nestedControlText(binding.parentControlId) || used.has(binding.childControlReference))
            nestedControlFail("SUBLIST_NESTED_CONTROL_HOST_BINDING_INVALID");
        used.add(binding.childControlReference);
        const control = { id: binding.controlId, label: placement.column.name, binding: placement.column.id, attrs: { list_field: true, list_field_binding: binding.parentBinding, list_control_id: binding.parentControlId }, type: placement.control.type, displayLabel: [null, true] };
        if (placement.control.type === "datepicker")
            control.value = null;
        else if (placement.control.defaultValue !== null)
            control.value = placement.control.defaultValue;
        return Object.freeze({ idx: placement.column.idx, id: placement.column.id, name: placement.column.name, type: placement.column.type, editable: placement.column.editable, control: Object.freeze(control) });
    });
    return Object.freeze(output);
}
function nestedControlText(value) { return typeof value === "string" && value.length > 0; }
function nestedControlFail(code) { throw new Error(code); }
export function lowerDataListSublistEmbeddedLookupIntentAtHost(intent, binding) { if (!intent || !Object.isFrozen(intent) || !embeddedLookupHostText(binding?.controlId) || !embeddedLookupHostText(binding?.parentBinding) || !embeddedLookupHostText(binding?.parentControlId))
    throw Error("SUBLIST_EMBEDDED_LOOKUP_HOST_BINDING_INVALID"); const c = intent.column, t = intent.target; if (!embeddedLookupHostText(c?.id) || !embeddedLookupHostText(c.idx) || !embeddedLookupHostText(c.name) || c.type !== "lookup" || !embeddedLookupHostId(t?.listId) || !embeddedLookupHostId(t?.listSetId) || t.valueField !== c.id)
    throw Error("SUBLIST_EMBEDDED_LOOKUP_LOWERING_INVALID"); return Object.freeze({ idx: c.idx, id: c.id, name: c.name, type: "lookup", editable: c.editable, control: Object.freeze({ id: binding.controlId, label: c.name, binding: t.valueField, displayLabel: [null, true], type: "lookup", attrs: Object.freeze({ list_field: true, list_field_binding: binding.parentBinding, list_control_id: binding.parentControlId, listid: t.listId, appid: 41, listsetid: t.listSetId, listfield: t.displayField }) }) }); }
const embeddedLookupHostId = (v) => typeof v === "string" && /^\d{19}$/.test(v);
const embeddedLookupHostText = (v) => typeof v === "string" && v.length > 0;
/** Lowers only fresh, static list-field metadata. Identity selection remains product-runtime owned. */
export function lowerDataListSublistIdentityControlIntentAtHost(intent, binding) {
    if (!intent || !Object.isFrozen(intent) || !identityControlHostText(binding?.controlId) || !identityControlHostText(binding?.parentBinding) || !identityControlHostText(binding?.parentControlId))
        throw Error("SUBLIST_IDENTITY_CONTROL_HOST_BINDING_INVALID");
    const column = intent.column;
    if (!identityControlHostText(column?.id) || !identityControlHostText(column.idx) || !identityControlHostText(column.name) || column.type !== "user" || typeof column.editable !== "boolean" || intent.control?.type !== "identity-picker")
        throw Error("SUBLIST_IDENTITY_CONTROL_LOWERING_INVALID");
    return Object.freeze({
        idx: column.idx,
        id: column.id,
        name: column.name,
        type: "user",
        editable: column.editable,
        control: Object.freeze({
            id: binding.controlId,
            label: column.name,
            binding: column.id,
            displayLabel: Object.freeze([null, true]),
            type: "identity-picker",
            attrs: Object.freeze({ list_field: true, list_field_binding: binding.parentBinding, list_control_id: binding.parentControlId }),
        }),
    });
}
const identityControlHostText = (value) => typeof value === "string" && value.length > 0;