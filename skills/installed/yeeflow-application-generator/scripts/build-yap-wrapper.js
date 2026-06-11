#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { spawnSync } = require("child_process");

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;
const SECRET_KEY_RE = /(token|secret|password|credential|clientsecret|apikey|api_key|accesskey|authorization|bearer)/i;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node build-yap-wrapper.js <decoded-data-or-resource.json> <output.yap> --title <title> [--description <description>] [--icon-url <icon-url-or-json>] [--validation-mode <generator|compatibility>]",
    "",
    "Examples:",
    "  node build-yap-wrapper.js ./some-decoded-yap-data.json ./rebuilt-test.yap --title \"Test App\" --description \"Round-trip rebuilt application package\"",
    "  node build-yap-wrapper.js ./real-resource.json ./rebuilt-test.yap --title \"Test App\" --validation-mode compatibility",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const positional = [];
  const options = { title: null, description: "", iconUrl: undefined, validationMode: "generator" };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--title") options.title = argv[++i];
    else if (arg === "--description") options.description = argv[++i] || "";
    else if (arg === "--icon-url") options.iconUrl = argv[++i];
    else if (arg === "--validation-mode") options.validationMode = argv[++i];
    else if (arg.startsWith("--")) usage();
    else positional.push(arg);
  }
  if (positional.length !== 2 || !options.title || !["generator", "compatibility"].includes(options.validationMode)) usage();
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

function quoteLargeIntegers(jsonText, largeNumbers) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;
  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else {
          out += token;
        }
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJsonPreservingLargeInts(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
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
    if (typeof node !== "string" || !LARGE_INTEGER_RE.test(node) || seen.has(node) || excludedIds.has(node)) return;
    seen.add(node);
    ids.push(node);
  });
  return ids;
}

function metadataIdsToPreserve(data) {
  const model = rootListModel(data);
  return new Set(["TenantID", "CreatedBy", "ModifiedBy"].map((key) => model[key]).filter((value) => value !== undefined && value !== null && value !== "").map(String));
}

function readJson(filePath, report) {
  const largeNumbers = new Set();
  try {
    return parseJsonPreservingLargeInts(fs.readFileSync(filePath, "utf8"), largeNumbers);
  } catch (error) {
    issue(report.errors, "INPUT_JSON_INVALID", "Input JSON could not be read or parsed.", { filePath, error: error.message });
    return null;
  } finally {
    if (largeNumbers.size) {
      issue(report.warnings, "LARGE_NUMERIC_IDS", "Large numeric IDs were preserved as strings while reading input.", { count: largeNumbers.size });
    }
  }
}

function normalizeInput(input) {
  if (isObject(input) && isObject(input.Item)) {
    return { data: input, resource: null, inputKind: "data" };
  }
  if (isObject(input) && typeof input.Data === "string") {
    const largeNumbers = new Set();
    return {
      data: parseJsonPreservingLargeInts(input.Data, largeNumbers),
      resource: input,
      inputKind: "resource",
    };
  }
  throw new Error("Input must be decoded Resource.Data JSON with Item, or Resource JSON with Data string.");
}

function rootListModel(data) {
  return data && data.Item && data.Item.ListModel ? data.Item.ListModel : {};
}

function validateBeforeWrite(normalized, validationInputPath, args, report) {
  const { data, resource } = normalized;
  const placeholders = collectPlaceholders({ resource, data });
  if (placeholders.length) {
    issue(report.errors, "PLACEHOLDERS_REMAIN", "Cannot build .yap while unresolved placeholders remain.", { count: placeholders.length, placeholders: placeholders.slice(0, 50) });
  }
  if (!args.title) issue(report.errors, "TITLE_REQUIRED", "Wrapper title is required.");
  if (!isObject(data.Item)) issue(report.errors, "DATA_ITEM_MISSING", "Decoded app data must contain Data.Item.");
  if (!Array.isArray(data.Childs)) issue(report.errors, "DATA_CHILDS_MISSING", "Decoded app data must contain Data.Childs as an array.");
  if (data.Forms !== undefined && !Array.isArray(data.Forms)) issue(report.errors, "DATA_FORMS_BAD_TYPE", "Data.Forms must be an array when present.");
  const model = rootListModel(data);
  const appId = (resource && resource.AppID) || model.AppID;
  if (appId === undefined || appId === null || appId === "") issue(report.errors, "APP_ID_MISSING", "AppID is required at Resource.AppID or root Item.ListModel.AppID.");
  const replaceIds = resource && resource.ReplaceIds !== undefined ? resource.ReplaceIds : collectReplaceIds(data);
  if (!Array.isArray(replaceIds)) issue(report.errors, "REPLACEIDS_NOT_ARRAY", "ReplaceIds must be an array.");
  if (report.errors.length) return;

  const packageReport = runValidator("validate-yap-package.js", validationInputPath, args.validationMode, report, "preWritePackage");
  report.preWrite.packageValidationStatus = packageReport && packageReport.status || null;
  const graphReport = runValidator("validate-yap-graph.js", validationInputPath, args.validationMode, report, "preWriteGraph");
  report.preWrite.graphValidationStatus = graphReport && graphReport.status || null;
}

function runValidator(scriptName, inputPath, mode, report, target) {
  const validator = path.join(__dirname, scriptName);
  const args = [validator, inputPath, "--mode", mode];
  if (mode === "generator") args.push("--stage", "final");
  let tempReportPath = null;
  if (scriptName === "validate-yap-graph.js") {
    tempReportPath = path.join(os.tmpdir(), `build-yap-wrapper-${target}-${process.pid}-${Date.now()}.json`);
    args.push("--json", tempReportPath);
  }
  const result = spawnSync(process.execPath, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 128 * 1024 * 1024,
  });
  let validationReport = null;
  try {
    const reportText = tempReportPath && fs.existsSync(tempReportPath)
      ? fs.readFileSync(tempReportPath, "utf8")
      : result.stdout || "{}";
    validationReport = JSON.parse(reportText);
  } catch (error) {
    issue(report.errors, "VALIDATION_REPORT_PARSE_FAILED", `${scriptName} output could not be parsed.`, { target, stdout: result.stdout, stderr: result.stderr, error: error.message });
    return null;
  } finally {
    if (tempReportPath) {
      try { fs.unlinkSync(tempReportPath); } catch { /* ignore temp cleanup */ }
    }
  }
  if (result.status !== 0 || validationReport.status === "fail") {
    issue(report.errors, "VALIDATION_FAILED", `${scriptName} validation failed.`, {
      target,
      status: validationReport.status,
      errors: validationReport.errors,
      warnings: validationReport.warnings,
      dependencies: validationReport.dependencies,
    });
  } else if (validationReport.status === "pass_with_warnings") {
    issue(report.warnings, "VALIDATION_PASSED_WITH_WARNINGS", `${scriptName} validation passed with warnings/dependencies.`, {
      target,
      warnings: Array.isArray(validationReport.warnings) ? validationReport.warnings.length : 0,
      dependencies: Array.isArray(validationReport.dependencies) ? validationReport.dependencies.length : 0,
    });
  }
  return validationReport;
}

function buildResource(data, existingResource) {
  const model = rootListModel(data);
  const metadataIds = metadataIdsToPreserve(data);
  const resource = existingResource
    ? { ...existingResource }
    : {
        MainListType: 1024,
        AppID: model.AppID !== undefined ? model.AppID : 41,
        ReplaceIds: collectReplaceIds(data, metadataIds),
        ReportIds: [],
        FormKeys: Array.isArray(data.Forms) ? data.Forms.map((form) => form.FlowKey || form.Key || form.key).filter(Boolean) : [],
        Data: "",
        SimplePortal: null,
      };

  resource.MainListType = resource.MainListType !== undefined ? resource.MainListType : 1024;
  resource.AppID = resource.AppID !== undefined ? resource.AppID : (model.AppID !== undefined ? model.AppID : 41);
  resource.ReplaceIds = Array.isArray(resource.ReplaceIds) ? resource.ReplaceIds.map(String).filter((id) => !metadataIds.has(id)) : collectReplaceIds(data, metadataIds);
  resource.ReportIds = Array.isArray(resource.ReportIds) ? resource.ReportIds.map(String) : [];
  resource.FormKeys = Array.isArray(resource.FormKeys) ? resource.FormKeys : (Array.isArray(data.Forms) ? data.Forms.map((form) => form.FlowKey || form.Key || form.key).filter(Boolean) : []);
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
    issue(report.errors, "ROUNDTRIP_WRAPPER_JSON_INVALID", "Generated .yap wrapper JSON is invalid.", { error: error.message });
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
  const largeNumbers = new Set();
  try {
    resource = parseJsonPreservingLargeInts(resourceText, largeNumbers);
    round.resourceJsonValid = true;
  } catch (error) {
    issue(report.errors, "ROUNDTRIP_RESOURCE_JSON_INVALID", "Decoded Resource JSON is invalid.", { error: error.message });
    return null;
  }
  let data;
  try {
    data = parseJsonPreservingLargeInts(resource.Data, largeNumbers);
    round.resourceDataJsonValid = true;
  } catch (error) {
    issue(report.errors, "ROUNDTRIP_RESOURCE_DATA_JSON_INVALID", "Resource.Data JSON string is invalid.", { error: error.message });
    return null;
  }
  return { wrapper, resource, data };
}

function roundTripValidate(sourceData, outputPath, args, report) {
  const decoded = decodeWrapper(outputPath, report);
  if (!decoded) return;
  report.roundTrip.decodedEqualsSource = JSON.stringify(decoded.data) === JSON.stringify(sourceData);
  if (!report.roundTrip.decodedEqualsSource) issue(report.errors, "ROUNDTRIP_DECODED_DATA_MISMATCH", "Decoded Resource.Data does not equal source decoded data package.");
  const placeholders = collectPlaceholders(decoded);
  report.roundTrip.placeholdersRemaining = placeholders.length;
  if (placeholders.length) issue(report.errors, "ROUNDTRIP_PLACEHOLDERS_REMAIN", "Generated wrapper still contains unresolved placeholders.", { count: placeholders.length, placeholders: placeholders.slice(0, 50) });
  const packageReport = runValidator("validate-yap-package.js", outputPath, args.validationMode, report, "roundTripPackage");
  report.roundTrip.packageValidationPassed = Boolean(packageReport && packageReport.status !== "fail");
  const graphReport = runValidator("validate-yap-graph.js", outputPath, args.validationMode, report, "roundTripGraph");
  report.roundTrip.graphValidationPassed = Boolean(graphReport && graphReport.status !== "fail");
}

function writeTempDataFile(data) {
  const filePath = path.join(os.tmpdir(), `build-yap-wrapper-data-${process.pid}-${Date.now()}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return filePath;
}

function main() {
  const args = parseArgs(process.argv);
  const report = {
    status: "fail",
    inputData: path.resolve(args.inputData),
    outputWrapper: path.resolve(args.outputWrapper),
    title: args.title,
    validationMode: args.validationMode,
    errors: [],
    warnings: [],
    preWrite: {
      packageValidationStatus: null,
      graphValidationStatus: null,
    },
    roundTrip: {
      wrapperJsonValid: false,
      resourcePrefixValid: false,
      resourceBase64Valid: false,
      resourceGunzipValid: false,
      resourceJsonValid: false,
      resourceDataJsonValid: false,
      decodedEqualsSource: false,
      packageValidationPassed: false,
      graphValidationPassed: false,
      placeholdersRemaining: 0,
    },
  };

  const inputAbs = path.resolve(args.inputData);
  const outputAbs = path.resolve(args.outputWrapper);
  if (inputAbs === outputAbs) {
    issue(report.errors, "UNSAFE_OUTPUT_PATH", "Output .yap path must differ from input JSON path.");
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const input = readJson(inputAbs, report);
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

  const validationInputPath = inputAbs;
  try {
    validateBeforeWrite(normalized, validationInputPath, args, report);
  } finally {
    if (validationInputPath !== inputAbs) {
      try { fs.unlinkSync(validationInputPath); } catch { /* ignore temp cleanup */ }
    }
  }
  if (report.errors.length) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const resource = buildResource(normalized.data, normalized.resource);
  const resourceJson = JSON.stringify(resource);
  const compressed = zlib.gzipSync(Buffer.from(resourceJson, "utf8"));
  const model = rootListModel(normalized.data);
  const wrapperIconUrl = args.iconUrl !== undefined ? args.iconUrl : (model.IconUrl !== undefined ? model.IconUrl : null);
  const wrapper = {
    Title: args.title,
    Description: args.description || "",
    IconUrl: wrapperIconUrl,
    IsListSet: true,
    Resource: `${GZIP_PREFIX}${compressed.toString("base64")}`,
  };

  fs.mkdirSync(path.dirname(outputAbs), { recursive: true });
  fs.writeFileSync(outputAbs, `${JSON.stringify(wrapper, null, 2)}\n`, "utf8");

  roundTripValidate(normalized.data, outputAbs, args, report);
  if (report.errors.length) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  report.status = "pass";
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
