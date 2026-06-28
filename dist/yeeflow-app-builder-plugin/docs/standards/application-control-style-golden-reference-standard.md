# Application Control Style Golden Reference Standard

## Purpose

Generated Yeeflow applications must use the export-backed **Soft outline controls** Application Custom Control Style as the default control style. This keeps generated forms, dashboards, workflow task pages, and other app surfaces aligned with the same low-noise enterprise control styling.

## Source Of Truth

- Golden reference registry: `docs/reference/application-control-style-golden-references.json`
- Golden reference template: `docs/reference/application-control-style-soft-outline-controls.template.json`
- Template ID: `application_control_style_soft_outline_controls`

The uploaded `.ycs` file is the authoring source, but generated `.yapk` packages must follow the package-materialized shape proven by the exported reference app. In Yeeflow package export shape, the style is stored in `Themes[]`.

## Required Package Shape

Every generated full application package must include:

1. A Type `1` Application Custom Control Style theme:
   - `ID`: a fresh package-local UUID for this generated package; do not reuse the golden reference control style theme ID
   - `Name`: `Soft outline controls (Codex)`
   - `Config`: a stringified JSON object matching the package-materialized golden reference config
   - `Ext`: `null` in exported references or `""` in generated-final schema-safe packages

2. A Type `0` application style theme:
   - `ID`: `41_<decoded.ListSet.ListID>`
   - `Name`: `application style`
   - `Config`: `null` in exported references or `""` in generated-final schema-safe packages
   - `Ext`: a JSON string with `controlDefaultId` pointing to the Type `1` control style theme ID

Do not rely on Yeeflow System control styles or tenant-global custom style IDs for generated packages. The application package must carry its own Application Custom Control Style and explicitly set it as the default.

The exported template UUID is a reference identity only. Fresh generated applications must clone the Type `1` control style with a new package-local UUID and must update the Type `0` application style `Ext.controlDefaultId` to that new UUID. Only package-local theme identity and style ID fields are remapped; ordinary style tokens, color values, and control-style configuration values inside `Config` must stay unchanged.

## Generation Rules

- New generated applications must emit this control style by default.
- New generated applications must remap the Type `1` control style ID for each fresh package.
- Full-app upgrades must preserve this default style unless the user explicitly requests a different application control style.
- `Theme.Config` must be a string, not an object.
- `Theme.Ext` for the application style must be a valid JSON string, not an object.
- The default style link is invalid if `Ext.controlDefaultId` does not resolve to a Type `1` theme in the same package.
- The package is invalid if a fresh generated package reuses the exported golden reference Type `1` control style UUID.
- Generated-final packages must satisfy `schemas/yapk-schema.json`, which requires `AppThemeInfo.Description`, `AppThemeInfo.Config`, and `AppThemeInfo.Ext` to be strings. Use empty strings for nullable exported-reference fields when generating packages.
- This control style standard is application-level only. It must not change page layout, data-list, approval, dashboard, collection, analytics, or workflow golden-reference contracts.

## Hard Gate

`scripts/validate-application-control-style-template.mjs` must pass before a generated-final package is eligible for signing. The validator checks the registry, package `Themes[]`, default-style linkage, stringified config shape, and exact package-materialized style config.

## Proof Boundary

This standard is based on exported `.ycs` and `.yapk` package evidence. It proves package shape and default-style wiring. It does not claim live Designer or runtime rendering without a separate runtime proof.
