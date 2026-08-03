#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const candidates = [path.resolve(__dirname, "../../../../validate-ydp.js"), path.resolve(__dirname, "../../../validate-ydp.js"), path.resolve(__dirname, "../../validate-ydp.js")];
const target = candidates.find((candidate) => candidate !== __filename && fs.existsSync(candidate));
if (!target) throw new Error("validate-ydp.js is missing from the plugin payload");
require(target).main().catch((error) => { console.error(error.message); process.exit(1); });
