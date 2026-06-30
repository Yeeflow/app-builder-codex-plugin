# Dashboard Navigator Label and Expression Binding Training Report

## Scope

This training hardens generated Dashboard maintainability for Designer users. It addresses a generated master-detail Dashboard where nested Collection item controls appeared in the Yeeflow Navigator as default control names such as `Dynamic user`, `Container`, and `Text`, and where a Text control rendered a raw `iif(dateDiff(...))` formula as visible page text.

## Root Cause

The generated Dashboard controls had business data bindings, but some nested controls did not carry the Designer-facing semantic `nv_label` / `nav_label` fields. Yeeflow Designer therefore fell back to the control type labels in the Navigator.

Separately, visible text controls were not gated against raw formula strings in `attrs.headc.title.value`. That allowed an expression intended for runtime evaluation to appear as literal text when the expression binding shape was wrong or lost during template adaptation.

## Template Updates

The two master-detail Dashboard page layout golden references now include semantic Navigator labels inside `left_panel_data_item_space_between`:

- `left_panel_data_item_title`
- `left_panel_data_item_date_wrapper`
- `left_panel_data_item_date_value`

The update applies to:

- `dashboard-page-layouts-two-panel-workspace`
- `dashboard-page-layouts-three-panel-workspace`

`left_panel_data_item_title` is mandatory. It displays each left-panel Collection item's subject/title field. The generated control may be Dynamic user or Dynamic field based on the selected source field type, but the semantic label must remain `left_panel_data_item_title`.

The date value control must preserve an export-shaped Yeeflow expression binding. It must not render a raw formula string as visible text.

## Generator Rules

The full-app materializer now performs recursive Dashboard control hygiene:

- Dynamic controls mapped from source fields receive stable semantic `nv_label` / `nav_label` values.
- Missing or default Navigator labels are filled with semantic labels derived from existing identities, visible text, bound field metadata, or a stable page/type fallback.
- Existing non-default template labels are preserved.
- Visible Heading/Text formula strings are converted to a safe business label instead of being emitted as raw visible formula text.

This is a generation quality rule, not a replacement for runtime expression proof. Runtime expressions must still use export-proven expression bindings.

## Hard Gates

`validate-dashboard-generation-hard-gates.mjs` now rejects:

- Designer-visible controls inside Dashboard Collection item templates that lack semantic `nv_label` / `nav_label`.
- Visible Dashboard text that contains raw formulas or `Collection item:` expression text.
- Master-detail workspace pages where `left_panel_data_item_space_between` does not preserve `left_panel_data_item_title`.
- `left_panel_data_item_title` controls that are not Dynamic user or Dynamic field.

## Regression Coverage

`test-dashboard-generation-hard-gates.mjs` covers:

- Missing semantic Navigator label on a Collection item internal Dynamic user control.
- Raw formula text rendered inside a Collection item Heading control.
- Existing dashboard generation hard gates continue to pass for valid fixtures.

## Proof Boundary

This training updates plugin generator logic, golden reference templates, standards, and local validators. It does not sign, install, upgrade, or perform live Yeeflow runtime proof.
