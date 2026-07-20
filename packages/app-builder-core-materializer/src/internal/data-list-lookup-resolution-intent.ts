export type DataListLookupIntentInput = Readonly<{
  surface: "data-list";
  sourceResourceKey: string;
  sourceFieldKey: string;
  sourceFieldOrdinal: number;
  lookupTarget?: string | null;
  displayName?: string | null;
  controlType: "lookup";
}>;

export type DataListLookupResolutionRequest = Readonly<{
  requestId: string;
  sourceResourceKey: string;
  sourceFieldKey: string;
  sourceFieldOrdinal: number;
  candidateKeys: readonly string[];
}>;

export type DataListLookupIntent = Readonly<{
  surface: "data-list";
  sourceResourceKey: string;
  sourceFieldKey: string;
  sourceFieldOrdinal: number;
  declaredTargetKey: string;
  displayField: "Title";
  resolutionRequest: DataListLookupResolutionRequest;
}>;

export type DataListLookupValidationFinding = Readonly<{
  code: "DATA_LIST_LOOKUP_TARGET_UNRESOLVED";
  message: string;
  sourceResourceKey: string;
  sourceFieldKey: string;
}>;

export type DataListLookupIntentProjectionResult = Readonly<{
  intent: DataListLookupIntent | null;
  findings: readonly DataListLookupValidationFinding[];
}>;

/**
 * Internal-only deterministic Lookup intent projection. It deliberately has
 * no target identity, target map, host resource, or tenant-state input.
 */
export function projectDataListLookupResolutionIntentInternal(input: DataListLookupIntentInput): DataListLookupIntentProjectionResult {
  if (!input || input.surface !== "data-list" || input.controlType !== "lookup") throw new TypeError("DATA_LIST_LOOKUP_INTENT_INVALID");
  const sourceResourceKey = normalizeKey(input.sourceResourceKey);
  const sourceFieldKey = normalizeKey(input.sourceFieldKey);
  if (!sourceResourceKey || !sourceFieldKey || !Number.isInteger(input.sourceFieldOrdinal) || input.sourceFieldOrdinal < 0) {
    throw new TypeError("DATA_LIST_LOOKUP_INTENT_INVALID");
  }
  const displayNameKey = normalizeKey(input.displayName);
  const candidates = unique([
    normalizeKey(input.lookupTarget),
    displayNameKey,
    displayNameKey ? normalizeKey(`${input.displayName}s`) : "",
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

function normalizeKey(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
