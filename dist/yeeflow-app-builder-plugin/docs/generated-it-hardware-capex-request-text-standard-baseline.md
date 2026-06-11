# Generated IT Hardware CAPEX Request Text Standard Baseline

Package: `IT Hardware CAPEX Request v4 Text Standard`

Status: generated from the latest CAPEX v3 UI refresh generator after studying `Text Style Sample.ywf`.

## What Changed

All generated native Text controls now use the export-backed Yeeflow Text style shape:

- `type: "heading"`
- `label: "Text"`
- `attrs.headc.title.value` for static text
- `attrs.heads.ty = [null, "<preset>"]`
- `attrs.heads.color = "<token-or-color>"`
- `attrs.common.positioning.widthtype = [null, "2"]`
- meaningful `nv_label`

This replaces the previous generated shape that used `attrs.heads.color = [null, "..."]` and, in one attempted fix, `attrs.heads.ty` as a plain string.

## Generated Files

- `generate-it-hardware-capex-request-v3.mjs`
- `it-hardware-capex-request-app-def.v4-text-standard.json`
- `it-hardware-capex-request-approval-form-def.v4-text-standard.json`
- `it-hardware-capex-request-list-def.v4-text-standard.json`
- `it-hardware-capex-request-generation-report.v4-text-standard.json`
- `it-hardware-capex-request.v4-text-standard.generated.yap`
- `/Users/Renger/Downloads/IT Hardware CAPEX Request v4 Text Standard.yap`

## Validation

Local validation passed on 2026-05-14:

- `node --check scripts/inspect-ywf-text-controls.mjs`: pass
- `node --check generate-it-hardware-capex-request-v3.mjs`: pass
- `node --check validate-ywf-def.js`: pass
- JSON parse checks for the decoded text-style sample inspection files and v4 generated JSON files: pass
- `validate-ywf-def.js text-style-sample-decoded-def.json --mode final`: not applicable as a final approval workflow because the sample export is a Text style sample form, not a complete approval process with submit/task pages and approval panels.
- `validate-ywf-def.js it-hardware-capex-request-approval-form-def.v4-text-standard.json --mode final`: `pass_with_warnings`, 0 errors, no Text-control warnings.
- `validate-yap-package.js it-hardware-capex-request-app-def.v4-text-standard.json --mode generator --stage final`: `pass_with_warnings`, 0 errors.
- `validate-yap-graph.js it-hardware-capex-request-app-def.v4-text-standard.json --mode generator --stage final`: pass, 0 errors.
- `validate-ydl-list.js it-hardware-capex-request-list-def.v4-text-standard.json --mode generator --stage final`: `pass_with_warnings`, 0 errors.
- `workflow-action-config-validator.js --smoke`: pass.
- `build-yap-wrapper.js`: pass, wrapper round-trip decoded app equals source.

Focused Text structural check:

- Generated Text control count: 35.
- Old unsafe `attrs.heads.color = [null, "..."]` count: 0.
- Invalid `attrs.heads.ty` count: 0.
- Non-inline generated Text count: 0.

## Runtime

Runtime verification on `https://<yourdomain>.yeeflow.com` passed for the Text-control bug fix.

- Imported `/Users/Renger/Downloads/IT Hardware CAPEX Request v4 Text Standard.yap` successfully.
- Opened the imported app successfully.
- Opened the generated approval form successfully.
- Designer URL verified: `https://<yourdomain>.yeeflow.com#/admin/model/designer?appid=<app-id>&defkey=<definition-key>&listsetid=<listset-id>`
- Selected the generated `Draft` metric Text control in the form designer.
- Typography settings popup opened successfully.
- Text shadow settings popup opened successfully.

This directly verifies the previous issue where generated Text controls rendered visually but the Typography and Text shadow designer buttons did not respond.

Design-system carry-forward rule:

- The CAPEX V2/V4 form-design learning remains global: full-page backgrounds belong on page/form background settings, not on the `Main` container.
- Future generated approval forms, task pages, data-list custom forms, and dashboard pages should keep `Main` structural and put section/card/header backgrounds on those specific containers only.
