#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEVICE_KEYS = new Set(["desktop", "tablet", "mobile", "pc", "pad", "phone"]);
const CONFIDENCE_VALUES = new Set([
  "product_catalog",
  "export_proven",
  "runtime_proven",
  "human_reviewed",
  "needs_study",
  "unknown",
]);

const FINDING_MESSAGES = {
  CONTROL_TYPE_UNKNOWN: "Control type is not present in the Yeeflow control property registry.",
  CONTROL_CONFIG_MISSING: "Control registry or configuration metadata is missing.",
  CONTROL_PROPERTY_UNKNOWN: "Property path is not known for this control type.",
  CONTROL_PROPERTY_EXTENSION_ONLY: "Property path is known only through the extension registry.",
  CONTROL_PROPERTY_NEEDS_STUDY: "Property path is marked as needing further study.",
  CONTROL_PROPERTY_PATH_ALIAS: "Property path uses an unsupported alias instead of the product-catalog path.",
  CONTROL_PROPERTY_WRONG_CONTROL: "Property path belongs to a different control type.",
  CONTROL_PROPERTY_VALUE_TYPE_MISMATCH: "Property value does not match the expected catalog value type.",
  CONTROL_PROPERTY_DEVICE_SHAPE_MISMATCH: "Property uses a device-specific shape that is not allowed by catalog metadata.",
  CONTROL_PROPERTY_REGISTRY_PASS: "Control spec only uses catalog-backed or accepted extension-backed property paths.",
};

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) usage(0);
  const report = inspectYeeflowControlConfigurations(args);
  const rendered = args.format === "markdown" ? renderMarkdown(report) : `${JSON.stringify(report, null, 2)}\n`;
  if (args.out) fs.writeFileSync(args.out, rendered);
  else process.stdout.write(rendered);
  process.exit(report.status === "fail" || (args.strict && report.status === "warning") ? 1 : 0);
}

export function inspectYeeflowControlConfigurations(args = {}) {
  const findings = [];
  let registry = null;
  let extensions = emptyExtensions();

  if (!args.catalog && !args.normalized) {
    addFinding(findings, "error", "CONTROL_CONFIG_MISSING", "Provide --catalog or --normalized.");
  }

  if (args.catalog) {
    try {
      registry = normalizeCatalog(readJson(args.catalog), { sourcePath: args.catalog });
    } catch (error) {
      addFinding(findings, "error", "CONTROL_CONFIG_MISSING", `Could not read or normalize catalog: ${error.message}`);
    }
  }

  if (!registry && args.normalized) {
    try {
      registry = readJson(args.normalized);
    } catch (error) {
      addFinding(findings, "error", "CONTROL_CONFIG_MISSING", `Could not read normalized registry: ${error.message}`);
    }
  }

  if (args.extensions) {
    try {
      extensions = normalizeExtensions(readJson(args.extensions));
    } catch (error) {
      addFinding(findings, "error", "CONTROL_CONFIG_MISSING", `Could not read extension registry: ${error.message}`);
    }
  }

  const response = {
    status: statusFromFindings(findings),
    summary: "",
    input: {
      catalog: safePath(args.catalog),
      normalized: safePath(args.normalized),
      extensions: safePath(args.extensions),
      control: args.control || null,
      validateControlSpec: safePath(args.validateControlSpec),
    },
    controlCount: registry ? Object.keys(registry.controls || {}).length : 0,
    propertyCount: registry ? countProperties(registry) : 0,
    controls: [],
    control: null,
    normalizedRegistry: null,
    validation: null,
    findingCodes: [],
    findings,
    proofBoundary: [
      "This helper validates declared Yeeflow control metadata and product-catalog property paths only.",
      "It does not parse screenshots, decode private YAPK payloads, call Yeeflow APIs, sign, install, import, or upgrade packages.",
      "Product catalog paths identify configurable properties; export/runtime evidence is still required for visual fidelity claims.",
    ],
  };

  if (registry && !hasErrors(findings)) {
    if (args.listControls) {
      response.controls = Object.keys(registry.controls || {}).sort();
    }

    if (args.control) {
      const control = registry.controls?.[args.control];
      if (!control) {
        addFinding(findings, "error", "CONTROL_TYPE_UNKNOWN", `${args.control} is not a known control type.`, { controlType: args.control });
      } else {
        response.control = {
          controlType: args.control,
          configId: control.configId,
          controlTypes: control.controlTypes || [args.control],
          propertyCount: Object.keys(control.properties || {}).length,
          properties: control.properties || {},
        };
      }
    }

    if (args.validateControlSpec) {
      try {
        response.validation = validateControlSpec(readJson(args.validateControlSpec), registry, extensions, findings);
      } catch (error) {
        addFinding(findings, "error", "CONTROL_CONFIG_MISSING", `Could not read control spec: ${error.message}`);
      }
    }

    if (args.catalog && !args.listControls && !args.control && !args.validateControlSpec) {
      response.normalizedRegistry = registry;
    }
  }

  response.status = statusFromFindings(findings);
  response.summary = summarize(response.status, findings, args.strict);
  response.findingCodes = [...new Set(findings.map((finding) => finding.code))];
  return response;
}

export function normalizeCatalog(catalog, { sourcePath = null } = {}) {
  if (!Array.isArray(catalog)) {
    throw new Error("catalog must be an array");
  }

  const controls = {};
  const normalizationWarnings = [];

  for (const [entryIndex, entry] of catalog.entries()) {
    if (!entry || typeof entry !== "object") throw new Error(`entry ${entryIndex} must be an object`);
    if (!entry.id) throw new Error(`entry ${entryIndex} missing id`);
    if (!Array.isArray(entry.control_types) || entry.control_types.length === 0) {
      throw new Error(`entry ${entry.id} missing control_types[]`);
    }
    if (!Array.isArray(entry.configurations)) throw new Error(`entry ${entry.id} missing configurations[]`);

    const properties = {};
    for (const [configurationIndex, configuration] of entry.configurations.entries()) {
      if (!configuration?.path) throw new Error(`entry ${entry.id} configuration ${configurationIndex} missing path`);
      const valueType = configuration.valueType || (configuration.enum ? "enum" : "unknown");
      if (!configuration.valueType) {
        normalizationWarnings.push({
          configId: entry.id,
          path: configuration.path,
          warning: "valueType missing in product catalog; inferred from enum or set to unknown",
        });
      }
      properties[configuration.path] = {
        path: configuration.path,
        valueType,
        allowDevice: Boolean(configuration.allowDevice),
        description: String(configuration.description || ""),
        source: "product_catalog",
        confidence: "product_catalog",
      };
      if (configuration.enum) properties[configuration.path].enum = configuration.enum;
    }

    for (const controlType of entry.control_types) {
      controls[controlType] = {
        configId: entry.id,
        controlTypes: entry.control_types,
        properties: sortObject(properties),
      };
    }
  }

  return {
    schemaVersion: 1,
    source: "product_catalog",
    sourceArtifact: sourcePath ? path.basename(sourcePath) : "control-configurations.json",
    rawCatalogCommitted: false,
    normalizedAt: new Date(0).toISOString(),
    controlCount: Object.keys(controls).length,
    propertyCount: Object.values(controls).reduce((total, control) => total + Object.keys(control.properties || {}).length, 0),
    confidenceValues: [...CONFIDENCE_VALUES],
    normalizationWarnings,
    controls: sortObject(controls),
  };
}

export function validateControlSpec(spec, registry, extensionsRegistry = emptyExtensions(), findings = []) {
  const controls = normalizeSpecControls(spec);
  const extensions = normalizeExtensions(extensionsRegistry);
  const knownPathsByControl = buildKnownPathIndex(registry);
  const controlsChecked = [];

  for (const control of controls) {
    const controlType = normalizeControlType(control.controlType || control.type);
    const claimsFilterBehavior = Boolean(control.claimsFilterBehavior || control.filterBehaviorClaimed || (control.claims || []).some((claim) => /filter/i.test(String(claim))));

    if (claimsFilterBehavior && ["text", "static-text", "heading"].includes(controlType)) {
      addFinding(findings, "error", "CONTROL_PROPERTY_WRONG_CONTROL", `${controlType} cannot satisfy claimed filter behavior; use a known filter control.`);
    }

    if (!registry.controls?.[controlType]) {
      addFinding(findings, "error", "CONTROL_TYPE_UNKNOWN", `${controlType || "unknown"} is not a known control type.`, { controlType });
      continue;
    }

    const properties = normalizeControlProperties(control);
    const checked = { controlType, propertyCount: Object.keys(properties).length, properties: [] };
    controlsChecked.push(checked);

    for (const [propertyPath, value] of Object.entries(properties)) {
      const productProperty = registry.controls[controlType].properties?.[propertyPath];
      const extensionProperty = extensions.byControl?.[controlType]?.[propertyPath];
      const aliasTarget = findAliasTarget(propertyPath, registry.controls[controlType].properties || {});
      if (aliasTarget) {
        addFinding(findings, "error", "CONTROL_PROPERTY_PATH_ALIAS", `Use ${aliasTarget}, not ${propertyPath}.`, {
          controlType,
          propertyPath,
          canonicalPath: aliasTarget,
        });
        continue;
      }

      if (!productProperty && !extensionProperty) {
        const otherControls = knownPathsByControl[propertyPath]?.filter((knownControl) => knownControl !== controlType) || [];
        if (otherControls.length > 0) {
          addFinding(findings, "error", "CONTROL_PROPERTY_WRONG_CONTROL", `${propertyPath} belongs to ${otherControls.join(", ")}, not ${controlType}.`, {
            controlType,
            propertyPath,
            knownControls: otherControls,
          });
        } else {
          addFinding(findings, "error", "CONTROL_PROPERTY_UNKNOWN", `${propertyPath} is not known for ${controlType}.`, { controlType, propertyPath });
        }
        continue;
      }

      const metadata = productProperty || extensionProperty;
      if (extensionProperty && !productProperty) {
        const severity = ["export_proven", "runtime_proven"].includes(extensionProperty.confidence) ? "info" : "warning";
        addFinding(findings, severity, "CONTROL_PROPERTY_EXTENSION_ONLY", `${propertyPath} is extension-only for ${controlType}.`, {
          controlType,
          propertyPath,
          confidence: extensionProperty.confidence,
          status: extensionProperty.status,
        });
      }
      if (metadata.status === "needs_study" || metadata.confidence === "needs_study") {
        addFinding(findings, "warning", "CONTROL_PROPERTY_NEEDS_STUDY", `${propertyPath} still needs study before strong claims.`, {
          controlType,
          propertyPath,
        });
      }
      validateValueType(controlType, propertyPath, value, metadata, findings);
      validateDeviceShape(controlType, propertyPath, value, metadata, findings);
      checked.properties.push({ propertyPath, source: metadata.source, confidence: metadata.confidence, valueType: metadata.valueType });
    }
  }

  if (!findings.some((finding) => finding.severity === "error" || finding.severity === "warning")) {
    addFinding(findings, "info", "CONTROL_PROPERTY_REGISTRY_PASS", "Control spec uses known registry paths.");
  }

  return { controlsChecked };
}

function normalizeExtensions(input = emptyExtensions()) {
  const byControl = {};
  const entries = Array.isArray(input) ? input : input.extensions || [];
  for (const entry of entries) {
    if (!entry?.controlType || !entry?.propertyPath) continue;
    const controlType = normalizeControlType(entry.controlType);
    byControl[controlType] ||= {};
    byControl[controlType][entry.propertyPath] = {
      path: entry.propertyPath,
      valueType: entry.valueType || "unknown",
      allowDevice: Boolean(entry.allowDevice),
      description: entry.notes || entry.description || "",
      source: entry.source || "extension_registry",
      confidence: entry.confidence || "unknown",
      evidence: entry.evidence || [],
      status: entry.status || entry.confidence || "unknown",
      notes: entry.notes || "",
    };
  }
  return { ...input, byControl };
}

function normalizeSpecControls(spec) {
  if (Array.isArray(spec)) return spec;
  if (Array.isArray(spec.controls)) return spec.controls;
  if (spec.controlType || spec.type) return [spec];
  return [];
}

function normalizeControlProperties(control) {
  const flat = {};
  if (control.properties && typeof control.properties === "object") {
    Object.assign(flat, control.properties);
  }
  if (control.attrs || control.exts || control.children || control.binding || control.label) {
    flattenObject(control, "", flat, new Set(["controlType", "type", "name", "claims", "claimsFilterBehavior", "filterBehaviorClaimed", "properties"]));
  }
  return flat;
}

function flattenObject(value, prefix, output, skipKeys = new Set()) {
  if (Array.isArray(value)) {
    if (prefix) output[prefix] = value;
    return;
  }
  if (!value || typeof value !== "object") {
    if (prefix) output[prefix] = value;
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (!prefix && skipKeys.has(key)) continue;
    const childPath = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) flattenObject(child, childPath, output, skipKeys);
    else output[childPath] = child;
  }
}

function validateValueType(controlType, propertyPath, value, metadata, findings) {
  if (isDeviceValue(value)) {
    for (const deviceValue of Object.values(value)) validateValueType(controlType, propertyPath, deviceValue, metadata, findings);
    return;
  }
  const expected = metadata.valueType;
  if (!expected || expected === "unknown") return;
  let valid = true;
  if (expected === "array") valid = Array.isArray(value);
  else if (expected === "boolean") valid = typeof value === "boolean";
  else if (expected === "number") valid = typeof value === "number" && Number.isFinite(value);
  else if (expected === "object") valid = Boolean(value) && typeof value === "object" && !Array.isArray(value);
  else if (expected === "string") valid = typeof value === "string";
  else if (expected === "enum") valid = ["string", "number", "boolean"].includes(typeof value);
  if (!valid) {
    addFinding(findings, "error", "CONTROL_PROPERTY_VALUE_TYPE_MISMATCH", `${propertyPath} on ${controlType} expects ${expected}.`, {
      controlType,
      propertyPath,
      expected,
      actual: Array.isArray(value) ? "array" : typeof value,
    });
  }
}

function validateDeviceShape(controlType, propertyPath, value, metadata, findings) {
  if (!metadata.allowDevice && isDeviceValue(value)) {
    addFinding(findings, "error", "CONTROL_PROPERTY_DEVICE_SHAPE_MISMATCH", `${propertyPath} does not allow device-specific values.`, {
      controlType,
      propertyPath,
    });
  }
}

function isDeviceValue(value) {
  if (!value || Array.isArray(value) || typeof value !== "object") return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => DEVICE_KEYS.has(key));
}

function findAliasTarget(propertyPath, properties) {
  const candidates = Object.keys(properties);
  const normalized = normalizeAliasPath(propertyPath);
  if (normalized !== propertyPath && candidates.includes(normalized)) return normalized;
  return null;
}

function normalizeAliasPath(propertyPath) {
  return propertyPath.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

function buildKnownPathIndex(registry) {
  const index = {};
  for (const [controlType, control] of Object.entries(registry.controls || {})) {
    for (const propertyPath of Object.keys(control.properties || {})) {
      index[propertyPath] ||= [];
      index[propertyPath].push(controlType);
    }
  }
  return index;
}

function countProperties(registry) {
  return Object.values(registry.controls || {}).reduce((total, control) => total + Object.keys(control.properties || {}).length, 0);
}

function addFinding(findings, severity, code, message, details = {}) {
  findings.push({
    severity,
    code,
    message: message || FINDING_MESSAGES[code] || code,
    ...details,
  });
}

function statusFromFindings(findings) {
  if (findings.some((finding) => finding.severity === "error")) return "fail";
  if (findings.some((finding) => finding.severity === "warning")) return "warning";
  return "pass";
}

function summarize(status, findings, strict) {
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  if (status === "pass") return "Yeeflow control property registry checks passed.";
  if (status === "warning" && strict) return `Yeeflow control property registry checks found ${warnings} warning(s); strict mode treats warnings as failures.`;
  if (status === "warning") return `Yeeflow control property registry checks passed with ${warnings} warning(s).`;
  return `Yeeflow control property registry checks failed with ${errors} error(s) and ${warnings} warning(s).`;
}

function hasErrors(findings) {
  return findings.some((finding) => finding.severity === "error");
}

function normalizeControlType(controlType) {
  return String(controlType || "").trim();
}

function sortObject(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)));
}

function emptyExtensions() {
  return { schemaVersion: 1, extensions: [] };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safePath(filePath) {
  return filePath ? path.relative(process.cwd(), path.resolve(filePath)) : null;
}

function parseArgs(argv) {
  const args = { format: "json", strict: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--catalog") args.catalog = argv[++index];
    else if (arg === "--normalized") args.normalized = argv[++index];
    else if (arg === "--extensions") args.extensions = argv[++index];
    else if (arg === "--control") args.control = argv[++index];
    else if (arg === "--list-controls") args.listControls = true;
    else if (arg === "--validate-control-spec") args.validateControlSpec = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--format") args.format = argv[++index];
    else if (arg === "--strict") args.strict = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function renderMarkdown(report) {
  const lines = [
    `# Yeeflow Control Property Registry Findings`,
    "",
    `Status: ${report.status}`,
    "",
    report.summary,
  ];
  if (report.controls?.length) {
    lines.push("", "## Controls", "", ...report.controls.map((control) => `- ${control}`));
  }
  if (report.control) {
    lines.push("", "## Control", "", `- Type: ${report.control.controlType}`, `- Config: ${report.control.configId}`, `- Properties: ${report.control.propertyCount}`);
  }
  if (report.findings.length > 0) {
    lines.push("", "## Findings", "");
    for (const finding of report.findings) {
      lines.push(`- ${finding.severity}: ${finding.code} - ${finding.message}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

function usage(exitCode) {
  const script = path.basename(fileURLToPath(import.meta.url));
  process.stderr.write(`Usage: node scripts/${script} --normalized <normalized.json> [--extensions <extensions.json>] [--list-controls] [--control <controlType>] [--validate-control-spec <spec.json>] [--format json|markdown] [--strict]\n`);
  process.stderr.write(`       node scripts/${script} --catalog <control-configurations.json> [--out <normalized.json>]\n`);
  process.exit(exitCode);
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
