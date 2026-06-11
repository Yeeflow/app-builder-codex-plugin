#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i].startsWith("--")) {
    args.set(process.argv[i], process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[++i] : true);
  }
}

const base = args.get("--base") || "HEAD~1";
const archive = args.get("--archive") || "dist/yeeflow-app-builder-plugin-0.6.13.zip";
const distRoot = args.get("--dist-root") || "dist/yeeflow-app-builder-plugin";
const placeholderPattern = /^(<REDACTED_SIGN_PLACEHOLDER>|<[^>]*PLACEHOLDER[^>]*>|.*placeholder.*)$/i;
const gzipPrefix = "[______gizp______]";

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, { encoding: "utf8", ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function listTracked() {
  return run("git", ["ls-files"]).trim().split(/\n/).filter(Boolean);
}

function listChanged() {
  const result = spawnSync("git", ["diff", "--name-only", `${base}..HEAD`], { encoding: "utf8" });
  if (result.status !== 0) return new Set();
  return new Set(result.stdout.trim().split(/\n/).filter(Boolean));
}

function listArchiveFiles(zipPath) {
  if (!fs.existsSync(zipPath)) return new Set();
  return new Set(run("unzip", ["-Z1", zipPath]).trim().split(/\n/).filter(Boolean));
}

function safeJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

function roleFor(file) {
  if (file.startsWith(`${distRoot}/`)) {
    if (file.includes("/scripts/test-")) return "dist test fixture";
    if (file.includes("/docs/") || file.includes("/skills/")) return "dist docs/skill reference";
    if (file.includes("/schemas/")) return "dist schema";
    return "active dist plugin content";
  }
  if (file.startsWith("scripts/test-")) return "test fixture";
  if (file.startsWith("docs/") || file.startsWith("skills/")) return "docs/skill reference";
  if (/proof|inspection|comparison|validation/.test(file)) return "historical fixture/report artifact";
  if (file.startsWith("schemas/")) return "schema";
  return "tracked repository content";
}

function isActiveOrReleaseScoped(file, changedFiles, archiveFiles) {
  const archiveName = file.startsWith(`${distRoot}/`) ? file.replace(/^dist\/yeeflow-app-builder-plugin\//, "yeeflow-app-builder-plugin/") : "";
  return changedFiles.has(file) || file.startsWith(`${distRoot}/`) || archiveFiles.has(archiveName);
}

function walkJson(value, file, pointer, findings) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkJson(entry, file, `${pointer}/${index}`, findings));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    const current = `${pointer}/${key}`;
    if (key === "Sign" && typeof entry === "string") {
      findings.push({
        file,
        pointer: current,
        kind: placeholderPattern.test(entry) ? "placeholder Sign" : "raw Sign",
      });
    } else if (key === "Resource" && typeof entry === "string") {
      const isPlaceholder = /<.*>|\\.\\.\\./.test(entry);
      const isRaw = entry.startsWith(gzipPrefix) && !isPlaceholder;
      if (isRaw || entry.length > 1000) {
        findings.push({
          file,
          pointer: current,
          kind: isRaw ? "raw Resource" : "large Resource-like value",
        });
      }
    }
    walkJson(entry, file, current, findings);
  }
}

function classifyFinding(finding, changedFiles, archiveFiles) {
  const role = roleFor(finding.file);
  const scoped = isActiveOrReleaseScoped(finding.file, changedFiles, archiveFiles);
  const isSchema = role.includes("schema");
  const allowedPlaceholder = finding.kind === "placeholder Sign" || (isSchema && finding.kind === "raw Sign");
  const blocking = scoped && !allowedPlaceholder;
  const historicalDebt = !scoped && !allowedPlaceholder;
  return {
    ...finding,
    changed: changedFiles.has(finding.file),
    inArchive: archiveFiles.has(finding.file.replace(/^dist\/yeeflow-app-builder-plugin\//, "yeeflow-app-builder-plugin/")),
    role,
    releaseScoped: scoped,
    classification: allowedPlaceholder ? "allowed placeholder/schema key" : historicalDebt ? "historical debt" : "release blocker",
    blocking,
  };
}

const tracked = listTracked();
const changedFiles = listChanged();
const archiveFiles = listArchiveFiles(archive);
const rawFindings = [];

for (const file of tracked) {
  if (!file.endsWith(".json")) continue;
  const json = safeJson(file);
  if (json !== undefined) walkJson(json, file, "", rawFindings);
}

const findings = rawFindings.map((finding) => classifyFinding(finding, changedFiles, archiveFiles));
const blocking = findings.filter((finding) => finding.blocking);
const historicalDebt = findings.filter((finding) => finding.classification === "historical debt");
const placeholders = findings.filter((finding) => finding.classification === "allowed placeholder/schema key");

const report = {
  status: blocking.length ? "fail" : "pass",
  base,
  archive,
  counts: {
    blocking: blocking.length,
    historicalDebt: historicalDebt.length,
    allowedPlaceholders: placeholders.length,
  },
  blocking: blocking.map(({ file, kind, role, changed, inArchive, classification }) => ({ file, kind, role, changed, inArchive, classification })),
  historicalDebt: historicalDebt.map(({ file, kind, role, changed, inArchive, classification }) => ({ file, kind, role, changed, inArchive, classification })),
  allowedPlaceholders: placeholders.map(({ file, kind, role, changed, inArchive, classification }) => ({ file, kind, role, changed, inArchive, classification })),
};

console.log(JSON.stringify(report, null, 2));
process.exit(blocking.length ? 1 : 0);
