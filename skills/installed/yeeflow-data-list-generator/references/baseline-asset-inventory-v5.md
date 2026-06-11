# Generated Data List Baseline: Asset Inventory v5

This document records the first successful generated Yeeflow `.ydl` data-list baseline with fields, views, sample records, custom form registration, custom form assignment, and rendered custom form controls.

For related standalone lists with lookups, use the later staged lookup baseline in `docs/generated-related-data-lists-staged-lookup-pattern.md`. Asset Inventory v5 remains the baseline for single-list generation and custom form registration.

## 1. What v5 Proves

Asset Inventory v5 proves that Codex can generate a sandbox-testable Yeeflow data-list package when the decoded `.ydl` structure follows real export patterns closely.

Proven:

- Generated `.ydl` imports successfully.
- Fields are created.
- Views are created.
- Sample records are created.
- A custom form is created.
- The custom form is assigned to:
  - New Item
  - Edit Item
  - View Item
- The custom form opens in the designer.
- Custom form controls render instead of being dropped or showing an empty drag area.
- The wrapper round-trips through gzip/base64 `Resource` decoding.
- `validate-ydl-list.js --mode generator --stage final` passes.

The working package is:

- `asset-inventory-def.import-debug-v5.json`
- `asset-inventory.import-debug-v5.ydl`

## 2. Critical Custom Form Registration Rules

Generated data-list custom forms must follow this pattern.

Custom form layout:

- `Layout.Type = 1`
- `Layout.LayoutView = null`
- `Layout.Ext2 = "{\"src\":true}"`
- `Layout.IsItemPerm = false`
- `Layout.LayoutInResources` must exist and contain one resource entry.

Custom form embedded resource:

- `LayoutInResources[0].ID` must exist.
- `LayoutInResources[0].RefId` must exist.
- `LayoutInResources[0].Resource` must exist.
- `LayoutInResources[0].ID` must equal `Layout.LayoutID`.
- `LayoutInResources[0].RefId` must equal `Layout.LayoutID`.
- `LayoutInResources[0].Resource` is a JSON string, not a raw object.

List display settings:

- `Item.ListModel.LayoutView` stores the New/Edit/View assignment.
- Use the custom form `LayoutID` in:
  - `add`
  - `edit`
  - `view`

Example:

```json
{
  "add": "2037000000000002006",
  "edit": "2037000000000002006",
  "view": "2037000000000002006",
  "opentype": {
    "add": "modal",
    "view": "slide"
  },
  "modalsize": {
    "view": 2
  }
}
```

Form `Resource` JSON must include:

- `children`
- `attrs`
- `title`
- `filterVars`
- `ver`
- `tempVars`

Example shape:

```json
{
  "children": [],
  "attrs": {},
  "title": "Asset Detail Form",
  "filterVars": [],
  "ver": 2,
  "tempVars": []
}
```

Controls inside `children` should use UUID-style IDs. Bound controls must bind to storage `FieldName` values such as `Title`, `Text1`, `Datetime1`, or `Bit1`, and should include the matching `fieldID`.

## 3. Failed Versions And Lessons

### v2

Result:

- The list imported.
- Custom form registration was incomplete.
- Display settings were still using Default form.

Lesson:

- A custom form layout alone is not enough.
- `Item.ListModel.LayoutView` must assign New/Edit/View to the custom form `LayoutID`.
- `LayoutInResources` must include real-export-style metadata.

### v3

Result:

- The custom form registered.
- New/Edit/View assignment worked.
- The form opened, but the form content was still not reliable.

Lesson:

- Real embedded custom forms use:
  - `LayoutView: null`
  - `LayoutInResources[0].ID`
  - `LayoutInResources[0].RefId`
  - `LayoutInResources[0].Resource`

### v4

Result:

- Assignment was preserved.
- Yeeflow accepted the custom form layout.
- On export-back, Yeeflow dropped `LayoutInResources` and exported it as `[]`.

Lesson:

- `LayoutInResources[0].ID` and `RefId` cannot be separate generated resource IDs.
- They must match the custom form `LayoutID`.

### v5

Result:

- Import works.
- New/Edit/View assignment works.
- Custom form designer opens.
- Custom form controls render.

Lesson:

- The custom form resource identity must be tied directly to the layout identity.

## 4. Required Validator Checks

`validate-ydl-list.js` must enforce or warn on these checks in generator/final mode.

Hard checks:

- Assigned custom forms cannot have empty `children`.
- Custom form `LayoutInResources` must exist.
- `LayoutInResources[0].Resource` must exist and parse as JSON.
- `LayoutInResources[0].ID` must equal `Layout.LayoutID`.
- `LayoutInResources[0].RefId` must equal `Layout.LayoutID`.
- Bound custom form controls must reference existing fields.
- New/Edit/View assignment must point to a valid custom form layout when a generated custom form is intended for use.

Warnings or strict generator checks:

- Custom form `LayoutView` should be `null`.
- `Ext2` should be `{"src":true}`.
- `IsItemPerm` should be `false`.
- Custom form control IDs should be UUID-style.

## 5. Generation Rules

Generated data-list packages should:

- Generate `ListModel` metadata close to real exports.
- Populate `Resource.ReplaceIds`.
- Use Yeeflow-style large numeric string IDs.
- Use UUID-style custom form control IDs.
- Bind custom form controls to valid `FieldName` values.
- Include matching `fieldID` on bound controls.
- Use `container`, `text`, and `flex_grid` controls for usable forms.
- Use two-column desktop/tablet grids and one-column mobile grids where appropriate.
- Use `attrs.common.grid.position` with `cSpan: 2` for full-width long text controls.
- Keep custom form `LayoutInResources[0].ID` and `RefId` equal to `LayoutID`.

For the Asset Inventory baseline, the custom form includes:

- Asset Inventory section:
  - Asset Name
  - Asset Tag
  - Category
  - Serial Number
  - Manufacturer
  - Model
- Assignment and Lifecycle section:
  - Assigned To
  - Department
  - Location
  - Status
  - Condition
  - Active
- Purchase and Warranty section:
  - Purchase Date
  - Warranty Expiry
  - Purchase Cost
  - Vendor
- Notes section:
  - Notes

## 6. Sandbox Test Checklist

After importing a generated `.ydl` package in sandbox:

1. Confirm the list imports successfully.
2. Confirm fields are created.
3. Confirm views are created.
4. Confirm sample records import if included.
5. Confirm the custom form appears in list forms.
6. Confirm New/Edit/View display settings use the custom form.
7. Open the custom form designer.
8. Confirm controls render on the canvas.
9. Create a new item and save it.
10. Edit an item and save changes.
11. View an item and confirm the form opens correctly.
12. Export the list back to `.ydl`.
13. Decode the export-back file and verify `LayoutInResources` remains populated.
14. Confirm `LayoutInResources[0].ID` and `RefId` still match the remapped `LayoutID`.

If export-back shows `LayoutInResources: []`, the custom form resource was not accepted by import and the generated package is not production-candidate.
