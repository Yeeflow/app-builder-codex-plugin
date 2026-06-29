#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const VALIDATOR = "scripts/validate-yapk-live-install-readiness.mjs";
const ICON = JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-laptop", c: "#0065FF" });
const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";
const UUID_C = "33333333-3333-4333-8333-333333333333";

function id(offset) {
  return String(990000000000000000n + BigInt(offset));
}

function exportDefResource(resource) {
  const prefix = Buffer.from("::brotli::", "utf8");
  const compressed = zlib.brotliCompressSync(Buffer.from(JSON.stringify(resource), "utf8"));
  return Buffer.concat([prefix, compressed]).toString("base64");
}

function dashboardResource(uuid, listId = id(20)) {
  return {
    type: "dashboard-page",
    id: "Main",
    children: [
      {
        type: "container",
        id: uuid,
        attrs: { data: { ListID: listId } },
        children: [{ type: "heading", id: `${uuid}_title`, attrs: { headc: { title: { value: "Dashboard" } } } }],
      },
    ],
  };
}

function baseDecoded() {
  const rootId = id(1);
  const pageOneId = id(2);
  const pageTwoId = id(3);
  const listId = id(20);
  const formKey = id(30);
  const defId = id(31);
  return {
    ListSet: { ListID: rootId, Title: "Live Install Readiness", Type: 1024 },
    Pages: [
      {
        ListID: rootId,
        LayoutID: pageOneId,
        Type: 103,
        Title: "Dashboard One",
        LayoutView: null,
        LayoutInResources: [{ ID: pageOneId, RefId: pageOneId, Resource: JSON.stringify(dashboardResource(UUID_A, listId)) }],
      },
      {
        ListID: rootId,
        LayoutID: pageTwoId,
        Type: 103,
        Title: "Dashboard Two",
        LayoutView: null,
        LayoutInResources: [{ ID: pageTwoId, RefId: pageTwoId, Resource: JSON.stringify(dashboardResource(UUID_B, listId)) }],
      },
    ],
    Forms: [
      {
        Key: formKey,
        Name: "Approval",
        DefResourceID: defId,
        DeployedDefID: defId,
        DefResource: exportDefResource({ id: defId, key: formKey, defkey: formKey, ProcModelListID: defId, pageurls: [] }),
      },
    ],
    FormNewReports: [],
    DataReports: [],
    Childs: [
      {
        List: { ListID: listId, Title: "Records", Type: 1 },
        Fields: [{ FieldID: id(21), FieldName: "Title", DisplayName: "Title" }],
        Layouts: [{ LayoutID: id(22), Title: "Default View" }],
      },
    ],
  };
}

function wrapper(decoded, overrides = {}) {
  return {
    PackageId: id(100),
    TenantID: id(101),
    AppID: 41,
    ListID: decoded.ListSet.ListID,
    Title: "Live Install Readiness",
    Description: "",
    IconUrl: ICON,
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
    Notes: "",
    Author: "test",
    Date: "2026-06-25T00:00:00Z",
    Version: "1.0",
    Sign: "",
    ...overrides,
  };
}

function manifest(decoded) {
  const ids = new Set([
    decoded.ListSet.ListID,
    ...decoded.Pages.flatMap((page) => [page.LayoutID, ...page.LayoutInResources.flatMap((record) => [record.ID, record.RefId])]),
    decoded.Childs[0].List.ListID,
    decoded.Childs[0].Fields[0].FieldID,
    decoded.Childs[0].Layouts[0].LayoutID,
    decoded.Forms[0].Key,
    decoded.Forms[0].DefResourceID,
    decoded.Forms[0].DeployedDefID,
    id(100),
  ].map(String));
  return {
    sourceMarker: "api-generated",
    allocations: [...ids].map((value, index) => ({ path: `synthetic.${index}`, id: value, purpose: `synthetic ${index}`, source: "api-generated" })),
  };
}

function writePackage(dir, name, decoded, wrapperOverrides = {}) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify(wrapper(decoded, wrapperOverrides), null, 2)}\n`);
  const manifestFile = path.join(dir, `${name}-id-provenance-report.json`);
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest(decoded), null, 2)}\n`);
  return { file, manifestFile };
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectPass(label, args) {
  const result = run(args);
  if (result.status !== 0) throw new Error(`${label} should pass.\n${result.stdout}\n${result.stderr}`);
}

function expectCode(label, args, code) {
  const result = run(args);
  if (result.status === 0) throw new Error(`${label} should fail with ${code}.`);
  const output = `${result.stdout}\n${result.stderr}`;
  if (!output.includes(code)) throw new Error(`${label} did not report ${code}.\n${output}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-live-install-readiness-"));
const cases = [];

try {
  const valid = writePackage(tempDir, "valid", baseDecoded());
  expectPass("valid live-install readiness", [VALIDATOR, "--package", valid.file, "--id-provenance", valid.manifestFile, "--json"]);
  cases.push("valid generated-final package passes live install readiness");

  const tenantZeroDecoded = baseDecoded();
  const tenantZero = writePackage(tempDir, "tenant-zero", tenantZeroDecoded, { TenantID: "0" });
  expectCode("placeholder TenantID zero blocks signing readiness", [VALIDATOR, "--package", tenantZero.file, "--id-provenance", tenantZero.manifestFile, "--json"], "YAPK_WRAPPER_TENANTID_ZERO_BEFORE_SIGNING");
  cases.push("wrapper TenantID zero placeholder fails before signing readiness");

  const rootMismatchDecoded = baseDecoded();
  const rootMismatch = writePackage(tempDir, "root-mismatch", rootMismatchDecoded, { ListID: id(900) });
  expectCode("root mismatch", [VALIDATOR, "--package", rootMismatch.file, "--id-provenance", rootMismatch.manifestFile, "--json"], "YAPK_ROOT_LISTID_MISMATCH");
  cases.push("wrapper/root ListID mismatch fails");

  const pageOwnerMismatchDecoded = baseDecoded();
  pageOwnerMismatchDecoded.Pages[0].ListID = id(901);
  const pageOwnerMismatch = writePackage(tempDir, "page-owner-mismatch", pageOwnerMismatchDecoded);
  expectCode("dashboard owner mismatch", [VALIDATOR, "--package", pageOwnerMismatch.file, "--id-provenance", pageOwnerMismatch.manifestFile, "--json"], "YAPK_DASHBOARD_PAGE_ROOT_LISTID_MISMATCH");
  cases.push("dashboard page root owner mismatch fails");

  const duplicateUuidDecoded = baseDecoded();
  duplicateUuidDecoded.Pages[1].LayoutInResources[0].Resource = JSON.stringify(dashboardResource(UUID_A, id(20)));
  const duplicateUuid = writePackage(tempDir, "duplicate-uuid", duplicateUuidDecoded);
  expectCode("cross-page dashboard UUID duplicate", [VALIDATOR, "--package", duplicateUuid.file, "--id-provenance", duplicateUuid.manifestFile, "--json"], "DASHBOARD_CONTROL_UUID_DUPLICATE_ACROSS_PAGES");
  cases.push("cross-page dashboard template UUID duplicate fails");

  const embeddedIdDecoded = baseDecoded();
  embeddedIdDecoded.Pages[0].LayoutInResources[0].Resource = JSON.stringify(dashboardResource(UUID_C, id(999)));
  const embeddedId = writePackage(tempDir, "embedded-dashboard-id", embeddedIdDecoded);
  expectCode("embedded dashboard ID not in manifest", [VALIDATOR, "--package", embeddedId.file, "--id-provenance", embeddedId.manifestFile, "--json"], "YAPK_EMBEDDED_DASHBOARD_ID_NOT_IN_MANIFEST");
  cases.push("dashboard JSON large IDs must be manifest-backed");

  const defMismatchDecoded = baseDecoded();
  defMismatchDecoded.Forms[0].DefResource = exportDefResource({ id: id(31), key: id(932), defkey: id(932) });
  const defMismatch = writePackage(tempDir, "defresource-key-mismatch", defMismatchDecoded);
  expectCode("approval DefResource key mismatch", [VALIDATOR, "--package", defMismatch.file, "--id-provenance", defMismatch.manifestFile, "--json"], "APPROVAL_DEFRESOURCE_KEY_MISMATCH");
  cases.push("approval DefResource key mismatch fails");

  const placeholderReportDecoded = baseDecoded();
  placeholderReportDecoded.FormNewReports = [{ ID: id(40), Name: "Not planned", DefKey: id(30), Settings: "{}" }];
  const placeholderReport = writePackage(tempDir, "placeholder-report", placeholderReportDecoded);
  expectCode("planning placeholder resource blocks install readiness", [VALIDATOR, "--package", placeholderReport.file, "--id-provenance", placeholderReport.manifestFile, "--json"], "YAPK_PLACEHOLDER_RESOURCE_MATERIALIZED");
  cases.push("planning placeholder resource names fail");

  const placeholderNavDecoded = baseDecoded();
  placeholderNavDecoded.ListSet.LayoutView = JSON.stringify({
    sort: [{ Title: "Reports", Type: "classes", list: [{ Title: "Not planned", Type: 105, ListID: id(30) }] }],
  });
  const placeholderNav = writePackage(tempDir, "placeholder-nav", placeholderNavDecoded);
  expectCode("planning placeholder navigation item blocks install readiness", [VALIDATOR, "--package", placeholderNav.file, "--id-provenance", placeholderNav.manifestFile, "--json"], "YAPK_PLACEHOLDER_NAVIGATION_ITEM");
  cases.push("planning placeholder navigation entries fail");

  const duplicateNavDecoded = baseDecoded();
  duplicateNavDecoded.ListSet.LayoutView = JSON.stringify({
    sort: [
      { Title: "Requests", Type: "classes", list: [{ Title: "Approval", Type: 105, ListID: id(30) }] },
      { Title: "Reports", Type: "classes", list: [{ Title: "Approval", Type: 105, ListID: id(30) }] },
    ],
  });
  const duplicateNav = writePackage(tempDir, "duplicate-nav", duplicateNavDecoded);
  expectCode("duplicate package-local navigation target blocks install readiness", [VALIDATOR, "--package", duplicateNav.file, "--id-provenance", duplicateNav.manifestFile, "--json"], "YAPK_DUPLICATE_NAVIGATION_TARGET");
  cases.push("duplicate navigation targets fail");

  const apiAcceptedOnly = path.join(tempDir, "api-accepted-only.json");
  fs.writeFileSync(apiAcceptedOnly, JSON.stringify({ apiStatus: 0, packageId: id(100) }, null, 2));
  expectCode("API submitted is not final success", [VALIDATOR, "--package", valid.file, "--id-provenance", valid.manifestFile, "--version-evidence", apiAcceptedOnly, "--package-id", id(100), "--json"], "INSTALL_API_ACCEPTANCE_NOT_FINAL_SUCCESS");
  cases.push("install API status 0 is submitted only");

  const failedRow = path.join(tempDir, "version-failed.json");
  fs.writeFileSync(failedRow, JSON.stringify({ rows: [{ PackageId: id(100), Status: "Failed", Error: "Install failed" }] }, null, 2));
  expectCode("failed Version Management row blocks same family", [VALIDATOR, "--package", valid.file, "--id-provenance", valid.manifestFile, "--version-evidence", failedRow, "--package-id", id(100), "--json"], "INSTALL_VERSION_ROW_FAILED");
  cases.push("failed Version Management row blocks same PackageId family");

  const succeedRow = path.join(tempDir, "version-succeed.json");
  fs.writeFileSync(succeedRow, JSON.stringify({ rows: [{ PackageId: id(100), Status: "Succeed" }] }, null, 2));
  expectPass("Version Management Succeed row passes", [VALIDATOR, "--package", valid.file, "--id-provenance", valid.manifestFile, "--version-evidence", succeedRow, "--package-id", id(100), "--json"]);
  cases.push("exact PackageId Succeed row passes");

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
