#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");

function apiId(offset) {
  return String(2100000000000000n + BigInt(offset));
}

function clone(value) {
  return structuredClone(value);
}

function writeReport(dir, name, data) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
}

function run(file) {
  return spawnSync(process.execPath, ["scripts/validate-generation-mode-id-provenance.mjs", "--report", file], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
}

function expectPass(label, result) {
  if (result.status !== 0) throw new Error(`${label} should pass.\n${result.stdout}\n${result.stderr}`);
}

function expectCode(label, result, code) {
  if (result.status === 0) throw new Error(`${label} should fail with ${code}.`);
  const output = `${result.stdout}\n${result.stderr}`;
  if (!output.includes(code)) throw new Error(`${label} did not report ${code}.\n${output}`);
}

function finalReport(overrides = {}) {
  const root = apiId(1);
  const dashboard = apiId(2);
  const requestList = apiId(3);
  const approvalForm = apiId(4);
  const workflow = apiId(5);
  return {
    generationMode: "final-authorized",
    readyForGeneratedFinal: true,
    outputClaim: "generated-final-readiness-candidate",
    authorization: {
      liveYeeflowApiUse: true,
      authorizedBy: "user-approved-live-id-generation",
      authorizedAt: "2026-06-20T00:00:00Z",
      targetWorkspace: { id: "workspace-redacted", name: "Codex Test Workspace" },
    },
    idGeneration: {
      strategy: "api-issued-before-generation",
      allocationTiming: "before-resource-generation",
      apiEndpoint: "GET /utils/generate/ids?count=12",
      localIdsGeneratedFirst: false,
      primaryPath: "api-issued-at-initial-generation",
    },
    resources: [
      { type: "application", name: "Facility Maintenance", id: root, idSource: "api-generated", generatedAt: "initial-generation" },
      { type: "dashboard", name: "Maintenance Dashboard", id: dashboard, idSource: "api-generated", generatedAt: "initial-generation", references: [{ path: "navigation.dashboard.LayoutID", targetId: dashboard, idSource: "api-generated" }] },
      { type: "data-list", name: "Maintenance Requests", id: requestList, idSource: "api-generated", generatedAt: "initial-generation", references: [{ path: "lookup.request.list", targetId: requestList, idSource: "api-generated" }] },
      { type: "approval-form", name: "Maintenance Approval", id: approvalForm, idSource: "api-generated", generatedAt: "initial-generation", references: [{ path: "workflow.request.form", targetId: approvalForm, idSource: "api-generated" }] },
      { type: "workflow", name: "Maintenance Routing", id: workflow, idSource: "api-generated", generatedAt: "initial-generation", references: [{ path: "workflow.targetList", targetId: requestList, idSource: "api-generated" }] },
    ],
    references: [
      { path: "dashboard.collection.sourceList", targetId: requestList, idSource: "api-generated" },
      { path: "form.submit.workflow", targetId: workflow, idSource: "api-generated" },
    ],
    lookups: [{ path: "fields.Location.lookupList", targetId: requestList, idSource: "api-generated" }],
    workflows: [{ path: "approval.workflow", targetId: workflow, idSource: "api-generated" }],
    navigation: [{ path: "navigation.group.items[0]", targetId: dashboard, idSource: "api-generated" }],
    dashboards: [{ path: "dashboard.widgets.requests", targetId: requestList, idSource: "api-generated" }],
    forms: [{ path: "approval.form", targetId: approvalForm, idSource: "api-generated" }],
    resourceBindings: [{ path: "collection.binding", targetId: requestList, idSource: "api-generated" }],
    ...overrides,
  };
}

function draftReport(overrides = {}) {
  return {
    generationMode: "draft-offline",
    readyForGeneratedFinal: false,
    outputClaim: "local-unsigned-draft",
    liveYeeflowApiUsed: false,
    idGeneration: {
      strategy: "local-draft",
      allocationTiming: "offline-draft-generation",
      localIdsGeneratedFirst: true,
    },
    resources: [
      { type: "application", name: "Draft App", id: "local-1001", idSource: "local-draft", generatedAt: "draft-generation" },
      { type: "data-list", name: "Draft Requests", id: "local-1002", idSource: "local-draft", generatedAt: "draft-generation" },
    ],
    ...overrides,
  };
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "final-generation-api-id-mode-"));
const cases = [];

try {
  expectPass("draft mode local IDs", run(writeReport(tempDir, "draft-pass", draftReport())));
  cases.push({ case: "Draft mode with local IDs is allowed only as local unsigned draft", status: "pass" });

  expectCode("draft generated-final", run(writeReport(tempDir, "draft-final", draftReport({ readyForGeneratedFinal: true, outputClaim: "generated-final-readiness-candidate" }))), "DRAFT_MODE_GENERATED_FINAL_FORBIDDEN");
  cases.push({ case: "Draft mode cannot claim generated-final readiness", status: "pass" });

  expectPass("final mode API-issued", run(writeReport(tempDir, "final-pass", finalReport())));
  cases.push({ case: "Final mode with authorization and API-issued IDs passes", status: "pass" });

  const noAuthorization = finalReport({ authorization: { liveYeeflowApiUse: false, targetWorkspace: { id: "workspace-redacted" } } });
  expectCode("final missing authorization", run(writeReport(tempDir, "final-no-auth", noAuthorization)), "FINAL_MODE_AUTHORIZATION_MISSING");
  cases.push({ case: "Final mode requires explicit authorization metadata", status: "pass" });

  const noWorkspace = finalReport({ authorization: { liveYeeflowApiUse: true, authorizedBy: "user-approved" } });
  expectCode("final missing workspace", run(writeReport(tempDir, "final-no-workspace", noWorkspace)), "FINAL_MODE_TARGET_WORKSPACE_MISSING");
  cases.push({ case: "Final mode requires target workspace metadata", status: "pass" });

  const remapPath = finalReport({ idGeneration: { strategy: "api-issued-before-generation", allocationTiming: "before-resource-generation", apiEndpoint: "GET /utils/generate/ids?count=12", localIdsGeneratedFirst: true, primaryPath: "local-first-then-remap" } });
  expectCode("final local first remap", run(writeReport(tempDir, "final-local-first", remapPath)), "FINAL_MODE_LOCAL_FIRST_REMAP_FORBIDDEN");
  cases.push({ case: "Final mode fails local IDs first then remap as primary path", status: "pass" });

  const posthocApi = finalReport();
  posthocApi.resources[1].generatedAt = "post-generation-remap";
  expectCode("final posthoc API ID", run(writeReport(tempDir, "final-posthoc", posthocApi)), "FINAL_MODE_RESOURCE_ID_NOT_INITIAL_GENERATION");
  cases.push({ case: "Final mode requires API-issued IDs at initial generation time", status: "pass" });

  const localResource = finalReport();
  localResource.resources[2].idSource = "local-draft";
  expectCode("final local resource", run(writeReport(tempDir, "final-local-resource", localResource)), "FINAL_MODE_RESOURCE_ID_NOT_API_ISSUED");
  cases.push({ case: "Final mode blocks local-draft resource IDs", status: "pass" });

  const unresolvedReference = finalReport({ references: [{ path: "dashboard.collection.sourceList", targetId: apiId(999), idSource: "api-generated" }] });
  expectCode("final unresolved reference", run(writeReport(tempDir, "final-unresolved-reference", unresolvedReference)), "FINAL_MODE_REFERENCE_TARGET_UNRESOLVED");
  cases.push({ case: "Final mode requires references and bindings to resolve to API-issued resources", status: "pass" });

  const localBinding = finalReport({ resourceBindings: [{ path: "collection.binding", targetId: apiId(3), idSource: "local-draft" }] });
  expectCode("final local binding", run(writeReport(tempDir, "final-local-binding", localBinding)), "FINAL_MODE_SURFACE_REFERENCE_NOT_API_ISSUED");
  cases.push({ case: "Final mode blocks non-API provenance in resource bindings", status: "pass" });

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
