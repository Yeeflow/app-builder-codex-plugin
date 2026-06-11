# Golden Reference App Plan

## Purpose

The application-generation knowledge-gap audit showed that feature studies prove individual Yeeflow control shapes, but they do not prove that Codex can compose those controls into a polished full business application. A golden reference app is needed as a high-quality export-backed benchmark for page composition, styling, forms, item templates, and actions.

## Recommended Golden App

Name: Vendor Onboarding Mini Reference

Scope: a small, manually designed Yeeflow app that covers the critical full-application patterns without the full Vendor Onboarding production scope.

## Required App Areas

### Current Dashboard

Must include:

- Header/action area with meaningful buttons.
- KPI card row with real card containers.
- Business-specific Alert.
- Data table with configured `Field` and `FieldName` columns.
- Kanban or Collection board with dynamic item template fields.
- Quick links or action cards.

### Data List Custom View Form

Must include:

- Header summary card.
- Steps bar.
- Tabs or sectioned detail layout.
- Overview fields.
- Related documents/reviews/tasks/history section.

### New/Edit Form

Must include:

- Section cards.
- Vendor information fields.
- Contact fields.
- Business justification fields.
- File or attachment fields.
- Save/Submit actions when safe.

### Print Page

Must include:

- Print-oriented header.
- Vendor summary.
- Compliance summary.
- Document checklist.
- QR Code, Barcode, or Vendor Code fallback.
- Print spacing/style notes.

### Kanban Or Collection Item Template

Must include:

- At least three dynamic business fields.
- Status/risk badge pattern where supported.
- Owner/date context.
- Valid item actions, such as View, Edit, Delete, or Update Status, when action bindings are safe.

## Export And Study Workflow

1. Manually design the mini reference app in Yeeflow using the current dashboard renderer.
2. Export both the package and any relevant decoded study artifacts outside git.
3. Decode the export locally without committing raw `Resource`, `Sign`, decoded payloads, tenant IDs, private URLs, or private IDs.
4. Normalize only safe, schema-focused references under `docs/studies/normalized/golden-reference-app/`.
5. Compare each page section to `docs/templates/yeeflow-ui-section-template-library.normalized.json`.
6. Update the template library with export-proven control/style/action patterns.
7. Add validator checks for template details that are proven by the golden export.

## How Codex Should Use The Golden Reference

Codex should treat the golden reference as the source of truth for high-quality application composition:

- Prefer golden-reference templates before inventing new section shapes.
- Generate page-by-page and validate every page against template conformance.
- Do not call a full app successful if it merely imports or satisfies section names.
- When a requested section cannot match the golden template safely, document the fallback and proof boundary before package generation.

## Proof Boundary

This plan does not create or export the golden app. It defines the manual reference app that should be created next. Until the golden app is exported and normalized, templates marked `needs-golden-proof` remain planning and validation guidance rather than runtime-proof claims.
