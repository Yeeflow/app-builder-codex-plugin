# Repository Root Hygiene And Compatibility Training Report

## Purpose

This training keeps the GitHub repository root readable without breaking existing plugin behavior. Historical runtime-proof generators, test plans, and test specs are no longer stored at repository root. Public compatibility entrypoints and root-level reference data remain in place because existing skills, validators, and release checks still depend on those paths.

## Changes

- Moved source-root `generate-*` proof and sample generators to `tools/generators/`.
- Moved source-root runtime proof plans, studies, and validation graph notes to `docs/studies/root-runtime-proofs/`.
- Moved source-root runtime test specs and coverage JSON files to `fixtures/runtime-test-specs/`.
- Moved plugin dist-root historical generators to `dist/yeeflow-app-builder-plugin/tools/generators/`.
- Updated references so documentation and skills point to the categorized paths instead of the old repository-root locations.
- Added `scripts/test-repo-root-hygiene.mjs` to prevent root clutter from regressing.

## Compatibility Boundary

The following root-level files intentionally remain:

- `README.md`, `CHANGELOG.md`, `.env.example`, and `.gitignore`.
- Public CLI and validator entrypoints such as `validate-yap-package.js`, `validate-yapk-package.js`, `build-yap-wrapper.js`, `build-ydl-wrapper.js`, and `build-ywf-wrapper.js`.
- Root-level normalized reference data that current compatibility utilities still load from repository root.

Do not move these compatibility entrypoints without adding shims and proving all source, dist, installed-cache, and skill references still resolve.

## Hard Gate

Run:

```sh
node scripts/test-repo-root-hygiene.mjs
```

The gate fails when tracked root files include historical generators, runtime proof plans, runtime test specs, validation graph notes, or unallowlisted files. It also checks the plugin dist root for the same class of clutter.

## Safety Notes

This is repository organization only. It does not change package generation behavior, Yeeflow API behavior, signing, install/import, upgrade, or runtime proof logic.
