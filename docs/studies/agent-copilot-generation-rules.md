# Agent/Copilot Generation Rules

Source export: `/Users/Renger/Downloads/DEMO Innovation Ecosystem Platform.yap`

These rules extend existing Yeeflow application generation guidance. They are export-proven, not runtime-proven for generated imports.

## Scope Boundary

Agents and Copilots are governed enterprise AI execution resources. Treat them as application resources with explicit dependencies on lists, knowledge resources, other AI resources, and connections.

Do not claim support for Services runtime, AI-assisted service code generation, code interpreter/data analysis, MCP, or scheduled workflow quick entries from this export.

## Required Resource Graph

Before generating any Agent/Copilot package, build a graph that includes:

- root app/listset
- data lists or document libraries used by tools
- knowledge resources
- AI Agents
- Copilots
- connections
- connected-Agent references
- workflow/form/dashboard references

Generated final packages must not contain unresolved `Settings.Data.Value` references.

## Minimal Safe Baseline Policy

A minimal generated baseline may be attempted only after local validation rules are ready and the target structure is fully mapped. Preferred scope:

- one generated test data list
- one AI Agent with one local list query tool
- one Copilot with one connected-Agent tool
- no real external connection calls
- no real Outlook/SharePoint/OAuth/HTTP credentials
- fresh generated IDs

For this branch, baseline generation is skipped because connection behavior and AI resource import/remap behavior remain runtime-sensitive.

## ReplaceIds Policy

Include generated app/list/form/layout/sample IDs according to existing `.yap` rules. Do not include tenant IDs, user IDs, real connection IDs, real external endpoint values, or credential values.

Connection IDs and AI resource IDs may need remapping, but this export alone does not prove exact `ReplaceIds` behavior. Treat generated AI/connection remapping as a future runtime-learning task.

## Validator Rules

Add hard errors only for proven invalid generated-final shapes:

- invalid AI module arrays
- invalid AI resource `Settings` JSON
- missing generated final AI resource IDs
- unresolved generated final tool references
- embedded secret/token/password/API-key fields

Use warnings/dependencies for:

- connection-backed tools
- credential delegation
- OpenAPI operations
- current application resource access
- connected-Agent tools
- runtime-sensitive list mutation tools

## Skill Update Targets

The AI Agent, Copilot, application generator, package validator, feature-learning, and runtime-test skills should all preserve this boundary: export-proven structure is useful for validation and future generation, but generated import/runtime proof is still pending.
