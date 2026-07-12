# Approval Sub List Column Title Focused Training

## Input Evidence

The generated `Business Travel Request Approval (1).ywf` contained one `Travel Itinerary` Sub List on both Submission and Task forms. Each form had seven row fields. All 14 nested row controls had valid IDs and bindings, but none had `control.label` or `control.label_var`, so every table header rendered blank.

Manual Designer edits proved that a fixed column Title serializes as:

```json
"label": "Itinerary Date",
"label_var": null
```

## Root Cause

The shared Approval Form builder treated a Sub List as an ordinary full-row field. It set the parent list caption but did not materialize the ListRef/Complex Type row schema into titled nested controls. The generated-final materializer also discarded nested row-field metadata while normalizing Approval Form field specs. The final YWF validator checked field IDs and bindings but not visible column titles.

## Training Changes

1. The shared builder now accepts `listFields`, `rowFields`, or `subListFields` and creates export-shaped nested field controls.
2. Every nested field control receives its planned business title in `label`, fixed-title marker `label_var: null`, and visible-title setting.
3. A shared recursive normalizer repairs missing labels without replacing an existing custom business label.
4. The full-app materializer preserves row-field specs, supports the optional App Plan `Sub List Row Fields` column, creates matching ListRef fields, and applies the same normalizer to generated-final form resources.
5. Final YWF validation blocks missing `control.label` and missing `control.label_var`.

## Regression Contract

- Submission form: 7/7 Itinerary columns titled.
- Task form: 7/7 Itinerary columns titled and readonly.
- Removing one title fails with `APPROVAL_SUBLIST_COLUMN_CONTROL_LABEL_MISSING`.
- Removing one fixed-title marker fails with `APPROVAL_SUBLIST_COLUMN_CONTROL_LABEL_VAR_MISSING`.
- Existing non-empty custom labels are preserved.
- Source and dist execute the same regression suite.

## Proof Boundary

This focused training proves generated JSON shape and pre-signing validation. It does not by itself prove import, Designer rendering, submission, task execution, or runtime persistence. Those remain E2E proof steps for the next generated Approval Form.
