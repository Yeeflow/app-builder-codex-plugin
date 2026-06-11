#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function clone(value) {
  return structuredClone(value);
}

function id(offset) {
  return String(1700000000001234n + BigInt(offset));
}

function numId(offset) {
  return Number(1700000000001234n + BigInt(offset));
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
  return {
    Status: base.IsSystem ? 0 : 1,
    Category: 1,
    Rules: "{}",
    IsSort: false,
    IsUnique: false,
    ...base,
  };
}

function defaultView() {
  return JSON.stringify({
    layout: [
      { FieldID: id(10), FieldName: "Title", DisplayName: "Title", Type: "input", Order: 1, Mobile: 2, Show: true },
      { FieldID: id(11), FieldName: "Text1", DisplayName: "Health", Type: "select", Order: 2, Mobile: 2, Show: true },
    ],
    query: ["Title", "Text1", "ListDataID", "CreatedBy", "ModifiedBy", "Created", "Modified"].map((field) => ({ FieldName: field, field })),
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

function dashboardResource(listId) {
  return {
    title: "Dashboard",
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
        children: [
          {
            id: "Content",
            name: "Content",
            type: "container",
            children: [
              {
                type: "heading",
                label: "Text",
                name: "Dashboard Title",
                attrs: {
                  headc: { title: { value: "Renewal Dashboard" } },
                  heads: { ty: [null, "heading-md"], color: "#111111" },
                  style: { width: "auto" },
                },
              },
              {
                type: "data-list",
                name: "Accounts Data Table",
                attrs: {
                  data: { list: { AppID: 41, ListID: listId, Type: 1, Title: "Accounts", ListSetID: id(1) } },
                  listarr: [{ Field: "Title", FieldName: "Title" }],
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

function baseDecoded() {
  const rootId = numId(1);
  const listId = numId(2);
  const layoutId = id(30);
  return {
    ListSet: listInfo({ ListID: rootId, Title: "Runtime Hardening", Type: 1024, Flags: 1, TableCode: "flowcraft", IndexCode: "flowcraft" }),
    Pages: [{
      ListID: rootId,
      LayoutID: layoutId,
      Type: 103,
      Title: "Dashboard",
      LayoutView: null,
      Ext2: JSON.stringify({ src: true }),
      IsDefault: true,
      IsItemPerm: false,
      LayoutInResources: [{ ID: numId(30), RefId: numId(30), Resource: JSON.stringify(dashboardResource(listId)) }],
    }],
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
      List: listInfo({ ListID: listId, Title: "Accounts", Type: 1, Flags: 1, LayoutView: null, TableCode: "flowcraft", IndexCode: "flowcraft" }),
      Fields: [
        fieldInfo({ ListID: listId, FieldID: numId(10), FieldName: "Title", InternalName: "Title", DisplayName: "Title", FieldIndex: 0, IsSystem: true, Type: "input", FieldType: "Text" }),
        fieldInfo({ ListID: listId, FieldID: numId(11), FieldName: "Text1", InternalName: "Health", DisplayName: "Health", FieldIndex: 1, IsSystem: false, Type: "select", FieldType: "Text", Rules: choiceRules(["Green", "Amber", "Red"]) }),
      ],
      Layouts: [{ ListID: listId, LayoutID: id(20), Type: 0, Title: "Default", IsDefault: true, IsItemPerm: false, Ext1: JSON.stringify({ Url: "default" }), LayoutView: defaultView(), LayoutInResources: [] }],
      RemindRules: [],
      PublicForms: [],
      FlowMappings: [],
    }],
  };
}

function baseWrapper(decoded = baseDecoded()) {
  return {
    PackageId: "runtime-hardening-test",
    TenantID: id(101),
    AppID: 41,
    ListID: id(1),
    Title: "Runtime Hardening Test",
    Description: "",
    IconUrl: "",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
    Notes: "",
    Author: "regression",
    Date: "2026-06-01T00:00:00Z",
    Version: "0.0.0-test",
    Sign: Buffer.alloc(32, 1).toString("base64"),
  };
}

function appId30Decoded() {
  const decoded = baseDecoded();
  decoded.ListSet.TableCode = "setting_c";
  decoded.ListSet.IndexCode = "setting_c";
  decoded.Pages = [];
  decoded.Childs = [];
  return decoded;
}

function writePackage(dir, name, decoded, wrapperPatch = {}) {
  const wrapper = { ...baseWrapper(decoded), ...wrapperPatch };
  if (!wrapperPatch.Resource) {
    wrapper.Resource = zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64");
  }
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify(wrapper)}\n`);
  return file;
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectCode(name, result, code) {
  const output = `${result.stdout}\n${result.stderr}`;
  if (!output.includes(code)) {
    throw new Error(`${name} did not report ${code}.\n${output}`);
  }
}

function mutatePage(decoded, mutator) {
  const resource = decoded.Pages[0].LayoutInResources[0];
  const parsed = JSON.parse(resource.Resource);
  mutator(parsed, resource);
  resource.Resource = JSON.stringify(parsed);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-v3-hardening-"));
const cases = [];

try {
  const validFile = writePackage(tempDir, "valid", baseDecoded());
  const valid = run(["validate-yapk-package.js", validFile]);
  if (valid.status !== 0) throw new Error(`valid package failed:\n${valid.stdout}\n${valid.stderr}`);
  cases.push({ case: "valid schema-v3 runtime-safe package", status: "pass" });

  const validAppId30File = writePackage(tempDir, "valid-appid-30", appId30Decoded(), { AppID: 30 });
  const validAppId30 = run(["validate-yapk-package.js", validAppId30File]);
  if (validAppId30.status !== 0) throw new Error(`valid AppID 30 package failed:\n${validAppId30.stdout}\n${validAppId30.stderr}`);
  cases.push({ case: "valid AppID 30 setting_c package", status: "pass" });

  if (fs.existsSync(path.join(ROOT, "schemas/yapk-schema.json"))) {
    const standard = run(["scripts/validate-standard-package-schema.mjs", validFile]);
    if (standard.status !== 0) throw new Error(`schema-v3 standard validation failed:\n${standard.stdout}\n${standard.stderr}`);
    if (!standard.stdout.includes("yapk-schema.json")) throw new Error("schema-v3 standard validation did not report canonical yapk-schema.json.");
    cases.push({ case: "canonical YAPK schema validator accepts runtime-safe fixture", status: "pass" });
  }

  const mutations = [
    ["missing TableCode", "YAPK_TABLECODE_FLOWCRAFT_REQUIRED", (d) => { delete d.Childs[0].List.TableCode; }],
    ["missing IndexCode", "YAPK_INDEXCODE_FLOWCRAFT_REQUIRED", (d) => { delete d.Childs[0].List.IndexCode; }],
    ["AppID 41 without flowcraft", "YAPK_TABLECODE_FLOWCRAFT_REQUIRED", (d) => { d.ListSet.TableCode = "custom"; }],
    ["AppID 41 with setting_c", "YAPK_TABLECODE_FLOWCRAFT_REQUIRED", (d) => { d.ListSet.TableCode = "setting_c"; d.ListSet.IndexCode = "setting_c"; }],
    ["TableCode and IndexCode mismatch", "YAPK_TABLECODE_INDEXCODE_MISMATCH", (d) => { d.Childs[0].List.IndexCode = "setting_c"; }],
    ["PortalInfo empty object", "YAPK_PORTALINFO_EMPTY_OBJECT_INVALID", (d) => { d.PortalInfo = {}; }],
    ["PortalInfo array", "YAPK_PORTALINFO_ARRAY_INVALID", (d) => { d.PortalInfo = []; }],
    ["local fallback IDs", "LOCAL_FALLBACK_ID_FORBIDDEN", (d) => { d.Pages[0].LayoutID = "local-dashboard"; }],
    ["rounded IDs", "ROUNDED_ID_FORBIDDEN", (d) => { d.Childs[0].Fields[0].FieldID = "1700000000000000"; }],
    ["missing native Title", "NATIVE_TITLE_FIELD_MISSING", (d) => { d.Childs[0].Fields = d.Childs[0].Fields.filter((field) => field.FieldName !== "Title"); }],
    ["custom Text0 primary field", "TEXT0_PRIMARY_FIELD_INVALID_WHEN_TITLE_USED", (d) => { d.Childs[0].Fields[1].FieldName = "Text0"; d.Childs[0].Fields[1].FieldIndex = 0; }],
    ["FieldName FieldIndex mismatch", "YAPK_FIELD_NAME_SUFFIX_INDEX_MISMATCH", (d) => { d.Childs[0].Fields[1].FieldIndex = 7; }],
    ["schema-forbidden extra AppID", "YAPK_SCHEMA_FORBIDDEN_APPID", (d) => { d.Childs[0].List.AppID = 41; }],
    ["root LayoutView null", "YAPK_ROOT_LAYOUTVIEW_STRING_REQUIRED", (d) => { d.ListSet.LayoutView = null; }],
    ["root LayoutView object", "YAPK_ROOT_LAYOUTVIEW_STRING_REQUIRED", (d) => { d.ListSet.LayoutView = { sort: [] }; }],
    ["default view empty query", "DEFAULT_VIEW_QUERY_EMPTY", (d) => { d.Childs[0].Layouts[0].LayoutView = JSON.stringify({ layout: [{ FieldID: id(10), FieldName: "Title", DisplayName: "Title", Order: 1, Mobile: 2, Show: true }], query: [] }); }],
    ["default view missing Ext1 default URL", "DEFAULT_VIEW_EXT1_URL_MISSING", (d) => { d.Childs[0].Layouts[0].Ext1 = JSON.stringify({ Url: "custom" }); }],
    ["default view incomplete column object", "DEFAULT_VIEW_COLUMN_SHAPE_INCOMPLETE", (d) => { d.Childs[0].Layouts[0].LayoutView = JSON.stringify({ layout: [{ field: "Title" }], query: ["Title", "ListDataID", "CreatedBy", "ModifiedBy", "Created", "Modified"].map((field) => ({ field })) }); }],
    ["choice legacy Options path", "CHOICE_OPTION_RUNTIME_SHAPE_MISSING", (d) => { d.Childs[0].Fields[1].Rules = JSON.stringify({ Options: ["Green", "Amber", "Red"] }); }],
    ["choice blank runtime value", "CHOICE_OPTION_BLANK", (d) => { d.Childs[0].Fields[1].Rules = choiceRules(["Green", "", "Red"]); }],
    ["choice generic runtime value", "CHOICE_OPTION_GENERIC", (d) => { d.Childs[0].Fields[1].Rules = choiceRules(["Option 1", "Amber", "Red"]); }],
    ["choice sample value outside runtime options", "CHOICE_SAMPLE_VALUE_NOT_IN_OPTIONS", (d) => { d.Childs[0].List.Items = [{ Title: "Acme Finance", Text1: "Purple" }]; }],
    ["dashboard missing src marker", "DASHBOARD_EXT2_SRC_MARKER_MISSING", (d) => { d.Pages[0].Ext2 = JSON.stringify({}); }],
    ["LayoutInResources ID mismatch", "DASHBOARD_LAYOUT_RESOURCE_ID_MISMATCH", (d) => { d.Pages[0].LayoutInResources[0].RefId = id(999); }],
    ["dashboard direct Main resource", "DASHBOARD_RESOURCE_WRAPPER_MISSING", (d) => { const resource = d.Pages[0].LayoutInResources[0]; resource.Resource = JSON.stringify(JSON.parse(resource.Resource).children[0]); }],
    ["dashboard Data table missing Field", "DASHBOARD_DATA_TABLE_DISPLAY_FIELD_BINDING_MISSING", (d) => { mutatePage(d, (page) => { delete page.children[0].children[0].children[1].attrs.listarr[0].Field; }); }],
    ["generated type text Text control", "NATIVE_TEXT_CONTROL_TYPE_INVALID", (d) => { mutatePage(d, (page) => { page.children[0].children[0].children[0].type = "text"; }); }],
    ["summary control on approval form", "SUMMARY_CONTROL_UNSUPPORTED_SURFACE", (d) => { d.Forms.push({ Title: "Approval", DefResource: JSON.stringify({ children: [{ type: "summary", name: "Summary - Invalid" }] }) }); }],
    ["navigation group uses children", "NAVIGATION_GROUP_CHILDREN_UNSUPPORTED", (d) => { d.ListSet.LayoutView = JSON.stringify({ sort: [{ Title: "Requests", Type: "classes", children: [{ Title: "Dashboard", Type: 103, LayoutID: d.Pages[0].LayoutID }] }] }); }],
    ["navigation approval target missing form key", "NAVIGATION_APPROVAL_FORM_TARGET_INVALID", (d) => { d.ListSet.LayoutView = JSON.stringify({ sort: [{ Title: "Requests", Type: "classes", list: [{ Title: "New Approval", Type: 105, ListID: "MISSING_FORM_KEY" }] }] }); }],
  ];

  for (const [name, code, mutator] of mutations) {
    const decoded = clone(baseDecoded());
    mutator(decoded);
    const file = writePackage(tempDir, name.replace(/[^a-z0-9]+/gi, "-").toLowerCase(), decoded);
    expectCode(name, run(["validate-yapk-package.js", file]), code);
    cases.push({ case: name, expected: code, status: "pass" });
  }

  const appId30Bad = appId30Decoded();
  appId30Bad.ListSet.TableCode = "flowcraft";
  appId30Bad.ListSet.IndexCode = "flowcraft";
  const appId30BadFile = writePackage(tempDir, "appid-30-flowcraft", appId30Bad, { AppID: 30 });
  const appId30BadResult = run(["validate-yapk-package.js", appId30BadFile]);
  if (appId30BadResult.status === 0) throw new Error("AppID 30 with flowcraft should fail.");
  expectCode("AppID 30 with flowcraft", appId30BadResult, "YAPK_TABLECODE_SETTING_C_REQUIRED");
  cases.push({ case: "AppID 30 with flowcraft", expected: "YAPK_TABLECODE_SETTING_C_REQUIRED", status: "pass" });

  const placeholderSignFile = writePackage(tempDir, "placeholder-sign", baseDecoded(), { Sign: Buffer.alloc(32).toString("base64") });
  expectCode("placeholder Sign", run(["validate-yapk-package.js", placeholderSignFile]), "YAPK_SIGN_PLACEHOLDER");
  cases.push({ case: "placeholder Sign", expected: "YAPK_SIGN_PLACEHOLDER", status: "pass" });

  const dataListDecoded = clone(baseDecoded());
  dataListDecoded.Childs[0].Layouts[0].LayoutView = JSON.stringify({ layout: [{ FieldID: id(10), FieldName: "Title", DisplayName: "Title", Order: 1, Mobile: 2, Show: true }], query: [] });
  const dataListFile = writePackage(tempDir, "data-list-empty-query", dataListDecoded);
  expectCode("data-list default view empty query", run(["scripts/validate-data-list-system-schema.mjs", dataListFile, "--strict-generated-list", "--json"]), "DEFAULT_VIEW_QUERY_EMPTY");
  cases.push({ case: "data-list schema empty query", expected: "DEFAULT_VIEW_QUERY_EMPTY", status: "pass" });

  const dataListLegacyOptions = clone(baseDecoded());
  dataListLegacyOptions.Childs[0].Fields[1].Rules = JSON.stringify({ Options: ["Green", "Amber", "Red"] });
  const dataListLegacyOptionsFile = writePackage(tempDir, "data-list-legacy-options", dataListLegacyOptions);
  expectCode("data-list choice legacy Options path", run(["scripts/validate-data-list-system-schema.mjs", dataListLegacyOptionsFile, "--strict-generated-list", "--json"]), "CHOICE_OPTION_RUNTIME_SHAPE_MISSING");
  cases.push({ case: "data-list choice legacy Options path", expected: "CHOICE_OPTION_RUNTIME_SHAPE_MISSING", status: "pass" });

  const dataListInvalidSample = clone(baseDecoded());
  dataListInvalidSample.Childs[0].List.Items = [{ Title: "Acme Finance", Text1: "Purple" }];
  const dataListInvalidSampleFile = writePackage(tempDir, "data-list-invalid-choice-sample", dataListInvalidSample);
  expectCode("data-list choice sample value outside runtime options", run(["scripts/validate-data-list-system-schema.mjs", dataListInvalidSampleFile, "--strict-generated-list", "--json"]), "CHOICE_SAMPLE_VALUE_NOT_IN_OPTIONS");
  cases.push({ case: "data-list choice sample value outside runtime options", expected: "CHOICE_SAMPLE_VALUE_NOT_IN_OPTIONS", status: "pass" });

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
