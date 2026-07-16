function normalizeHeader(value) {
  return String(value || "")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function splitMarkdownTableRow(line) {
  let source = String(line || "").trim();
  if (source.startsWith("|")) source = source.slice(1);
  if (source.endsWith("|") && !isEscapedAt(source, source.length - 1)) source = source.slice(0, -1);
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

function isEscapedAt(value, index) {
  let slashes = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) slashes += 1;
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
    if (fencedLines.has(index) || fencedLines.has(index + 1)) continue;
    if (!/^\s*\|.*\|\s*$/.test(lines[index]) || !/^\s*\|.*\|\s*$/.test(lines[index + 1])) continue;
    const headers = splitMarkdownTableRow(lines[index]);
    const separator = splitMarkdownTableRow(lines[index + 1]);
    if (!isMarkdownTableSeparator(separator)) continue;
    const rows = [];
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
    if (!marker) continue;
    fenced.add(index);
    if (match && match[1][0] === marker) marker = "";
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
  if (!table || !row) return "";
  const wanted = (Array.isArray(headerNames) ? headerNames : [headerNames]).map(normalizeHeader);
  const index = table.headers.findIndex((header) => wanted.includes(normalizeHeader(header)));
  return index < 0 ? "" : String(row.cells[index] || "").trim();
}

export function markdownRowValues(table, row, headerNames) {
  if (!table || !row) return [];
  const wanted = (Array.isArray(headerNames) ? headerNames : [headerNames]).map(normalizeHeader);
  return table.headers
    .map((header, index) => (wanted.includes(normalizeHeader(header)) ? String(row.cells[index] || "").trim() : null))
    .filter((value) => value !== null);
}

export function extractMarkdownSubsection(text, headingPattern) {
  const source = String(text || "");
  const match = headingPattern.exec(source);
  if (!match) return "";
  const headingLevel = (match[0].match(/^#+/) || ["####"])[0].length;
  const after = source.slice(match.index + match[0].length);
  const lines = after.split(/\r?\n/);
  const kept = [];
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+/);
    if (heading && heading[1].length <= headingLevel) break;
    kept.push(line);
  }
  return kept.join("\n");
}

export function isNegativeRequirementStatement(value) {
  const text = String(value || "").trim();
  if (!text) return false;
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
  if (new RegExp(`\\b${technicalLabel}\\b\\s*[:=]\\s*${token}\\b`, "i").test(source)) return true;
  for (const table of parseMarkdownTables(source)) {
    const technicalIndexes = table.headers
      .map((header, index) => (/\b(id|identifier|proc key|resource key)\b/i.test(header) ? index : -1))
      .filter((index) => index >= 0);
    if (table.rows.some((row) => technicalIndexes.some((index) => new RegExp(`^${token}$`, "i").test(row.cells[index] || "")))) return true;
  }
  return false;
}
