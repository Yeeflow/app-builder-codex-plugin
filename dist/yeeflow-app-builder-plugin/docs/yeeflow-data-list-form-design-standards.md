# Yeeflow Data List Form Design Standards

Generated data lists should provide predictable custom forms by default.

## Required Custom Forms

Every generated data list should include:

- `Edit Item`
- `View Item`

New and Edit should use `Edit Item`. View should use `View Item`.

## Required Shell

Both forms use:

- `attrs.container.cw = "2"`
- zero padding
- page-level background on the custom form `attrs.background` when a full-page background is needed
- `Main` -> `Content`

`Main` is structural. Do not set full-page background color on `Main.attrs.common.background`; use the custom form page-level background instead. Field group, card, page header, and readonly-section backgrounds are allowed on their own containers.

## Edit Form Pattern

`Edit Item` should be input optimized:

- group related fields into `Field group`
- keep required fields near the top
- use concise field labels
- use helper text only when it clarifies data entry
- use native controls first

## View Form Pattern

`View Item` should be display optimized:

- use readonly/display controls where available
- group important identifiers and status near the top
- use `Readonly section` for non-editable detail
- avoid presenting the view form as a disabled copy of the edit form when a cleaner display layout is possible

## Field Grouping

Recommended groups:

- `Basic information`
- `Details`
- `Status`
- `System information`
- `Readonly section`

Keep group names business-friendly and avoid field-slot names.

## Style

Use root-token-aligned styles:

- white or background-token sections
- neutral borders
- `6px` control radius
- `8px` or `12px` section radius
- `--fs--base` body text
- `--sp--s150` / `--sp--s200` field gaps

## Native Title Rule

Generated lists must preserve native `Title` metadata. Business labels may be displayed on `Title`, but `Title` is not a normal custom field.

## Validator Guidance

Warn for missing Edit/View forms, incorrect display settings, missing `Main` / `Content`, non-full-width form pages, non-zero padding, `Main` carrying full-page-like background, missing page-level background when `Main` has a background, and excessive arbitrary colors.

Data-list custom form headings, helper text, card labels, and empty-state text should follow the shared Text control standard in `docs/yeeflow-text-control-generation-standards.md`. Default to native `heading` Text controls with inline width, `[null, token]` typography presets, plain string colors, and meaningful `nv_label`.

## Form Actions

Approval-form exports prove that Yeeflow form actions can use page load, button click, temp variables, Set variable, Confirm dialog, Query data, Submit form, and Save changes patterns. Data-list custom forms may use the same conceptual front-end form action model, but generator output should wait for a data-list custom form export or focused runtime test for the exact wrapper.

When a data-list custom form uses form actions in the future:

- use page-level background, not Main background
- keep action buttons inline width
- use meaningful `nv_label`
- use temp variables only for front-end/runtime state
- do not rely on temp variables for backend persistence unless values are copied into real fields
- use Query data with explicit selected fields and mappings
- use Submit form / Save changes only in form contexts, never dashboard contexts
