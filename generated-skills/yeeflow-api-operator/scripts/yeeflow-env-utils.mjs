const DEFAULT_API_BASE_URL = "https://api.yeeflow.com/v1";

export function loadDotenvFile(fs, filePath, options = {}) {
  if (!fs.existsSync(filePath)) return false;
  if (options.assertReadable) options.assertReadable(filePath);
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = parseDotenvValue(rawValue);
  }
  return true;
}

export function resolveYeeflowEnvironment(env = process.env) {
  const profile = normalizeProfile(env.YEEFLOW_PROFILE);
  const prefix = profile ? `YEEFLOW_${profile}_` : "YEEFLOW_";
  const apiKey = firstNonEmpty(profile ? env[`${prefix}API_KEY`] : null, env.YEEFLOW_API_KEY);
  const tenantUrl = normalizeOptionalUrl(
    firstNonEmpty(profile ? env[`${prefix}TENANT_URL`] : null, env.YEEFLOW_TENANT_URL),
    "YEEFLOW_TENANT_URL",
  );
  const tenantId = firstNonEmpty(profile ? env[`${prefix}TENANT_ID`] : null, env.YEEFLOW_TENANT_ID);
  const apiBaseUrl = normalizeApiBaseUrl(firstNonEmpty(env.YEEFLOW_API_BASE_URL, env.YEEFLOW_BASE_URL, DEFAULT_API_BASE_URL));
  return {
    apiBaseUrl,
    apiKey,
    profile: profile ? profile.toLowerCase() : null,
    tenantId,
    tenantUrl,
    usedLegacyBaseUrl: Boolean(!env.YEEFLOW_API_BASE_URL && env.YEEFLOW_BASE_URL),
  };
}

export function environmentPresence(resolved) {
  return {
    YEEFLOW_API_BASE_URL_PRESENT: Boolean(resolved.apiBaseUrl),
    YEEFLOW_API_KEY_PRESENT: Boolean(resolved.apiKey),
    YEEFLOW_BASE_URL_LEGACY_ALIAS_USED: Boolean(resolved.usedLegacyBaseUrl),
    YEEFLOW_PROFILE: resolved.profile || null,
    YEEFLOW_TENANT_ID_PRESENT: Boolean(resolved.tenantId),
    YEEFLOW_TENANT_URL_PRESENT: Boolean(resolved.tenantUrl),
  };
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizeProfile(value) {
  if (!value || !String(value).trim()) return "";
  const profile = String(value).trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(profile)) {
    throw new Error("YEEFLOW_PROFILE may contain only letters, numbers, and underscores.");
  }
  return profile;
}

function normalizeApiBaseUrl(value) {
  const normalized = normalizeRequiredUrl(value, "YEEFLOW_API_BASE_URL");
  const url = new URL(normalized);
  if (url.hostname !== "api.yeeflow.com" && /\.yeeflow\.com$/i.test(url.hostname)) {
    throw new Error("YEEFLOW_API_BASE_URL must be the API endpoint, not a tenant URL. Use YEEFLOW_TENANT_URL for tenant links.");
  }
  const withoutTrailingSlash = normalized.replace(/\/+$/, "");
  if (withoutTrailingSlash.endsWith("/v1")) return withoutTrailingSlash;
  if (url.hostname === "api.yeeflow.com" && url.pathname.replace(/\/+$/, "") === "") {
    return `${withoutTrailingSlash}/v1`;
  }
  return withoutTrailingSlash;
}

function normalizeOptionalUrl(value, label) {
  if (!value || !String(value).trim()) return "";
  return normalizeRequiredUrl(value, label).replace(/\/+$/, "");
}

function normalizeRequiredUrl(value, label) {
  if (!value || !String(value).trim()) throw new Error(`${label} is required.`);
  const normalized = String(value).trim().replace(/\/+$/, "");
  let url;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }
  if (url.protocol !== "https:") throw new Error(`${label} must use https.`);
  return normalized;
}
