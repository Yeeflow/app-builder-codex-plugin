#!/usr/bin/env node

import { getCapability, summarizeCapability } from "./lib/yeeflow-api-capabilities.mjs";
import { buildLoginRequiredResult, mergeAuthHeaders, resolveYeeflowApiAuth, safeAuthError } from "./lib/yeeflow-api-auth.mjs";
import {
  assertApplicationDeleteConfirmation,
  expectedApplicationDeleteConfirmation,
  extractApplicationRecords,
  findVerifiedApplication,
  normalizeApplicationAppId,
  summarizeApplicationRecord,
} from "./lib/yeeflow-application-management.mjs";
import { APP_PACKAGE_WORKSPACE_CATEGORY, isDocumentedWorkspaceCategory } from "./lib/yeeflow-workspace-selection.mjs";

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printUsage();
  process.exit(0);
}

try {
  const category = args.category || APP_PACKAGE_WORKSPACE_CATEGORY;
  if (!isDocumentedWorkspaceCategory(category)) throw new Error("Workspace category must be settings or flowcraft.");
  const appID = normalizeApplicationAppId(args.appId);
  const deleteCapability = getCapability("applications.delete");
  const listCapability = getCapability("workspaces.applications.list");
  if (!args.execute) {
    const expectedConfirmation = args.expectedTitle
      ? expectedApplicationDeleteConfirmation(args.expectedTitle)
      : "DELETE APPLICATION: <exact application title>";
    console.log(JSON.stringify({
      resultClass: "dry_run",
      liveCall: false,
      deleteCapability: summarizeCapability(deleteCapability),
      preflightCapability: summarizeCapability(listCapability),
      category,
      appID,
      safeguards: {
        workspaceIdRequired: true,
        applicationIdRequired: true,
        exactTitleRequired: true,
        workspaceScopedReadbackRequired: true,
        exactIdAndTitleMatchRequired: true,
        strongConfirmationRequired: true,
        expectedConfirmation,
      },
      rawResponsePrinted: false,
      fullIdentifiersPrinted: false,
      note: "Dry run only. No API request was made. Add --execute only after the target workspace and exact application title are confirmed.",
    }, null, 2));
    process.exit(0);
  }

  if (!args.workspaceId) throw new Error("--workspace-id is required with --execute.");
  if (!args.applicationId) throw new Error("--application-id is required with --execute.");
  if (!args.expectedTitle) throw new Error("--expected-title is required with --execute.");
  assertApplicationDeleteConfirmation({ expectedTitle: args.expectedTitle, confirmation: args.confirmDelete });

  const auth = await resolveYeeflowApiAuth({ dotenv: args.dotenv || ".env.local", onDemandLogin: true, oauthOnly: true });
  if (auth.mode !== "oauth") {
    console.log(JSON.stringify(buildLoginRequiredResult({
      auth,
      originalOperation: "delete application after workspace-scoped preflight",
      originalCapability: deleteCapability.name,
      originalEndpoint: `${deleteCapability.method} ${deleteCapability.path}`,
      capability: summarizeCapability(deleteCapability),
    }), null, 2));
    process.exit(1);
  }

  const records = await fetchWorkspaceApplications({ auth, capability: listCapability, category, workspaceId: args.workspaceId, appID });
  const application = findVerifiedApplication(records, { applicationId: args.applicationId, expectedTitle: args.expectedTitle });
  const path = deleteCapability.path.replace("{id}", encodeURIComponent(args.applicationId));
  const url = new URL(`${auth.env.apiBaseUrl}${path}`);
  url.searchParams.set("appID", String(appID));
  const response = await fetch(url, {
    method: deleteCapability.method,
    headers: mergeAuthHeaders(auth, { Accept: "application/json" }),
  });
  const parsed = parseJson(await response.text());
  const apiStatus = parsed?.Status ?? parsed?.status ?? null;
  if (!response.ok || (apiStatus !== null && Number(apiStatus) !== 0)) {
    throw new Error(`Application delete was rejected (HTTP ${response.status}, API status ${apiStatus ?? "unavailable"}).`);
  }
  console.log(JSON.stringify({
    resultClass: "application_deleted",
    liveCall: true,
    capability: summarizeCapability(deleteCapability),
    preflight: "workspace-scoped-exact-id-and-title-match",
    application: summarizeApplicationRecord(application, 1),
    appID,
    httpStatus: response.status,
    apiStatus,
    rawResponsePrinted: false,
    fullIdentifiersPrinted: false,
    note: "API deletion accepted. A separate workspace application readback is required before claiming final absence.",
  }, null, 2));
} catch (error) {
  console.error(safeAuthError(error));
  process.exit(1);
}

async function fetchWorkspaceApplications({ auth, capability, category, workspaceId, appID }) {
  const path = capability.path
    .replace("{category}", encodeURIComponent(category))
    .replace("{id}", encodeURIComponent(workspaceId));
  const url = new URL(`${auth.env.apiBaseUrl}${path}`);
  url.searchParams.set("appID", String(appID));
  const response = await fetch(url, {
    method: capability.method,
    headers: mergeAuthHeaders(auth, { Accept: "application/json" }),
  });
  const parsed = parseJson(await response.text());
  const apiStatus = parsed?.Status ?? parsed?.status ?? null;
  if (!response.ok || (apiStatus !== null && Number(apiStatus) !== 0)) {
    throw new Error(`Application delete preflight failed (HTTP ${response.status}, API status ${apiStatus ?? "unavailable"}).`);
  }
  return extractApplicationRecords(parsed);
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") parsed.help = true;
    else if (token === "--execute") parsed.execute = true;
    else if (token === "--workspace-id") parsed.workspaceId = requireValue(argv, ++i, token);
    else if (token === "--application-id") parsed.applicationId = requireValue(argv, ++i, token);
    else if (token === "--expected-title") parsed.expectedTitle = requireValue(argv, ++i, token);
    else if (token === "--confirm-delete") parsed.confirmDelete = requireValue(argv, ++i, token);
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
  node scripts/yeeflow-application-delete.mjs --expected-title "Example App"
  node scripts/yeeflow-application-delete.mjs --workspace-id <workspace-id> --application-id <application-id> --expected-title "Example App" --confirm-delete "DELETE APPLICATION: Example App" --execute

The command is dry-run by default. Live deletion requires OAuth, a workspace-scoped application readback, exact application ID and title matching, and the exact strong-confirmation phrase. appID supports only 30 or 41 and defaults to 41. Raw responses and full identifiers are never printed.`);
}
