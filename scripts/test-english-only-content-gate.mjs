#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const validatorPath = join(repositoryRoot, "scripts/validate-english-only-content.mjs");
const temporaryDirectory = join(repositoryRoot, ".english-only-gate-test-temp");
const englishOnly = "English text";
const cjkText = "\u4e2d\u6587";

rmSync(temporaryDirectory, { recursive: true, force: true });
mkdirSync(temporaryDirectory, { recursive: true });

try {
  writeFileSync(join(temporaryDirectory, "english.md"), `# ${englishOnly}\n`, "utf8");
  expectPass("English source passes", ["--path", relativeTemporary("english.md")]);

  const generatedDirectory = join(temporaryDirectory, "generated-output");
  mkdirSync(generatedDirectory, { recursive: true });
  for (const [filename, content] of Object.entries({
    "artifact.ts": "export const value: string = 'English';\n",
    "artifact.yaml": "title: English\n",
    "artifact.html": "<p>English</p>\n",
    "artifact.css": ".title { color: black; }\n",
    "artifact.txt": "English report\n",
  })) writeFileSync(join(generatedDirectory, filename), content, "utf8");
  expectPass("Generated artifact directory accepts covered text formats", ["--generated-dir", relativeTemporary("generated-output")]);

  writeFileSync(join(temporaryDirectory, "chinese-markdown.md"), `# ${cjkText}\n`, "utf8");
  expectCode("Chinese Markdown fails", "ENGLISH_ONLY_CONTENT_CJK", ["--path", relativeTemporary("chinese-markdown.md")]);

  writeFileSync(join(temporaryDirectory, "chinese-comment.mjs"), `// ${cjkText}\nexport const value = 1;\n`, "utf8");
  expectCode("Chinese code comment fails", "ENGLISH_ONLY_CONTENT_CJK", ["--path", relativeTemporary("chinese-comment.mjs")]);

  writeFileSync(join(temporaryDirectory, "chinese-value.json"), JSON.stringify({ label: cjkText }), "utf8");
  expectCode("Chinese JSON value fails", "ENGLISH_ONLY_CONTENT_CJK", ["--path", relativeTemporary("chinese-value.json")]);

  const cjkFilename = `${cjkText}.md`;
  writeFileSync(join(temporaryDirectory, cjkFilename), "English content\n", "utf8");
  expectCode("Chinese filename fails", "ENGLISH_ONLY_PATH_CJK", ["--path", relativeTemporary(cjkFilename)]);

  const cjkDirectory = join(temporaryDirectory, cjkText);
  mkdirSync(cjkDirectory, { recursive: true });
  writeFileSync(join(cjkDirectory, "english.md"), "English content\n", "utf8");
  expectCode("Chinese directory name fails", "ENGLISH_ONLY_PATH_CJK", ["--path", relativeTemporary(cjkText)]);

  writeFileSync(join(temporaryDirectory, "binary-fixture.bin"), Buffer.from([0, 255, 0, 1, 2, 3]));
  expectPass("Binary fixture is ignored", ["--path", relativeTemporary("binary-fixture.bin")]);

  writeFileSync(join(temporaryDirectory, "reviewed.md"), `${cjkText}\n`, "utf8");
  writeAllowlist("narrow-allowlist.json", [{ path: relativeTemporary("reviewed.md"), reason: "Historic product label retained for evidence comparison.", reviewedBy: "Architecture review" }]);
  expectPass("Narrow reviewed allowlist works", ["--path", relativeTemporary("reviewed.md"), "--allowlist", relativeTemporary("narrow-allowlist.json")]);

  writeAllowlist("broad-allowlist.json", [{ path: ".english-only-gate-test-temp/", reason: "Invalid broad scope.", reviewedBy: "Architecture review" }]);
  expectCode("Broad allowlist is rejected", "ENGLISH_ONLY_ALLOWLIST_BROAD_PATH", ["--path", relativeTemporary("english.md"), "--allowlist", relativeTemporary("broad-allowlist.json")]);

  console.log("ENGLISH_ONLY_GATE_TESTS_PASSED 10");
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

function relativeTemporary(filename) {
  return `.english-only-gate-test-temp/${filename}`;
}

function writeAllowlist(filename, entries) {
  writeFileSync(join(temporaryDirectory, filename), JSON.stringify({ schemaVersion: "1.0.0", entries }, null, 2), "utf8");
}

function expectPass(label, argumentsList) {
  const result = run(argumentsList);
  if (result.status !== 0) throw new Error(`${label} failed: ${result.output}`);
}

function expectCode(label, code, argumentsList) {
  const result = run(argumentsList);
  if (result.status === 0 || !result.output.includes(code)) throw new Error(`${label} did not report ${code}: ${result.output}`);
}

function run(argumentsList) {
  try {
    const output = execFileSync(process.execPath, [validatorPath, ...argumentsList], { cwd: repositoryRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { status: 0, output };
  } catch (error) {
    return { status: error.status ?? 1, output: `${error.stdout || ""}${error.stderr || ""}` };
  }
}
