# Examples Summary

This file summarizes proven examples without bundling bulky generated `.ywf` files.

## Simple PR Note Approval v6

Source reference in project:

- `simple-pr-note-approval-def.v6.json`

Proves:

- one-step approval
- structured request page
- structured approval page
- current user/current date defaults
- request action panel and workflow history
- approval workflowControlPanel and workflowHistory
- page registration/publish metadata
- workflow graph layout metadata
- ContentList parent persistence

## Simple PR Amount Approval

Source reference in project:

- `simple-pr-amount-approval-def.json`

Proves:

- two-step approval
- Applicant Line Manager pattern
- static position approver pattern
- ContentList persistence to PR Records
- final validation and wrapper build against Procurement metadata

## Simple PR Line Item Approval

Source references in project:

- `simple-pr-line-item-approval-def.v4-alpha-labels.json`
- `docs/generated-line-item-custom-code-row-label-pattern.md`

Proves:

- line-item list variable/listref/list control
- row subtotal calculation
- table total summary binding
- parent PR Records persistence
- child PR Details List persistence
- optional custom code control for row labels
- alphabetic row labels require text row field and readonly row control

## Employee Equipment Request

Source references in project:

- `employee-equipment-request-decomposition.md`
- `employee-equipment-request-def.draft.json`
- `employee-equipment-request-def.test-pr-mapped.json`
- `employee-equipment-request-test-mapping.md`

Proves:

- business requirement decomposition before generation
- draft mode with unresolved metadata placeholders
- explicit stop before wrapper build when metadata is missing
- sandbox-only mapping to existing PR Records / PR Details List when explicitly requested
- final validation and wrapper build after test mapping resolves placeholders

Do not treat sandbox mappings as production data models.

## Visitor Access Management v11 Approval Form

Source project references:

- `visitor-access-management-v11-approval-form-def.json`
- `docs/approval-form-and-yap-field-type-pattern-study.md`
- `docs/generated-yap-baseline-visitor-access-management-v5-fresh-compatible.md`

Proves generated app-level approval form support for:

- number variable + `input_number` control
- text variable + `radio` control
- dropdown style via `radio` + `attrs.displayStyle = "dropdown"`
- boolean variable + `switch` control
- conditional display on target control `attrs.control_display[]`
- readonly approval-page mirrors for persisted business fields
- `ContentList` mappings:
  - `VisitorEmail -> Text13`
  - `VisitorPhone -> Text14`
  - `NumberofVisitors -> Decimal1`
  - `AccessType -> Text15`
  - `RequiresEscort -> Bit1`

Known gaps:

- persisted conditional field
- multi-select choice
- user picker
- lookup inside a line-item table
