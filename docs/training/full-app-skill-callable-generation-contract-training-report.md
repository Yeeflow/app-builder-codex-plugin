# Full-App Skill Callable Generation Contract Training Report

## Trigger

The `0.8.15` Office Asset Loan Management clean-room run proved that planning, business defaults, Dashboard Collection template selection, and full-app entrypoint path alignment passed, but the run still stopped before generated-final package creation because the registry described full-app generation as skill-orchestrated rather than a standalone CLI.

## Problem

The plugin already exposed `yeeflow-application-builder` and `yeeflow-application-generator` as full-app generation skills, but the machine-readable registry did not make the continuation contract strict enough. A validator or execution run could pass the registry gate and still treat "no standalone CLI" as a hard stop after planning.

That behavior is wrong for plugin-only clean-room full E2E runs. If the user requested full generation, planning gates pass, and business defaults are `user-default-approved-for-generation`, the next step is skill-orchestrated generated-final `.yapk` creation through the registered entrypoint. The absence of a one-command CLI is not by itself a package-generation blocker.

## Training Scope

- Mark full-app generation skill entrypoints as explicitly callable.
- Add a registry `invocationContract` that names the Codex skill, repeats the required Markdown inputs, and requires continuation after planning pass.
- Fail registry validation when a full-app entrypoint is only descriptive and not callable.
- Fail registry validation when it allows stopping after planning solely because no standalone CLI exists.
- Preserve the distinction between full-app generation entrypoints and delivery, package API, runtime-proof, or sample-specific helper scripts.

## Expected Future Behavior

For clean-room full application generation:

1. Generate and validate `functional-specification.md`.
2. Generate and validate `yeeflow-app-plan.md`.
3. Confirm business defaults are `user-default-approved-for-generation`.
4. Inspect `docs/reference/full-app-generation-entrypoints.json`.
5. If the registry passes, invoke the callable skill entrypoint to generate the generated-final `.yapk`.
6. Stop only for real blockers such as missing OAuth/workspace access required for API-issued IDs, failed generated-final validators, unapproved business defaults, or an explicit planning-only user request.

Do not stop merely because the plugin exposes a Codex skill entrypoint rather than a standalone CLI.

## Validation

The focused regression suite now covers:

- registered skill entrypoints pass in source and installed-cache layouts;
- missing callable contract fails;
- weak planning-pass continuation fails;
- callable contract missing Markdown inputs fails;
- delivery/package API/proof/sample helpers remain forbidden as generic full-app generators.
