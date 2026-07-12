const CONTROL_TYPE_ALIASES = new Map([
  ["input", "input"],
  ["text", "input"],
  ["single line", "input"],
  ["singleline", "input"],
  ["textarea", "textarea"],
  ["multiple line", "textarea"],
  ["multiline", "textarea"],
  ["richtext", "richtext"],
  ["rich text", "richtext"],
  ["list", "list"],
  ["sub list", "list"],
  ["sublist", "list"],
  ["radio", "radio"],
  ["select", "select"],
  ["dropdown", "select"],
  ["datepicker", "datepicker"],
  ["date picker", "datepicker"],
  ["input number", "input_number"],
  ["input_number", "input_number"],
  ["number", "input_number"],
  ["currency", "currency"],
  ["switch", "switch"],
  ["identity picker", "identity-picker"],
  ["identity-picker", "identity-picker"],
  ["user picker", "identity-picker"],
  ["file upload", "file-upload"],
  ["file-upload", "file-upload"],
  ["image upload", "image-upload"],
  ["image-upload", "image-upload"],
  ["lookup", "lookup"],
]);

export function resolveSchemaAuthoritativeFormControlType(field = {}) {
  const explicit = canonicalControlType(field.controlType || field.Type || field.type);
  if (explicit) return explicit;

  const schemaType = normalize(field.fieldType || field.FieldType || field.variableType || field.dataType);
  if (!schemaType) return "input";
  if (/sub list|sublist|detail list|line items?/.test(schemaType)) return "list";
  if (/rich text|richtext|html/.test(schemaType)) return "richtext";
  if (/multiple line|multi line|multiline|long text|textarea/.test(schemaType)) return "textarea";
  if (/user|identity|people|person/.test(schemaType)) return "identity-picker";
  if (/image|photo|picture/.test(schemaType)) return "image-upload";
  if (/file|attachment|document/.test(schemaType)) return "file-upload";
  if (/date|datetime|time/.test(schemaType)) return "datepicker";
  if (/currency/.test(schemaType)) return "currency";
  if (/decimal|number|integer|quantity|count|percent/.test(schemaType)) return "input_number";
  if (/bit|boolean|yes no/.test(schemaType)) return "switch";
  if (/choice|single select|select|radio|dropdown|flow status|flowstatus|status/.test(schemaType)) return "radio";
  if (/lookup|reference|relation/.test(schemaType)) return "lookup";
  return "input";
}

export function isTextSchemaType(value) {
  const normalized = normalize(value);
  return /^(text|string|single line|singleline|short text)$/.test(normalized);
}

export function isChoiceSchemaType(value) {
  const normalized = normalize(value);
  return /^(choice|single select|select|radio|dropdown|flow status|flowstatus|status)$/.test(normalized);
}

export function isChoiceControlType(value) {
  return ["radio", "select"].includes(canonicalControlType(value));
}

export function canonicalControlType(value) {
  const normalized = normalize(value).replace(/-/g, " ");
  const exact = CONTROL_TYPE_ALIASES.get(normalized);
  if (exact) return exact;

  // App Plan authors sometimes add a descriptive alias such as "radio dropdown".
  // Treat that as an explicit control declaration without consulting the field label.
  if (/\bradio\b/.test(normalized)) return "radio";
  if (/\b(?:dropdown|select)\b/.test(normalized)) return "select";
  if (/\b(?:identity|user|people|person)\b/.test(normalized)) return "identity-picker";
  if (/\b(?:file|attachment)\b/.test(normalized)) return "file-upload";
  if (/\b(?:image|photo|picture)\b/.test(normalized)) return "image-upload";
  if (/\b(?:date|datetime|time)\b/.test(normalized)) return "datepicker";
  if (/\b(?:number|integer|decimal)\b/.test(normalized)) return "input_number";
  return "";
}

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}
