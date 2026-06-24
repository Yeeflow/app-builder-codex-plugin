# First-Generation Smoke And Cache Root Alignment Training Report

## Purpose

This training fixes two regression gaps found after the `0.8.28` validation cycle:

- the Account Health first-generation smoke fixture was stale and no longer represented a generated-final-clean package shape;
- cache artifact checks assumed a source checkout layout even when executed from an installed plugin payload root.

The fix keeps the generated-final gates strict. It does not relax YAPK schema, dashboard, ID provenance, navigation, App Plan, or export-shape validation.

## First-Generation Smoke Fix

The Account Health smoke now uses a preflight-clean first-generation data-list package fixture:

- no embedded seed rows in `Childs[].List.Items`;
- native system `Title` includes `Status: 0`, `IsSystem: true`, and `IsIndex: true`;
- no synthetic `Text0` primary field;
- root `ListSet.LayoutView` remains a JSON string;
- sample data is not treated as package content.

The stale patterns remain covered as negative regressions:

- embedded list rows fail with `YAPK_EMBEDDED_LIST_ITEMS_FORBIDDEN`;
- native `Title` without `IsIndex` fails with `NATIVE_TITLE_ISINDEX_MISSING`;
- legacy simplified dashboard shells still fail generated-final dashboard hard gates.

## Cache Root Alignment Fix

Installed Codex plugin cache roots are already the plugin payload. They do not contain a nested `dist/yeeflow-app-builder-plugin` mirror. Source checkouts still require source/dist mirror parity.

The new `scripts/lib/plugin-root-layout.mjs` helper classifies:

- `source-root`: source files plus required `dist/yeeflow-app-builder-plugin` mirrors;
- `installed-cache-root`: root payload files only, without a nested dist mirror.

The YAPK cache artifact test and full-page design blueprint test now use this helper, so both source checkout validation and installed-cache smoke validation exercise the same artifact set without false missing-mirror failures.

## Required Validation

Before release or stable movement, run:

- `node scripts/test-account-health-first-generation-smoke.mjs`
- `node scripts/test-installed-cache-root-path-alignment.mjs`
- `node scripts/test-yapk-hard-gate-cache-artifacts.mjs`
- an installed-payload-shaped smoke by copying `dist/yeeflow-app-builder-plugin` to a temporary directory and running cache/UI aggregate gates from that directory
- the existing generated-final export-shape, dashboard, YAPK schema, planning, app icon, approval/export-shaped YAP, aggregate UI, metadata, source/dist mirror, release safety, and private-artifact scans.

## Safety Boundary

This training did not perform live Yeeflow writes, signing, install/import, upgrade, runtime browser proof, tag creation, plugin archive generation, version bumping, or stable promotion.
