import {
  projectFixedFilterIntents,
  type FixedFilterProjectionResult,
  type JsonValue,
} from "../index.js";

/**
 * Internal LayoutView implementation contract. The public package index exposes
 * only the approved projection function and DTOs; all normalization helpers in
 * this module remain implementation-only. The host retains LayoutView resource
 * integration, fixed-filter key allocation, and caller-owned findings mutation.
 */
export type DataListDefaultViewFieldInput = Readonly<{
  FieldID?: JsonValue;
  FieldName?: JsonValue;
  DisplayName?: JsonValue;
  InternalName?: JsonValue;
  Type?: JsonValue;
  FieldType?: JsonValue;
  Rules?: JsonValue;
}>;

export type DataListDefaultViewIntent = Readonly<{
  displayFields?: JsonValue;
  queryFields?: JsonValue;
  filterConditions?: JsonValue;
  viewName?: JsonValue;
}>;

export type DataListStaticQueryField = Readonly<{
  FieldName: string;
  field: string;
}>;

export type DataListDefaultViewTemplateSnapshot = Readonly<{
  staticQueryFields?: readonly DataListStaticQueryField[];
}>;

export type DataListDefaultViewLayoutProjectionInput = Readonly<{
  viewScope?: JsonValue;
  fields: readonly DataListDefaultViewFieldInput[];
  viewIntent?: DataListDefaultViewIntent | null;
  templateSnapshot?: DataListDefaultViewTemplateSnapshot | null;
  listName?: JsonValue;
}>;

export type LayoutViewProjectionFinding = Readonly<{
  code: string;
  message: string;
  context: Readonly<Record<string, JsonValue>>;
}>;

export type DataListLayoutColumnProjection = Readonly<{
  FieldID?: JsonValue;
  FieldName?: JsonValue;
  DisplayName?: JsonValue;
  Type?: JsonValue;
  Order: number;
  Mobile: number;
  Show: boolean;
}>;

export type DataListQueryFieldProjection = Readonly<{
  FieldID?: JsonValue;
  FieldName?: JsonValue;
  field?: JsonValue;
  ID?: JsonValue;
  Name?: JsonValue;
  Type?: JsonValue;
  Rules: JsonValue;
  InternalName?: JsonValue;
}>;

export type DataListDefaultViewLayoutProjection = Readonly<{
  layout: readonly DataListLayoutColumnProjection[];
  filter: readonly [];
  query: readonly (DataListQueryFieldProjection | DataListStaticQueryField)[];
  sort: readonly [];
  rowColor: readonly [];
}>;

export type DataListDefaultViewLayoutProjectionResult = Readonly<{
  fragment: DataListDefaultViewLayoutProjection;
  fixedFilterProjection: FixedFilterProjectionResult;
  findings: readonly LayoutViewProjectionFinding[];
}>;

export type DataListDefaultViewSelectorInput = Readonly<{
  views?: readonly Readonly<{ viewName?: JsonValue; isDefault?: JsonValue }>[];
}>;

export type DataListDefaultViewSelectorResult = Readonly<{
  selectedIndex: number | null;
}>;

/**
 * Selects the default view from immutable static view intent only. The host
 * retains the caller-owned view objects and every LayoutView/resource concern.
 */
export function projectDataListDefaultViewSelector(input: DataListDefaultViewSelectorInput): DataListDefaultViewSelectorResult {
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
] as const);

/**
 * Produces the deterministic, pre-host-lowering portion of a default Data List
 * LayoutView. Field IDs and template static descriptors are supplied inputs.
 */
export function projectDataListDefaultViewLayoutInternal(
  input: DataListDefaultViewLayoutProjectionInput,
): DataListDefaultViewLayoutProjectionResult {
  const fields = input.fields;
  const viewIntent = input.viewIntent ?? null;
  const layoutFields = ensureTitleFirstFields(
    resolveDataViewFields(fields, viewIntent?.displayFields),
    fields,
  ).slice(0, 12);
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
    filter: Object.freeze([] as const),
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
    sort: Object.freeze([] as const),
    rowColor: Object.freeze([] as const),
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

function ensureTitleFirstFields(
  fields: readonly DataListDefaultViewFieldInput[],
  allFields: readonly DataListDefaultViewFieldInput[] = fields,
): readonly DataListDefaultViewFieldInput[] {
  const titleField = fields.find((field) => field.FieldName === "Title")
    || allFields.find((field) => field.FieldName === "Title");
  return titleField
    ? [titleField, ...fields.filter((field) => field.FieldName !== "Title")]
    : fields;
}

function uniqueFieldsByName(fields: readonly DataListDefaultViewFieldInput[]): readonly DataListDefaultViewFieldInput[] {
  const seen = new Set<JsonValue | undefined>();
  const result: DataListDefaultViewFieldInput[] = [];
  for (const field of fields) {
    const fieldName = field?.FieldName;
    if (!fieldName || seen.has(fieldName)) continue;
    seen.add(fieldName);
    result.push(field);
  }
  return result;
}

function resolveDataViewFields(
  fields: readonly DataListDefaultViewFieldInput[],
  plannedText: JsonValue | undefined,
): readonly DataListDefaultViewFieldInput[] {
  const tokens = splitPlannedFieldList(plannedText);
  if (!tokens.length) return fields.slice(0, 8);
  const result: DataListDefaultViewFieldInput[] = [];
  const seen = new Set<JsonValue | undefined>();
  for (const token of tokens) {
    const field = resolveDataViewField(fields, token);
    if (!field || seen.has(field.FieldName)) continue;
    seen.add(field.FieldName);
    result.push(field);
  }
  return result.length ? result : fields.slice(0, 8);
}

function splitPlannedFieldList(value: JsonValue | undefined): readonly string[] {
  const text = cleanResourceName(value)
    .replace(/\bquery\b|\bsearch\b|\bfields?\b|\bcolumns?\b/gi, " ")
    .replace(/\s+and\s+/gi, ",");
  if (!text || isNonResourceName(text) || /^(all|all fields|default)$/i.test(text)) return [];
  return text.split(/[,;，；、]/).map((item) => cleanResourceName(item)).filter((item) => item && !isNonResourceName(item));
}

function resolveDataViewField(
  fields: readonly DataListDefaultViewFieldInput[],
  requestedName: string,
): DataListDefaultViewFieldInput | null {
  const requested = normalizedKey(requestedName);
  if (!requested) return null;
  return fields.find((field) => [field.DisplayName, field.FieldName, field.InternalName]
    .some((value) => normalizedKey(value) === requested)) || null;
}

function cleanResourceName(value: JsonValue | undefined): string {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/`|\*\*/g, "")
    .replace(/^[\s'"“”‘’([{]+|[\s'"“”‘’.,;:!?…)}\]]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isNonResourceName(value: string): boolean {
  const text = cleanResourceName(value);
  if (isPlanningPlaceholder(text)) return true;
  if (/^(status|resource type|notes?|owner|used by|actions?|fields?)$/i.test(text)) return true;
  if (/^no\s+(?:form\s+)?reports?\b/i.test(text)) return true;
  if (/^no custom\b/i.test(text)) return true;
  return /^(dashboard|dashboard page|dashboard page name|page|page name|list name|form name|group|item|section|metric name|filter name)$/i.test(text);
}

function isPlanningPlaceholder(value: string): boolean {
  const text = cleanResourceName(value).toLowerCase().replace(/\bn\s*[./]\s*a\b/g, "n/a");
  return !text || ["deferred", "n/a", "no", "none", "not applicable", "not planned", "not required"].includes(text)
    || /^(?:not applicable|not planned|not required|deferred|n\/a|none)(?:\s*[-–—:]\s*.+)$/i.test(text);
}

function normalizedKey(value: JsonValue | undefined): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
