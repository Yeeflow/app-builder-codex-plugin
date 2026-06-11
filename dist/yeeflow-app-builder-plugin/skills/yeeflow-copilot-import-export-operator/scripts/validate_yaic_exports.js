#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const folder = process.argv[2];
const expected = process.argv[3] ? Number(process.argv[3]) : null;

if (!folder) {
  console.error("Usage: validate_yaic_exports.js <folder> [expected-count]");
  process.exit(2);
}

const files = fs.readdirSync(folder).filter((f) => f.toLowerCase().endsWith(".yaic")).sort();
const results = [];
const errors = [];

for (const file of files) {
  const full = path.join(folder, file);
  const stat = fs.statSync(full);
  let parsed = null;
  try {
    parsed = JSON.parse(fs.readFileSync(full, "utf8"));
  } catch {
    errors.push(`${file}: not JSON`);
  }
  const ok = !!(parsed && parsed.Type === 1 && parsed.Name && parsed.Description && parsed.IconUrl && parsed.PackageJson);
  if (!ok) errors.push(`${file}: expected Type=1 and Name, Description, IconUrl, PackageJson`);
  results.push({
    file,
    bytes: stat.size,
    type: parsed && parsed.Type,
    name: parsed && parsed.Name,
    hasIconUrl: !!(parsed && parsed.IconUrl),
    packageJsonLength: parsed && parsed.PackageJson ? String(parsed.PackageJson).length : 0,
    ok,
  });
}

if (expected !== null && files.length !== expected) {
  errors.push(`expected ${expected} .yaic files, found ${files.length}`);
}

console.log(JSON.stringify({ folder, count: files.length, results, errors }, null, 2));
process.exit(errors.length ? 1 : 0);
