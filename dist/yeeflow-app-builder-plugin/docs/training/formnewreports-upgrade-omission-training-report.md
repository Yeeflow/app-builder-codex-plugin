# FormNewReports Upgrade Omission Training Report

## Scope

This training covers a Dashboard/runtime-only upgrade failure where an unchanged installed Form report was carried in the upgrade payload and Yeeflow Version Management rejected the package with:

```text
Form report: Asset Loan Request Approval Report (is in application)
```

The failure was observed during an Office Asset Loan Management Dashboard runtime fix. The package was structurally valid and signed, but the live upgrade failed because `FormNewReports[]` still contained an already-installed report resource.

## Product Finding

For an upgrade of an existing application, an unchanged installed Form report in `FormNewReports[]` can be interpreted by the live materializer as a new report creation request. If that report already exists in the installed application, Version Management can fail with an "is in application" duplicate resource error.

The verified repair was to remove the unchanged installed `FormNewReports[]` entries from the Dashboard-only upgrade payload while preserving Forms, Data Lists, Dashboards, Navigation, root identity, and the target Dashboard changes. Version Management then reached `Succeed` and the Dashboard runtime smoke proof passed.

## Generator Rule

When building an upgrade package for a Dashboard/runtime-only fix:

- Preserve non-Dashboard resources that are required for app identity and runtime continuity.
- Do not blindly carry unchanged installed `FormNewReports[]` entries into the upgrade payload.
- If a Form report is not part of the declared upgrade scope and is already installed, omit it from `FormNewReports[]` in the upgrade payload to avoid duplicate live creation.
- If the upgrade intentionally creates or changes a Form report, the scope must explicitly include report changes and provide report new/update-safe proof.
- Never treat the omission of unchanged installed `FormNewReports[]` from a Dashboard-only upgrade payload as deletion of the installed report. Final preservation must still be proven by Version Management and runtime/resource proof for the exact upgraded app.

## Validator Rule

`validate-yapk-upgrade-scope.mjs` must distinguish these cases:

- Pass: Dashboard-only upgrade where previous package has installed `FormNewReports[]`, new package omits them with `FormNewReports: []`, and report changes are not in scope.
- Fail: Dashboard-only upgrade mutates `FormNewReports[]` contents.
- Fail: field-only/list-only upgrade includes `FormNewReports[]` unless report changes are explicitly in scope and update-safe proof is provided through the report-scope validator.

This keeps the duplicate-report install blocker covered without weakening out-of-scope report mutation gates.

## Proof Boundary

Local scope validation only proves that the package shape is compatible with the declared upgrade scope. It does not prove live upgrade success. The full proof chain remains:

1. Local package and scope validation.
2. Signing and `verifysign`.
3. `upgrade-check` and `upgrade-apply` submission.
4. Exact Version Management row reaches `Succeed`.
5. Runtime proof for the target Dashboard and resource-preservation proof for non-target resources.
