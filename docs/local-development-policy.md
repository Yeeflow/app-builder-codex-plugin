# Local Development Policy

Use this repository as the main local development workspace for Yeeflow App Builder plugin version work.

- Branch future feature work from `main`.
- Use feature branches named `codex/<task-name>`.
- Open pull requests back into `main`.
- Move `stable` only after validation, install smoke, and Codex App cache smoke pass.
- Do not create tags or publish releases unless explicitly approved.
- Never commit secrets, OAuth tokens, cert/key files, private tenant data, raw API responses, decoded payloads, screenshots, generated runtime packages, or other runtime artifacts.
