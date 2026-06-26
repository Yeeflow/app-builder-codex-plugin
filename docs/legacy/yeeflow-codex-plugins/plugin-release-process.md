# Yeeflow Builder Plugin Release Process

This document defines the v0 release packaging process for the personal Yeeflow Builder Plugin. The official stable plugin remains **Yeeflow Builder** from `https://github.com/Yeeflow/yeeflow-codex-plugins.git`.

## Release Inputs

Release from a reviewed Git branch, not from an unreviewed working tree. For v0, the active branch is:

```text
codex/yeeflow-builder-plugin-v0
```

Plugin root:

```text
dist/yeeflow-builder-plugin/
```

Current release archive:

```text
dist/yeeflow-builder-plugin-0.6.4.zip
```

Current release status:

- v0.6.4 private Git marketplace install: passed with `codex/update-research-plugin-to-v0.6.4-rc1`; final tag `codex/update-research-plugin-to-v0.6.4`.
- v0.6.3 private Git marketplace install: passed with `yeeflow-builder-plugin-v0.6.3-rc1`; final tag `yeeflow-builder-plugin-v0.6.3`.
- v0.1.0 private Git marketplace install: passed.
- v0.2.0 private Git marketplace install: passed with `yeeflow-builder-plugin-v0.2.0-rc1`.
- v0.3.0 private Git marketplace install: passed with `yeeflow-builder-plugin-v0.3.0-rc1`.
- v0.4.0 private Git marketplace install: passed with `yeeflow-builder-plugin-v0.4.0-rc1`.
- v0.5.22 private Git marketplace install: passed; includes v0.5.22 YAPK support and 21 bundled skills.
- v0.5.23 private Git marketplace install: passed with `yeeflow-builder-plugin-v0.5.23-rc1`; final tag `yeeflow-builder-plugin-v0.5.23`.
- v0.6.0 private Git marketplace install: passed with `yeeflow-builder-plugin-v0.6.0-rc1`; final tag `yeeflow-builder-plugin-v0.6.0`.
- v0.6.1 private Git marketplace install: passed with `yeeflow-builder-plugin-v0.6.1-rc1`; final tag `yeeflow-builder-plugin-v0.6.1`.
- v0.6.2 private Git marketplace install: passed with `yeeflow-builder-plugin-v0.6.2-rc1`; final tag `yeeflow-builder-plugin-v0.6.2`.
- ZIP package smoke test: passed locally.
- Git marketplace install: passed.
- Production/public marketplace: not applicable.
- Partner-safe edition: planned, not released.

Public sharing hardening:

- Public install docs must use the official repo `https://github.com/Yeeflow/yeeflow-codex-plugins.git`.
- Tenant-specific URLs must be placeholders such as `https://<yourdomain>.yeeflow.com`.
- API scripts should prefer `YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1` for live API calls.
- Tenant/app links should use `YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com`.
- `YEEFLOW_BASE_URL` is a legacy API base URL alias only and must not mean tenant URL going forward.
- Multi-tenant `.env.local` profiles may use `YEEFLOW_PROFILE` plus `YEEFLOW_<PROFILE>_API_KEY`, `YEEFLOW_<PROFILE>_TENANT_URL`, and `YEEFLOW_<PROFILE>_TENANT_ID`; only one profile is active per script run.
- Do not commit `.env.local`, API keys, tokens, raw API responses, tenant IDs, private URLs, raw `Resource`, raw `Sign`, decoded payloads, screenshots, or generated runtime packages.

Verified marketplace install values:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
codex/update-research-plugin-to-v0.6.4

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

Expected Codex result: marketplace `Yeeflow Internal`, plugin `Yeeflow Builder`, category `Developer Tools`, and successful plugin install. If metadata or icon assets do not refresh after a tag update, remove and re-add the marketplace. Fallback icon rendering is not a release blocker when install succeeds and the package includes icon paths.

Smoke prompts tested:

- Application builder lifecycle summary.
- Feature-learning orchestrator use cases.
- Custom-code-generator Smart Lookup Picker support.
- Materialization validation behavior for generated `.yap` packages.
- Runtime-test-orchestrator lifecycle summary and result classifications.
- Package-validator import-safety and `.yap` versus `.yapk` policy.
- YAPK package generator schema-backed inspection and signing-boundary guidance.
- Plugin-release-manager RC versus final tag workflow.
- Application-generator Document Library v2 generation and generated-folder guidance.
- Package-validator materialization blocker handling for generated `.yap` packages.
- Runtime-test-orchestrator document library form-host runtime classification.
- Dashboard-generator data-bound document-library dashboard guidance.

## Release Notes

### v0.6.5

Previous research version: `0.6.4`.

Branch: `codex/yeeflow-builder-plugin-v0.6.5-hardening`.

Baseline refs:

- Latest research branch: `origin/research`
- Official stable comparison baseline: `yeeflow-builder-plugin-v0.6.0`

Included milestone: Customer Success Renewal Management runtime hardening for schema-v3 YAPK validation, product-safe data-list generation, current dashboard shell/data-table validation, native Text control validation, lossless/API-issued ID gates, split upgrade-check/apply helper operations, validation-mode guidance, and regression tests.

Canonical schema addition: package stable schema references as `schemas/yapk-schema.json` and `schemas/yap-schema.json` in source and `dist/yeeflow-builder-plugin/schemas/`, so future schema content updates do not require validator, generator, inspector, or skill reference changes.

First-generation smoke hardening addition: Account Health smoke lessons now run before signing through `scripts/yapk-first-generation-preflight.mjs`. The gate blocks schema-forbidden decoded `AppID` fields, invalid root `ListSet.LayoutView`, non-string `List.Items` seed values, data-list system schema regressions, dashboard shell/Data table/Text-control regressions, and ID safety failures before package-helper dry-runs or handoff.

Proof boundary:

- Local validators, helpers, skills, docs, and regression tests only.
- No generated application package is included.
- No live install or upgrade is part of this hardening branch.
- Do not create a final tag until private marketplace install smoke passes and the result is documented.

### v0.6.4

Previous final version: `0.6.3`.

RC version: `0.6.4`.

RC tag: `codex/update-research-plugin-to-v0.6.4-rc1`.

Private marketplace install smoke test: passed.

Final tag: `codex/update-research-plugin-to-v0.6.4`.

Bundled skill count: `21`.

Included milestone: package API automation, WorkspaceID support, generated YAPK upload/install API proof, YAPK-first application delivery workflow, auto-install confirmation policy, upgrade target confirmation policy, and API result classification.

Verified marketplace install values for the final v0.6.4 release:

- Source: `https://github.com/Yeeflow/yeeflow-codex-plugins.git`
- Git ref: `codex/update-research-plugin-to-v0.6.4`
- Sparse paths: `.agents/plugins/marketplace.json`, `dist/yeeflow-builder-plugin`
- Expected marketplace: `Yeeflow Internal`
- Expected plugin: `Yeeflow Builder`
- Expected version: `0.6.4`
- Expected bundled skills: `21`

Main improvements:

- Adds guarded package API automation for upload, import, install, and upgrade request shaping.
- Adds WorkspaceID support from local `.env.local` and active profiles.
- Proves generated YAPK upload and install at API acceptance level.
- Standardizes YAPK-first new application delivery; YAP is explicit-only or fallback/debug scoped.
- Requires user confirmation before automatic install and target confirmation before upgrade.
- Classifies API results as `success`, `already_installed`, `api_rejected`, or `http_rejected`.

Proof boundary:

- Generated YAPK upload is proven.
- Generated YAPK install is proven at API acceptance level only.
- YAP import remains not proven.
- YAPK upgrade is deferred until a specific disposable upgrade target is confirmed.
- Browser/runtime verification after API install remains manual/pending.
- v0.6.4 records the accepted private marketplace smoke pass for tested RC tag `codex/update-research-plugin-to-v0.6.4-rc1`.
- The final `codex/update-research-plugin-to-v0.6.4` tag records the accepted release state.

### v0.6.3

Previous final version: `0.6.2`.

RC version: `0.6.3`.

RC tag: `yeeflow-builder-plugin-v0.6.3-rc1`.

Private marketplace install smoke test: passed.

Final tag: `yeeflow-builder-plugin-v0.6.3`.

Bundled skill count: `21`.

Included milestone: reference app template corpus, Vendor Onboarding v4.1 hard checks, Yeeflow system schema specification, dashboard generation hardening, data-list schema validation, and updated skill guidance.

Verified marketplace install values for the final v0.6.3 release:

- Source: `https://github.com/Yeeflow/yeeflow-codex-plugins.git`
- Git ref: `yeeflow-builder-plugin-v0.6.3`
- Sparse paths: `.agents/plugins/marketplace.json`, `dist/yeeflow-builder-plugin`
- Expected marketplace: `Yeeflow Internal`
- Expected plugin: `Yeeflow Builder`
- Expected version: `0.6.3`
- Expected bundled skills: `21`

Main improvements:

- Adds the Yeeflow UI section template library and reference app corpus guidance.
- Adds hard checks from the completed Vendor Onboarding v4.1 generation pass.
- Adds system schema validation for generated data lists.
- Hardens dashboards for `Main > Content`, Grid display label off, meaningful Navigator labels, action-button bindings, dynamic-control context, and KPI Summary-to-temp-variable cards.
- Hardens data lists for native `Title`, field naming/index/storage-family validation, choice options, lookup display fields, default display fields, and sample-data dependency ordering.

Proof boundary:

- v0.6.3 records the accepted private marketplace smoke pass for tested RC tag `yeeflow-builder-plugin-v0.6.3-rc1`.
- The final `yeeflow-builder-plugin-v0.6.3` tag records the accepted release state.
- Vendor lookup picker no-record behavior remains a known product-team follow-up.

### v0.6.2

Previous final version: `0.6.1`.

Final version: `0.6.2`.

Tested RC tag: `yeeflow-builder-plugin-v0.6.2-rc1`.

RC package commit: `01645e6d5bb2ea0dc53f484312c01e34fe08126d`.

Private marketplace install smoke test: passed.

Final tag: `yeeflow-builder-plugin-v0.6.2`.

Bundled skill count: `21`.

Included milestone: proven YAP/YAPK import-generation fixes, current dashboard generation, API ID handling, and dashboard Data table binding fixes.

Verified marketplace install values:

- Source: `https://github.com/Yeeflow/yeeflow-codex-plugins.git`
- Git ref: `yeeflow-builder-plugin-v0.6.2`
- Sparse paths: `.agents/plugins/marketplace.json`, `dist/yeeflow-builder-plugin`
- Expected marketplace: `Yeeflow Internal`
- Expected plugin: `Yeeflow Builder`
- Expected version: `0.6.2`
- Expected bundled skills: `21`

Main improvements:

- Preserves the proven YAP v1.12 import path: top-level `Title`, `Description`, `IconUrl`, `IsListSet`, and `Resource`; `Resource = [______gizp______] + Gzip(JSON(ListExportResult))`; decoded Resource is `ListExportResult`; `ListExportResult.Data` contains `ListExportInfo`.
- Preserves the proven YAPK v1.15 install path: top-level `AppExportPackageInfo`; `Resource = base64(Brotli(AppPackageInfo JSON))`; decoded Resource is `AppPackageInfo`; `Childs[].Fields`, not `Defs`; LongAsString fields remain strings; no-portal packages use `PortalInfo: null`.
- Applies import-generation rules: `AppID = 41`, generated IDs from the Yeeflow generate-unique-ids API, exact 19-digit ID preservation without JavaScript rounding, unique ID validation, `Field.Category` integer validation, and the learned `CustomType` rule.
- Generates the current dashboard shell and validates dashboard Data table `Field` source binding plus `FieldName` visible label binding.
- Preserves v0.6.1 tenant/environment guidance and v0.6.0 through v0.5.22 capability milestones.

Proof boundary:

- v0.6.2 records focused Vendor Onboarding runtime proof for the YAP v1.12 import path and YAPK v1.15 install path.
- It proves the current-dashboard shell and Data table binding rule for the tested package path, not arbitrary future visual perfection.
- Marketplace install smoke testing passed for `yeeflow-builder-plugin-v0.6.2-rc1`; the final `yeeflow-builder-plugin-v0.6.2` tag records the accepted release state.

### v0.6.1

Previous final version: `0.6.0`.

Final version: `0.6.1`.

Tested RC tag: `yeeflow-builder-plugin-v0.6.1-rc1`.

RC target commit: `e9dd4fead685f920560924a8762dc1432a5c4579`.

Private marketplace install smoke test: passed.

Final tag: `yeeflow-builder-plugin-v0.6.1`.

Bundled skill count: `21`.

Included milestone: tenant-neutral public sharing hardening and `.env.local` profile guidance.

Verified marketplace install values:

- Source: `https://github.com/Yeeflow/yeeflow-codex-plugins.git`
- Git ref: `yeeflow-builder-plugin-v0.6.1-rc1`
- Sparse paths: `.agents/plugins/marketplace.json`, `dist/yeeflow-builder-plugin`
- Expected marketplace: `Yeeflow Internal`
- Expected plugin: `Yeeflow Builder`
- Expected version: `0.6.1`
- Expected bundled skills: `21`

Main improvements:

- Adds `docs/environment-configuration.md` and `.env.example`.
- Documents `YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1` for API calls.
- Documents `YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com` for tenant/app links.
- Documents `YEEFLOW_PROFILE` multi-tenant profile mode, with one active profile per script run.
- Retains `YEEFLOW_BASE_URL` only as a legacy API base alias/fallback.
- Removes hard-coded internal tenant URL references from public repo and archive content.
- Adds shared env helper scripts and updates API/YAPK scripts to use tenant-neutral environment resolution.
- Preserves v0.6.0 Advanced Controls support and v0.5.27 through v0.5.22 capability milestones.

Proof boundary:

- v0.6.1 changes public-sharing documentation, environment handling, and packaging hygiene only.
- It does not add new Yeeflow runtime capability proof beyond the v0.6.0 and earlier documented milestones.
- Marketplace install smoke testing passed for `yeeflow-builder-plugin-v0.6.1-rc1`; the final `yeeflow-builder-plugin-v0.6.1` tag records the accepted release state.

### v0.6.0

Previous final version: `0.5.27`.

Final version: `0.6.0`.

Tested RC tag: `yeeflow-builder-plugin-v0.6.0-rc1`.

RC package commit: `d4a6b2d78756d306f85a28a2504b47a769d1427e`.

Private marketplace install smoke test: passed.

Final tag: `yeeflow-builder-plugin-v0.6.0`.

Bundled skill count: `21`.

Included milestone: Advanced Controls learning and focused runtime proof.

Verified marketplace install values:

- Source: `https://github.com/Yeeflow/yeeflow-codex-plugins.git`
- Git ref: `yeeflow-builder-plugin-v0.6.0-rc1`
- Sparse paths: `.agents/plugins/marketplace.json`, `dist/yeeflow-builder-plugin`
- Expected marketplace: `Yeeflow Internal`
- Expected plugin: `Yeeflow Builder`
- Expected version: `0.6.0`
- Expected bundled skills: `21`

Main improvements:

- Adds Advanced Controls export-learning from `/Users/Renger/Downloads/Company Overview (3).yap`.
- Adds focused generated runtime proof from `/Users/Renger/Downloads/advanced-controls-runtime-proof.v1.yap`.
- Bundles `scripts/inspect-advanced-controls.mjs`, `tools/generators/generate-advanced-controls-runtime-proof.mjs`, `docs/studies/advanced-controls.md`, `docs/studies/advanced-controls-runtime-proof.md`, and normalized Advanced Controls refs.
- Updates validators/import-readiness and generator/runtime/package skills for Tab, Toggle, Timer, Icon list, Divider, Alert, Progress bar, Spacer, Progress circle, Steps bar, QR Code, Barcode, Embed, and Document embed.
- Preserves v0.5.27 Collection/Kanban actions support, v0.5.26 YAPK hardening, v0.5.25 Kanban/Collection/Timeline support, v0.5.24 Dynamic Sub List/Print Page support, v0.5.23 LayoutView hardening, and v0.5.22 YAPK support.

Proof boundary:

- Advanced Controls runtime proof is limited to the generated package and covers rendering/basic interactions only.
- It does not prove QR scan behavior, Barcode scan behavior, external iframe content loading beyond safe render, non-empty document preview, dynamic value changes, or Approval Form/Public Form host behavior.
- Existing v0.5.27, v0.5.26, v0.5.25, v0.5.24, v0.5.23, and v0.5.22 proof boundaries remain preserved.

### v0.5.23

Previous final version: `0.5.22`.

Final version: `0.5.23`.

Tested RC tag: `yeeflow-builder-plugin-v0.5.23-rc1`.

Remote RC target commit: `b010ee335ea4108d66161ce3d1065d56e1c5b6f9`.

Private marketplace install smoke test: passed.

Final tag: `yeeflow-builder-plugin-v0.5.23`.

Bundled skill count: `21`.

Included milestone: Data List LayoutView Add form hardening.

Verified marketplace install values:

- Source: `https://github.com/Yeeflow/yeeflow-codex-plugins.git`
- Sparse paths: `.agents/plugins/marketplace.json`, `dist/yeeflow-builder-plugin`
- Expected marketplace: `Yeeflow Internal`
- Expected plugin: `Yeeflow Builder`
- Expected version: `0.5.23`
- Expected bundled skills: `21`

Changed bundled skills:

- `yeeflow-application-builder`
- `yeeflow-application-generator`
- `yeeflow-data-list-generator`
- `yeeflow-feature-learning-orchestrator`
- `yeeflow-package-validator`
- `yeeflow-runtime-test-orchestrator`

Main improvements:

- Hardens generated Data List `ListModel.LayoutView` so the default `+ New item` Add modal has a concrete Type `1` form target.
- Generates concrete Type `1` New Item, Edit Item, and View Item layouts for runtime-safe Add/Edit/View settings.
- Resolves `ListModel.LayoutView.add/edit/view` to real local layout IDs.
- Omits unsafe display-settings `sort: [{ SortName, SortByDesc }]`.
- Promotes validator hard errors for `LAYOUTVIEW_ADD_LAYOUT_MISSING` and `LAYOUTVIEW_SORT_OBJECT_UNSUPPORTED`.
- Preserves the user-confirmed runtime proof that `Action Runtime Requests` default `+ New item` Add modal renders in the fixed Container/Button action runtime package.
- Carries forward v0.5.22 YAPK support and the `yeeflow-yapk-package-generator` skill.

Proof boundary:

- Runtime Add modal rendering is user-confirmed for the generated fixed Container/Button action runtime package only.
- Add form save/data mutation is not claimed.
- Other layout modes, Public Forms, Document Library layouts, Form Reports, and unrelated generated app patterns are not proven by this test.
- v0.5.22 YAPK support remains focused on the minimal text-only data-list generation path; DateTime/non-text fields, broader YAPK mutation, forms/pages/dashboards/workflows/reports inside YAPK, and general YAPK generation remain unproven.

### v0.4.0

Previous version: `0.3.0`.

New version: `0.4.0`.

RC tag tested: `yeeflow-builder-plugin-v0.4.0-rc1`.

Private marketplace install smoke test: passed.

Changed bundled skills:

- `yeeflow-application-generator`
- `yeeflow-approval-form-generator`
- `yeeflow-dashboard-generator`
- `yeeflow-data-list-generator`
- `yeeflow-feature-learning-orchestrator`
- `yeeflow-package-validator`
- `yeeflow-runtime-test-orchestrator`

Main improvements:

- Adds Document Library v2 document center generation guidance and generated-folder support.
- Promotes New Document Library baseline, dashboard-control learning, and document-library resource learning into bundled skills.
- Adds document library form-host runtime status and runtime-study guidance.
- Expands generated `.yap` materialization inspection and package/list/graph validation coverage.
- Strengthens package-validator and runtime-test-orchestrator guidance for materialization blockers and runtime classification.

Known limitations:

- Skills-only plugin.
- No OAuth.
- No Yeeflow API integration.
- No MCP server.
- `.yapk` mutation is not supported.
- Next rebuild should include `yeeflow-yapk-package-generator`, `validate-yapk-package.js`, `scripts/inspect-yapk-schema-standard.mjs`, YAPK study docs, normalized refs, and safe summary JSON. Do not include raw `.yapk` files, raw Resource strings, raw Sign values, decoded full payloads, raw API responses, private IDs, or screenshots.
- Runtime testing still requires Yeeflow access.
- Public form custom code support is not claimed unless tested.
- Partner-safe edition is planned but not released.

### v0.3.0

Previous version: `0.2.0`.

New version: `0.3.0`.

RC tag tested: `yeeflow-builder-plugin-v0.3.0-rc1`.

Private marketplace install smoke test: passed.

Added bundled skills:

- `yeeflow-runtime-test-orchestrator`
- `yeeflow-package-validator`
- `yeeflow-plugin-release-manager`

Changed bundled skills:

- None of the existing eight core bundled skills changed since `yeeflow-builder-plugin-v0.2.0`.

Main improvements:

- Adds a runtime test orchestration skill for import/open smoke tests, dashboard/data-bound validation, forms, workflows, expressions, ContentList persistence, lifecycle tests, and runtime result classification.
- Adds a package validator skill for package graph checks, workflow/list/form/dashboard/custom-code inspection, materialization rules, FlowKey safety, field/list integrity, and `.yap` versus `.yapk` policy.
- Adds a plugin release manager skill for detecting changed bundled skills, choosing versions, rebuilding the private plugin package, creating RC tags, recording install smoke tests, and finalizing non-RC tags only after install proof.

Known limitations:

- Skills-only plugin.
- No OAuth.
- No Yeeflow API integration.
- No MCP server.
- `.yapk` mutation is not supported.
- Runtime testing still requires Yeeflow access.
- Public form custom code support is not claimed unless tested.
- Partner-safe edition is planned but not released.

### v0.2.0

Previous version: `0.1.0`.

New version: `0.2.0`.

RC tag tested: `yeeflow-builder-plugin-v0.2.0-rc1`.

Private marketplace install smoke test: passed.

Changed bundled skills:

- `yeeflow-application-builder`
- `yeeflow-feature-learning-orchestrator`
- `yeeflow-application-generator`
- `yeeflow-data-list-generator`
- `yeeflow-custom-code-generator`

Main improvements:

- Adds generated `.yap` materialization hard rules to the app build workflow.
- Requires globally unique `FieldID` values across a generated app package.
- Requires each field's `ListID` to match its parent data list.
- Treats duplicate field display names as generated-package materialization risk.
- Preserves real `TenantID`, `CreatedBy`, and `ModifiedBy` values instead of remapping them into generated ID families.
- Adds materialization inspection before custom code runtime testing when an imported app opens as an empty shell or fields do not materialize.

Known limitations:

- Skills-only plugin.
- No OAuth.
- No Yeeflow API integration.
- No MCP server.
- `.yapk` mutation is not supported.
- Runtime testing still requires Yeeflow access.
- Public form custom code support is not claimed unless tested.
- Partner-safe edition is planned but not released.

## Versioning Policy

Use semantic versioning:

- `0.1.0` for the initial private skills-only package.
- `0.2.0`, `0.3.0`, and later minor versions for new bundled skills, meaningful documentation additions, release-process changes, or expanded validated capability.
- Patch versions such as `0.1.1` for small documentation fixes, packaging metadata corrections, validation-script fixes, or non-behavioral cleanup.

Do not bump a version only because the branch was rebased or repackaged with no content change. Do bump the version when the archive contents change after a release has been shared.

## Release Notes Expectations

Each shared release should have concise release notes that include:

- Version and date.
- Commit hash.
- Plugin archive path.
- Included skills.
- Behavior changes, if any.
- Documentation changes.
- Validation checks run.
- Known limitations.
- Partner-safety status: internal-only or partner-safe.

For internal releases, state whether the release includes internal research notes and experimental workflows.

## Release Checklist

Run this checklist before sharing a Git branch, release tag, or ZIP archive:

- `plugin.json` parses.
- Plugin manifest keeps `name: yeeflow-builder`.
- Plugin manifest points to `./skills/`.
- All included skills have `SKILL.md`.
- All included skills have `agents/openai.yaml`.
- Referenced files exist.
- JavaScript and MJS syntax checks pass.
- JSON parse checks pass for included JSON references.
- Skill mirror checks pass against the source skills in `skills/installed/`.
- Safety scan passes.
- Package size is reasonable.
- Archive integrity passes when a ZIP is present.
- No `.yap`, `.yapk`, `.ydl`, or `.ywf` packages are included.
- No `.env`, secrets, private keys, tokens, or credentials are included.
- No screenshots or downloaded exports are included.
- No customer data is included.
- No tenant-specific runtime data is included.
- No raw Yeeflow exports are included unless explicitly approved for internal research packaging.
- No raw `.yapk` `Resource`, `Sign`, tenant/app/list/package IDs, raw signing API responses, or decoded opaque payloads are included. Wrapper-signing study notes must stay redacted and must not claim `.yapk` app-content mutation support.

## Suggested Local Validation Commands

Run from the repo root.

Parse the plugin manifest:

```bash
node -e 'const fs=require("fs"); JSON.parse(fs.readFileSync("dist/yeeflow-builder-plugin/.codex-plugin/plugin.json","utf8")); console.log("plugin.json OK")'
```

Check required skill files:

```bash
for skill in yeeflow-application-builder yeeflow-feature-learning-orchestrator yeeflow-application-generator yeeflow-approval-form-generator yeeflow-data-list-generator yeeflow-dashboard-generator yeeflow-expression-generator yeeflow-custom-code-generator; do
  test -f "dist/yeeflow-builder-plugin/skills/$skill/SKILL.md" || exit 1
  test -f "dist/yeeflow-builder-plugin/skills/$skill/agents/openai.yaml" || exit 1
done
echo "required skill files OK"
```

Run JavaScript syntax checks:

```bash
find dist/yeeflow-builder-plugin -type f \( -name '*.js' -o -name '*.mjs' \) -print0 |
  while IFS= read -r -d '' file; do node --check "$file" >/dev/null || exit 1; done
echo "node --check OK"
```

Run JSON parse checks:

```bash
find dist/yeeflow-builder-plugin -type f -name '*.json' -print0 |
  while IFS= read -r -d '' file; do node -e 'const fs=require("fs"); JSON.parse(fs.readFileSync(process.argv[1],"utf8"));' "$file" || exit 1; done
echo "JSON parse OK"
```

Run a mirror check:

```bash
for skill in yeeflow-application-builder yeeflow-feature-learning-orchestrator yeeflow-application-generator yeeflow-approval-form-generator yeeflow-data-list-generator yeeflow-dashboard-generator yeeflow-expression-generator yeeflow-custom-code-generator; do
  diff -qr "skills/installed/$skill" "dist/yeeflow-builder-plugin/skills/$skill" || exit 1
done
echo "skill mirror consistency OK"
```

Run a safety scan:

```bash
find dist/yeeflow-builder-plugin -type f |
  rg '\.(yap|yapk|ywf|ydl|docx|xlsx|pptx|png|jpg|jpeg|gif|webp|mov|mp4|env|pem|key)$|(^|/)\.env($|\.)|screenshot|download|export|secret|credential' || true
```

The expected result is no output. If the scan returns a file, inspect it before release. A term match can be benign, but package files, screenshots, exports, secrets, or tenant data must not be included.

Check whitespace:

```bash
git diff --check
```

Check ZIP archive integrity:

```bash
unzip -t dist/yeeflow-builder-plugin-0.1.0.zip
```

## ZIP Packaging

If no repo-specific plugin package command is available, create the ZIP from the `dist` folder:

```bash
cd dist
rm -f yeeflow-builder-plugin-0.1.0.zip
zip -qr yeeflow-builder-plugin-0.1.0.zip yeeflow-builder-plugin
unzip -t yeeflow-builder-plugin-0.1.0.zip
```

Only regenerate the ZIP when the plugin folder contents intentionally change. If a release archive has already been shared, create a new semantic version instead of silently replacing it.

## Release Workflow

1. Start from the reviewed release branch.
2. Confirm the plugin folder is not duplicated.
3. Confirm the included skills still mirror `skills/installed/`.
4. Update release docs and release notes.
5. Run the release checklist.
6. Rebuild the ZIP only if plugin contents changed.
7. Commit with a clear release message.
8. Push the release branch.
9. Share either the Git branch/release tag or the ZIP artifact with installation instructions.

## Known Limitations

- Skills-only plugin.
- No OAuth.
- No Yeeflow API integration.
- No MCP server.
- `.yapk` mutation is not supported.
- Runtime testing still requires Yeeflow access.
- Public form custom code support is not claimed unless tested.
- Organization-level private marketplace distribution remains future work until the Codex environment support path is verified.
