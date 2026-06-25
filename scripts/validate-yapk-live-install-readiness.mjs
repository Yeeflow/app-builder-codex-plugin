#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import {
  asArray,
  isObject,
  parseJsonMaybe,
  quoteLargeJsonIntegers,
  readDecodedYapk,
  walk,
} from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LARGE_ID_RE = /^\d{16,}$/;
const BROTLI_PREFIX = Buffer.from("::brotli::", "utf8");

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateYapkLiveInstallReadiness(args);
  if (args.json) console.log(JSON.stringify(report, null, 2));
  else printTextReport(report);
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateYapkLiveInstallReadiness(options = {}) {
  const packagePath = path.resolve(options.cwd || ROOT, options.package);
  const findings = [];
  if (!fs.existsSync(packagePath)) {
    findings.push(error("YAPK_LIVE_INSTALL_PACKAGE_MISSING", "The generated-final package file does not exist.", { packagePath }));
    return buildReport({ packagePath, findings });
  }

  let wrapper;
  let decoded;
  try {
    ({ wrapper, decoded } = readDecodedYapk(packagePath));
  } catch (err) {
    findings.push(error("YAPK_LIVE_INSTALL_PACKAGE_DECODE_FAILED", "The generated-final package could not be decoded.", { detail: String(err?.message || err) }));
    return buildReport({ packagePath, findings });
  }

  const manifestPath = options.idProvenance ? path.resolve(options.cwd || ROOT, options.idProvenance) : defaultManifestPath(packagePath);
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : null;
  const manifestIds = manifest ? idSetFromManifest(manifest) : null;

  validateRootIdentity({ wrapper, decoded, findings });
  const parsedDashboardResources = validateDashboardResources({ decoded, manifestIds, findings });
  validateApprovalDefResources({ decoded, manifestIds, findings });
  if (options.versionEvidence) validateVersionEvidence({
    evidencePath: path.resolve(options.cwd || ROOT, options.versionEvidence),
    packageId: String(options.packageId || wrapper.PackageId || ""),
    findings,
  });

  return buildReport({
    packagePath,
    manifestPath,
    findings,
    summary: {
      wrapperListId: stringId(wrapper.ListID),
      decodedRootListId: stringId(decoded?.ListSet?.ListID),
      dashboardResourcesParsed: parsedDashboardResources.length,
      manifestIdsAvailable: manifestIds ? manifestIds.size : 0,
      versionEvidence: options.versionEvidence ? path.resolve(options.cwd || ROOT, options.versionEvidence) : null,
    },
  });
}

function validateRootIdentity({ wrapper, decoded, findings }) {
  const wrapperRoot = stringId(wrapper.ListID);
  const decodedRoot = stringId(decoded?.ListSet?.ListID);
  if (!wrapperRoot || !decodedRoot || wrapperRoot !== decodedRoot) {
    findings.push(error("YAPK_ROOT_LISTID_MISMATCH", "Wrapper ListID must equal decoded ListSet.ListID before signing/install.", {
      wrapperListId: wrapperRoot || null,
      decodedListSetListId: decodedRoot || null,
    }));
  }

  for (const [index, page] of asArray(decoded?.Pages).entries()) {
    if (String(page?.Type) !== "103") continue;
    const pageRoot = stringId(page.ListID);
    if (decodedRoot && pageRoot !== decodedRoot) {
      findings.push(error("YAPK_DASHBOARD_PAGE_ROOT_LISTID_MISMATCH", "Dashboard page ListID must point at the decoded package root ListSetID.", {
        pageIndex: index,
        pageTitle: page.Title || page.Name || "",
        pageListId: pageRoot || null,
        decodedListSetListId: decodedRoot,
      }));
    }
  }
}

function validateDashboardResources({ decoded, manifestIds, findings }) {
  const parsedResources = [];
  const uuidOwners = new Map();
  for (const [pageIndex, page] of asArray(decoded?.Pages).entries()) {
    if (String(page?.Type) !== "103") continue;
    const pageKey = `${pageIndex}:${page.Title || page.LayoutID || "Dashboard"}`;
    for (const [resourceIndex, record] of asArray(page.LayoutInResources).entries()) {
      const parsed = parseJsonMaybe(record?.Resource);
      if (!isObject(parsed)) {
        findings.push(error("DASHBOARD_RESOURCE_JSON_PARSE_FAILED", "Dashboard LayoutInResources[].Resource must be a parseable JSON object.", {
          pageIndex,
          pageTitle: page.Title || "",
          resourceIndex,
        }));
        continue;
      }
      parsedResources.push({ pageIndex, pageTitle: page.Title || "", resourceIndex, resource: parsed });
      walk(parsed, (value, pointer) => {
        if (isObject(value)) {
          const controlId = String(value.id || value.ID || "");
          if (UUID_RE.test(controlId)) {
            const previous = uuidOwners.get(controlId);
            if (previous) {
              findings.push(error("DASHBOARD_CONTROL_UUID_DUPLICATE_ACROSS_PAGES", "Dashboard template control UUIDs must be re-instantiated per generated page/resource.", {
                uuid: controlId,
                firstOwner: previous,
                duplicateOwner: { pageKey, pointer },
              }));
            } else {
              uuidOwners.set(controlId, { pageKey, pointer });
            }
          }
        }
        if (manifestIds && isLargeGeneratedIdPointer(pointer, value) && !manifestIds.has(String(value))) {
          findings.push(error("YAPK_EMBEDDED_DASHBOARD_ID_NOT_IN_MANIFEST", "Large numeric IDs embedded inside dashboard JSON resources must be API-issued and listed in the ID provenance manifest.", {
            id: String(value),
            pageIndex,
            pageTitle: page.Title || "",
            pointer,
          }));
        }
      });
    }
  }
  return parsedResources;
}

function validateApprovalDefResources({ decoded, manifestIds, findings }) {
  for (const [formIndex, form] of asArray(decoded?.Forms).entries()) {
    const parsed = decodeDefResource(form?.DefResource);
    if (!parsed) {
      findings.push(error("APPROVAL_DEFRESOURCE_DECODE_FAILED", "Approval Forms[].DefResource must be export-shaped and decode to a JSON object.", {
        formIndex,
        formName: form?.Name || form?.Title || "",
      }));
      continue;
    }
    const formKey = stringId(form?.Key);
    const defKey = stringId(parsed.defkey || parsed.defKey || parsed.key);
    const key = stringId(parsed.key || parsed.defkey || parsed.defKey);
    if (formKey && ((key && key !== formKey) || (defKey && defKey !== formKey))) {
      findings.push(error("APPROVAL_DEFRESOURCE_KEY_MISMATCH", "Approval DefResource key/defkey must match Forms[].Key after ID remap.", {
        formIndex,
        formName: form?.Name || form?.Title || "",
        formKey,
        resourceKey: key || null,
        resourceDefKey: defKey || null,
      }));
    }
    walk(parsed, (value, pointer) => {
      if (manifestIds && isLargeGeneratedIdPointer(pointer, value) && !manifestIds.has(String(value))) {
        findings.push(error("YAPK_EMBEDDED_APPROVAL_DEFRESOURCE_ID_NOT_IN_MANIFEST", "Large numeric IDs embedded inside approval DefResource must be API-issued and listed in the ID provenance manifest.", {
          id: String(value),
          formIndex,
          formName: form?.Name || form?.Title || "",
          pointer,
        }));
      }
    });
  }
}

function validateVersionEvidence({ evidencePath, packageId, findings }) {
  if (!fs.existsSync(evidencePath)) {
    findings.push(error("INSTALL_VERSION_MANAGEMENT_EVIDENCE_MISSING", "Version Management evidence is required before runtime success can be claimed.", { evidencePath }));
    return;
  }
  const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  const apiStatus = firstDefined(evidence.apiStatus, evidence.install?.apiStatus, evidence.response?.apiStatus);
  const rows = collectVersionRows(evidence);
  if (String(apiStatus) === "0" && !rows.length) {
    findings.push(error("INSTALL_API_ACCEPTANCE_NOT_FINAL_SUCCESS", "Install/import API status 0 is submitted/accepted only; final success requires a Version Management row with Succeed for the exact PackageId.", {
      packageId,
      apiStatus,
    }));
    return;
  }
  const packageRows = rows.filter((row) => String(firstDefined(row.PackageId, row.packageId, row.ID, row.id, "")).trim() === packageId);
  if (!packageRows.length) {
    findings.push(error("INSTALL_VERSION_ROW_MISSING", "Version Management must contain a row for the exact submitted PackageId before runtime success is claimed.", { packageId }));
    return;
  }
  const failed = packageRows.find((row) => /fail|error/i.test(String(firstDefined(row.Status, row.status, row.State, row.state, ""))));
  if (failed) {
    findings.push(error("INSTALL_VERSION_ROW_FAILED", "A failed Version Management row blocks fresh-install retry with the same PackageId/ListSetID family.", { packageId, row: summarizeRow(failed) }));
    return;
  }
  const succeeded = packageRows.find((row) => /^succeed$/i.test(String(firstDefined(row.Status, row.status, row.State, row.state, "")).trim()));
  if (!succeeded) {
    findings.push(error("INSTALL_VERSION_ROW_NOT_SUCCEEDED", "Version Management final status must be exactly Succeed for the submitted PackageId.", {
      packageId,
      observedStatuses: packageRows.map((row) => firstDefined(row.Status, row.status, row.State, row.state, "")),
    }));
  }
}

function collectVersionRows(value) {
  const rows = [];
  walk(value, (node) => {
    if (!isObject(node)) return;
    const hasPackageId = firstDefined(node.PackageId, node.packageId, node.ID, node.id, "");
    const hasStatus = firstDefined(node.Status, node.status, node.State, node.state, "");
    if (hasPackageId && hasStatus) rows.push(node);
  });
  return rows;
}

function decodeDefResource(value) {
  if (isObject(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = parseJsonMaybe(value);
  if (isObject(parsed)) return parsed;
  try {
    const raw = Buffer.from(value, "base64");
    const payload = raw.subarray(0, BROTLI_PREFIX.length).equals(BROTLI_PREFIX)
      ? zlib.brotliDecompressSync(raw.subarray(BROTLI_PREFIX.length)).toString("utf8")
      : zlib.brotliDecompressSync(raw).toString("utf8");
    const decoded = JSON.parse(quoteLargeJsonIntegers(payload));
    return isObject(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function isLargeGeneratedIdPointer(pointer, value) {
  if (!LARGE_ID_RE.test(String(value || ""))) return false;
  if (/\.(?:AppID|Type|Status|Flags|Category|WorkflowType|Mobile|Order|StartIndex|CustomLength|AutoIncrement)$/.test(pointer)) return false;
  if (/\.(?:x|y|width|height|top|right|bottom|left|gap|radius|cSpan)$/.test(pointer)) return false;
  return /(?:ID|Id|Key|key|ListSetID|ListID|LayoutID|FieldID|DefResourceID|DeployedDefID|PackageId|ProcModelID|ProcModelListID|ProcModelListSetID|RefId|resourceid|ResourceID|sourceLongId)$/.test(pointer);
}

function idSetFromManifest(manifest) {
  const ids = new Set();
  for (const allocation of asArray(manifest.allocations)) {
    if (allocation?.id) ids.add(String(allocation.id));
  }
  if (isObject(manifest.pathToPurpose)) {
    for (const value of Object.values(manifest.pathToPurpose)) {
      if (isObject(value) && value.id) ids.add(String(value.id));
      else if (typeof value === "string") ids.add(value);
    }
  }
  for (const id of asArray(manifest.ids)) ids.add(String(id));
  return ids;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
}

function summarizeRow(row) {
  return {
    PackageId: firstDefined(row.PackageId, row.packageId, row.ID, row.id, ""),
    Status: firstDefined(row.Status, row.status, row.State, row.state, ""),
    Error: firstDefined(row.Error, row.error, row.Message, row.message, row.Log, row.log, ""),
  };
}

function defaultManifestPath(packagePath) {
  return packagePath.replace(/(?:\.signed)?\.yapk$/i, "-id-provenance-report.json");
}

function stringId(value) {
  return value === undefined || value === null ? "" : String(value);
}

function buildReport({ packagePath, manifestPath = null, findings, summary = {} }) {
  return {
    status: findings.length ? "fail" : "pass",
    package: packagePath,
    idProvenance: manifestPath,
    summary,
    findings,
  };
}

function error(code, message, details = {}) {
  return { severity: "error", code, message, ...details };
}

function printTextReport(report) {
  console.log(`YAPK live install readiness: ${report.status}`);
  if (report.status !== "pass") {
    for (const finding of report.findings) console.log(`- ${finding.code}: ${finding.message}`);
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help") args.help = true;
    else if (token === "--json") args.json = true;
    else if (token === "--package") {
      args.package = argv[index + 1];
      index += 1;
    } else if (token === "--id-provenance" || token === "--manifest") {
      args.idProvenance = argv[index + 1];
      index += 1;
    } else if (token === "--version-evidence") {
      args.versionEvidence = argv[index + 1];
      index += 1;
    } else if (token === "--package-id") {
      args.packageId = argv[index + 1];
      index += 1;
    } else if (!args.package && !token.startsWith("--")) {
      args.package = token;
    } else {
      throw new Error(`Unexpected argument: ${token}`);
    }
  }
  return args;
}

function printUsage() {
  console.log(`Usage: node scripts/validate-yapk-live-install-readiness.mjs --package app.generated-final.yapk [--id-provenance report.json] [--version-evidence evidence.json --package-id <id>] [--json]

Validates live-install readiness boundaries that generic schema checks cannot prove:
- wrapper/root ListID identity alignment;
- dashboard page root ownership and parseable dashboard Resource JSON;
- per-page dashboard template control UUID re-instantiation;
- API-issued provenance for IDs embedded inside dashboard JSON and approval DefResource;
- approval DefResource key/defkey alignment after fresh-ID remap;
- install API submitted-only status versus final Version Management Succeed proof.`);
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
