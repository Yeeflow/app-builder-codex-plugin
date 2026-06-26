# Approval Task Field Parity and Empty Section Cleanup Training Report

## Scope

This training hardens generated Approval form task pages and v1.1 layout cleanup behavior after runtime testing showed two related defects:

- Approval task forms could contain only task-specific fields, leaving approvers unable to see the submitted request information.
- Generated v1.1 pages could retain copied template section cards whose `section_content_area` had no business content.

The fix applies to:

- Approval Form Layouts v1.1 submission and task pages.
- Dashboard Page Layouts v1.1 generated Dashboard pages.
- Data List Form Layouts v1.1 generated New/Edit and View Item forms.

## Generator Rules

Approval task forms now default to the Submission form field set plus any task-only fields planned for the task. A task page may omit a Submission field only when the Functional Specification or App Plan explicitly names the omitted field and explains why that task must hide it.

Task field controls must be explicitly readonly by default. Task-only editable fields require an explicit Functional Specification or App Plan requirement.

Generated v1.1 pages must remove unused copied modules instead of rendering empty cards. If a `section_content_area` would be empty, the owning copied section/card module must be removed from generated output.

## Hard Gates

The Approval Form Layouts v1.1 validator now fails packages when:

- a task form is missing a Submission form business field;
- a task field control lacks explicit readonly settings;
- an empty copied Approval form section remains in generated output.

The Dashboard Page Layouts v1.1 validator now fails packages when a generated Dashboard keeps an empty `section_content_area` or an unused repeatable section module.

Data List Form Layouts v1.1 already enforces the same generated cleanup behavior and remains part of the aggregate UI hard gates.

## Regression Coverage

Focused regression coverage includes:

- generated Approval form package with mirrored submission/task fields passing;
- task form missing a Submission form field failing;
- task form field without explicit readonly failing;
- generated Dashboard with empty `section_content_area` failing;
- full-app materializer output proving task forms include Submission fields plus task-only fields and keep task fields readonly.

## Safety

This training does not change plugin metadata, release docs, stable branches, package signing, live install/import, or runtime mutation behavior.
