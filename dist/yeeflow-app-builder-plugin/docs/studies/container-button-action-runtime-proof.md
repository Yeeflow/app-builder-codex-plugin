# Container/Button Action Runtime Proof

## Summary

This focused runtime proof validates a small generated package for representative Dashboard Container/Button action navigation. It builds on the export-learning from `AP Approval Demo v3.yap`, but uses a synthetic package instead of the source export.

- Branch: `codex/container-button-action-runtime-proof`
- Package: `container-button-action-runtime-proof.v1.yap`
- Downloads copy: `<downloads>/container-button-action-runtime-proof.v1.yap`
- App: `Container Button Action Runtime Proof`
- Dashboard: `Action Runtime Dashboard`
- Target dashboard: `Action Target Dashboard`
- Data list target: `Action Runtime Requests`
- Approval form target: `Action Runtime Approval`

## Generated Actions

The package contains representative Container/Button action settings:

| Action | Target | Open behavior | Proof result |
| --- | --- | --- | --- |
| Link | Safe `about:blank` URL | Default link behavior | User-confirmed package test passed |
| Add list item | `Action Runtime Requests` | Modal/pop-up | User-confirmed package test passed |
| Add list item | `Action Runtime Requests` | Slide-in | User-confirmed package test passed |
| Open dashboard | `Action Target Dashboard` | Full-page/target | User-confirmed package test passed |
| Open dashboard | `Action Target Dashboard` | Modal/pop-up | User-confirmed package test passed |
| Open approval form | `Action Runtime Approval` | Slide-in | User-confirmed package test passed |

The Open dashboard actions include concrete `PageID` values. Add list item and Open approval form actions reference included package resources rather than private links.

## Local Validation

The regenerated package passed local validation with zero errors:

- Container/Button action inspector: `pass`, 8 controls, 0 findings
- Package validator: `pass_with_warnings`, 0 errors
- Graph validator: `pass_with_warnings`, 0 errors
- Materialization inspector: `pass`, 0 errors, 0 warnings
- Aggregate import-readiness: `pass_with_warnings`, 0 errors
- Wrapper/package copies matched by SHA-256

Warnings were limited to existing runtime-sensitive schema/design-system cautions and optional inspector warnings, not unresolved action targets.

## Runtime Result

Manual Yeeflow testing was performed with the regenerated package. The user confirmed:

- the previous approval form publish issue was fixed
- the generated `.yap` worked
- the focused test passed

This proves representative import/open/navigation behavior for the generated package only. It does not prove every action variant or every business scenario.

## Approval Form `pageUrl` Fix

The first generated package exposed this publish error for the approval form target:

```text
process request pageUrl is null key:CBAR
```

The fixed package regenerated the approval form target with a complete request-page shape:

- `DefResource.pageurls[]` entry has outer `type = 1`
- `DefResource.pageurls[]` entry has outer `pagetype = 1`
- embedded `formdef.id` equals the page ID
- embedded `formdef.pagetype = 1`
- embedded `formdef.name` and `formdef.title` are populated
- embedded `formdef.filterVars` and `formdef.tempVars` are arrays
- Start node properties mirror the request page across `taskurl`, `taskUrl`, and `TaskUrl`

This is a generated-package readiness rule for approval forms opened from dashboard actions. The fix is user-confirmed for this package. Workflow execution, approval routing, and submission behavior remain out of scope.

## Import-Readiness Hardening

Aggregate import-readiness now treats the Pivot Table inspector's default missing `Dashboard` page finding as optional when the package is not a Pivot Table package. Container/Button action validation still runs and still fails generated-final packages with unresolved action targets.

This prevents unrelated packages from failing import-readiness solely because they do not have a literal dashboard named `Dashboard`, while preserving hard checks for Container/Button action targets.

## Not Observed

The successful manual test did not show:

- missing `PageID` or target ID errors
- missing action target errors
- approval form `pageUrl is null` publish error after regeneration
- dashboard render crash

## Proof Boundary

- AP Approval Demo v3 Container/Button action schema remains export-proven.
- This generated package is user-confirmed for representative import/open/navigation of Link, Add list item, Open dashboard, and Open approval form actions.
- Modal/pop-up, slide-in, and full-page/target behaviors are covered only as representative generated-package runtime proof.
- Save, submit, workflow execution, approval routing, data mutation, permissions, security behavior, cross-app targets, form-action binding, external sensitive navigation, and all open-mode/size combinations are not proven.
