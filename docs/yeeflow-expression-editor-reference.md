# Yeeflow Expression Editor Reference

This reference is normalized from the first expression training file, enriched by `expression training data generator_2.txt`, and cross-checked against supplied expression-editor screenshots. Uploaded training files and screenshots are treated as read-only evidence, not bundled source data.

## Core Token Model

Yeeflow expressions are JSON arrays of tokens. When a control or workflow setting expects expression editor output, generate expression arrays, not arbitrary JavaScript or raw text formulas.

Common token shapes:

```json
[
  { "exprType": "variable", "valueType": "number", "id": "Amount", "type": "expr", "name": "Workflow Variables:Amount" },
  { "type": "op", "op": "*" },
  { "type": "num", "value": "0.8" }
]
```

Literal tokens:

- string: `{ "type": "str", "value": "abc" }`
- number: `{ "type": "num", "value": "123" }`
- boolean: `{ "type": "bool", "value": true }`
- empty string: `{ "type": "str", "value": "" }`

Variable token:

```json
{
  "exprType": "variable",
  "valueType": "text",
  "id": "field_1",
  "type": "expr",
  "name": "Workflow Variables:field1"
}
```

All five variable properties are required. `valueType` may only be `number`, `text`, `date`, or `boolean`.

Function token:

```json
{ "type": "func", "func": "dateFormat", "params": [[{ "type": "func", "func": "now", "params": [] }], [{ "type": "str", "value": "YYYYMMDD" }]] }
```

Function params are arrays. In most cases, each param is itself an expression-token array. A few export examples use primitive strings or booleans inside params; validators should warn before rejecting these unless a focused export proves the context.

The enriched function knowledge base is stored in `yeeflow-expression-function-knowledge-base.normalized.json`. It adds bilingual descriptions, parameter names, return types, business scenarios, and keywords. It does not override the first-pass allowed function/operator set unless the function exists in `yeeflow-expression-functions.normalized.json`.

## Operators

Allowed operators from the training reference:

- arithmetic: `+`, `-`, `*`, `/`
- grouping: `(`, `)`
- logical: `and`, `or`
- comparison: `>`, `>=`, `<`, `<=`, `==`, `!=`
- string concatenation: `&`

The screenshots also show `%` in the expression-editor toolbar. Do not generate `%` until it is present in the normalized operator reference or an export-backed expression proves the token shape.

Do not invent operator names.

## Usage Contexts

The same token model can appear in:

- calculated controls
- dynamic display rules
- custom validation rules
- lookup/data filters
- workflow sequence/transition conditions
- workflow action conditions
- default values
- generated request numbers
- subtotal and total calculations
- date calculations
- string formatting

Different contexts may wrap expression tokens inside larger Yeeflow condition objects. Preserve the local wrapper shape from the studied export and validate the nested expression token array separately.

For screenshot-derived entry points and caveats, see `docs/yeeflow-expression-editor-ui-contexts.md`.

## UI Observations From Screenshots

- Calculation controls expose an `Expression` field and `Edit` button.
- Dynamic display rules open from control settings.
- Custom validation opens from the field Validation section.
- Lookup/data filters open from the Lookup control's data source/filter settings.
- Workflow transition conditions open from the selected sequence/transition arrow.
- The Expression Editor has separate context-variable and function selectors.
- Variable groups observed include Context, Workflow Variables, Static Variables, Temp variables, and Filter variables.
- Function tab categories observed include All, String, Logical, Date, Mathematical, and Other.
- `addWorkDays` and `addWorkHours` are visible in the Function tab but remain metadata-pending and not generation-safe.

## Serialization

For model-training samples, the assistant content must be a minified JSON string containing the expression array. For generated `.yap`/`.ywf` resources, keep the native shape expected by the target property: a JSON array when the export uses arrays, or a minified string only when the export-backed property stores it as a string.
