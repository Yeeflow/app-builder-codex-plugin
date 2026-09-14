#!/usr/bin/env node
// Resolve the canonical validator in both source and installed plugin layouts.
const path = require("node:path");
const fs = require("node:fs");
const canonical = ["../../../validate-yap-package.js", "../../../../validate-yap-package.js"]
  .map(p => path.resolve(__dirname, p))
  .find(p => p !== __filename && fs.existsSync(p));
if (!canonical) throw new Error("PLUGIN_ROOT_VALIDATOR_MISSING");
require(canonical);
