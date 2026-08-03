"use strict";

const crypto = require("crypto");

const CONTRACT_VERSION = "app-builder.standalone-ydp/1.1.0";
const PROFILE = "export-proven-11-field";
const COMPATIBILITY_PROFILE = "fixture-minimum";
const REQUIRED_OUTER_KEYS = Object.freeze(["AppID", "LayoutID", "LayoutView", "ListID", "Title", "Type"]);
const EXPORT_OUTER_KEYS = Object.freeze([...REQUIRED_OUTER_KEYS, "Ext1", "Ext2", "Ext3", "IsDefault", "IsItemPerm"].sort());
const LONG_ID_RE = /^[1-9]\d{15,}$/u;

class StandaloneYdpError extends Error {
  constructor(code, path, message) {
    super(`${code} at ${path}: ${message}`);
    this.name = "StandaloneYdpError";
    this.code = code;
    this.path = path;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function fail(code, path, message) {
  throw new StandaloneYdpError(code, path, message);
}

function strictJson(value, path = "value", ancestors = new Set(), sortKeys = true) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("YDP_BODY_INVALID", path, "Non-finite numbers are not JSON.");
    return value;
  }
  if (typeof value !== "object") fail("YDP_BODY_INVALID", path, `Unsupported ${typeof value} value would not round-trip.`);
  if (ancestors.has(value)) fail("YDP_BODY_INVALID", path, "Cyclic values are not JSON.");
  ancestors.add(value);
  let output;
  if (Array.isArray(value)) output = value.map((item, index) => strictJson(item, `${path}[${index}]`, ancestors, sortKeys));
  else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) fail("YDP_BODY_INVALID", path, "Only plain JSON objects are allowed.");
    output = {};
    const keys = Object.keys(value); if (sortKeys) keys.sort((left, right) => left.localeCompare(right));
    for (const key of keys) output[key] = strictJson(value[key], `${path}.${key}`, ancestors, sortKeys);
  }
  ancestors.delete(value);
  return output;
}

function stableStringify(value) {
  return JSON.stringify(strictJson(value));
}

function sha256(value) {
  return crypto.createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : stableStringify(value)).digest("hex");
}

function canonicalUtf8(bytes) {
  const buffer = Buffer.from(bytes);
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(buffer);
  } catch (error) {
    fail("YDP_UTF8_INVALID", "artifact", `YDP bytes are not valid UTF-8: ${error.message}`);
  }
  if (!Buffer.from(text, "utf8").equals(buffer)) fail("YDP_UTF8_INVALID", "artifact", "YDP bytes are not canonical UTF-8.");
  return text;
}

function longIdentity(value, path) {
  if (typeof value !== "string" || !LONG_ID_RE.test(value)) {
    fail("YDP_ID_INVALID", path, "Expected a canonical positive Long identity string with at least 16 digits.");
  }
  if (BigInt(value).toString() !== value) fail("YDP_ID_INVALID", path, "Identity must be canonical decimal text without leading zeroes.");
  return value;
}

function title(value) {
  if (typeof value !== "string" || !value || value.trim() !== value) fail("YDP_TITLE_INVALID", "outer.Title", "Title must be non-empty trimmed text.");
  return value;
}

function buildOuter({ listId, layoutId, title: pageTitle, body }) {
  if (!isObject(body)) fail("YDP_BODY_INVALID", "input.body", "Dashboard body must be an object returned by the shared Dashboard builder.");
  const normalizedBody = strictJson(body, "input.body", new Set(), false);
  return {
    AppID: 41,
    ListID: longIdentity(listId, "outer.ListID"),
    LayoutID: longIdentity(layoutId, "outer.LayoutID"),
    Type: 103,
    Title: title(pageTitle),
    Ext1: null,
    Ext2: stableStringify({ src: true }),
    Ext3: null,
    IsDefault: false,
    IsItemPerm: false,
    LayoutView: JSON.stringify(normalizedBody),
  };
}

function decode(value) {
  let raw = value;
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) raw = canonicalUtf8(value);
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); }
    catch (error) { fail("YDP_OUTER_INVALID", "artifact", `YDP artifact must be valid JSON: ${error.message}`); }
  }
  if (!isObject(raw)) fail("YDP_OUTER_INVALID", "outer", "YDP outer must be an object.");
  const missing = REQUIRED_OUTER_KEYS.filter((key) => !Object.prototype.hasOwnProperty.call(raw, key));
  if (missing.length) fail("YDP_OUTER_KEYS_INVALID", "outer", `Missing required outer keys: ${missing.join(", ")}.`);
  if (raw.AppID !== 41) fail("YDP_APP_ID_INVALID", "outer.AppID", "AppID must be numeric 41.");
  if (raw.Type !== 103) fail("YDP_TYPE_INVALID", "outer.Type", "Type must be numeric 103.");
  if (typeof raw.LayoutView !== "string") fail("YDP_LAYOUT_VIEW_INVALID", "outer.LayoutView", "LayoutView must be a JSON string.");
  let body;
  try { body = JSON.parse(raw.LayoutView); }
  catch (error) { fail("YDP_LAYOUT_VIEW_INVALID", "outer.LayoutView", `LayoutView must contain JSON: ${error.message}`); }
  if (!isObject(body)) fail("YDP_LAYOUT_VIEW_INVALID", "outer.LayoutView", "LayoutView must decode to an object.");
  const outer = {
    ...strictJson(raw, "outer", new Set(), false),
    AppID: 41,
    ListID: longIdentity(raw.ListID, "outer.ListID"),
    LayoutID: longIdentity(raw.LayoutID, "outer.LayoutID"),
    Type: 103,
    Title: title(raw.Title),
    LayoutView: raw.LayoutView,
  };
  if ("Ext1" in outer && outer.Ext1 !== null && typeof outer.Ext1 !== "string") fail("YDP_OUTER_INVALID", "outer.Ext1", "Ext1 must be a string or null.");
  if ("Ext2" in outer && typeof outer.Ext2 !== "string") fail("YDP_OUTER_INVALID", "outer.Ext2", "Ext2 must be a string.");
  if ("Ext3" in outer && outer.Ext3 !== null && typeof outer.Ext3 !== "string") fail("YDP_OUTER_INVALID", "outer.Ext3", "Ext3 must be a string or null.");
  if ("IsDefault" in outer && typeof outer.IsDefault !== "boolean") fail("YDP_OUTER_INVALID", "outer.IsDefault", "IsDefault must be boolean.");
  if ("IsItemPerm" in outer && typeof outer.IsItemPerm !== "boolean") fail("YDP_OUTER_INVALID", "outer.IsItemPerm", "IsItemPerm must be boolean.");
  const profile = ["Ext1", "Ext2", "Ext3", "IsDefault", "IsItemPerm"].every((key) => Object.prototype.hasOwnProperty.call(outer, key)) ? PROFILE : COMPATIBILITY_PROFILE;
  const known = new Set(EXPORT_OUTER_KEYS);
  return { contractVersion: CONTRACT_VERSION, context: "standalone-export", profile, outer, body: strictJson(body, "outer.LayoutView", new Set(), false), additionalMetadataKeys: Object.keys(outer).filter((key) => !known.has(key)).sort() };
}

function encode(outer) {
  const decoded = decode(outer);
  return Buffer.from(`${stableStringify(decoded.outer)}\n`, "utf8");
}

function assertRoundTrip(bytes, expectedBody = null) {
  const decoded = decode(bytes);
  const canonicalBytes = encode(decoded.outer);
  if (!canonicalBytes.equals(Buffer.from(bytes))) fail("YDP_ROUND_TRIP_MISMATCH", "artifact", "YDP bytes are not the canonical standalone export encoding.");
  if (expectedBody && stableStringify(decoded.body) !== stableStringify(expectedBody)) fail("YDP_ROUND_TRIP_MISMATCH", "outer.LayoutView", "Decoded LayoutView differs from the shared Dashboard builder body.");
  return decoded;
}

module.exports = {
  CONTRACT_VERSION,
  PROFILE,
  COMPATIBILITY_PROFILE,
  EXPORT_OUTER_KEYS,
  REQUIRED_OUTER_KEYS,
  StandaloneYdpError,
  assertRoundTrip,
  buildOuter,
  canonicalUtf8,
  decode,
  encode,
  isObject,
  longIdentity,
  sha256,
  stableStringify,
  strictJson,
};
