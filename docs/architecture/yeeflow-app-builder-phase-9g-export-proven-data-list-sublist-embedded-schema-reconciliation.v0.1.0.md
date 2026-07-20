# Phase 9G Export-Proven Data List Sublist Embedded Schema Reconciliation

## Decision

`DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_CONTRACT_VALID`

A Data List Sublist is an embedded schema of one parent field. The only product resource identities are the parent ListID and parent FieldID. Child columns are not child Data Lists or independently allocated product resources.

## Lossless Export Evidence

The user-supplied product export was decoded as UTF-8 strings through the wrapper, gzip/base64 Resource, decoded resource, and Data payload. Unquoted 16+ digit JSON integers were quoted before parsing so product identities remained strings.

| Evidence | Value |
| --- | --- |
| Wrapper SHA-256 | `458141e4277ed9c0de319f25d07855f1fdcef6a8d0a2421f4d6a48b541dc524f` |
| Decoded resource SHA-256 | `18bed353515c038b7e1e940c0304b1bf91be87db8f8fd4bedb2eec321d85c4be` |
| Parent ListID | `2076284286981328899` |
| Parent FieldID | `2076527673738014720` |
| Parent field | `Leave details` / `Text7` |
| Parent field shape | `Text` / `list` |
| Embedded columns | 2 |

The parent Rules string contains `list-variables`. The custom-form Sublist control binds `Text7` and its `list-fields` metadata equals the Rules schema. The export contains no `childListId`, `childFieldId`, or `rowSchemaId` key.

## Embedded Descriptor Contract

| Descriptor element | Meaning | Product resource identity |
| --- | --- | --- |
| `parentListId` | Parent Data List | Yes |
| `parentFieldId` | Parent Sublist field | Yes |
| `list-variables[].id` | Logical embedded column key | No |
| `list-variables[].idx` | Export row-shape and presentation descriptor | No |
| `list-variables[].name/type/editable` | Embedded column semantics | No |

Rules and custom-form schema lowerings must receive the same frozen descriptor. Custom-form visual control IDs, control types, summaries, templates, graph mutation, and package integration remain host-owned.

## Supersession

`DATA_LIST_SUBLIST_CHILD_IDENTITY_PREMISE_SUPERSEDED`

Phase 9F remains historically correct that Legacy lacks a child-resource identity provider. The requirement for such a provider is superseded because this product export proves no child product resource exists. Historical Phase 8A–E and 9A–F artifacts are retained and explicitly marked superseded for that premise only.

## Phase 8E Reassessment

The child-identity routing blocker is removed as a premise, but production routing is not approved. The remaining real prerequisite is a separately authorized audit proving a single frozen embedded descriptor is selected before the Rules and custom-form consumers diverge, with all template and presentation boundaries retained.

## Preserved Boundaries

No production materializer route, API allocation, adapter, public API, dist artifact, active installation, historical ZIP, protected duplicate, Git, release, or stable state changed.
