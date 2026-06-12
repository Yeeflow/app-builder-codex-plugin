import fs from "node:fs";
import zlib from "node:zlib";

export function readYapkWrapper(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(quoteLargeJsonIntegers(text));
}

export function decodeYapkResource(wrapper) {
  if (!wrapper || typeof wrapper !== "object") throw new Error("YAPK wrapper is not an object.");
  if (!wrapper.Resource || typeof wrapper.Resource !== "string") throw new Error("YAPK wrapper Resource is missing.");
  const decoded = zlib.brotliDecompressSync(Buffer.from(wrapper.Resource, "base64")).toString("utf8");
  return JSON.parse(quoteLargeJsonIntegers(decoded));
}

export function readDecodedYapk(file) {
  const wrapper = readYapkWrapper(file);
  return { wrapper, decoded: decodeYapkResource(wrapper) };
}

export function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function parseJsonMaybe(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(quoteLargeJsonIntegers(value));
  } catch {
    return null;
  }
}

export function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
    return;
  }
  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) walk(child, visitor, `${pointer}.${escapePointerKey(key)}`);
  }
}

export function escapePointerKey(key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

export function quoteLargeJsonIntegers(jsonText) {
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
    if ((ch === "-" || /\d/.test(ch)) && isValueStart(jsonText, i)) {
      const start = i;
      if (jsonText[i] === "-") i += 1;
      while (i < jsonText.length && /\d/.test(jsonText[i])) i += 1;
      const token = jsonText.slice(start, i);
      if (/^-?\d{16,}$/.test(token)) out += `"${token}"`;
      else out += token;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function isValueStart(text, index) {
  let i = index - 1;
  while (i >= 0 && /\s/.test(text[i])) i -= 1;
  return i < 0 || text[i] === ":" || text[i] === "[" || text[i] === ",";
}
