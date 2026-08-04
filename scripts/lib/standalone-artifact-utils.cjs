const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const util = require("util");

const utf8Decoder = new util.TextDecoder("utf-8", { fatal: true });

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function decodeCanonicalUtf8(buffer) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError("Expected a Buffer");
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    const error = new Error("UTF-8 BOM is not allowed");
    error.code = "UTF8_BOM_NOT_ALLOWED";
    throw error;
  }
  return utf8Decoder.decode(buffer);
}

function readCanonicalJson(filePath) {
  const bytes = fs.readFileSync(filePath);
  const text = decodeCanonicalUtf8(bytes);
  const value = JSON.parse(text);
  return { bytes, text, value, canonical: Buffer.from(canonicalJson(value), "utf8") };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function atomicWriteAndReadBack(outputPath, bytes, verify) {
  const outputAbs = path.resolve(outputPath);
  const outputDir = path.dirname(outputAbs);
  fs.mkdirSync(outputDir, { recursive: true });
  const token = `${process.pid}-${crypto.randomBytes(8).toString("hex")}`;
  const tempPath = path.join(outputDir, `.${path.basename(outputAbs)}.${token}.tmp`);
  let committed = false;
  try {
    fs.writeFileSync(tempPath, bytes);
    const reread = fs.readFileSync(tempPath);
    if (!reread.equals(bytes)) {
      const error = new Error("Temporary artifact changed during byte-for-byte round trip");
      error.code = "ARTIFACT_BYTE_ROUNDTRIP_FAILED";
      throw error;
    }
    if (verify) verify(tempPath, reread);
    fs.renameSync(tempPath, outputAbs);
    committed = true;
    return { outputPath: outputAbs, bytes: reread.length, sha256: sha256(reread) };
  } finally {
    if (!committed && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

function collectStrings(value, pointer = "$", out = []) {
  if (typeof value === "string") out.push({ pointer, value });
  else if (Array.isArray(value)) value.forEach((item, index) => collectStrings(item, `${pointer}[${index}]`, out));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => collectStrings(child, `${pointer}.${key}`, out));
  return out;
}

function collectLongNumericStrings(value) {
  const found = [];
  const seen = new Set();
  for (const item of collectStrings(value)) {
    for (const match of item.value.matchAll(/\b\d{16,}\b/g)) {
      if (!seen.has(match[0])) {
        seen.add(match[0]);
        found.push({ id: match[0], pointer: item.pointer });
      }
    }
  }
  return found;
}

function findPlaceholders(value) {
  return collectStrings(value).filter(({ value }) => /^__.*(?:REQUIRED|PLACEHOLDER).*__$/.test(value));
}

module.exports = {
  atomicWriteAndReadBack,
  canonicalJson,
  collectLongNumericStrings,
  collectStrings,
  decodeCanonicalUtf8,
  findPlaceholders,
  isObject,
  readCanonicalJson,
  sha256,
};
