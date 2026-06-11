# Yeeflow App Builder User Guide

Use Yeeflow App Builder when you need Codex to work with Yeeflow application packages, validation rules, UI generation guidance, runtime-test planning, or safe API capability lookup.

## Install

Use source https://github.com/Yeeflow/app-builder-codex-plugin.git, Git ref `stable`, and sparse paths `.agents/plugins/marketplace.json` plus `dist/yeeflow-app-builder-plugin`.

## Expected Version

`0.6.21-api-map.0`

## Safe API Usage

Before Yeeflow API work, check OAuth/API auth status and the REST API capability map. Use only documented capabilities. Do not expose arbitrary raw API calls, secrets, raw responses, tenant URLs, or decoded private payloads.
