# Reference App Template Corpus Audit

Date: 2026-05-30

Branch: `codex/reference-app-template-corpus-audit`

## Purpose

This audit studies existing Yeeflow reference exports as a reusable UI template corpus before creating a new golden reference app. The goal is to determine which Yeeflow UI section templates already have export-proven evidence and which still need a purpose-built golden app.

No raw exports, decoded full payloads, raw `Resource`, raw `Sign`, screenshots, tenant IDs, private URLs, private IDs, or sample records are committed.

## Exports Studied

| Export | Decode shape | App/domain type | Summary |
| --- | --- | --- | --- |
| `Company Overview (3).yap` | YAP wrapper with gzip `ListExportResult` and `Data = ListExportInfo` | Advanced controls and dashboard control patterns | Strongest source for Kanban/Collection item templates, dynamic fields/users/files/images, bulk/item actions, tabs/toggles, timelines, alerts, progress, QR/barcode, embed/document embed. |
| `Data Lists (4).yap` | YAP wrapper with gzip `ListExportResult` and `Data = ListExportInfo` | Data list structure and custom form patterns | Strongest source for Data List custom forms, field controls, grids, Dynamic Sub List, file fields, and generated form field composition. |
| `Projects Center_2.yap` | YAP wrapper with gzip `ListExportResult` and `Data = ListExportInfo` | Project/work-management app composition | Strongest source for multi-page operational app composition, project/task detail pages, related-record sections, status boards, document forms, and workspace-style dashboards. |
| `Sales_Management_AD.yap` | YAP wrapper with gzip `ListExportResult` and `Data = ListExportInfo` | CRM/sales management app composition | Strongest source for dashboard/report analytics, Data tables with `Field`/`FieldName`, filters, sales metrics, opportunity/account forms, related Contacts/Opportunities tables. |

## Per-Export Findings

### Company Overview (3).yap

Found six dashboard pages and one data list with three custom forms. Key reusable patterns:

- Kanban dashboard with dynamic image, dynamic field, dynamic user, progress, and item action buttons.
- Collection of activity with dynamic image, dynamic field, dynamic user, dynamic file, item actions, and bulk actions.
- Timeline page with vertical timeline, horizontal timeline, and Collection fallback using dynamic controls.
- Tab and Toggle pages with repeated Collection item template patterns.
- Additional controls page with Icon list, Alert, Progress bar/circle, QR Code, Barcode, Steps bar, Divider, and Spacer.
- View page with dynamic fields, QR Code, Barcode, Embed, and Document embed.

Limitations:

- Some alert content is generic, so business-specific alert copy still cannot be inferred from this export.
- Card-like styling is not consistently detectable as explicit `card` controls; generated templates still need layout/style validation.
- Runtime proof should not be inferred for every action variant from export evidence alone.

### Data Lists (4).yap

Found ten lists and thirty-nine layouts. Key reusable patterns:

- Custom forms with safe padding, grid/flex-grid field groupings, and broad field-type coverage.
- View and Edit forms with dynamic fields and list-bound controls.
- Dynamic Sub List field usage on a custom form.
- File upload and icon upload field patterns.
- Data-list Kanban, gallery, calendar, and filtered view metadata.

Limitations:

- This export did not provide a clear Print Page layout in the inspected package.
- Dynamic Sub List proves structure, but Vendor-style required-document lifecycle still needs a stronger business-specific reference.

### Projects Center_2.yap

Found two dashboards, seven lists, and twenty-three custom form layouts. Key reusable patterns:

- Project dashboard/workspace with action buttons, Collection sections, project summary metrics, progress, and operational navigation.
- Project detail page with many related sections, task status/issue status areas, Collection sections, Kanban, and action controls.
- Task, issue, milestone, document upload/detail/edit forms with padded grid layouts.
- Related record sections spanning tasks, issues, documents, and milestones.

Limitations:

- Several Collection controls have low dynamic-field counts in the safe summary, so generated full apps must still enforce richer item templates.
- Action semantics and current-record filters need package-specific validation.

### Sales_Management_AD.yap

Found two dashboards, eight lists, and thirty-two layouts. Key reusable patterns:

- Sales dashboard with Summary controls, charts, Pivot Table, filters, and a Data table bound to Accounts with `Field` and `FieldName`.
- Data Report dashboard with report-style metrics and filters.
- Opportunity New/View forms and Account New/Edit/View forms with business sections and field groups.
- Account View Page related Contacts and Opportunities Data tables with configured `Field` and `FieldName` columns.
- Sales Kanban/Gallery data views on Opportunities and Activities.

Limitations:

- This export is strong for dashboard/report/data-table patterns, not for print pages.
- Some form pages use section controls and grids but not necessarily the polished card pattern required by Vendor Onboarding.

## Template Coverage Matrix

| Template | Evidence | Status After Audit | Notes |
| --- | --- | --- | --- |
| `dashboard_header_action_bar` | Projects Center_2, Company Overview | export-proven | Header/action structure and action-button patterns found. |
| `kpi_card_row` | Sales_Management_AD, Projects Center_2 | needs-golden-proof | Summary/metric controls found, but polished four-card KPI row still needs golden proof. |
| `progress_summary_card` | Company Overview, Projects Center_2 | export-proven | Progress controls and progress indicators found. |
| `business_alert_card` | Company Overview | export-proven | Alert control found; business-specific content remains mandatory. |
| `data_table_section` | Sales_Management_AD | runtime-proven | Export proves `Field`/`FieldName`; previous Vendor Onboarding proof covers runtime binding rule. |
| `kanban_status_board` | Company Overview, Data Lists, Projects Center_2, Sales_Management_AD | runtime-proven | Export corpus plus prior focused runtime proof supports the template. |
| `collection_card_board` | Company Overview, Projects Center_2 | runtime-proven | Export corpus plus prior focused runtime proof supports the template. |
| `quick_links_icon_list` | Projects Center_2, Company Overview | export-proven | Action buttons and Icon list found; navigation still needs package validation. |
| `recent_activity_timeline` | Company Overview | export-proven | Vertical/horizontal timeline and Collection fallback found. |
| `detail_view_header_summary` | Company Overview, Projects Center_2, Sales_Management_AD | export-proven | Detail/view pages with status, owner, picture/date, and field summary patterns found. |
| `tabbed_detail_page` | Company Overview, Projects Center_2 | export-proven | Tabs, toggles, and detail navigation patterns found. |
| `sectioned_new_edit_form` | Data Lists, Projects Center_2, Sales_Management_AD | export-proven | Custom form grids and business sections found. |
| `required_documents_checklist` | Data Lists, Projects Center_2 | export-proven | Dynamic Sub List and document form evidence found; Vendor-specific lifecycle still needs care. |
| `related_records_section` | Projects Center_2, Sales_Management_AD | export-proven | Project related sections and Sales related tables found. |
| `print_page_summary` | none in inspected corpus | needs-golden-proof | New golden app or another print export still needed. |
| `print_page_document_checklist` | none in inspected corpus | needs-golden-proof | New golden app or another print export still needed. |
| `print_page_qr_barcode_section` | Company Overview partial QR/barcode evidence | needs-golden-proof | QR/barcode controls found, but not print-page integration. |
| `kanban_card_with_dynamic_fields` | Company Overview | runtime-proven | Dynamic Kanban card pattern and prior focused runtime proof. |
| `collection_card_with_dynamic_fields` | Company Overview | runtime-proven | Dynamic Collection card pattern and prior focused runtime proof. |
| `item_action_bar_edit_delete_update` | Company Overview | runtime-proven | Exported item actions plus prior focused runtime proof. |
| `selection_bulk_toolbar` | Company Overview | runtime-proven | Exported bulk actions plus prior focused runtime proof. |

## App Composition Patterns Found

- Operational dashboard/workspace composition: Projects Center and Sales Management.
- Dashboard analytics composition: Sales Management summaries, charts, Pivot Table, filters, and Data table.
- Advanced dashboard controls: Company Overview tabs, toggles, progress, QR/barcode, embed, document embed, icon list, alerts.
- Multi-section detail composition: Projects Center project and task detail pages.
- Business new/edit forms: Sales opportunity/account forms and Data Lists custom forms.
- Related-record sections: Projects Center related collections and Sales Account related Data tables.
- Item action and bulk action patterns: Company Overview Collection/Kanban actions.

## Gaps Remaining

- Polished KPI card row with explicit modern SaaS card styling remains only partially export-proven.
- Print Page summary and print document checklist are not covered by the four inspected exports.
- QR/barcode controls are export-proven, but QR/barcode placement in a print layout is not.
- Business-specific alert content is a generation rule, not something proven by the generic alert examples.
- Some export pages use strong structure but not explicit card-like style metadata; validators must check both structure and template conformance.

## Is A New Golden App Still Needed?

Yes, but the scope can be smaller.

The existing corpus is enough to ground most dashboard, custom form, Data table, Kanban/Collection, timeline, action, and advanced-control templates. A new golden app should now focus on the remaining gaps:

- polished four-card KPI row
- print page summary
- print page document checklist
- QR/barcode section inside print layout
- one end-to-end mini reference that combines the templates into a coherent business app rather than isolated feature pages

## Can Vendor Onboarding v4.1 Be Generated From The Corpus?

Not yet as a single broad jump. The corpus is strong enough to support page-by-page v4.1 generation planning, but Vendor Onboarding should still be generated page by page and validated against:

- the template library
- the v4 composition checklist
- the reference corpus evidence
- runtime screenshot review

The print page should wait for golden proof or use a documented conservative fallback.

## Additional KPI and Print Golden References

After the initial audit, four additional exports were studied to close the remaining KPI and print-page gaps:

| Export | Focus page/dashboard | Relevant evidence | Proof boundary |
| --- | --- | --- | --- |
| `DEMO Innovation Ecosystem Platform (1).yap` | `NHIC Innovation Overview` | Current Type 103 dashboard with `src` marker, bounded/padded dashboard body, filter controls, Summary controls, chart sections, Pivot Table, card padding, borders, gaps, and business metric labels. | Export-proven structure and bindings only. |
| `Service Desk Pro (2).yap` | `Executive Dashboard` | Current Type 103 dashboard with deep container hierarchy, many Summary controls, chart/metric sections, filters, spacing, borders, width-constrained sections, and operational dashboard composition. | Export-proven structure and bindings only; some related Service Desk patterns have separate focused runtime proofs. |
| `Online Library.yap` | `Inventory`, `Print Inventory` | Inventory dashboard with print action, multi-item printable inventory output, repeated table-like sections, dynamic fields, dynamic image, Barcode Scan page, and QR/barcode controls on inventory/detail surfaces. | Export-proven structure only; print action/open behavior is not claimed here. |
| `Sales Quotation.yap` | `Print Page`, `View Quotation` | Single-record print page with quotation summary, logo/picture area, customer fields, line-item list body/footer, totals, terms text, padding, gaps, borders, and no normal mutation action inside the print page. | Export-proven structure only. |

### Gap Closure

- Polished KPI card rows are now sufficiently export-proven from `NHIC Innovation Overview` and `Executive Dashboard`.
- Print page summaries are now sufficiently export-proven from `Sales Quotation` and `Online Library`.
- Print document/checklist/table patterns are now sufficiently export-proven from `Print Inventory` and `Sales Quotation` line-item print layout.
- QR/barcode controls are export-proven in inventory/detail surfaces, but QR/barcode embedded directly inside a print page is still only partially covered.

### Updated Golden-App Decision

A broad new golden app is no longer needed before Vendor Onboarding v4.1. The expanded corpus is enough for page-by-page generation of KPI dashboards and print summaries/checklists. A focused golden proof is still useful only for QR/barcode inside a print page and for browser print/page-break behavior.

## QR Code Print Page Golden References

Two additional print exports close the QR/barcode print-page gap:

| Export | Focus page | QR pattern | Proof boundary |
| --- | --- | --- | --- |
| `Online Library (1).yap` | `Print Inventory` | Multi-item print page places `list-qrcode` inside the repeated Collection item context, so each printed inventory item can carry its current-item QR code. | Export-proven structure only. |
| `Sales Quotation (1).yap` | `Print Page` | Single-record print page places `list-qrcode` inside the print page container, scoped to the current quotation record. | Export-proven structure only. |

QR print binding patterns:

- Multi-item print QR: place QR control inside the repeated item/list/Collection context and bind through current item scope.
- Single-item print QR: place QR control inside the print page container and bind through current record scope.
- Safe fallback: use a field-bound business code such as Vendor Code, Quote Number, Inventory Code, or Serial Number when QR binding is deferred.
- Invalid fallback: static placeholder URLs or unbound QR controls.

### Final Template Gap Decision

`print_page_qr_barcode_section` is now export-proven for structure. All previously identified template-library gaps are covered by the expanded corpus. A new golden app is not required before Vendor Onboarding v4.1, though browser print/page-break behavior and scanned QR destination behavior still need runtime/manual verification.

## Recommended Next Steps

1. Extend the template library with the reference corpus evidence from this audit.
2. Use the corpus for dashboard, custom form, Kanban/Collection, timeline, related-record, and action templates.
3. Use NHIC and Service Desk dashboard patterns for KPI/card rows.
4. Use Online Library and Sales Quotation patterns for print summaries and print item/checklist tables.
5. Use Online Library (1) and Sales Quotation (1) patterns for print-page QR sections.
6. Generate Vendor Onboarding v4.1 page by page only after template conformance and corpus coverage are wired into validation.
7. Keep browser print/page-break and scanned QR destination behavior as manual/runtime checks.
