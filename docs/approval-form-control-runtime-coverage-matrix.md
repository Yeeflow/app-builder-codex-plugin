# Approval Form Control Runtime Coverage Matrix

Date: 2026-05-14

Sources:

- `docs/ai-training-approval-form-control-study.md`
- `docs/generated-approval-form-controls-test-baseline.md`
- `docs/generated-approval-form-controls-test-v2-baseline.md`
- `docs/generated-approval-form-controls-test-v3-baseline.md`
- `docs/generated-approval-form-controls-test-v4-baseline.md`
- `docs/generated-approval-form-controls-test-v6-baseline.md`
- `control-configurations.normalized.json`
- `field-configurations.normalized.json`

This matrix separates export-backed control anatomy from generated runtime proof. A control is not considered generation-safe just because it appeared in `AI Training.yap`; it becomes runtime-proven only after a generated package imports, opens, renders the control, submits, completes the approval task, and persists the expected value when persistence is in scope.

## Status Legend

| Status | Meaning |
| --- | --- |
| Proven | Generated package passed import/open/render/submit/approval/persistence for the control or infrastructure behavior. |
| Partially proven | Generated package rendered the control, but value entry or persistence was not fully exercised. |
| Schema-supported but untested | Normalized schema or export anatomy exists, but no focused generated runtime package has proved it yet. |
| Runtime-sensitive | Shape depends on tenant metadata, uploads, source lists, tree data, listrefs, or unresolved runtime behavior. |
| Deferred | Do not generate by default until a focused export/import proof exists. |

## Matrix

| Control | Variable type | AI Training | v1 included | Runtime status | Reason / next test |
| --- | --- | --- | --- | --- | --- |
| `input` | `text` | Yes | Yes | Proven | Request Title submitted and persisted to `Title`. |
| `textarea` | `text` | Yes | Yes | Proven | Rendered on submit/review pages. Persist long text in a later form-focused run if needed. |
| `richtext` | `text` | Yes | Yes | Partially proven | Editor rendered after loading, but formatted value entry/persistence was not exercised. |
| `input_number` | `number` | Yes | Yes | Proven | Quantity accepted numeric input and persisted. |
| `currency` | `number` | Yes | Yes | Proven | Unit Price accepted USD value and participated in calculation/persistence. |
| `percent` | `number` | Yes | Yes | Proven | v2 accepted `25.00%`, displayed it on the approval task, used it in calculation, and persisted it to the list view. |
| `radio` | `text` | Yes | Yes | Partially proven | Dropdown rendered in v1, but value was not selected. Test in a choice-focused package. |
| `checkbox` | `text` | Yes | Yes | Proven | Selection rendered, reviewed, and persisted as a JSON-like array string. |
| `switch` | `boolean` | Yes | Yes | Proven | Rendered and persisted OFF/ON-compatible values. |
| `datepicker` | `date` | Yes | Yes | Proven | Date rendered and persisted. |
| `daterange` | `date` | Yes | Yes | Partially proven | v2 accepted from/to values and displayed them on the approval task; a later package should expose both mapped date fields in the list view. |
| `time` | `date` | Yes | No | Proven | v2 accepted `10:30:00`, displayed it on the approval task, and persisted it to the list view. |
| `file-upload` | `file` | Yes | Yes | Proven | v3 rendered, uploaded `yeeflow-upload-stage3-test.txt`, submitted, displayed the uploaded file on submitted/reviewer pages, approved, and created the text persistence record. Binary list persistence remains deferred. |
| `icon-upload` | `img` | Yes | No | Proven | v3 rendered, uploaded `yeeflow-upload-stage3-test.png`, displayed the image preview on submitted/reviewer pages, approved, and created the text persistence record. Binary list persistence remains deferred. |
| `identity-picker` | `user` | Yes | Yes | Proven | Current user resolved in v1/v4; v4 editable single-select user picker retained `Renger from Yeeflow`, displayed on submitted/reviewer pages, and completed approval. |
| `organization-picker` | `groupselect` | Yes | No | Partially proven | v4 rendered and opened the department selector with `Default` visible; selection did not retain after OK in this sandbox, so value behavior remains environment-sensitive. |
| `location-picker` | `location` | Yes | No | Partially proven | v4 rendered and opened the location picker; sandbox returned no matching location data. |
| `cost-center-picker` | `costcenter` | Yes | No | Partially proven | v4 rendered and opened the cost center selector; sandbox returned no cost center rows. |
| `metadata` | `metadata` | Yes | No | Deferred | Stage 5 intentionally skipped for now; requires known `source` and `categoryId`; do not guess metadata category IDs. |
| `mutiple-metadata` | `mutiple-metadata` | Yes | No | Deferred | Stage 5 intentionally skipped for now; same metadata source risk plus multi-value shape. |
| `lookup` | `lookup` | Yes | Yes | Proven | v6 proved packaged internal lookup selection, display, addition/autofill mappings, review display, approval completion, and target record creation. Raw lookup-to-text persistence stored the local row ID, so use addition/summary fields for readable persistence. |
| `lookup-list` | `lookup` | Yes | No | Deferred | Not included in v6; relation-name addition shape still needs an isolated generated proof. |
| `list` / `listref` | `list` | Yes | No | Proven | v6 proved table render, add row, edit row, submitted/reviewer display, approval completion, and text-summary persistence. Direct child-row persistence remains deferred. |
| `data-list` | n/a | Yes | No | Deferred | Not included in v6; embedded display should be isolated after lookup/listref proof. |
| `signer` | `signer` | No | No | Deferred | Schema-supported but not in AI Training; needs focused signer export. |
| `tag` | `tag` | No | No | Deferred | Stage 5 intentionally skipped for now; use text/checkbox fallback until a generated package proves tag source behavior. |
| `rate` | `number` | No | No | Proven | v2 rendered the star rating, accepted `3.5`, displayed it on review, and persisted it to the list view. |
| `hyperlink` | `text` | No | No | Proven | v2 accepted a URL, displayed it as an open link on review, and persisted it as a list-view link. |
| `calculated` | `number` | No | Yes | Proven | v1 proved subtotal and v2 proved percent-based calculation: `200 * 25% = 50`. |
| `aktabs` / tab controls | n/a | Yes | No | Schema-supported but untested | Test separately as a layout-control package after value controls. |
| `workflowControlPanel` | n/a | Yes | Yes | Proven | Submit and approval actions completed successfully. |
| `workflowHistory` | n/a | Yes | Yes | Proven | Flow history rendered on review task page. |

The machine-readable version is `approval-form-control-runtime-coverage.json`.

## Consolidated Coverage Summary

Runtime-proven for generated packages:

- Basic values and layout: `input`, `textarea`, `input_number`, `currency`, `checkbox`, `switch`, `datepicker`, `workflowControlPanel`, `workflowHistory`
- Advanced inputs: `percent`, `time`, `hyperlink`, `rate`, `calculated`
- Upload/media workflow-form usage: `file-upload`, `icon-upload`
- People picker: editable single-select `identity-picker`
- Lookup/list controls: internal packaged single-select `lookup`, workflow-form `list` / `listref`

Partially proven:

- `richtext`: editor rendered, but formatted value persistence is not proven.
- `radio`: dropdown rendered, but selected value persistence still needs a focused choice proof.
- `daterange`: from/to values rendered and reviewed, but both mapped fields still need list-view persistence proof.
- `organization-picker`, `location-picker`, `cost-center-picker`: controls rendered/opened, but usable selection depends on tenant metadata and retention attrs.

Skipped/deferred:

- Stage 5 was intentionally skipped: `metadata`, `mutiple-metadata`, `tag`.
- `lookup-list`, embedded `data-list`, `signer`, and `aktabs` remain separate future packages.

Persistence-safe posture:

- Use direct `ContentList` mappings for proven primitive fields such as text, textarea, number, currency, percent, checkbox-as-text, switch, date/time, hyperlink, rate, and calculated values.
- Use text-summary persistence for file/image uploads unless binary list-field persistence is explicitly proven.
- Use text-summary persistence for identity/picker controls unless direct native picker fields are explicitly proven.
- Use `attrs.addition[]` autofill variables or explicit summary variables for lookup display text and related readable values.
- Use list/listref for workflow-form row capture and review display, but persist a text summary until direct child-row persistence is export-proven.

Render-only or selection-only posture:

- Do not claim runtime-safe persistence for `richtext`, `radio`, `daterange`, organization/location/cost-center pickers, metadata, tags, lookup-list, embedded data-list, signer, tabs, or direct sublist row persistence until an isolated generated package proves the exact behavior.

## V1 Proven Set

`Approval Form Controls Test v1` proved:

- `input`
- `textarea` render
- `input_number`
- `currency`
- `checkbox`
- `switch`
- `datepicker`
- `identity-picker`
- `calculated`
- `workflowControlPanel`
- `workflowHistory`

It partially proved:

- `richtext`
- `radio`
- `file-upload`
- `lookup`

## V2 Proven Set

`Approval Form Controls Test v2 - Advanced Input Controls` proved:

- `percent`
- `time`
- `hyperlink`
- `rate`
- `calculated`

It partially proved:

- `daterange` value entry and review rendering. A later package should expose both mapped date fields in the list view before promoting it to fully proven persistence.

## V3 Proven Set

`Approval Form Controls Test v3 - Upload and Media Controls` proved:

- `file-upload`
- `icon-upload`

Runtime evidence:

- Imported `Approval Form Controls Test v3.generated.yap` successfully.
- Opened the imported app and `Upload Media Test Requests` without `datas/query` 400.
- Published and opened `Approval Form Controls Test v3`.
- Uploaded a tiny safe text file: `yeeflow-upload-stage3-test.txt`.
- Uploaded a tiny safe image file: `yeeflow-upload-stage3-test.png`.
- Submitted the form successfully.
- Submitted request detail showed the uploaded file name and image preview.
- Reviewer task opened and displayed both uploaded values.
- Approval completed successfully.
- `ContentList` created a new `Upload Media Test Requests` row with the expected text summary.

Scope note: v3 proves workflow-form upload/media usage through render, upload, submit, task display, and approval completion. Binary file/image persistence into a data-list field was intentionally out of scope and remains deferred.

## V4 Runtime Set

`Approval Form Controls Test v4 - People and Organization Picker Controls` proved:

- `identity-picker` editable single-select workflow-form usage

It partially proved:

- `organization-picker`
- `location-picker`
- `cost-center-picker`

Runtime evidence:

- Imported `Approval Form Controls Test v4.generated.yap` successfully.
- Opened the imported app and `Picker Test Requests` without `datas/query` 400.
- Opened `Approval Form Controls Test v4` approval form.
- `Requester` identity-picker resolved to the current user.
- `Selected User` identity-picker opened the user selector, selected `Renger from Yeeflow`, retained the value, displayed it on the submitted request and reviewer task, and completed approval.
- `organization-picker` rendered and opened the department selector with `Default` visible, but the selected department did not retain after confirmation in this sandbox.
- `cost-center-picker` rendered and opened the cost center selector, but the sandbox returned no rows.
- `location-picker` rendered and opened the native picker/dropdown, but the sandbox returned no matching location data.
- Submit completed successfully.
- Reviewer task opened and displayed the selected user plus notes.
- Approval completed successfully.
- `ContentList` created a new `Picker Test Requests` row with the expected text summary.

Scope note: v4 proves identity-picker workflow-form usage and partial render/open behavior for tenant-metadata pickers. Direct picker-value persistence and organization/cost-center/location selection remain deferred until the tenant has selectable metadata or a focused working export proves the required retention attrs.

## V6 Runtime Set

`Approval Form Controls Test v6 - Lookup and List Controls` proved:

- `lookup`
- `list` / `listref`

Runtime evidence:

- Imported `Approval Form Controls Test v6.generated.yap` successfully.
- Opened the imported app, `Reference Products`, and `Lookup List Test Requests` without `datas/query` 400.
- `Reference Products` loaded packaged sample rows for `27-inch Monitor`, `Docking Station`, and `Standard Laptop`.
- Opened `Approval Form Controls Test v6` approval form.
- Lookup picker opened and showed packaged source records.
- Selected `Standard Laptop`; submit page displayed the selected lookup value.
- Lookup `attrs.addition` mappings populated `Product Code = LAP-STD`, `Product Category = Hardware`, and `Unit Price = USD 1,250.00`.
- Added one list/sublist row and edited `Product`, `Quantity`, `Unit Price`, and `Line Note`.
- Submitted the form successfully.
- Submitted request detail and reviewer task displayed the lookup value and list row values.
- Reviewer approval completed successfully.
- `ContentList` created a new `Lookup List Test Requests` row.

Generator rule learned: a raw lookup variable mapped into a plain text data-list field persisted the internal local row ID (`2054943200723742740`) rather than the display text. For business-readable persistence, map addition/autofill values or explicit text summary variables; use direct lookup persistence only when storing the local row ID is intentional or the target field is a proven lookup-compatible field.

Scope note: v6 did not include `lookup-list` or embedded `data-list` display. Those remain deferred for isolated packages.

## Remaining Staged Runtime Tests

Stage 5 is intentionally skipped for now:

- `metadata`
- `mutiple-metadata`
- `tag`

The next package should be Stage 7: signer and special controls, unless lookup-list or embedded data-list display becomes higher priority.

Later metadata/tag work should resume only with export-backed source/category/tag behavior.
