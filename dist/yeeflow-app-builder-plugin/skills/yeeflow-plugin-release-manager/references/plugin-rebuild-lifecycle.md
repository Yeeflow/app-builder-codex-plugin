# Plugin Rebuild Lifecycle

Use this lifecycle when updating the Yeeflow App Builder Plugin from latest `origin/main`.

## 1. Start Clean

- Work from latest `origin/main`.
- Use a dedicated branch named for the target version.
- Avoid unrelated files and existing generated app artifacts.
- Do not modify Employee Family Implant transient files.

## 2. Detect Current Release

- Fetch tags.
- Find the latest final tag matching `yeeflow-app-builder-plugin-v*`.
- Ignore tags containing `-rc`.
- Read `dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json`.
- Report both tag version and manifest version if they differ.

## 3. Detect Bundled Skill Changes

Compare latest `origin/main` with the latest final release tag for bundled skill paths:

- `skills/installed/yeeflow-application-builder`
- `skills/installed/yeeflow-feature-learning-orchestrator`
- `skills/installed/yeeflow-application-generator`
- `skills/installed/yeeflow-approval-form-generator`
- `skills/installed/yeeflow-data-list-generator`
- `skills/installed/yeeflow-dashboard-generator`
- `skills/installed/yeeflow-expression-generator`
- `skills/installed/yeeflow-custom-code-generator`

If no bundled skill changed, report no rebuild required and stop.

## 4. Rebuild

- Choose the next version.
- Create `codex/yeeflow-app-builder-plugin-v<version>`.
- Rebuild `dist/yeeflow-app-builder-plugin/` from selected skill mirrors.
- Update `dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json`.
- Update `.agents/plugins/marketplace.json` only if metadata or paths need changes.
- Create `dist/yeeflow-app-builder-plugin-<version>.zip`.
- Update docs and release notes.

## 5. Validate And Release Candidate

- Run the release checklist.
- Commit as `Update Yeeflow App Builder plugin to v<version>`.
- Push the rebuild branch.
- Create and push `yeeflow-app-builder-plugin-v<version>-rc1`.
- Stop before final tag.

## 6. Finalize

Only after user confirms private marketplace install smoke passed:

- Record install smoke result in docs.
- Commit docs if changed.
- Push the release branch.
- Create final annotated tag `yeeflow-app-builder-plugin-v<version>`.
- Push the final tag.
