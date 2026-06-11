#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;

function usage(exitCode = 1) {
  const out = [
    "Usage:",
    "  node apply-ywf-metadata.js <source-def.json> <filled-metadata.json> <output-def.json>",
    "",
    "Example:",
    "  node apply-ywf-metadata.js ./travel-request-def.json ./travel-request-sandbox-metadata.json ./travel-request-def.sandbox.json",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(out);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = argv.slice(2);
  if (args.length !== 3) usage();
  return {
    source: args[0],
    metadata: args[1],
    output: args[2],
  };
}

function printReport(report, exitCode) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(exitCode);
}

function readJson(filePath, label, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push({
      code: "JSON_READ_FAILED",
      message: `Unable to read or parse ${label} JSON`,
      path: filePath,
      detail: error.message,
    });
    return null;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isEmptyValue(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function addIssue(list, code, message, detail) {
  list.push({ code, message, detail: detail || null });
}

function deepWalk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) {
    value.forEach((item, index) => deepWalk(item, visitor, `${pointer}[${index}]`));
  } else if (isObject(value)) {
    Object.entries(value).forEach(([key, child]) => deepWalk(child, visitor, `${pointer}.${key}`));
  }
}

function collectPlaceholders(value) {
  const found = new Map();
  deepWalk(value, (node, pointer) => {
    if (typeof node === "string" && PLACEHOLDER_RE.test(node)) {
      if (!found.has(node)) found.set(node, []);
      found.get(node).push(pointer);
    }
  });
  return [...found.entries()].map(([placeholder, paths]) => ({ placeholder, paths }));
}

function flattenMetadataEntries(metadata) {
  const entries = [];
  const seenArrays = new Set();

  function walk(value, groupPath) {
    if (Array.isArray(value)) {
      if (seenArrays.has(value)) return;
      seenArrays.add(value);
      if (value.some((item) => isObject(item) && typeof item.placeholder === "string")) {
        value.forEach((item, index) => {
          if (isObject(item) && typeof item.placeholder === "string") {
            entries.push({ entry: item, groupPath: `${groupPath}[${index}]` });
          }
        });
        return;
      }
      value.forEach((item, index) => walk(item, `${groupPath}[${index}]`));
      return;
    }

    if (isObject(value)) {
      Object.entries(value).forEach(([key, child]) => walk(child, groupPath ? `${groupPath}.${key}` : key));
    }
  }

  walk(metadata, "$");
  return entries;
}

function stencilId(childshape) {
  return childshape && childshape.stencil && (childshape.stencil.id || childshape.stencil);
}

function findWorkflowNode(def, locator) {
  return (Array.isArray(def.childshapes) ? def.childshapes : []).find((childshape) => {
    return stencilId(childshape) === locator.nodeStencil && childshape.properties && childshape.properties.name === locator.nodeName;
  });
}

function findPage(def, locator) {
  const pages = Array.isArray(def.pageurls) ? def.pageurls : [];
  return pages.find((page) => {
    const title = page.title || page.name || (page.formdef && (page.formdef.title || page.formdef.name));
    return title === locator.pageTitle;
  });
}

function findControl(container, locator) {
  let found = null;
  const children = container && container.formdef ? container.formdef.children : container && container.children;

  function walkControl(control) {
    if (!control || found) return;
    const label = control.label || control.title || control.name || (control.attrs && (control.attrs.label || control.attrs.title));
    const type = control.type || control.controlType || control.stencil || control.component || control.name;
    if (label === locator.controlLabel && (!locator.controlType || type === locator.controlType)) {
      found = control;
      return;
    }
    if (Array.isArray(control.children)) control.children.forEach(walkControl);
    if (Array.isArray(control.columns)) control.columns.forEach(walkControl);
  }

  if (Array.isArray(children)) children.forEach(walkControl);
  return found;
}

function resolveLocatorRoot(def, locator) {
  if (locator.nodeName || locator.nodeStencil) {
    if (!locator.nodeName || !locator.nodeStencil) {
      return { error: "Workflow node locators require both nodeName and nodeStencil" };
    }
    const node = findWorkflowNode(def, locator);
    if (!node) {
      return { error: `Unable to find workflow node ${locator.nodeName} (${locator.nodeStencil})` };
    }
    return { root: node, rootPath: workflowNodePath(def, node) };
  }

  if (locator.pageTitle || locator.controlLabel || locator.controlType) {
    if (!locator.pageTitle) {
      return { error: "Page/control locators require pageTitle" };
    }
    const page = findPage(def, locator);
    if (!page) {
      return { error: `Unable to find page ${locator.pageTitle}` };
    }
    if (!locator.controlLabel && !locator.controlType) {
      return { root: page, rootPath: pagePath(def, page) };
    }
    const control = findControl(page, locator);
    if (!control) {
      return { error: `Unable to find control ${locator.controlLabel || locator.controlType} on page ${locator.pageTitle}` };
    }
    return { root: control, rootPath: `${pagePath(def, page)}.<control:${locator.controlLabel || locator.controlType}>` };
  }

  return { error: "Locator must identify either a workflow node or a page/control" };
}

function workflowNodePath(def, node) {
  const index = (Array.isArray(def.childshapes) ? def.childshapes : []).indexOf(node);
  return index >= 0 ? `$.childshapes[${index}]` : "$.childshapes[?]";
}

function pagePath(def, page) {
  const index = (Array.isArray(def.pageurls) ? def.pageurls : []).indexOf(page);
  return index >= 0 ? `$.pageurls[${index}]` : "$.pageurls[?]";
}

function parsePropertyPath(propertyPath) {
  if (typeof propertyPath !== "string" || propertyPath.trim() === "") {
    throw new Error("propertyPath must be a non-empty string");
  }

  const tokens = [];
  propertyPath.split(".").forEach((part) => {
    const re = /([^\[\]]+)|\[(\d+)\]/g;
    let match;
    let matched = false;
    while ((match = re.exec(part))) {
      matched = true;
      tokens.push(match[1] !== undefined ? match[1] : Number(match[2]));
    }
    if (!matched) throw new Error(`Invalid propertyPath segment: ${part}`);
  });
  return tokens;
}

function getAtPath(root, propertyPath) {
  const tokens = parsePropertyPath(propertyPath);
  return tokens.reduce((current, token) => {
    if (current === undefined || current === null) return undefined;
    return current[token];
  }, root);
}

function setAtPath(root, propertyPath, value) {
  const tokens = parsePropertyPath(propertyPath);
  let current = root;
  for (let i = 0; i < tokens.length - 1; i += 1) {
    if (current === undefined || current === null) {
      throw new Error(`Cannot traverse ${tokens.slice(0, i + 1).join(".")}`);
    }
    current = current[tokens[i]];
  }
  if (current === undefined || current === null) {
    throw new Error(`Cannot set ${propertyPath}`);
  }
  current[tokens[tokens.length - 1]] = value;
}

function main() {
  const args = parseArgs(process.argv);
  const report = {
    status: "fail",
    source: args.source,
    metadata: args.metadata,
    output: args.output,
    replacementsApplied: 0,
    errors: [],
    warnings: [],
    remainingPlaceholders: [],
  };

  const sourceAbs = path.resolve(args.source);
  const metadataAbs = path.resolve(args.metadata);
  const outputAbs = path.resolve(args.output);
  if (outputAbs === sourceAbs || outputAbs === metadataAbs) {
    addIssue(report.errors, "UNSAFE_OUTPUT_PATH", "Output path must be different from the source Def and metadata file", { output: args.output });
    printReport(report, 1);
  }

  const sourceDef = readJson(args.source, "source Def", report.errors);
  const metadata = readJson(args.metadata, "metadata", report.errors);
  if (report.errors.length) printReport(report, 1);

  const entries = flattenMetadataEntries(metadata);
  const metadataByPlaceholder = new Map();
  const verifiedOccurrences = new Map();

  if (entries.length === 0) {
    addIssue(report.errors, "NO_METADATA_ENTRIES", "Metadata file does not contain any placeholder entries");
  }

  for (const { entry, groupPath } of entries) {
    validateEntryShape(entry, groupPath, report.errors);
    if (typeof entry.placeholder === "string") {
      if (!metadataByPlaceholder.has(entry.placeholder)) metadataByPlaceholder.set(entry.placeholder, []);
      metadataByPlaceholder.get(entry.placeholder).push({ entry, groupPath });
    }
  }

  for (const [placeholder, groupedEntries] of metadataByPlaceholder.entries()) {
    if (groupedEntries.length > 1) {
      addIssue(report.errors, "DUPLICATE_METADATA_PLACEHOLDER", `Placeholder appears in multiple metadata entries: ${placeholder}`, groupedEntries.map((item) => item.groupPath));
    }
  }

  if (report.errors.length) printReport(report, 1);

  const sourcePlaceholders = collectPlaceholders(sourceDef);
  for (const found of sourcePlaceholders) {
    if (!metadataByPlaceholder.has(found.placeholder)) {
      addIssue(report.errors, "UNCOVERED_PLACEHOLDER", `Placeholder exists in source Def but is not covered by metadata: ${found.placeholder}`, found.paths);
    }
  }

  for (const { entry, groupPath } of entries) {
    const occurrencesForEntry = [];
    for (const [index, locator] of entry.whereUsedByNode.entries()) {
      const detailPath = `${groupPath}.whereUsedByNode[${index}]`;
      const resolved = resolveLocatorRoot(sourceDef, locator);
      if (resolved.error) {
        addIssue(report.errors, "LOCATOR_NOT_FOUND", resolved.error, { placeholder: entry.placeholder, path: detailPath });
        continue;
      }
      let actual;
      try {
        actual = getAtPath(resolved.root, locator.propertyPath);
      } catch (error) {
        addIssue(report.errors, "LOCATOR_PATH_INVALID", "Unable to read locator propertyPath", {
          placeholder: entry.placeholder,
          path: detailPath,
          propertyPath: locator.propertyPath,
          detail: error.message,
        });
        continue;
      }
      if (actual !== locator.expectedCurrentValue) {
        addIssue(report.errors, "EXPECTED_VALUE_MISMATCH", "Locator expectedCurrentValue does not match the source Def value", {
          placeholder: entry.placeholder,
          path: detailPath,
          propertyPath: locator.propertyPath,
          expectedCurrentValue: locator.expectedCurrentValue,
          actualValue: actual,
        });
        continue;
      }
      if (actual !== entry.placeholder) {
        addIssue(report.errors, "LOCATOR_PLACEHOLDER_MISMATCH", "Locator value matches expectedCurrentValue but not entry.placeholder", {
          placeholder: entry.placeholder,
          path: detailPath,
          expectedCurrentValue: locator.expectedCurrentValue,
          actualValue: actual,
        });
        continue;
      }
      const occurrencePath = `${resolved.rootPath}.${locator.propertyPath}`;
      occurrencesForEntry.push({ root: resolved.root, propertyPath: locator.propertyPath, occurrencePath });
    }
    verifiedOccurrences.set(entry.placeholder, occurrencesForEntry);
  }

  for (const found of sourcePlaceholders) {
    const coveredPaths = new Set((verifiedOccurrences.get(found.placeholder) || []).map((item) => item.occurrencePath));
    const uncoveredPaths = found.paths.filter((placeholderPath) => !coveredPaths.has(placeholderPath));
    if (uncoveredPaths.length > 0) {
      addIssue(report.errors, "UNCOVERED_PLACEHOLDER_OCCURRENCE", `Placeholder has source Def occurrences not covered by verified semantic locators: ${found.placeholder}`, uncoveredPaths);
    }
  }

  if (report.errors.length) {
    report.remainingPlaceholders = sourcePlaceholders;
    printReport(report, 1);
  }

  for (const { entry } of entries) {
    for (const occurrence of verifiedOccurrences.get(entry.placeholder) || []) {
      setAtPath(occurrence.root, occurrence.propertyPath, entry.requiredValue);
      report.replacementsApplied += 1;
    }
  }

  const remainingPlaceholders = collectPlaceholders(sourceDef);
  report.remainingPlaceholders = remainingPlaceholders;
  if (remainingPlaceholders.length > 0) {
    addIssue(report.errors, "UNRESOLVED_PLACEHOLDERS_AFTER_REPLACEMENT", "Output would still contain unresolved required placeholders", remainingPlaceholders);
    printReport(report, 1);
  }

  fs.mkdirSync(path.dirname(outputAbs), { recursive: true });
  fs.writeFileSync(outputAbs, `${JSON.stringify(sourceDef, null, 2)}\n`, "utf8");
  report.status = report.warnings.length > 0 ? "pass_with_warnings" : "pass";
  printReport(report, 0);
}

function validateEntryShape(entry, groupPath, errors) {
  if (typeof entry.placeholder !== "string" || !PLACEHOLDER_RE.test(entry.placeholder)) {
    addIssue(errors, "BAD_PLACEHOLDER", "Metadata entry placeholder must match /^__.*REQUIRED.*__$/", { path: groupPath, placeholder: entry.placeholder });
  }
  if (isEmptyValue(entry.requiredValue)) {
    addIssue(errors, "EMPTY_REQUIRED_VALUE", "Metadata entry requiredValue must be filled before applying metadata", {
      path: `${groupPath}.requiredValue`,
      placeholder: entry.placeholder,
    });
  }
  if (entry.status !== "ready") {
    addIssue(errors, "METADATA_NOT_READY", "Metadata entry status must be \"ready\" before applying metadata", {
      path: `${groupPath}.status`,
      placeholder: entry.placeholder,
      status: entry.status,
    });
  }
  if (!Array.isArray(entry.whereUsedByNode) || entry.whereUsedByNode.length === 0) {
    addIssue(errors, "MISSING_SEMANTIC_LOCATOR", "Metadata entry must include at least one whereUsedByNode locator", {
      path: `${groupPath}.whereUsedByNode`,
      placeholder: entry.placeholder,
    });
    return;
  }
  entry.whereUsedByNode.forEach((locator, index) => {
    const pathBase = `${groupPath}.whereUsedByNode[${index}]`;
    if (!isObject(locator)) {
      addIssue(errors, "BAD_SEMANTIC_LOCATOR", "whereUsedByNode locator must be an object", { path: pathBase, placeholder: entry.placeholder });
      return;
    }
    if (typeof locator.propertyPath !== "string" || locator.propertyPath.trim() === "") {
      addIssue(errors, "BAD_LOCATOR_PROPERTY_PATH", "whereUsedByNode locator must include propertyPath", { path: `${pathBase}.propertyPath`, placeholder: entry.placeholder });
    }
    if (locator.expectedCurrentValue !== entry.placeholder) {
      addIssue(errors, "BAD_LOCATOR_EXPECTED_VALUE", "whereUsedByNode.expectedCurrentValue must equal the entry placeholder", {
        path: `${pathBase}.expectedCurrentValue`,
        placeholder: entry.placeholder,
        expectedCurrentValue: locator.expectedCurrentValue,
      });
    }
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  collectPlaceholders,
  flattenMetadataEntries,
  parsePropertyPath,
};
