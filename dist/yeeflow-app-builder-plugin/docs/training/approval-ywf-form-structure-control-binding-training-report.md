# Approval YWF Form Structure And Control Binding Training Report

## Scope

This training captures the failure mode found while generating the standalone `Employee Equipment Purchase Approval` `.ywf` file.

It applies to:

- standalone Approval form `.ywf` generation
- Approval form resources inside generated `.yapk` / `.yap` packages
- Approval workflow pages used by submission forms and task forms

## Source Evidence

Reference analysis:

```text
/Users/rengerhu/Documents/Plugin Test2/employee-equipment-purchase-approval-20260706-0.9.14-ywf/employee-equipment-purchase-approval-generation-analysis-report.md
```

Observed progression:

- v1 workflow graph opened, but Submission/Task forms stayed loading.
- v2 forms loaded, but the main content width rendered as approximately 6px.
- v3 fixed width by restoring export-style width/unit config.
- v4 later aligned the workflow line style to the new designer v2 rounded-line standard.

## Required Generation Rules

### 1. Form Pages Must Use The Current Approval Form Shell

Every generated Approval request/task page must use this structure:

```text
Main
└─ Content
   ├─ Form body
   └─ Form bottom
      ├─ workflowControlPanel
      └─ workflowHistory
```

For generated-final output, missing `Form body` or `Form bottom` is a hard error. `workflowControlPanel` and `workflowHistory` must be inside `Form bottom`.

### 2. Control Binding Must Be A String

Approval form controls must use string binding values:

```json
{ "binding": "EquipmentType" }
```

Do not generate object binding values such as:

```json
{ "binding": { "prefix": "__variables_", "value": "EquipmentType" } }
```

That object shape can leave the form designer loading indefinitely. Object wrappers may appear in known expression/operator contexts, but not in a control's top-level `binding`.

### 3. Date Controls Must Use `datepicker`

Generated Approval form date fields must use:

```json
{ "type": "datepicker" }
```

Do not use legacy:

```json
{ "type": "date" }
```

### 4. Width Values Must Keep Export-Style Pair Shape

The designer expects device/config pair values for fixed widths:

```json
{
  "common": {
    "positioning": {
      "widthtype": [null, "3"],
      "width": [null, 960],
      "widthu": [null, "px"]
    }
  }
}
```

Do not output numeric strings such as:

```json
{ "width": "960" }
```

Do not change correct pair-shaped width values merely to satisfy a validator preference. The runtime proof shows the pair shape is the designer-safe form.

### 5. Outcome Transitions Need Real `conditioninfo[]`

SequenceFlow names like `Approved`, `Rejected`, or `Completed` are not enough. Approval and completion task outgoing paths must include `properties.conditioninfo[]` rows with at least:

- `left`
- `op`
- `right`

The operator must be `s.=` for task outcome equality. The condition must reference task outcome context and one of:

- `Task outcome:Approved`
- `Task outcome:Rejected`
- `Task outcome:Completed`

Label-only condition objects are not publish-ready.

### 6. Designer IDs Must Stay Unique And Clean

Generated control IDs must be unique, stable, and free of accidental punctuation. A malformed ID is not always the primary loading blocker, but it is a designer hydration risk.

### 7. Job Position IDs Remain Live-Tenant Dependencies

Job Position assignees require real target-tenant Job Position IDs. The generator must not invent IDs, reuse sample export IDs, or silently replace a Job Position assignment with a Line Manager fallback.

If the ID cannot be proven from the target tenant, keep the mapping unresolved and let generated-final validation block publish/signing.

## Validator Updates

This training adds or strengthens these checks:

- `CONTROL_BINDING_NOT_STRING`
- `DATE_CONTROL_TYPE_LEGACY`
- `CONTROL_WIDTH_STRING_INVALID`
- `UI_STANDARD_FORM_BODY_MISSING`
- `UI_STANDARD_FORM_BOTTOM_MISSING`
- `UI_STANDARD_ACTION_PANEL_NOT_IN_FORM_BOTTOM`
- `UI_STANDARD_FLOW_HISTORY_NOT_IN_FORM_BOTTOM`
- `APPROVAL_CONDITION_SHAPE_INCOMPLETE`

Package validation mirrors the same concepts with `YAP_FORM_*` / `WORKFLOW_*` codes.

## Regression Test

Focused test:

```text
node scripts/test-approval-ywf-form-structure-gates.mjs
```

It verifies:

- valid export-shaped Approval form workflow passes
- object `binding` fails
- legacy `date` control fails
- numeric string width fails
- missing `Form body` fails
- label-only task outcome condition fails

## Proof Boundary

This training proves generation and validator shape behavior. Runtime routing for Job Position assignees still requires target-tenant Job Position lookup and observed task owner proof.
