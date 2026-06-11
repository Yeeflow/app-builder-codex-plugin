# Vendor Onboarding v4.8 Split Dashboard 02 YAPK Proof

## Summary

This proof regenerates only the YAPK upgrade package for the Vendor Onboarding dashboard-control issue. YAP generation remains paused.

Output package:

- `/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-4.8 - split dashboard 02.yapk`

Source package studied:

- `/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-4.6 - dashboard style improvement.yapk`

## User-Edited Control Findings Applied

- Grid controls must use the dashboard `flex_grid` control shape. The generated dashboards now use `flex_grid` rather than a container-only grid emulation.
- Grid controls must have display caption turned off. Product-edited examples do this with `displayLabel: [null, false]`; generated `flex_grid` controls follow that pattern.
- Dashboard section cards must use `container` controls with tokenized padding, background, border, and radius settings.
- Button controls must use `action_button`. The generated dashboard no longer emits legacy `button` controls.
- Containers use flex-style item settings for direction, alignment, justification, and element gap.
- Dashboard dynamic controls are scoped inside the Kanban item template only. No Dynamic Field, Dynamic User, Dynamic Image, or Dynamic File controls are placed directly on the dashboard root or inside plain containers.
- Every data list default view includes display fields.
- Every data list includes 10 synthetic sample records for runtime testing.
- Dashboard page structure must follow the reference `Sample Overview duplicated from another app`: page content-area padding is `--sp--s0`, page background is neutral light, the top-level container is `Main`, the next container is `Content`, and all visible sections are children of `Content`.
- `Vendor Management Dashboard` preserves the user-updated inline-width header/action container behavior and tighter gaps from the style-improved package.
- `Vendor Management Dashboard 02` is split into two smaller dashboards: Dashboard 02 for progress/alert and Dashboard 03 for operational queue/vendor records.
- Child data-list `List.LayoutView` routing is populated with `add`, `edit`, `opentype`, `sort`, and `view` keys so default add/edit/view loading has an explicit list-level route map.

## Generated Dashboards

The package splits the dashboard into two pages:

- `Vendor Management Dashboard`: header/action area and KPI card row only.
- `Vendor Management Dashboard 02`: progress and alert section only.
- `Vendor Management Dashboard 03`: Kanban operational queue, recent activity, and Vendors table sections.

The dashboards include:

- Header/action area using padded containers and `action_button`
- KPI card row using `flex_grid`
- Progress summary section
- Business alert section
- Onboarding status Kanban with dynamic item-template fields
- Recent activity section
- Vendors Data table with configured `Field` and `FieldName` columns

The previous diagnostic pages are intentionally removed because this version tests two simpler dashboard pages.

Each generated dashboard uses:

- page `attrs.container.padding = [null, { top/right/bottom/left: "--sp--s0" }]`
- page `attrs.background.classic.color = "var(--c--neutral-light)"`
- top-level `container` with `nv_label = "Main"`
- nested `container` with `nv_label = "Content"`
- visible section containers inside `Content`

Each child data list now has list-level `LayoutView` in this shape:

- `add: "default"`
- `edit: "default"`
- `opentype: { view: "new" }`
- `sort: []`
- `view: <default Type 0 view LayoutID>`

## Data Lists

Synthetic sample data was generated for each list:

| Data list | Sample rows | Display fields |
| --- | ---: | ---: |
| Vendors | 10 | 17 |
| Vendor Documents | 10 | 5 |
| Compliance Reviews | 10 | 5 |
| Vendor Activity / History | 10 | 6 |

## Validation Results

YAPK strict product schema validation:

- Command: `node scripts/validate-standard-package-schema.mjs "/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-4.8 - split dashboard 02.yapk"`
- Result: pass
- Errors: 0

YAPK package validator:

- Command: `node validate-yapk-package.js "/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-4.8 - split dashboard 02.yapk"`
- Result: pass
- Errors: 0
- Warnings: 1 runtime-proof reminder

YAPK schema standard inspector:

- Command: `node scripts/inspect-yapk-schema-standard.mjs "/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-4.8 - split dashboard 02.yapk"`
- Result: pass

Targeted dashboard control audit:

- dashboard pages: 3
- dashboards with page content-area padding zero: 2
- dashboards with `Main > Content` container structure: 2
- `Vendor Management Dashboard` `flex_grid` controls: 1
- `Vendor Management Dashboard 02` `flex_grid` controls: 0
- `Vendor Management Dashboard 03` `flex_grid` controls: 0
- `flex_grid` controls without `displayLabel: [null, false]`: 0
- `flex_grid` controls with `nv_label`: 0
- `action_button` controls: 2
- legacy `button` controls: 0
- containers: 15
- containers with padding: 12
- dynamic controls outside Collection/Kanban: 0
- Data table columns include `Field` and `FieldName`: yes
- child data-list `List.LayoutView` route maps valid: 4 of 4

Signing:

- `setsign`: pass
- `verifysign`: pass
- signature byte length: 32

## Proof Boundary

This is a local generation and validation proof for a YAPK upgrade package. Runtime success still requires installing this package as an upgrade and reviewing the combined dashboard in Yeeflow.

## Manual Test Checklist

- Upload `/Users/Renger/Downloads/Vendor Onboarding & Compliance Management v4.1 Dashboard-4.8 - split dashboard 02.yapk` as an upgrade to the current Vendor Onboarding application.
- Confirm upgrade succeeds.
- Open `Vendor Management Dashboard`.
- Verify the Navigator tree starts with `Main > Content`.
- Verify the header/action area and KPI row render without any visible Grid caption row.
- Open `Vendor Management Dashboard 02`.
- Verify it contains only the progress and alert section.
- Open `Vendor Management Dashboard 03`.
- Verify it contains the operational queue and vendor records sections.
- Verify Dashboard 02 and 03 no longer show layout issues from a crowded combined page.
- Verify padded containers show expected card background, border, radius, and spacing.
- Verify buttons render as proper Yeeflow buttons.
- Verify the Kanban renders and dynamic controls appear only inside Kanban cards.
- Verify the Vendors Data table shows configured columns.
- Open each data list and confirm the default view has display fields.
- Confirm each data list has at least 10 sample rows.
- Open New item, Edit item, and View item flows for each data list and confirm the default forms load.
