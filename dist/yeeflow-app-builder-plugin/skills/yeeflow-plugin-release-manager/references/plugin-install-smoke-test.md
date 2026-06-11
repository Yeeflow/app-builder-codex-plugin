# Plugin Install Smoke Test

Run this after an RC tag is pushed.

## Private Git Marketplace Values

Use the current release candidate tag unless the user explicitly asks to test another ref.

```text
Source:
https://github.com/Yeeflow/app-builder-codex-plugin.git

Git ref:
yeeflow-app-builder-plugin-v<version>-rc<n>

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-app-builder-plugin
```

Expected marketplace name: `Yeeflow`.

Expected plugin name: `Yeeflow App Builder`.

## Smoke Prompts

Use short prompts that prove bundled skills are discoverable and useful:

- "Use Yeeflow App Builder to summarize the application-builder lifecycle."
- "Use the feature-learning orchestrator to explain when to use it instead of application-builder."
- "Use the custom-code-generator to describe Smart Lookup Picker support boundaries."
- For versions with package validation improvements, ask about materialization validation behavior for generated `.yap` packages.
- For versions with release-management improvements, ask how RC and final tags differ.

## Result Recording

Record:

- RC tag tested
- install source
- sparse paths
- marketplace name
- plugin name
- install result
- smoke prompts tested
- known UI/cache/icon behavior
- final release status

If Codex shows a fallback icon despite packaged icon paths, treat it as UI/cache behavior unless install or discovery fails.

## Failure Handling

- If install fails, do not create a final tag.
- If version appears stale, remove and re-add the marketplace with the target RC tag.
- If metadata cache does not refresh, document the behavior and retest after re-add.
