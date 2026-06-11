# Workflow AI Assistant Image Input

Source export: `/Users/Renger/Downloads/Spark & AI (1).yap`

Classification: export-proven image-input mapping structure.

## Proven Pattern

The `Extract&Update In-Stock` workflow proves that the AI Assistant workflow node can pass an image/file-like list field into an Agent input variable typed as `img`.

Observed node pattern:

- workflow node: `stencil.id = "AI"`
- node mode: `properties.type = "agent"`
- Agent input variable entry:
  - `id = "label_image"`
  - `type = "img"`
  - `description` present
  - `value.type = 1`
  - `value.value.exprType = "list_field"`

## Source Field Binding

The mapped source field is the `Stock Box` field:

- display name: `Image File`
- internal name: `ImageFile`
- field slot: `Text9`
- control type: `icon-upload`
- field type: `Text`

Observed image mapping expression:

```json
{
  "type": 1,
  "value": {
    "exprType": "list_field",
    "valueType": "icon-upload",
    "prop": "Text9",
    "id": "ImageFile",
    "type": "expr"
  }
}
```

## What This Proves

- Image-capable Agent inputs are not restricted to Copilot chat contexts.
- Data-list workflows can bind a current-row upload control directly into an Agent `img` input.
- The workflow mapping uses the list-field expression system, not a file URL literal.
- The value-type discriminator on the expression preserves the UI/storage shape of the source control.

## What Remains Unproven

- The exact persisted binary/storage payload format behind `icon-upload`.
- Whether `file-upload` and `icon-upload` are interchangeable for all Agent image-input flows.
- Whether multiple-image inputs use the same mapping shape.
- Whether runtime image execution succeeds in every tenant without additional model or feature flags.

## Validation Guidance

- Require `properties.inputVariables` to be an array.
- When an input variable has `type = "img"`, require a structured `value` object.
- Accept export-proven list-field image mappings with `valueType = "icon-upload"` or `valueType = "file-upload"`.
- Treat live execution as runtime-sensitive even when the structure validates.
