#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const option = process.argv.indexOf("--adapter");
const adapterPath = resolve(root, option < 0 ? "scripts/lib/markdown-planning-core-adapter.mjs" : process.argv[option + 1]);
if (!existsSync(adapterPath)) fail("CORE_COMPAT_ADAPTER_ARTIFACT_MISSING", "Core compatibility adapter is missing.");
const text = readFileSync(adapterPath, "utf8");
const forbidden = ["markdown-planning-utils.mjs", "packages/", "node_modules/", "@yeeflow/", ".ts\""];
if (forbidden.some((value) => text.includes(value))) fail("CORE_COMPAT_ADAPTER_FORBIDDEN_RESOLUTION", "Core compatibility adapter imports a forbidden Legacy, source, workspace, or node_modules path.");
if (!text.includes("core/yeeflow-app-builder-core-planning.v0.1.0.mjs")) fail("CORE_COMPAT_ADAPTER_ARTIFACT_MISSING", "Core compatibility adapter does not resolve the approved distributed artifact.");
console.log("CORE_COMPAT_ADAPTER_VALID");

function fail(code, message) { console.error(`${code}: ${message}`); process.exit(1); }
