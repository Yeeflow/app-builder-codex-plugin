# Phase 18B Approval Form Sublist Lookup Configuration Preservation

`APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_PRESERVATION_PASSED`

`APPROVAL_FORM_SUBLIST_LOOKUP_SOURCE_PARITY_PASSED`

`APPROVAL_FORM_SUBLIST_LOOKUP_ARCHIVE_PARITY_PASSED`

`APPROVAL_FORM_SUBLIST_LOOKUP_INSTALLED_PARITY_PASSED`

`APPROVAL_FORM_SUBLIST_LOOKUP_MATERIALIZER_CONFIGURATION_PARITY_PASSED`

`APPROVAL_FORM_SUBLIST_LOOKUP_DETERMINISM_PASSED`

`APPROVAL_FORM_SUBLIST_LOOKUP_NEGATIVE_GATES_PASSED`

`APPROVAL_FORM_SUBLIST_LOOKUP_LEGACY_ROLLBACK_PASSED`

## Outcome

This authorized Approval Form-only product enhancement preserves the four static Lookup target/display configuration keys from the golden Submission Form shape: `listid`, `appid`, `listsetid`, and `listfield`. The two golden columns retain their exact 19-digit target identifiers as strings. The parser sends explicit configuration to the Approval Form lowerer, which emits a fresh static `list-fields` Lookup column.

No Data List evidence or route is reused. This adds no Core or Local Runtime API, adapter, artifact, or distributed Core contract. It does not claim frontend/runtime lookup behavior: selection events, target retrieval, automatic assignment, clear/edit behavior, validation timing, read-only enforcement timing, runtime expressions, writeback, workflow execution, and package runtime semantics remain product-owned and unproven here.

## Historical Evidence

Phase 18A remains intact as evidence that the old Legacy path discarded the same metadata. Its parity-unavailable blocker is superseded only because this separately authorized product-behavior enhancement now preserves the export-proven static configuration.

## Evidence

The versioned fixture contains 2 independently decoded golden Submission Form Lookup columns. The routing test covers direct lowerer source/official temporary ZIP/simulated installed surfaces, actual source/archive/installed materializer invocation, strict string-only identity validation, deterministic output, non-Lookup backwards compatibility, and a temporary-copy rollback that removes only this preservation bridge.
