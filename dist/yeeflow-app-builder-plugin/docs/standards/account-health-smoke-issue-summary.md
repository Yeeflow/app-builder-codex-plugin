# v0.6.5 Account Health Smoke Issue Summary

Date: 2026-06-01

Workspace: `/Users/Renger/Documents/Codex Projects/Yeeflow Test Applications`

Final package:

`/Users/Renger/Downloads/v0.6.5-runtime-smoke-account-health-container-width-fixed.yapk`

Final report:

`/Users/Renger/Downloads/v0.6.5-runtime-smoke-account-health-container-width-fixed.report.json`

## Scope

This smoke test used the installed Yeeflow App Builder v0.6.5 plugin resources only. The target was a YAPK-only Account Health smoke app with:

- Data list: Accounts
- Data list: Health Signals
- Current dashboard: Account Health Dashboard
- No YAP
- No custom forms
- No print page
- No workflow
- No Kanban or Collection

The package was installed/upgraded through guarded API helper calls. API acceptance was treated only as package install/upgrade acceptance, not as runtime render proof.

## Issue 1: Health Signals Was Not Modeled As Dependent Data

### What Was Found

The first generated package had two lists, but `Health Signals` did not contain a real lookup relationship to `Accounts`.

The new Data List Generation Standard audit reported:

`LOOKUP_TARGET_LIST_MISSING`

### Why It Happened

The first smoke package focused on the v0.6.5 structural YAPK gates: schema shape, API-issued IDs, native Title, `List.Items`, dashboard shell, and basic table bindings. It treated the account relationship as ordinary text-like signal data rather than a runtime-facing master/detail relationship.

That meant local schema checks could pass while the app still failed the new data-list quality standard. The validator saw lists and fields, but the data model was not business-usable because Health Signals could not resolve back to Accounts.

### Fix

Generated the corrected package:

`/Users/Renger/Downloads/v0.6.5-runtime-smoke-account-health-data-list-standard-fixed.yapk`

Changes:

- Kept `Accounts` as the master/reference list.
- Generated `Health Signals` after `Accounts`.
- Added a real Yeeflow lookup field on `Health Signals` pointing to `Accounts`.
- Set lookup target metadata with app/list-set/list/display-field information.
- Used `Accounts.Title` as the lookup display field.
- Seeded `Accounts` sample rows before `Health Signals` sample rows.
- Set Health Signal sample lookup values to valid Account sample row IDs.
- Expanded business-specific choice fields and default view field sets.

Result:

- Data List Generation Standard: pass
- Existing v0.6.5 gates: pass

## Issue 2: Optional Date Fields Failed Storage-Family Validation

### What Was Found

An intermediate corrected package failed the installed data-list schema gate with:

`FIELD_STORAGE_FAMILY_MISMATCH`

### Why It Happened

The generated optional date fields used a storage family spelling that did not match the installed v0.6.5 validator's expected `FieldName`/`FieldType` alignment. This was caught before handoff, during self-check.

The date fields were not required for the scoped smoke test. Keeping them would have increased risk without helping prove the requested Account Health list/dashboard behavior.

### Fix

Removed the optional date fields from the corrected package before final handoff, then re-signed and revalidated.

Result:

- Data-list schema gate: pass
- First-generation preflight: pass
- No date-field runtime risk carried forward

## Issue 3: Data List Default Views Installed But Rendered With No Display Fields

### What Was Found

After install, the runtime data views `All Accounts` and `All Health Signals` still showed no display fields.

### Why It Happened

The generated list layouts had `Layouts[].LayoutView.layout` entries, but the view records were too minimal for runtime materialization. They were missing export-proven data-view metadata, especially:

- `Layouts[].Ext1 = {"Url":"default"}`
- export-shaped visible column objects with `FieldID`, `FieldName`, `DisplayName`, `Order`, `Mobile`, and `Show`
- full list-view `LayoutView` keys such as `layout`, `query`, `sort`, `rowColor`, and `filter`

The local validators checked that view fields existed, but they did not catch the runtime requirement that the data-view record itself needs the fuller export-shaped view metadata.

### Fix

Generated and upgraded:

`/Users/Renger/Downloads/v0.6.5-runtime-smoke-account-health-data-list-view-fixed.yapk`

Changes:

- Renamed default views to export-proven `All Items`.
- Set each default view `Type = 0`.
- Set `IsDefault = true`.
- Set `IsItemPerm = false`.
- Added `Ext1.Url = "default"`.
- Rebuilt visible columns as export-shaped objects with field IDs and display metadata.
- Preserved meaningful visible fields:
  - Accounts: `Title`, `Text2`, `Text4`, `Text3`, `Text1`, `Decimal5`
  - Health Signals: `Title`, `Text1`, `Text2`, `Text4`, `Text3`

Result:

- Upgrade check: passed
- Upgrade apply: applied
- User confirmed the data-list display-field issue was fixed

## Issue 4: Dashboard Page Rendered Blank

### What Was Found

After the data-list view fix, the `Account Health Dashboard` page opened but was blank.

### Why It Happened

The embedded dashboard `LayoutInResources[0].Resource` was shaped as a direct `Main` object. Local validation accepted `Main > Content`, but the runtime dashboard renderer expected the full export-proven page resource wrapper.

The missing top-level page keys were:

- `children`
- `attrs`
- `title`
- `ver`
- `filterVars`
- `tempVars`
- `exts`
- `actions`

Because the page resource did not match the runtime page-builder shape, Yeeflow opened the dashboard but did not materialize the controls.

### Fix

Generated and upgraded:

`/Users/Renger/Downloads/v0.6.5-runtime-smoke-account-health-dashboard-content-fixed.yapk`

Changes:

- Rewrapped the dashboard resource as an export-proven page object.
- Kept `Main > Content` inside top-level `children`.
- Added top-level `attrs`, `title`, `ver`, `filterVars`, `tempVars`, `exts`, and `actions`.
- Added visible dashboard controls:
  - 3 native heading/Text controls
  - 2 dashboard data-table controls
- Preserved table columns with both `Field` and `FieldName`.

Result:

- Upgrade check: passed
- Upgrade apply: applied
- User confirmed dashboard controls became visible

## Issue 5: Dashboard Containers Showed Custom Width 0px

### What Was Found

After dashboard controls appeared, the `Main` and `Content` containers showed custom width with `0px`.

### Why It Happened

The generated dashboard containers included:

`attrs.style.width = "100%"`

Yeeflow Designer did not interpret that as a valid width preset. It treated the field as a custom width configuration without a valid numeric value, causing the UI to show custom width `0px`.

This was an invented container style shape. The plugin guidance says dashboard page padding should be on page-level `attrs.container.padding`, and `Main` should remain structural.

### Fix

Generated and upgraded:

`/Users/Renger/Downloads/v0.6.5-runtime-smoke-account-health-container-width-fixed.yapk`

Changes:

- Removed invented `attrs.style.width` from `Main` and `Content`.
- Removed custom style/common width settings from those containers.
- Kept `Main` and `Content` as structural containers.
- Added `nv_label` values for cleaner designer navigation.
- Kept `displayLabel = false`.
- Moved page padding to page-level `attrs.container.padding`.

Result:

- Upgrade check: passed
- Upgrade apply: applied
- User confirmed the container width issue was fixed

## Validation Summary

The final package passed:

- Canonical YAPK schema validation
- Schema-v3 YAPK hardening validator
- Data-list schema validation
- First-generation preflight
- Signing and `verifysign`
- Data List Generation Standard checks
- Runtime manual checks for:
  - data-list display fields
  - dashboard controls rendering
  - container width settings

The validator still reports the proof-boundary code:

`YAPK_CONTENT_GENERATION_RUNTIME_PROOF_REQUIRED`

That is expected. It means local/API validation does not automatically prove every runtime UI behavior; manual runtime review remains required.

## Root Cause Analysis

The main pattern across the issues was that local schema/API acceptance was weaker than runtime materialization.

Three different layers were involved:

1. Structural schema validity:
   The YAPK could be schema-valid, signed, verified, installed, or upgraded.

2. Local generator validation:
   The package could pass local checks for fields, IDs, dashboard shell, `Main > Content`, and table bindings.

3. Runtime designer/materialization behavior:
   Yeeflow still required export-shaped view metadata, full dashboard page resource wrappers, and valid designer style settings.

The missing pieces were not raw schema fields alone. They were runtime-facing conventions learned from exports:

- Data views need `Ext1.Url` and export-shaped column objects.
- Dashboard resources need the full page wrapper, not only a `Main` node.
- Container widths should use known positioning/style patterns or omit width settings; invented style keys can map to broken Designer state.

## Lessons For Future Generation

- Treat API install/upgrade success as acceptance only, not runtime render proof.
- For data-list default views, require export-shaped `Layouts[].Ext1` and column objects, not just a non-empty `LayoutView.layout`.
- For dashboard pages, require full page resource keys: `children`, `attrs`, `title`, `ver`, `filterVars`, `tempVars`, `exts`, and `actions`.
- Do not invent container width/style settings.
- Keep `Main` structural and apply dashboard page padding at page-level `attrs.container.padding`.
- Promote runtime feedback into validators where possible, because these gaps passed earlier local checks.

## Final State

Final upgraded package:

`/Users/Renger/Downloads/v0.6.5-runtime-smoke-account-health-container-width-fixed.yapk`

Final redacted report:

`/Users/Renger/Downloads/v0.6.5-runtime-smoke-account-health-container-width-fixed.report.json`

No YAP was generated. No secrets, raw IDs, tenant IDs, workspace IDs, upload IDs, private URLs, raw API responses, raw `Resource`, raw `Sign`, or decoded payloads were printed. No commit, push, or tag was made.
