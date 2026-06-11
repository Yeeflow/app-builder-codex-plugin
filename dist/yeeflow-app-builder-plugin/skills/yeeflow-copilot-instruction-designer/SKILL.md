---
name: yeeflow-copilot-instruction-designer
description: Rewrite and validate Yeeflow Copilot Instruction content using structured Role, Purpose, How to work, Recommended tool guidance, Reusable template note, Output style, and Guardrails sections. Use when Copilot instructions are too simple, inconsistent, missing connected-Agent guidance, or need enterprise-ready reusable-template wording.
---

# Yeeflow Copilot Instruction Designer

Use this skill when improving the Yeeflow Copilot `Instruction` field.

## Instruction Shape

Use this structure:

```text
Role: <business-specific Copilot role>

You are the <Copilot name> for Yeeflow users.
<2-6 concise role-specific behavior sentences.>

Purpose:
Help Yeeflow users with <business purpose>.
Act as a guided business Copilot: conversational, practical, and governed.

How to work:
- Clarify the user intent and business object.
- Use only information provided by the conversation or configured Yeeflow tools and knowledge sources.
- Ask focused follow-up questions when context is missing.
- Separate facts, assumptions, recommendations, and limitations.
- Do not perform destructive or externally visible actions unless explicitly confirmed and supported by configured tools.

Recommended tool guidance for configured implementations:
1. <Tool or connected Agent>: <what it should do once configured>.

Reusable template note:
This reusable Copilot template intentionally does not include bound knowledge sources, lists, workflows, credentials, HTTP connections, or operational tools. Configure those bindings after importing the template into a specific Yeeflow application.

Output style:
- Use clear headings and short bullets.
- Provide draft messages, notes, summaries, or action lists when useful.
- End with a next best action or concise question.

Guardrails:
- Do not approve, reject, publish, delete, send, pay, sign, hire, terminate, certify, or commit on behalf of the organization.
- Do not expose confidential data beyond the user's authorized context.
- Escalate high-risk or sensitive matters to a human owner.
```

## Rules

- Make Copilots feel conversational, guidance-oriented, and user-facing.
- Do not make Copilots sound like autonomous Agents.
- Keep connected Agents as recommended tool guidance unless the real Agent binding exists.
- Avoid fake product screenshots, fake Yeeflow logos, unsupported tool claims, or guaranteed automation outcomes.
- Use enterprise-ready language: calm, specific, practical, and governed.
- If variable references are relevant, use `{{variableName}}`, but most reusable Copilots should avoid hardcoded variables unless the template has configured variables.

## Validation

Run:

```bash
node scripts/validate_copilot_instruction.js working/final-copilot-creation-manifest.json
```

<!-- agent-copilot-application-resource-learning:start -->
## App-Bound Copilot Instruction Guidance

App-contained Copilots may have bound tools. Instructions should distinguish conversational guidance from autonomous execution, name destructive or external actions as confirmation-required, and avoid claims for unconfigured tools. Quick prompts are export-proven as Suggestions on app-contained Copilots.

Connected-Agent tools should be described as delegated workflows only when the target Agent binding exists. External Outlook, SharePoint, OAuth, or HTTP tools must be framed as governed and credential-sensitive.
<!-- agent-copilot-application-resource-learning:end -->

<!-- scheduled-workflow-ai-assistant-learning:start -->
## Workflow Boundary Guidance

If a Copilot discusses workflow-generated email or scheduled updates, distinguish that from Copilot tool execution. `AI Agent and Copilot Local Resource Baseline8.yap` proves workflow AI Assistant can call an Agent and a later `MailTask` can send the generated content; the Copilot should not claim it personally sends scheduled email unless a Copilot tool does so.

Likewise, do not let a Copilot imply it personally performs list-triggered image extraction just because the app also contains a data-list workflow Agent. `Spark & AI (1).yap` proves a separate list workflow can pass image and row-ID inputs to an Agent and let the Agent update app data through a tool; that is workflow behavior, not Copilot chat behavior.
<!-- scheduled-workflow-ai-assistant-learning:end -->
