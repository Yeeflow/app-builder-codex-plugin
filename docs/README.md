# App Builder Codex Plugin Docs

These docs support the Yeeflow App Builder Codex plugin.

Current install identity:

- Marketplace: Yeeflow
- Plugin: Yeeflow App Builder
- Version: `0.6.22`
- Dist path: `dist/yeeflow-app-builder-plugin`

Install source:

```text
Source: https://github.com/Yeeflow/app-builder-codex-plugin.git
Git ref: stable
Sparse paths:
  .agents/plugins/marketplace.json
  dist/yeeflow-app-builder-plugin
```

## Start Here

- [Plugin installation](plugin-installation.md)
- [Quick start](quick-start.md)
- [Environment configuration](environment-configuration.md)
- [Browser OAuth login](browser-oauth-login.md)
- [Yeeflow REST API capability map](yeeflow-rest-api-capability-map.md)
- [Local development policy](local-development-policy.md)
- [Release hygiene](release-hygiene.md)
- [Managed app connector design](yeeflow-codex-managed-app-connector.md)

## Development Areas

- `../scripts/` contains reusable validation, OAuth/API, package automation, and schema utilities.
- `../schemas/` contains YAP/YAPK canonical schema references and the Codex YAPK overlay.
- `../skills/` and `../generated-skills/` contain source skill material.
- `studies/`, `standards/`, and `templates/` preserve sanitized research and generation rules.
- `legacy/yeeflow-codex-plugins/` preserves safe historical release notes and old investigation docs. It is not current install guidance.

## Safety

Do not commit `.env.local`, OAuth token files, cert/key files, private tenant URLs, raw API responses, decoded package payloads, generated runtime packages, screenshots, or local cache folders.

Use documented Yeeflow endpoints only. Mutating APIs and package operations require explicit confirmation.
