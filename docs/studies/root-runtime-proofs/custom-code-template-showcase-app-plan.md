# Custom Code Template Showcase App Plan

App: Enterprise Service Request & Compliance Review

Focused showcase app to use all 13 reusable Yeeflow custom code templates in realistic request, compliance, approval, and dashboard contexts.

## Generation Gate

- readyForGeneration: `true`
- doNotGenerateYet: `false`
- reason: Phase 2 readiness accepted for local package generation. All 13 templates have planned placements, source-backed parameters, seeded data support, and explicit runtime-risk assumptions.
- Public form support remains unclaimed.
- Runtime proof remains pending until the generated app is imported and tested in Yeeflow.

## Template Placement Plan

| Template | Context | Location | Source | Output/writeback |
| --- | --- | --- | --- | --- |
| activity-timeline | dashboard/form display | Dashboard and request detail section | Approval History / Timeline Events | none |
| approval-decision-panel | approval form | Manager Review and Compliance Review task pages | decision/comment variables | __variables_.ReviewDecision and __variables_.ReviewComment |
| approval-timeline | approval form | Approval form review section | Approval History / Timeline Events | none |
| checklist-compliance-block | approval form | Submission form compliance section | static checklist JSON | __variables_.ComplianceChecklistJson |
| dependent-selector | approval form | Submission form category section | Subcategories | __variables_.SelectedCategory and __variables_.SelectedSubcategory |
| distribution-chart-module | dashboard | Operations dashboard analytics band | Service Requests | none |
| exception-alert-panel | dashboard | Operations dashboard exception band | Exception Rules / Alerts or filtered Service Requests | none |
| hierarchical-selector | approval form | Submission form taxonomy section | Request Categories | __variables_.SelectedHierarchy |
| kpi-card-set | dashboard | Dashboard KPI header | static/dashboard KPI config JSON backed by seeded records | none |
| multi-entry-tag-input | approval form | Submission form tags section | user-entered tags | __variables_.RequestTagsJson |
| related-record-summary-grid | approval form/dashboard | Submission form related records and dashboard recent records | Asset / Vendor / Related Records | none |
| smart-lookup-picker | approval form/data-list form/dashboard | Submission form asset/vendor lookup and data-list custom form | Asset / Vendor / Related Records | __variables_, __list_, or __temp_ targets by context |
| trend-chart-module | dashboard | Operations dashboard trend band | Service Requests date fields | none |

## Data Model

- Service Requests
- Request Categories
- Subcategories
- Asset / Vendor / Related Records
- Compliance Checklist Items
- Request Tags
- Approval History / Timeline Events
- Exception Rules / Alerts
- Request Metrics / Summary Records

## Workflow

- Submit
- Manager Review
- Compliance Review
- Final Approval
- Rejected / Returned
- Completed persistence

## Sample Data Strategy

- Seed service requests across statuses, categories, priorities, dates, and risk levels.
- Seed category/subcategory and hierarchy records to support selector templates.
- Seed asset/vendor/related records so lookup and related-record components render meaningful data.
- Seed approval history and activity events linked to request ids.
- Seed exception records or service requests that satisfy overdue/high-risk/missing-compliance conditions.

## Runtime Test Plan

- `activity-timeline`: render with representative data; contexts: dashboard, approvalForm, dataListForm.
- `approval-decision-panel`: render plus interaction/writeback if configured; contexts: approvalForm.
- `approval-timeline`: render with representative data; contexts: approvalForm, dataListForm.
- `checklist-compliance-block`: render plus interaction/writeback if configured; contexts: approvalForm, dataListForm.
- `dependent-selector`: render plus interaction/writeback if configured; contexts: approvalForm, dataListForm.
- `distribution-chart-module`: render with representative data; contexts: dashboard.
- `exception-alert-panel`: render with representative data; contexts: dashboard, approvalForm, dataListForm.
- `hierarchical-selector`: render plus interaction/writeback if configured; contexts: approvalForm, dataListForm.
- `kpi-card-set`: render with representative data; contexts: dashboard, approvalForm, dataListForm.
- `multi-entry-tag-input`: render plus interaction/writeback if configured; contexts: approvalForm, dataListForm.
- `related-record-summary-grid`: render with representative data; contexts: dashboard, approvalForm, dataListForm.
- `smart-lookup-picker`: render plus interaction/writeback if configured; contexts: dashboard, approvalForm, dataListForm.
- `trend-chart-module`: render with representative data; contexts: dashboard.

## Known Risks / Blockers

- Full showcase .yap generation and runtime testing are intentionally deferred to Phase 2/3 to avoid silently skipping templates.
- Local workspace currently lacks TypeScript/esbuild packages for real TSX compile; only source parsing is available unless tooling is installed or provided.
- Twelve templates are inventory-only and need generated-app runtime proof before support claims.
- Public form support is not planned or claimed.

## Phase Split

1. Inventory and plan/spec: complete in this branch phase.
2. Generated showcase app: next phase after reviewing this plan/spec.
3. Runtime testing and skill updates: final phase after local validation passes.
