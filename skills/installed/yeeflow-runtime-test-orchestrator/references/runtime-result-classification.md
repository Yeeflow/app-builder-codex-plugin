# Runtime Result Classification

Use one of these labels for each tested area. Classify narrowly: one app can have a runtime-proven list, a render-only dashboard, and a blocked workflow at the same time.

## runtime-proven

Use when the feature was tested in Yeeflow with real runtime actions and evidence. For example, a form was opened, submitted, reviewed, and the resulting list/workflow state was verified.

## partially proven

Use when some required runtime behavior passed but important paths remain untested or failed. Name the proven paths and missing paths.

## render-only proven

Use when the page, form, dashboard, or custom control renders but data persistence, action behavior, workflow side effects, or data binding were not tested.

## blocked by configuration

Use when testing is blocked by missing tenant settings, permissions, users, roles, connectors, feature flags, or environment setup that is outside the package itself.

## blocked by package/materialization

Use when import, app creation, list/form/workflow materialization, corrupted IDs, missing resources, graph validation, or package structure prevents runtime testing.

## blocked by Yeeflow runtime context

Use when Yeeflow runtime behavior or access prevents proof even though local package validation did not find a structural blocker. Examples include unavailable runtime modules, inaccessible public form context, or runtime-only SDK differences.

## not tested

Use when no runtime action was performed for the feature. Do not infer proof from similar controls or local validation.

## Reporting Format

For each row include:

- area: list, form, dashboard, workflow branch, expression, custom code, or lifecycle
- result: one label above
- evidence: test action and observed result
- blocker or gap
- next action
