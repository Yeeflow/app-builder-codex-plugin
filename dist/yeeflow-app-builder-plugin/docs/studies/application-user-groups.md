# Yeeflow Application User Groups

## Scope

This study uses:

- `<downloads>/Tenant Service Portal v6.yap`

The export includes two application user groups named `User Group 1` and `User Group 2`.

## Export-Proven Location

Application user groups are stored in:

```text
Data.AppGroups[]
```

Export-proven group shape:

```json
{
  "ID": "<GROUP_ID>",
  "Name": "User Group 1",
  "Description": null
}
```

## ReplaceIds Behavior

v6 has two more `Resource.ReplaceIds[]` entries than v2-v5, matching the two `Data.AppGroups[]` IDs. This indicates generated app group IDs should be included in `ReplaceIds` for new `.yap` import packages.

## Member Structure

The v6 `.yap` export did not include group member lists, member IDs, emails, or user display values in `Data.AppGroups[]`.

Export-proven:

- group ID
- group name
- nullable description
- group IDs participate in `ReplaceIds`

Not export-proven:

- user/member storage location
- member ID field names
- member display/email fields
- group permission references
- user picker references to app groups
- whether group IDs are app-local after import or tenant-global after runtime materialization

## Redaction Policy

Generated or documented references must not include:

- tenant IDs
- real user IDs
- email addresses
- personal names
- credentials, tokens, secrets, or private identifiers

Use placeholders such as:

- `<GROUP_ID>`
- `<REDACTED_USER_ID>`
- `<REDACTED_USER_EMAIL>`
- `<REDACTED_TENANT_ID>`

## Generator Recommendations

- It is safe to generate empty application user groups using `Data.AppGroups[]` with fresh IDs, `Name`, and `Description`.
- Include generated group IDs in `Resource.ReplaceIds[]`.
- Do not generate member assignments until a member-bearing export is studied.
- Do not embed real users, emails, or tenant-local identities in generated packages.

## Validator Recommendations

- validate `Data.AppGroups[]` as an array.
- validate each group has `ID` and `Name`.
- warn if group IDs are not in `ReplaceIds`.
- hard-fail generated packages that embed email-like values in `AppGroups`.
- warn on any member/user-looking fields because member schema is not yet export-proven.

## Runtime-Test Limitation

Runtime import of placeholder user groups may be safe only if groups are empty. Any test involving members should stop until a safe, redacted member-bearing export proves the schema.
