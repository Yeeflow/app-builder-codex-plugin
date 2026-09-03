# Yeeflow App Builder Plugin v1.13.0

Previous version: `1.12.10`

Changed bundled skill: `yeeflow-custom-code-generator`

## Attachment Upload and AI Recognition

- Add a Golden Reference for Yeeflow Attachment metadata and direct SDK upload/content retrieval.
- Add an SCSK-style attachment uploader pattern with explicit upload state, validation, metadata normalization, removal, and retry behavior.
- Add a quotation AI-recognition pattern for Approval Form Action orchestration and writable variable targets.
- Add focused compilation and mutation-based regression gates for both source and distributed plugin assets.
- Restore the two source fixtures already required by the deterministic release rebuild so a clean tag checkout can regenerate the distribution.

## Validation

- Attachment pattern structure, TypeScript compilation, and negative mutation gates: passed for source and distribution.
- TypeScript project check and the 21-case workspace skeleton suite: passed.
- Skill reference, repository hygiene, Custom Code surface, App Plan, MCP integration, JS/MJS syntax, and 552-file JSON parsing checks: passed.
- The 6.8 MB release archive passed ZIP integrity, installed-layout simulation, version readback, and the scoped release safety audit with zero blockers.

## Install Smoke

- Source: `https://github.com/Yeeflow/app-builder-codex-plugin.git`
- Git ref tested: `codex/yeeflow-app-builder-plugin-v1.13.0`
- Commit tested: `31a37c4`
- Sparse paths: `.agents/plugins/marketplace.json`, `dist/yeeflow-app-builder-plugin`
- Marketplace/plugin: `Yeeflow` / `Yeeflow App Builder`
- Result: installed version `1.13.0`; installed-cache attachment gates and MCP integration passed.
- Skill prompts: Application Builder lifecycle and Custom Code Attachment/AI-recognition boundaries both resolved correctly from the installed plugin.
- Known behavior: unrelated installed plugins emitted pre-existing prompt/icon metadata warnings; Yeeflow installation and discovery were unaffected.
- Release status: approved for the final `yeeflow-app-builder-plugin-v1.13.0` tag without an RC stage, per user direction.

## Proof Boundary

This release validates the documented patterns, compile-time contracts, negative mutations, source/distribution parity, archive layout, installed-cache behavior, and skill discovery. It does not claim tenant-specific upload, AI service, Designer, persisted-definition, submission, workflow, or browser-runtime proof beyond the previously recorded read-only component evidence.
