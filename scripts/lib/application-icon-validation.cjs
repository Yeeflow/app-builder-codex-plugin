const zlib = require("zlib");

const IMAGE_URL_RE = /^(?:https?:)?\/\/|^data:image\//i;
const IMAGE_EXTENSION_RE = /\.(?:png|jpe?g|gif|webp|svg|ico)(?:[?#].*)?$/i;
const SVG_RE = /<svg\b|<\/svg>/i;
const FONT_AWESOME_CLASS_RE = /^fa-(?:solid|regular|brands|light|thin|duotone|sharp)(?:\s+fa-[a-z0-9][a-z0-9-]*)+$/i;
const COLOR_RE = /^(?:#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|hsla?\(\s*\d{1,3}(?:deg)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|var\(--[a-z0-9-]+\)|(?:black|white|transparent))$/i;

const DOMAIN_ICON_RULES = [
  {
    domain: "facility-maintenance",
    keywords: ["facility", "maintenance", "repair", "work order", "asset service"],
    allowedIconTokens: ["screwdriver-wrench", "toolbox", "wrench", "helmet-safety"],
  },
  {
    domain: "leave-calendar",
    keywords: ["leave", "vacation", "calendar", "time off", "absence"],
    allowedIconTokens: ["calendar-check", "calendar-days", "person-walking-arrow-right"],
  },
  {
    domain: "it-hardware",
    keywords: ["it", "hardware", "laptop", "device", "computer", "asset"],
    allowedIconTokens: ["laptop", "desktop", "computer", "microchip"],
  },
  {
    domain: "inventory",
    keywords: ["inventory", "warehouse", "stock", "supply", "asset", "boxes"],
    allowedIconTokens: ["boxes-stacked", "box", "warehouse", "barcode"],
  },
  {
    domain: "procurement",
    keywords: ["procurement", "purchase", "vendor", "supplier", "request for quote"],
    allowedIconTokens: ["cart-shopping", "file-invoice-dollar", "truck-field", "handshake"],
  },
  {
    domain: "customer-account",
    keywords: ["customer", "account", "crm", "renewal", "client"],
    allowedIconTokens: ["users", "address-card", "chart-line", "handshake"],
  },
  {
    domain: "document-library",
    keywords: ["document", "contract", "policy", "library", "file"],
    allowedIconTokens: ["file-lines", "folder-open", "file-contract", "book"],
  },
];

function validateApplicationIconUrl(iconUrl, options = {}) {
  const findings = [];
  if (typeof iconUrl !== "string" || !iconUrl.trim()) {
    add(findings, "APPLICATION_ICONURL_REQUIRED", "IconUrl must be a non-empty JSON string with b, i, and c.");
    return { ok: false, findings, parsed: null, domainRule: null };
  }
  const raw = iconUrl.trim();
  if (IMAGE_URL_RE.test(raw) || IMAGE_EXTENSION_RE.test(raw)) {
    add(findings, "APPLICATION_ICON_IMAGE_URL_FORBIDDEN", "IconUrl must use FontAwesome icon JSON, not an image URL.", { value: iconUrl });
    return { ok: false, findings, parsed: null, domainRule: null };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    add(findings, "APPLICATION_ICONURL_JSON_INVALID", "IconUrl must be a JSON string containing b, i, and c.", { error: error.message });
    return { ok: false, findings, parsed: null, domainRule: null };
  }
  if (!isPlainObject(parsed)) {
    add(findings, "APPLICATION_ICONURL_OBJECT_REQUIRED", "IconUrl JSON must decode to an object.");
    return { ok: false, findings, parsed: null, domainRule: null };
  }
  for (const key of ["b", "i", "c"]) {
    if (typeof parsed[key] !== "string" || !parsed[key].trim()) {
      add(findings, `APPLICATION_ICON_${key.toUpperCase()}_MISSING`, `IconUrl JSON must include non-empty ${key}.`, { path: `IconUrl.${key}` });
    }
  }
  if (typeof parsed.b === "string" && parsed.b.trim() && !COLOR_RE.test(parsed.b.trim())) {
    add(findings, "APPLICATION_ICON_BACKGROUND_COLOR_INVALID", "IconUrl.b must be a valid color value.", { value: parsed.b });
  }
  if (typeof parsed.c === "string" && parsed.c.trim() && !COLOR_RE.test(parsed.c.trim())) {
    add(findings, "APPLICATION_ICON_FOREGROUND_COLOR_INVALID", "IconUrl.c must be a valid color value.", { value: parsed.c });
  }
  if (typeof parsed.i === "string" && parsed.i.trim()) {
    const iconClass = parsed.i.trim();
    if (!/^[\x20-\x7E]+$/.test(iconClass) || SVG_RE.test(iconClass) || IMAGE_URL_RE.test(iconClass) || IMAGE_EXTENSION_RE.test(iconClass)) {
      add(findings, "APPLICATION_ICON_NON_FONTAWESOME_FORBIDDEN", "IconUrl.i must be a FontAwesome class string, not emoji, SVG, image, or URL content.", { value: parsed.i });
    } else if (!FONT_AWESOME_CLASS_RE.test(iconClass)) {
      add(findings, "APPLICATION_ICON_CLASS_INVALID", "IconUrl.i must use a FontAwesome style class plus icon class, such as fa-solid fa-screwdriver-wrench.", { value: parsed.i });
    }
  }

  const domainRule = domainRuleFor(options);
  if (domainRule && typeof parsed.i === "string" && FONT_AWESOME_CLASS_RE.test(parsed.i.trim())) {
    const normalized = parsed.i.toLowerCase();
    const matched = domainRule.allowedIconTokens.some((token) => normalized.includes(`fa-${token}`));
    if (!matched) {
      add(findings, "APPLICATION_ICON_DOMAIN_MISMATCH", "Selected FontAwesome icon should match the app business domain or include an approved rationale.", {
        domain: domainRule.domain,
        icon: parsed.i,
        allowedIconTokens: domainRule.allowedIconTokens,
      });
    }
  }

  return { ok: findings.length === 0, findings, parsed, domainRule };
}

function validatePackageWrapperIcon(wrapper, options = {}) {
  const context = {
    title: options.title ?? wrapper?.Title,
    description: options.description ?? wrapper?.Description,
    domain: options.domain,
  };
  return validateApplicationIconUrl(wrapper?.IconUrl, context);
}

function validatePackageApplicationIcons(wrapper, options = {}) {
  const context = {
    title: options.title ?? wrapper?.Title,
    description: options.description ?? wrapper?.Description,
    domain: options.domain,
  };
  const wrapperResult = validateApplicationIconUrl(wrapper?.IconUrl, context);
  const findings = wrapperResult.findings.map((finding) => ({ ...finding, surface: "wrapper.IconUrl" }));
  const decoded = decodePackageResource(wrapper?.Resource);
  const rootSurfaces = [];
  if (decoded && isPlainObject(decoded.ListSet)) {
    rootSurfaces.push(["decoded.ListSet.IconUrl", decoded.ListSet.IconUrl]);
    if (isPlainObject(decoded.ListSet.ListModel) && Object.prototype.hasOwnProperty.call(decoded.ListSet.ListModel, "IconUrl")) {
      rootSurfaces.push(["decoded.ListSet.ListModel.IconUrl", decoded.ListSet.ListModel.IconUrl]);
    }
  }

  for (const [surface, iconUrl] of rootSurfaces) {
    const result = validateApplicationIconUrl(iconUrl, context);
    for (const finding of result.findings) findings.push({ ...finding, surface });
    if (wrapperResult.ok && typeof iconUrl === "string" && iconUrl.trim() && iconUrl.trim() !== String(wrapper.IconUrl || "").trim()) {
      add(findings, "APPLICATION_ICON_ROOT_SURFACE_MISMATCH", "Root application icon surfaces must match the wrapper FontAwesome IconUrl JSON.", {
        surface,
        expected: wrapper.IconUrl,
        actual: iconUrl,
      });
    }
  }

  return {
    ok: findings.length === 0,
    findings,
    parsed: wrapperResult.parsed,
    domainRule: wrapperResult.domainRule,
    decodedRootIconSurfaces: rootSurfaces.map(([surface, iconUrl]) => ({ surface, iconUrl })),
  };
}

function decodePackageResource(resource) {
  if (typeof resource !== "string" || !resource.trim()) return null;
  const raw = resource.trim();
  try {
    if (raw.startsWith("[______gizp______]")) {
      return JSON.parse(zlib.gunzipSync(Buffer.from(raw.slice("[______gizp______]".length), "base64")).toString("utf8"));
    }
    return JSON.parse(zlib.brotliDecompressSync(Buffer.from(raw, "base64")).toString("utf8"));
  } catch {
    return null;
  }
}

function domainRuleFor(options = {}) {
  if (options.domain) return DOMAIN_ICON_RULES.find((rule) => rule.domain === options.domain) || null;
  const haystack = `${options.title || ""} ${options.description || ""}`.toLowerCase();
  return DOMAIN_ICON_RULES.find((rule) => rule.keywords.some((keyword) => haystack.includes(keyword))) || null;
}

function add(findings, code, message, detail = {}) {
  findings.push({ code, message, ...detail });
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

module.exports = {
  DOMAIN_ICON_RULES,
  validatePackageApplicationIcons,
  validateApplicationIconUrl,
  validatePackageWrapperIcon,
};
