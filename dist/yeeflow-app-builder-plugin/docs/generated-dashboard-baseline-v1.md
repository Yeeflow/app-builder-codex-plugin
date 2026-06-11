# Generated Dashboard Baseline v1

Package: `generated-dashboard-minimal-v1.yap`

Status: successful minimal runtime baseline.

## What It Proves

This package proves the smallest generated Yeeflow dashboard app can import and open when it follows the minimal dashboard-only export pattern:

- one root app/listset
- one Type `103` dashboard layout
- no child lists
- no approval forms
- no reports
- no widgets
- no embedded `LayoutInResources[0].Resource`
- no external dependencies

## Resources Included

| Resource | ID |
| --- | --- |
| Root app/listset | `2350010000000000000` |
| Dashboard page `Dashboard` | `2350010000000000001` |

Runtime import remapped these to:

| Runtime Resource | ID |
| --- | --- |
| Root app/listset | `2054181554945273857` |
| Dashboard page `Dashboard` | `2054181564731764736` |

## Feature Pattern

The dashboard page lives in root `Data.Item.Layouts[]`:

- `Type: 103`
- `LayoutView: null`
- `Ext2: "{\"src\":true}"`
- `LayoutInResources: []`
- root `ListModel.LayoutView.sort[]` contains two `Type: 103` navigation entries targeting the dashboard `LayoutID`

The package arrays `AppTags`, `AppMetadatas`, `AppThemes`, `AppComponents`, and `OtherModules` are present. For this minimal export, they are empty.

## ReplaceIds Rules

The minimal package includes exactly:

- dashboard `LayoutID`
- root app/listset `ListID`

It does not include tenant/user metadata IDs and does not invent `LayoutInResources` IDs.

## Validation Results

Passed:

- `node --check decode-yap-resource.js`
- `node --check generate-dashboard-minimal-v1.mjs`
- `node --check inspect-dashboard-pages.js`
- `node --check validate-yap-package.js`
- `node --check validate-yap-graph.js`
- decoded resource package validation: `pass_with_warnings` for `APP_THEME_EMPTY`
- decoded resource graph validation: `pass`
- wrapper build and round-trip validation: `pass`
- wrapped `.yap` package validation: `pass_with_warnings` for `APP_THEME_EMPTY`
- wrapped `.yap` graph validation: `pass`

Wrapper round-trip:

- wrapper JSON valid
- Resource prefix valid
- base64 valid
- gzip valid
- Resource JSON valid
- Resource.Data JSON valid
- decoded data equals source
- package validation passes on wrapper
- graph validation passes on wrapper

## Runtime Results

Tested at `https://<yourdomain>.yeeflow.com/`.

Observed:

- file upload succeeded
- import metadata dialog parsed the package name, description, and icon
- final app creation completed
- app appeared in Shared Workspace after refresh
- app opened at `Dashboard | Generated Dashboard Minimal v1`
- dashboard navigation rendered
- empty dashboard page shell rendered with `OPEN PAGE DESIGNER`

## Generator Rules Learned

- Start dashboard generation with the empty Type `103` dashboard shell before adding widgets.
- For the first minimal package, keep `LayoutInResources` as an empty array.
- Include only the root app/ListSet ID and dashboard `LayoutID` in `ReplaceIds`.
- Keep root navigation entries aligned to the dashboard `LayoutID`.
- Keep `Ext2: "{\"src\":true}"`.
- Preserve tenant/user metadata from the source baseline; do not remap those values into a generated local ID family.
- Use a fresh ID family for every import test.
- Add child lists, embedded dashboard page JSON, widgets, and `exts` only as follow-up isolation packages.

## Known Gaps

- Export-back comparison has not yet been performed.
- Static dashboard page JSON is now proven separately in `docs/generated-dashboard-baseline-v2-simple-elements.md`.
- Widget schema and `exts` runtime binding are not proven by this baseline.
- Service Desk Pro-style dashboards need a staged rebuild from these baselines rather than direct generation from the complex export.
