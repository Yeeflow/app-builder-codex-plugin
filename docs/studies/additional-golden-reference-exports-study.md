# Additional Golden Reference Exports Study

Date: 2026-05-30

Branch: `codex/reference-app-template-corpus-audit`

## Purpose

This study extends the reference app template corpus with additional export-proven KPI dashboard and print-page references. It focuses on the previous unresolved gaps: polished KPI card rows, print page summary layout, print table/checklist layout, and QR/barcode placement in print-oriented layouts.

No raw exports, decoded full payloads, raw `Resource`, raw `Sign`, screenshots, tenant IDs, private URLs, private IDs, or sample records are committed.

## Exports Studied

| Export | Focus | Decode shape |
| --- | --- | --- |
| `DEMO Innovation Ecosystem Platform (1).yap` | `NHIC Innovation Overview` | YAP wrapper with gzip `ListExportResult`; `Data = ListExportInfo`. |
| `Service Desk Pro (2).yap` | `Executive Dashboard` | YAP wrapper with gzip `ListExportResult`; `Data = ListExportInfo`. |
| `Online Library.yap` | `Inventory`, `Print Inventory` | YAP wrapper with gzip `ListExportResult`; `Data = ListExportInfo`. |
| `Sales Quotation.yap` | `Print Page`, `View Quotation` | YAP wrapper with gzip `ListExportResult`; `Data = ListExportInfo`. |

## DEMO Innovation Ecosystem Platform

The `NHIC Innovation Overview` dashboard provides strong KPI dashboard evidence.

Observed reusable patterns:

- Current Type 103 dashboard shell with `Ext2` carrying the `src` marker.
- Bounded dashboard content container with safe padding and width constraints.
- Filter row with partner, portfolio, and submitted-period controls.
- Multiple Summary controls arranged in row containers.
- Summary controls use business labels, aggregate field settings, card padding, border/radius styling, and dashboard filter bindings.
- Chart and Pivot Table sections sit below the KPI summary row, giving the dashboard a richer analytical composition.

Template impact:

- Upgrades `kpi_card_row` from partial evidence to export-proven.
- Strengthens `dashboard_header_action_bar`, `progress_summary_card`, and analytics-style dashboard section validation.

Proof boundary:

- Export-proven only. Aggregate correctness and live filter/runtime behavior remain package-specific validation/runtime concerns.

## Service Desk Pro

The `Executive Dashboard` provides a second strong KPI dashboard reference.

Observed reusable patterns:

- Current Type 103 dashboard shell with large, nested dashboard composition.
- Deep container hierarchy with safe padding, section gaps, borders, width constraints, and row/column grouping.
- Many Summary controls for submitted, resolved, open, critical/high-priority, response, resolution, and SLA-style metrics.
- Chart sections are grouped with the metric summaries.
- Header and filters precede dashboard metrics, making it suitable for operational executive dashboards.

Template impact:

- Confirms `kpi_card_row` as export-proven.
- Strengthens `progress_summary_card`, dashboard header/filter patterns, and metric-card style rules.

Proof boundary:

- Export-proven only in this study. Separate focused runtime proofs may exist for Service Desk patterns, but this document does not widen those runtime claims.

## Online Library

The `Inventory` and `Print Inventory` pages provide multi-item print/list evidence.

Observed reusable patterns:

- `Inventory` page includes a print action targeting `Print Inventory`.
- `Print Inventory` uses a printable dashboard-like page with a padded section structure, headings, dynamic fields, dynamic image, repeated table-like sections, and inventory-list context.
- `Barcode Scan` and `Detail Page` prove Barcode and list QR Code controls on inventory/detail surfaces.

Template impact:

- Upgrades `print_page_document_checklist` to export-proven for multi-item print/list sections.
- Adds print/list evidence to `data_table_section`.
- Adds partial QR/barcode evidence to `print_page_qr_barcode_section`.

Proof boundary:

- Print structure is export-proven. Print action/open behavior, browser printing, page breaks, and QR/barcode inside the print page are not claimed as runtime-proven.

## Sales Quotation

The `Print Page` and `View Quotation` pages provide single-record print evidence.

Observed reusable patterns:

- `View Quotation` includes a print action targeting the print page.
- `Print Page` contains a rich print-oriented layout with logo/picture area, quotation/customer summary fields, dynamic fields, line-item list body/footer, totals, descriptive text, terms paragraph, padding, gaps, borders, and background sections.
- The print page is read-oriented and avoids ordinary mutation actions.

Template impact:

- Upgrades `print_page_summary` to export-proven.
- Upgrades `print_page_document_checklist` to export-proven for single-record line-item table/list sections.
- Strengthens print-specific layout rules: print header, summary, item table/list body, footer/totals, terms/notes, padding, and no active mutation actions.

Proof boundary:

- Export-proven only. Browser print output and page-break fidelity still need manual/runtime proof.

## Remaining Gap

QR/barcode controls are export-proven, and print page layouts are export-proven, but QR/barcode embedded directly inside a print page remains only partially covered by these exports. Generated apps may either:

- include QR/barcode in the print page only after a focused export/runtime proof confirms the exact shape, or
- use a safe Vendor Code/static code fallback and document the deferred QR/barcode print integration.

## QR Code Print Page Golden References

Two follow-up exports close the QR/barcode print-page structure gap:

| Export | Focus page | QR print evidence | Binding pattern |
| --- | --- | --- | --- |
| `Online Library (1).yap` | `Print Inventory` | Multi-item print page contains `list-qrcode` inside the repeated Collection item context for inventory output. | QR is scoped to each current inventory item in the repeated item template. |
| `Sales Quotation (1).yap` | `Print Page` | Single-record print page contains `list-qrcode` inside the print page container. | QR is scoped to the current quotation record. |

Observed layout rules:

- QR controls are placed inside the printable page structure rather than only on a separate detail page.
- Multi-item QR uses a repeated list/Collection context, so each printed row/card can carry a QR for the current item.
- Single-item QR uses the current record context on the print page.
- QR sections sit inside container structure with print spacing/padding.
- Print pages remain read-oriented; ordinary mutation actions are not part of the QR print section.

Generation rules:

- Use `list-qrcode` or an equivalent QR Code control inside the print page or print item template.
- Bind the QR to current item/current record context or to a business code field.
- Do not generate static placeholder QR URLs.
- If QR binding cannot be safely generated, use a field-bound business code fallback and document the deferment.

Updated proof boundary:

- `print_page_qr_barcode_section` is now export-proven for structure.
- Browser print rendering, page breaks, and scanned QR destination behavior still require runtime/manual proof.

## Recommendation

Vendor Onboarding v4.1 can proceed page by page using the expanded corpus for KPI dashboards, print summaries, print item/checklist tables, and QR print sections. A new broad golden app is no longer required first. Runtime/manual checks remain useful for browser print/page-break behavior and scanned QR destination behavior.
