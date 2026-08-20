# Yeeflow App Builder Plugin v1.12.9

## Lookup Direct-Write Closure

- Add a fail-closed validator for direct MCP Data List Lookup writes. It requires structured target `ListDataID` resolution, target-list identity validation, and persisted readback closure.
- Reject raw display-title/code values, target-list mismatches, unresolved target records, missing readback, and persisted values that do not equal the resolved target ID.
- Add synthetic three-lookup regression coverage for management-action-plan style record writes.
- Strengthen Data List operator guidance to stop when target-row readback cannot be obtained and to report API acceptance, persisted readback, reference resolution, and browser runtime as distinct evidence levels.

## Proof Boundary

This release validates supplied redacted resolution/readback evidence locally. It does not claim a live tenant data repair or browser runtime proof.
