#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(process.execPath, [resolve(root, "scripts/validate-field-control-projection-audit.mjs")], { encoding: "utf8" });
if (result.status !== 0) throw new Error(result.stderr || result.stdout);
console.log("FIELD_CONTROL_PROJECTION_AUDIT_TESTS_PASSED cases=1");
