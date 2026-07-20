export type ScalarSummaryOperation = "total" | "average" | "minimum" | "maximum" | "count";
export type ScalarSummarySourceType = "text" | "date" | "datetime" | "number" | "decimal" | "boolean" | "bit";

export interface DataListSublistScalarSummaryIntentInput {
  readonly surface: "data-list-sublist-summary";
  readonly summaryKey: string;
  readonly summaryReference: string;
  readonly scope: "data-list-sublist";
  readonly knownSummaryReferences?: readonly string[];
  readonly sourceColumn: Readonly<{ id: string; name: string; scalarType: ScalarSummarySourceType }>;
  readonly aggregateOperation: ScalarSummaryOperation | string;
  readonly display: boolean;
  readonly format?: string;
  readonly temporaryVariableReference?: unknown;
  readonly runtimeExpression?: unknown;
}

export interface DataListSublistScalarSummaryFinding {
  readonly code: string;
  readonly message: string;
  readonly summaryKey: string;
}

export interface DataListSublistScalarSummaryIntent {
  readonly summaryKey: string;
  readonly summaryReference: string;
  readonly sourceColumn: Readonly<{ id: string; name: string; scalarType: ScalarSummarySourceType }>;
  readonly aggregateOperation: ScalarSummaryOperation;
  readonly display: boolean;
  readonly format: string;
}

export interface DataListSublistScalarSummaryIntentResult {
  readonly intent: DataListSublistScalarSummaryIntent | null;
  readonly descriptor: Readonly<Record<string, unknown>> | null;
  readonly findings: readonly DataListSublistScalarSummaryFinding[];
}

const operations = new Set<ScalarSummaryOperation>(["total", "average", "minimum", "maximum", "count"]);
const scalarTypes = new Set<ScalarSummarySourceType>(["text", "date", "datetime", "number", "decimal", "boolean", "bit"]);

/** Internal-only projection of static scalar aggregate intent; it never owns variables or host bindings. */
export function projectDataListSublistScalarSummaryIntentInternal(input: DataListSublistScalarSummaryIntentInput): DataListSublistScalarSummaryIntentResult {
  const findings: DataListSublistScalarSummaryFinding[] = [];
  const summaryKey = summaryText(input?.summaryKey);
  const reference = summaryText(input?.summaryReference);
  const source = input?.sourceColumn;
  const operation = summaryText(input?.aggregateOperation) as ScalarSummaryOperation;
  if (!summaryKey) findings.push(summaryFinding("SUBLIST_SUMMARY_REFERENCE_MISSING", summaryKey));
  if (!reference || reference !== `summary:${summaryKey}`) findings.push(summaryFinding("SUBLIST_SUMMARY_REFERENCE_RELATIONSHIP_BROKEN", summaryKey));
  if (input?.scope !== "data-list-sublist") findings.push(summaryFinding("SUBLIST_SUMMARY_REFERENCE_WRONG_SCOPE", summaryKey));
  if ((input?.knownSummaryReferences || []).filter((value) => value === reference).length > 1) findings.push(summaryFinding("SUBLIST_SUMMARY_REFERENCE_DUPLICATE", summaryKey));
  if (input?.temporaryVariableReference !== undefined && input?.temporaryVariableReference !== null) findings.push(summaryFinding("SUBLIST_TEMP_VARIABLE_REFERENCE_INVALID", summaryKey));
  if (input?.runtimeExpression !== undefined && input?.runtimeExpression !== null) findings.push(summaryFinding("SUBLIST_SUMMARY_REFERENCE_INVALID", summaryKey));
  if (!source || !summaryText(source.id) || !summaryText(source.name) || !scalarTypes.has(source.scalarType) || !operations.has(operation)) findings.push(summaryFinding("SUBLIST_SUMMARY_REFERENCE_INVALID", summaryKey));
  if (source && operation !== "count" && source.scalarType !== "number" && source.scalarType !== "decimal") findings.push(summaryFinding("SUBLIST_SUMMARY_REFERENCE_INVALID", summaryKey));
  if (findings.length) return summaryFrozenResult(null, null, findings);
  const sourceColumn = Object.freeze({ id: summaryText(source!.id), name: summaryText(source!.name), scalarType: source!.scalarType });
  const intent = Object.freeze({ summaryKey, summaryReference: reference, sourceColumn, aggregateOperation: operation, display: input.display === true, format: summaryText(input.format) });
  const descriptor = Object.freeze({ key: summaryKey, reference, field: sourceColumn.name, operation, display: intent.display, format: intent.format });
  return summaryFrozenResult(intent, descriptor, []);
}

function summaryFrozenResult(intent: DataListSublistScalarSummaryIntent | null, descriptor: Readonly<Record<string, unknown>> | null, findings: readonly DataListSublistScalarSummaryFinding[]): DataListSublistScalarSummaryIntentResult { return Object.freeze({ intent, descriptor, findings: Object.freeze([...findings]) }); }
function summaryFinding(code: string, summaryKey: string): DataListSublistScalarSummaryFinding { return Object.freeze({ code, message: code, summaryKey }); }
function summaryText(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
