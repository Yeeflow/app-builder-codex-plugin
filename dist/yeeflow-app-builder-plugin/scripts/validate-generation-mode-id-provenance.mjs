#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const FINAL_MODE = "final-authorized";
const DRAFT_MODE = "draft-offline";
const API_SOURCE = "api-generated";
const LOCAL_SOURCE = "local-draft";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.report) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateGenerationModeIdProvenance({ report: args.report });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateGenerationModeIdProvenance({ report: reportPath }) {
  if (!reportPath || !fs.existsSync(reportPath)) {
    return fail("GENERATION_MODE_REPORT_MISSING", "Generation mode ID provenance report is missing.", { report: reportPath });
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(reportPath, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    return fail("GENERATION_MODE_REPORT_INVALID_JSON", `Could not parse generation mode report: ${error.message}`);
  }

  const findings = [];
  const mode = normalize(data.generationMode || data.mode);
  if (![DRAFT_MODE, FINAL_MODE].includes(mode)) {
    findings.push(error("GENERATION_MODE_UNSUPPORTED", "Generation mode must be draft-offline or final-authorized.", { mode }));
  }

  if (mode === DRAFT_MODE) validateDraftMode(data, findings);
  if (mode === FINAL_MODE) validateFinalMode(data, findings);

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    report: path.resolve(reportPath),
    generationMode: mode || null,
    readyForGeneratedFinal: Boolean(data.readyForGeneratedFinal),
    resourceCount: resourcesOf(data).length,
    referenceCount: referencesOf(data).length,
    findings,
  };
}

function validateDraftMode(data, findings) {
  if (data.liveYeeflowApiUsed === true || data.authorization?.liveYeeflowApiUse === true) {
    findings.push(error("DRAFT_MODE_LIVE_API_FORBIDDEN", "Draft / Offline Mode must not use live Yeeflow APIs."));
  }
  if (data.readyForGeneratedFinal === true || claimOf(data).includes("generated-final")) {
    findings.push(error("DRAFT_MODE_GENERATED_FINAL_FORBIDDEN", "Draft / Offline Mode cannot claim generated-final readiness."));
  }
  if (!claimOf(data).includes("local-unsigned-draft")) {
    findings.push(error("DRAFT_MODE_OUTPUT_CLAIM_INVALID", "Draft / Offline Mode must be reported as local-unsigned-draft output only."));
  }

  const resources = resourcesOf(data);
  if (!resources.length) {
    findings.push(error("GENERATION_MODE_RESOURCES_MISSING", "Generation mode report must list generated resources."));
  }
  for (const resource of resources) {
    const source = idSourceOf(resource);
    if (![LOCAL_SOURCE, API_SOURCE].includes(source)) {
      findings.push(error("DRAFT_MODE_RESOURCE_ID_SOURCE_UNKNOWN", "Draft resources must declare local-draft or api-generated source.", resourceSummary(resource)));
    }
  }
}

function validateFinalMode(data, findings) {
  const authorization = isObject(data.authorization) ? data.authorization : {};
  if (authorization.liveYeeflowApiUse !== true) {
    findings.push(error("FINAL_MODE_AUTHORIZATION_MISSING", "Final / Authorized Generation Mode requires explicit live Yeeflow API authorization."));
  }
  if (!hasText(authorization.authorizedBy) && !hasText(authorization.authorizationId)) {
    findings.push(error("FINAL_MODE_AUTHORIZATION_ACTOR_MISSING", "Final mode authorization must record the authorizing user or authorization ID."));
  }
  const workspace = isObject(authorization.targetWorkspace) ? authorization.targetWorkspace : {};
  if (!hasText(workspace.id) && !hasText(workspace.name)) {
    findings.push(error("FINAL_MODE_TARGET_WORKSPACE_MISSING", "Final mode requires a target workspace before resource generation."));
  }

  const generation = isObject(data.idGeneration) ? data.idGeneration : {};
  if (normalize(generation.strategy) !== "api-issued-before-generation") {
    findings.push(error("FINAL_MODE_ID_STRATEGY_NOT_API_FIRST", "Final mode must allocate API-issued IDs before resource generation."));
  }
  if (normalize(generation.allocationTiming) !== "before-resource-generation") {
    findings.push(error("FINAL_MODE_ID_ALLOCATION_TIMING_INVALID", "Final mode ID allocation timing must be before-resource-generation."));
  }
  if (generation.localIdsGeneratedFirst === true || normalize(generation.primaryPath) === "local-first-then-remap") {
    findings.push(error("FINAL_MODE_LOCAL_FIRST_REMAP_FORBIDDEN", "Final mode must not generate local IDs first and remap them as the primary path."));
  }
  if (!String(generation.apiEndpoint || "").includes("/utils/generate/ids")) {
    findings.push(error("FINAL_MODE_ID_API_ENDPOINT_MISSING", "Final mode must record the Yeeflow ID API endpoint used for allocation."));
  }

  const resources = resourcesOf(data);
  if (!resources.length) {
    findings.push(error("GENERATION_MODE_RESOURCES_MISSING", "Generation mode report must list generated resources."));
  }

  const resourceIdMap = new Map();
  for (const resource of resources) {
    const summary = resourceSummary(resource);
    if (!hasText(resource.type)) findings.push(error("FINAL_MODE_RESOURCE_TYPE_MISSING", "Final mode resources must declare a type.", summary));
    if (!hasText(resource.name)) findings.push(error("FINAL_MODE_RESOURCE_NAME_MISSING", "Final mode resources must declare a name.", summary));
    if (!hasText(resource.id)) findings.push(error("FINAL_MODE_RESOURCE_ID_MISSING", "Final mode resources must declare their generated ID.", summary));
    if (idSourceOf(resource) !== API_SOURCE) {
      findings.push(error("FINAL_MODE_RESOURCE_ID_NOT_API_ISSUED", "Final mode generated resources must use API-issued IDs.", summary));
    }
    if (normalize(resource.generatedAt || resource.idAssignedAt) !== "initial-generation") {
      findings.push(error("FINAL_MODE_RESOURCE_ID_NOT_INITIAL_GENERATION", "Final mode resource IDs must be assigned during initial generation.", summary));
    }
    if (resource.localDraftId || resource.previousLocalId || resource.remappedFromLocalId) {
      findings.push(error("FINAL_MODE_RESOURCE_LOCAL_REMAP_TRACE_FORBIDDEN", "Final mode resources must not carry local-first remap provenance as the primary path.", summary));
    }
    if (hasText(resource.id)) resourceIdMap.set(String(resource.id), resource);
  }

  for (const reference of referencesOf(data)) {
    const targetId = String(reference.targetId || reference.id || "");
    if (!targetId) {
      findings.push(error("FINAL_MODE_REFERENCE_TARGET_MISSING", "Final mode references must declare a targetId.", reference));
      continue;
    }
    if (idSourceOf(reference) && idSourceOf(reference) !== API_SOURCE) {
      findings.push(error("FINAL_MODE_REFERENCE_ID_NOT_API_ISSUED", "Final mode references and bindings must use API-issued target IDs.", reference));
    }
    if (!resourceIdMap.has(targetId) && reference.external !== true) {
      findings.push(error("FINAL_MODE_REFERENCE_TARGET_UNRESOLVED", "Final mode reference target must resolve to an API-issued generated resource or be explicitly external.", reference));
    }
  }

  for (const area of ["lookups", "workflows", "navigation", "dashboards", "forms", "resourceBindings"]) {
    const items = Array.isArray(data[area]) ? data[area] : [];
    for (const item of items) {
      const targetId = String(item.targetId || item.resourceId || item.id || "");
      if (targetId && !resourceIdMap.has(targetId) && item.external !== true) {
        findings.push(error("FINAL_MODE_SURFACE_REFERENCE_UNRESOLVED", `${area} entry must use an API-issued generated resource ID or be explicitly external.`, { area, ...item }));
      }
      if (idSourceOf(item) && idSourceOf(item) !== API_SOURCE) {
        findings.push(error("FINAL_MODE_SURFACE_REFERENCE_NOT_API_ISSUED", `${area} entry must preserve API-issued ID provenance.`, { area, ...item }));
      }
    }
  }
}

function resourcesOf(data) {
  return Array.isArray(data.resources) ? data.resources : [];
}

function referencesOf(data) {
  const direct = Array.isArray(data.references) ? data.references : [];
  const nested = resourcesOf(data).flatMap((resource) =>
    Array.isArray(resource.references)
      ? resource.references.map((reference) => ({ ...reference, sourceResource: resource.name || resource.id || null }))
      : [],
  );
  return [...direct, ...nested];
}

function idSourceOf(value) {
  return normalize(value.idSource || value.sourceMarker || value.source || value.provenance);
}

function claimOf(data) {
  return normalize(data.outputClaim || data.outputType || data.claim || "");
}

function resourceSummary(resource) {
  return {
    name: resource.name || null,
    type: resource.type || null,
    id: resource.id || null,
    idSource: idSourceOf(resource) || null,
    generatedAt: resource.generatedAt || resource.idAssignedAt || null,
  };
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function fail(code, message, details = {}) {
  return { status: "fail", findings: [error(code, message, details)] };
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--report") args.report = argv[++index];
  }
  return args;
}

function printUsage() {
  console.error("Usage: node scripts/validate-generation-mode-id-provenance.mjs --report <generation-mode-report.json>");
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}
