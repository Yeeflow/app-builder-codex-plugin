# Plugin Versioning Rules

Use semantic versioning for the private Yeeflow App Builder Plugin.

## Version Sources

- Latest final tag: latest `yeeflow-app-builder-plugin-v*` tag without `-rc`.
- Current manifest: `dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json`.
- If they differ, report the mismatch before choosing a new version.

## Patch Bump

Use a patch bump for:

- documentation fixes
- metadata fixes
- validation-rule clarifications
- packaging script fixes
- bug fixes that do not add a new user-facing capability
- small skill guidance improvements

Example: `0.2.0` to `0.2.1`.

## Minor Bump

Use a minor bump for:

- new bundled support skill
- major new builder workflow
- runtime-proven feature expansion
- new validation category that changes release behavior
- meaningful new custom code support boundary

Example: `0.2.0` to `0.3.0`.

## RC And Final Tags

- RC tag means build ready for testing.
- Final tag means install-tested and accepted for users.
- Never create the final tag before private marketplace install smoke passes.
- If an RC fails, create a new RC tag after the fix, such as `-rc2`.

## Release Notes

Release notes should include:

- previous version
- new version
- changed bundled skills
- main improvements
- validation result
- install smoke result once finalizing
- known limitations
