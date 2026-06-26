# Data List Custom Form LayoutView Runtime Source Training Report

## Trigger

Business Travel Request validation found that Travel Requests custom Data List forms opened blank and the Designer stayed in a loading state. The generated package had complete New/Edit and View form JSON in `LayoutInResources[0].Resource`, but `Layout.LayoutView` held only a minimal placeholder object.

## Root Cause

The full-app materializer treated `LayoutInResources[0].Resource` as the only form content surface for Type `1` custom Data List forms. Yeeflow runtime and Designer read `Layout.LayoutView` for custom form loading, so the generated forms imported with correct routing but opened as blank shells.

## Training Result

The materializer now writes the exact same complete form JSON to both:

- `Layouts[].LayoutView`
- `Layouts[].LayoutInResources[0].Resource`

The Data List Form Layouts v1.1 validator now fails generated packages when:

- `LayoutView` is missing or not complete JSON.
- `LayoutView` is a minimal/source placeholder.
- `LayoutInResources[0].Resource` is missing.
- `LayoutView` and `LayoutInResources[0].Resource` drift.

Full-app materialization tests now assert that generated Type `1` custom forms contain rendered children in both surfaces and that the two surfaces are stable-JSON equivalent.

## Hard-Gate Requirement

Before signing readiness, any generated package with Type `1` custom Data List forms must pass:

```sh
node scripts/validate-data-list-form-layout-template.mjs --package <package.yapk> --plan <yeeflow-app-plan.md>
```

The first-generation preflight must include the same gate. A package that needs manual Designer publish to populate `LayoutView` is not generation-ready.

## Regression Coverage

Focused tests cover:

- Complete `LayoutView` plus matching `LayoutInResources[0].Resource` passes.
- Placeholder `LayoutView` fails.
- `LayoutView` / embedded Resource drift fails.
- Full-app materializer writes custom Data List form JSON to both runtime and export surfaces.

## Safety Boundary

This training does not claim runtime proof from local package validation alone. Runtime proof still requires install or upgrade, Version Management success where applicable, and browser verification that New/Edit/View forms open with business fields.
