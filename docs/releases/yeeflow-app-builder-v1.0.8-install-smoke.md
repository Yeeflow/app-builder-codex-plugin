# Yeeflow App Builder v1.0.8 Pre-Merge Install Smoke

## Candidate

- Branch: `codex/yeeflow-app-builder-plugin-v1.0.8`
- Pull request: `#492`
- Release code commit: `a30444647208506db6b45829b4412faa75693585`
- Distribution provenance commit: `6d253bbeb9ca6659ceb7124b890f699b349e3fd4`
- Plugin candidate: `yeeflow-app-builder-plugin-1.0.8.zip`
- Plugin candidate SHA-256: `71a36e460ae0701859931b7c10c77f5b7cd9c2a6cd8fa11a500d3ff278e2580f`
- SDK candidate: `yeeflow-app-builder-execution-sdk-1.0.0.tgz`
- SDK candidate SHA-256: `68408a2f9ad77f1656d058564dfad199bdd2cc0f92183956faa36e3adfae3b12`

These are pre-merge candidate checksums. Final Release assets must be rebuilt from
the merge commit and revalidated before the final tag and `stable` promotion.

## Isolated Codex Plugin Installation

The Plugin was installed from the remote release branch through a Git marketplace
using a new temporary Codex home. The active user Plugin cache was not read or
modified.

- `codex plugin list --json` reported `yeeflow-app-builder@yeeflow` version
  `1.0.8` as installed and enabled.
- The installed manifest reported Plugin version `1.0.8`.
- The installed execution directory contained exactly the five approved runtime
  modules plus the execution distribution manifest.
- No Web managed-provider or future-host adapter artifact or package identity was
  present.
- The candidate ZIP contained 1,671 files and the installed cache contained 1,670
  files. The only difference was the known installer canonicalization of
  `skills/installed/yeeflow-application-generator`; its content SHA-256 matched the
  canonical installed skill.

## Installed Production Adapter Smoke

The installed Codex adapter ran with an injected deterministic fake model and a
network trap.

- Execution succeeded with one fake-model invocation.
- External calls: `0`.
- Write authority: `0`.
- The opaque model profile was not returned.
- An `external.write` authority request was rejected before model invocation with
  `EXECUTION_WRITE_AUTHORITY_FORBIDDEN`.

No OAuth login, tenant API, provider API, credential access, generated Yeeflow
application installation, or active-cache mutation occurred.

## Isolated SDK Consumer Smoke

The final-version SDK candidate was installed into a temporary npm consumer with
scripts disabled.

- Package identity: `@yeeflow/app-builder-execution-sdk@1.0.0`.
- Dependencies: `0`.
- Source, expanded package, archive, and installed outputs were identical.
- The declaration TypeScript consumer compiled successfully.
- Fake-model invocations: `1` per surface.
- External calls: `0`.
- Credential environment keys: `0`.
- Write authority: `0`.
- Seven package mutation cases failed closed.

## Proof Boundary

This smoke proves the remote branch Plugin installation boundary and an isolated
Node/npm SDK consumer. It does not prove that the Yeeflow AI App Builder Web
repository has installed the SDK, and it provides no Web bundler, browser,
deployment, tenant, generated-application installation, or runtime UI proof.
