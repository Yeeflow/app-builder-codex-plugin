# New Vendor Approval Field and Tenant Readiness Training Report

## Scope

This training covers the clean New Vendor Onboarding validation that stopped before signing because the generated package had `TenantID: "0"` and the Approval form did not materialize every planned field from the App Plan.

The training is limited to full-app materialization, Approval form field completeness, and live-install readiness metadata. It does not perform live signing, install/import, upgrade, Version Management proof, or browser runtime proof.

## Findings

The standalone full-app materializer previously truncated normalized Approval form fields. For longer Approval form field tables, planned fields after the internal cap were omitted from `Forms[].DefResource.pageurls[].formdef`. In the New Vendor Onboarding validation, this affected fields such as `Tax Number`, `Bank Name`, `Bank Account`, `Risk Self Assessment`, `Risk Explanation`, `Business License Attachment`, and `Bank Proof Attachment`.

This was a generator defect. The App Plan contained the fields, and the Approval form shell existed, but the decoded `DefResource` did not contain all planned business controls.

The same run also proved that wrapper `TenantID: "0"` remains a live-install readiness blocker. `TenantID` is tenant metadata rather than generated content ID provenance, but generated-final packages must still carry a real target tenant before signing readiness.

## Training Rules

- Approval form `Submission Form Fields` and `Task Form Fields` tables are generation inputs, not summaries.
- Materializers and helper builders must not cap, truncate, or silently drop planned Approval form fields.
- Every planned Approval submission/task field must appear in decoded `Forms[].DefResource.pageurls[].formdef`, unless the App Plan explicitly marks the field unsupported, deferred, or omitted for that exact form page.
- Task forms must continue to mirror submission fields as readonly review context unless a task-specific business rule says otherwise.
- Wrapper `TenantID` must be resolved from explicit generation input or safe Yeeflow environment metadata before signing readiness.
- If the materializer cannot resolve a real tenant, it may emit the package for local inspection, but live-install readiness must block `TenantID: "0"` before signing, install/import, or upgrade.

## Implementation

- Removed the Approval field cap in `uniqueApprovalFieldSpecs`.
- Added materializer TenantID fallback resolution from explicit `--tenant-id`, profile-scoped `YEEFLOW_<PROFILE>_TENANT_ID`, or `YEEFLOW_TENANT_ID`.
- Extended the full-app materialization regression fixture with long Approval submission fields and task-field parity checks.
- Added a materializer regression case proving `YEEFLOW_TENANT_ID` is used when `--tenant-id` is omitted.
- Updated Approval Form Layouts v1.1 and YAPK Live Install Readiness standards.
- Updated application-builder, application-generator, and approval-form-generator skills with the no-truncation and tenant-readiness rules.

## Validation

Focused regression validation covers:

- syntax checks for changed materializer and test scripts
- full-app materialization entrypoint gates
- Approval form fields template gates
- real New Vendor Onboarding package rematerialization with a concrete tenant ID
- Approval form field validation for the New Vendor package

The real New Vendor package then progressed past the Approval field completeness issue. A local full first-generation preflight still failed when the run intentionally omitted the previous business-specific application icon, which is outside this training scope.

## Proof Boundary

Passing these local gates means the generator no longer drops planned Approval fields and can resolve tenant metadata when it is available. It does not prove signing, install/import, Version Management final success, or runtime rendering.
