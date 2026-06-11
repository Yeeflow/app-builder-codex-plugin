#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function usage() {
  console.error("Usage: node scripts/inspect-ywf-text-controls.mjs <input.ywf> <decoded-def.json> <inspection.json> <inspection.md>");
  process.exit(1);
}

const [inputPath, decodedOutPath, jsonOutPath, mdOutPath] = process.argv.slice(2);
if (!inputPath || !decodedOutPath || !jsonOutPath || !mdOutPath) usage();

function readWrapper(filePath) {
  const wrapper = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!wrapper.Def || typeof wrapper.Def !== "string") {
    throw new Error("Input .ywf must contain a base64 Def string.");
  }
  const def = JSON.parse(Buffer.from(wrapper.Def, "base64").toString("utf8"));
  return { wrapper, def };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function configValue(value) {
  return Array.isArray(value) && value.length === 2 && value[0] === null ? value[1] : value;
}

function summarizeTy(value) {
  if (Array.isArray(value)) return { shape: "config-pair", value: configValue(value) };
  if (isObject(value)) return { shape: "custom-object", value: clone(value) };
  return { shape: typeof value, value };
}

function classify(control) {
  const attrs = control.attrs || {};
  const title = attrs.headc?.title;
  const value = title?.value ?? null;
  const variable = Array.isArray(title?.variable) ? title.variable : null;
  const ty = attrs.heads?.ty;
  const color = attrs.heads?.color;
  if (attrs.heads?.ts) return "text-shadow-sample";
  if (isObject(ty)) return "custom-typography-sample";
  if (variable && attrs.headc?.link) return "dynamic-linked-text";
  if (variable) return "dynamic-expression-text";
  const token = configValue(ty);
  if (String(token).startsWith("h")) return "heading-token-text";
  if (String(token).startsWith("xs") || String(token).startsWith("s")) return "small-label-token-text";
  if (value) return "static-text";
  if (color) return "styled-token-text";
  return "text-control";
}

function collectTextControls(def) {
  const controls = [];
  function walk(node, context) {
    if (!isObject(node)) return;
    const nextContext = {
      ...context,
      parentTrail: [...context.parentTrail, {
        id: node.id || null,
        type: node.type || "formdef",
        label: node.nv_label || node.label || node.title || null,
      }].slice(-6),
    };
    if (node.type === "heading" || node.type === "text-editor") {
      const attrs = node.attrs || {};
      controls.push({
        id: node.id || null,
        type: node.type,
        label: node.label || null,
        nv_label: node.nv_label || null,
        pageTitle: context.pageTitle,
        path: context.path,
        parentTrail: context.parentTrail,
        classification: classify(node),
        textValue: attrs.headc?.title?.value ?? attrs.value ?? null,
        hasDynamicTitle: Array.isArray(attrs.headc?.title?.variable),
        hasLink: Boolean(attrs.headc?.link),
        widthType: configValue(attrs.common?.positioning?.widthtype),
        typography: summarizeTy(attrs.heads?.ty ?? attrs.ty),
        color: {
          shape: Array.isArray(attrs.heads?.color ?? attrs.color) ? "config-pair" : typeof (attrs.heads?.color ?? attrs.color),
          value: configValue(attrs.heads?.color ?? attrs.color),
        },
        textShadow: attrs.heads?.ts || null,
        attrs: clone(attrs),
      });
    }
    (node.children || []).forEach((child, index) => {
      walk(child, {
        ...nextContext,
        path: `${context.path}.children[${index}]`,
      });
    });
  }

  for (const page of def.pageurls || []) {
    walk(page.formdef, {
      pageTitle: page.title || page.name || page.id || "",
      path: "$.formdef",
      parentTrail: [],
    });
  }
  return controls;
}

function markdownReport(input, wrapper, def, controls) {
  const counts = controls.reduce((acc, control) => {
    acc[control.classification] = (acc[control.classification] || 0) + 1;
    return acc;
  }, {});
  const lines = [];
  lines.push("# Text Style Sample Text Controls Inspection");
  lines.push("");
  lines.push(`Source: \`${input}\``);
  lines.push(`Flow: \`${wrapper.FlowName}\` / \`${wrapper.FlowKey}\``);
  lines.push(`Decoded defkey: \`${def.defkey}\``);
  lines.push(`Text controls found: ${controls.length}`);
  lines.push("");
  lines.push("## Pattern Counts");
  lines.push("");
  for (const [key, value] of Object.entries(counts).sort()) {
    lines.push(`- ${key}: ${value}`);
  }
  lines.push("");
  lines.push("## Export-Backed Control Rules");
  lines.push("");
  lines.push("- The native Yeeflow Text control is exported as `type: \"heading\"` with `label: \"Text\"`.");
  lines.push("- Inline width is stored at `attrs.common.positioning.widthtype = [null, \"2\"]`.");
  lines.push("- Named typography presets are stored as config pairs such as `attrs.heads.ty = [null, \"h5-medium\"]`.");
  lines.push("- Custom typography settings are stored as an object under `attrs.heads.ty` with keys such as `fam`, `size`, `wei`, `tf`, `sty`, `dec`, `lh`, and `ls`.");
  lines.push("- Text color is stored as a plain string under `attrs.heads.color`, for example `var(--c--text)` or `#ad45c2`.");
  lines.push("- Text shadow is stored under `attrs.heads.ts` with `color`, `x`, `y`, and `blur`.");
  lines.push("- Static generated text should keep content under `attrs.headc.title.value` and use the same `heads`/`common` style shape.");
  lines.push("- Dynamic text uses `attrs.headc.title.variable[]`; links use `attrs.headc.link`.");
  lines.push("");
  lines.push("## Controls");
  lines.push("");
  lines.push("| # | Classification | Text | Typography | Color | Width | Dynamic | Link |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  controls.forEach((control, index) => {
    const text = String(control.textValue ?? "").replace(/\|/g, "\\|");
    const ty = `${control.typography.shape}:${JSON.stringify(control.typography.value)}`.replace(/\|/g, "\\|");
    const color = `${control.color.shape}:${JSON.stringify(control.color.value)}`.replace(/\|/g, "\\|");
    lines.push(`| ${index + 1} | ${control.classification} | ${text || "-"} | ${ty} | ${color} | ${control.widthType || "-"} | ${control.hasDynamicTitle ? "yes" : "no"} | ${control.hasLink ? "yes" : "no"} |`);
  });
  lines.push("");
  return `${lines.join("\n")}\n`;
}

const { wrapper, def } = readWrapper(inputPath);
const controls = collectTextControls(def);

fs.mkdirSync(path.dirname(path.resolve(decodedOutPath)), { recursive: true });
fs.writeFileSync(decodedOutPath, `${JSON.stringify(def, null, 2)}\n`, "utf8");
fs.writeFileSync(jsonOutPath, `${JSON.stringify({
  source: inputPath,
  flowName: wrapper.FlowName,
  flowKey: wrapper.FlowKey,
  workflowType: wrapper.WorkflowType,
  defkey: def.defkey,
  generatedAt: new Date().toISOString(),
  textControlCount: controls.length,
  controls,
}, null, 2)}\n`, "utf8");
fs.writeFileSync(mdOutPath, markdownReport(inputPath, wrapper, def, controls), "utf8");

console.log(JSON.stringify({
  status: "pass",
  decodedDef: decodedOutPath,
  inspectionJson: jsonOutPath,
  inspectionMarkdown: mdOutPath,
  textControlCount: controls.length,
}, null, 2));
