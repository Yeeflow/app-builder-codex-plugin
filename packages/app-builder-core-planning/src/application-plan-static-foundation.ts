export type ApplicationPlanStaticFoundationKind =
  | "parse-json-maybe"
  | "find-header-index"
  | "extract-numbered-section"
  | "extract-subsections"
  | "infer-navigation-type"
  | "is-workbench-custom-form"
  | "is-table-line"
  | "unique-case-insensitive"
  | "materialization-failure-dto";

export interface ApplicationPlanStaticFoundationRequest {
  kind: ApplicationPlanStaticFoundationKind;
  value?: unknown;
}

/**
 * Projects the small, JSON-safe parsing and normalization foundation used by
 * application-plan materialization. It intentionally accepts no plans,
 * resources, templates, package state, host identities, or runtime objects.
 */
export function projectApplicationPlanStaticFoundation(input: Readonly<ApplicationPlanStaticFoundationRequest>): Readonly<{ kind: ApplicationPlanStaticFoundationKind; value: unknown }> {
  const request = input && typeof input === "object" ? input : {} as ApplicationPlanStaticFoundationRequest;
  let value: unknown;
  switch (request.kind) {
    case "parse-json-maybe": value = applicationPlanParseJsonMaybe(request.value); break;
    case "find-header-index": value = applicationPlanFindHeaderIndex(request.value); break;
    case "extract-numbered-section": value = applicationPlanExtractNumberedSection(request.value); break;
    case "extract-subsections": value = applicationPlanExtractSubsections(request.value); break;
    case "infer-navigation-type": value = applicationPlanInferNavigationType(request.value); break;
    case "is-workbench-custom-form": value = applicationPlanIsWorkbenchCustomForm(request.value); break;
    case "is-table-line": value = /^\s*\|.+\|\s*$/.test(String(request.value || "")); break;
    case "unique-case-insensitive": value = applicationPlanUnique(request.value); break;
    case "materialization-failure-dto": value = applicationPlanMaterializationFailureDto(request.value); break;
    default: throw new Error("APPLICATION_PLAN_STATIC_FOUNDATION_KIND_UNSUPPORTED");
  }
  return applicationPlanFreeze({ kind: request.kind, value });
}

function applicationPlanParseJsonMaybe(value: unknown): unknown {
  if (!value || typeof value !== "string") return null;
  try { return JSON.parse(value); } catch { return null; }
}

function applicationPlanNormalizedKey(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/gu, " ").trim();
}

function applicationPlanFindHeaderIndex(value: unknown): number {
  const source = applicationPlanObject(value);
  const headers = Array.isArray(source.headers) ? source.headers : [];
  const candidates = Array.isArray(source.candidates) ? source.candidates : [];
  const normalizedCandidates = candidates.map(applicationPlanNormalizedKey);
  return headers.findIndex((header) => normalizedCandidates.includes(String(header || "")));
}

function applicationPlanMarker(value: unknown, forceGlobal = false): RegExp {
  const source = applicationPlanObject(value);
  const marker = applicationPlanObject(source.marker);
  const pattern = typeof marker.source === "string" ? marker.source : "";
  const flags = typeof marker.flags === "string" ? marker.flags : "";
  if (!pattern) throw new Error("APPLICATION_PLAN_STATIC_FOUNDATION_MARKER_INVALID");
  const normalizedFlags = forceGlobal && !flags.includes("g") ? `${flags}g` : flags;
  return new RegExp(pattern, normalizedFlags);
}

function applicationPlanText(value: unknown): string { return String(applicationPlanObject(value).text || ""); }

function applicationPlanExtractNumberedSection(value: unknown): string {
  const text = applicationPlanText(value);
  const match = applicationPlanMarker(value).exec(text);
  if (!match) return "";
  const start = match.index;
  const next = text.slice(start + match[0].length).search(/\n##\s+\d+\.\s+/u);
  return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next);
}

function applicationPlanExtractSubsections(value: unknown): string[] {
  const text = applicationPlanText(value);
  const matches = [...text.matchAll(applicationPlanMarker(value, true))];
  return matches.map((match) => applicationPlanSubsectionAt(text, match.index || 0, match[0]));
}

function applicationPlanSubsectionAt(text: string, start: number, matched: string): string {
  const remainder = text.slice(start + matched.length);
  const next = remainder.search(/\n#{2,4}\s+/u);
  return next === -1 ? text.slice(start) : text.slice(start, start + matched.length + next);
}

function applicationPlanInferNavigationType(value: unknown): number {
  const text = String(value || "");
  if (/approval/iu.test(text)) return 105;
  if (/dashboard/iu.test(text)) return 103;
  if (/document\s+library|doc\s+library/iu.test(text)) return 16;
  if (/report/iu.test(text)) return 106;
  return 1;
}

function applicationPlanIsWorkbenchCustomForm(value: unknown): boolean {
  const record = applicationPlanObject(value);
  const text = `${record.formType || ""} ${record.formName || ""} ${record.selectedTemplate || ""} ${record.openIn || ""}`.toLowerCase();
  return /\bworkbench\b/u.test(text) || text.includes("data_list_form_layout_workbench");
}

function applicationPlanUnique(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const output: string[] = [];
  for (const item of values) {
    const text = String(item || "");
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }
  return output;
}

function applicationPlanMaterializationFailureDto(value: unknown): Record<string, unknown> {
  const source = applicationPlanObject(value);
  const context = applicationPlanObject(source.context);
  const findings = Array.isArray(source.findings) ? source.findings : [];
  if (!applicationPlanJsonSafe(context) || !applicationPlanJsonSafe(findings)) throw new Error("APPLICATION_PLAN_STATIC_FAILURE_DTO_UNSAFE");
  return { status: "fail", ...applicationPlanJsonClone(context), findings: applicationPlanJsonClone(findings) as unknown[] };
}

function applicationPlanJsonSafe(value: unknown): boolean {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(applicationPlanJsonSafe);
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) return false;
  return Object.values(value as Record<string, unknown>).every(applicationPlanJsonSafe);
}

function applicationPlanJsonClone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

function applicationPlanObject(value: unknown): Readonly<Record<string, unknown>> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Readonly<Record<string, unknown>> : {};
}

function applicationPlanFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) applicationPlanFreeze(child);
  return Object.freeze(value);
}
