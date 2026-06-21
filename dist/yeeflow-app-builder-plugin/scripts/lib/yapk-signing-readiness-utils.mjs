import fs from "node:fs";
import path from "node:path";
import { readYapkWrapper } from "./yapk-decode-utils.mjs";

const NUMERIC_RE = /^\d+$/;
const TENANT_PLACEHOLDER_RE = /^(?:0+|local-draft(?:-.+)?|localDraft|__.*__|tenant-placeholder|placeholder|mock|demo|test)$/i;

export function validateYapkSigningReadiness({
  package: packagePath,
  expectedTenantId = "",
  authMode = "",
  tenantUrl = "",
  workspaceId = "",
} = {}) {
  const findings = [];
  if (!packagePath || !fs.existsSync(packagePath)) {
    return fail("YAPK_PACKAGE_MISSING", "Package file is missing.", { package: packagePath || null });
  }

  let wrapper;
  try {
    wrapper = readYapkWrapper(packagePath);
  } catch (error) {
    return fail("YAPK_WRAPPER_READ_FAILED", `Could not read YAPK wrapper JSON: ${error.message}`);
  }

  const tenantId = wrapper?.TenantID;
  if (tenantId === undefined || tenantId === null || String(tenantId).trim() === "") {
    findings.push(error("SIGNING_TENANT_ID_MISSING", "Signing-ready generated-final YAPK wrappers must include TenantID from OAuth tenant context.", { path: "wrapper.TenantID" }));
  } else {
    const text = String(tenantId).trim();
    if (TENANT_PLACEHOLDER_RE.test(text)) {
      findings.push(error("SIGNING_TENANT_ID_PLACEHOLDER", "Signing-ready generated-final YAPK wrappers must not use TenantID 0, local-draft, or placeholder tenant metadata.", { path: "wrapper.TenantID", valueClass: classifyTenantValue(text) }));
    } else if (!NUMERIC_RE.test(text)) {
      findings.push(error("SIGNING_TENANT_ID_INVALID", "Signing-ready generated-final YAPK wrappers must use a numeric-string OAuth TenantID.", { path: "wrapper.TenantID", actualType: typeof tenantId }));
    }
    if (expectedTenantId && text !== String(expectedTenantId).trim()) {
      findings.push(error("SIGNING_TENANT_ID_CONTEXT_MISMATCH", "Wrapper TenantID must match the resolved OAuth tenant context before setsign.", {
        path: "wrapper.TenantID",
        expectedTenantId: redactId(expectedTenantId),
        actualTenantId: redactId(text),
      }));
    }
  }

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    package: summarizePackage(packagePath),
    signingReady: !findings.some((finding) => finding.level === "error"),
    tenantMetadata: {
      wrapperTenantIdPresent: tenantId !== undefined && tenantId !== null && String(tenantId).trim() !== "",
      wrapperTenantIdPreview: tenantId ? redactId(tenantId) : null,
      expectedTenantIdPreview: expectedTenantId ? redactId(expectedTenantId) : null,
      classification: "tenant-metadata-not-generated-app-content-id",
    },
    signingRequestMetadata: buildSigningRequestMetadata({ packagePath, wrapper, tenantId, authMode, tenantUrl, workspaceId }),
    findings,
    proofBoundary: "Generated-final validation is not signing readiness. Signing readiness additionally requires wrapper TenantID metadata from OAuth tenant context; wrapper TenantID is tenant metadata and is not part of the API-issued app content ID manifest.",
  };
}

export function buildSigningRequestMetadata({ packagePath, wrapper = {}, tenantId = "", authMode = "", tenantUrl = "", workspaceId = "" } = {}) {
  return {
    endpoint: "POST /utils/apppackage/setsign",
    method: "POST",
    contentType: "application/json-patch+json",
    bodyMode: "yapk-wrapper-json",
    packagePath: packagePath ? path.resolve(packagePath) : null,
    filename: packagePath ? path.basename(packagePath) : null,
    byteSize: packagePath && fs.existsSync(packagePath) ? fs.statSync(packagePath).size : null,
    tenantIdPreview: tenantId ? redactId(tenantId) : null,
    wrapperKeys: wrapper && typeof wrapper === "object" ? Object.keys(wrapper).sort() : [],
    signPresent: typeof wrapper?.Sign === "string" && wrapper.Sign.length > 0,
    authMode: authMode || "unknown",
    tenantContext: {
      tenantUrl: tenantUrl ? redactTenantUrl(tenantUrl) : null,
      workspaceIdPreview: workspaceId ? redactId(workspaceId) : null,
    },
    rawResourcePrinted: false,
    rawSignPrinted: false,
  };
}

export function parseSetSignResponse({ body, contentType = "" } = {}) {
  const text = String(body ?? "").trim();
  let parsed = null;
  if (!text) {
    return signatureParseFailure("SETSIGN_RESPONSE_EMPTY", "setsign returned an empty response.");
  }
  if (contentType.includes("application/json") || /^[\[{"]/.test(text)) {
    try {
      parsed = JSON.parse(text);
    } catch {
      return signatureParseFailure("SETSIGN_RESPONSE_JSON_INVALID", "setsign response looked like JSON but could not be parsed.");
    }
  } else {
    parsed = text;
  }

  const signature = extractSignature(parsed);
  if (!signature) {
    return signatureParseFailure("SETSIGN_RESPONSE_SIGNATURE_MISSING", "setsign response did not contain a supported signature shape.", parsed);
  }
  return {
    status: "pass",
    signature,
    report: {
      status: "pass",
      signaturePresent: true,
      signatureRedacted: redactSignature(signature),
      signatureShape: typeof parsed === "string" ? "top-level-json-string" : "object-field",
      responseKeys: parsed && typeof parsed === "object" && !Array.isArray(parsed) ? Object.keys(parsed).slice(0, 20) : [],
      rawSignaturePrinted: false,
    },
  };
}

export function redactSigningResponseReport(response = {}) {
  const parsed = parseSetSignResponse(response);
  if (parsed.status === "pass") return parsed.report;
  return parsed.report;
}

function extractSignature(parsed) {
  if (typeof parsed === "string" && parsed.trim()) return parsed.trim();
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return "";
  const candidates = [
    parsed.Sign,
    parsed.sign,
    parsed.Signature,
    parsed.signature,
    parsed.Data?.Sign,
    parsed.Data?.sign,
    parsed.Data?.Signature,
    parsed.Data?.signature,
    parsed.data?.Sign,
    parsed.data?.sign,
    parsed.data?.Signature,
    parsed.data?.signature,
  ];
  return String(candidates.find((value) => typeof value === "string" && value.trim()) || "").trim();
}

function signatureParseFailure(code, message, parsed = null) {
  return {
    status: "fail",
    signature: "",
    report: {
      status: "fail",
      signaturePresent: false,
      rawSignaturePrinted: false,
      responseKeys: parsed && typeof parsed === "object" && !Array.isArray(parsed) ? Object.keys(parsed).slice(0, 20) : [],
      findings: [error(code, message)],
    },
  };
}

function classifyTenantValue(value) {
  if (String(value) === "0" || /^0+$/.test(String(value))) return "zero";
  if (/local-draft|localDraft/i.test(String(value))) return "local-draft-placeholder";
  return "placeholder";
}

function summarizePackage(packagePath) {
  return {
    name: path.basename(packagePath),
    ext: path.extname(packagePath),
    exists: fs.existsSync(packagePath),
    byteSize: fs.existsSync(packagePath) ? fs.statSync(packagePath).size : null,
  };
}

function redactId(value) {
  const text = String(value ?? "");
  if (text.length <= 6) return "[redacted]";
  return `${text.slice(0, 3)}...${text.slice(-3)}`;
}

function redactSignature(value) {
  const text = String(value ?? "");
  if (!text) return "";
  return `[redacted-signature:${text.length}]`;
}

function redactTenantUrl(value) {
  try {
    const url = new URL(String(value));
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return "[redacted-tenant-url]";
  }
}

function fail(code, message, details = {}) {
  return { status: "fail", signingReady: false, findings: [error(code, message, details)] };
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}
