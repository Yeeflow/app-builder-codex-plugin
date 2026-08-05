import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const fixture = (...parts) => join(root, "fixtures", "standalone-resource-tools", ...parts);
const temp = mkdtempSync(join(tmpdir(), "yeeflow-ycs-gates-"));
const output = join(temp, "valid.ycs");

const build = JSON.parse(execFileSync(process.execPath, [join(root, "build-ycs.js"), fixture("custom-service.valid.input.json"), output], { encoding: "utf8" }));
assert.match(build.status, /^pass/);
const validate = JSON.parse(execFileSync(process.execPath, [join(root, "validate-ycs.js"), output], { encoding: "utf8" }));
assert.match(validate.status, /^pass/);
const parsed = JSON.parse(readFileSync(output, "utf8"));
assert.equal(typeof parsed.DraftConfig, "string");

const negative = spawnSync(process.execPath, [join(root, "build-ycs.js"), fixture("custom-service.invalid-secret.input.json"), join(temp, "invalid.ycs")], { encoding: "utf8" });
assert.notEqual(negative.status, 0);
assert.match(negative.stdout, /YCS_HARDCODED_SECRET/);

function reject(name, mutate, expected) {
  const candidate = structuredClone(parsed);
  mutate(candidate);
  const file = join(temp, `${name}.ycs`);
  writeFileSync(file, `${JSON.stringify(candidate, null, 2)}\n`);
  const result = spawnSync(process.execPath, [join(root, "validate-ycs.js"), file], { encoding: "utf8" });
  assert.notEqual(result.status, 0, name);
  assert.match(result.stdout, expected, name);
}

reject("comment-main", (value) => { value.DraftCode = "// export async function main() {}\nconst broken = ;"; }, /YCS_(?:MAIN_EXPORT_REQUIRED|DRAFT_CODE_SYNTAX_INVALID)/);
reject("node-import", (value) => { value.DraftCode = 'import fs from "node:fs/promises";\nexport async function main() { return { summary: "x" }; }'; }, /YCS_FORBIDDEN_RUNTIME_API/);
reject("bracket-sdk", (value) => { value.DraftCode = 'export async function main({ modules }: ServiceContext) { await modules.yeeSDKClient["lists"]["deleteItems"](); return { summary: "x" }; }'; }, /YCS_SDK_METHOD_UNPROVEN/);
reject("fetch-without-connection", (value) => { value.DraftCode = 'export async function main({ modules }: ServiceContext) { await modules.fetch("https://example.com", {}); return { summary: "x" }; }'; }, /YCS_FETCH_CONNECTION_REQUIRED/);
reject("empty-outputs", (value) => { const config = JSON.parse(value.DraftConfig); config.outputs = []; value.DraftConfig = JSON.stringify(config); }, /YCS_RETURN_OUTPUT_UNDECLARED/);

console.log(JSON.stringify({ status: "pass", marker: "YCS_WRAPPER_GATES_PASSED", cases: 8 }, null, 2));
