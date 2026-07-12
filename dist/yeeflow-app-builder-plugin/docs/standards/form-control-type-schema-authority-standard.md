# Form Control Type Schema Authority Standard

## Required rule

Generated form control type is determined in this order:

1. explicit App Plan control type;
2. exact field or variable schema type;
3. a schema-safe default such as `input`.

Display labels, business names, and variable IDs must not participate in control-type inference. Words such as `Status`, `Category`, `Type`, `Priority`, `Owner`, `Amount`, and `Date` are not schema declarations.

## Required examples

| Display label | Variable ID | Schema type | Planned control | Required result |
| --- | --- | --- | --- | --- |
| Workflow Proof Status | WorkflowProofStatus | Text | input | input |
| Status Notes | StatusNotes | Multiple line | textarea | textarea |
| Approval Status | ApprovalStatus | Choice | radio | radio with business choices |
| Effective Date | EffectiveDate | Date | datepicker | datepicker |

## Choice controls

`radio` and `select` are allowed only when the schema is choice-like or the App Plan explicitly selects a choice control supported by real business options. A generated choice control must contain non-placeholder options from the App Plan or schema.

## Shared generation

Standalone `.ywf` generation and full-application `.yapk` materialization must use `scripts/lib/form-control-type-authority.mjs` through the shared Approval Form builder. A separate name-based mapper is prohibited.

## Signing gates

The following findings are generated-final blockers:

- `TEXT_VARIABLE_MATERIALIZED_AS_CHOICE_CONTROL`
- `CHOICE_CONTROL_OPTIONS_MISSING`
- `CONTROL_TYPE_VARIABLE_TYPE_MISMATCH`

Run:

```bash
node scripts/test-approval-form-fields-template-gates.mjs
node scripts/validate-approval-form-fields-template.mjs --package <package.yapk> --plan <yeeflow-app-plan.md>
```

Runtime proof may confirm visible behavior, but it must not replace these schema and materialization gates.
