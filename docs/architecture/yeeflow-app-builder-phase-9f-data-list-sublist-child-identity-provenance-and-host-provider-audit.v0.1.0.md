# Phase 9F Legacy Data List Sublist Child-Identity Provenance and Host-Provider Audit

## Decision

`SUBLIST_LEGACY_IDENTITY_PROVIDER_REJECTED`

No Legacy host-owned provider can supply the required Sublist child identities. Phase 9E remains correct: API allocation alone is insufficient, and this audit found no separate approved Legacy source.

## Source of Truth and Timing

| Required identity | Legacy source | Timing | Provider result |
| --- | --- | --- | --- |
| parentListId | buildIdPaths line 2682 | before buildResourceGraphPackage | valid-host-issued-parent-identity |
| parentFieldId | buildIdPaths line 2684 | before buildFieldRecord | valid-host-issued-parent-identity |
| childListId | none | never created or serialized | missing |
| childFieldId | none | never created or serialized | missing |
| rowSchemaId | dataListSubListVariables line 4845 | during buildFieldRecord for Rules and later again during form-control lowering, independently per consumer | internal-presentation-key-not-provider |

The only row identity-like value is `cleanResourceName(row.idx) || deterministicUuid(seed)` in `dataListSubListVariables`. It is generated independently after the two coupled consumers diverge: the form-control path uses `formName:FieldName`; the rules path uses `field-rules:fieldName`. It is therefore neither a shared value nor a validated child-resource identity.

## Required Product/API Handoff

Provide an explicit host-owned post-allocation inventory input with API-issued lossless child ListID, child FieldID, and row-schema identity for every parent-field/child-logical-field relationship, including parent, child, and row-schema scopes. The allocation request and response must exist before buildResourceGraphPackage lowers parent fields or custom forms.

## Phase 8E Status

Phase 8E remains blocked. It may be reconsidered only after a product/API provider exists and a separate host inventory integration proves one frozen descriptor selection is available to both coupled consumers before they diverge.

## Preserved Boundaries

No production materializer behavior, API allocation, adapter, public API, artifact, distribution, active installation, historical ZIP, protected duplicate, Git, or release state changed.
