#!/usr/bin/env node

import { readFileSync } from "node:fs";
import zlib from "node:zlib";

const gzipPrefix = "[______gizp______]";
const asArray = (value) => Array.isArray(value) ? value : [];
const string = (value) => value === undefined || value === null ? "" : String(value).trim();
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const parse = (value) => { try { return typeof value === "string" ? JSON.parse(value) : value; } catch { return null; } };

function usage() {
  console.error("Usage: node scripts/validate-knowledge-source-bindings.mjs <app.yap-or-decoded-data.json> [--mode report|final] [--delete-target <knowledge-id>]");
  process.exit(1);
}

const args = { input: null, mode: "report", deleteTarget: null };
for (let index = 2; index < process.argv.length; index += 1) {
  const value = process.argv[index];
  if (value === "--mode") args.mode = process.argv[++index];
  else if (value === "--delete-target") args.deleteTarget = process.argv[++index];
  else if (!args.input) args.input = value;
  else usage();
}
if (!args.input || !["report", "final"].includes(args.mode)) usage();

let data = JSON.parse(readFileSync(args.input, "utf8"));
if (object(data) && typeof data.Resource === "string" && data.Resource.startsWith(gzipPrefix)) {
  data = parse(JSON.parse(zlib.gunzipSync(Buffer.from(data.Resource.slice(gzipPrefix.length), "base64")).toString("utf8")).Data);
} else if (object(data) && typeof data.Data === "string") data = parse(data.Data) ?? data;
const entries = (type) => {
  const direct = data && data[type];
  if (Array.isArray(direct)) return direct;
  const module = asArray(data && data.OtherModules).find((item) => item && item.Type === type);
  return module ? asArray(parse(module.Data) ?? module.Data) : [];
};
const findings = [];
const add = (severity, code, message, context = {}) => findings.push({ severity, code, message, ...context });
const required = args.mode === "final" ? "error" : "warning";
const knowledges = entries("Knowledges");
const resources = entries("Agents").filter((item) => [0, 1].includes(Number(item.Type)));
const byId = new Map();
for (const [index, knowledge] of knowledges.entries()) {
  const id = string(knowledge.ID); const name = string(knowledge.Name); const datas = asArray(knowledge.Datas);
  if (!id || byId.has(id)) add("error", !id ? "KNOWLEDGE_ID_MISSING" : "KNOWLEDGE_ID_DUPLICATE", "Knowledge source needs a unique ID.", { index, id, name }); else byId.set(id, knowledge);
  if (!name) add(required, "KNOWLEDGE_NAME_MISSING", "Knowledge source is missing Name.", { id, index });
  if (!datas.length) add(required, "KNOWLEDGE_DATAS_EMPTY", "Knowledge source must contain Datas.", { id, name });
  for (const [dataIndex, entry] of datas.entries()) {
    if (!string(entry.Source)) add(required, "KNOWLEDGE_DATA_SOURCE_MISSING", "Knowledge Datas entry is missing Source.", { knowledgeId: id, dataIndex });
    if (entry.Type === undefined || entry.Type === null || entry.Type === "") add(required, "KNOWLEDGE_DATA_TYPE_MISSING", "Knowledge Datas entry is missing Type.", { knowledgeId: id, dataIndex });
  }
}
const references = new Map([...byId.keys()].map((id) => [id, []]));
for (const resource of resources) {
  const bound = new Set(); const resourceName = string(resource.Name); const settings = parse(resource.Settings) ?? {}; const draft = parse(resource.Draft) ?? {};
  for (const [componentIndex, component] of asArray(resource.Components).entries()) {
    if (Number(component.Type) !== 1) continue;
    const componentSettings = parse(component.Settings) ?? {}; const source = string(component.Source) || string(componentSettings.Data && componentSettings.Data.Value);
    if (!source) { add(required, "AI_KNOWLEDGE_SOURCE_MISSING", "AI knowledge component must include Source.", { resource: resourceName, componentIndex }); continue; }
    const knowledge = byId.get(source);
    if (!knowledge) { add(required, "AI_KNOWLEDGE_SOURCE_UNRESOLVED", "AI knowledge component Source is unresolved.", { resource: resourceName, componentIndex, source }); continue; }
    if (string(component.Name) && string(component.Name) !== string(knowledge.Name)) add(required, "AI_KNOWLEDGE_NAME_MISMATCH", "AI knowledge component Name must match the Knowledge resource.", { resource: resourceName, componentIndex, source });
    bound.add(source); references.get(source).push({ resourceId: string(resource.ID), resourceName, resourceType: Number(resource.Type) });
  }
  const content = [settings.Prompt, settings.Instructions, draft.Prompt, draft.Instructions].filter((value) => typeof value === "string").join("\n").toLowerCase();
  for (const [knowledgeId, knowledge] of byId) {
    const aliases = [knowledge.Name, ...asArray(knowledge.Datas).map((entry) => entry.Name)].map(string).filter((value) => value.length > 2);
    if (aliases.some((alias) => content.includes(alias.toLowerCase())) && !bound.has(knowledgeId)) add(required, "AI_KNOWLEDGE_CLAIM_UNBOUND", "Agent/Copilot claims an unbound Knowledge source.", { resource: resourceName, knowledgeId, knowledgeName: string(knowledge.Name) });
  }
}
if (args.deleteTarget) {
  if (!byId.has(args.deleteTarget)) add("error", "KNOWLEDGE_DELETE_TARGET_UNRESOLVED", "Delete target does not resolve to a Knowledge resource.", { knowledgeId: args.deleteTarget });
  else if (references.get(args.deleteTarget).length) add("error", "KNOWLEDGE_DELETE_REFERENCED", "Knowledge source still has Agent/Copilot references.", { knowledgeId: args.deleteTarget, references: references.get(args.deleteTarget) });
}
const result = { status: findings.some((item) => item.severity === "error") ? "fail" : "pass", mode: args.mode, summary: { knowledges: knowledges.length, aiResources: resources.length, knowledgeBindings: [...references.values()].reduce((total, items) => total + items.length, 0), reverseReferences: Object.fromEntries(references) }, findings };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === "pass" ? 0 : 1;
