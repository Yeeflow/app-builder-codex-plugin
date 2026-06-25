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

This CLI is the concrete package-artifact handoff for clean-room tests and automation only when it can materialize the approved App Plan resource graph. It consumes approved Markdown planning contracts and an API-issued ID manifest, then emits:

- generated-final `.yapk`;
- decoded resource JSON;
- ID provenance report;
- generation report.

The materializer is not a signing, install/import, upgrade, seed-data, Version Management, or browser/runtime proof tool. It must stop before those stages and its report must say so. Plugin regression tests may use an explicit fixture-ID mode, but fixture-ID output is not signing/install eligible and must never be reported as live Yeeflow ID provenance.

Fixture-ID mode must still exercise realistic generated-final resource graphs. When `--allow-fixture-api-ids-for-tests` is used, the materializer must allocate enough synthetic API-shaped numeric string IDs for the actual App Plan resource demand instead of using a tiny fixed ID set that only works for trivial schema-smoke plans. Fixture IDs must remain clearly marked as regression-only, `signingEligible: false`, and not live Yeeflow ID provenance.

The materializer must also be honest about implementation coverage. For nontrivial App Plans that declare data lists, approval forms, reports, custom forms, dashboards, and navigation groups, the standalone materializer must emit a minimal generated-final resource graph rather than a placeholder package. The output must include the planned `Childs[]`, `Forms[]`, `FormNewReports[]`, dashboard `Pages[]`, custom list layouts, and grouped `ListSet.LayoutView` navigation needed for generated-final resource-completeness validation. It must keep `signingEligible: false` until generated-final preflight passes.

Minimal resource-graph output must be internally valid before it is handed to signing readiness. The materializer must preserve API-issued IDs as strings and must not pass them through JavaScript `Number`, because 16+ digit Yeeflow IDs lose precision and can collapse into duplicate resource IDs. Its ID provenance manifest must use actual decoded JSON paths, not logical helper aliases.

For supported generated-final output, the materializer must also emit:

- runtime-shaped navigation group metadata with API-issued group IDs, `AppID`, `ListSetID`, icons, and supported child targets;
- data-list default views with `Ext1.Url = default`, visible `layout[]` columns, `query[]` fields, and required system query fields;
- approval `DefResource` as `base64("::brotli::" + Brotli(JSON))` with page registrations, request/task form metadata, workflow graph nodes, task URL, actions, variables, and approved/rejected paths;
- dashboard resources with export-style wrapper keys, `Ext2.src`, `LayoutInResources[0].ID/RefId = LayoutID`, canonical Dashboard Page Layouts v1.1 Content padding, Summary `exts`, `ReportIds`, and `save_var` runtime model metadata.

The materializer must consume the approved App Plan deeply enough for generated-final preflight to exercise the real application contract. For every generated data list, emit the planned business fields, normalize generated package field storage names to the YAPK-supported `Text`, `Bit`, `Decimal`, and `Datetime` field families by `FieldIndex`, and keep the user-facing business display names. Choice-like fields must write runtime-visible `Rules.choices` and aligned `Rules.color_choices`, not legacy option paths. For every planned custom data-list form, attach the Type `1` layout to the host list declared in the App Plan instead of placing all custom forms under the first list. Dashboard materialization must parse planned Dashboard filters, generate real `select-filter` controls with label layout, typography, placeholder, placeholder color, radius, fixed-width positioning, source list, source field, and downstream Collection consumer linkage, and place those filters inside approved v1.1 business-content slots. Dashboard Collections must replace detail-layout placeholders with concrete Type `1` layout IDs that belong to the Collection source list, preserve grid-table wrapper gap contracts on the Collection parent container, carry explicit dataset region/template provenance, and write Designer-recognized filter condition shapes when multiselect templates use filter bindings.

Dashboard KPI materialization must clone the approved KPI card structure but rebind every visible dynamic KPI value to a page-local Summary/temp variable contract. A generated business Dashboard must not retain source-template variables such as `__temp_event_portfolio_approved_budget`, `__temp_event_portfolio_registration_rate`, or `__temp_event_portfolio_lead_follow_up`. For each visible KPI value that uses `attrs.headc.title.variable` or an equivalent dynamic text binding, the referenced variable must be declared in the same page resource `tempVars`, backed by a real hidden Summary control, listed in `ReportIds`, and represented in `Resource.exts`. Missing page-local declarations, undeclared KPI variable references, or Event Portfolio source-template variable residue are generated-final blockers before signing readiness.

Dashboard Summary controls that back KPI values must live inside a dedicated hidden host container, not directly in visible content regions. The hidden host must serialize `attrs.common.hide = [null, true, true, true]`, `attrs.style.direction = [null, "row"]`, `attrs.style.widthtype = [null, "1"]`, explicit `gap`, `align_items`, and `justify_content`, and a false display rule such as `attrs.display.rule = "1 == 0"`. Summary count controls that use the native record identifier must treat `ListDataID` as a runtime system field and must include designer-shaped field metadata on `attrs.data.field`, `attrs.data.fieldObject`, `attrs.data.fieldInfo`, `attrs.field`, `attrs.fieldObject`, and `attrs.fieldInfo`. Generated-final preflight must run `scripts/inspect-dashboard-summary-control-contract.mjs` so packages cannot proceed to signing readiness with missing Summary hidden hosts or unresolved Summary field metadata.

Form report resources belong in `FormNewReports[]`. Runtime navigation must not emit unsupported Type `106` children; report navigation entries must resolve through a supported dashboard, approval form, or data-list target while the report resource remains present in `FormNewReports[]`.

If a future App Plan declares resource categories that the standalone materializer still cannot generate, it must fail closed with `FULL_APP_MATERIALIZATION_RESOURCE_GRAPH_NOT_IMPLEMENTED`. It must not emit a placeholder `.yapk`, must not return `status: pass`, and must not set `signingEligible: true` for a package that has not materialized the App Plan resource graph and passed generated-final hard gates.

When used, the `FULL_APP_MATERIALIZATION_RESOURCE_GRAPH_NOT_IMPLEMENTED` finding must be actionable. It must include:

- exact planned resource counts by category;
- parsed planned resource names by category;
- a `missingResourceGraph[]` list that maps each planned category to its required generated-final output surface;
- `packageEmitted: false`;
- `signingEligible: false`.

The materializer's App Plan resource-demand parser must count only resource-level declarations. Field tables, dashboard section tables, metric rows, filter rows, item-template rows, validator command text, and explanatory prose must not inflate resource counts. If a section uses resource headings, those headings are authoritative for that resource category. Table fallback counting is allowed only for canonical resource-name headers such as `List Name`, `Form Report Name`, `Form Name`, `Dashboard Page Name`, or navigation `Group`.

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

If the inspector passes and generation still stops immediately after planning, classify the concrete blocker. If API-issued IDs are unavailable, hard-stop with an ID-source error rather than claiming that no materialization entrypoint exists. If the standalone materializer is present and the App Plan only uses supported first-generation resource categories, it must continue into minimal resource-graph package creation and then generated-final preflight. If unsupported resource categories remain, hard-stop with `FULL_APP_MATERIALIZATION_RESOURCE_GRAPH_NOT_IMPLEMENTED` and route the run to the skill-orchestrated generator or a follow-up resource-graph implementation task.
