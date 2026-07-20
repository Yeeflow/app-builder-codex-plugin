function normalizeHeader(value) {
    return String(value || "")
        .replace(/[`*_]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}
const EXACT_PLANNING_PLACEHOLDERS = new Set([
    "deferred",
    "n/a",
    "no",
    "none",
    "not applicable",
    "not planned",
    "not required",
]);
/**
 * Projects one planning label into the three deterministic placeholder facts
 * needed by host callers. It intentionally accepts no host objects and does
 * not expose the underlying leaf helpers as independent public APIs.
 */
export function projectPlanningLabel(value) {
    const cleanLabel = String(value ?? "")
        .replace(/<[^>]+>/g, "")
        .replace(/`/g, "")
        .replace(/\*\*/g, "")
        .replace(/^[\s'"“”‘’([{]+|[\s'"“”‘’.,;:!?…)}\]]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
    const normalizedLabel = cleanLabel
        .toLowerCase()
        .replace(/\bn\s*[./]s*a\b/g, "n/a")
        .replace(/\s+/g, " ")
        .trim();
    const isPlaceholder = !normalizedLabel
        || EXACT_PLANNING_PLACEHOLDERS.has(normalizedLabel)
        || /^(?:not applicable|not planned|not required|deferred|n\/a|none)(?:\s*[-–—:]\s*.+)$/.test(normalizedLabel)
        || /^no\s+(?:dashboard(?:\s+page)?s?|form\s+reports?|data\s+reports?|custom\s+forms?|approval\s+forms?|schedule(?:d)?\s+workflows?|data\s+list\s+workflows?|navigation(?:\s+items?)?|pages?|resources?)(?:\s+(?:required|planned|needed|applicable))?(?:\s*[-–—:]\s*.*)?$/.test(normalizedLabel)
        || /^(?:dashboard(?:\s+page)?s?|form\s+reports?|data\s+reports?|custom\s+forms?|approval\s+forms?|navigation(?:\s+items?)?|pages?|resources?)\s+(?:not\s+(?:required|planned|applicable)|none)$/.test(normalizedLabel);
    return Object.freeze({ cleanLabel, normalizedLabel, isPlaceholder });
}
/**
 * Projects immutable Workflow Set Data List planning declarations into the
 * Legacy-compatible record and variable/list-reference metadata shapes. It
 * deliberately excludes the Host merge, workflow execution, graph mutation,
 * resource/package mutation, and runtime expression behavior.
 */
export function projectWorkflowSetDataListProjection(input = {}) {
    const record = workflowSetDataListProjectionRecord(input.record);
    const variables = buildWorkflowVariablesFromSetDataListRecords(input.records || []);
    return freezeWorkflowProjection({ record, variables });
}
function workflowProjectionText(value) {
    return String(value == null ? "" : value).trim();
}
function workflowProjectionVariableType(value) {
    const normalized = workflowProjectionText(value).toLowerCase();
    if (normalized === "string")
        return "text";
    if (["integer", "decimal", "currency", "bigint"].includes(normalized))
        return "number";
    if (["bool", "bit"].includes(normalized))
        return "boolean";
    if (["datetime", "time"].includes(normalized))
        return "date";
    return normalized || "text";
}
function workflowProjectionChildFieldId(declaration) {
    const key = workflowProjectionText(declaration.key);
    return key.startsWith("_list.") ? key.slice("_list.".length) : "";
}
function workflowSetDataListProjectionRecord(record) {
    const source = record && typeof record === "object" && !Array.isArray(record) ? record : {};
    const declarations = Array.isArray(source.workflowVariableDeclarations) ? source.workflowVariableDeclarations : [];
    return {
        ...source,
        workflowVariableDeclarations: declarations.map((value) => {
            const declaration = value && typeof value === "object" && !Array.isArray(value) ? value : {};
            const key = workflowProjectionText(declaration.key);
            return {
                id: workflowProjectionText(declaration.id),
                ...(key ? { key } : {}),
                type: workflowProjectionText(declaration.type),
                valueType: workflowProjectionText(declaration.valueType),
                name: workflowProjectionText(declaration.name),
                expressionName: workflowProjectionText(declaration.expressionName),
            };
        }),
    };
}
function buildWorkflowVariablesFromSetDataListRecords(records) {
    const declarations = records.flatMap((record) => {
        const normalized = workflowSetDataListProjectionRecord(record);
        return normalized.workflowVariableDeclarations;
    });
    const groups = new Map();
    for (const declaration of declarations) {
        const id = workflowProjectionText(declaration.id);
        if (!id)
            continue;
        const key = id.toLowerCase();
        if (!groups.has(key))
            groups.set(key, { id, name: workflowProjectionText(declaration.name) || id, declarations: [] });
        groups.get(key)?.declarations.push(declaration);
    }
    const basic = [];
    const listref = [];
    for (const group of groups.values()) {
        const isList = group.declarations.some((declaration) => workflowProjectionText(declaration.type).toLowerCase() === "list" || workflowProjectionChildFieldId(declaration));
        if (!isList) {
            const declaration = group.declarations[0];
            basic.push({ id: group.id, idx: group.id, name: group.name, title: group.name, type: workflowProjectionVariableType(declaration.type || declaration.valueType), source: "workflow-set-data-list-plan" });
            continue;
        }
        const listRefId = `${group.id}ListRef`;
        const fields = [];
        const seenFields = new Set();
        for (const declaration of group.declarations) {
            const id = workflowProjectionChildFieldId(declaration);
            if (!id || seenFields.has(id.toLowerCase()))
                continue;
            seenFields.add(id.toLowerCase());
            const displayName = workflowProjectionText(declaration.expressionName).split(":").filter(Boolean).at(-1) || id;
            fields.push({ id, idx: id, name: displayName, type: workflowProjectionVariableType(declaration.valueType), editable: true });
        }
        basic.push({ id: group.id, idx: group.id, name: group.name, title: group.name, type: "list", value: listRefId, source: "workflow-set-data-list-plan" });
        listref.push({ id: listRefId, idx: listRefId, name: `${group.name} Rows`, fields });
    }
    return { basic, listref, filter: [] };
}
function freezeWorkflowProjection(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value))
        return value;
    for (const child of Object.values(value))
        freezeWorkflowProjection(child);
    return Object.freeze(value);
}
export function splitMarkdownTableRow(line) {
    let source = String(line || "").trim();
    if (source.startsWith("|"))
        source = source.slice(1);
    if (source.endsWith("|") && !isEscapedAt(source, source.length - 1))
        source = source.slice(0, -1);
    const cells = [];
    let current = "";
    let codeFenceLength = 0;
    for (let index = 0; index < source.length; index += 1) {
        const character = source[index];
        if (character === "\\" && source[index + 1] === "|") {
            current += "|";
            index += 1;
            continue;
        }
        if (character === "`") {
            let runLength = 1;
            while (source[index + runLength] === "`")
                runLength += 1;
            current += "`".repeat(runLength);
            if (codeFenceLength === 0)
                codeFenceLength = runLength;
            else if (codeFenceLength === runLength)
                codeFenceLength = 0;
            index += runLength - 1;
            continue;
        }
        if (character === "|" && codeFenceLength === 0) {
            cells.push(current.trim());
            current = "";
            continue;
        }
        current += character;
    }
    cells.push(current.trim());
    return cells;
}
function isEscapedAt(value, index) {
    let slashes = 0;
    for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1)
        slashes += 1;
    return slashes % 2 === 1;
}
export function isMarkdownTableSeparator(cells) {
    return Array.isArray(cells) && cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}
export function parseMarkdownTables(text) {
    const lines = String(text || "").split(/\r?\n/);
    const fencedLines = markdownFenceLines(lines);
    const tables = [];
    for (let index = 0; index < lines.length - 1; index += 1) {
        if (fencedLines.has(index) || fencedLines.has(index + 1))
            continue;
        if (!/^\s*\|.*\|\s*$/.test(lines[index]) || !/^\s*\|.*\|\s*$/.test(lines[index + 1]))
            continue;
        const headers = splitMarkdownTableRow(lines[index]);
        const separator = splitMarkdownTableRow(lines[index + 1]);
        if (!isMarkdownTableSeparator(separator))
            continue;
        const rows = [];
        for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
            if (fencedLines.has(rowIndex))
                break;
            if (!/^\s*\|.*\|\s*$/.test(lines[rowIndex]))
                break;
            const cells = splitMarkdownTableRow(lines[rowIndex]);
            if (!cells.length || isMarkdownTableSeparator(cells))
                break;
            if (cells.some((cell) => /<[^>]+>/.test(cell)))
                continue;
            rows.push({ raw: lines[rowIndex].trim(), cells, line: rowIndex + 1 });
        }
        tables.push({ headers, rows, line: index + 1 });
        index += 1;
    }
    return tables;
}
export function stripMarkdownFencedBlocks(text) {
    const lines = String(text || "").split(/\r?\n/);
    const fenced = markdownFenceLines(lines);
    return lines.map((line, index) => (fenced.has(index) ? "" : line)).join("\n");
}
function markdownFenceLines(lines) {
    const fenced = new Set();
    let marker = "";
    for (let index = 0; index < lines.length; index += 1) {
        const match = String(lines[index] || "").match(/^\s*(`{3,}|~{3,})/);
        if (!marker && match) {
            marker = match[1][0];
            fenced.add(index);
            continue;
        }
        if (!marker)
            continue;
        fenced.add(index);
        if (match && match[1][0] === marker)
            marker = "";
    }
    return fenced;
}
export function findMarkdownTable(text, requiredHeaders = []) {
    const wanted = requiredHeaders.map(normalizeHeader);
    return parseMarkdownTables(text).find((table) => {
        const actual = table.headers.map(normalizeHeader);
        return wanted.every((header) => actual.includes(header));
    }) || null;
}
export function markdownRowValue(table, row, headerNames) {
    if (!table || !row)
        return "";
    const wanted = (Array.isArray(headerNames) ? headerNames : [headerNames]).map(normalizeHeader);
    const index = table.headers.findIndex((header) => wanted.includes(normalizeHeader(header)));
    return index < 0 ? "" : String(row.cells[index] || "").trim();
}
export function markdownRowValues(table, row, headerNames) {
    if (!table || !row)
        return [];
    const wanted = (Array.isArray(headerNames) ? headerNames : [headerNames]).map(normalizeHeader);
    return table.headers
        .map((header, index) => (wanted.includes(normalizeHeader(header)) ? String(row.cells[index] || "").trim() : null))
        .filter((value) => value !== null);
}
export function extractMarkdownSubsection(text, headingPattern) {
    const source = String(text || "");
    const match = headingPattern.exec(source);
    if (!match)
        return "";
    const headingLevel = (match[0].match(/^#+/) || ["####"])[0].length;
    const after = source.slice(match.index + match[0].length);
    const lines = after.split(/\r?\n/);
    const kept = [];
    for (const line of lines) {
        const heading = line.match(/^(#{1,6})\s+/);
        if (heading && heading[1].length <= headingLevel)
            break;
        kept.push(line);
    }
    return kept.join("\n");
}
export function isNegativeRequirementStatement(value) {
    const text = String(value || "").trim();
    if (!text)
        return false;
    return /\b(no|not|none|without|does not|do not|did not|is not|are not|isn't|aren't|must not|never|not applicable|n\/a)\b[^.\n]{0,120}\b(required|needed|planned|used|included|supported|displayed|deferred|applicable|selected|contains?|includes?)\b/i.test(text)
        || /\b(no|none|not applicable|n\/a)\b\s+(dashboard|chart|collection|kanban|timeline|sub list|task form|item action|bulk action|record display|deferred item)/i.test(text);
}
export function positivePlanningText(value) {
    return String(value || "")
        .split(/\r?\n/)
        .filter((line) => !isNegativeRequirementStatement(line))
        .join("\n");
}
export function hasTechnicalPlaceholderIdContext(text) {
    const source = String(text || "");
    const token = "(?:LIST|PAGE|FORM|LAYOUT|PROC)-[A-Za-z0-9_-]+";
    const technicalLabel = "(?:ListID|PageID|FormID|LayoutID|ProcKey|Resource ID|Runtime ID|Generated ID|Implementation ID|Target ID)";
    if (new RegExp(`\\b${technicalLabel}\\b\\s*[:=]\\s*${token}\\b`, "i").test(source))
        return true;
    for (const table of parseMarkdownTables(source)) {
        const technicalIndexes = table.headers
            .map((header, index) => (/\b(id|identifier|proc key|resource key)\b/i.test(header) ? index : -1))
            .filter((index) => index >= 0);
        if (table.rows.some((row) => technicalIndexes.some((index) => new RegExp(`^${token}$`, "i").test(row.cells[index] || ""))))
            return true;
    }
    return false;
}
const MODE_ALIASES = new Map([
    ["multiple_count_only", "multiple_count_only"], ["count_only", "multiple_count_only"],
    ["single_to_variables", "single_to_variables"], ["single", "single_to_variables"],
    ["multiple_to_list_variable", "multiple_to_list_variable"], ["multiple_to_list", "multiple_to_list_variable"],
    ["multiple_to_text_variable", "multiple_to_text_variable"], ["multiple_to_text", "multiple_to_text_variable"],
]);
const SOURCE_TYPES = new Set([1, 16, 32]);
/**
 * Projects one immutable Workflow Query Data static-plan request. It owns only
 * deterministic DTO normalization and deliberately excludes query execution,
 * runtime expressions, workflow mutation, resource/package state, and UI work.
 */
export function projectWorkflowQueryDataStaticPlan(input) {
    const kind = input?.kind;
    const value = input?.value;
    if (kind === "mode")
        return freeze({ kind, value: normalizeMode(value) });
    if (kind === "query-properties")
        return freeze({ kind, value: queryProperties(asRecord(value)) });
    if (kind === "field-map")
        return freeze({ kind, value: parseFieldMap(value) });
    if (kind === "list-variable")
        return freeze({ kind, value: listVariable(asRecord(value)) });
    if (kind === "loop-properties")
        return freeze({ kind, value: loopProperties(asRecord(value)) });
    throw new Error(`Unsupported Workflow Query Data static-plan projection kind: ${String(kind || "")}`);
}
function queryProperties(config) {
    const mode = normalizeMode(config.mode) || "multiple_to_text_variable";
    const pageIndex = positiveInteger(config.pageIndex, 1);
    const pageSize = boundedPageSize(config.pageSize, mode === "multiple_to_list_variable" ? 1000 : 100);
    const fieldMap = normalizeFieldMap(config.fieldMap);
    const fields = Array.isArray(config.fields) ? clone(config.fields) : [];
    const resultVariable = clean(config.resultVariable);
    const countVariable = clean(config.countVariable);
    const result = { type: mode === "single_to_variables" ? "single" : "multiple", pageIndex, pageSize };
    if (mode === "multiple_count_only")
        Object.assign(result, { fieldMap: null, listName: "", vartype: "", listParent: "", fields: null, totalCount: countVariable, querycount_prefix: "__variables_" });
    else if (mode === "single_to_variables")
        Object.assign(result, { fieldMap, listName: "", fields: null });
    else if (mode === "multiple_to_list_variable")
        Object.assign(result, { fieldMap, listName: resultVariable, vartype: "list", listParent: "__variables_", fields: null, ...(countVariable ? { totalCount: countVariable, querycount_prefix: "__variables_" } : {}) });
    else
        Object.assign(result, { fieldMap: null, listName: resultVariable, vartype: "text", listParent: "__variables_", fields, ...(countVariable ? { totalCount: countVariable, querycount_prefix: "__variables_" } : {}) });
    const listType = Number.isInteger(Number(config.listType)) ? Number(config.listType) : 1;
    if (!SOURCE_TYPES.has(listType))
        throw new Error(`Unsupported export-proven Workflow Query Data source type: ${listType}`);
    const sorts = Array.isArray(config.sorts) ? clone(config.sorts) : [];
    if (sorts.length > 2)
        throw new Error("Workflow Query Data supports at most 2 sort fields");
    return { name: clean(config.name) || "Query data", appid: Number.isInteger(Number(config.appId)) ? Number(config.appId) : 41, listsetid: String(config.listSetId || ""), listid: String(config.listId || ""), listtype: listType, filters: Array.isArray(config.filters) ? clone(config.filters) : [], sorts, result };
}
function listVariable(input) {
    const variableId = clean(input.id);
    const refId = clean(input.listRefId);
    const fields = Array.isArray(input.fields) ? input.fields : [];
    return { variable: { idx: variableId, id: variableId, name: clean(input.name) || variableId, type: "list", editable: true, value: refId }, listref: { id: refId, name: clean(input.name) || refId, fields: fields.map((field) => { const item = asRecord(field); return { idx: clean(item.idx) || clean(item.id), id: clean(item.id), name: clean(item.name) || clean(item.id), type: clean(item.type) || "text", editable: item.editable !== false }; }), idx: refId } };
}
function loopProperties(input) {
    const mode = clean(input.loopType || "list").toLowerCase();
    if (mode === "list")
        return { name: clean(input.name) || "Loop through list items", loopType: "list", loopValue: { prefix: input.sourceParent === "__list_" ? "__list_" : "__variables_", value: clean(input.source) } };
    if (mode === "values" || mode === "number")
        return { name: clean(input.name) || (mode === "values" ? "Loop through multiple values" : "Loop for fixed times"), loopType: mode, loopValue: { type: 2, value: Array.isArray(input.expression) ? clone(input.expression) : [] } };
    return { name: clean(input.name) || "Loop", loopType: mode, loopValue: {} };
}
function parseFieldMap(value) {
    if (value && typeof value === "object" && !Array.isArray(value))
        return normalizeFieldMap(value);
    const output = {};
    for (const pair of String(value || "").split(/\s*;\s*/).filter(Boolean)) {
        const parts = pair.split(/\s*(?:->|=>|→)\s*/);
        if (parts.length !== 2)
            continue;
        const source = clean(parts[0]);
        const target = clean(parts[1]);
        if (source && target)
            output[source] = target;
    }
    return output;
}
function normalizeMode(value) { return MODE_ALIASES.get(String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_")) || ""; }
function normalizeFieldMap(value) { if (!value || typeof value !== "object" || Array.isArray(value))
    return {}; return Object.fromEntries(Object.entries(value).map(([source, target]) => [clean(source), clean(target)]).filter(([source, target]) => source && target)); }
function positiveInteger(value, fallback) { const numeric = Number(value); return Number.isInteger(numeric) && numeric > 0 ? numeric : fallback; }
function boundedPageSize(value, fallback) { const numeric = Number(value); return Number.isInteger(numeric) && numeric >= 1 && numeric <= 1000 ? numeric : fallback; }
function clean(value) { return String(value || "").trim().replace(/^`|`$/g, ""); }
function asRecord(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function clone(value) { return structuredClone(value); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value))
    return value; for (const child of Object.values(value))
    freeze(child); return Object.freeze(value); }
/**
 * Pure static Workflow planning projection. It deliberately excludes execution,
 * assignee resolution, graph/resource mutation, runtime expressions, Host IDs,
 * and every product-runtime concern.
 */
export function projectWorkflowStaticPlan(input) {
    const kind = input?.kind;
    const value = input?.value;
    const options = wfStaticRecord(input?.options);
    let projected;
    switch (kind) {
        case "is-default-action-name":
            projected = wfStaticDefaultActionName(value);
            break;
        case "truncate-action-name":
            projected = wfStaticTruncate(value, wfStaticNumber(options.maxLength, 48));
            break;
        case "normalize-node-type":
            projected = wfStaticNormalizeNodeType(value);
            break;
        case "business-action-name":
            projected = wfStaticBusinessAction(wfStaticRecord(value), wfStaticNumber(options.index, 0));
            break;
        case "layout-rows":
            projected = wfStaticLayoutRows(Array.isArray(value) ? value : [], wfStaticNumber(options.tolerance, 60));
            break;
        case "rejected-vertices":
            projected = wfStaticRejectedVertices(wfStaticRecord(value), wfStaticRecord(options.rejectPosition));
            break;
        case "content-list-operation":
            projected = wfStaticContentListOperation(wfStaticRecord(value));
            break;
        case "variable-id":
            projected = wfStaticVariableId(value);
            break;
        case "variable-type":
            projected = wfStaticVariableType(value);
            break;
        case "query-result-field":
            projected = wfStaticQueryResultField(wfStaticRecord(value));
            break;
        case "summarize-condition":
            projected = wfStaticSummarizeCondition(value);
            break;
        case "connector-description":
            projected = wfStaticConnectorDescription(wfStaticRecord(value));
            break;
        case "infer-variable-assignee-name":
            projected = wfStaticInferVariableAssigneeName(wfStaticRecord(value));
            break;
        default: throw new Error(`Unsupported Workflow static-plan projection kind: ${String(kind || "")}`);
    }
    return wfStaticFreeze({ kind, value: projected });
}
function wfStaticClean(value) { return String(value || "").trim().replace(/^`|`$/g, ""); }
function wfStaticNorm(value) { return wfStaticClean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function wfStaticRecord(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function wfStaticNumber(value, fallback) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function wfStaticFreeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value))
    return value; for (const child of Object.values(value))
    wfStaticFreeze(child); return Object.freeze(value); }
function wfStaticDefaultActionName(value) { const text = wfStaticClean(value); return !text || /^(assignment\s*task|candidate\s*task|claim\s*task|content\s*list|inclusive\s*gateway|gateway|task|workflow\s*task|sequence\s*flow(?:[_\s-]*\d+)?)$/i.test(text); }
function wfStaticTruncate(value, maximum = 48) { const text = wfStaticClean(value).replace(/\s+/g, " "); return text.length <= maximum ? text : (text.slice(0, maximum).replace(/\s+\S*$/, "").trim() || text.slice(0, maximum).trim()); }
function wfStaticNormalizeNodeType(value) { const text = wfStaticClean(value), key = wfStaticNorm(text); if (!key)
    return ""; if (/^start/.test(key))
    return "StartNoneEvent"; if (/end\s*reject|reject\s*end/.test(key))
    return "EndRejectEvent"; if (/^end/.test(key))
    return "EndNoneEvent"; if (/sequence|flow|transition/.test(key))
    return "SequenceFlow"; if (/exclusive\s*gateway|exclusivegateway/.test(key))
    return "ExclusiveGateway"; if (/inclusive\s*gateway|inclusivegateway/.test(key))
    return "InclusiveGateway"; if (/query\s*data|querydata/.test(key))
    return "QueryData"; if (/set\s*variable|setvariable|setvariabletask/.test(key))
    return "SetVariableTask"; if (/gateway|condition|branch|decision/.test(key))
    return "InclusiveGateway"; if (/content\s*list|service\s*action|serviceaction|action\s*node|create|update|archive|persist|master/.test(key) || text === "ContentList")
    return "ContentList"; if (/candidate/.test(key))
    return "CandidateTask"; if (/assignment|approval|review|task|multi/.test(key) || text === "MultiAssignmentTask" || text === "AssignmentTask")
    return "MultiAssignmentTask"; return text.replace(/[^A-Za-z0-9_]/g, "") || "MultiAssignmentTask"; }
function wfStaticBusinessAction(node, index) { const raw = wfStaticClean(node.nodeName || node.name || node.title); if (raw && !wfStaticDefaultActionName(raw))
    return wfStaticTruncate(raw); const type = wfStaticNormalizeNodeType(node.nodeType); const text = [node.requiredJobPositionName, node.assigneeRole, node.assignmentStrategy, node.description, node.conditionBranch, node.dataReadWrite].map(wfStaticClean).join(" "), key = wfStaticNorm(text); if (/\bcash(?:i|e)er\b/.test(key))
    return "Cashier confirm"; if (/\bfinance\b/.test(key) && /\bmanager\b/.test(key))
    return "Finance manager approval"; if (/\bgeneral\b/.test(key) && /\bmanager\b/.test(key))
    return "General manager approval"; if (/\bdepartment\b/.test(key) && /\b(head|manager)\b/.test(key))
    return "Department head approval"; if (/\bline\b/.test(key) && /\bmanager\b/.test(key))
    return "Line manager approval"; if (/\bowner\b/.test(key) && /\bmanager\b/.test(key))
    return "Owner's manager approval"; if (/\bowner\b/.test(key))
    return "Owner approval"; if (/\bit\b/.test(key) && /\bsecurity\b/.test(key))
    return "IT security check"; if (/\bsoftware\b/.test(key) && /\blicen[sc]e\b/.test(key))
    return "Software license check"; if (/\bprocurement\b/.test(key) && /\bavailability\b/.test(key))
    return "Procurement availability"; if (/\bvendor\b/.test(key) && /\bquotation\b/.test(key))
    return "Vendor quotation"; if (/\basset\b/.test(key) && /\bregistration\b/.test(key))
    return "Asset registration"; if (/\bpickup\b/.test(key))
    return "Employee pickup"; if (/\bclarification\b/.test(key))
    return "Request clarification"; if (type === "InclusiveGateway") {
    if (/\bamount\b|\bbudget\b|\bcost\b|\bprice\b/.test(key))
        return "Amount check";
    if (/\bequipment\b/.test(key))
        return "Equipment type check";
    if (/\bavailability\b/.test(key))
        return "Availability check";
    return `Business condition ${index + 1}`;
} if (type === "ContentList") {
    if (/\bcreate\b|\badd\b/.test(key))
        return "Create record";
    if (/\bupdate\b|\bset\b|\bsave\b/.test(key))
        return "Update record";
    return `Save request data ${index + 1}`;
} if (type === "CandidateTask")
    return `Claim task ${index + 1}`; return `Review request ${index + 1}`; }
function wfStaticLayoutRows(entries, tolerance) {
    const rows = [];
    for (const entry of [...entries].sort((a, b) => wfStaticNumber(wfStaticRecord(wfStaticRecord(a).position).y, 0) - wfStaticNumber(wfStaticRecord(wfStaticRecord(b).position).y, 0))) {
        const y = wfStaticNumber(wfStaticRecord(wfStaticRecord(entry).position).y, 0);
        const existing = rows.find((row) => Math.abs(row.y - y) <= tolerance);
        if (existing) {
            existing.entries.push(structuredClone(entry));
            existing.y = existing.entries.reduce((sum, item) => sum + wfStaticNumber(wfStaticRecord(wfStaticRecord(item).position).y, 0), 0) / existing.entries.length;
        }
        else
            rows.push({ y, entries: [structuredClone(entry)] });
    }
    return rows;
}
function wfStaticRejectedVertices(source, target) { const sx = wfStaticNumber(source.x, NaN), sy = wfStaticNumber(source.y, NaN), tx = wfStaticNumber(target.x, NaN), ty = wfStaticNumber(target.y, NaN); if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(tx) || !Number.isFinite(ty))
    return []; const dx = Math.abs(tx - sx), dy = Math.abs(ty - sy); if (dx < 520 && dy < 220)
    return []; const x = sx + Math.max(120, Math.round(dx / 2)); return [{ x, y: sy }, { x, y: ty }, { x: tx - 120, y: ty }]; }
function wfStaticContentListOperation(step) { const text = [step.nodeName, step.description, step.dataReadWrite].map(wfStaticClean).join(" "); if (/\b(remove|delete)\b/i.test(text))
    return "remove"; if (/\b(update|edit)\b/i.test(text))
    return "edit"; return "add"; }
function wfStaticVariableId(value) { const slug = wfStaticClean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").replace(/-/g, "_"); return slug || "workflow_variable"; }
function wfStaticVariableType(value) { const key = wfStaticNorm(value); if (/user|identity/.test(key))
    return "user"; if (/date|time/.test(key))
    return "date"; if (/decimal|number|currency|percent|bigint/.test(key))
    return "number"; if (/bit|boolean/.test(key))
    return "boolean"; if (/file|image|upload/.test(key))
    return "file"; return "text"; }
function wfStaticQueryResultField(field) { return { FieldID: String(field.FieldID || field.fieldId || field.id || field.fieldName || field.FieldName || ""), FieldName: wfStaticClean(field.FieldName || field.fieldName || field.field || "Title"), DisplayName: wfStaticClean(field.DisplayName || field.displayName || field.name || field.FieldName || "Title"), Type: wfStaticClean(field.Type || field.type || field.FieldType || field.fieldType || "Text") }; }
function wfStaticSummarizeCondition(value) { for (const row of Array.isArray(value) ? value : []) {
    const r = wfStaticRecord(row), op = wfStaticClean(r.op), leftRecord = wfStaticRecord(r.left), leftValue = wfStaticRecord(leftRecord.value), rightRecord = wfStaticRecord(r.right), rightValue = wfStaticRecord(rightRecord.value), left = wfStaticClean(leftValue.name || leftValue.id), right = rightRecord.type === 0 ? wfStaticClean(rightRecord.value) : wfStaticClean(rightValue.name || rightValue.id);
    if (!left || !op)
        continue;
    if (op === "isNull")
        return `${left} is empty`;
    if (op === "isNotNull")
        return `${left} is not empty`;
    const symbol = op.replace(/^[a-z]+\./i, "").replace("!=", "!=").replace("=", "=");
    if (right)
        return wfStaticTruncate(`${left} ${symbol} ${right}`, 42);
} return ""; }
function wfStaticConnectorDescription(input) { const label = wfStaticClean(input.name).replace(/\s+/g, " "); if (/^complete$/i.test(label))
    return "Completed"; if (label && !/^sequence\s*flow(?:[_\s-]*\d+)?$/i.test(label))
    return wfStaticTruncate(label, 42); return wfStaticSummarizeCondition(input.conditioninfo) || "Next"; }
function wfStaticInferVariableAssigneeName(step) { const text = [step.nodeName, step.assigneeRole, step.assignmentStrategy, step.description].map(wfStaticClean).join(" "); const explicit = text.match(/\b(?:workflow\s+variables?|variable)\s*[:=]?\s*([A-Za-z][A-Za-z0-9_]*)\b/i); if (explicit && !/^line|department|manager|user$/i.test(explicit[1]))
    return explicit[1]; if (/\bowner\b/i.test(text))
    return "Owner"; return ""; }
const aliases = Object.freeze({
    input: "input", text: "input", "single line": "input", singleline: "input", textarea: "textarea", "multiple line": "textarea", multiline: "textarea", richtext: "richtext", "rich text": "richtext", list: "list", "sub list": "list", sublist: "list", radio: "radio", select: "select", dropdown: "select", datepicker: "datepicker", "date picker": "datepicker", "input number": "input_number", input_number: "input_number", number: "input_number", currency: "currency", switch: "switch", "identity picker": "identity-picker", "identity-picker": "identity-picker", "user picker": "identity-picker", "file upload": "file-upload", "file-upload": "file-upload", "image upload": "image-upload", "image-upload": "image-upload", lookup: "lookup",
});
/** Immutable Data List form-control classification with no field record, template, or Host state. */
export function projectDataListFormControlStaticSchema(input) {
    const kind = input?.kind;
    let value;
    if (kind === "resolve")
        value = formControlResolve(formControlAsRecord(input.value));
    else if (kind === "is-text-schema")
        value = /^(text|string|single line|singleline|short text)$/.test(formControlNormalize(input.value));
    else if (kind === "is-choice-schema")
        value = /^(choice|single select|select|radio|dropdown|flow status|flowstatus|status)$/.test(formControlNormalize(input.value));
    else if (kind === "is-choice-control")
        value = ["radio", "select"].includes(formControlCanonical(input.value));
    else if (kind === "canonical-control")
        value = formControlCanonical(input.value);
    else
        throw new Error(`Unsupported Data List form-control static schema kind: ${String(kind || "")}`);
    return Object.freeze({ kind, value });
}
function formControlAsRecord(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function formControlNormalize(value) { return String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " "); }
function formControlCanonical(value) { const text = formControlNormalize(value).replace(/-/g, " "); if (aliases[text])
    return aliases[text]; if (/\bradio\b/.test(text))
    return "radio"; if (/\b(?:dropdown|select)\b/.test(text))
    return "select"; if (/\b(?:identity|user|people|person)\b/.test(text))
    return "identity-picker"; if (/\b(?:file|attachment)\b/.test(text))
    return "file-upload"; if (/\b(?:image|photo|picture)\b/.test(text))
    return "image-upload"; if (/\b(?:date|datetime|time)\b/.test(text))
    return "datepicker"; if (/\b(?:number|integer|decimal)\b/.test(text))
    return "input_number"; return ""; }
function formControlResolve(field) { const explicit = formControlCanonical(field.controlType || field.Type || field.type); if (explicit)
    return explicit; const schema = formControlNormalize(field.fieldType || field.FieldType || field.variableType || field.dataType); if (!schema)
    return "input"; if (/sub list|sublist|detail list|line items?/.test(schema))
    return "list"; if (/rich text|richtext|html/.test(schema))
    return "richtext"; if (/multiple line|multi line|multiline|long text|textarea/.test(schema))
    return "textarea"; if (/user|identity|people|person/.test(schema))
    return "identity-picker"; if (/image|photo|picture/.test(schema))
    return "image-upload"; if (/file|attachment|document/.test(schema))
    return "file-upload"; if (/date|datetime|time/.test(schema))
    return "datepicker"; if (/currency/.test(schema))
    return "currency"; if (/decimal|number|integer|quantity|count|percent/.test(schema))
    return "input_number"; if (/bit|boolean|yes no/.test(schema))
    return "switch"; if (/choice|single select|select|radio|dropdown|flow status|flowstatus|status/.test(schema))
    return "radio"; if (/lookup|reference|relation/.test(schema))
    return "lookup"; return "input"; }
/**
 * Projects the small, JSON-safe parsing and normalization foundation used by
 * application-plan materialization. It intentionally accepts no plans,
 * resources, templates, package state, host identities, or runtime objects.
 */
export function projectApplicationPlanStaticFoundation(input) {
    const request = input && typeof input === "object" ? input : {};
    let value;
    switch (request.kind) {
        case "parse-json-maybe":
            value = applicationPlanParseJsonMaybe(request.value);
            break;
        case "find-header-index":
            value = applicationPlanFindHeaderIndex(request.value);
            break;
        case "extract-numbered-section":
            value = applicationPlanExtractNumberedSection(request.value);
            break;
        case "extract-subsections":
            value = applicationPlanExtractSubsections(request.value);
            break;
        case "infer-navigation-type":
            value = applicationPlanInferNavigationType(request.value);
            break;
        case "is-workbench-custom-form":
            value = applicationPlanIsWorkbenchCustomForm(request.value);
            break;
        case "is-table-line":
            value = /^\s*\|.+\|\s*$/.test(String(request.value || ""));
            break;
        case "unique-case-insensitive":
            value = applicationPlanUnique(request.value);
            break;
        case "materialization-failure-dto":
            value = applicationPlanMaterializationFailureDto(request.value);
            break;
        default: throw new Error("APPLICATION_PLAN_STATIC_FOUNDATION_KIND_UNSUPPORTED");
    }
    return applicationPlanFreeze({ kind: request.kind, value });
}
function applicationPlanParseJsonMaybe(value) {
    if (!value || typeof value !== "string")
        return null;
    try {
        return JSON.parse(value);
    }
    catch {
        return null;
    }
}
function applicationPlanNormalizedKey(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/gu, " ").trim();
}
function applicationPlanFindHeaderIndex(value) {
    const source = applicationPlanObject(value);
    const headers = Array.isArray(source.headers) ? source.headers : [];
    const candidates = Array.isArray(source.candidates) ? source.candidates : [];
    const normalizedCandidates = candidates.map(applicationPlanNormalizedKey);
    return headers.findIndex((header) => normalizedCandidates.includes(String(header || "")));
}
function applicationPlanMarker(value, forceGlobal = false) {
    const source = applicationPlanObject(value);
    const marker = applicationPlanObject(source.marker);
    const pattern = typeof marker.source === "string" ? marker.source : "";
    const flags = typeof marker.flags === "string" ? marker.flags : "";
    if (!pattern)
        throw new Error("APPLICATION_PLAN_STATIC_FOUNDATION_MARKER_INVALID");
    const normalizedFlags = forceGlobal && !flags.includes("g") ? `${flags}g` : flags;
    return new RegExp(pattern, normalizedFlags);
}
function applicationPlanText(value) { return String(applicationPlanObject(value).text || ""); }
function applicationPlanExtractNumberedSection(value) {
    const text = applicationPlanText(value);
    const match = applicationPlanMarker(value).exec(text);
    if (!match)
        return "";
    const start = match.index;
    const next = text.slice(start + match[0].length).search(/\n##\s+\d+\.\s+/u);
    return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next);
}
function applicationPlanExtractSubsections(value) {
    const text = applicationPlanText(value);
    const matches = [...text.matchAll(applicationPlanMarker(value, true))];
    return matches.map((match) => applicationPlanSubsectionAt(text, match.index || 0, match[0]));
}
function applicationPlanSubsectionAt(text, start, matched) {
    const remainder = text.slice(start + matched.length);
    const next = remainder.search(/\n#{2,4}\s+/u);
    return next === -1 ? text.slice(start) : text.slice(start, start + matched.length + next);
}
function applicationPlanInferNavigationType(value) {
    const text = String(value || "");
    if (/approval/iu.test(text))
        return 105;
    if (/dashboard/iu.test(text))
        return 103;
    if (/document\s+library|doc\s+library/iu.test(text))
        return 16;
    if (/report/iu.test(text))
        return 106;
    return 1;
}
function applicationPlanIsWorkbenchCustomForm(value) {
    const record = applicationPlanObject(value);
    const text = `${record.formType || ""} ${record.formName || ""} ${record.selectedTemplate || ""} ${record.openIn || ""}`.toLowerCase();
    return /\bworkbench\b/u.test(text) || text.includes("data_list_form_layout_workbench");
}
function applicationPlanUnique(value) {
    const values = Array.isArray(value) ? value : [];
    const seen = new Set();
    const output = [];
    for (const item of values) {
        const text = String(item || "");
        const key = text.toLowerCase();
        if (seen.has(key))
            continue;
        seen.add(key);
        output.push(text);
    }
    return output;
}
function applicationPlanMaterializationFailureDto(value) {
    const source = applicationPlanObject(value);
    const context = applicationPlanObject(source.context);
    const findings = Array.isArray(source.findings) ? source.findings : [];
    if (!applicationPlanJsonSafe(context) || !applicationPlanJsonSafe(findings))
        throw new Error("APPLICATION_PLAN_STATIC_FAILURE_DTO_UNSAFE");
    return { status: "fail", ...applicationPlanJsonClone(context), findings: applicationPlanJsonClone(findings) };
}
function applicationPlanJsonSafe(value) {
    if (value === null || ["string", "number", "boolean"].includes(typeof value))
        return true;
    if (Array.isArray(value))
        return value.every(applicationPlanJsonSafe);
    if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype)
        return false;
    return Object.values(value).every(applicationPlanJsonSafe);
}
function applicationPlanJsonClone(value) { return JSON.parse(JSON.stringify(value)); }
function applicationPlanObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function applicationPlanFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value))
        return value;
    for (const child of Object.values(value))
        applicationPlanFreeze(child);
    return Object.freeze(value);
}
