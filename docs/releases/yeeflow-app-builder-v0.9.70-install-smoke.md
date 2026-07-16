# Yeeflow App Builder v0.9.70 RC Install Smoke

Date: 2026-07-17

## Release Candidate

- Git tag: `yeeflow-app-builder-plugin-v0.9.70-rc1`
- Tested commit: `4d3bb0c132c98c989580d26cbe0b5caef10a2798`
- Installed plugin: `yeeflow-app-builder@yeeflow`
- Installed version: `0.9.70`
- Installation source: Git marketplace snapshot at the RC tag
- Test environment: isolated temporary `CODEX_HOME`

## Results

- Marketplace add: pass
- Plugin install: pass
- Installed-cache metadata/version inspection: pass
- Validator parsing hardening regression suite: pass
- Workflow Set Data List plan regression suite: pass
- Workflow Set Data List materialization regression suite: pass
- YAPK hard-gate cache artifact suite: pass
- Release payload versus installed-cache byte parity: pass
- Release payload file count: `1636`
- Installed-cache file count: `1636`

## Artifact

- ZIP: `dist/yeeflow-app-builder-plugin-0.9.70.zip`
- SHA-256: `ef0bce467cf0f6cbee408ac6b188faacbf4413b84ad58d013128361bddb24e24`

The smoke evidence document is repository-only release evidence. It does not modify the RC-tested plugin payload or release ZIP.
