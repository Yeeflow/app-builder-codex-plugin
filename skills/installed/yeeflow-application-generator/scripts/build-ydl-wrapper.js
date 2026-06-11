#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { spawnSync } = require("child_process");

const GZIP_PREFIX = "[______gizp______]";
const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;
const SECRET_KEY_RE = /(token|secret|password|credential|clientsecret|apikey|api_key|accesskey)/i;
const LARGE_NUMERIC_ID_RE = /^\d{16,}$/;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node build-ydl-wrapper.js <decoded-data-or-resource.json> <output.ydl> --title <title> [--description <description>] [--dependency-map <json>]",
    "",
    "Example:",
    "  node build-ydl-wrapper.js ./asset-inventory-def.test-generated-ids.json ./asset-inventory.test-generated-ids.ydl --title \"Asset Inventory\" --description \"Sandbox generated Asset Inventory data list\"",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const positional = [];
  const options = { title: null, description: "", dependencyMap: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--title") options.title = argv[++i];
    else if (arg === "--description") options.description = argv[++i] || "";
    else if (arg === "--dependency-map") options.dependencyMap = argv[++i];
    else if (arg.startsWith("--")) usage();
    else positional.push(arg);
  }
  if (positional.length !== 2 || !options.title) usage();
  return { inputData: positional[0], outputWrapper: positional[1], ...options };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!isObject(value)) return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) out[key] = SECRET_KEY_RE.test(key) ? "__REDACTED__" : redact(child);
  return out;
}

function issue(list, code, message, detail = null) {
  list.push(redact({ code, message, detail }));
}

function deepWalk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => deepWalk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => deepWalk(child, visitor, `${pointer}.${key}`));
}

function collectPlaceholders(value) {
  const found = [];
  deepWalk(value, (node, pointer) => {
    if (typeof node === "string" && PLACEHOLDER_RE.test(node)) found.push({ placeholder: node, path: pointer });
  });
  return found;
}

function collectReplaceIds(value, excludedIds = new Set()) {
  const ids = [];
  const seen = new Set();
  deepWalk(value, (node) => {
    if (typeof node !== "string" || !LARGE_NUMERIC_ID_RE.test(node) || seen.has(node) || excludedIds.has(node)) return;
    seen.add(node);
    ids.push(node);
  });
  return ids;
}

function collectExternalReferenceIds(dependencyMap) {
  const ids = new Set();
  if (!dependencyMap) return ids;

  const add = (value) => {
    if (typeof value === "string" && LARGE_NUMERIC_ID_RE.test(value)) ids.add(value);
    else if (typeof value === "number" && Number.isSafeInteger(value) && LARGE_NUMERIC_ID_RE.test(String(value))) ids.add(String(value));
  };

  const addResolvedTarget = (target) => {
    if (!isObject(target)) return;
    for (const key of ["appId", "AppID", "listSetId", "ListSetID", "listsetid", "listId", "ListID", "listid", "fieldId", "FieldID"]) {
      add(target[key]);
    }
    if (isObject(target.displayField)) addResolvedTarget(target.displayField);
    if (Array.isArray(target.sampleRecords)) {
      for (const record of target.sampleRecords) {
        if (!isObject(record)) continue;
        add(record.ListDataID);
        add(record.id);
      }
    }
  };

  addResolvedTarget(dependencyMap.resolvedDepartments);
  for (const dependency of Array.isArray(dependencyMap.dependencies) ? dependencyMap.dependencies : []) {
    if (!dependency || (dependency.status && dependency.status !== "resolved")) continue;
    addResolvedTarget(dependency.resolvedValue);
    addResolvedTarget(dependency.resolvedTarget);
  }
  return ids;
}

function readOptionalDependencyMap(filePath, report) {
  if (!filePath) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    issue(report.errors, "DEPENDENCY_MAP_PARSE_FAILED", "Dependency map could not be read or parsed.", { filePath, error: error.message });
    return null;
  }
}

function readJson(filePath, report) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    issue(report.errors, "INPUT_JSON_INVALID", "Input JSON could not be read or parsed.", { filePath, error: error.message });
    return null;
  }
}

function normalizeInput(input) {
  if (isObject(input) && isObject(input.Item)) {
    return {
      data: input,
      resource: null,
      inputKind: "data",
    };
  }
  if (isObject(input) && typeof input.Data === "string") {
    return {
      data: JSON.parse(input.Data),
      resource: input,
      inputKind: "resource",
    };
  }
  throw new Error("Input must be decoded Resource.Data JSON with Item, or Resource JSON with Data string.");
}

function listModelOf(data) {
  return data && data.Item && data.Item.ListModel ? data.Item.ListModel : {};
}

function runFinalValidation(inputPath, report, target = "preWrite", dependencyMap = null) {
  const validator = path.join(__dirname, "validate-ydl-list.js");
  const validationArgs = [validator, inputPath, "--mode", "generator", "--stage", "final"];
  if (dependencyMap) validationArgs.push("--dependency-map", dependencyMap);
  const result = spawnSync(process.execPath, validationArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  let validationReport = null;
  try {
    validationReport = JSON.parse(result.stdout || "{}");
  } catch (error) {
    issue(report.errors, "VALIDATION_REPORT_PARSE_FAILED", "validate-ydl-list.js output could not be parsed.", { target, stdout: result.stdout, stderr: result.stderr });
    return null;
  }
  if (result.status !== 0 || validationReport.status === "fail") {
    issue(report.errors, "FINAL_VALIDATION_FAILED", "validate-ydl-list.js generator/final validation failed.", {
      target,
      status: validationReport.status,
      errors: validationReport.errors,
      warnings: validationReport.warnings,
    });
  }
  return validationReport;
}

function validateBeforeWrite(data, inputPath, args, report) {
  const placeholders = collectPlaceholders(data);
  if (placeholders.length) {
    issue(report.errors, "PLACEHOLDERS_REMAIN", "Cannot build .ydl while unresolved placeholders remain.", { count: placeholders.length, placeholders: placeholders.slice(0, 50) });
  }
  if (!args.title) issue(report.errors, "TITLE_REQUIRED", "Wrapper title is required.");
  const model = listModelOf(data);
  if (!model.AppID) issue(report.errors, "APP_ID_MISSING", "ListModel.AppID is required.");
  if (!model.ListID) issue(report.errors, "LIST_ID_MISSING", "ListModel.ListID is required.");
  if (!data.Item) issue(report.errors, "ITEM_MISSING", "Decoded data must contain Item.");
  if (!Array.isArray(data.Item && data.Item.Defs)) issue(report.errors, "DEFS_MISSING", "Item.Defs must exist and be an array.");
  if (!Array.isArray(data.Item && data.Item.Layouts)) issue(report.errors, "LAYOUTS_MISSING", "Item.Layouts must exist and be an array.");
  if (!isObject(data.Item && data.Item.ListDatas)) issue(report.errors, "LISTDATAS_MISSING", "Item.ListDatas must exist and be an object.");
  if (report.errors.length) return null;
  return runFinalValidation(inputPath, report, "preWrite", args.dependencyMap);
}

function buildResource(data, existingResource, dependencyMap = null) {
  const model = listModelOf(data);
  const externalReferenceIds = collectExternalReferenceIds(dependencyMap);
  const replaceIds = collectReplaceIds(data, externalReferenceIds);
  const resource = existingResource
    ? { ...existingResource }
    : {
        MainListType: model.ListType !== undefined ? model.ListType : 1,
        AppID: model.AppID,
        ReplaceIds: replaceIds,
        ReportIds: [],
        FormKeys: Array.isArray(data.Forms) ? data.Forms.map((form) => form.FlowKey || form.Key || form.key).filter(Boolean) : [],
        Data: "",
        SimplePortal: null,
      };

  resource.MainListType = resource.MainListType !== undefined ? resource.MainListType : (model.ListType !== undefined ? model.ListType : 1);
  resource.AppID = resource.AppID !== undefined ? resource.AppID : model.AppID;
  resource.ReplaceIds = Array.isArray(resource.ReplaceIds) && resource.ReplaceIds.length
    ? resource.ReplaceIds.map(String).filter((id) => !externalReferenceIds.has(id))
    : replaceIds;
  resource.ReportIds = Array.isArray(resource.ReportIds) ? resource.ReportIds : [];
  resource.FormKeys = Array.isArray(resource.FormKeys) ? resource.FormKeys : [];
  resource.SimplePortal = resource.SimplePortal === undefined ? null : resource.SimplePortal;
  resource.Data = JSON.stringify(data);
  return resource;
}

function decodeWrapper(wrapperPath, report) {
  const round = report.roundTrip;
  let wrapper;
  try {
    wrapper = JSON.parse(fs.readFileSync(wrapperPath, "utf8"));
    round.wrapperJsonValid = true;
  } catch (error) {
    issue(report.errors, "ROUNDTRIP_WRAPPER_JSON_INVALID", "Generated .ydl wrapper JSON is invalid.", { error: error.message });
    return null;
  }
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    issue(report.errors, "ROUNDTRIP_RESOURCE_PREFIX_INVALID", "Generated Resource prefix is missing or invalid.");
    return null;
  }
  round.resourcePrefixValid = true;
  let compressed;
  try {
    compressed = Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64");
    round.resourceBase64Valid = true;
  } catch (error) {
    issue(report.errors, "ROUNDTRIP_RESOURCE_BASE64_INVALID", "Resource base64 payload is invalid.", { error: error.message });
    return null;
  }
  let resourceText;
  try {
    resourceText = zlib.gunzipSync(compressed).toString("utf8");
    round.resourceGunzipValid = true;
  } catch (error) {
    issue(report.errors, "ROUNDTRIP_RESOURCE_GUNZIP_INVALID", "Resource gzip payload is invalid.", { error: error.message });
    return null;
  }
  let resource;
  try {
    resource = JSON.parse(resourceText);
    round.resourceJsonValid = true;
  } catch (error) {
    issue(report.errors, "ROUNDTRIP_RESOURCE_JSON_INVALID", "Decoded Resource JSON is invalid.", { error: error.message });
    return null;
  }
  let data;
  try {
    data = JSON.parse(resource.Data);
    round.resourceDataJsonValid = true;
  } catch (error) {
    issue(report.errors, "ROUNDTRIP_RESOURCE_DATA_JSON_INVALID", "Resource.Data JSON string is invalid.", { error: error.message });
    return null;
  }
  return { wrapper, resource, data };
}

function roundTripValidate(sourceData, outputPath, report, dependencyMap = null) {
  const decoded = decodeWrapper(outputPath, report);
  if (!decoded) return;
  report.roundTrip.decodedEqualsSource = JSON.stringify(decoded.data) === JSON.stringify(sourceData);
  if (!report.roundTrip.decodedEqualsSource) issue(report.errors, "ROUNDTRIP_DECODED_DATA_MISMATCH", "Decoded Resource.Data does not equal source decoded data package.");
  const placeholders = collectPlaceholders(decoded);
  report.roundTrip.placeholdersRemaining = placeholders.length;
  if (placeholders.length) issue(report.errors, "ROUNDTRIP_PLACEHOLDERS_REMAIN", "Generated wrapper still contains unresolved placeholders.", { count: placeholders.length, placeholders: placeholders.slice(0, 50) });
  const validationReport = runFinalValidation(outputPath, report, "roundTrip", dependencyMap);
  report.roundTrip.finalValidationPassed = Boolean(validationReport && validationReport.status !== "fail");
}

function main() {
  const args = parseArgs(process.argv);
  const report = {
    status: "fail",
    inputData: path.resolve(args.inputData),
    outputWrapper: path.resolve(args.outputWrapper),
    title: args.title,
    dependencyMap: args.dependencyMap ? path.resolve(args.dependencyMap) : null,
    errors: [],
    warnings: [],
    roundTrip: {
      wrapperJsonValid: false,
      resourcePrefixValid: false,
      resourceBase64Valid: false,
      resourceGunzipValid: false,
      resourceJsonValid: false,
      resourceDataJsonValid: false,
      decodedEqualsSource: false,
      placeholdersRemaining: 0,
      finalValidationPassed: false,
    },
  };

  const inputAbs = path.resolve(args.inputData);
  const outputAbs = path.resolve(args.outputWrapper);
  if (inputAbs === outputAbs) {
    issue(report.errors, "UNSAFE_OUTPUT_PATH", "Output .ydl path must differ from input JSON path.");
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const input = readJson(inputAbs, report);
  if (report.errors.length) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  const dependencyMap = readOptionalDependencyMap(args.dependencyMap, report);
  if (report.errors.length) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  let normalized;
  try {
    normalized = normalizeInput(input);
  } catch (error) {
    issue(report.errors, "INPUT_SHAPE_INVALID", error.message);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  validateBeforeWrite(normalized.data, inputAbs, args, report);
  if (report.errors.length) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const resource = buildResource(normalized.data, normalized.resource, dependencyMap);
  const resourceJson = JSON.stringify(resource);
  const compressed = zlib.gzipSync(Buffer.from(resourceJson, "utf8"));
  const wrapper = {
    Title: args.title,
    Description: args.description || "",
    IconUrl: null,
    IsListSet: false,
    Resource: `${GZIP_PREFIX}${compressed.toString("base64")}`,
  };

  fs.mkdirSync(path.dirname(outputAbs), { recursive: true });
  fs.writeFileSync(outputAbs, `${JSON.stringify(wrapper, null, 2)}\n`, "utf8");

  roundTripValidate(normalized.data, outputAbs, report, args.dependencyMap);
  if (report.errors.length) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  report.status = report.warnings.length ? "pass_with_warnings" : "pass";
  console.log(JSON.stringify(report, null, 2));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({
    status: "fail",
    errors: [{ code: "BUILDER_RUNTIME_ERROR", message: error.message }],
  }, null, 2));
  process.exit(1);
}
