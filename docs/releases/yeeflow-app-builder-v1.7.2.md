# Yeeflow App Builder v1.7.2

## Summary

v1.7.2 retires the generic legacy Flex Grid Collection templates from new generated-final selection. Native responsive Table/Card Collection templates are now the only defaults for ordinary and multiselect Collection requirements.

## Included changes

- Map `collection_control_grid_table` to `collection_control_responsive` and `collection_control_grid_table_with_multiselect` to `collection_control_responsive_multiple_select` when reading existing App Plans.
- Record the retired source ID in generated provenance and emit an explicit migration warning; existing serialized packages remain readable without destructive conversion.
- Remove both legacy IDs from the approved golden-reference registry, template inference choices, and ordinary/reverse-related Collection defaults.
- Preserve the complete responsive Table/Card contract during runtime binding, including native columns, mobile Card item content, selection dependencies, operation `z-index`, and mobile operation-menu placement.
- Include the v1.7.1 responsive multiselect Card-mapper and generic batch-selection routing fixes when building from the v1.7.1 stable baseline.

## Validation

- Dashboard Collection golden-reference registry and source/distribution regressions: PASS.
- Retired-template App Plan migration regression: PASS.
- Responsive default-routing regression: PASS.
- Source/distribution mirror parity: PASS.

## Proof boundary

This release proves the source and bundled Plugin structure, local materialization rules, and validation behavior. Tenant install, Designer rendering, and end-user runtime behavior require the exact-tag private Marketplace smoke record.
