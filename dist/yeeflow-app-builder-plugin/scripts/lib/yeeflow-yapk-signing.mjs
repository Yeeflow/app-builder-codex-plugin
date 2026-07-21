import fs from "node:fs";
import path from "node:path";

const SIGNATURE_KEYS = Object.freeze(["Sign", "sign", "Signature", "signature", "Data", "data", "Result", "result", "Value", "value"]);

export class YeeflowYapkSigningError extends Error {
  constructor(code, diagnostics = {}) {
    super(code);
    this.name = "YeeflowYapkSigningError";
    this.code = code;
    this.diagnostics = diagnostics;
  }
}

export async function signAndVerifyYapk(options = {}) {
  const inputPath = path.resolve(String(options.inputPath || ""));
  const outputPath = path.resolve(String(options.outputPath || ""));
  if (!options.inputPath) throw new YeeflowYapkSigningError("YAPK_SIGN_INPUT_REQUIRED");
  if (!options.outputPath) throw new YeeflowYapkSigningError("YAPK_SIGN_OUTPUT_REQUIRED");
  if (inputPath === outputPath) throw new YeeflowYapkSigningError("YAPK_SIGN_OUTPUT_MUST_BE_SEPARATE");
  if (!options.overwrite && fs.existsSync(outputPath)) throw new YeeflowYapkSigningError("YAPK_SIGN_OUTPUT_ALREADY_EXISTS");

  const originalBytes = fs.readFileSync(inputPath);
  const unsigned = parseWrapper(originalBytes);
  const originalResource = unsigned.Resource;
  const fetchImpl = options.fetchImpl || fetch;
  const apiBaseUrl = String(options.apiBaseUrl || "").replace(/\/+$/u, "");
  if (!apiBaseUrl) throw new YeeflowYapkSigningError("YAPK_SIGN_API_BASE_REQUIRED");
  const headers = { Accept: "application/json, text/plain", "Content-Type": "application/json", ...(options.headers || {}) };

  const setSignResult = await postSigningRequest(fetchImpl, `${apiBaseUrl}/utils/apppackage/setsign`, headers, unsigned, "setsign");
  const signature = extractSignature(setSignResult.rawText, setSignResult.parsed, setSignResult.diagnostics.responseClassification);
  if (!signature) {
    throw new YeeflowYapkSigningError("YAPK_SETSIGN_SIGNATURE_INVALID", {
      setsign: { ...setSignResult.diagnostics, signatureByteCount: signatureByteCount(candidateSignature(setSignResult.parsed, setSignResult.diagnostics.responseClassification, setSignResult.rawText)) },
    });
  }

  const signed = { ...unsigned, Sign: signature };
  if (signed.Resource !== originalResource) throw new YeeflowYapkSigningError("YAPK_SIGN_RESOURCE_CHANGED");
  const verifyResult = await postSigningRequest(fetchImpl, `${apiBaseUrl}/utils/apppackage/verifysign`, headers, signed, "verifysign");

  const temporaryOutput = `${outputPath}.tmp-${process.pid}`;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  try {
    fs.writeFileSync(temporaryOutput, `${JSON.stringify(signed, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    fs.renameSync(temporaryOutput, outputPath);
  } finally {
    fs.rmSync(temporaryOutput, { force: true });
  }

  return {
    status: "signed_and_verified",
    installAllowed: true,
    sourcePackagePreserved: Buffer.compare(originalBytes, fs.readFileSync(inputPath)) === 0,
    outputWritten: true,
    diagnostics: {
      setsign: { ...setSignResult.diagnostics, signatureByteCount: 32 },
      verifysign: { ...verifyResult.diagnostics, signatureByteCount: 0 },
    },
  };
}

export function classifySigningResponse(rawText, contentType = "") {
  const text = String(rawText ?? "");
  if (text.length === 0) return { classification: "empty", parsed: null };
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "string") return { classification: "json_string", parsed };
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return { classification: "json_object", parsed };
    return { classification: "json_other", parsed };
  } catch {
    if (isValidSignature(text.trim())) return { classification: "plain_base64", parsed: null };
    return { classification: contentType.toLowerCase().includes("json") ? "invalid_json" : "plain_text", parsed: null };
  }
}

export function extractSignature(rawText, parsed, classification) {
  const candidate = candidateSignature(parsed, classification, rawText);
  return isValidSignature(candidate) ? candidate.trim() : "";
}

export function isValidSignature(value) {
  const text = String(value ?? "").trim();
  if (!/^[A-Za-z0-9+/]+={0,2}$/u.test(text) || text.length % 4 !== 0) return false;
  try {
    const decoded = Buffer.from(text, "base64");
    return decoded.length === 32 && decoded.toString("base64") === text;
  } catch {
    return false;
  }
}

function parseWrapper(bytes) {
  let wrapper;
  try {
    wrapper = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new YeeflowYapkSigningError("YAPK_SIGN_INPUT_JSON_INVALID");
  }
  if (!wrapper || typeof wrapper !== "object" || Array.isArray(wrapper)) throw new YeeflowYapkSigningError("YAPK_SIGN_WRAPPER_INVALID");
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource) throw new YeeflowYapkSigningError("YAPK_SIGN_RESOURCE_MISSING");
  return wrapper;
}

async function postSigningRequest(fetchImpl, url, headers, body, operation) {
  let response;
  try {
    response = await fetchImpl(url, { method: "POST", headers, body: JSON.stringify(body) });
  } catch {
    throw new YeeflowYapkSigningError(`YAPK_${operation.toUpperCase()}_NETWORK_FAILED`, {
      [operation]: diagnostic({ httpStatus: 0, contentType: "", rawText: "", classification: "network_error", errorCategory: "network" }),
    });
  }
  const contentType = response.headers?.get?.("content-type") || "";
  const rawText = await response.text();
  const classified = classifySigningResponse(rawText, contentType);
  const diagnostics = diagnostic({
    httpStatus: response.status,
    contentType,
    rawText,
    classification: classified.classification,
    errorCategory: response.ok ? "none" : classifyApiError(response.status, classified.parsed),
  });
  if (!response.ok) throw new YeeflowYapkSigningError(`YAPK_${operation.toUpperCase()}_HTTP_FAILED`, { [operation]: diagnostics });
  return { rawText, parsed: classified.parsed, diagnostics };
}

function candidateSignature(parsed, classification, rawText) {
  if (classification === "plain_base64") return String(rawText || "").trim();
  if (classification === "json_string") return parsed;
  if (classification !== "json_object" || !parsed) return "";
  for (const key of SIGNATURE_KEYS) {
    if (typeof parsed[key] === "string") return parsed[key];
    if (parsed[key] && typeof parsed[key] === "object" && !Array.isArray(parsed[key])) {
      for (const nestedKey of SIGNATURE_KEYS.slice(0, 4)) {
        if (typeof parsed[key][nestedKey] === "string") return parsed[key][nestedKey];
      }
    }
  }
  return "";
}

function signatureByteCount(value) {
  const text = String(value ?? "").trim();
  if (!/^[A-Za-z0-9+/]+={0,2}$/u.test(text)) return 0;
  try { return Buffer.from(text, "base64").length; } catch { return 0; }
}

function diagnostic({ httpStatus, contentType, rawText, classification, errorCategory }) {
  return {
    httpStatus: Number(httpStatus) || 0,
    contentType: String(contentType || "").split(";", 1)[0].trim().toLowerCase(),
    rawLength: Buffer.byteLength(String(rawText ?? ""), "utf8"),
    responseClassification: classification,
    signatureByteCount: 0,
    apiErrorCategory: errorCategory,
  };
}

function classifyApiError(status, parsed) {
  if (status === 401) return "authentication";
  if (status === 403) return "authorization";
  if (status === 404) return "endpoint_not_found";
  if (status === 409) return "conflict";
  if (status === 422 || status === 400) return "request_validation";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "server";
  const apiStatus = parsed && typeof parsed === "object" ? Number(parsed.Status ?? parsed.status) : NaN;
  return Number.isFinite(apiStatus) && apiStatus !== 0 ? "api_rejected" : "http_error";
}
