export type DataListSublistLookupAdditionalFieldIntentInput = Readonly<{
  surface: "data-list-sublist-lookup-additional-field";
  scope: Readonly<{ parentListId: string; parentFieldId: string; layoutId: string; layoutResourceId: string; parentSublistBinding: string; parentSublistControlId: string }>;
  lookup: Readonly<{ id: string; idx: string; targetListId: string; targetListSetId: string; appId: 41; displayField: "Title"; valueField: string }>;
  source: Readonly<{ fieldName: string; fieldId: string; order: string; isShow: boolean; relationName: string }>;
  destination: Readonly<{ id: string; idx: string; name: string; type: "number" | "decimal"; editable: boolean; readonly: true; controlBinding: string }>;
  runtime?: unknown;
  template?: unknown;
  resource?: unknown;
  additionValue?: unknown;
}>;

export type DataListSublistLookupAdditionalFieldFinding = Readonly<{ code: string; message: string }>;
export type DataListSublistLookupAdditionalFieldIntent = Readonly<{
  surface: "data-list-sublist-lookup-additional-field";
  scope: DataListSublistLookupAdditionalFieldIntentInput["scope"];
  lookup: DataListSublistLookupAdditionalFieldIntentInput["lookup"];
  source: DataListSublistLookupAdditionalFieldIntentInput["source"];
  destination: DataListSublistLookupAdditionalFieldIntentInput["destination"];
}>;
export type DataListSublistLookupAdditionalFieldIntentResult = Readonly<{ intent: DataListSublistLookupAdditionalFieldIntent | null; findings: readonly DataListSublistLookupAdditionalFieldFinding[] }>;

export function projectDataListSublistLookupAdditionalFieldIntentInternal(input: DataListSublistLookupAdditionalFieldIntentInput): DataListSublistLookupAdditionalFieldIntentResult {
  const findings: DataListSublistLookupAdditionalFieldFinding[] = [];
  const scope = input?.scope;
  const lookup = input?.lookup;
  const source = input?.source;
  const destination = input?.destination;
  if (input?.surface !== "data-list-sublist-lookup-additional-field" || !scope || ![scope.parentListId, scope.parentFieldId, scope.layoutId, scope.layoutResourceId].every(lookupAdditionalScopeId) || ![scope.parentSublistBinding, scope.parentSublistControlId].every(lookupAdditionalText)) lookupAdditionalFinding(findings, "SUBLIST_LOOKUP_ADDITIONAL_SCOPE_MISMATCH");
  if (!lookup || !lookupAdditionalText(lookup.id) || !lookupAdditionalText(lookup.idx) || lookup.appId !== 41 || !lookupAdditionalTargetId(lookup.targetListId) || !lookupAdditionalTargetId(lookup.targetListSetId) || lookup.displayField !== "Title" || !lookupAdditionalText(lookup.valueField) || lookup.valueField !== lookup.id) lookupAdditionalFinding(findings, "SUBLIST_LOOKUP_ADDITIONAL_TARGET_INVALID");
  if (!source || !lookupAdditionalText(source.fieldName) || !lookupAdditionalTargetId(source.fieldId) || !/^\d+$/.test(source.order) || source.isShow !== true || !lookupAdditionalText(source.relationName)) lookupAdditionalFinding(findings, "SUBLIST_LOOKUP_ADDITIONAL_SOURCE_INVALID");
  if (!destination || !lookupAdditionalText(destination.id) || !lookupAdditionalText(destination.idx) || !lookupAdditionalText(destination.name) || !["number", "decimal"].includes(destination.type) || typeof destination.editable !== "boolean" || destination.readonly !== true || !lookupAdditionalText(destination.controlBinding) || destination.controlBinding !== destination.id) lookupAdditionalFinding(findings, "SUBLIST_LOOKUP_ADDITIONAL_DESTINATION_READONLY_REQUIRED");
  if (source?.relationName && destination?.id && source.relationName !== destination.id) lookupAdditionalFinding(findings, "SUBLIST_LOOKUP_ADDITIONAL_RELATIONSHIP_BROKEN");
  if (input?.runtime !== undefined || input?.template !== undefined || input?.resource !== undefined || input?.additionValue !== undefined) lookupAdditionalFinding(findings, "SUBLIST_LOOKUP_ADDITIONAL_HOST_STATE_FORBIDDEN");
  return findings.length ? lookupAdditionalFrozen(null, findings) : lookupAdditionalFrozen(Object.freeze({ surface: "data-list-sublist-lookup-additional-field", scope: Object.freeze({ ...scope }), lookup: Object.freeze({ ...lookup }), source: Object.freeze({ ...source }), destination: Object.freeze({ ...destination }) }), []);
}

function lookupAdditionalScopeId(value: unknown): value is string { return typeof value === "string" && /^\d{1,30}$/.test(value); }
function lookupAdditionalTargetId(value: unknown): value is string { return typeof value === "string" && /^\d{19}$/.test(value); }
function lookupAdditionalText(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function lookupAdditionalFinding(output: DataListSublistLookupAdditionalFieldFinding[], code: string) { output.push(Object.freeze({ code, message: code })); }
function lookupAdditionalFrozen(intent: DataListSublistLookupAdditionalFieldIntent | null, findings: readonly DataListSublistLookupAdditionalFieldFinding[]): DataListSublistLookupAdditionalFieldIntentResult { return Object.freeze({ intent, findings: Object.freeze([...findings]) }); }
