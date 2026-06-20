# Yeeflow Root Token Reference Design System Gates Training Report

## Scope

This training PR adds the Yeeflow Root Token Reference as the default design-token foundation for Application Design System generation, UI Pattern Library selection, Page Implementation Blueprints, and Yeeflow resource generation.

The source extraction used only the `:root` definitions from the product-provided CSS file at `/Users/rengerhu/Downloads/app.css`. The plugin now contains the extracted reference in:

- `docs/standards/yeeflow-root-token-reference.md`
- `docs/standards/yeeflow-root-token-reference.normalized.json`

Future application generation must use the plugin-contained documentation and normalized registry. It must not require access to `/Users/rengerhu/Downloads/app.css`.

## Extracted Token Groups

- Color families: Primary, Secondary, Neutral, Success, Warning, Danger.
- Additional global color tokens: `--c--background`, `--c--text`, `--c--text-normal`, `--c--accent`, `--c--extra-color-1`, `--c--extra-color-2`.
- Typography font sizes: `--fs--xs` through `--fs--h1`.
- Typography line heights: `--lh--xs` through `--lh--h1`.
- Typography font weights: `--fw--light`, `--fw--regular`, `--fw--medium`, `--fw--semi-bold`, `--fw--bold`, `--fw--italic`.
- Spacing scale: `--sp--s0` through `--sp--s1000`, including `--sp--s012` for border width 1.

Implementation selectors outside `:root` were intentionally excluded. Cropper.js CSS, AI chat UI CSS, admin center UI CSS, internal product pages, subscription screens, personal-info modals, and product-specific page selectors are not trained as generated business-app defaults.

## Training Changes

- Added a canonical root token standard with normalized token inventory, raw CSS values, design meanings, recommended usage, tone/state rules, typography rules, spacing rules, border/gap/padding mapping, customization rules, and proof boundaries.
- Added a machine-readable normalized token registry with token category, family, state, raw value, generated-use guidance, and product CSS proof source.
- Updated the Application Design System template so every generated design system declares Primary, Secondary, Neutral, status usage, page background, text, border/divider, card/surface, action states, typography, spacing, border width mapping, customization policy, and control/property proof boundary.
- Updated the UI Pattern Library generation standard so selected patterns declare inherited token intent and Page Implementation Blueprints preserve token names rather than raw CSS guesses.
- Updated the full-page blueprint standard so blueprints carry token mapping for backgrounds, typography, actions, status badges/chips, spacing, gaps, fields, and responsive behavior.
- Updated the Yeeflow application-builder skill and lifecycle reference so Root Token Reference review is required before Application Design System approval and HTML/PNG evidence cannot override token decisions.
- Added a concise Yeeflow FontAwesome icon usage baseline so generated UI icons use Yeeflow-supported FontAwesome classes instead of invented SVG, emoji, image, or arbitrary custom icon names.

## Executable Gates

Added:

- `scripts/validate-yeeflow-root-token-usage.mjs`
- `scripts/test-yeeflow-root-token-reference-design-system-gates.mjs`

Updated:

- `scripts/test-ui-hard-gates-all.mjs`
- `scripts/test-yapk-hard-gate-cache-artifacts.mjs`

The validator checks missing root-token declarations, missing Primary/Secondary/Neutral selection, missing status rules, missing typography/spacing/border/gap mapping, raw token-equivalent values, hover/active state misuse, status colors used as the main Primary palette without business reason, dropped token names in blueprints, and missing proof/deferred labels for custom non-token values.

The focused test also covers FontAwesome icon usage: valid tokenized FontAwesome icon controls pass, while emoji icons, inline SVG/image icons, arbitrary icon names, and clickable icon-only actions without label/tooltip intent fail.

Allowed exception labels are:

- `runtime-proof-required`
- `export-learning-required`
- `deferred`
- `explicit-user-approved-custom-token`

## Proof Boundary

The Yeeflow Root Token Reference is product CSS token-reference proof. It is not runtime proof, package proof, API acceptance proof, install/import/upgrade proof, browser proof, or visual proof by itself.

## Safety

This is a training PR only. It does not bump the plugin version, move `stable`, create tags/releases/plugin archives, run live Yeeflow writes, or run package signing/install/import/upgrade.
