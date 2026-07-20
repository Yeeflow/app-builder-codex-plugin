function normalizeHeader(value: unknown): string {
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

export interface PlanningLabelProjection {
  cleanLabel: string;
  normalizedLabel: string;
  isPlaceholder: boolean;
}

/**
 * Projects one planning label into the three deterministic placeholder facts
 * needed by host callers. It intentionally accepts no host objects and does
 * not expose the underlying leaf helpers as independent public APIs.
 */
export function projectPlanningLabel(value: unknown): Readonly<PlanningLabelProjection> {
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

export interface WorkflowSetDataListProjectionInput {
  record?: Readonly<Record<string, unknown>>;
  records?: readonly Readonly<Record<string, unknown>>[];
}

export interface WorkflowSetDataListVariableProjection {
  basic: readonly Readonly<Record<string, unknown>>[];
  listref: readonly Readonly<Record<string, unknown>>[];
  filter: readonly unknown[];
}

export interface WorkflowSetDataListProjection {
  record: Readonly<Record<string, unknown>>;
  variables: Readonly<WorkflowSetDataListVariableProjection>;
}

/**
 * Projects immutable Workflow Set Data List planning declarations into the
 * Legacy-compatible record and variable/list-reference metadata shapes. It
 * deliberately excludes the Host merge, workflow execution, graph mutation,
 * resource/package mutation, and runtime expression behavior.
 */
export function projectWorkflowSetDataListProjection(input: WorkflowSetDataListProjectionInput = {}): Readonly<WorkflowSetDataListProjection> {
  const record = workflowSetDataListProjectionRecord(input.record);
  const variables = buildWorkflowVariablesFromSetDataListRecords(input.records || []);
  return freezeWorkflowProjection({ record, variables });
}

function workflowProjectionText(value: unknown): string {
  return String(value == null ? "" : value).trim();
}

function workflowProjectionVariableType(value: unknown): string {
  const normalized = workflowProjectionText(value).toLowerCase();
  if (normalized === "string") return "text";
  if (["integer", "decimal", "currency", "bigint"].includes(normalized)) return "number";
  if (["bool", "bit"].includes(normalized)) return "boolean";
  if (["datetime", "time"].includes(normalized)) return "date";
  return normalized || "text";
}

function workflowProjectionChildFieldId(declaration: Readonly<Record<string, unknown>>): string {
  const key = workflowProjectionText(declaration.key);
  return key.startsWith("_list.") ? key.slice("_list.".length) : "";
}

function workflowSetDataListProjectionRecord(record: Readonly<Record<string, unknown>> | undefined): Record<string, unknown> {
  const source = record && typeof record === "object" && !Array.isArray(record) ? record : {};
  const declarations = Array.isArray(source.workflowVariableDeclarations) ? source.workflowVariableDeclarations : [];
  return {
    ...source,
    workflowVariableDeclarations: declarations.map((value) => {
      const declaration = value && typeof value === "object" && !Array.isArray(value) ? value as Readonly<Record<string, unknown>> : {};
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

function buildWorkflowVariablesFromSetDataListRecords(records: readonly Readonly<Record<string, unknown>>[]): WorkflowSetDataListVariableProjection {
  const declarations = records.flatMap((record) => {
    const normalized = workflowSetDataListProjectionRecord(record);
    return normalized.workflowVariableDeclarations as Readonly<Record<string, unknown>>[];
  });
  const groups = new Map<string, { id: string; name: string; declarations: Readonly<Record<string, unknown>>[] }>();
  for (const declaration of declarations) {
    const id = workflowProjectionText(declaration.id);
    if (!id) continue;
    const key = id.toLowerCase();
    if (!groups.has(key)) groups.set(key, { id, name: workflowProjectionText(declaration.name) || id, declarations: [] });
    groups.get(key)?.declarations.push(declaration);
  }
  const basic: Record<string, unknown>[] = [];
  const listref: Record<string, unknown>[] = [];
  for (const group of groups.values()) {
    const isList = group.declarations.some((declaration) => workflowProjectionText(declaration.type).toLowerCase() === "list" || workflowProjectionChildFieldId(declaration));
    if (!isList) {
      const declaration = group.declarations[0];
      basic.push({ id: group.id, idx: group.id, name: group.name, title: group.name, type: workflowProjectionVariableType(declaration.type || declaration.valueType), source: "workflow-set-data-list-plan" });
      continue;
    }
    const listRefId = `${group.id}ListRef`;
    const fields: Record<string, unknown>[] = [];
    const seenFields = new Set<string>();
    for (const declaration of group.declarations) {
      const id = workflowProjectionChildFieldId(declaration);
      if (!id || seenFields.has(id.toLowerCase())) continue;
      seenFields.add(id.toLowerCase());
      const displayName = workflowProjectionText(declaration.expressionName).split(":").filter(Boolean).at(-1) || id;
      fields.push({ id, idx: id, name: displayName, type: workflowProjectionVariableType(declaration.valueType), editable: true });
    }
    basic.push({ id: group.id, idx: group.id, name: group.name, title: group.name, type: "list", value: listRefId, source: "workflow-set-data-list-plan" });
    listref.push({ id: listRefId, idx: listRefId, name: `${group.name} Rows`, fields });
  }
  return { basic, listref, filter: [] };
}

function freezeWorkflowProjection<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) freezeWorkflowProjection(child);
  return Object.freeze(value);
}

export interface MarkdownTableRow {
  raw: string;
  cells: string[];
  line: number;
}

export interface MarkdownTable {
  headers: string[];
  rows: MarkdownTableRow[];
  line: number;
}

export function splitMarkdownTableRow(line: unknown): string[] {
  let source = String(line || "").trim();
  if (source.startsWith("|")) source = source.slice(1);
  if (source.endsWith("|") && !isEscapedAt(source, source.length - 1)) source = source.slice(0, -1);
  const cells: string[] = [];
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
      while (source[index + runLength] === "`") runLength += 1;
      current += "`".repeat(runLength);
      if (codeFenceLength === 0) codeFenceLength = runLength;
      else if (codeFenceLength === runLength) codeFenceLength = 0;
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

function isEscapedAt(value: string, index: number): boolean {
  let slashes = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) slashes += 1;
  return slashes % 2 === 1;
}

export function isMarkdownTableSeparator(cells: unknown): boolean {
  return Array.isArray(cells) && cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function parseMarkdownTables(text: unknown): MarkdownTable[] {
  const lines = String(text || "").split(/\r?\n/);
  const fencedLines = markdownFenceLines(lines);
  const tables: MarkdownTable[] = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (fencedLines.has(index) || fencedLines.has(index + 1)) continue;
    if (!/^\s*\|.*\|\s*$/.test(lines[index]) || !/^\s*\|.*\|\s*$/.test(lines[index + 1])) continue;
    const headers = splitMarkdownTableRow(lines[index]);
    const separator = splitMarkdownTableRow(lines[index + 1]);
    if (!isMarkdownTableSeparator(separator)) continue;
    const rows: MarkdownTableRow[] = [];
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      if (fencedLines.has(rowIndex)) break;
      if (!/^\s*\|.*\|\s*$/.test(lines[rowIndex])) break;
      const cells = splitMarkdownTableRow(lines[rowIndex]);
      if (!cells.length || isMarkdownTableSeparator(cells)) break;
      if (cells.some((cell) => /<[^>]+>/.test(cell))) continue;
      rows.push({ raw: lines[rowIndex].trim(), cells, line: rowIndex + 1 });
    }
    tables.push({ headers, rows, line: index + 1 });
    index += 1;
  }
  return tables;
}

export function stripMarkdownFencedBlocks(text: unknown): string {
  const lines = String(text || "").split(/\r?\n/);
  const fenced = markdownFenceLines(lines);
  return lines.map((line, index) => (fenced.has(index) ? "" : line)).join("\n");
}

function markdownFenceLines(lines: string[]): Set<number> {
  const fenced = new Set<number>();
  let marker = "";
  for (let index = 0; index < lines.length; index += 1) {
    const match = String(lines[index] || "").match(/^\s*(`{3,}|~{3,})/);
    if (!marker && match) {
      marker = match[1][0];
      fenced.add(index);
      continue;
    }
    if (!marker) continue;
    fenced.add(index);
    if (match && match[1][0] === marker) marker = "";
  }
  return fenced;
}

export function findMarkdownTable(text: unknown, requiredHeaders: unknown = []): MarkdownTable | null {
  const wanted = (requiredHeaders as unknown[]).map(normalizeHeader);
  return parseMarkdownTables(text).find((table) => {
    const actual = table.headers.map(normalizeHeader);
    return wanted.every((header) => actual.includes(header));
  }) || null;
}

export function markdownRowValue(table: MarkdownTable | null | undefined, row: MarkdownTableRow | null | undefined, headerNames: unknown[] | unknown): string {
  if (!table || !row) return "";
  const wanted = (Array.isArray(headerNames) ? headerNames : [headerNames]).map(normalizeHeader);
  const index = table.headers.findIndex((header) => wanted.includes(normalizeHeader(header)));
  return index < 0 ? "" : String(row.cells[index] || "").trim();
}

export function markdownRowValues(table: MarkdownTable | null | undefined, row: MarkdownTableRow | null | undefined, headerNames: unknown[] | unknown): string[] {
  if (!table || !row) return [];
  const wanted = (Array.isArray(headerNames) ? headerNames : [headerNames]).map(normalizeHeader);
  return table.headers
    .map((header, index) => (wanted.includes(normalizeHeader(header)) ? String(row.cells[index] || "").trim() : null))
    .filter((value): value is string => value !== null);
}

export function extractMarkdownSubsection(text: unknown, headingPattern: RegExp): string {
  const source = String(text || "");
  const match = headingPattern.exec(source);
  if (!match) return "";
  const headingLevel = (match[0].match(/^#+/) || ["####"])[0].length;
  const after = source.slice(match.index + match[0].length);
  const lines = after.split(/\r?\n/);
  const kept: string[] = [];
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+/);
    if (heading && heading[1].length <= headingLevel) break;
    kept.push(line);
  }
  return kept.join("\n");
}

export function isNegativeRequirementStatement(value: unknown): boolean {
  const text = String(value || "").trim();
  if (!text) return false;
  return /\b(no|not|none|without|does not|do not|did not|is not|are not|isn't|aren't|must not|never|not applicable|n\/a)\b[^.\n]{0,120}\b(required|needed|planned|used|included|supported|displayed|deferred|applicable|selected|contains?|includes?)\b/i.test(text)
    || /\b(no|none|not applicable|n\/a)\b\s+(dashboard|chart|collection|kanban|timeline|sub list|task form|item action|bulk action|record display|deferred item)/i.test(text);
}

export function positivePlanningText(value: unknown): string {
  return String(value || "")
    .split(/\r?\n/)
    .filter((line) => !isNegativeRequirementStatement(line))
    .join("\n");
}

export function hasTechnicalPlaceholderIdContext(text: unknown): boolean {
  const source = String(text || "");
  const token = "(?:LIST|PAGE|FORM|LAYOUT|PROC)-[A-Za-z0-9_-]+";
  const technicalLabel = "(?:ListID|PageID|FormID|LayoutID|ProcKey|Resource ID|Runtime ID|Generated ID|Implementation ID|Target ID)";
  if (new RegExp(`\\b${technicalLabel}\\b\\s*[:=]\\s*${token}\\b`, "i").test(source)) return true;
  for (const table of parseMarkdownTables(source)) {
    const technicalIndexes = table.headers
      .map((header, index) => (/\b(id|identifier|proc key|resource key)\b/i.test(header) ? index : -1))
      .filter((index) => index >= 0);
    if (table.rows.some((row) => technicalIndexes.some((index) => new RegExp(`^${token}$`, "i").test(row.cells[index] || "")))) return true;
  }
  return false;
}
