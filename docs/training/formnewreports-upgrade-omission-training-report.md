# FormNewReports Upgrade Omission Training Report

## Scope

This training covers non-Report upgrades where an unchanged installed Form report was carried in the upgrade payload and Yeeflow Version Management rejected the package with an `is in application` duplicate-resource error. The rule was first proven on a Dashboard fix and later reproduced on an Approval form upgrade.

```text
Form report: Asset Loan Request Approval Report (is in application)
```

The failure was observed during an Office Asset Loan Management Dashboard runtime fix. The package was structurally valid and signed, but the live upgrade failed because `FormNewReports[]` still contained an already-installed report resource.

## Product Finding

For an upgrade of an existing application, an unchanged installed Form report in `FormNewReports[]` can be interpreted by the live materializer as a new report creation request. If that report already exists in the installed application, Version Management can fail with an "is in application" duplicate resource error.

The verified repair was to remove the unchanged installed `FormNewReports[]` entries from the Dashboard-only upgrade payload while preserving Forms, Data Lists, Dashboards, Navigation, root identity, and the target Dashboard changes. Version Management then reached `Succeed` and the Dashboard runtime smoke proof passed.

The Approval-upgrade regression was verified on Business Travel Request. The failed payload carried `Business Travel Request Report`; Version Management returned `Form report: Business Travel Request Report (is in application)`. The repaired payload retained the Approval `requestTitle` and seven Sub List column-title fixes, changed `FormNewReports` from one entry to zero, removed only that report's navigation payload item, preserved all existing IDs, passed scope/ID/schema/signature checks, and reached Version Management `Upgrade application -> Succeed`. Runtime proof showed the Approval form opened with all seven expected Sub List headers. Submission and approve/reject execution remained outside that proof.

## Generator Rule

When building any existing-application upgrade whose declared scope does not include Form report creation or modification:

- Preserve non-target resources that are required for app identity and runtime continuity.
- Do not blindly carry unchanged installed `FormNewReports[]` entries into the upgrade payload.
- If a Form report is not part of the declared upgrade scope and is already installed, omit it from `FormNewReports[]` in the upgrade payload to avoid duplicate live creation. This applies to Approval, Dashboard, Data List, workflow, navigation, and other non-Report upgrades.
- Remove only navigation payload items that resolve to the omitted installed Form reports. Any unrelated navigation drift remains an error.
- If the upgrade intentionally creates or changes a Form report, the scope must explicitly include report changes and provide report new/update-safe proof.
- Never treat the omission of unchanged installed `FormNewReports[]` from a non-Report upgrade payload as deletion of the installed report. Final preservation must still be proven by Version Management and runtime/resource proof for the exact upgraded app.

Use `scripts/materialize-yapk-focused-upgrade-scope.mjs` before signing a focused non-Report upgrade. It compares each candidate Form report with the previous installed package, omits only identity-matched and byte-equivalent report definitions, removes only matching report navigation payload items, clears the wrapper signature after mutation, and leaves new or changed reports in the candidate so scope validation can fail. Then run both upgrade scope validators on the materialized output.

## Validator Rule

`validate-yapk-upgrade-scope.mjs` must distinguish these cases:

- Pass: any non-Report upgrade where the previous package has installed `FormNewReports[]`, the upgrade payload omits them with `FormNewReports: []`, and report changes are not in scope.
- Fail: a non-Report upgrade that carries an unchanged installed Form report (`UPGRADE_UNCHANGED_INSTALLED_FORM_REPORT_INCLUDED`).
- Fail: a new or changed Form report remains in a non-Report upgrade (`UPGRADE_FORM_REPORT_OUT_OF_SCOPE`).
- Fail: any non-Report upgrade mutates or carries existing `FormNewReports[]` contents.
- Fail: field-only/list-only upgrade includes `FormNewReports[]` unless report changes are explicitly in scope and update-safe proof is provided through the report-scope validator.

This keeps the duplicate-report install blocker covered without weakening out-of-scope report mutation gates.

## Proof Boundary

Local scope validation only proves that the package shape is compatible with the declared upgrade scope. It does not prove live upgrade success. The full proof chain remains:

1. Local package and scope validation.
2. Signing and `verifysign`.
3. `upgrade-check` and `upgrade-apply` submission.
4. Exact Version Management row reaches `Succeed`.
5. Runtime proof for the target Dashboard and resource-preservation proof for non-target resources.
