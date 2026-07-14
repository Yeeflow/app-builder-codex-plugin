# Form Action Print Page and Barcode Scan Golden Reference Standard

## Scope

`Online Library-v3.1.yapk` export-proves Dashboard-hosted Print page and Barcode scan Form Action steps, a multi-record print Dashboard built with Collection + Table + QR Code, and a Text/input Data List field with barcode/QR scanning enabled.

This round proves Dashboard as the Print page target. Data List item forms and Approval submission/print pages require their own focused target exports before generated-final support is expanded.

## Print Page

- Exact step type: `print`.
- Dashboard target: `attrs.printtype = "select"`, `attrs.data.Type = "page"`, and `attrs.data.SourceID` resolves to a Type 103 page.
- Print title uses a non-empty Yeeflow expression-token array in `attrs.ptit`.
- A4 is `settings.Size = "6"`.
- Layout is `portrait` or `landscape`.
- Scale is a decimal string, for example 80% is `"0.8"`.
- Minimum margins are `settings.Margins = "3"`.
- The print target must select `dashboard-print-multi-record-table-v1` in the App Plan.

The print Dashboard requires a one-column Collection, a `table-v2` inside each Collection item, cell content containers, Text/heading labels, Dynamic controls for business values, and at least one valid `attrs.table-merges` row/column merge. Per-item QR uses `list-qrcode` with `attrs.qr-code-link.type = "2"`, which means Current Collection item.

## Barcode-enabled Text field

Scanning is a capability of a normal Text/input field, not a separate barcode field type:

```json
{
  "FieldType": "Text",
  "Type": "input",
  "Rules": "{\"allowScan\":true}"
}
```

The App Plan must explicitly set `Allow Barcode / QR Scan = Yes`. Do not infer it from labels such as ISBN, serial number, or asset tag.

## Barcode Scan Form Action

- Exact step type: `barcode`.
- Modes: `multiple`, `select`, `auto`.
- Auto barcode type omits `attrs.type`; ISBN/EAN-13 uses `attrs.type = "ean-13"`.
- `attrs.response` and `attrs.message` both use `{ "prefix": "__temp_", "value": "<variable name>" }`.
- Result and error variables must exist in the host page `tempVars`.
- The export proves Stop action on read error. Continue-on-error remains focused-export-proof-required.
- Scanned values must have a consumer. The standard consumer is a Collection fixed filter with operator `9`, whose right operand references `__temp_<result variable>`.

## Hard gates

Generated-final validation fails unresolved Print Dashboard targets, missing title tokens, unsupported print setting encodings, print targets without Collection/Table/merge/current-item QR, unsupported scan modes or barcode types, undeclared result/error temp variables, orphan scan results, and `allowScan=true` on non-Text/non-input fields.

## Generated-final integration contract

The App Plan, generated-final materializer, decoded package, and canonical preflight are one contract:

- `Allow Barcode / QR Scan = Yes` must survive field normalization and produce stringified Text field `Rules.allowScan = true`; parsing the plan without emitting the rule is a hard failure.
- A Dashboard selected as `dashboard-print-multi-record-table-v1` must still clone and preserve the canonical `dashboard-page-layouts-v1.1` page shell. Store the print template in the dedicated `printDashboardTemplateId` provenance field instead of replacing the page-shell marker.
- Canonical `content_card_wrapper` modules preserve both `section_title_area` and `section_content_area`. Remove source-template text, then map a business title; do not delete the title slot or reconstruct a structurally different substitute.
- Dynamic values inside the printable `table-v2` expose the field on the canonical root and `attrs.obj-f`, `attrs.field`, and `attrs.data.field` binding surfaces.
- The printable Collection carries a real Data List source, deterministic sort, no-open behavior, one-column repeated layout, `table-v2` merge metadata, and `qr-code-link.type = "2"` for the current Collection item.
- Planned Print and Barcode actions must have reachable bound controls. Use the shared trigger-insertion helper when the selected page template does not already contain a suitable control; do not hand-patch runtime candidates.
- Focused validation is necessary but not sufficient. Every generated-final regression fixture must also pass `yapk-first-generation-preflight.mjs`, including Dashboard layout, dataset presentation, page-scope dependencies, field rules, and form-action gates.

## Proof boundary

The schema and package shapes are export-proven and validator-backed. Actual browser print output, physical scanner/camera behavior, permission prompts, device compatibility, scanned QR destinations, and page-break quality still require focused runtime proof.
