#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node decode-yap-resource.js <app.yap> --resource <resource.json> --data <app-def.json>",
    "",
    "Decodes a Yeeflow .yap wrapper while preserving large numeric IDs as strings.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, resource: null, data: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--resource") args.resource = argv[++i];
    else if (arg === "--data") args.data = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input || !args.resource || !args.data) usage();
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
    const startsNumber = ch === "-" || (ch >= "0" && ch <= "9");
    if (!startsNumber) {
      out += ch;
      i += 1;
      continue;
    }
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
  }
  return out;
}

function parseJsonPreservingLargeInts(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function main() {
  const args = parseArgs(process.argv);
  const largeNumbers = new Set();
  const wrapper = parseJsonPreservingLargeInts(fs.readFileSync(args.input, "utf8"), largeNumbers);
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input Resource must start with ${GZIP_PREFIX}`);
  }
  const compressed = Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64");
  const resourceText = zlib.gunzipSync(compressed).toString("utf8");
  const resource = parseJsonPreservingLargeInts(resourceText, largeNumbers);
  if (typeof resource.Data !== "string") throw new Error("Decoded Resource.Data is missing or not a JSON string.");
  const data = parseJsonPreservingLargeInts(resource.Data, largeNumbers);

  fs.mkdirSync(path.dirname(path.resolve(args.resource)), { recursive: true });
  fs.mkdirSync(path.dirname(path.resolve(args.data)), { recursive: true });
  fs.writeFileSync(args.resource, `${JSON.stringify(resource, null, 2)}\n`, "utf8");
  fs.writeFileSync(args.data, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    status: "pass",
    input: path.resolve(args.input),
    resource: path.resolve(args.resource),
    data: path.resolve(args.data),
    replaceIds: Array.isArray(resource.ReplaceIds) ? resource.ReplaceIds.length : 0,
    largeNumbersPreserved: largeNumbers.size,
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: [{ code: "DECODE_YAP_FAILED", message: error.message }] }, null, 2));
  process.exit(1);
}
