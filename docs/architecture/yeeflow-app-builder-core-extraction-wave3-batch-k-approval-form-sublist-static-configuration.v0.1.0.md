# Core Extraction Wave 3 Batch K: Approval Form Sublist Static Configuration

`CORE_EXTRACTION_WAVE3_BATCH_K_APPROVAL_FORM_SUBLIST_STATIC_CONFIGURATION_PASSED`

Batch K accepts one narrow scalar projection: `approvalRowControlType` now routes through the existing `projectApprovalFormStaticConfiguration` facade with kind `sublist-row-control-type`.

The Core request receives only an already normalized scalar type and returns a frozen JSON-safe control type. It owns no Approval Form field, template, resource, Lookup target, identifier, runtime expression, action, or package state.

The raw Lookup type normalizer remains Host-owned. Phase 18B proves two Legacy Lookup shapes with different observable outcomes; a raw type string alone cannot distinguish them. Moving that function would widen the Core boundary or regress Phase 18B, so it is explicitly reclassified rather than inferred.

The four-case source, official archive, installed Plugin, and Approval Form layout-lowering corpus passed, together with serialization, deep immutability, determinism, temporary-copy Legacy rollback, and the retained Phase 18B source/archive/installed/materializer/rollback suite.
