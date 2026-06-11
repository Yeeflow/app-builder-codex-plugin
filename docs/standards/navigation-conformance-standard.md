# Navigation Conformance Standard

Version: Official v0.6.22

Navigation and information architecture are part of the generated product, not decoration. Generated navigation must preserve the approved app plan's user intent.

## Northpeak Lesson

The Northpeak plan defined grouped navigation under:

- Workspace: Projects, Resources, Collections, Reports, Requests
- Operations: Workflows, Approvals, Teams, Integrations
- Settings: Categories, Tags, Attributes, Permissions, Audit Log

The generated package stored navigation in root `LayoutView.sort`, but flattened every page/list into one sequence. Existing validators proved references were structurally valid, but did not prove the generated information architecture matched the approved plan.

This is a plan-conformance failure, not a low-level schema failure.

## Generation Rules

Generators must:

- preserve the planned navigation model before building `LayoutView.sort`
- avoid flattening all resources by default
- keep daily workspace pages separate from raw data lists and admin/reference lists
- keep operations resources separate from settings/admin resources
- include generated navigation coverage in the post-generation report

Before generating grouped Yeeflow navigation metadata, confirm the grouped `LayoutView` shape from export-proven references.

If grouped navigation shape is proven:

- generate groups and child items using the proven shape
- validate group titles and child items against the app plan

If grouped navigation shape is not proven:

- do not invent unsupported group metadata
- generate best-effort flat navigation ordered by planned groups only as an explicit fallback
- mark grouped navigation as `unsupported_unproven_export_shape`
- warn in default mode and fail in strict mode
- do not describe grouped navigation as fully implemented

## Validation

Navigation conformance must report:

- planned groups
- generated groups
- planned child items
- generated child items
- flat vs grouped status
- grouped LayoutView export-proof status
- items generated under the wrong group
- resources generated but missing from navigation
- extra navigation entries not in the approved plan
