# App Plan Conformance Standard

Version: Official v0.6.22

Generated Yeeflow applications must conform to the approved app plan. Schema validity, package validity, workflow graph validity, and UI materialization checks are necessary but not sufficient.

The app plan is a generation contract. It must be compared to the generated YAP/YAPK implementation before the package is described as complete or ready.

## Required App Plan Contract

Every future full app plan must follow the canonical `docs/standards/app-plan-standard-template.md` unless the user explicitly requests a lightweight plan. `docs/app-plan-standard-template.md` is a compatibility entrypoint only. Lightweight plans must still include `Generation Contract and Hard Gates`. Use `docs/app-plan-generation-contract.md` for the hard-gate contract details.

The section must bind later generation to:

- output package decision, including `.yapk` as default and `.yap` only when explicitly requested
- YAPK signing gate with `POST /utils/apppackage/setsign` and `POST /utils/apppackage/verifysign` when credentials are available
- API-issued content ID provenance gate requiring `GET /utils/generate/ids?count=<n>`, a redacted `dist/<app-name>-id-provenance-report.json`, and zero non-API generated content IDs for generated-final `.yapk`
- approval-form contract that prevents approval apps from silently shipping with `Forms: []`
- navigation runtime metadata contract requiring API-issued group IDs, group `AppID`, group `ListSetID`, `Icon`, `list[]`, child `AppID`, child `ListSetID`, target-specific `Type`, and no `children`/`Childs`
- plan-to-package conformance requirements for planned lists, fields, forms, task pages, dashboards/pages, navigation, print pages, workflows/actions, permissions, and integrations
- App Plan control/action/property requirements for record display control selection, item-template Dynamic controls, Collection/Kanban action decisions, Sub List list-action decisions, and plugin-supported type/property/action sources
- exact Yeeflow implementation wording requirements that separate business-friendly labels from supported field/control/action/property types, require split exact type/control/action columns, and block slash-combined or "where supported" wording unless it is marked `runtime-proof-required`, `export-learning-required`, or `deferred`
- proof boundary report separating plan approval, schema validation, ID provenance validation, navigation runtime metadata validation, app-plan conformance, UI/control quality, signing, signature verification, API install/import acceptance, runtime UI inspection, deferred items, and known risks
- runtime inspection checklist for installed test packages

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
- ID provenance validation
- navigation runtime metadata validation
- package validation
- workflow graph validation
- UI/materialization validation
- plan-conformance validation
- YAPK signing and signature verification
- API install/import acceptance
- runtime UI inspection

A package may be schema-valid and still fail plan conformance. Do not call a generated app complete when planned resources, functions, or information architecture are materially missing.

## Validator

Before generation, validate the Markdown plan structure with:

```bash
node scripts/validate-app-plan-resource-order.mjs <plan.md>
```

This validator checks required headings, Yeeflow resource generation order, Placeholder planning, Form Report separation, record display control selection, item-template Dynamic control planning, Collection/Kanban action decisions, Sub List action decisions, plugin-supported type/property rule text, and hard-gate text. It does not call APIs.

Before generation, also validate executable planning readiness and traceability gates:

```bash
node scripts/validate-business-clarification-gate.mjs --spec <functional-spec.md> --plan <plan.md>
node scripts/validate-generation-readiness-review.mjs --plan <plan.md>
node scripts/validate-functional-spec-to-app-plan-traceability.mjs --spec <functional-spec.md> --plan <plan.md>
```

These validators fail unresolved business decision gates, planning defaults used as generation approval, incomplete 13-area generation readiness, missing review-gate evidence, missing record display control selection, missing item-template Dynamic controls, missing Collection/Kanban or Sub List action decisions, combined exact type/control headings, ambiguous implementation wording such as slash-combined exact values or "where supported" actions without a proof/deferred label, unmapped Functional Specification requirement categories, and deferred items without reason/fallback/proof impact. They must pass before design images, page implementation blueprints, resource generation, decoded resource-vs-blueprint parity, signing, install/upgrade, or runtime proof. They prove planning readiness only and do not prove generated package conformance or runtime behavior.

Planning reports must distinguish `Generation Readiness structural check: pass/fail` from overall readiness and must separate `Business Clarification Gate for planning` from `Business Clarification Gate for generation`. If structural readiness passes but generation-mode Business Clarification Gate fails, write `Overall generation readiness: blocked by Business Clarification Gate`; do not summarize the run as simply `Validation passed` or `all passed`.

When Functional Specification and App Plan both repeat the same unresolved business decision gates, report the raw finding count separately from the unique unresolved gate count. Use the Business Clarification validator JSON fields `rawFindingCount`, `uniqueUnresolvedGateCount`, `uniqueUnresolvedGateKeys`, and `gateOccurrences` so users see the real number of decisions to answer even when each gate appears in multiple artifacts.

After generation, validate plan-to-package conformance with:

```bash
node scripts/validate-app-plan-conformance.mjs --plan <plan.md|plan.json> --package <app.yap|app.yapk|decoded.json>
```

Use `--mode strict` when the user asked for the full approved application or when release/test artifacts must prove plan fidelity. In default mode, missing planned resources are errors; grouped navigation can be a warning only when grouped navigation export shape is not yet proven and the implementation report says so explicitly.
