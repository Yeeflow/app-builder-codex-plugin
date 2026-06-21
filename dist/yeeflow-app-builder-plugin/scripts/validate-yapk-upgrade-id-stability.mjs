#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isObject, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const NUMERIC_RE = /^\d+$/;

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.previousPackage || !args.previousManifest || !args.newPackage || !args.newManifest) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateYapkUpgradeIdStability(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateYapkUpgradeIdStability({
  previousPackage,
  previousManifest,
  newPackage,
  newManifest,
} = {}) {
  const findings = [];
  const packageErrors = validateInputFiles({ previousPackage, previousManifest, newPackage, newManifest });
  if (packageErrors.length) return failReport(packageErrors);

  let previousDecoded;
  let newDecoded;
  let previousLineage;
  let newLineage;
  try {
    previousDecoded = readDecodedYapk(previousPackage).decoded;
  } catch (error) {
    return fail("UPGRADE_PREVIOUS_PACKAGE_DECODE_FAILED", `Could not decode previous package Resource: ${error.message}`);
  }
  try {
    newDecoded = readDecodedYapk(newPackage).decoded;
  } catch (error) {
    return fail("UPGRADE_NEW_PACKAGE_DECODE_FAILED", `Could not decode new package Resource: ${error.message}`);
  }
  try {
    previousLineage = readLineageManifest(previousManifest);
  } catch (error) {
    return fail("UPGRADE_PREVIOUS_MANIFEST_INVALID_JSON", `Could not parse previous ID lineage manifest: ${error.message}`);
  }
  try {
    newLineage = readLineageManifest(newManifest);
  } catch (error) {
    return fail("UPGRADE_NEW_MANIFEST_INVALID_JSON", `Could not parse new ID lineage manifest: ${error.message}`);
  }

  const previousObjects = normalizeLineageObjects(previousLineage, "previous");
  const newObjects = normalizeLineageObjects(newLineage, "new");
  if (!previousObjects.length) findings.push(error("UPGRADE_PREVIOUS_LINEAGE_EMPTY", "Previous version lineage manifest contains no objects."));
  if (!newObjects.length) findings.push(error("UPGRADE_NEW_LINEAGE_EMPTY", "New version lineage manifest contains no objects."));

  const previousByKey = buildUniqueKeyMap(previousObjects, findings, "previous");
  const newByKey = buildUniqueKeyMap(newObjects, findings, "new");
  const previousIdToKey = buildIdToKeyMap(previousObjects);
  const newIdToKey = buildIdToKeyMap(newObjects);

  let preservedCount = 0;
  let changedCount = 0;
  let removedCount = 0;
  let newCount = 0;

  for (const [semanticKey, previousObject] of previousByKey.entries()) {
    const nextObject = newByKey.get(semanticKey);
    if (!nextObject) {
      removedCount += 1;
      const reusedBy = newIdToKey.get(previousObject.id);
      if (reusedBy && reusedBy !== semanticKey) {
        findings.push(error("UPGRADE_REMOVED_ID_REUSED", "Removed object ID is reused by a different semantic key.", {
          id: previousObject.id,
          previousSemanticKey: semanticKey,
          newSemanticKey: reusedBy,
        }));
      }
      continue;
    }
    if (previousObject.id !== nextObject.id) {
      changedCount += 1;
      findings.push(error("UPGRADE_EXISTING_ID_CHANGED", "Existing semantic object changed ID across YAPK versions.", {
        semanticKey,
        objectType: nextObject.objectType,
        previousId: previousObject.id,
        newId: nextObject.id,
      }));
      continue;
    }
    preservedCount += 1;
    if (nextObject.idSource === "api-issued-new" || nextObject.status === "new") {
      findings.push(error("UPGRADE_EXISTING_OBJECT_MARKED_NEW", "Existing semantic object is marked as newly allocated instead of previous-version-preserved.", {
        semanticKey,
        id: nextObject.id,
      }));
    }
  }

  const apiIssuedIds = collectApiIssuedIds(newLineage, newObjects);
  for (const [semanticKey, nextObject] of newByKey.entries()) {
    const previousKeyForId = previousIdToKey.get(nextObject.id);
    if (!previousByKey.has(semanticKey)) {
      newCount += 1;
      if (previousKeyForId && previousKeyForId !== semanticKey) {
        findings.push(error("UPGRADE_PREVIOUS_ID_REUSED_FOR_NEW_OBJECT", "New semantic object reuses an ID from a different previous object.", {
          semanticKey,
          reusedPreviousSemanticKey: previousKeyForId,
          id: nextObject.id,
        }));
      }
      if (!isApiIssuedNew(nextObject, apiIssuedIds)) {
        findings.push(error("UPGRADE_NEW_ID_NOT_API_ISSUED", "New semantic object must use a new API-issued ID recorded in the new lineage manifest.", {
          semanticKey,
          id: nextObject.id,
          idSource: nextObject.idSource || null,
          status: nextObject.status || null,
        }));
      }
    }
  }

  if (previousByKey.size > 0 && changedCount === previousByKey.size && newByKey.size >= previousByKey.size) {
    findings.push(error("UPGRADE_ALL_IDS_REALLOCATED", "Every existing semantic object changed ID; replacing all IDs is a hard failure for YAPK upgrades.", {
      previousObjectCount: previousByKey.size,
      changedCount,
    }));
  }

  validateManifestPaths(previousObjects, previousDecoded, "previous", findings);
  validateManifestPaths(newObjects, newDecoded, "new", findings);
  validateReferences(newObjects, newDecoded, newByKey, findings);

  const status = findings.some((finding) => finding.level === "error") ? "fail" : "pass";
  return {
    status,
    previousPackage: summarizePath(previousPackage),
    previousManifest: summarizePath(previousManifest),
    newPackage: summarizePath(newPackage),
    newManifest: summarizePath(newManifest),
    summary: {
      previousObjectCount: previousObjects.length,
      newObjectCount: newObjects.length,
      preservedCount,
      changedCount,
      removedCount,
      addedCount: newCount,
      newApiIssuedCount: apiIssuedIds.size,
    },
    proofBoundary: "Upgrade ID stability proves manifest-declared semantic ID continuity only. Signing, verifysign, upgrade-check, upgrade acceptance, and install acceptance do not prove ID continuity or runtime correctness.",
    findings,
  };
}

function validateInputFiles(paths) {
  const findings = [];
  const required = [
    ["previousPackage", "UPGRADE_PREVIOUS_PACKAGE_REQUIRED"],
    ["previousManifest", "UPGRADE_PREVIOUS_MANIFEST_REQUIRED"],
    ["newPackage", "UPGRADE_NEW_PACKAGE_REQUIRED"],
    ["newManifest", "UPGRADE_NEW_MANIFEST_REQUIRED"],
  ];
  for (const [key, code] of required) {
    if (!paths[key]) {
      findings.push(error(code, `${key} is required for upgrade ID stability validation.`));
    } else if (!fs.existsSync(paths[key])) {
      findings.push(error(`${code}_MISSING`, `${key} path does not exist.`, { path: paths[key] }));
    }
  }
  return findings;
}

function readLineageManifest(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function normalizeLineageObjects(manifest, side) {
  const raw = Array.isArray(manifest?.objects)
    ? manifest.objects
    : Array.isArray(manifest?.lineage)
      ? manifest.lineage
      : Array.isArray(manifest?.idLineage)
        ? manifest.idLineage
        : allocationsToLineageObjects(manifest);
  return raw
    .filter(isObject)
    .map((item, index) => ({
      side,
      index,
      semanticKey: String(item.semanticKey ?? item.semantic_key ?? item.key ?? item.path ?? "").trim(),
      objectType: String(item.objectType ?? item.object_type ?? item.type ?? "unknown").trim(),
      title: item.title ?? item.name ?? null,
      parentSemanticKey: item.parentSemanticKey ?? item.parent_semantic_key ?? null,
      path: item.path || item.packagePath || item.package_path || null,
      id: String(item.id ?? item.ID ?? item.value ?? "").trim(),
      status: item.status || item.lifecycle || null,
      idSource: item.idSource || item.id_source || item.source || item.sourceMarker || null,
      references: Array.isArray(item.references) ? item.references : [],
    }));
}

function allocationsToLineageObjects(manifest) {
  const allocations = [];
  if (Array.isArray(manifest?.allocations)) allocations.push(...manifest.allocations);
  if (Array.isArray(manifest?.allocatedIds)) allocations.push(...manifest.allocatedIds);
  if (isObject(manifest?.pathToPurpose)) {
    for (const [declaredPath, value] of Object.entries(manifest.pathToPurpose)) {
      if (isObject(value)) allocations.push({ ...value, path: value.path || declaredPath });
      else allocations.push({ id: value, path: declaredPath });
    }
  }
  return allocations.map((allocation) => ({
    semanticKey: allocation.semanticKey || allocation.semantic_key || allocation.purpose || allocation.path,
    objectType: allocation.objectType || allocation.object_type || "content-id",
    path: allocation.path,
    id: allocation.id ?? allocation.ID ?? allocation.value,
    idSource: allocation.idSource || allocation.source || allocation.sourceMarker,
    status: allocation.status,
  }));
}

function buildUniqueKeyMap(objects, findings, side) {
  const map = new Map();
  for (const object of objects) {
    if (!object.semanticKey) {
      findings.push(error("UPGRADE_SEMANTIC_KEY_MISSING", "Lineage object is missing semanticKey.", { side, index: object.index, path: object.path || null }));
      continue;
    }
    if (!object.id || !NUMERIC_RE.test(object.id)) {
      findings.push(error("UPGRADE_LINEAGE_ID_INVALID", "Lineage object ID must be a numeric string.", { side, semanticKey: object.semanticKey, id: object.id || null }));
      continue;
    }
    if (map.has(object.semanticKey)) {
      findings.push(error("UPGRADE_SEMANTIC_KEY_DUPLICATE", "Lineage manifest contains duplicate semanticKey; ambiguous upgrade matching fails closed.", {
        side,
        semanticKey: object.semanticKey,
      }));
      continue;
    }
    if (String(object.objectType || "").toLowerCase() === "layout" && !hasDisambiguatedLayoutKey(object.semanticKey)) {
      findings.push(error("UPGRADE_LAYOUT_SEMANTIC_KEY_UNDISAMBIGUATED", "Layout semantic keys must include list title, layout title, layout type, and index or equivalent disambiguator.", {
        side,
        semanticKey: object.semanticKey,
      }));
      continue;
    }
    map.set(object.semanticKey, object);
  }
  return map;
}

function hasDisambiguatedLayoutKey(semanticKey) {
  const parts = String(semanticKey || "").split(":").filter(Boolean);
  if (parts.length >= 5) return true;
  return /layout(type|Type|_type|Index|index|#|\[[0-9]+\])/.test(String(semanticKey || ""));
}

function buildIdToKeyMap(objects) {
  const map = new Map();
  for (const object of objects) {
    if (object.id && object.semanticKey && !map.has(object.id)) map.set(object.id, object.semanticKey);
  }
  return map;
}

function collectApiIssuedIds(manifest, objects) {
  const ids = new Set();
  for (const object of objects) {
    if (object.idSource === "api-issued-new" || object.source === "api-issued-new") ids.add(object.id);
  }
  const raw = [
    ...(Array.isArray(manifest?.newApiIssuedIds) ? manifest.newApiIssuedIds : []),
    ...(Array.isArray(manifest?.apiIssuedNewIds) ? manifest.apiIssuedNewIds : []),
    ...(Array.isArray(manifest?.allocatedIds) ? manifest.allocatedIds : []),
    ...(Array.isArray(manifest?.allocations) ? manifest.allocations : []),
  ];
  for (const item of raw) {
    if (typeof item === "string" || typeof item === "number") ids.add(String(item));
    else if (isObject(item)) {
      const source = item.idSource || item.id_source || item.source || item.sourceMarker;
      if (source === "api-issued-new" || source === "api-generated") ids.add(String(item.id ?? item.ID ?? item.value ?? ""));
    }
  }
  return ids;
}

function isApiIssuedNew(object, apiIssuedIds) {
  return object.idSource === "api-issued-new" || object.idSource === "api-generated" || apiIssuedIds.has(object.id);
}

function validateManifestPaths(objects, decoded, side, findings) {
  for (const object of objects) {
    if (!object.path) continue;
    const value = valueAtPath({ decoded }, object.path);
    if (value === undefined) {
      findings.push(error("UPGRADE_MANIFEST_PATH_MISSING", "Lineage object path does not resolve in package.", { side, semanticKey: object.semanticKey, path: object.path }));
    } else if (String(value) !== object.id) {
      findings.push(error("UPGRADE_MANIFEST_PATH_ID_MISMATCH", "Lineage object path resolves to a different ID than declared.", {
        side,
        semanticKey: object.semanticKey,
        path: object.path,
        expectedId: object.id,
        actualId: String(value),
      }));
    }
  }
}

function validateReferences(objects, decoded, byKey, findings) {
  for (const object of objects) {
    for (const reference of object.references) {
      if (!isObject(reference) || !reference.path || !reference.semanticKey) continue;
      const target = byKey.get(reference.semanticKey);
      const actual = valueAtPath({ decoded }, reference.path);
      if (!target) {
        findings.push(error("UPGRADE_REFERENCE_TARGET_MISSING", "Lineage reference target semanticKey is absent from the new manifest.", {
          semanticKey: object.semanticKey,
          targetSemanticKey: reference.semanticKey,
        }));
      } else if (String(actual) !== target.id) {
        findings.push(error("UPGRADE_REFERENCE_ID_MISMATCH", "New package cross-reference does not point at the preserved/new ID for its target semantic key.", {
          semanticKey: object.semanticKey,
          targetSemanticKey: reference.semanticKey,
          path: reference.path,
          expectedId: target.id,
          actualId: actual === undefined ? null : String(actual),
        }));
      }
    }
  }
}

function valueAtPath(roots, declaredPath) {
  const normalized = declaredPath.replace(/^\$/, "decoded");
  const rootName = normalized.startsWith("decoded") ? "decoded" : null;
  if (!rootName) return undefined;
  const parts = normalized.slice(rootName.length).match(/(?:\.([A-Za-z_$][A-Za-z0-9_$]*))|(?:\[(\d+)\])/g) || [];
  let current = roots[rootName];
  for (const part of parts) {
    if (typeof current === "string" && /^[\[{]/.test(current.trim())) {
      try {
        current = JSON.parse(current);
      } catch {
        return undefined;
      }
    }
    if (part.startsWith(".")) current = current?.[part.slice(1)];
    else current = current?.[Number(part.slice(1, -1))];
    if (current === undefined) return undefined;
  }
  return current;
}

function summarizePath(filePath) {
  return {
    name: path.basename(filePath),
    ext: path.extname(filePath),
    exists: fs.existsSync(filePath),
    fileSize: fs.existsSync(filePath) ? fs.statSync(filePath).size : null,
  };
}

function fail(code, message, details = {}) {
  return failReport([error(code, message, details)]);
}

function failReport(findings) {
  return { status: "fail", findings };
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--previous-package") args.previousPackage = argv[++i];
    else if (token === "--previous-manifest" || token === "--previous-lineage" || token === "--previous-id-lineage") args.previousManifest = argv[++i];
    else if (token === "--new-package" || token === "--package") args.newPackage = argv[++i];
    else if (token === "--new-manifest" || token === "--new-lineage" || token === "--new-id-lineage") args.newManifest = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-yapk-upgrade-id-stability.mjs \\
    --previous-package <previous.yapk> \\
    --previous-manifest <previous-id-lineage.json> \\
    --new-package <new.yapk> \\
    --new-manifest <new-id-lineage.json>`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
