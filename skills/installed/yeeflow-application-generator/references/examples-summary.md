# Examples Summary

## Proven Baseline: Department Access Management v5

Use `references/baseline-department-access-management-v5.md` for the full evidence.

The app contains:

- `Departments` data list
- `Department Access Requests` data list
- `Department Access Request` approval form

Proven sandbox result:

- app imports
- import dialog shows name, description, and icon
- app opens from workspace
- app header/navigation renders
- both lists open
- Departments sample rows display
- request sample rows display
- approval form opens and renders

Critical learned rules:

- root app shell must be complete
- wrapper `IconUrl` must be non-null
- root `CustomType = ""`
- root `Perm = 0`
- root `WorkspaceID` present
- root `LayoutView` navigation populated
- root Type `103` app page exists
- Type `103` page `LayoutID` is included in `ReplaceIds`
- Type `103` page `LayoutInResources` IDs are separate from `LayoutID` and excluded from `ReplaceIds`
- `AppTags`, `AppMetadatas`, and `AppComponents` arrays exist
- `AppThemes` is non-empty
- root `CreatedBy` and `ModifiedBy` populated

## Related Lookup Samples

Standalone `.ydl` external lookup:

- target list is imported separately
- target record IDs are external
- exclude target record IDs from the dependent package `ReplaceIds`

App-level `.yap` internal lookup:

- target and dependent lists are packaged together
- target sample record IDs are local package IDs
- include target sample record IDs in `ReplaceIds`
- dependent sample lookup values may reference local target sample IDs as plain strings
- export-back proved Yeeflow remaps both target records and dependent lookup values consistently

## First Future App Pattern

For a new small app, start with:

- one root app/listset
- one reference list
- one transactional list
- one lookup from transactional list to reference list
- one approval form
- one `ContentList` action writing to the transactional list

Avoid reports, dashboards, AI resources, connections, document libraries, and external actions until the base app imports and export-back comparison passes.

## Current Advanced Baseline: Visitor Access Management v11

Use `references/baseline-visitor-access-management-v11.md` for the full evidence chain.

Proved:

- fresh `216...` ID family
- fresh FlowKey/form key `VBB`
- app-level approval form `Data.Forms[].ListID = 0`
- multi-field expansion after field types were proven
- text/input, number/input_number, radio/dropdown, switch/boolean, and conditional display
- app package validation, graph validation, approval form validation, wrapper round-trip, and runtime import test

Proven storage and `ContentList` mappings:

- `VisitorEmail -> Text13`
- `VisitorPhone -> Text14`
- `NumberofVisitors -> Decimal1`
- `AccessType -> Text15`
- `RequiresEscort -> Bit1`

Sample value shapes:

- Decimal: numeric
- choice/dropdown: selected option text
- data-list Bit/switch: `"1"` / `"0"`
- approval switch: boolean `true` / `false`

Use this baseline before generating richer app-level packages with multiple field/control types.
