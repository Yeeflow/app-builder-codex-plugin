# Repo Duplicate Copy Cleanup - 2026-07-06

## Scope

This hygiene pass removed local untracked Finder/copy-style duplicate artifacts from the plugin working tree without changing tracked plugin functionality.

## Findings

- Tracked duplicate-copy artifacts before cleanup: `0`
- Untracked duplicate-copy artifacts removed: `787`
- Top-level areas affected by the untracked cleanup: `dist/`, `docs/`, `scripts/`, `skills/`, and `tools/`

The removed files used accidental copy suffixes such as `name 2.md`, `name 3.json`, `name 4.mjs`, and `SKILL 2.md`.

## Guardrail

`scripts/test-repo-root-hygiene.mjs` now fails when tracked or untracked duplicate-copy artifacts are present. The same guard is mirrored under `dist/yeeflow-app-builder-plugin/scripts/`.

Release packaging must continue to use tracked-file manifests, such as `git ls-files`, instead of raw working-tree zips.
