#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { encodeYapkResourceOfficial } from "./lib/yapk-decode-utils.mjs";
import { inspectServicePortal } from "./inspect-service-portal-yapk.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "service-portal-inspector-"));
try {
  const decoded = buildDecodedPackage();
  const wrapper = {
    PackageId: "portal-test-package",
    TenantID: "1000000000000000001",
    AppID: 41,
    ListID: "1000000000000000002",
    Title: "Portal Test",
    Description: "",
    Resource: encodeYapkResourceOfficial(decoded),
    Sign: "",
  };
  const file = path.join(tmp, "portal-test.yapk");
  fs.writeFileSync(file, JSON.stringify(wrapper), "utf8");

  const report = inspectServicePortal(wrapper, decoded);
  assert.equal(report.status, "pass");
  assert.equal(report.hasPortal, true);
  assert.equal(report.summary.portal.name, "SupplierPortal");
  assert.equal(report.summary.exposedLists.length, 2);
  assert.equal(report.summary.exposedDashboards.length, 1);
  assert.equal(report.summary.menus.length, 2);
  assert.equal(report.summary.portalUserList.type, 128);

  const invalid = structuredClone(decoded);
  invalid.PortalInfo.Resources[0].Content = JSON.stringify({
    lists: [{ id: "3000000000000000001", type: 32, title: "Supplier List", isHidden: false }],
    dashboards: [],
  });
  const invalidReport = inspectServicePortal(wrapper, invalid);
  assert.equal(invalidReport.status, "fail");
  assert.ok(invalidReport.findings.some((finding) => finding.code === "SERVICE_PORTAL_UNSUPPORTED_LIST_TYPE"));

  console.log(JSON.stringify({ status: "pass", tests: 2 }, null, 2));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

function buildDecodedPackage() {
  return {
    ListSet: {
      ListID: "1000000000000000002",
      Title: "Portal Test",
      Ext3: JSON.stringify({ externalPortal: { id: 2003 } }),
    },
    Pages: [
      {
        LayoutID: "2000000000000000001",
        Title: "Home page",
        Type: 103,
      },
    ],
    Childs: [
      {
        List: {
          ListID: 2003,
          Title: "__external_portal_user-test__",
          Type: 128,
          TableCode: "userinfo",
          Items: null,
        },
        Fields: [
          { FieldName: "Name_CN" },
          { FieldName: "SPAccount" },
          { FieldName: "Email" },
        ],
        Layouts: [],
      },
      {
        List: {
          ListID: "3000000000000000001",
          Title: "Supplier List",
          Type: 1,
        },
        Fields: [],
        Layouts: [{ LayoutID: "3000000000000000101", Title: "All Items", Type: 0 }],
      },
      {
        List: {
          ListID: "3000000000000000002",
          Title: "DUCS",
          Type: 16,
        },
        Fields: [],
        Layouts: [{ LayoutID: "3000000000000000201", Title: "All Files", Type: 0 }],
      },
    ],
    Forms: [],
    FormNewReports: [],
    FormReports: [],
    DataReports: [],
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
    CustomServices: [],
    PortalInfo: {
      ID: 2003,
      Type: 2,
      Name: "SupplierPortal",
      Description: null,
      IconUrl: "",
      LogoUrl: "",
      Settings: JSON.stringify({
        "navigator-menu": {
          position: "left",
          bgc: "var(--c--primary-dark-hover)",
          color: "var(--c--background)",
        },
        appearance: {
          bgc: "var(--c--primary-darker)",
          color: "var(--c--background)",
        },
      }),
      Flag: 0,
      Status: 1,
      DefaultGroupId: 0,
      Domain: "TestSrtal.yeeflow.app",
      Groups: [{ ID: "4000000000000000001", Code: "00000000-0000-4000-8000-000000000000", Name: "Standard users", Description: null }],
      Resources: [
        {
          Category: "portal",
          Type: "resource",
          Title: "portal source",
          Content: JSON.stringify({
            lists: [
              { id: "3000000000000000001", type: 1, title: "Supplier List", isHidden: false },
              { id: "3000000000000000002", type: 16, title: "DUCS", isHidden: false },
            ],
            dashboards: [{ id: "2000000000000000001", type: 103, title: "Home page", isHidden: false }],
          }),
          Ext: null,
          Version: 0,
        },
        {
          Category: "portal",
          Type: "menus",
          Title: "portal menus",
          Content: JSON.stringify({
            menus: [
              { id: "2000000000000000001", type: 103, title: "Home page", isHidden: false, icon: "fa-regular fa-house" },
              { id: "3000000000000000001", type: 1, title: "Supplier List", isHidden: false, icon: "fa-regular fa-grid-4" },
            ],
          }),
          Ext: null,
          Version: 0,
        },
      ],
      Perms: [
        {
          ID: "5000000000000000001",
          ItemType: 1,
          ItemID: "3000000000000000001",
          PermType: 3,
          PermObjID: "4000000000000000001",
          Perm: 1,
          Ext: JSON.stringify({ views: ["3000000000000000101"] }),
        },
        {
          ID: "5000000000000000002",
          ItemType: 2,
          ItemID: "2000000000000000001",
          PermType: 3,
          PermObjID: "999999",
          Perm: 1,
          Ext: "",
        },
      ],
    },
  };
}
