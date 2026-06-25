#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");

function writePackage(dir, name, iconUrl, patch = {}) {
  const file = path.join(dir, `${name}.yapk`);
  const wrapper = {
    Title: "Facility Maintenance Request Management",
    Description: "Facility maintenance work order intake, assignment, SLA, and closure app.",
    IconUrl: iconUrl,
    Resource: "placeholder-not-read-by-icon-validator",
    ...patch,
  };
  fs.writeFileSync(file, `${JSON.stringify(wrapper)}\n`);
  return file;
}

function writeDecodedPackage(dir, name, iconUrl, decodedPatch = {}) {
  const file = path.join(dir, `${name}.yapk`);
  const decoded = {
    ListSet: {
      ListID: "1908351910552752128",
      Title: "Facility Maintenance Request Management",
      IconUrl: iconUrl,
      ListModel: { IconUrl: iconUrl },
    },
    Pages: [],
    Childs: [],
    ...decodedPatch,
  };
  const wrapper = {
    Title: "Facility Maintenance Request Management",
    Description: "Facility maintenance work order intake, assignment, SLA, and closure app.",
    IconUrl: iconUrl,
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
  };
  fs.writeFileSync(file, `${JSON.stringify(wrapper)}\n`);
  return file;
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
}

function expectPass(label, file, extraArgs = []) {
  const result = run(["scripts/validate-application-icon.js", "--package", file, ...extraArgs]);
  assert.equal(result.status, 0, `${label} should pass.\n${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function expectCode(label, file, code, extraArgs = []) {
  const result = run(["scripts/validate-application-icon.js", "--package", file, ...extraArgs]);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0, `${label} should fail.`);
  assert.match(output, new RegExp(code), `${label} did not report ${code}.\n${output}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "application-icon-gates-"));

try {
  const validIcon = JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-screwdriver-wrench", c: "#0065FF" });
  const validFile = writePackage(tempDir, "valid-fontawesome", validIcon);
  const validReport = expectPass("valid FontAwesome JSON icon", validFile);
  assert.deepEqual(validReport.icon, { b: "#E6F0FF", i: "fa-solid fa-screwdriver-wrench", c: "#0065FF" });

  const decodedValidFile = writeDecodedPackage(tempDir, "valid-decoded-root-fontawesome", validIcon);
  const decodedValidReport = expectPass("valid decoded root FontAwesome icon surfaces", decodedValidFile);
  assert.equal(decodedValidReport.decodedRootIconSurfaces.length, 2);

  expectCode(
    "decoded root ListSet.IconUrl missing",
    writeDecodedPackage(tempDir, "decoded-root-icon-missing", validIcon, {
      ListSet: { ListID: "1908351910552752128", Title: "Facility Maintenance Request Management", IconUrl: "", ListModel: { IconUrl: validIcon } },
    }),
    "APPLICATION_ICONURL_REQUIRED",
  );
  expectCode(
    "decoded root ListModel.IconUrl mismatch",
    writeDecodedPackage(tempDir, "decoded-root-listmodel-icon-mismatch", validIcon, {
      ListSet: { ListID: "1908351910552752128", Title: "Facility Maintenance Request Management", IconUrl: validIcon, ListModel: { IconUrl: JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-laptop", c: "#0065FF" }) } },
    }),
    "APPLICATION_ICON_ROOT_SURFACE_MISMATCH",
  );

  expectCode(
    "image URL IconUrl",
    writePackage(tempDir, "image-url", "https://img.yeeflow.com/icons/facility.png"),
    "APPLICATION_ICON_IMAGE_URL_FORBIDDEN",
  );
  expectCode(
    "missing b",
    writePackage(tempDir, "missing-b", JSON.stringify({ i: "fa-solid fa-screwdriver-wrench", c: "#0065FF" })),
    "APPLICATION_ICON_B_MISSING",
  );
  expectCode(
    "missing i",
    writePackage(tempDir, "missing-i", JSON.stringify({ b: "#E6F0FF", c: "#0065FF" })),
    "APPLICATION_ICON_I_MISSING",
  );
  expectCode(
    "missing c",
    writePackage(tempDir, "missing-c", JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-screwdriver-wrench" })),
    "APPLICATION_ICON_C_MISSING",
  );
  expectCode(
    "emoji icon",
    writePackage(tempDir, "emoji", JSON.stringify({ b: "#E6F0FF", i: "🛠️", c: "#0065FF" })),
    "APPLICATION_ICON_NON_FONTAWESOME_FORBIDDEN",
  );
  expectCode(
    "svg icon",
    writePackage(tempDir, "svg", JSON.stringify({ b: "#E6F0FF", i: "<svg></svg>", c: "#0065FF" })),
    "APPLICATION_ICON_NON_FONTAWESOME_FORBIDDEN",
  );
  expectCode(
    "invented icon",
    writePackage(tempDir, "invented", JSON.stringify({ b: "#E6F0FF", i: "tool icon", c: "#0065FF" })),
    "APPLICATION_ICON_CLASS_INVALID",
  );

  const domainReport = expectPass("facility maintenance domain icon", validFile, ["--domain", "facility-maintenance"]);
  assert.equal(domainReport.domainRule.domain, "facility-maintenance");

  expectCode(
    "domain mismatch",
    writePackage(tempDir, "domain-mismatch", JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-laptop", c: "#0065FF" })),
    "APPLICATION_ICON_DOMAIN_MISMATCH",
    ["--domain", "facility-maintenance"],
  );
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log("application icon gates passed");
