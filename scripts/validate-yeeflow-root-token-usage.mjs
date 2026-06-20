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

function validate(inputs, registryContext) {
  const findings = [];
  for (const input of inputs) {
    if (input.type === "design-system") {
      checkDesignSystemRequiredSections(input, findings);
    }
    checkPatternOrBlueprintTokenSection(input, findings);
    checkRawTokenValues(input, findings, registryContext);
    checkBlueprintTokenNames(input, findings);
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
