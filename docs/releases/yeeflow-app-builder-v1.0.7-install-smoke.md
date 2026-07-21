# Yeeflow App Builder v1.0.7 RC Install Smoke

## Scope

- Candidate tag: `yeeflow-app-builder-plugin-v1.0.7-rc1`
- Candidate commit: `c88b0983b9f90634ef6a23696b77f0b464c57a40`
- Candidate archive SHA-256: `07ca71f9ba9d4a2e35db2dd500bf8ca68625df39519ab216ac8e409877cb2a95`
- Plugin identity and version: `yeeflow-app-builder@yeeflow` `1.0.7`

## Isolated Installation

The candidate was installed through Codex from a Git marketplace snapshot pinned to the RC tag, using an isolated temporary `CODEX_HOME`, cache, and configuration directory. The active user Plugin cache was not read or changed.

- Marketplace registration passed.
- Plugin installation passed.
- `codex plugin list --json` reported the candidate as installed and enabled.
- Installed cache metadata matched the expected plugin identity and version.

## Production Execution Smoke

The installed production Codex adapter invoked the packaged execution service with a structured intent and an injected model-invocation port.

- The model-invocation port was called once.
- The execution result succeeded.
- The Codex adapter retained no-write authority.
- The opaque provider profile was not returned in the result.
- No live tenant request, OAuth flow, external model API call, or Plugin Test2 operation occurred.

## Packaging Boundary

The installed cache contained the five production execution modules only: Core domain contracts, Core application facade, execution contracts, execution service, and Codex adapter. It did not contain the Web-managed-provider fake adapter or the future-host fixture adapter.

The archive has 1,671 files and the installed cache has 1,670 files. The sole installer-normalized path is the compatibility duplicate `skills/installed/yeeflow-application-generator/SKILL.md`; the cache keeps the canonical `skills/yeeflow-application-generator/SKILL.md` with the same SHA-256 content. This is Codex installer canonicalization, not a production content divergence.

## Proof Boundary

This smoke proves isolated Codex installation and deterministic no-write execution for the RC candidate. It does not prove a real external model-provider request, Web Application integration, tenant mutation, signing, installation of a generated Yeeflow application, or runtime UI behavior.
