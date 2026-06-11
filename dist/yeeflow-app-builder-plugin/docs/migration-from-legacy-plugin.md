# Migration From Legacy Plugin

The legacy plugin used marketplace `yeeflow-internal` and plugin `yeeflow-builder` in the repository `https://github.com/Yeeflow/yeeflow-codex-plugins.git`. That identity has been observed resolving stale Codex App materializations such as `0.5.8`.

This repository intentionally uses marketplace `yeeflow` and plugin `yeeflow-app-builder`, with the active dist path `dist/yeeflow-app-builder-plugin`. Install and smoke test the new identity before retiring the legacy repository.
