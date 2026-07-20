# Materializer Seam Audit v0.1.0

## Scope

This records the static Phase 4 seam audit, bounded Phase 4A Core shadow proof, Phase 4B distribution proof, Phase 4C normalizeHexColor production routing, Phase 4D defaultValueForFieldType production routing, Phase 4E escapeRegExp production routing, Phase 4F audit-only candidate selection, Phase 4G normalizeForLooseFormMatch production routing, Phase 4H stripPlanningDocumentSuffix production routing, and Phase 4I dependencyName production routing. It does not route any other materializer capability, host orchestration, package writing, ID allocation, archive behavior, target/projection validation, API behavior, or runtime behavior through Core.

## Analysis

- Source: `scripts/materialize-full-app-generated-final.mjs`
- Method: TypeScript AST top-level function inventory, local call graph, direct helper module scan, and conservative host-effect propagation.
- Audited top-level functions: 508
- Direct local helper modules: 22
- Classification counts: {"host-orchestration-only":38,"deterministic-core-candidate":291,"mixed-needs-boundary-adapter":91,"deferred-high-risk":88}
- Detected host-side-effect categories: {"archive-compression":4,"environment":2,"filesystem":35,"id-generation":28,"package-writing":1,"process":1}

## Strict Eligibility

A deterministic Core candidate must have no host effects, nondeterminism, mutable externally owned object mutation, or Legacy Markdown parser dependency. Its input/output contract must be JSON-serializable and bounded by focused parity evidence.

## First Proposed Vertical Slice

- Selected: `scripts/materialize-full-app-generated-final.mjs#normalizeHexColor`
- Rationale: Small pure normalization function with JSON-serializable input/output, no detected host effects, no mutable state dependency, no Legacy Markdown parser dependency, and low local caller count.

## Deferred High-Risk Functions

- `buildApprovalDefResource` (9936-10081): Conservative static audit defers this function because it has large or package/resource construction responsibility, externally owned object mutation.
- `analyzeAppPlanResourceDemand` (784-905): Conservative static audit defers this function because it has Legacy Markdown parser dependency.
- `collectApprovalWorkflowNodeSpecs` (2210-2314): Conservative static audit defers this function because it has Legacy Markdown parser dependency.
- `collectDashboardPageLayoutTemplateRecords` (1616-1708): Conservative static audit defers this function because it has Legacy Markdown parser dependency.
- `addApprovalWorkflowActionVariables` (10587-10668): Conservative static audit defers this function because it has externally owned object mutation.
- `buildLegacyMaterialDashboardResource` (8945-9023): Conservative static audit defers this function because it has large or package/resource construction responsibility.
- `collectFormActionSetDataListRecords` (1002-1069): Conservative static audit defers this function because it has Legacy Markdown parser dependency.
- `collectDataListFieldSpecs` (1874-1941): Conservative static audit defers this function because it has Legacy Markdown parser dependency.
- `materializePlannedFormActionOpenResources` (1263-1325): Conservative static audit defers this function because it has large or package/resource construction responsibility, externally owned object mutation.
- `collectCustomFormRecords` (1943-2005): Conservative static audit defers this function because it has Legacy Markdown parser dependency.
- `collectDashboardAnalyticsRecords` (1710-1770): Conservative static audit defers this function because it has Legacy Markdown parser dependency.
- `collectApprovalFormFieldSpecs` (2055-2115): Conservative static audit defers this function because it has Legacy Markdown parser dependency.
- `materializePlannedFormActionSetVariables` (1157-1214): Conservative static audit defers this function because it has large or package/resource construction responsibility, externally owned object mutation.
- `materializeMasterDetailWorkspaceCollections` (6156-6213): Conservative static audit defers this function because it has large or package/resource construction responsibility, externally owned object mutation.
- `collectFormActionSetVariableRecords` (945-1000): Conservative static audit defers this function because it has Legacy Markdown parser dependency.
- `collectPlannedChildResourceRecords` (670-723): Conservative static audit defers this function because it has Legacy Markdown parser dependency.
- `collectDocumentLibraryFolderRecords` (725-778): Conservative static audit defers this function because it has Legacy Markdown parser dependency.
- `materializePlannedFormActionPrintBarcode` (1327-1378): Conservative static audit defers this function because it has large or package/resource construction responsibility, externally owned object mutation.
- `collectWorkflowQueryDataConfigs` (2316-2367): Conservative static audit defers this function because it has Legacy Markdown parser dependency.
- `collectPlannedResourceNames` (2802-2851): Conservative static audit defers this function because it has Legacy Markdown parser dependency.

## Required Parity Contract

The selected slice requires exact Legacy/Core equality for this versioned fixture shape: `{"input":{"cases":[{"value":"#abcdef","expectedReturn":"#ABCDEF","expectedError":null},{"value":" #12aBcD ","expectedReturn":"#12ABCD","expectedError":null},{"value":"#12345","expectedReturn":"","expectedError":null},{"value":"invalid","expectedReturn":"","expectedError":null},{"value":"","expectedReturn":"","expectedError":null},{"value":null,"expectedReturn":"","expectedError":null}]},"expected":"Uppercase six-digit hex color or empty string; no thrown error; primitive input remains unchanged."}`. It must assert normalized return values, error behavior, and input immutability before any production adoption.
## Phase 4A, 4B, and 4C Evidence

- Legacy function: `scripts/materialize-full-app-generated-final.mjs#normalizeHexColor`
- Core source function: `packages/app-builder-core-materializer/src/index.ts#normalizeHexColor`
- Compiled Core function: `packages/app-builder-core-materializer/lib/index.js#normalizeHexColor`
- Differential corpus: `compatibility/differential-fixtures/materializer-normalize-hex-color.v0.1.0.json` (13 cases)
- Shadow evidence: MATERIALIZER_NORMALIZE_HEX_CORE_SHADOW_IMPLEMENTED, MATERIALIZER_NORMALIZE_HEX_DIFFERENTIAL_PARITY_PASSED, MATERIALIZER_NORMALIZE_HEX_IMMUTABILITY_PASSED
- Public API: `compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json`
- Distribution proof: {"status":"official-distribution-proof-passed","artifactPath":"core/yeeflow-app-builder-core-materializer.v0.1.0.mjs","artifactSha256":"352df5599c617cfce4be7d3319cf69e7c63067ebe54ec9747d762159e06207a7","exports":["capabilityMetadata","normalizeHexColor","defaultValueForFieldType","escapeRegExp","normalizeForLooseFormMatch","stripPlanningDocumentSuffix","dependencyName","safeDependencyIdentifier","projectDataListScalarField","projectFixedFilterIntents","projectDataListDefaultViewLayout","projectDataListDefaultViewSelector","projectDataListAdditionalViewLayout","projectDataListScalarResourceDefinitionIntent","projectDataListLookupResolutionIntent","projectDataListType1IdentityControlPlacement","projectDataListSublistScalarRowSchema","projectDataListEmbeddedSublistDescriptor","projectDataListSublistStaticConfiguration","projectDataListSublistScalarSummaryIntent","projectDataListSublistDynamicSummaryIntent","projectDataListSublistNestedControlPlacementIntent","projectDataListSublistEmbeddedLookupIntent","projectDataListSublistLookupAdditionalFieldIntent","projectDataListSublistIdentityControlIntent","projectApprovalFormSubListLookupStaticConfiguration","projectTemplateStaticNormalization","projectResourceDefinitionStaticIntent","projectDocumentLibraryStaticConfiguration","projectApprovalFormStaticConfiguration","projectDashboardStaticConfiguration"]}
- Production routing: {"status":"phase-4c-routed-to-distributed-core","adapterPath":"scripts/lib/materializer-core-adapter.mjs","preCutoverLegacyCallCount":4,"postCutoverCoreCallCount":4,"postCutoverLegacyCallCount":0,"legacyHelperRetained":true,"rollback":"In a temporary full Plugin copy, remove the normalizeHexColor adapter binding and replace each coreNormalizeHexColor call with normalizeHexColor while retaining the artifact for independently routed defaultValueForFieldType."}
- Compatibility-adapter cutover: {"status":"phase-4c-routed-to-distributed-core","adapterPath":"scripts/lib/materializer-core-adapter.mjs","preCutoverLegacyCallCount":4,"postCutoverCoreCallCount":4,"postCutoverLegacyCallCount":0,"legacyHelperRetained":true,"rollback":"In a temporary full Plugin copy, remove the normalizeHexColor adapter binding and replace each coreNormalizeHexColor call with normalizeHexColor while retaining the artifact for independently routed defaultValueForFieldType."}

### Exact Legacy Behavior

- Accepted input rule: String(value || "").trim() must match exactly /^#[0-9a-f]{6}$/i.
- Trimming: Leading and trailing whitespace is removed before matching.
- Case normalization: A matching color is returned in uppercase.
- Malformed input: Any non-matching value returns an empty string.
- Null-like input: null, omitted input, 0, false, and empty string become an empty string through value || "".
- JSON coercion edge case: A truthy single-element array can stringify to a valid hex color; ordinary objects stringify to non-hex text.
- Return type: string
- Thrown-error behavior: No thrown error for the versioned JSON corpus.
- Mutation behavior: Does not mutate the supplied value.

## Phase 4D defaultValueForFieldType Evidence

- Legacy function: `scripts/materialize-full-app-generated-final.mjs#defaultValueForFieldType`
- Core source function: `packages/app-builder-core-materializer/src/index.ts#defaultValueForFieldType`
- Differential corpus: `compatibility/differential-fixtures/materializer-default-value-for-field-type.v0.1.0.json` (15 cases)
- Audit result: one buildFieldRecord call site; no helper dependencies, mutable state, host effects, nondeterminism, or external mutation.
- Legacy behavior: Only the primitive string "Bit" is accepted through strict equality. Every value other than exactly "Bit" returns an empty string.
- Routing and rollback: {"status":"phase-4d-routed-to-distributed-core","adapterPath":"scripts/lib/materializer-core-adapter.mjs","preCutoverLegacyCallCount":1,"postCutoverCoreCallCount":1,"postCutoverLegacyCallCount":0,"legacyHelperRetained":true,"rollback":"In a temporary full Plugin copy, remove the defaultValueForFieldType adapter binding and replace the coreDefaultValueForFieldType call with defaultValueForFieldType while retaining the artifact for independently routed normalizeHexColor."}

## Phase 4E escapeRegExp Evidence

- Legacy function: `scripts/materialize-full-app-generated-final.mjs#escapeRegExp`
- Core source function: `packages/app-builder-core-materializer/src/index.ts#escapeRegExp`
- Differential corpus: `compatibility/differential-fixtures/materializer-escape-regexp.v0.1.0.json` (13 cases)
- Pre-cutover audit result: one extractNamedSection call site; no helper dependencies, mutable state, host effects, nondeterminism, or external mutation.
- Post-cutover ledger result: zero Legacy helper callers and one Core alias call, recorded by routing evidence.
- Legacy behavior: String(value || "") is used without trimming. The function escapes only . * + ? ^ $ { } ( ) | [ ] and backslash; other characters remain unchanged.
- Routing and rollback: {"status":"phase-4e-routed-to-distributed-core","adapterPath":"scripts/lib/materializer-core-adapter.mjs","preCutoverLegacyCallCount":1,"postCutoverCoreCallCount":1,"postCutoverLegacyCallCount":0,"legacyHelperRetained":true,"rollback":"In a temporary full Plugin copy, remove the escapeRegExp adapter binding and replace the coreEscapeRegExp call with escapeRegExp while retaining the artifact for independently routed normalizeHexColor and defaultValueForFieldType."}

## Phase 4G normalizeForLooseFormMatch Evidence

- Legacy function: `scripts/materialize-full-app-generated-final.mjs#normalizeForLooseFormMatch`
- Core source function: `packages/app-builder-core-materializer/src/index.ts#normalizeForLooseFormMatch`
- Differential corpus: `compatibility/differential-fixtures/materializer-normalize-loose-form-match.v0.1.0.json` (15 cases)
- Pre-cutover audit result: three reverseRelatedRecordMatchesForm call expressions; no helper dependencies, mutable state, host effects, nondeterminism, or external mutation.
- Post-cutover ledger result: zero Legacy helper callers and three Core alias calls, recorded by routing evidence.
- Legacy behavior: String(value || "") is used without trimming before normalization. Every non-ASCII-alphanumeric run becomes one space; no input is rejected for the versioned JSON corpus.
- Routing and rollback: {"status":"phase-4g-routed-to-distributed-core","adapterPath":"scripts/lib/materializer-core-adapter.mjs","preCutoverLegacyCallCount":3,"postCutoverCoreCallCount":3,"postCutoverLegacyCallCount":0,"legacyHelperRetained":true,"rollback":"In a temporary full Plugin copy, remove the normalizeForLooseFormMatch adapter binding and replace the three coreNormalizeForLooseFormMatch calls with normalizeForLooseFormMatch while retaining the artifact for independently routed normalizeHexColor, defaultValueForFieldType, and escapeRegExp."}

## Phase 4H stripPlanningDocumentSuffix Evidence

- Legacy function: `scripts/materialize-full-app-generated-final.mjs#stripPlanningDocumentSuffix`
- Core source function: `packages/app-builder-core-materializer/src/index.ts#stripPlanningDocumentSuffix`
- Differential corpus: `compatibility/differential-fixtures/materializer-strip-planning-document-suffix.v0.1.0.json` (19 cases)
- Pre-cutover audit result: three extractTitle and extractApplicationName call expressions; no helper dependencies, mutable state, host effects, nondeterminism, or external mutation.
- Post-cutover ledger result: zero Legacy helper callers and three Core alias calls, recorded by routing evidence.
- Legacy behavior: String(value || "") is used without pre-trimming. A terminal Yeeflow App Plan suffix preceded by whitespace is removed; a whitespace-surrounded hyphen, en dash, or em dash is removed with it, while another delimiter is retained.
- Routing and rollback: {"status":"phase-4h-routed-to-distributed-core","adapterPath":"scripts/lib/materializer-core-adapter.mjs","preCutoverLegacyCallCount":3,"postCutoverCoreCallCount":3,"postCutoverLegacyCallCount":0,"legacyHelperRetained":true,"rollback":"In a temporary full Plugin copy, remove the stripPlanningDocumentSuffix adapter binding and replace the three coreStripPlanningDocumentSuffix calls with stripPlanningDocumentSuffix while retaining the artifact for independently routed normalizeHexColor, defaultValueForFieldType, escapeRegExp, and normalizeForLooseFormMatch."}

## Phase 4I dependencyName Evidence

- Legacy function: `scripts/materialize-full-app-generated-final.mjs#dependencyName`
- Core source function: `packages/app-builder-core-materializer/src/index.ts#dependencyName`
- Differential corpus: `compatibility/differential-fixtures/materializer-dependency-name.v0.1.0.json` (18 cases)
- Pre-cutover audit result: four buildTemplateDependencyNameMaps call expressions; no helper dependencies, mutable state, host effects, nondeterminism, or external mutation.
- Post-cutover ledger result: zero Legacy helper callers and four Core alias calls, recorded by routing evidence.
- Legacy behavior: Properties name, key, id, and ID are read in strict truthy precedence order before String conversion. Missing or falsy properties fall through; a truthy whitespace-only property blocks fallback and trims to an empty string.
- Routing and rollback: {"status":"phase-4i-routed-to-distributed-core","adapterPath":"scripts/lib/materializer-core-adapter.mjs","preCutoverLegacyCallCount":4,"postCutoverCoreCallCount":4,"postCutoverLegacyCallCount":0,"legacyHelperRetained":true,"rollback":"In a temporary full Plugin copy, remove the dependencyName adapter binding and replace the four coreDependencyName calls with dependencyName while retaining the artifact for independently routed normalizeHexColor, defaultValueForFieldType, escapeRegExp, normalizeForLooseFormMatch, and stripPlanningDocumentSuffix."}

## Phase 4F Candidate-Selection Audit

NO_SAFE_MATERIALIZER_PHASE_4F_SLICE_SELECTED

## Boundaries Preserved

- The Legacy normalizeHexColor, defaultValueForFieldType, escapeRegExp, normalizeForLooseFormMatch, stripPlanningDocumentSuffix, and dependencyName helpers remain intact as explicit rollback baselines.
- `scripts/materialize-yapk-focused-upgrade-scope.mjs` remains unchanged.
- Phase 4I routes only dependencyName; no other seam or host behavior changes.
