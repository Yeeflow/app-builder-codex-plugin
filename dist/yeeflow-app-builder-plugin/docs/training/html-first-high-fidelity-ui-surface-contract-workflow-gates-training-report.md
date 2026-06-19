# HTML-first High-fidelity UI Surface Contract Workflow Gates Training Report

## Branch

`codex/html-first-high-fidelity-ui-surface-contract-workflow-gates`

## Baseline

- Baseline commit: `5083befd5fcc164d611de81844e521bb88ad4d03`
- Plugin version: `0.6.70`
- Training only: no release bump

## Source Problem Summary

Recent Full-page Canonical Design Artifact testing showed that PNG-first design review is too weak as the primary implementation contract for complex business apps. Static images can pass structural checks while still leaving ambiguous field/action responsibilities, fragile responsive layout behavior, hard-to-audit visual quality, and blueprint drift.

Experiment artifacts were reviewed from `/Users/rengerhu/Documents/Plugin Test/outputs/...`. Those outputs are evidence for this training cycle only and are not committed.

## Workflow Added

The trained workflow is:

```text
App Plan
-> Application Design System
-> UI Surface Contract
-> High-fidelity HTML Preview
-> DOM/Layout/Visual Quality Validation
-> Screenshot Evidence
-> Page Implementation Blueprint
-> Blueprint-to-Contract comparison
```

The HTML-first workflow inherits every existing Full-page Canonical Design Artifact gate. It does not replace or bypass requirements for official dashboard layout/chrome, no-app-chrome form surfaces, full-page/page-end completeness, modern visual quality, surface responsibility, App Plan field/action coverage, forbidden-region checks, semantic consistency, lower-page visual concreteness, visual usability, text overflow/overlap/spacing/mobile pressure, clipping checks, or template reuse risk.

## Standards And Templates

Added:

- `docs/standards/ui-surface-contract-template.md`
- `docs/standards/html-preview-design-standard.md`

Updated:

- `docs/standards/application-design-system-template.md`
- `docs/standards/design-image-manifest-template.md`
- `docs/standards/full-page-design-blueprint-generation-standard.md`

## Validators Added

- `scripts/validate-ui-surface-contracts.mjs`
  - validates required UI Surface Contract fields
  - enforces App Plan surface coverage when the App Plan declares required UI surfaces
  - enforces surface responsibility, field/action coverage, forbidden-region rules, App Plan traceability, Application Design System references, approved UI pattern references, and inherited full-page design gate statuses

- `scripts/validate-html-preview-layout.mjs`
  - validates HTML preview DOM evidence against UI Surface Contracts
  - enforces required fields/actions, forbidden-region absence, design-system token evidence, approved pattern references, high-fidelity visual evidence, responsive/mobile evidence, screenshot evidence, full-page/page-end evidence, dashboard chrome, no-app-chrome form surfaces, inherited design-stage status evidence, and conservative text-overflow/overlap checks

- `scripts/compare-blueprint-to-ui-surface-contract.mjs`
  - validates Page Implementation Blueprint parity against UI Surface Contracts
  - checks required fields, required actions, forbidden-region reintroduction, intended Yeeflow control mapping, design-system style intent, action placement, badge/status semantics, responsive intent, and unsupported control/property deferrals

## Tests Added

- `scripts/test-html-first-high-fidelity-ui-surface-contract-workflow-gates.mjs`

The test covers:

- complete Vendor Contract-style UI Surface Contract set
- required App Plan surface coverage
- Approval Submission Save as draft/Submit and Sub List responsibilities
- Approval Task, Approval Print, Data List New/Edit/View, Document Library New/Edit/View responsibilities
- dashboard official layout and header/navigation requirements
- no-app-chrome form requirements
- inherited gate status blocking before blueprint readiness
- HTML required field/action and forbidden-region checks
- high-fidelity design-system token and UI pattern checks
- full-page/page-end evidence
- responsive/mobile stacking checks
- screenshot evidence
- lower-page placeholder-only rejection
- blueprint-to-contract parity and style-intent comparison

## Aggregate And Cache Registration

Updated:

- `scripts/test-ui-hard-gates-all.mjs`
- `scripts/test-yapk-hard-gate-cache-artifacts.mjs`

## Skill And Lifecycle Updates

Updated:

- `skills/installed/yeeflow-application-builder/SKILL.md`
- `skills/installed/yeeflow-application-builder/references/requirement-to-yap-generation-lifecycle.md`

The skill/lifecycle guidance now places the HTML-first workflow after App Plan approval and Application Design System generation, and before Page Implementation Blueprints and resource generation.

## Dist Mirrors

All changed source docs, scripts, skills, lifecycle references, and training report are mirrored under `dist/yeeflow-app-builder-plugin/...`.

## Validation Commands

Training validation run:

- `git diff --check`
- `node --check scripts/validate-ui-surface-contracts.mjs`
- `node --check scripts/validate-html-preview-layout.mjs`
- `node --check scripts/compare-blueprint-to-ui-surface-contract.mjs`
- `node --check scripts/test-html-first-high-fidelity-ui-surface-contract-workflow-gates.mjs`
- `node scripts/test-html-first-high-fidelity-ui-surface-contract-workflow-gates.mjs`
- existing full-page design artifact suites
- existing planning gate regression suites
- `node scripts/test-ui-hard-gates-all.mjs`
- `node scripts/test-yapk-hard-gate-cache-artifacts.mjs`
- `node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.70`
- source/dist mirror checks
- `node scripts/audit-release-safety.mjs --base stable --archive does-not-exist.zip --dist-root dist/yeeflow-app-builder-plugin`
- changed-file private/forbidden artifact scan

Result: passed. The private/forbidden artifact scan reported only safety-boundary wording in skill/lifecycle docs and no actionable secrets, tenant URLs, raw API responses, raw `Resource`, raw `Sign`, workspace IDs, user IDs, private screenshots, runtime payloads, or private experiment outputs.

## Proof Boundary

These gates prove design-contract, HTML preview, screenshot-evidence, and blueprint-parity readiness only. They do not prove Yeeflow package validity, signing/API acceptance, install/upgrade success, or runtime rendering.

## Safety Confirmation

- No plugin version bump
- No `stable` movement
- No tags or GitHub releases
- No plugin archive generation
- No live Yeeflow writes
- No package signing/install/import/upgrade
- No private experiment outputs committed
- No unrelated duplicate ` 2` / ` 3` files staged

## Follow-up

Review and merge the training PR. Prepare the release bump in a separate PR only after the training PR is merged.
