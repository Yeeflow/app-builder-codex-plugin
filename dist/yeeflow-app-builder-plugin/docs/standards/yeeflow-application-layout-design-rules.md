# Yeeflow Application Layout Design Rules

This standard defines the official Yeeflow application chrome layouts that generated design images and UI implementation contracts may use. It is based on human-reviewed reference screenshots and redacted package-level study only. The provided YAPK Resources were not copied into this repository, and no raw screenshots are committed here.

The screenshot-derived layout details below are `human_reviewed_derived_rules`. They are not automated screenshot proof. If future tooling adds reliable screenshot or design-image parsing, that parser must state its proof boundary separately.

## Layout Inventory

Generated design image specs and UI implementation contracts must choose exactly one of these layout IDs:

| Layout ID | Runtime menu position | Name | Chrome shape |
| --- | --- | --- | --- |
| `application-layout-1-vertical-nav` | `left` | Application layout 1: vertical navigation menu panel | App header across the top plus a persistent left navigation panel. |
| `application-layout-2-horizontal-nav` | `default` | Application layout 2: horizontal navigation menu bar | App header across the top plus a second horizontal menu bar below it. |
| `application-layout-3-header-nav` | `onheader` | Application layout 3: navigation menu on the header | App header and primary navigation share one top header row. |
| `application-layout-4-no-nav` | `none` | Application layout 4: no navigation menu / hidden navigation | App header remains visible; navigation menu chrome is hidden. |

## Common Rules

- Every generated design image must declare exactly one `applicationLayoutType`.
- Every page image in the same application must use the same `applicationLayoutType`.
- Header/navigation chrome must match the selected Yeeflow layout.
- Page-specific content must stay inside the selected layout's content safe area.
- Generated design images must not invent unsupported SaaS shells, arbitrary sidebars, arbitrary top bars, floating navigation systems, or navigation patterns outside the four Yeeflow layouts.
- Colors, app icon, app name, menu icon color, menu text color, background color, selected color, hover color, and foreground color may be customized only inside the selected Yeeflow layout structure.
- If the layout cannot be verified automatically from the image/spec, mark `humanReviewRequired: true`.
- Screenshot-derived rules must be marked `human_reviewed_derived_rules` or `review_required`; do not claim automated screenshot understanding unless a real parser is implemented.
- YAPK-derived docs/tests may contain only derived/redacted layout metadata, such as layout type, header/nav/content region concepts, configurable style categories, menu placement behavior, safe content area rules, and forbidden unsupported chrome patterns.

## Design-Image Contract Requirements

Every generated design image spec or UI implementation contract must include:

- `applicationLayoutType`
- `applicationLayoutName`
- `applicationChrome`
- `headerRules`
- `navigationRules`
- `contentSafeAreaRules`
- `allowedCustomization`
- `forbiddenChromePatterns`
- `humanReviewRequired` if visual/layout verification is incomplete
- `layoutVerification` or equivalent wording that distinguishes declared compliance, human-reviewed derived rules, and automatically verified layout compliance

Recommended contract proof wording:

```json
{
  "applicationLayoutType": "application-layout-1-vertical-nav",
  "applicationLayoutName": "Application layout 1: vertical navigation menu panel",
  "layoutVerification": {
    "declaredCompliance": true,
    "humanReviewedDerivedRules": true,
    "automaticallyVerified": false
  },
  "humanReviewRequired": true
}
```

## Layout-Specific Rules

### application-layout-1-vertical-nav

- Header region: full-width top app header. It contains the app icon/menu affordance, app name, and right-side utility controls such as help/settings/profile.
- Nav region: persistent left vertical navigation panel below the header. Menu items are stacked vertically with an icon and label. Grouped items may expand in place.
- Content safe area: starts to the right of the left navigation panel and below the header. Page title, action buttons, dashboards, lists, cards, and reports must not overlap the header or left nav.
- Page title: belongs at the top of the page content area, not inside the app header or nav panel.
- Dashboard/content cards: belong in the central content canvas with a visible margin from the nav panel and header.
- Allowed navigation/menu behavior: vertical selected state, hover state, icon+label rows, collapsible/expandable menu groups, and a bottom add/component area when the designer surface shows it.
- Forbidden generated-image mistakes: arbitrary product sidebars, floating left rail detached from the header, content cards under the nav panel, page title inside the nav panel, or a second unrelated top navigation bar.

### application-layout-2-horizontal-nav

- Header region: full-width top app header. It contains the app icon/menu affordance, app name, and right-side utility controls.
- Nav region: horizontal menu bar directly below the app header. Primary menu items flow left to right. Nested menu items may appear in a dropdown under the active top-level item.
- Content safe area: starts below the horizontal menu bar. Page title and page actions are inside the content area below the menu.
- Page title: belongs below the horizontal navigation bar at the start of the content canvas.
- Dashboard/content cards: belong below the page title/action row and must not overlap menu dropdowns.
- Allowed navigation/menu behavior: horizontal selected menu item, hover state, dropdown panel under a parent menu item, menu icon+label groups, and add/new menu affordance inside the bar.
- Forbidden generated-image mistakes: persistent left nav panel, arbitrary app-sidebar shell, content starting underneath the horizontal bar, menu dropdown rendered as page content, or separate non-Yeeflow tab bars.

### application-layout-3-header-nav

- Header region: full-width top row that combines app header and primary navigation. App icon/menu affordance and menu items are in the same header band; utility controls remain on the right.
- Nav region: navigation lives on the header. Nested menu items may open as dropdowns below the active header item.
- Content safe area: starts directly below the combined header. Page title and action buttons are inside the content area.
- Page title: belongs at the top of the content canvas below the header, not inside the header navigation row.
- Dashboard/content cards: belong below the content title/action row and must not cover header dropdowns.
- Allowed navigation/menu behavior: selected header menu item, dropdown menu beneath header item, inline add/new menu affordance, and standard header utility controls.
- Forbidden generated-image mistakes: a second horizontal menu bar below the header, persistent left nav panel, page content inside the header row, floating navigation overlays, or custom SaaS shells that replace Yeeflow header chrome.

### application-layout-4-no-nav

- Header region: full-width top app header. It contains the app icon/menu affordance, app name, and right-side utility controls.
- Nav region: no visible navigation menu. The design must not create a replacement sidebar, horizontal menu bar, header nav, floating nav, or custom app shell.
- Content safe area: starts below the app header and spans the available page width. Page title, actions, cards, lists, dashboards, and reports belong here.
- Page title: belongs at the top of the content canvas below the header.
- Dashboard/content cards: may use the wider available content area but must keep header clearance and page margins.
- Allowed navigation/menu behavior: hidden navigation only. Page-level actions are allowed, but they are not app navigation.
- Forbidden generated-image mistakes: invented sidebars, arbitrary top bars, hidden nav replaced by custom tabs, content overlapping the header, or page controls presented as app navigation.

## Configurable Style Categories

Within the selected layout structure, generated design images may customize:

- app icon
- app name text
- header background and foreground colors
- navigation background and foreground colors
- menu icon color
- menu text color
- selected item background/foreground
- hover item background/foreground
- content background color
- page/card foreground colors

Customization must not change the selected layout's region model. A vertical layout remains vertical, a horizontal layout remains horizontal, an on-header layout keeps navigation on the header, and a no-nav layout stays navigation-free.

## Validator

Use `scripts/inspect-application-layout-design-rules.mjs` to validate generated design image specs or UI implementation contracts before using them as visual implementation references. The validator checks declared layout compliance and safe-area/chrome declarations. It does not visually parse screenshots or design images.

Run it before UI contract handoff when a generated design image or design-image spec is involved:

```bash
node scripts/inspect-application-layout-design-rules.mjs --contract docs/generated-ui-contracts/demo/home.ui-contract.json
```

For multi-page design sets, pass the page set too:

```bash
node scripts/inspect-application-layout-design-rules.mjs \
  --contract docs/generated-ui-contracts/demo/home.ui-contract.json \
  --multi-page-set docs/generated-ui-contracts/demo/pages.json
```

## Proof Boundary

- Package validation, signing, install, upgrade-check, and upgrade-apply success are not application-layout visual proof.
- A declared `applicationLayoutType` is not automatic screenshot proof.
- Without a reliable screenshot/design parser, screenshot-derived layout rules are human-reviewed references and must be marked as such.
- Dynamic KPI proof remains governed by before/after mutation evidence and is unrelated to application chrome layout compliance.
