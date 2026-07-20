# Dashboard v11 Summary Host Dynamic User Fixture and Slot-Selection Reconciliation

`DASHBOARD_V11_SUMMARY_HOST_DYNAMIC_USER_FIXTURE_SLOT_SELECTION_RECONCILED`

## Decision

The failed Employee Number assertion was a stale and incomplete fixture/test, not a production slot-selection defect and not a regression from an approved transition.

The prior fixture used a generic `Data List Schema Table` heading with a cross-list field table. The current Legacy parser requires a list-scoped heading to associate the field rows with the Dashboard source. Without that association, the generated Collection used its Title-only fallback, so the assertion could never observe Employee Number or Profile Owner.

The reconciled fixture uses `### 4.1 Doctor Profiles` and the list-scoped field table. It proves the surviving grid-table dynamic-slot order `Title`, `Text4`, `Text2` after the established schema-pruning pass; Employee Number is a `dynamic-field` bound to `Text2`, while Profile Owner is a `dynamic-user` bound to `Text4`.

## Source Trace

`collectDataListFieldSpecs` associates the table with the active list-scoped heading. `buildCollectionTemplateInstance` then provides the resolved list metadata to `selectFieldForDynamicControl`; `dynamicControlTypeForField` classifies identity-picker fields as `dynamic-user` and Text fields as `dynamic-field`. No product resource identity is allocated or inferred by this path.

## Batch J Reconciliation

Batch J extracted only `normalizeDashboardFilters` and `isDateLikeAnalyticsField`. This fixture declares neither Dashboard filters nor analytics. The dynamic-slot path does not call either function, and the production materializer remains at Batch J's sealed after checksum `73ff896d6991af944f59cca3b689ce7884c38c76b88d6dd2d83128b4844a2517`.

No closure-lineage transition is appended: no historical transition caused the failure. The reconciliation changes only the test fixture and its assertions; it does not modify production routing, Core artifacts, adapters, distribution, active installation, historical ZIP, protected duplicates, or release state.

## Next Work

The next work item remains `Wave 3 Batch K proof-envelope selection`.
