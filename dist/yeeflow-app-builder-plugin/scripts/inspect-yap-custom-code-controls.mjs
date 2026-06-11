#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

function usage(exitCode = 1) {
  const message = [
    "Usage:",
    "  node scripts/inspect-yap-custom-code-controls.mjs <app.yap|decoded-app.json> [--out <inspection.json>]",
    "",
    "Inspects Yeeflow codein custom code controls in dashboards, data-list custom forms, approval forms, and public forms.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(message);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, out: null };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--out") args.out = argv[++index];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input) usage();
  return args;
}

function quoteLargeIntegers(jsonText, largeNumbers) {
  let output = "";
  let index = 0;
  let inString = false;
  let escaped = false;

  while (index < jsonText.length) {
    const char = jsonText[index];
    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === "\"") inString = false;
      index += 1;
      continue;
    }
    if (char === "\"") {
      inString = true;
      output += char;
      index += 1;
      continue;
    }
    if (char === "-" || (char >= "0" && char <= "9")) {
      const start = index;
      let end = index;
      if (jsonText[end] === "-") end += 1;
      while (end < jsonText.length && jsonText[end] >= "0" && jsonText[end] <= "9") end += 1;
      if (jsonText[end] === "." || jsonText[end] === "e" || jsonText[end] === "E") {
        while (end < jsonText.length && /[0-9eE+\-.]/.test(jsonText[end])) end += 1;
        output += jsonText.slice(start, end);
      } else {
        const token = jsonText.slice(start, end);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          output += `"${token}"`;
        } else {
          output += token;
        }
      }
      index = end;
      continue;
    }
    output += char;
    index += 1;
  }

  return output;
}

function parseJson(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function tryParseJson(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || !/^[{[]/.test(trimmed)) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function loadApp(inputPath, largeNumbers) {
  const parsed = parseJson(fs.readFileSync(inputPath, "utf8"), largeNumbers);
  if (parsed && typeof parsed.Resource === "string" && parsed.Resource.startsWith(GZIP_PREFIX)) {
    const compressed = Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64");
    const resourceText = zlib.gunzipSync(compressed).toString("utf8");
    const resource = parseJson(resourceText, largeNumbers);
    if (typeof resource.Data !== "string") throw new Error("Decoded Resource.Data is missing or not a JSON string.");
    return { wrapper: parsed, resource, app: parseJson(resource.Data, largeNumbers) };
  }
  if (parsed && typeof parsed.Data === "string" && parsed.Item === undefined) {
    return { wrapper: null, resource: parsed, app: parseJson(parsed.Data, largeNumbers) };
  }
  return { wrapper: null, resource: null, app: parsed };
}

function sha256Short(value) {
  return crypto.createHash("sha256").update(value || "").digest("hex").slice(0, 16);
}

function parseResource(layout) {
  return tryParseJson(layout?.LayoutInResources?.[0]?.Resource || null);
}

function walkControls(value, visitor, pointer = "$") {
  const parsed = tryParseJson(value);
  if (!isObject(parsed) && !Array.isArray(parsed)) return;
  if (Array.isArray(parsed)) {
    parsed.forEach((child, index) => walkControls(child, visitor, `${pointer}[${index}]`));
    return;
  }
  visitor(parsed, pointer);
  for (const [key, child] of Object.entries(parsed)) {
    if (key === "codein-script") continue;
    walkControls(child, visitor, `${pointer}.${key}`);
  }
}

function findCodeinControls(root, pointerPrefix) {
  const controls = [];
  walkControls(root, (node, pointer) => {
    if (node?.type === "codein" || node?.attrs?.["codein-script"] !== undefined) {
      controls.push({ pointer: `${pointerPrefix}${pointer.slice(1)}`, control: node });
    }
  });
  return controls;
}

function extractDescription(script) {
  const match = String(script || "").match(/description\(\)\s*{\s*return\s+['"]([^'"]+)['"]/);
  return match ? match[1] : "";
}

function extractInputParameters(script) {
  const text = String(script || "");
  const bodyMatch = text.match(/inputParameters\(\)\s*:\s*InputParameter\[\]\s*{\s*return\s*\[([\s\S]*?)\];\s*}/);
  if (!bodyMatch) return [];
  const parameters = [];
  const objectRe = /{\s*id:\s*['"]([^'"]+)['"]\s*,\s*name:\s*['"]([^'"]+)['"]\s*,\s*type:\s*['"]([^'"]+)['"]\s*,\s*desc:\s*['"]([^'"]*)['"]\s*}/g;
  let match;
  while ((match = objectRe.exec(bodyMatch[1]))) {
    parameters.push({ id: match[1], name: match[2], type: match[3], desc: match[4] });
  }
  return parameters;
}

function expressionKind(value) {
  if (isObject(value) && value.type === 1) return "field_or_variable_binding";
  if (isObject(value) && value.type === 2) return "expression";
  if (typeof value === "string") return "static_string";
  if (typeof value === "number") return "static_number";
  if (typeof value === "boolean") return "static_boolean";
  if (value === null || value === undefined) return "empty";
  return Array.isArray(value) ? "array" : typeof value;
}

function expressionSummary(value) {
  if (isObject(value) && value.type === 1 && isObject(value.value)) {
    return {
      kind: expressionKind(value),
      prefix: value.value.prefix || null,
      value: value.value.value !== undefined ? String(value.value.value) : null,
    };
  }
  if (isObject(value) && value.type === 2 && Array.isArray(value.value)) {
    return {
      kind: expressionKind(value),
      tokens: value.value.map((token) => ({
        type: token?.type || null,
        value: token?.value !== undefined ? token.value : null,
      })),
    };
  }
  return { kind: expressionKind(value), value };
}

function buildParameterMap(rawParams, expectedParameters) {
  const params = isObject(rawParams) ? rawParams : {};
  const expectedById = new Map(expectedParameters.map((param) => [param.id, param]));
  return Object.entries(params).map(([name, value]) => {
    const expected = expectedById.get(name) || null;
    return {
      name,
      yeeflowType: expressionKind(value),
      value: expressionSummary(value),
      tsxProp: expected ? expected.id : null,
      expectedType: expected ? expected.type : null,
      requiredBySmartLookupPicker: ["dataListId", "displayField", "valueField"].includes(name),
      knownToScript: Boolean(expected),
    };
  });
}

function addCodeinInstance(instances, context, controlEntry) {
  const attrs = controlEntry.control.attrs || {};
  const script = attrs["codein-script"] || "";
  const rawParams = tryParseJson(attrs["codein-script-param"]) || {};
  const expectedParameters = extractInputParameters(script);
  instances.push({
    ...context,
    pointer: controlEntry.pointer,
    control: {
      id: controlEntry.control.id || null,
      type: controlEntry.control.type || null,
      label: controlEntry.control.label || null,
      title: attrs.title || attrs.nv_label || controlEntry.control.nv_label || null,
      attrKeys: Object.keys(attrs),
    },
    script: {
      storage: script ? "embedded_in_control_attrs_codein_script" : "missing",
      sha256_16: sha256Short(script),
      chars: script.length,
      description: extractDescription(script),
      inputParameters: expectedParameters,
      hasCodeInApplication: /export\s+class\s+CodeInApplication\s+implements\s+CodeInComp/.test(script),
      hasRequiredFields: /requiredFields\s*\(/.test(script),
      hasQueryItems: /queryItems\s*\(/.test(script),
    },
    parameters: buildParameterMap(rawParams, expectedParameters),
    rawParameterKeys: isObject(rawParams) ? Object.keys(rawParams) : [],
  });
}

function inspectApp(app, sourcePath, largeNumbers) {
  const instances = [];

  for (const layout of app.Item?.Layouts || []) {
    const page = parseResource(layout);
    for (const controlEntry of findCodeinControls(page, `$.Item.Layouts[${app.Item.Layouts.indexOf(layout)}].LayoutInResources[0].Resource`)) {
      addCodeinInstance(instances, {
        context: "dashboard",
        pageOrFormName: layout.Title || null,
        layoutId: layout.LayoutID !== undefined ? String(layout.LayoutID) : null,
        layoutType: layout.Type !== undefined ? String(layout.Type) : null,
        listName: app.Item?.ListModel?.Title || null,
        listId: app.Item?.ListModel?.ListID !== undefined ? String(app.Item.ListModel.ListID) : null,
        containerPlacement: "LayoutInResources[0].Resource page JSON",
      }, controlEntry);
    }
  }

  for (const [childIndex, child] of (app.Childs || []).entries()) {
    for (const [layoutIndex, layout] of (child.Layouts || []).entries()) {
      const page = parseResource(layout);
      for (const controlEntry of findCodeinControls(page, `$.Childs[${childIndex}].Layouts[${layoutIndex}].LayoutInResources[0].Resource`)) {
        addCodeinInstance(instances, {
          context: layout?.Public ? "data-list-public-form" : "data-list-form",
          pageOrFormName: layout.Title || null,
          layoutId: layout.LayoutID !== undefined ? String(layout.LayoutID) : null,
          layoutType: layout.Type !== undefined ? String(layout.Type) : null,
          listName: child.ListModel?.Title || null,
          listId: child.ListModel?.ListID !== undefined ? String(child.ListModel.ListID) : null,
          containerPlacement: "child list LayoutInResources[0].Resource custom form JSON",
        }, controlEntry);
      }
    }
    for (const [publicIndex, publicForm] of (child.PublicForms || []).entries()) {
      const publicPage = tryParseJson(publicForm.Resource || publicForm.Def || publicForm);
      for (const controlEntry of findCodeinControls(publicPage, `$.Childs[${childIndex}].PublicForms[${publicIndex}]`)) {
        addCodeinInstance(instances, {
          context: "data-list-public-form",
          pageOrFormName: publicForm.Title || publicForm.Name || null,
          layoutId: publicForm.LayoutID !== undefined ? String(publicForm.LayoutID) : null,
          layoutType: "public",
          listName: child.ListModel?.Title || null,
          listId: child.ListModel?.ListID !== undefined ? String(child.ListModel.ListID) : null,
          containerPlacement: "child list PublicForms JSON",
        }, controlEntry);
      }
    }
  }

  for (const [formIndex, form] of (app.Forms || []).entries()) {
    const def = tryParseJson(form.DefResource);
    for (const [pageIndex, page] of (def?.pageurls || []).entries()) {
      for (const controlEntry of findCodeinControls(page, `$.Forms[${formIndex}].DefResource.pageurls[${pageIndex}]`)) {
        addCodeinInstance(instances, {
          context: "approval-form",
          pageOrFormName: page.title || page.name || form.Name || null,
          formName: form.Name || null,
          formKey: form.Key || null,
          listId: form.ListID !== undefined ? String(form.ListID) : null,
          containerPlacement: "DefResource.pageurls[].formdef JSON",
        }, controlEntry);
      }
    }
  }

  const warnings = [];
  for (const instance of instances) {
    if (!instance.script.hasCodeInApplication) {
      warnings.push({ code: "CUSTOM_CODE_SCRIPT_ENTRYPOINT_MISSING", message: "Custom code control script does not expose CodeInApplication.", controlId: instance.control.id });
    }
    if (!instance.script.storage.startsWith("embedded")) {
      warnings.push({ code: "CUSTOM_CODE_SCRIPT_REFERENCE_MISSING", message: "Custom code control does not include an embedded script.", controlId: instance.control.id });
    }
    const names = instance.parameters.map((parameter) => parameter.name);
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      warnings.push({ code: "CUSTOM_CODE_DUPLICATE_PARAMETER", message: "Custom code control has duplicate parameter names.", controlId: instance.control.id, parameters: [...new Set(duplicateNames)] });
    }
    for (const requiredName of ["dataListId", "displayField", "valueField"]) {
      if (!names.includes(requiredName)) {
        warnings.push({ code: "CUSTOM_CODE_REQUIRED_PARAMETER_MISSING", message: `Smart Lookup Picker required parameter '${requiredName}' is missing.`, controlId: instance.control.id });
      }
    }
    if (!instance.control.title && instance.control.label === "Custom code") {
      warnings.push({ code: "CUSTOM_CODE_GENERIC_LABEL", message: "Custom code control uses the generic label and has no meaningful title/nv_label.", controlId: instance.control.id });
    }
    if (instance.context.includes("public") && instance.script.hasQueryItems) {
      warnings.push({ code: "CUSTOM_CODE_PUBLIC_FORM_QUERY_REVIEW", message: "Public-form use of queryItems requires explicit runtime permission and security review.", controlId: instance.control.id });
    }
    for (const parameter of instance.parameters) {
      if (parameter.knownToScript && parameter.expectedType === "string" && parameter.yeeflowType !== "static_string") {
        warnings.push({ code: "CUSTOM_CODE_PARAMETER_TYPE_MISMATCH", message: "Parameter expected by TSX as string is not configured as a static string.", controlId: instance.control.id, parameter: parameter.name, yeeflowType: parameter.yeeflowType, expectedType: parameter.expectedType });
      }
      if (parameter.knownToScript && parameter.expectedType === "variable" && !["expression", "field_or_variable_binding"].includes(parameter.yeeflowType)) {
        warnings.push({ code: "CUSTOM_CODE_PARAMETER_TYPE_REVIEW", message: "Parameter expected by TSX as variable/expression is configured as a static value; verify this is intentional.", controlId: instance.control.id, parameter: parameter.name, yeeflowType: parameter.yeeflowType, expectedType: parameter.expectedType });
      }
      if (!parameter.knownToScript) {
        warnings.push({ code: "CUSTOM_CODE_UNKNOWN_PARAMETER", message: "Control parameter is not declared by the embedded TSX inputParameters() method.", controlId: instance.control.id, parameter: parameter.name });
      }
    }
  }

  return {
    source: path.resolve(sourcePath),
    summary: {
      customCodeControls: instances.length,
      dashboardControls: instances.filter((item) => item.context === "dashboard").length,
      approvalFormControls: instances.filter((item) => item.context === "approval-form").length,
      dataListFormControls: instances.filter((item) => item.context === "data-list-form").length,
      publicFormControls: instances.filter((item) => item.context.includes("public")).length,
      largeNumbersPreserved: largeNumbers.size,
    },
    instances,
    warnings,
  };
}

const args = parseArgs(process.argv);
const largeNumbers = new Set();
try {
  const { app } = loadApp(args.input, largeNumbers);
  const report = inspectApp(app, args.input, largeNumbers);
  const text = `${JSON.stringify(report, null, 2)}\n`;
  if (args.out) {
    fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
    fs.writeFileSync(args.out, text, "utf8");
  }
  process.stdout.write(text);
} catch (error) {
  console.error(JSON.stringify({ status: "fail", errors: [{ code: "CUSTOM_CODE_INSPECTION_FAILED", message: error.message }] }, null, 2));
  process.exit(1);
}
