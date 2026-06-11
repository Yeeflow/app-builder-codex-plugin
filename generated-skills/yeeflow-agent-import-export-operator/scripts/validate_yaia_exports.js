#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const folder = process.argv[2];
const expected = process.argv[3] ? Number(process.argv[3]) : null;
if (!folder) {
  console.error("Usage: validate_yaia_exports.js <folder> [expected-count]");
  process.exit(2);
}
const files = fs.readdirSync(folder).filter(f => f.toLowerCase().endsWith(".yaia")).sort();
const results = [];
const errors = [];
for (const file of files) {
  const full = path.join(folder, file);
  const stat = fs.statSync(full);
  let parsed = null;
  try { parsed = JSON.parse(fs.readFileSync(full, "utf8")); } catch (e) { errors.push(file + ": not JSON"); }
  const ok = !!(parsed && parsed.Name && parsed.Description && parsed.PackageJson);
  if (!ok) errors.push(file + ": missing Name, Description, or PackageJson");
  results.push({ file, bytes: stat.size, name: parsed && parsed.Name, ok });
}
if (expected !== null && files.length !== expected) errors.push("expected " + expected + " .yaia files, found " + files.length);
console.log(JSON.stringify({ folder, count: files.length, results, errors }, null, 2));
process.exit(errors.length ? 1 : 0);
