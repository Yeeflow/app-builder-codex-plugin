# Yeeflow Root Style Token Reference

This document summarizes reusable design-token guidance from `/Users/Renger/Downloads/root_styles.txt`.

The source file is a reference only. Do not inject the full CSS into generated apps, do not modify the original file, and preserve token names exactly when documenting or using them.

## Source Summary

Source stylesheet:

- product header: `YeeOffice`
- version: `v3.24.2`
- date in source comment: `Thu May 07 2026 18:40:50 GMT+0800`
- root token block: `:root`
- token groups found:
  - `66` color tokens
  - `10` font-size tokens
  - `10` line-height tokens
  - `6` font-weight tokens
  - `15` spacing tokens
  - `1` icon-width token

## Color Tokens

Primary:

| Token | Value |
| --- | --- |
| `--c--primary` | `#0065FF` |
| `--c--primary-hover` | `#005BE6` |
| `--c--primary-active` | `#0051CC` |
| `--c--primary-light` | `#E6F0FF` |
| `--c--primary-light-hover` | `#D9E8FF` |
| `--c--primary-light-active` | `#B0CFFF` |
| `--c--primary-dark` | `#004CBF` |
| `--c--primary-dark-hover` | `#003D99` |
| `--c--primary-dark-active` | `#002D73` |
| `--c--primary-darker` | `#002359` |

Secondary:

| Token | Value |
| --- | --- |
| `--c--secondary` | `#00D1FF` |
| `--c--secondary-hover` | `#00BCE6` |
| `--c--secondary-active` | `#00A7CC` |
| `--c--secondary-light` | `#E6FAFF` |
| `--c--secondary-light-hover` | `#D9F8FF` |
| `--c--secondary-light-active` | `#B0F1FF` |
| `--c--secondary-dark` | `#009DBF` |
| `--c--secondary-dark-hover` | `#007D99` |
| `--c--secondary-dark-active` | `#005E73` |
| `--c--secondary-darker` | `#004959` |

Base:

| Token | Value | Use |
| --- | --- | --- |
| `--c--background` | `#FFFFFF` | default page/card background |
| `--c--text` | `#071638` | primary text |
| `--c--text-normal` | `#071638` | normal text |
| `--c--accent` | `#03B349` | accent/success-like status |
| `--c--extra-color-1` | `#F9C434` | warning-like status |
| `--c--extra-color-2` | `#F61515` | danger-like status |

Success:

| Token | Value |
| --- | --- |
| `--c--success` | `#15DF42` |
| `--c--success-hover` | `#13C93B` |
| `--c--success-active` | `#11B235` |
| `--c--success-light` | `#E8FCEC` |
| `--c--success-light-hover` | `#DCFAE3` |
| `--c--success-light-active` | `#B6F5C4` |
| `--c--success-dark` | `#10A732` |
| `--c--success-dark-hover` | `#0D8628` |
| `--c--success-dark-active` | `#09641E` |
| `--c--success-darker` | `#074E17` |

Warning:

| Token | Value |
| --- | --- |
| `--c--warning` | `#F9C434` |
| `--c--warning-hover` | `#E0B02F` |
| `--c--warning-active` | `#C79D2A` |
| `--c--warning-light` | `#FEF9EB` |
| `--c--warning-light-hover` | `#FEF6E1` |
| `--c--warning-light-active` | `#FDEDC0` |
| `--c--warning-dark` | `#BB9327` |
| `--c--warning-dark-hover` | `#95761F` |
| `--c--warning-dark-active` | `#705817` |
| `--c--warning-darker` | `#574512` |

Danger:

| Token | Value |
| --- | --- |
| `--c--danger` | `#F61515` |
| `--c--danger-hover` | `#DD1313` |
| `--c--danger-active` | `#C51111` |
| `--c--danger-light` | `#FEE8E8` |
| `--c--danger-light-hover` | `#FEDCDC` |
| `--c--danger-light-active` | `#FCB6B6` |
| `--c--danger-dark` | `#B91010` |
| `--c--danger-dark-hover` | `#940D0D` |
| `--c--danger-dark-active` | `#6F0909` |
| `--c--danger-darker` | `#560707` |

Neutral:

Generated app themes should use Neutral with `lightmodel: "Luminance"`. Do not use `Lightness` for Neutral in new generated packages.

| Token | Value |
| --- | --- |
| `--c--neutral` | `#B3B7C0` |
| `--c--neutral-hover` | `#A1A5AD` |
| `--c--neutral-active` | `#8F929A` |
| `--c--neutral-light` | `#F7F8F9` |
| `--c--neutral-light-hover` | `#F4F4F6` |
| `--c--neutral-light-active` | `#E7E9EB` |
| `--c--neutral-dark` | `#868990` |
| `--c--neutral-dark-hover` | `#6B6E73` |
| `--c--neutral-dark-active` | `#515256` |
| `--c--neutral-darker` | `#3F4043` |

## Typography Tokens

Font size:

| Token | Value | Suggested use |
| --- | --- | --- |
| `--fs--xs` | `10px` | helper text, metadata |
| `--fs--s` | `12px` | compact labels, table metadata |
| `--fs--base` | `14px` | body text and form labels |
| `--fs--l` | `16px` | section headings or prominent body |
| `--fs--h6` | `18px` | card titles |
| `--fs--h5` | `20px` | page subsection titles |
| `--fs--h4` | `22px` | dashboard panel titles |
| `--fs--h3` | `25px` | page titles |
| `--fs--h2` | `28px` | app overview headings |
| `--fs--h1` | `32px` | rare top-level dashboard titles |

Line height:

- `--lh--xs`
- `--lh--s`
- `--lh--base`
- `--lh--l`
- `--lh--h6`
- `--lh--h5`
- `--lh--h4`
- `--lh--h3`
- `--lh--h2`
- `--lh--h1`

All line-height tokens are `160%` in the source.

Font weight:

| Token | Value |
| --- | --- |
| `--fw--light` | `300` |
| `--fw--regular` | `400` |
| `--fw--medium` | `500` |
| `--fw--semi-bold` | `600` |
| `--fw--bold` | `700` |
| `--fw--italic` | `400` |

## Spacing Tokens

| Token | Value |
| --- | --- |
| `--sp--s0` | `0` |
| `--sp--s012` | `1` |
| `--sp--s025` | `2` |
| `--sp--s050` | `4` |
| `--sp--s075` | `6` |
| `--sp--s100` | `8` |
| `--sp--s150` | `12` |
| `--sp--s200` | `16` |
| `--sp--s250` | `20` |
| `--sp--s300` | `24` |
| `--sp--s400` | `32` |
| `--sp--s500` | `40` |
| `--sp--s600` | `48` |
| `--sp--s800` | `64` |
| `--sp--s1000` | `80` |

Recommended generated-app spacing:

- page padding in the official UI/UX shell: `--sp--s0`
- card internal padding: `--sp--s200` or `--sp--s300`
- field group gap: `--sp--s150` or `--sp--s200`
- dense inline gap: `--sp--s100`
- large dashboard section gap: `--sp--s300` or `--sp--s400`

## Border, Radius, And Shadow Patterns

Observed reusable patterns:

- neutral borders commonly use `var(--c--neutral-light-active)`
- light panel backgrounds commonly use `var(--c--neutral-light)` or `var(--c--neutral-light-hover)`
- selected controls often use `var(--c--primary)`
- common radius values are `6px`, `8px`, and `12px`
- circular icon buttons use `50%`
- common soft shadow: `0px 0px 10px 0px #C1C1C140`
- stronger popover shadow: `0 2px 20px 0 rgba(0, 0, 0, 0.1)`

Generated-app recommendation:

- use `6px` for small inputs/buttons and segmented controls
- use `8px` for standard cards/sections
- use `12px` for larger cards, upload areas, and settings-style containers
- use `var(--c--neutral-light-active)` for standard borders
- use shadows sparingly; prefer neutral borders for operational apps

## Form Control Patterns

Observed form-control defaults:

- `.ant-btn`, `.ant-select-selection`, `.ant-input`, `.ant-time-picker-input`: `border-radius: 6px`, `border-color: var(--c--neutral-light-active)`
- `.ant-input-number`: `border-radius: 6px`, `overflow: hidden`
- input group addons use `background-color: var(--c--neutral-light-hover)` and `border-color: var(--c--neutral-light-active)`
- helper descriptions use small text and `var(--c--text)`

Generator guidance:

- avoid arbitrary input border colors
- use neutral borders and background tokens
- use `--fs--base` for normal field text
- use `--fs--s` or `--fs--xs` for help text

## Button, Switch, And Radio Patterns

Buttons:

- primary action color should use `var(--c--primary)`
- hover/active states should use `var(--c--primary-hover)` and `var(--c--primary-active)` where configurable
- secondary/neutral buttons should use neutral borders and background tokens

Switch:

- off state: background `var(--c--background)`, border `var(--c--text)`, knob `var(--c--text)`
- checked state: background `var(--c--text)`, knob/text `var(--c--background)`

Radio / segmented controls:

- outer group background: `var(--c--neutral-light-hover)`
- group border: `var(--c--neutral-light-active)`
- group radius: `6px`
- selected item background: `#ffffff`
- selected item weight: `600`
- selected border: `var(--c--primary)`

Generator guidance:

- prefer native switch/radio controls and token-backed state styles
- avoid custom color palettes for one-off options
- use semantic options and let Yeeflow native controls carry interaction states

## Task Panel Styles

Task/action panel styles use semantic button classes:

- `.btn-save`
- `.btn-approve`
- `.btn-reject`
- `.btn-action-right`

Relevant semantic colors:

- approve/primary actions: `var(--c--primary)` or success tokens when explicitly approval-success
- reject/danger actions: `var(--c--danger)` and `var(--c--danger-hover)`
- secondary actions: neutral tokens

Generated approval forms should continue placing `workflowControlPanel` and `workflowHistory` in `Form bottom`; do not custom-style them unless a real export proves the style payload.

## Dynamic Style Class Patterns

The stylesheet includes dynamic classes for red/yellow/blue/black variants:

- `background-color-red`
- `color-red`
- `border-red`
- `background-color-yellow`
- `color-yellow`
- `border-yellow`
- `background-color-blue`
- `color-blue`
- `border-blue`
- `background-color-black`
- `color-black`
- `border-black`

These classes target labels, radio groups, disabled radio spans, switches, and label dynamic style wrappers.

Generator guidance:

- preserve existing dynamic style class behavior when copying real exports
- prefer semantic tokens for new generated status styles
- do not replace platform dynamic classes unless the generated package owns the complete style pattern

## Table, Grid, And Collection Patterns

Observed patterns:

- `.grid-fullwidth` uses `grid-column: 1 / end`
- Collection grids use `.coll-data-grid` with three equal columns and `30px` row/column gaps
- workflow log collection grids collapse to one column
- table active pagination uses `var(--c--primary)`
- table header/placeholder surfaces often use neutral-light tokens

Generator guidance:

- use native Collection/table controls where possible
- prefer token-backed table borders/backgrounds
- use `grid-fullwidth` behavior for full-width long fields when the form schema supports it
- avoid dense multi-column card grids unless runtime proof exists for the target dashboard pattern

## Semantic Token Mapping For Generated Apps

| Semantic role | Preferred token(s) |
| --- | --- |
| page background | `--c--neutral-light` or `--c--background` |
| card/container background | `--c--background` |
| primary action | `--c--primary` |
| primary hover | `--c--primary-hover` |
| success status | `--c--success`, `--c--success-light`, `--c--success-dark` |
| warning status | `--c--warning`, `--c--warning-light`, `--c--warning-dark` |
| danger status | `--c--danger`, `--c--danger-light`, `--c--danger-dark` |
| neutral border | `--c--neutral-light-active` |
| neutral muted background | `--c--neutral-light-hover` |
| body text | `--c--text` or `--c--text-normal` |
| muted text | `--c--neutral-dark` |

## Validator Recommendations

Add warnings, not hard failures, for generated app definitions when:

- a generated UI surface contains many arbitrary hard-coded hex colors
- a color exactly matches a known token value but is stored as a literal where token usage is supported
- status colors use non-semantic one-off values instead of primary/success/warning/danger/neutral roles
- generated controls override native switch/radio/button colors without a real export pattern

Do not require token usage when Yeeflow exports resolved hex values instead of token references. Compatibility mode should preserve real export evidence.
