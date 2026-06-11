# Vendor Onboarding v4.1 Known Issues

## Lookup Picker Records Not Returned

Status: product-team follow-up required.

In the Vendor Onboarding v4.1 upgrade packages, Vendor lookup fields can be configured with selected display fields and valid lookup metadata, but the runtime lookup picker can still return no records for the generated Vendors target list in Add/Edit forms.

Observed behavior:

- Related lists include Vendor lookup fields that target the Vendors list.
- The lookup fields include selected display fields, normally Vendor Name and Vendor Code.
- The Vendors list includes sample records and renders in its own list view.
- In Add/Edit lookup picker runtime, the lookup query may still return zero rows.

Current package boundary:

- Keep lookup display-field metadata configured for every lookup field.
- Treat missing lookup display fields, unresolved lookup display fields, and `Text0` lookup display references as generated-final validation errors.
- Keep data-list views configured with visible display columns.
- Do not continue changing lookup target fields as a workaround until the product team advises which generated-list metadata controls lookup search/query materialization.

Next product-team question:

- Which list, field, view, or lookup metadata does the runtime lookup picker use to decide whether a generated package list is queryable as a lookup target?
