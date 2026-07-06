# Approval YWF And YAPK Shared Layout Builder Training Report

## Purpose

Standalone `.ywf` approval form generation and full application `.yapk` approval form materialization must use the same approval page layout implementation. This prevents the standalone YWF path from drifting away from the Approval Form Layouts v1.1 golden reference while packaged applications continue to use the standard template.

## Root Cause

The full application materializer already used the Approval Form Layouts v1.1 submission and task templates, but standalone `.ywf` validation focused on workflow/form structural safety: `Main > Content > Form body/Form bottom`, string bindings, `datepicker`, numeric width shape, and workflow outcome condition shape. That allowed standalone `.ywf` output to pass its own gates while not proving the same golden-reference page layout used inside full `.yapk` generation.

## Training Rules

- Standalone `.ywf` generation and packaged `.yapk` approval form generation must share one layout builder.
- The shared builder must clone the approved Approval Form Layouts v1.1 submission/task templates and materialize business fields into those templates.
- Task forms must apply runtime-effective readonly flags to submission fields unless the App Plan explicitly requires editable task fields.
- Empty template sections, including empty `section_content_area` under `page_title_section`, must be removed in both standalone and packaged paths.
- Source-template residue must be scrubbed from generated approval pages in both paths.
- Future approval layout fixes must be made in the shared builder, not separately in standalone YWF scripts and full-app materializers.

## Implementation Contract

The shared implementation lives in:

- `scripts/lib/approval-form-layout-builder.mjs`

The full application materializer uses the shared builder instead of maintaining its own inline approval layout mapper:

- `scripts/materialize-full-app-generated-final.mjs`

The standalone YWF regression gate now proves the same layout contract by creating sample standalone submission/task pages from the shared builder and validating them with the Approval Form Layouts v1.1 validator:

- `scripts/test-approval-ywf-form-structure-gates.mjs`

## Required Regression Proof

Run these gates after changing approval form generation:

```bash
node scripts/test-approval-ywf-form-structure-gates.mjs
node scripts/test-approval-form-layout-template-gates.mjs
node scripts/test-approval-form-fields-template-gates.mjs
```

The standalone YWF gate must include the case:

```text
pass: standalone .ywf approval pages use Approval Form Layouts v1.1
```

## Proof Boundary

This training unifies approval form page layout generation across standalone `.ywf` and full `.yapk` paths. It does not by itself prove workflow graph layout, tenant-specific Job Position mappings, signing, install, workflow publish, or browser runtime execution.
