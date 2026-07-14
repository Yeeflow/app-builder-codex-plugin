# Form Action Print Page and Barcode Scan Training Report

## Evidence studied

- `Online Library-v3.1.yapk`
- Dashboard pages: Inventory, Print Inventory, Barcode Scan, Book Loans
- Data Lists: Inventory List, Books List

## Learned contracts

- Inventory -> Print Inventory proves Dashboard Print page serialization with A4, landscape, 80%, Minimum margins, and expression-title tokens.
- Print Inventory proves multi-record Collection printing, `table-v2` layout, merged rows/columns, cell containers, dynamic values, and Current Collection item QR.
- Books List ISBN proves `Rules.allowScan=true` on a Text/input field.
- Barcode Scan proves Auto + multiple mode, result/error temp variables, and Collection filter consumption.
- Book Loans proves EAN-13 with multiple, select, and auto modes.

## Implementation

- Shared builder/validator: `scripts/lib/form-action-print-barcode-utils.cjs`.
- App Plan validator: `scripts/validate-form-action-print-barcode-plan.mjs`.
- Package validator: `scripts/validate-form-action-print-barcode.mjs`.
- Full-app materializer parses and materializes Print/Barcode planning rows and explicit field scan capability.
- Dedicated print Dashboard template marker: `dashboard-print-multi-record-table-v1`.

## Remaining runtime work

Print execution, page-break quality, physical camera scanning, permission handling, and QR destination navigation are not claimed by this export-backed training. Run a focused safe runtime proof before promoting those behaviors to runtime-proven.
