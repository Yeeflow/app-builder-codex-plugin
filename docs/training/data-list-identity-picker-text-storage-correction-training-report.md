# Data List Identity-Picker Text Storage Correction Training Report

## Scope

This training corrects the Service Tickets regression guidance that briefly treated user/person Data List fields as `FieldType: "User"` with `UserN` storage keys. That guidance was incorrect for the current generated-final YAPK contract.

## Correct Contract

Generated Data List fields must use the canonical storage field families accepted by the plugin schema:

- `Text`
- `Bit`
- `Decimal`
- `Datetime`

An identity/user/person picker is represented by the field control `Type`, not by a separate `FieldType`.

The correct generated shape is:

```json
{
  "FieldName": "Text4",
  "FieldType": "Text",
  "DisplayName": "Requester",
  "Type": "identity-picker",
  "Rules": {
    "multiple": false,
    "identity-maxselection": 1
  }
}
```

## Generator Requirements

1. Do not emit `FieldType: "User"` for generated Data List fields.
2. Do not emit package-local custom field keys such as `User1` or `User2`.
3. If an App Plan or legacy fixture uses `UserN` or `User` wording for requester/assignee/owner fields, preserve the identity-picker behavior but remap storage to the next safe `TextN` key.
4. Preserve `Type: "identity-picker"` and identity picker rules for user/person/requester/assignee/agent/owner semantics.
5. Runtime proof may verify that seeded identity-picker values resolve to existing tenant users, but runtime user-value proof does not change the package schema.

## Validator Requirements

1. Service Tickets regression fixtures must fail if generated Data List fields use `FieldType: "User"` or `FieldName` matching `UserN`.
2. Service Tickets regression fixtures must pass when planned user/person fields materialize as `FieldType: "Text"` plus `Type: "identity-picker"`.
3. Schema validation remains authoritative for allowed Data List `FieldType` values.

## Release Boundary

This correction supersedes any previous Service Tickets training language that asked the materializer to preserve native `UserN` storage fields. The durable rule is Text-backed identity-picker storage until a future export-proven Data List user-field storage contract is studied, added to schema, and guarded by a separate migration gate.
