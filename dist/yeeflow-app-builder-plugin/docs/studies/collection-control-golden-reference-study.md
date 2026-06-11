# Collection Control Golden Reference Study

Branch: `codex/complete-collection-yapk-card-reference`

## Samples Inspected

This round inspected the YAP and YAPK exports of the same sample application, `Company Overview`, as local-only references. Raw files were not copied into the repo.

| Sample | Package type | Decode result | Collection result |
| --- | --- | --- | --- |
| `Company Overview (5).yap` | YAP | decoded successfully through the `[______gizp______]` gzip wrapper and `Resource.Data` JSON | all three target Collection card surfaces decoded |
| `Company Overview-v1 Collection study.yapk` | YAPK | wrapper parsed, strict Brotli ended with `Z_BUF_ERROR`, Research/Builder tolerant Brotli emitted complete parseable `AppPackageInfo` JSON | all three target Collection card surfaces decoded |

YAPK decode attempts were limited to safe local inspection. Base64 decode succeeded, strict Brotli ended with `Z_BUF_ERROR`, gzip/zlib/deflate variants failed, and the installed Research/Builder tolerant Brotli path decoded the payload to `AppPackageInfo`. Do not print or commit the raw `Resource`, raw `Sign`, decoded payload, tenant/workspace/upload id, private URL, screenshot, or raw API response.

## Scope of Proven Collection Support

This study proves the Collection card-style responsive grid pattern only. It does not prove all Yeeflow Collection control patterns.

Proven pattern name:

- `collection_control_responsive_card_grid`

Proven supporting templates:

- `collection_control_card_with_item_actions`
- `collection_control_card_with_multiselect_toolbar`

Proven package formats:

- YAP
- YAPK, using tolerant Brotli decode for validation/study when strict Brotli ends with `Z_BUF_ERROR`

Proven surfaces:

- dashboard
- approval form
- data-list form

Proven behavior:

- responsive 3/2/1 card grid
- item card display
- item-level actions
- Collection root actions
- multiselect toolbar
- absolute top-right selection container

Unproven Collection patterns:

- Collection + Grid/table-style
- table-like Collection
- row-list Collection
- kanban-style Collection
- grouped Collection
- nested Collection
- timeline-style Collection
- gallery/media variants beyond the studied card reference
- unknown non-card Collection styles
- unknown non-card YAPK Collection styles

Any generated-final non-card Collection usage must stay guarded until a separate export-backed study proves the exact pattern.

Decoded YAPK structural summary:

- `AppPackageInfo` found: yes.
- top-level keys include `ListSet`, `Pages`, `Forms`, `FormReports`, `FormNewReports`, `DataReports`, `Themes`, `PortalInfo`, and `Childs`.
- pages: 6.
- forms: 1.
- childs: 1.
- fields: 16.
- layouts: 4.
- Collection controls found: yes.

## Target Surface Confirmation

| Surface | Expected name | Found in YAP | Found in YAPK | Collection count | Status |
| --- | --- | ---: | ---: | ---: | --- |
| Dashboard | `Collection of activity` | yes | yes | 1 | YAP and YAPK decoded and structurally learned |
| Approval form | `Collection in Approval form` | yes | yes | 1 | YAP and YAPK decoded and structurally learned |
| Data list form | `Collection in Data list form` | yes | yes | 1 | YAP and YAPK decoded and structurally learned |

The same card-style Collection structure appears on all three decoded YAP surfaces and all three decoded YAPK target surfaces.

## YAP vs YAPK Structural Comparison

| Area | YAP shape | YAPK shape | Common rule | Format-specific rule |
| --- | --- | --- | --- | --- |
| Wrapper/encoding | gzip marker plus decoded `Resource.Data` | `AppExportPackageInfo` with top-level base64 Brotli `AppPackageInfo`; strict Brotli can end with `Z_BUF_ERROR`, tolerant Brotli succeeds | inspect only decoded structural controls | YAPK study/validation must use the safe tolerant Brotli helper and never print decoded payloads |
| Resource location | root `Resource.Data` contains app/listset JSON | decoded `AppPackageInfo` | Collection checks require decoded app JSON | YAPK decode failure still blocks generated-final Collection |
| Dashboard location | `Data.Item.Layouts[]`, Type `103`, `LayoutInResources[].Resource` | `Pages[].LayoutInResources[].Resource` | page JSON contains Collection tree | inspect each YAPK page layout resource |
| Approval form location | `Data.Forms[].DefResource.pageurls[].formdef` | decoded `Forms[].DefResource -> pageurls[].formdef` | formdef contains `children`, `attrs`, `actions`, `formAction`, `exts` | decode form `DefResource` before Collection inspection |
| Data-list form location | `Data.Childs[].Layouts[].LayoutInResources[].Resource` | `Childs[].Layouts[].LayoutInResources[].Resource` | child-list layout resource contains Collection tree | inspect layout resources, not just `LayoutView` |
| Root control | `type: "collection"`, `label: "Collection"` | same | root type/label are required | common card control tree applies to YAP and YAPK |
| Data binding | `attrs.data.list` with `AppID`, `ListID`, `Type`, `Title`, `ListSetID` | same card binding shape | source list and fields must resolve | wrapper list/field source differs by format |
| Responsive columns | `attrs.layout.col: [null, null, 2, 1]`; desktop 3 is implicit/default, tablet 2, mobile 1 | same | card grid default is 3/2/1 for this template | YAPK validator should enforce this for card template requests |
| Actions | `attrs.actions[]` with `type: "coll"` and child `attrs.control_action` triggers | same; root action count 4 | actions must carry `ListDataID` / `__ctx_coll` | Collection actions, form actions, and item control actions remain separate |

## Three-Surface Comparison

| Area | Dashboard `Collection of activity` | Approval form `Collection in Approval form` | Data-list form `Collection in Data list form` | Common rule | Surface-specific rule |
| --- | --- | --- | --- | --- | --- |
| Wrapper | Type `103` dashboard page | approval form `DefResource.pageurls[].formdef` | child data-list layout resource | same Collection card tree | generate into the correct host wrapper |
| Collection path | nested under page containers | nested under form body containers | nested under data-list form containers | parent container then Collection | validate surface context when template requests it |
| Header above Collection | section heading and toolbar container | same structure | same structure | `section_header + operation_toolbar + responsive_collection_card_grid` | form wrappers may include `formAction` / `exts` |
| Selected count | heading/text bound to selected item amount variable | same | same | selected-count text must bind to selected state | required only for multiselect template |
| Root attrs | `data`, `layout`, `actions`, `pagination` | same | same | preserve all generated root attrs | no `attrs.data.link` requirement |
| Data source | same local Company Overview list | same | same | `attrs.data.list` resolves | list id path differs by host |
| Item template | first child container with 10 direct children | same | same | one repeated item template | no static duplicate cards |
| Media/text/user/file | dynamic image, field, heading, user, two file controls | same | same | dynamic controls use `source: "3"` / `obj-f` | fields must exist |
| Item operations | select container, edit, mark completed, delete | same | same | child `control_action` resolves to root actions | form actions are separate from Collection actions |
| Multiselect | temp vars, checked/unchecked icons, selected count, bulk toolbar | same | same | use export-proven selected state | omit if state/actions cannot be generated safely |
| Top-right operation container | absolute container with checked/unchecked icons | same | same | `common.pos: absolute`, `hor: right`, numeric offsets | optional z-index must be numeric if present |
| Responsive | 3 desktop, 2 tablet, 1 mobile | same | same | default card grid rule | parent gap/layout must remain compatible |

## Shared Collection Card Shape

The card Collection root uses:

```json
{
  "id": "<collection-control-id>",
  "type": "collection",
  "label": "Collection",
  "attrs": {
    "data": {
      "list": {
        "AppID": 41,
        "ListID": "<source-list-id>",
        "Type": 1,
        "Title": "<source-list-title>",
        "ListSetID": "<root-listset-id>"
      },
      "sort": [{ "SortName": "Created", "SortByDesc": true }],
      "ps": 9
    },
    "layout": {
      "cg": [null, 16],
      "rg": [null, 16],
      "cp": [null, { "top": "--sp--s0", "right": "--sp--s0", "bottom": "--sp--s0", "left": "--sp--s0" }],
      "align-i": [null, "7"],
      "col": [null, null, 2, 1]
    },
    "pagination": { "p": {} },
    "actions": []
  },
  "children": [{ "id": "<item-template-id>", "type": "container" }]
}
```

`attrs.data.link` was not present in this export and must remain optional.

## YAPK Card Collection Findings

YAPK card Collection is proven for the decoded `Company Overview` card pattern only. The safe decode route is:

- parse the top-level YAPK wrapper as JSON.
- base64-decode `Resource`.
- attempt strict Brotli.
- if strict Brotli fails with `Z_BUF_ERROR`, use the Research/Builder tolerant Brotli stream path.
- parse the emitted text as `AppPackageInfo`.
- inspect only redacted resource locations; never print or commit the decoded payload.

YAPK resource locations for the proven card pattern:

- dashboard/page: `Pages[].LayoutInResources[].Resource`
- approval form: decoded `Forms[].DefResource -> pageurls[].formdef`
- data-list form: `Childs[].Layouts[].LayoutInResources[].Resource`

The YAPK card Collection root matches the YAP card root:

- root `type: "collection"`
- `label: "Collection"`
- root keys include `attrs`, `label`, `nv_label`, and `type`
- `attrs` includes `actions`, `data`, `layout`, and `pagination`
- `attrs.data` includes `list`, `ps`, and `sort`
- `attrs.layout` includes `align-i`, `cg`, `col`, `cp`, and `rg`
- `attrs.layout.col` is `[null, null, 2, 1]`
- `attrs.pagination.p` is present
- root action count is 4
- surrounding resource includes `formAction`

Observed YAPK action step families are `confirm`, `listitem`, `otheraction`, `setdatalist`, and `setvar`. Observed dynamic controls are `dynamic-field`, `dynamic-file`, `dynamic-image`, and `dynamic-user`.

## Responsive 3/2/1 Card-Grid Rule

Manual preview and decoded export together prove the card grid rule:

- PC/laptop: 3 columns, stored as the implicit/default desktop Collection card grid.
- Tablet: 2 columns, encoded in `attrs.layout.col[2]`.
- Mobile: 1 column, encoded in `attrs.layout.col[3]`.

The observed `attrs.layout.col` value is `[null, null, 2, 1]`. The first two nulls preserve the default desktop behavior; generators should treat that default as 3 columns for this card template. `attrs.layout.cg` and `attrs.layout.rg` store column/row gaps, and the parent container stores compatible gap/layout settings.

## Item Template and Child Bindings

The repeated item template is a container with these direct child regions:

- `dynamic-image` bound by `source: "3"` / `obj-f`.
- primary `dynamic-field` title.
- `heading|Text` with native `headc.title` and current-item expression.
- absolute top-right selection container with two `icon` controls.
- status/category dynamic-field group.
- progress/status dynamic-field group.
- `dynamic-user` owner/requester display.
- two `dynamic-file` displays.
- bottom operation button row.

Current-item bindings use either dynamic controls with `attrs.source: "3"` / `attrs["obj-f"]`, or expression tokens with `exprType: "variable_ctx"` and `ctx: "__ctx_coll"`. `ListDataID` is a valid system current-item field for item operations.

## Operation Buttons and Actions

The card pattern separates action layers:

- Collection root actions: `attrs.actions[]`, each with `type: "coll"`.
- Item trigger controls: child containers/buttons/icons with `attrs.control_action`.
- Item-level operations: select item, edit item, delete item, mark current item as completed.
- Form actions: approval form `formAction` remains a host/form concern and must not be confused with Collection root actions.
- Container actions: the top-right selection container uses `control_action` to invoke the Collection select action.

Observed root action step families:

- `setvar` for selected item state.
- `listitem` for modal edit using current item `ListDataID`.
- `confirm`, `setdatalist`, and `otheraction` for delete and update flows.

Generated item operations must preserve current item context and resolve action ids. Unsafe guessed actions must be omitted with a proof-boundary note.

## Multiselect and Top-Right Operation Container

The multiselect card pattern includes:

- temp variables for selected item ids and selected count.
- selected item count text above the Collection.
- toolbar above the Collection that appears when selected count is greater than zero.
- an absolute top-right operation container in every card.
- two icon controls inside that container: unchecked square and checked square.
- dynamic display rules using selected item state and current item `ListDataID`.

The top-right container uses:

- `type: "container"`
- `attrs.control_action: "<select-action-id>"`
- `attrs.common.pos: [null, "absolute"]`
- `attrs.common.hor: [null, "right"]`
- numeric `horoffset` and `veroffset`, observed as `12`
- row direction and a small gap

Icon controls must have unique ids, icon metadata, size metadata, and inline width metadata.

## Section Header and Operation Toolbar

The surface wrapper above the Collection is:

- section heading container
- operation toolbar container
- selected item count text
- responsive Collection card grid

The toolbar uses a dynamic display condition bound to the selected item count variable. Bulk operation buttons are `action_button` controls that reference Collection action ids.

## Validation Requirements

Generated-final packages using this card template should fail if:

- responsive 3/2/1 columns are missing or malformed.
- source list or fields do not resolve.
- item template or child ids are missing/duplicated.
- current item context is missing.
- root actions are missing when item operations are requested.
- child operation actions do not resolve.
- `ListDataID` is missing from item operation actions.
- multiselect state, toolbar, selected count, icons, or absolute top-right container are missing when multiselect is requested.
- YAPK Resource cannot be decoded through strict or tolerant Brotli.
- YAPK Collection is requested for an unknown/non-card pattern.

## Remaining Proof Boundaries

- YAPK generated-final Collection is proven only for the decoded Company Overview card-style pattern.
- `COLLECTION_YAPK_SHAPE_UNPROVEN` should remain for undecoded Resources, unknown YAPK Collection shapes, and non-card/table-style patterns.
- Runtime UI was observed manually by the user, but this branch does not run live import/install/upgrade APIs.
- Collection + Grid table-style pattern is a future separate study and must not be inferred from this card pattern.
