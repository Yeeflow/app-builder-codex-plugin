import fs from "node:fs";
import path from "node:path";

const controlSource = "/Users/Renger/Downloads/control-configurations.json";
const fieldSource = "/Users/Renger/Downloads/field-configurations.json";
const generatedAt = "2026-05-14T00:00:00.000Z";

const safeControls = new Set([
  "input",
  "textarea",
  "input_number",
  "currency",
  "radio",
  "switch",
  "datepicker",
  "lookup",
  "list",
  "workflowControlPanel",
  "workflowHistory",
  "container",
  "section",
  "heading",
]);

const safeFields = new Set([
  "input",
  "textarea",
  "input_number",
  "currency",
  "radio",
  "switch",
  "datepicker",
  "lookup",
]);

const supportedButUnprovenControls = new Set([
  "richtext",
  "percent",
  "checkbox",
  "time",
  "file-upload",
  "icon-upload",
  "identity-picker",
  "organization-picker",
  "location-picker",
  "cost-center-picker",
  "lookup-list",
  "signer",
  "tag",
  "metadata",
  "mutiple-metadata",
  "rate",
  "hyperlink",
  "daterange",
]);

const supportedButUnprovenFields = new Set([
  "richtext",
  "percent",
  "checkbox",
  "time",
  "file-upload",
  "icon-upload",
  "identity-picker",
  "organization-picker",
  "location-picker",
  "cost-center-picker",
  "signer",
  "tag",
  "metadata",
  "mutiple-metadata",
  "rate",
  "hyperlink",
  "autonumber",
  "calculated-column",
]);

const externalOrEnvironmentControls = new Set([
  "identity-picker",
  "organization-picker",
  "location-picker",
  "cost-center-picker",
  "file-upload",
  "icon-upload",
  "signer",
  "document-library",
  "document-embed",
]);

const externalOrEnvironmentFields = new Set([
  "identity-picker",
  "organization-picker",
  "location-picker",
  "cost-center-picker",
  "file-upload",
  "icon-upload",
  "signer",
]);

const riskyControls = new Set([
  "codein",
  "lookup-list",
  "metadata",
  "mutiple-metadata",
  "list-qrcode",
  "barcode",
  "print",
]);

const riskyFields = new Set(["list", "lookup", "metadata", "mutiple-metadata", "calculated-column"]);

const mapping = {
  input: { fieldType: "Text", fieldControl: "input", support: "generation-safe", notes: "Default text mapping." },
  textarea: { fieldType: "Text", fieldControl: "textarea", support: "generation-safe", notes: "Use for multiline text where the list field stores Text." },
  richtext: { fieldType: "Text", fieldControl: "richtext", support: "schema-supported-runtime-unproven", fallback: "textarea" },
  input_number: { fieldType: "Decimal", fieldControl: "input_number", support: "generation-safe" },
  percent: { fieldType: "Decimal", fieldControl: "percent", support: "schema-supported-runtime-unproven", fallback: "input_number" },
  currency: { fieldType: "Decimal", fieldControl: "currency", support: "generation-safe-with-rules" },
  radio: { fieldType: "Text", fieldControl: "radio", support: "generation-safe", notes: "Use Rules.choices/options/items and store selected text." },
  checkbox: { fieldType: "Text", fieldControl: "checkbox", support: "schema-supported-runtime-unproven", fallback: "radio or text label" },
  switch: { fieldType: "Bit", fieldControl: "switch", support: "generation-safe" },
  datepicker: { fieldType: "Datetime", fieldControl: "datepicker", support: "generation-safe-with-rules" },
  time: { fieldType: "Text", fieldControl: "time", support: "fallback", fallback: "Text/input until time field runtime is proven" },
  "file-upload": { fieldType: "File", fieldControl: "file-upload", support: "deferred" },
  "icon-upload": { fieldType: "File", fieldControl: "icon-upload", support: "deferred" },
  "identity-picker": { fieldType: "Text", fieldControl: "input", support: "fallback", fallback: "Text/input display value unless user/person field metadata is proven" },
  "organization-picker": { fieldType: "Text", fieldControl: "input", support: "fallback" },
  "location-picker": { fieldType: "Text", fieldControl: "input", support: "fallback" },
  "cost-center-picker": { fieldType: "Text", fieldControl: "input", support: "fallback" },
  lookup: { fieldType: "Text", fieldControl: "lookup", support: "generation-safe-with-local-target", notes: "Requires appid/listsetid/listid/listfield and resolved target list." },
  "lookup-list": { fieldType: "Text", fieldControl: "lookup-list", support: "deferred" },
  list: { fieldType: "Text", fieldControl: "list", support: "schema-supported-persistence-deferred" },
  signer: { fieldType: "Text", fieldControl: "signer", support: "deferred" },
  tag: { fieldType: "Text", fieldControl: "tag", support: "fallback" },
  metadata: { fieldType: "Text", fieldControl: "metadata", support: "fallback" },
  "mutiple-metadata": { fieldType: "Text", fieldControl: "mutiple-metadata", support: "fallback" },
  hyperlink: { fieldType: "Text", fieldControl: "hyperlink", support: "fallback" },
  rate: { fieldType: "Decimal", fieldControl: "rate", support: "fallback" },
  "calculated-column": { fieldType: "Calculated", fieldControl: "calculated-column", support: "data-list-only" },
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function compactDescription(text) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, 220);
}

function valueTypeOf(valueType) {
  if (Array.isArray(valueType)) return valueType.join("|");
  return String(valueType || "unknown");
}

function supportLevel(type, kind) {
  if (kind === "control") {
    if (safeControls.has(type)) return "proven-safe";
    if (externalOrEnvironmentControls.has(type)) return "environment-dependent";
    if (riskyControls.has(type)) return "risky-deferred";
    if (supportedButUnprovenControls.has(type)) return "schema-supported-runtime-unproven";
    return "schema-supported-unclassified";
  }
  if (safeFields.has(type)) return "proven-safe";
  if (externalOrEnvironmentFields.has(type)) return "environment-dependent";
  if (riskyFields.has(type)) return "risky-deferred";
  if (supportedButUnprovenFields.has(type)) return "schema-supported-runtime-unproven";
  return "schema-supported-unclassified";
}

function normalize(entries, kind) {
  const byType = {};
  const propertyPathIndex = {};
  const valueTypeIndex = {};
  const enumIndex = {};

  for (const entry of entries) {
    const configs = Array.isArray(entry.configurations) ? entry.configurations : [];
    for (const type of entry.control_types || []) {
      byType[type] ??= {
        sourceEntryIds: [],
        properties: {},
        propertyPaths: [],
        enumPaths: [],
        generationSupportLevel: supportLevel(type, kind),
        notes: [],
      };
      byType[type].sourceEntryIds.push(entry.id);
      for (const config of configs) {
        const pathKey = String(config.path || "").trim();
        if (!pathKey) continue;
        const valueType = valueTypeOf(config.valueType);
        byType[type].properties[pathKey] ??= {
          valueTypes: [],
          allowDevice: Boolean(config.allowDevice),
        };
        if (!byType[type].properties[pathKey].valueTypes.includes(valueType)) {
          byType[type].properties[pathKey].valueTypes.push(valueType);
        }
        if (config.enum) {
          byType[type].properties[pathKey].enum = Object.keys(config.enum);
          if (!byType[type].enumPaths.includes(pathKey)) byType[type].enumPaths.push(pathKey);
          enumIndex[pathKey] ??= {};
          for (const [key, label] of Object.entries(config.enum)) enumIndex[pathKey][key] = compactDescription(label);
        }
        propertyPathIndex[pathKey] ??= [];
        if (!propertyPathIndex[pathKey].includes(type)) propertyPathIndex[pathKey].push(type);
        valueTypeIndex[valueType] ??= [];
        if (!valueTypeIndex[valueType].includes(pathKey)) valueTypeIndex[valueType].push(pathKey);
      }
    }
  }

  for (const record of Object.values(byType)) {
    record.sourceEntryIds = [...new Set(record.sourceEntryIds)].sort();
    record.propertyPaths = Object.keys(record.properties).sort();
    record.enumPaths.sort();
    if (record.generationSupportLevel.includes("unproven")) {
      record.notes.push("Schema reference exists, but runtime generation should be isolated before promotion.");
    }
    if (record.generationSupportLevel === "environment-dependent") {
      record.notes.push("May depend on tenant users, organization data, files, signatures, or other environment resources.");
    }
    if (record.generationSupportLevel === "risky-deferred") {
      record.notes.push("Do not generate automatically without a focused export/import proof.");
    }
  }

  const commonProperties = Object.fromEntries(
    Object.entries(propertyPathIndex)
      .filter(([, types]) => types.length >= Math.max(3, Math.floor(Object.keys(byType).length * 0.25)))
      .sort(([a], [b]) => a.localeCompare(b))
  );

  return {
    generatedFrom: kind === "control" ? "control-configurations.json" : "field-configurations.json",
    generatedAt,
    sourceEntryCount: entries.length,
    typeCount: Object.keys(byType).length,
    [kind === "control" ? "byControlType" : "byFieldType"]: Object.fromEntries(Object.entries(byType).sort(([a], [b]) => a.localeCompare(b))),
    commonProperties,
    enumIndex: Object.fromEntries(Object.entries(enumIndex).sort(([a], [b]) => a.localeCompare(b))),
    propertyPathIndex: Object.fromEntries(Object.entries(propertyPathIndex).sort(([a], [b]) => a.localeCompare(b))),
    valueTypeIndex: Object.fromEntries(Object.entries(valueTypeIndex).sort(([a], [b]) => a.localeCompare(b))),
    [kind === "control" ? "controlTypeGroups" : "fieldTypeGroups"]: {
      provenSafe: Object.keys(byType).filter((type) => supportLevel(type, kind) === "proven-safe").sort(),
      schemaSupportedRuntimeUnproven: Object.keys(byType).filter((type) => supportLevel(type, kind) === "schema-supported-runtime-unproven").sort(),
      environmentDependent: Object.keys(byType).filter((type) => supportLevel(type, kind) === "environment-dependent").sort(),
      riskyDeferred: Object.keys(byType).filter((type) => supportLevel(type, kind) === "risky-deferred").sort(),
      schemaSupportedUnclassified: Object.keys(byType).filter((type) => supportLevel(type, kind) === "schema-supported-unclassified").sort(),
    },
    notes: [
      "Normalized for generator and validator guidance. This is not a full runtime proof for every schema-supported type.",
      "Use errors only for unknown type, clearly invalid primitive type, invalid enum, or required metadata known from proven baselines.",
      "Use warnings for schema-supported but runtime-unproven types.",
    ],
  };
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

const controlNormalized = normalize(readJson(controlSource), "control");
const fieldNormalized = normalize(readJson(fieldSource), "field");
fieldNormalized.controlToFieldMapping = mapping;

writeJson("control-configurations.normalized.json", controlNormalized);
writeJson("field-configurations.normalized.json", fieldNormalized);

fs.mkdirSync("docs", { recursive: true });

function supportTable(groups, label) {
  return Object.entries(groups)
    .map(([group, values]) => `| ${group} | ${values.length ? values.join(", ") : "-"} |`)
    .join("\n");
}

function topProperties(normalized, byKey) {
  const byType = normalized[byKey];
  return Object.entries(byType)
    .slice(0, 60)
    .map(([type, info]) => `| ${type} | ${info.generationSupportLevel} | ${info.propertyPaths.slice(0, 18).join(", ")} |`)
    .join("\n");
}

fs.writeFileSync(
  "docs/yeeflow-control-configuration-reference.md",
  `# Yeeflow Control Configuration Reference

Sources studied read-only:

- \`/Users/Renger/Downloads/control-configurations.json\`

The source contains ${controlNormalized.sourceEntryCount} configuration entries covering ${controlNormalized.typeCount} control types.

## Support Groups

| Group | Control types |
| --- | --- |
${supportTable(controlNormalized.controlTypeGroups)}

## Common Properties

Common approval/dashboard control properties include:

- \`binding\`: variable or field binding for persistence and two-way value updates.
- \`readonly\`: static readonly flag.
- \`label\` and \`label_var\`: static or calculated label.
- \`displayLabel\`: label visibility.
- \`attrs.required\`: required input behavior.
- \`attrs.placeholder\`: placeholder text.
- \`attrs.control_display\`: dynamic display, readonly/write, or style rules.
- \`attrs.control_event_rule\`: action triggered after change.
- \`attrs.control_validation\`: custom control validators.
- \`attrs.lablay\`, \`attrs.labWid\`, \`attrs.labWidUnit\`, \`attrs.verAli\`: label layout and alignment.

## Control Inventory

| Control type | Support level | Key property paths |
| --- | --- | --- |
${topProperties(controlNormalized, "byControlType")}

## Generator Guidance

- Generate only proven-safe controls by default.
- Use schema-supported runtime-unproven controls only in isolated packages with explicit runtime proof.
- Treat environment-dependent controls such as identity, organization, location, cost-center, file, icon, and signer controls as deferred unless the target tenant metadata is provided.
- Preserve \`attrs.control_display\`, \`attrs.control_event_rule\`, and \`attrs.control_validation\` shapes from real exports; do not invent runtime logic.
- For lookup controls, require resolved app/listset/list/listfield metadata.

## Validator Guidance

- Unknown control types should warn or fail in generator-final mode depending on context.
- Invalid enum values should be reported when the path is present in the normalized enum index.
- Primitive value-type mismatches should warn unless the type is already proven and required.
- Missing \`binding\` should warn for generated value-entry controls when persistence is expected.
`
);

fs.writeFileSync(
  "docs/yeeflow-field-configuration-reference.md",
  `# Yeeflow Field Configuration Reference

Sources studied read-only:

- \`/Users/Renger/Downloads/field-configurations.json\`

The source contains ${fieldNormalized.sourceEntryCount} configuration entries covering ${fieldNormalized.typeCount} field/control types.

## Support Groups

| Group | Field/control types |
| --- | --- |
${supportTable(fieldNormalized.fieldTypeGroups)}

## Common Properties

Common data-list field properties include:

- \`Type\`: Yeeflow field control type.
- \`DisplayName\`: user-facing field name.
- \`DefaultValue\`: field default.
- \`Rules.required\`: required behavior.
- \`Rules.placeholder\`: input placeholder.
- \`IsUnique\`: uniqueness constraint.
- \`Rules.choices\`: choice options.
- \`Rules.number_min\`, \`Rules.number_max\`, \`Rules.number_step\`, \`Rules.rounded-to\`: numeric settings.
- \`Rules.currencyCode\`, \`Rules.displayFormat\`, \`Rules.displayThousandths\`: currency/number display.
- \`Rules.dateformat\`, \`Rules.date_picker\`, \`Rules.showtime\`, \`Rules.minuteStep\`: date/time settings.
- \`Rules.listid\`, \`Rules.listsetid\`, \`Rules.listfield\`: lookup metadata when present in generated fields.

## Field Inventory

| Field/control type | Support level | Key property paths |
| --- | --- | --- |
${topProperties(fieldNormalized, "byFieldType")}

## Generator Guidance

- Preserve native \`Title\` metadata for generated lists.
- Use Text/input, Text/textarea, Decimal/input_number, Text/radio, Bit/switch, Datetime/datepicker, and local lookup as the safest generated field families.
- Keep file, icon, identity, organization, location, cost-center, signer, metadata, and calculated-column shapes warning-first until focused runtime proof exists.
- Keep lookup sample values blank unless local target sample IDs are proven and included in \`ReplaceIds\`.
`
);

fs.writeFileSync(
  "docs/yeeflow-control-to-field-mapping.md",
  `# Yeeflow Control To Field Mapping

Use this table when planning app-level persistence from approval form controls to data-list fields.

| Approval/control type | Data-list field type | Data-list control | Support | Fallback / notes |
| --- | --- | --- | --- | --- |
${Object.entries(mapping)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([control, spec]) => `| ${control} | ${spec.fieldType} | ${spec.fieldControl} | ${spec.support} | ${spec.fallback || spec.notes || ""} |`)
  .join("\n")}

## Rules

- Generation-safe mappings can be used in normal app packages after standard validation.
- Schema-supported mappings need isolated import/runtime proof before becoming defaults.
- Fallback mappings should store a simple display value in Text or Decimal until the native field runtime is proven.
- Deferred mappings must stop generation unless the user explicitly asks for research or provides an export proving the shape.
- \`calculated-column\` is data-list only; do not model it as an approval variable unless a real export proves the workflow interaction.
`
);

fs.writeFileSync(
  "docs/yeeflow-control-field-generation-rules.md",
  `# Yeeflow Control And Field Generation Rules

This document operationalizes the normalized control and field references for Yeeflow generators.

## Approval Form Controls

- Consult \`control-configurations.normalized.json\` before using a control type.
- Default to proven-safe controls: input, textarea, input_number, currency, radio, switch, datepicker, lookup, list, container, section, heading, workflowControlPanel, and workflowHistory.
- Require \`binding\` for generated value-entry controls when the value must persist.
- Use \`attrs.required\` for required behavior and keep custom validators in \`attrs.control_validation\`.
- Use \`attrs.control_display\` for dynamic show/hide/readonly/style only when the rule shape is copied from a studied export.
- Use \`attrs.control_event_rule\` only when the action is explicitly modeled and validated.

## Data List Fields

- Consult \`field-configurations.normalized.json\` before using a field/control type.
- Preserve native Title metadata in every generated list:
  - \`FieldName: "Title"\`
  - \`Status: 0\`
  - \`IsSystem: true\`
  - \`IsIndex: true\`
  - \`FieldIndex: 0\` when present in the package style
- Use \`Rules.required\`, \`Rules.placeholder\`, \`Rules.choices\`, numeric, date, and lookup rules only when type-compatible.
- For internal app-level lookup samples, local target sample IDs may be included in \`ReplaceIds\`.
- For standalone/external lookup samples, external IDs must be excluded from \`ReplaceIds\`.

## Fallback And Stop Rules

- Prefer Text fallback for user, organization, location, cost center, tag, metadata, hyperlink, signer, and file/image display values until native runtime is proven.
- Prefer Decimal fallback for percent and rate until native display behavior is proven.
- Defer file upload, icon upload, signer, metadata tree, lookup-list, and sublist persistence unless a focused export/import proves the shape.
- Do not guess enum values, picker max-selection settings, lookup metadata, or calculated-column formulas.

## Validator Policy

- Unknown control or field type: warning in compatibility, stricter warning/error in generator final where the generator is expected to know the shape.
- Invalid enum value: warning or error depending on proven support and final stage.
- Invalid primitive value type: warning unless it breaks a required proven field/control.
- Missing lookup target metadata: error for generated packages.
- Runtime-unproven types: warning with a stop condition for production-like generation.

## Skill Scope Decision

A standalone \`yeeflow-control-field-schema\` skill was not created in this learning pass. The reference is cross-cutting, but the operational use belongs inside the existing approval-form, data-list, and application generators. Keeping the normalized references in the project and pointing existing skills at them avoids a duplicated skill surface while still allowing a dedicated schema skill later if this grows into an independent authoring workflow.
`
);

console.log(JSON.stringify({
  controls: controlNormalized.typeCount,
  fields: fieldNormalized.typeCount,
  outputs: [
    "control-configurations.normalized.json",
    "field-configurations.normalized.json",
    "docs/yeeflow-control-configuration-reference.md",
    "docs/yeeflow-field-configuration-reference.md",
    "docs/yeeflow-control-field-generation-rules.md",
    "docs/yeeflow-control-to-field-mapping.md",
  ],
}, null, 2));
