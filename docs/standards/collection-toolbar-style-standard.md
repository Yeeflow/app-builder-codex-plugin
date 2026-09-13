# Collection toolbar and row-menu styling

## Proof and applicability

This opt-in fallback was verified on an existing Dashboard Collection in a desktop browser after save and exact persisted readback. It is not a fresh-package import, all-host, mobile or full-theme proof. Prefer export-backed native Style properties. Only use the fallback when that path is insufficient and the observed DOM matches the selectors below.

## Ownership and repair

Single-control exceptions belong to that control's `attrs.common.css`. Yeeflow expands `selector` to the control wrapper scope. Shared appearance may use a semantic CSS class; CSS IDs must be unique per page and are not shared style labels. Never style all `.ak-form-button-btn` descendants of a Collection card to change just its Add button: that also changes row Drop bars and menu buttons.

Use `scripts/lib/collection-toolbar-style.mjs` with explicit control objects and roles. `applyCollectionToolbarStyle(button, 'add')` makes its 40px minimum-height box inline-flex and centers content. `applyCollectionToolbarStyle(filter, 'select')` unifies the 40px single-select shell, zero vertical padding, and 38px rendered/placeholder/selected-value boxes. Keep native placeholder display/hiding untouched; forcing `display:block!important` exposes placeholder text over selected values. Remove the specific superseded ancestor rules only after reviewing their other consumers. The helper preserves unrelated CSS and bindings and is idempotent; it does not remove arbitrary legacy CSS automatically.

For a right-edge row menu, call `configureCollectionRowMenu(dropbar)`. `attrs.settings.autoposition` is a scalar boolean. Position is a responsive array; a value only at index 3 is mobile-only. Fill missing desktop and mobile placements with `bottomRight`, retain explicit existing placements and other settings. Check actual placement after opening: automatic positioning may flip to `topRight`.

On dark menus only, `applyDarkMenuButtonStyle(actionButton)` sets white foreground in normal/hover/active with a control-scoped priority override and icon/text inheritance. The observed page default `.pageCraft_1 .comp-wrapper .ak-form-button-btn` used primary blue even though the menu button's saved normal color was white. Do not assume a successful save or inherited parent foreground proves actual button color. Avoid globally overriding all page buttons or hardcoding runtime `ak-dynamic-*` classes. White-on-light menus require a different reviewed palette; do not use this helper indiscriminately.

`inspectCollectionToolbarScope` warns about broad Container button height/color selectors and traverses both children and Collection tablecols. It is an advisory review helper, not an automatic proof that all arbitrary CSS is safe. Use explicit opt-in repair/generation and do not restyle every existing Collection during unrelated app generation.

## Acceptance and remaining gaps

Run `node scripts/test-collection-toolbar-style.mjs` and the native-rich-content suite in source and distribution. Local tests cover scope, repeatability, preservation of action/filter metadata, both native trees, responsive placement and placeholder visibility rules. They are not browser visual tests.

Browser acceptance must verify Add text/icon alignment; each Select empty, selected and cleared state; filter intersection; right/bottom-edge menu containment; readable menu text/icon and hover/active states. Compare data outside the declared change scope before save and read back after save. Query updates are asynchronous: wait for the known expected rows to stabilize before measuring or opening their menus. An early row count may still be the previous result; a row replacement may dismiss an open menu.

Observed desktop results: Add content has equal top/bottom space; three selected filters have zero center displacement; their intersection yields the expected record and clearing restores placeholders; a 180px menu flips to topRight and remains in the viewport; normal-state Edit text and icon compute to white. Separate hover/active visual proof, mobile visual proof, exhaustive filter candidate coverage, Owner accessibility text and actual Edit-versus-View routing remain pending. This training does not publish or install a plugin release.

## Generated-artifact validation

Source Golden templates keep their exact exported mobile-only placement. Generated responsive Collections may additionally use desktop bottomRight with native autoposition enabled while preserving mobile bottomRight. The dataset presentation gate accepts this bounded generated variant; it still rejects mobile drift, unsupported placement and a disabled auto-position flag on this variant.
