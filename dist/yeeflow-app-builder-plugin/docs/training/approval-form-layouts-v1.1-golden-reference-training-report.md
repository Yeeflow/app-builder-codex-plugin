# Approval Form Layouts v1.1 Golden Reference Training Report

## Source

Source export:

`Approval form page layout.ywf` user-provided Approval form export.

The export contains one Approval form named `Approval form page layout`, with one submission page and one task page. The decoded `Def` payload was parsed as JSON and the two `pageurls[].formdef` resources were extracted into standalone template JSON files.

## Registered Templates

- `approval_form_layout_submission_v1_1`
- `approval_form_layout_task_v1_1`

Registry:

`docs/reference/approval-form-layout-templates.json`

Template files:

- `docs/reference/approval-form-layout-submission.template.json`
- `docs/reference/approval-form-layout-task.template.json`

## Contract Added

Approval form generation must use these templates as page-level golden references:

- the submission page must use `approval_form_layout_submission_v1_1`
- every task page must use `approval_form_layout_task_v1_1`
- only `page_title_content`, `Operations`, `section_content_area`, and `section_title_header` are business-editable slots
- `action_panel_flow_history_wrapper` is locked and must preserve Action panel plus workflow history controls
- Approval form pages must not contain Data Analytics controls, Data Analytics templates, chart/pivot templates, Summary/KPI analytics, or `kpi_metrics_wrapper`
- root page background, zero root padding, hidden-title CSS, and content custom width `1280` must be preserved

## App Plan Contract

The App Plan `Approval Forms Plan` must include an `Approval Form Layout Template Selection` table. It must select the submission template for submission pages and the task template for task pages.

## Validation Added

New validator:

`scripts/validate-approval-form-layout-template.mjs`

New focused regression suite:

`scripts/test-approval-form-layout-template-gates.mjs`

The validator supports:

- registry validation
- standalone form resource validation
- App Plan template-selection validation
- generated-final `.yapk` validation by decoding `Forms[].DefResource` and inspecting `pageurls[].formdef`

## Safety Boundary

This training adds local generator/validator standards only. It does not sign, install, import, upgrade, or run live Yeeflow writes.
