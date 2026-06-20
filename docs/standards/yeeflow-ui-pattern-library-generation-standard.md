# Yeeflow UI Pattern Library Generation Standard

This standard defines the default UI generation source for Yeeflow applications. The primary machine-readable registry is:

`docs/templates/yeeflow-ui-section-template-library.normalized.json`

Generated PNG design images and HTML previews are optional review evidence unless the user explicitly asks for visual artifacts, screenshots, or high-fidelity prototypes. They must not override the approved Functional Specification, Yeeflow App Plan, Application Design System, selected UI Section Templates, or Page Implementation Blueprint.

## Mandatory Default Flow

```text
Functional Specification
-> Yeeflow App Plan
-> Business Clarification + Generation Readiness
-> Application Design System
-> Yeeflow UI Section Template / Pattern Selection
-> Page Implementation Blueprint
-> Blueprint Pattern Conformance Validation
-> Yeeflow Resource Generation
-> Decoded Resource Parity Validation
-> Local hard gates
-> package/sign/install/runtime only when explicitly approved
```

The Application Design System selects the application-level layout, token/style rules, surface responsibilities, and control/property proof boundary. Pattern selection then maps each UI surface to one or more `templateId` values from the normalized template registry. Page Implementation Blueprints are generated from the App Plan, Application Design System, and selected templates.

## Surface-To-Template Selection

Choose templates by the surface's primary responsibility:

| Surface | Allowed template categories | Typical templates |
| --- | --- | --- |
| Dashboard pages | `dashboard`, `item-template`, collection-control templates | `dashboard_header_action_bar`, `kpi_card_row`, `data_table_section`, `kanban_status_board`, `collection_card_board`, `recent_activity_timeline` |
| Approval Submission forms | `approval-form-workspace`, `data-list-form`, `item-template` | `multi_column_form_workspace_shell`, `sectioned_new_edit_form`, `required_documents_checklist` |
| Approval Task forms | `approval-form-workspace`, `data-list-form`, `item-template` | `multi_column_form_workspace_shell`, `tabbed_detail_page`, `related_records_section` |
| Approval Print pages | `data-list-form`, `item-template`, collection-control templates | `print_page_summary`, `print_page_document_checklist`, `print_page_qr_barcode_section` |
| Data List New/Edit forms | `data-list-form` | `sectioned_new_edit_form`, `required_documents_checklist` only when explicitly planned |
| Data List View/Detail forms | `data-list-form`, `item-template`, collection-control templates | `detail_view_header_summary`, `tabbed_detail_page`, `related_records_section` |
| Document Library forms | `data-list-form`, `item-template` | document-aware `sectioned_new_edit_form`, `required_documents_checklist`, `detail_view_header_summary` |
| Related records / Sub List / Collection / Kanban / Timeline | `item-template`, collection-control templates, selected parent-surface templates | `collection_control_grid_table`, `collection_control_responsive_card_grid`, `kanban_card_with_dynamic_fields`, `collection_card_with_dynamic_fields`, `item_action_bar_edit_delete_update` |

Templates without a `category` in older registry entries are treated as collection-control templates when their IDs start with `collection_control_`.

## Required Pattern Mapping

Every selected surface must declare:

- `surfaceId`
- `surfaceType`
- selected `templateId` or `selectedTemplateIds`
- `patternProofStatus`: `runtime-proven`, `export-proven`, `inferred`, or `needs-golden-proof`
- control mapping for every template `requiredControls`
- child-control mapping for every template `requiredChildControls`
- field and data-binding mapping for every template `requiredFields` and `requiredDataBindings`
- action mapping for required action rules, or explicit `inactiveActions` / `deferredActions`
- proof boundary for unsupported fields, bindings, style tokens, or action behavior

Deferred items must include reason, fallback, proof impact, and required follow-up. A deferred item may allow local planning to continue, but it must not be reported as runtime-proven or resource-generation-ready unless the chosen fallback is complete.

## Forbidden Misuse

These are hard blockers:

- using Dashboard KPI/card/templates as the body of a New/Edit form
- using generic related-record, Collection, or lower-region templates for primary editable fields
- placing Data List or Document Library primary editable fields in regions named `Primary form fields`, `Main form fields`, `Editable fields`, `Document metadata fields`, or similar
- converting HTML-only concepts such as `div`, `span`, DOM sections, CSS classes, or screenshot regions into Yeeflow controls
- treating HTML previews, PNG screenshots, SVG boards, or visual mockups as higher authority than the App Plan, Application Design System, selected templates, or Page Implementation Blueprint
- claiming UI quality from schema validation, signing, package API acceptance, or runtime navigation alone

## Blueprint Requirements

Blueprints must preserve the selected template contract:

- all required controls and child controls exist with semantic `nv_label` or role metadata
- control hierarchy matches the template's required parent/child structure
- fields and data bindings map to real planned lists, forms, fields, variables, Summary/KPI metadata, Collection/Kanban item templates, Sub List rows, or explicit deferrals
- actions bind to real Yeeflow form/page/action metadata or are explicitly inactive/deferred
- style intent maps through the Application Design System token/property boundary
- unsupported style/property/control shapes are marked `export-learning-required`, `runtime-proof-required`, or `deferred`

Run:

```bash
node scripts/validate-ui-pattern-selection.mjs --selection <pattern-selection.json>
node scripts/validate-blueprint-ui-pattern-conformance.mjs --blueprint <page-implementation-blueprint.json> --pattern-selection <pattern-selection.json>
```

`readyForResourceGeneration: true` is forbidden when either validator reports errors.

## Proof Boundaries

Pattern proof status must be preserved from template selection through blueprint and final report:

- `runtime-proven`: exact pattern/control behavior has runtime evidence in the stated host/scope.
- `export-proven`: exact configuration shape exists in exported Yeeflow evidence, but runtime behavior remains a separate proof layer.
- `inferred`: derived from adjacent proven patterns and must not be claimed as final runtime behavior.
- `needs-golden-proof`: requires a focused export/runtime learning task before generated-final use.

Decoded Resource Parity Validation must compare generated resources back to the Page Implementation Blueprint. Passing pattern selection or blueprint validation does not prove package schema validity, signing, API acceptance, install/import/upgrade, or browser/runtime behavior.
