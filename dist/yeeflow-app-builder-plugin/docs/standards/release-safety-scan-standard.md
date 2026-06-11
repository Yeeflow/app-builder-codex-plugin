# Release Safety Scan Standard

Release safety scans must distinguish release blockers from historical repository debt without weakening the safety policy.

## Scopes

- Changed-file safety: files changed between the previous release base and the release candidate.
- Active package safety: source files used by the plugin and the bundled `dist/yeeflow-app-builder-plugin` tree.
- Archive safety: files included in the release archive and in an extracted archive smoke test.
- Historical repository debt: tracked files outside the changed release scope and outside the plugin/archive scope.

## Blocking Rules

Block release when changed files, active plugin content, dist content, archive content, extracted archive content, or committed generated reports contain raw `Sign`, raw `Resource`, decoded payloads, raw API responses, `.env.local`, secrets/API keys, generated runtime `.yap`/`.yapk`, screenshots, tenant/workspace/upload/private IDs, or private URLs.

Schema files may contain structural `Sign` property definitions. Test fixtures may contain explicit placeholders such as `<REDACTED_SIGN_PLACEHOLDER>`. They must not contain real or unclear signature values.

## Historical Findings

Existing tracked historical findings are not silently ignored. Report their paths and classifications separately. If a historical finding contains real or unclear raw `Sign` or raw `Resource`, sanitize it before release when practical. Preserve required key shape and replace values with safe placeholders.

## Recommended Command

Run the release safety audit before tagging:

```sh
node scripts/audit-release-safety.mjs --base <previous-release-commit> --archive dist/yeeflow-app-builder-plugin-0.6.11.zip
```

The audit must pass with zero blocking findings. Historical debt must be either sanitized or explicitly reported.
