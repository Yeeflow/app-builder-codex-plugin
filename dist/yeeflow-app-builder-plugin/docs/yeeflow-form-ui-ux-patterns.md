# Yeeflow Form UI/UX Patterns

This document is a shared form-design index for generated Yeeflow apps.

For the consolidated standard, use `docs/yeeflow-application-design-system.md`.

For approval forms, use `docs/yeeflow-approval-form-ui-ux-patterns.md` and `docs/yeeflow-approval-form-design-standards.md`.

For data-list custom forms, use `docs/yeeflow-data-list-ui-ux-patterns.md` and `docs/yeeflow-data-list-form-design-standards.md`.

For design tokens, use `docs/yeeflow-root-style-token-reference.md` and `docs/yeeflow-application-style-token-standards.md`.

## Shared Form Rules

Generated forms should:

- use full-width content area where the schema supports `attrs.container.cw = "2"`
- use zero page padding in the standard shell
- use `Main` and `Content` containers named by `nv_label`
- put visible business fields inside `Content`
- use Yeeflow root tokens instead of arbitrary custom colors where possible
- preserve native Yeeflow controls and avoid custom CSS injection

## Shared Token Defaults

| Use | Preferred token |
| --- | --- |
| form background | `--c--background` |
| section border | `--c--neutral-light-active` |
| subtle section background | `--c--neutral-light` or `--c--neutral-light-hover` |
| primary action | `--c--primary` |
| success status | `--c--success` |
| warning status | `--c--warning` |
| danger status | `--c--danger` |
| body text | `--c--text` |
| help text | `--c--neutral-dark` |
| normal font size | `--fs--base` |
| help font size | `--fs--s` or `--fs--xs` |
| field gap | `--sp--s150` or `--sp--s200` |

## Radius And Control Defaults

- inputs, selects, buttons: `6px`
- standard form sections/cards: `8px`
- larger panels: `12px`
- neutral borders: `var(--c--neutral-light-active)`

Do not inject `root_styles.txt` into generated apps. Use it as a reference for native design-token choices.
