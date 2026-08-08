# Yeeflow App Builder v1.7.0

## Summary

This release adds `collection_control_responsive_multiple_select`, a complete native responsive Table/Card Collection golden reference for multi-select workflows. It is the responsive replacement for `collection_control_grid_table_with_multiselect` when the same dataset must use Table view on PC/laptop/tablet and Card view on mobile.

## Included Contract

- Preserve the full `grid_table_col_multiselect_wrapper` page slice, not only the Collection control.
- Preserve the leading selection column, selected IDs/count, normal and batch operations, Collection actions, confirmation variables, page filters, `formAction.onLoad`, and extension metadata.
- Keep the mobile Card item tree populated and bound, map the remaining native Table columns to the target list schema, and keep operation containers Full width on mobile.
- Reject legacy `flex_grid` substitutions and incomplete page dependency graphs.

## Validation

- Repository root hygiene: PASS; no tracked or untracked `* 2.*` duplicate artifacts remain.
- Source and distribution registry/template validation: PASS.
- Dashboard golden-reference regression suite: PASS.
- Collection generation fixtures: PASS.
- Full application materialization entrypoint gates: PASS.

## Proof Boundary

This release is export-proven and locally structurally validated. Generated list IDs, permissions, API acceptance, persistence, and browser/runtime behavior remain package-specific and require the private Marketplace install smoke before final user acceptance.

## Release Status

The release candidate must be installed from its exact Git tag and checked in a fresh Codex task before the final stable tag is created.
