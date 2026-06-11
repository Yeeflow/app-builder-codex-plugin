# Custom Code Template Showcase Import Blocker Study

## Scope

This study investigates why `custom-code-template-showcase.v1.yap` imported into Yeeflow as an app shell but opened to the empty `Start to build with Components` state instead of materializing its generated lists, dashboard, approval form, workflow, and Custom Code controls.

Public form support remains untested and is not claimed.

## Finding

Multiple package materialization issues were found across the showcase package and a smaller Visitor Access comparison package.

Primary root cause: the generator remapped tenant/user metadata from the Smart Lookup baseline into the showcase local ID family. The failed resource used generated `6182...` IDs for `TenantID`, `CreatedBy`, and `ModifiedBy`, and also listed those metadata IDs in `ReplaceIds`. Working generated apps keep tenant/user metadata as the real tenant values from the known-good baseline and reserve generated local IDs for app resources.

Secondary issue: the generated root Type `103` dashboard layout used the dashboard page `LayoutID` as its owning `ListID`.

Failed shape:

```json
{
  "rootListId": "6182000000000000000",
  "layoutId": "6182000000000000001",
  "layoutListId": "6182000000000000001"
}
```

Working generated app packages use a different ownership rule:

```json
{
  "rootListId": "<root app/listset id>",
  "layoutId": "<dashboard page layout id>",
  "layoutListId": "<root app/listset id>",
  "LayoutInResources[0].ID": "<dashboard page layout id>",
  "LayoutInResources[0].RefId": "<dashboard page layout id>"
}
```

The failed package did contain real resources after wrapper decode:

- Root app shell: present.
- Root navigation: present.
- Dashboard page JSON: present.
- Data lists: 9 present.
- Approval form: 1 present.
- Custom Code controls: 25 present.
- Public form controls: 0.

The resources were therefore not missing from the wrapper. The app shell imported, but the importer did not materialize the embedded resources. Runtime evidence showed the app tile was created while the app opened to `Start to build with Components`.

## Working Comparison

Compared references:

- `custom-code-smart-lookup-picker-test.resource.json`
- `employee-family-implant-app-def.v3.json`

Both working references keep tenant/user metadata as real tenant/user IDs. Generated local IDs are used for app/list/page/form/list-data resources only.

Both working references also keep root Type `103` layouts owned by the root app/listset `ListID`, while `LayoutID` and `LayoutInResources[0].ID/RefId` identify the page resource.

The patched showcase package now matches that materialization shape and passes the focused materialization inspection.

Additional runtime investigation found two data-list field materialization blockers:

1. Field IDs were initially unique inside each list but reused across lists. Yeeflow `.yap` applications require `FieldID` values to be unique across the whole application package, not just within one data list.
2. After the first FieldID fix, each field's own `ListID` was accidentally remapped to its new `FieldID`. Yeeflow created the list shell but did not attach custom fields because `field.ListID` no longer matched the parent list.

Correct field ownership shape:

```json
{
  "parentListId": "6182000000000000100",
  "field": {
    "FieldID": "6182000000000010001",
    "ListID": "6182000000000000100",
    "FieldName": "Title",
    "DisplayName": "Request Title"
  }
}
```

## Patch

Patched `generate-custom-code-template-showcase-v1.mjs`:

- Preserve baseline tenant/user metadata instead of remapping it to `6182...`.
- Build `ReplaceIds` from generated local app-resource IDs only.
- `data.Item.Layouts[0].LayoutID = nextId(1)`
- `data.Item.Layouts[0].ListID = nextId(0)`
- `LayoutInResources[0].ID = nextId(1)`
- `LayoutInResources[0].RefId = nextId(1)`
- root navigation Type `103` keeps `ListID = nextId(1)` and `ListSetID = nextId(0)`

This preserves the proven page-reference pattern while restoring the root app ownership relationship.

## Validator Added

Added `scripts/inspect-yap-materialization.mjs`.

The validator checks:

- root app model exists and is Type `1024`
- root navigation has at least one Type `103` page
- Type `103` navigation entries point to existing root layouts
- Type `103` root layouts are owned by the root app/listset `ListID`
- `LayoutInResources[0].ID` and `RefId` equal the page `LayoutID`
- child data lists are reachable from root navigation
- data-list navigation entries point to packaged child lists
- child list layouts are owned by their own list IDs
- packaged approval forms use `Data.Forms[].ListID = 0`
- approval forms are represented in root navigation when forms are included
- root tenant/user metadata has not been remapped into the generated local app ID family

This catches both locally detectable empty-shell risks found during this investigation.

The validator was then strengthened to also check:

- app-wide duplicate `FieldID` values
- fields whose `ListID` does not match the parent data list
- duplicate `FieldName`, `InternalName`, and materialization-risk `DisplayName` values inside a list
- tenant/user metadata accidentally included in `ReplaceIds`

## YAP App Materialization Rules

Every generated `.yap` application must satisfy these rules before runtime import:

- Every `ListID` must be unique.
- Every `FieldID` must be unique across the whole application, not only inside each data list.
- Every `field.ListID` must equal the parent data list `ListID`.
- Every `FieldName`, `InternalName`, and `DisplayName` must be unique inside its own data list.
- Do not remap `TenantID`, `CreatedBy`, or `ModifiedBy` as generated app-resource IDs.
- Do not include `TenantID`, `CreatedBy`, or `ModifiedBy` in `Resource.ReplaceIds`.
- Build `ReplaceIds` from generated local app/list/field/layout/form/sample IDs only.
- Root Type `103` dashboard/page layout ownership must connect back to the root app/ListSet `ListID`.
- Root navigation must reference real packaged dashboards/pages, child lists, and approval forms.
- Do not runtime-test custom code controls until the app shell, dashboard, lists, forms, and data-list fields materialize.

## Current Status

The patched showcase package passes local materialization inspection and the normal local validation chain. Runtime retesting confirmed that the final package installs, application content materializes, and custom data-list fields appear correctly.

Follow-up runtime smoke on the rebuilt package after commit `b678738` confirmed the materialization path directly in Yeeflow:

- The app opened to real content instead of `Start to build with Components`.
- The dashboard/home page appeared.
- Generated data-list navigation appeared.
- `Service Requests` opened with custom fields and sample rows.
- The approval form opened.
- The workflow designer prompt appeared for `Enterprise Service Request Review`.
- Custom Code controls were visible on dashboard, approval form, and data-list custom form surfaces.

To isolate whether generated `.yap` import was broadly broken, a separate minimal package was generated:

- Package: `one-list-materialization-smoke-test.v1.yap`
- App: `One Data List Materialization Smoke Test`
- Contents: one root Type `103` home page, one data list, two sample records, no approval forms, no Custom Code controls
- Local result: package, graph, wrapper round trip, and materialization inspection passed; materialization inspection only warned that no approval forms were present
- Runtime result reported by user on 2026-05-18: installed and test passed

This proves the current Yeeflow tenant can import and materialize generated app packages when app-resource IDs, field ownership, navigation, and dashboard/root linkage follow the learned rules.

Template runtime proof status after this smoke is still intentionally conservative:

- `smart-lookup-picker`: runtime-proven in the prior focused app and retested in this showcase app for approval-form and data-list custom-form search/select/writeback.
- `checklist-compliance-block`: runtime-proven in this showcase app for approval-form checkbox interaction and JSON writeback.
- `multi-entry-tag-input`: runtime-proven in this showcase app for approval-form tag add and JSON writeback.
- `kpi-card-set`: render-only proven on the dashboard; configured KPI values rendered, but data-bound KPI calculation is not proven.
- `activity-timeline`, `approval-timeline`, `dependent-selector`, `distribution-chart-module`, `exception-alert-panel`, `hierarchical-selector`, `related-record-summary-grid`, and `trend-chart-module`: visible but blocked by configuration/query wiring because they rendered empty states or did not populate options despite seeded source lists.
- `approval-decision-panel`: not tested because the reviewer/task context was not reached.
- Public form support: not claimed.
