# Phase 5R Data List Additional-View LayoutView Contract Audit

## Decision

`DATA_LIST_ADDITIONAL_VIEW_LAYOUT_CONTRACT_ACCEPTED`

The non-default Type 0 LayoutView fragment is a bounded future Data List vertical, but it requires an explicit additional-view intent contract. This audit does not route, distribute, or implement that vertical.

## Exact Legacy Boundary

The default and additional paths each invoke `buildDataListViewLayoutViewChecked` once. The default call is the only Core route. The additional call retains `routeDefaultViewThroughCore: false` and is reached from the `extraDataViews` loop. Both use the same structural layout/query/filter fragment builder, but the host owns different LayoutID, title, URL, IsDefault, and layout-index behavior.

## Default Versus Additional Matrix

- **view-selection**: Default: default selection uses isDefault then an All-name fallback Additional: additional records are every record other than the selected default Classification: `requires-extended-view-intent-contract`. Boundary: Core receives an explicit non-default view intent; host selection remains Legacy-owned.
- **resource-identity-and-url**: Default: LayoutID index zero, Title fallback Default View, Ext1.Url default, IsDefault true Additional: host selects a post-custom-layout LayoutID index, Title is viewRecord.viewName, Ext1.Url uses routeKey or slugify(viewName), IsDefault false Classification: `requires-identity-allocation-contract`. Boundary: Core must not receive or allocate ListID or LayoutID; host owns record identity, URL, and final resource integration.
- **layout-and-query-fragment**: Default: Title-first, fallback, deduplication, twelve-column limit, query static fields Additional: identical buildDataListViewLayoutView structural path Classification: `reusable-with-default-layout-contract`. Boundary: The immutable fragment contract is reusable after an additional-view intent explicitly supplies a stable scope.
- **fixed-filter-intents-and-order**: Default: Core route uses a default-scoped key request path Additional: Legacy parses the same filter language and condition order but currently calls crypto.randomUUID directly Classification: `requires-extended-view-intent-contract`. Boundary: Core must receive a stable non-default viewScope; Local Runtime must validate allocated keys, lower filters, and append findings.
- **findings-and-errors**: Default: Core route returns immutable findings lowered by Local Runtime Additional: Legacy checked path appends DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED using listName, viewName, and filter text Classification: `requires-extended-view-intent-contract`. Boundary: Future Core projection returns immutable findings with additional view evidence; host alone appends them in original order.
- **sort-row-color-grouping**: Default: sort and rowColor are empty arrays; no grouping is emitted Additional: identical empty arrays; no additional-view-only grouping behavior exists Classification: `reusable-with-default-layout-contract`. Boundary: No Core extension is required for this current Legacy behavior.
- **field-and-template-boundaries**: Default: FieldIDs are host-supplied; static query descriptors are fixed by the fragment builder Additional: identical field records and static query descriptors Classification: `reusable-with-default-layout-contract`. Boundary: Future input remains immutable and supplies FieldIDs and an explicit static template snapshot.
- **runtime-and-cross-resource-dependencies**: Default: No LayoutView fragment dependency on forms, dashboards, APIs, or package output Additional: same fragment behavior; host layout index is affected by custom form layout count Classification: `requires-identity-allocation-contract`. Boundary: The host retains custom-layout index allocation and all cross-resource layout ownership.

## Future Contract

The future input is an immutable `DataListAdditionalViewLayoutProjectionInput` with an explicit stable view scope, `isDefault: false` view intent, supplied FieldIDs, and static template snapshot. Materializer Core returns only immutable fragment, fixed-filter intents, deterministic requests, and findings. Local Runtime owns key validation, filter lowering, and optional findings append. The host retains UUID allocation and final resource record identity, URL, title, layout index, and integration.

## Follow-Up

Phase 5S status: `internal_shadow_complete_not_routed`. The internal shadow evidence is recorded at `compatibility/capability-manifests/data-list-additional-view-layout-internal-shadow.v0.1.0.json` and remains non-public, undistributed, and non-routed. Phase 5T status: `public_api_readiness_accepted_not_promoted`. The public API readiness record is `compatibility/capability-manifests/data-list-additional-view-layout-public-api-readiness.v0.1.0.json`; it remains unpromoted and non-routed.

## Proof and Rollback

A future route requires the documented focused matrix in compiled source, Plugin dist, temporary official ZIP, and simulated installed layouts, followed by temporary-copy-only rollback that preserves the already proven default route.

## Non-Goals

No current production route, Core or Local Runtime artifact, adapter, active installation, historical ZIP, or release state changed.
