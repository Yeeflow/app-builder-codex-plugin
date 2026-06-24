# Full-App Generation Entrypoint Standard

This standard prevents clean-room application generation tests from confusing validators, delivery helpers, runtime-proof demos, or sample-specific generators with the plugin's full-application generation capability.

## Entrypoint Registry

The plugin must ship `docs/reference/full-app-generation-entrypoints.json`. The registry declares supported full-app generation entrypoints and explicitly identifies non-full-app helper scripts.

Valid full-app generation entrypoints must:

- accept the primary Markdown contracts `functional-specification.md` and `yeeflow-app-plan.md`;
- default new application delivery to `.yapk` unless the user explicitly requests `.yap`;
- declare required planning gates and generated-final package gates;
- declare `bundledPath` when the source checkout path and installed plugin payload path differ;
- declare `callable: true` and an `invocationContract` that names either the Codex skill orchestration entrypoint or the node CLI materialization entrypoint, repeats the required inputs, and requires continuation after planning gates pass;
- produce generated-final package artifacts before signing/install/runtime proof is claimed;
- be clearly distinguished from proof/demo, delivery-decision, package API, and sample-specific helpers.

## Skill-Orchestrated Generation

The current full-app generation entrypoints are skill-orchestrated:

- `skill:yeeflow-application-builder`
- `skill:yeeflow-application-generator`

These are valid plugin capabilities even though they are not standalone one-command CLIs. A clean-room validation run must inspect the registry before declaring that the plugin has no full-app generation path.

When the registry reports a callable Codex skill entrypoint and the Functional Specification, App Plan, business-default approval, traceability, and generation-readiness gates all pass, the run must continue into skill-orchestrated generated-final package creation. Do not hard-stop solely because there is no standalone CLI. Hard-stop only for real blockers such as unapproved business defaults, missing OAuth/workspace access required for API-issued IDs, failed generated-final validators, or an explicit user request for planning-only output.

The `invocationContract.planningPassContinuation` field is the machine-readable handoff from planning validation to package generation. It must say that planning-pass runs continue toward a generated-final `.yapk` through the registered skill entrypoint and must explicitly forbid stopping solely because no standalone CLI exists.

## Standalone Materialization CLI

The plugin must also expose a callable node CLI materializer:

```sh
node scripts/materialize-full-app-generated-final.mjs \
  --functional-spec functional-specification.md \
  --app-plan yeeflow-app-plan.md \
  --out-dir dist \
  --api-id-manifest api-issued-ids.json \
  --json
```

This CLI is the concrete package-artifact handoff for clean-room tests and automation. It consumes approved Markdown planning contracts and an API-issued ID manifest, then emits:

- generated-final `.yapk`;
- decoded resource JSON;
- ID provenance report;
- generation report.

The materializer is not a signing, install/import, upgrade, seed-data, Version Management, or browser/runtime proof tool. It must stop before those stages and its report must say so. Plugin regression tests may use an explicit fixture-ID mode, but fixture-ID output is not signing/install eligible and must never be reported as live Yeeflow ID provenance.

The registry must validate from both layouts used by this repository:

- source checkout layout: `skills/installed/<skill-name>/SKILL.md`
- installed plugin payload layout: `skills/<skill-name>/SKILL.md`
- source and installed script layout: `scripts/materialize-full-app-generated-final.mjs`

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

If the inspector passes and generation still stops immediately after planning, classify that as an execution bug in the run, not as evidence that the plugin lacks a full-app generation entrypoint. If API-issued IDs are unavailable, hard-stop with an ID-source error rather than claiming that no materialization entrypoint exists.
