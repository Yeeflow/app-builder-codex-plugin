---
name: yeeflow-custom-code-generator
description: generate, update, debug, document, and redesign yeeflow custom code for forms, tables, dashboards, editors, and data-driven components. use when the user wants full yeeflow custom code from requirements, needs existing yeeflow code modified, wants broken yeeflow custom code debugged, wants a user guide generated from existing yeeflow custom code, or wants yeeflow ui/ux improvements aligned to the yeeflow design system. support chatgpt and codex workflows. default to returning a full yeeflow custom code file for code-generation requests, guide-only for documentation-from-code requests, and patch/diff style output when explicitly requested.
---

# Yeeflow Custom Code Generator

## Overview

Generate Yeeflow custom code and customer-facing documentation that match the runtime structure, coding conventions, data-access patterns, and UI quality shown in the user's working examples. Default to producing a full ready-to-paste Yeeflow code file for code-generation requests. When the user provides existing code and asks what it does, how to use it, or to document it, switch to guide-only documentation-from-code mode. When the user asks to use an existing custom code script inside a Yeeflow application, switch to app-placement mode and produce the Custom Code control configuration, parameter wiring, validation notes, and runtime test plan instead of rewriting the script. When the user explicitly asks for a patch, diff, or changed sections only, switch output mode accordingly.

## Workflow

1. Classify the request:
   - **new build**: create a brand new Yeeflow custom code file.
   - **modify existing**: update the user's current code while preserving working logic.
   - **debug**: identify likely root cause, then return corrected Yeeflow code.
   - **ui/ux redesign**: improve the current component while preserving business logic.
   - **document existing code / code-to-guide**: inspect an existing Yeeflow custom code file and generate a user guide.
   - **use existing script in app**: inspect an existing `.tsx` script and generate or validate a Yeeflow Custom Code control placement in a dashboard, approval form, data-list custom form, or public form.
2. Extract Yeeflow-specific inputs:
   - input parameters
   - parameter categories and parameter types
   - required fields
   - current form field names
   - list ids
   - field ids
   - save/load behavior
   - refresh behavior
   - output mode (full file vs diff)
   - documentation mode (guide-only, code + guide, or code-only)
3. Choose the component pattern:
   - simple configurable component
   - data table / operational form component
   - analytics dashboard
   - rich editor / interaction-heavy component
4. Build using the Yeeflow runtime conventions in the references.
5. If the request includes UI work, apply the Yeeflow UI references before finalizing.
6. For reusable templates, create the template folder, code file, user guide, and optional example configuration note.
7. Return the requested output mode:
   - **new reusable template**: code + guide by default
   - **new code only / explicit code-only**: code-only
   - **existing code documentation**: guide-only by default
   - **use existing script in app**: control placement/configuration guidance plus validation/test plan; do not change the script unless requested
   - **if explicitly asked**: diff, patch, or changed sections only

## Two supported modes

### A. Generate custom code script

Given a custom code requirement:

- generate a complete `.tsx` file using `export class CodeInApplication implements CodeInComp`
- define `inputParameters()` with practical ids, Yeeflow parameter types, and descriptions
- document required inputs, optional inputs, default behavior, supported placements, and runtime assumptions
- explain any data source, lookup, save target, or writable output behavior
- include a setup guide and test checklist when building a reusable template

### B. Use existing custom code script in a Yeeflow app

Given an existing script such as `smart-lookup-picker.tsx`:

- inspect `description()`, `requiredFields(params)`, `inputParameters()`, and `render(...)`
- identify required parameters, optional parameters, parameter types, output/writeback behavior, Yeeflow APIs, and safe placements
- add a Yeeflow Custom Code control with `type: "codein"` in the target page/form JSON
- embed or reference the script using the export-backed pattern available for the target app; current export-backed `.yap` evidence stores the source in `attrs["codein-script"]`
- configure parameters under `attrs["codein-script-param"]` using the script's parameter ids
- use expression-token wrappers for expression/static-variable style config values when the export pattern uses them
- use `{ "type": 1, "value": { "prefix": "__variables_" | "__list_" | "__temp_", "value": "<target>" } }` for field, approval variable, list field, or dashboard temp-variable writable targets when that pattern is export-backed
- validate that required parameters are present, parameter names are unique, target fields/variables/temp variables exist, and the script is safe for the target context
- validate app materialization before component runtime testing; if the imported app opens as an empty shell or data lists have no custom fields, fix `.yap` materialization first instead of debugging the custom code script
- document fallback behavior and runtime test steps; do not claim runtime support until import/open/interaction/save behavior is observed

Export-backed Smart Lookup Picker placement pattern:

- dashboard page: `Item.Layouts[].LayoutInResources[0].Resource` contains a `codein` control; dashboard output targets use `__temp_` temp variables
- approval form: `Forms[].DefResource.pageurls[].formdef` contains a `codein` control; output targets use `__variables_` workflow/form variables
- data-list custom form: `Childs[].Layouts[].LayoutInResources[0].Resource` contains a `codein` control; output targets use `__list_` data-list fields
- public form: not proven by the Smart Lookup Picker demo export; require a focused export/runtime proof before promoting public-form use

## Core rules

- Default to `export class CodeInApplication implements CodeInComp`.
- Include `description()`, `requiredFields(...)`, `inputParameters()`, and `render(...)`.
- Read input parameters from `context.params`.
- Pass parameters into a React class component. Prefer `React.Component` for broad Yeeflow runtime compatibility.
- Prefer Yeeflow-compatible class components over unrelated standalone React app patterns.
- Use `fieldsValues` and `context.getFieldValue(...)` for current form values.
- Use `context.modules.yeeSDKClient` for list queries and mutations.
- Inline `<style>` blocks are acceptable and often preferred for self-contained deliverables, but keep CSS inside plain quoted string arrays or otherwise safely escaped strings.
- Keep safe fallback behavior when parameters or query inputs are missing. Do not crash.
- Classify input parameters before choosing their Yeeflow parameter type. Do not assume most parameters should be plain strings.
- When expression-editor parameters are used, normalize runtime values defensively before using them.
- Treat save/output target parameters as writable targets, not ordinary read-only values.
- When documenting existing code, inspect actual code behavior and clearly separate observed behavior from inferred usage or assumptions.
- Use full code file output unless the user clearly requests patch/diff mode.
- When debugging, explain the root cause briefly, then return corrected code.

## Parameter type classification rules

Before writing `inputParameters()`, classify each parameter by how it will be used at runtime.

### Plain text parameters
Use `type: 'string'` for static copy such as label text, placeholder text, no-result text, static titles, helper copy, and button text that does not need variables.

### Expression editor parameters
Use `type: 'variable'` when the parameter may come from a form field, variable, temp variable, complex variable, or dynamic expression. Common examples include `dataListId`, `displayField`, `valueField`, dynamic field references, dynamic variable references, dashboard temp variable references, and dynamic booleans such as `multiSelect`, `allowManualEntry`, `showToolbar`, or `enableAutoRefresh`.

Expression-editor parameters can return runtime values in different shapes: plain string, number, boolean, array, `{ value }`, `{ label }`, `{ key }`, variable binding metadata, temp-variable metadata, or expression wrapper objects. Generated code should include helpers such as `normalizeToString`, `normalizeToBoolean`, `normalizeToNumber`, and `resolveParameterValue` when these parameters are used.

### Save target / writable target parameters
Parameters such as `saveToField`, `selectedItemsField`, `newItemsField`, `outputField`, `resultTarget`, and `variableTarget` are special. They identify where to write, so do not treat them like normal input values.

For writable targets:
- Prefer expression-editor parameter type when users need to pick fields, variables, or temp variables.
- Resolve the configured target name/key separately from the current runtime value.
- Expect dropdown-selected variables to produce a different runtime shape than manually typed text.
- Use `requiredFields(params)` when useful to capture configured field/temp-variable names before `context.params` evaluates to the variable's current value.
- Build a target candidate list from keys such as `fieldId`, `fieldName`, `variableId`, `variableName`, `tempVariableId`, `tempVariableName`, `key`, `id`, `name`, `label`, and nested `binding` / `target` / `variable` / `tempVariable` objects.
- Filter out obvious values such as `[]`, `{}`, JSON payload strings, or long serialized objects before using a candidate as a write target.

### Numeric config parameters
Use `type: 'string'` unless the template explicitly needs dynamic numeric expressions. Normalize with a safe integer/number helper and a default. Examples include `maxResults`, `refreshSeconds`, `pageSize`, and `minSearchLength`.

### Boolean behavior parameters
Use `type: 'variable'` when the value may be dynamic. Normalize booleans from `true`, `false`, `1`, `0`, `yes`, `no`, `on`, `off`, and object/array expression values. Examples include `multiSelect`, `allowManualEntry`, `showToolbar`, and `enableAutoRefresh`.

## Expression parameter runtime rules

When a parameter uses Yeeflow's expression editor / variable picker:
- Never assume the runtime value is the same shape as the configuration UI value.
- Normalize primitives, arrays, and objects recursively where useful.
- Prefer explicit helper methods over one-off `String(value)` calls.
- Keep object key precedence intentional. For normal read/config parameters, `value` may be the desired expression result. For writable target parameters, target metadata keys such as `fieldId`, `variableName`, `tempVariableName`, `key`, or `name` may be more important than `value`.
- Log raw and normalized parameter values only as temporary debug diagnostics, and mark those logs clearly for removal.

Useful helpers to include when relevant:
- `normalizeToString(value)`
- `normalizeToBoolean(value, fallback)`
- `normalizeToNumber(value, fallback)`
- `resolveParameterValue(value)`
- `resolveWritableTarget(paramName, rawValue, props/context)`
- `safeParseJson(value)`
- `dedupeSelectedItems(items)`

## Writable target and save behavior rules

When generated code writes values back to Yeeflow:
- Distinguish read/config parameters from write/save target parameters.
- Resolve the actual writable target name/key before calling any setter.
- Support form fields, data list form fields, dashboard variables, and dashboard temp variables when the template claims those placements.
- Do not blindly assume `context.setFieldValue(target, value)` works for every placement.
- Try relevant setter paths defensively when needed, such as `setFieldValue`, `setFormFieldValue`, `setValue`, `setVariableValue`, `setTempVariableValue`, `setTempVariable`, `setDashboardVariableValue`, `setPageVariableValue`, and object-style setters if exposed by the runtime.
- Preserve a safe `fieldsValues[target] = value` fallback only as a last resort and do not present it as proof that Yeeflow persisted the value.
- Keep save logic synchronized with state changes after add/remove/edit operations.

Dashboard temp variables deserve extra care. They may not behave like approval form fields or data list form fields, and selected dropdown variables may evaluate to the current temp-variable value instead of the temp-variable key. For dashboard templates, research or defensively implement target resolution and test save behavior separately from UI rendering.

## Yeeflow runtime compatibility rules

Yeeflow custom code may run on an older React/runtime/compiler than a normal local app. When generating reusable customer-facing controls:

- Prefer `React.Component` over `React.PureComponent`.
- Do not use `React.createRef()`. Use callback refs such as `ref={(node) => { this.wrapperRef = node; }}`.
- Avoid hooks, `forwardRef`, `memo`, and other modern React-only APIs unless an existing working example in the same Yeeflow environment already uses them.
- Avoid raw multiline CSS template literals when possible. Some Yeeflow resolvers can misread pasted CSS as script and throw errors such as `Missing semicolon` on CSS lines like `border-radius: 999px;`.
- For self-contained styles, use a safely quoted string array and join it, for example `const styles = ['.class{...}', '.child{...}'].join('');`.
- Make sure the pasted file starts with the import/export code and includes `export class CodeInApplication implements CodeInComp`; if only a CSS or component fragment is pasted, Yeeflow may report `No exports found`.

## Yeeflow list query rules

When using `context.modules.yeeSDKClient.lists.queryItems(...)`:

- Build query payloads defensively with common aliases when practical: `listId` and `dataListId`; `fields`, `fieldIds`, and/or `selectedFields`; `pageIndex`, `pageNo`, and `pageSize`.
- Request only needed fields, but always include useful identity fields such as `ListDataID` when saving selected records.
- Do not assume the first filter shape works in every tenant. If a filtered query with `contains` returns zero options, consider a limited broad fallback query and perform local matching on the configured display field.
- Treat an empty filtered result as potentially a filter-shape issue, not proof that there are no records.
- Read returned field values from multiple common row shapes: direct `row[fieldId]`, `row.values[fieldId]`, `row.Values[fieldId]`, `row.fields[fieldId]`, `row.Fields[fieldId]`, and array-style `fieldValues` / `FieldValues`.
- Normalize cell values that may be primitives, arrays, or objects with keys like `value`, `Value`, `fieldValue`, `FieldValue`, `dataValue`, `DataValue`, `valueText`, `ValueText`, `text`, `Text`, `display`, `Display`, `name`, `Name`, `title`, or `Title`.
- Match returned field ids/names defensively, including case-insensitive keys and common variants such as `FieldID`, `fieldCode`, `FieldCode`, and `ListDataId`.
- For lookup controls, make the display field and value field explicit. A common configuration is `displayField = Title` and `valueField = ListDataID`, unless the app has a better stable business ID/code field.

## Reusable template workflow

When the user asks for a reusable customer-facing Yeeflow custom code template, generate project artifacts, not only pasted code:

```text
templates/
  <template-folder-name>/
    <template-code-file>.tsx
    <template-name>-user-guide.md
    <optional-example-config>.md
```

The user guide should be practical and customer/delivery-team friendly. Include the template name, short description, purpose and business scenarios, supported placement, when to use it, input parameter overview table, detailed parameter explanation, step-by-step setup guide, expected output/save behavior, real business examples, notes/assumptions/limitations, testing checklist, and troubleshooting.

Keep all deliverables for a template in the same dedicated folder.

## Code-to-guide workflow

Use **code-to-guide** mode when the user provides an existing Yeeflow custom code file and asks what it does, how to use it, to create documentation, to generate a user guide, or to document a legacy/customer-delivered/custom-code template.

In this mode:
1. Inspect the existing code before writing the guide.
2. Identify the template/control name from `description()`, class/component names, visible labels, filenames, or UI text.
3. Infer the business purpose from UI, parameters, data access, save behavior, and rendered output.
4. Identify supported placement when possible: approval form, data list form, dashboard page, or unknown/unclear.
5. Inspect `inputParameters()` carefully and document each parameter.
6. Inspect `requiredFields(params)` and explain required current-form fields or target capture behavior.
7. Inspect read behavior using `fieldsValues`, `context.getFieldValue`, `context.params`, and expression-editor normalization.
8. Inspect save/output behavior, including field writes, variable/temp-variable writes, emitted callbacks, or display-only behavior.
9. Inspect list/API behavior such as `yeeSDKClient.lists.queryItems(...)`.
10. Inspect UI behavior, interactions, readonly handling, empty states, loading states, errors, and assumptions.
11. Generate a complete user guide document.

Do not invent unsupported behavior. Clearly distinguish:
- **Observed in code**: behavior directly visible in the file.
- **Inferred likely usage**: reasonable interpretation from naming and UI.
- **Assumptions / needs confirmation**: unclear runtime behavior, missing context, or tenant-specific APIs.
- For app-placement work, also distinguish export-backed JSON patterns from runtime-proof claims. A decoded `.yap` can prove where the control and parameters are stored, but it does not prove render/search/save behavior unless the app was imported and exercised.

The generated guide should include:
1. Template/control name
2. Short description
3. Purpose / what this custom code is for
4. Supported placement
5. When to use
6. Input parameter table
7. Detailed explanation of each parameter
8. Step-by-step configuration guide
9. Result / expected output
10. Real business examples
11. Notes / assumptions / limitations
12. Testing checklist
13. Troubleshooting

For reusable template projects, save the generated guide next to the code when asked or when working directly in project files:

```text
templates/<template-name>/<template-name>-user-guide.md
```

## Output mode rules

### Code-only mode
Use this when the user asks to create code, update code, fix code, redesign code, or explicitly asks for code only.

Structure the answer as:
1. short assumptions only if necessary
2. one complete Yeeflow code file in a single code block

### Code + guide mode
Use this by default for new reusable template generation. Create the template code file and user guide document in the template folder unless the user explicitly asks for code-only.

### Guide-only mode
Use this by default when the user provides existing code and asks for documentation, a user guide, setup instructions, or “what does this custom code do?” Return or save the guide without rewriting the code unless the user also asks for code changes.

### Diff / patch mode
Use this only when the user explicitly asks for:
- exact code changes
- changed sections only
- diff
- patch
- replacement blocks only

When using diff mode:
- preserve the existing file structure
- show only the changed sections
- make replacement boundaries obvious

## New build pattern
When creating new Yeeflow custom code from requirements:
1. infer the component type from the request.
2. classify parameters as plain text, expression editor, writable target, numeric config, or boolean behavior.
3. choose `inputParameters()` types based on that classification.
4. define `requiredFields(...)` only for current-form dependencies and configured writable targets that must be captured before runtime evaluation.
5. add normalization and writable-target helpers when expression or save-target parameters exist.
6. build a self-contained Yeeflow component file.
7. include helper methods inside the main React class when that keeps the file simpler.
8. keep naming practical and readable.

If requirements are incomplete, make reasonable assumptions and state them briefly before the code. Do not stall unless a missing detail makes the output impossible.

## Modify existing code pattern
When the user provides existing Yeeflow custom code:
1. preserve the existing `CodeInApplication` structure unless the current code is broken.
2. preserve working list ids, field ids, and state flow unless the user wants them changed.
3. prefer targeted updates over unnecessary rewrites.
4. preserve the user's naming where possible.
5. if the user asks for full code, return the full merged file.
6. if the user asks for exact changes only, return changed blocks only.

## Document existing code pattern
When the user provides existing Yeeflow custom code and asks for a guide or explanation:
1. switch to guide-only mode unless they also request code edits.
2. read the whole code file or relevant sections before documenting.
3. extract `description()`, `inputParameters()`, `requiredFields()`, `render(...)`, data queries, save/output methods, and UI interactions.
4. classify parameters using the same parameter rules used for code generation.
5. describe only supported behavior; label uncertain details as inferred or assumptions.
6. produce a user guide using the standard guide sections.
7. if working in a reusable template folder, save the guide as `<template-name>-user-guide.md` next to the code.

## Debug pattern
When the user says code is broken or behavior is wrong:
1. inspect the likely failure point.
2. check Yeeflow-specific causes first:
   - wrong field id vs display name
   - expression-editor parameter evaluated to a runtime value instead of the configured target key
   - save target parameter treated as a plain string instead of a writable target
   - dashboard temp variable requiring a different setter path than form fields
   - wrong list id
   - wrong payload shape
   - filtered `queryItems` returns empty because the filter operator shape is unsupported
   - rows returned in nested `values`, `Fields`, `FieldValues`, or differently-cased field keys instead of direct `row[fieldId]`
   - missing required field
   - unsupported modern React API such as `React.createRef()` in the Yeeflow runtime
   - raw multiline CSS being parsed as script by the pasted-code resolver
   - wrong date parsing or query filter
   - UI style overridden by more specific CSS
   - state refresh not triggered
3. state the likely root cause briefly.
4. return corrected code.
5. if useful, add minimal targeted logs for verification.

Do not spend the whole response on theory. Move to corrected code quickly.

## Dashboard pattern
For analytics dashboards, it is acceptable to use `antd` components such as:
- `Card`
- `Row`
- `Col`
- `Table`
- `Tag`
- `Progress`
- `Spin`
- `Alert`

Dashboard guidance:
- load data in `componentDidMount()`.
- query lists via paginated helpers around `yeeSDKClient.lists.queryItems(...)`.
- normalize and aggregate data with reusable helper methods.
- treat dashboard variables and temp variables as different from form fields for save/output behavior.
- resolve dashboard temp-variable write targets defensively instead of assuming `context.setFieldValue()` is enough.
- prefer KPI cards, chart panels, trend sections, and detail tables.
- when charts are requested, keep them readable and restrained.
- preserve Yeeflow’s calm, structured analytics style.

## UI and design rule
For any Yeeflow UI, dashboard, form, table, portal, or editor task:
- read `references/yeeflow-uiux-guidelines.md`
- read `references/yeeflow-product-ui-checklist.md`
- apply the Yeeflow design principles there

Keep output:
- modern
- calm
- structured
- trustworthy
- polished
- enterprise-ready

Avoid:
- heavy shadows
- loud gradients
- decorative noise
- overly futuristic styling
- cluttered card layouts
- generic demo-style UI

## References

- Yeeflow custom code structure: `references/yeeflow-custom-code-standard.md`
- Yeeflow data and dashboard patterns: `references/yeeflow-data-and-dashboard-patterns.md`
- Yeeflow parameter and save target rules: `references/yeeflow-parameter-and-save-target-rules.md`
- Yeeflow code-to-guide rules: `references/yeeflow-code-to-guide-rules.md`
- Yeeflow UI/UX guidelines: `references/yeeflow-uiux-guidelines.md`
- Yeeflow product UI checklist: `references/yeeflow-product-ui-checklist.md`
- Output mode guidance: `references/output-modes.md`

## Practical examples

### Example 1: new build
User request: “Create a Yeeflow custom code component that shows every day of the selected month as rows, with configurable list and field mapping.”

Do:
- define input parameters for year/month field names and field ids
- classify field references as expression-editor parameters when they may be dynamic
- implement `requiredFields(...)`
- use `yeeSDKClient.lists.queryItems(...)`
- return the full Yeeflow code file

### Example 2: modify existing code
User request: “Here is the current custom code. Please add a footer total row and keep all other logic unchanged.”

Do:
- preserve existing structure
- add only the required footer calculations and render logic
- return full file by default unless the user asks for changed sections only

### Example 3: debug
User request: “The query always returns 0 and the row text color is not changing.”

Do:
- check field id mapping, filter payload shape, date matching, and CSS specificity
- state the likely cause briefly
- return corrected Yeeflow code

### Example 4: reusable lookup template with save outputs
User request: “Build a reusable lookup picker that saves selected values and manual entries.”

Do:
- classify list id, display field, value field, save targets, and dynamic booleans as expression-editor parameters
- classify placeholder/label/no-result text as plain string parameters
- treat save target parameters as writable targets and resolve them before writing
- support dashboard temp variables and form/list fields defensively
- include normalization helpers, JSON parsing, dedupe, and separate save outputs
- generate `templates/<name>/<code>.tsx` and `<name>-user-guide.md` when reusable template workflow is requested

### Example 5: generate guide from existing code
User request: “Here is an existing Yeeflow custom code file. Please create a user guide for it.”

Do:
- use code-to-guide / document-existing-code mode
- inspect `description()`, `inputParameters()`, `requiredFields()`, save/output behavior, data queries, UI behavior, and readonly/empty/error states
- generate guide-only by default
- save `<template-name>-user-guide.md` next to the code when working in a reusable template project
- avoid inventing unsupported behavior; mark inferred usage and assumptions clearly

## Lessons learned from Smart Lookup Picker

- Parameter type choice directly affects runtime behavior.
- Some parameters that look like strings in the designer should be expression editor parameters for reusable templates.
- Save target parameters need special runtime handling; they are not ordinary config values.
- Selecting a variable from the dropdown can produce a different runtime value shape than manually typing a string.
- Dashboard temp variables can evaluate to their current value while the writable key must be recovered from configuration or `requiredFields`.
- Value save behavior must be tested separately from UI behavior.
- Search/list behavior must handle multiple `queryItems` signatures, empty filtered results, broad fallback queries, nested row shapes, and field-key casing differences.
