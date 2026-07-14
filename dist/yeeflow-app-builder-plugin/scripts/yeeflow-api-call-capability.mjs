#!/usr/bin/env node

import { getCapability, pathParamsFor, summarizeCapability } from "./lib/yeeflow-api-capabilities.mjs";
import { buildLoginRequiredResult, mergeAuthHeaders, resolveYeeflowApiAuth, safeAuthError } from "./lib/yeeflow-api-auth.mjs";
import { normalizeApplicationAppId, summarizeApplicationList } from "./lib/yeeflow-application-management.mjs";
import { summarizeWorkspaceList, summarizeWorkspaceRecord } from "./lib/yeeflow-workspace-selection.mjs";

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.name) {
  printUsage();
  process.exit(args.help ? 0 : 1);
}

try {
  const capability = getCapability(args.name);
  if (!capability) throw new Error(`Unknown Yeeflow API capability: ${args.name}`);
  if (!capability.readOnly) {
    throw new Error("This helper does not execute write capabilities. Use a dedicated guarded helper after explicit user confirmation.");
  }
  if (capability.method !== "GET") {
    throw new Error("This helper currently executes read-only GET capabilities only. Use a dedicated helper for documented read-only POST query operations.");
  }

  const params = parseParams(args.params);
  if (capability.name === "workspaces.applications.list") {
    params.appID = String(normalizeApplicationAppId(params.appID));
  }
  const urlPath = buildPath(capability, params);
  const query = buildQuery(capability, params);
  const auth = await resolveYeeflowApiAuth({ dotenv: args.dotenv || ".env.local" });
  if (auth.mode !== "oauth") {
    console.log(JSON.stringify(buildLoginRequiredResult({
      auth,
      originalCapability: capability.name,
      originalEndpoint: `${capability.method} ${capability.path}`,
      capability: summarizeCapability(capability),
    }), null, 2));
    process.exit(1);
  }
  const url = new URL(`${auth.env.apiBaseUrl}${urlPath}`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);

  const response = await fetch(url, {
    method: capability.method,
    headers: mergeAuthHeaders(auth, { Accept: "application/json" }),
  });
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  const parsed = parseJson(text);

  const output = {
    capability: summarizeCapability(capability),
    liveCall: true,
    httpStatus: response.status,
    ok: response.ok,
    contentType,
    responseKeys: parsed && typeof parsed === "object" ? Object.keys(parsed).slice(0, 20) : [],
    apiStatus: parsed?.Status ?? parsed?.status ?? null,
    dataShape: summarizeShape(parsed?.Data ?? parsed?.data ?? parsed),
  };
  if (capability.name === "workspaces.listByCategory") {
    output.workspaceSummary = summarizeWorkspaceList(parsed);
  } else if (capability.name === "workspaces.get") {
    const data = parsed?.Data ?? parsed?.data ?? parsed;
    output.workspaceSummary = data && typeof data === "object" && !Array.isArray(data)
      ? { workspaceCount: 1, workspaces: [summarizeWorkspaceRecord(data, 1)] }
      : { workspaceCount: 0, workspaces: [] };
  } else if (capability.name === "workspaces.applications.list") {
    output.applicationSummary = summarizeApplicationList(parsed);
  }

  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  console.error(safeAuthError(error));
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = { params: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") parsed.help = true;
    else if (token === "--name") {
      parsed.name = requireValue(argv, ++i, "--name");
    } else if (token === "--dotenv") {
      parsed.dotenv = requireValue(argv, ++i, "--dotenv");
    } else if (token === "--param") {
      parsed.params.push(requireValue(argv, ++i, "--param"));
    } else {
      throw new Error(`Unexpected argument: ${token}`);
    }
  }
  return parsed;
}

function requireValue(argv, index, label) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`${label} requires a value.`);
  return value;
}

function parseParams(values) {
  const params = {};
  for (const entry of values) {
    const index = entry.indexOf("=");
    if (index <= 0) throw new Error(`Invalid --param value: ${entry}`);
    params[entry.slice(0, index)] = entry.slice(index + 1);
  }
  return params;
}

function buildPath(capability, params) {
  let out = capability.path;
  for (const name of pathParamsFor(capability)) {
    const value = params[name];
    if (!value) throw new Error(`Missing required path parameter: ${name}`);
    out = out.replace(`{${name}}`, encodeURIComponent(value));
  }
  return out;
}

function buildQuery(capability, params) {
  const query = {};
  for (const entry of capability.requiredParams.concat(capability.optionalParams)) {
    const [location, name] = entry.split(":");
    if (location !== "query") continue;
    if (params[name]) query[name] = params[name];
    else if (capability.requiredParams.includes(entry)) throw new Error(`Missing required query parameter: ${name}`);
  }
  return query;
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function summarizeShape(value) {
  if (Array.isArray(value)) return { type: "array", count: value.length };
  if (value && typeof value === "object") return { type: "object", keys: Object.keys(value).slice(0, 20) };
  if (value === null || value === undefined) return null;
  return { type: typeof value };
}

function printUsage() {
  console.log(`Usage:
  node scripts/yeeflow-api-call-capability.mjs --name locations.list
  node scripts/yeeflow-api-call-capability.mjs --name locations.get --param id=<location-id>
  node scripts/yeeflow-api-call-capability.mjs --name workspaces.applications.list --param category=flowcraft --param id=<workspace-id> --param appID=41

Executes only mapped read-only GET capabilities through the OAuth/API auth wrapper. It does not support arbitrary raw paths and does not save raw responses. If OAuth is missing, normal user-facing flows should use the Yeeflow plugin login action; local OAuth CLI scripts are developer diagnostics only.`);
}
