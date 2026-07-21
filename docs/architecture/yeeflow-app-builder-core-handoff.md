# Yeeflow App Builder Core Architecture Handoff

## Purpose

This document is the authoritative handoff for restructuring the current Yeeflow App Builder Codex Plugin into a host-neutral deterministic core plus a Codex-specific adapter.

The architecture name is **Yeeflow App Builder Core**.

The Core will first be incubated as logically independent packages inside the current Plugin repository. After contract, parity, package, install-smoke, and runtime-proof acceptance, the Core packages may be extracted to an independent repository and later exposed through a Service Runtime.

This handoff intentionally does not reuse or depend on the Shared Core implementation under `/Users/rengerhu/Documents/Yeeflow AI App Builder`. That project may be compared later, but it is not an implementation source for this migration.

Reference architecture discussion:

- <https://chatgpt.com/share/6a5a1125-f6c4-83ec-8fba-4caeb6c2290b>

## Verified Baseline

Verified on 2026-07-17:

- Repository: `/Users/rengerhu/Documents/App Builder Codex Plugin 2`
- Git commit: `fcc8b8e16b784f1032759ee1b6b588a144497feb`
- Git subject: `Merge pull request #483 from Yeeflow/codex/yeeflow-app-builder-plugin-v0.9.71-install-smoke`
- Git tag at HEAD: `yeeflow-app-builder-plugin-v0.9.71`
- Source release: `0.9.71`
- Installed active Plugin observed before this handoff: `yeeflow-app-builder 0.9.71`

The repository contains pre-existing untracked duplicate files with names ending in ` 2` under `dist/yeeflow-app-builder-plugin`. They are not part of this handoff and must not be deleted, staged, renamed, or included in migration commits without a separate, explicit repository-hygiene decision.

## 2026-07-21 Execution Service Incubation Amendment

This amendment is the current architecture authority for cross-host execution and supersedes any earlier wording that places host ports, model invocation, credentials, transport, or execution context in a Core package. The release and installed-version facts above are historical baseline facts; they were not reverified or advanced by this incubation.

The Core packages are reusable deterministic packages inside this monorepo. They are not yet an independently deployed service or an independently versioned repository. The current incubation adds an in-process, host-neutral execution boundary without creating an external repository:

```text
Host UI or agent
  -> host adapter plus host-owned model adapter
  -> @yeeflow/app-builder-execution-contracts
  -> @yeeflow/app-builder-execution-service
  -> canonical domain intent
  -> deterministic @yeeflow/app-builder-core facade
  -> optional host runtime adapter outside Core
```

The execution protocol uses open, versioned capability descriptors. Host names are not an enum and origin is optional observability only. A future caller is added by implementing an adapter against the protocol; Core behavior must not branch on caller identity.

Model and provider selection is owned entirely by the host. `ModelInvocationPort`, `ExecutionContext`, `CapabilityProfile`, authority declarations, opaque model profile references, and all adapter behavior belong to the separate execution-contracts or adapter packages. No existing `@yeeflow/app-builder-core*` package may import the execution contracts, runtime, adapters, host libraries, or provider libraries. The execution service maps accepted structured intent field by field into a canonical Core DTO, so context, authority, origin, model profile references, and unknown fields cannot enter Core input.

The service is intentionally in-process. Network protocols, queues, persistence, retries, deployment, and live provider integration remain future concerns outside Core. The incubation proves deterministic fake-model behavior and package parity only; it does not claim live provider, Web deployment, tenant, installation, or runtime proof.

The earlier `Required Ports` examples are not approved Core contracts for this incubation. Any future credential, artifact storage, confirmation, event, clock, logging, or runtime-probe interface must remain in a non-Core runtime or adapter package unless it is reduced to a domain-pure deterministic DTO with no host concern.

## Architecture Decisions

### 1. One Core, multiple hosts

Yeeflow App Builder Core is deterministic and host-neutral. Codex, WorkBuddy, Web, and future Yeeflow built-in experiences may use the same Core through separate adapters.

```text
Codex Plugin -> Codex Adapter -> Local Runtime -> Yeeflow App Builder Core
Web / Built-in -> Service Runtime -> Yeeflow App Builder Core
```

The Local Runtime and Service Runtime must consume the same versioned Core packages. They must not maintain separate implementations of planning, validation, materialization, package generation, or repair rules.

### 2. One primary agent controller

The Core must never start a model or hidden agent. The host owns the agent loop and model selection. A task has one primary agent controller.

### 3. Deterministic Core boundary

Code belongs in Core when all of the following are true:

- Equal structured input produces equal structured output.
- It does not read host environment variables directly.
- It does not read or persist OAuth tokens or browser sessions.
- It does not invoke Codex tools, Git, terminal commands, or browser automation.
- It does not call an AI model.
- It accepts structured values through public contracts.
- It returns structured values, stable error codes, and evidence metadata.

### 4. Adapter boundary

The Codex Plugin Adapter owns:

- Skills, prompts, agents, and Codex-specific instructions.
- Terminal, filesystem, Git, branch, PR, release, and stable-promotion workflows.
- OAuth login, refresh, local credential discovery, and workspace-selection UX.
- User confirmation and approval behavior.
- Browser automation and runtime-proof capture.
- Plugin metadata, marketplace packaging, and installation smoke tests.
- Compatibility CLI argument parsing, filesystem loading, report writing, and exit codes.

### 5. No source duplication

During incubation, Core packages live once under `packages/`. Plugin distribution consumes a built Local Runtime artifact. Source files must not be copied into both Core and adapter trees.

Legacy script paths may remain as thin compatibility shims until migration parity closes.

### 6. English-only repository and generated artifacts

The user may communicate with Codex in Chinese or English. Codex may answer the user in the language appropriate to the conversation, but all repository and generated artifact content must be English.

This requirement applies to all new or modified:

- File and directory names.
- Source code, identifiers, and code comments.
- Markdown and other documentation.
- Configuration and metadata.
- Skills, prompts, and agent instructions stored in the Plugin.
- Test names, fixtures, assertions, snapshots, and reports.
- CLI output, logs, warnings, validation findings, and error messages.
- Error codes and structured result fields.
- Golden Reference templates and normalized knowledge assets.
- Generated Yeeflow resource names, labels, descriptions, navigation, forms, pages, workflows, and package metadata.
- Commit messages, pull-request content, release notes, and migration reports produced for this work.

Do not place Chinese explanatory text in repository files as a convenience for the current conversation. Explain the same information to the user in Chinese through the chat while keeping persisted artifacts in English.

Phase 0 must add an English-only validation gate for changed text files. The gate must detect CJK characters in migration-owned changes and fail with a stable English error code and English finding. Any evidence-backed exception must be explicit, narrowly scoped, reviewed, and recorded in an allowlist with a reason; broad directory exemptions are prohibited.

## Target Repository Structure

```text
app-builder-codex-plugin/
|-- package.json
|-- pnpm-workspace.yaml
|-- tsconfig.base.json
|-- packages/
|   |-- app-builder-core-contracts/
|   |-- app-builder-core-canonical-model/
|   |-- app-builder-core-planning/
|   |-- app-builder-core-templates/
|   |-- app-builder-core-validators/
|   |-- app-builder-core-materializer/
|   |-- app-builder-core-package-engine/
|   |-- app-builder-core-repair-engine/
|   |-- app-builder-core-runtime-client/
|   `-- app-builder-core/
|-- runtimes/
|   `-- app-builder-core-local-runtime/
|-- adapters/
|   `-- codex-plugin-adapter/
|-- compatibility/
|   |-- plugin-baselines/
|   |-- capability-manifests/
|   `-- differential-fixtures/
|-- scripts/
|   `-- legacy-compatibility-shims/
|-- skills/
`-- dist/
```

The product-facing facade package is:

```text
@yeeflow/app-builder-core
```

Suggested internal package names:

```text
@yeeflow/app-builder-core-contracts
@yeeflow/app-builder-core-canonical-model
@yeeflow/app-builder-core-planning
@yeeflow/app-builder-core-templates
@yeeflow/app-builder-core-validators
@yeeflow/app-builder-core-materializer
@yeeflow/app-builder-core-package-engine
@yeeflow/app-builder-core-repair-engine
@yeeflow/app-builder-core-runtime-client
@yeeflow/app-builder-core-local-runtime
```

The facade package should expose stable public entrypoints while internal packages retain narrow dependency and testing boundaries.

## Responsibility Map

### Final Accepted Package Boundaries

Contracts own neutral domain DTOs; schemas own immutable versioned schemas; identity owns semantic identity and lineage; and canonical-model owns validated domain projections. Builder returns ResourceGraph data only. Materializer lowers validated structures without host orchestration. Package-engine owns deterministic wrapper and package encoding. The legacy-named runtime-client package is restricted to pure runtime-operation DTO capability metadata; every concrete communication concern remains outside Core. Runtime-verification owns reusable deterministic assertions. Test-fixtures are sanitized and test-only; no production package may import them.

| Capability | Target owner |
| --- | --- |
| Function Specification and App Plan parsing | Core Planning |
| Structured planning projections and traceability | Core Planning |
| Canonical application and resource model | Core Canonical Model |
| Golden Reference registry and immutable templates | Core Templates |
| Approval Form, Data List, Dashboard, and Workflow builders | Core Materializer |
| Expressions, conditions, assignees, bindings, IDs, and references | Core Canonical Model / Materializer |
| Schema checks and signing-readiness hard gates | Core Validators |
| YWF, YDL, YDP, YAP, and YAPK encode/decode/build | Core Package Engine |
| Deterministic known repairs and repair reports | Core Repair Engine |
| Typed Yeeflow operation contracts and response classification | Core Runtime Client |
| OAuth token acquisition and refresh | Codex Adapter |
| Workspace selection and user confirmation | Codex Adapter |
| Local files, terminal, Git, browser, and runtime evidence | Codex Adapter |
| Skills, prompts, agent instructions, release automation | Codex Adapter |

## Initial Source Classification Guidance

The first classification manifest must classify every source path as one of:

- `core`
- `adapter`
- `mixed`
- `compatibility-shim`
- `evidence-only`
- `generated-distribution`

Each record must include:

```json
{
  "sourcePath": "scripts/lib/example.mjs",
  "classification": "mixed",
  "sideEffects": ["filesystem", "oauth"],
  "targetPackage": "@yeeflow/app-builder-core-runtime-client",
  "parityFixtures": [],
  "migrationStatus": "pending"
}
```

Likely Core candidates under `scripts/lib/` include:

- `approval-form-layout-builder.mjs`
- `approval-workflow-designer-shape-utils.cjs`
- `approval-workflow-designer-shape-utils.mjs`
- `approval-workflow-graph-reference-utils.cjs`
- `choice-field-option-utils.cjs`
- `data-list-view-filter-utils.cjs`
- `form-action-open-resource-utils.cjs`
- `form-action-print-barcode-utils.cjs`
- `form-action-query-data-utils.cjs`
- `form-action-set-data-list-utils.cjs`
- `form-control-type-authority.mjs`
- `public-form-action-utils.cjs`
- `public-form-template-utils.cjs`
- `set-variable-contract-utils.cjs`
- `workflow-assignee-expression-utils.cjs`
- `workflow-condition-editor-utils.cjs`
- `workflow-query-data-utils.mjs`
- the pure encode/decode portions of `yapk-decode-utils.mjs`

Likely Adapter candidates include:

- `plugin-root-layout.mjs`
- `yeeflow-env-defaults.mjs`
- host credential portions of `yeeflow-api-auth.mjs`
- `yeeflow-oauth-client.mjs`
- `yeeflow-oauth-token-claims.mjs`
- `yeeflow-workspace-selection.mjs`
- Skills, agent instructions, browser instructions, and release scripts

Likely mixed modules that must be split by function rather than moved whole include:

- full application generated-final materialization entrypoints
- `yeeflow-api-auth.mjs`
- `yeeflow-application-management.mjs`
- scripts that combine parsing/validation with file loading and CLI output
- scripts that combine deterministic package generation with signing, installation, or browser proof

## Required Ports

Core code must receive host capabilities through interfaces rather than importing implementations.

Initial ports:

```ts
export interface CredentialProvider {}
export interface IdProvider {}
export interface ArtifactStore {}
export interface ConfirmationPolicy {}
export interface ExecutionEventSink {}
export interface RuntimeProbe {}
export interface Clock {}
export interface Logger {}
```

Interfaces must be narrowed as real call sites are migrated. Empty or catch-all dependency containers are not acceptable final contracts.

## Migration Phases

### Phase 0 - Baseline and classification

Goals:

- Verify source, tag, commit, active installed version, and dist parity.
- Preserve unrelated worktree changes.
- Build the capability classification manifest.
- Freeze representative fixtures and current expected outputs.
- Record protected paths and rollback baseline.
- Add an English-only gate for migration-owned repository and generated artifact changes.

No business behavior changes are allowed in this phase.

### Phase 1 - Workspace and contracts

Goals:

- Add pnpm workspace and TypeScript project references.
- Create package and adapter skeletons.
- Add dependency-boundary gates.
- Define versioned contracts and structured error envelopes.
- Build an empty facade and Local Runtime health check.

The existing Plugin must continue to operate through legacy scripts.

### Phase 2 - Planning vertical slice

Goals:

- Extract one App Plan Markdown/table parser.
- Extract the validators that consume that parser.
- Preserve existing error codes and report structure.
- Run Legacy/Core differential tests over valid and invalid fixtures.
- Keep old CLI paths as compatibility shims.

Do not migrate full materialization during this phase.

### Phase 3 - Canonical model and templates

Goals:

- Introduce canonical resource contracts.
- Move immutable Golden Reference assets into one registry.
- Validate template identity, version, checksum, and capability profile.
- Prevent adapter code from mutating source templates.

### Phase 4 - Builders and materializer

Goals:

- Extract field, control, form, page, workflow, and resource builders.
- Split pure transformation from filesystem and CLI orchestration.
- Produce versioned ResourceGraph and materialization reports.
- Compare decoded package output against the Legacy implementation.

### Phase 5 - Package and repair engines

Goals:

- Consolidate YWF/YDL/YDP/YAP/YAPK encoding and decoding.
- Consolidate schema, signing-readiness, lineage, ReplaceIds, and upgrade checks.
- Add deterministic repair planning and repair-result contracts.
- Preserve proof-layer boundaries.

### Phase 6 - Codex Adapter switch

Goals:

- Route selected Skills and legacy CLI scripts through Local Runtime.
- Preserve current command paths and user-visible behavior.
- Bundle versioned Core output in Plugin dist.
- Add compatibility manifest and cache/install smoke coverage.

### Phase 7 - Legacy removal

Legacy implementation may be removed only when:

- Differential parity passes for all migrated capabilities.
- No required capability is blocked.
- Package and signing preflight pass.
- Plugin install smoke passes.
- Focused runtime/designer proof passes for affected capabilities.
- A tested rollback artifact exists.

### Phase 8 - Independent repository and Service Runtime

After Local Runtime closure:

- Extract Core packages to an independent Yeeflow App Builder Core repository.
- Publish immutable versioned artifacts.
- Make Plugin consume an exact Core version.
- Add a thin Service Runtime around the same packages.
- Prove Local Runtime and Service Runtime equivalence.

Service Runtime must not reimplement Core behavior.

## Differential Parity Contract

Each migrated capability must execute both paths:

```text
fixture -> Legacy Plugin implementation -> normalized result A
fixture -> Yeeflow App Builder Core      -> normalized result B
```

Compare at the appropriate layers:

- Planning findings and stable error codes.
- Projection JSON and source digests.
- Canonical resource graph.
- Template selections and checksums.
- Generated workflow, form, and page structures.
- Decoded YWF/YDL/YDP/YAP/YAPK resources.
- IDs, bindings, references, relationships, and navigation.
- Package validation and signing-readiness findings.

Every allowed difference requires a reviewed compatibility entry with rationale, affected versions, and removal criteria. Empty broad allowlists are prohibited.

## Dependency Rules

Core packages must not import:

- Codex runtime APIs or Skills.
- Browser automation implementations.
- Git or release tooling.
- OAuth token stores or browser sessions.
- Host environment configuration directly.
- AI model SDKs.
- Next.js, React, Prisma, or host UI code.
- Plugin marketplace metadata.

Additional rules:

- Validators must not mutate input.
- Package Engine must not perform unconfirmed remote writes.
- Materializer must not read local files directly.
- Runtime Client must not own credentials or confirmation UI.
- Production packages must not depend on test fixtures.
- Adapter code may compose Core packages but may not duplicate deterministic rules.
- All persisted Plugin, Core, test, documentation, report, and generated artifact content must be English.

## Versioning

Record these versions independently:

- `coreVersion`
- `contractVersion`
- `canonicalModelVersion`
- `planningVersion`
- `templateRegistryVersion`
- `validatorVersion`
- `materializerVersion`
- `packageEngineVersion`
- `repairEngineVersion`
- `runtimeClientVersion`
- `localRuntimeVersion`
- `pluginAdapterVersion`
- `targetYeeflowCapabilityProfile`

Every generated package and validation report must identify the exact versions that produced it. `stable` must resolve to an immutable version or commit before a task starts.

## Protected Boundaries

- Do not edit Plugin cache directories as development source.
- Do not overwrite unrelated user changes.
- Do not include existing ` 2` or ` 3` duplicate files in migration commits.
- Do not clean the current worktree as part of architecture work.
- Do not claim parity from file counts or static inventory alone.
- Do not collapse planning, materialization, package validation, signing, install acceptance, Version Management, runtime readback, and browser proof into one status.
- Do not move OAuth, browser control, Git, release, or Agent orchestration into Core.
- Do not begin bulk materializer migration in the first implementation phase.
- Do not create an independent service before Local Runtime parity closes.

## First Implementation Scope

The first implementation task is limited to:

1. Reconfirm the `0.9.71` source, dist, and installed-runtime baseline.
2. Record the current worktree without modifying unrelated files.
3. Create the capability classification manifest.
4. Add an English-only changed-file and generated-artifact validation gate.
5. Add the pnpm monorepo workspace skeleton.
6. Add Core package skeletons and the facade package.
7. Add Codex Plugin Adapter and Local Runtime skeletons.
8. Add dependency-boundary validation.
9. Migrate one App Plan parser/validator vertical slice.
10. Add Legacy/Core differential regression fixtures.
11. Run focused tests and publish a local migration report.

The first implementation task must not:

- migrate the full generated-final materializer;
- delete or relocate legacy scripts;
- change Plugin business behavior intentionally;
- include unrelated worktree files;
- commit, push, open a PR, release, or promote stable unless separately requested after review.

## Acceptance Criteria for Phase 1

- Workspace installs and typechecks without changing current Plugin execution.
- Dependency-boundary gates prove Core does not import host-specific modules.
- The public facade and Local Runtime expose version and capability metadata.
- The selected parser/validator produces differential-equivalent output.
- Existing legacy entrypoints remain callable.
- Source/dist mirror behavior remains explicit and testable.
- No unrelated or duplicate files are staged.
- A rollback procedure returns the Plugin to the exact `0.9.71` baseline.

## New Task Bootstrap Prompt

Use the following prompt when continuing this work in a task opened from the Plugin project:

```text
Read these files first:

/Users/rengerhu/Documents/App Builder Codex Plugin 2/docs/architecture/yeeflow-app-builder-core-handoff.md
/Users/rengerhu/Documents/App Builder Codex Plugin 2/docs/architecture/yeeflow-app-builder-core-migration-state.json

Treat them as the architecture authority and migration state for this task.

Before editing, verify Git status, HEAD/tag, source version, dist version, active installed Plugin version, and existing duplicate-file noise. Preserve every unrelated user change.

Execute only the next incomplete phase recorded in the migration-state file. Do not bulk-migrate the materializer and do not enter commit, PR, release, or stable promotion unless explicitly requested after local review.

The user may communicate in Chinese or English, but every file, filename, code comment, configuration value, test, report, log message, error message, template, and generated Yeeflow resource created or modified by this task must be English. Keep Chinese explanations in chat only. Run the English-only gate before reporting completion.
```

## Handoff Status

This document records architecture decisions and migration boundaries only. At the time of creation:

- Architecture handoff: complete.
- Repository baseline identification: complete.
- Capability classification manifest: not started.
- Workspace/package skeleton: not started.
- Code extraction: not started.
- Differential parity: not started.
- Plugin Adapter switch: not started.
- Independent repository extraction: not started.
- Service Runtime: not started.
