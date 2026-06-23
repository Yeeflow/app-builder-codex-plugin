# Dashboard Dataset Presentation Golden References Training Report

## Summary

This training promotes approved Dashboard Collection presentation patterns into a unified registry so generation can select the right Collection style from business requirements and validators can reject simplified or invented Collection structures.

## Registered References

- `collection_control_responsive_card_grid`
- `collection_control_card_with_multiselect_toolbar`
- `collection_control_grid_table`
- `collection_control_grid_table_with_multiselect`
- `collection_control_grid_table_with_search`
- `Event Pipeline Grid-Table`

## Key Clarification

`collection_control_grid_table_with_multiselect` is not limited to Project Tasks. Projects Center / Project Tasks is the export-proven source reference. The pattern can be selected for any Dashboard dataset region that needs dense table scanning plus multi-row selection and batch operations such as bulk assign, close, approve, status update, reminder, archive, export, or delete.

## New Gates

- Dashboard Collection dataset regions must select an approved reference ID in App Plan.
- Generated Dashboard Collection controls must carry or inherit approved template provenance.
- Unknown Collection template IDs fail.
- Collection controls with no approved provenance fail.
- Grid-table references must keep header/item grids and Collection body.
- Search references must include search/fulltext linkage.
- Multiselect references must include checkbox state, selected vars/count, bulk toolbar/actions, `ListDataID`, and `__ctx_coll`.
- Event Pipeline Grid-Table remains a high-fidelity component reference inside Dashboard Page Layouts v1.1, not a competing page root shell.

## Validation Coverage

Focused tests cover:

- registry pass and required IDs
- App Plan pass with all approved references
- App Plan fail on Collection dataset regions without approved selection
- App Plan fail on invented reference IDs
- generated package pass with responsive card, grid-table, search grid-table, multiselect grid-table, and Event Pipeline Grid-Table
- generated package fail on unproven Collection
- generated package fail on invented template ID
- generated package fail on simplified grid-table shape
- generated package fail on missing multiselect state/actions

## Classification

Pre-existing generator gap:

- Dashboard Collection generation could previously create generic repeated cards or simplified grid-table lookalikes that did not map to a registered template.

New enforcement:

- App Plan and generated-final packages now fail closed unless Dashboard Collection controls select and preserve an approved dataset presentation reference.

## Proof Boundary

The validator proves local package/template conformance. It does not prove live Yeeflow rendering, Collection action mutation, bulk-operation execution, search behavior, or runtime data values. Those remain separate runtime/browser proof gates.
