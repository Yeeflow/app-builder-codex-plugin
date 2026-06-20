#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VALIDATOR = path.join(ROOT, "scripts", "validate-yeeflow-root-token-usage.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-root-token-gates-"));

function validDesignSystem(extra = "") {
  return `# Application Design System

## Yeeflow Root Token Reference

- Root token reference source: docs/standards/yeeflow-root-token-reference.md
- Root token registry source: docs/standards/yeeflow-root-token-reference.normalized.json
- Selected Primary color family: --c--primary normal, --c--primary-hover hover, --c--primary-active active
- Selected Secondary color family: --c--secondary normal, --c--secondary-hover hover, --c--secondary-active active
- Selected Neutral color family: --c--neutral normal, --c--neutral-light surface, --c--neutral-light-active divider
- Status color usage rules: success uses --c--success, warning uses --c--warning, danger uses --c--danger for business state only.
- Page background token: --c--background
- Text token: --c--text
- Border/divider token: --c--neutral-light-active
- Card/surface token: --c--background
- Primary action token: normal --c--primary; hover --c--primary-hover; active --c--primary-active.
- Secondary action token: normal --c--secondary; hover --c--secondary-hover; active --c--secondary-active.
- Success/warning/danger state usage: --c--success-light, --c--warning-light, and --c--danger-light are for badges and validation states.

## Typography Scale Mapping

- Page title: --fs--h3, --lh--h3, --fw--semi-bold.
- Section title: --fs--h6, --lh--h6, --fw--semi-bold.
- Body and table text: --fs--base, --lh--base, --fw--regular.
- Caption and helper text: --fs--s, --lh--s, --fw--regular.

## Spacing Scale Mapping

- Page padding: --sp--s300.
- Section gap: --sp--s250.
- Card padding: --sp--s200.
- Form field gap: --sp--s150.
- Table row gap: --sp--s100.
- Button gap: --sp--s100.

## Border/Gap/Padding Mapping

- Border width mapping: 1 maps to --sp--s012.
- Grid/flex gap mapping: --sp--s150 and --sp--s200.
- Mobile responsive spacing: --sp--s150 page edge and --sp--s100 field gap.

## Token Customization Policy

- Primary, Secondary, Neutral, and typography choices may be customized only by preserving the same token structure.
- Arbitrary one-off color/style values are not allowed when a Yeeflow root token exists.
- App-specific custom tokens require runtime-proof-required, export-learning-required, deferred, or explicit-user-approved-custom-token.

${extra}
`;
}

function writeFixture(name, content) {
  const filePath = path.join(tempRoot, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

function runValidator(kind, filePath) {
  const result = spawnSync(process.execPath, [VALIDATOR, `--${kind}`, filePath], {
    cwd: ROOT,
    encoding: "utf8",
  });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`Validator did not emit JSON for ${filePath}.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
  return { ...result, parsed };
}

function expectPass(name, kind, content) {
  const filePath = writeFixture(`${name}.${kind === "blueprint" ? "json" : "md"}`, content);
  const result = runValidator(kind, filePath);
  assert.equal(result.status, 0, `${name} should pass: ${JSON.stringify(result.parsed.findings, null, 2)}`);
  assert.equal(result.parsed.status, "pass", `${name} result status`);
}

function expectFail(name, kind, content, expectedCode) {
  const filePath = writeFixture(`${name}.${kind === "blueprint" ? "json" : "md"}`, content);
  const result = runValidator(kind, filePath);
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.equal(result.parsed.status, "fail", `${name} result status`);
  assert.ok(
    result.parsed.findings.some((finding) => finding.code === expectedCode),
    `${name} expected ${expectedCode}, got ${JSON.stringify(result.parsed.findings, null, 2)}`,
  );
}

expectPass("complete-application-design-system", "design-system", validDesignSystem());

expectPass(
  "customized-primary-secondary-neutral-preserves-token-structure",
  "design-system",
  validDesignSystem(`
## Application Custom Token Families

- Custom Primary token structure: normal, hover, active, light, light-hover, light-active, dark, dark-hover, dark-active, darker. explicit-user-approved-custom-token.
- Custom Secondary token structure: normal, hover, active, light, light-hover, light-active, dark, dark-hover, dark-active, darker. explicit-user-approved-custom-token.
- Custom Neutral token structure: normal, hover, active, light, light-hover, light-active, dark, dark-hover, dark-active, darker. explicit-user-approved-custom-token.
`),
);

expectPass(
  "border-width-one-mapped",
  "design-system",
  validDesignSystem(`
## Border Detail

- Border width: 1 mapped through --sp--s012.
`),
);

expectFail(
  "arbitrary-hex-token-value",
  "design-system",
  validDesignSystem("- Primary action resting color: #0065FF."),
  "ROOT_TOKEN_RAW_COLOR_VALUE",
);

expectFail(
  "arbitrary-font-size-token-value",
  "design-system",
  validDesignSystem("- Page title font-size: 32px."),
  "ROOT_TOKEN_RAW_FONT_SIZE_VALUE",
);

expectFail(
  "arbitrary-font-weight-token-value",
  "design-system",
  validDesignSystem("- Section heading font-weight: 600."),
  "ROOT_TOKEN_RAW_FONT_WEIGHT_VALUE",
);

expectFail(
  "arbitrary-spacing-token-value",
  "design-system",
  validDesignSystem("- Card padding: 24px."),
  "ROOT_TOKEN_RAW_SPACING_VALUE",
);

expectFail(
  "missing-hover-active-action-states",
  "design-system",
  validDesignSystem()
    .replace("- Primary action token: normal --c--primary; hover --c--primary-hover; active --c--primary-active.\n", "")
    .replace("- Secondary action token: normal --c--secondary; hover --c--secondary-hover; active --c--secondary-active.\n", ""),
  "ROOT_TOKEN_ACTION_STATE_MAPPING_MISSING",
);

expectFail(
  "status-color-as-primary",
  "design-system",
  validDesignSystem()
    .replace("Selected Primary color family: --c--primary normal, --c--primary-hover hover, --c--primary-active active", "Selected Primary color family: --c--success"),
  "ROOT_TOKEN_STATUS_AS_PRIMARY_FORBIDDEN",
);

expectFail(
  "blueprint-drops-token-names",
  "blueprint",
  JSON.stringify(
    {
      readyForResourceGeneration: true,
      page: "Requests",
      sections: [
        {
          id: "section-1",
          style: {
            color: "#0065FF",
            fontSize: "14px",
            gap: "16px",
          },
        },
      ],
    },
    null,
    2,
  ),
  "ROOT_TOKEN_MAPPING_SECTION_MISSING",
);

expectPass(
  "custom-value-explicitly-deferred",
  "design-system",
  validDesignSystem(`
## Deferred Custom Value

- Special compliance watermark color: #123456 deferred until export learning.
- Special dense label font-size: 13px runtime-proof-required.
`),
);

console.log("Yeeflow Root Token Reference design-system gates regression tests passed.");
