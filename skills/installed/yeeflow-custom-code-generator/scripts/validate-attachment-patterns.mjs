#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const compile = process.argv.includes("--compile");
const findings = [];

const files = {
  skill: "SKILL.md",
  reference: "references/attachment-and-ai-recognition-golden-reference.md",
  uploader: "examples/attachment-sdk-pattern.tsx",
  recognition: "examples/approval-ai-recognition-pattern.tsx",
  types: "examples/runtime-types.d.ts",
};

for (const [name, relativePath] of Object.entries(files)) {
  if (!existsSync(resolve(skillRoot, relativePath))) finding("ATTACHMENT_PATTERN_FILE_MISSING", name, relativePath);
}

if (!findings.length) {
  requireText(files.skill, "references/attachment-and-ai-recognition-golden-reference.md");
  requireText(files.skill, "examples/");

  for (const text of [
    "Source-backed",
    "Persisted live-definition readback",
    "Designer evidence",
    "Browser runtime evidence",
    "Business round-trip",
    "React 15.6",
    "inputParameters()",
    "requiredFields(params)",
    "render(context",
    "{ id: '<file-id>', name: '<original-file-name>', fileSize: 12345 }",
    "files.upload",
    "files.getContent(id)",
    "Single mode writes one object",
    "readonly",
    "helperText",
    "Download all",
    "Office, archive, and unknown formats show Download only",
    "btn_vendorQuote_Recog",
    "Recognize again",
    "attrs[\"codein-script\"]",
    "attrs[\"codein-script-param\"]",
    "deleteMissing: false",
    "::brotli::",
    "API acceptance",
    "Persisted readback",
    "Form round-trip",
  ]) requireText(files.reference, text);

  for (const text of [
    "file.arrayBuffer()",
    "files.upload({ fileName: file.name, file: buffer })",
    "files.getContent(file.id)",
    "setFieldValue",
    "__variables_",
    "Attachment | Attachment[] | null",
  ]) requireText(files.uploader, text);

  for (const text of [
    "document.getElementById(id)",
    "status: 'running'",
    "status: 'completed'",
    "status: 'error'",
    "Recognize again",
    "fileSignature",
  ]) requireText(files.recognition, text);

  validateMarkdownLinks(files.skill);
  validateMarkdownLinks(files.reference);
}

if (compile && !findings.length) compileExamples();

if (findings.length) {
  console.error(JSON.stringify({ status: "failed", findings }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ status: "passed", code: "CUSTOM_CODE_ATTACHMENT_PATTERNS_VALID", checkedFiles: Object.keys(files).length, compiled: compile }, null, 2));

function read(relativePath) { return readFileSync(resolve(skillRoot, relativePath), "utf8"); }
function requireText(relativePath, expected) {
  if (!read(relativePath).includes(expected)) finding("ATTACHMENT_PATTERN_REQUIRED_TEXT_MISSING", relativePath, expected);
}
function finding(code, path, message) { findings.push({ code, path, message }); }
function validateMarkdownLinks(relativePath) {
  const content = read(relativePath);
  const links = [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const link of links) {
    if (/^(?:https?:|#|mailto:)/.test(link)) continue;
    const target = resolve(dirname(resolve(skillRoot, relativePath)), link.split("#")[0]);
    if (!existsSync(target)) finding("ATTACHMENT_PATTERN_LINK_BROKEN", relativePath, link);
  }
}
function compileExamples() {
  let repository = skillRoot;
  while (dirname(repository) !== repository && !existsSync(resolve(repository, "node_modules/typescript/bin/tsc"))) repository = dirname(repository);
  const tsc = resolve(repository, "node_modules/typescript/bin/tsc");
  if (!existsSync(tsc)) { finding("ATTACHMENT_PATTERN_TSC_MISSING", files.uploader, "node_modules/typescript/bin/tsc"); return; }
  const bundledNode = resolve(homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node");
  const node = process.env.YEEFLOW_VALIDATOR_NODE || (existsSync(bundledNode) ? bundledNode : process.execPath);
  for (const example of [files.uploader, files.recognition]) {
    const result = spawnSync(node, [tsc, "--noEmit", "--pretty", "false", "--skipLibCheck", "--noResolve", "--jsx", "react", "--target", "ES2017", "--lib", "ES2017,DOM", resolve(skillRoot, files.types), resolve(skillRoot, example)], { encoding: "utf8", timeout: 30000 });
    if (result.error && result.error.code === "ETIMEDOUT") finding("ATTACHMENT_PATTERN_TYPESCRIPT_TIMEOUT", example, "TypeScript compile exceeded 30 seconds.");
    else if (result.status !== 0) finding("ATTACHMENT_PATTERN_TYPESCRIPT_FAILED", example, (result.stdout + result.stderr).trim());
  }
}
