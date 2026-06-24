#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runYapkFirstGenerationPreflight } from "./yapk-first-generation-preflight.mjs";
import { collectNumericContentIds } from "./validate-yapk-id-provenance.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ACCOUNT_HEALTH_ICON = JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-chart-line", c: "#0065FF" });

function id(offset) {
  return String(1700000000012345n + BigInt(offset));
}

function defaultView() {
  return JSON.stringify({
    layout: [
      { FieldID: id(10), FieldName: "Title", DisplayName: "Account", Type: "input", Order: 1, Mobile: 2, Show: true },
      { FieldID: id(11), FieldName: "Text1", DisplayName: "Health", Type: "select", Order: 2, Mobile: 2, Show: true },
      { FieldID: id(14), FieldName: "Decimal4", DisplayName: "Renewal Risk", Type: "percent", Order: 3, Mobile: 2, Show: true },
    ],
    query: ["Title", "Text1", "Decimal4", "ListDataID", "CreatedBy", "ModifiedBy", "Created", "Modified"].map((field) => ({ FieldName: field, field })),
  });
}

function choiceRules(values) {
  return JSON.stringify({
    choices: values.map((value, index) => ({
      key: String(index + 1),
      value,
      color: ["#22c55e", "#f59e0b", "#ef4444", "#2563eb"][index % 4],
    })),
    color_choices: values.map((value, index) => ({
      key: String(index + 1),
      value,
      color: ["#22c55e", "#f59e0b", "#ef4444", "#2563eb"][index % 4],
    })),
  });
}

function rootLayoutView(listId, rootId) {
  return JSON.stringify({
    sortVer: 1,
    sort: [
      {
        AppID: 41,
        Title: "Accounts",
        ListID: listId,
        ListSetID: rootId,
        Type: 1,
      },
    ],
  });
}

function legacyDashboardRootLayoutView(dashboardLayoutId, rootId) {
  return JSON.stringify({
    sortVer: 1,
    sort: [
      {
        AppID: 41,
        ListID: dashboardLayoutId,
        ListSetID: rootId,
        LayoutID: dashboardLayoutId,
        Type: 103,
        Title: "Account Health",
      },
    ],
  });
}

function listInfo(base) {
  return {
    Description: "",
    Status: 1,
    IsItemPerm: false,
    IsVerRecord: false,
    HasComment: false,
    IconUrl: "",
    ...base,
  };
}

function fieldInfo(base) {
  const isNativeTitle = base.FieldName === "Title" || base.InternalName === "Title";
  return {
    Status: base.IsSystem ? 0 : 1,
    Category: 1,
    Rules: "{}",
    IsSort: false,
    IsUnique: false,
    IsIndex: base.IsIndex ?? isNativeTitle,
    ...base,
  };
}

function portalInfo() {
  return {
    ID: 3001,
    Type: 1,
    Name: "Account Health Portal",
    Description: "",
    IconUrl: "",
    LogoUrl: "",
    Settings: "{}",
    Flag: 0,
    Status: 1,
    DefaultGroupId: 0,
    Domain: "",
    Groups: [],
    Resources: [],
    Perms: [],
  };
}

function textControl(text) {
  return {
    type: "heading",
    label: "Text",
    attrs: {
      headc: { title: { value: text } },
      heads: { ty: [null, "heading-md"], color: "#111111" },
      style: { width: "auto" },
    },
  };
}

function containerStyle() {
  return {
    direction: [null, "column"],
    gap: [null, 12],
    widthtype: [null, "2"],
    align_items: [null, "stretch"],
    justify_content: [null, "flex-start"],
  };
}

function dashboardPage(listId, rootId) {
  return {
    title: "Account Health",
    ver: "1.0.0",
    attrs: { container: { padding: { top: 0, right: 0, bottom: 0, left: 0 } } },
    filterVars: [],
    tempVars: [],
    exts: [],
    actions: [],
    children: [
      {
        id: "Main",
        name: "Main",
        type: "container",
        attrs: { style: containerStyle() },
        children: [
          {
            id: "Content",
            name: "Content",
            type: "container",
            attrs: { style: containerStyle() },
            children: [
              textControl("Account Health Overview"),
              {
                type: "data-list",
                name: "Accounts Data Table",
                attrs: {
                  data: { list: { AppID: 41, ListID: listId, Type: 1, Title: "Accounts", ListSetID: rootId } },
                  listarr: [
                    { Field: "Title", FieldName: "Account" },
                    { Field: "Text1", FieldName: "Health" },
                    { Field: "Decimal4", FieldName: "Renewal Risk" },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

function decodedAccountHealth() {
  const rootId = id(1);
  const listId = id(2);
  const layoutId = id(40);
  return {
    ListSet: listInfo({
      ListID: rootId,
      Title: "Account Health Smoke",
      Description: "Small first-generation Account Health smoke fixture.",
      Type: 1024,
      Flags: 1,
      TableCode: "flowcraft",
      IndexCode: "flowcraft",
      LayoutView: rootLayoutView(listId, rootId),
      Items: {},
    }),
    Pages: [],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
    Childs: [{
      List: listInfo({
        ListID: listId,
        Title: "Accounts",
        Description: "Account health demo list.",
        Type: 1,
        Flags: 1,
        TableCode: "flowcraft",
        IndexCode: "flowcraft",
        LayoutView: null,
      }),
      Fields: [
        fieldInfo({ ListID: listId, FieldID: id(10), FieldName: "Title", InternalName: "Title", DisplayName: "Account", FieldIndex: 0, IsSystem: true, Type: "input", FieldType: "Text" }),
        fieldInfo({ ListID: listId, FieldID: id(11), FieldName: "Text1", InternalName: "Health", DisplayName: "Health", FieldIndex: 1, IsSystem: false, Type: "select", FieldType: "Text", Rules: choiceRules(["Green", "Amber", "Red"]) }),
        fieldInfo({ ListID: listId, FieldID: id(12), FieldName: "Text2", InternalName: "Owner", DisplayName: "Owner", FieldIndex: 2, IsSystem: false, Type: "input", FieldType: "Text" }),
        fieldInfo({ ListID: listId, FieldID: id(14), FieldName: "Decimal4", InternalName: "RenewalRisk", DisplayName: "Renewal Risk", FieldIndex: 4, IsSystem: false, Type: "percent", FieldType: "Decimal" }),
      ],
      Layouts: [{ ListID: listId, LayoutID: layoutId, Type: 0, Title: "All Accounts", IsDefault: true, IsItemPerm: false, Ext1: JSON.stringify({ Url: "default" }), LayoutView: defaultView(), LayoutInResources: [] }],
      RemindRules: [],
      PublicForms: [],
      FlowMappings: [],
    }],
  };
}

function wrapper(decoded = decodedAccountHealth()) {
  return {
    PackageId: id(900),
    TenantID: id(901),
    AppID: 41,
    ListID: decoded.ListSet.ListID,
    Title: "Account Health Smoke",
    Description: "First-generation Account Health YAPK smoke fixture.",
    IconUrl: ACCOUNT_HEALTH_ICON,
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
    Notes: "Synthetic regression fixture; not a generated app artifact.",
    Author: "regression",
    Date: "2026-06-01T00:00:00Z",
    Version: "0.6.6-test",
    Sign: Buffer.alloc(32, 1).toString("base64"),
  };
}

function writeYapk(dir, name, decoded) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify(wrapper(decoded))}\n`);
  return file;
}

function writeIdProvenance(packageFile, decoded) {
  const packageWrapper = wrapper(decoded);
  const idsByValue = new Map();
  for (const item of collectNumericContentIds({ wrapper: packageWrapper, decoded })) {
    if (!idsByValue.has(item.id)) idsByValue.set(item.id, item);
  }
  const packageIds = [...idsByValue.values()];
  const allocations = packageIds.map((item) => ({
    path: item.path,
    id: item.id,
    purpose: "synthetic Account Health smoke fixture ID",
    source: "api-generated",
  }));
  const manifest = {
    sourceMarker: "api-generated",
    totalRequestedIds: allocations.length,
    totalReceivedIds: allocations.length,
    allocationCount: allocations.length,
    unusedCount: 0,
    duplicateCheck: { passed: true, duplicateIds: [] },
    generatorProvenance: { generator: "synthetic-account-health-smoke", localIdFallbackAllowed: false },
    pathToPurpose: Object.fromEntries(allocations.map((allocation) => [allocation.path, { id: allocation.id, purpose: allocation.purpose, source: allocation.source }])),
    allocations,
    nonApiIds: [],
  };
  fs.writeFileSync(packageFile.replace(/(?:\.signed)?\.yapk$/i, "-id-provenance-report.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectFailure(file, code) {
  const result = run(["scripts/yapk-first-generation-preflight.mjs", "--package", file, "--json"]);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0, `${code} mutation unexpectedly passed`);
  assert.match(output, new RegExp(code), `${code} mutation did not report expected code:\n${output}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "account-health-first-gen-"));

try {
  const decoded = decodedAccountHealth();
  const file = writeYapk(tempDir, "account-health", decoded);
  writeIdProvenance(file, decoded);
  assert.equal(fs.existsSync(path.join(ROOT, "schemas/yapk-schema.json")), true);
  assert.equal(fs.existsSync(path.join(ROOT, "schemas/yap-schema.json")), true);
  assert.equal(decoded.ListSet.LayoutView, rootLayoutView(decoded.Childs[0].List.ListID, decoded.ListSet.ListID));
  assert.equal(decoded.AppID, undefined);
  assert.equal(decoded.ListSet.AppID, undefined);
  assert.equal(decoded.Childs[0].List.AppID, undefined);
  assert.equal(decoded.Childs[0].Fields.some((field) => field.FieldName === "Text0"), false);
  assert.equal(decoded.Childs[0].Fields.find((field) => field.FieldName === "Title")?.IsSystem, true);
  assert.equal(decoded.Childs[0].Fields.find((field) => field.FieldName === "Title")?.IsIndex, true);
  assert.equal(Object.hasOwn(decoded.Childs[0].List, "Items"), false);
  assert.deepEqual(decoded.Pages, []);
  assert.equal(fs.readdirSync(tempDir).some((name) => name.endsWith(".yap")), false);

  const preflight = runYapkFirstGenerationPreflight(file);
  assert.equal(preflight.ok, true, JSON.stringify(preflight, null, 2));

  const standard = run(["scripts/validate-standard-package-schema.mjs", file]);
  assert.equal(standard.status, 0, `${standard.stdout}\n${standard.stderr}`);
  assert.match(standard.stdout, /schemas\/yapk-schema\.json|yapk-schema\.json/);

  const extraAppId = decodedAccountHealth();
  extraAppId.Childs[0].List.AppID = 41;
  expectFailure(writeYapk(tempDir, "extra-appid", extraAppId), "YAPK_SCHEMA_FORBIDDEN_APPID");

  const rootLayoutNull = decodedAccountHealth();
  rootLayoutNull.ListSet.LayoutView = null;
  expectFailure(writeYapk(tempDir, "root-layout-null", rootLayoutNull), "YAPK_ROOT_LAYOUTVIEW_STRING_REQUIRED");

  const rootLayoutObject = decodedAccountHealth();
  rootLayoutObject.ListSet.LayoutView = { sort: [] };
  expectFailure(writeYapk(tempDir, "root-layout-object", rootLayoutObject), "YAPK_ROOT_LAYOUTVIEW_STRING_REQUIRED");

  const decimalMismatch = decodedAccountHealth();
  decimalMismatch.Childs[0].Fields.find((field) => field.FieldName === "Decimal4").FieldIndex = 7;
  expectFailure(writeYapk(tempDir, "decimal-mismatch", decimalMismatch), "YAPK_FIELD_NAME_SUFFIX_INDEX_MISMATCH");

  const embeddedSampleRows = decodedAccountHealth();
  embeddedSampleRows.Childs[0].List.Items = {
    [id(200)]: { Title: "Acme Finance", Text1: "Green", Decimal4: "12.5" },
  };
  expectFailure(writeYapk(tempDir, "embedded-sample-rows", embeddedSampleRows), "YAPK_EMBEDDED_LIST_ITEMS_FORBIDDEN");

  const nativeTitleMissingIndex = decodedAccountHealth();
  delete nativeTitleMissingIndex.Childs[0].Fields.find((field) => field.FieldName === "Title").IsIndex;
  expectFailure(writeYapk(tempDir, "native-title-missing-index", nativeTitleMissingIndex), "NATIVE_TITLE_ISINDEX_MISSING");

  const legacySimplifiedDashboard = decodedAccountHealth();
  const legacyDashboardLayoutId = id(30);
  legacySimplifiedDashboard.ListSet.LayoutView = legacyDashboardRootLayoutView(legacyDashboardLayoutId, legacySimplifiedDashboard.ListSet.ListID);
  legacySimplifiedDashboard.Pages = [{
    ListID: legacySimplifiedDashboard.ListSet.ListID,
    LayoutID: legacyDashboardLayoutId,
    Type: 103,
    Title: "Account Health",
    LayoutView: null,
    Ext2: JSON.stringify({ src: true }),
    IsDefault: true,
    IsItemPerm: false,
    LayoutInResources: [{
      ID: legacyDashboardLayoutId,
      RefId: legacyDashboardLayoutId,
      Resource: JSON.stringify(dashboardPage(legacySimplifiedDashboard.Childs[0].List.ListID, legacySimplifiedDashboard.ListSet.ListID)),
    }],
  }];
  expectFailure(writeYapk(tempDir, "legacy-simplified-dashboard", legacySimplifiedDashboard), "DASH_GOLDEN_RESOURCE_HEADER_BAND_MISSING|DASH_LAYOUT_RESOURCE_TEMPLATE_MARKER_MISSING");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log("account-health first-generation smoke tests passed");
