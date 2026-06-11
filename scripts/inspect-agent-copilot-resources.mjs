#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const SENSITIVE_KEY_RE = /(token|secret|password|credential|clientid|clientsecret|apikey|api_key|accesskey|authorization|endpoint|baseurl|url|scope|tenant|userid|createdby|modifiedby|publisher)/i;
const TOKENISH_VALUE_RE = /^[A-Za-z0-9_\-.+/=]{32,}$/;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-agent-copilot-resources.mjs <app.yap|decoded-data.json> --out <dir>",
    "",
    "Creates sanitized normalized references for Yeeflow AI Agents, Copilots, connections, and AI tools.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, out: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") args.out = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input || !args.out) usage();
  return args;
}

function quoteLargeIntegers(jsonText, largeNumbers) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;
  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else out += token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function parseMaybeJson(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function decodeInput(inputPath) {
  const largeNumbers = new Set();
  const parsed = parseJson(fs.readFileSync(inputPath, "utf8"), largeNumbers);
  if (parsed && typeof parsed.Resource === "string") {
    const compressed = Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64");
    const resource = parseJson(zlib.gunzipSync(compressed).toString("utf8"), largeNumbers);
    return { data: parseJson(resource.Data, largeNumbers), resource, largeNumbers };
  }
  if (parsed && typeof parsed.Data === "string") {
    return { data: parseJson(parsed.Data, largeNumbers), resource: parsed, largeNumbers };
  }
  return { data: parsed, resource: null, largeNumbers };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function slug(value, fallback) {
  const base = String(value || fallback || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return base || fallback || "item";
}

function redactValue(key, value) {
  if (SENSITIVE_KEY_RE.test(key)) {
    if (/endpoint|baseurl|url/i.test(key)) return "<REDACTED_ENDPOINT>";
    if (/clientid/i.test(key)) return "<REDACTED_CLIENT_ID>";
    if (/clientsecret|secret/i.test(key)) return "<REDACTED_CLIENT_SECRET>";
    if (/token/i.test(key)) return "<REDACTED_ACCESS_TOKEN>";
    if (/tenant/i.test(key)) return "<REDACTED_TENANT_ID>";
    if (/scope/i.test(key)) return Array.isArray(value) ? value.map(() => "<REDACTED_SCOPE>") : "<REDACTED_SCOPE>";
    return "<REDACTED_VALUE>";
  }
  if (typeof value === "string" && TOKENISH_VALUE_RE.test(value) && !LARGE_INTEGER_RE.test(value)) return "<REDACTED_TOKEN_LIKE_VALUE>";
  return value;
}

function sanitize(value, key = "") {
  if (Array.isArray(value)) return value.map((item) => sanitize(item, key));
  if (!isObject(value)) return redactValue(key, value);
  const out = {};
  for (const [childKey, childValue] of Object.entries(value)) out[childKey] = sanitize(childValue, childKey);
  return out;
}

function outputShape(io) {
  return asArray(io).map((item) => ({
    id: item.Id || item.id || null,
    name: item.Name || item.name || null,
    label: item.Label || item.label || null,
    type: item.Type || item.type || null,
    fillType: item.FillType || item.fillType || null,
    hasValue: item.Value !== undefined,
    valueShape: item.Value === undefined ? null : sanitize(item.Value),
    descriptionPresent: Boolean(item.Desc || item.description),
  }));
}

function collectResources(data) {
  const lists = new Map();
  for (const item of [data.Item, ...asArray(data.Childs)].filter(Boolean)) {
    const model = item.ListModel || {};
    if (model.ListID) {
      lists.set(String(model.ListID), {
        referenceKey: `list:${slug(model.Title, model.ListID)}`,
        title: model.Title || null,
        listType: model.Type || null,
        fieldCount: asArray(item.Defs).length,
      });
    }
  }
  return lists;
}

function normalizeConnection(connection, index) {
  const config = parseMaybeJson(connection.Config) || {};
  return {
    referenceKey: `connection:${slug(connection.Name, `connection-${index + 1}`)}`,
    sourceId: "<REDACTED_CONNECTION_ID>",
    originalSourceIdPresent: Boolean(connection.ID),
    name: connection.Name || null,
    type: connection.Type,
    status: connection.Status,
    providerClass: connection.Type === 10 ? "HTTP API / Generic" : connection.Type === 11 ? "OAuth 2.0 API" : "unclassified",
    configKeys: Object.keys(config),
    safeConfig: sanitize(config),
    importPolicy: "Do not copy live credentials. Generated packages may include placeholder references only after import behavior is proven; require post-import reconfiguration.",
  };
}

function componentKind(component) {
  if (component.Type === 1) return "knowledge";
  if (component.Type === 2) return "tool";
  return "unknown";
}

function normalizeComponent(component, maps, index) {
  const settings = parseMaybeJson(component.Settings) || {};
  const dataRef = isObject(settings.Data) ? settings.Data : {};
  const value = dataRef.Value === undefined ? null : String(dataRef.Value);
  const linkedConnection = value && maps.connectionById.get(value);
  const linkedApp = value && value === maps.rootListSetId;
  const linkedList = !linkedApp && value && maps.listById.get(value);
  const linkedKnowledge = value && maps.knowledgeById.get(value);
  const linkedAiResource = value && maps.aiResourceById.get(value);
  const operations = asArray(settings.operations).map((operation) => sanitize(operation));
  return {
    referenceKey: `component:${slug(component.Name, `component-${index + 1}`)}`,
    sourceId: "<REDACTED_COMPONENT_ID>",
    name: component.Name || null,
    type: component.Type,
    subType: component.SubType || null,
    kind: componentKind(component),
    status: component.Status,
    descriptionPresent: Boolean(component.Description),
    settingsKeys: isObject(settings) ? Object.keys(settings) : [],
    dataReference: {
      scope: dataRef.Scope || null,
      appIdPresent: dataRef.AppID !== undefined && dataRef.AppID !== null,
      listSetIdPresent: dataRef.ListSetID !== undefined && dataRef.ListSetID !== null,
      valueType: value ? linkedConnection ? "connection" : linkedApp ? "application" : linkedList ? "list" : linkedKnowledge ? "knowledge" : linkedAiResource ? "ai-resource" : "unresolved" : null,
      targetKey: linkedConnection?.referenceKey || (linkedApp ? "application:current" : null) || linkedList?.referenceKey || linkedKnowledge?.referenceKey || linkedAiResource?.referenceKey || null,
    },
    runType: settings.runType || null,
    userType: settings.userType || null,
    credentialstype: settings.credentialstype || null,
    contentType: settings.contentType || null,
    resType: settings.resType || null,
    hasSchema: Boolean(settings.schema),
    operationCount: operations.length,
    operations,
    resources: sanitize(settings.resources || null),
    inputs: outputShape(settings.Inputs),
    outputs: outputShape(settings.Outputs),
    runtimePolicy: linkedConnection ? "External connection tool; do not runtime-test without safe test credentials." : "Local/app resource tool; validate references before runtime testing.",
  };
}

function normalizeAgent(agent, maps, index) {
  const settings = parseMaybeJson(agent.Settings) || {};
  const draft = parseMaybeJson(agent.Draft) || {};
  const typeName = agent.Type === 1 ? "copilot" : agent.Type === 0 ? "ai-agent" : "unknown";
  const components = asArray(agent.Components).map((component, componentIndex) => normalizeComponent(component, maps, componentIndex));
  return {
    referenceKey: `${typeName}:${slug(agent.Name, `ai-resource-${index + 1}`)}`,
    sourceId: agent.Type === 1 ? "<REDACTED_COPILOT_ID>" : "<REDACTED_AGENT_ID>",
    name: agent.Name || null,
    type: agent.Type,
    typeName,
    status: agent.Status,
    isPublished: Boolean(agent.IsPublished),
    descriptionPresent: Boolean(agent.Description),
    iconShape: parseMaybeJson(agent.IconUrl),
    settingsKeys: Object.keys(settings),
    draftKeys: Object.keys(draft),
    promptStorage: settings.Prompt !== undefined || draft.Prompt !== undefined ? "Prompt" : null,
    instructionStorage: settings.Instructions !== undefined || draft.Instructions !== undefined ? "Instructions" : null,
    model: sanitize(settings.Model || settings.ModelId || draft.Model || draft.ModelId || null),
    inputVariables: outputShape(settings.InputVariables || draft.InputVariables),
    outputVariables: outputShape(settings.OutputVariables || draft.OutputVariables),
    suggestions: sanitize(settings.Suggestions || draft.Suggestions || []),
    skills: sanitize(settings.Skills || draft.Skills || []),
    components,
    componentCounts: {
      knowledge: components.filter((component) => component.kind === "knowledge").length,
      tools: components.filter((component) => component.kind === "tool").length,
      externalConnectionTools: components.filter((component) => component.dataReference.valueType === "connection").length,
      localListTools: components.filter((component) => component.dataReference.valueType === "list").length,
      applicationResourceTools: components.filter((component) => component.dataReference.valueType === "application").length,
      connectedAgentTools: components.filter((component) => component.dataReference.valueType === "ai-resource").length,
      unresolved: components.filter((component) => component.dataReference.valueType === "unresolved").length,
    },
  };
}

function main() {
  const args = parseArgs(process.argv);
  const { data, resource, largeNumbers } = decodeInput(args.input);
  const modules = Object.fromEntries(asArray(data.OtherModules).map((module) => [module.Type, parseMaybeJson(module.Data)]));
  const listById = collectResources(data);
  const connections = asArray(modules.Connections).map(normalizeConnection);
  const connectionById = new Map(asArray(modules.Connections).map((connection, index) => [String(connection.ID), connections[index]]));
  const aiResourceById = new Map(asArray(modules.Agents).map((agent, index) => [
    String(agent.ID),
    {
      referenceKey: `${agent.Type === 1 ? "copilot" : agent.Type === 0 ? "ai-agent" : "ai-resource"}:${slug(agent.Name, `ai-resource-${index + 1}`)}`,
      name: agent.Name || null,
      type: agent.Type,
    },
  ]));
  const knowledgeById = new Map(asArray(modules.Knowledges).map((knowledge, index) => [
    String(knowledge.ID),
    {
      referenceKey: `knowledge:${slug(knowledge.Name, `knowledge-${index + 1}`)}`,
      sourceId: "<REDACTED_KNOWLEDGE_ID>",
      name: knowledge.Name || null,
      dataCount: asArray(knowledge.Datas).length,
      datas: asArray(knowledge.Datas).map((item) => ({
        referenceKey: `knowledge-data:${slug(item.Name, item.ID)}`,
        sourceId: "<REDACTED_KNOWLEDGE_DATA_ID>",
        name: item.Name || null,
        type: item.Type,
        settings: sanitize(parseMaybeJson(item.Settings) || {}),
      })),
    },
  ]));
  const maps = {
    listById,
    connectionById,
    knowledgeById,
    aiResourceById,
    rootListSetId: String(data.Item?.ListModel?.ListID || ""),
  };
  const aiResources = asArray(modules.Agents).map((agent, index) => normalizeAgent(agent, maps, index));
  const agents = aiResources.filter((item) => item.typeName === "ai-agent");
  const copilots = aiResources.filter((item) => item.typeName === "copilot");
  const tools = aiResources.flatMap((agent) => agent.components.map((component) => ({ ownerKey: agent.referenceKey, ownerName: agent.name, ownerType: agent.typeName, ...component })));
  const knowledges = [...knowledgeById.values()];
  const summary = {
    input: path.resolve(args.input),
    generatedAt: new Date().toISOString(),
    sourceTitle: data.Item?.ListModel?.Title || null,
    rawExportNotIncluded: true,
    largeNumericIdsPreserved: largeNumbers.size,
    replaceIds: asArray(resource?.ReplaceIds).length,
    counts: {
      agents: agents.length,
      copilots: copilots.length,
      connections: connections.length,
      knowledges: knowledges.length,
      aiTools: tools.length,
      childResources: asArray(data.Childs).length,
    },
    connectionTypes: connections.map((connection) => ({ referenceKey: connection.referenceKey, name: connection.name, type: connection.type, providerClass: connection.providerClass })),
    safety: {
      secretsRedacted: true,
      externalRuntimeCallsAllowed: false,
      baselineGenerationRecommended: false,
      reason: "Export proves rich resource shapes, but generated import behavior for app-owned Agents/Copilots/Connections is not runtime-proven.",
    },
  };

  fs.mkdirSync(args.out, { recursive: true });
  const files = {
    "summary.normalized.json": summary,
    "ai-agent-resource-reference.normalized.json": { summary: { count: agents.length }, agents },
    "copilot-resource-reference.normalized.json": { summary: { count: copilots.length }, copilots },
    "application-connection-reference.normalized.json": { summary: { count: connections.length }, connections },
    "agent-copilot-tool-reference.normalized.json": { summary: { count: tools.length }, tools, knowledges },
  };
  for (const [fileName, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(args.out, fileName), `${JSON.stringify(content, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({ status: "pass", out: path.resolve(args.out), files: Object.keys(files), summary }, null, 2));
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: [{ code: "INSPECT_AGENT_COPILOT_FAILED", message: error.message }] }, null, 2));
  process.exit(1);
}
