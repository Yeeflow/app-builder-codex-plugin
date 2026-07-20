# Phase 4 Materializer Core Closure v0.1.0

## Closure Decision

Phase 4 is complete. The regenerated TypeScript AST seam ledger contains no remaining `eligible-single-slice` or `eligible-batch-candidate` record. Its residual candidate inventory contains 318 `defer-high-risk` records and zero host-free helper slices approved for routing.

## Proven Routed Slices

| Core export | Production call expressions | Legacy rollback retained |
| --- | ---: | --- |
| `normalizeHexColor` | 4 | Yes |
| `defaultValueForFieldType` | 1 | Yes |
| `escapeRegExp` | 1 | Yes |
| `normalizeForLooseFormMatch` | 3 | Yes |
| `stripPlanningDocumentSuffix` | 3 | Yes |
| `dependencyName` | 4 | Yes |
| `safeDependencyIdentifier` | 3 | Yes |

The public Materializer Core exports are `capabilityMetadata`, `normalizeHexColor`, `defaultValueForFieldType`, `escapeRegExp`, `normalizeForLooseFormMatch`, `stripPlanningDocumentSuffix`, `dependencyName`, and `safeDependencyIdentifier`. The official Materializer artifact SHA-256 is `5dd5d7bad9ee16607d23dc827f73252ff8e605a42c32f773f7e4188b744c597d`.

## Contract-First Residual Families

| Family | Why no simple helper extraction | Core-eligible deterministic boundary | Host-adapter responsibility | Required future proof | Phase 5 order |
| --- | --- | --- | --- | --- | ---: |
| Field and control projection | Field records couple planning rules, template choices, list context, and generated resource mutation. | Immutable field/control projection DTOs and validated projection rules. | Read plans and templates; apply projections to generated resources. | Legacy/Core graph parity, field matrix fixtures, scoped rollback. | 1 |
| Resource-definition construction | Lists, dashboards, forms, and layouts share cross-resource identity and template state. | Validated ResourceGraph construction contracts. | Load templates, allocate host IDs, serialize resource layouts. | Whole-resource differential fixtures, graph-shape parity, rollback by resource family. | 2 |
| Workflow and form-action materialization | Workflow nodes, triggers, bindings, and host forms require coupled graph and ID behavior. | Canonical workflow/form-action plans and deterministic lowering rules. | Resolve host resources, persist workflow payloads, execute host integration. | Node-level fixtures, workflow graph parity, host rollback. | 3 |
| ID allocation and identity propagation | API-issued IDs and lineage must remain lossless and environment-owned. | Identity allocation requests, validated allocation maps, and propagation transforms. | Obtain API IDs and tenant context; reject missing or invalid allocations. | Allocation-manifest replay, lossless-ID parity, rollback before persistence. | 4 |
| Generated-final target and projection validation | Validation spans planned targets, emitted resources, and package completeness evidence. | Deterministic target/projection validation contracts and findings. | Collect decoded package state and report CLI findings. | Plan-to-decoded differential fixtures, stable-code parity, validation rollback. | 5 |
| Package, archive, and file writing | Encoding, compression, filesystem paths, and output ownership are host effects. | Pure package model encoding and byte-contract inputs where separately audited. | Write files, create archives, manage output directories and errors. | Byte-level package fixtures, archive validation, temporary-output rollback. | 6 |
| Runtime, API, and install orchestration | OAuth, transport, installation, browser/runtime proof, and tenant state are host-specific. | Typed requests, response classification, and deterministic runtime-proof assertions. | OAuth, network transport, install execution, and evidence capture. | Mock transport parity, controlled tenant proof, install rollback. | 7 |

## Phase 5 Recommendation

Begin `phase-5-contract-first-materializer-projection` with immutable field and control projection contracts. It must not route existing production materializer functions until the contract, canonical DTOs, focused Legacy/Core differential fixtures, source/archive/installed proof, and a scoped Legacy rollback are accepted.

The historical Plugin ZIP remains a read-only verification target with SHA-256 `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`.
