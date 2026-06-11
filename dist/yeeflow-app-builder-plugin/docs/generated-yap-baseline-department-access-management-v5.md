# Generated `.yap` Baseline: Department Access Management v5

This document records the first successful generated Yeeflow application-level `.yap` baseline.

## 1. What v5 Proves

`Department Access Management_v5` proves that Codex can generate a minimal app-level `.yap` package that Yeeflow can import and open.

Confirmed sandbox result:

- The `.yap` imports successfully.
- The import popup shows logo, name, and description.
- The app appears on the workspace home page.
- The app opens from the workspace card.
- The app header and navigation render.
- The `Departments` list opens.
- The `Departments` list shows 3 sample department rows.
- The `Department Access Requests` list opens.
- The `Department Access Requests` list shows sample request rows.
- The `Department Access Request` approval form opens.
- The approval request form renders with Department lookup, Department Code, Needed By Date, and Access Reason fields.

This is the first app-level generated package baseline that combines:

- root app/listset shell
- two related data lists
- lookup relationship between lists
- sample records
- custom list forms
- app navigation
- approval form/workflow
- approval form lookup control
- approval workflow `ContentList` persistence target

## 2. App Shell Rules Learned

The working v5 baseline requires a complete app shell, not only valid child resources.

Confirmed rules:

- Top-level wrapper `IconUrl` must be non-null.
- Top-level wrapper `Title` and `Description` should be populated.
- Root `Data.Item.ListModel.Title` should match the app name.
- Root `Data.Item.ListModel.Description` should be populated when a description is intended.
- Root `Data.Item.ListModel.IconUrl` should match the wrapper icon.
- Root `Data.Item.ListModel.Type = 1024`.
- Root `Data.Item.ListModel.CustomType = ""`.
- Root `Data.Item.ListModel.Perm = 0`.
- Root `Data.Item.ListModel.WorkspaceID` must be present.
- Root `Data.Item.ListModel.LayoutView` must contain populated navigation.
- Root `Data.Item.Layouts[]` should include at least one Type `103` app page layout.
- `Data.AppTags` must exist as an array.
- `Data.AppMetadatas` must exist as an array.
- `Data.AppComponents` must exist as an array.
- `Data.AppThemes` must exist and contain an application style entry.
- Root `CreatedBy` and `ModifiedBy` should be populated.

The generated app's first successful open route was:

```text
/#/list-set/<workspace-id>/<listset-id>/<list-id>
```

This confirms Yeeflow remapped the generated root app/listset ID and Type `103` page layout ID during import.

## 3. Root App Page Rule

Root Type `103` app pages have a different resource-registration pattern from data-list custom forms.

Confirmed rule:

- Type `103` app page `LayoutID` is a local generated ID and must be included in `Resource.ReplaceIds`.
- `LayoutInResources[0].ID` and `LayoutInResources[0].RefId` are separate resource IDs.
- Type `103` `LayoutInResources` resource IDs must not equal `LayoutID`.
- Type `103` `LayoutInResources` resource IDs should be excluded from `Resource.ReplaceIds`.
- `LayoutInResources[0].Resource` must contain valid app page JSON.

This differs from the data-list custom form pattern, where `LayoutInResources[0].ID` and `RefId` match the custom form `LayoutID`.

## 4. Failed v1-v4 Lessons

Earlier generated packages helped isolate the required app-shell metadata.

| Version | Result | Lesson |
| --- | --- | --- |
| v1 | Package validated locally but imported poorly. | Component-level validity is not enough for app-level runtime behavior. |
| v2 | Import popup still lacked proper name/description behavior. | Root and wrapper metadata must both be complete. |
| v3 | Import popup showed logo/name/description, app card appeared, but open behavior was not yet proven. | Non-null wrapper `IconUrl` and root app page layout are required. |
| v4 | Still uncertain in browser testing. | Root Type `103` page resource IDs needed the real export pattern. |
| v5 | App imports, opens, renders navigation, lists, and approval form. | Complete app shell, Type `103` page registration, theme arrays, and audit metadata form the first working baseline. |

## 5. Validator Updates Already Made

`validate-yap-package.js` now checks app-shell readiness in generator/final mode:

- wrapper title/description presence
- non-empty wrapper icon
- root `CustomType = ""`
- root `Perm = 0`
- root `WorkspaceID` present
- parseable root `LayoutView`
- populated root navigation
- root navigation references resolve
- root Type `103` app page exists
- Type `103` app page has `LayoutInResources`
- Type `103` app page resource ID/RefId are separate from `LayoutID`
- Type `103` app page resource IDs are excluded from `ReplaceIds`
- root `CreatedBy` and `ModifiedBy` are populated
- `AppTags`, `AppMetadatas`, and `AppComponents` arrays exist
- `AppThemes` is present and non-empty

`validate-yap-graph.js` now records root navigation edges so app shell navigation can be checked as part of the app graph.

`build-yap-wrapper.js` now supports `--icon-url` and defaults the top-level wrapper icon from the root `ListModel.IconUrl` when possible.

## 6. Import Test Result

Observed v5 sandbox result:

- Import: passed
- Workspace card: created
- App open: passed
- App header: rendered
- App navigation: rendered
- Departments list: opened
- Departments sample data: rendered
- Department Access Requests list: opened
- Department Access Requests sample data: rendered
- Department Access Request approval form: opened and rendered

The working imported IDs observed in Chrome include:

- Imported root app/listset ID: `2053789849616134145`
- Imported Departments list ID: `2053789859448766465`
- Imported Department Access Requests list ID: `2053789859452960776`
- Imported Type `103` overview page ID: `2053789859457155085`

## 7. Internal Lookup Sample Data Export-Back Evidence

The exported-back `Department Access Management_v5.yap` confirms that app-level internal lookup sample references are structurally valid.

Department sample record remapping:

| Department | Generated `ListDataID` | Exported-back `ListDataID` | Department Code |
| --- | --- | --- | --- |
| Information Technology | `2060010000000011001` | `2053789859452960773` | `IT` |
| Human Resources | `2060010000000011002` | `2053789859452960774` | `HR` |
| Finance | `2060010000000011003` | `2053789859452960775` | `FIN` |

Request sample lookup remapping:

| Request | Generated Department raw value | Exported-back Department raw value | Matches exported Department record |
| --- | --- | --- | --- |
| DAR-1001 | `2060010000000011001` | `2053789859452960773` | yes |
| DAR-1002 | `2060010000000011002` | `2053789859452960774` | yes |
| DAR-1003 | `2060010000000011003` | `2053789859452960775` | yes |

This disproves the stale-ID hypothesis for app-level packaged sample data. Yeeflow remapped both the target Department sample record IDs and the dependent request lookup values consistently.

Confirmed app-level rule:

- For an internal lookup where both source and target lists are packaged in the same `.yap`, target sample record IDs are local package IDs.
- Local target sample record IDs should be included in `Resource.ReplaceIds`.
- Dependent sample lookup values may reference those local target sample record IDs as plain strings.
- During app import, Yeeflow remaps the target sample records and the dependent lookup values together.

This differs from standalone `.ydl` packages where the lookup target already exists outside the dependent package. In that external-lookup case, target record IDs must be excluded from the dependent package `ReplaceIds`.

## 8. Remaining Runtime Display Note

The remaining issue is sample lookup display in the `Department Access Requests` list:

- `Departments` sample rows display correctly.
- `Department Access Requests` sample rows display Department Code values.
- The `Department` lookup display column appeared blank for generated sample request rows in the grid.

In the generated v5 source, `Department Access Requests.Text2` stores plain generated Department sample `ListDataID` strings, for example:

```json
{
  "Title": "DAR-1001",
  "Text2": "2060010000000011001",
  "Text3": "IT"
}
```

The target Department sample records exist in the same package and those sample record IDs are included in `Resource.ReplaceIds`. Export-back proves the raw `Text2` lookup values point to valid exported-back Department `ListDataID` values.

Therefore, if the grid display is still blank after refresh/reopen, classify it as a runtime lookup display/index/cache issue unless the item form lookup value is also broken.

Recommended manual checks before creating v6:

1. Refresh or reopen the app.
2. Open a sample request row form.
3. Verify whether the Department lookup selection is present inside the form.
4. Create or edit one row and select a Department.
5. Confirm whether manually selected lookup values display in the grid.

Do not create a new package only to address blank grid display without stronger evidence that the package data or lookup field is wrong.

## 9. Visitor Access Management Follow-Up: Fresh ID Family Rule

The later `Visitor Access Management` generation test confirmed an additional app-level rule that should be applied to all future generated `.yap` packages.

Observed result:

- A Visitor package that was structurally v5-compatible but reused the old `206...` generated ID family and `DAR` approval form key imported, but opened as a blank app.
- `visitor-access-management.v5-fresh-compatible.yap` used a fresh local ID family and fresh form key `VAV`.
- The fresh-compatible package imported and opened successfully with header/navigation, Departments, Visitor Access Requests, and Visitor Access Request approval form.

Rule:

- Use a fresh local ID family for every generated `.yap` app test.
- Use a fresh FlowKey/form key for every generated approval form inside the app package.
- Do not reuse generated IDs or form keys from an already-imported generated app unless intentionally testing update behavior.
- ID/key reuse can produce packages that pass local validation and import, but open as blank apps or detach components at runtime.

Validator/generator recommendation:

- Record or infer generated ID families from recent generated/imported artifacts where possible.
- Warn or fail when a new generated app reuses a known generated/imported ID family or approval form key.
