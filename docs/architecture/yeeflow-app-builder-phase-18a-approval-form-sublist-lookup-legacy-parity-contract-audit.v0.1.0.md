# Phase 18A Approval Form Sublist Lookup Legacy Parity Contract Audit

`APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_BOUNDARIES_AUDITED`

`APPROVAL_FORM_SUBLIST_LOOKUP_PARITY_MATRIX_VALID`

`APPROVAL_FORM_SUBLIST_LOOKUP_PARITY_REGRESSIONS_PASSED`

`APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_PARITY_UNAVAILABLE`

## Decision

No future Core migration candidate is selected. The Approval Form export is authoritative for static configuration, but current Legacy materialization cannot reproduce all required Lookup target/display metadata. A preservation change would be a product-behavior enhancement rather than a parity-preserving Core migration.

## Exact Outcomes

| Export key | Outcome | Legacy output path | Loss point |
| --- | --- | --- | --- |
| `listid` | intentionally_discarded_before_materialization | none | Approval row normalization omits rowField.value and control attrs target metadata. |
| `appid` | intentionally_discarded_before_materialization | none | Approval row normalization omits rowField.value and control attrs target metadata. |
| `listsetid` | intentionally_discarded_before_materialization | none | Approval row normalization omits rowField.value and control attrs target metadata. |
| `listfield` | present_only_in_imported_exported_product_data_not_reproducible | none | No plan parser or lowerer representation. |

The export has 2 distinct Submission Form embedded Lookup columns. The lowerer probe supplies a valid lookup row with lossless target values and confirms that generated `list-fields` metadata contains none of the four required keys. No equivalent representation exists in output, Rules, opaque metadata, variables, serialization, or package output.

Approval Form is an independent product model. No Data List source, contract, adapter, identifier, fixture, or routing proof was used. Static export evidence does not prove lookup runtime behavior, selection, retrieval, validation, writeback, template/resource mutation, workflow execution, or package behavior.

## Boundary

No boundary selected. Runtime lookup resolution, selection, retrieval, validation, writeback, template/resource mutation, package output, and workflow execution remain out of scope.
