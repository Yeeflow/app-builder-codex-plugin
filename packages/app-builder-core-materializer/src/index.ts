export const capabilityMetadata = {
  packageName: "@yeeflow/app-builder-core-materializer",
  version: "0.1.0",
  capabilities: ["Deterministic materializer normalization, field-default, regular-expression escaping, loose form-matching, planning-document suffix, template dependency-name and identifier primitives, immutable Data List scalar field projection, and fixed-filter intent projection with no host orchestration."],
} as const;

export type JsonValue = null | boolean | number | string | JsonValue[] | { readonly [key: string]: JsonValue };
import type { DataListDefaultViewLayoutProjectionResult } from "./internal/data-list-default-view-layout-projection.js";
import {
  projectDataListSublistFrozenDescriptorInternal,
  type FrozenEmbeddedSublistDescriptor,
  type FrozenEmbeddedSublistDescriptorInput,
} from "./internal/data-list-sublist-frozen-descriptor-shadow.js";
type DependencyItem = { readonly name?: JsonValue; readonly key?: JsonValue; readonly id?: JsonValue; readonly ID?: JsonValue };
type DependencyIdentifierOptions = { readonly lower?: JsonValue };

export type FieldControlProjectionFinding = Readonly<{
  code: string;
  path: string;
  message: string;
  severity: "error" | "warning";
}>;

export type ScalarFieldProjectionInput = Readonly<{
  displayName?: JsonValue;
  fieldName?: JsonValue;
  fieldType?: JsonValue;
  controlType?: JsonValue;
  choiceValues?: JsonValue;
  allowScan?: JsonValue;
  fieldIndex?: JsonValue;
  required?: JsonValue;
  unique?: JsonValue;
  filterable?: JsonValue;
  sortable?: JsonValue;
}>;

export type ScalarFieldProjection = Readonly<{
  displayName: JsonValue;
  fieldName: string;
  internalName: string;
  canonicalFieldType: "Text" | "Datetime" | "Decimal" | "Bit";
  canonicalControlType: string;
  fieldIndex: number;
  status: number;
  category: number;
  defaultValue: string;
  rules: string;
  required: false;
  unique: false;
  filterable: false;
  sortable: false;
  system: boolean;
  index: boolean;
}>;

export type ScalarFieldProjectionResult = Readonly<{
  projection: ScalarFieldProjection | null;
  findings: readonly FieldControlProjectionFinding[];
}>;

export type FixedFilterFieldReference = Readonly<{
  FieldID?: JsonValue;
  FieldName?: JsonValue;
  DisplayName?: JsonValue;
  InternalName?: JsonValue;
  FieldType?: JsonValue;
}>;

export type FixedFilterIntentInput = Readonly<{
  viewScope?: JsonValue;
  fields?: readonly FixedFilterFieldReference[];
  filterText?: JsonValue;
  listName?: JsonValue;
  viewName?: JsonValue;
}>;

export type FixedFilterConditionIntent = Readonly<{
  requestId: string;
  ordinal: number;
  pre: "and" | "or";
  left: string;
  op: string;
  right: JsonValue;
  showCus?: boolean;
}>;

export type FixedFilterKeyRequest = Readonly<{
  requestId: string;
  viewScope: string;
  ordinal: number;
  conditionFingerprint: string;
}>;

export type FixedFilterProjectionFinding = Readonly<{
  code: string;
  message: string;
  context: Readonly<Record<string, JsonValue>>;
}>;

export type FixedFilterProjectionResult = Readonly<{
  intents: readonly FixedFilterConditionIntent[];
  keyRequests: readonly FixedFilterKeyRequest[];
  findings: readonly FixedFilterProjectionFinding[];
}>;

export type DataListEmbeddedSublistDescriptorInput = FrozenEmbeddedSublistDescriptorInput;
export type DataListEmbeddedSublistDescriptorResult = Readonly<{
  descriptor: FrozenEmbeddedSublistDescriptor;
  findings: readonly never[];
}>;

/** Projects only the immutable parent-field embedded Sublist schema. */
export function projectDataListEmbeddedSublistDescriptor(input: DataListEmbeddedSublistDescriptorInput): DataListEmbeddedSublistDescriptorResult {
  return Object.freeze({ descriptor: projectDataListSublistFrozenDescriptorInternal(input), findings: Object.freeze([]) });
}

export type {
  DataListSublistStaticConfigurationKind,
  DataListSublistStaticConfigurationRequest,
  DataListSublistStaticConfigurationProjection,
} from "./internal/data-list-sublist-static-configuration.js";
export { projectDataListSublistStaticConfigurationInternal as projectDataListSublistStaticConfiguration } from "./internal/data-list-sublist-static-configuration.js";
export { projectTemplateStaticNormalization } from "./internal/template-static-normalization.js";
export { projectResourceDefinitionStaticIntent } from "./internal/resource-definition-static-intent.js";
export { projectDocumentLibraryStaticConfiguration } from "./internal/document-library-static-configuration.js";
export { projectApprovalFormStaticConfiguration } from "./internal/approval-form-static-configuration.js";
export type { DashboardStaticConfigurationRequest, DashboardStaticConfigurationProjection } from "./internal/dashboard-static-configuration.js";
export { projectDashboardStaticConfiguration } from "./internal/dashboard-static-configuration.js";

export type {
  DataListDefaultViewFieldInput,
  DataListDefaultViewIntent,
  DataListStaticQueryField,
  DataListDefaultViewTemplateSnapshot,
  DataListDefaultViewLayoutProjectionInput,
  LayoutViewProjectionFinding,
  DataListLayoutColumnProjection,
  DataListQueryFieldProjection,
  DataListDefaultViewLayoutProjection,
  DataListDefaultViewLayoutProjectionResult,
  DataListDefaultViewSelectorInput,
  DataListDefaultViewSelectorResult,
} from "./internal/data-list-default-view-layout-projection.js";

export {
  projectDataListDefaultViewLayoutInternal as projectDataListDefaultViewLayout,
} from "./internal/data-list-default-view-layout-projection.js";
export { projectDataListDefaultViewSelector } from "./internal/data-list-default-view-layout-projection.js";

export type {
  DataListAdditionalViewIntent,
  DataListAdditionalViewLayoutProjectionInput,
} from "./internal/data-list-additional-view-layout-projection.js";

export type DataListAdditionalViewLayoutProjectionResult = DataListDefaultViewLayoutProjectionResult;

export {
  projectDataListAdditionalViewLayoutInternal as projectDataListAdditionalViewLayout,
} from "./internal/data-list-additional-view-layout-projection.js";

export type { ScalarResourceDefinitionIntentInput, ScalarResourceDefinitionIntent, ScalarResourceIdentityRequest } from "./internal/data-list-scalar-resource-definition-intent.js";
export { projectDataListScalarResourceDefinitionIntentInternal as projectDataListScalarResourceDefinitionIntent } from "./internal/data-list-scalar-resource-definition-intent.js";

export type {
  DataListLookupIntentInput,
  DataListLookupResolutionRequest,
  DataListLookupIntent,
  DataListLookupValidationFinding,
  DataListLookupIntentProjectionResult,
} from "./internal/data-list-lookup-resolution-intent.js";
export { projectDataListLookupResolutionIntentInternal as projectDataListLookupResolutionIntent } from "./internal/data-list-lookup-resolution-intent.js";

export type {
  DataListType1IdentityControlPlacementInput,
  DataListType1IdentityControlPlacementDescriptor,
  DataListType1IdentityControlPlacementIntent,
  DataListType1IdentityControlPlacementFinding,
  DataListType1IdentityControlPlacementResult,
} from "./internal/data-list-type1-identity-control-placement.js";
export { projectDataListType1IdentityControlPlacementInternal as projectDataListType1IdentityControlPlacement } from "./internal/data-list-type1-identity-control-placement.js";

export type {
  DataListSublistScalarRowDescriptor,
  DataListSublistScalarRowSchemaInput,
  DataListSublistScalarRowSchemaDescriptor,
  DataListSublistScalarRowSchemaIntent,
  DataListSublistScalarRowSchemaFinding,
  DataListSublistScalarRowSchemaResult,
} from "./internal/data-list-sublist-scalar-row-schema.js";
export { projectDataListSublistScalarRowSchemaInternal as projectDataListSublistScalarRowSchema } from "./internal/data-list-sublist-scalar-row-schema.js";

export type {
  ScalarSummaryOperation,
  ScalarSummarySourceType,
  DataListSublistScalarSummaryIntentInput,
  DataListSublistScalarSummaryFinding,
  DataListSublistScalarSummaryIntent,
  DataListSublistScalarSummaryIntentResult,
} from "./internal/data-list-sublist-scalar-summary-intent.js";
export { projectDataListSublistScalarSummaryIntentInternal as projectDataListSublistScalarSummaryIntent } from "./internal/data-list-sublist-scalar-summary-intent.js";

export type {
  DynamicSummaryBindingKind,
  DataListSublistDynamicSummaryIntentInput,
  DataListSublistDynamicSummaryFinding,
  DataListSublistDynamicSummaryIntent,
  DataListSublistDynamicSummaryIntentResult,
} from "./internal/data-list-sublist-dynamic-summary-intent.js";
export { projectDataListSublistDynamicSummaryIntentInternal as projectDataListSublistDynamicSummaryIntent } from "./internal/data-list-sublist-dynamic-summary-intent.js";

export type { DataListSublistNestedControlPlacementInput, NestedControlFinding, NestedControlPlacementIntent, NestedControlPlacementResult } from "./internal/data-list-sublist-nested-control-placement.js";
export { projectDataListSublistNestedControlPlacementIntentInternal as projectDataListSublistNestedControlPlacementIntent } from "./internal/data-list-sublist-nested-control-placement.js";
export type { DataListSublistEmbeddedLookupIntentInput, DataListSublistEmbeddedLookupFinding, DataListSublistEmbeddedLookupIntent, DataListSublistEmbeddedLookupIntentResult } from "./internal/data-list-sublist-embedded-lookup-intent.js";
export { projectDataListSublistEmbeddedLookupIntentInternal as projectDataListSublistEmbeddedLookupIntent } from "./internal/data-list-sublist-embedded-lookup-intent.js";
export type { DataListSublistLookupAdditionalFieldIntentInput, DataListSublistLookupAdditionalFieldFinding, DataListSublistLookupAdditionalFieldIntent, DataListSublistLookupAdditionalFieldIntentResult } from "./internal/data-list-sublist-lookup-additional-field-intent.js";
export { projectDataListSublistLookupAdditionalFieldIntentInternal as projectDataListSublistLookupAdditionalFieldIntent } from "./internal/data-list-sublist-lookup-additional-field-intent.js";
export type { DataListSublistIdentityControlIntentInput, DataListSublistIdentityControlFinding, DataListSublistIdentityControlIntent, DataListSublistIdentityControlIntentResult } from "./internal/data-list-sublist-identity-control-intent.js";
export { projectDataListSublistIdentityControlIntentInternal as projectDataListSublistIdentityControlIntent } from "./internal/data-list-sublist-identity-control-intent.js";
export type { ApprovalFormSubListLookupStaticConfigurationInput, ApprovalFormSubListLookupStaticConfiguration } from "./internal/approval-form-sublist-lookup-static-configuration.js";
export { projectApprovalFormSubListLookupStaticConfigurationInternal as projectApprovalFormSubListLookupStaticConfiguration } from "./internal/approval-form-sublist-lookup-static-configuration.js";

export function normalizeHexColor(value?: JsonValue): string {
  const match = String(value || "").trim().match(/^#[0-9a-f]{6}$/i);
  return match ? match[0].toUpperCase() : "";
}

export function defaultValueForFieldType(fieldType?: JsonValue): string {
  return fieldType === "Bit" ? "0" : "";
}

export function escapeRegExp(value?: JsonValue): string {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeForLooseFormMatch(value?: JsonValue): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

export function stripPlanningDocumentSuffix(value?: JsonValue): string {
  return String(value || "")
    .replace(/\s+[-–—]\s+Yeeflow App Plan\s*$/i, "")
    .replace(/\s+Yeeflow App Plan\s*$/i, "")
    .trim();
}

export function dependencyName(item?: JsonValue): string {
  const dependency = item as DependencyItem | null | undefined;
  return String(dependency?.name || dependency?.key || dependency?.id || dependency?.ID || "").trim();
}

export function safeDependencyIdentifier(value?: JsonValue, options: JsonValue = {}): string {
  const identifierOptions = options as DependencyIdentifierOptions;
  const raw = identifierOptions.lower ? String(value || "").toLowerCase() : String(value || "");
  return raw.replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
}

/**
 * Produces the immutable, pre-ID portion of a Data List scalar field record.
 * The caller must pass a field specification that has already crossed the
 * Legacy plan-parsing boundary. Lookup, sublist, identity, file, and image
 * controls intentionally remain outside this Phase 5B scalar contract.
 */
export function projectDataListScalarField(input: ScalarFieldProjectionInput = {}): ScalarFieldProjectionResult {
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
export function projectFixedFilterIntents(input: FixedFilterIntentInput = {}): FixedFilterProjectionResult {
  const fields = input.fields as readonly FixedFilterFieldReference[];
  const text = cleanFixedFilterText(input.filterText);
  if (isNoFixedFilterText(text)) return freezeFixedFilterResult([], [], []);
  const normalized = text
    .replace(/\bDate\s*>=\s*Today\b/gi, "Date >= now")
    .replace(/\bcurrent date\b/gi, "now")
    .replace(/\btoday\b/gi, "now")
    .replace(new RegExp("\\u2265", "g"), ">=")
    .replace(new RegExp("\\u2264", "g"), "<=");
  const joiner: "and" | "or" = fixedFilterHasOr(normalized) ? "or" : "and";
  const parts = normalized.split(fixedFilterSplitter(joiner))
    .map((part) => cleanFixedFilterText(part))
    .filter(Boolean);
  const intents: FixedFilterConditionIntent[] = [];
  const requests: FixedFilterKeyRequest[] = [];
  for (const [ordinal, part] of parts.entries()) {
    const condition = parseFixedFilterIntentPart(part, fields, joiner, ordinal);
    if (!condition) continue;
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

function freezeFixedFilterResult(intents: readonly FixedFilterConditionIntent[], keyRequests: readonly FixedFilterKeyRequest[], findings: readonly FixedFilterProjectionFinding[]): FixedFilterProjectionResult {
  return Object.freeze({ intents: Object.freeze([...intents]), keyRequests: Object.freeze([...keyRequests]), findings: Object.freeze([...findings]) });
}

function parseFixedFilterIntentPart(part: string, fields: readonly FixedFilterFieldReference[], joiner: "and" | "or", ordinal: number): Omit<FixedFilterConditionIntent, "requestId" | "ordinal"> | null {
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
  if (!comparison) return null;
  const field = resolveFixedFilterField(fields, comparison[1]);
  if (!field) return null;
  return { pre: ordinal === 0 ? "and" : joiner, left: fixedFilterFieldName(field), op: fixedFilterOperator(comparison[2]), right: coerceFixedFilterValue(field, cleanFixedFilterText(comparison[3])) };
}

function cleanFixedFilterText(value: JsonValue | undefined): string {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/^[\s'"“”‘’([{]+|[\s'"“”‘’.,;:!?…)}\]]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isNoFixedFilterText(value: string): boolean {
  const text = cleanFixedFilterText(value);
  return !text || isNonResourceFixedFilterText(text) || /(?:no fixed|no filter|not filtered|all records|all items|\u65e0\u56fa\u5b9a|\u4e0d\u8fc7\u6ee4|\u5168\u96c6)/i.test(text);
}

function isNonResourceFixedFilterText(value: string): boolean {
  const text = cleanFixedFilterText(value);
  if (isPlanningPlaceholderText(text)) return true;
  return /^(status|resource type|notes?|owner|used by|actions?|fields?|dashboard|dashboard page|dashboard page name|page|page name|list name|form name|group|item|section|metric name|filter name)$/i.test(text) || /^no\s+(?:form\s+)?reports?\b/i.test(text) || /^no custom\b/i.test(text);
}

function isPlanningPlaceholderText(value: string): boolean {
  const text = cleanFixedFilterText(value).toLowerCase().replace(/\bn\s*[./]s*a\b/g, "n/a");
  if (!text || ["deferred", "n/a", "no", "none", "not applicable", "not planned", "not required"].includes(text)) return true;
  return /^(?:not applicable|not planned|not required|deferred|n\/a|none)(?:\s*[-–—:]\s*.+)$/i.test(text);
}

function fixedFilterHasOr(value: string): boolean { return new RegExp("\\s+(?:or|OR)\\s+|\\u6216|\\u4efb\\u4e00|any of", "i").test(value); }
function fixedFilterSplitter(joiner: "and" | "or"): RegExp { return joiner === "or" ? new RegExp("\\s+(?:or|OR)\\s+|\\u6216|\\uff1b|;|\\uff0c|,", "i") : new RegExp("\\s+(?:and|AND)\\s+|\\u4e14|\\uff1b|;|\\uff0c|,", "i"); }
function resolveFixedFilterField(fields: readonly FixedFilterFieldReference[], requestedName: string): FixedFilterFieldReference | null { const requested = fixedFilterKey(requestedName); return !requested ? null : fields.find((field) => [field.DisplayName, field.FieldName, field.InternalName].some((value) => fixedFilterKey(value) === requested)) || null; }
function fixedFilterKey(value: JsonValue | undefined): string { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function fixedFilterFieldName(field: FixedFilterFieldReference): string { return String(field.FieldName || ""); }
function fixedFilterOperator(comparator: string): string { return ({ "=": "0", "!=": "1", ">=": "3", "<=": "4", ">": "5", "<": "6" } as Readonly<Record<string, string>>)[comparator] || "0"; }
function fixedFilterNowValue(): JsonValue { return Object.freeze([Object.freeze({ type: "func", func: "now", params: Object.freeze([]) })]) as unknown as JsonValue; }
function coerceFixedFilterValue(field: FixedFilterFieldReference, value: string): JsonValue { if (/^Decimal$/i.test(String(field.FieldType || ""))) { const number = Number(value); return Number.isFinite(number) ? number : value; } if (/^Bit$/i.test(String(field.FieldType || ""))) return /^(true|yes|1|on)$/i.test(value) ? "true" : "false"; if (/^Datetime$/i.test(String(field.FieldType || "")) && /^now$/i.test(value)) return fixedFilterNowValue(); return value; }

function deferredScalarBoundary(fieldType: JsonValue | undefined, controlType: string): { code: string; message: string } | null {
  const normalized = normalizedKey(fieldType);
  if (controlType === "lookup") return { code: "DATA_LIST_SCALAR_FIELD_PROJECTION_DEFERRED_LOOKUP", message: "Lookup fields require host-owned target resolution and are outside the scalar projection contract." };
  if (controlType === "list") return { code: "DATA_LIST_SCALAR_FIELD_PROJECTION_DEFERRED_SUBLIST", message: "Sublist fields require host-owned row-variable assembly and are outside the scalar projection contract." };
  if (controlType === "identity-picker" || /user|people|person|identity/.test(normalized)) return { code: "DATA_LIST_SCALAR_FIELD_PROJECTION_DEFERRED_IDENTITY", message: "Identity controls require a separate identity-aware projection contract and are outside the scalar projection contract." };
  if (controlType === "file-upload" || controlType === "icon-upload") return { code: "DATA_LIST_SCALAR_FIELD_PROJECTION_DEFERRED_BINARY", message: "File and image controls require a separate binary-control contract and are outside the scalar projection contract." };
  return null;
}

function normalizeScalarFieldType(fieldType: JsonValue | undefined): "Text" | "Datetime" | "Decimal" | "Bit" {
  const normalized = normalizedKey(fieldType);
  if (/date|time/.test(normalized)) return "Datetime";
  if (/number|decimal|currency|amount|percent|integer/.test(normalized)) return "Decimal";
  if (/boolean|yes no|checkbox|bit/.test(normalized)) return "Bit";
  return "Text";
}

function normalizeScalarControlType(controlType: JsonValue | undefined): string {
  const normalized = normalizedKey(controlType);
  if (/sub list|sublist|\blist\b/.test(normalized)) return "list";
  if (/user|identity/.test(normalized)) return "identity-picker";
  if (/date|datetime/.test(normalized)) return "datepicker";
  if (/number|decimal|currency|amount|percent/.test(normalized)) return "input_number";
  if (/switch|bit|boolean|yes no|flag/.test(normalized)) return "switch";
  if (/checkbox/.test(normalized)) return "checkbox";
  if (/select|choice|dropdown/.test(normalized)) return "select";
  if (/lookup|reference|relation/.test(normalized)) return "lookup";
  if (/file|attachment/.test(normalized)) return "file-upload";
  if (/image|photo|picture|icon/.test(normalized)) return "icon-upload";
  if (/note|textarea|multi line/.test(normalized)) return "textarea";
  return "input";
}

function scalarFieldRules(field: Readonly<{ displayName?: JsonValue; fieldName: string; fieldType?: JsonValue; controlType: string; choiceValues?: JsonValue; allowScan: boolean }>): string {
  if (field.allowScan) return JSON.stringify({ allowScan: true });
  if (field.controlType !== "select" && field.controlType !== "radio" && field.controlType !== "checkbox" && field.controlType !== "tag") return "";
  const explicit = parseScalarChoiceValues(field.choiceValues);
  const values = explicit.length ? explicit : inferredScalarChoiceValues(field);
  const colors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];
  const choices = values.map((value, index) => ({ key: String(index + 1), value, color: colors[index % colors.length] }));
  return choices.length ? JSON.stringify({ choices, color_choices: choices, displayStyle: "dropdown", show_color: false }) : "";
}

function parseScalarChoiceValues(value: JsonValue | undefined): string[] {
  const raw = scalarChoiceLeaves(value);
  const seen = new Set<string>();
  const values: string[] = [];
  for (const candidate of raw) {
    let normalized = String(candidate ?? "")
      .replace(/<[^>]+>/g, "")
      .replace(/`|\*\*/g, "")
      .trim();
    while (/\s*[（(]\s*(?:planning\s+default|recommended\s+default|user[-\s]+default(?:[-\s]+approved(?:[-\s]+for[-\s]+generation)?)?)\s*[)）]\s*$/i.test(normalized)) {
      normalized = normalized.replace(/\s*[（(]\s*(?:planning\s+default|recommended\s+default|user[-\s]+default(?:[-\s]+approved(?:[-\s]+for[-\s]+generation)?)?)\s*[)）]\s*$/i, "").trim();
    }
    if (!normalized || /^(?:n\/?a|none|not applicable)$/i.test(normalized)) continue;
    const key = normalized.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    values.push(normalized);
  }
  return values;
}

function scalarChoiceLeaves(value: JsonValue | undefined): JsonValue[] {
  if (Array.isArray(value)) return value.flatMap((item) => scalarChoiceLeaves(item));
  if (value && typeof value === "object") {
    const record = value as { readonly value?: JsonValue; readonly label?: JsonValue; readonly text?: JsonValue; readonly Value?: JsonValue; readonly Name?: JsonValue; readonly Title?: JsonValue };
    return [record.value ?? record.label ?? record.text ?? record.Value ?? record.Name ?? record.Title ?? ""];
  }
  const text = String(value ?? "").trim();
  if (!text) return [];
  if (/^\[/.test(text)) {
    try {
      const parsed = JSON.parse(text) as JsonValue;
      if (Array.isArray(parsed)) return parsed.flatMap((item) => scalarChoiceLeaves(item));
    } catch {
      // The Legacy parser continues with the App Plan display-string form.
    }
  }
  return text.split(/(?:\r?\n|[、,，;；])+/);
}

function inferredScalarChoiceValues(field: Readonly<{ displayName?: JsonValue; fieldName: string; fieldType?: JsonValue; controlType: string }>): string[] {
  const raw = normalizedKey(`${String(field.displayName || "")} ${field.fieldName} ${String(field.fieldType || "")} ${field.controlType}`);
  if (/priority|urgency|severity|critical/.test(raw)) return ["Low", "Medium", "High", "Critical"];
  if (/condition|inspection|quality/.test(raw)) return ["Good", "Fair", "Damaged", "Lost"];
  if (/availability|available|reservation/.test(raw)) return ["Available", "Checked Out", "Reserved", "Maintenance"];
  if (/approval|decision|review/.test(raw)) return ["Pending Review", "Approved", "Rejected", "Returned"];
  if (/status|state|stage|phase/.test(raw)) return ["Draft", "Submitted", "In Progress", "Completed", "Closed"];
  if (/category|type|class|group/.test(raw)) return ["Standard", "Special", "Replacement", "Repair"];
  return ["Active", "Pending", "Closed"];
}

function schemaSafeScalarFieldName(value: JsonValue | undefined): string {
  const text = String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/`|\*\*/g, "")
    .replace(/^[\s'"“”‘’([{]+|[\s'"“”‘’.,;:!?…)}\]]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^A-Za-z0-9_]/g, "");
  if (/^Title$/i.test(text)) return "Title";
  return /^(Text|Bit|Decimal|Datetime)[1-9]\d*$/.test(text) ? text : "";
}

function scalarFieldPrefix(fieldType: JsonValue): string {
  const normalized = normalizedKey(fieldType);
  if (/date|time/.test(normalized)) return "Datetime";
  if (/number|decimal|currency|amount|percent|integer/.test(normalized)) return "Decimal";
  if (/boolean|yes no|checkbox|bit/.test(normalized)) return "Bit";
  return "Text";
}

function scalarFieldIndexFromName(value: string): number {
  const match = String(value || "").match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function normalizedKey(value: JsonValue | undefined): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
