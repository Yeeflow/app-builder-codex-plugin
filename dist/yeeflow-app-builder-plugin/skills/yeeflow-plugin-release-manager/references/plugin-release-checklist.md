# Plugin Release Checklist

Run before committing a rebuild and before finalizing an install-tested release.

## Structure

- `dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json` exists.
- `.agents/plugins/marketplace.json` exists when private marketplace install is supported.
- Every bundled skill has `SKILL.md`.
- Every bundled skill has `agents/openai.yaml`.
- Referenced files exist.
- Skill mirrors match the intended project skill sources.

## Parsing And Package

- `plugin.json` parses.
- `marketplace.json` parses.
- Archive exists: `dist/yeeflow-app-builder-plugin-<version>.zip`.
- `unzip -t` passes.
- Package size is reasonable.

## Code And Data Checks

- `node --check` passes for included JS/MJS files.
- JSON parse checks pass for included JSON references.
- `git diff --check` passes.

## Safety Scan

Confirm the plugin package does not include:

- raw `.yap`, `.yapk`, `.ydl`, or `.ywf`
- `.env`, secrets, private keys, tokens, or credentials
- screenshots
- downloaded exports
- large generated artifacts
- customer data
- tenant-specific runtime data

## Release Status

- Rebuild task creates RC tag only.
- Final tag is created only after private marketplace install smoke passes.
- Production/public marketplace remains not applicable unless explicitly verified.
- Partner-safe edition remains planned until separately created and reviewed.
