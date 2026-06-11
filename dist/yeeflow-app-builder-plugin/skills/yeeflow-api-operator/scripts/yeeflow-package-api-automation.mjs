#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { environmentPresence, loadDotenvFile, resolveYeeflowEnvironment } from "./yeeflow-env-utils.mjs";

const OPERATIONS = new Set(["upload", "import-yap", "install-yapk", "upgrade-check-yapk", "upgrade-apply-yapk", "upgrade-yapk"]);

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
  args.workspaceId = args.workspaceId || env.workspaceId;
  const packagePath = args.package ? path.resolve(args.package) : "";

  const plan = {
    operation: args.operation,
    execute: Boolean(args.execute),
    environment: environmentPresence(env),
    workspaceId: args.workspaceId ? "present" : "missing",
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
  node scripts/yeeflow-package-api-automation.mjs --operation import-yap --package <file.yap> [--workspace-id <id override>] [--app-id 41] [--execute]
  node scripts/yeeflow-package-api-automation.mjs --operation install-yapk --package <file.yapk> [--workspace-id <id override>] [--execute]
  node scripts/yeeflow-package-api-automation.mjs --operation upgrade-check-yapk --package <file.yapk> [--workspace-id <id override>] [--execute]
  node scripts/yeeflow-package-api-automation.mjs --operation upgrade-apply-yapk --package <file.yapk> [--workspace-id <id override>] [--execute]

Options:
  --dotenv <path>                 Defaults to .env.local.
  --workspace-id <id>             Optional override. Defaults to YEEFLOW_WORKSPACE_ID or active profile workspace id.
  --upload-mode multipart|raw      Defaults to multipart. Product docs expose the endpoint but not the file-body contract.
  --file-field <name>              Multipart field name. Defaults to file.
  --package-file-id <id>           Skip upload and use an existing uploaded file id for install/upgrade.
  --package-file-name <name>       Name for existing uploaded file metadata.
  --package-file-size <bytes>      File size for existing uploaded file metadata.
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
  if (options.execute && !env.apiKey) throw new Error("YEEFLOW_API_KEY is required. Store it locally; do not paste it into chat.");
  if (options.execute && !env.apiBaseUrl) throw new Error("YEEFLOW_API_BASE_URL is required.");
  if (["upload", "import-yap", "install-yapk", "upgrade-check-yapk", "upgrade-apply-yapk", "upgrade-yapk"].includes(options.operation)) {
    if (!resolvedPackagePath) throw new Error("--package is required.");
    if (!fs.existsSync(resolvedPackagePath)) throw new Error(`Package file not found: ${resolvedPackagePath}`);
  }
  if (["import-yap", "install-yapk", "upgrade-check-yapk", "upgrade-apply-yapk", "upgrade-yapk"].includes(options.operation) && !options.workspaceId) {
    throw new Error("YEEFLOW_WORKSPACE_ID is required for package import/install/upgrade APIs. Store it in .env.local or pass --workspace-id as a redacted one-run override.");
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
    return {
      endpoint: "POST /listset/package/import",
      request: redactImportBody(buildImportBody(options, resolvedPackagePath)),
    };
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
  };
}

async function executeOperation(options, env, resolvedPackagePath) {
  if (options.operation === "upload") {
    return await uploadPackageFile(env, resolvedPackagePath, options);
  }
  if (options.operation === "import-yap") {
    return await postJson(env, "/listset/package/import", buildImportBody(options, resolvedPackagePath), redactImportBody);
  }
  const existingPackageFile = buildExistingPackageFile(options, resolvedPackagePath);
  const packageFile = existingPackageFile || normalizePackageFile(await uploadPackageFile(env, resolvedPackagePath, options), resolvedPackagePath);
  const endpoint = options.operation === "install-yapk" ? "/listset/package/install" : "/listset/package/upgrade";
  return await postJson(env, endpoint, buildPackageActionBody(options, packageFile), redactPackageActionBody);
}

async function uploadPackageFile(env, resolvedPackagePath, options) {
  const uploadMode = options.uploadMode || "multipart";
  const fileName = path.basename(resolvedPackagePath);
  const fileBuffer = fs.readFileSync(resolvedPackagePath);
  const url = new URL(`${env.apiBaseUrl}/files/upload`);
  url.searchParams.set("isImg", "false");

  const headers = { apiKey: env.apiKey };
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

async function postJson(env, endpoint, body, redactBody) {
  const response = await fetch(`${env.apiBaseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      apiKey: env.apiKey,
      Accept: "application/json",
      "Content-Type": "application/json-patch+json",
    },
    body: JSON.stringify(body),
  });
  const summary = await summarizeResponse(response, endpoint, { upgradeCheck: body?.UpgradeCheck });
  return {
    request: redactBody(body),
    response: summary,
  };
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
  const packageFile = isUploadResponseLabel(label) ? extractPackageFile(parsed?.Data ?? parsed?.data ?? parsed) : null;
  if (packageFile) {
    Object.defineProperty(summary, "_packageFile", { value: packageFile, enumerable: false });
    summary.packageFile = { Id: "[redacted]", Name: packageFile.Name, FileSize: packageFile.FileSize };
  }
  return summary;
}

export { classifyApiResult, extractPackageFile, summarizeResponse };

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
    if (upgradeCheck === false) return { resultClass: "upgrade_applied", messageClass: "none" };
    return { resultClass: "success", messageClass: "none" };
  }
  if (isAlreadyInstalledMessage(message)) {
    return { resultClass: "already_installed", messageClass: "already_installed" };
  }
  if (apiStatus !== null && apiStatus !== undefined) {
    return { resultClass: "api_rejected", messageClass: classifyMessage(message) };
  }
  if (upgradeCheck === true) return { resultClass: "upgrade_check_passed", messageClass: classifyMessage(message) };
  if (upgradeCheck === false) return { resultClass: "upgrade_applied", messageClass: classifyMessage(message) };
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
