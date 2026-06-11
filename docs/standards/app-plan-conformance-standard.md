# App Plan Conformance Standard

Version: Official v0.6.21-api-map.0

Generated Yeeflow applications must conform to the approved app plan. Schema validity, package validity, workflow graph validity, and UI materialization checks are necessary but not sufficient.

The app plan is a generation contract. It must be compared to the generated YAP/YAPK implementation before the package is described as complete or ready.

## Required Coverage

Plan conformance validation must compare planned and generated:

- data lists
- approval forms and workflows
- dashboard/workspace pages
- reports
- AI agents, copilots, and tools
- knowledge resources
- integrations and connections
- permissions, security, settings, and admin resources
- navigation groups and navigation child items

Every planned item must be classified as one of:

- `implemented`
- `partially_implemented`
- `missing`
- `extra_unplanned`
- `unsupported_unproven_export_shape`
- `intentionally_deferred_with_reason`

Silent omission is not allowed. If the generator cannot implement a planned item, it must explicitly mark the item as unsupported, unproven, or intentionally deferred with a reason.

## Readiness Boundary

Post-generation reports must separate:

- schema validation
- package validation
- workflow graph validation
- UI/materialization validation
- plan-conformance validation

A package may be schema-valid and still fail plan conformance. Do not call a generated app complete when planned resources, functions, or information architecture are materially missing.

## Validator

Use:

```bash
node scripts/validate-app-plan-conformance.mjs --plan <plan.md|plan.json> --package <app.yap|app.yapk|decoded.json>
```

Use `--mode strict` when the user asked for the full approved application or when release/test artifacts must prove plan fidelity. In default mode, missing planned resources are errors; grouped navigation can be a warning only when grouped navigation export shape is not yet proven and the implementation report says so explicitly.
