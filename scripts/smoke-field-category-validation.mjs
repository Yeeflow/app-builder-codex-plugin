#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const GZIP_PREFIX = "[______gizp______]";
const repoRoot = path.resolve(import.meta.dirname, "..");

function makeField(category) {
  return {
    FieldID: 1001,
    ListID: 2001,
    FieldName: "VendorName1",
    InternalName: "VendorName",
    DisplayName: "Vendor Name",
    FieldType: "Text",
    FieldIndex: 1,
    Type: "input",
    Category: category,
  };
}

function makeLayout(id = 3001, listId = 2001) {
  return {
    LayoutID: id,
    ListID: listId,
    Type: 0,
    Title: `View ${id}`,
    LayoutView: "",
    AppID: 41,
    TenantID: 0,
    Created: "2026-05-29T00:00:00Z",
    Modified: "2026-05-29T00:00:00Z",
    CreatedBy: 0,
    ModifiedBy: 0,
    Ext1: "",
    Ext2: "",
    Ext3: "",
    IsDefault: true,
    IsItemPerm: false,
    LayoutInResources: [],
  };
}

function makeListExportInfo(category, overrides = {}) {
  const field = { ...makeField(category), ...(overrides.field || {}) };
  const defs = Object.prototype.hasOwnProperty.call(overrides, "defs") ? overrides.defs : [field];
  const layouts = Object.prototype.hasOwnProperty.call(overrides, "layouts") ? overrides.layouts : [];
  const child = {
    ListModel: {
      ListID: 2001,
      AppID: 41,
      Title: "Vendors",
      Type: 1,
      Flags: 1,
    },
    Defs: defs,
    Layouts: layouts,
  };
  return {
    Item: {
      ListModel: {
        ListID: 9001,
        AppID: 41,
        Title: "Synthetic Field Category Smoke App",
        Type: 1024,
        Flags: 1,
      },
      Defs: [],
      Layouts: [],
    },
    Childs: Object.prototype.hasOwnProperty.call(overrides, "childs") ? overrides.childs : [child],
  };
}

function makeAppPackageInfo(category) {
  return {
    ListSet: {
      ListID: "9001",
      AppID: "41",
      Title: "Synthetic Field Category Smoke App",
      Type: 103,
      Flags: 1,
    },
    Pages: [],
    Forms: [],
    FormReports: [],
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
    PortalInfo: {},
    Childs: [
      {
        List: {
          ListID: "2001",
          AppID: "41",
          Title: "Vendors",
          Type: 1,
          Flags: 1,
        },
        Fields: [makeField(category)],
        Layouts: [],
        RemindRules: [],
        PublicForms: [],
        FlowMappings: [],
      },
    ],
  };
}

function writeDirectYap(file, category, overrides = {}) {
  const resource = GZIP_PREFIX + zlib.gzipSync(Buffer.from(JSON.stringify(makeListExportInfo(category, overrides)), "utf8")).toString("base64");
  const wrapper = {
    Title: "Synthetic Field Category Smoke App",
    Description: "Temporary validator smoke package.",
    IconUrl: "",
    IsListSet: true,
    Resource: resource,
  };
  fs.writeFileSync(file, `${JSON.stringify(wrapper, null, 2)}\n`);
}

function writeYap(file, category, overrides = {}, dataMode = "string") {
  const info = makeListExportInfo(category, overrides);
  const result = {
    MainListType: 1024,
    AppID: 41,
    ReplaceIds: [],
    ReportIds: [],
    FormKeys: [],
    Data: dataMode === "object" ? info : JSON.stringify(info),
  };
  const resource = GZIP_PREFIX + zlib.gzipSync(Buffer.from(JSON.stringify(result), "utf8")).toString("base64");
  const wrapper = {
    Title: "Synthetic Field Category Smoke App",
    Description: "Temporary validator smoke package.",
    IconUrl: "",
    IsListSet: true,
    Resource: resource,
  };
  fs.writeFileSync(file, `${JSON.stringify(wrapper, null, 2)}\n`);
}

function unquoteIntegerProperties(jsonText) {
  return jsonText.replace(/"((?:AppID|ListID|FieldID|LayoutID|ID|RefId))":"(\d{16,})"/g, "\"$1\":$2");
}

function writeRawLargeIdYap(file) {
  const largeAppId = "9345000000000000001";
  const largeRootListId = "9345000000000000002";
  const largeListId = "9345000000000000003";
  const largeFieldId = "9345000000000000004";
  const largeLayoutId = "9345000000000000005";
  const info = makeListExportInfo(0, {
    field: { FieldID: largeFieldId, ListID: largeListId },
    layouts: [makeLayout(largeLayoutId, largeListId)],
  });
  info.Item.ListModel.AppID = largeAppId;
  info.Item.ListModel.ListID = largeRootListId;
  info.Childs[0].ListModel.AppID = largeAppId;
  info.Childs[0].ListModel.ListID = largeListId;
  const infoText = unquoteIntegerProperties(JSON.stringify(info));
  const resultText = unquoteIntegerProperties(JSON.stringify({
    MainListType: 1024,
    AppID: largeAppId,
    ReplaceIds: [],
    ReportIds: [],
    FormKeys: [],
    Data: infoText,
  }));
  const wrapper = {
    Title: "Synthetic Raw Large ID Smoke App",
    Description: "Temporary validator smoke package.",
    IconUrl: "",
    IsListSet: true,
    Resource: GZIP_PREFIX + zlib.gzipSync(Buffer.from(resultText, "utf8")).toString("base64"),
  };
  fs.writeFileSync(file, `${JSON.stringify(wrapper, null, 2)}\n`);
}

function writeYapk(file, category) {
  const resource = zlib.brotliCompressSync(Buffer.from(JSON.stringify(makeAppPackageInfo(category)), "utf8")).toString("base64");
  const wrapper = {
    PackageId: "00000000-0000-0000-0000-000000000001",
    TenantID: "1",
    AppID: "41",
    ListID: "9001",
    Title: "Synthetic Field Category Smoke App",
    Description: "Temporary validator smoke package.",
    IconUrl: "",
    Resource: resource,
    Notes: "Temporary validator smoke package.",
    Author: "Codex",
    Date: "2026-05-29T00:00:00Z",
    Version: "smoke",
    Sign: Buffer.alloc(32).toString("base64"),
  };
  fs.writeFileSync(file, `${JSON.stringify(wrapper, null, 2)}\n`);
}

function run(command, args) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 16 * 1024 * 1024,
  });
}

function assertIncludes(result, needle, label) {
  const output = `${result.stdout}\n${result.stderr}`;
  if (!output.includes(needle)) {
    throw new Error(`${label} did not include ${needle}. Output: ${output.slice(0, 1200)}`);
  }
}

function assertExcludes(result, needle, label) {
  const output = `${result.stdout}\n${result.stderr}`;
  if (output.includes(needle)) {
    throw new Error(`${label} unexpectedly included ${needle}.`);
  }
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-field-category-smoke-"));
try {
  const badYap = path.join(dir, "field-category-string.yap");
  const goodYap = path.join(dir, "field-category-int.yap");
  const directYap = path.join(dir, "direct-list-export-info.yap");
  const objectDataYap = path.join(dir, "list-export-result-data-object.yap");
  const defsNullYap = path.join(dir, "defs-null.yap");
  const layoutsNullYap = path.join(dir, "layouts-null.yap");
  const suffixMismatchYap = path.join(dir, "fieldname-suffix-mismatch.yap");
  const duplicateLayoutYap = path.join(dir, "duplicate-layout-id.yap");
  const duplicateListYap = path.join(dir, "duplicate-list-id.yap");
  const duplicateFieldYap = path.join(dir, "duplicate-field-id.yap");
  const rawLargeIdYap = path.join(dir, "raw-large-api-id.yap");
  const localIdSourceYap = path.join(dir, "local-id-source.yap");
  const generatedAppIdYap = path.join(dir, "generated-app-id.yap");
  const uniqueIdsYap = path.join(dir, "unique-ids.yap");
  const badYapk = path.join(dir, "field-category-string.yapk");
  const goodYapk = path.join(dir, "field-category-int.yapk");
  writeYap(badYap, "0");
  writeYap(goodYap, 0);
  writeDirectYap(directYap, 0);
  writeYap(objectDataYap, 0, {}, "object");
  writeYap(defsNullYap, 0, { defs: null });
  writeYap(layoutsNullYap, 0, { layouts: null });
  writeYap(suffixMismatchYap, 0, { field: { FieldName: "VendorName9", FieldIndex: 1 } });
  writeYap(duplicateLayoutYap, 0, { layouts: [makeLayout(3001), makeLayout(3001)] });
  writeYap(duplicateListYap, 0, {
    childs: [
      makeListExportInfo(0).Childs[0],
      { ...makeListExportInfo(0).Childs[0], ListModel: { ...makeListExportInfo(0).Childs[0].ListModel, Title: "Duplicate Vendors" } },
    ],
  });
  writeYap(duplicateFieldYap, 0, { defs: [makeField(0), { ...makeField(0), FieldName: "VendorCode2", FieldIndex: 2, InternalName: "VendorCode", DisplayName: "Vendor Code" }] });
  writeRawLargeIdYap(rawLargeIdYap);
  writeYap(localIdSourceYap, 0, {
    field: { FieldID: 760100000000001, ListID: 760100000000002 },
    childs: [{
      ...makeListExportInfo(0).Childs[0],
      ListModel: { ...makeListExportInfo(0).Childs[0].ListModel, ListID: 760100000000002 },
      Defs: [{ ...makeField(0), FieldID: 760100000000001, ListID: 760100000000002 }],
      Layouts: [makeLayout(760100000000003, 760100000000002)],
    }],
  });
  writeYap(generatedAppIdYap, 0, {
    childs: [{
      ...makeListExportInfo(0).Childs[0],
      ListModel: { ...makeListExportInfo(0).Childs[0].ListModel, AppID: 9345000000000000001 },
    }],
  });
  writeYap(uniqueIdsYap, 0, { field: { FieldID: 1002 }, layouts: [makeLayout(3002)] });
  writeYapk(badYapk, "0");
  writeYapk(goodYapk, 0);

  const checks = [
    {
      label: "validate-yap-package string Category",
      result: run("node", ["validate-yap-package.js", badYap, "--mode", "generator", "--stage", "final"]),
      expectCode: true,
    },
    {
      label: "validate-yap-package integer Category",
      result: run("node", ["validate-yap-package.js", goodYap, "--mode", "generator", "--stage", "final"]),
      expectCode: false,
    },
    {
      label: "standard schema direct ListExportInfo Resource",
      result: run("node", ["scripts/validate-standard-package-schema.mjs", directYap]),
      expectNeedle: "YAP_RESOURCE_NOT_LIST_EXPORT_RESULT",
    },
    {
      label: "standard inspector direct ListExportInfo Resource",
      result: run("node", ["scripts/inspect-yap-schema-standard.mjs", directYap]),
      expectNeedle: "YAP_RESOURCE_NOT_LIST_EXPORT_RESULT",
    },
    {
      label: "standard schema Data object",
      result: run("node", ["scripts/validate-standard-package-schema.mjs", objectDataYap]),
      rejectNeedle: "YAP_RESOURCE_NOT_LIST_EXPORT_RESULT",
    },
    {
      label: "standard schema Defs null",
      result: run("node", ["scripts/validate-standard-package-schema.mjs", defsNullYap]),
      expectNeedle: "type",
    },
    {
      label: "standard inspector Defs null",
      result: run("node", ["scripts/inspect-yap-schema-standard.mjs", defsNullYap]),
      expectNeedle: "LIST_EXPORT_ITEM_DEFS_NULL",
    },
    {
      label: "standard schema Layouts null",
      result: run("node", ["scripts/validate-standard-package-schema.mjs", layoutsNullYap]),
      expectNeedle: "type",
    },
    {
      label: "standard inspector Layouts null",
      result: run("node", ["scripts/inspect-yap-schema-standard.mjs", layoutsNullYap]),
      expectNeedle: "LIST_EXPORT_ITEM_LAYOUTS_NULL",
    },
    {
      label: "standard schema FieldName suffix mismatch",
      result: run("node", ["scripts/validate-standard-package-schema.mjs", suffixMismatchYap]),
      expectNeedle: "FIELD_NAME_SUFFIX_INDEX_MISMATCH",
    },
    {
      label: "standard inspector FieldName suffix mismatch",
      result: run("node", ["scripts/inspect-yap-schema-standard.mjs", suffixMismatchYap]),
      expectNeedle: "FIELD_NAME_SUFFIX_INDEX_MISMATCH",
    },
    {
      label: "standard schema duplicate LayoutID",
      result: run("node", ["scripts/validate-standard-package-schema.mjs", duplicateLayoutYap]),
      expectNeedle: "DUPLICATE_LAYOUT_ID",
    },
    {
      label: "standard inspector duplicate LayoutID",
      result: run("node", ["scripts/inspect-yap-schema-standard.mjs", duplicateLayoutYap]),
      expectNeedle: "DUPLICATE_LAYOUT_ID",
    },
    {
      label: "standard schema duplicate ListID",
      result: run("node", ["scripts/validate-standard-package-schema.mjs", duplicateListYap]),
      expectNeedle: "DUPLICATE_LIST_ID",
    },
    {
      label: "standard schema duplicate FieldID",
      result: run("node", ["scripts/validate-standard-package-schema.mjs", duplicateFieldYap]),
      expectNeedle: "DUPLICATE_FIELD_ID",
    },
    {
      label: "standard schema raw large API integer token",
      result: run("node", ["scripts/validate-standard-package-schema.mjs", rawLargeIdYap]),
      rejectNeedle: "UNSAFE_INTEGER_ID",
    },
    {
      label: "validate-yap-package raw large API integer token",
      result: run("node", ["validate-yap-package.js", rawLargeIdYap, "--mode", "generator", "--stage", "final"]),
      rejectNeedle: "INVALID_ID_TYPE",
    },
    {
      label: "validate-yap-package local ID source",
      result: run("node", ["validate-yap-package.js", localIdSourceYap, "--mode", "generator", "--stage", "final"]),
      expectNeedle: "ID_SOURCE_NOT_API",
    },
    {
      label: "validate-yap-package generated AppID",
      result: run("node", ["validate-yap-package.js", generatedAppIdYap, "--mode", "generator", "--stage", "final"]),
      expectNeedle: "LISTMODEL_APPID_NOT_FIXED_41",
    },
    {
      label: "standard schema unique IDs",
      result: run("node", ["scripts/validate-standard-package-schema.mjs", uniqueIdsYap]),
      rejectNeedle: "DUPLICATE_LAYOUT_ID",
    },
    {
      label: "validate-yap-package duplicate LayoutID",
      result: run("node", ["validate-yap-package.js", duplicateLayoutYap, "--mode", "generator", "--stage", "final"]),
      expectNeedle: "DUPLICATE_LAYOUT_ID",
    },
    {
      label: "inspect-yap-schema-standard string Category",
      result: run("node", ["scripts/inspect-yap-schema-standard.mjs", badYap]),
      expectCode: true,
    },
    {
      label: "inspect-yap-schema-standard integer Category",
      result: run("node", ["scripts/inspect-yap-schema-standard.mjs", goodYap]),
      expectCode: false,
    },
    {
      label: "validate-yapk-package string Category",
      result: run("node", ["validate-yapk-package.js", badYapk]),
      expectCode: true,
    },
    {
      label: "validate-yapk-package integer Category",
      result: run("node", ["validate-yapk-package.js", goodYapk]),
      expectCode: false,
    },
  ];

  for (const check of checks) {
    if (check.expectNeedle) assertIncludes(check.result, check.expectNeedle, check.label);
    else if (check.rejectNeedle) assertExcludes(check.result, check.rejectNeedle, check.label);
    else if (check.expectCode) assertIncludes(check.result, "FIELD_CATEGORY_NOT_INT", check.label);
    else assertExcludes(check.result, "FIELD_CATEGORY_NOT_INT", check.label);
  }

  console.log(JSON.stringify({
    status: "pass",
    checks: checks.map((check) => ({
      label: check.label,
      exitCode: check.result.status,
      expectation: check.expectNeedle || check.rejectNeedle || (check.expectCode ? "FIELD_CATEGORY_NOT_INT detected" : "FIELD_CATEGORY_NOT_INT not present"),
    })),
  }, null, 2));
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
