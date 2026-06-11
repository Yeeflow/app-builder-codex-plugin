# Doc Library Control Dashboard Study

Source export studied read-only: `/Users/Renger/Downloads/Enterprise Document Center Folders Runtime.yap`.

Decoded inspection artifact: `tmp/doc-library-control-study/20260518-runtime-export/` (ignored, not committed).

## Export Context

The export is a manually updated runtime application based on the generated Enterprise Document Center folder package. It contains the three generated Type `16` document libraries and a root Type `103` dashboard named `Document Center`.

Document libraries found:

| Library | Type | Folder evidence |
| --- | ---: | --- |
| Company Policies | `16` | Root folders plus manually created nested folders under `HR Policies` |
| Project Documents | `16` | Generated root folders |
| Templates and Forms | `16` | Generated root folders plus one runtime-check folder |

No uploaded document binaries are needed to understand the dashboard control shape.

## Dashboard Control Shape

The `Document Center` dashboard embeds its page JSON in:

`Item.Layouts[].LayoutInResources[0].Resource`

The Doc library control uses:

- `type = "document-library"`
- `nv_label = "Doc library"`
- `attrs.data.list` for the target document library
- `attrs.data.folder` for static folder binding
- `attrs.data.customPath` for dynamic folder-path expression tokens when configured
- `attrs.listarr` for visible columns
- optional `attrs.caption` and `attrs["caption-style"]`
- standard `header`, `body`, and `common` style blocks

The target list reference shape is:

```json
{
  "AppID": 41,
  "ListID": "__DOCUMENT_LIBRARY_LIST_ID__",
  "Type": 16,
  "Title": "__DOCUMENT_LIBRARY_TITLE__",
  "ListSetID": "__APP_ROOT_LISTSET_ID__"
}
```

## Controls Found

| Control | Target | Mode | Folder binding | Caption/search/add |
| --- | --- | --- | --- | --- |
| HR policies with custom path | Company Policies | dynamic folder path over a static root folder | `folder.path = "0/<HR Policies folder id>"`; `customPath` expression appends child folder segments | not present |
| HR policies static | Company Policies | static folder | `folder.path = "0/<HR Policies folder id>"` | not present |
| Project Documents | Project Documents | root library | no `folder` key | not present |
| Templates and Forms | Templates and Forms | root library | no `folder` key | `display/add/search = true`, custom placeholder/add text, `layout` points to `New file` form |

Static sub-folder display was not present as a direct `folder.path = 0/<root>/<child>` control. The export does prove nested folder rows in `ListDatas` and a dynamic `customPath` token array, but generated dynamic/sub-folder dashboard controls should remain deferred until a focused runtime test proves navigation and persistence.

## Folder Reference Findings

Static folder binding uses the document-library folder row `ListDataID` inside `attrs.data.folder.path`.

For a root folder:

```json
{
  "folder": {
    "path": "0/__FOLDER_LISTDATA_ID__",
    "label": "__FOLDER_TITLE__"
  }
}
```

The referenced folder row in `ListDatas` keeps the previously learned folder shape:

- `ListDataID` equals the row key
- `Title` is the folder name
- `Bigint1 = "0"` for root folders
- `Text1 = "folder"`
- `Bigint2 = ""`
- `Text2 = ""`
- `Text3 = "0_<lowercase folder title>"`
- no `Text4` upload payload

Nested rows observed in the export use `Bigint1 = <parent folder ListDataID>` and `Text3 = "<parent folder ListDataID>_<lowercase folder title>"`.

## Caption Findings

The export-proven caption block supports:

- `display: true`
- `add: true`
- `search: true`
- `placeholder`
- `addtext`
- `layout`: target library `New file` form `LayoutID`
- `op: "modal"`

The export does not prove `add: false`, `search: false`, or `display: false`. Generators may expose those as product-informed options, but docs and validators should mark them as not runtime-proven by this export.

## ID Replacement Rules

Replace these values during generation:

- `attrs.data.list.ListID`
- `attrs.data.list.ListSetID`
- `attrs.data.folder.path` folder IDs
- `attrs.caption.layout`

Do not add dashboard control UUID ids to `ReplaceIds`. The folder IDs referenced by `folder.path` are already generated `ListDataID` values and should be in `ReplaceIds` through the folder rows.

## Generated V3 Runtime Result

Generated package: `enterprise-document-center-doc-library-control-v3.yap` (ignored/uncommitted).

Runtime-tested in `https://<yourdomain>.yeeflow.com` on 2026-05-18.

Status: dashboard Doc library controls are runtime-proven for root-library display, static root-folder display, caption/search/add enabled settings, and target `New file` modal launch.

Observed results:

- Package imported successfully.
- App opened correctly and did not open as an empty shell.
- Navigation showed `Document Center`, `Company Policies`, `Project Documents`, and `Templates and Forms`.
- `Document Center` dashboard opened and rendered after refresh and after navigating through library pages.
- `Company Policies Root` rendered root folders: `HR Policies`, `IT Policies`, `Finance Policies`, `Compliance Policies`.
- `HR Policies Folder` rendered the `Company Policies / HR Policies` folder context and showed an empty table because no files/subfolders were generated inside that folder.
- `Project Contracts Folder` rendered the `Project Documents / Contracts` folder context and showed an empty table because no files/subfolders were generated inside that folder.
- `Templates Root` rendered root folders: `HR Forms`, `Finance Forms`, `Project Templates`, `Legal Templates`.
- Caption title, search box, and add button appeared for each generated control.
- Add button opened the target document-library action menu; `New File` opened the target `New file` modal with the upload field. The modal was closed without uploading a file.
- Generated folders also appeared in each native document library page after import and navigation.

This runtime proof does not include actual file upload, disabled caption/search/add states, generated dynamic `customPath` controls, or form-hosted Doc library controls.

## Unproven

- Approval form, data-list form, and document-library form contexts.
- Add/search/caption disabled states.
- Static sub-folder control binding.
- Dynamic folder-path runtime behavior in generated packages.
- Upload behavior from inside a Doc library dashboard control.
