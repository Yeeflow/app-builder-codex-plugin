# Yeeflow parameter and save target rules

Use this reference when generating reusable Yeeflow custom code with expression-editor parameters, dynamic field references, variables, temp variables, or save/output targets.

## Parameter categories

Classify parameters before writing `inputParameters()`.

| Category | Typical Yeeflow type | Examples | Runtime handling |
| --- | --- | --- | --- |
| Plain text | `string` | label text, placeholder text, no-result text, helper copy | Trim to string with a default. |
| Expression editor | `variable` | `dataListId`, `displayField`, `valueField`, dynamic field/variable refs | Normalize from primitives, arrays, and expression objects. |
| Writable target | usually `variable` | `saveToField`, `outputField`, `resultTarget`, `newItemsField` | Resolve the configured target key separately from the current value. |
| Numeric config | usually `string` | `maxResults`, `pageSize`, `refreshSeconds` | Parse with safe fallback. |
| Boolean behavior | often `variable` | `multiSelect`, `allowManualEntry`, `showToolbar` | Normalize true/false from strings, numbers, booleans, arrays, and objects. |

## Expression editor values

Expression-editor and variable-picker parameters may arrive at runtime as:
- plain string
- number
- boolean
- array
- `{ value }`
- `{ label }`
- `{ key }`
- field binding object
- variable binding object
- temp variable binding object
- expression wrapper object
- the current value of the selected variable rather than the selected variable name

Do not rely on a single `String(context.params.someParam)` conversion. Use reusable helpers:
- `normalizeToString(value)`
- `normalizeToBoolean(value, fallback)`
- `normalizeToNumber(value, fallback)`
- `safeParseJson(value)`
- `resolveParameterValue(value)`

## Read/config parameter normalization

For normal read/config parameters, `value` is often the desired result.

Suggested precedence:
1. primitive string/number/boolean
2. array first item or joined values, depending on the template
3. object keys such as `value`, `Value`, `key`, `Key`, `id`, `Id`, `fieldId`, `FieldId`, `name`, `Name`, `label`, `Label`, `title`, `Title`
4. safe fallback

## Writable target resolution

Writable target parameters are different. They describe where to write, not what value to read.

For writable targets, prioritize target metadata before current value:
1. configured target captured by `requiredFields(params)` if available
2. `fieldId`, `FieldId`, `fieldName`, `FieldName`
3. `variableId`, `VariableId`, `variableName`, `VariableName`
4. `tempVariableId`, `TempVariableId`, `tempVariableName`, `TempVariableName`
5. `key`, `Key`, `id`, `Id`, `name`, `Name`, `code`, `Code`, `label`, `Label`
6. nested `target`, `binding`, `field`, `variable`, `tempVariable`, `data`, or `metadata`
7. plain string fallback only if it looks like a target key/name

Filter out candidates that are clearly values rather than targets:
- empty strings
- `[]`
- `{}`
- strings beginning with `[` or `{`
- JSON-like payloads containing `":` or `","`
- very long serialized strings

## requiredFields and target capture

When a writable target is selected from the Yeeflow variable dropdown, `context.params.targetParam` may evaluate to the current field/variable value at runtime. `requiredFields(params)` may still receive enough raw configuration to capture the field/temp-variable key.

Pattern:
1. In `requiredFields(params)`, collect writable target candidates from configured target parameters.
2. Return those configured target names where appropriate.
3. Store a target map on the application instance if the runtime preserves it.
4. In the React component, also use `fieldsValues` keys as an ordered fallback for configured output targets.

## Write methods

Do not assume every placement supports `context.setFieldValue` in the same way.

When a template supports forms and dashboards, try relevant setter paths defensively if exposed:
- `context.setFieldValue`
- `context.setFormFieldValue`
- `context.setValue`
- `context.setVariableValue`
- `context.setVariable`
- `context.setTempVariableValue`
- `context.setTempVariable`
- `context.setDashboardVariableValue`
- `context.setPageVariableValue`
- object-style setters such as `setFieldsValue`, `setVariables`, or `setTempVariables`

Check these methods on possible host objects:
- `context`
- `context.formContext`
- `context.pageContext`
- `context.dashboardContext`
- `context.variableContext`
- `context.variables`
- `context.tempVariables`
- `context.runtimeContext`

Use `fieldsValues[target] = value` only as a last fallback. It may update the local render context but should not be treated as guaranteed persistence.

## Dashboard temp variables

Dashboard temp variables may behave differently from approval form fields and data list form fields.

Important rules:
- Treat dashboard temp-variable output as a separate save path.
- Test saving separately from UI rendering.
- Expect selected temp-variable parameters to evaluate to the temp variable's current value.
- Recover the writable target key from configuration metadata, `requiredFields`, or defensively from `fieldsValues`.

## Smart Lookup Picker lessons

The first reusable template showed these concrete failure modes:
- Plain string parameters were too limited for reusable list ids, field ids, save fields, and booleans.
- Save targets chosen from the variable dropdown did not behave like manually typed strings.
- Dashboard temp-variable targets needed target-key resolution before writing.
- UI selection could work while save output remained empty, so save behavior needs its own tests.
- Search could return no visible options because row values were nested, differently cased, or stored under `fieldValue` / `dataValue` rather than direct keys.
