# Yeeflow App Builder v1.6.1

## Summary

This candidate fixes the incremental MCP FormNewReport incident in which a report could carry Approval Form mappings but submit an empty Type `32` child `Fields[]` collection. The platform rejected that payload with a non-specific system error.

## FormNewReport Physical Field Contract

- `Model.Settings.Fields[]` is the approval-variable mapping layer, not the physical report-field layer.
- The matching Type `32` child must contain one MCP-issued physical field for every mapping before save.
- Physical fields must use a live-contract-valid native storage slot with a positive index. The incident-proven accepted families are `TextN`, `DecimalN`, and `DatetimeN`; `Text0` and approval mapping keys such as `v_requestTitle` are rejected as physical field names.
- The default Type `0` view must reference the physical issued `FieldID` and native `FieldName`, not the approval variable key.
- Persisted readback must prove the `DefKey`, Type `32` child, physical fields, and default-view bindings before Type `32` navigation is added.

## Validation Scope

The candidate adds a structured registry contract, planner guidance, source/distribution training parity, and dedicated regressions. It does not claim a dedicated local FormNewReport materializer, tenant persistence, runtime report row population, filtering, detail opening, or export behavior.

## Release Status

Not yet release-candidate accepted. Final packaging, isolated Marketplace installation smoke, fresh-task MCP discovery/readback, tag, and stable promotion remain separate authorized release steps.
