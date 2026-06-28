# Approval Form Page Title Empty Section Cleanup Training Report

## Scope

This training fixes a generated Approval Form Layouts v1.1 cleanup gap. The issue was observed on generated Approval submission and task forms where `page_title_section` still contained an empty `section_content_area` designer drop zone even though no business content was planned for that slot.

## Defect

The Approval form generator already removed unused copied business sections such as `content_card_wrapper`, `2_columns_section`, and `3_columns_section`, but it did not remove empty standalone `section_content_area` containers outside those repeatable modules.

The Approval form layout validator had the same blind spot. It rejected empty `section_content_area` only when it was inside a content card wrapper, so an empty `page_title_section > section_content_area` could pass generated-final validation and remain visible in Designer.

## Required Rule

Generated Approval submission forms, Approval task forms, Data List workflow task forms, and Schedule workflow task forms must remove every empty `section_content_area` container unless that container contains real business content.

This explicitly includes the optional `section_content_area` inside `page_title_section`.

Keep:

- `page_title_section`
- `page_title_content`
- `page_title_text`
- `page_title_description`

Remove:

- `page_title_section > section_content_area` when it is empty
- any copied `section_content_area` that has no real business controls
- any copied section wrapper that has no real business content, except the locked workflow action/history section

## Generator Update

`removeUnusedApprovalTemplateSections()` now matches the cleanup behavior used by Dashboard and Data List form layouts:

- recursively visits generated resources
- removes empty `section_content_area` containers regardless of parent module
- preserves locked `action_panel_flow_history_wrapper`
- keeps repeatable modules only when they contain meaningful business content

## Validator Update

`validate-approval-form-layout-template.mjs` now rejects any generated empty `section_content_area`, not only empty slots under content card wrappers.

Hard gate:

- `APPROVAL_FORM_LAYOUT_EMPTY_SECTION_CONTENT_AREA`

## Regression Coverage

Focused tests now cover:

- generated Submission form with empty `page_title_section > section_content_area`
- generated Task form with empty `page_title_section > section_content_area`
- existing empty copied business section rejection
- valid generated resources after cleanup

## Safety Boundary

This training changes Approval form layout cleanup, validation, tests, and guidance only. It does not change workflow graph generation, live install behavior, package signing, version metadata, or stable promotion.
