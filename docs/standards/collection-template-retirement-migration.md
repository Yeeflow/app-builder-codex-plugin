# Collection Template Retirement Migration

`collection_control_grid_table` and `collection_control_grid_table_with_multiselect` are retired from the approved Collection golden-reference registry.

| Retired ID | Generated replacement |
| --- | --- |
| `collection_control_grid_table` | `collection_control_responsive` |
| `collection_control_grid_table_with_multiselect` | `collection_control_responsive_multiple_select` |

New App Plans must select only an approved responsive template. When an existing App Plan contains one of the retired IDs, the materializer maps it to the listed replacement and records the original ID in generated Collection provenance. Existing already-installed packages are unchanged; validation reports their retired provenance as a warning rather than converting their serialized UI tree.

The retired JSON artifacts remain in the repository only for historical inspection and compatibility testing. They are not approved template choices and must not be used by new materialization.
