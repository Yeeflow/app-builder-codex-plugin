const EXACT_PLACEHOLDERS = new Set([
  "deferred",
  "n/a",
  "no",
  "none",
  "not applicable",
  "not planned",
  "not required",
]);

export function cleanPlanningLabel(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/^[\s'"“”‘’([{]+|[\s'"“”‘’.,;:!?…)}\]]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePlanningLabel(value) {
  return cleanPlanningLabel(value)
    .toLowerCase()
    .replace(/\bn\s*[./]s*a\b/g, "n/a")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPlanningPlaceholder(value) {
  const text = normalizePlanningLabel(value);
  if (!text) return true;
  if (EXACT_PLACEHOLDERS.has(text)) return true;
  if (/^(?:not applicable|not planned|not required|deferred|n\/a|none)(?:\s*[-–—:]\s*.+)$/.test(text)) return true;
  if (/^no\s+(?:dashboard(?:\s+page)?s?|form\s+reports?|data\s+reports?|custom\s+forms?|approval\s+forms?|schedule(?:d)?\s+workflows?|data\s+list\s+workflows?|navigation(?:\s+items?)?|pages?|resources?)(?:\s+(?:required|planned|needed|applicable))?(?:\s*[-–—:]\s*.*)?$/.test(text)) return true;
  if (/^(?:dashboard(?:\s+page)?s?|form\s+reports?|data\s+reports?|custom\s+forms?|approval\s+forms?|navigation(?:\s+items?)?|pages?|resources?)\s+(?:not\s+(?:required|planned|applicable)|none)$/.test(text)) return true;
  return false;
}

