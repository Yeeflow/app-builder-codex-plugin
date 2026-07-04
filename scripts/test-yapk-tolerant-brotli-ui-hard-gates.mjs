#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { encodeYapkResourceOfficial } from "./lib/yapk-decode-utils.mjs";
import { readPackageLike } from "./lib/yeeflow-ui-hard-gate-utils.mjs";
import { inspectDashboardSummaryControlContract } from "./inspect-dashboard-summary-control-contract.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-tolerant-ui-gates-"));
  const packagePath = path.join(tempDir, "official-style-ui-gate.yapk");
  const wrapper = writeOfficialStylePackage(packagePath);
  const encodedBytes = Buffer.from(wrapper.Resource, "base64");

  assert.throws(() => zlib.brotliDecompressSync(encodedBytes), /unexpected end of file|Decompression failed/i);
  assert.equal(readPackageLike(packagePath).decoded.ListSet.Title, "Tolerant UI Gate Fixture");

  const summaryReport = inspectDashboardSummaryControlContract({ package: packagePath });
  assert.equal(summaryReport.status, "pass");
  assert.equal(hasFinding(summaryReport, "SUMMARY_PACKAGE_READ_FAILED"), false);
  assert.equal(hasFinding(summaryReport, "SUMMARY_CONTROLS_NOT_FOUND"), true);

  const cli = spawnSync(process.execPath, [path.join(ROOT, "scripts/inspect-dashboard-summary-control-contract.mjs"), "--package", packagePath], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  assert.equal(cli.status, 0, cli.stdout || cli.stderr);
  const cliReport = JSON.parse(cli.stdout);
  assert.equal(cliReport.status, "pass");
  assert.equal(hasFinding(cliReport, "SUMMARY_PACKAGE_READ_FAILED"), false);

  console.log(JSON.stringify({
    status: "pass",
    assertions: [
      "official export-compatible Resource still fails strict Brotli",
      "UI hard-gate readPackageLike uses shared tolerant decoder",
      "Summary/KPI inspector accepts official-style tolerant Brotli packages",
    ],
  }, null, 2));
}

function writeOfficialStylePackage(file) {
  const decoded = minimalDecodedPackage();
  const wrapper = {
    PackageId: "2071000000000000001",
    TenantID: "1000000000000000000",
    AppID: 41,
    ListID: "2071000000000000002",
    Title: "Tolerant UI Gate Fixture",
    Description: "Fixture proving UI hard gates decode official export-compatible Resource payloads.",
    IconUrl: JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-chart-line", c: "#0065FF" }),
    Resource: encodeYapkResourceOfficial(decoded),
    Notes: "Regression fixture only.",
    Author: "Codex Yeeflow App Builder",
    Date: "2026-07-04T00:00:00Z",
    Version: "1.0.0",
    Sign: Buffer.alloc(32, 2).toString("base64"),
  };
  fs.writeFileSync(file, JSON.stringify(wrapper, null, 2));
  return wrapper;
}

function minimalDecodedPackage() {
  const dashboardId = "2071000000000000003";
  return {
    ListSet: {
      ListID: "2071000000000000002",
      Title: "Tolerant UI Gate Fixture",
      Type: 1024,
      Flags: 1,
      LayoutView: JSON.stringify({ groups: [], items: [] }),
      IconUrl: JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-chart-line", c: "#0065FF" }),
    },
    Pages: [{
      LayoutID: dashboardId,
      ListID: "2071000000000000002",
      Title: "Dashboard Without Summary",
      Type: 103,
      LayoutInResources: [{
        ID: dashboardId,
        RefId: dashboardId,
        Resource: JSON.stringify({
          id: "7d42508c-ec2f-41d8-a55c-180b72736058",
          type: "container",
          nv_label: "main",
          attrs: { container: { cw: "2", padding: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }] } },
          tempVars: [],
          ReportIds: [],
          exts: [],
          children: [],
        }),
      }],
    }],
    Childs: [],
    Forms: [],
    FormReports: [],
    FormNewReports: [],
    CustomServices: [],
    DataReports: [],
    PortalInfo: null,
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
  };
}

function hasFinding(report, code) {
  return [...(report.findings || []), ...(report.errors || []), ...(report.warnings || [])].some((finding) => finding.code === code);
}

main();
