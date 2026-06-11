#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const util = require("util");

const PLACEHOLDER_RE = /^__.*REQUIRED.*__$/;

function usage(exitCode = 1) {
  const out = [
    "Usage:",
    "  node build-ywf-wrapper.js <decoded-def.json> <output.ywf> --flow-name <name> --flow-key <key> --workflow-type <type> [--description <description>]",
    "",
    "Example:",
    "  node build-ywf-wrapper.js ./travel-request-def.sandbox.json ./travel-request.sandbox.ywf --flow-name \"Travel Request Approval\" --flow-key TR --workflow-type 2 --description \"Sandbox generated Travel Request Approval\"",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(out);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const positional = [];
  const options = {
    flowName: null,
    flowKey: null,
    workflowType: null,
    description: "",
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--flow-name") {
      options.flowName = argv[++i];
    } else if (arg === "--flow-key") {
      options.flowKey = argv[++i];
    } else if (arg === "--workflow-type") {
      const raw = argv[++i];
      const parsed = Number(raw);
      if (!Number.isInteger(parsed)) usage();
      options.workflowType = parsed;
    } else if (arg === "--description") {
      options.description = argv[++i] || "";
    } else if (arg.startsWith("--")) {
      usage();
    } else {
      positional.push(arg);
    }
  }

  if (
    positional.length !== 2 ||
    !options.flowName ||
    !options.flowKey ||
    options.workflowType === null ||
    options.workflowType === undefined
  ) {
    usage();
  }

  return {
    inputDef: positional[0],
    outputWrapper: positional[1],
    ...options,
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

function decodeBase64Json(encoded) {
  const decodedText = Buffer.from(encoded, "base64").toString("utf8");
  const reencoded = Buffer.from(decodedText, "utf8").toString("base64").replace(/=+$/, "");
  const normalizedInput = encoded.replace(/\s/g, "").replace(/=+$/, "");
  if (reencoded !== normalizedInput) {
    throw new Error("Def is not valid canonical UTF-8 base64 JSON payload");
  }
  return JSON.parse(decodedText);
}

function main() {
  const args = parseArgs(process.argv);
  const report = {
    status: "fail",
    inputDef: args.inputDef,
    outputWrapper: args.outputWrapper,
    flowName: args.flowName,
    flowKey: args.flowKey,
    workflowType: args.workflowType,
    errors: [],
    warnings: [],
    roundTrip: {
      wrapperJsonValid: false,
      defBase64Valid: false,
      decodedJsonValid: false,
      decodedEqualsSource: false,
      flowKeyMatches: false,
      workflowTypeMatches: false,
      placeholdersRemaining: 0,
    },
  };

  const inputAbs = path.resolve(args.inputDef);
  const outputAbs = path.resolve(args.outputWrapper);
  if (inputAbs === outputAbs) {
    addIssue(report.errors, "UNSAFE_OUTPUT_PATH", "Output .ywf path must be different from the decoded Def input path", {
      output: args.outputWrapper,
    });
    printReport(report, 1);
  }

  const def = readJson(args.inputDef, "decoded Def", report.errors);
  if (report.errors.length) printReport(report, 1);

  validateBeforeWrite(def, args, report);
  if (report.errors.length) printReport(report, 1);

  const defJson = JSON.stringify(def);
  const wrapper = {
    Def: Buffer.from(defJson, "utf8").toString("base64"),
    FlowName: args.flowName,
    FlowKey: args.flowKey,
    WorkflowType: args.workflowType,
    Description: args.description || "",
    Icon: "",
    Img: null,
    Settings: null,
  };

  fs.mkdirSync(path.dirname(outputAbs), { recursive: true });
  fs.writeFileSync(outputAbs, `${JSON.stringify(wrapper, null, 2)}\n`, "utf8");

  roundTripValidate(def, outputAbs, report);
  if (report.errors.length) printReport(report, 1);

  report.status = report.warnings.length > 0 ? "pass_with_warnings" : "pass";
  printReport(report, 0);
}

function validateBeforeWrite(def, args, report) {
  if (!isObject(def)) {
    addIssue(report.errors, "DEF_NOT_OBJECT", "Decoded Def JSON must be an object");
    return;
  }
  if (!def.defkey) {
    addIssue(report.errors, "DEFKEY_MISSING", "Decoded Def must contain defkey", { path: "$.defkey" });
  }
  if (def.workflowType === undefined || def.workflowType === null) {
    addIssue(report.errors, "WORKFLOW_TYPE_MISSING", "Decoded Def must contain workflowType", { path: "$.workflowType" });
  }

  const placeholders = collectPlaceholders(def);
  if (placeholders.length > 0) {
    report.roundTrip.placeholdersRemaining = placeholders.reduce((total, item) => total + item.paths.length, 0);
    addIssue(report.errors, "UNRESOLVED_PLACEHOLDERS", "Decoded Def still contains unresolved required placeholders", placeholders);
  }

  if (def.defkey && args.flowKey !== def.defkey) {
    addIssue(report.errors, "FLOW_KEY_MISMATCH", "FlowKey argument must equal decoded Def defkey", {
      flowKey: args.flowKey,
      defkey: def.defkey,
    });
  }
  if (def.workflowType !== undefined && def.workflowType !== null && args.workflowType !== def.workflowType) {
    addIssue(report.errors, "WORKFLOW_TYPE_MISMATCH", "WorkflowType argument must equal decoded Def workflowType", {
      workflowType: args.workflowType,
      decodedWorkflowType: def.workflowType,
    });
  }
}

function roundTripValidate(sourceDef, outputAbs, report) {
  let wrapper;
  try {
    wrapper = JSON.parse(fs.readFileSync(outputAbs, "utf8"));
    report.roundTrip.wrapperJsonValid = true;
  } catch (error) {
    addIssue(report.errors, "WRAPPER_JSON_INVALID", "Generated .ywf wrapper JSON could not be read back", { detail: error.message });
    return;
  }

  if (!wrapper.Def || typeof wrapper.Def !== "string") {
    addIssue(report.errors, "WRAPPER_DEF_MISSING", "Generated wrapper must contain a string Def field", { path: "$.Def" });
    return;
  }

  let decodedDef;
  try {
    decodedDef = decodeBase64Json(wrapper.Def);
    report.roundTrip.defBase64Valid = true;
    report.roundTrip.decodedJsonValid = true;
  } catch (error) {
    addIssue(report.errors, "WRAPPER_DEF_DECODE_FAILED", "Generated wrapper Def could not be base64-decoded into JSON", {
      detail: error.message,
    });
    return;
  }

  report.roundTrip.decodedEqualsSource = util.isDeepStrictEqual(decodedDef, sourceDef);
  if (!report.roundTrip.decodedEqualsSource) {
    addIssue(report.errors, "ROUND_TRIP_DEF_MISMATCH", "Round-trip decoded Def does not exactly equal the source decoded Def");
  }

  report.roundTrip.flowKeyMatches = wrapper.FlowKey === decodedDef.defkey;
  if (!report.roundTrip.flowKeyMatches) {
    addIssue(report.errors, "ROUND_TRIP_FLOW_KEY_MISMATCH", "Wrapper FlowKey does not equal round-trip decoded defkey", {
      flowKey: wrapper.FlowKey,
      defkey: decodedDef.defkey,
    });
  }

  report.roundTrip.workflowTypeMatches = wrapper.WorkflowType === decodedDef.workflowType;
  if (!report.roundTrip.workflowTypeMatches) {
    addIssue(report.errors, "ROUND_TRIP_WORKFLOW_TYPE_MISMATCH", "Wrapper WorkflowType does not equal round-trip decoded workflowType", {
      workflowType: wrapper.WorkflowType,
      decodedWorkflowType: decodedDef.workflowType,
    });
  }

  const remaining = collectPlaceholders(decodedDef);
  report.roundTrip.placeholdersRemaining = remaining.reduce((total, item) => total + item.paths.length, 0);
  if (remaining.length > 0) {
    addIssue(report.errors, "ROUND_TRIP_PLACEHOLDERS_REMAIN", "Round-trip decoded Def still contains unresolved required placeholders", remaining);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  collectPlaceholders,
  decodeBase64Json,
};
