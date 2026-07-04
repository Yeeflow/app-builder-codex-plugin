#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { encodeYapkResourceOfficial, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-official-resource-"));
  const decoded = minimalDecodedPackage();
  const fullPackage = writePackage(path.join(tempDir, "official-shape.yapk"), decoded);
  const encodedBytes = Buffer.from(fullPackage.Resource, "base64");

  assert.throws(() => zlib.brotliDecompressSync(encodedBytes), /unexpected end of file|Decompression failed/i);
  assert.equal(readDecodedYapk(path.join(tempDir, "official-shape.yapk")).decoded.ListSet.Title, "Official Resource Contract Fixture");

  const fullValidation = runValidator(path.join(tempDir, "official-shape.yapk"));
  assert.equal(hasCode(fullValidation, "FORMREPORTS_EXPORT_SHAPE_REQUIRED"), false);
  assert.equal(hasCode(fullValidation, "CUSTOMSERVICES_EXPORT_SHAPE_REQUIRED"), false);

  const noFormReports = { ...decoded };
  delete noFormReports.FormReports;
  writePackage(path.join(tempDir, "missing-formreports.yapk"), noFormReports);
  assert.equal(hasCode(runValidator(path.join(tempDir, "missing-formreports.yapk")), "FORMREPORTS_EXPORT_SHAPE_REQUIRED"), true);

  const noCustomServices = { ...decoded };
  delete noCustomServices.CustomServices;
  writePackage(path.join(tempDir, "missing-customservices.yapk"), noCustomServices);
  assert.equal(hasCode(runValidator(path.join(tempDir, "missing-customservices.yapk")), "CUSTOMSERVICES_EXPORT_SHAPE_REQUIRED"), true);

  console.log(JSON.stringify({
    status: "pass",
    assertions: [
      "official Resource strict Brotli fails with truncated export-compatible stream",
      "shared tolerant decoder parses official Resource",
      "validate-yapk-package requires FormReports array",
      "validate-yapk-package requires CustomServices array",
    ],
  }, null, 2));
}

function writePackage(file, decoded) {
  const wrapper = {
    PackageId: "2070000000000000001",
    TenantID: "1000000000000000000",
    AppID: 41,
    ListID: "2070000000000000002",
    Title: "Official Resource Contract Fixture",
    Description: "Fixture for official export-compatible Resource encoding.",
    IconUrl: JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-laptop", c: "#0065FF" }),
    Resource: encodeYapkResourceOfficial(decoded),
    Notes: "Regression fixture only.",
    Author: "Codex Yeeflow App Builder",
    Date: "2026-07-04T00:00:00Z",
    Version: "1.0.0",
    Sign: Buffer.alloc(32, 1).toString("base64"),
  };
  fs.writeFileSync(file, JSON.stringify(wrapper, null, 2));
  return wrapper;
}

function minimalDecodedPackage() {
  return {
    ListSet: {
      ListID: "2070000000000000002",
      Title: "Official Resource Contract Fixture",
      Type: 1024,
      Flags: 1,
      LayoutView: JSON.stringify({ groups: [], items: [] }),
      IconUrl: JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-laptop", c: "#0065FF" }),
    },
    Pages: [],
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
    Childs: [],
  };
}

function runValidator(file) {
  const result = spawnSync(process.execPath, [path.join(ROOT, "validate-yapk-package.js"), file], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  const text = result.stdout || result.stderr || "{}";
  return JSON.parse(text);
}

function hasCode(report, code) {
  return [...(report.errors || []), ...(report.warnings || [])].some((item) => item.code === code);
}

main();
