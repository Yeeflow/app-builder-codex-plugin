import fs from "node:fs";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

const DEFAULT_PACKAGE_SOURCE = "/Users/Renger/Downloads/Workflow Actions Runtime Baseline (2)_Task forms.yap";
const DEFAULT_YWF_SOURCE = "/Users/Renger/Downloads/Workflow Action Approval Test.ywf";
const DEFAULT_OUTPUT = "workflow-task-form-runtime-baseline.v1.yap";

function usage(exitCode = 1) {
  const message = [
    "Usage:",
    "  node generate-workflow-task-form-runtime-baseline.mjs [--package-source input.yap] [--ywf-source input.ywf] [--out output.yap]",
    "",
    "Builds a focused task-form runtime baseline package by applying the corrected approval-form .ywf definition to the task-form .yap package.",
    "The generated .yap can contain tenant-local task assignee references copied from exports and must stay ignored/uncommitted.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(message);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = {
    packageSource: DEFAULT_PACKAGE_SOURCE,
    ywfSource: DEFAULT_YWF_SOURCE,
    out: DEFAULT_OUTPUT,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--package-source") args.packageSource = argv[++i];
    else if (arg === "--ywf-source") args.ywfSource = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else usage();
  }
  return args;
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

function parseJson(text, largeNumbers = new Set()) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function decodeYap(filePath) {
  const largeNumbers = new Set();
  const wrapper = parseJson(fs.readFileSync(filePath, "utf8"), largeNumbers);
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Expected .yap Resource with ${GZIP_PREFIX}`);
  }
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const resource = parseJson(resourceText, largeNumbers);
  const data = parseJson(resource.Data, largeNumbers);
  return { wrapper, resource, data };
}

function decodeYwfDef(filePath) {
  const largeNumbers = new Set();
  const wrapper = parseJson(fs.readFileSync(filePath, "utf8"), largeNumbers);
  if (typeof wrapper.Def !== "string") throw new Error("Expected .ywf wrapper with Def.");
  const def = parseJson(Buffer.from(wrapper.Def, "base64").toString("utf8"), largeNumbers);
  return { wrapper, def };
}

function writeYap({ wrapper, resource, data }, outputPath) {
  const nextResource = { ...resource, Data: JSON.stringify(data) };
  const resourceText = JSON.stringify(nextResource);
  const compressed = zlib.gzipSync(Buffer.from(resourceText, "utf8")).toString("base64");
  const nextWrapper = { ...wrapper, Resource: `${GZIP_PREFIX}${compressed}` };
  fs.writeFileSync(outputPath, `${JSON.stringify(nextWrapper, null, 2)}\n`, "utf8");
}

function main() {
  const args = parseArgs(process.argv);
  const pkg = decodeYap(args.packageSource);
  const { def } = decodeYwfDef(args.ywfSource);
  const approvalForm = pkg.data.Forms?.find((form) => form.Key === def.defkey || form.WorkflowType === 2);
  if (!approvalForm) throw new Error("Could not find approval form in package source.");

  const baselineTitle = "Workflow Task Form Runtime Baseline";
  pkg.wrapper.Title = baselineTitle;
  pkg.wrapper.Description = "Focused runtime baseline for approval workflow task forms and corrected custom button Submit form operations.";
  if (pkg.data.Item?.ListModel) {
    pkg.data.Item.ListModel.Title = baselineTitle;
    pkg.data.Item.ListModel.Description = pkg.wrapper.Description;
    if (typeof pkg.data.Item.ListModel.LayoutView === "string") {
      pkg.data.Item.ListModel.LayoutView = pkg.data.Item.ListModel.LayoutView.replaceAll(
        "Workflow Actions Runtime Baseline",
        baselineTitle,
      );
    }
  }
  for (const child of Array.isArray(pkg.data.Childs) ? pkg.data.Childs : []) {
    if (child?.ListModel && child.ListModel.ListType === undefined && child.ListModel.Type !== undefined) {
      child.ListModel.ListType = child.ListModel.Type;
    }
  }
  approvalForm.Name = "Workflow Task Form Runtime Test";
  approvalForm.DefResource = JSON.stringify(def);

  writeYap(pkg, args.out);
  console.log(`Wrote ${args.out}`);
  console.log(`Applied corrected definition from ${args.ywfSource}`);
}

main();
