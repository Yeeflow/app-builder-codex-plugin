#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const candidates = [path.resolve(__dirname, "../../../../build-ycs.js"), path.resolve(__dirname, "../../../build-ycs.js"), path.resolve(__dirname, "../../build-ycs.js")];
const target = candidates.find((candidate) => candidate !== __filename && fs.existsSync(candidate));
if (!target) throw new Error("build-ycs.js is missing from the plugin payload");
try { require(target).main(); } catch (error) { console.log(JSON.stringify({ status: "fail", code: error.code || "YCS_BUILD_FAILED", message: error.message, report: error.report || null }, null, 2)); process.exit(1); }
