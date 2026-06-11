# Custom Code Control Decision Guide

This guide defines when Codex should use Yeeflow custom code controls in generated dashboards, approval forms, data-list custom forms, and public forms, and how to do it safely. The goal is to produce powerful, user-friendly experiences without adding custom code where native Yeeflow configuration is enough.

## 1. Purpose

Custom code controls are an advanced enhancement layer for Yeeflow pages and forms.

They can add client-side behavior that is difficult or impossible to express with standard form controls, control attributes, formulas, actions, workflow steps, lookup settings, or validation rules.

Custom code should not replace native Yeeflow configuration. Codex should use it only when standard Yeeflow capabilities are insufficient for the requirement.

## 2. Decision Hierarchy

Codex should evaluate requirements in this order:

| Layer | Use for |
| --- | --- |
| A. Standard form controls | Text input, number input, date picker, people picker, file upload, lookup, sub-list/table, rich text, workflow panel, history. |
| B. Control attrs / readonly / defaults / validation | Required fields, readonly fields, current user defaults, current date defaults, placeholders, simple validation, display options. |
| C. Calculated fields and list summaries | Row subtotal, total amount, simple arithmetic, sum/average/count summaries, cross-field calculations supported by Yeeflow formulas. |
| D. Lookup configuration and filters | Supplier selection, purchase category lookup, dependent lookup filtering, display fields, lookup value binding. |
| E. Form actions | Set variables, update form values, trigger supported client/form actions, call configured actions when the form changes or loads. |
| F. Workflow actions | Approval routing, set variable tasks, ContentList persistence, document generation, delay, server/workflow-side decisions. |
| G. AI actions | Draft summaries, approval suggestions, risk hints, generated details, extraction or classification where AI is explicitly useful. |
| H. Custom code control | Client-side interaction behavior that cannot be modeled safely with the layers above. |

Custom code is the last option, not the first tool.

## 3. When Custom Code Is Appropriate

| Requirement type | Example | Why custom code may be needed | Safer alternative if available |
| --- | --- | --- | --- |
| Auto row labels | Show `A`, `B`, `C` or custom row labels in a sub-list. | Native sub-lists may not auto-fill a row label field. | Use native row index display if Yeeflow supports it. |
| Complex row-level validation | Validate row fields using custom conditions not supported by rules. | Native validation may not inspect enough row context. | Native required rules, field validation, or workflow validation. |
| Cross-row validation | Warn when duplicate items are selected across line items. | Native rules may not compare all rows. | Lookup constraints, unique source data, or server-side validation. |
| Dynamic UI hints | Show contextual help based on amount, category, or row count. | Native hints may be static only. | Static help text or conditional visibility if available. |
| Client-side formatting | Format a value while the user types. | Native input masks may not support the format. | Built-in control formatting or field type configuration. |
| Unsupported conditional behavior | Change local UI behavior based on several fields and rows. | Native rules may not support the condition shape. | Conditional visibility/read-only rules if available. |
| Custom sub-list interaction | Renumber rows after add/delete/reorder. | The list state must be inspected client-side. | Native sub-list row numbering if available. |
| Advanced input normalization | Clean, normalize, or split user input before saving to fields. | Native controls may not normalize in the needed way. | Form actions or workflow SetVariableTask. |

## 4. When Custom Code Should Not Be Used

| Requirement | Use instead | Reason |
| --- | --- | --- |
| Required fields | Control validation / required attrs | Native validation is safer and clearer. |
| Readonly fields | Control readonly attrs | Native readonly behavior is inspectable and stable. |
| Current user/default date | Control default attrs | Tested patterns exist for `currentUser` and `currentDate`. |
| Simple formulas | Calculated fields | Native formulas are easier to validate and persist. |
| Row subtotal | List row calculation | Native calculation should own business math when possible. |
| Total amount | List summary / calculated total field | Totals affect approvals and persistence, so native formulas are preferred. |
| Approval routing | Workflow graph/gateways/tasks | Routing must be server/workflow-defined, not client-side. |
| Record persistence | ContentList workflow nodes | Persistence belongs in workflow actions. |
| Lookup selection | Lookup control configuration | Lookup source, filters, and display fields should be native. |
| Document generation | GenerateDocument workflow node | Documents depend on server resources and templates. |
| AI summary generation | AI action / workflow AI node | AI behavior should be explicit and auditable. |

## 5. Business Requirement Interpretation Rules

For each business requirement, Codex should classify it before choosing an implementation layer:

- data model
- form UI
- validation
- calculation
- lookup
- workflow routing
- persistence
- AI assistance
- custom client-side behavior

Only requirements classified as custom client-side behavior should be candidates for custom code.

If a requirement can be implemented as calculation, workflow routing, persistence, lookup, or validation, Codex should use the native Yeeflow model first.

## 6. Custom Code Risk Model

| Risk level | Examples | Rule |
| --- | --- | --- |
| Low risk | Display-only helpers, row labels, contextual UI hints. | Generally acceptable when native options are missing. |
| Medium risk | Input normalization, non-critical validations, dynamic visibility. | Use only with clear scope, defensive code, and sandbox testing. |
| High risk | Approval logic, financial calculations, persistence logic, security/permission logic, external API calls, overwriting critical business fields. | Do not implement with custom code unless explicitly approved and no native server/workflow alternative exists. |

High-risk logic should not be implemented with custom code by default.

## 7. Custom Code Control Structure

The learned Yeeflow custom code control structure is:

```json
{
  "type": "codein",
  "label": "Alphabetic row label automation",
  "displayLabel": true,
  "attrs": {
    "codein-script": "import * as React from 'react';\n\nexport class CodeInApplication implements CodeInComp { ... }",
    "codein-script-param": {
      "listId": "PurchaseDetailsList",
      "HTMLId": "splia_sublist_alpha_label",
      "snField": "No"
    }
  }
}
```

Key fields:

- `type: "codein"` identifies the custom code control.
- `attrs["codein-script"]` stores the source code or compiled code.
- `attrs["codein-script-param"]` stores control configuration.
- `listId` usually identifies a sub-list variable.
- `snField` identifies a target row field.
- `HTMLId` may be present for compatibility or DOM-targeted code, but not all new-style controls need it.

Placement:

- Put request-form automation controls on the request page only unless approval-page behavior is explicitly required.
- Do not run mutating code on readonly approval/task pages unless the requirement explicitly says so.

Old compiled code starts with a minified bundle such as:

```text
codeInModules=function(...)
```

New-style readable source code starts with:

```ts
import * as React from 'react';

export class CodeInApplication implements CodeInComp
```

Generated custom code should prefer new-style readable source.

Export-backed Smart Lookup Picker learning adds these placement-specific patterns:

| Context | JSON location | Output target prefix |
| --- | --- | --- |
| Dashboard page | `Item.Layouts[].LayoutInResources[0].Resource` | `__temp_` dashboard temp variables |
| Approval form | `Forms[].DefResource.pageurls[].formdef` | `__variables_` form/workflow variables |
| Data-list custom form | `Childs[].Layouts[].LayoutInResources[0].Resource` | `__list_` list fields |
| Public form | Not proven in the Smart Lookup Picker export | Requires focused proof |

The Smart Lookup Picker export stores script source directly in `attrs["codein-script"]` and parameters in `attrs["codein-script-param"]`. It does not prove a separate script library/resource ID pattern.

## 8. Custom Code Generation Rules

When Codex decides custom code is needed, it must:

- first describe why native Yeeflow options are insufficient
- generate the custom code separately before embedding it into a Def
- explain the Yeeflow APIs used
- define all parameters and defaults
- keep the behavior narrowly scoped
- avoid broad side effects
- avoid infinite update loops
- handle empty, null, and missing state safely
- avoid running on readonly approval pages unless intended
- preserve user-entered values unless explicitly modifying a target field
- keep generated code readable and editable
- include sandbox test cases

For code generation, use:

- `export class CodeInApplication implements CodeInComp`
- `description()`
- `inputParameters()`
- `requiredFields(params)`
- `render(context, fieldsValues, readonly)`
- `React.Component` for broad runtime compatibility

## 9. Validation Rules

Recommended validator checks:

- detect all `codein` controls
- verify referenced list variables exist
- verify target row fields exist
- check field type compatibility
- check readonly behavior when code auto-generates values
- warn when code modifies critical fields
- warn when custom code exists without a declared reason
- warn when custom code uses unknown APIs
- warn or fail when custom code includes external API calls
- warn when old compiled code appears in a generated new-style template
- fail final-mode validation if custom code references unresolved placeholders
- warn when a Custom Code control is missing a script reference or embedded script
- warn when required input parameters declared by the script are missing
- warn when parameter names are duplicated or not declared by the script
- warn when a public-form control uses list queries without explicit runtime proof

For sub-list row-label custom code:

- `listId` must resolve to a list variable.
- `snField` must resolve to a row field in the related listref.
- alphabetic labels require a text-compatible row field.
- generated row label controls should be readonly.

## 10. Output Requirements For Future Generated Forms

When Codex uses custom code, it should output:

A. Requirement being solved  
B. Why native Yeeflow configuration is insufficient  
C. Custom code design  
D. Code  
E. Parameters  
F. Def changes  
G. Validation report  
H. Test plan  
I. Risks and fallback

Codex should not hide custom code inside a generated `.ywf` without first explaining and validating it.

## 11. Examples

### Auto Row Number / Row Label

Custom code justified: yes, when Yeeflow does not provide native row numbering for the desired format.

Native alternative: built-in row index display, if available.

Recommended approach:

- Use a `codein` control on the request page.
- Read the sub-list rows from `fieldsValues[listId]`.
- Write only the configured row label field.
- Make the target row field readonly.
- Use `number` for numeric labels and `text` for alphabetic labels.

### Cross-Row Duplicate Item Warning

Custom code justified: sometimes.

Native alternative: lookup source constraints, unique item rules, or workflow validation if available.

Recommended approach:

- Use custom code only for a non-blocking or client-side warning unless blocking behavior is explicitly tested.
- Do not rely on client-side code as the only enforcement for critical procurement rules.

### Dynamic Help Text Based On Amount

Custom code justified: low risk if display-only.

Native alternative: static help text, conditional visibility, or AI-generated guidance if supported.

Recommended approach:

- Use a display-only `codein` control.
- Read the amount field.
- Render a small hint.
- Do not modify approval routing or financial values.

### Advanced Input Formatting

Custom code justified: sometimes.

Native alternative: native control formatting, masks, or validation rules.

Recommended approach:

- Normalize only the intended target field.
- Preserve the user's value where possible.
- Clearly document whether formatting happens during typing, on blur, or before submit.

## 12. Final Rules

- Prefer native Yeeflow features.
- Use custom code only for interaction behavior that cannot be modeled natively.
- Never put approval routing in custom code.
- Never put persistence logic in custom code.
- Avoid putting financial calculations in custom code unless explicitly approved.
- Always validate generated Def structure.
- Always test custom code in a sandbox.
- Always keep custom code readable and narrowly scoped.
