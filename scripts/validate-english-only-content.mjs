#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const defaultAllowlistPath = "compatibility/capability-manifests/english-only-allowlist.json";
const cjkPattern = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/u;
const textExtensions = new Set([
  ".md", ".markdown", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".yaml", ".yml", ".html", ".htm", ".css", ".txt", ".log", ".report", ".csv", ".xml", ".ini", ".conf", ".env",
]);

const options = parseArguments(process.argv.slice(2));
const allowlist = loadAllowlist(options.allowlist);
const paths = collectPaths(options);
const findings = [];

for (const candidatePath of paths) {
  inspectPath(candidatePath, allowlist, findings);
}

if (findings.length > 0) {
  console.error(JSON.stringify({ status: "failed", findings }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ status: "passed", code: "ENGLISH_ONLY_VALID", checkedPathCount: paths.length }, null, 2));

function parseArguments(argumentsList) {
  const result = { paths: [], generatedDirectories: [], gitChanged: false, base: null, allowlist: defaultAllowlistPath };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--path") result.paths.push(requireValue(argumentsList, ++index, argument));
    else if (argument === "--generated-dir") result.generatedDirectories.push(requireValue(argumentsList, ++index, argument));
    else if (argument === "--git-changed") result.gitChanged = true;
    else if (argument === "--base") result.base = requireValue(argumentsList, ++index, argument);
    else if (argument === "--allowlist") result.allowlist = requireValue(argumentsList, ++index, argument);
    else if (argument === "--help") {
      console.log("Usage: node scripts/validate-english-only-content.mjs [--path <file-or-directory>] [--git-changed] [--base <git-ref>] [--generated-dir <directory>] [--allowlist <json-file>]");
      process.exit(0);
    } else fail("ENGLISH_ONLY_ARGUMENT_INVALID", `Unsupported argument: ${argument}`);
  }
  if (result.base && !result.gitChanged) fail("ENGLISH_ONLY_ARGUMENT_INVALID", "--base requires --git-changed.");
  return result;
}

function requireValue(argumentsList, index, option) {
  const value = argumentsList[index];
  if (!value || value.startsWith("--")) fail("ENGLISH_ONLY_ARGUMENT_VALUE_MISSING", `${option} requires a value.`);
  return value;
}

function loadAllowlist(allowlistInput) {
  const allowlistPath = resolveInputPath(allowlistInput);
  if (!existsSync(allowlistPath)) fail("ENGLISH_ONLY_ALLOWLIST_MISSING", "English-only allowlist file is missing.");
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(allowlistPath, "utf8"));
  } catch (error) {
    fail("ENGLISH_ONLY_ALLOWLIST_INVALID", `English-only allowlist is not valid JSON: ${error.message}`);
  }
  if (!Array.isArray(parsed.entries)) fail("ENGLISH_ONLY_ALLOWLIST_INVALID", "English-only allowlist entries must be an array.");
  const allowedPaths = new Set();
  for (const entry of parsed.entries) {
    if (!entry || typeof entry.path !== "string" || typeof entry.reason !== "string" || typeof entry.reviewedBy !== "string") {
      fail("ENGLISH_ONLY_ALLOWLIST_ENTRY_INVALID", "Every allowlist entry requires path, reason, and reviewedBy strings.");
    }
    if (!entry.reason.trim() || !entry.reviewedBy.trim()) fail("ENGLISH_ONLY_ALLOWLIST_REASON_MISSING", "Every allowlist entry requires a non-empty English reason and reviewedBy value.");
    if (cjkPattern.test(entry.reason) || cjkPattern.test(entry.reviewedBy)) fail("ENGLISH_ONLY_ALLOWLIST_INVALID", "Allowlist reason and reviewedBy must be English-only.");
    if (isAbsolute(entry.path) || entry.path.includes("..") || /[*?\[\]]/.test(entry.path) || entry.path.endsWith("/")) {
      fail("ENGLISH_ONLY_ALLOWLIST_BROAD_PATH", "Allowlist paths must be exact repository-relative file paths without globs or directory suffixes.");
    }
    const resolvedEntryPath = resolve(repositoryRoot, entry.path);
    if (!isInsideRepository(resolvedEntryPath) || (existsSync(resolvedEntryPath) && statSync(resolvedEntryPath).isDirectory())) {
      fail("ENGLISH_ONLY_ALLOWLIST_BROAD_PATH", "Allowlist paths must identify one repository file, not a directory.");
    }
    allowedPaths.add(normalizePath(resolvedEntryPath));
  }
  return allowedPaths;
}

function collectPaths(options) {
  const collected = new Set();
  for (const inputPath of options.paths) {
    const resolvedPath = resolveInputPath(inputPath);
    if (!existsSync(resolvedPath)) fail("ENGLISH_ONLY_INPUT_MISSING", `Input path is missing: ${displayPath(resolvedPath)}`);
    addPathOrDirectory(resolvedPath, collected);
  }
  for (const inputDirectory of options.generatedDirectories) addDirectory(resolveInputPath(inputDirectory), collected);
  if (options.gitChanged) {
    for (const changedPath of gitChangedPaths(options.base)) addPathOrDirectory(resolve(repositoryRoot, changedPath), collected);
  }
  if (collected.size === 0) {
    for (const changedPath of migrationOwnedChangedPaths()) addPathOrDirectory(resolve(repositoryRoot, changedPath), collected);
  }
  return [...collected].sort();
}

function migrationOwnedChangedPaths() {
  const manifestPath = resolve(repositoryRoot, "compatibility/capability-manifests/yeeflow-app-builder-capability-classification.v0.9.71.json");
  if (!existsSync(manifestPath)) fail("ENGLISH_ONLY_MANIFEST_MISSING", "Capability classification manifest is required for the default migration-owned scope.");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const ownedPaths = new Set(manifest.migrationOwnedPaths || []);
  return gitChangedPaths(null).filter((changedPath) => ownedPaths.has(changedPath));
}

function gitChangedPaths(base) {
  const argumentsList = base ? ["diff", "--name-only", "--diff-filter=ACMR", base] : ["diff", "--name-only", "--diff-filter=ACMR", "HEAD"];
  const trackedChanged = execFileSync("git", argumentsList, { cwd: repositoryRoot, encoding: "utf8" }).split("\n").filter(Boolean);
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: repositoryRoot, encoding: "utf8" }).split("\n").filter(Boolean);
  return [...new Set([...trackedChanged, ...untracked])];
}

function addPathOrDirectory(candidatePath, collected) {
  if (isProtectedDuplicate(candidatePath)) return;
  if (!existsSync(candidatePath)) return;
  if (statSync(candidatePath).isDirectory()) addDirectory(candidatePath, collected);
  else collected.add(candidatePath);
}

function addDirectory(directoryPath, collected) {
  if (!existsSync(directoryPath) || !statSync(directoryPath).isDirectory()) fail("ENGLISH_ONLY_INPUT_MISSING", `Input directory is missing: ${displayPath(directoryPath)}`);
  collected.add(directoryPath);
  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    const childPath = resolve(directoryPath, entry.name);
    if (entry.isDirectory()) addDirectory(childPath, collected);
    else if (entry.isFile()) collected.add(childPath);
  }
}

function inspectPath(candidatePath, allowlist, findings) {
  const normalized = normalizePath(candidatePath);
  if (allowlist.has(normalized)) return;
  const display = displayPath(candidatePath);
  if (cjkPattern.test(display)) findings.push(finding("ENGLISH_ONLY_PATH_CJK", display, "Path contains CJK characters."));
  if (!existsSync(candidatePath) || !statSync(candidatePath).isFile()) return;
  const buffer = readFileSync(candidatePath);
  if (!isTextFile(candidatePath, buffer)) return;
  const content = decodeUtf8(buffer);
  if (content !== null && cjkPattern.test(content)) findings.push(finding("ENGLISH_ONLY_CONTENT_CJK", display, "Text content contains CJK characters."));
}

function isTextFile(candidatePath, buffer) {
  if (buffer.includes(0)) return false;
  const decoded = decodeUtf8(buffer);
  if (decoded === null) return false;
  const extension = candidatePath.includes(".") ? candidatePath.slice(candidatePath.lastIndexOf(".")).toLowerCase() : "";
  if (textExtensions.has(extension)) return true;
  return !/[\u0000-\u0008\u000e-\u001f]/u.test(decoded);
}

function decodeUtf8(buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return null;
  }
}

function resolveInputPath(inputPath) {
  return isAbsolute(inputPath) ? resolve(inputPath) : resolve(repositoryRoot, inputPath);
}

function normalizePath(candidatePath) {
  return resolve(candidatePath);
}

function displayPath(candidatePath) {
  const pathRelativeToRoot = relative(repositoryRoot, candidatePath);
  return pathRelativeToRoot && !pathRelativeToRoot.startsWith(`..${sep}`) ? pathRelativeToRoot : candidatePath;
}

function isInsideRepository(candidatePath) {
  const pathRelativeToRoot = relative(repositoryRoot, candidatePath);
  return pathRelativeToRoot && !pathRelativeToRoot.startsWith(`..${sep}`) && pathRelativeToRoot !== "..";
}

function isProtectedDuplicate(candidatePath) {
  const repositoryRelativePath = displayPath(candidatePath).split(sep).join("/");
  return repositoryRelativePath.startsWith("dist/yeeflow-app-builder-plugin/") && / [23]\.[^/]+$/.test(repositoryRelativePath);
}

function finding(code, path, message) {
  return { code, path, message };
}

function fail(code, message) {
  console.error(JSON.stringify({ status: "failed", findings: [{ code, message }] }, null, 2));
  process.exit(1);
}
