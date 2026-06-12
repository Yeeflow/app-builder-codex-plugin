const YEEFLOW_TOKEN_CONTEXT_CLAIMS = ["tenantid", "tenant", "accountid"];

export function decodeJwtPayload(accessToken) {
  if (!accessToken || typeof accessToken !== "string") return null;
  const parts = accessToken.split(".");
  if (parts.length < 2 || !parts[1]) return null;
  try {
    const json = Buffer.from(base64UrlToBase64(parts[1]), "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function extractYeeflowTokenContext(accessToken) {
  const payload = decodeJwtPayload(accessToken);
  const tenantId = claimString(payload, "tenantid");
  const tenant = claimString(payload, "tenant");
  const accountId = claimString(payload, "accountid");
  const tenantUrl = normalizeTenantUrl(tenant);
  return {
    tenantId,
    tenant,
    accountId,
    tenantUrl,
    tenantHostPresent: Boolean(tenantUrl),
    hasTenantId: Boolean(tenantId),
    hasTenant: Boolean(tenant),
    hasAccountId: Boolean(accountId),
    payloadDecoded: Boolean(payload),
  };
}

export function safeTokenContextSummary(tokenRecord) {
  const context = extractYeeflowTokenContext(tokenRecord?.access_token || "");
  return {
    payloadDecoded: context.payloadDecoded,
    tenantIdClaimPresent: context.hasTenantId,
    tenantClaimPresent: context.hasTenant,
    accountIdClaimPresent: context.hasAccountId,
    tenantUrlDerived: Boolean(context.tenantUrl),
  };
}

export function resolveTenantUrlFromTokenOrEnv(tokenRecord, env = {}) {
  const context = extractYeeflowTokenContext(tokenRecord?.access_token || "");
  if (context.tenantUrl) {
    return {
      tenantUrl: context.tenantUrl,
      source: "oauth-token-claim",
      context: safeTokenContextSummary(tokenRecord),
    };
  }
  if (env.tenantUrl) {
    return {
      tenantUrl: env.tenantUrl,
      source: env.tenantUrlSource || "env",
      context: safeTokenContextSummary(tokenRecord),
    };
  }
  return {
    tenantUrl: "",
    source: "missing",
    context: safeTokenContextSummary(tokenRecord),
    message: "Tenant URL is available after OAuth login from the token tenant claim, or can be provided as optional YEEFLOW_TENANT_URL override for browser/UI links.",
  };
}

export function knownYeeflowTokenContextClaims() {
  return [...YEEFLOW_TOKEN_CONTEXT_CLAIMS];
}

function claimString(payload, name) {
  const value = payload?.[name];
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return "";
}

function normalizeTenantUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    return "";
  }
  if (url.protocol !== "https:") return "";
  if (!isSafeTenantHost(url.hostname)) return "";
  return `https://${url.hostname}`.replace(/\/+$/, "");
}

function isSafeTenantHost(hostname) {
  return /^[a-z0-9.-]+$/i.test(hostname) && hostname.includes(".") && !hostname.includes("..");
}

function base64UrlToBase64(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
}
