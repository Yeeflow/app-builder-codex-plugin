# Approval Task Layout Workflow Surfaces Training Report

## Purpose

This training extends the approved `approval_form_layout_task_v1_1` golden reference template beyond Approval form task pages. The same task page layout is now the required source of truth for:

- Approval form task pages
- Data list workflow task forms
- Schedule workflow task forms

No new visual template is introduced. The existing task template remains the canonical page shell for all workflow task form surfaces.

## Source Template

- Registry: `docs/reference/approval-form-layout-templates.json`
- Task template: `docs/reference/approval-form-layout-task.template.json`
- Template ID: `approval_form_layout_task_v1_1`

The task template must preserve its exported page shell, root background, root zero padding, hidden form-title CSS, `main > content`, custom content width `1280`, section modules, and locked `action_panel_flow_history_wrapper` with Action panel and workflow history controls.

## App Plan Contract

When a Data list workflow or Schedule workflow includes a task form, the relevant App Plan section must include a `Workflow Task Form Layout Template Selection` table.

Required selected template:

`approval_form_layout_task_v1_1`

The row must identify the workflow task surface:

- `Data list workflow task`
- `Schedule workflow task`

The App Plan remains a business/layout contract only. It must not include generated IDs, workflow runtime IDs, JSON payloads, task URLs, copied control JSON, or implementation-only property paths.

## Generation Contract

Generated workflow task form pages must clone the task template and may edit only:

- `page_title_content`
- `Operations`
- `section_content_area`
- `section_title_header`

Task field controls should be readonly by default unless the business task explicitly requires assignee input.

Data Analytics templates, charts, pivot tables, Summary/KPI controls, and `kpi_metrics_wrapper` remain forbidden on Approval form and workflow task form surfaces.

## Validation Coverage

The focused regression suite now covers:

- Registry declares the task template as approved for Approval form, Data list workflow, and Schedule workflow task surfaces.
- Package validation recognizes Data list workflow and Schedule workflow `DefResource` task pages, not only `Forms[].DefResource`.
- Workflow task pages must carry `approval_form_layout_task_v1_1` provenance.
- Workflow task pages using the submission template fail.
- App Plans with workflow task forms must include `Workflow Task Form Layout Template Selection`.
- Data list workflow and Schedule workflow task selections must use `approval_form_layout_task_v1_1`.

## Safety Boundary

This training changes template standards, planning validation, generated-final preflight coverage, and skill guidance. It does not sign, install, import, upgrade, or run live Yeeflow writes.
