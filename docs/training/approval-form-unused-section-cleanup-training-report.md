# Approval Form Unused Section Cleanup Training Report

## Summary

This training closes a generated Approval form quality gap found during runtime review: generated forms correctly used the Approval Form Layouts v1.1 shell and materialized business fields, but they also retained copied template-only modules that had no business content. The visible result was a submission page with no-action `Operations` button groups and several empty repeated sections below the real request fields.

## Root Cause

The Approval form generator treated the v1.1 layout template as a complete page to keep, rather than as a source template whose optional repeated modules must be copied only when they receive real business content.

The existing validator confirmed template identity, required regions, action/history preservation, and field injection, but it did not fail generated forms that kept unused copied modules.

## Training Rules Added

- Generated Approval form `Operations` containers must be removed unless they contain real configured Yeeflow actions.
- Generated `content_card_wrapper`, `content_card_60_wrapper`, and `content_card_40_wrapper` modules must not keep empty `section_content_area` slots.
- Generated repeated section modules must be removed when they do not contain real business content.
- The locked `action_panel_flow_history_wrapper` remains preserved, including its action panel and workflow history controls.
- Approval forms with no planned business fields keep one valid business content card containing a generated no-fields notice, so required layout regions remain present without copying empty template sections.

## Generator Changes

- Approval form materialization now removes no-action `Operations` groups before package output.
- Approval form materialization now removes unused copied business sections and content cards while preserving the locked action/history section.
- The first valid `content_card_wrapper > section_content_area` slot is preferred for field-grid insertion.
- Forms without planned fields receive an explicit no-fields notice so the generated form remains structurally valid and does not collapse into an empty shell.

## Validator Changes

- `validate-approval-form-layout-template.mjs` now requires registry cleanup rules for generated Approval forms.
- Generated forms now fail on:
  - `APPROVAL_FORM_LAYOUT_OPERATIONS_WITHOUT_ACTIONS`
  - `APPROVAL_FORM_LAYOUT_EMPTY_SECTION_CONTENT_AREA`
  - `APPROVAL_FORM_LAYOUT_UNUSED_SECTION_MODULE`
  - `APPROVAL_FORM_LAYOUT_CLEANUP_RULE_MISSING`

## Regression Coverage

- Added focused approval layout test cases for no-action Operations containers and empty copied business sections.
- Re-ran the full-app materializer regression through first-generation preflight to prove generated Approval forms keep only meaningful business content and still pass Approval form layout and field-grid gates.

## Safety

No signing, package install/import, upgrade, stable movement, tags, releases, or live Yeeflow writes were performed for this training.
