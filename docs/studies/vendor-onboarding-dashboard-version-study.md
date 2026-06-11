# Vendor Onboarding Dashboard Version Study

## Context

The Vendor Onboarding import/debug loop reached successful import with the V1.9 generated YAP candidates. After import, the generated `Home` dashboard appeared to use an older dashboard shell. A user-edited dashboard named `New Dashboard` was then added in Yeeflow using the current dashboard designer and exported as:

`~/Downloads/Vendor Onboarding & Compliance Managementv1.93.yap`

The raw export is intentionally not committed. This study records only normalized structural findings.

## Dashboards Found

The export contains two root application page layouts under `ListExportInfo.Item.Layouts[]`:

- `Home`
- `New Dashboard`

Both are `Type = 103` dashboard/application page layouts. No `DataReports`, `AppComponents`, or `AppGroups` were required for either dashboard in this export.

## Home Dashboard Finding

`Home` is the older generated dashboard shell:

- Location: `Item.Layouts[]`
- Type: `103`
- `LayoutView`: empty string
- `Ext2`: empty string
- `LayoutInResources`: null or missing after export

This shape imports but does not represent the current dashboard shell created by the current Yeeflow dashboard designer.

## New Dashboard Finding

`New Dashboard` is the current dashboard shell created manually in Yeeflow:

- Location: `Item.Layouts[]`
- Type: `103`
- `LayoutView`: `null`
- `Ext2`: `{"src": true}`
- `LayoutInResources`: empty array

This is export-proven from the user-created dashboard in the imported application. The export proves the current blank dashboard shell.

## Current Dashboard With Inline Content

The generated V1.10 YAP proved that a generated `Home` dashboard can use the current dashboard shell and import successfully. V1.10 was intentionally blank.

The generated V1.11 YAP proved that the current dashboard shell can include inline `LayoutInResources` page content, but the Data table query configuration was wrong. The visible column labels appeared in the designer, but the canvas showed:

`Field(s) ,,,,, have been deleted. Please check the query configuration.`

The generated V1.12 YAP fixed the Data table binding and was user-confirmed to import successfully. It opens with the new/current dashboard version and the Data table no longer shows the deleted-fields error.

Runtime-confirmed Data table rule:

- `attrs.data.list` should include `AppID`, `ListID`, `Type`, `Title`, and `ListSetID`.
- `attrs.listarr[].Field` is the real source field binding, for example `Text0`, `Text1`, or `Text2`.
- `attrs.listarr[].FieldName` is the visible column label, for example `Vendor Name`.
- Omitting `Field` while using only labels or IDs can leave the designer sidebar readable but make the runtime query treat the selected fields as deleted.

## Structural Diff

| Area | Old `Home` | Current `New Dashboard` | Conclusion |
| --- | --- | --- | --- |
| Storage location | `Item.Layouts[]` | `Item.Layouts[]` | Current dashboards are still root Type 103 layouts. |
| `LayoutView` | `""` | `null` | Current shell uses `null`. |
| `Ext2` | `""` | `{"src": true}` | Current shell uses the `src` marker. |
| `LayoutInResources` | null or missing | `[]` | Current blank dashboard shell uses an empty array. |
| Navigation | `Home` is present in root navigation | `New Dashboard` was not present in root navigation sort | Generator should still register generated `Home` in root navigation. |

## Current Dashboard Generation Rule

For generated app `Home` dashboards, use this export-proven current shell:

```json
{
  "Type": 103,
  "Title": "Home",
  "LayoutView": null,
  "Ext1": null,
  "Ext2": "{\"src\":true}",
  "Ext3": null,
  "IsDefault": false,
  "IsItemPerm": false,
  "LayoutInResources": []
}
```

Root navigation should still include a `LayoutView.sort[]` item:

- `Type`: `103`
- `ListID`: the generated `Home` `LayoutID`
- `ListSetID`: the generated root application/ListSet `ListID`
- `AppID`: `41`

## Generator Implications

- Generate new application dashboards with `LayoutView: null`, `Ext2: "{\"src\":true}"`, and empty `LayoutInResources` when the dashboard has no inline content.
- Current dashboards can include inline `LayoutInResources` page content; generated Data table controls inside that content must follow the runtime-confirmed `Field` / `FieldName` binding rule.
- Preserve the prior import-learned rules: `AppID = 41`, API-issued IDs, populated `ReplaceIds`, correct `ListSite_<root ListID>` `CustomType`, integer `Field.Category`, unique IDs, and `ListExportResult` resource shape.
- Do not assume rich current-dashboard control content can be embedded using the older inline page-resource model until a current-dashboard-with-controls export proves the content shape.

## Validator Implications

Generated-final validators should report:

- `DASHBOARD_USES_LEGACY_SCHEMA` when a generated empty Type 103 dashboard uses blank `LayoutView` or lacks the `Ext2` current marker.
- `DASHBOARD_CURRENT_VERSION_MARKER_MISSING` when `Ext2` does not parse to `{ "src": true }`.
- Existing dashboard resource checks still apply when a dashboard includes inline page resources.
- `DASHBOARD_DATA_TABLE_DISPLAY_FIELD_BINDING_MISSING` when a generated dashboard Data table column omits `attrs.listarr[].Field`.
- `DASHBOARD_DATA_TABLE_DISPLAY_FIELD_UNRESOLVED` when `attrs.listarr[].Field` does not resolve to a source list field.

The supplied product-team JSON schema still declares dashboard `LayoutView` as a string. The v1.93 export itself uses `LayoutView: null` on `New Dashboard`, so strict schema validation reports that single type mismatch for the export-proven current shell. The current branch therefore treats this as a schema/export drift note rather than a generator regression.

## Proof Boundary

`New Dashboard` structure is export-proven from the user-edited v1.93 export. Generated current-dashboard shell behavior is import-proven by V1.10. Current-dashboard inline content with a simple Data table is import-proven and query-error-fixed by V1.12 for the focused Vendor Onboarding package.

The proof does not yet cover the full rich Vendor Onboarding mockup scope, lookup runtime behavior, workflow execution, record creation, or advanced controls such as Document embed, QR Code, Barcode, Timeline, and Print Page.
