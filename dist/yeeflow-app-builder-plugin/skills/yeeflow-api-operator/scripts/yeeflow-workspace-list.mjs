#!/usr/bin/env node

import { getCapability, summarizeCapability } from "./lib/yeeflow-api-capabilities.mjs";
import { mergeAuthHeaders, requireYeeflowApiAuth, safeAuthError } from "./lib/yeeflow-api-auth.mjs";
import { summarizeWorkspaceList } from "./lib/yeeflow-workspace-selection.mjs";

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printUsage();
  process.exit(0);
}

try {
  const category = args.category || args._[0] || "";
  if (!category) throw new Error("--category is required because no universal safe workspace category default is documented.");

  const capability = getCapability("workspaces.listByCategory");
  const auth = await requireYeeflowApiAuth({ dotenv: args.dotenv || ".env.local" });
  const url = new URL(`${auth.env.apiBaseUrl}${capability.path.replace("{category}", encodeURIComponent(category))}`);
  const response = await fetch(url, {
    method: capability.method,
    headers: mergeAuthHeaders(auth, { Accept: "application/json" }),
  });
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  const parsed = parseJson(text);
  const summary = parsed ? summarizeWorkspaceList(parsed) : { workspaceCount: 0, workspaces: [] };

  console.log(JSON.stringify({
    capability: summarizeCapability(capability),
    liveCall: true,
    category,
    httpStatus: response.status,
    ok: response.ok,
    contentType,
    apiStatus: parsed?.Status ?? parsed?.status ?? null,
    workspaceCount: summary.workspaceCount,
    workspaces: summary.workspaces,
    rawResponsePrinted: false,
  }, null, 2));
} catch (error) {
  console.error(safeAuthError(error));
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") parsed.help = true;
    else if (token === "--category") parsed.category = requireValue(argv, ++i, "--category");
    else if (token === "--dotenv") parsed.dotenv = requireValue(argv, ++i, "--dotenv");
    else if (token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    else parsed._.push(token);
  }
  return parsed;
}

function requireValue(argv, index, label) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`${label} requires a value.`);
  return value;
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function printUsage() {
  console.log(`Usage:
  node scripts/yeeflow-workspace-list.mjs --category <category>

Lists workspaces through documented GET /workspaces/{category}. Output is redacted and limited to count, title, category, status, and workspace ID preview.`);
}
