# Approval Variable Resource-Scope Identity Focused Training

## Incident

The generated `Business Travel Request Approval (1).ywf` declared both the built-in variable `requestTitle` and a planned field variable `Request Title`. The strings are not literally equal, so the previous exact-match validator passed them. Yeeflow canonicalizes both identities to `requesttitle`; the Approval Form therefore contained a duplicate variable ID and could fail in Designer or runtime processing.

## Root Cause

- The field materializer treated Request Title as an ordinary planned variable instead of reusing the built-in `requestTitle`.
- `uniqueVariablesById()` compared raw strings only.
- `validate-ywf-def.js` checked exact duplicates only inside `variables.basic[]` and did not enforce one namespace across basic, temporary, and filter variables.
- Data List form and Dashboard dependency validation checked `filterVars[]` and `tempVars[]` separately, so cross-array canonical collisions could escape.

## Generation Contract

1. Variable IDs are unique within each Approval Form, Data List custom-form resource, or Dashboard page resource. Different resources may reuse IDs.
2. Comparison is literal and canonical. Canonical identity lowercases and removes spaces, punctuation, and system variable prefixes where applicable.
3. Approval `Applicant`, `ApplicantUserID`, and `requestTitle` are reserved built-ins. A Request Title business field reuses `requestTitle`.
4. Approval generation deduplicates planned and workflow-added variables canonically, preserving the first authoritative declaration.
5. Data List and Dashboard template dependencies must be namespaced and consumer references rewritten before merge.

## Hard Gates

- `DUPLICATE_VARIABLE_ID`
- `DUPLICATE_VARIABLE_ID_CANONICAL`
- `DUPLICATE_VARIABLE_IDX`
- `DUPLICATE_VARIABLE_IDX_CANONICAL`
- `PAGE_SCOPE_VARIABLE_ID_DUPLICATE`

The attached YWF is retained as incident evidence outside the repository. The focused validator now reports `Request Title` conflicting with `requestTitle` at `$.variables.basic[3]`. Positive generation regression requires exactly one canonical `requesttitle` declaration.
