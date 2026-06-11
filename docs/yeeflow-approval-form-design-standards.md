# Yeeflow Approval Form Design Standards

Generated approval forms should be structured for request submission and task review.

## Required Shell

Submission and task pages use:

- `attrs.container.cw = "2"`
- zero padding
- page-level background when a full-page background is required
- `Main`
- `Content`
- `Form body`
- `Form bottom`

`Main` should remain primarily structural. Do not put full-page background color on `Main`; set it on `page.formdef.attrs.background`.
This same rule applies to submission pages and task pages. Section/card/header-specific backgrounds are allowed on their own containers, but `Main` should not be used as the page background layer.

## Form Header

Submission forms with a top request summary should place that area inside a `Form header` container.

`Form header` should carry:

- background
- border
- border radius
- `attrs.style.overflow = [null, "hidden"]`

Use `Request summary panel` and `Request metric row` inside `Form header`. If a gradient is required, use native background first and then `attrs.common.css` on the target container when Yeeflow native background settings cannot express it.

## Form Body

`Form body` contains business content:

- request summary
- applicant/requester fields
- request details
- readonly mirrored fields
- reviewer decision fields
- conditional fields

Recommended child sections:

- `Request summary`
- `Applicant details`
- `Request details`
- `Approval decision`
- `Reviewer notes`

## Form Bottom

`Form bottom` appears at the end of `Content`.

Default controls:

1. `workflowControlPanel`
2. `workflowHistory`

Omit either control only when the user explicitly asks or a real export proves that the form type should omit it.

## Submission Page

The submission page should:

- prioritize editable requester fields
- show conditional fields close to their controlling field
- avoid reviewer-only decision fields
- include Action Panel and Flow History unless explicitly omitted

## Task Page

Task pages should:

- mirror submitted request fields readonly where useful
- include reviewer decision fields
- keep approval comments/decision controls near the decision section
- preserve workflow logic and routing

## Conditional Fields

Conditional fields should:

- have clear business labels
- be placed near the triggering field
- use compatible condition value types
- be mirrored on task pages when reviewers need context

## Style

Use:

- neutral surfaces
- semantic decision/status colors
- `--fs--base` for body text
- `--fs--l` / `--fs--h6` for section headings
- `--sp--s150` / `--sp--s200` field gaps
- neutral borders before shadows

Let native Action Panel and Flow History styling apply unless a studied export proves a safe override.

Text and icon controls should be generated with explicit positioning:

- `heading` / `text-editor`: default to `attrs.common.positioning.widthtype = [null, "2"]`
- `icon`: default to `attrs.common.positioning.widthtype = [null, "2"]`
- section icons should usually be wrapped in square badge containers with centered alignment

Standard field sections should use a `flex_grid` with two desktop/tablet columns and one mobile column. Place long controls such as `textarea`, `richtext`, and `list` outside the grid or make them span the full row after span behavior is export-proven.

Generated forms should detect calculated-looking fields. `Subtotal` should not be a normal editable field when quantity and unit price exist; use a native `calculated` control when safe, or a readonly display with the formula documented as deferred.

Applicant/profile snapshot fields and autofilled fields should be readonly by default. In `Employee Family Implant v1 Core Patch 20260516`, the user repaired `Applicant Name` with the simple export-backed control shape `readonly: true`. Apply the same pattern to generated snapshot controls such as applicant employee ID, department, boarding date, user status, email, line manager, eligibility/status snapshots, lookup-autofilled product type, unit price, row subtotal, and total amount. The requester/applicant picker may be editable only on the new request page; task/reviewer pages should render it readonly.

If the requester/applicant picker is editable for proxy submission, bind its field-change action to rerun applicant snapshot initialization and dependent quota/policy calculations. Field-level Default value = Current User is sufficient for initial defaulting; do not also generate a redundant Set variable step that writes RequesterApplicant from Current User.

For policy and quota sections, keep dependent calculations in ordered form-action steps and use multi-value Set variables only for independent assignments. Submit guard actions should run the relevant policy check first, then use a conditional warning/confirm step with `continue: true` before the native Submit form step when the valid path needs to proceed.

For detailed patterns from the manually improved CAPEX export, see `docs/yeeflow-form-design-quality-rules.md` and `docs/it-hardware-capex-request-runtime-v2-ui-study.md`.

For native Text controls, use `docs/yeeflow-text-control-generation-standards.md`. The focused `Text Style Sample.ywf` export proves that generated Text controls should use `type: "heading"`, inline width at `attrs.common.positioning.widthtype = [null, "2"]`, named typography presets as `attrs.heads.ty = [null, "h5-medium"]`, and plain string colors such as `attrs.heads.color = "var(--c--text)"`.

## Expression Rules

Use `docs/yeeflow-expression-editor-reference.md`, `docs/yeeflow-expression-generation-rules.md`, and the normalized expression references before generating:

- calculated controls
- dynamic display conditions
- custom validation conditions
- lookup filters
- workflow transition conditions
- default values and request-number expressions

Expressions should be Yeeflow expression-token arrays. Do not generate raw JavaScript formulas. Use only known functions/operators from the normalized references and keep variable tokens in the exact required shape.

## Form Actions

Use `docs/yeeflow-form-action-generation-rules.md` and `docs/yeeflow-temp-variable-generation-rules.md` before generating front-end form actions.

Phase 1 export-backed patterns:

- form actions live at `page.formdef.actions[]`
- page load trigger lives at `page.formdef.formAction.onLoad`
- button click trigger lives at `action_button.attrs.control_action`
- temp variable declarations live at `variables.tempVars[]`
- temp expression tokens use `id: "__temp_<tempVarId>"`
- Set variable steps use `type: "setvar"`
- Show confirm dialog steps use `type: "confirm"`

Phase 2 export-backed patterns:

- Query data steps use `type: "querydata"`
- Query multiple can map records into a form `list` variable
- Query single can map selected fields into workflow variables
- Query result counts and temp collections use `__temp_` variable targets
- Query result aggregates can use `arraySum`
- Submit form steps use `type: "submit"`
- Save changes is a submit mode with `attrs.submitType = "3"`

Phase 3 export-backed condition-flow pattern:

- A conditional form-action step uses step-level `condition`.
- The designer checkbox `Continue next step when condition is not met` serializes as step-level `continue: true`.
- Conditional warning/confirm/check steps before submit should usually set `continue: true`; otherwise the valid path can skip the warning but stop before the following Submit form step.

Keep form actions distinct from workflow actions. Form actions are front-end form logic; workflow actions are process graph/backend logic. Use form actions for UI state, defaults, confirmation, query-assisted UI, and safe client-side initialization. Do not use temp variables as the only source for persisted business data.

Use `docs/yeeflow-form-action-query-data-step-rules.md` and `docs/yeeflow-form-action-submit-step-rules.md` before generating Phase 2 form actions.

## Validator Guidance

Warn for missing full width, zero padding, missing page-level background on rich full-page forms, background on `Main`, missing `Main`, missing `Content`, missing `Form body`, missing `Form bottom`, missing `Form header` when a request summary exists, workflow controls outside `Form bottom`, text/icon controls without inline width, field sections without grids, calculated-looking editable fields, applicant/profile snapshot fields that are editable, lookup/autofill target fields that are editable without a documented business reason, runtime-sensitive picker/image attrs, and excessive arbitrary decision/status colors.

## Advanced Control Reference

Use `docs/ai-training-approval-form-control-study.md` when a generated approval form needs broader native controls beyond the current proven-safe set. That export shows many control types in one app-level approval form, including tabs, `flex_grid`, rich text, checkbox multi-choice, percent, file/image upload, user/department/location/cost center pickers, metadata, lookup, lookup-list, sublists, data-list display, action buttons, Action Panel, and Flow History.

Treat the AI Training export as a read-only control anatomy reference. It is not a final generated-app baseline because it contains only a submission page and intentionally exercises controls that are still runtime-sensitive for generation. Promote its patterns only through staged generation and import testing.
