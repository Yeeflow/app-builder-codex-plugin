# Runtime Gate For New Capability Learning

This process applies when Codex learns a new Yeeflow function, schema, runtime behavior, resource type, workflow action, app setting, AI feature, report/service capability, or reusable generator rule.

The goal is to prevent export-only learning from being merged as runtime proof. New capability learning should pass through an explicit runtime decision before merge or final report.

## Two-Step Proof Model

1. Export-backed learning branch
2. Focused runtime baseline branch or isolated runtime continuation
3. Merge only after the proof boundary is clear

The steps may happen in one long task only when the user explicitly asks for end-to-end learning and runtime testing, and Codex can keep generated runtime artifacts isolated and safe. Otherwise, split the work.

## A. Learning Branch

Purpose:

- decode and study exports read-only
- document export-backed schema and relationships
- create normalized redacted references
- update validators carefully, using hard errors only for proven invalid generated shapes
- update relevant skills with export-proven knowledge only
- identify runtime-sensitive behavior and open questions
- avoid claiming import/runtime behavior

Do not commit raw `.yap`, `.yapk`, `.ydl`, `.ywf`, `.yaia`, `.yaic`, downloaded exports, decoded raw payloads, generated runtime packages, credentials, tokens, private users, tenant IDs, private images, or document binaries.

An export-backed learning branch may be merged before runtime only when the final report and docs clearly label the milestone as one of:

- export-proven only
- validator-backed only
- planning-guidance only
- import-proven only
- partial runtime proof

It should not be merged automatically after export study unless the user explicitly approves that proof boundary.

## B. Runtime Decision Before Merge

Before merging new capability learning, decide and document one of these paths:

- run a focused runtime test in a separate branch
- continue runtime proof on the same branch only if artifacts remain isolated, ignored, and safe
- defer runtime proof and merge as export-proven/validator-backed/planning-guidance/import-proven only, with explicit approval

Runtime proof is required before broad generation guidance may claim Yeeflow runtime behavior, especially when the capability affects imported app rendering, workflow execution, email delivery, AI execution, document upload/persistence, external API calls, user/group membership, permissions, custom code execution, row mutation, or destructive operations.

Runtime proof may be deferred when the change is only documentation, export schema mapping, conservative validator warnings, planning guidance, or non-executing import/configuration proof.

## C. Focused Runtime Baseline

When runtime proof is needed:

- create the smallest focused app that tests only the learned capability
- avoid unrelated app complexity, broad dashboards, large workflows, or mixed feature packs
- use fresh generated IDs
- validate locally before building
- build only after validation passes
- import into `https://<yourdomain>.yeeflow.com/` only after local validation passes and the user has requested runtime testing
- test safe runtime behavior only
- avoid real email, live AI calls, external APIs, destructive updates, private users, private images, private documents, and credentials unless the safe test scope is explicit

Document the exact proof boundary:

- passed
- partial
- blocked
- not tested

## D. Merge Rule

Do not merge new capability learning to `main` as runtime-proven unless focused runtime testing passed and the tested behavior is documented.

If merged before runtime, the merge report must state the exact proof boundary and preserved gaps. Good labels include:

- export-proven only
- validator-backed only
- planning-guidance only
- import-proven only
- configuration-visible only
- render-only proven
- partial runtime proof
- runtime-proven for the tested host/scope only

Skill updates should also preserve the label. Do not promote a partial result into broad app-generation rules.

## Final Report Requirements

Every new capability learning final report should include:

- branch and commit
- exports studied or runtime package tested
- whether runtime was run
- runtime decision before merge
- proof-boundary label
- validators updated
- skills updated
- generated baseline package path, if any, and whether it is ignored/uncommitted
- safety scan result
- what is proven
- what remains unproven
- whether a focused runtime branch or follow-up is needed

## Focused Runtime Baseline Prompt For Newly Learned Capability

Use this prompt when export-backed learning needs a focused runtime follow-up:

```text
Continue from branch:
<learning branch>

Goal:
Create a focused runtime baseline for the newly learned Yeeflow capability:
<capability name>

Learned patterns to test:
- <export-proven structure or validator rule>
- <resource/action/setting/control shape>
- <known dependency or risk>

Focused app requirements:
- Build the smallest app that exercises only this capability.
- Use fresh generated IDs and fresh FlowKey/form keys when forms/workflows are included.
- Include only required lists/forms/dashboards/workflows/resources.
- Do not include real users, real emails, private tenant data, credentials, external connections, private images, or document binaries.

Validation checks:
- Run relevant JS/MJS syntax checks.
- Run JSON parse checks.
- Run package/list/form/workflow/graph/materialization validators.
- Run wrapper round trip if a `.yap` is generated.
- Run safety scans for raw exports, decoded payloads, generated packages, credentials, tokens, emails, tenant IDs, users, image binaries, and private data.
- Do not build before validation passes.
- Do not runtime-test before local validation passes.

Runtime steps:
- Import only into https://<yourdomain>.yeeflow.com/.
- Confirm app imports and opens.
- Test only the learned capability and required host/resource surfaces.
- Do not execute live AI, send email, call external APIs, mutate real records, or upload private files unless explicitly scoped and safe.

Proof-boundary documentation:
- Classify each tested behavior as passed, partial, blocked, or not tested.
- Separate import proof, configuration visibility, render proof, and actual runtime execution.
- Preserve unproven contexts and unsafe paths as follow-ups.

Commit and push:
- Commit docs, validators, skills, and safe tests only.
- Do not commit generated `.yap` packages, raw exports, decoded payloads, private data, image binaries, `.env`, credentials, or tokens.
- Push the runtime branch.

Final report:
- branch
- generated baseline path, if any
- validation results
- runtime result
- exact proof boundary
- docs/skills updated
- safety scan result
- commit hash
- push status
- whether the original learning branch can now merge as runtime-proven, partial, or still export-proven only
```
