# Minimal Dashboard Pattern

Source of truth: `Test Dashboard Only.yap`.

Proven generated package: `generated-dashboard-minimal-v1.yap`.

Runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace after refresh, opened as `Dashboard | Generated Dashboard Minimal v1`, and rendered the empty dashboard page shell.

## App Shape

- root app/listset only
- `Data.Childs: []`
- `Data.Forms: []`
- `Data.FormReports: []`
- `Data.DataReports: []`
- `Data.FormNewReports: []`
- `Data.AppGroups: []`
- `Data.AppTags: []`
- `Data.AppMetadatas: []`
- `Data.AppThemes: []`
- `Data.AppComponents: []`
- `Data.OtherModules: []`

## Root ListModel

Required fields observed in the working export:

- `AppID: 41`
- `Type: 1024`
- `Perm: 0`
- `CustomType: ""`
- `WorkspaceID` present
- `IconUrl` non-empty
- `CreatedBy` and `ModifiedBy` populated
- `LayoutView` parseable JSON

`LayoutView.sort[]` contains two dashboard navigation entries:

- `AppID: 41`
- `ListID = dashboard LayoutID`
- `ListSetID = root ListID`
- `Type: 103`
- `Title: "Dashboard"`

The first nav entry includes `IsHidden: false`; the second does not.

## Dashboard Layout

The working minimal dashboard is a root `Data.Item.Layouts[]` entry:

- `LayoutID`: local dashboard page ID
- `ListID`: root app/ListSet ID
- `Type: 103`
- `Title: "Dashboard"`
- `LayoutView: null`
- `Ext2: "{\"src\":true}"`
- `IsDefault: false`
- `IsItemPerm: false`
- `LayoutInResources: []`

Do not invent `LayoutInResources[0].Resource` for the first minimal package.

## ReplaceIds

For the minimal dashboard-only pattern, `ReplaceIds` contains exactly:

1. dashboard `LayoutID`
2. root app/ListSet `ListID`

Do not include tenant IDs, user IDs, workspace IDs, or non-local external references.

## Generation Rules

- Clone the minimal export structure.
- Remap only root app/ListSet ID and dashboard LayoutID into a fresh local ID family.
- Preserve source tenant/user metadata for the same Yeeflow sandbox.
- Keep `AppThemes` empty for the minimal baseline; this is warning-only.
- Build the wrapper and round-trip validate.
- Import-test before adding child lists, widgets, embedded page JSON, or `exts`.
