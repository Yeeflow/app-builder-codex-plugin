# Data List Workbench Empty Right Column Training Report

Date: 2026-07-08

## Problem

Dashboard Workbench pages already learned that `main_work_queue_wrapper` must drop the second Grid column when `right_side_panel` is removed or has no business content. Data List View Item Workbench forms use a separate template, `data_list_form_layout_workbench`, but had only the empty `right_side_panel` cleanup gate. That meant a generated Data List Workbench form could remove the panel while retaining the template's two-column desktop Grid, leaving a blank right-side area.

## Required Rule

For `data_list_form_layout_workbench`:

- Keep `right_side_panel` only when it contains real business content.
- If `right_side_panel` is removed or empty, normalize `main_work_queue_wrapper.attrs.columns` to one `1fr` column for PC/laptop, tablet, and mobile.
- Do not leave a retained second desktop column after pruning the right panel.

This is specific to Data List Workbench View Item forms. Approval forms do not use the Workbench page layout and only inherit the shared Data Filter group rule.

## Generator Change

`materializeDataListFormResource()` now calls `normalizeDataListWorkbenchMainQueueColumns()` after removing empty business sections. The helper removes any empty `right_side_panel` child and rewrites `main_work_queue_wrapper` to a single responsive `1fr` column set.

## Validator Change

`validate-data-list-form-layout-template.mjs` now fails generated Data List Workbench forms with:

- `DATA_LIST_FORM_LAYOUT_WORKBENCH_EMPTY_RIGHT_COLUMN_NOT_PRUNED`

when there is no meaningful `right_side_panel` but `main_work_queue_wrapper.attrs.columns["1"].list` still contains more than one column track.

## Regression Coverage

`test-data-list-form-layout-template-gates.mjs` now includes a negative Workbench fixture with no `right_side_panel` and a retained two-column `main_work_queue_wrapper`, proving the hard gate catches this template-fidelity defect before signing readiness.
