# Yeeflow Feature Learning Hard Rules

## Native Title Field Rule

Every generated data list must preserve `Title` as native:

- `FieldName: Title`
- `Status: 0`
- `IsSystem: true`
- `IsIndex: true`

Wrong `Title` metadata can cause data list `datas/query` HTTP `400`.

## App-Level Approval Form Rule

For approval forms in `.yap`:

- `Data.Forms[].ListID = 0`
- `ProcModelID` carries the process ID

## Fresh ID Rule

Every generated `.yap` import test must use a fresh local ID family.

Every approval form must use a fresh `FlowKey`/form key.

Never reuse an imported generated ID family for another import test.

## Root App Shell Rule

Generated `.yap` app root must include:

- non-null `IconUrl`
- root `CustomType = ""`
- root `Perm = 0`
- root `WorkspaceID` present
- root `LayoutView` navigation populated
- Type `103` app page layout
- `AppTags`, `AppMetadatas`, and `AppComponents` arrays
- `AppThemes` present
- root `CreatedBy` and `ModifiedBy` populated

## Root App Page Resource Rule

For Type `103` app page:

- `LayoutID` included in `ReplaceIds`
- `LayoutInResources[0].ID` / `RefId` are separate resource IDs
- `LayoutInResources` resource IDs excluded from `ReplaceIds`

## App-Level Internal Lookup Sample Data Rule

Internal lookup sample values may reference target sample records in the same `.yap`.

Those local target IDs should be included in `ReplaceIds`.

External dependency lookup sample IDs should be excluded from `ReplaceIds`.

## Runtime Query Smoke Rule

After import, data lists must open without:

`api/crafts/datas/{AppID}/{ListID}/query -> 400`

If query fails but metadata endpoints succeed, inspect field metadata, especially `Title`.

## Sensitive Dependency Rule

Never bundle secrets or tenant credentials.

Do not bundle large `.yap`, `.ydl`, or `.ywf` exports in skills.

Keep raw export examples out of skills unless they are very small sanitized samples.

Document sensitive dependencies as requirements or stop conditions without exposing values.

