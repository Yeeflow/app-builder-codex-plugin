#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";

function usage(exitCode = 1) {
  const output = [
    "Usage:",
    "  node scripts/validate-knowledge-source-bindings.mjs <app.yap|decoded-data.json> [--mode report|final] [--delete-target <knowledge-id>]",
    "",
    "Validates Knowledge source configuration, AI Agent/Copilot Type 1 bindings, prompt claims, and safe deletion references.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(output);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, mode: "report", deleteTarget: null };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--mode") args.mode = argv[++index];
    else if (value === "--delete-target") args.deleteTarget = argv[++index];
    else if (!args.input) args.input = value;
    else usage();
  }
  if (!args.input || !["report", "final"].includes(args.mode) || (args.deleteTarget === "")) usage();
  return args;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function tryParseJson(value) {
  if (isObject(value) || Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function decodeInput(inputPath) {
  const parsed = JSON.parse(readFileSync(inputPath, "utf8"));
  if (isObject(parsed) && typeof parsed.Resource === "string" && parsed.Resource.startsWith(GZIP_PREFIX)) {
    const decoded = zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
    const resource = JSON.parse(decoded);
    return tryParseJson(resource.Data) ?? resource;
  }
  if (isObject(parsed) && typeof parsed.Data === "string") return tryParseJson(parsed.Data) ?? parsed;
  return parsed;
}

function moduleEntries(data, type) {
  if (!isObject(data)) return [];
  const direct = data[type];
  if (Array.isArray(direct)) return direct;
  const module = asArray(data.OtherModules).find((entry) => entry && entry.Type === type);
  if (!module) return [];
  const parsed = tryParseJson(module.Data);
  return asArray(parsed ?? module.Data);
}

function textFields(resource) {
  const settings = tryParseJson(resource.Settings) ?? {};
  const draft = tryParseJson(resource.Draft) ?? {};
  return [settings.Prompt, settings.Instructions, draft.Prompt, draft.Instructions].filter((value) => typeof value === "string").join("\n");
}

function sourceId(component) {
  const direct = safeString(component.Source);
  if (direct) return direct;
  const settings = tryParseJson(component.Settings);
  return safeString(settings && settings.Data && settings.Data.Value);
}

function includesAlias(text, alias) {
  const normalized = safeString(alias).toLocaleLowerCase();
  return normalized.length > 2 && text.toLocaleLowerCase().includes(normalized);
}

function run(data, args) {
  const findings = [];
  const add = (severity, code, message, context = {}) => findings.push({ severity, code, message, ...context });
  const finalSeverity = args.mode === "final" ? "error" : "warning";
  const knowledges = moduleEntries(data, "Knowledges");
  const resources = moduleEntries(data, "Agents").filter((resource) => [0, 1].includes(Number(resource.Type)));
  const knowledgeById = new Map();

  knowledges.forEach((knowledge, index) => {
    const id = safeString(knowledge.ID);
    const name = safeString(knowledge.Name);
    if (!id) add("error", "KNOWLEDGE_ID_MISSING", "Knowledge source is missing ID.", { index, name });
    else if (knowledgeById.has(id)) add("error", "KNOWLEDGE_ID_DUPLICATE", "Knowledge source ID is duplicated.", { index, id, name });
    else knowledgeById.set(id, knowledge);
    if (!name) add(finalSeverity, "KNOWLEDGE_NAME_MISSING", "Knowledge source is missing Name.", { index, id });
    const datas = asArray(knowledge.Datas);
    if (!datas.length) add(finalSeverity, "KNOWLEDGE_DATAS_EMPTY", "Knowledge source must contain at least one Datas entry.", { id, name });
    datas.forEach((entry, dataIndex) => {
      if (!safeString(entry.Source)) add(finalSeverity, "KNOWLEDGE_DATA_SOURCE_MISSING", "Knowledge Datas entry is missing Source.", { knowledgeId: id, dataIndex });
      if (entry.Type === undefined || entry.Type === null || entry.Type === "") add(finalSeverity, "KNOWLEDGE_DATA_TYPE_MISSING", "Knowledge Datas entry is missing Type.", { knowledgeId: id, dataIndex });
      if (entry.Settings !== undefined && entry.Settings !== null && entry.Settings !== "" && !tryParseJson(entry.Settings)) {
        add(finalSeverity, "KNOWLEDGE_DATA_SETTINGS_INVALID", "Knowledge Datas Settings must be parseable JSON when present.", { knowledgeId: id, dataIndex });
      }
    });
  });

  const references = new Map([...knowledgeById.keys()].map((id) => [id, []]));
  resources.forEach((resource, resourceIndex) => {
    const resourceName = safeString(resource.Name);
    const bindings = new Set();
    asArray(resource.Components).forEach((component, componentIndex) => {
      if (Number(component.Type) !== 1) return;
      const linkedId = sourceId(component);
      const componentName = safeString(component.Name);
      if (!linkedId) {
        add(finalSeverity, "AI_KNOWLEDGE_SOURCE_MISSING", "AI knowledge component must contain the exact Knowledge Source ID.", { resource: resourceName, resourceIndex, componentIndex, component: componentName });
        return;
      }
      const knowledge = knowledgeById.get(linkedId);
      if (!knowledge) {
        add(finalSeverity, "AI_KNOWLEDGE_SOURCE_UNRESOLVED", "AI knowledge component Source does not resolve to an included Knowledge resource.", { resource: resourceName, resourceIndex, componentIndex, component: componentName, source: linkedId });
        return;
      }
      const knowledgeName = safeString(knowledge.Name);
      if (componentName && knowledgeName && componentName !== knowledgeName) {
        add(finalSeverity, "AI_KNOWLEDGE_NAME_MISMATCH", "AI knowledge component Name must match the referenced Knowledge resource.", { resource: resourceName, componentIndex, component: componentName, source: linkedId, knowledgeName });
      }
      bindings.add(linkedId);
      references.get(linkedId).push({ resourceId: safeString(resource.ID), resourceName, resourceType: Number(resource.Type) });
    });
    const content = textFields(resource);
    const claimsKnowledge = /\bknowledge(?:\s+(?:base|source|sources))?\b/i.test(content);
    for (const [knowledgeId, knowledge] of knowledgeById) {
      const aliases = [knowledge.Name, ...asArray(knowledge.Datas).map((entry) => entry.Name)];
      const namesSource = aliases.some((alias) => includesAlias(content, alias));
      if ((namesSource || (claimsKnowledge && includesAlias(content, knowledge.Name))) && !bindings.has(knowledgeId)) {
        add(finalSeverity, "AI_KNOWLEDGE_CLAIM_UNBOUND", "Agent/Copilot prompt or instructions claim a Knowledge source that is not bound in Components.", { resource: resourceName, resourceIndex, knowledgeId, knowledgeName: safeString(knowledge.Name) });
      }
    }
  });

  if (args.deleteTarget) {
    if (!knowledgeById.has(args.deleteTarget)) add("error", "KNOWLEDGE_DELETE_TARGET_UNRESOLVED", "Delete target does not resolve to an included Knowledge resource.", { knowledgeId: args.deleteTarget });
    else if (references.get(args.deleteTarget).length) add("error", "KNOWLEDGE_DELETE_REFERENCED", "Knowledge source cannot be deleted while Agent/Copilot components still reference it.", { knowledgeId: args.deleteTarget, references: references.get(args.deleteTarget) });
  }

  const errors = findings.filter((finding) => finding.severity === "error");
  return {
    status: errors.length ? "fail" : "pass",
    input: basename(args.input),
    mode: args.mode,
    summary: {
      knowledges: knowledges.length,
      aiResources: resources.length,
      knowledgeBindings: [...references.values()].reduce((sum, entries) => sum + entries.length, 0),
      reverseReferences: Object.fromEntries(references),
    },
    findings,
  };
}

const args = parseArgs(process.argv);
const result = run(decodeInput(resolve(args.input)), args);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === "pass" ? 0 : 1;
