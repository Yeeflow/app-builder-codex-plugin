#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validator = resolve(root, "scripts/validate-phase9n-data-list-sublist-frozen-descriptor-production-routing.mjs");
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-phase9n-routing-gates-"));
try {
  assert.equal(run().status, 0);
  mutate("scripts/materialize-full-app-generated-final.mjs", (value) => value.replace("embeddedSublistDescriptorHostContext.readForRules(field)", "coreProjectDataListEmbeddedSublistDescriptor({})"), "--source", "SUBLIST_EMBEDDED_SCHEMA_DUPLICATE_SELECTION");
  mutate("scripts/materialize-full-app-generated-final.mjs", (value) => value.replace("embeddedSublistDescriptorHostContext.dispose()", "undefined"), "--source", "SUBLIST_EMBEDDED_SCHEMA_PRODUCTION_ROUTE_MISSING");
  mutate("scripts/materialize-full-app-generated-final.mjs", (value) => value.replace("const idx = cleanResourceName(row?.idx);", "const childListId = cleanResourceName(row?.idx);\n    const idx = childListId;"), "--source", "SUBLIST_CHILD_IDENTITY_OR_FALLBACK_FORBIDDEN");
  mutate("scripts/lib/data-list-sublist-frozen-descriptor-host-context.mjs", (value) => `const globalCache = new Map();\n${value}`, "--context", "SUBLIST_DESCRIPTOR_CONTEXT_LEAKAGE_OR_IDENTITY_INVALID");
  mutate("scripts/lib/data-list-sublist-frozen-descriptor-host-context.mjs", (value) => value.replace("let recordToDescriptor = new WeakMap()", "let recordToDescriptor = new Map()"), "--context", "SUBLIST_DESCRIPTOR_CONTEXT_LEAKAGE_OR_IDENTITY_INVALID");
  mutate("scripts/lib/materializer-core-adapter.mjs", (value) => value.replace("export const projectDataListEmbeddedSublistDescriptor = core.projectDataListEmbeddedSublistDescriptor;", ""), "--adapter", "SUBLIST_EMBEDDED_SCHEMA_ADAPTER_EXPORT_MISSING");
  console.log("SUBLIST_EMBEDDED_SCHEMA_FROZEN_DESCRIPTOR_PRODUCTION_ROUTE_REGRESSIONS_PASSED cases=7");
} finally { rmSync(temp, { recursive: true, force: true }); }

function run(args = []) { const result = spawnSync(process.execPath, [validator, ...args], { cwd: root, encoding: "utf8" }); return { status: result.status, output: `${result.stdout}${result.stderr}` }; }
function mutate(path, transform, option, code) { const target = resolve(temp, path.replaceAll("/", "_")); writeFileSync(target, transform(readFileSync(resolve(root, path), "utf8")), "utf8"); const result = run([option, target]); assert.notEqual(result.status, 0, code); assert.match(result.output, new RegExp(code)); }
