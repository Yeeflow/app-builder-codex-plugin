#!/usr/bin/env node

import { getCapability, summarizeCapability } from "./lib/yeeflow-api-capabilities.mjs";
import { mergeAuthHeaders, requireYeeflowOAuthAuth, safeAuthError } from "./lib/yeeflow-api-auth.mjs";
import {
  APP_PACKAGE_WORKSPACE_CATEGORY,
  combineWorkspaceSummaries,
  DOCUMENTED_WORKSPACE_CATEGORIES,
  isDocumentedWorkspaceCategory,
  summarizeWorkspaceList,
} from "./lib/yeeflow-workspace-selection.mjs";

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printUsage();
  process.exit(0);
}

try {
  const category = args.category || args._[0] || "";
  const categories = args.all
    ? DOCUMENTED_WORKSPACE_CATEGORIES
    : [category || APP_PACKAGE_WORKSPACE_CATEGORY];
  for (const value of categories) {
    if (!isDocumentedWorkspaceCategory(value)) {
      throw new Error(`Workspace category must be one of: ${DOCUMENTED_WORKSPACE_CATEGORIES.join(", ")}.`);
    }
  }

  const capability = getCapability("workspaces.listByCategory");
  const auth = await requireYeeflowOAuthAuth({ dotenv: args.dotenv || ".env.local" });
  const summaries = [];
  for (const value of categories) {
    summaries.push(await fetchWorkspaceCategory({ auth, capability, category: value }));
  }
  const combined = combineWorkspaceSummaries(summaries);

  console.log(JSON.stringify({
    capability: summarizeCapability(capability),
    liveCall: true,
    authMode: "oauth",
    mode: args.all ? "all-documented-categories" : "category",
    categories,
    appPackageWorkspaceCategory: APP_PACKAGE_WORKSPACE_CATEGORY,
    category: args.all ? null : categories[0],
    results: summaries.map(({ workspaces, ...summary }) => summary),
    workspaceCount: combined.workspaceCount,
    workspaces: combined.workspaces,
    rawResponsePrinted: false,
  }, null, 2));
} catch (error) {
  console.error(safeAuthError(error));
  process.exit(1);
}

async function fetchWorkspaceCategory({ auth, capability, category }) {
  const url = new URL(`${auth.env.apiBaseUrl}${capability.path.replace("{category}", encodeURIComponent(category))}`);
  const response = await fetch(url, {
    method: capability.method,
    headers: mergeAuthHeaders(auth, { Accept: "application/json" }),
  });
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  const parsed = parseJson(text);
  const summary = parsed ? summarizeWorkspaceList(parsed) : { workspaceCount: 0, workspaces: [] };
  return {
    category,
    httpStatus: response.status,
    ok: response.ok,
    contentType,
    apiStatus: parsed?.Status ?? parsed?.status ?? null,
    workspaceCount: summary.workspaceCount,
    workspaces: summary.workspaces,
  };
}

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") parsed.help = true;
    else if (token === "--all") parsed.all = true;
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
  node scripts/yeeflow-workspace-list.mjs --all
  node scripts/yeeflow-workspace-list.mjs --category settings
  node scripts/yeeflow-workspace-list.mjs --category flowcraft

Lists workspaces through documented OAuth read-only GET /workspaces/{category}. Documented categories are settings and flowcraft. Output is redacted and limited to count, title/displayName, category, status, status provenance, and workspace ID preview. For app package install/import workflows, flowcraft is the relevant workspace category unless product/API docs change.`);
}
