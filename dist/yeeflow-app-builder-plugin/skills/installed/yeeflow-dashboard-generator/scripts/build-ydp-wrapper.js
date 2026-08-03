#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const candidates = [path.resolve(__dirname, "../../../../build-ydp-wrapper.js"), path.resolve(__dirname, "../../../build-ydp-wrapper.js"), path.resolve(__dirname, "../../build-ydp-wrapper.js")];
const target = candidates.find((candidate) => candidate !== __filename && fs.existsSync(candidate));
if (!target) throw new Error("build-ydp-wrapper.js is missing from the plugin payload");
require(target);
