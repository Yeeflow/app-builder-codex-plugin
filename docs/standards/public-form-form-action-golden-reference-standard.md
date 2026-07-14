# Public Form Form Action Golden Reference Standard

## Scope

Anonymous Data List Public Forms have a smaller Form Action surface than Custom Data List forms. They cannot read or mutate other application resources. Their action expressions are limited to fixed values, fields on the current host Data List that are allowed on Public Forms, and temp variables declared on the same Public Form.

## Allowed Steps

The product UI allows exactly these eight capabilities: Set variables, Execute custom code, Show confirm dialog, Redirect page to, Submit form, Start another action, Barcode scan, and NFC reader.

`setvar` and `redirect` are export-proven by `Customer Satisfaction (2).ydl` and have normalized templates in `docs/reference/public-form-form-action-set-variables.template.json` and `docs/reference/public-form-form-action-redirect.template.json`. `confirm`, `submit`, and `otheraction` reuse established Form Action step shapes but still require Public Form runtime proof. Execute custom code, Barcode scan, and NFC reader are product-UI-backed only in this training; their exact Public Form package serialization must not be guessed. Generated-final materialization must stop with `PUBLIC_FORM_ACTION_STEP_SERIALIZATION_UNPROVEN` until a decoded export proves each shape.

All other Form Action step types are forbidden, including Query data, Set data list, Open item form, Open approval form, Open dashboard, Invoke custom service, and application-resource navigation or mutation steps.

## Set Variables

- Targets: current host Data List fields allowed on Public Forms, or same-form temp variables.
- Values: fixed expression tokens, current host Data List field tokens, and same-form temp-variable tokens.
- Single assignment uses `attrs.setvar_var` plus `attrs.setvar_val`.
- Multiple assignments use `attrs.setvar_multi = true` plus `attrs.setvar_array[]`.
- Application, instance, current-user, workflow-variable, Collection-item context, lookup traversal, or any other resource scope is forbidden.

## Redirect Page To

`attrs.link` may contain a fixed `url`, or an expression-token array in `variable`. Expression URLs may combine only fixed values, current-list fields, and same-form temp variables. Redirect must not resolve an application resource by ID or consume external-resource data.

## Local Action References

`formAction` hooks, control `attrs.control_action`, and `otheraction.attrs.control_action` must resolve to an action ID on the same Public Form. Cross-form and cross-page action invocation is forbidden.

## Custom Data List Form Difference

Custom Data List forms may use broader application-aware actions such as Query data, Set data list, and Open resource steps. Public Forms are anonymous and isolated: sharing the same generic page/action JSON container does not grant those capabilities. Generation and validation must route by host surface first.

## Required Gates

Before signing or standalone `.ydl` handoff, validate the eight-step allowlist, action references, current-list field resolution, temp-variable declarations, Set variables targets and values, Redirect URL/value scope, and the export-proof boundary for screenshot-only steps.
