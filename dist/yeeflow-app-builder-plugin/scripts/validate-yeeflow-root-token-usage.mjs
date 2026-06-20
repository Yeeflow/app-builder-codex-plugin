#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_REGISTRY = path.join(ROOT, "docs", "standards", "yeeflow-root-token-reference.normalized.json");
const EXCEPTION_LABELS = [
  "runtime-proof-required",
  "export-learning-required",
  "deferred",
  "explicit-user-approved-custom-token",
];

function parseArgs(argv) {
  const args = {
    inputs: [],
    registry: DEFAULT_REGISTRY,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--registry") {
      args.registry = path.resolve(argv[++index]);
    } else if (["--input", "--design-system", "--pattern-selection", "--blueprint"].includes(arg)) {
      const inputPath = path.resolve(argv[++index]);
      const type = arg.slice(2);
      args.inputs.push({ path: inputPath, type });
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else {
      args.inputs.push({ path: path.resolve(arg), type: "input" });
    }
  }
  return args;
}

function usage() {
  return `Usage:
  node scripts/validate-yeeflow-root-token-usage.mjs --design-system application-design-system.md
  node scripts/validate-yeeflow-root-token-usage.mjs --pattern-selection pattern-selection.json
  node scripts/validate-yeeflow-root-token-usage.mjs --blueprint page-implementation-blueprint.json

Validates Yeeflow Root Token Reference usage in Application Design System, UI pattern-selection, and Page Implementation Blueprint artifacts.`;
}

function readRegistry(registryPath) {
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const tokens = registry.tokens || [];
  const byName = new Map(tokens.map((token) => [token.tokenName, token]));
  const byCategory = new Map();
  for (const token of tokens) {
    if (!byCategory.has(token.category)) {
      byCategory.set(token.category, []);
    }
    byCategory.get(token.category).push(token);
  }
  return { registry, tokens, byName, byCategory };
}

function readInput(input) {
  const raw = fs.readFileSync(input.path, "utf8");
  let parsed = null;
  if (input.path.endsWith(".json")) {
    parsed = JSON.parse(raw);
  }
  return {
    ...input,
    raw,
    parsed,
    text: parsed ? JSON.stringify(parsed, null, 2) : raw,
  };
}

function addFinding(findings, input, severity, code, message, detail = {}) {
  findings.push({
    severity,
    code,
    message,
    file: input.path,
    artifactType: input.type,
    ...detail,
  });
}

function hasException(text) {
  return EXCEPTION_LABELS.some((label) => new RegExp(`\\b${escapeRegExp(label)}\\b`, "i").test(text));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineHasToken(line, tokenPrefix) {
  return new RegExp(`${escapeRegExp(tokenPrefix)}[a-z0-9-]*`, "i").test(line);
}

function inputLines(input) {
  return input.text.split(/\r?\n/).map((line, index) => ({ line, lineNumber: index + 1 }));
}

function requirePattern(input, findings, code, message, patterns) {
  if (!patterns.some((pattern) => pattern.test(input.text))) {
    addFinding(findings, input, "error", code, message);
  }
}

function checkDesignSystemRequiredSections(input, findings) {
  const text = input.text;
  requirePattern(input, findings, "ROOT_TOKEN_SECTION_MISSING", "Missing Yeeflow Root Token Reference declaration section.", [
    /Yeeflow Root Token Reference/i,
    /Root Token/i,
  ]);
  requirePattern(input, findings, "ROOT_TOKEN_PRIMARY_SELECTION_MISSING", "Missing selected Primary color family.", [
    /selected\s+primary\s+color\s+family/i,
    /primary\s+color\s+family/i,
  ]);
  requirePattern(input, findings, "ROOT_TOKEN_SECONDARY_SELECTION_MISSING", "Missing selected Secondary color family.", [
    /selected\s+secondary\s+color\s+family/i,
    /secondary\s+color\s+family/i,
  ]);
  requirePattern(input, findings, "ROOT_TOKEN_NEUTRAL_SELECTION_MISSING", "Missing selected Neutral color family.", [
    /selected\s+neutral\s+color\s+family/i,
    /neutral\s+color\s+family/i,
  ]);
  requirePattern(input, findings, "ROOT_TOKEN_STATUS_RULES_MISSING", "Missing success/warning/danger status color usage rules.", [
    /success[\s\S]{0,240}warning[\s\S]{0,240}danger/i,
    /status\s+color\s+usage\s+rules/i,
  ]);
  requirePattern(input, findings, "ROOT_TOKEN_TYPOGRAPHY_MAPPING_MISSING", "Missing typography token mapping.", [
    /typography\s+scale\s+mapping/i,
    /--fs--[\s\S]{0,120}--lh--[\s\S]{0,120}--fw--/i,
  ]);
  requirePattern(input, findings, "ROOT_TOKEN_SPACING_MAPPING_MISSING", "Missing spacing scale mapping.", [
    /spacing\s+scale\s+mapping/i,
    /--sp--s\d+/i,
  ]);
  requirePattern(input, findings, "ROOT_TOKEN_BORDER_GAP_MAPPING_MISSING", "Missing border/gap/padding token mapping.", [
    /border[\s/,-]*gap[\s/,-]*padding\s+mapping/i,
    /border\s+width\s+mapping/i,
  ]);

  if (!/primary\s+action[\s\S]{0,240}hover[\s\S]{0,240}active/i.test(text)) {
    addFinding(findings, input, "error", "ROOT_TOKEN_ACTION_STATE_MAPPING_MISSING", "Missing primary action hover/active token mapping.");
  }
  if (!/secondary\s+action[\s\S]{0,240}hover[\s\S]{0,240}active/i.test(text)) {
    addFinding(findings, input, "error", "ROOT_TOKEN_ACTION_STATE_MAPPING_MISSING", "Missing secondary action hover/active token mapping.");
  }
  requirePattern(input, findings, "FONT_AWESOME_ICON_SOURCE_MISSING", "Missing FontAwesome icon source declaration.", [
    /icon\s+source\s*:\s*FontAwesome/i,
    /FontAwesome\s+icon/i,
  ]);
  requirePattern(input, findings, "FONT_AWESOME_ICON_STYLE_FAMILY_MISSING", "Missing preferred FontAwesome style family.", [
    /preferred\s+icon\s+style\s+family/i,
    /\bfa-(?:regular|solid)\b/i,
  ]);
  requirePattern(input, findings, "FONT_AWESOME_ICON_SIZE_RULE_MISSING", "Missing icon size rule.", [
    /icon\s+size\s+rule/i,
    /icon[\s\S]{0,80}(?:size|--fs--|--sp--)/i,
  ]);
  requirePattern(input, findings, "FONT_AWESOME_ICON_COLOR_TOKEN_RULE_MISSING", "Missing icon color token rule.", [
    /icon\s+color\s+token\s+rule/i,
    /icon[\s\S]{0,80}--c--/i,
  ]);
  requirePattern(input, findings, "FONT_AWESOME_ICON_SURFACE_USAGE_MISSING", "Missing icon usage by surface type.", [
    /navigation[\s\S]{0,260}dashboard[\s\S]{0,260}actions[\s\S]{0,260}status[\s\S]{0,260}empty\s+states[\s\S]{0,260}document[\s\S]{0,260}approval/i,
  ]);
}

function checkPatternOrBlueprintTokenSection(input, findings) {
  if (input.type === "design-system") {
    return;
  }
  if (!/(tokenIntent|tokenSet|tokenMapping|rootToken|Root Token|--c--|--fs--|--sp--)/i.test(input.text)) {
    addFinding(
      findings,
      input,
      "error",
      "ROOT_TOKEN_MAPPING_SECTION_MISSING",
      "Pattern selection or blueprint artifact must preserve root-token intent instead of raw visual values.",
    );
  }
}

function tokenValueMaps(registryContext) {
  const colors = new Map();
  const fontSizes = new Map();
  const lineHeights = new Map();
  const fontWeights = new Map();
  const spacing = new Map();
  for (const token of registryContext.tokens) {
    const value = String(token.rawValue).toLowerCase();
    if (token.category === "color" || token.tokenName.startsWith("--c--")) colors.set(value, token.tokenName);
    if (token.category === "font-size" || token.category === "typography-font-size") fontSizes.set(value, token.tokenName);
    if (token.category === "line-height" || token.category === "typography-line-height") lineHeights.set(value, token.tokenName);
    if (token.category === "font-weight" || token.category === "typography-font-weight") fontWeights.set(value, token.tokenName);
    if (token.category === "spacing") spacing.set(value.replace(/px$/, ""), token.tokenName);
  }
  return { colors, fontSizes, lineHeights, fontWeights, spacing };
}

function checkRawTokenValues(input, findings, registryContext) {
  const maps = tokenValueMaps(registryContext);
  const propertyContext = /(color|background|border|divider|surface|action|badge|chip|status|font|typography|line[-\s]?height|padding|margin|gap|spacing|width|height)/i;
  const spacingContext = /(padding|margin|gap|spacing|border\s*width|border-width|borderWidth|cardPadding|sectionGap|fieldGap|buttonGap)/i;
  const fontSizeContext = /(font\s*size|font-size|fontSize|typography|text\s*size|heading|body\s*text|label)/i;
  const fontWeightContext = /(font\s*weight|font-weight|fontWeight|weight|heading|label|button\s*text)/i;
  const lineHeightContext = /(line\s*height|line-height|lineHeight|typography)/i;

  for (const { line, lineNumber } of inputLines(input)) {
    const lowerLine = line.toLowerCase();
    if (hasException(line)) {
      continue;
    }

    for (const match of line.matchAll(/#[0-9a-f]{3,8}\b/gi)) {
      const raw = match[0].toLowerCase();
      if (maps.colors.has(raw) && !line.includes(maps.colors.get(raw))) {
        addFinding(findings, input, "error", "ROOT_TOKEN_RAW_COLOR_VALUE", `Use ${maps.colors.get(raw)} instead of raw color ${match[0]}.`, {
          lineNumber,
          value: match[0],
          tokenName: maps.colors.get(raw),
        });
      } else if (!maps.colors.has(raw) && propertyContext.test(line)) {
        addFinding(findings, input, "error", "ROOT_TOKEN_CUSTOM_VALUE_PROOF_LABEL_MISSING", `Custom color ${match[0]} requires a proof/deferred label.`, {
          lineNumber,
          value: match[0],
        });
      }
    }

    for (const match of line.matchAll(/\b(\d+(?:\.\d+)?)px\b/gi)) {
      const value = `${match[1]}px`.toLowerCase();
      const numeric = match[1];
      if (maps.fontSizes.has(value) && fontSizeContext.test(line) && !line.includes(maps.fontSizes.get(value))) {
        addFinding(findings, input, "error", "ROOT_TOKEN_RAW_FONT_SIZE_VALUE", `Use ${maps.fontSizes.get(value)} instead of raw font size ${value}.`, {
          lineNumber,
          value,
          tokenName: maps.fontSizes.get(value),
        });
      }
      if (maps.spacing.has(numeric) && spacingContext.test(line) && !line.includes(maps.spacing.get(numeric))) {
        addFinding(findings, input, "error", "ROOT_TOKEN_RAW_SPACING_VALUE", `Use ${maps.spacing.get(numeric)} instead of raw spacing ${value}.`, {
          lineNumber,
          value,
          tokenName: maps.spacing.get(numeric),
        });
      }
    }

    for (const match of line.matchAll(/\b(300|400|500|600|700)\b/g)) {
      const value = match[1];
      if (maps.fontWeights.has(value) && fontWeightContext.test(line) && !line.includes(maps.fontWeights.get(value))) {
        addFinding(findings, input, "error", "ROOT_TOKEN_RAW_FONT_WEIGHT_VALUE", `Use ${maps.fontWeights.get(value)} instead of raw font weight ${value}.`, {
          lineNumber,
          value,
          tokenName: maps.fontWeights.get(value),
        });
      }
    }

    if (lineHeightContext.test(line)) {
      for (const [value, tokenName] of maps.lineHeights.entries()) {
        if (new RegExp(`\\b${escapeRegExp(value)}\\b`, "i").test(line) && !line.includes(tokenName)) {
          addFinding(findings, input, "error", "ROOT_TOKEN_RAW_LINE_HEIGHT_VALUE", `Use ${tokenName} instead of raw line height ${value}.`, {
            lineNumber,
            value,
            tokenName,
          });
        }
      }
    }

    if (/(border\s*width|border-width|borderWidth|border:)\s*[:=]?\s*1(?:px)?\b/i.test(line) && !line.includes("--sp--s012")) {
      addFinding(findings, input, "error", "ROOT_TOKEN_BORDER_WIDTH_ONE_NOT_TOKENIZED", "Border width 1 must map to --sp--s012.", {
        lineNumber,
        value: "1",
        tokenName: "--sp--s012",
      });
    }

    const styleSegments = line.split(/[;,|]/);
    if (styleSegments.some((segment) => /\b(normal|resting|default|base)\b/i.test(segment) && /--c--[a-z]+-(?:hover|active|light-hover|light-active|dark-hover|dark-active)\b/i.test(segment))) {
      addFinding(findings, input, "error", "ROOT_TOKEN_INTERACTION_TOKEN_AS_RESTING_COLOR", "Hover/active tokens must not be used as normal resting colors.", {
        lineNumber,
      });
    }

    if (styleSegments.some((segment) => /\b(hover|active|pressed)\b/i.test(segment) && /--c--(?:primary|secondary|neutral|success|warning|danger)\b/i.test(segment) && !/--c--[a-z]+-(?:hover|active|light-hover|light-active|dark-hover|dark-active)\b/i.test(segment))) {
      addFinding(findings, input, "error", "ROOT_TOKEN_RESTING_TOKEN_AS_INTERACTION_COLOR", "Hover/active state must use matching hover/active token or include an allowed exception label.", {
        lineNumber,
      });
    }

    if (/\bselected\s+primary\s+color\s+family\b/i.test(line) && /--c--(?:success|warning|danger)\b/i.test(line) && !/business\s+reason/i.test(lowerLine)) {
      addFinding(findings, input, "error", "ROOT_TOKEN_STATUS_AS_PRIMARY_FORBIDDEN", "Success/warning/danger cannot be used as the primary app palette without an explicit business reason.", {
        lineNumber,
      });
    }
  }
}

function checkBlueprintTokenNames(input, findings) {
  if (input.type !== "blueprint") {
    return;
  }
  const hasRawStyleValue = /#[0-9a-f]{3,8}\b|\b(?:10|12|14|16|18|20|22|24|25|28|32|40|48|64|80)px\b|\bfont(?:Size|Weight)\b/i.test(input.text);
  const hasTokenName = /--(?:c|fs|lh|fw|sp)--[a-z0-9-]+/i.test(input.text);
  if (hasRawStyleValue && !hasTokenName) {
    addFinding(
      findings,
      input,
      "error",
      "ROOT_TOKEN_BLUEPRINT_TOKEN_NAME_DROPPED",
      "Blueprint keeps only raw CSS values and drops root token names.",
    );
  }
}

function isFontAwesomeClass(value) {
  return /\bfa-(?:regular|solid|light|brands|duotone|thin)\b/i.test(value) && /\bfa-[a-z0-9-]+\b/i.test(value.replace(/\bfa-(?:regular|solid|light|brands|duotone|thin)\b/i, ""));
}

function objectText(value) {
  return JSON.stringify(value);
}

function collectObjects(value, objects = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectObjects(item, objects);
  } else if (value && typeof value === "object") {
    objects.push(value);
    for (const item of Object.values(value)) collectObjects(item, objects);
  }
  return objects;
}

function getStringField(object, names) {
  for (const name of names) {
    if (typeof object[name] === "string" && object[name].trim()) {
      return object[name];
    }
  }
  return "";
}

function hasAnyField(object, names) {
  return names.some((name) => object[name] !== undefined && object[name] !== null && String(object[name]).trim() !== "");
}

function looksLikeIconObject(object) {
  const controlType = String(object.controlType || object.type || object.kind || object.yeeflowControl || "").toLowerCase();
  return controlType === "icon" || ["iconClass", "fontAwesomeClass", "faClass", "recommendedFontAwesomeClass"].some((key) => object[key]);
}

function checkIconUsage(input, findings) {
  const iconContext = /\b(icon|icon-only|fontawesome|font-awesome|badge|navigation|empty state|empty-state|document|file|approval|task action)\b/i;
  const emojiPattern = /[\p{Extended_Pictographic}]/u;

  for (const { line, lineNumber } of inputLines(input)) {
    if (hasException(line) || !iconContext.test(line)) {
      continue;
    }
    if (emojiPattern.test(line)) {
      addFinding(findings, input, "error", "FONT_AWESOME_EMOJI_ICON_FORBIDDEN", "Emoji icons must not be used as normal generated UI icons.", { lineNumber });
    }
    if (/(<svg\b|<\/svg>|\.svg\b|<img\b|image\s*icon|imageIcon|iconImage|\.png\b|\.jpg\b|\.jpeg\b)/i.test(line)) {
      addFinding(findings, input, "error", "FONT_AWESOME_INLINE_SVG_IMAGE_ICON_FORBIDDEN", "Inline SVG/image icons are forbidden unless explicitly proof-labeled.", { lineNumber });
    }
    const arbitraryIconMatch = line.match(/\b(?:iconClass|fontAwesomeClass|faClass|recommendedIcon|recommendedFontAwesomeClass|iconName)\s*[:=]\s*["'`]?([A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*)?)/i);
    if (arbitraryIconMatch && !isFontAwesomeClass(arbitraryIconMatch[1])) {
      addFinding(findings, input, "error", "FONT_AWESOME_ARBITRARY_ICON_NAME", "Icon class must look like a FontAwesome class, for example fa-regular fa-file.", {
        lineNumber,
        value: arbitraryIconMatch[1],
      });
    }
    if (/\bicon-only\s+action\b/i.test(line) && !/(semantic\s+purpose|purpose).*(label|tooltip)|(label|tooltip).*(semantic\s+purpose|purpose)/i.test(line)) {
      addFinding(findings, input, "error", "FONT_AWESOME_ICON_ONLY_ACTION_LABEL_MISSING", "Icon-only actions require semantic purpose plus label or tooltip intent.", { lineNumber });
    }
  }

  if (!input.parsed) {
    return;
  }

  for (const object of collectObjects(input.parsed)) {
    if (!looksLikeIconObject(object) || hasException(objectText(object))) {
      continue;
    }
    const className = getStringField(object, ["fontAwesomeClass", "iconClass", "faClass", "recommendedFontAwesomeClass", "className"]);
    if (!className || !isFontAwesomeClass(className)) {
      addFinding(findings, input, "error", "FONT_AWESOME_ARBITRARY_ICON_NAME", "Icon control must include a FontAwesome class such as fa-regular fa-file.", {
        controlId: object.id || object.key || object.name,
        value: className || null,
      });
    }
    if (!hasAnyField(object, ["semanticPurpose", "purpose", "nv_label", "label", "semanticLabel"])) {
      addFinding(findings, input, "error", "FONT_AWESOME_ICON_PURPOSE_MISSING", "Icon control must include semantic purpose.", {
        controlId: object.id || object.key || object.name,
      });
    }
    const color = getStringField(object, ["colorToken", "iconColorToken", "color", "styleToken"]);
    if (!/--c--[a-z0-9-]+/i.test(color)) {
      addFinding(findings, input, "error", "FONT_AWESOME_ICON_COLOR_TOKEN_MISSING", "Icon control must include a color token.", {
        controlId: object.id || object.key || object.name,
      });
    }
    const size = getStringField(object, ["sizeToken", "iconSizeToken", "size", "fontSize", "supportedSizeProperty"]);
    if (!/(--fs--[a-z0-9-]+|--sp--[a-z0-9-]+|\b(?:xs|s|base|l|h[1-6])\b|\b\d{1,2}\b)/i.test(size)) {
      addFinding(findings, input, "error", "FONT_AWESOME_ICON_SIZE_RULE_MISSING", "Icon control must include a size token or supported size property.", {
        controlId: object.id || object.key || object.name,
      });
    }
    const clickable = object.clickable === true || hasAnyField(object, ["actionBinding", "action", "actionType", "onClick"]);
    if (clickable && !hasAnyField(object, ["accessibleLabel", "tooltipIntent", "tooltip", "ariaLabel", "label", "nv_label", "semanticLabel"])) {
      addFinding(findings, input, "error", "FONT_AWESOME_ICON_ONLY_ACTION_LABEL_MISSING", "Clickable icon-only actions require label or tooltip intent.", {
        controlId: object.id || object.key || object.name,
      });
    }
  }
}

function validate(inputs, registryContext) {
  const findings = [];
  for (const input of inputs) {
    if (input.type === "design-system") {
      checkDesignSystemRequiredSections(input, findings);
    }
    checkPatternOrBlueprintTokenSection(input, findings);
    checkRawTokenValues(input, findings, registryContext);
    checkBlueprintTokenNames(input, findings);
    checkIconUsage(input, findings);
  }
  return findings;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(usage());
  process.exit(0);
}
if (args.inputs.length === 0) {
  console.error(usage());
  process.exit(2);
}

const registryContext = readRegistry(args.registry);
const inputs = args.inputs.map(readInput);
const findings = validate(inputs, registryContext);
const errorCount = findings.filter((finding) => finding.severity === "error").length;
const result = {
  validator: "validate-yeeflow-root-token-usage",
  status: errorCount === 0 ? "pass" : "fail",
  registry: args.registry,
  files: inputs.map((input) => ({ path: input.path, type: input.type })),
  findings,
};

console.log(JSON.stringify(result, null, 2));
process.exit(errorCount === 0 ? 0 : 1);
