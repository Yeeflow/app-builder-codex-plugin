# Yeeflow App Builder v1.7.1

## Summary

v1.7.1 makes the export-proven responsive Table/Card multiselect Collection the default for generic multi-selection and batch-operation requirements.

## Included changes

- Route generic multi-select, checkbox-selection, selected-count, and batch-action requirements to `collection_control_responsive_multiple_select`.
- Retain `collection_control_grid_table_with_multiselect` only for explicit legacy Flex Grid compatibility or an exact App Plan template ID.
- Synchronize `grid_table_col_operations` and `op_normal` with the live mobile Full-width contract `[null, "2", "1"]`.
- Preserve non-empty mobile Card content, selected-state dependencies, Collection/page/form actions, Card operation z-index, and Button-right operation-menu placement.
- Correct the Card-view mapper so responsive multiselect templates materialize rather than failing on an undefined array helper.

## Validation

- Registry and template fidelity validation: PASS.
- Responsive multiselect source negative tests: PASS.
- Generic default-routing materialization test: PASS.
- Explicit legacy Flex Grid multiselect materialization regression: PASS.

## Proof boundary

This release proves source-template fidelity and local generated-final materialization. It does not itself prove a tenant install, Designer rendering, or end-user runtime behavior; the RC requires an exact-tag private-Marketplace install smoke before final stable release.
