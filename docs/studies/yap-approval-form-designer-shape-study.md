# YAP Approval Form Designer Shape Study

## Summary

The Research v0.6.11 export-shaped YAP smoke cycle showed that schema validation, API queue acceptance, async import completion, and basic form render are not enough for generated approval forms. The approval form designer also needs a designer-safe control tree with native rendered text metadata and unique designer-level control IDs.

This study uses redacted structural summaries only. It does not include raw `Resource`, raw `DefResource`, decoded payloads, private IDs, private URLs, tenant/workspace/user IDs, customer data, or raw API responses.

## Structural Comparison

| Area | Broken generated form | Working/reference form | Required generation rule |
|---|---|---|---|
| Control families | Early generated forms used a broader generated control set; unproven control families could leave designer blank or loading. | Repaired/reference forms used export-proven approval form controls such as container, section/section-column, heading, workflow panel/history, and other separately validated controls. | Use designer-safe export-proven controls only unless another family has focused proof. |
| `formdef.children` | Present in the export-shaped path, so schema/import shape alone was not the root cause. | Present and preserved. | Keep `formdef.children`; never fall back to thin `formdef.controls`. |
| Designer-level control `id` | Original/v2/v3 structures had controls with missing designer IDs; selecting one control could select many/all controls. | Manually edited export added unique IDs to containers and child controls. | Every generated control must have a unique designer-level `id` across the full tree. |
| Control ID references | Missing IDs made reference validation impossible and selection behavior unsafe. | Reference controls resolved against the same form tree. | Parent/child/control reference fields must resolve to generated control IDs. |
| Heading text | Original/v2 headings had labels but no native heading title metadata; designer rendered default placeholder text. | v3 and later populated native heading title values. | Heading controls must set `attrs.headc.title.value` and avoid `Here is the title`. |
| Labels vs native values | Label-only headings passed local checks but did not render intended text. | Labels and native rendered values matched. | Synchronize labels and native rendered text where both exist. |
| Child list metadata | Some generated-final repairs exposed missing or thin child list metadata, including `ListType`. | Export-shaped reference kept full child list metadata. | Preserve `ListType`, `WorkspaceID`, `TenantID`, `AppID`, `TableCode`, `IndexCode`, flags/status fields, audit fields, and `LayoutView`. |
| Layout metadata | Thin layout metadata could pass basic schema but remain materialization-risky. | Export-shaped reference kept default Type 0 view and full layout metadata. | Preserve export-style layout/view metadata and default view shape. |
| Approval DefResource metadata | Incomplete process metadata caused designer/workflow hydration risk. | Reference included process, graph, page, variable, and publish metadata. | Keep full approval DefResource metadata, graph metadata, and pageurls. |
| `NoRule` | Invalid or null `NoRule` appeared during repair cycles. | Reference used an export-shaped `NoRule` object. | `NoRule` must include a prefix with `{index}`, `StartIndex`, `CustomLength`, and `AutoIncrement`. |
| Publish/status | Unpublished form status is not designer-qualified output. | Reference used published form registration. | Generated-final approval forms default to `Status=1` and `Deployed=true` unless draft output is explicit. |
| App group IDs in `ReplaceIds` | One generated app group ID was initially missed. | Final repaired shape included generated app group IDs in `Resource.ReplaceIds`. | Rebuild `ReplaceIds` from the final decoded package and include app group IDs. |

## Root Causes

- The generated control tree was export-shaped enough to import, but not designer-safe enough to hydrate and edit.
- Heading controls used labels/display metadata without native rendered title values.
- Generated controls lacked unique designer IDs, causing selection-model collisions.
- Generated-final metadata checks did not hard-fail child `ListType`, approval `NoRule`, publish status, full DefResource metadata, and app group ReplaceIds coverage.

## Final Generation Rules

- Generate approval form content under `DefResource.pageurls[].formdef.children`.
- Use only designer-safe export-proven approval controls unless separately validated.
- Assign unique designer-level IDs to every generated control and preserve them through repairs.
- Populate `attrs.headc.title.value` for every heading and equivalent native value metadata for text controls.
- Reject default placeholder heading values such as `Here is the title`.
- Preserve full export-shaped list, layout, approval/process, workflow graph, and app-level metadata.
- Rebuild `Resource.ReplaceIds` from the final decoded package, including app group IDs.

## Validators And Tests Added

- `YAP_FORM_CONTROL_ID_MISSING`
- `YAP_FORM_CONTROL_ID_DUPLICATE`
- `YAP_FORM_CONTROL_ID_REFERENCE_INVALID`
- `YAP_FORM_DESIGNER_SELECTION_RISK`
- `YAP_HEADING_NATIVE_TITLE_MISSING`
- `YAP_HEADING_NATIVE_TITLE_PLACEHOLDER`
- `YAP_TEXT_NATIVE_VALUE_MISSING`
- `YAP_CONTROL_LABEL_NATIVE_TEXT_MISMATCH`
- `YAP_FORM_DESIGNER_UNPROVEN_CONTROL`
- `YAP_FORM_DESIGNER_HYDRATION_RISK`
- `YAP_CHILD_LISTTYPE_MISSING`
- `YAP_LIST_EXPORT_METADATA_INCOMPLETE`
- `YAP_LAYOUT_EXPORT_METADATA_INCOMPLETE`
- `YAP_NORULE_INVALID`
- `YAP_FORM_STATUS_NOT_PUBLISHED`
- `YAP_REPLACEIDS_APP_GROUP_ID_MISSING`

Regression coverage is in `scripts/test-yap-approval-form-designer-shape.mjs`.

## Proof Boundary

- API accepted/queued is not import proof.
- Import complete is not designer hydration proof.
- Designer opens is not selection/editing proof.
- Generated approval forms must prove intended text render and single-control selection before being called designer-qualified.
