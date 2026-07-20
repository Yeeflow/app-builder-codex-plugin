export type DataListFormControlStaticSchemaKind = "resolve" | "is-text-schema" | "is-choice-schema" | "is-choice-control" | "canonical-control";
export type DataListFormControlStaticSchemaInput = Readonly<{ kind: DataListFormControlStaticSchemaKind; value?: unknown }>;
export type DataListFormControlStaticSchemaProjection = Readonly<{ kind: DataListFormControlStaticSchemaKind; value: string | boolean }>;

const aliases: Readonly<Record<string, string>> = Object.freeze({
  input:"input",text:"input","single line":"input",singleline:"input",textarea:"textarea","multiple line":"textarea",multiline:"textarea",richtext:"richtext","rich text":"richtext",list:"list","sub list":"list",sublist:"list",radio:"radio",select:"select",dropdown:"select",datepicker:"datepicker","date picker":"datepicker","input number":"input_number",input_number:"input_number",number:"input_number",currency:"currency",switch:"switch","identity picker":"identity-picker","identity-picker":"identity-picker","user picker":"identity-picker","file upload":"file-upload","file-upload":"file-upload","image upload":"image-upload","image-upload":"image-upload",lookup:"lookup",
});

/** Immutable Data List form-control classification with no field record, template, or Host state. */
export function projectDataListFormControlStaticSchema(input: DataListFormControlStaticSchemaInput): DataListFormControlStaticSchemaProjection {
  const kind=input?.kind; let value: string|boolean;
  if(kind==="resolve") value=formControlResolve(formControlAsRecord(input.value));
  else if(kind==="is-text-schema") value=/^(text|string|single line|singleline|short text)$/.test(formControlNormalize(input.value));
  else if(kind==="is-choice-schema") value=/^(choice|single select|select|radio|dropdown|flow status|flowstatus|status)$/.test(formControlNormalize(input.value));
  else if(kind==="is-choice-control") value=["radio","select"].includes(formControlCanonical(input.value));
  else if(kind==="canonical-control") value=formControlCanonical(input.value);
  else throw new Error(`Unsupported Data List form-control static schema kind: ${String(kind||"")}`);
  return Object.freeze({kind,value});
}
function formControlAsRecord(value:unknown):Readonly<Record<string,unknown>> { return value&&typeof value==="object"&&!Array.isArray(value)?value as Readonly<Record<string,unknown>>:{}; }
function formControlNormalize(value:unknown):string { return String(value||"").trim().toLowerCase().replace(/[_-]+/g," ").replace(/\s+/g," "); }
function formControlCanonical(value:unknown):string { const text=formControlNormalize(value).replace(/-/g," "); if(aliases[text])return aliases[text]; if(/\bradio\b/.test(text))return "radio";if(/\b(?:dropdown|select)\b/.test(text))return "select";if(/\b(?:identity|user|people|person)\b/.test(text))return "identity-picker";if(/\b(?:file|attachment)\b/.test(text))return "file-upload";if(/\b(?:image|photo|picture)\b/.test(text))return "image-upload";if(/\b(?:date|datetime|time)\b/.test(text))return "datepicker";if(/\b(?:number|integer|decimal)\b/.test(text))return "input_number";return ""; }
function formControlResolve(field:Readonly<Record<string,unknown>>):string { const explicit=formControlCanonical(field.controlType||field.Type||field.type);if(explicit)return explicit;const schema=formControlNormalize(field.fieldType||field.FieldType||field.variableType||field.dataType);if(!schema)return "input";if(/sub list|sublist|detail list|line items?/.test(schema))return "list";if(/rich text|richtext|html/.test(schema))return "richtext";if(/multiple line|multi line|multiline|long text|textarea/.test(schema))return "textarea";if(/user|identity|people|person/.test(schema))return "identity-picker";if(/image|photo|picture/.test(schema))return "image-upload";if(/file|attachment|document/.test(schema))return "file-upload";if(/date|datetime|time/.test(schema))return "datepicker";if(/currency/.test(schema))return "currency";if(/decimal|number|integer|quantity|count|percent/.test(schema))return "input_number";if(/bit|boolean|yes no/.test(schema))return "switch";if(/choice|single select|select|radio|dropdown|flow status|flowstatus|status/.test(schema))return "radio";if(/lookup|reference|relation/.test(schema))return "lookup";return "input"; }
