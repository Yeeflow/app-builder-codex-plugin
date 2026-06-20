# Yeeflow Root Token Reference

This standard is the canonical plugin-contained reference for Yeeflow root design tokens. It was extracted from the product-provided CSS file `/Users/rengerhu/Downloads/app.css` by reading only the `:root` custom property definitions. Future generation must use this plugin-contained document and `docs/standards/yeeflow-root-token-reference.normalized.json`; it must not require reading the original Downloads CSS file.

Do not train unrelated implementation CSS from the source file as business-app defaults. Cropper.js rules, AI chat UI, admin center UI, internal product pages, subscription screens, personal-info modals, product-specific page selectors, and other non-root selectors are out of scope.

## Proof Boundary

This reference proves product CSS token names and raw root values only. It is not runtime proof, visual proof, package proof, install/import/upgrade proof, or Yeeflow resource serialization proof by itself. Generated Application Design Systems, UI Pattern selections, Page Implementation Blueprints, and resources must still pass their own validators and runtime proof boundaries.

## Color Token Inventory

| Token | Family | Tone/state | Raw CSS value | Design meaning | Allowed generated use |
| --- | --- | --- | --- | --- | --- |
| --c--primary | primary | normal | #0065FF | Primary brand/action color family for the generated application. Use as resting/default color only. | Allowed for generated app palette decisions when declared in the Application Design System. |
| --c--primary-hover | primary | hover | #005BE6 | Hover state for primary; do not use as resting color. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--primary-active | primary | active | #0051CC | Active/pressed state for primary; do not use as resting color. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--primary-light | primary | light | #E6F0FF | Light background/tint for primary badges, chips, or subtle sections. | Allowed for generated app palette decisions when declared in the Application Design System. |
| --c--primary-light-hover | primary | light-hover | #D9E8FF | Hover state for light primary surfaces. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--primary-light-active | primary | light-active | #B0CFFF | Active state for light primary surfaces. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--primary-dark | primary | dark | #004CBF | Dark text/icon/border emphasis for primary. | Allowed for generated app palette decisions when declared in the Application Design System. |
| --c--primary-dark-hover | primary | dark-hover | #003D99 | Hover state for dark primary emphasis. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--primary-dark-active | primary | dark-active | #002D73 | Active state for dark primary emphasis. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--primary-darker | primary | darker | #002359 | Strongest primary emphasis; use sparingly for high contrast. | Allowed for generated app palette decisions when declared in the Application Design System. |
| --c--secondary | secondary | normal | #00D1FF | Secondary brand/accent color family for supporting emphasis. Use as resting/default color only. | Allowed for generated app palette decisions when declared in the Application Design System. |
| --c--secondary-hover | secondary | hover | #00BCE6 | Hover state for secondary; do not use as resting color. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--secondary-active | secondary | active | #00A7CC | Active/pressed state for secondary; do not use as resting color. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--secondary-light | secondary | light | #E6FAFF | Light background/tint for secondary badges, chips, or subtle sections. | Allowed for generated app palette decisions when declared in the Application Design System. |
| --c--secondary-light-hover | secondary | light-hover | #D9F8FF | Hover state for light secondary surfaces. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--secondary-light-active | secondary | light-active | #B0F1FF | Active state for light secondary surfaces. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--secondary-dark | secondary | dark | #009DBF | Dark text/icon/border emphasis for secondary. | Allowed for generated app palette decisions when declared in the Application Design System. |
| --c--secondary-dark-hover | secondary | dark-hover | #007D99 | Hover state for dark secondary emphasis. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--secondary-dark-active | secondary | dark-active | #005E73 | Active state for dark secondary emphasis. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--secondary-darker | secondary | darker | #004959 | Strongest secondary emphasis; use sparingly for high contrast. | Allowed for generated app palette decisions when declared in the Application Design System. |
| --c--background | background | global | #FFFFFF | Default page and inverse text background token. | Allowed when the Application Design System maps it to page background, text, card/surface, border/divider, or accent usage. |
| --c--text | text | global | #071638 | Primary text color token. | Allowed when the Application Design System maps it to page background, text, card/surface, border/divider, or accent usage. |
| --c--text-normal | text-normal | global | #071638 | Normal body text color token, currently aligned to primary text. | Allowed when the Application Design System maps it to page background, text, card/surface, border/divider, or accent usage. |
| --c--accent | accent | global | #03B349 | Global accent token for sparing emphasis where not covered by selected Primary/Secondary. | Allowed when the Application Design System maps it to page background, text, card/surface, border/divider, or accent usage. |
| --c--extra-color-1 | extra-color-1 | global | #F9C434 | Additional global color token, aligned with warning in the source CSS. | Allowed when the Application Design System maps it to page background, text, card/surface, border/divider, or accent usage. |
| --c--extra-color-2 | extra-color-2 | global | #F61515 | Additional global color token, aligned with danger in the source CSS. | Allowed when the Application Design System maps it to page background, text, card/surface, border/divider, or accent usage. |
| --c--success | success | normal | #15DF42 | Positive state, completion, accepted, and healthy-status family. Use as resting/default color only. | Allowed for semantic status only; do not use as main app palette without explicit business reason. |
| --c--success-hover | success | hover | #13C93B | Hover state for success; do not use as resting color. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--success-active | success | active | #11B235 | Active/pressed state for success; do not use as resting color. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--success-light | success | light | #E8FCEC | Light background/tint for success badges, chips, or subtle sections. | Allowed for semantic status only; do not use as main app palette without explicit business reason. |
| --c--success-light-hover | success | light-hover | #DCFAE3 | Hover state for light success surfaces. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--success-light-active | success | light-active | #B6F5C4 | Active state for light success surfaces. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--success-dark | success | dark | #10A732 | Dark text/icon/border emphasis for success. | Allowed for semantic status only; do not use as main app palette without explicit business reason. |
| --c--success-dark-hover | success | dark-hover | #0D8628 | Hover state for dark success emphasis. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--success-dark-active | success | dark-active | #09641E | Active state for dark success emphasis. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--success-darker | success | darker | #074E17 | Strongest success emphasis; use sparingly for high contrast. | Allowed for semantic status only; do not use as main app palette without explicit business reason. |
| --c--warning | warning | normal | #F9C434 | Caution, due-soon, attention, and moderate-risk status family. Use as resting/default color only. | Allowed for semantic status only; do not use as main app palette without explicit business reason. |
| --c--warning-hover | warning | hover | #E0B02F | Hover state for warning; do not use as resting color. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--warning-active | warning | active | #C79D2A | Active/pressed state for warning; do not use as resting color. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--warning-light | warning | light | #FEF9EB | Light background/tint for warning badges, chips, or subtle sections. | Allowed for semantic status only; do not use as main app palette without explicit business reason. |
| --c--warning-light-hover | warning | light-hover | #FEF6E1 | Hover state for light warning surfaces. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--warning-light-active | warning | light-active | #FDEDC0 | Active state for light warning surfaces. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--warning-dark | warning | dark | #BB9327 | Dark text/icon/border emphasis for warning. | Allowed for semantic status only; do not use as main app palette without explicit business reason. |
| --c--warning-dark-hover | warning | dark-hover | #95761F | Hover state for dark warning emphasis. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--warning-dark-active | warning | dark-active | #705817 | Active state for dark warning emphasis. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--warning-darker | warning | darker | #574512 | Strongest warning emphasis; use sparingly for high contrast. | Allowed for semantic status only; do not use as main app palette without explicit business reason. |
| --c--danger | danger | normal | #F61515 | Error, rejection, destructive, overdue, and high-risk status family. Use as resting/default color only. | Allowed for semantic status only; do not use as main app palette without explicit business reason. |
| --c--danger-hover | danger | hover | #DD1313 | Hover state for danger; do not use as resting color. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--danger-active | danger | active | #C51111 | Active/pressed state for danger; do not use as resting color. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--danger-light | danger | light | #FEE8E8 | Light background/tint for danger badges, chips, or subtle sections. | Allowed for semantic status only; do not use as main app palette without explicit business reason. |
| --c--danger-light-hover | danger | light-hover | #FEDCDC | Hover state for light danger surfaces. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--danger-light-active | danger | light-active | #FCB6B6 | Active state for light danger surfaces. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--danger-dark | danger | dark | #B91010 | Dark text/icon/border emphasis for danger. | Allowed for semantic status only; do not use as main app palette without explicit business reason. |
| --c--danger-dark-hover | danger | dark-hover | #940D0D | Hover state for dark danger emphasis. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--danger-dark-active | danger | dark-active | #6F0909 | Active state for dark danger emphasis. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--danger-darker | danger | darker | #560707 | Strongest danger emphasis; use sparingly for high contrast. | Allowed for semantic status only; do not use as main app palette without explicit business reason. |
| --c--neutral | neutral | normal | #B3B7C0 | Neutral surface, border, divider, disabled, and subdued text family. Use as resting/default color only. | Allowed for generated app palette decisions when declared in the Application Design System. |
| --c--neutral-hover | neutral | hover | #A1A5AD | Hover state for neutral; do not use as resting color. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--neutral-active | neutral | active | #8F929A | Active/pressed state for neutral; do not use as resting color. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--neutral-light | neutral | light | #F7F8F9 | Light background/tint for neutral badges, chips, or subtle sections. | Allowed for generated app palette decisions when declared in the Application Design System. |
| --c--neutral-light-hover | neutral | light-hover | #F4F4F6 | Hover state for light neutral surfaces. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--neutral-light-active | neutral | light-active | #E7E9EB | Active state for light neutral surfaces. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--neutral-dark | neutral | dark | #868990 | Dark text/icon/border emphasis for neutral. | Allowed for generated app palette decisions when declared in the Application Design System. |
| --c--neutral-dark-hover | neutral | dark-hover | #6B6E73 | Hover state for dark neutral emphasis. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--neutral-dark-active | neutral | dark-active | #515256 | Active state for dark neutral emphasis. | Allowed only for the matching interaction state or with explicit proof/deferred exception. |
| --c--neutral-darker | neutral | darker | #3F4043 | Strongest neutral emphasis; use sparingly for high contrast. | Allowed for generated app palette decisions when declared in the Application Design System. |

## Typography Token Inventory

| Token | Category | Scale/state | Raw CSS value | Design meaning | Allowed generated use |
| --- | --- | --- | --- | --- | --- |
| --fs--xs | font-size | xs | 10px | Micro labels, table metadata, compact helper text. | Allowed for typography scale mapping; preserve token names in blueprints. |
| --fs--s | font-size | s | 12px | Small helper text, captions, compact badges. | Allowed for typography scale mapping; preserve token names in blueprints. |
| --fs--base | font-size | base | 14px | Default body, form labels, table/list text. | Allowed for typography scale mapping; preserve token names in blueprints. |
| --fs--l | font-size | l | 16px | Large body, important field values, compact section lead text. | Allowed for typography scale mapping; preserve token names in blueprints. |
| --fs--h6 | font-size | h6 | 18px | Small section headings. | Allowed for typography scale mapping; preserve token names in blueprints. |
| --fs--h5 | font-size | h5 | 20px | Card titles and subsection headings. | Allowed for typography scale mapping; preserve token names in blueprints. |
| --fs--h4 | font-size | h4 | 22px | Section headings and panel titles. | Allowed for typography scale mapping; preserve token names in blueprints. |
| --fs--h3 | font-size | h3 | 25px | Page subheadings and dashboard group headings. | Allowed for typography scale mapping; preserve token names in blueprints. |
| --fs--h2 | font-size | h2 | 28px | Page titles on compact surfaces. | Allowed for typography scale mapping; preserve token names in blueprints. |
| --fs--h1 | font-size | h1 | 32px | Primary page title or major dashboard title. | Allowed for typography scale mapping; preserve token names in blueprints. |
| --lh--xs | line-height | xs | 160% | Line-height partner for --fs--xs; keep size/line-height scale aligned. | Allowed as the matching line-height token for typography scale mapping. |
| --lh--s | line-height | s | 160% | Line-height partner for --fs--s; keep size/line-height scale aligned. | Allowed as the matching line-height token for typography scale mapping. |
| --lh--base | line-height | base | 160% | Line-height partner for --fs--base; keep size/line-height scale aligned. | Allowed as the matching line-height token for typography scale mapping. |
| --lh--l | line-height | l | 160% | Line-height partner for --fs--l; keep size/line-height scale aligned. | Allowed as the matching line-height token for typography scale mapping. |
| --lh--h6 | line-height | h6 | 160% | Line-height partner for --fs--h6; keep size/line-height scale aligned. | Allowed as the matching line-height token for typography scale mapping. |
| --lh--h5 | line-height | h5 | 160% | Line-height partner for --fs--h5; keep size/line-height scale aligned. | Allowed as the matching line-height token for typography scale mapping. |
| --lh--h4 | line-height | h4 | 160% | Line-height partner for --fs--h4; keep size/line-height scale aligned. | Allowed as the matching line-height token for typography scale mapping. |
| --lh--h3 | line-height | h3 | 160% | Line-height partner for --fs--h3; keep size/line-height scale aligned. | Allowed as the matching line-height token for typography scale mapping. |
| --lh--h2 | line-height | h2 | 160% | Line-height partner for --fs--h2; keep size/line-height scale aligned. | Allowed as the matching line-height token for typography scale mapping. |
| --lh--h1 | line-height | h1 | 160% | Line-height partner for --fs--h1; keep size/line-height scale aligned. | Allowed as the matching line-height token for typography scale mapping. |
| --fw--light | font-weight | light | 300 | Light emphasis only. | Allowed for typography emphasis mapping; do not use raw numeric weights when a token exists. |
| --fw--regular | font-weight | regular | 400 | Default body weight. | Allowed for typography emphasis mapping; do not use raw numeric weights when a token exists. |
| --fw--medium | font-weight | medium | 500 | Form labels, badges, subtle emphasis. | Allowed for typography emphasis mapping; do not use raw numeric weights when a token exists. |
| --fw--semi-bold | font-weight | semi-bold | 600 | Section titles, card titles, table headers. | Allowed for typography emphasis mapping; do not use raw numeric weights when a token exists. |
| --fw--bold | font-weight | bold | 700 | Strong headings and key KPI labels. | Allowed for typography emphasis mapping; do not use raw numeric weights when a token exists. |
| --fw--italic | font-weight | italic | 400 | Italic text style marker; preserve token structure rather than inventing a new weight. | Allowed for typography emphasis mapping; do not use raw numeric weights when a token exists. |

## Spacing Token Inventory

| Token | Raw CSS value | Design meaning | Allowed generated use |
| --- | --- | --- | --- |
| --sp--s0 | 0 | Zero spacing and root content-area padding where required. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |
| --sp--s012 | 1 | One-pixel border/divider width token. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |
| --sp--s025 | 2 | Hairline/very tight spacing. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |
| --sp--s050 | 4 | Tight internal gap. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |
| --sp--s075 | 6 | Compact control gap. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |
| --sp--s100 | 8 | Default compact spacing unit. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |
| --sp--s150 | 12 | Form field and row gap. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |
| --sp--s200 | 16 | Default section/card internal gap. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |
| --sp--s250 | 20 | Large form/control gap. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |
| --sp--s300 | 24 | Page section gap or card padding. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |
| --sp--s400 | 32 | Large section gap. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |
| --sp--s500 | 40 | Extra-large section spacing. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |
| --sp--s600 | 48 | Major page region spacing. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |
| --sp--s800 | 64 | Hero/large dashboard spacing when explicitly needed. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |
| --sp--s1000 | 80 | Maximum page/hero spacing; avoid in dense operational surfaces. | Allowed for padding, margin, gap, border width, table/list/card/form/button spacing where supported. |

## Color Tone And State Decision Rules

- Select Primary, Secondary, and Neutral as application palette families in every Application Design System.
- Use normal/default tokens for resting colors.
- Use `*-hover` tokens only for hover state and `*-active` tokens only for active/pressed state unless an exception is marked `runtime-proof-required`, `export-learning-required`, `deferred`, or `explicit-user-approved-custom-token`.
- Use light tokens for tinted backgrounds, chips, alerts, subtle cards, or low-emphasis sections.
- Use dark/darker tokens for stronger text, icon, border, or high-contrast emphasis.
- Use Success, Warning, and Danger as semantic business/status colors. Do not use them as the main Primary application palette unless the App Plan gives an explicit business reason.
- Map `--c--background` to page background by default and `--c--text` / `--c--text-normal` to primary body text.
- Use Neutral light/active tones for card surfaces, dividers, borders, disabled states, and low-emphasis backgrounds.
- Do not replace token names with raw hex values in Page Implementation Blueprints when a matching token exists.

## Typography Usage Rules

- Use `--fs--base` and `--lh--base` for ordinary body, form, table, and list text.
- Use `--fs--xs`/`--fs--s` with matching line-height tokens for captions, metadata, badges, and helper text.
- Use heading tokens `--fs--h6` through `--fs--h1` with matching `--lh--*` tokens for section, card, page, and dashboard titles.
- Use `--fw--regular` for body text, `--fw--medium` for labels/subtle emphasis, `--fw--semi-bold` for headers and card titles, and `--fw--bold` for strong emphasis.
- Do not use arbitrary px font sizes, numeric line heights, percentages, or raw numeric font weights when a root token matches.

## Spacing Usage Rules

- Use `--sp--s0` for zero root content padding where existing Yeeflow hard gates require it.
- Use `--sp--s012` as the one-pixel border/divider width token. Border width `1` must be explicitly mapped to `--sp--s012`.
- Use `--sp--s050` through `--sp--s150` for compact control, icon, badge, and form-field gaps.
- Use `--sp--s200` through `--sp--s300` for card padding, section internal gaps, and common page rhythm.
- Use `--sp--s400` and larger only for major page/section separation where density permits.
- Preserve token names in Page Implementation Blueprints; do not collapse token intent to raw numeric values.

## Border, Gap, And Padding Mapping Rules

- Border width `1` maps to `--sp--s012`; zero border/padding maps to `--sp--s0`.
- Grid/flex gaps, table/list/card spacing, form field gaps, button spacing, and mobile responsive spacing must map to `--sp--*` tokens when a matching token exists.
- Border/divider color should map to Neutral light/active tones unless the Application Design System declares a semantic state or brand-emphasis reason.
- Use Yeeflow-compatible property paths and preserve token intent alongside raw serialized values when resources require numeric serialization.

## Application Customization Rules

- Each application may customize Primary, Secondary, Neutral, and typography choices.
- Customization must preserve the same token structure: normal, hover, active, light, light-hover, light-active, dark, dark-hover, dark-active, and darker where the family uses those states.
- Arbitrary one-off color/style values are not allowed when a root token exists.
- App-specific custom tokens require one of: `runtime-proof-required`, `export-learning-required`, `deferred`, or `explicit-user-approved-custom-token`.
- HTML/PNG visual evidence cannot override token decisions from the Application Design System.
