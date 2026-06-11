# Yeeflow Application UI/UX Standards

This document records the first official generated-app UI/UX standard reference from the mini app export `UI and UX design (1).yap`.

For the consolidated reusable standard, use `docs/yeeflow-application-design-system.md` first, then use this document for export-level evidence.

The source export was studied read-only. The raw `.yap` must not be bundled into generated packages or committed as a standards artifact.

Use `docs/yeeflow-root-style-token-reference.md` and `docs/yeeflow-application-style-token-standards.md` as the design-token references for color, typography, spacing, radius, control, and dynamic style guidance. Do not inject the full root stylesheet into generated apps.

## Studied Export Inventory

Wrapper:

- Title: `UI and UX design`
- Resource format: JSON wrapper with gzip/base64 `Resource`
- `MainListType`: `1024`
- `AppID`: `41`
- `ReplaceIds`: `8`
- `ReportIds`: `0`
- `FormKeys`: `UI-AF`

Application resources:

- Root app/listset: `UI and UX design`
- Dashboard page: `Dashboard`
- Data list: `Data List`
- Data-list custom forms:
  - `Edit Item`
  - `View Item`
- Approval form: `Approval form`

The mini app intentionally contains a minimal control tree. It proves layout scaffolding, naming, page settings, and form-bottom placement rather than rich field or dashboard content.

## Global Generated-App Rule

Generated Yeeflow apps should use this UI shell for every generated page or form surface where the schema supports it:

1. Full-width content area.
2. Zero page padding.
3. One top-level parent container named `Main`.
4. One child container named `Content`.
5. Most visible business content placed inside `Content`.

Designer names are stored as `nv_label`, not as visible page text.

Generated apps should use Yeeflow-native root style tokens where the page/control schema supports style values. Prefer token references such as `var(--c--primary)`, `var(--c--neutral-light-active)`, `var(--fs--base)`, and `var(--sp--s200)` over arbitrary custom colors or spacing. Do not force token usage when a Yeeflow export stores resolved hex values.

Required container naming:

| Name | Stored as | Purpose |
| --- | --- | --- |
| `Main` | `control.nv_label` | Top-level parent container for the generated page/form content |
| `Content` | `control.nv_label` | Main visible content area inside `Main` |
| `Form body` | `control.nv_label` | Approval-form business fields inside `Content` |
| `Form bottom` | `control.nv_label` | Approval-form workflow controls at the end of `Content` |

## Page Settings

Zero padding is stored as:

```json
{
  "attrs": {
    "container": {
      "padding": [
        null,
        {
          "top": "--sp--s0",
          "right": "--sp--s0",
          "bottom": "--sp--s0",
          "left": "--sp--s0"
        }
      ]
    }
  }
}
```

Full-width content area on forms is stored as:

```json
{
  "attrs": {
    "container": {
      "cw": "2"
    }
  }
}
```

Dashboard hidden header is stored as:

```json
{
  "attrs": {
    "hideHeaderAll": true
  }
}
```

## Design Tokens

Default generated-app semantic mapping:

| Use | Preferred token |
| --- | --- |
| page background | `--c--neutral-light` or `--c--background` |
| card/container background | `--c--background` |
| primary action | `--c--primary` |
| success status | `--c--success` / `--c--success-light` |
| warning status | `--c--warning` / `--c--warning-light` |
| danger status | `--c--danger` / `--c--danger-light` |
| neutral border | `--c--neutral-light-active` |
| muted text | `--c--neutral-dark` |
| body text | `--c--text` or `--c--text-normal` |

Typography defaults:

- body and form labels: `--fs--base`
- helper text and metadata: `--fs--s` or `--fs--xs`
- section headings: `--fs--l` or `--fs--h6`
- page headings: `--fs--h3` through `--fs--h1`, used sparingly
- normal text weight: `--fw--regular`
- section/card heading weight: `--fw--semi-bold`

Spacing defaults:

- global shell padding: `--sp--s0`
- field gaps: `--sp--s150` or `--sp--s200`
- card padding: `--sp--s200` or `--sp--s300`
- section gaps: `--sp--s300` or `--sp--s400`

Radius and borders:

- small controls: `6px`
- standard cards/sections: `8px`
- larger panels/upload/settings containers: `12px`
- neutral borders: `var(--c--neutral-light-active)`

## Main And Content Container Shape

The standard `Main` container uses:

```json
{
  "type": "container",
  "label": "Container",
  "nv_label": "Main",
  "attrs": {
    "style": {
      "gap": [null, "--sp--s0"],
      "direction": [null, "column"],
      "justify_content": [null, "flex-start"],
      "align_items": [null, "center"]
    }
  }
}
```

The standard `Content` container uses:

```json
{
  "type": "container",
  "label": "Container",
  "nv_label": "Content",
  "attrs": {
    "style": {
      "gap": [null, "--sp--s0"],
      "direction": [null, "column"],
      "justify_content": [null, "flex-start"]
    }
  }
}
```

In dashboard and custom list form examples, `Content.attrs.style.align_items` may exist as `[null, null]`. Generators may omit that value when not needed.

## Navigation Naming

The studied root navigation contains:

- `Dashboard` for the Type `103` page.
- `Data List` for the data list.
- A Type `105` approval-form navigation entry pointing to `UI-AF`.

Generator rule:

- Use clean business names in navigation.
- Avoid field slot names, internal IDs, and implementation terms.
- For future apps, use specific names such as `Overview`, `Requests`, `Catalog`, and `Submit Request` instead of generic names when the business domain is known.

## Generator Rules

Generated app builders should:

- Apply the global page shell to generated dashboards, custom list forms, and approval form pages.
- Use Yeeflow root style tokens for colors, spacing, and typography where supported by native style attributes.
- Prefer semantic status tokens: primary, success, warning, danger, and neutral.
- Avoid arbitrary hard-coded colors unless copied from a real export or required because Yeeflow stores resolved values.
- Preserve existing hard rules such as native `Title` metadata and `Data.Forms[].ListID = 0`.
- Use `nv_label` for container naming.
- Keep IDs fresh for every generated package.
- Keep workflow logic unchanged when the task is UI/UX improvement only.
- Include Action Panel and Flow History by default in generated approval forms unless the user explicitly asks to omit them.
- Keep raw `.yap`, `.ydl`, `.ywf`, zip, env, secret, and credential artifacts out of commits.

## Validator Recommendations

The validators now add warnings for the UI/UX standard where safe:

- Dashboard hidden header, zero padding, and `Main` / `Content` containers.
- Custom list form full width, zero padding, `Main` / `Content` containers, and Edit/View form mapping.
- Approval form full width, zero padding, `Main` / `Content` / `Form body` / `Form bottom`, and workflow controls in `Form bottom`.
- Excessive arbitrary hard-coded colors where a known root token or semantic token should be used.
- Literal hex colors that exactly match known root token values, where the target schema accepts token references.

These checks are warnings for now. They should become generator/final errors only after a generated package using the standard imports, opens, and exports back cleanly.

## Exceptions

Allowed exceptions:

- Minimal dashboard-only research packages may omit `Content` content while proving shell behavior.
- Some approval forms may omit Action Panel or Flow History only when the user explicitly requests it or when a real export proves the form type should omit them.
- Legacy compatibility validation should not fail solely because older exports do not follow this new UI standard.

## First Generation Test Direction

The first generated test package should be layout-focused:

- One dashboard.
- One data list.
- Two custom list forms: `Edit Item` and `View Item`.
- One approval form with request and task page structures.
- No external connections, AI, document library, custom code, or complex workflow logic.

See `yeeflow-ui-ux-standard-first-generation-test-plan.md` and `yeeflow-ui-ux-standard-first-generation-test-spec.json`.
