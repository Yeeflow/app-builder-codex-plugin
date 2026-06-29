# Application Color Pattern Theme Config Training Report

## Training Scope

This training adds export-backed application color pattern materialization to the existing Soft outline controls application design-system contract.

The scope is intentionally limited to application-level `Themes[]` color configuration:

- Type `1` Application Custom Control Style remains `Soft outline controls (Codex)`.
- Type `0` `application style` remains the default style linker through `Ext.controlDefaultId`.
- Type `0` `Config` now carries the application color pattern as stringified JSON.
- The generator does not import or depend on `color-generator-script.js`; Yeeflow derives variant colors from the base color and `lightmodel`.

## Learned Package Shape

The reference application stores customized application colors in decoded `Themes[]`, on the Type `0` `application style` theme:

```json
{
  "primary": { "value": "#1618e6", "lightmodel": "Luminance" },
  "secondary": { "value": "#d40be2", "lightmodel": "Luminance" },
  "neutral": { "value": "#c0c2c7", "lightmodel": "Luminance" },
  "typography": {
    "fontfamily": "Default",
    "fontweight": "regular",
    "basevalue": 14,
    "scale": "1.125",
    "lineheight": 1.6
  }
}
```

Generated packages must emit this object as a stringified JSON value in `Theme.Config`, not as an inline object.

## App Plan Contract

The App Plan now includes `Application Color Pattern Selection` under the Application Navigation Plan.

The plan selects only:

- Primary base color
- Secondary base color
- Neutral base color

Each selected color must use `Light Model` exactly `Luminance`.

If no custom brand colors are requested, generated packages use the defaults:

- Primary: `#0065FF`
- Secondary: `#00D1FF`
- Neutral: `#B3B7C0`

Success, warning, and danger remain semantic Yeeflow colors and are not derived from project branding colors.

## Base Color Safety

The validator enforces readability and generated-variant safety:

- Primary and Secondary valid OKLCH lightness range: `0.35-0.82`
- Primary and Secondary recommended OKLCH lightness range: `0.42-0.68`
- Primary and Secondary warning threshold: above `0.72`
- Neutral valid OKLCH lightness range: `0.65-0.88`
- Neutral maximum OKLCH chroma: `0.06`

This prevents base colors that are too light to read, too dark to distinguish from generated dark variants, or too saturated to function as a neutral palette.

## Generator Changes

`scripts/materialize-full-app-generated-final.mjs` now parses the App Plan color pattern selection and writes the resulting Type `0` application style `Config`.

The generator still clones the Type `1` Soft outline controls style with a fresh package-local UUID for every fresh package, and the Type `0` `Ext.controlDefaultId` still points to that generated UUID.

## Validator Changes

`scripts/validate-application-control-style-template.mjs` now validates:

- Type `0` application style `Config` is present and stringified JSON
- `primary`, `secondary`, and `neutral` role objects exist
- each role has a valid `#RRGGBB` base color
- each role uses `lightmodel: "Luminance"`
- base colors pass readability ranges
- neutral is low-chroma
- package colors match the App Plan when `--plan` is supplied

`scripts/yapk-first-generation-preflight.mjs` now passes the App Plan into the application control style validator when available.

## Regression Coverage

`scripts/test-application-control-style-template-gates.mjs` covers:

- valid registry/template checks
- valid generated package style and color contract
- missing or object-shaped Type `0` `Config`
- invalid `lightmodel`
- too-light or too-dark brand colors
- high-chroma neutral colors
- App Plan-to-package color mismatch
- materializer default color output
- materializer custom App Plan color output
- fresh Type `1` control style UUID remapping per package

## Safety Boundary

This training changes package generation, local validators, standards, skills, and dist mirrors only. It does not sign, install, import, upgrade, seed data, or run live Yeeflow writes.
