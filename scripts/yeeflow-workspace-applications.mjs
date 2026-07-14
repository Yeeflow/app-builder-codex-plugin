#!/usr/bin/env node

import { getCapability, summarizeCapability } from "./lib/yeeflow-api-capabilities.mjs";
import { buildLoginRequiredResult, mergeAuthHeaders, resolveYeeflowApiAuth, safeAuthError } from "./lib/yeeflow-api-auth.mjs";
import { normalizeApplicationAppId, summarizeApplicationList } from "./lib/yeeflow-application-management.mjs";
import { APP_PACKAGE_WORKSPACE_CATEGORY, isDocumentedWorkspaceCategory } from "./lib/yeeflow-workspace-selection.mjs";

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printUsage();
  process.exit(0);
}

try {
  const category = args.category || APP_PACKAGE_WORKSPACE_CATEGORY;
  if (!isDocumentedWorkspaceCategory(category)) throw new Error("Workspace category must be settings or flowcraft.");
  if (!args.workspaceId) throw new Error("--workspace-id is required.");
  const appID = normalizeApplicationAppId(args.appId);
  const capability = getCapability("workspaces.applications.list");
  const auth = await resolveYeeflowApiAuth({ dotenv: args.dotenv || ".env.local" });
  if (auth.mode !== "oauth") {
    console.log(JSON.stringify(buildLoginRequiredResult({
      auth,
      originalOperation: "workspace application discovery",
      originalCapability: capability.name,
      originalEndpoint: `${capability.method} ${capability.path}`,
      capability: summarizeCapability(capability),
    }), null, 2));
    process.exit(1);
  }

  const path = capability.path
    .replace("{category}", encodeURIComponent(category))
    .replace("{id}", encodeURIComponent(args.workspaceId));
  const url = new URL(`${auth.env.apiBaseUrl}${path}`);
  url.searchParams.set("appID", String(appID));
  const response = await fetch(url, {
    method: capability.method,
    headers: mergeAuthHeaders(auth, { Accept: "application/json" }),
  });
  const parsed = parseJson(await response.text());
  const apiStatus = parsed?.Status ?? parsed?.status ?? null;
  if (!response.ok || (apiStatus !== null && Number(apiStatus) !== 0)) {
    throw new Error(`Workspace application lookup failed (HTTP ${response.status}, API status ${apiStatus ?? "unavailable"}).`);
  }
  const summary = summarizeApplicationList(parsed);
  console.log(JSON.stringify({
    capability: summarizeCapability(capability),
    liveCall: true,
    authMode: "oauth",
    category,
    appID,
    httpStatus: response.status,
    ok: response.ok,
    apiStatus,
    ...summary,
    rawResponsePrinted: false,
    fullIdentifiersPrinted: false,
  }, null, 2));
} catch (error) {
  console.error(safeAuthError(error));
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") parsed.help = true;
    else if (token === "--workspace-id") parsed.workspaceId = requireValue(argv, ++i, token);
    else if (token === "--category") parsed.category = requireValue(argv, ++i, token);
    else if (token === "--app-id") parsed.appId = requireValue(argv, ++i, token);
    else if (token === "--dotenv") parsed.dotenv = requireValue(argv, ++i, token);
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return parsed;
}

function requireValue(argv, index, label) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`${label} requires a value.`);
  return value;
}

function parseJson(text) {
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

function printUsage() {
  console.log(`Usage:
  node scripts/yeeflow-workspace-applications.mjs --workspace-id <workspace-id> [--category flowcraft] [--app-id 41]

Performs the documented read-only workspace application lookup. appID supports only 30 or 41 and defaults to 41. Output contains titles and redacted application ID previews; it never prints raw API responses, full workspace IDs, or full application IDs.`);
}
