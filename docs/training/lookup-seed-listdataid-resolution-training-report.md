# Lookup Seed ListDataID Resolution Training Report

## Source Feedback

Runtime validation of the Service Tickets app showed `Ticket Comments.Ticket` and `Ticket Attachments.Ticket` lookup values rendering as `(Deleted)`.

Forensic repair proved the lookup field definitions were correct:

- The lookup fields targeted the current application `ListSetID`.
- The target data source was the `Tickets` data list.
- The display field was `Title`.

The actual defect was in post-install seed writing. The seed writer wrote the target Ticket display title into the lookup field. Yeeflow lookup fields require the target record `ListDataID` as the stored value. A display title string cannot be resolved as the target record identity, so the UI renders `(Deleted)`.

## Required Generation Rule

Lookup fields have separate display and storage values.

Generated seed artifacts and live seed writers must treat lookup fields as target-record references:

1. Identify fields with `Type: "lookup"`.
2. Read lookup target metadata from field `Rules`: target `listid`, display field, and current application/list-set context.
3. Seed target/parent lists first.
4. Read back target rows and capture each target record `ListDataID`.
5. Seed dependent/child rows only after target row IDs are known.
6. Write the target record `ListDataID` into the lookup field.
7. Never write the target display title, number, code, or label as the lookup stored value.
8. Read back lookup fields and verify the stored value resolves to an existing target record.

## Seed Artifact Contract

For every generated lookup seed value, emit a structured placeholder instead of a plain string:

```json
{
  "seedValueType": "lookup",
  "value": null,
  "requiresLookupListDataIDResolution": true,
  "resolutionStrategy": "write-target-list-first-readback-listdataid-before-live-write",
  "storedValueField": "ListDataID",
  "targetListId": "<target data list id>",
  "targetListTitle": "<target data list title>",
  "displayField": "Title",
  "displayValueHint": "<human-readable target row hint>",
  "mustNotUseDisplayTextAsStoredValue": true
}
```

Also emit `fieldSeedRequirements[]` entries:

```json
{
  "fieldName": "Text2",
  "displayName": "Ticket",
  "controlType": "lookup",
  "requiresLookupListDataIDResolution": true,
  "targetListId": "<Tickets ListID>",
  "targetListTitle": "Tickets",
  "displayField": "Title",
  "storedValueField": "ListDataID",
  "mustNotUseDisplayTextAsStoredValue": true
}
```

## Validator / Regression Requirements

The Service Tickets regression must fail when:

- `Ticket Comments.Ticket` or `Ticket Attachments.Ticket` seed values are plain strings.
- Lookup seed values omit `requiresLookupListDataIDResolution`.
- Lookup seed values omit `storedValueField: "ListDataID"`.
- Lookup seed values omit the target list metadata.
- Seed proof only checks that lookup fields are non-empty instead of verifying target row existence.

## Proof Boundary

This training updates local generation, standards, skills, and regression tests only. It does not claim live seed execution, Version Management proof, browser runtime proof, or repair of already-installed applications.
