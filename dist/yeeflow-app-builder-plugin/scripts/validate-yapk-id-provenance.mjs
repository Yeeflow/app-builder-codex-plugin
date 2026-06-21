#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isObject, readDecodedYapk, walk } from "./lib/yapk-decode-utils.mjs";

const NUMERIC_RE = /^\d+$/;
const ID_KEY_RE = /(^|\.)(ID|Id|Key|PackageId|TenantID|ListID|LayoutID|FieldID|RefId|DefResourceID|DeployedDefID|FormKey|FlowKey)$/;
const ENUM_KEYS = new Set(["AppID", "Type", "Status", "Flags", "FieldIndex", "Category", "Order", "Mobile", "ListType"]);
const WRAPPER_METADATA_ID_PATH_RE = /^wrapper\.(TenantID|CreatedBy|ModifiedBy)$/;

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package || !args.manifest) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateYapkIdProvenance(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateYapkIdProvenance({ package: packagePath, manifest: manifestPath }) {
  const findings = [];
  let wrapper;
  let decoded;
  let manifest;

  if (!packagePath || !fs.existsSync(packagePath)) {
    return fail("YAPK_PACKAGE_MISSING", "Package file is missing.", { package: packagePath });
  }
  if (!manifestPath || !fs.existsSync(manifestPath)) {
    return fail("ID_PROVENANCE_MANIFEST_MISSING", "ID provenance manifest is missing.", { manifest: manifestPath });
  }

  try {
    ({ wrapper, decoded } = readDecodedYapk(packagePath));
  } catch (error) {
    return fail("YAPK_RESOURCE_DECODE_FAILED", `Could not decode package Resource: ${error.message}`);
  }
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    return fail("ID_PROVENANCE_MANIFEST_INVALID_JSON", `Could not parse ID provenance manifest: ${error.message}`);
  }

  const source = manifest.sourceMarker || manifest.source || manifest.idSource || manifest.id_source;
  if (source !== "api-generated") {
    findings.push(error("ID_PROVENANCE_SOURCE_NOT_API_GENERATED", "ID provenance manifest source marker must be api-generated.", { source }));
  }
  if (!isObject(manifest.generatorProvenance) && !isObject(manifest.generator_provenance)) {
    findings.push(error("ID_PROVENANCE_GENERATOR_METADATA_MISSING", "Manifest must include generator provenance metadata."));
  }

  const allocations = normalizeAllocations(manifest);
  if (!allocations.length) {
    findings.push(error("ID_PROVENANCE_ALLOCATIONS_MISSING", "Manifest must include path-to-purpose ID allocations."));
  }

  const idsToAllocations = new Map();
  const duplicateIds = new Set();
  for (const allocation of allocations) {
    if (!NUMERIC_RE.test(allocation.id)) {
      findings.push(error("ID_PROVENANCE_ALLOCATION_ID_INVALID", "Allocated ID must be a numeric string.", { allocation }));
      continue;
    }
    if (idsToAllocations.has(allocation.id)) duplicateIds.add(allocation.id);
    if (!idsToAllocations.has(allocation.id)) idsToAllocations.set(allocation.id, []);
    idsToAllocations.get(allocation.id).push(allocation);
    if (allocation.source && allocation.source !== "api-generated") {
      findings.push(error("ID_PROVENANCE_ALLOCATION_SOURCE_NOT_API_GENERATED", "Allocation source must be api-generated.", { allocation }));
    }
    if (allocation.source === "api-generated" && /(^|\.|\])TenantID$/.test(String(allocation.path || ""))) {
      findings.push(warning("TENANT_METADATA_API_ID_ALLOCATION_REVIEW_REQUIRED", "TenantID is tenant metadata, not an app content resource ID. Do not API-generate wrapper or tenant metadata IDs unless plugin-contained export/API evidence proves this is correct.", { allocation }));
    }
  }
  for (const id of duplicateIds) {
    findings.push(error("ID_PROVENANCE_DUPLICATE_ALLOCATED_ID", "Manifest contains duplicate allocated IDs.", { id }));
  }

  const packageIds = collectNumericContentIds({ wrapper, decoded });
  const pathResolvedIds = new Set();
  for (const item of packageIds) {
    if (!idsToAllocations.has(item.id)) {
      findings.push(error("ID_PROVENANCE_PACKAGE_ID_NOT_IN_MANIFEST", "Package contains a numeric content ID absent from the API provenance manifest.", item));
    }
  }

  const packageIdSet = new Set(packageIds.map((item) => item.id));
  for (const allocation of allocations) {
    if (allocation.path) {
      if (!valueAtPathMatches({ wrapper, decoded }, allocation.path, allocation.id)) {
        findings.push(error("ID_PROVENANCE_MANIFEST_ID_NOT_FOUND_AT_PATH", "Manifest allocation ID was not found at its declared path.", allocation));
        continue;
      }
      pathResolvedIds.add(allocation.id);
    }
    if (!packageIdSet.has(allocation.id) && !pathResolvedIds.has(allocation.id)) {
      const explained = allocation.unusedReason || allocation.reason || allocation.status === "unused-explained";
      if (!explained) {
        findings.push(error("ID_PROVENANCE_UNEXPLAINED_UNUSED_ID", "Manifest contains an allocated ID not used in the package without an explanation.", allocation));
      }
    }
  }

  const unusedCount = Number(manifest.unusedCount ?? manifest.unused_count ?? 0);
  const unused = Array.isArray(manifest.unused) ? manifest.unused : [];
  if (unusedCount > 0 && unused.some((item) => !item.reason && !item.unusedReason)) {
    findings.push(error("ID_PROVENANCE_UNEXPLAINED_UNUSED_ID", "Manifest reports unexplained unused IDs.", { unusedCount }));
  }

  const nonApiIds = manifest.nonApiIds || manifest.non_api_ids || manifest.localIds || manifest.local_ids || [];
  if (Array.isArray(nonApiIds) && nonApiIds.length) {
    findings.push(error("ID_PROVENANCE_NON_API_IDS_PRESENT", "Manifest lists non-API IDs; generated-final output requires none.", { count: nonApiIds.length }));
  }

  const requested = Number(manifest.totalRequestedIds ?? manifest.total_requested_ids ?? manifest.requested ?? 0);
  const received = Number(manifest.totalReceivedIds ?? manifest.total_received_ids ?? manifest.received ?? 0);
  if (requested && received && received < requested) {
    findings.push(error("ID_PROVENANCE_RECEIVED_LESS_THAN_REQUESTED", "Received fewer IDs than requested.", { requested, received }));
  }

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    package: path.resolve(packagePath),
    manifest: path.resolve(manifestPath),
    sourceMarker: source || null,
    packageNumericContentIdCount: packageIds.length,
    allocationCount: allocations.length,
    duplicateCount: duplicateIds.size,
    findings,
  };
}

export function collectNumericContentIds({ wrapper, decoded }) {
  const ids = [];
  const visit = (rootName, root) => {
    walk(root, (value, pointer) => {
      const fullPath = `${rootName}${pointer.slice(1)}`;
      if (rootName === "wrapper" && WRAPPER_METADATA_ID_PATH_RE.test(fullPath)) return;
      const key = pointer.split(".").pop()?.replace(/\[\d+\]$/, "") || "";
      if (ENUM_KEYS.has(key)) return;
      if (!isIdentifierPath(pointer)) return;
      if (typeof value === "number" && Number.isInteger(value) && value > 999999) ids.push({ id: String(value), path: fullPath });
      else if (typeof value === "string" && NUMERIC_RE.test(value) && value.length >= 7) ids.push({ id: value, path: fullPath });
    });
  };
  visit("wrapper", wrapper);
  visit("decoded", decoded);
  return dedupeByPathAndId(ids);
}

function isIdentifierPath(pointer) {
  const key = pointer.split(".").pop()?.replace(/\[\d+\]$/, "") || "";
  return ID_KEY_RE.test(key);
}

function normalizeAllocations(manifest) {
  const allocations = [];
  const raw = manifest.allocations || manifest.allocatedIds || manifest.allocated_ids || [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "string" || typeof item === "number") allocations.push({ id: String(item), path: null, purpose: null, source: "api-generated" });
      else if (isObject(item)) allocations.push({ ...item, id: String(item.id ?? item.ID ?? item.value ?? "") });
    }
  }
  const mapping = manifest.pathToPurpose || manifest.path_to_purpose || {};
  if (isObject(mapping)) {
    for (const [declaredPath, value] of Object.entries(mapping)) {
      if (isObject(value)) allocations.push({ ...value, id: String(value.id ?? value.ID ?? ""), path: value.path || declaredPath, purpose: value.purpose || value.label || null });
      else allocations.push({ id: String(value), path: declaredPath, purpose: null, source: "api-generated" });
    }
  }
  const normalized = allocations.map((allocation) => ({
    ...allocation,
    id: String(allocation.id || ""),
    path: allocation.path || null,
    source: allocation.source || allocation.sourceMarker || allocation.idSource || "api-generated",
  }));
  const seen = new Set();
  return normalized.filter((allocation) => {
    const key = `${allocation.id}:${allocation.path || ""}:${allocation.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function valueAtPathMatches(roots, declaredPath, expected) {
  const normalized = declaredPath.replace(/^\$/, "decoded");
  const rootName = normalized.startsWith("wrapper") ? "wrapper" : normalized.startsWith("decoded") ? "decoded" : null;
  if (!rootName) return true;
  const pathParts = normalized.slice(rootName.length).match(/(?:\.([A-Za-z_$][A-Za-z0-9_$]*))|(?:\[(\d+)\])/g) || [];
  let current = roots[rootName];
  for (const part of pathParts) {
    if (typeof current === "string" && /^[\[{]/.test(current.trim())) {
      try {
        current = JSON.parse(current);
      } catch {
        return false;
      }
    }
    if (part.startsWith(".")) current = current?.[part.slice(1)];
    else current = current?.[Number(part.slice(1, -1))];
  }
  return String(current) === String(expected);
}

function dedupeByPathAndId(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.path}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fail(code, message, details = {}) {
  return { status: "fail", findings: [error(code, message, details)] };
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function warning(code, message, details = {}) {
  return { level: "warning", code, message, ...details };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--package") args.package = argv[++i];
    else if (token === "--manifest") args.manifest = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log("Usage: node scripts/validate-yapk-id-provenance.mjs --package <app.yapk> --manifest <app-id-provenance-report.json>");
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
