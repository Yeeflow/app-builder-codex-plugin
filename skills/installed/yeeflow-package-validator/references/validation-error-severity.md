# Validation Error Severity

Classify findings conservatively. When the consequence is unclear, block import until Yeeflow runtime evidence proves it safe.

## Blocking

Block import or runtime testing for:

- invalid package JSON or wrapper structure
- failed package graph validation
- failed workflow definition validation
- missing required app, list, form, dashboard, workflow, or resource definitions
- unresolved lookup targets
- duplicated app-wide `FieldID`
- field `ListID` mismatch with parent data list
- duplicate `FieldName`, `InternalName`, or `DisplayName` within one list when not proven safe
- corrupted prefixes or `pr<id>x` resource/name corruption
- unsafe `.yapk` mutation
- missing or invalid `FlowKey`
- workflow actions that reference missing variables, fields, lists, tasks, or expressions
- dashboard controls that only contain static KPI/chart mockups when a data-bound dashboard is required

## Warning

Warnings can allow runtime testing when documented:

- optional display metadata differences
- non-critical layout differences
- unused but harmless fields
- missing sample data
- conservative fallback controls documented as such
- custom code support limited to proven contexts

## Informational

Informational notes do not block:

- validator unavailable but replaced by a manual inspection
- package size observations
- documentation gaps
- runtime tests still pending

## Report Format

Use this structure:

```text
Validation result: passed / passed with warnings / blocked
Blocking:
- ...
Warnings:
- ...
Runtime import decision:
- safe / unsafe / pending
Evidence:
- command or inspection result
```
