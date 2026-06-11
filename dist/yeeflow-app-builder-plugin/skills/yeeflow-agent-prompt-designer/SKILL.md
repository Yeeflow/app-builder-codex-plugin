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

Do not imply Outlook, SharePoint, HTTP, OpenAPI, document generation, image generation, image analysis, code interpreter, MCP, or Services runtime access unless the specific tool component is present and validated.
<!-- agent-copilot-application-resource-learning:end -->

<!-- scheduled-workflow-ai-assistant-learning:start -->
## Workflow-Called Agent Prompt Guidance

Agents called by workflow AI Assistant actions should have explicit input and output variable instructions that match the workflow mapping. The `Email generation` Agent export uses input `QueryItems` and outputs `Subject` and `Body`; prompt text asks for an email subject and inline-style HTML body. Do not imply the Agent sends email itself unless a separate `MailTask` is configured.

`Spark & AI (1).yap` extends this rule for image extraction Agents in data-list workflows: declare the image input explicitly as `type = "img"`, declare a separate text input for the originating row ID, and describe exactly how the Agent should use any application-resource access tool to update the correct row. Do not make the prompt guess which row to mutate when the workflow can pass `ListDataID` directly.
<!-- scheduled-workflow-ai-assistant-learning:end -->
