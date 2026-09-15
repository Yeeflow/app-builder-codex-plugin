---
name: yeeflow-agent-prompt-designer
description: Rewrite and validate Yeeflow AI Agent Persona & Prompt content using structured Role, job, goals, skills, inputs, workflow, output format, and constraints sections with {{variableName}} references. Use when Agent prompts are too simple, inconsistent, missing variable references, or need enterprise-ready reusable-template wording.
---

# Yeeflow Agent Prompt Designer

## Prompt Shape

Use this structure for Yeeflow AI Agent `Persona & Prompt` fields:

```text
Role: <business-specific role name>

You are an AI assistant for <business purpose>.

Your job is to:
- ...

Goals:
- ...

Skills:
- ...

Inputs:
- {{inputVariable}} (Type): Short description.

Workflow:
1. ...

OutputFormat:
Return the configured output variables only. Use the output variable names exactly:
- {{outputVariable}} (Type): Short description.

Constraints:
- ...
```

## Rules

- Reference every configured input and output variable as `{{variableName}}`.
- Preserve the exact variable names from the manifest.
- Keep the tone calm, practical, structured, and enterprise-ready.
- Do not imply unavailable tools. Say tools are deferred unless configured by an admin.
- Avoid legal, HR, finance, compliance, or commercial final decisions. Recommend human review where appropriate.
- Prefer clear output instructions over generic chatbot behavior.

## Validation

Run `scripts/validate_prompt_refs.js <manifest.json>` after updating prompts.

<!-- agent-copilot-application-resource-learning:start -->
## App-Bound Tool Prompt Guidance

App-contained Agents can have Components for knowledge, list query/create/update/delete tools, connected application connections, and connected Copilot/Agent orchestration. Prompt text may describe those tools only when the bindings are actually present. For destructive tools such as delete-by-ID, require record identification, ownership checks, dependency checks, and human-readable blocked/deleted responses.

For a Knowledge source, the real binding is `Components[]` with `Type = 1` and `Source` equal to the returned Knowledge resource ID; the displayed component name must match that resource. Do not write “use the <Knowledge name> knowledge base” unless this binding has been saved and read back. Validate the application package with `node scripts/validate-knowledge-source-bindings.mjs <app.yap-or-decoded-data.json> --mode final`; this proves configuration consistency, not retrieval execution.

Do not imply Outlook, SharePoint, HTTP, OpenAPI, document generation, image generation, image analysis, code interpreter, MCP, or Services runtime access unless the specific tool component is present and validated.
<!-- agent-copilot-application-resource-learning:end -->

<!-- scheduled-workflow-ai-assistant-learning:start -->
## Workflow-Called Agent Prompt Guidance

Agents called by workflow AI Assistant actions should have explicit input and output variable instructions that match the workflow mapping. The `Email generation` Agent export uses input `QueryItems` and outputs `Subject` and `Body`; prompt text asks for an email subject and inline-style HTML body. Do not imply the Agent sends email itself unless a separate `MailTask` is configured.

`Spark & AI (1).yap` extends this rule for image extraction Agents in data-list workflows: declare the image input explicitly as `type = "img"`, declare a separate text input for the originating row ID, and describe exactly how the Agent should use any application-resource access tool to update the correct row. Do not make the prompt guess which row to mutate when the workflow can pass `ListDataID` directly.
<!-- scheduled-workflow-ai-assistant-learning:end -->

<!-- plugin-resource-access -->
## Portable access to bundled resources

Resolve this plugin's root from the current host-provided skill location: a skill is under `<plugin-root>/skills/<skill-name>`. Never hardcode a developer checkout, a macOS home directory, a Linux cache path, or a particular plugin version.

Use the skill-resource reader for files within the selected skill subtree. Shared references such as `docs/reference/...`, root validators and `core/...` are relative to the plugin root, not the current working directory. When the resource reader cannot read outside the skill subtree, read the existing shared file through the host's filesystem tools at its resolved plugin-root path. A resource-interface error alone does not prove the bundled file is missing. If no filesystem reader is available, report that access limitation; do not invent reference contents.

Resolve scripts relative to the mounted plugin and run with the host's available Node runtime. The application-generator validator entrypoint delegates to the root validator so shared dependencies resolve from the same package, including when launched from a temporary directory. Do not install dependencies or call remote write tools merely to read a template. Keep skill reads, script validation, live MCP reads, and business runtime acceptance as separate evidence.

## Unified Yeeflow MCP connection

Use the single `yeeflow_mcp` connection at `https://api.yeeflow.com/v1/mcp` for all live Yeeflow work. App Builder, Operations, Admin and Service Portal are capability domains within this connection, not separate servers or logins. Discover the current host-exposed tool names and schemas; do not invent namespace prefixes or assume tool contracts stayed identical after migration.

A single OAuth connection does not grant additional permissions. Operations serves business users; application structure/settings and resource creation require the appropriate application-administrator rights. Organization administration and Service Portal capabilities retain their own permission and context checks. Editor/Visitor access is not application-administrator access. On authentication failure reconnect this unified endpoint through the host; on permission denial stop the denied action without falling back to a former endpoint or another identity. Keep existing confirmation, readback, pagination, RowVersion and data-minimization rules.
