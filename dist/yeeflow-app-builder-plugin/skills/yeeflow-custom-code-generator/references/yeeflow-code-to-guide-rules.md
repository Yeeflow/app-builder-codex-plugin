# Yeeflow code-to-guide rules

Use this reference when the user provides an existing Yeeflow custom code file and asks for documentation, setup guidance, a user guide, or an explanation of how to use it.

## Trigger phrases

Use code-to-guide mode for requests like:
- generate a user guide from this code
- document this existing custom code
- explain how to configure this custom code
- what does this Yeeflow custom code do?
- create documentation for this legacy/custom/customer-delivered template
- add a guide for an existing template

Default output is guide-only unless the user also asks for code changes.

## What to inspect

Inspect these code areas before writing the guide:
- `description()` for template/control name and intended purpose
- `inputParameters()` for configurable parameters, parameter ids, types, and descriptions
- `requiredFields(params)` for current-form dependencies and writable target capture
- `render(context, fieldsValues, readonly)` for placement, props, readonly behavior, and component structure
- reads from `context.params`, `fieldsValues`, and `context.getFieldValue`
- writes through `context.setFieldValue`, variable/temp-variable setters, object setters, or `fieldsValues` fallback
- data queries through `context.modules.yeeSDKClient`, especially `lists.queryItems(...)`
- helper methods for normalization, parsing, formatting, dedupe, validation, and target resolution
- rendered UI, labels, empty/loading/error states, keyboard or mouse interactions, and responsive behavior

## What to extract

For each guide, extract:
- template/control name
- short business-friendly description
- purpose and business problem solved
- supported placement if observable or inferable
- input parameters with type, required/optional status, purpose, and examples
- required fields and why they are required
- save/output behavior, including exact output formats where visible
- data source/query behavior
- UI behavior and interactions
- assumptions and limitations
- testing checklist
- troubleshooting notes

## Evidence discipline

Do not invent unsupported features. Separate:
- **Observed in code**: directly visible in the code.
- **Inferred likely usage**: likely based on naming, UI, or behavior.
- **Assumptions / needs confirmation**: unclear tenant-specific behavior, missing context, or behavior that depends on Yeeflow runtime APIs.

If placement is not clear, say `Not explicit in code` and then list likely placement based on code behavior.

If a parameter description is vague or missing, infer from usage but mark it as inferred.

If save behavior is display-only, say clearly that the code does not appear to save values.

## Guide structure

Use this guide structure unless the user requests a different format:

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

## Parameter table guidance

Include columns:
- parameter name
- type
- required or optional
- purpose
- example value

Classify parameters using the same parameter categories used for code generation:
- plain text
- expression editor
- writable target
- numeric config
- boolean behavior

For expression-editor parameters, explain that values may come from variables, temp variables, form fields, complex variables, or expressions when the code supports that.

For writable targets, explain target resolution and save behavior only if it is visible in the code. Do not claim dashboard temp-variable support unless the code implements or clearly intends it.

## Saving guides in reusable template projects

When working in a project folder and the user asks to create the guide file, save it next to the code:

```text
templates/<template-folder>/<template-name>-user-guide.md
```

If the code file is outside `templates/`, choose a nearby Markdown filename such as:

```text
<custom-code-file-name-without-extension>-user-guide.md
```

Do not modify the code unless the user explicitly asks for code changes.
