# Approval ContentList Target Application Selection Training Report

## Summary

New Vendor Onboarding validation for plugin `0.8.76` found that the generated multi-node Approval workflow now preserved planned review and system-action nodes, but the `Create Vendor Master` `ContentList` node did not fully bind to the intended Data List target.

The first defect was that the workflow action selected the root application ListSet as the Data source instead of the `Vendor Master` child Data List. After fixing the target Data List, the Designer still showed the Application selector as `Uncategorized` because the generated action kept `listtype = "current"`.

The export-proven generated-final shape for a `ContentList` action that creates or updates a child Data List in the current application is:

- `listtype = "select"`
- `appid = 41`
- `listsetid = <current application ListSetID>`
- `listid = <target child Data List ID>`

Using the root ListSet as `listid`, omitting the target child list, or using `listtype = "current"` is not signing-ready.

## Evidence

Source reports:

- `/Users/rengerhu/Documents/Plugin Test2/new-vendor-onboarding-20260628-121132-plugin-0.8.76-e2e/validation/run-summary.md`
- `/Users/rengerhu/Documents/Plugin Test2/new-vendor-onboarding-20260628-121132-plugin-0.8.76-e2e/validation/install-and-runtime-validation-report.md`
- `/Users/rengerhu/Documents/Plugin Test2/new-vendor-onboarding-20260628-121132-plugin-0.8.76-e2e/validation/contentlist-vendor-master-datasource-inspection.after-fix.json`
- `/Users/rengerhu/Documents/Plugin Test2/new-vendor-onboarding-20260628-121132-plugin-0.8.76-e2e/validation/contentlist-datasource-regeneration-code-fix-proof.json`
- `/Users/rengerhu/Documents/Plugin Test2/new-vendor-onboarding-20260628-121132-plugin-0.8.76-e2e/validation/contentlist-application-selection-inspection.after-fix.json`
- `/Users/rengerhu/Documents/Plugin Test2/new-vendor-onboarding-20260628-121132-plugin-0.8.76-e2e/validation/contentlist-application-selection-regeneration-code-fix-proof.json`

## Generator Rule

The full-app materializer must preserve the App Plan `Approval Workflow Nodes` table and must parse the `Data Read/Write` column for `ContentList` action nodes. When the text names or implies a child Data List, such as `Vendor Master create`, the generator must resolve that target to the generated child Data List metadata and write the export-shaped target selection into the workflow node properties.

The generator must not default a `ContentList` write node to the root application ListSet. The generator must not leave child-list writes as `listtype = "current"` when it has resolved a target child list.

## Validator Rule

`validate-approval-workflow-publish-readiness.mjs` now validates `ContentList` target selection as part of signing readiness:

- `APPROVAL_WORKFLOW_CONTENTLIST_TARGET_LIST_MISSING`
- `APPROVAL_WORKFLOW_CONTENTLIST_TARGET_ROOT_LISTSET`
- `APPROVAL_WORKFLOW_CONTENTLIST_TARGET_LIST_UNKNOWN`
- `APPROVAL_WORKFLOW_CONTENTLIST_APPLICATION_SELECTION_INVALID`
- `APPROVAL_WORKFLOW_CONTENTLIST_APPID_INVALID`
- `APPROVAL_WORKFLOW_CONTENTLIST_LISTSETID_INVALID`

These checks run before signing, install, upgrade, Version Management handoff, and browser runtime proof. A local schema pass or workflow-node parity pass is not enough if the system write action still points at the wrong application/list target.

## Regression Coverage

Focused regression coverage now asserts that a planned `ContentList` node:

- materializes as a named workflow node,
- targets the planned child Data List,
- does not use the root application ListSet as `listid`,
- uses `listtype = "select"`,
- uses `appid = 41`,
- uses the current application ListSet ID as `listsetid`,
- fails when mutated back to the root ListSet target,
- fails when mutated back to `listtype = "current"`.

## Proof Boundary

This training proves local generated-final materialization and validator coverage. It does not claim that a live tenant workflow has been published or executed. Live proof still requires package signing, install or upgrade, Version Management final `Succeed`, Designer/open evidence, workflow publish evidence, and a runtime request that exercises the `ContentList` action.
