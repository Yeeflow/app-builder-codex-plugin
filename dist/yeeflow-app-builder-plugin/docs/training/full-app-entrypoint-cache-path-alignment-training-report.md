# Full-App Entrypoint Cache Path Alignment Training Report

## Trigger

A clean-room Office Asset Loan Management run on active `yeeflow-app-builder@yeeflow 0.8.14` passed planning gates and Dashboard Collection template exact-match validation, but stopped before package generation. The new full-app entrypoint gate passed from the source checkout and failed from the installed plugin cache because the registry pointed to `skills/installed/<skill>/SKILL.md`, while the bundled plugin payload contains `skills/<skill>/SKILL.md`.

## Changes

- Added `bundledPath` entries to `docs/reference/full-app-generation-entrypoints.json` for the application builder and application generator skills.
- Updated `scripts/inspect-full-app-generation-entrypoints.mjs` to resolve entrypoints from either source checkout paths or bundled plugin payload paths.
- Added a regression case that simulates the installed plugin cache layout and validates the same registry against `skills/<skill>/SKILL.md`.
- Updated the full-app entrypoint standard to require bundled-path coverage when source and installed payload layouts differ.

## Behavior After Training

- Source checkout validation continues to pass with `skills/installed/yeeflow-application-builder/SKILL.md` and `skills/installed/yeeflow-application-generator/SKILL.md`.
- Installed cache validation passes with `skills/yeeflow-application-builder/SKILL.md` and `skills/yeeflow-application-generator/SKILL.md`.
- Clean-room generation tests must not stop before package generation merely because the validator was run from the installed plugin payload root.

## Proof Boundary

This training fixes entrypoint discovery across source and installed plugin layouts. It does not add a standalone one-command full-app CLI and does not claim package generation, signing, install/import, or runtime proof by itself.

## Validation

Required validation:

- `node --check` for changed `.mjs` files.
- `node scripts/test-full-app-generation-entrypoint-gates.mjs`.
- `node scripts/inspect-full-app-generation-entrypoints.mjs --root .`.
- Installed-cache layout validation using `--root` pointed at the active plugin cache.
- Dashboard dataset presentation, dashboard hard gates, generated-final/YAPK gates, planning gates, aggregate UI gates, YAPK cache artifact checks, metadata inspection, source/dist mirror checks, release safety audit, and private/forbidden artifact scan.
