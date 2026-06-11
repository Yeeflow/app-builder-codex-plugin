# Yeeflow Skill Sync Audit - CAPEX V3/V4 Form Design Learning

Date: 2026-05-14

Branch: `feature/it-hardware-capex-v3-ui-refresh`

## Scope

This audit verifies that project skill mirrors and active installed Codex skills include the latest IT Hardware CAPEX Runtime V2/V3/V4 learning, Yeeflow Application Design System rules, normalized workflow-action/control/field references, and validator/generator guidance.

## Skills Checked

- `yeeflow-feature-learning-orchestrator`
- `yeeflow-application-generator`
- `yeeflow-approval-form-generator`
- `yeeflow-data-list-generator`
- `yeeflow-dashboard-generator`
- `yeeflow-design-system-alignment`

The `yeeflow-design-system-alignment` skill previously existed only as an active installed skill. It is now mirrored under `skills/installed/yeeflow-design-system-alignment/` so project and installed skills can be checked consistently.

## Knowledge Confirmed

Core schema and workflow references:

- `workflow-action-configurations.normalized.json`
- `control-configurations.normalized.json`
- `field-configurations.normalized.json`
- `workflow-action-config-validator.js`
- `yeeflow-control-field-schema-utils.js`
- `docs/yeeflow-control-field-generation-rules.md`
- `docs/yeeflow-control-to-field-mapping.md`
- fallback/deferred control guidance

App/package rules:

- fresh ID family rule
- fresh FlowKey/form key rule
- app-level `Data.Forms[].ListID = 0`
- native `Title` metadata rule
- root app shell rules
- Type `103` dashboard/page rules
- `AppThemes`, `AppComponents`, `AppTags`, and `AppMetadatas` expectations
- `ReplaceIds` internal/external lookup rules

Design system rules:

- Yeeflow Application Design System defaults
- full-width, zero-padding page/form layout
- `Main` as structural parent
- `Content` for visible content
- `Form body` / `Form bottom`
- Action Panel and Flow History in `Form bottom`
- dashboard/data-list-form/approval-form standards
- meaningful `nv_label`
- token-aligned colors and spacing
- global page background rule: page/form background, not `Main`

CAPEX Runtime V2/V3/V4 learning:

- Form header container
- Request summary panel
- Request metric row
- gradient/background image via `attrs.common.css` with `selector { ... }`
- container-level text color inheritance
- Text Style Sample native Text control pattern
- inline Text and Icon controls
- square icon badge wrappers
- two-column `flex_grid` for normal fields
- full-row handling for textarea/richtext/list/sublist controls
- calculated fields such as `Subtotal = Quantity * Unit Price`
- runtime-sensitive control guidance for location, cost center, metadata/department, image/icon upload, and file upload

CAPEX generated-app runtime baseline:

- `IT Hardware CAPEX Request v4 Text Standard`
- generator: `generate-it-hardware-capex-request-v3.mjs`
- baseline doc: `docs/generated-it-hardware-capex-request-text-standard-baseline.md`
- runtime result: import/open/form-open passed; generated Text control Typography and Text shadow designer popups opened successfully
- accepted validation state: package/form/list validation may pass with warnings, but no Text-control errors or unsafe Text-control shapes remain

## Sync Result

All checked project mirrors match their active installed `~/.codex/skills/<skill-name>/` folders after sync.

## Safety Checks

- JS/MJS syntax checks passed for project skill mirrors and active installed skills.
- JSON parse checks passed for skill JSON/reference files.
- No raw `.yap`, `.ydl`, `.ywf`, `.zip`, env, secret, credential, downloaded export, or original uploaded schema JSON files are bundled in the checked skill folders.
- Normalized schema references are compact safe references, not raw uploaded files.

## New Skill Decision

No new skill was created.

The current scope is cross-cutting but already has clear ownership:

- approval form UI/UX and controls: `yeeflow-approval-form-generator`
- app/package orchestration: `yeeflow-application-generator`
- data-list persistence and custom forms: `yeeflow-data-list-generator`
- dashboard-specific page generation: `yeeflow-dashboard-generator`
- export-backed learning workflow: `yeeflow-feature-learning-orchestrator`
- brand/design alignment: `yeeflow-design-system-alignment`

A future dedicated `yeeflow-form-design-generator` may become useful if form-design patterns grow into a standalone authoring workflow with reusable templates and scripts. For now, the existing skills are sufficient and less duplicative.
