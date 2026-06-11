# Application Design Quality Gates

Use this reference before accepting a generated Yeeflow application package.

## Approval Form Layout Gate

Generated approval forms must follow the learned Yeeflow application design standard:

- page-level background on the page/form background only
- structural `Main` container
- `Content` container inside `Main`
- `Form body` container for business fields
- `Form bottom` container for workflow controls
- Action Panel and Flow History inside `Form bottom`
- Form header / request summary section
- two-column grid controls for normal fields
- full-row layout for textarea, upload, list/sublist, rich text, and long helper/guidance content
- learned Text control standard
- Text controls inline width by default
- meaningful `nv_label` for containers and controls

## Business Section Gate

The form should be organized around business operations, not only field order. Common sections:

- Request Summary
- Requester / Applicant Information
- Application Type
- Product / Service Selection
- Policy / Quota / Budget Check
- Attachments
- Remarks / Justification
- Review sections by role
- Form Bottom

## Validation Signals

Warn or fail readiness when:

- normal fields are direct children of section containers instead of grid controls
- Text controls are block-width by default without reason
- Action Panel or Flow History are outside Form bottom
- `Main` carries page background styling
- section containers lack meaningful `nv_label`
- generated form does not mirror submit/review task pages consistently
- applicant/profile snapshot fields are editable without a business reason
- an editable requester/applicant field changes applicant identity but has no field-change action to rerun profile snapshot and dependent quota/policy logic
- multi-product requirements are modeled as one top-level product lookup instead of a sublist/listref
- quota usage records lack a cycle field when the business cycle is employee anniversary or another non-calendar cycle
