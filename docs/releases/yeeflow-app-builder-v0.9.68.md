# Yeeflow App Builder v0.9.68

## Scope

- Export-backed Form Action Print Page and Barcode Scan planning, generation, and validation.
- Dashboard multi-record print layout using Collection, Table, merged cells, dynamic controls, and current-item QR codes.
- Text field barcode and QR scanning through canonical `Rules.allowScan` materialization.
- Auto and EAN-13 barcode types with multiple, select-to-scan, and automatic scan modes.
- Scan result and error variable wiring plus Collection filtering by scanned values.

## Validation

- Source and dist Form Action Print Page and Barcode Scan suites: 16 cases each.
- Official `Online Library-v3.1.yapk` reference validation covers one Print Page step, four Barcode Scan steps, and two scan-enabled Text fields.
- Full-app materialization, App Plan action properties, clarification/readiness traceability, cache artifact, source/dist parity, Node syntax, JSON parsing, and archive integrity gates are required before promotion.

## Proof Boundary

Dashboard is the export-backed Print Page target in this release. Data List item, Document Library item, Approval Submission, and Approval Print Page targets remain `export-learning-required`. Physical camera scanning, print preview pagination, browser print output, and printer behavior require safe runtime proof and are not claimed by structural validation alone.
