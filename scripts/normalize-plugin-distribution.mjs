#!/usr/bin/env node

import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const pluginRoot = resolve(process.argv[2] || "dist/yeeflow-app-builder-plugin");
const manifestPath = resolve(pluginRoot, ".codex-plugin/plugin.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

delete manifest.visibility;
delete manifest.category;
delete manifest.longDescription;
manifest.author = {
  name: "Yeeflow",
  url: "https://www.yeeflow.com",
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const legacyInstalled = resolve(pluginRoot, "skills/installed");
if (existsSync(legacyInstalled)) rmSync(legacyInstalled, { recursive: true, force: true });

const agents = {
  "yeeflow-knowledge-source-operator": agent(
    "Yeeflow Knowledge Source Operator",
    "Configure and validate Agent/Copilot knowledge sources.",
    "Use this skill to configure a Yeeflow Knowledge source, bind it to AI Agents or Copilots, and validate persisted bindings before publish or deletion.",
  ),
  "yeeflow-ai-agent-template-builder": agent(
    "Yeeflow AI Agent Template Builder",
    "Build Yeeflow AI Agent manifests.",
    "Use this skill to prepare Yeeflow AI Agent template manifests from source documents, icons, and prior export/import artifacts.",
  ),
  "yeeflow-dashboard-generator": agent(
    "Yeeflow Dashboard Generator",
    "Generate and debug Yeeflow dashboard packages from proven export patterns.",
    "Use this skill to study a dashboard export pattern, generate the smallest safe dashboard package, validate it, and prepare runtime import testing evidence.",
  ),
  "yeeflow-expression-generator": agent(
    "Yeeflow Expression Generator",
    "Generate and validate Yeeflow expression editor token arrays.",
    "Use SKILL.md as the entry point. Prefer normalized expression references and never invent Yeeflow functions, operators, or variable value types.",
  ),
  "yeeflow-ui-generation-hard-gates": agent(
    "Yeeflow UI Generation Hard Gates",
    "Enforce Yeeflow UI generation proof gates.",
    "Use this skill to require page-by-page UI contracts, export-proven styles, runtime screenshot evidence, and app identity stability before high-quality UI claims.",
  ),
  "yeeflow-approval-form-generator": agent(
    "Yeeflow Approval Form Generator",
    "Generate and validate Yeeflow approval form definitions safely.",
    "Use this skill to decompose requirements, generate approval form drafts, map dependencies, run validators, and build workflow wrappers only after validation passes.",
    true,
  ),
  "yeeflow-custom-code-generator": agent(
    "Yeeflow Custom Code Generator",
    "Generate, document, update, debug, and redesign Yeeflow custom code.",
    "Use this skill to generate or update Yeeflow custom code with explicit validation and runtime proof boundaries.",
    true,
  ),
  "yeeflow-custom-service-generator": agent(
    "Yeeflow Custom Service Generator",
    "Generate, inspect, validate, document, and debug Yeeflow Custom Service scripts.",
    "Use this skill to generate or validate Yeeflow Custom Service scripts with explicit schema and runtime proof boundaries.",
    true,
  ),
  "yeeflow-service-portal-generator": agent(
    "Yeeflow Service Portal Generator",
    "Plan, inspect, validate, and generate Yeeflow Service Portal payloads.",
    "Use this skill to plan and validate Yeeflow Service Portal resources while separating schema evidence from runtime proof.",
    true,
  ),
};

for (const [skill, contents] of Object.entries(agents)) {
  const target = resolve(pluginRoot, "skills", skill, "agents/openai.yaml");
  if (!existsSync(target)) throw new Error(`PLUGIN_DISTRIBUTION_AGENT_MISSING ${skill}`);
  writeFileSync(target, contents);
}

console.log(`PLUGIN_DISTRIBUTION_NORMALIZED skills=${Object.keys(agents).length}`);

function agent(displayName, shortDescription, defaultPrompt, implicit = false) {
  return [
    "interface:",
    `  display_name: ${yamlString(displayName)}`,
    `  short_description: ${yamlString(shortDescription)}`,
    `  default_prompt: ${yamlString(defaultPrompt)}`,
    ...(implicit ? ["policy:", "  allow_implicit_invocation: true"] : []),
    "",
  ].join("\n");
}

function yamlString(value) {
  return JSON.stringify(value);
}
