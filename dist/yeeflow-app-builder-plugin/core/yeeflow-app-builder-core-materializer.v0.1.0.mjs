/**
 * Freezes the one embedded descriptor that Rules and custom-form consumers
 * must receive. `idx` and `id` retain export schema semantics only.
 */
function projectDataListEmbeddedSublistSchemaInternal(input) {
    if (!input || !losslessProductId(input.parentListId) || !losslessProductId(input.parentFieldId) || !Array.isArray(input.columns)) {
        throw new TypeError("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_INVALID");
    }
    const columns = input.columns.map((column, ordinal) => {
        if (!column || !text(column.idx) || !text(column.id) || !text(column.name) || !text(column.type) || typeof column.editable !== "boolean") {
            throw new TypeError("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_INVALID");
        }
        return Object.freeze({ idx: column.idx, id: column.id, name: column.name, type: column.type, editable: column.editable, ordinal });
    });
    if (duplicates(columns.map((column) => column.idx)) || duplicates(columns.map((column) => column.id))) {
        throw new TypeError("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_INVALID");
    }
    return deepFreeze({ parentListId: input.parentListId, parentFieldId: input.parentFieldId, columns: Object.freeze(columns) });
}
/** Returns the parent-field Rules shape from the supplied frozen descriptor. */
function projectEmbeddedSublistRules(descriptor) {
    return Object.freeze({ descriptor, listVariables: lowerColumns(descriptor) });
}
/** Returns the schema portion of custom-form list-fields from the same descriptor. */
function projectEmbeddedSublistCustomFormFields(descriptor) {
    return Object.freeze({ descriptor, listFields: lowerColumns(descriptor) });
}
function lowerColumns(descriptor) {
    if (!descriptor || !losslessProductId(descriptor.parentListId) || !losslessProductId(descriptor.parentFieldId) || !Array.isArray(descriptor.columns)) {
        throw new TypeError("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_INVALID");
    }
    return Object.freeze(descriptor.columns.map(({ idx, id, name, type, editable }) => Object.freeze({ idx, id, name, type, editable })));
}
function losslessProductId(value) { return typeof value === "string" && /^\d{16,30}$/.test(value); }
function text(value) { return typeof value === "string" && value.trim().length > 0; }
function duplicates(values) { return new Set(values).size !== values.length; }
function deepFreeze(value) { if (value && typeof value === "object") {
    for (const child of Object.values(value))
        deepFreeze(child);
    Object.freeze(value);
} return value; }
/**
 * Internal-only Phase 9I shadow. Host context selection remains outside Core;
 * Core returns only the frozen export-proven embedded schema descriptor.
 */
function projectDataListSublistFrozenDescriptorInternal(input) {
    return projectDataListEmbeddedSublistSchemaInternal(input);
}
export const capabilityMetadata = {
    packageName: "@yeeflow/app-builder-core-materializer",
    version: "0.1.0",
    capabilities: ["Deterministic materializer normalization, field-default, regular-expression escaping, loose form-matching, planning-document suffix, template dependency-name and identifier primitives, immutable Data List scalar field projection, and fixed-filter intent projection with no host orchestration."],
};
/** Projects only the immutable parent-field embedded Sublist schema. */
export function projectDataListEmbeddedSublistDescriptor(input) {
    return Object.freeze({ descriptor: projectDataListSublistFrozenDescriptorInternal(input), findings: Object.freeze([]) });
}
export function normalizeHexColor(value) {
    const match = String(value || "").trim().match(/^#[0-9a-f]{6}$/i);
    return match ? match[0].toUpperCase() : "";
}
export function defaultValueForFieldType(fieldType) {
    return fieldType === "Bit" ? "0" : "";
}
export function escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function normalizeForLooseFormMatch(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
export function stripPlanningDocumentSuffix(value) {
    return String(value || "")
        .replace(/\s+[-–—]\s+Yeeflow App Plan\s*$/i, "")
        .replace(/\s+Yeeflow App Plan\s*$/i, "")
        .trim();
}
export function dependencyName(item) {
    const dependency = item;
    return String(dependency?.name || dependency?.key || dependency?.id || dependency?.ID || "").trim();
}
export function safeDependencyIdentifier(value, options = {}) {
    const identifierOptions = options;
    const raw = identifierOptions.lower ? String(value || "").toLowerCase() : String(value || "");
    return raw.replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
}
/**
 * Produces the immutable, pre-ID portion of a Data List scalar field record.
 * The caller must pass a field specification that has already crossed the
 * Legacy plan-parsing boundary. Lookup, sublist, identity, file, and image
 * controls intentionally remain outside this Phase 5B scalar contract.
 */
export function projectDataListScalarField(input = {}) {
    const rawFieldType = input.fieldType;
    const rawControlType = input.controlType || rawFieldType;
    const canonicalControlType = normalizeScalarControlType(rawControlType);
    const deferred = deferredScalarBoundary(rawFieldType, canonicalControlType);
    if (deferred) {
        return Object.freeze({
            projection: null,
            findings: Object.freeze([Object.freeze({
                    code: deferred.code,
                    path: "controlType",
                    message: deferred.message,
                    severity: "warning",
                })]),
        });
    }
    const canonicalFieldType = normalizeScalarFieldType(rawFieldType);
    const rawIndex = Number(input.fieldIndex);
    const fieldIndex = Number.isFinite(rawIndex) && rawIndex >= 0 ? rawIndex : 0;
    const isTitle = fieldIndex === 0 || /^title$/i.test(String(input.fieldName || ""));
    const fieldName = isTitle
        ? "Title"
        : schemaSafeScalarFieldName(input.fieldName) || `${scalarFieldPrefix(rawFieldType || canonicalFieldType)}${fieldIndex}`;
    const schemaFieldIndex = isTitle ? 0 : scalarFieldIndexFromName(fieldName) || fieldIndex;
    const type = canonicalFieldType === "Bit" ? "switch" : canonicalControlType;
    const allowScan = input.allowScan === true;
    if (allowScan && (type !== "input" || canonicalFieldType !== "Text")) {
        throw new Error(`DATA_LIST_BARCODE_SCAN_FIELD_TYPE_INVALID: ${String(input.displayName || input.fieldName || "field")}`);
    }
    return Object.freeze({
        projection: Object.freeze({
            displayName: input.displayName ?? null,
            fieldName,
            internalName: fieldName,
            canonicalFieldType,
            canonicalControlType: type,
            fieldIndex: schemaFieldIndex,
            status: isTitle ? 0 : 1,
            category: 0,
            defaultValue: defaultValueForFieldType(canonicalFieldType),
            rules: scalarFieldRules({
                displayName: input.displayName,
                fieldName,
                fieldType: rawFieldType,
                controlType: type,
                choiceValues: input.choiceValues,
                allowScan,
            }),
            required: false,
            unique: false,
            filterable: false,
            sortable: false,
            system: isTitle,
            index: isTitle,
        }),
        findings: Object.freeze([]),
    });
}
/**
 * Parses fixed-filter intent without allocating keys or mutating host findings.
 * The host must allocate every requested key and lower the immutable result.
 */
export function projectFixedFilterIntents(input = {}) {
    const fields = input.fields;
    const text = cleanFixedFilterText(input.filterText);
    if (isNoFixedFilterText(text))
        return freezeFixedFilterResult([], [], []);
    const normalized = text
        .replace(/\bDate\s*>=\s*Today\b/gi, "Date >= now")
        .replace(/\bcurrent date\b/gi, "now")
        .replace(/\btoday\b/gi, "now")
        .replace(new RegExp("\\u2265", "g"), ">=")
        .replace(new RegExp("\\u2264", "g"), "<=");
    const joiner = fixedFilterHasOr(normalized) ? "or" : "and";
    const parts = normalized.split(fixedFilterSplitter(joiner))
        .map((part) => cleanFixedFilterText(part))
        .filter(Boolean);
    const intents = [];
    const requests = [];
    for (const [ordinal, part] of parts.entries()) {
        const condition = parseFixedFilterIntentPart(part, fields, joiner, ordinal);
        if (!condition)
            continue;
        const viewScope = String(input.viewScope || "");
        const requestId = `${viewScope}:fixed-filter:${ordinal}`;
        const intent = Object.freeze({ ...condition, requestId, ordinal });
        intents.push(intent);
        requests.push(Object.freeze({ requestId, viewScope, ordinal, conditionFingerprint: JSON.stringify({ ordinal, pre: intent.pre, left: intent.left, op: intent.op, right: intent.right, showCus: intent.showCus ?? null }) }));
    }
    const findings = intents.length || !text ? [] : [Object.freeze({
            code: "DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED",
            message: "Planned Data List View fixed filter text did not materialize into LayoutView.filter[]. Use concrete field-level filters such as `Meeting Date is not empty` or `Status = Active`; vague business phrases are not signing-ready.",
            context: Object.freeze({ listName: String(input.listName || ""), viewName: String(input.viewName || ""), filterConditions: text }),
        })];
    return freezeFixedFilterResult(intents, requests, findings);
}
function freezeFixedFilterResult(intents, keyRequests, findings) {
    return Object.freeze({ intents: Object.freeze([...intents]), keyRequests: Object.freeze([...keyRequests]), findings: Object.freeze([...findings]) });
}
function parseFixedFilterIntentPart(part, fields, joiner, ordinal) {
    const nonEmpty = part.match(new RegExp("^(.+?)\\s+(?:is\\s+not\\s+empty|is\\s+not\\s+blank|not\\s+empty|has\\s+value|\\u6709\\u503c|\\u975e\\u7a7a|\\u4e0d\\u4e3a\\u7a7a)$", "i"));
    if (nonEmpty) {
        const field = resolveFixedFilterField(fields, nonEmpty[1]);
        return field ? { pre: joiner, left: fixedFilterFieldName(field), op: "7", right: null } : null;
    }
    const dateNow = part.match(/^(.+?)\s*>=\s*(?:now)$/i);
    if (dateNow) {
        const field = resolveFixedFilterField(fields, dateNow[1]);
        return field ? { pre: ordinal === 0 ? "and" : joiner, left: fixedFilterFieldName(field), op: "3", right: fixedFilterNowValue(), showCus: false } : null;
    }
    const comparison = part.match(/^(.+?)\s*(>=|<=|!=|=|>|<)\s*(.+)$/);
    if (!comparison)
        return null;
    const field = resolveFixedFilterField(fields, comparison[1]);
    if (!field)
        return null;
    return { pre: ordinal === 0 ? "and" : joiner, left: fixedFilterFieldName(field), op: fixedFilterOperator(comparison[2]), right: coerceFixedFilterValue(field, cleanFixedFilterText(comparison[3])) };
}
function cleanFixedFilterText(value) {
    return String(value ?? "")
        .replace(/<[^>]+>/g, "")
        .replace(/`/g, "")
        .replace(/\*\*/g, "")
        .replace(/^[\s'"“”‘’([{]+|[\s'"“”‘’.,;:!?…)}\]]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
function isNoFixedFilterText(value) {
    const text = cleanFixedFilterText(value);
    return !text || isNonResourceFixedFilterText(text) || /(?:no fixed|no filter|not filtered|all records|all items|\u65e0\u56fa\u5b9a|\u4e0d\u8fc7\u6ee4|\u5168\u96c6)/i.test(text);
}
function isNonResourceFixedFilterText(value) {
    const text = cleanFixedFilterText(value);
    if (isPlanningPlaceholderText(text))
        return true;
    return /^(status|resource type|notes?|owner|used by|actions?|fields?|dashboard|dashboard page|dashboard page name|page|page name|list name|form name|group|item|section|metric name|filter name)$/i.test(text) || /^no\s+(?:form\s+)?reports?\b/i.test(text) || /^no custom\b/i.test(text);
}
function isPlanningPlaceholderText(value) {
    const text = cleanFixedFilterText(value).toLowerCase().replace(/\bn\s*[./]s*a\b/g, "n/a");
    if (!text || ["deferred", "n/a", "no", "none", "not applicable", "not planned", "not required"].includes(text))
        return true;
    return /^(?:not applicable|not planned|not required|deferred|n\/a|none)(?:\s*[-–—:]\s*.+)$/i.test(text);
}
function fixedFilterHasOr(value) { return new RegExp("\\s+(?:or|OR)\\s+|\\u6216|\\u4efb\\u4e00|any of", "i").test(value); }
function fixedFilterSplitter(joiner) { return joiner === "or" ? new RegExp("\\s+(?:or|OR)\\s+|\\u6216|\\uff1b|;|\\uff0c|,", "i") : new RegExp("\\s+(?:and|AND)\\s+|\\u4e14|\\uff1b|;|\\uff0c|,", "i"); }
function resolveFixedFilterField(fields, requestedName) { const requested = fixedFilterKey(requestedName); return !requested ? null : fields.find((field) => [field.DisplayName, field.FieldName, field.InternalName].some((value) => fixedFilterKey(value) === requested)) || null; }
function fixedFilterKey(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function fixedFilterFieldName(field) { return String(field.FieldName || ""); }
function fixedFilterOperator(comparator) { return { "=": "0", "!=": "1", ">=": "3", "<=": "4", ">": "5", "<": "6" }[comparator] || "0"; }
function fixedFilterNowValue() { return Object.freeze([Object.freeze({ type: "func", func: "now", params: Object.freeze([]) })]); }
function coerceFixedFilterValue(field, value) { if (/^Decimal$/i.test(String(field.FieldType || ""))) {
    const number = Number(value);
    return Number.isFinite(number) ? number : value;
} if (/^Bit$/i.test(String(field.FieldType || "")))
    return /^(true|yes|1|on)$/i.test(value) ? "true" : "false"; if (/^Datetime$/i.test(String(field.FieldType || "")) && /^now$/i.test(value))
    return fixedFilterNowValue(); return value; }
function deferredScalarBoundary(fieldType, controlType) {
    const normalized = normalizedKey(fieldType);
    if (controlType === "lookup")
        return { code: "DATA_LIST_SCALAR_FIELD_PROJECTION_DEFERRED_LOOKUP", message: "Lookup fields require host-owned target resolution and are outside the scalar projection contract." };
    if (controlType === "list")
        return { code: "DATA_LIST_SCALAR_FIELD_PROJECTION_DEFERRED_SUBLIST", message: "Sublist fields require host-owned row-variable assembly and are outside the scalar projection contract." };
    if (controlType === "identity-picker" || /user|people|person|identity/.test(normalized))
        return { code: "DATA_LIST_SCALAR_FIELD_PROJECTION_DEFERRED_IDENTITY", message: "Identity controls require a separate identity-aware projection contract and are outside the scalar projection contract." };
    if (controlType === "file-upload" || controlType === "icon-upload")
        return { code: "DATA_LIST_SCALAR_FIELD_PROJECTION_DEFERRED_BINARY", message: "File and image controls require a separate binary-control contract and are outside the scalar projection contract." };
    return null;
}
function normalizeScalarFieldType(fieldType) {
    const normalized = normalizedKey(fieldType);
    if (/date|time/.test(normalized))
        return "Datetime";
    if (/number|decimal|currency|amount|percent|integer/.test(normalized))
        return "Decimal";
    if (/boolean|yes no|checkbox|bit/.test(normalized))
        return "Bit";
    return "Text";
}
function normalizeScalarControlType(controlType) {
    const normalized = normalizedKey(controlType);
    if (/sub list|sublist|\blist\b/.test(normalized))
        return "list";
    if (/user|identity/.test(normalized))
        return "identity-picker";
    if (/date|datetime/.test(normalized))
        return "datepicker";
    if (/number|decimal|currency|amount|percent/.test(normalized))
        return "input_number";
    if (/switch|bit|boolean|yes no|flag/.test(normalized))
        return "switch";
    if (/checkbox/.test(normalized))
        return "checkbox";
    if (/select|choice|dropdown/.test(normalized))
        return "select";
    if (/lookup|reference|relation/.test(normalized))
        return "lookup";
    if (/file|attachment/.test(normalized))
        return "file-upload";
    if (/image|photo|picture|icon/.test(normalized))
        return "icon-upload";
    if (/note|textarea|multi line/.test(normalized))
        return "textarea";
    return "input";
}
function scalarFieldRules(field) {
    if (field.allowScan)
        return JSON.stringify({ allowScan: true });
    if (field.controlType !== "select" && field.controlType !== "radio" && field.controlType !== "checkbox" && field.controlType !== "tag")
        return "";
    const explicit = parseScalarChoiceValues(field.choiceValues);
    const values = explicit.length ? explicit : inferredScalarChoiceValues(field);
    const colors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];
    const choices = values.map((value, index) => ({ key: String(index + 1), value, color: colors[index % colors.length] }));
    return choices.length ? JSON.stringify({ choices, color_choices: choices, displayStyle: "dropdown", show_color: false }) : "";
}
function parseScalarChoiceValues(value) {
    const raw = scalarChoiceLeaves(value);
    const seen = new Set();
    const values = [];
    for (const candidate of raw) {
        let normalized = String(candidate ?? "")
            .replace(/<[^>]+>/g, "")
            .replace(/`|\*\*/g, "")
            .trim();
        while (/\s*[（(]\s*(?:planning\s+default|recommended\s+default|user[-\s]+default(?:[-\s]+approved(?:[-\s]+for[-\s]+generation)?)?)\s*[)）]\s*$/i.test(normalized)) {
            normalized = normalized.replace(/\s*[（(]\s*(?:planning\s+default|recommended\s+default|user[-\s]+default(?:[-\s]+approved(?:[-\s]+for[-\s]+generation)?)?)\s*[)）]\s*$/i, "").trim();
        }
        if (!normalized || /^(?:n\/?a|none|not applicable)$/i.test(normalized))
            continue;
        const key = normalized.toLocaleLowerCase();
        if (seen.has(key))
            continue;
        seen.add(key);
        values.push(normalized);
    }
    return values;
}
function scalarChoiceLeaves(value) {
    if (Array.isArray(value))
        return value.flatMap((item) => scalarChoiceLeaves(item));
    if (value && typeof value === "object") {
        const record = value;
        return [record.value ?? record.label ?? record.text ?? record.Value ?? record.Name ?? record.Title ?? ""];
    }
    const text = String(value ?? "").trim();
    if (!text)
        return [];
    if (/^\[/.test(text)) {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed))
                return parsed.flatMap((item) => scalarChoiceLeaves(item));
        }
        catch {
            // The Legacy parser continues with the App Plan display-string form.
        }
    }
    return text.split(/(?:\r?\n|[、,，;；])+/);
}
function inferredScalarChoiceValues(field) {
    const raw = normalizedKey(`${String(field.displayName || "")} ${field.fieldName} ${String(field.fieldType || "")} ${field.controlType}`);
    if (/priority|urgency|severity|critical/.test(raw))
        return ["Low", "Medium", "High", "Critical"];
    if (/condition|inspection|quality/.test(raw))
        return ["Good", "Fair", "Damaged", "Lost"];
    if (/availability|available|reservation/.test(raw))
        return ["Available", "Checked Out", "Reserved", "Maintenance"];
    if (/approval|decision|review/.test(raw))
        return ["Pending Review", "Approved", "Rejected", "Returned"];
    if (/status|state|stage|phase/.test(raw))
        return ["Draft", "Submitted", "In Progress", "Completed", "Closed"];
    if (/category|type|class|group/.test(raw))
        return ["Standard", "Special", "Replacement", "Repair"];
    return ["Active", "Pending", "Closed"];
}
function schemaSafeScalarFieldName(value) {
    const text = String(value ?? "")
        .replace(/<[^>]+>/g, "")
        .replace(/`|\*\*/g, "")
        .replace(/^[\s'"“”‘’([{]+|[\s'"“”‘’.,;:!?…)}\]]+$/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[^A-Za-z0-9_]/g, "");
    if (/^Title$/i.test(text))
        return "Title";
    return /^(Text|Bit|Decimal|Datetime)[1-9]\d*$/.test(text) ? text : "";
}
function scalarFieldPrefix(fieldType) {
    const normalized = normalizedKey(fieldType);
    if (/date|time/.test(normalized))
        return "Datetime";
    if (/number|decimal|currency|amount|percent|integer/.test(normalized))
        return "Decimal";
    if (/boolean|yes no|checkbox|bit/.test(normalized))
        return "Bit";
    return "Text";
}
function scalarFieldIndexFromName(value) {
    const match = String(value || "").match(/(\d+)$/);
    return match ? Number(match[1]) : 0;
}
function normalizedKey(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
/**
 * Selects the default view from immutable static view intent only. The host
 * retains the caller-owned view objects and every LayoutView/resource concern.
 */
export function projectDataListDefaultViewSelector(input) {
    const views = Array.isArray(input?.views) ? input.views : [];
    const explicit = views.findIndex((view) => view?.isDefault === true);
    const fallback = views.findIndex((view) => /\b(?:all|all items|all records)\b/iu.test(String(view?.viewName || "")));
    return Object.freeze({ selectedIndex: explicit >= 0 ? explicit : fallback >= 0 ? fallback : null });
}
const defaultStaticQueryFields = Object.freeze([
    Object.freeze({ FieldName: "ListDataID", field: "ListDataID" }),
    Object.freeze({ FieldName: "CreatedBy", field: "CreatedBy" }),
    Object.freeze({ FieldName: "ModifiedBy", field: "ModifiedBy" }),
    Object.freeze({ FieldName: "Created", field: "Created" }),
    Object.freeze({ FieldName: "Modified", field: "Modified" }),
]);
/**
 * Produces the deterministic, pre-host-lowering portion of a default Data List
 * LayoutView. Field IDs and template static descriptors are supplied inputs.
 */
export function projectDataListDefaultViewLayout(input) {
    const fields = input.fields;
    const viewIntent = input.viewIntent ?? null;
    const layoutFields = ensureTitleFirstFields(resolveDataViewFields(fields, viewIntent?.displayFields), fields).slice(0, 12);
    const queryFields = resolveDataViewFields(fields, viewIntent?.queryFields);
    const effectiveQueryFields = uniqueFieldsByName([
        ...layoutFields,
        ...(queryFields.length ? queryFields : fields),
    ]);
    const fixedFilterProjection = projectFixedFilterIntents({
        viewScope: input.viewScope,
        fields: fields.map((field) => Object.freeze({
            FieldID: field.FieldID,
            FieldName: field.FieldName,
            DisplayName: field.DisplayName,
            InternalName: field.InternalName,
            FieldType: field.FieldType,
        })),
        filterText: viewIntent?.filterConditions ?? "",
        listName: input.listName,
        viewName: viewIntent?.viewName,
    });
    const staticQueryFields = input.templateSnapshot?.staticQueryFields ?? defaultStaticQueryFields;
    const fragment = Object.freeze({
        layout: Object.freeze(layoutFields.map((field, index) => Object.freeze({
            FieldID: field.FieldID,
            FieldName: field.FieldName,
            DisplayName: field.DisplayName,
            Type: field.Type,
            Order: index + 1,
            Mobile: 2,
            Show: true,
        }))),
        filter: Object.freeze([]),
        query: Object.freeze([
            ...effectiveQueryFields.map((field) => Object.freeze({
                FieldID: field.FieldID,
                FieldName: field.FieldName,
                field: field.FieldName,
                ID: field.FieldID,
                Name: field.DisplayName,
                Type: field.Type,
                Rules: field.Rules || {},
                InternalName: field.InternalName || field.FieldName,
            })),
            ...staticQueryFields.map((field) => Object.freeze({
                FieldName: field.FieldName,
                field: field.field,
            })),
        ]),
        sort: Object.freeze([]),
        rowColor: Object.freeze([]),
    });
    return Object.freeze({
        fragment,
        fixedFilterProjection,
        findings: Object.freeze(fixedFilterProjection.findings.map((finding) => Object.freeze({
            code: finding.code,
            message: finding.message,
            context: Object.freeze({ ...finding.context }),
        }))),
    });
}
function ensureTitleFirstFields(fields, allFields = fields) {
    const titleField = fields.find((field) => field.FieldName === "Title")
        || allFields.find((field) => field.FieldName === "Title");
    return titleField
        ? [titleField, ...fields.filter((field) => field.FieldName !== "Title")]
        : fields;
}
function uniqueFieldsByName(fields) {
    const seen = new Set();
    const result = [];
    for (const field of fields) {
        const fieldName = field?.FieldName;
        if (!fieldName || seen.has(fieldName))
            continue;
        seen.add(fieldName);
        result.push(field);
    }
    return result;
}
function resolveDataViewFields(fields, plannedText) {
    const tokens = splitPlannedFieldList(plannedText);
    if (!tokens.length)
        return fields.slice(0, 8);
    const result = [];
    const seen = new Set();
    for (const token of tokens) {
        const field = resolveDataViewField(fields, token);
        if (!field || seen.has(field.FieldName))
            continue;
        seen.add(field.FieldName);
        result.push(field);
    }
    return result.length ? result : fields.slice(0, 8);
}
function splitPlannedFieldList(value) {
    const text = cleanResourceName(value)
        .replace(/\bquery\b|\bsearch\b|\bfields?\b|\bcolumns?\b/gi, " ")
        .replace(/\s+and\s+/gi, ",");
    if (!text || isNonResourceName(text) || /^(all|all fields|default)$/i.test(text))
        return [];
    return text.split(/[,;，；、]/).map((item) => cleanResourceName(item)).filter((item) => item && !isNonResourceName(item));
}
function resolveDataViewField(fields, requestedName) {
    const requested = layoutViewNormalizedKey(requestedName);
    if (!requested)
        return null;
    return fields.find((field) => [field.DisplayName, field.FieldName, field.InternalName]
        .some((value) => layoutViewNormalizedKey(value) === requested)) || null;
}
function cleanResourceName(value) {
    return String(value ?? "")
        .replace(/<[^>]+>/g, "")
        .replace(/`|\*\*/g, "")
        .replace(/^[\s'"“”‘’([{]+|[\s'"“”‘’.,;:!?…)}\]]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
function isNonResourceName(value) {
    const text = cleanResourceName(value);
    if (isPlanningPlaceholder(text))
        return true;
    if (/^(status|resource type|notes?|owner|used by|actions?|fields?)$/i.test(text))
        return true;
    if (/^no\s+(?:form\s+)?reports?\b/i.test(text))
        return true;
    if (/^no custom\b/i.test(text))
        return true;
    return /^(dashboard|dashboard page|dashboard page name|page|page name|list name|form name|group|item|section|metric name|filter name)$/i.test(text);
}
function isPlanningPlaceholder(value) {
    const text = cleanResourceName(value).toLowerCase().replace(/\bn\s*[./]\s*a\b/g, "n/a");
    return !text || ["deferred", "n/a", "no", "none", "not applicable", "not planned", "not required"].includes(text)
        || /^(?:not applicable|not planned|not required|deferred|n\/a|none)(?:\s*[-–—:]\s*.+)$/i.test(text);
}
function layoutViewNormalizedKey(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
/**
 * Produces the immutable fragment for one non-default Type 0 Data List view.
 * The function deliberately reuses the tested structural fragment contract,
 * while enforcing the non-default intent and a stable non-default key scope.
 */
export function projectDataListAdditionalViewLayout(input) {
    if (!input || input.viewIntent?.isDefault !== false) {
        throw new TypeError("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_INTENT_INVALID");
    }
    if (!isStableAdditionalViewScope(input.viewScope)) {
        throw new TypeError("DATA_LIST_ADDITIONAL_VIEW_LAYOUT_SCOPE_INVALID");
    }
    return projectDataListDefaultViewLayout({
        viewScope: input.viewScope,
        fields: input.fields,
        viewIntent: input.viewIntent,
        templateSnapshot: input.templateSnapshot,
        listName: input.listName,
    });
}
function isStableAdditionalViewScope(value) {
    const scope = String(value ?? "").trim();
    return Boolean(scope)
        && !/(?:^|\/)default$/iu.test(scope)
        && !/[\\]/u.test(scope)
        && !/\s/u.test(scope);
}
export function projectDataListScalarResourceDefinitionIntent(input) {
    if (!input || typeof input.resourceScope !== "string" || !input.resourceScope.trim() || !Number.isInteger(input.fieldOrdinal) || input.fieldOrdinal < 0 || !input.projection)
        throw new TypeError("DATA_LIST_SCALAR_RESOURCE_INTENT_INVALID");
    const projection = input.projection;
    const requestId = `${input.resourceScope}:FieldID:${input.fieldOrdinal}`;
    const preIdFieldRecord = Object.freeze({
        FieldName: projection.fieldName, FieldType: projection.canonicalFieldType, FieldIndex: projection.fieldIndex,
        DisplayName: projection.displayName, InternalName: projection.internalName, Type: projection.canonicalControlType,
        Status: projection.status, Category: projection.category, DefaultValue: projection.defaultValue, Rules: projection.rules,
        IsSort: projection.sortable, IsSystem: projection.system, IsUnique: projection.unique, IsIndex: projection.index,
        Ext1: "", Ext2: "", Ext3: "",
    });
    return Object.freeze({ resourceScope: input.resourceScope, fieldOrdinal: input.fieldOrdinal, fieldRequest: Object.freeze({ requestId, resourceScope: input.resourceScope, kind: "FieldID", ordinal: input.fieldOrdinal }), preIdFieldRecord, findings: Object.freeze([]) });
}
/**
 * Internal-only deterministic Lookup intent projection. It deliberately has
 * no target identity, target map, host resource, or external-state input.
 */
export function projectDataListLookupResolutionIntent(input) {
    if (!input || input.surface !== "data-list" || input.controlType !== "lookup")
        throw new TypeError("DATA_LIST_LOOKUP_INTENT_INVALID");
    const sourceResourceKey = lookupResolutionNormalizedKey(input.sourceResourceKey);
    const sourceFieldKey = lookupResolutionNormalizedKey(input.sourceFieldKey);
    if (!sourceResourceKey || !sourceFieldKey || !Number.isInteger(input.sourceFieldOrdinal) || input.sourceFieldOrdinal < 0) {
        throw new TypeError("DATA_LIST_LOOKUP_INTENT_INVALID");
    }
    const displayNameKey = lookupResolutionNormalizedKey(input.displayName);
    const candidates = lookupResolutionUnique([
        lookupResolutionNormalizedKey(input.lookupTarget),
        displayNameKey,
        displayNameKey ? lookupResolutionNormalizedKey(`${input.displayName}s`) : "",
    ]);
    if (!candidates.length) {
        return Object.freeze({
            intent: null,
            findings: Object.freeze([Object.freeze({
                    code: "DATA_LIST_LOOKUP_TARGET_UNRESOLVED",
                    message: "A Data List Lookup field has no deterministic target candidate.",
                    sourceResourceKey,
                    sourceFieldKey,
                })]),
        });
    }
    const requestId = `data-list-lookup:${sourceResourceKey}:${sourceFieldKey}:${input.sourceFieldOrdinal}`;
    const resolutionRequest = Object.freeze({
        requestId,
        sourceResourceKey,
        sourceFieldKey,
        sourceFieldOrdinal: input.sourceFieldOrdinal,
        candidateKeys: Object.freeze(candidates),
    });
    return Object.freeze({
        intent: Object.freeze({
            surface: "data-list",
            sourceResourceKey,
            sourceFieldKey,
            sourceFieldOrdinal: input.sourceFieldOrdinal,
            declaredTargetKey: candidates[0],
            displayField: "Title",
            resolutionRequest,
        }),
        findings: Object.freeze([]),
    });
}
function lookupResolutionNormalizedKey(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function lookupResolutionUnique(values) {
    return [...new Set(values.filter(Boolean))];
}
export function projectDataListType1IdentityControlPlacement(input) {
    if (!input || input.surface !== "data-list" || !["view", "workbench"].includes(input.templateKind) || !Number.isInteger(input.ordinal) || input.ordinal < 0)
        throw new TypeError("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_INVALID");
    if (!isIdentityShape(input.field) || isSublistShape(input.field))
        return freeze({ intent: null, findings: [] });
    const fieldName = requiredText(input.field.fieldName);
    const displayName = requiredText(input.field.displayName);
    const formName = requiredText(input.formName);
    const listName = requiredText(input.listName);
    const listId = losslessId(input.references?.listId);
    const fieldId = losslessId(input.references?.fieldId);
    const templateId = requiredText(input.templateSnapshot?.templateId);
    const templateScope = requiredText(input.templateSnapshot?.templateScope);
    const fieldsGridNodeRef = requiredText(input.references?.fieldsGridNodeRef);
    const controlSlotRef = requiredText(input.references?.controlSlotRef);
    const descriptor = {
        type: "dynamic-user",
        name: displayName,
        title: displayName,
        label: displayName,
        nv_label: "field_" + slug(fieldName),
        binding: fieldName,
        fieldID: fieldId,
        displayLabel: [null, true],
        attrs: {
            common: { margin: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }] },
            data: { list: { AppID: 41, ListID: listId, Type: 1, Title: listName }, field: fieldName, fieldName, fieldId },
        },
    };
    return freeze({ intent: { templateId, templateScope, fieldsGridNodeRef, controlSlotRef, ordinal: input.ordinal, descriptor }, findings: [] });
}
function isIdentityShape(field) {
    return /user|identity|people|person/.test([field?.fieldType, field?.controlType, field?.type, field?.fieldName].join(" ").toLowerCase());
}
function isSublistShape(field) {
    return /sub\s*list|\blist\b/.test([field?.fieldType, field?.controlType, field?.type, field?.fieldName].join(" ").toLowerCase());
}
function requiredText(value) { const text = typeof value === "string" ? value.trim() : ""; if (!text)
    throw new TypeError("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_INVALID"); return text; }
function losslessId(value) { if (typeof value !== "string" || !/^\d{1,30}$/.test(value))
    throw new TypeError("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_INVALID"); return value; }
function slug(value) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "field"; }
function freeze(value) { if (value && typeof value === "object") {
    for (const item of Object.values(value))
        freeze(item);
    Object.freeze(value);
} return value; }
export function projectDataListSublistScalarRowSchema(input) {
    if (!input || input.surface !== "data-list-sublist" || !Array.isArray(input.rows)) {
        throw new TypeError("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_INVALID");
    }
    const ids = {
        parentListId: sublistLosslessId(input.parentListId), childListId: sublistLosslessId(input.childListId),
        parentFieldId: sublistLosslessId(input.parentFieldId), childFieldId: sublistLosslessId(input.childFieldId),
        rowSchemaId: sublistRequiredText(input.rowSchemaId), templateScope: sublistRequiredText(input.templateScope),
    };
    const rows = input.rows.map((row, index) => sublistNormalizeRow(row, index));
    if (rows.some((row) => row === null))
        return sublistFreeze({ intent: null, findings: [] });
    const descriptors = rows;
    if (new Set(descriptors.map((row) => row.id)).size !== descriptors.length || new Set(descriptors.map((row) => row.idx)).size !== descriptors.length) {
        throw new TypeError("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_INVALID");
    }
    descriptors.sort((left, right) => left.ordinal - right.ordinal);
    return sublistFreeze({ intent: { ...ids, rows: descriptors }, findings: [] });
}
function sublistNormalizeRow(row, expectedOrdinal) {
    if (!row || !Number.isInteger(row.ordinal) || row.ordinal !== expectedOrdinal)
        throw new TypeError("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_INVALID");
    const type = sublistScalarType(row.fieldType);
    if (!type)
        return null;
    return {
        idx: sublistRequiredText(row.rowSchemaRowId), id: sublistRequiredText(row.fieldName), name: sublistRequiredText(row.name), displayName: sublistRequiredText(row.displayName),
        type, editable: row.editable !== false, controlType: sublistClean(row.controlType), ordinal: row.ordinal,
    };
}
function sublistScalarType(value) {
    const type = sublistClean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (/user|identity|person|lookup|file|attachment|image|binary|barcode|sub\s*list|\blist\b|department|workflow|action/.test(type))
        return null;
    if (/date|time/.test(type))
        return "date";
    if (/bool|switch|yes no/.test(type))
        return "boolean";
    if (/number|decimal|currency|integer/.test(type))
        return "number";
    return "text";
}
function sublistRequiredText(value) { const text = sublistClean(value); if (!text)
    throw new TypeError("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_INVALID"); return text; }
function sublistLosslessId(value) { if (typeof value !== "string" || !/^\d{1,30}$/.test(value))
    throw new TypeError("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_INVALID"); return value; }
function sublistClean(value) { return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""; }
function sublistFreeze(value) { if (value && typeof value === "object") {
    for (const child of Object.values(value))
        sublistFreeze(child);
    Object.freeze(value);
} return value; }
/**
 * Projects Data List planning-only embedded-Sublist configuration. It does
 * not receive a field record, control, resource, template, package, host
 * context, or runtime state. Lookup target lowering and every Phase 9-16
 * specialized route remain host-owned materializer seams.
 */
export function projectDataListSublistStaticConfiguration(request) {
    if (request?.surface !== "data-list-sublist-static-configuration") {
        throw new Error("DATA_LIST_SUBLIST_STATIC_CONFIGURATION_SCOPE_INVALID");
    }
    if (["template", "resource", "package", "hostContext", "control", "fieldRecord", "runtimeState"].some((key) => Object.prototype.hasOwnProperty.call(request, key))) {
        throw new Error("DATA_LIST_SUBLIST_STATIC_CONFIGURATION_HOST_STATE_FORBIDDEN");
    }
    let value;
    switch (request.kind) {
        case "parse-row-fields":
            value = sublistStaticParseRowFields(request.value);
            break;
        case "parse-summaries":
            value = sublistStaticParseSummaries(request.value);
            break;
        case "normalize-row-type":
            value = sublistStaticNormalizeRowType(request.value);
            break;
        case "normalize-control-type":
            value = sublistStaticNormalizeControlType(request.value);
            break;
        case "is-sublist-form-field":
            value = sublistStaticIsSublistFormField(request.value);
            break;
        default: throw new Error("DATA_LIST_SUBLIST_STATIC_CONFIGURATION_KIND_INVALID");
    }
    return sublistStaticFreeze({ kind: request.kind, value });
}
function sublistStaticParseRowFields(value) {
    const text = String(value || "").trim();
    if (!text || /^(?:none|n\/a|not applicable)$/i.test(text))
        return sublistStaticFreeze([]);
    if (text.startsWith("[")) {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed))
                return sublistStaticFreeze(parsed.map((item) => sublistStaticCloneJson(item)));
        }
        catch {
            return sublistStaticFreeze([]);
        }
    }
    return sublistStaticFreeze(text.split(/\s*;\s*/).map((entry) => {
        const [id, displayName, fieldType, controlType, idx, editable, lookupTarget] = entry.split(/\s*:\s*/);
        const lookup = sublistStaticParseLookupTarget(lookupTarget);
        return sublistStaticFreeze({
            id: sublistStaticCleanResourceName(id),
            idx: sublistStaticCleanResourceName(idx),
            displayName: sublistStaticCleanResourceName(displayName || id),
            columnTitle: sublistStaticCleanResourceName(displayName || id),
            fieldType: sublistStaticCleanResourceName(fieldType) || "Text",
            controlType: sublistStaticCleanResourceName(controlType),
            editable: !/^(?:false|no|off|readonly)$/i.test(sublistStaticCleanResourceName(editable)),
            value: lookup?.value,
            lookupDisplayField: lookup?.displayField,
            lookupAddition: lookup?.addition,
            lookupAdditionInvalid: lookup?.additionInvalid === true,
        });
    }).filter((field) => Boolean(field.id && field.displayName)));
}
function sublistStaticParseLookupTarget(value) {
    const text = sublistStaticCleanStructuredPlanCell(value).replace(/\\\|/g, "|");
    if (!text)
        return undefined;
    const [targetText, additionText = ""] = text.split("|");
    const fields = sublistStaticKeyValues(targetText);
    if (String(fields.AppID || "") !== "41" || !/^\d{19}$/.test(String(fields.ListID || "")) || !/^\d{19}$/.test(String(fields.ListSetID || "")))
        return undefined;
    const additionFields = sublistStaticKeyValues(additionText);
    const addition = additionText
        ? (additionFields.FieldName && /^\d{19}$/.test(String(additionFields.FieldID || "")) && additionFields.RelationName && /^\d+$/.test(String(additionFields.Order || "")) && String(additionFields.IsShow) === "true"
            ? sublistStaticFreeze([sublistStaticFreeze({ FieldName: String(additionFields.FieldName), FieldID: String(additionFields.FieldID), RelationName: String(additionFields.RelationName), Order: String(additionFields.Order), IsShow: true })])
            : undefined)
        : sublistStaticFreeze([]);
    return sublistStaticFreeze({ value: sublistStaticFreeze({ AppID: "41", ListID: String(fields.ListID), ListSetID: String(fields.ListSetID) }), displayField: sublistStaticCleanResourceName(fields.ListField || fields.listfield || fields.DisplayField || fields.displayField), addition, additionInvalid: Boolean(additionText && !addition) });
}
function sublistStaticParseSummaries(value) {
    const text = String(value || "").trim();
    if (!text || /^(?:none|n\/a|not applicable)$/i.test(text))
        return sublistStaticFreeze([]);
    if (text.startsWith("[")) {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed))
                return sublistStaticFreeze(parsed.map(sublistStaticNormalizeSummary).filter(Boolean));
        }
        catch {
            return sublistStaticFreeze([]);
        }
    }
    return sublistStaticFreeze(text.split(/\s*;\s*/).map((entry) => {
        const [field, type, targetKind, target] = entry.split(/\s*:\s*/);
        return sublistStaticNormalizeSummary({ field, type, targetKind, target });
    }).filter(Boolean));
}
function sublistStaticNormalizeSummary(value) {
    const summary = sublistStaticRecord(value);
    const field = sublistStaticCleanResourceName(summary.field || summary.sourceField);
    const type = sublistStaticNormKey(summary.type || summary.summaryType) || "total";
    const target = sublistStaticCleanResourceName(summary.target || summary.bindingValue || summary.value);
    const kind = sublistStaticNormKey(summary.targetKind || summary.bindingKind || summary.prefix);
    const prefix = kind === "__temp_" || /temp/.test(kind) ? "__temp_" : kind === "__list_" || /list|field|record/.test(kind) ? "__list_" : "__variables_";
    if (!field)
        return null;
    return sublistStaticFreeze({ field, type, display: summary.display !== false, binding: target ? sublistStaticFreeze({ prefix, value: target }) : null });
}
function sublistStaticNormalizeRowType(value) {
    const type = sublistStaticNormKey(value);
    if (/lookup|reference|relation/.test(type))
        return "lookup";
    if (/user|identity|person/.test(type))
        return "user";
    if (/date|time/.test(type))
        return "date";
    if (/bool|switch|yes no/.test(type))
        return "boolean";
    if (/number|decimal|currency|integer/.test(type))
        return "number";
    if (/file|attachment/.test(type))
        return "file";
    return "text";
}
function sublistStaticNormalizeControlType(value) {
    const input = sublistStaticRecord(value);
    const explicit = sublistStaticNormKey(input.controlType);
    if (/lookup|reference|relation/.test(explicit))
        return "lookup";
    if (/identity|user picker/.test(explicit))
        return "identity-picker";
    if (/date/.test(explicit))
        return "datepicker";
    if (/number/.test(explicit))
        return "input_number";
    if (/switch|toggle/.test(explicit))
        return "switch";
    if (/file|upload/.test(explicit))
        return "file-upload";
    if (/input/.test(explicit))
        return "input";
    return { user: "identity-picker", date: "datepicker", number: "input_number", boolean: "switch", file: "file-upload", lookup: "lookup" }[String(input.rowType || "")] || "input";
}
function sublistStaticIsSublistFormField(value) {
    const input = sublistStaticRecord(value);
    const field = sublistStaticRecord(input.field);
    return /sub list|sublist|\blist\b/.test(sublistStaticNormKey(`${field.DisplayName || ""} ${field.FieldType || ""} ${field.Type || ""} ${input.controlType || ""}`));
}
function sublistStaticKeyValues(value) { return Object.fromEntries(value.split(/\s*,\s*/).filter(Boolean).map((entry) => { const separator = entry.indexOf("="); return separator === -1 ? ["", ""] : [entry.slice(0, separator).trim(), entry.slice(separator + 1).trim()]; })); }
function sublistStaticCleanResourceName(value) { return String(value ?? "").replace(/<[^>]+>/g, "").replace(/`/g, "").replace(/\*\*/g, "").replace(/^[\s'\"“”‘’([{]+|[\s'\"“”‘’.,;:!?…)}\]]+$/g, "").replace(/\s+/g, " ").trim(); }
function sublistStaticCleanStructuredPlanCell(value) { return String(value == null ? "" : value).trim().replace(/^`([\s\S]*)`$/, "$1").trim(); }
function sublistStaticNormKey(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function sublistStaticRecord(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function sublistStaticCloneJson(value) { return value === undefined ? null : JSON.parse(JSON.stringify(value)); }
function sublistStaticFreeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value))
        sublistStaticFreeze(child);
    Object.freeze(value);
} return value; }
const operations = new Set(["total", "average", "minimum", "maximum", "count"]);
const scalarTypes = new Set(["text", "date", "datetime", "number", "decimal", "boolean", "bit"]);
/** Internal-only projection of static scalar aggregate intent; it never owns variables or host bindings. */
export function projectDataListSublistScalarSummaryIntent(input) {
    const findings = [];
    const summaryKey = summaryText(input?.summaryKey);
    const reference = summaryText(input?.summaryReference);
    const source = input?.sourceColumn;
    const operation = summaryText(input?.aggregateOperation);
    if (!summaryKey)
        findings.push(summaryFinding("SUBLIST_SUMMARY_REFERENCE_MISSING", summaryKey));
    if (!reference || reference !== `summary:${summaryKey}`)
        findings.push(summaryFinding("SUBLIST_SUMMARY_REFERENCE_RELATIONSHIP_BROKEN", summaryKey));
    if (input?.scope !== "data-list-sublist")
        findings.push(summaryFinding("SUBLIST_SUMMARY_REFERENCE_WRONG_SCOPE", summaryKey));
    if ((input?.knownSummaryReferences || []).filter((value) => value === reference).length > 1)
        findings.push(summaryFinding("SUBLIST_SUMMARY_REFERENCE_DUPLICATE", summaryKey));
    if (input?.temporaryVariableReference !== undefined && input?.temporaryVariableReference !== null)
        findings.push(summaryFinding("SUBLIST_TEMP_VARIABLE_REFERENCE_INVALID", summaryKey));
    if (input?.runtimeExpression !== undefined && input?.runtimeExpression !== null)
        findings.push(summaryFinding("SUBLIST_SUMMARY_REFERENCE_INVALID", summaryKey));
    if (!source || !summaryText(source.id) || !summaryText(source.name) || !scalarTypes.has(source.scalarType) || !operations.has(operation))
        findings.push(summaryFinding("SUBLIST_SUMMARY_REFERENCE_INVALID", summaryKey));
    if (source && operation !== "count" && source.scalarType !== "number" && source.scalarType !== "decimal")
        findings.push(summaryFinding("SUBLIST_SUMMARY_REFERENCE_INVALID", summaryKey));
    if (findings.length)
        return summaryFrozenResult(null, null, findings);
    const sourceColumn = Object.freeze({ id: summaryText(source.id), name: summaryText(source.name), scalarType: source.scalarType });
    const intent = Object.freeze({ summaryKey, summaryReference: reference, sourceColumn, aggregateOperation: operation, display: input.display === true, format: summaryText(input.format) });
    const descriptor = Object.freeze({ key: summaryKey, reference, field: sourceColumn.name, operation, display: intent.display, format: intent.format });
    return summaryFrozenResult(intent, descriptor, []);
}
function summaryFrozenResult(intent, descriptor, findings) { return Object.freeze({ intent, descriptor, findings: Object.freeze([...findings]) }); }
function summaryFinding(code, summaryKey) { return Object.freeze({ code, message: code, summaryKey }); }
function summaryText(value) { return typeof value === "string" ? value.trim() : ""; }
const dynamicSummaryOperations = new Set(["total", "average", "minimum", "maximum", "count"]);
/** Internal-only projection. Host scope resolution, variable lifecycle, and runtime execution are prohibited here. */
export function projectDataListSublistDynamicSummaryIntent(input) {
    const findings = [];
    if (input?.surface !== "data-list-sublist-dynamic-summary")
        findings.push(dynamicSummaryFinding("SUBLIST_DYNAMIC_SUMMARY_SURFACE_INVALID"));
    if (input?.hostContext !== undefined || input?.temporaryVariableReference !== undefined)
        findings.push(dynamicSummaryFinding("SUBLIST_DYNAMIC_SUMMARY_HOST_CONTEXT_FORBIDDEN"));
    if (input?.runtimeExpression !== undefined && input?.runtimeExpression !== null)
        findings.push(dynamicSummaryFinding("SUBLIST_DYNAMIC_SUMMARY_RUNTIME_EXPRESSION_FORBIDDEN"));
    const scope = input?.scope;
    if (!scope || ![scope.parentListId, scope.layoutId, scope.layoutResourceId, scope.parentFieldId, scope.sublistControlId, scope.summaryId].every(dynamicSummaryText))
        findings.push(dynamicSummaryFinding("SUBLIST_DYNAMIC_SUMMARY_SCOPE_INVALID"));
    if (scope && scope.summaryId && (!scope.parentFieldId || !scope.sublistControlId))
        findings.push(dynamicSummaryFinding("SUBLIST_DYNAMIC_SUMMARY_SUMMARY_STANDALONE_FORBIDDEN"));
    const source = input?.sourceColumn;
    if (!source || !dynamicSummaryText(source.id) || !dynamicSummaryText(source.idx) || !dynamicSummaryText(source.name) || (source.scalarType !== "number" && source.scalarType !== "decimal"))
        findings.push(dynamicSummaryFinding("SUBLIST_DYNAMIC_SUMMARY_SOURCE_INVALID"));
    const summary = input?.summary;
    if (!summary || !dynamicSummaryText(summary.field) || !dynamicSummaryOperations.has(summary.type) || summary.field !== source?.id)
        findings.push(dynamicSummaryFinding("SUBLIST_DYNAMIC_SUMMARY_SUMMARY_INVALID"));
    const binding = input?.binding;
    const bindingValid = binding && dynamicSummaryText(binding.value) && binding.targetDescriptor && dynamicSummaryText(binding.targetDescriptor.id) && dynamicSummaryText(binding.targetDescriptor.idx) && ((binding.kind === "data-list-field" && binding.prefix === "__list_") || (binding.kind === "temp-variable" && binding.prefix === "__temp_"));
    if (!bindingValid)
        findings.push(dynamicSummaryFinding("SUBLIST_DYNAMIC_SUMMARY_BINDING_INVALID"));
    if (findings.length)
        return dynamicSummaryFrozenResult(null, null, findings);
    const immutableScope = Object.freeze({ parentListId: scope.parentListId, layoutId: scope.layoutId, layoutResourceId: scope.layoutResourceId, parentFieldId: scope.parentFieldId, sublistControlId: scope.sublistControlId, summaryId: scope.summaryId });
    const immutableSource = Object.freeze({ id: source.id, idx: source.idx, name: source.name, scalarType: source.scalarType });
    const immutableSummary = Object.freeze({ field: summary.field, type: summary.type, display: summary.display === true });
    const targetDescriptor = Object.freeze({ id: binding.targetDescriptor.id, idx: binding.targetDescriptor.idx });
    const immutableBinding = Object.freeze({ kind: binding.kind, prefix: binding.prefix, value: binding.value, targetDescriptor });
    const intent = Object.freeze({ surface: "data-list-sublist-dynamic-summary", scope: immutableScope, sourceColumn: immutableSource, summary: immutableSummary, binding: immutableBinding });
    const descriptor = Object.freeze({ scope: immutableScope, field: immutableSummary.field, type: immutableSummary.type, display: immutableSummary.display, binding: immutableBinding });
    return dynamicSummaryFrozenResult(intent, descriptor, []);
}
function dynamicSummaryText(value) { return typeof value === "string" && value.length > 0; }
function dynamicSummaryFinding(code) { return Object.freeze({ code, message: code }); }
function dynamicSummaryFrozenResult(intent, descriptor, findings) { return Object.freeze({ intent, descriptor, findings: Object.freeze([...findings]) }); }
const nestedControlScalarTypes = new Set(["text", "date", "number", "boolean"]);
/** Internal-only projection. It never loads, allocates, mutates, inserts, or binds a template graph. */
export function projectDataListSublistNestedControlPlacementIntent(input) {
    const findings = [];
    if (input?.surface !== "data-list-sublist-nested-control-placement")
        findings.push(nestedControlFinding("SUBLIST_NESTED_CONTROL_TEMPLATE_SNAPSHOT_INVALID"));
    if (input?.template !== undefined || input?.resource !== undefined || input?.controlId !== undefined || input?.runtimeBinding !== undefined)
        findings.push(nestedControlFinding("SUBLIST_NESTED_CONTROL_CORE_HOST_STATE_FORBIDDEN"));
    const snapshot = input?.templateSnapshot;
    if (!snapshot)
        findings.push(nestedControlFinding("SUBLIST_NESTED_CONTROL_TEMPLATE_SNAPSHOT_MISSING"));
    else if (!nestedControlText(snapshot.templateId) || !nestedControlText(snapshot.templateScope) || !nestedControlText(snapshot.parentNodeReference) || snapshot.listFieldsSlotReference !== "attrs.list-fields" || snapshot.childControlSlotReference !== "list-field.control")
        findings.push(nestedControlFinding("SUBLIST_NESTED_CONTROL_TEMPLATE_SNAPSHOT_INVALID"));
    const scope = input?.scope;
    if (!scope || !nestedControlLossless(scope.parentListId) || !nestedControlLossless(scope.parentFieldId) || !nestedControlText(scope.parentControlReference))
        findings.push(nestedControlFinding("SUBLIST_NESTED_CONTROL_SCOPE_MISMATCH"));
    const columns = Array.isArray(input?.columns) ? input.columns : [];
    if (!columns.length)
        findings.push(nestedControlFinding("SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_MISSING"));
    const references = new Set();
    columns.forEach((column) => {
        if (!nestedControlText(column?.childControlReference))
            findings.push(nestedControlFinding("SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_MISSING"));
        else if (references.has(column.childControlReference))
            findings.push(nestedControlFinding("SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_DUPLICATE"));
        else
            references.add(column.childControlReference);
        if (!nestedControlText(column?.id) || !nestedControlText(column?.idx) || !nestedControlText(column?.name) || !nestedControlScalarTypes.has(column?.type) || typeof column?.editable !== "boolean")
            findings.push(nestedControlFinding("SUBLIST_NESTED_CONTROL_CHILD_REFERENCE_INVALID"));
    });
    if (findings.length)
        return nestedControlFrozen(null, findings);
    const immutableSnapshot = Object.freeze({ templateId: snapshot.templateId, templateScope: snapshot.templateScope, parentNodeReference: snapshot.parentNodeReference, listFieldsSlotReference: "attrs.list-fields", childControlSlotReference: "list-field.control" });
    const immutableScope = Object.freeze({ parentListId: scope.parentListId, parentFieldId: scope.parentFieldId, parentControlReference: scope.parentControlReference });
    const placements = Object.freeze(columns.map((column, ordinal) => Object.freeze({ ordinal, childControlReference: column.childControlReference, slotReference: "attrs.list-fields", column: Object.freeze({ id: column.id, idx: column.idx, name: column.name, type: column.type, editable: column.editable }), control: Object.freeze(nestedControlKind(column.type)) })));
    return nestedControlFrozen(Object.freeze({ surface: "data-list-sublist-nested-control-placement", templateSnapshot: immutableSnapshot, scope: immutableScope, placements }), []);
}
function nestedControlKind(type) { return type === "date" ? { type: "datepicker", defaultValue: null } : type === "number" ? { type: "input_number", defaultValue: null } : type === "boolean" ? { type: "switch", defaultValue: false } : { type: "input", defaultValue: null }; }
function nestedControlLossless(value) { return typeof value === "string" && /^\d{1,30}$/u.test(value); }
function nestedControlText(value) { return typeof value === "string" && value.length > 0; }
function nestedControlFinding(code) { return Object.freeze({ code, message: code }); }
function nestedControlFrozen(intent, findings) { return Object.freeze({ intent, findings: Object.freeze([...findings]) }); }
export function projectDataListSublistEmbeddedLookupIntent(input) { const findings = []; if (input?.surface !== "data-list-sublist-embedded-lookup")
    findings.push(embeddedLookupFinding("SUBLIST_EMBEDDED_LOOKUP_SCOPE_MISMATCH")); if (input?.template !== undefined || input?.resource !== undefined || input?.controlId !== undefined || input?.addition !== undefined)
    findings.push(embeddedLookupFinding("SUBLIST_EMBEDDED_LOOKUP_HOST_STATE_FORBIDDEN")); const s = input?.scope, c = input?.column, t = input?.target; if (!s || ![s.parentListId, s.parentFieldId, s.layoutId, s.layoutResourceId].every(embeddedLookupScopeId) || !embeddedLookupText(s.parentControlReference) || s.listFieldsSlotReference !== "attrs.list-fields" || s.childControlSlotReference !== "list-field.control")
    findings.push(embeddedLookupFinding("SUBLIST_EMBEDDED_LOOKUP_SCOPE_MISMATCH")); if (!c || !embeddedLookupText(c.id) || !embeddedLookupText(c.idx) || !embeddedLookupText(c.name) || c.type !== "lookup" || typeof c.editable !== "boolean")
    findings.push(embeddedLookupFinding("SUBLIST_EMBEDDED_LOOKUP_COLUMN_INVALID")); if (!t || t.appId !== 41 || !embeddedLookupTargetId(t.listId) || !embeddedLookupTargetId(t.listSetId) || t.displayField !== "Title" || !embeddedLookupText(t.valueField) || t.valueField !== c?.id)
    findings.push(embeddedLookupFinding("SUBLIST_EMBEDDED_LOOKUP_TARGET_INVALID")); return findings.length ? embeddedLookupFrozen(null, findings) : embeddedLookupFrozen(Object.freeze({ surface: "data-list-sublist-embedded-lookup", scope: Object.freeze({ ...s }), column: Object.freeze({ ...c }), target: Object.freeze({ ...t }) }), []); }
const embeddedLookupScopeId = (v) => typeof v === "string" && /^\d{1,30}$/.test(v);
const embeddedLookupTargetId = (v) => typeof v === "string" && /^\d{19}$/.test(v);
const embeddedLookupText = (v) => typeof v === "string" && v.length > 0;
const embeddedLookupFinding = (code) => Object.freeze({ code, message: code });
const embeddedLookupFrozen = (intent, findings) => Object.freeze({ intent, findings: Object.freeze([...findings]) });
export function projectDataListSublistLookupAdditionalFieldIntent(input) {
    const findings = [];
    const scope = input?.scope;
    const lookup = input?.lookup;
    const source = input?.source;
    const destination = input?.destination;
    if (input?.surface !== "data-list-sublist-lookup-additional-field" || !scope || ![scope.parentListId, scope.parentFieldId, scope.layoutId, scope.layoutResourceId].every(lookupAdditionalScopeId) || ![scope.parentSublistBinding, scope.parentSublistControlId].every(lookupAdditionalText))
        lookupAdditionalFinding(findings, "SUBLIST_LOOKUP_ADDITIONAL_SCOPE_MISMATCH");
    if (!lookup || !lookupAdditionalText(lookup.id) || !lookupAdditionalText(lookup.idx) || lookup.appId !== 41 || !lookupAdditionalTargetId(lookup.targetListId) || !lookupAdditionalTargetId(lookup.targetListSetId) || lookup.displayField !== "Title" || !lookupAdditionalText(lookup.valueField) || lookup.valueField !== lookup.id)
        lookupAdditionalFinding(findings, "SUBLIST_LOOKUP_ADDITIONAL_TARGET_INVALID");
    if (!source || !lookupAdditionalText(source.fieldName) || !lookupAdditionalTargetId(source.fieldId) || !/^\d+$/.test(source.order) || source.isShow !== true || !lookupAdditionalText(source.relationName))
        lookupAdditionalFinding(findings, "SUBLIST_LOOKUP_ADDITIONAL_SOURCE_INVALID");
    if (!destination || !lookupAdditionalText(destination.id) || !lookupAdditionalText(destination.idx) || !lookupAdditionalText(destination.name) || !["number", "decimal"].includes(destination.type) || typeof destination.editable !== "boolean" || destination.readonly !== true || !lookupAdditionalText(destination.controlBinding) || destination.controlBinding !== destination.id)
        lookupAdditionalFinding(findings, "SUBLIST_LOOKUP_ADDITIONAL_DESTINATION_READONLY_REQUIRED");
    if (source?.relationName && destination?.id && source.relationName !== destination.id)
        lookupAdditionalFinding(findings, "SUBLIST_LOOKUP_ADDITIONAL_RELATIONSHIP_BROKEN");
    if (input?.runtime !== undefined || input?.template !== undefined || input?.resource !== undefined || input?.additionValue !== undefined)
        lookupAdditionalFinding(findings, "SUBLIST_LOOKUP_ADDITIONAL_HOST_STATE_FORBIDDEN");
    return findings.length ? lookupAdditionalFrozen(null, findings) : lookupAdditionalFrozen(Object.freeze({ surface: "data-list-sublist-lookup-additional-field", scope: Object.freeze({ ...scope }), lookup: Object.freeze({ ...lookup }), source: Object.freeze({ ...source }), destination: Object.freeze({ ...destination }) }), []);
}
function lookupAdditionalScopeId(value) { return typeof value === "string" && /^\d{1,30}$/.test(value); }
function lookupAdditionalTargetId(value) { return typeof value === "string" && /^\d{19}$/.test(value); }
function lookupAdditionalText(value) { return typeof value === "string" && value.length > 0; }
function lookupAdditionalFinding(output, code) { output.push(Object.freeze({ code, message: code })); }
function lookupAdditionalFrozen(intent, findings) { return Object.freeze({ intent, findings: Object.freeze([...findings]) }); }
/** Projects static Data List embedded-user configuration only; it has no identity runtime semantics. */
export function projectDataListSublistIdentityControlIntent(input) {
    const findings = [];
    if (input?.surface !== "data-list-sublist-identity-control")
        findings.push(identityControlFinding("SUBLIST_IDENTITY_CONTROL_SCOPE_MISMATCH"));
    if (input?.control !== undefined || input?.template !== undefined || input?.resource !== undefined || input?.package !== undefined || input?.runtime !== undefined)
        findings.push(identityControlFinding("SUBLIST_IDENTITY_CONTROL_HOST_STATE_FORBIDDEN"));
    const scope = input?.scope;
    const column = input?.column;
    if (!scope || ![scope.parentListId, scope.parentFieldId, scope.layoutId, scope.layoutResourceId].every(identityControlLosslessId) || !identityControlText(scope.parentControlReference) || scope.listFieldsSlotReference !== "attrs.list-fields" || scope.childControlSlotReference !== "list-field.control")
        findings.push(identityControlFinding("SUBLIST_IDENTITY_CONTROL_SCOPE_MISMATCH"));
    if (!column || !identityControlText(column.id) || !identityControlText(column.idx) || !identityControlText(column.name) || column.type !== "user" || typeof column.editable !== "boolean")
        findings.push(identityControlFinding("SUBLIST_IDENTITY_CONTROL_COLUMN_INVALID"));
    return findings.length
        ? identityControlFrozen(null, findings)
        : identityControlFrozen(Object.freeze({ surface: "data-list-sublist-identity-control", scope: Object.freeze({ ...scope }), column: Object.freeze({ ...column }), control: Object.freeze({ type: "identity-picker", displayLabel: Object.freeze([null, true]) }) }), []);
}
const identityControlLosslessId = (value) => typeof value === "string" && /^\d{1,30}$/.test(value);
const identityControlText = (value) => typeof value === "string" && value.length > 0;
const identityControlFinding = (code) => Object.freeze({ code, message: code });
const identityControlFrozen = (intent, findings) => Object.freeze({ intent, findings: Object.freeze([...findings]) });
/**
 * Projects only Approval Form embedded-Sublist Lookup static target/display
 * configuration. It deliberately excludes Lookup execution and all host state.
 */
export function projectApprovalFormSubListLookupStaticConfiguration(input) {
    const rowField = input;
    const existing = rowField?.lookupConfiguration && typeof rowField.lookupConfiguration === "object" && !Array.isArray(rowField.lookupConfiguration)
        ? rowField.lookupConfiguration
        : null;
    if (!existing && ![rowField?.type, rowField?.fieldType, rowField?.controlType].some((value) => normKey(value) === "lookup"))
        return null;
    const raw = existing || (rowField?.value && typeof rowField.value === "object" && !Array.isArray(rowField.value)
        ? rowField.value
        : rowField?.lookupTarget && typeof rowField.lookupTarget === "object" && !Array.isArray(rowField.lookupTarget)
            ? rowField.lookupTarget
            : undefined);
    const rawAppId = raw?.AppID ?? raw?.appId;
    const rawListId = raw?.ListID ?? raw?.listId;
    const rawListSetId = raw?.ListSetID ?? raw?.listSetId;
    const rawListField = existing?.listField ?? rowField?.lookupDisplayField ?? rowField?.listfield ?? rowField?.listField ?? raw?.ListField ?? raw?.listfield ?? raw?.DisplayField ?? raw?.displayField;
    if ([rawAppId, rawListId, rawListSetId, rawListField].some((value) => value !== undefined && typeof value !== "string"))
        throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_INVALID");
    const appId = firstNonEmpty(raw?.AppID, raw?.appId);
    const listId = firstNonEmpty(raw?.ListID, raw?.listId);
    const listSetId = firstNonEmpty(raw?.ListSetID, raw?.listSetId);
    const listField = firstNonEmpty(existing?.listField, rowField?.lookupDisplayField, rowField?.listfield, rowField?.listField, raw?.ListField, raw?.listfield, raw?.DisplayField, raw?.displayField);
    if (!appId && !listId && !listSetId && !listField)
        return null;
    if (appId !== "41" || !/^\d{19}$/.test(listId) || !/^\d{19}$/.test(listSetId) || !listField)
        throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_INVALID");
    return Object.freeze({ appId: "41", listId, listSetId, listField });
}
function firstNonEmpty(...values) { for (const value of values) {
    const text = String(value ?? "").trim();
    if (text)
        return text;
} return ""; }
function normKey(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
/** Pure projection from caller-owned JSON-safe template snapshots; no graph or resource access. */
export function projectTemplateStaticNormalization(input) {
    const kind = input?.kind;
    const record = templateStaticAsRecord(input?.value);
    let value;
    if (kind === "layout-purpose-match")
        value = templateStaticLayoutPurpose(String(record.operation || ""), String(record.purpose || ""));
    else if (kind === "data-table-template-id")
        value = templateStaticTemplateId(input?.value, input?.options?.approvedTemplateIds || []);
    else if (kind === "template-add-action")
        value = templateStaticAddAction(record);
    else if (kind === "detail-layout-action")
        value = templateStaticDetailAction(record);
    else if (kind === "source-residue-text")
        value = templateStaticResidue(record);
    else if (kind === "default-layout-attrs")
        value = templateStaticDefaultAttrs();
    else
        throw new Error(`Unsupported template static normalization kind: ${String(kind || "")}`);
    return templateStaticFreeze({ kind, value });
}
function templateStaticAsRecord(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function templateStaticNormKey(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function templateStaticLayoutPurpose(operation, purpose) {
    const op = templateStaticNormKey(operation);
    const kind = templateStaticNormKey(purpose);
    return kind === "view" ? op === "view" : kind === "new edit" ? op === "add" || op === "edit" : kind === "new" ? op === "add" : kind === "edit" ? op === "edit" : false;
}
function templateStaticTemplateId(value, approvedTemplateIds) {
    const text = String(value || "");
    for (const candidate of approvedTemplateIds) {
        const id = String(candidate || "");
        if (!id)
            continue;
        const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (new RegExp(`(^|[^A-Za-z0-9_-])${escaped}($|[^A-Za-z0-9_-])`).test(text))
            return id;
    }
    return "";
}
function templateStaticIdentityCandidates(control) {
    const attrs = templateStaticAsRecord(control.attrs);
    return [control.id, control.ID, control.key, control.name, control.Name, control.label, control.Label, control.nv_label, control.nav_label, attrs.id, attrs.name, attrs.label, attrs.nv_label, attrs.nav_label, attrs.templateMarker, attrs.dashboardPageLayoutTemplateId, attrs.dataListFormLayoutTemplateId, attrs.derivedFromDataListFormLayoutTemplate, attrs.approvalFormLayoutTemplateId, attrs.derivedFromApprovalFormLayoutTemplate, control.templateMarker, control.derivedFromDashboardPageLayoutTemplate, control.dataListFormLayoutTemplateId, control.derivedFromDataListFormLayoutTemplate, control.approvalFormLayoutTemplateId, control.derivedFromApprovalFormLayoutTemplate].filter(Boolean).map(String);
}
function templateStaticAddAction(node) {
    if (String(node.type || "") !== "action_button")
        return false;
    const attrs = templateStaticAsRecord(node.attrs);
    const actionType = String(attrs["action-type"] || attrs.actionType || attrs.operation || "").trim();
    const text = templateStaticIdentityCandidates(node).concat([node.label, templateStaticAsRecord(attrs.label).value, templateStaticAsRecord(attrs.text).value].filter(Boolean).map(String)).join(" ");
    return actionType === "5" || /\badd\b|new item|create/i.test(text);
}
function templateStaticDetailAction(action) { const text = JSON.stringify(action || {}); return text.includes("{{DetailLayoutID}}") || (/"op_type"\s*:\s*"edit"/i.test(text) && /"type"\s*:\s*"listitem"/i.test(text)); }
function templateStaticResidue(node) {
    const values = [];
    const visit = (current) => {
        const record = templateStaticAsRecord(current);
        if (!Object.keys(record).length)
            return;
        for (const key of ["text", "title", "value", "description", "placeholder", "name", "label", "nv_label", "nav_label"]) {
            const value = record[key];
            if (typeof value === "string" && value.trim())
                values.push(value);
        }
        const attrs = templateStaticAsRecord(record.attrs);
        const head = templateStaticAsRecord(attrs.headc);
        const title = templateStaticAsRecord(head.title).value ?? templateStaticAsRecord(attrs.title).value ?? attrs.text ?? attrs.value;
        if (typeof title === "string" && title.trim())
            values.push(title);
        for (const child of Array.isArray(record.children) ? record.children : [])
            visit(child);
    };
    visit(node);
    const text = values.join(" ");
    return /\bActive Loan Pipeline\b/i.test(text) || /\bActive Loans\b/i.test(text) || /\bCoordinator view of active loans/i.test(text) || /\bCoordinator guidance: prioritize overdue items and returns/i.test(text) || /\bcurrent loan volume\b/i.test(text) || /\breturn activity signal\b/i.test(text) || /\bwatch coordinator follow-up\b/i.test(text) || /\bOffice Asset records\b/i.test(text);
}
function templateStaticDefaultAttrs() { return { appearance: { bgc: "var(--c--primary-dark-hover)", color: "var(--c--background)", height: 46, ty: [null, "h6-semi-bold"] }, "navigator-menu": { bgc: "var(--c--primary-dark)", color: "var(--c--background)", position: "left", active: {} }, CustomColors: [{ id: "extra-color-1", label: "Extra Color 1", value: "#F9C434" }, { id: "extra-color-2", label: "Extra Color 2", value: "#F61515" }], CustomFonts: [{ id: "3708306f-951b-40d5-b459-26c717e8f187", label: "Extra font 1" }, { id: "dc50649a-28d3-42ec-9714-e32cf78de678", label: "Extra font 2" }] }; }
function templateStaticFreeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value))
    return value; for (const child of Object.values(value))
    templateStaticFreeze(child); return Object.freeze(value); }
export function projectResourceDefinitionStaticIntent(input) { const kind = input?.kind; let value; if (kind === "infer-resource-type")
    value = infer(input.value, input.fallback);
else if (kind === "open-resource-value-type")
    value = openType(input.value);
else if (kind === "planned-child-resources")
    value = resourceStaticChildren(input.value, input.fallback);
else
    throw Error(`Unsupported resource-definition static intent kind: ${String(kind || "")}`); return resourceStaticFreeze({ kind, value }); }
function resourceStaticKey(v) { return String(v || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function infer(v, fallback = "data-list") { const t = resourceStaticKey(v); return /\b(document library|doc library|document libraries|type 16|native document)\b/.test(t) ? "document-library" : /\b(data list|list|type 1)\b/.test(t) ? "data-list" : String(fallback || ""); }
function openType(v) { const t = resourceStaticKey(v); if (/^(text|string|input|textarea|radio|dict)$/.test(t))
    return "text"; if (/^(number|decimal|integer|percent|currency)$/.test(t))
    return "number"; if (/^(bool|boolean|bit|switch)$/.test(t))
    return "boolean"; if (/^(date|datetime|datepicker)$/.test(t))
    return "date"; if (/^(user|identity|identity picker)$/.test(t))
    return "user"; if (/^(department|organization|org)$/.test(t))
    return "department"; if (/^(lookup|list item)$/.test(t))
    return "lookup"; if (/^(file|attachment|attachments)$/.test(t))
    return "file"; if (/^(list|sublist|array)$/.test(t))
    return "list"; return t; }
function resourceStaticRecord(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
function resourceStaticChildren(v, fallback = []) { const p = resourceStaticRecord(v), r = Array.isArray(p.childResourceRecords) ? p.childResourceRecords : []; if (r.length)
    return r.map(x => { const a = resourceStaticRecord(x); return { name: a.name, resourceType: a.resourceType === "document-library" ? "document-library" : "data-list" }; }); const resources = resourceStaticRecord(p.resources), d = (Array.isArray(resources.dataLists) ? resources.dataLists : []).map(name => ({ name, resourceType: "data-list" })), l = (Array.isArray(resources.documentLibraries) ? resources.documentLibraries : []).map(name => ({ name, resourceType: "document-library" })), both = d.concat(l); return both.length ? both : (Array.isArray(fallback) ? fallback : []).map(name => ({ name, resourceType: "data-list" })); }
function resourceStaticFreeze(v) { if (!v || typeof v !== "object" || Object.isFrozen(v))
    return v; for (const x of Object.values(v))
    resourceStaticFreeze(x); return Object.freeze(v); }
export function projectDocumentLibraryStaticConfiguration(input) { const k = input?.kind, r = dlRecord(input.value); let value; if (k === "folders-for-list")
    value = dlFolders(r);
else if (k === "folder-id-path")
    value = `decoded.Childs[${String(r.childIndex ?? "")}].List.Items[${String(r.folderIndex ?? "")}].$key`;
else if (k === "folder-unique-name")
    value = `0_${String(r.folderName || "").trim().toLowerCase()}`;
else if (k === "folder-items")
    value = dlItems(r);
else if (k === "field-records")
    value = dlFields(r);
else
    throw Error(`Unsupported Document Library static configuration kind: ${String(k || "")}`); return dlFreeze({ kind: k, value }); }
function dlRecord(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
function dlKey(v) { return String(v || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function dlFolders(r) { const a = Array.isArray(r.records) ? r.records : []; return a.filter(x => dlKey(dlRecord(x).libraryName) === dlKey(r.listName)); }
function dlPath(c, f) { return `decoded.Childs[${String(c)}].List.Items[${String(f)}].$key`; }
function dlItems(r) { const a = Array.isArray(r.folders) ? r.folders : [], ids = dlRecord(r.ids); return Object.fromEntries(a.map((x, i) => { const f = dlRecord(x), id = String(ids[dlPath(r.childIndex, i)] || ""); return [id, { Title: f.folderName, Bigint1: "0", Text1: "folder", Bigint2: "", Text2: "", Text3: `0_${String(f.folderName || "").trim().toLowerCase()}` }]; })); }
function dlFields(r) { const a = Array.isArray(r.defaultFields) ? r.defaultFields : [], ids = dlRecord(r.ids), listId = String(r.listId || ""); return a.map((x, i) => { const f = dlRecord(x), rules = f.Rules && typeof f.Rules === "object" ? JSON.stringify(f.Rules) : f.Rules || ""; return { FieldID: String(ids[`decoded.Childs[${String(r.childIndex)}].Fields[${i}].FieldID`] || ""), ListID: listId, FieldName: f.FieldName, FieldType: f.FieldType, FieldIndex: f.FieldIndex, DisplayName: f.DisplayName, InternalName: f.FieldName, Type: f.Type, Status: f.Status, Category: 0, DefaultValue: "", Rules: rules, IsSort: false, IsSystem: Boolean(f.IsSystem), IsUnique: false, IsIndex: Boolean(f.IsIndex), Ext1: "", Ext2: "", Ext3: "" }; }); }
function dlFreeze(v) { if (!v || typeof v !== "object" || Object.isFrozen(v))
    return v; for (const x of Object.values(v))
    dlFreeze(x); return Object.freeze(v); }
/**
 * Projects Approval Form static configuration only. It deliberately accepts no
 * resource, template, runtime, or page-variable object and returns fresh,
 * frozen JSON-safe values for the existing host materializer seam.
 */
export function projectApprovalFormStaticConfiguration(input) {
    const kind = input?.kind;
    let value;
    if (kind === "explicit-default-approval")
        value = approvalStaticHasExplicitDefault(String(input.value || ""));
    else if (kind === "public-step-type")
        value = approvalStaticNormalizeStep(input.value);
    else if (kind === "full-row-field") {
        const field = approvalStaticRecord(input.value);
        value = approvalStaticIsFullRow(field, String(field.controlType || ""));
    }
    else if (kind === "unique-field-specs")
        value = approvalStaticUniqueFields(Array.isArray(input.value) ? input.value : []);
    else if (kind === "public-field-selection")
        value = approvalStaticSelectPublicFields(approvalStaticRecord(input.value));
    else if (kind === "no-fields-notice")
        value = approvalStaticNoFieldsNotice(approvalStaticRecord(input.value));
    else if (kind === "sublist-row-control-type")
        value = approvalStaticSublistRowControlType(input.value);
    else
        throw new Error(`Unsupported Approval Form static configuration kind: ${String(kind || "")}`);
    return approvalStaticFreeze({ kind, value });
}
function approvalStaticRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function approvalStaticClean(value) {
    return String(value ?? "")
        .replace(/<[^>]+>/g, "")
        .replace(/`/g, "")
        .replace(/\*\*/g, "")
        .replace(/^[\s'\"“”‘’([{]+|[\s'\"“”‘’.,;:!?…)}\]]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
function approvalStaticKey(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function approvalStaticPlaceholder(value) {
    const normalized = approvalStaticClean(value).toLowerCase().replace(/\bn\s*[./]s*a\b/g, "n/a");
    return !normalized
        || /^(not applicable|not planned|not required|deferred|n\/a|none)$/.test(normalized)
        || /^(?:not applicable|not planned|not required|deferred|n\/a|none)(?:\s*[-–—:].+)$/.test(normalized);
}
function approvalStaticNonResource(value) {
    const text = approvalStaticClean(value);
    return approvalStaticPlaceholder(text)
        || /^(status|resource type|notes?|owner|used by|actions?|fields?)$/i.test(text)
        || /^no\s+(?:form\s+)?reports?\b/i.test(text)
        || /^no custom\b/i.test(text)
        || /^(dashboard|dashboard page|dashboard page name|page|page name|list name|form name|group|item|section|metric name|filter name)$/i.test(text);
}
function approvalStaticHasExplicitDefault(text) {
    return /\b(user|customer|client|admin|stakeholder|business)\s+(explicitly\s+)?(approved|requested|selected|confirmed)\b[^.\n]{0,120}\b(default|yeeflow default|standard yeeflow)\b/i.test(text)
        || /\b(default|yeeflow default|standard yeeflow)\b[^.\n]{0,120}\b(user|customer|client|admin|stakeholder|business)\s+(approved|requested|selected|confirmed)\b/i.test(text);
}
function approvalStaticNormalizeStep(value) {
    const normalized = approvalStaticKey(value);
    const aliases = {
        "set variables": "setvar", "set variable": "setvar", setvar: "setvar",
        "execute custom code": "customcode", "custom code": "customcode", customcode: "customcode",
        "show confirm dialog": "confirm", confirm: "confirm",
        "redirect page to": "redirect", redirect: "redirect",
        "submit form": "submit", submit: "submit",
        "start another action": "otheraction", otheraction: "otheraction",
        "barcode scan": "barcode", barcode: "barcode", "nfc reader": "nfc", nfc: "nfc",
    };
    return aliases[normalized] || normalized;
}
function approvalStaticIsFullRow(field, controlType) {
    return controlType === "textarea"
        || controlType === "richtext"
        || controlType === "list"
        || /business purpose|justification|description|notes?/.test(approvalStaticKey(`${field.fieldType || ""} ${field.controlType || ""} ${field.displayName || ""}`));
}
function approvalStaticFieldPrefix(fieldType) {
    const normalized = approvalStaticKey(fieldType);
    if (/user|people|person|identity/.test(normalized))
        return "Text";
    if (/date|time/.test(normalized))
        return "Datetime";
    if (/number|decimal|currency|amount|percent|integer/.test(normalized))
        return "Decimal";
    if (/boolean|yes no|checkbox|bit/.test(normalized))
        return "Bit";
    return "Text";
}
function approvalStaticFieldKey(displayName, fieldType, index) {
    if (/^title$/i.test(displayName))
        return "Title";
    return `${approvalStaticFieldPrefix(fieldType)}${Math.max(1, index + 1)}`;
}
function approvalStaticControl(fieldType) {
    const normalized = approvalStaticKey(fieldType);
    if (/user|people|person|identity/.test(normalized))
        return "identity-picker";
    if (/date|time/.test(normalized))
        return "datepicker";
    if (/number|decimal|currency|amount|percent|integer/.test(normalized))
        return "input_number";
    if (/boolean|yes no|checkbox|bit/.test(normalized))
        return "switch";
    if (/choice|select|status|category/.test(normalized))
        return "select";
    if (/lookup|reference|relation/.test(normalized))
        return "lookup";
    if (/file|attachment/.test(normalized))
        return "file-upload";
    if (/image|photo|picture/.test(normalized))
        return "icon-upload";
    if (/text ?area|textarea|multi line|multiline|long text|description/.test(normalized))
        return "textarea";
    return "input";
}
function approvalStaticUniqueFields(items) {
    const normalized = [];
    const seen = new Set();
    for (const raw of items) {
        const field = approvalStaticRecord(raw);
        const displayName = approvalStaticClean(field.displayName);
        if (!displayName || approvalStaticNonResource(displayName))
            continue;
        let fieldName = approvalStaticClean(field.fieldName || approvalStaticFieldKey(displayName, field.fieldType || "Text", normalized.length));
        if (approvalStaticKey(fieldName).replace(/ /g, "") === "requesttitle" || approvalStaticKey(displayName).replace(/ /g, "") === "requesttitle")
            fieldName = "requestTitle";
        const fieldKey = approvalStaticKey(fieldName || displayName);
        if (seen.has(fieldKey))
            continue;
        seen.add(fieldKey);
        normalized.push({
            displayName,
            fieldName,
            fieldType: approvalStaticClean(field.fieldType) || "Text",
            controlType: approvalStaticClean(field.controlType) || approvalStaticControl(field.fieldType || ""),
            readOnly: field.readOnly === true,
            dynamicDisplay: String(field.dynamicDisplay == null ? "" : field.dynamicDisplay).trim().replace(/^`([\s\S]*)`$/, "$1").trim(),
            listRefId: approvalStaticClean(field.listRefId || field.complexTypeId),
            listFields: Array.isArray(field.listFields)
                ? field.listFields.map((rowField) => ({ ...approvalStaticRecord(rowField) }))
                : Array.isArray(field.rowFields)
                    ? field.rowFields.map((rowField) => ({ ...approvalStaticRecord(rowField) }))
                    : [],
            listSummaries: Array.isArray(field.listSummaries)
                ? field.listSummaries.map((summary) => {
                    const item = approvalStaticRecord(summary);
                    return { ...item, binding: item.binding ? { ...approvalStaticRecord(item.binding) } : null };
                })
                : [],
        });
    }
    return normalized;
}
function approvalStaticSelectPublicFields(input) {
    const fields = Array.isArray(input.fields) ? input.fields : [];
    const requested = Array.isArray(input.requested) ? input.requested.map(approvalStaticClean).filter(Boolean) : [];
    if (!requested.length)
        return fields.slice(0, 8);
    const selected = [];
    const seen = new Set();
    for (const requestedName of requested) {
        const field = fields.find((candidate) => {
            const record = approvalStaticRecord(candidate);
            return [record.DisplayName, record.FieldName, record.InternalName].some((value) => approvalStaticKey(value) === approvalStaticKey(requestedName));
        });
        const record = approvalStaticRecord(field);
        if (!field || seen.has(String(record.FieldName || "")))
            continue;
        seen.add(String(record.FieldName || ""));
        selected.push(field);
    }
    return selected.length ? selected : fields.slice(0, 8);
}
function approvalStaticNoFieldsNotice(input) {
    const role = approvalStaticClean(input.role);
    const id = approvalStaticClean(input.id);
    if (!id)
        throw new Error("Approval Form static no-fields notice requires a host-generated deterministic id.");
    return {
        id,
        name: "No additional fields required",
        title: "No additional fields required",
        label: "No additional fields required",
        nv_label: "approval_no_additional_fields_required",
        type: "heading",
        approvalFormNoFieldsNotice: true,
        attrs: {
            heads: { ty: [null, "body-medium"], color: "#64748b" },
            headc: { title: { value: role === "task"
                        ? "No additional task fields are required. Use the action panel below to complete the workflow task."
                        : "No additional submission fields are required for this approval form." } },
        },
    };
}
function approvalStaticSublistRowControlType(value) {
    const type = approvalStaticKey(value);
    if (type === "date")
        return "datepicker";
    if (type === "number")
        return "input_number";
    if (type === "boolean")
        return "switch";
    if (type === "user")
        return "identity-picker";
    return "input";
}
function approvalStaticFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value))
        return value;
    for (const nested of Object.values(value))
        approvalStaticFreeze(nested);
    return Object.freeze(value);
}
/** Projects only immutable Dashboard static configuration. It never receives templates, resources, IDs, or runtime state. */
export function projectDashboardStaticConfiguration(request) {
    if (request?.kind === "normalize-dashboard-filters")
        return Object.freeze({ filters: Object.freeze([]), isDateLike: false });
    const field = request?.field;
    const text = `${field?.fieldName ?? field?.FieldName ?? ""} ${field?.displayName ?? field?.DisplayName ?? ""} ${field?.fieldType ?? field?.FieldType ?? ""} ${field?.controlType ?? field?.Type ?? ""}`;
    return Object.freeze({ filters: Object.freeze([]), isDateLike: /date|datetime|time|created|modified|period|month|week|year/i.test(text) });
}