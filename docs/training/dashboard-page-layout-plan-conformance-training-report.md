# Dashboard Page Layout Plan Conformance Training Report

## Scope

This training closes the App Plan to generated Dashboard page-layout conformance gap for all approved Dashboard page-level golden reference templates:

- `dashboard-page-layouts-v1.1`
- `dashboard-page-layouts-workbench`
- `dashboard-page-layouts-two-panel-workspace`
- `dashboard-page-layouts-three-panel-workspace`

## Problem

Generated applications could contain a correct Markdown App Plan row such as:

| Dashboard Page | Selected Dashboard Page Layout Template |
| --- | --- |
| Asset Loan Operations Dashboard | `dashboard-page-layouts-workbench` |
| Overdue Monitor | `dashboard-page-layouts-workbench` |

but the generated decoded Dashboard resources still used the default `dashboard-page-layouts-v1.1` shell. The generated package passed existing Dashboard page-layout validation because the validator only checked whether each generated page matched an approved layout. It did not check whether the generated layout matched the specific layout selected in the App Plan.

## Root Cause

- The Dashboard Page Layout Template Selection table was not consumed as a structured materialization input.
- The full-app materializer used a global `dashboard-page-layouts-v1.1` constant when building every Dashboard shell.
- The Dashboard page-layout validator selected the actual generated template from the resource marker, but did not compare it to the App Plan selected template.

## Training Rules

1. The App Plan `#### Dashboard Page Layout Template Selection` table is a hard generation contract.
2. Every generated Dashboard page must use exactly the selected page-level layout template from that table.
3. `dashboard-page-layouts-v1.1` is only the default when no explicit App Plan selection exists for that page.
4. A selected `dashboard-page-layouts-workbench` page must preserve the Workbench shell and Workbench structural markers such as `main_work_queue_section`, `main_work_queue_wrapper`, `primary_working_area`, optional `right_side_panel`, and `chart_cards_section` when planned.
5. A selected `dashboard-page-layouts-two-panel-workspace` or `dashboard-page-layouts-three-panel-workspace` page must preserve the master-detail workspace shell, `vCurrentItemID` selection model, left-panel list Collection, selected-item detail Collection, and empty-selection state.
6. The generator must not silently fall back to `dashboard-page-layouts-v1.1` when a non-default layout is selected.
7. The validator must fail when the decoded Dashboard resource marker does not match the App Plan selected layout template.

## Implementation

- `materialize-full-app-generated-final.mjs` now parses Dashboard Page Layout Template Selection rows from the Markdown App Plan.
- The materializer records these rows in `plannedResourceDemand.dashboardPageLayoutTemplateRecords`.
- The generated Dashboard shell is selected per page using the App Plan record.
- `validate-dashboard-page-layout-template.mjs` accepts `--app-plan` and checks selected layout to actual decoded resource conformance.
- `validate-dashboard-generation-hard-gates.mjs` forwards `--plan` to the Dashboard page-layout validator, so first-generation preflight catches mismatches.

## Regression Coverage

`scripts/test-dashboard-page-layout-plan-conformance-gates.mjs` covers:

- Workbench selected in App Plan but v1.1 generated: hard fail.
- Each approved Dashboard page layout selected in App Plan and generated as that layout: pass.
- Full-app materializer preserves Workbench, two-panel workspace, and three-panel workspace selections instead of falling back to v1.1.

## Proof Boundary

This training proves App Plan to generated resource template conformance for Dashboard page-level layouts. It does not by itself prove browser/runtime data correctness, install success, or live upgrade behavior; those still require generated-final preflight, signing/verifysign, package API install or upgrade, Version Management `Succeed`, and browser/runtime proof.
