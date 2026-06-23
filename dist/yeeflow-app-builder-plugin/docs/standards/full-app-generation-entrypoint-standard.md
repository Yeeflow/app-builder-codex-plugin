# Full-App Generation Entrypoint Standard

This standard prevents clean-room application generation tests from confusing validators, delivery helpers, runtime-proof demos, or sample-specific generators with the plugin's full-application generation capability.

## Entrypoint Registry

The plugin must ship `docs/reference/full-app-generation-entrypoints.json`. The registry declares supported full-app generation entrypoints and explicitly identifies non-full-app helper scripts.

Valid full-app generation entrypoints must:

- accept the primary Markdown contracts `functional-specification.md` and `yeeflow-app-plan.md`;
- default new application delivery to `.yapk` unless the user explicitly requests `.yap`;
- declare required planning gates and generated-final package gates;
- produce generated-final package artifacts before signing/install/runtime proof is claimed;
- be clearly distinguished from proof/demo, delivery-decision, package API, and sample-specific helpers.

## Skill-Orchestrated Generation

The current full-app generation entrypoints are skill-orchestrated:

- `skill:yeeflow-application-builder`
- `skill:yeeflow-application-generator`

These are valid plugin capabilities even though they are not standalone one-command CLIs. A clean-room validation run must inspect the registry before declaring that the plugin has no full-app generation path.

## Non-Full-App Helpers

The following must not be reported as generic full-app generators:

- `scripts/yeeflow-application-delivery-workflow.mjs`, which only decides delivery flow;
- `scripts/yeeflow-package-api-automation.mjs`, which requires an existing package;
- `generate-*-runtime-proof.mjs`, which creates focused proof/demo artifacts;
- sample-specific generators such as `generate-vendor-onboarding-yapk-schema-v2.mjs`.

## Validation

Run:

```sh
node scripts/inspect-full-app-generation-entrypoints.mjs
```

The inspector must pass before a plugin-only clean-room generation report claims that no generation entrypoint exists. If a user or test specifically requires a standalone CLI, report that the installed plugin exposes skill-orchestrated generation entrypoints rather than inventing or misclassifying a helper script.
