const PLANNING_ANNOTATION_RE = /\s*[（(]\s*(?:planning\s+default|recommended\s+default|user[-\s]+default(?:[-\s]+approved(?:[-\s]+for[-\s]+generation)?)?|规划默认|推荐默认|用户默认(?:已批准生成)?)\s*[)）]\s*$/i;
const CHOICE_DELIMITER_RE = /(?:\r?\n|[、,，;；])+/;

function choiceValue(value) {
  if (value == null) return "";
  if (typeof value === "object") return value.value ?? value.label ?? value.text ?? value.Value ?? value.Name ?? value.Title ?? "";
  return value;
}

function stripPlanningAnnotation(value) {
  let text = String(choiceValue(value) ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/`|\*\*/g, "")
    .trim();
  while (PLANNING_ANNOTATION_RE.test(text)) text = text.replace(PLANNING_ANNOTATION_RE, "").trim();
  return text;
}

function rawChoiceValues(value) {
  if (Array.isArray(value)) return value.flatMap(rawChoiceValues);
  if (value && typeof value === "object") return [choiceValue(value)];
  const text = String(value ?? "").trim();
  if (!text) return [];
  if (/^\s*\[/.test(text)) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.flatMap(rawChoiceValues);
    } catch {
      // Continue with the App Plan display-string form.
    }
  }
  return text.split(CHOICE_DELIMITER_RE);
}

function parseChoiceOptionValues(value) {
  const values = [];
  const seen = new Set();
  for (const raw of rawChoiceValues(value)) {
    const normalized = stripPlanningAnnotation(raw);
    if (!normalized || /^(?:n\/?a|none|not applicable)$/i.test(normalized)) continue;
    const key = normalized.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    values.push(normalized);
  }
  return values;
}

function containsPlanningAnnotation(value) {
  return PLANNING_ANNOTATION_RE.test(String(choiceValue(value) ?? "").trim());
}

function containsMergedChoiceValues(value) {
  const text = String(choiceValue(value) ?? "").trim();
  return CHOICE_DELIMITER_RE.test(text) && parseChoiceOptionValues(text).length > 1;
}

module.exports = {
  containsMergedChoiceValues,
  containsPlanningAnnotation,
  parseChoiceOptionValues,
  stripPlanningAnnotation,
};
