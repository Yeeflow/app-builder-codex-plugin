# Quick Start

## Install

Use Codex App marketplace install with:

```text
Source: <tenant-url>
Git ref: stable
Sparse paths:
  .agents/plugins/marketplace.json
  dist/yeeflow-app-builder-plugin
```

Expected plugin: `Yeeflow App Builder` version `0.6.67`.

Version `0.6.67` releases Full-page form/detail semantic quality gates from PR #101. It adds form/detail semantic quality gates for Approval and Data List form/detail design artifacts; validates field/value mismatch guardrails; requires meaningful lower-page business regions instead of page-end/generic notes; requires page-specific quality evidence; checks template reuse risk; and blocks `readyForBlueprint: true` when semantic quality, lower-page business regions, page-specific evidence, or template reuse risk fails.

Version `0.6.56` releases Supplier runtime/design fidelity gates and validation-layer proof gates. Runtime proof must use the installed application `ListSetID` and runtime URL, never install-log IDs. Design implementation must map design sections, KPI counts, page background/chrome, Data Filter bindings, Collection detail links, analytics controls, progress/status treatments, Summary/KPI bindings, and canonical one-PNG-per-page artifacts through explicit design manifest mapping. Reports must keep `schemaValidation`, `appPlanConformance`, `designContractValidation`, `controlBindingValidation`, `exactMetadataShapeValidation`, `idStabilityValidation`, `signVerify`, `installOrUpgrade`, `runtimeBrowserProof`, and `pixelComparison` separate; schema pass is not UI proof, API/sign/install acceptance is not runtime/browser proof, proof layers must not be collapsed, decoded `ListSetID` must be tied to runtime URL proof, and the control-binding graph must be complete. Root padding gates from `0.6.55` remain baseline behavior, approval-form root padding remains deferred because evidence is mixed, and no pixel-perfect or live runtime proof claim is made before the matching runtime/browser evidence exists.

## Configure Local Environment

Normal OAuth and workspace discovery do not require `.env.local`; the file may be absent or empty. Fixed API/OAuth defaults are bundled by the plugin.

```env
# No required values for normal OAuth + workspace discovery.
```

Run OAuth login before API access. OAuth uses Authorization Code with PKCE S256, and the plugin generates the `code_verifier`. No OAuth client secret is required for normal login/refresh. `YEEFLOW_API_KEY` is not required for normal OAuth-backed API calls and is retained only as a legacy/deprecated fallback.

## Validate Locally

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.67
node scripts/test-yeeflow-oauth-auth.mjs
node scripts/test-yeeflow-api-capabilities.mjs
```

## Use API Helpers Safely

List documented capabilities:

```sh
node scripts/yeeflow-api-list-capabilities.mjs --read-only
```

Run a read-only mapped smoke call only after OAuth is authenticated:

```sh
node scripts/yeeflow-api-call-capability.mjs --name locations.list
node scripts/yeeflow-workspace-list.mjs --all
node scripts/yeeflow-workspace-list.mjs --category flowcraft
```

Do not use guessed paths or arbitrary raw API calls. `GET /workspaces/settings` and `GET /workspaces/flowcraft` are mapped as read-only OAuth workspace discovery and print only redacted workspace summaries. For current app/package workflows, `flowcraft` is the relevant workspace category unless product/API docs change. Mutating capabilities and package operations require explicit confirmation. Package install/import/upgrade ignores local `YEEFLOW_WORKSPACE_ID` for target selection and must stop with `workspace_selection_required` before request shaping until the user chooses an API-discovered `flowcraft` workspace and passes it with `--selected-workspace-id` or documented user-selected `--workspace-id`.

## Build And Validate Packages

Use the validators and wrapper helpers for local proof:

```sh
node validate-yap-package.js <package.yap>
node validate-yapk-package.js <package.yapk>
node validate-yap-graph.js <package-or-resource>
```

Generated-final `.yapk` packages must also pass the ID provenance and navigation runtime metadata hard gates before signing, install, upgrade-check, or handoff:

```sh
node scripts/validate-yapk-id-provenance.mjs --package <package.yapk> --manifest <id-provenance-report.json>
node scripts/validate-yapk-navigation-runtime-metadata.mjs --package <package.yapk> --id-provenance <id-provenance-report.json>
```

YAPK upgrade/new-version packages must also prove ID continuity against the previous version before signing, upgrade-check, upgrade apply, install-like writes, or handoff:

```sh
node scripts/validate-yapk-upgrade-id-stability.mjs \
  --previous-package <previous.yapk> \
  --previous-manifest <previous-id-lineage.json> \
  --new-package <package.yapk> \
  --new-manifest <new-id-lineage.json>
```

Dashboard-heavy generated-final `.yapk` packages must also pass the dashboard grid-table Collection gate when the plan claims that pattern:

```sh
node scripts/validate-dashboard-grid-table-collections.mjs --package <package.yapk> --require-grid-table-collections --require-hide-header --require-visible-title
```

High-quality UI, Summary/KPI, and runtime-evidence claims must also pass the UI hard gates from `docs/standards/ui-summary-kpi-runtime-hard-gates.md`:

```sh
node scripts/inspect-yeeflow-ui-design-contract.mjs --contract <ui-contract.md> --claim-high-quality-ui
node scripts/inspect-dashboard-style-shapes.mjs --package <package.yapk>
node scripts/inspect-dashboard-summary-control-contract.mjs --package <package.yapk>
node scripts/inspect-visible-kpi-runtime-bindings.mjs --evidence <redacted-runtime-evidence.json>
node scripts/inspect-runtime-evidence.mjs --evidence <redacted-runtime-evidence.json> --claim-high-quality-ui
node scripts/inspect-grid-table-quality.mjs --package <package.yapk> --require-grid-table
node scripts/inspect-yapk-upgrade-app-identity.mjs --package <package.yapk> --lineage <lineage.json>
node scripts/test-ui-hard-gates-all.mjs
```

When a task claims high-quality dashboard/UI output, route through `yeeflow-ui-generation-hard-gates` before package generation or handoff. High-quality UI requires a page-by-page implementation contract; uncertain UI/runtime patterns should be proven on a sandbox page first; use export-proven Yeeflow control/style shapes; Summary/KPI controls require designer-shaped hidden Summary configuration; Summary controls must bind real fields, filters, temp variables, `save_var` expression objects, layout-resource `Resource.ReportIds`, matching layout-resource `Resource.exts`, and layout-resource `Resource.tempVars`; top-level `Pages[].ReportIds` is optional compatibility metadata; dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape with before/after mutation proof and refreshed/recalculated runtime evidence; Summary recalculation can be asynchronous or cache-delayed; semantic/non-UUID Summary IDs and other unsupported shapes remain unproven; for every other shape, visible KPI dynamic binding is not considered solved unless runtime-proven; fallback KPI values must be explicitly labeled as fallback; runtime screenshot evidence is required before claiming UI quality; install/signing/API acceptance is not runtime UI proof; UI upgrades must preserve ListSetID, app identity, existing IDs, and declared change scope; broad scaffold-like UI must not be claimed as high-quality UI. Data Analytics controls require UUID/runtime-safe IDs for Pie chart, Column chart, Line chart, Gauge, Funnel chart, Color block heatmap, Summary, and Pivot table. Preserve existing Data Analytics control IDs during upgrades.

Phase 1 and Phase 2 are stable closed-loop capabilities. Phase 3A makes the workflow stricter in hard-gate guidance and regression tests: design/mockup work must generate and validate a UI contract first, UI upgrades must validate a declared page/scope manifest, and runtime evidence plus structural comparison is required before design fidelity claims. Package validation/signing/install/upgrade success is not visual proof, and upgrade-check or upgrade-apply success is not a replacement for runtime evidence. Dynamic KPI proof remains separate and requires before/after mutation evidence. Real Marketing Event private artifacts are not committed; regression fixtures are synthetic/inspired.

Phase 3B is the workflow enforcement layer. Phase 3B closes the planned UI-quality track; after Phase 3B, future work is normal incremental improvement unless a new runtime issue class appears. The workflow enforcement helper purpose is to validate the final metadata/report chain before high-quality UI, runtime UI quality, design fidelity, or dynamic KPI proof is claimed. High-quality UI claims require evidence chain, not just install success: UI contract, UI contract validation, scope manifest and scope validation for upgrades, runtime evidence, design/runtime structure findings, workflow enforcement findings, and before/after KPI mutation evidence when dynamic KPI proof is claimed. Standard artifact paths are `docs/generated-ui-contracts/<app-or-package>/<page>.ui-contract.md`, `docs/generated-ui-contracts/<app-or-package>/<page>.ui-contract.json`, `docs/ui-upgrade-scopes/<app-or-package>/<page>.scope.json`, `dist/runtime-evidence/<app-or-package>/<page>.runtime-evidence.redacted.json`, `dist/runtime-evidence/<app-or-package>/<page>.design-runtime-structure.findings.json`, and `dist/runtime-evidence/<app-or-package>/<page>.closed-loop-workflow.findings.json`. Run `node scripts/inspect-ui-closed-loop-workflow-enforcement.mjs --workflow <workflow-report.json-or-md>` before final UI-quality or design-fidelity claims. Dynamic KPI proof remains separate.

Marketing Event v0.6.45 design/runtime fidelity lessons add stricter training guidance. Plans and UI contracts must define exact primary navigation labels and order, hidden support resources, and mock-vs-runtime KPI boundaries. Visible primary navigation must be generated from the approved UI contract, not inferred from all resources in the package. Support data lists, forms, approval pages, and implementation-only resources must not automatically appear in the primary navigation when excluded by the approved contract; use schema-compatible metadata such as `ListSet.LayoutView.sort` for hidden support resources. Runtime screenshot proof must explicitly refresh Chrome before capture, and runtime navigation evidence must be nav-scoped or exact-line based because broad body-text nav scans are unreliable. Signing, verifysign, upgrade-check, and upgrade-apply are not visual proof. Content-fidelity review must cover KPI card visual richness, table badge/progress/avatar treatment, spacing, and hierarchy. If design KPI values are mock visual placeholders, runtime value mismatch is a warning only; dynamic KPI proof still requires before/after mutation evidence.

P0 runtime navigation proof uses `node scripts/inspect-runtime-navigation-proof.mjs --contract <contract.json> --runtime-evidence <runtime-evidence.redacted.json>`. It enforces exact primary navigation labels/order, hidden support-resource expectations, explicit refresh-before-screenshot metadata, nav-scoped or exact-line runtime navigation evidence, and separate app chrome, primary navigation, content structure, and dynamic KPI proof-boundary report sections. Broad body-text-only nav proof, support resources visible in primary nav, and signing/upgrade success as visual proof are hard failures. Navigation fidelity passing does not mean content fidelity passed.

UI control-property fidelity uses `node scripts/inspect-ui-control-property-fidelity.mjs --candidate <control-spec.json>`. Use it for high-quality dashboard/content claims that depend on exact Container attrs, Data Filter controls, filter/action rows, filter-variable consumption, action sizing, KPI icon tiles, and KPI text-stack consistency. Before generating controls, inspect legal paths with `node scripts/inspect-yeeflow-control-configurations.mjs --normalized docs/reference/yeeflow-control-configurations.normalized.json --control <controlType>`. Product catalog paths are the baseline; extension-registry paths require study/export/runtime evidence and must remain visible in reports. Container-vs-Grid and Data Filter-vs-static Text choices are hard-gate concerns; signing/upgrade success and screenshot presence alone are not control-property proof. Container is a special layout control: Container width, height, and flex layout use `attrs.style`. Most non-Container Advanced-tab properties use `attrs.common`, including runtime-effective width through `attrs.common.positioning`, margin/padding, border, hover shadow, and background. High-fidelity Data Filter dropdowns must use approved extension-backed wrapper, input, and dropdown-panel patterns. Filter/action row hierarchy must put full-width layout on the parent row, inline layout on the second-layer filter/action groups, and fixed 180px sizing on the Data Filter controls rather than wrapper containers. Data Filter 180px runtime width must use `attrs.common.positioning.widthtype = [null, "3"]`, `width = [null, 180]`, and `widthu = [null, "px"]`. Relative Period filters require valid field and choice-options metadata. Filter icons must use native icon controls with the approved 16px pattern, not heading/text glyphs. KPI/card fidelity requires Container-based rich structure with icon tile, centered icon, text stack, Summary/value, trend, and helper text; Summary values must not render raw variable names, and live KPI values that differ from mocks must be reported as a live-data boundary. KPI presentation values must use `formatNumber(...)` or equivalent formatting when high-quality numeric display is claimed; compact K/M/B display is required for large values when expected, fixed decimals are required for rates/percentages, long raw decimals are rejected, and unformatted large KPI numbers must be compacted or explicitly waived. Rich tables require badge, progress, avatar/person, header hierarchy, and row-density treatment when the design requires it. Event Pipeline-style Collection grid-tables also require overflow hidden on the root, aligned header/body grids, cell padding parity, real progress controls for progress-like columns, Dynamic user/person controls for owner columns, User/identity field bindings, and semantic `nv_label` in the grid-table subtree. Runtime User/person proof requires real User field values; redacted `/users/search` `AccountID` provenance, scoped item PATCH proof for blank existing rows, batch-create proof when adding sample rows, and retry/backoff verification metadata are allowed as redacted proof boundaries, but raw user IDs, item IDs, API responses, tenant URLs, and private fields must never be stored. Styled action Containers must include real Yeeflow action metadata; add-list action Containers require `action-type = "5"`, target list metadata, child Heading/Text labels, and semantic `nv_label`. Important generated structural controls need semantic `nv_label` values for Yeeflow designer Navigator naming, and decoded package `Resource.attrs` must be checked when decoded evidence is available. Designer-backed gradients support two colors unless explicit custom CSS evidence exists.

Full-application Summary and page fidelity must be validated on every generated page, not only the first page or Event Portfolio-like dashboard. Summary source controls must remain normal `type: "summary"` controls; page `children` must not contain clipboard wrapper objects such as `_ak_c`; and matching page `Resource.exts[]` pivot metadata must include `category: "___Pivot___"`, `key: "summary"`, `i`, `attr.AppID`, `attr.ListID`, `attr.ListSetID`, and nonempty `attr.settings.values[]`. COUNT summaries must use `ListDataID`, SUM/AVG summaries must use the selected numeric field, and Summary controls must carry top-level and attrs-level `save_var` / `saveVar`. Source Summary controls belong in a hidden metric data source Container with `attrs.common.hide = [null, true, true, true]` and `attrs.style.display = "none"`; the hidden host name/label/`nv_label` must not cause Summary misclassification. Visible KPI values must bind to Summary temp variables and never show raw variables or formulas. Generated pages must also keep real Data Filters instead of static Text, require filter variables to feed target Summary/Collection/List controls, keep Add/New action Containers action-capable, use Collection grid-table column gap `0`, resolve collection links to valid form options, render progress columns with progress controls backed by numeric fields, bind Dynamic user/person controls to User fields, and format KPI numbers with `formatNumber(...)`.

Version `0.6.55` releases dashboard and data-list custom form root padding hard gates. Dashboard/app page roots now require `attrs.container.cw = "2"` and `attrs.container.padding = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]`; data-list custom form roots require the same exact token-array padding shape. Scalar zero, numeric object zero, numeric array zero, `attrs.common.padding` alone, `attrs.style.padding` alone, and missing or wrong `attrs.container.cw` are rejected. Upgrade and patch flows normalize dashboard page roots and data-list custom form roots before signing or installing. Inner containers, cards, grids, and forms may keep intentional spacing. Approval form roots are intentionally unchanged because existing evidence is mixed and needs a separate export/runtime proof task.

Version `0.6.54` releases Summary/filter/collection/full-page fidelity gates. It keeps Summary controls as normal `type: "summary"` controls rather than invalid `_ak_c` clipboard wrappers; requires page `Resource.exts[]` Summary pivot metadata with `AppID`, `ListID`, `ListSetID`, and nonempty `settings.values[]`; requires COUNT Summary settings to use `ListDataID`; requires top-level and attrs-level `save_var` / `saveVar`; requires hidden Summary source hosts to hide on desktop, tablet, and mobile with `display:none`; and requires visible KPI values to bind to Summary temp variables instead of rendering raw variables. The release also reinforces real Data Filter controls instead of static Text, Add/New Containers with `action-type = "5"` and target list metadata, Collection grid-table column gap `0`, resolved collection links, progress controls instead of raw formula text, Dynamic user controls bound to User/identity fields, and field type compatibility gates. This release does not claim pixel-perfect visual diffing, automatic screenshot parsing, or live runtime proof before install/cache smoke and focused runtime testing are performed.

Version `0.6.53` releases Runtime Sample Data and KPI/Table Presentation Fidelity Gates. It adds runtime sample-data proof gates for redacted `/users/search` `AccountID` provenance, scoped item PATCH proof for blank User/person values, Events/list item batch-create proof for runtime sample rows, and retry/backoff or delayed verification for batch-created rows. Collection grid-table fidelity now covers root overflow hidden, aligned header/body grids, padding parity, real progress bar controls for progress-like columns, numeric progress source fields, Dynamic user/person controls bound to User/identity fields, and semantic `nv_label` values. KPI presentation fidelity now covers `formatNumber(...)`, compact K/M/B formatting, fixed decimal formatting, long raw decimal rejection, and unformatted large-number rejection. Runtime values remain live and mock values are visual targets only. This release does not claim pixel-perfect visual diffing, automatic screenshot parsing, or live runtime proof before install/cache smoke and focused runtime testing are performed.

Start runtime proof reports from `docs/examples/runtime-evidence.redacted.example.json`. The template is synthetic and redacted, labels fallback KPI values as fallback, and is shaped for `scripts/inspect-runtime-evidence.mjs` plus `scripts/inspect-visible-kpi-runtime-bindings.mjs`. Run `node scripts/test-ui-hard-gates-all.mjs` before claiming UI quality.

`scripts/test-ui-generation-hard-gate-skills.mjs` validates `yeeflow-ui-generation-hard-gates` in both supported layouts: source layout `skills/installed/yeeflow-ui-generation-hard-gates/SKILL.md` and installed plugin cache layout `skills/yeeflow-ui-generation-hard-gates/SKILL.md`. The test reports which path is used, fails only when neither path exists, and does not weaken UI/Summary/KPI hard-gate wording checks.

The materialized Codex plugin cache must include the hard-gate cache artifacts under `scripts/`: `validate-functional-specification.mjs`, `validate-app-plan-resource-order.mjs`, `validate-business-clarification-gate.mjs`, `validate-generation-readiness-review.mjs`, `validate-functional-spec-to-app-plan-traceability.mjs`, `test-functional-specification-and-app-plan-gates.mjs`, `test-clarification-readiness-traceability-gates.mjs`, `validate-yapk-id-provenance.mjs`, `validate-yapk-navigation-runtime-metadata.mjs`, `validate-yapk-upgrade-id-stability.mjs`, `validate-dashboard-grid-table-collections.mjs`, `generate-ui-contract-from-design.mjs`, `capture-runtime-ui-evidence.mjs`, `validate-ui-upgrade-scope.mjs`, `compare-design-to-runtime-structure.mjs`, `inspect-ui-closed-loop-workflow-enforcement.mjs`, `inspect-application-layout-design-rules.mjs`, `inspect-runtime-navigation-proof.mjs`, `inspect-yeeflow-ui-design-contract.mjs`, `inspect-dashboard-style-shapes.mjs`, `inspect-dashboard-summary-control-contract.mjs`, `inspect-visible-kpi-runtime-bindings.mjs`, `inspect-runtime-evidence.mjs`, `inspect-grid-table-quality.mjs`, `inspect-yapk-upgrade-app-identity.mjs`, `decode-yapk-tolerant-brotli.mjs`, `yapk-first-generation-preflight.mjs`, `test-yapk-id-navigation-hard-gates.mjs`, `test-yapk-upgrade-id-stability.mjs`, `test-dashboard-grid-table-collections.mjs`, `test-ui-closed-loop-phase1.mjs`, `test-ui-closed-loop-phase2.mjs`, `test-ui-closed-loop-phase3.mjs`, `test-ui-closed-loop-phase3b.mjs`, `test-application-layout-design-rules.mjs`, `test-runtime-navigation-proof-gates.mjs`, and `test-ui-summary-kpi-runtime-hard-gates.mjs`. The root source copies and `dist/yeeflow-app-builder-plugin/scripts/` mirrors must stay byte-identical.

Generated design images for Yeeflow apps must declare one official application layout and one canonical application chrome style before they are used as UI implementation references. PNG/JPEG layout screenshots are the primary visual references for header/navigation/content safe-area geometry and dropdown or expanded menu behavior; YAPK exports are supporting structural references. Use `docs/standards/yeeflow-application-layout-design-rules.md` and run `scripts/inspect-application-layout-design-rules.mjs` to require one consistent layout and one consistent chrome style across all page images in the same app, including header mode, nav mode, nav background mode, selected state style, app icon placement, and app name placement. For Layout 1 vertical nav, do not add a header hamburger icon or bottom Collapse control, and do not mix dark and light nav panels across pages unless a separately named canonical style is explicitly reviewed and used everywhere. The validator also blocks unsupported arbitrary app shells, custom sidebars, custom top bars, floating navigation chrome, or content that overlaps the selected Yeeflow safe area. If image verification is not automated, mark `human_review_required`; screenshot-derived rules are human-reviewed derived rules, not pixel-perfect or automated screenshot proof.

Supplier Onboarding runtime/design lessons add a stricter full-app workflow gate. Treat design images as implementation contracts and create one canonical PNG per planned page before package generation: `assets/generated-ui/<app-slug>/01-<page-slug>.design.png`, `02-<page-slug>.design.png`, and so on, plus a `design-image-manifest.json`. SVG files are optional source only, and `00-design-board.png` cannot replace per-page PNGs. Runtime proof must use the exact installed `#/list-set/{AppID}/{ListSetID}` URL, not install log IDs or designer/admin/root routes. Run `node scripts/inspect-supplier-runtime-design-fidelity.mjs --package <redacted-fixture-or-report.json>` before high-fidelity Supplier-like app claims to validate ListSetID proof, design sections/KPI counts, real Data Filters, Collection source/detail links, real analytics controls, progress controls, Summary/KPI bindings, and canonical PNG page mapping.

Supplier validation-gap gates require layered proof reporting for full end-to-end app generation. Keep `schemaValidation`, `appPlanConformance`, `designContractValidation`, `controlBindingValidation`, `exactMetadataShapeValidation`, `idStabilityValidation`, `signVerify`, `installOrUpgrade`, `runtimeBrowserProof`, and `pixelComparison` separate. A schema pass is not UI proof; signing/install/upgrade API acceptance is not runtime proof; runtime browser proof must use the decoded ListSetID URL; and canonical PNG pixel comparison must be reported as its own layer.

Full-application generation now requires a full-page design blueprint workflow before resource generation. A canonical design image must be a full-page implementation artifact, not a viewport-only mockup, and it must include all planned sections, controls, tables, forms, cards, filters, actions, lower-page regions, and page end. Create and validate a page implementation blueprint before generating resources, then compare decoded resources back to the blueprint before signing or upgrading:

```bash
node scripts/inspect-full-page-design-artifacts.mjs --manifest design-image-manifest.json
node scripts/inspect-page-implementation-blueprint.mjs --blueprint page-implementation-blueprint.json
node scripts/compare-blueprint-to-decoded-resource.mjs --blueprint page-implementation-blueprint.json --resource decoded-resource.json
```

The blueprint must map every visible design element to Yeeflow controls with `id`, semantic `nv_label`, hierarchy, exact property paths, bindings, interactions, and a runtime proof plan. Unknown property paths, invented aliases, incomplete binding/action contracts, missing decoded controls, and skipped stage evidence fail before package/sign/upgrade.

Horizontal navigation active-state styling requires runtime DOM/computed-style proof when claimed. Do not accept decoded `navigator-menu` active metadata or `LayoutView.customcss` alone as proof. If the generated app needs active nav styling, verify a hidden `codein` injector is placed inside a rendered page container such as `Content`, then load the app with a fresh cache-busted top-level URL and inspect `.ak-listset-new-navigation-item.active`: style tag present, selector present, active item present, transparent background, blue text, and blue solid nonzero bottom border.

The ID provenance report must prove API-issued content IDs from `GET /utils/generate/ids?count=<n>`. Local sequential, hardcoded, copied, random, timestamp, or UUID fallback IDs are forbidden for generated-final `.yapk` output. Runtime navigation groups require `ID`, `AppID`, `ListSetID`, `Type`, `Title`, `Icon`, and `list`; child items require `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`. Do not use `children` / `Childs` runtime navigation groups.

For YAPK upgrades, existing semantic resources must keep their previous IDs. Only newly added resources may receive newly API-issued IDs, removed IDs must not be reused for different objects, and a missing previous package or lineage manifest fails closed.

Dashboard grid-table Collection sections must use `collection`, not dashboard `data-list`, unless Data table is explicitly requested. Header `flex_grid` and Collection must share one wrapper with both `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`; planned row-click details require Collection link metadata and a Type `1` custom detail layout. Signing/install acceptance does not prove dashboard runtime/designer visual fidelity.

High-quality UI requires a page-by-page implementation contract, export-proven control/style shapes, and runtime screenshot evidence. Summary/KPI controls require designer-shaped metadata and runtime evidence. Dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape: UUID Summary IDs, `Resource.ReportIds[]`, `Resource.exts[]` with `category: "___Pivot___"` and `key: "summary"`, dashboard `Resource.tempVars[]`, designer-shaped `attrs.save_var`, visible `attrs.headc.title.variable[]`, and complete field metadata. Before claiming proof, capture before/after source data mutation evidence, expected values, inspector output, and refreshed/recalculated after-evidence; Summary recalculation can be asynchronous or cache-delayed. Other shapes remain unproven unless focused runtime proof exists, and fallback KPI values must be labeled as fallback. Upgrade UI packages must preserve ListSetID, app identity, existing IDs, package lineage, and final `ReplaceIds` coverage.

KPI Runtime Binding Proof v1.0.1 proves the exact UUID Summary shape only. Do not generalize it to semantic/non-UUID Summary IDs, approval forms, public forms, unsupported surfaces, or other visible binding shapes. Marketing Event dashboards may use this shape, but must still run their own before/after mutation proof before claiming runtime dynamic KPI success.

Local validation is not import proof, and API acceptance is not runtime proof. Report the exact proof boundary when delivering generated work.

Dashboard/app page root content-area padding is a hard gate: Type 103 dashboard/app page roots must use `attrs.container.cw = "2"` and `attrs.container.padding = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]`; scalar/object/numeric padding is rejected, and inner layout containers may keep intentional spacing. Data-list custom form root content-area padding uses the same hard gate for every New, Edit, View, Detail, or custom form under `Data.Childs[].Layouts[].LayoutInResources[].Resource` or `Childs[].Layouts[].LayoutInResources[].Resource`; inner form sections, cards, grids, controls, and content wrappers may keep intentional spacing.
