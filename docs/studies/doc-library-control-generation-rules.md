# Doc Library Control Generation Rules

These rules come from `Enterprise Document Center Folders Runtime.yap`, which contains dashboard Doc library controls in a runtime-exported app.

## Supported In V3 Generation

- Generate Doc library controls on Type `103` dashboards with `type = "document-library"`.
- Link controls to Type `16` document libraries through `attrs.data.list`.
- Link controls to root folders through `attrs.data.folder.path = "0/<folder ListDataID>"`.
- Populate `attrs.listarr` with fields that resolve on the target document library.
- Use caption settings when needed:
  - `caption.display = true`
  - `caption.add = true`
  - `caption.search = true`
  - `caption.placeholder`
  - `caption.addtext`
  - `caption.layout = <target library New file form LayoutID>`
  - `caption.op = "modal"`
- Keep generated packages free of uploaded document rows and document binaries.

The generated `Enterprise Document Center - Doc Library Control` v3 package runtime-proved these dashboard cases:

- root-bound controls for Type `16` document libraries
- static root-folder-bound controls
- caption/search/add enabled settings
- add button opening the target library action menu and `New file` modal
- generated folder rows rendering inside dashboard controls after refresh/navigation

## Dashboard Page Placement

Dashboard page content should stay in:

`Item.Layouts[].LayoutInResources[0].Resource`

For generated inline dashboard pages, keep:

- `Layout.Type = 103`
- `Layout.LayoutView = null`
- `Layout.Ext2 = {"src": true}`
- `LayoutInResources[0].ID = LayoutID`
- `LayoutInResources[0].RefId = LayoutID`
- `LayoutInResources[0].Resource` as a JSON string

## Folder Binding

For a root folder:

```json
{
  "data": {
    "list": {
      "ListID": "__DOCUMENT_LIBRARY_LIST_ID__",
      "Type": 16,
      "Title": "__DOCUMENT_LIBRARY_TITLE__",
      "ListSetID": "__APP_ROOT_LISTSET_ID__"
    },
    "folder": {
      "path": "0/__FOLDER_LISTDATA_ID__",
      "label": "__FOLDER_TITLE__"
    }
  }
}
```

The folder row must exist in the target document library `ListDatas` and use the document-library folder shape. For generated root folders, use `Bigint1 = "0"` and omit `Text4`.

## Dynamic Folder Path

The runtime export observed `attrs.data.customPath` as an expression-token array appended to a static folder base. Example token classes:

- string literal token: `{ "type": "str", "value": "..." }`
- concat operator: `{ "type": "op", "op": "&" }`
- temp variable token: `{ "exprType": "variable", "valueType": "string", "id": "__temp_var_Location", "type": "expr", "name": "var_Location" }`

Generation of dynamic folder controls is deferred until a focused generated-package runtime test proves the behavior. Validators should recognize the shape and warn on malformed tokens.

## Form Contexts

The user confirmed the control is available on dashboards, approval forms, data-list forms, and document-library forms.

The form-host pass generated `Enterprise Document Center - Form Hosted Doc Library` and confirmed these additional patterns:

- The same `type = "document-library"` control schema can be embedded in approval-form page JSON and renders in the form designer/runtime preview.
- The same control schema can be embedded in document-library custom forms; the generated `Company Policies` custom add form opened at runtime and rendered a `Templates and Forms` Doc library control.
- `caption.search = false` and `caption.add = false` are accepted for a document-library-form-hosted control; the runtime modal showed no search box and no add button for the related templates control.
- Approval-form live request proof is currently blocked by workflow task-node configuration, not by the Doc library control schema. The `Document Review` assignment task must set both a valid task assignee and the correct task form setting before publish/live-open proof can be claimed.

Do not claim fully published approval-form host runtime until a fresh generated package fixes the workflow/task-node configuration, imports, publishes, opens as a request form, and the Doc library controls are checked outside designer preview. Do not claim data-list custom-form host runtime until the data list can be reached in the imported app and its custom forms open with the controls rendered.

## Validator Recommendations

- Warn if a Doc library control target list is missing.
- Warn if the target is not a Type `16` document library.
- Warn if `attrs.listarr` fields do not resolve on the target library.
- Warn if `attrs.data.folder.path` folder IDs do not resolve to folder rows on the target library.
- Warn if a referenced folder row has upload payload data.
- Warn if `caption.layout` does not resolve to a layout on the target document library.
- Warn if caption flags are not booleans.
- Keep unresolved target-list references as hard generator errors through the existing dashboard data-list reference check.
