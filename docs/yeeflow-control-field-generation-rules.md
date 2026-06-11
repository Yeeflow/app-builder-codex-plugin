# Yeeflow Control And Field Generation Rules

This document operationalizes the normalized control and field references for Yeeflow generators.

## Approval Form Controls

- Consult `control-configurations.normalized.json` before using a control type.
- Consult `yeeflow-expression-functions.normalized.json`, `yeeflow-expression-operators.normalized.json`, and `docs/yeeflow-expression-generation-rules.md` before generating calculated controls, dynamic display rules, custom validation rules, lookup filters, or workflow transition conditions.
- Default to proven-safe controls: input, textarea, input_number, currency, radio, switch, datepicker, lookup, list, container, section, heading, workflowControlPanel, and workflowHistory.
- Require `binding` for generated value-entry controls when the value must persist.
- Use `attrs.required` for required behavior and keep custom validators in `attrs.control_validation`.
- Use `attrs.control_display` for dynamic show/hide/readonly/style only when the rule shape is copied from a studied export.
- Use `attrs.control_event_rule` only when the action is explicitly modeled and validated.
- Yeeflow page/control JSON often stores style and config values as `[null, value]`; schema validators should unwrap that representation before checking primitive value type or enum membership.
- For generated form design quality, use `docs/yeeflow-form-design-quality-rules.md`: page background on `formdef.attrs.background`, `Form header` for request summaries, inline text/icon widths, square icon badges, and two-column `flex_grid` field sections.
- Runtime V2 repaired some environment-sensitive controls by re-adding native controls with minimal attrs. Treat `location-picker`, department/organization picker, `cost-center-picker`, `metadata`, and `icon-upload` as runtime-sensitive unless a focused export proves the exact generated shape.
- File upload controls in the Runtime V2 export include `attrs.ver = 1`; generated file uploads should include this until another export proves otherwise.
- Image/icon upload in Runtime V2 uses `attrs.controlmultiple = true`; generated `icon-upload` should follow that or fall back.
- Detect calculated-looking fields. Use native `calculated` controls for patterns such as `Subtotal = Quantity * Unit Price`; do not generate editable input controls for formulas without an explicit reason.
- Applicant/profile snapshot controls and lookup-autofill target controls should be generated with control-level `readonly: true` unless they are intentional business inputs. This includes applicant employee ID/name/department/boarding date/status/email/line manager and product name/type/unit price/row subtotal/total amount. Keep the applicant/requester picker editable only where the requester is allowed to choose or confirm the applicant.
- Generate expression arrays with exact Yeeflow token shapes. Variables must use `exprType: "variable"`, `type: "expr"`, and `valueType` limited to `number`, `text`, `date`, or `boolean`. Do not invent expression functions or operators.

### AI Training Approval Control Reference

`docs/ai-training-approval-form-control-study.md` documents the focused `AI Training.yap` approval form export. Use it as an export-backed anatomy reference for broad approval-form controls, not as a complete generated-app runtime baseline.

Observed control-to-variable rules:

- `input`, `textarea`, `richtext`, `radio`, and `checkbox` bind text variables.
- `input_number`, `percent`, and `currency` bind number variables.
- `switch` binds boolean variables.
- `datepicker`, `daterange`, and `time` bind date variables.
- `file-upload`, `icon-upload`, `identity-picker`, `organization-picker`, `location-picker`, `cost-center-picker`, `metadata`, `mutiple-metadata`, `lookup`, and `list` bind their corresponding advanced variable types.
- `daterange` uses the From variable as `binding` and stores the To variable in `attrs["binding-date-range"]`.
- `list` controls require a matching `variables.basic[]` list variable whose `value` points to a `variables.listref[]` entry; list child controls use `attrs.list_field`, `attrs.list_field_binding`, and `attrs.list_control_id`.

Generation posture:

- The sample improves schema knowledge for `percent`, `checkbox`, `richtext`, file/image upload, pickers, metadata, lookup-list, sublists, tabs, action buttons, and data-list display controls.
- These patterns remain runtime-sensitive for generated packages until each is proven by a focused generated import test.
- For generator final mode, unresolved lookup sources, metadata category IDs, picker dependencies, or listref structures are stop conditions.

### Runtime Coverage Consolidation

Use `approval-form-control-runtime-coverage.json` and `docs/approval-form-control-runtime-coverage-matrix.md` as the current control safety matrix.

Runtime-proven generated controls now include:

- `input`, `textarea`, `input_number`, `currency`, `checkbox`, `switch`, `datepicker`
- `percent`, `time`, `hyperlink`, `rate`, `calculated`
- `file-upload` and `icon-upload` for workflow-form upload/display, with binary list persistence still deferred
- editable single-select `identity-picker`, with text-summary persistence
- internal packaged single-select `lookup`
- workflow-form `list` / `listref` row capture and review display
- `workflowControlPanel` and `workflowHistory`

Partial or environment-dependent controls:

- `richtext`, `radio`, and `daterange` need focused persistence checks.
- `organization-picker`, `location-picker`, and `cost-center-picker` render/open but depend on tenant metadata and retention behavior.

Deferred controls:

- Stage 5 metadata/tag controls are intentionally skipped for now: `metadata`, `mutiple-metadata`, and `tag`.
- `lookup-list`, embedded `data-list`, `signer`, and tab/layout-only controls need separate isolated packages.

Lookup persistence rule:

- A raw lookup variable mapped into a plain text data-list field persisted the internal local row ID in v6.
- Use `attrs.addition[]` autofill variables or explicit summary variables when generated apps need readable lookup text such as product name, code, category, or price.
- Autofill target controls should normally be readonly; the lookup selection is the editable user input.
- Store the raw lookup row ID only when downstream logic intentionally needs the row ID or the target field is a proven lookup-compatible data-list field.

List/listref persistence rule:

- Generated list/listref controls can render a row table, add/edit child values, submit, show values on reviewer tasks, and complete approval.
- Direct child-row-to-data-list persistence is not proven. Persist a text summary or model a separate child list until row persistence is export-proven.

Sublist calculated field and summary rule:

- Updated `Approval Form Controls Test v6` proves row-level calculated fields inside a list control using `exprType: "variable_ctx"` current-object tokens.
- Add calculated row fields to both `variables.listref[].fields[]` and the submit-page list control `attrs["list-fields"][]`.
- Store row formulas in the child control at `control.attrs.calculated`.
- Use `attrs["list-fields-summary"]` on the parent list control for Sum/Average summaries.
- Bind numeric summaries to top-level number variables with `{ "prefix": "__variables_", "value": "<VariableId>" }`.
- FlowKey/form key text must not be a lowercase substring of reserved JSON property names used by summary binding objects. Known failure: FlowKey `EFI` was replaced inside `prefix`, corrupting it to `pr<runtimeFlowKey>x` and breaking summary-to-variable binding. Avoid keys that collide with `prefix`, `suffix`, `field`, `fields`, `profile`, `definition`, `workflow`, `variable`, `filter`, `ref`, `href`, `control`, `collection`, `condition`, `expression`, `attributes`, `actions`, or `binding`.
- Use summary-bound variables such as `TotalAmount` for display, ContentList persistence, and workflow routing.
- Keep direct child-row-to-data-list persistence deferred; summary values and text summaries are the safe durable persistence path.

## Data List Fields

- Consult `field-configurations.normalized.json` before using a field/control type.
- Preserve native Title metadata in every generated list:
  - `FieldName: "Title"`
  - `Status: 0`
  - `IsSystem: true`
  - `IsIndex: true`
  - `FieldIndex: 0` when present in the package style
- Use `Rules.required`, `Rules.placeholder`, `Rules.choices`, numeric, date, and lookup rules only when type-compatible.
- For internal app-level lookup samples, local target sample IDs may be included in `ReplaceIds`.
- For standalone/external lookup samples, external IDs must be excluded from `ReplaceIds`.

## Fallback And Stop Rules

- Prefer Text fallback for user, organization, location, cost center, tag, metadata, hyperlink, signer, and file/image display values until native runtime is proven.
- For data-list persistence, prefer Text fallback for requester/user values unless a focused data-list identity/user field export proves the native persisted field shape. Approval forms may still use identity-picker for current-user workflow assignment when that pattern is proven.
- Prefer Decimal fallback for percent and rate until native display behavior is proven.
- Defer signer, metadata tree, lookup-list, embedded data-list display, and sublist row persistence unless a focused export/import proves the shape. If explicitly generating native file/image controls, follow the Runtime V2/v3 attrs, use workflow-form usage as proven, and keep binary data-list persistence deferred.
- Do not guess enum values, picker max-selection settings, lookup metadata, or calculated-column formulas.

## Validator Policy

- Unknown control or field type: warning in compatibility, stricter warning/error in generator final where the generator is expected to know the shape.
- Invalid enum value: warning or error depending on proven support and final stage.
- Invalid primitive value type: warning unless it breaks a required proven field/control.
- Missing lookup target metadata: error for generated packages.
- Runtime-unproven types: warning with a stop condition for production-like generation.

## Skill Scope Decision

A standalone `yeeflow-control-field-schema` skill was not created in this learning pass. The reference is cross-cutting, but the operational use belongs inside the existing approval-form, data-list, and application generators. Keeping the normalized references in the project and pointing existing skills at them avoids a duplicated skill surface while still allowing a dedicated schema skill later if this grows into an independent authoring workflow.
