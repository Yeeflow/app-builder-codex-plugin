# Marketing Event v0.6.45 Design Runtime Fidelity Study

## Purpose

This sanitized study converts the Marketing Event v0.6.45 UI design-to-runtime analysis into plugin training material and hard-gate guidance. It is not a runtime implementation attempt, does not retry Marketing Event v1.0.20, v1.0.21, or v1.0.22, and does not claim new visual automation.

The source analysis was read as an input report only. Study docs may reference evidence artifact filenames and relative categories, but must not embed raw JSON contents, screenshots, tenant URLs, workspace IDs, package payloads, decoded Resource data, decoded Sign data, OAuth tokens, API keys, or other private values.

## What v0.6.45 Fixed

v0.6.45 added application layout chrome fidelity gates for generated Yeeflow design images:

- Layout 1 vertical navigation rejects header hamburger icons.
- Layout 1 vertical navigation rejects bottom Collapse controls.
- The canonical Layout 1 style uses a dark top header plus a dark vertical navigation panel.
- App icon and app name placement must stay in the selected application chrome.
- Multi-page design sets must keep one consistent application chrome style, including `applicationChromeStyleId`, header/nav mode, nav background mode, selected state style, app icon placement, app name placement, and content safe area.

These gates protect application chrome. They do not prove page content fidelity, dynamic KPI behavior, or runtime visual quality by themselves.

## What v1.0.20 Exposed

The v1.0.20 Marketing Event implementation exposed gaps beyond chrome fidelity:

- Support data-list entries leaked into primary navigation even though the approved design had only six primary menu items.
- The approved primary navigation was exactly:
  1. Event Portfolio
  2. Planning Workbench
  3. Registration & Leads
  4. Budget Review
  5. Post-event Reporting
  6. Admin
- The first runtime screenshot was stale because Chrome was not explicitly refreshed before capture.
- Broad body-text navigation scans were unreliable because page body text and substring matches can look like navigation evidence.

Visible primary navigation must be generated from the approved UI contract, not inferred from all resources in the package. Support data lists, forms, approval pages, and implementation-only resources must not automatically appear in the primary navigation when the approved design contract excludes them.

## What v1.0.21 Fixed

The v1.0.21 navigation fix restored exact primary navigation fidelity:

- The six approved primary nav items were visible in the correct order.
- Support resources were hidden from primary navigation.
- The fix used schema-compatible `ListSet.LayoutView.sort` metadata.
- Invalid direct `IsHidden` mutations on schema objects were avoided.
- Runtime proof used explicit browser refresh and exact-line navigation evidence instead of a broad body-text scan.

This proves the navigation leak was fixable through app-level layout metadata. It does not prove content fidelity for KPI cards, tables, badges, progress visuals, spacing, hierarchy, or dynamic KPI values.

## Remaining Content Fidelity Gaps

After navigation fidelity was restored, the runtime content still showed gaps relative to the design image:

- KPI card visual richness: icon blocks, labels, values, trend indicators, and card hierarchy need stronger structural checks.
- Table visual richness: badge, progress, avatar, row-detail, and status treatment need stronger checks.
- Spacing and visual hierarchy need richer declared expectations and runtime evidence.
- Runtime KPI values can differ from design mock values; mock-vs-runtime KPI boundaries must be explicit.
- Designer-only shell controls such as Add Component require classification before being treated as runtime app content failures.
- Dynamic KPI proof, if claimed later, still requires before/after source mutation evidence and refreshed/recalculated runtime evidence.

A high-quality UI claim must not pass when runtime content looks like a generic scaffold while the design image has rich dashboard structure.

## Recommended Finding Codes

The analysis recommends these hard-gate or backlog finding codes:

- `BROWSER_REFRESH_REQUIRED_BEFORE_RUNTIME_SCREENSHOT`
- `VISIBLE_NAV_MENU_MISMATCH`
- `SUPPORT_RESOURCE_VISIBLE_IN_PRIMARY_NAV`
- `BROAD_BODY_TEXT_NAV_SCAN_UNRELIABLE`
- `SCHEMA_INVALID_HIDDEN_RESOURCE_MUTATION`
- `INSTALL_SUCCESS_NOT_VISUAL_PROOF`
- `MOCK_VALUE_RUNTIME_VALUE_BOUNDARY_REQUIRED`
- `KPI_CARD_VISUAL_FIDELITY_WEAK`
- `TABLE_VISUAL_FIDELITY_WEAK`
- `CONTENT_HIERARCHY_FIDELITY_WEAK`
- `DESIGNER_SURFACE_CONTROL_PRESENT`

## Training Rules Added By This Study

- Plan stage must define exact primary navigation labels and order.
- Support data lists, forms, approval pages, and implementation-only pages must be classified as hidden/non-primary when excluded from the design.
- Design images must show only approved primary navigation items.
- UI contracts must include exact visible primary navigation labels and hidden support-resource expectations.
- Package generation must not infer primary navigation from all resources.
- Support resources must not auto-appear in primary navigation.
- Hiding support resources must use schema-compatible layout metadata such as `ListSet.LayoutView.sort`.
- Runtime proof must explicitly refresh Chrome before screenshot capture.
- Runtime navigation evidence must be nav-scoped or exact-line based.
- Broad body-text scans are not reliable navigation proof.
- Signing, verifysign, upgrade-check, and upgrade-apply are not visual proof.
- Runtime proof must separately report app chrome fidelity, primary navigation fidelity, content structure fidelity, and dynamic KPI proof boundary.
- If design KPI values are mock visual placeholders, runtime value mismatch should be warning only.
- If dynamic KPI proof is claimed, before/after mutation evidence is required.

## Implemented Gates Already Available

- Application layout and chrome fidelity gates reject unsupported Layout 1 hamburger and Collapse controls.
- Multi-page application chrome consistency gates reject dark/light navigation drift.
- Phase 1 contract, scope, and runtime evidence helpers are available.
- Phase 2 structure comparison is available for contract-to-runtime evidence checks.
- Phase 3A/3B hard-gate workflow and workflow-report enforcement are available.
- UI/Summary/KPI hard gates already separate package/API success from runtime UI and dynamic KPI proof.

## Future Backlog Validators

### P0

- Implemented in P0 by `scripts/inspect-runtime-navigation-proof.mjs`: exact primary navigation contract validator, runtime refresh evidence gate, nav-scoped or exact-line runtime evidence checker, support-resource primary-nav visibility checker, and sign/upgrade visual-proof boundary checker using structured JSON contract/evidence only.

### P1

- Content-fidelity report schema.
- KPI card visual structure checker using declared contract/runtime evidence.
- Table badge/progress/avatar structure checker using declared contract/runtime evidence.
- Designer-only shell control classification.
- Mock-vs-runtime KPI value boundary checker.

### P2

- Visual comparison helper if a reliable screenshot parser is later introduced.
- Richer dashboard style-shape library.
- Content-fidelity scoring report.

Backlog items are not implemented validators in this study branch unless an executable script explicitly adds them. This branch records lessons, hard-gate guidance, and backlog only. It must not fix Marketing Event runtime content fidelity itself; the next implementation branch may use this guidance to improve Event Portfolio content fidelity.

## Security And Privacy Boundary

Keep only sanitized report lessons in this repo:

- Do not commit raw screenshots.
- Do not commit raw YAPK files.
- Do not commit signing or upgrade proof JSON payloads.
- Do not commit raw decoded package payloads.
- Do not commit raw `Resource` or raw `Sign`.
- Do not commit tenant URLs, workspace IDs, OAuth tokens, API keys, `.env.local`, or private values.
- Local evidence paths may be summarized as redacted artifact categories only.
