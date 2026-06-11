# YAP Service Desk Form Workspace Smoke v8 Lessons

## Original Goal

Generate a focused YAP-only Service Desk form workspace that reproduces the Service Desk Pro-style approval/requester form surface:

- left help desk navigation
- ticket collection/list
- selected ticket workspace/conversation
- right details/attributes panel

The form is a workspace shell, not a request submission page and not a real approval routing flow.

## Final v8 Proof Summary

The successful v8 smoke package was inspected locally and imported successfully by the user. Sanitized structural proof:

- one Workspace approval/form entry
- root Type `105` navigation entry points to the Workspace form key
- `Resource.FormKeys[]`, form key, navigation key, and DefResource key align
- requester page uses `DefResource.pageurls[].formdef.children`
- no unsupported `formdef.controls`
- workflow contains Start, SequenceFlow, and End
- Start task URL points to the requester form page
- default form header is hidden
- content width is Full width
- page padding is `0`
- 22 Icon controls use inline width and bounded 16px sizing
- 72 Text/heading controls use inline width
- shell uses Hidden overflow
- every major workspace column uses Scroll overflow

The package still proves layout and materialization only. Real dynamic comment submission, live selected-record update behavior, and complete production data mutation semantics require separate runtime tests.

## Fresh Smoke v1-v7 Failure Loop

After v8, a fresh YAP-only Service Desk workspace was generated from scratch. Several packages passed local hard checks and the package API returned HTTP `200` / API `Status = 0`, but the Yeeflow UI later showed async import failure or a form designer that kept loading. The final successful recovery was a fresh-ID clone of the user-confirmed v8 structure.

Sanitized root causes found in the failed fresh packages:

- `ListDatas` was temporarily wrapped under `ListDatas.Datas` instead of being a record-ID-keyed object.
- Sample rows contained keys that did not exist in `Defs[].FieldName`, such as date-like row keys against `Text*` field definitions.
- The Service Desk child lists drifted from the v8-proven field numbering. The failed generated package used `Text1` and `Lookup1`; the successful v8 structure uses native `Title` plus business fields starting at `Text2`.
- Field `Rules` drifted toward generated object values instead of export-style stringified JSON.
- The generated form tree introduced `collection` and `dynamic-field` controls. The package could import, but the form designer kept loading. The successful v8 designer-loadable tree used only `list`, `container`, `heading`, and `icon`.
- API `Status = 0` with an action-log response only proved queue acceptance. It did not prove the async import completed or that the designer could load the form controls.

Final recovery:

- Clone the user-confirmed v8 structure.
- Freshen root app/list set ID, child list IDs, process model ID, form key, sample row IDs, and package title.
- Preserve the v8 form tree and control families.
- Preserve v8 field numbering and keyed sample rows.

The user confirmed this proven-structure fresh package imported successfully, the approval form published successfully, and the result looked good.

## Blank Form Root Cause

The blank approval form was not caused by YAP import rejection. Import could accept the package while the designer showed an empty form because the form content used a generated shape instead of an export-style designer-readable tree.

Root cause:

- unsupported `formdef.controls`
- generated control names such as `Container`, `Text`, and `Icon`

Fix:

- use `DefResource.pageurls[].formdef.children`
- use lowercase export-style controls such as `container`, `heading`, `icon`, and `list`

## Form Not Reachable Root Cause

Early packages did not reliably create/reach the workspace form because form metadata and root app navigation were incomplete.

Fix:

- `Data.Forms[].ListID = 0`
- root navigation includes Type `105`
- Type `105` navigation item points to the workspace form key
- form key matches `Resource.FormKeys[]` and embedded DefResource key

## Workflow Missing Start Root Cause

One repaired package showed only the End action in workflow designer. The workflow graph had an End event but omitted the Start event and SequenceFlow wiring.

Fix:

- include `StartNoneEvent`
- include `SequenceFlow`
- include `EndNoneEvent`
- wire Start outgoing to SequenceFlow and End incoming from SequenceFlow
- set Start task URL fields to the requester page

## Page Settings Issue

The workspace form must own the full page body. Required settings:

- hide default form header
- content width Full width
- padding `0`

These settings match the workspace layout intent and prevent default form chrome/spacing from breaking the layout.

## Icon Inline And Size Issue

Icon controls must not become layout drivers. The working v8 rule is:

- inline width
- 16px size when paired with 16px text
- bounded width and height
- contextual icon names

Generic or oversized icons can distort panel rows and squeeze text.

## Text, Button, And Dynamic Field Inline Rule

The final smoke proved that Text/heading controls also need inline width. Generated workspaces should default these controls to inline:

- Icon
- Text / heading
- Button
- Dynamic field

Buttons and Dynamic fields were not present in the smoke, but the validator checks them when present.

Important follow-up: inline width is necessary but not sufficient. Generated `dynamic-field` controls in the fresh YAP form workspace still caused designer loading failure because their host/control shape was not export-proven for this approval workspace. In YAP Service Desk workspaces, use static designer-safe headings or copy exact export-proven dynamic control shapes only.

## Column Overflow Rule

Multi-column workspace columns need independent vertical scroll. The successful pattern uses:

- Hidden overflow on the shell
- Scroll overflow on columns and panel body regions

This applies to three-column and four-column workspace layouts. A full-page shell should not let one column expand the whole form vertically.

## App Color Setting Note

The user-updated export included Neutral color using the Luminance light model rather than the older Lightness model. This is captured as guidance, not a hard validator, until a dedicated theme export fixture proves exact fields across apps.

## Validators And Tests Added

Added:

- `scripts/inspect-yap-form-workspace-generation.mjs`
- `scripts/test-yap-form-workspace-generation-lessons.mjs`

The validator reports hard `YAP_*` errors for materialization, designer tree, workflow, page settings, inline controls, icon sizing/context, and overflow. It reports native Title schema mismatch as a warning only.

## Future Generation Checklist

Before importing a generated YAP form workspace:

- Run YAP schema validation.
- Run `scripts/inspect-yap-materialization.mjs`.
- Run `scripts/inspect-yap-form-workspace-generation.mjs`.
- Confirm zero hard `YAP_*` form-workspace errors.
- Confirm no `formdef.controls`.
- Confirm Type `105` nav and aligned keys.
- Confirm Start -> SequenceFlow -> End.
- Confirm page settings: hidden header, full width, padding `0`.
- Confirm Icon/Text/Button/Dynamic field inline width.
- Confirm independent column scroll.
- Confirm child list sample data is a record-ID-keyed `ListDatas` object, not `ListDatas.Datas`.
- Confirm every sample row key resolves to `Defs[].FieldName`.
- For Service Desk-style YAP workspaces, confirm native `Title` plus `Text2...` field numbering and no generated `Text1` / `Lookup1` drift.
- Confirm field `Rules` are export-style JSON strings.
- Confirm the approval form tree uses designer-load-proven controls for this host. For the Service Desk YAP workspace baseline, that means `list`, `container`, `heading`, and `icon`; generated `collection` and `dynamic-field` controls require exact export proof before use.
- Treat API `Status = 0` action-log responses as queued import only. Wait for UI/runtime confirmation before claiming import/materialization success.
- Confirm no generated package, raw Resource, Sign, raw decoded payload, or private IDs are committed.
