#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { environmentPresence, loadDotenvFile, resolveYeeflowEnvironment } from "./yeeflow-env-utils.mjs";
import { getCapability } from "./lib/yeeflow-api-capabilities.mjs";
import { buildLoginRequiredResult, mergeAuthHeaders, resolveYeeflowApiAuth, safeAuthError } from "./lib/yeeflow-api-auth.mjs";
import {
  APP_PACKAGE_WORKSPACE_CATEGORY,
  PACKAGE_WORKSPACE_OPERATIONS,
  WORKSPACE_SELECTION_REQUIRED,
  redactWorkspaceId,
  requireTargetWorkspaceId,
  resolveTargetWorkspaceId,
  summarizeWorkspaceRecord,
  summarizeWorkspaceList,
} from "./lib/yeeflow-workspace-selection.mjs";
import { validateYapkUpgradeIdStability } from "./validate-yapk-upgrade-id-stability.mjs";

const OPERATIONS = new Set(["upload", "import-yap", "install-yapk", "upgrade-check-yapk", "upgrade-apply-yapk", "upgrade-yapk"]);
const YAPK_UPGRADE_OPERATIONS = new Set(["upgrade-check-yapk", "upgrade-apply-yapk", "upgrade-yapk"]);

if (isMainModule()) {
  await main();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.operation || !OPERATIONS.has(args.operation)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }

  loadDotenvFile(fs, args.dotenv || ".env.local");
  const env = resolveYeeflowEnvironment(process.env);
  const workspaceResolution = resolveTargetWorkspaceId({
    cliWorkspaceId: args.workspaceId,
    envWorkspaceId: env.workspaceId,
    selectedWorkspaceId: args.selectedWorkspaceId,
  });
  args.workspaceId = workspaceResolution.workspaceId;
  args.workspaceIdSource = workspaceResolution.source;
  args.workspaceSelectionBlocked = PACKAGE_WORKSPACE_OPERATIONS.has(args.operation) && !workspaceResolution.workspaceId;
  const packagePath = args.package ? path.resolve(args.package) : "";

  const plan = {
    operation: args.operation,
    execute: Boolean(args.execute),
    environment: environmentPresence(env),
    workspaceId: args.workspaceId ? "present" : "missing",
    workspaceIdSource: workspaceResolution.source,
    workspaceSelectionRequired: args.workspaceSelectionBlocked,
    package: packagePath ? summarizePackagePath(packagePath) : null,
  };

  if (!args.execute) {
    plan.note = "Dry run only. Add --execute to call Yeeflow package APIs.";
  }

  validateCommonInputs(args, env, packagePath);

  const result = !args.execute
    ? await buildDryRunPlan(args, packagePath)
    : await executeOperation(args, env, packagePath);

  console.log(JSON.stringify({ ...plan, result }, null, 2));
}

function printUsage() {
  console.log(`Usage:
  node scripts/yeeflow-package-api-automation.mjs --operation upload --package <file.yap|file.yapk> [--execute]
  node scripts/yeeflow-package-api-automation.mjs --operation import-yap --package <file.yap> --selected-workspace-id <id> [--app-id 41] [--execute]
  node scripts/yeeflow-package-api-automation.mjs --operation install-yapk --package <file.yapk> --selected-workspace-id <id> [--execute]
  node scripts/yeeflow-package-api-automation.mjs --operation upgrade-check-yapk --package <file.yapk> --selected-workspace-id <id> [--execute]
  node scripts/yeeflow-package-api-automation.mjs --operation upgrade-apply-yapk --package <file.yapk> --selected-workspace-id <id> [--execute]

Options:
  --dotenv <path>                 Defaults to .env.local.
  --selected-workspace-id <id>    Preferred explicit user-selected workspace from OAuth workspace discovery.
  --workspace-id <id>             Allowed only as an explicit user-selected workspace after API discovery.
  --workspace-discovery-json <path>
                                  Non-live test fixture containing a workspace list response to summarize when selection is missing.
  --upload-mode multipart|raw      Defaults to multipart. Product docs expose the endpoint but not the file-body contract.
  --file-field <name>              Multipart field name. Defaults to file.
  --package-file-id <id>           Skip upload and use an existing uploaded file id for install/upgrade.
  --package-file-name <name>       Name for existing uploaded file metadata.
  --package-file-size <bytes>      File size for existing uploaded file metadata.
  --previous-package <path>        Required for YAPK upgrade/new-version ID stability validation.
  --previous-manifest <path>       Required previous version ID lineage/provenance manifest.
  --new-manifest <path>            Required new version ID lineage/provenance manifest.
  --upgrade-check true|false       Deprecated. Use upgrade-check-yapk or upgrade-apply-yapk.
  --manage-json <json>             Import permissions array. Defaults to [].
  --write-json <json>              Import permissions array. Defaults to [].
  --read-json <json>               Import permissions array. Defaults to [].

The helper never prints API keys, raw Resource, raw Sign, raw decoded payloads, or full API responses.`);
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
    if (key === "execute" || key === "help") {
      parsed[key] = true;
    } else {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${token}`);
      parsed[key] = value;
      i += 1;
    }
  }
  return parsed;
}

function validateCommonInputs(options, env, resolvedPackagePath) {
  if (options.execute && !env.apiBaseUrl) throw new Error("YEEFLOW_API_BASE_URL is required.");
  if (["upload", "import-yap", "install-yapk", "upgrade-check-yapk", "upgrade-apply-yapk", "upgrade-yapk"].includes(options.operation)) {
    if (!resolvedPackagePath) throw new Error("--package is required.");
    if (!fs.existsSync(resolvedPackagePath)) throw new Error(`Package file not found: ${resolvedPackagePath}`);
  }
  if (PACKAGE_WORKSPACE_OPERATIONS.has(options.operation) && !options.workspaceSelectionBlocked) {
    requireTargetWorkspaceId({ workspaceId: options.workspaceId }, options.operation);
  }
  if (options.operation === "import-yap" && !resolvedPackagePath.endsWith(".yap")) {
    throw new Error("import-yap requires a .yap package.");
  }
  if (["install-yapk", "upgrade-check-yapk", "upgrade-apply-yapk", "upgrade-yapk"].includes(options.operation) && !resolvedPackagePath.endsWith(".yapk")) {
    throw new Error(`${options.operation} requires a .yapk package.`);
  }
  if (options.execute && options.operation === "upgrade-yapk") {
    throw new Error("upgrade-yapk is deprecated for execution. Use upgrade-check-yapk for UpgradeCheck:true or upgrade-apply-yapk for committed UpgradeCheck:false.");
  }
  if (options.operation === "upgrade-apply-yapk" && options.upgradeCheck !== undefined && parseBoolean(options.upgradeCheck, "upgrade-check") !== false) {
    throw new Error("upgrade-apply-yapk is committed apply mode and requires UpgradeCheck:false.");
  }
}

async function buildDryRunPlan(options, resolvedPackagePath) {
  if (options.operation === "upload") {
    return {
      endpoint: "POST /files/upload",
      uploadMode: options.uploadMode || "multipart",
      request: { packageName: path.basename(resolvedPackagePath), fileSize: fs.statSync(resolvedPackagePath).size },
    };
  }
  if (options.operation === "import-yap") {
    if (options.workspaceSelectionBlocked) return await buildWorkspaceSelectionRequiredResult(options);
    return {
      endpoint: "POST /listset/package/import",
      request: redactImportBody(buildImportBody(options, resolvedPackagePath)),
    };
  }
  if (options.workspaceSelectionBlocked) return await buildWorkspaceSelectionRequiredResult(options);
  let upgradeIdStability = null;
  if (YAPK_UPGRADE_OPERATIONS.has(options.operation)) {
    const stabilityGate = buildUpgradeIdStabilityResult(options, resolvedPackagePath);
    if (stabilityGate.status !== "pass") return stabilityGate;
    upgradeIdStability = stabilityGate;
  }
  const packageFile = buildExistingPackageFile(options, resolvedPackagePath) || {
    Id: "[from upload response]",
    Name: path.basename(resolvedPackagePath),
    FileSize: fs.statSync(resolvedPackagePath).size,
  };
  return {
    endpoint: options.operation === "install-yapk" ? "POST /listset/package/install" : "POST /listset/package/upgrade",
    request: redactPackageActionBody(buildPackageActionBody(options, packageFile)),
    uploadBeforeAction: !buildExistingPackageFile(options, resolvedPackagePath),
    upgradeIdStability,
  };
}

async function buildWorkspaceSelectionRequiredResult(options) {
  const workspaceDiscovery = await loadWorkspaceDiscoverySummary(options);
  return {
    resultClass: WORKSPACE_SELECTION_REQUIRED,
    source: options.workspaceIdSource || "missing",
    discoveredCategory: APP_PACKAGE_WORKSPACE_CATEGORY,
    requestShaped: false,
    livePackageWriteExecuted: false,
    workspaceDiscovery,
    workspaceChoices: {
      category: workspaceDiscovery.category,
      workspaceCount: workspaceDiscovery.workspaceCount,
      workspaces: workspaceDiscovery.workspaces,
    },
    guidance: [
      "Local YEEFLOW_WORKSPACE_ID is ignored for package install/import/upgrade target selection.",
      "Run OAuth workspace discovery for category flowcraft.",
      "Ask the current user to choose from the redacted workspace list.",
      "Re-run with --selected-workspace-id <id> or --workspace-id <id> only after that explicit user selection.",
    ],
  };
}

async function loadWorkspaceDiscoverySummary(options) {
  if (options.workspaceDiscoveryJson) {
    const resolved = path.resolve(options.workspaceDiscoveryJson);
    const payload = JSON.parse(fs.readFileSync(resolved, "utf8"));
    const summary = summarizeWorkspaceList(payload);
    return {
      source: "fixture",
      category: APP_PACKAGE_WORKSPACE_CATEGORY,
      workspaceCount: summary.workspaceCount,
      workspaces: summary.workspaces,
      rawResponsePrinted: false,
    };
  }

  try {
    const capability = getCapability("workspaces.listByCategory");
    const auth = await resolveYeeflowApiAuth({ dotenv: options.dotenv || ".env.local" });
    if (auth.mode !== "oauth") {
      return {
        source: "oauth-read-only",
        category: APP_PACKAGE_WORKSPACE_CATEGORY,
        capability: "workspaces.listByCategory",
        endpoint: "GET /workspaces/{category}",
        ...buildLoginRequiredResult({
          auth,
          originalOperation: "package workspace discovery",
          originalCapability: "workspaces.listByCategory",
          originalEndpoint: "GET /workspaces/{category}",
        }),
        workspaceCount: 0,
        workspaces: [],
      };
    }
    const url = new URL(`${auth.env.apiBaseUrl}${capability.path.replace("{category}", encodeURIComponent(APP_PACKAGE_WORKSPACE_CATEGORY))}`);
    const response = await fetch(url, {
      method: capability.method,
      headers: mergeAuthHeaders(auth, { Accept: "application/json" }),
    });
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    const payload = parseJson(text);
    const summary = payload ? summarizeWorkspaceList(payload) : { workspaceCount: 0, workspaces: [] };
    return {
      source: "oauth-read-only",
      category: APP_PACKAGE_WORKSPACE_CATEGORY,
      capability: "workspaces.listByCategory",
      endpoint: "GET /workspaces/{category}",
      httpStatus: response.status,
      ok: response.ok,
      contentType,
      workspaceCount: summary.workspaceCount,
      workspaces: summary.workspaces,
      rawResponsePrinted: false,
    };
  } catch (error) {
    return {
      source: "oauth-read-only",
      category: APP_PACKAGE_WORKSPACE_CATEGORY,
      authRequired: true,
      authErrorClass: safeAuthError(error),
      workspaceCount: 0,
      workspaces: [],
      rawResponsePrinted: false,
    };
  }
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function executeOperation(options, env, resolvedPackagePath) {
  if (options.workspaceSelectionBlocked) {
    process.exitCode = 1;
    return await buildWorkspaceSelectionRequiredResult(options);
  }
  let upgradeIdStability = null;
  if (YAPK_UPGRADE_OPERATIONS.has(options.operation)) {
    const stabilityGate = buildUpgradeIdStabilityResult(options, resolvedPackagePath);
    if (stabilityGate.status !== "pass") {
      process.exitCode = 1;
      return stabilityGate;
    }
    upgradeIdStability = stabilityGate;
  }
  const auth = await resolveYeeflowApiAuth({ loadDotenv: false });
  if (auth.mode !== "oauth") {
    process.exitCode = 1;
    return buildLoginRequiredResult({
      auth,
      originalOperation: options.operation,
    });
  }
  if (options.operation === "upload") {
    return await uploadPackageFile(env, resolvedPackagePath, options, auth);
  }
  if (options.operation === "import-yap") {
    return await postJson(env, "/listset/package/import", buildImportBody(options, resolvedPackagePath), redactImportBody, auth, {
      operation: options.operation,
      selectedWorkspace: await resolveSelectedWorkspaceSummary(options),
    });
  }
  const existingPackageFile = buildExistingPackageFile(options, resolvedPackagePath);
  const packageFile = existingPackageFile || normalizePackageFile(await uploadPackageFile(env, resolvedPackagePath, options, auth), resolvedPackagePath);
  const endpoint = options.operation === "install-yapk" ? "/listset/package/install" : "/listset/package/upgrade";
  return await postJson(env, endpoint, buildPackageActionBody(options, packageFile), redactPackageActionBody, auth, {
    operation: options.operation,
    selectedWorkspace: await resolveSelectedWorkspaceSummary(options),
    upgradeIdStability,
  });
}

function buildUpgradeIdStabilityResult(options, resolvedPackagePath) {
  const missing = [];
  if (!options.previousPackage) missing.push("--previous-package");
  if (!options.previousManifest) missing.push("--previous-manifest");
  if (!options.newManifest) missing.push("--new-manifest");
  if (missing.length) {
    return {
      resultClass: "upgrade_id_stability_required",
      status: "fail",
      source: "missing-upgrade-lineage-evidence",
      missing,
      requestShaped: false,
      livePackageWriteExecuted: false,
      guidance: [
        "YAPK upgrade/new-version package writes require previous package, previous ID lineage/provenance manifest, and new ID lineage manifest.",
        "Existing semantic objects must preserve IDs; only newly added objects may use newly API-issued IDs.",
        "Run scripts/validate-yapk-upgrade-id-stability.mjs before upgrade-check, upgrade apply, signing, install-like writes, or handoff.",
      ],
    };
  }
  const report = validateYapkUpgradeIdStability({
    previousPackage: path.resolve(options.previousPackage),
    previousManifest: path.resolve(options.previousManifest),
    newPackage: resolvedPackagePath,
    newManifest: path.resolve(options.newManifest),
  });
  if (report.status !== "pass") {
    return {
      resultClass: "upgrade_id_stability_failed",
      status: "fail",
      requestShaped: false,
      livePackageWriteExecuted: false,
      codes: report.findings?.map((finding) => finding.code).filter(Boolean).slice(0, 25) || [],
      summary: report.summary || null,
      proofBoundary: report.proofBoundary,
    };
  }
  return {
    resultClass: "upgrade_id_stability_passed",
    status: "pass",
    requestShaped: false,
    livePackageWriteExecuted: false,
    summary: report.summary,
    proofBoundary: report.proofBoundary,
  };
}

async function uploadPackageFile(env, resolvedPackagePath, options, auth) {
  const uploadMode = options.uploadMode || "multipart";
  const fileName = path.basename(resolvedPackagePath);
  const fileBuffer = fs.readFileSync(resolvedPackagePath);
  const url = new URL(`${env.apiBaseUrl}/files/upload`);
  url.searchParams.set("isImg", "false");

  const headers = mergeAuthHeaders(auth);
  let body;
  if (uploadMode === "raw") {
    headers["Content-Type"] = "application/octet-stream";
    headers["x-file-name"] = encodeURIComponent(fileName);
    body = fileBuffer;
  } else if (uploadMode === "multipart") {
    const form = new FormData();
    form.append(options.fileField || "file", new Blob([fileBuffer]), fileName);
    body = form;
  } else {
    throw new Error("--upload-mode must be multipart or raw.");
  }

  const response = await fetch(url, { method: "POST", headers, body });
  return await summarizeResponse(response, "upload file content");
}

async function postJson(env, endpoint, body, redactBody, auth, context = {}) {
  const response = await fetch(`${env.apiBaseUrl}${endpoint}`, {
    method: "POST",
    headers: mergeAuthHeaders(auth, {
      Accept: "application/json",
      "Content-Type": "application/json-patch+json",
    }),
    body: JSON.stringify(body),
  });
  const summary = await summarizeResponse(response, endpoint, { upgradeCheck: body?.UpgradeCheck });
  const result = {
    request: redactBody(body),
    response: summary,
  };
  if (context.upgradeIdStability) result.upgradeIdStability = context.upgradeIdStability;
  if (context.operation === "import-yap" || context.operation === "install-yapk") {
    result.selectedWorkspace = context.selectedWorkspace || buildSelectedWorkspaceFallback(body.WorkspaceID);
    result.applicationAccess = buildApplicationAccessReport({
      operation: context.operation,
      responseSummary: summary,
      auth,
    });
  }
  return result;
}

async function summarizeResponse(response, label, context = {}) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  let parsed = null;
  if (text && (contentType.includes("application/json") || looksLikeJson(text))) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  if (!response.ok) {
    const classification = classifyApiResult({
      httpStatus: response.status,
      apiStatus: parsed?.Status ?? parsed?.status ?? null,
      message: parsed?.Message ?? parsed?.message ?? "",
      upgradeCheck: context.upgradeCheck,
    });
    return {
      label,
      ok: false,
      resultClass: classification.resultClass,
      httpStatus: response.status,
      contentType,
      responseKeys: parsed && typeof parsed === "object" ? Object.keys(parsed).slice(0, 20) : [],
      apiStatus: parsed?.Status ?? parsed?.status ?? null,
      messageClass: classification.messageClass,
      messagePresent: Boolean(parsed?.Message ?? parsed?.message),
    };
  }
  const classification = classifyApiResult({
    httpStatus: response.status,
    apiStatus: parsed?.Status ?? parsed?.status ?? null,
    message: parsed?.Message ?? parsed?.message ?? "",
    upgradeCheck: context.upgradeCheck,
  });
  const summary = {
    label,
    ok: classification.resultClass === "success",
    resultClass: classification.resultClass,
    httpStatus: response.status,
    contentType,
    responseKeys: parsed && typeof parsed === "object" ? Object.keys(parsed).slice(0, 20) : [],
    apiStatus: parsed?.Status ?? parsed?.status ?? null,
    messageClass: classification.messageClass,
    messagePresent: Boolean(parsed?.Message ?? parsed?.message),
    totalCount: parsed?.TotalCount ?? parsed?.totalCount ?? null,
    textPresent: Boolean(text),
    textLength: text.length,
    dataShape: summarizeDataShape(parsed?.Data ?? parsed?.data ?? parsed),
  };
  const applicationListSetId = extractApplicationListSetId(parsed, { label });
  if (applicationListSetId) summary.applicationListSetId = applicationListSetId;
  const packageFile = isUploadResponseLabel(label) ? extractPackageFile(parsed?.Data ?? parsed?.data ?? parsed) : null;
  if (packageFile) {
    Object.defineProperty(summary, "_packageFile", { value: packageFile, enumerable: false });
    summary.packageFile = { Id: "[redacted]", Name: packageFile.Name, FileSize: packageFile.FileSize };
  }
  return summary;
}

export { buildApplicationAccessReport, classifyApiResult, extractApplicationListSetId, extractPackageFile, summarizeResponse };

function buildApplicationAccessReport({ operation = "", responseSummary = {}, auth = {} } = {}) {
  const listSetId = sanitizeListSetId(responseSummary.applicationListSetId);
  const tenantUrl = auth?.mode === "oauth" && auth?.env?.tenantUrlSource === "oauth-token-claim"
    ? sanitizeTenantUrl(auth.env.tenantUrl)
    : "";
  const unavailableMessage = "Application link: unavailable; ListSetID or tenant URL was not safely resolved.";
  const proofBoundary = "API install/import success is not browser runtime proof; open the application and verify navigation, dashboards, lists, forms, and workflows.";
  if (responseSummary.ok !== true || !listSetId || !tenantUrl || !["import-yap", "install-yapk"].includes(operation)) {
    return {
      status: "unavailable",
      operation,
      listSetId: listSetId || null,
      tenantUrlSource: auth?.env?.tenantUrlSource || "missing",
      link: null,
      message: unavailableMessage,
      proofBoundary,
    };
  }
  const link = `${tenantUrl}/#/list-set/41/${encodeURIComponent(listSetId)}`;
  return {
    status: "available",
    operation,
    listSetId,
    tenantUrlSource: auth.env.tenantUrlSource,
    link,
    message: `Application link: ${link}`,
    proofBoundary,
  };
}

async function resolveSelectedWorkspaceSummary(options) {
  if (!options.workspaceId || !PACKAGE_WORKSPACE_OPERATIONS.has(options.operation)) return null;
  if (options.workspaceDiscoveryJson) {
    const payload = JSON.parse(fs.readFileSync(path.resolve(options.workspaceDiscoveryJson), "utf8"));
    const record = findWorkspaceRecordById(payload, options.workspaceId);
    if (record) return { ...summarizeWorkspaceRecord(record, 1), source: "workspace-discovery-json" };
  }
  return buildSelectedWorkspaceFallback(options.workspaceId);
}

function buildSelectedWorkspaceFallback(workspaceId) {
  return {
    displayName: "unavailable",
    category: APP_PACKAGE_WORKSPACE_CATEGORY,
    idPreview: redactWorkspaceId(workspaceId),
    source: "explicit-user-selection",
  };
}

function findWorkspaceRecordById(payload, workspaceId) {
  const data = payload?.Data ?? payload?.data ?? payload;
  const records = Array.isArray(data) ? data : [];
  return records.find((record) => String(record?.ID ?? record?.Id ?? record?.id ?? "").trim() === String(workspaceId || "").trim()) || null;
}

function extractApplicationListSetId(parsed, { label = "" } = {}) {
  const data = parsed?.Data ?? parsed?.data ?? parsed;
  const explicit = firstNonEmpty(
    data?.ListSetID,
    data?.ListSetId,
    data?.listSetID,
    data?.listSetId,
    data?.listsetID,
    data?.listsetId,
    parsed?.ListSetID,
    parsed?.ListSetId,
    parsed?.listSetID,
    parsed?.listSetId,
    parsed?.listsetID,
    parsed?.listsetId,
  );
  if (explicit) return sanitizeListSetId(explicit);
  if (String(label || "").includes("/listset/package/install")) {
    return sanitizeListSetId(data?.ID ?? data?.Id ?? data?.id);
  }
  return "";
}

function buildImportBody(options, resolvedPackagePath) {
  const wrapper = JSON.parse(fs.readFileSync(resolvedPackagePath, "utf8"));
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource) throw new Error(".yap package is missing Resource.");
  return {
    AppID: Number(options.appId || wrapper.AppID || 41),
    WorkspaceID: options.workspaceId,
    Title: options.title || wrapper.Title || path.basename(resolvedPackagePath, ".yap"),
    Description: options.description || wrapper.Description || "",
    IconUrl: options.iconUrl || wrapper.IconUrl || "",
    Resource: wrapper.Resource,
    Manage: parseJsonArrayOption(options.manageJson, "manage-json"),
    Write: parseJsonArrayOption(options.writeJson, "write-json"),
    Read: parseJsonArrayOption(options.readJson, "read-json"),
  };
}

function buildPackageActionBody(options, packageFile) {
  const body = {
    WorkspaceID: options.workspaceId,
    PackageFile: packageFile,
  };
  if (["upgrade-check-yapk", "upgrade-apply-yapk", "upgrade-yapk"].includes(options.operation)) {
    if (options.operation === "upgrade-check-yapk") body.UpgradeCheck = true;
    else if (options.operation === "upgrade-apply-yapk") body.UpgradeCheck = false;
    else body.UpgradeCheck = options.upgradeCheck === undefined ? true : parseBoolean(options.upgradeCheck, "upgrade-check");
  }
  return body;
}

function buildExistingPackageFile(options, resolvedPackagePath) {
  if (!options.packageFileId) return null;
  return {
    Id: options.packageFileId,
    Name: options.packageFileName || path.basename(resolvedPackagePath),
    FileSize: Number(options.packageFileSize || fs.statSync(resolvedPackagePath).size),
  };
}

function normalizePackageFile(uploadSummary, resolvedPackagePath) {
  if (!uploadSummary?._packageFile) {
    throw new Error("Upload completed but did not expose a package file Id in the redacted response summary. Pass --package-file-id/--package-file-name/--package-file-size if the upload API stores file metadata elsewhere.");
  }
  return uploadSummary._packageFile;
}

function summarizePackagePath(resolvedPackagePath) {
  return {
    name: path.basename(resolvedPackagePath),
    ext: path.extname(resolvedPackagePath),
    fileSize: fs.existsSync(resolvedPackagePath) ? fs.statSync(resolvedPackagePath).size : null,
  };
}

function parseJsonArrayOption(value, label) {
  if (!value) return [];
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error(`--${label} must be a JSON array.`);
  return parsed;
}

function parseBoolean(value, label) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new Error(`--${label} must be true or false.`);
}

function redactImportBody(body) {
  return {
    ...body,
    WorkspaceID: "[provided]",
    Resource: "[redacted]",
    Manage: summarizePermissionArray(body.Manage),
    Write: summarizePermissionArray(body.Write),
    Read: summarizePermissionArray(body.Read),
  };
}

function redactPackageActionBody(body) {
  return {
    WorkspaceID: "[provided]",
    PackageFile: body.PackageFile
      ? {
          Id: body.PackageFile.Id ? "[provided]" : null,
          Name: body.PackageFile.Name,
          FileSize: body.PackageFile.FileSize,
        }
      : null,
    UpgradeCheck: body.UpgradeCheck,
  };
}

function summarizePermissionArray(value) {
  return Array.isArray(value) ? { count: value.length } : { count: 0 };
}

function summarizeDataShape(data) {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) return { type: "array", count: data.length };
  if (typeof data === "object") {
    return {
      type: "object",
      keys: Object.keys(data).slice(0, 20),
      actionFields: {
        Continue: typeof data.Continue === "boolean" ? data.Continue : undefined,
        Completed: typeof data.Completed === "boolean" ? data.Completed : undefined,
        Status: data.Status ?? undefined,
      },
    };
  }
  return { type: typeof data };
}

function extractPackageFile(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const id = data.Id ?? data.ID ?? data.id;
  const name = data.Name ?? data.name;
  const fileSize = data.FileSize ?? data.fileSize;
  if (!id || !name || fileSize === undefined || fileSize === null) return null;
  return {
    Id: String(id),
    Name: String(name),
    FileSize: Number(fileSize),
  };
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function sanitizeListSetId(value) {
  const text = String(value ?? "").trim();
  if (!text || text === "0") return "";
  if (/^(?:unknown|missing|null|undefined|placeholder|example)$/i.test(text)) return "";
  if (/^<.*>$/.test(text) || /^\[.*\]$/.test(text)) return "";
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return "";
  return text;
}

function sanitizeTenantUrl(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  let url;
  try {
    url = new URL(text);
  } catch {
    return "";
  }
  if (url.protocol !== "https:") return "";
  if (!/^[a-z0-9.-]+$/i.test(url.hostname) || !url.hostname.includes(".") || url.hostname.includes("..")) return "";
  return `https://${url.hostname}`;
}

function looksLikeJson(value) {
  const text = String(value || "").trim();
  return text.startsWith("{") || text.startsWith("[");
}

function isUploadResponseLabel(label) {
  return String(label || "").toLowerCase().includes("upload");
}

function classifyApiResult({ httpStatus, apiStatus, message, upgradeCheck }) {
  if (httpStatus < 200 || httpStatus >= 300) {
    return { resultClass: "http_rejected", messageClass: classifyMessage(message) };
  }
  if (Number(apiStatus) === 0) {
    if (upgradeCheck === true) return { resultClass: "upgrade_check_passed", messageClass: "none" };
    if (upgradeCheck === false) return { resultClass: "upgrade_submitted", messageClass: "none" };
    return { resultClass: "success", messageClass: "none" };
  }
  if (isAlreadyInstalledMessage(message)) {
    return { resultClass: "already_installed", messageClass: "already_installed" };
  }
  if (apiStatus !== null && apiStatus !== undefined) {
    return { resultClass: "api_rejected", messageClass: classifyMessage(message) };
  }
  if (upgradeCheck === true) return { resultClass: "upgrade_check_passed", messageClass: classifyMessage(message) };
  if (upgradeCheck === false) return { resultClass: "upgrade_submitted", messageClass: classifyMessage(message) };
  return { resultClass: "success", messageClass: classifyMessage(message) };
}

function classifyMessage(message) {
  if (isAlreadyInstalledMessage(message)) return "already_installed";
  return String(message || "").trim() ? "present_redacted" : "none";
}

function isAlreadyInstalledMessage(message) {
  const text = String(message || "").toLowerCase();
  return [
    "already exists",
    "already installed",
    "duplicate",
    "same application",
    "package exists",
    "app exists",
    "已存在",
    "已安装",
    "重复",
  ].some((keyword) => text.includes(keyword.toLowerCase()));
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
